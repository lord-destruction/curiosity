// Tablero de Percy: un objeto «Display Layout» de Open MCT generado desde el
// código. Las posiciones y tamaños van en celdas de 10 px (layoutGrid); el
// ancho total (87 celdas) cabe en una pantalla de 1400 px con el inspector.
// Formato de cada elemento: el mismo que crea el editor de Open MCT
// (src/plugins/displayLayout/components/TelemetryView.vue y SubobjectView.vue).

const NAMESPACE = 'percy';
const id = (key) => ({ namespace: NAMESPACE, key });

const COLUMNAS = [1, 30, 59]; // x de las tres columnas
const ANCHO_COLUMNA = 28;

// Valor con nombre y unidad: «Distancia recorrida  12.3 m»
const valor = (key, columna, y) => ({
  type: 'telemetry-view',
  id: `valor-${key}`,
  identifier: id(key),
  value: key,
  displayMode: 'all',
  showUnits: true,
  x: COLUMNAS[columna],
  y,
  width: ANCHO_COLUMNA,
  height: 4,
  stroke: '',
  fill: '',
  color: '',
  fontSize: 'default',
  font: 'default',
});

// Gráfica de una medición en el tiempo.
const grafica = (key, x, y, width, height) => ({
  type: 'subobject-view',
  id: `grafica-${key}`,
  identifier: id(key),
  viewKey: 'plot-single',
  hasFrame: true,
  x,
  y,
  width,
  height,
  fontSize: 'default',
  font: 'default',
});

const texto = (itemId, text, x, y, width, height, estilo = {}) => ({
  type: 'text-view',
  id: itemId,
  text,
  x,
  y,
  width,
  height,
  stroke: '',
  fill: '',
  color: '',
  fontSize: 'default',
  font: 'default',
  ...estilo,
});

const ITEMS = [
  texto('titulo', 'Percy · Cráter Jezero, Marte', 1, 1, 86, 3, { fontSize: '18' }),
  // Valores: movimiento, terreno, estado y comunicación con la Tierra
  valor('distancia', 0, 5),
  valor('velocidad', 1, 5),
  valor('altura', 2, 5),
  valor('inclinacion', 0, 10),
  valor('bateria', 1, 10),
  valor('temperatura', 2, 10),
  valor('retardoLuz', 0, 15),
  valor('distanciaTierra', 1, 15),
  texto('fuente-orbitas', 'Retardo y distancia: órbitas reales (JPL, elementos aproximados)', COLUMNAS[2], 15, ANCHO_COLUMNA, 4, {
    color: '#8a96a3',
    fontSize: '10',
  }),
  // Gráficas
  grafica('distancia', COLUMNAS[0], 20, ANCHO_COLUMNA, 22),
  grafica('altura', COLUMNAS[1], 20, ANCHO_COLUMNA, 22),
  grafica('inclinacion', COLUMNAS[2], 20, ANCHO_COLUMNA, 22),
  grafica('velocidad', 1, 43, 42, 22),
  grafica('bateria', 44, 43, 43, 22),
];

// Cada objeto usado en el tablero tiene que estar en su `composition`; si
// alguno faltara, Open MCT intentaría agregarlo y guardar el cambio.
const COMPOSICION = [...new Set(ITEMS.filter((item) => item.identifier).map((item) => item.identifier.key))];

export const TABLERO = {
  name: 'Tablero de misión',
  type: 'layout',
  composition: COMPOSICION.map(id),
  configuration: {
    items: ITEMS,
    layoutGrid: [10, 10],
    objectStyles: {},
  },
};
