// La carrera de carretas: los días de fiesta, de día, a la orilla del pueblo arman una pista derecha con su arco de salida y su
// meta. Hay tres carretas con bueyes: la del medio es para uno. Se monta (clic derecho), el juez cuenta «¡Tres, dos, uno… arre!»
// y a correr: W para que los bueyes aprieten el paso. El que llega primero a la meta se lleva el premio. Una vez por día de fiesta.
// Estado: g.carrera (no se guarda), meta.carreraDia.
import * as THREE from 'three';
import { SOLID, FLUID } from './blocks.js';
import { fiestaHoy } from './fiestas2.js';
import { disposeModel } from './models.js';

const LARGO = 45, COLON = 360, RIVALES = ['Don Chepe', 'Doña Lupita'];
const deDia = (g) => { const t = g.time || 0; return t > 0.05 && t < 0.38; };
function altura(g, x, z) { let y = 120; while (y > 1 && !SOLID[g.world.getBlock(Math.floor(x), y - 1, Math.floor(z))] && !FLUID[g.world.getBlock(Math.floor(x), y - 1, Math.floor(z))]) y--; return y; }
// una pista pareja: sin agua y sin escalones de más de un bloque
function pista(g, v) {
  for (let k = 0; k < 48; k++) {
    const a = (k / 24) * Math.PI * 2, r = Math.min((v.R || 40), 45) * (k < 24 ? 0.8 : 0.5), x0 = v.x + Math.cos(a) * r, z0 = v.z + Math.sin(a) * r, dx = Math.cos(a), dz = Math.sin(a);
    let ok = true, prev = null;
    for (let i = -2; i <= LARGO + 3 && ok; i += 1) for (const l of [-3, 0, 3]) {
      const x = x0 + dx * i - dz * l, z = z0 + dz * i + dx * l;
      if (!g.world.isLoaded(x, z)) { ok = false; break; }
      const y = altura(g, x, z);
      if (FLUID[g.world.getBlock(Math.floor(x), y - 1, Math.floor(z))] || (l === 0 && prev != null && Math.abs(y - prev) > 1)) { ok = false; break; }
      if (l === 0) prev = y;
    }
    if (ok) return { x0, z0, dx, dz, y0: altura(g, x0, z0) };
  }
  return null;
}
function arco(g, x, y, z, ry, color) {
  const grupo = new THREE.Group(), mb = (c) => new THREE.MeshBasicMaterial({ color: c });
  const c = (w, h, d, col, px, py, pz) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mb(col)); m.position.set(px, py, pz); grupo.add(m); };
  c(0.25, 4, 0.25, 0x6a4a28, -5, 2, 0); c(0.25, 4, 0.25, 0x6a4a28, 5, 2, 0);
  c(10.4, 0.9, 0.12, color, 0, 3.8, 0);
  for (let i = 0; i < 10; i++) c(0.5, 0.35, 0.05, i % 2 ? 0x1a1a1a : 0xf4f4f4, -4.5 + i, 3.15, 0.06); // cuadros de bandera
  grupo.position.set(x, y, z); grupo.rotation.y = ry;
  g.scene.add(grupo);
  return grupo;
}
export function quitarCarrera(g) {
  const C = g.carrera;
  if (!C) return;
  for (const a of C.arcos) { g.scene.remove(a); disposeModel(a); }
  for (const c of C.carretas) if (c && !c.dead && g.riding !== c) c.dead = true;
  g.carrera = null;
}
function armar(g, P) {
  const ry = Math.atan2(P.dx, P.dz), arcos = [arco(g, P.x0, P.y0, P.z0, ry + Math.PI / 2, 0x2a6ad8), arco(g, P.x0 + P.dx * LARGO, altura(g, P.x0 + P.dx * LARGO, P.z0 + P.dz * LARGO), P.z0 + P.dz * LARGO, ry + Math.PI / 2, 0xd02020)];
  const carretas = [-3, 0, 3].map((l, i) => {
    const x = P.x0 - P.dx * 1.5 - P.dz * l, z = P.z0 - P.dz * 1.5 + P.dx * l;
    const m = g.entities.spawnMob('carreta', x, altura(g, x, z) + 0.05, z);
    if (!m) return null;
    m.yaw = Math.atan2(P.dx, P.dz);
    if (i !== 1) { m.data.animo = { tipo: 'carrera' }; m.data.rival = RIVALES[i ? 1 : 0]; m.data.ganas = 2.95 + Math.random() * 0.4; }
    return m;
  });
  g.carrera = { ...P, arcos, carretas, fase: 'espera', t: 0, mia: carretas[1], ganador: null };
}
// cada segundo: arma la pista en los días de fiesta
export function tickCarrera(g) {
  const C = g.carrera, p = g.player.body.pos;
  const hoy = g.dim === 'tierra' && !!fiestaHoy(g) && deDia(g);
  if (C) { if ((!hoy && !C.prueba && C.fase !== 'corre') || Math.hypot(p.x - C.x0, p.z - C.z0) > 120) quitarCarrera(g); return; }
  if (!hoy || g.meta.carreraDia === (g.day || 1) || g.carreraNo === (g.day || 1)) return;
  const v = g.nearestVillage && g.nearestVillage(p.x, p.z);
  if (!v || v.dist > 70) return;
  const P = pista(g, v.v);
  if (!P) { g.carreraNo = g.day || 1; return; }
  armar(g, P);
  if (g.mode === 'survival') g.ui.toast('🐂 Carrera de carretas en el pueblo: la del medio es suya (clic derecho)', 4600);
}
// cada cuadro: la cuenta, los rivales y la meta
export function cuadroCarrera(g, dt) {
  const C = g.carrera;
  if (!C) return;
  const mia = C.mia;
  if (!mia || mia.dead) { quitarCarrera(g); return; }
  const avance = (m) => (m.body.pos.x - C.x0) * C.dx + (m.body.pos.z - C.z0) * C.dz;
  if (C.fase === 'espera') {
    if (g.riding === mia) { C.fase = 'cuenta'; C.t = 3.5; C.dijo = 4; g.ui.toast('🏁 El juez levanta la bandera… ¡quietos todos!', 2000); }
    return;
  }
  if (C.fase === 'cuenta') {
    C.t -= dt;
    const n = Math.ceil(C.t);
    if (n < C.dijo && n >= 1 && n <= 3) { C.dijo = n; g.ui.toast(`🏁 ¡${['', 'Uno', 'Dos', 'Tres'][n]}…!`, 800); g.audio.play('campana', { ui: true, vol: 0.4, pitch: 1.4 }); }
    if (avance(mia) > 0.5) { g.ui.toast('🏁 ¡Salida en falso! Vuelva atrás del arco y espere la cuenta', 2600); mia.body.pos.x = C.x0 - C.dx * 1.5; mia.body.pos.z = C.z0 - C.dz * 1.5; if (mia.data) mia.data.v = 0; C.t = 3.5; C.dijo = 4; }
    if (C.t <= 0) { C.fase = 'corre'; C.t = 0; g.ui.toast('🏁 ¡ARRE! ¡Apriete W para que los bueyes corran!', 1800); g.audio.play('silbato', { ui: true, vol: 0.8 }); }
    return;
  }
  if (C.fase === 'corre') {
    C.t += dt;
    for (const m of C.carretas) {
      if (!m || m === mia || m.dead) continue;
      // los rivales: van a su ritmo, con arranques y cansancio
      const d = m.data;
      d.v = Math.min(3.45, Math.max(1.6, (d.v || 0) + ((d.ganas + Math.sin(C.t * 0.7 + (d.ganas * 10)) * 0.35) - (d.v || 0)) * dt * 1.5));
      m.yaw = Math.atan2(C.dx, C.dz);
      m.body.vel.x = C.dx * d.v; m.body.vel.z = C.dz * d.v;
      m.body.step(g.world, dt);
      if (m.body.hitWall && m.body.onGround) m.body.pos.y += 1.05;
    }
    const llegados = C.carretas.filter((m) => m && !m.dead && avance(m) >= LARGO);
    if (llegados.length && !C.ganador) {
      C.ganador = llegados.includes(mia) ? mia : llegados[0];
      g.meta.carreraDia = g.day || 1;
      if (C.ganador === mia) {
        g.giveItem(COLON, 30);
        g.audio.play('aplausos', { ui: true, vol: 1 });
        g.ui.toast(`🏆 ¡Ganó la carrera de carretas en ${C.t.toFixed(1)} segundos! La gente se tira a la pista: ₡30`, 4600);
        g.achieve('carrera_carretas', 'Gané la carrera de carretas');
      } else {
        g.audio.play('aplausos', { ui: true, vol: 0.5 });
        g.ui.toast(`🐂 Ganó ${C.ganador.data.rival}. «¡Esos bueyes míos comen mejor que yo!»`, 4000);
      }
      C.fase = 'fin'; C.t = 0;
    }
    if (C.t > 90) { C.fase = 'fin'; C.t = 0; }
    return;
  }
  if (C.fase === 'fin') { C.t += dt; if (C.t > 25 && g.riding !== mia) quitarCarrera(g); }
}
export function pruebaCarrera(g) {
  quitarCarrera(g);
  const p = g.player.body.pos, v = g.nearestVillage && g.nearestVillage(p.x, p.z);
  const P = v ? pista(g, v.v) : null;
  if (!P) return 'No hay una pista pareja cerca de un pueblo: pruebe en otro';
  armar(g, P); g.carrera.prueba = true; g.meta.carreraDia = 0;
  return `La pista está a ${Math.round(Math.hypot(P.x0 - p.x, P.z0 - p.z))} bloques: móntese en la carreta del medio`;
}
