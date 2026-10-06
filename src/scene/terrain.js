import * as THREE from 'three';

const SIZE = 400; // metros por lado
const SEGMENTS = 200;
const COLOR = 0xb5643c; // óxido marciano

// Terreno casi plano: una ondulación suave (±0,3 m) para que la luz del Sol
// marque relieve sin dejar de ser una superficie plana.
export function createTerrain() {
  const geometry = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
  geometry.rotateX(-Math.PI / 2); // de vertical (XY) a horizontal (XZ)

  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const height =
      0.2 * Math.sin(x * 0.08) * Math.cos(z * 0.06) +
      0.1 * Math.sin(x * 0.23 + z * 0.17);
    position.setY(i, height);
  }
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: COLOR,
    roughness: 1,
    metalness: 0,
  });

  const terrain = new THREE.Mesh(geometry, material);
  terrain.receiveShadow = true;
  terrain.name = 'terreno';
  return terrain;
}
