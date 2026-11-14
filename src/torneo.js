// Torneo de pesca: el pescador del pueblo inscribe (3 colones) y durante 3 minutos cada pescado que uno saque se pesa
// y suma. Tres rivales del pueblo van sumando también (se ve la tabla en pantalla). Al final, premios: el primer lugar
// se lleva 30 colones y el trofeo, el segundo 12 y el tercero 5.
import { decir } from './misiones.js';
import { esCana } from './blocks.js';

export const TROFEO_PESCA = 485;
const COLON = 360, DURA = 180;
const PESOS = { 361: [1.5, 6, 'Pargo'], 362: [1, 5, 'Corvina'], 363: [0.5, 3, 'Guapote'], 364: [4, 15, 'Dorado'],
  1105: [0.3, 1.5, 'Machaca'], 1106: [0.4, 2, 'Tilapia'], 1107: [2, 9, 'Róbalo'], 1108: [0.4, 2.5, 'Trucha'], 1109: [5, 25, 'Sábalo'], 1110: [3, 12, 'Pez gallo'], 1111: [8, 40, 'Atún'], 1112: [1, 4, 'Pargo mancha'] }; // v12.7.0
const RIVALES = ['Don Chepe «el Anzuelo»', 'Doña Mireya', 'Mae Brayan'];

export function torneoInteract(m, g) {
  // con la caña en la mano se habla del torneo; si no, el pescador vende como siempre
  const held = g.inventory.held;
  if (m.data.role !== 'pescador' || g.mode !== 'survival' || !held || !esCana(held.id)) return false;
  const T = g.torneo;
  if (T) { decir(g, m, `¡Siga pescando! Le quedan ${Math.ceil(T.fin - (g.clock || 0))} segundos.`, 3); return true; }
  if (g.inventory.count(COLON) < 3) { decir(g, m, 'La inscripción al torneo de pesca vale 3 colones. ¡El premio es un trofeo y 30 colones!', 4); return true; }
  g.inventory.remove(COLON, 3);
  g.torneo = { fin: (g.clock || 0) + DURA, total: 0, mejor: 0, n: 0, rivales: RIVALES.map((nombre) => ({ nombre, total: 0, ritmo: 0.015 + Math.random() * 0.012 })) };
  decir(g, m, '¡Inscrito! Tiene 3 minutos: gana el que saque más kilos. ¡Suerte, que Don Chepe es bravo!', 4.5);
  g.audio.play('silbato', { ui: true, vol: 0.6 });
  g.achieve('torneo_pesca', 'Torneo de pesca');
  return true;
}

// la llama el juego cuando uno saca algo con la caña
export function pescaEnTorneo(g, id) {
  const T = g.torneo;
  if (!T) return;
  const P = PESOS[id];
  if (!P) { g.ui.toast('🎣 Eso no cuenta para el torneo 😅', 1400); return; }
  const kg = Math.round((P[0] + Math.random() * Math.random() * (P[1] - P[0])) * 10) / 10;
  T.total = Math.round((T.total + kg) * 10) / 10; T.n++;
  const record = kg > T.mejor;
  T.mejor = Math.max(T.mejor, kg);
  g.ui.toast(`🎣 ${P[2]} de ${kg.toFixed(1)} kg${record && T.n > 1 ? ' · ¡el más grande hasta ahora!' : ''} · Total: ${T.total.toFixed(1)} kg`, 2200);
  if (kg >= 12) g.achieve('pesca_monstruo', '¡Qué animalón!');
  pintar(g);
}

function pintar(g) {
  const T = g.torneo;
  let el = document.getElementById('torneo');
  if (!T) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'torneo'; document.getElementById('hud').appendChild(el); }
  const tabla = [{ nombre: 'Usted', total: T.total, yo: true }, ...T.rivales].sort((a, b) => b.total - a.total);
  const seg = Math.max(0, Math.ceil(T.fin - (g.clock || 0)));
  el.innerHTML = `<b>🎣 Torneo de pesca · ${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}</b>${tabla.map((r, i) => `<div class="${r.yo ? 'yo' : ''}">${i + 1}. ${r.nombre} <span>${r.total.toFixed(1)} kg</span></div>`).join('')}`;
}

export function tickTorneo(g, dt) {
  const T = g.torneo;
  if (!T) return;
  // los rivales sacan algo de vez en cuando
  for (const r of T.rivales) if (Math.random() < r.ritmo * dt * 4) r.total = Math.round((r.total + 1 + Math.random() * 4) * 10) / 10;
  T.pintaT = (T.pintaT || 0) - dt;
  if (T.pintaT <= 0) { T.pintaT = 0.5; pintar(g); }
  if ((g.clock || 0) < T.fin) return;
  // ¡terminó!
  const tabla = [{ nombre: 'Usted', total: T.total, yo: true }, ...T.rivales].sort((a, b) => b.total - a.total);
  const lugar = tabla.findIndex((r) => r.yo) + 1;
  const premio = [30, 12, 5][lugar - 1] || 0;
  if (premio) g.giveItem(COLON, premio);
  if (lugar === 1) { g.giveItem(TROFEO_PESCA, 1); g.achieve('torneo_ganado', 'Gané el torneo de pesca'); g.audio.play('aplausos', { ui: true, vol: 0.6 }); }
  g.ui.toast(lugar === 1 ? `🏆 ¡Ganó el torneo de pesca con ${T.total.toFixed(1)} kg! Trofeo y 30 colones` : `🎣 Terminó el torneo: quedó de ${lugar}.º con ${T.total.toFixed(1)} kg${premio ? ` (premio: ${premio} colones)` : ''}. Ganó ${tabla[0].nombre}`, 5000);
  g.torneo = null;
  pintar(g);
}
export function limpiarTorneo(g) { g.torneo = null; pintar(g); }
