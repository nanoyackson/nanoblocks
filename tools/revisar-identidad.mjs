// v13.3.5 (BI0): la identidad de cada bioma en tiempo real (src/identidad.js). Con un juego de mentira (sin navegador):
//  1) los ítems y la receta del té existen; 2) cada recurso sale solo en su bioma y solo en supervivencia; 3) todos los biomas que genera el
//  mundo tienen su nota de libreta y sale una sola vez; 4) la fauna nueva respeta sus topes, la hora y los peligros; 5) el té calma.
// Uso: node tools/revisar-identidad.mjs
import { Generator } from '../src/worldgen.js';
import { ITEMS, BLOCK_BY_KEY as K, BLOCKS } from '../src/blocks.js';
import { RECIPES } from '../src/recipes.js';
import { alPicarBioma, identidadSpawn, tickIdentidad, alComerIdentidad, NOTAS, ORQUIDEA, TUNA, COCO, TE_ORQUIDEA } from '../src/identidad.js';

let fallas = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fallas++; };

ok([ORQUIDEA, TUNA, COCO, TE_ORQUIDEA].every((id) => ITEMS[id] && ITEMS[id].key), 'orquídea, tuna, coco y té de orquídea existen');
ok(ITEMS[TUNA].food > 0 && ITEMS[COCO].food > 0 && ITEMS[TE_ORQUIDEA].food > 0 && !ITEMS[ORQUIDEA].food, 'la tuna, el coco y el té se comen; la orquídea no');
ok(RECIPES.some((r) => r.cook && r.out[0] === TE_ORQUIDEA && r.items.includes(ORQUIDEA) && r.items.includes(299)), 'té de orquídea = orquídea + agua dulce (fogón)');

// un juego de mentira con un bioma fijo
function juego(bio, extra = {}) {
  const log = { drops: [], notas: [], toasts: [], efectos: [], logros: [], mobs: [] };
  const mobs = [];
  const g = {
    dim: 'tierra', mode: 'survival', day: 1, daylight: 1, settings: { hostiles: true }, meta: { dificultad: 'normal' }, env: { cave: 0 },
    player: { alive: true, body: { pos: { x: 100, y: 70, z: 100 } } },
    world: { gen: { column: () => ({ biome: bio === 'paramo' ? 'mountains' : bio, h: bio === 'paramo' ? 110 : 70 }) }, isLoaded: () => true, getBlock: (x, y) => (y < 70 ? 3 : 0) },
    entities: { dropItem: (id, n) => log.drops.push([id, n]), mobs, spawnMob: (t) => { const m = { type: t, dead: false }; mobs.push(m); log.mobs.push(t); return m; } },
    ui: { toast: (t) => log.toasts.push(t) }, addEffect: (e, s) => log.efectos.push([e, s]), achieve: (k) => log.logros.push(k),
    ...extra,
  };
  return { g, log, E: g.entities };
}
const B = (k) => BLOCKS[K[k]];
const hoja = { key: 'leaves', leafy: true };
const siempre = () => 0, nunca = () => 0.999;

// 2) los recursos
const caso = (bio, bloque, azar, esperado, etiqueta) => { const { g, log } = juego(bio); const r = alPicarBioma(g, bloque, 1, 70, 1, azar); ok((esperado === null ? r === null && log.drops.length === 0 : r === esperado && log.drops.length >= 1), etiqueta); return log; };
caso('desert', B('cactus'), siempre, 'tuna', 'el cactus del desierto suelta tuna');
caso('plains', B('cactus'), siempre, 'tuna', 'el cactus suelta tuna donde sea (los cactus son del desierto)');
caso('nuboso', hoja, siempre, 'orquidea', 'las hojas del bosque nuboso sueltan orquídea');
caso('desert', hoja, siempre, null, 'las hojas del desierto no sueltan nada');
caso('beach', hoja, siempre, 'coco', 'las palmas de la playa sueltan coco');
caso('forest', hoja, siempre, null, 'las hojas del bosque no sueltan coco ni orquídea');
caso('jungle', hoja, siempre, 'cacao', 'las hojas de la selva sueltan cacao');
caso('paramo', B('stone'), siempre, 'cristal_altura', 'la roca del páramo suelta esquirlas');
caso('plains', B('stone'), siempre, null, 'la roca de la llanura no');
caso('nuboso', hoja, nunca, null, 'y casi nunca: con mala suerte no sale nada');
{ const { g, log } = juego('nuboso', { mode: 'creative' }); alPicarBioma(g, hoja, 1, 70, 1, siempre); ok(log.drops.length === 0, 'en creativo no se suelta nada'); }
// la frecuencia real
{ const { g, log } = juego('nuboso'); for (let i = 0; i < 4000; i++) alPicarBioma(g, hoja, 1, 70, 1); const f = log.drops.length / 4000; ok(f > 0.05 && f < 0.11, `orquídeas: ${(100 * f).toFixed(1)} % de las hojas del nuboso (5-11 %)`); }
{ const { g, log } = juego('desert'); for (let i = 0; i < 2000; i++) alPicarBioma(g, B('cactus'), 1, 70, 1); const f = log.drops.length / 2000; ok(f > 0.38 && f < 0.52, `tuna: ${(100 * f).toFixed(0)} % de los cactus (38-52 %)`); }

// 3) las notas: todos los biomas que el mundo genera
const vistos = new Set();
for (const seed of [101, 202, 303]) { const g = new Generator(seed, 26, 'tierra', 'normal'); for (let x = -1200; x < 1200; x += 24) for (let z = -1200; z < 1200; z += 24) { const c = g.column(x, z); vistos.add(c.biome === 'paramo' || c.h > 98 ? 'paramo' : c.biome); } }
const BASE = ['ocean', 'plains', 'forest']; // el mar y los dos biomas de arranque (llanura y bosque) no llevan nota: la libreta de la primera noche ya los cubre
  const sinNota = [...vistos].filter((b) => !BASE.includes(b) && !NOTAS[b]);
ok(sinNota.length === 0, `todos los biomas con identidad (${[...vistos].filter((b) => !BASE.includes(b)).join(', ')}) tienen su nota${sinNota.length ? ' · faltan: ' + sinNota.join(', ') : ''}`);
{
  const { g } = juego('desert'); g.meta.diario = [];
  for (let t = 0; t < 10; t += 0.5) tickIdentidad(g, 0.5);
  ok(g.meta.diario.length === 1 && /tuna/.test(g.meta.diario[0].t), 'al pisar el desierto la libreta anota una nota (y una sola vez)');
  g.world.gen.column = () => ({ biome: 'nuboso', h: 70 });
  for (let t = 0; t < 5; t += 0.5) tickIdentidad(g, 0.5);
  ok(g.meta.diario.length === 2 && /orqu/i.test(g.meta.diario[1].t), 'y otra distinta al entrar al nuboso');
  const inv = juego('desert', { meta: { dificultad: 'normal', invitado: true, diario: [] } }); for (let t = 0; t < 5; t += 0.5) tickIdentidad(inv.g, 0.5);
  ok(inv.g.meta.diario.length === 0, 'el invitado no anota (su libreta es la suya)');
}

// 4) la fauna
function nace(bio, hora, extra = {}, intentos = 400) {
  const j = juego(bio, extra); j.g.daylight = hora;
  for (let i = 0; i < intentos; i++) identidadSpawn(j.E, j.g);
  return j;
}
{
  const d = nace('desert', 1); const cuenta = (t) => d.log.mobs.filter((m) => m === t).length;
  ok(cuenta('zorro_pelon') === 2 && cuenta('armadillo') === 2, `en el desierto de día nacen zorros pelones y armadillos, máximo 2 de cada (${cuenta('zorro_pelon')} y ${cuenta('armadillo')})`);
  const n = nace('desert', 0.1); ok(n.log.mobs.every((m) => m === 'armadillo') && n.log.mobs.length === 2, 'de noche solo el armadillo (el zorro duerme)');
  const p = nace('paramo', 1); ok(p.log.mobs.length === 2 && p.log.mobs.every((m) => m === 'coyote'), 'en el páramo, coyotes (máximo 2)');
  const pp = nace('paramo', 1, { mode: 'creative' }); ok(pp.log.mobs.length === 0, 'sin peligros (creativo) no hay coyotes');
  const pq = nace('paramo', 1, { settings: { hostiles: false } }); ok(pq.log.mobs.length === 0, 'ni con los hostiles apagados');
  const nb = nace('nuboso', 0.1); ok(nb.log.mobs.length === 3 && nb.log.mobs.every((m) => m === 'rana_dardo'), 'en el nuboso, ranas dardo (máximo 3, también de noche)');
  const o = nace('forest', 1); ok(o.log.mobs.length === 0, 'en el bosque no agrega nada (ya tiene su fauna)');
  const iv = nace('desert', 1, { meta: { dificultad: 'normal', invitado: true } }); ok(iv.log.mobs.length === 0, 'el invitado no hace nacer nada');
}
// 5) el té
{ const { g, log } = juego('nuboso'); alComerIdentidad(g, TE_ORQUIDEA); ok(log.efectos.some(([e, s]) => e === 'calma' && s === 90) && log.logros.includes('te_orquidea'), 'el té de orquídea da calma 90 s y un logro'); alComerIdentidad(g, TUNA); ok(log.efectos.length === 1, 'la tuna no da efectos'); }

console.log(fallas ? `\n✘ ${fallas} falla(s)` : '\nIdentidad de los biomas: todo bien.');
process.exitCode = fallas ? 1 : 0;
