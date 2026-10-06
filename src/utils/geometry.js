import * as THREE from 'three';
import { createRandom } from './random.js';

// Esfera deformada con forma irregular. Sirve para rocas y para las lunas,
// que son cuerpos pequeños sin forma esférica.
export function createLumpyGeometry({ detail = 2, roughness = 0.25, flattenBottom = 1, seed = 1 } = {}) {
  const geometry = new THREE.IcosahedronGeometry(1, detail);
  const random = createRandom(seed);
  const phases = Array.from({ length: 6 }, () => random() * Math.PI * 2);

  const position = geometry.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i);
    // La deformación depende solo de la posición, así los vértices
    // duplicados en la misma posición se mueven igual y no se abren grietas.
    const bump =
      Math.sin(v.x * 2.1 + phases[0]) * Math.sin(v.y * 1.7 + phases[1]) +
      0.6 * Math.sin(v.z * 3.3 + phases[2]) * Math.cos(v.x * 2.9 + phases[3]) +
      0.3 * Math.sin(v.y * 5.1 + phases[4]) * Math.sin(v.z * 4.7 + phases[5]);
    v.multiplyScalar(1 + roughness * bump);
    if (v.y < 0) v.y *= flattenBottom;
    position.setXYZ(i, v.x, v.y, v.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

// Cilindro entre dos puntos: útil para vigas, barras y patas.
export function createBeam(from, to, radius, material) {
  const direction = new THREE.Vector3().subVectors(to, from);
  const length = direction.length();
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 10), material);
  beam.position.copy(from).addScaledVector(direction, 0.5);
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return beam;
}
