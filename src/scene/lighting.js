import * as THREE from 'three';

// Sol (luz direccional con sombras) más una luz hemisférica que imita la luz
// difusa que rebota en el polvo de la atmósfera.
export function createLighting(scene) {
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.5);
  sun.position.set(30, 50, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.bottom = -50;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 150;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const ambient = new THREE.HemisphereLight(0xe0b48a, 0x5a2e1a, 0.8);
  scene.add(ambient);

  return { sun, ambient };
}
