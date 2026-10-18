// Camera (e.g. the iPhone through iVCam) + MediaPipe hand tracking.
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

const BASE = import.meta.env.BASE_URL;
const INDEX_TIP = 8;
const DETECTION_INTERVAL_MS = 1000 / 30;

export async function listCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === 'videoinput');
}

// Ask once so the browser reveals camera names (needed to find "iVCam" in the list).
export async function unlockCameraLabels() {
  const s = await navigator.mediaDevices.getUserMedia({ video: true });
  s.getTracks().forEach((t) => t.stop());
}

export function createHandTracker(video) {
  let landmarker = null;
  let stream = null;
  let lastVideoTime = -1;
  let lastDetectionAt = -Infinity;
  let latest = null; // { x, y } index fingertip in raw camera coords (0..1), or null
  let landmarks = null; // all 21 points of the tracked hand, for the preview
  let delegateUsed = '';
  let detections = 0; // frames analyzed, for the debug readout
  let detectStart = performance.now();

  async function load() {
    if (landmarker) return;
    const fileset = await FilesetResolver.forVisionTasks(`${BASE}mediapipe/wasm`);
    const options = (delegate) => ({
      baseOptions: { modelAssetPath: `${BASE}models/hand_landmarker.task`, delegate },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.4,
      minHandPresenceConfidence: 0.4,
      minTrackingConfidence: 0.4,
    });
    // run on the CPU so it doesn't compete with the 3D graphics for the GPU (smoother overall);
    // fall back to the GPU only if the CPU version can't start
    try {
      landmarker = await HandLandmarker.createFromOptions(fileset, options('CPU'));
      delegateUsed = 'CPU';
    } catch (err) {
      console.warn('Hand tracker: CPU failed, trying GPU', err);
      landmarker = await HandLandmarker.createFromOptions(fileset, options('GPU'));
      delegateUsed = 'GPU';
    }
  }

  async function start(deviceId) {
    stop();
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30, max: 30 },
      },
    });
    video.srcObject = stream;
    await video.play();
  }

  function stop() {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    latest = null;
    landmarks = null;
    lastVideoTime = -1;
    lastDetectionAt = -Infinity;
  }


  // Call every frame. Only runs detection when the camera has a new frame.
  function update() {
    if (!landmarker || !stream || video.readyState < 2) return;
    const now = performance.now();
    if (now - lastDetectionAt < DETECTION_INTERVAL_MS) return;
    if (video.currentTime === lastVideoTime) return;
    lastVideoTime = video.currentTime;
    lastDetectionAt = now;
    const result = landmarker.detectForVideo(video, now);
    detections++;
    landmarks = result.landmarks?.[0] ?? null;
    latest = landmarks ? { x: landmarks[INDEX_TIP].x, y: landmarks[INDEX_TIP].y } : null;
  }

  return {
    load,
    start,
    stop,
    update,
    get fingertip() { return latest; },
    get landmarks() { return landmarks; },
    get running() { return !!stream; },
    get loaded() { return !!landmarker; },
    // a one-line status for the camera preview
    status() {
      const secs = (performance.now() - detectStart) / 1000;
      const rate = secs > 0 ? Math.round(detections / secs) : 0;
      detections = 0;
      detectStart = performance.now();
      if (!stream) return 'No camera running: press Start (not Mouse only)';
      if (!landmarker) return 'Hand tracker not loaded';
      if (video.readyState < 2) return 'Waiting for video…';
      return `${video.videoWidth}x${video.videoHeight} · ${delegateUsed} · ${rate} checks/s · ${landmarks ? 'HAND FOUND' : 'no hand'}`;
    },
  };
}

// One Euro filter: smooths jitter when the hand is still, stays responsive when it moves fast.
class OneEuro {
  constructor(minCutoff, beta) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.x = null;
    this.dx = 0;
  }
  static alpha(cutoff, dt) {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dt);
  }
  filter(value, dt) {
    if (this.x === null) { this.x = value; return value; }
    const dValue = (value - this.x) / dt;
    this.dx += OneEuro.alpha(1, dt) * (dValue - this.dx);
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
    this.x += OneEuro.alpha(cutoff, dt) * (value - this.x);
    return this.x;
  }
  reset() { this.x = null; this.dx = 0; }
}

// Turns a fingertip in camera space into a cursor on the wall.
// The "reach box" is a rectangle in the (mirrored) camera view: moving your hand
// across it moves the cursor across the whole wall, like a giant touchpad.
export function createPointer() {
  const fx = new OneEuro(1, 0.004);
  const fy = new OneEuro(1, 0.004);

  function map(tip, settings, screen, dt) {
    const camX = settings.mirror ? 1 - tip.x : tip.x;
    const u = (camX - (settings.boxX - settings.boxW / 2)) / settings.boxW;
    const v = (tip.y - (settings.boxY - settings.boxH / 2)) / settings.boxH;
    const sx = clamp01(u) * screen.w;
    const sy = clamp01(v) * screen.h;
    // steadiness 0..1 -> cutoff 5 Hz (twitchy) .. 0.3 Hz (very smooth)
    const cutoff = 5 - settings.steadiness * 4.7;
    fx.minCutoff = fy.minCutoff = cutoff;
    return { x: fx.filter(sx, dt), y: fy.filter(sy, dt) };
  }

  function reset() { fx.reset(); fy.reset(); }

  return { map, reset };
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));
