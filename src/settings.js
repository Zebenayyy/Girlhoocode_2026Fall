// Tunable settings, remembered in this browser so on-site tuning survives a reload.

const KEY = 'her-sky-settings';
const VERSION = 2; // v2: mirror defaults to off (iVCam already mirrors the image)

export const DEFAULTS = {
  version: VERSION,
  cameraId: '',
  mirror: false,
  boxX: 0.5, // reach box center, in camera view (0..1)
  boxY: 0.45,
  boxW: 0.5, // reach box size, in camera view (0..1)
  boxH: 0.45,
  steadiness: 0.6, // 0 = twitchy, 1 = very smooth
  holdTime: 1.0, // seconds to hold on an object to select it
  voice: true,
};

// Sliders shown in the settings panel.
export const SLIDERS = [
  { key: 'boxW', label: 'Reach width', min: 0.15, max: 1, step: 0.01 },
  { key: 'boxH', label: 'Reach height', min: 0.15, max: 1, step: 0.01 },
  { key: 'boxX', label: 'Reach center ←→', min: 0, max: 1, step: 0.01 },
  { key: 'boxY', label: 'Reach center ↑↓', min: 0, max: 1, step: 0.01 },
  { key: 'steadiness', label: 'Steadiness', min: 0, max: 1, step: 0.01 },
  { key: 'holdTime', label: 'Hold time (s)', min: 0.4, max: 3, step: 0.1 },
];

export function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    if ((saved.version ?? 1) < 2) delete saved.mirror; // pick up the new default
    return { ...DEFAULTS, ...saved, version: VERSION };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // storage blocked: settings just won't persist
  }
}
