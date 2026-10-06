# CLAUDE.md

Guía para Claude Code en este repositorio. Responde siempre en español.

## Proyecto

Simulación 3D en el navegador del rover **Perseverance** de la NASA explorando Marte (cráter Jezero). Es un proyecto de aprendizaje para un curso: prioriza código claro y comentado sobre optimizaciones prematuras.

## Stack

- **Three.js**: render 3D (escena, cámara, luces, modelos).
- **Vite**: servidor de desarrollo y build.
- **JavaScript (ES modules)**: sin frameworks de UI salvo que se pida.
- Opcional: **cannon-es** o **Rapier** para física, **lil-gui** para paneles de depuración.

## Comandos

```bash
npm install        # instalar dependencias
npm run dev        # servidor de desarrollo (http://localhost:5173)
npm run build      # build de producción en dist/
npm run preview    # previsualizar el build
```

## Estructura sugerida

```
index.html
src/
  main.js          # punto de entrada: renderer, loop de animación
  scene/           # terreno, cielo, iluminación
  rover/           # modelo, ruedas, brazo, mástil, controles
  physics/         # gravedad, colisiones, suspensión
  ui/              # HUD, telemetría, paneles de depuración
public/
  models/          # modelos .glb
  textures/        # texturas y mapas de altura
```

## Convenciones

- Unidades del mundo: **1 unidad = 1 metro**. Eje **Y hacia arriba**.
- Ángulos en radianes en el código; grados solo en la UI.
- Separa la lógica (estado del rover) del render (meshes de Three.js).
- Usa `requestAnimationFrame` con `delta` de tiempo (`THREE.Clock`), nunca velocidades por frame.
- Libera geometrías, materiales y texturas con `.dispose()` al eliminar objetos.

## Datos del rover Perseverance (para escalar la simulación)

| Dato | Valor |
|---|---|
| Largo × ancho × alto | ~3,0 m × 2,7 m × 2,2 m |
| Masa | ~1.025 kg |
| Ruedas | 6, de aluminio, ~52,5 cm de diámetro |
| Suspensión | rocker-bogie (balancín-boggie), sin resortes |
| Dirección | las 4 ruedas de las esquinas giran; puede rotar sobre sí mismo |
| Velocidad máxima | ~4,2 cm/s (~0,152 km/h) |
| Brazo robótico | ~2,1 m, 5 articulaciones, torreta con instrumentos al final |
| Mástil | cámaras Mastcam-Z y SuperCam en la parte superior |
| Energía | generador de radioisótopos (MMRTG), en la parte trasera |
| Acompañante | helicóptero Ingenuity |
| Aterrizaje | 18 de febrero de 2021, cráter Jezero |

## Datos de Marte

| Dato | Valor |
|---|---|
| Gravedad | 3,721 m/s² (≈ 38 % de la Tierra) |
| Duración del día (sol) | 24 h 39 min 35 s |
| Atmósfera | ~1 % de la presión terrestre, sobre todo CO₂ |
| Color del cielo | ocre/caramelo de día; atardeceres azulados |
| Terreno | suelo rojizo, rocas, dunas, cráteres |

## Ideas de funcionalidades (en orden)

1. Escena básica: terreno plano, cielo marciano, luz direccional como el Sol.
2. Rover con primitivas (cajas y cilindros) a escala real.
3. Controles con teclado (WASD) y cámara que sigue al rover (OrbitControls o cámara en tercera persona).
4. Terreno con mapa de altura y rocas distribuidas.
5. Ruedas que giran según la velocidad y suspensión rocker-bogie que se adapta al terreno.
6. Brazo robótico y mástil articulados.
7. HUD con telemetría: posición, velocidad, inclinación, sol actual.
8. Ciclo día/noche usando la duración de un sol.
9. Helicóptero Ingenuity que despega desde el rover.

## Recursos

- Modelo 3D oficial de la NASA: https://science.nasa.gov/resource/mars-2020-perseverance-rover-3d-model/
- Repositorio de modelos de la NASA: https://github.com/nasa/NASA-3D-Resources
- Documentación de Three.js: https://threejs.org/docs/
- Mapas de altura de Marte (HiRISE): https://www.uahirise.org/dtm/
