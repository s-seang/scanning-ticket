import { useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Input, Select } from '../ui/Field';
import { MailIcon, QrIcon, SearchIcon, TrashIcon, UsersIcon } from '../ui/Icons';
import { cn, formatTime, initials } from '../../lib/utils';
import { useAttendeeSearch } from '../../hooks/useAttendees';

const PAGE = 50;

export function AttendeeTable({
  attendees,
  loading,
  onShowQr,
  onDelete,
  onToggleCheckIn,
  onSendTicket,
  emailReady,
  sendingId,
  canEdit,
}) {
  const [term, setTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [visible, setVisible] = useState(PAGE);

  const results = useAttendeeSearch(attendees, term, filter);
  const shown = results.slice(0, visible);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 p-4 sm:px-6">
        <div className="relative min-w-[200px] flex-1">
          <SearchIcon
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40"
          />
          <Input
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setVisible(PAGE);
            }}
            placeholder="Search name, email or ticket"
            className="pl-9"
            type="search"
            aria-label="Search attendees"
          />
        </div>
        <Select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setVisible(PAGE);
          }}
          className="w-auto"
          aria-label="Filter by status"
        >
          <option value="all">Everyone</option>
          <option value="in">Checked in</option>
          <option value="out">Not yet in</option>
        </Select>
      </div>

      {loading ? (
        <SkeletonRows />
      ) : results.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title={attendees.length ? 'Nothing matches that search' : 'No one on the list yet'}
          description={
            attendees.length
              ? 'Try part of a name or email.'
              : 'Import a CSV or Excel file, or add the first guest by hand.'
          }
        />
      ) : (
        <>
          <ul className="hairline divide-y border-t">
            {shown.map((attendee) => (
              <li
                key={attendee.id}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-black/[0.02] sm:px-6 dark:hover:bg-white/[0.03]"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/[0.06] text-[12px] font-semibold dark:bg-white/10">
                  {initials(attendee.name)}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{attendee.name}</p>
                  <p className="muted truncate text-[13px]">
                    {attendee.email || 'No email'}
                    {attendee.ticket ? ` · ${attendee.ticket}` : ''}
                  </p>
                </div>

                <div className="hidden shrink-0 sm:block">
                  {attendee.checkedIn ? (
                    <Badge tone="pass">In at {formatTime(attendee.checkedInAt)}</Badge>
                  ) : (
                    <Badge>Not in</Badge>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {emailReady && attendee.email && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn('h-9 w-9', attendee.ticketSentAt && 'text-pass')}
                      loading={sendingId === attendee.id}
                      onClick={() => onSendTicket(attendee)}
                      aria-label={
                        attendee.ticketSentAt
                          ? `Resend ticket to ${attendee.name}`
                          : `Email ticket to ${attendee.name}`
                      }
                      title={
                        attendee.ticketSentAt
                          ? `Ticket sent ${formatTime(attendee.ticketSentAt)} — click to resend`
                          : 'Email their ticket'
                      }
                    >
                      <MailIcon size={17} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => onShowQr(attendee)}
                    aria-label={`Show QR code for ${attendee.name}`}
                    title="Show QR code"
                  >
                    <QrIcon size={17} />
                  </Button>
                  {canEdit && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hidden sm:inline-flex"
                        onClick={() => onToggleCheckIn(attendee)}
                      >
                        {attendee.checkedIn ? 'Undo' : 'Check in'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:text-fail"
                        onClick={() => onDelete(attendee)}
                        aria-label={`Remove ${attendee.name}`}
                      >
                        <TrashIcon size={17} />
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {results.length > shown.length && (
            <div className="hairline border-t p-4 text-center">
              <Button onClick={() => setVisible((v) => v + PAGE)}>
                Show more · {results.length - shown.length} left
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SkeletonRows() {
  return (
    <ul className="hairline divide-y border-t">
      {Array.from({ length: 5 }).map((_, index) => (
        <li key={index} className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <span className="h-9 w-9 animate-pulse rounded-full bg-black/[0.06] dark:bg-white/10" />
          <span className="h-3 w-40 animate-pulse rounded bg-black/[0.06] dark:bg-white/10" />
        </li>
      ))}
    </ul>
  );
}
