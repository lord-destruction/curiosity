import * as THREE from 'three';
import { CANAL, MENSAJE } from './canal.js';

const INTERVALO_MS = 1000; // una lectura por segundo
const MAX_HISTORIAL = 3600; // una hora de lecturas

const VELOCIDAD_MAXIMA = 0.042; // m/s, la del rover real
const CICLO_MANEJO = 120; // s: 60 s avanzando y 60 s detenido
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

// Telemetría de Percy. El rover todavía no se maneja (paso 3 del CLAUDE.md),
// así que velocidad, batería y temperatura se simulan; la inclinación sale de
// la orientación real del modelo 3D.
export function createPercyTelemetry(rover) {
  const canal = new BroadcastChannel(CANAL);
  const historial = [];
  const inicio = performance.now();
  let bateria = 92;
  let ultimaLectura = inicio;

  canal.onmessage = ({ data: mensaje }) => {
    if (mensaje?.tipo === MENSAJE.PEDIR_HISTORIAL) {
      canal.postMessage({ tipo: MENSAJE.HISTORIAL, datos: historial });
    }
  };

  function leer() {
    const ahora = performance.now();
    const tiempo = (ahora - inicio) / 1000; // segundos desde que arrancó la simulación
    const delta = (ahora - ultimaLectura) / 1000;
    ultimaLectura = ahora;

    const avanzando = tiempo % CICLO_MANEJO < CICLO_MANEJO / 2;
    const velocidad = avanzando ? VELOCIDAD_MAXIMA * (0.9 + 0.1 * Math.random()) : 0;

    // Avanzar gasta batería; detenido, el generador MMRTG la recarga.
    bateria += (avanzando ? -0.02 : 0.012) * delta;
    bateria = THREE.MathUtils.clamp(bateria, 20, 100);

    // En Jezero el aire va de unos -80 °C de madrugada a -20 °C por la tarde.
    const temperatura =
      -50 + 30 * Math.sin((2 * Math.PI * tiempo) / SOL_ACELERADO) + (Math.random() - 0.5);

    const inclinacion = THREE.MathUtils.radToDeg(Math.hypot(rover.rotation.x, rover.rotation.z));

    return { utc: Date.now(), velocidad, bateria, temperatura, inclinacion };
  }

  function enviar() {
    const dato = leer();
    historial.push(dato);
    if (historial.length > MAX_HISTORIAL) historial.shift();
    canal.postMessage({ tipo: MENSAJE.DATO, dato });
  }

  enviar();
  createTicker(INTERVALO_MS, enviar);
}
