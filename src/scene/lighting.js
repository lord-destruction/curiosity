import * as THREE from 'three';
import { createRadialTexture } from '../utils/textures.js';

// Sol bajo de media tarde, por el oeste (+X): luz cálida y sombras largas.
const SUN_DIRECTION = new THREE.Vector3(0.8, 0.42, -0.43).normalize();
const SUN_COLOR = 0xffcf99;

// Sol (luz direccional con sombras), disco solar visible y una luz hemisférica
// que imita la luz difusa que rebota en el polvo de la atmósfera.
export function createLighting(scene) {
  const sun = new THREE.DirectionalLight(SUN_COLOR, 3);
  sun.position.copy(SUN_DIRECTION).multiplyScalar(80);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.bottom = -50;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 200;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const ambient = new THREE.HemisphereLight(0xe6b98f, 0x5a2e1a, 0.7);
  scene.add(ambient);

  // Desde Marte el Sol se ve más pequeño que desde la Tierra (~2/3).
  const disc = new THREE.Mesh(
    new THREE.SphereGeometry(10, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xfff4e0, fog: false }),
  );
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createRadialTexture(),
      color: SUN_COLOR,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  );
  halo.scale.setScalar(220);
  const sunVisual = new THREE.Group();
  sunVisual.name = 'sol';
  sunVisual.add(disc, halo);
  sunVisual.position.copy(SUN_DIRECTION).multiplyScalar(1500);
  scene.add(sunVisual);

  return { sun, ambient };
}
