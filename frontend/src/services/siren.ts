/**
 * Loud two-tone emergency siren made with the Web Audio API (no audio file),
 * plus phone vibration where supported. start() must run from a user tap
 * (browsers block sound that is not started by a gesture).
 */
let ctx: AudioContext | null = null;
let osc: OscillatorNode | null = null;
let gain: GainNode | null = null;
let sweep: number | null = null;
let vibe: number | null = null;
let autoStop: number | null = null;

const VIBRATE_PATTERN = [600, 300, 600, 300, 600, 900];

export function isSirenOn(): boolean {
  return osc !== null;
}

export function startSiren(maxSeconds = 120): boolean {
  if (osc) return true;
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = ctx || new Ctor();
    void ctx.resume();
    osc = ctx.createOscillator();
    gain = ctx.createGain();
    osc.type = 'sawtooth';
    gain.gain.value = 0.35;
    osc.connect(gain).connect(ctx.destination);
    osc.start();

    // Wail between 650 Hz and 1350 Hz, like an ambulance siren
    let high = false;
    const step = () => {
      if (!ctx || !osc) return;
      const t = ctx.currentTime;
      osc.frequency.cancelScheduledValues(t);
      osc.frequency.setValueAtTime(osc.frequency.value, t);
      osc.frequency.linearRampToValueAtTime(high ? 650 : 1350, t + 0.45);
      high = !high;
    };
    step();
    sweep = window.setInterval(step, 450);
  } catch {
    osc = null;
  }

  if ('vibrate' in navigator) {
    navigator.vibrate(VIBRATE_PATTERN);
    vibe = window.setInterval(() => navigator.vibrate(VIBRATE_PATTERN), 3000);
  }
  autoStop = window.setTimeout(stopSiren, maxSeconds * 1000);
  return osc !== null;
}

export function stopSiren(): void {
  if (sweep) window.clearInterval(sweep);
  if (vibe) window.clearInterval(vibe);
  if (autoStop) window.clearTimeout(autoStop);
  sweep = vibe = autoStop = null;
  if ('vibrate' in navigator) navigator.vibrate(0);
  try {
    if (gain && ctx) gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    osc?.stop(ctx ? ctx.currentTime + 0.2 : 0);
  } catch {
    /* already stopped */
  }
  osc = null;
  gain = null;
}
