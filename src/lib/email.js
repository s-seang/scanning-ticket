import emailjs from '@emailjs/browser';
import { formatEventDate } from './utils';

/*
 * Sending mail from a browser needs a third party, because a browser has no
 * mail server. EmailJS does it without a backend or a credit card; the trade is
 * that the public key ships in the bundle, so treat the quota as spendable by
 * anyone who looks. For a commercial launch this moves server-side — see the
 * README — and only this file changes.
 */

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export const isEmailConfigured = Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

/** The attendee's own ticket page. Absolute, because it goes in an email. */
export function buildTicketUrl(eventId, attendeeId) {
  return `${window.location.origin}/t/${eventId}/${attendeeId}`;
}

/**
 * A hosted PNG of the same code, for templates that want the QR visible in the
 * message body. Optional — the link is what people should rely on, since mail
 * clients block remote images by default.
 */
export function buildQrImageUrl(payload) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=12&data=${encodeURIComponent(payload)}`;
}

export class EmailNotConfigured extends Error {
  constructor() {
    super('Email is not set up. Add your EmailJS keys to .env.');
    this.name = 'EmailNotConfigured';
  }
}

/**
 * Sends one attendee their ticket.
 * Throws on failure so callers can report it rather than silently losing a guest.
 */
export async function sendTicketEmail({ event, attendee }) {
  if (!isEmailConfigured) throw new EmailNotConfigured();
  if (!attendee.email) throw new Error(`${attendee.name} has no email address.`);

  const params = {
    to_email: attendee.email,
    to_name: attendee.name,
    event_name: event.name,
    event_date: formatEventDate(event.date),
    event_location: event.location || '',
    event_description: event.description || '',
    ticket_url: buildTicketUrl(event.id, attendee.id),
    qr_image_url: buildQrImageUrl(attendee.qrCode),
    ticket_type: attendee.ticket || '',
  };

  await emailjs.send(SERVICE_ID, TEMPLATE_ID, params, { publicKey: PUBLIC_KEY });
  return params.ticket_url;
}

/**
 * Sends to many, one at a time with a short gap — EmailJS rate-limits bursts,
 * and a 200-person list fired in parallel gets throttled halfway through.
 * Never throws: it reports per-recipient so one bad address can't stop the run.
 */
export async function sendTicketEmails({ event, attendees, onProgress, gapMs = 350 }) {
  const sent = [];
  const failed = [];

  for (let i = 0; i < attendees.length; i += 1) {
    const attendee = attendees[i];
    try {
      await sendTicketEmail({ event, attendee });
      sent.push(attendee);
    } catch (error) {
      failed.push({ attendee, reason: error?.text || error?.message || 'Unknown error' });
    }
    onProgress?.(i + 1, attendees.length);
    if (i < attendees.length - 1) await new Promise((resolve) => setTimeout(resolve, gapMs));
  }

  return { sent, failed };
}
