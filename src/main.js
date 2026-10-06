import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createTerrain, heightAt } from './scene/terrain.js';
import { createSky } from './scene/sky.js';
import { createLighting } from './scene/lighting.js';
import { createRocks } from './scene/rocks.js';
import { createDust } from './scene/dust.js';
import { createMoons } from './scene/moons.js';
import { createRover } from './rover/rover.js';

// Renderer
const canvas = document.querySelector('#app');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Escena
const scene = new THREE.Scene();
createSky(scene);
createLighting(scene);
scene.add(createTerrain());
scene.add(createRocks());

const dust = createDust();
scene.add(dust.points);

const moons = createMoons();
scene.add(moons.group);

const { rover } = createRover();
rover.position.y = heightAt(0, 0);
rover.rotation.y = 0.5; // de tres cuartos hacia la cámara
scene.add(rover);

// Cámara y controles
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(7, 2.6, 8);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1.2, 0);
controls.enableDamping = true;
controls.minDistance = 3;
controls.maxDistance = 150;
controls.maxPolarAngle = THREE.MathUtils.degToRad(85); // no bajar del suelo
controls.update();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Bucle de animación
const clock = new THREE.Clock();

function animate() {
  const delta = Math.min(clock.getDelta(), 0.1); // segundos; limitado si la pestaña estuvo en pausa

  dust.update(delta, camera.position);
  moons.update(delta);
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
