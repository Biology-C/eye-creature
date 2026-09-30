// One streaming player, routed through a shared gain (including mobile Safari).
export const MUSIC_VOLUME = 0.20;
export const MUSIC_LEVELS = Object.freeze([1, .75, .5, .2, .1, 0]);
export const MUSIC_TRACKS = Object.freeze({
  title: new URL('../assets/music/title.mp3', import.meta.url).href,
  exploration: new URL('../assets/music/exploration.mp3', import.meta.url).href,
  boss: new URL('../assets/music/boss.mp3', import.meta.url).href,
});
export function musicScene(mode, boss) {
  return mode === 'intro' || mode === 'won' || mode === 'loading' ? 'title'
    : boss?.active && boss.hp > 0 ? 'boss' : 'exploration';
}
export function createMusic({makeAudio = () => new Audio(), makeContext = () => new (globalThis.AudioContext || globalThis.webkitAudioContext)(), onChange = () => {}} = {}) {
  let audio, ctx, gain, scene = 'title', current = null, unlocked = false;
  let volume = MUSIC_VOLUME, lastAudibleVolume = MUSIC_VOLUME, duck = 1, duckTimer = null;
  let muted = false, paused = false, error = false, attempt = 0, playing = false, initialized = false;
  const snapshot = () => ({scene, current, unlocked, muted, paused, error, volume, effectiveVolume: muted ? 0 : volume * duck});
  const notify = () => onChange(snapshot());
  function applyGain() { try { if (gain) gain.gain.value = muted ? 0 : volume * duck; } catch { /* Optional audio. */ } }
  function clearDuck() { clearTimeout(duckTimer);duckTimer = null;duck = 1;applyGain(); }
  function sync() {
    if (!audio || !unlocked) return;
    if (paused || muted) {
      if (playing) { attempt++; playing = false; audio.pause(); }
      return;
    }
    if (current !== scene) {
      attempt++; playing = false; audio.pause();
      current = scene; audio.src = MUSIC_TRACKS[scene]; audio.load();
    }
    if (playing || error) return;
    playing = true;
    const token = ++attempt;
    Promise.resolve(audio.play()).catch(() => {
      if (token !== attempt) return;
      playing = false; error = true; audio.pause(); notify();
    });
  }
  return {
    snapshot,
    // Call directly inside a click/key gesture; never try to autoplay at page load.
    unlock() {
      try {
        if (!initialized) {
          audio = makeAudio(); audio.preload = 'none'; audio.loop = true; audio.volume = 0;
          ctx = makeContext(); gain = ctx.createGain(); applyGain();
          ctx.createMediaElementSource(audio).connect(gain).connect(ctx.destination);
          audio.volume = 1;
          initialized = true;
          audio.addEventListener('error', () => { error = true; playing = false; audio.pause(); notify(); });
        }
        if (error) audio.load();
        error = false; unlocked = true;
        Promise.resolve(ctx.resume()).catch(() => { error = true; audio.pause(); playing = false; notify(); });
        sync(); notify();
      } catch { error = true; notify(); }
    },
    setState(next, stopped = false) {
      if (!MUSIC_TRACKS[next]) throw new Error('Unknown music scene');
      if (scene === next && paused === stopped) return;
      scene = next; paused = stopped; sync(); notify();
    },
    setVolume(value) {
      if (!MUSIC_LEVELS.includes(value)) throw new RangeError('Unsupported music volume');
      volume = value; muted = value === 0;
      if (value > 0) lastAudibleVolume = value;
      applyGain();
      sync(); notify();
    },
    setMuted(value) {
      muted = Boolean(value);
      if (!muted && volume === 0) volume = lastAudibleVolume;
      applyGain();
      sync(); notify();
    },
    // Temporary mix attenuation: never change the user's setting or unlock audio.
    duck(duration = 1500) {
      clearTimeout(duckTimer);duck = .5;applyGain();
      duckTimer = setTimeout(clearDuck, duration);
    },
    clearDuck,
  };
}
