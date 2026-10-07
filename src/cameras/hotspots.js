import * as THREE from 'three';
import './hotspots.css';

const SEPARACION = 30; // px mínimos entre dos puntos

// Puntos que brillan sobre las cámaras del modelo 3D. Son botones HTML que
// se colocan cada cuadro proyectando la posición 3D de la pieza a la pantalla.
export function createHotspots(rover, camaras, onClick) {
  const capa = document.createElement('div');
  capa.id = 'camaras';
  document.body.append(capa);

  const puntos = camaras.map((camara) => {
    const pieza = rover.getObjectByName(camara.pieza);
    if (!pieza) throw new Error(`El modelo no tiene la pieza ${camara.pieza}`);

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'camara-punto';
    boton.dataset.camara = camara.id;
    boton.setAttribute('aria-label', `${camara.nombre}: tomar una foto`);
    boton.innerHTML = `<span class="camara-nombre"><strong>${camara.nombre}</strong><small>${camara.detalle}</small></span>`;
    boton.addEventListener('click', () => onClick(camara));
    capa.append(boton);

    return { boton, pieza, normalLocal: new THREE.Vector3(...camara.normal).normalize() };
  });

  const posicion = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const haciaCamara = new THREE.Vector3();
  const cuaternion = new THREE.Quaternion();

  function update(camera) {
    const ancho = window.innerWidth;
    const alto = window.innerHeight;
    const visibles = [];
    for (const punto of puntos) {
      const { boton, pieza, normalLocal } = punto;
      pieza.getWorldPosition(posicion);
      // Solo se ve si la cámara del rover mira hacia nosotros.
      normal.copy(normalLocal).applyQuaternion(rover.getWorldQuaternion(cuaternion));
      haciaCamara.subVectors(camera.position, posicion).normalize();
      const deFrente = normal.dot(haciaCamara) > -0.15;

      posicion.project(camera);
      const enPantalla = posicion.z < 1 && Math.abs(posicion.x) < 1.05 && Math.abs(posicion.y) < 1.05;
      boton.hidden = !(deFrente && enPantalla);
      if (!boton.hidden) {
        punto.x = ((posicion.x + 1) / 2) * ancho;
        punto.y = ((1 - posicion.y) / 2) * alto;
        visibles.push(punto);
      }
    }

    // Mastcam-Z y NavCams están a 15 cm en la cabeza del mástil: de lejos se
    // taparían. Se separan en pantalla hasta una distancia mínima.
    for (let i = 0; i < visibles.length; i++) {
      for (let j = i + 1; j < visibles.length; j++) {
        const a = visibles[i];
        const b = visibles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distancia = Math.hypot(dx, dy);
        if (distancia >= SEPARACION) continue;
        // Si están casi encima, separar en vertical (la NavCam queda arriba).
        const [ux, uy] = distancia > 1 ? [dx / distancia, dy / distancia] : [0, -1];
        const empuje = (SEPARACION - distancia) / 2;
        a.x -= ux * empuje;
        a.y -= uy * empuje;
        b.x += ux * empuje;
        b.y += uy * empuje;
      }
    }
    for (const { boton, x, y } of visibles) boton.style.transform = `translate(${x}px, ${y}px)`;
  }

  function mostrar(visible) {
    capa.hidden = !visible;
  }

  return { update, mostrar };
}
