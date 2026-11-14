// Noches ticas: el río de murciélagos que sale al atardecer, la lechuza blanca que chilla posada en un poste o un techo
// (y se va volando sin hacer ruido) y la Vía Láctea, que solo se ve bien lejos de las luces de los pueblos.
import * as THREE from 'three';
import { SOLID, AIR, BLOCKS } from './blocks.js';

const mb = (c) => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide });
const caja = (w, h, d, c, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mb(c)); m.position.set(x, y, z); return m; };

// ===== la Vía Láctea: más clara lejos de los pueblos y en noches sin luna llena =====
function tickVia(g, dt) {
  if (!g.sky || g.sky.viaK == null) return;
  const p = g.player.body.pos, v = g.nearestVillage(p.x, p.z);
  const luz = v ? Math.max(0, 1 - v.dist / 160) : 0;
  const quiere = g.dim === 'tierra' ? Math.max(0.12, 1 - luz * 0.9) : 0;
  g.sky.viaK += (quiere - g.sky.viaK) * Math.min(1, dt * 0.5);
  if (g.dim === 'tierra' && g.daylight < 0.15 && !luz && !(g.weather && g.weather.intensity > 0.2) && Math.random() < dt * 0.02) g.achieve('via_lactea', 'La Vía Láctea');
}

// ===== el río de murciélagos =====
function murcielago() {
  const g = new THREE.Group();
  g.add(caja(0.12, 0.1, 0.2, 0x1e1a1a));
  const alas = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.x = s * 0.05;
    const ala = new THREE.Mesh(new THREE.BufferGeometry(), mb(0x2a2222));
    ala.geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.08, s * 0.32, 0.02, 0.02, 0, 0, -0.08, s * 0.32, 0.02, 0.02, s * 0.22, 0, -0.1, 0, 0, -0.08], 3));
    piv.add(ala); g.add(piv); alas.push({ piv, s });
  }
  g.userData = { alas };
  return g;
}
function tickMurcielagos(g, dt) {
  const p = g.player.body.pos;
  let R = g.murcis;
  const atardecer = g.daylight > 0.14 && g.daylight < 0.5 && (g.time || 0) > 0.45 && (g.time || 0) < 0.6; // de noche el día queda en 0.12
  if (!R) {
    if (!atardecer || (g.meta.murciDia || 0) === (g.day || 1) || Math.random() > dt * 0.05) return;
    const bio = g.env && g.env.biome;
    if (!['forest', 'jungle', 'bosque_seco', 'plains', 'nuboso', 'mountains'].includes(bio)) return;
    g.meta.murciDia = g.day || 1;
    // salen de un cerro o un árbol a unos 40 bloques y pasan por encima rumbo a donde se pone el sol… o a donde sea
    const a = Math.random() * Math.PI * 2, ox = p.x + Math.cos(a) * 40, oz = p.z + Math.sin(a) * 40;
    const oy = g.world.gen.column(Math.floor(ox), Math.floor(oz)).h + 4;
    const dir = { x: -Math.cos(a) + (Math.random() - 0.5) * 0.6, z: -Math.sin(a) + (Math.random() - 0.5) * 0.6 }, L = Math.hypot(dir.x, dir.z);
    dir.x /= L; dir.z /= L;
    const grupo = new THREE.Group(); g.scene.add(grupo);
    const B = [];
    for (let i = 0; i < 70; i++) { const m = murcielago(); grupo.add(m); m.visible = false; B.push({ m, ret: i * 0.22 + Math.random() * 0.2, jx: (Math.random() - 0.5) * 3, jy: (Math.random() - 0.5) * 2, jz: (Math.random() - 0.5) * 3, f: 14 + Math.random() * 6, fase: Math.random() * 6 }); }
    g.murcis = R = { ox, oy, oz, dir, B, t: 0, grupo, chillido: 1 };
  }
  R.t += dt;
  const perp = { x: -R.dir.z, z: R.dir.x };
  const camino = (s) => ({ x: R.ox + R.dir.x * s * 9 + perp.x * Math.sin(s * 0.7) * 7, y: R.oy + Math.min(s, 2) * 6 + Math.sin(s * 1.3) * 1.5, z: R.oz + R.dir.z * s * 9 + perp.z * Math.sin(s * 0.7) * 7 });
  let vivos = 0;
  for (const b of R.B) {
    const s = R.t - b.ret;
    if (s < 0 || s > 14) { b.m.visible = false; continue; }
    vivos++;
    b.m.visible = true;
    const c = camino(s), c2 = camino(s + 0.05);
    // cada uno revolotea a su manera alrededor del río
    const w = Math.sin(s * 3 + b.fase);
    b.m.position.set(c.x + b.jx + w * 0.8, c.y + b.jy + Math.sin(s * 5 + b.fase) * 0.5, c.z + b.jz + Math.cos(s * 3.3 + b.fase) * 0.8);
    b.m.rotation.y = Math.atan2(c2.x - c.x, c2.z - c.z);
    b.m.rotation.z = w * 0.4;
    const bate = Math.sin(R.t * b.f + b.fase);
    for (const a of b.m.userData.alas) a.piv.rotation.z = a.s * bate * 0.9;
  }
  R.chillido -= dt;
  if (R.chillido <= 0) {
    R.chillido = 0.8 + Math.random() * 1.5;
    const c = camino(Math.max(0, R.t - 3));
    if (Math.hypot(c.x - p.x, c.z - p.z) < 30) g.audio.play('murcielago', { pos: c, vol: 0.5, pitch: 1.1 + Math.random() * 0.3 });
  }
  if (R.t > 6 && R.t < 8) { const c = camino(R.t - 4); if (Math.hypot(c.x - p.x, c.z - p.z) < 35) { if (!g.meta.murciAviso) { g.meta.murciAviso = true; g.ui.toast('🦇 Al atardecer sale un río de murciélagos', 2600); } g.achieve('rio_murcielagos', 'El río de murciélagos'); } }
  if (R.t > 2 && !vivos) { g.scene.remove(R.grupo); g.murcis = null; }
}

// ===== la lechuza =====
function lechuza() {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  const ante = 0xd8b880, blanco = 0xf6f0e6;
  body.add(caja(0.3, 0.42, 0.26, ante, 0, 0.28, 0));
  body.add(caja(0.26, 0.34, 0.04, blanco, 0, 0.24, 0.13)); // pecho
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.58, 0); body.add(cabeza);
  cabeza.add(caja(0.3, 0.26, 0.24, ante));
  cabeza.add(caja(0.28, 0.24, 0.03, blanco, 0, -0.01, 0.125)); // la cara de corazón
  for (const s of [-1, 1]) cabeza.add(caja(0.05, 0.05, 0.02, 0x141010, s * 0.065, 0.01, 0.142));
  cabeza.add(caja(0.03, 0.06, 0.03, 0xc8a080, 0, -0.06, 0.15));
  const alas = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(s * 0.15, 0.42, 0);
    const ala = caja(0.6, 0.03, 0.3, 0xc8a870, s * 0.3, 0, 0); piv.add(ala);
    ala.add(caja(0.2, 0.031, 0.3, 0xe8dcc0, s * 0.2, 0, 0));
    body.add(piv); alas.push({ piv, s });
  }
  // solo sale de noche: los colores ya vienen en penumbra (si no, brillaría como un bombillo)
  g.traverse((o) => { if (o.material) o.material.color.multiplyScalar(0.55); });
  g.userData = { body, cabeza, alas };
  return g;
}
// un buen posadero: un bloque sólido con aire encima que esté al menos 2 por encima del suelo de alrededor
function posadero(g, cx, cz, cy) {
  const w = g.world;
  for (let k = 0; k < 40; k++) {
    const x = Math.floor(cx + (Math.random() - 0.5) * 36), z = Math.floor(cz + (Math.random() - 0.5) * 36);
    if (!w.isLoaded(x, z)) continue;
    for (let y = Math.floor(cy) + 14; y > cy - 8; y--) {
      const id = w.getBlock(x, y, z);
      if (id === AIR || !SOLID[id]) continue;
      if (w.getBlock(x, y + 1, z) !== AIR || w.getBlock(x, y + 2, z) !== AIR) break;
      const h = w.gen.column(x, z).h;
      if (y - h >= 2 && !BLOCKS[id].leafy) return { x: x + 0.5, y: y + 1, z: z + 0.5 };
      if (y - h >= 4) return { x: x + 0.5, y: y + 1, z: z + 0.5 };
      break;
    }
  }
  return null;
}
function tickLechuza(g, dt) {
  const p = g.player.body.pos;
  let O = g.lechuza;
  const noche = g.daylight < 0.22;
  if (O && (Math.hypot(O.m.position.x - p.x, O.m.position.z - p.z) > 80 || (!noche && O.est === 'posada'))) { if (O.est === 'posada') { O.est = 'vuela'; O.t = 0; O.dir = Math.random() * 6.28; } }
  if (!O) {
    if (!noche || Math.random() > dt * 0.03) return;
    const q = posadero(g, p.x, p.z, p.y);
    if (!q || Math.hypot(q.x - p.x, q.z - p.z) < 7) return;
    const m = lechuza(); m.position.set(q.x, q.y, q.z); m.rotation.y = Math.random() * 6.28; g.scene.add(m);
    g.lechuza = O = { m, est: 'posada', t: 0, chillido: 2 + Math.random() * 4, mira: 0, miraObj: 0, miraT: 1, dir: 0, alas: 0 };
  }
  O.t += dt;
  const u = O.m.userData, o = O.m.position;
  const d = Math.hypot(o.x - p.x, o.y - p.y, o.z - p.z);
  if (O.est === 'posada') {
    // gira la cabeza (¡casi media vuelta!) a ratos, y chilla
    O.miraT -= dt;
    if (O.miraT <= 0) { O.miraT = 1 + Math.random() * 3; O.miraObj = d < 20 ? Math.atan2(p.x - o.x, p.z - o.z) - O.m.rotation.y : (Math.random() - 0.5) * 4.4; }
    let dif = Math.atan2(Math.sin(O.miraObj), Math.cos(O.miraObj)); dif = Math.max(-2.3, Math.min(2.3, dif));
    O.mira += (dif - O.mira) * Math.min(1, dt * 6);
    u.cabeza.rotation.y = O.mira;
    u.cabeza.rotation.z = Math.sin(O.t * 0.7) * 0.08;
    u.body.position.y = Math.sin(O.t * 1.2) * 0.01;
    for (const a of u.alas) a.piv.rotation.z = a.s * -1.35; // plegadas
    O.chillido -= dt;
    if (O.chillido <= 0) {
      O.chillido = 6 + Math.random() * 10;
      if (d < 40) g.audio.play('lechuza', { pos: { x: o.x, y: o.y + 0.5, z: o.z }, vol: 0.9 });
      u.cabeza.rotation.x = -0.25;
      if (d < 25) {
        if (!g.meta.lechuzaAviso) { g.meta.lechuzaAviso = true; g.ui.toast('🦉 Chilla una lechuza… dicen los abuelos que es de mal agüero', 3000); }
        g.achieve('lechuza', 'Cantó la lechuza');
      }
    }
    if (d < 6) { O.est = 'vuela'; O.t = 0; O.dir = Math.atan2(o.x - p.x, o.z - p.z) + (Math.random() - 0.5); }
  } else {
    // vuela sin ruido: aletazos hondos y lentos y planeos largos
    const k = Math.min(1, O.t / 1.5);
    O.dir += Math.sin(O.t * 0.6) * dt * 0.4;
    o.x += Math.sin(O.dir) * 6 * k * dt; o.z += Math.cos(O.dir) * 6 * k * dt; o.y += (O.t < 2 ? 2.2 : 0.3) * dt;
    let r = O.dir - O.m.rotation.y; r = Math.atan2(Math.sin(r), Math.cos(r));
    O.m.rotation.y += r * Math.min(1, dt * 4);
    const bate = (O.t % 2.4) < 1.2 ? Math.sin((O.t % 2.4) / 1.2 * Math.PI * 3) : 0.1;
    O.alas += (bate - O.alas) * Math.min(1, dt * 10);
    for (const a of u.alas) a.piv.rotation.z = a.s * O.alas * 0.8;
    u.body.rotation.x = 0.9 * k; // horizontal al volar
    u.cabeza.rotation.y *= 0.9; u.cabeza.rotation.x = -0.8 * k;
    if (O.t > 12) { g.scene.remove(O.m); g.lechuza = null; }
  }
}

export function tickNoches(g, dt) {
  tickVia(g, dt);
  if (g.dim !== 'tierra') { limpiarNoches(g); return; }
  tickMurcielagos(g, dt);
  tickLechuza(g, dt);
}
export function limpiarNoches(g) {
  if (g.murcis) { g.scene.remove(g.murcis.grupo); g.murcis = null; }
  if (g.lechuza) { g.scene.remove(g.lechuza.m); g.lechuza = null; }
}
