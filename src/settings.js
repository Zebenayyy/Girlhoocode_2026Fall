// Tunable settings, remembered in this browser so on-site tuning survives a reload.

const KEY = 'her-sky-settings';

export const DEFAULTS = {
  cameraId: '',
  mirror: true,
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
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
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
