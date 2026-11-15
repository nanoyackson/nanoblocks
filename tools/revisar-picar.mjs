// v13.0.5: la regla de oro del balance de picar. Uso: node tools/revisar-picar.mjs → sale con código 1 si algo falla.
// El pico de madera con TODO al máximo (Minería 10, yunque ★★★★, hoja «manos», maña «buen brazo») nunca pica más rápido que uno de piedra
// sin bonos, y el de piedra al máximo nunca más rápido que uno de hierro sin bonos. Y ningún bono junto pasa del tope ×1.5.
import { ITEMS } from '../src/blocks.js';
import { velocidadPicar, TOPE_PICAR, necesitaHabilidad } from '../src/habilidades.js';

const pico = (mat) => Object.values(ITEMS).find((d) => d && d.key === `${mat}_pickaxe`);
const NEED10 = necesitaHabilidad(10);
const nada = { mode: 'survival', meta: { skills: {}, cuaderno: {}, manas: {} } };
const todo = { mode: 'survival', meta: { skills: { mineria: NEED10 }, cuaderno: { manos: true }, manas: { buen_brazo: true } } };
const err = []; const ok = (c, m) => { if (!c) err.push(m); };
const v = (mat, g, estrellas) => velocidadPicar(g, pico(mat), estrellas);

for (const [menor, mayor] of [['wood', 'stone'], ['stone', 'iron']]) {
  const max = v(menor, todo, 4), base = v(mayor, nada, 0);
  ok(max <= base + 1e-9, `el pico de ${menor} con todo al máximo (${max.toFixed(2)}) pica más rápido que el de ${mayor} sin bonos (${base.toFixed(2)})`);
  console.log(`  ${menor} al máximo ${max.toFixed(2)} ≤ ${mayor} sin bonos ${base.toFixed(2)}`);
}
for (const mat of ['wood', 'stone', 'iron', 'diamond', 'jade']) {
  const base = v(mat, nada, 0), max = v(mat, todo, 4);
  ok(max <= base * TOPE_PICAR + 1e-9, `${mat}: con todo al máximo ${max.toFixed(2)} pasa el tope ×${TOPE_PICAR} de ${base.toFixed(2)}`);
  ok(v(mat, nada, 0) === pico(mat).speed, `${mat}: sin bonos la velocidad no es la base`);
}
// los bonos se suman, no se multiplican: Minería 3 + ★1 + manos + buen brazo = 1 + 0.06 + 0.06 + 0.05 + 0.05
const normal = { mode: 'survival', meta: { skills: { mineria: necesitaHabilidad(3) }, cuaderno: { manos: true }, manas: { buen_brazo: true } } };
const f = v('wood', normal, 1) / pico('wood').speed;
ok(Math.abs(f - 1.22) < 1e-6, `bonos sumados: se esperaba ×1.22 y salió ×${f.toFixed(3)}`);
if (err.length) { for (const e of err) console.log(`✘ ${e}`); process.exit(1); }
console.log('Balance de picar: bien.');
