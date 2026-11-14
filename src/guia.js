// Don Tobías, el guía: en los mundos nuevos (supervivencia) aparece al lado del jugador, se presenta, explica lo
// básico y cada vez que se le habla dice cuál es la siguiente meta de la ruta del aventurero. Sigue de lejos
// los primeros días y después se despide.
import { RUTA } from './ruta.js';
import { decir } from './misiones.js';
import { objetivoHistoria } from './historia.js';

const INTRO = [
  '¡Pura vida! Soy Don Tobías. Su abuela Zenaida me pidió que le diera una mano estos primeros días. Lea la carta que le dejó: tecla C.',
  'Lo primero: la casa de su abuela, que la brújula marca. Ahí hay tablas, comida y una mesa. De noche salen las Sombras: que no le caigan encima afuera.',
  'Tome agua del río, coma variado y duerma en cama, que el cansancio pega. La libreta (L, H, K, N) le lleva la cuenta de todo, y con la Y le explica cómo funciona cada cosa.',
];

function siguienteMeta(g) {
  for (const r of RUTA) if (!r.done(g)) return r;
  return null;
}

export function tickGuia(g) {
  const M = g.meta;
  if (g.mode !== 'survival' || g.dim !== 'tierra' || M.guiaFin) return;
  const p = g.player.body.pos;
  let tob = g.entities.mobs.find((m) => !m.dead && m.data && m.data.guia);
  if ((g.day || 1) > 3) {
    if (tob) { decir(g, tob, '¡Ya usted puede sin mí! Mucha suerte, pura vida.', 5); tob.data.irse = 6; tob.data.guia = false; }
    M.guiaFin = true;
    return;
  }
  if (!tob) {
    // aparece cerca (también después de cargar la partida)
    const x = p.x + 2.5, z = p.z + 1.5;
    tob = g.entities.spawnMob('vecino', x, p.y + 0.5, z);
    tob.data = { vid: 'guia:tobias', name: 'Don Tobías (guía)', role: 'guia', seed: 31415, home: { x, y: p.y, z }, plaza: { x, y: p.y, z }, guia: true, sigue: true };
    tob.kind.dress(tob);
    if (!M.guiaIntro) M.guiaIntro = 0;
  }
  // hasta que le hablen, de vez en cuando lo recuerda (el prólogo tapa la primera vez)
  if (!M.guiaIntro) { g.guiaT = (g.guiaT ?? 11) - 1; if (g.guiaT <= 0) { g.guiaT = 25; decir(g, tob, '¡Hola! Hábleme con clic derecho', 5); } }
  // sigue de lejos (no se pega tanto) y no se queda atrás
  const d = Math.hypot(tob.body.pos.x - p.x, tob.body.pos.z - p.z);
  tob.data.sigue = d > 6;
  if (d > 40) { tob.body.pos.x = p.x + 3; tob.body.pos.z = p.z + 2; tob.body.pos.y = p.y + 0.5; }
}

// al hablarle
export function guiaInteract(m, g) {
  if (!m.data.guia) return false;
  const M = g.meta;
  if ((M.guiaIntro || 0) < INTRO.length) {
    g.ui.dialog(m.data.name, INTRO[M.guiaIntro || 0], 6500);
    M.guiaIntro = (M.guiaIntro || 0) + 1;
    if (M.guiaIntro === INTRO.length) g.achieve('guia', 'Bien guiado');
    return true;
  }
  const h = objetivoHistoria(g);
  if (h && (g.meta.guiaAlterna = !g.meta.guiaAlterna)) { g.ui.dialog(m.data.name, `Lo que le encargó su abuela: ${h.texto}`, 6500); return true; }
  const r = siguienteMeta(g);
  g.ui.dialog(m.data.name, r ? `Lo que sigue: ${r.title}. ${r.hint} (J abre la ruta)` : '¡Usted ya terminó la ruta! Ahora a disfrutar de Tiquicia.', 6500);
  return true;
}
