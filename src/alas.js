// Las Alas del Rey Zopilote y las bombetas (v5.1): lo que se gana al final de todo. Con las alas puestas (en el pecho), en el aire y
// cayendo, Espacio abre las alas y se planea: mirar para abajo da velocidad, mirar para arriba la gasta en altura. Las bombetas (clic
// derecho) dan un empujón mientras se planea; en el suelo, se tiran al cielo y revientan con chispas, como en las fiestas.
// Estado: g.planeo (no se guarda). Las alas se gastan con el uso y se reparan con plumas del Rey.
import * as THREE from 'three';
import { manaJefe } from './manasjefe.js';

export const ALAS = 549, BOMBETA = 374;
export const tieneAlas = (g) => !!(g.inventory.armor[1] && g.inventory.armor[1].id === ALAS);

// Espacio en el aire: abre o cierra las alas
export function empezarPlaneo(g) {
  if (g.planeo) { terminarPlaneo(g); return true; }
  const b = g.player.body;
  if (!tieneAlas(g) || b.onGround || b.inWater || g.riding || g.zip || g.monta || g.globoViaje || g.player.flying || b.vel.y > -0.5) return false;
  const v = Math.max(9, Math.hypot(b.vel.x, b.vel.z) + 4);
  g.planeo = { v, t: 0, boost: 0, gasto: 0, y0: b.fallStart != null ? Math.max(b.fallStart, b.pos.y) : b.pos.y };
  g.audio.play('aleteo', { ui: true, vol: 0.9, pitch: 0.7 });
  if (!g.meta.alasAviso) { g.meta.alasAviso = true; g.ui.toast('🪶 ¡A planear! Mire abajo para tomar velocidad, arriba para subir · Espacio cierra', 5200); }
  g.achieve('planeo', 'Con las alas del Rey');
  return true;
}
export function terminarPlaneo(g) {
  if (!g.planeo) return;
  g.planeo = null;
  g.audio.setEmitter('planeo', 'loop.wind', null);
}
// cada cuadro, en vez del movimiento normal
export function planeoUpdate(g, dt) {
  const P = g.planeo, p = g.player, b = p.body;
  P.t += dt;
  const dir = p.lookDir();
  // la velocidad: bajar la gana, subir la gasta (y el aire frena un poquito)
  P.v += (-dir.y * 16 - 1) * dt;
  if (P.boost > 0) {
    P.boost -= dt; P.v = Math.min(38, P.v + 26 * dt);
    for (let i = 0; i < 3; i++) g.particles.spawn(b.pos.x - dir.x * 0.8, b.pos.y + 0.6, b.pos.z - dir.z * 0.8, Math.random() < 0.5 ? [1, 0.75, 0.25] : [1, 0.95, 0.6], (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 0.5, 0, true);
  }
  P.v = Math.max(3.5, Math.min(38, P.v));
  const h = Math.hypot(dir.x, dir.z) || 1;
  b.vel.x = (dir.x / h) * P.v * Math.max(0.4, h);
  b.vel.z = (dir.z / h) * P.v * Math.max(0.4, h);
  // siempre baja un poquito; mirando arriba con velocidad, sube
  b.vel.y = dir.y * P.v * 0.85 - 2.4 * (manaJefe(g, 'pluma_viento') ? 0.75 : 1) + (P.boost > 0 ? 3 : 0); // v12.16.5: «Pluma al viento» baja un cuarto más despacio
  const antes = P.v;
  b.step(g.world, dt);
  b.fallStart = null; g.sinCaida = (g.clock || 0) + 0.4;
  // el viento en las orejas, según la velocidad
  g.audio.setEmitter('planeo', 'loop.wind', { x: b.pos.x, y: b.pos.y + 1.6, z: b.pos.z }, Math.min(1, 0.15 + P.v / 30));
  // las alas se gastan un punto cada dos segundos de vuelo
  P.gasto += dt;
  if (P.gasto > 2 && g.mode === 'survival') {
    P.gasto = 0;
    const s = g.inventory.armor[1];
    if (s) { s.dur = (s.dur ?? 600) - 1; if (s.dur <= 0) { g.inventory.armor[1] = null; g.ui.toast('🪶 ¡Se deshicieron las alas!', 2200); g.audio.play('toolbreak'); terminarPlaneo(g); } g.inventory.changed(); }
  }
  // chocar fuerte contra una pared duele
  if (b.hitWall && antes > 15 && g.mode === 'survival') { g.damagePlayer(Math.round((antes - 15) * 0.5), null, null, 'Se estrelló planeando', true); P.v = 4; }
  if (b.onGround && g.mode === 'survival') {
    // abrir las alas a última hora no salva de la caída; aterrizar a toda velocidad, tampoco
    const caida = P.t < 0.8 ? Math.max(0, P.y0 - b.pos.y - 3.5) : 0, golpe = P.v > 18 ? (P.v - 18) * 0.45 : 0, dmg = Math.round(Math.max(caida, golpe));
    if (dmg > 0) g.damagePlayer(dmg, null, null, 'Aterrizó muy duro con las alas', true);
  }
  if (b.onGround || b.inWater || !tieneAlas(g)) terminarPlaneo(g);
}
// la cámara se ladea en las curvas y la vista se abre con la velocidad
export function fovPlaneo(g) { return g.planeo ? Math.min(18, g.planeo.v * 0.5) : 0; }

// ---------- las bombetas (las de siempre, 374): planeando, un empujón; en el suelo siguen siendo el cohete de las fiestas ----------
export function usarBombeta(g, id) {
  if (id !== BOMBETA || !g.planeo) return false;
  g.planeo.boost = 1.3;
  g.audio.play('bombeta', { ui: true, vol: 0.7, pitch: 1.4 });
  if (g.mode === 'survival') g.inventory.consumeHeld(1);
  g.achieve('bombeta_alas', '¡Con bombeta en las alas!');
  return true;
}
// las alas en la espalda del personaje (tercera persona): cerradas caminando, abiertas planeando
export function alasAvatar(A, g, dt) {
  const P = A.P, puestas = tieneAlas(g);
  if (puestas && !A.alas) {
    const grupo = new THREE.Group(); grupo.position.set(0, 1.25, -0.2);
    const pluma = (c) => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide });
    A.alas = [-1, 1].map((s) => {
      const ala = new THREE.Group(); grupo.add(ala);
      for (let k = 0; k < 5; k++) { const q = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.9 - k * 0.12, 0.03), pluma(k > 2 ? 0xd8d8d0 : 0x16161a)); q.position.set(s * (0.2 + k * 0.28), -0.25 - k * 0.04, -0.02 * k); ala.add(q); }
      ala.add(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.06), pluma(0x6a4a2a)));
      ala.userData.s = s;
      return ala;
    });
    P.body.add(grupo); A.alasGrupo = grupo;
  }
  if (!puestas && A.alas) { A.alasGrupo.parent.remove(A.alasGrupo); A.alas = null; A.alasGrupo = null; }
  if (!A.alas) return;
  A.abre = (A.abre || 0) + ((g.planeo ? 1 : 0) - (A.abre || 0)) * Math.min(1, dt * 8);
  for (const ala of A.alas) { const s = ala.userData.s; ala.rotation.y = s * (1.2 - A.abre * 1.2); ala.rotation.z = s * (0.3 - A.abre * 0.2) + (g.planeo ? Math.sin((g.clock || 0) * 2) * 0.04 : 0); }
}
// la pose de planear: el cuerpo acostado, brazos abiertos
export function posePlaneo(A, g) {
  if (!g.planeo) return false;
  const P = A.P;
  A.root.rotation.x = -1.25;
  P.armL.rotation.set(0, 0, -1.35); P.armR.rotation.set(0, 0, 1.35);
  P.legL.rotation.x = 0.1; P.legR.rotation.x = -0.1;
  return true;
}
