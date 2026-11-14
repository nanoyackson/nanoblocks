// El río y el patio: las lavanderas que en las mañanas golpean la ropa en las piedras del río (la tienden al sol en el
// zacate y conversan chismes ficticios) y el chancho del patio que hoza y a veces se escapa con la doña detrás.
import * as THREE from 'three';
import { AIR, BLOCKS, SOLID } from './blocks.js';
import { decir } from './misiones.js';

const mb = (c) => new THREE.MeshBasicMaterial({ color: c });
const caja = (w, h, d, c, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mb(c)); m.position.set(x, y, z); return m; };
const ROPA = [0xd83a3a, 0x3a6ad8, 0xf0d040, 0xf4f4f0, 0x3ab84a, 0xe07ac0, 0xf08a30];
const CHISMES = [
  '¿Supo lo de la hija de doña Chela? ¡Se fue con el de la cimarrona!',
  'Esta camisa no hay jabón que la limpie, mi amor.',
  '¡Uy, este río viene heladísimo hoy!',
  'Dicen que el regidor ficticio prometió puente… desde hace veinte años.',
  'Pásame el jabón de cuadro, porfa.',
  'Mi viejo dice que va a llover. Yo tiendo igual.',
  '¡Ay, se me fue una media río abajo!',
];

// el suelo de verdad (los ríos se tallan después del generador): primer bloque no-aire bajando desde y0
const esAgua = (id) => BLOCKS[id] && BLOCKS[id].key === 'water';
function sueloEn(w, x, z, y0) { for (let y = Math.floor(y0) + 8; y > y0 - 14; y--) { const id = w.getBlock(x, y, z); if (SOLID[id] || esAgua(id)) return { y, id }; } return null; }
// ¿orilla buena? tierra pegada al agua del río (no al mar), al mismo nivel o un bloque arriba, con espacio para pararse
function orilla(g, x, z, yRef) {
  const w = g.world, c = w.gen.column(x, z);
  if (c.biome === 'ocean' || c.biome === 'beach' || c.biome === 'manglar') return null;
  const s = sueloEn(w, x, z, yRef);
  if (!s || esAgua(s.id) || BLOCKS[s.id].leafy) return null;
  const y = s.y + 1;
  if (SOLID[w.getBlock(x, y, z)] || SOLID[w.getBlock(x, y + 1, z)]) return null;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    for (const wy of [s.y, s.y - 1]) {
      if (esAgua(w.getBlock(x + dx, wy, z + dz)) && w.getBlock(x + dx, wy + 1, z + dz) === AIR && esAgua(w.getBlock(x + dx * 2, wy, z + dz * 2))) return { x, y, z, dx, dz, wy };
    }
  }
  return null;
}
function vestirLavandera(m, i) {
  const u = m.group.userData;
  if (u.lavTraje || !u.body) return;
  const torso = u.body.children[0], p = torso && torso.geometry && torso.geometry.parameters;
  if (!p) return;
  const falda = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.42, 0.7, 10), mb([0x2a4a8a, 0x7a2a5a, 0x2a6a4a][i % 3]));
  falda.position.set(0, torso.position.y - p.height * 0.5 - 0.27, 0);
  const delantal = caja(p.width * 0.8, p.height * 0.9, 0.03, 0xf4f0e4, 0, torso.position.y - p.height * 0.15, p.depth * 0.5 + 0.03);
  u.body.add(falda, delantal);
  if (u.head) { const pa = caja(0.5, 0.14, 0.5, [0xd83a3a, 0xf0d040, 0x3a6ad8][i % 3], 0, 0.22, -0.02); u.head.add(pa); }
  u.lavTraje = true;
}

export function tickLavanderas(g, dt) {
  if (g.dim !== 'tierra') { limpiarLavanderas(g); return; }
  const p = g.player.body.pos, t = g.time || 0;
  const toca = g.daylight > 0.5 && t > 0.06 && t < 0.32 && !(g.weather && g.weather.intensity > 0.4);
  let L = g.lavanderas;
  if (L && (!toca || Math.hypot(L.x - p.x, L.z - p.z) > 70)) { terminar(g); L = null; }
  if (!L) {
    if (!toca) return;
    g.lavT = (g.lavT || 0) - dt;
    if (g.lavT > 0) return;
    g.lavT = 5;
    let a = null;
    for (let k = 0; k < 70 && !a; k++) { const x = Math.floor(p.x + (Math.random() - 0.5) * 56), z = Math.floor(p.z + (Math.random() - 0.5) * 56); if (g.world.isLoaded(x, z)) a = orilla(g, x, z, p.y); }
    if (!a) return;
    const puestos = [a];
    for (let k = 0; k < 60 && puestos.length < 3; k++) {
      const x = a.x + Math.round((Math.random() - 0.5) * 10), z = a.z + Math.round((Math.random() - 0.5) * 10);
      if (puestos.some((q) => Math.abs(q.x - x) + Math.abs(q.z - z) < 2)) continue;
      const b = orilla(g, x, z, a.y); if (b) puestos.push(b);
    }
    if (puestos.length < 2) return;
    const grupo = new THREE.Group(); g.scene.add(grupo);
    const ls = puestos.map((q, i) => {
      const m = g.entities.spawnMob('vecino', q.x + 0.5, q.y + 0.2, q.z + 0.5);
      const here = { x: q.x, y: q.y, z: q.z };
      Object.assign(m.data, { home: here, plaza: { ...here }, name: ['Doña Chela', 'Doña Mireya', 'Doña Tere'][i] + ' (lavandera)', role: 'vecino', vid: `lav:${Math.random()}`, seed: 1300 + i * 17, lavar: true });
      if (m.kind.dress) m.kind.dress(m);
      // la piedra de lavar en el agua, a la altura de la cintura, con la pieza de ropa encima
      const wx = q.x + q.dx + 0.5 - q.dx * 0.35, wz = q.z + q.dz + 0.5 - q.dz * 0.35;
      const tope = q.y + 0.62, base = q.wy - 1;
      const piedra = caja(0.85, tope - base, 0.85, 0x7a7a74, wx, (tope + base) / 2, wz); piedra.rotation.y = Math.random() * 0.4; grupo.add(piedra);
      const tela = caja(0.5, 0.06, 0.38, ROPA[(Math.random() * ROPA.length) | 0], wx, tope + 0.03, wz); grupo.add(tela);
      // el canasto con ropa, al lado
      const lx = -q.dz, lz = q.dx;
      const cesto = new THREE.Group(); cesto.position.set(q.x + 0.5 + lx * 0.9 - q.dx * 0.3, q.y, q.z + 0.5 + lz * 0.9 - q.dz * 0.3); grupo.add(cesto);
      cesto.add(caja(0.55, 0.32, 0.45, 0xa07a40, 0, 0.16, 0));
      for (let k = 0; k < 3; k++) cesto.add(caja(0.42, 0.08, 0.34, ROPA[(k + i * 2) % ROPA.length], (Math.random() - 0.5) * 0.08, 0.34 + k * 0.05, (Math.random() - 0.5) * 0.06));
      return { m, q, dx: q.dx, dz: q.dz, tela, tope, wx, wz, fase: Math.random() * 3, ritmo: 1 + Math.random() * 0.25, golpes: 0, aSecar: 2 + ((Math.random() * 3) | 0) };
    });
    g.lavanderas = L = { x: a.x, z: a.z, ls, grupo, t: 0, charla: 3, tendidas: 0, avisado: false };
  }
  L.t += dt;
  // la conversa
  L.charla -= dt;
  if (L.charla <= 0) {
    L.charla = 6 + Math.random() * 6;
    const q = L.ls[(Math.random() * L.ls.length) | 0];
    if (!q.m.dead && Math.hypot(q.m.body.pos.x - p.x, q.m.body.pos.z - p.z) < 22) { decir(g, q.m, CHISMES[(Math.random() * CHISMES.length) | 0], 3.2); q.habla = 3.2; }
  }
  for (const q of L.ls) {
    const m = q.m, u = m.group.userData;
    if (m.dead) continue;
    vestirLavandera(m, L.ls.indexOf(q));
    m.moving = false;
    m.targetYaw = Math.atan2(q.dx, q.dz);
    q.habla = Math.max(0, (q.habla || 0) - dt);
    if (!u.npcArms) continue;
    // golpear la ropa: levantan la pieza con las dos manos y la azotan contra la piedra
    q.fase += dt * q.ritmo * (q.habla > 0 ? 0.5 : 1);
    const c = q.fase % 1.2, k = c / 1.2;
    const arriba = k < 0.7 ? Math.sin((k / 0.7) * Math.PI * 0.5) : 1 - Math.pow((k - 0.7) / 0.3, 2);
    const brazo = -0.7 - Math.max(0, arriba) * 1.6;
    u.npcArms.forEach((a, i) => { a.rotation.x = brazo; a.rotation.z = (i ? -1 : 1) * 0.18; });
    // la tela sube con las manos y cae plana sobre la piedra
    q.tela.position.y = q.tope + 0.03 + Math.max(0, arriba) * 0.75;
    q.tela.position.x = q.wx - q.dx * Math.max(0, arriba) * 0.35; q.tela.position.z = q.wz - q.dz * Math.max(0, arriba) * 0.35;
    q.tela.scale.set(1, 1, 1 + Math.max(0, arriba) * 0.6);
    q.tela.rotation.x = q.dz * Math.max(0, arriba) * 1.2; q.tela.rotation.z = -q.dx * Math.max(0, arriba) * 1.2;
    const golpe = Math.floor(q.fase / 1.2);
    if (golpe !== q.golpes) {
      q.golpes = golpe;
      // ¡plaf! salpica un poco
      for (let n = 0; n < 6; n++) g.particles.spawn(q.wx + (Math.random() - 0.5) * 0.4, q.tope + 0.1, q.wz + (Math.random() - 0.5) * 0.4, [0.8, 0.9, 1], (Math.random() - 0.5) * 2, 1.5 + Math.random() * 1.5, (Math.random() - 0.5) * 2, 0.4, 18);
      const d = Math.hypot(q.wx - p.x, q.wz - p.z);
      if (d < 20) g.audio.play('dig.cloth', { pos: { x: q.wx, y: q.tope, z: q.wz }, vol: 0.7, pitch: 0.8 + Math.random() * 0.2 });
      // cada tantos golpes, una pieza limpia se va a secar al zacate
      if (golpe % 8 === 0 && q.aSecar > 0) { q.aSecar--; tender(g, L, q); }
    }
  }
  // la ropa que tienden se abre suave (como cuando la sacuden y la acomodan)
  for (const s of L.secando || []) if (s.t < 1) { s.t = Math.min(1, s.t + dt * 2); const k = 1 - Math.pow(1 - s.t, 3); s.tela.scale.set(k, 1, k); }
  if (!L.avisado && Math.hypot(L.x - p.x, L.z - p.z) < 16) {
    L.avisado = true;
    if (!g.meta.lavAviso) { g.meta.lavAviso = true; g.ui.toast('🧺 Unas lavanderas golpean la ropa en las piedras del río', 2800); }
    g.achieve('lavanderas', 'Las lavanderas del río');
  }
}
// tiende una pieza en el zacate, cerca de la lavandera, sobre suelo firme
function tender(g, L, q) {
  const w = g.world;
  for (let k = 0; k < 12; k++) {
    const x = q.q.x - q.dx * (1 + ((Math.random() * 3) | 0)) + Math.round((Math.random() - 0.5) * 4), z = q.q.z - q.dz * (1 + ((Math.random() * 3) | 0)) + Math.round((Math.random() - 0.5) * 4);
    const s = sueloEn(w, x, z, q.q.y);
    if (!s || esAgua(s.id) || BLOCKS[s.id].leafy || SOLID[w.getBlock(x, s.y + 1, z)]) continue;
    const h = s.y;
    const tela = caja(0.8, 0.03, 0.6, ROPA[(Math.random() * ROPA.length) | 0], x + 0.5, h + 1.02, z + 0.5);
    tela.rotation.y = Math.random() * Math.PI; tela.scale.set(0.01, 1, 0.01);
    L.grupo.add(tela);
    (L.secando ||= []).push({ tela, t: 0 });
    break;
  }
}
function terminar(g) {
  const L = g.lavanderas;
  if (!L) return;
  g.scene.remove(L.grupo);
  for (const q of L.ls) if (!q.m.dead) { q.m.data.lavar = false; q.m.data.irse = 3; }
  g.lavanderas = null;
}
export function limpiarLavanderas(g) {
  const L = g.lavanderas;
  if (!L) return;
  g.scene.remove(L.grupo);
  for (const q of L.ls) q.m.dead = true;
  g.lavanderas = null;
}

// ===== el chancho del patio (y la doña que sale corriendo detrás cuando se escapa) =====
function chancho(criollo) {
  // chancho criollo de patio: negro, o rosado con manchones negros (y siempre con barro)
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  const rosa = criollo ? 0x2e2824 : 0xe0a09a;
  body.add(caja(0.5, 0.42, 0.82, rosa, 0, 0.5, 0));
  body.add(caja(0.08, 0.1, 0.5, criollo ? 0x1a1614 : 0x3a302a, 0, 0.74, 0)); // la crin del lomo
  if (!criollo) body.add(caja(0.52, 0.3, 0.26, 0x2e2824, 0, 0.52, -0.18), caja(0.3, 0.2, 0.2, 0x2e2824, 0.11, 0.6, 0.22));
  body.add(caja(0.2, 0.12, 0.22, 0x8a6a4a, 0.16, 0.66, -0.1), caja(0.16, 0.1, 0.18, 0x8a6a4a, -0.14, 0.42, 0.2)); // barro
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.56, 0.42); body.add(cabeza);
  cabeza.add(caja(0.38, 0.34, 0.3, rosa, 0, 0, 0.1));
  cabeza.add(caja(0.2, 0.14, 0.08, criollo ? 0x7a5a52 : 0xd07a80, 0, -0.05, 0.28)); // trompa
  cabeza.add(caja(0.04, 0.04, 0.02, 0x5a2a2a, -0.05, -0.05, 0.325), caja(0.04, 0.04, 0.02, 0x5a2a2a, 0.05, -0.05, 0.325));
  cabeza.add(caja(0.05, 0.05, 0.02, 0x1a1a1a, -0.11, 0.07, 0.255), caja(0.05, 0.05, 0.02, 0x1a1a1a, 0.11, 0.07, 0.255));
  const orejas = [];
  for (const s of [-1, 1]) { const o = new THREE.Group(); o.position.set(s * 0.14, 0.17, 0.08); o.add(caja(0.12, 0.03, 0.14, criollo ? 0x2a2420 : 0xd08a88, 0, 0, 0.06)); o.rotation.x = 0.5; cabeza.add(o); orejas.push(o); }
  const patas = [];
  for (const [x, z] of [[-0.15, 0.28], [0.15, 0.28], [0.15, -0.28], [-0.15, -0.28]]) { const l = new THREE.Group(); l.position.set(x, 0.3, z); l.add(caja(0.12, 0.3, 0.12, rosa, 0, -0.15, 0), caja(0.12, 0.05, 0.12, 0x5a3a2a, 0, -0.28, 0)); body.add(l); patas.push(l); }
  const cola = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 4, 8, Math.PI * 1.6), mb(criollo ? 0x2a2420 : 0xd08a88)); cola.position.set(0, 0.62, -0.43); body.add(cola);
  g.userData = { body, cabeza, orejas, patas, cola };
  return g;
}
const GRITOS_DONA = ['¡Agarren ese chancho!', '¡Chanchooo, venga acá, sinvergüenza!', '¡Ay, Dios mío, se me salió otra vez!', '¡Atájelo, mi cielo, atájelo!'];

export function tickChanchos(g, dt) {
  if (g.dim !== 'tierra') { limpiarChanchos(g); return; }
  const p = g.player.body.pos, w = g.world;
  const near = g.nearestVillage(p.x, p.z);
  const toca = near && near.dist < 60 && g.daylight > 0.4;
  let H = g.chanchos;
  if (H && (!toca || Math.hypot(H.cx - p.x, H.cz - p.z) > 90)) { limpiarChanchos(g); H = null; }
  if (!H) {
    if (!toca) return;
    g.chanT = (g.chanT || 0) - dt;
    if (g.chanT > 0) return;
    g.chanT = 4;
    const c = near.v, cy = c.y || p.y, lista = [];
    for (let k = 0; k < 40 && lista.length < 2; k++) {
      const x = Math.floor(c.x + (Math.random() - 0.5) * 36), z = Math.floor(c.z + (Math.random() - 0.5) * 36);
      if (!w.isLoaded(x, z)) continue;
      const s = sueloEn(w, x, z, cy);
      if (!s || esAgua(s.id) || BLOCKS[s.id].leafy || SOLID[w.getBlock(x, s.y + 1, z)] || SOLID[w.getBlock(x, s.y + 2, z)] || Math.abs(s.y - cy) > 6) continue;
      const m = chancho(Math.random() < 0.5); m.position.set(x + 0.5, s.y + 1, z + 0.5); m.rotation.y = Math.random() * 6.28; g.scene.add(m);
      lista.push({ m, casa: { x: x + 0.5, z: z + 0.5 }, est: 'hoza', t: 0, paso: 0, rumbo: m.rotation.y, quieto: 1 + Math.random() * 2, gru: 2 + Math.random() * 6, y: s.y + 1 });
    }
    if (!lista.length) return;
    g.chanchos = H = { cx: c.x, cz: c.z, cy, lista, escape: 25 + Math.random() * 30, dona: null };
  }
  // de vez en cuando uno se escapa (si uno anda cerca para verlo)
  H.escape -= dt;
  if (H.escape <= 0 && !H.lista.some((q) => q.est === 'corre') && !H.dona) {
    H.escape = 50 + Math.random() * 50;
    const q = H.lista[(Math.random() * H.lista.length) | 0];
    if (Math.hypot(q.m.position.x - p.x, q.m.position.z - p.z) < 35) {
      q.est = 'corre'; q.t = 0;
      g.audio.play('chancho.chillido', { pos: q.m.position, vol: 0.9 });
      const a = Math.random() * 6.28, dx = q.m.position.x + Math.cos(a) * 4, dz = q.m.position.z + Math.sin(a) * 4;
      const s = sueloEn(w, Math.floor(dx), Math.floor(dz), q.y);
      if (s && !esAgua(s.id)) {
        const d = g.entities.spawnMob('vecino', dx, s.y + 1.2, dz);
        const here = { x: Math.floor(dx), y: s.y + 1, z: Math.floor(dz) };
        Object.assign(d.data, { home: here, plaza: { ...here }, name: 'Doña Lupe (la del chancho)', role: 'vecino', vid: `chan:${Math.random()}`, seed: 1411, lavar: true });
        if (d.kind.dress) d.kind.dress(d);
        H.dona = { m: d, q, grito: 0.5, t: 0 };
      }
    }
  }
  for (const q of H.lista) tickChancho(g, H, q, dt, p);
  // la doña: corre detrás con los brazos arriba, gritando
  const D = H.dona;
  if (D && !D.m.dead) {
    const m = D.m, u = m.group.userData, q = D.q;
    D.t += dt;
    vestirLavandera(m, 1);
    if (q.est === 'corre') {
      m.goTo(q.m.position.x, q.m.position.z, 2.1);
      if (u.npcArms) u.npcArms.forEach((a, i) => { a.rotation.x = -2.5 + Math.sin(m.t * 10 + i * 3) * 0.4; a.rotation.z = (i ? -1 : 1) * 0.3; });
      D.grito -= dt;
      if (D.grito <= 0) { D.grito = 3 + Math.random() * 2; decir(g, m, GRITOS_DONA[(Math.random() * GRITOS_DONA.length) | 0], 2.2); }
      // lo alcanza ella después de un buen rato
      if (q.t > 14 && Math.hypot(m.body.pos.x - q.m.position.x, m.body.pos.z - q.m.position.z) < 1.4) atrapar(g, H, q, false);
    } else {
      // vuelve a la casa, satisfecha
      m.goTo(q.casa.x + 1.5, q.casa.z, 1);
      if (u.npcArms) u.npcArms.forEach((a, i) => { a.rotation.x = -0.4 + Math.sin(m.walk) * m.walkAmt * 0.4 * (i ? 1 : -1); a.rotation.z = 0; });
      if (D.t > 6 && (!m.moving || D.t > 25)) { m.data.lavar = false; m.data.irse = 2; H.dona = null; }
    }
  } else if (D) H.dona = null;
}
function tickChancho(g, H, q, dt, p) {
  const w = g.world, o = q.m.position, u = q.m.userData;
  q.t += dt;
  let vel = 0, cabeza = 0;
  if (q.est === 'hoza') {
    // camina un poquito, se para y hoza con la trompa
    q.quieto -= dt;
    if (q.quieto <= 0) {
      if (q.camina) { q.camina = false; q.quieto = 2 + Math.random() * 4; } else { q.camina = true; q.quieto = 1 + Math.random() * 2; q.rumbo = Math.atan2(q.casa.x - o.x, q.casa.z - o.z) + (Math.random() - 0.5) * 2.4; }
    }
    vel = q.camina ? 0.8 : 0;
    if (!q.camina) { cabeza = 0.45 + Math.sin(q.t * 9) * 0.12; if (Math.random() < dt * 4) g.particles.spawn(o.x + Math.sin(q.m.rotation.y) * 0.7, o.y + 0.1, o.z + Math.cos(q.m.rotation.y) * 0.7, [0.45, 0.32, 0.2], (Math.random() - 0.5), 1.2, (Math.random() - 0.5), 0.5, 18); }
    q.gru -= dt;
    if (q.gru <= 0) { q.gru = 4 + Math.random() * 8; if (Math.hypot(o.x - p.x, o.z - p.z) < 20) g.audio.play('chancho', { pos: o, vol: 0.7, pitch: 0.9 + Math.random() * 0.2 }); }
  } else if (q.est === 'corre') {
    // corre en zigzag, huyéndole a la doña y al jugador
    const D = H.dona;
    let ax = Math.sin(q.rumbo) * 0.05, az = Math.cos(q.rumbo) * 0.05;
    for (const e of [D && D.m.body.pos, p]) { if (!e) continue; const dx = o.x - e.x, dz = o.z - e.z, d = Math.hypot(dx, dz) || 1; if (d < 7) { ax += dx / d / d; az += dz / d / d; } }
    // sin irse lejos del pueblo
    const dc = Math.hypot(o.x - H.cx, o.z - H.cz);
    if (dc > 22) { ax += (H.cx - o.x) / dc * 0.3; az += (H.cz - o.z) / dc * 0.3; }
    const quiere = Math.atan2(ax, az) + Math.sin(q.t * 3) * 0.6;
    let dif = quiere - q.rumbo; dif = Math.atan2(Math.sin(dif), Math.cos(dif));
    q.rumbo += dif * Math.min(1, dt * 4);
    vel = 4.2;
    if (Math.random() < dt * 0.8) g.audio.play('chancho.chillido', { pos: o, vol: 0.7, pitch: 0.95 + Math.random() * 0.15 });
    // ¡lo agarró el jugador!
    if (Math.hypot(o.x - p.x, o.z - p.z) < 1.3 && Math.abs(o.y - p.y) < 1.5) atrapar(g, H, q, true);
    else if (q.t > 40) atrapar(g, H, q, false);
  } else if (q.est === 'vuelve') {
    const d = Math.hypot(q.casa.x - o.x, q.casa.z - o.z);
    q.rumbo = Math.atan2(q.casa.x - o.x, q.casa.z - o.z);
    vel = d > 0.8 ? 1.4 : 0;
    if (d <= 0.8 || q.t > 30) { q.est = 'hoza'; q.quieto = 3; }
  }
  // moverse siguiendo el suelo (no se sube a paredes: si el escalón es alto, da la vuelta)
  if (vel > 0) {
    const nx = o.x + Math.sin(q.rumbo) * vel * dt, nz = o.z + Math.cos(q.rumbo) * vel * dt;
    const s = sueloEn(w, Math.floor(nx), Math.floor(nz), q.y);
    if (s && !esAgua(s.id) && s.y + 1 - q.y <= 1 && !SOLID[w.getBlock(Math.floor(nx), s.y + 1, Math.floor(nz))]) { o.x = nx; o.z = nz; q.y = s.y + 1; } else q.rumbo += Math.PI * (0.5 + Math.random() * 0.5);
  }
  o.y += (q.y - o.y) * Math.min(1, dt * 12);
  let r = q.rumbo - q.m.rotation.y; r = Math.atan2(Math.sin(r), Math.cos(r));
  q.m.rotation.y += r * Math.min(1, dt * (q.est === 'corre' ? 10 : 5));
  // patas, cuerpo, orejas y la colita
  q.paso += dt * vel * 5.5;
  const amp = Math.min(1, vel / 1.2) * (q.est === 'corre' ? 0.9 : 0.5);
  u.patas.forEach((l, i) => { l.rotation.x = Math.sin(q.paso + (i === 0 || i === 2 ? 0 : Math.PI)) * amp; });
  u.body.position.y = Math.abs(Math.sin(q.paso)) * 0.05 * amp;
  u.body.rotation.x = q.est === 'corre' ? Math.sin(q.paso * 2) * 0.05 : 0;
  u.cabeza.rotation.x += (cabeza - u.cabeza.rotation.x) * Math.min(1, dt * 8);
  u.orejas.forEach((e, i) => { e.rotation.x = 0.5 + (q.est === 'corre' ? Math.sin(q.paso * 2 + i) * 0.5 : Math.sin(q.t * 2 + i) * 0.08); });
  u.cola.rotation.z = Math.sin(q.t * (q.est === 'corre' ? 20 : 5)) * 0.6;
}
function atrapar(g, H, q, porJugador) {
  q.est = 'vuelve'; q.t = 0;
  const D = H.dona;
  if (porJugador) {
    g.achieve('chancho', 'Agarré el chancho');
    g.audio.play('chancho', { pos: q.m.position, vol: 0.9 });
    if (D && !D.m.dead) { decir(g, D.m, '¡Ay, gracias, mi cielo! Tome un tamalito, por la ayuda.', 3); g.giveItem(353, 1); } else g.ui.toast('🐖 ¡Agarró el chancho!', 1600);
  } else if (D && !D.m.dead) decir(g, D.m, '¡Ya te agarré, sinvergüenza! Para la casa.', 2.5);
  if (D) D.t = 0;
}
export function limpiarChanchos(g) {
  const H = g.chanchos;
  if (!H) return;
  for (const q of H.lista) g.scene.remove(q.m);
  if (H.dona && !H.dona.m.dead) H.dona.m.dead = true;
  g.chanchos = null;
}
