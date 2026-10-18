import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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

const PLANET_FACTS = {
  Mercury: {
    facts: ['A year on Mercury lasts 88 Earth days.', 'Mercury has no moons.'],
    source: 'https://science.nasa.gov/mercury/facts/',
  },
  Venus: {
    facts: ['Venus is the hottest planet in our solar system.', 'It rotates in the opposite direction from most planets.'],
    source: 'https://science.nasa.gov/venus/venus-facts/',
  },
  Earth: {
    facts: ['Earth is the only world known to host life.', 'It is the only planet in our solar system with liquid water on its surface.'],
    source: 'https://science.nasa.gov/earth/facts/',
  },
  Mars: {
    facts: ['Mars gets its red color from iron minerals that have rusted.', 'It has two small moons: Phobos and Deimos.'],
    source: 'https://science.nasa.gov/mars/facts/',
  },
  Jupiter: {
    facts: ['Jupiter is the largest planet in our solar system.', 'Its Great Red Spot is a storm larger than Earth.'],
    source: 'https://science.nasa.gov/jupiter/jupiter-facts/',
  },
  Saturn: {
    facts: ['Saturn’s rings are made mostly of pieces of ice and rock.', 'A day on Saturn lasts about 10.7 hours.'],
    source: 'https://science.nasa.gov/saturn/facts/',
  },
  Uranus: {
    facts: ['Uranus rotates at a tilt of about 98 degrees, appearing to spin on its side.', 'It takes about 84 Earth years to orbit the Sun.'],
    source: 'https://science.nasa.gov/uranus/facts/',
  },
  Neptune: {
    facts: ['Neptune takes about 165 Earth years to orbit the Sun.', 'It has supersonic winds.'],
    source: 'https://science.nasa.gov/neptune/neptune-facts/',
  },
};

const MISSIONS = [
  {
    name: 'Perseverance',
    planet: 'Mars',
    offset: [4.5, 2.2, 0],
    facts: ['NASA’s rover landed on Mars on Feb. 18, 2021.', 'It is exploring an ancient lakebed and collecting rock samples.'],
    source: 'https://science.nasa.gov/mission/mars-2020-perseverance/',
  },
  {
    name: 'Cassini',
    planet: 'Saturn',
    offset: [17, 3, 0],
    facts: ['Cassini studied Saturn and its moons from orbit for 13 years.', 'Its Huygens probe landed on Saturn’s moon Titan in 2005.'],
    source: 'https://science.nasa.gov/mission/cassini/',
  },
  {
    name: 'Voyager 1',
    position: [116, 0, 0],
    facts: ['Voyager 1 entered interstellar space in 2012.', 'It launched in 1977 and is the most distant human-made object.'],
    source: 'https://science.nasa.gov/mission/voyager/',
  },
];

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
  probe.traverse((object) => {
    if (object.isMesh) object.userData.missionProbe = true;
  });
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

export function createSolarSystem(stage, getVoiceOn = () => false) {
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
      return { ...mission, anchor, probe };
    });
    built = true;
  }

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enableZoom = false;
  controls.minDistance = 12;
  controls.maxDistance = 350;
  controls.enabled = false;

  const focus = document.getElementById('solar-focus');
  const missionSelect = document.getElementById('solar-mission');
  const orbitSpeed = document.getElementById('solar-orbit-speed');
  const spinSpeed = document.getElementById('solar-spin-speed');
  const focusStatus = document.getElementById('solar-focus-status');
  const focusTarget = new THREE.Vector3();
  const focusDelta = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  const cameraOffset = new THREE.Vector3();
  const spherical = new THREE.Spherical();
  const overviewTarget = new THREE.Vector3();
  const handCursor = document.getElementById('solar-cursor');
  const hoverLabel = document.getElementById('solar-hover-label');
  const infoCard = document.getElementById('solar-planet-info');
  const infoTitle = document.getElementById('solar-planet-info-title');
  const infoFacts = document.getElementById('solar-planet-info-facts');
  const infoSource = document.getElementById('solar-planet-info-source');
  const infoSpeak = document.getElementById('solar-planet-info-speak');
  let previousHand = null;
  let handPinching = false;
  let hoveredPlanet = null;
  let hoverTime = 0;
  let dwellFired = false;
  let focusZoomDistance = null;
  let overviewDistance = 224;
  let focusedPlanetHoverArmed = false;
  let suppressDwellPlanet = null;
  let returningToOverview = false;
  let active = false;
  const mousePointer = { active: false, x: 0, y: 0 };
  let pointerDown = null;
  let infoPlanet = null;
  let selectedMissionName = null;
  let infoAnchor = null;
  let infoNarration = '';

  renderer.domElement.addEventListener('pointermove', (event) => {
    mousePointer.active = true;
    mousePointer.x = event.clientX;
    mousePointer.y = event.clientY;
  });
  renderer.domElement.addEventListener('pointerdown', (event) => {
    if (event.button === 0) pointerDown = { x: event.clientX, y: event.clientY };
  });
  renderer.domElement.addEventListener('pointerup', (event) => {
    if (!pointerDown) return;
    const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
    pointerDown = null;
    if (moved > 6) return;
    const item = itemAt(event.clientX, event.clientY);
    if (item?.type === 'planet') {
      focus.value = item.name;
      focus.dispatchEvent(new Event('change'));
    } else if (item?.type === 'mission') {
      missionSelect.value = item.name;
      missionSelect.dispatchEvent(new Event('change'));
    }
  });
  renderer.domElement.addEventListener('pointerleave', () => {
    mousePointer.active = false;
    pointerDown = null;
    if (focus.value !== 'none') focusedPlanetHoverArmed = true;
  });

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
    infoPlanet = null;
    infoAnchor = null;
    infoCard.hidden = true;
    window.speechSynthesis?.cancel();
    focusZoomDistance = null;
    focusedPlanetHoverArmed = false;
    suppressDwellPlanet = null;
    returningToOverview = false;
    focusStatus.textContent = 'Point and hold over a planet or spacecraft for 2 seconds to select';
  }

  function stop() {
    active = false;
    group.visible = false;
    controls.enabled = false;
    camera.far = journeyFarPlane;
    camera.updateProjectionMatrix();
    previousHand = null;
    handPinching = false;
    hoveredPlanet = null;
    hoverTime = 0;
    dwellFired = false;
    focusedPlanetHoverArmed = false;
    suppressDwellPlanet = null;
    returningToOverview = false;
    focusZoomDistance = null;
    handCursor.classList.remove('pinching');
    handCursor.classList.remove('hovering');
    handCursor.style.display = 'none';
    hoverLabel.style.display = 'none';
    infoCard.hidden = true;
    infoPlanet = null;
    window.speechSynthesis?.cancel();
  }

  function resetHover() {
    hoveredPlanet = null;
    hoverTime = 0;
    dwellFired = false;
    handCursor.classList.remove('hovering');
    handCursor.style.removeProperty('--dwell-progress');
    hoverLabel.style.display = 'none';
    focusStatus.textContent = selectedMissionName
      ? `Exploring ${selectedMissionName} · Hover over it again to return`
      : focus.value === 'none'
        ? 'Point and hold over a planet or spacecraft for 2 seconds to select'
        : `Following ${focus.value} · Hold over another item for 2 seconds to select`;
  }

  function itemAt(x, y) {
    const { w, h } = stage.size();
    pointerNdc.set((x / w) * 2 - 1, 1 - (y / h) * 2);
    raycaster.setFromCamera(pointerNdc, camera);
    const hit = raycaster.intersectObjects([
      ...orbits.map((entry) => entry.body),
      ...missions.map((entry) => entry.probe),
    ], true)[0];
    if (hit) {
      const mission = missions.find((entry) => {
        let object = hit.object;
        while (object) {
          if (object === entry.probe) return true;
          object = object.parent;
        }
        return false;
      });
      if (mission) return { type: 'mission', ...mission };
      const planet = orbits.find((entry) => entry.body === hit.object);
      if (planet) return { type: 'planet', ...planet };
    }

    let nearest = null;
    let nearestRatio = Infinity;
    for (const planet of orbits) {
      planet.body.getWorldPosition(focusTarget);
      const projected = stage.project(focusTarget);
      if (!projected.visible) continue;
      const radius = stage.screenRadius(focusTarget, planet.radius);
      const distance = Math.hypot(x - projected.x, y - projected.y);
      const ratio = distance / Math.max(radius * 1.4, 26);
      if (ratio <= 1 && ratio < nearestRatio) {
        nearest = { type: 'planet', ...planet };
        nearestRatio = ratio;
      }
    }
    return nearest;
  }

  function selectItem(item) {
    if (item.type === 'planet') {
      focus.value = item.name;
      focus.dispatchEvent(new Event('change'));
      return;
    }
    missionSelect.value = item.name;
    missionSelect.dispatchEvent(new Event('change'));
  }

  function showInfo(name, details, anchor) {
    window.speechSynthesis?.cancel();
    infoPlanet = name;
    infoAnchor = anchor;
    infoNarration = `${name}. ${details.facts.join(' ')}`;
    infoTitle.textContent = name;
    infoFacts.replaceChildren(...details.facts.map((fact) => {
      const item = document.createElement('li');
      item.textContent = fact;
      return item;
    }));
    infoSource.href = details.source;
    infoCard.hidden = false;
    if (getVoiceOn()) speakInfo();
  }

  function speakInfo() {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(infoNarration);
    utterance.rate = 0.98;
    window.speechSynthesis.speak(utterance);
  }

  function updatePlanetHover(x, y, dt, allowFocus) {
    const item = itemAt(x, y);
    if (item?.name !== hoveredPlanet) {
      hoveredPlanet = item?.name ?? null;
      hoverTime = 0;
      dwellFired = false;
      if ((focus.value !== 'none' || selectedMissionName) && item?.name !== (selectedMissionName ?? focus.value)) {
        focusedPlanetHoverArmed = true;
      }
    }
    if (!item) {
      suppressDwellPlanet = null;
      resetHover();
      return;
    }

    hoverLabel.textContent = item.name;
    hoverLabel.style.left = `${Math.min(x + 18, window.innerWidth - 220)}px`;
    hoverLabel.style.top = `${Math.min(y + 18, window.innerHeight - 48)}px`;
    hoverLabel.style.display = 'block';

    if (item.name === (selectedMissionName ?? focus.value) && focusedPlanetHoverArmed) {
      const releasedPlanet = item.name;
      focus.value = 'none';
      missionSelect.value = 'none';
      selectedMissionName = null;
      focus.dispatchEvent(new Event('change'));
      suppressDwellPlanet = releasedPlanet;
      focusedPlanetHoverArmed = false;
      dwellFired = true;
      hoverLabel.textContent = `${releasedPlanet} · Returning to Solar System`;
      return;
    }
    if (item.name === suppressDwellPlanet) return;
    if (!allowFocus || dwellFired) return;
    handCursor.classList.add('hovering');
    hoverTime += dt;
    handCursor.style.setProperty('--dwell-progress', `${Math.min(hoverTime / 2, 1) * 100}%`);
    hoverLabel.textContent = `${item.name} · Hold ${Math.max(0, 2 - hoverTime).toFixed(1)}s to select`;
    focusStatus.textContent = `Hold over ${item.name} for ${Math.max(0, 2 - hoverTime).toFixed(1)} seconds to select`;
    if (hoverTime >= 2) {
      selectItem(item);
      dwellFired = true;
      hoverLabel.textContent = `${item.name} · Selected`;
    }
  }

  function orbitFromHand(hand, dt) {
    if (!hand?.active) {
      handPinching = false;
      previousHand = null;
      handCursor.classList.remove('pinching');
      if (mousePointer.active) {
        handCursor.style.display = 'none';
        updatePlanetHover(mousePointer.x, mousePointer.y, dt, false);
      } else {
        resetHover();
      }
      return;
    }

    if (!handPinching && hand.pinch) {
      handPinching = true;
      previousHand = { x: hand.x, y: hand.y };
    } else if (handPinching && !hand.pinch) {
      handPinching = false;
      previousHand = null;
      handCursor.classList.remove('pinching');
      hoverLabel.style.display = 'none';
      resetHover();
      return;
    }

    if (handPinching) {
      resetHover();
      hoverLabel.style.display = 'none';
      handCursor.style.left = `${hand.x}px`;
      handCursor.style.top = `${hand.y}px`;
      handCursor.classList.add('pinching');
      if (!previousHand) {
        previousHand = { x: hand.x, y: hand.y };
        return;
      }

      const dx = hand.x - previousHand.x;
      const dy = hand.y - previousHand.y;
      cameraOffset.copy(camera.position).sub(controls.target);
      spherical.setFromVector3(cameraOffset);
      spherical.theta -= dx * 0.006;
      spherical.phi = THREE.MathUtils.clamp(spherical.phi + dy * 0.006, 0.12, Math.PI - 0.12);
      cameraOffset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(cameraOffset);
      camera.lookAt(controls.target);
      previousHand = { x: hand.x, y: hand.y };
      return;
    }

    handCursor.classList.remove('pinching');
    updatePlanetHover(hand.x, hand.y, dt, true);
  }

  function update(t, dt, hand) {
    if (!active) return;
    handCursor.style.display = hand?.active ? 'block' : 'none';
    if (hand?.active) {
      handCursor.style.left = `${hand.x}px`;
      handCursor.style.top = `${hand.y}px`;
    } else {
      hoverLabel.style.display = 'none';
    }
    orbitFromHand(hand, dt);
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
        spherical.radius = THREE.MathUtils.lerp(
          spherical.radius,
          focusZoomDistance,
          1 - Math.exp(-dt * 3),
        );
        cameraOffset.setFromSpherical(spherical);
        camera.position.copy(controls.target).add(cameraOffset);
        if (Math.abs(spherical.radius - focusZoomDistance) < 0.1) {
          focusZoomDistance = null;
        }
      }
      if (infoPlanet !== selected.name) {
        showInfo(
          selected.name,
          selectedMission ? selectedMission : PLANET_FACTS[selected.name],
          anchor,
        );
      }
      infoAnchor.getWorldPosition(focusTarget);
      const projected = stage.project(focusTarget);
      if (projected.visible) {
        const { w, h } = stage.size();
        const radius = stage.screenRadius(focusTarget, selectedPlanet ? selected.radius : 3);
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
        const controlsElement = document.getElementById('solar-controls');
        const controlsRect = controlsElement.getBoundingClientRect();
        const overlapsControls = ([left, top]) => !document.body.classList.contains('solar-controls-collapsed')
          && left < controlsRect.right && left + cardWidth > controlsRect.left
          && top < controlsRect.bottom && top + cardHeight > controlsRect.top;
        let position = positions.find((candidate) => !overlapsControls(candidate));
        if (!position && !document.body.classList.contains('solar-controls-collapsed')) {
          document.body.classList.add('solar-controls-collapsed');
          document.getElementById('solar-controls-hide').setAttribute('aria-expanded', 'false');
          document.getElementById('solar-controls-show').setAttribute('aria-expanded', 'false');
          position = positions[0];
        }
        const [left, top] = position ?? positions[0];
        infoCard.style.left = `${left}px`;
        infoCard.style.top = `${top}px`;
      } else {
        infoCard.hidden = true;
      }
    } else if (returningToOverview) {
      window.speechSynthesis?.cancel();
      infoCard.hidden = true;
      infoPlanet = null;
      infoAnchor = null;
      const blend = 1 - Math.exp(-dt * 3);
      controls.target.lerp(overviewTarget, blend);
      cameraOffset.copy(camera.position).sub(controls.target);
      spherical.setFromVector3(cameraOffset);
      spherical.radius = THREE.MathUtils.lerp(spherical.radius, overviewDistance, blend);
      cameraOffset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(cameraOffset);
      if (controls.target.distanceTo(overviewTarget) < 0.1
        && Math.abs(spherical.radius - overviewDistance) < 0.1) {
        controls.target.copy(overviewTarget);
        cameraOffset.setLength(overviewDistance);
        camera.position.copy(controls.target).add(cameraOffset);
        returningToOverview = false;
      }
    }
    controls.update();
  }

  focus.addEventListener('change', () => {
    const selected = orbits.find((planet) => planet.name === focus.value);
    missionSelect.value = 'none';
    selectedMissionName = null;
    focusZoomDistance = selected
      ? THREE.MathUtils.clamp(selected.radius * 2.8, controls.minDistance, controls.maxDistance)
      : null;
    if (selected) {
      focusedPlanetHoverArmed = false;
      suppressDwellPlanet = null;
      returningToOverview = false;
    } else if (active) {
      returningToOverview = true;
    }
    focusStatus.textContent = selected
      ? `Zooming to ${selected.name} · Move off it, then hover over it again to return`
      : 'Point and hold over a planet or spacecraft for 2 seconds to select';
  });

  missionSelect.addEventListener('change', () => {
    const selected = missions.find((mission) => mission.name === missionSelect.value);
    selectedMissionName = selected?.name ?? null;
    if (selected) {
      focus.value = 'none';
      focusZoomDistance = 20;
      focusedPlanetHoverArmed = false;
      suppressDwellPlanet = null;
      returningToOverview = false;
      showInfo(selected.name, selected, selected.anchor);
      focusStatus.textContent = `Exploring ${selected.name} · Hover over it again to return`;
    } else if (focus.value === 'none' && active) {
      infoCard.hidden = true;
      window.speechSynthesis?.cancel();
      returningToOverview = true;
      focusStatus.textContent = 'Point and hold over a planet or spacecraft for 2 seconds to select';
    }
  });

  infoSpeak.disabled = !('speechSynthesis' in window);
  infoSpeak.addEventListener('click', speakInfo);
  document.getElementById('solar-planet-info-close').addEventListener('click', () => {
    focus.value = 'none';
    missionSelect.value = 'none';
    selectedMissionName = null;
    focus.dispatchEvent(new Event('change'));
  });

  return { start, stop, update };
}
