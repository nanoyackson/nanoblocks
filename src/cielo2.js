// El cielo: lluvia de estrellas fugaces (cada 6 noches; a veces cae un meteorito cerca y deja un cráter con una
// roca que brilla), la luna roja (cada cuarta luna llena: más leyendas y el doble de experiencia) y el eclipse de sol
// (de vez en cuando, de día, se oscurece un minuto).
import { BLOCK_BY_KEY as K, SOLID, AIR } from './blocks.js';

export const FRAGMENTO = 465;

function overlay(id, color) {
  let el = document.getElementById(id);
  if (!el) { el = document.createElement('div'); el.id = id; el.className = 'cielo-capa'; el.style.background = color; document.getElementById('hud').appendChild(el); }
  return el;
}

export function lunaRoja(g) { const d = g.day || 1; return d % 28 === 0 || !!g.lunaRojaPrueba; }
export function nocheEstrellas(g) { const d = g.day || 1; return d % 6 === 3; }

export function tickCielo(g, dt) {
  if (g.dim !== 'tierra') { overlay('capa-roja', 'rgba(140,0,0,0.16)').style.opacity = 0; overlay('capa-eclipse', 'rgba(0,0,20,0.62)').style.opacity = 0; return; } // contenido: tinte del cielo, no interfaz
  const noche = g.daylight < 0.3, p = g.player.body.pos;
  // ---- luna roja ----
  const roja = noche && lunaRoja(g);
  overlay('capa-roja', 'rgba(140,0,0,0.16)').style.opacity = roja ? 1 : 0; // contenido: tinte del cielo, no interfaz
  if (roja && g.meta.lunaRojaAviso !== g.day) { g.meta.lunaRojaAviso = g.day; g.ui.toast('🌕🩸 ¡Luna roja! Más leyendas, Sombras por oleadas y doble experiencia', 4600); g.achieve('luna_roja', 'Bajo la luna roja'); }
  g.lunaRoja = roja;
  if (roja) g.legendCd = Math.min(g.legendCd ?? 60, 20);
  // ---- estrellas fugaces ----
  if (noche && nocheEstrellas(g)) {
    if (g.meta.estrellasAviso !== g.day) { g.meta.estrellasAviso = g.day; g.ui.toast('🌠 ¡Lluvia de estrellas fugaces! Mire para arriba', 3200); }
    g.fugazT = (g.fugazT ?? 1) - dt;
    if (g.fugazT <= 0) {
      g.fugazT = 1.5 + Math.random() * 3;
      const a = Math.random() * Math.PI * 2, x0 = p.x + Math.cos(a) * 60, z0 = p.z + Math.sin(a) * 60, y0 = p.y + 70 + Math.random() * 20;
      const dx = Math.cos(a + 2.2) * 2.4, dz = Math.sin(a + 2.2) * 2.4;
      for (let k = 0; k < 18; k++) g.particles.spawn(x0 + dx * k, y0 - k * 0.9, z0 + dz * k, [1, 1, 0.9 - k * 0.03], dx * 4, -3, dz * 4, 0.35 + k * 0.02, 0, true);
      if (Math.random() < 0.08) g.achieve('fugaz', 'Pedí un deseo');
    }
    // a veces cae un meteorito cerquita
    g.meteoroCd = (g.meteoroCd ?? 40) - dt;
    if (g.meteoroCd <= 0) { g.meteoroCd = 90 + Math.random() * 120; if (Math.random() < 0.5) meteorito(g); }
  }
  // ---- eclipse de sol ----
  const E = g.eclipse;
  if (!E && g.daylight > 0.8 && (g.day || 1) >= 5 && (g.meta.eclipseCd ?? 5) <= (g.day || 1) && Math.random() < dt * 0.002) {
    g.eclipse = { t: 0, dur: 70 };
    g.meta.eclipseCd = (g.day || 1) + 12 + Math.floor(Math.random() * 10);
    g.ui.toast('🌑 ¡Eclipse de sol! El día se pone oscuro un ratito (no vea el sol directo)', 3800);
    g.achieve('eclipse', 'Vi el eclipse');
  }
  if (g.eclipse) {
    const e = g.eclipse; e.t += dt;
    const k = Math.min(1, Math.min(e.t, e.dur - e.t) / 12);
    overlay('capa-eclipse', 'rgba(0,0,20,0.62)').style.opacity = Math.max(0, k); // contenido: tinte del cielo, no interfaz
    if (e.t >= e.dur) { g.eclipse = null; overlay('capa-eclipse', 'rgba(0,0,20,0.62)').style.opacity = 0; g.ui.toast('🌞 Volvió el sol', 1600); } // contenido: tinte del cielo, no interfaz
  }
}

function meteorito(g) {
  const w = g.world, p = g.player.body.pos;
  const a = Math.random() * Math.PI * 2, r = 25 + Math.random() * 35;
  const x = Math.floor(p.x + Math.cos(a) * r), z = Math.floor(p.z + Math.sin(a) * r);
  if (!w.isLoaded(x, z)) return;
  let y = 140;
  while (y > 2 && !SOLID[w.getBlock(x, y, z)]) y--;
  // la estela que baja
  for (let k = 0; k < 30; k++) g.particles.spawn(x + 0.5 + k * 0.8, y + 2 + k * 2.2, z + 0.5 + k * 0.5, [1, 0.6 - k * 0.01, 0.2], -4, -10, -2.5, 0.6 + k * 0.03, 0, true);
  // cráter
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) for (let dy = -2; dy <= 3; dy++) {
    const d = Math.hypot(dx, dz, dy * 1.4);
    if (d > 3.2) continue;
    const id = w.getBlock(x + dx, y + dy, z + dz);
    if (id && id !== K.bedrock && id !== K.chest) w.setBlock(x + dx, y + dy, z + dz, AIR);
  }
  let fy = y - 2;
  while (fy > 2 && !SOLID[w.getBlock(x, fy - 1, z)]) fy--;
  w.setBlock(x, fy, z, K.meteorito);
  g.particles.burst(x + 0.5, fy + 1, z + 0.5, [[1, 0.5, 0.1], [1, 0.9, 0.4], [0.4, 0.38, 0.36]], 60, 7);
  g.audio.play('explode', { pos: { x: x + 0.5, y: fy, z: z + 0.5 }, vol: 1.2, pitch: 0.6 });
  g.shake = Math.max(g.shake || 0, 0.8);
  g.ui.toast('☄ ¡Cayó un meteorito cerca! Busque el cráter', 3000);
}

// el fragmento: un rato de suerte
export function usarFragmento(g) {
  g.addEffect('suerte', 600);
  g.ui.toast('☄ El fragmento brilla en la mano: 10 minutos de suerte', 2400);
}
