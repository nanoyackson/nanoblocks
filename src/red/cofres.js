// Cofres compartidos (v12.15.0, cierre del multijugador). Funciones PURAS (sin DOM ni red; se prueban en Node: tools/revisar-cofres.mjs).
// Reglas: el cofre vive SOLO en el mundo del anfitrión; a la vez lo tiene abierto UNA persona (el «candado»). Quien lo abre recibe una copia;
// al cerrar, el anfitrión NO se fía de lo que el invitado dice que quedó: lo calcula con lo que pasó en la mochila de esa persona
// (lo que ganó sale del cofre; lo que perdió puede haber entrado). Así no se duplica nada: lo peor que pasa es que algo se pierda.
import { VALOR } from '../plata.js';
import { resumen } from './ficha.js';
import { ITEMS, maxStack } from '../blocks.js';
import { idValido } from '../importar.js';

export const COFRE_MAX = 54; // casillas (cofre 27, baúl grande 54)
export const COFRE_TIEMPO_MAX = 10 * 60 * 1000; // un candado se suelta solo a los 10 minutos

// cuántos hay de cada ítem (todas las pilas, también la plata en casillas)
export function contar(slots) {
  const n = new Map();
  for (const s of slots) if (s) n.set(s.id, (n.get(s.id) || 0) + s.count);
  return n;
}
export function contarInv(inv) { return contar([...inv.slots, ...inv.armor]); }

// lo que el invitado puede «ganar» en su mochila mientras tiene el cofre abierto: solo lo que hay en el cofre
export function permisoDe(slots) {
  const r = resumen({ slots, armor: [], billetera: {} });
  return { n: r.n, col: r.col, mejora: r.mejora, filo: r.filo };
}
// v12.15.5 (M1): lo más alto que pueden valer mejora/filo en lo que el invitado deja: lo que ya había en el cofre o en su mochila al abrir
export function topeProps(slots, inv) {
  const a = resumen({ slots, armor: [], billetera: {} }), b = inv ? resumen(inv) : { mejora: 0, filo: 0 };
  return { mejora: Math.max(a.mejora, b.mejora), filo: Math.max(a.filo, b.filo) };
}
// v12.15.5 (M1): una pila que dice el invitado, sin creerle las propiedades: mejora/filo topadas, dur ≤ durabilidad, cruda/dia solo si ya las traía una pila igual del cofre
function sanea(s, antes, tope) {
  const o = { id: s.id, count: s.count }, d = ITEMS[s.id], ref = antes.find((p) => p && p.id === s.id);
  if (s.dur !== undefined && d && d.durability) o.dur = Math.min(s.dur, d.durability);
  if (s.mejora > 0 && tope.mejora > 0) o.mejora = Math.min(s.mejora, tope.mejora);
  if (s.filo > 0 && tope.filo > 0) o.filo = Math.min(s.filo, tope.filo);
  if (ref && ref.cruda && s.cruda) o.cruda = true;
  if (ref && ref.dia !== undefined && s.dia !== undefined) o.dia = ref.dia;
  return o;
}
// v12.15.5 (M3): ¿lo que dice el invitado existe en el catálogo y cabe en una pila? (mundo creativo, donde no hay mochila que cuidar)
export function cofreOk(dice, largo) {
  if (!Array.isArray(dice) || dice.length !== largo) return false;
  return dice.every((s) => {
    if (s === null) return true;
    if (!s || !idValido(s.id) || !(s.count >= 1) || s.count > maxStack(s.id)) return false;
    if (s.dur !== undefined && !(ITEMS[s.id] && ITEMS[s.id].durability && s.dur <= ITEMS[s.id].durability)) return false;
    return true;
  });
}
// ¿Esta persona puede abrir? libre, o ya es suya
export const libre = (candado, quien) => !candado || candado.quien === quien;

// Lo que queda en el cofre al cerrar: parte de lo que el invitado dice (para conservar el orden y las propiedades de las pilas) y lo
// recorta a lo que de verdad pudo pasar. quedo = lo que el anfitrión tenía; abre/ahora = conteo de la mochila al abrir y ahora; dice = lo que dice el invitado.
export function cierre(antes, dice, abre, ahora, props = { mejora: 0, filo: 0 }) {
  const A = contar(antes), D = dice ? contar(dice) : new Map(), tope = new Map();
  const ids = new Set([...A.keys(), ...D.keys()]);
  for (const id of ids) {
    const ganado = Math.max(0, (ahora.get(id) || 0) - (abre.get(id) || 0));
    const perdido = Math.max(0, (abre.get(id) || 0) - (ahora.get(id) || 0));
    const base = (A.get(id) || 0) - Math.min(ganado, A.get(id) || 0);
    const entro = Math.min(Math.max(0, (D.get(id) || 0) - (A.get(id) || 0)), perdido); // lo que entró no puede pasar de lo que perdió la mochila
    tope.set(id, base + entro);
  }
  // si no hay lo que dice el invitado (se fue sin cerrar), se parte del cofre tal como estaba
  const fuente = dice || antes;
  const sale = new Array(antes.length).fill(null), usado = new Map();
  fuente.forEach((s, i) => {
    if (!s || i >= sale.length) return;
    const cabe = (tope.get(s.id) || 0) - (usado.get(s.id) || 0);
    if (cabe <= 0) return;
    const c = Math.min(cabe, s.count);
    sale[i] = sanea({ ...s, count: c }, antes, props);
    usado.set(s.id, (usado.get(s.id) || 0) + c);
  });
  // lo que debía quedar y no cupo en el orden del invitado (por ejemplo, si no cerró): se devuelve a su sitio de antes
  if (!dice) return sale;
  for (const [id, t] of tope) {
    let falta = t - (usado.get(id) || 0);
    if (falta <= 0) continue;
    for (let i = 0; i < antes.length && falta > 0; i++) {
      const o = antes[i];
      if (!o || o.id !== id || sale[i]) continue;
      const c = Math.min(falta, o.count);
      sale[i] = c === o.count ? { ...o } : { ...o, count: c };
      falta -= c;
    }
  }
  return sale;
}
export const esPlata = (id) => !!VALOR[id];
