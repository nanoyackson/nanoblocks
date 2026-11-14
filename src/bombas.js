// ¡Bomba! En los días de fiesta, cerca de la plaza, de vez en cuando alguien grita «¡Bomba!», se para la bulla y suelta una
// copla de cuatro versos (en globitos, línea por línea). Al final la gente responde y aplaude. Todas las coplas son de aquí,
// escritas para el juego. Estado: g.bomba (no se guarda), meta.bombas (las que ya oyó, por número).
import { fiestaHoy } from './fiestas2.js';
import { decir } from './misiones.js';

export const BOMBAS = [
  ['Ayer fui a la municipal', 'a pedir un permisito;', 'me dijeron «vuelva el lunes»…', '¡y ya tengo un nietecito!'],
  ['El gallo pinto de mi abuela', 'tiene un secreto escondido:', 'le echa amor y natilla', 'y uno queda bendecido.'],
  ['Me monté en el bus del pueblo', 'con rumbo a la capital;', 'llegué tres días después', 'y me cobraron igual.'],
  ['Me dijo el toro del redondel', 'que no me metiera a torear;', 'yo no le hice ni caso', 'y ahora no me puedo sentar.'],
  ['Las Sombras salen de noche', 'buscando quién las espere;', 'yo les dejo un plato servido', 'y que coma el que quiere.'],
  ['En invierno llueve tanto', 'que hasta el sapo pide paraguas;', 'mi tía salió a la pulpe', 'y volvió nadando en las aguas.'],
  ['Dicen que en el Cerro de la Muerte', 'la neblina no deja ver;', 'yo me perdí tres semanas', 'buscando dónde comer.'],
  ['Al chancho le pusieron saco', 'para ir a la elección;', 'ganó por cinco votos', 'y prometió un mejor colchón.'],
  ['Mi amor es como el volcán', 'que echa humo de madrugada:', 'de lejos se ve bonito,', 'de cerca no queda nada.'],
  ['El yigüirro cantó en mayo', 'anunciando el aguacero;', 'yo no le hice caso al pájaro', 'y se me mojó el sombrero.'],
  ['Si me caso con usted', 'se lo juro por mi abuelita:', 'gallo pinto en la mañana', 'y en la tarde, un agüita.'],
  ['El Cadejos me siguió', 'desde la cantina a la casa;', 'yo pensé que era un perro…', '¡y era mi suegra con la masa!'],
  ['Me picó una hormiga bala', 'en la puntita de la nariz;', 'desde entonces, si estornudo,', 'se me sale el maíz.'],
  ['La Segua me guiñó un ojo', 'en la curva del camino;', 'yo salí corriendo tanto', 'que llegué a otro destino.'],
  ['En la mina de Abangares', 'buscaba oro mi tatita;', 'no encontró ni una pepita', 'pero sí una novia bonita.'],
  ['Cuando la luna se pone roja', 'hasta el perro se esconde;', 'y el marido llega tarde', 'y nadie sabe de dónde.'],
  ['Tengo un carro tan viejo', 'que lo empujan los vecinos;', 'cuando por fin arranca', 'ya se acabaron los caminos.'],
  ['Fui a pescar mar adentro', 'un pez vela grandotote;', 'le tomé la foto y lo solté…', 'y ahora me sigue el bote.'],
  ['Pedí permiso en la muni', 'para pintar el portón;', 'me lo dieron tan ligero', 'que ya es otra generación.'],
  ['El sabanero de Guanacaste', 'tiene un caballo tan fino', 'que lo invitan a las bodas', 'y el sabanero va de padrino.'],
  ['Mi tía cocina tan rico', 'que hasta la Llorona vino;', 'se comió tres tamales', 'y se fue cantando en el camino.'],
  ['Le dije al Toro Guaco', 'que se fuera a otro potrero;', 'me contestó con el cacho', 'y ahora duermo en el ropero.'],
  ['Me fui a ver los chapulines', 'que se comían el maizal;', 'les pegué con una lata', 'y salieron en carnaval.'],
  ['Me revolcó el tsunami', 'cuando estaba en la playita;', 'salí con un pulpo en la oreja', 'y en la boca una conchita.'],
  ['Aquí se acaba mi bomba', 'con permiso de la plaza:', 'el que no aplauda fuerte', '¡que se vaya pa\' su casa!'],
];
const RESPUESTAS = ['¡Uepaaa!', '¡Otra, otra!', '¡Esa sí estuvo buena!', '¡Ay, qué ocurrencia!', '¡Jajaja, qué bárbaro!', '¡Bombaaa!', '¡Eso, eso!'];

const vecinosCerca = (g, r) => { const p = g.player.body.pos; return g.entities.mobs.filter((m) => m.type === 'vecino' && !m.dead && !m.dying && Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < r); };
// cada cuadro
export function tickBombas(g, dt) {
  const B = g.bomba;
  if (B) {
    if (B.m.dead) { g.bomba = null; return; }
    B.t -= dt;
    if (B.t > 0) return;
    B.t = 2.5;
    const L = BOMBAS[B.n];
    if (B.i === 0) {
      decir(g, B.m, '¡BOMBA!', 2.2);
      g.audio.play('silbido', { pos: B.m.soundPos(), vol: 0.6 });
      for (const o of vecinosCerca(g, 18).filter((o) => o !== B.m).slice(0, 2)) decir(g, o, '¡Bomba!', 1.8);
    } else if (B.i <= 4) decir(g, B.m, L[B.i - 1], 2.8);
    else {
      for (const o of vecinosCerca(g, 18).filter((o) => o !== B.m).slice(0, 3)) decir(g, o, RESPUESTAS[Math.floor(Math.random() * RESPUESTAS.length)], 2.4);
      g.audio.play('aplausos', { ui: true, vol: 0.55 });
      g.ui.toast(`🎉 «${L.join(' / ')}»`, 6500);
      const M = g.meta, oidas = (M.bombas ||= []);
      if (!oidas.includes(B.n)) oidas.push(B.n);
      g.achieve('bomba', '¡Bomba!');
      if (oidas.length >= 10) g.achieve('bombas10', 'Diez bombas oídas en las fiestas');
      if (oidas.length >= BOMBAS.length) g.achieve('bombas_todas', 'Me sé todas las bombas');
      g.bomba = null;
      return;
    }
    B.i++;
    return;
  }
  // ¿alguien grita bomba? (día de fiesta, cerca de la plaza, con gente alrededor)
  g.bombaT = (g.bombaT ?? 20) - dt;
  if (g.bombaT > 0) return;
  g.bombaT = 45 + Math.random() * 40;
  if (g.dim !== 'tierra' || !fiestaHoy(g) || !g.player.alive) return;
  const p = g.player.body.pos, v = g.nearestVillage && g.nearestVillage(p.x, p.z);
  if (!v || v.dist > 45) return;
  const cerca = vecinosCerca(g, 16);
  if (!cerca.length) return;
  const m = cerca[Math.floor(Math.random() * cerca.length)];
  // primero las que no ha oído
  const oidas = (g.meta && g.meta.bombas) || [], nuevas = BOMBAS.map((_, i) => i).filter((i) => !oidas.includes(i));
  const pool = nuevas.length && Math.random() < 0.75 ? nuevas : BOMBAS.map((_, i) => i);
  g.bomba = { m, n: pool[Math.floor(Math.random() * pool.length)], i: 0, t: 0 };
}
export const limpiarBombas = (g) => { g.bomba = null; };
export function pruebaBomba(g) {
  const cerca = vecinosCerca(g, 30);
  if (!cerca.length) return 'No hay vecinos cerca: pruébelo en un pueblo';
  g.bomba = { m: cerca[0], n: Math.floor(Math.random() * BOMBAS.length), i: 0, t: 0 };
  return 'Un vecino va a echar una bomba';
}
