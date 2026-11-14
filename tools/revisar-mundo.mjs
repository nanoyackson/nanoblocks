// Mundo compacto contra normal (v11.13.0): para varias semillas y los dos tipos de mundo, cuenta cada estructura dentro de 150,
// 300 y 600 bloques del inicio, la distancia media al vecino más cercano, el pueblo más cercano, y busca estructuras encimadas.
// Uso: node tools/revisar-mundo.mjs [semilla …]   (sale con error si en compacto algo se encima, no hay pueblo a menos de 150,
// lo peligroso cae a menos de 60 o un tipo que se ubica por el terreno no aparece a menos de 900)
import { Generator } from '../src/worldgen.js';
import { structuresNear, structRadius, inicioCompacto, sitiosAnillo, STRUCT_NAMES } from '../src/estructuras.js';
import { villageAt, CELL } from '../src/pueblogen.js';

const semillas = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
if (!semillas.length) semillas.push(12345, 777, 2026, 31337, 4242);
let fallas = 0;
const fila = [];
for (const seed of semillas) {
  for (const tipo of ['normal', 'compacto']) {
    const gen = new Generator(seed, 17, 'tierra', tipo);
    const S = tipo === 'compacto' ? inicioCompacto(gen) : new Generator(seed, 5).findSpawn();
    const t0 = performance.now();
    const todas = structuresNear(gen, S.x, S.z, 900);
    const ms = Math.round(performance.now() - t0);
    const dist = (p) => Math.hypot(p.x - S.x, p.z - S.z);
    const tipos = (r) => new Set(todas.filter((p) => dist(p) <= r).map((p) => p.type)).size;
    // vecino más cercano entre las que caen a 600
    const cerca = todas.filter((p) => dist(p) <= 600);
    const vecinos = cerca.map((p) => Math.min(...cerca.filter((q) => q !== p).map((q) => Math.hypot(p.x - q.x, p.z - q.z))));
    const vec = vecinos.length > 1 ? Math.round(vecinos.reduce((a, b) => a + b, 0) / vecinos.length) : 0;
    // encimadas: dos estructuras cuyas cajas (radio R) se tocan
    const encimadas = [];
    for (let i = 0; i < cerca.length; i++) for (let j = i + 1; j < cerca.length; j++) {
      const a = cerca[i], b = cerca[j], g = structRadius(gen, a.type) + structRadius(gen, b.type);
      if (Math.abs(a.x - b.x) < g && Math.abs(a.z - b.z) < g) encimadas.push(`${a.type}+${b.type}`);
    }
    // el pueblo más cercano
    let pueblo = Infinity;
    for (let cz = Math.floor(S.z / CELL) - 3; cz <= Math.floor(S.z / CELL) + 3; cz++) for (let cx = Math.floor(S.x / CELL) - 3; cx <= Math.floor(S.x / CELL) + 3; cx++) { const v = villageAt(gen, cx, cz); if (v) pueblo = Math.min(pueblo, Math.hypot(v.x - S.x, v.z - S.z)); }
    const peligro = todas.filter((p) => p.type === 'caverna_rey' && dist(p) < 60).length;
    fila.push({ semilla: seed, tipo, 'en 150': tipos(150), 'en 300': tipos(300), 'en 600': tipos(600), 'vecino medio': vec, pueblo: Math.round(pueblo), encimadas: encimadas.length, ms });
    if (tipo === 'compacto') {
      const anillo = sitiosAnillo(gen), faltan = [];
      const delTerreno = Object.keys(STRUCT_NAMES).filter((k) => anillo.has(k) || !todas.some((p) => p.type === k));
      for (const k of delTerreno) if (!todas.some((p) => p.type === k && dist(p) <= 900) && anillo.size) faltan.push(k);
      if (encimadas.length) { fallas++; console.log(`✘ ${seed} compacto: encimadas ${encimadas.slice(0, 6).join(', ')}`); }
      if (pueblo > 150) { fallas++; console.log(`✘ ${seed} compacto: el pueblo más cercano está a ${Math.round(pueblo)}`); }
      if (peligro) { fallas++; console.log(`✘ ${seed} compacto: la Caverna del Rey a menos de 60 del inicio`); }
      // v11.13.5 (M1): el inicio no cae dentro de la caja de ninguna estructura (antes la feria o el cementerio del pueblo, en ~5 %)
      const encima = todas.filter((p) => dist(p) < structRadius(gen, p.type) + 8);
      if (encima.length) { fallas++; console.log(`✘ ${seed} compacto: el inicio cae en ${encima.map((p) => `${p.type} (a ${Math.round(dist(p))})`).join(', ')}`); }
      if (faltan.length) console.log(`· ${seed} compacto: no salen a menos de 900 (${faltan.length}): ${faltan.join(', ')}`);
    }
  }
}
console.table(fila);
if (fallas) { console.log(`\n${fallas} falla(s)`); process.exitCode = 1; } else console.log('\nTodo bien: nada encimado, pueblo a menos de 150 y lo peligroso lejos del inicio.');
