// Categorías de los objetos, para ordenar el inventario y repartir lo de la casa entre los cofres (v11.8).
// Salen de los datos de cada ítem (herramienta, armadura, comida) y, si no, del comienzo de las palabras de su clave o su nombre
// (así «flores» no cae en minerales por llevar «ore» adentro). El orden de la lista es el orden en que
// quedan acomodados.
import { getDef, isBlockId, BLOCKS } from './blocks.js';

export const CATEGORIAS = [
  { id: 'herramientas', nombre: 'Herramientas y armas', icono: '⚒' },
  { id: 'armadura', nombre: 'Armadura', icono: '🛡' },
  { id: 'comida', nombre: 'Comida', icono: '🍖' },
  { id: 'minerales', nombre: 'Minerales', icono: '⛏' },
  { id: 'madera', nombre: 'Madera', icono: '🪵' },
  { id: 'tierra', nombre: 'Tierra y piedra', icono: '🪨' },
  { id: 'plantas', nombre: 'Plantas y semillas', icono: '🌱' },
  { id: 'construccion', nombre: 'Construcción', icono: '🧱' },
  { id: 'varios', nombre: 'Varios', icono: '📦' },
];
const ORDEN = Object.fromEntries(CATEGORIAS.map((c, i) => [c.id, i]));

const MINERAL = /(^|\s)(ore|mena|ingot|lingote|pepita|nugget|diamond|diamante|coal|carbon|carbón|gold|oro|iron|hierro|jade|esmeralda|cobre|copper|cuarzo|obsidian|azufre|esencia|perla)/;
const MADERA = /(^|\s)(log|tronco|plank|tabla|madera|stick|palo|bamboo|bambu|bambú|wood)/;
const TIERRA = /(^|\s)(dirt|tierra|stone|piedra|cobble|sand|arena|gravel|grava|clay|barro|arcilla|ceniza|basalt|basalto|granit|andesit|diorit|toba|lodo|roca)/;
const PLANTA = /(^|\s)(seed|semilla|sapling|retoño|flor|flower|leaves|hoja|grass|zacate|pasto|cane|caña|cana|helecho|hongo|mushroom|cactus|liana|vine|bejuco|planta|maiz|maíz|frijol|cafe|café|pina|piña|banano|platano|plátano)/;
const cache = new Map();

export function categoria(id) {
  if (cache.has(id)) return cache.get(id);
  const d = getDef(id) || {}, k = `${(d.key || '').replace(/_/g, ' ')} ${(d.name || '').toLowerCase()}`, bloque = isBlockId(id);
  let c = 'varios';
  if (!bloque && (d.armor || d.armorSlot !== undefined)) c = 'armadura';
  else if (!bloque && (d.tool || d.damage || d.machete || d.bow)) c = 'herramientas'; // en un bloque, «tool» es con qué se pica, no lo que es
  else if (d.food || d.drink || d.comida) c = 'comida';
  else if (MINERAL.test(k)) c = 'minerales';
  else if (MADERA.test(k)) c = 'madera';
  else if (PLANTA.test(k) || (isBlockId(id) && BLOCKS[id] && (BLOCKS[id].crop || BLOCKS[id].render === 'cross'))) c = 'plantas';
  else if (TIERRA.test(k)) c = 'tierra';
  else if (isBlockId(id)) c = 'construccion';
  cache.set(id, c);
  return c;
}
export const ordenCategoria = (id) => ORDEN[categoria(id)];
export const nombreCategoria = (c) => (CATEGORIAS.find((x) => x.id === c) || CATEGORIAS[CATEGORIAS.length - 1]).nombre;
export const iconoCategoria = (c) => (CATEGORIAS.find((x) => x.id === c) || CATEGORIAS[CATEGORIAS.length - 1]).icono;
// el nombre de un cofre dice qué guarda si menciona una categoría («Minerales», «la comida», «herramientas»…)
export function categoriaDeNombre(nombre) {
  const raiz = (w) => w.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/(es|s)$/, '');
  const del = new Set((nombre || '').toLowerCase().split(/[^a-záéíóúñü]+/).filter((w) => w.length > 3).map(raiz));
  if (!del.size) return null;
  for (const c of CATEGORIAS) if (c.nombre.toLowerCase().split(/\s+/).filter((w) => w.length > 3).some((w) => del.has(raiz(w)))) return c.id;
  return null;
}
