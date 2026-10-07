import * as THREE from 'three';
import { CANAL, MENSAJE } from './canal.js';
import { tierraMarte } from './lightTime.js';

const INTERVALO_MS = 1000; // una lectura por segundo
const MAX_HISTORIAL = 3600; // una hora de lecturas
const SOL_ACELERADO = 600; // s: un día marciano comprimido en 10 minutos

// Reloj en un Web Worker: el navegador frena requestAnimationFrame y los
// temporizadores de las pestañas ocultas, pero no los de un worker. Así la
// telemetría sigue llegando aunque mires Open MCT en otra pestaña.
function createTicker(intervalMs, onTick) {
  const code = `setInterval(() => postMessage(0), ${intervalMs});`;
  const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
  const worker = new Worker(url);
  worker.onmessage = onTick;
  return worker;
}

// Telemetría de Percy. Velocidad, distancia, altura e inclinación salen del
// manejo y del modelo 3D; el retardo de luz, de las órbitas reales; batería y
// temperatura se simulan.
export function createPercyTelemetry(rover, driving) {
  const canal = new BroadcastChannel(CANAL);
  const historial = [];
  const inicio = performance.now();
  let bateria = 92;
  let ultimaLectura = inicio;

  // Lo que el diagrama en pantalla muestra de este módulo.
  const estado = { ultimo: null, enviadoEn: 0, openmctConectado: false };

  canal.onmessage = ({ data: mensaje }) => {
    if (mensaje?.tipo === MENSAJE.PEDIR_HISTORIAL) {
      estado.openmctConectado = true;
      canal.postMessage({ tipo: MENSAJE.HISTORIAL, datos: historial });
    }
  };

  function leer() {
    const ahora = performance.now();
    const tiempo = (ahora - inicio) / 1000; // segundos desde que arrancó la simulación
    const delta = (ahora - ultimaLectura) / 1000;
    ultimaLectura = ahora;

    const velocidad = Math.abs(driving.estado.velocidad);

    // Moverse gasta batería según la velocidad; detenido, el MMRTG la recarga.
    bateria += (velocidad > 0.01 ? -0.05 * velocidad : 0.012) * delta;
    bateria = THREE.MathUtils.clamp(bateria, 20, 100);

    // En Jezero el aire va de unos -80 °C de madrugada a -20 °C por la tarde.
    const temperatura =
      -50 + 30 * Math.sin((2 * Math.PI * tiempo) / SOL_ACELERADO) + (Math.random() - 0.5);

    const inclinacion = THREE.MathUtils.radToDeg(Math.hypot(rover.rotation.x, rover.rotation.z));

    // Posiciones reales de la Tierra y Marte para la fecha de hoy.
    const utc = Date.now();
    const { retardoMinutos, distanciaMillonesKm } = tierraMarte(utc);

    return {
      utc,
      velocidad,
      distancia: driving.estado.distancia,
      altura: driving.estado.altura,
      inclinacion,
      bateria,
      temperatura,
      retardoLuz: retardoMinutos,
      distanciaTierra: distanciaMillonesKm,
    };
  }

  function enviar() {
    const dato = leer();
    historial.push(dato);
    if (historial.length > MAX_HISTORIAL) historial.shift();
    canal.postMessage({ tipo: MENSAJE.DATO, dato });
    estado.ultimo = dato;
    estado.enviadoEn = performance.now();
  }

  enviar();
  createTicker(INTERVALO_MS, enviar);
  return { estado };
}
