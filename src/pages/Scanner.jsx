import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEvent } from '../hooks/useEvents';
import { useAttendees, useAttendeeSearch } from '../hooks/useAttendees';
import { useOnline } from '../hooks/useOnline';
import { useFullscreen } from '../hooks/useFullscreen';
import { useWakeLock } from '../hooks/useWakeLock';
import { useQrScanner } from '../hooks/useQrScanner';
import { useAuth } from '../context/AuthContext';
import { resolveScan } from '../services/checkin';
import { CHECK_IN } from '../lib/db';
import { buildPayload } from '../lib/qr';
import { isMuted, playDuplicate, playError, playSuccess, primeAudio, setMuted } from '../lib/feedback';
import { startQueueSync, subscribeQueue } from '../lib/offlineQueue';
import { AccentScope } from '../components/ui/AccentScope';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { ScanResult } from '../components/scanner/ScanResult';
import { ScannerHud } from '../components/scanner/ScannerHud';
import { CameraIcon, SearchIcon } from '../components/ui/Icons';
import { formatTime, initials } from '../lib/utils';

const CAMERA_ELEMENT = 'scanflow-camera';

/** How long the confirmation holds the screen before the camera returns. */
const HOLD_MS = { pass: 1000, fail: 1800 };

export function Scanner() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const { event } = useEvent(eventId);
  const { byId, stats } = useAttendees(eventId);
  const online = useOnline();

  const shellRef = useRef(null);
  const lockRef = useRef(false);
  const timerRef = useRef(null);

  const [result, setResult] = useState(null);
  const [recent, setRecent] = useState([]);
  const [queued, setQueued] = useState(0);
  const [muted, setMutedState] = useState(isMuted);
  const [lookupOpen, setLookupOpen] = useState(false);

  const { isFullscreen, enter, toggle } = useFullscreen(shellRef);

  const handleDecode = useCallback(
    async (text) => {
      // One badge at a time: ignore every frame until the overlay clears.
      if (lockRef.current || !event) return;
      lockRef.current = true;

      const outcome = await resolveScan({
        text,
        event,
        byId,
        uid: user?.uid,
        device: deviceLabel(),
        online: navigator.onLine,
      });

      if (outcome.status === CHECK_IN.SUCCESS) playSuccess();
      else if (outcome.status === CHECK_IN.DUPLICATE) playDuplicate();
      else playError();

      setResult(outcome);
      setRecent((list) =>
        [
          {
            key: `${Date.now()}-${Math.random()}`,
            name: outcome.attendee?.name || labelFor(outcome.status),
            pass: outcome.status === CHECK_IN.SUCCESS,
            at: new Date(),
          },
          ...list,
        ].slice(0, 8),
      );

      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(
        () => {
          setResult(null);
          lockRef.current = false;
        },
        outcome.status === CHECK_IN.SUCCESS ? HOLD_MS.pass : HOLD_MS.fail,
      );
    },
    [event, byId, user],
  );

  const scanner = useQrScanner({ elementId: CAMERA_ELEMENT, onDecode: handleDecode });
  const running = scanner.status === 'running';

  useWakeLock(running);

  // Replay anything the door queued while the network was down.
  useEffect(() => startQueueSync({ uid: user?.uid, device: deviceLabel() }), [user]);
  useEffect(
    () => subscribeQueue((items) => setQueued(items.filter((item) => item.eventId === eventId).length)),
    [eventId],
  );

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Kiosk shortcuts, live only once the camera is up and no field has focus.
  useEffect(() => {
    if (!running) return undefined;
    const onKey = (e) => {
      if (e.target.closest('input, textarea, select')) return;
      if (e.key === 'f') toggle();
      if (e.key === 'm') toggleMute();
      if (e.key === '/') {
        e.preventDefault();
        setLookupOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const toggleMute = () => {
    setMutedState((current) => {
      setMuted(!current);
      return !current;
    });
  };

  const start = async () => {
    primeAudio(); // the click is the gesture that unlocks sound
    await scanner.start();
    enter();
  };

  /** Admitting someone from the name list runs the exact same path as a scan. */
  const admit = (attendee) => {
    setLookupOpen(false);
    lockRef.current = false;
    handleDecode(buildPayload(eventId, attendee.id));
  };

  if (!event) {
    return (
      <div className="grid min-h-full place-items-center bg-black p-6 text-center text-white">
        <div>
          <p className="text-lg font-medium">Loading the event…</p>
          <Link to="/" className="muted mt-3 inline-block text-sm underline">
            Back to events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AccentScope color={event.brandColor} className="contents">
      <div
        ref={shellRef}
        className="fixed inset-0 z-50 overflow-hidden bg-black"
        style={{ '--cam-flip': scanner.mirrored ? -1 : 1 }}
      >
        {/* The camera, edge to edge, no crop box. */}
        <div id={CAMERA_ELEMENT} className="absolute inset-0" />

        {running && (
          <>
            <ScannerHud
              event={event}
              eventId={eventId}
              stats={stats}
              online={online}
              queued={queued}
              muted={muted}
              onToggleMute={toggleMute}
              cameras={scanner.cameras}
              cameraId={scanner.cameraId}
              onSwitchCamera={scanner.switchCamera}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggle}
              recent={recent}
              paused={Boolean(result)}
            />

            <button
              type="button"
              onClick={() => setLookupOpen(true)}
              className="absolute bottom-24 left-1/2 z-20 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/45 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-black/65 sm:bottom-auto sm:left-auto sm:right-5 sm:top-40 sm:translate-x-0"
            >
              <SearchIcon size={16} />
              Find by name
            </button>
          </>
        )}

        {!running && (
          <StartPanel
            event={event}
            stats={stats}
            status={scanner.status}
            error={scanner.error}
            onStart={start}
          />
        )}

        <ScanResult result={result} />

        <LookupSheet
          open={lookupOpen}
          onClose={() => setLookupOpen(false)}
          attendees={[...byId.values()]}
          onAdmit={admit}
        />
      </div>
    </AccentScope>
  );
}

/* --------------------------------------------------------------- sub-views */

function StartPanel({ event, stats, status, error, onStart }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black px-6 text-center text-white">
      {event.logo && <img src={event.logo} alt="" className="mb-6 h-16 w-16 rounded-2xl object-cover" />}
      <p className="text-sm font-medium text-white/60">{stats.total} on the list</p>
      <h1 className="mt-2 max-w-[16ch] text-display font-semibold text-balance">{event.name}</h1>

      {error ? (
        <div className="mt-8 max-w-sm rounded-xl2 border border-white/15 p-5">
          <p className="font-medium">{error.title}</p>
          <p className="mt-1.5 text-sm text-white/65">{error.detail}</p>
        </div>
      ) : (
        <p className="mt-4 max-w-sm text-[15px] text-white/60">
          The camera fills the screen. Hold any badge in front of it — anywhere in frame works.
        </p>
      )}

      <Button
        variant="accent"
        size="lg"
        className="mt-8 h-14 rounded-full px-8 text-base"
        onClick={onStart}
        loading={status === 'starting'}
      >
        <CameraIcon size={20} />
        {error ? 'Try again' : 'Start scanner'}
      </Button>

      <Link
        to={`/events/${event.id}`}
        className="mt-6 rounded text-sm text-white/55 underline underline-offset-4"
      >
        Back to the event
      </Link>
    </div>
  );
}

function LookupSheet({ open, onClose, attendees, onAdmit }) {
  const [term, setTerm] = useState('');
  const results = useAttendeeSearch(attendees, term).slice(0, 25);

  useEffect(() => {
    if (open) setTerm('');
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Find by name"
      description="For a phone that died or a badge that will not scan."
    >
      <Input
        data-autofocus
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Start typing a name"
        type="search"
        aria-label="Search attendees"
      />

      <ul className="hairline mt-4 max-h-72 divide-y overflow-y-auto">
        {results.map((attendee) => (
          <li key={attendee.id}>
            <button
              type="button"
              onClick={() => !attendee.checkedIn && onAdmit(attendee)}
              disabled={attendee.checkedIn}
              className="flex w-full items-center gap-3 px-1 py-3 text-left transition enabled:hover:bg-black/[0.03] disabled:opacity-50 dark:enabled:hover:bg-white/[0.05]"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/[0.06] text-[12px] font-semibold dark:bg-white/10">
                {initials(attendee.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{attendee.name}</span>
                <span className="muted block truncate text-[13px]">{attendee.email}</span>
              </span>
              <span className="muted shrink-0 text-[13px]">
                {attendee.checkedIn ? `In ${formatTime(attendee.checkedInAt)}` : 'Check in'}
              </span>
            </button>
          </li>
        ))}
        {term && results.length === 0 && (
          <li className="muted px-1 py-6 text-center text-sm">No one matches that name.</li>
        )}
      </ul>
    </Modal>
  );
}

function labelFor(status) {
  if (status === CHECK_IN.WRONG_EVENT) return 'Wrong event';
  if (status === CHECK_IN.NOT_FOUND) return 'Not on the list';
  return 'Unknown code';
}

/** A human-readable device name so the export can say which door someone used. */
function deviceLabel() {
  try {
    const stored = localStorage.getItem('scanflow.device');
    if (stored) return stored;
  } catch {
    /* ignore */
  }
  const platform = /Mac/i.test(navigator.userAgent)
    ? 'Mac'
    : /Win/i.test(navigator.userAgent)
      ? 'Windows'
      : /Android/i.test(navigator.userAgent)
        ? 'Android'
        : /iPhone|iPad/i.test(navigator.userAgent)
          ? 'iOS'
          : 'Browser';
  return `${platform} scanner`;
}
