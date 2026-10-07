// Teclas de manejo: WASD o flechas.
const TECLAS = {
  adelante: ['KeyW', 'ArrowUp'],
  atras: ['KeyS', 'ArrowDown'],
  izquierda: ['KeyA', 'ArrowLeft'],
  derecha: ['KeyD', 'ArrowRight'],
};
const DE_MANEJO = new Set(Object.values(TECLAS).flat());

// Guarda qué teclas están pulsadas. Usa `code` (posición física de la tecla),
// así WASD funciona igual con teclado español, inglés o AZERTY.
export function createKeyboard() {
  const pulsadas = new Set();

  window.addEventListener('keydown', (evento) => {
    if (evento.ctrlKey || evento.metaKey || evento.altKey) return;
    if (!DE_MANEJO.has(evento.code)) return;
    pulsadas.add(evento.code);
    evento.preventDefault(); // que las flechas no desplacen la página
  });
  window.addEventListener('keyup', (evento) => pulsadas.delete(evento.code));
  // Si la ventana pierde el foco con una tecla pulsada, nunca llega su keyup.
  window.addEventListener('blur', () => pulsadas.clear());

  const pulsada = (accion) => TECLAS[accion].some((code) => pulsadas.has(code));

  return {
    // 1 adelante, -1 atrás, 0 nada (o las dos a la vez)
    acelerador: () => Number(pulsada('adelante')) - Number(pulsada('atras')),
    // 1 izquierda, -1 derecha
    giro: () => Number(pulsada('izquierda')) - Number(pulsada('derecha')),
    teclas: () => [...pulsadas].map((code) => code.replace('Key', '').replace('Arrow', '')),
    // Suelta todo, por ejemplo al abrir una foto (su keyup ya no llegará aquí).
    soltarTodo: () => pulsadas.clear(),
  };
}
