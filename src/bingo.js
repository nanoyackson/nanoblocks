// El bingo de la iglesia: los sábados, la beata del pueblo vende el cartón (2 colones). Se abre el salón parroquial:
// la señora canta los números («¡B-7, el siete de la suerte!»), uno marca en el cartón y, cuando completa una línea,
// grita ¡BINGO! Si se equivoca, «falso bingo» y la gente se ríe; si se duerme, gana Doña Chepa.
import { decir } from './misiones.js';

const COLON = 360;
const PREMIOS = [
  { id: 397, n: 3, txt: 'tres chicharrones' }, { id: COLON, n: 20, txt: '20 colones' }, { id: 353, n: 4, txt: 'cuatro tamales' },
  { id: 260, n: 1, txt: '¡un diamante! (donado por un feligrés misterioso)' }, { id: 421, n: 3, txt: 'tres cafés con leche' },
  { id: 444, n: 1, txt: 'un mapa del tesoro (nadie sabe de quién era)' }, { id: 375, n: 2, txt: 'dos guaros (para la tos)' },
];
const DICHOS = { 1: 'el solitario', 7: 'el siete de la suerte', 13: 'el de la mala suerte', 15: 'la niña bonita', 22: 'los dos patitos', 33: 'la edad de Cristo', 44: 'las sillitas', 69: 'el que no se dice en misa', 75: 'el último' };
const LETRA = (n) => 'BINGO'[Math.floor((n - 1) / 15)];
export const sabado = (g) => ((g.day || 1) % 7) === 6;

function carton() {
  const c = [];
  for (let col = 0; col < 5; col++) {
    const pool = Array.from({ length: 15 }, (_, i) => col * 15 + i + 1);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    c.push(pool.slice(0, 5));
  }
  c[2][2] = 0; // casilla libre
  return c; // c[col][fila]
}

export function bingoInteract(m, g) {
  if (m.data.role !== 'beata') return false;
  if (!sabado(g)) return false;
  if (g.mode === 'survival') {
    if (g.inventory.count(COLON) < 2) { decir(g, m, 'El cartón del bingo vale 2 colones, mi cielo. Es para el techo de la iglesia.', 3.5); return true; }
    g.inventory.remove(COLON, 2);
  }
  decir(g, m, '¡Pase al salón! Ya vamos a empezar a cantar.', 3);
  abrir(g);
  return true;
}

// también la usa tools/escenas-ui.js para la captura
export function abrir(g) {
  const ui = g.ui;
  const B = { carton: carton(), marcas: new Set([0]), cantados: [], quedan: Array.from({ length: 75 }, (_, i) => i + 1), fin: false };
  for (let i = B.quedan.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [B.quedan[i], B.quedan[j]] = [B.quedan[j], B.quedan[i]]; }
  B.rival = 22 + Math.floor(Math.random() * 14); // Doña Chepa canta bingo después de tantos números
  g.bingo = B;
  ui.state = 'bingo'; g.paused = true; ui.exitLock(); g.releaseAll && g.releaseAll();
  const el = document.createElement('div');
  el.id = 'bingo';
  el.innerHTML = `<div class="bingo-caja"><h2>Bingo de la iglesia</h2><div class="bingo-canto">Ya va a empezar…</div>
    <div class="bingo-carton">${'BINGO'.split('').map((l) => `<b>${l}</b>`).join('')}${[0, 1, 2, 3, 4].map((f) => [0, 1, 2, 3, 4].map((c) => {
    const n = B.carton[c][f];
    return `<button data-n="${n}" class="${n ? '' : 'libre marcada'}">${n || '★'}</button>`;
  }).join('')).join('')}</div>
    <div class="bingo-cantados"></div>
    <div class="bingo-botones"><button class="bingo-grito">¡BINGO!</button><button class="bingo-salir">Salir</button></div>
    <small>Marque los números que cante la señora. Línea, columna o diagonal completa = ¡BINGO!</small></div>`;
  document.body.appendChild(el);
  el.querySelectorAll('.bingo-carton button[data-n]').forEach((b) => b.addEventListener('click', () => {
    const n = Number(b.dataset.n);
    if (!n || B.fin) return;
    if (!B.cantados.includes(n)) { b.classList.add('mal'); setTimeout(() => b.classList.remove('mal'), 400); return; }
    B.marcas.add(n); b.classList.add('marcada');
    g.audio.play('click', { ui: true, vol: 0.4, pitch: 1.4 });
  }));
  el.querySelector('.bingo-grito').addEventListener('click', () => grito(g));
  el.querySelector('.bingo-salir').addEventListener('click', () => cerrar(g));
  B.timer = setInterval(() => cantar(g), 2600);
  B.tecla = (e) => { if (e.code === 'Escape') { e.stopPropagation(); cerrar(g); } };
  window.addEventListener('keydown', B.tecla, true);
  g.achieve('bingo', 'Noche de bingo');
}

function cantar(g) {
  const B = g.bingo;
  if (!B || B.fin) return;
  const n = B.quedan.pop();
  B.cantados.push(n);
  const el = document.getElementById('bingo');
  if (!el) return;
  const dicho = DICHOS[n] ? `, ${DICHOS[n]}` : '';
  const canto = el.querySelector('.bingo-canto');
  canto.textContent = `¡${LETRA(n)}-${n}${dicho}!`;
  canto.classList.remove('nuevo'); void canto.offsetWidth; canto.classList.add('nuevo');
  el.querySelector('.bingo-cantados').innerHTML = B.cantados.slice(-14).map((k) => `<span>${LETRA(k)}${k}</span>`).join('');
  g.audio.play('click', { ui: true, vol: 0.5, pitch: 0.8 });
  if (B.cantados.length >= B.rival) {
    terminar(g, '😩 «¡BINGO!» gritó Doña Chepa desde la primera fila. Otra vez ella… (dicen que tiene pacto)', false);
  }
}

function linea(B) {
  const ok = (c, f) => B.marcas.has(B.carton[c][f]);
  for (let i = 0; i < 5; i++) {
    if ([0, 1, 2, 3, 4].every((f) => ok(i, f))) return true;
    if ([0, 1, 2, 3, 4].every((c) => ok(c, i))) return true;
  }
  return [0, 1, 2, 3, 4].every((k) => ok(k, k)) || [0, 1, 2, 3, 4].every((k) => ok(k, 4 - k));
}

function grito(g) {
  const B = g.bingo;
  if (!B || B.fin) return;
  if (!linea(B)) {
    g.ui.toast('🤭 ¡Falso bingo! Todo el salón se ríe… y la señora le hace mala cara', 2400);
    g.audio.play('aplausos', { ui: true, vol: 0.25, pitch: 1.4 });
    g.achieve('falso_bingo', 'Falso bingo');
    return;
  }
  const P = PREMIOS[Math.floor(Math.random() * PREMIOS.length)];
  g.giveItem(P.id, P.n);
  g.audio.play('aplausos', { ui: true, vol: 0.6 });
  g.meta.bingos = (g.meta.bingos || 0) + 1;
  g.achieve('bingo_ganado', '¡BINGO!');
  if (g.meta.bingos >= 3) g.achieve('bingo3', 'Mano santa en el bingo');
  terminar(g, `🎉 ¡BINGO! Se ganó ${P.txt}`, true);
}

function terminar(g, txt, gano) {
  const B = g.bingo;
  B.fin = true;
  clearInterval(B.timer);
  const el = document.getElementById('bingo');
  if (el) { el.querySelector('.bingo-canto').textContent = txt; el.classList.add(gano ? 'gano' : 'perdio'); }
  g.ui.toast(txt, 3400);
}

export function tickBingo(g) {
  if (!sabado(g) || g.dim !== 'tierra' || g.daylight < 0.4 || g.meta.bingoAviso === g.day) return;
  const p = g.player.body.pos, v = g.nearestVillage(p.x, p.z);
  if (v && v.dist < 50) { g.meta.bingoAviso = g.day; g.ui.toast('🎱 Hoy sábado hay bingo en la iglesia: hable con la beata para comprar el cartón', 3600); }
}

export function cerrar(g) {
  const B = g.bingo;
  if (B) { clearInterval(B.timer); window.removeEventListener('keydown', B.tecla, true); }
  g.bingo = null;
  const el = document.getElementById('bingo');
  if (el) el.remove();
  if (g.ui.state === 'bingo') g.ui.resume();
}
