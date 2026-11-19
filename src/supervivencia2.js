// Más supervivencia: la sed (barra de agua), la fogata, las hierbas medicinales del monte y los temblores.
import { ventaja } from './progreso.js';
import { BLOCK_BY_KEY as K, FLUID, SOLID, BLOCKS } from './blocks.js';
import { difOf } from './supervivencia.js';
import { gainSkill, mult } from './habilidades.js';
import { empezarBeber } from './cuerpo.js';

export const CANTIMPLORA_VACIA = 426, CANTIMPLORA = 427;
export const HIERBAS = { 428: 'sabila', 429: 'manzanilla', 430: 'hierbabuena', 431: 'jengibre', 524: 'guaco' };
// cuánta agua da cada cosa que se toma (además de la comida que ya da)
export const AGUA = { 574: 4, 449: 10, 382: 8, 299: 6, 298: 3, 292: 5, 290: 10, 375: -2, 381: 4, 383: 3, 366: 3, 417: 4, 421: 3, 377: 2, 276: 2, 275: 1 };

// ---------- la sed ----------
export function tickSed(g, dt) {
  const p = g.player;
  if (g.mode !== 'survival' || !p.alive) return;
  if (p.water === undefined) p.water = 20;
  const dif = difOf(g);
  const col = g.dim === 'tierra' ? g.world.gen.column(Math.floor(p.body.pos.x), Math.floor(p.body.pos.z)) : null;
  // calor: en el bosque seco, la playa o el desierto bajo el sol de verdad da más sed (y el inframundo, ni se diga).
  // v11.9.1: el sol cuenta solo a cielo abierto, de día y sin lluvia; bajo techo no, y a la sombra de un árbol, a medias
  const sol = col && ['bosque_seco', 'beach', 'desert', 'guanacaste'].includes(col.biome) ? exposicionSol(g) : 0;
  const calor = (g.dim === 'inframundo' ? 2 : 1 + 0.6 * sol) * (g.sequia && col && col.biome === 'bosque_seco' && sol > 0 ? 1.3 : 1) * (p.effects.calor ? 1.4 : 1); // v12.3.0: con calor, la sed ×1.4
  const moving = Math.hypot(p.body.vel.x, p.body.vel.z) > 0.5;
  p.thirstT = (p.thirstT || 0) + dt * (p.sprinting ? 2.4 : moving ? 1.0 : 0.7) * calor * (dif.hunger * 0.9) * mult.gasto(g) * ventaja.sed(g) * (g.day <= 1 ? 0.5 : 1); // v13.5.8 (PU-16): el primer día, sed a la mitad
  if (p.thirstT >= 38) { p.thirstT = 0; p.water = Math.max(0, p.water - 1); }
  if (p.water <= 4 && !g.toldSed) { g.toldSed = true; g.ui.toast('💧 Tiene sed: tome agua (un río, una pipa, la cantimplora)', 2600); }
  if (p.water > 8) g.toldSed = false;
  if (p.water <= 0) {
    p.dryT = (p.dryT || 0) + dt;
    if (p.dryT >= 5) { p.dryT = 0; if (dif.starveKills || p.health > 1) g.damagePlayer(1, null, null, 'Se deshidrató', true); }
  }
  // insolación: se va juntando al sol (sin sombrero y con poca agua) y baja rápido a la sombra. Sale a los 90 s de sol
  // seguidos, y después de una hay que juntar otros 90: antes era un dado cada segundo, y salía a cada rato aunque uno anduviera
  // encerrado en la casa
  const expuesto = g.dim === 'tierra' && sol > 0.6 && !g.inventory.armor[0] && p.water < 10;
  g.solT = Math.max(0, (g.solT || 0) + dt * (expuesto ? sol : -3));
  if (g.solT >= 90) {
    g.solT = 0;
    g.addEffect('mareo', 8);
    g.ui.toast('🥵 ¡Qué sol! Una insolación: póngase un sombrero, tome agua o busque sombra', 2800);
  }
}

// cuánto le pega el sol (0 a 1): de día, sin techo encima y sin lluvia; bajo hojas, a medias
export function exposicionSol(g) {
  if (g.dim !== 'tierra') return 0;
  const t = g.time || 0;
  if (t < 0.22 || t > 0.42) return 0; // mañana y tarde fuertes; ni de madrugada ni al caer la tarde
  if (g.weather && g.weather.type !== 'clear' && g.weather.intensity > 0.3) return 0.2;
  const q = g.player.body.pos, x = Math.floor(q.x), z = Math.floor(q.z);
  let hojas = false;
  for (let y = Math.floor(q.y) + 2; y < Math.floor(q.y) + 26; y++) { const id = g.world.getBlock(x, y, z); if (!id) continue; if (BLOCKS[id].leafy) { hojas = true; continue; } if (SOLID[id]) return 0; }
  return hojas ? 0.5 : 1;
}

// tomar agua: de un ítem (pipa, agua dulce…) o directo del río/lago (con la mano vacía o la cantimplora)
export function beber(g, cuanto) {
  const p = g.player;
  p.water = Math.max(0, Math.min(20, (p.water ?? 20) + cuanto));
  g.audio.play('sorbo', { ui: true, vol: 0.5 });
}
export function beberDelRio(g, t, held) {
  if (!t || !FLUID[t.id] || t.id === K.lava) return false;
  if (held && held.id === CANTIMPLORA_VACIA) {
    const limpia = t.id === K.agua_celeste;
    g.inventory.slots[g.inventory.selected] = { id: CANTIMPLORA, count: 1, dur: 4, ...(limpia ? {} : { cruda: true }) }; // del río: sin hervir
    g.inventory.changed();
    g.audio.play('splash', { ui: true, vol: 0.4, pitch: 1.4 });
    g.ui.toast(limpia ? '💧 Cantimplora llena de agua limpia (4 tragos)' : '💧 Cantimplora llena (sin hervir: en la fogata, clic derecho la hierve)', 2600, { cat: 'consejo', clave: 'cantimplora:llena' });
    return true;
  }
  if (held) return false;
  if (g.mode !== 'survival') return false;
  empezarBeber(g, () => beber(g, 1)); // v12.2.0: tres tragos con las manos (cuerpo.js)
  // el agua sin hervir a veces cae mal (la del río Celeste y la del páramo son limpias)
  if (t.id !== K.agua_celeste && Math.random() < 0.25) { g.addEffect('panza', 25); g.ui.toast('🤢 Esa agua no estaba muy limpia… mejor hervirla o usar la cantimplora llena en la fogata', 2600); }
  return true;
}
export function tomarCantimplora(g) {
  const s = g.inventory.held;
  beber(g, 6);
  // sin hervir, a veces cae mal (como el agua del río)
  if (s.cruda && g.mode === 'survival' && Math.random() < 0.25) { g.addEffect('panza', 25); g.ui.toast('🤢 Esa agua no estaba hervida: la próxima vez, la cantimplora a la fogata (clic derecho)', 2600, { cat: 'consejo', clave: 'cantimplora:panza' }); }
  s.dur = (s.dur ?? 4) - 1;
  if (s.dur <= 0) g.inventory.slots[g.inventory.selected] = { id: CANTIMPLORA_VACIA, count: 1 };
  g.inventory.changed();
}

// ---------- hierbas del monte: salen al cortar matorrales y helechos ----------
export function hierbaDeMatorral(g, b) {
  if (g.mode !== 'survival' || Math.random() > 0.08) return null;
  const col = g.world.gen.column(Math.floor(b.x), Math.floor(b.z));
  const pool = col.biome === 'bosque_seco' || col.biome === 'beach' ? [428, 428, 431] : col.biome === 'nuboso' || col.biome === 'paramo' ? [429, 430, 431] : col.biome === 'jungle' || col.biome === 'manglar' ? [524, 524, 428, 430] : [428, 429, 430, 431, 524];
  return pool[Math.floor(Math.random() * pool.length)];
}
export function usarHierba(g, id) {
  const fx = g.player.effects;
  if (id === 428) { delete fx.ignifugo; delete fx.ardor; g.player.health = Math.min(g.player.maxHealth, g.player.health + 4); g.ui.toast('🌵 Sábila: alivia las quemaduras y cura un poco', 2000); }
  if (id === 429) { delete fx.panza; delete fx.mareo; g.ui.toast('🌼 Té de manzanilla: se le quitó el dolor de panza', 2000); }
  if (id === 430) { g.addEffect('calma', 180); delete fx.miedo; g.ui.toast('🌿 Hierbabuena: calma (menos hambre) y se le quita el miedo', 2000); }
  if (id === 524) { delete fx.veneno; delete fx.paralisis; const n = g.player.necrosis || 0; g.player.necrosis = 0; g.meta.necrosis = 0; g.ui.toast(n ? '🌿 Guaco: la herida dejó de pudrirse y vuelve su vida de siempre' : '🌿 Guaco: el remedio de la selva contra las culebras', 2400); }
  if (id === 431) { delete fx.escalofrio; g.frio = 0; g.addEffect('termal', 60); g.ui.toast('🫚 Jengibre: calienta el cuerpo por un minuto', 2000); }
  g.achieve('hierbas', 'Remedios de la abuela');
}

// ---------- la fogata: luz, calor, espanta zancudos y cocina lo crudo ----------
const CRUDO_A_COCIDO = { 262: 265, 361: 365, 362: 365, 363: 365, 364: 365, 268: 270, 1105: 365, 1106: 365, 1107: 365, 1108: 365, 1109: 365, 1110: 365, 1111: 365, 1112: 365 }; // v12.7.0
export function cocinarEnFogata(g, t, held) {
  // hervir el agua de la cantimplora: queda limpia
  if (held && held.id === CANTIMPLORA && held.cruda) {
    delete held.cruda; g.inventory.changed();
    g.audio.play('freir', { pos: { x: t.x + 0.5, y: t.y + 0.5, z: t.z + 0.5 }, vol: 0.4, pitch: 1.4 });
    for (let i = 0; i < 10; i++) g.particles.spawn(t.x + 0.5 + (Math.random() - 0.5) * 0.4, t.y + 1 + Math.random() * 0.3, t.z + 0.5 + (Math.random() - 0.5) * 0.4, [0.92, 0.94, 0.98], (Math.random() - 0.5) * 0.3, 1.2, (Math.random() - 0.5) * 0.3, 1, -0.5);
    g.ui.toast('♨ Agua hervida: ya se puede tomar sin miedo', 2000, 'importante');
    g.achieve('hervir', 'Agua hervida, como manda la abuela');
    return;
  }
  if (!held || !CRUDO_A_COCIDO[held.id]) { g.ui.toast('🔥 La fogata calienta y espanta zancudos. Con carne cruda en la mano: clic derecho', 2400); return; }
  const out = CRUDO_A_COCIDO[held.id];
  g.inventory.consumeHeld(1);
  g.entities.dropItem(out, 1, t.x + 0.5, t.y + 1.1, t.z + 0.5, { x: 0, y: 2.5, z: 0 }, 0.6);
  g.audio.play('freir', { pos: { x: t.x + 0.5, y: t.y + 0.5, z: t.z + 0.5 }, vol: 0.7 });
  g.particles.burst(t.x + 0.5, t.y + 0.8, t.z + 0.5, [[1, 0.6, 0.2], [0.5, 0.5, 0.5]], 10, 1.2);
  g.achieve('fogata', 'Asado a la leña');
  gainSkill(g, 'cocina', 3);
}
export function fogataCerca(g, x, y, z, r = 6) {
  const w = g.world;
  for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) for (let dy = -2; dy <= 2; dy++) { const b = w.getBlock(Math.floor(x) + dx, Math.floor(y) + dy, Math.floor(z) + dz); if (b === K.fogata || b === K.fogata_brasas) return true; }
  return false;
}
// humo y chispas de las fogatas cercanas (y su sonido)
export function tickFogatas(g) {
  const w = g.world, p = g.player.body.pos;
  let near = null;
  for (let k = 0; k < 40 && !near; k++) {
    const x = Math.floor(p.x) + Math.floor((Math.random() - 0.5) * 24), z = Math.floor(p.z) + Math.floor((Math.random() - 0.5) * 24);
    for (let dy = -4; dy <= 4; dy++) if (w.getBlock(x, Math.floor(p.y) + dy, z) === K.fogata) { near = { x: x + 0.5, y: Math.floor(p.y) + dy + 0.5, z: z + 0.5 }; break; }
  }
  if (near) { g.lastFogata = near; if (!(g.meta.fogatas && g.meta.fogatas[`${Math.floor(near.x)},${Math.floor(near.y)},${Math.floor(near.z)}`])) (g.meta.fogatas ||= {})[`${Math.floor(near.x)},${Math.floor(near.y)},${Math.floor(near.z)}`] = { lena: 6, t: 0, encendida: (g.day || 1) + g.time }; } // v12.1.0: las fogatas viejas se registran con 6 leñas
  const f = g.lastFogata;
  if (f && w.getBlock(Math.floor(f.x), Math.floor(f.y), Math.floor(f.z)) !== K.fogata) g.lastFogata = null;
  const F = g.lastFogata;
  g.audio.setEmitter('fogata', 'loop.fire', F && Math.hypot(F.x - p.x, F.z - p.z) < 16 ? F : null, 0.6);
  if (F) for (let i = 0; i < 4; i++) g.particles.spawn(F.x + (Math.random() - 0.5) * 0.4, F.y + 0.6 + Math.random() * 0.4, F.z + (Math.random() - 0.5) * 0.4, i % 2 ? [1, 0.6, 0.15] : [0.55, 0.55, 0.58], (Math.random() - 0.5) * 0.3, 1.4, (Math.random() - 0.5) * 0.3, 1.2, -0.3, i % 2 === 1);
}

// ---------- temblores: de vez en cuando tiembla (esto es Costa Rica) ----------
export function tickTemblor(g, dt) {
  if (g.dim !== 'tierra') return;
  const T = g.temblor;
  if (!T) {
    g.proxTemblor = g.proxTemblor ?? (g.clock + 600 + Math.random() * 900);
    if (g.clock < g.proxTemblor) return;
    g.proxTemblor = g.clock + 900 + Math.random() * 1500;
    const mag = +(4.3 + Math.random() * 2.6).toFixed(1);
    g.temblor = { t: 3 + (mag - 4) * 2.2, mag, cayo: 0 };
    g.audio.play('rumble', { vol: Math.min(1, mag / 6) });
    g.ui.toast(`🌎 ¡Está temblando! Magnitud ${mag} según los sismólogos${mag >= 6 ? ' — ¡fuerte!' : ''}`, 3200);
    return;
  }
  T.t -= dt;
  g.shake = Math.max(g.shake || 0, Math.min(1.2, (T.mag - 3.8) * 0.35));
  // en una cueva caen piedras y polvo
  const p = g.player.body.pos;
  if (g.env && g.env.cave > 0.5 && Math.random() < dt * (T.mag - 4)) {
    g.particles.burst(p.x + (Math.random() - 0.5) * 4, p.y + 3, p.z + (Math.random() - 0.5) * 4, [[0.45, 0.42, 0.4], [0.6, 0.58, 0.55]], 8, 1);
    if (g.mode === 'survival' && T.mag >= 5.5 && Math.random() < 0.3) g.damagePlayer(1, null, null, 'Le cayó una piedra en el temblor', true);
  }
  if (T.t <= 0) {
    g.temblor = null;
    g.achieve('temblor', 'Sobreviví al temblor');
    g.temblorFin = T.mag; // tsunami.js decide si el mar se recoge
    const dichos = ['¡Diay, qué susto! ¿Usted lo sintió?', 'Mi abuela dice que ese fue más fuerte que el del 91.', 'Se cayó la imagen de la Negrita del estante…', '¡Uy, tembló! Ya hasta estamos acostumbrados.'];
    if ((g.envPueblo || 0) > 0.2) g.ui.toast(`🗣 Un vecino: «${dichos[Math.floor(Math.random() * dichos.length)]}»`, 3000);
  }
}
