import './viewer.css';
import { haceCuanto } from './fotos.js';

const QUIETA_MS = 8000; // tiempo grande y quieta antes de pasar a miniatura
const OBTURADOR_MS = 450;

// Sonido de obturador sintetizado: dos chasquidos cortos de ruido filtrado.
let audio;
function sonarObturador() {
  try {
    audio ??= new AudioContext();
    const ahora = audio.currentTime;
    for (const [inicio, duracion, volumen] of [[0, 0.035, 0.5], [0.09, 0.05, 0.35]]) {
      const muestras = Math.floor(audio.sampleRate * duracion);
      const buffer = audio.createBuffer(1, muestras, audio.sampleRate);
      const datos = buffer.getChannelData(0);
      for (let i = 0; i < muestras; i++) datos[i] = (Math.random() * 2 - 1) * (1 - i / muestras) ** 3;
      const fuente = audio.createBufferSource();
      fuente.buffer = buffer;
      const filtro = audio.createBiquadFilter();
      filtro.type = 'bandpass';
      filtro.frequency.value = 2400;
      const ganancia = audio.createGain();
      ganancia.gain.value = volumen;
      fuente.connect(filtro).connect(ganancia).connect(audio.destination);
      fuente.start(ahora + inicio);
    }
  } catch {
    // Sin audio (navegador sin permiso): la foto se muestra igual.
  }
}

// Visor de fotos. Estados:
//   cerrado   → el juego normal
//   grande    → la foto en el centro, quieta y fácil de ver (bloquea el teclado)
//   ampliada  → la foto a pantalla completa (bloquea el teclado)
//   miniatura → tras unos segundos sin tocar nada, la foto pasa a una esquina
//               y el teclado vuelve a manejar el rover
export function createViewer({ alAbrir } = {}) {
  const visor = document.createElement('div');
  visor.id = 'visor';
  visor.dataset.estado = 'cerrado';
  visor.hidden = true;
  visor.innerHTML = `
    <div class="obturador" aria-hidden="true"><div class="hoja arriba"></div><div class="hoja abajo"></div></div>
    <div class="destello" aria-hidden="true"></div>
    <figure class="foto" role="dialog" aria-modal="true" aria-label="Foto de Perseverance">
      <div class="marco">
        <img alt="" draggable="false" />
        <p class="cargando">Recibiendo imagen de Marte…</p>
      </div>
      <figcaption>
        <p class="titulo"><strong class="camara"></strong> · <span class="sol"></span> · <span class="hace"></span><span class="contador"></span></p>
        <p class="descripcion"></p>
        <p class="pie"><span class="credito"></span> · <a class="enlace" target="_blank" rel="noopener">Ver en la NASA ↗</a></p>
      </figcaption>
      <p class="ayuda">Clic para ampliar · ← → más fotos · Esc para volver al juego</p>
    </figure>`;
  document.body.append(visor);

  const figura = visor.querySelector('.foto');
  const img = visor.querySelector('img');
  const cargando = visor.querySelector('.cargando');
  const obturador = visor.querySelector('.obturador');
  const destello = visor.querySelector('.destello');
  const campo = (selector) => visor.querySelector(selector);

  let camara = null;
  let indice = 0;
  let temporizador = 0;
  let carga = 0; // descarta cargas viejas si se cambia de foto rápido

  const AYUDA = {
    grande: 'Clic para ampliar · ← → más fotos · Esc para volver al juego',
    ampliada: 'Clic para reducir · ← → más fotos · Esc para volver al juego',
    miniatura: 'Clic para ampliar · Esc para cerrar',
  };

  function estado(nuevo) {
    visor.dataset.estado = nuevo;
    visor.hidden = nuevo === 'cerrado';
    if (AYUDA[nuevo]) campo('.ayuda').textContent = AYUDA[nuevo];
    clearTimeout(temporizador);
    if (nuevo === 'grande') temporizador = setTimeout(() => estado('miniatura'), QUIETA_MS);
  }
  const modal = () => ['grande', 'ampliada'].includes(visor.dataset.estado);

  function disparar() {
    sonarObturador();
    for (const el of [obturador, destello]) {
      el.classList.remove('activo');
      void el.offsetWidth; // reinicia la animación CSS
      el.classList.add('activo');
    }
  }

  // Limpia el visor en el acto (que no asome la foto anterior) y empieza a
  // descargar; la foto se revela cuando el obturador ya se volvió a abrir.
  function mostrarFoto() {
    const foto = camara.fotos[indice];
    const miCarga = ++carga;
    const obturadorAbierto = performance.now() + OBTURADOR_MS / 2;
    figura.classList.remove('revelada', 'revelando');
    figura.dataset.cargada = 'false';
    figura.dataset.foto = foto.id;
    cargando.hidden = false;
    cargando.textContent = 'Recibiendo imagen de Marte…';
    img.style.visibility = 'hidden';

    campo('.camara').textContent = camara.nombre;
    campo('.sol').textContent = `sol ${foto.sol}`;
    campo('.hace').textContent = haceCuanto(foto.fecha);
    campo('.contador').textContent = camara.fotos.length > 1 ? ` · ${indice + 1} / ${camara.fotos.length}` : '';
    campo('.descripcion').textContent = foto.descripcion;
    campo('.credito').textContent = `Foto: ${foto.credito}`;
    campo('.enlace').href = foto.pagina;
    img.alt = `${camara.nombre}, sol ${foto.sol}: ${foto.descripcion}`;

    img.onload = () => {
      setTimeout(() => {
        if (miCarga !== carga) return;
        cargando.hidden = true;
        img.style.visibility = '';
        figura.classList.add('revelando');
        figura.dataset.cargada = 'true';
      }, Math.max(0, obturadorAbierto - performance.now()));
    };
    img.onerror = () => {
      if (miCarga !== carga) return;
      cargando.textContent = 'No se pudo descargar la foto de la NASA. Prueba con ← →.';
    };
    img.src = foto.url;
  }

  function abrir(nuevaCamara) {
    camara = nuevaCamara;
    indice = 0;
    alAbrir?.();
    estado('grande');
    disparar();
    mostrarFoto();
  }

  function navegar(paso) {
    indice = (indice + paso + camara.fotos.length) % camara.fotos.length;
    disparar();
    mostrarFoto();
    if (visor.dataset.estado === 'grande') estado('grande'); // reinicia la espera
  }

  const cerrar = () => estado('cerrado');

  figura.addEventListener('animationend', (evento) => {
    if (evento.animationName === 'revelar') figura.classList.replace('revelando', 'revelada');
  });

  // Clic en la foto: grande ↔ ampliada; desde la miniatura, ampliar.
  figura.addEventListener('click', (evento) => {
    if (evento.target.closest('a')) return;
    estado(visor.dataset.estado === 'ampliada' ? 'grande' : 'ampliada');
  });
  // Clic fuera de la foto: volver al juego.
  visor.addEventListener('click', (evento) => {
    if (modal() && !figura.contains(evento.target)) cerrar();
  });

  // En fase de captura, antes que el manejo: con la foto abierta, las
  // flechas cambian de foto en vez de mover el rover.
  window.addEventListener(
    'keydown',
    (evento) => {
      const actual = visor.dataset.estado;
      if (actual === 'cerrado') return;
      if (evento.key === 'Escape') {
        cerrar();
      } else if (modal() && (evento.key === 'ArrowRight' || evento.key === 'ArrowLeft')) {
        navegar(evento.key === 'ArrowRight' ? 1 : -1);
      } else if (!modal() || evento.key === 'Tab') {
        return; // en miniatura el teclado sigue manejando
      }
      evento.preventDefault();
      evento.stopImmediatePropagation();
    },
    { capture: true },
  );

  return { abrir, cerrar, estado: () => visor.dataset.estado };
}
