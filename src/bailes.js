// El punto guanacasteco: en los días de fiesta (y todas las tardes en los pueblos de Guanacaste) salen parejas a bailar
// a la plaza con su traje típico. Ella con la falda ancha de colores que gira y se abre al dar la vuelta; él con sombrero
// y pañuelo rojo, zapateando. Las parejas dan vueltas una alrededor de la otra y suena la marimba (grabación real).
import * as THREE from 'three';
import { fiestaHoy } from './fiestas2.js';
import { regionAt } from './regiones.js';

const COLS_FALDA = ['#e83a3a', '#f0c020', '#2a6ad8', '#2aa84a', '#ffffff', '#e85ad8'];
function texFalda(semilla) {
  const cv = document.createElement('canvas'); cv.width = 32; cv.height = 16;
  const c = cv.getContext('2d');
  const base = COLS_FALDA[semilla % COLS_FALDA.length];
  c.fillStyle = base; c.fillRect(0, 0, 32, 16);
  for (let i = 0; i < 4; i++) { c.fillStyle = COLS_FALDA[(semilla + i + 1) % COLS_FALDA.length]; c.fillRect(0, 3 + i * 3, 32, 1); }
  for (let x = 1; x < 32; x += 6) { c.fillStyle = '#ffffff'; c.fillRect(x, 13, 2, 2); }
  const t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.wrapS = THREE.RepeatWrapping;
  return t;
}
function ponerTraje(m, ella, i) {
  const u = m.group.userData;
  if (u.traje || !u.body) return;
  const torso = u.body.children[0];
  const p = torso && torso.geometry && torso.geometry.parameters;
  if (!p) return;
  if (ella) {
    // la falda: un cono abierto que gira (y se abre más al girar rápido)
    const falda = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.55, 0.75, 16, 1, true), new THREE.MeshBasicMaterial({ map: texFalda(i * 2 + 1), side: THREE.DoubleSide }));
    falda.position.set(0, torso.position.y - p.height * 0.5 - 0.3, 0);
    u.body.add(falda);
    u.falda = falda;
    const blusa = new THREE.Mesh(new THREE.BoxGeometry(p.width * 1.06, p.height * 0.55, p.depth * 1.1), new THREE.MeshBasicMaterial({ color: 0xf8f4ec }));
    blusa.position.copy(torso.position); blusa.position.y += p.height * 0.2;
    u.body.add(blusa);
  } else {
    const panuelo = new THREE.Mesh(new THREE.BoxGeometry(p.width * 0.6, 0.12, p.depth * 1.12), new THREE.MeshBasicMaterial({ color: 0xd82a2a }));
    panuelo.position.copy(torso.position); panuelo.position.y += p.height * 0.42;
    const faja = new THREE.Mesh(new THREE.BoxGeometry(p.width * 1.08, 0.1, p.depth * 1.1), new THREE.MeshBasicMaterial({ color: 0xd82a2a }));
    faja.position.copy(torso.position); faja.position.y -= p.height * 0.4;
    u.body.add(panuelo, faja);
  }
  u.traje = true;
}

export function tickBailes(g, dt) {
  if (g.dim !== 'tierra') { if (g.marimbaOn) { g.audio.setEmitter('marimba', 'loop.marimba', null); g.marimbaOn = false; } return; }
  const p = g.player.body.pos;
  g.baileT = (g.baileT || 0) - dt;
  const bailando = g.entities.mobs.filter((m) => m.data && m.data.baileP && !m.dead);
  if (g.baileT <= 0) {
    g.baileT = 1;
    const v = g.nearestVillage(p.x, p.z);
    const t = g.time || 0;
    const fiesta = !!fiestaHoy(g);
    const guana = v && regionAt(g.world.gen, v.v.x, v.v.z) === 'guanacaste' && t > 0.25 && t < 0.45;
    const toca = v && v.dist < 60 && g.daylight > 0.4 && (fiesta || guana);
    if (!toca) {
      for (const m of bailando) { m.data.baileP = null; m.data.irse = 4; }
      if (g.marimbaOn) { g.audio.setEmitter('marimba', 'loop.marimba', null); g.marimbaOn = false; }
      return;
    }
    const c = v.v, cy = c.y || p.y;
    // tres parejas en la plaza
    const parejas = new Set(bailando.map((m) => m.data.baileP.par));
    for (let i = 0; i < 3; i++) {
      if (parejas.has(i)) continue;
      // un lugar libre y parejo, a la altura de la plaza (no encima de una casa)
      const w = g.world;
      const libre = (x, z) => { for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = Math.floor(x + dx), Z = Math.floor(z + dz); for (let h = 1; h <= 2; h++) if (w.getBlock(X, Math.floor(cy) + h, Z)) return false; if (!w.getBlock(X, Math.floor(cy), Z)) return false; } return true; };
      let cx = null, cz = null;
      for (let t = 0; t < 48 && cx === null; t++) {
        const a = (i / 3) * Math.PI * 2 + t * 0.7, r = 2 + (t % 9);
        const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
        if (libre(x, z) && !bailando.some((o) => Math.hypot(o.data.baileP.cx - x, o.data.baileP.cz - z) < 3)) { cx = x; cz = z; }
      }
      if (cx === null) continue;
      for (const ella of [true, false]) {
        const m = g.entities.spawnMob('vecino', cx + (ella ? 0.8 : -0.8), cy + 1, cz);
        const here = { x: Math.floor(cx), y: Math.floor(cy), z: Math.floor(cz) };
        Object.assign(m.data, { home: here, plaza: { ...here }, name: ella ? 'Bailarina de punto guanacasteco' : 'Bailarín de punto guanacasteco', role: 'vecino', vid: `baile:${i}:${ella}:${Math.random()}`, seed: 700 + i * 11 + (ella ? 5 : 0), baileP: { par: i, ella, cx, cz, y0: Math.floor(cy) + 1, a: ella ? 0 : Math.PI, fase: Math.random() * 6 } });
        if (m.kind.dress) m.kind.dress(m);
      }
    }
    if (v.dist < 45) { g.audio.setEmitter('marimba', 'loop.marimba', { x: c.x, y: cy + 2, z: c.z }, 0.6); g.marimbaOn = true; g.achieve('punto_guanacasteco', '¡Bomba!'); }
  }
  // el baile, cuadro a cuadro
  for (const m of bailando) {
    const B = m.data.baileP, u = m.group.userData;
    if (!B) continue; // su pareja ya se fue (se retiró en este mismo cuadro)
    if (u.pending) { if (m.kind.dress) m.kind.dress(m); continue; }
    ponerTraje(m, B.ella, B.par);
    B.fase += dt;
    // si quedó encima de algo (una banca, un kiosco), la pareja se va y sale en otro lado
    if (B.fase > 1 && m.body.onGround && m.body.pos.y > B.y0 + 1.2) { for (const o of bailando) if (o.data.baileP && o.data.baileP.par === B.par) { o.data.baileP = null; o.data.irse = 1; } continue; }
    // la pareja da vueltas una alrededor de la otra, despacito, y a ratos se acerca
    B.a += dt * 0.9;
    const r = 0.9 + Math.sin(B.fase * 0.8) * 0.35;
    m.body.pos.x = B.cx + Math.cos(B.a) * r; m.body.pos.z = B.cz + Math.sin(B.a) * r;
    m.body.vel.x = m.body.vel.z = 0;
    m.yaw = Math.atan2(B.cx - m.body.pos.x, B.cz - m.body.pos.z);
    m.group.rotation.y = m.yaw;
    // zapateado: brinquitos al ritmo
    const pulso = Math.abs(Math.sin(B.fase * 7));
    if (u.body) u.body.position.y = pulso * 0.06;
    if (u.npcArms) {
      if (B.ella) { u.npcArms[0].rotation.x = -0.5; u.npcArms[0].rotation.z = 0.9 + Math.sin(B.fase * 3.5) * 0.2; u.npcArms[1].rotation.x = -0.5; u.npcArms[1].rotation.z = -0.9 - Math.sin(B.fase * 3.5) * 0.2; }
      else { u.npcArms[0].rotation.x = -2.6; u.npcArms[0].rotation.z = 0.2; u.npcArms[1].rotation.x = 0.3; u.npcArms[1].rotation.z = -0.5; }
    }
    if (u.falda) {
      // la falda gira y se abre con la vuelta
      u.falda.rotation.y += dt * (3 + Math.sin(B.fase * 1.5) * 2);
      const abre = 1 + Math.max(0, Math.sin(B.fase * 1.5)) * 0.35;
      u.falda.scale.set(abre, 1 - (abre - 1) * 0.3, abre);
    }
  }
}
