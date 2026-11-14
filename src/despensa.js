// C1 «Fogón y despensa» (v12.1.0, docs/revisiones/DISENO_CONTENIDO_C1-C4.md): leña, la fogata que se apaga, el fogón que gasta leña,
// la comida que se echa a perder despacio (y la sal y el humo que la guardan), la mesa servida y la botica de infusiones.
// Nada de esto se vende (regla de plata común: lo hecho en casa con tiempo se come o se usa). Sin SAVE_FORMAT nuevo: todo son campos
// opcionales (meta.fogatas, be.lena, stack.dia) que se leen con ??; un mundo viejo carga igual y nada se pudre de golpe.
import { BLOCK_BY_KEY as K, getDef } from './blocks.js';
import { difOf, consejoUnaVez } from './supervivencia.js';

export const LENA = 561, SAL = 562, AHUMADA = 563, SALADA = 564, PESCADO_SALADO = 565;
export const AGUA_MANZANILLA = 566, AGUA_JENGIBRE = 567, TE_HIERBABUENA = 568, JARABE_SABILA = 569, SOBRAS = 570;
const MECHERO = 391;
export const fogatas = () => new Set([K.fogata, K.fogata_brasas, K.fogata_apagada]);
const tranquilo = (g) => difOf(g) && difOf(g).name === 'Tranquilo';

// ---------- la comida que se echa a perder ----------
// [días buena, último día «pasada»]; después de eso se vuelve Sobras (solo sirven para la compostera)
const VIDA = new Map();
const pon = (ids, v) => { for (const id of ids) VIDA.set(id, v); };
pon([262, 361, 362, 363, 364, 1105, 1106, 1107, 1108, 1109, 1110, 1111, 1112, 1102, 1103, 1113, 1114, 1115, 1116], [2, 4]); // carne y pescado crudos (v12.7.0: las especies nuevas, la lombriz y la sardina)
pon([265, 288, 350, 351, 352, 353, 365, 366, 392, 397, 411, 416, 417, 418, 419, 420, 450, 481, 484, 494], [3, 6]); // platos hechos
pon([263, 270, 393, 394, 448, 482, 483], [4, 8]); // pan, tortilla, empanada
pon([261, 275, 276, 356, 367, 377, 467, 493], [8, 16]); // fruta
pon([AHUMADA], [10, 20]);
pon([SALADA, PESCADO_SALADO], [14, 28]);
pon([AGUA_MANZANILLA, AGUA_JENGIBRE, TE_HIERBABUENA, JARABE_SABILA], [3, 3]);
pon([574], [1, 1]); // v12.4.0: el guarapo, de un día
pon([1117, 1118, 1119], [3, 6]); // v12.7.2: los platos del mar
pon([1120], [30, 60]); // v12.7.2: el pescado seco, un mes
export const perecedero = (id) => VIDA.has(id);
const hoy = (g) => g.day || 1;

// el estado de una pila: { edad, buena, pasada, podrida, quedan }
let lentitud = 1; // la alacena (C6): la comida guardada en ella se echa a perder a la mitad de prisa
export function estadoComida(g, s) {
  const v = s && VIDA.get(s.id);
  if (!v) return null;
  const k = tranquilo(g) ? 2 : 1, edad = Math.floor(Math.max(0, hoy(g) - (s.dia ?? hoy(g))) / lentitud);
  const buena = v[0] * k, pasada = v[1] * k;
  return { edad, buena: edad < buena, pasada: edad >= buena && edad <= pasada, podrida: edad > pasada, quedan: Math.max(0, buena - edad) };
}
// la línea de la ficha del ítem
export function fichaComida(g, s) {
  const e = g && g.mode === 'survival' ? estadoComida(g, s) : null;
  if (!e) return '';
  if (e.podrida) return '🦠 Echada a perder: solo sirve para la compostera';
  if (e.pasada) return '🥀 Pasada: ya no rinde como antes y puede caer mal';
  return e.quedan <= 1 ? '🥬 Buena (hoy es el último día)' : `🥬 Buena (le quedan ${e.quedan} días)`;
}
// la comida pasada rinde la mitad (y a veces cae mal)
export function factorComida(g, s) {
  const e = g.mode === 'survival' ? estadoComida(g, s) : null;
  if (!e || !e.pasada) return 1;
  if (Math.random() < 0.25) { g.addEffect('panza', 30); g.ui.toast('🤢 Estaba pasada: le cayó pesada', 2200); }
  consejoUnaVez(g, 'pasada', '🥩 La comida guardada se echa a perder: cómala pronto o sálela', 4200);
  return 0.5;
}
// fecha lo que no tenga fecha y vuelve Sobras lo podrido (en un arreglo de casillas: inventario o cofre)
function revisarCasillas(g, slots) {
  let podridas = 0;
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    if (!s || !VIDA.has(s.id)) continue;
    if (s.dia === undefined) { s.dia = hoy(g); continue; }
    const e = estadoComida(g, s);
    if (e && e.podrida) { const def = getDef(s.id); slots[i] = def && def.sip && def.returns ? { id: def.returns, count: 1 } : { id: SOBRAS, count: s.count }; podridas += s.count; } // v12.4.4: lo que se toma devuelve el balde
  }
  return podridas;
}
export function revisarCofre(g, be) {
  if (g.mode !== 'survival' || !be || !Array.isArray(be.slots)) return;
  lentitud = be.type === 'alacena' ? 2 : 1;
  try { revisarCasillas(g, be.slots); } finally { lentitud = 1; }
}

// ---------- la fogata con leña ----------
const fogs = (g) => (g.meta.fogatas ||= {});
const clave = (x, y, z) => `${x},${y},${z}`;
export function registrarFogata(g, x, y, z, lena = 6) {
  const F = fogs(g), k = clave(x, y, z);
  if (!F[k]) F[k] = { lena, t: 0, encendida: hoy(g) + g.time };
  return F[k];
}
// lo llama game.js cuando cambia un bloque: una fogata nueva arranca con 6 leñas
export function alCambiarBloque(g, x, y, z, old, id) {
  if (id === K.fogata && old !== K.fogata_brasas && old !== K.fogata_apagada) {
    registrarFogata(g, x, y, z);
    if (g.mode === 'survival' && !tranquilo(g)) consejoUnaVez(g, 'lena', '🪵 La fogata gasta leña: 2 troncos dan 6 leñas. Échele con clic derecho', 5200);
  } else if (!fogatas().has(id) && fogatas().has(old)) delete fogs(g)[clave(x, y, z)];
}
// el techo: algo sólido encima, hasta 24 bloques
function conTecho(w, x, y, z) {
  for (let dy = 1; dy <= 24; dy++) { const b = w.getBlock(x, y + dy, z); if (b && getDef(b) && getDef(b).solid !== false && b !== K.fogata) return true; }
  return false;
}
// clic derecho a una fogata: leña la carga (y la reaviva); apagada pide un mechero en la barra. Devuelve true si lo atendió
export function usarFogata(g, t, held) {
  const e = registrarFogata(g, t.x, t.y, t.z);
  if (held && held.id === LENA) {
    if (t.id === K.fogata_apagada) {
      const i = g.inventory.slots.findIndex((s, k) => k < 9 && s && s.id === MECHERO);
      if (i < 0) { g.ui.toast('🔥 La fogata se apagó. Échele leña y préndala con el mechero', 3000); return true; }
      const m = g.inventory.slots[i];
      if (g.mode === 'survival') { m.dur = (m.dur ?? getDef(MECHERO).dur ?? 48) - 1; if (m.dur <= 0) g.inventory.slots[i] = null; }
    }
    if (e.lena >= 8 && t.id === K.fogata) { g.ui.toast('🔥 La fogata está llena (8 leñas)', 1600); return true; }
    if (g.mode === 'survival') g.inventory.consumeHeld(1);
    e.lena = Math.min(8, e.lena + 1); e.t = 0; e.lluvia = 0;
    if (t.id !== K.fogata) { g.world.setBlock(t.x, t.y, t.z, K.fogata); e.encendida = hoy(g) + g.time; g.audio.play('ignite', { pos: { x: t.x + 0.5, y: t.y + 0.5, z: t.z + 0.5 }, vol: 0.6 }); }
    g.particles.burst(t.x + 0.5, t.y + 0.7, t.z + 0.5, [[1, 0.6, 0.2], [0.55, 0.55, 0.58]], 8, 1.2);
    g.ui.toast(`🪵 Leña en la fogata: ${e.lena} de 8`, 1300);
    g.inventory.changed();
    return true;
  }
  if (t.id === K.fogata_apagada) { g.ui.toast('🔥 La fogata se apagó. Échele leña y préndala con el mechero', 2800); return true; }
  if (t.id === K.fogata_brasas && !held) { g.ui.toast('🔥 Fogata en brasas: échele leña', 2200); return true; }
  return false;
}
// una vez por segundo: la leña se gasta, la lluvia sin techo la apaga, y una noche entera encendida da logro
export function tickLena(g, dt) {
  g.lenaT = (g.lenaT || 0) - dt;
  if (g.lenaT > 0) return;
  g.lenaT = 1;
  if (g.dim !== 'tierra' || !g.world) return;
  const w = g.world, p = g.player.body.pos, F = fogs(g), suave = tranquilo(g) || g.mode !== 'survival';
  const lluvia = g.weather && !g.dry ? g.weather.intensity : 0;
  for (const [k, e] of Object.entries(F)) {
    const [x, y, z] = k.split(',').map(Number);
    if (Math.abs(x - p.x) > 96 || Math.abs(z - p.z) > 96) continue; // lo lejano no se carga: se queda como estaba
    if (w.isLoaded && !w.isLoaded(x, z)) continue; // v12.4.1: sin cargar, getBlock da aire: no se borra el registro
    const b = w.getBlock(x, y, z);
    if (!fogatas().has(b)) { delete F[k]; continue; }
    const cerca = Math.hypot(x - p.x, z - p.z) < 18;
    if (suave) continue;
    // la lluvia sin techo: a los 20 s en brasas, a los 60 s apagada
    if (lluvia > 0.4 && b !== K.fogata_apagada && !conTecho(w, x, y, z)) {
      e.lluvia = (e.lluvia || 0) + 1;
      if (e.lluvia === 20 && b === K.fogata) { w.setBlock(x, y, z, K.fogata_brasas); e.brasas = 60; }
      if (e.lluvia >= 60) { w.setBlock(x, y, z, K.fogata_apagada); e.lena = 0; if (cerca) g.ui.toast('🌧 El aguacero apagó la fogata. Échele leña y préndala con el mechero', 3200); }
      continue;
    }
    e.lluvia = 0;
    if (b === K.fogata) {
      e.t += 1;
      if (e.t >= 240) { e.t = 0; e.lena = Math.max(0, e.lena - 1); }
      if (e.lena <= 0) {
        w.setBlock(x, y, z, K.fogata_brasas); e.brasas = 180;
        if (cerca) g.ui.toast('🔥 Fogata en brasas: échele leña', 2800);
      }
      // una noche entera encendida (de antes del atardecer al amanecer)
      const ahora = hoy(g) + g.time;
      if (cerca && g.time < 0.05 && ahora - (e.encendida ?? ahora) >= 0.5) g.achieve('fogata_viva', 'Fogata que no se apaga');
    } else if (b === K.fogata_brasas) {
      e.brasas = (e.brasas ?? 180) - 1;
      if (e.brasas <= 0) w.setBlock(x, y, z, K.fogata_apagada);
    }
  }
}

// ---------- el fogón con leña ----------
export function usarFogon(g, t, held) {
  if (!held || held.id !== LENA) return false;
  const be = g.world.getBE(t.x, t.y, t.z);
  if (!be) return false;
  const tiene = be.lena ?? 8;
  if (tiene >= 16) { g.ui.toast('🔥 El fogón está lleno (16 leñas)', 1600); return true; }
  const n = Math.min(16 - tiene, held.count, (g.keys.has('ShiftLeft') || g.keys.has('ShiftRight')) ? 16 : 1);
  be.lena = tiene + n;
  if (g.mode === 'survival') g.inventory.consumeHeld(n);
  g.world.touchBE(t.x, t.y, t.z);
  g.audio.material('wood', 'place', { x: t.x + 0.5, y: t.y + 1, z: t.z + 0.5 });
  g.ui.toast(`🪵 Leña en el fogón: ${be.lena} de 16`, 1300);
  return true;
}
// antes de cocinar una tanda: ¿hay leña? (gasta 1; en Tranquilo, media). Los fogones viejos arrancan con 8
export function gastarLenaFogon(g, st) {
  if (!st || st.type !== 'cooking' || g.mode !== 'survival') return true;
  const be = g.world.getBE(st.x, st.y, st.z);
  if (!be) return true;
  const tiene = be.lena ?? 8, gasto = tranquilo(g) ? 0.5 : 1;
  if (tiene < gasto) { g.ui.toast('🔥 Al fogón se le acabó la leña: échele', 3000); return false; }
  be.lena = Math.round((tiene - gasto) * 2) / 2;
  g.world.touchBE(st.x, st.y, st.z);
  return true;
}
export const lenaFogon = (g, st) => { const be = st && g.world.getBE(st.x, st.y, st.z); return be ? (be.lena ?? 8) : 0; };

// ---------- la mesa servida y la botica ----------
const PLATOS = new Set([265, 350, 351, 352, 353, 365, 366, 392, 397, 417, 418, 419, 481, 484, 494, AHUMADA, SALADA, PESCADO_SALADO]);
function mesaCerca(g) {
  const s = g.sentado;
  if (!s) return false;
  const w = g.world, x = Math.floor(s.x), y = Math.floor(s.y), z = Math.floor(s.z);
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (let dy = -1; dy <= 1; dy++) if (w.getBlock(x + dx, y + dy, z + dz) === K.mesa_comedor || w.getBlock(x + dx, y + dy, z + dz) === K.mesa_grande) return true;
  return false;
}
// cuánto más llena por comer sentado a la mesa (1.15) y el aguante
export function bonoMesa(g, id) {
  if (!PLATOS.has(id) || g.mode !== 'survival') return 1;
  if (!mesaCerca(g)) {
    const p = g.player.body.pos, w = g.world;
    let hay = false;
    for (let dx = -3; dx <= 3 && !hay; dx++) for (let dz = -3; dz <= 3 && !hay; dz++) if (w.getBlock(Math.floor(p.x) + dx, Math.floor(p.y), Math.floor(p.z) + dz) === K.mesa_comedor) hay = true;
    return 1;
  }
  g.addEffect('aguante', 240);
  g.ui.toast('🍽 Comer sentado a la mesa rinde más. Provecho.', 2200);
  g.achieve('mesa_servida', 'A la mesa, a comer');
  return 1.15;
}
// lo que hacen las infusiones y la despensa al comerlas
export function alComerDespensa(g, id) {
  const fx = g.player.effects, P = g.player;
  if (id === AGUA_MANZANILLA) { delete fx.mareo; delete fx.escalofrio; g.addEffect('calma', 300); P.health = Math.min(P.maxHealth, P.health + 4); g.ui.toast('🍵 Agua de manzanilla: se le calmó el cuerpo. Ya puede dormir', 2600); }
  if (id === AGUA_JENGIBRE) { delete fx.panza; g.addEffect('aguante', 240); g.ui.toast('🍵 Agua de jengibre: se le quitó el malestar y anda con más aguante', 2600); }
  if (id === TE_HIERBABUENA) { delete fx.panza; delete fx.garrapatas; P.food = Math.min(20, P.food + 2); g.ui.toast('🍵 Té de hierbabuena: panza tranquila y sin garrapatas', 2600); }
  if (id === JARABE_SABILA) { delete fx.sangrando; P.health = Math.min(P.maxHealth, P.health + 6); g.ui.toast('🍵 Jarabe de sábila: paró la sangre y le volvió el color', 2600); }
  if (id >= AGUA_MANZANILLA && id <= JARABE_SABILA) {
    const B = (g.meta.botica ||= []);
    if (!B.includes(id)) B.push(id);
    if (B.length >= 4) g.achieve('botica', 'Botica de la abuela');
  }
}
// cada 3 s: fechar la comida del inventario, volver Sobras lo podrido, y los logros y consejos de la despensa
export function tickDespensa(g, dt) {
  g.despT = (g.despT || 0) - dt;
  if (g.despT > 0) return;
  g.despT = 3;
  const inv = g.inventory;
  inv.hoy = g.day || 1; // v12.4.1: para juntar pilas con la fecha de la comida
  if (g.mode === 'survival') {
    const n = revisarCasillas(g, inv.slots);
    if (g.ui && g.ui.cursor && VIDA.has(g.ui.cursor.id) && g.ui.cursor.dia === undefined) g.ui.cursor.dia = hoy(g);
    if (n) { inv.changed(); g.ui.toast(`🦠 Se echó a perder comida (${n}): quedó como sobras para la compostera`, 3000); }
  }
  const tiene = (id) => inv.slots.some((s) => s && s.id === id);
  if (tiene(LENA)) g.achieve('lena', 'Primera leña');
  if (tiene(AHUMADA)) g.achieve('ahumado', 'Carne de ahumadero');
  if (tiene(AHUMADA) && tiene(SALADA) && tiene(PESCADO_SALADO)) g.achieve('despensa', 'Una despensa de abuela');
  if (g.mode === 'survival' && inv.slots.filter((s) => s && s.id === 262).reduce((a, s) => a + s.count, 0) >= 4) consejoUnaVez(g, 'sal', '🧂 Con sal y el fogón, la carne dura semanas', 4200);
}
