// Más fauna: el mapache ladrón (de noche se acerca si uno anda comida, le roba algo y sale corriendo; si lo alcanza
// y le pega, suelta lo robado) y los zopilotes que dan vueltas en el cielo donde murió algo… o sobre uno, si anda
// muy golpeado.
import * as THREE from 'three';
import { armarMapache } from './modelos-finales.js';
import { SOLID, AIR, ITEMS } from './blocks.js';

// ===== el mapache =====
export const MAPACHE = {
  name: 'Mapache', w: 0.45, h: 0.45, health: 8, speed: 2.8, hurtSound: 'zorro_pelon', idleSound: null,
  particle: [[0.5, 0.5, 0.52]], drops: [],
  build() { return armarMapache(); },
  brain(m, dt, c) {
    const { g, distP, dxp, dzp } = c;
    const d = m.data;
    m.group.userData.botin.visible = !!d.robo;
    // ya robó: sale corriendo
    if (d.robo || m.panic > 0) { m.goTo(m.body.pos.x - dxp * 3, m.body.pos.z - dzp * 3, 1.9); return true; }
    if (g.mode !== 'survival' || !g.player.alive) return false;
    const comida = g.inventory.slots.some((s, i) => s && i >= 9 && ITEMS[s.id] && ITEMS[s.id].food);
    if (!comida || distP > 14) return false;
    // se acerca de puntillas
    m.goTo(g.player.body.pos.x, g.player.body.pos.z, distP < 4 ? 0.6 : 1);
    if (distP < 1.3) robar(m, g);
    return true;
  },
  animate(m, dt, u) { u.tail.rotation.y = Math.sin(m.t * 3) * 0.3; },
  onHurt(m, g, dmg) {
    const d = m.data;
    if (d.robo) {
      g.entities.dropItem(d.robo.id, d.robo.n, m.body.pos.x, m.body.pos.y + 0.5, m.body.pos.z);
      g.ui.toast('🦝 ¡El mapache soltó lo que se había robado!', 1800);
      g.achieve('mapache_recupera', 'Devuélvame eso, mapache');
      d.robo = null;
    }
    m.panic = 6;
    return dmg > 0;
  },
};
function robar(m, g) {
  const inv = g.inventory.slots;
  const opciones = [];
  for (let i = 9; i < inv.length; i++) if (inv[i] && ITEMS[inv[i].id] && ITEMS[inv[i].id].food) opciones.push(i);
  if (!opciones.length) return;
  const i = opciones[Math.floor(Math.random() * opciones.length)];
  const s = inv[i];
  const n = Math.min(s.count, 1 + Math.floor(Math.random() * 2));
  g.inventory.remove(s.id, n);
  m.data.robo = { id: s.id, n };
  m.panic = 12;
  g.audio.play('recoger', { pos: m.soundPos(), vol: 0.7, pitch: 1.3 });
  g.ui.toast(`🦝 ¡Un mapache le metió la mano a la mochila y se llevó: ${ITEMS[s.id].name} ×${n}! (péguele para que lo suelte)`, 2800);
  g.achieve('mapache', 'Me robó un mapache');
}

export function mapacheSpawn(E, g) {
  if (g.dim !== 'tierra' || g.daylight > 0.3 || g.mode !== 'survival') return false;
  if (E.mobs.some((m) => m.type === 'mapache' && !m.dead) || Math.random() > 0.04) return false;
  const w = g.world, p = g.player.body.pos;
  const a = Math.random() * Math.PI * 2, r = 14 + Math.random() * 8;
  const x = Math.floor(p.x + Math.cos(a) * r), z = Math.floor(p.z + Math.sin(a) * r);
  if (!w.isLoaded(x, z)) return false;
  const col = w.gen.column(x, z);
  if (!['forest', 'plains', 'jungle', 'beach', 'manglar', 'bosque_seco'].includes(col.biome)) return false;
  let y = Math.floor(p.y) + 6;
  while (y > 1 && !SOLID[w.getBlock(x, y - 1, z)]) y--;
  if (w.getBlock(x, y, z) !== AIR) return false;
  E.spawnMob('mapache', x + 0.5, y + 0.1, z + 0.5);
  return true;
}

// ===== los zopilotes (solo de adorno: vuelan en círculo) =====
function hacerZopilote() {
  const g = new THREE.Group();
  const negro = new THREE.MeshBasicMaterial({ color: 0x141214 });
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.7), negro);
  g.add(cuerpo);
  const cabeza = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.16), new THREE.MeshBasicMaterial({ color: 0x3a3a3c }));
  cabeza.position.set(0, 0.06, 0.42);
  g.add(cabeza);
  const alas = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(s * 0.15, 0.05, 0);
    const ala = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.5), negro);
    ala.position.x = s * 0.55;
    const punta = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.4), new THREE.MeshBasicMaterial({ color: 0x8a8a88 }));
    punta.position.x = s * 0.55;
    ala.add(punta);
    piv.add(ala); g.add(piv); alas.push({ piv, s });
  }
  const cola = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.3), negro);
  cola.position.z = -0.45;
  g.add(cola);
  g.userData.alas = alas;
  return g;
}
export function carrona(g, pos) {
  if (g.dim !== 'tierra') return;
  (g.carronas ||= []).push({ x: pos.x, y: pos.y, z: pos.z, t: g.clock || 0 });
  if (g.carronas.length > 6) g.carronas.shift();
}
export function tickZopilotes(g, dt) {
  const now = g.clock || 0, p = g.player.body.pos;
  g.zopilotes ||= [];
  // ¿sobre qué dan vueltas? la carroña más cercana reciente o el jugador si está muy golpeado
  g.carronas = (g.carronas || []).filter((c) => now - c.t < 150);
  let centro = null;
  for (const c of g.carronas) if (Math.hypot(c.x - p.x, c.z - p.z) < 70) centro = c;
  const golpeado = g.mode === 'survival' && g.player.alive && g.player.health <= 4 && g.dim === 'tierra';
  if (golpeado) centro = { x: p.x, y: p.y, z: p.z, jugador: true };
  if (golpeado && !g.zopiloteAviso) { g.zopiloteAviso = true; g.ui.toast('🦅 Unos zopilotes empezaron a dar vueltas sobre usted… mala señal', 2600); g.achieve('zopilotes', 'Ya me andan esperando'); }
  if (!golpeado) g.zopiloteAviso = false;
  const quiere = centro && g.dim === 'tierra' ? 3 : 0;
  while (g.zopilotes.length < quiere) {
    const mesh = hacerZopilote();
    g.scene.add(mesh);
    const hm = 14 + Math.random() * 8;
    // empiezan muy alto y bajan en espiral
    g.zopilotes.push({ mesh, a: Math.random() * Math.PI * 2, r: 5 + Math.random() * 5, h: hm + 40, hMeta: hm, v: 0.35 + Math.random() * 0.2, t: Math.random() * 10 });
  }
  if (!centro) {
    // se van subiendo y desaparecen
    g.zopilotes = g.zopilotes.filter((z) => { z.h += dt * 6; z.mesh.position.y += dt * 6; if (z.h > 60) { g.scene.remove(z.mesh); return false; } return true; });
    return;
  }
  for (const z of g.zopilotes) {
    z.t += dt; z.a += dt * z.v;
    if (z.hMeta != null) z.h += (z.hMeta - z.h) * Math.min(1, dt * 0.6);
    const x = centro.x + Math.cos(z.a) * z.r, zz = centro.z + Math.sin(z.a) * z.r, y = centro.y + z.h + Math.sin(z.t * 0.5) * 1.5;
    z.mesh.position.set(x, y, zz);
    z.mesh.rotation.set(0, -z.a, 0);
    z.mesh.rotateZ(-0.35);
    // planean casi siempre; aletean de vez en cuando
    const aleteo = Math.sin(z.t * 0.7) > 0.85 ? Math.sin(z.t * 14) * 0.5 : 0.08;
    for (const w of z.mesh.userData.alas) w.piv.rotation.z = w.s * aleteo;
  }
}
export function limpiarZopilotes(g) { for (const z of g.zopilotes || []) g.scene.remove(z.mesh); g.zopilotes = []; g.carronas = []; }
