// v12.4.11 (DISENO_CONTENIDO_C5-C8.md §0.4): la prueba mínima del rango de ítems nuevo (EXT_ITEM = 1100). Registra un ítem de prueba
// en el primer id libre desde 1100 (solo en este proceso) y lo pasa por todo lo que toca un ítem: getDef, la pila, el inventario, el guardado (JSON) y la
// importación (validarMundo). Uso: node tools/revisar-ext-item.mjs
import { ITEMS, EXT_ITEM, MAX_ITEM, MAX_BLOCK, isBlockId, getDef, maxStack } from '../src/blocks.js';
import { Inventory } from '../src/inventory.js';
import { validarMundo } from '../src/importar.js';

let fallas = 0;
const ok = (c, t) => { if (c) console.log(`✔ ${t}`); else { fallas++; console.log(`✘ ${t}`); } };
ok(EXT_ITEM >= MAX_BLOCK && MAX_ITEM > EXT_ITEM, `el rango ${EXT_ITEM}–${MAX_ITEM - 1} queda arriba de los bloques (${MAX_BLOCK})`);
ok(!isBlockId(EXT_ITEM) && !isBlockId(MAX_ITEM - 1), 'isBlockId da falso en el rango');
let id = EXT_ITEM; while (ITEMS[id]) id++; // v12.7.0: el primero libre del rango (el 1100 ya es la caña de fibra)
ITEMS[id] = ITEMS[id] || { id, key: 'prueba_ext', name: 'Ítem de prueba', isBlock: false, stack: 64 };
ok(getDef(id) === ITEMS[id] && maxStack(id) === 64, 'getDef y la pila lo reconocen');
const inv = new Inventory();
const sobra = inv.add(id, 70);
ok(inv.count(id) + sobra === 70 && inv.slots.filter((s) => s && s.id === id).length === 2, `el inventario lo apila (${inv.count(id)} en 2 casillas)`);
inv.remove(id, 5);
ok(inv.count(id) === 65, 'y lo saca');
const json = JSON.parse(JSON.stringify(inv.toJSON()));
const inv2 = new Inventory(); inv2.load(json);
ok(inv2.count(id) === 65, 'se guarda y se carga igual');
const v = validarMundo({ app: 'NanoBlocks', meta: { name: 'x', inventory: json }, chunks: [], be: [['0,0', [[5, { type: 'chest', slots: [{ id, count: 12 }] }]]]] });
ok(v.meta.inventory.slots.some((s) => s && s.id === id && s.count === 64), 'la importación lo deja pasar en el inventario');
ok(v.be[0][1][0][1].slots[0] && v.be[0][1][0][1].slots[0].id === id, 'y en un cofre');
let libre = id + 1; while (ITEMS[libre]) libre++;
const raro = validarMundo({ app: 'NanoBlocks', meta: { name: 'x', inventory: { slots: [{ id: libre, count: 1 }] } } });
ok(raro.meta.inventory.slots[0] === null, 'un id del rango que no existe se descarta');
console.log(fallas ? `\n${fallas} falla(s)` : `\nTodo bien: el rango de ítems ${EXT_ITEM}+ funciona de punta a punta.`);
if (fallas) process.exitCode = 1;
