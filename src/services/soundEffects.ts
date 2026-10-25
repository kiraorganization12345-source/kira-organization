/**
 * Realistic Sound Effects for Quran Page Turning and Book Interaction
 * Uses Web Audio API synthesis for zero external network dependencies,
 * instant responsiveness, and guaranteed offline functionality.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

const SOUND_PREF_KEY = 'mushaf_realistic_sound_enabled';

export function isPageTurnSoundEnabled(): boolean {
  try {
    const saved = localStorage.getItem(SOUND_PREF_KEY);
    return saved !== null ? saved === 'true' : true;
  } catch {
    return true;
  }
}

export function setPageTurnSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_PREF_KEY, String(enabled));
  } catch {}
}

/**
 * Synthesizes an authentic, subtle parchment / book paper flip sound
 */
export function playRealisticPageTurnSound(volume = 0.35): void {
  if (!isPageTurnSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const duration = 0.22;
    const sampleRate = ctx.sampleRate;
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const output = buffer.getChannelData(0);

    // Generate textured pink/brown noise with smooth envelope
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.95 * b1 + white * 0.1;
      b2 = 0.85 * b2 + white * 0.2;
      const pink = (b0 + b1 + b2) * 0.4;
      
      // Amplitude envelope: quick soft attack, brief rustle body, gentle tail decay
      const t = i / bufferSize;
      const env = t < 0.15 
        ? Math.sin((t / 0.15) * (Math.PI / 2))
        : Math.pow(1 - (t - 0.15) / 0.85, 2.2);

      output[i] = pink * env;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    // Filter to emphasize natural paper whoosh (around 800Hz - 2200Hz)
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + duration);
    filter.Q.setValueAtTime(1.2, ctx.currentTime);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    whiteNoise.start();
  } catch (err) {
    console.debug('Could not play page turn sound:', err);
  }
}
