# Her Sky

An interactive space exhibit where you fly through the universe, meet the women behind its discoveries, and clean up space junk along the way. You control it by pointing at a projected sky with your hand.

**Try it:** https://zebenayyy.github.io/Girlhoocode_2026Fall/ (click **Mouse only** to play without a camera)

Made for Girls Hoo Hack 2026 by Zebenai Melaku and Kiwakibt Melaku.

## Inspiration
Most of the names people learn in astronomy class are men's. Yet women found what stars are made of, discovered the first pulsar, gave us a way to measure distances across the universe, and calculated the path to the Moon. We wanted kids to meet those women in a way they'd remember: not by reading a list, but by flying through space and seeing each discovery up close.

We also kept coming back to a less famous problem in space: **space junk**. Tens of thousands of pieces of debris are tracked circling Earth, from dead satellites to a tool bag lost on a spacewalk. So we built the journey around a mission: your ship runs on recycled space junk, and by the end, Earth's orbit is clean.

## What it does
**Her Sky** is an interactive space exhibit that you control by pointing at a projected sky with your hand.

- **The journey:** Your ship flies outward from Earth to the Moon, the Sun, Pluto, a comet, the stars, the Horsehead Nebula, a pulsar, the Andromeda Galaxy, and a distant spiral galaxy. At each stop you point at the object to hear the story of the woman behind its discovery, with her portrait and a short bio, from Mae Jemison and Katherine Johnson to Jocelyn Bell Burnell and Vera Rubin.
- **The mission:** Space junk floats by at every stop. Point at it to pull it in with a tractor beam and recycle it into fuel. You need a full tank to travel on. At the end, the ten women form a new constellation, and you fly home to an Earth with a clean orbit.
- **The solar system explorer:** A second mode with all eight planets and the spacecraft Perseverance, Cassini, and Voyager 1. Point at a planet to fly to it and hear facts about it; pinch and move your hand to rotate the view; pinch and push in or pull back to zoom.

## Why two experiences?
The story is a guided path with a beginning, middle, and end, so a visitor always knows what to do next. But many people, especially kids, finish it wanting more. The solar system explorer is the open, curious next step: once you've finished the story, you can explore the planets at your own pace and keep learning.

## Designed like a museum exhibit
Our target audience is kids, and we imagined Her Sky in a museum or science center: a projector on the wall, a camera facing the visitor, and a line of people waiting their turn. That shaped many of our decisions:
- No controller or touchscreen: you just point. A short how-to screen with arrows teaches the controls, and practicing on it starts the game.
- Every interaction is "point and hold until the ring fills," so it's hard to trigger anything by accident.
- Stories are short and read aloud in a calm, soft voice, so younger kids don't have to read everything.
- A full run takes about three minutes, and it resets itself when a visitor walks away, ready for the next person.

## How we built it
- **3D graphics:** three.js (WebGL) in the browser, built with Vite. Earth, the Moon, and Pluto use real NASA surface maps; the background is NASA's Deep Star Maps of the real Milky Way; the Horsehead Nebula is Hubble's actual image. Galaxies are made from tens of thousands of star particles, and the Sun, comet, and pulsar are animated with custom shaders and particles.
- **Hand tracking:** MediaPipe Hand Landmarker runs in the browser and follows the index fingertip from a phone used as a webcam. We smooth the movement with a One Euro filter and map a "reach box" in front of the visitor to the whole wall. Pinch detection powers rotating and zooming in the solar system.
- **Voice and sound:** Each story is narrated with an open-source neural voice (Piper) trained on public-domain recordings, and Web Audio makes the whoosh when you collect junk.
- **Hosting:** GitHub Pages, deployed automatically with GitHub Actions, so anyone can try it from a link.

## Challenges we ran into
- **Hand tracking in a real room.** The cursor moved the opposite way from our hands because some camera apps mirror the picture, so we added a one-key flip. We also had to work out where to place the camera, how far away people should stand, and how lighting affects tracking. Telling a "point" apart from a "pinch" took tuning too.
- **Rendering real space images.** NASA's Milky Way map came as a huge high-dynamic-range file that we had to convert, darken, and flip so the sky looked right. Fitting a planet, a portrait, a story card, and the controls on one screen without covering each other took many rounds.
- **Choosing the women.** There are far more brilliant women in astronomy than stops in a three-minute journey. Narrowing it to ten, each tied to something you can actually fly to, was hard, and so was checking every fact.
- **Merging two projects.** The solar system explorer was built separately, so combining it with the main story meant merging our code, giving both modes the same pointing controls and narrator voice, and making sure each mode cleanly hides the other.

## What we learned
We learned how to build 3D scenes in the browser, how computer-vision hand tracking works and where it struggles, how to design for kids and for a public space instead of a single user at a desk, how to merge work from two branches in Git, and how to properly credit and license the images and data we used.

## What's next for Her Sky
- More interactive moments, such as mini-games at each stop instead of only collecting junk.
- More information about each planet, and more women and discoveries to unlock.
- A VR headset version, so visitors can stand inside the journey instead of pointing at a wall.

## How to play
- **With a camera:** point at something and hold still until the ring fills. In the solar system, pinch and move to rotate, and pinch and push in or pull back to zoom.
- **With a mouse:** click to select. In the solar system, drag to rotate and scroll to zoom.
- **Keys:** S settings · C camera view · F fullscreen · V voice on/off · M flip left/right · R restart · P solar system

## Run it locally
```
npm install
npm run dev
```
Then open http://localhost:5173. A phone works as the webcam with an app such as iVCam or Camo.

## Credits
- Earth, Moon and Pluto maps: NASA (Blue Marble, LRO, New Horizons)
- Milky Way background: NASA/Goddard Scientific Visualization Studio Deep Star Maps (with ESA/Gaia/DPAC)
- Horsehead Nebula: NASA, ESA, and the Hubble Heritage Team (STScI/AURA)
- Portraits: Wikimedia Commons (see `public/portraits/CREDITS.md`)
- Narrator voice: Piper text-to-speech with the LJ Speech voice (public-domain dataset)
- Solar-system textures: via [cdmain/3d-solar-system](https://github.com/cdmain/3d-solar-system)
