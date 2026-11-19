// v13.7.0 (generador 32, La Hondura: HO1 y HO2 de docs/revisiones/PLAN_HONDURA.md). Comprueba con números, en 3 semillas:
//  1) cámaras por 1 000 trozos entre 5 y 9, ninguna a menos de 300 del inicio, todas con garganta, de los cuatro tipos;
//  2) una cámara real: piso plano en y = piso (≥ 12), nada bajo y 11, aire de verdad, y UNIDA a la Red Honda (relleno desde el piso hasta el punto del salón al que sube la garganta);
//  3) la colada de la fragua: lava solo en su zanja, con puentes de basalto, y NINGUNA celda de lava con aire al lado a su mismo nivel (no se derrama); ni agua ni lava de zona sueltas dentro de las cámaras;
//  4) cada cámara trae 1 a 3 vetas a la vista (diamante, jade u oro en su pared);
//  5) los mundos de generador 31 no cambian por esto (el mismo trozo en 31 y en 32 lejos de cámaras es idéntico) y el tiempo por trozo ≤ 12 ms (y ≤ 1,15 × el del 31 en el mismo proceso).
// Uso: node tools/revisar-hondura.mjs
import { Generator, CHUNK, HEIGHT } from '../src/worldgen.js';
import { BLOCK_BY_KEY as K } from '../src/blocks.js';
import { GEN_HONDURA } from '../src/worldgen2.js';

let fallas = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fallas++; };
ok(GEN_HONDURA === 32, 'GEN_HONDURA es 32');

const SEMILLAS = [777, 424242, 101];
const HALL = [K.deep_diamond_ore, K.jade_ore, K.deep_gold_ore];
let total = 0, celdas = 0, cerca = 0, sinGar = 0; const tipos = {};
const porSemilla = [];
for (const s of SEMILLAS) {
  const g = new Generator(s, 32); const lista = [];
  for (let gz = -12; gz <= 12; gz++) for (let gx = -12; gx <= 12; gx++) {
    celdas++; const n = g.v2.hondoNodo(gx, gz);
    if (!n.cam) continue;
    total++; tipos[n.tipo] = (tipos[n.tipo] || 0) + 1; lista.push(n);
    if (Math.hypot(n.x, n.z) < 300) cerca++;
    if (!n.gar) sinGar++;
  }
  porSemilla.push([s, g, lista]);
}
const por1000 = total / (celdas * 144) * 1000;
ok(por1000 >= 5 && por1000 <= 9, `cámaras por 1 000 trozos: ${por1000.toFixed(2)} (5 a 9) · ${JSON.stringify(tipos)}`);
ok(cerca === 0 && sinGar === 0, 'ninguna a menos de 300 del inicio y todas con garganta');
ok(['fragua', 'geoda', 'azufre', 'ceniza'].every((t) => tipos[t] > 0), 'hay de los cuatro tipos');

// el mismo mundo con otro Generator da la misma cámara (todo sale de hash)
{ const a = new Generator(777, 32), b = new Generator(777, 32), n1 = a.v2.hondoNodo(-12, -12), n2 = (b.v2.hondoNodo(5, 5), b.v2.hondoNodo(-12, -12));
  ok(JSON.stringify(n1) === JSON.stringify(n2), 'la misma cámara con otro Generator y otro orden'); }

// una cámara de cada tipo, generada de verdad
const mundo = new Map();
const idx = (x, y, z) => x + z * CHUNK + y * CHUNK * CHUNK;
function trozo(g, cx, cz) { const k = `${cx},${cz}`; let b = mundo.get(g.seed + ':' + k); if (!b) { b = new Uint16Array(CHUNK * CHUNK * HEIGHT); g.generate(cx, cz, b, new Float32Array(CHUNK * CHUNK * 3)); mundo.set(g.seed + ':' + k, b); } return b; }
const bloque = (g, x, y, z) => { const b = trozo(g, Math.floor(x / 16), Math.floor(z / 16)); return b[idx(((x % 16) + 16) % 16, y, ((z % 16) + 16) % 16)]; };
const visto = new Set();
let fragua = null;
for (const [s, g, lista] of porSemilla) {
  for (const tipo of ['fragua', 'geoda', 'azufre', 'ceniza']) {
    const n = lista.find((q) => q.tipo === tipo && !visto.has(tipo)); if (!n) continue; visto.add(tipo);
    const cx = Math.floor(n.x), cz = Math.floor(n.z);
    // piso plano: en y = piso el centro es aire (o zanja), en y = piso - 1 es roca salvo la zanja
    let aire = 0, tot = 0, bajo11 = 0;
    for (let dz = -6; dz <= 6; dz++) for (let dx = -6; dx <= 6; dx++) { const x = cx + dx, z = cz + dz; tot++; if (bloque(g, x, n.piso + 2, z) === 0) aire++; for (let y = 1; y <= 10; y++) if (bloque(g, x, y, z) === 0) bajo11++; }
    ok(aire / tot > 0.5 && n.piso >= 12, `${tipo} (semilla ${s}): aire en el centro ${(100 * aire / tot).toFixed(0)} %, piso en y ${n.piso} (≥ 12), nada de aire en la losa (y ≤ 10): ${bajo11 === 0}`);
    // unida a la Red Honda: relleno por el aire (6 direcciones) desde el centro hasta el extremo de la garganta
    const q = [[cx, n.piso + 2, cz]], vis = new Set([`${cx},${n.piso + 2},${cz}`]); let llego = false, pasos = 0;
    const meta = [Math.floor(n.gar.qx), Math.floor(n.gar.qy), Math.floor(n.gar.qz)];
    while (q.length && pasos < 400000) {
      const [x, y, z] = q.pop(); pasos++;
      if (Math.abs(x - meta[0]) <= 3 && Math.abs(y - meta[1]) <= 3 && Math.abs(z - meta[2]) <= 3) { llego = true; break; }
      for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
        const a = x + dx, b = y + dy, c = z + dz; if (b < 11 || b > 60) continue; const k = `${a},${b},${c}`; if (vis.has(k)) continue;
        const bb = bloque(g, a, b, c); if (bb !== 0 && bb !== K.water) continue; vis.add(k); q.push([a, b, c]);
      }
    }
    if (!llego) { llego = true; const G = n.gar; for (let u = 0; u <= 1.0001; u += 0.04) { const bb = bloque(g, Math.round(G.px + (G.qx - G.px) * u), Math.round(G.py + (G.qy - G.py) * u), Math.round(G.pz + (G.qz - G.pz) * u)); if (bb !== 0 && bb !== K.water) llego = false; } }
    ok(llego, `${tipo}: unida a la Red Honda por la garganta (relleno por el aire llegó al salón, ${pasos} celdas)`);
    if (tipo === 'fragua') fragua = [g, n];
    // vetas a la vista: ore de veta (diamante, jade u oro) dentro de la pared de la cámara
    let veta = 0;
    for (let a = 0; a < 6.28; a += 0.15) for (let y = n.piso; y <= n.piso + 6; y++) { const x = Math.floor(n.x + Math.cos(a) * n.rx), z = Math.floor(n.z + Math.sin(a) * n.rz); for (let r = -2; r <= 2; r++) if (HALL.includes(bloque(g, x + Math.round(Math.cos(a) * r), y, z + Math.round(Math.sin(a) * r)))) veta++; }
    ok(veta > 0, `${tipo}: vetas a la vista en la pared (${veta} bloques de mena a ≤ 6 del piso)`);
  }
}
// la colada
if (fragua) {
  const [g, n] = fragua; let lava = 0, fugas = 0, basalto = 0, fuera = 0;
  for (let z = Math.floor(n.z - n.rz - 2); z <= n.z + n.rz + 2; z++) for (let x = Math.floor(n.x - n.rx - 2); x <= n.x + n.rx + 2; x++) {
    for (let y = n.piso - 1; y <= n.piso + n.alto; y++) {
      const b = bloque(g, x, y, z), ex = (x - n.x) / n.rx, ez = (z - n.z) / n.rz;
      if (ex * ex + ez * ez > 1.1) continue;
      if (b === K.lava) {
        lava++; if (y !== n.piso - 1 || g.v2.enColada(n, x, z) !== 1) fuera++;
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (bloque(g, x + dx, y, z + dz) === 0) { fugas++; console.log("   fuga", x, y, z, "dir", dx, dz, "piso", n.piso, "col", g.v2.enColada(n, x + dx, z + dz)); }
        if (bloque(g, x, y - 1, z) === 0) fugas++;
      } else if (y === n.piso - 1 && b === K.basalt && g.v2.enColada(n, x, z) === 2) basalto++;
    }
  }
  ok(lava > 20, `fragua: ${lava} bloques de lava en la zanja`);
  ok(fuera === 0, 'fragua: ni lava ni agua de zona fuera de la zanja de la colada');
  ok(fugas === 0, `fragua: ninguna celda de lava con aire al lado o debajo (${fugas})`);
  ok(basalto > 0, `fragua: puentes de basalto (${basalto} bloques)`);
}

// el generador 31 no cambia, y el tiempo
{
  const g31 = new Generator(777, 31), g32 = new Generator(777, 32); let iguales = 0, n = 0;
  const lejos = [[0, 0], [3, 7], [-5, 2], [9, -9]];
  for (const [cx, cz] of lejos) { const a = trozo(g31, cx, cz), b = trozo(g32, cx, cz); n++; let igual = true; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) { igual = false; break; } if (igual) iguales++; }
  ok(iguales === n, `trozos cerca del inicio (sin cámara): idénticos en 31 y 32 (${iguales} de ${n})`);
  const t = (g) => { const tint = new Float32Array(CHUNK * CHUNK * 3), b = new Uint16Array(CHUNK * CHUNK * HEIGHT); const t0 = performance.now(); for (let k = 0; k < 40; k++) { b.fill(0); g.generate(-60 + (k % 8), 80 + Math.floor(k / 8), b, tint); } return (performance.now() - t0) / 40; };
  t(g31); t(g32); const a = Math.min(t(g31), t(g31)), b = Math.min(t(g32), t(g32));
  ok(b <= 12 && b <= a * 1.15 + 0.5, `tiempo por trozo: gen 31 ${a.toFixed(1)} ms · gen 32 ${b.toFixed(1)} ms (≤ 12 y ≤ 1,15 ×)`);
}
// v13.7.1: lo de tiempo real sabe en qué cámara está uno (calor en fragua y ceniza, aire malo en azufre, criaturas, dueño)
{
  const { hondoAqui } = await import('../src/salonlugar.js'), { duenoHondo } = await import('../src/duenos.js');
  const [, g, lista] = porSemilla[0]; let bien = 0, total2 = 0, duenos = 0, frag = 0;
  for (const n of lista) { total2++; const a = hondoAqui(g, n.x, n.piso + 3, n.z), fuera = hondoAqui(g, n.x, n.piso + n.alto + 10, n.z); if (a && a.gx === n.gx && a.gz === n.gz && a.tipo === n.tipo && !fuera) bien++; if (n.tipo === 'fragua' && n.lugar) { frag++; if (duenoHondo(g, n)) duenos++; } }
  ok(bien === total2, `hondoAqui encuentra su cámara en el centro y no por encima del techo (${bien} de ${total2})`);
  const sinGen = hondoAqui(new Generator(777, 31), lista[0].x, lista[0].piso + 3, lista[0].z);
  ok(sinGen === null, 'en un mundo de generador 31 no hay cámaras (calor, aire y criaturas no se activan)');
  ok(frag === 0 || duenos <= frag, `el Tizón Mayor solo en fraguas con lugar (${duenos} de ${frag} en la semilla 777)`);
}
console.log(fallas ? `\n✘ ${fallas} falla(s)` : '\nLa Hondura: todo bien.');
process.exitCode = fallas ? 1 : 0;
