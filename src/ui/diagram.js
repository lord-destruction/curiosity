import './diagram.css';
import { lineaDe } from './codeMap.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const ANCHO = 160;
const ALTO = 74;

// Cada caja apunta a un fragmento de código; su línea se busca al cargar.
const CAJAS = [
  { id: 'teclado', titulo: 'Teclado', archivo: 'src/controls/keyboard.js', buscar: "addEventListener('keydown'", x: 20, y: 20 },
  { id: 'bucle', titulo: 'Bucle de animación', archivo: 'src/main.js', buscar: 'function animate(', x: 200, y: 20 },
  { id: 'terreno', titulo: 'Altura del terreno', archivo: 'src/scene/terrain.js', buscar: 'export function heightAt', x: 380, y: 20 },
  { id: 'manejo', titulo: 'Manejo', archivo: 'src/rover/driving.js', buscar: 'function update(delta)', x: 200, y: 140 },
  { id: 'ruedas', titulo: 'Ruedas', archivo: 'src/rover/driving.js', buscar: 'function moverRuedas(delta)', x: 20, y: 260 },
  { id: 'camara', titulo: 'Cámara que sigue', archivo: 'src/main.js', buscar: 'function seguirRover()', x: 200, y: 260 },
  { id: 'telemetria', titulo: 'Telemetría', archivo: 'src/telemetry/percyTelemetry.js', buscar: 'function enviar()', x: 380, y: 260 },
  { id: 'openmct', titulo: 'Open MCT', archivo: 'mision/percy-plugin.js', buscar: 'subscribe(objeto, callback)', x: 380, y: 376 },
];

// [desde, hasta, etiqueta]
const FLECHAS = [
  ['teclado', 'manejo', 'teclas'],
  ['bucle', 'manejo', 'delta'],
  ['terreno', 'manejo', 'altura'],
  ['manejo', 'ruedas', 'avance'],
  ['manejo', 'camara', 'posición'],
  ['manejo', 'telemetria', 'velocidad'],
  ['telemetria', 'openmct', '1 lectura/s'],
];

function svg(tag, atributos = {}, texto) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(atributos)) el.setAttribute(k, v);
  if (texto !== undefined) el.textContent = texto;
  return el;
}

// Panel fijo sobre la escena con el diagrama de cómo fluye el control.
// Las cajas y flechas se iluminan cuando su parte del código está trabajando.
export function createDiagram() {
  const panel = document.createElement('section');
  panel.id = 'diagrama';
  panel.innerHTML = `
    <header>
      <div>
        <strong>Cómo fluye el control</strong>
        <span class="ayuda">W/S avanzar · A/D girar · H mostrar/ocultar</span>
      </div>
      <button type="button" aria-expanded="true">Ocultar</button>
    </header>`;
  const boton = panel.querySelector('button');

  const lienzo = svg('svg', {
    viewBox: '0 0 560 460',
    role: 'img',
    'aria-label': 'Diagrama: teclado, bucle de animación y terreno alimentan al manejo; el manejo mueve ruedas, cámara y telemetría; la telemetría llega a Open MCT.',
  });
  const defs = svg('defs');
  for (const [id, clase] of [['punta', ''], ['punta-activa', 'activa']]) {
    const marker = svg('marker', { id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' });
    marker.append(svg('path', { d: 'M0 0 L10 5 L0 10 z', class: `punta ${clase}` }));
    defs.append(marker);
  }
  lienzo.append(defs);

  const porId = Object.fromEntries(CAJAS.map((caja) => [caja.id, caja]));

  const flechas = FLECHAS.map(([desde, hasta, etiqueta]) => {
    const a = porId[desde];
    const b = porId[hasta];
    const x1 = a.x + ANCHO / 2;
    const y1 = a.y + ALTO;
    const x2 = b.x + ANCHO / 2;
    const y2 = b.y - 2;
    const grupo = svg('g', { class: 'flecha' });
    grupo.append(
      svg('line', { x1, y1, x2, y2, 'marker-end': 'url(#punta)' }),
      svg('text', { x: (x1 + x2) / 2 + 6, y: (y1 + y2) / 2, class: 'etiqueta' }, etiqueta),
    );
    lienzo.append(grupo);
    return { grupo, linea: grupo.querySelector('line'), desde, hasta };
  });

  const cajas = {};
  for (const caja of CAJAS) {
    const linea = lineaDe(caja.archivo, caja.buscar);
    if (linea === null) console.warn(`Diagrama: no encontré «${caja.buscar}» en ${caja.archivo}`);
    const nombre = caja.archivo.split('/').pop();

    const grupo = svg('g', { class: 'caja' });
    grupo.append(
      svg('rect', { x: caja.x, y: caja.y, width: ANCHO, height: ALTO, rx: 7 }),
      svg('text', { x: caja.x + 10, y: caja.y + 21, class: 'titulo' }, caja.titulo),
    );
    const archivo = svg('text', { x: caja.x + 10, y: caja.y + 40, class: 'archivo' }, `${nombre}:${linea ?? '?'}`);
    archivo.append(svg('title', {}, `${caja.archivo}:${linea ?? '?'}`));
    const vivo = svg('text', { x: caja.x + 10, y: caja.y + 60, class: 'vivo' }, '—');
    grupo.append(archivo, vivo);
    lienzo.append(grupo);
    cajas[caja.id] = { grupo, vivo };
  }

  panel.append(lienzo);
  document.body.append(panel);

  function mostrar(visible) {
    lienzo.hidden = !visible;
    panel.classList.toggle('plegado', !visible);
    boton.textContent = visible ? 'Ocultar' : 'Diagrama del código';
    boton.setAttribute('aria-expanded', String(visible));
  }
  boton.addEventListener('click', () => mostrar(lienzo.hidden));
  window.addEventListener('keydown', (evento) => {
    if (evento.code === 'KeyH' && !evento.ctrlKey && !evento.metaKey && !evento.altKey) mostrar(lienzo.hidden);
  });
  mostrar(window.innerWidth >= 900);

  // Se llama desde el bucle; el DOM se actualiza 10 veces por segundo como mucho.
  let acumulado = 0;
  function update(delta, info) {
    acumulado += delta;
    if (acumulado < 0.1 || lienzo.hidden) return;
    acumulado = 0;

    const { teclas, manejo, inclinacion, telemetria } = info;
    const moviendo = Math.abs(manejo.velocidad) > 0.01 || manejo.giro !== 0;
    const recienEnviado = performance.now() - telemetria.enviadoEn < 350;
    const activo = {
      teclado: teclas.length > 0,
      bucle: true,
      terreno: moviendo,
      manejo: moviendo,
      ruedas: moviendo,
      camara: moviendo,
      telemetria: recienEnviado,
      openmct: telemetria.openmctConectado && recienEnviado,
    };
    const rumbo = ((((manejo.rumbo * 180) / Math.PI) % 360) + 360) % 360;
    const textos = {
      teclado: teclas.length ? teclas.join(' + ') : 'sin teclas',
      bucle: `Δ ${(info.deltaMs).toFixed(0)} ms por cuadro`,
      terreno: `suelo a ${manejo.altura.toFixed(2)} m`,
      manejo: `${manejo.velocidad.toFixed(2)} m/s · rumbo ${rumbo.toFixed(0)}°`,
      ruedas: `inclinación ${inclinacion.toFixed(1)}°`,
      camara: moviendo ? 'siguiendo al rover' : 'en espera',
      telemetria: telemetria.ultimo ? `batería ${telemetria.ultimo.bateria.toFixed(1)} %` : '—',
      openmct: telemetria.openmctConectado ? 'conectado' : 'abre /mision/',
    };

    for (const [id, { grupo, vivo }] of Object.entries(cajas)) {
      grupo.classList.toggle('activa', activo[id]);
      vivo.textContent = textos[id];
    }
    for (const { grupo, linea, desde, hasta } of flechas) {
      const encendida = activo[desde] && activo[hasta];
      grupo.classList.toggle('activa', encendida);
      linea.setAttribute('marker-end', encendida ? 'url(#punta-activa)' : 'url(#punta)');
    }
  }

  return { update };
}
