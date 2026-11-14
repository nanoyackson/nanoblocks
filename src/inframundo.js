// Inframundo Volcánico: criaturas (ceniciento, zopilote de fuego), aparición, y el portal de obsidiana
// que se enciende con la Llave del volcán. El viaje entre dimensiones lo hace game.switchDim.
import { armarCeniciento, armarZopiloteFuego, armarSenorArenal } from './modelos-volcan.js';
import { BLOCKS, BLOCK_BY_KEY as K, SOLID, AIR } from './blocks.js';
import { LavaBomb } from './volcanes.js';
import { avisoCaida } from './golpes.js';

export const KEY_ITEM = 378;

// ---------- criaturas ----------

const CENICIENTO = {
  name: 'Ceniciento', w: 0.7, h: 1.9, health: 22, speed: 1.9, hostile: true, attack: 4, xp: 8,
  hurtSound: 'monstruo', idleSound: 'monstruo', idleEvery: [6, 14], particle: [[0.25, 0.24, 0.22], [1, 0.5, 0.1]], drops: [[141, 1, 2], [379, 0, 2]],
  build() { return armarCeniciento(); },
  animate(m, dt, u) {
    // brazos al frente, como zombi de ceniza; suelta chispas
    u.arms.forEach((a, i) => { a.rotation.x = -1.2 + Math.sin(m.t * 3 + i) * 0.15; });
    if (Math.random() < dt * 4) m.game.particles.spawn(m.body.pos.x + (Math.random() - 0.5) * 0.5, m.body.pos.y + 1 + Math.random(), m.body.pos.z + (Math.random() - 0.5) * 0.5, [1, 0.55, 0.15], 0, 1, 0, 0.8, -1, true);
  },
};

const ZOPILOTE = {
  name: 'Zopilote de fuego', w: 0.7, h: 0.6, health: 12, speed: 6, flying: true, flyHigh: false, xp: 6,
  hurtSound: 'aleteo', idleSound: null, particle: [[0.1, 0.08, 0.08], [1, 0.45, 0.1]], drops: [[379, 0, 1]],
  build() { return armarZopiloteFuego(); },
  // se lanza en picada contra el jugador
  flyGoal(m, g) {
    const pl = g.player.body.pos, b = m.body.pos;
    const d = Math.hypot(pl.x - b.x, pl.y + 1 - b.y, pl.z - b.z);
    if (g.mode !== 'survival' || !g.player.alive || d > 22) return null;
    if (Math.random() < 0.02) g.particles.spawn(b.x, b.y, b.z, [1, 0.5, 0.1], 0, -0.5, 0, 0.7, 2, true);
    if (d < 1.6 && (g.clock || 0) > (m.data.cd || 0)) {
      m.data.cd = (g.clock || 0) + 3.5;
      g.damagePlayer(2, b.x, b.z, 'Picotazo de zopilote de fuego', false, true);
      // se aleja después del picotazo
      m.data.away = (g.clock || 0) + 3;
    }
    if ((g.clock || 0) < (m.data.away || 0)) return { x: b.x + (b.x - pl.x) * 2, y: pl.y + 6, z: b.z + (b.z - pl.z) * 2 };
    return { x: pl.x, y: pl.y + 1.2, z: pl.z };
  },
};

// ---------- jefe: El Señor del Arenal ----------
// Un gigante de basalto con grietas de lava y corona de picos. Tira bombas de lava apuntadas, golpea el suelo con
// una onda de fuego y camina lento pero pega duro. Aparece de vez en cuando en lo hondo del inframundo.
const SENOR = {
  name: 'El Señor del Arenal', w: 1.5, h: 3.4, health: 320, speed: 1.5, hostile: true, attack: 7, xp: 150, boss: true,
  hurtSound: 'monstruo', idleSound: 'monstruo', idleEvery: [5, 9], particle: [[0.2, 0.18, 0.17], [1, 0.5, 0.1], [1, 0.8, 0.3]],
  drops: [[398, 1, 1], [378, 1, 1], [379, 4, 10]],
  build() { return armarSenorArenal(); },
  brain(m, dt, c) {
    const { g, pl, distP } = c;
    m.data.angry = true;
    if (g.mode !== 'survival' || !g.player.alive || distP > 40) return false;
    const b = m.body.pos, ck = g.clock || 0;
    // bombas de lava apuntadas al jugador
    if (distP > 6 && ck > (m.data.bombCd || 0)) {
      m.data.bombCd = ck + (m.health < SENOR.health / 2 ? 2.4 : 3.6);
      m.data.throwT = 0.6;
      for (let k = 0; k < (m.health < SENOR.health / 2 ? 3 : 1); k++) {
        const bomb = new LavaBomb(g, b.x, b.y + 3.2, b.z);
        const T = 1.1 + k * 0.15, tx = pl.x + (Math.random() - 0.5) * 2 * k, tz = pl.z + (Math.random() - 0.5) * 2 * k;
        avisoCaida(g, tx, pl.y, tz, 1.6, T, m); // v12.16.0: círculo rojo donde cae la bomba
        bomb.vel = { x: (tx - b.x) / T, y: (pl.y + 0.5 - (b.y + 3.2)) / T + 9 * T, z: (tz - b.z) / T };
        (g.bombs ||= []).push(bomb);
      }
      g.audio.play('monstruo', { pos: m.soundPos(), vol: 0.9, pitch: 0.6 });
    }
    // golpe al suelo: onda de fuego alrededor
    if (distP < 5 && ck > (m.data.slamCd || 0)) {
      m.data.slamCd = ck + 5;
      m.data.slamT = 1.2;
      avisoCaida(g, b.x, b.y, b.z, 5.5, 1.2, m); // v12.16.0: la onda avisa con un anillo de 1.2 s y se salta
      setTimeout(() => {
        if (m.dead) return;
        for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; g.particles.spawn(b.x + Math.cos(a) * 1.5, b.y + 0.2, b.z + Math.sin(a) * 1.5, [1, 0.5 + Math.random() * 0.3, 0.1], Math.cos(a) * 7, 1.5, Math.sin(a) * 7, 0.7, 4, true); }
        g.audio.play('explode', { pos: m.soundPos(), vol: 0.8, pitch: 0.7 });
        g.shake = Math.max(g.shake || 0, 0.6);
        const pp = g.player.body.pos;
        if (Math.hypot(pp.x - b.x, pp.z - b.z) < 5.5 && Math.abs(pp.y - b.y) < 0.9 && !g.player.effects.ignifugo) g.damagePlayer(6, b.x, b.z, 'El Señor del Arenal golpeó el suelo', false, true);
      }, 1200);
    }
    return false;
  },
  animate(m, dt, u) {
    m.data.throwT = Math.max(0, (m.data.throwT || 0) - dt);
    m.data.slamT = Math.max(0, (m.data.slamT || 0) - dt);
    const th = m.data.throwT > 0 ? Math.sin((0.6 - m.data.throwT) / 0.6 * Math.PI) : 0;
    const sl = m.data.slamT > 0 ? Math.sin((1.2 - m.data.slamT) / 1.2 * Math.PI) : 0;
    u.arms[0].rotation.x = -th * 2.6 - sl * 2.4 + Math.sin(m.t * 2) * 0.1;
    u.arms[1].rotation.x = -sl * 2.4 - Math.sin(m.t * 2) * 0.1;
    u.head.rotation.y = Math.sin(m.t * 0.7) * 0.2;
    if (Math.random() < dt * 14) m.game.particles.spawn(m.body.pos.x + (Math.random() - 0.5) * 1.4, m.body.pos.y + 1 + Math.random() * 2.4, m.body.pos.z + (Math.random() - 0.5) * 1.4, [1, 0.5 + Math.random() * 0.4, 0.1], 0, 1.2, 0, 1, -0.8, true);
  },
};

export const INFRA_MOBS = { ceniciento: CENICIENTO, zopilote_fuego: ZOPILOTE, senor_arenal: SENOR };

// el jefe despierta de vez en cuando (uno a la vez, con descanso entre apariciones)
export function bossSpawn(E, g) {
  if (g.mode !== 'survival' || E.mobs.some((m) => m.type === 'senor_arenal' && !m.dead)) return;
  const ck = g.clock || 0;
  g.meta.arenalCd = g.meta.arenalCd || 0;
  if ((g.dimT || 0) < 90 || ck < (g.bossCdLocal || 0) || Math.random() > 0.04) return;
  g.bossCdLocal = ck + (g.meta.hist && g.meta.hist.cap === 6 ? 120 : 480); // si la historia lo pide, vuelve pronto
  const w = g.world, pl = g.player.body.pos;
  for (let k = 0; k < 20; k++) {
    const a = Math.random() * Math.PI * 2, x = Math.floor(pl.x + Math.cos(a) * 18), z = Math.floor(pl.z + Math.sin(a) * 18);
    for (let y = Math.floor(pl.y) + 6; y > pl.y - 8; y--) {
      if (SOLID[w.getBlock(x, y, z)] && w.getBlock(x, y + 1, z) === AIR && w.getBlock(x, y + 2, z) === AIR && w.getBlock(x, y + 3, z) === AIR) {
        const m = E.spawnMob('senor_arenal', x + 0.5, y + 1, z + 0.5);
        m.data.angry = true;
        g.ui.toast('🌋 ¡El Señor del Arenal despertó!', 3200);
        g.audio.play('rumble', { vol: 0.9 });
        g.shake = 1.2;
        return;
      }
    }
  }
}

export function infraSpawn(E, g) {
  const count = (t) => E.mobs.filter((m) => m.type === t).length;
  const w = g.world, pl = g.player.body.pos;
  const a = Math.random() * Math.PI * 2, r = 16 + Math.random() * 24;
  const x = Math.floor(pl.x + Math.cos(a) * r), z = Math.floor(pl.z + Math.sin(a) * r);
  if (!w.isLoaded(x, z)) return;
  if (count('zopilote_fuego') < 2 && Math.random() < 0.15) { E.spawnMob('zopilote_fuego', x + 0.5, pl.y + 6 + Math.random() * 6, z + 0.5); return; }
  if (count('ceniciento') >= 6) return;
  // buscar piso con aire encima cerca de la altura del jugador
  for (let y = Math.floor(pl.y) + 8; y > pl.y - 12; y--) {
    if (SOLID[w.getBlock(x, y, z)] && w.getBlock(x, y + 1, z) === AIR && w.getBlock(x, y + 2, z) === AIR) {
      if (w.getBlock(x, y, z) === K.lava || BLOCKS[w.getBlock(x, y, z)].fluid) return;
      E.spawnMob('ceniciento', x + 0.5, y + 1, z + 0.5);
      return;
    }
  }
}

// ---------- portal ----------
// Busca un marco de obsidiana alrededor del bloque tocado (en el plano XY o ZY) y devuelve las celdas de adentro.
export function findFrame(w, x, y, z, frameId = K.obsidian) {
  for (const plane of ['x', 'z']) {
    const nbs = plane === 'x' ? [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]] : [[0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]];
    for (const [dx, dy, dz] of nbs) {
      const sx = x + dx, sy = y + dy, sz = z + dz;
      if (w.getBlock(sx, sy, sz) !== AIR) continue;
      const seen = new Set(), queue = [[sx, sy, sz]], cells = [];
      let ok = true;
      while (queue.length && ok) {
        const [cx, cy, cz] = queue.pop();
        const k = `${cx},${cy},${cz}`;
        if (seen.has(k)) continue;
        seen.add(k);
        const id = w.getBlock(cx, cy, cz);
        if (id === frameId) continue;
        if (id !== AIR) { ok = false; break; }
        cells.push([cx, cy, cz]);
        if (cells.length > 24) { ok = false; break; }
        for (const [ex, ey, ez] of nbs) queue.push([cx + ex, cy + ey, cz + ez]);
      }
      if (ok && cells.length >= 2) return cells;
    }
  }
  return null;
}

// Arma un portal con marco (interior 2x3 en el plano X) con la esquina en (x, y, z); y = piso del interior.
export function buildPortal(w, x, y, z, frameId = K.obsidian, portalId = K.portal) {
  for (let dx = -1; dx <= 4; dx++) for (let dz = -1; dz <= 1; dz++) for (let dy = 0; dy <= 4; dy++) w.setBlock(x + dx, y + dy, z + dz, AIR);
  for (let dx = -1; dx <= 4; dx++) for (let dz = -1; dz <= 1; dz++) if (!SOLID[w.getBlock(x + dx, y - 1, z + dz)] || dz !== 0) w.setBlock(x + dx, y - 1, z + dz, frameId);
  for (let dx = 0; dx <= 3; dx++) for (let dy = -1; dy <= 4; dy++) {
    const edge = dx === 0 || dx === 3 || dy === -1 || dy === 3;
    if (dy === 4) continue;
    w.setBlock(x + dx, y + dy, z, edge ? frameId : portalId);
  }
}
