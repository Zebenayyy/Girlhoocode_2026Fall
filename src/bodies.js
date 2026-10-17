// 3D builders for every object on the journey.
// Each returns { group, update(t) }. Planets use real NASA maps; the rest are
// built from shaders and particles so they look right from any angle.
import * as THREE from 'three';

const BASE = import.meta.env.BASE_URL;
const loader = new THREE.TextureLoader();

function texture(file, srgb = true) {
  const t = loader.load(BASE + file);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// ---------- shared helpers ----------

let glowTex = null;
function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.2, 'rgba(255,255,255,0.6)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.15)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  glowTex = new THREE.CanvasTexture(c);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  return glowTex;
}

export function glowSprite(color, size, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(),
    color,
    opacity,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  s.scale.setScalar(size);
  return s;
}

export function textSprite(text, { height = 4, color = '#ffffff', font = '600 64px system-ui, sans-serif' } = {}) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = font;
  const width = Math.ceil(g.measureText(text).width) + 24;
  c.width = width;
  c.height = 96;
  g.font = font;
  g.fillStyle = color;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.shadowColor = 'rgba(0,0,0,0.8)';
  g.shadowBlur = 8;
  g.fillText(text, width / 2, 48);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(height * (width / 96), height, 1);
  return s;
}

// Soft round additive points; per-point color and size.
function pointsMaterial(scale = 300) {
  return new THREE.ShaderMaterial({
    uniforms: { uScale: { value: scale } },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute vec3 aColor;
      varying vec3 vColor;
      uniform float uScale;
      void main() {
        vColor = aColor;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp(aSize * uScale / -mv.z, 0.0, 64.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor * a, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

function gaussian() {
  return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
}

// Glowing rim of air around a planet (Fresnel effect).
function atmosphere(radius, color, power = 4, strength = 1.2) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 64, 32),
    new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(color) }, uPower: { value: power }, uStrength: { value: strength } },
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; uniform float uPower; uniform float uStrength;
        varying vec3 vNormal;
        void main() {
          float i = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), uPower) * uStrength;
          gl_FragColor = vec4(uColor * i, i);
        }`,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  );
}

// ---------- planets (real NASA maps) ----------

function planet({ map, radius, spin, tilt = 0, clouds, air }) {
  const group = new THREE.Group();
  const body = new THREE.Group();
  body.rotation.z = tilt;
  group.add(body);

  const surface = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 96, 64),
    new THREE.MeshStandardMaterial({ map: texture(map), roughness: 1, metalness: 0 }),
  );
  body.add(surface);

  let cloudMesh = null;
  if (clouds) {
    cloudMesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.012, 96, 64),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        alphaMap: texture(clouds, false),
        transparent: true,
        depthWrite: false,
        roughness: 1,
      }),
    );
    body.add(cloudMesh);
  }
  if (air) group.add(atmosphere(radius * 1.08, air));

  return {
    group,
    update(t) {
      surface.rotation.y = t * spin;
      if (cloudMesh) cloudMesh.rotation.y = t * spin * 1.3;
    },
  };
}

// Earth: NASA Blue Marble + clouds. Moon: NASA LRO color map. Pluto: NASA New Horizons map.
const earth = (s) => planet({
  map: 'textures/earth_map.jpg', clouds: 'textures/earth_clouds.jpg',
  radius: s.radius, spin: 0.03, tilt: 0.41, air: 0x4d9dff,
});
const moon = (s) => planet({ map: 'textures/moon_map.jpg', radius: s.radius, spin: 0.02 });
const pluto = (s) => planet({ map: 'textures/pluto.jpg', radius: s.radius, spin: 0.05, tilt: 0.2, air: 0x99aacc });

// ---------- the Sun: boiling surface shader + corona ----------

const NOISE_GLSL = /* glsl */ `
  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; }
    return v;
  }`;

function sun(s) {
  const group = new THREE.Group();
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vPos; varying vec3 vNormal;
      void main() {
        vPos = normalize(position);
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vPos; varying vec3 vNormal;
      ${NOISE_GLSL}
      void main() {
        float big = fbm(vPos * 3.0 + vec3(uTime * 0.03));         // slow, large swirls
        float grain = fbm(vPos * 40.0 + vec3(uTime * 0.25));      // fine granulation, like the real surface
        float v = big * 0.45 + grain * 0.55;
        vec3 col = mix(vec3(0.95, 0.38, 0.05), vec3(1.0, 0.8, 0.38), smoothstep(0.35, 0.68, v));
        float mu = clamp(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
        col *= 0.5 + 0.5 * pow(mu, 0.45);   // limb darkening: the edge looks darker, like the real Sun
        gl_FragColor = vec4(col * 1.15, 1.0);
      }`,
  });
  group.add(new THREE.Mesh(new THREE.SphereGeometry(s.radius, 96, 64), material));
  group.add(glowSprite(0xff9a30, s.radius * 3.2, 0.45));
  group.add(glowSprite(0xff7a20, s.radius * 8, 0.18));
  return { group, update(t) { material.uniforms.uTime.value = t; } };
}

// ---------- comet: lumpy icy nucleus, glowing coma, two particle tails ----------

function tailMaterial(color, { length, spread, curve, speed, size }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDir: { value: new THREE.Vector3(1, 0, 0) },
      uCurveDir: { value: new THREE.Vector3(0, 1, 0) },
      uColor: { value: new THREE.Color(color) },
      uLength: { value: length },
      uSpread: { value: spread },
      uCurve: { value: curve },
      uSpeed: { value: speed },
      uSize: { value: size },
    },
    vertexShader: /* glsl */ `
      attribute float aSeed; attribute vec3 aLat;
      uniform float uTime, uLength, uSpread, uCurve, uSpeed, uSize;
      uniform vec3 uDir, uCurveDir;
      varying float vFade;
      void main() {
        float age = fract(aSeed + uTime * uSpeed);
        vec3 p = uDir * age * uLength + aLat * (0.4 + age * uSpread) + uCurveDir * age * age * uCurve;
        vFade = (1.0 - age) * smoothstep(0.0, 0.05, age);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp(uSize * (1.0 + age) * 300.0 / -mv.z, 0.0, 48.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; varying float vFade;
      void main() {
        float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)) * vFade * 0.5;
        gl_FragColor = vec4(uColor * a, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

function tail(count, material) {
  const geo = new THREE.BufferGeometry();
  const seeds = new Float32Array(count);
  const lat = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    seeds[i] = Math.random();
    lat.set([gaussian(), gaussian(), gaussian()], i * 3);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geo.setAttribute('aLat', new THREE.BufferAttribute(lat, 3));
  const pts = new THREE.Points(geo, material);
  pts.frustumCulled = false;
  return pts;
}

function comet() {
  const group = new THREE.Group();

  const geo = new THREE.IcosahedronGeometry(1.2, 5);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = Math.sin(v.x * 3.1) * Math.cos(v.y * 2.3) * 0.18 + Math.sin(v.z * 5.7 + v.x) * 0.07;
    v.multiplyScalar(1 + n);
    v.x *= 1.4; // a peanut-ish shape, like real comet nuclei
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  group.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x5a544e, roughness: 1, flatShading: true })));
  group.add(glowSprite(0xbfe8ff, 9, 0.9));
  group.add(glowSprite(0x7fc8ff, 22, 0.35));

  // real tails point away from the Sun; this one is angled across the view so you can see it
  const away = new THREE.Vector3(1, 0.25, -0.35).normalize();
  const side = new THREE.Vector3(0, 1, 0).cross(away).normalize();

  const ion = tailMaterial(0x6fb8ff, { length: 120, spread: 2.5, curve: 0, speed: 0.12, size: 1.2 });
  const dust = tailMaterial(0xffe2b0, { length: 80, spread: 9, curve: 25, speed: 0.07, size: 1.8 });
  for (const m of [ion, dust]) {
    m.uniforms.uDir.value.copy(away);
    m.uniforms.uCurveDir.value.copy(side);
  }
  group.add(tail(4000, ion), tail(5000, dust));

  return {
    group,
    update(t) {
      ion.uniforms.uTime.value = t;
      dust.uniforms.uTime.value = t;
      group.children[0].rotation.y = t * 0.2;
    },
  };
}

// ---------- star colors: O B A F G K M, hottest to coolest ----------

const STAR_TYPES = [
  ['O', 0x9bb0ff, 6.5],
  ['B', 0xaabfff, 5.4],
  ['A', 0xcad7ff, 4.4],
  ['F', 0xf8f7ff, 3.7],
  ['G', 0xfff1c9, 3.2],
  ['K', 0xffc78a, 2.7],
  ['M', 0xff9b5e, 2.2],
];

function stars() {
  const group = new THREE.Group();
  const twinkles = [];
  STAR_TYPES.forEach(([letter, color, size], i) => {
    const x = -33 + i * 11;
    const y = Math.sin((i / 6) * Math.PI) * 6;
    const star = new THREE.Mesh(
      new THREE.SphereGeometry(size * 0.45, 32, 16),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2) }),
    );
    star.position.set(x, y, 0);
    const halo = glowSprite(color, size * 4.5, 0.9);
    halo.position.copy(star.position);
    const label = textSprite(letter, { height: 5.5, color: '#e9eeff' });
    label.position.set(x, y - size * 0.9 - 4.5, 0);
    group.add(star, halo, label);
    twinkles.push(halo);
  });
  const caption = textSprite('hottest  →  coolest', { height: 3.6, color: '#aab4d8', font: '400 56px system-ui, sans-serif' });
  caption.position.set(0, -19, 0);
  group.add(caption);
  return {
    group,
    update(t) {
      twinkles.forEach((h, i) => { h.material.opacity = 0.8 + 0.2 * Math.sin(t * 2 + i * 1.7); });
    },
  };
}

// ---------- Horsehead Nebula: Hubble's real image + 3D dust in front of it ----------

function nebula(s) {
  const group = new THREE.Group();
  const size = s.radius * 2;
  const image = new THREE.Mesh(
    new THREE.PlaneGeometry(size * 0.957, size), // Hubble image aspect ratio
    new THREE.ShaderMaterial({
      uniforms: { uMap: { value: texture('textures/horsehead.jpg') } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap; varying vec2 vUv;
        void main() {
          vec3 c = texture2D(uMap, vUv).rgb;
          float edge = smoothstep(0.5, 0.3, distance(vUv, vec2(0.5)));   // fade the square edges into space
          gl_FragColor = vec4(c * edge * 0.95, 1.0);
        }`,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  );
  group.add(image);

  // glowing gas drifting in front of the image gives it real depth as you fly in
  const count = 2500;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const sz = new Float32Array(count);
  const red = new THREE.Color(0xff6a5a), blue = new THREE.Color(0x7fb0ff), c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    pos.set([gaussian() * s.radius * 0.8, gaussian() * s.radius * 0.8, Math.random() * s.radius * 1.2], i * 3);
    c.copy(Math.random() < 0.7 ? red : blue).multiplyScalar(0.25 + Math.random() * 0.3);
    col.set([c.r, c.g, c.b], i * 3);
    sz[i] = 2 + Math.random() * 6;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
  const dust = new THREE.Points(geo, pointsMaterial(400));
  group.add(dust);

  return { group, update(t) { dust.rotation.z = Math.sin(t * 0.05) * 0.03; } };
}

// ---------- pulsar: spinning neutron star, lighthouse beams, magnetic field ----------

function beam() {
  const h = 60;
  const geo = new THREE.ConeGeometry(7, h, 32, 1, true);
  geo.translate(0, -h / 2, 0); // tip at the star, opening outward
  return new THREE.Mesh(geo, new THREE.ShaderMaterial({
    vertexShader: /* glsl */ `
      varying float vAlong;
      void main() { vAlong = -position.y / ${h.toFixed(1)}; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      varying float vAlong;
      void main() {
        float a = pow(1.0 - vAlong, 2.0) * 0.55;
        gl_FragColor = vec4(vec3(0.55, 0.8, 1.0) * a, a);
      }`,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  }));
}

function pulsar() {
  const group = new THREE.Group();
  const spin = new THREE.Group();
  group.add(spin);

  const star = new THREE.Mesh(new THREE.SphereGeometry(1.4, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xe8f6ff).multiplyScalar(3) }));
  const halo = glowSprite(0x9fd4ff, 14, 1);
  group.add(star, halo);

  // the magnetic axis is tilted from the spin axis; that's what makes it sweep like a lighthouse
  const magnetic = new THREE.Group();
  magnetic.rotation.z = 0.55;
  spin.add(magnetic);
  const up = beam();
  const down = beam();
  down.rotation.z = Math.PI;
  magnetic.add(up, down);

  // dipole field lines: r = L * sin^2(theta)
  const lineMat = new THREE.LineBasicMaterial({ color: 0x5aa8ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
  for (const L of [7, 12]) {
    for (let k = 0; k < 6; k++) {
      const phi = (k / 6) * Math.PI * 2;
      const pts = [];
      for (let i = 0; i <= 48; i++) {
        const th = 0.2 + (i / 48) * (Math.PI - 0.4);
        const r = L * Math.sin(th) ** 2;
        pts.push(new THREE.Vector3(r * Math.sin(th) * Math.cos(phi), r * Math.cos(th), r * Math.sin(th) * Math.sin(phi)));
      }
      magnetic.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
    }
  }

  const camToStar = new THREE.Vector3();
  const beamDir = new THREE.Vector3();
  return {
    group,
    update(t, camera) {
      spin.rotation.y = t * 2.2;
      // flash when a beam sweeps toward the viewer, the way radio telescopes "see" a pulsar
      if (camera) {
        group.getWorldPosition(camToStar);
        camToStar.subVectors(camera.position, camToStar).normalize();
        beamDir.set(0, 1, 0).applyQuaternion(up.getWorldQuaternion(new THREE.Quaternion()));
        const facing = Math.abs(beamDir.dot(camToStar));
        halo.material.opacity = 0.6 + Math.pow(facing, 8) * 1.4;
        halo.scale.setScalar(14 + Math.pow(facing, 8) * 18);
      }
    },
  };
}

// ---------- galaxies: tens of thousands of star particles ----------
// The disc lies flat in x/z, so inclination 0 is edge-on to the camera and ~1.5 is face-on.

function galaxy({ radius, count, arms, winding, inclination, roll, core, arm, armFraction = 0.65, scatterScale = 1 }) {
  const group = new THREE.Group();
  const disc = new THREE.Group();
  disc.rotation.set(inclination, 0, roll);
  group.add(disc);

  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const sz = new Float32Array(count);
  const cCore = new THREE.Color(core), cArm = new THREE.Color(arm), pink = new THREE.Color(0xff7fb0), c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const k = Math.pow(Math.random(), 1.7); // more stars toward the center
    const d = k * radius;
    const inArm = Math.random() < armFraction; // the rest fill in the disc between the arms
    const a = inArm ? ((i % arms) / arms) * Math.PI * 2 + k * winding * Math.PI : Math.random() * Math.PI * 2;
    const scatter = radius * (0.06 + 0.2 * (1 - k)) * scatterScale;
    pos.set([
      Math.cos(a) * d + gaussian() * scatter,
      gaussian() * radius * 0.025 * (1.4 - k),
      Math.sin(a) * d + gaussian() * scatter,
    ], i * 3);
    c.copy(cCore).lerp(cArm, Math.min(1, k * 1.6));
    if (k > 0.3 && Math.random() < 0.04) c.copy(pink); // star-forming regions
    c.multiplyScalar((inArm ? 0.35 : 0.18) + Math.random() * 0.35);
    col.set([c.r, c.g, c.b], i * 3);
    sz[i] = radius * (0.004 + Math.random() * 0.01);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
  const points = new THREE.Points(geo, pointsMaterial(500));
  disc.add(points);
  disc.add(glowSprite(core, radius * 0.7, 0.8));

  return { group, update(t) { points.rotation.y = t * 0.01; } };
}

const andromeda = (s) => galaxy({
  radius: s.radius, count: 70000, arms: 2, winding: 2.2,
  inclination: 0.3, roll: 0.55, core: 0xffe2b8, arm: 0x9ab4ff, // Andromeda is tilted nearly edge-on to us
});
const spiral = (s) => galaxy({
  radius: s.radius, count: 60000, arms: 2, winding: 2.4, armFraction: 0.85, scatterScale: 0.5,
  inclination: 1.15, roll: -0.3, core: 0xfff0d0, arm: 0x7fa6ff,
});

export const BUILDERS = { earth, moon, pluto, sun, comet, stars, nebula, pulsar, andromeda, spiral };

// ---------- warp streaks: dust that rushes past while flying ----------

export function createWarp(scene, count = 1200, box = 400) {
  const pts = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) pts[i] = (Math.random() - 0.5) * box;
  const line = new Float32Array(count * 6);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(line, 3));
  const mat = new THREE.LineBasicMaterial({ color: 0xbfd8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  scene.add(lines);

  const last = new THREE.Vector3();
  const vel = new THREE.Vector3();
  let first = true;

  return {
    update(camera, dt) {
      if (first) { last.copy(camera.position); first = false; }
      vel.subVectors(camera.position, last).divideScalar(Math.max(dt, 1e-3));
      last.copy(camera.position);
      const speed = vel.length();
      mat.opacity = Math.min(0.7, speed / 3000);
      const streak = Math.min(speed * 0.02, 60);
      const dir = vel.clone().normalize();
      const half = box / 2;
      const cp = camera.position;
      for (let i = 0; i < count; i++) {
        // keep each dust grain inside a box around the camera (wraps around as we fly)
        let x = pts[i * 3], y = pts[i * 3 + 1], z = pts[i * 3 + 2];
        x = ((((x - cp.x + half) % box) + box) % box) - half + cp.x;
        y = ((((y - cp.y + half) % box) + box) % box) - half + cp.y;
        z = ((((z - cp.z + half) % box) + box) % box) - half + cp.z;
        pts[i * 3] = x; pts[i * 3 + 1] = y; pts[i * 3 + 2] = z;
        line[i * 6] = x; line[i * 6 + 1] = y; line[i * 6 + 2] = z;
        line[i * 6 + 3] = x - dir.x * streak;
        line[i * 6 + 4] = y - dir.y * streak;
        line[i * 6 + 5] = z - dir.z * streak;
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}
