# Story recordings

The game plays `<stop id>.mp3` from this folder for each stop's story. If a file is missing,
it falls back to the browser's built-in voice.

These were made with `scripts/make-voice.py`, which uses Piper (free, open-source text-to-speech)
with the "LJ Speech" voice, trained on public-domain recordings. Each file reads the first two
sentences of that stop's story in `src/stops.js`.

**Changed a story?** Re-record them all:

    python -m pip install --user piper-tts lameenc
    python scripts/make-voice.py

**Want real voices instead?** Record your own (about 15 seconds each) and save them here with
the same names: earth, moon, sun, pluto, comet, stars, horsehead, pulsar, andromeda, spiral (.mp3).
