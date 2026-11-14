// La prima Marielos: otra nieta de Zenaida, vende bienes raíces (ficticios) y llega a ofrecer plata por la casa. Cada vez ofrece más, hasta que se le
// sale: «a mí no me dejó ni una carta». Sí le dejó: en los escondites hay un sobre para ella. Entregarlo cierra la historia, y en la Noche Larga
// llega con el carro lleno. Le da a la campaña una cara humana entre jefe y jefe. Estado: meta.prima.
import { BLOCK_BY_KEY as K, SOLID } from './blocks.js';
import { decir } from './misiones.js';
import { anotar } from './diario.js';
import { entregarCarta } from './historia.js';

export const SOBRE = 517, CARTA_MARIELOS = 23; // la carta está en anselmo_cartas.js
const ANCHO = 9, FONDO = 7, NOM = 'La prima Marielos', COLON = 360;
const pedazos = (H) => Object.keys(H.pedazos || {}).length;
const OFERTAS = [
  'Mucho gusto, cepa. Soy Marielos, la nieta de Zenaida, la otra. Lamento lo de la abuela. Le doy 300 colones por este lote. Está viejo, tiene Sombras y no tiene papeles. Un cliente mío quiere hacer aquí un hotel boutique. Piénselo.',
  'Veo que sigue aquí. Hasta barrió. Ahora le doy 500. ¿Sabe lo que es vivir aquí cuando llueve? Yo sí. Venía todas las vacaciones de medio año.',
  'Ochocientos, y no me haga subir más. ¿De verdad le gusta esto? Comer frijoles con una radio que solo agarra una emisora. …Qué humo tiene esa fogata.',
];
const HERIDA = 'Mire, le voy a decir una cosa. A usted le dejó la casa, las cartas, el cuento del Corazón, todo. A mí, que la cuidé cuando se quebró la cadera, no me dejó ni una carta. Ni una. Quédese con su casa. Vuelvo cuando se me pase.';
const ESPERA = ['¿Sigue aquí? Yo también. No sé por qué sigo viniendo. Ya ni traigo el contrato.', 'Le traje unas tortillas. No es nada. Me sobraron.', 'Este corredor lo pintamos ella y yo, en el 98. Quedó torcido.'];
const DESPUES = ['Vine a ver si ya se le cayó el techo. No es cierto. Vine a comer.', 'Ya no vendo hoteles. Vendo lotes con vista a la realidad. No se venden.', 'Esa señora escribía peor que un médico, ¿verdad? Me la sé de memoria.', 'Rigo me sigue queriendo vender un seguro. Es un consuelo.'];

function llegar(g, H) {
  const w = g.world, x = H.casa.x + 2, z = H.casa.z + FONDO + 3;
  let y = H.casa.y + 8;
  while (y > H.casa.y - 12 && !(SOLID[w.getBlock(x, y - 1, z)] && !SOLID[w.getBlock(x, y, z)])) y--;
  const m = g.entities.spawnMob('vecino', x + 0.5, y + 0.2, z + 0.5);
  if (!m) return null;
  const here = { x, y, z };
  Object.assign(m.data, { home: here, plaza: { ...here }, name: NOM, role: 'vecino', vid: 'hist:marielos', seed: 19350, prima: true });
  if (m.kind.dress) m.kind.dress(m);
  return m;
}
// ¿le toca venir?
function leToca(g, H, R) {
  const dia = g.day || 1, desde = dia - (R.dia || 0);
  if (!R.fase) return dia >= 8;
  if (R.fase === 1) return desde >= 4;                    // la segunda oferta
  if (R.fase === 2) return desde >= 4 && pedazos(H) >= 1; // la tercera oferta
  if (R.fase === 3) return desde >= 4 && pedazos(H) >= 2; // se le sale
  if (R.fase === 4) return desde >= 5;                    // hasta que aparezca el sobre
  return dia % 7 === 0;                                   // los domingos, a comer
}
// cada segundo
export function tickPrima(g) {
  if (g.mode !== 'survival' || g.dim !== 'tierra' || !g.meta || !g.meta.hist) return;
  const H = g.meta.hist;
  if (!H.hogar || !H.casa) return;
  const R = (g.meta.prima ||= { fase: 0 }), t = g.time || 0, p = g.player.body.pos;
  // el sobre aparece con el tercer escondite, o con el tercer pedazo para quien no anduvo buscando
  const Es = g.meta.escondites;
  if (R.fase >= 4 && !R.sobre && ((Es && (Es.fin || Es.i >= 3)) || pedazos(H) >= 3)) {
    R.sobre = true;
    g.giveItem(SOBRE, 1);
    g.ui.toast('✉ Entre las cosas de Zenaida venía un sobre sellado: «Para Marielos. Cuando se le pase»', 5200);
    anotar(g, 'Encontré un sobre de la abuela para la prima Marielos.', '✉');
  }
  // la Noche Larga: llega con el carro lleno
  if (R.fase >= 5 && H.cap === 8 && !R.ayudo && t > 0.06 && t < 0.34 && (g.day || 1) > (R.dia || 0) && !g.nocheLarga && Math.hypot(H.casa.x + ANCHO / 2 - p.x, H.casa.z + FONDO / 2 - p.z) < 16) {
    R.ayudo = true;
    if (!g.entities.mobs.some((q) => !q.dead && q.data && q.data.prima)) llegar(g, H);
    g.giveItem(K.torch, 32); g.giveItem(443, 3); g.giveItem(K.estacas, 16); g.giveItem(351, 4);
    g.ui.regionBanner('Llegó la prima Marielos', 'Con el carro lleno: antorchas, botiquines, estacas y casados');
    g.ui.dialog(NOM, 'No me mire así. Se lo cargué a la cuenta de un cliente. Póngase eso, y si se muere, vendo la casa.', 6000);
    anotar(g, 'Antes de la noche larga, llegó Marielos con el carro lleno.', '🚗');
  }
  const m = g.entities.mobs.find((q) => !q.dead && q.data && q.data.prima);
  const deDia = t > 0.06 && t < 0.34;
  if (m) {
    if (!deDia && !m.data.irse) { decir(g, m, 'Tengo una cita. Con nadie, pero tengo.', 3); m.data.irse = 4; }
    return;
  }
  if (!deDia || R.hoy === (g.day || 1) || !leToca(g, H, R) || g.asedio || g.nocheLarga || g.ceniza || Math.hypot(H.casa.x + ANCHO / 2 - p.x, H.casa.z + FONDO / 2 - p.z) > 40 || !g.world.isLoaded(H.casa.x, H.casa.z)) return;
  if (!llegar(g, H)) return;
  R.hoy = g.day || 1;
  if (R.fase < 5) g.ui.toast(R.fase >= 4 ? '🚗 Volvió Marielos, sin carpeta' : R.fase ? '🚗 Volvió Marielos, y trae carpeta' : '🚗 Se parqueó un carro en el patio. Baja una señora con carpeta, y mira la casa como quien la mide', 4200);
}
export function primaInteract(m, g) {
  if (!m.data.prima) return false;
  const R = (g.meta.prima ||= { fase: 0 }), diga = (t, ms = 8000) => g.ui.dialog(NOM, t, ms), dia = g.day || 1;
  // el sobre, si lo anda
  if (R.fase === 4 && R.sobre) {
    const loTrae = g.inventory.count(SOBRE) > 0;
    if (loTrae) g.inventory.remove(SOBRE, 1);
    R.fase = 5; R.dia = dia;
    entregarCarta(g, CARTA_MARIELOS);
    g.giveItem(COLON, 120);
    g.audio.play('hmm', { ui: true, vol: 0.4 });
    g.achieve('marielos', 'La otra cepa');
    anotar(g, 'Le entregué el sobre a Marielos. Se fue a leerlo atrás del carro, y duró un rato.', '✉');
    diga(`${loTrae ? '' : 'Alguien me dejó esto en la puerta del carro. '}…«Cuando se le pase». Vieja necia. Déme un momento. …Ya. Tome, léala, que igual habla de usted. Y esto otro es la prima de mi oferta. Se cayó el negocio. ¿Hay café? Y no me mire, que se me corrió el rímel. Los domingos vengo a comer. Es para vigilar la propiedad.`, 13000);
    m.data.irse = 12;
    return true;
  }
  if (R.fase >= 5) { diga(DESPUES[Math.floor(Math.random() * DESPUES.length)], 4500); return true; }
  if (R.fase >= 4) { diga(ESPERA[Math.floor(Math.random() * ESPERA.length)], 4800); R.dia = dia; return true; }
  if (R.dia === dia) { diga('Ya le dije mi precio. Piénselo con calma, que los hoteles no esperan.', 3500); return true; }
  R.dia = dia;
  if (R.fase < 3) { diga(OFERTAS[R.fase], 10000); R.fase++; g.achieve('prima_oferta', 'No se vende'); anotar(g, `La prima Marielos me ofreció plata por la casa. Van ${R.fase} veces.`, '🚗'); return true; }
  R.fase = 4;
  diga(HERIDA, 12000);
  anotar(g, 'Marielos dice que a ella no le dejó ni una carta.', '🚗');
  return true;
}
export const primaTexto = (g) => {
  const R = g.meta && g.meta.prima;
  if (R && R.fase === 4 && g.inventory.count(SOBRE)) return '✉ Tiene un sobre para la prima Marielos: viene a la casa de día, cada tantos días';
  return null;
};
export function pruebaPrima(g) {
  const R = (g.meta.prima ||= { fase: 0 }), H = g.meta.hist;
  H.hogar = true;
  R.dia = 0; R.hoy = 0; g.time = 0.12;
  if (R.fase === 4 && !R.sobre) { R.sobre = true; g.giveItem(SOBRE, 1); }
  if (!R.fase) g.day = Math.max(g.day || 1, 8);
  if (R.fase === 2 || R.fase === 3) H.pedazos = { tierra: 1, agua: 1 };
  return `La prima llega en un momento (fase ${R.fase})`;
}
