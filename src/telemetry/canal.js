// Protocolo compartido entre la simulación y el control de misión (Open MCT).
// Las dos páginas se sirven desde el mismo origen, así que se comunican con
// un BroadcastChannel del navegador: no hace falta ningún servidor.

export const CANAL = 'percy-telemetria';

// Mensajes:
//   { tipo: 'dato', dato }                → la simulación envía una lectura
//   { tipo: 'pedir-historial' }           → Open MCT pide lo que se perdió
//   { tipo: 'historial', datos: [dato…] } → la simulación responde
export const MENSAJE = {
  DATO: 'dato',
  PEDIR_HISTORIAL: 'pedir-historial',
  HISTORIAL: 'historial',
};

// Cada lectura es un objeto plano: { utc, velocidad, bateria, temperatura, inclinacion }.
export const MEDICIONES = [
  { key: 'velocidad', name: 'Velocidad', unit: 'm/s', formatString: '%0.3f' },
  { key: 'bateria', name: 'Batería', unit: '%', formatString: '%0.1f' },
  { key: 'temperatura', name: 'Temperatura del aire', unit: '°C', formatString: '%0.1f' },
  { key: 'inclinacion', name: 'Inclinación', unit: '°', formatString: '%0.1f' },
];
