// La güila: la última carta de Zenaida dice «cuando le pese la edad, busque a un güila que le haga caso y déjele una carta». Después del
// final, Yendry llega a la casa a pedir que le enseñen. Tres lecciones cortas y al final uno le deja su propia carta, armada con lo que de
// verdad pasó en la partida. Se queda en la casa. El estado vive en meta.hist.guila; la carta, en meta.hist.cartaPropia (carta 16).
import { SOLID, FLUID, BLOCKS, getDef } from './blocks.js';
import { decir } from './misiones.js';
import { anotar } from './diario.js';
import { entregarCarta } from './historia.js';
import { genteEnCasa } from './gente.js';

const ANCHO = 9, FONDO = 7, NOM = 'Yendry', VENDA = 440, ENEMIGOS = 5;
const FRASES = ['¿Es cierto que usted le ganó a la Sombra Madre?', 'Doña Eulalia dice que coma más.', '¿Esto se come?', 'Cuando sea grande voy a tener un cucharón.', 'El Canelo me quiere más a mí.'];

function llegar(g, H) {
  if (H.guila) H.guila.juego = null; // un escondido de antes ya no cuenta
  const w = g.world, x = H.casa.x + 4, z = H.casa.z + FONDO + 3;
  let y = H.casa.y + 8;
  while (y > H.casa.y - 12 && !(SOLID[w.getBlock(x, y - 1, z)] && !SOLID[w.getBlock(x, y, z)])) y--;
  const m = g.entities.spawnMob('vecino', x + 0.5, y + 0.2, z + 0.5);
  if (!m) return null;
  const here = { x, y, z };
  Object.assign(m.data, { home: here, plaza: { ...here }, name: NOM, role: 'vecino', vid: 'hist:guila', seed: 19334, guila: true });
  if (m.kind.dress) m.kind.dress(m);
  m.group.userData.babyScale = 0.72;
  return m;
}
function cartaPropia(g) {
  const M = g.meta, H = M.hist, dias = g.day || 1, R = M.racha || {}, muertes = M.muertes || 0, nidos = M.nidosRotos || 0, ceniza = (M.ceniza && M.ceniza.record) || 0;
  const L = [`Yendry:\n\nSi está leyendo esto, ya me fui a descansar. No se me ponga triste: fueron ${dias} días, y me comí casi todo lo que quise.`];
  L.push(muertes === 0 ? 'Yo nunca me morí, pero no se lo crea: fue suerte.' : `Yo me morí ${muertes} ${muertes === 1 ? 'vez' : 'veces'}, y cada vez volví por mis cosas. De eso se trata.`);
  if (R.mejor) L.push(`Lo más que aguanté sin caerme fueron ${R.mejor} días seguidos. Le dejo el récord para que lo rompa.`);
  if (nidos) L.push(`Partí ${nidos} ${nidos === 1 ? 'nido' : 'nidos'} de Sombra. Si salen más, ya sabe: hacha.`);
  if (ceniza) L.push(`En la Noche de Ceniza llegué a ${ceniza} ${ceniza === 1 ? 'oleada' : 'oleadas'}. A ver usted.`);
  if (M.expediente && M.expediente.como === 'almuerzo') L.push('El Lic. Porras viene a comer algunos domingos. No le pregunte por el expediente, que se pone sentimental.');
  if (M.expediente && M.expediente.como === 'mordida') L.push('Una vez le pagué a un funcionario en plena plaza. No lo haga. Sale más barato invitarlo a comer.');
  if (M.prima && M.prima.fase >= 5) L.push('Si viene una señora con carpeta, déjela entrar. Es de la familia, aunque le cueste creerlo. A ella también.');
  if (genteEnCasa(g)) L.push(`En esta casa ya viven ${genteEnCasa(g) === 1 ? 'una persona más' : `${genteEnCasa(g)} personas más`}. Nadie vino a pedir nada: venían huyendo, y se quedaron a comer. Déjeles campo.`);
  if ((M.comensales || []).length) L.push(`Les serví de comer a ${M.comensales.length} ${M.comensales.length === 1 ? 'Sombra' : 'Sombras'}. Pregunte quiénes eran, y déjeles algo. No cuesta tanto.`);
  if ((M.nemesisVencidas || []).length) L.push(`Me salió una Sombra con nombre, «${M.nemesisVencidas[0]}». Le gané. Cuando le salga la suya, no le huya: váyala a buscar con la panza llena.`);
  if (H.asedios) L.push(`A esta casa vinieron por ella ${H.asedios} ${H.asedios === 1 ? 'vez' : 'veces'}, y aquí sigue. Cuídela.`);
  L.push('Zenaida me dejó esta casa con más huecos que una calle de pueblo. Yo se la dejo mejor, que es lo único que uno puede hacer.\n\nY coma bien, por favor.\n\nPura vida.');
  return L.join('\n\n');
}
// cada segundo
export function tickGuila(g) {
  if (g.mode !== 'survival' || g.dim !== 'tierra' || !g.meta) return;
  const H = g.meta.hist;
  if (!H || !H.fin || !H.casa) return;
  const dia = g.day || 1, t = g.time || 0, p = g.player.body.pos;
  if (H.finDia == null) H.finDia = dia;
  if (dia - H.finDia < 2) return; // deja pasar un par de días desde el final
  const Y = (H.guila ||= { fase: 0 });
  const m = g.entities.mobs.find((q) => !q.dead && q.data && q.data.guila);
  const deDia = t > 0.03 && t < 0.44;
  if (m) {
    if (!deDia && !m.data.irse) { Y.juego = null; decir(g, m, 'Ya me llaman. ¡Hasta mañana!', 3); m.data.irse = 4; }
    else if (deDia && Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < 14) {
      m.data.charla = (m.data.charla || 8) - 1;
      if (m.data.charla <= 0) { m.data.charla = 40 + Math.random() * 40; decir(g, m, FRASES[(Math.random() * FRASES.length) | 0], 3); }
    }
    tickEscondido(g, m, Y);
    if (Y.fase === 3 && (g.meta.bajas || 0) - (Y.base || 0) >= ENEMIGOS && !Y.listo) { Y.listo = true; g.ui.toast('🧒 Yendry vio cómo se hace. Vaya a hablarle', 3200); }
    return;
  }
  if (!deDia || g.asedio || g.ceniza || Math.hypot(H.casa.x + ANCHO / 2 - p.x, H.casa.z + FONDO / 2 - p.z) > 40 || !g.world.isLoaded(H.casa.x, H.casa.z)) return;
  if (!llegar(g, H)) return;
  if (!Y.visto) { Y.visto = dia; g.ui.toast('🧒 Hay una güila en el patio, con cara de que quiere preguntar algo', 3800); }
}
export function guilaInteract(m, g, held) {
  if (!m.data.guila) return false;
  const H = g.meta.hist, Y = (H.guila ||= { fase: 0 }), diga = (t, ms = 5000) => g.ui.dialog(NOM, t, ms), def = held && getDef(held.id);
  if (Y.fase === 0) {
    Y.fase = 1;
    diga('Me dijeron que usted es la cepa de doña Zenaida, y que le ganó a la Sombra Madre. Yo quiero aprender. ¿Me enseña? Tengo hambre, eso sí. Primero lo primero.', 7000);
    return true;
  }
  if (Y.fase === 1) {
    if (!def || !def.food) { diga('Sin comer no aprendo nada. Eso decía doña Zenaida. Déme algo de comer.'); return true; }
    g.inventory.consumeHeld(1); Y.fase = 2;
    diga('¡Qué rico! Primera lección: coma bien. Segunda: una vez me corté y nadie sabía qué hacer. Enséñeme: tráigame una venda.', 6500);
    return true;
  }
  if (Y.fase === 2) {
    if (!held || held.id !== VENDA) { diga('Una venda, en la mano. Si no anda, con lana se hace.'); return true; }
    g.inventory.consumeHeld(1); Y.fase = 3; Y.base = g.meta.bajas || 0;
    diga(`Ya entendí: bien apretada pero que no se ponga morado. Última: quiero ver cómo se pelea. Yo miro de lejos. Venza a ${ENEMIGOS}, y hablamos.`, 6500);
    return true;
  }
  if (Y.fase === 3) {
    if ((g.meta.bajas || 0) - (Y.base || 0) < ENEMIGOS) { diga(`Lleva ${(g.meta.bajas || 0) - (Y.base || 0)} de ${ENEMIGOS}. Yo aquí espero, que ni a las Sombras les da miedo una güila.`, 4000); return true; }
    Y.fase = 4;
    H.cartaPropia = cartaPropia(g);
    entregarCarta(g, 16);
    g.addXP(60);
    g.audio.play('aplausos', { ui: true, vol: 0.5 });
    g.ui.regionBanner('La carta que usted escribió', 'Como le pidió Zenaida. Se lee con C');
    g.achieve('guila', 'Ya hay quién');
    anotar(g, 'Le dejé una carta a Yendry, como me pidió la abuela.', '✉');
    diga('¿Esto es para mí? ¿Y por qué dice «si está leyendo esto»? Usted no se va a morir, ¿verdad? …Bueno. Yo la guardo. Y como bien.', 7000);
    return true;
  }
  // después de la carta, todos los días trae algo: es lo que hacen las güilas con quien les hace caso
  if (Y.fase >= 4 && Y.regalo !== (g.day || 1)) {
    Y.regalo = g.day || 1;
    g.giveItem(521, 1);
    diga(REGALOS[(Math.random() * REGALOS.length) | 0], 4500);
    return true;
  }
  if (Y.fase >= 4 && Y.juego) { ganoEscondido(g, m, Y); return true; }
  if (Y.fase >= 4 && Y.jugo !== (g.day || 1) && esconderse(g, m, Y)) {
    diga('¿Jugamos escondido? Cuente hasta veinte. ¡No vale ver! …Y no me busque con la brújula, que eso es trampa.', 5000);
    return true;
  }
  diga(FRASES[(Math.random() * FRASES.length) | 0], 3000);
  return true;
}
// ---------- escondido ----------
const ESCONDE = 90;
function esconderse(g, m, Y) {
  const w = g.world, p = g.player.body.pos;
  for (let i = 0; i < 30; i++) {
    const a = Math.random() * Math.PI * 2, r = 14 + Math.random() * 14, x = Math.floor(p.x + Math.cos(a) * r), z = Math.floor(p.z + Math.sin(a) * r);
    if (!w.isLoaded(x, z)) continue;
    let y = Math.floor(p.y) + 8;
    while (y > Math.floor(p.y) - 10 && !(SOLID[w.getBlock(x, y - 1, z)] && !SOLID[w.getBlock(x, y, z)] && !SOLID[w.getBlock(x, y + 1, z)])) y--;
    if (y <= Math.floor(p.y) - 10) continue;
    // ni en una copa, ni en un techo, ni en el fondo del agua, ni dentro de un cerro
    if (FLUID[w.getBlock(x, y, z)] || BLOCKS[w.getBlock(x, y - 1, z)].leafy || y > Math.floor(p.y) + 3 || y < w.gen.column(x, z).h - 1) continue;
    Y.jugo = g.day || 1;
    Y.juego = { hasta: (g.clock || 0) + ESCONDE };
    g.particles.burst(m.body.pos.x, m.body.pos.y + 1, m.body.pos.z, [[1, 1, 1]], 10, 1.2);
    Object.assign(m.body.pos, { x: x + 0.5, y: y + 0.1, z: z + 0.5 });
    m.data.home = { x, y, z }; m.data.plaza = { x, y, z };
    g.ui.toast(`🧒 Yendry se escondió. Tiene ${ESCONDE} segundos para encontrarla y hablarle`, 3600);
    return true;
  }
  return false;
}
function ganoEscondido(g, m, Y) {
  Y.juego = null;
  Y.ganadas = (Y.ganadas || 0) + 1;
  g.giveItem(521, 2);
  g.audio.play('aplausos', { ui: true, vol: 0.4 });
  g.ui.dialog(NOM, ['¡Ay, no! ¿Cómo me vio? Bueno, tome: dos sobres. El otro día me escondo mejor.', '¡Trampa! Seguro me oyó. Tome sus sobres, mañana gano yo.', 'Usted tiene un don para esto. Qué sospecha. Tome.'][Y.ganadas % 3], 5000);
  g.achieve('escondido', 'Te encontré');
}
export function tickEscondido(g, m, Y) {
  if (!Y.juego || (g.clock || 0) < Y.juego.hasta) return;
  Y.juego = null;
  decir(g, m, '¡Gané! ¡Gané! Estaba aquí todo el tiempo. Mañana otra.', 4);
  g.ui.toast('🧒 Se acabó el tiempo: ganó Yendry. Mañana hay revancha', 3000);
}
const REGALOS = [
  'Tome, me sobró un sobre de estampas. Bueno, no me sobró: lo compré para usted. No le diga a mi mamá.',
  'Le cambié una repetida a un güila de la escuela. Me dio este sobre y una calcomanía. La calcomanía no se la doy.',
  'Encontré este sobre en el camino. Bueno, lo encontré en la pulpería. Bueno, lo compré.',
  'Para el álbum. Si sale la Jefa de Ventanilla, me la presta un ratito.',
]
