// Mascotas: el loro (se domestica con semillas, se para en el hombro y repite frases ticas), el perezoso que va
// colgado de la mochila (calma de vez en cuando) y el cartelito para ponerles nombre a las mascotas.
import * as THREE from 'three';
import { armarLoro } from './modelos-finales.js';
import { hearts } from './fauna.js';
import { decir } from './misiones.js';

export const CARTELITO = 462;
const NOMBRES = ['Canelo', 'Chispa', 'Pancho', 'Lola', 'Moncho', 'Tita', 'Chepe', 'Negrita', 'Macho', 'Pelusa', 'Cuyito', 'Rocky', 'Mimí', 'Toby', 'Pepita', 'Chayote'];
const FRASES = ['¡Pura vida!', '¡Upe!', '¡Diay!', '¡Mae!', '¿Quiere cacao?', '¡Tuanis!', '¡Qué chiva!', '¡Pura vida, mae!', '¡Ay, Dios mío!', '¡Hola, guapo!', '¡Arroz y frijoles!', '¡Póngase las pilas!', '¡Jale, jale!'];

// ---------- el loro ----------
export const LORO = {
  name: 'Loro de frente roja', w: 0.3, h: 0.4, health: 4, speed: 4, flying: true, hurtSound: 'lapa', idleSound: 'lapa', idleEvery: [14, 30],
  particle: [[0.2, 0.7, 0.2], [0.9, 0.2, 0.2]], drops: [],
  build() { return armarLoro(); },
  flyGoal(m, g) {
    const p = g.player.body.pos, b = m.body.pos, ck = g.clock || 0;
    if (m.tamed && !m.data.stay) {
      // sobre el hombro derecho
      const yaw = g.player.yaw;
      return { x: p.x + Math.cos(yaw) * 0.35, y: p.y + 1.45, z: p.z - Math.sin(yaw) * 0.35 };
    }
    m.data.home = m.data.home || { x: b.x, y: b.y, z: b.z };
    const H = m.data.home, a = ck * 0.4 + (m.data.ph ??= Math.random() * 6);
    return { x: H.x + Math.cos(a) * 4, y: H.y + Math.sin(a * 1.3), z: H.z + Math.sin(a) * 4 };
  },
  animate(m, dt, u) {
    const enHombro = m.tamed && !m.data.stay && Math.hypot(m.body.vel.x, m.body.vel.z) < 1.5;
    u.wings.forEach(({ p, side }) => { p.rotation.z = enHombro ? side * 0.1 : side * Math.sin(m.t * 22) * 0.8; });
    u.head.rotation.y = Math.sin(m.t * 1.3) * 0.4;
  },
  interact(m, g, held) {
    if (!m.tamed && held && (held.id === 267 || held.id === 269)) {
      if (g.mode === 'survival') g.inventory.consumeHeld(1);
      hearts(g, m.body.pos, 6);
      if (Math.random() < 0.4) { m.tamed = true; decir(g, m, '¡Pura vida!', 3); g.ui.toast('🦜 ¡El loro se hizo su amigo! Va en su hombro y habla (clic derecho: se queda o lo sigue)', 3200); g.achieve('loro', 'Loro de hombro'); }
      else g.ui.toast('🦜 El loro se comió la semilla… todavía desconfía', 1400);
      return true;
    }
    if (m.tamed) { m.data.stay = !m.data.stay; decir(g, m, m.data.stay ? '¡Aquí me quedo!' : '¡Vamos, mae!', 2.5); return true; }
    return false;
  },
};

// ---------- cartelito y perezoso ----------
export function mascotaInteract(m, g, held) {
  // cartelito: nombre para una mascota (cada clic cambia el nombre)
  if (held && held.id === CARTELITO) {
    if (!m.tamed && !m.data.enMochila) { g.ui.toast('El cartelito es para las mascotas', 1400); return true; }
    // v12.4.7: con Mayús, se escribe el nombre que uno quiera
    if ((g.keys.has('ShiftLeft') || g.keys.has('ShiftRight')) && g.ui.pedirTexto) {
      g.ui.pedirTexto('¿Cómo se va a llamar?', m.data.nombre || '', 16).then((t) => {
        const n = [...(t || '')].filter((c) => c.codePointAt(0) >= 32 && c !== '<' && c !== '>').join('').trim().slice(0, 16);
        if (!n) return;
        m.data.nombre = n; quitarEtiqueta(m);
        g.ui.toast(`🏷 Ahora se llama «${n}»`, 1800); g.achieve('nombre_mascota', 'Bautizo de mascota');
      });
      return true;
    }
    const i = (NOMBRES.indexOf(m.data.nombre) + 1) % NOMBRES.length;
    m.data.nombre = NOMBRES[i];
    quitarEtiqueta(m);
    g.ui.toast(`🏷 Ahora se llama «${m.data.nombre}» (Mayús + clic: escribir otro)`, 2200);
    g.achieve('nombre_mascota', 'Bautizo de mascota');
    return true;
  }
  // el perezoso: con un banano se viene colgado de la mochila
  if (m.type === 'perezoso' && held && held.id === 275 && !m.data.enMochila) {
    if (g.mode === 'survival') g.inventory.consumeHeld(1);
    m.data.enMochila = true; m.tamed = true; m.frozen = true;
    hearts(g, m.body.pos, 10);
    g.ui.toast('🦥 ¡El perezoso se colgó de su mochila! Da calma (Shift + clic derecho lo baja)', 3400);
    g.achieve('perezoso_mochila', 'Perezoso de mochila');
    return true;
  }
  if (m.data.enMochila && (g.keys.has('ShiftLeft') || g.keys.has('ShiftRight'))) {
    m.data.enMochila = false; m.frozen = false;
    const p = g.player.body.pos; m.body.pos.x = p.x + 1; m.body.pos.z = p.z; m.body.pos.y = p.y + 0.5;
    g.ui.toast('🦥 Lo bajó con cuidado', 1400);
    return true;
  }
  return false;
}

// etiqueta con el nombre sobre la cabeza
function quitarEtiqueta(m) { const u = m.group.userData; if (u.etiqueta) { m.group.remove(u.etiqueta); u.etiqueta.material.map.dispose(); u.etiqueta.material.dispose(); u.etiqueta = null; } }
function ponerEtiqueta(m) {
  const u = m.group.userData;
  if (u.etiqueta || !m.data.nombre) return;
  const c = document.createElement('canvas'), ctx = c.getContext('2d');
  ctx.font = 'bold 28px sans-serif';
  const w = Math.ceil(ctx.measureText(m.data.nombre).width) + 20; c.width = w; c.height = 40;
  ctx.font = 'bold 28px sans-serif'; ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, w, 40); ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(m.data.nombre, 10, 21);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  const k = 1 / (m.group.scale.x || 1);
  s.scale.set(0.3 * (w / 40) * k, 0.3 * k, 1); s.position.y = (m.kind.h + 0.35) * k;
  s.userData.desechable = true; // disposeModel la libera si la mascota se va con la etiqueta puesta
  m.group.add(s); u.etiqueta = s;
}

// cada cuadro: el perezoso va en la mochila, el loro habla y las etiquetas de nombre
export function tickMascotas(g, dt) {
  const p = g.player.body.pos, yaw = g.player.yaw;
  g.loroT = (g.loroT ?? 15) - dt;
  const habla = g.loroT <= 0;
  if (habla) g.loroT = 18 + Math.random() * 25;
  for (const m of g.entities.mobs) {
    if (m.dead || !m.data) continue;
    if (m.data.nombre) ponerEtiqueta(m);
    if (m.data.enMochila) {
      // colgado de la espalda, mirando para atrás
      m.body.pos.x = p.x + Math.sin(yaw) * 0.42; m.body.pos.z = p.z + Math.cos(yaw) * 0.42; m.body.pos.y = p.y + 0.55;
      m.body.vel.x = m.body.vel.y = m.body.vel.z = 0;
      m.yaw = m.targetYaw = yaw;
      g.perezT = (g.perezT ?? 40) - dt;
      if (g.perezT <= 0) { g.perezT = 60; g.addEffect('calma', 12); }
    }
    if (habla && m.type === 'loro' && m.tamed && Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < 12) decir(g, m, FRASES[Math.floor(Math.random() * FRASES.length)], 2.6);
  }
}

// los loros salvajes aparecen en la selva y el bosque de día
export function loroSpawn(E, g) {
  if (g.dim !== 'tierra' || g.daylight < 0.45) return false;
  if (E.mobs.filter((m) => m.type === 'loro').length >= 3 || Math.random() > 0.05) return false;
  const w = g.world, p = g.player.body.pos;
  const a = Math.random() * Math.PI * 2, r = 16 + Math.random() * 16;
  const x = Math.floor(p.x + Math.cos(a) * r), z = Math.floor(p.z + Math.sin(a) * r);
  if (!w.isLoaded(x, z)) return false;
  const col = w.gen.column(x, z);
  if (!['jungle', 'forest', 'manglar'].includes(col.biome)) return false;
  E.spawnMob('loro', x + 0.5, col.h + 6, z + 0.5);
  return true;
}
