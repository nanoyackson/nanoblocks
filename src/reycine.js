// Música y cámara del Rey Zopilote (v12.16.3, fase 5 del diseño de jefes y final). Corre IGUAL en el anfitrión y en quien visita: no mira
// `g.rey` (que solo existe en el anfitrión) sino a la criatura `rey_zopilote`, y la fase sale de su vida (los mismos umbrales de final.js:
// 70 / 40 / 12 %, y de rodillas con ≤ 5,1 %), que es lo que ya viaja en la sincronía de criaturas. Así no hay mensajes de red nuevos.
//  - `g.reyFase` (0 nada, 0.5 preludio, 1..4 fases, 5 golpe final) alimenta a `Music.update` (`s.rey`).
//  - Cinco momentos de cámara, ≤ 5 s cada uno y SIN quitar el control; cualquier tecla o clic los salta. Con «Movimiento tranquilo»
//    no hay sacudidas, inclinaciones ni relámpagos: solo luz y sonido.
//  - La cámara lenta (`g.slowmo`) la pone solo el anfitrión (él simula); a quien visita no se le frena su reloj.
import { calmaActiva } from './calma.js';
import { presentarJefe } from './jefes3.js';

export const CINES = {
  llamada: { dur: 3, barras: true }, // el viento se para, la Corona brilla, sale el título
  tormenta: { dur: 2, barras: false }, // relámpago blanco e inclinación; el control sigue
  caida: { dur: 3, barras: true }, // el Rey se viene abajo; cámara lenta al tocar el suelo
  amanecer: { dur: 4, barras: true }, // la luz sube y suena el cencerro
  golpe: { dur: 1.2, barras: false }, // el giro corto tras el golpe final (la música calla 1 s)
};
const T_PRELUDIO = 6, T_HIMNO = 14;

const faseDe = (m) => {
  const vmax = (m.data && m.data.vmax) || m.kind.health, f = m.health / Math.max(1, vmax);
  return f > 0.7 ? 1 : f > 0.4 ? 2 : f > 0.12 ? 3 : 4;
};
function barras(on) {
  if (typeof document === 'undefined') return;
  const b = document.getElementById('barras-rey');
  if (on && !b) { const e = document.createElement('div'); e.id = 'barras-rey'; e.innerHTML = '<i></i><i></i>'; (document.getElementById('hud') || document.body).appendChild(e); }
  if (!on && b) b.remove();
}
function luz(clase, a) {
  if (typeof document === 'undefined') return;
  let e = document.getElementById('rey-luz');
  if (!e) { if (a <= 0) return; e = document.createElement('div'); e.id = 'rey-luz'; (document.getElementById('hud') || document.body).appendChild(e); }
  if (clase && e.className !== clase) e.className = clase;
  e.style.opacity = String(Math.max(0, Math.min(1, a)));
  if (a <= 0) e.remove();
}
// empieza un momento (si ya había otro, lo reemplaza)
export function empezarCine(g, id) {
  const V = g.reyCine;
  if (!V) return;
  terminarCine(g);
  V.cin = { id, t: 0, dur: CINES[id].dur, hecho: false };
  barras(CINES[id].barras);
}
export function terminarCine(g) {
  const V = g.reyCine;
  if (V) V.cin = null;
  barras(false); luz('', 0);
}
function limpiar(g) {
  if (g.reyCine) terminarCine(g);
  g.reyCine = null; g.reyFase = 0;
}
// cualquier tecla o clic salta el momento en curso (el control nunca se quitó)
let oyente = false;
function oir() {
  if (oyente || typeof window === 'undefined') return;
  oyente = true;
  const salta = () => { const g = window.nanoblocks && window.nanoblocks.game; if (g && g.reyCine && g.reyCine.cin && g.reyCine.cin.t > 0.25) terminarCine(g); };
  window.addEventListener('keydown', (e) => { if (!e.repeat) salta(); }, true);
  window.addEventListener('mousedown', salta, true);
}

export function cuadroReyCine(g, dt) {
  if (!g.entities || !g.player) return;
  oir();
  let m = null;
  for (const x of g.entities.mobs) if (x.type === 'rey_zopilote' && !x.dead) { m = x; break; }
  let V = g.reyCine;
  const calma = calmaActiva(g), host = !(g.meta && g.meta.invitado);
  if (!m && V && !V.fin && V.rodillas && V.muriendo && g.player.alive) { // el Rey cayó estando de rodillas: el golpe final (2 s antes se oyó el último toque)
    V.fin = true; V.finT = 0; empezarCine(g, 'golpe');
    if (!calma && host) g.slowmo = Math.max(g.slowmo || 0, 0.6);
  }
  if (!m && !(V && V.fin)) { if (V) limpiar(g); return; }
  if (m && (!V || V.m !== m)) { // la criatura que se ve ahora: empieza la pelea (o entramos con ella ya empezada)
    if (V) limpiar(g);
    V = g.reyCine = { m, fase: faseDe(m), t: 0, rodillas: false, fin: false, cin: null };
    if (V.fase === 1 && m.health >= ((m.data && m.data.vmax) || m.kind.health) * 0.97) {
      empezarCine(g, 'llamada');
      if (!host) presentarJefe(g, m); // el anfitrión ya lo llamó al usar la Corona
    }
  }
  V.t += dt;
  if (m && !V.fin) {
    const f = faseDe(m);
    if (f > V.fase) {
      V.fase = f;
      if (f === 2) empezarCine(g, 'tormenta');
      if (f === 3) empezarCine(g, 'caida');
      if (f === 4) empezarCine(g, 'amanecer');
    }
    if (m.dying || m.health <= 0) V.muriendo = true; // sin esto, un Rey que se va (o la muerte de quien pelea) no cuenta como golpe final
    if (V.fase === 4 && !V.rodillas && m.health <= ((m.data && m.data.vmax) || m.kind.health) * 0.051) V.rodillas = true;
    g.reyFase = V.t < T_PRELUDIO && V.fase === 1 ? 0.5 : V.fase;
  } else if (V.fin) {
    V.finT += dt;
    g.reyFase = V.finT < T_HIMNO ? 5 : 0;
    if (V.finT > T_HIMNO + 1) { limpiar(g); return; }
  }
  // el momento en curso
  const C = V.cin;
  if (!C) return;
  C.t += dt;
  const k = C.t / C.dur, p = g.player.body.pos;
  if (C.id === 'llamada') {
    if (!calma) g.shake = Math.max(g.shake || 0, 0.8 * (1 - k));
    if (!C.hecho && C.t > 0.2) { C.hecho = true; g.audio.play('trueno', { ui: true, vol: 0.7, pitch: 0.6 }); }
    if (m && g.particles) g.particles.spawn(p.x + (Math.random() - 0.5) * 3, p.y + 0.2, p.z + (Math.random() - 0.5) * 3, [1, 0.85, 0.3], 0, 1.5, 0, 0.9, 0, true); // la Corona brilla
  } else if (C.id === 'tormenta') {
    if (!C.hecho) { C.hecho = true; g.audio.play('trueno', { ui: true, vol: 1, pitch: 0.9 }); if (g.weather && !calma) g.weather.flash = 1; }
    if (!calma) { g.hurtTilt = 0.12 * Math.sin(Math.min(1, k * 2) * Math.PI); luz('blanco', Math.max(0, 0.9 - k * 3)); }
  } else if (C.id === 'caida') {
    if (!calma && k < 0.7) g.shake = Math.max(g.shake || 0, 0.8 * (1 - k));
    if (!C.hecho && k > 0.65) { C.hecho = true; g.audio.play('dig.stone', { ui: true, vol: 1, pitch: 0.3 }); if (host && !calma) g.slowmo = Math.max(g.slowmo || 0, 0.4); }
  } else if (C.id === 'amanecer') {
    if (!C.hecho) { C.hecho = true; g.audio.play('campana', { ui: true, vol: 1, pitch: 0.8 }); }
    luz('alba', Math.sin(Math.min(1, k) * Math.PI) * 0.55); // solo se mueve la luz: sube y baja
  } else if (C.id === 'golpe') {
    if (!calma) g.hurtTilt = 0.15 * Math.sin(k * Math.PI * 2); // el giro corto
  }
  if (C.t >= C.dur) terminarCine(g);
}
