// v13.1.1 (C3 de cuevas): los tres sitios kársticos (generador 22). Para varias semillas busca un sitio de cada tipo y comprueba que:
// (1) salen un cofre por sitio y el botín es idéntico generando con otro Generator y en otro orden de trozos (lo que hace falta en red:
//     cada máquina genera el terreno sola); (2) el cofre se alcanza a pie desde la boca (flujo por aire y agua); (3) los mundos de
//     generador 21 no los tienen; (4) tienen nombre, rareza y placa. Uso: node tools/revisar-karst.mjs
import { Generator } from '../src/worldgen.js';
import { structuresNear, STRUCT_NAMES, STRUCT_RARE } from '../src/estructuras.js';
import { OPAQUE, BLOCK_BY_KEY as K } from '../src/blocks.js';

const TIPOS = ['cueva_barra_honda', 'cueva_venado', 'geoda_mayor'];
// dónde cae el cofre de cada sitio (x, y y z locales, como en src/cuevas.js): se compara contra los cofres generados (las ruinas también traen cofres)
const COFRE = { cueva_barra_honda: [0, -19, -21], cueva_venado: [5, -17, -30], geoda_mayor: [0, -16, -10] };
const rot = (dx, dz, r) => (r === 0 ? [dx, dz] : r === 1 ? [-dz, dx] : r === 2 ? [-dx, -dz] : [dz, -dx]);
let fallas = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fallas++; };

function generar(gen, P, R, orden) {
  const c0x = Math.floor((P.x - R) / 16), c1x = Math.floor((P.x + R) / 16), c0z = Math.floor((P.z - R) / 16), c1z = Math.floor((P.z + R) / 16);
  const lista = [];
  for (let cz = c0z; cz <= c1z; cz++) for (let cx = c0x; cx <= c1x; cx++) lista.push([cx, cz]);
  if (orden) lista.reverse();
  const W = (c1x - c0x + 1) * 16, Hh = (c1z - c0z + 1) * 16, mundo = new Uint16Array(W * Hh * 128), cofres = [], placas = [];
  const buf = new Uint16Array(16 * 16 * 128);
  for (const [cx, cz] of lista) {
    buf.fill(0);
    const st = gen.generate(cx, cz, buf, null);
    for (const s of st) if (s.be && s.be.type === 'chest' && !s.be.viejo !== true) cofres.push({ x: cx * 16 + s.x, y: s.y, z: cz * 16 + s.z, slots: JSON.stringify(s.be.slots) });
    for (const s of st) if (s.be && s.be.type === 'placa') placas.push(s.be.title);
    for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++) for (let y = 0; y < 128; y++) mundo[((cx - c0x) * 16 + x) + ((cz - c0z) * 16 + z) * W + y * W * Hh] = buf[x + z * 16 + y * 256];
  }
  return { mundo, W, Hh, c0x, c0z, cofres, placas };
}
function alcanza(g, P, cofre, gen) {
  const { mundo, W, Hh, c0x, c0z } = g;
  const at = (x, y, z) => mundo[(x - c0x * 16) + (z - c0z * 16) * W + y * W * Hh];
  const libre = (x, y, z) => { if (x < c0x * 16 || z < c0z * 16 || x >= c0x * 16 + W || z >= c0z * 16 + Hh || y < 1 || y > 126) return false; const id = at(x, y, z); return !OPAQUE[id] || id === K.torch; };
  const h = gen.column(P.x, P.z).h, ini = [P.x, h + 2, P.z], seen = new Set([ini.join()]), pila = [ini];
  while (pila.length) {
    const [x, y, z] = pila.pop();
    if (Math.abs(x - cofre.x) + Math.abs(y - cofre.y) + Math.abs(z - cofre.z) <= 1) return true;
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) { const n = [x + dx, y + dy, z + dz], k = n.join(); if (!seen.has(k) && libre(...n)) { seen.add(k); pila.push(n); } }
  }
  return false;
}
for (const seed of [123457, 777, 2026]) {
  const gen = new Generator(seed, 22), viejo = new Generator(seed, 21);
  const todas = structuresNear(gen, 0, 0, 3500, new Set(TIPOS));
  console.log(`semilla ${seed}: ${TIPOS.map((t) => `${t} ×${todas.filter((s) => s.type === t).length}`).join(', ')} en 3500 bloques`);
  for (const t of TIPOS) {
    const S = todas.filter((s) => s.type === t).sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z))[0];
    if (!S) { ok(false, `${t}: ninguno cerca`); continue; }
    ok(!structuresNear(viejo, S.x, S.z, 60, new Set([t])).length, `${t}: el mundo 21 no lo tiene`);
    const R = 34;
    const a = generar(gen, S, R, false), b = generar(new Generator(seed, 22), S, R, true);
    // los cofres del sitio: los que caen a ≤ R del centro
    const [lx, ly, lz] = COFRE[t], [rx, rz] = rot(lx, lz, S.rot), ex = S.x + rx, ey = S.y + ly, ez = S.z + rz;
    const mios = (g) => g.cofres.filter((q) => q.x === ex && q.y === ey && q.z === ez);
    const ca = mios(a), cb = mios(b);
    ok(ca.length === 1, `${t} (${S.x},${S.z}): un cofre en su sitio (${ca.length})`);
    ok(ca.length === 1 && cb.length === 1 && ca[0].slots === cb[0].slots && ca[0].x === cb[0].x && ca[0].y === cb[0].y, `${t}: mismo cofre y mismo botín con otro Generator y otro orden de trozos`);
    ok(ca.length === 1 && JSON.parse(ca[0].slots).filter(Boolean).length >= 5, `${t}: el botín trae varias cosas`);
    ok(ca.length === 1 && alcanza(a, S, ca[0], gen), `${t}: el cofre se alcanza a pie desde la boca`);
    ok(a.placas.includes(STRUCT_NAMES[t]), `${t}: tiene su placa «${STRUCT_NAMES[t]}»`);
  }
}
for (const t of TIPOS) ok(!!STRUCT_NAMES[t] && !!STRUCT_RARE[t], `${t}: nombre y rareza`);
process.exitCode = fallas ? 1 : 0;
console.log(fallas ? `\n✘ ${fallas} falla(s)` : '\nSitios kársticos: todo bien.');
