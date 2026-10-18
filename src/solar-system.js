// Solar-system explorer (by Kiwakibt): the 8 planets, three spacecraft missions, and facts.
// Pointing works exactly like the journey: the main cursor, point-and-hold (or click) on a
// planet or spacecraft to fly to it, and a "Back to the Solar System" light to return.
// Pinch to grab the view: move left/right/up/down to rotate, push your hand toward the
// screen to zoom in and pull it back to zoom out. Mouse: drag to rotate, scroll to zoom.
// Facts are read with the same recorded voice as the journey (public/audio/solar/).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PLANET_FACTS, MISSION_FACTS, audioId, narrationFor } from './solar-facts.js';

const BASE = import.meta.env.BASE_URL;
const loader = new THREE.TextureLoader();

const PLANETS = [
  { name: 'Mercury', texture: 'mercury.jpg', radius: 1.4, orbit: 12, speed: 0.8, spin: 0.8 },
  { name: 'Venus', texture: 'venus.jpg', radius: 2.6, orbit: 18, speed: 0.58, spin: -0.25 },
  { name: 'Earth', texture: 'earth.jpg', radius: 2.8, orbit: 25, speed: 0.42, spin: 0.9 },
  { name: 'Mars', texture: 'mars.jpg', radius: 2, orbit: 33, speed: 0.34, spin: 0.85 },
  { name: 'Jupiter', texture: 'jupiter.jpg', radius: 8.5, orbit: 47, speed: 0.22, spin: 1.3 },
  { name: 'Saturn', texture: 'saturn.jpg', radius: 7.5, orbit: 62, speed: 0.17, spin: 1.1, rings: true },
  { name: 'Uranus', texture: 'uranus.jpg', radius: 5, orbit: 77, speed: 0.13, spin: -0.75 },
  { name: 'Neptune', texture: 'neptune.jpg', radius: 4.8, orbit: 91, speed: 0.1, spin: 0.8 },
];

const MISSIONS = [
  { name: 'Perseverance', planet: 'Mars', offset: [4.5, 2.2, 0] },
  { name: 'Cassini', planet: 'Saturn', offset: [17, 3, 0] },
  { name: 'Voyager 1', position: [116, 0, 0] },
];
const PROBE_RADIUS = 3; // rough size of a spacecraft, for pointing at it

function createProbe() {
  const probe = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: 0xe7b95e, metalness: 0.7, roughness: 0.4 });
  const panel = new THREE.MeshStandardMaterial({ color: 0x397cc4, metalness: 0.45, roughness: 0.45 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.5), gold);
  probe.add(body);
  const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 1.3), panel);
  leftPanel.position.x = -1.75;
  probe.add(leftPanel);
  const rightPanel = leftPanel.clone();
  rightPanel.position.x = 1.75;
  probe.add(rightPanel);
  const antenna = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.9, 12), gold);
  antenna.position.z = -1.05;
  antenna.rotation.x = Math.PI / 2;
  probe.add(antenna);
  probe.scale.setScalar(1.15);
  return probe;
}

function loadTexture(file) {
  const url = `${BASE}solar-system/${file}`;
  const texture = loader.load(url, undefined, undefined, (error) => {
    console.error(`Unable to load solar-system texture: ${url}`, error);
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createSolarSystem(stage, narrator) {
  const { scene, camera, renderer } = stage;
  const journeyFarPlane = camera.far;
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  let sun;
  let orbits = [];
  let missions = [];
  let built = false;
  function buildWorld() {
    if (built) return;
    sun = new THREE.Mesh(
      new THREE.SphereGeometry(8, 64, 48),
      new THREE.MeshBasicMaterial({ map: loadTexture('sun.jpg') }),
    );
    group.add(sun);
    group.add(new THREE.PointLight(0xfff1d6, 1800, 0, 2));
    group.add(new THREE.AmbientLight(0xffffff, 0.48));

    orbits = PLANETS.map((planet, index) => {
      const path = new THREE.Mesh(
        new THREE.RingGeometry(planet.orbit - 0.08, planet.orbit + 0.08, 128),
        new THREE.MeshBasicMaterial({
          color: 0x9eabc9,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
        }),
      );
      path.rotation.x = -Math.PI / 2;
      group.add(path);

      const orbitGroup = new THREE.Group();
      group.add(orbitGroup);
      const bodyGroup = new THREE.Group();
      bodyGroup.position.x = planet.orbit;
      orbitGroup.add(bodyGroup);

      const surfaceTexture = loadTexture(planet.texture);
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(planet.radius, 48, 32),
        new THREE.MeshStandardMaterial({
          map: surfaceTexture,
          roughness: 0.9,
          emissive: 0xffffff,
          emissiveMap: surfaceTexture,
          emissiveIntensity: 0.2,
        }),
      );
      body.name = planet.name;
      bodyGroup.add(body);

      if (planet.rings) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(planet.radius * 1.2, planet.radius * 2.1, 96),
          new THREE.MeshBasicMaterial({
            map: loadTexture('saturn_ring.png'),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.88,
            depthWrite: false,
          }),
        );
        ring.rotation.x = -Math.PI / 2;
        bodyGroup.add(ring);
      }

      return { ...planet, orbitGroup, bodyGroup, body, phase: (index / PLANETS.length) * Math.PI * 2 };
    });
    missions = MISSIONS.map((mission) => {
      const anchor = new THREE.Group();
      if (mission.planet) {
        const planet = orbits.find((entry) => entry.name === mission.planet);
        anchor.position.set(...mission.offset);
        planet.bodyGroup.add(anchor);
      } else {
        anchor.position.set(...mission.position);
        group.add(anchor);
        const route = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(91, 0, 0),
          new THREE.Vector3(...mission.position),
        ]);
        group.add(new THREE.Line(route, new THREE.LineBasicMaterial({
          color: 0x8ce8ff,
          transparent: true,
          opacity: 0.6,
        })));
      }
      const probe = createProbe();
      probe.name = mission.name;
      anchor.add(probe);
      return { ...mission, ...MISSION_FACTS[mission.name], anchor, probe };
    });
    built = true;
  }

  // mouse users can still drag to orbit the view
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enableZoom = true; // mouse wheel
  controls.minDistance = 12;
  controls.maxDistance = 350;
  controls.enabled = false;

  const focus = document.getElementById('solar-focus');
  const missionSelect = document.getElementById('solar-mission');
  const orbitSpeed = document.getElementById('solar-orbit-speed');
  const spinSpeed = document.getElementById('solar-spin-speed');
  const focusStatus = document.getElementById('solar-focus-status');
  const infoCard = document.getElementById('solar-planet-info');
  const infoTitle = document.getElementById('solar-planet-info-title');
  const infoFacts = document.getElementById('solar-planet-info-facts');
  const infoSource = document.getElementById('solar-planet-info-source');
  const infoSpeak = document.getElementById('solar-planet-info-speak');
  const focusTarget = new THREE.Vector3();
  const focusDelta = new THREE.Vector3();
  const cameraOffset = new THREE.Vector3();
  const spherical = new THREE.Spherical();
  const overviewTarget = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  let focusZoomDistance = null;
  let overviewDistance = 224;
  let returningToOverview = false;
  let active = false;
  let infoName = null;
  let selectedMissionName = null;
  let infoAnchor = null;
  let infoNarration = '';
  let grabbed = null; // { x, y, size } of the pinching hand last frame

  const IDLE_STATUS = 'Point at a planet or spacecraft and hold to fly to it';

  function start() {
    buildWorld();
    active = true;
    group.visible = true;
    controls.enabled = true;
    camera.far = 2000;
    camera.updateProjectionMatrix();
    camera.position.set(0, 205, 90);
    controls.target.set(0, 0, 0);
    controls.update();
    overviewTarget.copy(controls.target);
    overviewDistance = camera.position.distanceTo(controls.target);
    focus.value = 'none';
    missionSelect.value = 'none';
    selectedMissionName = null;
    infoName = null;
    infoAnchor = null;
    infoCard.hidden = true;
    narrator.silence();
    focusZoomDistance = null;
    returningToOverview = false;
    focusStatus.textContent = IDLE_STATUS;
  }

  function stop() {
    active = false;
    group.visible = false;
    controls.enabled = false;
    camera.far = journeyFarPlane;
    camera.updateProjectionMatrix();
    returningToOverview = false;
    focusZoomDistance = null;
    grabbed = null;
    infoCard.hidden = true;
    infoName = null;
    narrator.silence();
  }

  function selectPlanet(name) {
    focus.value = name;
    focus.dispatchEvent(new Event('change'));
  }

  function selectMission(name) {
    missionSelect.value = name;
    missionSelect.dispatchEvent(new Event('change'));
  }

  function backToOverview() {
    focus.value = 'none';
    missionSelect.value = 'none';
    selectedMissionName = null;
    focus.dispatchEvent(new Event('change'));
  }

  // ---------- pointing targets (same format as the journey's) ----------
  function targetFor(id, label, worldPos, radius, onSelect) {
    const p = stage.project(worldPos);
    if (!p.visible) return null;
    const { w, h } = stage.size();
    const r = Math.max(stage.screenRadius(worldPos, radius) * 1.15, Math.min(w, h) * 0.035);
    // quiet: the overview has many planets, so only show a ring on the one you're pointing at
    return { id, kind: 'object', quiet: true, label, x: p.x, y: p.y, r, onSelect };
  }

  function targets() {
    if (!active) return [];
    const list = [];
    for (const planet of orbits) {
      if (planet.name === focus.value) continue;
      planet.body.getWorldPosition(tmp);
      list.push(targetFor(`solar-${planet.name}`, planet.name, tmp, planet.radius, () => selectPlanet(planet.name)));
    }
    for (const mission of missions) {
      if (mission.name === selectedMissionName) continue;
      mission.anchor.getWorldPosition(tmp);
      list.push(targetFor(`solar-${mission.name}`, mission.name, tmp, PROBE_RADIUS, () => selectMission(mission.name)));
    }
    if (focus.value !== 'none' || selectedMissionName) {
      const { w, h } = stage.size();
      list.push({
        id: 'solar-back', kind: 'beacon', label: 'Back to the Solar System',
        x: w * 0.5, y: h * 0.84, r: Math.min(w, h) * 0.055, onSelect: backToOverview,
      });
    }
    return list.filter(Boolean);
  }

  // ---------- fact card + soft recorded voice ----------
  function showInfo(name, details, anchor) {
    infoName = name;
    infoAnchor = anchor;
    infoNarration = narrationFor(name, details);
    infoTitle.textContent = name;
    infoFacts.replaceChildren(...details.facts.map((fact) => {
      const item = document.createElement('li');
      item.textContent = fact;
      return item;
    }));
    infoSource.href = details.source;
    infoCard.hidden = false;
    speakInfo();
  }

  function speakInfo(force = false) {
    if (!infoName) return;
    narrator.narrate(`${BASE}audio/solar/${audioId(infoName)}.mp3`, infoNarration, { force });
  }

  // ---------- pinch to rotate and zoom ----------
  const ROTATE_SPEED = 0.006; // radians per pixel of hand movement
  const ZOOM_POWER = 2.5; // how strongly pushing/pulling your hand zooms

  function updateGrab(grab) {
    if (!grab) { grabbed = null; return; }
    if (!grabbed) { grabbed = { ...grab }; return; } // just started pinching: remember where
    cameraOffset.copy(camera.position).sub(controls.target);
    spherical.setFromVector3(cameraOffset);
    // move left/right/up/down to rotate around what you're looking at
    spherical.theta -= (grab.x - grabbed.x) * ROTATE_SPEED;
    spherical.phi = THREE.MathUtils.clamp(spherical.phi + (grab.y - grabbed.y) * ROTATE_SPEED, 0.12, Math.PI - 0.12);
    // hand closer to the camera looks bigger -> zoom in; farther -> zoom out
    if (grab.size > 0 && grabbed.size > 0) {
      const ratio = THREE.MathUtils.clamp(grabbed.size / grab.size, 0.9, 1.1);
      spherical.radius = THREE.MathUtils.clamp(spherical.radius * ratio ** ZOOM_POWER, controls.minDistance, controls.maxDistance);
      focusZoomDistance = null; // the person is steering the zoom now
    }
    cameraOffset.setFromSpherical(spherical);
    camera.position.copy(controls.target).add(cameraOffset);
    grabbed = { ...grab };
  }

  // ---------- per frame ----------
  // grab: { x, y, size } while a hand is pinching (screen position + hand size), else null
  function update(t, dt, grab = null) {
    if (!active) return;
    updateGrab(grab);
    sun.rotation.y = t * 0.04;
    const orbitMultiplier = Number(orbitSpeed.value);
    const spinMultiplier = Number(spinSpeed.value);
    for (const planet of orbits) {
      planet.orbitGroup.rotation.y = planet.phase + t * planet.speed * orbitMultiplier;
      planet.body.rotation.y = t * planet.spin * spinMultiplier;
    }

    const selectedPlanet = orbits.find((planet) => planet.name === focus.value);
    const selectedMission = missions.find((mission) => mission.name === selectedMissionName);
    const selected = selectedPlanet ?? selectedMission;
    if (selected) {
      returningToOverview = false;
      const anchor = selectedPlanet ? selectedPlanet.body : selectedMission.anchor;
      anchor.getWorldPosition(focusTarget);
      focusDelta.copy(focusTarget).sub(controls.target).multiplyScalar(Math.min(1, dt * 4));
      camera.position.add(focusDelta);
      controls.target.add(focusDelta);
      if (focusZoomDistance !== null) {
        cameraOffset.copy(camera.position).sub(controls.target);
        spherical.setFromVector3(cameraOffset);
        spherical.radius = THREE.MathUtils.lerp(spherical.radius, focusZoomDistance, 1 - Math.exp(-dt * 3));
        cameraOffset.setFromSpherical(spherical);
        camera.position.copy(controls.target).add(cameraOffset);
        if (Math.abs(spherical.radius - focusZoomDistance) < 0.1) focusZoomDistance = null;
      }
      if (infoName !== selected.name) {
        showInfo(selected.name, selectedMission ? selectedMission : PLANET_FACTS[selected.name], anchor);
      }
      placeInfoCard(selectedPlanet ? selected.radius : PROBE_RADIUS);
    } else if (returningToOverview) {
      narrator.silence();
      infoCard.hidden = true;
      infoName = null;
      infoAnchor = null;
      const blend = 1 - Math.exp(-dt * 3);
      controls.target.lerp(overviewTarget, blend);
      cameraOffset.copy(camera.position).sub(controls.target);
      spherical.setFromVector3(cameraOffset);
      spherical.radius = THREE.MathUtils.lerp(spherical.radius, overviewDistance, blend);
      cameraOffset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(cameraOffset);
      if (controls.target.distanceTo(overviewTarget) < 0.1 && Math.abs(spherical.radius - overviewDistance) < 0.1) {
        controls.target.copy(overviewTarget);
        cameraOffset.setLength(overviewDistance);
        camera.position.copy(controls.target).add(cameraOffset);
        returningToOverview = false;
      }
    }
    controls.update();
  }

  // Put the fact card beside the selected planet, avoiding the control panel.
  function placeInfoCard(radiusWorld) {
    infoAnchor.getWorldPosition(focusTarget);
    const projected = stage.project(focusTarget);
    if (!projected.visible) { infoCard.hidden = true; return; }
    infoCard.hidden = false;
    const { w, h } = stage.size();
    const radius = stage.screenRadius(focusTarget, radiusWorld);
    const cardWidth = infoCard.offsetWidth;
    const cardHeight = infoCard.offsetHeight;
    const vertical = THREE.MathUtils.clamp(projected.y - cardHeight / 2, 12, h - cardHeight - 12);
    const horizontal = THREE.MathUtils.clamp(projected.x - cardWidth / 2, 12, w - cardWidth - 12);
    const positions = [
      [projected.x + radius + 18, vertical],
      [projected.x - radius - cardWidth - 18, vertical],
      [horizontal, projected.y + radius + 18],
      [horizontal, projected.y - radius - cardHeight - 18],
    ].map(([left, top]) => [
      THREE.MathUtils.clamp(left, 12, w - cardWidth - 12),
      THREE.MathUtils.clamp(top, 12, h - cardHeight - 12),
    ]);
    const collapsed = () => document.body.classList.contains('solar-controls-collapsed');
    const controlsRect = document.getElementById('solar-controls').getBoundingClientRect();
    const overlapsControls = ([left, top]) => !collapsed()
      && left < controlsRect.right && left + cardWidth > controlsRect.left
      && top < controlsRect.bottom && top + cardHeight > controlsRect.top;
    let position = positions.find((candidate) => !overlapsControls(candidate));
    if (!position && !collapsed()) {
      document.body.classList.add('solar-controls-collapsed');
      document.getElementById('solar-controls-hide').setAttribute('aria-expanded', 'false');
      document.getElementById('solar-controls-show').setAttribute('aria-expanded', 'false');
      position = positions[0];
    }
    const [left, top] = position ?? positions[0];
    infoCard.style.left = `${left}px`;
    infoCard.style.top = `${top}px`;
  }

  focus.addEventListener('change', () => {
    const selected = orbits.find((planet) => planet.name === focus.value);
    missionSelect.value = 'none';
    selectedMissionName = null;
    focusZoomDistance = selected
      ? THREE.MathUtils.clamp(selected.radius * 2.8, controls.minDistance, controls.maxDistance)
      : null;
    if (selected) returningToOverview = false;
    else if (active) returningToOverview = true;
    focusStatus.textContent = selected
      ? `Visiting ${selected.name} · Point at the light at the bottom to go back`
      : IDLE_STATUS;
  });

  missionSelect.addEventListener('change', () => {
    const selected = missions.find((mission) => mission.name === missionSelect.value);
    selectedMissionName = selected?.name ?? null;
    if (selected) {
      focus.value = 'none';
      focusZoomDistance = 20;
      returningToOverview = false;
      showInfo(selected.name, selected, selected.anchor);
      focusStatus.textContent = `Visiting ${selected.name} · Point at the light at the bottom to go back`;
    } else if (focus.value === 'none' && active) {
      infoCard.hidden = true;
      narrator.silence();
      returningToOverview = true;
      focusStatus.textContent = IDLE_STATUS;
    }
  });

  infoSpeak.addEventListener('click', () => speakInfo(true));
  document.getElementById('solar-planet-info-close').addEventListener('click', backToOverview);

  return { start, stop, update, targets, get active() { return active; } };
}
