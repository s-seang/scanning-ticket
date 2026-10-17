import QRCode from 'qrcode';
import { downloadBlob, slugify } from './utils';

/**
 * Badge payload: `event=EVT123ABC&id=<uuid>`
 *
 * Deliberately not a URL. It stays short (so the code prints small and scans
 * from further away), it carries no personal data, and it can't be opened by a
 * phone camera as a link that leaks the guest list.
 */
export function buildPayload(eventId, attendeeId) {
  return `event=${eventId}&id=${attendeeId}`;
}

/**
 * Accepts the raw payload, or a URL that wraps it, and returns the pair.
 * Anything else comes back as null so the scanner can show "Unknown code".
 */
export function parsePayload(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  const queryPart = trimmed.includes('?') ? trimmed.slice(trimmed.indexOf('?') + 1) : trimmed;
  let params;
  try {
    params = new URLSearchParams(queryPart);
  } catch {
    return null;
  }
  const eventId = params.get('event');
  const attendeeId = params.get('id');
  if (!eventId || !attendeeId) return null;
  return { eventId, attendeeId };
}

const PNG_OPTIONS = {
  errorCorrectionLevel: 'M',
  margin: 2,
  width: 640,
  color: { dark: '#000000', light: '#ffffff' },
};

export function toDataUrl(payload, options = {}) {
  return QRCode.toDataURL(payload, { ...PNG_OPTIONS, ...options });
}

export function toCanvas(canvas, payload, options = {}) {
  return QRCode.toCanvas(canvas, payload, { ...PNG_OPTIONS, width: 240, ...options });
}

async function toPngBlob(payload, options) {
  const dataUrl = await toDataUrl(payload, options);
  const response = await fetch(dataUrl);
  return response.blob();
}

/**
 * Zips one PNG per attendee, named so they sort the way a guest list reads.
 * onProgress(done, total) drives the button's progress label.
 */
export async function downloadQrZip(event, attendees, onProgress) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const folder = zip.folder(slugify(event.name)) || zip;
  const width = String(attendees.length).length;

  for (let i = 0; i < attendees.length; i += 1) {
    const attendee = attendees[i];
    const blob = await toPngBlob(attendee.qrCode || buildPayload(event.id, attendee.id));
    const index = String(i + 1).padStart(width, '0');
    folder.file(`${index}-${slugify(attendee.name)}.png`, blob);
    onProgress?.(i + 1, attendees.length);
  }

  folder.file(
    'README.txt',
    [
      `${event.name}`,
      `Event code: ${event.id}`,
      `${attendees.length} codes generated ${new Date().toLocaleString()}`,
      '',
      'Each PNG is one attendee. Print at 3 cm or larger, or email the file to the guest.',
    ].join('\n'),
  );

  const archive = await zip.generateAsync({ type: 'blob' });
  downloadBlob(archive, `${slugify(event.name)}-qr-codes.zip`);
}

/** Opens a print-ready sheet of badges — the fastest path to a physical door. */
export async function openPrintableSheet(event, attendees) {
  const cards = await Promise.all(
    attendees.map(async (attendee) => {
      const src = await toDataUrl(attendee.qrCode || buildPayload(event.id, attendee.id), {
        width: 420,
      });
      return `<article class="badge">
        <img alt="" src="${src}" />
        <h2>${escapeHtml(attendee.name)}</h2>
        <p>${escapeHtml(attendee.email || '')}</p>
        <small>${escapeHtml(event.name)}</small>
      </article>`;
    }),
  );

  const html = `<!doctype html><html><head><meta charset="utf-8" />
    <title>${escapeHtml(event.name)} — badges</title>
    <style>
      @page { size: A4; margin: 12mm; }
      body { font: 14px/1.4 ui-sans-serif, system-ui, sans-serif; margin: 0; color: #000; }
      .sheet { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8mm; }
      .badge { border: 1px solid #ddd; border-radius: 10px; padding: 8mm 4mm; text-align: center; break-inside: avoid; }
      .badge img { width: 100%; max-width: 44mm; display: block; margin: 0 auto 4mm; }
      .badge h2 { font-size: 13pt; margin: 0 0 1mm; letter-spacing: -0.01em; }
      .badge p { margin: 0 0 3mm; color: #555; font-size: 9pt; word-break: break-all; }
      .badge small { color: #888; font-size: 8pt; }
    </style></head>
    <body><div class="sheet">${cards.join('')}</div>
    <script>window.onload = () => window.print();</script>
    </body></html>`;

  const win = window.open('', '_blank');
  if (!win) throw new Error('Allow pop-ups to print badges.');
  win.document.write(html);
  win.document.close();
}

function escapeHtml(value = '') {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
