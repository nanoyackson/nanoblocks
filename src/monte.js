// Vivir del monte: lo que uno deja armado y trabaja solo mientras tanto. La trampa de lazo agarra animalitos, la nasa saca
// pescado del río, el barril junta agua limpia cuando llueve y las estacas lastiman a lo que venga a la casa. También la
// fiebre que pegan los zancudos, con su remedio. Trampas y nasas guardan lo atrapado adentro (se abren como un cofre).
import { BLOCKS, BLOCK_BY_KEY as K, AIR } from './blocks.js';
import { beber } from './supervivencia2.js';
import { difOf } from './supervivencia.js';
import { NASA, MAX_NASAS, zonaNasa } from './pesca.js';

const CUPO = 6; // lo que le cabe antes de dejar de atrapar
const MEDIA = { trampa: 260, nasa: 300 }; // segundos, en promedio, entre una presa y otra
const PRESA = {
  trampa: [[262, 1, 0.42], [271, 1, 0.33], [287, 1, 0.13], [256, 2, 0.12]],
  nasa: [[361, 1, 0.34], [362, 1, 0.3], [363, 1, 0.28], [368, 1, 0.08]],
};
const CANTIMPLORA_VACIA = 426, CANTIMPLORA = 427;

// ---------- el registro de lo que está puesto ----------
export function registrarMonte(g, tipo, x, y, z) {
  if (!Array.isArray(g.meta.monte)) g.meta.monte = [];
  const L = (g.meta.monte = g.meta.monte.filter((q) => q && typeof q === 'object' && Number.isFinite(q.x) && Number.isFinite(q.z))); // v12.8.3: de un mundo importado
  if (tipo === 'nasa') { // v12.7.2 (C5-A2): la zona decide qué saca, y a lo sumo 6 nasas (las de antes siguen andando)
    if (L.filter((q) => q.tipo === 'nasa').length >= MAX_NASAS) { g.ui.toast(`🐟 Ya tiene ${MAX_NASAS} nasas puestas: recoja una antes de poner otra`, 2800); return false; } // v12.8.3: la llamada la quita
    const zona = zonaNasa(g, x, y, z);
    L.push({ x, y, z, tipo, zona });
    g.ui.toast(zona === 'arrecife' ? '🦞 Nasa en el arrecife: camarón, ostión y, de vez en cuando, langosta' : zona === 'estero' ? '🦐 Nasa en el estero: camarón y róbalo' : zona === 'orilla' ? '🐟 Nasa en el mar: pargo, corvina y camarón' : '🐟 Nasa de río: guapote, machaca y tilapia', 2400);
    return true;
  }
  L.push({ x, y, z, tipo });
  return true;
}
function sorteo(tabla) {
  let r = Math.random();
  for (const fila of tabla) { r -= fila[2]; if (r <= 0) return fila; }
  return tabla[0];
}
function sirve(g, q) {
  const w = g.world;
  if (!w.isLoaded(q.x, q.z)) return true; // lejos sigue trabajando con lo último que se sabía
  if (q.tipo === 'trampa') { const b = w.getBlock(q.x, q.y - 1, q.z); return b === K.grass || b === K.dirt || b === K.snow_grass; }
  let agua = 0;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (BLOCKS[w.getBlock(q.x + dx, q.y, q.z + dz)].key === 'water') agua++;
  return agua >= 2;
}

// cada segundo
export function tickMonte(g) {
  if (g.mode !== 'survival' || g.dim !== 'tierra') return;
  const L = Array.isArray(g.meta.monte) ? (g.meta.monte = g.meta.monte.filter((q) => q && typeof q === 'object')) : null; // v12.8.3: de un mundo importado
  if (L && L.length) {
    const w = g.world, p = g.player.body.pos;
    for (let i = L.length - 1; i >= 0; i--) {
      const q = L[i], be = w.getBE(q.x, q.y, q.z);
      // lo quitaron (o el mundo ya no lo tiene): se olvida
      if (w.isLoaded(q.x, q.z) && w.getBlock(q.x, q.y, q.z) !== K[q.tipo]) { if (be && be.type === q.tipo) w.setBE(q.x, q.y, q.z, null); L.splice(i, 1); continue; }
      if (!be || be.type !== q.tipo) continue;
      if (q.tipo === 'barril') {
        const moja = g.weather && g.weather.intensity > 0.3 && !g.cold && (!w.isLoaded(q.x, q.z) || g.weather.top(q.x, q.z) <= q.y);
        if (moja && (be.agua || 0) < 8 && Math.random() < (g.season === 'invierno' ? 1 / 10 : 1 / 20)) { be.agua = (be.agua || 0) + 1; w.touchBE(q.x, q.y, q.z); } // v12.4.6: en invierno, el doble
        if (g.season === 'verano' && be.agua > 0 && be.secoDia !== g.day) { if (be.secoDia !== undefined) be.agua--; be.secoDia = g.day; w.touchBE(q.x, q.y, q.z); } // v12.4.6: en verano se evapora 1 por día
        continue;
      }
      const Z = q.tipo === 'nasa' && NASA[q.zona] ? NASA[q.zona] : null; // v12.7.2: la tabla de la zona (sin zona, la de siempre)
      if (Math.random() > (g.meta.cuaderno && g.meta.cuaderno.trampas ? 1.25 : 1) / (Z ? Z.media : MEDIA[q.tipo])) continue;
      if (be.slots.reduce((n, s) => n + (s ? s.count : 0), 0) >= CUPO || !sirve(g, q)) continue;
      const [id, n] = sorteo(Z ? Z.presa : PRESA[q.tipo]);
      const hueco = be.slots.findIndex((s) => s && s.id === id);
      if (hueco >= 0) be.slots[hueco].count += n; else be.slots[be.slots.findIndex((s) => !s)] = { id, count: n };
      w.touchBE(q.x, q.y, q.z);
      if (Math.hypot(q.x - p.x, q.z - p.z) < 40) g.ui.toast(q.tipo === 'trampa' ? '🌿 Algo cayó en la trampa' : '🐟 Algo cayó en la nasa', 1800);
      g.achieve(q.tipo === 'trampa' ? 'trampa' : 'nasa', q.tipo === 'trampa' ? 'Cayó en la trampa' : 'La nasa trabaja sola');
    }
  }
  tickEstacas(g);
}

// ---------- las estacas: al que las pisa le duelen (al jugador no: uno sabe dónde las puso) ----------
function tickEstacas(g) {
  const w = g.world, p = g.player.body.pos;
  for (const m of g.entities.mobs) {
    if (m.dead || m.dying || !(m.kind.hostile || m.kind.legend) || m.kind.flying || m.data.comensalFn) continue;
    if (Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) > 48) continue;
    const x = Math.floor(m.body.pos.x), y = Math.floor(m.body.pos.y + 0.1), z = Math.floor(m.body.pos.z);
    if (w.getBlock(x, y, z) !== K.estacas) continue;
    m.hurt(4, x + 0.5, z + 0.5);
    g.particles.burst(x + 0.5, y + 0.5, z + 0.5, [[0.45, 0.32, 0.2], [0.7, 0.1, 0.1]], 8, 1.4);
    g.achieve('estacas', 'Que venga el que quiera');
    if (Math.random() < 0.2) { w.setBlock(x, y, z, AIR); g.audio.material('wood', 'dig', { x: x + 0.5, y: y + 0.5, z: z + 0.5 }); }
  }
}

// ---------- el barril de lluvia ----------
export function barrilInteract(g, x, y, z) {
  const be = g.world.getBE(x, y, z);
  if (!be) return;
  const held = g.inventory.held;
  if (!(be.agua > 0)) { g.ui.toast('🛢️ El barril está seco. Junta agua cuando llueve (déjelo sin techo)', 2400); return; }
  if (held && held.id === CANTIMPLORA_VACIA) {
    be.agua--; g.world.touchBE(x, y, z);
    g.inventory.slots[g.inventory.selected] = { id: CANTIMPLORA, count: 1, dur: 4 };
    g.inventory.changed();
    g.audio.play('balde', { pos: { x: x + 0.5, y: y + 1, z: z + 0.5 }, vol: 0.5 });
    g.ui.toast(`🛢️ Llenó la cantimplora (quedan ${be.agua}/8)`, 1600);
    return;
  }
  if (held) { g.ui.toast(`🛢️ Barril: ${be.agua}/8. Tome con la mano vacía o llene la cantimplora`, 2000); return; }
  be.agua--; g.world.touchBE(x, y, z);
  beber(g, 6);
  g.audio.play('sorbo', { ui: true, vol: 0.5 });
  g.achieve('barril', 'Agua del cielo');
}

// ---------- la fiebre: a veces un zancudo la pega; quita la regeneración y las fuerzas hasta que se cure ----------
export function quizaFiebre(g) {
  if (g.mode !== 'survival' || !difOf(g).hostiles || g.player.effects.fiebre) return;
  if (Math.random() > ((g.meta.dificultad || 'normal') === 'dificil' ? 0.06 : 0.03)) return;
  g.addEffect('fiebre', 300);
  g.ui.toast('🤒 Fiebre de zancudo: no se cura ni tiene fuerza. Suero, botiquín o dormir', 4600);
  g.achieve('fiebre', 'Me dio fiebre de zancudo');
}
