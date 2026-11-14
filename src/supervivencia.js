// Supervivencia de verdad: dificultad por mundo, el bolso que se cae al morir, el frío del páramo y los consejos de los
// primeros minutos. La dificultad se escoge al crear el mundo (los mundos viejos quedan en «normal»).
import { BLOCK_BY_KEY as K, AIR, SOLID, getDef, isBlockId, maxStack } from './blocks.js';
import { extras } from './inventory.js';
import { VALOR, desglose, fmtColones } from './plata.js';

export const DIF = {
  tranquilo: { name: 'Tranquilo', hostiles: false, dmg: 0.6, hunger: 0.7, regenCost: 4, starveKills: false, keep: 'todo', respawnFood: 20, sombras: 0 },
  normal: { name: 'Normal', hostiles: true, dmg: 1, hunger: 1, regenCost: 10, starveKills: false, keep: 'equipo', respawnFood: 12, sombras: 8 },
  dificil: { name: 'Difícil', hostiles: true, dmg: 1.4, hunger: 1.3, regenCost: 16, starveKills: true, keep: 'nada', respawnFood: 8, sombras: 12 },
};
export const difOf = (g) => DIF[(g.meta && g.meta.dificultad) || 'normal'] || DIF.normal;

// ---------- el bolso: al morir, lo que se llevaba queda en un cofre donde uno cayó ----------
// meta.bolso es el último; meta.bolsos, los anteriores que siguen tirados
export const todosBolsos = (g) => [g.meta.bolso, ...(g.meta.bolsos || [])].filter(Boolean);
export function dropBolso(g) {
  const d = difOf(g);
  if (g.mode !== 'survival' || d.keep === 'todo') return null;
  const inv = g.inventory, items = [];
  // v11.13.3: la plata sacada a las casillas (también la de la mano) vuelve a la billetera antes de repartir: así cae la mitad
  // (o toda) de TODA la plata, y no se puede salvar ni perder entera por dónde estaba
  if (inv.meterPlata) inv.slots.forEach((s, i) => { if (s && VALOR[s.id]) { inv.meterPlata(s); inv.slots[i] = null; } });
  inv.slots.forEach((s, i) => {
    if (!s) return;
    if (d.keep === 'equipo' && i === inv.selected) return; // lo que tenía en la mano se queda
    items.push(s); inv.slots[i] = null;
  });
  if (d.keep === 'nada') inv.armor.forEach((a, i) => { if (a) { items.push(a); inv.armor[i] = null; } });
  // la plata de la billetera: en Normal se cae la mitad y en Difícil toda (el banco y el chanchito nunca se pierden)
  g.plataCaida = 0;
  const parte = d.keep === 'nada' ? 1 : 0.5, enB = inv.enBilletera ? inv.enBilletera() : 0;
  if (enB > 0) {
    const cae = desglose(Math.round(enB * parte / 5) * 5), suma = cae.reduce((a, [id, n]) => a + n * VALOR[id], 0);
    if (suma > 0) { inv.reacomodarPlata(inv.colones() - suma); for (const [id, n] of cae) for (let k = n, tope = maxStack(id); k > 0; k -= tope) items.push({ id, count: Math.min(k, tope) }); g.plataCaida = suma; }
  }
  inv.changed();
  if (!items.length) return null;
  // un hueco libre cerca de donde cayó (sin agua ni lava, y sobre algo firme)
  const w = g.world, p = g.player.body.pos;
  let spot = null;
  for (let r = 0; r <= 3 && !spot; r++) for (let dy = 0; dy <= 3 && !spot; dy++) for (let dx = -r; dx <= r && !spot; dx++) for (let dz = -r; dz <= r && !spot; dz++) {
    const x = Math.floor(p.x) + dx, y = Math.max(2, Math.floor(p.y)) + dy, z = Math.floor(p.z) + dz;
    if (w.getBlock(x, y, z) === AIR && w.getBlock(x, y + 1, z) === AIR) spot = [x, y, z];
  }
  if (!spot) { const [x, y, z] = [Math.floor(p.x), Math.max(2, Math.floor(p.y)), Math.floor(p.z)]; spot = [x, y, z]; }
  const [x, y, z] = spot;
  if (!SOLID[w.getBlock(x, y - 1, z)]) w.setBlock(x, y - 1, z, K.cobble);
  const chests = [[x, y, z], [x, y + 1, z]];
  let k = 0;
  for (const [cx, cy, cz] of chests) {
    if (k >= items.length) break;
    w.setBlock(cx, cy, cz, K.chest);
    g.stations.placed(K.chest, cx, cy, cz, 0);
    const be = w.getBE(cx, cy, cz);
    for (let s = 0; s < 27 && k < items.length; s++) be.slots[s] = items[k++];
    w.touchBE(cx, cy, cz);
  }
  // el bolso anterior no se olvida: sigue marcado hasta que lo recoja
  if (g.meta.bolso) { (g.meta.bolsos ||= []).unshift(g.meta.bolso); g.meta.bolsos.length = Math.min(g.meta.bolsos.length, 19); } // 20 en total: antes eran 5 y el sexto dejaba sin marca un cofre que seguía en el mundo
  g.meta.bolso = { x, y, z, day: g.day || 1, dim: g.dim };
  return { x, y, z, n: items.length };
}

// abrir el cofre del bolso recoge todo de una vez. Lo que no quepa se queda y el cofre se abre normal.
export function recogerBolso(g, x, y, z) {
  const w = g.world, B = todosBolsos(g).find((q) => g.dim === (q.dim || 'tierra') && x === q.x && z === q.z && (y === q.y || y === q.y + 1));
  if (!B) return false;
  let quedo = false;
  for (const [cx, cy, cz] of [[B.x, B.y, B.z], [B.x, B.y + 1, B.z]]) {
    if (w.getBlock(cx, cy, cz) !== K.chest) continue;
    const be = w.getBE(cx, cy, cz);
    if (!be || !be.slots) continue;
    be.slots.forEach((s, i) => {
      if (!s) return;
      const left = g.inventory.add(s.id, s.count, s.dur, extras(s));
      if (left > 0) { s.count = left; quedo = true; } else be.slots[i] = null;
    });
    w.touchBE(cx, cy, cz);
    if (!be.slots.some(Boolean)) { w.setBlock(cx, cy, cz, AIR); g.particles.burst(cx + 0.5, cy + 0.5, cz + 0.5, [[0.6, 0.45, 0.25]], 10, 1.4); }
  }
  g.audio.play('chest.open', { ui: true, vol: 0.4 });
  return !quedo;
}

// el bolso ya se recogió: el cofre está vacío o ya no está
export function tickBolso(g) {
  const w = g.world;
  for (const B of todosBolsos(g)) {
    if (g.dim !== (B.dim || 'tierra') || !w.isLoaded(B.x, B.z)) continue;
    const left = [[B.x, B.y, B.z], [B.x, B.y + 1, B.z]].some(([x, y, z]) => {
      if (w.getBlock(x, y, z) !== K.chest) return false;
      const be = w.getBE(x, y, z);
      return be && be.slots && be.slots.some(Boolean);
    });
    if (left) continue;
    if (B === g.meta.bolso) { delete g.meta.bolso; if (g.meta.bolsos && g.meta.bolsos.length) g.meta.bolso = g.meta.bolsos.shift(); } else g.meta.bolsos = g.meta.bolsos.filter((q) => q !== B);
    const quedan = todosBolsos(g).length;
    g.ui.toast(quedan ? `🎒 ¡Recuperó sus cosas! Todavía le queda${quedan > 1 ? `n ${quedan} bolsos` : ' otro bolso'} por ahí` : '🎒 ¡Recuperó sus cosas!', 2400);
    g.achieve('bolso', 'Volví por mis cosas');
  }
}

export function deathTip(g) {
  const d = difOf(g);
  if (g.seguroPago) { g.seguroPago = false; return '📄 El seguro del tío Rigo pagó: no se le cayó nada. La póliza ya se gastó.'; }
  if (g.mode !== 'survival' || d.keep === 'todo') return 'Conserva su inventario (modo Tranquilo).';
  if (g.meta.bolso && g.meta.bolso.dim && g.meta.bolso.dim !== 'tierra') return `Sus cosas quedaron en un cofre allá ${g.meta.bolso.dim === 'cielo' ? 'arriba' : 'abajo'}. Vuelva por el portal (🌀 en la brújula), y allá el 🎒 le dice dónde.`;
  const otros = todosBolsos(g).length - 1;
  let mas = otros > 0 ? ` Y le ${otros > 1 ? `quedan ${otros} bolsos más` : 'queda otro bolso'} por ahí.` : '';
  if (g.plataCaida) mas += ` Se le cayeron ${fmtColones(g.plataCaida)} en el bolso.`;
  // v11.12.2: a cuánto y hacia dónde queda el bolso desde donde reaparece
  const B = g.meta.bolso, S = g.meta.spawn, dist = B && S ? Math.round(Math.hypot(B.x - S.x, B.z - S.z)) : 0;
  const rumbo = B && S ? ['al este', 'al sureste', 'al sur', 'al suroeste', 'al oeste', 'al noroeste', 'al norte', 'al noreste'][(Math.round(Math.atan2(B.z - S.z, B.x - S.x) / (Math.PI / 4)) + 8) % 8] : '';
  const donde = dist > 8 ? `el bolso, a ${dist} bloques ${rumbo} (🧭 y 🎒 en el mapa)` : 'el bolso, ahí mismo donde reaparece (🎒 en el mapa)';
  return (d.keep === 'equipo' ? `Sus cosas quedaron en ${donde}. Conserva la armadura y lo que tenía en la mano.` : `Todo quedó en ${donde}, armadura incluida. ¡Apúrese!`) + mas;
}

// ---------- frío: en el páramo y en las cumbres, sin abrigo ni fuego, da escalofrío y más hambre ----------
const WARM = new Set(['fogata', 'fogata_brasas', 'stove', 'furnace_lit', 'torch', 'wall_torch0', 'wall_torch1', 'wall_torch2', 'wall_torch3', 'lava', 'magma', 'farol', 'lamp'].map((k) => K[k]).filter(Boolean));
const ABRIGO = new Set([331, 407]); // pechera de cuero y la capa de la Arpía
const METAL = new Set([335, 339, 343]); // las pecheras de metal abrigan a medias
export function tickFrio(g) {
  if (g.mode !== 'survival' || g.dim !== 'tierra') return;
  const p = g.player.body.pos, col = g.world.gen.column(Math.floor(p.x), Math.floor(p.z));
  const alto = col.biome === 'paramo' || p.y > 102;
  if (!alto) { g.frio = 0; return; }
  const chest = g.inventory.armor[1];
  let warm = (chest && ABRIGO.has(chest.id)) || g.player.effects.termal || g.player.effects.ignifugo;
  if (!warm) {
    const w = g.world;
    for (let dx = -3; dx <= 3 && !warm; dx++) for (let dy = -1; dy <= 2 && !warm; dy++) for (let dz = -3; dz <= 3 && !warm; dz++) if (WARM.has(w.getBlock(Math.floor(p.x) + dx, Math.floor(p.y) + dy, Math.floor(p.z) + dz))) warm = true;
  }
  if (warm) { if (g.frio > 5) g.ui.toast('🔥 Ya se calentó', 1400); g.frio = 0; return; }
  g.frio = (g.frio || 0) + 1;
  const noche = g.daylight < 0.35;
  g.player.hungerT += (noche ? 1.2 : 0.6) * (chest && METAL.has(chest.id) ? 0.5 : 1);
  if (g.frio > 4) g.addEffect('escalofrio', 3);
  if (g.frio === 5) g.ui.toast('🥶 ¡Qué frío hace en el páramo! Póngase una pechera de cuero o arrímese a un fuego', 3200);
  if (g.frio > 60 && noche && g.frio % 10 === 0 && g.player.health > 2) g.damagePlayer(1, null, null, 'Se congeló en el páramo', true);
}

// ---------- los primeros minutos: el bolsito de inicio y consejos que van saliendo ----------
export function bolsitoInicio(g) {
  if (g.mode !== 'survival' || g.meta.bolsito) return;
  g.meta.bolsito = true;
  g.inventory.add(270, 4); // tortillas
  g.inventory.add(K.torch, 6);
}
// cada consejo sale cuando toca (`si`) y se salta si ya no hace falta (`listo`); `t` es el mínimo de segundos jugados
const conHerramienta = (g, tier) => g.inventory.slots.some((s) => { const d = s && !isBlockId(s.id) && getDef(s.id); return d && d.tool && (d.tier || 0) >= tier; });
const CONSEJOS = [
  { id: 'ruta', t: 14, txt: '🧭 Siga el 📖 de la brújula hasta la casa de la abuela. Si ocupa madera por el camino: clic izquierdo sostenido a un árbol' },
  { id: 'tablas', t: 60, listo: (g) => conHerramienta(g, 1), txt: '🪵 Con madera se hacen tablas y una mesa de trabajo (E abre el inventario y el libro de recetas)' },
  { id: 'piedra', t: 90, listo: (g) => conHerramienta(g, 2), txt: '⛏ Herramientas de madera primero, después de piedra: el pico de piedra abre la minería' },
  { id: 'ruta2', t: 150, txt: '🧭 La tecla J abre la Ruta del aventurero: le va diciendo qué sigue' },
  { id: 'noche', t: 100, si: (g) => g.daylight < 0.6, txt: '🌙 Se viene la noche y salen las Sombras: haga un refugio, ponga antorchas y una cama' },
  { id: 'bolso', t: 0, si: (g) => !!g.meta.bolso, txt: '🎒 Sus cosas quedaron en un cofre donde cayó; búsquelo en el mapa (M) o siga el 🎒 de la brújula' },
  { id: 'habilidades', t: 420, txt: '🎖️ Todo lo que hace sube sus habilidades (tecla H); los logros están en la libreta (tecla L)' },
  { id: 'sed', t: 20, si: (g) => (g.player.water ?? 20) <= 13, txt: '💧 Ojo con la sed: tome agua del río con la mano vacía o haga una cantimplora de cuero' },
  { id: 'sangre', t: 0, si: (g) => !!g.player.effects.sangrando, txt: '🩸 Lo dejaron sangrando: en la farmacia venden vendas y botiquín' },
  { id: 'marcador', t: 760, txt: '🔖 Shift+B pone un marcador con nombre; N abre el diario del aventurero' },
  { id: 'comida', t: 30, si: (g) => g.player.food <= 14, txt: '🍖 Para curarse ocupa la panza casi llena y algo de agua. Con la comida en la mano, la barra le enseña cuánto le llena' },
  { id: 'fijas', t: 300, txt: '📌 En el inventario, Alt+clic deja una casilla fija: Ordenar y los botones de cofre no la tocan' },
];
// un consejo que sale una sola vez en la vida del mundo, cuando pasa lo que lo amerita (no por tiempo)
// v11.10.7: la primera vez que tiene un chanchito de barro (lo llama tickConsejos)
function consejoChanchito(g) {
  if (g.inventory.count(652) > 0) consejoUnaVez(g, 'chanchito', '🐷 ¡Un chanchito de barro! Póngalo donde quiera: todos sus chanchitos guardan lo mismo, y lo que eche ahí no se pierde ni al morir. Si lo rompe, suelta solo el chanchito vacío: conserve siempre uno, que sin chanchito no se llega a lo guardado.', 7600);
}
export function consejoUnaVez(g, id, txt, ms = 4600) {
  if (!g.meta || g.mode !== 'survival') return false;
  const V = (g.meta.consejosVistos ||= CONSEJOS.slice(0, g.meta.consejo || 0).map((c) => c.id));
  if (V.includes(id)) return false;
  V.push(id); g.ui.toast(txt, ms, { cat: 'consejo', clave: `consejo:${id}` });
  return true;
}
export function tickConsejos(g) {
  if (g.mode === 'survival' && g.inventory) consejoChanchito(g);
  if (g.mode !== 'survival' || (g.day || 1) > 3) return;
  g.playT = (g.playT || 0) + 1;
  // los mundos viejos llevaban la cuenta por posición: lo ya dicho no se repite
  const M = g.meta, V = (M.consejosVistos ||= CONSEJOS.slice(0, M.consejo || 0).map((c) => c.id));
  if (g.playT < (g.consejoHasta || 0)) return;
  for (const c of CONSEJOS) {
    if (V.includes(c.id)) continue;
    if (c.listo && c.listo(g)) { V.push(c.id); continue; }
    if (g.playT >= c.t && (!c.si || c.si(g))) { V.push(c.id); g.consejoHasta = g.playT + 25; g.ui.toast(c.txt, 5200, { cat: 'consejo', clave: `consejo:${c.id}` }); return; }
  }
}

// el cuerpo avisa antes de fallar: por qué ya no corre o no se cura, una vez por bajón
export function tickCuerpo(g) {
  const p = g.player;
  if (g.mode !== 'survival' || !p.alive) return;
  const A = (g.avisosCuerpo ||= {}), agua = p.water ?? 20;
  const aviso = (k, mal, bien, txt) => { if (bien) A[k] = false; else if (mal && !A[k]) { A[k] = true; g.ui.toast(txt, 3600, { cat: 'consejo', clave: `cuerpo:${k}` }); } };
  aviso('correr', p.food <= 6, p.food >= 9, '🍽 Con esta hambre ya no puede correr. Coma algo');
  aviso('curar', p.food < 15 && p.food > 6 && p.health < p.maxHealth, p.food >= 15 || p.health >= p.maxHealth, '🍖 Con la panza a medias no se cura: coma hasta casi llenar la barra');
  aviso('sed', agua < 6, agua >= 9, '💧 Con tanta sed ya no se cura. Tome agua');
}

