// Maestría por arma (v7.4): cada clase de arma (espada, machete, hacha, mazo, garrote, lanza, cuchillo, puño, arco) sube de nivel
// aparte, con el uso: cada golpe que entra da puntos según el daño. Cada nivel (hasta 20) da un 1.5 % más de daño con esa clase y
// gasta un 1.5 % menos de aguante por golpe. A los niveles 10 y 20, un letrero. Se ve en la libreta (Habilidades) y en la ficha del
// arma. Estado: meta.maestria = { clase: puntos } (se guarda).
import { CLASES } from './armas3.js';

export const TOPE = 20;
const NOMBRE = { ...Object.fromEntries(Object.entries(CLASES).map(([k, v]) => [k, v.nombre])), arco: 'Arco' };
const ICONO = { puno: '👊', cuchillo: '🔪', machete: '🌿', espada: '⚔', hacha: '🪓', garrote: '🏏', mazo: '🔨', lanza: '🔱', pico: '⛏', herramienta: '🧰', arco: '🏹' };
// puntos para llegar a un nivel: crece de a poco (el 20 cuesta unos 4000 puntos)
const necesita = (n) => Math.round(10 * n * n);
export function nivel(g, clase) {
  const p = (g.meta && g.meta.maestria && g.meta.maestria[clase]) || 0;
  let n = 0; while (n < TOPE && p >= necesita(n + 1)) n++;
  return n;
}
export const bonoDano = (g, clase) => (g.mode === 'survival' ? 1 + nivel(g, clase) * 0.015 : 1);
export const bonoAguante = (g, clase) => (g.mode === 'survival' ? 1 - nivel(g, clase) * 0.015 : 1);
// cada golpe que entra con esa clase
export function ganarMaestria(g, clase, dano) {
  if (g.mode !== 'survival' || !g.meta || !clase) return;
  const M = (g.meta.maestria ||= {}), antes = nivel(g, clase);
  M[clase] = (M[clase] || 0) + Math.min(12, Math.max(0.5, dano * 0.6));
  const ahora = nivel(g, clase);
  if (ahora > antes) {
    g.ui.toast(`${ICONO[clase] || '⚔'} ${NOMBRE[clase] || clase}: nivel ${ahora} de maestría (+${(ahora * 1.5).toFixed(1)} % de daño y menos aguante por golpe)`, 3000);
    g.audio.play('nivel', { ui: true, vol: 0.35, pitch: 1.3 });
    if (ahora >= 10) g.achieve('maestria10', 'Maestría en un arma');
    if (ahora >= TOPE) g.achieve('maestria20', 'Leyenda del arma');
  }
}
// en la libreta: la maestría de cada clase usada
export function maestriaHTML(g) {
  const M = (g.meta && g.meta.maestria) || {}, usadas = Object.keys(M).filter((k) => M[k] > 0);
  if (!usadas.length) return '<h4 class="mana-tit">⚔ Maestría de armas</h4><p class="lib-nada">Cada clase de arma sube de nivel aparte, pegando con ella.</p>';
  let h = '<h4 class="mana-tit">⚔ Maestría de armas</h4>';
  for (const k of usadas.sort((a, b) => M[b] - M[a])) {
    const n = nivel(g, k), p = M[k], a = necesita(n), b = necesita(Math.min(TOPE, n + 1)), prog = n >= TOPE ? 1 : (p - a) / Math.max(1, b - a);
    h += `<div class="lib-skill"><div class="lib-stit"><i>${ICONO[k] || '⚔'}</i><b>${NOMBRE[k] || k}</b><span>nivel ${n}${n >= TOPE ? ' · ¡leyenda!' : ''}</span></div><div class="lib-bar"><i style="width:${Math.round(prog * 100)}%"></i></div><div class="lib-sdet">+${(n * 1.5).toFixed(1)} % de daño · ${(n * 1.5).toFixed(1)} % menos aguante por golpe</div></div>`;
  }
  return h;
}
