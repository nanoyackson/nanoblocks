// Armas legendarias (v7.8): las que se hacen con lo del jefe final.
// · Machete del Viento (557): un machete de jade con plumas del Rey Zopilote. Su golpe fuerte suelta un tajo de viento que vuela
//   14 bloques y corta todo lo que encuentra en el camino (pega el 70 % del golpe a cada uno), y aturde un poquito.
import * as THREE from 'three';
import { SOLID } from './blocks.js';

export const MACHETE_VIENTO = 557;
class Tajo {
  constructor(g, x, y, z, dx, dz, dmg) {
    this.g = g; this.pos = { x, y, z }; this.d = { x: dx, z: dz }; this.dmg = dmg; this.rec = 0; this.dead = false; this.tocados = new Set();
    const geo = new THREE.TorusGeometry(0.9, 0.06, 4, 18, Math.PI);
    this.mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    this.mesh.rotation.order = 'YXZ'; this.mesh.rotation.y = Math.atan2(dx, dz); this.mesh.rotation.z = Math.PI / 2; // la media luna parada, de frente al camino
    g.scene.add(this.mesh);
  }
  update(dt) {
    // de a pasitos, y la pared primero: no corta a través de los bloques
    let falta = 22 * dt;
    while (falta > 0 && !this.dead) { const v = Math.min(0.25, falta); falta -= v; this.paso(v); }
  }
  paso(v) {
    const g = this.g, p = this.pos;
    p.x += this.d.x * v; p.z += this.d.z * v; this.rec += v;
    if (this.rec > 14 || g.world.solidoEn(p.x, p.y, p.z)) { this.dead = true; return; }
    this.mesh.position.set(p.x, p.y, p.z);
    this.mesh.material.opacity = 0.8 * (1 - this.rec / 14);
    if (Math.random() < 0.15) g.particles.spawn(p.x + (Math.random() - 0.5), p.y + (Math.random() - 0.5) * 0.6, p.z + (Math.random() - 0.5), [0.85, 0.95, 1], 0, 0.2, 0, 0.4, 0, true);
    for (const m of g.entities.mobs) {
      if (m.dead || m.dying || this.tocados.has(m) || m.tamed || m.kind.boat || m.kind.ghostly || m.data.sigue || !(m.kind.hostile || m.data.provoked)) continue;
      const b = m.body.pos;
      if (Math.hypot(b.x - p.x, b.z - p.z) < (m.kind.w || 0.6) / 2 + 0.9 && p.y > b.y - 0.5 && p.y < b.y + (m.kind.h || 1.8) + 0.5) {
        this.tocados.add(m);
        let entro = false;
        g.golpeando = m; try { entro = m.hurt(this.dmg, p.x - this.d.x, p.z - this.d.z) !== false; } finally { g.golpeando = null; }
        if (entro) { m.stunT = Math.max(m.stunT || 0, 0.5); g.particles.burst(b.x, b.y + 1, b.z, [[0.85, 0.95, 1], [1, 1, 1]], 10, 2.5); }
        if (m.dying) g.killedMob(m);
      }
    }
    if (this.rec > 14 || g.world.solidoEn(p.x, p.y, p.z)) this.dead = true;
  }
  remove() { this.g.scene.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
}
// lo llama heavyAttack: el golpe fuerte del Machete del Viento también suelta el tajo
export function tajoDeViento(g, held, dmgBase) {
  if (!held || held.id !== MACHETE_VIENTO) return;
  const e = g.player.eye, d = g.player.lookDir(), h = Math.hypot(d.x, d.z) || 1;
  if (SOLID[g.world.getBlock(Math.floor(e.x + (d.x / h) * 0.8), Math.floor(e.y - 0.4), Math.floor(e.z + (d.z / h) * 0.8))]) return; // pegado a la pared no sale
  (g.proy3 ||= []).push(new Tajo(g, e.x + (d.x / h) * 0.8, e.y - 0.4, e.z + (d.z / h) * 0.8, d.x / h, d.z / h, dmgBase * 0.7));
  g.audio.play('swish', { ui: true, vol: 1, pitch: 0.55 });
  g.audio.play('rafaga', { ui: true, vol: 0.5, pitch: 1.3 });
  g.achieve('tajo_viento', 'El tajo del viento');
}
