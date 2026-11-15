// v13.2.4: la regla de oro del balance de la progresión (como revisar-picar.mjs). Uso: node tools/revisar-progresion.mjs → código 1 si algo falla.
// 1) Los bonos de daño se suman y se topan (×2 desde la v13.2.6; la v13.2.4 los había dejado en ×1,4): con TODO al máximo se llega justo al tope (espada de madera ≈ 8), una espada
//    de madera con todo al máximo no pega más que una de jade con todo al máximo, y a igual nivel de bonos el material siempre manda. 2) La defensa suma y nunca baja de ×0,62. 3) Subir cuesta más desde el nivel 3
//    (los primeros niveles, igual). 4) Las partidas guardadas conservan su nivel (migración 9 → 10). Imprime la tabla de antes y después (docs/revisiones/BALANCE_PROGRESION.md).
import { ITEMS } from '../src/blocks.js';
import { xpNeed } from '../src/armas.js';
import { necesitaHabilidad, danoTotal, mult, TOPE_DANO, PISO_RECIBIDO, POR_ESTRELLA_DANO } from '../src/habilidades.js';
import { reescalarXp, reescalarHabilidad } from '../src/save.js';

const err = []; const ok = (c, m) => { if (!c) err.push(m); };
const f2 = (x) => x.toFixed(2).replace('.', ',');
// ---- lo de ANTES (copiado de la v13.2.3, para la tabla y para comparar)
const antes = {
  xpNeed: (n) => 10 + n * 6,
  hab: (n) => Math.round(18 * n ** 1.7),
  nivelDano: (L) => Math.min(0.5, L * 0.05),
  combateDano: (n) => n * 0.03,
  maestria: (n) => 1 + n * 0.015,
  v1324: 1.4,
  yunque: (e) => 1 + e * 0.12,
};
const totalXp = (fn, L) => { let s = 0; for (let i = 0; i < L; i++) s += fn(i); return s; };

console.log('\nExperiencia total para llegar al nivel (jugador):');
console.log('  nivel | antes | ahora | +%');
for (const L of [1, 3, 5, 8, 10, 15, 20, 30]) { const a = totalXp(antes.xpNeed, L), b = totalXp(xpNeed, L); console.log(`  ${String(L).padStart(5)} | ${String(a).padStart(5)} | ${String(b).padStart(5)} | ${Math.round((b / a - 1) * 100)} %`); }
console.log('\nExperiencia para llegar al nivel de una habilidad (Minería, Combate…):');
console.log('  nivel | antes | ahora | +%');
for (const n of [1, 2, 3, 5, 8, 10]) { const a = antes.hab(n), b = necesitaHabilidad(n); console.log(`  ${String(n).padStart(5)} | ${String(a).padStart(5)} | ${String(b).padStart(5)} | ${Math.round((b / a - 1) * 100)} %`); }
for (const n of [0, 1, 2, 3]) { ok(xpNeed(n) === antes.xpNeed(n), `el costo del nivel ${n} del jugador cambió (los primeros deben seguir igual)`); }
for (const n of [0, 1, 2]) ok(necesitaHabilidad(n) === antes.hab(n), `el costo del nivel ${n} de la habilidad cambió`);
ok(xpNeed(10) / antes.xpNeed(10) >= 1.25 && xpNeed(10) / antes.xpNeed(10) <= 1.3 + 1e-9, 'a partir del nivel 10 el costo debe ser entre 25 % y 30 % mayor');
ok(necesitaHabilidad(8) / antes.hab(8) >= 1.2 && necesitaHabilidad(10) / antes.hab(10) <= 1.26, 'las habilidades altas cuestan entre 20 % y 25 % más');

// ---- un jugador de mentira, con todo al máximo
const NEED10 = necesitaHabilidad(10);
const maximo = {
  mode: 'survival', conjunto: 'diamond', xpInfo: { level: 40 },
  meta: { skills: { combate: NEED10 }, ruta: Object.fromEntries(Array.from({ length: 13 }, (_, i) => [i, true])), cuaderno: { ojo: true }, manas: { mano_pesada: true, cuero_duro: true } },
  player: { effects: { fuerza: 1, coraza: 1 } }, inventory: { count: () => 1 },
};
const nada = { mode: 'survival', xpInfo: { level: 0 }, meta: { skills: {}, ruta: {}, cuaderno: {}, manas: {} }, player: { effects: {} }, inventory: { count: () => 0 } };
const espada = (mat) => Object.values(ITEMS).find((d) => d && d.key === `${mat}_sword`);
const extraMax = 20 * 0.0075 + 4 * POR_ESTRELLA_DANO; // maestría 20 y yunque ★★★★
// antes: todo multiplicado
const antesMax = (1 + antes.nivelDano(40)) * (1 + 10 * 0.03) * 1.15 * 1.1 * 1.1 * antes.yunque(4) * antes.maestria(20);
console.log(`\nMultiplicador de daño con TODO al máximo: v13.2.3 ×${f2(antesMax)} · v13.2.4 ×${f2(antes.v1324)} · ahora ×${f2(danoTotal(maximo, extraMax))} (tope ×${f2(TOPE_DANO)})`);
console.log('\nDaño de la espada: sin bonos / con todo al máximo (v13.2.3 → v13.2.4 → ahora):');
for (const mat of ['wood', 'stone', 'iron', 'diamond', 'jade']) { const d = espada(mat).damage; console.log(`  ${mat.padEnd(7)} ${d} / ${f2(d * antesMax)} → ${f2(d * antes.v1324)} → ${f2(d * danoTotal(maximo, extraMax))}`); }
ok(danoTotal(nada) === 1, 'sin bonos el daño no es ×1');
ok(danoTotal(maximo, extraMax) <= TOPE_DANO + 1e-9, `el daño máximo pasa del tope ×${TOPE_DANO}`);
ok(Math.abs(danoTotal(maximo, extraMax) - TOPE_DANO) < 0.03, `con todo al máximo el daño debe llegar al tope ×${TOPE_DANO} (salió ×${f2(danoTotal(maximo, extraMax))})`);
{
  const madera = espada('wood').damage * danoTotal(maximo, extraMax);
  ok(Math.abs(madera - 8) <= 0.25, `la espada de madera con todo al máximo debe quedar en ≈ 8 (salió ${f2(madera)})`);
  ok(madera <= espada('jade').damage * danoTotal(maximo, extraMax), 'la de madera con todo al máximo pega más que la de jade con todo al máximo');
  // a igual nivel de bonos el material siempre manda
  const mats = ['wood', 'stone', 'iron', 'diamond', 'jade'];
  for (const [nombre, g, ex] of [['sin bonos', nada, 0], ['a medias', { ...maximo, xpInfo: { level: 4 }, meta: { ...maximo.meta, skills: { combate: necesitaHabilidad(5) } }, conjunto: null }, 0.2], ['al máximo', maximo, extraMax]]) {
    for (let i = 0; i + 1 < mats.length; i++) ok(espada(mats[i]).damage * danoTotal(g, ex) < espada(mats[i + 1]).damage * danoTotal(g, ex), `con los bonos ${nombre}, ${mats[i]} no queda por debajo de ${mats[i + 1]}`);
  }
}
for (const mat of ['wood', 'stone', 'iron', 'diamond', 'jade']) ok(espada(mat).damage * danoTotal(maximo, extraMax) <= 8 * TOPE_DANO + 1e-9, `${mat}: el daño máximo pasa de ${8 * TOPE_DANO}`);
// niveles de a poco: los bonos suben parejo, no de golpe
console.log('\nBono de daño solo por nivel del jugador (antes → ahora):');
for (const L of [1, 3, 5, 8, 10, 15]) console.log(`  nivel ${String(L).padStart(2)}: +${Math.round(antes.nivelDano(L) * 100)} % → +${Math.round((danoTotal({ ...nada, xpInfo: { level: L } }) - 1) * 100)} %`);
ok(danoTotal({ ...nada, xpInfo: { level: 100 } }) <= 1.23 + 1e-9, 'el bono por nivel pasa de +23 %');
// ---- defensa
const antesRecib = 0.9 * 0.9 * 0.95 * 0.88 * 0.92 * 0.95;
console.log(`\nDaño recibido con TODO al máximo (Guerrero, rango, ojo, coraza, cuero duro, amuleto): antes ×${f2(antesRecib)} · ahora ×${f2(mult.recibido(maximo))} (piso ×${f2(PISO_RECIBIDO)})`);
ok(mult.recibido(maximo) >= PISO_RECIBIDO - 1e-9, `la defensa pasa del piso ×${PISO_RECIBIDO}`);
ok(mult.recibido(nada) === 1, 'sin bonos se recibe todo el daño');
// ---- partidas guardadas: el nivel se conserva
const nivelDe = (xp, fn) => { let lv = 0, left = xp; while (left >= fn(lv)) { left -= fn(lv); lv++; } return lv; };
let malos = 0;
for (let xp = 0; xp < 6000; xp += 7) { const n = reescalarXp(xp); if (nivelDe(n, xpNeed) !== nivelDe(xp, antes.xpNeed)) malos++; }
ok(malos === 0, `la migración cambió el nivel de ${malos} partidas (xp del jugador)`);
const nivHab = (xp, fn) => { let lv = 0; while (lv < 10 && xp >= fn(lv + 1)) lv++; return lv; };
malos = 0;
for (let xp = 0; xp < 5000; xp += 5) { const n = reescalarHabilidad(xp); if (nivHab(n, necesitaHabilidad) !== nivHab(xp, antes.hab)) malos++; }
ok(malos === 0, `la migración cambió el nivel de ${malos} partidas (habilidades)`);
console.log(`\nMigración 9 → 10: xp 500 → ${reescalarXp(500)} (nivel ${nivelDe(500, antes.xpNeed)} → ${nivelDe(reescalarXp(500), xpNeed)}), Minería 300 → ${reescalarHabilidad(300)}`);
if (err.length) { for (const e of err) console.log(`✘ ${e}`); process.exit(1); }
console.log('\nBalance de la progresión: bien.');
