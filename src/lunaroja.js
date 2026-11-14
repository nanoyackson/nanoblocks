// La luna roja, más brava: además de leyendas y doble experiencia, esa noche las Sombras llegan en oleadas (cinco, cada una más
// grande, con hondera, escudo, brinconas y grandes al final). Quien aguanta y tumba por lo menos seis de cada diez, al amanecer
// encuentra el botín de la luna roja. Estado: g.lunaOla (las Sombras vivas de la oleada; no se guarda), meta.lunaRojaOlas.
import { puestoSombra } from './asedio.js';
import { difOf } from './supervivencia.js';
import { anotar } from './diario.js';

const OLAS = 5, CADA = 70, COLON = 360, ESENCIA = 499;
const TIPOS = [['sombra', 'sombra'], ['sombra', 'sombra_hondera'], ['sombra_brincona', 'sombra_escudo', 'sombra'], ['sombra_hondera', 'sombra_brincona', 'sombra_escudo', 'sombra'], ['sombra_grande', 'sombra_brincona', 'sombra_hondera', 'sombra_escudo']];
function oleada(g, S) {
  const p = g.player.body.pos, n = 3 + S.ola * 2, tipos = TIPOS[Math.min(TIPOS.length - 1, S.ola)];
  let salen = 0;
  for (let i = 0; i < n; i++) {
    const pos = puestoSombra(g, p.x, p.z, Math.floor(p.y), Math.random() * Math.PI * 2, 18 + Math.random() * 6);
    if (!pos) continue;
    const m = g.entities.spawnMob(tipos[i % tipos.length], pos.x + 0.5, pos.y + 0.1, pos.z + 0.5);
    if (!m) continue;
    m.data.oleada = true; m.data.provoked = true; // vienen por uno desde lejos
    (g.lunaOla ||= []).push(m); salen++;
  }
  S.ola++; S.total += salen;
  g.audio.play('monstruo', { ui: true, vol: 0.8, pitch: 0.7 });
  g.ui.toast(S.ola === OLAS ? `🩸 ¡La última oleada! Vienen ${salen} Sombras, con las grandes adelante` : `🩸 Oleada ${S.ola} de ${OLAS}: vienen ${salen} Sombras bajo la luna roja`, 3600);
}
// cada segundo
export function tickLunaRoja(g) {
  const M = g.meta;
  if (!M) return;
  const S = M.lunaRojaOlas;
  // las bajas, las haga quien las haga
  if (g.lunaOla && S) {
    for (const m of g.lunaOla) if ((m.dead || m.dying) && !m.data.contado) { m.data.contado = true; if (!m.data.despedido && m.dying) S.matadas++; }
    g.lunaOla = g.lunaOla.filter((m) => !m.dead);
  }
  const activa = g.lunaRoja && g.dim === 'tierra' && g.mode === 'survival' && g.settings.hostiles && difOf(g).hostiles && g.player.alive;
  if (!activa) {
    // amaneció (o se fue de la noche): se cuenta lo que se aguantó
    if (S && S.ola > 0 && !g.lunaRoja) terminar(g, S);
    return;
  }
  const hoy = g.day || 1;
  if (M.lunaRojaHecha === hoy) return; // esta noche ya se contó (aunque una tormenta apague y prenda la luna)
  if (!S || S.dia !== hoy) { M.lunaRojaOlas = { dia: hoy, ola: 0, total: 0, matadas: 0, t: 15 }; return; }
  if (S.ola >= OLAS) return;
  S.t--;
  if (S.t <= 0) { S.t = CADA; oleada(g, S); }
}
function terminar(g, S) {
  const M = g.meta;
  M.lunaRojaOlas = null; g.lunaRojaPrueba = false; M.lunaRojaHecha = S.dia;
  for (const m of g.lunaOla || []) if (!m.dead) m.data.oleada = false;
  g.lunaOla = null;
  if (!S.total) return;
  const parte = S.matadas / S.total;
  if (parte >= 0.6) {
    g.giveItem(COLON, 40 + S.ola * 10); g.giveItem(ESENCIA, 2 + Math.floor(S.ola / 2)); if (S.ola >= OLAS) g.giveItem(260, 1);
    g.audio.play('campana', { ui: true, vol: 0.6 });
    g.ui.toast(`🌅 Amaneció y la luna roja se fue. Tumbó ${S.matadas} de ${S.total} Sombras: entre la ceniza quedó el botín (₡${40 + S.ola * 10}, esencias${S.ola >= OLAS ? ' y un diamante' : ''})`, 5200);
    g.achieve('luna_roja_olas', 'Aguanté las oleadas de la luna roja');
    if (S.matadas >= S.total) g.achieve('luna_roja_todas', 'Ni una Sombra quedó en pie');
    anotar(g, `Aguanté la luna roja: tumbé ${S.matadas} Sombras en ${S.ola} oleadas.`, '🩸');
  } else g.ui.toast(`🌅 Se fue la luna roja. Tumbó ${S.matadas} de ${S.total} Sombras: no alcanzó para el botín (hacen falta seis de cada diez)`, 4200);
}
export const limpiarLunaRoja = (g) => { g.lunaOla = null; };
export function pruebaLunaRoja(g) {
  g.lunaRojaPrueba = true; g.time = 0.62;
  g.meta.lunaRojaOlas = { dia: g.day || 1, ola: 0, total: 0, matadas: 0, t: 3 }; g.meta.lunaRojaHecha = 0;
  return 'Luna roja de prueba: en 3 segundos, la primera oleada (son cinco, una cada 70 s)';
}
