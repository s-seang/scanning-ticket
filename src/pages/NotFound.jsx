import { Link } from 'react-router-dom';
import { Wordmark } from '../components/layout/AppShell';

export function NotFound() {
  return (
    <div className="grid min-h-full place-items-center px-6 text-center">
      <div>
        <Wordmark className="justify-center text-[15px]" />
        <h1 className="mt-6 text-display font-semibold">Nothing here</h1>
        <p className="muted mt-3 text-[15px]">That link does not point to an event.</p>
        <Link
          to="/"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-black px-5 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Go to your events
        </Link>
      </div>
    </div>
  );
}
