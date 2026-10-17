import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AccentScope } from '../ui/AccentScope';
import { Button } from '../ui/Button';
import { CalendarIcon, EditIcon, PinIcon, ScanIcon, TrashIcon } from '../ui/Icons';
import { fetchEventCounts } from '../../lib/db';
import { formatEventDate } from '../../lib/utils';

export function EventCard({ event, onEdit, onDelete }) {
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = () => {
      fetchEventCounts(event.id)
        .then((next) => alive && setCounts(next))
        .catch(() => alive && setCounts(null));
    };
    load();
    // Refresh while the organiser is watching, stop while the tab is hidden.
    const timer = setInterval(() => document.visibilityState === 'visible' && load(), 30_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [event.id]);

  const rate = counts?.total ? Math.round((counts.checkedIn / counts.total) * 100) : 0;

  return (
    <AccentScope
      color={event.brandColor}
      as="article"
      className="surface group relative flex flex-col overflow-hidden transition hover:shadow-lift"
    >
      {/* The event's own colour, used once, as a top edge. */}
      <span className="h-1 w-full bg-accent" aria-hidden="true" />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          {event.logo ? (
            <img
              src={event.logo}
              alt=""
              className="h-10 w-10 shrink-0 rounded-xl object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[17px] font-semibold tracking-[-0.02em]">
              <Link
                to={`/events/${event.id}`}
                className="rounded outline-none hover:text-accent focus-visible:text-accent"
              >
                <span className="absolute inset-0" aria-hidden="true" />
                {event.name}
              </Link>
            </h3>
            <p className="muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon size={14} />
                {formatEventDate(event.date)}
              </span>
              {event.location && (
                <span className="inline-flex items-center gap-1.5">
                  <PinIcon size={14} />
                  {event.location}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-baseline gap-2">
            <span className="tnum text-3xl font-semibold tracking-[-0.03em]">
              {counts ? counts.checkedIn : '—'}
            </span>
            <span className="muted text-sm">{counts ? `of ${counts.total} checked in` : 'counting…'}</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/10">
            <span
              className="block h-full rounded-full bg-accent transition-[width] duration-500"
              style={{ width: `${rate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sits above the card-wide link overlay so these stay clickable. */}
      <div className="hairline relative z-10 flex items-center gap-1 border-t px-3 py-2">
        <Link
          to={`/events/${event.id}/scan`}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-accent transition hover:bg-accent/10"
        >
          <ScanIcon size={16} />
          Scan
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(event)}
            aria-label={`Edit ${event.name}`}
          >
            <EditIcon size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:text-fail"
            onClick={() => onDelete(event)}
            aria-label={`Delete ${event.name}`}
          >
            <TrashIcon size={16} />
          </Button>
        </div>
      </div>
    </AccentScope>
  );
}
