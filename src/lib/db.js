import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getCountFromServer,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { shortId, uuid, normalizeHex } from './utils';
import { buildPayload } from './qr';

const EVENTS = 'events';
const MAX_BATCH = 400; // Firestore allows 500 ops; leave headroom.

export const eventRef = (eventId) => doc(db, EVENTS, eventId);
export const attendeesRef = (eventId) => collection(db, EVENTS, eventId, 'attendees');
export const attendeeRef = (eventId, attendeeId) => doc(db, EVENTS, eventId, 'attendees', attendeeId);

/*
 * A cut-down copy of the event that anyone holding a ticket link may read.
 * The event document itself stays private, because it carries the owner's and
 * the staff's email addresses; this mirror carries only what a guest needs to
 * see on their ticket, and it updates whenever the event is edited.
 */
export const publicEventRef = (eventId) => doc(db, EVENTS, eventId, 'public', 'info');

function publicFields(event) {
  return {
    name: event.name || '',
    date: event.date || '',
    location: event.location || '',
    logo: event.logo || '',
    brandColor: normalizeHex(event.brandColor),
    description: event.description || '',
  };
}

/* ------------------------------------------------------------------ events */

/**
 * Live list of every event this person can work: the ones they own, plus the
 * ones they were invited to scan for. Two listeners, one merged result.
 */
export function subscribeEvents(user, onChange, onError) {
  if (!user) return () => {};
  const buckets = { owned: [], crew: [] };
  const emit = () => {
    const merged = new Map();
    [...buckets.owned, ...buckets.crew].forEach((event) => merged.set(event.id, event));
    onChange([...merged.values()].sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))));
  };

  const unsubOwned = onSnapshot(
    query(collection(db, EVENTS), where('ownerId', '==', user.uid)),
    (snap) => {
      buckets.owned = snap.docs.map(fromEventDoc);
      emit();
    },
    onError,
  );

  const unsubCrew = user.email
    ? onSnapshot(
        query(collection(db, EVENTS), where('staffEmails', 'array-contains', user.email)),
        (snap) => {
          buckets.crew = snap.docs.map(fromEventDoc);
          emit();
        },
        () => {
          // A missing index or rules mismatch here shouldn't hide owned events.
          buckets.crew = [];
          emit();
        },
      )
    : () => {};

  return () => {
    unsubOwned();
    unsubCrew();
  };
}

export function subscribeEvent(eventId, onChange, onError) {
  return onSnapshot(
    eventRef(eventId),
    (snap) => onChange(snap.exists() ? fromEventDoc(snap) : null),
    onError,
  );
}

export async function getEvent(eventId) {
  const snap = await getDoc(eventRef(eventId));
  return snap.exists() ? fromEventDoc(snap) : null;
}

function fromEventDoc(snap) {
  return { id: snap.id, ...snap.data() };
}

export async function createEvent(user, input) {
  const id = `EVT${shortId(7)}`;
  const event = {
    name: input.name.trim(),
    date: input.date || '',
    location: (input.location || '').trim(),
    description: (input.description || '').trim(),
    logo: (input.logo || '').trim(),
    brandColor: normalizeHex(input.brandColor),
    ownerId: user.uid,
    ownerEmail: user.email || '',
    staff: [],
    staffEmails: (input.staffEmails || []).map((e) => e.toLowerCase().trim()).filter(Boolean),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const batch = writeBatch(db);
  batch.set(eventRef(id), event);
  batch.set(publicEventRef(id), publicFields(event));
  await batch.commit();
  return { id, ...event };
}

export async function updateEvent(eventId, patch) {
  const next = { ...patch, updatedAt: serverTimestamp() };
  if (patch.brandColor) next.brandColor = normalizeHex(patch.brandColor);
  if (patch.staffEmails) {
    next.staffEmails = patch.staffEmails.map((e) => e.toLowerCase().trim()).filter(Boolean);
  }
  await updateDoc(eventRef(eventId), next);

  // Keep the guest-facing copy in step, so a venue change reaches every ticket.
  const fresh = await getDoc(eventRef(eventId));
  if (fresh.exists()) await setDoc(publicEventRef(eventId), publicFields(fresh.data()));
}

/** Removes the attendee subcollection first — Firestore deletes are shallow. */
export async function deleteEvent(eventId) {
  let snap = await getDocs(query(attendeesRef(eventId), limit(MAX_BATCH)));
  while (!snap.empty) {
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    if (snap.size < MAX_BATCH) break;
    snap = await getDocs(query(attendeesRef(eventId), limit(MAX_BATCH)));
  }
  await deleteDoc(publicEventRef(eventId)).catch(() => {});
  await deleteDoc(eventRef(eventId));
}

/**
 * Headcount for a dashboard card without streaming the whole guest list.
 * Firestore's aggregation query bills roughly one read per 1,000 documents,
 * so a 2,000-person event costs two reads instead of two thousand.
 */
export async function fetchEventCounts(eventId) {
  const [total, checkedIn] = await Promise.all([
    getCountFromServer(query(attendeesRef(eventId))),
    getCountFromServer(query(attendeesRef(eventId), where('checkedIn', '==', true))),
  ]);
  return { total: total.data().count, checkedIn: checkedIn.data().count };
}

/* --------------------------------------------------------------- attendees */

export function subscribeAttendees(eventId, onChange, onError) {
  return onSnapshot(
    query(attendeesRef(eventId), orderBy('name')),
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError,
  );
}

function buildAttendee(eventId, row) {
  const id = uuid();
  return {
    id,
    data: {
      eventId,
      name: (row.name || '').trim() || 'Guest',
      email: (row.email || '').trim().toLowerCase(),
      ticket: (row.ticket || '').trim(),
      qrCode: buildPayload(eventId, id),
      checkedIn: false,
      checkedInAt: null,
      createdAt: serverTimestamp(),
    },
  };
}

export async function addAttendee(eventId, row) {
  const { id, data } = buildAttendee(eventId, row);
  await setDoc(attendeeRef(eventId, id), data);
  return { id, ...data };
}

/**
 * Bulk import. Rows already deduplicated by the caller; writes in chunks so a
 * 2,000-person guest list doesn't blow the batch limit.
 */
export async function addAttendees(eventId, rows, onProgress) {
  const created = [];
  for (let i = 0; i < rows.length; i += MAX_BATCH) {
    const chunk = rows.slice(i, i + MAX_BATCH);
    const batch = writeBatch(db);
    chunk.forEach((row) => {
      const { id, data } = buildAttendee(eventId, row);
      batch.set(attendeeRef(eventId, id), data);
      created.push({ id, ...data });
    });
    await batch.commit();
    onProgress?.(Math.min(i + chunk.length, rows.length), rows.length);
  }
  return created;
}

export async function updateAttendee(eventId, attendeeId, patch) {
  await updateDoc(attendeeRef(eventId, attendeeId), patch);
}

export async function deleteAttendee(eventId, attendeeId) {
  await deleteDoc(attendeeRef(eventId, attendeeId));
}

export async function undoCheckIn(eventId, attendeeId) {
  await updateDoc(attendeeRef(eventId, attendeeId), {
    checkedIn: false,
    checkedInAt: null,
    checkedInBy: null,
    checkedInDevice: null,
  });
}

/* ------------------------------------------------------------ ticket pages */

/** Reads one attendee's ticket without an account. Both ids must be known. */
export async function getTicket(eventId, attendeeId) {
  const [eventSnap, attendeeSnap] = await Promise.all([
    getDoc(publicEventRef(eventId)),
    getDoc(attendeeRef(eventId, attendeeId)),
  ]);
  if (!eventSnap.exists() || !attendeeSnap.exists()) return null;
  return {
    event: { id: eventId, ...eventSnap.data() },
    attendee: { id: attendeeSnap.id, ...attendeeSnap.data() },
  };
}

/** Records that a ticket email went out, so the list can show who still needs one. */
export async function markTicketSent(eventId, attendeeId) {
  await updateDoc(attendeeRef(eventId, attendeeId), { ticketSentAt: serverTimestamp() });
}

/* ---------------------------------------------------------------- check-in */

export const CHECK_IN = {
  SUCCESS: 'success',
  INVALID: 'invalid',
  DUPLICATE: 'duplicate',
  NOT_FOUND: 'not_found',
  WRONG_EVENT: 'wrong_event',
  ERROR: 'error',
};

/**
 * The single source of truth for admitting someone.
 *
 * Runs as a transaction so two laptops scanning the same badge at the same
 * moment can't both report success — the second one reads the fresh document
 * and comes back as a duplicate.
 *
 * @param {object}  args
 * @param {string}  args.eventId
 * @param {string}  args.attendeeId
 * @param {Date}   [args.at]      Original scan time, for queued offline scans.
 * @param {string} [args.by]      uid of the scanning account.
 * @param {string} [args.device]  Friendly device label, e.g. "Door 2".
 */
export async function checkInAttendee({ eventId, attendeeId, at, by, device }) {
  try {
    return await runTransaction(db, async (tx) => {
      const ref = attendeeRef(eventId, attendeeId);
      const snap = await tx.get(ref);

      if (!snap.exists()) return { status: CHECK_IN.NOT_FOUND };

      const attendee = { id: snap.id, ...snap.data() };
      if (attendee.eventId && attendee.eventId !== eventId) {
        return { status: CHECK_IN.WRONG_EVENT, attendee };
      }
      if (attendee.checkedIn) {
        return { status: CHECK_IN.DUPLICATE, attendee };
      }

      const checkedInAt = at || serverTimestamp();
      tx.update(ref, {
        checkedIn: true,
        checkedInAt,
        checkedInBy: by || null,
        checkedInDevice: device || null,
      });
      return {
        status: CHECK_IN.SUCCESS,
        attendee: { ...attendee, checkedIn: true, checkedInAt: at || new Date() },
      };
    });
  } catch (error) {
    return { status: CHECK_IN.ERROR, error };
  }
}
