// Bombetas: cohetes de fiesta que suben silbando y revientan en colores (a veces los de la bandera).
// El estallido espanta a los animales cercanos.
import * as THREE from 'three';
import { SOLID } from './blocks.js';

export const BOMBETA = 374;
const PALETTES = [
  [[0.1, 0.25, 0.85], [1, 1, 1], [0.9, 0.1, 0.12]], // la bandera
  [[1, 0.85, 0.2], [1, 0.5, 0.1], [1, 1, 0.7]],
  [[0.3, 1, 0.4], [0.2, 0.9, 1], [1, 1, 1]],
  [[1, 0.3, 0.8], [0.7, 0.3, 1], [1, 0.8, 1]],
];

export class Rocket {
  constructor(g, x, y, z) {
    this.g = g;
    this.pos = { x, y, z };
    this.vel = { x: (Math.random() - 0.5) * 1.5, y: 16 + Math.random() * 4, z: (Math.random() - 0.5) * 1.5 };
    this.fuse = 1.1 + Math.random() * 0.5;
    this.t = 0;
    this.dead = false;
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.12), new THREE.MeshBasicMaterial({ color: 0xd82a2a }));
    g.scene.add(this.mesh);
    g.audio.play('mecha', { pos: this.pos, vol: 0.5 });
    setTimeout(() => { if (!this.dead) g.audio.play('silbido', { pos: this.pos, vol: 0.8, vary: 0.1 }); }, 250);
  }

  update(dt) {
    const g = this.g, p = this.pos, v = this.vel;
    this.t += dt;
    if (this.t < 0.25) { g.particles.spawn(p.x, p.y + 0.1, p.z, [1, 0.8, 0.3], (Math.random() - 0.5), 1.5, (Math.random() - 0.5), 0.3, 0, true); this.mesh.position.set(p.x, p.y, p.z); return; }
    v.y += 4 * dt;
    p.x += v.x * dt; p.y += v.y * dt; p.z += v.z * dt;
    this.mesh.position.set(p.x, p.y, p.z);
    // estela de chispas
    for (let k = 0; k < 3; k++) g.particles.spawn(p.x, p.y - 0.2, p.z, [1, 0.6 + Math.random() * 0.3, 0.2], (Math.random() - 0.5) * 1.2, -2 - Math.random() * 2, (Math.random() - 0.5) * 1.2, 0.5, 6, true);
    if (this.t > this.fuse || SOLID[g.world.getBlock(Math.floor(p.x), Math.floor(p.y + 0.3), Math.floor(p.z))]) this.explode();
  }

  explode() {
    const g = this.g, p = this.pos;
    this.dead = true;
    const pal = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    const kind = Math.floor(Math.random() * 3);
    const n = 170;
    for (let i = 0; i < n; i++) {
      let vx, vy, vz;
      if (kind === 1) { const a = (i / n) * Math.PI * 2; vx = Math.cos(a) * 9; vy = (Math.random() - 0.5) * 1.5; vz = Math.sin(a) * 9; } // anillo
      else {
        // esfera (o palmera que cae más)
        const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u);
        const s = 7 + Math.random() * 3;
        vx = r * Math.cos(a) * s; vy = u * s + (kind === 2 ? 3 : 0); vz = r * Math.sin(a) * s;
      }
      g.particles.spawn(p.x, p.y, p.z, pal[i % pal.length], vx, vy, vz, 1.4 + Math.random() * 0.6, kind === 2 ? 9 : 3, true);
    }
    g.audio.play('bombeta', { pos: p, vol: 1.2, vary: 0.1 });
    // los animales se asustan
    for (const m of g.entities.mobs) {
      if (m.kind.legend || m.kind.boat || m.type === 'vecino') continue;
      if (Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < 26) m.panic = 5;
      // a las Sombras el estallido las deja atontadas un momento: en un apuro sirve para respirar
      if (m.kind.hostile && !m.kind.boss && !m.dead && Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < 11) {
        m.stunT = Math.max(m.stunT || 0, 2.5);
        if (g.mode === 'survival' && !g.meta.bombetaAviso) { g.meta.bombetaAviso = true; g.ui.toast('🎆 ¡A las Sombras no les gusta el estallido! Se quedan atontadas un momento', 3000); }
      }
    }
    g.achieve('bombeta', '¡Qué viva la fiesta!');
  }

  remove() {
    this.g.scene.remove(this.mesh);
    this.mesh.geometry.dispose(); this.mesh.material.dispose();
  }
}
