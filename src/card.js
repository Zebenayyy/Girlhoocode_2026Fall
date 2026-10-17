// Info card on the wall + the story read aloud with the browser's built-in voice.

const LINGER_AFTER_SPEECH_MS = 8000;

export function createCard(el) {
  let hideTimer = null;
  let voice = null;

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

  function scheduleHide(ms) {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, ms);
  }

  function show(obj, objScreenX, screenW, speak) {
    el.innerHTML = `
      <div class="card-name">${obj.name}</div>
      <div class="card-woman">${obj.woman}</div>
      <div class="card-headline">${obj.headline}</div>
      <p class="card-story">${obj.story}</p>`;
    // put the card on the side of the wall away from the object
    el.classList.toggle('left', objScreenX > screenW / 2);
    el.classList.add('visible');

    if (speak && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(`${obj.name}. ${obj.woman}. ${obj.story}`);
      if (voice) u.voice = voice;
      u.rate = 0.95;
      u.onend = () => scheduleHide(LINGER_AFTER_SPEECH_MS);
      clearTimeout(hideTimer);
      speechSynthesis.speak(u);
    } else {
      scheduleHide(obj.story.length * 70 + LINGER_AFTER_SPEECH_MS);
    }
  }

  function hide() {
    clearTimeout(hideTimer);
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    el.classList.remove('visible');
    el.dispatchEvent(new Event('hidden'));
  }

  return { show, hide, get visible() { return el.classList.contains('visible'); } };
}
