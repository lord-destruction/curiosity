// Distancia Tierra–Marte y retardo de la luz (o de una señal de radio) para
// una fecha dada. Usa los elementos orbitales keplerianos aproximados del JPL,
// «Approximate Positions of the Planets», tabla 1 (válida 1800–2050):
// https://ssd.jpl.nasa.gov/planets/approx_pos.html
// Error típico: unos minutos de arco, de sobra para un retardo en minutos.

const UA_KM = 149597870.7; // unidad astronómica
const LUZ_KM_S = 299792.458; // velocidad de la luz
const GRADOS = Math.PI / 180;

// [valor en J2000, cambio por siglo] para a (UA), e, I, L, ϖ, Ω (grados)
const ELEMENTOS = {
  tierra: {
    a: [1.00000261, 0.00000562],
    e: [0.01671123, -0.00004392],
    I: [-0.00001531, -0.01294668],
    L: [100.46457166, 35999.37244981],
    perihelio: [102.93768193, 0.32327364],
    nodo: [0, 0],
  },
  marte: {
    a: [1.52371034, 0.00001847],
    e: [0.0933941, 0.00007882],
    I: [1.84969142, -0.00813131],
    L: [-4.55343205, 19140.30268499],
    perihelio: [-23.94362959, 0.44441088],
    nodo: [49.55953891, -0.29257343],
  },
};

// Posición heliocéntrica (x, y, z en UA, plano de la eclíptica J2000).
function posicion(planeta, T) {
  const el = Object.fromEntries(
    Object.entries(ELEMENTOS[planeta]).map(([k, [v0, dv]]) => [k, v0 + dv * T]),
  );
  const omega = (el.perihelio - el.nodo) * GRADOS; // argumento del perihelio
  const nodo = el.nodo * GRADOS;
  const I = el.I * GRADOS;

  // Anomalía media en [-180°, 180°] y ecuación de Kepler por Newton.
  let M = (el.L - el.perihelio) % 360;
  if (M > 180) M -= 360;
  if (M < -180) M += 360;
  M *= GRADOS;
  let E = M + el.e * Math.sin(M);
  for (let i = 0; i < 6; i++) E -= (E - el.e * Math.sin(E) - M) / (1 - el.e * Math.cos(E));

  // Posición en el plano de la órbita y rotación a la eclíptica.
  const xo = el.a * (Math.cos(E) - el.e);
  const yo = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E);
  const [cw, sw, cn, sn, ci, si] = [Math.cos(omega), Math.sin(omega), Math.cos(nodo), Math.sin(nodo), Math.cos(I), Math.sin(I)];
  return {
    x: (cw * cn - sw * sn * ci) * xo + (-sw * cn - cw * sn * ci) * yo,
    y: (cw * sn + sw * cn * ci) * xo + (-sw * sn + cw * cn * ci) * yo,
    z: sw * si * xo + cw * si * yo,
  };
}

// fecha: milisegundos Unix (Date.now()).
export function tierraMarte(fecha) {
  const diaJuliano = fecha / 86400000 + 2440587.5;
  const T = (diaJuliano - 2451545.0) / 36525; // siglos desde J2000
  const t = posicion('tierra', T);
  const m = posicion('marte', T);
  const ua = Math.hypot(m.x - t.x, m.y - t.y, m.z - t.z);
  const km = ua * UA_KM;
  return {
    distanciaMillonesKm: km / 1e6,
    retardoMinutos: km / LUZ_KM_S / 60,
  };
}
