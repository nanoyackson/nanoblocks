// El inspector (sátira ficticia): desde el día 10, cada tanto, el Licenciado Porras de la Municipalidad de Tiquicia llega a decir que la casa no
// aparece en el catastro. Se arregla con una multa o, si uno sobrevivió al trámite, con el Permiso de Todo. No pasa nada si no se paga: es
// solo el chiste, que además premia a los que se metieron en el trámite eterno. Estado: meta.inspector.
import { SOLID } from './blocks.js';
import { decir } from './misiones.js';
import { anotar } from './diario.js';
import { expedienteInspector } from './expediente.js';

const ANCHO = 9, FONDO = 7, CADA = 10, MULTA = 30, COLON = 360, PERMISO = 490, NOM = 'Lic. Porras (inspector ficticio)';
const OTRA_VEZ = [
  'Vengo por lo del visado del visado. Ah, no: era en la otra casa. Disculpe.',
  'Le informo que su expediente está en estudio. No me pregunte de qué.',
  'Pasé a saludar. Y a ver si no había construido más. ¿Eso es un yunque? Eso necesita otro formulario.',
  'La oficina cierra a las 3:30, abre a las 8 y atiende de 10 a 11. Le aviso por si acaso.',
];
const AMIGO = [
  'No vine por nada. Bueno, por el gallo pinto.',
  'Pedí vacaciones. Me las negaron por falta de un timbre. Yo mismo las negué.',
  'Encontré el expediente. Lo volví a traspapelar. Es un arte.',
  '¿Ya le dijeron que la ventanilla 3 no existe? Treinta años, y no existe.',
];
function llegar(g, H) {
  const w = g.world, x = H.casa.x + 6, z = H.casa.z + FONDO + 2;
  let y = H.casa.y + 8;
  while (y > H.casa.y - 12 && !(SOLID[w.getBlock(x, y - 1, z)] && !SOLID[w.getBlock(x, y, z)])) y--;
  const m = g.entities.spawnMob('vecino', x + 0.5, y + 0.2, z + 0.5);
  if (!m) return null;
  const here = { x, y, z };
  Object.assign(m.data, { home: here, plaza: { ...here }, name: NOM, role: 'vecino', vid: 'hist:inspector', seed: 19335, inspector: true });
  if (m.kind.dress) m.kind.dress(m);
  return m;
}
// cada segundo
export function tickInspector(g) {
  if (g.mode !== 'survival' || g.dim !== 'tierra' || !g.meta) return;
  const H = g.meta.hist;
  if (!H || !H.hogar || !H.casa) return;
  const dia = g.day || 1, t = g.time || 0, p = g.player.body.pos;
  const amigo = !!H.porrasAmigo && dia % 7 === 0; // se le traspapeló el expediente, y ahora viene a comer
  const toca = (amigo || (dia >= CADA && dia % CADA === 0)) && t > 0.06 && t < 0.3;
  const m = g.entities.mobs.find((q) => !q.dead && q.data && q.data.inspector);
  if (m) {
    if (!toca && !m.data.irse) { decir(g, m, 'Ya es hora de almuerzo. Vuelvo cuando pueda. O no.', 3); m.data.irse = 4; }
    return;
  }
  if (!toca || g.asedio || g.ceniza || Math.hypot(H.casa.x + ANCHO / 2 - p.x, H.casa.z + FONDO / 2 - p.z) > 40 || !g.world.isLoaded(H.casa.x, H.casa.z)) return;
  if (!llegar(g, H)) return;
  const I = (g.meta.inspector ||= {});
  if (I.dia !== dia) { I.dia = dia; if (amigo) g.ui.toast('🍲 El Lic. Porras vino a almorzar, sin corbata', 3400); else g.ui.toast((g.meta.expediente && g.meta.expediente.fase) || dia < 20 ? '📋 Un señor de corbata anda midiendo la casa con una cinta' : '📋 Un señor de corbata anda midiendo la casa, y esta vez trae un rollo de planos. Vaya a hablarle', 3600); }
}
export function inspectorInteract(m, g) {
  if (!m.data.inspector) return false;
  const I = (g.meta.inspector ||= {}), diga = (t, ms = 6000) => g.ui.dialog(NOM, t, ms), inv = g.inventory;
  if (expedienteInspector(g)) return true;
  if (g.meta.hist && g.meta.hist.porrasAmigo) { diga(AMIGO[(Math.random() * AMIGO.length) | 0], 4800); return true; }
  if (I.legal) { diga(OTRA_VEZ[(Math.random() * OTRA_VEZ.length) | 0], 4800); return true; }
  // quien pasó por el trámite eterno, gana
  if (inv.count(PERMISO) > 0) {
    I.legal = 'permiso';
    g.giveItem(COLON, 100);
    g.audio.play('aplausos', { ui: true, vol: 0.5 });
    g.achieve('casa_legal', 'Con todos los sellos');
    anotar(g, 'Le enseñé el Permiso de Todo al inspector. Casi llora.', '📋');
    diga('¿Eso es…? ¿Sellado siete veces? Treinta años en esto y nunca vi uno. Tome: es el reintegro de todas las multas que usted nunca pagó. No le diga a nadie que esto existe.', 8000);
    return true;
  }
  if (!I.aviso) {
    I.aviso = true;
    diga(`Buenos días. Inspección municipal. Esta casa no aparece en el catastro, y la abuela tampoco. Son ${MULTA} colones de multa, o el Permiso de Todo, sellado siete veces. Hábleme otra vez para pagar. O no: vuelvo cada ${CADA} días.`, 9000);
    return true;
  }
  if (inv.count(COLON) < MULTA) { diga('No anda los colones. Queda notificada su casa de que queda notificada. Vuelvo en diez días, o en diez años.', 5000); return true; }
  inv.remove(COLON, MULTA);
  I.legal = 'multa';
  g.audio.play('caja', { ui: true, vol: 0.4 });
  g.achieve('casa_multa', 'En regla, por ahora');
  anotar(g, 'Pagué la multa de la casa. Me dieron un recibo y una cita para otro recibo.', '📋');
  diga('Aquí tiene su recibo. La casa queda en regla hasta que cambien el reglamento, que será el jueves.', 6000);
  return true;
}
