// Bichos de cada bioma (v4.98), para que la noche no sea solo Sombras. Cada uno pide otra forma de pelear:
// · araña bananera (selva, manglar, bosque): tira telaraña desde lejos (enreda: casi no se puede caminar) y después muerde con
//   veneno. Hay que cerrarle distancia rápido o cubrirse.
// · escarabajo rinoceronte (bosque, selva, nuboso): escarba el suelo (ese es el aviso) y embiste en línea recta. De frente el
//   cuerno y el caparazón aguantan casi todo; si se estrella contra un árbol o una pared queda atontado: ahí se le pega.
// · sapo bufo (llanos y selva, cerca del agua): lento y feo. Si se le pega de cerca, le escupe veneno de las glándulas: mejor de
//   lejos (lanza, honda, flechas) o bien cubierto.
// · ciempiés gigante (montaña, nuboso, páramo y cuevas): rapidísimo en zigzag, muerde con veneno y se va para volver por otro lado.
// · luz mala (Guanacaste seco, de noche): una luz que flota. Se apaga (ahí no se le puede pegar), aparece en otro lado y tira una
//   llamarada. Solo se le pega mientras brilla fuerte.
// · cangrejo tenaza (playas, de noche): camina de lado y ataja con la tenaza grande todo lo que no sea contundente; si se le pega
//   en la tenaza, contesta con un pellizco que hace sangrar. Mazo, garrote o por el lado.
import { avisoEmbestida, atacar } from './golpes.js';
import * as THREE from 'three';
import { SOLID, BLOCKS, BLOCK_BY_KEY as K, AIR, FLUID } from './blocks.js';
import { flat } from './fauna.js';
import { perfil, pistaCaparazon } from './armas3.js';
import { difOf } from './supervivencia.js';
import { regionAt } from './regiones.js';
import { armarBananera, armarEscarabajo, armarSapo, armarCiempies, armarTenaza } from './modelos-bichos.js';

const jugando = (g) => g.mode === 'survival' && g.player.alive;
const frente = (m, x, z) => { let d = Math.atan2(x - m.body.pos.x, z - m.body.pos.z) - (m.yaw || 0); d = Math.atan2(Math.sin(d), Math.cos(d)); return Math.abs(d); };

// ---------- la telaraña que tira la bananera ----------
export class Tela {
  constructor(g, x, y, z, v) {
    this.g = g; this.pos = { x, y, z }; this.vel = v; this.life = 0; this.dead = false;
    this.mesh = new THREE.Group();
    for (let i = 0; i < 3; i++) { const q = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.3), new THREE.MeshBasicMaterial({ color: 0xeeeeea, transparent: true, opacity: 0.8 })); q.rotation.set(i, i * 0.7, 0); this.mesh.add(q); }
    g.scene.add(this.mesh);
  }
  update(dt) {
    const g = this.g, p = this.pos, v = this.vel;
    this.life += dt; v.y -= 9 * dt;
    p.x += v.x * dt; p.y += v.y * dt; p.z += v.z * dt;
    this.mesh.position.set(p.x, p.y, p.z); this.mesh.rotation.y += dt * 8;
    const pl = g.player.body.pos;
    if (Math.abs(p.x - pl.x) < 0.55 && Math.abs(p.z - pl.z) < 0.55 && p.y > pl.y - 0.1 && p.y < pl.y + 1.9) {
      this.dead = true;
      if (!jugando(g)) return;
      if (g.blocking && frente({ body: { pos: pl }, yaw: Math.atan2(-Math.sin(g.player.yaw), -Math.cos(g.player.yaw)) }, p.x, p.z) < 1.2) { g.ui.toast('🕸 La telaraña se le pegó al escudo', 1200); return; }
      g.addEffect('enredado', 2.5);
      g.ui.toast('🕸 ¡La telaraña le cayó encima! Casi no se puede mover', 1800);
      g.audio.play('dig.cloth', { ui: true, vol: 0.7, pitch: 1.4 });
      return;
    }
    if (g.world.solidoEn(p.x, p.y, p.z) || this.life > 3) this.dead = true;
  }
  remove() { this.g.scene.remove(this.mesh); this.mesh.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } }); }
}
// ---------- la llamarada de la luz mala ----------
class Llama {
  constructor(g, x, y, z, v) { this.g = g; this.pos = { x, y, z }; this.vel = v; this.life = 0; this.dead = false; }
  update(dt) {
    const g = this.g, p = this.pos, v = this.vel;
    this.life += dt;
    p.x += v.x * dt; p.y += v.y * dt; p.z += v.z * dt;
    for (let i = 0; i < 2; i++) g.particles.spawn(p.x, p.y, p.z, Math.random() < 0.5 ? [0.5, 0.9, 1] : [0.85, 1, 0.9], (Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5), 0.5, 0, true);
    const pl = g.player.body.pos;
    if (Math.abs(p.x - pl.x) < 0.6 && Math.abs(p.z - pl.z) < 0.6 && p.y > pl.y && p.y < pl.y + 1.9) {
      this.dead = true;
      if (jugando(g)) { g.damagePlayer(3, p.x - v.x, p.z - v.z, 'Una llamarada de la luz mala', false, true); g.addEffect('escalofrio', 8); }
      return;
    }
    if (g.world.solidoEn(p.x, p.y, p.z) || this.life > 4) this.dead = true;
  }
  remove() {}
}
// cada cuadro: telarañas y llamaradas
export function cuadroBichos3(g, dt) {
  if (!g.proy3 || !g.proy3.length) return;
  g.proy3 = g.proy3.filter((s) => { s.update(dt); if (s.dead) { s.remove(); return false; } return true; });
}
export function limpiarBichos3(g) { if (g.proy3) for (const s of g.proy3) s.remove(); g.proy3 = []; }

// ---------- los bichos ----------
export const BICHOS3 = {
  arana_bananera: {
    name: 'Araña bananera', w: 0.7, h: 0.45, health: 16, speed: 2.6, hostile: true, attack: 2, noJump: false, hurtSound: 'gato.bufido', idleSound: null, idleEvery: [999, 999],
    particle: [[0.3, 0.2, 0.12], [0.6, 0.15, 0.1]], drops: [[271, 0, 1]], xp: 10, grupo: 'caparazon',
    build() { return armarBananera(); },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c, D = m.data, b = m.body.pos;
      if (!jugando(g) || distP > 26) return false;
      D.tela = (D.tela ?? 1.5) - dt;
      m.targetYaw = Math.atan2(dxp, dzp);
      const enredado = !!g.player.effects.enredado;
      // de lejos teje; si uno quedó enredado o está cerca, va a morder
      if (!enredado && distP > 4 && distP < 11 && D.tela <= 0) {
        D.tela = 4 + Math.random() * 2; D.alza = 0.5;
        const sx = b.x, sy = b.y + 0.4, sz = b.z, ty = pl.y + 1, t = distP / 11, vy = (ty - sy) / t + 0.5 * 9 * t;
        (g.proy3 ||= []).push(new Tela(g, sx, sy, sz, { x: (dxp / distP) * 11, y: vy, z: (dzp / distP) * 11 }));
        g.audio.play('swish', { pos: m.soundPos(), vol: 0.5, pitch: 1.8 });
        m.moving = false;
        return true;
      }
      if (distP > 1.3) { m.goTo(pl.x, pl.z, enredado ? 1.5 : 1.1); return true; }
      m.moving = false;
      if (m.attackCd <= 0) {
        atacar(m, g, { tipo: 'mordida', prep: 0.48, dano: m.kind.attack, causa: 'Mordida de araña bananera', alcance: 1.3, cd: 1.4, alSoltar: () => { D.alza = 0.4; }, alGolpe: (llego) => {
          if (!llego) return;
          if (Math.random() < 0.6) { g.addEffect('veneno', 6, 'arana'); g.ui.toast('🕷 Mordida de bananera: veneno', 1600); }
          g.achieve('bananera', 'La bananera no estaba en el racimo');
        } });
      }
      return true;
    },
    animate(m, dt, u) {
      m.data.alza = Math.max(0, (m.data.alza || 0) - dt);
      const v = m.walk * 3.2;
      for (const P of u.patas) P.piv.rotation.z = Math.sin(v + P.i * 1.4 + (P.s > 0 ? 0 : Math.PI)) * 0.25 * (0.1 + m.walkAmt * 0.9);
      u.body.rotation.x = -m.data.alza * 1.2; // se levanta para tejer o morder
    },
  },
  escarabajo: {
    name: 'Escarabajo rinoceronte', w: 0.95, h: 0.7, health: 42, speed: 1.3, hostile: true, attack: 4, hurtSound: 'dig.wood', idleSound: null, idleEvery: [999, 999], // golpe 4: con 6 mataba al de espada de madera (BALANCE.md, 11-nov)
    particle: [[0.15, 0.1, 0.08], [0.4, 0.3, 0.2]], drops: [[271, 0, 2]], xp: 22, grupo: 'caparazon',
    build() { return armarEscarabajo(); },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp } = c, D = m.data, b = m.body;
      if ((m.stunT || 0) > 0) return false;
      const E = D.emb;
      if (E && E.fase === 'escarba') {
        E.t -= dt; m.moving = false;
        if (Math.random() < dt * 25) g.particles.spawn(b.pos.x - Math.sin(m.yaw) * 0.5, b.pos.y + 0.1, b.pos.z - Math.cos(m.yaw) * 0.5, [0.45, 0.36, 0.26], (Math.random() - 0.5) * 2, 1.5, (Math.random() - 0.5) * 2, 0.6, 6);
        if (E.t <= 0) { E.fase = 'corre'; E.t = 1.8; E.pego = false; g.audio.play('resoplido', { pos: m.soundPos(), vol: 0.9, pitch: 0.7 }); }
        return true;
      }
      if (E && E.fase === 'corre') {
        E.t -= dt;
        m.targetYaw = E.yaw; m.yaw = E.yaw; m.moving = true; m.speedMul = 9 / m.kind.speed;
        const pl = g.player.body.pos;
        if (!E.pego && jugando(g) && Math.hypot(pl.x - b.pos.x, pl.z - b.pos.z) < 1.3 && Math.abs(pl.y - b.pos.y) < 1.6) {
          E.pego = true;
          g.damagePlayer(m.kind.attack, b.pos.x, b.pos.z, 'Embestida de un escarabajo rinoceronte', false, true);
          g.player.body.vel.x += Math.sin(E.yaw) * 10; g.player.body.vel.z += Math.cos(E.yaw) * 10; g.player.body.vel.y = 6;
          g.shake = Math.max(g.shake || 0, 0.5);
        }
        // se estrelló: queda atontado (la oportunidad)
        // un escalón de un bloque lo brinca; una pared o un tronco de dos o más, lo para en seco
        if (b.hitWall) {
          const fx = Math.floor(b.pos.x + Math.sin(E.yaw) * 0.9), fz = Math.floor(b.pos.z + Math.cos(E.yaw) * 0.9), fy = Math.floor(b.pos.y);
          if (!SOLID[g.world.getBlock(fx, fy + 1, fz)] && !SOLID[g.world.getBlock(fx, fy + 2, fz)] && b.onGround) { b.vel.y = 6.5; b.onGround = false; }
        }
        if (b.hitWall && E.t < 1.65 && SOLID[g.world.getBlock(Math.floor(b.pos.x + Math.sin(E.yaw) * 0.9), Math.floor(b.pos.y) + 1, Math.floor(b.pos.z + Math.cos(E.yaw) * 0.9))]) {
          m.stunT = 2.8; D.emb = null; m.moving = false;
          g.audio.play('dig.wood', { pos: m.soundPos(), vol: 1, pitch: 0.6 }); g.shake = Math.max(g.shake || 0, 0.2);
          g.particles.burst(b.pos.x + Math.sin(E.yaw) * 0.6, b.pos.y + 0.5, b.pos.z + Math.cos(E.yaw) * 0.6, [[0.5, 0.4, 0.3], [1, 0.95, 0.5]], 14, 2.5);
          if (Math.hypot(dxp, dzp) < 20) g.ui.toast('🪲 ¡Se estrelló! Está atontado: ahora', 1600);
          return true;
        }
        if (E.t <= 0) { D.emb = { fase: 'resuella', t: 1.4 }; m.moving = false; }
        return true;
      }
      if (E && E.fase === 'resuella') { E.t -= dt; m.moving = false; if (E.t <= 0) D.emb = null; return true; }
      if (!jugando(g) || distP > 18) return false;
      D.cd = (D.cd ?? 2) - dt;
      m.targetYaw = Math.atan2(dxp, dzp);
      if (distP < 13 && distP > 2.2 && D.cd <= 0) { D.cd = 5 + Math.random() * 2; D.emb = { fase: 'escarba', t: 0.9, yaw: Math.atan2(dxp, dzp) }; m.yaw = D.emb.yaw; avisoEmbestida(m, g, 0.9, 14, 1.2); g.audio.play('dig.stone', { pos: m.soundPos(), vol: 0.6, pitch: 0.5 }); return true; }
      return false; // de cerca, pelea como cualquiera (cornada)
    },
    // de frente, el cuerno y el caparazón aguantan casi todo (salvo atontado o con lo contundente)
    onHurt(m, g, dmg) {
      const p = g.player.body.pos;
      if ((m.stunT || 0) > 0 || frente(m, p.x, p.z) > 1.0) return true;
      const P = perfil(g.heldDef());
      if (P.tipo === 'contundente' && dmg >= 8) return true;
      const queda = dmg * 0.3;
      if (m.health - queda <= 0) return true;
      m.health -= queda; m.data.provoked = true;
      g.audio.play('armadura.metal', { pos: m.soundPos(), vol: 0.7, pitch: 0.7 });
      g.particles.burst(m.body.pos.x, m.body.pos.y + 0.6, m.body.pos.z, [[1, 0.95, 0.6]], 6, 2);
      if (!g.meta.escarabajoAviso) { g.meta.escarabajoAviso = true; g.ui.toast('🪲 De frente aguanta: hágalo chocar con un árbol, o péguele por el lado', 3600); }
      return false;
    },
    animate(m, dt, u) {
      const E = m.data.emb, v = m.walk * 2.6;
      for (const P of u.patas) P.piv.rotation.z = Math.sin(v + P.i * 2 + (P.s > 0 ? 0 : Math.PI)) * 0.3 * m.walkAmt;
      u.body.rotation.x = E && E.fase === 'escarba' ? 0.15 + Math.sin(m.t * 30) * 0.05 : E && E.fase === 'corre' ? -0.12 : 0;
      u.cuerno.rotation.x = E && E.fase === 'escarba' ? -0.3 : 0;
      if (m.stunT > 0) u.body.rotation.z = Math.sin(m.t * 10) * 0.12; else u.body.rotation.z = 0;
    },
  },
  sapo_bufo: {
    name: 'Sapo bufo', w: 0.6, h: 0.5, health: 18, speed: 1.1, hostile: true, attack: 2, hurtSound: 'rana', idleSound: 'rana', idleEvery: [5, 12],
    particle: [[0.42, 0.36, 0.2], [0.8, 0.85, 0.3]], drops: [], xp: 8, grupo: 'cuero',
    build() { return armarSapo(); },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c, D = m.data, b = m.body;
      if (!jugando(g) || distP > 16) return false;
      m.targetYaw = Math.atan2(dxp, dzp);
      // brinca hacia uno, de a poquitos
      D.brinco = (D.brinco ?? 1) - dt;
      if (distP > 1.2 && D.brinco <= 0 && b.onGround) { D.brinco = 1.1 + Math.random() * 0.6; const l = distP || 1; b.vel.x = (dxp / l) * 3.2; b.vel.z = (dzp / l) * 3.2; b.vel.y = 5; b.onGround = false; }
      m.moving = false;
      if (distP < 1.3 && m.attackCd <= 0 && Math.abs(pl.y - b.pos.y) < 1.4) atacar(m, g, { tipo: 'mordida', prep: 0.48, dano: m.kind.attack, causa: 'Mordida de sapo bufo', alcance: 1.3, cd: 1.6 });
      return true;
    },
    // pegarle de cerca: el chorro de las glándulas (con la lanza o desde lejos no llega; el escudo lo ataja)
    onHurt(m, g) {
      const p = g.player.body.pos, d = Math.hypot(p.x - m.body.pos.x, p.z - m.body.pos.z);
      if (g.golpeando === m && d < 3.3 && jugando(g) && !g.blocking) {
        g.addEffect('veneno', 5); g.addEffect('mareo', 4);
        g.particles.burst(p.x, p.y + 1.4, p.z, [[0.85, 0.9, 0.5], [0.95, 1, 0.7]], 12, 1.5);
        g.ui.toast('🐸 ¡El sapo le escupió el veneno de las glándulas! De lejos o con la lanza', 2600);
        g.achieve('bufo', 'No se le pega a un sapo bufo');
      }
      return true;
    },
    animate(m, dt, u) {
      const aire = !m.body.onGround;
      u.patas[2].rotation.x = u.patas[3].rotation.x = aire ? -0.8 : 0;
      u.tronco.scale.y = 1 + Math.sin(m.t * 3) * 0.04; // respira (se infla)
    },
  },
  ciempies: {
    name: 'Ciempiés gigante', w: 0.5, h: 0.3, health: 20, speed: 4.2, hostile: true, attack: 3, hurtSound: 'gato.bufido', idleSound: null, idleEvery: [999, 999],
    particle: [[0.5, 0.12, 0.08], [0.9, 0.4, 0.1]], drops: [], xp: 12, grupo: 'caparazon',
    build() { return armarCiempies(); },
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c, D = m.data, b = m.body.pos;
      if (!jugando(g) || distP > 22) return false;
      D.fuera = Math.max(0, (D.fuera || 0) - dt);
      if (D.fuera > 0) { m.goTo(b.x - dxp * 2, b.z - dzp * 2, 1.2); return true; }
      // zigzag: se acerca de lado a lado, difícil de apuntar
      const l = distP || 1, zz = Math.sin(m.t * 3.2) * Math.min(1, distP / 5) * 2.5;
      m.goTo(pl.x - (dzp / l) * zz, pl.z + (dxp / l) * zz, 1.1);
      if (distP < 1.2 && m.attackCd <= 0 && Math.abs(pl.y - b.y) < 1.4) {
        atacar(m, g, { tipo: 'latigazo', prep: 0.42, dano: m.kind.attack, causa: 'Mordida de ciempiés gigante', alcance: 1.2, cd: 2.2, alGolpe: (llego) => {
          D.fuera = 1.8 + Math.random();
          if (!llego) return;
          g.addEffect('veneno', 5);
          g.achieve('ciempies', 'Cien patas y mala leche');
        } });
      }
      return true;
    },
    animate(m, dt, u) {
      // el cuerpo sigue el camino de la cabeza
      const R = u.rastro, b = m.body.pos, ya = m.yaw || 0;
      const hx = b.x + Math.sin(ya) * 0.3, hz = b.z + Math.cos(ya) * 0.3;
      if (!R.length || Math.hypot(R[0].x - hx, R[0].z - hz) > 0.06) R.unshift({ x: hx, z: hz });
      if (R.length > 60) R.length = 60;
      const c = Math.cos(-ya), s = Math.sin(-ya);
      u.segs.forEach((seg, i) => {
        const q = R[Math.min(R.length - 1, (i + 1) * 3)] || { x: hx, z: hz }, qn = R[Math.min(R.length - 1, (i + 1) * 3 + 2)] || q;
        const lx = q.x - b.x, lz = q.z - b.z;
        seg.position.x = lx * c + lz * s; seg.position.z = -lx * s + lz * c;
        seg.position.y = 0.12 + Math.sin(m.t * 18 + i) * 0.015;
        seg.rotation.y = Math.atan2(q.x - qn.x, q.z - qn.z) - ya;
        seg.userData.piernas.forEach((pi, k) => { pi.rotation.y = Math.sin(m.walk * 5 + i * 0.9 + k * Math.PI) * 0.45 * m.walkAmt; }); // la ola de patas
      });
    },
  },
  luz_mala: {
    name: 'Luz mala', w: 0.6, h: 0.6, health: 14, speed: 0, hostile: true, attack: 3, hurtSound: 'susurro', idleSound: 'susurro', idleEvery: [6, 12],
    particle: [[0.6, 0.95, 1], [0.9, 1, 0.95]], drops: [], xp: 16, grupo: 'espanto', noGravity: true,
    build() {
      const g = new THREE.Group();
      const nucleo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 1), new THREE.MeshBasicMaterial({ color: 0xd8fff0, fog: false })); nucleo.position.y = 0.3; nucleo.userData.glow = true;
      const halo = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8), new THREE.MeshBasicMaterial({ color: 0x60d8ff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); halo.position.y = 0.3; halo.userData.glow = true;
      const halo2 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 8), new THREE.MeshBasicMaterial({ color: 0x3aa0ff, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); halo2.position.y = 0.3; halo2.userData.glow = true;
      // cuando está fuerte se le ven dos huecos, como ojos
      const cara = new THREE.Group(); cara.position.set(0, 0.32, 0.17);
      for (const s of [-1, 1]) cara.add(flat(0x0a2030, 0.05, 0.07, 0.02, s * 0.06, 0, 0, true));
      g.add(nucleo, halo, halo2, cara);
      g.userData = { nucleo, halo, halo2, cara };
      return g;
    },
    update(m, dt) {
      const g = m.game, b = m.body.pos, pl = g.player.body.pos, D = m.data;
      D.apuro = true;
      if (g.daylight > 0.45) { m.dead = true; return; } // con el sol se apaga
      if (!D.f) { D.f = 'brilla'; D.t = 3; D.y0 = b.y; }
      D.t -= dt;
      const dx = pl.x - b.x, dz = pl.z - b.z, d = Math.hypot(dx, dz) || 1;
      m.yaw = Math.atan2(dx, dz);
      if (D.f === 'brilla') {
        // flota despacio hacia uno, meciéndose
        if (d > 5) { b.x += (dx / d) * dt * 1.6; b.z += (dz / d) * dt * 1.6; }
        b.y += (Math.max(pl.y + 1.4, D.y0 || pl.y) - b.y) * dt * 0.8 + Math.sin(m.t * 2) * dt * 0.3;
        if (D.t <= 1 && !D.tiro && jugando(g) && d < 16) {
          D.tiro = true;
          const sy = b.y + 0.3, t = d / 9;
          (g.proy3 ||= []).push(new Llama(g, b.x, sy, b.z, { x: (dx / d) * 9, y: (pl.y + 1.1 - sy) / t, z: (dz / d) * 9 }));
          g.audio.play('susurro', { pos: m.soundPos(), vol: 0.9, pitch: 1.4 });
        }
        if (D.t <= 0) { D.f = 'apaga'; D.t = 1.6 + Math.random(); D.tiro = false; }
      } else {
        // apagada: se mueve rapidísimo a otro lado
        if (D.t > 0.6) { const a = (D.ang ??= Math.random() * Math.PI * 2); const tx = pl.x + Math.cos(a) * 6, tz = pl.z + Math.sin(a) * 6; b.x += (tx - b.x) * dt * 3; b.z += (tz - b.z) * dt * 3; }
        if (D.t <= 0) { D.f = 'brilla'; D.t = 2.6 + Math.random(); D.ang = null; g.audio.play('susurro', { pos: m.soundPos(), vol: 0.6, pitch: 0.8 }); }
      }
      m.body.vel.x = m.body.vel.y = m.body.vel.z = 0;
      m.group.position.set(b.x, b.y, b.z);
      const u = m.group.userData, fuerte = D.f === 'brilla', k = fuerte ? 1 : Math.max(0.05, 1 - (1.6 - D.t) * 2);
      const tit = 0.85 + Math.sin(m.t * 23) * 0.1 + Math.sin(m.t * 7) * 0.05;
      u.halo.material.opacity = 0.3 * k * tit; u.halo2.material.opacity = 0.1 * k * tit; u.nucleo.visible = k > 0.15; u.cara.visible = fuerte;
      u.nucleo.scale.setScalar(tit);
      if (Math.random() < dt * 12 * k) g.particles.spawn(b.x + (Math.random() - 0.5) * 0.4, b.y + 0.3, b.z + (Math.random() - 0.5) * 0.4, [0.6, 0.95, 1], 0, 0.4, 0, 0.8, -0.3, true);
    },
    // apagada no hay a qué pegarle
    onHurt(m, g, dmg) {
      if (m.data.f === 'brilla') { if (m.health - dmg <= 0) g.achieve('luz_mala', 'Apagué la luz mala'); return true; }
      g.ui.combatFlash('break', 'Se apagó: no hay a qué pegarle');
      return false;
    },
  },
  cangrejo_tenaza: {
    name: 'Cangrejo tenaza', w: 0.85, h: 0.45, health: 26, speed: 2, hostile: true, attack: 2, hurtSound: 'dig.stone', idleSound: null, idleEvery: [999, 999],
    particle: [[0.85, 0.35, 0.12], [1, 0.6, 0.3]], drops: [[262, 0, 1]], xp: 12, grupo: 'caparazon',
    build() { return armarTenaza(); },
    brain(m, dt, c) {
      const { g, distP } = c, D = m.data;
      D.pellizco = Math.max(0, (D.pellizco || 0) - dt);
      if (!jugando(g) || distP > 18) return false;
      return false; // camina y pellizca como cualquiera; lo suyo es la tenaza (onHurt)
    },
    // la tenaza grande ataja de frente lo que no sea contundente (deja pasar el 40 %, v11.7); si se le pega ahí, contesta
    onHurt(m, g) {
      const p = g.player.body.pos;
      if ((m.stunT || 0) > 0 || frente(m, p.x, p.z) > 1.1 || g.golpeando !== m) return true;
      const P = perfil(g.heldDef());
      if (P.tipo === 'contundente' || g.rompeEscudo) { m.stunT = Math.max(m.stunT || 0, 1.2); return true; }
      g.audio.play('dig.stone', { pos: m.soundPos(), vol: 0.9, pitch: 1.3 });
      g.particles.burst(m.body.pos.x, m.body.pos.y + 0.4, m.body.pos.z, [[1, 0.9, 0.7]], 6, 2);
      if (Math.hypot(p.x - m.body.pos.x, p.z - m.body.pos.z) < 2.6 && jugando(g)) {
        m.data.pellizco = 0.4;
        g.damagePlayer(2, m.body.pos.x, m.body.pos.z, 'Pellizco de cangrejo tenaza', false, true);
        g.addEffect('sangrando', 8);
      }
      pistaCaparazon(g);
      return 0.4; // atajado a medias: entra el 40 % (entities.hurt acepta un factor)
    },
    animate(m, dt, u) {
      const v = m.walk * 3.4;
      for (const P of u.patas) P.piv.rotation.z = Math.sin(v + P.i * 2 + (P.s > 0 ? 0 : Math.PI)) * 0.3 * m.walkAmt;
      u.grande.rotation.x = -(m.data.pellizco || 0) * 2;
      u.dedo.rotation.x = Math.sin(m.t * 4) * 0.2 - 0.1;
    },
  },
};

// ---------- dónde y cuándo salen (de noche, cada uno en su bioma; desde el día 2) ----------
function suelo(w, x, z, y0) { for (let y = Math.min(120, y0 + 20); y > Math.max(2, y0 - 30); y--) if (SOLID[w.getBlock(x, y - 1, z)] && w.getBlock(x, y, z) === AIR && w.getBlock(x, y + 1, z) === AIR) return y; return null; }
const LUCES = new Set(['torch', 'wall_torch0', 'wall_torch1', 'wall_torch2', 'wall_torch3', 'fogata', 'farol', 'lamp'].map((k) => K[k]).filter(Boolean));
function oscuro(w, x, y, z) { for (let dx = -6; dx <= 6; dx += 2) for (let dz = -6; dz <= 6; dz += 2) for (let dy = -2; dy <= 3; dy++) if (LUCES.has(w.getBlock(x + dx, y + dy, z + dz))) return false; return true; }
const cerca = (w, x, y, z, set, r = 6) => { for (let dx = -r; dx <= r; dx += 2) for (let dz = -r; dz <= r; dz += 2) for (let dy = -3; dy <= 1; dy++) if (set(w.getBlock(x + dx, y + dy, z + dz))) return true; return false; };
export function bichos3Spawn(E, g) {
  if (g.dim !== 'tierra' || g.mode !== 'survival' || !g.settings.hostiles || !difOf(g).hostiles || (g.day || 1) < 2 || g.daylight > 0.3) return false;
  const w = g.world, pl = g.player.body.pos;
  const vivos = E.mobs.filter((m) => !m.dead && BICHOS3[m.type]);
  if (vivos.length >= 4 + Math.min(3, Math.floor((g.day || 1) / 8))) return false;
  const a = Math.random() * Math.PI * 2, r = 18 + Math.random() * 18;
  const x = Math.floor(pl.x + Math.cos(a) * r), z = Math.floor(pl.z + Math.sin(a) * r);
  if (!w.isLoaded(x, z)) return false;
  const v = g.nearestVillage && g.nearestVillage(x, z);
  if (v && v.dist < (v.v.R || 60)) return false;
  const col = w.gen.column(x, z), bio = col.biome, y = suelo(w, x, z, Math.floor(pl.y));
  if (y === null || FLUID[w.getBlock(x, y - 1, z)] || !oscuro(w, x, y, z)) return false;
  const cuenta = (t) => vivos.filter((m) => m.type === t).length;
  const guana = regionAt(w.gen, x, z) === 'guanacaste';
  const opciones = [];
  if (['jungle', 'manglar', 'forest'].includes(bio)) opciones.push('arana_bananera');
  if (['forest', 'jungle', 'nuboso'].includes(bio)) opciones.push('escarabajo');
  if (['plains', 'jungle', 'manglar', 'forest', 'beach'].includes(bio) && cerca(w, x, y, z, (id) => FLUID[id] && BLOCKS[id] && BLOCKS[id].key !== 'lava')) opciones.push('sapo_bufo');
  if (['mountains', 'nuboso', 'paramo'].includes(bio) || y < 50) opciones.push('ciempies');
  if ((bio === 'bosque_seco' || (bio === 'plains' && guana)) && (g.day || 1) >= 3) opciones.push('luz_mala');
  if (bio === 'beach') opciones.push('cangrejo_tenaza', 'cangrejo_tenaza');
  const libres = opciones.filter((t) => cuenta(t) < 2);
  if (!libres.length) return false;
  const t = libres[Math.floor(Math.random() * libres.length)];
  const m = E.spawnMob(t, x + 0.5, y + (t === 'luz_mala' ? 1.5 : 0.1), z + 0.5);
  return !!m;
}
// /prueba bichos3 [cuál]
export function pruebaBichos3(g, cual) {
  const p = g.player.body.pos, d = g.player.lookDir();
  const tipos = cual && BICHOS3[cual] ? [cual] : Object.keys(BICHOS3);
  tipos.forEach((t, i) => {
    const o = (i - (tipos.length - 1) / 2) * 2.2, m = g.entities.spawnMob(t, p.x + d.x * 7 - d.z * o, p.y + (t === 'luz_mala' ? 1.5 : 0.3), p.z + d.z * 7 + d.x * o);
    if (m) m.data.apuro = true;
  });
  return `${tipos.map((t) => BICHOS3[t].name).join(', ')}: delante (de día la luz mala se apaga; pruébela de noche)`;
}
