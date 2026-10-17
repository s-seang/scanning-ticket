import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';

const AuthContext = createContext(null);

/** Firebase error codes are not sentences. These are. */
const MESSAGES = {
  'auth/invalid-email': 'That email address does not look right.',
  'auth/invalid-credential': 'Email and password do not match.',
  'auth/wrong-password': 'Email and password do not match.',
  'auth/user-not-found': 'No account uses that email. Create one below.',
  'auth/email-already-in-use': 'That email already has an account. Sign in instead.',
  'auth/weak-password': 'Use at least 6 characters.',
  'auth/popup-closed-by-user': 'The Google window closed before sign-in finished.',
  'auth/network-request-failed': 'No connection. Check the network and try again.',
  'auth/too-many-requests': 'Too many attempts. Wait a minute, then try again.',
};

export function authMessage(error) {
  return MESSAGES[error?.code] || error?.message || 'Something went wrong. Try again.';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return undefined;
    }
    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      setLoading(false);
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      configured: isFirebaseConfigured,
      signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
      signUp: async (name, email, password) => {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(credential.user, { displayName: name });
        setUser({ ...credential.user, displayName: name || credential.user.displayName });
        return credential;
      },
      signInWithGoogle: () => signInWithPopup(auth, new GoogleAuthProvider()),
      resetPassword: (email) => sendPasswordResetEmail(auth, email),
      signOut: () => signOut(auth),
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
