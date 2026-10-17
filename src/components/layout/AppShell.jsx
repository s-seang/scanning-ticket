import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useOnline } from '../../hooks/useOnline';
import { Button } from '../ui/Button';
import { CloudOffIcon, LogOutIcon, MoonIcon, SunIcon } from '../ui/Icons';
import { cn, initials } from '../../lib/utils';

export function Wordmark({ className }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold tracking-[-0.03em]', className)}>
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-black text-white dark:bg-white dark:text-black">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M5 9V6.5A1.5 1.5 0 0 1 6.5 5H9M19 9V6.5A1.5 1.5 0 0 0 17.5 5H15M5 15v2.5A1.5 1.5 0 0 0 6.5 19H9M19 15v2.5a1.5 1.5 0 0 1-1.5 1.5H15M4 12h16" />
        </svg>
      </span>
      ScanFlow
    </span>
  );
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}

function OfflineChip() {
  const online = useOnline();
  if (online) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.06] px-2.5 py-1 text-[12px] font-medium dark:bg-white/10">
      <CloudOffIcon size={14} />
      Offline
    </span>
  );
}

export function AppShell({ children }) {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-full flex-col">
      <header className="hairline sticky top-0 z-40 border-b bg-white/80 backdrop-blur-xl dark:bg-black/70">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-5 sm:px-6">
          <Link to="/" className="rounded-lg text-[15px]">
            <Wordmark />
          </Link>

          <nav className="ml-2 hidden items-center gap-1 sm:flex">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-1.5 text-sm transition',
                  isActive
                    ? 'bg-black/[0.06] font-medium dark:bg-white/10'
                    : 'muted hover:text-black dark:hover:text-white',
                )
              }
            >
              Events
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <OfflineChip />
            <ThemeToggle />
            {user && (
              <div className="flex items-center gap-2 pl-1">
                <span
                  className="grid h-8 w-8 place-items-center rounded-full bg-black text-[12px] font-semibold text-white dark:bg-white dark:text-black"
                  title={user.email || ''}
                >
                  {initials(user.displayName || user.email || 'S')}
                </span>
                <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out" title="Sign out">
                  <LogOutIcon />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 pt-8 sm:px-6">{children}</main>
    </div>
  );
}
