import * as THREE from 'three';
import { heightAt, duneMask } from './terrain.js';
import { createLumpyGeometry } from '../utils/geometry.js';
import { createRandom, randomRange } from '../utils/random.js';

const ROCK_COUNT = 450;
const SHAPES = 3; // formas distintas de roca
const CLEAR_RADIUS = 4; // sin rocas debajo del rover

// Rocas esparcidas con InstancedMesh: una sola llamada de dibujo por forma,
// aunque haya cientos de rocas.
export function createRocks() {
  const random = createRandom(42);
  const group = new THREE.Group();
  group.name = 'rocas';

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff, // el color real va por instancia
    roughness: 0.95,
    flatShading: true,
  });
  const baseColor = new THREE.Color(0x7d4a32);

  const meshes = Array.from({ length: SHAPES }, (_, i) => {
    const geometry = createLumpyGeometry({ detail: 1, roughness: 0.3, flattenBottom: 0.5, seed: i + 7 });
    const mesh = new THREE.InstancedMesh(geometry, material, Math.ceil(ROCK_COUNT / SHAPES));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.count = 0;
    group.add(mesh);
    return mesh;
  });

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const scale = new THREE.Vector3();
  const color = new THREE.Color();

  for (let i = 0; i < ROCK_COUNT; i++) {
    // Más rocas cerca del rover que lejos.
    const radius = CLEAR_RADIUS + Math.pow(random(), 1.5) * 110;
    const angle = random() * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (duneMask(x, z) > 0.5) continue; // las dunas son de arena, casi sin rocas

    // La mayoría son piedras pequeñas; pocas pasan de un metro.
    const size = 0.08 + Math.pow(random(), 4) * 1.2;
    scale.set(
      size * randomRange(random, 0.8, 1.3),
      size * randomRange(random, 0.5, 0.9),
      size * randomRange(random, 0.8, 1.3),
    );
    position.set(x, heightAt(x, z) + scale.y * 0.2, z); // semienterradas
    euler.set(randomRange(random, -0.2, 0.2), random() * Math.PI * 2, randomRange(random, -0.2, 0.2));
    rotation.setFromEuler(euler);
    matrix.compose(position, rotation, scale);

    const mesh = meshes[i % SHAPES];
    mesh.setMatrixAt(mesh.count, matrix);
    color.copy(baseColor).multiplyScalar(randomRange(random, 0.7, 1.2));
    mesh.setColorAt(mesh.count, color);
    mesh.count++;
  }

  return group;
}
