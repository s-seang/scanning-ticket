import { useEffect, useState } from 'react';
import { subscribeEvent, subscribeEvents } from '../lib/db';
import { useAuth } from '../context/AuthContext';

/** Live list of the events this account can open. */
export function useEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return undefined;
    setLoading(true);
    const unsubscribe = subscribeEvents(
      user,
      (next) => {
        setEvents(next);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [user]);

  return { events, loading, error };
}

/** Live single event. `event === null` once we know it is gone. */
export function useEvent(eventId) {
  const [event, setEvent] = useState(undefined);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId) return undefined;
    return subscribeEvent(eventId, setEvent, setError);
  }, [eventId]);

  return { event, loading: event === undefined && !error, error };
}
