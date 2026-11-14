// El tsunami: después de un temblor fuerte, si uno anda en la costa, a veces el mar se recoge de golpe (queda el fondo al
// aire, con peces brincando), repican las campanas del pueblo y a los veinte segundos entra una ola enorme. Lo que se sabe de
// memoria: si el mar se va, uno se va para arriba. Abajo, la ola revuelca y arrastra; arriba, se ve pasar.
// Estado: g.tsunami (no se guarda), meta.tsunamiCd, meta.tsunamis.
import * as THREE from 'three';
import { SEA } from './worldgen.js';
import { haciaMar } from './marcielo.js';
import { disposeModel } from './models.js';
import { anotar } from './diario.js';

const RECOGE = 20, ALTO = 12, VEL = 12, LEJOS = 90;
const DESPOJOS = [[256, 3], [7, 2], [361, 1], [362, 1]]; // palos, troncos y pescado que deja la ola
const mb = (c, o = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: o < 1, opacity: o, depthWrite: o >= 1 });

// la orilla: a cuántos bloques hacia el mar empieza el agua
function orilla(g, x, z, dx, dz) {
  for (let d = 0; d < 80; d++) if (g.world.gen.column(Math.floor(x + dx * d), Math.floor(z + dz * d)).h < SEA - 1) return d;
  return null;
}
// arena mojada con charcos y algas, para el fondo que queda al aire
function texturaFondo() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  for (let i = 0; i < 64; i++) for (let j = 0; j < 64; j++) { const v = 150 + Math.random() * 30; x.fillStyle = `rgb(${v + 25},${v + 8},${v - 35})`; x.fillRect(i, j, 1, 1); }
  for (let k = 0; k < 7; k++) { x.fillStyle = 'rgba(60,110,130,0.7)'; x.fillRect(Math.random() * 60, Math.random() * 60, 3 + Math.random() * 6, 2 + Math.random() * 3); }
  for (let k = 0; k < 10; k++) { x.fillStyle = 'rgba(50,90,40,0.8)'; x.fillRect(Math.random() * 62, Math.random() * 62, 1, 2 + Math.random() * 2); }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(12, 4); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function armar(g, a) {
  const p = g.player.body.pos, dx = Math.cos(a), dz = Math.sin(a);
  const d0 = orilla(g, p.x, p.z, dx, dz);
  if (d0 == null || d0 > 60) return false;
  const ry = Math.atan2(dx, dz);
  // el fondo del mar al aire: una lámina de arena mojada encima del agua
  const fondo = new THREE.Mesh(new THREE.BoxGeometry(170, 0.06, 1), new THREE.MeshBasicMaterial({ map: texturaFondo(), transparent: true, opacity: 0, depthWrite: false }));
  fondo.scale.z = 55;
  fondo.position.set(p.x + dx * (d0 + 27), SEA + 0.97, p.z + dz * (d0 + 27)); fondo.rotation.y = ry; fondo.renderOrder = 3;
  g.scene.add(fondo);
  // la ola: el muro de agua, la espuma de arriba y el agua que viene detrás
  const ola = new THREE.Group();
  ola.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(170, 1, 3), mb(0x174f6e)), { name: 'muro' }));
  ola.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(170, 1.1, 3.2), mb(0xeef6f8)), { name: 'espuma' }));
  ola.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(170, 1, 30), mb(0x2a85a8, 0.78)), { name: 'cola' }));
  ola.rotation.y = ry; ola.visible = false;
  g.scene.add(ola);
  g.tsunami = { fase: 'recoge', t: RECOGE, ox: p.x, oz: p.z, dx, dz, d0, fondo, ola, frente: LEJOS, campana: 0, pego: false, mobs: new Set() };
  return true;
}
export function limpiarTsunami(g) {
  const T = g.tsunami;
  if (!T) return;
  for (const o of [T.fondo, T.ola]) { g.scene.remove(o); disposeModel(o); }
  g.audio.setEmitter('tsunami', null, null);
  g.tsunami = null;
}
// al terminar un temblor (supervivencia2.js deja la magnitud en g.temblorFin)
export function quizaTsunami(g, mag) {
  if (g.tsunami || g.dim !== 'tierra' || g.mode !== 'survival' || mag < 6 || !g.player.alive) return;
  const M = g.meta, p = g.player.body.pos;
  if (!M || (g.clock || 0) < (M.tsunamiCd || 0) || p.y > SEA + 30 || Math.random() > 0.7) return;
  const a = haciaMar(g);
  if (a == null || !armar(g, a)) return;
  M.tsunamiCd = (g.clock || 0) + 2400;
  g.audio.play('rumble', { ui: true, vol: 0.7, pitch: 0.7 });
  g.ui.toast('🌊 ¡El mar se recoge: tsunami! Súbase a lo alto, YA (15 bloques sobre el mar)', 5200, 'urgente');
}
const altura = (T) => ALTO * Math.min(1, Math.max(0.25, 1.15 - T.frente / LEJOS)); // crece al llegar a la orilla
// cada cuadro
export function cuadroTsunami(g, dt) {
  if (g.temblorFin) { const mag = g.temblorFin; g.temblorFin = 0; quizaTsunami(g, mag); }
  const T = g.tsunami;
  if (!T) return;
  if (g.dim !== 'tierra') { limpiarTsunami(g); return; }
  const P = g.player, p = P.body.pos, R = g.particles;
  if (T.fase === 'recoge') {
    T.t -= dt;
    T.fondo.material.opacity = Math.min(0.95, T.fondo.material.opacity + dt * 0.25);
    // peces brincando en el fondo que quedó al aire
    if (Math.random() < dt * 6) {
      const d = T.d0 + 4 + Math.random() * 40, l = (Math.random() - 0.5) * 60;
      R.spawn(T.ox + T.dx * d - T.dz * l, SEA + 0.3, T.oz + T.dz * d + T.dx * l, Math.random() < 0.5 ? [0.75, 0.78, 0.82] : [0.85, 0.5, 0.35], 0, 3 + Math.random() * 2, 0, 0.9, 14);
    }
    // las campanas del pueblo, si hay uno cerca
    T.campana -= dt;
    if (T.campana <= 0 && g.nearestVillage) { T.campana = 2.5; const v = g.nearestVillage(p.x, p.z); if (v && v.dist < 140) g.audio.play('campana', { ui: true, vol: 0.55, pitch: 1.05 }); }
    if (T.t <= 5 && !T.dijo5) { T.dijo5 = true; g.ui.toast('🌊 ¡Viene la ola! ¡Arriba, arriba!', 2600); g.audio.play('rumble', { ui: true, vol: 1, pitch: 0.55 }); }
    if (T.t <= 0) { T.fase = 'ola'; T.ola.visible = true; }
    return;
  }
  // ---- la ola entrando ----
  T.frente -= VEL * dt;
  const H = altura(T), fx = T.ox + T.dx * T.frente, fz = T.oz + T.dz * T.frente, base = SEA + 0.5;
  for (const m of T.ola.children) {
    if (m.name === 'muro') { m.scale.y = H; m.position.set(0, base + H / 2, 0); }
    else if (m.name === 'espuma') { m.position.set(0, base + H + 0.1, -1.1); m.rotation.x = -0.55; m.scale.y = 1 + Math.sin((g.clock || 0) * 9) * 0.2; } // la cresta que se viene encima
    else { m.scale.y = H * 0.85; m.position.set(0, base + H * 0.425, 16.4); }
  }
  T.ola.position.set(fx, 0, fz);
  // el agua vuelve a tapar el fondo conforme pasa la ola
  const largo = Math.max(0.01, Math.min(T.d0 + 55, T.frente) - T.d0);
  T.fondo.scale.z = largo; T.fondo.position.set(T.ox + T.dx * (T.d0 + largo / 2), SEA + 0.97, T.oz + T.dz * (T.d0 + largo / 2));
  if (T.frente < T.d0) T.fondo.visible = false;
  g.audio.setEmitter('tsunami', 'loop.waves', { x: fx, y: base + H / 2, z: fz }, 1);
  if (Math.random() < dt * 30) { const l = (Math.random() - 0.5) * 80; R.spawn(fx - T.dz * l, base + H + 0.4, fz + T.dx * l, [0.95, 0.98, 1], -T.dx * 3, 2 + Math.random() * 2, -T.dz * 3, 1, 8); }
  const dist = Math.hypot(fx - p.x, fz - p.z);
  if (dist < 40) g.shake = Math.max(g.shake || 0, 0.5 * (1 - dist / 40));
  const tope = base + H;
  // los animales y la gente de abajo, revolcados tierra adentro
  for (const m of g.entities.mobs) {
    if (m.dead || m.dying || T.mobs.has(m)) continue;
    const u = (m.body.pos.x - T.ox) * T.dx + (m.body.pos.z - T.oz) * T.dz;
    if (u >= T.frente - 0.5 && u < T.frente + 3 && m.body.pos.y < tope) { T.mobs.add(m); m.body.vel.x -= T.dx * 10; m.body.vel.z -= T.dz * 10; m.body.vel.y = 4; }
  }
  // uno
  const u = (p.x - T.ox) * T.dx + (p.z - T.oz) * T.dz, lat = Math.abs(-(p.x - T.ox) * T.dz + (p.z - T.oz) * T.dx);
  const bajoTierra = p.y < g.world.gen.column(Math.floor(p.x), Math.floor(p.z)).h - 2;
  if (!T.pego && !T.salvo && u >= T.frente - 0.5 && lat < 85 && !bajoTierra) {
    if (p.y < tope - 0.3 && P.alive && !P.flying) {
      T.pego = true;
      const v = P.body.vel; v.x -= T.dx * 18; v.z -= T.dz * 18; v.y = 6;
      g.damagePlayer(9, null, null, 'Revolcada de un tsunami', true, false);
      g.addEffect('escalofrio', 40);
      g.shake = 1.2;
      g.audio.play('splash', { ui: true, vol: 1, pitch: 0.6 });
      g.ui.toast('🌊 ¡La ola le pasó por encima y le revolcó tierra adentro! Cuando el mar se va, se sube', 4200);
    } else if (P.alive) {
      T.salvo = true;
      g.achieve('tsunami', 'Vi pasar el tsunami desde arriba');
      g.ui.toast('🌊 La ola pasó por debajo, rugiendo. Desde aquí arriba se ve todo… qué barbaridad', 4200);
      anotar(g, 'Vi entrar un tsunami desde lo alto. El mar se había ido y volvió todo de un solo golpe.', '🌊');
    }
  }
  if (T.frente < -40) {
    const M = g.meta;
    M.tsunamis = (M.tsunamis || 0) + 1;
    // lo que dejó la ola en la orilla
    for (let i = 0; i < 6; i++) {
      const [id, n] = DESPOJOS[Math.floor(Math.random() * DESPOJOS.length)], d = Math.random() * 20, l = (Math.random() - 0.5) * 24;
      const x = T.ox + T.dx * d - T.dz * l, z = T.oz + T.dz * d + T.dx * l, y = Math.max(SEA, g.world.gen.column(Math.floor(x), Math.floor(z)).h) + 1.5;
      g.entities.dropItem(id, n, x, y, z);
    }
    g.ui.toast('📻 Comisión Nacional de Sustos (ficticia): «Ya pasó. Revise la casa»', 4600);
    if (T.pego) g.achieve('tsunami_revolcon', 'Me revolcó el tsunami');
    limpiarTsunami(g);
  }
}
export function pruebaTsunami(g) {
  limpiarTsunami(g);
  const a = haciaMar(g);
  if (a == null) return 'Aquí no hay mar abierto cerca: pruébelo en una playa, mirando al mar';
  if (!armar(g, a)) return 'La orilla queda muy lejos de aquí: acérquese al mar';
  g.ui.toast('🌊 ¡El mar se recoge: tsunami! Súbase a lo alto, YA (15 bloques sobre el mar)', 5200, 'urgente');
  return 'El mar se recoge: en 20 segundos entra la ola';
}
