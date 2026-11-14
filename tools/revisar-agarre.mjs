// v12.8.2 (decimoquinta revisión, punto 2): el tipo de agarre de cada ítem (agarre.js tipoAgarre) contra una lista fija
// (tools/agarre-esperado.json). Falla si uno cambia o si aparece uno nuevo sin revisar: así un ítem de C6/C7 que entre por las
// regex como «recipiente» por casualidad no pasa callado. Uso:
//   node tools/revisar-agarre.mjs            → compara y cuenta por tipo
//   node tools/revisar-agarre.mjs --guardar  → reescribe la lista (después de mirar las hojas de la mano: tools/hoja-mano.js)
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ITEMS } from '../src/blocks.js';
import { tipoAgarre } from '../src/agarre.js';

const archivo = fileURLToPath(new URL('./agarre-esperado.json', import.meta.url));
const hoy = {};
for (const it of Object.values(ITEMS)) if (it && it.key) hoy[it.key] = tipoAgarre(it.id);
const cuenta = {};
for (const t of Object.values(hoy)) cuenta[t] = (cuenta[t] || 0) + 1;
if (process.argv.includes('--guardar') || !existsSync(archivo)) {
  writeFileSync(archivo, JSON.stringify(hoy, null, 1) + '\n');
  console.log(`Lista guardada (${Object.keys(hoy).length} ítems):`, cuenta);
} else {
  const antes = JSON.parse(readFileSync(archivo, 'utf8')), cambios = [];
  for (const [k, t] of Object.entries(hoy)) if (antes[k] !== t) cambios.push(`${k}: ${antes[k] || '(nuevo)'} → ${t}`);
  for (const k of Object.keys(antes)) if (!(k in hoy)) cambios.push(`${k}: ya no existe`);
  console.log('Por tipo:', cuenta);
  console.log(cambios.length ? `Cambió el agarre de ${cambios.length}:\n  ${cambios.join('\n  ')}\n(mírelos en la hoja de la mano y, si están bien: node tools/revisar-agarre.mjs --guardar)` : `Los ${Object.keys(hoy).length} ítems se agarran como en la lista.`);
  if (cambios.length) process.exitCode = 1;
}
