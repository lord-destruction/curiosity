// Generador pseudoaleatorio con semilla (mulberry32): la misma semilla produce
// siempre la misma escena, así las rocas no cambian de lugar al recargar.
export function createRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomRange(random, min, max) {
  return min + random() * (max - min);
}
