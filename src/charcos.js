// Charcos en los huecos: cuando llueve, los huecos de la carretera cercanos se van llenando de agua (de abajo para
// arriba, sin rebalsarse a la calle); con el sol se secan poco a poco. El carro los sigue sintiendo igual.
import { BLOCK_BY_KEY as K, SOLID } from './blocks.js';

// ¿se puede llenar esta celda sin que el agua se riegue? (las cuatro de al lado son sólidas o agua)
function encerrada(w, x, y, z) {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const id = w.getBlock(x + dx, y, z + dz);
    if (!SOLID[id] && id !== K.water) return false;
  }
  return true;
}

export function tickCharcos(g) {
  if (g.dim !== 'tierra' || !g.world || !g.weather) return;
  const w = g.world, p = g.player.body.pos;
  const lluvia = g.weather.type !== 'clear' && g.weather.intensity > 0.35;
  g.secoT = lluvia ? 0 : (g.secoT || 0) + 1;
  if (!lluvia && g.secoT < 40) return;
  // unas cuantas columnas al azar alrededor del jugador
  for (let k = 0; k < (lluvia ? 40 : 20); k++) {
    const x = Math.floor(p.x + (Math.random() - 0.5) * 48), z = Math.floor(p.z + (Math.random() - 0.5) * 48);
    if (!w.isLoaded(x, z)) continue;
    for (let y = Math.floor(p.y) + 8; y > Math.floor(p.y) - 10; y--) {
      if (w.getBlock(x, y, z) !== K.fondo_hueco) continue;
      if (lluvia) {
        // el primer hueco de aire encima (subiendo por el agua que ya haya)
        let yy = y + 1;
        while (w.getBlock(x, yy, z) === K.water && yy < y + 3) yy++;
        if (yy <= y + 2 && w.getBlock(x, yy, z) === 0 && encerrada(w, x, yy, z) && Math.random() < 0.35) {
          w.setBlock(x, yy, z, K.water);
          if (!g.achievements.has('charco') && Math.hypot(x - p.x, z - p.z) < 12) { g.ui.toast('🌧 Con este aguacero los huecos ya son piscinas', 2400); g.achieve('charco', 'Piscina en la calle'); }
        }
      } else {
        // se seca: primero el agua de más arriba
        let top = y;
        while (w.getBlock(x, top + 1, z) === K.water && top < y + 2) top++;
        if (top > y && Math.random() < 0.25) w.setBlock(x, top, z, 0);
      }
      break;
    }
  }
}
