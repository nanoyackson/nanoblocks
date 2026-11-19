// v13.5.8 (PU-17): todo ítem que el jugador puede tener dice para qué sirve. Los que ya muestran algo propio (daño, herramienta, protección, comida, durabilidad, escudo)
// no hacen falta; los demás tienen una línea escrita a mano (src/usoitems.js) o, si son ingrediente de alguna receta, la sacan de las recetas (src/usoauto.js).
// Uso: node tools/revisar-fichas.mjs
import { ITEMS } from '../src/blocks.js';
import { USO } from '../src/usoitems.js';
import { usoLinea } from '../src/usoauto.js';

let fallas = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fallas++; };
const propio = (it) => it.damage || it.tool || it.points || it.food || it.durability || it.block || it.armor;
const items = Object.values(ITEMS).filter((it) => !it.isBlock);
const sin = items.filter((it) => !propio(it) && !usoLinea(it));
ok(sin.length === 0, `todos los ítems (${items.length}) dicen algo: propio, escrito a mano o sacado de las recetas${sin.length ? ` · sin nada: ${sin.map((i) => i.key).join(', ')}` : ''}`);
const clavesItems = new Set(items.map((i) => i.key));
const huerfanas = Object.keys(USO).filter((k) => !clavesItems.has(k));
ok(huerfanas.length === 0, `todas las líneas escritas a mano son de un ítem que existe${huerfanas.length ? ` · sobran: ${huerfanas.join(', ')}` : ''}`);
const largas = Object.entries(USO).filter(([, v]) => typeof v !== 'string' || v.length < 12 || v.length > 90);
ok(largas.length === 0, `cada línea tiene entre 12 y 90 caracteres${largas.length ? ` · revisar: ${largas.map(([k]) => k).join(', ')}` : ''}`);
const mouse = Object.entries(USO).filter(([, v]) => /\bmouse\b|\btú\b|\btu\b/i.test(v));
ok(mouse.length === 0, 'sin «mouse» ni tuteo en las líneas');
console.log(fallas ? `\n✘ ${fallas} falla(s)` : '\nFichas de ítems: todo bien.');
process.exitCode = fallas ? 1 : 0;
