export const SFX_LEVELS = Object.freeze([0, .2, .4, .6, .8, 1]);
export const SFX_DEFAULT = .4;
export const SFX_KEY = 'eye-creature.exploration.sfx-volume';
export const MUSIC_KEY = 'eye-creature.exploration.music-volume';
export function readAudioLevel(key, levels, fallback, legacyMuteKey) {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null && levels.includes(Number(raw))) return Number(raw);
    if (legacyMuteKey && localStorage.getItem(legacyMuteKey) === '1') return 0;
  } catch { /* Preferences are optional, including disabled browser storage. */ }
  return fallback;
}
export function saveAudioLevel(key, value) {
  try { localStorage.setItem(key, String(value)); } catch { /* Keep the session setting. */ }
}
