import * as THREE from 'three';
import { createRadialTexture } from '../utils/textures.js';
import { createRandom } from '../utils/random.js';

const COUNT = 4000;
const HALF_AREA = 60; // las partículas ocupan un cubo de 120 m alrededor del centro
const MAX_HEIGHT = 12;
const WIND = new THREE.Vector3(1.6, 0, -0.7); // m/s

// Polvo suspendido que el viento arrastra. Cuando una partícula sale del área
// reaparece por el lado opuesto, así el polvo nunca se acaba.
export function createDust() {
  const random = createRandom(7);
  const positions = new Float32Array(COUNT * 3);
  const phases = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (random() * 2 - 1) * HALF_AREA;
    positions[i * 3 + 1] = Math.pow(random(), 2) * MAX_HEIGHT; // más denso cerca del suelo
    positions[i * 3 + 2] = (random() * 2 - 1) * HALF_AREA;
    phases[i] = random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xe8c49a,
    size: 0.12,
    map: createRadialTexture(),
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  points.name = 'polvo';
  points.frustumCulled = false; // las posiciones cambian cada cuadro

  let time = 0;

  // `center` es el punto alrededor del cual se mantiene el polvo (la cámara).
  function update(delta, center) {
    time += delta;
    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      const gust = 1 + 0.4 * Math.sin(time * 0.7 + phases[i]);
      positions[ix] += WIND.x * gust * delta;
      positions[ix + 1] += Math.sin(time * 1.3 + phases[i]) * 0.15 * delta;
      positions[ix + 2] += WIND.z * gust * delta;

      positions[ix] = wrap(positions[ix], center.x);
      positions[ix + 2] = wrap(positions[ix + 2], center.z);
      if (positions[ix + 1] < 0.05) positions[ix + 1] = MAX_HEIGHT;
    }
    geometry.attributes.position.needsUpdate = true;
  }

  return { points, update };
}

function wrap(value, center) {
  const offset = value - center;
  if (offset > HALF_AREA) return value - HALF_AREA * 2;
  if (offset < -HALF_AREA) return value + HALF_AREA * 2;
  return value;
}
