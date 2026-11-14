// v12.4.9 (novena revisión, hallazgo 4); v12.5.1 (undécima, hallazgo 3): MIN_VERSION tiene que cubrir TODOS los ids que existen. La
// prueba calcula una firma (cuántos bloques, cuántos ítems y un hash de la lista de ids) y la compara con MIN_IDS de src/version.js.
// Si alguien agrega un bloque o un ítem (aunque sea por debajo del más alto) la firma cambia y la prueba falla: hay que subir
// MIN_VERSION y copiar la firma nueva. También: los ítems de más de 599 tienen que estar en [EXT_ITEM, MAX_ITEM), y compararVersion.
// Uso: node tools/revisar-version.mjs
import { BLOCKS, ITEMS, EXT_ITEM, MAX_ITEM, MAX_BLOCK } from '../src/blocks.js';
import { MIN_VERSION, MIN_IDS, GAME_VERSION } from '../src/version.js';
import { compararVersion, leerVersion, compatibilidad } from '../src/save.js';

let fallas = 0;
const ok = (c, t) => { if (c) console.log(`✔ ${t}`); else { fallas++; console.log(`✘ ${t}`); } };
export function firmaIds() {
  const bloques = BLOCKS.map((b, i) => (b && b.key && b.key !== 'air' ? i : -1)).filter((i) => i > 0); // los huecos del arreglo son aire
  const items = Object.keys(ITEMS).map(Number).filter((i) => ITEMS[i] && ITEMS[i].key).sort((a, b) => a - b);
  let h = 2166136261; // FNV-1a de la lista
  for (const i of [...bloques, -1, ...items]) { h ^= i & 0xffff; h = Math.imul(h, 16777619) >>> 0; h ^= i >>> 16; h = Math.imul(h, 16777619) >>> 0; }
  return { bloques: bloques.length, items: items.length, hash: h.toString(16), maxBloque: Math.max(...bloques), maxItem: Math.max(...items), itemsRaros: items.filter((i) => i >= 600 && (i < EXT_ITEM || i >= MAX_ITEM)) };
}
const F = firmaIds();
const igual = F.bloques === MIN_IDS.bloques && F.items === MIN_IDS.items && F.hash === MIN_IDS.hash;
ok(igual, igual ? `la firma de ids coincide con MIN_IDS (${F.bloques} bloques, ${F.items} ítems)` : `los ids cambiaron: suba MIN_VERSION en src/version.js y ponga MIN_IDS = { bloques: ${F.bloques}, items: ${F.items}, hash: '${F.hash}', version: '<la versión nueva>' }`);
ok(MIN_IDS.version === MIN_VERSION, `MIN_IDS.version (${MIN_IDS.version}) es MIN_VERSION (${MIN_VERSION}): al copiar la firma nueva, subir las dos`); // v12.6.3 (decimotercera revisión, hallazgo 5)
ok(F.maxBloque < MAX_BLOCK, `ningún bloque pasa de ${MAX_BLOCK - 1} (el más alto: ${F.maxBloque})`);
ok(!F.itemsRaros.length, `los ítems de 600 en adelante están en ${EXT_ITEM}–${MAX_ITEM - 1}${F.itemsRaros.length ? ` (fuera: ${F.itemsRaros.join(', ')})` : ''}`);
ok(compararVersion(MIN_VERSION, GAME_VERSION) <= 0, `MIN_VERSION ${MIN_VERSION} no pasa de GAME_VERSION ${GAME_VERSION}`);
ok(compararVersion('12.10.0', '12.4.7') === 1 && compararVersion('12.4.10', '12.4.9') === 1 && compararVersion('12.4.7', '12.4.7') === 0, 'compararVersion número a número');
ok(compararVersion('v12.4.7', '12.4.7') === 0 && leerVersion('v13.0')[0] === 13, 'el prefijo «v» se acepta');
ok(leerVersion('hola') === null && leerVersion('12.4.7-beta') === null, 'lo que no es versión da null');
ok(!!(compatibilidad({ minVersion: 'hola' }) || {}).bloquea, 'una minVersion rara no se abre');
ok(!compatibilidad({ minVersion: MIN_VERSION, gameVersion: GAME_VERSION }), 'un mundo de esta versión abre sin preguntar');
console.log(fallas ? `\n${fallas} falla(s)` : '\nTodo bien: MIN_VERSION cubre todos los ids y las versiones se comparan bien.');
if (fallas) process.exitCode = 1;
