// v13.4.2: mide los caminos del generador 29 contra el 28 (solo geometría, sin generar bloques): largo, escalones del perfil, cortes hondos, muestras dentro de una obra ajena.
// Uso: node tools/medir-rutas.mjs [semillas separadas por coma]
import { Generator } from '../src/worldgen.js';
import { roadsNear } from '../src/carreteras.js';
import { structuresNear, structRadius } from '../src/estructuras.js';

const SEMILLAS = (process.argv[2] || '101,202,303,404').split(',').map(Number);
const out = {};
for (const ver of [28, 29]) {
  const r = { tramos: 0, largo: 0, escalon2: 0, corte8: 0, sobre90: 0, enObra: 0, ms: 0 };
  for (const seed of SEMILLAS) {
    const g = new Generator(seed, ver, 'tierra', 'normal'), sp = g.findSpawn();
    const t0 = performance.now(); const segs = roadsNear(g, sp.x, sp.z, 1400); r.ms += performance.now() - t0;
    for (const s of segs) {
      r.tramos++; r.largo += s.n;
      const obras = structuresNear(g, (s.x0 + s.x1) / 2, (s.z0 + s.z1) / 2, Math.max(s.x1 - s.x0, s.z1 - s.z0) / 2 + 30).filter((P) => Math.hypot(P.x - s.A.x, P.z - s.A.z) > 40 && Math.hypot(P.x - s.B.x, P.z - s.B.z) > 40);
      for (let i = 0; i < s.n; i++) {
        if (i && Math.abs(s.ys[i] - s.ys[i - 1]) >= 2) r.escalon2++;
        if (s.water[i]) continue;
        const h = g.column(s.xs[i], s.zs[i]).h;
        if (Math.abs(h - s.ys[i]) >= 8) r.corte8++;
        if (h > 90) r.sobre90++;
        if (i % 3 === 0) for (const P of obras) if (Math.hypot(P.x - s.xs[i], P.z - s.zs[i]) < structRadius(g, P.type)) { r.enObra++; break; }
      }
    }
  }
  out[ver] = r;
  console.log(`gen ${ver}: ${r.tramos} tramos · ${r.largo} bloques · saltos ≥ 2: ${r.escalon2} · cortes o rellenos ≥ 8: ${r.corte8} · sobre 90 de alto: ${r.sobre90} · muestras dentro de una obra ajena: ${r.enObra} · ${(r.ms / 1000).toFixed(1)} s`);
}
