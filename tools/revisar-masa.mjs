// v13.2.3 (el juego se congelaba volando lejos): genera muchos trozos del generador 23 (y del 22) en varias semillas y a varias distancias del
// origen, incluidas las negativas y las muy lejanas, y comprueba (1) que ninguno lanza una excepción; (2) que cada estructura que anota el
// generador (cofres, placas, puertas…) trae coordenadas LOCALES válidas y cae en un bloque que existe (la causa del congelamiento: las
// placas de las carreteras traían las del mundo y world.ensureChunk fallaba en cada cuadro lejos del origen); (3) que ningún id de bloque
// del trozo es desconocido; (4) que el tiempo por trozo es razonable; y reporta los biomas y las alturas que cubrió.
// Uso: node tools/revisar-masa.mjs
import { Generator, CHUNK, HEIGHT } from '../src/worldgen.js';
import { BLOCKS } from '../src/blocks.js';

let fallas = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fallas++; };
const idx = (x, y, z) => x + z * CHUNK + y * CHUNK * CHUNK;
const SEMILLAS = [424242, 123457, 777, 99, 3, 2026];
const ORIGENES = [[0, 0], [-90, -90], [100, 120], [-150, 40], [60, -200]]; // en trozos: hasta ±3 200 bloques
const N = 4; // 4×4 trozos por origen
const LIMITE_MS = 2500; // un trozo suelto (pueblo grande) puede tardar; el promedio debe ser mucho menor (el primero de cada generador paga la compilación y no cuenta)
let medidos = 0, total = 0, excepciones = [], malas = [], desconocidos = [], lentos = 0, suma = 0, peor = 0;
const biomas = new Set(); let yMin = HEIGHT, yMax = 0;
for (const ver of [23, 22]) {
  for (const s of SEMILLAS) {
    const gen = new Generator(s, ver), buf = new Uint16Array(CHUNK * CHUNK * HEIGHT), tint = new Float32Array(CHUNK * CHUNK * 3);
    for (const [ox, oz] of ORIGENES) for (let cz = oz; cz < oz + N; cz++) for (let cx = ox; cx < ox + N; cx++) {
      buf.fill(0);
      const t0 = performance.now(); let st = [];
      try { st = gen.generate(cx, cz, buf, tint) || []; } catch (e) { excepciones.push(`${ver}/${s} ${cx},${cz}: ${e.message}`); continue; }
      const ms = performance.now() - t0; total++; if (total % (N * N * ORIGENES.length) !== 1) { medidos++; suma += ms; peor = Math.max(peor, ms); if (ms > LIMITE_MS) lentos++; }
      for (const t of st) {
        if (t.npc || t.zone || t.beacon) continue;
        const i = idx(t.x, t.y, t.z);
        if (!(Number.isInteger(t.x) && Number.isInteger(t.y) && Number.isInteger(t.z) && t.x >= 0 && t.x < CHUNK && t.z >= 0 && t.z < CHUNK && t.y >= 0 && t.y < HEIGHT) || !BLOCKS[buf[i]]) malas.push(`${ver}/${s} ${cx},${cz}: (${t.x},${t.y},${t.z}) ${t.be ? t.be.type : t.id}`);
      }
      for (let k = 0; k < buf.length; k++) if (!BLOCKS[buf[k]]) { desconocidos.push(`${ver}/${s} ${cx},${cz}: id ${buf[k]}`); break; }
      if (ver === 23) {
        for (let lz = 0; lz < CHUNK; lz += 5) for (let lx = 0; lx < CHUNK; lx += 5) { biomas.add(gen.column(cx * CHUNK + lx, cz * CHUNK + lz).biome); for (let y = 1; y < HEIGHT; y++) if (buf[idx(lx, y, lz)]) { yMin = Math.min(yMin, y); yMax = Math.max(yMax, y); } }
      }
    }
  }
}
console.log(`  ${total} trozos (generadores 23 y 22, ${SEMILLAS.length} semillas, ${ORIGENES.length} lugares hasta ±3 200 bloques)`);
ok(excepciones.length === 0, `ningún trozo lanza una excepción${excepciones.length ? ': ' + excepciones.slice(0, 3).join(' | ') : ''}`);
ok(malas.length === 0, `todas las estructuras traen coordenadas locales válidas y caen en un bloque que existe${malas.length ? ` (${malas.length}: ${malas.slice(0, 2).join(' | ')})` : ''}`);
ok(desconocidos.length === 0, `ningún bloque desconocido en los trozos${desconocidos.length ? ': ' + desconocidos.slice(0, 2).join(' | ') : ''}`);
const prom = suma / Math.max(1, medidos);
console.log(`  tiempo por trozo: promedio ${prom.toFixed(1)} ms, el peor ${Math.round(peor)} ms; biomas: ${[...biomas].sort().join(', ')}; alturas con bloques: ${yMin}–${yMax}`);
ok(lentos === 0 && prom < 60, `ninguno pasa de ${LIMITE_MS} ms y el promedio es menor de 60 ms`);
ok(biomas.size >= 6 && yMin <= 1 && yMax >= 80, `cubre al menos 6 biomas y desde el fondo (y ≤ 1) hasta la altura (y ≥ 80)`);
process.exitCode = fallas ? 1 : 0;
console.log(fallas ? `\n✘ ${fallas} falla(s)` : '\nTrozos en masa: todo bien.');
