// v13.0.3: la gente y las criaturas no se meten unas dentro de otras. Uso: node tools/revisar-separar.mjs → sale con código 1 si algo falla.
// Escena: un piso de piedra con una pared al lado y un borde (precipicio). Se pone mucha gente en el MISMO punto y se corre el empuje
// 6 segundos de juego: tienen que quedar separados, ninguna dentro de un bloque, el jefe no se mueve, y el empuje del jugador no tira a nadie del borde.
import { Body } from '../src/physics.js';
import { BLOCK_BY_KEY as K } from '../src/blocks.js';
import { separar, anchoSep } from '../src/separar.js';

const PIEDRA = K.stone;
const bloques = new Map();
const put = (x, y, z) => bloques.set(`${x},${y},${z}`, PIEDRA);
for (let x = -12; x <= 12; x++) for (let z = -12; z <= 12; z++) if (x <= 8) put(x, 0, z); // el piso acaba en x = 8 (precipicio)
for (let y = 1; y <= 4; y++) for (let z = -12; z <= 12; z++) put(-4, y, z); // pared en x = -4
const mundo = { getBlock: (x, y, z) => (y < 0 ? PIEDRA : bloques.get(`${x},${y},${z}`) || 0), cajas: () => null };

let nid = 0;
const vecino = { w: 0.6, h: 1.8, sepW: 0.85 }, vaca = { w: 0.9, h: 1.3 }, jefe = { w: 1.5, h: 3, boss: true };
const crear = (kind, x, z, type = 'x') => { const body = new Body(kind.w, kind.h); body.pos.x = x; body.pos.y = 1; body.pos.z = z; body.onGround = true; return { kind, type, nid: ++nid, body, data: {} }; };
const err = []; const ok = (c, m) => { if (!c) err.push(m); };
const juego = (jx = 40, jz = 40) => { const pl = new Body(0.6, 1.8); pl.pos.x = jx; pl.pos.y = 1; pl.pos.z = jz; return { meta: {}, world: mundo, player: { body: pl }, sleeping: false }; };
const correr = (g, mobs, seg) => { let pares = 0; for (let i = 0; i < 60 * seg; i++) { pares += separar(g, mobs, 1 / 60); for (const m of mobs) m.body.step(mundo, 1 / 60, {}); } return pares; };
const minDist = (mobs) => { let m = 9; for (let i = 0; i < mobs.length; i++) for (let j = i + 1; j < mobs.length; j++) m = Math.min(m, Math.hypot(mobs[i].body.pos.x - mobs[j].body.pos.x, mobs[i].body.pos.z - mobs[j].body.pos.z)); return m; };

// 1) diez personas y vacas en el mismo punto, pegadas a una pared: se separan y ninguna queda dentro de un bloque
{
  const g = juego(0, 0), mobs = [];
  for (let i = 0; i < 8; i++) mobs.push(crear(vecino, -2.5, 0.5));
  for (let i = 0; i < 3; i++) mobs.push(crear(vaca, -2.5, 0.5));
  const t = performance.now(); correr(g, mobs, 6); const ms = performance.now() - t;
  const d = minDist(mobs), dentro = mobs.filter((m) => m.body.atascado(mundo)).length;
  ok(d > 0.7, `11 en el mismo punto: tras 6 s la menor distancia es ${d.toFixed(2)} (debe pasar de 0.7)`);
  ok(dentro === 0, `${dentro} quedaron dentro de un bloque`);
  ok(mobs.every((m) => m.body.pos.x > -4 + m.kind.w / 2 - 0.01), 'alguien atravesó la pared');
  console.log(`  11 amontonados: distancia mínima ${d.toFixed(2)}, ${(ms / 360).toFixed(3)} ms por cuadro de la prueba`);
}
// 2) dos exactamente en el mismo punto (sin dirección): se separan igual
{
  const g = juego(), mobs = [crear(vecino, 0, 0), crear(vecino, 0, 0)];
  correr(g, mobs, 4); ok(minDist(mobs) > 0.7, 'dos exactamente en el mismo punto no se separaron');
}
// 3) el jefe no se mueve: los demás se apartan de él
{
  const g = juego(), B = crear(jefe, 0, 0), V = crear(vecino, 0.3, 0.2);
  const mobs = [B, V]; correr(g, mobs, 4);
  ok(Math.hypot(B.body.pos.x, B.body.pos.z) < 0.001, 'el jefe se movió');
  ok(Math.hypot(V.body.pos.x - B.body.pos.x, V.body.pos.z - B.body.pos.z) > (anchoSep(jefe) + anchoSep(vecino)) / 2 - 0.05, 'la persona no salió del jefe');
}
// 4) el jugador no se mete dentro de la gente, y el empujón a la gente es leve (no la tira por el precipicio)
{
  const g = juego(7.5, 0), V = crear(vecino, 8, 0); // la persona está en el borde (x = 8.x es el último bloque)
  V.body.pos.x = 8.4; V.body.pos.y = 1;
  const mobs = [V]; g.player.body.pos.x = 8.0; g.player.body.pos.z = 0; // el jugador encima de la persona, hacia el vacío
  correr(g, mobs, 4);
  ok(V.body.pos.x < 8.95, `la persona fue empujada al vacío (x=${V.body.pos.x.toFixed(2)})`);
  ok(V.body.hasGroundUnder(mundo, V.body.pos.x, V.body.pos.z), 'la persona quedó sin suelo');
  const d = Math.hypot(g.player.body.pos.x - V.body.pos.x, g.player.body.pos.z - V.body.pos.z);
  ok(d > 0.55, `el jugador sigue dentro de la persona (distancia ${d.toFixed(2)})`);
  ok(!g.player.body.atascado(mundo), 'el jugador quedó dentro de un bloque');
}
// 4b) correr de frente contra una persona parada (5.6 bloques/s, 3 s): el jugador no la atraviesa
{
  const g = juego(0, 0), V = crear(vecino, 2, 0), mobs = [V]; g.player.body.pos.x = -3;
  let peor = 9;
  for (let i = 0; i < 180; i++) { g.player.body.moveAxis(mundo, 'x', 5.6 / 60); separar(g, mobs, 1 / 60); V.body.step(mundo, 1 / 60, {}); g.player.body.step(mundo, 1 / 60, {}); peor = Math.min(peor, Math.hypot(g.player.body.pos.x - V.body.pos.x, g.player.body.pos.z - V.body.pos.z)); }
  ok(peor > 0.5, `corriendo contra una persona, el jugador llegó a ${peor.toFixed(2)} de su centro (debe quedar a más de 0.5)`);
}
// 5) un invitado no separa (lo hace el anfitrión); a lo lejos tampoco se gasta nada
{
  const g = juego(); g.meta.invitado = true; const mobs = [crear(vecino, 0, 0), crear(vecino, 0, 0)];
  correr(g, mobs, 2); ok(minDist(mobs) < 0.01, 'un invitado no debería simular la separación');
}
// 6) rendimiento: 120 personas repartidas en un pueblo, medido por cuadro
{
  const g = juego(0, 0), mobs = []; for (let i = 0; i < 120; i++) mobs.push(crear(vecino, -3 + (i % 12) * 0.5, -6 + Math.floor(i / 12) * 0.9));
  correr(g, mobs, 1); const t = performance.now(); for (let i = 0; i < 300; i++) separar(g, mobs, 1 / 60); const por = (performance.now() - t) / 300;
  ok(por < 1, `120 personas: ${por.toFixed(3)} ms por cuadro (debe ser < 1 ms)`);
  console.log(`  120 en un pueblo: ${por.toFixed(3)} ms por cuadro`);
}
if (err.length) { for (const e of err) console.log(`✘ ${e}`); process.exit(1); }
console.log('Separación entre personas y criaturas: bien.');
