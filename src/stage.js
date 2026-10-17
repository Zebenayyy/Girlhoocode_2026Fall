// The 3D stage: renderer, camera, real Milky Way background, and bloom for glowing objects.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const BASE = import.meta.env.BASE_URL;
export const FOV = 50;

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 300000);

  // NASA/Goddard SVS Deep Star Maps 2020: the real Milky Way and stars, all around you
  new THREE.TextureLoader().load(`${BASE}textures/milkyway.jpg`, (tex) => {
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    scene.background = tex;
    scene.backgroundIntensity = 0.55;
    scene.backgroundRotation.set(0.5, 0.9, 0.3); // put the bright Milky Way band across the view
  });

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.85, 0.6, 0.72);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let w = 1, h = 1;
  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const tmp = new THREE.Vector3();
  const camDir = new THREE.Vector3();

  // World position -> screen pixels. `visible` is false when it's behind the camera.
  function project(worldPos) {
    camera.getWorldDirection(camDir);
    tmp.copy(worldPos).sub(camera.position);
    const inFront = tmp.dot(camDir) > 0;
    tmp.copy(worldPos).project(camera);
    return { x: (tmp.x + 1) / 2 * w, y: (1 - tmp.y) / 2 * h, visible: inFront };
  }

  // How many pixels a sphere of `radius` at `worldPos` covers on screen.
  function screenRadius(worldPos, radius) {
    const d = camera.position.distanceTo(worldPos);
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    return (radius / (d * Math.tan(halfFov))) * (h / 2);
  }

  return {
    renderer,
    scene,
    camera,
    project,
    screenRadius,
    size: () => ({ w, h }),
    render: () => composer.render(),
  };
}
