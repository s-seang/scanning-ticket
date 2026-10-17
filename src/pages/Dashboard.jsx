import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useEvents } from '../hooks/useEvents';
import { createEvent, deleteEvent, updateEvent } from '../lib/db';
import { AppShell } from '../components/layout/AppShell';
import { EventCard } from '../components/events/EventCard';
import { EventFormModal } from '../components/events/EventFormModal';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { PlusIcon, ScanIcon } from '../components/ui/Icons';

export function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const { events, loading } = useEvents();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [removing, setRemoving] = useState(false);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (event) => {
    setEditing(event);
    setFormOpen(true);
  };

  const save = async (values) => {
    try {
      if (editing) {
        await updateEvent(editing.id, values);
        toast.success('Event updated');
      } else {
        const created = await createEvent(user, values);
        toast.success(`${created.name} created`);
      }
    } catch (error) {
      toast.error(error.message || 'That did not save. Check the connection.');
      throw error;
    }
  };

  const confirmDelete = async () => {
    setRemoving(true);
    try {
      await deleteEvent(deleting.id);
      toast.success(`${deleting.name} deleted`);
      setDeleting(null);
    } catch (error) {
      toast.error(error.message || 'The event could not be deleted.');
    } finally {
      setRemoving(false);
    }
  };

  const firstName = (user?.displayName || '').trim().split(/\s+/)[0];

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-display font-semibold">{firstName ? `Hello, ${firstName}` : 'Your events'}</h1>
          <p className="muted mt-2 text-[15px]">
            {loading
              ? 'Loading your events'
              : events.length
                ? 'Open an event to manage the list or start the scanner.'
                : 'Create an event to get started.'}
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={openNew}>
          <PlusIcon size={18} />
          New event
        </Button>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="surface h-52 animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="surface">
            <EmptyState
              icon={ScanIcon}
              title="No events yet"
              description="An event holds its guest list, its QR codes and its live attendance. Most people make one per door."
              action={
                <Button variant="primary" onClick={openNew}>
                  <PlusIcon size={18} />
                  Create your first event
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} onEdit={openEdit} onDelete={setDeleting} />
            ))}
          </div>
        )}
      </div>

      <EventFormModal open={formOpen} onClose={() => setFormOpen(false)} onSubmit={save} event={editing} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={removing}
        title={`Delete ${deleting?.name || 'this event'}?`}
        description="The guest list, the codes and the attendance record go with it."
        confirmLabel="Delete event"
      />
    </AppShell>
  );
}
