/** Join conditional class names. */
export function cn(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(' ');
}

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHexColor(value) {
  return typeof value === 'string' && HEX.test(value.trim());
}

export function normalizeHex(value, fallback = '#1b6ef3') {
  if (!isHexColor(value)) return fallback;
  let hex = value.trim().replace('#', '');
  if (hex.length === 3)
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  return `#${hex.toLowerCase()}`;
}

/** "#1b6ef3" -> "27 110 243", the form Tailwind's <alpha-value> colors expect. */
export function hexToRgbTriplet(value) {
  const hex = normalizeHex(value).slice(1);
  const int = parseInt(hex, 16);
  return `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`;
}

/** Pick black or white text for a given background, using relative luminance. */
export function readableInk(background) {
  const [r, g, b] = hexToRgbTriplet(background).split(' ').map(Number);
  const channel = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  return luminance > 0.55 ? '#000000' : '#ffffff';
}

export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase();
}

export function slugify(value = '') {
  return (
    value
      .toString()
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase() || 'untitled'
  );
}

/** Firestore Timestamp | Date | ISO string | millis -> Date | null */
export function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatTime(value) {
  const date = toDate(value);
  if (!date) return '—';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatDateTime(value) {
  const date = toDate(value);
  if (!date) return '—';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatEventDate(value) {
  if (!value) return 'Date to be set';
  const date = toDate(value);
  if (!date) return 'Date to be set';
  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give Safari a beat before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Crockford-ish id: short, unambiguous, safe inside a QR payload. */
export function shortId(length = 8) {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

export function uuid() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function debounce(fn, wait = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}
