// El cuidacarros (sátira ficticia): de día, al bajarse de un vehículo en un pueblo, aparece un señor con chaleco
// fosforescente y franela que agita: «¡Se lo cuido, jefe!». Con clic derecho se le da una monedita (1 colón) y lo deja
// brillante; si no se le da nada, al volver… «uy, jefe, alguien le dejó una rayita» (es broma: no le pasa nada).
import * as THREE from 'three';
import { decir } from './misiones.js';

const COLON = 360;
const ALBAJAR = ['¡Se lo cuido, jefe!', '¡Tranquilo, patrón, aquí se lo vigilo!', '¡Déjemelo a mí, que yo se lo cuido como si fuera mío!'];
const PIDE = ['¿Una monedita para el cafecito, jefe?', 'Jefe, la colaboración es voluntaria… pero obligatoria.', '¡Diay, jefe! ¿Y lo mío?'];

function ponerChaleco(m) {
  const u = m.group.userData;
  if (u.chaleco || !u.body) return;
  const torso = u.body.children[0];
  if (!torso || !torso.geometry || !torso.geometry.parameters) return;
  const { width: w, height: h, depth: d } = torso.geometry.parameters;
  const chaleco = new THREE.Mesh(new THREE.BoxGeometry(w * 1.08, h * 0.7, d * 1.12), new THREE.MeshBasicMaterial({ color: 0xc8ff2a }));
  chaleco.position.copy(torso.position); chaleco.position.y += h * 0.1;
  const franja = new THREE.Mesh(new THREE.BoxGeometry(w * 1.1, h * 0.08, d * 1.14), new THREE.MeshBasicMaterial({ color: 0xe8e8e8 }));
  franja.position.copy(chaleco.position); franja.position.y -= h * 0.05;
  u.body.add(chaleco, franja);
  u.chaleco = chaleco;
  // la franela roja en la mano
  if (u.npcArms) {
    const franela = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.3), new THREE.MeshBasicMaterial({ color: 0xd82a2a }));
    franela.position.set(0, -0.6, 0.12);
    u.npcArms[1].add(franela);
    u.franela = franela;
  }
}

export function tickCuidacarros(g, dt) {
  const ahora = g.riding || null, antes = g.ridingPrev || null;
  g.ridingPrev = ahora;
  const esVeh = (m) => m && (m.kind.vehicle || m.kind.boat) && m.type !== 'bus';
  // se bajó de un vehículo
  if (antes && !ahora && esVeh(antes) && g.dim === 'tierra' && g.daylight > 0.45 && !g.cuida) {
    const p = antes.body.pos, v = g.nearestVillage(p.x, p.z);
    if (v && v.dist < 70 && Math.random() < 0.8) {
      const a = Math.random() * Math.PI * 2;
      const m = g.entities.spawnMob('vecino', p.x + Math.cos(a) * 3, p.y + 0.5, p.z + Math.sin(a) * 3);
      const here = { x: Math.floor(p.x), y: Math.floor(p.y), z: Math.floor(p.z) };
      Object.assign(m.data, { home: here, plaza: { ...here }, name: 'Don Memo (cuidacarros)', role: 'vecino', vid: `cuida:${Math.random()}`, seed: 515, cuidacarros: true });
      if (m.kind.dress) m.kind.dress(m);
      g.cuida = { m, veh: antes, pago: false, t: 0, pideT: 6 };
      setTimeout(() => { if (g.cuida && g.cuida.m === m) decir(g, m, ALBAJAR[Math.floor(Math.random() * ALBAJAR.length)], 3.5); }, 300);
      g.achieve('cuidacarros', '¡Se lo cuido, jefe!');
    }
  }
  const C = g.cuida;
  if (!C) return;
  const m = C.m;
  if (m.dead || !g.entities.mobs.includes(m)) { g.cuida = null; return; }
  if (m.group.userData.pending && m.kind.dress) m.kind.dress(m);
  ponerChaleco(m);
  C.t += dt;
  // se queda al lado del vehículo, agitando la franela
  const vp = C.veh.body.pos;
  m.data.walkTo = null;
  if (Math.hypot(m.body.pos.x - vp.x, m.body.pos.z - vp.z) > 2.5) { m.data.sigue = false; m.goTo(vp.x + 1.5, vp.z + 1.5, 1); } else { m.moving = false; m.targetYaw = Math.atan2(g.player.body.pos.x - m.body.pos.x, g.player.body.pos.z - m.body.pos.z); }
  // si ya pagó, le saca brillo
  if (C.pago && Math.random() < dt * 4) g.particles.spawn(vp.x + (Math.random() - 0.5) * 1.4, vp.y + 0.5 + Math.random() * 0.8, vp.z + (Math.random() - 0.5) * 1.4, [1, 1, 0.85], 0, 0.6, 0, 0.6, 0, true);
  const d = Math.hypot(m.body.pos.x - g.player.body.pos.x, m.body.pos.z - g.player.body.pos.z);
  C.pideT -= dt;
  if (!C.pago && d < 10 && C.pideT <= 0) { C.pideT = 12 + Math.random() * 8; decir(g, m, PIDE[Math.floor(Math.random() * PIDE.length)], 3.5); }
  // se volvió a subir: el veredicto
  if (g.riding === C.veh) {
    if (C.pago) { decir(g, m, '¡Ahí está, intacto y brillante! ¡Pura vida, jefe!', 3.5); }
    else { decir(g, m, 'Uy, jefe… alguien le dejó una rayita. Yo no vi nada, ¿eh?', 4); g.ui.toast('😬 «Una rayita» (es broma: no le pasó nada… esta vez)', 2400); g.achieve('rayita', 'Una rayita'); }
    m.data.irse = 5; m.data.cuidacarros = false;
    g.cuida = null;
  } else if (C.t > 300 || d > 80) { m.data.irse = 3; g.cuida = null; }
}

// clic derecho al cuidacarros: la monedita
export function cuidacarrosInteract(m, g) {
  if (!m.data.cuidacarros || !g.cuida || g.cuida.m !== m) return false;
  const C = g.cuida;
  if (C.pago) { decir(g, m, 'Tranquilo, jefe, ya me pagó. Se lo estoy dejando como nuevo.', 3); return true; }
  if (g.mode === 'survival') {
    if (g.inventory.count(COLON) < 1) { decir(g, m, '¿No anda ni una monedita? Bueno… se lo cuido igual. Más o menos.', 3.5); return true; }
    g.inventory.remove(COLON, 1);
  }
  C.pago = true;
  g.audio.play('monedas', { ui: true, vol: 0.4 });
  decir(g, m, '¡Pura vida, jefe! Se lo dejo como nuevo.', 3);
  g.achieve('cuidacarros_paga', 'La monedita del cuidacarros');
  return true;
}
export function limpiarCuidacarros(g) { g.cuida = null; g.ridingPrev = null; }
