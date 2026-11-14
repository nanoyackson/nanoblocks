// El epílogo: para quien terminó todas las historias. Un domingo de mesa larga, con todos ya en la casa, una pantalla en negro cuenta lo que pasó en esa
// partida, con sus propios números, y le da crédito a toda la gente. Sale una sola vez. Usa los estilos del prólogo. Estado: meta.epilogo.
import { anotar } from './diario.js';
import { genteEnCasa } from './gente.js';


const ANCHO = 9, FONDO = 7, MANTILLA = 1191; // (la misma de reyremate.js: acá no se importa para no hacer ciclo con las criaturas)
export function listoEpilogo(g) {
  const M = g.meta, H = M.hist;
  if (!H || !H.fin || M.epilogo) return false;
  const G = (M.gente && M.gente.p) || {};
  return !!(M.anselmo && M.anselmo.escena === 'fin') && ['tino', 'chepa', 'flor', 'wilber'].every((k) => G[k] && G[k].fase === 2 && (G[k].nivel || 1) >= 2) && M.prima && M.prima.fase >= 5 && H.guila && H.guila.fase >= 4;
}
// v12.16.5 (fase 7): el epílogo cierra cada hilo con una frase y cuenta también la Noche del Rey. Si un hilo quedó abierto, su línea se
// salta (no se inventa nada). La historia NO exige al Rey: solo se cuenta si ocurrió (meta.reyZopilote).
function lineas(g) {
  const M = g.meta || {}, H = M.hist || {}, dia = g.day || 1, com = (M.comensales || []).length, venc = M.nemesisVencidas || [], L = [];
  const leidas = (M.correo && M.correo.leidas) || {}, G = (M.gente && M.gente.p) || {};
  L.push(`Día ${dia}.`);
  L.push('La casa de la abuela ya no tiene huecos. Ni miedo.');
  L.push(`Hoy en esa mesa comen ${genteEnCasa(g) + 4} personas, y un perro${M.canelo && M.canelo.adoptado ? ' que era de ella' : ''}.`);
  if (M.muertes) L.push(`Se cayó ${M.muertes} ${M.muertes === 1 ? 'vez' : 'veces'}, y volvió por sus cosas.`);
  else L.push('Nunca se cayó. Nadie se lo cree.');
  if (venc.length) L.push(`«${venc[0]}» ya no le debe nada.`);
  if (com) L.push(`Le guardó el plato a ${com} ${com === 1 ? 'Sombra' : 'Sombras'} que nadie esperaba.`);
  if (H.asedios) L.push(`A esta casa vinieron por ella ${H.asedios} ${H.asedios === 1 ? 'vez' : 'veces'}.`);
  if (M.corazon) L.push('El Corazón de Tiquicia quedó en la repisa. Las noches ya son noches.');
  if (M.anselmo && M.anselmo.escena === 'fin') L.push('Don Anselmo fue por los cigarros. No volvió. Tampoco hace falta.');
  else if (M.anselmo) L.push('Don Anselmo todavía no ha ido por los cigarros.');
  if (M.prima && M.prima.fase >= 5) L.push('La prima Marielos vendió su primer lote… y una casa que no era suya, a la dueña.');
  if (M.rigo && M.rigo.fase >= 1) L.push('El tío Rigo cobró la póliza. Esta vez, a favor de la casa.');
  if (leidas.chema) L.push('Don Chema trajo la última carta. Dejó de llover.');
  if (H.cap >= 2) L.push('Doña Eulalia cumplió noventa y uno. El tres leches salió mejor que nunca.');
  if (['tino', 'chepa', 'flor', 'wilber'].every((k) => G[k] && G[k].fase === 2)) L.push('El yunque suena otra vez. La olla no se vacía. La mata de Flor floreó. Mae Wilber ya no mira la cumbre.');
  if (H.guila && H.guila.fase >= 4) L.push('Yendry aprendió a parar un golpe. Todavía no a pedir permiso.');
  if (M.canelo && M.canelo.adoptado) L.push('Y el Canelo duerme en el patio, cada noche, sin que nadie se lo pida.');
  if (M.reyZopilote) L.push(`Día ${M.reyZopilote}: el Rey Zopilote cayó. La gente lo vio. Fue en una noche sin luna que terminó antes de tiempo.`);
  L.push('Coma bien, que la vida es larga.');
  return L;
}
function pantalla(g, lin = null) {
  const L = lin || lineas(g), el = document.createElement('div'), paso = 2.7;
  el.id = 'prologo';
  el.className = 'epilogo';
  const creditos = 'Zenaida · Anselmo · Rigo · Marielos · Eulalia · Tobías · Tino · Chepa · Flor · Wilber · Yendry · Don Chema · el Lic. Porras · y los que nadie esperó';
  el.innerHTML = `${L.map((t, i) => `<p style="animation-delay:${0.4 + i * paso}s">${t}</p>`).join('')}<h2 style="animation-delay:${0.8 + L.length * paso}s">Las cartas de la abuela</h2><small style="animation-delay:${1.6 + L.length * paso}s">${creditos}</small>`;
  document.body.appendChild(el);
  let listo = false;
  const dura = (2.4 + L.length * paso + 7) * 1000, ini = performance.now();
  const invitado = !!(g.meta && g.meta.invitado); // quien visita no pausa el mundo de otra persona
  if (!invitado) g.paused = true;
  const fin = (e) => {
    // caminar, saltar o una tecla sostenida no cuentan: que no se lo salte por andar caminando
    if (e && (e.repeat || /^(Key[WASD]|Space|Shift|Control|Arrow)/.test(e.code || ''))) return;
    if (listo || (e && performance.now() - ini < 2500)) return;
    listo = true;
    if (!invitado && g.ui.state === 'playing') g.paused = false;
    window.removeEventListener('keydown', fin, true);
    window.removeEventListener('mousedown', fin, true);
    el.classList.add('fuera');
    setTimeout(() => el.remove(), 900);
  };
  window.addEventListener('keydown', fin, true);
  window.addEventListener('mousedown', fin, true);
  setTimeout(() => { fin(null); }, dura);
}
// cada segundo
export function tickEpilogo(g) {
  if (g.mode !== 'survival' || g.dim !== 'tierra' || !g.meta || !g.meta.hist || g.ui.state !== 'playing') return;
  const dia = g.day || 1, t = g.time || 0, H = g.meta.hist;
  if (dia % 7 !== 0 || t < 0.1 || t > 0.38 || !H.casa || !listoEpilogo(g) || g.asedio || g.ceniza) return;
  const p = g.player.body.pos;
  if (Math.hypot(H.casa.x + ANCHO / 2 - p.x, H.casa.z + FONDO / 2 - p.z) > 26) return;
  g.meta.epilogo = dia;
  anotar(g, 'Hoy comimos todos en la mesa larga. No faltaba nadie.', '🍲');
  if (g.inventory.count(MANTILLA) === 0 && !g.meta.mantillaDada) { g.meta.mantillaDada = true; g.giveItem(MANTILLA, 1); g.ui.toast('🧣 Zenaida dejó su mantilla en el respaldo de una silla: es suya', 5000, 'importante'); }
  g.achieve('epilogo', 'La mesa larga, completa');
  pantalla(g);
}
// para quien visita: cuando cae el Rey, también ve su cierre (solo lo que se sabe sin el mundo del anfitrión)
export function epilogoRey(g) {
  if (typeof document === 'undefined' || document.getElementById('prologo')) return;
  pantalla(g, [`Día ${g.day || 1}.`, 'El Rey Zopilote cayó. La gente lo vio. Fue en una noche sin luna que terminó antes de tiempo.', 'Coma bien, que la vida es larga.']);
}
export function pruebaEpilogo(g) {
  g.meta.epilogo = null;
  pantalla(g);
  return 'Epílogo: es la pantalla, sin tocar la partida';
}
