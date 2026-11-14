// Mariposas de adorno: de día, morphos azules brillantes en la selva (grandes, de vuelo lento y ondulado) y mariposas
// de colores en los potreros y el monte. Aletean de verdad (dos alas con bisagra), van de flor en flor sin rumbo fijo
// y se espantan si uno se les acerca. No son criaturas: se manejan aparte y no pesan.
import * as THREE from 'three';
import { SOLID } from './blocks.js';
import { SEA } from './worldgen.js';

const TIPOS = {
  morpho: { borde: '#101828', centro: ['#1a7aff', '#3ab8ff'], tam: 0.36, vel: 1.6 },
  amarilla: { borde: '#5a3a10', centro: ['#ffd23a', '#ffe680'], tam: 0.2, vel: 2.2 },
  naranja: { borde: '#2a1a10', centro: ['#ff7a1a', '#ffa040'], tam: 0.24, vel: 2 },
  blanca: { borde: '#8a8a8a', centro: ['#f4f4f0', '#ffffff'], tam: 0.18, vel: 2.4 },
};
const texturas = {};
function textura(tipo) {
  if (texturas[tipo]) return texturas[tipo];
  const T = TIPOS[tipo];
  const cv = document.createElement('canvas'); cv.width = 16; cv.height = 16;
  const c = cv.getContext('2d');
  c.fillStyle = T.borde; c.beginPath(); c.ellipse(8, 8, 8, 7.5, 0, 0, Math.PI * 2); c.fill();
  const gr = c.createRadialGradient(5, 8, 1, 6, 8, 8); gr.addColorStop(0, T.centro[1]); gr.addColorStop(1, T.centro[0]);
  c.fillStyle = gr; c.beginPath(); c.ellipse(7.5, 8, 6, 5.8, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#fff'; c.fillRect(12, 4, 1, 1); c.fillRect(13, 10, 1, 1);
  const tex = new THREE.CanvasTexture(cv); tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
  texturas[tipo] = tex;
  return tex;
}
function hacer(tipo) {
  const T = TIPOS[tipo];
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ map: textura(tipo), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
  const alas = [];
  for (const s of [-1, 1]) {
    const bis = new THREE.Group();
    const ala = new THREE.Mesh(new THREE.PlaneGeometry(T.tam, T.tam * 1.1), mat);
    ala.rotation.x = -Math.PI / 2;
    ala.position.x = s * T.tam / 2;
    if (s < 0) ala.scale.x = -1;
    bis.add(ala); g.add(bis); alas.push({ bis, s });
  }
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, T.tam * 0.9), new THREE.MeshBasicMaterial({ color: 0x1a1410 }));
  g.add(cuerpo);
  g.userData.alas = alas;
  return g;
}

export function tickMariposas(g, dt) {
  const M = (g.mariposas ||= []);
  const p = g.player.body.pos;
  const bio = g.env && g.env.biome;
  const dia = g.daylight > 0.5 && g.dim === 'tierra' && !(g.weather && g.weather.intensity > 0.5);
  const quiere = !dia ? 0 : bio === 'jungle' || bio === 'manglar' ? 9 : ['plains', 'forest', 'bosque_seco', 'nuboso'].includes(bio) ? 6 : 0;
  // aparecen lejitos y se acercan; se van subiendo cuando ya no toca
  if (M.length < quiere && Math.random() < dt * 2) {
    const tipo = bio === 'jungle' || bio === 'manglar' ? (Math.random() < 0.65 ? 'morpho' : 'amarilla') : ['amarilla', 'naranja', 'blanca'][Math.floor(Math.random() * 3)];
    const a = Math.random() * Math.PI * 2, r = 10 + Math.random() * 10;
    const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
    const h = Math.max(SEA + 1, g.world.gen.column(Math.floor(x), Math.floor(z)).h);
    const mesh = hacer(tipo);
    mesh.position.set(x, h + 1.5 + Math.random() * 2, z);
    g.scene.add(mesh);
    M.push({ mesh, tipo, t: Math.random() * 10, vx: 0, vz: 0, vy: 0, dir: Math.random() * Math.PI * 2, vida: 30 + Math.random() * 40 });
  }
  for (let i = M.length - 1; i >= 0; i--) {
    const b = M[i], T = TIPOS[b.tipo], o = b.mesh.position;
    b.t += dt; b.vida -= dt;
    const d = Math.hypot(o.x - p.x, o.z - p.z);
    // rumbo que cambia de a poquito (vuelo errático) y huir del jugador
    b.dir += (Math.sin(b.t * 0.9 + i) * 1.6 + (Math.random() - 0.5) * 2) * dt;
    let vel = T.vel;
    if (d < 2.2) { b.dir = Math.atan2(o.z - p.z, o.x - p.x); vel *= 2.2; }
    const suelo = Math.max(SEA + 1, g.world.gen.column(Math.floor(o.x), Math.floor(o.z)).h);
    const alto = o.y - suelo;
    const meta = !quiere || b.vida < 0 ? 12 : 1.6 + Math.sin(b.t * 0.7 + i) * 0.8;
    b.vx += (Math.cos(b.dir) * vel - b.vx) * Math.min(1, dt * 2);
    b.vz += (Math.sin(b.dir) * vel - b.vz) * Math.min(1, dt * 2);
    b.vy += ((meta - alto) * 0.8 + Math.sin(b.t * 7) * 1.2 - b.vy) * Math.min(1, dt * 3);
    const nx = o.x + b.vx * dt, nz = o.z + b.vz * dt, ny = o.y + b.vy * dt;
    if (SOLID[g.world.getBlock(Math.floor(nx), Math.floor(ny), Math.floor(nz))]) { b.dir += Math.PI * 0.7; b.vy = 1.5; } else o.set(nx, ny, nz);
    // aleteo: rápido y con pausas de planeo (los morphos aletean lento y amplio)
    const fr = b.tipo === 'morpho' ? 9 : 16;
    const aleteo = (Math.sin(b.t * fr) * 0.5 + 0.5) * (b.tipo === 'morpho' ? 1.3 : 1.1);
    for (const w of b.mesh.userData.alas) w.bis.rotation.z = w.s * (aleteo - 0.2);
    b.mesh.rotation.y = -b.dir + Math.PI / 2;
    b.mesh.rotation.x = -b.vy * 0.06;
    if (b.tipo === 'morpho' && d < 6) g.achieve('morpho', 'Morpho azul');
    if (((b.vida < 0 || !quiere) && alto > 10) || d > 50) { g.scene.remove(b.mesh); M.splice(i, 1); }
  }
}
export function limpiarMariposas(g) { for (const b of g.mariposas || []) g.scene.remove(b.mesh); g.mariposas = []; }
