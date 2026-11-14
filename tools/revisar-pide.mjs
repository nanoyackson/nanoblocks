// v12.8.3 (decimosexta revisión, punto 1): que PIDE (encargos2.js, lo que pide cada oficio en el tablón) no pierda un oficio. En la
// v12.7.0 un comentario // se tragó a la panadera y al carnicero y nadie lo notó: dejaron de dar encargos sin un solo error.
// Se lee el texto (encargos2.js trae texturas y no corre en node): se quitan los comentarios del bloque y se busca cada oficio.
// v12.8.6 (decimoctava revisión, punto 5): también se quitan los /* … */, el bloque se corta en SU llave de cierre (contando llaves, no en
// el primer «};») y cada lista se revisa: que no esté vacía y que cada id exista (getDef; blocks.js sí corre en node). Las listas con
// nombre (COSECHAS) se buscan en economia.js. Uso: node tools/revisar-pide.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getDef } from '../src/blocks.js';
import * as economia from '../src/economia.js';

const txt = readFileSync(fileURLToPath(new URL('../src/encargos2.js', import.meta.url)), 'utf8');
const i = txt.indexOf('export const PIDE = {');
if (i < 0) { console.log('✘ No encontré «export const PIDE = {» en encargos2.js'); process.exit(1); }
// sin comentarios (de bloque y de línea), y hasta la llave que cierra la del principio
const limpio = txt.slice(i).replace(/\/\*[\s\S]*?\*\//g, ' ').split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
let prof = 0, fin = -1;
for (let k = limpio.indexOf('{'); k < limpio.length; k++) {
  if (limpio[k] === '{') prof++;
  else if (limpio[k] === '}' && --prof === 0) { fin = k; break; }
}
if (fin < 0) { console.log('✘ PIDE no cierra su llave'); process.exit(1); }
const bloque = limpio.slice(0, fin + 1);
const OFICIOS = ['pulpero', 'feriante', 'frutero', 'caficultor', 'sodera', 'sodera_playa', 'panadera', 'carnicero', 'herrero', 'ferretero', 'vecino'];
const faltan = OFICIOS.filter((k) => !new RegExp(`(^|[\\s,{])${k}:\\s*[\\[A-Z]`).test(bloque));
const hay = [...bloque.matchAll(/([a-z_]+):\s*[[A-Z]/g)].map((m) => m[1]), nuevos = hay.filter((k) => !OFICIOS.includes(k));
console.log(faltan.length ? `✘ PIDE perdió: ${faltan.join(', ')}` : `Los ${OFICIOS.length} oficios de PIDE están.`);
if (nuevos.length) console.log(`Oficios nuevos sin revisar (súmelos a OFICIOS): ${nuevos.join(', ')}`);
// cada lista: los números, o la constante con nombre
const malos = [];
for (const m of bloque.matchAll(/([a-z_]+):\s*(\[[^\]]*\]|[A-Z_]+)/g)) {
  const [, k, v] = m;
  let ids;
  if (v.startsWith('[')) ids = (v.match(/\d+/g) || []).map(Number);
  else if (Array.isArray(economia[v])) ids = economia[v];
  else { malos.push(`${k}: la lista ${v} no está en economia.js`); continue; }
  if (!ids.length) malos.push(`${k}: lista vacía`);
  const raros = ids.filter((id) => !getDef(id));
  if (raros.length) malos.push(`${k}: ids que no existen ${raros.join(', ')}`);
}
if (malos.length) console.log(`✘ ${malos.join('\n✘ ')}`); else console.log(`Las ${hay.length} listas tienen ids que existen.`);
if (faltan.length || nuevos.length || malos.length) process.exitCode = 1;
