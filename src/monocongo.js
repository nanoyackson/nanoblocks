// El Mono congo gigante: jefe de la selva (de día). Aúlla tan fuerte que marea y empuja, tira mangos en curva,
// da saltos enormes por encima de uno y, a media vida, se enfurece (tira de a tres y aúlla más seguido).
// Suelta su mechón: con clic derecho, uno aúlla como él y espanta a las criaturas hostiles de alrededor.
import { avisoCaida, atacar, anilloAviso } from './golpes.js';
import { armarCongoGigante } from './modelos-otros.js';
import { SOLID } from './blocks.js';
import { makeItemMesh } from './models.js';
import { difOf } from './supervivencia.js';

export const MECHON = 470;
const MANGO = 377;

export const MONO_CONGO_GIGANTE = {
  name: 'El Mono congo gigante', w: 1.4, h: 2.6, health: 170, speed: 2.6, hostile: true, diurno: true, boss: true, attack: 6, xp: 120,
  hurtSound: 'mono', idleSound: null, particle: [[0.1, 0.08, 0.07], [0.45, 0.3, 0.15]],
  drops: [[MECHON, 1, 1], [MANGO, 3, 6]], // la plata la paga precios.js (premioBaja)
  build() { return armarCongoGigante(); },
  brain(m, dt, c) {
    const { g, distP, dxp, dzp, pl } = c;
    const d = m.data, b = m.body;
    if (!g.player.alive || g.mode !== 'survival') return false;
    d.furia = m.health < m.kind.health / 2;
    if (d.furia && !d.avisoFuria) { d.avisoFuria = true; g.ui.toast('🐒 ¡El Mono congo gigante se enfureció! Ahora tira de a tres', 2400); }
    m.targetYaw = Math.atan2(dxp, dzp);
    d.aullido = (d.aullido ?? 3) - dt;
    d.tiro = (d.tiro ?? 2) - dt;
    d.salto = (d.salto ?? 6) - dt;
    d.boca = Math.max(0, (d.boca || 0) - dt);
    if (d.aullido <= 0.8 && d.aullido > 0) { anilloAviso(g, b.pos.x, b.pos.y, b.pos.z, 10, dt, m); if (!d.avisoAull) { d.avisoAull = true; g.audio.play('mono', { pos: m.soundPos(), vol: 0.6, pitch: 0.9 }); } } // v12.8.1 (fase 2): 0.8 s de aviso
    // el aullido: marea y empuja a uno
    if (d.aullido <= 0) {
      d.avisoAull = false;
      d.aullido = d.furia ? 7 : 11; d.boca = 1.6;
      g.audio.play('mono', { pos: m.soundPos(), vol: 1.6, pitch: 0.45 });
      setTimeout(() => g.audio.play('mono', { pos: m.soundPos(), vol: 1.3, pitch: 0.55 }), 450);
      g.shake = Math.max(g.shake || 0, 0.6);
      if (distP < 10) {
        g.addEffect('mareo', 2.5);
        const k = (10 - distP) / 10 * 9;
        g.player.body.vel.x += (-dxp / (distP || 1)) * k; g.player.body.vel.z += (-dzp / (distP || 1)) * k; g.player.body.vel.y += 3;
      }
      for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; g.particles.spawn(b.pos.x + Math.cos(a), b.pos.y + 2, b.pos.z + Math.sin(a), [0.9, 0.85, 0.7], Math.cos(a) * 6, 0.5, Math.sin(a) * 6, 0.6, 0); }
      return true;
    }
    // tira mangos (en curva) cuando uno está lejos
    if (d.tiro <= 0 && distP > 3 && distP < 22) {
      d.tiro = d.furia ? 2 : 3.2;
      const n = d.furia ? 3 : 1;
      for (let i = 0; i < n; i++) lanzarMango(g, m, pl, (i - (n - 1) / 2) * 0.22);
      g.audio.play('swish', { pos: m.soundPos(), vol: 0.7, pitch: 0.6 });
    }
    // el salto enorme: cae cerquita de uno
    if (d.salto <= 0 && b.onGround && distP > 5) {
      d.salto = d.furia ? 5 : 8;
      const T = 1.2;
      b.vel.x = dxp / T; b.vel.z = dzp / T; b.vel.y = 12;
      d.volando = true;
      avisoCaida(g, pl.x, pl.y, pl.z, 3.2, 1.3, m);
      g.audio.play('mono', { pos: m.soundPos(), vol: 1.2, pitch: 0.7 });
      return true;
    }
    if (d.volando && b.onGround && b.vel.y <= 0) {
      d.volando = false;
      g.shake = Math.max(g.shake || 0, 0.7);
      g.audio.play('explode', { pos: m.soundPos(), vol: 0.5, pitch: 0.5 });
      g.particles.burst(b.pos.x, b.pos.y + 0.2, b.pos.z, [[0.45, 0.35, 0.2], [0.3, 0.5, 0.2]], 30, 5);
      if (distP < 3.2) g.damagePlayer(5, b.pos.x, b.pos.z, 'El Mono congo gigante le cayó encima', false, true);
    }
    m.moving = distP > 2.2;
    m.speedMul = distP > 12 ? 1.3 : 1;
    if (distP < 2.8 && Math.abs(pl.y - b.pos.y) < 2.5 && m.attackCd <= 0) {
      atacar(m, g, { tipo: 'mazazo', dano: m.kind.attack, causa: 'El Mono congo gigante lo agarró a manotazos', alcance: 2.8, altura: 2.5, cd: 1.4 });
    }
    return true;
  },
  animate(m, dt, u) {
    m.data.bocaK = (m.data.bocaK || 0) + ((m.data.boca > 0 ? 1 : 0) - (m.data.bocaK || 0)) * Math.min(1, dt * 10);
    const a = m.data.bocaK;
    u.boca.scale.y = 1 + a * 4;
    u.headRx = -a * 0.5 + Math.sin(m.t * 25) * 0.03 * a;
    u.tail.rotation.y = Math.sin(m.t * 2) * 0.3;
  },
};

// ---------- los mangos que tira ----------
function lanzarMango(g, m, pl, desvio) {
  const b = m.body.pos;
  const o = { x: b.x, y: b.y + 2.4, z: b.z };
  const T = 1.1;
  const dx = pl.x - o.x, dz = pl.z - o.z;
  const c = Math.cos(desvio), s = Math.sin(desvio);
  const rx = dx * c - dz * s, rz = dx * s + dz * c;
  const vy = (pl.y + 1.2 - o.y) / T + 0.5 * 18 * T;
  const mesh = makeItemMesh(MANGO, 0.5);
  mesh.position.set(o.x, o.y, o.z);
  avisoCaida(g, o.x + rx, pl.y, o.z + rz, 0.9, T, m); // la sombra de dónde va a caer
  g.scene.add(mesh);
  (g.mangos ||= []).push({ p: o, v: { x: rx / T, y: vy, z: rz / T }, mesh, t: 0, m });
}
export function tickMonoCongo(g, dt) {
  if (!g.mangos || !g.mangos.length) return;
  const pl = g.player.body.pos, w = g.world;
  g.mangos = g.mangos.filter((f) => {
    f.t += dt;
    f.v.y -= 18 * dt;
    f.p.x += f.v.x * dt; f.p.y += f.v.y * dt; f.p.z += f.v.z * dt;
    f.mesh.position.set(f.p.x, f.p.y, f.p.z);
    f.mesh.rotation.x += dt * 8; f.mesh.rotation.z += dt * 5;
    const golpe = Math.hypot(pl.x - f.p.x, pl.y + 1 - f.p.y, pl.z - f.p.z) < 0.9;
    const suelo = SOLID[w.getBlock(Math.floor(f.p.x), Math.floor(f.p.y), Math.floor(f.p.z))];
    if (golpe || suelo || f.t > 4) {
      if (golpe) { g.diagDe = f.m; g.damagePlayer(3, f.p.x, f.p.z, 'Le cayó un mango en la cabeza', false, true); g.diagDe = null; g.ui.toast('🥭 ¡Plaf! Un mangazo en la cabeza', 1000); } // v12.8.1: sin g.atacante a propósito (con él pegaba ×1.55 y el torpe ya no ganaba)
      g.particles.burst(f.p.x, f.p.y, f.p.z, [[1, 0.7, 0.15], [0.95, 0.5, 0.1], [0.4, 0.7, 0.2]], 14, 2.5);
      g.audio.play('splash', { pos: { x: f.p.x, y: f.p.y, z: f.p.z }, vol: 0.35, pitch: 1.8 });
      g.scene.remove(f.mesh);
      f.mesh.geometry && f.mesh.geometry.dispose();
      return false;
    }
    return true;
  });
}
export function limpiarMangos(g) { for (const f of g.mangos || []) g.scene.remove(f.mesh); g.mangos = []; }

// ---------- el mechón: aullar como él ----------
export function usarMechon(g) {
  if ((g.mechonCd || 0) > (g.clock || 0)) { g.ui.toast('Todavía tiene la garganta cansada…', 1200); return; }
  g.mechonCd = (g.clock || 0) + 30;
  g.audio.play('mono', { vol: 1.4, pitch: 0.5 });
  g.shake = Math.max(g.shake || 0, 0.3);
  const p = g.player.body.pos;
  let n = 0;
  for (const m of g.entities.mobs) {
    if (!m.kind.hostile || m.kind.boss || m.dead) continue;
    if (m.data.comensalFn) continue;
    if (Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < 14) { m.panic = 8; m.data.espanto = (g.clock || 0) + 8; if (m.data.aprieta) { m.data.aprieta = null; m.data.suelta = 6; } n++; }
  }
  g.ui.toast(n ? `🐒 ¡UUUOOOOH! ${n} criatura${n > 1 ? 's salieron' : ' salió'} corriendo` : '🐒 ¡UUUOOOOH! (se oyó hasta el otro valle)', 2000);
  g.achieve('aullar', 'Aullé como congo');
}

// ---------- aparece de día en la selva, de vez en cuando ----------
export function monoCongoSpawn(E, g) {
  if (g.mode !== 'survival' || !g.settings.hostiles || !difOf(g).hostiles || g.dim !== 'tierra' || g.daylight < 0.5 || (g.day || 1) < 5) return false;
  g.congoCd = (g.congoCd ?? 360) - 2;
  if (g.congoCd > 0 || E.mobs.some((m) => m.type === 'mono_congo_gigante' && !m.dead)) return false;
  const w = g.world, pl = g.player.body.pos;
  if (w.gen.column(Math.floor(pl.x), Math.floor(pl.z)).biome !== 'jungle') { g.congoCd = 20; return false; }
  if (Math.random() > 0.35) { g.congoCd = 40; return false; }
  for (let t = 0; t < 12; t++) {
    const a = Math.random() * Math.PI * 2, r = 18 + Math.random() * 6;
    const x = Math.floor(pl.x + Math.cos(a) * r), z = Math.floor(pl.z + Math.sin(a) * r);
    if (!w.isLoaded(x, z)) continue;
    let y = Math.floor(pl.y) + 10;
    while (y > 1 && !SOLID[w.getBlock(x, y - 1, z)]) y--;
    E.spawnMob('mono_congo_gigante', x + 0.5, y + 0.2, z + 0.5);
    g.congoCd = 900 + Math.random() * 600;
    g.ui.toast('🐒 ¡UUUOOOOOH! Un aullido enorme sacude la selva… el Mono congo gigante anda bravo', 3600);
    g.audio.play('mono', { vol: 1.2, pitch: 0.45 });
    return true;
  }
  return false;
}
