// El campo guanacasteco: de vez en cuando pasa un sabanero a caballo arreando el ganado por el potrero, con su
// perro que trae de vuelta a las vacas que se desvían y el grito de siempre («¡Ooooh, vaca!»).
import * as THREE from 'three';
import { SEA } from './worldgen.js';
import { regionAt } from './regiones.js';
import { decir } from './misiones.js';

const mb = (c) => new THREE.MeshBasicMaterial({ color: c });
const caja = (w, h, d, c, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mb(c)); m.position.set(x, y, z); return m; };

// el sabanero: sombrero de lona, camisa, pañuelo, botas y el mecate en la mano
function jinete() {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    const pierna = new THREE.Group(); pierna.position.set(s * 0.2, 0, 0.05); pierna.rotation.z = s * 0.55;
    pierna.add(caja(0.15, 0.48, 0.16, 0x2a3a5a, 0, -0.22, 0), caja(0.17, 0.16, 0.24, 0x3a2414, 0, -0.5, 0.04));
    g.add(pierna);
  }
  const torso = new THREE.Group(); g.add(torso);
  torso.add(caja(0.42, 0.52, 0.24, 0xe6dcc0, 0, 0.3, 0));
  torso.add(caja(0.44, 0.08, 0.26, 0x5a3a1a, 0, 0.06, 0)); // faja
  torso.add(caja(0.3, 0.08, 0.27, 0xc02020, 0, 0.53, 0.01)); // pañuelo
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.74, 0); torso.add(cabeza);
  cabeza.add(caja(0.28, 0.28, 0.28, 0xb07a50, 0, 0, 0));
  cabeza.add(caja(0.2, 0.05, 0.02, 0x2a1a10, 0, 0.02, 0.15)); // ojos/cejas
  cabeza.add(caja(0.16, 0.04, 0.02, 0x3a2414, 0, -0.07, 0.15)); // bigote
  cabeza.add(caja(0.62, 0.04, 0.62, 0xd8c08a, 0, 0.16, 0), caja(0.32, 0.16, 0.32, 0xd8c08a, 0, 0.26, 0), caja(0.33, 0.04, 0.33, 0x3a2414, 0, 0.2, 0));
  // brazo izquierdo con las riendas; el derecho con el mecate
  const izq = new THREE.Group(); izq.position.set(-0.27, 0.5, 0); izq.rotation.x = -0.9; izq.add(caja(0.12, 0.42, 0.12, 0xe6dcc0, 0, -0.2, 0)); torso.add(izq);
  const der = new THREE.Group(); der.position.set(0.27, 0.5, 0); der.add(caja(0.12, 0.42, 0.12, 0xe6dcc0, 0, -0.2, 0)); torso.add(der);
  const lazo = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.025, 4, 18), mb(0xc8b080)); lazo.position.set(0, -0.45, 0); lazo.rotation.x = Math.PI / 2; lazo.visible = false; der.add(lazo);
  g.userData = { torso, cabeza, der, lazo };
  return g;
}

// el potrero tiene que estar parejo y despejado (sin barrancos, agua ni muchos árboles en el camino)
function caminoLibre(g, ini, fin) {
  const w = g.world, L = Math.hypot(fin.x - ini.x, fin.z - ini.z);
  let prev = null, estorbos = 0;
  for (let d = 0; d <= L; d += 1.5) {
    for (const lado of [-3, 0, 3]) {
      const k = d / L, px = (fin.z - ini.z) / L, pz = -(fin.x - ini.x) / L;
      const x = Math.floor(ini.x + (fin.x - ini.x) * k + px * lado), z = Math.floor(ini.z + (fin.z - ini.z) * k + pz * lado);
      if (!w.isLoaded(x, z)) return false;
      const h = w.gen.column(x, z).h;
      if (h <= SEA + 1) return false;
      if (lado === 0) { if (prev != null && Math.abs(h - prev) > 1) return false; prev = h; }
      if (w.getBlock(x, h + 1, z) && w.getBlock(x, h + 2, z)) estorbos++;
    }
  }
  return estorbos <= 4;
}

const GRITOS = ['¡Ooooooh, vaca!', '¡Hooo-ho! ¡Vamos, vamos!', '¡Eeeeh, la pinta, por aquí!', '¡Hágase a un lado, compa, que ahí va el ganado!'];

export function tickSabanero(g, dt) {
  if (g.dim !== 'tierra') return;
  const p = g.player.body.pos, E = g.entities;
  let A = g.arreo;
  if (!A) {
    g.arreoT = (g.arreoT ?? 30) - dt;
    if (g.arreoT > 0) return;
    g.arreoT = 20;
    if (g.daylight < 0.5 || (g.meta.arreoDia || 0) === (g.day || 1) || Math.random() > 0.3) return;
    const bio = g.env && g.env.biome;
    if (!(bio === 'plains' || bio === 'bosque_seco' || regionAt(g.world.gen, p.x, p.z) === 'guanacaste')) return;
    const v = g.nearestVillage(p.x, p.z);
    if (v && v.dist < 50) return;
    // el camino: pasa a unos pasos del jugador, de un lado al otro, por donde esté parejo
    let dir, perp, ini, fin;
    for (let k = 0; k < 10 && !ini; k++) {
      const ang = Math.random() * Math.PI * 2, lat = (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 4);
      dir = { x: Math.cos(ang), z: Math.sin(ang) }; perp = { x: -dir.z, z: dir.x };
      const a = { x: p.x - dir.x * 30 + perp.x * lat, z: p.z - dir.z * 30 + perp.z * lat }, b = { x: p.x + dir.x * 34 + perp.x * lat, z: p.z + dir.z * 34 + perp.z * lat };
      if (caminoLibre(g, a, b)) { ini = a; fin = b; }
    }
    if (!ini) return;
    const y0 = g.world.gen.column(Math.floor(ini.x), Math.floor(ini.z)).h + 1;
    g.meta.arreoDia = g.day || 1;
    const vacas = [];
    const n = 5 + ((Math.random() * 3) | 0);
    for (let i = 0; i < n; i++) {
      const m = E.spawnMob('vaca', ini.x + dir.x * (4 + Math.random() * 4) + perp.x * (Math.random() - 0.5) * 4, y0 + 0.5, ini.z + dir.z * (4 + Math.random() * 4) + perp.z * (Math.random() - 0.5) * 4);
      m.data.arreo = { off: (Math.random() - 0.5) * 5, atras: Math.random() * 3 };
      vacas.push(m);
    }
    const caballo = E.spawnMob('caballo', ini.x, y0 + 0.5, ini.z);
    caballo.data.arreo = { jinete: true }; caballo.data.saddle = true;
    const perro = E.spawnMob('perro', ini.x + perp.x * 3, y0 + 0.5, ini.z + perp.z * 3);
    perro.data.arreo = { perro: true };
    g.arreo = A = { vacas, caballo, perro, dir, perp, fin, t: 0, grito: 4, lazo: 0, avisado: false };
  }
  A.t += dt;
  // la que se queda pegada (un hueco, una cerca) brinca; si ni así, se queda pastando y el arreo sigue sin ella
  for (const m of A.vacas) {
    const o = m.data.arreo;
    if (!o || m.dead) continue;
    o.chk = (o.chk ?? 1.5) - dt;
    if (o.chk <= 0) {
      o.chk = 1.5;
      const mov = o.ux == null ? 1 : Math.hypot(m.body.pos.x - o.ux, m.body.pos.z - o.uz);
      o.ux = m.body.pos.x; o.uz = m.body.pos.z;
      // trabada: brinca y prueba por otro carril
      if (mov < 0.3) { o.pegada = (o.pegada || 0) + 1; if (m.body.onGround || m.body.inWater) m.body.vel.y = 6.5; o.off = Math.max(-6, Math.min(6, o.off + (Math.random() - 0.5) * 8)); } else o.pegada = 0;
      if (o.pegada >= 5) { m.data.arreo = null; m.moving = false; m.data.irse = 3; }
    }
  }
  const vivas = A.vacas.filter((m) => !m.dead && !m.dying && m.data.arreo);
  // el centro del hato
  let cx = 0, cz = 0;
  for (const m of vivas) { cx += m.body.pos.x; cz += m.body.pos.z; }
  if (vivas.length) { cx /= vivas.length; cz /= vivas.length; } else { cx = A.caballo.body.pos.x; cz = A.caballo.body.pos.z; }
  const { dir, perp, fin } = A;
  // cada vaca camina hacia el final con su carril; la que se aleja mucho del grupo se frena y el perro va por ella
  let rezagada = null, peor = 0;
  for (const m of vivas) {
    const o = m.data.arreo, b = m.body.pos;
    const lado = (b.x - cx) * perp.x + (b.z - cz) * perp.z, adelante = (b.x - cx) * dir.x + (b.z - cz) * dir.z;
    const lejos = Math.abs(lado - o.off) + Math.max(0, adelante - 4);
    if (lejos > peor) { peor = lejos; rezagada = m; }
    m.goTo(fin.x + perp.x * o.off - dir.x * o.atras, fin.z + perp.z * o.off - dir.z * o.atras, adelante > 3 ? 0.5 : 0.9);
  }
  // el sabanero, detrás del ganado, zigzagueando un poquito
  const C = A.caballo;
  if (!C.dead) {
    const atras = (C.body.pos.x - cx) * dir.x + (C.body.pos.z - cz) * dir.z;
    C.goTo(cx - dir.x * 4.5 + perp.x * Math.sin(A.t * 0.35) * 3, cz - dir.z * 4.5 + perp.z * Math.sin(A.t * 0.35) * 3, atras < -7 ? 0.75 : 0.42);
    const u = C.group.userData;
    if (!u.jinete && u.body) { u.jinete = jinete(); u.jinete.position.set(0, 1.62, 0.02); u.body.add(u.jinete); }
    if (u.jinete) {
      const J = u.jinete.userData;
      // se mece con el paso del caballo y mira al ganado
      u.jinete.position.y = 1.62 + Math.abs(Math.sin(C.walk || 0)) * 0.06 * (C.walkAmt || 0);
      J.torso.rotation.x = Math.sin(C.walk || 0) * 0.04 * (C.walkAmt || 0) + 0.06;
      J.cabeza.rotation.y = Math.sin(A.t * 0.5) * 0.4;
      // el grito, con el mecate dando vueltas en lo alto
      A.grito -= dt; A.lazo = Math.max(0, A.lazo - dt);
      const dP = Math.hypot(C.body.pos.x - p.x, C.body.pos.z - p.z);
      if (A.grito <= 0) {
        A.grito = 6 + Math.random() * 6; A.lazo = 2.6;
        if (dP < 35) {
          decir(g, C, GRITOS[(Math.random() * GRITOS.length) | 0], 2.6);
          if (C.data.globo) C.data.globo.position.y = 3.05;
          if (Math.random() < 0.4) g.audio.play('relincho', { pos: C.soundPos(), vol: 0.6 });
        }
      }
      const k = Math.min(1, A.lazo / 0.4, (2.6 - A.lazo) / 0.4);
      J.der.rotation.z = -Math.max(0, k) * 2.6;
      J.der.rotation.x = 0;
      J.lazo.visible = A.lazo > 0;
      J.lazo.rotation.z += dt * 12;
      if (!A.avisado && dP < 30) {
        A.avisado = true;
        if (!g.meta.arreoAviso) { g.meta.arreoAviso = true; g.ui.toast('🐄 ¡Ahí viene un sabanero arreando el ganado! Hágase a un lado', 3200); }
        g.achieve('sabanero_arreo', 'El arreo del sabanero');
      }
    }
  }
  // el perro: va de un lado al otro del hato, y si una se desvía corre a traerla
  const P = A.perro;
  if (!P.dead) {
    if (rezagada && peor > 5) {
      const b = rezagada.body.pos, lado = Math.sign((b.x - cx) * perp.x + (b.z - cz) * perp.z) || 1;
      P.goTo(b.x + perp.x * lado * 1.5, b.z + perp.z * lado * 1.5, 0.75);
      if (Math.hypot(P.body.pos.x - b.x, P.body.pos.z - b.z) < 2.2 && Math.random() < dt * 1.5) g.audio.play('perro', { pos: P.soundPos(), vol: 0.6 });
    } else {
      const s = Math.sin(A.t * 0.7) * 6;
      P.goTo(cx + perp.x * s - dir.x, cz + perp.z * s - dir.z, 0.5);
    }
  }
  // se terminó el arreo: llegaron, el jugador se fue lejos o pasó mucho rato
  const lleg = Math.hypot(cx - fin.x, cz - fin.z) < 6;
  if (lleg || !vivas.length || A.t > 150 || Math.hypot(cx - p.x, cz - p.z) > 90 || C.dead) terminarArreo(g);
}
function terminarArreo(g) {
  const A = g.arreo;
  if (!A) return;
  for (const m of [...A.vacas, A.caballo, A.perro]) if (!m.dead && m.data.arreo) { m.data.arreo = null; m.data.irse = 2; }
  g.arreo = null;
}
export function limpiarCampo(g) {
  const A = g.arreo;
  if (!A) return;
  for (const m of [...A.vacas, A.caballo, A.perro]) m.dead = true;
  g.arreo = null;
}
