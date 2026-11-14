// Texturas: atlas de bloques (pixel art propio de pixelart.js), sprites de ítems (Kenney, CC0) e íconos de la UI.
import * as THREE from 'three';
import { PAINTERS, Tile, T, crackStages } from './pixelart.js';
import { BLOCKS, ITEMS, isBlockId } from './blocks.js';

const COLS = 16;

export const TILE_INDEX = {};
export let atlasCanvas = null; // v12.5.2: ya no es un lienzo (el atlas es DataTexture); se deja { width, height } para tileUV
export let atlasTexture = null;
export let crackTextures = [];
const tileImages = {}; // nombre -> canvas 16x16
const tileData = {}; // nombre -> Uint8ClampedArray (para partículas)

function tileToCanvas(tile) {
  const c = document.createElement('canvas');
  c.width = T; c.height = T;
  c.getContext('2d').putImageData(new ImageData(tile.data, T, T), 0, 0);
  return c;
}

function nearest(tex) {
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}

// v12.5.0 (nitidez, PLAN_GRAFICOS.md §3.2): cada baldosa va en una celda con 4 px de margen que repiten la baldosa «dando la vuelta»
// (las texturas se pintan enrollables). Así los mipmaps de lejos no mezclan una baldosa con la de al lado
const MARGEN = 4, CELDA = T + 2 * MARGEN;
export function buildAtlas() {
  const names = Object.keys(PAINTERS);
  const rows = Math.ceil(names.length / COLS);
  const W = COLS * CELDA;
  let h = 16; while (h < rows * CELDA) h *= 2;
  atlasCanvas = { width: W, height: h };
  // v12.5.2 (duodécima revisión, §4.2): el atlas se arma a mano en un Uint8Array y no en un lienzo 2D. El lienzo guarda los píxeles
  // transparentes como negro (premultiplicado) y los mipmaps promediaban con ese negro: el pasto, las flores y el vidrio se
  // oscurecían y desaparecían de lejos. Aquí el RGB de cada píxel transparente lleva el color medio de los opacos de su baldosa
  // (sangrado de color) y el alfa sigue en 0
  const data = new Uint8Array(W * h * 4);
  names.forEach((name, i) => {
    const tile = new Tile(name);
    PAINTERS[name](tile);
    const col = i % COLS, row = Math.floor(i / COLS), cx = col * CELDA, cy = row * CELDA, d = tile.data;
    let r = 0, gg = 0, b = 0, n = 0;
    for (let k = 0; k < d.length; k += 4) if (d[k + 3] > 0) { r += d[k]; gg += d[k + 1]; b += d[k + 2]; n++; }
    const mr = n ? r / n : 128, mg = n ? gg / n : 128, mb = n ? b / n : 128;
    for (let y = 0; y < CELDA; y++) for (let x = 0; x < CELDA; x++) {
      const tx = (((x - MARGEN) % T) + T) % T, ty = (((y - MARGEN) % T) + T) % T, s = (ty * T + tx) * 4, o = ((cy + y) * W + cx + x) * 4;
      const a = d[s + 3];
      data[o] = a ? d[s] : mr; data[o + 1] = a ? d[s + 1] : mg; data[o + 2] = a ? d[s + 2] : mb; data[o + 3] = a;
    }
    TILE_INDEX[name] = i;
    tileImages[name] = tileToCanvas(tile);
    tileData[name] = tile.data;
  });
  atlasTexture = nearest(new THREE.DataTexture(data, W, h, THREE.RGBAFormat));
  atlasTexture.flipY = false;
  atlasTexture.needsUpdate = true;
  crackTextures = crackStages().map((t) => nearest(new THREE.CanvasTexture(tileToCanvas(t))));
}

// UV del tile en el atlas (flipY = false: v crece hacia abajo en la imagen)
export function tileUV(name) {
  const i = TILE_INDEX[name];
  const col = i % COLS, row = Math.floor(i / COLS);
  const w = atlasCanvas.width, h = atlasCanvas.height;
  const e = 0.01, x0 = col * CELDA + MARGEN, y0 = row * CELDA + MARGEN;
  return { u0: (x0 + e) / w, u1: (x0 + T - e) / w, v0: (y0 + e) / h, v1: (y0 + T - e) / h };
}

export function tileCanvas(name) { return tileImages[name]; }

// v12.5.0: la nitidez de lejos (Medio en adelante): de cerca sigue el píxel (mag Nearest); de lejos, mipmaps y anisotropía, que
// quitan el centelleo de las hojas, la arena y la piedra. En Bajo, todo como siempre (Nearest y sin mipmaps). Recompila la textura
// solo si cambia
let nitidezActual = -1;
export function aplicarNitidez(renderer, aniso) {
  if (!atlasTexture || aniso === nitidezActual) return;
  nitidezActual = aniso;
  const t = atlasTexture;
  t.magFilter = THREE.NearestFilter;
  if (aniso > 0) { t.minFilter = THREE.NearestMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = Math.min(aniso, renderer.capabilities.getMaxAnisotropy()); }
  else { t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.anisotropy = 1; }
  t.needsUpdate = true;
}

// Colores reales del tile (para que las partículas usen pixeles del bloque).
export function tilePixels(name) {
  const d = tileData[name];
  const out = [];
  if (!d) return [[0.5, 0.5, 0.5]];
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 0) out.push([d[i] / 255, d[i + 1] / 255, d[i + 2] / 255]);
  return out.length ? out : [[0.5, 0.5, 0.5]];
}

export function tileColor(name) {
  const px = tilePixels(name);
  const s = [0, 0, 0];
  for (const p of px) { s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; }
  return s.map((v) => v / px.length);
}

// ---------- Sprites de ítems ----------
const ICON = 64;
const spriteCanvases = new Map(); // id -> canvas ICON x ICON

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Ítems sin sprite de Kenney: se dibujan con el mismo estilo plano (formas suaves, 2 tonos + brillo).
function paintFlat(item) {
  const c = document.createElement('canvas');
  c.width = ICON; c.height = ICON;
  const g = c.getContext('2d');
  g.lineCap = 'round'; g.lineJoin = 'round';
  if (item.key === 'stick') {
    g.strokeStyle = '#8a5a2b'; g.lineWidth = 9;
    g.beginPath(); g.moveTo(14, 52); g.lineTo(50, 12); g.stroke();
    g.strokeStyle = '#b07a42'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(13, 49); g.lineTo(47, 11); g.stroke();
    g.fillStyle = '#6e4520';
    g.beginPath(); g.arc(33, 30, 2.5, 0, Math.PI * 2); g.fill();
  } else if (item.key === 'brick') {
    g.fillStyle = '#7d3121';
    g.beginPath(); g.moveTo(10, 30); g.lineTo(40, 18); g.lineTo(56, 26); g.lineTo(26, 40); g.closePath(); g.fill();
    g.fillStyle = '#a64630'; g.fillRect(0, 0, 0, 0);
    g.beginPath(); g.moveTo(10, 30); g.lineTo(26, 40); g.lineTo(26, 50); g.lineTo(10, 40); g.closePath(); g.fill();
    g.fillStyle = '#5e2418';
    g.beginPath(); g.moveTo(26, 40); g.lineTo(56, 26); g.lineTo(56, 36); g.lineTo(26, 50); g.closePath(); g.fill();
    g.fillStyle = '#c4614a';
    g.beginPath(); g.moveTo(14, 30); g.lineTo(40, 20); g.lineTo(44, 22); g.lineTo(18, 32); g.closePath(); g.fill();
  } else if (item.key === 'door') {
    g.fillStyle = '#6e4a24'; g.fillRect(18, 4, 28, 56);
    g.fillStyle = '#8f6234'; g.fillRect(21, 7, 22, 50);
    g.fillStyle = '#a9d2df'; g.fillRect(24, 11, 16, 10);
    g.fillStyle = '#6e4a24'; g.fillRect(31, 11, 2, 10); g.fillRect(24, 26, 16, 3);
    g.fillStyle = '#d7dbe0'; g.fillRect(38, 34, 3, 5);
  } else if (item.key === 'mascarada' || item.mat === 'mascarada') {
    // cabezona de carnaval: cara rosada, cachetes, bigote y sombrero
    g.fillStyle = '#f0b090'; g.beginPath(); g.arc(32, 36, 22, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e85a7a'; g.beginPath(); g.arc(20, 42, 5, 0, Math.PI * 2); g.arc(44, 42, 5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(24, 32, 6, 0, Math.PI * 2); g.arc(40, 32, 6, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1a1a40'; g.beginPath(); g.arc(25, 33, 3, 0, Math.PI * 2); g.arc(41, 33, 3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2a1a10'; g.fillRect(20, 44, 24, 4);
    g.fillStyle = '#c02020'; g.fillRect(26, 50, 12, 4);
    g.fillStyle = '#1a6ad8'; g.fillRect(10, 12, 44, 6); g.fillRect(18, 2, 28, 12);
    g.fillStyle = '#ffd84a'; g.fillRect(18, 10, 28, 3);
  } else if (item.key === 'guaro') {
    g.fillStyle = '#d8e8f0'; g.fillRect(24, 22, 16, 32); g.fillRect(28, 10, 8, 14);
    g.fillStyle = '#c8202a'; g.fillRect(24, 32, 16, 12);
    g.fillStyle = '#fff'; g.font = 'bold 10px monospace'; g.textAlign = 'center'; g.fillText('G', 32, 42);
    g.fillStyle = '#2a2a2a'; g.fillRect(28, 6, 8, 5);
  } else if (item.key === 'racimo_pejibaye' || item.key === 'pejibaye' || item.key === 'pejibaye_mayonesa') {
    if (item.key === 'racimo_pejibaye') { g.fillStyle = '#4a7a2a'; g.fillRect(30, 4, 4, 16); }
    if (item.key === 'pejibaye_mayonesa') { g.fillStyle = '#f0f0ec'; g.beginPath(); g.ellipse(32, 44, 26, 12, 0, 0, Math.PI * 2); g.fill(); }
    const crudo = item.key === 'racimo_pejibaye';
    for (const [x, y] of [[22, 26], [34, 24], [44, 30], [28, 36], [40, 40], [20, 42]]) {
      g.fillStyle = crudo ? '#d84a1a' : '#e8822a'; g.beginPath(); g.ellipse(x, y, 7, 6, 0.4, 0, Math.PI * 2); g.fill();
      g.fillStyle = crudo ? '#f07a3a' : '#f8b060'; g.fillRect(x - 3, y - 3, 3, 2); g.fillStyle = '#5a3a1a'; g.fillRect(x - 1, y - 7, 2, 2);
    }
    if (item.key === 'pejibaye_mayonesa') { g.fillStyle = '#fff8d8'; for (const [x, y] of [[26, 30], [38, 34], [30, 42]]) { g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill(); } }
  } else if (item.key === 'saco_gangoche') {
    g.fillStyle = '#a88a5a'; g.beginPath(); g.moveTo(16, 12); g.lineTo(48, 12); g.lineTo(52, 56); g.lineTo(12, 56); g.fill();
    g.fillStyle = '#7a5a32'; g.fillRect(14, 10, 36, 6); g.strokeStyle = '#8a6a3a'; g.lineWidth = 1; for (let y = 20; y < 56; y += 4) { g.beginPath(); g.moveTo(14, y); g.lineTo(50, y); g.stroke(); }
    g.fillStyle = '#3a6ad8'; g.font = 'bold 12px monospace'; g.fillText('CAFÉ', 19, 38);
  } else if (item.key === 'permiso_todo') {
    g.fillStyle = '#f4ecd0'; g.fillRect(12, 6, 40, 52); g.fillStyle = '#c8b890'; for (let y = 14; y < 40; y += 5) g.fillRect(17, y, 30, 2);
    for (const [x, y, c] of [[20, 44, '#c82a2a'], [32, 46, '#2a5ad8'], [44, 43, '#2aa84a'], [26, 50, '#8a2ad8'], [40, 51, '#c82a2a'], [16, 34, '#2a5ad8'], [46, 30, '#c82a2a']]) { g.strokeStyle = c; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.stroke(); }
  } else if (item.key === 'arco_cintas' || item.key === 'cinta') {
    const cs = ['#e83a3a', '#f0c020', '#2a6ad8', '#2aa84a', '#e85ad8'];
    if (item.key === 'arco_cintas') { g.fillStyle = '#8a5a2a'; g.fillRect(8, 10, 5, 46); g.fillRect(51, 10, 5, 46); g.fillRect(8, 8, 48, 5); cs.forEach((c, i) => { g.fillStyle = c; g.fillRect(16 + i * 7, 13, 4, 22); g.strokeStyle = '#ddd'; g.lineWidth = 1.5; g.beginPath(); g.arc(18 + i * 7, 38, 2.5, 0, Math.PI * 2); g.stroke(); }); }
    else { g.fillStyle = '#e83a3a'; g.beginPath(); g.moveTo(30, 6); g.quadraticCurveTo(44, 26, 30, 44); g.lineTo(26, 44); g.quadraticCurveTo(38, 26, 26, 6); g.fill(); g.strokeStyle = '#ddd'; g.lineWidth = 3; g.beginPath(); g.arc(28, 50, 6, 0, Math.PI * 2); g.stroke(); }
  } else if (item.key === 'carreta_bueyes') {
    g.fillStyle = '#b8202a'; g.fillRect(10, 18, 34, 16); g.fillStyle = '#f0c020'; g.fillRect(10, 18, 34, 3); g.fillRect(10, 31, 34, 3);
    g.fillStyle = '#2a6ad8'; for (const x of [16, 26, 36]) g.fillRect(x, 24, 4, 4);
    const rueda = (x, y) => { for (const [r, c] of [[11, '#3a2410'], [9, '#f0c020'], [6, '#2a6ad8'], [3, '#b8202a']]) { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); } };
    rueda(26, 42); g.fillStyle = '#6a4424'; g.fillRect(44, 26, 14, 3);
    g.fillStyle = '#f0ece4'; g.fillRect(52, 16, 10, 10); g.fillStyle = '#e8e0c8'; g.fillRect(50, 14, 3, 3); g.fillRect(61, 14, 3, 3);
  } else if (item.key === 'peluche_perezoso') {
    g.fillStyle = '#9a7a5a'; g.beginPath(); g.ellipse(32, 38, 15, 16, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(32, 20, 11, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e8d8b8'; g.beginPath(); g.ellipse(32, 21, 8, 6, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#3a2a1a'; g.fillRect(26, 18, 4, 4); g.fillRect(34, 18, 4, 4); g.fillRect(30, 23, 4, 2);
    g.fillStyle = '#7a5a3a'; g.fillRect(14, 30, 6, 14); g.fillRect(44, 30, 6, 14);
  } else if (item.key === 'trofeo_pesca') {
    g.fillStyle = '#e8b830'; g.fillRect(22, 44, 20, 6); g.fillRect(29, 34, 6, 10);
    g.fillStyle = '#3a8ad8'; g.beginPath(); g.ellipse(32, 22, 16, 8, 0.3, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(14, 18); g.lineTo(8, 10); g.lineTo(8, 26); g.fill(); g.fillStyle = '#fff'; g.fillRect(40, 18, 3, 3);
    g.fillStyle = '#c89820'; g.fillRect(20, 50, 24, 6);
  } else if (item.key === 'yuca') {
    g.save(); g.translate(32, 34); g.rotate(-0.6); g.fillStyle = '#7a4a26'; g.beginPath(); g.ellipse(0, 0, 9, 24, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f4ead0'; g.beginPath(); g.ellipse(0, -22, 7, 3, 0, 0, Math.PI * 2); g.fill(); g.restore();
  } else if (item.key === 'vigoron') {
    g.fillStyle = '#3a8a3a'; g.beginPath(); g.ellipse(32, 38, 26, 16, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f0e2b0'; g.fillRect(16, 30, 10, 12); g.fillRect(28, 28, 10, 12);
    g.fillStyle = '#b8682a'; g.fillRect(40, 30, 10, 8); g.fillRect(30, 42, 8, 6); g.fillStyle = '#d8f0a8'; g.fillRect(20, 44, 14, 4); g.fillStyle = '#e83a3a'; g.fillRect(42, 40, 5, 5);
  } else if (item.key === 'rosquillas') {
    for (const [x, y] of [[22, 26], [42, 28], [32, 44]]) { g.strokeStyle = '#e0a840'; g.lineWidth = 7; g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.stroke(); g.strokeStyle = '#f4d070'; g.lineWidth = 2; g.beginPath(); g.arc(x - 1, y - 1, 9, 3.6, 5.2); g.stroke(); }
  } else if (item.key === 'tanelas') {
    for (const [x, y] of [[20, 24], [40, 40]]) { g.fillStyle = '#d8983a'; g.beginPath(); g.ellipse(x, y, 13, 10, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#7a3a1a'; g.beginPath(); g.ellipse(x, y, 6, 4, 0, 0, Math.PI * 2); g.fill(); }
  } else if (item.key === 'arroz_con_pollo') {
    g.fillStyle = '#e8e8ec'; g.beginPath(); g.ellipse(32, 40, 26, 14, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e8b830'; g.beginPath(); g.ellipse(32, 36, 20, 10, 0, 0, Math.PI * 2); g.fill();
    for (const [x, y, c] of [[24, 34, '#e85a3a'], [38, 32, '#3aa84a'], [32, 38, '#c8783a'], [42, 38, '#e85a3a']]) { g.fillStyle = c; g.fillRect(x, y, 4, 3); }
  } else if (item.key === 'tabla_surf') {
    g.save(); g.translate(32, 32); g.rotate(-0.7);
    g.fillStyle = '#f4f0e0'; g.beginPath(); g.ellipse(0, 0, 9, 27, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2a9ad8'; g.fillRect(-2, -24, 4, 48); g.fillStyle = '#e8603a'; g.beginPath(); g.ellipse(0, -20, 6, 6, 0, 0, Math.PI * 2); g.fill();
    g.restore();
  } else if (item.key === 'bandera_circuito') {
    g.fillStyle = '#5a3a1a'; g.fillRect(14, 8, 4, 50);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 5; x++) { g.fillStyle = (x + y) % 2 ? '#111' : '#f4f4f4'; g.fillRect(18 + x * 7, 10 + y * 6, 7, 6); }
  } else if (item.key === 'avioneta') {
    g.fillStyle = '#e8e8ec'; g.fillRect(8, 28, 48, 8); g.fillRect(28, 12, 8, 40); g.fillRect(22, 48, 20, 5);
    g.fillStyle = '#c82a2a'; g.fillRect(8, 28, 6, 8); g.fillRect(50, 28, 6, 8); g.fillRect(30, 46, 4, 8);
    g.fillStyle = '#7ab8e0'; g.fillRect(29, 18, 6, 6); g.fillStyle = '#3a3a40'; g.fillRect(28, 8, 8, 4);
    g.fillStyle = '#2a2a2e'; g.fillRect(20, 6, 24, 2);
  } else if (item.key === 'parapente') {
    const cs = ['#e83a3a', '#f8f0e0', '#2a6ad8', '#f8f0e0', '#e8b020'];
    cs.forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(32, 40, 28 - i * 0, Math.PI + i * (Math.PI / 5), Math.PI + (i + 1) * (Math.PI / 5)); g.lineTo(32, 40); g.fill(); });
    g.fillStyle = '#f6edd6'; g.beginPath(); g.arc(32, 40, 16, Math.PI, 0); g.fill();
    g.strokeStyle = '#bbb'; g.lineWidth = 1; for (const x of [8, 20, 44, 56]) { g.beginPath(); g.moveTo(x, 38); g.lineTo(32, 58); g.stroke(); }
    g.fillStyle = '#3a2a18'; g.fillRect(29, 54, 6, 6);
  } else if (item.key === 'papalote') {
    g.fillStyle = '#e83030'; g.beginPath(); g.moveTo(30, 6); g.lineTo(50, 26); g.lineTo(30, 50); g.lineTo(10, 26); g.fill();
    g.fillStyle = '#f0c020'; g.beginPath(); g.moveTo(30, 6); g.lineTo(50, 26); g.lineTo(30, 26); g.fill();
    g.fillStyle = '#2a6ad8'; g.beginPath(); g.moveTo(30, 26); g.lineTo(10, 26); g.lineTo(30, 50); g.fill();
    g.strokeStyle = '#f4f0e0'; g.lineWidth = 2; g.beginPath(); g.moveTo(30, 50); g.quadraticCurveTo(40, 56, 52, 60); g.stroke();
    for (const [x, y, c] of [[36, 54, '#2aa84a'], [44, 57, '#e83030']]) { g.fillStyle = c; g.fillRect(x - 3, y - 2, 6, 4); }
  } else if (item.key === 'trompo') {
    g.fillStyle = '#c87a3a'; g.beginPath(); g.moveTo(14, 22); g.lineTo(50, 22); g.lineTo(32, 54); g.fill();
    g.fillStyle = '#d83030'; g.fillRect(14, 14, 36, 9); g.fillStyle = '#2a6ad8'; g.fillRect(18, 28, 28, 4);
    g.fillStyle = '#888'; g.fillRect(31, 52, 3, 8);
  } else if (item.key === 'chumicos') {
    for (const [x, y, c] of [[22, 26, '#3a8ae8'], [40, 24, '#e84a4a'], [30, 42, '#3ac86a'], [46, 42, '#e8c03a']]) { g.fillStyle = c; g.beginPath(); g.arc(x, y, 8, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(x - 4, y - 5, 3, 3); }
  } else if (item.key === 'silbato_reto') {
    g.fillStyle = '#c8ccd0'; g.fillRect(14, 26, 30, 16); g.beginPath(); g.arc(40, 34, 12, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#5a5e64'; g.fillRect(8, 28, 8, 8); g.fillStyle = '#e8ecf0'; g.fillRect(18, 28, 10, 3);
    g.strokeStyle = '#c82020'; g.lineWidth = 3; g.beginPath(); g.moveTo(10, 32); g.quadraticCurveTo(4, 50, 22, 56); g.stroke();
  } else if (item.key === 'copa_reto') {
    g.fillStyle = '#e8b830'; g.beginPath(); g.moveTo(16, 10); g.lineTo(48, 10); g.lineTo(44, 30); g.quadraticCurveTo(32, 40, 20, 30); g.fill();
    g.fillRect(29, 36, 6, 10); g.fillRect(20, 46, 24, 6); g.fillStyle = '#fff0a0'; g.fillRect(22, 14, 5, 12);
    g.strokeStyle = '#c89820'; g.lineWidth = 3; g.beginPath(); g.arc(14, 20, 6, Math.PI * 0.5, Math.PI * 1.5); g.stroke(); g.beginPath(); g.arc(50, 20, 6, -Math.PI * 0.5, Math.PI * 0.5); g.stroke();
  } else if (item.key === 'mechon_congo') {
    g.fillStyle = '#171311'; g.beginPath(); g.moveTo(32, 8); g.quadraticCurveTo(54, 24, 40, 56); g.lineTo(24, 56); g.quadraticCurveTo(10, 24, 32, 8); g.fill();
    g.strokeStyle = '#7a5226'; g.lineWidth = 3; for (const x of [26, 32, 38]) { g.beginPath(); g.moveTo(x, 18); g.quadraticCurveTo(x + 6, 36, x - 2, 54); g.stroke(); }
    g.fillStyle = '#c8a040'; g.fillRect(24, 50, 16, 6);
  } else if (item.key === 'pina' || item.key === 'corona_pina') {
    if (item.key === 'pina') {
      g.fillStyle = '#d89a28'; g.beginPath(); g.ellipse(32, 40, 13, 16, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#8a5a14'; g.lineWidth = 2; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(20, 32 + k * 6); g.lineTo(44, 44 + k * 6); g.stroke(); g.beginPath(); g.moveTo(44, 32 + k * 6); g.lineTo(20, 44 + k * 6); g.stroke(); }
    }
    g.fillStyle = '#4a8a3a'; for (const [x, a] of [[32, 0], [26, -0.4], [38, 0.4], [22, -0.8], [42, 0.8]]) { g.save(); g.translate(x, item.key === 'pina' ? 26 : 44); g.rotate(a); g.fillRect(-2, -18, 4, 20); g.restore(); }
  } else if (item.key === 'fresco_pina') {
    g.fillStyle = '#d8e8f0'; g.fillRect(20, 14, 24, 38); g.fillStyle = '#f0c840'; g.fillRect(22, 22, 20, 28);
    g.fillStyle = '#fff8c0'; g.fillRect(24, 24, 6, 4); g.fillStyle = '#e04040'; g.fillRect(36, 8, 3, 20);
  } else if (item.key === 'cajeta_pina') {
    g.fillStyle = '#c08030'; g.beginPath(); g.arc(32, 34, 16, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e8b040'; g.beginPath(); g.arc(32, 32, 12, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f8e080'; g.fillRect(26, 28, 6, 3);
  } else if (item.key === 'fragmento_meteorito') {
    g.fillStyle = '#2a2630'; g.beginPath(); g.moveTo(14, 40); g.lineTo(24, 16); g.lineTo(44, 12); g.lineTo(52, 32); g.lineTo(40, 52); g.lineTo(20, 52); g.fill();
    g.fillStyle = '#ff8a30'; g.fillRect(28, 24, 4, 4); g.fillStyle = '#ffd060'; g.fillRect(38, 34, 4, 4); g.fillStyle = '#9ad0ff'; g.fillRect(24, 40, 4, 4);
  } else if (item.key === 'escama_sirena') {
    g.fillStyle = '#2aa8a0'; g.beginPath(); g.moveTo(32, 8); g.quadraticCurveTo(56, 30, 32, 56); g.quadraticCurveTo(8, 30, 32, 8); g.fill();
    g.fillStyle = '#7af0e8'; g.beginPath(); g.moveTo(32, 14); g.quadraticCurveTo(48, 30, 32, 48); g.quadraticCurveTo(22, 30, 32, 14); g.fill(); g.fillStyle = '#ffffff'; g.fillRect(28, 22, 4, 4);
  } else if (item.key === 'red_pesca_item') {
    g.strokeStyle = '#d8d0b0'; g.lineWidth = 2; for (let k = 0; k <= 5; k++) { g.beginPath(); g.moveTo(10 + k * 9, 12); g.lineTo(14 + k * 8, 54); g.stroke(); g.beginPath(); g.moveTo(10, 12 + k * 8.4); g.lineTo(54, 14 + k * 8); g.stroke(); }
    g.fillStyle = '#e85a2a'; for (const [x, y] of [[10, 12], [54, 12], [10, 54], [54, 54]]) { g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill(); }
  } else if (item.key === 'cartelito') {
    g.fillStyle = '#c8a070'; g.fillRect(10, 18, 44, 26); g.strokeStyle = '#7a5230'; g.lineWidth = 3; g.strokeRect(10, 18, 44, 26); g.fillStyle = '#3a2a1a'; g.fillRect(18, 28, 28, 3); g.fillRect(18, 34, 20, 3);
    g.strokeStyle = '#d82a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(14, 18); g.lineTo(32, 6); g.lineTo(50, 18); g.stroke();
  } else if (item.key === 'cajuela' || item.key === 'cajuela_llena') {
    g.fillStyle = '#b8884a'; g.beginPath(); g.moveTo(12, 24); g.lineTo(52, 24); g.lineTo(46, 54); g.lineTo(18, 54); g.fill();
    g.strokeStyle = '#8a5a2a'; g.lineWidth = 2; for (let y = 30; y < 54; y += 6) { g.beginPath(); g.moveTo(14, y); g.lineTo(50, y); g.stroke(); } for (let x = 20; x < 48; x += 7) { g.beginPath(); g.moveTo(x, 24); g.lineTo(x - 1, 54); g.stroke(); }
    g.strokeStyle = '#6a4220'; g.lineWidth = 3; g.beginPath(); g.moveTo(14, 24); g.quadraticCurveTo(32, 4, 50, 24); g.stroke();
    if (item.key === 'cajuela_llena') { g.fillStyle = '#c81e1e'; for (const [x, y] of [[20, 22], [27, 19], [34, 21], [41, 20], [24, 25], [31, 24], [38, 25], [45, 23]]) { g.beginPath(); g.arc(x, y, 3.2, 0, Math.PI * 2); g.fill(); } }
  } else if (item.key === 'batea') {
    g.fillStyle = '#7a4a22'; g.beginPath(); g.ellipse(32, 36, 26, 14, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#9a6a3a'; g.beginPath(); g.ellipse(32, 33, 20, 9, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#e8c040'; g.fillRect(30, 32, 3, 3); g.fillRect(36, 34, 2, 2);
  } else if (item.key === 'pepita') {
    g.fillStyle = '#c8962a'; g.beginPath(); g.moveTo(20, 40); g.lineTo(28, 24); g.lineTo(42, 22); g.lineTo(46, 36); g.lineTo(36, 46); g.fill(); g.fillStyle = '#f4d860'; g.fillRect(30, 28, 6, 4); g.fillRect(26, 34, 4, 3);
  } else if (item.key === 'lancha') {
    g.fillStyle = '#f4f0e8'; g.beginPath(); g.moveTo(6, 30); g.lineTo(58, 30); g.lineTo(50, 46); g.lineTo(12, 46); g.fill(); g.fillStyle = '#2a6ac8'; g.fillRect(10, 36, 44, 4);
    g.fillStyle = '#2a2a30'; g.fillRect(2, 22, 8, 12); g.fillStyle = '#c82a2a'; g.fillRect(2, 20, 8, 4); g.fillStyle = '#5ab0f0'; g.fillRect(4, 48, 56, 4);
  } else if (item.key === 'bicicleta' || item.key === 'moto') {
    const moto = item.key === 'moto';
    g.strokeStyle = '#1a1a1a'; g.lineWidth = moto ? 6 : 4; for (const x of [16, 48]) { g.beginPath(); g.arc(x, 44, 11, 0, Math.PI * 2); g.stroke(); }
    g.strokeStyle = moto ? '#c82a2a' : '#2a6ac8'; g.lineWidth = moto ? 8 : 3; g.beginPath(); g.moveTo(16, 44); g.lineTo(28, 26); g.lineTo(44, 26); g.lineTo(48, 44); g.moveTo(28, 26); g.lineTo(32, 44); g.stroke();
    g.fillStyle = '#2a2a2a'; g.fillRect(24, 20, 10, 4); g.fillRect(42, 16, 4, 10);
  } else if (item.key === 'plano_adobe' || item.key === 'plano_madera' || item.key === 'plano_rancho' || item.key === 'plano_bahareque') {
    g.fillStyle = '#2a5a9a'; g.fillRect(8, 8, 48, 48); g.strokeStyle = '#d8ecff'; g.lineWidth = 2; g.strokeRect(12, 12, 40, 40);
    g.beginPath(); g.moveTo(18, 34); g.lineTo(32, 20); g.lineTo(46, 34); g.moveTo(20, 34); g.lineTo(20, 48); g.lineTo(44, 48); g.lineTo(44, 34); g.moveTo(29, 48); g.lineTo(29, 40); g.lineTo(35, 40); g.lineTo(35, 48); g.stroke();
    g.fillStyle = item.key === 'plano_adobe' ? '#e0a060' : item.key === 'plano_madera' ? '#6ab0e8' : item.key === 'plano_bahareque' ? '#f2ede0' : '#e8d070'; g.fillRect(44, 12, 8, 8);
  } else if (item.key === 'pan_casero') {
    g.fillStyle = '#c88a3a'; g.beginPath(); g.ellipse(32, 38, 24, 16, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#e0a854'; g.beginPath(); g.ellipse(32, 32, 20, 12, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#9a6020'; g.lineWidth = 2; for (const x of [22, 32, 42]) { g.beginPath(); g.moveTo(x - 4, 26); g.lineTo(x + 4, 38); g.stroke(); }
  } else if (item.key === 'agua_de_sapo') {
    g.fillStyle = '#e8f0f4'; g.fillRect(20, 12, 24, 44); g.fillStyle = '#c89a40'; g.fillRect(22, 24, 20, 30); g.fillStyle = '#7ac040'; g.beginPath(); g.arc(40, 16, 6, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f0e8c0'; g.fillRect(24, 28, 4, 4);
  } else if (item.key === 'arroz_con_leche') {
    g.fillStyle = '#c8a070'; g.beginPath(); g.ellipse(32, 42, 22, 12, 0, 0, Math.PI); g.fill(); g.fillStyle = '#f4f0e4'; g.beginPath(); g.ellipse(32, 40, 20, 8, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#a06a30'; for (const [x, y] of [[26, 39], [34, 41], [40, 38]]) g.fillRect(x, y, 3, 2);
  } else if (item.key === 'libro_recetas') {
    g.fillStyle = '#7a2a1a'; g.fillRect(12, 10, 40, 46); g.fillStyle = '#f0e8d0'; g.fillRect(16, 12, 34, 42); g.fillStyle = '#7a2a1a'; g.fillRect(12, 10, 6, 46); g.fillStyle = '#c8a040'; g.fillRect(24, 22, 20, 3); g.fillRect(24, 30, 16, 2); g.fillRect(24, 36, 18, 2);
  } else if (item.key === 'mochila') {
    g.fillStyle = '#7a4a22'; g.fillRect(14, 16, 36, 40); g.fillStyle = '#8a5a2e'; g.fillRect(16, 30, 32, 22); g.fillStyle = '#5a3416'; g.fillRect(20, 8, 24, 10); g.fillRect(14, 28, 36, 4);
    g.fillStyle = '#c8a040'; g.fillRect(30, 30, 4, 6); g.strokeStyle = '#5a3416'; g.lineWidth = 3; g.beginPath(); g.moveTo(22, 16); g.quadraticCurveTo(32, 2, 42, 16); g.stroke();
  } else if (item.key === 'brocha') {
    g.fillStyle = '#9a6a3a'; g.save(); g.translate(32, 32); g.rotate(-0.7); g.fillRect(-4, 0, 8, 30); g.fillStyle = '#b8b8c0'; g.fillRect(-7, -6, 14, 8); g.fillStyle = '#e8d8b0'; g.fillRect(-7, -22, 14, 16); g.fillStyle = '#5ab0e0'; g.fillRect(-7, -24, 14, 6); g.restore();
  } else if (item.key === 'mapa_tesoro') {
    g.fillStyle = '#e8d4a0'; g.fillRect(8, 10, 48, 44); g.fillStyle = '#c8a870'; g.fillRect(8, 10, 6, 44); g.fillRect(50, 10, 6, 44);
    g.strokeStyle = '#8a6a3a'; g.lineWidth = 2; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(16, 46); g.quadraticCurveTo(26, 20, 40, 30); g.stroke(); g.setLineDash([]);
    g.strokeStyle = '#c82020'; g.lineWidth = 4; g.beginPath(); g.moveTo(36, 24); g.lineTo(46, 34); g.moveTo(46, 24); g.lineTo(36, 34); g.stroke();
  } else if (item.key === 'careta') {
    g.fillStyle = '#2a8ad0'; g.fillRect(10, 24, 44, 22); g.fillStyle = '#b8e8ff'; g.fillRect(14, 28, 16, 14); g.fillRect(34, 28, 16, 14);
    g.fillStyle = '#ffd030'; g.fillRect(52, 6, 6, 32); g.fillStyle = '#1a1a1a'; g.fillRect(4, 30, 6, 8); g.fillRect(54, 30, 6, 4);
  } else if (item.key === 'venda') {
    g.fillStyle = '#f4f0e8'; g.beginPath(); g.ellipse(32, 34, 18, 18, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#d8d0c0'; g.beginPath(); g.ellipse(32, 34, 7, 7, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f4f0e8'; g.fillRect(44, 34, 14, 10); g.strokeStyle = '#c8c0b0'; g.lineWidth = 1; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(32, 34, 10 + k * 3, 0, Math.PI * 2); g.stroke(); }
  } else if (item.key === 'alcohol' || item.key === 'suero') {
    const s = item.key === 'suero';
    g.fillStyle = s ? '#e8f4ff' : '#f0f0f4'; g.fillRect(20, 18, 24, 40); g.fillStyle = s ? '#3a8ad8' : '#3a6ad0'; g.fillRect(26, 8, 12, 10);
    g.fillStyle = s ? '#ff9a30' : '#5ab0f0'; g.fillRect(20, 28, 24, 16); g.fillStyle = '#ffffff'; g.fillRect(29, 31, 6, 10); g.fillRect(27, 34, 10, 4);
  } else if (item.key === 'botiquin') {
    g.fillStyle = '#e8e8ea'; g.fillRect(8, 18, 48, 36); g.fillStyle = '#8a8a90'; g.fillRect(24, 10, 16, 8); g.fillStyle = '#d82a2a'; g.fillRect(28, 24, 8, 24); g.fillRect(20, 32, 24, 8);
  } else if (item.key === 'honda') {
    g.strokeStyle = '#7a4a22'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(32, 58); g.lineTo(32, 34); g.lineTo(18, 12); g.moveTo(32, 34); g.lineTo(46, 12); g.stroke();
    g.strokeStyle = '#c8a070'; g.lineWidth = 2; g.beginPath(); g.moveTo(18, 12); g.quadraticCurveTo(32, 30, 46, 12); g.stroke(); g.fillStyle = '#5a3a1a'; g.fillRect(28, 20, 8, 6);
  } else if (item.key === 'cerbatana') {
    g.strokeStyle = '#9ab04a'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(10, 54); g.lineTo(54, 10); g.stroke();
    g.strokeStyle = '#6a8030'; g.lineWidth = 7; g.lineCap = 'butt'; for (const k of [0.3, 0.6]) { g.beginPath(); g.moveTo(10 + 44 * k - 2, 54 - 44 * k - 2); g.lineTo(10 + 44 * k + 2, 54 - 44 * k + 2); g.stroke(); }
  } else if (item.key === 'dardo') {
    g.strokeStyle = '#d8c8a0'; g.lineWidth = 3; g.beginPath(); g.moveTo(14, 50); g.lineTo(50, 14); g.stroke(); g.fillStyle = '#40c040'; g.beginPath(); g.arc(50, 14, 4, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f0e8d8'; g.beginPath(); g.arc(14, 50, 6, 0, Math.PI * 2); g.fill();
  } else if (item.key === 'jabalina') {
    g.strokeStyle = '#8a5a2a'; g.lineWidth = 5; g.beginPath(); g.moveTo(8, 56); g.lineTo(46, 18); g.stroke(); g.fillStyle = '#c8c8d0'; g.beginPath(); g.moveTo(42, 14); g.lineTo(58, 6); g.lineTo(50, 22); g.fill(); g.fillStyle = '#d03020'; g.fillRect(38, 22, 6, 6);
  } else if (item.key === 'colmillo_jaguar' || item.key === 'diente_cocodrilo') {
    const croc = item.key === 'diente_cocodrilo';
    g.fillStyle = croc ? '#e8e0c0' : '#f4ecd8'; g.beginPath(); g.moveTo(22, 10); g.quadraticCurveTo(46, 14, 40, 58); g.quadraticCurveTo(30, 34, 22, 10); g.fill();
    g.strokeStyle = croc ? '#5a6a3a' : '#c89a40'; g.lineWidth = 3; g.beginPath(); g.moveTo(16, 12); g.lineTo(30, 10); g.stroke();
  } else if (item.key === 'veneno_reina') {
    g.fillStyle = '#c8d8e0'; g.fillRect(24, 8, 16, 8); g.beginPath(); g.ellipse(32, 40, 16, 18, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#4ad040'; g.beginPath(); g.ellipse(32, 44, 13, 12, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#1a3a10'; g.fillRect(26, 38, 3, 3); g.fillRect(35, 38, 3, 3); g.fillRect(28, 46, 8, 2);
  } else if (item.key === 'machete_doble') {
    g.fillStyle = '#5a3a1a'; g.fillRect(8, 46, 16, 8); g.fillStyle = '#d8d8e0'; g.beginPath(); g.moveTo(22, 44); g.lineTo(58, 12); g.lineTo(54, 8); g.lineTo(20, 38); g.fill();
    g.fillStyle = '#a0a0b0'; g.beginPath(); g.moveTo(22, 44); g.lineTo(58, 12); g.lineTo(60, 18); g.lineTo(26, 48); g.fill(); g.fillStyle = '#f4ecd8'; g.fillRect(14, 42, 4, 4);
  } else if (item.key === 'cantimplora' || item.key === 'cantimplora_vacia') {
    g.fillStyle = '#7a5230'; g.beginPath(); g.ellipse(32, 40, 16, 18, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(32, 18, 8, 9, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#9a6a3a'; g.beginPath(); g.ellipse(27, 36, 5, 9, -0.3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#3a2410'; g.fillRect(29, 6, 6, 5); g.strokeStyle = '#c8a060'; g.lineWidth = 2; g.beginPath(); g.moveTo(18, 30); g.quadraticCurveTo(32, 14, 46, 30); g.stroke();
    if (item.key === 'cantimplora') { g.fillStyle = '#5ab0f0'; g.beginPath(); g.arc(44, 50, 6, 0, Math.PI * 2); g.fill(); }
  } else if (['sabila', 'manzanilla', 'hierbabuena', 'jengibre'].includes(item.key)) {
    if (item.key === 'sabila') { g.fillStyle = '#4a9a5a'; for (const a of [-0.6, -0.2, 0.2, 0.6]) { g.save(); g.translate(32, 54); g.rotate(a); g.beginPath(); g.moveTo(-4, 0); g.lineTo(0, -38); g.lineTo(4, 0); g.fill(); g.restore(); } g.fillStyle = '#a8e0b0'; g.fillRect(31, 24, 2, 20); }
    if (item.key === 'manzanilla') { g.strokeStyle = '#4a8a2a'; g.lineWidth = 2; for (const x of [20, 32, 44]) { g.beginPath(); g.moveTo(x, 58); g.lineTo(x, 30); g.stroke(); g.fillStyle = '#ffffff'; for (let k = 0; k < 6; k++) { const a = k * 1.05; g.beginPath(); g.arc(x + Math.cos(a) * 5, 26 + Math.sin(a) * 5, 3, 0, Math.PI * 2); g.fill(); } g.fillStyle = '#f0c020'; g.beginPath(); g.arc(x, 26, 3, 0, Math.PI * 2); g.fill(); } }
    if (item.key === 'hierbabuena') { g.strokeStyle = '#3a7a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(32, 60); g.lineTo(32, 8); g.stroke(); g.fillStyle = '#5ab84a'; for (let k = 0; k < 4; k++) for (const s of [-1, 1]) { g.beginPath(); g.ellipse(32 + s * 9, 14 + k * 12, 9, 5, s * 0.5, 0, Math.PI * 2); g.fill(); } }
    if (item.key === 'jengibre') { g.fillStyle = '#c8a060'; for (const [x, y, rx, ry] of [[28, 38, 14, 9], [42, 30, 8, 6], [18, 30, 7, 5], [36, 48, 7, 5]]) { g.beginPath(); g.ellipse(x, y, rx, ry, 0.3, 0, Math.PI * 2); g.fill(); } g.fillStyle = '#e8d090'; g.fillRect(24, 36, 8, 3); }
  } else if (item.key === 'bola') {
    g.fillStyle = '#f4f4f4'; g.beginPath(); g.arc(32, 34, 20, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1a1a1c'; for (const [x, y, r] of [[32, 34, 6], [18, 26, 4], [46, 26, 4], [22, 48, 4], [42, 48, 4]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = '#9a9aa0'; g.lineWidth = 2; g.beginPath(); g.arc(32, 34, 20, 0, Math.PI * 2); g.stroke();
  } else if (item.key === 'corazon_monte') {
    g.fillStyle = '#3a2a1a'; g.beginPath(); g.moveTo(32, 54); g.bezierCurveTo(4, 36, 10, 12, 32, 22); g.bezierCurveTo(54, 12, 60, 36, 32, 54); g.fill();
    g.fillStyle = '#4e8a2e'; g.beginPath(); g.moveTo(32, 48); g.bezierCurveTo(12, 34, 16, 18, 32, 27); g.bezierCurveTo(48, 18, 52, 34, 32, 48); g.fill();
    g.fillStyle = '#9aff6a'; g.fillRect(28, 30, 8, 8); g.fillStyle = '#6a5236'; g.fillRect(31, 8, 2, 14);
  } else if (item.key === 'repelente') {
    g.fillStyle = '#e8f0d8'; g.fillRect(22, 18, 20, 36); g.fillStyle = '#7ab83a'; g.fillRect(22, 30, 20, 12);
    g.fillStyle = '#3a3a40'; g.fillRect(26, 10, 12, 8); g.fillStyle = '#f4f040'; g.beginPath(); g.arc(32, 36, 4, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#c82020'; g.lineWidth = 2; g.beginPath(); g.moveTo(44, 14); g.lineTo(54, 6); g.moveTo(46, 18); g.lineTo(56, 14); g.stroke();
  } else if (item.key === 'arroz') {
    g.fillStyle = '#d8c8a0'; g.fillRect(16, 18, 32, 36); g.fillStyle = '#c8b080'; g.fillRect(16, 18, 32, 6); g.fillStyle = '#2a6ad8'; g.fillRect(20, 30, 24, 10);
    g.fillStyle = '#f4f0e4'; for (let k = 0; k < 10; k++) g.fillRect(20 + (k * 7) % 24, 44 + (k % 3) * 3, 3, 2);
  } else if (['arroz_con_leche', 'sopa_negra', 'cafe_con_leche'].includes(item.key)) {
    // en taza o en plato hondo
    const fill = item.key === 'sopa_negra' ? '#2a1a14' : item.key === 'cafe_con_leche' ? '#a8784a' : '#f4ecd8';
    g.fillStyle = '#e8e4dc'; g.beginPath(); g.ellipse(32, 40, 22, 12, 0, 0, Math.PI); g.fill(); g.fillRect(10, 32, 44, 8);
    g.fillStyle = fill; g.beginPath(); g.ellipse(32, 32, 20, 6, 0, 0, Math.PI * 2); g.fill();
    if (item.key === 'sopa_negra') { g.fillStyle = '#f4f0e0'; g.beginPath(); g.ellipse(36, 31, 6, 3, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f0c030'; g.beginPath(); g.arc(36, 31, 2, 0, Math.PI * 2); g.fill(); }
    if (item.key === 'arroz_con_leche') { g.fillStyle = '#a0682a'; g.fillRect(28, 30, 8, 2); g.fillRect(24, 33, 4, 1); }
    if (item.key === 'cafe_con_leche') { g.fillStyle = '#e8e4dc'; g.fillRect(52, 30, 6, 10); }
  } else if (item.key === 'gallo_picadillo') {
    g.fillStyle = '#e8d8a0'; g.beginPath(); g.ellipse(32, 34, 24, 14, -0.3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#c8a050'; g.beginPath(); g.ellipse(32, 34, 24, 14, -0.3, 0, Math.PI * 2); g.lineWidth = 2; g.strokeStyle = '#a8803a'; g.stroke();
    g.fillStyle = '#6a8a2a'; for (let k = 0; k < 8; k++) g.fillRect(22 + (k * 5) % 22, 28 + (k % 3) * 4, 4, 3);
    g.fillStyle = '#c87030'; for (let k = 0; k < 5; k++) g.fillRect(25 + (k * 7) % 18, 31 + (k % 2) * 5, 3, 3);
  } else if (item.key === 'platano_queso') {
    g.fillStyle = '#c87a20'; g.beginPath(); g.ellipse(32, 36, 24, 9, 0.2, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f4eed8'; g.fillRect(22, 28, 20, 8); g.fillStyle = '#e8b040'; g.fillRect(24, 26, 4, 3);
  } else if (item.key === 'tres_leches') {
    g.fillStyle = '#f0e0b0'; g.fillRect(14, 28, 36, 20); g.fillStyle = '#fffaf0'; g.fillRect(14, 24, 36, 6);
    g.fillStyle = '#e8d090'; g.fillRect(14, 48, 36, 4); g.fillStyle = '#d82030'; g.beginPath(); g.arc(32, 23, 3, 0, Math.PI * 2); g.fill();
  } else if (item.key === 'cacao') {
    g.fillStyle = '#5a2e14'; for (const [x, y] of [[22, 30], [34, 26], [40, 38], [26, 42], [32, 36]]) { g.beginPath(); g.ellipse(x, y, 7, 5, 0.5, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#8a4a20'; for (const [x, y] of [[20, 28], [32, 24], [38, 36], [24, 40], [30, 34]]) g.fillRect(x, y, 4, 2);
  } else if (item.key === 'chocolate') {
    g.fillStyle = '#3a1c0c'; g.fillRect(12, 16, 40, 32);
    g.fillStyle = '#5a2e14'; for (let x = 14; x < 50; x += 10) for (let y = 18; y < 46; y += 10) g.fillRect(x, y, 8, 8);
    g.fillStyle = '#e8d8b0'; g.fillRect(12, 40, 40, 8); g.fillStyle = '#a82020'; g.fillRect(12, 42, 40, 3);
  } else if (item.key === 'queso_turrialba') {
    g.fillStyle = '#d8d0b0'; g.beginPath(); g.ellipse(32, 40, 24, 10, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f4eed8'; g.fillRect(8, 26, 48, 14); g.beginPath(); g.ellipse(32, 26, 24, 10, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e4dcc0'; for (const [x, y] of [[22, 24], [38, 28], [30, 22]]) g.fillRect(x, y, 3, 2);
  } else if (item.key === 'natilla') {
    g.fillStyle = '#8a8e96'; g.fillRect(16, 24, 32, 28); g.fillStyle = '#f8f4e8'; g.beginPath(); g.ellipse(32, 24, 16, 6, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2a6ad8'; g.fillRect(16, 36, 32, 6);
  } else if (item.key === 'sombrero_sabanero') {
    g.fillStyle = '#5a3a1c'; g.beginPath(); g.ellipse(32, 42, 28, 8, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#7a5030'; g.beginPath(); g.ellipse(32, 40, 26, 6, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#8a6038'; g.fillRect(20, 20, 24, 20); g.fillStyle = '#6a4024'; g.fillRect(28, 18, 8, 4);
    g.fillStyle = '#2a1a10'; g.fillRect(20, 33, 24, 4);
  } else if (item.key === 'pluma_arpia') {
    g.strokeStyle = '#2a2c32'; g.lineWidth = 3; g.beginPath(); g.moveTo(12, 56); g.lineTo(48, 10); g.stroke();
    g.fillStyle = '#4a4e5c'; g.beginPath(); g.moveTo(48, 8); g.quadraticCurveTo(60, 28, 28, 46); g.quadraticCurveTo(26, 24, 48, 8); g.fill();
    g.fillStyle = '#8a8e96'; for (let k = 0; k < 4; k++) g.fillRect(34 + k * 4, 20 + k * 5, 6, 2);
    g.fillStyle = '#bfe8ff'; g.fillRect(44, 14, 3, 3);
  } else if (item.key === 'capa_arpia') {
    g.fillStyle = '#2a2c32'; g.beginPath(); g.moveTo(20, 8); g.lineTo(44, 8); g.lineTo(56, 58); g.lineTo(8, 58); g.closePath(); g.fill();
    g.fillStyle = '#4a4e5c'; g.beginPath(); g.moveTo(22, 12); g.lineTo(42, 12); g.lineTo(52, 54); g.lineTo(12, 54); g.closePath(); g.fill();
    g.fillStyle = '#8a8e96'; for (let y = 22; y < 54; y += 8) for (let x = 16 + (y % 16 ? 4 : 0); x < 48; x += 8) g.fillRect(x, y, 5, 4);
    g.fillStyle = '#e8c040'; g.fillRect(28, 10, 8, 5);
  } else if (item.key === 'sombrero_tule') {
    g.fillStyle = '#a8884a'; g.beginPath(); g.ellipse(32, 40, 28, 9, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#d8bc7a'; g.beginPath(); g.ellipse(32, 38, 26, 7, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#c8aa68'; g.fillRect(20, 18, 24, 20); g.fillStyle = '#6a3a1a'; g.fillRect(20, 32, 24, 4);
    g.fillStyle = '#b8984e'; for (let x = 22; x < 44; x += 4) g.fillRect(x, 20, 1, 12);
  } else if (item.key === 'escudo_madera' || item.key === 'escudo_hierro' || item.key === 'escudo_jade') {
    const base = item.key === 'escudo_madera' ? '#8a5a2c' : item.key === 'escudo_jade' ? '#2e8a58' : '#a8adb4';
    g.fillStyle = '#2a2a30'; g.beginPath(); g.moveTo(10, 8); g.lineTo(54, 8); g.lineTo(54, 34); g.quadraticCurveTo(54, 52, 32, 60); g.quadraticCurveTo(10, 52, 10, 34); g.closePath(); g.fill();
    g.fillStyle = base; g.beginPath(); g.moveTo(14, 12); g.lineTo(50, 12); g.lineTo(50, 34); g.quadraticCurveTo(50, 49, 32, 56); g.quadraticCurveTo(14, 49, 14, 34); g.closePath(); g.fill();
    [['#1a4ab8', 22], ['#f4f4f4', 25], ['#c8202a', 28], ['#f4f4f4', 31], ['#1a4ab8', 34]].forEach(([col, y]) => { g.fillStyle = col; g.fillRect(22, y, 20, 3); });
  } else if (item.key === 'lanza') {
    g.strokeStyle = '#6a4220'; g.lineWidth = 4; g.beginPath(); g.moveTo(8, 58); g.lineTo(46, 18); g.stroke();
    g.fillStyle = '#d0d4da'; g.beginPath(); g.moveTo(58, 4); g.lineTo(42, 16); g.lineTo(48, 22); g.closePath(); g.fill();
  } else if (item.key === 'mazo' || item.key === 'garrote') {
    g.strokeStyle = '#6a4220'; g.lineWidth = 5; g.beginPath(); g.moveTo(12, 56); g.lineTo(36, 30); g.stroke();
    g.fillStyle = item.key === 'mazo' ? '#8a9098' : '#7a5a34'; g.save(); g.translate(42, 22); g.rotate(-0.8); g.fillRect(-14, -9, 28, 18); g.restore();
    if (item.key === 'mazo') { g.fillStyle = '#c8ccd2'; g.fillRect(36, 14, 4, 4); g.fillRect(46, 24, 4, 4); }
  } else if (item.key === 'corazon_arenal') {
    g.fillStyle = '#2a1a14'; g.beginPath(); g.moveTo(32, 54); g.bezierCurveTo(4, 36, 10, 12, 32, 22); g.bezierCurveTo(54, 12, 60, 36, 32, 54); g.fill();
    g.fillStyle = '#e85010'; g.beginPath(); g.moveTo(32, 48); g.bezierCurveTo(12, 34, 16, 18, 32, 27); g.bezierCurveTo(48, 18, 52, 34, 32, 48); g.fill();
    g.fillStyle = '#ffd060'; g.fillRect(28, 30, 8, 8); g.fillRect(22, 26, 4, 4); g.fillRect(40, 34, 3, 3);
  } else if (item.key === 'hongo_potrero') {
    g.fillStyle = '#e8dcc0'; g.fillRect(28, 30, 8, 24);
    g.fillStyle = '#c48c38'; g.beginPath(); g.ellipse(32, 30, 18, 10, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#f4ecd8'; for (const [x, y] of [[24, 25], [34, 23], [40, 27]]) { g.beginPath(); g.arc(x, y, 2, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#9a6020'; g.fillRect(14, 30, 36, 2);
  } else if (item.key === 'cajeta') {
    g.fillStyle = '#c89048'; g.fillRect(14, 24, 36, 22); g.fillStyle = '#e0b068'; g.fillRect(16, 26, 32, 8); g.fillStyle = '#a87030'; g.fillRect(14, 44, 36, 3);
  } else if (item.key === 'chicharron') {
    g.fillStyle = '#b8742a'; g.beginPath(); g.ellipse(32, 36, 22, 12, 0.3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e8b058'; g.beginPath(); g.ellipse(30, 32, 16, 6, 0.3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#7a4a1a'; for (let x = 16; x < 48; x += 7) g.fillRect(x, 38, 3, 3);
  } else if (item.key === 'olla_carne') {
    g.fillStyle = '#2a2a2e'; g.beginPath(); g.ellipse(32, 38, 24, 16, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#9a6a2a'; g.beginPath(); g.ellipse(32, 32, 20, 9, 0, 0, Math.PI * 2); g.fill();
    for (const [x, y, col] of [[24, 31, '#e8c040'], [36, 30, '#7a3a20'], [30, 34, '#f0a030'], [40, 33, '#3a8a2a'], [22, 34, '#7a3a20']]) { g.fillStyle = col; g.fillRect(x, y, 6, 4); }
    g.fillStyle = '#2a2a2e'; g.fillRect(4, 30, 6, 4); g.fillRect(54, 30, 6, 4);
  } else if (item.key === 'empanada') {
    g.fillStyle = '#c8862a'; g.beginPath(); g.arc(32, 40, 22, Math.PI, 0); g.closePath(); g.fill();
    g.fillStyle = '#e8a840'; g.beginPath(); g.arc(32, 40, 18, Math.PI, 0); g.closePath(); g.fill();
    g.fillStyle = '#9a5a1a'; for (let x = 12; x < 54; x += 6) g.fillRect(x, 38, 3, 4);
  } else if (item.key === 'chorreada') {
    g.fillStyle = '#d8a83a'; g.beginPath(); g.ellipse(32, 36, 24, 14, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f0cc5a'; g.beginPath(); g.ellipse(32, 34, 20, 10, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f4f0e0'; g.beginPath(); g.ellipse(36, 32, 7, 4, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#a8761a'; g.fillRect(20, 36, 3, 3); g.fillRect(40, 38, 3, 3);
  } else if (item.key === 'mechero') {
    g.fillStyle = '#c82020'; g.fillRect(22, 24, 20, 32);
    g.fillStyle = '#e84a3a'; g.fillRect(24, 26, 6, 28);
    g.fillStyle = '#9aa0a8'; g.fillRect(22, 14, 20, 10); g.fillStyle = '#5a5e66'; g.fillRect(26, 16, 4, 6); g.fillRect(34, 16, 4, 6);
    g.fillStyle = '#ffd040'; g.beginPath(); g.moveTo(32, 2); g.quadraticCurveTo(40, 10, 32, 14); g.quadraticCurveTo(25, 10, 32, 2); g.fill();
    g.fillStyle = '#fff4b0'; g.beginPath(); g.arc(32, 10, 2.5, 0, Math.PI * 2); g.fill();
  } else if (item.key === 'bidon') {
    g.fillStyle = '#c82020'; g.fillRect(16, 16, 32, 40); g.fillRect(36, 8, 8, 10);
    g.fillStyle = '#8a1414'; g.fillRect(16, 30, 32, 3); g.fillRect(20, 20, 3, 32);
    g.fillStyle = '#f0c020'; g.fillRect(26, 38, 12, 10);
  } else if (item.key === 'escritura' || item.key === 'escritura_pueblo') {
    g.fillStyle = '#f4ecd4'; g.fillRect(14, 8, 36, 48);
    g.fillStyle = '#8a7a5a'; for (let y = 16; y < 44; y += 5) g.fillRect(19, y, 26, 2);
    g.fillStyle = '#c82020'; g.beginPath(); g.arc(40, 48, 7, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2a6ad8'; g.fillRect(19, 11, 26, 3);
  } else if (item.key === 'pluma_dorada') {
    g.strokeStyle = '#b88a20'; g.lineWidth = 3; g.beginPath(); g.moveTo(14, 54); g.lineTo(46, 12); g.stroke();
    g.fillStyle = '#f0c840'; g.beginPath(); g.moveTo(46, 10); g.quadraticCurveTo(58, 26, 30, 42); g.quadraticCurveTo(28, 24, 46, 10); g.fill();
    g.fillStyle = '#fff2a0'; g.beginPath(); g.moveTo(44, 16); g.quadraticCurveTo(50, 26, 34, 36); g.quadraticCurveTo(34, 24, 44, 16); g.fill();
  } else if (item.key === 'oreja_guanacaste') {
    // vaina en forma de oreja
    g.fillStyle = '#5a3418'; g.beginPath(); g.arc(32, 34, 20, 0.3, Math.PI * 2 - 0.3); g.closePath(); g.fill();
    g.fillStyle = '#7a4a24'; g.beginPath(); g.arc(32, 34, 12, 0.4, Math.PI * 2 - 0.4); g.closePath(); g.fill();
    g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(32, 34, 5, 0, Math.PI * 2); g.fill();
  } else if (item.key === 'churchill') {
    g.fillStyle = '#e8e4d8'; g.beginPath(); g.moveTo(14, 26); g.lineTo(50, 26); g.lineTo(44, 58); g.lineTo(20, 58); g.closePath(); g.fill();
    g.fillStyle = '#d82a3a'; g.fillRect(18, 34, 28, 12);
    g.fillStyle = '#f4ead0'; g.beginPath(); g.arc(32, 22, 14, Math.PI, 0); g.fill();
    g.fillStyle = '#fff6e0'; g.fillRect(20, 30, 24, 4);
    g.fillStyle = '#e8b0b8'; g.beginPath(); g.arc(32, 12, 7, 0, Math.PI * 2); g.fill();
  } else if (item.key === 'pipa') {
    g.fillStyle = '#3a8a2a'; g.beginPath(); g.arc(30, 38, 18, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#6ab84a'; g.beginPath(); g.arc(25, 33, 8, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f4f0e0'; g.beginPath(); g.ellipse(34, 22, 7, 4, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#e83a6a'; g.lineWidth = 3; g.beginPath(); g.moveTo(34, 22); g.lineTo(46, 4); g.stroke();
  } else if (item.key === 'copo') {
    g.fillStyle = '#f4f4f4'; g.beginPath(); g.moveTo(18, 30); g.lineTo(46, 30); g.lineTo(32, 58); g.closePath(); g.fill();
    g.fillStyle = '#e8f4ff'; g.beginPath(); g.arc(32, 26, 15, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#d82a3a'; g.beginPath(); g.arc(28, 22, 8, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f0e0b0'; g.beginPath(); g.arc(36, 18, 5, 0, Math.PI * 2); g.fill();
  } else if (item.key === 'llave_volcan') {
    g.fillStyle = '#2a8a5a'; g.beginPath(); g.arc(20, 20, 12, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1a1a22'; g.beginPath(); g.arc(20, 20, 5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e8b830'; g.save(); g.translate(30, 30); g.rotate(0.785); g.fillRect(-3, 0, 6, 30); g.fillRect(3, 18, 8, 5); g.fillRect(3, 26, 6, 4); g.restore();
    g.fillStyle = '#ff7a20'; g.beginPath(); g.arc(20, 20, 2.5, 0, Math.PI * 2); g.fill();
  } else if (item.key === 'azufre') {
    for (const [x, y, r] of [[24, 36, 10], [38, 30, 9], [32, 44, 8], [40, 44, 6]]) { g.fillStyle = '#c8a818'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f4e050'; g.beginPath(); g.arc(x - 2, y - 2, r * 0.5, 0, Math.PI * 2); g.fill(); }
  } else if (item.key === 'caldo_hongo') {
    g.fillStyle = '#5a3a28'; g.beginPath(); g.moveTo(10, 28); g.lineTo(54, 28); g.lineTo(46, 52); g.lineTo(18, 52); g.closePath(); g.fill();
    g.fillStyle = '#e85a1a'; g.fillRect(12, 28, 40, 6);
    g.fillStyle = '#ffd070'; for (const x of [20, 30, 42]) { g.beginPath(); g.arc(x, 30, 3, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = 'rgba(255,200,150,0.7)'; g.lineWidth = 2; for (const x of [22, 32, 42]) { g.beginPath(); g.moveTo(x, 22); g.quadraticCurveTo(x - 4, 16, x, 8); g.stroke(); }
  } else if (item.key === 'mango') {
    g.fillStyle = '#e88a1a'; g.beginPath(); g.ellipse(32, 36, 16, 20, 0.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#d8302a'; g.beginPath(); g.ellipse(26, 30, 9, 12, 0.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#5a9a2a'; g.beginPath(); g.ellipse(42, 14, 8, 4, -0.6, 0, Math.PI * 2); g.fill();
  } else if (item.armor) {
    // armadura en estilo plano: color del material, sombra a la derecha y brillo arriba
    const base = item.color;
    const dark = shadeHex(base, 0.72), light = shadeHex(base, 1.25);
    const shapes = {
      head: [[14, 22], [16, 12], [32, 8], [48, 12], [50, 22], [50, 38], [42, 38], [42, 26], [22, 26], [22, 38], [14, 38]],
      chest: [[10, 14], [24, 8], [28, 14], [36, 14], [40, 8], [54, 14], [50, 30], [46, 28], [46, 56], [18, 56], [18, 28], [14, 30]],
      legs: [[16, 8], [48, 8], [50, 56], [36, 56], [32, 24], [28, 56], [14, 56]],
      feet: [[10, 30], [24, 30], [26, 46], [30, 50], [30, 56], [8, 56], [10, 44], [34, 30], [48, 30], [50, 44], [56, 50], [56, 56], [34, 56], [34, 46]],
      offhand: [[12, 10], [32, 6], [52, 10], [52, 34], [44, 48], [32, 58], [20, 48], [12, 34]],
    };
    const pts = shapes[item.armor] || shapes.chest; // una pieza sin forma propia no puede tumbar el arranque
    const path = (arr) => { g.beginPath(); g.moveTo(arr[0][0], arr[0][1]); for (const p of arr.slice(1)) g.lineTo(p[0], p[1]); g.closePath(); };
    if (item.armor === 'feet') {
      for (const half of [pts.slice(0, 7), pts.slice(7)]) { g.fillStyle = base; path(half); g.fill(); }
      g.fillStyle = dark; g.fillRect(8, 52, 22, 4); g.fillRect(34, 52, 22, 4);
    } else {
      g.fillStyle = base; path(pts); g.fill();
      g.save(); path(pts); g.clip();
      g.fillStyle = dark; g.fillRect(40, 0, 24, 64);
      g.fillStyle = light; g.fillRect(0, 0, 64, item.armor === 'chest' ? 18 : 14);
      g.restore();
    }
    if (item.mat === 'jade' || item.mat === 'diamond') { g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(24, 16, 4, 10); }
  } else if (item.key === 'corn') {
    g.fillStyle = '#5d9a35';
    g.beginPath(); g.moveTo(14, 54); g.quadraticCurveTo(10, 30, 26, 16); g.lineTo(30, 40); g.closePath(); g.fill();
    g.fillStyle = '#e8b62b';
    g.beginPath(); g.ellipse(36, 30, 9, 20, 0.55, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f6d24a';
    for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) { g.beginPath(); g.arc(30 + c * 4 + r * 2.2, 16 + r * 5 + c * 1.5, 1.6, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#76b043';
    g.beginPath(); g.moveTo(22, 56); g.quadraticCurveTo(46, 50, 52, 30); g.lineTo(40, 46); g.closePath(); g.fill();
  } else if (item.key === 'corn_seeds') {
    g.fillStyle = '#e3b23a';
    for (const [x, y] of [[22, 28], [34, 22], [40, 36], [28, 40], [44, 46], [18, 44]]) { g.beginPath(); g.ellipse(x, y, 5, 6.5, 0.4, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#fff2b0';
    for (const [x, y] of [[21, 26], [33, 20], [39, 34]]) { g.beginPath(); g.arc(x, y, 1.6, 0, Math.PI * 2); g.fill(); }
  } else if (item.key === 'beans') {
    for (const [x, y, r] of [[22, 30, 0.4], [36, 24, -0.3], [42, 40, 0.2], [26, 44, -0.5], [14, 40, 0.8]]) {
      g.fillStyle = '#3a1416'; g.beginPath(); g.ellipse(x, y, 8, 5.5, r, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#6b2a2e'; g.beginPath(); g.ellipse(x - 1.5, y - 1.5, 4, 2.2, r, 0, Math.PI * 2); g.fill();
    }
  } else if (item.key === 'tortilla') {
    g.fillStyle = '#e9cf8f'; g.beginPath(); g.ellipse(32, 34, 24, 14, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#d9b46a'; g.beginPath(); g.ellipse(32, 38, 24, 12, 0, 0, Math.PI); g.fill();
    g.fillStyle = '#b98a45';
    for (const [x, y] of [[22, 30], [38, 28], [30, 38], [44, 36], [18, 38]]) { g.beginPath(); g.arc(x, y, 2.4, 0, Math.PI * 2); g.fill(); }
  } else if (item.key === 'leather') {
    g.fillStyle = '#8a5a33';
    g.beginPath(); g.moveTo(14, 18); g.lineTo(26, 12); g.lineTo(40, 14); g.lineTo(52, 10); g.lineTo(50, 30); g.lineTo(54, 50); g.lineTo(36, 54); g.lineTo(20, 52); g.lineTo(10, 40); g.closePath(); g.fill();
    g.fillStyle = '#a8713f'; g.fillRect(18, 18, 26, 6);
    g.strokeStyle = '#5f3a1e'; g.lineWidth = 2; g.setLineDash([3, 3]); g.strokeRect(18, 22, 28, 24);
  } else if (item.key === 'quartz') {
    for (const [x, h, w, c] of [[22, 34, 9, '#c6c0ee'], [34, 44, 11, '#e6e2ff'], [46, 26, 8, '#a79fd6']]) {
      g.fillStyle = c; g.beginPath(); g.moveTo(x - w / 2, 56); g.lineTo(x - w / 2, 56 - h + 8); g.lineTo(x, 56 - h); g.lineTo(x + w / 2, 56 - h + 8); g.lineTo(x + w / 2, 56); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(x - w / 2 + 1, 56 - h + 10, 2, h - 14);
    }
  } else if (item.key === 'jade_ingot') {
    g.fillStyle = '#2b8552'; g.beginPath(); g.moveTo(8, 40); g.lineTo(20, 24); g.lineTo(56, 24); g.lineTo(44, 40); g.closePath(); g.fill();
    g.fillStyle = '#3fae6c'; g.beginPath(); g.moveTo(20, 24); g.lineTo(26, 16); g.lineTo(58, 16); g.lineTo(56, 24); g.closePath(); g.fill();
    g.fillStyle = '#1d5b39'; g.beginPath(); g.moveTo(8, 40); g.lineTo(44, 40); g.lineTo(44, 48); g.lineTo(8, 48); g.closePath(); g.fill();
    g.fillStyle = 'rgba(200,255,220,0.6)'; g.fillRect(28, 18, 16, 3);
  } else if (item.key === 'banana') {
    g.fillStyle = '#e6c92f'; g.beginPath(); g.moveTo(12, 20); g.quadraticCurveTo(20, 52, 52, 48); g.quadraticCurveTo(28, 44, 20, 16); g.closePath(); g.fill();
    g.fillStyle = '#f5e27a'; g.beginPath(); g.moveTo(16, 20); g.quadraticCurveTo(22, 44, 46, 46); g.lineTo(44, 44); g.quadraticCurveTo(24, 40, 18, 18); g.fill();
    g.fillStyle = '#5a4a1a'; g.fillRect(10, 14, 6, 6); g.fillRect(50, 46, 4, 4);
  } else if (item.key === 'papaya') {
    g.fillStyle = '#e8862a'; g.beginPath(); g.ellipse(32, 34, 18, 24, -0.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f4a94a'; g.beginPath(); g.ellipse(28, 30, 9, 15, -0.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2b1a12'; for (const [x, y] of [[26, 30], [29, 34], [31, 28], [27, 37], [32, 33]]) { g.beginPath(); g.arc(x, y, 1.8, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#6a9a2a'; g.fillRect(40, 8, 5, 8);
  } else if (item.key === 'macaw_feather' || item.key === 'quetzal_feather') {
    const q = item.key === 'quetzal_feather';
    const cols = q ? ['#0e7a4a', '#18a764', '#5fe3a0'] : ['#b51f1f', '#2a6ad2', '#f2c428'];
    g.strokeStyle = '#e8e0d0'; g.lineWidth = 2; g.beginPath(); g.moveTo(12, 56); g.lineTo(52, 8); g.stroke();
    for (let i = 0; i < 12; i++) {
      const t0 = i / 12, x = 14 + t0 * 36, y = 52 - t0 * 42;
      g.strokeStyle = cols[i < 4 ? 0 : i < 9 ? 1 : 2]; g.lineWidth = 4;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x - 8, y - 4); g.moveTo(x, y); g.lineTo(x + 4, y + 8); g.stroke();
    }
    if (q) { g.strokeStyle = '#18a764'; g.lineWidth = 3; g.beginPath(); g.moveTo(52, 8); g.quadraticCurveTo(60, 30, 56, 60); g.stroke(); }
  } else if (item.key === 'honey' || item.key === 'antivenom' || item.key === 'jar' || item.key === 'dart_frog' || item.key === 'morpho_jar_item') {
    const fill = { honey: '#e6a51c', antivenom: '#d8e8f0', jar: null, dart_frog: '#2a8a3a', morpho_jar_item: '#1f6fd6' }[item.key];
    g.fillStyle = 'rgba(190,225,235,0.55)'; g.fillRect(16, 18, 32, 40);
    if (fill) { g.fillStyle = fill; g.fillRect(18, item.key === 'honey' ? 28 : 34, 28, item.key === 'honey' ? 28 : 22); }
    if (item.key === 'dart_frog') { g.fillStyle = '#d6201e'; g.beginPath(); g.ellipse(32, 42, 9, 6, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#1a3ad0'; g.fillRect(24, 46, 4, 6); g.fillRect(36, 46, 4, 6); }
    if (item.key === 'morpho_jar_item') { g.fillStyle = '#7fc4ff'; g.beginPath(); g.ellipse(26, 40, 7, 9, -0.4, 0, Math.PI * 2); g.ellipse(38, 40, 7, 9, 0.4, 0, Math.PI * 2); g.fill(); }
    if (item.key === 'antivenom') { g.fillStyle = '#c22'; g.fillRect(29, 36, 6, 14); g.fillRect(25, 40, 14, 6); }
    g.strokeStyle = '#9cc7d4'; g.lineWidth = 2; g.strokeRect(16, 18, 32, 40);
    g.fillStyle = '#8a6a3a'; g.fillRect(20, 10, 24, 8);
  } else if (item.key === 'guano') {
    g.fillStyle = '#4a4033'; g.beginPath(); g.ellipse(32, 44, 22, 10, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#6a5c48'; g.beginPath(); g.ellipse(30, 38, 14, 8, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#d8d0c0'; for (const [x, y] of [[24, 36], [34, 40], [40, 46]]) g.fillRect(x, y, 3, 2);
  } else if (item.key === 'net') {
    g.strokeStyle = '#8a5a2b'; g.lineWidth = 5; g.beginPath(); g.moveTo(10, 56); g.lineTo(36, 30); g.stroke();
    g.strokeStyle = '#c9c2b0'; g.lineWidth = 3; g.beginPath(); g.ellipse(44, 20, 14, 12, 0.6, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 1; for (let i = -10; i <= 10; i += 5) { g.beginPath(); g.moveTo(34 + i, 10); g.lineTo(54 + i, 30); g.stroke(); g.beginPath(); g.moveTo(34 + i, 30); g.lineTo(54 + i, 10); g.stroke(); }
  } else if (item.key === 'lucky_amulet') {
    g.strokeStyle = '#d9b44a'; g.lineWidth = 2; g.beginPath(); g.arc(32, 22, 16, Math.PI, 0); g.stroke();
    g.fillStyle = '#3caa6c'; g.beginPath(); g.moveTo(32, 26); g.lineTo(46, 40); g.lineTo(32, 58); g.lineTo(18, 40); g.closePath(); g.fill();
    g.fillStyle = '#86e0a6'; g.beginPath(); g.moveTo(32, 30); g.lineTo(40, 40); g.lineTo(32, 46); g.closePath(); g.fill();
    g.fillStyle = '#18a764'; g.fillRect(29, 48, 6, 14);
  } else if (item.key === 'coffee_cherry' || item.key === 'roasted_coffee') {
    const roasted = item.key === 'roasted_coffee';
    for (const [x, y] of [[22, 26], [34, 22], [40, 34], [28, 38], [44, 46], [18, 42], [32, 48]]) {
      g.fillStyle = roasted ? '#4a2a14' : '#b5161e'; g.beginPath(); g.ellipse(x, y, 7, 6, 0.4, 0, Math.PI * 2); g.fill();
      g.strokeStyle = roasted ? '#2a1408' : '#e04048'; g.lineWidth = roasted ? 2 : 1.5; g.beginPath(); g.moveTo(x - 4, y - 2); g.lineTo(x + 4, y + 2); g.stroke();
    }
  } else if (item.key === 'cane_item') {
    g.fillStyle = '#b9cf68'; g.save(); g.translate(32, 32); g.rotate(-0.8); g.fillRect(-4, -28, 8, 56);
    g.fillStyle = '#7f9e3c'; for (let k = -24; k < 28; k += 11) g.fillRect(-5, k, 10, 3);
    g.restore();
  } else if (item.key === 'machete' || item.key === 'machete_cadejos') {
    const dark = item.key === 'machete_cadejos';
    g.fillStyle = dark ? '#2a2a30' : '#c8ccd0'; g.beginPath(); g.moveTo(22, 40); g.lineTo(52, 8); g.lineTo(58, 12); g.lineTo(30, 46); g.closePath(); g.fill();
    g.fillStyle = dark ? '#d82020' : '#f0f2f4'; g.beginPath(); g.moveTo(52, 8); g.lineTo(58, 12); g.lineTo(55, 14); g.closePath(); g.fill();
    g.strokeStyle = dark ? '#6a0a0a' : '#8a9096'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(25, 41); g.lineTo(54, 11); g.stroke();
    g.fillStyle = '#5a3a1e'; g.save(); g.translate(20, 46); g.rotate(-0.83); g.fillRect(-4, -2, 8, 22); g.restore();
    g.fillStyle = '#3a2410'; g.beginPath(); g.arc(13, 53, 3, 0, Math.PI * 2); g.fill();
    if (dark) { g.fillStyle = '#f4f0e0'; g.beginPath(); g.moveTo(26, 36); g.lineTo(32, 32); g.lineTo(28, 42); g.closePath(); g.fill(); }
  } else if (item.key === 'bombeta') {
    g.fillStyle = '#c8202a'; g.fillRect(26, 14, 12, 30);
    g.fillStyle = '#f4f4f4'; g.fillRect(26, 22, 12, 4); g.fillStyle = '#1a3ab0'; g.fillRect(26, 30, 12, 4);
    g.fillStyle = '#e8c040'; g.beginPath(); g.moveTo(26, 14); g.lineTo(32, 6); g.lineTo(38, 14); g.closePath(); g.fill();
    g.strokeStyle = '#a07a40'; g.lineWidth = 3; g.beginPath(); g.moveTo(32, 44); g.lineTo(32, 60); g.stroke();
  } else if (item.key === 'arco') {
    g.strokeStyle = '#7a4a22'; g.lineWidth = 5; g.beginPath(); g.arc(14, 50, 40, -1.45, -0.12); g.stroke();
    g.strokeStyle = '#e8e4d8'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(17, 10); g.lineTo(54, 46); g.stroke();
    g.fillStyle = '#3a2410'; g.fillRect(36, 22, 6, 6);
  } else if (item.key === 'flecha') {
    g.strokeStyle = '#9a6a3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(12, 52); g.lineTo(50, 14); g.stroke();
    g.fillStyle = '#8a8a90'; g.beginPath(); g.moveTo(56, 8); g.lineTo(44, 14); g.lineTo(50, 20); g.closePath(); g.fill();
    g.fillStyle = '#d83a2a'; g.fillRect(8, 46, 6, 6); g.fillStyle = '#2a6ad8'; g.fillRect(14, 52, 6, 6);
  } else if (item.key === 'colmillo_cadejos') {
    g.fillStyle = '#f4ecd8'; g.beginPath(); g.moveTo(24, 10); g.quadraticCurveTo(46, 24, 40, 56); g.lineTo(32, 54); g.quadraticCurveTo(34, 26, 18, 14); g.closePath(); g.fill();
    g.fillStyle = '#d82020'; g.beginPath(); g.arc(40, 54, 3, 0, Math.PI * 2); g.fill();
  } else if (item.key === 'calavera_segua') {
    g.fillStyle = '#e4dccc'; g.fillRect(12, 18, 40, 20); g.fillRect(16, 38, 32, 12);
    g.fillStyle = '#1a1210'; g.fillRect(16, 22, 8, 8); g.fillRect(40, 22, 8, 8);
    for (let x = 18; x < 46; x += 5) g.fillRect(x, 44, 3, 5);
    g.fillStyle = '#ff3010'; g.fillRect(18, 24, 4, 4); g.fillRect(42, 24, 4, 4);
  } else if (item.key === 'lagrima_llorona') {
    g.fillStyle = '#9ad0f0'; g.beginPath(); g.moveTo(32, 8); g.quadraticCurveTo(50, 36, 32, 54); g.quadraticCurveTo(14, 36, 32, 8); g.fill();
    g.fillStyle = '#e8f6ff'; g.beginPath(); g.ellipse(27, 38, 4, 7, 0.3, 0, Math.PI * 2); g.fill();
  } else if (item.key === 'cana_pescar') {
    g.strokeStyle = '#8a5a2b'; g.lineWidth = 5; g.beginPath(); g.moveTo(10, 56); g.lineTo(52, 10); g.stroke();
    g.strokeStyle = '#3a3a3a'; g.lineWidth = 4; g.beginPath(); g.moveTo(12, 54); g.lineTo(20, 45); g.stroke();
    g.fillStyle = '#c0c0c0'; g.beginPath(); g.arc(20, 48, 5, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#e8e8e0'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(52, 10); g.quadraticCurveTo(58, 30, 54, 50); g.stroke();
    g.fillStyle = '#d82020'; g.fillRect(51, 48, 6, 4); g.fillStyle = '#fff'; g.fillRect(51, 52, 6, 3);
  } else if (item.key === 'polea') {
    g.strokeStyle = '#3a3a40'; g.lineWidth = 3; g.beginPath(); g.moveTo(4, 14); g.lineTo(60, 10); g.stroke();
    g.fillStyle = '#9aa0a8'; g.beginPath(); g.arc(32, 14, 8, 0, Math.PI * 2); g.fill(); g.fillStyle = '#5a6068'; g.beginPath(); g.arc(32, 14, 3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#c8a020'; g.fillRect(29, 20, 6, 18); g.fillStyle = '#e8c040'; g.beginPath(); g.arc(32, 44, 8, 0, Math.PI * 2); g.fill(); g.fillStyle = '#3a3020'; g.beginPath(); g.arc(32, 44, 4, 0, Math.PI * 2); g.fill();
  } else if (item.key === 'carro_viejo') {
    g.fillStyle = '#b8202a'; g.fillRect(6, 30, 52, 14); g.fillRect(16, 20, 30, 12);
    g.fillStyle = '#9ac8e0'; g.fillRect(19, 22, 11, 8); g.fillRect(33, 22, 10, 8);
    g.fillStyle = '#18181a'; for (const x of [16, 46]) { g.beginPath(); g.arc(x, 46, 6, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#9a9aa0'; for (const x of [16, 46]) g.fillRect(x - 2, 44, 4, 4);
    g.fillStyle = '#fff2b0'; g.fillRect(54, 32, 4, 4); g.fillStyle = '#7a4020'; g.fillRect(24, 36, 3, 3); g.fillRect(40, 33, 2, 2);
  } else if (item.key === 'bote') {
    g.fillStyle = '#6a4424'; g.beginPath(); g.moveTo(6, 30); g.lineTo(58, 30); g.lineTo(50, 46); g.lineTo(14, 46); g.closePath(); g.fill();
    g.fillStyle = '#2a6ea2'; g.fillRect(8, 30, 48, 4);
    g.fillStyle = '#94663c'; g.fillRect(16, 36, 32, 3);
    g.strokeStyle = '#a87a4a'; g.lineWidth = 3; g.beginPath(); g.moveTo(18, 18); g.lineTo(40, 52); g.stroke();
  } else if (item.key === 'langosta' || item.key === 'langosta_gratinada') { // v12.7.2 (C5-A2)
    const gr = item.key === 'langosta_gratinada';
    if (gr) { g.fillStyle = '#e8e4d8'; g.beginPath(); g.ellipse(32, 44, 26, 10, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = gr ? '#e86030' : '#8a4a30'; g.beginPath(); g.ellipse(32, gr ? 36 : 34, 18, 8, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = gr ? '#c84a20' : '#6a3420'; g.lineWidth = 2; for (const x of [22, 28, 34, 40]) { g.beginPath(); g.moveTo(x, (gr ? 30 : 28)); g.lineTo(x, (gr ? 42 : 40)); g.stroke(); }
    g.strokeStyle = gr ? '#e86030' : '#8a4a30'; g.lineWidth = 3; g.beginPath(); g.moveTo(14, 32); g.lineTo(4, 18); g.moveTo(14, 36); g.lineTo(4, 50); g.moveTo(50, 34); g.lineTo(60, 28); g.lineTo(60, 40); g.stroke();
    if (gr) { g.fillStyle = '#f0d060'; g.fillRect(24, 30, 16, 4); g.fillStyle = '#7ac040'; g.beginPath(); g.arc(52, 46, 5, 0, Math.PI * 2); g.fill(); }
  } else if (item.key === 'camaron') {
    g.strokeStyle = '#f08a70'; g.lineWidth = 9; g.beginPath(); g.arc(32, 32, 14, 0.4, Math.PI * 1.6); g.stroke();
    g.strokeStyle = '#f8b8a0'; g.lineWidth = 2; for (let k = 0; k < 5; k++) { const a = 0.6 + k * 0.45; g.beginPath(); g.moveTo(32 + Math.cos(a) * 10, 32 + Math.sin(a) * 10); g.lineTo(32 + Math.cos(a) * 18, 32 + Math.sin(a) * 18); g.stroke(); }
    g.strokeStyle = '#c86a50'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(40, 22); g.lineTo(56, 10); g.moveTo(42, 24); g.lineTo(58, 16); g.stroke();
  } else if (item.key === 'piangua' || item.key === 'ostion') {
    const pi = item.key === 'piangua';
    g.fillStyle = pi ? '#3a3a2e' : '#9a9488'; g.beginPath(); g.ellipse(32, 34, pi ? 16 : 20, pi ? 12 : 13, -0.3, 0, Math.PI * 2); g.fill();
    g.strokeStyle = pi ? '#5a5a44' : '#c8c2b4'; g.lineWidth = 2; for (const r of [6, 10, 14]) { g.beginPath(); g.ellipse(32, 34, r, r * 0.7, -0.3, Math.PI * 0.9, Math.PI * 1.9); g.stroke(); }
    if (!pi) { g.fillStyle = '#e8e2d8'; g.beginPath(); g.ellipse(34, 32, 8, 5, -0.3, 0, Math.PI * 2); g.fill(); }
  } else if (item.key === 'lombriz') { // v12.7.0 (C5-A1)
    g.strokeStyle = '#c86a6a'; g.lineWidth = 7; g.beginPath(); g.moveTo(10, 40); g.bezierCurveTo(20, 20, 30, 56, 40, 32); g.quadraticCurveTo(46, 20, 54, 28); g.stroke();
    g.strokeStyle = '#e89a8a'; g.lineWidth = 2; g.beginPath(); g.moveTo(12, 38); g.bezierCurveTo(21, 21, 30, 53, 39, 31); g.stroke();
    g.fillStyle = '#8a3a3a'; for (const [x, y] of [[18, 31], [27, 40], [36, 37], [46, 25]]) g.fillRect(x, y, 3, 3);
  } else if (item.key === 'senuelo') {
    g.fillStyle = '#e8d040'; g.beginPath(); g.ellipse(30, 32, 16, 8, -0.3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e04030'; g.beginPath(); g.ellipse(20, 36, 7, 5, -0.3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#222'; g.beginPath(); g.arc(18, 35, 2, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#b8c0c8'; g.lineWidth = 2; g.beginPath(); g.moveTo(44, 26); g.lineTo(52, 22); g.moveTo(40, 40); g.quadraticCurveTo(44, 50, 50, 46); g.stroke();
  } else if (item.key === 'fragmento_coral') { // v12.6.6: los de C5-B, que no tenían dibujo
    g.strokeStyle = '#e8607a'; g.lineWidth = 6; g.beginPath(); g.moveTo(32, 54); g.lineTo(32, 30); g.lineTo(22, 16); g.moveTo(32, 36); g.lineTo(44, 20); g.moveTo(32, 44); g.lineTo(20, 34); g.stroke();
    g.fillStyle = '#f8a0b0'; for (const [x, y] of [[22, 16], [44, 20], [20, 34], [32, 28]]) { g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill(); }
  } else if (item.key === 'estaca_nido') {
    g.strokeStyle = '#8a5a2b'; g.lineWidth = 7; g.beginPath(); g.moveTo(30, 58); g.lineTo(34, 8); g.stroke();
    g.fillStyle = '#f0c020'; g.fillRect(34, 14, 20, 8); g.fillStyle = '#222'; g.fillRect(38, 16, 4, 4); g.fillRect(46, 16, 4, 4);
  } else if (item.key === 'banderita_azul') {
    g.strokeStyle = '#d8d8d8'; g.lineWidth = 4; g.beginPath(); g.moveTo(16, 58); g.lineTo(16, 6); g.stroke();
    g.fillStyle = '#2a6ad0'; g.beginPath(); g.moveTo(18, 8); g.lineTo(54, 16); g.lineTo(18, 30); g.closePath(); g.fill();
    g.fillStyle = '#f0f0f0'; g.beginPath(); g.arc(30, 18, 4, 0, Math.PI * 2); g.fill();
  } else if (item.key === 'cabuya') {
    g.strokeStyle = '#c8a870'; g.lineWidth = 5; for (const r of [18, 12, 6]) { g.beginPath(); g.arc(32, 34, r, 0, Math.PI * 2); g.stroke(); }
    g.strokeStyle = '#8a6a40'; g.lineWidth = 1.5; for (const r of [18, 12, 6]) { g.beginPath(); g.arc(32, 34, r, 0.3, 1.4); g.stroke(); }
    g.strokeStyle = '#c8a870'; g.lineWidth = 4; g.beginPath(); g.moveTo(50, 34); g.quadraticCurveTo(58, 46, 52, 56); g.stroke();
  } else if (['pargo', 'corvina', 'guapote', 'dorado', 'pescado_frito'].includes(item.key)) {
    const c = { pargo: ['#c83a2a', '#f0a090'], corvina: ['#9aa4ac', '#e0e4e8'], guapote: ['#4e6034', '#c8c49a'], dorado: ['#2aa070', '#e8d040'], pescado_frito: ['#a8601c', '#e0a050'] }[item.key];
    g.fillStyle = c[0]; g.beginPath(); g.ellipse(30, 32, 20, 11, -0.15, 0, Math.PI * 2); g.fill();
    g.fillStyle = c[1]; g.beginPath(); g.ellipse(30, 37, 15, 5, -0.15, 0, Math.PI * 2); g.fill();
    g.fillStyle = c[0]; g.beginPath(); g.moveTo(48, 30); g.lineTo(60, 20); g.lineTo(60, 44); g.closePath(); g.fill();
    g.fillStyle = '#111'; g.beginPath(); g.arc(16, 29, 2.4, 0, Math.PI * 2); g.fill();
    if (item.key === 'pescado_frito') { g.strokeStyle = '#6a3a10'; g.lineWidth = 2; for (const x of [24, 32, 40]) { g.beginPath(); g.moveTo(x, 24); g.lineTo(x - 3, 40); g.stroke(); } }
  } else if (item.key === 'ceviche') {
    g.fillStyle = '#e8e4d8'; g.beginPath(); g.moveTo(8, 30); g.lineTo(56, 30); g.lineTo(46, 52); g.lineTo(18, 52); g.closePath(); g.fill();
    for (let i = 0; i < 26; i++) { g.fillStyle = ['#f4f0e8', '#e05030', '#40a040', '#f8f0c0'][i % 4]; g.fillRect(14 + Math.random() * 34, 24 + Math.random() * 10, 5, 5); }
    g.fillStyle = '#7ac040'; g.beginPath(); g.arc(50, 22, 6, 0, Math.PI * 2); g.fill();
  } else if (item.key === 'limon') {
    g.fillStyle = '#e88a1a'; g.beginPath(); g.arc(32, 34, 17, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f8b048'; g.beginPath(); g.arc(28, 30, 9, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#3a8a2a'; g.beginPath(); g.ellipse(38, 16, 7, 3, -0.5, 0, Math.PI * 2); g.fill();
  } else if (item.key === 'bota_vieja') {
    g.fillStyle = '#4a3420'; g.fillRect(22, 10, 16, 34); g.fillRect(22, 38, 30, 14);
    g.fillStyle = '#2a1c10'; g.fillRect(22, 50, 32, 4); g.fillStyle = '#6a8a3a'; g.fillRect(26, 14, 4, 6);
  } else if (item.key === 'perla') {
    g.fillStyle = '#c8c0d0'; g.beginPath(); g.arc(32, 32, 14, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f4f0f8'; g.beginPath(); g.arc(28, 28, 8, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(26, 26, 3, 0, Math.PI * 2); g.fill();
  } else if (item.plata && item.plata < 1000) {
    // monedas de Tiquicia (inventadas): las de 100 y 500, doradas; las chicas, plateadas. El número al centro
    const oro = item.plata >= 100, r = 12 + Math.min(10, Math.log10(item.plata) * 4);
    g.fillStyle = oro ? '#9a6e10' : '#7a7e86'; g.beginPath(); g.arc(32, 33, r + 2, 0, Math.PI * 2); g.fill();
    g.fillStyle = oro ? '#e8c04a' : '#c8ccd4'; g.beginPath(); g.arc(32, 32, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = oro ? '#b8901e' : '#9a9ea6'; g.lineWidth = 1.5; g.beginPath(); g.arc(32, 32, r - 3, 0, Math.PI * 2); g.stroke();
    g.fillStyle = oro ? '#7a5208' : '#4a4e56'; g.font = `bold ${item.plata >= 100 ? 13 : 15}px monospace`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(item.plata), 32, 33);
  } else if (item.plata) {
    // billetes de Tiquicia (inventados, no los del BCCR): un color y un motivo propio cada uno
    const C = { 1000: ['#5a9a3a', '#3a6a22', '#e0f0c8', 'carreta'], 2000: ['#8a4aa8', '#5a2a74', '#f0dcf8', 'guaria'], 5000: ['#3a68b0', '#22447a', '#d4e2f8', 'volcan'], 10000: ['#2a8a8a', '#1a5a5a', '#c8ecec', 'yiguirro'], 20000: ['#a83a4a', '#741e2c', '#f8d4da', 'ballena'], 25000: ['#8a8a8a', '#555', '#eee', 'viejo'], 50000: ['#8a8a8a', '#555', '#eee', 'viejo'] }[item.plata];
    g.fillStyle = C[1]; g.fillRect(4, 16, 56, 34);
    g.fillStyle = C[0]; g.fillRect(6, 18, 52, 30);
    g.strokeStyle = C[2]; g.lineWidth = 1.5; g.strokeRect(9, 21, 46, 24);
    g.fillStyle = C[2];
    const m = C[3];
    if (m === 'carreta') { g.beginPath(); g.arc(20, 38, 6, 0, Math.PI * 2); g.fill(); g.fillStyle = C[0]; g.beginPath(); g.arc(20, 38, 3, 0, Math.PI * 2); g.fill(); g.fillStyle = C[2]; g.fillRect(14, 28, 16, 6); }
    else if (m === 'guaria') { for (let k = 0; k < 5; k++) { const ang = (k / 5) * Math.PI * 2; g.beginPath(); g.ellipse(22 + Math.cos(ang) * 5, 33 + Math.sin(ang) * 5, 4, 2.5, ang, 0, Math.PI * 2); g.fill(); } }
    else if (m === 'volcan') { g.beginPath(); g.moveTo(12, 42); g.lineTo(22, 26); g.lineTo(26, 30); g.lineTo(32, 42); g.closePath(); g.fill(); }
    else if (m === 'yiguirro') { g.beginPath(); g.ellipse(22, 34, 7, 5, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(28, 30, 3.5, 0, Math.PI * 2); g.fill(); g.fillRect(12, 33, 5, 2); }
    else if (m === 'ballena') { g.beginPath(); g.ellipse(22, 35, 10, 4.5, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.moveTo(11, 35); g.lineTo(6, 30); g.lineTo(7, 39); g.closePath(); g.fill(); }
    else { g.font = 'bold 9px monospace'; g.textAlign = 'center'; g.fillText('VIEJO', 22, 34); }
    const txt = item.plata >= 10000 ? `${item.plata / 1000}mil` : String(item.plata);
    g.fillStyle = '#fff'; g.font = `bold ${txt.length > 4 ? 11 : 13}px monospace`; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(txt, 55, 34);
  } else if (item.key === 'tapa_dulce') {
    g.fillStyle = '#7a3e12'; g.beginPath(); g.moveTo(14, 26); g.lineTo(38, 16); g.lineTo(52, 24); g.lineTo(28, 36); g.closePath(); g.fill();
    g.fillStyle = '#5e2e0c'; g.beginPath(); g.moveTo(14, 26); g.lineTo(28, 36); g.lineTo(28, 50); g.lineTo(14, 40); g.closePath(); g.fill();
    g.fillStyle = '#4a240a'; g.beginPath(); g.moveTo(28, 36); g.lineTo(52, 24); g.lineTo(52, 38); g.lineTo(28, 50); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,200,120,0.35)'; g.fillRect(24, 22, 10, 3);
  } else if (item.key === 'cafe_chorreado' || item.key === 'agua_dulce') {
    g.fillStyle = '#f4efe4'; g.beginPath(); g.moveTo(14, 22); g.lineTo(46, 22); g.lineTo(42, 52); g.lineTo(18, 52); g.closePath(); g.fill();
    g.strokeStyle = '#f4efe4'; g.lineWidth = 4; g.beginPath(); g.arc(48, 34, 7, -1.2, 1.2); g.stroke();
    g.fillStyle = item.key === 'cafe_chorreado' ? '#3a1e0e' : '#a8682a'; g.fillRect(16, 24, 28, 7);
    g.strokeStyle = 'rgba(220,220,220,0.8)'; g.lineWidth = 2; for (const x of [24, 32, 40]) { g.beginPath(); g.moveTo(x, 18); g.quadraticCurveTo(x - 4, 12, x, 6); g.stroke(); }
  } else if (['pinto_huevo', 'casado', 'chifrijo', 'tamal', 'platano_maduro'].includes(item.key)) {
    if (item.key === 'tamal') {
      g.fillStyle = '#3f7a2a'; g.beginPath(); g.moveTo(10, 34); g.lineTo(32, 16); g.lineTo(54, 34); g.lineTo(32, 52); g.closePath(); g.fill();
      g.strokeStyle = '#d8c89a'; g.lineWidth = 3; g.beginPath(); g.moveTo(20, 26); g.lineTo(44, 42); g.moveTo(44, 26); g.lineTo(20, 42); g.stroke();
    } else {
      g.fillStyle = item.key === 'chifrijo' ? '#d9c39a' : '#f2f2f2'; g.beginPath(); g.ellipse(32, 38, 26, 14, 0, 0, Math.PI * 2); g.fill();
      const dots = (cols, cx, cy, rx, ry, n) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.beginPath(); g.arc(cx + (Math.random() - 0.5) * rx * 2, cy + (Math.random() - 0.5) * ry * 2, 2.4, 0, Math.PI * 2); g.fill(); } };
      if (item.key === 'pinto_huevo') { dots(['#3a1416', '#efe6c8'], 24, 38, 12, 6, 30); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(42, 34, 9, 6, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f2b020'; g.beginPath(); g.arc(42, 34, 3.5, 0, Math.PI * 2); g.fill(); }
      if (item.key === 'casado') { dots(['#efe6c8'], 20, 36, 7, 5, 14); dots(['#3a1416'], 32, 42, 6, 4, 12); g.fillStyle = '#8a4a22'; g.fillRect(36, 28, 14, 8); g.fillStyle = '#e8a83a'; g.fillRect(16, 44, 10, 4); g.fillStyle = '#5aa036'; g.fillRect(38, 40, 8, 6); }
      if (item.key === 'chifrijo') { dots(['#3a1416', '#efe6c8', '#c43020', '#c0702a'], 32, 36, 18, 8, 50); }
      if (item.key === 'platano_maduro') { for (const [x, y] of [[20, 36], [32, 40], [44, 36]]) { g.fillStyle = '#c86a1e'; g.beginPath(); g.ellipse(x, y, 8, 4, 0.4, 0, Math.PI * 2); g.fill(); g.fillStyle = '#e8a83a'; g.beginPath(); g.ellipse(x - 1, y - 1, 5, 2, 0.4, 0, Math.PI * 2); g.fill(); } }
    }
  } else if (item.key === 'lena') { // v12.1.0 C1: íconos provisionales (procedurales) hasta que llegue el arte
    for (const [y, c] of [[24, '#8a5a2b'], [36, '#7a4a22'], [48, '#94642f']]) { g.fillStyle = c; g.fillRect(10, y - 5, 44, 10); g.fillStyle = '#d8b07a'; g.beginPath(); g.ellipse(54, y, 4, 5, 0, 0, Math.PI * 2); g.fill(); }
  } else if (item.key === 'sal') {
    g.fillStyle = '#e8e2d4'; g.fillRect(18, 18, 28, 36); g.fillStyle = '#3a6aa8'; g.fillRect(18, 30, 28, 10); g.fillStyle = '#ffffff'; g.fillRect(22, 14, 20, 6);
  } else if (['carne_ahumada', 'carne_salada', 'pescado_salado'].includes(item.key)) {
    g.fillStyle = item.key === 'carne_ahumada' ? '#5a2a14' : item.key === 'carne_salada' ? '#a8504a' : '#c8b48a';
    g.beginPath(); g.ellipse(32, 34, 22, 13, -0.4, 0, Math.PI * 2); g.fill();
    g.fillStyle = item.key === 'carne_ahumada' ? '#7a3e1c' : 'rgba(255,255,255,0.7)'; for (let i = 0; i < 10; i++) g.fillRect(16 + (i * 7) % 32, 26 + (i * 5) % 16, 3, 3);
  } else if (['agua_manzanilla', 'agua_jengibre', 'te_hierbabuena', 'jarabe_sabila'].includes(item.key)) {
    g.fillStyle = '#f4efe4'; g.beginPath(); g.moveTo(14, 22); g.lineTo(46, 22); g.lineTo(42, 52); g.lineTo(18, 52); g.closePath(); g.fill();
    g.fillStyle = { agua_manzanilla: '#e8c850', agua_jengibre: '#d8a050', te_hierbabuena: '#6ab04a', jarabe_sabila: '#9ad0a0' }[item.key]; g.fillRect(16, 24, 28, 7);
  } else if (item.key === 'sobras') {
    g.fillStyle = '#6a5a3a'; g.beginPath(); g.ellipse(32, 40, 22, 12, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#8a7a4a'; for (let i = 0; i < 8; i++) g.fillRect(16 + i * 4, 34 + (i % 3) * 3, 4, 3);
  } else if (item.key === 'meat') {
    g.fillStyle = '#efe6d2';
    g.beginPath(); g.ellipse(14, 47, 6, 5, -0.6, 0, Math.PI * 2); g.fill();
    g.fillRect(14, 40, 10, 6);
    g.fillStyle = '#b8322f';
    g.beginPath(); g.ellipse(36, 30, 21, 16, -0.6, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#d9504a';
    g.beginPath(); g.ellipse(33, 27, 15, 10, -0.6, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#f3d6c8'; g.lineWidth = 3;
    g.beginPath(); g.ellipse(36, 30, 21, 16, -0.6, 3.6, 5.6); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.beginPath(); g.ellipse(28, 22, 5, 2.5, -0.6, 0, Math.PI * 2); g.fill();
  }
  if (vacio(c)) bolsita(g, item); // v12.8.2 (decimoquinta revisión, 1): nada queda invisible mientras no llegue su arte
  return c;
}
// ¿quedó el lienzo sin un solo píxel? (se mira de a 4 píxeles: basta para saber si se pintó algo)
function vacio(c) {
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  for (let i = 3; i < d.length; i += 16) if (d[i] > 20) return false;
  return true;
}
// el dibujo de respaldo: una bolsita de manta amarrada, con la inicial del ítem
function bolsita(g, item) {
  g.fillStyle = '#c8a878'; g.beginPath(); g.moveTo(16, 24); g.quadraticCurveTo(8, 56, 32, 58); g.quadraticCurveTo(56, 56, 48, 24); g.closePath(); g.fill();
  g.fillStyle = '#a8865a'; g.fillRect(22, 16, 20, 10);
  g.strokeStyle = '#6a4a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(20, 26); g.lineTo(44, 26); g.stroke();
  g.fillStyle = '#4a3218'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(String((item && (item.name || item.key)) || '?').trim().charAt(0).toUpperCase(), 32, 42);
}

function shadeHex(h, f) {
  const n = parseInt(h.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

// Herramientas de jade: el sprite de diamante teñido de verde jade.
function jadeTint(canvas) {
  const c = document.createElement('canvas');
  c.width = ICON; c.height = ICON;
  const g = c.getContext('2d');
  g.drawImage(canvas, 0, 0);
  const d = g.getImageData(0, 0, ICON, ICON);
  for (let i = 0; i < d.data.length; i += 4) {
    const r = d.data[i], gg = d.data[i + 1], b = d.data[i + 2];
    // los pixeles celestes del diamante pasan a verde jade; el mango café queda igual
    if (b > r + 30 && gg > r + 20) { d.data[i] = r * 0.45; d.data[i + 1] = gg * 0.82; d.data[i + 2] = b * 0.5; }
  }
  g.putImageData(d, 0, 0);
  return c;
}

// Versión cocinada de un sprite: más tostada y con brillo dorado.
function cooked(canvas) {
  const c = document.createElement('canvas');
  c.width = ICON; c.height = ICON;
  const g = c.getContext('2d');
  g.drawImage(canvas, 0, 0, ICON, ICON);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = 'rgba(120, 60, 20, 0.62)';
  g.fillRect(0, 0, ICON, ICON);
  g.fillStyle = 'rgba(255, 190, 90, 0.18)';
  g.fillRect(0, 0, ICON, ICON * 0.5);
  return c;
}

// ítems redibujados en pixel art: src/assets/items/<clave>.png (ver docs/PROMPT_ITEMS.md). Si existe, manda sobre lo demás.
const NUEVOS = import.meta.glob('./assets/items/*.png', { eager: true, query: '?url', import: 'default' });
const nuevoURL = {};
for (const [path, url] of Object.entries(NUEVOS)) nuevoURL[path.split('/').pop().replace(/\.png$/, '')] = url;

// v11.11.3: los íconos de bloque con arte propio (el chanchito): se dibujan planos en vez del cubito isométrico
const arteBloque = new Map();
export async function loadSprites() {
  const jobs = [];
  for (const b of BLOCKS) if (b && b.arte) jobs.push(loadImage(`./sprites/${b.arte}.png`).then((img) => { if (img) arteBloque.set(b.id, img); }));
  for (const it of Object.values(ITEMS)) {
    if (it.arte) { // el arte de GPT primero; si no carga, lo de siempre
      jobs.push(loadImage(`./sprites/${it.arte}.png`).then(async (img) => {
        if (img) {
          const c = document.createElement('canvas');
          c.width = ICON; c.height = ICON;
          const g = c.getContext('2d');
          g.imageSmoothingQuality = 'high';
          g.drawImage(img, 0, 0, ICON, ICON);
          spriteCanvases.set(it.id, c);
          return;
        }
        console.warn(`Arte sin cargar: ${it.arte} (queda el dibujo de respaldo)`);
        const alt = nuevoURL[it.icono || it.key] ? await loadImage(nuevoURL[it.icono || it.key]) : it.sprite ? await loadImage(`./sprites/${it.sprite}.png`) : null;
        if (!alt) { spriteCanvases.set(it.id, paintFlat(it)); return; }
        const c = document.createElement('canvas');
        c.width = ICON; c.height = ICON;
        const g = c.getContext('2d');
        g.imageSmoothingEnabled = !nuevoURL[it.icono || it.key];
        g.drawImage(alt, 0, 0, ICON, ICON);
        spriteCanvases.set(it.id, c);
      }));
    } else if (nuevoURL[it.icono || it.key]) { // icono: otro ítem con el mismo dibujo
      jobs.push(loadImage(nuevoURL[it.icono || it.key]).then((img) => {
        const c = document.createElement('canvas');
        c.width = ICON; c.height = ICON;
        const g = c.getContext('2d');
        g.imageSmoothingEnabled = false; // pixel art nítido al agrandar
        if (img) g.drawImage(img, 0, 0, ICON, ICON);
        if (img && it.tinte) { g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.5; g.fillStyle = it.tinte; g.fillRect(0, 0, ICON, ICON); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; } // v12.7.0: otra especie con el mismo dibujo
        spriteCanvases.set(it.id, img ? c : paintFlat(it));
      }));
    } else if (it.sprite) {
      jobs.push(loadImage(`./sprites/${it.sprite}.png`).then((img) => {
        const c = document.createElement('canvas');
        c.width = ICON; c.height = ICON;
        const g = c.getContext('2d');
        g.imageSmoothingQuality = 'high';
        if (img) g.drawImage(img, 0, 0, ICON, ICON);
        spriteCanvases.set(it.id, img ? (it.tintJade ? jadeTint(c) : c) : paintFlat(it));
      }));
    } else spriteCanvases.set(it.id, paintFlat(it));
  }
  await Promise.all(jobs);
  const raw = Object.values(ITEMS).find((i) => i.key === 'meat');
  const ck = Object.values(ITEMS).find((i) => i.key === 'cooked_meat');
  if (raw && ck && !nuevoURL.cooked_meat) spriteCanvases.set(ck.id, cooked(spriteCanvases.get(raw.id)));
}

export function itemCanvas(id) { return spriteCanvases.get(id) || paintFlat(ITEMS[id] || {}); }

// ---------- Íconos de bloques (isométricos) ----------
const BICON = 48;
const iconCache = new Map();

function shadedTile(name, f) {
  const c = document.createElement('canvas');
  c.width = T; c.height = T;
  const ctx = c.getContext('2d');
  ctx.drawImage(tileImages[name], 0, 0);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = `rgba(0,0,0,${f})`;
  ctx.fillRect(0, 0, T, T);
  return c;
}

function blockIcon(b) {
  const c = document.createElement('canvas');
  c.width = BICON; c.height = BICON;
  const ctx = c.getContext('2d');
  if (arteBloque.has(b.id)) { ctx.imageSmoothingQuality = 'high'; ctx.drawImage(arteBloque.get(b.id), 0, 0, BICON, BICON); return c.toDataURL(); }
  ctx.imageSmoothingEnabled = false;
  if (b.render === 'cross' || b.render === 'torch') {
    ctx.drawImage(tileImages[b.tex.side], 4, 4, 40, 40);
    return c.toDataURL();
  }
  ctx.setTransform(20 / 16, -10 / 16, 20 / 16, 10 / 16, 4, 14);
  ctx.drawImage(tileImages[b.tex.top], 0, 0);
  ctx.setTransform(20 / 16, 10 / 16, 0, 22 / 16, 4, 14);
  ctx.drawImage(shadedTile(b.tex.front, 0.2), 0, 0);
  ctx.setTransform(20 / 16, -10 / 16, 0, 22 / 16, 24, 24);
  ctx.drawImage(shadedTile(b.tex.side, 0.38), 0, 0);
  return c.toDataURL();
}

export function iconURL(id) {
  if (iconCache.has(id)) return iconCache.get(id);
  const url = isBlockId(id) ? blockIcon(BLOCKS[id]) : itemCanvas(id).toDataURL();
  iconCache.set(id, url);
  return url;
}
