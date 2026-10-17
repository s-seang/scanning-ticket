import { CHECK_IN, checkInAttendee } from '../lib/db';
import { parsePayload } from '../lib/qr';
import { enqueueScan, isQueued } from '../lib/offlineQueue';

/**
 * Decides what happens when a code lands in front of the camera.
 *
 * The attendee list is already streamed and cached on this device, so the
 * common rejections — wrong event, unknown badge, someone scanning twice — are
 * answered from local state in a millisecond. Only a genuine admission touches
 * the network, and if that fails the scan is queued instead of lost.
 *
 * @param {object} args
 * @param {string} args.text     Raw decoded string from the camera.
 * @param {object} args.event
 * @param {Map}    args.byId     Attendee id -> attendee, from useAttendees.
 * @param {string} [args.uid]
 * @param {string} [args.device]
 * @param {boolean} args.online
 */
export async function resolveScan({ text, event, byId, uid, device, online }) {
  const parsed = parsePayload(text);
  if (!parsed) return { status: CHECK_IN.INVALID };

  if (parsed.eventId !== event.id) {
    return { status: CHECK_IN.WRONG_EVENT };
  }

  const known = byId.get(parsed.attendeeId);
  if (!known) return { status: CHECK_IN.NOT_FOUND };

  if (known.checkedIn) {
    return { status: CHECK_IN.DUPLICATE, attendee: known };
  }

  // Already scanned on this device while offline — still a duplicate.
  if (isQueued(event.id, known.id)) {
    return { status: CHECK_IN.DUPLICATE, attendee: known, queued: true };
  }

  if (!online) {
    enqueueScan({ eventId: event.id, attendeeId: known.id, name: known.name });
    return { status: CHECK_IN.SUCCESS, attendee: { ...known, checkedInAt: new Date() }, queued: true };
  }

  const result = await checkInAttendee({
    eventId: event.id,
    attendeeId: known.id,
    by: uid,
    device,
  });

  // The connection dropped mid-transaction: hold the scan rather than turn
  // a real guest away.
  if (result.status === CHECK_IN.ERROR) {
    enqueueScan({ eventId: event.id, attendeeId: known.id, name: known.name });
    return { status: CHECK_IN.SUCCESS, attendee: { ...known, checkedInAt: new Date() }, queued: true };
  }

  return { ...result, attendee: result.attendee || known };
}
