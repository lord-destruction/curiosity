// Fotos reales de Perseverance, elegidas a mano entre las imágenes en bruto
// más recientes de la NASA (sols 1989–2000, septiembre y octubre de 2026):
// https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json&ver=1.2
// Criterio: a color y que se sienta Marte (horizonte, el brazo sobre el suelo,
// rocas de cerca); sin cielo vacío, sol, blancos de calibración ni miniaturas.
// Las imágenes se cargan desde los servidores de la NASA (versión de 1200 px).

const RAIZ = 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol';
const PAGINA = 'https://mars.nasa.gov/mars2020/multimedia/raw-images';

// carpeta: subcarpeta de la cámara en el servidor; version: sufijo del archivo
function foto(id, carpeta, fecha, descripcion, credito, version = '01') {
  const sol = Number(id.split('_')[1]);
  return {
    id,
    sol,
    fecha, // UTC, tomada de la API
    descripcion,
    credito,
    url: `${RAIZ}/${String(sol).padStart(5, '0')}/ids/edr/browse/${carpeta}/${id}${version}_1200.jpg`,
    pagina: `${PAGINA}/${id}`,
  };
}

export const CAMARAS = [
  {
    id: 'mastcamz',
    pieza: 'Mastcam_Z_cams', // nombre de la pieza en el modelo 3D
    nombre: 'Mastcam-Z',
    detalle: 'Cámaras con zoom del mástil',
    normal: [0, 0, 1], // hacia dónde mira la cámara (ejes del rover)
    fotos: [
      foto('ZL0_1989_0843521928_244EBY_N0910970ZCAM05066_0340LMJ', 'zcam', '2026-09-24T12:04:14Z', 'La torreta del brazo, con sus brocas, sobre el suelo de Jezero.', 'NASA/JPL-Caltech/ASU'),
      foto('ZL0_1998_0844315546_598EBY_N0910970ZCAM04483_1100LMJ', 'zcam', '2026-10-03T16:30:49Z', 'Una roca raspada por el brazo para ver su interior.', 'NASA/JPL-Caltech/ASU'),
      foto('ZL0_1989_0843521901_928EBY_N0910970ZCAM05065_0480LMJ', 'zcam', '2026-09-24T12:03:21Z', 'El cabezal del taladro, listo sobre la arena.', 'NASA/JPL-Caltech/ASU'),
      foto('ZR0_1998_0844315359_443EBY_N0910970ZCAM10033_1100LMJ', 'zcam', '2026-10-03T16:27:50Z', 'Campo de rocas frente al rover.', 'NASA/JPL-Caltech/ASU'),
    ],
  },
  {
    id: 'navcam',
    pieza: 'NavCams',
    nombre: 'NavCam',
    detalle: 'Cámaras de navegación del mástil',
    normal: [0, 0.4, 1],
    fotos: [
      foto('NRF_1999_0844415552_724ECM_N0910970NCAM00347_01_195J', 'ncam', '2026-10-04T20:17:32Z', 'El brazo extendido y su sombra sobre el suelo.', 'NASA/JPL-Caltech'),
      foto('NLF_1995_0844060176_410ECM_N0910970NCAM00347_01_195J', 'ncam', '2026-09-30T17:34:33Z', 'La torreta del brazo, de cerca.', 'NASA/JPL-Caltech'),
      foto('NLF_1991_0843698363_130ECM_N0910970NCAM00501_01_295J', 'ncam', '2026-09-26T13:04:16Z', 'El horizonte de Jezero, con colinas y la torreta del brazo.', 'NASA/JPL-Caltech'),
      foto('NLF_1999_0844416019_362ECM_N0910970NCAM00709_02_095J', 'ncam', '2026-10-04T20:25:18Z', 'Huellas de las ruedas sobre el suelo.', 'NASA/JPL-Caltech'),
    ],
  },
  {
    id: 'hazcam',
    pieza: 'hazcams_front',
    nombre: 'Hazcam frontal',
    detalle: 'Cámaras para evitar obstáculos',
    normal: [0, -0.3, 1],
    fotos: [
      foto('FLF_1989_0843521031_929ECM_N0910970FHAZ00203_19_295J', 'fcam', '2026-09-24T11:48:44Z', 'El brazo sobre el suelo, la rueda delantera y el horizonte.', 'NASA/JPL-Caltech', '02'),
      foto('FRF_2000_0844490490_621ECM_N0910970FHAZ00206_01_295J', 'fcam', '2026-10-05T17:06:30Z', 'El brazo trabajando frente al rover.', 'NASA/JPL-Caltech'),
      foto('FRF_1998_0844308610_411ECM_N0910970FHAZ00206_01_295J', 'fcam', '2026-10-03T14:35:09Z', 'El brazo y su sombra, junto a la rueda.', 'NASA/JPL-Caltech'),
      foto('FLF_1992_0843779367_785ECM_N0910970FHAZ00215_04_075J', 'fcam', '2026-09-27T11:34:22Z', 'La torreta casi tocando las rocas.', 'NASA/JPL-Caltech'),
    ],
  },
  {
    id: 'watson',
    pieza: 'WATSON',
    nombre: 'WATSON',
    detalle: 'Cámara de primer plano del brazo',
    normal: [0, -0.2, 1],
    fotos: [
      foto('SIF_1999_0844414514_875EBY_N0910970SRLC02503_0000LMJ', 'shrlc', '2026-10-04T20:00:17Z', 'Una roca porosa sobre el suelo, vista muy de cerca.', 'NASA/JPL-Caltech'),
      foto('SIF_1999_0844414689_011EBY_N0910970SRLC00657_0000LMJ', 'shrlc', '2026-10-04T20:03:26Z', 'El borde de una roca llena de cavidades.', 'NASA/JPL-Caltech'),
      foto('SIF_1999_0844417192_058EBY_N0910970SRLC00351_0000LMJ', 'shrlc', '2026-10-04T20:45:10Z', 'Guijarros y granos del suelo marciano.', 'NASA/JPL-Caltech'),
      foto('SIF_1997_0844226554_328EBY_N0910970SRLC00624_0000LMJ', 'shrlc', '2026-10-02T15:47:46Z', 'La roca raspada, de cerca.', 'NASA/JPL-Caltech'),
    ],
  },
];

// «hoy», «ayer» o «hace N días» respecto de ahora.
export function haceCuanto(fecha, ahora = Date.now()) {
  const dias = Math.floor((ahora - Date.parse(fecha)) / 86400000);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  return `hace ${dias} días`;
}
