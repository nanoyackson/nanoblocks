// v12.16.1: la arena del Rey (src/reyfinal.js) tiene que RESTAURAR siempre el mundo. Un mundo falso (mapa de bloques con colinas, un cofre con
// datos y un trozo sin cargar) y un «juego» mínimo: armar, terminar/morir/salir/cerrar la pestaña (el diario viaja en meta como JSON) y
// comprobar que cada bloque vuelve a su sitio, que la Corona no se pierde y que un invitado no arma nada. Uso: node tools/revisar-rey.mjs
import { BLOCK_BY_KEY as K } from '../src/blocks.js';
import { armarRedondel, restaurarRedondel, limpiarRey, cuadroRey, alFase, reyVencido, MAX_CAMBIOS, ID_CORONA } from '../src/reyfinal.js';

const err = []; const ok = (c, m) => { if (!c) err.push(m); };
const fake = () => {
  const bl = new Map(), be = new Set(), mods = new Map(), cambios = [];
  const get = (x, y, z) => bl.get(`${x},${y},${z}`) ?? 0;
  for (let x = -40; x <= 40; x++) for (let z = -40; z <= 40; z++) { const h = 60 + Math.round(Math.sin(x / 7) * 2 + Math.cos(z / 9) * 2) + (x > 20 ? 6 : 0); for (let y = 1; y <= h; y++) bl.set(`${x},${y},${z}`, y === h ? K.grass : K.stone); }
  bl.set('3,61,3', K.stone); be.add('2,62,2'); bl.set('2,62,2', K.cobble); // un bloque con datos (no se debe tocar)
  const w = {
    isLoaded: (x) => x < 36, getBlock: get, getBE: (x, y, z) => (be.has(`${x},${y},${z}`) ? {} : null),
    setBlock: (x, y, z, id) => { cambios.push(1); if (id === 0) bl.delete(`${x},${y},${z}`); else bl.set(`${x},${y},${z}`, id); },
    aplicarRemoto: (x, y, z, id) => { mods.set(`${x},${y},${z}`, id); if (id === 0) bl.delete(`${x},${y},${z}`); else bl.set(`${x},${y},${z}`, id); },
  };
  return { w, bl, cambios, mods };
};
const juego = (F, extra = {}) => ({
  world: F.w, meta: { reyArena: null, ...(extra.meta || {}) }, dim: 'tierra', mode: 'survival', paused: false, rey: null,
  player: { alive: true, body: { pos: { x: 0.5, y: 62.0, z: 0.5 }, vel: { x: 0, y: 0, z: 0 } } },
  entities: { mobs: [{ type: 'rey_zopilote', dead: false, data: {} }], items: [] },
  inventory: { slots: [null], add(id, n) { this.slots[0] = { id, count: n }; return 0; }, changed() {} },
  ui: { toast() {} }, audio: { play() {} }, particles: { spawn() {} }, red: null, rayosRey: [1],
});
const foto = (F) => [...F.bl.entries()].sort().map(([k, v]) => `${k}=${v}`).join('|');
const jug = (g) => { const m = g.entities.mobs[0]; return !m.dead; };

// 1) armar y terminar (el Rey cae sin que se venza: se fue)
{
  const F = fake(), antes = foto(F), g = juego(F);
  g.entities.mobs[0].dead = false;
  ok(armarRedondel(g, 0.5, 62, 0.5, 0, 1), 'armarRedondel no armó');
  const n = g.rey.diario.size;
  ok(n > 500 && n <= MAX_CAMBIOS, `el diario tiene ${n} cambios (debe ser 500–${MAX_CAMBIOS})`);
  ok(foto(F) !== antes, 'armar no cambió nada');
  ok(g.meta.reyArena && g.meta.reyArena.d.length === n, 'meta.reyArena no tiene el diario');
  ok(F.bl.get('2,62,2') === K.cobble, 'se tocó el bloque con datos');
  ok(g.rey.faroles.length === 8 && g.rey.faroles.every((f) => F.bl.get(`${f.x},${f.y},${f.z}`) === K.farol), 'faltan faroles en el redondel');
  ok(F.bl.get(`${g.rey.cx},${g.rey.fy + 3},${g.rey.cz}`) === K.farol && F.bl.get(`${g.rey.cx},${g.rey.fy + 2},${g.rey.cz}`) === K.cobble, 'falta el altar');
  ok([...g.rey.diario.values()].some(([, y]) => y === g.rey.fy - 6), 'falta la cornisa de seguridad');
  g.rey.cola = []; g.inventory.slots[0] = null;
  restaurarRedondel(g, 'fin');
  ok(foto(F) === antes, 'tras restaurar el mundo NO quedó idéntico (hay cráter o bloques fantasma)');
  ok(g.rey === null && g.meta.reyArena === null, 'quedó estado después de restaurar');
  ok(g.inventory.slots[0] && g.inventory.slots[0].id === ID_CORONA, 'la Corona no volvió');
  ok(!jug(g), 'el Rey quedó vivo después de restaurar sin vencerlo');
  // v12.16.4: el redondel ENTERO cabe con margen bajo el tope: altar, 8 faroles y cornisa están (en una ladera el piso despeja más)
  ok(n < MAX_CAMBIOS * 0.6, `el diario llega a ${n} de ${MAX_CAMBIOS}: sin margen`);
  console.log(`armar/restaurar: ${n} cambios, mundo idéntico`);
}
// 2) el anillo se achica en las fases 2 y 3 y aun así restaura todo (con el diario sellado)
{
  const F = fake(), antes = foto(F), g = juego(F);
  armarRedondel(g, 0.5, 62, 0.5, 0, 1);
  alFase(g, 2); alFase(g, 3);
  for (let i = 0; i < 300; i++) cuadroRey(g, 0.1);
  ok(g.rey && g.rey.R <= 18, `el anillo no se achicó (R=${g.rey && g.rey.R})`);
  restaurarRedondel(g, 'muerte');
  ok(foto(F) === antes, 'tras achicar y restaurar el mundo no quedó idéntico');
  console.log('anillo achicado y restaurado');
}
// 3) cerrar la pestaña en plena pelea: el diario viaja como JSON en meta y el mundo (modificado) se limpia al volver
{
  const F = fake(), antes = foto(F), g1 = juego(F);
  armarRedondel(g1, 0.5, 62, 0.5, 0, 1);
  const guardado = JSON.parse(JSON.stringify(g1.meta));
  const g2 = juego(F, { meta: guardado }); g2.entities.mobs = []; g2.inventory.slots[0] = null; // partida nueva: sin Rey ni estado
  cuadroRey(g2, 0.1);
  ok(foto(F) === antes, 'al cargar un mundo guardado en plena pelea no se restauró');
  ok(g2.meta.reyArena === null, 'quedó el diario después de cargar');
  ok(g2.inventory.slots[0] && g2.inventory.slots[0].id === ID_CORONA, 'al cargar no volvió la Corona');
  console.log('mundo guardado en plena pelea: limpio al cargar');
}
// 4) morir: el redondel sigue mientras está muerta y se deshace al revivir; la Corona tirada no se duplica
{
  const F = fake(), antes = foto(F), g = juego(F);
  armarRedondel(g, 0.5, 62, 0.5, 0, 1);
  g.player.alive = false; cuadroRey(g, 0.1);
  ok(g.rey, 'se restauró estando muerta (los objetos del suelo se perderían)');
  g.entities.items.push({ id: ID_CORONA, dead: false });
  g.player.alive = true; g.inventory.slots[0] = null; cuadroRey(g, 0.1);
  ok(foto(F) === antes, 'tras morir y revivir el mundo no quedó idéntico');
  ok(g.entities.items[0].dead, 'la Corona tirada no se recogió (se duplicaría)');
  ok(g.inventory.slots[0] && g.inventory.slots[0].id === ID_CORONA, 'al morir no volvió la Corona');
  console.log('morir: restaurado al revivir, Corona única');
}
// 5) salir al menú, vencer y cambio de dimensión
{
  const F = fake(), antes = foto(F), g = juego(F);
  armarRedondel(g, 0.5, 62, 0.5, 0, 1); limpiarRey(g);
  ok(foto(F) === antes && !g.rey && !g.meta.reyArena, 'salir al menú no dejó el mundo limpio');
  const g2 = juego(F); armarRedondel(g2, 0.5, 62, 0.5, 0, 1); g2.dim = 'inframundo'; cuadroRey(g2, 0.1);
  ok(foto(F) === antes, 'cambiar de dimensión no restauró');
  const g3 = juego(F); armarRedondel(g3, 0.5, 62, 0.5, 0, 1); reyVencido(g3); g3.inventory.slots[0] = null; g3.entities.mobs[0].data.vencido = true;
  cuadroRey(g3, 20); ok(g3.rey, 'se restauró antes de tiempo con el Rey vencido');
  cuadroRey(g3, 30);
  ok(foto(F) === antes && !g3.rey, 'vencido: pasado el plazo no se restauró');
  ok(!g3.inventory.slots[0], 'con el Rey vencido la Corona no debe volver');
  console.log('salir, dimensión y victoria: restaurado');
}
// 6) invitado: no arma ni restaura; trozo sin cargar: se restaura en los cambios del mundo
{
  const F = fake(), g = juego(F, { meta: { invitado: true } });
  ok(!armarRedondel(g, 0.5, 62, 0.5, 0, 1) && !g.rey, 'un invitado armó la arena');
  const H = fake(), antes = foto(H), h = juego(H);
  h.player.body.pos.x = 30.5; armarRedondel(h, 30.5, 62, 0.5, 0, 1); // la mitad del redondel cae en un trozo sin cargar (x ≥ 36)
  restaurarRedondel(h, 'fin');
  ok(foto(H) === antes, 'con un trozo sin cargar el mundo no quedó idéntico');
  console.log('invitado y trozos sin cargar: bien');
}
if (err.length) { console.log('\n✘ ' + err.join('\n✘ ')); process.exitCode = 1; } else console.log('Arena del Rey: restaura siempre.');
