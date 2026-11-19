// v13.6.0: dos criaturas de los salones de la Red Honda que quedaban del plan de contenido (PLAN_CONTENIDO_MUNDO §4). Sin generador nuevo: valen en todo mundo de generador >= 28.
//  · el Culebrón de brasa: vive en la Caldera, sale de la lava y no se aleja de ella; 24 de vida, 4 de mordida y 3 s de ardor; suelta brasa viva (0-2).
//  · la Anguila Mayor: dueña de la Laguna Honda (minijefe T3, una vez por mundo, la hace aparecer el anfitrión: ver duenos.js); descarga bajo el agua (anillo rojo 1,2 s antes,
//    3 de daño, solo a quien esté nadando cerca) y muerde a quien nada pegado a ella; suelta escama azul (1-2).
// Todo lo del azar de la partida es de tiempo real y solo lo corre el anfitrión (spawnMob descarta lo de un invitado); lo que sale del mundo (dónde hay Caldera o Laguna) sale de hash.
import * as THREE from 'three';
import { atacar, avisoCaida } from './golpes.js';
import { swim } from './mar.js';
import { agua } from './salonlugar.js';

const G = () => new THREE.Group();
const mat = (c) => new THREE.MeshLambertMaterial({ color: c });
const brasa = (c) => { const m = new THREE.MeshBasicMaterial({ color: c, fog: false }); return m; };
// todas las personas vivas de la sala (la del anfitrión y las invitadas); `obj` es null para la propia, que es lo que pide damagePlayer
const personas = (g) => [g.player, ...g.otrosJugadores()].filter((q) => q && q.alive).map((q) => ({ q, pos: q.body.pos, obj: q === g.player ? null : q }));
const masCerca = (L, x, z) => { let mejor = null, md = 1e9; for (const e of L) { const d = Math.hypot(e.pos.x - x, e.pos.z - z); if (d < md) { md = d; mejor = e; } } return mejor ? { ...mejor, d: md } : null; };

// ---------- el Culebrón de brasa: cuerpo de piedra negra con vetas de brasa, cabeza ancha y lengua de fuego ----------
const N_CULEBRON = 7;
export function armarCulebron() {
  const g = G(), segs = [];
  for (let i = 0; i < N_CULEBRON; i++) {
    const s = G(), r = 0.2 - i * 0.018;
    const cuerpo = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), mat(i % 2 ? 0x2a2420 : 0x3a302a)); cuerpo.scale.set(1, 0.85, 1.25); cuerpo.position.y = r * 0.85; s.add(cuerpo);
    const veta = new THREE.Mesh(new THREE.SphereGeometry(r * 0.42, 6, 4), brasa(i % 2 ? 0xff7a1c : 0xffb03a)); veta.position.set(0, r * 1.5, 0); veta.userData.glow = true; s.add(veta);
    s.position.z = -i * 0.3;
    g.add(s); segs.push(s);
  }
  const cab = G(); cab.position.set(0, 0.2, 0.3); g.add(cab);
  const cr = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), mat(0x2e2622)); cr.scale.set(1.1, 0.75, 1.15); cab.add(cr);
  for (const s of [-1, 1]) { const ojo = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 4), brasa(0xffd040)); ojo.position.set(s * 0.12, 0.07, 0.18); ojo.userData.glow = true; cab.add(ojo); }
  const lengua = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.01, 0.2), brasa(0xff5a10)); lengua.position.set(0, -0.02, 0.36); lengua.userData.glow = true; cab.add(lengua);
  g.userData = { segs, cab, lengua };
  return g;
}

// ---------- la Anguila Mayor: larga, azul oscura con el vientre claro y dos aletas ----------
const N_ANGUILA = 9;
export function armarAnguila() {
  const g = G(), body = G(), segs = [];
  g.add(body);
  for (let i = 0; i < N_ANGUILA; i++) {
    const s = G(), r = 0.34 - i * 0.026;
    const cuerpo = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), mat(i % 3 === 2 ? 0x2c5a82 : 0x1f3f63)); cuerpo.scale.set(0.9, 0.85, 1.5); s.add(cuerpo);
    const panza = new THREE.Mesh(new THREE.SphereGeometry(r * 0.8, 6, 4), mat(0xb8d6e6)); panza.scale.set(0.8, 0.4, 1.4); panza.position.y = -r * 0.45; s.add(panza);
    if (i % 3 === 1) { const chispa = new THREE.Mesh(new THREE.SphereGeometry(0.05, 5, 4), brasa(0x7ad8ff)); chispa.position.y = r * 0.8; chispa.userData.glow = true; s.add(chispa); }
    s.position.z = -i * 0.52 + 1.4;
    body.add(s); segs.push(s);
  }
  const cab = G(); cab.position.set(0, 0, 1.95); body.add(cab);
  const cr = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), mat(0x1c3a5c)); cr.scale.set(0.95, 0.75, 1.3); cab.add(cr);
  for (const s of [-1, 1]) {
    const ojo = new THREE.Mesh(new THREE.SphereGeometry(0.05, 5, 4), brasa(0xe8f6ff)); ojo.position.set(s * 0.2, 0.1, 0.22); ojo.userData.glow = true; cab.add(ojo);
    const aleta = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.22), mat(0x3a74a0)); aleta.position.set(s * 0.34, -0.05, -0.05); aleta.rotation.z = s * 0.4; cab.add(aleta);
  }
  g.userData = { body, segs, cab };
  return g;
}

// ---------- v13.7.1 (La Hondura, HO3): la salamandra de brasa, mansa hasta que la golpean: baja, de piel negra con manchas de brasa y cola larga ----------
export function armarSalamandra() {
  const g = G(), segs = [];
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.62), mat(0x2b2521)); cuerpo.position.y = 0.14; g.add(cuerpo);
  for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, 0.09), brasa(i % 2 ? 0xff8a1c : 0xffc040)); m.position.set((i % 2 ? 1 : -1) * 0.07, 0.23, -0.2 + i * 0.13); m.userData.glow = true; g.add(m); }
  const cab = G(); cab.position.set(0, 0.15, 0.36); g.add(cab);
  const cr = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.13, 0.26), mat(0x332b26)); cab.add(cr);
  for (const s of [-1, 1]) { const ojo = new THREE.Mesh(new THREE.SphereGeometry(0.03, 5, 4), brasa(0xffe060)); ojo.position.set(s * 0.1, 0.07, 0.1); ojo.userData.glow = true; cab.add(ojo); }
  for (let i = 0; i < 4; i++) { const s = G(), r = 0.08 - i * 0.015; const c = new THREE.Mesh(new THREE.BoxGeometry(r * 2, r * 1.4, 0.2), mat(i % 2 ? 0x2b2521 : 0x3a2f28)); c.position.z = -0.1; s.add(c); s.position.set(0, 0.1, -0.3 - i * 0.2); g.add(s); segs.push(s); }
  const patas = [];
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const p = G(); p.position.set(sx * 0.2, 0.1, sz * 0.2); const pm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.1), mat(0x241e1b)); pm.position.y = -0.04; p.add(pm); g.add(p); patas.push(p); }
  g.userData = { segs, cab, patas };
  return g;
}

// ---------- el Tizón Mayor: un montón de brasas con forma de gigante (dueño de la Fragua) ----------
export function armarTizon() {
  const g = G(), roca = (w, h, d, c) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
  const torso = roca(1.1, 1.2, 0.7, 0x2a2420); torso.position.y = 1.7; g.add(torso);
  const pecho = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.05), brasa(0xff7a1c)); pecho.position.set(0, 1.75, 0.37); pecho.userData.glow = true; g.add(pecho);
  for (const [x, y] of [[-0.3, 2.1], [0.32, 1.45], [-0.2, 1.3]]) { const v = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.34, 0.05), brasa(0xffb03a)); v.position.set(x, y, 0.37); v.userData.glow = true; g.add(v); }
  const cab = G(); cab.position.set(0, 2.62, 0.05); g.add(cab);
  const cr = roca(0.55, 0.5, 0.5, 0x332b26); cab.add(cr);
  for (const s of [-1, 1]) { const ojo = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.04), brasa(0xffe060)); ojo.position.set(s * 0.14, 0.04, 0.26); ojo.userData.glow = true; cab.add(ojo); }
  const boca = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.04), brasa(0xff5a10)); boca.position.set(0, -0.12, 0.26); boca.userData.glow = true; cab.add(boca);
  const brazos = [], piernas = [];
  for (const s of [-1, 1]) {
    const br = G(); br.position.set(s * 0.8, 2.2, 0); const bm = roca(0.4, 1.3, 0.4, 0x3a302a); bm.position.y = -0.55; br.add(bm);
    const pu = roca(0.5, 0.45, 0.5, 0x241e1b); pu.position.y = -1.3; br.add(pu); const bb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.3), brasa(0xff8a1c)); bb.position.y = -1.05; bb.userData.glow = true; br.add(bb);
    g.add(br); brazos.push(br);
    const pi = G(); pi.position.set(s * 0.3, 1.1, 0); const pm = roca(0.45, 1.1, 0.45, 0x2f2723); pm.position.y = -0.5; pi.add(pm); g.add(pi); piernas.push(pi);
  }
  g.userData = { cab, brazos, piernas };
  return g;
}

export const SALON_MOBS = {
  salamandra_brasa: {
    name: 'Salamandra de brasa', w: 0.45, h: 0.35, health: 14, speed: 2.6, hostile: false, attack: 3, lavaOk: true, hurtSound: 'gato.bufido', idleSound: 'magma_burbujea', idleEvery: [8, 16],
    particle: [[1, 0.5, 0.1], [0.2, 0.15, 0.1]], drops: [[1200, 0, 1]], xp: 6, grupo: 'caparazon',
    build() { return armarSalamandra(); },
    // mansa hasta que la golpean; entonces persigue a la persona más cercana y muerde a 3 (con 2 s de ardor para quien la golpeó)
    onHurt(m) { m.data.angry = true; m.data.rabia = 12; return true; },
    brain(m, dt, c) {
      const { g } = c, D = m.data, b = m.body.pos;
      if (!D.angry) return false;
      D.rabia -= dt; if (D.rabia <= 0) { D.angry = false; return false; }
      const T = g.mode === 'survival' ? masCerca(personas(g), b.x, b.z) : null;
      if (!T || T.d > 20) { D.angry = false; return false; }
      m.goTo(T.pos.x, T.pos.z, T.d > 4 ? 1.4 : 1);
      if (T.d < 1.8 && m.attackCd <= 0 && Math.abs(T.pos.y - b.y) < 1.5) {
        atacar(m, g, { tipo: 'mordida', prep: 0.4, dano: m.kind.attack, causa: 'Mordida de la salamandra de brasa', alcance: 1.8, cd: 1.8, alGolpe: (llego) => { if (llego && !T.obj) g.addEffect('ardor', 2); } });
      }
      return true;
    },
    animate(m, dt, u) {
      const ola = m.walk * 2.4;
      u.segs.forEach((s, i) => { s.position.x = Math.sin(ola - i * 0.9) * 0.07 * (0.4 + m.walkAmt); });
      u.patas.forEach((p, i) => { p.rotation.x = Math.sin(ola * 1.5 + (i % 2 ? 3.1 : 0)) * 0.5 * m.walkAmt; });
      u.cab.rotation.y = Math.sin(ola) * 0.18 * m.walkAmt;
    },
  },
  tizon_mayor: {
    name: 'El Tizón Mayor', w: 1.2, h: 3.2, health: 130, speed: 2.4, hostile: true, boss: true, mini: true, lavaOk: true, hurtSound: 'gato.bufido', idleSound: 'magma_burbujea', idleEvery: [5, 10],
    particle: [[1, 0.5, 0.1], [0.25, 0.18, 0.12]], drops: [[1200, 1, 2], [260, 2, 3]], xp: 60, grupo: 'caparazon',
    build() { return armarTizon(); },
    brain(m, dt, c) {
      const { g } = c, D = m.data, b = m.body.pos;
      const gente = g.mode === 'survival' ? personas(g) : [], T = masCerca(gente, b.x, b.z);
      if (!T || T.d > 26) { D.angry = false; return false; }
      D.angry = true;
      m.targetYaw = Math.atan2(T.pos.x - b.x, T.pos.z - b.z); m.moving = T.d > 2.8; m.speedMul = 1;
      // la ola de brasa: cada 9 s, el anillo rojo avisa 1,2 s y quema (3 de daño y ardor) a quien esté a menos de 4,5
      D.ola = (D.ola ?? 5) - dt;
      if (!D.carga && D.ola <= 0 && T.d < 16) { D.ola = 9; D.carga = { t: 1.2 }; avisoCaida(g, b.x, b.y, b.z, 4.5, 1.2, m); g.audio.play('ignite', { pos: m.soundPos(), vol: 0.4, pitch: 0.6 }); }
      if (D.carga) {
        D.carga.t -= dt;
        if (D.carga.t <= 0) {
          D.carga = null;
          g.particles.burst(b.x, b.y + 0.4, b.z, [[1, 0.55, 0.15], [1, 0.85, 0.3]], 30, 3.2);
          g.audio.play('ignite', { pos: m.soundPos(), vol: 0.55, pitch: 0.8 });
          for (const e of gente) if (Math.hypot(e.pos.x - b.x, e.pos.z - b.z) < 4.5 && Math.abs(e.pos.y - b.y) < 3) { g.atacante = m; g.damagePlayer(3, b.x, b.z, 'La ola de brasa del Tizón Mayor', true, false, e.obj); g.atacante = null; if (!e.obj) g.addEffect('ardor', 3); }
        }
      }
      if (T.d < 3.2 && m.attackCd <= 0 && Math.abs(T.pos.y - b.y) < 2.5) atacar(m, g, { tipo: 'mazazo', prep: 0.7, dano: 4, causa: 'El Tizón Mayor lo aplastó', alcance: 3.2, cd: 2 });
      return true;
    },
    animate(m, dt, u) {
      const ola = m.walk * 1.6, a = m.walkAmt;
      u.piernas[0].rotation.x = Math.sin(ola) * 0.5 * a; u.piernas[1].rotation.x = -Math.sin(ola) * 0.5 * a;
      u.brazos[0].rotation.x = -Math.sin(ola) * 0.4 * a; u.brazos[1].rotation.x = Math.sin(ola) * 0.4 * a;
      u.cab.rotation.y = Math.sin(m.t * 1.3) * 0.15;
    },
  },
  culebron_brasa: {
    name: 'Culebrón de brasa', w: 0.5, h: 0.5, health: 24, speed: 3.2, hostile: true, attack: 4, lavaOk: true, hurtSound: 'gato.bufido', idleSound: 'magma_burbujea', idleEvery: [5, 11],
    particle: [[1, 0.5, 0.1], [0.2, 0.15, 0.1]], drops: [[1200, 0, 2]], xp: 14, grupo: 'caparazon',
    build() { return armarCulebron(); },
    // sale de la lava y no la deja: solo persigue a quien está a menos de 12 de su sitio, y si no, vuelve
    brain(m, dt, c) {
      const { g } = c, D = m.data, b = m.body.pos;
      if (!D.home) D.home = { x: b.x, z: b.z };
      // la quemadura de quien no es el anfitrión: 1 de daño por segundo durante 3 s (el ardor del anfitrión es el efecto de siempre)
      if (D.arde) { D.arde.t -= dt; D.arde.tic -= dt; if (D.arde.tic <= 0) { D.arde.tic = 1; if (D.arde.e.q.alive) { g.atacante = m; g.damagePlayer(1, b.x, b.z, 'Quemadura del Culebrón de brasa', true, false, D.arde.e.obj); g.atacante = null; } } if (D.arde.t <= 0) D.arde = null; }
      const T = g.mode === 'survival' ? masCerca(personas(g), b.x, b.z) : null, pl = T && T.pos, distP = T ? T.d : 99;
      const lejos = pl ? Math.hypot(pl.x - D.home.x, pl.z - D.home.z) : 99;
      if (!T || distP > 22 || lejos > 12) {
        if (Math.hypot(b.x - D.home.x, b.z - D.home.z) > 2) { m.goTo(D.home.x, D.home.z, 1); return true; }
        return false;
      }
      m.goTo(pl.x, pl.z, distP > 6 ? 1.3 : 1);
      if (distP < 2.2 && m.attackCd <= 0 && Math.abs(pl.y - b.y) < 1.5) {
        atacar(m, g, { tipo: 'latigazo', prep: 0.45, dano: m.kind.attack, causa: 'Mordida del Culebrón de brasa', alcance: 2.2, cd: 2, alGolpe: (llego) => {
          if (!llego) return;
          if (!T.obj) g.addEffect('ardor', 3); else D.arde = { t: 3, tic: 1, e: T }; // la quemadura de 3 s
          g.particles.burst(pl.x, pl.y + 1, pl.z, [[1, 0.55, 0.15], [1, 0.85, 0.3]], 10, 1.6);
        } });
      }
      return true;
    },
    animate(m, dt, u) {
      const ola = m.walk * 2.2;
      u.segs.forEach((s, i) => { s.position.x = Math.sin(ola - i * 0.8) * 0.12 * (0.4 + m.walkAmt) * (i / 2 + 0.3); s.rotation.y = Math.cos(ola - i * 0.8) * 0.25 * m.walkAmt; });
      u.lengua.visible = Math.sin(m.t * 9) > 0;
      u.cab.rotation.y = Math.sin(ola) * 0.12 * m.walkAmt;
    },
  },
  anguila_mayor: {
    name: 'La Anguila Mayor', w: 0.8, h: 0.6, health: 90, speed: 3, swimmer: true, hostile: true, boss: true, mini: true, hurtSound: 'pez', idleSound: 'agua_corre', idleEvery: [6, 12],
    particle: [[0.4, 0.7, 1], [0.8, 0.95, 1]], drops: [[1201, 1, 2]], xp: 40, grupo: 'caparazon',
    build() { return armarAnguila(); },
    update(m, dt) {
      const g = m.game, b = m.body, D = m.data, w = g.world;
      // a quien persigue: a la persona que nada más cerca (la del anfitrión o una invitada); si nadie nada, a la más cercana
      const gente = g.mode === 'survival' ? personas(g) : [];
      const nada = (e) => agua(w, e.pos.x, e.pos.y + 0.5, e.pos.z) && !(e.obj ? false : g.riding);
      const T = masCerca(gente.filter(nada), b.pos.x, b.pos.z) || masCerca(gente, b.pos.x, b.pos.z);
      const pl = T ? T.pos : g.player.body.pos, nadando = !!T && nada(T);
      m.data.angry = true;
      const dpl = Math.hypot(pl.x - b.pos.x, pl.y - b.pos.y, pl.z - b.pos.z);
      swim(m, dt, {
        speed: 3, range: 12, vr: 3, accel: 1.8, turn: 3, tailSpeed: 0, hearFar: 30,
        goal: (mm, gg, d) => { if (!nadando || d > 26) return null; mm.speedMul = d > 5 ? 1.5 : 1; return { x: pl.x, y: pl.y + 0.3, z: pl.z }; },
      });
      // se ondula entera
      const u = m.group.userData, ola = m.t * 5 * (0.5 + Math.min(1, Math.hypot(b.vel.x, b.vel.z) / 3));
      if (u.segs) u.segs.forEach((s, i) => { s.position.x = Math.sin(ola - i * 0.7) * 0.1 * (i * 0.5 + 0.3); s.rotation.y = Math.cos(ola - i * 0.7) * 0.18; });
      // la descarga: cada 7 s, si alguien está a menos de 14, el anillo rojo avisa 1,2 s y luego pega 3 (como máximo) a quien esté nadando a menos de 7
      D.desc = (D.desc ?? 4) - dt;
      if (!D.carga && D.desc <= 0 && dpl < 14 && T) { D.desc = 7; D.carga = { t: 1.2, x: b.pos.x, y: b.pos.y, z: b.pos.z }; avisoCaida(g, b.pos.x, b.pos.y + 0.6, b.pos.z, 7, 1.2, m); g.audio.play('ignite', { pos: m.soundPos(), vol: 0.3, pitch: 0.6 }); }
      if (D.carga) {
        const C = D.carga; C.t -= dt; C.x = b.pos.x; C.z = b.pos.z;
        if (C.t <= 0) {
          D.carga = null;
          g.particles.burst(b.pos.x, b.pos.y + 0.5, b.pos.z, [[0.5, 0.85, 1], [1, 1, 1]], 24, 3.4);
          g.audio.play('ignite', { pos: m.soundPos(), vol: 0.5, pitch: 0.9 });
          for (const e of gente) if (nada(e) && Math.hypot(e.pos.x - C.x, e.pos.z - C.z) < 7 && Math.abs(e.pos.y - C.y) < 5) { g.atacante = m; g.damagePlayer(3, C.x, C.z, 'La Anguila Mayor lo electrocutó', true, false, e.obj); g.atacante = null; }
        }
      }
      // la mordida, pegado a ella y en el agua
      if (nadando && dpl < 2 && m.attackCd <= 0 && !m.panic) atacar(m, g, { tipo: 'mordida', prep: 0.5, dano: 4, causa: 'Mordida de la Anguila Mayor', alcance: 2, altura: 2.6, cd: 2.4 });
    },
  },
};
