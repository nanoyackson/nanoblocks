// v13.2.0 (lo hondo es más difícil): (1) los mundos de generador 22 (y 21) salen IDÉNTICOS a como salían en la 13.1.2 (huella FNV);
// (2) el generador 23 es determinista, sin Math.random, y su lava por trozo CRECE conforme se baja (tabla por banda de profundidad, antes
// = generador 22 y después = 23); la lava de arriba de y = 30 no cambia y ninguna bolsa de lava se escapa de lado ni hacia abajo;
// (3) la curva de luz baja de forma monótona, sin saltos, y respeta el mínimo; el casco y la niebla se portan; (4) el tiempo por trozo.
// Uso: node tools/revisar-profundidad.mjs
import { Generator } from '../src/worldgen.js';
import { GEN_PROF, LAVA_TOPE, LAVA_FONDO } from '../src/worldgen2.js';
import { GEN_MAX } from '../src/version.js';
import { BLOCK_BY_KEY as K } from '../src/blocks.js';
import { PROF_ALTA, PROF_BAJA, LUZ_MIN, profK, luzAmbiente, brilloProf, nieblaProf } from '../src/profundidad.js';

let fallas = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fallas++; };
const CH = 16, ALTO = 128;
const idx = (x, y, z) => x + z * CH + y * CH * CH;

function huella(seed, ver, cx0 = -3, cz0 = -3, n = 6) {
  const gen = new Generator(seed, ver), buf = new Uint16Array(CH * CH * ALTO);
  let h = 2166136261 >>> 0;
  for (let cz = cz0; cz < cz0 + n; cz++) for (let cx = cx0; cx < cx0 + n; cx++) {
    buf.fill(0); gen.generate(cx, cz, buf, null);
    for (let i = 0; i < buf.length; i++) { h ^= buf[i]; h = Math.imul(h, 16777619) >>> 0; }
  }
  return '0x' + h.toString(16);
}
// calculadas con el código de la v13.1.2 (antes de esta versión)
const HUELLAS_ANTES = { '123457/22': '0xc835aebf', '777/22': '0x466b782d', '2026/22': '0x9d98ad55' };
for (const k of Object.keys(HUELLAS_ANTES)) {
  const [s, v] = k.split('/').map(Number), h = huella(s, v);
  ok(h === HUELLAS_ANTES[k], `mundo ${v} (semilla ${s}) idéntico a la 13.1.2: ${h}${h === HUELLAS_ANTES[k] ? '' : ' (esperaba ' + HUELLAS_ANTES[k] + ')'}`);
}
ok(GEN_PROF === 23 && GEN_MAX >= GEN_PROF, `GEN_PROF = 23 y GEN_MAX (${GEN_MAX}) lo cubre`);
const aleat = Math.random; let usos = 0; Math.random = () => { usos++; return aleat(); };
const a = huella(123457, 23), b = huella(123457, 23);
Math.random = aleat;
ok(usos === 0 && a === b, `el generador 23 es determinista y no usa Math.random (${usos} usos): ${a}`);
ok(a !== huella(123457, 22), 'el generador 23 cambia lo hondo respecto al 22');

// ---- la lava por banda ----
const BANDAS = [[11, 15], [16, 20], [21, 25], [26, 30], [31, 45]];
const SEMILLAS = [123457, 777, 2026, 31337], N = 6; // 4 semillas × 36 trozos
function mundo(seed, ver) {
  const gen = new Generator(seed, ver), trozos = new Map(); let ms = 0;
  for (let cz = -3; cz < -3 + N; cz++) for (let cx = -3; cx < -3 + N; cx++) {
    const buf = new Uint16Array(CH * CH * ALTO);
    gen.generate(cx, cz, new Uint16Array(CH * CH * ALTO), null); // calentamiento (el primer pasaje paga la compilación)
    const t0 = performance.now();
    gen.generate(cx, cz, buf, null); ms += performance.now() - t0;
    trozos.set(cx + ',' + cz, buf);
  }
  return { trozos, ms: ms / (N * N) };
}
const cuenta = (m) => {
  const por = BANDAS.map(() => 0); let fondo = 0;
  for (const buf of m.trozos.values()) for (let y = 1; y < ALTO; y++) for (let i = 0; i < CH * CH; i++) {
    if (buf[i + y * CH * CH] !== K.lava) continue;
    if (y <= LAVA_FONDO) fondo++; else BANDAS.forEach(([lo, hi], j) => { if (y >= lo && y <= hi) por[j]++; });
  }
  return { por, fondo };
};
const antes = BANDAS.map(() => 0), despues = BANDAS.map(() => 0);
let fondoA = 0, fondoD = 0, msA = 0, msD = 0, fugas = 0, charcos = 0;
const bloque = (m, x, y, z) => { const buf = m.trozos.get(Math.floor(x / CH) + ',' + Math.floor(z / CH)); return buf ? buf[idx(((x % CH) + CH) % CH, y, ((z % CH) + CH) % CH)] : -1; };
for (const s of SEMILLAS) {
  const m22 = mundo(s, 22), m23 = mundo(s, 23), c22 = cuenta(m22), c23 = cuenta(m23);
  c22.por.forEach((v, j) => { antes[j] += v; }); c23.por.forEach((v, j) => { despues[j] += v; });
  fondoA += c22.fondo; fondoD += c23.fondo; msA += m22.ms; msD += m23.ms;
  // la lava no se escapa: ni de lado ni hacia abajo (adentro del área generada)
  for (let cz = -2; cz < -4 + N; cz++) for (let cx = -2; cx < -4 + N; cx++) {
    const buf = m23.trozos.get(cx + ',' + cz);
    for (let y = LAVA_FONDO + 1; y <= LAVA_TOPE; y++) for (let z = 0; z < CH; z++) for (let x = 0; x < CH; x++) {
      if (buf[idx(x, y, z)] !== K.lava) continue;
      charcos++;
      const wx = cx * CH + x, wz = cz * CH + z;
      for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, -1, 0]]) { const v = bloque(m23, wx + dx, y + dy, wz + dz); if (v === 0 || v === K.water) fugas++; }
    }
  }
}
const por = (v) => (v / (SEMILLAS.length * N * N)).toFixed(1).padStart(8);
console.log('\n  Lava por trozo (promedio de ' + SEMILLAS.length * N * N + ' trozos)');
console.log('  banda de y     antes (22)   después (23)');
console.log('  y ≤ ' + LAVA_FONDO + '      ' + por(fondoA) + '     ' + por(fondoD) + '   (el piso de siempre)');
BANDAS.forEach(([lo, hi], j) => console.log(`  ${String(lo).padStart(2)}–${String(hi).padEnd(2)}        ${por(antes[j])}     ${por(despues[j])}`));
console.log('');
ok(fondoA === fondoD, `el piso de lava de siempre (y ≤ ${LAVA_FONDO}) no cambió: ${fondoA} = ${fondoD}`);
ok(despues.slice(0, 4).every((v, j) => v > antes[j]), 'en cada banda de 11 a 30 hay más lava que en el generador 22');
ok(despues[0] > despues[1] && despues[1] > despues[2] && despues[2] > despues[3] && despues[3] > 0, `la lava crece hacia el fondo (de y 30 a y 11): ${despues.slice(0, 4).map((v) => por(v).trim()).reverse().join(' < ')} por trozo`);
ok(despues[4] === antes[4], `arriba de y = ${LAVA_TOPE} la lava es la de siempre (${antes[4]} = ${despues[4]})`);
ok(charcos > 0 && fugas === 0, `ninguna bolsa de lava (${charcos} bloques) se escapa de lado ni hacia abajo (${fugas} fugas)`);
console.log(`  tiempo por trozo: generador 22 ${(msA / SEMILLAS.length).toFixed(1)} ms, generador 23 ${(msD / SEMILLAS.length).toFixed(1)} ms`);
ok(msD / SEMILLAS.length <= 12 || msD <= msA * 1.2, 'el generador 23 no pasa de 12 ms por trozo (o no más de 20 % sobre el 22)');

// ---- la luz ----
const ys = []; for (let y = 120; y >= 0; y--) ys.push(y);
const luz = ys.map((y) => luzAmbiente(y));
console.log('\n  Curva de luz (1 = normal): ' + [60, 40, 35, 30, 25, 20, 15, 10, 5].map((y) => `y${y}=${luzAmbiente(y).toFixed(2)}`).join('  '));
ok(luz.every((v, i) => i === 0 || v <= luz[i - 1] + 1e-12), 'la luz ambiente baja de forma monótona al bajar');
ok(ys.every((y, i) => y < PROF_ALTA || luz[i] === 1), `normal (1.00) de y = ${PROF_ALTA} para arriba`);
ok(luz.every((v) => v >= LUZ_MIN - 1e-12) && Math.abs(luzAmbiente(PROF_BAJA) - LUZ_MIN) < 1e-9 && luzAmbiente(2) === luzAmbiente(PROF_BAJA), `casi negro (${LUZ_MIN}) de y = ${PROF_BAJA} para abajo y nunca menos`);
ok(luz.every((v, i) => i === 0 || luz[i - 1] - v < 0.1), 'sin saltos: ningún escalón de un bloque pasa de 0.10');
ok(profK(PROF_ALTA) === 0 && profK(PROF_BAJA) === 1 && profK(27.5) > 0.4 && profK(27.5) < 0.6, 'profK: 0 en y 40, 1 en y 15, a medias en medio');
const ks = [0, 0.25, 0.5, 0.75, 1], sin = ks.map((k) => brilloProf(0, false, k)), con = ks.map((k) => brilloProf(0, true, k));
ok(con.every((v, i) => v >= sin[i]) && con[4] > con[0] && con[0] === 0.55, `el casco sube con la hondura: ${con.map((v) => v.toFixed(2)).join(' → ')} (sin casco ${sin.map((v) => v.toFixed(2)).join(' → ')})`);
ok(brilloProf(1, false, 1) < brilloProf(1, false, 0) && brilloProf(-1, false, 1) === -1, 'el deslizador de brillo no deja lavada la oscuridad (y el modo oscuro no cambia)');
const ni = [0, 0.5, 1].map((k) => nieblaProf(100, 190, k));
ok(ni[0].far === 190 && ni[1].far < ni[0].far && ni[2].far < ni[1].far && ni[2].far >= 40 && ni[2].near <= ni[0].near, `la niebla se acorta con la hondura (far ${ni.map((n) => Math.round(n.far)).join(' → ')})`);
process.exitCode = fallas ? 1 : 0;
console.log(fallas ? `\n✘ ${fallas} falla(s)` : '\nProfundidad: todo bien.');
