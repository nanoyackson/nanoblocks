// v13.5.0 (generador 30, pueblos y calles): comprueba con generación real
//  1) el sitio: el 30 tiene la misma cantidad de pueblos que el 29 (±10 %), ninguno con agua, con un río a 30 del centro ni en una ladera mayor que la que se aplana (16 a 30, 30 a 56);
//     el terreno aplanado (gradeH: corte y relleno con talud 1:1) no deja paredes de más de 3 ni zanjas junto al agua;
//  2) las calles: a lo largo del eje de cada calle, la superficie sube o baja como máximo 1 de un bloque al siguiente (el 29 daba saltos de 2 o más) y donde sube hay media losa;
//  3) el trozo con pueblo se genera en ≤ 12 ms de mediana (y ≤ el 29 + 25 %);
//  4) los tramos de camino no cuestan más de 10 % que en el 29 (suma de 4 semillas, total y peor llamada).
// Uso: node tools/revisar-pueblos.mjs
import { Generator, CHUNK, HEIGHT } from '../src/worldgen.js';
import { villageAt } from '../src/pueblogen.js';
import { gradeH } from '../src/pueblo6.js';
import { GEN_PUEBLOS } from '../src/worldgen2.js';
import { GEN_MAX } from '../src/version.js';
import { BLOCK_BY_KEY as K } from '../src/blocks.js';
import { medirMin as medir } from './medir-tramo.mjs'; // mínimo de 3 repeticiones

let fallas = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fallas++; };
ok(GEN_PUEBLOS === 30 && GEN_MAX >= 30, `GEN_PUEBLOS = ${GEN_PUEBLOS} y GEN_MAX = ${GEN_MAX}`);
const SEM = [101, 202, 303, 404];
// los anillos de pueblogen.js, escritos aparte para no probar el código con sí mismo: a 15 y a 30 sin agua ni río; el pueblo con calles admite desnivel de 16 a 30 y de 30 a 56
// (y río a 56); el caserío (sin calles) pide 7 y 16 y sin río. Sin agua en ningún punto.
const anillo = (R, n, ph) => Array.from({ length: n }, (_, i) => [Math.round(R * Math.cos(i * 2 * Math.PI / n + ph)), Math.round(R * Math.sin(i * 2 * Math.PI / n + ph))]);
const R15 = anillo(15, 8, 0), R30 = anillo(30, 12, 0), R56 = anillo(56, 8, 0.39);
function defectos(g, v) {
  const caserio = !v.streets || !v.streets.length, c0 = g.column(v.x, v.z); let ladera = false, agua = false, rio = false;
  for (const [pts, dmax, vr] of [[R15, 99, true], [R30, caserio ? 7 : 16, true], [R56, caserio ? 16 : 30, caserio]]) for (const [dx, dz] of pts) {
    const q = g.column(v.x + dx, v.z + dz);
    if (Math.abs(q.h - c0.h) > dmax) ladera = true;
    if (q.h <= 63) agua = true;
    if (vr && q.rio < 0.1 * (1 + Math.max(0, q.h - 68) / 14)) rio = true;
  }
  return { ladera, agua, rio };
}

// 1) el sitio: la misma cantidad de pueblos que el 29 (±10 %), sin agua, sin río a 15 ni a 30 y sin ladera mayor que la que se aplana
const tot = { 29: 0, 30: 0 }, mal = { 29: 0, 30: 0 }, lista30 = [];
for (const ver of [29, 30]) for (const seed of SEM) {
  const g = new Generator(seed, ver, 'tierra', 'normal');
  for (let cz = -6; cz <= 6; cz++) for (let cx = -6; cx <= 6; cx++) {
    const v = villageAt(g, cx, cz); if (!v) continue;
    tot[ver]++; const d = defectos(g, v); if (d.ladera || d.agua || d.rio) mal[ver]++;
    if (ver === 30) lista30.push([g, v]);
  }
}
console.log(`  pueblos en 4 semillas: gen 29 ${tot[29]} (${mal[29]} con ladera, agua o río adentro), gen 30 ${tot[30]} (${mal[30]})`);
ok(mal[30] === 0, 'ningún pueblo del 30 queda con agua, con un río a 30 del centro o en una ladera mayor que la que se aplana');
ok(mal[29] > 0, 'y el 29 sí los tenía (la prueba mide algo)');
ok(tot[30] >= 0.9 * tot[29] && tot[30] <= 1.1 * tot[29], `el 30 tiene ${tot[30]} pueblos y el 29 tenía ${tot[29]} (±10 %)`);

// 1b) el aplanado: sin paredes altas. En el cuadro del pueblo y 30 más afuera, entre una columna y la vecina el terreno final no salta más de 3 (ni más de 5 sobre el agua); y el pueblo sí se aplana (se mueve terreno)
{
  let pueblos = 0, paredes = 0, mayor = 0, movidas = 0, total = 0, conRio = 0;
  for (const [g, v] of lista30) {
    if (!v.streets || !v.streets.length) continue;
    pueblos++;
    const R = v.L + 34, fin = new Map(), nat = new Map();
    const alt = (x, z) => { const k = x + ',' + z; if (!nat.has(k)) { const c = g.column(x, z), h = c.h; nat.set(k, h); fin.set(k, gradeH(g, v, x, z, c)); } return [nat.get(k), fin.get(k)]; };
    let rio = false;
    for (let z = v.z - R; z <= v.z + R; z++) for (let x = v.x - R; x <= v.x + R; x++) {
      const [h, t] = alt(x, z); total++; if (t !== h) movidas++;
      if (h < 62 && Math.abs(x - v.x) < 60 && Math.abs(z - v.z) < 60) rio = true;
      for (const [dx, dz] of [[1, 0], [0, 1]]) {
        if (x + dx > v.x + R || z + dz > v.z + R) continue;
        const [h2, t2] = alt(x + dx, z + dz);
        const agua = h < 62 || h2 < 62;
        if (agua && h < 62 && h2 < 62) continue;
        const salto = agua ? Math.max(t, t2) - 62 : Math.abs(t - t2), antes = agua ? Math.max(h, h2) - 62 : Math.abs(h - h2);
        if (!agua) mayor = Math.max(mayor, salto);
        if (salto > (agua ? 5 : 3) && salto > antes + 2) paredes++;
      }
    }
    if (rio) conRio++;
  }
  console.log(`  aplanado: ${pueblos} pueblos con calles, ${(100 * movidas / total).toFixed(0)} % de las columnas movidas, ${conRio} con río adentro, salto mayor entre vecinas ${mayor}, paredes altas nuevas ${paredes}`);
  ok(pueblos >= 10 && movidas > 0, 'se revisaron al menos 10 pueblos con calles y el aplanado mueve terreno');
  ok(paredes === 0, 'el terreno aplanado no deja paredes de más de 3 (ni de más de 5 sobre el agua) que el terreno natural no tuviera');
}

// 2) las calles, con trozos reales
const SUPERFICIE = new Set([K.asfalto, K.asfalto_linea, K.asfalto_parche, K.asfalto_roto, K.cobble, K.concreto, K.acera]);
function calles(ver) {
  let saltos2 = 0, subidas = 0, conMedia = 0, tramos = 0, pueblos = 0; const tiempos = [];
  const buf = new Uint16Array(CHUNK * CHUNK * HEIGHT), tint = new Float32Array(CHUNK * CHUNK * 3);
  for (const seed of [101, 202, 303]) {
    const g = new Generator(seed, ver, 'tierra', 'normal'), trozos = new Map();
    const bloque = (x, y, z) => {
      const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK), key = cx + ',' + cz;
      if (!trozos.has(key)) { buf.fill(0); const t0 = performance.now(); g.generate(cx, cz, buf, tint); tiempos.push(performance.now() - t0); trozos.set(key, buf.slice()); }
      return trozos.get(key)[(x - cx * CHUNK) + (z - cz * CHUNK) * CHUNK + y * CHUNK * CHUNK];
    };
    const sup = (x, z) => { for (let y = HEIGHT - 1; y > 40; y--) if (SUPERFICIE.has(bloque(x, y, z))) return y; return -1; };
    let hechos = 0;
    for (let cz = -4; cz <= 4 && hechos < 3; cz++) for (let cx = -4; cx <= 4 && hechos < 3; cx++) {
      const v = villageAt(g, cx, cz); if (!v || !v.streets || !v.streets.length) continue;
      hechos++; pueblos++;
      for (const s of v.streets) {
        let prev = null;
        const n = s.axis === 'x' ? s.w : s.d;
        for (let i = 0; i < n; i++) {
          const x = s.axis === 'x' ? s.x + i : s.x + 3, z = s.axis === 'x' ? s.z + 3 : s.z + i;
          const y = sup(x, z); tramos++;
          if (y < 0) { prev = null; continue; }
          if (prev !== null) {
            if (Math.abs(y - prev) >= 2) saltos2++;
            if (y === prev + 1) { subidas++; const dx = s.axis === 'x' ? 1 : 0; if ([K.losa_asfalto].includes(bloque(x - dx, y, z - (1 - dx)))) conMedia++; }
          }
          prev = y;
        }
      }
    }
  }
  tiempos.sort((a, b) => a - b);
  return { saltos2, subidas, conMedia, tramos, pueblos, mediana: tiempos[Math.floor(tiempos.length / 2)] || 0 };
}
const c29 = calles(29), c30 = calles(30);
console.log(`  calles: gen 29 ${c29.pueblos} pueblos, ${c29.tramos} bloques de eje, ${c29.saltos2} saltos de ≥ 2, ${c29.subidas} subidas; gen 30 ${c30.pueblos} pueblos, ${c30.saltos2} saltos de ≥ 2, ${c30.subidas} subidas (${c30.conMedia} con media losa antes)`);
ok(c30.pueblos >= 3 && c30.tramos > 300, `se revisaron ${c30.pueblos} pueblos (${c30.tramos} bloques de eje)`);
ok(c30.saltos2 === 0, `ninguna calle del 30 tiene un salto de 2 o más entre un bloque y el siguiente (el 29: ${c29.saltos2})`);
ok(c30.subidas === 0 || c30.conMedia >= 0.9 * c30.subidas, `donde la calle sube un bloque hay media losa antes (${c30.conMedia} de ${c30.subidas})`);

// 3) costo del trozo
ok(c30.mediana <= 12 && c30.mediana <= c29.mediana * 1.25 + 0.5, `mediana de generar un trozo: gen 29 ${c29.mediana.toFixed(1)} ms, gen 30 ${c30.mediana.toFixed(1)} ms (≤ 12 y ≤ el 29 + 25 %)`);
// 4) costo de los tramos de camino al caminar 3 000 bloques (seis semillas; el 30 trae otro reparto de pueblos, así que se compara la suma): total ≤ el 29 + 10 %, peor llamada ≤ el 29 + 10 %
{
  const s = { 29: { t: 0, p: 0 }, 30: { t: 0, p: 0 } };
  for (const seed of [202, 101, 303, 404, 505, 606]) for (const ver of [29, 30]) { const r = medir(ver, seed); s[ver].t += r.total; s[ver].p += r.peores[0]; }
  ok(s[30].t <= s[29].t * 1.1 && s[30].p <= s[29].p * 1.1, `costo de los tramos (6 semillas): total ${s[29].t.toFixed(0)} → ${s[30].t.toFixed(0)} ms, peor llamada ${s[29].p.toFixed(0)} → ${s[30].p.toFixed(0)} ms (≤ +10 %)`);
}
console.log(fallas ? `\n✘ ${fallas} falla(s)` : '\nPueblos y calles del generador 30: todo bien.');
process.exitCode = fallas ? 1 : 0;
