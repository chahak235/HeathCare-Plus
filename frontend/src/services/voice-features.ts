/**
 * Measures how someone speaks from an audio clip, entirely in the browser:
 * pace, pauses, loudness and pitch. These "prosody" cues are what clinicians
 * listen for (for example flat, slow speech with long pauses can go with low
 * mood; fast, tense speech with high pitch variation can go with stress).
 */

export interface VoiceFeatures {
  durationSec: number;
  speechSec: number;
  /** Share of the clip that is silence, 0 to 1 */
  pauseRatio: number;
  /** Pauses longer than 0.5 s, per minute of audio */
  pausesPerMin: number;
  longestPauseSec: number;
  /** Speech bursts per minute: a rough speaking-rate proxy */
  speechBurstsPerMin: number;
  meanLoudnessDb: number;
  /** Standard deviation of loudness while speaking. Low = flat delivery */
  loudnessVariationDb: number;
  /** Median voice pitch in Hz, null if no voiced speech was found */
  pitchHz: number | null;
  /** Pitch variation in semitones. Low = monotone */
  pitchVariationSemitones: number | null;
}

const FRAME_SEC = 0.03;
const HOP_SEC = 0.015;
const TARGET_RATE = 16000;

function toMono(buffer: AudioBuffer): Float32Array {
  const out = new Float32Array(buffer.length);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const ch = buffer.getChannelData(c);
    for (let i = 0; i < ch.length; i++) out[i] += ch[i] / buffer.numberOfChannels;
  }
  return out;
}

async function decode(file: Blob): Promise<{ samples: Float32Array; rate: number }> {
  const bytes = await file.arrayBuffer();
  const ctx = new OfflineAudioContext(1, 1, TARGET_RATE);
  const decoded = await ctx.decodeAudioData(bytes);
  if (decoded.sampleRate === TARGET_RATE) return { samples: toMono(decoded), rate: TARGET_RATE };

  // Resample to 16 kHz to keep the pitch search cheap
  const length = Math.ceil(decoded.duration * TARGET_RATE);
  const offline = new OfflineAudioContext(1, length, TARGET_RATE);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  const rendered = await offline.startRendering();
  return { samples: rendered.getChannelData(0), rate: TARGET_RATE };
}

/** Autocorrelation pitch estimate for one frame, 75 to 400 Hz. */
function framePitch(frame: Float32Array, rate: number): number | null {
  const minLag = Math.floor(rate / 400);
  const maxLag = Math.floor(rate / 75);
  let energy = 0;
  for (let i = 0; i < frame.length; i++) energy += frame[i] * frame[i];
  if (energy === 0) return null;

  let bestLag = -1;
  let best = 0;
  for (let lag = minLag; lag <= maxLag && lag < frame.length; lag++) {
    let sum = 0;
    for (let i = 0; i + lag < frame.length; i++) sum += frame[i] * frame[i + lag];
    const r = sum / energy;
    if (r > best) {
      best = r;
      bestLag = lag;
    }
  }
  return best > 0.45 && bestLag > 0 ? rate / bestLag : null;
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};
const std = (xs: number[]) => {
  if (xs.length < 2) return 0;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length);
};
const round = (x: number, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

export async function extractVoiceFeatures(file: Blob): Promise<VoiceFeatures> {
  const { samples, rate } = await decode(file);
  const frameLen = Math.round(FRAME_SEC * rate);
  const hop = Math.round(HOP_SEC * rate);

  const db: number[] = [];
  const frames: Float32Array[] = [];
  for (let start = 0; start + frameLen <= samples.length; start += hop) {
    const frame = samples.subarray(start, start + frameLen);
    let sum = 0;
    for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
    db.push(10 * Math.log10(sum / frame.length + 1e-10));
    frames.push(frame);
  }
  const durationSec = samples.length / rate;
  if (db.length === 0) throw new Error('Audio is too short');

  // Speech vs silence: adaptive threshold above the noise floor
  const sorted = [...db].sort((a, b) => a - b);
  const noiseFloor = sorted[Math.floor(sorted.length * 0.1)];
  const peak = sorted[Math.floor(sorted.length * 0.95)];
  const threshold = Math.max(noiseFloor + 0.35 * (peak - noiseFloor), noiseFloor + 6);
  const voiced = db.map((d) => d > threshold);

  let speechFrames = 0;
  let bursts = 0;
  const pauses: number[] = [];
  let run = 0;
  for (let i = 0; i < voiced.length; i++) {
    if (voiced[i]) {
      speechFrames++;
      if (i === 0 || !voiced[i - 1]) bursts++;
      if (run > 0) {
        pauses.push(run * HOP_SEC);
        run = 0;
      }
    } else if (speechFrames > 0) {
      run++;
    }
  }
  const speechSec = speechFrames * HOP_SEC;
  const longPauses = pauses.filter((p) => p >= 0.5);
  const minutes = Math.max(durationSec / 60, 1 / 60);

  const speechDb = db.filter((_, i) => voiced[i]);
  const pitches: number[] = [];
  for (let i = 0; i < frames.length; i += 2) {
    if (!voiced[i]) continue;
    const p = framePitch(frames[i], rate);
    if (p) pitches.push(p);
  }
  const pitchMedian = pitches.length >= 5 ? median(pitches) : null;
  const semitones = pitchMedian ? pitches.map((p) => 12 * Math.log2(p / pitchMedian)) : [];

  return {
    durationSec: round(durationSec, 1),
    speechSec: round(speechSec, 1),
    pauseRatio: round(1 - speechSec / durationSec),
    pausesPerMin: round(longPauses.length / minutes, 1),
    longestPauseSec: round(pauses.length ? Math.max(...pauses) : 0, 1),
    speechBurstsPerMin: round(bursts / minutes, 1),
    meanLoudnessDb: round(speechDb.length ? speechDb.reduce((a, b) => a + b, 0) / speechDb.length : -100, 1),
    loudnessVariationDb: round(std(speechDb), 1),
    pitchHz: pitchMedian ? Math.round(pitchMedian) : null,
    pitchVariationSemitones: pitchMedian ? round(std(semitones), 1) : null,
  };
}
