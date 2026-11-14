// Atajos configurables: qué tecla hace cada cosa (se cambian en Ajustes → Teclas). El movimiento (W/A/S/D, Espacio,
// Shift, Ctrl) y Esc quedan fijos.
export const ACCIONES = [
  ['inventario', 'Inventario', 'KeyE'],
  ['mapa', 'Mapa', 'KeyM'],
  ['minimapa', 'Minimapa (prender/apagar)', 'KeyO'],
  ['ruta', 'Ruta del aventurero', 'KeyJ'],
  ['logros', 'Logros', 'KeyL'],
  ['habilidades', 'Habilidades', 'KeyH'],
  ['bestiario', 'Bestiario', 'KeyK'],
  ['diario', 'Diario', 'KeyN'],
  ['cartas', 'Cartas de la abuela', 'KeyC'],
  ['manas', 'Mañas', 'KeyU'],
  ['ayuda', 'Ayuda', 'KeyY'],
  ['album', 'Álbum de estampas', 'KeyI'],
  ['marca', 'Marcar punto (Shift: marcador)', 'KeyB'],
  ['comer', 'Comer rápido (mantener)', 'KeyG'],
  ['antorcha', 'Poner antorcha', 'KeyX'],
  ['soltar', 'Soltar objeto', 'KeyQ'],
  ['cargado', 'Golpe cargado', 'KeyF'],
  ['voltereta', 'Voltereta', 'KeyV'],
  ['deslizada', 'Barrerse (también Ctrl + Espacio)', 'KeyZ'],
  ['enfoque', 'Fijar enemigo', 'KeyR'],
  ['camara', 'Cambiar cámara', 'KeyP'],
  ['foto', 'Modo foto', 'F2'],
  ['consola', 'Consola de comandos', 'KeyT'],
];
const DEF = Object.fromEntries(ACCIONES.map(([k, , t]) => [k, t]));
export const tecla = (settings, accion) => (settings && settings.teclas && settings.teclas[accion]) || DEF[accion];
export const es = (settings, accion, code) => code === tecla(settings, accion);

export function nombreTecla(code) {
  if (!code) return '—';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  const N = { Space: 'Espacio', ShiftLeft: 'Shift izq.', ShiftRight: 'Shift der.', ControlLeft: 'Ctrl izq.', ControlRight: 'Ctrl der.', AltLeft: 'Alt', Tab: 'Tab', Enter: 'Enter', Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Semicolon: 'Ñ', Quote: "'", Comma: ',', Period: '.', Slash: '/' };
  return N[code] || code;
}
const FIJAS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'Escape', 'F1', 'F3', 'F5']);

// la parte de Ajustes: una fila por acción; clic y después la tecla nueva
export function pintarTeclas(ui) {
  const box = document.getElementById('s-teclas');
  if (!box) return;
  const s = ui.settings;
  box.innerHTML = '<div class="teclas-tit">Teclas <small>(clic en una y después la tecla nueva; Esc cancela)</small></div>';
  for (const [k, nombre] of ACCIONES) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tecla-fila';
    b.innerHTML = `<span>${nombre}</span><b>${nombreTecla(tecla(s, k))}</b>`;
    b.addEventListener('click', () => {
      b.querySelector('b').textContent = '…';
      ui.capturaTecla = (code) => {
        ui.capturaTecla = null;
        if (code !== 'Escape') {
          if (FIJAS.has(code)) { ui.toast('Esa tecla está reservada (movimiento o pantalla)', 1600); }
          else {
            s.teclas = { ...(s.teclas || {}) };
            // si otra acción usaba esa tecla, se intercambian
            for (const [k2] of ACCIONES) if (k2 !== k && tecla(s, k2) === code) s.teclas[k2] = tecla(s, k);
            s.teclas[k] = code;
            ui.guardarAjustes && ui.guardarAjustes();
          }
        }
        pintarTeclas(ui);
      };
    });
    box.appendChild(b);
  }
  const r = document.createElement('button'); r.type = 'button'; r.className = 'tecla-reset'; r.textContent = 'Volver a las teclas de siempre';
  r.addEventListener('click', () => { s.teclas = {}; ui.guardarAjustes && ui.guardarAjustes(); pintarTeclas(ui); });
  box.appendChild(r);
}
