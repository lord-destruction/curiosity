import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createTerrain, heightAt } from './scene/terrain.js';
import { createSky } from './scene/sky.js';
import { createLighting } from './scene/lighting.js';
import { createRocks } from './scene/rocks.js';
import { createDust } from './scene/dust.js';
import { createMoons } from './scene/moons.js';
import { createRover } from './rover/rover.js';
import { createPercyTelemetry } from './telemetry/percyTelemetry.js';
import { createKeyboard } from './controls/keyboard.js';
import { createDriving } from './rover/driving.js';
import { createDiagram } from './ui/diagram.js';

// Renderer
const canvas = document.querySelector('#app');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Escena
const scene = new THREE.Scene();
createSky(scene);
const lighting = createLighting(scene);
scene.add(createTerrain());
scene.add(createRocks());

const dust = createDust();
scene.add(dust.points);

const moons = createMoons();
scene.add(moons.group);

const { rover, wheels } = createRover();
rover.position.y = heightAt(0, 0);
rover.rotation.y = 0.5; // de tres cuartos hacia la cámara
scene.add(rover);

// Manejo con WASD o flechas.
const keyboard = createKeyboard();
const driving = createDriving(rover, wheels, keyboard);

// Envía la telemetría de Percy al control de misión (/mision/).
const telemetry = createPercyTelemetry(rover, driving);

// Diagrama en pantalla de cómo fluye el control por el código.
const diagram = createDiagram();

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

// La cámara se desplaza lo mismo que el rover, así conserva el ángulo y la
// distancia que hayas elegido con el ratón.
const posicionAnterior = rover.position.clone();
const desplazamiento = new THREE.Vector3();

function seguirRover() {
  desplazamiento.subVectors(rover.position, posicionAnterior);
  camera.position.add(desplazamiento);
  controls.target.add(desplazamiento);
  posicionAnterior.copy(rover.position);
  lighting.follow(rover.position);
}

// Bucle de animación
const timer = new THREE.Timer();
timer.connect(document); // con la pestaña oculta el tiempo no avanza

function animate(timestamp) {
  timer.update(timestamp);
  const delta = Math.min(timer.getDelta(), 0.1); // segundos; limitado por si un cuadro tarda mucho

  driving.update(delta);
  seguirRover();
  dust.update(delta, camera.position);
  moons.update(delta);
  controls.update();
  diagram.update(delta, {
    teclas: keyboard.teclas(),
    manejo: driving.estado,
    inclinacion: THREE.MathUtils.radToDeg(Math.hypot(rover.rotation.x, rover.rotation.z)),
    telemetria: telemetry.estado,
    deltaMs: delta * 1000,
  });
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
