// The storyline: a journey outward from Earth, one woman's discovery at each stop,
// ending with all ten women forming a new constellation.
//
//   title    orbiting Earth             -> point at Earth to begin
//   arrived  parked next to an object   -> point at it to hear her story
//   story    card + voice               -> when it finishes, a "next" beacon appears
//   next     beacon on screen           -> point at it to fly to the next stop
//   flying   camera travels outward
//   finale   the constellation          -> point at the beacon to fly home
import * as THREE from 'three';
import { STOPS, SUN_POS, FINALE_POS } from './stops.js';
import { BUILDERS, createWarp, glowSprite, textSprite } from './bodies.js';
import { FOV } from './stage.js';

const VIEW_DIR = new THREE.Vector3(0.28, 0.12, 1).normalize(); // camera sits on this side of each object
const FRAME = 4.6; // camera distance in object radii
const IDLE_RESET_MS = 75000;

const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const v3 = (a) => new THREE.Vector3(...a);

// Constellation outline (x, y in -1..1), one point per woman, in journey order.
const CROWN = [
  [-0.95, -0.25], [-0.62, 0.3], [-0.3, 0.02], [0, 0.62], [0.3, 0.02],
  [0.62, 0.3], [0.95, -0.25], [0.48, -0.55], [0, -0.38], [-0.48, -0.55],
];

export function createJourney({ stage, card, ui }) {
  const { scene, camera } = stage;

  // ---------- build the world ----------
  scene.add(new THREE.AmbientLight(0xffffff, 0.06));
  const sunLight = new THREE.PointLight(0xfff2dd, 3.2, 0, 0);
  sunLight.position.copy(v3(SUN_POS));
  scene.add(sunLight);

  const bodies = STOPS.map((s) => {
    const body = BUILDERS[s.kind](s, { sunPos: SUN_POS });
    body.group.position.copy(v3(s.pos));
    scene.add(body.group);
    return body;
  });
  const warp = createWarp(scene);

  // finale constellation: hidden until the end
  const finaleCenter = v3(FINALE_POS);
  const constellation = new THREE.Group();
  constellation.position.copy(finaleCenter);
  constellation.visible = false;
  scene.add(constellation);
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

  function viewOf(i) {
    const s = STOPS[i];
    const center = v3(s.pos);
    const pos = center.clone().addScaledVector(VIEW_DIR, s.radius * FRAME);
    // look a little to the right of the object, so it sits left of center and the card fits on the right
    right.crossVectors(VIEW_DIR, new THREE.Vector3(0, 1, 0)).normalize().negate();
    const target = center.clone().addScaledVector(right, s.radius * 1.15);
    return { pos, look: target, center };
  }

  function finaleView() {
    return { pos: finaleCenter.clone().add(new THREE.Vector3(0, -60, 1250)), look: finaleCenter.clone().add(new THREE.Vector3(0, -60, 0)) };
  }

  let flight = null;
  let flightTo = -1; // stop index we're flying to, when it isn't simply the next one (flying home)
  function flyTo(view, onArrive) {
    const from = camera.position.clone();
    const fromLook = look.clone();
    const dist = from.distanceTo(view.pos);
    const ctrl = from.clone().lerp(view.pos, 0.5).add(new THREE.Vector3(0, dist * 0.08, 0));
    flight = { from, fromLook, ctrl, to: view.pos, toLook: view.look, t: 0, dur: 2.6 + 0.4 * Math.log10(Math.max(dist, 10)), onArrive };
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
    if (k >= 1) {
      flight = null;
      f.onArrive?.();
    }
  }

  // ---------- story state ----------
  let state = 'title';
  let index = 0;
  let orbit = 0;
  let finaleT = 0;
  let lastActivity = performance.now();

  function goTitle() {
    state = 'title';
    index = 0;
    card.hide();
    ui.setProgress(-1);
    ui.setChapter(null);
    ui.setTitle(true);
    ui.setFinale(false);
    constellation.visible = false;
  }

  function beginStory(i) {
    state = 'story';
    index = i;
    ui.setProgress(i);
    ui.setChapter(i);
    ui.setTitle(false);
    card.show(STOPS[i], () => { if (state === 'story' && index === i) state = 'next'; });
  }

  function startJourney() {
    beginStory(0);
    flyTo(viewOf(0));
  }

  function arrive(i) {
    state = 'arrived';
    index = i;
    ui.setChapter(i);
  }

  function flyNext() {
    card.hide();
    if (index >= STOPS.length - 1) {
      state = 'flying';
      ui.setChapter(null);
      ui.travel('the stars of Her Sky');
      constellation.visible = true;
      flyTo(finaleView(), () => { state = 'finale'; finaleT = 0; ui.setFinale(true); });
      return;
    }
    const next = index + 1;
    state = 'flying';
    ui.travel(STOPS[next].name, STOPS[next].distance);
    flyTo(viewOf(next), () => arrive(next));
  }

  function flyHome() {
    ui.setFinale(false);
    state = 'flying';
    ui.travel('home');
    card.hide();
    flightTo = 0;
    flyTo(viewOf(0), () => { flightTo = -1; goTitle(); });
  }

  // ---------- pointing targets ----------
  // Each target: { id, x, y, r, kind: 'object' | 'beacon', label, onSelect }
  function beaconTarget(label, onSelect) {
    const { w, h } = stage.size();
    return { id: `beacon-${label}`, kind: 'beacon', x: w * 0.5, y: h * 0.74, r: Math.min(w, h) * 0.07, label, onSelect };
  }

  function objectTarget(i, onSelect) {
    const center = v3(STOPS[i].pos);
    const p = stage.project(center);
    if (!p.visible) return null;
    const { w, h } = stage.size();
    const r = Math.max(stage.screenRadius(center, STOPS[i].radius), Math.min(w, h) * 0.06);
    return { id: STOPS[i].id, kind: 'object', x: p.x, y: p.y, r, onSelect };
  }

  function targets() {
    if (flight) return [];
    if (state === 'title') return [objectTarget(0, startJourney)].filter(Boolean);
    if (state === 'arrived') return [objectTarget(index, () => beginStory(index))].filter(Boolean);
    if (state === 'next') {
      const label = index >= STOPS.length - 1 ? 'See Her Sky' : `Fly to ${STOPS[index + 1].name}`;
      return [beaconTarget(label, flyNext)];
    }
    if (state === 'finale' && finaleT > CROWN.length * 0.45 + 1.5) return [beaconTarget('Fly home', flyHome)];
    return [];
  }

  function hint() {
    if (flight) return '';
    if (state === 'title') return 'Point at Earth and hold to begin your journey';
    if (state === 'arrived') return `Point at ${STOPS[index].name} and hold to hear her story`;
    if (state === 'next') return 'Point at the glowing light to travel further';
    return '';
  }

  // ---------- per frame ----------
  function update(t, dt, cursorActive) {
    const now = performance.now();
    if (cursorActive) lastActivity = now;
    if (state !== 'title' && !flight && now - lastActivity > IDLE_RESET_MS) flyHome();

    if (flight) {
      updateFlight(dt);
    } else if (state === 'title') {
      // slow orbit around Earth
      orbit += dt * 0.06;
      const e = STOPS[0];
      const d = e.radius * FRAME * 1.25;
      camera.position.set(e.pos[0] + Math.sin(orbit) * d, e.pos[1] + d * 0.22, e.pos[2] + Math.cos(orbit) * d);
      look.copy(v3(e.pos));
    }
    camera.lookAt(look);
    if (!flight && camera.fov !== FOV) { camera.fov = FOV; camera.updateProjectionMatrix(); }

    if (state === 'finale') {
      finaleT += dt;
      conStars.forEach((s, i) => {
        const k = THREE.MathUtils.clamp((finaleT - i * 0.45) / 0.6, 0, 1);
        s.scale.setScalar(Math.max(0.001, ease(k)));
      });
      conLine.material.opacity = THREE.MathUtils.clamp((finaleT - CROWN.length * 0.45) / 1.5, 0, 0.6);
    }

    // show the current stop, plus the next one while flying to it, so faraway objects don't clutter the view
    const sunIndex = STOPS.findIndex((s) => s.kind === 'sun');
    bodies.forEach((b, i) => {
      const show = i === index || (flight && i === index + 1) || i === flightTo || (i === sunIndex && index <= sunIndex + 1);
      b.group.visible = show;
      if (show) b.update(t, camera);
    });
    warp.update(camera, dt);
  }

  // Jump straight to a stop (or the finale, i = STOPS.length). For testing and rehearsing.
  function jumpTo(i) {
    flight = null;
    card.hide();
    ui.setTitle(false);
    const finale = i >= STOPS.length;
    const view = finale ? finaleView() : viewOf(i);
    camera.position.copy(view.pos);
    look.copy(view.look);
    ui.setProgress(i - 1);
    if (finale) {
      index = STOPS.length - 1;
      constellation.visible = true;
      ui.setChapter(null);
      state = 'finale';
      finaleT = 0;
      ui.setFinale(true);
    } else {
      arrive(i);
    }
  }

  goTitle();
  camera.position.set(0, 10, 60);

  return { update, targets, hint, jumpTo, get state() { return state; }, get index() { return index; }, reset: goTitle };
}
