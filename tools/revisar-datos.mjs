// Revisa lo que se puede romper sin que nada falle a la vista: logros que la historia espera y que nadie da, objetos de tiendas o de botín que
// no existen, texturas sin dibujo y sonidos que se piden y no están. Uso: node tools/revisar-datos.mjs (lo que sale hay que mirarlo).
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { BLOCKS, ITEMS } from '../src/blocks.js';

const raiz = fileURLToPath(new URL('..', import.meta.url)), dir = `${raiz}src/`;
const archivos = readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'version.js' && f !== 'logros-lista.js');
const texto = Object.fromEntries(archivos.map((f) => [f, readFileSync(dir + f, 'utf8')]));
const todo = Object.values(texto).join('\n');
const avisar = (t, L) => { console.log(`\n== ${t}: ${L.length}`); for (const x of L.slice(0, 40)) console.log(`  ${x}`); };

// 1. logros que se revisan y que nadie da
const dados = new Set();
for (const m of todo.matchAll(/achieve\(\s*'([a-zA-Z0-9_]+)'/g)) dados.add(m[1]);
const prefijos = [...todo.matchAll(/achieve\(\s*`([a-zA-Z0-9_]+)\$\{/g)].map((m) => m[1]);
const pedidos = new Map();
for (const [f, t] of Object.entries(texto)) {
  for (const m of t.matchAll(/\bach\(g,\s*((?:'[a-zA-Z0-9_]+'(?:,\s*)?)+)\)/g)) for (const q of m[1].matchAll(/'([a-zA-Z0-9_]+)'/g)) pedidos.set(q[1], f);
  for (const m of t.matchAll(/achievements\.has\('([a-zA-Z0-9_]+)'\)/g)) pedidos.set(m[1], f);
}
avisar('Logros que se piden y nadie da', [...pedidos].filter(([k]) => !dados.has(k) && !prefijos.some((p) => k.startsWith(p))).map(([k, f]) => `${k} (en ${f})`));

// 2. objetos de tiendas y de botín que no existen
const existe = (id) => !!(BLOCKS[id] || ITEMS[id]);
const malos = [];
for (const [f, t] of Object.entries(texto)) {
  for (const m of t.matchAll(/(?:giveItem|dropItem)\(\s*(\d+)\b/g)) if (!existe(+m[1])) malos.push(`${m[1]} en ${f}`);
  for (const m of t.matchAll(/drops:\s*\[((?:\[\d+,\s*\d+,\s*\d+\](?:,\s*)?)+)\]/g)) for (const q of m[1].matchAll(/\[(\d+),/g)) if (!existe(+q[1])) malos.push(`${q[1]} (drops) en ${f}`);
}
for (const m of texto['pueblo.js'].matchAll(/\[(\d+), \d+, \d+\]/g)) if (!existe(+m[1])) malos.push(`${m[1]} (tienda) en pueblo.js`);
avisar('Objetos que no existen', [...new Set(malos)]);

// 3. texturas de bloques sin dibujo
const pix = texto['pixelart.js'] + texto['textures.js'];
// los cultivos, el mural y la rueda se dibujan en bucle: no aparecen con su nombre
const enBucle = /^(corn|beans|cafe|pina)\d$|^(mural|ruedag)_\d_\d$/;
const tiene = (n) => enBucle.test(n) || new RegExp(`\\bP\\.${n}\\b|\\b${n}\\s*[:(]|['"\`]${n}['"\`]`).test(pix);
const tex = new Set();
for (const b of Object.values(BLOCKS)) { if (!b || !b.tex) continue; if (typeof b.tex === 'string') tex.add(b.tex); else for (const v of Object.values(b.tex)) if (typeof v === 'string') tex.add(v); }
avisar('Texturas sin dibujo', [...tex].filter((n) => !tiene(n)));

// 4. sonidos que se piden y no están
const manifest = JSON.parse(readFileSync(`${raiz}public/sounds/real/manifest.json`, 'utf8')), bancos = manifest.banks || manifest;
const pedidosSon = new Map();
for (const [f, t] of Object.entries(texto)) for (const m of t.matchAll(/audio\.play\('([a-zA-Z0-9_.ñ]+)'/g)) pedidosSon.set(m[1], f);
const audio = texto['audio.js'];
avisar('Sonidos que se piden y no están', [...pedidosSon].filter(([k]) => !bancos[k] && !audio.includes(`'${k}'`) && !audio.includes(`${k}:`)).map(([k, f]) => `${k} (en ${f})`));

// v11.9.2: propiedades que quedaron dentro de un comentario a media línea (pasó con el escarabajo: se tragó su sonido)
const tragadas = [];
for (const [f, t] of Object.entries(texto)) {
  t.split(/\r?\n/).forEach((ln, i) => {
    const k = ln.indexOf('// ');
    if (k > 0 && ln.slice(0, k).trim() && /\b(hurtSound|idleSound|idleEvery|health|attack|speed|drops|hostile|hardness|durability|stack): [^\s]/.test(ln.slice(k))) tragadas.push(`${f}:${i + 1}`);
  });
}
avisar('Propiedades dentro de un comentario', tragadas);
