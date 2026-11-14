// v12.4.3 (AUDITORIA_SEGURIDAD_PREVIA.md, C4): un mundo importado de un archivo no se toma tal cual. validarMundo() lo limpia ANTES de
// guardarlo: fuera __proto__/constructor/prototype, textos sin «<», «>» ni caracteres de control y con tope de largo (así ningún texto
// del archivo puede volverse HTML en la libreta, el diario o el epílogo), números finitos y acotados, y tipos y rangos de lo conocido:
// la posición y el estado del jugador, el inventario (ids que existen, cantidades hasta la pila), los cambios de bloques (claves de chunk,
// índices e ids de bloque válidos) y las entidades de bloque (cofres, hornos…). Es una función pura: tools/revisar-importar.mjs la prueba.
import { BLOCKS, ITEMS, isBlockId, maxStack } from './blocks.js';
import { CHUNK, HEIGHT } from './worldgen.js';

export const TOPE_ARCHIVO = 64 * 2 ** 20; // 64 MB
const PROHIBIDAS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_TEXTO = 2000, MAX_LISTA = 200000, MAX_PROF = 14, MAX_NUM = 1e9;
const CELDAS = CHUNK * CHUNK * HEIGHT;

const limpiarTexto = (t, n = MAX_TEXTO) => [...String(t)].filter((c) => { const k = c.codePointAt(0); return k >= 32 && k !== 127 && c !== '<' && c !== '>'; }).join('').slice(0, n);
const num = (v, min, max, def) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : def);
const entero = (v, min, max, def) => { const n = num(v, min, max, def); return n === def ? def : Math.round(n); };
const esObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
export const idValido = (id) => Number.isInteger(id) && id > 0 && (isBlockId(id) ? !!BLOCKS[id] && BLOCKS[id] !== BLOCKS[0] : !!ITEMS[id]);

// cualquier valor: copia limpia (sin prototipos raros, sin funciones, textos y números acotados)
export function limpiarValor(v, prof = 0) {
  if (prof > MAX_PROF) return null;
  if (v === null || typeof v === 'boolean') return v;
  if (typeof v === 'number') return Number.isFinite(v) ? Math.max(-MAX_NUM, Math.min(MAX_NUM, v)) : null;
  if (typeof v === 'string') return limpiarTexto(v);
  if (Array.isArray(v)) return v.slice(0, MAX_LISTA).map((x) => limpiarValor(x, prof + 1));
  if (typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v)) { if (PROHIBIDAS.has(k)) continue; const x = limpiarValor(v[k], prof + 1); if (x !== undefined) Object.defineProperty(o, limpiarTexto(k, 80), { value: x, enumerable: true, writable: true, configurable: true }); }
    return o;
  }
  return undefined; // funciones, símbolos, undefined: fuera
}

// una pila de ítems: id que exista y cantidad entre 1 y su pila (o null si no sirve)
export function limpiarPila(s) {
  if (!esObj(s) || !idValido(s.id)) return null;
  const out = limpiarValor(s);
  out.id = s.id;
  out.count = entero(s.count, 1, maxStack(s.id), 1);
  if (out.dur !== undefined) out.dur = num(out.dur, 0, 100000, undefined);
  if (out.dia !== undefined) out.dia = num(out.dia, 1, 1e6, undefined);
  return out;
}
const limpiarPilas = (a, n) => (Array.isArray(a) ? a.slice(0, n).map((s) => (s ? limpiarPila(s) : null)) : new Array(n).fill(null));

// el archivo entero: devuelve { meta, chunks, be } ya limpios, o lanza un error con un mensaje para el jugador
export function validarMundo(payload) {
  if (!esObj(payload) || !esObj(payload.meta)) throw new Error('Este archivo no es un mundo de NanoBlocks');
  const meta = limpiarValor(payload.meta);
  // lo conocido, con tipo y rango
  meta.name = limpiarTexto(meta.name ?? 'Mundo', 40);
  if (typeof meta.seed !== 'number' && typeof meta.seed !== 'string') meta.seed = 1;
  if (typeof meta.seed === 'string') meta.seed = limpiarTexto(meta.seed, 60);
  meta.day = entero(meta.day, 1, 1e6, 1);
  meta.genVersion = entero(meta.genVersion, 1, 1000, 1);
  if (meta.format !== undefined) meta.format = entero(meta.format, 1, 1000, 1);
  for (const k of ['mode', 'dificultad', 'tipoMundo', 'dim']) if (meta[k] !== undefined && typeof meta[k] !== 'string') delete meta[k];
  const pos = (p) => (esObj(p) ? { ...p, x: num(p.x, -3e7, 3e7, 0), y: num(p.y, -64, HEIGHT + 64, 80), z: num(p.z, -3e7, 3e7, 0) } : undefined);
  if (meta.spawn !== undefined) meta.spawn = pos(meta.spawn);
  if (esObj(meta.player)) {
    const P = { ...pos(meta.player) };
    P.yaw = num(meta.player.yaw, -1e4, 1e4, 0); P.pitch = num(meta.player.pitch, -Math.PI, Math.PI, 0);
    P.health = num(meta.player.health, 0, 200, 20); P.food = num(meta.player.food, 0, 20, 20); P.water = num(meta.player.water, 0, 20, 20); P.air = num(meta.player.air, 0, 1000, 10);
    P.flying = !!meta.player.flying;
    meta.player = P;
  } else delete meta.player;
  if (esObj(meta.inventory)) {
    const I = meta.inventory, B = {};
    for (const [k, v] of Object.entries(esObj(I.billetera) ? I.billetera : {})) { const id = Number(k); if (idValido(id)) B[id] = entero(v, 0, 1e6, 0); }
    meta.inventory = { slots: limpiarPilas(I.slots, 36), armor: limpiarPilas(I.armor, 5), selected: entero(I.selected, 0, 8, 0), billetera: B };
  }
  // v12.10.0 (F0): las fichas de otras personas (meta.jugadores, ESPEC §5.2): máx. 12, llave de 22 caracteres base62, cada ficha ≤ 64 KB
  meta.epoca = entero(meta.epoca, 1, 1e6, 1);
  const fichas = {};
  if (esObj(meta.jugadores)) {
    for (const [k, f] of Object.entries(meta.jugadores).slice(0, 12)) {
      if (!/^[0-9A-Za-z]{22}$/.test(k) || !esObj(f) || JSON.stringify(f).length > 65536) continue;
      const F = limpiarValor(f);
      F.v = 1; F.nombre = limpiarTexto(F.nombre ?? 'Jugador', 16);
      F.rev = entero(F.rev, 0, 1e9, 0); F.bloqueado = !!F.bloqueado; F.estado = F.estado === 'archivado' ? 'archivado' : 'activo';
      if (esObj(f.inv)) F.inv = { slots: limpiarPilas(f.inv.slots, 36), armor: limpiarPilas(f.inv.armor, 5), selected: entero(f.inv.selected, 0, 8, 0), billetera: Object.fromEntries(Object.entries(esObj(f.inv.billetera) ? f.inv.billetera : {}).filter(([id]) => idValido(Number(id))).map(([id, n]) => [id, entero(n, 0, 1e6, 0)])) }; else delete F.inv;
      // v12.13.0 (F3): lo que guarda la ficha de verdad, también con tipo y rango (un mundo importado no es de fiar)
      const v = esObj(f.vital) ? f.vital : {};
      F.vital = { vida: num(v.vida, 0, 200, 20), hambre: num(v.hambre, 0, 20, 20), agua: num(v.agua, 0, 20, 20), aire: num(v.aire, 0, 1000, 10), volando: !!v.volando };
      if (esObj(f.pos)) F.pos = { x: num(f.pos.x, -3e7, 3e7, 0), y: num(f.pos.y, -64, HEIGHT + 64, 80), z: num(f.pos.z, -3e7, 3e7, 0), yaw: num(f.pos.yaw, -1e4, 1e4, 0), pitch: num(f.pos.pitch, -Math.PI, Math.PI, 0) }; else F.pos = null;
      const c = esObj(f.cuerpo) ? f.cuerpo : null;
      F.cuerpo = c ? { camisa: entero(c.camisa, 0, 31, 0), piel: entero(c.piel, 0, 31, 0), pelo: entero(c.pelo, 0, 31, 0) } : { camisa: 0, piel: 0, pelo: 0 };
      F.nombres = (Array.isArray(f.nombres) ? f.nombres : [F.nombre]).slice(0, 5).map((n) => limpiarTexto(n, 16)).filter(Boolean);
      F.desde = num(F.desde, 0, 1e15, 0); F.ultimaVez = num(F.ultimaVez, 0, 1e15, 0);
      Object.defineProperty(fichas, k, { value: F, enumerable: true, writable: true, configurable: true });
    }
  }
  meta.jugadores = fichas;
  // los cambios de bloques: [clave «cx,cz», [[índice, id], …]]
  const clave = (k) => typeof k === 'string' && /^-?\d{1,7},-?\d{1,7}$/.test(k);
  const chunks = [];
  for (const par of Array.isArray(payload.chunks) ? payload.chunks.slice(0, MAX_LISTA) : []) {
    if (!Array.isArray(par) || !clave(par[0]) || !Array.isArray(par[1])) continue;
    const entradas = [];
    for (const e of par[1].slice(0, CELDAS)) {
      if (!Array.isArray(e)) continue;
      const [i, id] = e;
      if (Number.isInteger(i) && i >= 0 && i < CELDAS && (id === 0 || (Number.isInteger(id) && isBlockId(id) && BLOCKS[id] && BLOCKS[id] !== BLOCKS[0]))) entradas.push([i, id]);
    }
    chunks.push([par[0], entradas]);
  }
  // las entidades de bloque: [clave, [[índice, datos], …]]; los cofres con pilas válidas
  const be = [];
  for (const par of Array.isArray(payload.be) ? payload.be.slice(0, MAX_LISTA) : []) {
    if (!Array.isArray(par) || !clave(par[0]) || !Array.isArray(par[1])) continue;
    const entradas = [];
    for (const e of par[1].slice(0, CELDAS)) {
      if (!Array.isArray(e) || !Number.isInteger(e[0]) || e[0] < 0 || e[0] >= CELDAS || !esObj(e[1])) continue;
      const d = limpiarValor(e[1]);
      if (Array.isArray(e[1].slots)) d.slots = limpiarPilas(e[1].slots, 54);
      if (Array.isArray(e[1].grid)) d.grid = limpiarPilas(e[1].grid, 9);
      if (d.nombre !== undefined) d.nombre = limpiarTexto(d.nombre, 32);
      entradas.push([e[0], d]);
    }
    be.push([par[0], entradas]);
  }
  return { meta, chunks, be };
}
