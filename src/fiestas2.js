// Calendario de fiestas (ciclo de 12 días de juego): el desfile de faroles (día 4), el día de la mascarada (día 7)
// y las fiestas de fin de año (días 11 y 12): luces de colores en el pueblo, bombetas de noche y tamales en las sodas.
import * as THREE from 'three';
import { flat } from './fauna.js';
import { SOLID } from './blocks.js';
import { regionAt } from './regiones.js';
import { Rocket } from './fiesta.js';

const CICLO = 12;
export function fiestaHoy(g) {
  const d = (((g.day || 1) - 1) % CICLO) + 1;
  if (d === 11 || d === 12) return 'fin_de_ano';
  if (d === 7) return 'mascarada';
  if (d === 4) return 'faroles';
  if (d === 9) return 'carnaval';
  return null;
}
const AVISO = {
  fin_de_ano: '🎄 ¡Fiestas de fin de año! Luces en los pueblos, bombetas de noche y tamales en las sodas',
  mascarada: '🎭 ¡Día de la mascarada! Las cabezonas andan sueltas por los pueblos (póngase una máscara)',
  faroles: '🏮 Hoy en la noche es el desfile de faroles en los pueblos',
  carnaval: '🥁 ¡Hoy hay carnaval en los pueblos del Caribe y tope de caballos en los demás!',
};
export function extraVentas(g, role) {
  if (fiestaHoy(g) === 'fin_de_ano' && ['sodera', 'sodera_playa', 'panadera', 'pulpero'].includes(role)) return [[353, 2, 5]];
  return [];
}

// cabezona de mascarada sobre la cabeza de un vecino
const CARAS = [[0xe8b890, 0x2a1a10, 0xc82a2a], [0xf0d040, 0x1a1a1a, 0x2a2a8a], [0x8a3a2a, 0xf0f0f0, 0xf0d040], [0xf4f0e8, 0x2a2a2a, 0xd03070], [0x3a8a4a, 0xf0e030, 0xc82a2a]];
export function ponerCabezona(m) {
  const u = m.group.userData;
  if (!u.head || u.cabezona) return;
  const [piel, ojo, boca] = CARAS[Math.floor(Math.random() * CARAS.length)];
  const c = flat(piel, 0.95, 0.95, 0.95, 0, 0.2, 0);
  c.add(flat(0xffffff, 0.22, 0.2, 0.02, -0.2, 0.12, 0.48), flat(0xffffff, 0.22, 0.2, 0.02, 0.2, 0.12, 0.48));
  c.add(flat(ojo, 0.1, 0.12, 0.03, -0.2, 0.12, 0.49), flat(ojo, 0.1, 0.12, 0.03, 0.2, 0.12, 0.49));
  c.add(flat(boca, 0.5, 0.12, 0.03, 0, -0.22, 0.49), flat(0xd8a070, 0.16, 0.2, 0.1, 0, -0.02, 0.5));
  c.add(flat(ojo, 1.0, 0.18, 1.0, 0, 0.5, 0));
  u.head.add(c);
  u.cabezona = c;
}
export function quitarCabezona(m) { const u = m.group.userData; if (u.cabezona) { u.head.remove(u.cabezona); u.cabezona = null; } }

// bombillos de colores alrededor de la plaza (fin de año): una sarta de cubitos que parpadean
const COLS = [0xff3030, 0x30ff50, 0x4080ff, 0xffe030, 0xff60e0];
const geoB = new THREE.BoxGeometry(0.32, 0.32, 0.32);
function luces(g, c, prendidas) {
  const L = g.lucesFiesta;
  if (!c) { if (L) { g.scene.remove(L.group); L.group.children.forEach((m) => m.material.dispose()); g.lucesFiesta = null; } return; }
  if (!L || L.x !== c.x || L.z !== c.z) {
    luces(g, null);
    const group = new THREE.Group();
    for (let k = 0; k < 96; k++) {
      const a = (k / 96) * Math.PI * 2;
      const m = new THREE.Mesh(geoB, new THREE.MeshBasicMaterial({ color: COLS[k % 5] }));
      // la sarta cuelga un poquito entre poste y poste
      m.position.set(c.x + 0.5 + Math.cos(a) * 12, c.y + 5.5 - Math.abs(Math.sin(a * 4)) * 0.8, c.z + 0.5 + Math.sin(a) * 9);
      group.add(m);
    }
    g.scene.add(group);
    g.lucesFiesta = { x: c.x, z: c.z, group };
  }
  const t = Math.floor((g.clock || 0) * 2);
  g.lucesFiesta.group.children.forEach((m, k) => { const on = prendidas && (k + t) % 3 !== 0; m.material.color.setHex(on ? COLS[(k + Math.floor(t / 3)) % 5] : 0x202020); });
}

// el portal navideño en la plaza (fin de año): ranchito de madera, la Sagrada Familia, el buey, el burrito y la estrella
const box = (w, h, d, c, x, y, z, glow) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: c })); m.position.set(x, y, z); if (glow) m.userData.glow = true; return m; };
function portal(g, c, poner) {
  const P = g.portalFiesta;
  if (!poner || !c) { if (P) { g.scene.remove(P.group); P.group.traverse((o) => { if (o.material) o.material.dispose(); if (o.geometry) o.geometry.dispose(); }); g.portalFiesta = null; } return; }
  if (P && P.x === c.x && P.z === c.z) { P.estrella.rotation.y += 0.05; return; }
  // un lugar libre junto a la plaza, con el terreno ya cargado
  const w = g.world;
  let x0 = null, y0 = 0, z0 = 0;
  for (const [ox, oz] of [[7, -3], [-7, -3], [7, 3], [-7, 3], [0, 6], [0, -6], [10, 0], [-10, 0]]) {
    const x = c.x + ox, z = c.z + oz;
    if (!w.isLoaded(x, z) || !w.isLoaded(x + 2, z + 2) || !w.isLoaded(x - 2, z - 2)) return;
    let y = (c.y || 70) + 12;
    while (y > (c.y || 70) - 8 && !SOLID[w.getBlock(x, y - 1, z)]) y--;
    if (!SOLID[w.getBlock(x, y - 1, z)]) continue;
    let libre = true;
    for (let dx = -2; dx <= 2 && libre; dx++) for (let dz = -1; dz <= 1 && libre; dz++) for (let dy = 0; dy < 3; dy++) if (SOLID[w.getBlock(x + dx, y + dy, z + dz)]) { libre = false; break; }
    if (libre) { x0 = x; y0 = y; z0 = z; break; }
  }
  if (x0 === null) return;
  portal(g, null, false);
  const gr = new THREE.Group(); gr.position.set(x0 + 0.5, y0, z0 + 0.5);
  // ranchito
  for (const [px, pz] of [[-1.4, -0.9], [1.4, -0.9], [-1.4, 0.9], [1.4, 0.9]]) gr.add(box(0.15, 2, 0.15, 0x6a4626, px, 1, pz));
  gr.add(box(3.4, 0.12, 2.4, 0xc8a050, 0, 2.05, 0), box(3.0, 0.08, 2.0, 0xe0c070, 0, 0.04, 0));
  // la familia
  gr.add(box(0.36, 0.8, 0.3, 0x3a6ac0, -0.6, 0.44, -0.2), box(0.26, 0.26, 0.26, 0xe8c8a0, -0.6, 0.97, -0.2), box(0.3, 0.12, 0.3, 0xf0f0f0, -0.6, 1.13, -0.2));
  gr.add(box(0.38, 0.9, 0.3, 0x8a5a30, 0.6, 0.49, -0.2), box(0.26, 0.26, 0.26, 0xe0c098, 0.6, 1.07, -0.2), box(0.3, 0.1, 0.3, 0x5a3a1a, 0.6, 1.22, -0.2));
  gr.add(box(0.5, 0.18, 0.3, 0xd8b060, 0, 0.12, 0.25), box(0.3, 0.12, 0.2, 0xf8f4ec, 0, 0.26, 0.25));
  // buey y burrito
  gr.add(box(0.7, 0.5, 0.4, 0xd8d0c0, -1.0, 0.3, 0.6), box(0.3, 0.3, 0.3, 0xd8d0c0, -1.45, 0.45, 0.6));
  gr.add(box(0.55, 0.4, 0.3, 0x7a7a80, 1.0, 0.25, 0.6), box(0.25, 0.28, 0.25, 0x7a7a80, 1.36, 0.42, 0.6), box(0.06, 0.2, 0.06, 0x5a5a60, 1.38, 0.64, 0.6));
  // la estrella
  const est = new THREE.Group(); est.position.set(0, 2.7, 0);
  est.add(box(0.5, 0.12, 0.12, 0xffe060, 0, 0, 0, true), box(0.12, 0.5, 0.12, 0xffe060, 0, 0, 0, true), box(0.12, 0.12, 0.5, 0xffe060, 0, 0, 0, true));
  gr.add(est);
  g.scene.add(gr);
  g.portalFiesta = { x: c.x, z: c.z, group: gr, estrella: est };
}

// plumas de carnaval: un penacho de colores en la cabeza y una faldita de flecos
function ponerPlumas(m) {
  const u = m.group.userData;
  if (!u.head || u.plumas) return;
  const P = new THREE.Group();
  const C = [0xe8302a, 0xf0c020, 0x2a9ad8, 0x3ac04a, 0xe84ac8];
  for (let k = 0; k < 7; k++) { const a = (k - 3) * 0.28; const f = flat(C[k % 5], 0.08, 0.6, 0.04, Math.sin(a) * 0.3, 0.55 + Math.cos(a) * 0.15, -0.05); f.rotation.z = -a; P.add(f); }
  P.add(flat(0xf0c020, 0.56, 0.08, 0.56, 0, 0.3, 0));
  u.head.add(P); u.plumas = P;
}
// cada cuadro: los de la comparsa bailan
export function tickBaile(g) {
  for (const m of g.entities.mobs) {
    if (!m.data || !m.data.baila) continue;
    const u = m.group.userData;
    if (u.body) u.body.rotation.z = Math.sin(m.t * 8) * 0.18;
    if (u.npcArms) u.npcArms.forEach((a, i) => { a.rotation.x = -2.4 + Math.sin(m.t * 8 + i * 3) * 0.4; a.rotation.z = (i ? -1 : 1) * 0.3; });
  }
}

// farolito encendido en la mano
export function ponerFarol(m) {
  const u = m.group.userData;
  if (!u.npcArms || u.farol) return;
  const f = flat(0x6a4a2a, 0.04, 0.5, 0.04, 0, -0.55, 0.1);
  const luz = flat(0xffc040, 0.2, 0.22, 0.2, 0, -0.35, 0, true);
  f.add(luz);
  u.npcArms[1].add(f);
  u.farol = f;
}

export function tickFiestas(g) {
  if (g.dim !== 'tierra') return;
  const f = fiestaHoy(g), M = g.meta;
  if (M.fiestaAviso !== g.day && f && g.daylight > 0.4) { M.fiestaAviso = g.day; g.ui.toast(AVISO[f], 4200); }
  const p = g.player.body.pos;
  const v = g.nearestVillage(p.x, p.z);
  const enPueblo = v && v.dist < 60;
  const vecinos = g.entities.mobs.filter((m) => m.type === 'vecino' && !m.dead && m.data && m.group.userData && !m.group.userData.pending);
  // mascarada: cabezonas de día
  for (const m of vecinos) {
    if (f === 'mascarada' && g.daylight > 0.4 && m.data.role === 'vecino' && (m.data.seed % 3 === 0)) ponerCabezona(m);
    else if (m.group.userData.cabezona && !m.data.cabe) quitarCabezona(m);
  }
  if (f === 'mascarada' && enPueblo && g.disguised && g.daylight > 0.4) g.achieve('mascarada_fiesta', 'Cabezona en la fiesta');
  if (!enPueblo || f !== 'fin_de_ano') { luces(g, null, false); portal(g, null, false); }
  if (!enPueblo) return;
  const noche = g.daylight < 0.3;
  const c = v.v;
  // fin de año: luces de colores alrededor de la plaza y bombetas
  if (f === 'fin_de_ano') {
    luces(g, c, noche);
    portal(g, c, true);
    if (v.dist < 20) g.achieve('portal_navidad', 'Visité el portal');
    if (noche) {
      if (Math.random() < 0.12) (g.rockets ||= []).push(new Rocket(g, c.x + (Math.random() - 0.5) * 20, (c.y || p.y) + 2, c.z + (Math.random() - 0.5) * 20));
      if (v.dist < 30) g.achieve('fin_de_ano', 'Fiestas de fin de año');
    }
  }
  // carnaval (Caribe) o tope de caballos (los demás pueblos), de día
  if (f === 'carnaval' && !noche) {
    const caribe = regionAt(g.world.gen, c.x, c.z) === 'caribe';
    if (caribe) {
      let n = 0;
      for (const m of vecinos) {
        if (n >= 8 || m.data.role !== 'vecino') continue;
        n++;
        ponerPlumas(m);
        m.frozen = false; m.data.baila = true;
        m.data.ruta = m.data.ruta || { cx: c.x, cz: c.z, r: 9, a: (n / 8) * Math.PI * 2 };
      }
      g.audio.setEmitter('comparsa', 'loop.comparsa', v.dist < 60 ? { x: c.x, y: (c.y || p.y) + 2, z: c.z } : null, 0.9);
      for (let k = 0; k < 10; k++) g.particles.spawn(c.x + (Math.random() - 0.5) * 20, (c.y || p.y) + 6 + Math.random() * 3, c.z + (Math.random() - 0.5) * 20, [[1, 0.3, 0.3], [1, 0.9, 0.2], [0.3, 0.8, 1], [0.4, 1, 0.4], [1, 0.4, 0.9]][k % 5], (Math.random() - 0.5) * 0.6, -0.6, (Math.random() - 0.5) * 0.6, 4, 0.2, true);
      if (n && v.dist < 30) g.achieve('carnaval', 'Carnaval en el Caribe');
    } else {
      const caballos = g.entities.mobs.filter((m) => m.data && m.data.tope && !m.dead);
      if (caballos.length < 5) {
        const a = Math.random() * Math.PI * 2;
        const m = g.entities.spawnMob('caballo', c.x + Math.cos(a) * 11, (c.y || p.y) + 1, c.z + Math.sin(a) * 11);
        m.data.tope = true; m.data.ruta = { cx: c.x, cz: c.z, r: 11, a };
      }
      if (v.dist < 30) g.achieve('tope', 'Tope de caballos');
    }
  } else {
    g.audio.setEmitter('comparsa', 'loop.comparsa', null);
    for (const m of g.entities.mobs) if (m.data && m.data.tope && !m.dead) { m.data.tope = false; m.data.ruta = null; m.data.irse = 5; }
    for (const m of vecinos) if (m.group.userData.plumas) { m.group.userData.head.remove(m.group.userData.plumas); m.group.userData.plumas = null; m.data.baila = false; if (!(f === 'faroles' && noche)) m.data.ruta = null; }
  }
  // faroles: de noche los vecinos dan vueltas a la plaza con su farolito
  if (f === 'faroles' && noche) {
    let n = 0;
    for (const m of vecinos) {
      if (n >= 8 || m.data.role !== 'vecino') continue;
      n++;
      ponerFarol(m);
      m.frozen = false;
      m.data.ruta = m.data.ruta || { cx: c.x, cz: c.z, r: 10, a: (n / 8) * Math.PI * 2 };
    }
    if (n && v.dist < 30) g.achieve('faroles', 'El desfile de faroles');
  } else if (f !== 'carnaval') for (const m of vecinos) if (m.data.ruta && !m.data.patronal) { m.data.ruta = null; const u = m.group.userData; if (u.farol) { u.npcArms[1].remove(u.farol); u.farol = null; } }
}
