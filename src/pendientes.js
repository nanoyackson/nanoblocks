// «Lo que viene» y «Pendientes», en la hoja de la partida: ya hay muchas historias a la vez, y uno vuelve al juego sin acordarse de qué iba.
import { pendientes as manasPendientes, proximoNivel } from './manas.js';
import { textoExpediente } from './expediente.js';
import { genteTexto } from './gente.js';
import { primaTexto } from './prima.js';
import { textoArchivo } from './archivo.js';
import { cumpleTexto } from './cumple.js';
import { sebuscaTexto } from './recompensas.js';
import { deudorTexto } from './bravos.js';

const enDias = (n) => (n === 0 ? 'hoy' : n === 1 ? 'mañana' : `en ${n} días`);
const hasta = (dia, cada) => (dia % cada === 0 ? 0 : cada - (dia % cada));

export function almanaqueHTML(g) {
  const M = g.meta, H = M.hist || {}, dia = g.day || 1;
  const L = [];
  if (H.hogar) L.push(['🏡', 'Asedio a la casa', hasta(dia, 5)]);
  L.push(['🌕', 'Luna llena', hasta(dia, 7)]);
  if (H.hogar) L.push(['🎒', 'Don Carlos, con la tienda', hasta(dia, 4)]);
  L.sort((a, b) => a[2] - b[2]);
  return `<h4 class="mana-tit">🗓 Lo que viene</h4><div class="alma">${L.map(([i, t, n]) => `<span class="${n === 0 ? 'hoy' : ''}"><i>${i}</i>${t}: <b>${enDias(n)}</b></span>`).join('')}</div>`;
}
export function pendientesHTML(g) {
  const M = g.meta, H = M.hist || {}, dia = g.day || 1;
  const L = [];
  const mp = manasPendientes(g);
  if (mp) L.push(`🌟 ${mp === 1 ? 'Tiene una maña' : `Tiene ${mp} mañas`} por escoger (tecla U)`);
  else if (proximoNivel(g)) L.push(`🌟 La próxima maña, en el nivel ${proximoNivel(g)} (va en el ${g.xpInfo.level})`);
  if (M.nemesis) L.push(`🩸 «${M.nemesis.nombre}» anda detrás de usted. Sale de noche`);
  const R = M.rigo;
  if (R && R.fase === 2) L.push('🧳 El maletín del tío Rigo: en un cofre en el monte');
  if (R && R.fase === 3) L.push(`🧳 El tío Rigo revisa los papeles: hable con él ${dia - R.diaMaletin >= 2 ? 'cuando llegue de día' : 'en unos días'}`);
  const Es = M.escondites;
  if (Es && !Es.fin) L.push(`📦 Escondites de Zenaida: lleva ${Es.i} de 5 (la brújula marca el 📦)`);
  const Y = H.guila;
  if (Y && Y.fase > 0 && Y.fase < 4) L.push(`🧒 Yendry: ${['', 'tiene hambre: déle comida', 'pide una venda, en la mano', 'quiere ver cómo se pelea: venza a 5'][Y.fase]}`);
  L.push(...genteTexto(g));
  if (primaTexto(g)) L.push(primaTexto(g));
  if (textoArchivo(g)) L.push(textoArchivo(g));
  if (cumpleTexto(g)) L.push(cumpleTexto(g));
  if (sebuscaTexto(g)) L.push(sebuscaTexto(g));
  if (deudorTexto(g)) L.push(deudorTexto(g));
  const ex = textoExpediente(g);
  if (ex) L.push(ex);
  if (M.nidos && M.nidos.length) L.push(`🕸 ${M.nidos.length === 1 ? 'Hay un nido' : `Hay ${M.nidos.length} nidos`} de Sombra vivos: la brújula los marca`);
  if (!L.length) return '';
  return `<h4 class="mana-tit">📌 Pendientes</h4><ul class="pend">${L.map((t) => `<li>${t}</li>`).join('')}</ul>`;
}
