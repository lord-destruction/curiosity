import { CANAL, MENSAJE, MEDICIONES } from '../src/telemetry/canal.js';
import { TABLERO } from './tablero.js';

const NAMESPACE = 'percy';
const TIPO = 'percy.medicion';
const ESPERA_HISTORIAL_MS = 800; // si la simulación no está abierta, no esperar más
const MAX_HISTORIAL = 3600;

// La hora de cada lectura es el eje X de todas las gráficas.
const HORA = { key: 'utc', source: 'utc', name: 'Hora', format: 'utc', hints: { domain: 1 } };

// Una medición como valor de Open MCT; `range` dice en qué orden van al eje Y.
const comoValor = (medicion, orden) => ({ ...medicion, hints: { range: orden } });

// Objetos del árbol: la carpeta «Percy», el tablero, una medición por objeto
// (cada una con su propia gráfica) y «Todas las mediciones» para una tabla.
const OBJETOS = {
  rover: {
    name: 'Percy',
    type: 'folder',
    composition: ['tablero', ...MEDICIONES.map((m) => m.key), 'todas'].map((key) => ({ namespace: NAMESPACE, key })),
  },
  tablero: TABLERO,
  ...Object.fromEntries(
    MEDICIONES.map((m) => [
      m.key,
      { name: m.name, type: TIPO, telemetry: { values: [HORA, comoValor(m, 1)] } },
    ]),
  ),
  todas: {
    name: 'Todas las mediciones',
    type: TIPO,
    telemetry: { values: [HORA, ...MEDICIONES.map((m, i) => comoValor(m, i + 1))] },
  },
};

// Plugin de Open MCT: registra el tipo, la carpeta «Percy», el diccionario
// de objetos y el proveedor de telemetría que escucha a la simulación.
export function PercyPlugin() {
  return function install(openmct) {
    openmct.types.addType(TIPO, {
      name: 'Medición de Percy',
      description: 'Telemetría de la simulación del rover Perseverance.',
      cssClass: 'icon-telemetry',
    });

    openmct.objects.addRoot({ namespace: NAMESPACE, key: 'rover' });
    openmct.objects.addProvider(NAMESPACE, {
      get(identifier) {
        const objeto = OBJETOS[identifier.key];
        if (!objeto) return Promise.reject(new Error(`Percy no tiene el objeto ${identifier.key}`));
        const location = identifier.key === 'rover' ? 'ROOT' : `${NAMESPACE}:rover`;
        return Promise.resolve({ identifier, location, ...objeto });
      },
    });

    const historial = []; // lecturas ordenadas por hora
    const oyentes = new Set();
    const canal = new BroadcastChannel(CANAL);

    function guardar(datos) {
      for (const dato of datos) {
        if (historial.length && dato.utc <= historial[historial.length - 1].utc) continue;
        historial.push(dato);
      }
      if (historial.length > MAX_HISTORIAL) historial.splice(0, historial.length - MAX_HISTORIAL);
    }

    // Al abrir Open MCT, pide a la simulación las lecturas que ya envió.
    const historialListo = new Promise((resolve) => {
      canal.onmessage = ({ data: mensaje }) => {
        if (mensaje?.tipo === MENSAJE.HISTORIAL) {
          guardar(mensaje.datos);
          resolve();
        } else if (mensaje?.tipo === MENSAJE.DATO) {
          guardar([mensaje.dato]);
          oyentes.forEach((avisar) => avisar(mensaje.dato));
        }
      };
      canal.postMessage({ tipo: MENSAJE.PEDIR_HISTORIAL });
      setTimeout(resolve, ESPERA_HISTORIAL_MS);
    });

    const esDePercy = (objeto) => objeto.type === TIPO;

    openmct.telemetry.addProvider({
      supportsSubscribe: esDePercy,
      subscribe(objeto, callback) {
        oyentes.add(callback);
        return () => oyentes.delete(callback);
      },
      supportsRequest: esDePercy,
      async request(objeto, { start, end }) {
        await historialListo;
        return historial.filter((dato) => dato.utc >= start && dato.utc <= end);
      },
    });
  };
}
