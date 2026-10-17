import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Input, Textarea } from '../ui/Field';
import { cn, isHexColor, normalizeHex } from '../../lib/utils';

/** A shortlist that stays legible against both white and black chrome. */
const SWATCHES = ['#1b6ef3', '#0e9f6e', '#7c3aed', '#e0484d', '#d97706', '#0f172a'];

const EMPTY = {
  name: '',
  date: new Date().toISOString().slice(0, 10),
  location: '',
  description: '',
  logo: '',
  brandColor: SWATCHES[0],
  staffEmails: '',
};

export function EventFormModal({ open, onClose, onSubmit, event }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      event
        ? {
            name: event.name || '',
            date: event.date || '',
            location: event.location || '',
            description: event.description || '',
            logo: event.logo || '',
            brandColor: normalizeHex(event.brandColor),
            staffEmails: (event.staffEmails || []).join(', '),
          }
        : EMPTY,
    );
  }, [open, event]);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Give the event a name people will recognise.';
    if (form.logo && !/^https?:\/\//i.test(form.logo))
      nextErrors.logo = 'Paste a full https link to the image.';
    if (!isHexColor(form.brandColor)) nextErrors.brandColor = 'Use a hex colour like #1b6ef3.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        brandColor: normalizeHex(form.brandColor),
        staffEmails: form.staffEmails
          .split(/[,\s]+/)
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={event ? 'Edit event' : 'New event'}
      description={
        event
          ? 'Changes show up on every device scanning this event.'
          : 'Name it, colour it, then add the guest list.'
      }
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={saving}>
            {event ? 'Save changes' : 'Create event'}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        <Input
          label="Event name"
          placeholder="Phnom Penh Tech Summit"
          value={form.name}
          onChange={set('name')}
          error={errors.name}
          data-autofocus
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Date" type="date" value={form.date} onChange={set('date')} />
          <Input
            label="Location"
            placeholder="Factory Phnom Penh"
            value={form.location}
            onChange={set('location')}
          />
        </div>

        <Textarea
          label="What attendees should know"
          rows={3}
          placeholder="Doors open at 6pm. Bring ID. Parking is behind the building."
          hint="Goes in the ticket email and on their ticket page."
          value={form.description}
          onChange={set('description')}
        />

        <Input
          label="Logo URL"
          placeholder="https://…/logo.png"
          hint="Shown on the scanner screen. Optional."
          value={form.logo}
          onChange={set('logo')}
          error={errors.logo}
        />

        <Field
          label="Accent colour"
          error={errors.brandColor}
          hint="Used across this event's screens and badges."
        >
          <div className="flex flex-wrap items-center gap-2">
            {SWATCHES.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, brandColor: swatch }))}
                className={cn(
                  'h-8 w-8 rounded-full transition',
                  normalizeHex(form.brandColor) === swatch
                    ? 'ring-2 ring-black ring-offset-2 ring-offset-white dark:ring-white dark:ring-offset-[#0d0d0d]'
                    : 'hover:scale-110',
                )}
                style={{ backgroundColor: swatch }}
                aria-label={`Use ${swatch}`}
                aria-pressed={normalizeHex(form.brandColor) === swatch}
              />
            ))}
            <label className="ml-1 inline-flex items-center gap-2">
              <span className="sr-only">Custom colour</span>
              <input
                type="color"
                value={normalizeHex(form.brandColor)}
                onChange={set('brandColor')}
                className="h-8 w-8 cursor-pointer rounded-full border border-black/10 bg-transparent dark:border-white/20"
              />
            </label>
            <span className="muted font-mono text-[13px]">{normalizeHex(form.brandColor)}</span>
          </div>
        </Field>

        <Input
          label="Let others scan"
          placeholder="door@team.com, sokha@team.com"
          hint="They sign in with these emails and the event appears in their list."
          value={form.staffEmails}
          onChange={set('staffEmails')}
        />

        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}
