import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NotFound } from './pages/NotFound';

/*
 * Route-level splitting. It matters here: the camera decoder only loads for
 * whoever is running the door, and the spreadsheet importer only loads for
 * whoever is building the list.
 */
const SignIn = lazy(() => import('./pages/SignIn').then((m) => ({ default: m.SignIn })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const EventDetail = lazy(() => import('./pages/EventDetail').then((m) => ({ default: m.EventDetail })));
const Scanner = lazy(() => import('./pages/Scanner').then((m) => ({ default: m.Scanner })));
const Ticket = lazy(() => import('./pages/Ticket').then((m) => ({ default: m.Ticket })));

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={<div className="min-h-full" />}>
              <Routes>
                <Route path="/sign-in" element={<SignIn />} />
                {/* Public: an attendee opening their own ticket has no account. */}
                <Route path="/t/:eventId/:attendeeId" element={<Ticket />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/events/:eventId"
                  element={
                    <ProtectedRoute>
                      <EventDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/events/:eventId/scan"
                  element={
                    <ProtectedRoute>
                      <Scanner />
                    </ProtectedRoute>
                  }
                />
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
