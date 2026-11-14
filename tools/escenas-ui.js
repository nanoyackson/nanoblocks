// Escenas para revisar la interfaz (v11.12.3): arma un mundo de prueba con objetos, una mesa y un cofre al lado, y abre cada
// pantalla para tomarle captura. Uso en la consola (con `npm run dev`):
//   const E = await import('/tools/escenas-ui.js'); await E.preparar(); await E.abrir('cofre')
// Pantallas: 'hud', 'inventario', 'mesa', 'cofre', 'baul', 'horno', 'tienda', 'chanchito', 'mapa', 'libreta', 'libreta:<hoja>', 'pausa',
// 'muerte', 'dialogo', 'mundos', 'nuevo', 'novedades', 'ajustes', 'menu'.
// Al final, (await import('/tools/bot-pelea.js')).borrarPruebas() borra el mundo.
import { mundoDePrueba } from './bot-pelea.js';

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
let P = null;
export async function preparar() {
  const { ui } = window.nanoblocks;
  ui.hideScreens();
  await mundoDePrueba();
  const g = window.nanoblocks.game;
  g.mode = 'survival';
  for (let k = 0; k < 9; k++) { await espera(1000); for (let i = 0; i < 60; i++) g.update(1 / 60); }
  const { ITEMS, ARTE, BLOCK_BY_KEY: K } = await import('/src/blocks.js');
  const ids = ARTE.map((k) => (Object.values(ITEMS).find((x) => x && x.key === k) || {}).id).filter(Boolean);
  ids.slice(0, 30).forEach((id, i) => { g.inventory.slots[i + 3] = { id, count: 1 + ((i * 5) % 20), dur: ITEMS[id].durability }; });
  g.inventory.slots[0] = { id: 314, count: 1, dur: ITEMS[314].durability };
  g.inventory.slots[1] = { id: 42, count: 16 };
  g.inventory.add(360, 25);
  g.inventory.changed();
  const w = g.world, p = g.player.body.pos, x = Math.floor(p.x), y = Math.floor(p.y) + 3, z = Math.floor(p.z);
  const poner = (dx, key) => { w.setBlock(x + dx, y, z, K[key]); g.stations.placed(K[key], x + dx, y, z, 0, true); };
  poner(1, 'table'); poner(2, 'chest'); poner(3, 'baul'); poner(4, 'furnace'); poner(5, 'chanchito');
  const be = w.getBE(x + 2, y, z);
  for (let i = 0; i < 14; i++) be.slots[i] = { id: 263 + (i % 12), count: 3 + i };
  P = { x, y, z };
  return P;
}
// v11.13.5: cartas, estampas y logros de muestra para capturar la libreta llena (en el mundo de prueba)
async function datosLibreta(g) {
  const H = (g.meta.hist ||= {});
  if (!H.cartas || H.cartas.length < 3) H.cartas = [0, 1, 2];
  const A = await import('/src/album.js');
  if (A.albumTexto(g) < 8) for (let k = 0; k < 4; k++) A.abrirSobre(g);
  for (const [id, n] of [['mapa', 'Cartógrafo'], ['hervir', 'Agua hervida, como manda la abuela'], ['destino', 'Con rumbo']]) g.achieve(id, n);
}
export async function abrir(cual) {
  const { ui, game: g } = window.nanoblocks;
  if (ui.shop) ui.closeShop();
  if (ui.state === 'inventory') ui.closeInventory();
  if (ui.state === 'map') ui.closeMap();
  if (ui.state === 'libreta') ui.closeLibreta();
  if (ui.state === 'paused') ui.resume();
  await espera(300);
  ui.state = 'playing';
  const { x, y, z } = P;
  if (cual === 'inventario') ui.openInventory();
  else if (cual === 'mesa') ui.openStation('crafting', x + 1, y, z);
  else if (cual === 'cofre') ui.openStation('chest', x + 2, y, z);
  else if (cual === 'baul') ui.openStation('chest', x + 3, y, z);
  else if (cual === 'horno') ui.openStation('furnace', x + 4, y, z);
  else if (cual === 'chanchito') ui.openStation('chest', x + 5, y, z);
  else if (cual === 'tienda') ui.openShop({ data: { role: 'pulpero', name: 'Pulpero' }, kind: { name: 'x' }, body: { pos: g.player.body.pos } });
  else if (cual === 'mapa') ui.openMap();
  else if (cual === 'libreta') ui.openLibreta('ayuda');
  else if (cual === 'pausa') ui.pause();
  else if (cual === 'muerte') ui.showDeath('Prueba: se cayó de muy alto');
  else if (cual === 'dialogo') ui.dialog('Abuela Zenaida', '¡Ay, mijo! Qué gusto verlo por aquí. Pase, que hay café chorreado y gallo pinto.', 8000);
  else if (cual.startsWith('libreta:')) { await datosLibreta(g); ui.openLibreta(cual.slice(8)); }
  else if (cual === 'bingo') { const B = await import('/src/bingo.js'); B.abrir(g); for (let k = 0; k < 6; k++) { const n = g.bingo.quedan.pop(); g.bingo.cantados.push(n); } }
  else if (['mundos', 'nuevo', 'novedades', 'ajustes', 'menu'].includes(cual)) { ui.state = 'menu'; ui.show({ mundos: 'worlds', nuevo: 'new', novedades: 'news', ajustes: 'settings', menu: 'menu' }[cual]); }
  for (let i = 0; i < 5; i++) g.update(1 / 60);
  await espera(600);
  // en una pestaña de fondo las animaciones de entrada quedan a medias: para la captura se terminan de una vez
  document.querySelectorAll('.screen.on, .screen.on *').forEach((el) => { el.style.animation = 'none'; el.style.transition = 'none'; });
  document.querySelectorAll('.screen.on').forEach((el) => { el.style.opacity = '1'; });
  await espera(200);
  return ui.state;
}
