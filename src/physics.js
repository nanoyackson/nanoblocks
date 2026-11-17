// Cuerpo físico con caja de colisión (AABB) contra la grilla de bloques.
import { SOLID, BLOCKS, FLUID, FLUID_LEVEL, BOXES, CAJA_DINAMICA } from './blocks.js';

const EPS = 1e-4;

export class Body {
  constructor(width, height) {
    this.w = width; // ancho en x y z
    this.h = height;
    this.pos = { x: 0, y: 0, z: 0 }; // centro de los pies
    this.vel = { x: 0, y: 0, z: 0 };
    this.onGround = false;
    this.inWater = false;
    this.inLava = false;
    this.headInWater = false;
    this.inWeb = false;
    this.flow = { x: 0, y: 0, z: 0 };
    this.fallStart = null;
    this.hitWall = false;
    this.gravity = 30;
  }

  // ¿Hay algún bloque sólido dentro de la caja dada?
  boxHitsSolid(world, minX, minY, minZ, maxX, maxY, maxZ) {
    const x0 = Math.floor(minX), x1 = Math.floor(maxX - EPS);
    const y0 = Math.floor(minY), y1 = Math.floor(maxY - EPS);
    const z0 = Math.floor(minZ), z1 = Math.floor(maxZ - EPS);
    for (let y = y0 - 1; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      const id = world.getBlock(x, y, z);
      if (!SOLID[id]) continue;
      const bx = CAJA_DINAMICA[id] ? world.cajas(x, y, z, id) : BOXES[id];
      if (!bx) { if (y >= y0) return true; continue; }
      for (const q of bx) {
        if (maxX > x + q[0] + EPS && minX < x + q[3] - EPS && maxY > y + q[1] + EPS && minY < y + q[4] - EPS && maxZ > z + q[2] + EPS && minZ < z + q[5] - EPS) return true;
      }
    }
    return false;
  }

  // Mueve sobre un eje y resuelve choques contra bloques.
  moveAxis(world, axis, d) {
    if (d === 0) return false;
    const hw = this.w / 2;
    const p = this.pos;
    // v12.1.3: en vertical, un bloque que la caja solo toca DE COSTADO no es suelo ni techo. Antes, al caer, los pies subían al tope de
    // cualquier bloque tocado: pegado de lado a una pared alta, subía 1–2 bloques por cuadro como un ascensor (la ráfaga de 100 m)
    const pieAntes = p.y, cabezaAntes = p.y + this.h;
    p[axis] += d;
    const minX = p.x - hw, maxX = p.x + hw, minY = p.y, maxY = p.y + this.h, minZ = p.z - hw, maxZ = p.z + hw;
    const x0 = Math.floor(minX), x1 = Math.floor(maxX - EPS);
    const y0 = Math.floor(minY), y1 = Math.floor(maxY - EPS);
    const z0 = Math.floor(minZ), z1 = Math.floor(maxZ - EPS);
    let hit = false;
    for (let y = y0 - 1; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      const id = world.getBlock(x, y, z);
      if (!SOLID[id]) continue;
      const bx = CAJA_DINAMICA[id] ? world.cajas(x, y, z, id) : BOXES[id]; // la puerta cerrada es una tabla, no un cubo
      if (bx) {
        // bloque con forma: chocar contra cada caja
        for (const q of bx) {
          const qx0 = x + q[0], qy0 = y + q[1], qz0 = z + q[2], qx1 = x + q[3], qy1 = y + q[4], qz1 = z + q[5];
          if (!(maxX > qx0 + EPS && minX < qx1 - EPS && maxY > qy0 + EPS && minY < qy1 - EPS && maxZ > qz0 + EPS && minZ < qz1 - EPS)) continue;
          if (axis === 'y' && (d < 0 ? qy1 > pieAntes + 0.05 : qy0 < cabezaAntes - 0.05)) continue;
          hit = true;
          if (axis === 'x') p.x = d > 0 ? Math.min(p.x, qx0 - hw - EPS) : Math.max(p.x, qx1 + hw + EPS);
          else if (axis === 'z') p.z = d > 0 ? Math.min(p.z, qz0 - hw - EPS) : Math.max(p.z, qz1 + hw + EPS);
          else p.y = d > 0 ? Math.min(p.y, qy0 - this.h - EPS) : Math.max(p.y, qy1 + EPS);
        }
        continue;
      }
      if (y < y0) continue;
      if (axis === 'y' && (d < 0 ? y + 1 > pieAntes + 0.05 : y < cabezaAntes - 0.05)) continue;
      hit = true;
      if (axis === 'x') p.x = d > 0 ? Math.min(p.x, x - hw - EPS) : Math.max(p.x, x + 1 + hw + EPS);
      else if (axis === 'z') p.z = d > 0 ? Math.min(p.z, z - hw - EPS) : Math.max(p.z, z + 1 + hw + EPS);
      else p.y = d > 0 ? Math.min(p.y, y - this.h - EPS) : Math.max(p.y, y + 1 + EPS);
    }
    return hit;
  }

  // mover en horizontal; si choca con algo bajo (losa, escalón), sube medio bloque
  moveStep(world, axis, d, canStep) {
    if (!this.moveAxis(world, axis, d)) return false;
    if (!canStep) return true;
    const p = this.pos, hw = this.w / 2;
    const sx = p.x, sy = p.y, sz = p.z;
    if (this.boxHitsSolid(world, sx - hw, sy + 0.55, sz - hw, sx + hw, sy + 0.55 + this.h, sz + hw)) return true;
    p.y += 0.55;
    if (this.moveAxis(world, axis, d)) { p.x = sx; p.y = sy; p.z = sz; return true; }
    this.moveAxis(world, 'y', -0.56);
    return false;
  }

  hasGroundUnder(world, x, z) {
    const hw = this.w / 2;
    return this.boxHitsSolid(world, x - hw, this.pos.y - 0.6, z - hw, x + hw, this.pos.y - EPS, z + hw);
  }

  updateWaterState(world) {
    const p = this.pos;
    const feet = world.getBlock(Math.floor(p.x), Math.floor(p.y + 0.1), Math.floor(p.z));
    const waist = world.getBlock(Math.floor(p.x), Math.floor(p.y + this.h * 0.5), Math.floor(p.z));
    const head = world.getBlock(Math.floor(p.x), Math.floor(p.y + this.h * 0.9), Math.floor(p.z));
    this.inWater = FLUID[feet] === 1 || FLUID[waist] === 1;
    this.inLava = FLUID[feet] === 2 || FLUID[waist] === 2;
    this.headInWater = FLUID[head] === 1;
    this.inWeb = BLOCKS[feet].sticky || BLOCKS[waist].sticky;
    // corriente: el agua empuja hacia donde baja su nivel (y hacia abajo en las cascadas)
    this.flow.x = 0; this.flow.y = 0; this.flow.z = 0;
    const cell = FLUID[waist] ? waist : feet;
    if (FLUID[cell] && !BLOCKS[cell].source) {
      const fx = Math.floor(p.x), fy = Math.floor(p.y + (FLUID[waist] ? this.h * 0.5 : 0.1)), fz = Math.floor(p.z);
      const lv = FLUID_LEVEL[cell];
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = world.getBlock(fx + dx, fy, fz + dz);
        let d = 0;
        if (FLUID[n] === FLUID[cell]) d = lv - FLUID_LEVEL[n];
        else if (!SOLID[n]) d = lv;
        this.flow.x += dx * d; this.flow.z += dz * d;
      }
      const l = Math.hypot(this.flow.x, this.flow.z);
      if (l > 0) { this.flow.x /= l; this.flow.z /= l; }
      if (BLOCKS[cell].falling) this.flow.y = -1;
    }
  }

  // v12.1.3: ¿la caja entera está metida en algún bloque?
  atascado(world, x = this.pos.x, y = this.pos.y, z = this.pos.z) {
    const hw = this.w / 2 - 0.002;
    return this.boxHitsSolid(world, x - hw, y + 0.002, z - hw, x + hw, y + this.h - 0.002, z + hw);
  }
  // si quedó adentro de un bloque (lo empujó algo, o un bloque apareció encima), al hueco libre MÁS CERCANO: primero a los lados
  // (hasta 1 bloque), después arriba (hasta 2 bloques) y si no hay, a la última posición segura. Devuelve true si tuvo que moverlo
  desatascar(world) {
    const p = this.pos;
    if (!this.atascado(world)) { const S = (this.seguro ||= { x: 0, y: 0, z: 0 }); S.x = p.x; S.y = p.y; S.z = p.z; return false; }
    const lados = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]];
    for (let r = 0.05; r <= 1.001; r += 0.05) for (const [dx, dz] of lados) {
      if (!this.atascado(world, p.x + dx * r, p.y, p.z + dz * r)) { p.x += dx * r; p.z += dz * r; this.fallStart = null; return true; }
    }
    for (let dy = 0.25; dy <= 2.001; dy += 0.25) {
      if (!this.atascado(world, p.x, p.y + dy, p.z)) { p.y += dy; this.vel.y = Math.max(0, this.vel.y); this.fallStart = null; return true; }
    }
    const S = this.seguro;
    if (S && Math.hypot(S.x - p.x, S.y - p.y, S.z - p.z) < 6 && !this.atascado(world, S.x, S.y, S.z)) { p.x = S.x; p.y = S.y; p.z = S.z; this.vel.x = 0; this.vel.y = 0; this.vel.z = 0; this.fallStart = null; return true; }
    return false; // de verdad enterrado (un teletransporte): lo resuelve la salida de llegada de game.js
  }

  // Integra la física un paso. opts: { flying, sneak }
  step(world, dt, opts = {}) {
    this.desatascar(world);
    this.updateWaterState(world);
    const v = this.vel;
    if (!opts.flying) {
      if (this.inWater || this.inLava) {
        const thick = this.inLava ? 0.15 : 0.35;
        v.y -= this.gravity * (this.inLava ? 0.1 : 0.18) * dt;
        v.y *= Math.pow(thick, dt);
        if (v.y < -3) v.y = -3;
        // corriente
        v.x += this.flow.x * 7 * dt; v.z += this.flow.z * 7 * dt;
        if (this.flow.y < 0) v.y -= 6 * dt;
        if (this.inLava) { v.x *= Math.pow(0.05, dt); v.z *= Math.pow(0.05, dt); }
      } else if (this.enCuerda) { // v13.4.3 (CC4): colgado de una cuerda; sube y baja lo manda el jugador, no cae
        v.y *= Math.pow(0.002, dt); v.x *= Math.pow(0.02, dt); v.z *= Math.pow(0.02, dt);
      } else if (this.inWeb) {
        v.y = Math.max(v.y - this.gravity * dt * 0.05, -0.6);
        v.x *= Math.pow(0.001, dt); v.z *= Math.pow(0.001, dt);
      } else {
        v.y -= this.gravity * dt;
        if (v.y < -60) v.y = -60;
      }
    }
    // sub-pasos para que nada atraviese bloques
    const dist = Math.max(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z)) * dt;
    const steps = Math.max(1, Math.ceil(dist / 0.35));
    const sdt = dt / steps;
    const wasOnGround = this.onGround;
    this.onGround = false;
    this.hitWall = false;
    let landedSpeed = 0;
    for (let s = 0; s < steps; s++) {
      const vy = v.y;
      if (this.moveAxis(world, 'y', v.y * sdt)) {
        if (vy < 0) { this.onGround = true; landedSpeed = Math.min(landedSpeed, vy); }
        v.y = 0;
      }
      // al agacharse no se cae del borde
      let dx = v.x * sdt, dz = v.z * sdt;
      if (opts.sneak && (wasOnGround || this.onGround) && !opts.flying) {
        if (dx !== 0 && !this.hasGroundUnder(world, this.pos.x + dx, this.pos.z)) { dx = 0; v.x = 0; }
        if (dz !== 0 && !this.hasGroundUnder(world, this.pos.x + dx, this.pos.z + dz)) { dz = 0; v.z = 0; }
      }
      const canStep = !opts.flying && (wasOnGround || this.onGround) && !this.inWater;
      if (this.moveStep(world, 'x', dx, canStep)) { v.x = 0; this.hitWall = true; }
      if (this.moveStep(world, 'z', dz, canStep)) { v.z = 0; this.hitWall = true; }
    }
    if (!this.onGround && this.boxHitsSolid(world, this.pos.x - this.w / 2 + 0.01, this.pos.y - 0.05, this.pos.z - this.w / 2 + 0.01, this.pos.x + this.w / 2 - 0.01, this.pos.y, this.pos.z + this.w / 2 - 0.01) && v.y <= 0) {
      this.onGround = true;
    }
    // distancia de caída para el daño
    let fallDamage = 0;
    if (opts.flying || this.inWater) this.fallStart = null;
    else if (!this.onGround) {
      if (this.fallStart === null || this.pos.y > this.fallStart) this.fallStart = this.pos.y;
    } else if (this.fallStart !== null) {
      const fell = this.fallStart - this.pos.y;
      if (fell > 3.4) fallDamage = Math.floor(fell - 3);
      this.fallStart = null;
    }
    return { fallDamage, landedSpeed };
  }

  blockUnderFeet(world) {
    return world.getBlock(Math.floor(this.pos.x), Math.floor(this.pos.y - 0.1), Math.floor(this.pos.z));
  }

  touchingBlock(world, pred) {
    const hw = this.w / 2 + 0.05;
    const p = this.pos;
    const x0 = Math.floor(p.x - hw), x1 = Math.floor(p.x + hw);
    const y0 = Math.floor(p.y - 0.05), y1 = Math.floor(p.y + this.h);
    const z0 = Math.floor(p.z - hw), z1 = Math.floor(p.z + hw);
    for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      if (pred(BLOCKS[world.getBlock(x, y, z)])) return true;
    }
    return false;
  }

  intersectsBlock(bx, by, bz) {
    const hw = this.w / 2;
    const p = this.pos;
    return p.x + hw > bx && p.x - hw < bx + 1 && p.y + this.h > by && p.y < by + 1 && p.z + hw > bz && p.z - hw < bz + 1;
  }
}
