import * as THREE from 'three';
import { createBeam } from '../utils/geometry.js';

// Rover Perseverance hecho con primitivas, a escala real (metros).
// Ejes locales: adelante = +Z, izquierda = +X, arriba = +Y.
// Mide ~3 m de largo, 2,7 m de ancho y 2,2 m de alto.

export const WHEEL_RADIUS = 0.2625; // 52,5 cm de diámetro
const WHEEL_WIDTH = 0.4;
const WHEEL_X = 1.15; // centro de la rueda; el borde exterior queda a 1,35 m
const WHEEL_Z = { front: 1.0, middle: -0.05, rear: -1.0 };
const GROUSERS = 16; // tacos de la banda de rodadura

const materials = {
  body: new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.55 }),
  metal: new THREE.MeshStandardMaterial({ color: 0xb8b8b8, roughness: 0.4, metalness: 0.6 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.35, metalness: 0.8 }),
  lens: new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.1, metalness: 0.3 }),
};

export function createRover() {
  const rover = new THREE.Group();
  rover.name = 'perseverance';

  const wheels = [];
  for (const side of [1, -1]) {
    for (const z of Object.values(WHEEL_Z)) {
      const wheel = createWheel();
      wheel.position.set(side * WHEEL_X, WHEEL_RADIUS, z);
      rover.add(wheel);
      wheels.push(wheel);
    }
    rover.add(createRockerBogie(side));
  }

  rover.add(createBody(), createMast(), createArm(), createMMRTG(), createAntennas());

  rover.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  return { rover, wheels };
}

// Rueda con eje en X: girarla es cambiar `wheel.rotation.x`.
function createWheel() {
  const wheel = new THREE.Group();

  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_WIDTH, 32),
    materials.metal,
  );
  tire.rotation.z = Math.PI / 2;
  wheel.add(tire);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, WHEEL_WIDTH + 0.02, 16),
    materials.dark,
  );
  hub.rotation.z = Math.PI / 2;
  wheel.add(hub);

  const grouserGeometry = new THREE.BoxGeometry(WHEEL_WIDTH, 0.025, 0.04);
  for (let i = 0; i < GROUSERS; i++) {
    const angle = (i / GROUSERS) * Math.PI * 2;
    const grouser = new THREE.Mesh(grouserGeometry, materials.dark);
    grouser.position.set(0, Math.cos(angle) * WHEEL_RADIUS, Math.sin(angle) * WHEEL_RADIUS);
    grouser.rotation.x = angle;
    wheel.add(grouser);
  }
  return wheel;
}

// Suspensión rocker-bogie de un lado (side = 1 izquierda, -1 derecha):
// el balancín (rocker) une la rueda delantera con el boggie, y el boggie une
// la rueda central con la trasera.
function createRockerBogie(side) {
  const group = new THREE.Group();
  const x = side * 0.95;
  const p = (y, z) => new THREE.Vector3(x, y, z);
  const hub = (z) => new THREE.Vector3(side * (WHEEL_X - WHEEL_WIDTH / 2 - 0.02), WHEEL_RADIUS, z);

  const rockerPivot = p(0.85, 0.25);
  const bogiePivot = p(0.62, -0.5);
  const frontTop = p(0.7, WHEEL_Z.front - 0.05);
  const middleTop = p(0.55, WHEEL_Z.middle);
  const rearTop = p(0.55, WHEEL_Z.rear + 0.05);

  const beams = [
    [rockerPivot, frontTop],
    [rockerPivot, bogiePivot],
    [middleTop, bogiePivot],
    [bogiePivot, rearTop],
    [frontTop, hub(WHEEL_Z.front)],
    [middleTop, hub(WHEEL_Z.middle)],
    [rearTop, hub(WHEEL_Z.rear)],
  ];
  for (const [from, to] of beams) group.add(createBeam(from, to, 0.035, materials.metal));

  for (const pivot of [rockerPivot, bogiePivot]) {
    const joint = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), materials.dark);
    joint.position.copy(pivot);
    group.add(joint);
  }
  return group;
}

// Caja de electrónica caliente (el cuerpo) con la cubierta superior.
function createBody() {
  const group = new THREE.Group();

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 2.0), materials.body);
  chassis.position.y = 0.95;
  group.add(chassis);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.04, 2.15), materials.body);
  deck.position.y = 1.22;
  group.add(deck);

  // Barra diferencial sobre la cubierta: reparte el movimiento entre los dos
  // balancines para que el cuerpo quede nivelado.
  const differential = createBeam(
    new THREE.Vector3(-0.9, 1.28, 0.1),
    new THREE.Vector3(0.9, 1.28, 0.1),
    0.025,
    materials.gold,
  );
  group.add(differential);
  return group;
}

// Mástil con la cabeza de cámaras: SuperCam en el centro, Mastcam-Z a los lados.
function createMast() {
  const group = new THREE.Group();
  group.position.set(-0.55, 1.22, 0.75); // delante, lado derecho

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.8, 12), materials.metal);
  pole.position.y = 0.4;
  group.add(pole);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.25), materials.body);
  head.position.y = 0.88;
  group.add(head);

  const lenses = [
    { x: 0, radius: 0.08 }, // SuperCam
    { x: 0.17, radius: 0.04 }, // Mastcam-Z izquierda
    { x: -0.17, radius: 0.04 }, // Mastcam-Z derecha
  ];
  for (const { x, radius } of lenses) {
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.06, 16), materials.lens);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(x, 0.88, 0.14);
    group.add(lens);
  }
  return group;
}

// Brazo robótico plegado delante del rover, con la torreta de instrumentos.
function createArm() {
  const group = new THREE.Group();
  const shoulder = new THREE.Vector3(0.6, 0.95, 1.05);
  const elbow = new THREE.Vector3(-0.6, 0.95, 1.18);
  const wrist = new THREE.Vector3(0.2, 1.1, 1.25);

  group.add(createBeam(shoulder, elbow, 0.045, materials.metal));
  group.add(createBeam(elbow, wrist, 0.04, materials.metal));

  for (const joint of [shoulder, elbow, wrist]) {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), materials.dark);
    sphere.position.copy(joint);
    group.add(sphere);
  }

  // Torreta: taladro, cámaras y espectrómetros en un solo bloque.
  const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.25, 12), materials.gold);
  turret.position.copy(wrist).add(new THREE.Vector3(0.2, -0.05, 0.05));
  turret.rotation.z = Math.PI / 2;
  group.add(turret);

  const drill = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.2, 10), materials.dark);
  drill.position.copy(turret.position).add(new THREE.Vector3(0, -0.2, 0));
  drill.rotation.x = Math.PI;
  group.add(drill);
  return group;
}

// Generador de radioisótopos (MMRTG) inclinado en la parte trasera, con aletas
// para disipar el calor.
function createMMRTG() {
  const group = new THREE.Group();
  group.position.set(0, 1.1, -1.2);
  group.rotation.x = -0.7; // la parte superior apunta hacia atrás

  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.65, 16), materials.dark);
  group.add(core);

  const finGeometry = new THREE.BoxGeometry(0.02, 0.6, 0.14);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const fin = new THREE.Mesh(finGeometry, materials.dark);
    fin.position.set(Math.cos(angle) * 0.26, 0, Math.sin(angle) * 0.26);
    fin.rotation.y = -angle;
    group.add(fin);
  }
  return group;
}

// Antena de alta ganancia (disco hexagonal) y antena UHF.
function createAntennas() {
  const group = new THREE.Group();

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8), materials.metal);
  post.position.set(0.55, 1.32, -0.55);
  group.add(post);

  const highGain = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 6), materials.body);
  highGain.position.set(0.55, 1.45, -0.55);
  highGain.rotation.set(0.4, 0, 0.3);
  group.add(highGain);

  const uhf = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 12), materials.metal);
  uhf.position.set(-0.5, 1.33, -0.8);
  group.add(uhf);
  return group;
}
