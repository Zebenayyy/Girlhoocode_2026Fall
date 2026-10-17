// Info card + the story read aloud with the browser's built-in voice.

const MS_PER_WORD = 400; // used when the voice is off, to give people time to read

export function createCard(el, getVoiceOn) {
  let voice = null;
  let doneTimer = null;
  let token = 0;

  function pickVoice() {
    const voices = speechSynthesis.getVoices();
    voice =
      voices.find((v) => /en/i.test(v.lang) && /female|samantha|zira|aria|jenny|google us/i.test(v.name)) ||
      voices.find((v) => /^en/i.test(v.lang)) ||
      null;
  }
  if ('speechSynthesis' in window) {
    pickVoice();
    speechSynthesis.addEventListener('voiceschanged', pickVoice);
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
      <div class="card-name">${stop.name}</div>
      <div class="card-woman">${stop.woman}</div>
      <div class="card-headline">${stop.headline}</div>
      <p class="card-story">${stop.story}</p>`;
    el.classList.add('visible');

    const words = `${stop.woman} ${stop.story}`.split(/\s+/).length;
    clearTimeout(doneTimer);
    if (getVoiceOn() && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(`${stop.woman}. ${stop.story}`);
      if (voice) u.voice = voice;
      u.rate = 0.98;
      u.onend = done;
      u.onerror = done;
      speechSynthesis.speak(u);
      // safety net: some browsers occasionally never fire onend
      doneTimer = setTimeout(done, words * MS_PER_WORD + 6000);
    } else {
      doneTimer = setTimeout(done, words * MS_PER_WORD);
    }
  }

  function hide() {
    token++;
    clearTimeout(doneTimer);
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    el.classList.remove('visible');
  }

  return { show, hide, get visible() { return el.classList.contains('visible'); } };
}
