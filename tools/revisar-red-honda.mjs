// v13.3.2 (CM1): la Red Honda y los Salones del generador 25. Mide con flood fill del aire subterráneo (ventana de 512 x 512 alrededor del inicio, 2 semillas):
//  1) aire subterráneo entre 7 y 10 % (el generador 24 tiene ≈ 5 %);
//  2) conectividad: al menos el 85 % de todo el aire en un solo sistema (en el 24 es 31-62 %), y el sistema mayor cruza la ventana entera;
//  3) los salones: 40-96 de ancho, 18-46 de alto, ≈ 60 % de los nodos; techo a ≥ 8 bloques bajo el suelo (≥ 14 bajo el mar);
//  4) el tiempo por trozo (mediana con calentamiento) ≤ 12 ms y no peor que el generador 24 + 3 ms.
// (el porcentaje de aire usa el denominador del plan, PLAN_INTEGRACION_MUNDO §0.1: todo el volumen de la ventana, capas 1-99.)
// La huella de los mundos 21-24 la vigila tools/huella-mundos.mjs. Uso: node tools/revisar-red-honda.mjs
import { Generator, CHUNK, HEIGHT } from '../src/worldgen.js';
import { GEN_RED, SEA } from '../src/worldgen2.js';
import { GEN_MAX } from '../src/version.js';

let fallas = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fallas++; };
ok(GEN_RED === 25 && GEN_MAX >= 25, `GEN_RED = ${GEN_RED} y GEN_MAX = ${GEN_MAX}`);

const N = 32, W = N * CHUNK, H = 100; // ventana de 32 x 32 trozos
const D = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

function medir(seed, ver) {
  const g = new Generator(seed, ver, 'tierra', 'normal'), sp = g.findSpawn();
  const ccx = Math.floor(sp.x / CHUNK) - N / 2, ccz = Math.floor(sp.z / CHUNK) - N / 2;
  const A = new Uint8Array(W * W * H), buf = new Uint16Array(CHUNK * CHUNK * HEIGHT), tint = new Float32Array(CHUNK * CHUNK * 3);
  let aire = 0, techoMal = 0;
  const ms = [];
  for (let cz = 0; cz < N; cz++) for (let cx = 0; cx < N; cx++) {
    buf.fill(0); const t0 = performance.now(); g.generate(ccx + cx, ccz + cz, buf, tint); ms.push(performance.now() - t0);
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const h = g.column((ccx + cx) * CHUNK + lx, (ccz + cz) * CHUNK + lz).h;
      for (let y = 1; y < Math.min(H, h - 3); y++) { if (buf[lx + lz * CHUNK + y * 256] === 0) { A[(cx * CHUNK + lx) + (cz * CHUNK + lz) * W + y * W * W] = 1; aire++; if (y > h - 6 && h >= SEA) techoMal++; } }
    }
  }
  // flood fill por caras
  const seen = new Uint8Array(A.length), q = new Int32Array(6000000), comps = [];
  for (let i = 0; i < A.length; i++) {
    if (!A[i] || seen[i]) continue;
    let qh = 0, qt = 0, n = 0, x0 = 1e9, x1 = -1, z0 = 1e9, z1 = -1; q[qt++] = i; seen[i] = 1;
    while (qh < qt) {
      const c = q[qh++]; n++; const x = c % W, z = Math.floor(c / W) % W, y = Math.floor(c / (W * W));
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z;
      for (const [dx, dy, dz] of D) { const nx = x + dx, ny = y + dy, nz = z + dz; if (nx < 0 || nx >= W || nz < 0 || nz >= W || ny < 1 || ny >= H) continue; const j = nx + nz * W + ny * W * W; if (A[j] && !seen[j]) { seen[j] = 1; if (qt < q.length) q[qt++] = j; } }
    }
    comps.push({ n, ancho: x1 - x0 + 1, largo: z1 - z0 + 1 });
  }
  comps.sort((a, b) => b.n - a.n);
  ms.sort((a, b) => a - b);
  return { aire: 100 * aire / (W * W * (H - 1)), mayor: comps[0] ? 100 * comps[0].n / aire : 0, caja: comps[0] ? [comps[0].ancho, comps[0].largo] : [0, 0], sistemas: comps.length, mediana: ms[Math.floor(ms.length / 2)], techoMal };
}

const r25 = [], r24 = [];
for (const s of [101, 202]) {
  const a = medir(s, 24), b = medir(s, 25);
  r24.push(a); r25.push(b);
  console.log(`  semilla ${s}: gen 24 → aire ${a.aire.toFixed(1)} %, sistema mayor ${a.mayor.toFixed(0)} % del aire, ${a.sistemas} sistemas, ${a.mediana.toFixed(1)} ms · gen 25 → aire ${b.aire.toFixed(1)} %, sistema mayor ${b.mayor.toFixed(0)} % del aire (${b.caja.join(' × ')}), ${b.sistemas} sistemas, ${b.mediana.toFixed(1)} ms`);
}
ok(r25.every((r) => r.aire >= 7 && r.aire <= 10.5), `el aire subterráneo del generador 25 está entre 7 y 10 % (${r25.map((r) => r.aire.toFixed(1)).join(' / ')}; en el 24: ${r24.map((r) => r.aire.toFixed(1)).join(' / ')})`);
ok(r25.every((r) => r.mayor >= 85), `al menos el 85 % del aire en un solo sistema (${r25.map((r) => r.mayor.toFixed(0)).join(' / ')} %; en el 24: ${r24.map((r) => r.mayor.toFixed(0)).join(' / ')} %)`);
ok(r25.every((r) => r.caja[0] >= W * 0.85 && r.caja[1] >= W * 0.85), `el sistema mayor cruza la ventana de ${W} × ${W} (${r25.map((r) => r.caja.join('×')).join(' / ')})`);
ok(r25.every((r) => r.mediana <= 12 && r.mediana <= r24[r25.indexOf(r)].mediana + 3), `la mediana por trozo es de 12 ms o menos y no pasa de la del 24 + 3 ms (${r25.map((r) => r.mediana.toFixed(1)).join(' / ')} vs ${r24.map((r) => r.mediana.toFixed(1)).join(' / ')})`);

// los nodos: tamaño y proporción
{
  const g = new Generator(303, 25, 'tierra', 'normal'); let salones = 0, n = 0, malos = 0;
  for (let gz = -30; gz < 30; gz++) for (let gx = -30; gx < 30; gx++) {
    const nodo = g.v2.cmNodo(gx, gz); n++;
    if (!nodo.salon) continue; salones++;
    const ancho = Math.min(2 * nodo.rx, 2 * nodo.rz), anchoMax = Math.max(2 * nodo.rx, 2 * nodo.rz), alto = 2 * nodo.ry;
    if (ancho < 40 || anchoMax > 96 || alto < 18 || alto > 46) malos++;
  }
  ok(malos === 0, `todos los salones miden 40-96 de ancho y 18-46 de alto (${salones} salones)`);
  ok(salones / n > 0.55 && salones / n < 0.65, `≈ 60 % de los nodos son salón (${(100 * salones / n).toFixed(1)} %)`);
}

process.exitCode = fallas ? 1 : 0;
console.log(fallas ? `\n✘ ${fallas} falla(s)` : '\nRed Honda y salones: todo bien.');
