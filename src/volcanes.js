// Vida de los volcanes en el juego: el Arenal retumba y lanza bombas de lava, el Poás echa vapor por su laguna ácida.
import * as THREE from 'three';

const bombMat = new THREE.MeshBasicMaterial({ color: 0xff7a20 });
const bombGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);

export class LavaBomb {
  constructor(g, x, y, z) {
    this.g = g;
    this.pos = { x, y, z };
    const a = Math.random() * Math.PI * 2, s = 6 + Math.random() * 10;
    this.vel = { x: Math.cos(a) * s, y: 16 + Math.random() * 10, z: Math.sin(a) * s };
    this.mesh = new THREE.Mesh(bombGeo, bombMat);
    this.dead = false;
    this.t = 0;
    g.scene.add(this.mesh);
  }

  update(dt) {
    const g = this.g, p = this.pos, v = this.vel;
    this.t += dt;
    v.y -= 18 * dt;
    p.x += v.x * dt; p.y += v.y * dt; p.z += v.z * dt;
    this.mesh.position.set(p.x, p.y, p.z);
    this.mesh.rotation.x += dt * 4; this.mesh.rotation.z += dt * 3;
    g.particles.spawn(p.x, p.y, p.z, [1, 0.5 + Math.random() * 0.3, 0.1], (Math.random() - 0.5), 0.5, (Math.random() - 0.5), 0.8, 2, true);
    if (Math.random() < 0.5) g.particles.spawn(p.x, p.y, p.z, [0.25, 0.24, 0.23], 0, 0.6, 0, 2.5, -0.3);
    if (g.world.solidoEn(p.x, p.y, p.z) || this.t > 10) this.land();
  }

  land() {
    const g = this.g, p = this.pos;
    this.dead = true;
    g.particles.burst(p.x, p.y + 0.5, p.z, [[1, 0.5, 0.1], [1, 0.8, 0.3], [0.3, 0.28, 0.25]], 30, 5);
    g.audio.play('explode', { pos: p, vol: 0.5, pitch: 1.3 });
    const pl = g.player.body.pos;
    if (Math.hypot(pl.x - p.x, pl.y - p.y, pl.z - p.z) < 3 && g.mode === 'survival' && !g.player.effects.ignifugo) g.damagePlayer(4, p.x, p.z, 'Le cayó una bomba de lava del Arenal', false, true);
  }

  remove() { this.g.scene.remove(this.mesh); }
}

// cada segundo: erupciones, fumarolas y cumbre
export function tickVolcanoes(g, zn, d, st) {
  const p = g.player.body.pos;
  if (zn.kind === 'erupcion') {
    g.envVolcan = Math.max(g.envVolcan || 0, Math.max(0, 1 - d / zn.r));
    const col = g.world.gen.column(zn.x, zn.z);
    const top = (col.lavaTop || col.h) + 1;
    // humo constante sobre el cráter
    for (let k = 0; k < 6; k++) g.particles.spawn(zn.x + (Math.random() - 0.5) * 4, top + 2 + Math.random() * 3, zn.z + (Math.random() - 0.5) * 4, [0.32, 0.3, 0.29], (Math.random() - 0.5) * 0.8, 2.5 + Math.random() * 2, (Math.random() - 0.5) * 0.8, 9, -0.2);
    st.next = st.next ?? (g.clock || 0) + 20;
    if ((g.clock || 0) > st.next) {
      // ¡erupción! retumbo, fuente de lava y bombas
      st.next = (g.clock || 0) + 45 + Math.random() * 60;
      g.audio.play('explode', { pos: { x: zn.x, y: top, z: zn.z }, vol: 1.2, pitch: 0.5 });
      g.audio.play('explode', { ui: true, vol: Math.max(0.08, 0.6 * (1 - d / zn.r)), pitch: 0.4 });
      g.shake = Math.max(g.shake || 0, 0.6 * Math.max(0, 1 - d / 160));
      for (let k = 0; k < 60; k++) g.particles.spawn(zn.x + (Math.random() - 0.5) * 3, top + 1, zn.z + (Math.random() - 0.5) * 3, [1, 0.4 + Math.random() * 0.4, 0.1], (Math.random() - 0.5) * 8, 12 + Math.random() * 10, (Math.random() - 0.5) * 8, 2.5, 14, true);
      const n = 4 + Math.floor(Math.random() * 5);
      for (let k = 0; k < n; k++) (g.bombs ||= []).push(new LavaBomb(g, zn.x + 0.5, top + 2, zn.z + 0.5));
      if (d < zn.r) { g.ui.toast('🌋 ¡El Arenal hizo erupción!', 2200); g.achieve('erupcion', 'Vi una erupción del Arenal'); }
      // después de la erupción cae ceniza en los alrededores (hasta 300 bloques)
      if (d < 300) g.cenizaHasta = (g.clock || 0) + 50 + Math.random() * 40;
    }
  } else if (zn.kind === 'fumarola') {
    g.envVolcan = Math.max(g.envVolcan || 0, Math.max(0, 1 - d / 160) * 0.6);
    if (d > 140) return;
    // vapor que sale de la laguna ácida
    for (let k = 0; k < 10; k++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * zn.r;
      const x = Math.floor(zn.x + Math.cos(a) * r), z = Math.floor(zn.z + Math.sin(a) * r);
      const col = g.world.gen.column(x, z);
      if (!col.acidTop) continue;
      g.particles.spawn(x + Math.random(), col.acidTop + 1, z + Math.random(), [0.9, 0.93, 0.88], (Math.random() - 0.5) * 0.4, 1 + Math.random(), (Math.random() - 0.5) * 0.4, 5, -0.3);
    }
    if (d < zn.r + 12 && !st.seen) { st.seen = true; g.achieve('poas', 'Me asomé al cráter del Poás'); }
  } else if (zn.kind === 'cumbre' && d < zn.r && !st.seen && Math.abs(p.y - zn.y) < 8) {
    st.seen = true;
    g.ui.toast('⛰ ¡Llegó a la cima del Chirripó! Se ven los dos océanos', 3000);
    g.achieve('chirripo', 'Cumbre del Chirripó');
    g.audio.play('nivel', { ui: true, vol: 0.6 });
  }
}
