import * as THREE from 'three';

const SIZE = 800; // metros por lado (el borde queda oculto por la niebla)
const SEGMENTS = 400;

const GROUND_COLOR = new THREE.Color(0xb5643c); // óxido marciano
const DUNE_COLOR = new THREE.Color(0x6e4330); // arena basáltica, más oscura
const DUNE_PERIOD = 22; // metros entre crestas de dunas
const FLAT_RADIUS = 6; // zona casi plana alrededor del rover

function smoothstep(edge0, edge1, x) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

// 0 fuera del campo de dunas, 1 dentro. Las dunas empiezan unos 40 m al sur
// (eje -Z) y llegan a su altura máxima a los 90 m.
export function duneMask(x, z) {
  return smoothstep(-40, -90, z);
}

// Perfil asimétrico de duna: subida suave por barlovento y caída brusca por
// sotavento. La línea de cresta se ondula para que no sean filas perfectas.
function duneHeight(x, z) {
  const s = x * 0.9 + z * 0.43 + 6 * Math.sin(z * 0.05) + 4 * Math.sin(x * 0.02);
  const f = s / DUNE_PERIOD - Math.floor(s / DUNE_PERIOD);
  let h = f < 0.75 ? f / 0.75 : (1 - f) / 0.25;
  h = h * h * (3 - 2 * h);
  const amplitude = 0.7 + 0.3 * Math.sin(z * 0.04 + x * 0.01);
  return 3.5 * h * amplitude;
}

// Altura del suelo (eje Y) en cualquier punto (x, z). La usan las rocas y el
// rover para apoyarse sobre el terreno.
export function heightAt(x, z) {
  const hills =
    1.2 * Math.sin(x * 0.035 + 1.3) * Math.cos(z * 0.03) +
    0.4 * Math.sin(x * 0.11 + z * 0.07) +
    0.15 * Math.sin(x * 0.31 - z * 0.27);
  const ripples = 0.05 * Math.sin(x * 0.9) * Math.cos(z * 0.7);
  const awayFromRover = smoothstep(FLAT_RADIUS, 30, Math.hypot(x, z));
  return hills * awayFromRover + ripples + duneHeight(x, z) * duneMask(x, z);
}

export function createTerrain() {
  const geometry = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
  geometry.rotateX(-Math.PI / 2); // de vertical (XY) a horizontal (XZ)

  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    position.setY(i, heightAt(x, z));

    // Las dunas son más oscuras; una variación suave rompe el color uniforme.
    const variation = 0.92 + 0.08 * Math.sin(x * 0.13) * Math.cos(z * 0.11);
    color.copy(GROUND_COLOR).lerp(DUNE_COLOR, duneMask(x, z) * 0.8).multiplyScalar(variation);
    color.toArray(colors, i * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1,
    metalness: 0,
  });

  const terrain = new THREE.Mesh(geometry, material);
  terrain.receiveShadow = true;
  terrain.name = 'terreno';
  return terrain;
}
