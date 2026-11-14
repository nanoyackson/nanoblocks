// Arte grande que se reparte en varios bloques: el mural del cielo raso del Teatro Nacional (pixel art propio,
// inspirado en el tema de la cosecha de café y banano y el puerto) y la rueda grande pintada de la carreta de Sarchí.
// Cada imagen se pinta una vez y cada bloque toma su pedazo de 16x16.
import { mulberry32 } from './noise.js';

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

class Img {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
  set(x, y, c, a = 255) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; this.d[i + 3] = a;
  }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  disc(cx, cy, r, c) { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if (Math.hypot(x - cx, y - cy) <= r) this.set(x, y, c); }
}

// ---------- mural: cosecha de café y banano con el puerto al fondo (64x32) ----------
let mural = null;
export function muralImage() {
  if (mural) return mural;
  const m = new Img(64, 32);
  const rnd = mulberry32(1897);
  // cielo de atardecer con nubes
  for (let y = 0; y < 13; y++) for (let x = 0; x < 64; x++) {
    const t = y / 13;
    m.set(x, y, [Math.round(120 + 110 * t), Math.round(170 + 50 * t), Math.round(220 - 40 * t)]);
  }
  for (const [cx, cy, w] of [[10, 3, 8], [30, 2, 10], [50, 4, 7]]) for (let i = -w; i <= w; i++) { m.set(cx + i, cy, hex('#f4f0e8')); if (Math.abs(i) < w - 2) m.set(cx + i, cy - 1, hex('#ffffff')); }
  // cerros azules lejanos
  for (let x = 0; x < 64; x++) { const h = 11 + Math.round(Math.sin(x * 0.18) * 2 + Math.sin(x * 0.07) * 2); for (let y = h; y < 15; y++) m.set(x, y, hex(y === h ? '#6a86a8' : '#5a7898')); }
  // el mar y el puerto a la izquierda, con un velero
  for (let y = 14; y < 18; y++) for (let x = 0; x < 22; x++) m.set(x, y, hex((x + y) % 3 ? '#3a78b8' : '#4a8ac8'));
  m.rect(16, 16, 8, 1, hex('#6a4a2a')); // muelle
  m.rect(4, 15, 7, 2, hex('#5a3a22')); // casco
  m.rect(7, 8, 1, 7, hex('#3a2a1a')); // mástil
  for (let k = 0; k < 6; k++) m.rect(8, 9 + k, 1 + Math.floor(k * 0.7), 1, hex('#f4f0e4'));
  for (let k = 0; k < 4; k++) m.rect(6 - Math.floor(k * 0.6), 10 + k, 1 + Math.floor(k * 0.6), 1, hex('#e8e4d8'));
  // tierra del cafetal
  for (let y = 15; y < 32; y++) for (let x = 18; x < 64; x++) m.set(x, y, hex(rnd() < 0.5 ? '#6a8a3a' : '#5a7a30'));
  for (let y = 18; y < 32; y++) for (let x = 0; x < 18; x++) m.set(x, y, hex(rnd() < 0.5 ? '#7a6a3a' : '#6a5a30'));
  // cafetos con granos rojos
  for (const [cx, cy] of [[24, 18], [32, 17], [44, 18], [56, 17], [28, 23], [40, 22], [52, 23], [60, 22]]) {
    m.disc(cx, cy, 3, hex('#2a5a1e')); m.disc(cx - 1, cy - 1, 2, hex('#3a7a28'));
    for (let k = 0; k < 4; k++) m.set(cx - 2 + Math.floor(rnd() * 5), cy - 1 + Math.floor(rnd() * 3), hex('#d02020'));
  }
  // matas de banano a la derecha
  for (const bx of [58, 63]) {
    m.rect(bx, 12, 1, 12, hex('#6a8a3a'));
    for (const [dx, dy] of [[-4, 0], [3, 1], [-3, 3], [4, 4]]) for (let k = 0; k < 4; k++) m.set(bx + Math.sign(dx) * k, 12 + dy + Math.floor(k / 2), hex('#3a8a2a'));
    m.rect(bx - 1, 17, 2, 3, hex('#e8c830'));
  }
  // personajes: cogedora de café con canasto, hombre con racimo de banano al hombro, niño con saco, señor sentado
  const person = (x, y, shirt, pants, skin, hat) => {
    m.rect(x, y + 3, 3, 4, hex(shirt)); m.rect(x, y + 7, 1, 3, hex(pants)); m.rect(x + 2, y + 7, 1, 3, hex(pants));
    m.rect(x, y, 3, 3, hex(skin)); m.set(x, y + 1, hex('#2a1a10')); m.set(x + 2, y + 1, hex('#2a1a10'));
    if (hat) { m.rect(x - 1, y - 1, 5, 1, hex(hat)); m.rect(x, y - 2, 3, 1, hex(hat)); } else m.rect(x, y - 1, 3, 1, hex('#2a1a10'));
  };
  person(22, 20, '#f4f0e8', '#f4f0e8', '#c8946a', null); // ella, vestido blanco
  m.rect(25, 24, 3, 3, hex('#8a6a3a')); m.rect(25, 24, 3, 1, hex('#d02020')); // canasto con café
  person(34, 19, '#3a5aa8', '#4a3a2a', '#b07a50', '#e8dcb0'); // él, con sombrero
  m.rect(36, 18, 4, 3, hex('#e8c830')); m.rect(37, 17, 2, 1, hex('#6a8a3a')); // racimo al hombro
  person(46, 22, '#c84a2a', '#4a3a2a', '#c8946a', null); // niño
  m.rect(49, 26, 3, 4, hex('#c8b890')); // saco de café
  person(52, 20, '#e8e4d8', '#3a3a3a', '#a06a40', '#3a2a1a');
  m.rect(51, 27, 5, 2, hex('#7a5a30')); // banco
  // carreta de café chiquitica al fondo
  m.rect(12, 21, 5, 2, hex('#b82222')); m.disc(13, 24, 1.5, hex('#f0c020')); m.disc(16, 24, 1.5, hex('#f0c020'));
  // marco dorado
  for (let x = 0; x < 64; x++) { m.set(x, 0, hex('#c8a030')); m.set(x, 31, hex('#c8a030')); m.set(x, 1, hex('#8a6a18')); m.set(x, 30, hex('#8a6a18')); }
  for (let y = 0; y < 32; y++) { m.set(0, y, hex('#c8a030')); m.set(63, y, hex('#c8a030')); m.set(1, y, hex('#8a6a18')); m.set(62, y, hex('#8a6a18')); }
  mural = m;
  return m;
}

// ---------- rueda grande de carreta (48x48, transparente fuera del círculo) ----------
let wheel = null;
export function wheelImage() {
  if (wheel) return wheel;
  const m = new Img(48, 48);
  const C = ['#c8202a', '#f0c020', '#1a5ac8', '#2a9a40', '#f4f0e0', '#e86a1a'];
  for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) {
    const d = Math.hypot(x - 23.5, y - 23.5), a = Math.atan2(y - 23.5, x - 23.5);
    if (d > 23.5) continue;
    if (d > 21.5) { m.set(x, y, hex('#2a1e14')); continue; } // aro de hierro
    if (d > 19.5) { m.set(x, y, hex('#c8202a')); continue; }
    if (d < 3) { m.set(x, y, hex('#2a1e14')); continue; } // maza
    if (d < 6) { m.set(x, y, hex('#f0c020')); continue; }
    // estrella de puntas y anillos de colores, como las pintadas en Sarchí
    const star = Math.abs(Math.sin(a * 8)) * 6;
    const ring = Math.floor((d - star * 0.4) / 3.2);
    const ray = Math.floor(((a + Math.PI) / (Math.PI * 2)) * 16);
    m.set(x, y, hex(C[(ring + (ray % 2 ? 2 : 0)) % C.length]));
  }
  wheel = m;
  return wheel;
}

// pedazo (i, j) de 16x16 de una imagen, para un pintor de textura
export function slicePainter(img, i, j) {
  return (t) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const k = ((j * 16 + y) * img.w + (i * 16 + x)) * 4;
      const a = img.d[k + 3];
      if (a) t.set(x, y, [img.d[k], img.d[k + 1], img.d[k + 2]], a);
      else t.set(x, y, [0, 0, 0], 0);
    }
  };
}
