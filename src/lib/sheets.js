import Papa from 'papaparse';
import { downloadBlob, formatDateTime, slugify, toDate } from './utils';

const HEADER_ALIASES = {
  name: ['name', 'full name', 'fullname', 'attendee', 'attendee name', 'guest', 'first name'],
  email: ['email', 'e-mail', 'email address', 'mail'],
  ticket: ['ticket', 'ticket type', 'type', 'category', 'tier', 'table', 'role'],
};

function headerKey(raw = '') {
  const value = String(raw).trim().toLowerCase();
  const match = Object.entries(HEADER_ALIASES).find(([, aliases]) => aliases.includes(value));
  return match ? match[0] : null;
}

/** Maps an array of raw objects onto {name, email, ticket}, dropping empties. */
function normalizeRows(rawRows) {
  const rows = [];
  const skipped = [];

  rawRows.forEach((raw, index) => {
    const row = { name: '', email: '', ticket: '' };
    Object.entries(raw).forEach(([header, value]) => {
      const key = headerKey(header);
      if (key && !row[key]) row[key] = String(value ?? '').trim();
    });

    // A file with no recognisable headers still works if the first column is a name.
    if (!row.name && !row.email) {
      const first = Object.values(raw).find((v) => String(v ?? '').trim());
      if (first) row.name = String(first).trim();
    }

    if (!row.name && !row.email) {
      skipped.push({ line: index + 2, reason: 'No name or email' });
      return;
    }
    if (!row.name) row.name = row.email.split('@')[0];
    rows.push(row);
  });

  return { rows, skipped };
}

function dedupe(rows) {
  const seen = new Set();
  const unique = [];
  const duplicates = [];
  rows.forEach((row) => {
    const key = (row.email || row.name).toLowerCase();
    if (seen.has(key)) {
      duplicates.push(row);
      return;
    }
    seen.add(key);
    unique.push(row);
  });
  return { unique, duplicates };
}

/**
 * Reads .csv, .tsv, .xlsx or .xls into attendee rows.
 * Resolves with { rows, skipped, duplicates } — never throws on a messy file.
 */
export async function parseAttendeeFile(file) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const rawRows =
    extension === 'xlsx' || extension === 'xls' ? await readSpreadsheet(file) : await readDelimited(file);

  const { rows, skipped } = normalizeRows(rawRows);
  const { unique, duplicates } = dedupe(rows);
  return { rows: unique, skipped, duplicates };
}

function readDelimited(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
      complete: (result) => resolve(result.data),
      error: reject,
    });
  });
}

async function readSpreadsheet(file) {
  // ~400 kB of parser. Loaded on demand so the door laptop never pays for it.
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

/* ------------------------------------------------------------------ export */

function csvCell(value = '') {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function attendanceToCsv(event, attendees) {
  const header = ['Name', 'Email', 'Ticket', 'Status', 'Checked in at', 'Device', 'Attendee ID'];
  const lines = attendees.map((a) =>
    [
      a.name,
      a.email,
      a.ticket,
      a.checkedIn ? 'Checked in' : 'Not checked in',
      a.checkedIn ? formatDateTime(a.checkedInAt) : '',
      a.checkedInDevice || '',
      a.id,
    ]
      .map(csvCell)
      .join(','),
  );
  return [header.join(','), ...lines].join('\r\n');
}

export function downloadAttendanceCsv(event, attendees) {
  const csv = attendanceToCsv(event, attendees);
  const stamp = toDate(new Date()).toISOString().slice(0, 10);
  // BOM so Excel opens accented and non-Latin names correctly.
  downloadBlob(
    new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }),
    `${slugify(event.name)}-attendance-${stamp}.csv`,
  );
}

export function downloadSampleCsv() {
  const csv = [
    'name,email,ticket',
    'Sopheak Chan,sopheak@example.com,General',
    'Dara Kim,dara@example.com,VIP',
    'Alex Rivera,alex@example.com,Speaker',
  ].join('\r\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'scanflow-attendees-sample.csv');
}
