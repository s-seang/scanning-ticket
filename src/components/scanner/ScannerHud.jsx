import { Link } from 'react-router-dom';
import { cn, formatTime } from '../../lib/utils';
import {
  ArrowLeftIcon,
  CloudOffIcon,
  ExpandIcon,
  MuteIcon,
  ShrinkIcon,
  SwitchCameraIcon,
  SyncIcon,
  VolumeIcon,
} from '../ui/Icons';

/*
 * Chrome floats over the video, never boxes it in. Everything sits in the top
 * and bottom safe strips so the middle of the frame — where a guest holds their
 * phone — stays completely clear.
 */

function GlassButton({ className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-full bg-black/45 px-3.5 text-sm font-medium text-white backdrop-blur-md transition',
        'hover:bg-black/65 focus-visible:ring-offset-black',
        className,
      )}
      {...props}
    />
  );
}

export function ScannerHud({
  event,
  stats,
  eventId,
  online,
  queued,
  muted,
  onToggleMute,
  cameras,
  cameraId,
  onSwitchCamera,
  isFullscreen,
  onToggleFullscreen,
  recent,
  paused,
}) {
  const nextCamera = () => {
    if (cameras.length < 2) return;
    const index = cameras.findIndex((camera) => camera.id === cameraId);
    onSwitchCamera(cameras[(index + 1) % cameras.length].id);
  };

  return (
    <>
      {/* Top strip */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start gap-3 bg-gradient-to-b from-black/55 to-transparent p-4 pb-12 sm:p-5">
        <Link
          to={`/events/${eventId}`}
          className="pointer-events-auto inline-flex h-10 items-center gap-2 rounded-full bg-black/45 px-3.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-black/65"
        >
          <ArrowLeftIcon size={18} />
          <span className="hidden sm:inline">Exit scanner</span>
        </Link>

        <div className="pointer-events-none min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-2">
            {event.logo && <img src={event.logo} alt="" className="h-7 w-7 rounded-lg object-cover" />}
            <p className="truncate text-[15px] font-semibold text-white drop-shadow">{event.name}</p>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          {cameras.length > 1 && (
            <GlassButton onClick={nextCamera} aria-label="Switch camera" className="w-10 px-0">
              <SwitchCameraIcon size={18} />
            </GlassButton>
          )}
          <GlassButton
            onClick={onToggleMute}
            aria-label={muted ? 'Turn scan sound on' : 'Turn scan sound off'}
            className="w-10 px-0"
          >
            {muted ? <MuteIcon size={18} /> : <VolumeIcon size={18} />}
          </GlassButton>
          <GlassButton
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Leave full screen' : 'Full screen'}
            className="w-10 px-0"
          >
            {isFullscreen ? <ShrinkIcon size={18} /> : <ExpandIcon size={18} />}
          </GlassButton>
        </div>
      </div>

      {/* Live count — the number the organiser keeps glancing at */}
      <div className="pointer-events-none absolute right-4 top-20 z-20 text-right sm:right-5 sm:top-24">
        <p className="tnum text-4xl font-semibold leading-none text-white drop-shadow sm:text-5xl">
          {stats.checkedIn}
        </p>
        <p className="mt-1 text-[13px] font-medium text-white/70">of {stats.total} in</p>
      </div>

      {/* Bottom strip */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end gap-3 bg-gradient-to-t from-black/60 to-transparent p-4 pt-14 sm:p-5">
        <div className="min-w-0 flex-1">
          {recent.length > 0 && (
            <ul className="space-y-1">
              {recent.slice(0, 3).map((entry, index) => (
                <li
                  key={entry.key}
                  className={cn(
                    'flex items-center gap-2 text-sm text-white transition',
                    index === 0 ? 'opacity-100' : index === 1 ? 'opacity-65' : 'opacity-40',
                  )}
                >
                  <span
                    className={cn('h-1.5 w-1.5 shrink-0 rounded-full', entry.pass ? 'bg-pass' : 'bg-fail')}
                  />
                  <span className="truncate font-medium">{entry.name}</span>
                  <span className="shrink-0 text-white/60">{formatTime(entry.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {!online && (
            <span className="inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-[13px] font-medium text-white backdrop-blur-md">
              <CloudOffIcon size={15} />
              Offline — scans are saved here
            </span>
          )}
          {queued > 0 && (
            <span className="inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-[13px] font-medium text-white backdrop-blur-md">
              <SyncIcon size={15} />
              {queued} waiting to sync
            </span>
          )}
          <span className="inline-flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 text-[13px] font-medium text-white backdrop-blur-md">
            <span
              className={cn('h-2 w-2 rounded-full', paused ? 'bg-white/50' : 'bg-accent')}
              aria-hidden="true"
            />
            {paused ? 'Paused' : 'Scanning'}
          </span>
        </div>
      </div>
    </>
  );
}
