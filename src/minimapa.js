// Minimapa: una ventanita arriba a la izquierda con el mapa alrededor del jugador (biomas, caminos, lugares,
// marcadores y la flecha). Se refresca cada segundo y se prende o apaga con la tecla del minimapa (O).
import { drawMap } from './mapa.js';

export function tickMinimapa(g, dt) {
  const on = g.settings.minimapa !== false && !g.hudHidden && !g.foto && g.dim !== 'inframundo' && g.world;
  let cv = document.getElementById('minimapa');
  if (!cv) {
    cv = document.createElement('canvas'); cv.id = 'minimapa'; cv.width = 150; cv.height = 150;
    document.getElementById('hud').appendChild(cv);
  }
  cv.style.display = on ? '' : 'none';
  if (!on) return;
  g.miniT = (g.miniT || 0) - dt;
  if (g.miniT > 0) return;
  g.miniT = 0.5;
  drawMap(cv, g, 2, 2, { sinEtiquetas: true });
}
export function toggleMinimapa(g) {
  g.settings.minimapa = g.settings.minimapa === false;
  if (g.ui.guardarAjustes) g.ui.guardarAjustes();
  g.ui.toast(g.settings.minimapa ? '🗺 Minimapa prendido' : '🗺 Minimapa apagado', 1200);
}
