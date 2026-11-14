// «Se busca»: cada tres mañanas, en la pulpería pegan un cartel con una criatura que anda haciendo daño por la zona y lo que pagan
// por ella. Le da un motivo para salir a buscar a los bravos (el Toro Guaco, el chupacabras, los Chatas…) y plata para el que se anime.
// Estado: meta.sebusca = { tipo, falta, premio, vence } (o null), meta.sebuscaDia, meta.sebuscaHechos.
import { difOf } from './supervivencia.js';

const COLON = 360, ESENCIA = 499;
// tipo, desde qué día, cuántos, premio en colones, y el texto del cartel
export const CARTELES = [
  // v11.10.6: premios a la escala medida (₡10 000–22 500 más lo que suba con los días)
  ['chata', 2, 2, 25, 'los Chatas que asaltan en la carretera de noche'],
  ['becquer', 2, 1, 22, 'una bécquer que se hace la muerta como un tronco en la selva'],
  ['chupacabras', 3, 1, 30, 'el chupacabras que anda matando gallinas en los potreros'],
  ['mico_malo', 3, 1, 20, 'el Mico Malo que le roba a la gente que pasa por el bosque'],
  ['puma', 3, 1, 28, 'un puma que anda rondando las fincas de la montaña'],
  ['toro_guaco', 4, 1, 45, 'el Toro Guaco que espanta el ganado en los llanos de Guanacaste'],
  ['cuche_monte', 5, 1, 35, 'un cuche de monte que se le tiró a un peón'],
];
const del = (t) => (t === 'chata' ? 'de los Chatas' : t === 'becquer' ? 'de la bécquer' : `del ${NOMBRE[t]}`);
const NOMBRE = { chata: 'Chatas', becquer: 'bécquer', chupacabras: 'chupacabras', mico_malo: 'Mico Malo', puma: 'puma', toro_guaco: 'Toro Guaco', cuche_monte: 'cuche de monte' };
function poner(g, forzar) {
  const M = g.meta, dia = g.day || 1;
  const posibles = CARTELES.filter(([, desde]) => dia >= desde);
  if (!posibles.length) return null;
  const [tipo, , falta, premio, texto] = forzar ? (CARTELES.find((c) => c[0] === forzar) || posibles[0]) : posibles[Math.floor(Math.random() * posibles.length)];
  M.sebusca = { tipo, falta, premio: premio + Math.min(20, Math.floor(dia / 3) * 2), vence: dia + 4 };
  M.sebuscaDia = dia;
  g.ui.toast(`📜 En la pulpería pegaron un «Se busca»: ${texto}. Pagan ₡${M.sebusca.premio} (está en la hoja de la partida)`, 5200);
  g.audio.play('inv.open', { ui: true, vol: 0.5 });
  return M.sebusca;
}
// cada segundo
export function tickRecompensas(g) {
  if (g.mode !== 'survival' || !g.meta || g.dim !== 'tierra') return;
  const M = g.meta, dia = g.day || 1, t = g.time || 0;
  const S = M.sebusca;
  if (S && dia > S.vence) { M.sebusca = null; g.ui.toast(`📜 Quitaron el cartel ${del(S.tipo)}: nadie cobró la recompensa`, 2600); return; }
  if (S || dia < 2 || (M.sebuscaDia || 0) + 3 > dia || t < 0.03 || t > 0.25) return;
  if (!g.settings.hostiles || !difOf(g).hostiles) return;
  poner(g);
}
// lo llama killedMob
export function recompensaBaja(g, m) {
  const S = g.meta && g.meta.sebusca;
  if (!S || m.type !== S.tipo || g.mode !== 'survival') return;
  const p = g.player.body.pos;
  if (Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) > 32) return; // tiene que ser cosa de uno (o de los suyos, cerca)
  S.falta--;
  if (S.falta > 0) { g.ui.toast(`📜 Uno menos. ${S.falta === 1 ? 'Falta 1' : `Faltan ${S.falta}`} para cobrar el «Se busca»`, 2000); return; }
  g.meta.sebusca = null;
  g.giveItem(COLON, S.premio);
  if (Math.random() < 0.5) g.giveItem(ESENCIA, 1);
  g.meta.sebuscaHechos = (g.meta.sebuscaHechos || 0) + 1;
  g.audio.play('monedas', { ui: true, vol: 0.8 });
  g.ui.toast(`📜 ¡Cobró el «Se busca» ${del(S.tipo)}! ₡${S.premio} de recompensa`, 3600);
  g.achieve('sebusca', 'Se busca… y se encontró');
  if (g.meta.sebuscaHechos >= 5) g.achieve('sebusca5', 'Cazarrecompensas del cantón');
}
// para la hoja de la partida
export function sebuscaTexto(g) {
  const S = g.meta && g.meta.sebusca;
  if (!S) return null;
  const quedan = S.vence - (g.day || 1);
  return `📜 Se busca: ${S.falta > 1 ? `${S.falta} ` : ''}${NOMBRE[S.tipo]} (₡${S.premio}). ${quedan <= 0 ? 'Hoy quitan el cartel' : quedan === 1 ? 'Queda hasta mañana' : `Quedan ${quedan} días`}`;
}
export function pruebaSebusca(g, tipo) {
  g.meta.sebusca = null;
  const S = poner(g, tipo);
  return S ? `Se busca: ${NOMBRE[S.tipo]} (₡${S.premio}). Con /prueba bravos ${S.tipo} sale uno delante` : 'Todavía no hay carteles (desde el día 2)';
}
