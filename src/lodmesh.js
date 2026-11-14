// Malla de una baldosa del horizonte lejano (v12.0.1: sale del hilo principal y la arma lodworker.js).
// Tapas a la altura de cada celda, paredes donde la vecina está más abajo y, en los cuatro bordes, FALDONES: paredes que bajan
// 24 bloques más para tapar la rendija entre dos baldosas de distinta resolución (PLAN_HORIZONTE 3.2).
const FALDON = 24;

export function construirBaldosa({ h, top, side, water, cells, step }) {
  const N = cells + 2;
  const pos = [], col = [], idx = [];
  const quad = (v, c, shade) => {
    const b = pos.length / 3;
    for (const p of v) { pos.push(p[0], p[1], p[2]); col.push(c[0] * shade, c[1] * shade, c[2] * shade); }
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  };
  const at = (i, j) => (j + 1) * N + (i + 1);
  const alto = (k) => h[k] + (water[k] ? 0.875 : 1);
  for (let j = 0; j < cells; j++) for (let i = 0; i < cells; i++) {
    const k = at(i, j);
    const y = alto(k);
    const x0 = i * step, x1 = x0 + step, z0 = j * step, z1 = z0 + step;
    const tc = [top[k * 3], top[k * 3 + 1], top[k * 3 + 2]];
    quad([[x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0]], tc, 1);
    const sc = water[k] ? tc : [side[k * 3], side[k * 3 + 1], side[k * 3 + 2]];
    // borde: siempre hay pared (faldón) hasta 24 bloques más abajo de lo que haga falta
    const wall = (ni, nj, borde, verts, shade) => {
      let ny = alto(at(ni, nj));
      if (borde) ny = Math.min(ny, y - FALDON);
      else if (ny >= y) return;
      quad(verts(ny), sc, shade);
    };
    wall(i + 1, j, i === cells - 1, (ny) => [[x1, ny, z1], [x1, ny, z0], [x1, y, z0], [x1, y, z1]], 0.8);
    wall(i - 1, j, i === 0, (ny) => [[x0, ny, z0], [x0, ny, z1], [x0, y, z1], [x0, y, z0]], 0.8);
    wall(i, j + 1, j === cells - 1, (ny) => [[x0, ny, z1], [x1, ny, z1], [x1, y, z1], [x0, y, z1]], 0.65);
    wall(i, j - 1, j === 0, (ny) => [[x1, ny, z0], [x0, ny, z0], [x0, y, z0], [x1, y, z0]], 0.65);
  }
  const nv = pos.length / 3;
  return { pos: new Float32Array(pos), col: new Float32Array(col), idx: nv > 65535 ? new Uint32Array(idx) : new Uint16Array(idx) };
}
