// Las mañas de jefe (v12.16.5, fase 7 del diseño de jefes y final): una maña propia por jefe, la PRIMERA vez que se vence, sin gastar una
// casilla de nivel (no cuentan en NIVELES). Se guardan en `meta.manasJefe` y se ven en la libreta. Este archivo no importa nada a propósito:
// lo leen progreso.js, golpes.js, combate.js, jefes2.js, alas.js y game.js, y no puede formar ciclos.
export const MANAS_JEFE = [
  { k: 'seda_reina', i: '🕸', jefe: 'reina_bananera', t: 'Seda de la Reina', d: 'La telaraña y el veneno de araña duran la mitad' },
  { k: 'oido_cascabel', i: '🐍', jefe: 'cascabel_rey', t: 'Oído de cascabel', d: 'Los avisos rojos le duran 0,15 s más' },
  { k: 'cuerno_firme', i: '🪲', jefe: 'escarabajo_hercules', t: 'Cuerno firme', d: 'Las embestidas lo empujan la mitad' },
  { k: 'panza_sapo', i: '🐸', jefe: 'sapo_tata', t: 'Panza de sapo', d: 'El veneno hace 30 % menos' },
  { k: 'concha', i: '🦀', jefe: 'cangrejo_rey', t: 'Concha', d: 'El escudo aguanta 20 % más y el parry con él dura 0,05 s más' },
  { k: 'mil_patas', i: '🐛', jefe: 'ciempies_rey', t: 'Mil patas', d: 'El barrido y el esquive gastan 25 % menos aire' },
  { k: 'piel_ceniza', i: '🌋', jefe: 'senor_arenal', t: 'Piel de ceniza', d: 'La lava y el fuego pegan 30 % menos' },
  { k: 'pluma_viento', i: '🪶', jefe: 'arpia', t: 'Pluma al viento', d: 'Las alas planean un 25 % más' },
  { k: 'rey_cumbre', i: '👑', jefe: 'rey_zopilote', t: 'Rey de la cumbre', d: '+2 corazones para siempre' },
];
const POR_JEFE = Object.fromEntries(MANAS_JEFE.map((m) => [m.jefe, m]));
export const manaJefe = (g, k) => !!(g && g.meta && g.meta.manasJefe && g.meta.manasJefe[k]);
// la da `killedMob` (game.js) la primera vez que cae ese jefe. Devuelve la maña nueva o null
export function darManaJefe(g, m) {
  const M = POR_JEFE[m.type];
  if (!M || !g.meta || g.mode !== 'survival' || manaJefe(g, M.k)) return null;
  (g.meta.manasJefe ||= {})[M.k] = g.day || 1;
  if (M.k === 'rey_cumbre') { g.meta.vidaExtra = (g.meta.vidaExtra || 0) + 2; g.player.vidaExtra = g.meta.vidaExtra; g.player.health = g.player.maxHealth; }
  g.audio.play('nivel', { ui: true, vol: 0.6 });
  g.ui.toast(`${M.i} Maña de jefe: ${M.t}. ${M.d}`, 5200, 'importante');
  return M;
}
export function manasJefeHTML(g) {
  const tengo = MANAS_JEFE.filter((m) => manaJefe(g, m.k));
  let h = `<h4 class="mana-tit">👑 Mañas de jefe <small>(${tengo.length}/${MANAS_JEFE.length})</small></h4>`;
  if (!tengo.length) return `${h}<p class="lib-nada">Cada jefe que venza por primera vez le deja una, sin gastar casillas.</p>`;
  h += `<div class="mana-lista">${tengo.map((m) => `<div class="mana-mia f-pelea"><i>${m.i}</i><b>${m.t}</b><span>${m.d}</span></div>`).join('')}</div>`;
  return h;
}
