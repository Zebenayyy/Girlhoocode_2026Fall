import * as THREE from 'three';

const STAR_COUNT = 3000;
const STAR_RADIUS = 400;

// All stars are a single Points mesh = one draw call.
function createStarfield() {
  const positions = new Float32Array(STAR_COUNT * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < STAR_COUNT; i++) {
    v.randomDirection().multiplyScalar(STAR_RADIUS);
    positions.set([v.x, v.y, v.z], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.2,
    sizeAttenuation: true,
  });
  return new THREE.Points(geometry, material);
}

function createEarth() {
  const earth = new THREE.Mesh(
    new THREE.IcosahedronGeometry(60, 3),
    new THREE.MeshLambertMaterial({ color: 0x2a6fdb, flatShading: true }),
  );
  earth.position.set(0, -90, -60);
  return earth;
}

// Something solid to stand on so the floor height feels right.
function createPlatform() {
  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 0.1, 24),
    new THREE.MeshLambertMaterial({ color: 0x8a94a6, flatShading: true }),
  );
  platform.position.y = -0.05;
  return platform;
}

export function createSpace(scene) {
  scene.background = new THREE.Color(0x000000);

  const sun = new THREE.DirectionalLight(0xffffff, 2.5);
  sun.position.set(50, 30, 20);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0x404a60, 1.0));

  const earth = createEarth();
  scene.add(createStarfield(), earth, createPlatform());

  return {
    update(dt) {
      earth.rotation.y += dt * 0.02;
    },
  };
}
