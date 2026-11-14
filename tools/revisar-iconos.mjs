// v12.8.2 (decimoquinta revisión, punto 1): que ningún ítem quede sin dibujo. Un ítem tiene ícono si tiene arte de GPT
// (public/sprites/arte/<clave>.png), un PNG propio o prestado (src/assets/items/<icono o clave>.png), un sprite viejo
// (public/sprites/<sprite>.png) o un pintor en paintFlat (textures.js: item.key === '…' o una lista con .includes(item.key)).
// Si no tiene nada, en el juego sale la bolsita con la inicial (el respaldo): aquí eso cuenta como falla.
// Uso: node tools/revisar-iconos.mjs
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ITEMS } from '../src/blocks.js';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const tex = readFileSync(raiz + 'src/textures.js', 'utf8');
const pintados = new Set();
for (const m of tex.matchAll(/item\.key === '([a-z0-9_]+)'/g)) pintados.add(m[1]);
for (const m of tex.matchAll(/\[([^\]]+)\]\.includes\(item\.key\)/g)) for (const k of m[1].matchAll(/'([a-z0-9_]+)'/g)) pintados.add(k[1]);
const falta = [];
let n = 0;
for (const it of Object.values(ITEMS)) {
  if (!it || !it.key) continue;
  n++;
  const ok = (it.arte && existsSync(`${raiz}public/sprites/${it.arte}.png`))
    || existsSync(`${raiz}src/assets/items/${it.icono || it.key}.png`)
    || (it.sprite !== undefined && existsSync(`${raiz}public/sprites/${it.sprite}.png`))
    || pintados.has(it.key)
    || !!it.plata || !!it.armor; // paintFlat también pinta por propiedad: la plata (monedas y billetes) y la armadura
  if (!ok) falta.push(`${it.id} ${it.key}`);
}
console.log(falta.length ? `Sin dibujo (en el juego saldrían como bolsita): ${falta.join(', ')}` : `Los ${n} ítems tienen dibujo.`);
if (falta.length) process.exitCode = 1;
