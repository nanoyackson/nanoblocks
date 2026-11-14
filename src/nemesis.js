// La que le ganó: la Sombra que mata a uno se queda con nombre y vuelve otras noches a buscarlo. Si vuelve a ganar, sube de nivel; si uno
// la vence, paga bien y se acaba. Morir deja de ser solo perder tiempo: deja a alguien con quien arreglar cuentas. El estado vive en
// meta.nemesis; la criatura viva, en g.nemesisMob (los mobs no se guardan: si uno se va, vuelve otra noche).
import { anotar } from './diario.js';
import { ventaja } from './progreso.js';
import { difOf } from './supervivencia.js';
import { puestoSombra } from './asedio.js';

const COLON = 360, ESENCIA = 499;
const NOMBRES = ['La Deuda', 'El Recibo', 'Don Nadie', 'La Cuñada', 'El Cobrador', 'Mae Sin Cara', 'La Factura', 'Doña Envidia', 'El Trámite', 'La Presa de las Cinco', 'El Lunes', 'La Suegra', 'El Hueco', 'Don Vencido', 'La Ventanilla 3', 'El Marchamo', 'La Goma', 'El Aguacero', 'Doña Chisme', 'El Último Bus', 'La Letra Menuda', 'El Compadre', 'Doña Cuenta', 'El Sin Permiso'];
const esSombra = (m) => m && !m.dead && !m.dying && /^sombra/.test(m.type || '') && m.type !== 'sombra_madre';
const peleaGrande = (g) => g.asedio || g.nocheLarga || g.apuro || g.ceniza || g.grieta || g.ventanilla;
const vivo = (g) => (g.nemesisMob && !g.nemesisMob.dead && !g.nemesisMob.dying ? g.nemesisMob : null);

// al morir: ¿fue una Sombra? Lo dice la causa: un jaguar o una dinamita con una Sombra cerca no cuentan.
export function anotarNemesis(g, fromX, fromZ, cause) {
  if (g.mode !== 'survival' || g.ceniza || fromX === null || fromX === undefined) return null;
  const M = g.meta, N = M.nemesis, suya = vivo(g), causa = String(cause || '');
  // volvió a ganar
  if (N && suya && (causa.includes(N.nombre) || Math.hypot(suya.body.pos.x - fromX, suya.body.pos.z - fromZ) < 2.5)) {
    N.nivel = Math.min(5, N.nivel + 1); N.veces++; N.dia = g.day || 1;
    anotar(g, `«${N.nombre}» me volvió a ganar. Ya van ${N.veces}.`, '🩸');
    return `🩸 «${N.nombre}» le volvió a ganar, y cada vez viene más fuerte.`;
  }
  if (N || !/Sombra/.test(causa)) return null;
  let mejor = null, d = /piedra/.test(causa) ? 40 : 4;
  for (const m of g.entities.mobs) {
    if (!esSombra(m) || m.data.comensalFn) continue;
    const q = Math.hypot(m.body.pos.x - fromX, m.body.pos.z - fromZ);
    if (q < d) { d = q; mejor = m; }
  }
  if (!mejor) return null;
  const usados = M.nemesisVencidas || [];
  const libres = NOMBRES.filter((n) => !usados.includes(n));
  const lista = libres.length ? libres : NOMBRES;
  M.nemesis = { nombre: lista[Math.floor(Math.random() * lista.length)], tipo: mejor.type, nivel: 1, veces: 1, dia: g.day || 1, visto: g.day || 1 };
  // sigue por ahí: si uno vuelve y le gana esa misma noche, también cuenta
  mejor.data.name = M.nemesis.nombre; mejor.data.nemesis = true; mejor.data.provoked = true;
  g.nemesisMob = mejor;
  anotar(g, `Me mató una Sombra. En el pueblo ya le dicen «${M.nemesis.nombre}».`, '🩸');
  return `🩸 Esa Sombra se quedó con ganas. Le va a decir «${M.nemesis.nombre}», porque va a volver por usted.`;
}

function aparecer(g, N) {
  const p = g.player.body.pos, dia = g.day || 1;
  const q = puestoSombra(g, p.x, p.z, Math.floor(p.y), Math.random() * Math.PI * 2, 22);
  if (!q) return null;
  const m = g.entities.spawnMob(N.tipo || 'sombra', q.x + 0.5, q.y + 0.2, q.z + 0.5);
  if (!m) return null;
  const base = (m.kind.health || 16) + Math.min(20, dia);
  m.health = Math.round(base * (1.5 + N.nivel * 0.35));
  m.data.vmax = m.health;
  m.data.name = N.nombre; m.data.nemesis = true; m.data.provoked = true;
  m.data.fuerza = 1 + N.nivel * 0.15;
  m.group.userData.babyScale = (m.group.userData.babyScale || 1) * (1.12 + N.nivel * 0.05);
  g.nemesisMob = m;
  return m;
}

// cada segundo
export function tickNemesis(g) {
  const M = g.meta, N = M && M.nemesis;
  if (!N || g.mode !== 'survival' || g.dim !== 'tierra' || !g.settings.hostiles || !difOf(g).hostiles) return;
  const m = vivo(g);
  if (m) {
    // que se note de lejos
    const b = m.body.pos;
    g.particles.burst(b.x, b.y + 1, b.z, [[0.8, 0.08, 0.1], [0.3, 0.02, 0.05]], 6, 0.9);
    return;
  }
  g.nemesisMob = null;
  const t = g.time || 0, dia = g.day || 1;
  if (t < 0.56 || t > 0.9 || dia <= N.dia || N.visto === dia || peleaGrande(g) || g.sleeping || !g.player.alive) return;
  if (Math.random() > 0.025) return; // llega en cualquier momento de la noche
  if (!aparecer(g, N)) return;
  N.visto = dia;
  g.ui.toast(N.veces > 1 ? `🩸 «${N.nombre}» vino por usted otra vez. Ya le ganó ${N.veces} veces` : `🩸 «${N.nombre}» vino por usted. Ya le ganó una vez`, 4200);
  g.audio.play('latido', { ui: true, vol: 0.7 });
}

// al vencerla
export function vencerNemesis(g, m) {
  if (!m.data || !m.data.nemesis) return;
  const M = g.meta, N = M.nemesis;
  g.nemesisMob = null;
  if (!N) return;
  const colones = ventaja.premio(g, 25 + N.nivel * 15), esencia = N.nivel;
  g.giveItem(COLON, colones); g.giveItem(ESENCIA, esencia); g.addXP(25 * N.nivel);
  (M.nemesisVencidas ||= []).push(N.nombre);
  M.nemesis = null;
  g.ui.regionBanner(`¡Venció a «${N.nombre}»!`, `Cuentas saldadas: ${colones} colones y ${esencia} de esencia`);
  g.audio.play('nivel', { ui: true, vol: 0.6 });
  anotar(g, `Le gané a «${N.nombre}», la que ${N.veces > 1 ? `me había ganado ${N.veces} veces` : 'me había matado'}.`, '🩸');
  g.achieve('nemesis', 'Cuentas saldadas');
  if (M.nemesisVencidas.length >= 3) g.achieve('nemesis3', 'Ya nadie me debe nada');
  if (N.nivel >= 3) g.achieve('nemesis_dura', 'Le gané a la que más me ganó');
}

// lo que dice la gente y lo que queda escrito
export const fraseNemesis = (g) => {
  const N = g.meta && g.meta.nemesis;
  if (N) return `Dicen que a usted le anda saliendo una Sombra que le dicen «${N.nombre}». Cuídese.`;
  const V = (g.meta && g.meta.nemesisVencidas) || [];
  return V.length ? `¿Es cierto que usted acabó con «${V[V.length - 1]}»? Aquí todavía se habla de eso.` : null;
};
export function pruebaNemesis(g) {
  g.meta.nemesis = g.meta.nemesis || { nombre: NOMBRES[Math.floor(Math.random() * NOMBRES.length)], tipo: 'sombra', nivel: 1, veces: 1, dia: 0 };
  g.meta.nemesis.visto = 0;
  g.day = Math.max(g.day || 1, 2);
  g.time = 0.6;
  return `De noche: «${g.meta.nemesis.nombre}» llega en un momento`;
}
