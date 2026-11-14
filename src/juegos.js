// Juegos tradicionales: el papalote (barrilete) que se eleva con el viento —en verano sube alto; con lluvia se moja
// y con tormenta… mejor no—, el trompo que baila en el piso y los chumicos (bolinchas) para apostar con los vecinos.
import * as THREE from 'three';
import { SOLID } from './blocks.js';
import { decir } from './misiones.js';

export const PAPALOTE = 473, TROMPO = 474, CHUMICOS = 475;

// ---------- el papalote ----------
function hacerPapalote() {
  const g = new THREE.Group();
  const cols = [0xe83030, 0xf0c020, 0x2a6ad8, 0x2aa84a];
  const forma = new THREE.Shape();
  forma.moveTo(0, 0.9); forma.lineTo(0.6, 0.15); forma.lineTo(0, -0.9); forma.lineTo(-0.6, 0.15); forma.lineTo(0, 0.9);
  const cuerpo = new THREE.Mesh(new THREE.ShapeGeometry(forma), new THREE.MeshBasicMaterial({ color: cols[0], side: THREE.DoubleSide }));
  g.add(cuerpo);
  // las cuatro secciones de colores
  const tri = (a, b, c, col) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c], 3));
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide }));
    m.position.z = 0.01;
    g.add(m);
  };
  tri([0, 0.9, 0], [0.6, 0.15, 0], [0, 0.15, 0], cols[1]);
  tri([0, 0.15, 0], [-0.6, 0.15, 0], [0, -0.9, 0], cols[2]);
  // la cola con sus lacitos
  const cola = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.12), new THREE.MeshBasicMaterial({ color: cols[i % 4], side: THREE.DoubleSide }));
    l.position.y = -1.1 - i * 0.42;
    cola.add(l);
  }
  g.add(cola);
  g.userData.cola = cola;
  return g;
}
const vientoDir = (g) => ((g.day || 1) * 2.399) % (Math.PI * 2);

export function usarPapalote(g) {
  if (g.papalote) { recoger(g, '🪁 Enrolló la cuerda del papalote'); return; }
  if (g.dim !== 'tierra') { g.ui.toast('Aquí no hay viento para el papalote', 1400); return; }
  const p = g.player.body.pos;
  const mesh = hacerPapalote();
  mesh.position.set(p.x, p.y + 2, p.z);
  g.scene.add(mesh);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(new Array(3 * 12).fill(0), 3));
  const linea = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xf4f0e0 }));
  linea.frustumCulled = false;
  g.scene.add(linea);
  g.papalote = { mesh, linea, alt: 2, dist: 2, t: 0 };
  g.ui.toast(g.season === 'verano' ? '🪁 ¡Qué viento de verano! Suelte cuerda y el papalote sube solito' : '🪁 Poco viento… el papalote apenas se levanta (en verano sube mucho más)', 2600);
}
function recoger(g, txt) {
  const K = g.papalote;
  if (!K) return;
  g.scene.remove(K.mesh); g.scene.remove(K.linea);
  K.linea.geometry.dispose();
  g.papalote = null;
  if (txt) g.ui.toast(txt, 1400);
}
export function tickJuegos(g, dt) {
  // ---- papalote ----
  const K = g.papalote;
  if (K) {
    const held = g.inventory.held;
    if (!held || held.id !== PAPALOTE || g.dim !== 'tierra' || !g.player.alive) recoger(g, null);
    else {
      K.t += dt;
      const W = g.weather, lluvia = W && W.intensity > 0.5 && !g.dry && !g.cold;
      const verano = g.season === 'verano';
      const meta = lluvia ? 4 : verano ? 26 : 11;
      K.alt += (meta - K.alt) * Math.min(1, dt * 0.25);
      K.dist += ((verano ? 22 : 10) - K.dist) * Math.min(1, dt * 0.25);
      const p = g.player.body.pos, a = vientoDir(g);
      const x = p.x + Math.cos(a) * K.dist + Math.sin(K.t * 0.7) * 2.5, z = p.z + Math.sin(a) * K.dist + Math.cos(K.t * 0.5) * 1.5;
      const y = p.y + 1.4 + K.alt + Math.sin(K.t * 1.3) * 1.2;
      K.mesh.position.set(x, y, z);
      K.mesh.lookAt(p.x, p.y + 1, p.z);
      K.mesh.rotateZ(Math.sin(K.t * 2) * 0.35);
      K.mesh.userData.cola.children.forEach((l, i) => { l.position.x = Math.sin(K.t * 4 + i * 0.7) * 0.15 * i; });
      // la cuerda con su panza
      const pos = K.linea.geometry.attributes.position;
      const hx = p.x, hy = p.y + 1.3, hz = p.z;
      for (let i = 0; i < 12; i++) {
        const f = i / 11;
        pos.setXYZ(i, hx + (x - hx) * f, hy + (y - hy) * f - Math.sin(f * Math.PI) * K.dist * 0.12, hz + (z - hz) * f);
      }
      pos.needsUpdate = true;
      if (K.alt > 20) g.achieve('papalote', 'Papalote en las nubes');
      // con tormenta… el rayo busca la cuerda
      if (lluvia && W.type === 'storm' && Math.random() < dt * 0.05) {
        if (g.weather) g.weather.flash = 1;
        g.audio.play('trueno', { ui: true, vol: 1 });
        g.damagePlayer(4, null, null, 'Le cayó un rayo al papalote', true);
        g.addEffect('mareo', 4);
        g.ui.toast('⚡ ¡Le cayó un rayo al papalote! Se le pararon todos los pelos', 3000);
        g.achieve('papalote_rayo', 'Inventor de la electricidad');
        recoger(g, null);
      } else if (lluvia && K.alt < 5 && !K.mojado) { K.mojado = true; g.ui.toast('🪁 Con la lluvia, el papalote se mojó y no sube', 1800); }
    }
  }
  // ---- trompos bailando ----
  if (g.trompos && g.trompos.length) {
    g.trompos = g.trompos.filter((T) => {
      T.t += dt;
      const resto = Math.max(0, 1 - T.t / T.dur);
      if (T.caido == null) T.mesh.rotation.y += dt * (8 + 30 * resto);
      const tambaleo = (1 - resto) * 0.5;
      if (T.caido == null) { T.mesh.rotation.x = Math.sin(T.t * 6) * tambaleo; T.mesh.rotation.z = Math.cos(T.t * 6) * tambaleo; }
      T.mesh.position.x = T.x + Math.sin(T.t * 1.7) * 0.2 * (1 - resto); T.mesh.position.z = T.z + Math.cos(T.t * 1.3) * 0.2 * (1 - resto);
      if (Math.random() < dt * 6 * resto) g.particles.spawn(T.mesh.position.x, T.y + 0.05, T.mesh.position.z, [0.6, 0.5, 0.4], (Math.random() - 0.5) * 1.5, 0.3, (Math.random() - 0.5) * 1.5, 0.4, 2);
      if (T.t >= T.dur && T.caido == null) { T.caido = 0; T.ladoX = Math.random() < 0.5 ? -1 : 1; }
      if (T.caido != null) {
        // se ladea, se cae y rebota un poquito antes de quedar quieto
        T.caido += dt;
        const c = Math.min(1, T.caido / 0.35);
        T.mesh.rotation.z = T.ladoX * (Math.PI / 2) * (c < 1 ? c * c : 1 - Math.sin(Math.min(1, (T.caido - 0.35) / 0.2) * Math.PI) * 0.08);
        T.mesh.rotation.x = 0; T.mesh.position.y = T.y - 0.05 * c;
        if (T.caido < 0.6) return true;
        g.scene.remove(T.mesh);
        g.entities.dropItem(TROMPO, 1, T.x, T.y + 0.3, T.z);
        g.audio.play('soltar', { pos: { x: T.x, y: T.y, z: T.z }, vol: 0.5 });
        if (T.dur > 13) { g.ui.toast(`🌀 ¡El trompo bailó ${T.dur.toFixed(0)} segundos! Trompo bailarín`, 2200); g.achieve('trompo_bailarin', 'Trompo bailarín'); }
        else g.ui.toast(`🌀 El trompo bailó ${T.dur.toFixed(0)} segundos`, 1400);
        return false;
      }
      return true;
    });
  }
}

// ---------- el trompo ----------
function hacerTrompo() {
  const g = new THREE.Group();
  const madera = new THREE.MeshBasicMaterial({ color: 0xc87a3a });
  const cono = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.24, 8), madera);
  cono.rotation.x = Math.PI; cono.position.y = 0.14;
  g.add(cono);
  const tapa = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.08, 8), new THREE.MeshBasicMaterial({ color: 0xd83030 }));
  tapa.position.y = 0.3;
  g.add(tapa);
  const raya = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.025, 8), new THREE.MeshBasicMaterial({ color: 0x2a6ad8 }));
  raya.position.y = 0.22;
  g.add(raya);
  const punta = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.06, 4), new THREE.MeshBasicMaterial({ color: 0x777777 }));
  punta.position.y = 0.0;
  g.add(punta);
  return g;
}
export function tirarTrompo(g) {
  const t = g.target;
  if (!t) { g.ui.toast('Apunte al piso para tirar el trompo', 1200); return false; }
  const w = g.world;
  // la celda libre junto a donde apunta, y de ahí hasta el piso
  // si apunta a zacate o a una planta, el trompo cae ahí mismo; si no, en la celda libre de al lado
  const planta = !SOLID[w.getBlock(t.x, t.y, t.z)];
  const cx = planta ? t.x : t.x + (t.nx || 0), cz = planta ? t.z : t.z + (t.nz || 0);
  let cy = planta ? t.y : t.y + (t.ny || 0);
  for (let k = 0; k < 4 && cy > 1 && !SOLID[w.getBlock(cx, cy - 1, cz)]; k++) cy--;
  if (SOLID[w.getBlock(cx, cy, cz)] || !SOLID[w.getBlock(cx, cy - 1, cz)]) { g.ui.toast('Apunte al piso para tirar el trompo', 1200); return false; }
  const x = cx + 0.5, z = cz + 0.5, y = cy;
  const mesh = hacerTrompo();
  mesh.position.set(x, y, z);
  g.scene.add(mesh);
  const dur = 6 + Math.random() * 7 + (g.player.effects.suerte ? 3 : 0);
  (g.trompos ||= []).push({ mesh, x, y, z, t: 0, dur });
  g.audio.play('swish', { pos: { x, y, z }, vol: 0.6, pitch: 1.3 });
  g.achieve('trompo', 'A bailar el trompo');
  return true;
}
export function limpiarJuegos(g) {
  recoger(g, null);
  for (const T of g.trompos || []) g.scene.remove(T.mesh);
  g.trompos = [];
}

// ---------- chumicos con los vecinos (clic derecho con chumicos en la mano) ----------
export function chumicosInteract(m, g) {
  const held = g.inventory.held;
  if (!held || held.id !== CHUMICOS || m.data.role !== 'vecino') return false;
  if ((m.data.chumicoT || 0) > (g.clock || 0)) { decir(g, m, 'Diay, ya jugamos. Déjeme practicar un rato.', 2.5); return true; }
  m.data.chumicoT = (g.clock || 0) + 20;
  g.inventory.remove(CHUMICOS, 1);
  const suerte = g.player.effects.suerte ? 0.15 : 0;
  const gana = Math.random() < 0.5 + suerte;
  g.audio.play('click', { pos: m.soundPos(), vol: 0.8, pitch: 1.6 });
  if (gana) {
    g.giveItem(CHUMICOS, 2);
    g.meta.chumicosGanados = (g.meta.chumicosGanados || 0) + 1;
    decir(g, m, ['¡Uy, qué puntería! Se llevó mi chumico.', '¡Me dejó en cero! Revancha la otra vez.', '¡Pegó de una! Qué tirada.'][Math.floor(Math.random() * 3)], 3);
    g.ui.toast('🔵 ¡Ganó la partida de chumicos! +1 chumico', 1600);
    if (g.meta.chumicosGanados >= 10) g.achieve('rey_chumicos', 'Mandamás de los chumicos');
  } else {
    decir(g, m, ['¡Jajaja, se le fue largo! Ese chumico es mío.', 'Le faltó tantito. ¡Gracias por el chumico!', 'Mae, tire con el dedo, no con el codo.'][Math.floor(Math.random() * 3)], 3);
    g.ui.toast('🔵 Perdió la partida: el vecino se quedó con su chumico', 1600);
  }
  g.achieve('chumicos', 'Una de chumicos');
  return true;
}
