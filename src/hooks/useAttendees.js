import { useEffect, useMemo, useState } from 'react';
import { subscribeAttendees } from '../lib/db';

/**
 * Live attendee list plus the counts the dashboard and the scanner HUD share,
 * so the number on the door screen and the number on the organiser's laptop
 * can never disagree.
 */
export function useAttendees(eventId) {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId) return undefined;
    setLoading(true);
    const unsubscribe = subscribeAttendees(
      eventId,
      (next) => {
        setAttendees(next);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [eventId]);

  const stats = useMemo(() => {
    const checkedIn = attendees.filter((a) => a.checkedIn).length;
    const total = attendees.length;
    return {
      total,
      checkedIn,
      remaining: total - checkedIn,
      rate: total ? Math.round((checkedIn / total) * 100) : 0,
    };
  }, [attendees]);

  const byId = useMemo(() => new Map(attendees.map((a) => [a.id, a])), [attendees]);

  return { attendees, byId, stats, loading, error };
}

/** Name / email / ticket search, case and accent tolerant enough for a door. */
export function useAttendeeSearch(attendees, term, filter = 'all') {
  return useMemo(() => {
    const needle = term.trim().toLowerCase();
    return attendees.filter((attendee) => {
      if (filter === 'in' && !attendee.checkedIn) return false;
      if (filter === 'out' && attendee.checkedIn) return false;
      if (!needle) return true;
      return [attendee.name, attendee.email, attendee.ticket]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(needle));
    });
  }, [attendees, term, filter]);
}
