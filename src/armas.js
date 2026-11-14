// Armas de la aventura: arco con flechas (se cargan manteniendo clic derecho), machete, y experiencia por niveles.
import * as THREE from 'three';
import { ventaja } from './progreso.js';
import { ganarMaestria, bonoDano } from './maestria.js';

export const BOW = 326, ARROW = 327;

// ---------- experiencia ----------
// lo que cuesta pasar del nivel n al n+1
export const xpNeed = (n) => 10 + n * 6;
export function levelOf(xp) {
  let lv = 0, left = xp;
  while (left >= xpNeed(lv)) { left -= xpNeed(lv); lv++; }
  return { level: lv, into: left, need: xpNeed(lv) };
}
// experiencia por mineral
export const ORE_XP = { coal_ore: 1, iron_ore: 2, deep_iron_ore: 2, gold_ore: 3, deep_gold_ore: 3, diamond_ore: 6, deep_diamond_ore: 6, jade_ore: 8, quartz_ore: 1 };

// ---------- flechas ----------
const arrowMats = {};
function arrowMesh() {
  const g = new THREE.Group();
  const m = (c) => arrowMats[c] || (arrowMats[c] = new THREE.MeshBasicMaterial({ color: c }));
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.7), m(0x9a6a3a));
  const tip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.1), m(0x8a8a90));
  tip.position.z = 0.38;
  const f1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.01, 0.14), m(0xd83a2a));
  const f2 = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.14, 0.14), m(0x2a6ad8));
  f1.position.z = f2.position.z = -0.3;
  g.add(shaft, tip, f1, f2);
  return g;
}

// flechas especiales (v6.1): la de fuego quema un rato, la envenenada envenena; el arco tira la primera clase que haya en la mochila
export const FLECHAS = { 327: null, 555: 'fuego', 556: 'veneno' };
export function flechaQueToca(inv) {
  // primero la de la ranura de al lado del arco (para escoger), después la primera que haya
  for (const i of [inv.selected + 1, inv.selected - 1]) { const s = inv.slots[i]; if (i >= 0 && i < 9 && s && s.id in FLECHAS && s.count > 0) return s.id; }
  for (const s of inv.slots) if (s && s.id in FLECHAS && s.count > 0) return s.id;
  return 0;
}
export class Arrow {
  constructor(game, x, y, z, vx, vy, vz, dmg, tipo = null) {
    this.g = game; this.tipo = tipo;
    this.pos = { x, y, z };
    this.vel = { x: vx, y: vy, z: vz };
    this.dmg = dmg;
    this.stuck = false;
    this.life = 0;
    this.dead = false;
    this.mesh = arrowMesh();
    game.scene.add(this.mesh);
    this.orient();
  }

  orient() {
    const v = this.vel;
    this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);
    if (this.stuck) return;
    this.mesh.rotation.set(0, 0, 0);
    this.mesh.rotation.order = 'YXZ';
    this.mesh.rotation.y = Math.atan2(v.x, v.z);
    this.mesh.rotation.x = -Math.atan2(v.y, Math.hypot(v.x, v.z));
  }

  update(dt) {
    const g = this.g, w = g.world, p = this.pos, v = this.vel;
    this.life += dt;
    if (this.stuck) {
      // se recoge al pasar encima
      const pl = g.player.body.pos;
      if (this.life > 0.5 && Math.hypot(pl.x - p.x, pl.y + 0.8 - p.y, pl.z - p.z) < 1.4) {
        if (g.mode === 'survival') g.inventory.add(this.item || ARROW, 1); // la de fuego vuelve de fuego
        g.audio.pickup();
        this.dead = true;
      }
      if (this.life > 60) this.dead = true;
      return;
    }
    // sub-pasos para no atravesar bloques ni criaturas
    const steps = Math.max(1, Math.ceil(Math.hypot(v.x, v.y, v.z) * dt / 0.25));
    const h = dt / steps;
    for (let s = 0; s < steps; s++) {
      v.y -= 16 * h;
      if (this.tipo === 'fuego' && s === 0 && Math.random() < 0.6) g.particles.spawn(p.x, p.y, p.z, [1, 0.7, 0.2], 0, 0.3, 0, 0.4, 0, true);
      const drag = Math.pow(0.99, h * 60);
      v.x *= drag; v.z *= drag;
      p.x += v.x * h; p.y += v.y * h; p.z += v.z * h;
      // criaturas
      for (const m of g.entities.mobs) {
        if (m.dying || m.kind.boat || m.kind.ghostly) continue;
        const b = m.body.pos, e = m.escHit || 1, hw = (m.kind.w * e) / 2 + 0.15;
        if (p.x > b.x - hw && p.x < b.x + hw && p.z > b.z - hw && p.z < b.z + hw && p.y > b.y && p.y < b.y + m.kind.h * e + 0.1) {
          const sp = Math.hypot(v.x, v.y, v.z);
          const dmg = Math.max(1, Math.round(this.dmg * Math.min(1.3, sp / 25)));
          let entro = false;
          g.golpeando = m; try { entro = m.hurt(dmg * g.damageBonus() * ventaja.tiro(g) * bonoDano(g, 'arco'), p.x - v.x, p.z - v.z) !== false; } finally { g.golpeando = null; }
          if (entro && m.type !== 'muneco') ganarMaestria(g, 'arco', dmg);
          if (entro && this.tipo && !m.dying) {
            m.data.veneno = Math.max(m.data.veneno || 0, this.tipo === 'fuego' ? 5 : 10);
            if (this.tipo === 'fuego') { m.data.fuegoT = (g.clock || 0) + 5; g.particles.burst(p.x, p.y, p.z, [[1, 0.6, 0.15], [1, 0.9, 0.3]], 14, 2.5); }
            else g.particles.burst(p.x, p.y, p.z, [[0.5, 0.85, 0.2]], 10, 1.5);
          }
          if (m.dying) g.killedMob(m);
          g.audio.play('flecha', { pos: p, vol: 0.6 });
          this.dead = true;
          return;
        }
      }
      // bloques
      if (w.solidoEn(p.x, p.y, p.z)) {
        p.x -= v.x * h * 0.6; p.y -= v.y * h * 0.6; p.z -= v.z * h * 0.6;
        this.stuck = true; this.life = 0;
        g.audio.play('flecha', { pos: p, vol: 0.5 });
        g.particles.burst(p.x, p.y, p.z, [[0.6, 0.5, 0.4]], 4, 1);
        this.orient();
        return;
      }
    }
    if (p.y < -10 || this.life > 12) this.dead = true;
    this.orient();
  }

  remove() {
    this.g.scene.remove(this.mesh);
    this.mesh.children.forEach((c) => c.geometry.dispose());
  }
}
