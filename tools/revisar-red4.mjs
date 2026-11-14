// v12.16.4: arreglos de red. (1) un invitado honesto que explora (vuelo largo: posiciones que llegan pegadas, pedidos de trozos) NUNCA se
// expulsa por ritmo, pero un inundador sostenido sí; (2) el redondel del Rey entero cabe bajo el tope; (3) la ráfaga de la Arpía siempre avisa.
// Uso: node tools/revisar-red4.mjs
import { nuevoInvitado, recibir, mirada } from '../src/red/limites.js';
import { velocidadOk } from '../src/red/validar.js';
import { ARPIA } from '../src/arpia.js';

const err = []; const ok = (c, m) => { if (!c) err.push(m); };

// 1) vuelo largo: 120 s a 10 posiciones/s; cada 2 s el relé junta 25 mensajes de golpe; un pedido de 16 trozos cada 3 s; chat y demás normales
{
  const inv = nuevoInvitado(0); let estado = 'ok', peor = 'ok';
  for (let ms = 0; ms < 120000; ms += 100) {
    recibir(inv, 'pos', ms);
    if (ms % 2000 === 0) for (let i = 0; i < 25; i++) recibir(inv, 'pos', ms + 1);
    if (ms % 3000 === 0) recibir(inv, 'chunks_pide', ms);
    if (ms % 500 === 0) recibir(inv, 'inv', ms);
    estado = mirada(inv, ms); if (estado === 'expulsa') break; if (estado === 'aviso') peor = 'aviso';
  }
  ok(estado !== 'expulsa', 'vuelo largo: se expulsó a un invitado honesto que exploraba');
  // aun si el cliente pidiera trozos 20 veces por segundo durante 2 minutos (un fallo del cliente), no se expulsa mientras no inunde
  const b = nuevoInvitado(0); let e2 = 'ok';
  for (let ms = 0; ms < 120000; ms += 50) { recibir(b, 'chunks_pide', ms); e2 = mirada(b, ms); if (e2 === 'expulsa') break; }
  ok(e2 !== 'expulsa', 'pedidos de trozos a 20/s: no debe expulsar (se descartan)');
  // un inundador de verdad (500 pos por segundo sostenidos) sí cae
  const f = nuevoInvitado(0); let e3 = 'ok';
  for (let ms = 0; ms < 20000 && e3 !== 'expulsa'; ms++) { if (ms % 2 === 0) recibir(f, 'pos', ms); e3 = mirada(f, ms); }
  ok(e3 === 'expulsa', 'un inundador sostenido de posiciones tiene que caer');
  // lo que no es blando sigue juzgándose como antes
  const g = nuevoInvitado(0); let e4 = 'ok';
  for (let s = 0; s < 250; s++) { const ms = s * 100; for (let i = 0; i < 100; i++) recibir(g, 'bloque', ms); e4 = mirada(g, ms); if (e4 === 'expulsa') break; }
  ok(e4 === 'expulsa', 'el inundador de bloques sigue expulsándose');
  console.log(`vuelo largo: ${estado} (peor ${peor}); pedidos 20/s: ${e2}; inundador de pos: ${e3}; inundador de bloques: ${e4}`);
}
// velocidad: dos posiciones pegadas dan una velocidad falsa; con referencia de ≥0,15 s el vuelo a 10 b/s pasa
{
  ok(!velocidadOk({ x: 0, y: 70, z: 0 }, { x: 1, y: 70, z: 0 }, 0.01, true), 'sanidad: 1 bloque en 10 ms es imposible');
  ok(velocidadOk({ x: 0, y: 70, z: 0 }, { x: 10, y: 70, z: 0 }, 1, true), 'vuelo a 10 b/s es posible');
}
// 3) la ráfaga de la Arpía siempre avisa: con vida normal no suena la ráfaga en el mismo cuadro; avisa y suelta 0,6 s después
{
  const sonidos = [], toasts = [];
  const g = {
    clock: 30, mode: 'survival', blocking: false, shake: 0, paused: false,
    player: { alive: true, body: { pos: { x: 3, y: 60, z: 0 }, vel: { x: 0, y: 0, z: 0 } } },
    ui: { toast: (t) => toasts.push(t) }, audio: { play: (n) => sonidos.push(n) }, particles: { spawn() {} },
    entities: { mobs: [], items: [] }, damagePlayer() {}, world: { getBlock: () => 0 },
  };
  const m = { health: ARPIA.health, data: { gustCd: 0, boltCd: 1e9 }, body: { pos: { x: 0, y: 62, z: 0 } }, yaw: 0, stunT: 0, windT: 0 };
  try {
    ARPIA.flyGoal(m, g);
    ok(!sonidos.includes('rafaga'), 'Arpía con vida normal: la ráfaga salió sin aviso');
    ok(m.data.gustPre > 0 && m.data.gustPre <= 0.61 && m.data.gustPre > 0.5, `Arpía con vida normal: el aviso debe ser de 0,6 s (es ${m.data.gustPre})`);
    for (let i = 0; i < 8; i++) { g.clock += 0.1; ARPIA.flyGoal(m, g); }
    ok(sonidos.includes('rafaga'), 'Arpía con vida normal: la ráfaga no salió tras el aviso');
    const f = { ...m, health: 50, data: { gustCd: 0, boltCd: 1e9, rage: true } }; g.clock = 60; sonidos.length = 0; g.player.body.vel = { x: 0, y: 0, z: 0 };
    ARPIA.flyGoal(f, g);
    ok(!sonidos.includes('rafaga') && f.data.gustPre === 1, `Arpía furiosa: el aviso debe ser de 1,0 s (es ${f.data.gustPre})`);
    console.log('Arpía: la ráfaga avisa con vida normal (0,6 s) y furiosa (1,0 s)');
  } catch (e) { ok(false, 'la prueba de la Arpía lanzó: ' + e.message); }
}
if (err.length) { console.log('\n✘ ' + err.join('\n✘ ')); process.exitCode = 1; } else console.log('Red v12.16.4: bien.');
