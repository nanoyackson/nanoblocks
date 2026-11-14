// La mejenga: en la plaza de cada pueblo aparece una bola. Clic le pega (fuerte, hacia donde mira), caminando
// encima se lleva pegada. Al primer toque se arma la mejenga: hasta 3 vecinos corren a quitársela y patean al marco
// del este; usted mete goles en el del oeste. A 3 goles: si gana, le dan colones y un logro.
import * as THREE from 'three';
import { SOLID } from './blocks.js';
import { villageAt, CELL } from './pueblogen.js';
import { box } from './fauna.js';

export const BOLA_ITEM = 425;
const COLON = 360;

export const BOLA = {
  name: 'Bola', w: 0.4, h: 0.4, health: 999, speed: 0, hurtSound: 'balon', idleSound: null, particle: [[0.95, 0.95, 0.95]], drops: [],
  build() {
    const g = new THREE.Group();
    const ball = box('bola', 0.4, 0.4, 0.4, (f, s) => {
      s.fill([[236, 236, 236], [246, 246, 246], [255, 255, 255]], () => 0.6 + s.rnd() * 0.3);
      // los pentágonos negros
      for (const [x, y] of [[1, 1], [s.w - 3, 2], [Math.floor(s.w / 2) - 1, s.h - 3], [2, s.h - 2]]) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) s.set(x + dx, y + dy, [24, 24, 26]);
    }, 0, 0.2, 0);
    g.add(ball);
    g.userData = { ball };
    return g;
  },
  update(m, dt) {
    const g = m.game, b = m.body.pos, v = m.body.vel, w = g.world, u = m.group.userData;
    // física sencilla: gravedad, rebote, roce con el suelo y choque con paredes
    v.y -= 18 * dt;
    const solid = (x, y, z) => SOLID[w.getBlock(Math.floor(x), Math.floor(y), Math.floor(z))];
    let nx = b.x + v.x * dt, ny = b.y + v.y * dt, nz = b.z + v.z * dt;
    if (solid(nx, b.y + 0.2, b.z)) { v.x *= -0.55; nx = b.x; }
    if (solid(b.x, b.y + 0.2, nz)) { v.z *= -0.55; nz = b.z; }
    if (solid(nx, ny, nz) && v.y < 0) {
      ny = Math.floor(ny) + 1;
      v.y = Math.abs(v.y) > 2.5 ? -v.y * 0.45 : 0;
      v.x *= Math.pow(0.25, dt); v.z *= Math.pow(0.25, dt);
      if (Math.abs(v.y) > 2) g.audio.play('balon', { pos: b, vol: 0.25, pitch: 1.3 });
    }
    b.x = nx; b.y = ny; b.z = nz;
    if (b.y < -10) m.dead = true;
    // llevarla pegada al caminar encima
    const p = g.player.body.pos, pv = g.player.body.vel;
    const dp = Math.hypot(p.x - b.x, p.z - b.z);
    if (dp < 0.65 && Math.abs(p.y - b.y) < 1.2) {
      const sp = Math.hypot(pv.x, pv.z);
      if (sp > 0.5) { v.x = pv.x * 1.25; v.z = pv.z * 1.25; } else { v.x += (b.x - p.x) * 3; v.z += (b.z - p.z) * 3; }
    }
    // la mejenga
    tickPartido(g, m, dt);
    // que gire según cómo rueda
    u.ball.rotation.x += v.z * dt * 4; u.ball.rotation.z -= v.x * dt * 4;
    m.group.position.set(b.x, b.y, b.z);
  },
  onHurt(m, g) {
    // un buen tiro hacia donde mira
    const d = g.player.lookDir();
    const l = Math.hypot(d.x, d.z) || 1;
    m.body.vel.x = (d.x / l) * 13; m.body.vel.z = (d.z / l) * 13; m.body.vel.y = 3.5 + Math.max(0, d.y) * 8;
    g.audio.play('balon', { pos: m.body.pos, vol: 0.9 });
    if (!g.mejenga && m.data.plaza) empezar(g, m);
    return false;
  },
  interact(m, g) {
    // clic derecho: levantarla (si es suya, la devuelve al inventario)
    if (!m.data.plaza) { m.dead = true; g.inventory.add(BOLA_ITEM, 1); return true; }
    return false;
  },
};

// la plaza (cancha) del pueblo más cercano
function plazaCerca(g, x, z) {
  const gen = g.world.gen, cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
  let best = null, bd = 1e9;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const v = villageAt(gen, cx + dx, cz + dz);
    if (!v) continue;
    const P = v.buildings.find((b) => b.kind === 'plaza');
    if (!P) continue;
    const c = { x: P.x + P.w / 2, z: P.z + P.d / 2 };
    const d = Math.hypot(c.x - x, c.z - z);
    if (d < bd) { bd = d; best = { ...P, cx: c.x, cz: c.z, v, dist: d }; }
  }
  return best;
}

function centro(m, P) { const b = m.body.pos; b.x = P.cx; b.z = P.cz; b.y = P.y + 1.5; m.body.vel.x = m.body.vel.y = m.body.vel.z = 0; }

function empezar(g, m) {
  const P = m.data.plaza, p = g.player.body.pos;
  const vecinos = g.entities.mobs.filter((o) => o.type === 'vecino' && !o.dead && o.data && !SHOPLIKE.has(o.data.role) && Math.hypot(o.body.pos.x - P.cx, o.body.pos.z - P.cz) < 40).slice(0, 3);
  g.mejenga = { ball: m, yo: 0, ellos: 0, vecinos, kickCd: new Map() };
  vecinos.forEach((o) => { o.data.mejenga = 1; });
  g.ui.toast(`⚽ ¡Mejenga! Usted ataca el marco del OESTE; ${vecinos.length ? `${vecinos.length} vecino${vecinos.length > 1 ? 's' : ''} defienden y atacan el del ESTE` : 'nadie quiso jugar, pero igual cuenta'}. A 3 goles`, 4200);
  g.achieve('bola', 'Un toque en la plaza');
  void p;
}
const SHOPLIKE = new Set(['pulpero', 'sodera', 'beata', 'cantinero', 'panadera', 'carnicero', 'barbero', 'farmaceutica', 'doctora', 'policia', 'funcionario', 'maestra', 'ferretero']);

function gol(g, m, mio) {
  const M = g.mejenga, P = m.data.plaza, b = m.body.pos;
  if (mio) M.yo++; else M.ellos++;
  g.audio.play('gol', { pos: b, vol: 1 });
  g.audio.play('aplausos', { ui: true, vol: 0.5 });
  g.particles.burst(b.x, b.y + 0.5, b.z, [[0.1, 0.25, 0.85], [1, 1, 1], [0.85, 0.1, 0.12]], 40, 4);
  g.ui.regionBanner(mio ? '¡GOOOOL!' : 'Gol de los vecinos', `Usted ${M.yo} – ${M.ellos} Vecinos`);
  if (M.yo >= 3 || M.ellos >= 3) {
    if (M.yo >= 3) {
      g.inventory.add(COLON, 10);
      g.ui.toast('🏆 ¡Ganó la mejenga! Los vecinos le dan 10 colones (y dicen que fue suerte)', 3600);
      g.achieve('mejenga', 'Mejenguero del pueblo');
    } else g.ui.toast('😅 Le ganaron los del barrio. La revancha es el domingo', 3200);
    M.vecinos.forEach((o) => { o.data.mejenga = 0; });
    g.mejenga = null;
  }
  centro(m, P);
}

function tickPartido(g, m, dt) {
  const P = m.data.plaza;
  if (!P) return;
  const b = m.body.pos;
  // se fue muy lejos: vuelve al centro
  if (Math.hypot(b.x - P.cx, b.z - P.cz) > P.w + 6 || b.y < P.y - 4) { centro(m, P); return; }
  const M = g.mejenga;
  if (!M || M.ball !== m) return;
  // goles: el marco del oeste es el de usted, el del este el de ellos
  const mz = P.z + Math.floor(P.d / 2) + 0.5;
  const enBoca = Math.abs(b.z - mz) < 1.7 && b.y < P.y + 3.4;
  if (enBoca && b.x < P.x + 1.6) { gol(g, m, true); return; }
  if (enBoca && b.x > P.x + P.w - 1.6) { gol(g, m, false); return; }
  // los vecinos corren a la bola y patean hacia el marco del este
  for (const o of M.vecinos) {
    if (o.dead) continue;
    const d = Math.hypot(o.body.pos.x - b.x, o.body.pos.z - b.z);
    const cd = M.kickCd.get(o) || 0;
    if (d < 1.0 && g.clock > cd) {
      M.kickCd.set(o, g.clock + 0.9);
      const tx = P.x + P.w - 1, tz = mz + (Math.random() - 0.5) * 2.4;
      const dx = tx - b.x, dz = tz - b.z, l = Math.hypot(dx, dz) || 1;
      const f = 6 + Math.random() * 4;
      m.body.vel.x = (dx / l) * f; m.body.vel.z = (dz / l) * f; m.body.vel.y = 2 + Math.random() * 2;
      g.audio.play('balon', { pos: b, vol: 0.7, pitch: 0.95 });
    }
  }
  void dt;
}

// cada segundo: si uno llega a la cancha y no hay bola, aparece una en el centro
export function tickMejenga(g) {
  if (g.dim !== 'tierra' || !g.world) return;
  const p = g.player.body.pos;
  const P = plazaCerca(g, p.x, p.z);
  if (!P || P.dist > 30) return;
  if (g.entities.mobs.some((m) => m.type === 'bola' && !m.dead && m.data.plaza && m.data.plaza.x === P.x && m.data.plaza.z === P.z)) return;
  if (P.dist > 18) return;
  const m = g.entities.spawnMob('bola', P.cx, P.y + 1.5, P.cz);
  m.data.plaza = { x: P.x, z: P.z, y: P.y, w: P.w, d: P.d, cx: P.cx, cz: P.cz };
  m.tamed = true; // que no desaparezca de lejos
  if (!g.meta.bolaVista) { g.meta.bolaVista = true; g.ui.toast('⚽ Hay una bola en la plaza: péguele con clic para armar una mejenga', 3200); }
}

// la bola que se compra en la pulpería: se pone en el suelo y se juega donde sea
export function ponerBola(g, t) {
  const m = g.entities.spawnMob('bola', t.x + 0.5, t.y + 1.2, t.z + 0.5);
  m.tamed = true;
  if (g.mode === 'survival') g.inventory.consumeHeld(1);
  return m;
}
