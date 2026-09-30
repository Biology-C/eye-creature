// Procedural retro sound effects for Eye Creature.
// Original Web Audio synthesis: no sample files, no third-party audio.
// Each sound is a function (ctx, out, t, opts) so the same code plays live
// and renders offline to WAV (see renderSfx / previews/sfx/).

const NOISE = new WeakMap();

/** White noise buffer. hold>1 repeats samples for a grittier, NES-like noise. */
function noiseBuffer(ctx, hold = 1) {
  let cache = NOISE.get(ctx);
  if (!cache) NOISE.set(ctx, cache = {});
  if (!cache[hold]) {
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let value = 0;
    for (let i = 0; i < data.length; i++) {
      if (i % hold === 0) value = Math.random() * 2 - 1;
      data[i] = value;
    }
    cache[hold] = buffer;
  }
  return cache[hold];
}

const vary = (amount = 0.04) => 1 + (Math.random() * 2 - 1) * amount;

/** Attack/decay envelope on a GainNode. */
function envelope(gain, t, { attack = 0.005, peak = 1, dur = 0.2 }) {
  const g = gain.gain;
  g.setValueAtTime(0.0001, t);
  g.linearRampToValueAtTime(peak, t + attack);
  g.exponentialRampToValueAtTime(0.0001, t + Math.max(attack + 0.01, dur));
}

/**
 * Air swipe: filtered noise whose band sweeps up to a peak and settles back.
 * The rising band is what the ear reads as "a blade passing by".
 */
function whoosh(ctx, out, t, { from = 700, peak = 3500, to = 1400, dur = 0.18, q = 1.3, gain = 0.6, attack = 0.03, hold = 1, peakAt = 0.45, swell = 0.4 }) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, hold);
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.Q.value = q;
  band.frequency.setValueAtTime(from, t);
  band.frequency.exponentialRampToValueAtTime(peak, t + dur * peakAt);
  band.frequency.exponentialRampToValueAtTime(to, t + dur);
  const high = ctx.createBiquadFilter();
  high.type = 'highpass';
  high.frequency.value = 280;
  // Swell envelope: the air noise grows to its loudest as the band peaks,
  // then falls away. A plain fast-attack decay sounds like a click, not a swing.
  const amp = ctx.createGain();
  const top = t + Math.max(attack, dur * swell);
  // Start already faintly audible so the swing responds on the same frame as the key press.
  amp.gain.setValueAtTime(gain * 0.06, t);
  amp.gain.exponentialRampToValueAtTime(gain, top);
  amp.gain.exponentialRampToValueAtTime(0.0005, t + dur);
  src.connect(band).connect(high).connect(amp).connect(out);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.02);
}

/** Pitched oscillator with an exponential glide and optional low-pass to tame square-wave fizz. */
function tone(ctx, out, t, { type = 'square', from = 440, to = from, dur = 0.12, gain = 0.1, attack = 0.004, lowpass = 0 }) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  const amp = ctx.createGain();
  envelope(amp, t, { attack, peak: gain, dur });
  let node = osc;
  if (lowpass) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = lowpass;
    node = node.connect(lp);
  }
  node.connect(amp).connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// ---------------------------------------------------------------- sounds

export const SOUNDS = {
  /** Combo 1: straight slash — thin, quick. */
  slash1(ctx, out, t) {
    const v = vary();
    whoosh(ctx, out, t, { from: 800 * v, peak: 4200 * v, to: 1800 * v, dur: 0.17, q: 1.5, gain: 0.5, attack: 0.02, swell: 0.3 });
  },
  /** Combo 2: spin slash — fuller swipe plus a faint blade ring. */
  slash2(ctx, out, t) {
    const v = vary();
    whoosh(ctx, out, t, { from: 600 * v, peak: 3400 * v, to: 1300 * v, dur: 0.22, q: 1.2, gain: 0.55, attack: 0.03, swell: 0.42 });
    tone(ctx, out, t + 0.03, { type: 'triangle', from: 1760 * v, dur: 0.16, gain: 0.05 });
    tone(ctx, out, t + 0.03, { type: 'triangle', from: 2637 * v, dur: 0.12, gain: 0.03 });
  },
  /** Combo 3: cross slash — two heavy swipes and a short low body. Weighty, not an explosion. */
  slash3(ctx, out, t) {
    const v = vary(0.03);
    whoosh(ctx, out, t, { from: 450 * v, peak: 2800 * v, to: 1000 * v, dur: 0.24, q: 1.0, gain: 0.55, attack: 0.035, swell: 0.4 });
    whoosh(ctx, out, t + 0.09, { from: 520 * v, peak: 3300 * v, to: 1200 * v, dur: 0.24, q: 1.1, gain: 0.5, attack: 0.03, swell: 0.4 });
    whoosh(ctx, out, t, { from: 300, peak: 900, to: 400, dur: 0.24, q: 0.8, gain: 0.16, attack: 0.03, hold: 3, swell: 0.3 });
    tone(ctx, out, t + 0.01, { type: 'triangle', from: 170 * v, to: 75, dur: 0.16, gain: 0.22, attack: 0.01 });
  },
  /** Normal light shot: bright zap falling in pitch, low-passed so it never pierces. */
  shot(ctx, out, t) {
    const v = vary();
    tone(ctx, out, t, { type: 'square', from: 1500 * v, to: 520 * v, dur: 0.13, gain: 0.2, lowpass: 3800 });
    tone(ctx, out, t, { type: 'triangle', from: 750 * v, to: 260 * v, dur: 0.14, gain: 0.26 });
    whoosh(ctx, out, t, { from: 2000, peak: 3200, to: 1800, dur: 0.08, q: 1.2, gain: 0.2, attack: 0.004, swell: 0.15 });
  },
  /** Full-charge release: bigger, deeper burst. */
  chargedShot(ctx, out, t) {
    const v = vary(0.03);
    tone(ctx, out, t, { type: 'square', from: 950 * v, to: 190 * v, dur: 0.28, gain: 0.12, lowpass: 3000 });
    tone(ctx, out, t, { type: 'triangle', from: 480 * v, to: 95 * v, dur: 0.3, gain: 0.22 });
    whoosh(ctx, out, t, { from: 1600, peak: 2400, to: 350, dur: 0.32, q: 0.9, gain: 0.34, attack: 0.008, peakAt: 0.15, hold: 2, swell: 0.1 });
  },
  /** Pickup chime. opts.step (0–12) raises pitch for consecutive pickups. opts.kind==='relic' plays a longer arpeggio. */
  pickup(ctx, out, t, { step = 0, kind } = {}) {
    const base = 988 * 2 ** (Math.min(12, step) / 12);
    const notes = kind === 'relic' ? [0, 4, 7, 12] : [0, 7];
    notes.forEach((semi, i) => {
      const f = base * 2 ** (semi / 12);
      tone(ctx, out, t + i * 0.055, { type: 'square', from: f, dur: 0.1, gain: 0.09, lowpass: 5000 });
      tone(ctx, out, t + i * 0.055, { type: 'triangle', from: f * 2, dur: 0.07, gain: 0.03 });
    });
  },
  /** Dash: short gritty air burst with a small rising zip. */
  dash(ctx, out, t) {
    const v = vary();
    whoosh(ctx, out, t, { from: 900 * v, peak: 2800 * v, to: 1500 * v, dur: 0.16, q: 0.9, gain: 0.4, attack: 0.012, peakAt: 0.3, hold: 2, swell: 0.28 });
    tone(ctx, out, t, { type: 'triangle', from: 260 * v, to: 520 * v, dur: 0.08, gain: 0.05 });
  },
  /** Chime played when the charge reaches full. */
  chargeReady(ctx, out, t) {
    tone(ctx, out, t, { type: 'triangle', from: 1319, dur: 0.09, gain: 0.12 });
    tone(ctx, out, t + 0.06, { type: 'triangle', from: 1976, dur: 0.14, gain: 0.1 });
    tone(ctx, out, t + 0.06, { type: 'square', from: 1976, dur: 0.08, gain: 0.025, lowpass: 5000 });
  },
};

/** Render length (seconds) for offline export / tests. */
export const SOUND_LENGTH = { slash1: 0.25, slash2: 0.3, slash3: 0.4, shot: 0.2, chargedShot: 0.4, pickup: 0.3, dash: 0.2, chargeReady: 0.25, charge: 1.3 };
export const SOUND_NAMES = Object.keys(SOUND_LENGTH);

// ---------------------------------------------------------------- charge loop

/**
 * Rising hum while charging, holding with vibrato once full.
 * elapsed = time already charged; full = seconds needed for a full charge.
 * Returns {stop(t)}.
 */
function chargeVoice(ctx, out, t, { elapsed = 0, full = 0.8, onReady } = {}) {
  const remaining = Math.max(0, full - elapsed);
  const low = 220, high = 660;
  const start = remaining > 0 ? low * (high / low) ** (elapsed / full) : high;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.linearRampToValueAtTime(0.018, t + 0.06);
  // Tremolo speeds up as the charge fills.
  const trem = ctx.createGain();
  trem.gain.value = 0.7;
  const lfo = ctx.createOscillator();
  lfo.frequency.setValueAtTime(10, t);
  lfo.frequency.linearRampToValueAtTime(18, t + remaining + 0.001);
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 0.3;
  lfo.connect(lfoDepth).connect(trem.gain);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1800;
  const oscs = [['square', 1, 1], ['triangle', 0.5, 1.4]].map(([type, ratio, level]) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(start * ratio, t);
    if (remaining > 0) osc.frequency.exponentialRampToValueAtTime(high * ratio, t + remaining);
    const g = ctx.createGain();
    g.gain.value = level;
    osc.connect(g).connect(lp);
    return osc;
  });
  // Gentle vibrato after full charge.
  const vib = ctx.createOscillator();
  vib.frequency.value = 6;
  const vibDepth = ctx.createGain();
  vibDepth.gain.setValueAtTime(0, t);
  vibDepth.gain.setValueAtTime(0, t + remaining);
  vibDepth.gain.linearRampToValueAtTime(10, t + remaining + 0.1);
  vib.connect(vibDepth);
  for (const osc of oscs) vibDepth.connect(osc.frequency);
  lp.connect(trem).connect(amp).connect(out);
  const all = [...oscs, lfo, vib];
  for (const o of all) o.start(t);
  let ready = null;
  if (remaining > 0) ready = setTimeoutFor(ctx, t + remaining, () => onReady?.());
  return {
    readyAt: t + remaining,
    stop(at = ctx.currentTime) {
      ready?.cancel();
      amp.gain.cancelScheduledValues(at);
      amp.gain.setValueAtTime(Math.max(0.0001, amp.gain.value), at);
      amp.gain.exponentialRampToValueAtTime(0.0001, at + 0.04);
      for (const o of all) o.stop(at + 0.06);
    },
  };
}

/** Timer in audio-clock time; live contexts only. */
function setTimeoutFor(ctx, when, fn) {
  if (typeof window === 'undefined' || ctx instanceof (globalThis.OfflineAudioContext || function () {})) return null;
  const id = setTimeout(fn, Math.max(0, (when - ctx.currentTime) * 1000));
  return { cancel: () => clearTimeout(id) };
}

// ---------------------------------------------------------------- output chain

function createMaster(ctx, volume) {
  const input = ctx.createGain();
  input.gain.value = volume;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.knee.value = 6;
  comp.ratio.value = 4;
  comp.attack.value = 0.002;
  comp.release.value = 0.08;
  input.connect(comp).connect(ctx.destination);
  return input;
}

/**
 * Live player. The AudioContext is created lazily on the first play(),
 * which must come from a user gesture (key press / tap) in browsers.
 */
export function createSfx({ volume = 0.7, muted = false } = {}) {
  let ctx = null, master = null, charge = null, pickupStep = 0, lastPickup = -Infinity;
  const samples = new Map(), loading = new Map();

  function ensure(fromGesture = false) {
    if (!ctx) {
      // Automatic pickups / charge-loop updates must not create a context.
      if (!fromGesture && !globalThis.navigator?.userActivation?.isActive) return null;
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); master = createMaster(ctx, muted ? 0 : volume); } catch { ctx = null; return null; }
    }
    try { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); } catch { return null; }
    return ctx;
  }
  function setLevel() {
    try { if (master) master.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, 0.01); } catch { /* Optional audio. */ }
  }
  const api = {
    /** Call only from a user action (start / continue), before automatic events. */
    unlock() { ensure(true); },
    /** Optional user-supplied recording. Never create a context while loading. */
    loadSample(name, url) {
      if (!ctx) return Promise.resolve(false);
      if (!loading.has(name)) loading.set(name, (async () => {
        try {
          const response = await fetch(url);
          if (!response.ok) return false;
          samples.set(name, await ctx.decodeAudioData(await response.arrayBuffer()));
          return true;
        } catch { return false; }
      })());
      return loading.get(name);
    },
    get muted() { return muted; },
    set muted(value) { muted = !!value; if (muted) api.stopCharge(); setLevel(); },
    get volume() { return volume; },
    set volume(value) { volume = Math.min(1, Math.max(0, value)); setLevel(); },
    get charging() { return !!charge; },
    /** name: slash1|slash2|slash3|shot|chargedShot|pickup|dash|chargeReady */
    play(name, opts = {}) {
      if (muted) return true;
      if (!SOUNDS[name] && !samples.has(name)) return false;
      const c = ensure();
      if (!c) return false;
      if (samples.has(name)) {
        try { const source=c.createBufferSource();source.buffer=samples.get(name);source.connect(master);source.onended=()=>source.disconnect();source.start();return true; } catch { return false; }
      }
      if (name === 'pickup') {
        const now = performance.now();
        pickupStep = now - lastPickup < 1200 ? Math.min(12, pickupStep + 2) : 0;
        lastPickup = now;
        opts = { step: pickupStep, ...opts };
      }
      try { SOUNDS[name](c, master, c.currentTime + 0.005, opts); return true; } catch { return false; /* audio must never break gameplay */ }
    },
    /** Start (or keep) the charge hum. elapsed = seconds already charged. */
    startCharge(elapsed = 0, full = 0.8) {
      if (muted || charge) return;
      const c = ensure();
      if (!c) return;
      try {
        charge = chargeVoice(c, master, c.currentTime + 0.005, { elapsed, full, onReady: () => { if (charge) api.play('chargeReady'); } });
      } catch { charge = null; }
    },
    stopCharge() {
      if (!charge) return;
      try { charge.stop(ctx.currentTime); } catch { /* already stopped */ }
      charge = null;
    },
  };
  return api;
}

// ---------------------------------------------------------------- offline export

/** Render one sound to a mono Float32Array (44.1 kHz). */
export async function renderSfx(name, { sampleRate = 44100, volume = 0.9 } = {}) {
  const length = Math.ceil((SOUND_LENGTH[name] || 0.5) * sampleRate);
  const ctx = new OfflineAudioContext(1, length, sampleRate);
  const master = createMaster(ctx, volume);
  if (name === 'charge') {
    chargeVoice(ctx, master, 0, { full: 0.8 });
    SOUNDS.chargeReady(ctx, master, 0.8);
  } else {
    SOUNDS[name](ctx, master, 0);
  }
  const buffer = await ctx.startRendering();
  return { samples: buffer.getChannelData(0), sampleRate };
}

/** 16-bit PCM WAV encoder. */
export function encodeWav(samples, sampleRate) {
  const view = new DataView(new ArrayBuffer(44 + samples.length * 2));
  const text = (offset, s) => { for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i)); };
  text(0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true); text(8, 'WAVE');
  text(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  text(36, 'data'); view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i])) * 0x7fff, true);
  return new Blob([view], { type: 'audio/wav' });
}
