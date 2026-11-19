// Comodidades de supervivencia: reparar herramientas y armadura en la cuadrícula de fabricar, la ficha que explica cada
// objeto, el letrerito de lo que uno está mirando (con la herramienta que hace falta) y el aviso de herramienta gastada.
import { efectoPlato } from './platos.js';
import { fichaComida } from './despensa.js';
import { extras } from './inventory.js';
import { ITEMS, BLOCKS, BLOCK_BY_KEY, getDef, itemName, esPescado } from './blocks.js';
import { tecla } from './teclas.js';
import { RECIPES, ingredients } from './recipes.js';
import { origenLineas } from './origen.js';
import { topeDe } from './yunque.js';
import { fichaArma, debilidadTexto } from './armas3.js';
import { fichaConjunto } from './conjuntos.js';
import { usoLinea } from './usoauto.js';

// ---------- reparar: la pieza gastada + una unidad de su material (o dos gastadas iguales) ----------
const MATERIAL = { wood: 9, stone: 4, iron: 258, gold: 259, diamond: 260, jade: 274, leather: 271, pluma: 551, cuerno: 537, seda: 536, concha: 540 };
export const materialDe = (def) => {
  if (!def) return null;
  if (def.machete) return 258;
  if (def.bow) return 256;
  return MATERIAL[def.mat] || null;
};
export function reparacion(grid) {
  if (!grid) return null;
  const llenas = grid.filter(Boolean);
  if (llenas.length !== 2) return null;
  const [a, b] = llenas;
  // dos iguales gastadas: se juntan y sobra un poquito
  if (a.id === b.id && a.dur !== undefined && b.dur !== undefined) {
    const def = ITEMS[a.id];
    if (!def || !def.durability || (a.dur >= def.durability && b.dur >= def.durability)) return null;
    return { out: [a.id, 1], repara: true, dur: Math.min(def.durability, a.dur + b.dur + Math.round(def.durability * 0.05)), extra: extras((b.mejora || 0) > (a.mejora || 0) ? b : a) };
  }
  const pieza = a.dur !== undefined ? a : b.dur !== undefined ? b : null;
  const otro = pieza === a ? b : a;
  if (!pieza) return null;
  const def = ITEMS[pieza.id];
  if (!def || !def.durability || pieza.dur >= def.durability || otro.id !== materialDe(def)) return null;
  // reparar sale más barato que hacer una nueva, pero no regalado; la armadura rinde menos por unidad
  const k = def.armor ? 0.15 : 0.25;
  return { out: [pieza.id, 1], repara: true, dur: Math.min(def.durability, pieza.dur + Math.round(def.durability * k)), extra: extras(pieza) };
}

// ---------- la ficha del objeto ----------
const TIPO = { pickaxe: 'Pico', axe: 'Hacha', shovel: 'Pala', sword: 'Espada', hoe: 'Azada' };
const NIVEL = ['', 'cualquier pico', 'pico de piedra', 'pico de hierro', 'pico de diamante', 'pico de jade'];
export function fichaItem(stack, g) {
  if (!stack) return '';
  const id = stack.id, def = getDef(id);
  const lineas = [itemName(id)];
  if (!def) return lineas[0];
  if (stack.cruda) lineas.push('💧 Sin hervir: con la cantimplora en la mano, clic derecho a una fogata');
  { const fc = fichaComida(g, stack); if (fc) lineas.push(fc); } // v12.1.0
  if (def.damage) lineas.push(`⚔ Daño ${def.damage}${def.machete ? ' · barrido' : ''}`);
  { const fa = fichaArma(def); if (fa) lineas.push(`🗡 ${fa}`); }
  if (def.tool && def.speed) lineas.push(`${TIPO[def.tool] || 'Herramienta'} · velocidad ${def.speed}`);
  if (def.points) lineas.push(`🛡 Protección ${def.points}${def.toughness ? ` · dureza ${def.toughness}` : ''}`);
  { const fc = fichaConjunto(def); if (fc) lineas.push(`✨ ${fc}`); }
  if (def.block && def.armorSlot === 4) lineas.push(`🛡 Bloquea ${Math.round(def.block * 100)} % del golpe`);
  if (def.food) {
    lineas.push(`🍖 Llena ${def.food}`);
    // comer lo mismo aburre: que se vea antes de comerlo
    // comer variado da premio: que se vea si esta cuenta como nueva hoy
    const V = g && g.mode === 'survival' && g.meta && g.meta.variedad && g.meta.variedad.dia === (g.day || 1) ? g.meta.variedad.ids : [];
    if (g && g.mode === 'survival') lineas.push(V.includes(id) ? `🥗 Ya la comió hoy (variedad ${V.length}/3)` : `🥗 Nueva hoy: cuenta para la variedad (${V.length}/3)`);
    if (efectoPlato(id)) lineas.push(efectoPlato(id));
  }
  if (def.durability) {
    const d = stack.dur ?? def.durability;
    lineas.push(def.agua ? `💧 Agua ${d}/${def.durability} (se llena apuntando al agua)` : `Vida ${d}/${def.durability}`);
    const m = materialDe(def);
    if (m && d < def.durability) lineas.push(`🔧 Se repara en la cuadrícula con: ${itemName(m)}`);
  }
  if (stack.mejora) lineas.push(`⭐ Mejora ${stack.mejora}/${g ? topeDe(g) : 3}: ${def.armor ? `+${stack.mejora * 0.25} de protección` : !def.tool || def.tool === 'sword' ? `${stack.mejora * 12} % más de daño` : `${stack.mejora * 12} % más de velocidad y de daño`}`);
  else if (def.durability && g && g.mode === 'survival' && materialDe(def)) lineas.push('🔨 Se puede mejorar en el yunque');
  if (stack.filo) lineas.push(`🗡 Con aceite: 30 % más de daño, ${stack.filo} golpes`);
  if (def.tier && def.isBlock !== false && def.tool === 'pickaxe') lineas.push(`Pide ${NIVEL[def.tier] || 'un buen pico'}`);
  const origen = g && g.mode === 'survival' ? origenLineas(id, g) : [];
  // v13.5.8 (PU-17): para qué sirve, justo debajo del nombre. v13.6.1 (PU-32): si es ingrediente y el origen ya dice «Sirve para», no se repite
  { const uso = usoLinea(def); if (uso && !(uso.startsWith('Ingrediente:') && origen.some((l) => l.includes('Sirve para')))) lineas.splice(1, 0, `ℹ ${uso}`); }
  lineas.push(...origen);
  return lineas.join('\n');
}

// ---------- ¿qué estoy mirando? ----------
export function textoMirando(g) {
  if (g.mobTarget && g.mobTarget.mob) {
    const m = g.mobTarget.mob;
    const nom = ((m.data && m.data.name) || (m.kind && m.kind.name) || '') + (m.data && m.data.estrellas ? ` ${'★'.repeat(m.data.estrellas)}` : '');
    if (!nom) return null;
    // las de cada noche nacen con vida extra: que el total no se quede corto
    m.data.vmax = Math.max(m.data.vmax || 0, m.health, (m.kind && m.kind.health) || 0);
    const max = m.data.vmax;
    const deb = g.mode === 'survival' && (m.kind.hostile || m.data.provoked) ? debilidadTexto(m) : '';
    return { t: (max ? `${nom} · ❤ ${Math.ceil(m.health)}/${max}` : nom) + (deb ? ` · ${deb}` : ''), malo: false };
  }
  const t = g.target;
  if (!t) return null;
  const b = BLOCKS[t.id];
  if (!b || !b.name) return null;
  if (b.door) { const be = g.world.getBE(t.x, b.upper ? t.y - 1 : t.y, t.z); return { t: be && be.tranca ? `${b.name} · con tranca` : b.name, malo: false }; }
  if (b.key === 'fogata') { const h = g.inventory.held; if (h && h.cruda) return { t: `${b.name} · clic derecho: hervir el agua`, malo: false }; }
  if (b.station === 'chest') { const be = g.world.getBE(t.x, t.y, t.z); if (be && be.nombre) return { t: `${b.name} · «${be.nombre}»`, malo: false }; } // los cofres con nombre (v11.8)
  if (b.barril) { const be = g.world.getBE(t.x, t.y, t.z); return { t: `${b.name} · 💧 ${(be && be.agua) || 0}/8`, malo: false }; }
  if (g.mode !== 'survival' || !b.tier) return { t: b.name, malo: false };
  const held = g.inventory.held && getDef(g.inventory.held.id);
  if (held && held.tool === 'pickaxe' && held.tier >= b.tier) return { t: b.name, malo: false };
  return { t: `${b.name} · ⛏ pide ${NIVEL[b.tier] || 'un mejor pico'}`, malo: true };
}
export function tickMirando(g) {
  const el = g.ui.mirandoEl || (g.ui.mirandoEl = document.getElementById('mirando'));
  if (!el) return;
  const r = g.settings && g.settings.mirando === false ? null : textoMirando(g);
  const txt = r ? r.t : '';
  if (txt !== g.mirandoTxt) { g.mirandoTxt = txt; el.textContent = txt; el.classList.toggle('malo', !!(r && r.malo)); }
}

// ---------- herramienta gastada y su reemplazo ----------
export function avisarDesgaste(g, s) {
  const def = s && ITEMS[s.id];
  if (!def || !def.durability) return;
  const limite = Math.max(5, Math.round(def.durability * 0.1));
  // las herramientas ya avisan en indicadores.js; esto es para la armadura, que no se ve en la mano
  if (def.armor && s.dur === limite) { g.ui.toast(`🔧 ${def.name} ya casi se rompe (${s.dur}). Repárela en la cuadrícula con su material`, 2800); g.audio.play('hmm', { ui: true, vol: 0.25 }); }
}

// ---------- fijar una receta: lo que le falta queda en pantalla ----------
export function fijarReceta(g, r) {
  g.meta.recetaFija = g.meta.recetaFija === r.out[0] ? null : r.out[0];
  g.audio.play('select', { ui: true, vol: 0.3 });
  tickRecetaFija(g);
}
export function tickRecetaFija(g) {
  const el = document.getElementById('receta-fija');
  if (!el) return;
  const id = g.meta && g.meta.recetaFija;
  const r = id && RECIPES.find((x) => x.out[0] === id);
  if (!r || g.foto) { if (el.innerHTML) el.innerHTML = ''; g.recetaLista = false; return; }
  let html = `<b>📌 ${itemName(id)}</b>`, lista = true;
  const partes = [];
  for (const [ing, n] of ingredients(r)) {
    const hay = g.inventory.count(ing), ok = hay >= n;
    if (!ok) lista = false;
    partes.push(`<i class="${ok ? 'ok' : ''}">${itemName(ing)} ${Math.min(hay, n)}/${n}</i>`);
  }
  html += partes.join(' · ');
  if (html !== g.recetaHtml) { el.innerHTML = html; g.recetaHtml = html; }
  if (lista && !g.recetaLista) { g.ui.toast(`📌 ¡Ya tiene todo para ${itemName(id)}!`, 2200); g.audio.play('select', { ui: true, vol: 0.35 }); }
  g.recetaLista = lista;
}

// ---------- el reloj y el aviso de que se viene la noche ----------
const horaDe = (t) => { const m = Math.floor((((t + 0.25) % 1) * 24 * 60)); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m / 15) % 4 * 15).padStart(2, '0')}`; };
export function tickReloj(g) {
  const el = document.getElementById('reloj');
  if (!el) return;
  const ver = g.settings && g.settings.reloj !== false && !g.foto && !g.hudHidden && g.dim === 'tierra';
  const t = g.time || 0;
  const noche = t > 0.5 && t < 0.99, tarde = t > 0.42 && t <= 0.5;
  const txt = ver ? `${noche ? '🌙' : tarde ? '🌇' : '☀'} Día ${g.day || 1} · ${horaDe(t)}` : '';
  if (txt !== g.relojTxt) { g.relojTxt = txt; el.textContent = txt; el.classList.toggle('tarde', tarde); }
  if (g.mode !== 'survival' || g.dim !== 'tierra') return;
  const d = g.day || 1;
  if (tarde && t > 0.44 && g.avisoNoche !== d) {
    g.avisoNoche = d;
    // las primeras noches, un consejo concreto según lo que le falta (las noches son bravas desde la primera)
    if (d <= 3) {
      const inv = g.inventory, tiene = (f) => inv.slots.some((st) => st && f(st)) || [inv.armor && inv.armor[4]].some((st) => st && f(st));
      const arma = tiene((st) => { const df = ITEMS[st.id]; return df && (df.damage >= 4 || df.machete || (df.tool && /sword|axe/.test(df.key || ''))); });
      const luz = tiene((st) => st.id === BLOCK_BY_KEY.torch || st.id === BLOCK_BY_KEY.lamp);
      const H = g.meta.hist, casa = H && H.casa && H.construida;
      const falta = [!arma && 'una espada (de madera sirve: mesa de trabajo)', !luz && 'antorchas (carbón y un palo; donde hay luz no nacen Sombras)', !casa && 'un techo: la casa de la abuela (📖 en la brújula) o un hueco tapado'].filter(Boolean);
      g.ui.toast(falta.length ? `🌇 Ya casi oscurece y las noches son bravas. Le falta: ${falta.join('; ')}` : '🌇 Ya casi oscurece: con espada, luz y techo, aguante la noche', 6000);
    } else g.ui.toast('🌇 Ya casi oscurece: busque refugio, luz y algo de comer', 3000);
    g.audio.play('hmm', { ui: true, vol: 0.15 });
  }
}

// ---------- comer rápido: mantener la tecla come lo que mejor le rinde, sin tener que buscarlo, y vuelve a lo que tenía en la mano ----------
const CRUDO = { has: (id) => id === 262 || esPescado(id) }; // v12.7.0: la carne y todos los pescados crudos (blocks.js)
function mejorComida(g) {
  const inv = g.inventory, P = g.player, falta = 20 - P.food, ult = g.meta.comidas || [];
  let mejor = -1, puntos = -1;
  inv.slots.forEach((s, i) => {
    const d = s && ITEMS[s.id];
    if (!d || !d.food || CRUDO.has(s.id) || d.trip || d.guaro) return;
    const rinde = d.food + (ult.includes(s.id) ? 0 : 0.5); // entre iguales, la que no ha comido (por la variedad)
    // que llene sin desperdiciar, y entre iguales, la que está a mano
    const p = Math.min(rinde, falta) - Math.max(0, rinde - falta) * 0.25 + (i < 9 ? 0.1 : 0);
    if (p > puntos) { puntos = p; mejor = i; }
  });
  return mejor;
}
export function comerRapido(g) {
  if (g.mode !== 'survival' || g.eating || g.rapido || !g.player.alive) return;
  if (g.player.food >= 20) { g.ui.toast('🍽 No tiene hambre', 1200); return; }
  const inv = g.inventory, i = mejorComida(g);
  if (i < 0) { g.ui.toast('🍽 No anda nada listo para comer', 1600); return; }
  const prev = inv.selected, id = inv.slots[i].id;
  let cambio = null;
  if (i < 9) inv.selected = i;
  else { cambio = i; [inv.slots[prev], inv.slots[i]] = [inv.slots[i], inv.slots[prev]]; }
  g.rapido = { prev, cambio, code: tecla(g.settings, 'comer') };
  g.meta.comioRapido = true;
  g.eating = { t: 0, id, chew: 0 };
  inv.changed();
}
export function terminarRapido(g) {
  const R = g.rapido, inv = g.inventory;
  if (!R) return;
  g.rapido = null;
  if (R.cambio != null) [inv.slots[R.prev], inv.slots[R.cambio]] = [inv.slots[R.cambio], inv.slots[R.prev]]; // con la casilla de donde salió, aunque uno haya cambiado de mano
  inv.selected = R.prev;
  inv.changed();
}
// ---------- cosechar con azada en la mano resiembra sola, si anda semilla ----------
const SEMILLA = { corn: 267, beans: 269, pina: 466 };
export function resembrar(g, b, t, held) {
  if (!held || held.tool !== 'hoe' || !b.crop || b.stage !== 3) return;
  const semilla = SEMILLA[b.crop], nuevo = BLOCK_BY_KEY[`${b.crop}0`];
  if (!semilla || !nuevo || g.inventory.count(semilla) < 1) return;
  g.inventory.remove(semilla, 1);
  g.world.setBlock(t.x, t.y, t.z, nuevo, { updates: false });
  g.particles.burst(t.x + 0.5, t.y + 0.3, t.z + 0.5, [[0.5, 0.9, 0.4]], 5, 0.8);
  g.achieve('resiembra', 'Azada en mano');
}

// ---------- poner antorcha sin soltar lo que se tiene en la mano: en una cueva se usa a cada rato ----------
export function antorchaRapida(g) {
  if (g.eating || g.rapido || !g.player.alive) return;
  if (!g.target) { g.ui.toast('🔦 Apunte a un bloque para poner la antorcha', 1400); return; }
  const inv = g.inventory, i = inv.slots.findIndex((s) => s && s.id === BLOCK_BY_KEY.torch);
  if (i < 0 && g.mode === 'survival') { g.ui.toast('🔦 No anda antorchas', 1400); return; }
  if (i < 0) return;
  const prev = inv.selected;
  if (i < 9) inv.selected = i; else [inv.slots[prev], inv.slots[i]] = [inv.slots[i], inv.slots[prev]];
  g.useCd = 0;
  g.keys.add('ShiftLeft'); // para que ponga la antorcha aunque apunte a una puerta o a un cofre
  g.rightClick();
  g.keys.delete('ShiftLeft');
  if (i >= 9) [inv.slots[prev], inv.slots[i]] = [inv.slots[i], inv.slots[prev]];
  inv.selected = prev;
  inv.changed();
  g.useCd = 0.2;
  g.meta.antorchaRapida = true;
}

// ---------- con poca vida, el borde se pone rojo y se oye el corazón ----------
export function tickVidaBaja(g) {
  const P = g.player, baja = g.mode === 'survival' && P.alive && P.health <= P.maxHealth * 0.25;
  document.body.classList.toggle('vida-baja', baja);
  if (!baja) return;
  g.latidoT = (g.latidoT || 0) - 1;
  if (g.latidoT <= 0) { g.latidoT = 2; g.audio.play('latido', { ui: true, vol: 0.55 }); }
}

// ---------- traer de los cofres cercanos lo que le falta a la receta fijada ----------
export function cofresCerca(g) {
  const w = g.world, p = g.player.body.pos, L = [];
  for (let y = -3; y <= 3; y++) for (let z = -6; z <= 6; z++) for (let x = -6; x <= 6; x++) {
    const bx = Math.floor(p.x) + x, by = Math.floor(p.y) + y, bz = Math.floor(p.z) + z, be = w.getBE(bx, by, bz);
    if (be && (be.type === 'chest' || be.type === 'baul') && be.slots) L.push({ be, x: bx, y: by, z: bz });
  }
  return L;
}
// los cofres de la casa: puestos a mano (propio), sin los dos cofres de cada bolso (el bolso pone uno encima del otro)
export function cofresDeCasa(g) {
  const B = [g.meta.bolso, ...(g.meta.bolsos || [])].filter(Boolean);
  return cofresCerca(g).filter((c) => c.be.propio && !B.some((q) => q.x === c.x && q.z === c.z && (q.y === c.y || q.y + 1 === c.y)));
}
export function traerReceta(g) {
  const id = g.meta && g.meta.recetaFija, r = id && RECIPES.find((x) => x.out[0] === id);
  if (!r) return { n: 0, msg: '📌 Fije una receta primero (en el libro de recetas)' };
  const C = cofresCerca(g), inv = g.inventory;
  if (!C.length) return { n: 0, msg: 'No hay cofres a la mano' };
  let n = 0;
  for (const [ing, pide] of ingredients(r)) {
    let falta = pide - inv.count(ing);
    for (const c of C) {
      if (falta <= 0) break;
      for (let i = 0; i < c.be.slots.length && falta > 0; i++) {
        const s = c.be.slots[i];
        if (!s || s.id !== ing) continue;
        const k = Math.min(falta, s.count), sobra = inv.add(ing, k, s.dur, extras(s));
        const movido = k - sobra;
        s.count -= movido; falta -= movido; n += movido;
        if (s.count <= 0) c.be.slots[i] = null;
        g.world.touchBE(c.x, c.y, c.z);
        if (sobra) break;
      }
    }
  }
  return { n, msg: n ? `📌 Trajo ${n} de los cofres para ${itemName(id)}` : 'En los cofres de aquí no hay nada de lo que falta' };
}
