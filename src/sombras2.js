// Sombras nuevas (desde el día 3): la Sombra hondera, que tira piedras desde lejos y se aleja si uno se acerca,
// y la Sombra con escudo, que ataja los golpes de frente (hay que rodearla o pegarle un golpe cargado) y esquiva.
import { VALOR, desglose, esPlata, fmtColones } from './plata.js';
import { avisoCaida, apagarAviso, atacar, brilloAmago } from './golpes.js';
import * as THREE from 'three';
import { SOLID, ITEMS, itemName, BLOCKS, BLOCK_BY_KEY as K, AIR } from './blocks.js';
import { esUnico } from './inventory.js';
import { Pieza } from './lowpoly.js';

const mat = (c) => new THREE.MeshBasicMaterial({ color: c });
const GRAV = 30; // la de physics.js
// una vuelta cerrada alrededor del cuerpo (fajas, cintas)
const vuelta = (r, y, n = 12) => Array.from({ length: n + 1 }, (_, i) => [Math.cos((i / n) * Math.PI * 2) * r, y, Math.sin((i / n) * Math.PI * 2) * r]);

// piedras que tiran las honderas
export class Piedra {
  constructor(g, x, y, z, v, causa = 'Una Sombra le tiró una piedra', hojas = false) {
    this.g = g; this.pos = { x, y, z }; this.vel = v; this.life = 0; this.dead = false; this.causa = causa; this.hojas = hojas;
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.2), mat(0x7a7a78));
    g.scene.add(this.mesh);
  }
  update(dt) {
    const g = this.g, p = this.pos, v = this.vel;
    this.life += dt;
    v.y -= 14 * dt;
    p.x += v.x * dt; p.y += v.y * dt; p.z += v.z * dt;
    this.mesh.position.set(p.x, p.y, p.z);
    this.mesh.rotation.x += dt * 9; this.mesh.rotation.z += dt * 7;
    if (Math.random() < dt * 30) g.particles.spawn(p.x, p.y, p.z, [0.75, 0.75, 0.72], 0, 0, 0, 0.3, 0); // la estela, para verla venir
    const pl = g.player.body.pos;
    if (Math.abs(p.x - pl.x) < 0.45 && Math.abs(p.z - pl.z) < 0.45 && p.y > pl.y && p.y < pl.y + 1.85) {
      g.damagePlayer(2, p.x - v.x, p.z - v.z, this.causa, false, true); // a distancia pega menos que de cerca: si no, mataba más que las demás (con escudo se para)
      g.audio.play('dig.stone', { pos: p, vol: 0.7 });
      this.dead = true; return;
    }
    const bq = g.world.getBlock(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z));
    if ((SOLID[bq] && !(this.hojas && BLOCKS[bq] && BLOCKS[bq].leafy)) || this.life > 5) {
      g.particles.burst(p.x, p.y, p.z, [[0.5, 0.5, 0.48]], 5, 1.2);
      g.audio.play('dig.stone', { pos: p, vol: 0.4 });
      this.dead = true;
    }
  }
  remove() { this.g.scene.remove(this.mesh); this.mesh.geometry.dispose(); }
}
export function tickPiedras(g, dt) {
  if (!g.piedras) return;
  g.piedras = g.piedras.filter((s) => { s.update(dt); if (s.dead) { s.remove(); return false; } return true; });
}

const ANTORCHAS = new Set(['torch', 'wall_torch0', 'wall_torch1', 'wall_torch2', 'wall_torch3'].map((k) => K[k]).filter(Boolean));
function buscarAntorcha(g, m) {
  const w = g.world, x0 = Math.floor(m.body.pos.x), y0 = Math.floor(m.body.pos.y), z0 = Math.floor(m.body.pos.z);
  // los pueblos, la Grieta y el ruedo tienen quien les cuide la luz
  const v = g.nearestVillage(x0, z0), Q = g.meta.anselmo && g.meta.anselmo.pos;
  if ((v && v.dist < (v.v.R || 100)) || g.arena || (Q && Math.hypot(Q.x - x0, Q.z - z0) < 20)) return null;
  let mejor = null, bd = 1e9;
  for (let dx = -7; dx <= 7; dx++) for (let dz = -7; dz <= 7; dz++) for (let dy = -2; dy <= 4; dy++) {
    if (!ANTORCHAS.has(w.getBlock(x0 + dx, y0 + dy, z0 + dz))) continue;
    const d = dx * dx + dz * dz + dy * dy;
    if (d < bd) { bd = d; mejor = { x: x0 + dx, y: y0 + dy, z: z0 + dz }; }
  }
  return mejor;
}
// cada Sombra se reconoce de lejos: el color de los ojos (lo único que se ve de noche) y algo en la silueta
function ojos(m, color, glow = color) {
  const u = m.userData;
  if (u.eyes) u.eyes.children.forEach((e) => e.material.color.setHex(color));
  if (u.head) u.head.children.forEach((o) => { if (o.isMesh && o.geometry.type === 'PlaneGeometry') o.material.color.setHex(glow); });
}
export function variantesSombra(SOMBRA) {
  const hondera = {
    ...SOMBRA, name: 'Sombra hondera', health: 12, speed: 2.1, attack: 2, drops: [[257, 0, 2], [271, 0, 1]], brazoPropio: true, // el brazo de la honda lo mueve su animate
    build() {
      const m = SOMBRA.build();
      const u = m.userData;
      // honda de cuero en la mano derecha y bolsa de piedras
      const honda = new THREE.Group(); honda.position.set(0, -0.6, 0.05);
      const H = new Pieza();
      for (const s of [-1, 1]) H.tubo(0x6a4a2a, [[s * 0.02, 0.2, 0], [s * 0.05, -0.02, 0], [0, -0.22, 0]], [0.016, 0.014, 0.014], { lados: 4 });
      H.bulto(0x8a6a3a, 0.08, 0.05, 0.07, { y: -0.24, det: 2, grano: 0.2 });
      honda.add(H.malla());
      u.arms[1].add(honda);
      const Sa = new Pieza();
      Sa.bulto(0x6a5a3a, 0.16, 0.2, 0.13, { det: 2, grano: 0.24 });
      Sa.tubo(0x4a3a22, [[0, 0.18, 0], [0, 0.26, 0.02]], [0.06, 0.09], { lados: 6, pasos: 1 });
      for (const [x, z] of [[-0.05, 0.02], [0.05, 0.05]]) Sa.bulto(0x8a8a86, 0.05, 0.045, 0.05, { x, y: 0.3, z, det: 1 });
      const saco = Sa.malla(); saco.position.set(-0.3, 0.9, -0.3); u.body.add(saco);
      u.honda = honda;
      ojos(m, 0x8aff5a, 0x5ad030);
      // pañuelo de bandido sobre la boca y faja color tierra
      const Pa = new Pieza();
      Pa.bulto(0x9a6a32, 0.24, 0.13, 0.09, { y: -0.17, z: 0.24, det: 2, grano: 0.24, forma: (v) => { if (v.y < 0) v.y *= 1.5 - Math.abs(v.x) * 0.9; } });
      u.head.add(Pa.malla());
      const Fa = new Pieza();
      Fa.tubo(0xb07a3a, vuelta(0.5, 0.64), [0.07, 0.07], { lados: 5, pasos: 2, grano: 0.2 });
      Fa.tubo(0xb07a3a, [[0.3, 0.62, 0.36], [0.36, 0.36, 0.42], [0.34, 0.14, 0.44]], [0.07, 0.06, 0.02], { lados: 4 });
      u.body.add(Fa.malla());
      return m;
    },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c;
      if (g.mode !== 'survival' || !g.player.alive || distP > 22) return false;
      m.targetYaw = Math.atan2(dxp, dzp);
      m.data.tiro = (m.data.tiro ?? 1.5) - dt;
      m.data.gira = Math.max(0, (m.data.gira || 0) - dt);
      // mantiene la distancia: ni muy cerca ni muy lejos
      const b = m.body.pos;
      if (distP < 5) m.goTo(b.x - dxp * 2, b.z - dzp * 2, 1.2);
      else if (distP > 13) m.goTo(pl.x, pl.z, 1);
      else m.moving = false;
      if ((m.data.carga || 0) > 0) {
        m.data.carga -= dt; m.moving = false;
        if (!m.data.brilloHonda && m.data.carga < 0.26) { m.data.brilloHonda = true; brilloAmago(m, g); }
        if (Math.random() < dt * 6) g.audio.play('swish', { pos: m.soundPos(), vol: 0.25, pitch: 1.6 }); // la honda zumba
        if (m.data.carga > 0) return true;
        m.data.gira = 0.3;
        // tiro con parábola, apuntando un poquito adelante de donde va el jugador
        const pv = g.player.body.vel, t = distP / 14;
        const tx = pl.x + pv.x * t * 0.6, tz = pl.z + pv.z * t * 0.6, ty = pl.y + 1.2;
        const sx = b.x, sy = b.y + 1.6, sz = b.z;
        const dx = tx - sx, dz = tz - sz, dh = Math.hypot(dx, dz) || 1;
        const vh = 14, tt = dh / vh, vy = (ty - sy) / tt + 0.5 * 14 * tt;
        (g.piedras ||= []).push(new Piedra(g, sx, sy, sz, { x: (dx / dh) * vh, y: vy, z: (dz / dh) * vh }));
        g.audio.play('arco', { pos: m.soundPos(), vol: 0.6, pitch: 1.5 });
        return true;
      }
      if (m.data.tiro <= 0 && distP > 3 && distP < 16) { m.data.tiro = 2.4 + Math.random(); m.data.carga = 0.7; m.data.brilloHonda = false; }
      return true;
    },
    // cargando: el brazo arriba y la honda dando vueltas sobre la cabeza; al soltar, el brazo se va para adelante
    animate(m, dt, u) {
      if (!u.arms) return;
      const carga = (m.data.carga || 0) > 0;
      u.arms[1].rotation.x = carga ? -2.9 : m.data.gira > 0 ? -1.1 : -0.3;
      u.arms[1].rotation.z = carga ? Math.sin(m.t * 16) * 0.35 : 0;
      if (u.honda) u.honda.rotation.y = carga ? m.t * 22 : 0;
    },
  };
  const escudo = {
    ...SOMBRA, name: 'Sombra con escudo', health: 22, speed: 2, attack: 4, drops: [[257, 1, 2], [258, 0, 1]],
    build() {
      const m = SOMBRA.build();
      const u = m.userData;
      // escudo de tablas viejas con un cráneo pintado
      const esc = new THREE.Group(); esc.position.set(0.05, -0.35, 0.22);
      const Es = new Pieza();
      Es.bulto(0x5a3e22, 0.36, 0.46, 0.07, { det: 4, grano: 0.2, pinta: (q) => {
        if (Math.hypot(q.x, q.y) > 0.86) return 0x55555c; // el aro de hierro
        return Math.floor((q.x + 1) * 3.5) % 2 ? 0x4a3018 : null; // las tablas
      } });
      Es.bulto(0xd8d0c0, 0.12, 0.13, 0.04, { y: 0.05, z: 0.07, det: 2, amb: 0.85, pinta: (q) => (q.z > 0.3 && Math.hypot(Math.abs(q.x) - 0.42, q.y - 0.1) < 0.28 ? 0x141414 : null) });
      for (const [x, y] of [[-0.24, 0.3], [0.24, 0.3], [-0.24, -0.3], [0.24, -0.3]]) Es.bulto(0x7a7a84, 0.03, 0.03, 0.03, { x, y, z: 0.06, det: 1, brillo: 1 });
      esc.add(Es.malla());
      u.arms[0].add(esc);
      u.escudo = esc;
      ojos(m, 0xff3a2a, 0xd02010);
      // casco de hierro abollado con cresta: se ve más pesada
      const Ca = new Pieza();
      Ca.bulto(0x6a6a74, 0.39, 0.36, 0.44, { y: 0.2, z: -0.09, det: 3, brillo: 1, forma: (v) => { if (v.y < -0.1) v.y = -0.1; }, pinta: (q) => (q.y < 0.05 ? 0x4a4a52 : null) });
      Ca.tubo(0x8a2020, [[0, 0.54, 0.22], [0, 0.68, -0.08], [0, 0.6, -0.46]], [0.06, 0.1, 0.03], { lados: 4, grano: 0.2 });
      u.head.add(Ca.malla());
      const Ho = new Pieza();
      for (const sx of [-1, 1]) { Ho.bulto(0x5a5a64, 0.2, 0.13, 0.2, { x: sx * 0.42, y: 1.38, z: 0.05, det: 2, brillo: 1, forma: (v) => { if (v.y < 0) v.y *= 0.4; } }); Ho.tubo(0x7a7a84, [[sx * 0.46, 1.48, 0.05], [sx * 0.54, 1.68, 0.05]], [0.05, 0.004], { lados: 5, pasos: 1, brillo: 1 }); }
      u.body.add(Ho.malla());
      return m;
    },
    brain(m, dt, c) {
      const { g, distP } = c;
      m.data.esquiva = Math.max(0, (m.data.esquiva || 0) - dt);
      // a veces se hace a un lado de un brinco
      if (g.mode === 'survival' && distP < 4 && m.data.esquiva <= 0 && m.body.onGround && Math.random() < dt * 0.6) {
        m.data.esquiva = 3;
        const lado = Math.random() < 0.5 ? 1 : -1, l = distP || 1;
        m.body.vel.x += (-c.dzp / l) * 6 * lado; m.body.vel.z += (c.dxp / l) * 6 * lado; m.body.vel.y = 4;
      }
      return false;
    },
    // ataja los golpes que vienen de frente (salvo los cargados)
    onHurt(m, g, dmg) {
      const p = g.player.body.pos, b = m.body.pos;
      const haciaJug = Math.atan2(p.x - b.x, p.z - b.z);
      let d = haciaJug - m.yaw;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      const pesado = g.golpeCargado || dmg >= 9 || g.rompeEscudo;
      if (Math.abs(d) < 1.0 && !pesado) {
        g.audio.play('dig.wood', { pos: m.soundPos(), vol: 0.9, pitch: 0.8 });
        g.particles.burst(b.x, b.y + 1.2, b.z, [[0.6, 0.45, 0.25], [1, 0.9, 0.5]], 8, 2);
        if (!g.meta.escudoAviso) { g.meta.escudoAviso = true; g.ui.toast('🛡 ¡Lo atajó con el escudo! Rodéela o péguele un golpe cargado', 2600); }
        m.attackCd = Math.max(m.attackCd, 0.3);
        return false;
      }
      if (pesado && Math.abs(d) < 1.0) g.achieve('rompe_escudos', 'Rompe escudos');
      return true;
    },
  };
  // la ladrona: no pega casi nada, le roba algo de la mochila y sale corriendo. Si la alcanza, lo recupera.
  const ladrona = {
    ...SOMBRA, name: 'Sombra ladrona', health: 10, speed: 3.4, attack: 1, drops: [[257, 0, 1]], xp: 8,
    build() {
      const m = SOMBRA.build();
      const Sq = new Pieza();
      Sq.bulto(0x7a6a3a, 0.21, 0.23, 0.17, { det: 3, grano: 0.24, forma: (v) => { if (v.y > 0) { v.x *= 1 - v.y * 0.4; v.z *= 1 - v.y * 0.4; } } });
      Sq.tubo(0x4a3a22, [[0, 0.2, 0], [0, 0.28, 0]], [0.07, 0.11], { lados: 7, pasos: 1 });
      m.userData.saco = Sq.malla();
      m.userData.saco.position.set(0, 0.95, -0.28);
      m.userData.body.add(m.userData.saco);
      ojos(m, 0xffe040, 0xffc020);
      // el antifaz blanco del ladrón: dos aros alrededor de los ojos y sus cintas para atrás
      const An = new Pieza();
      for (const s of [-1, 1]) {
        const aro = Array.from({ length: 11 }, (_, i) => [s * 0.085 + Math.cos((i / 10) * Math.PI * 2) * 0.075, 0.0 + Math.sin((i / 10) * Math.PI * 2) * 0.06, 0.28]);
        An.tubo(0xf4f4f4, aro, [0.024, 0.024], { lados: 4, pasos: 2, amb: 0.95 });
        An.tubo(0xf4f4f4, [[s * 0.16, 0, 0.27], [s * 0.3, 0.02, 0.14], [s * 0.34, 0.02, -0.1]], [0.02, 0.02, 0.016], { lados: 4, amb: 0.95 });
      }
      An.tubo(0xf4f4f4, [[-0.02, 0.01, 0.29], [0.02, 0.01, 0.29]], [0.02, 0.02], { lados: 4, pasos: 1, amb: 0.95 });
      m.userData.head.add(An.malla());
      // monedas asomándose
      const Mo = new Pieza();
      for (let i = 0; i < 4; i++) Mo.bulto(0xffd030, 0.05, 0.05, 0.012, { x: -0.09 + i * 0.06, y: 0.27 - (i % 2) * 0.03, z: 0.02 + i * 0.015, det: 1, amb: 1, brillo: 1 });
      const monedas = Mo.malla(); monedas.userData.glow = true; m.userData.saco.add(monedas);
      return m;
    },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp } = c;
      const b = m.body.pos;
      if (m.data.robado) {
        m.data.huye -= dt;
        const l = distP || 1;
        m.goTo(b.x - (dxp / l) * 6, b.z - (dzp / l) * 6, 1.45);
        if (m.data.huye <= 0) {
          g.particles.burst(b.x, b.y + 1, b.z, m.kind.particle, 16, 2);
          if (distP < 60) g.ui.toast(m.data.robado.plata ? `🎭 Se le fue la ladrona con ${fmtColones(m.data.robado.plata)}` : `🎭 Se le fue la ladrona con ${m.data.robado.n} ${itemName(m.data.robado.id)}`, 3200);
          m.data.robado = null;
          m.dead = true;
        }
        return true;
      }
      if (g.mode !== 'survival' || !g.player.alive || distP > 30) return false;
      if (distP < 1.5) { if (!robar(g, m)) return false; return true; }
      m.goTo(c.pl.x, c.pl.z, 1.15);
      return true;
    },
  };
  // la grande: lenta y con mucha vida. Pega duro y suelta esencia, así que se puede salir a buscarla.
  const grande = {
    ...SOMBRA, name: 'Sombra grande', w: (SOMBRA.w || 0.6) * 1.4, h: (SOMBRA.h || 1.9) * 1.45, health: 60, speed: 2.1, attack: 6, drops: [[499, 1, 2], [257, 1, 3]], xp: 25,
    build() {
      const m = SOMBRA.build();
      m.userData.babyScale = 1.5;
      ojos(m, 0xff2050, 0xa00030);
      const Cu = new Pieza();
      for (const sx of [-1, 1]) Cu.tubo(0x2a2024, [[sx * 0.22, 0.2, -0.02], [sx * 0.46, 0.34, 0], [sx * 0.54, 0.62, 0.06], [sx * 0.42, 0.84, 0.14]], [0.1, 0.08, 0.05, 0.006], { lados: 6, brillo: 0.6, pinta: (q) => { const f = q.x * 6 - Math.floor(q.x * 6); return f < 0.25 ? 0x3e3238 : null; } });
      m.userData.head.add(Cu.malla());
      return m;
    },
  };
  // la apagadora: no viene por uno, viene por la luz. Busca la antorcha más cercana y la apaga, y después sí pelea.
  const apagadora = {
    ...SOMBRA, name: 'Sombra apagadora', health: 12, attack: 2, speed: 3.4, xp: 12,
    brain(m, dt, c) {
      const g = c.g;
      m.data.buscaT = (m.data.buscaT || 0) - dt;
      if (m.data.buscaT <= 0) {
        m.data.buscaT = 1.5;
        m.data.antorcha = buscarAntorcha(g, m);
      }
      const q = m.data.antorcha;
      // si le pegan, o no puede llegar, pelea como cualquiera
      if (!q || m.data.provoked || (m.data.sinLlegar || 0) > 8) return false;
      const d = Math.hypot(q.x + 0.5 - m.body.pos.x, q.z + 0.5 - m.body.pos.z);
      m.data.sinLlegar = (m.data.sinLlegar || 0) + dt;
      if (d > 1.6 || Math.abs(q.y - m.body.pos.y) > 3) { m.goTo(q.x + 0.5, q.z + 0.5, 1); return true; }
      m.data.sinLlegar = 0;
      if (ANTORCHAS.has(g.world.getBlock(q.x, q.y, q.z))) {
        g.world.setBlock(q.x, q.y, q.z, AIR);
        g.entities.dropItem(K.torch, 1, q.x + 0.5, q.y + 0.3, q.z + 0.5);
        g.particles.burst(q.x + 0.5, q.y + 0.6, q.z + 0.5, [[0.15, 0.15, 0.2], [0.05, 0.02, 0.1]], 12, 1.6);
        g.audio.play('resoplido', { pos: m.soundPos(), vol: 0.7 });
        if (!g.meta.apagadoraAviso && Math.hypot(q.x - c.pl.x, q.z - c.pl.z) < 30) { g.meta.apagadoraAviso = true; g.ui.toast('🕯 Algo apagó una antorcha. Hay una Sombra que no viene por usted: viene por la luz', 4200); }
      }
      m.data.antorcha = null; m.data.buscaT = 1;
      return true;
    },
    build() {
      const b = SOMBRA.build();
      b.traverse((o) => { if (o.material && o.material.color && !o.userData.glow) { o.material = o.material.clone(); o.material.color.multiplyScalar(0.8); o.material.color.b += 0.05; } });
      ojos(b, 0x7ad8ff, 0x3a9aff);
      // de sombrero, un apagavelas de lata (el cono con su mango)
      const Ap = new Pieza();
      Ap.tubo(0x8a8a92, [[0, 0.24, -0.05], [0, 0.5, -0.05], [0, 0.86, -0.05]], [0.36, 0.2, 0.012], { lados: 10, pasos: 2, brillo: 1.1 });
      Ap.tubo(0x6a6a72, [[0.26, 0.34, -0.05], [0.42, 0.4, -0.2], [0.44, 0.34, -0.42]], [0.03, 0.03, 0.04], { lados: 5, brillo: 0.8 });
      b.userData.head.add(Ap.malla());
      return b;
    },
  };
  // la brincona: se agacha (los ojos se le prenden: ese es el aviso) y se tira de un brinco encima de uno. Si falla, queda aturdida un
  // rato y ahí es cuando se le pega. Se esquiva con la voltereta, barriéndose o saltando de lado.
  const brincona = {
    ...SOMBRA, name: 'Sombra brincona', health: 14, speed: 3.3, attack: 4, xp: 12, drops: [[257, 0, 2]],
    build() {
      const m = SOMBRA.build();
      m.userData.babyScale = 0.85;
      ojos(m, 0xd8ff40, 0xa0d020);
      const Pu = new Pieza();
      for (let i = 0; i < 7; i++) for (const s of (i % 2 ? [-1, 1] : [0])) { const y = 1.42 - i * 0.16, z = -0.3 - i * 0.03; Pu.tubo(0x3a4a20, [[s * 0.1, y, z], [s * 0.16, y + 0.06, z - 0.18], [s * 0.2, y + 0.04, z - 0.34]], [0.05, 0.03, 0.004], { lados: 5, grano: 0.2 }); }
      m.userData.body.add(Pu.malla());
      return m;
    },
    brain(m, dt, c) {
      const { g, distP, pl } = c;
      const b = m.body, D = m.data;
      D.cdSalto = Math.max(0, (D.cdSalto ?? 1.5) - dt);
      if (D.aturdida > 0) { D.aturdida -= dt; m.moving = false; return true; }
      const S = D.salto;
      if (S && S.fase === 'carga') {
        // si lo aturdieron a media preparación el anillo ya se fue: se vuelve a marcar desde cero (si no, brincaba sin aviso)
        if (S.aviso && S.aviso.t >= S.aviso.dur) Object.assign(S, { t: 0.55, tx: pl.x, tz: pl.z, aviso: avisoCaida(g, pl.x, pl.y, pl.z, 1.7, 0.55 + 0.9, m) });
        // va al punto que marcó el anillo al cargar, no a donde esté uno ahora: quien se sale del anillo se salva
        const tx = S.tx - b.pos.x, tz = S.tz - b.pos.z, l = Math.hypot(tx, tz) || 1;
        S.t -= dt; m.moving = false; m.targetYaw = Math.atan2(tx, tz);
        if (S.t <= 0) {
          // calculado para caer en el punto marcado (en el aire se frena a ~0.8); despega ya en el aire, si no el roce del piso le come el impulso
          const vy = 8, vuelo = (2 * vy) / GRAV, v = Math.min(16, Math.max(6, (l - 0.6) / (vuelo * 0.8)));
          b.vel.x = (tx / l) * v; b.vel.z = (tz / l) * v; b.vel.y = vy; b.onGround = false;
          D.salto = { fase: 'vuelo', t: 0.9, pego: false, aviso: S.aviso };
          g.audio.play('swish', { pos: m.soundPos(), vol: 0.9, pitch: 0.8 });
        }
        return true;
      }
      if (S && S.fase === 'vuelo') {
        S.t -= dt; m.moving = false;
        const p = b.pos;
        if (!S.pego && g.player.alive && Math.hypot(p.x - pl.x, p.z - pl.z) < 1.7 && Math.abs(p.y - pl.y) < 1.8) {
          S.pego = true;
          g.damagePlayer(m.kind.attack, p.x - b.vel.x, p.z - b.vel.z, 'Una Sombra brincona le cayó encima', false, true);
          g.shake = Math.max(g.shake || 0, 0.35);
        }
        if (S.t <= 0 || (b.onGround && S.t < 0.6)) {
          apagarAviso(S.aviso); D.salto = null; D.cdSalto = 3 + Math.random() * 2;
          if (!S.pego) { D.aturdida = 1.4; g.particles.burst(p.x, p.y + 0.2, p.z, [[0.3, 0.3, 0.3]], 8, 1.5); }
        }
        return true;
      }
      if (g.mode !== 'survival' || !g.player.alive || distP > 24) return false;
      if (D.cdSalto <= 0 && b.onGround && distP > 3.2 && distP < 7.5 && Math.abs(pl.y - b.pos.y) < 3) {
        D.salto = { fase: 'carga', t: 0.55, tx: pl.x, tz: pl.z, aviso: avisoCaida(g, pl.x, pl.y, pl.z, 1.7, 0.55 + 0.9, m) };
        g.audio.play('sombra', { pos: m.soundPos(), vol: 0.8, pitch: 1.6 });
        return true;
      }
      return false;
    },
    animate(m, dt, u) {
      const S = m.data.salto, carga = S && S.fase === 'carga';
      if (u.eyes) u.eyes.scale.setScalar(carga ? 1.8 : 1);
      if (u.body) u.body.position.y = carga ? -0.18 : (m.data.aturdida > 0 ? -0.1 : 0);
      if (u.body) u.body.rotation.z = m.data.aturdida > 0 ? Math.sin(m.t * 12) * 0.12 : 0;
    },
  };
  // la acechadora (desde el día 10): casi invisible (solo los ojos), le da la vuelta a uno y ataca por la espalda (pega doble así).
  // Se deja ver de cerca, al pegar o al recibir un golpe. Hay que voltearse a ver.
  const acechadora = {
    ...SOMBRA, name: 'Sombra acechadora', health: 18, speed: 3.6, attack: 3, xp: 18, drops: [[257, 0, 2], [499, 0, 1]],
    build() {
      const m = SOMBRA.build();
      ojos(m, 0xf0f0ff, 0x9090ff);
      m.traverse((o) => { if (o.isMesh && o.parent !== m.userData.eyes && o.geometry.type !== 'PlaneGeometry') { o.userData.velado = true; const ms = Array.isArray(o.material) ? o.material : [o.material]; o.material = ms.map((x) => { const c = x.clone(); c.transparent = true; c.opacity = 0.12; c.depthWrite = false; if (c.alphaTest) c.alphaTest = 0.04; return c; }); if (!Array.isArray(ms) || ms.length === 1) o.material = o.material[0]; } });
      m.userData.velo = 0.12;
      return m;
    },
    brain(m, dt, c) {
      const { g, distP, pl } = c, D = m.data;
      D.visible = Math.max(0, (D.visible || 0) - dt);
      if (g.mode !== 'survival' || !g.player.alive || distP > 26) return false;
      // ¿uno la está viendo? (de frente, cerca del centro de la mira)
      const yaw = g.player.yaw, fx = -Math.sin(yaw), fz = -Math.cos(yaw), l = distP || 1;
      const deFrente = ((m.body.pos.x - pl.x) * fx + (m.body.pos.z - pl.z) * fz) / l;
      if (distP < 3 || deFrente > 0.92) D.visible = Math.max(D.visible, 0.6);
      // le da la vuelta: busca la espalda de uno
      // de frente no pega: sigue rodeando hasta quedar a la espalda (si uno la sigue con la vista, no encuentra el hueco)
      if (distP > 2.2 || deFrente > -0.1) { const bx = pl.x - fx * 1.6, bz = pl.z - fz * 1.6, lado = ((m.body.pos.x - pl.x) * -fz + (m.body.pos.z - pl.z) * fx) >= 0 ? 1 : -1; m.goTo(bx - fz * lado * (deFrente > 0 ? 2.2 : 0), bz + fx * lado * (deFrente > 0 ? 2.2 : 0), 1.2); return true; }
      if (m.attackCd <= 0) {
        D.visible = 1.2;
        const atras = deFrente < -0.2 ? 2 : 1;
        atacar(m, g, { tipo: 'zarpazo', prep: 0.55, dano: m.kind.attack * atras * (D.fuerza || 1), causa: atras > 1 ? 'Una Sombra acechadora, por la espalda' : 'Una Sombra acechadora', alcance: 2.2, cd: 1.6, alGolpe: (llego) => {
          if (llego && atras > 1 && !g.meta.acechadoraAviso) { g.meta.acechadoraAviso = true; g.ui.toast('👁 ¡Por la espalda! Hay algo que casi no se ve… voltéese a ver de vez en cuando', 3400); }
        } });
      }
      m.moving = false;
      return true;
    },
    onHurt(m, g, dmg) {
      m.data.visible = 2;
      if (m.health - dmg <= 0) m.group.traverse((o) => { if (o.isMesh && o.userData.velado) (Array.isArray(o.material) ? o.material : [o.material]).forEach((x) => { x.opacity = 0.95; }); }); // que se vea cómo se deshace
      return true;
    },
    animate(m, dt, u) {
      const meta = (m.data.visible || 0) > 0 || m.dying ? 0.95 : 0.1 + Math.sin(m.t * 3) * 0.04;
      u.velo += (meta - u.velo) * Math.min(1, dt * 6);
      m.group.traverse((o) => { if (o.isMesh && o.userData.velado) (Array.isArray(o.material) ? o.material : [o.material]).forEach((x) => { x.opacity = u.velo; }); });
    },
  };
  return { sombra_acechadora: acechadora, sombra_hondera: hondera, sombra_escudo: escudo, sombra_ladrona: ladrona, sombra_grande: grande, sombra_apagadora: apagadora, sombra_brincona: brincona };
}

// lo que la ladrona se lleva: nunca lo que se está usando ni las herramientas, solo algo de lo que uno anda cargando
function robar(g, m) {
  const inv = g.inventory, c = [];
  // v11.10.6: de la billetera, como mucho el 10 % o ₡5 000 (lo que sea menos), en piezas de verdad; la suelta completa al morir
  const enB = inv.enBilletera ? inv.enBilletera() : 0;
  if (enB >= 500 && Math.random() < 0.5) {
    const saca = desglose(Math.min(enB * 0.1, 5000)), suma = saca.reduce((a, [id, n]) => a + n * VALOR[id], 0);
    if (suma > 0) {
      inv.pagarColones(suma);
      m.data.robado = { plata: suma };
      m.data.huye = 18;
      g.audio.play('swish', { pos: m.soundPos(), vol: 0.8, pitch: 1.4 });
      g.ui.toast(`🎭 ¡Una Sombra le sacó ${fmtColones(suma)} de la billetera! Si la alcanza, los recupera`, 3600, 'importante');
      return true;
    }
  }
  inv.slots.forEach((s, i) => { if (s && i !== inv.selected && !(ITEMS[s.id] && ITEMS[s.id].durability) && !esPlata(s.id) && !esUnico(s.id)) c.push(i); });
  if (!c.length) return false;
  const i = c[(Math.random() * c.length) | 0], s = inv.slots[i], n = Math.min(s.count, 8);
  inv.remove(s.id, n);
  m.data.robado = { id: s.id, n };
  m.data.huye = 18;
  g.audio.play('swish', { pos: m.soundPos(), vol: 0.8, pitch: 1.4 });
  g.ui.toast(`🎭 ¡Una Sombra le robó ${n} ${itemName(s.id)}! Si la alcanza, lo recupera`, 3600);
  return true;
}
// lo llama killedMob: lo robado cae al suelo
export function soltarBotin(g, m, deUno = true) {
  const B = m.data && m.data.robado;
  if (!B) return;
  if (B.plata) for (const [id, n] of desglose(B.plata)) g.entities.dropItem(id, n, m.body.pos.x, m.body.pos.y + 0.5, m.body.pos.z);
  else g.entities.dropItem(B.id, B.n, m.body.pos.x, m.body.pos.y + 0.5, m.body.pos.z);
  m.data.robado = null;
  if (!deUno) return; // la mató el perro o el sol: lo robado queda ahí tirado
  g.ui.toast(B.plata ? `🎭 ¡La alcanzó! Ahí quedaron sus ${fmtColones(B.plata)}, todos` : m.type === 'sombra_ladrona' ? '🎭 ¡La alcanzó! Ahí está lo suyo' : '🎒 ¡Ahí está lo suyo! Lo recuperó', 2600, B.plata ? 'importante' : undefined);
  g.achieve('ladrona', 'Al que roba, se le alcanza');
}

// qué Sombra sale (las nuevas desde el día 3; la ladrona desde el 8 y la grande desde el 12)
export function tipoSombra(g) {
  if ((g.day || 1) < 2) return 'sombra';
  const r = Math.random();
  if ((g.day || 1) >= 12 && r > 0.96) return 'sombra_grande';
  if ((g.day || 1) >= 10 && r > 0.92) return 'sombra_acechadora';
  if ((g.day || 1) >= 8 && r > 0.88) return 'sombra_ladrona';
  if ((g.day || 1) >= 6 && r > 0.8) return 'sombra_apagadora';
  return r < 0.15 ? 'sombra_hondera' : r < 0.29 ? 'sombra_escudo' : r < 0.45 ? 'sombra_brincona' : 'sombra';
}
