// v12.6.6: cómo se agarra cada cosa (pedido de nanoyackson: «la galleta la agarra rarísimo»). Antes todo lo plano salía del mismo tamaño
// que una espada (0.5) y agarrado en diagonal por la esquina, como un mango: la galleta tapaba media pantalla.
// - herramienta: herramientas y armas, por el mango (la punta de abajo a la izquierda del dibujo), cabeza adelante;
// - pequeno: comida, materiales, monedas y casi todo lo demás: chiquito, de frente, entre los dedos (por el borde de abajo);
// - plano: planos, papeles y libros: abiertos, inclinados hacia uno como para leerlos;
// - recipiente: baldes, botellas, tazas y bebidas: de pie, agarrados por la base;
// - bloque: los cubos, sobre la palma (como antes).
// Lo usan game.js (rebuildHand, primera persona) y avatar.js (heldMesh, tercera persona); tools/hoja-mano.js saca la hoja de contactos.
import { getDef, isBlockId } from './blocks.js';

const PLANO = /^plano_|libro|escritura|mapa|^hoja_|permiso|cartel|carta|receta|periodico|diario|cuaderno|papel|tiquete|boleto|postal|certificado|revista|pergamino/;
const RECIPIENTE = /bucket|balde|botella|jar|frasco|bidon|cantimplora|(^|_)olla|taza|vaso|tarro|pichel|termo|guacal|jicara|botijo|batea|tinaja|cafe|agua_|fresco|suero|alcohol|antivenom|caldo|sopa|leche|guaro|pipa|refresco|chicha|horchata|jarabe|pocion|pomada|repelente|aceite/;
const PEQUENO = new Set(['mechero', 'cucharon_zenaida', 'tablilla', 'venda', 'botiquin', 'senuelo']); // tienen durabilidad pero no son herramientas
const HERRAMIENTA = new Set(['jabalina']); // se agarra como lanza aunque no tenga «damage»
// v12.8.2 (decimoquinta revisión, punto 2): lo dudoso, a mano. La clave manda sobre las regex (que buscan texto suelto: «chicha» está
// en «chicharrón», «leche» en «tres leches»). Cada ítem nuevo entra por las regex: tools/revisar-agarre.mjs avisa si algo cambia
const EXPLICITO = {
  chicharron: 'pequeno', tres_leches: 'pequeno', collar_cuero: 'pequeno', // comida y cosas que no son recipientes
  sobre_marielos: 'plano', sobre_estampas: 'plano', foto_vela: 'plano', // papeles chicos
  martillo_tino: 'herramienta', catalejo_wilber: 'herramienta', cana_brava: 'herramienta', tranca: 'herramienta', bandera_circuito: 'herramienta',
  tabla_surf: 'grande', parapente: 'grande', papalote: 'grande', arco_cintas: 'grande', bomba_espalda: 'grande', // grandes, de frente
  escudo_madera: 'escudo', escudo_hierro: 'escudo', escudo_jade: 'escudo', escudo_concha: 'escudo', // al antebrazo
  sello_goma: 'pequeno',
};

export function tipoAgarre(id) {
  const d = getDef(id);
  if (!d) return 'pequeno';
  if (isBlockId(id)) return d.render === 'cross' ? 'pequeno' : d.render === 'torch' ? 'herramienta' : 'bloque';
  const k = d.key || '';
  if (EXPLICITO[k]) return EXPLICITO[k];
  if (PEQUENO.has(k)) return 'pequeno';
  if (HERRAMIENTA.has(k)) return 'herramienta';
  if (d.tool || d.damage || d.bow || d.rod || d.machete || d.thrust || (d.dur && !d.armor && !RECIPIENTE.test(k))) return 'herramienta';
  if (PLANO.test(k)) return 'plano';
  if (d.bucket || d.sip || d.drink || RECIPIENTE.test(k)) return 'recipiente';
  return 'pequeno';
}

// primera persona: el tamaño del ícono con grosor y la pose (posición y giro del grupo de la mano)
export const AGARRES = {
  herramienta: { tam: 0.5, p: [0.42, -0.34, -0.64], r: [0.05, -0.95, 0.12] },
  pequeno: { tam: 0.24, p: [0.33, -0.39, -0.6], r: [0.14, -0.22, 0.1] },
  plano: { tam: 0.36, p: [0.27, -0.38, -0.62], r: [-0.45, -0.3, 0.08] },
  recipiente: { tam: 0.28, p: [0.35, -0.42, -0.62], r: [0.02, -0.35, 0] },
  grande: { tam: 0.4, p: [0.36, -0.46, -0.68], r: [0.08, -0.3, 0.05] }, // v12.8.2: de frente, a la altura de la cadera
  escudo: { tam: 0.42, p: [0.4, -0.36, -0.58], r: [0.05, -1.2, 0.1] }, // v12.8.2: pegado al antebrazo, casi de canto
};
// tercera persona: el lado de la lámina en píxeles del muñeco (antes 11 para todo)
export const TAM_3P = { herramienta: 14, pequeno: 5.5, plano: 8, recipiente: 6.5, grande: 9, escudo: 9 };

// dónde agarra la mano (en el espacio del dibujo) y para dónde queda «arriba»: con el puño, el objeto sale por el lado del pulgar.
// pequeno y recipiente: por el borde de abajo, al centro (el recipiente, derecho); plano: por el borde de abajo, un poco a la izquierda
export function agarreDe(mesh, tipo) {
  const g = mesh.geometry;
  if (!g.boundingBox) g.computeBoundingBox();
  const b = g.boundingBox, w = b.max.x - b.min.x, h = b.max.y - b.min.y, cx = (b.min.x + b.max.x) / 2;
  // el punto queda un poco por debajo del borde: el objeto se apoya sobre los dedos y el puño no lo tapa
  if (tipo === 'recipiente') return { p: [cx, b.min.y - h * 0.04, 0], d: [0, 1, 0] }; // por la base (por el costado el puño lo tapaba)
  if (tipo === 'plano') return { p: [cx - w * 0.18, b.min.y + h * 0.1, 0], d: [0, 1, 0] };
  if (tipo === 'escudo') return { p: [cx, (b.min.y + b.max.y) / 2, 0], d: [0, 1, 0] }; // v12.8.2: por el medio (la correa)
  return { p: [cx, b.min.y - h * 0.06, 0], d: [0, 1, 0] };
}
