import fs from 'fs';
const p = 'h7/src/carreteras.js';
let s = fs.readFileSync(p, 'utf8').split(String.fromCharCode(13)).join('');
const rep = (a, b) => { if (!s.includes(a)) throw new Error('no encuentro: ' + a.slice(0, 70)); s = s.replace(a, b); };
rep("import { structuresNearPasos, structRadius } from './estructuras.js';", "import { structuresNearPasos, structuresNear, structRadius } from './estructuras.js';");
// modo: GENTE (variable de entorno) = conjunto de tipos extra a rodear
rep("  return res.length ? res : null;\n}", `  if (EXTRA) {
    const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1, marg = len * 0.3 + 30;
    const cellOk = (T, gx, gz) => {
      const cx = (gx + 0.5) * T.cell, cz = (gz + 0.5) * T.cell;
      const t = Math.max(0, Math.min(1, ((cx - ax) * dx + (cz - az) * dz) / L2));
      return Math.hypot(cx - (ax + t * dx), cz - (az + t * dz)) < marg + T.cell * 0.71 + T.R;
    };
    const vistos = new Set();
    for (const P of structuresNear(gen, mx, mz, R, EXTRA, cellOk)) {
      if (vistos.has(P.id)) continue; vistos.add(P.id);
      if (Math.hypot(P.x - A.x, P.z - A.z) < 60 || Math.hypot(P.x - B.x, P.z - B.z) < 60) continue;
      res.push({ x: P.x, z: P.z, r: structRadius(gen, P.type) + 4 });
    }
  }
  return res.length ? res : null;
}`);
rep("function obrasAjenas(", "const EXTRA = process.env.EXTRA ? new Set(process.env.EXTRA.split(',')) : null;\nfunction obrasAjenas(");
fs.writeFileSync(p, s); console.log('ok');
