import * as THREE from 'three';

const SKY_COLOR = 0xd8a274; // ocre/caramelo del cielo diurno de Marte

// Cielo de color uniforme y niebla del mismo tono, para que el horizonte se
// funda con el cielo como en las fotos del rover. La niebla termina antes del
// borde del terreno (400 m) para que nunca se vea el final del suelo.
export function createSky(scene) {
  scene.background = new THREE.Color(SKY_COLOR);
  scene.fog = new THREE.Fog(SKY_COLOR, 40, 380);
}
