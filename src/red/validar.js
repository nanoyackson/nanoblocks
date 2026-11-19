// Validación de lo que llega por la red (ESPEC_PWA_MULTIJUGADOR §3.0 y §3.2). Funciones PURAS: sin Three.js, sin DOM, sin red; se
// prueban en Node (tools/revisar-red.mjs). Reglas de la auditoría: todo invitado es hostil; el mensaje se COPIA a un objeto nuevo con
// solo las claves conocidas y tipos exactos; claves de más, NaN, Infinity, __proto__/constructor/prototype = descartar. Nunca tocan el
// estado: devuelven { ok, motivo, msg } y el que llama decide. Nada de red todavía (F1 las conecta).
export const PROTOCOL_VERSION = 1;
export const TOPE_BYTES = 1 << 20; // tope duro global (1 MiB)
const PROHIBIDAS = new Set(['__proto__', 'constructor', 'prototype']);

const mal = (motivo) => ({ ok: false, motivo });
const esObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const ent = (v, a, b) => Number.isInteger(v) && v >= a && v <= b;
// texto limpio: sin controles ni «<», «>», «&»; se mide por caracteres
export function textoLimpio(t, max) {
  if (typeof t !== 'string' || t.length > max * 4) return null;
  const s = [...t].filter((c) => { const k = c.codePointAt(0); return k >= 32 && k !== 127 && c !== '<' && c !== '>' && c !== '&'; }).join('').trim();
  return s.length && s.length <= max ? s : null;
}
// ¿el objeto trae SOLO estas claves (y todas las obligatorias), sin las prohibidas?
function claves(o, permitidas, obligatorias = permitidas) {
  const ks = Object.getOwnPropertyNames(o);
  for (const k of ks) if (PROHIBIDAS.has(k) || !permitidas.includes(k)) return false;
  return obligatorias.every((k) => ks.includes(k));
}
// tamaño aproximado antes de mirar el contenido (A-5): cadenas y arreglos enormes se cortan sin recorrerlos enteros
export function pesoOk(v, tope = 4096) {
  let n = 0;
  const ir = (x, p) => {
    if (n > tope || p > 6) return false;
    if (typeof x === 'string') { n += x.length; return n <= tope; }
    if (x === null || typeof x !== 'object') { n += 8; return n <= tope; }
    if (Array.isArray(x)) { n += 2; if (x.length > tope) return false; return x.every((y) => ir(y, p + 1)); }
    for (const k of Object.getOwnPropertyNames(x)) { n += k.length + 2; if (!ir(x[k], p + 1)) return false; }
    return n <= tope;
  };
  return ir(v, 0);
}

export const MAX_MOBS = 40; // criaturas por mensaje (las más cercanas a esa persona)
export const MAX_BLOQUES = 120, MAX_TROZO = 700; // entradas por mensaje de «bloques» y de «chunks_dato»
const PESO_TIPO = { mobs: 9000, bloques: 12000, chunks_dato: 30000, inv: 12000, ficha: 12000, cofre: 14000, cofre_cierra: 14000 }; // las que pasan del tope normal de 4096
export const MOTIVOS_RECHAZO = ['version', 'llena', 'expulsado', 'ya-conectado', 'no-acepta', 'hola', 'fichas'];

// ── v12.13.0 (F3): la ficha. Aquí solo la FORMA (claves exactas, tipos y rangos, copia nueva); que los ítems existan y lo que
// cambió cuadre lo mira ficha.js (necesita el catálogo). Una pila: { id, count, dur?, mejora?, filo?, cruda?, dia? } o null.
const PILA = ['id', 'count', 'dur', 'mejora', 'filo', 'cruda', 'dia'];
export function limpiaPila(s) { // undefined = mal formada (null es una casilla vacía y vale)
  if (s === null) return null;
  if (!esObj(s) || !claves(s, PILA, ['id', 'count']) || !ent(s.id, 1, 65535) || !ent(s.count, 1, 9999)) return undefined;
  const o = { id: s.id, count: s.count };
  if (s.dur !== undefined) { if (!ent(s.dur, 0, 100000)) return undefined; o.dur = s.dur; }
  if (s.mejora !== undefined) { if (!ent(s.mejora, 1, 50)) return undefined; o.mejora = s.mejora; }
  if (s.filo !== undefined) { if (!ent(s.filo, 1, 50)) return undefined; o.filo = s.filo; }
  if (s.cruda !== undefined) { if (s.cruda !== true) return undefined; o.cruda = true; }
  if (s.dia !== undefined) { if (!fin(s.dia) || s.dia < 0 || s.dia > 1e7) return undefined; o.dia = s.dia; }
  return o;
}
export function limpiaInv(i) {
  if (!esObj(i) || !claves(i, ['slots', 'selected', 'armor', 'billetera']) || !Array.isArray(i.slots) || i.slots.length !== 36 || !Array.isArray(i.armor) || i.armor.length !== 5) return null;
  if (!ent(i.selected, 0, 8) || !esObj(i.billetera)) return null;
  const slots = [], armor = [], billetera = {};
  for (const s of i.slots) { const p = limpiaPila(s); if (p === undefined) return null; slots.push(p); }
  for (const s of i.armor) { const p = limpiaPila(s); if (p === undefined) return null; armor.push(p); }
  const ks = Object.getOwnPropertyNames(i.billetera);
  if (ks.length > 20) return null;
  for (const k of ks) { if (!/^\d{1,5}$/.test(k) || !ent(i.billetera[k], 0, 1e6)) return null; if (i.billetera[k] > 0) billetera[k] = i.billetera[k]; }
  return { slots, selected: i.selected, armor, billetera };
}
function limpiaVital(v) {
  if (!esObj(v) || !claves(v, ['vida', 'hambre', 'agua', 'aire', 'volando']) || !fin(v.vida) || !fin(v.hambre) || !fin(v.agua) || !fin(v.aire) || typeof v.volando !== 'boolean') return null;
  if (v.vida < 0 || v.vida > 200 || v.hambre < 0 || v.hambre > 20 || v.agua < 0 || v.agua > 20 || v.aire < 0 || v.aire > 1000) return null;
  return { vida: v.vida, hambre: v.hambre, agua: v.agua, aire: v.aire, volando: v.volando };
}
// un jugador dentro de «jugadores» / «acepta»: id de sala, nombre, cuerpo y lo mismo que lleva «pos»
// v13.5.3: la armadura puesta (casco, peto, piernas, botas, brazo): cinco ids de ítem (0 = nada); opcional, sin ella es «sin armadura»
const armaduraOk = (a) => Array.isArray(a) && a.length === 5 && a.every((n) => ent(n, 0, 65535));
function entradaJugador(e) {
  if (!esObj(e) || !claves(e, ['pid', 'nombre', 'cuerpo', 'x', 'y', 'z', 'yaw', 'pitch', 'flags', 'arma', 'dim', 'arm'], ['pid', 'nombre', 'cuerpo', 'x', 'y', 'z', 'yaw', 'pitch', 'flags', 'arma', 'dim']) || !ent(e.pid, 0, 5)) return null;
  const nombre = textoLimpio(e.nombre, 16), c = e.cuerpo;
  if (!nombre || !esObj(c) || !claves(c, ['camisa', 'piel', 'pelo']) || !ent(c.camisa, 0, 31) || !ent(c.piel, 0, 31) || !ent(c.pelo, 0, 31)) return null;
  const p = VALIDADORES.pos({ seq: 0, x: e.x, y: e.y, z: e.z, yaw: e.yaw, pitch: e.pitch, flags: e.flags, arma: e.arma, dim: e.dim, ...(e.arm === undefined ? {} : { arm: e.arm }) });
  if (!p.ok) return null;
  const { seq, ...resto } = p.msg; // eslint-disable-line no-unused-vars
  return { pid: e.pid, nombre, cuerpo: { camisa: c.camisa, piel: c.piel, pelo: c.pelo }, ...resto };
}

// Cada validador recibe el mensaje ya decodificado y devuelve { ok:true, msg: copia limpia } o { ok:false, motivo }

// v12.15.0: un cofre se nombra por su posición; las casillas son pilas limpias (hasta COFRE_MAX) o null en las vacías
function posCofre(m, extra) {
  if (!esObj(m) || !claves(m, ['x', 'y', 'z', ...extra]) || !ent(m.x, -3e7, 3e7) || !ent(m.y, 0, 127) || !ent(m.z, -3e7, 3e7)) return mal('esquema');
  return { ok: true, msg: { x: m.x, y: m.y, z: m.z } };
}
function limpiaSlots(a) {
  if (!Array.isArray(a) || a.length < 1 || a.length > 54) return undefined;
  const l = [];
  for (const s of a) { const p = limpiaPila(s); if (p === undefined) return undefined; l.push(p); }
  return l;
}
export const VALIDADORES = {
  hola(m) {
    if (!esObj(m) || !claves(m, ['v', 'g', 'nombre', 'cuerpo'])) return mal('esquema');
    if (m.v !== PROTOCOL_VERSION) return mal('version');
    const g = textoLimpio(m.g, 12), nombre = textoLimpio(m.nombre, 16);
    if (!g || !nombre) return mal('texto');
    const c = m.cuerpo;
    if (!esObj(c) || !claves(c, ['camisa', 'piel', 'pelo']) || !ent(c.camisa, 0, 31) || !ent(c.piel, 0, 31) || !ent(c.pelo, 0, 31)) return mal('cuerpo');
    return { ok: true, msg: { v: m.v, g, nombre, cuerpo: { camisa: c.camisa, piel: c.piel, pelo: c.pelo } } };
  },
  // movimiento: finito y dentro del mundo; la velocidad la comprueba velocidadOk (necesita la última posición válida)
  pos(m) {
    if (!esObj(m) || !claves(m, ['seq', 'x', 'y', 'z', 'yaw', 'pitch', 'flags', 'arma', 'dim', 'arm'], ['seq', 'x', 'y', 'z', 'yaw', 'pitch', 'flags', 'arma', 'dim'])) return mal('esquema');
    if (m.arm !== undefined && !armaduraOk(m.arm)) return mal('numero');
    if (!ent(m.seq, 0, 65535) || !fin(m.x) || !fin(m.y) || !fin(m.z) || !fin(m.yaw) || !fin(m.pitch)) return mal('numero');
    if (Math.abs(m.x) > 3e7 || Math.abs(m.z) > 3e7 || m.y < -20 || m.y > 600) return mal('fuera-del-mundo');
    if (!ent(m.flags, 0, 255) || !ent(m.arma, 0, 65535) || !ent(m.dim, 0, 3)) return mal('numero');
    return { ok: true, msg: { seq: m.seq, x: m.x, y: m.y, z: m.z, yaw: m.yaw, pitch: m.pitch, flags: m.flags, arma: m.arma, dim: m.dim, arm: m.arm ? m.arm.slice() : [0, 0, 0, 0, 0] } };
  },
  chunks_pide(m) {
    if (!esObj(m) || !claves(m, ['c']) || !Array.isArray(m.c) || m.c.length > 16) return mal('esquema');
    const c = [];
    for (const p of m.c) { if (!Array.isArray(p) || p.length !== 2 || !ent(p[0], -2e6, 2e6) || !ent(p[1], -2e6, 2e6)) return mal('par'); c.push([p[0], p[1]]); }
    return { ok: true, msg: { c } };
  },
  // v12.12.0 (F2): cambios de bloques. El anfitrión los difunde (y también corrige con ellos al que se equivocó); cada entrada es [x,y,z,id]
  bloques(m) {
    if (!esObj(m) || !claves(m, ['b']) || !Array.isArray(m.b) || m.b.length < 1 || m.b.length > MAX_BLOQUES) return mal('esquema');
    const b = [];
    for (const e of m.b) { if (!Array.isArray(e) || e.length !== 4 || !ent(e[0], -3e7, 3e7) || !ent(e[1], 0, 127) || !ent(e[2], -3e7, 3e7) || !ent(e[3], 0, 1023)) return mal('bloque'); b.push([e[0], e[1], e[2], e[3]]); }
    return { ok: true, msg: { b } };
  },
  // el estado de un trozo del mundo (los cambios del jugador sobre el terreno generado): r=1 → antes se descarta lo que el invitado tuviera ahí
  chunks_dato(m) {
    if (!esObj(m) || !claves(m, ['cx', 'cz', 'r', 'm']) || !ent(m.cx, -2e6, 2e6) || !ent(m.cz, -2e6, 2e6) || !ent(m.r, 0, 1) || !Array.isArray(m.m) || m.m.length > MAX_TROZO) return mal('esquema');
    const l = [];
    for (const e of m.m) { if (!Array.isArray(e) || e.length !== 2 || !ent(e[0], 0, 32767) || !ent(e[1], 0, 1023)) return mal('entrada'); l.push([e[0], e[1]]); }
    return { ok: true, msg: { cx: m.cx, cz: m.cz, r: m.r, m: l } };
  },
  rompe_inicio(m) {
    if (!esObj(m) || !claves(m, ['x', 'y', 'z', 'seq']) || !ent(m.x, -3e7, 3e7) || !ent(m.y, -64, 600) || !ent(m.z, -3e7, 3e7) || !ent(m.seq, 0, 65535)) return mal('esquema');
    return { ok: true, msg: { x: m.x, y: m.y, z: m.z, seq: m.seq } };
  },
  bloque(m) {
    if (!esObj(m) || !claves(m, ['op', 'x', 'y', 'z', 'id', 'cara', 'viejo', 'seq'])) return mal('esquema');
    if (!ent(m.op, 0, 1) || !ent(m.x, -3e7, 3e7) || !ent(m.y, -64, 600) || !ent(m.z, -3e7, 3e7) || !ent(m.id, 0, 65535) || !ent(m.cara, 0, 5) || !ent(m.viejo, 0, 65535) || !ent(m.seq, 0, 65535)) return mal('numero');
    return { ok: true, msg: { op: m.op, x: m.x, y: m.y, z: m.z, id: m.id, cara: m.cara, viejo: m.viejo, seq: m.seq } };
  },
  inv_op(m) {
    if (!esObj(m) || !claves(m, ['opId', 'op', 'a', 'b', 'n', 'receta', 'esperado'], ['opId', 'op'])) return mal('esquema');
    if (!ent(m.opId, 0, 2 ** 31) || !['mover', 'dividir', 'soltar', 'equipar', 'fabricar', 'usar', 'elegir'].includes(m.op)) return mal('op');
    const out = { opId: m.opId, op: m.op };
    for (const k of ['a', 'b', 'n', 'receta']) if (m[k] !== undefined) { if (!ent(m[k], 0, 100000)) return mal('numero'); out[k] = m[k]; }
    if (m.esperado !== undefined) { if (!Array.isArray(m.esperado) || m.esperado.length !== 2 || !ent(m.esperado[0], 0, 65535) || !ent(m.esperado[1], 0, 999)) return mal('esperado'); out.esperado = [m.esperado[0], m.esperado[1]]; }
    return { ok: true, msg: out };
  },
  golpe(m) {
    if (!esObj(m) || !claves(m, ['mob', 'pesado']) || !ent(m.mob, 0, 2 ** 32) || typeof m.pesado !== 'boolean') return mal('esquema');
    return { ok: true, msg: { mob: m.mob, pesado: m.pesado } };
  },
  // ---- v12.14.0 (F4): criaturas. El anfitrión las simula y las muestra: cada entrada = [id, tipo, x, y, z, yaw, vida, flags(1 muriendo, 2 barra de jefe, 4 segunda fase), vida máxima]
  mobs(m) {
    if (!esObj(m) || !claves(m, ['l']) || !Array.isArray(m.l) || m.l.length > MAX_MOBS) return mal('esquema');
    const l = [];
    for (const e of m.l) {
      if (!Array.isArray(e) || e.length !== 9 || !ent(e[0], 0, 2 ** 31) || typeof e[1] !== 'string' || !/^[a-z][a-z0-9_]{0,39}$/.test(e[1]) || PROHIBIDAS.has(e[1])) return mal('mob');
      if (!fin(e[2]) || !fin(e[3]) || !fin(e[4]) || !fin(e[5]) || !fin(e[6]) || Math.abs(e[2]) > 3e7 || Math.abs(e[4]) > 3e7 || e[3] < -20 || e[3] > 600 || e[6] < 0 || e[6] > 1e6 || !ent(e[7], 0, 255) || !fin(e[8]) || e[8] < 0 || e[8] > 1e6) return mal('mob');
      l.push([e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8]]);
    }
    return { ok: true, msg: { l } };
  },
  // el daño que le toca a esta persona (la criatura lo calculó en el anfitrión; la armadura y la vida son de ella). m: 0 sin armadura, 1 con, 2 media
  dano(m) {
    if (!esObj(m) || !claves(m, ['a', 'x', 'z', 'c', 'i', 'm']) || !fin(m.a) || m.a <= 0 || m.a > 100 || !ent(m.m, 0, 2) || typeof m.i !== 'boolean') return mal('esquema');
    if ((m.x !== null && (!fin(m.x) || Math.abs(m.x) > 3e7)) || (m.z !== null && (!fin(m.z) || Math.abs(m.z) > 3e7)) || (m.x === null) !== (m.z === null)) return mal('numero');
    const c = textoLimpio(m.c, 80) || 'Una criatura';
    return { ok: true, msg: { a: m.a, x: m.x, z: m.z, c, i: m.i, m: m.m } };
  },
  // v12.14.1: un aviso del anfitrión para todas las personas (un jefe cayó, un logro del mundo)
  // ---- v12.15.0: cofres con candado y dormir por votación ----
  cofre_abre(m) { return posCofre(m, []); },
  cofre_cierra(m) { // el invitado dice cómo quedó (slots) o null si solo suelta
    const r = posCofre(m, ['slots']);
    if (!r.ok) return r;
    const s = m.slots === null ? null : limpiaSlots(m.slots);
    return s === undefined ? mal('slots') : { ok: true, msg: { ...r.msg, slots: s } };
  },
  cofre(m) { // el anfitrión le da el contenido
    const r = posCofre(m, ['slots', 'nombre']);
    if (!r.ok) return r;
    const s = limpiaSlots(m.slots);
    if (!s) return mal('slots');
    return { ok: true, msg: { ...r.msg, slots: s, nombre: m.nombre === null ? null : textoLimpio(m.nombre, 24) || null } };
  },
  cofre_no(m) {
    if (!esObj(m) || !claves(m, ['motivo', 'quien']) || !['ocupado', 'lejos', 'no'].includes(m.motivo)) return mal('esquema');
    return { ok: true, msg: { motivo: m.motivo, quien: textoLimpio(m.quien, 16) || '' } };
  },
  cofre_suelta(m) { return esObj(m) && claves(m, []) ? { ok: true, msg: {} } : mal('esquema'); },
  cama(m) { return esObj(m) && claves(m, ['en']) && ent(m.en, 0, 1) ? { ok: true, msg: { en: m.en } } : mal('esquema'); },
  amanece(m) { return esObj(m) && claves(m, []) ? { ok: true, msg: {} } : mal('esquema'); },
  aviso(m) {
    if (!esObj(m) || !claves(m, ['texto'])) return mal('esquema');
    const t = textoLimpio(m.texto, 120);
    if (!t) return mal('texto');
    return { ok: true, msg: { texto: t } };
  },
  // el botín de lo que mató esta persona: [[id, cuántos], …]
  botin(m) {
    if (!esObj(m) || !claves(m, ['l']) || !Array.isArray(m.l) || m.l.length < 1 || m.l.length > 12) return mal('esquema');
    const l = [];
    for (const e of m.l) { if (!Array.isArray(e) || e.length !== 2 || !ent(e[0], 1, 65535) || !ent(e[1], 1, 999)) return mal('botin'); l.push([e[0], e[1]]); }
    return { ok: true, msg: { l } };
  },
  chat(m) {
    if (!esObj(m) || !claves(m, ['texto'])) return mal('esquema');
    const t = textoLimpio(m.texto, 200);
    if (!t) return mal('texto');
    if (t.startsWith('/')) return mal('comando'); // ningún comando viaja por la red (A-13, A-15)
    return { ok: true, msg: { texto: t } };
  },
  // v12.13.0: la «foto» de la mochila y las constantes vitales del invitado. rev = la última ficha del anfitrión que vio (una foto
  // con rev viejo se descarta: se hizo antes de una corrección)
  inv(m) {
    if (!esObj(m) || !claves(m, ['rev', 'inv', 'vital']) || !ent(m.rev, 0, 2 ** 31)) return mal('esquema');
    const inv = limpiaInv(m.inv), vital = limpiaVital(m.vital);
    return inv && vital ? { ok: true, msg: { rev: m.rev, inv, vital } } : mal('ficha');
  },
  // ---- lo que el anfitrión le manda al invitado (v12.11.0): el invitado tampoco se fía, el anfitrión puede ser hostil ----
  // v12.13.0: su ficha verdadera (al entrar y cada vez que corrige). inv = null en un mundo creativo (la mochila es suya y no se cuida)
  ficha(m) {
    if (!esObj(m) || !claves(m, ['rev', 'inv', 'vital', 'pos']) || !ent(m.rev, 0, 2 ** 31)) return mal('esquema');
    const inv = m.inv === null ? null : limpiaInv(m.inv), vital = limpiaVital(m.vital);
    if ((m.inv !== null && !inv) || !vital) return mal('ficha');
    let pos = null;
    if (m.pos !== null) {
      const p = esObj(m.pos) && claves(m.pos, ['x', 'y', 'z', 'yaw', 'pitch']) ? m.pos : null;
      if (!p || !fin(p.x) || !fin(p.y) || !fin(p.z) || !fin(p.yaw) || !fin(p.pitch) || Math.abs(p.x) > 3e7 || Math.abs(p.z) > 3e7 || p.y < -20 || p.y > 600) return mal('ficha');
      pos = { x: p.x, y: p.y, z: p.z, yaw: p.yaw, pitch: p.pitch };
    }
    return { ok: true, msg: { rev: m.rev, inv, vital, pos } };
  },
  acepta(m) {
    if (!esObj(m) || !claves(m, ['pid', 'mundo', 'j']) || !ent(m.pid, 1, 5) || !esObj(m.mundo) || !Array.isArray(m.j) || m.j.length > 6) return mal('esquema');
    const w = m.mundo;
    if (!claves(w, ['nombre', 'seed', 'genVersion', 'tipo', 'dificultad', 'modo', 'dim', 'dia', 'hora', 'spawn'])) return mal('mundo');
    const nombre = textoLimpio(w.nombre, 40);
    if (!nombre || !ent(w.seed, 0, 4294967295) || !ent(w.genVersion, 1, 1000) || !['normal', 'compacto'].includes(w.tipo) || !['tranquilo', 'normal', 'dificil'].includes(w.dificultad) || !['survival', 'creative'].includes(w.modo) || w.dim !== 'tierra') return mal('mundo');
    if (!ent(w.dia, 1, 1e7) || !fin(w.hora) || w.hora < 0 || w.hora > 1 || !esObj(w.spawn) || !claves(w.spawn, ['x', 'y', 'z']) || !fin(w.spawn.x) || !fin(w.spawn.y) || !fin(w.spawn.z) || Math.abs(w.spawn.x) > 3e7 || Math.abs(w.spawn.z) > 3e7 || w.spawn.y < -20 || w.spawn.y > 600) return mal('mundo');
    const j = [];
    for (const e of m.j) { const r = entradaJugador(e); if (!r) return mal('jugador'); j.push(r); }
    return { ok: true, msg: { pid: m.pid, mundo: { nombre, seed: w.seed, genVersion: w.genVersion, tipo: w.tipo, dificultad: w.dificultad, modo: w.modo, dim: w.dim, dia: w.dia, hora: w.hora, spawn: { x: w.spawn.x, y: w.spawn.y, z: w.spawn.z } }, j } };
  },
  rechazo(m) {
    if (!esObj(m) || !claves(m, ['motivo']) || !MOTIVOS_RECHAZO.includes(m.motivo)) return mal('esquema');
    return { ok: true, msg: { motivo: m.motivo } };
  },
  jugadores(m) {
    if (!esObj(m) || !claves(m, ['j']) || !Array.isArray(m.j) || m.j.length > 6) return mal('esquema');
    const j = [];
    for (const e of m.j) { const r = entradaJugador(e); if (!r) return mal('jugador'); j.push(r); }
    return { ok: true, msg: { j } };
  },
  corrige(m) {
    if (!esObj(m) || !claves(m, ['x', 'y', 'z', 'seq']) || !fin(m.x) || !fin(m.y) || !fin(m.z) || !ent(m.seq, 0, 65535) || Math.abs(m.x) > 3e7 || Math.abs(m.z) > 3e7 || m.y < -20 || m.y > 600) return mal('esquema');
    return { ok: true, msg: { x: m.x, y: m.y, z: m.z, seq: m.seq } };
  },
  tiempo(m) {
    if (!esObj(m) || !claves(m, ['dia', 'hora', 'clima']) || !ent(m.dia, 1, 1e7) || !fin(m.hora) || m.hora < 0 || m.hora > 1 || !ent(m.clima, 0, 2)) return mal('esquema');
    return { ok: true, msg: { dia: m.dia, hora: m.hora, clima: m.clima } };
  },
  chatr(m) {
    if (!esObj(m) || !claves(m, ['pid', 'texto']) || !ent(m.pid, 0, 5)) return mal('esquema');
    const t = textoLimpio(m.texto, 200);
    return t ? { ok: true, msg: { pid: m.pid, texto: t } } : mal('texto');
  },
  expulsa(m) {
    if (!esObj(m) || !claves(m, ['motivo']) || !['expulsado', 'bloqueado', 'ritmo', 'cierre'].includes(m.motivo)) return mal('esquema');
    return { ok: true, msg: { motivo: m.motivo } };
  },
  salud(m) { return m === 0 || m === 1 ? { ok: true, msg: m } : mal('esquema'); },
};

// Entrada única: tipo + cuerpo + tamaño en bytes + si el remitente está aceptado. Solo decide si el mensaje es aceptable
export function validar(tipo, cuerpo, bytes, remitenteOk = true) {
  if (typeof tipo !== 'string' || !Object.prototype.hasOwnProperty.call(VALIDADORES, tipo)) return mal('desconocido'); // lista blanca (A-6)
  if (!remitenteOk) return mal('remitente');
  if (!Number.isFinite(bytes) || bytes < 0 || bytes > TOPE_BYTES) return mal('tamano');
  if (!pesoOk(cuerpo, PESO_TIPO[tipo] || 4096)) return mal('tamano');
  return VALIDADORES[tipo](cuerpo);
}

// Velocidad: ¿pudo llegar de `a` a `b` en `dtSeg` segundos? vMax = SPRINT 5.612 (player.js), FLY_SPRINT 21.6 si vuela
export const V_SPRINT = 5.612, V_VUELO = 21.6;
export function velocidadOk(a, b, dtSeg, vuela = false) {
  if (!fin(dtSeg) || dtSeg <= 0) return false;
  const d = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
  return d / dtSeg <= (vuela ? V_VUELO : V_SPRINT) * 1.35 + 0.5;
}
// alcance para romper o poner (REACH_SURVIVAL 4.6, REACH_CREATIVE 6) más 1.0 de margen por la latencia
export function alcanceOk(desde, bx, by, bz, creativo = false) {
  return Math.hypot(bx + 0.5 - desde.x, by + 0.5 - (desde.y + 1.6), bz + 0.5 - desde.z) <= (creativo ? 6 : 4.6) + 1.0;
}
