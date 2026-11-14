// Mallado de chunks: caras visibles, oclusión ambiental por vértice, luz del cielo y luz de lámparas.
import { BLOCKS, OPAQUE, SOLID, FLUID, MAX_BLOCK, animDe } from './blocks.js';
import { tileUV } from './textures.js';
import { CHUNK, HEIGHT } from './worldgen.js';

const PW = CHUNK + 2; // ancho con borde
const PH = HEIGHT + 2;
const PLANE = PW * PW;

const RENDER = new Uint8Array(MAX_BLOCK); // 0 nada, 1 cubo, 2 cutout, 3 cruz, 4 agua
const LEAFY = new Uint8Array(MAX_BLOCK);
const GLOW = new Uint8Array(MAX_BLOCK);
const VARY = new Uint8Array(MAX_BLOCK); // 1 rota arriba/abajo, 2 además refleja los lados
const TINT = new Uint8Array(MAX_BLOCK);
const ANIM = new Uint8Array(MAX_BLOCK);
const FACING = new Uint8Array(MAX_BLOCK);
const FHEIGHT = new Float32Array(MAX_BLOCK); // altura de la superficie del fluido
const WALL = new Int8Array(MAX_BLOCK);
const FV = [[0, 1], [1, 0], [0, -1], [-1, 0]];
const TORCH = new Uint8Array(MAX_BLOCK);
const SHAPE = new Array(MAX_BLOCK).fill(null);
const FENCE = new Uint8Array(MAX_BLOCK);
// cerca: poste + dos travesaños hacia cada vecino (otra cerca o bloque entero)
const FENCE_POST = [6 / 16, 0, 6 / 16, 10 / 16, 1, 10 / 16];
const FENCE_ARMS = [
  [[10 / 16, 6 / 16, 7 / 16, 1, 9 / 16, 9 / 16], [10 / 16, 12 / 16, 7 / 16, 1, 15 / 16, 9 / 16]],
  [[0, 6 / 16, 7 / 16, 6 / 16, 9 / 16, 9 / 16], [0, 12 / 16, 7 / 16, 6 / 16, 15 / 16, 9 / 16]],
  [[7 / 16, 6 / 16, 10 / 16, 9 / 16, 9 / 16, 1], [7 / 16, 12 / 16, 10 / 16, 9 / 16, 15 / 16, 1]],
  [[7 / 16, 6 / 16, 0, 9 / 16, 9 / 16, 6 / 16], [7 / 16, 12 / 16, 0, 9 / 16, 15 / 16, 6 / 16]],
];
// orientación guardada (0 +z, 1 +x, 2 -z, 3 -x) -> índice de cara en FACES
const FRONT_FACE = [2, 0, 3, 1];
for (let i = 0; i < MAX_BLOCK; i++) {
  VARY[i] = BLOCKS[i].vary ? (BLOCKS[i].flipSides ? 2 : 1) : 0;
  TINT[i] = BLOCKS[i].tint ? 1 : 0;
  ANIM[i] = animDe(BLOCKS[i]); // v12.8.0: +8 = emisor (POST_HDR en world.js); v12.8.4: solo las luces; v12.8.6: se suma al anim (el farol y la fogata)
  FACING[i] = BLOCKS[i].facing ? 1 : 0;
  TORCH[i] = BLOCKS[i].render === 'torch' ? 1 : 0;
  const r = BLOCKS[i].render;
  RENDER[i] = r === 'cube' ? 1 : r === 'cutout' ? 2 : r === 'cross' ? 3 : r === 'water' || r === 'lava' ? 4 : r === 'torch' ? 5 : r === 'shape' ? 6 : 0;
  SHAPE[i] = BLOCKS[i].boxes ? BLOCKS[i].boxes.map((q) => q.map((v) => v / 16)) : null;
  FENCE[i] = BLOCKS[i].fence ? 1 : 0;
  FHEIGHT[i] = BLOCKS[i].falling ? 1 : BLOCKS[i].level ? (BLOCKS[i].source ? 0.89 : (BLOCKS[i].level / 9) * 0.95) : 0;
  WALL[i] = BLOCKS[i].wall === undefined ? -1 : BLOCKS[i].wall;
  LEAFY[i] = BLOCKS[i].leafy ? 1 : 0;
  GLOW[i] = BLOCKS[i].glow ? 1 : 0;
}

// Caras: normal, 4 esquinas (CCW visto desde afuera), qué textura usa, sombreado direccional
const FACES = [
  { n: [1, 0, 0], c: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], tex: 'side', shade: 0.8 },
  { n: [-1, 0, 0], c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], tex: 'side', shade: 0.8 },
  { n: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], tex: 'side', shade: 0.65 },
  { n: [0, 0, -1], c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], tex: 'side', shade: 0.65 },
  { n: [0, 1, 0], c: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]], tex: 'top', shade: 1.0 },
  { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], tex: 'bottom', shade: 0.5 },
];
// UV por esquina: lados → abajo-izq, abajo-der, arriba-der, arriba-izq
const SIDE_UV = [[0, 1], [1, 1], [1, 0], [0, 0]];
const TOP_UV = [[0, 0], [0, 1], [1, 1], [1, 0]];
const AO_CURVE = [0.5, 0.68, 0.84, 1.0];

// Precalcula offsets de oclusión por cara y esquina.
for (const f of FACES) {
  const axis = f.n[0] !== 0 ? 0 : f.n[1] !== 0 ? 1 : 2;
  const t1 = axis === 0 ? 1 : 0;
  const t2 = axis === 2 ? 1 : 2;
  f.ao = f.c.map((corner) => {
    const s1 = [0, 0, 0], s2 = [0, 0, 0];
    s1[t1] = corner[t1] === 1 ? 1 : -1;
    s2[t2] = corner[t2] === 1 ? 1 : -1;
    const d = (v) => v[0] + v[2] * PW + v[1] * PLANE;
    return { s1: d(s1), s2: d(s2), c: d([s1[0] + s2[0], s1[1] + s2[1], s1[2] + s2[2]]) };
  });
  f.nOff = f.n[0] + f.n[2] * PW + f.n[1] * PLANE;
  f.uv = f.tex === 'side' ? SIDE_UV : TOP_UV;
}

let uvCache = null;
function blockUVs() {
  if (uvCache) return uvCache;
  uvCache = [];
  for (let i = 0; i < MAX_BLOCK; i++) {
    const b = BLOCKS[i];
    if (!b.tex) continue;
    uvCache[i] = { top: tileUV(b.tex.top), side: tileUV(b.tex.side), bottom: tileUV(b.tex.bottom), front: tileUV(b.tex.front) };
  }
  return uvCache;
}

const NO_TINT = [1, 1, 1];
const NO_ANIM = [0, 0, 0, 0];

class Buf {
  constructor() { this.pos = []; this.uv = []; this.col = []; this.light = []; this.anim = []; this.idx = []; this.n = 0; }
  quad(verts, uvs, cols, lights, flip, tint = NO_TINT, anim = NO_ANIM) {
    const b = this.n;
    for (let k = 0; k < 4; k++) {
      this.pos.push(verts[k][0], verts[k][1], verts[k][2]);
      this.uv.push(uvs[k][0], uvs[k][1]);
      this.col.push(cols[k] * tint[0], cols[k] * tint[1], cols[k] * tint[2]);
      this.light.push(lights[k * 2], lights[k * 2 + 1]);
      this.anim.push(anim[k]);
    }
    if (flip) this.idx.push(b + 1, b + 2, b + 3, b + 1, b + 3, b);
    else this.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    this.n += 4;
  }
  result() {
    if (this.n === 0) return null;
    return {
      position: new Float32Array(this.pos),
      uv: new Float32Array(this.uv),
      color: new Float32Array(this.col),
      light: new Float32Array(this.light),
      anim: new Float32Array(this.anim),
      index: this.n > 65535 ? new Uint32Array(this.idx) : new Uint16Array(this.idx),
    };
  }
}

const P = new Uint16Array(PW * PW * PH);
const SKY = new Uint8Array(PW * PW * PH);
const BL = new Uint8Array(PW * PW * PH); // luz de bloques recortada al borde
const HM = new Int16Array(PW * PW);

// Luz de lámparas: BFS sobre la región 3x3 chunks (48x48xH).
const RW = CHUNK * 3;
const REG = new Uint16Array(RW * RW * HEIGHT);
const LIGHTREG = new Uint8Array(RW * RW * HEIGHT);
const QUEUE = new Int32Array(RW * RW * HEIGHT);

function computeBlockLight(nb) {
  let any = false;
  for (const c of nb) if (c && c.glowCount > 0) { any = true; break; }
  if (!any) return false;
  LIGHTREG.fill(0);
  let qh = 0, qt = 0;
  for (let oz = 0; oz < 3; oz++) for (let ox = 0; ox < 3; ox++) {
    const ch = nb[ox + oz * 3];
    const bl = ch.blocks;
    for (let y = 0; y < HEIGHT; y++) for (let z = 0; z < CHUNK; z++) {
      const rowSrc = x0src(y, z);
      const rz = oz * CHUNK + z;
      for (let x = 0; x < CHUNK; x++) {
        const id = bl[rowSrc + x];
        const r = ox * CHUNK + x + rz * RW + y * RW * RW;
        REG[r] = id;
        if (GLOW[id]) { LIGHTREG[r] = 15; QUEUE[qt++] = r; }
      }
    }
  }
  const SL = RW * RW;
  while (qh < qt) {
    const r = QUEUE[qh++];
    const l = LIGHTREG[r] - 1;
    if (l <= 0) continue;
    const x = r % RW, z = Math.floor(r / RW) % RW, y = Math.floor(r / SL);
    const tryN = (n) => {
      if (LIGHTREG[n] >= l) return;
      if (OPAQUE[REG[n]]) return;
      LIGHTREG[n] = l;
      QUEUE[qt++] = n;
    };
    if (x > 0) tryN(r - 1);
    if (x < RW - 1) tryN(r + 1);
    if (z > 0) tryN(r - RW);
    if (z < RW - 1) tryN(r + RW);
    if (y > 0) tryN(r - SL);
    if (y < HEIGHT - 1) tryN(r + SL);
  }
  // copiar a la grilla con borde
  for (let py = 1; py < PH - 1; py++) for (let pz = 0; pz < PW; pz++) for (let px = 0; px < PW; px++) {
    const r = (px - 1 + CHUNK) + (pz - 1 + CHUNK) * RW + (py - 1) * SL;
    BL[px + pz * PW + py * PLANE] = LIGHTREG[r];
  }
  return true;
}
function x0src(y, z) { return z * CHUNK + y * CHUNK * CHUNK; }

// nb: arreglo de 9 chunks (3x3) con el central en [4]
export function buildChunkGeometry(nb, ambientSky = 0) {
  const uvs = blockUVs();
  // 1) copiar bloques con borde de 1
  for (let py = 0; py < PH; py++) {
    const y = py - 1;
    for (let pz = 0; pz < PW; pz++) {
      const lz = pz - 1;
      const oz = lz < 0 ? 0 : lz >= CHUNK ? 2 : 1;
      const z = lz < 0 ? lz + CHUNK : lz >= CHUNK ? lz - CHUNK : lz;
      for (let px = 0; px < PW; px++) {
        const lx = px - 1;
        const ox = lx < 0 ? 0 : lx >= CHUNK ? 2 : 1;
        const x = lx < 0 ? lx + CHUNK : lx >= CHUNK ? lx - CHUNK : lx;
        let id;
        if (y < 0) id = 12;
        else if (y >= HEIGHT) id = 0;
        else id = nb[ox + oz * 3].blocks[x + z * CHUNK + y * CHUNK * CHUNK];
        P[px + pz * PW + py * PLANE] = id;
      }
    }
  }
  if (nb[4].ocultos) for (const i of nb[4].ocultos) P[(i % CHUNK) + 1 + ((Math.floor(i / CHUNK) % CHUNK) + 1) * PW + (Math.floor(i / (CHUNK * CHUNK)) + 1) * PLANE] = 0;
  // 2) luz del cielo: altura del bloque opaco más alto por columna
  for (let pz = 0; pz < PW; pz++) for (let px = 0; px < PW; px++) {
    let top = -1;
    for (let py = PH - 2; py >= 1; py--) {
      if (OPAQUE[P[px + pz * PW + py * PLANE]]) { top = py; break; }
    }
    HM[px + pz * PW] = top;
    for (let py = 0; py < PH; py++) {
      const l = py > top ? 15 : Math.max(0, 15 - (top - py + 1) * 2);
      SKY[px + pz * PW + py * PLANE] = l;
    }
  }
  // en el inframundo no hay cielo: una penumbra rojiza pareja (más la luz de la lava)
  if (ambientSky) for (let i = 0; i < SKY.length; i++) if (SKY[i] < ambientSky) SKY[i] = ambientSky;
  // 2b) la luz del cielo también se cuela de lado (aleros, porches, bocas de cueva): 3 pasadas, pierde 2 por bloque
  let minTop = PH, maxTop = 0;
  for (let k = 0; k < PW * PW; k++) { if (HM[k] < minTop) minTop = HM[k]; if (HM[k] > maxTop) maxTop = HM[k]; }
  const yLo = Math.max(1, minTop - 1), yHi = Math.min(PH - 2, maxTop);
  for (let pass = 0; pass < 3; pass++) {
    for (let py = yLo; py <= yHi; py++) for (let pz = 1; pz < PW - 1; pz++) for (let px = 1; px < PW - 1; px++) {
      const i = px + pz * PW + py * PLANE;
      if (SKY[i] >= 13 || OPAQUE[P[i]]) continue;
      let m = 0;
      if (!OPAQUE[P[i - 1]] && SKY[i - 1] > m) m = SKY[i - 1];
      if (!OPAQUE[P[i + 1]] && SKY[i + 1] > m) m = SKY[i + 1];
      if (!OPAQUE[P[i - PW]] && SKY[i - PW] > m) m = SKY[i - PW];
      if (!OPAQUE[P[i + PW]] && SKY[i + PW] > m) m = SKY[i + PW];
      if (m - 2 > SKY[i]) SKY[i] = m - 2;
    }
  }
  const hasBlockLight = computeBlockLight(nb);
  const center = nb[4];
  const ox = center.cx * CHUNK, oz = center.cz * CHUNK;
  const tints = center.tint;
  const tintRGB = [1, 1, 1];
  const anim4 = [0, 0, 0, 0];
  const hashAt = (x, y, z) => {
    let h = Math.imul((x + ox) | 0, 73856093) ^ Math.imul(y | 0, 19349663) ^ Math.imul((z + oz) | 0, 83492791);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
  };

  const opaque = new Buf();
  const water = new Buf();
  const verts = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const quv = [[0, 0], [0, 0], [0, 0], [0, 0]];
  const cols = [0, 0, 0, 0];
  const lights = [0, 0, 0, 0, 0, 0, 0, 0];

  const lightAt = (cell, s1, s2, c, out, k) => {
    // promedio de luz de las celdas no opacas alrededor del vértice
    let sky = 0, blk = 0, n = 0;
    const cells = [cell, cell + s1, cell + s2, cell + c];
    for (let i = 0; i < 4; i++) {
      const q = cells[i];
      if (i === 3 && OPAQUE[P[cell + s1]] && OPAQUE[P[cell + s2]]) continue;
      if (i > 0 && OPAQUE[P[q]]) continue;
      sky += SKY[q];
      blk += hasBlockLight ? BL[q] : 0;
      n++;
    }
    out[k * 2] = Math.pow(sky / n / 15, 1.5);
    out[k * 2 + 1] = hasBlockLight ? Math.pow(blk / n / 15, 1.4) : 0;
  };

  for (let py = 1; py < PH - 1; py++) {
    const y = py - 1;
    for (let pz = 1; pz < PW - 1; pz++) {
      const z = pz - 1;
      for (let px = 1; px < PW - 1; px++) {
        const cell = px + pz * PW + py * PLANE;
        const id = P[cell];
        const r = RENDER[id];
        if (r === 0) continue;
        const x = px - 1;

        if (r === 3) {
          // planta en cruz: dos diagonales, doble cara
          const uv = uvs[id].side;
          const sky = Math.pow(SKY[cell] / 15, 1.5);
          const blk = hasBlockLight ? Math.pow(BL[cell] / 15, 1.4) : 0;
          for (let k = 0; k < 4; k++) { cols[k] = 0.95; lights[k * 2] = TORCH[id] ? 1 : sky; lights[k * 2 + 1] = TORCH[id] ? 1 : blk; }
          const a = 0.15, b = 0.85;
          const diag = [
            [[x + a, y, z + a], [x + b, y, z + b], [x + b, y + 1, z + b], [x + a, y + 1, z + a]],
            [[x + b, y, z + a], [x + a, y, z + b], [x + a, y + 1, z + b], [x + b, y + 1, z + a]],
          ];
          const pu = [[uv.u0, uv.v1], [uv.u1, uv.v1], [uv.u1, uv.v0], [uv.u0, uv.v0]];
          const ti = (x + z * CHUNK) * 3;
          const tnt = TINT[id] && tints ? [tints[ti], tints[ti + 1], tints[ti + 2]] : NO_TINT;
          const an = [0, 0, ANIM[id], ANIM[id]];
          // pequeño desplazamiento por bloque para que no queden alineadas (las antorchas van centradas)
          const hj = hashAt(x, y, z);
          const jx = TORCH[id] ? 0 : ((hj & 15) / 15 - 0.5) * 0.3, jz = TORCH[id] ? 0 : (((hj >> 4) & 15) / 15 - 0.5) * 0.3;
          for (const d of diag) {
            for (const v of d) { v[0] += jx; v[2] += jz; }
            opaque.quad(d, pu, cols, lights, false, tnt, an);
            opaque.quad([d[1], d[0], d[3], d[2]], [pu[1], pu[0], pu[3], pu[2]], cols, lights, false, tnt, an);
          }
          continue;
        }

        if (r === 4) {
          // agua o lava con niveles: la altura de cada esquina es el promedio de las celdas que la comparten,
          // así la superficie baja suave hacia los bordes y entre niveles distintos
          const fam = FLUID[id];
          const lava = fam === 2;
          const aboveSame = FLUID[P[cell + PLANE]] === fam;
          const cornerH = (ox, oz) => {
            let sum = 0, w = 0;
            for (let dz = -1; dz <= 0; dz++) for (let dx = -1; dx <= 0; dx++) {
              const c2 = cell + (ox + dx) + (oz + dz) * PW;
              const id2 = P[c2];
              if (FLUID[id2] === fam) {
                if (FLUID[P[c2 + PLANE]] === fam) return 1;
                sum += FHEIGHT[id2]; w++;
              } else if (!SOLID[id2]) { w++; }
            }
            return w ? sum / w : FHEIGHT[id];
          };
          const ch = aboveSame ? [1, 1, 1, 1] : [cornerH(0, 0), cornerH(1, 0), cornerH(0, 1), cornerH(1, 1)];
          const hAt = (cx0, cz0) => ch[cx0 + cz0 * 2];
          const uv = uvs[id].top;
          const buf = lava ? opaque : water;
          // v12.6.2 (agua «de material»): cuánta agua hay debajo (0–6) y qué esquinas tocan la orilla, empaquetados en la fracción de aAnim
          // v12.6.4: la profundidad va por esquina (el promedio de las 4 columnas que la comparten; la tierra cuenta 0), hasta 8, para que
          // el degradado de la orilla a lo hondo sea suave y no a saltos de celda
          const hondo = (c0) => { let n = 0; if (FLUID[P[c0]] !== fam) return 0; while (n < 8 && y - n - 1 >= 0 && FLUID[P[c0 - PLANE * (n + 1)]] === fam) n++; return n + 1; };
          const prof = (ox, oz) => { let s = 0; for (let dz = -1; dz <= 0; dz++) for (let dx = -1; dx <= 0; dx++) s += hondo(cell + (ox + dx) + (oz + dz) * PW); return Math.min(8, s / 4); };
          const orilla = (ox, oz) => { for (let dz = -1; dz <= 0; dz++) for (let dx = -1; dx <= 0; dx++) if (SOLID[P[cell + (ox + dx) + (oz + dz) * PW]]) return 1; return 0; };
          for (const f of FACES) {
            const nid = P[cell + f.nOff];
            if (FLUID[nid] === fam || OPAQUE[nid]) continue;
            if (f.n[1] === 1 && aboveSame) continue;
            for (let k = 0; k < 4; k++) {
              const c = f.c[k];
              verts[k][0] = x + c[0]; verts[k][1] = y + (c[1] === 1 ? hAt(c[0], c[2]) : 0); verts[k][2] = z + c[2];
              quv[k][0] = f.uv[k][0] ? uv.u1 : uv.u0; quv[k][1] = f.uv[k][1] ? uv.v1 : uv.v0;
              cols[k] = lava ? 1 : f.shade;
              // la ola solo mueve las esquinas que están por debajo del tope: así dos vértices en el mismo punto
              // (de celdas vecinas) siempre se mueven igual y no se abren rendijas entre bloques de agua
              anim4[k] = c[1] === 1 && hAt(c[0], c[2]) < 0.999 ? 3 : 0;
              if (lava) anim4[k] += 0.9; // v12.8.0: la lava también es emisor (la fracción .9)
              if (!lava) anim4[k] = (anim4[k] || 6) + (c[1] === 1 ? prof(c[0], c[2]) * 0.05 + (orilla(c[0], c[2]) ? 0.5 : 0) : 0.4); // base 3 (ola) o 6 (quieta) + profundidad (0–8 × 0.05) + orilla (0.5); los lados, hondos
              if (lava) { lights[k * 2] = 1; lights[k * 2 + 1] = 1; } else lightAt(cell + f.nOff, 0, 0, 0, lights, k);
            }
            buf.quad(verts, quv, cols, lights, false, NO_TINT, anim4);
          }
          continue;
        }

        if (r === 6) {
          // bloque con forma: cajas con su pedazo de textura; las caras pegadas a un vecino opaco no se dibujan
          let boxes = SHAPE[id];
          if (FENCE[id]) {
            boxes = [FENCE_POST];
            const nbs = [cell + 1, cell - 1, cell + PW, cell - PW];
            for (let k = 0; k < 4; k++) if (FENCE[P[nbs[k]]] || OPAQUE[P[nbs[k]]]) boxes = boxes.concat(FENCE_ARMS[k]);
          }
          const t6 = uvs[id];
          const an6 = ANIM[id];
          for (let k = 0; k < 4; k++) anim4[k] = an6;
          for (const q of boxes) {
            for (let fi = 0; fi < 6; fi++) {
              const f = FACES[fi];
              const ax = f.n[0] !== 0 ? 0 : f.n[1] !== 0 ? 1 : 2;
              const pos = f.n[ax] > 0;
              const onEdge = pos ? q[ax + 3] >= 1 : q[ax] <= 0;
              const lc = onEdge ? cell + f.nOff : cell;
              if (onEdge && OPAQUE[P[lc]]) continue;
              const sky = Math.pow(SKY[lc] / 15, 1.5);
              const blk = hasBlockLight ? Math.pow(BL[lc] / 15, 1.4) : 0;
              const uv = t6[f.tex];
              const du = uv.u1 - uv.u0, dv = uv.v1 - uv.v0;
              for (let k = 0; k < 4; k++) {
                const c = f.c[k];
                const lx = c[0] ? q[3] : q[0], ly = c[1] ? q[4] : q[1], lz = c[2] ? q[5] : q[2];
                verts[k][0] = x + lx; verts[k][1] = y + ly; verts[k][2] = z + lz;
                const u = ax === 0 ? lz : lx, v = ax === 1 ? lz : 1 - ly;
                quv[k][0] = uv.u0 + du * u; quv[k][1] = uv.v0 + dv * v;
                cols[k] = f.shade * (GLOW[id] ? 1.15 : 1);
                lights[k * 2] = GLOW[id] ? 1 : sky; lights[k * 2 + 1] = GLOW[id] ? 1 : blk;
              }
              opaque.quad(verts, quv, cols, lights, false, NO_TINT, anim4);
            }
          }
          continue;
        }

        if (r === 5) {
          // antorcha 3D: palito de 2x10 pixeles con la llama arriba; en la pared va inclinada
          const tu = uvs[id].side;
          const du = tu.u1 - tu.u0, dv = tu.v1 - tu.v0;
          const U = (px0) => tu.u0 + du * px0 / 16, V = (py0) => tu.v0 + dv * py0 / 16;
          const wall = WALL[id];
          const [fx, fz] = wall >= 0 ? FV[wall] : [0, 0];
          const tilt = wall >= 0 ? 0.42 : 0;
          const ca = Math.cos(tilt), sa = Math.sin(tilt);
          const bx = x + 0.5 - fx * 0.38, by = y + (wall >= 0 ? 0.2 : 0), bz = z + 0.5 - fz * 0.38;
          const tf = (lx, ly, lz) => {
            // girar alrededor de la base, inclinando hacia afuera de la pared
            const s = lx * fx + lz * fz;
            const s2 = s * ca + ly * sa, ly2 = -s * sa + ly * ca;
            return [bx + lx + fx * (s2 - s), by + ly2, bz + lz + fz * (s2 - s)];
          };
          const w = 1 / 16, h = 10 / 16;
          for (let k = 0; k < 4; k++) { cols[k] = 1; lights[k * 2] = 1; lights[k * 2 + 1] = 1; }
          const box = [
            [[w, 0, w], [w, 0, -w], [w, h, -w], [w, h, w]],
            [[-w, 0, -w], [-w, 0, w], [-w, h, w], [-w, h, -w]],
            [[-w, 0, w], [w, 0, w], [w, h, w], [-w, h, w]],
            [[w, 0, -w], [-w, 0, -w], [-w, h, -w], [w, h, -w]],
          ];
          const sideUV = [[U(7), V(16)], [U(9), V(16)], [U(9), V(6)], [U(7), V(6)]];
          for (const q of box) opaque.quad(q.map((p) => tf(p[0], p[1], p[2])), sideUV, cols, lights, false);
          opaque.quad([[-w, h, -w], [-w, h, w], [w, h, w], [w, h, -w]].map((p) => tf(p[0], p[1], p[2])), [[U(7), V(6)], [U(7), V(8)], [U(9), V(8)], [U(9), V(6)]], cols, lights, false);
          opaque.quad([[-w, 0, -w], [w, 0, -w], [w, 0, w], [-w, 0, w]].map((p) => tf(p[0], p[1], p[2])), [[U(7), V(14)], [U(9), V(14)], [U(9), V(16)], [U(7), V(16)]], cols, lights, false);
          continue;
        }

        // cubos opacos y cutout
        const t = uvs[id];
        const vary = VARY[id];
        const hb = vary ? hashAt(x, y, z) : 0;
        const tinted = TINT[id] && tints;
        if (tinted) { const ti = (x + z * CHUNK) * 3; tintRGB[0] = tints[ti]; tintRGB[1] = tints[ti + 1]; tintRGB[2] = tints[ti + 2]; }
        const an = ANIM[id];
        for (let k = 0; k < 4; k++) anim4[k] = an;
        let frontFace = -1;
        if (FACING[id]) {
          const be = center.be && center.be.get(x + z * CHUNK + y * CHUNK * CHUNK);
          frontFace = FRONT_FACE[be ? be.facing || 0 : 0];
        }
        for (let fi = 0; fi < 6; fi++) {
          const f = FACES[fi];
          const ncell = cell + f.nOff;
          const nid = P[ncell];
          if (OPAQUE[nid]) continue;
          if (r === 2 && nid === id && !LEAFY[id]) continue; // vidrio con vidrio, cactus con cactus
          const uv = fi === frontFace ? t.front : t[f.tex];
          const ao = f.ao;
          let a0 = 0, a1 = 0, a2 = 0, a3 = 0;
          for (let k = 0; k < 4; k++) {
            const c = f.c[k];
            verts[k][0] = x + c[0]; verts[k][1] = y + c[1]; verts[k][2] = z + c[2];
            let fu = f.uv[k];
            if (vary) {
              if (f.tex !== 'side') fu = f.uv[(k + (hb & 3)) & 3];
              else if (vary === 2 && (hb & 4)) fu = [1 - fu[0], fu[1]];
            }
            quv[k][0] = fu[0] ? uv.u1 : uv.u0; quv[k][1] = fu[1] ? uv.v1 : uv.v0;
            const o = ao[k];
            const s1 = OPAQUE[P[ncell + o.s1]], s2 = OPAQUE[P[ncell + o.s2]], cc = OPAQUE[P[ncell + o.c]];
            const aoV = s1 && s2 ? 0 : 3 - (s1 + s2 + cc);
            if (k === 0) a0 = aoV; else if (k === 1) a1 = aoV; else if (k === 2) a2 = aoV; else a3 = aoV;
            cols[k] = f.shade * AO_CURVE[aoV];
            lightAt(ncell, o.s1, o.s2, o.c, lights, k);
          }
          const flip = a0 + a2 < a1 + a3;
          const useTint = tinted && (f.n[1] === 1 || LEAFY[id]);
          opaque.quad(verts, quv, cols, lights, flip, useTint ? tintRGB : NO_TINT, anim4);
        }
      }
    }
  }
  return { opaque: opaque.result(), water: water.result() };
}
