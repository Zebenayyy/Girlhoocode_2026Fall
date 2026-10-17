import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { createRenderer } from './core/renderer.js';
import { createSpace } from './world/space.js';

const renderer = createRenderer();
document.body.appendChild(VRButton.createButton(renderer));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 1000);
camera.position.set(0, 1.6, 0); // desktop preview; in VR the headset drives the camera

const space = createSpace(scene);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  space.update(dt);
  renderer.render(scene, camera);
});
