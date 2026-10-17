import { CHECK_IN, checkInAttendee } from './db';

/*
 * Venue wifi fails. When it does, the door keeps moving: scans are stamped
 * locally, held in localStorage (survives a tab crash or a closed lid), and
 * replayed as transactions once the connection returns. The stored scan time is
 * replayed too, so the attendance export shows when the person actually walked
 * in rather than when the network came back.
 */

const KEY = 'scanflow.queue.v1';
const listeners = new Set();

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* quota — the in-memory copy still drives this session */
  }
  listeners.forEach((fn) => fn(items));
}

export function getQueue(eventId) {
  const items = read();
  return eventId ? items.filter((item) => item.eventId === eventId) : items;
}

export function subscribeQueue(listener) {
  listeners.add(listener);
  listener(read());
  return () => listeners.delete(listener);
}

/** Queue a scan. Returns false if this badge is already waiting in the queue. */
export function enqueueScan({ eventId, attendeeId, name, scannedAt }) {
  const items = read();
  if (items.some((item) => item.eventId === eventId && item.attendeeId === attendeeId)) {
    return false;
  }
  items.push({
    eventId,
    attendeeId,
    name: name || '',
    scannedAt: (scannedAt || new Date()).toISOString(),
    queuedAt: Date.now(),
  });
  write(items);
  return true;
}

export function isQueued(eventId, attendeeId) {
  return read().some((item) => item.eventId === eventId && item.attendeeId === attendeeId);
}

export function clearQueue(eventId) {
  write(eventId ? read().filter((item) => item.eventId !== eventId) : []);
}

let syncing = false;

/**
 * Replays queued scans oldest first. A scan that comes back as a duplicate or
 * an unknown id is dropped rather than retried forever; anything else (network,
 * permissions) stays queued for the next attempt.
 *
 * @returns {Promise<{synced:number, dropped:number, remaining:number}>}
 */
export async function syncQueue(context = {}) {
  if (syncing || !navigator.onLine) {
    return { synced: 0, dropped: 0, remaining: read().length };
  }
  syncing = true;
  let synced = 0;
  let dropped = 0;

  try {
    const pending = read().sort((a, b) => a.queuedAt - b.queuedAt);
    const survivors = [];

    for (const item of pending) {
      const result = await checkInAttendee({
        eventId: item.eventId,
        attendeeId: item.attendeeId,
        at: new Date(item.scannedAt),
        by: context.uid,
        device: context.device,
      });

      if (result.status === CHECK_IN.SUCCESS) synced += 1;
      else if (result.status === CHECK_IN.DUPLICATE || result.status === CHECK_IN.NOT_FOUND) dropped += 1;
      else survivors.push(item);
    }

    write(survivors);
    return { synced, dropped, remaining: survivors.length };
  } finally {
    syncing = false;
  }
}

/** Retries on reconnect and every 30s while anything is still waiting. */
export function startQueueSync(context = {}) {
  const attempt = () => {
    if (read().length) syncQueue(context);
  };
  window.addEventListener('online', attempt);
  const timer = setInterval(attempt, 30_000);
  attempt();
  return () => {
    window.removeEventListener('online', attempt);
    clearInterval(timer);
  };
}
