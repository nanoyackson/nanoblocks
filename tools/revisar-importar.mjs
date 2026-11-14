// Prueba la limpieza de los mundos importados (v12.4.3, AUDITORIA_SEGURIDAD_PREVIA C4): archivos con __proto__, constructor, HTML en los
// textos, números gigantes, NaN, ids negativos o que no existen, cantidades enormes y claves de chunk raras. Uso: node tools/revisar-importar.mjs
import { validarMundo } from '../src/importar.js';

let fallas = 0;
const ok = (c, t) => { if (c) console.log(`✔ ${t}`); else { fallas++; console.log(`✘ ${t}`); } };

const malo = JSON.parse(`{
  "app": "NanoBlocks", "format": 6,
  "meta": {
    "name": "<img src=x onerror=alert(1)>Mi mundo\\u0007",
    "seed": 123, "day": 1e300, "time": 0.3,
    "__proto__": { "contaminado": true },
    "constructor": { "prototype": { "contaminado": true } },
    "diario": [{ "d": 1, "i": "<img src=x onerror=alert(1)>", "t": "hola <b>" }],
    "spawn": { "x": 1e99, "y": -5000, "z": "nada" },
    "player": { "x": 0, "y": 70, "z": 0, "health": 1e9, "food": -3, "flying": "sí", "__proto__": { "x": 1 } },
    "inventory": { "slots": [{ "id": -5, "count": 3 }, { "id": 99999, "count": 1 }, { "id": 262, "count": 1e9 }, { "id": 262, "count": 4, "dia": 3 }], "selected": 50, "billetera": { "360": 1e12, "abc": 5, "-1": 3 } },
    "funcion": "() => 1", "profundo": ${'{"a":'.repeat(40)}1${'}'.repeat(40)}
  },
  "chunks": [["0,0", [[5, 1], [6, -3], [7, 99999], [-1, 1], [999999999, 1], [8, 1.5]]], ["__proto__", [[1, 1]]], ["1e9,0", [[1, 1]]], ["2,3", "nada"]],
  "be": [["0,0", [[10, { "type": "chest", "nombre": "<script>x</script>Mi cofre", "slots": [{ "id": 262, "count": 9999 }, { "id": 0, "count": 1 }, null] }], [-4, { "type": "chest" }]]]]
}`);
const v = validarMundo(malo);
ok(!('contaminado' in {}) && !Object.prototype.contaminado, 'el prototipo de Object no se contaminó');
ok(!Object.prototype.hasOwnProperty.call(v.meta, '__proto__') && Object.getPrototypeOf(v.meta) === Object.prototype, 'meta sin __proto__ propio');
ok(!('constructor' in v.meta && v.meta.constructor !== Object), 'meta sin constructor del archivo');
ok(!/[<>]/.test(v.meta.name) && !v.meta.name.includes(String.fromCharCode(7)), `nombre limpio: «${v.meta.name}»`);
ok(!/[<>]/.test(v.meta.diario[0].i) && !/[<>]/.test(v.meta.diario[0].t), 'el diario sin HTML (icono y texto)');
ok(v.meta.day === 1e6, `día acotado: ${v.meta.day}`);
ok(v.meta.spawn.x === 3e7 && v.meta.spawn.y === -64 && v.meta.spawn.z === 0, `aparición acotada: ${JSON.stringify(v.meta.spawn)}`);
ok(v.meta.player.health === 200 && v.meta.player.food === 0 && v.meta.player.flying === true, `jugador acotado: vida ${v.meta.player.health}, comida ${v.meta.player.food}`);
const S = v.meta.inventory.slots;
ok(S[0] === null && S[1] === null, 'ids negativos o que no existen: fuera');
ok(S[2] && S[2].count === 64, `cantidad hasta la pila: ${S[2] && S[2].count}`);
ok(S[3] && S[3].dia === 3, 'la fecha de la comida se conserva');
ok(v.meta.inventory.selected === 8, 'casilla elegida acotada');
ok(v.meta.inventory.billetera[360] === 1e6 && !('abc' in v.meta.inventory.billetera) && !('-1' in v.meta.inventory.billetera), 'billetera: solo piezas válidas, acotadas');
let prof = v.meta.profundo, n = 0; while (prof && typeof prof === 'object') { prof = prof.a; n++; }
ok(n <= 15, `anidado acotado (${n} niveles)`);
ok(v.chunks.length === 1 && v.chunks[0][0] === '0,0', `claves de chunk raras fuera: ${v.chunks.map((c) => c[0]).join(' ')}`);
ok(JSON.stringify(v.chunks[0][1]) === '[[5,1]]', `bloques: solo índices e ids válidos ${JSON.stringify(v.chunks[0][1])}`);
const cofre = v.be[0][1];
ok(cofre.length === 1 && !/[<>]/.test(cofre[0][1].nombre) && cofre[0][1].nombre.length <= 32, `cofre: rótulo limpio «${cofre[0][1].nombre}»`);
ok(cofre[0][1].slots[0].count === 64 && cofre[0][1].slots[1] === null, 'cofre: pilas válidas y acotadas');
// lo que no es un mundo
let lanza = false; try { validarMundo({ app: 'NanoBlocks', meta: 'texto' }); } catch { lanza = true; }
ok(lanza, 'un meta que no es objeto: error para el jugador');
console.log(fallas ? `\n${fallas} falla(s)` : '\nTodo bien: un mundo importado no trae HTML, prototipos ni números locos.');
if (fallas) process.exitCode = 1;
