// Los noventa de Doña Eulalia: una historia chiquita y alegre, para que no todo sea Sombras. Zenaida le hacía todos los años un tres leches malísimo. Este
// año nadie se acordó, y ella no lo va a decir dos veces. Si uno se lo lleva un domingo, se arma la fiesta en la plaza. Estado: meta.cumple.
import { decir } from './misiones.js';
import { anotar } from './diario.js';
import { entregarCarta } from './historia.js';
import { Rocket } from './fiesta.js';
import { CARTAS_CORREO } from './correo_cartas.js';

const TRES_LECHES = 420, COLON = 360, NOM = 'Doña Eulalia';
const VIVAS = ['¡Noventa, y sigue hablando!', '¡Que viva Doña Eulalia!', '¿Noventa? Si tiene noventa desde que yo era güila.', '¡Y que cumpla más, que todavía me debe un chisme!', '¿Quién trajo el tres leches? ¡Está bueno!', 'Yo vine por el queque, pero felicidades.'];

export function cumpleEulalia(m, g) {
  const H = g.meta.hist, C = (g.meta.cumple ||= { fase: 0 }), dia = g.day || 1, held = g.inventory.held;
  if (C.fase === 0) {
    if (dia < 16 || (H.cap || 0) < 3) return false;
    C.fase = 1; C.dia = dia;
    g.ui.dialog(NOM, 'No me haga caso. Es que el domingo cumplo noventa. Zenaida todos los años me hacía un tres leches, malísimo, que parecía una esponja de lavar. Y yo me lo comía. Este año… bueno. Ya estoy vieja para estas tonteras. ¿Qué me decía?', 11000);
    anotar(g, 'Doña Eulalia cumple noventa, y este año no tiene quién le haga el tres leches.', '🎂');
    return true;
  }
  if (C.fase !== 1) return false;
  if (!held || held.id !== TRES_LECHES) return false; // lo demás sigue su curso: no hay que estar recordándolo
  if (dia % 7 !== 0) { g.ui.dialog(NOM, '¿Y eso? ¿Para mí? No, no: guárdelo para el domingo. Yo no cumplo años entre semana.', 5000); return true; }
  g.inventory.consumeHeld(1);
  C.fase = 2; C.fiesta = 45; C.diaFiesta = dia;
  g.fiestaCumple = { t: 45, mob: m };
  g.ui.regionBanner('¡Los noventa de Doña Eulalia!', 'En la plaza, y todo el pueblo se dio cuenta');
  g.audio.play('aplausos', { ui: true, vol: 0.7 });
  g.ui.dialog(NOM, '…Ay. ¿Quién le dijo? No me conteste. Está malísimo, ¿verdad? No, está bueno. Por eso mismo no sabe igual. Venga, siéntese. Tome: esto me lo dejó Zenaida «para cuando alguien se acordara». Yo nunca lo abrí.', 11000);
  const i = CARTAS_CORREO.findIndex((c) => c.k === 'para_eulalia');
  if (i >= 0) entregarCarta(g, 24 + i);
  g.giveItem(COLON, 40);
  g.meta.reputation = (g.meta.reputation || 0) + 3;
  g.addXP(30);
  g.achieve('cumple_eulalia', 'Noventa, y sigue hablando');
  anotar(g, 'Le llevé un tres leches a Doña Eulalia. Se armó la fiesta en la plaza.', '🎂');
  return true;
}
// cada segundo
export function tickCumple(g) {
  const F = g.fiestaCumple;
  if (!F) return;
  F.t--;
  const m = F.mob;
  if (F.t <= 0 || !m || m.dead || g.dim !== 'tierra') { g.fiestaCumple = null; return; }
  const b = m.body.pos;
  if (Math.random() < 0.35) (g.rockets ||= []).push(new Rocket(g, b.x + (Math.random() - 0.5) * 16, b.y + 1, b.z + (Math.random() - 0.5) * 16));
  if (Math.random() < 0.25) {
    const cerca = g.entities.mobs.filter((q) => !q.dead && q !== m && q.kind === m.kind && q.data && q.data.vid && Math.hypot(q.body.pos.x - b.x, q.body.pos.z - b.z) < 24);
    if (cerca.length) decir(g, cerca[Math.floor(Math.random() * cerca.length)], VIVAS[Math.floor(Math.random() * VIVAS.length)], 3);
  }
}
export const limpiarCumple = (g) => { g.fiestaCumple = null; };
export const cumpleTexto = (g) => {
  const C = g.meta && g.meta.cumple;
  return C && C.fase === 1 ? '🎂 Doña Eulalia cumple noventa: un domingo, un tres leches en la mano, y hablarle' : null;
};
