import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Field';
import { isEmailConfigured } from '../../lib/email';

/** Walk-ups happen. This adds one person and hands back their code immediately. */
export function AttendeeFormModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({ name: '', email: '', ticket: '' });
  const [sendEmail, setSendEmail] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ name: '', email: '', ticket: '' });
      setSendEmail(true);
      setError('');
    }
  }, [open]);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e) => {
    e?.preventDefault();
    if (!form.name.trim() && !form.email.trim()) {
      setError('Add at least a name or an email.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit(form, { sendEmail: sendEmail && isEmailConfigured && Boolean(form.email.trim()) });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add attendee"
      description="They get a QR code as soon as you save."
      size="sm"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={saving}>
            Add attendee
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        <Input
          label="Name"
          value={form.name}
          onChange={set('name')}
          error={error}
          data-autofocus
          placeholder="Sopheak Chan"
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={set('email')}
          placeholder="sopheak@example.com"
        />
        <Input label="Ticket or table" value={form.ticket} onChange={set('ticket')} placeholder="VIP" />

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 p-3 dark:border-white/15">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            disabled={!isEmailConfigured || !form.email.trim()}
            className="mt-0.5 h-4 w-4 accent-black dark:accent-white"
          />
          <span className="text-[13px]">
            <span className="block font-medium">Email them their code now</span>
            <span className="muted block">
              {!isEmailConfigured
                ? 'Email is not set up yet — add your EmailJS keys to .env.'
                : !form.email.trim()
                  ? 'Add an email address above to send it.'
                  : 'They get a link to their ticket page straight away.'}
            </span>
          </span>
        </label>

        <button type="submit" className="hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}
