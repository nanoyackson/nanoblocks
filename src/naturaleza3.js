// Más naturaleza: las zompopas (filas de hormigas cargando pedacitos de hoja por el suelo del monte, de ida con su
// hojita y de vuelta sin nada) y el viento papagayo de Guanacaste (en verano, ráfagas que empujan, levantan polvo y
// hojas y hacen silbar el viento).
import * as THREE from 'three';
import { SOLID, AIR } from './blocks.js';
import { regionAt } from './regiones.js';

const POR_FILA = 40;

function sueloEn(w, x, z, y0) {
  let y = Math.floor(y0) + 8;
  for (let k = 0; k < 18 && y > 1; k++, y--) if (SOLID[w.getBlock(Math.floor(x), y - 1, Math.floor(z))] && w.getBlock(Math.floor(x), y, Math.floor(z)) === AIR) return y;
  return null;
}
function hacerFila(g) {
  const p = g.player.body.pos, w = g.world;
  const a = Math.random() * Math.PI * 2, d = 3 + Math.random() * 5;
  const x0 = p.x + Math.cos(a) * d, z0 = p.z + Math.sin(a) * d;
  // un caminito que serpentea unos 14 bloques
  const pts = [];
  let dir = Math.random() * Math.PI * 2, x = x0, z = z0;
  for (let i = 0; i < 15; i++) {
    const y = sueloEn(w, x, z, pts.length ? pts[pts.length - 1].y : p.y);
    // el caminito no sube paredes: si hay un brinco grande, ahí termina
    if (y == null || (pts.length && Math.abs(y - pts[pts.length - 1].y) > 1.1)) break;
    pts.push(new THREE.Vector3(x, y + 0.02, z));
    dir += (Math.random() - 0.5) * 0.8;
    x += Math.cos(dir); z += Math.sin(dir);
  }
  if (pts.length < 6) return null;
  const curva = new THREE.CatmullRomCurve3(pts);
  const largo = curva.getLength();
  const cuerpo = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.04, 0.12), new THREE.MeshBasicMaterial({ color: 0x5a2a14 }), POR_FILA);
  const hoja = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.01, 0.1), new THREE.MeshBasicMaterial({ color: 0x5ab83a }), POR_FILA);
  cuerpo.frustumCulled = false; hoja.frustumCulled = false;
  g.scene.add(cuerpo, hoja);
  const hormigas = [];
  for (let i = 0; i < POR_FILA; i++) hormigas.push({ u: Math.random(), ida: i % 2 === 0, vel: 0.9 + Math.random() * 0.3 });
  return { curva, largo, cuerpo, hoja, hormigas, x0, z0, vida: 90 + Math.random() * 60 };
}
const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), tg = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), esc = new THREE.Vector3(1, 1, 1);

export function tickNaturaleza3(g, dt) {
  if (g.dim !== 'tierra') { limpiarNaturaleza3(g); return; }
  const p = g.player.body.pos, bio = g.env && g.env.biome;
  // ---- zompopas ----
  const Z = (g.zompopas ||= []);
  const quiere = g.daylight > 0.45 && ['forest', 'jungle', 'bosque_seco', 'nuboso'].includes(bio) ? 2 : 0;
  g.zompT = (g.zompT || 0) - dt;
  if (Z.length < quiere && g.zompT <= 0) { g.zompT = 3; const f = hacerFila(g); if (f) Z.push(f); }
  for (let i = Z.length - 1; i >= 0; i--) {
    const F = Z[i];
    F.vida -= dt;
    const d = Math.hypot(F.x0 - p.x, F.z0 - p.z);
    if (d > 40 || F.vida < 0 || !quiere) { g.scene.remove(F.cuerpo, F.hoja); F.cuerpo.geometry.dispose(); F.hoja.geometry.dispose(); Z.splice(i, 1); continue; }
    F.hormigas.forEach((h, j) => {
      h.u += ((h.ida ? 1 : -1) * h.vel * dt) / F.largo;
      if (h.u > 1) { h.u = 1; h.ida = false; } else if (h.u < 0) { h.u = 0; h.ida = true; }
      F.curva.getPointAt(h.u, v);
      F.curva.getTangentAt(h.u, tg);
      if (!h.ida) tg.negate();
      // el meneíto de la hormiga al caminar
      const ang = Math.atan2(tg.x, tg.z) + Math.sin((g.clock || 0) * 20 + j) * 0.25;
      q.setFromAxisAngle(up, ang);
      m4.compose(v, q, esc);
      F.cuerpo.setMatrixAt(j, m4);
      // la hojita va encima solo de ida, un poquito inclinada
      v.y += h.ida ? 0.07 : -5;
      m4.compose(v, q, esc);
      F.hoja.setMatrixAt(j, m4);
    });
    F.cuerpo.instanceMatrix.needsUpdate = true; F.hoja.instanceMatrix.needsUpdate = true;
    if (d < 4) g.achieve('zompopas', 'Las zompopas trabajando');
  }
  // ---- viento papagayo (Guanacaste, verano, de día) ----
  const papagayo = g.season === 'verano' && g.daylight > 0.45 && regionAt(g.world.gen, p.x, p.z) === 'guanacaste';
  g.papT = (g.papT ?? 6) - dt;
  if (papagayo && g.papT <= 0 && !g.rafaga) {
    g.papT = 8 + Math.random() * 10;
    const a = ((g.day || 1) * 0.7) % (Math.PI * 2) + (Math.random() - 0.5) * 0.6;
    g.rafaga = { t: 0, dur: 2.5 + Math.random() * 2, dx: Math.cos(a), dz: Math.sin(a) };
    if (!g.meta.papagayoAviso) { g.meta.papagayoAviso = true; g.ui.toast('🌬 ¡Viento papagayo! En el verano de Guanacaste las ráfagas lo empujan a uno', 3200); g.achieve('papagayo', 'Viento papagayo'); }
  }
  const R = g.rafaga;
  if (R) {
    R.t += dt;
    const k = Math.sin(Math.min(1, R.t / R.dur) * Math.PI); // sube y baja suave
    const b = g.player.body;
    // bajo techo y con pared del lado del viento, la ráfaga no entra (se mide cada medio segundo)
    R.cd = (R.cd || 0) - dt;
    if (R.cd <= 0) { R.cd = 0.5; R.adentro = resguardado(g, R); }
    if (!g.riding && g.mode === 'survival' && !g.foto && !R.adentro) {
      // empuja de verdad (el frenado del suelo anulaba la velocidad): se corre de a poquito si no hay pared
      // v12.1.3: por la física (moveStep prueba la caja entera y empuja hacia afuera): antes se escribía la posición con una prueba de
      // un solo punto, la caja quedaba unos centímetros dentro de la pared y la caída lo subía por ella hasta 100 bloques
      const w = g.world, emp = Math.min(2.2 * k * dt, 0.08);
      b.moveStep(w, 'x', R.dx * emp, b.onGround);
      b.moveStep(w, 'z', R.dz * emp, b.onGround);
    }
    if (g.papalote) g.papalote.alt += k * dt * 4;
    for (let n = 0; n < 4 && !R.adentro; n++) {
      if (Math.random() > k) continue;
      const ox = p.x - R.dx * 12 + (Math.random() - 0.5) * 16, oz = p.z - R.dz * 12 + (Math.random() - 0.5) * 16;
      const hoja = Math.random() < 0.3;
      g.particles.spawn(ox, p.y + Math.random() * 3, oz, hoja ? [0.45 + Math.random() * 0.3, 0.6, 0.2] : [0.82, 0.72, 0.52], R.dx * (10 + Math.random() * 6), hoja ? 0.6 : 0.2, R.dz * (10 + Math.random() * 6), 1.6, hoja ? 0.3 : 0);
    }
    g.audio.setEmitter('papagayo', 'loop.wind', { x: p.x - R.dx * 4, y: p.y + 2, z: p.z - R.dz * 4 }, (0.15 + k * 0.55) * (R.adentro ? 0.35 : 1)); // adentro se oye silbar afuera
    if (R.t >= R.dur) { g.rafaga = null; g.audio.setEmitter('papagayo', 'loop.wind', null); }
  }
}
// ¿está uno resguardado del viento? Techo encima (aunque tenga algún hueco) y pared del lado de donde viene la ráfaga
function resguardado(g, R) {
  const w = g.world, p = g.player.body.pos, x0 = Math.floor(p.x), y0 = Math.floor(p.y), z0 = Math.floor(p.z);
  let techo = 0;
  for (const [ox, oz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) for (let y = y0 + 2; y < y0 + 10; y++) if (SOLID[w.getBlock(x0 + ox, y, z0 + oz)]) { techo++; break; }
  if (techo < 3) return false;
  for (const l of [-1, 0, 1]) {
    let tapa = false;
    for (let d = 1; d <= 8 && !tapa; d++) {
      const x = Math.floor(p.x - R.dx * d - R.dz * l), z = Math.floor(p.z - R.dz * d + R.dx * l);
      if (SOLID[w.getBlock(x, y0, z)] || SOLID[w.getBlock(x, y0 + 1, z)]) tapa = true;
    }
    if (!tapa) return false;
  }
  return true;
}
// ---- pericos: bandadas que cruzan el cielo al amanecer y al atardecer, chillando ----
function perico() {
  const g = new THREE.Group();
  const verde = new THREE.MeshBasicMaterial({ color: 0x3ac84a });
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.34), verde));
  const cabeza = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.12), new THREE.MeshBasicMaterial({ color: 0x5ae05a })); cabeza.position.set(0, 0.04, 0.2); g.add(cabeza);
  const pico = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.06), new THREE.MeshBasicMaterial({ color: 0xe8b060 })); pico.position.set(0, 0.02, 0.28); g.add(pico);
  const cola = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.3), verde); cola.position.set(0, 0, -0.3); g.add(cola);
  const alas = [];
  for (const s of [-1, 1]) { const piv = new THREE.Group(); piv.position.x = s * 0.08; const ala = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.02, 0.18), new THREE.MeshBasicMaterial({ color: 0x2aa83a })); ala.position.x = s * 0.17; piv.add(ala); g.add(piv); alas.push({ piv, s }); }
  g.userData.alas = alas;
  return g;
}
export function tickPericos(g, dt) {
  if (g.dim !== 'tierra') return;
  const p = g.player.body.pos, t = g.time || 0;
  const hora = (t > 0.42 && t < 0.5) || t < 0.07 || t > 0.98;
  const bio = g.env && g.env.biome;
  const B = (g.pericos ||= []);
  g.pericoT = (g.pericoT ?? 8) - dt;
  if (hora && g.pericoT <= 0 && !B.length && !['desert', 'snowy', 'ocean'].includes(bio)) {
    g.pericoT = 25 + Math.random() * 30;
    const a = Math.random() * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a);
    const n = 12 + Math.floor(Math.random() * 9), alto = p.y + 22 + Math.random() * 12;
    for (let i = 0; i < n; i++) {
      const m = perico();
      const off = (Math.random() - 0.5) * 14, atras = Math.random() * 10;
      m.position.set(p.x - dx * (90 + atras) - dz * off, alto + (Math.random() - 0.5) * 5, p.z - dz * (90 + atras) + dx * off);
      m.rotation.y = Math.atan2(dx, dz);
      g.scene.add(m);
      B.push({ m, dx, dz, vel: 11 + Math.random() * 2, t: Math.random() * 6, y0: m.position.y });
    }
    if (!g.meta.pericosAviso) { g.meta.pericosAviso = true; g.ui.toast('🦜 ¡Una bandada de pericos cruza el cielo chillando!', 2600); }
    g.achieve('pericos', 'Bandada de pericos');
  }
  if (!B.length) return;
  for (let i = B.length - 1; i >= 0; i--) {
    const b = B[i];
    b.t += dt;
    b.m.position.x += b.dx * b.vel * dt; b.m.position.z += b.dz * b.vel * dt;
    b.m.position.y = b.y0 + Math.sin(b.t * 1.7) * 0.8;
    // aleteo rápido de perico, con ratitos de planeo
    const aleteo = Math.sin(b.t * 2) > -0.6 ? Math.sin(b.t * 26) * 0.6 : 0.1;
    for (const w of b.m.userData.alas) w.piv.rotation.z = w.s * aleteo;
    b.m.rotation.z = Math.sin(b.t * 1.3) * 0.15;
    if (Math.hypot(b.m.position.x - p.x, b.m.position.z - p.z) > 130 && b.t > 4) { g.scene.remove(b.m); B.splice(i, 1); }
  }
  // los chillidos (desde el centro de la bandada)
  g.pericoChillo = (g.pericoChillo || 0) - dt;
  if (g.pericoChillo <= 0 && B.length) {
    g.pericoChillo = 0.25 + Math.random() * 0.5;
    const c = B[Math.floor(Math.random() * B.length)].m.position;
    if (Math.hypot(c.x - p.x, c.z - p.z) < 70) g.audio.play('lapa', { pos: { x: c.x, y: c.y, z: c.z }, vol: 0.6, pitch: 1.6 + Math.random() * 0.4 });
  }
}
// ---- rocío: en las mañanas, el zacate brilla ----
export function tickRocio(g, dt) {
  if (g.dim !== 'tierra') return;
  const t = g.time || 0;
  if (!(t > 0.01 && t < 0.13) || (g.weather && g.weather.intensity > 0.5)) return;
  const bio = g.env && g.env.biome;
  if (!['plains', 'forest', 'nuboso', 'jungle', 'bosque_seco'].includes(bio)) return;
  const p = g.player.body.pos, w = g.world;
  g.rocioT = (g.rocioT || 0) - dt;
  if (g.rocioT > 0) return;
  g.rocioT = 0.04;
  for (let k = 0; k < 2; k++) {
    const x = Math.floor(p.x + (Math.random() - 0.5) * 14), z = Math.floor(p.z + (Math.random() - 0.5) * 14);
    const y = sueloEn(w, x, z, p.y);
    if (y == null) continue;
    const top = w.getBlock(x, y - 1, z);
    if (top !== 1 && w.getBlock(x, y, z) === AIR) continue; // solo sobre zacate (o en el zacate alto)
    g.particles.spawn(x + Math.random(), y + 0.05 + Math.random() * 0.2, z + Math.random(), Math.random() < 0.5 ? [0.95, 1, 1] : [0.75, 0.9, 1], 0, 0.05, 0, 0.5 + Math.random() * 0.6, 0, true);
  }
  g.achieve('rocio', 'Gotitas de rocío');
}
export function limpiarNaturaleza3(g) {
  for (const b of g.pericos || []) g.scene.remove(b.m);
  g.pericos = [];
  for (const F of g.zompopas || []) { g.scene.remove(F.cuerpo, F.hoja); }
  g.zompopas = [];
  if (g.rafaga) { g.rafaga = null; g.audio.setEmitter('papagayo', 'loop.wind', null); }
}
