// Busca en qué línea está un fragmento de código. Vite incluye el texto de
// los archivos fuente (import.meta.glob con ?raw), así que los números de
// línea del diagrama se calculan al cargar y nunca se desactualizan.
const FUENTES = import.meta.glob(['/src/**/*.js', '/mision/*.js'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

// Devuelve el número de línea (desde 1) o null si el fragmento no aparece.
export function lineaDe(archivo, fragmento) {
  const fuente = FUENTES[`/${archivo}`];
  if (!fuente) return null;
  const indice = fuente.split('\n').findIndex((linea) => linea.includes(fragmento));
  return indice === -1 ? null : indice + 1;
}
