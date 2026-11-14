// Prueba las fichas del multijugador (v12.13.0, F3): la conservación del inventario (src/red/ficha.js) y los mensajes `inv` / `ficha`
// (src/red/validar.js), más el comportamiento del anfitrión con un canal falso (nada abre una red ni un navegador).
// Invariante: un invitado NUNCA puede inventarse plata ni ítems únicos, ni subir mejoras; lo común solo crece lo que explique una receta
// o el cupo; y una ficha mala se reemplaza por la verdadera. Uso: node tools/revisar-inventario-red.mjs
import { validar } from '../src/red/validar.js';
import { kitInicial, vitalInicial, fichaNueva, invOk, cambioOk, cupoNuevo, recargar, creditoBloque, vitalOk, copiaInv, CUPO_INI, CUPO_MAX, LLAVE, MAX_FICHAS } from '../src/red/ficha.js';
import { BLOCK_BY_KEY as K, ITEMS, maxStack } from '../src/blocks.js';
import { RECIPES, ingredients } from '../src/recipes.js';
import { VALOR } from '../src/plata.js';
import { esUnico } from '../src/inventory.js';
import { validarMundo } from '../src/importar.js';

let fallas = 0;
const ok = (c, t) => { if (c) console.log(`✔ ${t}`); else { fallas++; console.log(`✘ ${t}`); } };

const vacio = () => ({ slots: new Array(36).fill(null), selected: 0, armor: [null, null, null, null, null], billetera: {} });
const con = (...pilas) => { const i = vacio(); pilas.forEach((p, n) => { i.slots[n] = p; }); return i; };

// --- el kit inicial y la ficha nueva
const kit = kitInicial();
ok(invOk(kit), 'el kit inicial es una mochila válida');
ok(kit.slots[0].count === 4 && kit.slots[1].id === K.torch && kit.slots[1].count === 6, 'el kit trae 4 tortillas y 6 antorchas');
const f0 = fichaNueva('Ana', { camisa: 1, piel: 2, pelo: 3 }, 1000);
ok(f0.v === 1 && f0.inv && f0.inv.slots[0] && f0.pos === null && f0.bloqueado === false, 'la ficha nueva trae el kit, sin posición y sin bloqueo');
ok(fichaNueva('Ana', { camisa: 1, piel: 2, pelo: 3 }, 1000, false).inv === null, 'en un mundo creativo la ficha no trae mochila');
ok(JSON.stringify(f0).length < 65536, 'la ficha nueva cabe en los 64 KB');
ok(LLAVE.test('A'.repeat(22)) && !LLAVE.test('A'.repeat(21)) && !LLAVE.test('A'.repeat(21) + '-'), 'la llave son 22 caracteres base62');
ok(MAX_FICHAS === 12, 'hay un máximo de 12 fichas');

// --- invOk: lo que depende del catálogo
ok(invOk(copiaInv(kit)), 'una copia de la mochila sigue siendo válida');
ok(!invOk(con({ id: 60000, count: 1 })), 'un ítem que no existe se rechaza');
ok(!invOk(con({ id: K.stone, count: maxStack(K.stone) + 1 })), 'más de una pila se rechaza');
ok(!invOk({ ...vacio(), billetera: { 999: 5 } }), 'una billetera con algo que no es plata se rechaza');

// --- cambioOk: conservación
const cupo = () => ({ n: CUPO_INI });
ok(cambioOk(kit, copiaInv(kit), cupo()).ok, 'una foto igual a lo guardado se acepta sin gastar cupo');
const comio = copiaInv(kit); comio.slots[0].count = 3;
ok(cambioOk(kit, comio, cupo()).ok, 'gastar o perder cosas siempre se acepta');

// la plata nunca sube
const A = con({ id: K.stone, count: 10 }); A.billetera = { [Object.keys(VALOR)[0]]: 1 };
const B = copiaInv(A); B.billetera = { [Object.keys(VALOR)[0]]: 2 };
let r = cambioOk(A, B, cupo());
ok(!r.ok && r.motivo === 'plata', 'subir la plata de la billetera se rechaza');
const C = copiaInv(A); C.slots[5] = { id: +Object.keys(VALOR)[0], count: 3 };
r = cambioOk(A, C, cupo());
ok(!r.ok && r.motivo === 'plata', 'subir la plata como piezas en casillas se rechaza');
const D = copiaInv(A); D.billetera = {}; D.slots[5] = { id: +Object.keys(VALOR)[0], count: 1 };
ok(cambioOk(A, D, cupo()).ok, 'sacar la plata de la billetera a una casilla (mismo total) se acepta');

// los ítems únicos nunca aparecen
const unico = Object.keys(ITEMS).map(Number).find((id) => esUnico(id));
if (unico) { r = cambioOk(vacio(), con({ id: unico, count: 1 }), cupo()); ok(!r.ok && r.motivo === 'unico', `un ítem único (${ITEMS[unico].name || unico}) no puede aparecer`); } else ok(true, '(no hay ítems únicos en el catálogo)');

// mejoras y filo no suben
const espada = Object.keys(ITEMS).map(Number).find((id) => ITEMS[id] && ITEMS[id].durability && !esUnico(id));
if (espada) {
  const e1 = con({ id: espada, count: 1, dur: 5 }), e2 = con({ id: espada, count: 1, dur: 5, mejora: 3 });
  r = cambioOk(e1, e2, cupo()); ok(!r.ok && r.motivo === 'extra', 'subir la mejora de un arma se rechaza');
  const e3 = con({ id: espada, count: 1, dur: 5, filo: 4 });
  r = cambioOk(e1, e3, cupo()); ok(!r.ok && r.motivo === 'extra', 'subir el filo de un arma se rechaza');
  ok(cambioOk(e2, e1, cupo()).ok, 'perder la mejora se acepta (no es ganar)');
}

// lo común: una receta lo explica, si no gasta del cupo
const rec = RECIPES.find((x) => !x.cook && ingredients(x).length === 1 && x.out[1] >= 1 && !esUnico(x.out[0]) && ingredients(x)[0][1] <= 6);
if (rec) {
  const [iid, ic] = ingredients(rec)[0], [oid, oc] = rec.out;
  const antes = con({ id: iid, count: ic * 2 }), despues = con({ id: iid, count: ic }, { id: oid, count: Math.min(oc, maxStack(oid)) });
  r = cambioOk(antes, despues, { n: 0 });
  ok(r.ok && r.gasto === 0, `fabricar con una receta no gasta cupo (${ITEMS[iid] ? ITEMS[iid].name : iid} → ${ITEMS[oid] ? ITEMS[oid].name : oid})`);
}
const piedra40 = con({ id: K.stone, count: 40 });
r = cambioOk(vacio(), piedra40, { n: 0 });
ok(!r.ok && r.motivo === 'cupo', 'aparecer 40 de piedra sin receta y sin cupo se rechaza');
r = cambioOk(vacio(), piedra40, { n: 50 });
ok(r.ok && r.gasto === 40, 'con cupo alcanza y se gastan 40');
// el cupo se repone y sube por bloque roto, con tope
const cu = cupoNuevo(); cu.n = 0; recargar(cu, 10);
ok(cu.n === 60, 'el cupo se repone a 6 por segundo');
recargar(cu, 100000); ok(cu.n <= CUPO_MAX, 'el cupo no pasa del tope aunque pase mucho tiempo');
cu.n = 0; creditoBloque(cu); ok(cu.n === 4, 'cada bloque roto suma 4 al cupo');
// duplicar tirando de una pila es lo mismo que aparecer: no cuadra
const dup = copiaInv(kit); dup.slots[0].count = 20;
r = cambioOk(kit, dup, { n: 5 });
ok(!r.ok && r.motivo === 'cupo', 'subir una pila de 4 a 20 sin receta ni cupo se rechaza');

// --- vitalOk
ok(vitalOk(vitalInicial(), false) && vitalOk(vitalInicial(), false).volando === false, 'las constantes vitales iniciales valen');
ok(vitalOk({ vida: 20, hambre: 20, agua: 20, aire: 10, volando: true }, false).volando === false, 'volar en supervivencia no se acepta');
ok(vitalOk({ vida: 20, hambre: 20, agua: 20, aire: 10, volando: true }, true).volando === true, 'volar en creativo sí');
ok(vitalOk({ vida: 99999, hambre: 99, agua: -4, aire: 10, volando: false }, false).vida <= 40, 'la vida se acota');
ok(vitalOk({ vida: NaN, hambre: 1, agua: 1, aire: 1 }, false) === null, 'una constante vital que no es número se rechaza');

// --- los mensajes
const msgInv = { rev: 1, inv: copiaInv(kit), vital: vitalInicial() };
const v1 = validar('inv', msgInv, 3000, true);
ok(v1.ok && v1.msg.inv !== msgInv.inv, 'inv bueno: pasa y sale copiado');
ok(!validar('inv', { ...msgInv, extra: 1 }, 3000, true).ok, 'inv con clave de más se rechaza');
ok(!validar('inv', { ...msgInv, inv: { ...msgInv.inv, slots: msgInv.inv.slots.slice(1) } }, 3000, true).ok, 'inv con 35 casillas se rechaza');
ok(!validar('inv', { ...msgInv, inv: con({ id: 1, count: 1, oculto: true }) }, 3000, true).ok, 'una pila con un campo desconocido se rechaza');
ok(!validar('inv', { ...msgInv, vital: { ...vitalInicial(), hambre: 99 } }, 3000, true).ok, 'una constante vital fuera de rango se rechaza');
ok(!validar('inv', { ...msgInv, inv: null }, 3000, true).ok, 'inv no acepta mochila nula (la foto de creativo no se manda)');
const mFicha = { rev: 1, inv: copiaInv(kit), vital: vitalInicial(), pos: { x: 1, y: 70, z: 2, yaw: 0, pitch: 0 } };
ok(validar('ficha', mFicha, 3000, true).ok, 'ficha buena (con posición) pasa');
ok(validar('ficha', { ...mFicha, inv: null, pos: null }, 3000, true).ok, 'ficha de mundo creativo (sin mochila ni posición) pasa');
ok(!validar('ficha', { ...mFicha, pos: { x: 1, y: 70, z: 2 } }, 3000, true).ok, 'ficha con posición incompleta se rechaza');
ok(!validar('ficha', mFicha, 3000, false).ok, 'la ficha solo viaja del anfitrión al invitado (un invitado no la puede mandar)');
ok(!validar('inv', msgInv, 2 * 2 ** 20, true).ok, 'un mensaje de más de 1 MiB se rechaza');

// --- importar: meta.jugadores limpio
{
  const llave = 'a'.repeat(22);
  const sucio = { meta: { name: 'M', seed: 1, jugadores: { [llave]: { ...fichaNueva('Ana', { camisa: 1, piel: 1, pelo: 1 }, 5), vital: { vida: 999999, hambre: -5, agua: 'x', aire: 3, volando: 1 }, pos: { x: 1e20, y: 70, z: 0, yaw: 0, pitch: 0 }, nombres: new Array(50).fill('x') }, corta: { v: 1 } } }, chunks: [] };
  const m = validarMundo(sucio).meta;
  const f = m.jugadores[llave];
  ok(Object.keys(m.jugadores).length === 1 && f, 'importar: solo se queda la ficha con llave de verdad');
  ok(f.vital.vida === 200 && f.vital.hambre === 0 && f.vital.agua === 20 && f.vital.volando === true, 'importar: las constantes vitales se acotan');
  ok(f.pos.x === 3e7, 'importar: la posición se acota');
  ok(f.nombres.length <= 5, 'importar: pocos nombres');
  ok(f.inv && invOk(f.inv), 'importar: la mochila queda válida');
}

// --- el anfitrión con un canal falso (si el módulo carga en Node)
try {
  const { Anfitrion } = await import('../src/red/sesion.js');
  const enviados = [];
  const canal = { userId: 'H'.repeat(22), alMensaje() {}, alSalir() {}, alEntrar() {}, alError() {}, enviar: (n, c, p) => enviados.push({ n, c, p }), expulsar() {}, salir() {} };
  const fichas = {};
  let guardados = 0, creativo = false;
  const pos0 = { x: 5, y: 70, z: 5, yaw: 0, pitch: 0, flags: 0, arma: 0, dim: 0, seq: 0 };
  const env = {
    version: '12.13.0', perfil: () => ({ nombre: 'Anfi', cuerpo: { camisa: 0, piel: 0, pelo: 0 } }), miPos: () => pos0,
    mundo: () => ({ modo: creativo ? 'creative' : 'survival' }), fichas: () => fichas, guardar: () => { guardados++; },
    aviso() {}, chat() {}, cambio() {}, pedirEntrada() {}, cancelaEntrada() {}, remotos() {}, tiempo: () => ({}), chunksConMods: () => [], modsDe: () => [],
    puedeEditar: () => true, leer: () => 0, leerSiCargado: () => 0, escribir() {},
  };
  const A = new Anfitrion(canal, env, 'NB1.x');
  const entra = (userId, peerId, nombre) => {
    A.recibe('hola', { v: 1, g: '12.13.0', nombre, cuerpo: { camisa: 1, piel: 1, pelo: 1 } }, 100, { userId, peerId });
    A.acepta(peerId);
  };
  const ult = (peer, n) => [...enviados].reverse().find((e) => e.p === peer && e.n === `nb.${n}`);
  const luis = 'L'.repeat(22), eva = 'E'.repeat(22);
  entra(luis, 'p1', 'Luis');
  const fe = ult('p1', 'ficha');
  ok(fe && fe.c.inv.slots[0] && fe.c.pos === null, 'anfitrión: a quien entra por primera vez le da el kit inicial');
  ok(fichas[luis] && fichas[luis].inv.slots[1].id === K.torch, 'anfitrión: la ficha queda en meta.jugadores bajo su llave');
  // una foto buena
  const buena = copiaInv(fichas[luis].inv); buena.slots[0].count = 3;
  A.recibe('inv', { rev: fe.c.rev, inv: buena, vital: { vida: 14, hambre: 12, agua: 18, aire: 10, volando: false } }, 500, { userId: luis, peerId: 'p1' });
  ok(fichas[luis].inv.slots[0].count === 3 && fichas[luis].vital.vida === 14, 'anfitrión: guarda una foto que cuadra');
  // trampa: plata
  const plata = copiaInv(fichas[luis].inv); plata.billetera = { [Object.keys(VALOR)[0]]: 50 };
  const antes = enviados.length;
  A.recibe('inv', { rev: ult('p1', 'ficha').c.rev, inv: plata, vital: { vida: 14, hambre: 12, agua: 18, aire: 10, volando: false } }, 500, { userId: luis, peerId: 'p1' });
  ok(Object.keys(fichas[luis].inv.billetera).length === 0, 'anfitrión: NO guarda plata inventada');
  const corr = enviados.slice(antes).find((e) => e.n === 'nb.ficha');
  ok(corr && corr.c.inv.billetera && Object.keys(corr.c.inv.billetera).length === 0 && corr.c.rev > fe.c.rev, 'anfitrión: le manda su ficha verdadera con una versión nueva');
  // una foto vieja (con la versión anterior) se descarta sin más
  const n2 = enviados.length;
  A.recibe('inv', { rev: fe.c.rev, inv: copiaInv(fichas[luis].inv), vital: vitalInicial() }, 500, { userId: luis, peerId: 'p1' });
  ok(enviados.length === n2, 'anfitrión: una foto con versión vieja se descarta sin responder');
  // trampa: ítem único / ítems de la nada
  const nada = copiaInv(fichas[luis].inv); nada.slots[10] = { id: K.diamond_block || K.stone, count: 64 };
  A.recibe('inv', { rev: ult('p1', 'ficha').c.rev, inv: nada, vital: vitalInicial() }, 500, { userId: luis, peerId: 'p1' });
  ok(!fichas[luis].inv.slots[10], 'anfitrión: NO guarda una pila de 64 sacada de la nada');
  // se sale, queda guardado, y al volver recupera lo suyo en su posición
  A.recibe('pos', pos0, 100, { userId: luis, peerId: 'p1' });
  A.gente.get('p1').pos = { ...pos0, x: 40, y: 80, z: -12 };
  const g0 = guardados;
  A.sale('p1');
  ok(guardados === g0 + 1 && fichas[luis].estado === 'fuera' && fichas[luis].pos.x === 40, 'anfitrión: al salir vuelca la posición y guarda de inmediato');
  entra(luis, 'p9', 'Luis');
  const vuelta = ult('p9', 'ficha');
  ok(vuelta.c.inv.slots[0].count === 3 && vuelta.c.vital.vida === 14 && vuelta.c.pos && vuelta.c.pos.x === 40, 'anfitrión: al volver con la misma llave recupera la mochila, la vida y el lugar');
  // otra llave empieza de cero
  entra(eva, 'p2', 'Eva');
  const fev = ult('p2', 'ficha');
  ok(fev.c.inv.slots[0].count === 4 && fev.c.pos === null && fichas[eva] !== fichas[luis], 'anfitrión: otra llave empieza con el kit, de cero');
  // la segunda pestaña con la misma llave se rechaza, y la primera sigue
  const n3 = enviados.length;
  A.recibe('hola', { v: 1, g: '12.13.0', nombre: 'Luis', cuerpo: { camisa: 1, piel: 1, pelo: 1 } }, 100, { userId: luis, peerId: 'p10' });
  const rech = enviados.slice(n3).find((e) => e.n === 'nb.rechazo');
  ok(rech && rech.c.motivo === 'ya-conectado' && A.gente.get('p9').estado === 'dentro', 'anfitrión: la segunda pestaña con la misma llave se rechaza y la primera sigue');
  // una llave que no es llave
  const n4 = enviados.length;
  A.recibe('hola', { v: 1, g: '12.13.0', nombre: 'Raro', cuerpo: { camisa: 1, piel: 1, pelo: 1 } }, 100, { userId: 'no-es-llave', peerId: 'p11' });
  ok(enviados.slice(n4).some((e) => e.n === 'nb.rechazo') && !A.gente.has('p11'), 'anfitrión: una llave que no son 22 caracteres base62 se rechaza');
  // cuota de fichas
  for (let i = Object.keys(fichas).length; i < MAX_FICHAS; i++) fichas[String(i).padStart(22, 'z')] = fichaNueva('x', { camisa: 0, piel: 0, pelo: 0 }, 1);
  const n5 = enviados.length;
  A.recibe('hola', { v: 1, g: '12.13.0', nombre: 'Tarde', cuerpo: { camisa: 1, piel: 1, pelo: 1 } }, 100, { userId: 'T'.repeat(22), peerId: 'p12' });
  const rf = enviados.slice(n5).find((e) => e.n === 'nb.rechazo');
  ok(rf && rf.c.motivo === 'fichas', 'anfitrión: con las 12 fichas ocupadas, una llave nueva se rechaza');
  // la llave bloqueada no vuelve ni después de reabrir (queda en la ficha)
  A.expulsar('p2', true);
  ok(fichas[eva].bloqueado === true, 'anfitrión: bloquear a alguien queda anotado en su ficha');
  // trampas seguidas lo sacan
  const sale = enviados.length;
  for (let i = 0; i < 9 && A.gente.has('p9'); i++) A.fotoDe(A.gente.get('p9'), 'p9', { rev: A.gente.get('p9').rev, inv: plata, vital: vitalInicial() }); // directo: el límite de ritmo frenaría antes
  ok(!A.gente.has('p9') || enviados.slice(sale).some((e) => e.n === 'nb.expulsa'), 'anfitrión: muchas trampas seguidas lo sacan de la sala');
  // mundo creativo: no hay mochila que cuidar
  creativo = true;
  for (const k of Object.keys(fichas)) if (/^[0-9]/.test(k) || k[0] === 'z') delete fichas[k]; // libera cupo de fichas
  const ana = 'N'.repeat(22);
  entra(ana, 'p3', 'Ana');
  const fcr = ult('p3', 'ficha');
  ok(fcr.c.inv === null && fichas[ana].inv === null, 'anfitrión: en un mundo creativo la ficha no lleva mochila');
  const antesC = guardados;
  A.cerrar();
  ok(guardados === antesC + 1, 'anfitrión: al cerrar la sala guarda las fichas');
} catch (e) {
  fallas++;
  console.log(`✘ el anfitrión con canal falso no corrió: ${e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e}`);
}

if (fallas) { console.log(`\n${fallas} fallas`); process.exitCode = 1; } else console.log('\nTodas las fichas del multijugador pasan.');
