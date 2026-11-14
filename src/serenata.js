// La serenata: algunas noches, en el pueblo, un muchacho con sombrero y guitarra se para debajo de la ventana de una casa y toca un
// pasillo (en tres por cuatro, con notas reales de arpa: la música del juego se calla mientras). Al final se enciende la luz de la
// ventana y la muchacha se asoma. Se le puede dar ₡2 de propina (clic derecho) y toca otra «a petición».
// Estado: g.serenata (no se guarda), g.serenataNoche.
import * as THREE from 'three';
import { SOLID, AIR } from './blocks.js';
import { decir } from './misiones.js';

const MAJOR = [0, 2, 4, 7, 9], MENOR = [0, 2, 3, 5, 7, 8, 10];
const COLON = 360;
// la guitarra: caja, boca, mástil y clavijero, terciada sobre el pecho
function guitarra(body) {
  const g = new THREE.Group(), mb = (c) => new THREE.MeshBasicMaterial({ color: c });
  const c = (w, h, d, col, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mb(col)); m.position.set(x, y, z); g.add(m); };
  c(0.5, 0.42, 0.12, 0xb8782a, 0, 0, 0); c(0.36, 0.3, 0.13, 0xc88a3a, 0.12, 0.02, 0); c(0.1, 0.1, 0.14, 0x2a1a0a, 0.02, 0.02, 0.01);
  c(0.62, 0.07, 0.06, 0x4a2a14, -0.5, 0.04, 0.02); c(0.12, 0.1, 0.07, 0x3a2010, -0.85, 0.04, 0.02);
  g.position.set(0.05, 0.95, 0.2); g.rotation.z = 0.45;
  body.add(g);
  return g;
}
// un pasillo: compás de tres, el bajo en el uno y el acorde en el dos y el tres; la melodía canta por arriba
function pasillo() {
  const menor = Math.random() < 0.6, esc = menor ? MENOR : MAJOR, n = esc.length, root = 57 + Math.floor(Math.random() * 5);
  const grado = (d) => root + Math.floor(d / n) * 12 + esc[((d % n) + n) % n];
  const beat = 0.4 + Math.random() * 0.06, notas = [];
  const frase = Array.from({ length: 12 }, (_, i) => (i % 3 === 0 ? [n, n + 2, n + 1, n + 4][Math.floor(i / 3)] : Math.floor(Math.random() * 5) + n - 1));
  let t = 0;
  for (let vuelta = 0; vuelta < 3; vuelta++) {
    for (let i = 0; i < 12; i++) {
      const compas = Math.floor(i / 3), raiz = [0, 3, 4, 0][compas] + (vuelta === 2 && compas === 3 ? 0 : 0);
      if (i % 3 === 0) notas.push({ t, midi: grado(raiz) - 12, vol: 0.5 });
      else notas.push({ t, midi: grado(raiz + 2) - (i % 3 === 1 ? 0 : -0), vol: 0.22 });
      const m = frase[i] + (vuelta === 1 ? 1 : 0) - (vuelta === 2 && i > 8 ? i - 8 : 0);
      notas.push({ t: t + 0.02, midi: grado(m) + 12, vol: 0.42 });
      if (Math.random() < 0.35) notas.push({ t: t + beat / 2, midi: grado(m + 1) + 12, vol: 0.3 });
      t += beat;
    }
  }
  notas.push({ t, midi: grado(0) - 12, vol: 0.5 }, { t, midi: grado(0) + 12, vol: 0.45 }, { t: t + 0.01, midi: grado(2) + 12, vol: 0.35 });
  return { notas, dura: t + 2 };
}
function tocar(g, S) {
  const M = g.music;
  if (!M || !M.ensureBus || !M.ensureBus() || !g.audio.ctx || M.enPelea) return 4;
  M.callar(); M.playing = true; M.left = 999; // la música del juego espera
  const p = g.player.body.pos, d = Math.hypot(p.x - S.m.body.pos.x, p.z - S.m.body.pos.z), k = Math.max(0, 1 - d / 34);
  const P = pasillo();
  for (const q of P.notas) M.note('arpa', q.midi, q.t, q.vol * k * 1.3);
  return P.dura;
}
// la ventana: buscando de la casa hacia afuera, la primera pared que da a la calle
function ventana(g, S, casa) {
  const b = S.m.body.pos, dx = casa.x + 0.5 - b.x, dz = casa.z + 0.5 - b.z, l = Math.hypot(dx, dz) || 1;
  for (let t = 0.5; t < l; t += 0.5) {
    const x = Math.floor(b.x + (dx / l) * t), z = Math.floor(b.z + (dz / l) * t), y = Math.floor(b.y) + 2;
    if (SOLID[g.world.getBlock(x, y, z)]) {
      const luz = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), new THREE.MeshBasicMaterial({ color: 0xffd890, transparent: true, opacity: 0, fog: false }));
      luz.position.set(x + 0.5 - (dx / l) * 0.06, y + 0.5, z + 0.5 - (dz / l) * 0.06); luz.scale.set(1.04, 1.04, 1.04);
      g.scene.add(luz);
      return luz;
    }
  }
  return null;
}
// un lugar afuera de la casa, al aire libre, a unos pasos
function afuera(g, casa) {
  const w = g.world;
  for (let r = 4; r <= 8; r++) for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2, x = Math.floor(casa.x + Math.cos(a) * r), z = Math.floor(casa.z + Math.sin(a) * r);
    for (let y = casa.y + 2; y >= casa.y - 2; y--) {
      if (!SOLID[w.getBlock(x, y - 1, z)] || w.getBlock(x, y, z) !== AIR || w.getBlock(x, y + 1, z) !== AIR) continue;
      let techo = false; for (let yy = y + 2; yy < y + 8; yy++) if (SOLID[w.getBlock(x, yy, z)]) { techo = true; break; }
      if (!techo) return { x: x + 0.5, y, z: z + 0.5 };
    }
  }
  return null;
}
export function limpiarSerenata(g) {
  const S = g.serenata;
  if (!S) return;
  if (S.luz) { g.scene.remove(S.luz); S.luz.geometry.dispose(); S.luz.material.dispose(); }
  if (S.m && !S.m.dead) S.m.dead = true;
  if (g.music) { if (g.music.callar && g.audio.ctx) g.music.callar(); g.music.playing = false; g.music.wait = 30; }
  g.serenata = null;
}
function empezar(g, casa) {
  const q = afuera(g, casa);
  if (!q) return false;
  const m = g.entities.spawnMob('vecino', q.x, q.y + 0.1, q.z);
  if (!m) return false;
  Object.assign(m.data, { role: 'serenatero', name: 'Jeffrey, el serenatero', home: { x: Math.floor(q.x), y: q.y, z: Math.floor(q.z) }, plaza: { x: Math.floor(q.x), y: q.y, z: Math.floor(q.z) }, vid: 'serenata', seed: 31337, guitarra: true, animo: { tipo: 'serenata' } });
  if (m.kind.dress) m.kind.dress(m);
  g.serenata = { m, casa, fase: 'llega', t: 1.5, canciones: 0, propina: false, luz: null };
  g.serenataNoche = g.day || 1;
  return true;
}
// cada segundo
export function tickSerenata(g) {
  if (g.serenata || g.dim !== 'tierra' || g.serenataNoche === (g.day || 1)) return;
  const t = g.time || 0;
  if (t < 0.6 || t > 0.85 || Math.random() > 1 / 120) return;
  const p = g.player.body.pos, v = g.nearestVillage && g.nearestVillage(p.x, p.z);
  if (!v || v.dist > 45) return;
  const casas = g.entities.mobs.filter((m) => m.type === 'vecino' && m.data.inside && m.data.home && Math.hypot(m.data.home.x - p.x, m.data.home.z - p.z) < 26);
  if (!casas.length) return;
  empezar(g, casas[Math.floor(Math.random() * casas.length)].data.home);
}
// cada cuadro
export function cuadroSerenata(g, dt) {
  const S = g.serenata;
  if (!S) return;
  const m = S.m;
  if (m.dead || g.dim !== 'tierra' || (g.time || 0) < 0.55) { limpiarSerenata(g); return; }
  // mirando a la ventana, con la guitarra
  m.targetYaw = Math.atan2(S.casa.x + 0.5 - m.body.pos.x, S.casa.z + 0.5 - m.body.pos.z); m.moving = false;
  if (!m.group.userData.guitarra && m.group.userData.body && !m.group.userData.pending) m.group.userData.guitarra = guitarra(m.group.userData.body);
  S.t -= dt;
  if (S.luz && S.luz.material.opacity < 0.9 && S.fase === 'ventana') S.luz.material.opacity += dt * 0.8;
  if (S.t > 0) return;
  if (S.fase === 'llega') { S.fase = 'toca'; S.t = tocar(g, S); decir(g, m, '♪ «Ay, mi amor, asómese a la ventana…» ♪', 3.5); if (Math.hypot(g.player.body.pos.x - m.body.pos.x, g.player.body.pos.z - m.body.pos.z) < 30) g.ui.toast('🎸 Alguien está dando una serenata debajo de una ventana…', 3000); return; }
  if (S.fase === 'toca') {
    S.canciones++;
    if (!S.luz) { S.luz = ventana(g, S, S.casa); S.fase = 'ventana'; S.t = 3; g.ui.toast('🌹 ¡Se encendió la luz de la ventana… y se asomó! El serenatero ya está feliz', 3600); decir(g, m, '¡Buenas noches, mi reina!', 3); if (Math.hypot(g.player.body.pos.x - m.body.pos.x, g.player.body.pos.z - m.body.pos.z) < 30) g.achieve('serenata', 'Vi una serenata'); return; }
    S.fase = 'adios'; S.t = 3; decir(g, m, 'Bueno… hasta mañana. ¡Ahí le dejo el corazón!', 3);
    return;
  }
  if (S.fase === 'ventana') { if (S.propina && S.canciones < 2) { S.fase = 'toca'; S.t = tocar(g, S); decir(g, m, '♪ Esta va a petición del público ♪', 3); } else { S.fase = 'adios'; S.t = 3; decir(g, m, 'Bueno… hasta mañana. ¡Ahí le dejo el corazón!', 3); } return; }
  if (S.fase === 'adios') { if (g.music) { g.music.playing = false; g.music.wait = 40; } m.goTo(m.body.pos.x + 20, m.body.pos.z, 1); if (S.t < -6) limpiarSerenata(g); }
}
// clic derecho al serenatero: propina
export function serenateroInteract(m, g) {
  const S = g.serenata;
  if (!S || S.m !== m) return false;
  if (S.propina) { decir(g, m, '¡Gracias otra vez! Ya va la otra.', 2.4); return true; }
  if (g.inventory.count(COLON) < 2) { decir(g, m, 'Diay, no se preocupe… con que escuche, me basta.', 2.6); return true; }
  g.inventory.remove(COLON, 2); S.propina = true;
  g.audio.play('monedas', { ui: true, vol: 0.5 });
  decir(g, m, '¡Muchas gracias! Ahorita le toco otra, a petición.', 2.8);
  g.achieve('serenata_propina', 'Propina para el serenatero');
  return true;
}
export function pruebaSerenata(g) {
  limpiarSerenata(g);
  const p = g.player.body.pos, d = g.player.lookDir();
  const casa = { x: Math.floor(p.x + d.x * 7), y: Math.floor(p.y), z: Math.floor(p.z + d.z * 7) };
  g.time = Math.max(g.time || 0, 0.65);
  return empezar(g, casa) ? 'Un serenatero, a unos pasos: en un ratito empieza el pasillo' : 'No hubo dónde ponerlo: pruebe en un lugar abierto';
}
