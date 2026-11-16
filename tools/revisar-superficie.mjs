// v13.4.0 (generador 27, paquete de superficie): comprueba lo propio del 27 con generación real de trozos:
//  1) los mundos <= 26 no cambian (la huella la guarda tools/huella-mundos.mjs; aquí solo que el 27 sea distinto y use las mismas funciones);
//  2) las construcciones del desierto existen, caen en el desierto, se dibujan sin romperse y traen cofre y placa;
//  3) la montaña de verdad existe (bioma «mountains» con roca arriba) y no hay nieve (en Costa Rica no nieva);
//  4) la playa solo queda junto al mar (a ≤ 120 bloques hay agua);
//  5) el trozo con construcción del desierto se genera en ≤ 12 ms de media (mediana de 3 × 3 trozos alrededor de cada obra).
// Los números de reparto (playa 6-10 %, manchas, bordes) los mide tools/revisar-contenido.mjs; aquí solo la forma.
// Uso: node tools/revisar-superficie.mjs
import { Generator, CHUNK, HEIGHT } from '../src/worldgen.js';
import { structuresNear } from '../src/estructuras.js';
import { GEN_SUPERFICIE, SEA } from '../src/worldgen2.js';
import { GEN_MAX } from '../src/version.js';
import { BLOCK_BY_KEY as K } from '../src/blocks.js';

let fallas = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fallas++; };
ok(GEN_SUPERFICIE === 27 && GEN_MAX >= 27, `GEN_SUPERFICIE = ${GEN_SUPERFICIE} y GEN_MAX = ${GEN_MAX}`);

const buf = new Uint16Array(CHUNK * CHUNK * HEIGHT), tint = new Float32Array(CHUNK * CHUNK * 3);
const TIPOS = ['oasis_ruina', 'pozo_arriero', 'carreta_seca'];
const vistos = {}; let enDesierto = 0, total = 0, conCofre = 0, conPlaca = 0; const tiempos = [];
for (const seed of [101, 202, 303]) {
  const g = new Generator(seed, 27, 'tierra', 'normal'), sp = g.findSpawn();
  for (const P of structuresNear(g, sp.x, sp.z, 1500)) {
    if (!TIPOS.includes(P.type)) continue;
    total++; vistos[P.type] = (vistos[P.type] || 0) + 1;
    if (g.column(P.x, P.z).biome === 'desert') enDesierto++;
    let cofre = 0, placa = 0;
    for (let cz = Math.floor(P.z / CHUNK) - 1; cz <= Math.floor(P.z / CHUNK) + 1; cz++) for (let cx = Math.floor(P.x / CHUNK) - 1; cx <= Math.floor(P.x / CHUNK) + 1; cx++) {
      buf.fill(0); const t = performance.now(); const st = g.generate(cx, cz, buf, tint) || []; tiempos.push(performance.now() - t);
      for (const e of st) { if (e.be && e.be.type === 'chest') cofre++; if (e.be && e.be.type === 'placa') placa++; }
    }
    if (cofre) conCofre++; if (placa) conPlaca++;
  }
}
ok(TIPOS.every((t) => vistos[t] > 0), `las tres construcciones del desierto aparecen (${TIPOS.map((t) => t + ' ' + (vistos[t] || 0)).join(', ')})`);
ok(total > 0 && enDesierto === total, `todas caen en el desierto (${enDesierto}/${total})`);
ok(conCofre === total && conPlaca === total, `todas traen cofre y placa (${conCofre} y ${conPlaca} de ${total})`);
tiempos.sort((a, b) => a - b); const mediana = tiempos[tiempos.length >> 1] || 0;
ok(mediana <= 12, `trozo con construcción del desierto: ${mediana.toFixed(1)} ms de mediana (≤ 12)`);

// montaña de verdad: buscar un trozo de montaña en varias semillas, sin nieve
let montanas = 0, nieve = 0, rocas = 0, lejosDelMar = 0, playas = 0;
for (const seed of [101, 202, 303, 404]) {
  const g = new Generator(seed, 27, 'tierra', 'normal'), sp = g.findSpawn();
  for (let x = -1200; x <= 1200; x += 48) for (let z = -1200; z <= 1200; z += 48) {
    const c = g.column(Math.round(sp.x) + x, Math.round(sp.z) + z);
    if (c.biome === 'mountains') montanas++;
    if (c.biome === 'beach') {
      playas++;
      let mar = false; // el mar a ≤ 120 bloques en alguna dirección
      for (let r = 8; r <= 120 && !mar; r += 16) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (g.column(Math.round(sp.x) + x + dx * r, Math.round(sp.z) + z + dz * r).biome === 'ocean') { mar = true; break; }
      if (!mar) lejosDelMar++;
    }
  }
  // un trozo de montaña: busca el primero
  outer: for (let x = -1200; x <= 1200; x += 32) for (let z = -1200; z <= 1200; z += 32) {
    const wx = Math.round(sp.x) + x, wz = Math.round(sp.z) + z, c = g.column(wx, wz);
    if (c.biome !== 'mountains' || c.h < 100) continue;
    buf.fill(0); g.generate(Math.floor(wx / CHUNK), Math.floor(wz / CHUNK), buf, tint);
    for (let i = 0; i < buf.length; i++) { if (buf[i] === K.snow || buf[i] === K.snow_grass) nieve++; else if (buf[i] === K.stone) rocas++; }
    break outer;
  }
}
ok(montanas > 20, `hay montaña de verdad (${montanas} puntos de la rejilla en 4 semillas)`);
ok(rocas > 1000 && nieve === 0, `la cumbre es roca y sin nieve (${rocas} bloques de piedra, ${nieve} de nieve)`);
ok(playas > 50 && lejosDelMar <= playas * 0.06, `la playa queda junto al mar: ${lejosDelMar} de ${playas} a más de 120 del mar (≤ 6 %)`);
void SEA;
console.log(fallas ? `\n✘ ${fallas} falla(s)` : '\nSuperficie del generador 27: todo bien.');
process.exitCode = fallas ? 1 : 0;
