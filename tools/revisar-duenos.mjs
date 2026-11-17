// v13.4.3 (CC4): los dueños de los salones y lo que trae con ellos (brasa viva, cuerda de espeleólogo). Sin navegador, con un juego de mentira:
//  1) densidad por zona (plan §10: dueños por 1 000 trozos Z1 0, Z2 0,5-2,5, Z3 1,5-4,5), solo salones hondos, la Reina solo en la zona 3;
//  2) el anfitrión los hace aparecer una vez, el invitado no, uno vencido no regresa y solo con alguien cerca;
//  3) el Centinela no recibe golpes mientras queden racimos; la Madre pega 1 por segundo dentro de la nube, con tope de 3 por nube;
//  4) pagan como minijefes (el primero del día completo, los demás el 10 %), la brasa viva quema 8 ítems, la cuerda se craftea y se trepa.
// Uso: node tools/revisar-duenos.mjs
import { Generator } from '../src/worldgen.js';
import { GEN_RUTAS } from '../src/worldgen2.js';
import { DUENOS, duenoDe, tickDuenos, RACIMOS } from '../src/duenos.js';
import { JEFES_BALANCE } from '../src/jefes-balance.js';
import { PREMIO_BAJA, MINIJEFE, premioBaja } from '../src/precios.js';
import { FUEL, RECIPES } from '../src/recipes.js';
import { ITEMS, BLOCK_BY_KEY as K } from '../src/blocks.js';
import { Body } from '../src/physics.js';

let fallas = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fallas++; };

// 1) densidad: regiones de 96 × 96 (36 trozos cada una) en una ventana de 4 200 de lado alrededor del origen, 6 semillas, por zona de distancia al origen
const RC = 96, SEM = [101, 202, 303, 404, 505, 606];
const zonas = [{ n: 0, area: 0 }, { n: 0, area: 0 }, { n: 0, area: 0 }], porTipo = {}; let reinaZ2 = 0, piso = 0;
for (const seed of SEM) {
  const g = new Generator(seed, GEN_RUTAS, 'tierra', 'normal');
  for (let gz = -22; gz <= 22; gz++) for (let gx = -22; gx <= 22; gx++) {
    const n = g.v2.cmNodo(gx, gz), z = Math.hypot(gx * RC + RC / 2, gz * RC + RC / 2) < 300 ? 0 : Math.hypot(gx * RC + RC / 2, gz * RC + RC / 2) < 1000 ? 1 : 2;
    zonas[z].area += RC * RC / 256;
    const t = duenoDe(g, n); if (!t) continue;
    zonas[z].n++; porTipo[t] = (porTipo[t] || 0) + 1;
    if (n.dO >= 300 && n.dO < 1000 && t === 'reina_agujas') reinaZ2++;
    if (n.piso >= 30) piso++;
  }
}
const d1000 = (z) => 1000 * zonas[z].n / (zonas[z].area || 1);
console.log(`  dueños por 1 000 trozos: Z1 ${d1000(0).toFixed(2)}, Z2 ${d1000(1).toFixed(2)}, Z3 ${d1000(2).toFixed(2)} · por tipo ${JSON.stringify(porTipo)}`);
ok(zonas[0].n === 0, 'ninguno a menos de 300 del inicio');
ok(d1000(1) >= 0.4 && d1000(1) <= 2.5, `zona 2: ${d1000(1).toFixed(2)} por 1 000 trozos (0,4-2,5)`);
ok(d1000(2) >= 1.5 && d1000(2) <= 4.5, `zona 3: ${d1000(2).toFixed(2)} por 1 000 trozos (1,5-4,5)`);
ok(reinaZ2 === 0 && piso === 0, 'la Reina solo en la zona 3 y todos en salones de piso hondo (< 30)');
ok(['centinela_cristal', 'madre_esporal', 'reina_agujas'].every((t) => porTipo[t] > 0), 'salen los tres dueños');

// un juego de mentira con un anfitrión y un salón con dueño a la mano
const g0 = new Generator(101, GEN_RUTAS, 'tierra', 'normal');
let nodo = null, tipo = null;
outer: for (let gz = -30; gz <= 30; gz++) for (let gx = -30; gx <= 30; gx++) { const n = g0.v2.cmNodo(gx, gz), t = duenoDe(g0, n); if (t === 'centinela_cristal') { nodo = n; tipo = t; break outer; } }
function juego(extra = {}) {
  const bloques = new Map(), mobs = [], log = { toasts: [] };
  const L = nodo.lugar;
  const g = {
    dim: 'tierra', mode: 'survival', day: 1, meta: {}, shake: 0, otrosJugadores: () => [],
    player: { alive: true, body: { pos: { x: L.x + 5, y: L.y + 1, z: L.z } } },
    world: { gen: g0, getBlock: (x, y, z) => (bloques.has(`${x},${y},${z}`) ? bloques.get(`${x},${y},${z}`) : y < L.y ? 3 : 0), setBlock: (x, y, z, id) => bloques.set(`${x},${y},${z}`, id) },
    entities: { mobs, spawnMob: (t, x, y, z) => { const m = { type: t, dead: false, data: {}, kind: DUENOS[t], body: { pos: { x, y, z } } }; mobs.push(m); return m; } },
    ui: { toast: (t) => log.toasts.push(t) },
    ...extra,
  };
  return { g, mobs, bloques, log };
}
ok(!!nodo, 'hay un Candil con dueño cerca del inicio para probar');
{
  const { g, mobs, bloques } = juego();
  tickDuenos(g);
  ok(mobs.length === 1 && mobs[0].type === tipo && mobs[0].data.dueno === tipo, 'el anfitrión hace aparecer al dueño cuando alguien está a 30 del lugar');
  ok([...bloques.values()].filter((v) => v === K.cristal_bloque).length === RACIMOS.length, 'y el Centinela trae sus cuatro racimos de cristal');
  tickDuenos(g); ok(mobs.length === 1, 'no hace aparecer otro mientras hay uno vivo');
  const d = DUENOS.centinela_cristal, quien = mobs[0];
  ok(d.onHurt(quien, g) === false, 'el Centinela no recibe golpes con los racimos en pie');
  for (const k of [...bloques.keys()]) bloques.set(k, 0); // (se rompen los racimos)
  ok(d.onHurt(quien, g) === true, 'y los recibe cuando se rompen los cuatro');
  quien.dead = true; g.meta.duenosVencidos = { [quien.data.salon]: true };
  tickDuenos(g); ok(mobs.length === 1, 'uno vencido no regresa');
}
{ const { g, mobs } = juego({ meta: { invitado: true } }); tickDuenos(g); ok(mobs.length === 0, 'una persona invitada no hace aparecer dueños (los decide el anfitrión)'); }
{ const j = juego(); j.g.mode = 'creative'; tickDuenos(j.g); ok(j.mobs.length === 0, 'ni en creativo'); }
{ const j = juego(); j.g.player.body.pos.x += 80; tickDuenos(j.g); ok(j.mobs.length === 0, 'ni con nadie cerca (a 80)'); }

// 3) las esporas de la Madre: 1 de daño por segundo dentro de la nube, 3 como máximo por nube
{
  const daños = [];
  const { g } = juego({ damagePlayer: (n) => daños.push(n), addEffect() {}, particles: { burst() {} }, audio: { play() {} } });
  const m = { data: { nube: 0 }, body: { pos: { x: 0, y: 0, z: 0 } }, kind: { health: 85 }, attackCd: 9, moving: false };
  const c = { g, distP: 4, dxp: 1, dzp: 0, pl: { x: 2, y: 0, z: 0 } };
  for (let t = 0; t < 30; t += 0.25) DUENOS.madre_esporal.brain(m, 0.25, c);
  ok(daños.length >= 3 && daños.length <= 3 * 6 && daños.every((n) => n === 1), `la Madre Esporal pega 1 por segundo dentro de la nube (${daños.length} golpes en 30 s; tope 3 por nube)`);
}

// 4) los datos
for (const t of ['centinela_cristal', 'madre_esporal', 'reina_agujas']) {
  ok(JEFES_BALANCE[t] && JEFES_BALANCE[t].vida >= 80 && PREMIO_BAJA[t] && MINIJEFE.has(t), `${t}: vida ${JEFES_BALANCE[t] && JEFES_BALANCE[t].vida}, premio ${PREMIO_BAJA[t]} y minijefe`);
}
{
  const g = { meta: {}, day: 1 }, a = premioBaja({ type: 'reina_agujas', kind: { boss: true }, data: {} }, g), b = premioBaja({ type: 'madre_esporal', kind: { boss: true }, data: {} }, g);
  ok(a.completo && !b.completo && b.u <= 2, `el primero del día paga completo (${a.u} u) y el segundo el 10 % (${b.u} u)`);
}
ok(ITEMS[1200] && ITEMS[1200].key === 'brasa_viva' && FUEL[1200] === 80 && FUEL[1200] / FUEL[K.log] === 10, 'la brasa viva existe y es combustible (80, ≈ 8 ítems)');
ok(RECIPES.some((r) => r.out && r.out[0] === K.cuerda && r.out[1] === 6), 'la cuerda se craftea (3 cabuyas → 6)');
{
  const b = new Body(), mundo = { getBlock: (x, y, z) => (x === 0 && z === 0 && y >= 5 && y < 15 ? K.cuerda : 0), cajas: () => null };
  b.pos.x = 0.5; b.pos.z = 0.5; b.pos.y = 6;
  for (let i = 0; i < 20; i++) { b.enCuerda = true; b.vel.y = 3.2; b.step(mundo, 0.05); }
  ok(b.pos.y > 8, `colgado de la cuerda se sube (de 6 a ${b.pos.y.toFixed(1)})`);
  const y0 = b.pos.y; for (let i = 0; i < 20; i++) { b.enCuerda = true; b.vel.y = 0; b.step(mundo, 0.05); }
  ok(Math.abs(b.pos.y - y0) < 0.3, 'y quieto se sostiene');
}
console.log(fallas ? `\n✘ ${fallas} falla(s)` : '\nDueños de los salones: todo bien.');
process.exitCode = fallas ? 1 : 0;
