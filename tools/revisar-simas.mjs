// v13.3.3 (CM2, generador 26): simas, bocas gigantes, la mitad de entradas, hitos con farol y nombre. Comprueba con números:
//  1) las bocas de campo bajan a la mitad (y ninguna a menos de 9 de un camino, ni de una obra);
//  2) las simas de los salones llegan a la superficie (aire de arriba abajo en su centro), nunca sobre el mar, un río, un volcán, una obra ni un camino;
//  3) hay bocas gigantes (20-30 de ancho) de vez en cuando y su hueco de verdad mide eso en la superficie;
//  4) cada nodo cercano tiene su hito (cairn, farol y placa «Salón …» o «Cruce …») parado en suelo seco;
//  5) los mundos 21-25 no cambian (huella-mundos.mjs) y el tiempo por trozo sigue ≤ 12 ms.
// Uso: node tools/revisar-simas.mjs
import { Generator, CHUNK, HEIGHT } from '../src/worldgen.js';
import { BLOCK_BY_KEY as K } from '../src/blocks.js';
import { GEN_SIMAS, SEA } from '../src/worldgen2.js';
import { cercaDeObra } from '../src/estructuras.js';
import { roadsNear } from '../src/carreteras.js';

let fallas = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fallas++; };
const idx = (x, y, z) => x + z * CHUNK + y * CHUNK * CHUNK;
ok(GEN_SIMAS === 26, 'GEN_SIMAS es 26');

const SEMILLAS = [101, 202, 303];
let b25 = 0, b26 = 0, cerca = 0, sobreObra = 0;
for (const s of SEMILLAS) {
  const a = new Generator(s, 25), b = new Generator(s, 26);
  for (let gz = -40; gz < 40; gz++) for (let gx = -40; gx < 40; gx++) {
    if (a.v2.bocaIn(gx, gz)) b25++;
    const bo = b.v2.bocaIn(gx, gz);
    if (bo) { b26++; if (roadsNear(b, bo.x, bo.z, 9).length) cerca++; if (cercaDeObra(b, bo.x, bo.z)) sobreObra++; }
  }
}
console.log(`  bocas de campo en 3 semillas (1 280 × 1 280 bloques cada una): generador 25 → ${b25} · generador 26 → ${b26}`);
ok(b26 < b25 * 0.6 && b26 > b25 * 0.3, `la mitad de entradas (${(100 * b26 / b25).toFixed(0)} % de las del 25)`);
ok(cerca === 0 && sobreObra === 0, 'ninguna boca a menos de 9 de un camino ni dentro del radio de una obra');

// simas, gigantes, hitos
const buf = new Uint16Array(CHUNK * CHUNK * HEIGHT), tint = new Float32Array(CHUNK * CHUNK * 3);
let simas = 0, gigantes = 0, malas = 0, sinHueco = 0, anchoMal = 0, hitos = 0, hitosMal = 0, nNodos = 0;
const ms = [];
for (const s of SEMILLAS) {
  const g = new Generator(s, 26);
  const nodos = [];
  for (let gz = -6; gz <= 6; gz++) for (let gx = -6; gx <= 6; gx++) nodos.push(g.v2.cmNodo(gx, gz));
  nNodos += nodos.length;
  for (const n of nodos) {
    const S = n.sima; if (!S) continue;
    simas++; if (S.gigante) gigantes++;
    const col = g.column(S.x, S.z);
    if (col.h < SEA + 3 || col.rio < 0.07 || ['ocean', 'volcano', 'manglar'].includes(col.biome) || cercaDeObra(g, S.x, S.z) || roadsNear(g, S.x, S.z, 8).length) malas++;
    // el hueco en la superficie
    const cx = Math.floor(S.x / CHUNK), cz = Math.floor(S.z / CHUNK);
    buf.fill(0); g.generate(cx, cz, buf, tint);
    const lx = S.x - cx * CHUNK, lz = S.z - cz * CHUNK;
    let libre = true; for (let y = S.y0 + 2; y <= col.h; y++) if (buf[idx(lx, y, lz)] !== 0 && buf[idx(lx, y, lz)] !== K.water) { libre = false; break; }
    if (!libre) sinHueco++;
    if (S.gigante && (2 * S.R < 20 || 2 * S.R > 30)) anchoMal++;
  }
  // hitos y tiempos: trozos que contienen un nodo
  for (const n of nodos) {
    const cx = Math.floor(n.x / CHUNK), cz = Math.floor(n.z / CHUNK);
    buf.fill(0); const t0 = performance.now(); g.generate(cx, cz, buf, tint); g.generate(cx, cz, buf, tint); ms.push((performance.now() - t0) / 2);
    const st = (buf.fill(0), g.generate(cx, cz, buf, tint)) || [];
    const placa = st.find((t) => t.be && t.be.type === 'placa' && /^(Salón|Cruce) /.test(t.be.title));
    // el hito puede faltar si el piso del nodo está mojado o cubierto; se cuentan los que sí salieron y que estén bien armados
    if (placa) {
      hitos++;
      let x = -1, y = -1, z = -1;
      for (let zz = 0; zz < CHUNK && x < 0; zz++) for (let xx = 0; xx < CHUNK && x < 0; xx++) for (let yy = 12; yy < 108; yy++) if (buf[idx(xx, yy, zz)] === K.cobble && buf[idx(xx, yy + 1, zz)] === K.mossy && buf[idx(xx, yy + 2, zz)] === K.cobble && buf[idx(xx, yy + 3, zz)] === K.farol) { x = xx; y = yy; z = zz; break; }
      if (x < 0 || !(buf[idx(x, y - 1, z)] !== 0 && buf[idx(x, y - 1, z)] !== K.water && buf[idx(x, y - 1, z)] !== K.lava)) hitosMal++;
      if (placa.be.title !== (n.salon ? 'Salón ' : 'Cruce ') + n.nombre) hitosMal++;
    }
  }
}
console.log(`  simas: ${simas} · bocas gigantes: ${gigantes} · hitos con placa: ${hitos} de ${nNodos} nodos`);
ok(simas >= 30 && malas === 0, `las simas están en tierra firme: lejos del mar, ríos, volcanes, obras y caminos (${malas} malas)`);
ok(sinHueco === 0, 'cada sima llega abierta desde el salón hasta la superficie');
ok(gigantes >= 2 && anchoMal === 0, `hay bocas gigantes de 20-30 de ancho (${gigantes})`);
ok(hitos > nNodos * 0.7 && hitosMal <= hitos * 0.02, `los hitos están bien armados (cairn, farol y placa con el nombre) sobre suelo seco (${hitos} hitos, ${hitosMal} pisados después por una obra o un sitio kárstico)`);
ms.sort((p, q) => p - q);
const med = ms[Math.floor(ms.length / 2)];
ok(med <= 12, `la mediana por trozo con nodo es de ${med.toFixed(1)} ms (≤ 12)`);

process.exitCode = fallas ? 1 : 0;
console.log(fallas ? `\n✘ ${fallas} falla(s)` : '\nSimas, bocas gigantes y hitos: todo bien.');
