// El álbum de estampas: como el del Mundial, pero de Tiquicia. Los sobres se compran en la pulpería o se los quitan a las Sombras, traen tres estampas, y
// las repetidas se cambian. Cada página llena paga, y el álbum completo, más. Es progreso que se junta jugando cualquier cosa. Estado: meta.album.
import { anotar } from './diario.js';

export const SOBRE = 521;
const COLON = 360, ESENCIA = 499;
export const PAGINAS = [
  { t: 'Leyendas', i: '🌙', premio: [[COLON, 40], [ESENCIA, 2]], e: [['cadejos', 'El Cadejos', '🐕'], ['cadejos_blanco', 'El Cadejos blanco', '🤍'], ['segua', 'La Segua', '🐴'], ['llorona', 'La Llorona', '😢'], ['tulevieja', 'La Tulevieja', '👒'], ['padre', 'El Padre sin Cabeza', '⛪'], ['mona', 'La Mona', '🐒'], ['duende', 'El Duende', '🍄', 1]] },
  { t: 'Fauna', i: '🐸', premio: [[COLON, 40], [443, 1]], e: [['danta', 'La danta', '🐗'], ['perezoso', 'El perezoso', '🦥'], ['quetzal', 'El quetzal', '🦜', 1], ['lapa', 'La lapa roja', '🦜'], ['jaguar', 'El jaguar', '🐆', 1], ['tortuga', 'La tortuga baula', '🐢'], ['rana', 'La rana de vidrio', '🐸'], ['manati', 'El manatí', '🐋', 1]] },
  { t: 'Lugares', i: '🗺', premio: [[COLON, 40], [260, 1]], e: [['arenal', 'Volcán Arenal', '🌋'], ['chirripo', 'Cerro Chirripó', '⛰'], ['tortuguero', 'Tortuguero', '🛶'], ['teatro', 'Teatro Nacional', '🎭'], ['esferas', 'Las esferas', '⚪', 1], ['conchal', 'Playa Conchal', '🏖'], ['monteverde', 'Monteverde', '🌳'], ['coco', 'Isla del Coco', '🏝', 1]] },
  { t: 'La familia', i: '🏡', premio: [[COLON, 60], [351, 3]], e: [['zenaida', 'Zenaida', '👵', 1], ['anselmo', 'Don Anselmo', '🚬', 1], ['rigo', 'El tío Rigo', '🧳'], ['marielos', 'Marielos', '🚗'], ['eulalia', 'Doña Eulalia', '☕'], ['tobias', 'Don Tobías', '🧢'], ['yendry', 'Yendry', '🧒'], ['canelo', 'El Canelo', '🐶']] },
  { t: 'Los que asustan', i: '🌑', premio: [[COLON, 80], [ESENCIA, 4]], e: [['sombra', 'Una Sombra', '👤'], ['hondera', 'La hondera', '🎯'], ['grande', 'La Sombra grande', '🗿', 1], ['rey', 'El Murciélago Rey', '🦇', 1], ['arpia', 'La Arpía', '🦅', 1], ['madre', 'La Sombra Madre', '🌑', 1], ['olvido', 'El Olvido', '🌫', 1], ['jefa', 'La Jefa de Ventanilla', '📋', 1]] },
];
const TODAS = PAGINAS.flatMap((P, p) => P.e.map(([k, nom, i, raro]) => ({ k, nom, i, raro: !!raro, p })));
const est = (g) => (g.meta.album ||= { tiene: {}, paginas: {} });
// las que contarían algo de la historia antes de tiempo, no salen hasta que pase
const GUARDA = {
  anselmo: (M) => M.anselmo && M.anselmo.fase >= 4, olvido: (M) => M.anselmo && M.anselmo.fase >= 5,
  jefa: (M) => M.archivo && M.archivo.fase >= 4, madre: (M) => M.hist && (M.hist.fin || M.hist.cap >= 8),
  marielos: (M) => M.prima && M.prima.fase >= 1, yendry: (M) => M.hist && M.hist.guila && M.hist.guila.fase >= 1,
};
const disponibles = (g) => TODAS.filter((e) => !GUARDA[e.k] || GUARDA[e.k](g.meta));
const sacar = (g) => {
  // las raras salen una de cada cuatro veces que salen las comunes
  const L = disponibles(g), peso = L.map((e) => (e.raro ? 1 : 4)), total = peso.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < L.length; i++) { r -= peso[i]; if (r <= 0) return L[i]; }
  return L[0];
};
function pegar(g, A, e) {
  const nueva = !A.tiene[e.k];
  A.tiene[e.k] = (A.tiene[e.k] || 0) + 1;
  return nueva;
}
function revisarPaginas(g, A) {
  PAGINAS.forEach((P, p) => {
    if (A.paginas[p] || !P.e.every(([k]) => A.tiene[k])) return;
    A.paginas[p] = g.day || 1;
    for (const [id, n] of P.premio) g.giveItem(id, n);
    g.ui.regionBanner(`${P.i} Página llena: ${P.t}`, 'El álbum paga lo suyo');
    g.audio.play('aplausos', { ui: true, vol: 0.5 });
    anotar(g, `Llené la página de ${P.t} en el álbum.`, '📒');
    g.achieve('album_pagina', 'Página llena');
  });
  if (Object.keys(A.paginas).length >= PAGINAS.length && !A.completo) {
    A.completo = g.day || 1;
    g.giveItem(COLON, 200); g.giveItem(260, 3);
    g.ui.regionBanner('¡Álbum completo!', 'Don Mario lo quiere enmarcar en la pulpería');
    g.achieve('album_completo', 'Álbum de Tiquicia completo');
  }
}
// clic derecho con el sobre en la mano
export function abrirSobre(g) {
  const A = est(g), saco = [sacar(g), sacar(g), sacar(g)];
  const txt = saco.map((e) => `${pegar(g, A, e) ? '✨' : ''}${e.i} ${e.nom}`).join(' · ');
  g.ui.toast(`📒 ${txt}`, 4200);
  g.audio.play('select', { ui: true, vol: 0.4 });
  g.achieve('album', 'Pegué la primera estampa');
  revisarPaginas(g, A);
}
// las postales: llegar a un lugar famoso pega su estampa, aunque no haya salido en ningún sobre
const POSTALES = { mirador_arenal: 'arenal', cumbre: 'chirripo', refugio: 'chirripo', esferas: 'esferas', tortuguero: 'tortuguero', monteverde: 'monteverde', isla_coco: 'coco', conchal: 'conchal' };
export function postal(g, tipo) {
  const k = POSTALES[tipo];
  if (!k || g.mode !== 'survival' || !g.meta) return;
  const A = est(g), e = TODAS.find((q) => q.k === k);
  if (!e || A.tiene[k]) return;
  pegar(g, A, e);
  g.ui.toast(`📮 Una postal para el álbum: ✨${e.i} ${e.nom}`, 3000);
  g.achieve('postal', 'Le mando una postal');
  revisarPaginas(g, A);
}
// de vez en cuando, una Sombra vencida traía un sobre
export function sobreDeBaja(g, m) {
  if (g.mode !== 'survival' || !(m.kind.hostile || m.kind.legend) || Math.random() > (m.kind.boss ? 1 : m.kind.legend ? 0.3 : 0.05)) return;
  g.entities.dropItem(SOBRE, 1, m.body.pos.x, m.body.pos.y + 0.5, m.body.pos.z);
}
const repetidas = (A) => Object.values(A.tiene).reduce((a, n) => a + Math.max(0, n - 1), 0);
export function cambiarRepetidas(g) {
  const A = est(g), faltan = disponibles(g).filter((e) => !A.tiene[e.k]);
  if (repetidas(A) < 3 || !faltan.length) return false;
  let quitar = 3;
  for (const k of Object.keys(A.tiene)) while (quitar > 0 && A.tiene[k] > 1) { A.tiene[k]--; quitar--; }
  const e = faltan[Math.floor(Math.random() * faltan.length)];
  pegar(g, A, e);
  g.ui.toast(`📒 Cambió 3 repetidas por: ✨${e.i} ${e.nom}`, 3200);
  g.audio.play('craft', { ui: true, vol: 0.3 });
  revisarPaginas(g, A);
  return true;
}
export function albumHTML(g) {
  if (g.mode !== 'survival') return '<p class="lib-nada">El álbum es del modo supervivencia.</p>';
  const A = est(g), n = Object.keys(A.tiene).length, rep = repetidas(A);
  let h = `<div class="lib-scroll album"><p class="mana-nota">📒 ${n} de ${TODAS.length} estampas · ${rep} repetidas. Los sobres se compran en la pulpería, o los traen a veces las Sombras y las leyendas. Llegar a un lugar famoso da su postal. Clic derecho con el sobre en la mano para abrirlo.</p>`;
  if (rep >= 3 && disponibles(g).some((e) => !A.tiene[e.k])) h += '<button type="button" class="album-cambio" data-album="cambiar">Cambiar 3 repetidas por una que falte</button>';
  PAGINAS.forEach((P, p) => {
    const llenas = P.e.filter(([k]) => A.tiene[k]).length;
    h += `<h4 class="mana-tit">${P.i} ${P.t} <small>(${llenas}/${P.e.length})${A.paginas[p] ? ' ✔ llena' : ''}</small></h4><div class="album-pag">`;
    P.e.forEach(([k, nom, i, raro], j) => {
      const t = A.tiene[k];
      h += t ? `<div class="estampa${raro ? ' rara' : ''}"><i>${i}</i><b>${nom}</b>${t > 1 ? `<small>×${t}</small>` : ''}</div>` : `<div class="estampa falta"><i>${p * 8 + j + 1}</i></div>`;
    });
    h += '</div>';
  });
  return `${h}</div>`;
}
export const albumTexto = (g) => { const A = g.meta && g.meta.album; return A ? Object.keys(A.tiene).length : 0; };
