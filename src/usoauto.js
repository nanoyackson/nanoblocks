// v13.5.8 (PU-17): la línea de «para qué sirve» de un ítem: la escrita a mano (usoitems.js) o, si es ingrediente, las cosas que ayuda a fabricar (sale de las recetas).
// Sin dependencias del navegador: la usa fichaItem (comodidad.js) y la prueba tools/revisar-fichas.mjs.
import { USO } from './usoitems.js';
import { RECIPES, ingredients } from './recipes.js';
import { itemName } from './blocks.js';

let USADO = null;
function usadoEn() {
  if (USADO) return USADO;
  USADO = new Map();
  for (const r of RECIPES) for (const id of ingredients(r).keys()) {
    if (!USADO.has(id)) USADO.set(id, new Set());
    if (r.out[0] !== id) USADO.get(id).add(r.out[0]);
  }
  return USADO;
}
// null si no hay nada que decir
export function usoLinea(def) {
  if (!def) return null;
  if (USO[def.key]) return USO[def.key];
  const s = usadoEn().get(def.id);
  if (s && s.size) {
    const n = [...s].slice(0, 3).map((id) => itemName(id));
    return `Ingrediente: sirve para fabricar ${n.join(', ')}${s.size > 3 ? ' y más' : ''}`;
  }
  return null;
}
