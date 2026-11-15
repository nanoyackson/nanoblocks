import sys
p = sys.argv[1] + "/inst/src/worldgen2.js"
s = open(p, encoding='utf8').read()
a = "    const bocas = v22 ? this.bocasDe(cx, cz) : null;"
assert a in s
s = s.replace(a, a + "\n    this._cm = process.env.CM ? this.cmMask(cx, cz) : null; this._cx0 = x0; this._cz0 = z0;", 1)
b = "  cueva22(x, y, z, h, cc, bocas) {\n"
assert b in s
s = s.replace(b, b + "    if (this._cm) { const m = this._cm[(x - this._cx0) + (z - this._cz0) * 16 + y * 256]; if (m === 2 || (m === 1 && y <= h - (h < SEA ? 14 : 8))) return true; }\n", 1)
cm = r'''
  // ---------- prototipo CM: red de cuevas masivas (nodos por región + túneles garantizados) ----------
  cmNodo(gx, gz) {
    const k = gx * 100003 + gz; this.cmC = this.cmC || new Map(); let n = this.cmC.get(k); if (n) return n;
    const s = this.gen.seed, RC = 96, H = (a) => hash3(s, gx, a, gz);
    const salon = H(9301) < (+process.env.CMS || 0.6);
    n = { gx, gz, x: gx * RC + 14 + H(9302) * (RC - 28), z: gz * RC + 14 + H(9303) * (RC - 28), y: 26 + H(9304) * 20, salon,
      rx: salon ? 20 + H(9305) * 28 : 5, rz: salon ? 20 + H(9306) * 28 : 5, ry: salon ? 9 + H(9307) * 14 : 4, fase: H(9308) * 6.28, pil: salon && H(9309) < 0.5, sima: H(9310) < 0.4 };
    this.cmC.set(k, n); return n;
  }
  cmArista(a, b) {
    const k = `${a.gx},${a.gz}>${b.gx},${b.gz}`; this.cmE = this.cmE || new Map(); let e = this.cmE.get(k); if (e) return e;
    const s = this.gen.seed, H = (q) => hash3(s, a.gx * 31 + b.gx, q, a.gz * 17 + b.gz);
    const len = Math.hypot(b.x - a.x, b.z - a.z), N = Math.ceil(len / 5), pts = [];
    const px = -(b.z - a.z) / len, pz = (b.x - a.x) / len, amp = (H(9401) - 0.5) * 2 * 16, ph = H(9402) * 6.28, rb = 2.6 + H(9403) * 1.8;
    for (let i = 0; i <= N; i++) {
      const t = i / N, w = Math.sin(t * Math.PI) * amp + Math.sin(t * 9 + ph) * 2.5;
      pts.push({ x: a.x + (b.x - a.x) * t + px * w, z: a.z + (b.z - a.z) * t + pz * w, y: a.y + (b.y - a.y) * t + Math.sin(t * 6.28 * 2 + ph) * 5, r: rb + 0.9 * Math.sin(t * 5 + ph) + (H(9410 + (i % 7)) < 0.12 ? 3 : 0) });
    }
    e = { pts }; this.cmE.set(k, e); return e;
  }
  cmMask(cx, cz) {
    const x0 = cx * 16, z0 = cz * 16, M = new Uint8Array(32768), RC = 96, g = this.gen;
    const carve = (fn, bx0, bx1, by0, by1, bz0, bz1, val) => {
      for (let z = Math.max(z0, Math.floor(bz0)); z <= Math.min(z0 + 15, Math.ceil(bz1)); z++) for (let x = Math.max(x0, Math.floor(bx0)); x <= Math.min(x0 + 15, Math.ceil(bx1)); x++)
        for (let y = Math.max(11, Math.floor(by0)); y <= Math.min(110, Math.ceil(by1)); y++) if (fn(x, y, z)) { const i = (x - x0) + (z - z0) * 16 + y * 256; if (M[i] < val) M[i] = val; }
    };
    const gx0 = Math.floor((x0 - 60) / RC), gx1 = Math.floor((x0 + 76) / RC), gz0 = Math.floor((z0 - 60) / RC), gz1 = Math.floor((z0 + 76) / RC);
    for (let gz = gz0 - 1; gz <= gz1 + 1; gz++) for (let gx = gx0 - 1; gx <= gx1 + 1; gx++) {
      const n = this.cmNodo(gx, gz);
      if (n.salon && n.x + n.rx + 3 > x0 && n.x - n.rx - 3 < x0 + 16 && n.z + n.rz + 3 > z0 && n.z - n.rz - 3 < z0 + 16) {
        const rx = n.rx, rz = n.rz, ry = n.ry;
        carve((x, y, z) => { const dx = (x - n.x) / rx, dz = (z - n.z) / rz, dy = (y - n.y) / ry; let d = dx * dx + dz * dz + dy * dy; d += this.nCaveCx(x, y, z) * 0.12; if (d >= 1) return false;
          if (n.pil) { const px = ((x - n.x) % 14 + 14) % 14, pz = ((z - n.z) % 14 + 14) % 14; if (Math.hypot(px - 7, pz - 7) < 2.2 && d < 0.8) return false; } return true; },
          n.x - rx - 2, n.x + rx + 2, n.y - ry - 2, n.y + ry + 2, n.z - rz - 2, n.z + rz + 2, 1);
      }
      if (n.sima && n.salon) {
        const sx = n.x + (n.rx * 0.4), sz = n.z, col = g.column(Math.floor(sx), Math.floor(sz));
        if (col.h >= SEA + 3 && !['ocean', 'volcano', 'manglar'].includes(col.biome) && !(col.rio < 0.07) && Math.abs(sx - x0 - 8) < 24 && Math.abs(sz - z0 - 8) < 24 && !(process.env.P1 && this.cercaDeObra(Math.floor(sx), Math.floor(sz))))
          carve((x, y, z) => Math.hypot(x - sx, z - sz) < 3.6 - Math.min(1.2, (col.h - y) / 60), sx - 5, sx + 5, n.y, col.h + 1, sz - 5, sz + 5, 2);
      }
      for (const [dx, dz] of [[1, 0], [0, 1], [1, 1]]) {
        if (dx && dz && hash3(g.seed, gx, 9420, gz) > 0.3) continue;
        const m = this.cmNodo(gx + dx, gz + dz), e = this.cmArista(n, m);
        for (let i = 0; i < e.pts.length - 1; i++) {
          const p = e.pts[i], q = e.pts[i + 1], r = Math.max(p.r, q.r) + 1;
          if (Math.max(p.x, q.x) + r < x0 || Math.min(p.x, q.x) - r > x0 + 16 || Math.max(p.z, q.z) + r < z0 || Math.min(p.z, q.z) - r > z0 + 16) continue;
          carve((x, y, z) => { const vx = q.x - p.x, vy = q.y - p.y, vz = q.z - p.z, wx = x - p.x, wy = y - p.y, wz = z - p.z; let t = (wx * vx + wy * vy + wz * vz) / (vx * vx + vy * vy + vz * vz); t = t < 0 ? 0 : t > 1 ? 1 : t;
            const ex = wx - vx * t, ey = (wy - vy * t) * 1.25, ez = wz - vz * t, rr = p.r + (q.r - p.r) * t; return ex * ex + ey * ey + ez * ez < rr * rr; },
            Math.min(p.x, q.x) - r, Math.max(p.x, q.x) + r, Math.min(p.y, q.y) - r, Math.max(p.y, q.y) + r, Math.min(p.z, q.z) - r, Math.max(p.z, q.z) + r, 1);
        }
      }
    }
    return M;
  }
  nCaveCx(x, y, z) { return this.gen.nCaveC.noise3(x * 0.07, y * 0.09, z * 0.07); }
'''
c = "  // ---------- v22: cuevas rediseñadas ----------"
assert c in s
s = s.replace(c, cm + "\n" + c, 1)
open(p, 'w', encoding='utf8').write(s)
print('ok')
