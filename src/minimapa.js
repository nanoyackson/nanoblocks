// Minimapa: una ventanita arriba a la izquierda con el mapa alrededor del jugador (biomas, caminos, lugares,
// marcadores y la flecha). Se refresca cada segundo y se prende o apaga con la tecla del minimapa (O).
import { drawMap } from './mapa.js';
import { ecoActivo } from './cuevacosas.js';

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
  drawMap(cv, g, 2, 6, { sinEtiquetas: true });
  if (g.env && g.env.cave >= 0.5) mapaCueva(cv, g);
}
// v13.3.3: bajo tierra el minimapa muestra la Red Honda (los salones como manchas, las venas como líneas) y a usted. v13.3.4: solo lo ya visitado o a ≤ 40 bloques;
// con el Cristal de eco, todo lo que esté a ≤ 120 bloques durante 20 s (parpadea)
function mapaCueva(cv, g) {
  const gen = g.world.gen;
  if (g.dim !== 'tierra' || !gen || gen.version < 26 || !gen.v2 || !gen.v2.cmNodo) return;
  const c = cv.getContext('2d'), p = g.player.body.pos, S = 2, W = cv.width, H = cv.height;
  const px = (x) => W / 2 + (x - p.x) / S, pz = (z) => H / 2 + (z - p.z) / S;
  c.save();
  c.fillStyle = 'rgba(8,6,14,0.78)'; c.fillRect(0, 0, W, H);
  const gx = Math.floor(p.x / 96), gz = Math.floor(p.z / 96);
  const todos = [], vistos = new Set(g.meta.salonesVistos || []), eco = ecoActivo(g), radio = eco ? 120 : 40;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) todos.push(gen.v2.cmNodo(gx + dx, gz + dz));
  const visible = (n) => vistos.has(n.gx + ',' + n.gz) || Math.hypot(n.x - p.x, n.z - p.z) < radio + (n.salon ? Math.max(n.rx, n.rz) : 0);
  const nodos = todos.filter(visible);
  c.strokeStyle = 'rgba(120,200,255,0.55)'; c.lineWidth = 1.5;
  for (const n of nodos) for (const m of nodos) {
    if (n === m || (n.gx + n.gz) > (m.gx + m.gz)) continue;
    const dx = Math.abs(n.gx - m.gx), dz = Math.abs(n.gz - m.gz);
    if (dx + dz !== 1) continue;
    if (!nodos.includes(m)) continue;
    c.beginPath(); c.moveTo(px(n.x), pz(n.z)); c.lineTo(px(m.x), pz(m.z)); c.stroke();
  }
  for (const n of nodos) {
    if (n.salon) { c.fillStyle = 'rgba(170,140,255,0.45)'; c.beginPath(); c.ellipse(px(n.x), pz(n.z), n.rx / S, n.rz / S, 0, 0, 6.283); c.fill(); }
    c.fillStyle = '#ffd24a'; c.fillRect(px(n.x) - 1.5, pz(n.z) - 1.5, 3, 3);
  }
  c.fillStyle = '#fff'; c.beginPath(); c.arc(W / 2, H / 2, 3, 0, 6.283); c.fill();
  c.restore();
}
export function toggleMinimapa(g) {
  g.settings.minimapa = g.settings.minimapa === false;
  if (g.ui.guardarAjustes) g.ui.guardarAjustes();
  g.ui.toast(g.settings.minimapa ? '🗺 Minimapa prendido' : '🗺 Minimapa apagado', 1200);
}
