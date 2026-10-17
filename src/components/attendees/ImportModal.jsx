import { useRef, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { UploadIcon } from '../ui/Icons';
import { downloadSampleCsv, parseAttendeeFile } from '../../lib/sheets';
import { cn } from '../../lib/utils';

const STEP = { PICK: 'pick', REVIEW: 'review', SAVING: 'saving' };

export function ImportModal({ open, onClose, onImport, existing = [] }) {
  const [step, setStep] = useState(STEP.PICK);
  const [dragging, setDragging] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const inputRef = useRef(null);

  const reset = () => {
    setStep(STEP.PICK);
    setReport(null);
    setError('');
    setProgress({ done: 0, total: 0 });
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    try {
      const parsed = await parseAttendeeFile(file);
      if (!parsed.rows.length) {
        setError('No attendees found. The file needs a name or email column.');
        return;
      }

      // Anyone already on the list is skipped rather than duplicated.
      const known = new Set(existing.map((a) => (a.email || a.name).toLowerCase()));
      const fresh = parsed.rows.filter((row) => !known.has((row.email || row.name).toLowerCase()));

      setReport({
        filename: file.name,
        rows: fresh,
        alreadyOnList: parsed.rows.length - fresh.length,
        duplicatesInFile: parsed.duplicates.length,
        skipped: parsed.skipped.length,
      });
      setStep(STEP.REVIEW);
    } catch {
      setError('That file could not be read. Save it as .csv or .xlsx and try again.');
    }
  };

  const save = async () => {
    setStep(STEP.SAVING);
    try {
      await onImport(report.rows, (done, total) => setProgress({ done, total }));
      close();
    } catch (err) {
      setError(err.message || 'The import did not finish. Check the connection and try again.');
      setStep(STEP.REVIEW);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Import attendees"
      description="CSV or Excel with columns for name, email and ticket."
      footer={
        step === STEP.REVIEW ? (
          <>
            <Button onClick={reset}>Choose another file</Button>
            <Button variant="primary" onClick={save}>
              Add {report.rows.length} {report.rows.length === 1 ? 'attendee' : 'attendees'}
            </Button>
          </>
        ) : (
          <Button onClick={close}>Cancel</Button>
        )
      }
    >
      {step === STEP.PICK && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              'flex flex-col items-center rounded-xl2 border border-dashed px-6 py-10 text-center transition',
              dragging ? 'border-accent bg-accent/[0.06]' : 'border-black/15 dark:border-white/20',
            )}
          >
            <UploadIcon size={24} className="mb-3 text-black/45 dark:text-white/45" />
            <p className="text-sm font-medium">Drop the guest list here</p>
            <p className="muted mt-1 text-[13px]">.csv, .tsv, .xlsx or .xls</p>
            <Button className="mt-4" data-autofocus onClick={() => inputRef.current?.click()}>
              Choose file
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.tsv,.txt,.xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          {error && <p className="text-[13px] text-fail">{error}</p>}

          <p className="muted text-[13px]">
            Not sure about the format?{' '}
            <button
              type="button"
              onClick={downloadSampleCsv}
              className="rounded font-medium text-accent underline underline-offset-2"
            >
              Download a sample CSV
            </button>
          </p>
        </div>
      )}

      {step === STEP.REVIEW && report && (
        <div className="space-y-4">
          <div className="hairline rounded-xl2 border">
            <div className="hairline flex items-center justify-between border-b px-4 py-3">
              <span className="truncate text-sm font-medium">{report.filename}</span>
              <span className="muted shrink-0 text-[13px]">{report.rows.length} ready</span>
            </div>
            <ul className="max-h-56 divide-y divide-black/5 overflow-y-auto dark:divide-white/10">
              {report.rows.slice(0, 40).map((row, index) => (
                <li key={index} className="flex items-baseline justify-between gap-3 px-4 py-2 text-sm">
                  <span className="truncate font-medium">{row.name}</span>
                  <span className="muted truncate text-[13px]">{row.email}</span>
                </li>
              ))}
            </ul>
            {report.rows.length > 40 && (
              <p className="muted hairline border-t px-4 py-2 text-[13px]">
                and {report.rows.length - 40} more
              </p>
            )}
          </div>

          {(report.alreadyOnList > 0 || report.duplicatesInFile > 0 || report.skipped > 0) && (
            <ul className="muted space-y-1 text-[13px]">
              {report.alreadyOnList > 0 && (
                <li>{report.alreadyOnList} already on this event&rsquo;s list — skipped.</li>
              )}
              {report.duplicatesInFile > 0 && (
                <li>{report.duplicatesInFile} repeated inside the file — merged.</li>
              )}
              {report.skipped > 0 && <li>{report.skipped} rows had no name or email — skipped.</li>}
            </ul>
          )}

          {error && <p className="text-[13px] text-fail">{error}</p>}
        </div>
      )}

      {step === STEP.SAVING && (
        <div className="py-8 text-center">
          <p className="tnum text-2xl font-semibold">
            {progress.done}
            <span className="muted"> / {progress.total || report.rows.length}</span>
          </p>
          <p className="muted mt-1 text-sm">Generating codes and saving</p>
          <div className="mx-auto mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/10">
            <span
              className="block h-full rounded-full bg-accent transition-[width]"
              style={{
                width: `${progress.total ? (progress.done / progress.total) * 100 : 8}%`,
              }}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
