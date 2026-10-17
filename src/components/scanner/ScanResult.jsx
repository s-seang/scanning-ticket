import { cn, formatTime } from '../../lib/utils';
import { CHECK_IN } from '../../lib/db';

/*
 * Everything else in ScanFlow is quiet on purpose so this screen can be loud.
 * It is read from two metres away by someone who is also talking to a guest, so
 * the whole viewport becomes the status light: one colour, one mark, one name.
 */

export function ScanResult({ result }) {
  if (!result) return null;

  const pass = result.status === CHECK_IN.SUCCESS;

  return (
    <div
      className={cn(
        'absolute inset-0 z-30 flex animate-wash-in flex-col items-center justify-center px-8 text-center text-white',
        pass ? 'bg-pass' : 'bg-fail',
      )}
      role="status"
      aria-live="assertive"
    >
      <Mark pass={pass} />

      <p className="mt-8 max-w-[18ch] text-display font-semibold text-balance">{headline(result)}</p>

      <p className="mt-3 text-lg font-medium text-white/85">{subline(result)}</p>
    </div>
  );
}

function headline(result) {
  const name = result.attendee?.name;
  switch (result.status) {
    case CHECK_IN.SUCCESS:
      return `Welcome, ${firstName(name)}`;
    case CHECK_IN.DUPLICATE:
      return 'Already checked in';
    case CHECK_IN.WRONG_EVENT:
      return 'Wrong event';
    case CHECK_IN.NOT_FOUND:
      return 'Code not on the list';
    case CHECK_IN.INVALID:
      return 'Unknown code';
    default:
      return 'Scan again';
  }
}

function subline(result) {
  switch (result.status) {
    case CHECK_IN.SUCCESS:
      return result.queued
        ? 'Saved on this device — syncs when the connection returns'
        : formatTime(result.attendee?.checkedInAt || new Date());
    case CHECK_IN.DUPLICATE:
      return result.attendee?.checkedInAt
        ? `${result.attendee.name} came in at ${formatTime(result.attendee.checkedInAt)}`
        : `${result.attendee?.name || 'This guest'} is already inside`;
    case CHECK_IN.WRONG_EVENT:
      return 'That badge belongs to another event';
    case CHECK_IN.NOT_FOUND:
      return 'Add them by hand from the event page';
    case CHECK_IN.INVALID:
      return 'That is not a ScanFlow badge';
    default:
      return 'Hold the code steady in front of the camera';
  }
}

function firstName(name = 'guest') {
  return name.trim().split(/\s+/)[0] || 'guest';
}

/** A mark drawn on screen rather than faded in — motion that shows what changed. */
function Mark({ pass }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className="h-28 w-28 sm:h-36 sm:w-36"
      fill="none"
      stroke="currentColor"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="52" className="opacity-30" />
      {pass ? (
        <path d="M36 62.5 52.5 79 85 43" style={{ strokeDasharray: 120 }} className="animate-stroke-in" />
      ) : (
        <>
          <path d="M42 42 78 78" style={{ strokeDasharray: 120 }} className="animate-stroke-in" />
          <path
            d="M78 42 42 78"
            style={{ strokeDasharray: 120, animationDelay: '90ms' }}
            className="animate-stroke-in"
          />
        </>
      )}
    </svg>
  );
}
