// Carrera de sacos: con el saco de gangoche en la mano, clic derecho para meterse y arranca la carrera contra tres
// güilas del pueblo hasta la meta (una cuerda con banderitas 25 bloques adelante). En el saco no se camina: se avanza a
// brincos (Espacio o W). Los güilas también brincan… y de vez en cuando alguno se va de jupa.
import * as THREE from 'three';

export const SACO = 491;
const LARGO = 25;
const NOMBRES = ['Kevin', 'Dayana', 'Josué', 'Valeria', 'Brandon', 'Sofía'];

let texSaco = null;
function texturaSaco() {
  if (texSaco) return texSaco;
  const cv = document.createElement('canvas'); cv.width = 16; cv.height = 16;
  const c = cv.getContext('2d');
  c.fillStyle = '#8a6a3c'; c.fillRect(0, 0, 16, 16);
  // el tejido del gangoche
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((x + y) % 2 === 0) { c.fillStyle = (x * 7 + y * 3) % 5 ? '#9a7a48' : '#76582e'; c.fillRect(x, y, 1, 1); }
  // el sello azul del café
  c.fillStyle = '#2a4aa8'; c.fillRect(4, 6, 8, 1); c.fillRect(4, 9, 8, 1); c.fillRect(4, 6, 1, 4); c.fillRect(11, 6, 1, 4); c.fillRect(6, 7, 4, 1);
  texSaco = new THREE.CanvasTexture(cv); texSaco.magFilter = THREE.NearestFilter; texSaco.minFilter = THREE.NearestFilter;
  return texSaco;
}
export function saquito(alto) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.68, alto, 0.46), new THREE.MeshBasicMaterial({ map: texturaSaco() }));
  // el borde enrollado del saco, que uno agarra con las manos
  const borde = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.1, 0.52), new THREE.MeshBasicMaterial({ color: 0x5a4020 }));
  borde.position.y = alto / 2;
  m.add(borde);
  return m;
}

export function usarSaco(g) {
  if (g.saco) return false;
  if (g.dim !== 'tierra' || g.riding) { g.ui.toast('Aquí no se puede hacer la carrera de sacos', 1400); return false; }
  const p = g.player.body.pos, yaw = g.player.yaw;
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  // la meta: una cuerda con banderitas
  const meta = new THREE.Group();
  const mx = p.x + fx * LARGO, mz = p.z + fz * LARGO;
  const yM = p.y;
  const cols = [0xe83a3a, 0xf0c020, 0x2a6ad8, 0x2aa84a, 0xffffff];
  for (const s of [-1, 1]) { const poste = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.6, 0.12), new THREE.MeshBasicMaterial({ color: 0x6a4424 })); poste.position.set(s * 4.2, 1.3, 0); meta.add(poste); }
  for (let i = 0; i < 17; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.02), new THREE.MeshBasicMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide })); b.position.set(-4 + i * 0.5, 2.35 - Math.sin((i / 16) * Math.PI) * 0.3, 0); meta.add(b); }
  meta.position.set(mx, yM, mz);
  meta.rotation.y = Math.atan2(fx, fz);
  g.scene.add(meta);
  // los güilas en fila al lado de uno
  const rivales = [];
  [-1.6, 1.6, 3.2].forEach((off, i) => {
    const m = g.entities.spawnMob('vecino', p.x + rx * off, p.y + 0.3, p.z + rz * off);
    const h = { x: Math.floor(p.x), y: Math.floor(p.y), z: Math.floor(p.z) };
    Object.assign(m.data, { home: h, plaza: { ...h }, name: NOMBRES[(Math.random() * NOMBRES.length) | 0] + ' (güila)', role: 'vecino', vid: `saco:${Math.random()}`, seed: 900 + i * 37, saco: true });
    if (m.kind.dress) m.kind.dress(m);
    m.group.userData.babyScale = 0.72;
    const sq = saquito(0.78); sq.position.y = 0.4; if (m.group.userData.body) m.group.userData.body.add(sq);
    m.yaw = m.targetYaw = Math.atan2(fx, fz);
    rivales.push({ m, cd: 0.8 + Math.random() * 0.5, fuerza: 0.92 + Math.random() * 0.28, caido: 0 });
  });
  g.saco = { fx, fz, x0: p.x, z0: p.z, meta, rivales, t: -3, cuenta: 3, cd: 0, terminado: false };
  g.ui.toast('🥔 ¡Carrera de sacos! En sus marcas… (en el saco se avanza a brincos: Espacio o W)', 3000);
  g.achieve('sacos', 'Carrera de sacos');
  return true;
}

const avance = (S, x, z) => (x - S.x0) * S.fx + (z - S.z0) * S.fz;

// después del combate (como el parapente): manda la velocidad del jugador
export function tickSacos(g, dt) {
  const S = g.saco;
  if (!S) return;
  const pl = g.player, b = pl.body, k = g.keys;
  S.t += dt;
  // cuenta regresiva
  if (S.t < 0) {
    const c = Math.ceil(-S.t);
    if (c !== S.cuenta) { S.cuenta = c; g.ui.toast(`${c}…`, 700); g.audio.play('click', { ui: true, vol: 0.7, pitch: 1.2 }); }
    pl.forcedVel = { x: 0, z: 0 };
    return;
  }
  if (!S.arranco) { S.arranco = true; g.ui.toast('¡FUERA!', 900); g.audio.play('silbato', { ui: true, vol: 0.7 }); }
  // el jugador: solo brincos hacia adelante
  S.cd = Math.max(0, S.cd - dt);
  if (b.onGround) {
    pl.forcedVel = { x: 0, z: 0 };
    if ((k.has('Space') || k.has('KeyW')) && S.cd <= 0) { b.vel.y = 5.2; S.cd = 0.25; S.brinco = true; g.audio.play('soltar', { vol: 0.25, pitch: 1.3 }); }
  } else pl.forcedVel = S.brinco ? { x: S.fx * 4.6, z: S.fz * 4.6 } : { x: 0, z: 0 };
  if (b.onGround && b.vel.y <= 0) S.brinco = false;
  // los güilas
  for (const R of S.rivales) {
    const m = R.m, mb = m.body;
    if (m.dead) continue;
    // en el aire sigue hacia adelante (en el suelo el roce lo frena)
    if (!mb.onGround && R.salto && !(R.caido > 0)) { mb.vel.x = S.fx * 5.1 * R.fuerza; mb.vel.z = S.fz * 5.1 * R.fuerza; } else if (mb.onGround && mb.vel.y <= 0) R.salto = false;
    if (R.caido > 0) { R.caido -= dt; m.group.rotation.z = Math.min(1.3, (1.2 - R.caido) * 6) * (R.caido > 0.3 ? 1 : R.caido / 0.3); continue; }
    m.group.rotation.z = 0;
    R.cd -= dt;
    if (mb.onGround && R.cd <= 0) {
      R.cd = (0.14 + Math.random() * 0.22) / R.fuerza;
      mb.vel.y = 5; R.salto = true;
      if (Math.random() < 0.035) { R.caido = 1.2; R.salto = false; mb.vel.x = mb.vel.z = 0; if (Math.hypot(mb.pos.x - b.pos.x, mb.pos.z - b.pos.z) < 15) g.ui.toast(`🤣 ¡${m.data.name.split(' ')[0]} se fue de jupa!`, 1200); }
    }
  }
  // ¿quién llegó?
  if (!S.terminado) {
    const yo = avance(S, b.pos.x, b.pos.z);
    const ganadorR = S.rivales.find((R) => avance(S, R.m.body.pos.x, R.m.body.pos.z) >= LARGO);
    if (yo >= LARGO || ganadorR) {
      S.terminado = true;
      const lugar = 1 + S.rivales.filter((R) => avance(S, R.m.body.pos.x, R.m.body.pos.z) > yo).length;
      if (yo >= LARGO && lugar === 1) { g.giveItem(360, 10); g.audio.play('aplausos', { ui: true, vol: 0.6 }); g.ui.toast('🏆 ¡Ganó la carrera de sacos! 10 colones de premio', 3200); g.achieve('sacos_gana', 'Gané la carrera de sacos'); }
      else g.ui.toast(`🥔 Ganó ${ganadorR ? ganadorR.m.data.name.split(' ')[0] : 'otro'}. Usted quedó de ${lugar}.º… ¡a practicar los brincos!`, 3200);
      S.fin = S.t + 2.5;
    }
  } else if (S.t > S.fin) terminar(g);
}
function terminar(g) {
  const S = g.saco;
  if (!S) return;
  g.scene.remove(S.meta);
  for (const R of S.rivales) { R.m.data.saco = false; R.m.data.irse = 4; R.m.group.rotation.z = 0; }
  g.player.forcedVel = null;
  g.saco = null;
}
export function limpiarSacos(g) { if (g.saco) terminar(g); }
