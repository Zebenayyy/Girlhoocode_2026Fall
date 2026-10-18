import { spokenText } from './stops.js';

// Info card + the story read aloud.
// If a recording exists at public/audio/<stop id>.mp3 it plays that; otherwise the
// browser's most human-sounding voice reads the story.

const BASE = import.meta.env.BASE_URL;
const MS_PER_WORD = 400; // used when the voice is off, to give people time to read

// Higher score = sounds more human. Edge's "Natural" voices are the best free option.
function voiceScore(v) {
  if (!/^en/i.test(v.lang)) return -1;
  let s = 0;
  if (/natural|neural/i.test(v.name)) s += 100;
  else if (/online/i.test(v.name)) s += 60;
  else if (/google/i.test(v.name)) s += 40;
  if (/aria|jenny|michelle|ava|emma|sonia|libby|natasha|clara|samantha|zira|google us english/i.test(v.name)) s += 10;
  if (/en-us/i.test(v.lang)) s += 2;
  return s;
}

export function listVoices() {
  if (!('speechSynthesis' in window)) return [];
  return speechSynthesis.getVoices().filter((v) => voiceScore(v) >= 0).sort((a, b) => voiceScore(b) - voiceScore(a));
}

export function createCard(el, settings) {
  let doneTimer = null;
  let token = 0;
  let audio = null;

  function pickVoice() {
    const voices = listVoices();
    return voices.find((v) => v.name === settings.voiceName) || voices[0] || null;
  }

  function speak(text, onEnd) {
    if (!('speechSynthesis' in window)) return false;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) u.voice = voice;
    u.rate = 0.92; // a little slower and lower sounds less harsh
    u.pitch = 0.95;
    u.onend = onEnd;
    u.onerror = onEnd;
    speechSynthesis.speak(u);
    return true;
  }

  function stopSound() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (audio) { audio.pause(); audio = null; }
  }

  // onDone fires once, when the story has been read (or after a reading delay).
  function show(stop, onDone) {
    const my = ++token;
    let fired = false;
    const done = () => {
      if (fired || my !== token) return;
      fired = true;
      clearTimeout(doneTimer);
      onDone?.();
    };

    el.innerHTML = `
      ${stop.photo ? `<img class="card-photo" src="${BASE}${stop.photo}" alt="Portrait of ${stop.woman}">` : ''}
      <div class="card-body">
        <div class="card-name">${stop.name}</div>
        <div class="card-woman">${stop.woman}</div>
        <div class="card-headline">${stop.headline}</div>
        <p class="card-story">${stop.story}</p>
        ${stop.photoCredit ? `<div class="card-credit">${stop.photoCredit}</div>` : ''}
      </div>`;
    el.classList.toggle('no-photo', !stop.photo);
    // if the portrait can't load, fall back to the text-only card
    el.querySelector('.card-photo')?.addEventListener('error', (e) => {
      e.target.remove();
      el.classList.add('no-photo');
    });
    el.classList.add('visible');

    // the voice reads the first two sentences (see spokenText in stops.js)
    const text = spokenText(stop);
    const words = stop.story.split(/\s+/).length; // reading time for the full card
    clearTimeout(doneTimer);
    stopSound();

    if (!settings.voice) {
      doneTimer = setTimeout(done, words * MS_PER_WORD);
      return;
    }

    // safety net in case neither the recording nor the voice reports that it finished
    doneTimer = setTimeout(done, words * MS_PER_WORD + 15000);

    const useVoice = () => {
      if (my !== token) return;
      if (!speak(text, done)) {
        clearTimeout(doneTimer);
        doneTimer = setTimeout(done, words * MS_PER_WORD);
      }
    };

    audio = new Audio(`${BASE}audio/${stop.id}.mp3`);
    audio.onended = done;
    audio.onerror = useVoice; // no recording for this stop -> computer voice
    audio.play().catch(() => {}); // a missing file is handled by onerror
  }

  function hide() {
    token++;
    clearTimeout(doneTimer);
    stopSound();
    el.classList.remove('visible');
  }

  function test() {
    stopSound();
    speak('Hello! I will be your guide on this journey through Her Sky.', () => {});
  }

  // Read something aloud outside the story card (the solar-system facts): plays the recording
  // at `src` if there is one, otherwise the browser voice. `force` plays it even with voice off.
  function narrate(src, text, { force = false } = {}) {
    stopSound();
    if (!settings.voice && !force) return;
    const mine = (audio = new Audio(src));
    mine.onerror = () => { if (audio === mine) speak(text, () => {}); };
    mine.play().catch(() => {}); // a missing file is handled by onerror
  }

  return { show, hide, test, narrate, silence: stopSound, get visible() { return el.classList.contains('visible'); } };
}
