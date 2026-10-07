import * as THREE from 'three';
import { heightAt } from '../scene/terrain.js';
import { WHEEL_RADIUS } from './rover.js';

const VELOCIDAD_MAXIMA = 1.5; // m/s: unas 35 veces la real (0,042 m/s) para que sea manejable
const ACELERACION = 1.2; // m/s²
const GIRO_MAXIMO = 0.5; // rad/s
const LARGO = 2.0; // m entre ejes delantero y trasero
const ANCHO = 2.3; // m entre ruedas izquierdas y derechas
const LIMITE = 180; // m desde el centro, para no salir del terreno
const AJUSTE_TERRENO = 6; // qué tan rápido se acomoda el cuerpo al suelo
const AJUSTE_DIRECCION = 8; // qué tan rápido giran las ruedas de las esquinas

const { clamp, lerp } = THREE.MathUtils;

// Mueve una cantidad hacia un objetivo sin pasarse.
function acercar(actual, objetivo, paso) {
  if (actual < objetivo) return Math.min(actual + paso, objetivo);
  return Math.max(actual - paso, objetivo);
}

// Manejo simple: el teclado da velocidad y giro; el rover avanza sobre el
// terreno, se inclina con él y mueve sus ruedas. Sin colisiones con rocas.
export function createDriving(rover, wheels, keyboard) {
  rover.rotation.order = 'YXZ'; // rumbo primero, luego cabeceo y alabeo
  wheels.forEach((wheel) => (wheel.rotation.order = 'YXZ')); // dirección y luego giro

  const estado = {
    velocidad: 0, // m/s, negativa marcha atrás
    giro: 0, // rad/s, positivo hacia la izquierda
    rumbo: rover.rotation.y, // rad
    altura: rover.position.y, // m, suelo bajo el rover
    distancia: 0, // m recorridos desde que arrancó la simulación
  };
  const adelante = new THREE.Vector3();
  const izquierda = new THREE.Vector3();

  // Con la pestaña oculta la simulación se pausa; el rover se detiene para
  // que la telemetría no siga informando una velocidad que no tiene.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      estado.velocidad = 0;
      estado.giro = 0;
    }
  });

  function update(delta) {
    const objetivo = keyboard.acelerador() * VELOCIDAD_MAXIMA;
    estado.velocidad = acercar(estado.velocidad, objetivo, ACELERACION * delta);
    estado.giro = keyboard.giro() * GIRO_MAXIMO;
    estado.rumbo += estado.giro * delta;

    // Adelante es +Z local e izquierda +X local, girados según el rumbo.
    adelante.set(Math.sin(estado.rumbo), 0, Math.cos(estado.rumbo));
    izquierda.set(Math.cos(estado.rumbo), 0, -Math.sin(estado.rumbo));

    rover.position.addScaledVector(adelante, estado.velocidad * delta);
    estado.distancia += Math.abs(estado.velocidad) * delta;
    rover.position.x = clamp(rover.position.x, -LIMITE, LIMITE);
    rover.position.z = clamp(rover.position.z, -LIMITE, LIMITE);

    apoyarEnTerreno(delta);
    moverRuedas(delta);
  }

  // Altura e inclinación a partir del suelo bajo las cuatro esquinas.
  function apoyarEnTerreno(delta) {
    const { x, z } = rover.position;
    const suelo = (direccion, distancia) =>
      heightAt(x + direccion.x * distancia, z + direccion.z * distancia);
    const frente = suelo(adelante, LARGO / 2);
    const atras = suelo(adelante, -LARGO / 2);
    const izq = suelo(izquierda, ANCHO / 2);
    const der = suelo(izquierda, -ANCHO / 2);

    estado.altura = (frente + atras + izq + der) / 4;
    const cabeceo = Math.atan2(atras - frente, LARGO); // positivo = nariz abajo
    const alabeo = Math.atan2(izq - der, ANCHO); // positivo = lado izquierdo arriba

    const t = 1 - Math.exp(-AJUSTE_TERRENO * delta);
    rover.position.y = lerp(rover.position.y, estado.altura, t);
    rover.rotation.set(lerp(rover.rotation.x, cabeceo, t), estado.rumbo, lerp(rover.rotation.z, alabeo, t));
  }

  // Cada rueda avanza a la velocidad de su punto del chasis: v + giro × posición.
  // Las de las esquinas se orientan en esa dirección, como en el rover real,
  // que puede girar sobre sí mismo con las cuatro esquinas a ~45°.
  function moverRuedas(delta) {
    const t = 1 - Math.exp(-AJUSTE_DIRECCION * delta);
    for (const wheel of wheels) {
      const lateral = estado.giro * wheel.position.z;
      const frontal = estado.velocidad - estado.giro * wheel.position.x;
      const esEsquina = Math.abs(wheel.position.z) > 0.5;

      let angulo = 0;
      let rapidez = frontal;
      if (esEsquina && Math.hypot(lateral, frontal) > 1e-3) {
        angulo = Math.atan2(lateral, frontal);
        rapidez = Math.hypot(lateral, frontal);
        // Mejor girar la rueda menos de 90° y rodar hacia atrás.
        if (Math.abs(angulo) > Math.PI / 2) {
          angulo -= Math.sign(angulo) * Math.PI;
          rapidez = -rapidez;
        }
        wheel.rotation.y = lerp(wheel.rotation.y, angulo, t);
      }
      wheel.rotation.x += (rapidez * delta) / WHEEL_RADIUS;
    }
  }

  return { estado, update };
}
