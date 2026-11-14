// El diario del aventurero (se escribe solo: lugares, logros, jefes, muertes y cada amanecer) y los marcadores con
// nombre (Shift+B), que salen en el mapa y en la brújula. En el mapa, clic derecho sobre uno lo borra.
import { regionAt, REGIONES } from './regiones.js';

const MAX = 250;
export function anotar(g, texto, icono = '•') {
  if (!g.meta) return;
  const D = (g.meta.diario = g.meta.diario || []);
  const last = D[D.length - 1];
  if (last && last.t === texto && last.d === (g.day || 1)) return;
  D.push({ d: g.day || 1, i: icono, t: texto });
  if (D.length > MAX) D.splice(0, D.length - MAX);
}

const CLIMA = { clear: 'despejado', rain: 'con lluvia', storm: 'con tormenta' };
// cada segundo: el amanecer de cada día queda anotado
export function tickDiario(g) {
  if (!g.meta || g.dim !== 'tierra') return;
  const d = g.day || 1;
  if (g.meta.diarioDia === d) return;
  g.meta.diarioDia = d;
  const p = g.player.body.pos, reg = REGIONES[regionAt(g.world.gen, p.x, p.z)];
  anotar(g, `Amaneció el día ${d} en ${reg ? reg.name : 'algún lado'}, ${CLIMA[g.weather && g.weather.type] || 'despejado'}.`, '🌅');
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function diarioHTML(g) {
  const D = (g.meta && g.meta.diario) || [];
  if (!D.length) return '<p class="lib-nada">Todavía no ha escrito nada. Salga a explorar.</p>';
  const avisos = ((g.ui && g.ui.avisos) || []).slice(-15).reverse();
  let h = `<div class="lib-scroll diario">${avisos.length ? `<details class="avisos"><summary>🔔 Últimos avisos</summary>${avisos.map((t) => `<div class="diario-e"><span>${esc(t)}</span></div>`).join('')}</details>` : ''}`, dia = null;
  for (let k = D.length - 1; k >= 0; k--) {
    const e = D[k];
    if (e.d !== dia) { dia = e.d; h += `<div class="diario-dia">Día ${dia}</div>`; }
    h += `<div class="diario-e"><i>${esc(e.i ?? '')}</i><span>${esc(e.t)}</span></div>`; // v12.4.3: el icono también (un mundo importado lo traía sin escapar)
  }
  return h + '</div>';
}

// ---------- marcadores ----------
export function ponerMarcador(g, STRUCT_NAMES, structuresNear) {
  if (g.dim !== 'tierra') { g.ui.toast('Los marcadores son de la Tierra', 1400); return; }
  const M = (g.meta.marcadores = g.meta.marcadores || []);
  if (M.length >= 30) { g.ui.toast('Ya tiene 30 marcadores: borre alguno en el mapa (clic derecho)', 2200); return; }
  const p = g.player.body.pos;
  const reg = REGIONES[regionAt(g.world.gen, p.x, p.z)];
  let cerca = null, dc = 90;
  for (const s of structuresNear(g.world.gen, p.x, p.z, 90)) { const d = Math.hypot(s.x - p.x, s.z - p.z); if (d < dc) { dc = d; cerca = s; } }
  const nombre = cerca ? `Cerca de ${STRUCT_NAMES[cerca.type] || 'un lugar'}` : `${reg ? reg.name : 'Punto'} ${M.length + 1}`;
  M.push({ x: Math.round(p.x), z: Math.round(p.z), n: nombre });
  g.ui.toast(`🔖 Marcador: ${nombre} (sale en el mapa y la brújula)`, 2200);
  anotar(g, `Puse un marcador: ${nombre}.`, '🔖');
}
// en el mapa: clic derecho cerca de un marcador lo borra
export function borrarMarcadorEn(g, wx, wz, radio) {
  const M = g.meta.marcadores || [];
  let best = -1, bd = radio;
  M.forEach((m, i) => { const d = Math.hypot(m.x - wx, m.z - wz); if (d < bd) { bd = d; best = i; } });
  if (best < 0) return false;
  const [m] = M.splice(best, 1);
  g.ui.toast(`🗑 Marcador borrado: ${m.n}`, 1600);
  return true;
}
