"""Record every stop's story, and every solar-system fact, with a soft, natural-sounding voice.

Uses Piper (free, open-source, runs offline) with the "LJ Speech" female voice, which was
trained on public-domain recordings. Writes public/audio/<stop id>.mp3 (journey stories) and
public/audio/solar/<planet or mission>.mp3 (solar-system facts); the game plays those instead
of the browser's robotic voice.

Run again whenever you change a story in src/stops.js or a fact in src/solar-facts.js:

    python -m pip install --user piper-tts lameenc
    python scripts/make-voice.py
"""

import json
import subprocess
import urllib.request
import wave
from pathlib import Path

import lameenc
from piper import PiperVoice, SynthesisConfig

ROOT = Path(__file__).resolve().parent.parent
VOICE = "en_US-ljspeech-high"
VOICE_URL = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ljspeech/high/"
VOICE_DIR = ROOT / "scripts" / ".voice"  # the model is ~110 MB, so it isn't committed
OUT_DIR = ROOT / "public" / "audio"

# Slightly slower and calmer than the default, for a softer storytelling tone.
SETTINGS = SynthesisConfig(length_scale=1.04, noise_scale=0.55, noise_w_scale=0.7, volume=0.75)
PAUSE_SECONDS = 0.35  # gap between sentences


def download_voice():
    VOICE_DIR.mkdir(parents=True, exist_ok=True)
    for name in (f"{VOICE}.onnx", f"{VOICE}.onnx.json"):
        path = VOICE_DIR / name
        if not path.exists():
            print(f"Downloading {name}…")
            urllib.request.urlretrieve(VOICE_URL + name, path)
    return VOICE_DIR / f"{VOICE}.onnx"


def spoken_lines():
    """Ask Node for every line to record, using the same text the game reads."""
    script = (
        "Promise.all([import('./src/stops.js'), import('./src/solar-facts.js')]).then(([s, f]) =>"
        " console.log(JSON.stringify([...s.STOPS.map(x => ({ file: x.id, text: s.spokenText(x) })),"
        " ...f.solarNarrations().map(x => ({ file: 'solar/' + x.id, text: x.text }))])))"
    )
    out = subprocess.run(["node", "-e", script], cwd=ROOT, capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def to_mp3(pcm: bytes, rate: int) -> bytes:
    enc = lameenc.Encoder()
    enc.set_bit_rate(64)
    enc.set_in_sample_rate(rate)
    enc.set_channels(1)
    enc.set_quality(2)
    return enc.encode(pcm) + enc.flush()


def main():
    voice = PiperVoice.load(download_voice())
    for line in spoken_lines():
        pcm, rate = b"", 22050
        for chunk in voice.synthesize(line["text"], syn_config=SETTINGS):  # one chunk per sentence
            rate = chunk.sample_rate
            pcm += chunk.audio_int16_bytes + b"\x00\x00" * int(rate * PAUSE_SECONDS)
        out = OUT_DIR / f"{line['file']}.mp3"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(to_mp3(pcm, rate))
        print(f"{line['file']}.mp3  {len(pcm) / 2 / rate:.1f}s")


if __name__ == "__main__":
    main()
