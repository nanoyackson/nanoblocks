// El amanecer cuenta: cada día que uno sobrevive suma a la racha, y al salir el sol un resumen dice cómo le fue. Morir la corta.
// Da algo que cuidar y qué presumir, aparte del equipo. Los mundos viejos empiezan su racha desde el día en que estén.
import { anotar } from './diario.js';
import { platosHTML } from './plato.js';
import { almanaqueHTML, pendientesHTML } from './pendientes.js';
import { etapasHTML } from './final.js';
import { genteEnCasa } from './gente.js';
import { albumTexto } from './album.js';
import { BLOCK_BY_KEY as K } from './blocks.js';

const PREMIO = { 3: 10, 7: 25, 14: 60, 30: 150 }; // colones por llegar a tantos días seguidos
const COLON = 360;
// lo nuevo que uno quizá no ha descubierto: cada mañana, a lo sumo un consejo de lo que todavía no ha usado
const hecho = (g, id) => !!(g.meta.crafted && g.meta.crafted[id]);
const logro = (g, k) => !!(g.achievements && g.achievements.has(k));
const CONSEJOS = [
  { dia: 2, si: (g) => !hecho(g, K.bed), t: '🛏 Una cama pasa la noche y guarda el lugar donde reaparece' },
  { dia: 3, si: (g) => !g.meta.antorchaRapida, t: '🔦 La tecla X pone una antorcha sin soltar lo que tiene en la mano. En las cuevas se agradece' },
  { dia: 3, si: (g) => !hecho(g, 426), t: '💧 Con cuero se hace una cantimplora: agua para el camino' },
  { dia: 4, si: (g) => !(g.meta.monte && g.meta.monte.length), t: '🌿 Una trampa de lazo o una nasa trabajan solas mientras uno anda en otra cosa' },
  { dia: 5, si: (g) => !logro(g, 'plato'), t: '🍲 Un casado da fuerza, una olla de carne protege: antes de pelear conviene pensar qué se come. La ficha dice qué da cada plato' },
  { dia: 6, si: (g) => g.meta.hist && g.meta.hist.hogar && !hecho(g, 509), t: '🚪 Las Sombras tumban puertas. Una tranca (tablas + hierro) las hace aguantar el doble' },
  { dia: 7, si: (g) => hecho(g, 302) && !hecho(g, K.yunque), t: '🔨 Con hierro de sobra se hace un yunque: mejora armas, herramientas y armadura con estrellas' },
  { dia: 8, si: (g) => g.meta.nidos && g.meta.nidos.length && !logro(g, 'nido'), t: '🕸 Los nidos se parten con hacha, y dan esencia de sombra. Cada 3, una Sombra menos por noche' },
  { dia: 9, si: (g) => !g.meta.comioRapido, t: '🍽 Mantener G come lo que mejor rinde, sin tener que buscarlo en la mochila' },
  { dia: 10, si: (g) => !logro(g, 'destino'), t: '📍 Un clic en el mapa marca un destino, y la brújula lo señala' },
  { dia: 11, si: (g) => !logro(g, 'resiembra'), t: '🌽 Si cosecha con la azada en la mano, se vuelve a sembrar sola, si anda semilla' },
  { dia: 12, si: (g) => !hecho(g, K.compostera), t: '🌱 Una compostera vuelve abono las sobras de comida y las hojas' },
  { dia: 14, si: (g) => !hecho(g, K.puntal), t: '🧱 Por debajo de la altura 40 el techo se puede venir abajo. Los puntales lo evitan' },
];
function consejoDelDia(g, dia) {
  const C = (g.meta.consejosDia ||= {});
  for (let i = 0; i < CONSEJOS.length; i++) {
    const c = CONSEJOS[i];
    if (C[i] || dia < c.dia || !c.si(g)) continue;
    C[i] = dia;
    return c.t;
  }
  return null;
}

export function anotarBaja(g, m) {
  if (g.mode !== 'survival' || !g.meta || !(m.kind.hostile || m.kind.legend || m.kind.boss)) return;
  const hoy = (g.meta.hoy ||= {});
  hoy.bajas = (hoy.bajas || 0) + 1;
  g.meta.bajas = (g.meta.bajas || 0) + 1;
}
export function rachaMurio(g) {
  if (g.mode !== 'survival' || !g.meta) return;
  const r = (g.meta.racha ||= { dias: 0, mejor: 0 });
  if (r.dias >= 2) g.ui.toast(`💀 Se acabó la racha de ${r.dias} días. La mejor sigue en ${r.mejor}`, 3600);
  r.dias = 0;
  (g.meta.hoy ||= {}).murio = true;
  g.meta.muertes = (g.meta.muertes || 0) + 1;
}
// cada segundo
export function tickAmanecer(g) {
  if (g.mode !== 'survival' || !g.meta) return;
  g.meta.segundos = (g.meta.segundos || 0) + 1;
  const dia = g.day || 1;
  if (g.meta.rachaDia == null) g.meta.rachaDia = dia;
  if (g.meta.rachaDia === dia) return;
  g.meta.rachaDia = dia;
  const hoy = g.meta.hoy || {}, r = (g.meta.racha ||= { dias: 0, mejor: 0 });
  g.meta.hoy = {};
  if (!hoy.murio) { r.dias++; r.mejor = Math.max(r.mejor, r.dias); }
  const partes = [`🌅 Día ${dia}`];
  if (hoy.murio) partes.push('Ayer fue duro, pero aquí sigue');
  else partes.push(r.dias === 1 ? 'Sobrevivió otro día' : `${r.dias} días seguidos sin morir`);
  if (hoy.bajas) partes.push(`${hoy.bajas} ${hoy.bajas === 1 ? 'enemigo vencido' : 'enemigos vencidos'}`);
  g.ui.toast(partes.join(' · '), 4200);
  const consejo = consejoDelDia(g, dia);
  if (consejo) g.ui.toast(consejo, 4600);
  const premio = !hoy.murio && PREMIO[r.dias];
  if (premio) {
    g.giveItem(COLON, premio);
    g.audio.play('aplausos', { ui: true, vol: 0.4 });
    g.ui.regionBanner(`¡${r.dias} días sin morir!`, `Los vecinos se enteraron: ${premio} colones`);
    if (r.dias === 3) g.achieve('racha3', '3 días sin morir');
    if (r.dias === 7) g.achieve('racha7', 'Una semana sin morir');
    if (r.dias === 14) g.achieve('racha14', 'Dos semanas sin morir');
    if (r.dias === 30) g.achieve('racha30', 'Un mes sin morir');
    anotar(g, `Llevo ${r.dias} días seguidos sin morir.`, '🔥');
  }
}

// ---------- la hoja de la partida (en la libreta) ----------
export function partidaHTML(g) {
  const M = g.meta;
  if (!M || g.mode !== 'survival') return '<p class="lib-nada">Las estadísticas son del modo supervivencia.</p>';
  const H = M.hist || {}, seg = M.segundos || 0, h = Math.floor(seg / 3600), min = Math.floor((seg % 3600) / 60), R = M.racha || {};
  const dato = (i, t, v) => `<div class="dato"><i>${i}</i><b>${v}</b><span>${t}</span></div>`;
  return `<div class="lib-scroll partida">${pendientesHTML(g)}${g.mode === 'survival' ? etapasHTML(g) : ''}${almanaqueHTML(g)}<h4 class="mana-tit">📊 La partida</h4><div class="datos">${[
    dato('📅', 'Días', g.day || 1),
    dato('⏱', 'Tiempo jugado', h ? `${h} h ${min} min` : `${min} min`),
    dato('🔥', 'Mejor racha', `${R.mejor || 0} días`),
    dato('⚔', 'Vencidos', M.bajas || 0),
    dato('💀', 'Muertes', M.muertes || 0),
    dato('🕸', 'Nidos partidos', M.nidosRotos || 0),
    dato('🏡', 'Asedios defendidos', H.asedios || 0),
    dato('🔔', 'Plazas defendidas', M.apuros || 0),
    dato('🏘', 'Gente en la casa', `${genteEnCasa(g)}/4`),
    dato('📒', 'Estampas', `${albumTexto(g)}/40`),
    dato('🍽', 'Les sirvió de comer a', (M.comensales || []).length),
    dato('🩸', 'Sombras con nombre vencidas', (M.nemesisVencidas || []).length),
    dato('🌋', 'Récord de ceniza', `${(M.ceniza && M.ceniza.record) || 0} oleadas`),
    dato('✉', 'Cartas', (H.cartas || []).length),
    dato('🧩', 'Pedazos del Corazón', `${Object.keys(H.pedazos || {}).length}/4`),
    dato('📓', 'Hojas del cuaderno', `${Object.keys(M.cuaderno || {}).length}/12`),
    dato('📦', 'Escondites', `${M.escondites ? (M.escondites.fin ? 5 : M.escondites.i) : 0}/5`),
    dato('📋', 'Semanas completas', M.semanas || 0),
    dato('🏆', 'Logros', g.achievements ? g.achievements.size : 0),
  ].join('')}</div>${platosHTML(g)}</div>`;
}
