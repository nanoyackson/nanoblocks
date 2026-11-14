// Logros: íconos por tema y el catálogo (los fijos salen de logros-lista.js, que arma tools/lista-logros.mjs).
import { LOGROS } from './logros-lista.js';
import { SKILLS } from './habilidades.js';
import { NOMBRES_MINI } from './armas2.js';
import { NOMBRES_HISTORIAS } from './misiones.js';

export const ACH_ICONS = [
  [/habilidad|todero/, '🎖️'], [/vencer|jefe|arpia|senor|parry|combo|critico|tulevieja|cadejos|segua|llorona/, '⚔️'], [/final|leyenda|patrimonio|explorador|nivel|regiones/, '⭐'],
  [/volcan|irazu|arenal|turrialba|poas|inframundo|lava|azufre/, '🌋'], [/cielo|portal|nube/, '☁️'], [/tirolesa|canopy/, '🪢'],
  [/parque|braulio|carara|amistad|monteverde|corcovado|tortuguero|cahuita|tenorio|palo_verde|ballena|coco|guanacaste|selva/, '🌿'],
  [/bus|carro|carretera|llant|hueco|charco|peaje|tren/, '🚗'], [/casa|lote|bono|tramite|cama|siesta/, '🏠'],
  [/cafe|casado|guaro|chocolate|olla|comida|copo|churchill|pipa|tamal|viaje|mango/, '🍽️'], [/caballo|vaca|bote|perro|danta|lapa|quetzal|multa|pesca|ballena|delfin/, '🐾'],
  [/teatro|retreta|turno|redondel|improvisado|feria|fiesta|zapote|gol|estadio/, '🎉'], [/rumor|pueblo|encargo|vecino|compra|comercio|fiado/, '🗣️'],
];
export const achIcon = (key) => (ACH_ICONS.find(([re]) => re.test(key)) || [null, '🏆'])[1];

// los que se arman con el nombre de la criatura o la habilidad
const NOMBRES_JEFES = { viejo_monte: 'Hice las paces con el Viejo del Monte', mona: 'Le gané a la Mona', duende: 'Atrapé al Duende', arpia: 'Vencí a la Arpía de la Tormenta', tulevieja: 'Le quité el sombrero a la Tulevieja', senor_arenal: 'Vencí al Señor del Arenal', cadejos: 'Venciste al Cadejos', segua: 'Venciste a la Segua', llorona: 'Descansá en paz, Llorona' };
export function catalogo() {
  const m = new Map(LOGROS);
  for (const [k, t] of Object.entries({ ...NOMBRES_JEFES, ...NOMBRES_MINI })) m.set(`vencer_${k}`, t);
  m.set('mini_jefes', 'Mandamás del monte');
  m.set('vencer_rey_murcielago', 'Vencí al Murciélago Rey');
  m.set('bici', 'Pedaleando por Tiquicia'); m.set('moto', 'Motorizado');
  for (const [k, t] of Object.entries(NOMBRES_HISTORIAS)) m.set(k, t);
  for (const [k, s] of Object.entries(SKILLS)) { m.set(`habilidad5_${k}`, `${s.name}: nivel 5`); m.set(`habilidad10_${k}`, `Maestro de ${s.name.toLowerCase()}`); }
  m.set('todero', 'Todero: todo a nivel 3');
  return m;
}
