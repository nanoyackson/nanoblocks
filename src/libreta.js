// La libreta: logros (L) con su progreso y habilidades (H) con barras y lo que desbloquea cada nivel.
import { catalogo, achIcon } from './logros.js';
import { SKILLS, skillInfo } from './habilidades.js';
import { maestriaHTML } from './maestria.js';
import { bestiarioHTML } from './bestiario.js';
import { diarioHTML } from './diario.js';
import { cartasHTML } from './historia.js';
import { partidaHTML } from './amanecer.js';
import { manasHTML } from './manas.js';
import { ayudaHTML } from './ayuda.js';
import { albumHTML } from './album.js';
import { MOB_TYPES } from './entities.js';
import { libroPescaHTML } from './pesca.js';

const GRUPO = { '🎖️': 'Habilidades', '⚔️': 'Combate y leyendas', '⭐': 'Grandes hazañas', '🌋': 'Volcanes y fuego', '☁️': 'El cielo', '🪢': 'Aventura', '🌿': 'Parques y naturaleza', '🚗': 'Carretera', '🏠': 'Casa', '🍽️': 'Comida tica', '🐾': 'Animales', '🎉': 'Fiestas y diversión', '🗣️': 'El pueblo', '🏆': 'De todo un poco' };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function libretaHTML(g, tab) {
  if (tab === 'bestiario') return bestiarioHTML(g, MOB_TYPES);
  if (tab === 'diario') return diarioHTML(g);
  if (tab === 'dicho') return dichoHTML(g);
  if (tab === 'cartas') return cartasHTML(g);
  if (tab === 'partida') return partidaHTML(g);
  if (tab === 'manas') return manasHTML(g);
  if (tab === 'ayuda') return ayudaHTML(g);
  if (tab === 'album') return albumHTML(g);
  if (tab === 'pesca') return libroPescaHTML(g); // v12.7.0 (C5-A1)
  return tab === 'habilidades' ? habilidadesHTML(g) : logrosHTML(g);
}

// «Lo que se dijo»: los avisos de la partida, los que salieron y los que el locutor dejó pasar (v11.9), para leerlos con calma
const ETQ = { urgente: '⚠ Urgente', importante: '⭐ Importante', consejo: '💡 Consejo', ambiente: '🗨 Ambiente', registro: '📝 Registro' };
const ESTADO = { dicho: '', botado: ' · no salió', repetido: ' · repetido' };
function dichoHTML(g) {
  const L = ((g.ui && g.ui.locutor && g.ui.locutor.hist) || []).slice().reverse();
  const e = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  if (!L.length) return '<div class="lib-scroll"><p class="lib-nota">Todavía no se ha dicho nada en esta partida.</p></div>';
  return `<div class="lib-scroll dicho"><p class="lib-nota">Los últimos ${L.length} avisos, del más nuevo al más viejo. Los que no salieron en pantalla (por la fila, la pelea o el ajuste «Avisos en pantalla») también quedan aquí.</p>${L.map((x) => `<div class="dicho-e ${x.cat}${x.estado !== 'dicho' ? ' tenue' : ''}"><small>${e(x.hora)} · ${ETQ[x.cat] || x.cat}${ESTADO[x.estado] || ''}${x.n > 1 ? ` · ×${x.n}` : ''}</small><span>${e(x.text)}</span></div>`).join('')}</div>`;
}

function logrosHTML(g) {
  const cat = catalogo();
  const have = g.achievements || new Set();
  const textos = (g.meta && g.meta.achTexts) || {};
  // los ganados que no están en el catálogo (atrapar_…, cria_…) también salen
  for (const k of have) if (!cat.has(k)) cat.set(k, textos[k] || k.replace(/_/g, ' '));
  const total = cat.size, n = [...cat.keys()].filter((k) => have.has(k)).length;
  // agrupados por tema (el ícono), primero los ganados
  const grupos = new Map();
  for (const [k, t] of cat) {
    const ic = achIcon(k);
    if (!grupos.has(ic)) grupos.set(ic, []);
    grupos.get(ic).push({ k, t, ok: have.has(k) });
  }
  const pct = Math.round((n / Math.max(1, total)) * 100);
  let h = `<div class="lib-prog"><b>${n} de ${total}</b> logros · ${pct} %<div class="lib-bar"><i style="width:${pct}%"></i></div></div><div class="lib-scroll">`;
  for (const [ic, arr] of [...grupos].sort((a, b) => b[1].filter((x) => x.ok).length - a[1].filter((x) => x.ok).length)) {
    arr.sort((a, b) => b.ok - a.ok);
    h += `<div class="lib-grupo"><div class="lib-gtit">${ic} ${GRUPO[ic] || ''} <span>${arr.filter((x) => x.ok).length}/${arr.length}</span></div><div class="lib-grid">`;
    for (const a of arr) h += `<div class="lib-logro${a.ok ? ' ok' : ''}" title="${esc(a.ok ? a.t : 'Todavía no')}"><i>${a.ok ? ic : '🔒'}</i><span>${esc(a.t)}</span></div>`;
    h += '</div></div>';
  }
  return h + '</div>';
}

function habilidadesHTML(g) {
  if (g.mode !== 'survival') return '<p class="lib-nada">Las habilidades suben jugando en supervivencia.</p>';
  let h = '<div class="lib-scroll">';
  for (const [k, s] of Object.entries(SKILLS)) {
    const i = skillInfo(g, k);
    h += `<div class="lib-skill"><div class="lib-stit"><i>${s.icon}</i><b>${s.name}</b><span>nivel ${i.lv}${i.lv >= 10 ? ' · ¡maestro!' : ''}</span></div>
      <div class="lib-bar"><i style="width:${Math.round(i.prog * 100)}%"></i></div>
      <div class="lib-sdet">${i.lv ? `Ahora: ${esc(s.bono(i.lv))}` : 'Todavía sin bono'}${i.lv < 10 ? ` · faltan ${i.falta} pts` : ''}</div>
      <div class="lib-hitos"><span class="${i.lv >= 5 ? 'ok' : ''}">Nivel 5: ${esc(s.hito5)}</span><span class="${i.lv >= 10 ? 'ok' : ''}">Nivel 10: ${esc(s.hito10)}</span></div></div>`;
  }
  return h + '<p class="lib-nada">Suben haciendo: picar piedra y minerales, talar troncos, pescar, cocinar y comer comida buena, vencer enemigos, cosechar y descubrir lugares.</p>' + maestriaHTML(g) + '</div>';
}
