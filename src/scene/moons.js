import * as THREE from 'three';
import { createLumpyGeometry } from '../utils/geometry.js';

const DISTANCE = 900; // metros: lejos, pero dentro del plano lejano de la cámara

// Ejes de la escena: norte = +Z, oeste = +X, sur = -Z, arriba = +Y.
const WEST = new THREE.Vector3(1, 0, 0);
// Las lunas cruzan el cielo del sur, a poca altura sobre el horizonte.
const SOUTHERN_ARC = new THREE.Vector3(0, 0.3, -0.95).normalize();

// Fobos y Deimos. Tamaños aumentados unas 3 veces para que se distingan;
// la velocidad también está acelerada. Fobos sale por el oeste y se pone por
// el este, al revés que el Sol, porque orbita más rápido de lo que Marte gira.
const MOONS = [
  { name: 'Fobos', radius: 9, color: 0x6b5d50, speed: 0.02, start: 2.3, seed: 11 },
  { name: 'Deimos', radius: 4, color: 0x8a7b6a, speed: 0.004, start: 1.75, seed: 23 },
];

export function createMoons() {
  const group = new THREE.Group();
  group.name = 'lunas';

  const moons = MOONS.map((config) => {
    const mesh = new THREE.Mesh(
      createLumpyGeometry({ detail: 3, roughness: 0.18, seed: config.seed }),
      // fog: false para que la niebla del suelo no las borre
      new THREE.MeshStandardMaterial({ color: config.color, roughness: 1, fog: false }),
    );
    mesh.name = config.name;
    mesh.scale.set(config.radius * 1.3, config.radius, config.radius * 1.1);
    group.add(mesh);
    return { mesh, config, angle: config.start };
  });

  // El ángulo va de 0 (horizonte oeste) a π (horizonte este).
  function place(moon) {
    moon.mesh.position
      .copy(WEST)
      .multiplyScalar(Math.cos(moon.angle) * DISTANCE)
      .addScaledVector(SOUTHERN_ARC, Math.sin(moon.angle) * DISTANCE);
    moon.mesh.visible = moon.mesh.position.y > -moon.config.radius; // ocultas bajo el horizonte
  }

  function update(delta) {
    for (const moon of moons) {
      moon.angle = (moon.angle + moon.config.speed * delta) % (Math.PI * 2);
      moon.mesh.rotation.y += moon.config.speed * delta * 0.5;
      place(moon);
    }
  }

  moons.forEach(place);
  return { group, update };
}
