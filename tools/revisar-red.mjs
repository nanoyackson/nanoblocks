// Prueba las costuras del multijugador (v12.10.0, F0): mensajes hostiles por src/red/validar.js y src/red/limites.js con un reloj falso,
// la migración 6→7 de los mundos viejos y la limpieza de meta.jugadores al importar. Nada abre una red ni un navegador.
// Uso: node tools/revisar-red.mjs
import { validar, velocidadOk, alcanceOk, PROTOCOL_VERSION } from '../src/red/validar.js';
import { nuevoInvitado, recibir, mirada, nuevoGlobal, gastarGlobal, LIMITES } from '../src/red/limites.js';
import { armarCodigo, leerCodigo, salaNueva, claveNueva, enlaceDe } from '../src/red/codigo.js';
import { BLOCKS, BLOCK_BY_KEY as K } from '../src/blocks.js';
import { esSimple, puedePoner, puedeRomper, esReemplazable, apoyoOk } from '../src/red/reglas.js';
import { migrate } from '../src/save.js';
import { validarMundo } from '../src/importar.js';
import { SAVE_FORMAT } from '../src/version.js';

let fallas = 0;
const ok = (c, t) => { if (c) console.log(`✔ ${t}`); else { fallas++; console.log(`✘ ${t}`); } };
const rechaza = (tipo, cuerpo, motivo, t, bytes = 100) => { const r = validar(tipo, cuerpo, bytes); ok(!r.ok && (!motivo || r.motivo === motivo), `${t} → ${r.ok ? 'ACEPTADO' : r.motivo}`); };
const acepta = (tipo, cuerpo, t) => { const r = validar(tipo, cuerpo, 100); ok(r.ok, `${t}${r.ok ? '' : ` (rechazado: ${r.motivo})`}`); return r; };

// --- mensajes buenos pasan, y salen COPIADOS (no el mismo objeto)
const hola = { v: PROTOCOL_VERSION, g: '12.10.0', nombre: 'Ana', cuerpo: { camisa: 1, piel: 2, pelo: 3 } };
const r1 = acepta('hola', hola, 'hola bueno');
ok(r1.msg !== hola && r1.msg.cuerpo !== hola.cuerpo, 'hola: el resultado es una copia');
const pos = { seq: 1, x: 10, y: 70, z: -5, yaw: 1, pitch: 0, flags: 0, arma: 0, dim: 0 };
acepta('pos', pos, 'pos bueno');
acepta('chat', { texto: 'hola a todos' }, 'chat bueno');
acepta('bloque', { op: 1, x: 3, y: 64, z: 3, id: 5, cara: 2, viejo: 0, seq: 7 }, 'bloque bueno');

// --- los hostiles de la auditoría
rechaza('hola', { ...hola, extra: 1 }, 'esquema', 'hola con clave de más');
rechaza('hola', { ...hola, v: 99 }, 'version', 'hola con otro protocolo');
rechaza('hola', JSON.parse('{"v":1,"g":"1","nombre":"x","cuerpo":{"camisa":1,"piel":1,"pelo":1},"__proto__":{"admin":true}}'), 'esquema', 'hola con __proto__ propio');
ok(validar('hola', { ...hola, nombre: '<img onerror=x>' }, 100).msg?.nombre === 'img onerror=x', 'nombre con HTML: se limpian < y >');
rechaza('hola', { ...hola, nombre: 'A'.repeat(10 * 2 ** 20) }, 'tamano', 'nombre de 10 MB');
rechaza('pos', { ...pos, x: NaN }, 'numero', 'pos con NaN');
rechaza('pos', { ...pos, y: Infinity }, 'numero', 'pos con Infinity');
rechaza('pos', { ...pos, x: 1e30 }, 'fuera-del-mundo', 'pos fuera del mundo');
rechaza('pos', { ...pos, y: -500 }, 'fuera-del-mundo', 'pos bajo el mundo');
rechaza('pos', { ...pos, seq: 1.5 }, 'numero', 'seq no entero');
rechaza('pos', { ...pos, seq: '1' }, 'numero', 'seq como texto');
rechaza('bloque', { op: 1, x: 3, y: 64, z: 3, id: -1, cara: 2, viejo: 0, seq: 7 }, 'numero', 'bloque con id negativo');
rechaza('bloque', { op: 2, x: 3, y: 64, z: 3, id: 1, cara: 2, viejo: 0, seq: 7 }, 'numero', 'bloque con op raro');
rechaza('chat', { texto: '/give @s diamond 64' }, 'comando', 'chat con comando');
rechaza('chat', { texto: 'x'.repeat(300) }, 'texto', 'chat de 300 caracteres');
rechaza('chat', JSON.parse('{"texto":"hola","constructor":{"prototype":{}}}'), 'esquema', 'chat con constructor');
rechaza('chunks_pide', { c: Array.from({ length: 17 }, () => [0, 0]) }, 'esquema', '17 pares de chunks');
rechaza('chunks_pide', { c: [[0.5, 1]] }, 'par', 'chunk con decimales');
rechaza('inv_op', { opId: 1, op: 'regalar', a: 0 }, 'op', 'inv_op con operación inventada');
rechaza('inv_op', { opId: 1, op: 'mover', a: 1e12 }, 'numero', 'inv_op con casilla enorme');
rechaza('golpe', { mob: 5, pesado: 'sí' }, 'esquema', 'golpe con pesado no booleano');
// v12.14.0 (F4): criaturas, daño y botín
const mob1 = [7, 'danta', 10.5, 64, -3, 1.2, 12, 0, 12];
const rm = acepta('mobs', { l: [mob1] }, 'mobs bueno'); ok(rm.msg.l[0] !== mob1, 'mobs: copia, no el mismo arreglo');
rechaza('mobs', { l: Array.from({ length: 41 }, () => mob1) }, 'esquema', '41 criaturas en un mensaje');
rechaza('mobs', { l: [[7, '__proto__', 0, 64, 0, 0, 1, 0, 1]] }, 'mob', 'criatura con tipo __proto__');
rechaza('mobs', { l: [[7, 'danta', NaN, 64, 0, 0, 1, 0, 1]] }, 'mob', 'criatura con posición NaN');
rechaza('mobs', { l: [[7, 'danta', 0, 900, 0, 0, 1, 0, 1]] }, 'mob', 'criatura a 900 de altura');
rechaza('mobs', { l: [[7, 'danta', 0, 64, 0, 0, 1, 0]] }, 'mob', 'criatura con 8 campos');
acepta('dano', { a: 3, x: 1, z: 2, c: 'Golpe de Sombra', i: false, m: 1 }, 'daño bueno');
acepta('dano', { a: 3, x: null, z: null, c: '', i: true, m: 0 }, 'daño sin origen');
rechaza('dano', { a: 1e9, x: 1, z: 2, c: 'x', i: false, m: 1 }, 'esquema', 'daño de mil millones');
rechaza('dano', { a: 0, x: 1, z: 2, c: 'x', i: false, m: 1 }, 'esquema', 'daño cero');
rechaza('dano', { a: 3, x: 1, z: null, c: 'x', i: false, m: 1 }, 'numero', 'daño con medio origen');
rechaza('dano', { a: 3, x: 1, z: 2, c: 'x', i: false, m: 7 }, 'esquema', 'daño con armadura 7');
acepta('botin', { l: [[300, 2], [270, 1]] }, 'botín bueno');
acepta('mobs', { l: [[9, 'jefe_x', 1, 64, 1, 0, 300, 6, 450]] }, 'jefe con barra y fase 2');
rechaza('mobs', { l: [[9, 'jefe_x', 1, 64, 1, 0, 300, 6, 1e9]] }, 'mob', 'vida máxima de mil millones');
acepta('aviso', { texto: '🏆 ¡Cayó el jefe!' }, 'aviso bueno');
rechaza('aviso', { texto: '   ' }, 'texto', 'aviso vacío');
rechaza('aviso', { texto: 'x', extra: 1 }, 'esquema', 'aviso con campo extra');
rechaza('botin', { l: [] }, 'esquema', 'botín vacío');
rechaza('botin', { l: [[300, 100000]] }, 'botin', 'botín de 100 000');
rechaza('botin', { l: Array.from({ length: 13 }, () => [300, 1]) }, 'esquema', 'botín de 13 renglones');
rechaza('super', {}, 'desconocido', 'tipo de mensaje desconocido');
rechaza('__proto__', {}, 'desconocido', 'tipo __proto__');
rechaza('constructor', {}, 'desconocido', 'tipo constructor');
rechaza('chat', { texto: 'hola' }, 'tamano', 'más de 1 MiB', 2 ** 21);
ok(validar('chat', { texto: 'hola' }, 10, false).motivo === 'remitente', 'remitente no aceptado se descarta');
rechaza('chat', { texto: 'hola', a: { b: { c: { d: { e: { f: { g: { h: 1 } } } } } } } }, 'tamano', 'profundidad excesiva');
ok(!Object.prototype.admin && !('admin' in {}), 'el prototipo de Object sigue limpio');

// --- velocidad y alcance
ok(velocidadOk({ x: 0, y: 0, z: 0 }, { x: 5, y: 0, z: 0 }, 1), 'velocidad: correr normal pasa');
ok(!velocidadOk({ x: 0, y: 0, z: 0 }, { x: 80, y: 0, z: 0 }, 1), 'velocidad: teletransporte se rechaza');
ok(!velocidadOk({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, 0), 'velocidad: dt 0 se rechaza');
ok(!velocidadOk({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, NaN), 'velocidad: dt NaN se rechaza');
ok(alcanceOk({ x: 0, y: 70, z: 0 }, 2, 71, 1), 'alcance: bloque cercano pasa');
ok(!alcanceOk({ x: 0, y: 70, z: 0 }, 40, 70, 0), 'alcance: bloque lejano se rechaza');

// --- límites con un reloj falso
{
  let t = 0; const inv = nuevoInvitado(t);
  let pasaron = 0;
  for (let i = 0; i < 1000; i++) if (recibir(inv, 'bloque', t)) pasaron++; // 1 000 ediciones en el mismo instante
  ok(pasaron === LIMITES.bloque.cap, `1 000 ediciones de golpe: pasan ${pasaron} (la ráfaga es ${LIMITES.bloque.cap})`);
  t += 1000;
  let p2 = 0; for (let i = 0; i < 50; i++) if (recibir(inv, 'bloque', t)) p2++;
  ok(p2 === LIMITES.bloque.rate, `un segundo después reponen ${p2} fichas (${LIMITES.bloque.rate}/s)`);
  ok(mirada(inv, t) === 'aviso' || mirada(inv, t) === 'expulsa', `el inundador queda marcado: ${mirada(inv, t)}`);
  // un inundador sostenido durante 25 s a 1 000 por segundo termina expulsado
  let e = nuevoInvitado(0), estado = 'ok';
  for (let s = 0; s < 25 * 10; s++) { const ms = s * 100; for (let i = 0; i < 100; i++) recibir(e, 'bloque', ms); estado = mirada(e, ms); if (estado === 'expulsa') break; }
  ok(estado === 'expulsa', `inundador sostenido: ${estado}`);
  ok(e.ventana.length <= 4000, `la memoria del contador está acotada (${e.ventana.length})`);
  // un jugador normal no se castiga: 10 bloques por segundo, 30 s
  const n = nuevoInvitado(0); let malos = 0;
  for (let s = 0; s < 300; s++) if (!recibir(n, 'bloque', s * 100)) malos++;
  ok(malos === 0 && mirada(n, 29900) === 'ok', 'jugador normal a 10 bloques/s: sin descartes');
  ok(!recibir(nuevoInvitado(0), 'super', 0), 'tipo desconocido nunca pasa');
  ok(!recibir(nuevoInvitado(0), '__proto__', 0) && !recibir(nuevoInvitado(0), 'constructor', 0), '__proto__ y constructor no son tipos');
  const g = nuevoGlobal(0); let gp = 0; for (let i = 0; i < 1000; i++) if (gastarGlobal(g, 0)) gp++;
  ok(gp === 300, `tope global del anfitrión: ${gp} de 1 000 (300 por segundo)`);
  // reloj hacia atrás: no regala fichas
  const r = nuevoInvitado(5000); for (let i = 0; i < 40; i++) recibir(r, 'chat', 5000); const antes = r.ok; recibir(r, 'chat', 1000);
  ok(r.ok === antes, 'un reloj que va hacia atrás no regala fichas');
}

// --- migración 6 → 7: un mundo viejo (formato 6, sin jugadores) abre y no pierde nada
{
  const viejo = { id: 'w1', name: 'Mundo viejo', format: 6, seed: 7, day: 12, inventory: { slots: [], billetera: { 360: 3 } } };
  const m = migrate(JSON.parse(JSON.stringify(viejo)));
  ok(SAVE_FORMAT === 9 && m.format === 9, `formato ${viejo.format} → ${m.format}`);
  ok(m.jugadores && Object.keys(m.jugadores).length === 0 && m.epoca === 1, 'jugadores: {} y época 1');
  ok(m.name === 'Mundo viejo' && m.day === 12 && m.inventory.billetera[360] === 3, 'no se perdió nada del mundo viejo');
  const conFichas = migrate({ id: 'w2', format: 6, jugadores: { x: 1 }, epoca: 4 });
  ok(conFichas.epoca === 4 && conFichas.jugadores.x === 1, 'si ya traía jugadores y época, se respetan');
  const raro = migrate({ id: 'w3', format: 6, jugadores: [1, 2], epoca: -3 });
  ok(!Array.isArray(raro.jugadores) && raro.epoca === 1, 'jugadores raros (arreglo) y época negativa se corrigen');
  const doble = migrate(migrate({ id: 'w4', format: 3, inventory: { slots: [], billetera: {} } }));
  ok(doble.format === 9, 'del formato 3 al 9 en cadena');
}

// --- validarMundo y meta.jugadores
{
  const llave = 'AbCdEfGhIjKlMnOpQrStUv'; // 22 base62
  const fichas = { [llave]: { nombre: '<b>Ana</b>', rev: 5, inv: { slots: [{ id: 262, count: 1e9 }, { id: -4, count: 1 }], billetera: { 360: 2, abc: 5 } }, estado: 'raro' }, 'corta': { nombre: 'x' } };
  for (let i = 0; i < 20; i++) fichas[`Llave${String(i).padStart(17, '0')}`] = { nombre: `P${i}` };
  fichas.__proto__x = 1;
  const payload = JSON.parse(JSON.stringify({ app: 'NanoBlocks', format: 7, meta: { name: 'M', seed: 1, jugadores: fichas, epoca: 1e99 }, chunks: [], be: [] }));
  payload.meta.jugadores = JSON.parse(JSON.stringify(fichas).replace('"__proto__x"', '"__proto__"'));
  const v = validarMundo(payload);
  const ks = Object.keys(v.meta.jugadores);
  ok(ks.length <= 12, `máx. 12 fichas (quedaron ${ks.length})`);
  ok(!ks.includes('corta') && !ks.includes('__proto__'), 'llaves que no son de 22 caracteres base62 se descartan');
  const F = v.meta.jugadores[llave];
  ok(F && !/[<>]/.test(F.nombre) && F.estado === 'activo', `ficha limpia: «${F && F.nombre}», estado ${F && F.estado}`);
  ok(F.inv.slots[1] === null && F.inv.slots[0].count <= 64, 'inventario de la ficha: ids válidos y cantidades topadas');
  ok(F.inv.billetera[360] === 2 && !('abc' in F.inv.billetera), 'billetera de la ficha limpia');
  ok(v.meta.epoca === 1e6, 'época acotada');
  const sin = validarMundo({ app: 'NanoBlocks', meta: { name: 'Viejo', seed: 1 }, chunks: [], be: [] });
  ok(sin.meta.epoca === 1 && Object.keys(sin.meta.jugadores).length === 0, 'un archivo sin jugadores queda con {} y época 1');
}

// --- lo que manda el anfitrión (v12.11.0): el invitado tampoco se fía
{
  const jug = { pid: 2, nombre: 'Beto', cuerpo: { camisa: 1, piel: 2, pelo: 3 }, x: 1, y: 70, z: 2, yaw: 0, pitch: 0, flags: 0, arma: 0, dim: 0 };
  const mundo = { nombre: 'M', seed: 12345, genVersion: 5, tipo: 'normal', dificultad: 'normal', modo: 'creative', dim: 'tierra', dia: 1, hora: 0.3, spawn: { x: 0, y: 70, z: 0 } };
  acepta('acepta', { pid: 1, mundo, j: [jug] }, 'acepta bueno');
  rechaza('acepta', { pid: 1, mundo: { ...mundo, seed: -1 }, j: [] }, 'mundo', 'acepta con seed negativa');
  rechaza('acepta', { pid: 1, mundo: { ...mundo, dim: 'nether' }, j: [] }, 'mundo', 'acepta con otra dimensión');
  rechaza('acepta', { pid: 1, mundo, j: new Array(7).fill(jug) }, 'esquema', 'acepta con 7 jugadores');
  rechaza('acepta', { pid: 1, mundo, j: [{ ...jug, x: NaN }] }, 'jugador', 'acepta con un jugador con NaN');
  acepta('rechazo', { motivo: 'llena' }, 'rechazo bueno');
  rechaza('rechazo', { motivo: 'xx' }, 'esquema', 'rechazo con motivo raro');
  acepta('jugadores', { j: [jug] }, 'jugadores bueno');
  rechaza('jugadores', { j: [{ ...jug, extra: 1 }] }, 'jugador', 'jugadores con clave de más');
  acepta('corrige', { x: 1, y: 70, z: 1, seq: 3 }, 'corrige bueno');
  rechaza('corrige', { x: 1e12, y: 70, z: 1, seq: 3 }, 'esquema', 'corrige fuera del mundo');
  acepta('tiempo', { dia: 2, hora: 0.5, clima: 1 }, 'tiempo bueno');
  rechaza('tiempo', { dia: 2, hora: 5, clima: 1 }, 'esquema', 'tiempo con hora fuera de 0..1');
  acepta('chatr', { pid: 2, texto: 'hola' }, 'chatr bueno');
  rechaza('chatr', { pid: 2, texto: '   ' }, 'texto', 'chatr vacío');
  acepta('expulsa', { motivo: 'bloqueado' }, 'expulsa bueno');
  rechaza('expulsa', { motivo: 'otro' }, 'esquema', 'expulsa con motivo raro');
}

// --- código de sala
{
  const sala = salaNueva(), clave = claveNueva(), uid = 'AbCdEfGhIjKlMnOpQrStUv';
  const c = armarCodigo(sala, uid, clave);
  const l = leerCodigo(c);
  ok(l.ok && l.sala === sala && l.userId === uid && l.clave === clave && l.roomId === `${sala}~${uid}`, 'el código se arma y se lee de vuelta');
  const e = leerCodigo(enlaceDe(c, 'https://x.test/juego/'));
  ok(e.ok && e.clave === clave, 'el enlace con #sala= también se lee');
  const sucio = leerCodigo(` ${c.slice(0, -10)}${clave.slice(0, 5)}-${clave.slice(5)} `);
  ok(sucio.ok && sucio.clave === clave, 'la clave con guion y espacios se acepta');
  ok(!leerCodigo('basura').ok && !leerCodigo('').ok && !leerCodigo('NB1.x').ok && !leerCodigo(null).ok && !leerCodigo('x'.repeat(500)).ok, 'códigos rotos se rechazan');
  ok(sala.length === 22 && clave.length === 10 && salaNueva() !== sala, 'sala de 22 y clave de 10, distintas cada vez');
}

// --- construir juntos (v12.12.0, F2)
{
  acepta('bloques', { b: [[1, 64, 1, 5], [2, 64, 1, 0]] }, 'bloques bueno');
  rechaza('bloques', { b: [[1, 200, 1, 5]] }, 'bloque', 'bloques con y fuera del mundo');
  rechaza('bloques', { b: [[1, 64, 1, 5, 9]] }, 'bloque', 'bloques con entrada larga');
  rechaza('bloques', { b: Array.from({ length: 121 }, () => [1, 64, 1, 5]) }, null, 'bloques con 121 entradas');
  rechaza('bloques', { b: [[NaN, 64, 1, 5]] }, 'bloque', 'bloques con NaN');
  acepta('chunks_dato', { cx: 0, cz: -2, r: 1, m: [[0, 5], [32767, 0]] }, 'chunks_dato bueno');
  rechaza('chunks_dato', { cx: 0, cz: 0, r: 1, m: [[32768, 5]] }, null, 'chunks_dato con índice fuera del chunk');
  rechaza('chunks_dato', { cx: 0, cz: 0, r: 2, m: [] }, null, 'chunks_dato con r raro');
  acepta('chunks_pide', { c: [[0, 0], [1, 1]] }, 'chunks_pide bueno');
  const largo = Array.from({ length: 700 }, (_, i) => [i, 5]);
  ok(validar('chunks_dato', { cx: 0, cz: 0, r: 0, m: largo }, 12000).ok, 'chunks_dato de 700 entradas cabe en su peso');
  ok(!validar('bloques', { b: [[1, 64, 1, 5]], relleno: 'x'.repeat(13000) }, 100).ok, 'bloques con un cuerpo de más de 12 KB se rechaza');
  // reglas: qué viaja por la red
  const piedra = K.stone, tierra = K.dirt, agua = K.water, horno = K.furnace, cofre = K.chest, puerta = K.door_wood, antorcha = K.torch, portal = K.portal;
  ok(esSimple(piedra) && puedePoner(piedra) && puedeRomper(piedra), 'la piedra viaja por la red');
  ok(!puedePoner(agua) && !puedeRomper(agua), 'el agua no se pone ni se rompe por la red');
  ok(!esSimple(horno) && !esSimple(cofre) && !esSimple(puerta), 'horno, cofre y puerta no viajan hasta F3');
  ok(!esSimple(portal) && !esSimple(0) && !esSimple(99999) && !esSimple(-1) && !esSimple(1.5), 'portal, aire y ids raros no viajan');
  ok(esReemplazable(0, piedra) && esReemplazable(agua, piedra) && !esReemplazable(tierra, piedra), 'se pone sobre aire y agua, no sobre un bloque sólido');
  ok(!esReemplazable(99999, piedra), 'reemplazar un id que no existe se rechaza');
  ok(BLOCKS[antorcha] ? apoyoOk(antorcha, piedra) && !apoyoOk(antorcha, 0) : true, 'la antorcha pide algo sólido debajo');
}

if (fallas) { console.log(`\n${fallas} fallas`); process.exitCode = 1; } else console.log('\nTodas las costuras del multijugador pasan.');
