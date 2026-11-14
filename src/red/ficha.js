// La ficha de cada persona invitada (v12.13.0, F3; ESPEC_PWA_MULTIJUGADOR §5): inventario, vida, hambre, posición y plata, guardada por
// llave en meta.jugadores del mundo del ANFITRIÓN, para que al volver recupere lo suyo. Funciones PURAS (sin DOM ni red): se prueban en
// Node (tools/revisar-red.mjs y tools/revisar-inventario-red.mjs).
//
// Cómo se cuida el inventario (decisión de diseño, con su límite dicho en claro): el juego del invitado maneja su mochila al instante
// (fabricar, comer, recoger…), así que el invitado manda «fotos» de su mochila y el anfitrión las acepta o no con estas reglas:
//   · la plata (colones) NUNCA puede subir; los ítems únicos (trofeos…) NUNCA pueden aparecer;
//   · lo demás solo puede crecer lo que explique una receta (con los ingredientes que bajaron) o lo que alcance en un PRESUPUESTO por
//     tiempo (cupo) que se repone poco a poco y sube un poco por cada bloque que el anfitrión vio romper;
//   · las mejoras (⭐) y el filo no pueden subir; nada pasa de su pila ni de su durabilidad.
// Si no cuadra, el anfitrión no la guarda y le manda al invitado su ficha verdadera (que reemplaza la de él). LÍMITE CONOCIDO: un invitado
// puede ganar de más, muy despacio, hasta el ritmo del cupo (ítems comunes); no puede inventarse plata ni ítems únicos.
import { ITEMS, maxStack, BLOCK_BY_KEY as K } from '../blocks.js';
import { esUnico, SLOTS } from '../inventory.js';
import { VALOR } from '../plata.js';
import { RECIPES, ingredients } from '../recipes.js';
import { idValido } from '../importar.js';

export const LLAVE = /^[0-9A-Za-z]{22}$/;
export const MAX_FICHAS = 12;
export const CUPO_INI = 60, CUPO_MAX = 300, CUPO_RATE = 6, CUPO_POR_BLOQUE = 4; // unidades de ítem: al entrar, tope, por segundo, por bloque roto
const TORTILLA = 270;
const VIDA_MAX = 40;

const vacio = () => ({ slots: new Array(SLOTS).fill(null), selected: 0, armor: [null, null, null, null, null], billetera: {} });
// el equipo con el que empieza quien entra por primera vez (igual que bolsitoInicio de supervivencia.js: 4 tortillas y 6 antorchas)
export function kitInicial() {
  const inv = vacio();
  inv.slots[0] = { id: TORTILLA, count: 4 };
  inv.slots[1] = { id: K.torch, count: 6 };
  return inv;
}
export const vitalInicial = () => ({ vida: 20, hambre: 20, agua: 20, aire: 10, volando: false });

export function fichaNueva(nombre, cuerpo, ahora, conInv = true) {
  return { v: 1, nombre, nombres: [nombre], desde: ahora, ultimaVez: ahora, rev: 0, estado: 'activo', bloqueado: false, inv: conInv ? kitInicial() : null, vital: vitalInicial(), pos: null, cuerpo };
}

// ¿la mochila trae cosas que existen, en cantidades posibles? (lo estructural ya lo cuidó validar.js; aquí lo que depende del catálogo)
export function invOk(inv) {
  if (!inv || !Array.isArray(inv.slots) || inv.slots.length !== SLOTS || !Array.isArray(inv.armor) || inv.armor.length !== 5) return false;
  const pila = (s) => {
    if (s === null) return true;
    if (!idValido(s.id) || s.count < 1 || s.count > maxStack(s.id)) return false;
    const d = ITEMS[s.id];
    if (s.dur !== undefined && !(d && d.durability && s.dur <= d.durability)) return false;
    return true;
  };
  if (!inv.slots.every(pila) || !inv.armor.every(pila)) return false;
  for (const [k, n] of Object.entries(inv.billetera)) if (!VALOR[k] || n < 0) return false;
  return inv.selected >= 0 && inv.selected <= 8;
}

// el resumen que se compara: cuántos de cada ítem (sin la plata), cuántos colones y las mejoras más altas
export function resumen(inv) {
  const n = new Map();
  let col = 0, mejora = 0, filo = 0;
  for (const [id, c] of Object.entries(inv.billetera)) col += (VALOR[id] || 0) * c;
  const suma = (s) => {
    if (!s) return;
    if (VALOR[s.id]) { col += VALOR[s.id] * s.count; return; }
    n.set(s.id, (n.get(s.id) || 0) + s.count);
    if (s.mejora > mejora) mejora = s.mejora;
    if (s.filo > filo) filo = s.filo;
  };
  inv.slots.forEach(suma); inv.armor.forEach(suma);
  return { n, col, mejora, filo };
}
export const coloresDe = (inv) => resumen(inv).col;

export const cupoNuevo = () => ({ n: CUPO_INI });
export const recargar = (cupo, dtSeg) => { cupo.n = Math.min(CUPO_MAX, cupo.n + Math.max(0, Math.min(dtSeg, 60)) * CUPO_RATE); };
export const creditoBloque = (cupo) => { cupo.n = Math.min(CUPO_MAX, cupo.n + CUPO_POR_BLOQUE); };
// v12.14.0 (F4): lo que soltó una criatura que mató esta persona (el anfitrión lo reparte): explica lo que sube en su mochila
export const creditoBotin = (cupo, unidades) => { cupo.n = Math.min(CUPO_MAX, cupo.n + Math.max(0, unidades)); };

// ¿pudo pasar de `antes` a `ahora` sin inventar nada? No toca el cupo: devuelve { ok, motivo, gasto } y quien llama lo descuenta.
// v12.15.0: `permiso` (opcional) = lo que hay en el cofre que esa persona tiene abierto: puede subir hasta eso (plata, mejoras, ítems) y se va gastando.
export function cambioOk(antes, ahora, cupo, permiso = null) {
  const A = resumen(antes), B = resumen(ahora);
  const pCol = permiso ? permiso.col : 0;
  if (B.col > A.col + pCol) return { ok: false, motivo: 'plata' };
  if (B.mejora > Math.max(A.mejora, permiso ? permiso.mejora : 0) || B.filo > Math.max(A.filo, permiso ? permiso.filo : 0)) return { ok: false, motivo: 'extra' };
  const bajas = new Map(); // lo que bajó: sirve de ingredientes para explicar lo que subió
  const ids = new Set([...A.n.keys(), ...B.n.keys()]);
  const subidas = [];
  for (const id of ids) {
    const d = (B.n.get(id) || 0) - (A.n.get(id) || 0);
    if (d < 0) bajas.set(id, -d); else if (d > 0) { if (esUnico(id) && !(permiso && permiso.n.get(id) >= d)) return { ok: false, motivo: 'unico' }; subidas.push([id, d]); }
  }
  let gasto = 0;
  const usos = new Map();
  for (const [id, d] of subidas) {
    let falta = d;
    for (const rec of RECIPES) {
      if (falta <= 0) break;
      if (rec.cook || rec.out[0] !== id) continue;
      const ing = ingredients(rec);
      const veces = Math.ceil(falta / rec.out[1]);
      let cabe = veces;
      for (const [iid, c] of ing) cabe = Math.min(cabe, Math.floor((bajas.get(iid) || 0) / c));
      if (cabe <= 0) continue;
      for (const [iid, c] of ing) bajas.set(iid, (bajas.get(iid) || 0) - cabe * c);
      falta -= cabe * rec.out[1];
    }
    if (falta > 0 && permiso) { const p = Math.min(falta, permiso.n.get(id) || 0); falta -= p; if (p) usos.set(id, p); }
    if (falta > 0) gasto += falta;
  }
  if (gasto > cupo.n) return { ok: false, motivo: 'cupo', gasto };
  if (permiso) { // lo que se usó del permiso ya no se puede volver a usar
    for (const [id, p] of usos) permiso.n.set(id, permiso.n.get(id) - p);
    permiso.col = Math.max(0, permiso.col - Math.max(0, B.col - A.col));
  }
  return { ok: true, gasto };
}

// las constantes vitales que sube el invitado: solo rangos (él las simula; el anfitrión las guarda para cuando vuelva)
export function vitalOk(v, puedeVolar) {
  if (!v || !Number.isFinite(v.vida) || !Number.isFinite(v.hambre) || !Number.isFinite(v.agua) || !Number.isFinite(v.aire)) return null;
  return {
    vida: Math.min(VIDA_MAX, Math.max(0, v.vida)), hambre: Math.min(20, Math.max(0, v.hambre)), agua: Math.min(20, Math.max(0, v.agua)),
    aire: Math.min(1000, Math.max(0, v.aire)), volando: !!(v.volando && puedeVolar),
  };
}

// una copia de la ficha lista para guardar y para mandar: solo lo que se conoce
export const copiaInv = (inv) => JSON.parse(JSON.stringify(inv));
