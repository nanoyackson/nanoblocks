// Prueba los cofres con candado, la votación para dormir, sala llena y versión distinta (v12.15.0). Un anfitrión de verdad (src/red/sesion.js)
// con un canal falso: no abre red ni navegador. Uso: node tools/revisar-cofres.mjs
import { Anfitrion } from '../src/red/sesion.js';
import { MAX_JUGADORES } from '../src/red/transporte.js';
import { PROTOCOL_VERSION, validar } from '../src/red/validar.js';
import { cierre, contar } from '../src/red/cofres.js';
import { fichaNueva, cambioOk } from '../src/red/ficha.js';
import { BLOCK_BY_KEY as K, ITEMS } from '../src/blocks.js';

let fallas = 0;
const ok = (c, t) => { if (c) console.log(`✔ ${t}`); else { fallas++; console.log(`✘ ${t}`); } };
const PIEDRA = K.stone, TIERRA = K.dirt;
const pila = (id, count) => ({ id, count });
const cofreVacio = () => new Array(27).fill(null);

// ── la lógica pura de cierre
{
  const antes = cofreVacio(); antes[0] = pila(PIEDRA, 10);
  const abre = new Map(), ahora = new Map([[PIEDRA, 10]]);
  let r = cierre(antes, antes.map((s) => s && { ...s }), abre, ahora); // se llevó 10 y dice que el cofre sigue igual
  ok(contar(r).get(PIEDRA) === undefined, 'se llevó 10 y dijo que seguían: el cofre queda sin ellos (no se duplican)');
  const dice = cofreVacio(); dice[0] = pila(PIEDRA, 99); // dice que hay 99
  r = cierre(antes, dice, new Map(), new Map());
  ok(contar(r).get(PIEDRA) === 10, 'decir que hay 99 de algo que no puso no sirve: quedan los 10 de antes');
  const dep = cofreVacio(); dep[0] = pila(PIEDRA, 10); dep[1] = pila(TIERRA, 5);
  r = cierre(antes, dep, new Map([[TIERRA, 5]]), new Map()); // puso 5 de tierra y su mochila perdió 5
  ok(contar(r).get(TIERRA) === 5 && contar(r).get(PIEDRA) === 10, 'dejar 5 de tierra que de verdad perdió su mochila: se acepta');
  r = cierre(antes, dep, new Map(), new Map()); // dice que puso tierra pero su mochila no perdió nada
  ok(!contar(r).get(TIERRA), 'poner en el cofre lo que la mochila no perdió: no entra');
  r = cierre(antes, null, new Map(), new Map([[PIEDRA, 4]])); // se desconectó con 4 ya en la mochila
  ok(contar(r).get(PIEDRA) === 6, 'se desconectó con 4 en la mochila: el cofre baja a 6 (se los llevó)');
}
// ── el permiso en cambioOk: subir lo del cofre sí, inventar otra cosa no
{
  const f = fichaNueva('Ana', { camisa: 0, piel: 0, pelo: 0 }, 0).inv;
  const con = (id, n) => { const i = JSON.parse(JSON.stringify(f)); i.slots[20] = pila(id, n); return i; };
  const permiso = { n: new Map([[PIEDRA, 10]]), col: 0, mejora: 0, filo: 0 };
  ok(cambioOk(f, con(PIEDRA, 10), { n: 0 }, permiso).ok, 'sacar 10 del cofre abierto no gasta cupo');
  ok(permiso.n.get(PIEDRA) === 0, 'el permiso se gasta al usarlo');
  ok(!cambioOk(f, con(PIEDRA, 10), { n: 0 }, permiso).ok, 'no se puede usar el permiso otra vez');
  ok(!cambioOk(f, con(TIERRA, 10), { n: 0 }, { n: new Map([[PIEDRA, 10]]), col: 0, mejora: 0, filo: 0 }).ok, 'con el permiso de piedra no se inventa tierra');
  ok(!cambioOk(f, con(PIEDRA, 10), { n: 0 }, null).ok, 'sin cofre abierto, subir 10 de piedra sin cupo no pasa');
}

// ── un anfitrión de verdad con un canal falso
function montar() {
  const enviados = [], mundo = { chest: { slots: cofreVacio() }, avisos: [], bl: new Map() };
  mundo.chest.slots[0] = pila(PIEDRA, 10);
  let onMsg = null, onSalir = null;
  const canal = { userId: 'ANFITRION000000000000', alMensaje: (f) => { onMsg = f; }, alSalir: (f) => { onSalir = f; }, enviar: (n, c, p) => enviados.push([n, c, p]), salir() {}, expulsar() {} };
  const fichas = {};
  const env = {
    version: '12.15.0', perfil: () => ({ nombre: 'Host', cuerpo: { camisa: 0, piel: 0, pelo: 0 } }), miPos: () => ({ x: 0, y: 70, z: 0, yaw: 0, pitch: 0, flags: 0, arma: 0, dim: 0 }),
    mundo: () => ({ nombre: 'm', seed: 1, genVersion: 1, tipo: 'normal', dificultad: 'normal', modo: 'survival', dim: 'tierra', dia: 1, hora: 0.5, spawn: { x: 0, y: 70, z: 0 } }),
    fichas: () => fichas, guardar() {}, aviso: (t) => mundo.avisos.push(t), cambio() {}, cancelaEntrada() {}, remotos() {}, chunksConMods: () => [], modsDe: () => [],
    pedirEntrada: (p) => { mundo.pend = p; }, cofre: (x, y, z) => (x === 5 && y === 70 && z === 5 ? mundo.chest : null), ponerCofre: (x, y, z, s) => { mundo.chest.slots = s; }, vidaDe() {},
    puedeEditar: () => true, leer: (x, y, z) => (mundo.bl.has(`${x},${y},${z}`) ? mundo.bl.get(`${x},${y},${z}`) : (y <= 69 ? PIEDRA : 0)), leerSiCargado: (x, y, z) => env.leer(x, y, z), escribir: (x, y, z, id) => { mundo.bl.set(`${x},${y},${z}`, id); },
  };
  env.ponerCreativo = false;
  const a = new Anfitrion(canal, env, 'sala');
  const llave = (i) => String(i).padStart(22, 'A');
  const recibe = (peer, i, tipo, cuerpo) => onMsg(`nb.${tipo}`, cuerpo, { userId: llave(i), peerId: peer });
  const entra = (peer, i, version = '12.15.0') => {
    recibe(peer, i, 'hola', { v: PROTOCOL_VERSION, g: version, nombre: `Inv${i}`, cuerpo: { camisa: 1, piel: 1, pelo: 1 } });
    const g = a.gente.get(peer);
    if (g && g.estado === 'espera') { a.acepta(peer); g.pos = { x: 5.5, y: 70, z: 5.5, yaw: 0, pitch: 0 }; }
    return g;
  };
  const dichos = (peer, tipo) => enviados.filter(([n, , p]) => n === `nb.${tipo}` && p === peer).map((e) => e[1]);
  return { a, mundo, recibe, entra, dichos, enviados, salir: (peer) => onSalir(llave(0), peer), env };
}
const foto = (a, peer, mod) => { const g = a.gente.get(peer); const inv = JSON.parse(JSON.stringify(g.ficha.inv)); mod(inv); return { rev: g.rev, inv, vital: { vida: 20, hambre: 20, agua: 20, aire: 10, volando: false } }; };
const hueco = (inv) => inv.slots.findIndex((s, i) => i >= 9 && !s);

// candado: A abre, B recibe «ocupado», el anfitrión también
{
  const t = montar(); t.entra('pA', 1); t.entra('pB', 2);
  t.recibe('pA', 1, 'cofre_abre', { x: 5, y: 70, z: 5 });
  ok(t.dichos('pA', 'cofre').length === 1 && t.dichos('pA', 'cofre')[0].slots[0].count === 10, 'A abre el cofre y recibe su contenido');
  t.recibe('pB', 2, 'cofre_abre', { x: 5, y: 70, z: 5 });
  ok(t.dichos('pB', 'cofre_no')[0]?.motivo === 'ocupado' && t.dichos('pB', 'cofre_no')[0].quien === 'Inv1', 'B recibe «ocupado» con el nombre de A');
  ok(!t.a.cofreHostAbre(5, 70, 5).ok, 'el anfitrión tampoco lo abre mientras A lo tiene');
  const gA = t.a.gente.get('pA');
  t.recibe('pA', 1, 'inv', foto(t.a, 'pA', (inv) => { inv.slots[hueco(inv)] = pila(PIEDRA, 10); }));
  ok(gA.ficha.inv.slots.some((s) => s && s.id === PIEDRA && s.count === 10), 'la foto con lo sacado del cofre se acepta sin gastar cupo');
  t.recibe('pA', 1, 'cofre_cierra', { x: 5, y: 70, z: 5, slots: t.mundo.chest.slots.map((s) => s && { ...s }) }); // MIENTE: dice que el cofre sigue con 10
  ok(!t.mundo.chest.slots.some((s) => s), 'cerrar diciendo que sigue lleno no duplica: el cofre queda vacío');
  t.recibe('pB', 2, 'cofre_abre', { x: 5, y: 70, z: 5 });
  ok(t.dichos('pB', 'cofre').length === 1, 'tras cerrar A, B lo abre');
  ok(t.a.cofreHostAbre(5, 70, 5).ok === false, 'y ahora lo tiene B: el anfitrión no');
}
// desconexión a mitad de cofre: lo que ya llevaba se descuenta; el candado se suelta
{
  const t = montar(); t.entra('pA', 1); t.entra('pB', 2);
  t.recibe('pA', 1, 'cofre_abre', { x: 5, y: 70, z: 5 });
  t.recibe('pA', 1, 'inv', foto(t.a, 'pA', (inv) => { inv.slots[hueco(inv)] = pila(PIEDRA, 4); }));
  t.salir('pA'); // se cae (el canal falso usa la llave 0; aquí se llama directo)
  t.a.sale('pA');
  ok(contar(t.mundo.chest.slots).get(PIEDRA) === 6, 'A se cae con 4 en la mochila: quedan 6 en el cofre (4 + 6 = 10, nada se duplica)');
  t.recibe('pB', 2, 'cofre_abre', { x: 5, y: 70, z: 5 });
  ok(t.dichos('pB', 'cofre').length === 1, 'tras la caída de A el candado está libre');
  t.entra('pA2', 1);
  ok(contar(t.a.gente.get('pA2').ficha.inv.slots).get(PIEDRA) === 4, 'A vuelve con sus 4 de piedra en la ficha');
}
// no abre un bloque que no es cofre, ni desde lejos
{
  const t = montar(); const g = t.entra('pA', 1);
  t.recibe('pA', 1, 'cofre_abre', { x: 9, y: 70, z: 9 });
  ok(t.dichos('pA', 'cofre_no')[0]?.motivo === 'no', 'un lugar sin cofre se rechaza');
  g.pos = { x: 100, y: 70, z: 100, yaw: 0, pitch: 0 };
  t.recibe('pA', 1, 'cofre_abre', { x: 5, y: 70, z: 5 });
  ok(t.dichos('pA', 'cofre_no').some((m) => m.motivo === 'lejos'), 'desde lejos no se abre');
}
// dormir por votación
{
  const t = montar(); t.entra('pA', 1); t.entra('pB', 2);
  let v = t.a.votoDormir();
  ok(v.total === 3 && v.falta === 2 && !v.listo, 'con 2 invitados presentes faltan 2 en cama');
  t.recibe('pA', 1, 'cama', { en: 1 });
  v = t.a.votoDormir(); ok(v.falta === 1 && !v.listo, 'A en cama: falta 1');
  t.a.anunciaSueno(v);
  ok(t.mundo.avisos.some((x) => x.includes('Duermen 2 de 3') && x.includes('faltan 1')), 'el aviso dice cuántos faltan');
  t.recibe('pB', 2, 'cama', { en: 1 });
  ok(t.a.votoDormir().listo, 'B en cama: ya todos duermen');
  t.recibe('pB', 2, 'cama', { en: 0 });
  ok(!t.a.votoDormir().listo, 'B se levanta: ya no está listo');
  t.a.sale('pB');
  ok(t.a.votoDormir().listo, 'B se desconecta: los que quedan sí pueden hacer amanecer');
  t.a.amanece();
  ok(t.dichos('pA', 'amanece').length === 1 && !t.a.gente.get('pA').cama, 'amanece avisa a los invitados y limpia las camas');
}
// sala llena y versión distinta
{
  const t = montar();
  for (let i = 1; i < MAX_JUGADORES; i++) t.entra(`p${i}`, i);
  ok(t.a.dentro().length === MAX_JUGADORES - 1, `entran ${MAX_JUGADORES - 1} invitados (+ el anfitrión = ${MAX_JUGADORES})`);
  t.entra('pExtra', 50);
  ok(t.dichos('pExtra', 'rechazo')[0]?.motivo === 'llena', `la persona número ${MAX_JUGADORES + 1} recibe «llena»`);
  const u = montar(); u.entra('pV', 1, '11.0.0');
  ok(u.dichos('pV', 'rechazo')[0]?.motivo === 'version', 'una versión distinta recibe «version»');
  ok(!u.a.gente.has('pV'), 'y no queda anotada como invitada');
}
// ── v12.15.5 (seguridad final): M1 lavar mejoras, M2 cupo farmeable, M3 cofre creativo sin validar
{
  const ESPADA = Object.keys(ITEMS).map(Number).find((id) => ITEMS[id] && ITEMS[id].durability);
  const antes = cofreVacio();
  // M1 pura: dice mejora 50 / filo 50 / dur enorme / cruda de una espada que su mochila perdió
  const dice = cofreVacio(); dice[0] = { id: ESPADA, count: 1, mejora: 50, filo: 50, dur: 99999, cruda: true, dia: 3 };
  let r = cierre(antes, dice, new Map([[ESPADA, 1]]), new Map(), { mejora: 1, filo: 0 });
  ok(r[0] && r[0].mejora === 1 && !r[0].filo && !r[0].cruda && r[0].dia === undefined && r[0].dur === ITEMS[ESPADA].durability, 'M1: mejora 50 topada a la que tenía (⭐1), filo 50 borrado, dur topada, cruda/dia no se creen');
  // M1 con el anfitrión de verdad: una espada ⭐1 entra al cofre y el invitado miente «mejora 50»
  const t = montar(); const g = t.entra('pA', 1);
  g.ficha.inv.slots[10] = { id: ESPADA, count: 1, mejora: 1 };
  t.recibe('pA', 1, 'cofre_abre', { x: 5, y: 70, z: 5 });
  t.recibe('pA', 1, 'inv', foto(t.a, 'pA', (inv) => { inv.slots[10] = null; }));
  const mentira = t.mundo.chest.slots.map((s) => s && { ...s }); mentira[3] = { id: ESPADA, count: 1, mejora: 50, filo: 50 };
  t.recibe('pA', 1, 'cofre_cierra', { x: 5, y: 70, z: 5, slots: mentira });
  const guardada = t.mundo.chest.slots.find((s) => s && s.id === ESPADA);
  ok(guardada && guardada.mejora === 1 && !guardada.filo, 'M1 (host): la espada ⭐1 queda ⭐1 en el cofre, no ⭐50 ni con filo');
  // el invitado honesto conserva su ⭐1 al dejar y volver a sacar
  t.recibe('pA', 1, 'cofre_abre', { x: 5, y: 70, z: 5 });
  ok(t.mundo.chest.slots.some((s) => s && s.id === ESPADA && s.mejora === 1), 'M1: el invitado honesto no pierde su ⭐1');
  t.recibe('pA', 1, 'cofre_cierra', { x: 5, y: 70, z: 5, slots: null });
  // M3: creativo (sin mochila): ids que no existen o cantidades de más se descartan; lo honesto pasa
  const c = montar(); c.entra('pA', 1); const gc = c.a.gente.get('pA'); gc.ficha.inv = null;
  c.recibe('pA', 1, 'cofre_abre', { x: 5, y: 70, z: 5 });
  const malo = cofreVacio(); malo[0] = { id: 65000, count: 1 };
  c.recibe('pA', 1, 'cofre_cierra', { x: 5, y: 70, z: 5, slots: malo });
  ok(c.mundo.chest.slots[0] && c.mundo.chest.slots[0].id === PIEDRA && c.mundo.chest.slots[0].count === 10, 'M3: un id que no existe se descarta y el cofre queda como estaba');
  c.recibe('pA', 1, 'cofre_abre', { x: 5, y: 70, z: 5 });
  const mucho = cofreVacio(); mucho[0] = { id: PIEDRA, count: 9000 };
  c.recibe('pA', 1, 'cofre_cierra', { x: 5, y: 70, z: 5, slots: mucho });
  ok(c.mundo.chest.slots[0].count === 10, 'M3: más que una pila no se acepta');
  c.recibe('pA', 1, 'cofre_abre', { x: 5, y: 70, z: 5 });
  const bueno = cofreVacio(); bueno[0] = { id: PIEDRA, count: 20 }; bueno[1] = { id: TIERRA, count: 5 };
  c.recibe('pA', 1, 'cofre_cierra', { x: 5, y: 70, z: 5, slots: bueno });
  ok(c.mundo.chest.slots[0].count === 20 && c.mundo.chest.slots[1].id === TIERRA, 'M3: en creativo un cierre honesto sí se guarda');
  // M2: poner y romper en bucle no da cupo; romper lo que ya estaba en el mundo sí
  const m = montar(); const gm = m.entra('pA', 1); gm.cupo.n = 0;
  for (let i = 0; i < 4; i++) {
    m.recibe('pA', 1, 'bloque', { op: 1, x: 5, y: 70, z: 6, id: PIEDRA, cara: 2, viejo: 0, seq: i * 2 });
    m.recibe('pA', 1, 'bloque', { op: 0, x: 5, y: 70, z: 6, id: 0, cara: 2, viejo: PIEDRA, seq: i * 2 + 1 });
  }
  ok(m.env.leer(5, 70, 6) === 0 && gm.cupo.n === 0, 'M2: 4 veces poner y romper el mismo bloque: el cupo sigue en 0');
  m.recibe('pA', 1, 'bloque', { op: 0, x: 5, y: 69, z: 6, id: 0, cara: 2, viejo: PIEDRA, seq: 99 });
  ok(gm.cupo.n === 4, 'M2: romper un bloque que ya estaba en el mundo sí da su cupo');
}
// los mensajes nuevos: forma
ok(validar('cofre_abre', { x: 1, y: 2, z: 3 }, 50).ok, 'cofre_abre bueno pasa');
ok(!validar('cofre_abre', { x: 1, y: 2, z: 3, extra: 1 }, 50).ok, 'cofre_abre con clave de más no');
ok(!validar('cofre_cierra', { x: 1, y: 2, z: 3, slots: [{ id: 1, count: 0 }] }, 50).ok, 'cofre_cierra con una pila de 0 no');
ok(validar('cofre_cierra', { x: 1, y: 2, z: 3, slots: null }, 50).ok, 'cofre_cierra sin contenido (solo suelta) pasa');
ok(!validar('cama', { en: 2 }, 20).ok, 'cama con 2 no');

console.log(fallas ? `\n${fallas} falla(s)` : '\nTodo bien');
process.exit(fallas ? 1 : 0);
