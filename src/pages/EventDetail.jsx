import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEvent } from '../hooks/useEvents';
import { useAttendees } from '../hooks/useAttendees';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  CHECK_IN,
  addAttendee,
  addAttendees,
  checkInAttendee,
  deleteAttendee,
  markTicketSent,
  undoCheckIn,
  updateEvent,
} from '../lib/db';
import { isEmailConfigured, sendTicketEmail, sendTicketEmails } from '../lib/email';
import { downloadAttendanceCsv } from '../lib/sheets';
import { downloadQrZip, openPrintableSheet } from '../lib/qr';
import { formatEventDate } from '../lib/utils';
import { AppShell } from '../components/layout/AppShell';
import { AccentScope } from '../components/ui/AccentScope';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { AttendeeTable } from '../components/attendees/AttendeeTable';
import { AttendeeFormModal } from '../components/attendees/AttendeeFormModal';
import { ImportModal } from '../components/attendees/ImportModal';
import { QrCodeModal } from '../components/attendees/QrCodeModal';
import { EventFormModal } from '../components/events/EventFormModal';
import {
  ArrowLeftIcon,
  CalendarIcon,
  DownloadIcon,
  EditIcon,
  MailIcon,
  PinIcon,
  PlusIcon,
  PrinterIcon,
  ScanIcon,
  UploadIcon,
} from '../components/ui/Icons';

export function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const { event, loading: loadingEvent } = useEvent(eventId);
  const { attendees, stats, loading: loadingAttendees } = useAttendees(eventId);

  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [qrFor, setQrFor] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [zipping, setZipping] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const [blast, setBlast] = useState(null);

  if (loadingEvent) {
    return (
      <AppShell>
        <div className="surface h-40 animate-pulse" />
      </AppShell>
    );
  }

  if (!event) {
    return (
      <AppShell>
        <Card>
          <EmptyState
            title="This event is gone"
            description="It was deleted, or the link points somewhere that no longer exists."
            action={
              <Button variant="primary" onClick={() => navigate('/')}>
                Back to events
              </Button>
            }
          />
        </Card>
      </AppShell>
    );
  }

  const isOwner = event.ownerId === user?.uid;

  const handleImport = async (rows, onProgress) => {
    await addAttendees(eventId, rows, onProgress);
    toast.success(`${rows.length} added to ${event.name}`);
  };

  const handleAdd = async (row, { sendEmail } = {}) => {
    let created;
    try {
      created = await addAttendee(eventId, row);
    } catch (error) {
      toast.error(error.message || 'That did not save.');
      throw error;
    }

    // Saved either way: a failed email must never lose the attendee.
    if (!sendEmail) {
      toast.success(`${created.name} added`);
      setQrFor(created);
      return;
    }

    try {
      await sendTicketEmail({ event, attendee: created });
      await markTicketSent(eventId, created.id);
      toast.success(`${created.name} added — ticket emailed to ${created.email}`);
    } catch (error) {
      console.error('Ticket email failed', error);
      toast.error(`${created.name} was added, but the email failed. Try Resend from the list.`);
      setQrFor(created);
    }
  };

  const handleSendTicket = async (attendee) => {
    setSendingId(attendee.id);
    try {
      await sendTicketEmail({ event, attendee });
      await markTicketSent(eventId, attendee.id);
      toast.success(`Ticket sent to ${attendee.email}`);
    } catch (error) {
      console.error('Ticket email failed', error);
      toast.error(error.message || 'The email did not send.');
    } finally {
      setSendingId(null);
    }
  };

  /** Everyone with an email who has not had a ticket yet. */
  const unsent = attendees.filter((a) => a.email && !a.ticketSentAt);

  const handleSendAll = async () => {
    if (!unsent.length) return;
    setBlast({ done: 0, total: unsent.length });
    const { sent, failed } = await sendTicketEmails({
      event,
      attendees: unsent,
      onProgress: (done, total) => setBlast({ done, total }),
    });

    await Promise.all(sent.map((a) => markTicketSent(eventId, a.id).catch(() => {})));
    setBlast(null);

    if (failed.length) {
      console.error('Some tickets failed', failed);
      toast.error(`${sent.length} sent, ${failed.length} failed. Retry those from the list.`);
    } else {
      toast.success(`${sent.length} ${sent.length === 1 ? 'ticket' : 'tickets'} sent`);
    }
  };

  const handleToggle = async (attendee) => {
    if (attendee.checkedIn) {
      try {
        await undoCheckIn(eventId, attendee.id);
        toast.toast(`${attendee.name} moved back out`);
      } catch (error) {
        console.error('Undo failed', error);
        toast.error(`Could not undo: ${error?.code || error?.message || 'unknown error'}`);
      }
      return;
    }

    const result = await checkInAttendee({
      eventId,
      attendeeId: attendee.id,
      by: user?.uid,
      device: 'Desk',
    });

    // A failed write is NOT a duplicate. Saying so at a door turns a real guest
    // away, so each outcome gets its own message and the raw error is logged.
    switch (result.status) {
      case CHECK_IN.SUCCESS:
        toast.success(`${attendee.name} checked in`);
        break;
      case CHECK_IN.DUPLICATE:
        toast.error(`${attendee.name} was already checked in`);
        break;
      case CHECK_IN.NOT_FOUND:
        toast.error(`${attendee.name} is no longer on the list`);
        break;
      default:
        console.error('Check-in failed', result.error);
        toast.error(
          `Check-in failed: ${result.error?.code || result.error?.message || 'unknown error'}`,
        );
    }
  };

  const handleDownloadZip = async () => {
    if (!attendees.length) return;
    setZipping({ done: 0, total: attendees.length });
    try {
      await downloadQrZip(event, attendees, (done, total) => setZipping({ done, total }));
      toast.success('QR codes downloaded');
    } catch (error) {
      toast.error(error.message || 'The download did not finish.');
    } finally {
      setZipping(null);
    }
  };

  const handlePrint = async () => {
    try {
      await openPrintableSheet(event, attendees);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <AccentScope color={event.brandColor}>
      <AppShell>
        <Link
          to="/"
          className="muted inline-flex items-center gap-1.5 rounded text-[13px] font-medium hover:text-black dark:hover:text-white"
        >
          <ArrowLeftIcon size={15} />
          All events
        </Link>

        <header className="mt-4 flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 items-start gap-4">
            {event.logo && (
              <img
                src={event.logo}
                alt=""
                className="h-14 w-14 shrink-0 rounded-2xl object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div className="min-w-0">
              <h1 className="truncate text-display font-semibold">{event.name}</h1>
              <p className="muted mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarIcon size={15} />
                  {formatEventDate(event.date)}
                </span>
                {event.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <PinIcon size={15} />
                    {event.location}
                  </span>
                )}
                <span className="font-mono text-[13px]">{event.id}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isOwner && (
              <Button onClick={() => setEditOpen(true)}>
                <EditIcon size={16} />
                Edit
              </Button>
            )}
            <Button variant="accent" size="lg" onClick={() => navigate(`/events/${eventId}/scan`)}>
              <ScanIcon size={18} />
              Start scanner
            </Button>
          </div>
        </header>

        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <Stat label="Checked in" value={stats.checkedIn} accent />
          <Stat label="Still to arrive" value={stats.remaining} />
          <Stat label="On the list" value={stats.total} />
        </section>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/10">
          <span
            className="block h-full rounded-full bg-accent transition-[width] duration-700"
            style={{ width: `${stats.rate}%` }}
          />
        </div>

        <Card className="mt-8">
          <CardHeader
            title="Attendees"
            description="Everyone here can be scanned in at the door."
            actions={
              <>
                <Button onClick={() => setImportOpen(true)}>
                  <UploadIcon size={16} />
                  Import
                </Button>
                <Button onClick={() => setAddOpen(true)}>
                  <PlusIcon size={16} />
                  Add
                </Button>
              </>
            }
          />
          <AttendeeTable
            attendees={attendees}
            loading={loadingAttendees}
            canEdit
            onShowQr={setQrFor}
            onDelete={setRemoving}
            onToggleCheckIn={handleToggle}
            onSendTicket={handleSendTicket}
            emailReady={isEmailConfigured}
            sendingId={sendingId}
          />
        </Card>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader
              title="Tickets"
              description={
                isEmailConfigured
                  ? 'Email everyone their code, or print the codes for the door.'
                  : 'Set up EmailJS in .env to send these by email.'
              }
            />
            <div className="flex flex-wrap gap-2 px-5 pb-5 sm:px-6 sm:pb-6">
              {isEmailConfigured && (
                <Button
                  variant="primary"
                  onClick={handleSendAll}
                  disabled={!unsent.length}
                  loading={Boolean(blast)}
                >
                  <MailIcon size={16} />
                  {blast
                    ? `Sending ${blast.done}/${blast.total}`
                    : unsent.length
                      ? `Email ${unsent.length} unsent ${unsent.length === 1 ? 'ticket' : 'tickets'}`
                      : 'Everyone has their ticket'}
                </Button>
              )}
              <Button onClick={handleDownloadZip} disabled={!attendees.length} loading={Boolean(zipping)}>
                <DownloadIcon size={16} />
                {zipping ? `Packing ${zipping.done}/${zipping.total}` : 'Download all as ZIP'}
              </Button>
              <Button onClick={handlePrint} disabled={!attendees.length}>
                <PrinterIcon size={16} />
                Print badge sheet
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Attendance record" description="Who came, and exactly when." />
            <div className="flex flex-wrap gap-2 px-5 pb-5 sm:px-6 sm:pb-6">
              <Button onClick={() => downloadAttendanceCsv(event, attendees)} disabled={!attendees.length}>
                <DownloadIcon size={16} />
                Export CSV
              </Button>
              <Button
                onClick={() => {
                  navigator.clipboard?.writeText(`${window.location.origin}/events/${eventId}/scan`);
                  toast.success('Scanner link copied — open it on any other device');
                }}
              >
                Copy scanner link
              </Button>
            </div>
          </Card>
        </section>

        <AttendeeFormModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAdd} />
        <ImportModal
          open={importOpen}
          onClose={() => setImportOpen(false)}
          onImport={handleImport}
          existing={attendees}
        />
        <QrCodeModal open={Boolean(qrFor)} onClose={() => setQrFor(null)} attendee={qrFor} event={event} />
        <EventFormModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          event={event}
          onSubmit={async (values) => {
            await updateEvent(eventId, values);
            toast.success('Event updated');
          }}
        />
        <ConfirmDialog
          open={Boolean(removing)}
          onClose={() => setRemoving(null)}
          onConfirm={async () => {
            await deleteAttendee(eventId, removing.id);
            toast.success(`${removing.name} removed`);
            setRemoving(null);
          }}
          title={`Remove ${removing?.name || 'this attendee'}?`}
          description="Their QR code stops working straight away."
          confirmLabel="Remove"
        />
      </AppShell>
    </AccentScope>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="surface px-5 py-4">
      <p className="muted text-[13px]">{label}</p>
      <p className={`tnum mt-1 text-4xl font-semibold tracking-[-0.03em] ${accent ? 'text-accent' : ''}`}>
        {value}
      </p>
    </div>
  );
}
