import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getTicket } from '../lib/db';
import { toCanvas } from '../lib/qr';
import { formatEventDate } from '../lib/utils';
import { AccentScope } from '../components/ui/AccentScope';
import { CalendarIcon, PinIcon } from '../components/ui/Icons';

/*
 * What an attendee opens from their email. No account, no app, no download —
 * one page they can hold up at the door.
 *
 * It renders light regardless of the visitor's theme: a white card behind a
 * black QR is what a camera reads fastest, and a phone at full brightness on a
 * dark page is noticeably harder to scan.
 */
export function Ticket() {
  const { eventId, attendeeId } = useParams();
  const [state, setState] = useState({ status: 'loading' });
  const canvasRef = useRef(null);

  useEffect(() => {
    let alive = true;
    getTicket(eventId, attendeeId)
      .then((data) => {
        if (!alive) return;
        setState(data ? { status: 'ready', ...data } : { status: 'missing' });
      })
      .catch(() => alive && setState({ status: 'error' }));
    return () => {
      alive = false;
    };
  }, [eventId, attendeeId]);

  useEffect(() => {
    if (state.status !== 'ready' || !canvasRef.current) return;
    toCanvas(canvasRef.current, state.attendee.qrCode, { width: 320 }).catch(() => {});
  }, [state]);

  if (state.status === 'loading') {
    return <Shell><p className="text-sm text-black/50">Loading your ticket…</p></Shell>;
  }

  if (state.status !== 'ready') {
    return (
      <Shell>
        <h1 className="text-title font-semibold text-black">Ticket not found</h1>
        <p className="mt-2 max-w-xs text-sm text-black/55">
          This link may have expired, or the organiser removed the booking. Check with them for a
          new one.
        </p>
      </Shell>
    );
  }

  const { event, attendee } = state;

  return (
    <AccentScope color={event.brandColor}>
      <Shell>
        <div className="w-full max-w-sm">
          {event.logo && (
            <img src={event.logo} alt="" className="mx-auto mb-6 h-14 w-14 rounded-2xl object-cover" />
          )}

          <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05),0_24px_48px_-24px_rgba(0,0,0,0.35)]">
            <span className="block h-1.5 w-full bg-accent" aria-hidden="true" />

            <div className="px-6 pb-2 pt-7 text-center">
              <p className="text-[13px] font-medium text-black/45">Admits one</p>
              <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-black">
                {attendee.name}
              </h1>
              {attendee.ticket && (
                <p className="mt-2 inline-block rounded-full bg-accent/10 px-3 py-1 text-[13px] font-medium text-accent">
                  {attendee.ticket}
                </p>
              )}
            </div>

            <div className="flex justify-center px-6 py-5">
              <canvas ref={canvasRef} width={320} height={320} className="h-64 w-64" />
            </div>

            {/* A torn-ticket edge, the one decorative thing on the page. */}
            <div className="relative">
              <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#f2f2f2]" />
              <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#f2f2f2]" />
              <hr className="border-t border-dashed border-black/15" />
            </div>

            <div className="space-y-3 px-6 py-6">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-black">{event.name}</h2>
              <p className="flex items-center gap-2 text-sm text-black/60">
                <CalendarIcon size={16} />
                {formatEventDate(event.date)}
              </p>
              {event.location && (
                <p className="flex items-center gap-2 text-sm text-black/60">
                  <PinIcon size={16} />
                  {event.location}
                </p>
              )}
              {event.description && (
                <p className="whitespace-pre-line pt-1 text-sm leading-relaxed text-black/70">
                  {event.description}
                </p>
              )}
            </div>
          </div>

          <p className="mt-5 text-center text-[13px] text-black/45">
            {attendee.checkedIn
              ? 'Already checked in. See you inside.'
              : 'Show this at the door. Screenshot it in case you lose signal.'}
          </p>
        </div>
      </Shell>
    </AccentScope>
  );
}

function Shell({ children }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[#f2f2f2] px-5 py-10 text-center">
      {children}
    </div>
  );
}
