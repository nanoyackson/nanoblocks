// v13.8.2: la calibración de la Anguila Mayor y del Tizón Mayor contra la decisión de Isaac «peligro moderado» (PLAN_HONDURA §8: el castigo es dar la vuelta, no morir).
// Los duelos son del navegador (tools/bot-pelea.js, solo con `npm run dev`); sus resultados quedan en tools/calibracion-hondura.json y esta prueba exige que:
//  1) los números del juego (src/jefes-balance.js) sean los mismos con los que se midió (si alguien los cambia, hay que volver a medir y guardar el JSON);
//  2) sin trampa se puede ganar: el perfil «promedio» gana al menos 4 de cada 5 y el «hábil» todos, y a «promedio» le queda en promedio al menos el 30 % de la vida (6 de 20);
//  3) no es un trámite ni un muro: matarlos toma entre 8 y 30 s y el «hábil» recibe menos daño que el «promedio» (la habilidad se premia);
//  4) los dos duelos siguen en la lista de bot-pelea.js (la Anguila en laguna, el Tizón con equipo de hierro).
// Para volver a medir: en un mundo nuevo (recargar la página), `JEFES({ perfiles: ['torpe','promedio','habil'], veces: 5, solo: ['tizon_mayor'] })` (ver bot-pelea.js) y copiar los promedios.
import fs from 'node:fs';
import { JEFES_BALANCE } from '../src/jefes-balance.js';

let fallas = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fallas++; };
const cal = JSON.parse(fs.readFileSync(new URL('./calibracion-hondura.json', import.meta.url), 'utf8'));
const bot = fs.readFileSync(new URL('./bot-pelea.js', import.meta.url), 'utf8');
const VIDA_JUGADOR = 20;

for (const mob of ['anguila_mayor', 'tizon_mayor']) {
  const C = cal[mob], B = JEFES_BALANCE[mob];
  ok(B && B.vida === C.vida && B.dano === C.dano, `${mob}: el juego tiene vida ${B && B.vida} y daño ${B && B.dano}; se midió con ${C.vida} y ${C.dano}`);
  ok(C.promedio.gana / C.promedio.n >= 0.8 && C.habil.gana === C.habil.n, `${mob}: sin trampa se gana (promedio ${C.promedio.gana}/${C.promedio.n}, hábil ${C.habil.gana}/${C.habil.n}, equipo ${C.equipo})`);
  ok(C.promedio.vidaMin >= VIDA_JUGADOR * 0.3, `${mob}: a «promedio» le queda en promedio ${(100 * C.promedio.vidaMin / VIDA_JUGADOR).toFixed(0)} % de la vida (≥ 30 %): peligro moderado`);
  ok([C.promedio.ttk, C.habil.ttk].every((t) => t >= 8 && t <= 30), `${mob}: matarlo toma ${C.habil.ttk} s (hábil) y ${C.promedio.ttk} s (promedio): entre 8 y 30 s`);
  ok(C.habil.recibido <= C.promedio.recibido + 1, `${mob}: el hábil recibe ${C.habil.recibido} y el promedio ${C.promedio.recibido} (la habilidad se premia)`);
}
ok(/\['anguila_mayor', 'media', \{ agua: true \}\]/.test(bot) && /\['tizon_mayor', 'jefeHierro'\]/.test(bot), 'bot-pelea.js mide a la Anguila en la laguna con equipo «media» y al Tizón con «jefeHierro»');
console.log(fallas ? `\n✘ ${fallas} falla(s)` : '\nCalibración de La Hondura: todo bien.');
process.exitCode = fallas ? 1 : 0;
