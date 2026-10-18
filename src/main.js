import { createStage } from './stage.js';
import { createOverlay } from './overlay.js';
import { createJourney } from './journey.js';
import { createCard, listVoices } from './card.js';
import { unlockAudio } from './sfx.js';
import { STOPS } from './stops.js';
import { createHandTracker, createPointer, listCameras, unlockCameraLabels } from './hands.js';
import { DEFAULTS, SLIDERS, loadSettings, saveSettings } from './settings.js';

const HAND_LOST_MS = 400; // hide the cursor this long after the hand disappears
const MOUSE_ACTIVE_MS = 3000; // mouse cursor shows this long after the last move

const $ = (id) => document.getElementById(id);

const settings = loadSettings();
const stage = createStage($('scene'));
const overlay = createOverlay($('overlay'));
const card = createCard($('card'), settings);
const tracker = createHandTracker($('video'));
const pointer = createPointer();

// ---------- on-screen text driven by the journey ----------
STOPS.forEach(() => $('progress').appendChild(document.createElement('span')));

let travelTimer = null;
let recycledTimer = null;
let tutorialShownAt = 0;
const ui = {
  setTitle(on) { $('title-banner').classList.toggle('visible', on); },
  setTutorial(on) {
    if (on && !$('tutorial').classList.contains('visible')) tutorialShownAt = performance.now();
    $('tutorial').classList.toggle('visible', on);
  },
  setFinale(on) { $('finale').classList.toggle('visible', on); },
  setProgress(i) {
    [...$('progress').children].forEach((el, k) => el.classList.toggle('lit', k <= i));
  },
  setChapter(i) {
    $('travel').classList.remove('visible');
    if (i === null) { $('chapter').classList.remove('visible'); return; }
    const s = STOPS[i];
    $('chapter').querySelector('.chapter-step').textContent = `Stop ${i + 1} of ${STOPS.length}`;
    $('chapter').querySelector('.chapter-name').textContent = s.name;
    $('chapter').querySelector('.chapter-distance').textContent = s.distance;
    $('chapter').classList.add('visible');
  },
  travel(name, distance = '') {
    $('chapter').classList.remove('visible');
    $('travel').querySelector('.travel-to').textContent = `Traveling to ${name}…`;
    $('travel').querySelector('.travel-distance').textContent = distance;
    $('travel').classList.add('visible');
    clearTimeout(travelTimer);
    travelTimer = setTimeout(() => $('travel').classList.remove('visible'), 2600);
  },
  setFuel(f) {
    $('fuel-fill').style.width = `${Math.round(f * 100)}%`;
    $('fuel-text').textContent = f >= 0.999 ? 'Full, ready to fly' : f <= 0.001 ? 'Empty: collect space junk' : `${Math.round(f * 100)}%`;
    document.querySelector('.dash-fuel').classList.toggle('low', f <= 0.001);
  },
  setCollected(n, total) { $('junk-count').textContent = `${n} / ${total}`; },
  recycled(name, fact) {
    $('recycled').querySelector('.recycled-name').textContent = `♻ Recycled ${name} into fuel`;
    $('recycled').querySelector('.recycled-fact').textContent = fact ?? '';
    $('recycled').classList.add('visible');
    clearTimeout(recycledTimer);
    recycledTimer = setTimeout(() => $('recycled').classList.remove('visible'), fact ? 6500 : 2500);
  },
  setHome(on, n = 0) {
    $('home-text').textContent = `You recycled ${n} pieces of space junk on your journey, and Earth's orbit is clean because of you.`;
    $('home').classList.toggle('visible', on);
    if (!on) $('recycled').classList.remove('visible');
  },
};

const journey = createJourney({ stage, card, ui });
if (import.meta.env.DEV) window.herSky = { journey }; // e.g. herSky.journey.jumpTo(5) in the console

// ---------- interaction state ----------
const cursor = { x: 0, y: 0, visible: false };
const mouse = { x: 0, y: 0, at: -Infinity };
let lastHandAt = -Infinity;
let dwellId = null; // target the cursor is currently resting on
let progress = 0; // 0..1 dwell progress on dwellId
let lockedId = null; // just-selected target; must leave it before it can trigger again

function select(target) {
  lockedId = target.id;
  progress = 0;
  target.onSelect();
}

function updateCursor(now, dt) {
  const tip = tracker.fingertip;
  if (tip) {
    const p = pointer.map(tip, settings, stage.size(), dt);
    cursor.x = p.x;
    cursor.y = p.y;
    lastHandAt = now;
  } else if (now - lastHandAt > HAND_LOST_MS) {
    pointer.reset();
  }

  const handActive = now - lastHandAt <= HAND_LOST_MS;
  const mouseActive = now - mouse.at <= MOUSE_ACTIVE_MS;
  if (!handActive && mouseActive) {
    cursor.x = mouse.x;
    cursor.y = mouse.y;
  }
  cursor.visible = handActive || mouseActive;
}

function updateDwell(dt, targets) {
  const hovered = cursor.visible ? overlay.hitTest(targets, cursor.x, cursor.y) : null;

  if (!hovered || hovered.id !== lockedId) lockedId = null;

  if (!hovered || hovered.id === lockedId) {
    dwellId = null;
    progress = 0;
  } else if (hovered.id !== dwellId) {
    dwellId = hovered.id;
    progress = 0;
  } else {
    // junk is quick to grab; stories and travel take a deliberate hold
    progress += dt / (settings.holdTime * (hovered.kind === 'junk' ? 0.5 : 1));
    if (progress >= 1) select(hovered);
  }
  return hovered;
}

// ---------- tutorial arrows: from each label to the thing it explains ----------
const TIP_DELAYS = [0.2, 0.9, 1.6, 2.3, 3.0]; // seconds; matches the CSS transition delays

function closestOnRect(r, p) {
  return { x: Math.min(Math.max(p.x, r.left), r.right), y: Math.min(Math.max(p.y, r.top), r.bottom) };
}

function topCenter(el) {
  const r = el.getBoundingClientRect();
  return { x: (r.left + r.right) / 2, y: r.top - 4 };
}

function tutorialArrows(targets) {
  if (!$('tutorial').classList.contains('visible')) return [];
  const since = (performance.now() - tutorialShownAt) / 1000;
  const arrows = [];
  [...document.querySelectorAll('#tutorial .tip')].forEach((tip, i) => {
    const rect = tip.getBoundingClientRect();
    const mid = { x: (rect.left + rect.right) / 2, y: (rect.top + rect.bottom) / 2 };
    let to = null;
    const kind = tip.dataset.target;
    if (kind === 'earth' || kind === 'beacon') {
      // point at the edge of the circle, on the side facing the label
      let c, r;
      if (kind === 'earth') {
        c = stage.project({ x: 0, y: 0, z: 0 });
        r = stage.screenRadius({ x: 0, y: 0, z: 0 }, STOPS[0].radius) * 0.95;
      } else {
        const b = targets.find((tg) => tg.kind === 'beacon');
        if (!b) return;
        c = b;
        r = b.r * 1.15;
      }
      const d = Math.hypot(mid.x - c.x, mid.y - c.y) || 1;
      to = { x: c.x + ((mid.x - c.x) / d) * r, y: c.y + ((mid.y - c.y) / d) * r };
    } else {
      to = topCenter(document.querySelector(`.dash-${kind === 'guide' ? 'center' : kind}`));
    }
    const alpha = Math.min(1, Math.max(0, (since - TIP_DELAYS[i] - 0.3) / 0.5));
    arrows.push({ from: closestOnRect(rect, to), to, alpha });
  });
  return arrows;
}

// ---------- main loop ----------
let last = performance.now();
let lastHint = null;
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  const t = now / 1000;

  tracker.update();
  updateCursor(now, dt);
  journey.update(t, dt, cursor.visible);
  const targets = journey.targets();
  const hovered = updateDwell(dt, targets);

  const hint = journey.hint();
  if (hint !== lastHint) { $('hint').textContent = hint; lastHint = hint; }

  stage.render();
  overlay.draw({
    t, targets, hoveredId: hovered?.id ?? null, progress, cursor,
    beams: journey.beams(), arrows: tutorialArrows(targets),
  });
  if ($('preview').classList.contains('visible')) drawPreview();

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------- camera preview (press C) ----------
const pctx = $('preview-canvas').getContext('2d');
function drawPreview() {
  const { width: pw, height: ph } = pctx.canvas;
  const video = $('video');
  pctx.fillStyle = '#000';
  pctx.fillRect(0, 0, pw, ph);
  if (tracker.running) {
    pctx.save();
    if (settings.mirror) { pctx.translate(pw, 0); pctx.scale(-1, 1); }
    pctx.drawImage(video, 0, 0, pw, ph);
    pctx.restore();
  }
  // reach box (defined in the mirrored view)
  pctx.strokeStyle = '#ffd36b';
  pctx.lineWidth = 2;
  pctx.strokeRect(
    (settings.boxX - settings.boxW / 2) * pw,
    (settings.boxY - settings.boxH / 2) * ph,
    settings.boxW * pw,
    settings.boxH * ph,
  );
  const lm = tracker.landmarks;
  if (lm) {
    lm.forEach((p, i) => {
      const x = (settings.mirror ? 1 - p.x : p.x) * pw;
      pctx.fillStyle = i === 8 ? '#ffd36b' : '#7fd1ff';
      pctx.beginPath();
      pctx.arc(x, p.y * ph, i === 8 ? 5 : 2.5, 0, Math.PI * 2);
      pctx.fill();
    });
  }
  // live status line, refreshed twice a second
  const now = performance.now();
  if (now - statusAt > 500) { statusText = tracker.status(); statusAt = now; }
  pctx.fillStyle = 'rgba(0,0,0,0.6)';
  pctx.fillRect(0, 0, pw, 24);
  pctx.fillStyle = lm ? '#8cffc8' : '#ffb27a';
  pctx.font = '13px system-ui';
  pctx.fillText(statusText, 8, 17);
}
let statusText = '';
let statusAt = 0;

// ---------- mouse fallback ----------
window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.at = performance.now();
});

// a click selects right away, no holding needed
$('scene').addEventListener('click', (e) => {
  const target = overlay.hitTest(journey.targets(), e.clientX, e.clientY);
  if (target) select(target);
});

// ---------- keyboard ----------
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
  const key = e.key.toLowerCase();
  if (key === 's') $('settings').classList.toggle('visible');
  else if (key === 'c') $('preview').classList.toggle('visible');
  else if (key === 'f') toggleFullscreen();
  else if (key === 'v') setVoice(!settings.voice);
  else if (key === 'm') setMirror(!settings.mirror);
  else if (key === 'r') journey.reset();
});

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen().catch(() => {});
}

let toastTimer = null;
function toast(msg) {
  $('toast').textContent = msg;
  $('toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 1800);
}

function setVoice(on) {
  settings.voice = on;
  $('voice').checked = on;
  if (!on) window.speechSynthesis?.cancel();
  saveSettings(settings);
  toast(on ? 'Voice on' : 'Voice off');
}

// ---------- camera lists ----------
async function fillCameraSelects() {
  let cams = [];
  try { cams = await listCameras(); } catch { /* no camera API */ }
  // prefer the saved camera, then anything that looks like the iPhone
  const preferred =
    cams.find((c) => c.deviceId === settings.cameraId) ||
    cams.find((c) => /ivcam|iphone|camo|droidcam|iriun/i.test(c.label)) ||
    cams[0];
  for (const sel of [$('start-camera'), $('settings-camera')]) {
    sel.innerHTML = '';
    cams.forEach((c, i) => {
      const opt = document.createElement('option');
      opt.value = c.deviceId;
      opt.textContent = c.label || `Camera ${i + 1}`;
      sel.appendChild(opt);
    });
    if (preferred) sel.value = preferred.deviceId;
  }
}

async function switchCamera(deviceId) {
  settings.cameraId = deviceId;
  saveSettings(settings);
  try {
    await tracker.load(); // in case the session began with "Mouse only"
    await tracker.start(deviceId);
    toast('Camera switched');
  } catch (err) {
    toast(`Camera error: ${err.message}`);
  }
}
$('settings-camera').addEventListener('change', (e) => switchCamera(e.target.value));

// ---------- start screen ----------
$('start-btn').addEventListener('click', async () => {
  const status = $('start-status');
  $('start-btn').disabled = true;
  try {
    status.textContent = 'Asking for camera access…';
    const hadLabels = (await listCameras()).some((c) => c.label);
    if (!hadLabels) {
      await unlockCameraLabels();
      await fillCameraSelects();
    }
    status.textContent = 'Loading hand tracker…';
    await tracker.load();
    const deviceId = $('start-camera').value;
    settings.cameraId = deviceId;
    saveSettings(settings);
    $('settings-camera').value = deviceId;
    await tracker.start(deviceId);
    $('preview').classList.add('visible');
    $('start').classList.add('hidden');
  } catch (err) {
    console.error(err);
    status.textContent = `Couldn't start: ${err.message}. Check the camera, or use Mouse only.`;
    $('start-btn').disabled = false;
  }
});

$('mouse-btn').addEventListener('click', () => $('start').classList.add('hidden'));
// sound effects need a click or key press before the browser lets them play
for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, unlockAudio);

// ---------- settings panel ----------
function setMirror(on) {
  settings.mirror = on;
  $('mirror').checked = on;
  pointer.reset();
  saveSettings(settings);
  toast(on ? 'Left/right flipped' : 'Left/right normal');
}

$('mirror').addEventListener('change', (e) => setMirror(e.target.checked));
$('voice').addEventListener('change', (e) => setVoice(e.target.checked));

function buildSettingsPanel() {
  $('mirror').checked = settings.mirror;
  $('voice').checked = settings.voice;

  const wrap = $('sliders');
  wrap.innerHTML = '';
  for (const s of SLIDERS) {
    const row = document.createElement('div');
    row.className = 'slider';
    row.innerHTML = `
      <div class="slider-head"><span>${s.label}</span><span class="val"></span></div>
      <input type="range" min="${s.min}" max="${s.max}" step="${s.step}" />`;
    const input = row.querySelector('input');
    const val = row.querySelector('.val');
    input.value = settings[s.key];
    val.textContent = settings[s.key];
    input.addEventListener('input', () => {
      settings[s.key] = parseFloat(input.value);
      val.textContent = input.value;
      saveSettings(settings);
    });
    wrap.appendChild(row);
  }
}

$('reset-btn').addEventListener('click', () => {
  const cameraId = settings.cameraId;
  Object.assign(settings, DEFAULTS, { cameraId });
  saveSettings(settings);
  buildSettingsPanel();
  toast('Settings reset');
});

// ---------- voice picker ----------
function fillVoiceSelect() {
  const sel = $('voice-select');
  const voices = listVoices();
  sel.innerHTML = '<option value="">Automatic (most natural)</option>';
  for (const v of voices) {
    const opt = document.createElement('option');
    opt.value = v.name;
    opt.textContent = v.name.replace(/^Microsoft /, '').replace(/ - English.*$/, '');
    sel.appendChild(opt);
  }
  sel.value = voices.some((v) => v.name === settings.voiceName) ? settings.voiceName : '';
}
$('voice-select').addEventListener('change', (e) => {
  settings.voiceName = e.target.value;
  saveSettings(settings);
  card.test();
});
$('voice-test').addEventListener('click', () => card.test());
if ('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged', fillVoiceSelect);
fillVoiceSelect();

buildSettingsPanel();
fillCameraSelects();
