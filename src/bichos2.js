// Bichos del monte húmedo, de los que no salen en las postales:
// · el tórsalo: la mosca deja un gusanito bajo la piel; se mueve, pica y no deja dormir. Se saca tapándolo con un pedazo de
//   chicharrón (el gusano sale a buscar aire) o con el botiquín.
// · la hormiga bala: la picada más dolorosa del monte. No mata, pero un buen rato no se puede correr y se pega más suave.
// · la bocaracá: la víbora amarilla de pestañas, que espera enroscada en las hojas y cae cuando uno pasa por debajo.
// Estado: efectos 'torsalo' y 'bala' (se guardan con el jugador); la bocaracá es un mob.
import { atacar } from './golpes.js';
import { armarBocaraca } from './modelos-alimanas.js';
import { SOLID, BLOCKS, ITEMS } from './blocks.js';
import { difOf } from './supervivencia.js';

export const CHICHARRON = 397;
const humedo = (g) => g.env && ['jungle', 'nuboso', 'manglar'].includes(g.env.biome);
const potrero = (g) => g.env && ['plains', 'jungle', 'forest', 'nuboso'].includes(g.env.biome);
const deDia = (g) => g.daylight > 0.45;

// ---------- cada segundo ----------
export function tickBichos2(g) {
  const P = g.player, fx = P.effects, b = P.body;
  if (g.mode !== 'survival' || !P.alive || g.dim !== 'tierra') return;
  const bravo = difOf(g).hostiles; // en Tranquilo no hay bichos que piquen
  const camina = Math.hypot(b.vel.x, b.vel.z) > 1 && !g.riding;
  // ---- tórsalo ----
  if (fx.torsalo) {
    const M = g.meta; // no se va solo: tickEffects no lo descuenta (ver PERMANENTES en game.js)
    if (M.torsaloSale) { // tapado con chicharrón: el gusano sale a buscar aire
      M.torsaloSale -= 1;
      if (M.torsaloSale <= 0) { delete fx.torsalo; delete M.torsaloSale; g.ui.toast('🪱 ¡Salió el gusano del tórsalo! Qué asco… y qué alivio', 3000); g.achieve('torsalo', 'Me saqué un tórsalo'); }
    } else {
      g.torsaloT = (g.torsaloT || 0) + 1;
      if (g.torsaloT >= 40) {
        g.torsaloT = 0;
        g.ui.hurtFlash && g.ui.hurtFlash();
        if (P.health > 4) g.damagePlayer(0.5, null, null, 'El tórsalo', true, false);
        const dichos = ['🪱 Algo se le mueve debajo de la piel del brazo…', '🪱 ¡Le picó el tórsalo por dentro! Tápelo con chicharrón (clic derecho) o use el botiquín', '🪱 El tórsalo no le deja tranquilo'];
        g.ui.toast(dichos[Math.floor(Math.random() * dichos.length)], 2600);
      }
    }
  } else if (bravo && camina && potrero(g) && deDia(g) && !fx.repelente && (g.day || 1) >= 2 && Math.random() < 1 / 700) {
    g.addEffect('torsalo', 5);
    g.audio.play('loop.zancudo', { ui: true, vol: 0.35, pitch: 0.7 });
    g.ui.toast('🪰 Una mosca grande se le paró en el brazo y le dejó un piquetito… (eso es tórsalo)', 3600);
  }
  // ---- hormiga bala ----
  if (bravo && !fx.bala && camina && humedo(g) && !g.player.sneaking && Math.random() < 1 / 600) {
    const pos = b.pos;
    g.particles.burst(pos.x, pos.y + 0.2, pos.z, [[0.08, 0.05, 0.03], [0.25, 0.12, 0.05]], 10, 0.6);
    g.damagePlayer(3, null, null, 'Picada de hormiga bala', true, false);
    g.addEffect('bala', 240);
    g.shake = Math.max(g.shake || 0, 0.6);
    g.ui.toast('🐜 ¡Ay! Hormiga bala: un buen rato sin correr y pegando más suave', 4200);
    g.achieve('hormiga_bala', 'La picada de la hormiga bala');
  }
  if (fx.bala && Math.random() < 1 / 15) { g.shake = Math.max(g.shake || 0, 0.25); if (g.ui.hurtFlash) g.ui.hurtFlash(); } // las punzadas
  // ---- bocaracá: cae de las hojas ----
  if (bravo && g.settings.hostiles && camina && humedo(g) && Math.random() < 1 / 400) quizaBocaraca(g);
}
function quizaBocaraca(g) {
  const p = g.player.body.pos, w = g.world, x = Math.floor(p.x), z = Math.floor(p.z), y0 = Math.floor(p.y) + 2;
  for (let y = y0; y < y0 + 6; y++) {
    const id = w.getBlock(x, y, z);
    if (!SOLID[id]) continue;
    if (!BLOCKS[id].leafy) return;
    if (g.entities.mobs.some((m) => m.type === 'bocaraca' && !m.dead)) return;
    const m = g.entities.spawnMob('bocaraca', p.x + (Math.random() - 0.5) * 0.4, y - 0.4, p.z + (Math.random() - 0.5) * 0.4);
    if (m) { m.data.cayendo = true; m.body.onGround = false; g.audio.play('dig.leaves', { pos: { x: p.x, y, z: p.z }, vol: 0.9 }); g.particles.burst(p.x, y, p.z, [[0.3, 0.55, 0.2]], 8, 1); }
    return;
  }
}
// clic derecho con chicharrón teniendo tórsalo: se tapa el piquete (en vez de comérselo)
export function taparTorsalo(g, id) {
  const fx = g.player.effects, M = g.meta;
  if (id !== CHICHARRON || !fx.torsalo || M.torsaloSale) return false;
  M.torsaloSale = 25;
  g.inventory.consumeHeld(1);
  g.ui.toast('🥓 Piquete tapado con chicharrón: espere a que el gusano salga', 3600);
  return true;
}
// el botiquín también lo saca
export function curaBichos(g) { const fx = g.player.effects; delete fx.torsalo; delete g.meta.torsaloSale; delete fx.bala; }

// ---------- la bocaracá ----------
export const BICHOS2 = {
  bocaraca: {
    name: 'Bocaracá', w: 0.4, h: 0.25, health: 7, speed: 1.2, noJump: true, hurtSound: 'serpiente', idleSound: 'serpiente', idleEvery: [12, 24],
    particle: [[0.9, 0.75, 0.2]], drops: [], xp: 4,
    build() { return armarBocaraca(); },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c;
      const D = m.data, b = m.body;
      D.apuro = true;
      D.vida = (D.vida || 0) + dt;
      if (D.vida > 90 && distP > 16) { m.dead = true; return true; } // se vuelve a subir al monte
      // al caer encima de uno: mordida segura
      if (D.cayendo) {
        if (b.onGround) {
          D.cayendo = false;
          if (distP < 1.4 && g.mode === 'survival' && g.player.alive) { morder(g, m, true); m.attackCd = 2.5; }
        }
        return true;
      }
      if (distP < 2.4 && !g.player.sneaking && g.mode === 'survival' && g.player.alive && Math.abs(pl.y - b.pos.y) < 1.5) {
        m.targetYaw = Math.atan2(dxp, dzp);
        m.moving = false;
        if (m.attackCd <= 0) atacar(m, g, { tipo: 'latigazo', prep: 0.4, alcance: 1.4, cd: 2.4, alGolpe: (llego) => { if (llego) morder(g, m, false); } });
        return true;
      }
      return false;
    },
    animate(m, dt, u) {
      m.data.strike = Math.max(0, (m.data.strike || 0) - dt);
      const amp = m.moving ? 0.07 : 0.02;
      u.segs.forEach((s, i) => { s.position.x = Math.sin(m.t * 6 - i * 0.9) * amp * (1 + i * 0.3); });
      u.head.position.z = 0.44 + m.data.strike * 0.6;
      if (m.data.cayendo) u.body.rotation.z += dt * 9; else u.body.rotation.z = 0;
    },
  },
};
function morder(g, m, encima) {
  m.data.strike = 0.35;
  g.audio.play('serpiente', { pos: m.soundPos(), vol: 1 });
  g.damagePlayer(3, m.body.pos.x, m.body.pos.z, 'Mordida de bocaracá', false, true);
  const bota = g.inventory.armor[3], casco = g.inventory.armor[0];
  if (!encima && bota && ITEMS[bota.id] && ITEMS[bota.id].antiCulebra) { g.ui.toast('🥾 Las botas aguantaron el colmillo: sin veneno', 2000); return; }
  if (encima && casco) { g.ui.toast('⛑ ¡Le cayó una bocaracá en la cabeza! El casco aguantó la mordida', 2600); return; }
  g.addEffect('veneno', 10);
  const P = g.player; P.necrosis = Math.min(4, (P.necrosis || 0) + 1); g.meta.necrosis = P.necrosis; P.health = Math.min(P.health, P.maxHealth);
  g.ui.toast(encima ? '🐍 ¡Le cayó una bocaracá encima desde las hojas! Veneno: suero antiofídico o guaco' : '🐍 ¡Mordida de bocaracá! Veneno: suero antiofídico o guaco', 3600);
  g.achieve('bocaraca', 'La bocaracá de las hojas');
}
export function pruebaBichos2(g, que) {
  if (que === 'torsalo') { g.addEffect('torsalo', 5); g.torsaloT = 35; return 'Tiene un tórsalo: tápelo con chicharrón (clic derecho) o use el botiquín'; }
  if (que === 'bala') { g.addEffect('bala', 240); return 'Picada de hormiga bala: un rato sin correr y pegando suave'; }
  const p = g.player.body.pos, m = g.entities.spawnMob('bocaraca', p.x, p.y + 5, p.z);
  if (m) { m.data.cayendo = true; m.body.onGround = false; }
  return 'Una bocaracá cae de arriba, encima de usted (un casco la aguanta)';
}
