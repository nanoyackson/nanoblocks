// v13.1.2 (C4 de cuevas): la vida y el sonido de la cueva. Sin navegador: (1) los tres modelos se arman y traen lo que sus animaciones
// esperan; (2) el spawn respeta el tope total (6), el tope por zona (3 en 22 bloques) y el de cada especie (2), y no hace nada en el
// mundo de un invitado; (3) cada sitio recibe la especie que le toca (agua → cangrejo ciego, caliza → escarabajo, seco → grillo);
// (4) elegirEmisores nunca devuelve más de 3; (5) el color del brillo es el mismo en el mismo lugar y cambia con el bioma/región.
// Uso: node tools/revisar-cuevavida.mjs
import { CUEVA_FAUNA, TIPOS_CUEVA, cuevaFaunaSpawn, especieDelSitio, elegirEmisores, MAX_EMISORES, TOPE_TOTAL, TOPE_ZONA, TOPE_ESPECIE, colorBrillo, tamanoSala } from '../src/cuevavida.js';
import fs from 'node:fs';
import { BLOCK_BY_KEY as K, SOLID } from '../src/blocks.js';

let fallas = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fallas++; };

// entities.js trae textures.js (solo corre dentro de Vite): se mira el texto en vez de importarlo
const ent = fs.readFileSync(new URL('../src/entities.js', import.meta.url), 'utf8');
ok(TIPOS_CUEVA.length === 3 && ent.includes('...CUEVA_FAUNA') && ent.includes('cuevaFaunaSpawn(this, g)'), 'las 3 criaturas están en MOB_TYPES y el spawn está enganchado en entities.js');
const best = fs.readFileSync(new URL('../src/bestiario.js', import.meta.url), 'utf8');
ok(TIPOS_CUEVA.every((t) => best.includes(`  ${t}: '`)), 'cada criatura tiene su ficha en el bestiario');
for (const t of TIPOS_CUEVA) {
  const g = CUEVA_FAUNA[t].build(), u = g.userData;
  ok(g.children.length > 0 && u && u.body && Array.isArray(u.patas) && u.patas.length >= 4, `${t}: el modelo se arma con cuerpo y patas`);
  const m = { walk: 1, walkAmt: 1, t: 2, data: {} };
  let err = null; try { CUEVA_FAUNA[t].animate(m, 1 / 60, u); } catch (e) { err = e; }
  ok(!err, `${t}: animate corre sin error${err ? ' (' + err.message + ')' : ''}`);
}

// un mundo falso: piso de piedra en y=10, aire arriba; con un poco de agua y de calcita donde se pida
function mundo({ agua = false, calcita = false } = {}) {
  return { isLoaded: () => true, getBlock: (x, y, z) => (y <= 9 ? K.stone : y === 10 && agua && Math.abs(x) % 2 === 1 ? K.water : y === 11 && calcita && Math.abs(z) % 2 === 1 ? K.stalagmite : 0) };
}
function entorno(w, { invitado = false, mobs = [] } = {}) {
  const nacidos = [];
  const E = { mobs, spawnMob(t, x, y, z) { const m = { type: t, dead: false, body: { pos: { x, y, z } } }; mobs.push(m); nacidos.push(m); return m; } };
  const g = { dim: 'tierra', mode: 'creative', meta: { invitado }, env: { cave: 1 }, world: w, player: { body: { pos: { x: 0, y: 11, z: 0 } } }, clock: 0, day: 3, settings: {}, nearestVillage: () => null };
  return { E, g, nacidos };
}
// cuevaFaunaSpawn llama a Math.random: se fija para que la prueba sea repetible
let sem = 1; const rand = Math.random; Math.random = () => { sem = (sem * 16807) % 2147483647; return sem / 2147483647; };
{
  const { E, g, nacidos } = entorno(mundo());
  for (let i = 0; i < 400; i++) cuevaFaunaSpawn(E, g);
  const porEspecie = {}; for (const m of nacidos) porEspecie[m.type] = (porEspecie[m.type] || 0) + 1;
  ok(nacidos.length > 0 && nacidos.length <= TOPE_TOTAL, `400 intentos: nacen ${nacidos.length} (tope total ${TOPE_TOTAL})`);
  // zona: en cualquier círculo de 22 bloques no hay más de TOPE_ZONA
  let peorZona = 0, peorEspecie = 0;
  for (const a of nacidos) { const z = nacidos.filter((b) => Math.hypot(a.body.pos.x - b.body.pos.x, a.body.pos.z - b.body.pos.z) < 22); peorZona = Math.max(peorZona, z.length); for (const t of TIPOS_CUEVA) peorEspecie = Math.max(peorEspecie, z.filter((b) => b.type === t).length); }
  ok(peorZona <= TOPE_ZONA + 0 || nacidos.length <= TOPE_ZONA, `tope por zona: a lo más ${peorZona} cerca uno del otro (tope ${TOPE_ZONA}, medido alrededor de cada criatura)`);
  ok(peorEspecie <= TOPE_ESPECIE, `tope por especie en la zona: ${peorEspecie} (tope ${TOPE_ESPECIE})`);
}
{
  const { E, g, nacidos } = entorno(mundo(), { invitado: true });
  for (let i = 0; i < 100; i++) cuevaFaunaSpawn(E, g);
  ok(nacidos.length === 0, 'en el mundo de un invitado no nace nada (lo hace el anfitrión)');
  const s = entorno(mundo()); s.g.env.cave = 0.2; for (let i = 0; i < 100; i++) cuevaFaunaSpawn(s.E, s.g);
  ok(s.nacidos.length === 0, 'fuera de una cueva (env.cave < 0.6) no nace nada');
}
Math.random = rand;
ok(especieDelSitio(mundo({ agua: true }), 0, 11, 0) === 'cangrejo_ciego', 'junto al agua: cangrejo ciego');
ok(especieDelSitio(mundo({ calcita: true }), 0, 11, 0) === 'escarabajo_calcita', 'entre estalagmitas: escarabajo de calcita');
ok(especieDelSitio(mundo(), 0, 11, 0) === 'grillo_cueva', 'en lo seco: grillo de cueva');

// sonido: nunca más de 3 emisores
const fuentes = Array.from({ length: 25 }, (_, i) => ({ tipo: i % 2 ? 'gota' : 'agua', x: i * 5, y: 10, z: (i * 7) % 11 }));
const el = elegirEmisores(fuentes, { x: 0, y: 10, z: 0 });
ok(MAX_EMISORES === 3 && el.length === 3, `de ${fuentes.length} fuentes se eligen ${el.length} (máx ${MAX_EMISORES})`);
ok(el.every((f, i) => i === 0 || Math.hypot(f.x, f.z) >= Math.hypot(el[i - 1].x, el[i - 1].z)) && el[0] === fuentes[0], 'los elegidos son los más cercanos');
const aguas = Array.from({ length: 12 }, (_, i) => ({ tipo: 'agua', x: 1 + (i % 4), y: 10, z: Math.floor(i / 4) })), gotaLejos = { tipo: 'gota', x: 9, y: 10, z: 0 };
const mezcla = elegirEmisores([...aguas, gotaLejos], { x: 0, y: 10, z: 0 });
ok(mezcla.filter((f) => f.tipo === 'agua').length === 1 && mezcla.includes(gotaLejos), 'un charco de 12 bloques de agua cuenta como un emisor y deja oír el goteo');
ok(elegirEmisores([], { x: 0, y: 0, z: 0 }).length === 0 && elegirEmisores(fuentes.slice(0, 2), { x: 0, y: 0, z: 0 }).length === 2, 'con pocas fuentes o ninguna no inventa');

// eco: una sala chica da menos que una grande
const caja = (r, alto) => ({ getBlock: (x, y, z) => (Math.abs(x) > r || Math.abs(z) > r || y > alto || y < 0 ? K.stone : 0) });
const chica = tamanoSala(caja(2, 3), { x: 0.5, y: 0.5, z: 0.5 }), grande = tamanoSala(caja(30, 25), { x: 0.5, y: 0.5, z: 0.5 });
ok(chica < 0.3 && grande > 0.9 && chica < grande && SOLID[K.stone], `tamaño de sala: chica ${chica.toFixed(2)}, enorme ${grande.toFixed(2)}`);

// brillo por región
const a = colorBrillo('cristal', 'forest', 'guanacaste'), b = colorBrillo('cristal', 'forest', 'guanacaste'), c = colorBrillo('cristal', 'forest', 'caribe');
ok(a.join() === b.join() && a.join() !== c.join(), 'el cristal brilla del mismo color en la misma región y de otro en otra');
ok(colorBrillo('hongo', 'jungle').join() !== colorBrillo('hongo', 'desert').join() && colorBrillo('hongo', 'jungle').join() === colorBrillo('hongo', 'manglar').join(), 'el hongo cambia de color con el bioma');

process.exitCode = fallas ? 1 : 0;
console.log(fallas ? `\n✘ ${fallas} falla(s)` : '\nVida de la cueva: todo bien.');
