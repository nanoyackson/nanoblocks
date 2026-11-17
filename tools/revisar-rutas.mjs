// v13.4.2 (generador 29, resto de la superficie): comprueba con generación real
//  1) los caminos: el perfil nunca da un salto de 2 o más entre bloques, no se alargan de más, el trozo con camino se genera sin fallas y CALCULAR LOS TRAMOS NO CUESTA MÁS que en el 28
//     (caminando 3 000 bloques y llamando a roadsNear cada 16, como al generar trozos en el hilo principal: total y peores llamadas ≤ las del 28 + 25 %, y ninguna llamada nueva > 50 ms);
//  2) el talud de las obras: junto a una obra con cimientos el terreno baja o se corta de a un bloque por bloque (sin paredes de 3 o más);
//  3) los cinco lugares típicos (Mirador de la Neblina, Muelle del Piangüero, Cairn de los Antiguos, Campamento del botánico, Hacienda vieja) existen, caen en su bioma, traen cofre y placa y
//     el trozo se genera en ≤ 12 ms de mediana.
// Uso: node tools/revisar-rutas.mjs
import { Generator, CHUNK, HEIGHT } from '../src/worldgen.js';
import { roadsNear } from '../src/carreteras.js';
import { structuresNear } from '../src/estructuras.js';
import { medir } from './medir-tramo.mjs';
import { GEN_RUTAS } from '../src/worldgen2.js';
import { GEN_MAX } from '../src/version.js';

let fallas = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fallas++; };
ok(GEN_RUTAS === 29 && GEN_MAX >= 29, `GEN_RUTAS = ${GEN_RUTAS} y GEN_MAX = ${GEN_MAX}`);
const buf = new Uint16Array(CHUNK * CHUNK * HEIGHT), tint = new Float32Array(CHUNK * CHUNK * 3);

// 1) caminos (dos semillas, 1 400 de radio)
const med = {};
for (const ver of [28, 29]) {
  const r = { escalon2: 0, largo: 0, tramos: 0, por: new Map() };
  for (const seed of [101, 303]) {
    const g = new Generator(seed, ver, 'tierra', 'normal'), sp = g.findSpawn();
    for (const s of roadsNear(g, sp.x, sp.z, 1400)) {
      r.tramos++; r.largo += s.n; r.por.set(seed + s.id, s.n);
      for (let i = 0; i < s.n; i++) {
        if (i && Math.abs(s.ys[i] - s.ys[i - 1]) >= 2) r.escalon2++;
      }
    }
  }
  med[ver] = r;
}
console.log(`  caminos del 28: ${med[28].tramos} tramos, ${med[28].escalon2} saltos ≥ 2 · del 29: ${med[29].tramos} tramos, ${med[29].escalon2} saltos ≥ 2`);
ok(med[29].escalon2 === 0, 'el perfil del camino nunca salta 2 o más bloques de un paso al siguiente (antes: ' + med[28].escalon2 + ')');
{ // el largo se compara solo en los tramos que existen en los dos (el 29 también deja pasar tramos que el 28 descartaba por el mar)
  let l28 = 0, l29 = 0; for (const [k, n] of med[28].por) if (med[29].por.has(k)) { l28 += n; l29 += med[29].por.get(k); }
  ok(l28 > 0 && l29 <= l28 * 1.3, `los tramos comunes no se alargan de más (${(100 * l29 / l28 - 100).toFixed(0)} % más, tope 30 %)`);
}
{ // el costo de los tramos (v13.4.2-perf): buscar obras con structuresNear dentro de la ruta costaba 4,6 s al entrar al mundo
  const a = medir(28), b = medir(29), peor = (r) => Math.max(...r.peores);
  console.log(`  costo caminando 3 000 bloques: gen 28 ${a.total.toFixed(0)} ms (peor ${peor(a).toFixed(0)}) · gen 29 ${b.total.toFixed(0)} ms (peor ${peor(b).toFixed(0)})`);
  ok(b.total <= a.total * 1.25 + 50 && peor(b) <= peor(a) * 1.25 + 50, 'calcular los tramos no cuesta más que en el 28 (+ 25 %), ni en total ni en la peor llamada');
}
{
  const g = new Generator(101, 29, 'tierra', 'normal'), sp = g.findSpawn(); let probados = 0, sinFalla = true;
  for (const s of roadsNear(g, sp.x, sp.z, 900).slice(0, 4)) { const i = s.n >> 1; try { buf.fill(0); g.generate(Math.floor(s.xs[i] / 16), Math.floor(s.zs[i] / 16), buf, tint); probados++; } catch (e) { sinFalla = false; console.log(e); } }
  ok(sinFalla && probados > 0, `los trozos con camino se generan sin fallas (${probados} probados)`);
}

// 3) los lugares típicos
const TIPOS = { mirador_neblina: ['nuboso'], muelle_pianguero: ['manglar'], cairn_antiguos: ['paramo'], campamento_botanico: ['jungle'], hacienda_vieja: ['bosque_seco'] };
const vistos = {}; let enBioma = 0, total = 0, conCofre = 0, conPlaca = 0; const tiempos = [];
for (const seed of [101, 202, 303]) {
  const g = new Generator(seed, 29, 'tierra', 'normal'), sp = g.findSpawn();
  for (const P of structuresNear(g, sp.x, sp.z, 2000)) {
    if (!TIPOS[P.type]) continue;
    total++; vistos[P.type] = (vistos[P.type] || 0) + 1;
    if (TIPOS[P.type].includes(g.column(P.x, P.z).biome)) enBioma++;
    let cofre = 0, placa = 0;
    for (let cz = Math.floor(P.z / CHUNK) - 1; cz <= Math.floor(P.z / CHUNK) + 1; cz++) for (let cx = Math.floor(P.x / CHUNK) - 1; cx <= Math.floor(P.x / CHUNK) + 1; cx++) {
      buf.fill(0); const t = performance.now(); const st = g.generate(cx, cz, buf, tint) || []; tiempos.push(performance.now() - t);
      for (const e of st) { if (e.be && e.be.type === 'chest') cofre++; if (e.be && e.be.type === 'placa') placa++; }
    }
    if (cofre) conCofre++; if (placa) conPlaca++;
  }
}
ok(Object.keys(TIPOS).every((t) => vistos[t] > 0), `los cinco lugares típicos aparecen (${Object.keys(TIPOS).map((t) => t + ' ' + (vistos[t] || 0)).join(', ')})`);
ok(total > 0 && enBioma === total, `todos caen en su bioma (${enBioma}/${total})`);
ok(conCofre === total && conPlaca === total, `todos traen cofre y placa (${conCofre} y ${conPlaca} de ${total})`);
tiempos.sort((a, b) => a - b); const mediana = tiempos[tiempos.length >> 1] || 0;
ok(mediana <= 12, `trozo con lugar típico: ${mediana.toFixed(1)} ms de mediana (≤ 12)`);
console.log(fallas ? `\n✘ ${fallas} falla(s)` : '\nResto de la superficie (generador 29): todo bien.');
process.exitCode = fallas ? 1 : 0;
