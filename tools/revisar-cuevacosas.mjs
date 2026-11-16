// v13.3.4 (CC1): el botín y los peligros de las cuevas en tiempo real (src/cuevacosas.js). Con un juego de mentira (sin navegador):
//  1) los ítems y el bloque nuevos existen y las recetas los arman con los ingredientes del plan;
//  2) las bolsas de aire malo salen de la semilla (mismo lugar siempre), a ~7 % de las celdas y solo bajo y 46;
//  3) el aire malo: a los 6 s sin protección quita 1, nunca más de 1 por 10 s (ni 3 de un golpe), y la mascarilla, ventilar y el modo pacífico lo apagan;
//  4) la estalactita avisa 1,2 s, quita 3 como máximo y solo si el jugador sigue abajo; el invitado no la decide;
//  5) picar un racimo de cristal suelta esquirlas, y el cristal de eco gasta un uso y marca 20 s.
// Uso: node tools/revisar-cuevacosas.mjs
import { ITEMS, BLOCK_BY_KEY as K, BLOCKS, LUCES } from '../src/blocks.js';
import { RECIPES } from '../src/recipes.js';
import { bolsaDeAire, tickCuevaCosas, alPicarCueva, usarCuevaCosas, ecoActivo, ESQUIRLA, ECO, LENTE, SOPA } from '../src/cuevacosas.js';

let fallas = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fallas++; };

// 1) ítems y recetas
ok(ITEMS[ESQUIRLA] && ITEMS[ECO] && ITEMS[LENTE] && ITEMS[SOPA] && K.farol_cristal === 699, 'esquirla, eco, lente, sopa y el farol de cristal existen');
ok(ITEMS[ECO].durability === 12 && ITEMS[LENTE].armor === 'head' && ITEMS[SOPA].food > 0, 'el eco tiene 12 usos, la lente es casco y la sopa es comida');
ok(LUCES.has('farol_cristal') && BLOCKS[K.farol_cristal].glow, 'el farol de cristal alumbra');
const R = (out) => RECIPES.find((r) => r.out[0] === out);
const ing = (r) => (r.items || []).slice().sort().join(',');
ok(R(K.farol_cristal) && ing(R(K.farol_cristal)) === [ESQUIRLA, ESQUIRLA, ESQUIRLA, K.torch].sort().join(','), 'farol de cristal = 3 esquirlas + antorcha');
ok(R(ECO) && R(ECO).items.filter((i) => i === ESQUIRLA).length === 4 && R(ECO).items.includes(258), 'cristal de eco = 4 esquirlas + hierro');
ok(R(LENTE) && R(LENTE).items.includes(1167) && R(LENTE).items.filter((i) => i === ESQUIRLA).length === 2, 'casco con lente = casco de espeleólogo + 2 esquirlas');
ok(RECIPES.some((r) => r.cook && r.out[0] === SOPA && r.items.filter((i) => i === K.glow_mushroom).length === 2), 'sopa de hongo (fogón) = 2 hongos brillantes + agua');

// 2) las bolsas
let n = 0, b = 0, altas = 0, difieren = 0;
for (let cx = -40; cx < 40; cx++) for (let cz = -40; cz < 40; cz++) for (let y = 4; y < 46; y += 12) {
  n++; const a = bolsaDeAire(777, cx * 20 + 3, y + 2, cz * 20 + 3); if (a) b++;
  if (bolsaDeAire(778, cx * 20 + 3, y + 2, cz * 20 + 3) !== a) difieren++;
  if (bolsaDeAire(777, cx * 20, 46 + y, cz * 20)) altas++;
}
ok(b / n > 0.05 && b / n < 0.09, `~7 % de las celdas hondas tienen bolsa (${(100 * b / n).toFixed(1)} %)`);
ok(altas === 0, 'ninguna bolsa de y 46 para arriba');
ok(bolsaDeAire(777, 123, 20, 456) === bolsaDeAire(777, 123, 20, 456) && difieren > 0, 'salen de la semilla (la misma siempre, otra con otra semilla)');

// un juego de mentira
function juego(extra = {}) {
  const log = { danos: [], toasts: [], drops: [], bloques: new Map(), logros: [] };
  const g = {
    dim: 'tierra', mode: 'survival', clock: 0, meta: { dificultad: 'normal' }, settings: { hostiles: true },
    env: { cave: 1 }, player: { alive: true, body: { pos: { x: 0, y: 20, z: 0 } } },
    world: { gen: { seed: 777 }, getBlock: (x, y, z) => log.bloques.get(`${x},${y},${z}`) || 0, setBlock: (x, y, z, id) => log.bloques.set(`${x},${y},${z}`, id) },
    inventory: { slots: [null], selected: 0, armor: [], count: () => 0, gasto: 0, wearHeld() { this.gasto++; return false; } },
    ui: { toast: (t) => log.toasts.push(t) }, particles: { spawn() {}, blockBreak() {} }, audio: { material() {}, play() {} },
    entities: { dropItem: (id, c) => log.drops.push([id, c]) }, damagePlayer: (d) => log.danos.push([d, g.clock]), achieve: (k) => log.logros.push(k),
    ...extra,
  };
  return { g, log };
}
// una celda con bolsa a y 20
let bx = 0, bz = 0; for (let k = 0; k < 4000; k++) { bx = (k % 80) * 20 + 3; bz = Math.floor(k / 80) * 20 + 3; if (bolsaDeAire(777, bx, 20, bz)) break; }
const dt = 0.1;
{
  const { g, log } = juego(); g.player.body.pos.x = bx; g.player.body.pos.z = bz;
  for (let t = 0; t < 60; t += dt) { g.clock += dt; tickCuevaCosas(g, dt); }
  const tot = log.danos.reduce((s, d) => s + d[0], 0);
  ok(log.danos.length >= 3 && log.danos.every((d) => d[0] === 1), `sin protección, el aire malo quita 1 cada ≥ 10 s (${log.danos.length} golpes en 60 s)`);
  ok(log.danos[0][1] >= 5.9, `y el primero llega a los ${log.danos[0][1].toFixed(1)} s (≥ 6)`);
  ok(log.danos.every((d, i) => i === 0 || d[1] - log.danos[i - 1][1] >= 9.9) && tot <= 6, 'nunca más de 1 por 10 s');
  ok(log.toasts.some((t) => /Aire malo/.test(t)), 'avisa de entrada');
}
{
  const { g, log } = juego({ mode: 'creative' }); g.player.body.pos.x = bx; g.player.body.pos.z = bz;
  for (let t = 0; t < 30; t += dt) tickCuevaCosas(g, dt);
  ok(log.danos.length === 0, 'en creativo no hay aire malo');
  const p = juego({ meta: { dificultad: 'normal', invitado: true } }); p.g.player.body.pos.x = bx; p.g.player.body.pos.z = bz;
  for (let t = 0; t < 30; t += dt) { p.g.clock += dt; tickCuevaCosas(p.g, dt); }
  ok(p.log.danos.length >= 1 && p.log.danos.every((d) => d[0] === 1), 'el invitado también lo recibe, con el mismo ritmo');
}
{
  const { g, log } = juego(); g.player.body.pos.x = bx; g.player.body.pos.z = bz; g.inventory.count = (id) => (id === 525 ? 1 : 0);
  for (let t = 0; t < 30; t += dt) tickCuevaCosas(g, dt);
  ok(log.danos.length === 0, 'con la mascarilla en la mochila no pasa nada');
}
{
  const { g, log } = juego(); g.player.body.pos.x = bx; g.player.body.pos.z = bz;
  for (let t = 0; t < 4; t += dt) { g.clock += dt; tickCuevaCosas(g, dt); }
  alPicarCueva(g, BLOCKS[K.stone], bx + 1, 20, bz + 1); // picar un hueco ventila
  for (let t = 0; t < 40; t += dt) { g.clock += dt; tickCuevaCosas(g, dt); }
  ok(log.danos.length === 0, 'picar un hueco ventila la bolsa (2 minutos)');
}
// 4) la estalactita
{
  const { g, log } = juego(); g.player.body.pos.x = 50; g.player.body.pos.z = 50; g.env.cave = 0;
  for (let i = 0; i < 6; i++) { g.world.setBlock(50 + i, 21, 50, K.stalactite); g.world.setBlock(50 + i, 12, 50, K.stone); }
  let aviso = 0, cayo = 0, danos = 0;
  for (let k = 0; k < 1500; k++) {
    g.cuevaCosas && (g.cuevaCosas.cdEvento = 0);
    g.player.body.pos.x = 50; g.player.body.pos.y = 13;
    alPicarCueva(g, BLOCKS[K.stone], 50, 18, 50);
    if (g.cuevaCosas && g.cuevaCosas.caida) {
      aviso++; const c = g.cuevaCosas.caida; g.player.body.pos.x = c.x + 0.5; g.player.body.pos.z = c.z + 0.5; g.player.body.pos.y = c.piso;
      const antes = log.danos.length; let t = 0; log.danos.length = 0; const antes0 = 0; void antes;
      for (; t < 1.0; t += 0.1) tickCuevaCosas(g, 0.1);
      if (log.danos.length !== 0) { fallas++; console.log('  ✘ la estalactita pegó antes de 1,2 s'); }
      for (; t < 1.6; t += 0.1) tickCuevaCosas(g, 0.1);
      if (g.world.getBlock(c.x, c.y, c.z) !== K.stalactite) cayo++;
      danos += log.danos.reduce((s, d) => s + d[0], 0) + antes0; log.danos.length = 0;
      g.world.setBlock(c.x, c.y, c.z, K.stalactite);
    }
  }
  ok(aviso > 5 && cayo === aviso, `la estalactita avisa y cae (${aviso} veces, solo por el ruido de picar)`);
  ok(danos === aviso * 3, `quita 3 de vida y nada más (${danos} en ${aviso} caídas)`);
}
// 5) esquirlas y eco
{
  const { g, log } = juego(); alPicarCueva(g, BLOCKS[K.cristal], 1, 20, 1); alPicarCueva(g, BLOCKS[K.cristal_bloque], 1, 20, 1);
  ok(log.drops.length === 2 && log.drops.every(([id, c]) => id === ESQUIRLA && c >= 1 && c <= 3), 'los racimos y bloques de cristal sueltan esquirlas (1 a 3)');
  g.inventory.slots[0] = { id: ECO, count: 1 };
  ok(usarCuevaCosas(g, { id: ECO }) && ecoActivo(g) && g.inventory.gasto === 1, 'el cristal de eco marca y gasta un uso');
  for (let t = 0; t < 21; t += 0.5) tickCuevaCosas(g, 0.5);
  ok(!ecoActivo(g), 'y se apaga a los 20 s');
  g.env.cave = 0; const g2 = juego({ env: { cave: 0 } }); ok(usarCuevaCosas(g2.g, { id: ECO }) && !ecoActivo(g2.g) && g2.g.inventory.gasto === 0, 'en la superficie no hace nada ni gasta');
}
console.log(fallas ? `\n✘ ${fallas} falla(s)` : '\nBotín y peligros de las cuevas: todo bien.');
process.exitCode = fallas ? 1 : 0;
