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

// Cada lectura es un objeto plano con `utc` y una propiedad por medición.
export const MEDICIONES = [
  { key: 'velocidad', name: 'Velocidad', unit: 'm/s', formatString: '%0.2f' },
  { key: 'distancia', name: 'Distancia recorrida', unit: 'm', formatString: '%0.1f' },
  { key: 'altura', name: 'Altura del terreno', unit: 'm', formatString: '%0.2f' },
  { key: 'inclinacion', name: 'Inclinación', unit: '°', formatString: '%0.1f' },
  { key: 'bateria', name: 'Batería', unit: '%', formatString: '%0.1f' },
  { key: 'temperatura', name: 'Temperatura del aire', unit: '°C', formatString: '%0.1f' },
  { key: 'retardoLuz', name: 'Retardo de luz', unit: 'min', formatString: '%0.2f' }, // Tierra → Marte
  { key: 'distanciaTierra', name: 'Distancia a la Tierra', unit: 'M km', formatString: '%0.1f' }, // millones de km
];
