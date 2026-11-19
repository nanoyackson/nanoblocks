// Indicadores en pantalla: la siguiente meta de la ruta del aventurero (debajo del minimapa, con cuántas lleva) y la
// durabilidad de la herramienta o arma que lleva en la mano (verde → amarillo → rojo), con un aviso cuando está por
// romperse.
import { RUTA } from './ruta.js';
import { ITEMS } from './blocks.js';

function el(id, padre = null) {
  let e = document.getElementById(id);
  if (!e) { e = document.createElement('div'); e.id = id; (padre || document.getElementById('hud')).appendChild(e); }
  return e;
}

export function tickIndicadores(g, dt) {
  g.indT = (g.indT || 0) - dt;
  const oculto = g.hudHidden || g.foto || !g.world;
  // ---- durabilidad (cada cuadro, es barato) ----
  const dur = el('ind-dur');
  const s = g.inventory && g.inventory.held, def = s && ITEMS[s.id];
  if (!oculto && s && s.dur !== undefined && def && def.durability && g.mode === 'survival') {
    const f = s.dur / def.durability;
    const txt = def.agua ? `💧 ${s.dur}/${def.durability}` : `🔧 ${s.dur}/${def.durability}`;
    if (dur.textContent !== txt) dur.textContent = txt;
    dur.style.display = 'block';
    dur.style.color = f > 0.5 ? 'var(--success)' : f > 0.2 ? 'var(--warn)' : 'var(--danger)';
    dur.classList.toggle('poco', f <= 0.1);
    // aviso una vez por herramienta cuando le queda poquito
    const k = `${s.id}`;
    if (f <= 0.1 && g.avisoDur !== k && !def.agua) { g.avisoDur = k; g.ui.toast(`⚠ ${def.name}: le quedan ${s.dur} usos. Repárelo en la cuadrícula con su material`, 2600); }
    if (f > 0.1 && g.avisoDur === k) g.avisoDur = null;
  } else dur.style.display = 'none';
  // ---- la meta de la ruta (cada segundo) ----
  if (g.indT > 0) return;
  g.indT = 1;
  const meta = el('ind-meta', document.getElementById('lado-hud')); // v13.5.6 (PU-01): dentro del lado-hud, en el flujo: el objetivo de abajo ya no se le encima
  if (meta.parentNode.firstChild !== meta) meta.parentNode.insertBefore(meta, meta.parentNode.firstChild);
  const st = (g.meta && g.meta.ruta) || {};
  const i = RUTA.findIndex((_, j) => !st[j]);
  const hechas = RUTA.filter((_, j) => st[j]).length;
  const visible = !oculto && g.settings.metaRuta !== false && g.mode === 'survival' && i >= 0 && g.dim !== 'inframundo';
  meta.style.display = visible ? 'block' : 'none';
  if (visible) {
    const txt = `🧭 ${RUTA[i].title} · ${hechas}/${RUTA.length}`;
    if (meta.textContent !== txt) { meta.textContent = txt; meta.classList.remove('cambio'); void meta.offsetWidth; meta.classList.add('cambio'); }
    meta.classList.toggle('sin-mapa', g.settings.minimapa === false);
  }
}
