// Pixel art de los bloques (16x16), pintado a mano por código.
// Reglas de estilo: paletas cortas y curadas (oscuro → claro), ruido por manchas tileable en vez de ruido blanco,
// tramado ordenado para pasar entre tonos, y luz siempre desde arriba-izquierda (brillo arriba-izq, sombra abajo-der).
import { muralImage, wheelImage, slicePainter } from './arte.js';
import { mulberry32, hashString } from './noise.js';
import { TEX_ARTE } from './texturas_arte.js';

export const T = 16;

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const R = (...hs) => hs.map(hex);

// Paletas (de oscuro a claro)
export const PAL = {
  grass: R('#2f5c1d', '#3d7424', '#4c8c2c', '#5ea338', '#74b948', '#8fcc5c'),
  dirt: R('#45301f', '#563c27', '#694a31', '#7c5a3c', '#906b49', '#a47e58'),
  stone: R('#4f4f54', '#5f5f64', '#707075', '#818186', '#929297', '#a6a6ab'),
  sand: R('#bfa76f', '#ccb57d', '#d8c28b', '#e2ce99', '#ebd9a8', '#f4e5ba'),
  snow: R('#b9c8d8', '#cfdbe7', '#e0e9f2', '#edf3f9', '#f7fafd', '#ffffff'),
  bark: R('#33251a', '#433021', '#553d29', '#674b32', '#7a5a3c', '#8c6a47'),
  rings: R('#7e5f36', '#937042', '#a6814d', '#b89259', '#c8a366'),
  plank: R('#6b4d2a', '#7f5c33', '#936c3d', '#a67c47', '#b68b52', '#c69b5f'),
  leaf: R('#183f15', '#21521b', '#2c6623', '#397a2c', '#488f36', '#5ca545'),
  birchLeaf: R('#40612a', '#4f7632', '#5f8a3b', '#729f46', '#86b252', '#9cc561'),
  birch: R('#bdb8a6', '#cdc8b6', '#dad6c5', '#e6e2d3', '#f1eee2'),
  water: R('#183f93', '#2050a8', '#2a61bc', '#3672cd', '#4a87db', '#68a2e8'),
  ice: R('#82a6e2', '#95b6ea', '#a8c6f0', '#bdd6f6', '#d4e6fb', '#ecf4ff'),
  clay: R('#7f8595', '#8c92a1', '#999fad', '#a7adb9', '#b5bbc6'),
  cactus: R('#204716', '#2c5b1d', '#386f25', '#46852e', '#559a39'),
  brick: R('#5e281e', '#743226', '#8a3d2e', '#9e4a37', '#b05a44'),
  mortar: R('#8f877c', '#a59d91', '#bab3a7', '#ccc6bb'),
  bedrock: R('#1b1b1d', '#2a2a2d', '#3c3c40', '#56565b', '#727277', '#8e8e93'),
  wool: R('#c4c4c4', '#d4d4d4', '#e2e2e2', '#eeeeee', '#f8f8f8'),
  coal: R('#141414', '#222222', '#333333', '#4a4a4a'),
  iron: R('#7a4e33', '#a06c4b', '#c79170', '#e6b996'),
  gold: R('#97680b', '#c8931a', '#efbe2f', '#fde475'),
  diamond: R('#16797f', '#22a3a9', '#45cfd1', '#a6f5ef'),
  dyn: R('#6b1711', '#8c2018', '#ad2a20', '#c9392b', '#dc5240'),
  paper: R('#b8ad91', '#cfc5aa', '#e3dac1', '#f1ead6'),
  glow: R('#b57a22', '#d39a33', '#ebbb4f', '#fbd879', '#fff0b8'),
  moss: R('#2f5a1e', '#3f7127', '#518832', '#66a03f'),
};

// Matriz de Bayer 4x4 para tramado ordenado
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16 - 0.5);

export class Tile {
  constructor(name) {
    this.name = name;
    this.data = new Uint8ClampedArray(T * T * 4);
    this.rnd = mulberry32(hashString(name));
    this.grids = {};
  }
  set(x, y, c, a = 255) {
    x = ((x % T) + T) % T; y = ((y % T) + T) % T;
    const i = (y * T + x) * 4;
    this.data[i] = c[0]; this.data[i + 1] = c[1]; this.data[i + 2] = c[2]; this.data[i + 3] = a;
  }
  setClip(x, y, c, a = 255) { if (x >= 0 && y >= 0 && x < T && y < T) this.set(x, y, c, a); }
  get(x, y) {
    x = ((x % T) + T) % T; y = ((y % T) + T) % T;
    const i = (y * T + x) * 4;
    return [this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3]];
  }
  alpha(x, y) { return this.get(x, y)[3]; }
  clear() { this.data.fill(0); }
  mul(x, y, f) {
    const c = this.get(x, y);
    this.set(x, y, [Math.min(255, c[0] * f), Math.min(255, c[1] * f), Math.min(255, c[2] * f)], c[3]);
  }
  // ruido de valor tileable: `cells` celdas por lado (divisor de 16)
  noise(x, y, cells) {
    let g = this.grids[cells];
    if (!g) { g = this.grids[cells] = Array.from({ length: cells * cells }, () => this.rnd()); }
    const s = cells / T;
    const fx = x * s, fy = y * s;
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const tx = fx - x0, ty = fy - y0;
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const at = (i, j) => g[((j % cells) + cells) % cells * cells + ((i % cells) + cells) % cells];
    const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
    return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
  }
  fbm(x, y) { return this.noise(x, y, 4) * 0.55 + this.noise(x, y, 8) * 0.3 + this.noise(x, y, 16) * 0.15; }
  // elige un color de la paleta con tramado
  pick(pal, v, x, y, dither = 0.9) {
    const n = pal.length;
    const d = v * n + BAYER[(y & 3) * 4 + (x & 3)] * dither;
    return pal[Math.max(0, Math.min(n - 1, Math.floor(d)))];
  }
  paint(pal, fn, dither) {
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) this.set(x, y, this.pick(pal, fn(x, y), x, y, dither));
  }
  // piedrita / pepita con relieve: claro arriba-izq, sombra abajo-der
  nugget(cx, cy, w, h, pal, wrap = true) {
    const put = wrap ? (x, y, c) => this.set(x, y, c) : (x, y, c) => this.setClip(x, y, c);
    const n = pal.length;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if ((x === 0 || x === w - 1) && (y === 0 || y === h - 1) && w > 2 && h > 2) continue;
      let idx = n - 2;
      if (x === 0 || y === 0) idx = n - 1;
      if (x === w - 1 || y === h - 1) idx = 1;
      put(cx + x, cy + y, pal[idx]);
    }
    put(cx + w, cy + h - 1, pal[0]);
    put(cx + w - 1, cy + h, pal[0]);
  }
}

const P = {};

// ---------- tierra y pasto ----------
P.dirt = (t) => {
  t.paint(PAL.dirt, (x, y) => 0.15 + t.fbm(x, y) * 0.55 + t.rnd() * 0.25);
  for (let i = 0; i < 6; i++) t.nugget(Math.floor(t.rnd() * T), Math.floor(t.rnd() * T), 2 + (t.rnd() < 0.3 ? 1 : 0), 2, [PAL.dirt[0], PAL.dirt[2], PAL.dirt[4], PAL.dirt[5]]);
  for (let i = 0; i < 7; i++) t.set(Math.floor(t.rnd() * T), Math.floor(t.rnd() * T), PAL.dirt[0]);
};
P.grass_top = (t) => {
  t.paint(PAL.grass, (x, y) => 0.2 + t.fbm(x, y) * 0.5 + t.rnd() * 0.22);
  // briznas: trazos verticales de 2 px, claros arriba
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(t.rnd() * T), y = Math.floor(t.rnd() * T);
    const light = t.rnd() < 0.6;
    t.set(x, y, light ? PAL.grass[5] : PAL.grass[1]);
    t.set(x, y + 1, light ? PAL.grass[4] : PAL.grass[0]);
  }
};
function overhang(t, pal, minD, maxD) {
  for (let x = 0; x < T; x++) {
    let d = minD + Math.floor(t.noise(x, 0, 8) * (maxD - minD + 1));
    if (t.rnd() < 0.18) d += 1 + Math.floor(t.rnd() * 2); // gotitas que cuelgan
    for (let y = 0; y < d; y++) {
      const v = 1 - y / (d + 1) * 0.7 + (t.rnd() - 0.5) * 0.25;
      t.set(x, y, t.pick(pal, v, x, y));
    }
    t.set(x, d - 1, pal[1]);
    // sombra que la capa proyecta sobre la tierra
    const below = t.get(x, d);
    t.set(x, d, [below[0] * 0.72, below[1] * 0.72, below[2] * 0.72]);
  }
}
P.grass_side = (t) => { P.dirt(t); overhang(t, PAL.grass, 3, 5); };
P.snow = (t) => {
  t.paint(PAL.snow, (x, y) => 0.45 + t.fbm(x, y) * 0.45 + t.rnd() * 0.1);
  for (let i = 0; i < 5; i++) t.set(Math.floor(t.rnd() * T), Math.floor(t.rnd() * T), [255, 255, 255]);
  for (let i = 0; i < 4; i++) t.set(Math.floor(t.rnd() * T), Math.floor(t.rnd() * T), PAL.snow[1]);
};
P.snow_side = (t) => { P.dirt(t); overhang(t, PAL.snow, 4, 6); };
P.sand = (t) => {
  t.paint(PAL.sand, (x, y) => 0.45 + Math.sin((y + t.noise(x, y, 4) * 5) * 1.25) * 0.18 + t.fbm(x, y) * 0.2 + t.rnd() * 0.12 - 0.1);
  for (let i = 0; i < 6; i++) t.set(Math.floor(t.rnd() * T), Math.floor(t.rnd() * T), PAL.sand[0]);
};
P.gravel = (t) => {
  t.paint(PAL.dirt.slice(0, 3), (x, y) => t.fbm(x, y));
  const tones = [PAL.stone, PAL.stone, PAL.dirt, [hex('#4a4744'), hex('#615d59'), hex('#7a7570'), hex('#94908a'), hex('#aaa59e')]];
  for (let i = 0; i < 22; i++) {
    const pal = tones[Math.floor(t.rnd() * tones.length)];
    t.nugget(Math.floor(t.rnd() * T), Math.floor(t.rnd() * T), 2 + Math.floor(t.rnd() * 2), 2 + Math.floor(t.rnd() * 1.5), [pal[0], pal[1], pal[3], pal[pal.length - 1]]);
  }
};
P.clay = (t) => t.paint(PAL.clay, (x, y) => 0.35 + t.noise(x, y * 0.3, 4) * 0.35 + t.rnd() * 0.15 + (y % 5 === 0 ? -0.1 : 0));

// ---------- piedra ----------
function cracks(t, n, pal) {
  for (let i = 0; i < n; i++) {
    let x = Math.floor(t.rnd() * T), y = Math.floor(t.rnd() * T);
    const len = 3 + Math.floor(t.rnd() * 5);
    const dx = t.rnd() < 0.5 ? 1 : -1;
    for (let k = 0; k < len; k++) {
      t.set(x, y, pal[0]);
      t.set(x, y + 1, pal[pal.length - 2]);
      if (t.rnd() < 0.6) x += dx; else y += 1;
    }
  }
}
P.stone = (t) => {
  t.paint(PAL.stone, (x, y) => 0.2 + t.fbm(x, y) * 0.6 + t.rnd() * 0.15);
  cracks(t, 4, PAL.stone);
};
P.cobble = (t) => {
  const pts = [];
  for (let i = 0; i < 8; i++) pts.push([t.rnd() * T, t.rnd() * T, t.rnd() * 0.3]);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    let d1 = 1e9, d2 = 1e9, best = null, bdx = 0, bdy = 0;
    for (const p of pts) for (const ox of [-T, 0, T]) for (const oy of [-T, 0, T]) {
      const dx = x + 0.5 - p[0] - ox, dy = y + 0.5 - p[1] - oy;
      const d = dx * dx + dy * dy;
      if (d < d1) { d2 = d1; d1 = d; best = p; bdx = dx; bdy = dy; } else if (d < d2) d2 = d;
    }
    const edge = Math.sqrt(d2) - Math.sqrt(d1);
    if (edge < 1.0) { t.set(x, y, PAL.stone[0]); continue; }
    // relieve: más claro hacia arriba-izquierda de cada piedra
    const light = -(bdx + bdy) / 7;
    const v = 0.45 + best[2] + light * 0.35 + (edge < 2 ? -0.12 : 0) + t.rnd() * 0.08;
    t.set(x, y, t.pick(PAL.stone, v, x, y, 0.6));
  }
};
P.mossy = (t) => {
  P.cobble(t);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const m = t.noise(x, y, 4) * 0.8 + (1 - y / T) * 0.35 + t.rnd() * 0.15;
    if (m > 0.78) t.set(x, y, t.pick(PAL.moss, (m - 0.78) * 3 + 0.2, x, y));
  }
};
P.bedrock = (t) => t.paint(PAL.bedrock, (x, y) => t.noise(x, y, 8) * 0.7 + t.rnd() * 0.45 - 0.1, 0.4);
function ore(pal, count) {
  return (t) => {
    P.stone(t);
    for (let i = 0; i < count; i++) {
      const w = 2 + Math.floor(t.rnd() * 2), h = 2 + (t.rnd() < 0.4 ? 1 : 0);
      t.nugget(1 + Math.floor(t.rnd() * 12), 1 + Math.floor(t.rnd() * 12), w, h, pal);
    }
  };
}
P.ore_coal = ore(PAL.coal, 6);
P.ore_iron = ore(PAL.iron, 5);
P.ore_gold = ore(PAL.gold, 5);
P.ore_diamond = ore(PAL.diamond, 4);
P.sandstone_side = (t) => {
  const darker = PAL.sand.map((c) => c.map((v) => v * 0.9));
  t.paint(darker, (x, y) => {
    let v = 0.55 + t.noise(x, y * 0.25, 4) * 0.2 + t.rnd() * 0.08;
    if (y === 3 || y === 12) v -= 0.3;
    if (y === 4 || y === 13) v += 0.2;
    if (y < 3) v += 0.15;
    return v;
  }, 0.6);
};
P.sandstone_top = (t) => t.paint(PAL.sand.map((c) => c.map((v) => v * 0.93)), (x, y) => 0.55 + t.fbm(x, y) * 0.25 + (x === 0 || y === 0 ? 0.2 : 0) + (x === 15 || y === 15 ? -0.25 : 0), 0.5);
P.bricks = (t) => {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const row = Math.floor(y / 4), ly = y % 4;
    const off = row % 2 === 0 ? 0 : 4;
    const lx = (x + off) % 8;
    if (ly === 3 || lx === 7) { t.set(x, y, t.pick(PAL.mortar, 0.4 + t.rnd() * 0.4, x, y)); continue; }
    let v = 0.5 + t.noise(x, y, 8) * 0.25 + t.rnd() * 0.1;
    if (ly === 0) v += 0.25;
    if (lx === 0) v += 0.15;
    if (ly === 2) v -= 0.25;
    if (lx === 6) v -= 0.15;
    t.set(x, y, t.pick(PAL.brick, v, x, y, 0.5));
  }
};
P.ice = (t) => {
  t.paint(PAL.ice, (x, y) => 0.35 + t.fbm(x, y) * 0.35 + (x + y) % 9 / 30);
  for (let i = 0; i < 3; i++) {
    let x = Math.floor(t.rnd() * T), y = Math.floor(t.rnd() * T);
    for (let k = 0; k < 6; k++) { t.set(x, y, PAL.ice[5]); x += 1; y += t.rnd() < 0.5 ? 1 : 0; }
  }
};

// ---------- madera ----------
P.log_side = (t) => {
  t.paint(PAL.bark, (x, y) => 0.45 + Math.sin(x * 1.7 + t.noise(x, y, 4) * 3) * 0.22 + t.noise(x * 2, y * 0.35, 8) * 0.25 + t.rnd() * 0.1 - 0.12);
  // surcos verticales
  for (let i = 0; i < 4; i++) {
    const x = Math.floor(t.rnd() * T); let y = Math.floor(t.rnd() * T);
    const len = 4 + Math.floor(t.rnd() * 7);
    for (let k = 0; k < len; k++) { t.set(x, y + k, PAL.bark[0]); t.set(x + 1, y + k, PAL.bark[4]); }
  }
};
function rings(t, borderPal) {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const dx = x - 7.5, dy = y - 7.5;
    if (x === 0 || y === 0 || x === 15 || y === 15) { t.set(x, y, t.pick(borderPal, 0.3 + t.rnd() * 0.5, x, y)); continue; }
    const d = Math.sqrt(dx * dx + dy * dy) + t.noise(x, y, 4) * 1.2;
    const ring = Math.floor(d * 0.9) % 2;
    let v = ring ? 0.35 : 0.7;
    v += -(dx + dy) * 0.01 + t.rnd() * 0.1;
    if (d < 1.2) v = 0.15;
    t.set(x, y, t.pick(PAL.rings, v, x, y, 0.5));
  }
}
P.log_top = (t) => rings(t, PAL.bark);
P.birch_side = (t) => {
  t.paint(PAL.birch, (x, y) => 0.45 + t.noise(x, y, 4) * 0.4 + t.rnd() * 0.12);
  for (let i = 0; i < 8; i++) {
    const y = Math.floor(t.rnd() * T), x = Math.floor(t.rnd() * T), len = 2 + Math.floor(t.rnd() * 4);
    for (let k = 0; k < len; k++) { t.set(x + k, y, hex('#2a2925')); if (t.rnd() < 0.5) t.set(x + k, y + 1, hex('#8f8a7a')); }
  }
  t.nugget(Math.floor(t.rnd() * 12), Math.floor(t.rnd() * 12), 2, 2, R('#1e1d1a', '#2f2d28', '#4a463e', '#5f5a50'));
};
P.birch_top = (t) => rings(t, PAL.birch);
P.planks = (t) => {
  for (let b = 0; b < 4; b++) {
    const tone = (t.rnd() - 0.5) * 0.18;
    const seam = Math.floor(t.rnd() * 12) + 2;
    for (let ly = 0; ly < 4; ly++) for (let x = 0; x < T; x++) {
      const y = b * 4 + ly;
      let v = 0.55 + tone + t.noise(x * 0.25, y * 2, 8) * 0.25 + t.rnd() * 0.06;
      if (ly === 0) v += 0.18;
      if (ly === 3) v = 0.02;
      if (x === seam && ly < 3) v = 0.1;
      if (x === seam + 1 && ly < 3) v += 0.15;
      t.set(x, y, t.pick(PAL.plank, v, x, y, 0.4));
    }
    t.set(seam - 2, b * 4 + 1, PAL.plank[0]); // clavo
  }
};
P.table_top = (t) => {
  P.planks(t);
  for (let i = 0; i < T; i++) { t.set(i, 0, PAL.bark[1]); t.set(i, 15, PAL.bark[0]); t.set(0, i, PAL.bark[1]); t.set(15, i, PAL.bark[0]); }
  // cuadrícula de trabajo
  for (let i = 2; i < 14; i++) { t.set(i, 5, PAL.bark[2]); t.set(i, 10, PAL.bark[2]); t.set(5, i, PAL.bark[2]); t.set(10, i, PAL.bark[2]); }
};
P.table_side = (t) => {
  P.planks(t);
  for (let i = 0; i < T; i++) { t.set(i, 0, PAL.bark[1]); t.set(i, 1, PAL.plank[5]); }
  const dark = hex('#2b2118'), metal = R('#5d6168', '#868b92', '#b4b9c0', '#dde1e6');
  // martillo
  for (let y = 4; y < 13; y++) { t.set(4, y, PAL.bark[3]); t.set(5, y, PAL.bark[1]); }
  for (let x = 2; x < 8; x++) { t.set(x, 3, metal[2]); t.set(x, 4, metal[1]); }
  t.set(2, 3, metal[3]); t.set(7, 4, metal[0]);
  // serrucho
  for (let y = 5; y < 13; y++) for (let x = 9; x < 14; x++) if (x - 9 <= (y - 5) * 0.6) t.set(x, y, y === 12 ? metal[0] : metal[2]);
  for (let x = 9; x < 14; x += 2) t.set(x, 13, metal[0]);
  for (let y = 2; y < 6; y++) { t.set(13, y, PAL.bark[3]); t.set(14, y, dark); }
};
P.bookshelf = (t) => {
  P.planks(t);
  const books = [R('#5a1a1a', '#7d2626', '#a03636'), R('#1b3460', '#284b85', '#3a63a8'), R('#1d4d2a', '#2a6b3a', '#3a8a4c'), R('#5e4a17', '#80661f', '#a3842b'), R('#3e2050', '#58306f', '#73428f'), R('#6b6255', '#8d8473', '#b0a691')];
  for (const y0 of [1, 9]) {
    for (let x = 0; x < T; x++) t.set(x, y0 + 6, PAL.bark[1]);
    let x = 1;
    while (x < 15) {
      const w = 2 + (t.rnd() < 0.3 ? 1 : 0);
      const pal = books[Math.floor(t.rnd() * books.length)];
      const h = 4 + Math.floor(t.rnd() * 3);
      for (let dx = 0; dx < w && x + dx < 15; dx++) for (let y = y0 + 6 - h; y < y0 + 6; y++) {
        t.set(x + dx, y, dx === 0 ? pal[2] : dx === w - 1 ? pal[0] : pal[1]);
      }
      if (h > 4) for (let dx = 0; dx < w - 1 && x + dx < 15; dx++) t.set(x + dx, y0 + 6 - h + 2, PAL.paper[2]);
      x += w;
    }
    for (let y = y0; y < y0 + 6; y++) { t.set(0, y, PAL.bark[0]); t.set(15, y, PAL.bark[0]); }
  }
};

// ---------- plantas ----------
function leaves(pal) {
  return (t) => {
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
      const v = t.noise(x, y, 8) * 0.65 + t.rnd() * 0.35;
      if (v < 0.24) { t.set(x, y, [0, 0, 0], 0); continue; }
      t.set(x, y, t.pick(pal, (v - 0.24) * 1.45, x, y, 0.7));
    }
    // brillo en los bordes superiores de cada racimo
    for (let y = 1; y < T; y++) for (let x = 0; x < T; x++) {
      if (t.alpha(x, y) && !t.alpha(x, y - 1)) t.set(x, y, pal[pal.length - 1]);
    }
  };
}
P.leaves = leaves(PAL.leaf);
P.birch_leaves = leaves(PAL.birchLeaf);
P.tall_grass = (t) => {
  t.clear();
  for (let b = 0; b < 9; b++) {
    let x = 1 + Math.floor(t.rnd() * 14);
    const h = 5 + Math.floor(t.rnd() * 10);
    const lean = (t.rnd() - 0.5) * 0.5;
    let fx = x;
    for (let k = 0; k < h; k++) {
      const v = 0.1 + (k / h) * 0.9;
      t.setClip(Math.round(fx), 15 - k, t.pick(PAL.grass, v, x, k));
      fx += lean;
    }
    x = Math.round(fx);
  }
};
function flower(petals, center) {
  return (t) => {
    t.clear();
    for (let y = 8; y < 16; y++) t.set(7, y, PAL.grass[y > 12 ? 1 : 3]);
    t.set(6, 12, PAL.grass[4]); t.set(5, 11, PAL.grass[3]); t.set(8, 13, PAL.grass[4]); t.set(9, 12, PAL.grass[3]);
    const shape = [[7, 2, 2], [6, 3, 2], [8, 3, 2], [5, 4, 1], [9, 4, 1], [6, 4, 2], [8, 4, 2], [5, 5, 1], [9, 5, 0], [6, 6, 1], [8, 6, 0], [7, 7, 0], [6, 5, 2], [8, 5, 1], [7, 3, 2], [7, 6, 1]];
    for (const [x, y, s] of shape) t.set(x, y, petals[s]);
    t.set(7, 4, center[1]); t.set(7, 5, center[0]);
  };
}
P.flower_red = flower(R('#8e1717', '#c42525', '#ef4b4b'), R('#c9921a', '#f5d042'));
P.flower_yellow = flower(R('#b5850f', '#e6b51e', '#fde05a'), R('#8a4b14', '#b8691f'));
P.cactus_side = (t) => {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    // v2.45: sin bordes transparentes (el cactus ahora es una caja de 14/16 y las caras se tocan en las esquinas)
    if (x === 0 || x === 15) { t.set(x, y, t.pick(PAL.cactus, 0.2, x, y, 0.3)); continue; }
    const ridge = (x - 1) % 4;
    const v = [0.75, 0.55, 0.35, 0.15][ridge] + t.rnd() * 0.1;
    t.set(x, y, t.pick(PAL.cactus, v, x, y, 0.4));
  }
  for (let i = 0; i < 9; i++) { const x = 1 + Math.floor(t.rnd() * 3) * 4, y = Math.floor(t.rnd() * T); t.set(x, y, hex('#efe8b8')); }
};
P.cactus_top = (t) => {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    if (x === 0 || x === 15 || y === 0 || y === 15) { t.set(x, y, t.pick(PAL.cactus, 0.25, x, y)); continue; }
    const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
    t.set(x, y, t.pick(PAL.cactus, d > 5.5 ? 0.3 : 0.7 - d * 0.05, x, y));
  }
  t.set(7, 7, hex('#cfd67e')); t.set(8, 8, hex('#cfd67e'));
};

// ---------- otros ----------
P.glass = (t) => {
  t.clear();
  const hi = hex('#e3f4f8'), lo = hex('#8fb3c0');
  for (let i = 0; i < T; i++) { t.set(i, 0, hi); t.set(0, i, hi); t.set(i, 15, lo); t.set(15, i, lo); }
  for (let k = 0; k < 4; k++) t.set(3 + k, 6 - k, hex('#f4fcfe'));
  for (let k = 0; k < 2; k++) t.set(4 + k, 8 - k, hex('#f4fcfe'));
  t.set(12, 11, hi); t.set(11, 12, hi);
};
// v13.7.1: cristal ahumado (vidrio oscuro con vetas de humo)
P.cristal_ahumado = (t) => {
  t.clear();
  const hi = hex('#8c8a96'), lo = hex('#2a2830'), mid = hex('#4a4854');
  for (let i = 0; i < T; i++) { t.set(i, 0, hi); t.set(0, i, hi); t.set(i, 15, lo); t.set(15, i, lo); }
  for (let y = 1; y < 15; y++) for (let x = 1; x < 15; x++) if ((x * 3 + y * 5 + Math.floor(t.rnd() * 3)) % 9 < 2) t.set(x, y, mid);
  for (let k = 0; k < 4; k++) t.set(3 + k, 6 - k, hex('#b8b6c4'));
};
P.water = (t) => {
  t.paint(PAL.water, (x, y) => 0.4 + Math.sin(x * 0.8 + y * 0.35 + t.noise(x, y, 4) * 4) * 0.2 + t.fbm(x, y) * 0.2, 0.7);
  for (let i = 0; i < 5; i++) {
    const x = Math.floor(t.rnd() * T), y = Math.floor(t.rnd() * T);
    for (let k = 0; k < 3; k++) t.set(x + k, y, PAL.water[5]);
  }
};
P.wool = (t) => {
  t.paint(PAL.wool, (x, y) => 0.4 + t.noise(x, y, 16) * 0.35 + Math.sin((x + y) * 1.4) * 0.12 + t.rnd() * 0.1);
};
P.dyn_side = (t) => {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const sx = x % 4; // cuatro cartuchos cilíndricos
    const v = [0.15, 0.5, 0.85, 0.55][sx] + t.rnd() * 0.08;
    t.set(x, y, t.pick(PAL.dyn, v, x, y, 0.4));
  }
  for (let y = 6; y < 10; y++) for (let x = 0; x < T; x++) t.set(x, y, t.pick(PAL.paper, y === 6 ? 0.9 : y === 9 ? 0.15 : 0.6, x, y, 0.3));
  const glyph = ['X.XX.X.X.X...X', 'XX.X.X.X.XX.XX', 'X.XX.XXX.X.X.X'];
  const ink = hex('#2a1a12');
  glyph.forEach((row, gy) => [...row].forEach((ch, gx) => { if (ch === 'X') t.set(1 + gx, 6 + gy + (gy === 0 ? 0 : 0), ink); }));
};
P.dyn_top = (t) => {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const cx = (x % 8) - 3.5, cy = (y % 8) - 3.5;
    const d = Math.sqrt(cx * cx + cy * cy);
    let v = d > 3.6 ? 0.05 : 0.85 - d * 0.18;
    if (d < 1.2) v = 0.25;
    t.set(x, y, t.pick(PAL.dyn, v, x, y, 0.4));
  }
  t.set(7, 7, hex('#3a3a3a')); t.set(8, 8, hex('#3a3a3a')); t.set(8, 7, hex('#585858'));
};
P.lamp = (t) => {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const frame = x < 2 || y < 2 || x > 13 || y > 13 || x === 7 || x === 8 || y === 7 || y === 8;
    if (frame) {
      let v = 0.55 + t.rnd() * 0.15;
      if (x === 0 || y === 0) v += 0.3;
      if (x === 15 || y === 15) v -= 0.4;
      t.set(x, y, t.pick(PAL.plank, v, x, y, 0.3));
      continue;
    }
    const px = (x % 8) - 4.5, py = (y % 8) - 4.5;
    const d = Math.sqrt(px * px + py * py);
    t.set(x, y, t.pick(PAL.glow, 1.05 - d * 0.18 + t.rnd() * 0.08, x, y, 0.6));
  }
};

// ---------- horno, cofre, puerta, antorcha ----------
function stoneFrame(t) {
  P.cobble(t);
  for (let i = 0; i < T; i++) { t.set(i, 0, PAL.stone[4]); t.set(0, i, PAL.stone[4]); t.set(i, 15, PAL.stone[0]); t.set(15, i, PAL.stone[0]); }
}
P.furnace_side = (t) => stoneFrame(t);
P.furnace_top = (t) => {
  t.paint(PAL.stone, (x, y) => 0.45 + t.fbm(x, y) * 0.3 + (x === 0 || y === 0 ? 0.25 : 0) + (x === 15 || y === 15 ? -0.3 : 0), 0.5);
};
function furnaceFront(lit) {
  return (t) => {
    stoneFrame(t);
    // boca del horno con borde de piedra lisa
    for (let y = 7; y < 14; y++) for (let x = 3; x < 13; x++) {
      const edge = y === 7 || x === 3 || x === 12;
      if (edge) { t.set(x, y, PAL.stone[y === 7 ? 4 : 1]); continue; }
      if (!lit) { t.set(x, y, y > 11 ? [36, 30, 28] : [18, 16, 16]); continue; }
      const h = 1 - (y - 8) / 6; // llamas más claras abajo
      const flick = t.noise(x * 2, y, 8);
      const v = 1 - h * 0.7 + flick * 0.3;
      t.set(x, y, t.pick(R('#5a1505', '#a8320a', '#e2611a', '#f6a133', '#ffd96a', '#fff6c8'), v, x, y, 0.6));
    }
    // rejilla y repisa
    for (let x = 3; x < 13; x++) t.set(x, 14, PAL.stone[0]);
    for (let x = 4; x < 12; x += 2) t.set(x, 4, PAL.stone[0]);
    for (let x = 3; x < 13; x++) t.set(x, 3, PAL.stone[4]);
  };
}
P.furnace_front = furnaceFront(false);
P.furnace_front_lit = furnaceFront(true);
const CHEST = R('#5b3a1a', '#734a22', '#8a5b2b', '#a06b34', '#b67d3f');
const IRON = R('#3d3f44', '#5f636a', '#8a8f97', '#c4c8ce');
function chestWood(t, bands = true) {
  t.paint(CHEST, (x, y) => 0.45 + t.noise(x * 0.3, y * 2, 8) * 0.35 + t.rnd() * 0.08, 0.4);
  if (bands) for (let i = 0; i < T; i++) { t.set(i, 0, CHEST[0]); t.set(i, 15, CHEST[0]); t.set(0, i, CHEST[0]); t.set(15, i, CHEST[0]); t.set(1, i, CHEST[4]); }
}
P.chest_side = (t) => { chestWood(t); for (let i = 0; i < T; i++) t.set(i, 5, CHEST[0]); };
P.chest_top = (t) => chestWood(t);
P.chest_front = (t) => {
  P.chest_side(t);
  for (let y = 3; y < 9; y++) for (let x = 6; x < 10; x++) t.set(x, y, IRON[x === 6 || y === 3 ? 3 : 1]);
  t.set(7, 6, IRON[0]); t.set(8, 6, IRON[0]); t.set(7, 7, IRON[0]);
};
P.door = (t) => {
  const D = R('#5e3d1d', '#77502a', '#8f6234', '#a6743f', '#b9854b');
  t.paint(D, (x, y) => 0.5 + t.noise(x * 0.25, y * 2, 8) * 0.3 + t.rnd() * 0.05 + ((x === 0 || x === 15) ? -0.35 : 0) + (x === 1 ? 0.2 : 0), 0.4);
  // tablones verticales y ventanita
  for (let y = 0; y < T; y++) { t.set(5, y, D[0]); t.set(10, y, D[0]); }
  for (let y = 2; y < 6; y++) for (let x = 3; x < 13; x++) t.set(x, y, y === 2 || x === 3 ? D[0] : R('#9cc7d6', '#c4e3ee')[(x + y) % 5 === 0 ? 1 : 0]);
  for (let x = 3; x < 13; x++) t.set(x, 9, D[1]);
  t.set(12, 10, IRON[3]); t.set(12, 11, IRON[1]);
};
P.torch = (t) => {
  t.clear();
  // filas 6..15 = el palito completo (la llama arriba), columnas 7-8; el modelo 3D usa exactamente esa zona
  for (let y = 9; y < 16; y++) { t.set(7, y, hex('#6b4a24')); t.set(8, y, hex('#8d6331')); }
  const fl = R('#c43c0c', '#f08a1e', '#ffd34d', '#fff4c0');
  t.set(7, 8, fl[1]); t.set(8, 8, fl[2]); t.set(7, 7, fl[2]); t.set(8, 7, fl[3]); t.set(7, 6, fl[3]); t.set(8, 6, fl[2]);
  // el ícono también muestra un halo
  t.set(6, 7, fl[0]); t.set(9, 7, fl[0]); t.set(7, 5, fl[1]); t.set(8, 4, fl[0]);
};

// ---------- v1.3 ----------
P.farmland = (t) => {
  t.paint(PAL.dirt, (x, y) => 0.2 + t.fbm(x, y) * 0.35 + (y % 4 === 0 ? -0.2 : 0) + (y % 4 === 1 ? 0.12 : 0) + t.rnd() * 0.1, 0.5);
};
P.farmland_wet = (t) => {
  const wet = PAL.dirt.map((c) => [c[0] * 0.62, c[1] * 0.58, c[2] * 0.56]);
  t.paint(wet, (x, y) => 0.2 + t.fbm(x, y) * 0.35 + (y % 4 === 0 ? -0.2 : 0) + (y % 4 === 1 ? 0.14 : 0) + t.rnd() * 0.1, 0.5);
};
function cropPainter(kind, stage) {
  return (t) => {
    t.clear();
    const green = R('#2d5d1a', '#3e7a24', '#559a31', '#6cb43f', '#8bcb55');
    const h = [5, 9, 12, 15][stage];
    for (const x0 of [3, 7, 11]) {
      let x = x0 + (t.rnd() < 0.5 ? 0 : 1);
      for (let k = 0; k < h; k++) {
        t.setClip(x, 15 - k, t.pick(green, 0.2 + k / h * 0.7, x, k));
        if (k > 2 && k % 3 === 0) { t.setClip(x - 1, 15 - k, green[3]); t.setClip(x + 1, 14 - k, green[4]); }
      }
      if (kind === 'corn' && stage >= 2) {
        // mazorca con su hoja
        const cy = 15 - Math.floor(h * 0.55);
        const ripe = stage === 3;
        for (let k = 0; k < 4; k++) { t.setClip(x + 1, cy - k, ripe ? R('#e8b62b', '#f6d24a')[k % 2] : green[2]); }
        t.setClip(x + 1, cy - 4, ripe ? hex('#9c6a2a') : green[4]);
      }
      if (kind === 'beans' && stage >= 2) {
        for (let k = 3; k < h; k += 3) t.setClip(x + (k % 2 ? 1 : -1), 15 - k, stage === 3 ? hex('#5a1f22') : hex('#7fb04a'));
      }
    }
  };
}
for (let s = 0; s < 4; s++) { P[`corn${s}`] = cropPainter('corn', s); P[`beans${s}`] = cropPainter('beans', s); }
P.lava = (t) => {
  const L = R('#5a1203', '#9b2a07', '#d4520c', '#f08a1a', '#ffc23d', '#fff0a0');
  t.paint(L, (x, y) => 0.35 + t.noise(x, y, 4) * 0.45 + t.noise(x, y, 8) * 0.25 - 0.1, 0.6);
  for (let i = 0; i < 6; i++) t.nugget(Math.floor(t.rnd() * T), Math.floor(t.rnd() * T), 2, 2, [L[1], L[2], L[3], L[4]]);
};
P.obsidian = (t) => {
  const O = R('#0d0814', '#160d22', '#211433', '#2e1d47', '#45306b');
  t.paint(O, (x, y) => 0.25 + t.noise(x, y, 4) * 0.35 + t.rnd() * 0.15, 0.6);
  for (let i = 0; i < 5; i++) { const x = Math.floor(t.rnd() * T), y = Math.floor(t.rnd() * T); t.set(x, y, O[4]); t.set(x + 1, y, hex('#6a4fa0')); }
};
const DEEP = R('#2b2c33', '#35363e', '#40414a', '#4c4d57', '#5a5b66');
P.deep_rock = (t) => {
  t.paint(DEEP, (x, y) => 0.35 + t.noise(x, y * 0.5, 4) * 0.35 + (y % 4 === 0 ? -0.15 : 0) + t.rnd() * 0.1, 0.5);
};
P.deep_rock_top = (t) => {
  t.paint(DEEP, (x, y) => 0.4 + t.fbm(x, y) * 0.3 + t.rnd() * 0.1, 0.5);
};
function deepOre(pal, count) {
  return (t) => {
    P.deep_rock(t);
    for (let i = 0; i < count; i++) t.nugget(1 + Math.floor(t.rnd() * 12), 1 + Math.floor(t.rnd() * 12), 2 + Math.floor(t.rnd() * 2), 2 + (t.rnd() < 0.4 ? 1 : 0), pal);
  };
}
P.deep_ore_iron = deepOre(PAL.iron, 5);
P.deep_ore_gold = deepOre(PAL.gold, 5);
P.deep_ore_diamond = deepOre(PAL.diamond, 5);
P.ore_jade = deepOre(R('#1d5b39', '#2b8552', '#3fae6c', '#86e0a6'), 5);
P.glow_mushroom = (t) => {
  t.clear();
  const cap = R('#1f6f80', '#2fa3b4', '#5fd8de', '#bdfaf6');
  for (const [x0, h, r] of [[4, 6, 2], [10, 9, 3], [7, 4, 1]]) {
    for (let y = 15; y > 15 - h; y--) t.setClip(x0, y, hex('#d8d2bd'));
    const cy = 15 - h;
    for (let dy = -r; dy <= 0; dy++) for (let dx = -r - 1; dx <= r + 1; dx++) if (Math.abs(dx) <= r + 1 + dy) t.setClip(x0 + dx, cy + dy, cap[Math.max(0, Math.min(3, 3 + dy - Math.abs(dx) % 2))]);
  }
};
P.moss = (t) => t.paint(PAL.moss.concat([hex('#7bb54c')]), (x, y) => 0.25 + t.noise(x, y, 8) * 0.5 + t.rnd() * 0.25);
function spike(down) {
  return (t) => {
    t.clear();
    const S = R('#6b5e52', '#857565', '#9f8e7b', '#b9a891');
    for (const [x0, len, w] of [[7, 15, 3], [3, 9, 2], [12, 11, 2]]) {
      for (let k = 0; k < len; k++) {
        const ww = Math.max(0, Math.round(w * (1 - k / len)));
        for (let dx = -ww; dx <= ww; dx++) {
          const y = down ? k : 15 - k;
          t.setClip(x0 + dx, y, S[dx < 0 ? 3 : dx > 0 ? 1 : 2]);
        }
      }
    }
  };
}
P.stalactite = spike(true);
P.stalagmite = spike(false);
P.quartz_block = (t) => {
  const Q = R('#8b84b8', '#a79fd6', '#c6c0ee', '#e6e2ff', '#ffffff');
  t.clear();
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const v = (Math.abs(((x + y * 0.5) % 6) - 3) / 3) * 0.6 + t.noise(x, y, 4) * 0.4;
    if (t.noise(x * 2, y, 8) < 0.18) continue; // huecos entre cristales
    t.set(x, y, t.pick(Q, v + 0.1, x, y, 0.5));
  }
};
P.calcite = (t) => t.paint(R('#c9c6bd', '#d8d5cc', '#e6e3db', '#f1efe9'), (x, y) => 0.4 + t.fbm(x, y) * 0.4 + t.rnd() * 0.1, 0.5);
P.basalt = (t) => t.paint(R('#34343a', '#424249', '#51515a', '#62626b', '#74747e'), (x, y) => 0.4 + Math.sin(x * 1.6 + t.noise(x, y, 4) * 2) * 0.28 + t.rnd() * 0.12, 0.5);
P.basalt_top = (t) => {
  t.paint(R('#34343a', '#424249', '#51515a', '#62626b', '#74747e'), (x, y) => {
    const cx = (x % 8) - 3.5, cy = (y % 8) - 3.5;
    return Math.max(Math.abs(cx), Math.abs(cy)) > 3 ? 0.05 : 0.6 + t.rnd() * 0.1;
  }, 0.4);
};
P.quartz_lamp = (t) => {
  P.calcite(t);
  for (let y = 3; y < 13; y++) for (let x = 3; x < 13; x++) {
    const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
    t.set(x, y, t.pick(R('#b8b0ff', '#d6d0ff', '#efeaff', '#ffffff'), 1.1 - d * 0.12, x, y, 0.6));
  }
};
P.jungle_log = (t) => {
  const J = R('#3b2b1a', '#4f3a22', '#64492b', '#7a5a35', '#906b40');
  t.paint(J, (x, y) => 0.45 + Math.sin(y * 0.9 + t.noise(x, y, 4) * 2) * 0.2 + t.noise(x * 2, y, 8) * 0.2 + t.rnd() * 0.1 - 0.1, 0.5);
  for (let i = 0; i < 6; i++) { const x = Math.floor(t.rnd() * T), y = Math.floor(t.rnd() * T); t.set(x, y, PAL.moss[2]); t.set(x + 1, y, PAL.moss[1]); }
};
P.jungle_log_top = (t) => rings(t, R('#3b2b1a', '#4f3a22', '#64492b', '#7a5a35'));
P.jungle_leaves = leaves(R('#123d12', '#185017', '#20661d', '#2c7c24', '#3b932e', '#52ab3f'));
P.vine = (t) => {
  t.clear();
  for (const x0 of [3, 8, 12]) {
    let x = x0;
    for (let y = 0; y < T; y++) {
      if (t.rnd() < 0.85) t.set(x, y, t.pick(PAL.leaf, 0.3 + t.rnd() * 0.6, x, y));
      if (y % 3 === 1) { t.setClip(x - 1, y, PAL.leaf[4]); t.setClip(x + 1, y + 1, PAL.leaf[3]); }
      if (t.rnd() < 0.25) x += t.rnd() < 0.5 ? -1 : 1;
    }
  }
};
P.cobweb = (t) => {
  t.clear();
  const W = [235, 235, 235];
  for (let i = 0; i < T; i++) { t.set(i, i, W); t.set(15 - i, i, W); t.set(7, i, W); t.set(i, 8, W); }
  for (const r of [3, 6]) for (let a = 0; a < 16; a++) {
    const ang = (a / 16) * Math.PI * 2;
    t.setClip(Math.round(7.5 + Math.cos(ang) * r), Math.round(7.5 + Math.sin(ang) * r), W, 200);
  }
};
P.smooth_stone = (t) => {
  t.paint(PAL.stone, (x, y) => 0.55 + t.fbm(x, y) * 0.2 + (x === 0 || y === 0 ? 0.2 : 0) + (x === 15 || y === 15 ? -0.3 : 0), 0.4);
};

P.bed_top = (t) => {
  const BL = R('#7a1a1a', '#9a2424', '#b83030', '#cf4a3c');
  t.paint(BL, (x, y) => 0.4 + t.noise(x, y, 4) * 0.3 + ((x + y) % 6 === 0 ? 0.25 : 0) + t.rnd() * 0.08, 0.4);
  // almohada blanca arriba
  for (let y = 0; y < 5; y++) for (let x = 1; x < 15; x++) t.set(x, y, t.pick(R('#cfcac0', '#e2ddd3', '#f2eee6', '#ffffff'), 0.5 + (y === 0 ? 0.4 : 0) - (y === 4 ? 0.3 : 0) + t.rnd() * 0.1, x, y));
  for (let x = 0; x < T; x++) t.set(x, 5, BL[0]);
};
P.bed_side = (t) => {
  t.clear();
  const BL = R('#7a1a1a', '#9a2424', '#b83030');
  for (let y = 6; y < 11; y++) for (let x = 0; x < T; x++) t.set(x, y, BL[y === 6 ? 2 : 1]);
  for (let y = 11; y < 16; y++) for (let x = 0; x < T; x++) {
    const leg = x < 2 || x > 13;
    if (y > 12 && !leg) continue;
    t.set(x, y, t.pick(PAL.plank, 0.4 + t.rnd() * 0.3 - (y === 15 ? 0.2 : 0), x, y));
  }
};

P.banana_bunch = (t) => {
  t.clear();
  for (let y = 0; y < 5; y++) t.set(7, y, PAL.plank[1]);
  const Y = R('#8a7a1c', '#bfae2a', '#e6d23f', '#f6e870');
  for (let k = 0; k < 14; k++) {
    const y = 4 + Math.floor(k / 3) * 2, x = 4 + (k % 3) * 3;
    for (let j = 0; j < 3; j++) t.setClip(x + j - 1, y + (j === 1 ? 1 : 0), Y[1 + (j === 1 ? 2 : 0)]);
    t.setClip(x - 2, y, R('#4c6a1c')[0]);
  }
};
const HIVE = R('#5b4220', '#76572a', '#8f6c36', '#a88244');
P.hive = (t) => t.paint(HIVE, (x, y) => 0.4 + Math.sin(y * 1.1) * 0.25 + t.noise(x, y, 4) * 0.3 + t.rnd() * 0.1, 0.5);
P.hive_top = (t) => { P.hive(t); for (let y = 5; y < 11; y++) for (let x = 5; x < 11; x++) t.set(x, y, HIVE[0]); };
P.hive_front = (t) => {
  P.hive(t);
  // entrada de cera con tubito (las meliponas hacen un tubo en la entrada)
  for (let y = 6; y < 11; y++) for (let x = 6; x < 10; x++) t.set(x, y, (x === 6 || x === 9 || y === 6 || y === 10) ? hex('#c9a24a') : hex('#1a1206'));
  t.set(8, 12, hex('#f2c94c')); t.set(5, 3, hex('#f2c94c'));
};
P.turtle_nest = (t) => {
  P.sand(t);
  for (const [x, y] of [[4, 5], [7, 4], [10, 6], [6, 8], [9, 9], [5, 11], [11, 11]]) t.nugget(x, y, 2, 2, R('#c9c2b0', '#ded8c8', '#efeadd', '#ffffff'), false);
};
// v12.7.2 (C5-A2): el secadero, una rejilla de caña sobre patas, con pescados abiertos
P.secadero = (t) => {
  t.clear();
  const C = R('#8a6a40', '#a8845a'), F = R('#c8a060', '#e0c080');
  for (let i = 0; i < T; i++) { t.set(1, i, C[0]); t.set(14, i, C[0]); }
  for (let x = 1; x < 15; x++) { t.set(x, 6, C[1]); t.set(x, 10, C[1]); }
  for (let x = 2; x < 14; x += 2) for (let y = 7; y < 10; y++) t.set(x, y, C[x & 2 ? 0 : 1]);
  for (const [x, y] of [[3, 3], [8, 3], [5, 12], [10, 12]]) for (let k = 0; k < 4; k++) t.set(x + k, y + (k === 0 || k === 3 ? 1 : 0), F[k & 1]);
};
// v12.6.0 (C5-B)
P.nido_marcado = (t) => {
  P.turtle_nest(t);
  const M = R('#d8d0b8', '#efe6cc'), E = R('#7a5230', '#9a6a3e');
  for (let i = 0; i < T; i += 3) for (let j = 0; j < T; j++) if ((i + j) % 3 === 0) t.set(i, j, M[(i + j) & 1]); // la malla
  for (const [x, y] of [[1, 1], [14, 1], [1, 14], [14, 14]]) { t.set(x, y, E[0]); t.set(x + (x < 8 ? 1 : -1), y, E[1]); } // las estacas
  for (let x = 2; x < 14; x++) t.set(x, 1, hex('#f0c020')); // la cinta amarilla
};
P.coral_blanco = (t) => {
  P.coral_red(t);
  for (let k = 0; k < t.data.length; k += 4) { const v = (t.data[k] + t.data[k + 1] + t.data[k + 2]) / 3; t.data[k] = Math.min(255, 150 + v * 0.45); t.data[k + 1] = Math.min(255, 148 + v * 0.45); t.data[k + 2] = Math.min(255, 140 + v * 0.42); }
};
P.vivero_coral = (t) => {
  t.clear();
  const C = R('#8a6a40', '#b08a58'), F = R('#e05868', '#f0a040', '#b070e0');
  for (let i = 0; i < T; i++) { t.set(i, 15, C[0]); t.set(0, i, C[1]); t.set(15, i, C[1]); }
  for (let x = 1; x < 15; x += 2) for (let y = 4; y < 15; y += 4) t.set(x, y, C[x & 1]); // los tubos de caña
  for (let k = 0; k < 8; k++) { const x = 2 + Math.floor(t.rnd() * 12), y = 2 + Math.floor(t.rnd() * 11); t.set(x, y, F[k % 3]); t.setClip(x, y - 1, F[(k + 1) % 3]); }
};
P.pecera = (t) => {
  P.glass(t);
  const W = R('#2a70c0', '#3a88d8', '#5aa8ec');
  for (let y = 5; y < 15; y++) for (let x = 1; x < 15; x++) t.set(x, y, W[(x * 3 + y) % 3], 170);
  for (const [x, y] of [[6, 9], [7, 9], [8, 9], [5, 9], [8, 8], [8, 10]]) t.set(x, y, hex('#f08a30'));
  for (let x = 2; x < 14; x += 3) t.set(x, 14, hex('#d8c890'));
};
P.morpho_jar = (t) => {
  t.clear();
  const G = R('#a9d6e2', '#d2eef5');
  for (let y = 3; y < 16; y++) { t.set(3, y, G[0]); t.set(12, y, G[1]); }
  for (let x = 3; x < 13; x++) { t.set(x, 15, G[0]); t.set(x, 3, G[1]); }
  for (let x = 5; x < 11; x++) { t.set(x, 1, PAL.plank[2]); t.set(x, 2, PAL.plank[1]); }
  // mariposa azul brillante adentro
  const B = R('#0c3d8a', '#1f6fd6', '#4fa8ff', '#a8dcff');
  for (const [x, y, c] of [[5, 8, 1], [6, 7, 2], [6, 8, 3], [6, 9, 2], [9, 7, 2], [9, 8, 3], [9, 9, 2], [10, 8, 1], [7, 8, 0], [8, 8, 0], [5, 10, 1], [10, 10, 1]]) t.set(x, y, B[c]);
};

function coffeeBush(stage) {
  return (t) => {
    t.clear();
    const G = R('#1f4a18', '#2a6020', '#37782a', '#4a8f36');
    const h = [6, 10, 14, 15][stage];
    for (let y = 15; y > 15 - h; y--) t.set(7, y, hex('#5a4128'));
    for (let k = 0; k < 6 + stage * 6; k++) {
      const y = 15 - Math.floor(t.rnd() * h), x = 7 + Math.round((t.rnd() - 0.5) * (2 + stage * 3));
      t.setClip(x, y, G[Math.floor(t.rnd() * 4)]); t.setClip(x + 1, y, G[2]);
    }
    if (stage >= 2) for (let k = 0; k < 8; k++) {
      const y = 15 - Math.floor(t.rnd() * (h - 2)) - 1, x = 7 + Math.round((t.rnd() - 0.5) * 8);
      t.setClip(x, y, stage === 3 ? R('#a3121a', '#d8202a')[k % 2] : hex('#6fa83a'));
    }
  };
}
for (let s = 0; s < 4; s++) P[`cafe${s}`] = coffeeBush(s);
P.cane = (t) => {
  t.clear();
  for (const x0 of [5, 9]) for (let y = 0; y < T; y++) {
    const knot = y % 5 === 0;
    t.set(x0, y, knot ? hex('#8fae4a') : hex('#b9cf68')); t.set(x0 + 1, y, knot ? hex('#6a8a32') : hex('#93b24c'));
  }
  for (const [x, y, d] of [[4, 3, -1], [11, 6, 1], [3, 10, -1], [12, 12, 1]]) for (let k = 0; k < 3; k++) t.setClip(x + d * k, y + k, hex('#5f9a2e'));
};
P.trapiche = (t) => { P.planks(t); for (let y = 0; y < T; y++) { t.set(0, y, PAL.bark[0]); t.set(15, y, PAL.bark[0]); } };
P.trapiche_top = (t) => P.log_top(t);
const ADOBE = R('#8a5a3c', '#a06a46', '#b67c54', '#c88e62');
P.stove_side = (t) => t.paint(ADOBE, (x, y) => 0.45 + t.fbm(x, y) * 0.3 + (y % 5 === 4 ? -0.25 : 0) + t.rnd() * 0.08, 0.5);
P.stove_top = (t) => {
  P.stove_side(t);
  // comal de hierro
  for (let y = 3; y < 13; y++) for (let x = 3; x < 13; x++) t.set(x, y, t.pick(R('#262628', '#323236', '#404046'), 0.3 + t.rnd() * 0.4, x, y));
};
P.stove_front = (t) => {
  P.stove_side(t);
  for (let y = 8; y < 15; y++) for (let x = 4; x < 12; x++) {
    const edge = y === 8 || x === 4 || x === 11;
    if (edge) { t.set(x, y, ADOBE[0]); continue; }
    const v = 1 - (y - 9) / 6 * 0.6 + t.noise(x * 2, y, 8) * 0.3;
    t.set(x, y, t.pick(R('#3a1205', '#7a2a08', '#c4520c', '#f08a1a', '#ffd25a'), v, x, y, 0.6));
  }
  for (let x = 5; x < 11; x += 2) t.set(x, 14, PAL.bark[2]);
};

// ---- v1.8: pueblos ticos ----
// madera pintada: tablas horizontales con la pintura gastada en las orillas
function paintedWood(cols) {
  const C = R(...cols);
  return (t) => {
    t.paint(C, (x, y) => 0.5 + t.noise(x * 3, y, 4) * 0.25 + t.rnd() * 0.12, 0.4);
    for (let y = 0; y < T; y++) {
      if (y % 4 === 3) for (let x = 0; x < T; x++) t.set(x, y, C[0]); // ranura entre tablas
      // pintura descascarada: se asoma la madera
      for (let x = 0; x < T; x++) if (t.rnd() < 0.035) t.set(x, y, PAL.plank[1 + Math.floor(t.rnd() * 2)]);
    }
    for (const x of [3, 11]) t.set(x, 1 + Math.floor(t.rnd() * 2) * 4, hex('#3a3a3a')); // clavos
  };
}
P.paint_blue = paintedWood(['#2f6f9a', '#3f8ab8', '#58a6d2', '#7cc0e6']);
P.paint_green = paintedWood(['#2f6a3a', '#3f8a4a', '#57a862', '#79c280']);
P.paint_yellow = paintedWood(['#b8901e', '#d6ac2a', '#ecc642', '#f6dc74']);
P.paint_pink = paintedWood(['#a8456a', '#c85c84', '#e07aa0', '#f2a2c0']);
P.adobe = (t) => {
  t.paint(ADOBE, (x, y) => 0.45 + t.fbm(x, y) * 0.35 + t.rnd() * 0.1, 0.5);
  // pajilla y bloques de adobe
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    if (y % 8 === 7 || (x + (Math.floor(y / 8) % 2) * 8) % 16 === 0) t.set(x, y, ADOBE[0]);
    else if (t.rnd() < 0.04) t.set(x, y, hex('#d9b46a'));
  }
};
P.plaster = (t) => {
  t.paint(R('#d8d2c4', '#e6e0d2', '#f0ebdf', '#f8f5ee'), (x, y) => 0.55 + t.fbm(x * 1.5, y * 1.5) * 0.35 + t.rnd() * 0.08, 0.5);
  // grietitas y una mancha de humedad abajo
  for (let k = 0; k < 2; k++) { let x = Math.floor(t.rnd() * T), y = Math.floor(t.rnd() * 8); for (let i = 0; i < 5; i++) { t.setClip(x, y, hex('#b9b2a2')); x += Math.round(t.rnd() * 2 - 1); y++; } }
  for (let x = 0; x < T; x++) if (t.rnd() < 0.5) t.set(x, 15, hex('#c9c0aa'));
};
const TEJA = R('#7a2a18', '#9a3a20', '#b84c2a', '#d2643a', '#e0805a');
P.teja = (t) => {
  // filas de tejas curvas que se traslapan
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const row = Math.floor(y / 4), lx = (x + (row % 2) * 2) % 4, ly = y % 4;
    const curve = 1 - Math.abs(lx - 1.5) / 2;
    const v = 0.25 + curve * 0.55 - (ly === 3 ? 0.3 : 0) + t.rnd() * 0.1 + t.noise(x, y, 6) * 0.15;
    t.set(x, y, t.pick(TEJA, v, x, y, 0.5));
  }
  for (let k = 0; k < 4; k++) t.set(Math.floor(t.rnd() * T), Math.floor(t.rnd() * T), hex('#4a5a2a')); // musgo
};
P.teja_side = (t) => {
  P.planks(t);
  for (let y = 0; y < 5; y++) for (let x = 0; x < T; x++) {
    const lx = x % 4, curve = 1 - Math.abs(lx - 1.5) / 2;
    if (y < 3 || curve > 0.5) t.set(x, y, t.pick(TEJA, 0.3 + curve * 0.5 - y * 0.06 + t.rnd() * 0.1, x, y, 0.5));
  }
};

// ---- v1.9: corales con pólipos ----
function coral(cols) {
  const C = R(...cols);
  return (t) => {
    t.paint(C, (x, y) => 0.35 + t.fbm(x * 2, y * 2) * 0.45 + t.rnd() * 0.1, 0.5);
    // pólipos: puntitos claros con centro oscuro
    for (let k = 0; k < 14; k++) {
      const x = Math.floor(t.rnd() * T), y = Math.floor(t.rnd() * T);
      t.set(x, y, C[0]); t.setClip(x + 1, y, C[C.length - 1]); t.setClip(x, y + 1, C[C.length - 1]); t.setClip(x - 1, y, C[C.length - 2]);
    }
  };
}
P.coral_red = coral(['#7a1420', '#a82234', '#d03a4c', '#f06a78', '#ffa0a8']);
P.coral_orange = coral(['#8a3a10', '#b8561a', '#e07a2a', '#f8a050', '#ffd090']);
P.coral_yellow = coral(['#8a7010', '#b89a1a', '#e0c42c', '#f4e060', '#fff4a8']);
P.coral_purple = coral(['#3a1a6a', '#5a2a9a', '#7a40c8', '#a070e8', '#d0b0ff']);

// ---- v2.1: farol de hierro con vidrio y llama ----
P.farol = (t) => {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const frame = x < 2 || x > 13 || y < 2 || y > 13 || x === 7 || x === 8;
    if (frame) { t.set(x, y, t.pick(R('#1e1e22', '#2e2e34', '#3c3c44'), 0.3 + t.rnd() * 0.5, x, y)); continue; }
    const d = Math.hypot(x - 7.5, y - 9) / 7;
    t.set(x, y, t.pick(R('#c86a10', '#f0a028', '#ffd060', '#fff4c0'), 1 - d + t.rnd() * 0.1, x, y, 0.6));
  }
};
// v2.52: apagados (vidrio gris, sin brillo)
P.lamp_off = (t) => { P.lamp(t); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const frame = x < 2 || y < 2 || x > 13 || y > 13 || x === 7 || x === 8 || y === 7 || y === 8; if (!frame) t.set(x, y, t.pick(R('#3a3a3e', '#4a4a50', '#5a5a62'), 0.3 + t.rnd() * 0.5, x, y)); } };
P.farol_off = (t) => { P.farol(t); for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) if (x !== 7 && x !== 8) t.set(x, y, t.pick(R('#2e2e34', '#3e3e46', '#4e4e58'), 0.3 + t.rnd() * 0.5, x, y)); };
P.farol_top_off = (t) => { t.paint(R('#1e1e22', '#2e2e34', '#3c3c44'), () => 0.4 + t.rnd() * 0.4, 0.4); };
P.farol_top = (t) => {
  t.paint(R('#1e1e22', '#2e2e34', '#3c3c44'), () => 0.4 + t.rnd() * 0.4, 0.4);
  for (let y = 5; y < 11; y++) for (let x = 5; x < 11; x++) t.set(x, y, hex('#ffd060'));
};

// ---- v2.2: bosque nuboso y aguas termales ----
const MOSS = R('#2a4a18', '#3a6a22', '#4e8a2e', '#6aa83c');
P.tronco_musgoso = (t) => {
  P.log_side(t);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const m = t.noise(x * 1.5, y * 0.7, 5) + (y > 10 ? 0.25 : 0);
    if (m > 0.55) t.set(x, y, t.pick(MOSS, m - 0.3 + t.rnd() * 0.2, x, y, 0.6));
  }
};
P.musgo = (t) => { t.paint(MOSS, (x, y) => 0.35 + t.fbm(x * 2, y * 2) * 0.5 + t.rnd() * 0.1, 0.6); };
P.bromelia = (t) => {
  t.clear();
  const G = R('#2a5a1a', '#3a7a24', '#58a032');
  for (const [dx, h, lean] of [[-4, 7, -1], [-2, 9, -0.5], [0, 10, 0], [2, 9, 0.5], [4, 7, 1]]) {
    for (let k = 0; k < h; k++) t.setClip(Math.round(8 + dx * (k / h) + lean * k * 0.3), 15 - k, G[k % 3]);
  }
  // flor roja en el centro
  for (const [x, y] of [[7, 6], [8, 6], [7, 5], [8, 5], [8, 4], [7, 7], [8, 7]]) t.set(x, y, hex(y < 6 ? '#e8282a' : '#ff6a20'));
};
P.helecho = (t) => {
  t.clear();
  const G = R('#1e4a16', '#2e6a20', '#44902e', '#5aa83a');
  for (const [ang, len] of [[-1.1, 9], [-0.55, 12], [0, 13], [0.55, 12], [1.1, 9]]) {
    for (let k = 0; k < len; k++) {
      const x = Math.round(8 + Math.sin(ang) * k * (0.6 + k * 0.03)), y = Math.round(15 - Math.cos(ang) * k * 0.9 + (k * k) * 0.015);
      t.setClip(x, y, G[2]);
      if (k > 2 && k % 2 === 0) { t.setClip(x - 1, y, G[1]); t.setClip(x + 1, y, G[3]); }
    }
  }
};
P.travertino = (t) => {
  t.paint(R('#b07a4a', '#c8946a', '#dcb08a', '#ecd0b0', '#f6e8d8'), (x, y) => 0.4 + Math.sin(y * 1.3 + t.noise(x, y, 4) * 3) * 0.2 + t.rnd() * 0.12, 0.5);
};

// ---- v2.5: Inframundo Volcánico ----
P.portal = (t) => {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const a = Math.atan2(y - 7.5, x - 7.5), d = Math.hypot(x - 7.5, y - 7.5);
    const v = Math.sin(a * 3 + d * 0.9) * 0.5 + 0.5;
    t.set(x, y, t.pick(R('#3a0a40', '#7a1a6a', '#d0306a', '#ff8a30', '#ffd070'), v * 0.8 + t.rnd() * 0.15, x, y, 0.5), 200);
  }
};
P.ceniza = (t) => t.paint(R('#3a3836', '#4a4744', '#5a5652', '#6c6762', '#7e7872'), (x, y) => 0.35 + t.fbm(x * 2, y * 2) * 0.45 + t.rnd() * 0.15, 0.6);
P.basalto_col = (t) => {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const seam = x % 5 === 0;
    t.set(x, y, t.pick(R('#1e1e24', '#2a2a32', '#36363f', '#44444e'), (seam ? 0.05 : 0.45) + t.noise(x, y * 0.3, 4) * 0.3 + t.rnd() * 0.08, x, y, 0.5));
  }
};
P.basalto_col_top = (t) => {
  t.paint(R('#22222a', '#30303a', '#3e3e48'), () => 0.45 + t.rnd() * 0.3, 0.5);
  for (let i = 0; i < T; i++) { t.set(i, 0, hex('#16161c')); t.set(0, i, hex('#16161c')); t.set(i, 8, hex('#16161c')); t.set(8, (i + 4) % T, hex('#16161c')); }
};
P.azufre_ore = (t) => { P.basalt(t); for (let k = 0; k < 7; k++) { const x = 1 + Math.floor(t.rnd() * 13), y = 1 + Math.floor(t.rnd() * 13); for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) t.set(x + dx, y + dy, t.pick(R('#b89a10', '#e8d030', '#fff070'), 0.3 + t.rnd() * 0.7, x, y)); } };
P.oro_volcanico = (t) => { P.basalt(t); for (let k = 0; k < 6; k++) { const x = 1 + Math.floor(t.rnd() * 13), y = 1 + Math.floor(t.rnd() * 13); t.set(x, y, hex('#ffe060')); t.setClip(x + 1, y, hex('#ffb020')); t.setClip(x, y + 1, hex('#ff8a20')); } };
P.magma = (t) => {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const crack = Math.abs(t.noise(x * 1.3, y * 1.3, 4) - 0.5) < 0.08;
    t.set(x, y, crack ? t.pick(R('#ff6010', '#ffa030', '#ffe080'), 0.5 + t.rnd() * 0.5, x, y) : t.pick(R('#2a1210', '#3a1a12', '#4e2414'), 0.4 + t.rnd() * 0.4, x, y));
  }
};
P.hongo_fuego = (t) => {
  t.clear();
  for (let y = 9; y < 16; y++) { t.set(7, y, hex('#e8d0a0')); t.set(8, y, hex('#d0b080')); }
  for (let y = 4; y < 9; y++) for (let x = 3; x < 13; x++) {
    if (Math.hypot(x - 7.5, (y - 8) * 1.6) > 5.2) continue;
    t.set(x, y, t.pick(R('#c82010', '#ff5a10', '#ffa020', '#ffe070'), 1 - (y - 4) / 6 + t.rnd() * 0.2, x, y));
  }
  for (const [x, y] of [[5, 5], [9, 6], [7, 4]]) t.set(x, y, hex('#fff2b0'));
};
P.piedra_pomez = (t) => {
  t.paint(R('#9a948a', '#b0aa9e', '#c4bdb0', '#d4cec2'), (x, y) => 0.45 + t.fbm(x, y) * 0.3, 0.5);
  for (let k = 0; k < 22; k++) t.set(Math.floor(t.rnd() * T), Math.floor(t.rnd() * T), hex('#6e6a62'));
};

// ---- v2.6: Costa Rica monumental ----
P.placa_front = (t) => {
  P.smooth_stone(t);
  for (let y = 3; y < 13; y++) for (let x = 2; x < 14; x++) {
    const edge = y === 3 || y === 12 || x === 2 || x === 13;
    t.set(x, y, edge ? hex('#5a3a12') : t.pick(R('#7a5418', '#9a6e22', '#b88a34'), 0.4 + t.rnd() * 0.4, x, y));
  }
  for (const y of [5, 7, 9]) for (let x = 4; x < 12; x++) if (t.rnd() < 0.8) t.set(x, y, hex('#3a2408'));
};
// rueda pintada de Sarchí: estrella de colores en círculos
P.rueda = (t) => {
  t.clear();
  const C = ['#c8202a', '#f0c020', '#1a5ac8', '#2a9a40', '#f4f0e0'];
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const d = Math.hypot(x - 7.5, y - 7.5), a = Math.atan2(y - 7.5, x - 7.5);
    if (d > 8) continue;
    if (d > 7) { t.set(x, y, hex('#3a2a1a')); continue; }
    if (d < 1.5) { t.set(x, y, hex('#3a2a1a')); continue; }
    const ray = Math.floor(((a + Math.PI) / (Math.PI * 2)) * 16) % 2;
    const ring = Math.floor(d / 1.8);
    t.set(x, y, hex(C[(ring + ray) % C.length]));
  }
};
P.madera_carreta = (t) => {
  t.paint(R('#a01818', '#b82222', '#cc2a2a'), () => 0.4 + t.rnd() * 0.3, 0.4);
  // flores y rombos de colores
  const C = ['#f0c020', '#1a5ac8', '#2a9a40', '#f4f0e0'];
  for (const [cx, cy] of [[4, 4], [11, 4], [4, 11], [11, 11]]) for (const [dx, dy, k] of [[0, -2, 0], [2, 0, 1], [0, 2, 2], [-2, 0, 3], [0, 0, 3], [1, -1, 0], [-1, 1, 1]]) t.set(cx + dx, cy + dy, hex(C[k]));
  for (let i = 0; i < T; i++) { t.set(i, 0, hex('#f0c020')); t.set(i, 15, hex('#f0c020')); }
};
P.repello_rojo = (t) => { t.paint(R('#8a1a16', '#a8261e', '#c43428', '#d44a3a'), (x, y) => 0.5 + t.fbm(x * 1.5, y * 1.5) * 0.3 + t.rnd() * 0.08, 0.5); };

P.arbolito_guanacaste = (t) => {
  t.clear();
  for (let y = 8; y < 16; y++) t.set(7, y, hex('#6a4a2a'));
  const G = R('#2e6a1e', '#3e8a28', '#5aa83a');
  for (let k = 0; k < 40; k++) { const x = 2 + Math.floor(t.rnd() * 12), y = 3 + Math.floor(t.rnd() * 6); if (Math.hypot(x - 7.5, (y - 6) * 1.8) < 6) t.set(x, y, G[k % 3]); }
};

// ---- v2.8: laguna ácida del Poás, pajonal del páramo, costra de azufre ----
P.agua_acida = (t) => {
  const C = R('#1a8a8a', '#26a8a0', '#3cc4b4', '#5ed8c4', '#8aead8', '#c4f8ec');
  t.paint(C, (x, y) => 0.4 + Math.sin(x * 0.8 + y * 0.35 + t.noise(x, y, 4) * 4) * 0.2 + t.fbm(x, y) * 0.2, 0.7);
  for (let i = 0; i < 5; i++) { const x = Math.floor(t.rnd() * T), y = Math.floor(t.rnd() * T); for (let k = 0; k < 3; k++) t.set(x + k, y, C[5]); }
};
P.pajon = (t) => {
  t.clear();
  const C = R('#8a7a3a', '#a8964a', '#c4b060', '#dcc878');
  for (let k = 0; k < 14; k++) {
    let x = 2 + Math.floor(t.rnd() * 12);
    const h = 7 + Math.floor(t.rnd() * 8), lean = (t.rnd() - 0.5) * 0.5;
    for (let i = 0; i < h; i++) { t.setClip(Math.round(x + lean * i), 15 - i, C[Math.min(3, Math.floor(i / 4))]); }
    x += 1;
  }
};
P.azufre_bloque = (t) => { t.paint(R('#a88a10', '#c8a818', '#e8cc30', '#f8e870'), (x, y) => 0.35 + t.fbm(x * 2, y * 2) * 0.5 + t.rnd() * 0.1, 0.5); };

// ---- v2.9: mural del Teatro Nacional y rueda grande de la carreta (imágenes repartidas en bloques) ----
for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) P[`mural_${i}_${j}`] = slicePainter(muralImage(), i, j);
for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) P[`ruedag_${i}_${j}`] = slicePainter(wheelImage(), i, j);

// ---- v2.12: Tierras del Cielo ----
P.nube = (t) => { t.paint(R('#d8e0ea', '#e6ecf4', '#f2f6fa', '#ffffff'), (x, y) => 0.45 + t.fbm(x * 1.5, y * 1.5) * 0.5 + t.rnd() * 0.06, 0.6); };
P.portal_cielo = (t) => {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const a = Math.atan2(y - 7.5, x - 7.5), d = Math.hypot(x - 7.5, y - 7.5);
    const v = Math.sin(a * 2 + d * 0.8) * 0.5 + 0.5;
    t.set(x, y, t.pick(R('#3a7ac8', '#6aa8e8', '#a8d8ff', '#fff4c0', '#ffd860'), v * 0.85 + t.rnd() * 0.12, x, y, 0.5), 200);
  }
};
P.piedra_cielo = (t) => {
  t.paint(R('#b8c8d8', '#c8d6e4', '#d8e4ee', '#e8f0f6'), (x, y) => 0.45 + t.fbm(x, y) * 0.35 + t.rnd() * 0.08, 0.5);
  for (let k = 0; k < 3; k++) { let x = Math.floor(t.rnd() * T), y = Math.floor(t.rnd() * T); for (let i = 0; i < 5; i++) { t.setClip(x, y, hex('#e8c050')); x += Math.round(t.rnd() * 2 - 1); y += 1; } }
};

// ---- v2.14: pueblos y ciudad ----
const ASF = R('#26262a', '#2f2f34', '#38383d', '#424247', '#4e4e54');
P.asfalto = (t) => {
  t.paint(ASF, (x, y) => 0.4 + t.fbm(x * 2, y * 2) * 0.3 + t.rnd() * 0.25, 0.8);
  for (let k = 0; k < 14; k++) t.set(Math.floor(t.rnd() * T), Math.floor(t.rnd() * T), hex(t.rnd() < 0.5 ? '#6a6a70' : '#1c1c20'));
};
P.asfalto_linea = (t) => {
  P.asfalto(t);
  for (let y = 0; y < T; y++) if (y % 16 < 10) for (let x = 6; x <= 9; x++) t.set(x, y, t.rnd() < 0.15 ? hex('#b8a040') : hex('#e8c838'));
};
P.acera = (t) => {
  t.paint(R('#8e8e88', '#9e9e98', '#acaca6', '#bababa'), (x, y) => 0.45 + t.fbm(x * 2, y * 2) * 0.3 + t.rnd() * 0.1, 0.5);
  for (let i = 0; i < T; i++) { t.set(i, 0, hex('#76766f')); t.set(0, i, hex('#76766f')); t.set(i, 8, hex('#84847d')); }
};
P.bloque_concreto = (t) => {
  t.paint(R('#7c7c7a', '#8a8a87', '#979794', '#a5a5a1'), (x, y) => 0.45 + t.fbm(x * 2, y * 2) * 0.3 + t.rnd() * 0.15, 0.6);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if (y % 8 === 7 || (x + (Math.floor(y / 8) % 2) * 8) % 16 === 15) t.set(x, y, hex('#5e5e5b'));
};
P.concreto = (t) => { t.paint(R('#8a8a86', '#969692', '#a2a29e', '#aeaeaa'), (x, y) => 0.45 + t.fbm(x * 1.5, y * 1.5) * 0.35 + t.rnd() * 0.08, 0.5); };
P.zinc = (t) => {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const v = 0.5 + Math.sin((x / 4) * Math.PI * 2) * 0.35 + t.rnd() * 0.08;
    t.set(x, y, t.pick(R('#6e7478', '#8a9094', '#a8aeb2', '#c4cacc'), v, x, y, 0.4));
  }
  for (let k = 0; k < 3; k++) { const x = Math.floor(t.rnd() * T), y = Math.floor(t.rnd() * T); for (let i = 0; i < 4; i++) t.setClip(x + (i % 2), y + Math.floor(i / 2), hex(i ? '#8a4a24' : '#a85a2a')); }
};
P.verja = (t) => {
  t.clear();
  const I = hex('#202024'), I2 = hex('#3a3a40');
  for (let y = 0; y < T; y++) for (const x of [1, 5, 9, 13]) { t.set(x, y, I); t.set(x + 1, y, I2); }
  for (const y of [1, 2, 13, 14]) for (let x = 0; x < T; x++) t.set(x, y, y % 2 ? I : I2);
  for (const x of [1, 5, 9, 13]) t.set(x, 0, hex('#505058'));
};
P.estante = (t) => {
  P.planks(t);
  const C = ['#c83030', '#e8c030', '#3070c8', '#30a050', '#f0f0e8', '#e07020', '#a040a0'];
  for (const row of [1, 9]) for (let x = 1; x < 15; x += 2) {
    const col = hex(C[Math.floor(t.rnd() * C.length)]), h = 4 + Math.floor(t.rnd() * 3);
    for (let y = row + 6 - h; y < row + 6; y++) { t.set(x, y, col); t.set(x + 1, y, col); }
    t.set(x, row + 6 - h, hex('#ffffff'));
  }
  for (const row of [7, 15]) for (let x = 0; x < T; x++) t.set(x, row, hex('#4a3420'));
};
P.cable = (t) => { t.paint(R('#101012', '#18181a', '#222226'), () => 0.5 + t.rnd() * 0.3, 0.4); };
P.tanque = (t) => {
  t.paint(R('#141418', '#1c1c22', '#26262c', '#30303a'), (x, y) => 0.4 + t.rnd() * 0.2 + (y % 5 === 0 ? 0.35 : 0), 0.4);
};
P.tanque_top = (t) => {
  t.paint(R('#141418', '#1c1c22', '#26262c', '#30303a'), (x, y) => 0.3 + t.rnd() * 0.2 + (Math.hypot(x - 7.5, y - 7.5) < 3 ? 0.4 : 0), 0.4);
};

// ---- v2.15: carreteras ----
P.asfalto_parche = (t) => {
  t.paint(R('#141416', '#1a1a1d', '#222226', '#2a2a2f'), (x, y) => 0.4 + t.fbm(x * 2, y * 2) * 0.3 + t.rnd() * 0.2, 0.7);
  for (let i = 0; i < T; i++) { t.set(i, 0, hex('#3a3a40')); t.set(0, i, hex('#3a3a40')); }
};
P.asfalto_roto = (t) => {
  P.asfalto(t);
  let x = 2 + Math.floor(t.rnd() * 4), y = 0;
  while (y < T) { t.setClip(x, y, hex('#121214')); t.setClip(x + 1, y, hex('#1a1a1e')); x += Math.round(t.rnd() * 2 - 0.8); y++; if (t.rnd() < 0.2) { let bx = x, by = y; for (let k = 0; k < 5; k++) { t.setClip(bx, by, hex('#141416')); bx += 1; by += Math.round(t.rnd()); } } }
};
P.cono = (t) => {
  t.paint(R('#d84a10', '#ec5a18', '#f87428', '#ff8a3a'), () => 0.4 + t.rnd() * 0.3, 0.4);
  for (const y of [5, 6, 10, 11]) for (let x = 0; x < T; x++) t.set(x, y, hex(t.rnd() < 0.1 ? '#d0d0d0' : '#f4f4f4'));
};
P.fondo_hueco = (t) => {
  t.paint(R('#2e2218', '#3a2c1e', '#4a3826', '#5a4630'), (x, y) => 0.4 + t.fbm(x * 2, y * 2) * 0.4 + t.rnd() * 0.1, 0.6);
  for (let k = 0; k < 6; k++) t.set(Math.floor(t.rnd() * T), Math.floor(t.rnd() * T), hex('#6a6a70'));
  for (let k = 0; k < 4; k++) t.set(Math.floor(t.rnd() * T), Math.floor(t.rnd() * T), hex('#3a4a6a'));
};
P.maquina = (t) => {
  t.paint(R('#b88a10', '#d4a418', '#e8b820', '#f4cc3a'), (x, y) => 0.45 + t.fbm(x * 2, y * 2) * 0.2 + t.rnd() * 0.1, 0.5);
  for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) { t.set(x, y, hex('#5a4a20')); }
  for (let k = 0; k < 6; k++) t.set(Math.floor(t.rnd() * T), Math.floor(t.rnd() * T), hex('#3a3020'));
  for (let x = 0; x < T; x++) t.set(x, 15, hex('#2a2a2a'));
};
P.barrera = (t) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) t.set(x, y, hex(Math.floor((x + y) / 4) % 2 ? '#e8e8e4' : '#c82020')); };

// ---- v2.16: estadios y tren ----
P.varilla = (t) => {
  t.clear();
  for (const x of [3, 8, 12]) for (let y = 0; y < T; y++) t.set(x, y, hex(y % 3 === 0 ? '#5a2a14' : '#7a3c1c'));
};
P.andamio = (t) => {
  t.clear();
  const C = hex('#8a8a90'), D = hex('#5a5a60');
  for (let i = 0; i < T; i++) { t.set(0, i, C); t.set(15, i, C); t.set(i, 0, C); t.set(i, 15, C); t.set(i, i, D); t.set(1, i, D); t.set(i, 1, D); }
};
P.rieles = (t) => {
  t.paint(R('#5a4a3a', '#6a5844', '#7a6650'), () => 0.4 + t.rnd() * 0.3, 0.5);
  for (let y = 0; y < T; y += 4) for (let x = 0; x < T; x++) { t.set(x, y, hex('#4a3222')); t.set(x, y + 1, hex('#5a3c28')); }
  for (let y = 0; y < T; y++) for (const x of [3, 12]) { t.set(x, y, hex('#9a9aa2')); t.set(x + 1, y, hex('#6a6a72')); }
};
P.metal_rojo = (t) => {
  t.paint(R('#7a1a14', '#981e18', '#b4281e', '#c83a2a'), (x, y) => 0.45 + t.fbm(x * 2, y * 2) * 0.2 + t.rnd() * 0.08, 0.5);
  for (let i = 0; i < T; i++) { t.set(i, 0, hex('#5a1410')); t.set(0, i, hex('#5a1410')); }
  for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13], [8, 2], [8, 13]]) t.set(x, y, hex('#e0a090'));
};
P.lamina_metal = (t) => {
  t.paint(R('#4a5a5a', '#5a6c6c', '#6c7e7e', '#829494'), (x, y) => 0.45 + t.fbm(x * 2, y * 2) * 0.2 + t.rnd() * 0.08, 0.5);
  for (let i = 0; i < T; i++) { t.set(i, 0, hex('#34403f')); t.set(0, i, hex('#34403f')); t.set(i, 8, hex('#3e4a4a')); }
  for (const [x, y] of [[2, 2], [13, 2], [2, 10], [13, 10]]) t.set(x, y, hex('#b0c0c0'));
};
P.cesped = (t) => {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const v = (y < 8 ? 0.55 : 0.35) + t.rnd() * 0.25;
    t.set(x, y, t.pick(R('#2e6a1e', '#3a7e26', '#4a922e', '#5aa438'), v, x, y, 0.5));
  }
};

// ---- v2.18: refinería ----
P.oxido = (t) => {
  t.paint(R('#4a2a18', '#6a3a1e', '#8a4a22', '#a85a28', '#c07038'), (x, y) => 0.4 + t.fbm(x * 2.5, y * 2.5) * 0.5 + t.rnd() * 0.1, 0.7);
  for (let k = 0; k < 8; k++) t.set(Math.floor(t.rnd() * T), Math.floor(t.rnd() * T), hex('#5a6060'));
};
P.tuberia = (t) => {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) t.set(x, y, t.pick(R('#7a8088', '#9aa0a8', '#b8bec4', '#d0d4d8'), 0.3 + Math.sin((y / 15) * Math.PI) * 0.6 + t.rnd() * 0.06, x, y, 0.4));
  for (let y = 0; y < T; y++) { t.set(3, y, hex('#6a7078')); t.set(12, y, hex('#6a7078')); }
};
P.tuberia_end = (t) => { t.paint(R('#7a8088', '#9aa0a8', '#b8bec4'), (x, y) => (Math.hypot(x - 7.5, y - 7.5) < 3 ? 0.1 : 0.6) + t.rnd() * 0.1, 0.4); };

// ---- v2.20: campo ----
P.cafe_secado = (t) => {
  t.paint(R('#7a7a76', '#8a8a86', '#9a9a96'), () => 0.5 + t.rnd() * 0.2, 0.4);
  for (let k = 0; k < 70; k++) { const x = Math.floor(t.rnd() * T), y = Math.floor(t.rnd() * T); t.set(x, y, hex(['#6a3a1c', '#8a4a24', '#a85a2a', '#b83a20', '#5a3018'][k % 5])); }
};
P.saco_cafe = (t) => {
  t.paint(R('#8a7048', '#a08458', '#b49a6a', '#c8ae7c'), (x, y) => 0.4 + ((x + y) % 2) * 0.15 + t.rnd() * 0.15, 0.4);
  for (let x = 3; x <= 12; x++) for (const y of [6, 9]) t.set(x, y, hex('#2a5a2a'));
  for (let y = 5; y <= 10; y++) { t.set(3, y, hex('#2a5a2a')); t.set(12, y, hex('#2a5a2a')); }
  t.set(7, 7, hex('#c82020')); t.set(8, 8, hex('#c82020'));
};
P.saco_top = (t) => { t.paint(R('#8a7048', '#a08458', '#b49a6a'), (x, y) => 0.4 + ((x * y) % 3) * 0.1 + t.rnd() * 0.15, 0.4); };

// ---- v2.23: cofre, horno y mesa con más detalle ----
const COFRE = R('#4a2c12', '#5e3a1a', '#744a22', '#8a5a2c', '#a06c36', '#b47e42');
// tablones horizontales con veta, nudos y juntas oscuras
P.cofre_madera = (t) => {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const board = Math.floor(y / 5.34), by = y - board * 5.34;
    const grain = Math.sin(x * 0.55 + board * 2 + Math.sin(y * 1.7) * 0.6) * 0.18;
    const v = 0.5 + grain + t.noise(x * 0.25, y * 2, 8) * 0.2 + (by < 1 ? 0.2 : 0) + (by > 4.3 ? -0.35 : 0) + t.rnd() * 0.06;
    t.set(x, y, t.pick(COFRE, v, x, y, 0.4));
  }
  for (let b = 0; b < 3; b++) { const kx = 2 + Math.floor(t.rnd() * 12), ky = Math.floor(b * 5.34) + 2; t.set(kx, ky, COFRE[0]); t.set(kx + 1, ky, COFRE[1]); }
};
P.cofre_tapa = (t) => {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const board = Math.floor(x / 4), bx = x - board * 4;
    const v = 0.55 + Math.sin(y * 0.6 + board * 1.3) * 0.12 + (bx === 0 ? -0.35 : bx === 1 ? 0.15 : 0) + t.rnd() * 0.06 + t.noise(x * 2, y * 0.3, 8) * 0.15;
    t.set(x, y, t.pick(COFRE, v, x, y, 0.4));
  }
};
P.cofre_forro = (t) => {
  t.paint(R('#4a0a14', '#5e0e1a', '#741422', '#8a1c2a', '#9c2634'), (x, y) => 0.45 + ((x + y) % 2) * 0.12 + t.noise(x, y, 4) * 0.25 + t.rnd() * 0.08, 0.6);
  for (let k = 0; k < 6; k++) t.set(Math.floor(t.rnd() * T), Math.floor(t.rnd() * T), hex('#b8404a'));
};
P.hierro_cofre = (t) => {
  t.paint(R('#24252a', '#34363c', '#46494f', '#5e6268'), (x, y) => 0.45 + t.fbm(x * 2, y * 2) * 0.3 + t.rnd() * 0.1, 0.5);
  for (const [x, y] of [[3, 3], [12, 3], [3, 12], [12, 12], [7, 7]]) { t.set(x, y, hex('#9aa0a8')); t.set(x + 1, y + 1, hex('#18181c')); }
};
P.oro_cofre = (t) => {
  t.paint(R('#8a6410', '#b88a1c', '#dcb032', '#f4d464', '#fff0a8'), (x, y) => 0.4 + (1 - y / 16) * 0.35 + t.rnd() * 0.12, 0.5);
  for (let i = 0; i < T; i++) { t.set(i, 0, hex('#6a4a0a')); t.set(0, i, hex('#6a4a0a')); t.set(i, 15, hex('#5a3a08')); t.set(15, i, hex('#5a3a08')); }
};
P.puerta_horno = (t) => {
  t.paint(R('#1c1c20', '#2a2a30', '#3a3a42', '#4a4a54'), (x, y) => 0.4 + t.fbm(x * 2, y * 2) * 0.3 + t.rnd() * 0.08, 0.5);
  for (let i = 0; i < T; i++) { t.set(i, 0, hex('#5a5a64')); t.set(0, i, hex('#5a5a64')); t.set(i, 15, hex('#101014')); t.set(15, i, hex('#101014')); }
  for (let x = 3; x < 13; x += 2) for (let y = 4; y < 8; y++) t.set(x, y, hex('#0a0a0c'));
  for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) t.set(x, y, hex('#8a8a94'));
  for (let y = 10; y < 13; y++) t.set(12, y, hex('#9a9aa4'));
};

// ---- cama de verdad (la textura vieja del costado era transparente y salía negra) ----
const MANTA = R('#6a1414', '#8a1c1c', '#a82626', '#c43a30', '#d8584a');
P.cama_manta = (t) => {
  // cobija acolchada: cuadros cosidos con un rombo en el centro
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const cx = x % 8, cy = y % 8;
    const seam = cx === 0 || cy === 0;
    const puff = 1 - (Math.abs(cx - 3.5) + Math.abs(cy - 3.5)) / 7;
    t.set(x, y, t.pick(MANTA, seam ? 0.1 : 0.35 + puff * 0.5 + t.rnd() * 0.08, x, y, 0.4));
  }
  for (const [x, y] of [[4, 4], [12, 4], [4, 12], [12, 12]]) t.set(x, y, hex('#f0d060'));
};
P.cama_almohada = (t) => {
  t.paint(R('#c8c2b6', '#dcd6cc', '#ece8e0', '#fbf9f4'), (x, y) => 0.55 + Math.sin((x / 15) * Math.PI) * Math.sin((y / 15) * Math.PI) * 0.4 + t.rnd() * 0.06, 0.5);
  for (let i = 0; i < T; i++) { t.set(i, 0, hex('#b8b2a6')); t.set(i, 15, hex('#b8b2a6')); }
};
P.cama_sabana = (t) => { t.paint(R('#d8d4cc', '#e8e4dc', '#f4f2ec'), (x, y) => 0.5 + t.noise(x, y, 4) * 0.3 + t.rnd() * 0.06, 0.5); };
P.cama_lado = (t) => {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    if (y < 7) t.set(x, y, t.pick(MANTA, 0.45 + t.rnd() * 0.15 - (y === 6 ? 0.3 : 0), x, y, 0.4));
    else if (y < 9) t.set(x, y, hex(y === 7 ? '#ece8e0' : '#d8d4cc'));
    else t.set(x, y, t.pick(PAL.plank, 0.4 + t.rnd() * 0.3 - (y === 15 ? 0.25 : 0) - (y === 9 ? 0.3 : 0), x, y));
  }
};

P.lodo = (t) => {
  t.paint(R('#3a3028', '#4a3e34', '#5a4c40', '#6e6050', '#86786a'), (x, y) => 0.4 + t.fbm(x * 1.5, y * 1.5) * 0.4 + t.rnd() * 0.06, 0.6);
  for (let k = 0; k < 5; k++) { const x = 2 + Math.floor(t.rnd() * 12), y = 2 + Math.floor(t.rnd() * 12); t.set(x, y, hex('#a89a8a')); t.set(x + 1, y, hex('#2a221c')); t.set(x, y + 1, hex('#2a221c')); }
};

P.agua_celeste = (t) => {
  const C = R('#3aa8d8', '#5ac0e8', '#7ad4f0', '#9ee4f6', '#c8f2fc', '#eafcff');
  t.paint(C, (x, y) => 0.45 + Math.sin(x * 0.7 + y * 0.3 + t.noise(x, y, 4) * 4) * 0.18 + t.fbm(x, y) * 0.2, 0.7);
  for (let i = 0; i < 4; i++) { const x = Math.floor(t.rnd() * T), y = Math.floor(t.rnd() * T); for (let k = 0; k < 3; k++) t.set(x + k, y, C[5]); }
};

// ---- v2.27: boñiga y hongos ----
const BON = R('#2e2010', '#3e2c16', '#4e381e', '#5e4628', '#6e5432');
// v2.49: portón de reglas con su travesaño en diagonal
P.porton = (t) => {
  t.paint(PAL.plank, (x) => 0.45 + (x % 4 === 0 ? -0.25 : 0) + t.rnd() * 0.2, 0.4);
  for (let x = 0; x < 16; x++) { t.set(x, 2, PAL.plank[0]); t.set(x, 3, PAL.plank[0]); t.set(x, 12, PAL.plank[0]); t.set(x, 13, PAL.plank[0]); }
  for (let k = 0; k < 16; k++) { t.set(k, Math.round(3 + k * 9 / 15), PAL.plank[0]); }
  t.set(13, 7, hex('#3a3a40')); t.set(14, 7, hex('#3a3a40')); t.set(13, 8, hex('#6a6a70'));
};
// cortina de tela floreada (rojo con florcitas blancas y amarillas) con pliegues
P.cortina = (t) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const fold = Math.sin(x * 1.6) * 0.18;
    t.set(x, y, t.pick(R('#7a1418', '#a01c22', '#c42a30', '#d84048'), 0.5 + fold + t.rnd() * 0.1, x, y));
  }
  for (let k = 0; k < 7; k++) { const x = (k * 5 + 2) % 15, y = (k * 7 + 3) % 14 + 1; t.set(x, y, hex('#f4ecd8')); t.set(x + 1, y, hex('#f0c040')); }
  for (let x = 0; x < 16; x++) t.set(x, 0, hex('#c8a040'));
};
// v11.10.7: el chanchito de barro, pintado a mano (barro rojizo, banda crema con triangulitos y puntos)
const BARRO = R('#9a4426', '#ab5030', '#bc5e38', '#c86c42', '#d27c50');
const pintaBarro = (t) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) t.set(x, y, t.pick(BARRO, 0.35 + t.noise(x, y, 3) * 0.35 + t.rnd() * 0.15, x, y)); };
// la banda (v11.11.3, como la hoja): crema con triangulitos café que se sientan abajo y cuadritos amarillos entre ellos
const bandaChanchito = (t, y0) => {
  for (let x = 0; x < 16; x++) for (let y = y0; y < y0 + 4; y++) t.set(x, y, hex(y === y0 || y === y0 + 3 ? '#e2c890' : '#f2dcae'));
  for (let s = 0; s < 16; s += 5) { for (let x = s; x < s + 3 && x < 16; x++) t.set(x, y0 + 2, hex('#4a2414')); if (s + 1 < 16) t.set(s + 1, y0 + 1, hex('#4a2414')); if (s + 3 < 16) { t.set(s + 3, y0 + 1, hex('#f0b830')); t.set(s + 3, y0 + 2, hex('#f0b830')); } }
};
P.chanchito_lado = (t) => { pintaBarro(t); bandaChanchito(t, 7); for (let x = 0; x < 16; x++) t.set(x, 15, t.pick(R('#7e3a20', '#8a4226'), 0.5, x, 15)); };
P.chanchito_lomo = (t) => {
  pintaBarro(t);
  for (let x = 5; x < 11; x++) { t.set(x, 7, hex('#2a140c')); t.set(x, 8, hex('#3a1c10')); } // la ranura de las monedas
  for (let x = 4; x < 12; x++) t.set(x, 9, hex('#e09060'));
  for (let x = 0; x < 16; x++) { t.set(x, 0, hex('#f2dcae')); t.set(x, 15, hex('#f2dcae')); } // la banda se asoma por los lados
};
P.chanchito_cara = (t) => {
  pintaBarro(t);
  for (const x of [4, 11]) { t.set(x, 4, hex('#1a0c06')); t.set(x, 5, hex('#1a0c06')); }
  bandaChanchito(t, 8);
};
P.chanchito_hocico = (t) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) t.set(x, y, t.pick(R('#d07058', '#dc8068', '#e89078'), 0.4 + t.rnd() * 0.3, x, y));
  for (const x of [4, 5, 10, 11]) for (const y of [6, 7, 8, 9]) t.set(x, y, hex('#5a1c10'));
};
// maceta de barro con su mata de flores (las cajas toman su pedazo de la textura según la altura)
P.maceta_side = (t) => {
  t.clear();
  for (let y = 3; y < 6; y++) for (let x = 0; x < 16; x++) t.set(x, y, t.pick(R('#b81c3a', '#e0305a', '#f8608a'), 0.5 + t.rnd() * 0.3, x, y));
  for (let y = 6; y < 10; y++) for (let x = 0; x < 16; x++) t.set(x, y, t.pick(R('#2e6a1c', '#3e8a26', '#52a234'), 0.5 + t.rnd() * 0.3, x, y));
  for (let y = 10; y < 16; y++) for (let x = 0; x < 16; x++) t.set(x, y, t.pick(R('#7a3a1c', '#9a4a24', '#b85c2e', '#c86a36'), y === 10 ? 0.9 : 0.4 + t.rnd() * 0.3, x, y));
};
P.maceta_top = (t) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const c = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
    t.set(x, y, c < 2.6 ? t.pick(R('#e0305a', '#f8608a', '#ffd040'), t.rnd(), x, y) : c < 6 ? t.pick(R('#4a2e1a', '#5a3a22'), t.rnd(), x, y) : t.pick(R('#9a4a24', '#b85c2e'), 0.6, x, y));
  }
};
// palanca: base de piedra y el palo de madera con el puño rojo
P.palanca = (t) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) t.set(x, y, y >= 14 ? t.pick(PAL.stone || R('#6a6a6a', '#7e7e7e', '#929292'), 0.3 + t.rnd() * 0.5, x, y) : y < 9 ? hex('#c82020') : t.pick(PAL.plank, 0.4 + t.rnd() * 0.3, x, y));
};
// v2.60: fogata (leños cruzados con brasas y llamas)
// v3.8: piñal (roseta de hojas con puntas y, al final, la piña)
function pinaPlant(stage) {
  return (t) => {
    t.clear();
    const H = [4, 7, 10, 11][stage], G = R('#3f7a3a', '#5a9a48', '#7ab85a', '#9ac070');
    for (let k = 0; k < 9; k++) {
      const a = -Math.PI / 2 + (k - 4) * 0.33, len = H * (0.7 + t.rnd() * 0.3);
      for (let s = 0; s < len; s++) t.setClip(Math.round(7.5 + Math.cos(a) * s * 0.9), 15 - Math.round(-Math.sin(a) * s), G[(k + s) % 4]);
    }
    if (stage >= 2) {
      const y0 = stage === 3 ? 5 : 8, h = stage === 3 ? 7 : 4, F = stage === 3 ? R('#c88a20', '#e8b030', '#f8d050') : R('#6a9a40', '#8ab050');
      for (let y = y0; y < y0 + h; y++) for (let x = 6; x < 10; x++) t.setClip(x, y, F[(x + y) % F.length]);
      for (let x = 5; x < 11; x += 2) t.setClip(x, y0 - 1, hex('#5a9a48'));
      t.setClip(7, y0 - 2, hex('#7ab85a')); t.setClip(8, y0 - 3, hex('#7ab85a'));
    }
  };
}
for (let s = 0; s < 4; s++) P[`pina${s}`] = pinaPlant(s);
// v3.64: vivir del monte
P.trampa = (t) => {
  // el arco doblado, el lazo y la estaca
  for (let i = 0; i < 12; i++) { const y = 15 - i, x = 3 + Math.round(Math.sin((i / 11) * Math.PI) * 4 + i * 0.5); t.setClip(x, y, hex(i % 3 ? '#7a5a34' : '#5a4226')); }
  for (let y = 9; y < 16; y++) t.setClip(12, y, hex('#6a4c2c'));
  for (let a = 0; a < 16; a++) t.setClip(Math.round(8 + Math.cos((a / 16) * 6.28) * 3), Math.round(11 + Math.sin((a / 16) * 6.28) * 2), hex('#c8b080'));
  t.setClip(9, 5, hex('#c8b080')); t.setClip(9, 6, hex('#c8b080')); t.setClip(9, 7, hex('#c8b080')); t.setClip(9, 8, hex('#c8b080'));
};
P.nasa = (t) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const trama = (x + y) % 4 === 0 || (x - y + 32) % 4 === 0; t.set(x, y, hex(trama ? '#9a7c48' : ((x * 3 + y * 5) % 7 ? '#3a2c1a' : '#2c2214'))); } };
P.barril = (t) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const aro = y === 3 || y === 12; const tabla = x % 4 === 0; t.set(x, y, hex(aro ? '#54565c' : tabla ? '#5a3f22' : ((x * 7 + y * 3) % 9 ? '#8a6438' : '#7a5630'))); } };
P.barril_top = (t) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const d = Math.hypot(x - 7.5, y - 7.5); t.set(x, y, hex(d > 7 ? '#54565c' : d > 6 ? '#6a4a28' : ((x + y) % 5 ? '#3a6a9a' : '#4a7aaa'))); } };
P.estacas = (t) => { for (const [x, alto] of [[2, 9], [6, 13], [9, 8], [13, 11]]) for (let i = 0; i < alto; i++) { const y = 15 - i; t.setClip(x, y, hex(i > alto - 3 ? '#c8b888' : '#7a5a34')); if (i < alto - 3) t.setClip(x + 1, y, hex('#5a4226')); } };
// v3.80: trofeos de los jefes
const pintaTrofeo = (t, cuerpo, ojo) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) t.set(x, y, hex(y > 11 ? ((x + y) % 4 ? '#8a6438' : '#6a4c2a') : y < 3 ? '#e8c050' : (y === 5 && (x === 5 || x === 10)) ? ojo : (x * 3 + y * 5) % 7 === 0 ? '#000000' : cuerpo)); };
P.trofeo_rey_murcielago = (t) => pintaTrofeo(t, '#4a3a5a', '#c83a3a');
P.trofeo_senor_arenal = (t) => pintaTrofeo(t, '#6a2a14', '#ff9a30');
P.trofeo_arpia = (t) => pintaTrofeo(t, '#4a4e5c', '#e8e8f0');
P.trofeo_sombra_madre = (t) => pintaTrofeo(t, '#1a0e2a', '#b060e0');
const platoBase = (t) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const d = Math.hypot(x - 7.5, y - 7.5); t.set(x, y, hex(d > 7.2 ? '#b8b8b0' : d > 6 ? '#f0efe6' : d > 5.2 ? '#d8d8cc' : '#ecebe0')); } };
P.plato_vacio = (t) => { platoBase(t); for (const [x, y] of [[6, 6], [8, 9], [9, 6], [5, 9]]) t.set(x, y, hex('#b08a50')); };
P.plato_servido = (t) => { platoBase(t); for (let y = 3; y < 13; y++) for (let x = 3; x < 13; x++) { if (Math.hypot(x - 7.5, y - 7.5) > 4.8) continue; const n = (x * 7 + y * 13) % 5; t.set(x, y, hex(n === 0 ? '#3a2418' : n === 1 ? '#4a2c1c' : n === 2 ? '#f0ead0' : n === 3 ? '#e4dcc0' : '#6a9a40')); } };
P.plato_lado = (t) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) t.set(x, y, hex(y % 4 === 0 ? '#9a9a92' : '#d8d8cc')); };
P.olla_lado = (t) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) t.set(x, y, hex(y < 2 ? '#5a5a60' : (x * 3 + y * 5) % 11 === 0 ? '#2a2a2e' : y > 12 ? '#232327' : '#38383e')); };
P.olla_top = (t) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const d = Math.hypot(x - 7.5, y - 7.5); t.set(x, y, hex(d > 6.5 ? '#5a5a60' : (x * 7 + y * 3) % 7 === 0 ? '#e8f0f4' : (x + y) % 5 === 0 ? '#b8d0dc' : '#6a90a4')); } };
P.alambre = (t) => { for (const y of [6, 11]) for (let x = 0; x < T; x++) { t.setClip(x, y + (x % 6 === 0 ? 1 : 0), hex('#6a6a72')); if (x % 5 === 2) { t.setClip(x, y - 1, hex('#8a8a92')); t.setClip(x, y + 1, hex('#4a4a52')); } } for (const x of [3, 12]) for (let y = 3; y < T; y++) t.setClip(x, y, hex('#7a5a34')); };
P.trofeo_olvido = (t) => pintaTrofeo(t, '#0e0a14', '#e04a4a');
P.trofeo_mono_congo_gigante = (t) => pintaTrofeo(t, '#2a1c12', '#e0b040');
P.trofeo_cadejos = (t) => pintaTrofeo(t, '#14141a', '#e03020');
P.trofeo_toro_guaco = (t) => pintaTrofeo(t, '#141416', '#ff5a10');
P.trofeo_cuche_monte = (t) => pintaTrofeo(t, '#3a3430', '#ff2a10');
P.trofeo_chupacabras = (t) => pintaTrofeo(t, '#55605a', '#ff2a18');
P.trofeo_becquer = (t) => pintaTrofeo(t, '#6a5634', '#e0b020');
P.trofeo_padre = (t) => pintaTrofeo(t, '#1a1a1e', '#a01410');
P.trofeo_puma = (t) => pintaTrofeo(t, '#a8835a', '#c8b030');
P.trofeo_bailarin = (t) => pintaTrofeo(t, '#16161c', '#ff3010');
P.trofeo_rey_zopilote = (t) => pintaTrofeo(t, '#e8702a', '#7a3a8a');
P.trofeo_reina = (t) => pintaTrofeo(t, '#3a2414', '#ff3020');
P.trofeo_cornudo = (t) => pintaTrofeo(t, '#8a8a3a', '#141010');
P.trofeo_tata = (t) => pintaTrofeo(t, '#5a5228', '#e0a020');
P.trofeo_cascabel = (t) => pintaTrofeo(t, '#8a6a3a', '#e0b020');
P.trofeo_cangrejo = (t) => pintaTrofeo(t, '#c8481a', '#0a0a0a');
P.trofeo_ciempies = (t) => pintaTrofeo(t, '#7a140c', '#ffa020');
// la ermita de camino: cemento blanco con ribete celeste, una ventanita con la candela prendida y el techito gris
P.ermita = (t) => {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    let c = (x * 7 + y * 3) % 11 === 0 ? '#dcdcd4' : '#efefe8';
    if (y >= 13) c = (x + y) % 3 ? '#9a9a94' : '#8a8a84'; // la base
    if (y <= 2) c = (x + y) % 3 ? '#7a7a80' : '#6a6a70'; // el techo
    if (y === 3 || y === 12) c = '#5aa0d8'; // el ribete celeste
    if (x >= 6 && x <= 9 && y >= 5 && y <= 10) c = y === 5 || x === 6 || x === 9 ? '#3a2a1a' : '#2a1a10'; // la ventanita
    if (x >= 7 && x <= 8 && y >= 8 && y <= 9) c = '#ffd860'; // la candela
    if (x === 7 && y === 7) c = '#ff9a30';
    t.set(x, y, hex(c));
  }
};
P.ermita_top = (t) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) t.set(x, y, hex((x === 7 || x === 8) && y > 3 && y < 12 ? '#e8e8e0' : (y === 6 || y === 7) && x > 4 && x < 11 ? '#e8e8e0' : (x + y) % 3 ? '#7a7a80' : '#6a6a70')); };
// v4.69: el pararrayos (hierro con la punta de oro)
P.pararrayos = (t) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) t.set(x, y, hex(y < 3 ? (x % 3 === 0 ? '#fff0a0' : '#e8c040') : y === 3 ? '#a88a2a' : x % 4 === 0 ? '#5a5a62' : (x + y) % 7 === 0 ? '#9a9aa4' : '#7a7a84')); };
// v3.75: puntal y el Corazón
P.puntal = (t) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) t.set(x, y, hex((x * 3 + y) % 9 === 0 ? '#5a3f22' : x % 5 === 0 ? '#6a4c2a' : '#8a6438')); };
P.corazon_tiquicia = (t) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const veta = Math.abs(Math.sin(x * 0.7) * 3 + 7 - y) < 0.8 || Math.abs(Math.cos(y * 0.8) * 3 + 8 - x) < 0.7; t.set(x, y, hex(veta ? '#ff7a4a' : (x * 5 + y * 3) % 7 === 0 ? '#6a6a64' : '#8a8a82')); } };
// v3.70: yunque y compostera
P.yunque = (t) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) t.set(x, y, hex(y < 2 ? '#8a8e96' : (x * 5 + y * 3) % 11 === 0 ? '#4a4c52' : y > 12 ? '#2a2c30' : '#3a3c42')); };
P.compostera = (t) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const hueco = y % 5 === 4; t.set(x, y, hex(hueco ? '#2a3a18' : x % 8 === 0 ? '#5a3f22' : (x * 3 + y * 7) % 9 ? '#8a6438' : '#7a5630')); } };
P.compostera_top = (t) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const borde = x < 2 || y < 2 || x > 13 || y > 13; t.set(x, y, hex(borde ? '#7a5630' : (x * 7 + y * 5) % 6 === 0 ? '#6a8a2c' : (x * 3 + y * 11) % 5 === 0 ? '#2e2214' : '#463220')); } };
// v3.68: el nido de Sombra, enredado y negro, con vetas moradas que brillan
P.nido_sombra = (t) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const veta = Math.abs(Math.sin(x * 0.9 + y * 0.45) + Math.cos(y * 0.8 - x * 0.3)) < 0.22; const hilo = (x * 5 + y * 3) % 7 === 0; t.set(x, y, hex(veta ? '#7a3fae' : hilo ? '#2a1838' : (x * 3 + y * 7) % 5 ? '#120a1a' : '#1c1026')); } };
P.nido_raiz = (t) => { for (const [x0, alto, inc] of [[3, 7, 1], [8, 11, -1], [12, 6, -1]]) for (let i = 0; i < alto; i++) { const x = x0 + ((i >> 1) * inc), y = 15 - i; t.setClip(x, y, hex(i === alto - 1 ? '#7a3fae' : '#1c1026')); if (i < alto - 3) t.setClip(x + 1, y, hex('#120a1a')); } };
P.farol_zenaida = (t) => {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const frame = x < 2 || x > 13 || y < 2 || y > 13 || x === 7 || x === 8;
    if (frame) { t.set(x, y, t.pick(R('#1e1e22', '#2e2e34', '#3c3c44'), 0.3 + t.rnd() * 0.5, x, y)); continue; }
    const d = Math.hypot(x - 7.5, y - 9) / 7;
    t.set(x, y, t.pick(R('#3a6ad0', '#5a9cf0', '#a0d4ff', '#f0fbff'), 1 - d + t.rnd() * 0.1, x, y, 0.6));
  }
};
P.cencerro = (t) => {
  // un poste con su travesaño y el cencerro colgando
  for (let y = 2; y < 16; y++) { t.setClip(4, y, hex('#7a5a34')); t.setClip(5, y, hex('#5a4226')); }
  for (let x = 4; x < 13; x++) t.setClip(x, 2, hex('#7a5a34'));
  t.setClip(10, 3, hex('#c8b080')); t.setClip(10, 4, hex('#c8b080'));
  for (let y = 5; y < 11; y++) for (let x = 8 - ((y - 5) >> 1); x <= 12 + ((y - 5) >> 1); x++) t.setClip(x, y, hex(x < 10 ? '#c89a3a' : '#9a7228'));
  t.setClip(10, 11, hex('#3a2c1a'));
};
// v3.7: meteorito
P.meteorito = (t) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) t.set(x, y, hex(((x * 7 + y * 11) % 9) ? '#2a2630' : '#3a3442')); for (let k = 0; k < 14; k++) t.set(Math.floor(t.rnd() * T), Math.floor(t.rnd() * T), hex(['#ff8a30', '#ffd060', '#9ad0ff'][k % 3])); };
// v2.92: red de pesca
P.red_pesca = (t) => { t.clear(); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if (x % 4 === 0 || y % 4 === 0) t.set(x, y, hex('#d8d0b0')); for (const [x, y] of [[0, 0], [8, 0], [15, 0], [0, 8], [15, 8], [0, 15], [8, 15], [15, 15]]) { t.set(x, y, hex('#e85a2a')); } };
// v2.90: cristales de las cuevas
P.cristal = (t) => {
  t.clear();
  const C = ['#b85ae8', '#d48af4', '#f0c8ff', '#8a3ac8'];
  for (const [cx, w, h] of [[4, 2, 10], [8, 3, 14], [12, 2, 8], [6, 2, 6], [10, 2, 11]]) for (let y = 15; y > 15 - h; y--) for (let x = cx - Math.floor(w / 2); x <= cx + Math.floor(w / 2); x++) { const top = y < 15 - h + 3; t.set(x, y, hex(top ? C[2] : x === cx ? C[1] : C[(x + y) % 2 === 0 ? 0 : 3])); }
};
P.cristal_bloque = (t) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const d = (x + y) % 6; t.set(x, y, hex(d === 0 ? '#f0c8ff' : d < 3 ? '#c87af0' : '#9a4ad8')); } for (let k = 0; k < 8; k++) t.set(Math.floor(t.rnd() * T), Math.floor(t.rnd() * T), hex('#ffffff')); };
// v2.83: tronco quemado y ceniza
P.tronco_quemado = (t) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) t.set(x, y, hex((x % 4 === 0) ? '#0e0c0a' : ((x + y * 3) % 7) ? '#1e1a16' : '#2e2620')); for (let k = 0; k < 6; k++) t.set(Math.floor(t.rnd() * T), Math.floor(t.rnd() * T), hex('#c83a10')); };
P.tronco_quemado_top = (t) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const d = Math.hypot(x - 7.5, y - 7.5); t.set(x, y, hex(d > 7 ? '#0e0c0a' : (Math.floor(d) % 2) ? '#2a2420' : '#1a1612')); } };
P.ceniza = (t) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) t.set(x, y, hex(((x * 7 + y * 13) % 5) ? '#8a8682' : '#76726e')); };
// v2.80: primer bloque extendido
P.baldosa_roja = (t) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) t.set(x, y, hex(x % 8 === 0 || y % 8 === 0 ? '#7a3a22' : ((x * 3 + y * 5) % 11) ? '#b8553a' : '#a44a30')); };
// v2.75: repello de colores, azulejo, mosaico y reja
const repello = (cols) => (t) => {
  t.paint(R(...cols), (x, y) => 0.55 + t.fbm(x * 1.5, y * 1.5) * 0.35 + t.rnd() * 0.08, 0.5);
  for (let x = 0; x < T; x++) if (t.rnd() < 0.45) t.set(x, 15, hex(cols[0]));
};
P.repello_celeste = repello(['#7ab4d0', '#8cc4de', '#9ed0e8', '#b4def0']);
P.repello_amarillo = repello(['#d8b440', '#e6c454', '#f0d268', '#f6de84']);
P.repello_verde = repello(['#78b89a', '#8ac8aa', '#9cd4b8', '#b4e2cc']);
P.azulejo = (t) => {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const junta = x % 8 === 0 || y % 8 === 0;
    const cx = (x % 8) - 4, cy = (y % 8) - 4, flor = Math.abs(cx) + Math.abs(cy) < 3 || (Math.abs(cx) === Math.abs(cy) && Math.abs(cx) < 4);
    t.set(x, y, hex(junta ? '#c8c4bc' : flor ? '#2a5aa8' : ((x + y) % 7 ? '#f4f2ee' : '#e8e6e0')));
  }
};
P.mosaico = (t) => {
  const C = ['#c83a2a', '#e8b030', '#2a7ac8', '#3a9a4a', '#f4f0e4', '#1a1a1a'];
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const cx = Math.abs(x - 7.5), cy = Math.abs(y - 7.5);
    const k = cx + cy < 3 ? 1 : cx + cy < 6 ? 0 : Math.max(cx, cy) > 6 ? 5 : (Math.floor(x / 4) + Math.floor(y / 4)) % 2 ? 2 : 3;
    t.set(x, y, hex(C[k]));
  }
};
P.reja = (t) => {
  t.clear();
  const F = hex('#2a2a2e'), L = hex('#4a4a52');
  for (let y = 0; y < T; y++) for (const x of [1, 5, 10, 14]) { t.set(x, y, F); t.set(x + 1, y, L); }
  for (let x = 0; x < T; x++) { t.set(x, 0, F); t.set(x, 15, F); t.set(x, 7, F); }
  // volutas de hierro forjado
  for (const [x, y] of [[3, 3], [4, 4], [3, 5], [12, 3], [11, 4], [12, 5], [7, 10], [8, 11], [7, 12], [8, 9]]) t.set(x, y, L);
};
// v2.74: sitio arqueológico
P.esfera_piedra = (t) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 6, y - 5); t.set(x, y, hex(d < 4 ? '#b8b4a8' : d < 8 ? '#9a968a' : '#7e7a70')); } for (let k = 0; k < 10; k++) t.set(Math.floor(t.rnd() * 16), Math.floor(t.rnd() * 16), hex('#6a665e')); };
P.petroglifo = (t) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) t.set(x, y, hex(((x * 5 + y * 3) % 7) ? '#8a8478' : '#7a7468'));
  // espiral y figuritas talladas
  const L = '#4e4a42';
  for (const [x, y] of [[7, 7], [8, 7], [8, 8], [7, 8], [6, 8], [6, 7], [6, 6], [7, 6], [8, 6], [9, 6], [9, 7], [9, 8], [9, 9], [8, 9], [7, 9], [6, 9], [5, 9], [5, 8], [5, 7], [5, 6], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5]]) t.set(x, y, hex(L));
  for (const [x, y] of [[2, 2], [2, 3], [1, 3], [3, 3], [2, 4], [1, 5], [3, 5], [13, 11], [13, 12], [12, 12], [14, 12], [13, 13], [12, 14], [14, 14]]) t.set(x, y, hex(L));
};
P.pedestal_top = (t) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 7.5, y - 7.5); t.set(x, y, hex(d < 4 ? '#5a564e' : d < 5 ? '#c8a040' : '#8a8478')); } };
P.puerta_piedra = (t) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) t.set(x, y, hex((x === 0 || x === 15 || y === 0 || y === 15) ? '#5a564e' : ((x + y * 2) % 9) ? '#8a8478' : '#76726a')); for (let y = 4; y < 12; y++) { t.set(7, y, hex('#c8a040')); t.set(8, y, hex('#c8a040')); } };
// v2.72: muebles
P.mesa_comedor = (t) => { P.planks(t); for (let x = 0; x < 16; x++) { t.set(x, 0, hex('#5a3a1c')); t.set(x, 15, hex('#5a3a1c')); } for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((x + y) % 8 === 0 && x > 2 && x < 13 && y > 2 && y < 13) t.set(x, y, hex('#f4f0e4')); };
P.hamaca = (t) => { const C = ['#d83a3a', '#f0c030', '#3a8ad8', '#4ab04a', '#f4f0e4']; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) t.set(x, y, hex(C[Math.floor(x / 3) % 5])); for (let x = 0; x < 16; x += 2) { t.set(x, 0, hex('#f4f0e4')); t.set(x, 15, hex('#f4f0e4')); } };
P.tele_lado = (t) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) t.set(x, y, (x + y) % 5 ? hex('#6a4a2a') : hex('#5a3c20')); };
const pantalla = (t, on) => {
  P.tele_lado(t);
  for (let y = 2; y < 11; y++) for (let x = 2; x < 12; x++) t.set(x, y, on ? hex(['#8ac8ff', '#a8e0ff', '#ffe08a', '#90e090'][(Math.floor(x / 3) + Math.floor(y / 4)) % 4]) : hex((x + y) % 3 ? '#2a3036' : '#3a4048'));
  for (const y of [3, 6, 9]) { t.set(13, y, hex('#c8c8c0')); t.set(14, y, hex('#a8a8a0')); }
  for (let x = 2; x < 14; x++) t.set(x, 13, hex('#3a2a18'));
};
P.tele_apagada = (t) => pantalla(t, false);
P.tele_prendida = (t) => pantalla(t, true);
P.radio_lado = (t) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) t.set(x, y, (y % 4) ? hex('#a87a4a') : hex('#8a5e34')); };
P.radio_frente = (t) => { P.radio_lado(t); for (let y = 3; y < 13; y++) for (let x = 2; x < 9; x++) t.set(x, y, (x + y) % 2 ? hex('#3a2a1a') : hex('#5a4228')); for (let x = 10; x < 14; x++) t.set(x, 5, hex('#e8d8a0')); t.set(11, 9, hex('#c82a2a')); t.set(13, 9, hex('#202020')); t.set(11, 11, hex('#202020')); t.set(13, 11, hex('#202020')); };
P.refri = (t) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) t.set(x, y, (x === 0 || x === 15 || y === 0 || y === 15) ? hex('#b8bcc0') : hex(((x * 7 + y * 3) % 11) ? '#eef0f2' : '#e2e6ea')); };
P.refri_frente = (t) => { P.refri(t); for (let x = 1; x < 15; x++) t.set(x, 5, hex('#b8bcc0')); for (let y = 2; y < 4; y++) t.set(12, y, hex('#9aa0a6')); for (let y = 7; y < 12; y++) t.set(12, y, hex('#9aa0a6')); t.set(4, 9, hex('#d83a3a')); t.set(5, 9, hex('#f0c030')); };
// v2.67: rótulo de la soda (tabla blanca con borde rojo, plato, tenedor y cuchara)
P.rotulo_soda = (t) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const borde = x < 1 || x > 14 || y < 1 || y > 14;
    t.set(x, y, borde ? hex('#6a4626') : (x < 2 || x > 13 || y < 2 || y > 13) ? hex('#c82a2a') : hex('#f4efe4'));
  }
  for (let y = 5; y < 11; y++) for (let x = 5; x < 11; x++) if ((x - 7.5) ** 2 + (y - 7.5) ** 2 < 9) t.set(x, y, hex('#e8a020'));
  for (let y = 4; y < 12; y++) { t.set(3, y, hex('#606068')); t.set(12, y, hex('#606068')); }
  t.set(2, 4, hex('#606068')); t.set(4, 4, hex('#606068')); t.set(12, 4, hex('#808088')); t.set(13, 5, hex('#808088'));
};
P.fogata = (t) => {
  t.clear();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (y >= 10) { t.set(x, y, (x + y) % 3 ? hex('#5a3a1c') : hex('#3a2410')); continue; }
    const d = Math.abs(x - 7.5) / 5 + (9 - y) / 9;
    if (d < 1) t.set(x, y, d < 0.45 ? hex('#fff2a0') : d < 0.7 ? hex('#ffb030') : hex('#e85010'));
  }
};
P.fogata_top = (t) => { t.paint(R('#3a2410', '#5a3a1c', '#6a4626'), () => 0.4 + t.rnd() * 0.4, 0.4); for (let y = 5; y < 11; y++) for (let x = 5; x < 11; x++) t.set(x, y, (x + y) % 2 ? hex('#ff8020') : hex('#ffd060')); };
// v12.1.0: la fogata en brasas (los leños con brasas, sin llama) y apagada (leños negros y ceniza)
P.fogata_brasas = (t) => {
  t.clear();
  for (let y = 10; y < 16; y++) for (let x = 0; x < 16; x++) t.set(x, y, (x + y) % 3 ? hex('#4a2e16') : hex('#2e1c0c'));
  for (let x = 4; x < 12; x++) for (let y = 7; y < 10; y++) if ((x + y) % 2) t.set(x, y, (x * 3 + y) % 4 ? hex('#c84010') : hex('#ff8a20'));
};
P.fogata_brasas_top = (t) => { t.paint(R('#3a2410', '#4a2e16', '#5a3a1c'), () => 0.4 + t.rnd() * 0.4, 0.4); for (let y = 5; y < 11; y++) for (let x = 5; x < 11; x++) t.set(x, y, (x + y) % 2 ? hex('#a83010') : hex('#ff7018')); };
P.fogata_apagada = (t) => {
  t.clear();
  for (let y = 11; y < 16; y++) for (let x = 0; x < 16; x++) t.set(x, y, (x + y) % 3 ? hex('#2a2420') : hex('#1a1612'));
  for (let x = 4; x < 12; x++) t.set(x, 10, (x % 3) ? hex('#8a8680') : hex('#6a6660'));
};
P.fogata_apagada_top = (t) => { t.paint(R('#2a2420', '#3a3430', '#4a4440'), () => 0.4 + t.rnd() * 0.4, 0.4); for (let y = 5; y < 11; y++) for (let x = 5; x < 11; x++) t.set(x, y, (x + y) % 2 ? hex('#8a8680') : hex('#b0aca6')); };
// v12.4.2: si hay textura de GPT (texturas_arte.js), manda ella; si no, el pixel art de abajo
const deArte = (t, k) => { const A = TEX_ARTE[k]; if (!A) return false; for (let i = 0; i < 256; i++) t.set(i % 16, Math.floor(i / 16), [(A[i] >> 16) & 255, (A[i] >> 8) & 255, A[i] & 255]); return true; };
// v12.4.0: la construcción tradicional
P.bahareque = (t) => {
  // con la textura de GPT, encima la caña asomando (a 16 px sus fibras finas se pierden)
  if (deArte(t, 'bahareque')) { for (let y = 0; y < 16; y += 4) for (let x = 0; x < 16; x++) if ((x + y) % 7 === 0) t.set(x, y + 1, hex('#d8b878')); return; }
  t.paint(R('#9a7a52', '#8a6a44', '#a88a5e'), () => 0.35 + t.rnd() * 0.4, 0.5);
  for (let y = 0; y < 16; y += 4) for (let x = 0; x < 16; x++) if ((x + y) % 7 === 0) t.set(x, y + 1, hex('#c8a86a')); // la caña asomando
  for (let i = 0; i < 10; i++) t.set(Math.floor(t.rnd() * 16), Math.floor(t.rnd() * 16), hex('#6e5434'));
};
P.bahareque_encalado = (t) => {
  if (deArte(t, 'bahareque_encalado')) return;
  t.paint(R('#efeae0', '#e6e0d4', '#f6f2ea'), () => 0.3 + t.rnd() * 0.3, 0.4);
  for (let i = 0; i < 6; i++) t.set(Math.floor(t.rnd() * 16), Math.floor(t.rnd() * 16), hex('#c8b89a')); // donde se cayó la cal
  for (let x = 0; x < 16; x++) t.set(x, 15, hex('#8a6a44')); // el zócalo de barro
};
P.techo_palma = (t) => {
  if (deArte(t, 'techo_palma')) return;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) t.set(x, y, hex((x * 3 + y * 5) % 7 < 3 ? '#b89a4a' : (x + y) % 5 ? '#a8883e' : '#8a6e30'));
  for (let x = 0; x < 16; x += 2) t.set(x, (x * 7) % 16, hex('#d8be6a'));
};
P.postigo = (t) => {
  if (deArte(t, 'postigo')) return;
  t.paint(R('#7a4e26', '#6a4220', '#86562c'), () => 0.3 + t.rnd() * 0.3, 0.4);
  for (let y = 1; y < 16; y += 3) for (let x = 1; x < 15; x++) t.set(x, y, hex('#5a3618')); // las tablillas
  for (let y = 0; y < 16; y++) { t.set(0, y, hex('#4a2c12')); t.set(15, y, hex('#4a2c12')); t.set(8, y, hex('#4a2c12')); }
};
P.horcon_lado = (t) => { if (!deArte(t, 'horcon_lado')) P.log_side(t); }; // v12.4.2: la corteza del horcón
P.mazorca_cacao = (t) => {
  t.clear();
  // mazorcas de cacao colgando: amarillas, naranjas y rojizas, con surcos
  const POD = [R('#7a3a10', '#a85a18', '#d08a20', '#e8b030'), R('#6a1c10', '#9a3018', '#c04a20', '#d8682a')];
  for (const [cx, cy, k] of [[5, 9, 0], [10, 7, 1], [8, 12, 0]]) {
    const P2 = POD[k];
    for (let y = -3; y <= 3; y++) for (let x = -2; x <= 2; x++) {
      if (x * x / 5 + y * y / 11 > 1) continue;
      t.setClip(cx + x, cy + y, P2[x === 0 ? 1 : Math.abs(x) === 2 ? 0 : y < 0 ? 3 : 2]);
    }
    t.setClip(cx, cy - 4, R('#4a6a1c')[0]);
  }
  for (let y = 0; y < 5; y++) t.setClip(8, y, PAL.plank[1]);
};
P.bonita_top = (t) => {
  t.paint(BON, (x, y) => 0.35 + Math.sin(Math.hypot(x - 7.5, y - 8) * 1.4) * 0.2 + t.rnd() * 0.15, 0.6);
  for (let k = 0; k < 5; k++) t.set(Math.floor(t.rnd() * T), Math.floor(t.rnd() * T), hex('#8a7a40'));
};
P.bonita_side = (t) => { t.paint(BON, (x, y) => 0.3 + (y % 3 === 0 ? 0.25 : 0) + t.rnd() * 0.15, 0.6); };
const CAP = R('#a8742a', '#c48c38', '#dca850', '#ecc470');
const CAPS = [[4.5, 4.5, 8.5, 8.5], [8.5, 8, 12.5, 12], [3, 10, 6, 13]];
P.bonita_hongos_top = (t) => {
  P.bonita_top(t);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    if (!CAPS.some(([x0, z0, x1, z1]) => x >= Math.floor(x0) && x < Math.ceil(x1) && y >= Math.floor(z0) && y < Math.ceil(z1))) continue;
    t.set(x, y, t.pick(CAP, 0.4 + t.rnd() * 0.4, x, y, 0.5));
    if (t.rnd() < 0.15) t.set(x, y, hex('#f4ecd8'));
  }
};
P.bonita_hongos_side = (t) => {
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    // filas: 0-8 aire de arriba, 8-10 sombreros, 10-13 tallos, 13-16 boñiga
    if (y >= 13) t.set(x, y, t.pick(BON, 0.3 + t.rnd() * 0.3, x, y, 0.5));
    else if (y >= 10) t.set(x, y, t.pick(R('#d8ccb0', '#e8dcc0', '#f4ead4'), 0.4 + t.rnd() * 0.3, x, y, 0.5));
    else t.set(x, y, t.pick(CAP, 0.35 + (y === 8 ? 0.3 : 0) + t.rnd() * 0.3, x, y, 0.5));
  }
};

export const PAINTERS = P;

// Grietas de rotura (10 etapas): ramas que crecen desde el centro.
export function crackStages(stages = 10) {
  const rnd = mulberry32(777);
  const branches = [];
  for (let b = 0; b < 7; b++) {
    const path = [];
    let x = 7 + Math.floor(rnd() * 2), y = 7 + Math.floor(rnd() * 2);
    const a = (b / 7) * Math.PI * 2 + rnd() * 0.6;
    const dx = Math.cos(a), dy = Math.sin(a);
    let fx = x, fy = y;
    for (let k = 0; k < 10; k++) {
      path.push([Math.round(fx), Math.round(fy)]);
      fx += dx + (rnd() - 0.5) * 0.8; fy += dy + (rnd() - 0.5) * 0.8;
      if (fx < 0 || fy < 0 || fx > 15 || fy > 15) break;
    }
    branches.push(path);
  }
  const out = [];
  for (let s = 0; s < stages; s++) {
    const t = new Tile('crack' + s);
    t.clear();
    const frac = (s + 1) / stages;
    for (const path of branches) {
      const len = Math.ceil(path.length * frac);
      for (let k = 0; k < len; k++) {
        const [x, y] = path[k];
        t.setClip(x, y, [18, 14, 12], 235);
        if (k % 3 === 1) t.setClip(x + 1, y, [40, 34, 30], 170);
      }
    }
    out.push(t);
  }
  return out;
}

// ---- v12.15.2 (C7 «Fuego de la tierra») ----
P.fumarola = (t) => {
  P.basalt(t);
  for (let k = 0; k < 9; k++) { const x = 3 + Math.floor(t.rnd() * 10), y = 3 + Math.floor(t.rnd() * 10); t.set(x, y, hex('#e8d450')); t.set(x + 1, y, hex('#b8a020')); }
  for (let k = 0; k < 6; k++) t.set(5 + Math.floor(t.rnd() * 6), 5 + Math.floor(t.rnd() * 6), hex('#d8d8d0'));
};
P.agua_termal = (t) => {
  const C = R('#2a8aa8', '#3aa6c0', '#58c0d4', '#80d4e0', '#b0e8ee', '#e4f8f8');
  t.paint(C, (x, y) => 0.4 + Math.sin(x * 0.7 + y * 0.4 + t.noise(x, y, 4) * 4) * 0.2 + t.fbm(x, y) * 0.2, 0.7);
  for (let i = 0; i < 6; i++) { const x = Math.floor(t.rnd() * T), y = Math.floor(t.rnd() * T); t.set(x, y, C[5]); t.set(x + 1, y, C[4]); }
};
P.cristal_azufre_bloque = (t) => {
  P.azufre_bloque(t);
  for (let k = 0; k < 7; k++) { const x = 1 + Math.floor(t.rnd() * 13), y = 2 + Math.floor(t.rnd() * 12); for (let j = 0; j < 3; j++) t.set(x, y - j, j === 0 ? hex('#fffbb0') : hex('#f4e040')); t.set(x + 1, y, hex('#a88a10')); }
};
P.veta_obsidiana = (t) => {
  P.basalt(t);
  for (let k = 0; k < 5; k++) { let x = 1 + Math.floor(t.rnd() * 13), y = 1 + Math.floor(t.rnd() * 13); for (let j = 0; j < 6; j++) { t.set(x, y, hex(j % 3 === 0 ? '#3a3a5a' : '#12101c')); x += t.rnd() < 0.5 ? 1 : 0; y += 1; if (x > 15 || y > 15) break; } }
};
P.pomez_bloque = (t) => { t.paint(R('#8a8680', '#a8a49c', '#c4c0b6', '#dedad0'), (x, y) => 0.4 + t.fbm(x * 2, y * 2) * 0.5 + t.rnd() * 0.15, 0.5); for (let k = 0; k < 14; k++) t.set(Math.floor(t.rnd() * T), Math.floor(t.rnd() * T), hex('#605c56')); };
