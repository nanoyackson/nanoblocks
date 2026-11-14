// El terremoto grande: muy de vez en cuando (desde el día 10, y con mucho tiempo entre uno y otro), en vez de un temblor normal
// viene uno de magnitud 7 y pico: dura el doble, se mueve todo, y a media sacudida se abre una grieta en el suelo cerca de uno (solo
// en tierra natural: nunca en lo construido). Después vienen las réplicas. Si es en la costa, el tsunami se encarga del resto.
// Estado: meta.terremotoCd (día), g.terremoto (la grieta en curso; no se guarda).
import { AIR, FLUID, BLOCK_BY_KEY as K, SOLID } from './blocks.js';
import { CHUNK, idx } from './worldgen.js';
import { anotar } from './diario.js';

const NATURAL = new Set([K.grass, K.dirt, K.sand, K.stone, K.gravel, K.snow_grass, K.tall_grass].filter(Boolean));
// ¿ese bloque lo puso o lo cambió uno? (world.mods guarda lo que no es del generador)
function tocado(w, x, y, z) { const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK), m = w.mods && w.mods.get(`${cx},${cz}`); return !!(m && m.has(idx(x - cx * CHUNK, y, z - cz * CHUNK))); }
function grieta(g) {
  const w = g.world, p = g.player.body.pos, a = Math.random() * Math.PI * 2, r = 9 + Math.random() * 6;
  const sx = p.x + Math.cos(a) * r, sz = p.z + Math.sin(a) * r, dir = a + Math.PI / 2 + (Math.random() - 0.5) * 0.6;
  const v = g.nearestVillage && g.nearestVillage(sx, sz);
  if (v && v.dist < (v.v.R || 50) + 25) return 0; // en el pueblo no se abre la tierra (las calles y la cancha son del generador)
  const L = 22 + Math.floor(Math.random() * 16);
  let abiertos = 0;
  const hechas = new Set();
  g.ultimaGrieta = { x: sx, z: sz }; // para /prueba y el mapa
  for (let i = -L / 2; i < L / 2; i += 0.5) {
    const wob = Math.sin(i * 0.7) * 0.8, x = Math.floor(sx + Math.cos(dir) * i - Math.sin(dir) * wob), z = Math.floor(sz + Math.sin(dir) * i + Math.cos(dir) * wob);
    if (!w.isLoaded(x, z)) continue;
    let top = 125; while (top > 2 && !SOLID[w.getBlock(x, top, z)]) top--;
    const hondo = 5 + Math.floor(Math.random() * 3) - Math.floor(Math.abs(i) / (L / 2) * 3); // más honda en el medio
    const ancho = Math.abs(i) < L * 0.35 ? 2 : 1;
    for (let k = 0; k < ancho; k++) {
      const X = x + (k ? Math.round(-Math.sin(dir)) : 0), Z = z + (k ? Math.round(Math.cos(dir)) : 0);
      if (hechas.has(`${X},${Z}`)) continue;
      hechas.add(`${X},${Z}`);
      let agua = false;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (FLUID[w.getBlock(X + dx, top, Z + dz)] || FLUID[w.getBlock(X + dx, top + 1, Z + dz)]) agua = true;
      if (agua || tocado(w, X, top + 1, Z) || tocado(w, X, top, Z)) continue; // ni debajo de lo que uno puso
      for (let y = top; y > top - hondo && y > 3; y--) {
        const id = w.getBlock(X, y, Z);
        if (!NATURAL.has(id) || tocado(w, X, y, Z)) break;
        w.setBlock(X, y, Z, AIR); abiertos++;
        if (y === top && Math.random() < 0.5) g.particles.burst(X + 0.5, y + 0.5, Z + 0.5, [[0.45, 0.35, 0.25], [0.55, 0.55, 0.52]], 6, 2);
      }
      // la orilla se cae para adentro: lo que estaba encima (zacate, flores) se va
      if (!SOLID[w.getBlock(X, top + 1, Z)] && w.getBlock(X, top + 1, Z) !== AIR && !tocado(w, X, top + 1, Z)) w.setBlock(X, top + 1, Z, AIR);
    }
  }
  return abiertos;
}
// cada segundo
export function tickTerremoto(g) {
  if (g.dim !== 'tierra' || !g.meta) return;
  const M = g.meta, T = g.temblor;
  // ¿el próximo temblor es el grande?
  if (!T && !g.terremoto && (g.day || 1) >= 10 && (M.terremotoCd || 0) <= (g.day || 1) && g.proxTemblor && (g.clock || 0) > g.proxTemblor - 1 && Math.random() < 0.06) {
    M.terremotoCd = (g.day || 1) + 25;
    const mag = +(7.2 + Math.random() * 0.6).toFixed(1);
    g.temblor = { t: 12 + (mag - 7) * 6, mag, cayo: 0, grande: true };
    g.proxTemblor = (g.clock || 0) + 900 + Math.random() * 1500;
    g.terremoto = { abierto: false, replicas: 3, cuando: 0 };
    g.audio.play('rumble', { ui: true, vol: 1, pitch: 0.6 });
    g.audio.play('derrumbe', { ui: true, vol: 0.9, pitch: 0.7 });
    g.ui.toast(`🌎 ¡TERREMOTO! Magnitud ${mag}: ¡salga a lo abierto, lejos de paredes y barrancos!`, 5200);
    return;
  }
  const E = g.terremoto;
  if (!E) return;
  if (T && T.grande) {
    g.shake = Math.max(g.shake || 0, 1.6);
    if (!E.abierto && T.t < 9) {
      E.abierto = true;
      const n = grieta(g);
      if (n) { g.audio.play('derrumbe', { ui: true, vol: 1 }); g.ui.toast('🌎 ¡Se abrió una grieta en el suelo, ahí mismo!', 3200); }
    }
    return;
  }
  // después: réplicas cada minuto o dos
  if (!E.dijo) { E.dijo = true; g.achieve('terremoto', 'Sobreviví al terremoto grande'); anotar(g, 'Hubo un terremoto grande. Se abrió la tierra cerca de mí.', '🌎'); g.ui.toast('📻 Comisión Nacional de Sustos (ficticia): «Esperen réplicas. No se metan a la grieta»', 4600); E.cuando = (g.clock || 0) + 60 + Math.random() * 60; }
  if (E.replicas > 0 && !g.temblor && (g.clock || 0) > E.cuando) {
    E.replicas--; E.cuando = (g.clock || 0) + 60 + Math.random() * 80;
    const mag = +(4.6 + Math.random() * 1.2).toFixed(1);
    g.temblor = { t: 3 + (mag - 4) * 2.2, mag, cayo: 0 };
    g.audio.play('rumble', { ui: true, vol: 0.7 });
    g.ui.toast(`🌎 Réplica de ${mag}. Ya casi pasa…`, 2600);
  }
  if (E.replicas <= 0 && !g.temblor) g.terremoto = null;
}
export const limpiarTerremoto = (g) => { g.terremoto = null; };
export function pruebaTerremoto(g) {
  g.meta.terremotoCd = 0; g.temblor = null; g.terremoto = null;
  g.proxTemblor = (g.clock || 0) + 0.5;
  const d = g.day; g.day = Math.max(10, g.day || 1);
  for (let i = 0; i < 200 && !g.terremoto; i++) tickTerremoto(g);
  g.day = d;
  return g.terremoto ? 'Viene el terremoto grande' : 'No salió: pruebe otra vez';
}
