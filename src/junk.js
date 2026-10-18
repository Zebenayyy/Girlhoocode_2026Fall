// Space junk: low-poly 3D pieces you collect to fuel the ship, plus the junk cloud around Earth.
import * as THREE from 'three';
import { glowSprite } from './bodies.js';

// What each piece is, and a real fact shown the first time you recycle one.
export const JUNK_INFO = {
  toolbag: { name: 'a lost tool bag', fact: 'In 2008, astronaut Heidemarie Stefanyshyn-Piper lost a tool bag on a spacewalk. It circled Earth for months.' },
  satellite: { name: 'a dead satellite', fact: 'Vanguard 1 was launched in 1958 and is still circling Earth today.' },
  bolt: { name: 'a loose bolt', fact: 'In orbit, even a tiny bolt moves about 28,000 km/h, faster than a bullet.' },
  glove: { name: 'a lost glove', fact: 'In 1965, Ed White lost a spare glove during the first American spacewalk.' },
  rocket: { name: 'an old rocket stage', fact: 'Leftover rocket parts are some of the biggest pieces of space junk.' },
  spatula: { name: 'a lost spatula', fact: 'In 2006, a spatula floated away during a spacewalk to test heat-shield repairs.' },
  panel: { name: 'a paint chip', fact: 'Flecks of paint have hit spacecraft so fast they chipped the windows.' },
  toolbag2: { name: 'another lost tool bag', fact: 'In 2023, astronauts Jasmin Moghbeli and Loral O\'Hara lost a tool bag that people on Earth could spot with binoculars.' },
};
export const JUNK_ORDER = ['toolbag', 'satellite', 'bolt', 'glove', 'rocket', 'spatula', 'panel', 'toolbag2'];

const mat = (color, metalness = 0.25, roughness = 0.55) => new THREE.MeshStandardMaterial({ color, metalness, roughness });
const FOIL = mat(0xd4aa50, 0.3, 0.4);
const WHITE = mat(0xe8e6df, 0.05, 0.7);
const STEEL = mat(0xa3a9b2, 0.3, 0.45);
const DARK = mat(0x2a2e36, 0.2, 0.6);
const SOLAR = mat(0x1f3f8a, 0.3, 0.3);

function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
function cyl(rt, rb, h, m, seg = 16) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); }

// Each model is roughly 2 units across before scaling.
const MODELS = {
  satellite() {
    const g = new THREE.Group();
    g.add(box(0.9, 0.9, 1.1, FOIL));
    const p1 = box(1.6, 0.04, 0.7, SOLAR);
    p1.position.x = 1.25;
    const p2 = box(1.6, 0.04, 0.7, SOLAR);
    p2.position.set(-1.2, 0.2, 0);
    p2.rotation.z = 0.5; // a broken, bent panel
    const dish = cyl(0.35, 0.05, 0.2, WHITE);
    dish.position.y = 0.6;
    g.add(p1, p2, dish);
    return g;
  },
  rocket() {
    const g = new THREE.Group();
    g.add(cyl(0.45, 0.45, 2, WHITE));
    const band = cyl(0.46, 0.46, 0.15, DARK);
    band.position.y = 0.6;
    const nozzle = cyl(0.25, 0.45, 0.5, DARK);
    nozzle.position.y = -1.2;
    g.add(band, nozzle);
    g.rotation.z = 1.1;
    return g;
  },
  bolt() {
    const g = new THREE.Group();
    const head = cyl(0.5, 0.5, 0.35, STEEL, 6);
    head.position.y = 0.7;
    g.add(head, cyl(0.2, 0.2, 1.4, STEEL));
    return g;
  },
  toolbag() {
    const g = new THREE.Group();
    g.add(box(1.4, 0.9, 0.8, WHITE));
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.06, 8, 16, Math.PI), DARK);
    handle.position.y = 0.45;
    const strap = box(1.42, 0.12, 0.82, DARK);
    g.add(handle, strap);
    return g;
  },
  glove() {
    const g = new THREE.Group();
    g.add(box(0.8, 0.9, 0.35, WHITE));
    for (let i = 0; i < 4; i++) {
      const f = cyl(0.09, 0.09, 0.5, WHITE, 8);
      f.position.set(-0.28 + i * 0.19, 0.68, 0);
      g.add(f);
    }
    const thumb = cyl(0.1, 0.1, 0.45, WHITE, 8);
    thumb.position.set(0.5, 0.15, 0);
    thumb.rotation.z = -0.9;
    const cuff = cyl(0.45, 0.45, 0.4, DARK);
    cuff.position.y = -0.62;
    g.add(thumb, cuff);
    return g;
  },
  spatula() {
    const g = new THREE.Group();
    g.add(cyl(0.07, 0.07, 1.6, DARK, 8));
    const head = box(0.6, 0.6, 0.05, STEEL);
    head.position.y = 1.05;
    g.add(head);
    g.rotation.z = 0.7;
    return g;
  },
  panel() {
    const shape = new THREE.Shape();
    shape.moveTo(-0.9, -0.6);
    shape.lineTo(0.8, -0.8);
    shape.lineTo(0.5, 0.4);
    shape.lineTo(-0.2, 0.9);
    shape.closePath();
    return new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false }), FOIL);
  },
};
MODELS.toolbag2 = MODELS.toolbag;

export function makeJunk(type, size) {
  const group = new THREE.Group();
  const model = MODELS[type]();
  group.add(model);
  const glow = glowSprite(0x9fffd0, 3.2, 0.35); // a soft green glint so collectibles stand out
  group.add(glow);
  group.scale.setScalar(size / 2);
  return { group, model, glow };
}

// A cloud of small debris circling Earth. Hidden once you've cleaned it up.
export function createJunkCloud(center, planetRadius, count = 260) {
  const geos = [new THREE.BoxGeometry(1, 1, 1), new THREE.TetrahedronGeometry(0.8), new THREE.CylinderGeometry(0.4, 0.4, 1.4, 6)];
  const meshes = geos.map((g, k) => new THREE.InstancedMesh(g, [STEEL, FOIL, WHITE][k], Math.ceil(count / geos.length)));
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      mesh: i % geos.length,
      slot: Math.floor(i / geos.length),
      r: planetRadius * (1.15 + Math.random() * 0.9),
      tilt: (Math.random() - 0.5) * 2.2,
      node: Math.random() * Math.PI * 2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.05 + Math.random() * 0.1,
      size: planetRadius * (0.015 + Math.random() * 0.03),
      spin: new THREE.Vector3(Math.random(), Math.random(), Math.random()),
    });
  }
  const group = new THREE.Group();
  group.position.copy(center);
  meshes.forEach((m) => { m.frustumCulled = false; group.add(m); });

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const orbitQ = new THREE.Quaternion(), axisX = new THREE.Vector3(1, 0, 0), axisY = new THREE.Vector3(0, 1, 0), q2 = new THREE.Quaternion();
  return {
    group,
    update(t) {
      for (const it of items) {
        const a = it.phase + t * it.speed;
        p.set(Math.cos(a) * it.r, 0, Math.sin(a) * it.r);
        orbitQ.setFromAxisAngle(axisX, it.tilt);
        q2.setFromAxisAngle(axisY, it.node);
        p.applyQuaternion(orbitQ).applyQuaternion(q2);
        e.set(it.spin.x * t, it.spin.y * t, it.spin.z * t);
        q.setFromEuler(e);
        s.setScalar(it.size);
        m4.compose(p, q, s);
        meshes[it.mesh].setMatrixAt(it.slot, m4);
      }
      meshes.forEach((m) => { m.instanceMatrix.needsUpdate = true; });
    },
  };
}
