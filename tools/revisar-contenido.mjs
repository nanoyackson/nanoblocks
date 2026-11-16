// v13.3.4 (CB0 del plan de contenido del mundo, docs/revisiones/PLAN_CONTENIDO_MUNDO.md §10.4): las densidades de lo que ya existe, medidas
// con 6 semillas y una ventana de 2 400 × 2 400 bloques alrededor del inicio. Cada regla tiene un rango:
//   · si la regla ya se cumple, es una falla que se salga (✘ y `npm run revisar` se pone en rojo);
//   · si hoy NO se cumple y está en «deuda», sale ⚠ con el número real y la versión que la arregla (no rompe nada: es el punto de partida);
//   · cuando esa versión llegue, se quita la marca `deuda` y la regla pasa a ser estricta.
// Uso: node tools/revisar-contenido.mjs [version-del-generador, 27 por omisión]
import { Generator } from '../src/worldgen.js';
import { BLOCK_BY_KEY as K } from '../src/blocks.js';
import { cercaDeObra, structuresNear } from '../src/estructuras.js';
import { GEN_SIMAS, GEN_CARACTER } from '../src/worldgen2.js';

const VER = +(process.argv[2] || GEN_CARACTER);
const SEMILLAS = [101, 202, 303, 404, 505, 606];
const ST = 8, N = 300, CH = 16; // ventana de 2 400 bloques con una columna cada 8
let fallas = 0, deudas = 0;
const lineas = [];
function regla(id, texto, valor, min, max, deuda = '') {
  const dentro = valor >= min && valor <= max, num = Number.isInteger(valor) ? valor : valor.toFixed(2);
  if (dentro) lineas.push(`  ✔ ${texto}: ${num} (rango ${min}-${max})`);
  else if (deuda) { deudas++; lineas.push(`  ⚠ ${texto}: ${num} (rango ${min}-${max}) · deuda → ${deuda}`); }
  else { fallas++; lineas.push(`  ✘ ${texto}: ${num} (rango ${min}-${max})`); }
}
const prom = (a) => a.reduce((s, v) => s + v, 0) / (a.length || 1);

// ---------- 1) salones, simas y bocas gigantes: solo los emplazadores, sin generar bloques ----------
const RC = 96;
const sal = [], sim = [], gig = [], simD150 = [], gigD450 = [], simMal = [];
// ---------- 2) biomas ----------
const pctMax = [], pctMinIdent = [], playa = [], manchas = [], hallazgo = {}, brusco = [], estruc = {};
const IDENT = ['desert', 'bosque_seco', 'manglar', 'nuboso', 'jungle', 'paramo', 'volcano', 'mountains'];
// ---------- 3) minerales por zona ----------
const oro = { Z1: [], Z2: [], Z3: [] }, dia = { Z1: [], Z2: [], Z3: [] }, jade = [];
// ---------- 4) salones: piso seco ----------
let nSalPiso = 0, seco60 = 0, lava50 = 0, agua50 = 0;

const buf = new Uint16Array(CH * CH * 128), tint = new Float32Array(CH * CH * 3);
const t0 = performance.now();
for (const seed of SEMILLAS) {
  const g = new Generator(seed, VER, 'tierra', 'normal'), sp = g.findSpawn();
  const X0 = Math.round(sp.x) - (N * ST) / 2, Z0 = Math.round(sp.z) - (N * ST) / 2, area = (N * ST / CH) ** 2; // trozos en la ventana
  // --- nodos de la Red Honda ---
  let nS = 0, nSim = 0, nGig = 0;
  for (let gz = Math.floor(Z0 / RC); gz <= Math.floor((Z0 + N * ST) / RC); gz++) for (let gx = Math.floor(X0 / RC); gx <= Math.floor((X0 + N * ST) / RC); gx++) {
    const n = g.v2.cmNodo(gx, gz);
    if (n.x < X0 || n.x >= X0 + N * ST || n.z < Z0 || n.z >= Z0 + N * ST) continue;
    if (n.salon) nS++;
    if (n.sima) {
      nSim++; const d = Math.hypot(n.sima.x - sp.x, n.sima.z - sp.z);
      if (n.sima.gigante) { nGig++; if (d < 450) gigD450.push(d); } else if (d < 150) simD150.push(d);
      if (cercaDeObra(g, n.sima.x, n.sima.z)) simMal.push(1);
    }
  }
  sal.push(nS / area * 1000); sim.push(nSim / area * 1000); gig.push(nGig / area * 1000);
  // --- biomas ---
  const grid = new Array(N * N), hh = new Float32Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const c = g.column(X0 + i * ST, Z0 + j * ST); grid[j * N + i] = c.biome; hh[j * N + i] = c.h; }
  const cnt = {}; for (const b of grid) cnt[b] = (cnt[b] || 0) + 1;
  const tot = N * N, pc = (b) => 100 * (cnt[b] || 0) / tot;
  pctMax.push(Math.max(...Object.values(cnt).map((v) => 100 * v / tot)));
  pctMinIdent.push(Math.min(...IDENT.map(pc)));
  playa.push(pc('beach'));
  // manchas de 4 vecinos: parte del área de los biomas con identidad que cae en manchas ≥ 40 trozos (≈ 640 × 640)
  const vis = new Uint8Array(N * N), ar = {}, grande = {};
  for (let s = 0; s < N * N; s++) {
    if (vis[s]) continue;
    const b = grid[s], pila = [s]; vis[s] = 1; let a = 0;
    while (pila.length) {
      const k = pila.pop(); a++; const x = k % N, y = (k / N) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; const q = ny * N + nx; if (!vis[q] && grid[q] === b) { vis[q] = 1; pila.push(q); } }
    }
    const trozos = a * ST * ST / (CH * CH);
    ar[b] = (ar[b] || 0) + trozos; if (trozos >= 40) grande[b] = (grande[b] || 0) + trozos;
  }
  const ids = IDENT.filter((b) => ar[b]); manchas.push(100 * ids.reduce((s, b) => s + (grande[b] || 0), 0) / (ids.reduce((s, b) => s + ar[b], 0) || 1));
  // primer hallazgo de cada bioma (distancia mínima al inicio)
  const dmin = {};
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const b = grid[j * N + i], d = Math.hypot(X0 + i * ST - sp.x, Z0 + j * ST - sp.z); if (dmin[b] === undefined || d < dmin[b]) dmin[b] = d; }
  for (const b of Object.keys(dmin)) if (b !== 'ocean' && b !== 'beach') (hallazgo[b] = hallazgo[b] || []).push(dmin[b]);
  let br = 0, tt = 0;
  for (let j = 0; j < N; j++) for (let i = 0; i < N - 1; i++) { if (grid[j * N + i] !== grid[j * N + i + 1]) { tt++; if (Math.abs(hh[j * N + i] - hh[j * N + i + 1]) > 8) br++; } }
  brusco.push(100 * br / (tt || 1));
  // --- estructuras por 1 000 trozos de cada bioma ---
  const radio = (N * ST) / 2, lista = structuresNear(g, sp.x, sp.z, radio);
  const porBioma = {};
  for (const P of lista) { const b = g.column(P.x, P.z).biome; porBioma[b] = (porBioma[b] || 0) + 1; }
  for (const b of Object.keys(cnt)) { if (b === 'ocean' || b === 'beach') continue; const trozosBioma = cnt[b] * ST * ST / (CH * CH); (estruc[b] = estruc[b] || []).push((porBioma[b] || 0) / trozosBioma * 1000); }
  // --- minerales: 96 trozos por zona, en posiciones fijas por semilla ---
  const zonas = { Z1: [60, 290], Z2: [320, 980], Z3: [1020, 1500] };
  for (const [z, [r0, r1]] of Object.entries(zonas)) {
    let d = 0, o = 0, jd = 0; const M = 64;
    for (let k = 0; k < M; k++) {
      const a = ((k * 137.508 + seed) % 360) * Math.PI / 180, r = r0 + ((k * 0.61803398875) % 1) * (r1 - r0);
      const cx = Math.floor((sp.x + Math.cos(a) * r) / CH), cz = Math.floor((sp.z + Math.sin(a) * r) / CH);
      buf.fill(0); g.generate(cx, cz, buf, tint);
      for (let i = 0; i < buf.length; i++) { const id = buf[i]; if (id === K.diamond_ore || id === K.deep_diamond_ore) d++; else if (id === K.gold_ore || id === K.deep_gold_ore) o++; else if (id === K.jade_ore) jd++; }
    }
    dia[z].push(d / M); oro[z].push(o / M); if (z === 'Z2') jade.push(jd / M);
  }
  // --- piso seco de los salones (ventana de 1 200 bloques) ---
  const cache = new Map();
  const get = (x, y, z) => { const cx = Math.floor(x / CH), cz = Math.floor(z / CH), kk = cx + ',' + cz; let b = cache.get(kk); if (!b) { b = new Uint16Array(CH * CH * 128); g.generate(cx, cz, b, new Float32Array(768)); cache.set(kk, b); if (cache.size > 300) cache.delete(cache.keys().next().value); } return b[(x & 15) + (z & 15) * 16 + y * 256]; };
  for (let gz = Math.floor((sp.z - 600) / RC); gz <= Math.floor((sp.z + 600) / RC); gz++) for (let gx = Math.floor((sp.x - 600) / RC); gx <= Math.floor((sp.x + 600) / RC); gx++) {
    const n = g.v2.cmNodo(gx, gz); if (!n.salon) continue;
    let tn = 0, la = 0, ag = 0, so = 0;
    for (let dz = -0.7; dz <= 0.7; dz += 0.2) for (let dx = -0.7; dx <= 0.7; dx += 0.2) {
      if (dx * dx + dz * dz > 0.49) continue;
      const x = Math.floor(n.x + dx * n.rx), z = Math.floor(n.z + dz * n.rz);
      for (let yy = Math.floor(n.y + n.ry * 0.5); yy > Math.floor(n.y - n.ry - 6) && yy > 2; yy--) { const id = get(x, yy, z); if (id === 0) continue; tn++; if (id === K.lava) la++; else if (id === K.water) ag++; else so++; break; }
    }
    if (tn < 12) continue;
    nSalPiso++; if (so / tn >= 0.6) seco60++; if (la / tn > 0.5) lava50++; if (ag / tn > 0.5) agua50++;
  }
}

console.log(`Contenido del mundo (generador ${VER}, ${SEMILLAS.length} semillas, ventana de 2 400 × 2 400; ${((performance.now() - t0) / 1000).toFixed(0)} s)`);
lineas.push('· Cuevas (solo emplazadores)');
regla('sal', 'salones por 1 000 trozos', prom(sal), 12, 22);
if (VER >= GEN_SIMAS) {
  regla('sim', 'simas por 1 000 trozos', prom(sim), 2.5, 6, 'v13.4.1 (simas moderadas)');
  regla('simD', 'simas a menos de 150 del inicio', simD150.length, 0, 0, 'v13.4.1');
  regla('simM', 'simas sobre pueblo u obra', simMal.length, 0, 0);
  regla('gig', 'bocas gigantes por 1 000 trozos', prom(gig), 0, 0.6, 'v13.4.1');
  regla('gigD', 'bocas gigantes a menos de 450 del inicio', gigD450.length, 0, 0, 'v13.4.1');
}
lineas.push('· Minerales (64 trozos por zona y semilla)');
regla('dia1', 'diamante por trozo, Z1 (< 300)', prom(dia.Z1), 1.5, 3.5, 'v13.4.1 (CC2)');
regla('dia2', 'diamante por trozo, Z2 (300-1 000)', prom(dia.Z2), 3, 5.5, 'v13.4.1 (CC2)');
regla('dia3', 'diamante por trozo, Z3 (> 1 000)', prom(dia.Z3), 4, 6.5, 'v13.4.1 (CC2)');
regla('jade', 'jade por trozo', prom(jade), 0.2, 1.0);
regla('oro2', 'oro por trozo, Z2 (plan: ≈ 11)', prom(oro.Z2), 8, 14, 'v13.4.1 (CC2)');
lineas.push('· Biomas');
regla('bmax', 'el bioma más grande ocupa (%)', prom(pctMax), 0, 30);
regla('bmin', 'el menor de los 8 con identidad ocupa (%)', prom(pctMinIdent), 1.5, 100);
regla('playa', 'playa (% del mundo)', prom(playa), 6, 10);
regla('mancha', 'área de los biomas con identidad en manchas ≥ 40 trozos (%)', prom(manchas), 50, 100);
const lejos = Object.entries(hallazgo).filter(([, v]) => v.filter((d) => d <= 700).length < 5).map(([b]) => b);
regla('hallazgo', 'biomas cuyo primer hallazgo pasa de 700 bloques en 2 o más semillas', lejos.length, 0, 0);
regla('brusco', 'fronteras con salto de más de 8 de altura (%)', prom(brusco), 0, 8);
const sinEst = Object.entries(estruc).filter(([, v]) => prom(v) < 3).map(([b, v]) => `${b} ${prom(v).toFixed(1)}`);
regla('estr', 'biomas con menos de 3 estructuras por 1 000 trozos', sinEst.length, 0, 0, sinEst.length ? 'faltan: ' + sinEst.join(', ') : '');
lineas.push('· Piso de los salones (' + nSalPiso + ' salones)');
regla('seco', 'salones con ≥ 60 % de piso seco (%)', 100 * seco60 / (nSalPiso || 1), 90, 100);
regla('lava', 'salones con lava en más de la mitad del piso (%)', 100 * lava50 / (nSalPiso || 1), 0, 1.5);
regla('agua', 'salones con agua en más de la mitad del piso (%)', 100 * agua50 / (nSalPiso || 1), 0, 6);
lineas.push('· Aún sin medir (no existen): lugares de cueva y dueños (CC3/CC4), Caldera por zona.');
console.log(lineas.join('\n'));
console.log(fallas ? `\n✘ ${fallas} falla(s) · ${deudas} deuda(s) conocida(s)` : `\nContenido: sin fallas (${deudas} deuda(s) conocida(s), con su versión, para cerrar en las próximas).`);
process.exitCode = fallas ? 1 : 0;
