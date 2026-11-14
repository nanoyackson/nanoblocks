// La escena fija para comparar la calidad gráfica (v12.0.0, PLAN_GRAFICOS «Qué probar primero»): semilla 2026, un lago con una isla
// y el sol bajo a un lado, time = 0.48 (el atardecer de verdad). Desde la consola del navegador (en el menú principal):
//   const A = await import('/tools/atardecer.js'); await A.preparar(); await A.medir('medio');
// medir() pone el nivel, deja que compile y mide la mediana de 60 cuadros con gl.finish() (incluye la GPU).
// Al final: await A.limpiar() (vuelve al menú y borra el mundo de prueba).
import { mundoDePrueba, borrarPruebas } from './bot-pelea.js';

const espera = (ms) => new Promise((r) => { setTimeout(r, ms); });
// v12.1.1: el atardecer de verdad es time 0.48 (el sol a 7° sobre el horizonte; con 0.46 todavía estaba a 14°)
const CAM = { x: -79.5, y: 74, z: -155.5, yaw: Math.PI / 2 - 0.35, pitch: -0.08, time: 0.48 };
export const HORAS = { atardecer: 0.48, mediodia: 0.25, noche: 0.75 };
let estilo = null, calidadAntes = null;

function fijar(g) {
  const B = g.player.body.pos;
  B.x = CAM.x; B.y = CAM.y; B.z = CAM.z;
  g.player.yaw = CAM.yaw; g.player.pitch = CAM.pitch; g.time = CAM.time;
}

export async function preparar() {
  for (let i = 0; i < 40 && !document.getElementById('new-form'); i++) await espera(250);
  const f = document.getElementById('new-form');
  f.elements.seed.value = '2026'; f.elements.dificultad.value = 'tranquilo';
  const g = await mundoDePrueba();
  calidadAntes = g.settings.calidad; // se devuelve al limpiar (los ajustes son los mismos de quien juega)
  g.mode = 'creative'; g.player.flying = true;
  for (let k = 0; k < 60; k++) { for (let i = 0; i < 4; i++) { fijar(g); g.update(1 / 30); } await espera(80); }
  g.hudHidden = true; g.ui.setHudHidden(true);
  estilo = document.createElement('style');
  estilo.textContent = '#click-hint,#banner,#logro-card,.achv,#toast{display:none!important}';
  document.head.append(estilo);
  return g;
}

export async function medir(nivel, time = 0.48, alto = 74) {
  const g = window.nanoblocks.game;
  CAM.time = time; CAM.y = alto;
  g.settings.calidad = nivel;
  for (let i = 0; i < 20; i++) { fijar(g); g.update(1 / 60); }
  const gl = g.renderer.getContext();
  gl.finish();
  const ts = [];
  for (let i = 0; i < 60; i++) { const t = performance.now(); fijar(g); g.update(1 / 60); gl.finish(); ts.push(performance.now() - t); }
  ts.sort((a, b) => a - b);
  const ms = ts[30];
  await espera(100);
  return { nivel, ms: +ms.toFixed(2), fps: Math.round(1000 / ms), llamadas: g.renderer.info.render.calls, triangulos: g.renderer.info.render.triangles };
}

export async function limpiar() {
  if (estilo) estilo.remove();
  const { game: g, ui } = window.nanoblocks;
  if (calidadAntes) g.settings.calidad = calidadAntes;
  if (ui.guardarAjustes) ui.guardarAjustes();
  await ui.quitToMenu();
  return borrarPruebas();
}

// v12.0.1: el horizonte lejano en un nivel de calidad y una distancia: espera a que no falte ninguna baldosa y cuenta
// baldosas (por lado), triángulos y memoria de la geometría
export async function horizonte(calidad, D) {
  const g = window.nanoblocks.game, F = g.far;
  g.settings.calidad = calidad; g.settings.farDistance = D; F.setDistance(D);
  const t0 = performance.now();
  for (let k = 0; k < 600; k++) {
    for (let i = 0; i < 4; i++) { fijar(g); g.update(1 / 30); }
    await espera(20);
    const listo = F.inFlight === 0 && F.pending.size === 0 && F.want && [...F.want.keys()].every((q) => F.tiles.has(q)) && [...F.tiles.values()].every((t) => t.fade >= 1) && F.tiles.size === F.want.size;
    if (k > 10 && listo) break;
  }
  let tri = 0, bytes = 0;
  const lados = {};
  for (const t of F.tiles.values()) {
    const ge = t.mesh.geometry;
    tri += ge.index.count / 3;
    bytes += ge.attributes.position.array.byteLength + ge.attributes.color.array.byteLength + ge.index.array.byteLength;
    lados[t.lado] = (lados[t.lado] || 0) + 1;
  }
  return { calidad, D, baldosas: F.tiles.size, triangulos: tri, MB: +(bytes / 1048576).toFixed(1), lados, segundos: +((performance.now() - t0) / 1000).toFixed(1) };
}
