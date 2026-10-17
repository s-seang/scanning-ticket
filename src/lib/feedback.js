/*
 * Door staff watch the queue, not the screen, so the sound carries most of the
 * signal. Two rising notes mean "go", one flat low note means "stop".
 * Synthesised rather than bundled so there is nothing to load at the door.
 */

let context = null;

const MUTE_KEY = 'scanflow.muted';

export function isMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setMuted(muted) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* private mode — sound just won't persist */
  }
}

/** Browsers block audio until a gesture; call this from the Start button. */
export function primeAudio() {
  try {
    context = context || new (window.AudioContext || window.webkitAudioContext)();
    if (context.state === 'suspended') context.resume();
  } catch {
    context = null;
  }
}

function tone({ frequency, start = 0, duration = 0.12, gain = 0.16, type = 'sine' }) {
  if (!context) return;
  const osc = context.createOscillator();
  const amp = context.createGain();
  const at = context.currentTime + start;

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, at);
  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.exponentialRampToValueAtTime(gain, at + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + duration);

  osc.connect(amp).connect(context.destination);
  osc.start(at);
  osc.stop(at + duration + 0.02);
}

function vibrate(pattern) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}

export function playSuccess() {
  vibrate(35);
  if (isMuted()) return;
  primeAudio();
  tone({ frequency: 880, duration: 0.09 });
  tone({ frequency: 1318.5, start: 0.085, duration: 0.14 });
}

export function playDuplicate() {
  vibrate([25, 40, 25]);
  if (isMuted()) return;
  primeAudio();
  tone({ frequency: 520, duration: 0.1, type: 'triangle' });
  tone({ frequency: 520, start: 0.13, duration: 0.1, type: 'triangle' });
}

export function playError() {
  vibrate([60, 50, 60]);
  if (isMuted()) return;
  primeAudio();
  tone({ frequency: 196, duration: 0.26, gain: 0.2, type: 'sawtooth' });
}
