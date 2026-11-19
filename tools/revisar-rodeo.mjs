// v13.8.0 (generador 33): el rodeo de los lugares con gente y su flora propia (docs/revisiones/RODEO_FLORA.md). Comprueba, en el mismo proceso y contra el generador 32:
//  1) el rodeo: con el generador 33 los caminos cruzan bastante menos los lugares del conjunto MEDIA (≥ 25 % menos en 3 semillas; el estudio midió −44 %);
//  2) la flora: los lugares de la lista de FLORA33 traen más plantas dentro de su radio que con el 32;
//  3) el costo: la primera llamada de roadsNear y el paso más largo de calentarObras (repartido en cuadros, ningún tirón grande);
//  4) los mundos de generador 32 no cambian (ya lo cubre tools/huella-mundos.mjs; aquí solo un tramo y un trozo con lugar de cada versión).
// Uso: node tools/revisar-rodeo.mjs
import { Generator, CHUNK, HEIGHT } from '../src/worldgen.js';
import { roadsNear, calentarObras } from '../src/carreteras.js';
import { structuresNear, structRadius } from '../src/estructuras.js';
import { BLOCK_BY_KEY as K } from '../src/blocks.js';

let fallas = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fallas++; };
const MEDIA = new Set(['faro', 'churchill', 'caldera', 'carreta', 'estatua', 'guanacaste', 'tarcoles', 'metalico', 'correos', 'museo_ninos', 'coronado', 'santa_rosa', 'ujarras', 'monumento_nacional', 'templo_musica', 'mirador_poas', 'mirador_arenal', 'refugio', 'orosi', 'esferas', 'aduana', 'trapiche', 'bananera', 'catarata', 'puente_colgante', 'rincon_vieja', 'barra_honda']);
const W = 2400;

function cruces(g, sp) {
  const segs = new Map();
  for (let x = sp.x - W; x <= sp.x + W; x += 400) for (let z = sp.z - W; z <= sp.z + W; z += 400) for (const s of roadsNear(g, x, z, 420)) segs.set(s.id, s);
  const dmin = (s, px, pz) => { let m = 1e9; for (let i = 0; i < s.xs.length; i++) { const d = Math.hypot(s.xs[i] - px, s.zs[i] - pz); if (d < m) m = d; } return m; };
  const esExt = (s, px, pz) => Math.hypot(s.A.x - px, s.A.z - pz) < 12 || Math.hypot(s.B.x - px, s.B.z - pz) < 12;
  let n = 0;
  for (const P of structuresNear(g, sp.x, sp.z, W + 200, MEDIA)) {
    const r = structRadius(g, P.type) + 4;
    for (const s of segs.values()) {
      if (s.x1 < P.x - r || s.x0 > P.x + r || s.z1 < P.z - r || s.z0 > P.z + r || esExt(s, P.x, P.z)) continue;
      if (dmin(s, P.x, P.z) < r) n++;
    }
  }
  return { n, tramos: segs.size };
}

let c32 = 0, c33 = 0, t32 = 0, t33 = 0;
for (const seed of [101, 202, 303]) {
  const g32 = new Generator(seed, 32), g33 = new Generator(seed, 33), sp = g32.findSpawn();
  let t0 = performance.now(); const a = cruces(g32, sp); t32 += performance.now() - t0;
  t0 = performance.now(); const b = cruces(g33, sp); t33 += performance.now() - t0;
  console.log(`  semilla ${seed}: cruces con lugares MEDIA ${a.n} (gen 32, ${a.tramos} tramos) → ${b.n} (gen 33, ${b.tramos} tramos)`);
  c32 += a.n; c33 += b.n;
}
ok(c32 >= 10 && c33 <= c32 * 0.75, `rodeo: ${c32} cruces con el 32 → ${c33} con el 33 (${(100 * (c33 - c32) / c32).toFixed(0)} %; se pide ≥ 25 % menos)`);
console.log(`  tiempo de armar los tramos de la ventana de ${2 * W} (Node, frío): gen 32 ${t32.toFixed(0)} ms · gen 33 ${t33.toFixed(0)} ms`);

// calentarObras reparte en cuadros: el paso más largo caminando por la ventana
{
  const g = new Generator(404, 33), sp = g.findSpawn(); let max = 0, llamadas = 0;
  for (let i = 0; i < 60; i++) {
    const x = sp.x + i * 60, z = sp.z + i * 35;
    for (let k = 0; k < 400; k++) { const t0 = performance.now(); const sigue = calentarObras(g, x, z, 0); const dt = performance.now() - t0; llamadas++; if (dt > max) max = dt; if (!sigue) break; }
  }
  ok(max < 40, `calentarObras (gen 33): el paso más largo de ${llamadas} llamadas fue ${max.toFixed(0)} ms (< 40 ms en Node; en el navegador ≈ 2×, y la orquestadora pide < 50)`);
}

// flora: plantas dentro del radio de cada lugar de la lista, 32 contra 33
const PLANTAS = new Set(['flower_yellow', 'flower_red', 'pajon', 'helecho', 'bromelia', 'musgo', 'cane'].map((k) => K[k]));
const TIPOS = new Set(['feria', 'lecheria', 'santa_rosa', 'termales', 'correos', 'metalico', 'museo_ninos', 'aduana', 'esferas', 'catarata', 'barra_honda', 'templo_musica', 'tenorio', 'corcovado', 'juan_castro', 'rincon_parque', 'hacienda', 'beneficio', 'capital', 'grecia']);
function plantasEn(g, P, R) {
  let n = 0; const buf = new Uint16Array(CHUNK * CHUNK * HEIGHT), tint = new Float32Array(CHUNK * CHUNK * 3);
  for (let cz = Math.floor((P.z - R) / CHUNK); cz <= Math.floor((P.z + R) / CHUNK); cz++) for (let cx = Math.floor((P.x - R) / CHUNK); cx <= Math.floor((P.x + R) / CHUNK); cx++) {
    buf.fill(0); g.generate(cx, cz, buf, tint);
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      if (Math.hypot(cx * CHUNK + lx - P.x, cz * CHUNK + lz - P.z) > R) continue;
      for (let y = 40; y < 120; y++) if (PLANTAS.has(buf[lx + lz * CHUNK + y * CHUNK * CHUNK])) n++;
    }
  }
  return n;
}
{
  let a = 0, b = 0, lugares = 0; const porTipo = {};
  for (const seed of [101, 202]) {
    const g32 = new Generator(seed, 32), g33 = new Generator(seed, 33), sp = g32.findSpawn(), vistos = new Set();
    for (const P of structuresNear(g32, sp.x, sp.z, 1800, TIPOS)) {
      if (vistos.has(P.type) || lugares > 14) continue; vistos.add(P.type); lugares++;
      const R = structRadius(g32, P.type), x = plantasEn(g32, P, R), y = plantasEn(g33, P, R); a += x; b += y; porTipo[P.type] = `${x}→${y}`;
    }
  }
  console.log('  plantas dentro del radio (32 → 33):', JSON.stringify(porTipo));
  ok(lugares >= 8 && b > a * 1.3, `flora: ${lugares} lugares, ${a} plantas con el 32 → ${b} con el 33 (≥ 30 % más)`);
}
console.log(fallas ? `\n✘ ${fallas} falla(s)` : '\nRodeo y flora: todo bien.');
process.exitCode = fallas ? 1 : 0;
