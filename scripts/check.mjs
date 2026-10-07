// npm run check: prueba la simulación de punta a punta en un Chrome sin
// ventana (WebGL por software) y guarda capturas en capturas/.
//   1. La escena carga con WebGL y sin errores en la consola.
//   2. Cada caja del diagrama encuentra su archivo:línea.
//   3. Con W pulsada, el rover acelera.
//   4. Cada cámara muestra su nombre al pasar el ratón y, al hacer clic,
//      abre una foto real de Marte que se revela; se guarda la captura.
//   5. Flechas, ampliar y Esc funcionan en el visor.
import { createServer } from 'vite';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CAPTURAS = 'capturas';
const PUERTO_DEPURACION = 9400 + Math.floor(Math.random() * 500);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const resultados = [];
function comprobar(nombre, ok, detalle = '') {
  resultados.push({ nombre, ok: Boolean(ok), detalle });
  console.log(`${ok ? '✔' : '✘'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
}

function buscarChrome() {
  const candidatos = [process.env.CHROME_PATH, 'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'].filter(Boolean);
  for (const c of candidatos) {
    if (spawnSync('which', [c]).status === 0 || c.includes('/')) return c;
  }
  throw new Error('No encontré Chrome ni Chromium. Indica la ruta con CHROME_PATH=/ruta/al/chrome');
}

// Cliente mínimo del protocolo de depuración de Chrome (CDP).
async function conectar(urlWs) {
  const ws = new WebSocket(urlWs);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  let id = 0;
  const pendientes = new Map();
  const errores = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pendientes.has(m.id)) {
      pendientes.get(m.id)(m);
      pendientes.delete(m.id);
    } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      errores.push(m.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 300));
    } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'warning') {
      const texto = m.params.args.map((a) => a.value ?? a.description).join(' ');
      if (texto.startsWith('Diagrama:')) errores.push(texto);
    } else if (m.method === 'Runtime.exceptionThrown') {
      errores.push(`Excepción: ${(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 300)}`);
    }
  };
  const enviar = (method, params = {}) =>
    new Promise((resolve) => {
      const i = ++id;
      pendientes.set(i, resolve);
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  const evaluar = async (expression) => {
    const r = await enviar('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description);
    return r.result?.result?.value;
  };
  const esperarA = async (expression, ms = 15000) => {
    const limite = Date.now() + ms;
    while (Date.now() < limite) {
      const valor = await evaluar(expression).catch(() => null);
      if (valor) return valor;
      await esperar(250);
    }
    return null;
  };
  const TECLAS = { KeyW: ['w', 87], KeyH: ['h', 72], ArrowRight: ['ArrowRight', 39], Escape: ['Escape', 27] };
  const tecla = (type, code) =>
    enviar('Input.dispatchKeyEvent', { type, code, key: TECLAS[code][0], windowsVirtualKeyCode: TECLAS[code][1] });
  const pulsar = async (code) => {
    await tecla('keyDown', code);
    await tecla('keyUp', code);
  };
  const raton = async (type, x, y) => enviar('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
  const clic = async (x, y) => {
    await raton('mouseMoved', x, y);
    await raton('mousePressed', x, y);
    await raton('mouseReleased', x, y);
  };
  const captura = async (archivo) => {
    const r = await enviar('Page.captureScreenshot', { format: 'png' });
    writeFileSync(archivo, Buffer.from(r.result.data, 'base64'));
  };
  return { enviar, evaluar, esperarA, tecla, pulsar, raton, clic, captura, errores, cerrar: () => ws.close() };
}

const servidor = await createServer({ logLevel: 'error', server: { host: '127.0.0.1', port: 5190 } });
await servidor.listen();
const urlApp = servidor.resolvedUrls.local[0];
const perfil = mkdtempSync(join(tmpdir(), 'curiosity-check-'));
mkdirSync(CAPTURAS, { recursive: true });

// Sin DISPLAY, Chrome no intenta conectarse a un servidor gráfico.
const env = { ...process.env };
delete env.DISPLAY;
delete env.WAYLAND_DISPLAY;
delete env.XAUTHORITY;
const chrome = spawn(
  buscarChrome(),
  [
    '--headless=new',
    ...(process.getuid?.() === 0 ? ['--no-sandbox'] : []),
    `--remote-debugging-port=${PUERTO_DEPURACION}`,
    `--user-data-dir=${perfil}`,
    '--window-size=1400,900',
    '--enable-unsafe-swiftshader',
    '--use-angle=swiftshader-webgl',
    '--ignore-gpu-blocklist',
    '--disable-vulkan',
    '--autoplay-policy=no-user-gesture-required',
    'about:blank',
  ],
  { stdio: 'ignore', env },
);

let fallo = null;
try {
  let destino;
  for (let i = 0; i < 60 && !destino; i++) {
    try {
      destino = await (await fetch(`http://127.0.0.1:${PUERTO_DEPURACION}/json/new?${urlApp}`, { method: 'PUT' })).json();
    } catch {
      await esperar(250);
    }
  }
  if (!destino) throw new Error('Chrome no arrancó');
  const p = await conectar(destino.webSocketDebuggerUrl);
  await p.enviar('Runtime.enable');
  await p.enviar('Page.enable');

  // 1. Escena
  const cargada = await p.esperarA(`document.querySelector('#diagrama .caja') && document.querySelectorAll('.camara-punto').length`, 30000);
  comprobar('La escena carga', cargada, `${cargada ?? 0} cámaras en el modelo`);
  comprobar('WebGL disponible', await p.evaluar(`!!document.querySelector('#app').getContext('webgl2')`));

  // 2. Diagrama
  const archivos = await p.evaluar(`[...document.querySelectorAll('#diagrama .archivo')].map((t) => t.firstChild.textContent)`);
  const sinLinea = archivos.filter((a) => a.endsWith(':?'));
  comprobar('El diagrama encuentra todas sus líneas', archivos.length === 8 && sinLinea.length === 0, sinLinea.join(', ') || archivos.join(' '));

  // 3. Manejo
  await p.tecla('keyDown', 'KeyW');
  await esperar(2500);
  const manejo = await p.evaluar(`[...document.querySelectorAll('#diagrama .vivo')][3].textContent`);
  await p.tecla('keyUp', 'KeyW');
  comprobar('Con W el rover acelera', parseFloat(manejo) > 0.1, manejo);
  await esperar(1500);
  await p.pulsar('KeyH'); // ocultar el diagrama para que no tape nada
  comprobar('H oculta el diagrama', await p.esperarA(`document.querySelector('#diagrama svg').getBoundingClientRect().height === 0`, 2000));
  await esperar(500);
  await p.captura(join(CAPTURAS, 'escena-camaras.png'));

  // 4. Cámaras
  const camaras = await p.evaluar(`[...document.querySelectorAll('.camara-punto')].map((b) => b.dataset.camara)`);
  for (const id of camaras) {
    const sel = `.camara-punto[data-camara="${id}"]`;
    const centro = await p.esperarA(`(() => {
      const b = document.querySelector('${sel}');
      if (!b || b.hidden) return null;
      const r = b.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      return document.elementFromPoint(x, y)?.closest('${sel}') ? { x, y } : null;
    })()`, 5000);
    if (!centro) {
      comprobar(`${id}: el punto se ve y se puede pulsar`, false);
      continue;
    }

    await p.raton('mouseMoved', centro.x, centro.y);
    const nombre = await p.esperarA(`(() => {
      const n = document.querySelector('${sel} .camara-nombre');
      return getComputedStyle(n).opacity === '1' && n.querySelector('strong').textContent;
    })()`, 2000);
    comprobar(`${id}: muestra su nombre al pasar el ratón`, nombre, nombre || '');

    await p.clic(centro.x, centro.y);
    const foto = await p.esperarA(`(() => {
      const f = document.querySelector('#visor .foto');
      const img = f.querySelector('img');
      const texto = f.querySelector('.titulo').textContent;
      return texto.startsWith(${JSON.stringify(nombre || '')}) && f.classList.contains('revelada') &&
        img.naturalWidth > 0 && { ancho: img.naturalWidth, url: img.currentSrc, texto };
    })()`, 25000);
    const realDeMarte = foto && foto.url.startsWith('https://mars.nasa.gov/mars2020-raw-images/');
    const pie = foto && foto.texto.includes(nombre) && /sol \d+/.test(foto.texto) && /hace \d+ días|hoy|ayer/.test(foto.texto);
    comprobar(`${id}: abre una foto real que se revela`, realDeMarte, foto ? `${foto.ancho} px · ${foto.url.split('/').pop()}` : 'no cargó');
    comprobar(`${id}: la foto dice cámara, sol y hace cuántos días`, pie, foto?.texto ?? '');
    comprobar(`${id}: no queda el aviso de carga encima`, await p.evaluar(`document.querySelector('#visor .cargando').getBoundingClientRect().height === 0`));
    await p.captura(join(CAPTURAS, `camara-${id}.png`));

    if (id === camaras[0]) {
      // 5. Visor: flecha → otra foto; clic → ampliada; Esc → al juego
      const antes = await p.evaluar(`document.querySelector('#visor .foto').dataset.foto`);
      await p.pulsar('ArrowRight');
      const otra = await p.esperarA(`(() => {
        const f = document.querySelector('#visor .foto');
        return f.dataset.foto !== '${antes}' && f.dataset.cargada === 'true' && f.querySelector('.contador').textContent;
      })()`, 20000);
      comprobar('→ muestra otra foto de la misma cámara', otra, otra || '');
      const rect = await p.evaluar(`(() => { const r = document.querySelector('#visor .marco').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
      await p.clic(rect.x, rect.y);
      const ampliada = await p.esperarA(`document.querySelector('#visor').dataset.estado === 'ampliada'`, 3000);
      comprobar('Clic amplía la foto', ampliada);
      await esperar(600);
      await p.captura(join(CAPTURAS, 'foto-ampliada.png'));
    }

    await p.pulsar('Escape');
    const cerrado = await p.esperarA(`document.querySelector('#visor').dataset.estado === 'cerrado'`, 3000);
    comprobar(`${id}: Esc vuelve al juego`, cerrado);
  }

  comprobar('Sin errores en la consola', p.errores.length === 0, p.errores.slice(0, 3).join(' | '));
  p.cerrar();
} catch (error) {
  fallo = error;
  comprobar('La prueba terminó', false, error.message);
} finally {
  const cerrado = new Promise((resolve) => chrome.once('exit', resolve));
  chrome.kill();
  await Promise.race([cerrado, esperar(5000)]);
  await servidor.close();
  rmSync(perfil, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}

const fallidas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - fallidas.length}/${resultados.length} comprobaciones correctas. Capturas en ${CAPTURAS}/`);
process.exit(fallidas.length || fallo ? 1 : 0);
