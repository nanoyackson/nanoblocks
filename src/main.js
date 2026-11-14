// Punto de entrada: arma el arte, el sonido, el juego y la interfaz, y arranca el bucle.
import * as THREE from 'three';
import { buildAtlas, loadSprites } from './textures.js';
import { Audio } from './audio.js';
import { Game } from './game.js';
import { UI } from './ui.js';
import { loadSettings } from './save.js';
import { Regulador } from './regulador.js';
import { costo } from './medidor.js';
import { iniciarPwa } from './pwa.js';

THREE.ColorManagement.enabled = false;
// v12.4.3 (seguridad, A2): sin `onerror` en línea (la CSP no deja JavaScript en el HTML): un retrato de jefe que no carga se quita aquí
document.addEventListener('error', (e) => { const t = e.target; if (t && t.classList && t.classList.contains('etapa-jefe')) t.remove(); }, true);

buildAtlas();
iniciarPwa(); // v12.9.0: manifest, instalar y service worker (solo en producción); el juego va igual sin esto
const settings = loadSettings();
const audio = new Audio();
audio.setVolume(settings.volume);
const game = new Game(document.getElementById('game'), audio, settings);
let ui = null;
// Los sprites de los ítems se cargan antes de armar la interfaz (los íconos los necesitan).
loadSprites().then(() => {
  ui = new UI(game, audio, settings);
  game.ui = ui;
  // Acceso para depurar desde la consola del navegador.
  ui.regulador = new Regulador(game, ui); // v12.5.0
  window.nanoblocks = { game, ui, costo: (clave, n) => costo(game, clave, n) };
});

let last = performance.now();
let frames = 0, fpsT = 0;
function frame(now) {
  const crudo = now - last; // v12.5.0: el intervalo de verdad, para el regulador
  const dt = Math.min(0.05, crudo / 1000);
  last = now;
  if (ui && ui.regulador) ui.regulador.cuadro(crudo, now);
  frames++; fpsT += dt;
  if (fpsT >= 1) { game.fps = frames; frames = 0; fpsT = 0; }
  requestAnimationFrame(frame);
  // un error en un cuadro no debe congelar el juego: se anota y se sigue con el próximo
  const t0 = performance.now();
  try { if (game.running && ui) game.update(dt); } catch (err) { if (!frame.warned) { frame.warned = true; console.error(err); } }
  game.msCuadro = (game.msCuadro || 0) * 0.9 + (performance.now() - t0) * 0.1; // v12.0.0: lo que tarda el cuadro (CPU y envío a la GPU)
}
requestAnimationFrame(frame);

// Guardar al cerrar la pestaña (lo que alcance).
window.addEventListener('beforeunload', () => { if (game.running) { game.recogerUnicos(); game.save(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden && game.running) game.save(); });
