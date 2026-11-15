// Guardado de partidas en IndexedDB (dentro del navegador), con versión de formato y migraciones.
import { SAVE_FORMAT, GAME_VERSION, GAME_NAME, MIN_VERSION } from './version.js';

// v12.4.6: comparar versiones «12.4.10» > «12.4.9» (número a número, no como texto)
// v12.4.9: «v12.4.7» vale como 12.4.7; lo que no es una versión da null (y compatibilidad lo trata como más nuevo: no se abre)
export function leerVersion(v) {
  const m = /^v?(\d+(?:\.\d+)*)$/.exec(String(v ?? '').trim());
  return m ? m[1].split('.').map(Number) : null;
}
export function compararVersion(a, b) {
  const x = leerVersion(a) || [0], y = leerVersion(b) || [0];
  for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return Math.sign(d); }
  return 0;
}
// ¿se puede abrir este mundo con este juego? { bloquea } si no (lo guardó un juego más nuevo, con cosas que este no entiende),
// { avisa } si lo guardó una versión más nueva pero compatible, o null
export function compatibilidad(meta) {
  if (!meta) return null;
  const raro = meta.minVersion !== undefined && meta.minVersion !== null && !leerVersion(meta.minVersion); // v12.4.9: una versión que no se entiende, mejor no abrirla
  if (raro || (meta.minVersion && compararVersion(meta.minVersion, GAME_VERSION) > 0) || (Number.isInteger(meta.format) && meta.format > SAVE_FORMAT)) {
    return { bloquea: `Este mundo es de una versión más nueva del juego (necesita la ${meta.minVersion || meta.gameVersion || 'más reciente'}; esta es la ${GAME_VERSION}). Abrirlo aquí podría dañarlo: actualice el juego primero.` };
  }
  if (meta.gameVersion && compararVersion(meta.gameVersion, GAME_VERSION) > 0) return { avisa: `Este mundo se guardó con la versión ${meta.gameVersion} y esta es la ${GAME_VERSION}. Se puede abrir, pero lo más nuevo podría no estar. ¿Abrirlo igual?` };
  return null;
}
import { desglose, VALOR } from './plata.js';

const DB_NAME = 'nanoblocks';
const DB_VERSION = 1;
let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('worlds')) db.createObjectStore('worlds', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('chunks')) {
        const s = db.createObjectStore('chunks', { keyPath: 'k' });
        s.createIndex('world', 'world');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(store, mode, fn) {
  return openDB().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    let out;
    Promise.resolve(fn(s, t)).then((v) => { out = v; });
    t.oncomplete = () => resolve(out);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

function reqP(r) {
  return new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
}

// Migraciones: cuando cambie SAVE_FORMAT, agregar aquí el paso desde la versión anterior.
const MIGRATIONS = {
  // 1 -> 2: aparecen las entidades de bloque (horno, cofre, mesa, puerta). Los mundos viejos no tienen ninguna.
  1: (meta) => ({ ...meta, format: 2 }),
  // 2 -> 3 (v11.10.3): la plata en denominaciones de verdad. Cada colón viejo ya es la moneda de 500; los billetes de 50 y 100 de la
  // v11.10 (386, 387) y todo lo demás se reacomodan en la menor cantidad de piezas, en la mochila y en la mochila de cuero
  2: (meta) => {
    const sobra = {}; // lo que no cabe va a la billetera del inventario (la 3→4 la ordena): nunca se bota plata
    const reacomodar = (slots) => {
      if (!Array.isArray(slots)) return slots;
      const viejo = { 360: 500, 385: 10000, 386: 25000, 387: 50000 };
      let total = 0; const libres = [];
      slots.forEach((s, i) => { if (s && viejo[s.id]) { total += s.count * viejo[s.id]; slots[i] = null; libres.push(i); } });
      for (const [id, n] of desglose(total)) { const i = libres.length ? libres.shift() : slots.indexOf(null); if (i < 0) { sobra[id] = (sobra[id] || 0) + n; continue; } slots[i] = { id, count: n }; }
      return slots;
    };
    if (meta.inventory && meta.inventory.slots) reacomodar(meta.inventory.slots);
    if (meta.mochila) reacomodar(meta.mochila);
    if (Object.keys(sobra).length) { meta.inventory ||= { slots: [] }; const b = (meta.inventory.billetera ||= {}); for (const [id, n] of Object.entries(sobra)) b[id] = (b[id] || 0) + n; }
    return { ...meta, format: 3 };
  },
  // 3 -> 4 (v11.10.5): la billetera. La plata sale de las casillas del inventario a `inventory.billetera` (id → cuántas), y los
  // billetes viejos de 25 000 y 50 000 se cambian por piezas de verdad. La plata guardada en cofres y en la mochila queda como objeto
  3: (meta) => {
    const inv = meta.inventory;
    if (inv && Array.isArray(inv.slots)) {
      let total = 0;
      for (const [id, n] of Object.entries(inv.billetera || {})) total += (VALOR[id] || 0) * n;
      inv.slots.forEach((s, i) => { if (s && VALOR[s.id]) { total += s.count * VALOR[s.id]; inv.slots[i] = null; } });
      inv.billetera = Object.fromEntries(desglose(total));
    }
    return { ...meta, format: 4 };
  },
  // 4 -> 5 (v11.10.7): la alcancía de los chanchitos (meta.chanchito, 27 casillas) y los topes de la paga por peligro de la
  // v11.10.6 (meta.premioJefe, meta.premioDia). Los mundos viejos arrancan con la alcancía vacía y sin jefes cobrados
  // 5 -> 6 (v11.13.0): el tipo de mundo; los de antes son «normal»
  5: (meta) => ({ ...meta, tipoMundo: meta.tipoMundo || 'normal', format: 6 }),
  // 6 -> 7 (v12.10.0, F0 del multijugador): las fichas de las demás personas (meta.jugadores, por llave) y la época del mundo
  // (sube al importar). Los mundos viejos no tienen fichas: arrancan vacíos y se juegan igual
  6: (meta) => ({ ...meta, jugadores: meta.jugadores && typeof meta.jugadores === 'object' && !Array.isArray(meta.jugadores) ? meta.jugadores : {}, epoca: Number.isInteger(meta.epoca) && meta.epoca > 0 ? meta.epoca : 1, format: 7 }),
  // 7 -> 8 (v12.16.1): el diario del Redondel del Rey (meta.reyArena): lo que se cambió para la pelea final y se deshace al terminar
  7: (meta) => ({ ...meta, reyArena: null, format: 8 }),
  // 8 -> 9 (v12.16.5): las mañas de jefe (meta.manasJefe) y los premios del Rey por persona (meta.reyPremio); los mundos viejos arrancan sin ninguna
  8: (meta) => ({ ...meta, manasJefe: meta.manasJefe || {}, reyPremio: meta.reyPremio || null, format: 9 }),
  4: (meta) => ({ ...meta, chanchito: Array.isArray(meta.chanchito) ? meta.chanchito : new Array(27).fill(null), premioJefe: meta.premioJefe || {}, premioDia: meta.premioDia || {}, format: 5 }),
};

export function migrate(meta) {
  let m = meta;
  if (!m.format) m.format = 1;
  while (m.format < SAVE_FORMAT) {
    const step = MIGRATIONS[m.format];
    if (!step) throw new Error(`No hay migración desde el formato ${m.format}`);
    m = step(m);
  }
  return m;
}

export async function listWorlds() {
  const all = await tx('worlds', 'readonly', (s) => reqP(s.getAll()));
  return (all || []).sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
}

export async function loadWorld(id) {
  const meta = await tx('worlds', 'readonly', (s) => reqP(s.get(id)));
  if (!meta) return null;
  const chunks = await tx('chunks', 'readonly', (s) => reqP(s.index('world').getAll(id)));
  const mods = new Map();
  const be = new Map();
  for (const c of chunks || []) {
    mods.set(c.chunk, new Map(c.mods));
    if (c.be && c.be.length) be.set(c.chunk, new Map(c.be));
  }
  return { meta: migrate(meta), mods, be };
}

// v12.10.0 (F0): UNA sola transacción para el registro del mundo y sus chunks. Si la pestaña se cierra a mitad, no queda la ficha
// nueva con el cofre viejo (ni al revés): o entra todo o no entra nada. Resuelve solo cuando la transacción terminó (oncomplete)
export async function saveWorld(meta, mods, dirtyKeys, be = new Map()) {
  meta.format = SAVE_FORMAT;
  meta.gameVersion = GAME_VERSION;
  meta.minVersion = MIN_VERSION; // v12.4.6
  meta.lastPlayed = Date.now();
  const keys = dirtyKeys ? [...dirtyKeys] : [...mods.keys()];
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const t = db.transaction(['worlds', 'chunks'], 'readwrite');
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error || new Error('Se canceló el guardado'));
    try {
      const cs = t.objectStore('chunks');
      for (const k of keys) {
        const m = mods.get(k);
        if (!m) continue;
        const b = be.get(k);
        cs.put({ k: `${meta.id}|${k}`, world: meta.id, chunk: k, mods: [...m.entries()], be: b ? [...b.entries()] : [] });
      }
      t.objectStore('worlds').put(meta); // el registro va en la misma transacción
    } catch (e) { try { t.abort(); } catch { /* ya cerrada */ } reject(e); }
  });
}

export async function deleteWorld(id) {
  const keys = await tx('chunks', 'readonly', (s) => reqP(s.index('world').getAllKeys(id)));
  const db = await openDB();
  await new Promise((resolve, reject) => { // v12.10.0: una transacción (antes borraba el registro y luego los chunks)
    const t = db.transaction(['worlds', 'chunks'], 'readwrite');
    t.oncomplete = () => resolve(); t.onerror = () => reject(t.error); t.onabort = () => reject(t.error);
    for (const k of keys || []) t.objectStore('chunks').delete(k);
    t.objectStore('worlds').delete(id);
  });
}

// un mundo como objeto para un archivo (lo usan exportar uno y el respaldo de todos)
export async function payloadMundo(id) {
  const data = await loadWorld(id);
  if (!data) return null;
  return {
    app: GAME_NAME,
    format: SAVE_FORMAT,
    gameVersion: GAME_VERSION,
    meta: data.meta,
    chunks: [...data.mods.entries()].map(([k, m]) => [k, [...m.entries()]]),
    be: [...data.be.entries()].map(([k, m]) => [k, [...m.entries()]]),
  };
}
function bajar(obj, nombre) {
  const blob = obj instanceof Blob ? obj : new Blob([JSON.stringify(obj)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
// Exporta un mundo a un archivo JSON que se puede pasar a otra computadora.
export async function exportWorld(id) {
  const p = await payloadMundo(id);
  if (p) bajar(p, `${(p.meta.name || 'mundo').replace(/[^\w\- ]+/g, '')}.nanoblocks.json`);
}
// v12.8.5 (urgente, «Que los mundos no se pierdan»): TODOS los mundos en un solo archivo. Se vuelve a cargar con «Importar mundo»
// (importWorld reconoce el respaldo y pasa cada mundo por validarMundo). Devuelve cuántos mundos entraron
// v12.10.0: con tope de tamaño. Un solo JSON gigante podía fallar («Invalid string length») o pasar de lo que importWorld acepta; ahora
// se parte en lotes de menos de TOPE_LOTE, cada uno un archivo aparte. Un mundo que por sí solo pasa de TOPE_MUNDO se salta y se avisa.
// Devuelve { n, archivos, saltados }
export const TOPE_LOTE = 48 * 2 ** 20; // por archivo de respaldo (bajo el tope de 64 MB de importar)
export const TOPE_MUNDO = 60 * 2 ** 20; // un mundo más grande no entra en ningún archivo que se pueda volver a abrir
export async function descargarRespaldo() {
  const L = await listWorlds(), saltados = [], lotes = [[]];
  let peso = 0, n = 0;
  for (const w of L) {
    let texto;
    try { const p = await payloadMundo(w.id); if (!p) continue; texto = JSON.stringify(p); } catch (e) { saltados.push({ nombre: w.name || w.id, motivo: e && e.message ? e.message : 'no se pudo leer' }); continue; }
    if (texto.length > TOPE_MUNDO) { saltados.push({ nombre: w.name || w.id, motivo: 'es demasiado grande para el respaldo (use «Exportar» de ese mundo)' }); continue; }
    if (peso + texto.length > TOPE_LOTE && lotes[lotes.length - 1].length) { lotes.push([]); peso = 0; }
    lotes[lotes.length - 1].push(texto); peso += texto.length; n++;
  }
  const hoy = new Date().toISOString().slice(0, 10), validos = lotes.filter((l) => l.length);
  validos.forEach((l, i) => {
    const cabeza = `{"app":${JSON.stringify(GAME_NAME)},"respaldo":true,"gameVersion":${JSON.stringify(GAME_VERSION)},"fecha":${Date.now()},"mundos":[`;
    bajar(new Blob([cabeza, l.join(','), ']}'], { type: 'application/json' }), `nanoblocks-respaldo-${hoy}${validos.length > 1 ? `-parte${i + 1}de${validos.length}` : ''}.json`);
  });
  if (n) try { localStorage.setItem('nanoblocks.respaldo', JSON.stringify({ t: Date.now(), n })); localStorage.setItem('nanoblocks.sinRespaldo', '0'); } catch { /* sin almacenamiento: igual se bajó */ }
  return { n, archivos: validos.length, saltados };
}

export async function importWorld(file) {
  // v12.4.3 (seguridad, C4): con tope de tamaño, y todo lo que trae el archivo pasa por validarMundo (importar.js) antes de guardarse
  const { validarMundo, TOPE_ARCHIVO } = await import('./importar.js'); // se carga solo al importar (y no engorda el arranque)
  if (file.size > TOPE_ARCHIVO * 4) throw new Error('El archivo es demasiado grande para ser un mundo o un respaldo de NanoBlocks (más de 256 MB)');
  const text = await file.text();
  let payload;
  try { payload = JSON.parse(text); } catch { throw new Error('Este archivo no es un mundo de NanoBlocks'); }
  // v12.8.5: un respaldo trae varios mundos; cada uno entra como si fuera un archivo aparte (con su validarMundo)
  if (payload && payload.app === GAME_NAME && payload.respaldo && Array.isArray(payload.mundos)) {
    // v12.10.0: los errores ya no se tragan: cada mundo que no entra queda en `fallidos` con su motivo (cada uno entra entero o no entra)
    const hechos = [], fallidos = [];
    for (const m of payload.mundos.slice(0, 200)) {
      try { hechos.push(await importarUno(m, validarMundo, false)); } catch (e) { fallidos.push({ nombre: m && m.meta && typeof m.meta.name === 'string' ? m.meta.name.slice(0, 40) : 'sin nombre', motivo: e && e.message ? e.message : 'error desconocido' }); }
    }
    if (!hechos.length) throw new Error(`El respaldo no traía ningún mundo que se pudiera abrir${fallidos.length ? `: ${fallidos.map((f) => `${f.nombre} (${f.motivo})`).join('; ').slice(0, 300)}` : ''}`);
    return { hechos, fallidos };
  }
  if (file.size > TOPE_ARCHIVO) throw new Error('El archivo es demasiado grande para ser un mundo de NanoBlocks (más de 64 MB)');
  return importarUno(payload, validarMundo);
}
async function importarUno(payload, validarMundo, marcar = true) {
  if (!payload || payload.app !== GAME_NAME || !payload.meta) throw new Error('Este archivo no es un mundo de NanoBlocks');
  if (payload.meta && typeof payload.meta === 'object') { const c = compatibilidad({ minVersion: payload.meta.minVersion === undefined ? undefined : String(payload.meta.minVersion).slice(0, 20), format: payload.format }); if (c && c.bloquea) throw new Error(c.bloquea); } // v12.4.6
  const v = validarMundo(payload);
  const formato = Number.isInteger(payload.format) && payload.format > 0 && payload.format <= SAVE_FORMAT ? payload.format : v.meta.format;
  const meta = migrate({ ...v.meta, format: formato });
  meta.id = `w${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
  meta.name = marcar ? `${meta.name || 'Mundo'} (importado)` : meta.name || 'Mundo'; // v12.8.5: del respaldo vuelven con su nombre
  const mods = new Map(v.chunks.map(([k, entries]) => [k, new Map(entries)]));
  const be = new Map(v.be.map(([k, entries]) => [k, new Map(entries)]));
  for (const k of be.keys()) if (!mods.has(k)) mods.set(k, new Map());
  meta.epoca = (Number.isInteger(meta.epoca) ? meta.epoca : 1) + 1; // v12.10.0: una copia importada es otra línea de tiempo (F1 la usa con las fichas)
  try { await saveWorld(meta, mods, null, be); } catch (e) { // saveWorld es una sola transacción: no queda a medias; por si acaso se limpia
    try { await deleteWorld(meta.id); } catch { /* nada que borrar */ }
    throw new Error(`No se pudo guardar el mundo importado: ${e && e.message ? e.message : 'error de almacenamiento'}`);
  }
  return meta;
}

export function newWorldId() {
  return `w${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

// Ajustes del jugador (por navegador).
const SETTINGS_KEY = 'nanoblocks.settings';
export const DEFAULT_SETTINGS = { correrToggle: true, avisoRespaldo: true, calidadAuto: true, renderDistance: 6, fov: 75, sensitivity: 1, volume: 0.6, music: 0.5, hostiles: true, viewBobbing: true, subtitulos: false, pausaPaneles: true, ordenInv: 'categoria', luz: 50, fullscreen: false, renderScale: 1, farDistance: 768, calidad: 'medio', video: { tono: true, niebla: true, cielo: true, bruma: false }, perf: false, settingsVersion: 3 };
export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const saved = raw ? JSON.parse(raw) : {};
    // ajustes viejos: la pantalla completa venía activada sola; ahora es opcional
    if ((saved.settingsVersion || 1) < 2) { saved.fullscreen = false; saved.settingsVersion = 2; }
    // v11.11.0: el brillo viejo (filtro, 0 a 1) pasa al deslizador nuevo (0 a 100, 50 = normal)
    if (saved.luz === undefined && saved.brillo !== undefined) saved.luz = Math.round(50 + Math.max(0, Math.min(1, saved.brillo)) * 50);
    delete saved.brillo;
    // v12.0.1: el horizonte pasa a cuatro niveles (apagado, cerca, lejos, muy lejos): el valor viejo va al más cercano
    if (saved.farDistance !== undefined && ![0, 768, 1536, 3072].includes(saved.farDistance)) saved.farDistance = [0, 768, 1536, 3072].reduce((a, b) => (Math.abs(b - saved.farDistance) < Math.abs(a - saved.farDistance) ? b : a));
    // v12.2.1 (decisión de nanoyackson): la calidad por defecto es Medio. El «Bajo» de antes era el valor de fábrica, no una elección: pasa a
    // Medio una sola vez. Lo que el jugador escoja a mano desde ahora queda marcado (calidadElegida) y se respeta
    if ((saved.settingsVersion || 1) < 3) {
      if (!saved.calidadElegida && (saved.calidad === undefined || saved.calidad === 'bajo')) saved.calidad = 'medio';
      saved.settingsVersion = 3;
    }
    return { ...DEFAULT_SETTINGS, ...saved };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}
export function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* sin almacenamiento */ }
}
