// v12.8.2 (PLAN_GRAFICOS_2.md §5.5, decidido por la orquestadora): halos baratos para Medio, sin render target. Un solo
// THREE.Points aditivo con una textura radial suave sobre las antorchas, lámparas y lava cercanas (hasta 64, a ≤ 28 bloques), que
// titilan como la luz de la antorcha del shader. En Alto y Ultra no hace falta: ahí está el bloom (postfx.js).
// De dónde salen las luces: world.js meshChunk anota en cada chunk sus bloques que brillan (c.luces) cuando lo remalla.
import * as THREE from 'three';
import { BLOCKS } from './blocks.js';
import { CHUNK } from './worldgen.js';

const MAX = 64, RADIO = 28;
let puntos = null, pos = null, col = null, lista = [], t0 = 0;

function textura() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace;
  return t;
}
function armar(scene) {
  const geo = new THREE.BufferGeometry();
  pos = new Float32Array(MAX * 3); col = new Float32Array(MAX * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setDrawRange(0, 0);
  const mat = new THREE.PointsMaterial({ size: 2.8, sizeAttenuation: true, map: textura(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  puntos = new THREE.Points(geo, mat);
  puntos.frustumCulled = false; puntos.renderOrder = 12;
  scene.add(puntos);
}
// el color de cada luz (la lava más roja y grande)
// v12.8.6: las luces nuevas de LUCES con su color (morado el portal, celeste el del cielo y la jarra, dorado el corazón)
const COLORES = { portal: [0.7, 0.35, 1], portal_cielo: [0.55, 0.8, 1], morpho_jar: [0.35, 0.75, 1], corazon_tiquicia: [1, 0.85, 0.4], hongo_fuego: [1, 0.45, 0.15] };
const COLOR = (b) => COLORES[b.key] || (b.key === 'lava' || b.render === 'lava' ? [1, 0.36, 0.1] : b.render === 'torch' ? [1, 0.6, 0.25] : [1, 0.78, 0.45]);

// lo llama world.js al remallar un chunk que tiene bloques que brillan
export function anotarLuces(c) {
  const L = [];
  if (c.glowCount > 0) {
    const b = c.blocks;
    for (let i = b.length - 1; i >= 0 && L.length < 1024; i--) if (b[i] && BLOCKS[b[i]].luz) L.push(i); // v12.8.4: solo las luces de verdad (no el coral ni el cuarzo) // de arriba para abajo: lo de la superficie primero (abajo puede haber cientos de lava)
  }
  c.luces = L;
}

// cada cuadro (game.js render): activo = la bandera «halos» (Medio)
export function cuadroHalos(g, dt, activo) {
  if (!activo || !g.world || g.dim === 'cielo') { if (puntos) puntos.visible = false; return; }
  if (!puntos) armar(g.scene);
  if (puntos.parent !== g.scene) g.scene.add(puntos);
  puntos.visible = true;
  const p = g.player.body.pos;
  t0 -= dt;
  if (t0 <= 0) { // la lista de luces cercanas, dos veces por segundo
    t0 = 0.5; lista = [];
    const pcx = Math.floor(p.x / CHUNK), pcz = Math.floor(p.z / CHUNK);
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      const c = g.world.getChunk(pcx + dx, pcz + dz);
      if (!c || !c.luces) continue;
      for (const i of c.luces) {
        const x = c.cx * CHUNK + (i % CHUNK), z = c.cz * CHUNK + (Math.floor(i / CHUNK) % CHUNK), y = Math.floor(i / (CHUNK * CHUNK));
        const d = Math.hypot(x - p.x, y - p.y, z - p.z);
        const B = BLOCKS[c.blocks[i]];
        if (d < RADIO) lista.push({ x: x + 0.5, y: y + 0.6, z: z + 0.5, d, c: COLOR(B), cubo: B.render !== 'torch' });
      }
    }
    lista.sort((a, b) => a.d - b.d); lista.length = Math.min(lista.length, MAX);
  }
  // de día casi no se ven; de noche y bajo techo, sí
  const fuerza = 0.35 + 0.9 * (1 - Math.min(1, g.daylight || 0)), t = g.clock || 0;
  for (let k = 0; k < lista.length; k++) {
    const L = lista[k], fl = (0.93 + 0.07 * Math.sin(t * 9 + L.x * 1.7 + L.z * 2.3) * Math.sin(t * 5.3 + L.y)) * fuerza * (1 - L.d / RADIO * 0.5);
    // la lámpara y la lava son cubos: el halo va un poco hacia la cámara, si no el propio bloque lo tapa
    let ox = 0, oy = 0, oz = 0;
    if (L.cubo) { const cp = g.camera.position, dx = cp.x - L.x, dy = cp.y - L.y, dz = cp.z - L.z, n = Math.hypot(dx, dy, dz) || 1; ox = dx / n * 0.75; oy = dy / n * 0.75; oz = dz / n * 0.75; }
    pos[k * 3] = L.x + ox; pos[k * 3 + 1] = L.y + oy; pos[k * 3 + 2] = L.z + oz;
    col[k * 3] = L.c[0] * fl; col[k * 3 + 1] = L.c[1] * fl; col[k * 3 + 2] = L.c[2] * fl;
  }
  puntos.geometry.setDrawRange(0, lista.length);
  puntos.geometry.attributes.position.needsUpdate = true; puntos.geometry.attributes.color.needsUpdate = true;
}
