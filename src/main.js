import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createTerrain } from './scene/terrain.js';
import { createSky } from './scene/sky.js';
import { createLighting } from './scene/lighting.js';

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

// TODO: reemplazar por el rover (paso 2).
// Caja del tamaño del Perseverance (3 m de largo, 2,2 m de alto, 2,7 m de ancho)
// para comprobar la escala y las sombras.
const referenceBox = new THREE.Mesh(
  new THREE.BoxGeometry(3, 2.2, 2.7),
  new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.6 }),
);
referenceBox.position.y = 1.1;
referenceBox.castShadow = true;
referenceBox.receiveShadow = true;
scene.add(referenceBox);

// Cámara y controles
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(6, 4, 6);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1, 0);
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
  // Segundos desde el último cuadro; se usará para mover el rover (paso 3).
  const delta = clock.getDelta(); // eslint-disable-line no-unused-vars

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
