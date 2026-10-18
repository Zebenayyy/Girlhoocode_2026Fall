// Small sound effects, made with Web Audio (no sound files needed).

let ctx = null;
let noise = null;

// Browsers only allow audio after a click/keypress; call this from one (the Start button).
export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    // one second of white noise, reused for every whoosh
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
}

// A soft "whoosh": noise through a band-pass filter that sweeps upward, fading in and out.
export function whoosh() {
  if (!ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  const dur = 0.7;

  const src = ctx.createBufferSource();
  src.buffer = noise;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(300, t);
  filter.frequency.exponentialRampToValueAtTime(3000, t + dur * 0.8);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.5, t + dur * 0.35);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t);
  src.stop(t + dur);

  // a little sparkle at the end, as the junk turns into fuel
  const tone = ctx.createOscillator();
  const toneGain = ctx.createGain();
  tone.type = 'sine';
  tone.frequency.setValueAtTime(880, t + dur * 0.75);
  tone.frequency.exponentialRampToValueAtTime(1320, t + dur);
  toneGain.gain.setValueAtTime(0.0001, t + dur * 0.75);
  toneGain.gain.exponentialRampToValueAtTime(0.12, t + dur * 0.8);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
  tone.connect(toneGain).connect(ctx.destination);
  tone.start(t + dur * 0.75);
  tone.stop(t + dur + 0.3);
}
