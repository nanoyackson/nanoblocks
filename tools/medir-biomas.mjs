// v13.4.0: medidor rápido de la superficie (solo column(), sin generar bloques): reparto de biomas, playa, manchas, bordes bruscos y primer hallazgo.
// Sirve para afinar el generador 27 sin correr todo revisar-contenido. Uso: node tools/medir-biomas.mjs [version, 27 por omisión] [semillas separadas por coma]
import { Generator } from '../src/worldgen.js';
import { structuresNear } from '../src/estructuras.js';

const VER = +(process.argv.slice(2).filter((a) => !a.startsWith('--'))[0] || 27);
const ARGS = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const SEMILLAS = (ARGS[1] || '101,202,303,404,505,606').split(',').map(Number);
const ST = 8, N = 300, CH = 16;
const IDENT = ['desert', 'bosque_seco', 'manglar', 'nuboso', 'jungle', 'paramo', 'volcano', 'mountains'];
const prom = (a) => a.reduce((s, v) => s + v, 0) / (a.length || 1);
const estr = {}, tot = {}, manch = [], brusco = [], playa = [], hallazgo = {}, bruscoPor = {};
const t0 = performance.now();
for (const seed of SEMILLAS) {
  const g = new Generator(seed, VER, 'tierra', 'normal'), sp = g.findSpawn();
  const X0 = Math.round(sp.x) - (N * ST) / 2, Z0 = Math.round(sp.z) - (N * ST) / 2;
  const grid = new Array(N * N), hh = new Float32Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const c = g.column(X0 + i * ST, Z0 + j * ST); grid[j * N + i] = c.biome; hh[j * N + i] = c.h; }
  const cnt = {}; for (const b of grid) cnt[b] = (cnt[b] || 0) + 1;
  for (const b of Object.keys(cnt)) (tot[b] = tot[b] || []).push(100 * cnt[b] / (N * N));
  playa.push(100 * (cnt.beach || 0) / (N * N));
  const vis = new Uint8Array(N * N), ar = {}, grande = {};
  for (let s = 0; s < N * N; s++) {
    if (vis[s]) continue;
    const b = grid[s], pila = [s]; vis[s] = 1; let a = 0;
    while (pila.length) {
      const k = pila.pop(); a++; const x = k % N, y = (k / N) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; const q = ny * N + nx; if (!vis[q] && grid[q] === b) { vis[q] = 1; pila.push(q); } }
    }
    const tr = a * ST * ST / (CH * CH); ar[b] = (ar[b] || 0) + tr; if (tr >= 40) grande[b] = (grande[b] || 0) + tr;
  }
  const ids = IDENT.filter((b) => ar[b]); manch.push(100 * ids.reduce((s, b) => s + (grande[b] || 0), 0) / (ids.reduce((s, b) => s + ar[b], 0) || 1));
  const dmin = {};
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const b = grid[j * N + i], d = Math.hypot(X0 + i * ST - sp.x, Z0 + j * ST - sp.z); if (dmin[b] === undefined || d < dmin[b]) dmin[b] = d; }
  for (const b of Object.keys(dmin)) if (b !== 'ocean' && b !== 'beach') (hallazgo[b] = hallazgo[b] || []).push(dmin[b]);
  let br = 0, tt = 0;
  for (let j = 0; j < N; j++) for (let i = 0; i < N - 1; i++) {
    const a = grid[j * N + i], b = grid[j * N + i + 1];
    if (a !== b) { tt++; if (Math.abs(hh[j * N + i] - hh[j * N + i + 1]) > 8) { br++; const k = [a, b].sort().join('|'); bruscoPor[k] = (bruscoPor[k] || 0) + 1; } }
  }
  brusco.push(100 * br / (tt || 1));
  if (process.argv.includes('--est')) { const por = {}; for (const P of structuresNear(g, sp.x, sp.z, (N * ST) / 2)) { const b = g.column(P.x, P.z).biome; por[b] = (por[b] || 0) + 1; } for (const b of Object.keys(cnt)) { if (b === 'ocean' || b === 'beach') continue; (estr[b] = estr[b] || []).push((por[b] || 0) / (cnt[b] * ST * ST / (CH * CH)) * 1000); } }
}
console.log(`Biomas del generador ${VER} (${SEMILLAS.length} semillas, ${((performance.now() - t0) / 1000).toFixed(0)} s)`);
for (const [b, v] of Object.entries(tot).sort((x, y) => prom(y[1]) - prom(x[1]))) console.log(`  ${b.padEnd(12)} ${prom(v.concat(new Array(SEMILLAS.length - v.length).fill(0))).toFixed(1).padStart(5)} %  (${Math.min(...v).toFixed(1)}-${Math.max(...v).toFixed(1)})`);
console.log(`  playa ${prom(playa).toFixed(1)} % · manchas ≥ 40 trozos ${prom(manch).toFixed(0)} % · fronteras con salto > 8: ${prom(brusco).toFixed(1)} %`);
const lejos = Object.entries(hallazgo).map(([b, v]) => `${b} ${Math.round(prom(v))}${v.filter((d) => d <= 700).length < 5 ? '!' : ''}`);
console.log('  primer hallazgo (media, ! = lejos en ≥ 2 semillas): ' + lejos.join(', '));
console.log('  saltos por tipo de frontera: ' + Object.entries(bruscoPor).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${v}`).join(', '));
if (process.argv.includes('--est')) console.log('  estructuras por 1 000 trozos de cada bioma: ' + Object.entries(estr).map(([b, v]) => b + ' ' + prom(v).toFixed(1)).join(', '));
{ const porSemilla = SEMILLAS.map((_, i) => Math.min(...IDENT.map((b) => (tot[b] && tot[b].length === SEMILLAS.length ? tot[b][i] : (tot[b] || [])[i] ?? 0)))); console.log(`  el menor de los 8 con identidad (media de las semillas): ${prom(porSemilla).toFixed(2)} %`); }
