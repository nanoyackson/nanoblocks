// v13.5.1 (generador 31, caminos y flora): comprueba con generación real
//  1) zigzag (R3): en los tramos que hacen zigzag la pendiente máxima del terreno bajo el camino (ventana de 14) baja respecto al mismo tramo del 30, y el camino no tiene huecos (puntos vecinos a ≤ 1);
//  2) túnel (R4): existen, y en un trozo real el interior tiene 4 de aire, techo de piedra y piso de asfalto en casi todos sus puntos; no se mete dentro de un pueblo;
//  3) rodeo: los tramos que pasan por adentro de un pueblo ajeno bajan respecto al 30;
//  4) flora propia: los cinco lugares típicos traen plantas (el 30 no);
//  5) costo: los tramos al caminar 3 000 bloques cuestan ≤ 30 + 10 % (suma de seis semillas, total y peor llamada) y el trozo con camino se genera en ≤ 12 ms de mediana.
// Uso: node tools/revisar-caminos.mjs
import { Generator, CHUNK, HEIGHT } from '../src/worldgen.js';
import { roadsNear } from '../src/carreteras.js';
import { villageAt, CELL } from '../src/pueblogen.js';
import { structuresNear } from '../src/estructuras.js';
import { GEN_CAMINOS } from '../src/worldgen2.js';
import { GEN_MAX } from '../src/version.js';
import { BLOCK_BY_KEY as K } from '../src/blocks.js';
import { medirMin as medir } from './medir-tramo.mjs'; // mínimo de 3 repeticiones

let fallas = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fallas++; };
ok(GEN_CAMINOS === 31 && GEN_MAX >= 31, `GEN_CAMINOS = ${GEN_CAMINOS} y GEN_MAX = ${GEN_MAX}`);
const SEM = [101, 202, 303, 404, 505, 606];

function tramos(ver, seed) {
  const g = new Generator(seed, ver, 'tierra', 'normal'), sp = g.findSpawn();
  for (let d = -1500; d <= 3000; d += 16) roadsNear(g, sp.x + d, sp.z, 12);
  return { g, mapa: g.roadCache };
}
const gmax = (g, s) => { let m = 0; const h = s.xs.map((x, i) => g.column(x, s.zs[i]).h); for (let i = 0; i + 14 < h.length; i++) m = Math.max(m, Math.abs(h[i + 14] - h[i]) / 14); return m; };

// 1) y 2) y 3): comparar el 30 y el 31 por clave de tramo
let zigs = 0, mejor = 0, suma30 = 0, suma31 = 0, huecos = 0, tuneles = 0, pueblosMetidos30 = 0, pueblosMetidos31 = 0, total = 0;
const conTunel = [];
for (const seed of SEM) {
  const a = tramos(30, seed), b = tramos(31, seed);
  const dentro = (g, s) => {
    for (let i = 0; i < s.n; i += 4) {
      const cx = Math.floor(s.xs[i] / CELL), cz = Math.floor(s.zs[i] / CELL);
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        const v = villageAt(g, cx + dx, cz + dz);
        if (!v || !v.streets || (v.x === s.A.x && v.z === s.A.z) || (v.x === s.B.x && v.z === s.B.z)) continue;
        if (Math.abs(s.xs[i] - v.x) <= v.L && Math.abs(s.zs[i] - v.z) <= v.L) return true;
      }
    }
    return false;
  };
  for (const [key, s31] of b.mapa) {
    if (!s31) continue;
    total++;
    for (let i = 1; i < s31.n; i++) if (Math.max(Math.abs(s31.xs[i] - s31.xs[i - 1]), Math.abs(s31.zs[i] - s31.zs[i - 1])) > 1) { huecos++; break; }
    if (s31.tunel) { tuneles++; conTunel.push([seed, s31]); }
    if (dentro(b.g, s31)) pueblosMetidos31++;
    const s30 = a.mapa.get(key);
    if (s30 && dentro(a.g, s30)) pueblosMetidos30++;
    if (s31.zig && s30) { zigs++; const g30 = gmax(a.g, s30), g31 = gmax(b.g, s31); suma30 += g30; suma31 += g31; if (g31 < g30 - 0.02) mejor++; }
  }
}
console.log(`  ${total} tramos del 31 en 6 semillas: ${zigs} con zigzag, ${tuneles} con túnel`);
ok(huecos === 0, 'ningún camino del 31 tiene huecos entre puntos vecinos');
ok(zigs >= 5, `hay zigzags (${zigs})`);
ok(zigs > 0 && mejor >= 0.7 * zigs && suma31 <= 0.85 * suma30, `el zigzag baja la pendiente máxima: ${(suma30 / zigs).toFixed(2)} → ${(suma31 / zigs).toFixed(2)} de media; mejora en ${mejor} de ${zigs}`);
ok(tuneles >= 1, `hay túneles (${tuneles})`);
ok(pueblosMetidos31 <= pueblosMetidos30, `tramos que cruzan un pueblo ajeno: ${pueblosMetidos30} en el 30 → ${pueblosMetidos31} en el 31`);

// 2) el túnel en un trozo real
{
  const buf = new Uint16Array(CHUNK * CHUNK * HEIGHT), tint = new Float32Array(CHUNK * CHUNK * 3);
  let puntos = 0, buenos = 0, enPueblo = 0;
  for (const [seed, s] of conTunel.slice(0, 4)) {
    const g = new Generator(seed, 31, 'tierra', 'normal'), trozos = new Map();
    const bloque = (x, y, z) => {
      const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK), key = cx + ',' + cz;
      if (!trozos.has(key)) { buf.fill(0); g.generate(cx, cz, buf, tint); trozos.set(key, buf.slice()); }
      return trozos.get(key)[(x - cx * CHUNK) + (z - cz * CHUNK) * CHUNK + y * CHUNK * CHUNK];
    };
    for (let i = 0; i < s.n; i++) {
      if (!s.tunel[i] || !s.tunel[i - 3] || !s.tunel[i + 3]) continue; // el interior (los portales tienen la loma baja)
      puntos++;
      const x = s.xs[i], z = s.zs[i], y = s.ys[i], v = villageAt(g, Math.floor(x / CELL), Math.floor(z / CELL));
      if (v && v.streets && Math.abs(x - v.x) <= v.L + 1 && Math.abs(z - v.z) <= v.L + 1) enPueblo++;
      const aire = [1, 2, 3, 4].every((d) => bloque(x, y + d, z) === 0), piso = bloque(x, y, z) !== 0 && bloque(x, y, z) !== K.water, techo = bloque(x, y + 5, z) !== 0;
      if (aire && piso && techo) buenos++;
    }
  }
  ok(puntos > 0 && buenos >= 0.9 * puntos && enPueblo === 0, `túnel en trozos reales: ${buenos} de ${puntos} puntos con 4 de aire, piso y techo; ${enPueblo} dentro de un pueblo`);
}

// 4) flora propia
{
  const buf = new Uint16Array(CHUNK * CHUNK * HEIGHT), tint = new Float32Array(CHUNK * CHUNK * 3);
  const PLANTAS = new Set([K.orquidea, K.bromelia, K.helecho, K.tall_grass, K.musgo, K.flower_yellow, K.flower_red, K.pajon, K.mata_flor, K.cane]);
  const cuenta = (ver, seed, P) => {
    const g = new Generator(seed, ver, 'tierra', 'normal'); let n = 0;
    for (let cz = Math.floor((P.z - 20) / CHUNK); cz <= Math.floor((P.z + 20) / CHUNK); cz++) for (let cx = Math.floor((P.x - 20) / CHUNK); cx <= Math.floor((P.x + 20) / CHUNK); cx++) {
      buf.fill(0); g.generate(cx, cz, buf, tint);
      for (let i = 0; i < buf.length; i++) if (PLANTAS.has(buf[i])) { const y = Math.floor(i / 256), lz = Math.floor((i % 256) / 16), lx = i % 16; if (Math.hypot(cx * 16 + lx - P.x, cz * 16 + lz - P.z) <= 17 && y > 55) n++; }
    }
    return n;
  };
  for (const key of ['mirador_neblina', 'muelle_pianguero', 'cairn_antiguos', 'campamento_botanico', 'hacienda_vieja']) {
    let hecho = false;
    for (const seed of SEM) {
      const g = new Generator(seed, 31, 'tierra', 'normal'), L = structuresNear(g, 0, 0, 5000, new Set([key]));
      if (!L.length) continue;
      const P = L[0], n31 = cuenta(31, seed, P), n30 = cuenta(30, seed, P);
      ok(n31 > n30 + 8, `${key}: plantas alrededor ${n30} en el 30 → ${n31} en el 31`);
      hecho = true; break;
    }
    if (!hecho) ok(false, `${key}: no apareció en 5 000 de radio con seis semillas`);
  }
}

// 5) costo
{
  const s = { 30: { t: 0, p: 0 }, 31: { t: 0, p: 0 } };
  for (const seed of SEM) for (const ver of [30, 31]) { const r = medir(ver, seed); s[ver].t += r.total; s[ver].p += r.peores[0]; }
  ok(s[31].t <= s[30].t * 1.1 && s[31].p <= s[30].p * 1.1, `costo de los tramos (6 semillas): total ${s[30].t.toFixed(0)} → ${s[31].t.toFixed(0)} ms, peor llamada ${s[30].p.toFixed(0)} → ${s[31].p.toFixed(0)} ms (≤ +10 %)`);
  const buf = new Uint16Array(CHUNK * CHUNK * HEIGHT), tint = new Float32Array(CHUNK * CHUNK * 3), tiempos = [];
  const g = new Generator(202, 31, 'tierra', 'normal');
  for (const s2 of []) void s2;
  const tr = tramos(31, 202).mapa;
  for (const s2 of [...tr.values()].filter((s) => s).slice(0, 6)) for (let i = 0; i < s2.n; i += 12) { const cx = Math.floor(s2.xs[i] / 16), cz = Math.floor(s2.zs[i] / 16); buf.fill(0); const t0 = performance.now(); g.generate(cx, cz, buf, tint); tiempos.push(performance.now() - t0); }
  tiempos.sort((x, y) => x - y);
  ok(tiempos.length > 10 && tiempos[tiempos.length >> 1] <= 12, `trozo con camino: mediana ${(tiempos[tiempos.length >> 1] || 0).toFixed(1)} ms, p90 ${(tiempos[Math.floor(tiempos.length * 0.9)] || 0).toFixed(1)} ms (≤ 12)`);
}
console.log(fallas ? `\n✘ ${fallas} falla(s)` : '\nCaminos y flora del generador 31: todo bien.');
process.exitCode = fallas ? 1 : 0;
