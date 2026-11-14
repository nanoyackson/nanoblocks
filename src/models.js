// Modelos de caja con piel pintada pixel por pixel (16 px por bloque) y mallas de ítems (mano y suelo).
import * as THREE from 'three';
import { mulberry32, hashString } from './noise.js';
import { BLOCKS, isBlockId } from './blocks.js';
import { atlasTexture, tileUV, itemCanvas, tileCanvas } from './textures.js';

const PX = 16;
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const pal = (...hs) => hs.map(hex);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16 - 0.5);

// Lienzo de una cara de caja.
export class Skin {
  constructor(w, h, seed) {
    this.w = Math.max(1, Math.round(w)); this.h = Math.max(1, Math.round(h));
    this.data = new Uint8ClampedArray(this.w * this.h * 4);
    this.rnd = mulberry32(hashString(seed));
    this.g = Array.from({ length: 64 }, () => this.rnd());
  }
  set(x, y, c, a = 255) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.data[i] = c[0]; this.data[i + 1] = c[1]; this.data[i + 2] = c[2]; this.data[i + 3] = a;
  }
  noise(x, y, s = 4) {
    const fx = x / s, fy = y / s, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
    const at = (i, j) => this.g[((i & 7) + (j & 7) * 8)];
    const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
  }
  pick(p, v, x, y, dither = 0.8) {
    const d = v * p.length + BAYER[(y & 3) * 4 + (x & 3)] * dither;
    return p[Math.max(0, Math.min(p.length - 1, Math.floor(d)))];
  }
  fill(p, fn) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) this.set(x, y, this.pick(p, fn(x, y), x, y)); }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  texture() {
    const c = document.createElement('canvas');
    c.width = this.w; c.height = this.h;
    c.getContext('2d').putImageData(new ImageData(this.data, this.w, this.h), 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    return t;
  }
}

const skinCache = new Map();

// Caja con piel. paint(face, skin) con face en px, nx, py, ny, pz (frente), nz (atrás).
// En px el borde izquierdo de la textura es el frente; en nx el borde derecho es el frente.
export function skinBox(name, w, h, d, paint, opts = {}) {
  const dims = { px: [d, h], nx: [d, h], py: [w, d], ny: [w, d], pz: [w, h], nz: [w, h] };
  const mats = ['px', 'nx', 'py', 'ny', 'pz', 'nz'].map((face) => {
    const [fw, fh] = dims[face];
    // la piel se pinta una sola vez por tipo y se comparte entre todas las criaturas iguales
    const ck = `${name}:${face}:${fw}x${fh}`;
    let tex = skinCache.get(ck);
    if (!tex) {
      const s = new Skin(fw * PX, fh * PX, `${name}:${face}`);
      paint(face, s);
      tex = s.texture();
      skinCache.set(ck, tex);
    }
    const m = new THREE.MeshBasicMaterial({ map: tex, alphaTest: opts.cutout ? 0.5 : 0, side: opts.cutout ? THREE.DoubleSide : THREE.FrontSide });
    m.userData.sharedMap = true;
    return m;
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
  return mesh;
}

// Pivote con una caja colgando (para patas, cabeza, etc.)
export function pivot(x, y, z, child, cx = 0, cy = 0, cz = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  child.position.set(cx, cy, cz);
  g.add(child);
  return g;
}

// Tiñe todo un modelo según la luz (no toca lo que brilla).
// color de la luz ambiente (lo pone el juego cada cuadro) para que las criaturas combinen con el mundo
export const LIGHT_TINT = new THREE.Color(1, 1, 1);
export function tintModel(group, light, red = 0) {
  group.traverse((o) => {
    if (!o.isMesh || o.userData.glow) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      // el color propio del material (ojos, narices, manchas…) se guarda la primera vez y la luz lo oscurece encima;
      // antes se pisaba con la luz y todas las piezas de color quedaban del mismo gris
      // un material clonado trae el baseColor hecho número (pasa por JSON): ahí se vuelve a tomar
      const guardado = m.userData.baseColor, base = guardado && guardado.isColor ? guardado : (m.userData.baseColor = m.color.clone());
      const tr = 0.35 + LIGHT_TINT.r * 0.65, tg = 0.35 + LIGHT_TINT.g * 0.65, tb = 0.35 + LIGHT_TINT.b * 0.65;
      m.color.setRGB(base.r * (light + red * (1 - light)) * tr, base.g * light * (1 - red * 0.75) * tg, base.b * light * (1 - red * 0.75) * tb);
    }
  });
}

// cambiar el color de una pieza que se tiñe con la luz: si no, tintModel lo pisa en el mismo cuadro
export function pintarBase(mat, hex) {
  mat.color.setHex(hex);
  if (mat.userData.baseColor && mat.userData.baseColor.isColor) mat.userData.baseColor.setHex(hex);
}
export function disposeModel(group) {
  group.traverse((o) => {
    if (o.isSprite && o.userData.desechable) { o.material.map.dispose(); o.material.dispose(); return; }
    if (!o.isMesh) return;
    o.geometry.dispose();
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) { if (m.map && m.map !== atlasTexture && !m.userData.sharedMap) m.map.dispose(); m.dispose(); }
  });
}

// ---------- mallas de ítems ----------
const itemTexCache = new Map();
function itemTexture(id) {
  if (itemTexCache.has(id)) return itemTexCache.get(id);
  let canvas;
  if (!isBlockId(id)) canvas = itemCanvas(id);
  else canvas = tileCanvas(BLOCKS[id].tex.side);
  const t = new THREE.CanvasTexture(canvas);
  // pixeles nítidos siempre (antes los ítems se veían borrosos, en la mano y en el suelo)
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  t.colorSpace = THREE.NoColorSpace;
  itemTexCache.set(id, t);
  return t;
}

// Machete en 3D para la mano: cacha de madera con remaches, guarda, hoja larga que se ensancha hacia la punta,
// filo brillante y lomo oscuro. Va a lo largo de +Y (la cacha abajo, en el origen). Los colores van en los vértices
// para que la luz del mundo (que cambia el color del material) los siga oscureciendo bien.
export function makeMacheteMesh(dark = false) {
  const group = new THREE.Group();
  const add = (w, h, d, col, x, y, z, rz = 0) => {
    const g = new THREE.BoxGeometry(w, h, d);
    const [r, gg, b] = hex(col).map((v) => v / 255);
    const n = g.attributes.position.count, cols = [];
    // un poquito más claro arriba y a la derecha, para que se lea el volumen
    for (let i = 0; i < n; i++) { const s = 0.82 + (g.attributes.position.getY(i) > 0 ? 0.1 : 0) + (g.attributes.position.getX(i) > 0 ? 0.08 : 0); cols.push(r * s, gg * s, b * s); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true }));
    m.position.set(x, y, z); m.rotation.z = rz;
    group.add(m);
  };
  const steel = dark ? '#34343c' : '#c4c9ce', edge = dark ? '#e02828' : '#f4f7fa', spine = dark ? '#18181c' : '#7e868e';
  add(0.06, 0.035, 0.06, '#3a2410', 0, 0, 0); // pomo
  add(0.048, 0.17, 0.048, '#5e3c1e', 0, 0.1, 0); // cacha
  for (const y of [0.06, 0.14]) add(0.052, 0.012, 0.05, '#c8a040', 0, y, 0); // remaches
  add(0.085, 0.022, 0.05, '#2a2a2a', 0, 0.195, 0); // guarda
  // hoja: tramos que se ensanchan y se curvan un poquito hacia atrás
  const N = 7;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1), h = 0.085, y = 0.25 + i * (h - 0.004);
    const w = 0.05 + t * 0.04 - (i === N - 1 ? 0.02 : 0), cx = t * t * 0.03;
    add(w, h, 0.012, steel, cx, y, 0);
    add(0.012, h, 0.014, edge, cx - w / 2 - 0.004, y, 0); // filo
    add(0.01, h, 0.016, spine, cx + w / 2, y, 0); // lomo
  }
  add(0.035, 0.05, 0.012, edge, 0.03 - 0.012, 0.25 + N * 0.081, 0, 0.6); // punta
  if (dark) add(0.03, 0.03, 0.02, '#f4f0e0', 0.01, 0.34, 0.006); // colmillo del Cadejos
  group.userData.kind = 'machete';
  group.userData.agarre = { p: [0, 0.1, 0], d: [0, 1, 0] };
  return group;
}

// Lo que se lleva en la mano: el ícono con grosor. Cada pixel opaco es una cajita del color del pixel, y los costados van más
// oscuros para que se lea el volumen. Sale nítido (sin el suavizado de una textura estirada) y se ve sólido al girarlo.
// Mide `size` de lado; está en el plano XY mirando a +Z, igual que la lámina vieja, así que las poses de la mano sirven igual.
export function makeHeldItemMesh(id, size) {
  const cv = isBlockId(id) ? tileCanvas(BLOCKS[id].tex.side) : itemCanvas(id), W = cv.width, H = cv.height;
  const d = cv.getContext('2d').getImageData(0, 0, W, H).data;
  const op = (x, y) => x >= 0 && y >= 0 && x < W && y < H && d[(y * W + x) * 4 + 3] > 110;
  const px = size / Math.max(W, H), th = Math.max(px * 1.4, size * 0.045);
  const pos = [], col = [], idx = [];
  const quad = (a, b, c, e, r, g, bl) => {
    const n = pos.length / 3;
    pos.push(...a, ...b, ...c, ...e);
    for (let k = 0; k < 4; k++) col.push(r, g, bl);
    idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
  };
  const x0 = -W * px / 2, y0 = H * px / 2, zf = th / 2, zb = -th / 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!op(x, y)) continue;
    const i = (y * W + x) * 4, r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
    const L = x0 + x * px, R = L + px, T = y0 - y * px, B = T - px;
    quad([L, B, zf], [R, B, zf], [R, T, zf], [L, T, zf], r, g, b); // frente
    quad([R, B, zb], [L, B, zb], [L, T, zb], [R, T, zb], r * 0.8, g * 0.8, b * 0.8); // atrás
    // costados solo donde el vecino es transparente
    if (!op(x - 1, y)) quad([L, B, zb], [L, B, zf], [L, T, zf], [L, T, zb], r * 0.62, g * 0.62, b * 0.62);
    if (!op(x + 1, y)) quad([R, B, zf], [R, B, zb], [R, T, zb], [R, T, zf], r * 0.62, g * 0.62, b * 0.62);
    if (!op(x, y - 1)) quad([L, T, zf], [R, T, zf], [R, T, zb], [L, T, zb], r * 0.9, g * 0.9, b * 0.9);
    if (!op(x, y + 1)) quad([L, B, zb], [R, B, zb], [R, B, zf], [L, B, zf], r * 0.5, g * 0.5, b * 0.5);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true }));
  mesh.userData.kind = 'flat';
  // v11.11.2: el agarre sale de los píxeles: el mango es la punta de abajo a la izquierda (así vienen los íconos de herramientas y
  // armas) y la cabeza, la de arriba a la derecha; la mano agarra a un octavo del camino (v12.6.6: antes un quinto)
  let A = null, Bq = null;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (op(x, y)) { const s = x - y; if (!A || s < A[2]) A = [x, y, s]; if (!Bq || s > Bq[2]) Bq = [x, y, s]; }
  if (A) {
    const ax = x0 + (A[0] + 0.5) * px, ay = y0 - (A[1] + 0.5) * px, bx = x0 + (Bq[0] + 0.5) * px, by = y0 - (Bq[1] + 0.5) * px, L = Math.hypot(bx - ax, by - ay) || 1;
    mesh.userData.agarre = { p: [ax + (bx - ax) * 0.12, ay + (by - ay) * 0.12, 0], d: [(bx - ax) / L, (by - ay) / L, 0], a: [ax, ay, 0], b: [bx, by, 0] };
  }
  return mesh;
}

// Cubo con las caras del bloque (desde el atlas) o lámina con el sprite del ítem.
export function makeItemMesh(id, size) {
  const b = isBlockId(id) ? BLOCKS[id] : null;
  if (b && b.render === 'torch') {
    const g = new THREE.BoxGeometry(size * 0.16, size * 0.8, size * 0.16);
    const t = tileUV(b.tex.side);
    const uv = g.attributes.uv;
    const du = t.u1 - t.u0, dv = t.v1 - t.v0;
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      const u = uv.getX(i), v = uv.getY(i);
      const top = f === 2, bottom = f === 3;
      const v0 = top ? 6 : bottom ? 14 : 6, v1 = top ? 8 : 16;
      uv.setXY(i, t.u0 + du * (7 + u * 2) / 16, t.v0 + dv * (v0 + (1 - v) * (v1 - v0)) / 16);
    }
    const m = new THREE.MeshBasicMaterial({ map: atlasTexture, alphaTest: 0.5 });
    m.userData.sharedMap = true;
    const mesh = new THREE.Mesh(g, m);
    mesh.userData.kind = 'torch';
    mesh.userData.agarre = { p: [0, -size * 0.22, 0], d: [0, 1, 0] };
    return mesh;
  }
  if (b && b.render !== 'cross') {
    const g = new THREE.BoxGeometry(size, size, size);
    const uv = g.attributes.uv;
    const faces = ['side', 'side', 'top', 'bottom', 'side', 'side'];
    const shade = [0.8, 0.8, 1, 0.5, 0.65, 0.65];
    const colors = [];
    for (let f = 0; f < 6; f++) {
      const t = tileUV(b.tex[faces[f]]);
      for (let k = 0; k < 4; k++) {
        const i = f * 4 + k;
        uv.setXY(i, t.u0 + uv.getX(i) * (t.u1 - t.u0), t.v0 + (1 - uv.getY(i)) * (t.v1 - t.v0));
        colors.push(shade[f], shade[f], shade[f]);
      }
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const m = new THREE.MeshBasicMaterial({ map: atlasTexture, vertexColors: true, alphaTest: 0.5, transparent: b.render === 'water', opacity: b.render === 'water' ? 0.75 : 1 });
    m.userData.sharedMap = true;
    const mesh = new THREE.Mesh(g, m);
    mesh.userData.kind = 'block';
    return mesh;
  }
  const m = new THREE.MeshBasicMaterial({ map: itemTexture(id), alphaTest: 0.4, side: THREE.DoubleSide });
  m.userData.sharedMap = true;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size * 1.5, size * 1.5), m);
  mesh.userData.kind = 'flat';
  mesh.userData.agarre = { p: [0, -size * 0.55, 0], d: [0, 1, 0] };
  return mesh;
}
