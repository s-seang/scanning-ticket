# ScanFlow

A reusable QR check-in platform. One scanner, unlimited events: create an event,
upload the guest list, hand out codes, then point a laptop webcam at the door.

React + Vite · Tailwind · Firebase Auth · Firestore · Firebase Hosting ·
html5-qrcode · qrcode

---

## Run it

```bash
npm install
cp .env.example .env     # paste your Firebase web config
npm run dev              # http://localhost:5173
```

The camera needs a secure context. `localhost` counts, so the dev server works
as is. To scan from a phone on the same wifi, tunnel it:
`npx localtunnel --port 5173`.

### Firebase setup (about five minutes)

1. Create a project at console.firebase.google.com.
2. **Authentication → Sign-in method**: enable Email/Password and Google.
3. **Firestore Database**: create in production mode, pick a region near your venue.
4. **Project settings → Your apps → Web**: copy the config values into `.env`.
5. Push the security rules and indexes:

```bash
npm i -g firebase-tools
firebase login
cp .firebaserc.example .firebaserc   # set your project id
firebase deploy --only firestore
```

### Deploy

```bash
npm run deploy      # vite build + firebase deploy
```

---

## How it works

### Data

```
events/{eventId}                    id is a readable code, e.g. EVTK3M9P2Q
  name, date, location, logo, brandColor
  ownerId, ownerEmail, staffEmails[]      ← who may scan
  createdAt, updatedAt

events/{eventId}/attendees/{uuid}
  eventId, name, email, ticket
  qrCode                                   ← "event=EVT…&id=<uuid>"
  checkedIn, checkedInAt, checkedInBy, checkedInDevice
```

Attendees live under their event, so deleting an event removes its guest list,
one event's codes can never open another, and security rules are a single
parent lookup.

### The badge payload

```
event=EVTK3M9P2Q&id=8f1c…-uuid
```

Deliberately not a URL: it stays short so the printed code scans from further
away, it carries no personal data, and a stranger's phone camera can't turn it
into a link.

### What happens on a scan

`src/services/checkin.js` is the whole decision:

1. Parse the payload. Unreadable → *Unknown code*.
2. Wrong event id → *Wrong event*. (Rejected locally, instantly.)
3. Not in the cached guest list → *Code not on the list*.
4. Already checked in → *Already checked in*, with the original arrival time.
5. Otherwise a Firestore **transaction** flips `checkedIn` and stamps the time.

The guest list is already streamed to the device, so four of those five answers
never touch the network. Only a real admission does.

**Duplicate prevention** is the transaction: two laptops scanning the same badge
in the same second both read the document inside the transaction, and the second
one loses and reports a duplicate. No last-write-wins.

**Offline** (`src/lib/offlineQueue.js`): when the connection drops — or a
transaction fails mid-scan — the scan is stamped locally and stored in
`localStorage`, which survives a closed lid or a crashed tab. The queue replays
on reconnect and every 30s, preserving the original arrival time, so the export
shows when the guest actually walked in. Duplicates are caught against the queue
too, so nobody gets in twice while offline.

### The camera

`src/hooks/useQrScanner.js` runs html5-qrcode with `qrbox` left **undefined** on
purpose — the library then decodes the entire frame instead of a centre crop,
which is what makes a code scan from any corner with no target box on screen.
Where the browser has a native `BarcodeDetector` (Chrome, Edge) it's used
instead of the WASM decoder; it's several times faster, which is the difference
between a queue moving and a queue waiting.

CSS in `index.css` strips the library's own chrome and forces the video to
`object-fit: cover` at 100vw × 100vh. A front-facing laptop camera is mirrored,
because that's what the person standing there expects.

---

## Sending tickets by email

Attendees never sign in. Each one gets a link to their own ticket page —
`/t/EVTK3M9P2Q/<uuid>` — which shows their QR code, their name, the event
details and whatever you wrote in "What attendees should know".

A **link, not an attached image**, on purpose: Outlook and Gmail hide remote
images from unknown senders by default, and a guest at the door with a blocked
image has no badge. A link always renders. It also means editing the event
updates every ticket already sent.

### Set up EmailJS (about three minutes, no credit card)

1. Make a free account at emailjs.com.
2. **Email Services** → add a service (Gmail is fine) → note the **Service ID**.
3. **Email Templates** → create a template. Set the To field to `{{to_email}}`,
   then use any of these variables in the subject and body:

   | Variable | What it holds |
   | --- | --- |
   | `{{to_name}}` | Attendee's name |
   | `{{event_name}}` `{{event_date}}` `{{event_location}}` | Event details |
   | `{{event_description}}` | Your "what attendees should know" text |
   | `{{ticket_url}}` | Their ticket page — the important one |
   | `{{qr_image_url}}` | A hosted PNG of the code, if you want it inline |
   | `{{ticket_type}}` | Ticket or table, when set |

   Note the **Template ID**.
4. **Account → General** → copy the **Public Key**.
5. Put all three in `.env`, then restart the dev server:

```
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxxx
```

The email buttons stay hidden until all three are set, so the app works
perfectly well without them.

### How it behaves

- **Adding one attendee** — "Email them their code now" is ticked by default.
  The save and the send are separate: if the email fails, the attendee is still
  added and you get a Resend button rather than a lost guest.
- **After an import** — nothing is sent automatically, because a bad CSV would
  mean hundreds of wrong emails you can't recall. The Tickets card shows
  "Email N unsent tickets" instead.
- **Resend** — the mail icon on any row. Green means they've had theirs.

### Limits worth knowing

EmailJS sends from the browser, so the public key ships in the bundle and the
quota (~200/month free) is spendable by anyone who reads it. That is fine for a
student project or a one-off event, and wrong for a product you sell.

For that, move sending server-side: a Cloud Function or a Supabase Edge Function
calling Resend or SendGrid, triggered on attendee creation. Only `src/lib/email.js`
changes — every caller keeps the same two functions.

---

## Design notes

White and black, one accent colour per event, published as a CSS variable by
`<AccentScope>` so `bg-accent/12` resolves per event without a second theme
system. Type is Geist, one family, set on a tight scale.

Everything in the organiser views is deliberately quiet so one screen can be
loud: the scan confirmation takes the entire viewport, one colour, one mark
drawn on rather than faded in, and the guest's first name at display size. It is
read from two metres away by someone who is also talking to a guest.

Success holds for 1s, rejections for 1.8s — long enough to read, short enough
that the queue keeps moving. Tunable in `src/pages/Scanner.jsx` (`HOLD_MS`).

---

## Scanner shortcuts

| Key | Action |
| --- | --- |
| `F` | Full screen on/off (F11 also works — it's the browser's own) |
| `M` | Mute or unmute the scan sound |
| `/` | Find by name, for a dead phone or a bent badge |
| `Esc` | Leave full screen |

---

## Demo script

1. **New event** — name it, pick an accent colour.
2. **Import** — drop a CSV. Codes generate on save.
3. **Download all as ZIP** or **Print badge sheet**.
4. **Start scanner** — allow the camera, it goes full screen.
5. Hold a code up. Green, a name, a beep. Hold the same one again: red,
   "Already checked in", with the time they actually arrived.
6. Turn wifi off, scan another. It still admits them, and the HUD says it's
   waiting to sync. Turn wifi back on and watch the count catch up.
7. **Export CSV** on the event page for the attendance record.

Two laptops on the same event stay in sync live — open the event page on one and
the scanner on the other.

---

## Project layout

```
src/
  lib/          firebase, db (Firestore access), qr, sheets, feedback, offlineQueue, utils
  services/     checkin — the one place that decides who gets in
  hooks/        useQrScanner, useEvents, useAttendees, useOnline, useFullscreen, useWakeLock
  context/      Auth, Theme, Toast
  components/   ui/ · layout/ · events/ · attendees/ · scanner/
  pages/        SignIn, Dashboard, EventDetail, Scanner, NotFound
```

Routes are code-split: the camera decoder only loads for whoever is running the
door, the spreadsheet parser only for whoever is building the list. First load is
roughly 190 kB gzipped.

---

## Known limits

- **Email is client-side** (see above) — fine for events you run yourself, not
  for a paid product.
- **Logos are URLs, not uploads.** Firebase Storage isn't wired up; paste a
  hosted image link. Adding Storage is a contained change to the event form.
- **Aggregate counts on the dashboard refresh every 30s**, not live — they use
  Firestore count queries so a 2,000-person event costs two reads instead of
  two thousand. The event page and the scanner HUD are live.
- **Codes are not signed.** Anyone who guesses a UUID inside a known event id
  could forge a badge. For paid ticketing, add an HMAC of the payload and verify
  it in a Cloud Function.
- **No per-door reporting UI yet**, though every check-in already records the
  device it came from and the CSV export includes it.
# scanning-ticket
