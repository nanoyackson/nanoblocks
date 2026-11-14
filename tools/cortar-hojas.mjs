// Corta las hojas de pixel art (assets-src/items/hoja-N.png, 256×256, 8×8 celdas de 32×32) en un PNG por ítem:
// src/assets/items/<clave>.png, según el orden de assets-src/items/orden.json (lo arma tools/lista-items.mjs).
// Las celdas vacías (totalmente transparentes) se saltan. Requiere ffmpeg en el PATH.
// Uso: node tools/cortar-hojas.mjs
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'assets-src/items');
const OUT = join(ROOT, 'src/assets/items');
mkdirSync(OUT, { recursive: true });
const orden = JSON.parse(readFileSync(join(SRC, 'orden.json'), 'utf8'));
const CELL = 32, POR_HOJA = 64;
let hechos = 0, vacios = 0;
// las hojas numeradas siguen orden.json; la hoja «faltan» (si está) sigue faltan.json
const trabajos = Array.from({ length: Math.ceil(orden.length / POR_HOJA) }, (_, i) => ({ hoja: join(SRC, `hoja-${i + 1}.png`), keys: orden.slice(i * POR_HOJA, (i + 1) * POR_HOJA) }));
if (existsSync(join(SRC, 'faltan.json'))) trabajos.push({ hoja: join(SRC, 'faltan.png'), keys: JSON.parse(readFileSync(join(SRC, 'faltan.json'), 'utf8')) });
for (const { hoja, keys } of trabajos) {
  if (!existsSync(hoja)) { console.log(`(no está ${hoja}, se salta)`); continue; }
  // si la hoja no viene a 256×256, se escala sin suavizar
  const W = Number(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width', '-of', 'csv=p=0', hoja]).toString().trim());
  const k = W / (CELL * 8);
  for (let c = 0; c < POR_HOJA; c++) {
    const key = keys[c];
    if (!key) break;
    const x = Math.round((c % 8) * CELL * k), y = Math.round(Math.floor(c / 8) * CELL * k), s = Math.round(CELL * k);
    const dst = join(OUT, `${key}.png`);
    // la hoja «faltan» no pisa dibujos que ya existen
    if (hoja.endsWith('faltan.png') && existsSync(dst)) continue;
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', hoja, '-vf', `crop=${s}:${s}:${x}:${y},scale=${CELL}:${CELL}:flags=neighbor`, dst]);
    // ¿quedó vacía? (alfa en cero en toda la celda)
    // (ffmpeg imprime los metadatos por la salida de errores)
    const r = spawnSync('ffmpeg', ['-v', 'info', '-i', dst, '-vf', 'alphaextract,signalstats,metadata=print:key=lavfi.signalstats.YMAX', '-f', 'null', '-'], { encoding: 'utf8' });
    const m = /YMAX=(\d+)/.exec(r.stderr || '');
    if (m && Number(m[1]) === 0) { rmSync(dst); vacios++; } else hechos++;
  }
}
console.log(`listo: ${hechos} íconos en src/assets/items/ (${vacios} celdas vacías saltadas)`);
