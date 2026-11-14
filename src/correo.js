// El correo: Don Chema, el último cartero, sube a la casa de mañana cuando hay algo para uno. Una carta por visita. Son chistes, regalos y remates de
// historias: la deuda de Don Hermes, la otra chancleta de la Sirena, la hija de Ñor Tino. Le da a cada día la posibilidad de una sorpresa sin pedir
// nada a cambio. Estado: meta.correo = { leidas: {k: dia}, dia }.
import { SOLID } from './blocks.js';
import { decir } from './misiones.js';
import { anotar } from './diario.js';
import { entregarCarta } from './historia.js';
import { CARTAS_CORREO } from './correo_cartas.js';
import { iniciarArchivo } from './archivo.js';

export const CHANCLETA2 = 518;
const ANCHO = 9, FONDO = 7, COLON = 360, ESENCIA = 499, BASE = 24, NOM = 'Don Chema (cartero)';
const dias = (g, d) => (g.day || 1) - (d || 0);
const genteP = (g, k) => g.meta.gente && g.meta.gente.p && g.meta.gente.p[k];
// cuándo llega cada una, y lo que trae
const REGLAS = {
  cobro: { si: (g) => dias(g) >= 6 },
  banco: { si: (g) => dias(g) >= 11 },
  compadre: { si: (g) => dias(g) >= 9, da: [[COLON, 40]] },
  zenaida30: { si: (g) => dias(g) >= 30, da: [[269, 8], [263, 4]], ya: (g) => g.achieve('zenaida30', 'Una que dejó pagada') },
  sirena: { si: (g, H) => H.pedazos && H.pedazos.agua && dias(g, H.pedazos.agua) >= 4, da: [[CHANCLETA2, 1]], ya: (g) => g.achieve('otra_chancleta', 'Sesenta y cuatro años es suficiente') },
  hija_tino: { si: (g) => { const P = genteP(g, 'tino'); return P && P.nivel >= 2; }, ya: (g, A) => { A.hijaDia = (g.day || 1) + 4; } },
  turista: { si: (g, H) => H.hogar && dias(g) >= 16 },
  porras: { si: (g, H) => H.porrasAmigo },
  marielos: { si: (g) => g.meta.prima && g.meta.prima.fase >= 5 && dias(g, g.meta.prima.dia) >= 6, da: [[COLON, 20]] },
  yendry: { si: (g, H) => H.guila && H.guila.fase >= 4 },
  anonima: { si: (g) => (g.meta.comensales || []).length >= 5, da: [[ESENCIA, 2]] },
  rigo: { si: (g) => g.meta.anselmo && g.meta.anselmo.escena === 'fin', da: [[COLON, 60]] },
  archivo: { si: (g, H) => H.hogar && dias(g) >= 18, ya: (g) => iniciarArchivo(g) },
  tobias: { si: (g) => g.meta.anselmo && g.meta.anselmo.fase >= 5 },
  zopilote: { si: () => false }, // v12.16.5: no sale en la ruta del correo: la entrega Don Chema en la ladera de la Noche del Rey (entregarCartaRey)
  // la última: cuando ya trajo casi todo, se jubila y deja la bicicleta
  chema: { si: (g) => Object.keys((g.meta.correo && g.meta.correo.leidas) || {}).length >= 12, da: [[455, 1]], ya: (g) => g.achieve('chema', 'La última vuelta') },
};
const estado = (g) => (g.meta.correo ||= { leidas: {}, dia: 0 });
function siguiente(g, H, A) {
  for (let i = 0; i < CARTAS_CORREO.length; i++) {
    const c = CARTAS_CORREO[i], r = REGLAS[c.k];
    if (!A.leidas[c.k] && r && r.si(g, H)) return i;
  }
  return -1;
}
function llegar(g, H) {
  const w = g.world, x = H.casa.x + 7, z = H.casa.z - 3;
  let y = H.casa.y + 8;
  while (y > H.casa.y - 12 && !(SOLID[w.getBlock(x, y - 1, z)] && !SOLID[w.getBlock(x, y, z)])) y--;
  const m = g.entities.spawnMob('vecino', x + 0.5, y + 0.2, z + 0.5);
  if (!m) return null;
  const here = { x, y, z };
  Object.assign(m.data, { home: here, plaza: { ...here }, name: NOM, role: 'vecino', vid: 'hist:chema', seed: 19351, cartero: true });
  if (m.kind.dress) m.kind.dress(m);
  return m;
}
// cada segundo
export function tickCorreo(g) {
  if (g.mode !== 'survival' || g.dim !== 'tierra' || !g.meta || !g.meta.hist) return;
  const H = g.meta.hist;
  if (!H.casa || !H.construida) return;
  const A = estado(g), dia = g.day || 1, t = g.time || 0, p = g.player.body.pos;
  tickHijaTino(g, H, A);
  const m = g.entities.mobs.find((q) => !q.dead && q.data && q.data.cartero);
  const deDia = t > 0.05 && t < 0.3;
  if (m) {
    if (!deDia && !m.data.irse) { decir(g, m, 'Sigo. Todavía me queda medio cantón.', 3); m.data.irse = 3; }
    m.data.charla = (m.data.charla ?? 1) - 1;
    if (m.data.charla <= 0 && Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < 12) { m.data.charla = 25; decir(g, m, '¡Correo! Venga, que no subo dos veces.', 3); }
    return;
  }
  // ya jubilado: lo que falte llega solo, sin sello, al lado de la puerta
  if (A.leidas.chema && deDia && A.dia !== dia && !g.asedio && !g.ceniza && Math.hypot(H.casa.x + ANCHO / 2 - p.x, H.casa.z + FONDO / 2 - p.z) < 40) {
    const i = siguiente(g, H, A);
    if (i >= 0) { A.dia = dia; entregar(g, A, i); g.ui.toast('✉ Una carta sin sello, con la letra de Don Chema: ya está en la libreta', 3600); }
    return;
  }
  if (!deDia || A.dia === dia || g.asedio || g.ceniza || Math.hypot(H.casa.x + ANCHO / 2 - p.x, H.casa.z + FONDO / 2 - p.z) > 40 || !g.world.isLoaded(H.casa.x, H.casa.z)) return;
  if (siguiente(g, H, A) < 0 || !llegar(g, H)) return;
  A.dia = dia;
  if (!A.visto) { A.visto = true; g.ui.toast('✉ Sube un señor en bicicleta vieja, con un bolso de cuero. Grita: «¡Correo!»', 4400); } else g.ui.toast('✉ Llegó Don Chema con el correo', 3000);
}
const FRASES = ['Hace treinta años repartía en cuatro pueblos. Ahora subo aquí, y es lo que queda.', 'Usted no sabe lo que es la letra de un médico hasta que le toca adivinar la dirección.', 'Su abuela me daba café. No digo nada. Solo lo menciono.', 'Ya nadie escribe. Por eso las leo. No, es broma. A veces.'];
export function correoInteract(m, g) {
  if (!m.data.cartero) return false;
  const H = g.meta.hist, A = estado(g), i = siguiente(g, H, A);
  if (i < 0 || m.data.irse) { g.ui.dialog(NOM, FRASES[Math.floor(Math.random() * FRASES.length)], 4500); return true; }
  const c = CARTAS_CORREO[i], r = REGLAS[c.k];
  entregar(g, A, i);
  if (c.k === 'chema') { g.ui.dialog(NOM, 'Esta no es del bolso. Es mía. Léala con calma, que yo me tomo el café mientras.', 5000); m.data.irse = 8; return true; }
  g.ui.dialog(NOM, r.da ? `Le traigo una, de ${c.de}. Y un paquete. Fírmeme aquí. No, es broma, ya nadie firma.` : `Una de ${c.de}. Yo no la leí. Bueno.`, 4500);
  m.data.irse = 8;
  return true;
}
function entregar(g, A, i) {
  const c = CARTAS_CORREO[i], r = REGLAS[c.k];
  A.leidas[c.k] = g.day || 1;
  entregarCarta(g, BASE + i);
  for (const [id, n] of r.da || []) g.giveItem(id, n);
  if (r.ya) r.ya(g, A);
  g.achieve('correo', 'Hay correo');
  if (Object.keys(A.leidas).filter((k) => k !== 'zopilote').length >= Object.keys(REGLAS).length - 1) g.achieve('correo_todo', 'La última carta entregada');
}
// v12.16.5: la carta de Zenaida para la cumbre; la entrega Don Chema al subir la gente (reyremate.js). Devuelve su texto, o null si ya se había leído
export function entregarCartaRey(g) {
  const A = estado(g), i = CARTAS_CORREO.findIndex((c) => c.k === 'zopilote');
  if (i < 0 || A.leidas.zopilote || !g.meta.hist) return null;
  entregar(g, A, i);
  return CARTAS_CORREO[i].texto;
}
// ---------- la hija de Ñor Tino ----------
const ESCENA_HIJA = [
  ['h', 'Papá.'],
  ['t', '…¿Ana Lucía? Mire qué vieja está.'],
  ['h', 'Usted cerró el taller y no me avisó.'],
  ['t', 'Usted se casó y no me invitó.'],
  ['h', 'Era un torta de hombre. Tenía razón usted. Ya me divorcié.'],
  ['t', '…¿Y ya comió?'],
  ['h', 'Ya sé de dónde lo aprendió. Sí, deme.'],
  ['t', 'Niña Chepa, ¿hay plato? Traje… vino mi hija.'],
];
function tickHijaTino(g, H, A) {
  if (!A.hijaDia || A.hija === 'fin' || (g.day || 1) < A.hijaDia) return;
  const t = g.time || 0;
  if (t < 0.06 || t > 0.36) return;
  const p = g.player.body.pos;
  if (Math.hypot(H.casa.x + ANCHO / 2 - p.x, H.casa.z + FONDO / 2 - p.z) > 26) return;
  const tino = g.entities.mobs.find((q) => !q.dead && q.data && q.data.gente === 'tino');
  if (!tino) return;
  let h = g.entities.mobs.find((q) => !q.dead && q.data && q.data.hijaTino);
  if (!h) {
    const x = Math.floor(tino.body.pos.x) + 2, z = Math.floor(tino.body.pos.z), y = Math.floor(tino.body.pos.y);
    h = g.entities.spawnMob('vecino', x + 0.5, y + 0.3, z + 0.5);
    if (!h) return;
    const here = { x, y, z };
    Object.assign(h.data, { home: here, plaza: { ...here }, name: 'Ana Lucía', role: 'vecino', vid: 'hist:analucia', seed: 19352, hijaTino: true });
    if (h.kind.dress) h.kind.dress(h);
    if (!A.hija) { A.hija = { i: 0, t: 2 }; g.ui.toast('🔨 Una señora se bajó del bus, y se quedó parada frente a Ñor Tino', 3600); }
  }
  if (typeof A.hija !== 'object') A.hija = { i: 0, t: 2 };
  A.hija.t--;
  if (A.hija.t > 0) return;
  const paso = ESCENA_HIJA[A.hija.i];
  if (!paso) {
    A.hija = 'fin';
    h.data.irse = 20;
    g.addXP(30);
    g.achieve('hija_tino', 'Once años, y un plato');
    anotar(g, 'Vino la hija de Ñor Tino. Once años sin hablarse, y se sentaron a comer.', '🔨');
    return;
  }
  decir(g, paso[0] === 'h' ? h : tino, paso[1], 3.4);
  A.hija.i++; A.hija.t = 4;
}
export const correoPendiente = (g) => {
  const H = g.meta && g.meta.hist, A = g.meta && g.meta.correo;
  return H && A && H.casa && siguiente(g, H, A) >= 0;
};
export function pruebaCorreo(g) {
  const A = estado(g), i = siguiente(g, g.meta.hist, A);
  g.meta.hist.construida = true;
  A.dia = 0; g.time = 0.1;
  g.day = Math.max(g.day || 1, 12);
  return i >= 0 ? `Don Chema sube en un momento: ${CARTAS_CORREO[i].titulo}` : 'No hay correo pendiente';
}
