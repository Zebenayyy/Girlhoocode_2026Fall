// The mission: fly your ship outward from Earth, learning one woman's discovery at each stop
// and collecting space junk that gets recycled into fuel. At the end the ten women form a
// constellation, you fly home, and Earth's orbit is clean.
//
//   title    orbiting a junk-covered Earth  -> point at Earth to begin
//   tutorial how-to-play screen             -> point at "I'm ready!" (practice for pointing)
//   arrived  parked next to an object       -> point at it to hear her story; grab the junk
//   story    card + voice                   -> story done AND fuel full -> "next" beacon
//   next     beacon on screen               -> point at it to fly on (uses the fuel)
//   flying   camera travels
//   finale   the constellation              -> collect the last junk, then fly home
//   home     Earth's orbit is clean         -> point at the beacon for a new journey
import * as THREE from 'three';
import { STOPS, SUN_POS, FINALE_POS } from './stops.js';
import { BUILDERS, createWarp, glowSprite, textSprite } from './bodies.js';
import { JUNK_INFO, JUNK_ORDER, makeJunk, createJunkCloud } from './junk.js';
import { FOV } from './stage.js';
import { whoosh } from './sfx.js';

const VIEW_DIR = new THREE.Vector3(0.28, 0.12, 1).normalize(); // camera sits on this side of each object
const FRAME = 4.6; // camera distance in object radii
const IDLE_RESET_MS = 75000;
const HOME_RESET_MS = 40000;

const JUNK_PER_STOP = 3;
export const TOTAL_JUNK = JUNK_PER_STOP * (STOPS.length + 1); // every stop + the finale
// Where junk floats on screen (x, y as fractions), clear of the object, the card and the dashboard.
const JUNK_SPOTS = [[0.1, 0.5], [0.5, 0.17], [0.24, 0.74]];
const FINALE_JUNK_SPOTS = [[0.12, 0.72], [0.88, 0.7], [0.5, 0.79]]; // below the constellation and its text

const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const v3 = (a) => new THREE.Vector3(...a);
const clamp01 = (k) => Math.min(1, Math.max(0, k));

// Constellation outline (x, y in -1..1), one point per woman, in journey order.
const CROWN = [
  [-0.95, -0.25], [-0.62, 0.3], [-0.3, 0.02], [0, 0.62], [0.3, 0.02],
  [0.62, 0.3], [0.95, -0.25], [0.48, -0.55], [0, -0.38], [-0.48, -0.55],
];
const FINALE_DIST = 1250;

export function createJourney({ stage, card, ui }) {
  const { scene, camera } = stage;

  // ---------- build the world ----------
  const journeyGroup = new THREE.Group();
  scene.add(journeyGroup);
  journeyGroup.add(new THREE.AmbientLight(0xffffff, 0.06));
  const sunLight = new THREE.PointLight(0xfff2dd, 3.2, 0, 0);
  sunLight.position.copy(v3(SUN_POS));
  journeyGroup.add(sunLight);

  const bodies = STOPS.map((s) => {
    const body = BUILDERS[s.kind](s, { sunPos: SUN_POS });
    body.group.position.copy(v3(s.pos));
    journeyGroup.add(body.group);
    return body;
  });
  const warp = createWarp(journeyGroup);
  const cloud = createJunkCloud(v3(STOPS[0].pos), STOPS[0].radius);
  journeyGroup.add(cloud.group);

  // finale constellation: hidden until the end
  const finaleCenter = v3(FINALE_POS);
  const constellation = new THREE.Group();
  constellation.position.copy(finaleCenter);
  constellation.visible = false;
  journeyGroup.add(constellation);
  const conStars = CROWN.map(([x, y], i) => {
    const g = new THREE.Group();
    g.position.set(x * 520, y * 330, 0);
    g.add(glowSprite(0xfff1c9, 110, 1));
    g.add(glowSprite(0xffd36b, 30, 1));
    const label = textSprite(STOPS[i].woman, { height: 38, color: '#ffe3a3', font: '600 60px system-ui, sans-serif' });
    label.position.set(0, -58, 0);
    g.add(label);
    g.scale.setScalar(0.001);
    constellation.add(g);
    return g;
  });
  const linePts = [...CROWN, CROWN[0]].map(([x, y]) => new THREE.Vector3(x * 520, y * 330, 0));
  const conLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(linePts),
    new THREE.LineBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  constellation.add(conLine);

  // ---------- camera ----------
  const look = new THREE.Vector3();
  const right = new THREE.Vector3();
  let orbit = 0;

  function viewOf(i) {
    const s = STOPS[i];
    const center = v3(s.pos);
    const pos = center.clone().addScaledVector(VIEW_DIR, s.radius * FRAME);
    // look a little to the right of the object, so it sits left of center and the card fits on the right
    right.crossVectors(VIEW_DIR, new THREE.Vector3(0, 1, 0)).normalize().negate();
    const target = center.clone().addScaledVector(right, s.radius * 1.55);
    return { pos, look: target, dist: s.radius * FRAME };
  }

  function finaleView() {
    const look = finaleCenter.clone().add(new THREE.Vector3(0, -60, 0));
    return { pos: look.clone().add(new THREE.Vector3(0, 0, FINALE_DIST)), look, dist: FINALE_DIST };
  }

  // the slow orbit around Earth used on the title and home screens
  function orbitView() {
    const e = STOPS[0];
    const d = e.radius * FRAME * 1.25;
    return {
      pos: new THREE.Vector3(e.pos[0] + Math.sin(orbit) * d, e.pos[1] + d * 0.22, e.pos[2] + Math.cos(orbit) * d),
      look: v3(e.pos),
    };
  }

  let flight = null;
  let flightTo = -1; // stop index we're flying to, when it isn't simply the next one (flying home)
  function flyTo(view, onArrive, { drain = false } = {}) {
    const from = camera.position.clone();
    const fromLook = look.clone();
    const dist = from.distanceTo(view.pos);
    const ctrl = from.clone().lerp(view.pos, 0.5).add(new THREE.Vector3(0, dist * 0.08, 0));
    flight = {
      from, fromLook, ctrl, to: view.pos, toLook: view.look, t: 0,
      dur: 2.6 + 0.4 * Math.log10(Math.max(dist, 10)), onArrive, drain, startFuel: fuel,
    };
  }

  function updateFlight(dt) {
    const f = flight;
    f.t += dt;
    const k = Math.min(1, f.t / f.dur);
    const e = ease(k);
    // quadratic bezier for a gentle arc
    const a = f.from.clone().lerp(f.ctrl, e);
    const b = f.ctrl.clone().lerp(f.to, e);
    camera.position.copy(a.lerp(b, e));
    look.copy(f.fromLook).lerp(f.toLook, ease(Math.min(1, k * 1.4)));
    camera.fov = FOV + 16 * Math.sin(Math.PI * k); // a little "warp" stretch mid-flight
    camera.updateProjectionMatrix();
    if (f.drain) setFuel(f.startFuel * (1 - k)); // the trip burns the recycled fuel
    if (k >= 1) {
      flight = null;
      camera.fov = FOV;
      camera.updateProjectionMatrix();
      camera.lookAt(look);
      camera.updateMatrixWorld();
      f.onArrive?.();
    }
  }

  // ---------- fuel & junk ----------
  let fuel = 0;
  let collected = 0;
  let junkSeq = 0;
  let junk = []; // pieces floating at the current stop
  const seenTypes = new Set();
  let now = 0; // scene time, seconds

  function setFuel(f) {
    fuel = clamp01(f);
    ui.setFuel(fuel);
  }

  function clearJunk() {
    junk.forEach((j) => journeyGroup.remove(j.group));
    junk = [];
  }

  // Float a few pieces of junk between the camera and the object, at fixed spots on screen.
  function spawnJunk(dist, spots = JUNK_SPOTS) {
    clearJunk();
    const d = dist * 0.55;
    const size = dist * 0.045;
    spots.forEach(([fx, fy], k) => {
      const type = JUNK_ORDER[junkSeq++ % JUNK_ORDER.length];
      const piece = makeJunk(type, size);
      const p = new THREE.Vector3(fx * 2 - 1, 1 - fy * 2, 0.5).unproject(camera).sub(camera.position).normalize();
      const base = camera.position.clone().addScaledVector(p, d * (0.9 + k * 0.1));
      piece.group.position.copy(base);
      piece.group.scale.setScalar(0.0001);
      journeyGroup.add(piece.group);
      junk.push({
        ...piece, id: `junk-${junkSeq}`, type, base, size,
        phase: Math.random() * Math.PI * 2, spin: 0.3 + Math.random() * 0.5,
        spawnT: now + k * 0.25, collectT: null,
      });
    });
  }

  function collect(piece) {
    if (piece.collectT !== null) return;
    piece.collectT = now;
    whoosh();
    const fwd = new THREE.Vector3();
    camera.getWorldDirection(fwd);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    const d = camera.position.distanceTo(piece.base);
    piece.intake = camera.position.clone().addScaledVector(fwd, d * 0.3).addScaledVector(up, -d * 0.16);
  }

  function finishCollect(piece) {
    journeyGroup.remove(piece.group);
    junk = junk.filter((j) => j !== piece);
    collected++;
    setFuel(fuel + 1 / JUNK_PER_STOP);
    ui.setCollected(collected, TOTAL_JUNK);
    const info = JUNK_INFO[piece.type];
    ui.recycled(info.name, seenTypes.has(piece.type) ? null : info.fact);
    seenTypes.add(piece.type);
  }

  function updateJunk(dt) {
    const up = new THREE.Vector3(0, 1, 0);
    for (const j of [...junk]) {
      const s0 = j.size / 2;
      if (j.collectT !== null) {
        // pulled in by the tractor beam, shrinking into the ship
        const k = clamp01((now - j.collectT) / 0.7);
        j.group.position.copy(j.base).lerp(j.intake, ease(k));
        j.group.scale.setScalar(s0 * (1 - 0.85 * k));
        j.glow.material.opacity = 0.35 + 0.6 * k;
        if (k >= 1) finishCollect(j);
        continue;
      }
      const k = clamp01((now - j.spawnT) / 0.8);
      j.group.scale.setScalar(Math.max(0.0001, s0 * ease(k)));
      j.group.position.copy(j.base).addScaledVector(up, Math.sin(now * 0.8 + j.phase) * j.size * 0.15);
      j.model.rotation.x += dt * j.spin * 0.6;
      j.model.rotation.y += dt * j.spin;
      j.glow.material.opacity = 0.25 + 0.12 * Math.sin(now * 3 + j.phase);
    }
  }

  // ---------- story state ----------
  let state = 'title';
  let index = 0;
  let finaleT = 0;
  let storyDone = false;
  let homeAt = 0;
  let lastActivity = performance.now();
  let enabled = true;

  function goTitle() {
    state = 'title';
    index = 0;
    card.hide();
    clearJunk();
    cloud.group.visible = true; // a fresh, junk-covered Earth for the next pilot
    collected = 0;
    junkSeq = 0;
    seenTypes.clear();
    setFuel(0);
    ui.setCollected(0, TOTAL_JUNK);
    ui.setProgress(-1);
    ui.setChapter(null);
    ui.setTitle(true);
    ui.setFinale(false);
    ui.setHome(false);
    ui.setTutorial(false);
    constellation.visible = false;
  }

  let tutorialAt = 0;
  function showTutorial() {
    state = 'tutorial';
    tutorialAt = performance.now();
    ui.setTitle(false);
    ui.setTutorial(true);
  }

  function beginStory(i) {
    state = 'story';
    index = i;
    storyDone = false;
    ui.setProgress(i);
    ui.setChapter(i);
    ui.setTitle(false);
    card.show(STOPS[i], () => { if (index === i) storyDone = true; });
  }

  function arrive(i) {
    state = 'arrived';
    index = i;
    storyDone = false;
    ui.setChapter(i);
    spawnJunk(viewOf(i).dist);
  }

  function startJourney() {
    ui.setTitle(false);
    ui.setTutorial(false);
    state = 'flying';
    flyTo(viewOf(0), () => arrive(0));
  }

  function flyNext() {
    card.hide();
    clearJunk();
    if (index >= STOPS.length - 1) {
      state = 'flying';
      ui.setChapter(null);
      ui.travel('the stars of Her Sky');
      constellation.visible = true;
      flyTo(finaleView(), () => {
        state = 'finale';
        finaleT = 0;
        ui.setFinale(true);
        spawnJunk(FINALE_DIST, FINALE_JUNK_SPOTS);
      }, { drain: true });
      return;
    }
    const next = index + 1;
    state = 'flying';
    ui.travel(STOPS[next].name, STOPS[next].distance);
    flyTo(viewOf(next), () => arrive(next), { drain: true });
  }

  // complete = true when the mission is finished; false when resetting after nobody's around
  function flyHome(complete) {
    ui.setFinale(false);
    card.hide();
    clearJunk();
    state = 'flying';
    ui.setChapter(null);
    ui.travel('home', complete ? 'Burning your recycled fuel' : '');
    flightTo = 0;
    flyTo(orbitView(), () => {
      flightTo = -1;
      if (!complete) { goTitle(); return; }
      index = 0;
      state = 'home';
      homeAt = performance.now();
      cloud.group.visible = false; // you cleaned it up!
      ui.setHome(true, collected);
    }, { drain: complete });
  }

  // ---------- pointing targets ----------
  // Each target: { id, x, y, r, kind: 'object' | 'junk' | 'beacon', label, onSelect }
  function beaconTarget(label, onSelect) {
    const { w, h } = stage.size();
    return { id: `beacon-${label}`, kind: 'beacon', x: w * 0.5, y: h * 0.74, r: Math.min(w, h) * 0.065, label, onSelect };
  }

  function objectTarget(i, onSelect) {
    const center = v3(STOPS[i].pos);
    const p = stage.project(center);
    if (!p.visible) return null;
    const { w, h } = stage.size();
    const r = Math.max(stage.screenRadius(center, STOPS[i].radius), Math.min(w, h) * 0.06);
    return { id: STOPS[i].id, kind: 'object', x: p.x, y: p.y, r, onSelect };
  }

  function junkTargets() {
    const { w, h } = stage.size();
    return junk
      .filter((j) => j.collectT === null && now >= j.spawnT)
      .map((j) => {
        const p = stage.project(j.group.position);
        const r = Math.max(stage.screenRadius(j.group.position, j.size * 0.75), Math.min(w, h) * 0.05);
        return { id: j.id, kind: 'junk', x: p.x, y: p.y, r, onSelect: () => collect(j) };
      });
  }

  const junkLeft = () => junk.filter((j) => j.collectT === null).length;
  const fuelFull = () => fuel >= 0.999;
  const finaleShown = () => finaleT > CROWN.length * 0.45 + 1.5;

  function targets() {
    if (!enabled) return [];
    if (flight) return [];
    if (state === 'title') return [objectTarget(0, showTutorial)].filter(Boolean);
    if (state === 'tutorial') return performance.now() - tutorialAt > 3000 ? [beaconTarget("I'm ready!", startJourney)] : [];
    if (state === 'arrived') return [...junkTargets(), objectTarget(index, () => beginStory(index))].filter(Boolean);
    if (state === 'story') return junkTargets();
    if (state === 'next') {
      const label = index >= STOPS.length - 1 ? 'See Her Sky' : `Fly to ${STOPS[index + 1].name}`;
      return [beaconTarget(label, flyNext)];
    }
    if (state === 'finale') {
      if (!finaleShown()) return [];
      return fuelFull() ? [beaconTarget('Fly home', () => flyHome(true))] : junkTargets();
    }
    if (state === 'home' && performance.now() - homeAt > 3000) return [beaconTarget('New journey', goTitle)];
    return [];
  }

  function hint() {
    if (!enabled) return '';
    if (flight) return '';
    const left = junkLeft();
    if (state === 'title') return 'Point at Earth and hold, or move your mouse onto it and click';
    if (state === 'tutorial') return 'Move to the glowing light and click, or point and hold';
    if (state === 'arrived') {
      return left ? `Grab the junk for fuel, and point at ${STOPS[index].name} to hear her story` : `Point at ${STOPS[index].name} to hear her story`;
    }
    if (state === 'story') {
      if (left) return `Grab the space junk to refuel: ${left} left`;
      return 'Fuel full! Listen to her story…';
    }
    if (state === 'next') return 'Point at the glowing light to travel further';
    if (state === 'finale' && finaleShown()) return fuelFull() ? 'Point at the light to fly home' : `Collect the last junk to fuel your trip home: ${left} left`;
    return '';
  }

  // Screen positions of junk being pulled in, for drawing tractor beams.
  function beams() {
    return junk.filter((j) => j.collectT !== null).map((j) => stage.project(j.group.position));
  }

  // ---------- per frame ----------
  function update(t, dt, cursorActive) {
    if (!enabled) return;
    now = t;
    const ms = performance.now();
    if (cursorActive) lastActivity = ms;
    const busy = state === 'title' || state === 'home' || state === 'tutorial' || flight;
    if (!busy && ms - lastActivity > IDLE_RESET_MS) flyHome(false);
    if (state === 'home' && ms - homeAt > HOME_RESET_MS && ms - lastActivity > 10000) goTitle();
    if (state === 'tutorial' && ms - lastActivity > IDLE_RESET_MS / 2) goTitle();

    if (state === 'story' && storyDone && fuelFull()) state = 'next';

    if (flight) {
      updateFlight(dt);
    } else if (state === 'title' || state === 'home' || state === 'tutorial') {
      orbit += dt * 0.06;
      const v = orbitView();
      camera.position.copy(v.pos);
      look.copy(v.look);
    }
    camera.lookAt(look);

    if (state === 'finale') {
      finaleT += dt;
      conStars.forEach((s, i) => {
        const k = clamp01((finaleT - i * 0.45) / 0.6);
        s.scale.setScalar(Math.max(0.001, ease(k)));
      });
      conLine.material.opacity = clamp01((finaleT - CROWN.length * 0.45) / 1.5) * 0.6;
    }

    // show the current stop, plus the next one while flying to it, so faraway objects don't clutter the view
    const sunIndex = STOPS.findIndex((s) => s.kind === 'sun');
    bodies.forEach((b, i) => {
      const show = i === index || (flight && i === index + 1) || i === flightTo || (i === sunIndex && index <= sunIndex + 1);
      b.group.visible = show;
      if (show) b.update(t, camera);
    });
    if (cloud.group.visible && (index <= 1 || flightTo === 0)) cloud.update(t);
    updateJunk(dt);
    warp.update(camera, dt);
  }

  // Jump straight to a stop (or the finale, i = STOPS.length). For testing and rehearsing.
  function jumpTo(i) {
    flight = null;
    card.hide();
    ui.setTitle(false);
    ui.setHome(false);
    ui.setTutorial(false);
    const finale = i >= STOPS.length;
    const view = finale ? finaleView() : viewOf(i);
    camera.position.copy(view.pos);
    look.copy(view.look);
    camera.fov = FOV;
    camera.updateProjectionMatrix();
    camera.lookAt(look);
    camera.updateMatrixWorld();
    setFuel(0);
    ui.setProgress(i - 1);
    if (finale) {
      index = STOPS.length - 1;
      constellation.visible = true;
      ui.setChapter(null);
      state = 'finale';
      finaleT = 0;
      ui.setFinale(true);
      spawnJunk(FINALE_DIST, FINALE_JUNK_SPOTS);
    } else {
      arrive(i);
    }
  }

  goTitle();
  camera.position.set(0, 10, 60);

  // Turn the journey off while the solar-system explorer is open (and back on after).
  function setEnabled(on) {
    enabled = on;
    journeyGroup.visible = on;
    if (on) goTitle();
    else {
      flight = null;
      card.hide();
      clearJunk();
      ui.setTitle(false);
      ui.setTutorial(false);
      ui.setFinale(false);
      ui.setHome(false);
      ui.setChapter(null);
      ui.setProgress(-1);
    }
  }

  return {
    update, targets, hint, beams, jumpTo, setEnabled,
    get state() { return state; }, get index() { return index; }, get fuel() { return fuel; },
    reset: goTitle,
  };
}
