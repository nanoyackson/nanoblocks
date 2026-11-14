// Más mar: mantarrayas en grupo que saltan fuera del agua y dan vueltas en el aire (como en el golfo de Papagayo),
// pulpos en el fondo que tiran tinta y se van, el tiburón ballena (gigante, lento y manso) y arrecifes vivos:
// cerca del coral aparecen cardúmenes de peces de colores.
import { armarMantarraya, armarPulpo, armarTiburonBallena } from './modelos-finales.js';
import { FLUID, AIR, BLOCK_BY_KEY as K } from './blocks.js';
import { hearts } from './fauna.js';
import { swim } from './mar.js';
import { arrecifeRico } from './arrecife.js';

const waterAt = (w, x, y, z) => FLUID[w.getBlock(Math.floor(x), Math.floor(y), Math.floor(z))] === 1;
function surfaceAbove(w, x, y, z) {
  let yy = Math.floor(y);
  for (let k = 0; k < 40 && waterAt(w, x, yy + 1, z); k++) yy++;
  return yy + 1;
}
const sigueAlLider = (tipo) => (mm, g) => {
  const lead = mm.data.school && g.entities.mobs.find((o) => o.type === tipo && o.data.school === mm.data.school && o !== mm && !o.dead && o.data.leader);
  if (!lead || mm.data.leader) return null;
  const o = mm.data.offset || (mm.data.offset = { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 1.5, z: (Math.random() - 0.5) * 5 });
  return { x: lead.body.pos.x + o.x, y: lead.body.pos.y + o.y, z: lead.body.pos.z + o.z };
};

// ===== Mantarraya (mobula): planea en grupo y a veces salta y da vueltas =====
const MANTARRAYA = {
  name: 'Mantarraya', w: 1.4, h: 0.3, health: 14, speed: 2.4, swimmer: true, hurtSound: 'pez', idleSound: null,
  particle: [[0.2, 0.25, 0.3], [0.9, 0.95, 1]], drops: [],
  build() { return armarMantarraya(); },
  update(m, dt) {
    const g = m.game, b = m.body, w = g.world, u = m.group.userData;
    m.data.saltoCd = (m.data.saltoCd ?? 8 + Math.random() * 20) - dt;
    const inW = swim(m, dt, {
      speed: 2.4, range: 14, vr: 3, accel: 1.2, turn: 1.6, tailSpeed: 3, tailAmp: 0.2, shy: 2.5,
      goal: (mm, gg) => {
        // cuando le toca saltar, sube derechito a la superficie
        if (mm.data.saltoCd <= 0) return { x: b.pos.x + Math.sin(mm.yaw) * 4, y: surfaceAbove(w, b.pos.x, b.pos.y, b.pos.z) + 1, z: b.pos.z + Math.cos(mm.yaw) * 4 };
        return sigueAlLider('mantarraya')(mm, gg);
      },
    });
    const top = surfaceAbove(w, b.pos.x, b.pos.y, b.pos.z);
    if (inW && m.data.saltoCd <= 0 && b.pos.y + 0.6 >= top - 0.3) {
      m.data.saltoCd = 12 + Math.random() * 25;
      m.data.leapT = 2.5; b.vel.y = 8 + Math.random() * 3;
      b.vel.x += Math.sin(m.yaw) * 2; b.vel.z += Math.cos(m.yaw) * 2;
      m.data.giro = (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 6);
      g.particles.burst(b.pos.x, top, b.pos.z, [[0.85, 0.92, 1], [1, 1, 1]], 18, 3);
      g.audio.play('splash', { pos: m.soundPos(), vol: 0.5, pitch: 1.2 });
      const pl = g.player.body.pos;
      if (Math.hypot(pl.x - b.pos.x, pl.z - b.pos.z) < 40) {
        g.achieve('mantarraya', 'Vi saltar las mantarrayas');
        if (!g.meta.rayaAviso) { g.meta.rayaAviso = true; g.ui.toast('🌊 ¡Una mantarraya saltó fuera del agua y dio vueltas en el aire!', 2600); }
      }
    }
    // en el aire da vueltas; al caer, el chapuzón
    if (!inW && m.data.leapT > 0) { m.data.rot = (m.data.rot || 0) + m.data.giro * dt; u.body.rotation.z = m.data.rot; m.data.chapuzon = true; }
    else if (inW) {
      m.data.rot = 0;
      if (m.data.chapuzon) { m.data.chapuzon = false; g.particles.burst(b.pos.x, top, b.pos.z, [[0.85, 0.92, 1], [1, 1, 1]], 24, 4); g.audio.play('splash', { pos: m.soundPos(), vol: 0.6, pitch: 0.9 }); }
    }
    // aleteo lento, como volando
    const fl = Math.sin(m.t * 3.2) * 0.45;
    u.alas[0].rotation.z = fl; u.alas[1].rotation.z = -fl;
  },
  onHurt(m) { m.panic = 5; },
};

// ===== Pulpo: en el fondo, cerca del coral; si uno se le acerca, tira tinta y se va =====
const PULPO = {
  name: 'Pulpo', w: 0.6, h: 0.5, health: 8, speed: 1.4, swimmer: true, hurtSound: 'pez', idleSound: null,
  particle: [[0.7, 0.3, 0.25]], drops: [],
  build() { return armarPulpo(); },
  update(m, dt) {
    const g = m.game, b = m.body, w = g.world, u = m.group.userData, pl = g.player.body.pos;
    const d = Math.hypot(pl.x - b.pos.x, pl.y - b.pos.y, pl.z - b.pos.z);
    m.data.tintaCd = Math.max(0, (m.data.tintaCd || 0) - dt);
    if (d < 3.2 && m.data.tintaCd <= 0 && waterAt(w, pl.x, pl.y + 1.4, pl.z) && !m.data.amigo) tinta(m, g);
    swim(m, dt, {
      speed: m.panic > 0 ? 3.6 : 0.8, range: 4, vr: 1, accel: 2, turn: 3,
      // se queda pegado al fondo (salvo cuando huye)
      goal: (mm) => {
        if (mm.panic > 0) return { x: b.pos.x + (b.pos.x - pl.x) * 3, y: b.pos.y + 0.5, z: b.pos.z + (b.pos.z - pl.z) * 3 };
        let y = Math.floor(b.pos.y);
        while (y > 1 && waterAt(w, b.pos.x, y - 1, b.pos.z)) y--;
        if (!mm.goal || mm.thinkT <= 0) { mm.thinkT = 3 + Math.random() * 4; return { x: b.pos.x + (Math.random() - 0.5) * 6, y: y + 0.05, z: b.pos.z + (Math.random() - 0.5) * 6 }; }
        return { ...mm.goal, y: y + 0.05 };
      },
    });
    u.body.rotation.x = 0;
    // las patas ondulan
    u.pies.forEach((p, i) => { p.rotation.x = 0.5 + Math.sin(m.t * (m.panic > 0 ? 9 : 2.5) + i) * 0.35; });
  },
  interact(m, g) {
    if (m.panic > 0) return true;
    m.data.amigo = true;
    hearts(g, m.body.pos, 6, [1, 0.6, 0.5]);
    g.ui.toast('🐙 El pulpo le agarró el dedo con una ventosa… ¡y no lo suelta! (ya le tiene confianza)', 2600);
    g.achieve('pulpo', 'Amistad con el pulpo');
    return true;
  },
  onHurt(m, g) { tinta(m, g); },
};
function tinta(m, g) {
  m.data.tintaCd = 12; m.panic = 5;
  const b = m.body.pos;
  for (let k = 0; k < 50; k++) g.particles.spawn(b.x + (Math.random() - 0.5) * 0.6, b.y + 0.4 + (Math.random() - 0.5) * 0.6, b.z + (Math.random() - 0.5) * 0.6, [0.06, 0.05, 0.08], (Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 2.4, 2 + Math.random() * 1.5, 0);
  g.audio.play('splash', { pos: { x: b.x, y: b.y, z: b.z }, vol: 0.4, pitch: 1.6 });
  const pl = g.player.body.pos;
  if (Math.hypot(pl.x - b.x, pl.y + 1.4 - b.y, pl.z - b.z) < 3.5) {
    let el = document.getElementById('capa-tinta');
    if (!el) { el = document.createElement('div'); el.id = 'capa-tinta'; el.className = 'cielo-capa'; el.style.background = 'radial-gradient(circle, var(--velo) 0%, var(--surface-solida) 70%)'; document.getElementById('hud').appendChild(el); }
    el.style.transition = 'opacity 0.2s'; el.style.opacity = 1;
    setTimeout(() => { el.style.transition = 'opacity 3s'; el.style.opacity = 0; }, 700);
    g.ui.toast('🐙 ¡Pfff! El pulpo le tiró tinta en la cara y se fue', 2000);
    g.achieve('tinta', 'Entintado');
  }
}

// ===== Tiburón ballena: el pez más grande; lento, manso, come plancton cerca de la superficie =====
const TIBURON_BALLENA = {
  name: 'Tiburón ballena', w: 2.4, h: 1.8, health: 300, speed: 1.1, swimmer: true, hurtSound: null, idleSound: null,
  particle: [[0.25, 0.32, 0.4], [0.9, 0.95, 1]], drops: [],
  build() { return armarTiburonBallena(); },
  update(m, dt) {
    const g = m.game, b = m.body, w = g.world;
    swim(m, dt, {
      speed: 1.1, range: 30, vr: 2, accel: 0.4, turn: 0.5, tailSpeed: 1.6, tailAmp: 0.35, hearFar: 60,
      // patrulla cerquita de la superficie (comiendo plancton)
      goal: (mm) => {
        if (mm.goal && mm.thinkT > 0) return mm.goal;
        mm.thinkT = 6 + Math.random() * 6;
        const gx = b.pos.x + (Math.random() - 0.5) * 50, gz = b.pos.z + (Math.random() - 0.5) * 50;
        const top = surfaceAbove(w, b.pos.x, b.pos.y, b.pos.z);
        if (!waterAt(w, gx, top - 3, gz)) return { x: b.pos.x - Math.sin(mm.yaw) * 10, y: top - 2.6, z: b.pos.z - Math.cos(mm.yaw) * 10 };
        return { x: gx, y: top - 2.6, z: gz };
      },
    });
    // lo que traga: unas burbujitas en la boca
    if (Math.random() < dt * 6) g.particles.spawn(b.pos.x + Math.sin(m.yaw) * 4.2, b.pos.y + 0.8, b.pos.z + Math.cos(m.yaw) * 4.2, [0.85, 0.95, 1], 0, 0.8, 0, 0.8, 0);
    const pl = g.player.body.pos;
    if (Math.hypot(pl.x - b.pos.x, pl.y - b.pos.y, pl.z - b.pos.z) < 7 && waterAt(w, pl.x, pl.y + 1, pl.z) && !m.data.nado) {
      m.data.nado = true;
      g.ui.toast('🦈 ¡Un tiburón ballena a la par! El pez más grande del mar, y solo come plancton', 3400);
      g.achieve('tiburon_ballena', 'Nadé con el tiburón ballena');
    }
  },
  interact(m, g) { hearts(g, m.body.pos, 10, [0.6, 0.85, 1]); g.achieve('tiburon_ballena', 'Nadé con el tiburón ballena'); g.ui.toast('🦈 Su piel es áspera como lija. El tiburón ballena ni se inmuta.', 2400); return true; },
  onHurt(m, g) { g.ui.toast('¡No! El tiburón ballena está en peligro de extinción', 2000); return false; },
};

export const MAR2 = { mantarraya: MANTARRAYA, pulpo: PULPO, tiburon_ballena: TIBURON_BALLENA };

// ---------- aparición ----------
const CORALES = () => [K.coral_red, K.coral_orange, K.coral_yellow, K.coral_purple];
export function mar2Spawn(E, g) {
  if (g.dim !== 'tierra') return false;
  const w = g.world, pl = g.player.body.pos;
  const a = Math.random() * Math.PI * 2, r = 12 + Math.random() * 30;
  const x = Math.floor(pl.x + Math.cos(a) * r), z = Math.floor(pl.z + Math.sin(a) * r);
  if (!w.isLoaded(x, z)) return false;
  let top = 110;
  while (top > 1 && !waterAt(w, x, top, z)) { if (w.getBlock(x, top, z) !== AIR) return false; top--; }
  if (top <= 1) return false;
  let bottom = top;
  while (bottom > 1 && waterAt(w, x, bottom - 1, z)) bottom--;
  const depth = top - bottom + 1;
  if (depth < 3) return false;
  const count = (t) => E.mobs.filter((m) => m.type === t && !m.dead).length;
  const bio = w.gen.column(x, z).biome, ocean = bio === 'ocean' || bio === 'beach';
  // ¿hay coral cerca del fondo?
  const C = CORALES();
  let coral = null;
  for (let k = 0; k < 30 && !coral; k++) {
    const cx = x + Math.floor((Math.random() - 0.5) * 10), cz = z + Math.floor((Math.random() - 0.5) * 10);
    for (let dy = -2; dy <= 3; dy++) if (C.includes(w.getBlock(cx, bottom + dy, cz))) { coral = { x: cx, y: bottom + dy, z: cz }; break; }
  }
  const R = Math.random();
  if (coral) {
    // arrecife vivo: cardumen de colores alrededor del coral
    if (count('pez') < 28 && R < 0.6) {
      const n = 6 + Math.floor(Math.random() * 5), variant = Math.floor(Math.random() * 4), school = Math.random();
      for (let i = 0; i < n; i++) {
        const m = E.spawnMob('pez', coral.x + 0.5 + (Math.random() - 0.5) * 3, Math.min(top - 0.8, coral.y + 1.2 + Math.random() * 1.5), coral.z + 0.5 + (Math.random() - 0.5) * 3);
        m.data = { variant, school, leader: i === 0 };
      }
      if (!g.meta.arrecifeAviso && r < 25) { g.meta.arrecifeAviso = true; g.ui.toast('🐠 Un arrecife vivo: los peces de colores andan en cardumen alrededor del coral', 2800); }
      return true;
    }
    if (count('pulpo') < 2 && R < 0.85) { E.spawnMob('pulpo', coral.x + 0.5, bottom + 0.1, coral.z + 0.5); return true; }
  }
  if (!ocean) return false;
  const rico = arrecifeRico(g, { x, z }); // v12.7.1: con 150 corales revividos, una mantarraya más cerca del arrecife
  if (count('mantarraya') < (rico ? 8 : 7) && R < (rico ? 0.2 : 0.1) && depth >= 5) {
    const n = 3 + Math.floor(Math.random() * 4), school = Math.random();
    for (let i = 0; i < n; i++) { const m = E.spawnMob('mantarraya', x + 0.5 + i * 1.2, bottom + 1.5 + Math.random() * Math.max(0.5, depth - 3), z + 0.5 + (i % 2) * 1.5); m.data.school = school; m.data.leader = i === 0; }
    return true;
  }
  if (count('pulpo') < 1 && R < 0.14 && depth <= 10) { E.spawnMob('pulpo', x + 0.5, bottom + 0.1, z + 0.5); return true; }
  if (count('tiburon_ballena') < 1 && R > 0.985 && depth >= 9 && r > 20 && g.daylight > 0.4) { E.spawnMob('tiburon_ballena', x + 0.5, top - 3, z + 0.5); return true; }
  return false;
}
