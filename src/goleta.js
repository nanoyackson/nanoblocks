// La goleta fantasma: algunas noches, mar adentro, sale de la neblina una goleta vieja con las velas hechas jirones y faroles
// verdes. Da vueltas alrededor de uno tirando cañonazos y manda a su tripulación de ánimas marineras, que vienen volando sobre el
// agua. Cuando caen seis, sale el capitán. Si se le gana, la goleta se hunde de proa y deja lo que traía. Si uno llega a tierra,
// se aleja mucho o amanece, se pierde otra vez en la neblina. Estado: g.goleta (no se guarda), meta.goletaCd (día), meta.goletas.
import { atacar, avisoCaida } from './golpes.js';
import * as THREE from 'three';
import { armarMarinero } from './modelos-mar.js';
import { SEA } from './worldgen.js';
import { SOLID, AIR } from './blocks.js';
import { disposeModel } from './models.js';
import { difOf } from './supervivencia.js';
import { anotar } from './diario.js';

export const FAROL_GOLETA = 530;
const COLON = 360, RADIO = 26, TRIPULACION = 6, BOTIN = [[COLON, 120], [259, 6], [369, 4], [260, 2], [FAROL_GOLETA, 1]];
const mb = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: o > 0.8, side: THREE.DoubleSide, fog: false, toneMapped: false }); // sin niebla ni exposición: de noche se ve como aparición
function pieza(grupo, w, h, d, c, o, x, y, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mb(c, o)); m.position.set(x, y, z); m.userData.op = o; grupo.add(m); return m; }

// ---------- el barco ----------
function barco() {
  const g = new THREE.Group();
  const casco = 0x2e4a40, tabla = 0x3e5a4c, borde = 0x22362e;
  // el casco: más angosto en la proa y en la popa
  for (let i = 0; i < 9; i++) {
    const z = -8 + i * 2, w = 4.6 - Math.abs(i - 4) * (i > 4 ? 0.55 : 0.3);
    pieza(g, w, 2.6, 2.05, casco, 0.9, 0, 0.3, z);
    pieza(g, w + 0.2, 0.3, 2.05, borde, 0.92, 0, 1.75, z); // la borda
  }
  pieza(g, 4, 0.12, 15, tabla, 0.9, 0, 1.6, 0); // la cubierta
  pieza(g, 0.4, 0.4, 5, borde, 0.9, 0, 1.9, 11); // el bauprés
  g.children[g.children.length - 1].rotation.x = -0.35;
  // la toldilla de popa, con su ventana
  pieza(g, 4, 1.6, 3.2, casco, 0.9, 0, 2.4, -7);
  pieza(g, 2.6, 0.6, 0.05, 0x9aff9a, 1, 0, 2.5, -8.62);
  // los mástiles y las velas en jirones (cada vela, una cuadrícula a la que le faltan pedazos)
  const velas = [];
  for (const [z, alto] of [[3, 12], [-3, 10]]) {
    pieza(g, 0.35, alto, 0.35, borde, 0.95, 0, 1.6 + alto / 2, z);
    pieza(g, 5.5, 0.2, 0.2, borde, 0.9, 0, 1.6 + alto - 0.6, z); // la verga
    const vela = new THREE.Group(); vela.position.set(0, 1.6 + alto - 0.8, z + 0.15); vela.rotation.y = z > 0 ? 0.6 : -0.5; g.add(vela); velas.push(vela); // braceadas, para que se vean de lado
    for (let fx = 0; fx < 5; fx++) for (let fy = 0; fy < 6; fy++) {
      if (Math.random() < 0.22 || (fy === 5 && Math.random() < 0.5)) continue; // los agujeros
      pieza(vela, 1.05, 1.15, 0.04, Math.random() < 0.3 ? 0xb8d8c4 : 0xdcf0e2, 0.72, -2.1 + fx * 1.05, -0.6 - fy * 1.15, 0);
    }
  }
  // el foque: vela triangular entre el bauprés y el palo de proa (esta sí se ve de costado)
  for (let fy = 0; fy < 7; fy++) for (let fz = 0; fz <= 6 - fy; fz++) {
    if (Math.random() < 0.18) continue;
    pieza(g, 0.04, 1.05, 1.05, Math.random() < 0.3 ? 0xb8d8c4 : 0xdcf0e2, 0.72, 0, 2.6 + fy * 1.05, 4 + fz * 1.05 + fy * 0.2);
  }
  // la bandera rota y los faroles verdes
  const bandera = new THREE.Group(); bandera.position.set(0, 14.2, 3); g.add(bandera);
  pieza(bandera, 0.04, 0.9, 1.4, 0x101210, 0.9, 0, 0, -0.75);
  const faroles = [];
  for (const [x, y, z] of [[2.3, 2.3, 6], [-2.3, 2.3, 6], [2.3, 2.3, -2], [-2.3, 2.3, -2], [0, 3.6, -7], [0, 7.5, 3], [0, 2.4, 9.5]]) {
    faroles.push(pieza(g, 0.35, 0.45, 0.35, 0x7aff9a, 1, x, y, z));
    // el halo verde alrededor de cada farol
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo(), color: 0x7aff9a, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    h.position.set(x, y, z); h.scale.set(3.2, 3.2, 1); h.userData.op = 0.7; g.add(h);
  }
  g.userData = { velas, bandera, faroles };
  return g;
}
function opacidad(grupo, k) { grupo.traverse((o) => { if (o.isMesh || o.isSprite) o.material.opacity = o.userData.op * k; }); }
let haloTex = null;
function halo() {
  if (haloTex) return haloTex;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 2, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  haloTex = new THREE.CanvasTexture(c);
  return haloTex;
}

// ---------- los cañonazos ----------
class Bala {
  constructor(g, x, y, z, v) {
    this.g = g; this.pos = { x, y, z }; this.vel = v; this.life = 0; this.dead = false;
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshBasicMaterial({ color: 0x1a1a1a }));
    g.scene.add(this.mesh);
  }
  update(dt) {
    const g = this.g, p = this.pos, v = this.vel;
    this.life += dt; v.y -= 14 * dt;
    p.x += v.x * dt; p.y += v.y * dt; p.z += v.z * dt;
    this.mesh.position.set(p.x, p.y, p.z); this.mesh.rotation.x += dt * 5;
    if (Math.random() < dt * 30) g.particles.spawn(p.x, p.y, p.z, [0.5, 1, 0.6], 0, 0.2, 0, 0.5, 0);
    const pl = g.player.body.pos;
    if (Math.hypot(p.x - pl.x, p.z - pl.z) < 0.9 && p.y > pl.y - 0.3 && p.y < pl.y + 2.1) {
      g.damagePlayer(4, p.x - v.x, p.z - v.z, 'Cañonazo de la goleta fantasma', false, true);
      this.estalla(); return;
    }
    const bq = g.world.getBlock(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z));
    if (p.y < SEA + 0.6 && bq !== AIR && !SOLID[bq]) { // al agua
      g.particles.burst(p.x, SEA + 1, p.z, [[0.85, 0.95, 1], [0.6, 0.8, 0.9]], 18, 2.5);
      g.audio.play('splash', { pos: p, vol: 0.9, pitch: 0.7 });
      this.dead = true; return;
    }
    if (SOLID[bq] || this.life > 6) this.estalla();
  }
  estalla() {
    const g = this.g, p = this.pos;
    g.particles.burst(p.x, p.y, p.z, [[0.4, 0.9, 0.5], [0.2, 0.2, 0.2]], 14, 2);
    g.audio.play('explode', { pos: p, vol: 0.6, pitch: 1.3 });
    this.dead = true;
  }
  remove() { this.g.scene.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
}

// ¿mar adentro de verdad? (hondo aquí y alrededor)
function altamar(g) {
  const p = g.player.body.pos, col = (x, z) => g.world.gen.column(Math.floor(x), Math.floor(z));
  if (col(p.x, p.z).biome !== 'ocean' || col(p.x, p.z).h > SEA - 6) return false;
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; if (col(p.x + Math.cos(a) * 34, p.z + Math.sin(a) * 34).h > SEA - 4) return false; }
  return true;
}
function aparecer(g) {
  const p = g.player.body.pos, a = Math.random() * Math.PI * 2;
  const grupo = barco(); opacidad(grupo, 0); g.scene.add(grupo);
  g.goleta = { grupo, cx: p.x, cz: p.z, ang: a, fase: 'llega', k: 0, t: 0, canon: 5, manda: 4, muertos: 0, capitan: null, mobs: [], balas: [], lejos: 0 };
  g.audio.play('campana', { ui: true, vol: 0.5, pitch: 0.6 });
  g.audio.play('creak', { ui: true, vol: 0.9, pitch: 0.7 });
  g.ui.toast('🏴 Entre la neblina sale una goleta de faroles verdes… ¡y viene hacia usted!', 5200);
}
export function limpiarGoleta(g) {
  const G = g.goleta;
  if (!G) return;
  g.scene.remove(G.grupo); disposeModel(G.grupo);
  G.grupo.traverse((o) => { if (o.isSprite) o.material.dispose(); }); // los halos (la textura es una sola, compartida)
  for (const b of G.balas) b.remove();
  for (const m of G.mobs) if (!m.dead) { m.data.despedido = true; m.dead = true; }
  g.audio.setEmitter('goleta', null, null);
  g.goleta = null;
}
// cada segundo: ¿sale la goleta?
export function tickGoleta(g) {
  if (g.goleta || g.dim !== 'tierra' || g.mode !== 'survival' || !g.meta || !g.player.alive) return;
  const M = g.meta, d = g.day || 1;
  if (d < 4 || (M.goletaCd || 0) > d || g.daylight > 0.2 || !g.settings.hostiles || !difOf(g).hostiles || Math.random() > 1 / 200 || !altamar(g)) return;
  M.goletaCd = d + 4;
  aparecer(g);
}
const posBarco = (G) => ({ x: G.cx + Math.cos(G.ang) * RADIO, z: G.cz + Math.sin(G.ang) * RADIO });
// cada cuadro
export function cuadroGoleta(g, dt) {
  const G = g.goleta;
  if (!G) return;
  if (g.dim !== 'tierra') { limpiarGoleta(g); return; }
  const P = g.player, p = P.body.pos, t = (G.t += dt);
  G.balas = G.balas.filter((b) => { b.update(dt); if (b.dead) { b.remove(); return false; } return true; });
  // las bajas, las haga quien las haga (uno, la dinamita, el peón, el Cadejos)
  for (const m of G.mobs) {
    if (!(m.dead || m.dying) || m.data.contado) continue;
    m.data.contado = true;
    if (m.data.despedido) continue;
    if (m.type === 'anima_marinera') G.muertos++;
    else if (m.type === 'capitan_goleta') hundir(g);
  }
  if (!g.goleta) return;
  G.mobs = G.mobs.filter((m) => !m.dead);
  // el centro de la vuelta sigue a uno, despacio
  G.cx += (p.x - G.cx) * Math.min(1, dt * 0.15); G.cz += (p.z - G.cz) * Math.min(1, dt * 0.15);
  const B = G.grupo, u = B.userData;
  if (G.fase === 'hunde') {
    G.k = Math.max(0, G.k - dt * 0.12);
    B.position.y -= dt * 1.2; B.rotation.x += dt * 0.09; B.rotation.z += dt * 0.03;
    if (Math.random() < dt * 20) { const q = posBarco(G); g.particles.spawn(q.x + (Math.random() - 0.5) * 8, SEA + 1, q.z + (Math.random() - 0.5) * 8, [0.7, 1, 0.8], 0, 2, 0, 1, 2); }
    opacidad(B, G.k);
    if (G.k <= 0) limpiarGoleta(g);
    return;
  }
  // se va: tierra, muy lejos o amanecer
  const enTierra = !P.body.inWater && g.world.gen.column(Math.floor(p.x), Math.floor(p.z)).h >= SEA - 1; // a pie, a caballo o en un bote varado
  G.lejos = enTierra || Math.hypot(p.x - G.cx, p.z - G.cz) > 80 ? G.lejos + dt : 0;
  if (G.fase !== 'se_va' && (G.lejos > 8 || g.daylight > 0.4 || !P.alive || !g.settings.hostiles || !difOf(g).hostiles || g.mode !== 'survival')) {
    G.fase = 'se_va';
    for (const m of G.mobs) { m.data.despedido = true; m.dead = true; }
    if (P.alive) g.ui.toast('🏴 La goleta se pierde otra vez en la neblina, con sus faroles verdes…', 3600);
  }
  if (G.fase === 'se_va') { G.k = Math.max(0, G.k - dt * 0.3); opacidad(B, G.k); if (G.k <= 0) limpiarGoleta(g); return; }
  if (G.fase === 'llega') { G.k = Math.min(1, G.k + dt * 0.25); opacidad(B, G.k); if (G.k >= 1) G.fase = 'pelea'; }
  // da vueltas alrededor, con la banda hacia uno
  G.ang += dt * 0.045;
  const q = posBarco(G);
  B.position.set(q.x, SEA - 0.4 + Math.sin(t * 0.9) * 0.25, q.z);
  B.rotation.set(Math.sin(t * 0.7) * 0.03, -G.ang, Math.sin(t * 0.9) * 0.05);
  u.velas.forEach((v, i) => { v.rotation.x = Math.sin(t * 1.3 + i) * 0.08; });
  u.bandera.rotation.y = Math.sin(t * 3) * 0.4;
  if (Math.random() < dt * 6) { const f = u.faroles[Math.floor(Math.random() * u.faroles.length)], w = f.getWorldPosition(new THREE.Vector3()); g.particles.spawn(w.x, w.y, w.z, [0.5, 1, 0.6], 0, 0.6, 0, 1.2, -0.2); }
  g.audio.setEmitter('goleta', 'loop.waves', { x: q.x, y: SEA + 1, z: q.z }, 0.8);
  if (G.fase !== 'pelea') return;
  // los cañonazos: tiro con caída, a donde está uno (con su poquito de error)
  G.canon -= dt;
  if (G.canon <= 0) {
    G.canon = G.capitan ? 3.2 : 4.5;
    const T = 2.2, ox = q.x + (Math.random() - 0.5) * 6, oz = q.z + (Math.random() - 0.5) * 6, oy = SEA + 2.4;
    const tx = p.x + P.body.vel.x * T * 0.6 + (Math.random() - 0.5) * 2.5, tz = p.z + P.body.vel.z * T * 0.6 + (Math.random() - 0.5) * 2.5, ty = p.y + 1;
    G.balas.push(new Bala(g, ox, oy, oz, { x: (tx - ox) / T, y: (ty - oy + 7 * T * T) / T, z: (tz - oz) / T }));
    avisoCaida(g, tx, ty - 1, tz, 1.3, T);
    g.particles.burst(ox, oy, oz, [[1, 0.9, 0.5], [0.4, 0.4, 0.4]], 12, 2);
    g.audio.play('explode', { pos: { x: ox, y: oy, z: oz }, vol: 0.9, pitch: 0.65 });
  }
  // la tripulación sale volando del barco
  G.manda -= dt;
  const vivos = G.mobs.filter((m) => m.type === 'anima_marinera').length;
  if (G.manda <= 0 && vivos < 3 && G.muertos + vivos < TRIPULACION) {
    G.manda = 5;
    const m = g.entities.spawnMob('anima_marinera', q.x, SEA + 3.5, q.z);
    if (m) G.mobs.push(m);
  }
  if (!G.capitan && G.muertos >= TRIPULACION) {
    G.capitan = g.entities.spawnMob('capitan_goleta', q.x, SEA + 4, q.z);
    if (G.capitan) { G.mobs.push(G.capitan); g.audio.play('campana', { ui: true, vol: 0.8, pitch: 0.5 }); g.ui.toast('🏴 ¡Sale el capitán de la goleta, con su farol verde! Si cae él, se hunde el barco', 4200); }
  }
}
// cuando cae el capitán: se hunde, y lo que traía le queda a uno
function hundir(g) {
  const G = g.goleta;
  if (!G || G.fase === 'hunde') return;
  G.fase = 'hunde';
  for (const m of G.mobs) if (!m.dead) { m.data.despedido = true; m.dead = true; }
  for (const [id, n] of BOTIN) g.giveItem(id, n);
  g.audio.play('derrumbe', { ui: true, vol: 0.9, pitch: 0.7, sub: true });
  g.audio.play('aplausos', { ui: true, vol: 0.3 });
  g.ui.toast('🏴 ¡La goleta se hunde! Quedó flotando el cofre del capitán: ₡120, oro y perlas', 5200);
  g.achieve('goleta', 'Hundí la goleta fantasma');
  g.meta.goletas = (g.meta.goletas || 0) + 1;
  anotar(g, 'Una goleta fantasma me atacó mar adentro. Se la hundí.', '🏴');
}
export function marcaGoleta(g) { const G = g.goleta; return G && g.dim === 'tierra' && G.fase !== 'hunde' ? posBarco(G) : null; }

// ---------- la tripulación ----------
// sobrevuelan el agua a la altura de uno, con el machete oxidado
function cerebroAnima(m, dt, c, fuerza) {
  const { g, distP, dxp, dzp, pl } = c;
  m.noGravity = true; m.data.apuro = true;
  if (!g.goleta || g.goleta.fase !== 'pelea') { g.particles.burst(m.body.pos.x, m.body.pos.y + 1, m.body.pos.z, m.kind.particle, 12, 1.2); m.data.despedido = true; m.dead = true; return true; }
  const b = m.body;
  b.vel.y = ((pl.y + 0.3 + Math.sin(m.t * 2) * 0.2) - b.pos.y) * 2;
  if (g.mode !== 'survival' || !g.player.alive) return true;
  m.targetYaw = Math.atan2(dxp, dzp); m.goTo(pl.x, pl.z, 1);
  if (distP < 1.6 && m.attackCd <= 0) atacar(m, g, { dano: fuerza, causa: `${m.kind.name}: machetazo`, alcance: 1.6, cd: 1.5, alSoltar: () => g.audio.play('tajo', { pos: m.soundPos(), vol: 0.8 }), alGolpe: (llego) => { if (llego) g.addEffect('escalofrio', 6); } });
  return true;
}
const animar = (m, dt, u) => {
  m.data.tajo = Math.max(0, (m.data.tajo || 0) - dt);
  u.brazos[0].rotation.x = Math.sin(m.t * 2) * 0.2;
  u.brazos[1].rotation.x = -0.4 - m.data.tajo * 5;
  u.body.rotation.z = Math.sin(m.t * 1.5) * 0.07;
  if (Math.random() < dt * 10) { const b = m.body.pos; m.game.particles.spawn(b.x + (Math.random() - 0.5) * 0.5, b.y + 0.3, b.z + (Math.random() - 0.5) * 0.5, [0.6, 0.95, 0.7], 0, -0.3, 0, 1, -0.3); }
};
export const GOLETA = {
  anima_marinera: {
    name: 'Ánima marinera', w: 0.6, h: 1.7, health: 12, speed: 2.4, hostile: true, attack: 2, hurtSound: 'susurro', idleSound: 'susurro', idleEvery: [5, 9],
    particle: [[0.6, 0.95, 0.7], [0.4, 0.6, 0.5]], drops: [], xp: 8,
    build: () => armarMarinero(false),
    brain: (m, dt, c) => cerebroAnima(m, dt, c, 2),
    animate: animar,
  },
  capitan_goleta: {
    name: 'El capitán de la goleta', w: 0.8, h: 2.2, health: 80, speed: 2.2, hostile: true, attack: 4, boss: true, hurtSound: 'susurro', idleSound: 'cadenas', idleEvery: [4, 8],
    particle: [[0.6, 0.95, 0.7], [0.3, 0.35, 0.3]], drops: [], xp: 60,
    build: () => armarMarinero(true),
    brain(m, dt, c) {
      // a media vida llama a dos marineros más
      if (!m.data.llamo && m.health < m.kind.health / 2 && c.g.goleta) {
        m.data.llamo = true;
        for (let i = 0; i < 2; i++) { const a = c.g.entities.spawnMob('anima_marinera', m.body.pos.x + (i ? 2 : -2), m.body.pos.y + 1, m.body.pos.z); if (a) c.g.goleta.mobs.push(a); }
        c.g.ui.toast('🏴 «¡A mí, muchachos!» — el capitán llama a su gente', 2600);
      }
      return cerebroAnima(m, dt, c, 4);
    },
    animate: animar,
    alMorir(m, g) { hundir(g); },
  },
};
export function pruebaGoleta(g) {
  limpiarGoleta(g);
  aparecer(g);
  return altamar(g) ? 'La goleta fantasma sale de la neblina' : 'La goleta sale aquí aunque no sea mar adentro (en el juego, solo sale de noche en altamar)';
}
