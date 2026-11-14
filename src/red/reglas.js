// Qué bloques se pueden poner y romper por la red (v12.12.0, F2). Funciones PURAS sobre el registro de bloques: las usa el anfitrión
// para decidir (nunca se fía de lo que dice el invitado) y se prueban en Node. En F2 solo viajan bloques «simples»: lo que guarda
// contenido o estado propio (cofres, hornos, puertas, camas, barriles, portales) llega con F3, cuando el anfitrión maneja el inventario.
import { BLOCKS, FLUID, SOLID, BLOCK_BY_KEY as K, AIR, isBlockId } from '../blocks.js';

const existe = (id) => Number.isInteger(id) && isBlockId(id) && !!BLOCKS[id];

// ¿es un bloque «de red» (sin contenido ni estado propio)?
export function esSimple(id) {
  if (!existe(id) || id === AIR) return false;
  const b = BLOCKS[id];
  return !(b.hidden || b.station || b.door || b.bed || b.barril || b.render === 'model' || b.hardness < 0 || b.be);
}
export const puedePoner = (id) => esSimple(id) && !FLUID[id];
export const puedeRomper = (id) => esSimple(id) && !FLUID[id]; // los fluidos no se «rompen»
// ¿se puede poner algo donde hoy hay `actual`? aire, fluido o planta; o completar una losa con su bloque entero
export function esReemplazable(actual, id) {
  if (!existe(actual)) return false;
  if (actual === AIR || FLUID[actual] || BLOCKS[actual].render === 'cross') return true;
  const b = BLOCKS[actual];
  return !!(b.slab && b.full && K[b.full] === id);
}
// el soporte que pide el bloque nuevo (planta sobre tierra, antorcha sobre algo sólido)
export function apoyoOk(id, debajo) {
  const b = BLOCKS[id];
  if (!b) return false;
  if (b.needsSupport && !b.needsSupport.includes(debajo)) return false;
  if (b.needsSolidBelow && !SOLID[debajo]) return false;
  return true;
}
