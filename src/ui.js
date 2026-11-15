// Interfaz: menús, HUD, inventario, crafteo, comandos y control del mouse.
import { pwa } from './pwa.js';
import { conocidas, repDe, factorRep, estrellas } from './saberes.js';
import { factorDia, flecha, COSECHAS, diaDeFeria } from './economia.js';
import { calmaActiva } from './calma.js';
import { Locutor } from './locutor.js';
import { extraVentas } from './fiestas2.js';
import { es, pintarTeclas } from './teclas.js';
import { ponerMarcador, borrarMarcadorEn } from './diario.js';
import { STRUCT_NAMES, structuresNear, inicioCompacto } from './estructuras.js';
import { deathTip, todosBolsos } from './supervivencia.js';
import { iconURL, tileCanvas } from './textures.js';
import { getDef, itemName, maxStack, creativeCatalog, BLOCKS, ITEMS, isBlockId } from './blocks.js';
import { SLOTS, extras, juntar } from './inventory.js';
import { aColones, fmtUnidades, esPlata, fmtColones, VALOR, PIEZAS, K as UNIDAD, precioBonito, sinSimbolo } from './plata.js';
import { escogerMana, pendientes } from './manas.js';
import { cambiarRepetidas } from './album.js';
import { marcaExpediente } from './expediente.js';
import { marcaRescate } from './gente.js';
import { marcasEncargos } from './encargos.js';
import { marcaArchivo } from './archivo.js';
import { marcaQuema } from './quema.js';
import { marcaMarabunta } from './marabunta.js';
import { marcaPlaga } from './plaga.js';
import { marcaGoleta } from './goleta.js';
import { marcaMinaOro } from './minaoro.js';
import { marcaFurtivos } from './furtivos.js';
import { marcaAsalto } from './asalto.js';
import { reparacion, fichaItem, fijarReceta, comerRapido, antorchaRapida, traerReceta, cofresDeCasa } from './comodidad.js';
import { ordenCategoria, categoria, categoriaDeNombre, nombreCategoria, iconoCategoria, CATEGORIAS } from './categorias.js';
import { marcaHistoria } from './historia.js';
import { nidoMasCercano } from './nidos.js';
import { puntoEscondite } from './reliquias.js';
import { alFabricar, ventaja } from './progreso.js';
import { RECIPES, findRecipe, ingredients, layout, fitsIn, SMELT, FUEL, COOK_TIME, modoDe } from './recipes.js';
import { puedeTaller, alFabricarTaller, cobrarCaja, lenaTaller, nivelDe, OFICIOS } from './oficios2.js';
import { listWorlds, loadWorld, deleteWorld, exportWorld, importWorld, newWorldId, saveSettings, DEFAULT_SETTINGS, compatibilidad, descargarRespaldo } from './save.js';
import { Generator } from './worldgen.js';
import { hashString } from './noise.js';
import { GAME_VERSION, CHANGELOG, CREDITS } from './version.js';
import { SHOPS, COLON } from './pueblo.js';
import { drawMap, CAPAS_MAPA, cuentaMapa } from './mapa.js';
import { flagsDe } from './atmosfera.js';
import { gastarLenaFogon, lenaFogon, revisarCofre } from './despensa.js';
const NOMBRE_CALIDAD = { bajo: 'Bajo', medio: 'Medio', alto: 'Alto', ultra: 'Ultra', personalizado: 'Personalizado' };
const NOTA_CALIDAD = {
  bajo: 'Lo más liviano, para computadoras modestas (se ve como antes de la hora dorada).',
  medio: 'La de fábrica. Hora dorada: tono y color según la hora, niebla de altura con la luz del sol y cielo mejorado.',
  alto: 'Lo de Medio más la bruma de cada bioma (selva húmeda, desierto, páramo, costa).',
  ultra: 'Por ahora igual que Alto; aquí van a llegar el agua, el brillo de las luces y las sombras.',
  personalizado: 'Escoja cada efecto a mano.',
};
import { Vestidor } from './vestidor.js';
import { CAMISAS, PIELES, PELOS } from './personaje.js';
import { comprasMolienda } from './finca2.js';
import { cupoUsado, pagarConCupo, CUPO_DIA } from './encargos2.js';
import { textoMedidor } from './medidor.js';
import { pedirPersistencia, textoAlmacen, marcarMundos, mundosMarcados } from './respaldo.js';
// el fiado: más plata entre mejor lo conozcan en el pueblo; cinco días de plazo; si se atrasa, queda de moroso hasta que pague
function montoFiado(g, mob) { const r = repDe(g, mob) || 0; return 10 + Math.max(0, Math.min(4, Math.floor(r / 5))) * 5; }
function saldarFiado(g, mob, ui) {
  const M = g.meta, tarde = (g.day || 1) - (M.fiadoDia || g.day || 1) > 5, pidio = M.fiadoDia;
  delete M.fiado; delete M.fiadoDia;
  if (M.fiadoMoroso || tarde) { M.fiadoMoroso = false; ui.dialog(mob.data.name, 'Bueno… tarde, pero pagó. Le borro lo de moroso, pero que no se repita.'); }
  else { ui.dialog(mob.data.name, '¡Listo, cuenta saldada! Usted es de fiar.'); if (pidio !== (g.day || 1)) { M.fiadosPagados = (M.fiadosPagados || 0) + 1; g.achieve('fiado', 'Pagué lo fiado'); if (M.fiadosPagados >= 3) g.achieve('fiado3', 'Cliente de confianza'); } }
}

const $ = (sel) => document.querySelector(sel);

const SPLASHES = [
  '¡Hecho 100% con IA!', '¡Pura vida!', '¡Ahora con dantas!', '¡Cuidado con las Sombras!', '¡Guardado automático!',
  '¡Bloques infinitos!', '¡Dinamita incluida!', '¡Gallo pinto craftable!', '¡Versión ' + GAME_VERSION + '!', '¡Sin errores (ojalá)!',
];

// ---------- íconos pixel del HUD ----------
function pixelIcon(rows, palette) {
  const c = document.createElement('canvas');
  c.width = 9; c.height = 9;
  const ctx = c.getContext('2d');
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (palette[ch]) { ctx.fillStyle = palette[ch]; ctx.fillRect(x, y, 1, 1); }
  }));
  return c.toDataURL();
}
const HEART = ['.XX...XX.', 'XRRX.XRRX', 'XRWRXRRRX', 'XRRRRRRRX', 'XRRRRRRRX', '.XRRRRRX.', '..XRRRX..', '...XRX...', '....X....'];
const HALF = HEART.map((r) => [...r].map((ch, x) => (x > 4 && (ch === 'R' || ch === 'W') ? 'E' : ch)).join(''));
const FOOD = ['.....XXX.', '....XMMMX', '...XMMMMX', '...XMMMMX', '..XMMMMX.', '.XWXXXX..', 'XWWX.....', 'XWX......', '.X.......'];
const FOODHALF = FOOD.map((r) => [...r].map((ch, x) => (x < 5 && ch === 'M' ? 'E' : ch)).join(''));
const BUBBLE = ['..XXXXX..', '.XBBBBBX.', 'XBWBBBBBX', 'XBWBBBBBX', 'XBBBBBBBX', 'XBBBBBBBX', 'XBBBBBBBX', '.XBBBBBX.', '..XXXXX..'];
const DROP = ['....X....', '...XBX...', '..XBBBX..', '.XBWBBBX.', '.XBWBBBX.', 'XBBBBBBBX', 'XBBBBBBBX', '.XBBBBBX.', '..XXXXX..'];
const ARMOR = ['XX.....XX', 'XAXXXXXAX', 'XWAAAAAAX', 'XAAAAAAAX', '.XAAAAAX.', '.XAAAAAX.', '.XAAAAAX.', '..XAAAX..', '...XXX...'];
const IC = {
  heart: pixelIcon(HEART, { X: '#1a0000', R: '#e01b1b', W: '#ffb3b3' }),
  heartHalf: pixelIcon(HALF, { X: '#1a0000', R: '#e01b1b', W: '#ffb3b3', E: '#3a2a2a' }),
  heartEmpty: pixelIcon(HEART, { X: '#1a0000', R: '#3a2a2a', W: '#3a2a2a' }),
  food: pixelIcon(FOOD, { X: '#2a1400', M: '#b5651d', W: '#f1e6d0' }),
  foodHalf: pixelIcon(FOODHALF, { X: '#2a1400', M: '#b5651d', W: '#f1e6d0', E: '#3a2a20' }),
  foodEmpty: pixelIcon(FOOD, { X: '#2a1400', M: '#3a2a20', W: '#3a2a20' }),
  bubble: pixelIcon(BUBBLE, { X: '#0b2a5a', B: '#3a8ee0', W: '#ffffff' }),
  water: pixelIcon(DROP, { X: '#0b2a5a', B: '#3aa0f0', W: '#d8f0ff' }),
  waterHalf: pixelIcon(DROP.map((r) => [...r].map((ch, x) => (x < 4 && (ch === 'B' || ch === 'W') ? 'E' : ch)).join('')), { X: '#0b2a5a', B: '#3aa0f0', W: '#d8f0ff', E: '#2a3440' }),
  waterEmpty: pixelIcon(DROP, { X: '#0b2a5a', B: '#2a3440', W: '#2a3440' }),
  armor: pixelIcon(ARMOR, { X: '#1d1d1d', A: '#c9ccd1', W: '#ffffff' }),
  armorHalf: pixelIcon(ARMOR.map((r) => [...r].map((ch, x) => (x > 4 && (ch === 'A' || ch === 'W') ? 'E' : ch)).join('')), { X: '#1d1d1d', A: '#c9ccd1', W: '#ffffff', E: '#3c3c3c' }),
  armorEmpty: pixelIcon(ARMOR, { X: '#1d1d1d', A: '#3c3c3c', W: '#3c3c3c' }),
};

// lo que dicen los subtítulos según el banco de sonido (los pasos, golpes de bloque y la interfaz no salen)
const CAPTIONS = {
  trueno: 'Trueno', jaguar: 'Jaguar ruge', monstruo: 'Rugido de monstruo', grito: 'Grito', sombra: 'La Sombra susurra', 'sombra.hurt': 'Golpe a la Sombra', cadejos: 'Cadejos gruñe',
  susurro: 'Susurros', pito: 'Pito', 'carro.arranque': 'Carro arrancando', hueco: 'Golpe seco', llanta: 'Llanta revienta', 'bus.freno': 'Frenos del bus', 'bus.puerta': 'Puerta del bus',
  arpia: 'Chillido de la Arpía', rafaga: 'Ráfaga de viento', explode: 'Explosión', fuse: 'Mecha encendida', 'door.open': 'Puerta se abre', 'door.close': 'Puerta se cierra', creak: 'Rechinido',
  'loop.comparsa': 'Tambores de comparsa', 'loop.sirena': 'Canto de la sirena', coyote: 'Coyotes aúllan', ardilla: 'Ardilla chilla', zorro_pelon: 'Zorro pelón sisea', guatusa: 'Guatusa chilla', arena: 'Arena (cavando)',
  vaca: 'Vaca muge', caballo: 'Caballo', relincho: 'Relincho', gallo: 'Gallo canta', gallina: 'Gallina', perro: 'Perro ladra', 'perro_gruñido': 'Perro gruñe', mono: 'Mono congo aúlla', titi: 'Monos tití',
  cara_blanca: 'Mono cara blanca', tepezcuintle: 'Tepezcuintle', serpiente: 'Serpiente sisea', cocodrilo: 'Cocodrilo', danta: 'Danta', tren: 'Tren', gol: '¡Gol!', campana: 'Campanas',
  aplausos: 'Aplausos', splash: 'Chapuzón', hurt: 'Golpe', tajo: 'Tajo', swish: 'Zumbido', lapa: 'Lapa', tucan: 'Tucán', quetzal: 'Quetzal', colibri: 'Colibrí', rumble: 'Retumbo',
  portal: 'Portal', 'cofre.abrir': 'Cofre se abre', 'cofre.cerrar': 'Cofre se cierra', chest_open: 'Cofre se abre', bombeta: 'Bombeta', flecha: 'Flecha', arco: 'Arco', ballena: 'Ballena',
  gota: 'Gotea agua', agua_corre: 'Agua corriendo', grillo_cueva: 'Grillo de cueva', cangrejo_ciego: 'Cangrejo chasquea',
  delfin: 'Delfín', gaviota: 'Gaviota', rana: 'Rana', murcielago: 'Murciélagos', pizote: 'Pizote', perezoso: 'Perezoso', lanzar: 'Algo lanzado', monedas: 'Monedas', ignite: 'Fuego',
};
const captionText = (name) => CAPTIONS[name] || null;

// los jefes que tienen retrato pixel art (hechos con GPT)
const RETRATOS = new Set(['arpia', 'cangrejo_rey', 'cascabel_rey', 'ciempies_rey', 'el_olvido', 'escarabajo_hercules', 'jefa_ventanilla', 'reina_bananera', 'rey_murcielago', 'rey_zopilote', 'sapo_tata', 'senor_arenal', 'sombra_madre']); // v12.1.2: el lote 3 de arte (public/ui/jefes/<tipo>.png, 96 px) // v12.1.2: el lote 3 de arte (public/ui/jefes/<tipo>.png, 96 px) // v12.1.2: el lote 3 de arte (public/ui/jefes/<tipo>.png, 96 px) // v12.1.2: el lote 3 de arte (public/ui/jefes/<tipo>.png, 96 px)
const textoLuz = (v) => `${v} %${v === 50 ? ' (normal)' : v > 50 ? ' (más claro)' : ' (más oscuro)'}`;
// v11.12.0: buscar sin tildes ni mayúsculas
const sinTildes = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
// el color de cada categoría (el borde de abajo de la casilla y la pestaña)
// v11.13.5: los mismos colores del recetario (los --cat-* de tokens.css); antes el inventario tenía su propia tabla de hex
const COLOR_CAT = Object.fromEntries(['herramientas', 'armadura', 'comida', 'minerales', 'madera', 'tierra', 'plantas', 'construccion', 'varios'].map((c) => [c, `var(--cat-${c})`]));
const ORDENES = [['categoria', 'Categoría'], ['nombre', 'Nombre'], ['cantidad', 'Cantidad'], ['recientes', 'Recientes']];

// v11.12.3 «Vidrio»: íconos de línea del mismo juego (24×24, trazo 1.8) para las acciones de los paneles
const ICONOS = {
  buscar: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  ordenar: '<path d="M8 4v16M8 20l-3-3M8 20l3-3M16 20V4M16 4l-3 3M16 4l3 3"/>',
  aCofres: '<path d="M12 3v11M7 9l5 5 5-5"/><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
  sacar: '<path d="M12 14V3M7 8l5-5 5 5"/><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
  guardarIgual: '<path d="M4 8h16M4 12h16M4 16h16"/>',
  nombre: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
  mas: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
};
function botonIcono(nombre, tip, alClic, alDerecho) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'btn-ico'; b.dataset.tip = tip; b.setAttribute('aria-label', tip);
  b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONOS[nombre]}</svg>`;
  b.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); if (e.button === 2 && alDerecho) alDerecho(b); else if (e.button === 0) alClic(b); });
  b.addEventListener('contextmenu', (e) => e.preventDefault());
  b.addEventListener('click', (e) => { if (e.detail === 0) alClic(b); }); // v11.13.3: Enter y Espacio (el ratón ya lo atendió en mousedown)
  return b;
}
// menú chico bajo un botón: [texto, acción, marcado?]; se cierra al escoger, con Esc o al hacer clic afuera
// v11.13.3: pregunta propia en vidrio (en vez del confirm() del navegador). Devuelve una promesa: true si dice que sí
// v12.4.7: pedir un texto corto (el nombre de una mascota). Devuelve el texto o null si se cancela
function pedirTexto(texto, valor = '', max = 32) {
  return new Promise((listo) => {
    const prev = document.activeElement;
    const velo = document.createElement('div'); velo.className = 'pregunta-velo';
    const caja = document.createElement('div'); caja.className = 'pregunta panel'; caja.setAttribute('role', 'dialog'); caja.setAttribute('aria-modal', 'true');
    const p = document.createElement('p'); p.textContent = texto; p.id = 'pregunta-texto'; caja.setAttribute('aria-labelledby', p.id);
    const inp = document.createElement('input'); inp.type = 'text'; inp.maxLength = max; inp.value = valor; inp.className = 'nombre-cofre'; inp.setAttribute('aria-labelledby', p.id);
    const fila = document.createElement('div'); fila.className = 'pregunta-botones';
    const bNo = document.createElement('button'); bNo.className = 'ghost'; bNo.textContent = 'Cancelar';
    const bSi = document.createElement('button'); bSi.className = 'btn-primario'; bSi.textContent = 'Listo';
    fila.append(bNo, bSi); caja.append(p, inp, fila); velo.append(caja); document.body.append(velo);
    const fin = (r) => { velo.remove(); if (prev && prev.focus) prev.focus({ preventScroll: true }); listo(r); };
    bNo.onclick = () => fin(null); bSi.onclick = () => fin(inp.value);
    velo.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.code === 'Escape') { e.preventDefault(); fin(null); } else if (e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); fin(inp.value); } });
    velo.addEventListener('keyup', (e) => e.stopPropagation());
    inp.focus(); inp.select();
  });
}

function preguntar(texto, { si = 'Sí', no = 'Cancelar', peligro = false } = {}) {
  return new Promise((listo) => {
    const prev = document.activeElement;
    const velo = document.createElement('div'); velo.className = 'pregunta-velo';
    const caja = document.createElement('div'); caja.className = 'pregunta panel'; caja.setAttribute('role', 'alertdialog'); caja.setAttribute('aria-modal', 'true');
    const p = document.createElement('p'); p.textContent = texto; p.id = 'pregunta-texto'; caja.setAttribute('aria-labelledby', p.id);
    const fila = document.createElement('div'); fila.className = 'pregunta-botones';
    const bNo = document.createElement('button'); bNo.className = 'ghost'; bNo.textContent = no;
    const bSi = document.createElement('button'); bSi.className = peligro ? 'danger' : 'btn-primario'; bSi.textContent = si;
    if (no === null) fila.append(bSi); else fila.append(bNo, bSi); // v12.4.6: no = null, solo un aviso con un botón
    caja.append(p, fila); velo.append(caja); document.body.append(velo);
    const fin = (r) => { velo.remove(); if (prev && prev.focus) prev.focus({ preventScroll: true }); listo(r); };
    bNo.onclick = () => fin(false); bSi.onclick = () => fin(true);
    velo.addEventListener('mousedown', (e) => { if (e.target === velo) fin(false); });
    velo.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.code === 'Escape') { e.preventDefault(); fin(false); }
      else if (e.code === 'Tab') { e.preventDefault(); (document.activeElement === bSi && no !== null ? bNo : bSi).focus(); }
    });
    (no === null ? bSi : bNo).focus(); // lo seguro primero
  });
}

function menuChico(btn, items) {
  document.querySelectorAll('.menu-chico').forEach((m) => m.remove());
  const m = document.createElement('div'); m.className = 'menu-chico'; m.setAttribute('role', 'menu');
  const cerrar = () => { m.remove(); document.removeEventListener('mousedown', fuera, true); document.removeEventListener('keydown', esc, true); };
  const fuera = (e) => { if (!m.contains(e.target)) cerrar(); };
  const esc = (e) => { if (e.code === 'Escape') { e.stopPropagation(); e.preventDefault(); cerrar(); btn.focus(); } };
  for (const [t, f, on] of items) {
    const it = document.createElement('button'); it.type = 'button'; it.setAttribute('role', 'menuitem'); it.textContent = (on ? '✓ ' : '') + t;
    it.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); cerrar(); f(); });
    m.appendChild(it);
  }
  const r = btn.getBoundingClientRect();
  m.style.left = `${Math.max(8, r.right - 220)}px`; m.style.top = `${r.bottom + 6}px`;
  document.body.appendChild(m);
  setTimeout(() => { document.addEventListener('mousedown', fuera, true); document.addEventListener('keydown', esc, true); }, 0);
}
// las categorías del RECETARIO (las del inventario viejo, con los materiales juntos)
const CATS_RECETA = [['herramientas', 'Herramientas', 'var(--cat-herramientas)'], ['armadura', 'Armadura', 'var(--cat-armadura)'], ['comida', 'Comida', 'var(--cat-comida)'],
  ['construccion', 'Construcción', 'var(--cat-construccion)'], ['materiales', 'Materiales', 'var(--cat-madera)'], ['varios', 'Varios', 'var(--cat-varios)']];
const catReceta = (id) => { const c = categoria(id); return ['minerales', 'madera', 'tierra', 'plantas'].includes(c) ? 'materiales' : c; };

export class UI {
  constructor(game, audio, settings) {
    this.game = game;
    this.audio = audio;
    this.settings = settings;
    this.state = 'menu';
    this.prevScreen = 'menu';
    this.cursor = null; // stack en el cursor del inventario
    this.tableMode = false;
    this.lastBars = '';
    this.chatlog = document.createElement('div');
    this.chatlog.className = 'chatlog';
    $('#hud').appendChild(this.chatlog);
    this.pointerLocked = false;
    this.dragLook = false;
    this.lastMouse = null;
    this.buildHotbar();
    this.bindMenus();
    this.bindInput();
    this.bindSettings();
    $('#version-tag').textContent = `NanoBlocks v${GAME_VERSION}`;
    $('#menu-version').textContent = `v${GAME_VERSION} · hecho desde cero con IA para el canal nanoyackson`;
    // fondo de tierra pixelado para los menús
    const dirt = tileCanvas('dirt');
    if (dirt) document.documentElement.style.setProperty('--dirt', `url(${dirt.toDataURL()})`);
    this.syncSettings();
    this.show('menu');
  }

  // ---------- pantallas ----------
  // las pantallas no cortan: la que se va se desvanece debajo y la que llega aparece encima
  retirarPantalla(s, { fundir = false, sinFondo = false } = {}) {
    if (!s.classList.contains('on')) return;
    s.classList.remove('on', 'de-una');
    if (document.body.classList.contains('calma')) return;
    s.classList.add('saliendo');
    s.classList.toggle('fundido', fundir);
    s.classList.toggle('sin-fondo', sinFondo);
    clearTimeout(s.salirT);
    s.salirT = setTimeout(() => s.classList.remove('saliendo', 'fundido', 'sin-fondo'), fundir ? 480 : 180);
  }
  show(name) {
    const el = $(`#screen-${name}`), fondo = (x) => ['dim', 'red', 'bg-dirt', 'bg-menu'].find((c) => x.classList.contains(c));
    let igual = false;
    document.querySelectorAll('.screen.on').forEach((s) => {
      if (s === el) return;
      const mismo = !!el && fondo(s) === fondo(el);
      igual = igual || mismo;
      this.retirarPantalla(s, { sinFondo: mismo });
    });
    if (el) {
      // v11.12.1: el foco entra al panel (al primer botón o campo) y se recuerda de dónde venía
      if (!el.classList.contains('on')) { this.focoAntes = document.activeElement; setTimeout(() => { if (!el.classList.contains('on') || el.contains(document.activeElement)) return; const f = el.querySelector('button:not([disabled]), input, select'); if (f && name !== 'inventory' && name !== 'new' && name !== 'dead') f.focus({ preventScroll: true }); /* v11.13.3: en la muerte lo enfoca showDeath, cuando no haya teclas apretadas */ }, 30); }
      clearTimeout(el.salirT);
      el.classList.remove('saliendo', 'fundido', 'sin-fondo');
      el.classList.toggle('de-una', igual); // de una oscura a otra igual no se parpadea: solo cambia el panel
      el.classList.add('on');
    }
    if (name === 'menu') {
      $('#splash').textContent = SPLASHES[Math.floor(Math.random() * SPLASHES.length)];
      $('#hud').classList.add('hidden');
    }
    if (name === 'worlds') this.renderWorldList();
    if (name === 'news') this.renderNews();
    if (name === 'settings' || name === 'video') this.syncSettings();
    if (name === 'new') {
      const f = $('#new-form');
      f.elements.seed.value = '';
      f.elements.name.focus();
    }
  }

  hideScreens(fundir = false) {
    document.querySelectorAll('.screen.on').forEach((s) => this.retirarPantalla(s, { fundir: fundir || s.matches('.bg-dirt, .bg-menu') }));
    // el foco vuelve a donde estaba (si sigue en la página y no es parte de un panel que se fue)
    const f = this.focoAntes; this.focoAntes = null;
    if (f && f.isConnected && f.focus && !f.closest('.screen')) f.focus({ preventScroll: true }); else if (document.activeElement && document.activeElement.closest && document.activeElement.closest('.screen')) document.activeElement.blur();
  }

  // v11.12.1: accesibilidad mínima: cada pantalla es un diálogo con su título; los avisos se leen solos; la barra de carga
  // dice cuánto va; el mapa tiene nombre
  marcarAccesibilidad() {
    document.querySelectorAll('.screen').forEach((s, i) => {
      s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true');
      const t = s.querySelector('h1, h2, h3');
      if (t) { if (!t.id) t.id = `titulo-pantalla-${i}`; s.setAttribute('aria-labelledby', t.id); }
    });
    for (const id of ['toast', 'captions', 'recogidos']) { const el = document.getElementById(id); if (el) el.setAttribute('aria-live', 'polite'); }
    const lb = $('#loading-bar'); if (lb) { lb.setAttribute('role', 'progressbar'); lb.setAttribute('aria-valuemin', '0'); lb.setAttribute('aria-valuemax', '100'); }
    const mc = $('#map-canvas'); if (mc) { mc.setAttribute('role', 'img'); mc.setAttribute('aria-label', 'Mapa del mundo'); }
    document.querySelectorAll('.lib-tabs button').forEach((b) => b.setAttribute('role', 'tab'));
  }

  bindMenus() {
    this.marcarAccesibilidad();
    document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => {
      this.audio.resume(); this.audio.play('click', { ui: true, vol: 0.5 });
      const to = b.dataset.go;
      if (to === 'settings') this.prevScreen = this.state === 'paused' ? 'pause' : 'menu';
      this.show(to);
    }));
    { // v11.12.2: la nota de cada dificultad, debajo del selector
      const sel = $('#new-form').elements.dificultad, nota = $('#dif-nota');
      const tm = $('#new-form').elements.tipoMundo, tmNota = $('#tipo-nota');
      const TIPOS = { normal: 'Grande, como siempre: hay que caminar para encontrar las cosas.', compacto: 'Todo más cerca: biomas chicos, un pueblo a la par y cada lugar a pocos minutos a pie.' };
      if (tm && tmNota) tm.addEventListener('change', () => { tmNota.textContent = TIPOS[tm.value] || ''; });
      const NOTAS = { tranquilo: 'Sin monstruos; al morir no se pierde nada.', normal: 'Al morir, sus cosas quedan en un cofre y se cae la mitad de la plata.', dificil: 'Más monstruos; el hambre y el frío matan; al morir se cae todo.' };
      if (sel && nota) sel.addEventListener('change', () => { nota.textContent = NOTAS[sel.value] || ''; });
    }
    $('#new-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      const seedText = f.elements.seed.value.trim();
      const seed = seedText ? (/^-?\d+$/.test(seedText) ? Number(seedText) >>> 0 : hashString(seedText)) : (Math.random() * 4294967296) >>> 0;
      const tipo = f.elements.tipoMundo ? f.elements.tipoMundo.value : 'normal';
      // el inicio: en compacto, junto al pueblo más cercano (estructuras.js); en normal, como siempre
      const spawn = tipo === 'compacto' ? inicioCompacto(new Generator(seed, 17, 'tierra', 'compacto')) : new Generator(seed, 5).findSpawn();
      const meta = {
        id: newWorldId(),
        name: f.elements.name.value.trim() || 'Mi mundo',
        seed, seedText: seedText || String(seed),
        mode: f.elements.mode.value,
        dificultad: f.elements.dificultad ? f.elements.dificultad.value : 'normal',
        created: Date.now(),
        spawn, tipoMundo: tipo,
        jugadores: {}, epoca: 1, // v12.10.0: las fichas de otras personas (F3) y la época
        genVersion: 22, // v13.1.0: las cuevas nuevas (generador 22); v12.4.7: la casita de bahareque; v12.4.12: el tablón de encargos; v12.6.0: el coral blanqueado
        time: 0.05, day: 1,
      };
      this.startGame(meta, new Map());
    });
    $('#btn-import').addEventListener('click', () => $('#import-file').click());
    $('#import-file').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const r = await importWorld(file); // v12.8.5: también un respaldo; v12.10.0: dice cuáles no entraron y por qué
        if (r && r.hechos) {
          this.toast(`💾 Respaldo cargado: ${r.hechos.length} mundo${r.hechos.length === 1 ? '' : 's'}${r.fallidos.length ? `, ${r.fallidos.length} no entr${r.fallidos.length === 1 ? 'ó' : 'aron'}` : ''}`, 3200);
          if (r.fallidos.length) alert(`No se pudieron cargar ${r.fallidos.length} mundo${r.fallidos.length === 1 ? '' : 's'} del respaldo:\n\n${r.fallidos.slice(0, 12).map((f) => `• ${f.nombre}: ${f.motivo}`).join('\n')}`);
        } else this.toast('Mundo importado');
      } catch (err) { alert(err.message); }
      e.target.value = '';
      this.renderWorldList();
    });
    // v12.8.5 (urgente): el respaldo de todos los mundos y el almacenamiento persistente (respaldo.js)
    const respaldar = async () => { try {
      const r = await descargarRespaldo(), n = r.n; // v12.10.0: en archivos de tamaño acotado; avisa los que saltó
      this.toast(n ? `💾 Respaldo listo: ${n} mundo${n === 1 ? '' : 's'} en ${r.archivos} archivo${r.archivos === 1 ? '' : 's'}. Guárdelo fuera del navegador` : 'No hay mundos que respaldar', 3200);
      if (r.saltados.length) alert(`Estos mundos NO entraron en el respaldo:\n\n${r.saltados.slice(0, 12).map((f) => `• ${f.nombre}: ${f.motivo}`).join('\n')}`);
    } catch (err) { alert(`No se pudo hacer el respaldo: ${err.message}`); } const e = document.getElementById('estado-almacen'); if (e) e.textContent = textoAlmacen(); };
    $('#btn-respaldo').addEventListener('click', respaldar);
    $('#btn-respaldo2').addEventListener('click', respaldar);
    pedirPersistencia().then(() => { const e = document.getElementById('estado-almacen'); if (e) e.textContent = textoAlmacen(); });
    $('#btn-resume').addEventListener('click', () => this.resume());
    $('#btn-save').addEventListener('click', async () => { await this.game.save(); $('#pause-info').textContent = 'Partida guardada ✔'; });
    $('#btn-quit').addEventListener('click', () => this.quitToMenu());
    // v12.11.0: jugar con amistades. Todo el código de red vive en el trozo «red» y solo se descarga al pulsar esto
    const abrirRed = async (modo, codigo) => { try { (await import('./red/pantallas.js')).abrir(this, modo, codigo); } catch (e) { console.warn('[red]', e); this.toast('No se pudo cargar el juego en línea. Revise su conexión.', 4000); } };
    $('#btn-amistades').addEventListener('click', () => { this.audio.resume(); abrirRed('unirse'); });
    $('#btn-sala').addEventListener('click', () => { this.audio.resume(); abrirRed(this.game.meta && this.game.meta.invitado ? 'unirse' : 'sala'); });
    { const m = /[#&]sala=([^&]+)/.exec(location.hash || ''); if (m) { try { history.replaceState(null, '', location.pathname + location.search); } catch { /* sin historial */ } abrirRed('unirse', decodeURIComponent(m[1])); } }
    { // nombre y clave TURN de la red: solo en este navegador
      const n = $('#s-red-nombre'), t = $('#s-red-turn');
      const ls = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
      const gu = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };
      n.value = ls('nanoblocks.red.nombre'); t.value = ls('nanoblocks.red.turn');
      n.addEventListener('change', () => gu('nanoblocks.red.nombre', n.value.trim().slice(0, 16)));
      t.addEventListener('change', () => gu('nanoblocks.red.turn', t.value.trim()));
    }
    $('#btn-ayuda-pausa').addEventListener('click', () => { this.resume(); this.openLibreta('ayuda'); }); // v11.12.1
    $('#btn-respawn').addEventListener('click', () => { this.game.respawn(); this.showLoading('Reapareciendo…'); this.state = 'loading'; });
    $('#btn-dead-quit').addEventListener('click', () => { this.game.respawn(); this.quitToMenu(); });
    // clic afuera del panel = cerrar (como cerrar la tapa)
    $('#screen-inventory').addEventListener('mousedown', (e) => { if (e.target.id === 'screen-inventory' && !this.cursor) this.closeInventory(); });
    $('#btn-video-back').addEventListener('click', () => { this.audio.play('click', { ui: true, vol: 0.5 }); this.show('settings'); }); // v12.0.0
    $('#btn-settings-back').addEventListener('click', () => {
      this.show(this.prevScreen);
      if (this.prevScreen === 'pause') this.state = 'paused';
    });
  }

  async renderWorldList() {
    const list = $('#world-list');
    list.innerHTML = '';
    let worlds = [];
    try { worlds = await listWorlds(); } catch (e) { list.innerHTML = ''; const d = document.createElement('div'); d.className = 'empty'; d.textContent = `No se pudo leer el guardado: ${e.message}`; list.appendChild(d); return; } // textContent: un mensaje raro no se vuelve HTML
    // v12.8.5: si no hay mundos pero la marca (cookie) dice que había, el navegador los borró: se explica cómo recuperarlos
    if (worlds.length === 0) {
      const habia = mundosMarcados();
      list.innerHTML = habia ? `<div class="empty aviso-perdidos">⚠ Aquí había ${habia} mundo${habia === 1 ? '' : 's'} y el navegador ya no los tiene (se borraron los datos del sitio). Si bajó un respaldo, use «Importar mundo o respaldo» y escoja el archivo <b>nanoblocks-respaldo-….json</b> (o el <b>.nanoblocks.json</b> de un mundo). Si no, toca empezar de nuevo: de ahora en adelante, baje un respaldo de vez en cuando.</div>` : '<div class="empty">Todavía no hay mundos. ¡Cree uno!</div>';
      return;
    }
    marcarMundos(worlds.length);
    for (const w of worlds) {
      const row = document.createElement('div');
      row.className = 'world';
      const date = new Date(w.lastPlayed || w.created).toLocaleString('es-CR');
      row.innerHTML = `<div class="info"><div class="name"></div><div class="meta"></div></div>`;
      row.querySelector('.name').textContent = w.name;
      row.querySelector('.meta').textContent = `${w.mode === 'creative' ? 'Creativo' : 'Supervivencia'} · día ${w.day || 1} · ${date} · v${w.gameVersion || '?'}`;
      const play = document.createElement('button'); play.textContent = 'Jugar';
      play.onclick = async () => {
        // v12.4.6: un mundo de una versión más nueva no se abre (o se pregunta, si es compatible)
        const c = compatibilidad(w);
        if (c && c.bloquea) { await preguntar(c.bloquea, { si: 'Entendido', no: null }); return; }
        if (c && c.avisa && !(await preguntar(c.avisa, { si: 'Abrir igual' }))) return;
        const data = await loadWorld(w.id);
        if (data) this.startGame(data.meta, data.mods, data.be);
      };
      const exp = document.createElement('button'); exp.textContent = 'Exportar'; exp.className = 'ghost';
      exp.onclick = () => exportWorld(w.id);
      const del = document.createElement('button'); del.textContent = 'Borrar'; del.className = 'danger';
      del.onclick = async () => {
        if (!(await preguntar(`¿Borrar «${w.name}» para siempre? No se puede deshacer.`, { si: 'Borrar', peligro: true }))) return;
        await deleteWorld(w.id);
        marcarMundos((await listWorlds()).length); // v12.8.5: borrado a propósito: la marca baja (si no, avisaría que se perdieron)
        this.renderWorldList();
      };
      row.append(play, exp, del);
      list.appendChild(row);
    }
  }

  renderNews() {
    const el = $('#news-list');
    el.innerHTML = '';
    // v11.12.2: las últimas 10 versiones; el resto, con «Ver anteriores» (antes armaba las casi 400 de una vez)
    const todas = this.newsTodas, lista = todas ? CHANGELOG : CHANGELOG.slice(0, 10);
    for (const c of lista) {
      const h = document.createElement('h3'); h.textContent = `v${c.version} — ${c.title} (${c.date})`;
      const ul = document.createElement('ul');
      for (const it of c.items) { const li = document.createElement('li'); li.textContent = it; ul.appendChild(li); }
      el.append(h, ul);
    }
    if (!todas && CHANGELOG.length > 10) {
      const b = document.createElement('button'); b.className = 'ghost'; b.textContent = `Ver anteriores (${CHANGELOG.length - 10})`;
      b.addEventListener('click', () => { this.newsTodas = true; this.renderNews(); });
      el.appendChild(b);
    }
    const h = document.createElement('h3'); h.textContent = 'Créditos'; h.id = 'creditos';
    const ul = document.createElement('ul');
    for (const c of CREDITS) { const li = document.createElement('li'); li.textContent = `${c.what}: ${c.who} — ${c.license}`; ul.appendChild(li); }
    const li = document.createElement('li'); li.textContent = 'Todo lo demás (motor, terreno, texturas de bloques, criaturas, animaciones): hecho desde cero para NanoBlocks.';
    ul.appendChild(li);
    el.append(h, ul);
    // autores de las grabaciones de Freesound (CC0: no es obligatorio, pero se agradece)
    fetch('./sounds/real/manifest.json').then((r) => r.json()).then((m) => {
      const authors = [...new Set((m.credits || []).map((c) => c.user))].filter(Boolean).sort((a, b) => a.localeCompare(b));
      if (!authors.length) return;
      const p = document.createElement('p');
      p.textContent = `Grabaciones de Freesound por: ${authors.join(', ')}. ¡Gracias!`;
      el.appendChild(p);
    }).catch(() => {});
  }

  // ---------- partida ----------
  startGame(meta, mods, be) {
    this.audio.resume();
    this.game.start(meta, mods, be);
    this.showLoading('Generando mundo…');
    this.state = 'loading';
    $('#hud').classList.remove('hidden');
    this.game.paused = true;
  }

  showLoading(title) {
    this.show('loading');
    $('#loading-title').textContent = title;
    $('#loading-bar').style.width = '0%';
    const tips = ['Alt+clic en el inventario deja una casilla fija', 'Con comida en la mano, la barra enseña cuánto le llena', 'Q tira el objeto de la mano; Ctrl+Q tira todo el montón', 'Las dantas silban como las de verdad', 'Doble espacio en creativo para volar', 'E abre el inventario y el crafteo', 'T abre la consola de comandos', 'F1 esconde la interfaz (ideal para grabar)', 'Clic derecho en la dinamita la enciende', 'La danta es pacífica… la Sombra no', 'Agáchese con Shift y no se cae de los bordes', 'L abre los logros y H las habilidades', 'Una fogata espanta los zancudos y asa la carne', 'F2 abre el modo foto: cámara libre y Enter guarda la foto'];
    $('#loading-tip').textContent = 'Consejo: ' + tips[Math.floor(Math.random() * tips.length)];
  }
  setLoading(f) { $('#loading-bar').style.width = `${Math.round(f * 100)}%`; }
  hideLoading() {
    if (this.state !== 'loading') return;
    this.hideScreens(true);
    this.state = 'playing';
    this.game.paused = false;
    this.requestLock();
    this.toast(`${this.game.meta.name} · ${this.game.mode === 'creative' ? 'Creativo' : 'Supervivencia'}`, 2500);
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.exitLock();
    this.game.paused = true;
    this.game.releaseAll();
    $('#pause-info').textContent = `Guardado automático cada 30 s · v${GAME_VERSION}`;
    this.show('pause');
    if (performance.now() - (this.game.lastSave || 0) > 5000) this.game.save(); // v11.13.3: 5 s, el mismo margen del aviso al cerrar la pestaña
  }

  resume() {
    this.hideScreens();
    this.state = 'playing';
    this.game.paused = false;
    this.requestLock();
  }

  async quitToMenu() {
    this.state = 'menu';
    this.game.paused = true;
    this.closeInventoryDom();
    await this.game.stop();
    this.show('menu');
  }

  showDeath(cause) {
    this.state = 'dead';
    this.limpiarAvisos(false);
    this.exitLock();
    $('#death-cause').textContent = cause || '';
    $('#death-tip').textContent = deathTip(this.game);
    this.show('dead');
    // Enter reaparece; el foco espera a que no haya teclas apretadas (si no, un Espacio sostenido al ahogarse pulsaba el botón)
    let intentos = 0; const enfocar = () => { if (this.state !== 'dead') return; if (this.game.keys && this.game.keys.size && ++intentos < 40) { setTimeout(enfocar, 120); return; } const r = $('#btn-respawn'); if (r) r.focus({ preventScroll: true }); };
    setTimeout(enfocar, 450);
  }

  // ---------- mouse y teclado ----------
  requestLock() {
    $('#click-hint').classList.add('hidden');
    this.lockAskedAt = performance.now();
    // pantalla completa + bloqueo de teclado (Ctrl+W/Ctrl+D no cierran ni marcan la pestaña).
    // Primero la pantalla completa y DESPUÉS el mouse: si se piden a la vez, el cambio de pantalla suelta el mouse
    // y el juego creía que el jugador había pausado.
    if (this.settings.fullscreen && !document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen({ navigationUI: 'hide' }).then(() => {
        // solo se bloquean los atajos peligrosos: Esc sigue saliendo de pantalla completa con un toque
        if (navigator.keyboard && navigator.keyboard.lock) navigator.keyboard.lock().catch(() => {}); // todas: Ctrl+W, Ctrl+T… no se roban la partida (Esc sostenido sigue saliendo)
        this.lockPointer();
      }).catch(() => this.lockPointer());
    } else this.lockPointer();
  }

  lockPointer() {
    const c = this.game.canvas;
    // si Chrome lo niega (pide esperar un toque después de soltarlo, p. ej. al cerrar el inventario rápido), se reintenta una vez
    // sola al ratito; si tampoco, queda la capa discreta y el próximo clic lo recupera sin pegar ni poner un bloque
    const fail = () => {
      $('#click-hint').classList.remove('hidden');
      if (!this.lockReintento && ['playing'].includes(this.state)) { this.lockReintento = true; setTimeout(() => { if (this.state === 'playing' && !this.pointerLocked) this.lockPointer(); }, 1100); }
    };
    try {
      // movimiento "crudo" del mouse: sin aceleración del sistema y sin los saltos que a veces manda Chrome
      const r = c.requestPointerLock({ unadjustedMovement: true });
      if (r && r.catch) {
        r.catch(() => {
          try {
            const r2 = c.requestPointerLock();
            if (r2 && r2.catch) r2.catch(fail);
          } catch { fail(); }
        });
      }
    } catch { fail(); }
  }
  exitLock() {
    this.suppressPause = true;
    if (document.pointerLockElement) document.exitPointerLock();
    setTimeout(() => { this.suppressPause = false; }, 100);
  }

  bindInput() {
    const canvas = this.game.canvas;
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === canvas;
      if (this.pointerLocked) {
        this.lockReintento = false; this.sinLock = 0;
        $('#click-hint').classList.add('hidden');
        this.lockedAt = performance.now();
        this.mouseHist = [];
        return;
      }
      if (this.state !== 'playing' || this.suppressPause) return;
      // si se soltó justo al cambiar de pantalla completa, se vuelve a capturar en vez de pausar
      const now = performance.now();
      if (now - (this.fullscreenAt || 0) < 900 || now - (this.lockAskedAt || 0) < 900) {
        $('#click-hint').classList.remove('hidden');
        return;
      }
      this.pause();
    });
    document.addEventListener('fullscreenchange', () => { this.fullscreenAt = performance.now(); });
    // nunca mostrar el menú del clic derecho del navegador dentro del juego
    document.addEventListener('contextmenu', (e) => {
      const t = e.target;
      if (!(t instanceof HTMLInputElement) && !(t instanceof HTMLTextAreaElement)) e.preventDefault();
    });
    canvas.addEventListener('mousedown', (e) => {
      this.audio.resume();
      if (this.state !== 'playing') return;
      if (!this.pointerLocked) {
        this.requestLock();
        this.dragLook = true;
        this.lastMouse = { x: e.clientX, y: e.clientY };
        // el clic que recupera el mouse no pega ni pone un bloque (v11.10.2); si el navegador no deja capturarlo,
        // los clics siguientes sí juegan (y se mira arrastrando)
        if (!this.sinLock) { this.sinLock = performance.now(); e.preventDefault(); return; }
        if (performance.now() - this.sinLock < 1500) { e.preventDefault(); return; }
      } else this.sinLock = 0;
      this.game.onMouseDown(e.button);
      e.preventDefault();
    });
    window.addEventListener('mouseup', (e) => {
      this.dragLook = false;
      if (this.state === 'playing') this.game.onMouseUp(e.button);
      if (this.state === 'inventory') {
        // con algo agarrado, soltar el clic fuera de los paneles lo tira al suelo (izquierdo: todo; derecho: uno)
        const fuera = e.target && e.target.closest && e.target.closest('#screen-inventory') && !e.target.closest('.inv-panel'); // dentro de la pantalla del inventario, fuera de los paneles (no fuera de la ventana)
        if (fuera && this.drag && this.drag.slots.length > 1) { this.cancelarReparto(); this.marcarSoltando(false); return; } // soltar fuera devuelve el reparto
        if (this.cursor && fuera && !(this.drag && this.drag.slots.length > 1)) { this.drag = null; if (this.game.mode === 'creative') { this.cursor = null; this.renderCursor(); } else this.soltarCursor(e.button === 2 ? 1 : this.cursor.count); this.marcarSoltando(false); return; }
        this.endDrag(e.button);
      }
    });
    window.addEventListener('mousemove', (e) => {
      if (this.state === 'playing') {
        if (this.pointerLocked) {
          const dx = e.movementX, dy = e.movementY;
          // filtro anti-jalón: se ignoran los primeros instantes tras capturar el mouse
          // y los saltos absurdos comparados con el movimiento reciente
          if (performance.now() - (this.lockedAt || 0) < 120) return;
          const mag = Math.hypot(dx, dy);
          const hist = this.mouseHist || (this.mouseHist = []);
          const avg = hist.length ? hist.reduce((a, b) => a + b, 0) / hist.length : 0;
          if (mag > 250 && mag > avg * 6 + 120) return;
          hist.push(mag); if (hist.length > 12) hist.shift();
          this.game.onMouseMove(dx, dy);
        }
        else if (this.dragLook && this.lastMouse) {
          this.game.onMouseMove(e.clientX - this.lastMouse.x, e.clientY - this.lastMouse.y);
          this.lastMouse = { x: e.clientX, y: e.clientY };
        }
      }
      if (this.state === 'inventory') { this.moveCursor(e.clientX, e.clientY); this.marcarSoltando(!!this.cursor && !(e.target && e.target.closest && e.target.closest('.inv-panel'))); }
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('wheel', (e) => {
      if (this.state !== 'playing') return;
      // con la ruta abierta y más larga que la pantalla, la rueda baja el panel en vez de cambiar de objeto
      const R = this.game.rutaOpen && document.getElementById('ruta-panel');
      if (R && R.scrollHeight > R.clientHeight + 4) { R.scrollTop += e.deltaY; return; }
      this.game.onWheel(e.deltaY);
    }, { passive: true });
    window.addEventListener('blur', () => this.game.releaseAll());

    // v11.10.2: lo que el navegador haría con un atajo (zoom, guardar página, marcador, imprimir, buscar, recargar, ayuda,
    // modo de cursor, volver atrás) no se lo roba a la partida. En el menú y escribiendo en un campo, todo funciona normal
    const enCampo = (t) => t && (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t.isContentEditable);
    const enPartida = () => ['playing', 'inventory', 'map', 'libreta', 'shop', 'paused', 'dead', 'command'].includes(this.state);
    window.addEventListener('keydown', (e) => {
      if (!enPartida() || enCampo(e.target)) return;
      const k = e.code, ctrl = e.ctrlKey || e.metaKey;
      if (['F1', 'F3', 'F5', 'F7', 'BrowserBack', 'Backspace'].includes(k) || (k === 'AltLeft' || k === 'AltRight') || (ctrl && ['KeyS', 'KeyD', 'KeyP', 'KeyF', 'KeyR', 'KeyG', 'KeyH', 'KeyJ', 'KeyU', 'Equal', 'Minus', 'Digit0', 'NumpadAdd', 'NumpadSubtract', 'Numpad0', 'Space'].includes(k))) e.preventDefault();
    }, { capture: true });
    window.addEventListener('wheel', (e) => { if (enPartida() && (e.ctrlKey || e.metaKey)) e.preventDefault(); }, { passive: false });
    // v11.12.0: arriba de 1920×1080 la pantalla del inventario crece entera (casillas y letras), para que en 4K no quede chiquita
    const zoomUI = () => document.documentElement.style.setProperty('--zoom-ui', String(Math.max(1, Math.min(innerHeight / 1080, innerWidth / 1920)).toFixed(3)));
    zoomUI(); window.addEventListener('resize', zoomUI); // Ctrl + rueda: sin zoom de la página
    // cerrar la pestaña con cambios sin guardar pregunta antes
    window.addEventListener('beforeunload', (e) => {
      const w = this.game.world;
      // v11.10.6: también si está guardando o si lo último (inventario, vida, plata) no se ha guardado; en desarrollo no, que estorba al recargar
      const pend = this.game.saving || (!import.meta.env.DEV && performance.now() - (this.game.lastSave || 0) > 5000);
      if (enPartida() && w && ((w.dirtyMods && w.dirtyMods.size) || pend)) { this.game.save && this.game.save(); e.preventDefault(); e.returnValue = ''; }
    });
    window.addEventListener('keydown', (e) => {
      // en Ajustes, esperando la tecla nueva de un atajo
      if (this.capturaTecla) { e.preventDefault(); this.capturaTecla(e.code); return; }
      const S = this.settings;
      if (['F1', 'F3'].includes(e.code) || (e.code === 'Tab' && this.state === 'playing')) e.preventDefault(); // v11.12.1: Tab mueve el foco en los menús
      // T5: Esc vuelve atrás en los menús (mundos, mundo nuevo, novedades y ajustes)
      if (e.code === 'Escape' && !this.capturaTecla) {
        const on = document.querySelector('.screen.on'), id = on && on.id;
        if (id === 'screen-settings') { e.preventDefault(); $('#btn-settings-back').click(); return; }
        if (id === 'screen-video') { e.preventDefault(); $('#btn-video-back').click(); return; }
        const atras = { 'screen-worlds': 'menu', 'screen-new': 'worlds', 'screen-news': 'menu' }[id];
        if (atras && !['playing', 'inventory', 'map', 'libreta', 'shop'].includes(this.state)) { e.preventDefault(); this.audio.play('click', { ui: true, vol: 0.4 }); this.show(atras); return; }
      }
      if (this.state === 'command') {
        if (e.code === 'Escape') { e.preventDefault(); this.closeCommand(); }
        return;
      }
      if (this.state === 'inventory') {
        if (e.code === 'Escape' && this.drag && this.drag.slots.length > 1) { e.preventDefault(); this.cancelarReparto(); return; }
        if ((e.key === '/' || ((e.ctrlKey || e.metaKey) && e.code === 'KeyF')) && $('#inv-buscar')) { e.preventDefault(); this.abrirBuscador(); return; }
        // v11.12.3: R ordena el panel bajo el ratón; Mayús+R deposita todo en el cofre abierto
        if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey && !e.repeat) {
          e.preventDefault();
          const cofre = this.station && this.station.type === 'chest' && this.station.be && this.station.be.slots;
          if (e.shiftKey) { if (cofre) this.sortAction('deposit'); } else this.sortAction(cofre && this.hoverEl && this.hoverEl.dataset.c === 'chest' ? 'sort-chest' : 'sort-inv');
          return;
        }
        if (/^Digit[1-9]$/.test(e.code) && !e.repeat && this.hoverEl) { e.preventDefault(); this.aLaBarra(+e.code.slice(5) - 1); return; }
        if (es(S, 'inventario', e.code) || e.code === 'Escape') { e.preventDefault(); this.closeInventory(); }
        else if (es(S, 'soltar', e.code)) { e.preventDefault(); this.soltarBajoMouse(e.ctrlKey); } // Q también con el inventario o un cofre abierto
        return;
      }
      if (this.state === 'shop') {
        if (es(S, 'inventario', e.code) || e.code === 'Escape') { e.preventDefault(); this.closeShop(); }
        return;
      }
      if (this.state === 'libreta') {
        e.preventDefault();
        const hoja = ['logros', 'habilidades', 'bestiario', 'diario', 'cartas', 'manas', 'ayuda', 'album'].find((h) => es(S, h, e.code));
        if (e.code === 'Escape' || (hoja && hoja === this.libTab)) this.closeLibreta();
        else if (hoja) this.openLibreta(hoja);
        return;
      }
      if (this.state === 'map') {
        if (es(S, 'mapa', e.code) || e.code === 'Escape') { e.preventDefault(); this.closeMap(); }
        else if (e.code === 'Equal' || e.code === 'NumpadAdd') this.zoomMap(-1);
        else if (e.code === 'Minus' || e.code === 'NumpadSubtract') this.zoomMap(1);
        else if (e.code === 'KeyC') { this.mapPan = { x: 0, z: 0 }; this.drawMapLoop(); }
        else if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
          e.preventDefault();
          const o = (this.mapPan ||= { x: 0, z: 0 }), paso = 48 * (this.mapScale || 2);
          if (e.code === 'KeyW' || e.code === 'ArrowUp') o.z -= paso; else if (e.code === 'KeyS' || e.code === 'ArrowDown') o.z += paso;
          else if (e.code === 'KeyA' || e.code === 'ArrowLeft') o.x -= paso; else o.x += paso;
          this.drawMapLoop();
        }
        return;
      }
      // en el modo foto las letras no abren menús: todo va al juego (salvo Esc)
      if (this.state === 'playing' && this.game.foto && e.code !== 'Escape') { e.preventDefault(); this.game.onKeyDown(e); return; }
      if (this.state === 'playing') {
        // que el navegador no se robe atajos con Ctrl/Alt (Ctrl+D = marcador, Ctrl+S = guardar página…)
        if (e.ctrlKey || e.metaKey || e.altKey || e.code.startsWith('Arrow') || e.code === 'Tab') e.preventDefault();
        if (es(S, 'inventario', e.code)) { this.openInventory(); return; }
        if (es(S, 'mapa', e.code)) { this.openMap(); return; }
        const hoja = ['logros', 'habilidades', 'bestiario', 'diario', 'cartas', 'manas', 'ayuda', 'album'].find((h) => es(S, h, e.code));
        if (hoja) { this.openLibreta(hoja); return; }
        if (es(S, 'comer', e.code) && !e.repeat) { comerRapido(this.game); return; }
        if (es(S, 'antorcha', e.code) && !e.repeat) { antorchaRapida(this.game); return; }
        if (es(S, 'marca', e.code) && e.shiftKey) { ponerMarcador(this.game, STRUCT_NAMES, structuresNear); return; }
        if (es(S, 'marca', e.code)) { const g = this.game, p = g.player.body.pos; if (g.dim !== 'tierra') { this.toast('Los puntos se marcan en la Tierra', 1400); return; } g.meta.marca = { x: Math.round(p.x), y: Math.round(p.y), z: Math.round(p.z) }; this.toast(`📍 Punto marcado en ${g.meta.marca.x}, ${g.meta.marca.z} (sale en la brújula y el mapa)`, 2400); return; }
        if (es(S, 'consola', e.code) || e.code === 'Slash' || e.code === 'NumpadDivide') { e.preventDefault(); this.openCommand(e.code === 'Slash' ? '/' : ''); return; }
        if (e.code === 'Escape') { this.pause(); return; }
        if (e.code === 'Space') e.preventDefault();
        this.game.onKeyDown(e);
        return;
      }
      if (this.state === 'paused' && e.code === 'Escape') this.resume();
    });
    window.addEventListener('keyup', (e) => { this.game.onKeyUp(e); });

    $('#cmd').addEventListener('submit', (e) => {
      e.preventDefault();
      const text = $('#cmd-input').value;
      if (text.trim()) {
        const esComando = text.trim().startsWith('/');
        if (this.game.red && !esComando) {
          this.game.red.hablar(text); // v12.11.0: en una sala, el texto va a todas las personas (se ve al volver por «chatr»)
        } else if (this.game.meta && this.game.meta.invitado) {
          this.chat('En la sala del anfitrión no se usan comandos.');
        } else {
          this.chat(`> ${text}`);
          const out = esComando ? this.game.runCommand(text) : [`<Jugador> ${text}`];
          out.forEach((l) => this.chat(l));
        }
      }
      this.closeCommand();
    });
  }

  openCommand(prefix) {
    this.state = 'command';
    this.game.releaseAll();
    this.exitLock();
    $('#cmd').classList.remove('hidden');
    const inp = $('#cmd-input');
    inp.value = prefix;
    setTimeout(() => inp.focus(), 0);
    this.chatlog.querySelectorAll('div').forEach((d) => { d.style.opacity = 1; });
  }
  closeCommand() {
    $('#cmd').classList.add('hidden');
    $('#cmd-input').blur();
    this.state = 'playing';
    this.requestLock();
  }
  // v12.4.7: el cuadro para escribir un texto corto (lo usan las mascotas); suelta el mouse mientras tanto
  pedirTexto(texto, valor, max) {
    this.game.releaseAll(); this.exitLock();
    return pedirTexto(texto, valor, max);
  }

  chat(text) {
    const d = document.createElement('div');
    d.textContent = text;
    this.chatlog.appendChild(d);
    while (this.chatlog.children.length > 10) this.chatlog.firstChild.remove();
    setTimeout(() => { d.style.opacity = 0; }, 9000);
  }

  // ---------- HUD ----------
  buildHotbar() {
    const hb = $('#hotbar');
    hb.innerHTML = '';
    this.hotbarEls = [];
    for (let i = 0; i < 9; i++) {
      const s = document.createElement('div');
      s.className = 'slot';
      hb.appendChild(s);
      this.hotbarEls.push(s);
    }
  }

  // v12.1.3: la casilla solo se toca si cambió lo que muestra (antes se vaciaba y se recreaba la <img> en cada clic: todos los
  // íconos parpadeaban un cuadro mientras el navegador volvía a decodificar). La misma <img> se reusa; el src cambia solo si cambia el ítem
  fillSlot(el, stack) {
    if (el.dataset.c === 'inv') el.classList.toggle('fija', ((this.game.meta && this.game.meta.fijas) || []).includes(Number(el.dataset.i)));
    const def = stack ? getDef(stack.id) : null;
    const durF = stack && stack.dur !== undefined && def && def.durability && stack.dur < def.durability ? stack.dur / def.durability : -1;
    const firma = stack ? `${stack.id}|${stack.count}|${stack.mejora || 0}|${durF.toFixed(3)}` : '';
    if (el._firma === firma) return;
    el._firma = firma;
    if (!stack) { el.replaceChildren(); el.style.removeProperty('--catc'); return; }
    el.style.setProperty('--catc', COLOR_CAT[categoria(stack.id)] || COLOR_CAT.varios); // v11.12.0: el borde de abajo, del color de su categoría
    let img = el.firstElementChild && el.firstElementChild.tagName === 'IMG' ? el.firstElementChild : null;
    if (!img) { img = document.createElement('img'); img.alt = ''; img.decoding = 'sync'; }
    const url = iconURL(stack.id);
    if (img.getAttribute('src') !== url) img.src = url;
    const extra = [img];
    if (VALOR[stack.id]) { const v = document.createElement('span'); v.className = 'valor'; const x = VALOR[stack.id]; v.textContent = x >= 1000 ? `${x / 1000}k` : `${x}`; extra.push(v); }
    if (stack.count > 1) { const c = document.createElement('span'); c.className = 'count'; c.textContent = stack.count; extra.push(c); }
    if (stack.mejora) { const m = document.createElement('span'); m.className = 'mej'; m.textContent = '★'.repeat(stack.mejora); extra.push(m); }
    if (durF >= 0) {
      const bar = document.createElement('div'); bar.className = 'dur';
      const fillEl = document.createElement('i');
      fillEl.style.width = `${durF * 100}%`;
      fillEl.style.background = `hsl(${durF * 120}, 90%, 45%)`;
      bar.appendChild(fillEl);
      extra.push(bar);
    }
    el.replaceChildren(...extra); // la <img> se mueve, no se recrea: no vuelve a decodificarse
  }

  refreshHotbar() {
    const inv = this.game.inventory;
    for (let i = 0; i < 9; i++) {
      const el = this.hotbarEls[i], s = inv.slots[i], antes = el.tenia;
      this.fillSlot(el, s);
      el.classList.toggle('sel', i === inv.selected);
      // lo que entra a la barra da un brinquito, para ver dónde cayó
      if (s && antes !== undefined && this.state === 'playing' && (!antes || antes.id !== s.id || antes.count < s.count) && !document.body.classList.contains('calma')) el.animate([{ translate: '0 0' }, { translate: '0 -6px', offset: 0.4 }, { translate: '0 0' }], { duration: 220, easing: 'ease-out' });
      el.tenia = s ? { id: s.id, count: s.count } : null;
    }
    this.pintarBilletera();
    if (this.state === 'inventory') this.renderInventory();
  }

  // v11.10.5: la billetera (la plata no ocupa casillas): el total a la par de la barra, con un brinquito cuando cambia
  pintarBilletera() {
    const g = this.game, el = $('#billetera-hud');
    if (!el) return;
    const total = g.mode === 'survival' ? g.inventory.colones() : 0;
    el.classList.toggle('hidden', g.mode !== 'survival');
    if (el.total === total) return;
    const antes = el.total;
    el.total = total;
    // v11.12.3: la billetera de cuero (arte de GPT) con el total al lado; brinca y suena al entrar plata
    if (!el.firstElementChild) { el.innerHTML = '<img src="./sprites/arte/billetera.png" alt=""><span></span>'; }
    el.lastElementChild.textContent = fmtColones(total);
    if (antes !== undefined && !document.body.classList.contains('calma')) {
      el.classList.remove('sube', 'baja'); void el.offsetWidth;
      el.classList.add(total > antes ? 'sube' : 'baja');
    }
    if (antes !== undefined && total > antes && this.state === 'playing') this.audio.play('monedas', { ui: true, vol: 0.18, vary: 0.15 });
  }
  // el desglose en el inventario: clic saca una pieza al cursor (Shift: todas las de ese valor); con plata en el cursor, clic la guarda
  pintarDesglose() {
    const g = this.game, inv = g.inventory, box = $('#inv-billetera');
    if (!box) return;
    box.classList.toggle('hidden', g.mode !== 'survival');
    if (g.mode !== 'survival') return;
    if (!box.armado) {
      box.armado = true;
      box.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (this.cursor) {
          if (!VALOR[this.cursor.id]) return;
          inv.meterPlata(this.cursor); this.cursor = null; this.renderCursor();
          this.audio.play('monedas', { ui: true, vol: 0.35, vary: 0.1 });
          return;
        }
        const pieza = e.target.closest && e.target.closest('.pieza');
        if (!pieza) { if (e.target.closest && e.target.closest('.bill-fila')) this.abrirBilletera(!box.classList.contains('abierta')); return; }
        const s = inv.sacarPlata(+pieza.dataset.id, e.shiftKey || e.button === 2 ? Infinity : 1);
        if (!s) return;
        this.cursor = s; this.renderCursor();
        this.audio.play('monedas', { ui: true, vol: 0.25, vary: 0.15 });
      });
      box.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    const piezas = PIEZAS.filter((id) => inv.billetera[id] > 0).sort((a, b) => VALOR[b] - VALOR[a]);
    const firma = `${inv.enBilletera()}|${piezas.map((id) => `${id}:${inv.billetera[id]}`).join(',')}`;
    if (box.firma === firma) return;
    box.firma = firma;
    box.innerHTML = '';
    // v11.12.3: una fila con la billetera de cuero y el total; clic abre el cajón con la billetera abierta (arte de GPT):
    // los billetes en abanico en el bolsillo largo y las monedas en el monedero, cada uno con su cantidad
    const fila = document.createElement('div'); fila.className = 'bill-fila';
    fila.title = piezas.length ? 'Clic: abrir la billetera · suelte plata aquí para guardarla' : 'Vacía. La plata que recoja entra aquí sola.';
    fila.innerHTML = '<img class="bill-ico" src="./sprites/arte/billetera.png" alt=""><b class="bill-total"></b><span class="bill-flecha" aria-hidden="true"></span>';
    fila.querySelector('.bill-total').textContent = fmtColones(inv.enBilletera());
    box.appendChild(fila);
    const cajon = document.createElement('div'); cajon.className = 'billetera-cajon';
    const abierta = document.createElement('div'); abierta.className = 'billetera-abierta';
    const bolsillo = document.createElement('div'); bolsillo.className = 'bolsillo';
    const monedero = document.createElement('div'); monedero.className = 'monedero';
    const pieza = (id, clase) => {
      const p = document.createElement('div'); p.className = `pieza ${clase}`; p.dataset.id = id;
      p.title = `${itemName(id)} × ${inv.billetera[id]} · clic: sacar una · Mayús: todas`;
      const def = getDef(id), img = document.createElement('img'); img.alt = '';
      img.src = def && def.sprite ? `./sprites/${def.sprite}.png` : iconURL(id); img.onerror = () => { img.src = iconURL(id); };
      const n = document.createElement('b'); n.textContent = `×${inv.billetera[id]}`;
      p.append(img, n);
      return p;
    };
    const billetes = piezas.filter((id) => VALOR[id] >= 1000), monedas = piezas.filter((id) => VALOR[id] < 1000);
    billetes.forEach((id, i) => { const p = pieza(id, 'billete'); p.style.setProperty('--i', i); p.style.setProperty('--n', billetes.length); bolsillo.appendChild(p); });
    monedas.forEach((id) => monedero.appendChild(pieza(id, 'moneda')));
    if (!piezas.length) { const v = document.createElement('small'); v.className = 'bill-vacia'; v.textContent = 'Vacía'; bolsillo.appendChild(v); }
    // las dos ranuras de tarjeta: lo del banco y lo que hay en plata dentro de los chanchitos (no se pierde nunca)
    const M = g.meta || {}, enChanchito = (M.chanchito || []).reduce((a, s) => a + (s && VALOR[s.id] ? VALOR[s.id] * s.count : 0), 0);
    [['banco', `🏦 Banco · ${fmtUnidades(M.banco || 0)}`], ['chanchito', `🐷 Chanchito · ${fmtColones(enChanchito)}`]].forEach(([k, t]) => {
      const tj = document.createElement('div'); tj.className = `tarjeta tarjeta-${k}`; tj.textContent = t; abierta.appendChild(tj);
    });
    abierta.append(bolsillo, monedero);
    cajon.appendChild(abierta);
    box.appendChild(cajon);
    box.classList.toggle('abierta', !!this.billeteraAbierta);
  }
  // abrir o cerrar el cajón de la billetera (Esc o clic afuera lo cierra)
  abrirBilletera(si) {
    const box = $('#inv-billetera');
    if (!box) return;
    this.billeteraAbierta = si;
    box.classList.toggle('abierta', si);
    if (this.cierraBilletera) { document.removeEventListener('mousedown', this.cierraBilletera, true); document.removeEventListener('keydown', this.cierraBilletera, true); this.cierraBilletera = null; }
    if (!si) return;
    this.audio.play('monedas', { ui: true, vol: 0.2, vary: 0.2 });
    this.cierraBilletera = (e) => {
      if (e.type === 'keydown' && e.code !== 'Escape') return;
      if (e.type === 'mousedown' && box.contains(e.target)) return;
      if (e.type === 'keydown') { e.stopPropagation(); e.preventDefault(); }
      this.abrirBilletera(false);
    };
    setTimeout(() => { document.addEventListener('mousedown', this.cierraBilletera, true); document.addEventListener('keydown', this.cierraBilletera, true); }, 0);
  }

  refreshBars() {
    const g = this.game;
    const p = g.player;
    const survival = g.mode === 'survival';
    const armorPts = g.inventory.armorValue().points;
    const enMano = g.inventory.held, come = enMano && p.food < 20 ? (getDef(enMano.id) || {}).food || 0 : 0;
    const key = `${survival}|${p.maxHealth}|${p.health}|${p.food}|${p.water}|${Math.ceil(p.air)}|${p.body.headInWater}|${armorPts}|${come}`;
    if (key === this.lastBars) return;
    this.lastBars = key;
    $('#bars').classList.toggle('hidden', !survival);
    if (!survival) return;
    // se reutilizan los íconos: el que cambia avisa, con un destello si se perdió y un brinquito si se ganó
    const calma = document.body.classList.contains('calma');
    const row = (el, value, full, half, empty, n = 10) => {
      while (el.children.length > n) el.lastChild.remove();
      while (el.children.length < n) { const nuevo = document.createElement('img'); nuevo.alt = ''; el.appendChild(nuevo); }
      for (let i = 0; i < n; i++) {
        const v = Math.max(0, Math.min(2, value - i * 2)), img = el.children[i], src = v === 2 ? full : v === 1 ? half : empty;
        if (img.getAttribute('src') !== src) img.src = src;
        if (!calma && img.nivel !== undefined && img.nivel !== v) {
          if (v < img.nivel) img.animate([{ filter: 'brightness(3.2)', scale: 1.35, translate: '0 -3px' }, { filter: 'brightness(1)', scale: 1, translate: '0 0' }], { duration: 340, easing: 'ease-out' });
          else img.animate([{ scale: 0.7 }, { scale: 1.3, offset: 0.55 }, { scale: 1 }], { duration: 300, easing: 'ease-out' });
        }
        img.nivel = v;
      }
    };
    row($('#hearts'), Math.ceil(p.health), IC.heart, IC.heartHalf, IC.heartEmpty, Math.ceil(p.maxHealth / 2));
    // con más de diez corazones (comida con fuerza, corazones ganados) se achican para caber en el mismo espacio
    { const n = Math.ceil(p.maxHealth / 2), w = n > 10 ? `${Math.max(12, Math.floor(220 / n))}px` : ''; for (const im of $('#hearts').children) { im.style.width = w; im.style.height = w; } }
    row($('#food'), Math.ceil(p.food), IC.food, IC.foodHalf, IC.foodEmpty);
    row($('#water'), Math.ceil(p.water ?? 20), IC.water, IC.waterHalf, IC.waterEmpty);
    // con comida en la mano, la barra enseña hasta dónde llenaría
    { const fin = Math.min(20, Math.ceil(p.food) + come); [...$('#food').children].forEach((im, i) => im.classList.toggle('previa', come > 0 && Math.max(0, Math.min(2, fin - i * 2)) > im.nivel)); }
    // lo que se está acabando late, para verlo sin tener que contar
    $('#hearts').classList.toggle('poca', p.health > 0 && p.health <= 6);
    $('#hearts').classList.toggle('muy-poca', p.health > 0 && p.health <= 3);
    $('#food').classList.toggle('poca', p.food <= 6);
    $('#water').classList.toggle('poca', (p.water ?? 20) <= 6);
    if (armorPts > 0) row($('#armorbar'), armorPts, IC.armor, IC.armorHalf, IC.armorEmpty); else $('#armorbar').innerHTML = '';
    const air = $('#air');
    air.innerHTML = '';
    if (p.body.headInWater || p.air < 10) {
      const n = Math.ceil(p.air);
      for (let i = 0; i < n; i++) { const img = document.createElement('img'); img.src = IC.bubble; img.alt = ''; air.appendChild(img); }
    }
  }

  hurtFlash() {
    const o = $('#hurt-overlay');
    o.style.transition = 'none'; o.style.opacity = 1;
    setTimeout(() => { o.style.transition = 'opacity 0.5s'; o.style.opacity = 0; }, 30);
    const h = $('#hearts');
    h.classList.remove('shake'); void h.offsetWidth; h.classList.add('shake');
  }

  // al sacar la cabeza del agua, unas gotas que escurren por la vista
  gotas() {
    if (document.body.classList.contains('calma')) return;
    const el = document.createElement('div');
    el.className = 'gotas';
    $('#hud').appendChild(el);
    setTimeout(() => el.remove(), 900);
  }
  // lo recogido, al lado: «+3 Madera», sumando si sigue cayendo de lo mismo
  registroObjeto(id, n) {
    const box = $('#recogidos');
    let el = [...box.children].find((x) => x.idObj === id && !x.saliendo);
    if (el) {
      el.cuenta += n;
      el.querySelector('b').textContent = `+${el.cuenta}`;
      if (!document.body.classList.contains('calma')) el.animate([{ scale: 1.14 }, { scale: 1 }], { duration: 160, easing: 'ease-out' });
    } else {
      el = document.createElement('div');
      el.idObj = id; el.cuenta = n;
      const img = document.createElement('img'), b = document.createElement('b'), t = document.createElement('span');
      img.src = iconURL(id); img.alt = ''; b.textContent = `+${n}`; t.textContent = itemName(id);
      el.append(img, b, t);
      box.appendChild(el);
      while (box.children.length > 5) box.firstChild.remove();
    }
    clearTimeout(el.salirT);
    el.salirT = setTimeout(() => { el.saliendo = true; el.classList.add('sale'); setTimeout(() => el.remove(), 280); }, 2600);
  }

  setUnderwater(on) { const o = $('#water-overlay'); if (o.dentro !== on) { o.dentro = on; o.style.opacity = on ? 1 : 0; } }
  // Fundido a negro para dormir: oscurece, ejecuta mid() y aclara
  sleepFade(mid, done, sueno) {
    const o = $('#sleep-overlay');
    o.textContent = sueno || '';
    o.style.transition = 'opacity 1.2s'; o.style.opacity = 1;
    // con sueño, la pantalla negra dura lo que tarda en leerse
    const espera = sueno ? Math.min(7000, 2400 + sueno.length * 38) : 900;
    setTimeout(() => { mid(); setTimeout(() => { o.style.opacity = 0; setTimeout(() => { o.textContent = ''; done(); }, 1200); }, espera); }, 1300);
  }
  // brújula arriba: los rumbos y los lugares de uno (cama, bolso, lote, punto marcado) con su distancia
  updateCompass(g) {
    const strip = $('#compass-strip');
    if (!strip) return;
    const box = $('#compass');
    box.style.display = g.hudHidden || (g.dim === 'inframundo' && !todosBolsos(g).some((q) => q.dim === 'inframundo')) ? 'none' : '';
    const p = g.player.body.pos, d = g.player.lookDir();
    const facing = Math.atan2(d.x, -d.z);
    const wrap = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
    const items = [['N', 0], ['NE', Math.PI / 4], ['E', Math.PI / 2], ['SE', Math.PI * 0.75], ['S', Math.PI], ['SO', -Math.PI * 0.75], ['O', -Math.PI / 2], ['NO', -Math.PI / 4]].map(([t, a]) => ({ t, a, mk: false }));
    const meta = g.meta, here = g.dim === 'tierra';
    const add = (icon, q, pin, sinDim) => { if (!q || (!here && !sinDim)) return; const dist = Math.hypot(q.x - p.x, q.z - p.z); if (dist < 3) return; items.push({ t: icon, a: Math.atan2(q.x - p.x, -(q.z - p.z)), mk: true, dist, pin }); };
    add('🩸', g.nemesisMob && !g.nemesisMob.dead ? g.nemesisMob.body.pos : null, true);
    add('🆘', marcaRescate(g), true);
    add('📁', marcaArchivo(g), true);
    add('🔥', marcaQuema(g), true);
    add('🐜', marcaMarabunta(g), true);
    add('🦗', marcaPlaga(g), true);
    add('🏴', marcaGoleta(g), true);
    add('⛏', marcaMinaOro(g), true);
    add('⚠', marcaFurtivos(g), true);
    add('🏪', marcaAsalto(g), true);
    marcasEncargos(g).forEach((q) => add('📌', q, true));
    { const mex = marcaExpediente(g); add('📜', mex.hoja, true); add('📋', mex.plaza, true); }
    add('🛏', meta.spawn); for (const q of todosBolsos(g)) if (q && (q.dim || 'tierra') === g.dim) add('🎒', q, true, true); if (here && meta.bolso && meta.bolso.dim && meta.bolso.dim !== 'tierra') add('🌀', meta.portal, true); add('🏠', meta.lote); add('📍', meta.marca); add('❗', meta.historia && meta.historia.pos); add('📖', marcaHistoria(g), true); add('🕸', nidoMasCercano(g)); add('🧳', meta.rigo && meta.rigo.pos); add('📦', puntoEscondite(g)); if (meta.hist && meta.hist.casa) add('🏡', meta.hist.casa); add('❌', meta.tesoro); add('🏕', meta.tour && meta.tour.pos);
    // los 3 marcadores más cercanos
    if (meta.marcadores && meta.marcadores.length) [...meta.marcadores].sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z)).slice(0, 3).forEach((m) => add('🔖', m));
    let html = '';
    for (const it of items) {
      const diff = wrap(it.a - facing);
      if (Math.abs(diff) > Math.PI / 2) {
        if (!it.pin) continue;
        html += `<span class="mk" style="left:${diff > 0 ? 97 : 3}%">${diff > 0 ? '' : '‹'}${it.t}${diff > 0 ? '›' : ''}</span>`;
        continue;
      }
      const x = 50 + (diff / (Math.PI / 2)) * 50;
      html += it.mk ? `<span class="mk" style="left:${x}%">${it.t}<small>${Math.round(it.dist)}</small></span>` : `<span style="left:${x}%${it.t.length > 1 ? ';font-size:12px;opacity:.75' : ''}">${it.t}</span>`;
    }
    if (html !== this.compassHTML) { strip.innerHTML = html; this.compassHTML = html; }
  }

  // subtítulos de sonidos: qué sonó y de qué lado (◀ izquierda, ▶ derecha), se van solitos a los 2,5 s
  caption(name, pos, player) {
    const text = captionText(name);
    if (!text || !player) return;
    const p = player.body.pos;
    const dx = pos.x - p.x, dz = pos.z - p.z, d = Math.hypot(dx, dz);
    if (d > 36) return;
    const side = dx * Math.cos(player.yaw) - dz * Math.sin(player.yaw);
    const label = `${side < -1.5 ? '◀ ' : ''}${text}${side > 1.5 ? ' ▶' : ''}`;
    const box = $('#captions');
    this.caps = this.caps || new Map();
    let c = this.caps.get(text);
    if (!c) {
      c = { el: document.createElement('div') };
      box.appendChild(c.el);
      this.caps.set(text, c);
      while (box.children.length > 6) { const old = box.firstChild; for (const [k, v] of this.caps) if (v.el === old) this.caps.delete(k); old.remove(); }
    }
    c.el.textContent = label;
    c.el.style.opacity = Math.max(0.45, 1 - d / 40);
    clearTimeout(c.t);
    c.t = setTimeout(() => { c.el.remove(); this.caps.delete(text); }, 2500);
  }

  // los logros también hacen fila con el locutor: antes se encimaban varias tarjetas en el mismo rincón
  achievement(text, icon = '🏆', n = 0) {
    (this.locutor ||= new Locutor(this)).decir(`🏆 ${text}`, { cat: 'importante', clave: `logro:${text}`, logro: { icono: icon, n } });
  }

  renderEffects(e) {
    const names = { empapado: '🌧 Ropa empapada', torsalo: '🪱 Tórsalo', bala: '🐜 Picada de bala', bendicion: '✝ Bendición', pavor: '😱 Pavor', paralisis: '⚡ Parálisis', garrapatas: '🕷 Garrapatas', ardor: '🪼 Ardor', enlodado: '🟫 Lodo', quebrado: '🦴 Pierna quebrada', cojera: '🦵 Cojera', calor: '🥵 Calor', fuerza: '💪 Con fuerza', coraza: '🛡 Buen provecho', aguante: '⚡ Con aguante', fresco: '🧊 Frescura', lleno: '🍲 Panza llena', fiebre: '🤒 Fiebre', veneno: '☠ Veneno', calma: '🦥 Calma', suerte: '🍀 Suerte', miel: '🍯 Miel', energia: '☕ Energía', delfin: '🐬 Gracia del delfín', miedo: '😨 Miedo', escalofrio: '🥶 Escalofrío', repelente: '🦟 Repelente', enredado: '🌿 Enredo', antiveneno: '🧪 Antídoto', descansado: '😌 Buen descanso', panza: '🤢 Dolor de panza', monte: '🌳 Corazón del monte', termal: '♨ Aguas termales', mareo: '🥴 Mareo', sangrando: '🩸 Sangrando', cansado: '🥱 Cansancio', ignifugo: '🔥 Piel de fuego', buceo: '🤿 Careta', pluma: '🪶 Pluma dorada', viaje: '🍄 De viaje' };
    const key = Object.keys(e).map((k) => `${k}${k === 'garrapatas' || k === 'torsalo' || k === 'empapado' ? '' : Math.ceil(e[k])}`).join('|');
    if (key === this.lastEffects) return;
    this.lastEffects = key;
    const el = $('#effects');
    el.innerHTML = '';
    for (const [k, v] of Object.entries(e)) {
      const d = document.createElement('div');
      d.textContent = k === 'garrapatas' || k === 'torsalo' || k === 'empapado' ? (names[k] || k) : `${names[k] || k} ${Math.ceil(v)}s`; // los que no se van solos, sin cuenta
      d.className = k;
      el.appendChild(d);
    }
  }

  setInLava(on) { $('#lava-overlay').style.opacity = on ? 1 : 0; }

  // barra de experiencia (solo en supervivencia)
  renderXP(info, show) {
    const key = show ? `${info.level}|${info.into}` : 'off';
    if (key === this.xpKey) return;
    this.xpKey = key;
    $('#xpbar').classList.toggle('hidden', !show);
    if (!show) return;
    $('#xp-fill').style.width = `${(info.into / info.need) * 100}%`;
    $('#xp-level').textContent = info.level > 0 ? info.level : '';
  }

  // barra de vida de una leyenda
  bossBar(name, frac, tipo) {
    const key = name ? `${name}|${Math.round(frac * 100)}` : 'off';
    if (key === this.bossKey) return;
    this.bossKey = key;
    $('#bossbar').classList.toggle('hidden', !name);
    if (!name) return;
    $('#boss-name').textContent = name;
    // el retrato de los jefes que lo tienen (public/ui/jefes/<tipo>.png)
    let img = $('#boss-img');
    if (!img) { img = document.createElement('img'); img.id = 'boss-img'; img.alt = ''; img.onerror = () => { img.style.display = 'none'; }; $('#bossbar').prepend(img); }
    if (img.dataset.tipo !== tipo) { img.dataset.tipo = tipo || ''; img.style.display = ''; img.src = tipo && RETRATOS.has(tipo) ? `./ui/jefes/${tipo}.png` : ''; if (!RETRATOS.has(tipo)) img.style.display = 'none'; }
    $('#boss-fill').style.width = `${Math.max(0, frac) * 100}%`;
  }

  // globo de diálogo de los vecinos
  dialog(name, text, ms = 4200) {
    this.dialogoHasta = performance.now() + ms; // el locutor espera mientras alguien habla
    $('#dialog-name').textContent = name;
    $('#dialog-text').textContent = aColones(text);
    $('#dialog').classList.add('on');
    clearTimeout(this.dialogT);
    this.dialogT = setTimeout(() => $('#dialog').classList.remove('on'), ms);
  }

  // ---------- mapa ----------
  openMap() {
    if (this.state !== 'playing') return;
    this.state = 'map';
    this.game.releaseAll();
    this.exitLock();
    this.pausaPanel();
    this.show('map');
    this.mapScale = this.mapScale || 2;
    this.mapPan = { x: 0, z: 0 }; // cada vez que se abre, centrado en uno
    const cv = $('#map-canvas');
    if (!cv.dataset.ready) {
      cv.dataset.ready = '1';
      cv.addEventListener('wheel', (e) => { e.preventDefault(); this.zoomMap(e.deltaY > 0 ? 1 : -1); }, { passive: false });
      // arrastrar con el clic izquierdo mueve el mapa (doble clic o la tecla C lo vuelve a centrar en uno)
      cv.addEventListener('mousedown', (e) => { this.mapArrastro = false; if (e.button === 0) this.mapDrag = { x: e.clientX, y: e.clientY, movio: 0 }; });
      window.addEventListener('mousemove', (e) => {
        const D = this.mapDrag;
        if (!D || this.state !== 'map') return;
        const r = cv.getBoundingClientRect(), k = cv.width / r.width, s = this.mapScale || 2, dx = e.clientX - D.x, dy = e.clientY - D.y;
        D.x = e.clientX; D.y = e.clientY; D.movio += Math.abs(dx) + Math.abs(dy);
        const o = (this.mapPan ||= { x: 0, z: 0 });
        o.x -= dx * k * s; o.z -= dy * k * s;
        if (D.movio > 4) { cv.style.cursor = 'grabbing'; this.drawMapSoon(); }
      });
      window.addEventListener('mouseup', () => { if (this.mapDrag) { this.mapArrastro = this.mapDrag.movio > 4; this.mapDrag = null; cv.style.cursor = ''; setTimeout(() => { this.mapArrastro = false; }, 0); } }); // si se suelta fuera del mapa no llega el click: que no se trague el siguiente
      cv.addEventListener('dblclick', () => { this.mapPan = { x: 0, z: 0 }; this.drawMapLoop(); });
      // clic: ahí queda el destino, y la brújula lo señala. Otro clic en el mismo punto lo quita.
      cv.addEventListener('click', (e) => {
        const G = this.game;
        if (G.dim !== 'tierra') return;
        const r = cv.getBoundingClientRect(), k = cv.width / r.width, s = this.mapScale || 2, pp = G.player.body.pos;
        if (this.mapArrastro) { this.mapArrastro = false; return; } // fue un arrastre, no un clic
        const o = this.mapPan || { x: 0, z: 0 };
        const wx = Math.round(((e.clientX - r.left) * k - cv.width / 2) * s + pp.x + o.x), wz = Math.round(((e.clientY - r.top) * k - cv.height / 2) * s + pp.z + o.z);
        const M = G.meta.marca;
        if (M && Math.hypot(M.x - wx, M.z - wz) < 8 * s) { G.meta.marca = null; this.toast('📍 Destino quitado', 1400); } else { G.meta.marca = { x: wx, y: Math.floor(pp.y), z: wz }; this.toast('📍 Destino marcado: la brújula lo señala', 2000); G.achieve('destino', 'Con rumbo'); }
        this.drawMapLoop();
      });
      // clic derecho sobre un marcador lo borra
      cv.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const r = cv.getBoundingClientRect(), k = cv.width / r.width, s = this.mapScale || 2, pp = this.game.player.body.pos;
        const o = this.mapPan || { x: 0, z: 0 };
        const wx = ((e.clientX - r.left) * k - cv.width / 2) * s + pp.x + o.x, wz = ((e.clientY - r.top) * k - cv.height / 2) * s + pp.z + o.z;
        if (borrarMarcadorEn(this.game, wx, wz, 10 * s)) this.drawMapLoop();
      });
    }
    this.drawMapLoop();
    this.audio.play('open', { ui: true, vol: 0.3 });
    this.game.achieve('mapa', 'Cartógrafo');
  }

  // v11.13.3: la leyenda del mapa, con filtro: cada capa se esconde o se muestra con un clic (el número es cuántos hay en la vista)
  leyendaMapa() {
    const cv = $('#map-canvas');
    let box = $('#map-leyenda');
    if (!box) {
      box = document.createElement('div'); box.id = 'map-leyenda'; box.className = 'chips'; box.setAttribute('aria-label', 'Leyenda: mostrar u ocultar');
      for (const c of CAPAS_MAPA) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.dataset.capa = c.id; b.style.setProperty('--cat', c.color);
        b.title = `Mostrar u ocultar: ${c.nombre.toLowerCase()}`;
        b.addEventListener('click', () => { const O = (this.mapOcultas ||= new Set()); if (O.has(c.id)) O.delete(c.id); else O.add(c.id); this.drawMapLoop(); });
        box.append(b);
      }
      cv.after(box);
    }
    const n = cuentaMapa(), O = this.mapOcultas || new Set();
    for (const b of box.children) {
      const c = CAPAS_MAPA.find((k) => k.id === b.dataset.capa), k = n[c.id] || 0, txt = `${c.nombre} <small>${k}</small>`;
      if (b.innerHTML !== txt) b.innerHTML = txt;
      b.setAttribute('aria-pressed', String(!O.has(c.id))); b.dataset.n = k;
    }
  }

  zoomMap(dir) {
    const steps = [1, 2, 4, 8, 16];
    const i = Math.max(0, Math.min(steps.length - 1, steps.indexOf(this.mapScale) + dir));
    this.mapScale = steps[i];
    this.drawMapLoop();
  }

  // v13.0.2: varios mousemove por cuadro piden un solo redibujo (antes cada uno repintaba todo el mapa)
  drawMapSoon() {
    if (this.mapSucio) return;
    this.mapSucio = true;
    const ir = () => { this.mapSucio = false; this.drawMapLoop(); };
    if (document.hidden) setTimeout(ir, 16); else requestAnimationFrame(ir);
  }

  // pinta de a poco (unos 8 ms de baldosas y bloques nuevos por vuelta) para no trabar el juego
  drawMapLoop() {
    clearTimeout(this.mapT);
    if (this.state !== 'map') return;
    $('#map-scale').textContent = `· 1 píxel = ${this.mapScale} ${this.mapScale === 1 ? 'bloque' : 'bloques'}`;
    const pp = this.game.player.body.pos, o = this.mapPan || { x: 0, z: 0 };
    const done = drawMap($('#map-canvas'), this.game, this.mapScale, 8, { arrastrando: !!(this.mapDrag && this.mapDrag.movio > 4), centro: { x: pp.x + o.x, y: pp.y, z: pp.z + o.z }, ocultas: (this.mapOcultas ||= new Set()) });
    this.leyendaMapa();
    if (!done) this.mapT = setTimeout(() => this.drawMapLoop(), 16);
  }

  // ---------- libreta: logros y habilidades ----------
  openLibreta(tab) {
    if (this.state !== 'playing' && this.state !== 'libreta') return;
    const first = this.state === 'playing';
    this.state = 'libreta';
    this.libTab = tab;
    if (first) { this.game.releaseAll(); this.exitLock(); this.show('libreta'); this.audio.play('open', { ui: true, vol: 0.3 }); this.pausaPanel(tab === 'manas'); } // las mañas siempre pausan
    const body = $('#lib-body');
    if (!body.dataset.ready) {
      body.dataset.ready = '1';
      document.querySelectorAll('[data-lib]').forEach((b) => b.addEventListener('click', () => this.openLibreta(b.dataset.lib)));
      body.addEventListener('click', (e) => {
        if (e.target.closest('[data-album]')) { if (cambiarRepetidas(this.game)) this.openLibreta('album'); return; }
        const c = e.target.closest('[data-mana]');
        if (!c || !escogerMana(this.game, c.dataset.mana)) return;
        // si se abrió sola y ya no queda nada por escoger, se sigue jugando de una vez
        if (this.game.manaAuto && !pendientes(this.game)) { this.game.manaAuto = false; this.closeLibreta(); } else this.openLibreta('manas');
      });
    }
    document.querySelectorAll('[data-lib]').forEach((b) => { b.classList.toggle('on', b.dataset.lib === tab); b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', b.dataset.lib === tab ? 'true' : 'false'); });
    // v12.4.5: la libreta (bestiario, álbum, ayuda, diario…) se carga la primera vez que se abre; si se cambió de pestaña o se cerró
    // mientras llegaba, no se pinta una vieja
    const pinta = (m) => { if (this.state === 'libreta' && this.libTab === tab) body.innerHTML = aColones(m.libretaHTML(this.game, tab)); };
    if (this.libreta) pinta(this.libreta);
    else { body.innerHTML = ''; import('./libreta.js').then((m) => { this.libreta = m; pinta(m); }).catch(() => this.toast('No se pudo cargar la libreta: recargue la página', 3000)); } // v12.4.9: con aviso
  }

  // v11.12.1: el mapa, la libreta y la tienda pausan el juego si el ajuste está activo (por defecto sí). Se anota quién pausó
  // para que al cerrar solo se despause lo que pausó el panel (antes cerrar la libreta despausaba siempre)
  pausaPanel(siempre = false) {
    if ((siempre || this.settings.pausaPaneles !== false) && !this.game.paused) { this.game.paused = true; this.pausoPanel = true; }
  }
  despausaPanel() { if (this.pausoPanel) { this.game.paused = false; this.pausoPanel = false; } }

  closeLibreta() {
    this.despausaPanel();
    this.audio.play('close', { ui: true, vol: 0.3 });
    this.hideScreens();
    this.state = 'playing';
    this.requestLock();
  }

  closeMap() {
    clearTimeout(this.mapT);
    this.despausaPanel();
    this.audio.play('close', { ui: true, vol: 0.3 });
    this.hideScreens();
    this.state = 'playing';
    this.requestLock();
  }

  // ---------- pulpería y soda ----------
  openShop(mob) {
    if (this.state !== 'playing') return;
    const shop = SHOPS[mob.data.role];
    if (!shop) return;
    this.shop = { mob, shop };
    this.state = 'shop';
    this.game.releaseAll();
    this.exitLock();
    this.pausaPanel();
    this.show('shop');
    $('#shop-title').textContent = shop.title + estrellas(repDe(this.game, mob));
    const fiado = $('#shop-fiado');
    fiado.onclick = () => {
      const meta = this.game.meta;
      if (meta.fiado) return;
      if (meta.fiadoMoroso) { this.dialog(mob.data.name, 'Mire, con lo de la otra vez… ya no le fío. El cuaderno no miente.'); return; }
      const n = montoFiado(this.game, mob);
      meta.fiado = n; meta.fiadoDia = this.game.day || 1;
      this.giveColones(n);
      this.audio.play('monedas', { ui: true, vol: 0.5 });
      this.dialog(mob.data.name, `Ahí le apunto ₡${n} en el cuaderno… Tiene cinco días, ¡eh!`);
      this.renderShop();
    };
    // pagar lo fiado de un solo, con clic en la deuda
    const deuda = $('#shop-debt');
    deuda.onclick = () => {
      const meta = this.game.meta, inv = this.game.inventory;
      if (!meta.fiado || inv.count(COLON) < meta.fiado) return;
      inv.remove(COLON, meta.fiado); saldarFiado(this.game, mob, this);
      this.audio.play('caja', { ui: true, vol: 0.4 });
      this.renderShop();
    };
    this.renderShop();
    this.audio.play('open', { ui: true, vol: 0.3 });
  }

  giveColones(n) {
    const g = this.game;
    const left = g.inventory.darColones(n * UNIDAD);
    if (left) g.entities.dropItem(COLON, left, g.player.body.pos.x, g.player.body.pos.y + 1, g.player.body.pos.z);
  }

  renderShop() {
    if (!this.shop) return;
    const { shop, mob } = this.shop;
    const g = this.game, inv = g.inventory, meta = g.meta;
    const money = inv.colones() / UNIDAD; // en unidades, con fracción (los precios usan monedas chicas)
    $('#shop-colones').textContent = fmtUnidades(money);
    // el cambio: en cualquier comerciante (pulpería, soda, carretilla…), monedas a billetes y al revés
    const bc = $('#shop-cambio-b'), bm = $('#shop-cambio-m');
    if (bc && !bc.dataset.ok) {
      bc.dataset.ok = '1';
      bc.addEventListener('mousedown', (e) => { e.preventDefault(); this.game.inventory.cambiar(true); this.toast('💵 Plata cambiada: en la menor cantidad de billetes', 1600, 'registro'); this.audio.play('caja', { ui: true, vol: 0.35 }); this.renderShop(); });
      bm.addEventListener('mousedown', (e) => { e.preventDefault(); this.game.inventory.cambiar(false); this.toast('🪙 Billetes partidos en monedas', 1600, 'registro'); this.audio.play('caja', { ui: true, vol: 0.35 }); this.renderShop(); });
    }
    if (bc) { bc.disabled = !inv.colones(); bm.disabled = !inv.slots.some((x) => x && esPlata(x.id) && x.id !== COLON && x.id > 350); }
    $('#shop-coin').src = iconURL(COLON);
    const atraso = meta.fiado ? (g.day || 1) - (meta.fiadoDia || g.day || 1) : 0;
    $('#shop-debt').textContent = aColones(meta.fiado ? `Debe ${meta.fiado} colones${atraso > 5 ? ' — ¡ATRASADO!' : ` (le quedan ${Math.max(0, 5 - atraso)} días)`}${money >= meta.fiado && atraso >= 1 ? ' · clic aquí para pagar' : ''}` : meta.fiadoMoroso ? 'En el cuaderno sale como moroso' : '');
    $('#shop-debt').style.cursor = meta.fiado && money >= meta.fiado ? 'pointer' : '';
    $('#shop-fiado').classList.toggle('hidden', !shop.fiado || !!meta.fiado || money > 0 || !!meta.fiadoMoroso);
    $('#shop-fiado').textContent = `Pedir fiado (${montoFiado(g, mob)} colones)`;
    const row = (id, n, price, can, onClick, arrow) => {
      const el = document.createElement('div');
      el.className = 'shop-row' + (can ? '' : ' off');
      el.innerHTML = `<img alt=""><span class="n"></span><span class="p"><img class="coin" alt="colones"><b></b></span>`;
      el.querySelector('img').src = iconURL(id);
      el.querySelector('.coin').src = iconURL(COLON);
      el.querySelector('.n').textContent = `${itemName(id)} ×${n}${arrow || ''}`;
      el.querySelector('.p b').textContent = sinSimbolo(fmtUnidades(price)); // en colones de verdad (la moneda ya se ve al lado)
      el.addEventListener('mousedown', (e) => { e.preventDefault(); if (can) for (let k = 0; k < (e.shiftKey ? 5 : 1); k++) if (!onClick()) break; this.renderShop(); });
      el.tabIndex = 0; el.setAttribute('role', 'button'); // v11.13.3: con Tab y Enter
      el.addEventListener('keydown', (e) => { if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); e.stopPropagation(); if (can) for (let k = 0; k < (e.shiftKey ? 5 : 1); k++) if (!onClick()) break; this.renderShop(); } });
      return el;
    };
    const sell = $('#shop-sell'); sell.innerHTML = '';
    const fr = factorRep(repDe(g, mob));
    for (const [id, n, base0] of [...shop.sell, ...extraVentas(g, mob.data.role)]) {
      const price = precioBonito(base0 * fr * ventaja.tienda(g), true);
      sell.appendChild(row(id, n, price, money >= price, () => {
        if (inv.colones() + 0.5 < price * UNIDAD) return false;
        inv.pagarColones(price * UNIDAD);
        const left = inv.add(id, n);
        if (left) g.entities.dropItem(id, left, g.player.body.pos.x, g.player.body.pos.y + 1, g.player.body.pos.z);
        this.audio.play('caja', { ui: true, vol: 0.35 });
        g.achieve('compra', 'Cliente de la pulpe');
        if (shop.lujo && id === 351) g.achieve('casado_caro', 'Experiencia gastronómica');
        if (id === 389) g.achieve('escritura', 'Un pedacito de costa a mi nombre');
        if (!shop.lujo && mob.data.role === 'sodera_playa') g.achieve('comercio_local', 'Apoyé al comercio local');
        return true;
      }));
    }
    const buy = $('#shop-buy'); buy.innerHTML = '';
    for (const [id, n, base] of [...shop.buy.filter((b) => !comprasMolienda(g, mob.data.role).some((c) => c[0] === b[0])), ...comprasMolienda(g, mob.data.role)]) { // v12.4.7: la molienda
      const feria = mob.data.role === 'feriante' && diaDeFeria(g) && COSECHAS.includes(id) ? 1.25 : 1; // v12.4.0: el sábado de feria
      let price = precioBonito(base * factorDia(g, id) * feria / fr, false);
      // v12.4.4: si el mismo tramo vende eso, nunca paga más del 90 % de lo que lo cobra (con la feria se podía revender mazorca)
      const vende = shop.sell.find((v) => v[0] === id);
      if (vende) price = Math.min(price, precioBonito((precioBonito(vende[2] * fr * ventaja.tienda(g), true) / vende[1]) * n * 0.9, false));
      // v12.4.12 (C8-A, §0.4): el cupo del comprador: pasadas las 30 u del día, este puesto paga el 40 %
      const cupoClave = `${String(mob.data.vid || '').split(':')[0]}:${id}`, precioLleno = price; // v12.5.1: por pueblo y por ítem (por vecino no limitaba: las cosechas las compran 4–7 puestos)
      if (cupoUsado(g, cupoClave) >= CUPO_DIA) price = precioBonito(price * 0.4, false);
      buy.appendChild(row(id, n, price, inv.count(id) >= n, () => {
        if (inv.count(id) < n) return false;
        if (id === 296 && comprasMolienda(g, mob.data.role).length) g.achieve('molienda', 'Día de molienda');
        if (feria > 1 && !diaDeFeria(g)) { this.openShop(mob); return false; } // v12.4.4: se acabó la feria con la tienda abierta
        inv.remove(id, n);
        const llenoAntes = cupoUsado(g, cupoClave) >= CUPO_DIA; // se mira en cada venta (con Mayús se venden 5 seguidas)
        let pay = precioBonito(pagarConCupo(g, cupoClave, precioLleno), false);
        const recienLleno = !llenoAntes && cupoUsado(g, cupoClave) >= CUPO_DIA;
        // lo fiado se cobra primero
        if (meta.fiado) { const d = Math.min(meta.fiado, pay); meta.fiado -= d; pay -= d; if (!meta.fiado) saldarFiado(g, mob, this); }
        if (pay) this.giveColones(pay);
        this.audio.play('monedas', { ui: true, vol: 0.45, vary: 0.1 });
        if (id === 390 && mob.data.role === 'pistero') g.achieve('transportista', 'Transportista de combustible');
        if (recienLleno) { this.toast(`🧾 En este pueblo ya compraron bastante ${itemName(id).toLowerCase()} hoy: de aquí en adelante pagan menos`, 2800); this.openShop(mob); }
        return true;
      }, flecha(g, id)));
    }
    this.refreshHotbar();
  }

  closeShop() {
    this.despausaPanel();
    this.audio.play('close', { ui: true, vol: 0.3 });
    this.shop = null;
    this.hideScreens();
    this.state = 'playing';
    this.requestLock();
    this.refreshHotbar();
  }

  showRuta(html) {
    let el = $('#ruta-panel');
    if (!el) { el = document.createElement('div'); el.id = 'ruta-panel'; $('#hud').appendChild(el); }
    el.classList.toggle('hidden', !html);
    if (html) { const y = el.scrollTop; el.innerHTML = `<h4>🧭 Ruta del aventurero <small>(J · rueda para bajar)</small></h4><ol>${html}</ol>`; el.scrollTop = y; }
  }

  setStamina(frac, show) {
    const el = $('#stamina');
    if (!el) return;
    el.classList.toggle('on', show);
    el.classList.toggle('low', frac < 0.25);
    el.firstChild.style.width = `${Math.max(0, frac) * 100}%`;
  }

  // letrero de combate: parry, crítico, combo, guardia rota
  combatFlash(kind, text) {
    const el = $('#combat-flash');
    if (!el) return;
    el.className = kind; el.textContent = text;
    void el.offsetWidth; el.classList.add('show');
    if (kind === 'parry') { document.body.classList.add('parry'); setTimeout(() => document.body.classList.remove('parry'), 90); }
  }

  // letrero grande al entrar a una región
  regionBanner(name, lema) {
    const el = $('#region-banner');
    if (!el) return;
    if (!this.bannerDirecto) { // por el locutor, como «importante», con su propio dibujo
      this.toast(`${name} · ${lema || ''}`, 0, { cat: 'importante', clave: `banner:${name}`, render: { mostrar: () => { this.bannerDirecto = true; this.bannerHasta = 0; this.regionBanner(name, lema); this.bannerDirecto = false; }, quitar: () => el.classList.remove('show') } });
      return;
    }
    // un cartel no pisa al otro: «¡Ya es su casa!» y «Capítulo 3» salen en el mismo instante
    const ahora = performance.now();
    if (ahora < (this.bannerHasta || 0)) {
      if ((this.bannerCola ||= []).length < 3) this.bannerCola.push([name, lema]);
      if (!this.bannerT) this.bannerT = setTimeout(() => { this.bannerT = null; const n = this.bannerCola.shift(); if (n) this.regionBanner(n[0], n[1]); }, this.bannerHasta - ahora);
      return;
    }
    this.bannerHasta = ahora + 3200;
    el.querySelector('b').textContent = name;
    el.querySelector('span').textContent = aColones(lema || ''); // los carteles también dicen montos
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    // el que sigue en la fila, sin esperar a que otro cartel lo empuje
    if (this.bannerCola && this.bannerCola.length && !this.bannerT) this.bannerT = setTimeout(() => { this.bannerT = null; const n = this.bannerCola.shift(); if (n) this.regionBanner(n[0], n[1]); }, 3250);
  }

  // se le cierran los ojos un instante (cansancio)
  pestaneo() {
    const el = document.createElement('div');
    el.className = 'pestaneo';
    $('#hud').appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }

  // aviso chiquito de guardado automático
  guardado() {
    const el = $('#guardado');
    if (!el) return;
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  }

  mision(text) {
    if (text === this.misionTxt) return;
    this.misionTxt = text;
    $('#mision-hud').textContent = text || '';
  }

  objetivo(o) {
    const clave = o ? `${o.rotulo}|${o.texto}` : '';
    if (clave === this.objetivoClave) return;
    const el = $('#objetivo');
    const era = this.objetivoClave;
    this.objetivoClave = clave;
    el.innerHTML = '';
    if (!o) return;
    const b = document.createElement('b'); b.textContent = o.rotulo;
    el.append(b, document.createTextNode(o.texto));
    if (era) { el.classList.remove('nuevo'); void el.offsetWidth; el.classList.add('nuevo'); }
  }

  // todos los avisos pasan por el locutor (locutor.js): uno a la vez, por importancia y al ritmo de la lectura.
  // toast(texto, ms, o): ms ya no manda (la duración sale del largo); o = 'urgente' | 'consejo' | … o { cat, clave }
  toast(text, _ms, o) {
    if (!text) return;
    (this.locutor ||= new Locutor(this)).decir(String(text), typeof o === 'string' ? { cat: o } : o || {});
  }
  limpiarAvisos(todo) {
    if (this.locutor) this.locutor.limpiar(todo);
    $('#toast').style.opacity = 0;
    if (todo) { this.avisos = []; this.bannerCola = []; clearTimeout(this.bannerT); this.bannerT = null; this.bannerHasta = 0; }
  }
  // lo que dibuja el locutor en la zona principal (null = se va, con fundido)
  pintarAviso(text, cat, nuevo, animar) {
    const t = $('#toast');
    if (text === null) { t.style.opacity = 0; return; }
    t.textContent = aColones(text); // los montos del juego, en colones de verdad
    t.dataset.cat = cat || '';
    t.style.opacity = 1;
    if (nuevo && animar) t.animate([{ translate: '0 10px', opacity: 0 }, { translate: '0 0', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.2,.9,.3,1)' });
  }
  // lo que se dice con el inventario abierto: una línea discreta arriba del panel (no hace fila)
  avisoPanel(text) {
    const panel = document.querySelector('#screen-inventory .main-panel');
    if (!panel) return;
    let el = panel.querySelector('.inv-aviso');
    if (!el) { el = document.createElement('div'); el.className = 'inv-aviso'; panel.insertBefore(el, panel.children[1] || null); }
    el.textContent = aColones(text);
    el.classList.remove('fuera'); void el.offsetWidth;
    clearTimeout(this.avisoPanelT);
    this.avisoPanelT = setTimeout(() => el.classList.add('fuera'), Math.min(7000, 2500 + text.length * 45));
  }
  // la tarjeta del logro: una sola, la reutiliza el locutor
  tarjetaLogro(text, icon = '🏆', n = 0, nuevo = false) {
    let el = $('#logro-card');
    if (text === null) { if (el) el.classList.add('out'); return; }
    if (!el) { el = document.createElement('div'); el.id = 'logro-card'; el.className = 'achv'; el.innerHTML = '<i class="achv-icon"></i><div><b></b><span></span></div>'; $('#hud').appendChild(el); }
    el.querySelector('.achv-icon').textContent = icon;
    el.querySelector('b').textContent = n ? `¡Logro! · ${n}` : '¡Logro!';
    el.querySelector('span').textContent = aColones(text.replace(/^🏆\s*/, ''));
    if (nuevo) { el.classList.remove('out'); el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; }
  }
  // lo que no hace fila («Volando», «Guardado»): una línea en el rincón de lo recogido
  registroTexto(text) {
    const box = $('#recogidos');
    if (!box) return;
    let el = [...box.children].find((x) => x.texto === text && !x.saliendo);
    if (!el) { el = document.createElement('div'); el.texto = text; el.className = 'reg-texto'; el.textContent = text; box.appendChild(el); while (box.children.length > 5) box.firstChild.remove(); }
    clearTimeout(el.salirT);
    el.salirT = setTimeout(() => { el.saliendo = true; el.classList.add('sale'); setTimeout(() => el.remove(), 280); }, 2200);
  }
  // el número del golpe, sobre el enemigo
  numeroDano(n, x, y, z) {
    const g = this.game, S = g.settings;
    if (S && S.numeros === false) return;
    const c = g.camera, v = c.position.clone().set(x, y, z).project(c);
    if (v.z > 1 || Math.abs(v.x) > 1 || Math.abs(v.y) > 1) return;
    const el = document.createElement('div');
    el.className = `num-dano${n >= 12 ? ' fuerte' : ''}`;
    el.textContent = Math.round(n);
    el.style.left = `${(v.x * 0.5 + 0.5) * 100}%`;
    el.style.top = `${(-v.y * 0.5 + 0.5) * 100}%`;
    el.style.setProperty('--dx', `${(Math.random() - 0.5) * 40}px`);
    $('#hud').appendChild(el);
    setTimeout(() => el.remove(), 800);
  }
  // de dónde vino el golpe: una marca roja en esa dirección
  golpeDesde(dx, dz, yaw) {
    const f = dx * -Math.sin(yaw) + dz * -Math.cos(yaw), r = dx * Math.cos(yaw) + dz * -Math.sin(yaw);
    const el = document.createElement('div');
    el.className = 'golpe-dir';
    el.style.setProperty('--a', `${(Math.atan2(r, f) * 180) / Math.PI}deg`);
    $('#hud').appendChild(el);
    setTimeout(() => el.remove(), 800);
  }

  showItemName(text) {
    const el = $('#itemname');
    if (el.textContent !== text && text && !document.body.classList.contains('calma')) el.animate([{ translate: '0 6px' }, { translate: '0 0' }], { duration: 160, easing: 'ease-out' });
    el.textContent = text;
    el.style.opacity = 1;
    clearTimeout(this.nameT);
    this.nameT = setTimeout(() => { el.style.opacity = 0; }, 1600);
  }

  toggleDebug() { $('#debug').classList.toggle('hidden'); }
  updateDebug() {
    const d = $('#debug');
    if (d.classList.contains('hidden')) return;
    this.debugT = (this.debugT || 0) + 1;
    if (this.debugT % 10 === 0) d.textContent = this.game.debugText();
  }
  setHudHidden(h) {
    ['#crosshair', '#hotbar', '#bars', '#itemname', '#version-tag'].forEach((s) => $(s).style.visibility = h ? 'hidden' : 'visible');
  }

  // ---------- inventario y estaciones ----------
  // Contenedores: inv (36), grid (2x2 del inventario o 3x3 de la mesa), furnace (3), chest (27)
  openInventory() {
    if (this.state !== 'playing') return;
    this.station = null;
    this.craftSize = 2;
    this.grid = this.grid2 || (this.grid2 = new Array(4).fill(null));
    this.openContainerScreen('Inventario');
    this.audio.play('inv.open', { ui: true, vol: 0.45 });
  }

  // cofre que carga una criatura (danta de carga)
  openEntityChest(mob, titulo = 'Carga de la danta') {
    if (this.state !== 'playing') return;
    const p = mob.body.pos;
    this.station = { type: 'chest', x: Math.floor(p.x), y: -999, z: Math.floor(p.z), be: { slots: mob.data.chest }, entity: true };
    this.openContainerScreen(titulo);
    this.audio.play('chest.open', { ui: true, vol: 0.4 });
  }

  // v11.10.7: el chanchito de barro: todos los chanchitos del jugador abren las mismas 27 casillas (meta.chanchito), que nunca se pierden
  openChanchito(x, y, z) {
    if (this.state !== 'playing') return;
    const M = this.game.meta;
    if (!Array.isArray(M.chanchito)) M.chanchito = new Array(27).fill(null);
    this.station = { type: 'chest', x, y: -999, z, be: { slots: M.chanchito }, entity: true, chanchito: true };
    this.openContainerScreen('🐷 Chanchito de barro (el mismo en todos sus chanchitos)');
    this.audio.play('monedas', { ui: true, vol: 0.55, pitch: 1.25 });
    this.game.achieve('chanchito', 'Ahorrando en el chanchito');
  }

  // la mochila de cuero: 27 espacios más que se guardan con la partida
  openMochila() {
    if (this.state !== 'playing') return;
    const M = this.game.meta;
    if (!M.mochila) M.mochila = new Array(27).fill(null);
    this.station = { type: 'chest', x: 0, y: -999, z: 0, be: { slots: M.mochila }, entity: true };
    this.openContainerScreen('Mochila de cuero');
    this.audio.play('dig.cloth', { ui: true, vol: 0.5 });
    this.game.achieve('mochila', 'Con la mochila al hombro');
  }

  openStation(type, x, y, z) {
    if (this.state !== 'playing') return;
    const be = this.game.world.getBE(x, y, z);
    if (!be) return;
    if (be.type === 'chanchito') { this.openChanchito(x, y, z); return; }
    this.station = { type, x, y, z, be };
    revisarCofre(this.game, be); // v12.1.0: lo podrido de un cofre se vuelve sobras al abrirlo
    if (type === 'cooking' && this.game.mode === 'survival') this.toast(`🪵 Leña en el fogón: ${lenaFogon(this.game, this.station)} de 16 (clic derecho al fogón con leña en la mano)`, 2200);
    if (be.type === 'mostrador') cobrarCaja(this.game, be); // v12.15.1: lo que vendió solo pasa a la billetera
    if (type === 'taller') {
      const oficio = be.taller === 'horno' ? 'alfareria' : be.taller, of = OFICIOS[oficio];
      if (this.game.mode === 'survival') this.toast(`${of.icono} ${of.nombre}: nivel ${nivelDe(this.game, oficio)}${be.taller === 'herreria' || be.taller === 'horno' ? ` · 🪵 leña ${lenaTaller(this.game, this.station)} de 16 (clic derecho al taller con leña)` : ''}`, 2600);
    }
    if (type === 'crafting' || type === 'cooking' || type === 'taller') { this.craftSize = 3; this.grid = be.grid; }
    this.game.enterStation(type, x, y, z);
    const titles = { crafting: 'Mesa de trabajo', furnace: 'Horno', chest: 'Cofre', cooking: 'Fogón de leña', taller: { carpinteria: 'Banco de carpintero', herreria: 'Fragua', alfareria: 'Torno de alfarero', horno: 'Horno de barro' }[be.taller] };
    this.openContainerScreen({ alacena: 'Alacena', armario: 'Armario', tinaja: 'Tinaja', mostrador: 'Mostrador (se vende solo de 8 a 5)', refri: 'Refri', trampa: 'Trampa de lazo', nasa: 'Nasa de pesca', baul: 'Baúl grande' }[be.type] || titles[type]);
    if (be.type === 'refri') this.game.achieve('refri', 'Todo bien fresquito');
    document.body.classList.add('cinema');
    if (type === 'crafting') this.audio.play('creak', { ui: true, vol: 0.25 });
  }

  openContainerScreen(title) {
    this.state = 'inventory';
    this.game.releaseAll();
    this.exitLock();
    this.show('inventory');
    const scr = $('#screen-inventory');
    scr.classList.toggle('station', !!this.station);
    const creative = this.game.mode === 'creative';
    $('#inv-title').textContent = creative && !this.station ? 'Catálogo creativo' : title;
    this.armarTituloCofre(title);
    $('#creative-grid').classList.toggle('hidden', !creative || !!this.station);
    $('#creative-search-row').classList.toggle('hidden', !creative || !!this.station);
    const showCraft = (!creative && !this.station) || (this.station && (this.station.type === 'crafting' || this.station.type === 'cooking' || this.station.type === 'taller'));
    $('#craft-panel').classList.toggle('hidden', !showCraft);
    // vestidor con el personaje en 3D (no en las estaciones, que tienen su propia cámara)
    $('#char-panel').classList.toggle('hidden', !!this.station);
    scr.classList.remove('opening'); void scr.offsetWidth; scr.classList.add('opening');
    clearTimeout(this.openingT); this.openingT = setTimeout(() => scr.classList.remove('opening'), 900);
    if (!this.station) {
      if (!this.doll) {
        this.doll = new Vestidor($('#doll-canvas'), $('#doll-fx'));
        this.doll.onImpact = (slot, id) => {
          const d = ITEMS[id];
          this.audio.armor(d && d.mat);
          const el = this.armorEls && this.armorEls[slot];
          if (el) { el.classList.remove('equip-flash'); void el.offsetWidth; el.classList.add('equip-flash'); }
        };
      }
      // la apariencia escogida (meta.apariencia) y los botones para cambiarla
      const apK = JSON.stringify((this.game.meta && this.game.meta.apariencia) || {});
      if (this.doll.apK !== apK) { this.doll.apK = apK; this.doll.apariencia(JSON.parse(apK)); }
      if (!$('#apariencia')) this.armarApariencia();
      this.doll.setArmor(this.game.inventory.armor, false);
      this.startDoll();
    }
    $('#creative-search').value = '';
    if (creative && !this.station) this.renderCatalog('');
    this.buildStationArea(showCraft);
    this.renderInventory();
  }

  closeInventoryDom() {
    if (this.invBusca || (this.invCat && this.invCat !== 'todo')) { this.invBusca = ''; this.invCat = 'todo'; const i = $('#inv-buscar'); if (i) i.value = ''; const f = $('#inv-filtros'); if (f) f.classList.add('cerrado'); } // v11.13.3
    if (this.billeteraAbierta) this.abrirBilletera(false);
    if (this.drag) this.cancelarReparto(); // cerrar a medio reparto: todo vuelve como estaba
    // lo que quedó en la cuadrícula 2x2 vuelve al inventario (la mesa lo conserva encima)
    if (this.grid2) {
      for (let i = 0; i < 4; i++) if (this.grid2[i]) { const s = this.grid2[i]; this.dropToInventory(s); this.grid2[i] = null; }
    }
    if (this.cursor) { this.dropToInventory(this.cursor); this.cursor = null; }
    this.layoutJob = null;
    $('#cursor-stack').classList.add('hidden');
    $('#tooltip').classList.add('hidden');
    this.marcarSoltando(false); this.hoverEl = null;
  }

  // el cofre (o baúl) de uno lleva nombre: clic en el lápiz del título para ponérselo; sale al apuntarle y ordena la casa
  armarTituloCofre(base) {
    const h = $('#inv-title'), st = this.station, be = st && st.be;
    if (!be || st.type !== 'chest' || st.entity || !be.slots) return;
    const pintar = () => {
      h.textContent = be.nombre ? `${base} · «${be.nombre}»` : base;
      const lapiz = document.createElement('button');
      lapiz.type = 'button'; lapiz.className = 'lapiz'; lapiz.textContent = be.nombre ? '✏️' : '✏️ Ponerle nombre';
      lapiz.title = 'Un nombre como «Minerales» o «Comida» le dice a «Ordenar la casa» qué guardar aquí';
      lapiz.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); editar(); });
      h.appendChild(lapiz);
    };
    const editar = () => {
      const inp = document.createElement('input');
      inp.className = 'nombre-cofre'; inp.maxLength = 32; inp.value = be.nombre || ''; inp.placeholder = 'Minerales, Comida, Herramientas…';
      h.textContent = `${base} · `; h.appendChild(inp); inp.focus(); inp.select();
      const listo = (guardar) => {
        if (inp.dataset.listo) return; inp.dataset.listo = '1';
        if (guardar) { const n = [...inp.value].filter((ch) => ch.charCodeAt(0) >= 32).join('').trim().slice(0, 32); if (n) be.nombre = n; else delete be.nombre; this.game.world.touchBE(st.x, st.y, st.z); this.audio.play('select', { ui: true, vol: 0.3 }); }
        pintar();
      };
      inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.code === 'Enter') listo(true); else if (e.code === 'Escape') listo(false); });
      inp.addEventListener('blur', () => listo(true));
    };
    pintar();
  }

  // antes de mover nada: la lista de los cofres que se van a tocar y un botón para confirmar (v11.10.2). En los mundos viejos los
  // cofres de misión pueden venir marcados como suyos: así uno ve cuáles son antes de que se revuelvan
  confirmarCasa() {
    const area = $('#station-area'), g = this.game;
    if (!area) return;
    let box = area.querySelector('.casa-confirma');
    if (box) { box.remove(); return; }
    const L = cofresDeCasa(g).filter((c) => !(c.be.nombre && !categoriaDeNombre(c.be.nombre) && c.be.nombre !== 'Varios'));
    box = document.createElement('div'); box.className = 'casa-confirma';
    const t = document.createElement('div'); t.textContent = L.length < 2 ? 'Hacen falta al menos dos cofres suyos a 6 bloques para repartir.' : `Va a reordenar ${L.length} cofres por categoría:`;
    box.appendChild(t);
    if (L.length >= 2) {
      const ul = document.createElement('ul'), p = g.player.body.pos;
      for (const c of L) { const li = document.createElement('li'); const d = Math.round(Math.hypot(c.x + 0.5 - p.x, c.z + 0.5 - p.z)); li.textContent = `${c.be.type === 'baul' ? 'Baúl' : 'Cofre'} ${c.be.nombre ? `«${c.be.nombre}»` : 'sin nombre'} · a ${d} bloques`; ul.appendChild(li); }
      box.appendChild(ul);
    }
    const fila = document.createElement('div'); fila.className = 'sortbar';
    const si = document.createElement('button'); si.textContent = 'Sí, ordenar'; si.disabled = L.length < 2;
    const no = document.createElement('button'); no.textContent = 'Mejor no';
    si.addEventListener('mousedown', (e) => { e.preventDefault(); box.remove(); this.ordenarCasa(); this.audio.play('craft', { ui: true, vol: 0.3 }); this.renderInventory(); });
    no.addEventListener('mousedown', (e) => { e.preventDefault(); box.remove(); });
    fila.append(si, no); box.appendChild(fila);
    area.insertBefore(box, area.firstChild);
  }

  // «Ordenar la casa»: junta lo de los cofres de uno a 6 bloques y lo reparte por categoría. Un cofre con nombre de categoría
  // («Minerales») se queda con lo suyo; a los demás les toca la categoría que más hay sin dueño, y si no tienen nombre se les
  // sugiere uno. Solo toca cofres que uno puso (no los de las ruinas ni el del bolso). Lo que no cabe en el suyo va a otro.
  ordenarCasa() {
    const g = this.game;
    // un cofre con nombre propio que no es una categoría («Provisiones del abuelo») se deja tal cual
    const L = cofresDeCasa(g).filter((c) => !(c.be.nombre && !categoriaDeNombre(c.be.nombre) && c.be.nombre !== 'Varios'));
    if (L.length < 2) { this.toast('Hacen falta al menos dos cofres suyos cerca (a 6 bloques) para repartir', 2200); return 0; }
    // todo junto, con las pilas unidas (lo gastado o con mejoras no se junta)
    const todo = [], suelto = (x) => !x.dur && !x.mejora && !x.filo && !Object.keys(extras(x) || {}).length;
    for (const c of L) for (let i = 0; i < c.be.slots.length; i++) {
      const sl = c.be.slots[i];
      if (!sl) continue;
      c.be.slots[i] = null;
      const max = maxStack(sl.id), m = max > 1 && suelto(sl) && todo.find((t) => t.id === sl.id && t.count < max && suelto(t));
      if (m) { const n = Math.min(sl.count, max - m.count); juntar(m, n, sl.dia, (this.game.day || 1)); if (sl.count - n > 0) todo.push({ ...sl, count: sl.count - n }); } else todo.push({ ...sl });
    }
    const usadas = new Set();
    for (const c of L) { c.cat = categoriaDeNombre(c.be.nombre); if (c.cat) usadas.add(c.cat); }
    const cuenta = new Map();
    for (const it of todo) cuenta.set(categoria(it.id), (cuenta.get(categoria(it.id)) || 0) + it.count);
    const faltan = [...cuenta.entries()].filter(([k]) => !usadas.has(k)).sort((a, b) => b[1] - a[1]).map(([k]) => k);
    const libres = L.filter((c) => !c.cat && !c.be.nombre);
    // si hay más categorías que cofres libres, el último queda de «Varios» y recibe lo que sobre
    if (libres.length && faltan.length > libres.length) { const v = libres.pop(); v.be.nombre = 'Varios'; v.sugerido = true; v.varios = true; }
    for (const c of libres) if (faltan.length) { c.cat = faltan.shift(); c.be.nombre = nombreCategoria(c.cat); c.sugerido = true; }
    todo.sort((a, b) => ordenCategoria(a.id) - ordenCategoria(b.id) || a.id - b.id || b.count - a.count);
    const hueco = (c) => c.be.slots.indexOf(null);
    const meter = (c, it) => { const i = hueco(c); if (i < 0) return false; c.be.slots[i] = it; return true; };
    const resto = [];
    for (const it of todo) { const c = L.find((q) => q.cat === categoria(it.id) && hueco(q) >= 0); if (!c || !meter(c, it)) resto.push(it); }
    for (const it of resto) { const c = L.find((q) => (!q.cat || q.cat === 'varios') && hueco(q) >= 0) || L.find((q) => hueco(q) >= 0); if (c) meter(c, it); else this.dropToInventory(it); } // no debería pasar: al juntar pilas sobra espacio
    for (const c of L) { g.world.touchBE(c.x, c.y, c.z); g.particles.burst(c.x + 0.5, c.y + 1, c.z + 0.5, [[1, 0.95, 0.7]], 8, 1.4); }
    const nuevos = L.filter((c) => c.sugerido).map((c) => `${iconoCategoria(c.cat || 'varios')} ${c.be.nombre}`);
    this.toast(`🏠 Ordené ${L.length} cofres por categoría${nuevos.length ? `. Les puse nombre a ${nuevos.length}: ${nuevos.join(', ')} (cámbielo con el ✏️)` : ''}`, 4200);
    if (this.station && this.station.be) this.armarTituloCofre($('#inv-title').textContent.split(' · ')[0]);
    g.inventory.changed();
    return todo.length;
  }

  loQueCalza() {
    const st = this.station, be = st && st.type === 'chest' && st.be;
    if (!be || !be.slots) return null;
    const ids = new Set(be.slots.filter(Boolean).map((s) => s.id));
    let cat = categoriaDeNombre(be.nombre);
    if (!cat && ids.size >= 3) {
      const n = new Map();
      for (const id of ids) n.set(categoria(id), (n.get(categoria(id)) || 0) + 1);
      const [top, k] = [...n].sort((a, b) => b[1] - a[1])[0];
      if (k / ids.size >= 0.6 && top !== 'varios') cat = top;
    }
    if (!ids.size && !cat) return null;
    return (id) => ids.has(id) || (!!cat && categoria(id) === cat);
  }

  // 1–9 sobre una casilla: lo de esa casilla va a esa casilla de la barra rápida, intercambiando (v11.10.2).
  // Respeta las fijas; de la salida del crafteo se fabrica; del horno solo se saca
  aLaBarra(k) {
    const el = this.hoverEl, g = this.game, inv = g.inventory;
    if (!el || !el.isConnected || !el.dataset.c || this.cursor || this.drag) return;
    const c = el.dataset.c, i = +el.dataset.i;
    if (c === 'inv' && i === k) return;
    if ((g.meta.fijas || []).includes(k) || (c === 'inv' && (g.meta.fijas || []).includes(i))) { this.toast('Esa casilla está fija (Alt+clic la suelta)', 1400); return; }
    const barra = inv.slots[k];
    if (c === 'result') {
      const r = this.currentRecipe();
      if (!r || (barra && (barra.id !== r.out[0] || barra.count + r.out[1] > maxStack(barra.id)))) return;
      this.takeResult(false);
      const hecho = this.cursor; this.cursor = null;
      if (!hecho) return;
      if (inv.slots[k]) juntar(inv.slots[k], hecho.count, hecho.dia, (this.game.day || 1)); else inv.slots[k] = hecho;
    } else {
      const arr = this.containerArr(c), s = arr[i];
      if (!s && !barra) return;
      const soloSacar = c === 'furnace' && i === 2;
      if (soloSacar && barra && (barra.id !== s.id || barra.count + s.count > maxStack(s.id))) return;
      if (c === 'armor' && barra && (!getDef(barra.id) || getDef(barra.id).armorSlot !== i)) return; // a la armadura solo entra su pieza
      if (c === 'furnace' && i === 0 && barra && SMELT[barra.id] === undefined) return;
      if (soloSacar && barra) { juntar(barra, s.count, s.dia, (this.game.day || 1)); arr[i] = null; } else { arr[i] = barra || null; inv.slots[k] = s || null; }
      this.containerChanged(c); if (c !== 'inv') this.containerChanged('inv');
    }
    this.audio.play('select', { ui: true, vol: 0.3 });
    this.renderInventory();
    const hb = this.invEls && this.invEls[k];
    if (hb && !calmaActiva(g)) { hb.classList.remove('aparece'); void hb.offsetWidth; hb.classList.add('aparece'); }
  }

  // tirar al suelo, delante de uno, como con Q
  tirarAlSuelo(s, n) {
    const g = this.game, e = g.player.eye, d = g.player.lookDir();
    g.entities.dropItem(s.id, n, e.x + d.x * 0.4, e.y - 0.3 + d.y * 0.4, e.z + d.z * 0.4, { x: d.x * 5, y: d.y * 5 + 1.5, z: d.z * 5 }, 1.5, s.dur, extras(s));
    g.audio.drop();
  }
  soltarCursor(n) {
    const c = this.cursor;
    if (!c) return;
    n = Math.min(n, c.count);
    this.tirarAlSuelo(c, n);
    c.count -= n;
    if (c.count <= 0) this.cursor = null;
    this.renderCursor();
    this.renderInventory();
  }
  // Q sobre una casilla: tira una (con Ctrl, toda la pila). Si no hay casilla debajo pero sí algo agarrado, tira de eso
  soltarBajoMouse(todo) {
    const el = this.hoverEl;
    if (el && el.isConnected && el.dataset.c && el.dataset.c !== 'result') {
      const c = el.dataset.c, i = +el.dataset.i, arr = this.containerArr(c), s = arr[i];
      if (!s) return;
      const n = todo ? s.count : 1;
      this.tirarAlSuelo(s, n);
      if (s.count - n <= 0) arr[i] = null; else arr[i] = { ...s, count: s.count - n };
      this.containerChanged(c);
      this.renderInventory();
      return;
    }
    if (this.cursor) this.soltarCursor(todo ? this.cursor.count : 1);
  }
  marcarSoltando(on) {
    const sc = $('#screen-inventory');
    if (sc.classList.contains('soltando') === on) return;
    sc.classList.toggle('soltando', on);
    let p = $('#soltar-pista');
    if (on && !p) { p = document.createElement('div'); p.id = 'soltar-pista'; sc.appendChild(p); }
    if (p) { p.textContent = 'Suelte aquí para tirarlo al suelo (clic derecho: de a uno)'; p.classList.toggle('hidden', !on); }
  }

  dropToInventory(s) {
    const left = this.game.inventory.add(s.id, s.count, s.dur, extras(s));
    if (left > 0) {
      const p = this.game.player.eye;
      this.game.entities.dropItem(s.id, left, p.x, p.y - 0.3, p.z, null, 1.5, s.dur, extras(s));
    }
  }

  // botones para escoger cómo se ve el personaje (camisa, piel, pelo y sombrero); se guarda en el mundo
  armarApariencia() {
    const doll = $('#doll-canvas').parentElement, row = document.createElement('div');
    row.id = 'apariencia';
    const opciones = [['camisa', '👕', 'Camisa', CAMISAS.length], ['piel', '✋', 'Piel', PIELES.length], ['pelo', '💇', 'Pelo', PELOS.length], ['sombrero', '🎩', 'Sombrero', 2]];
    for (const [k, ic, tit, n] of opciones) {
      const b = document.createElement('button'); b.textContent = ic; b.title = tit; b.setAttribute('aria-label', tit);
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const g = this.game, ap = { ...((g.meta && g.meta.apariencia) || {}) };
        if (k === 'sombrero') ap.sombrero = ap.sombrero === false; else ap[k] = (((ap[k] ?? (k === 'piel' ? 1 : 0)) + 1) % n);
        g.meta.apariencia = ap; g.handHeldId = -1; // el brazo de primera persona también cambia
        this.doll.apK = JSON.stringify(ap); this.doll.apariencia(ap);
        this.audio && this.audio.play && this.audio.play('click', { ui: true, vol: 0.4 });
      });
      row.appendChild(b);
    }
    doll.appendChild(row);
  }

  // el vestidor se dibuja solo mientras el inventario está abierto
  startDoll() {
    if (this.dollLoop) return;
    let last = performance.now();
    const step = (now) => {
      if (this.state !== 'inventory' || this.station || !this.doll) { this.dollLoop = null; return; }
      this.doll.update(Math.min(0.05, (now - last) / 1000)); last = now;
      this.dollLoop = requestAnimationFrame(step);
    };
    this.dollLoop = requestAnimationFrame(step);
  }

  // aviso al equiparse una pieza desde la mano (sin abrir el inventario)
  equipPop(id, points) {
    $('#equip-pop')?.remove();
    const el = document.createElement('div'); el.id = 'equip-pop';
    el.innerHTML = '<img alt=""><span></span>';
    el.querySelector('img').src = iconURL(id);
    el.querySelector('span').textContent = `${itemName(id)} · 🛡 ${points}`;
    $('#hud').appendChild(el);
    setTimeout(() => el.remove(), 2300);
    const bar = $('#armorbar'); bar.classList.remove('pulse'); void bar.offsetWidth; bar.classList.add('pulse');
  }

  closeInventory() {
    this.audio.play(this.station ? 'close' : 'inv.close', { ui: true, vol: this.station ? 0.3 : 0.4 });
    this.closeInventoryDom();
    if (this.station) { this.game.exitStation(); this.station = null; }
    document.body.classList.remove('cinema');
    this.hideScreens();
    this.state = 'playing';
    this.requestLock();
    this.refreshHotbar();
  }

  // Arma el área de la estación (cuadrícula de crafteo, horno o cofre)
  buildStationArea(showCraft) {
    const area = $('#station-area');
    area.innerHTML = '';
    // botones del inventario (siempre)
    const invBar = $('#inv-sortbar');
    this.armarFiltros();
    if (invBar && !invBar.dataset.ready) {
      invBar.dataset.ready = '1';
      // v11.12.3: acciones como íconos limpios en la cabeza del panel; «Traer receta» y los criterios, en el «⋯»
      const panel = invBar.closest('.main-panel'), acc = document.createElement('div'); acc.className = 'acciones acciones-inv';
      const elegirOrden = (b) => menuChico(b, ORDENES.map(([v, t]) => [`Ordenar por ${t.toLowerCase()}`, () => { this.game.settings.ordenInv = v; saveSettings(this.game.settings); this.sortAction('sort-inv'); }, (this.game.settings.ordenInv || 'categoria') === v]));
      acc.append(
        botonIcono('buscar', 'Buscar  /', () => this.abrirBuscador()),
        botonIcono('ordenar', 'Ordenar  R · clic derecho: criterio', () => this.sortAction('sort-inv'), elegirOrden),
        botonIcono('aCofres', 'A cofres cercanos', () => this.sortAction('stack-near')),
        botonIcono('mas', 'Más', (b) => menuChico(b, [['Traer lo que falta a la receta fijada (📌)', () => this.sortAction('traer')], ...ORDENES.map(([v, t]) => [`Ordenar por ${t.toLowerCase()}`, () => { this.game.settings.ordenInv = v; saveSettings(this.game.settings); this.sortAction('sort-inv'); }, (this.game.settings.ordenInv || 'categoria') === v])])),
      );
      panel.insertBefore(acc, $('#inv-filtros') || invBar); // justo arriba de la rejilla (en una estación, en su columna)
      invBar.classList.add('hidden');
    }
    this.stationEls = {};
    const mkSlot = (container, i, extra = '') => {
      const el = document.createElement('div');
      el.className = `slot ${extra}`;
      el.addEventListener('mousedown', (e) => { e.preventDefault(); this.slotDown(container, i, e); });
      el.addEventListener('contextmenu', (e) => e.preventDefault());
      el.addEventListener('mouseenter', () => { this.slotEnter(container, i, el); const s = this.containerArr(container)[i]; this.showTooltip(s, el); });
      el.dataset.c = container; el.dataset.i = i;
      el.addEventListener('mouseleave', () => { if (this.hoverEl === el) this.hoverEl = null; $('#tooltip').classList.add('hidden'); });
      return el;
    };
    if (showCraft) {
      const wrap = document.createElement('div'); wrap.className = 'craft-area';
      const g = document.createElement('div'); g.className = `grid craftgrid g${this.craftSize}`;
      this.stationEls.grid = [];
      for (let i = 0; i < this.craftSize * this.craftSize; i++) { const el = mkSlot('grid', i); g.appendChild(el); this.stationEls.grid.push(el); }
      const arrow = document.createElement('div'); arrow.className = 'arrow'; arrow.textContent = '➜';
      const out = mkSlot('result', 0, 'out');
      this.stationEls.result = out;
      wrap.append(g, arrow, out);
      area.appendChild(wrap);
    } else if (this.station && this.station.type === 'furnace') {
      const wrap = document.createElement('div'); wrap.className = 'furnace-area';
      const col = document.createElement('div'); col.className = 'fcol';
      const inp = mkSlot('furnace', 0);
      const flame = document.createElement('div'); flame.className = 'flame'; flame.innerHTML = '<i></i>';
      const fuel = mkSlot('furnace', 1);
      col.append(inp, flame, fuel);
      const prog = document.createElement('div'); prog.className = 'progress-arrow'; prog.innerHTML = '<i></i>';
      const out = mkSlot('furnace', 2, 'out');
      wrap.append(col, prog, out);
      area.appendChild(wrap);
      this.stationEls = { furnace: [inp, fuel, out], flame: flame.firstChild, prog: prog.firstChild };
    } else if (this.station && this.station.type === 'chest') {
      // v11.12.3: las acciones del cofre como íconos en su cabeza; «Ordenar la casa» (toca muchos cofres y pide confirmar) en el «⋯»
      const bar = document.createElement('div'); bar.className = 'acciones acciones-cofre';
      bar.append(
        botonIcono('ordenar', 'Ordenar el cofre  R', () => this.sortAction('sort-chest')),
        botonIcono('aCofres', 'Depositar todo  Mayús+R', () => this.sortAction('deposit')),
        botonIcono('sacar', 'Sacar todo', () => this.sortAction('loot')),
        botonIcono('guardarIgual', 'Guardar lo que ya hay aquí', () => this.sortAction('stack')),
      );
      if (!this.station.entity && !this.station.chanchito) bar.append(botonIcono('nombre', 'Ponerle nombre', () => { const l = document.querySelector('#inv-title .lapiz'); if (l) l.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); }));
      if (this.station.be.propio) bar.append(botonIcono('mas', 'Más', (b) => menuChico(b, [['Ordenar la casa…', () => this.sortAction('casa')]])));
      area.appendChild(bar);
      const g = document.createElement('div'); g.className = 'grid';
      this.stationEls.chest = [];
      for (let i = 0; i < this.station.be.slots.length; i++) { const el = mkSlot('chest', i); g.appendChild(el); this.stationEls.chest.push(el); } // 27, o 54 el baúl grande
      area.appendChild(g);
    }
  }

  containerArr(c) {
    if (c === 'inv') return this.game.inventory.slots;
    if (c === 'armor') return this.game.inventory.armor;
    if (c === 'grid') return this.grid;
    if (c === 'furnace') return this.station.be.slots;
    if (c === 'chest') return this.station.be.slots;
    if (c === 'result') { const r = this.currentRecipe(); return [r ? { id: r.out[0], count: r.out[1], ...(r.repara ? { dur: r.dur, ...r.extra } : {}) } : null]; }
    return [];
  }

  craftMode() { return this.station && this.station.type === 'cooking' ? 'cook' : this.station && this.station.type === 'taller' ? `taller:${this.station.be.taller}` : 'craft'; }
  currentRecipe() {
    if (!this.grid) return null;
    return findRecipe(this.grid, this.craftSize, this.craftMode(), conocidas(this.game)) || (this.craftMode() === 'cook' ? null : reparacion(this.grid));
  }

  containerChanged(c) {
    if (c === 'grid' || c === 'result') {
      if (this.station && (this.station.type === 'crafting' || this.station.type === 'cooking' || this.station.type === 'taller')) this.game.world.touchBE(this.station.x, this.station.y, this.station.z);
    }
    if ((c === 'furnace' || c === 'chest') && !this.station.entity) this.game.world.touchBE(this.station.x, this.station.y, this.station.z);
    this.game.inventory.changed();
  }

  // v11.12.0: pestañas por categoría (con contador e ícono), buscador (/ o Ctrl+F; Esc limpia) y el orden de «Ordenar».
  // Filtrar no esconde nada: lo que no calza se apaga y lo que calza con la búsqueda se resalta
  armarFiltros() {
    let box = $('#inv-filtros');
    if (!box) {
      box = document.createElement('div'); box.id = 'inv-filtros';
      box.innerHTML = '<div class="inv-tabs hidden" role="tablist" aria-label="Categorías"></div><div class="inv-busca"><input id="inv-buscar" placeholder="Buscar en el inventario" autocomplete="off" aria-label="Buscar en el inventario" /><select id="inv-orden" class="hidden" aria-label="Ordenar por"></select></div>';
      box.classList.add('cerrado'); // v11.12.3: escondido tras la lupa
      const bar = $('#inv-sortbar'); bar.parentNode.insertBefore(box, bar);
      const inp = box.querySelector('#inv-buscar'), sel = box.querySelector('#inv-orden');
      for (const [v, t] of ORDENES) { const o = document.createElement('option'); o.value = v; o.textContent = `Ordenar: ${t}`; sel.appendChild(o); }
      sel.value = (this.game.settings && this.game.settings.ordenInv) || 'categoria';
      sel.addEventListener('change', () => { this.game.settings.ordenInv = sel.value; saveSettings(this.game.settings); });
      sel.addEventListener('keydown', (e) => { if (e.code !== 'Escape' && e.code !== 'KeyE') e.stopPropagation(); });
      sel.addEventListener('change', () => sel.blur());
      inp.addEventListener('input', () => { this.invBusca = inp.value; this.aplicarFiltros(); });
      inp.addEventListener('blur', () => { if (!inp.value) box.classList.add('cerrado'); });
      inp.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.code === 'Escape') { e.preventDefault(); if (inp.value) { inp.value = ''; this.invBusca = ''; this.aplicarFiltros(); } else inp.blur(); }
        if (e.code === 'Enter') inp.blur();
      });
      this.invCat = 'todo'; this.invBusca = '';
    }
  }
  abrirBuscador() {
    const box = $('#inv-filtros'), inp = $('#inv-buscar');
    if (!box || !inp) return;
    box.classList.remove('cerrado'); inp.focus(); inp.select();
  }
  aplicarFiltros() {
    const inv = this.game.inventory, tabs = document.querySelector('#inv-filtros .inv-tabs');
    if (!tabs) return;
    const cuenta = {};
    for (const s of inv.slots) if (s) { const c = categoria(s.id); cuenta[c] = (cuenta[c] || 0) + s.count; }
    if (this.invCat !== 'todo' && !cuenta[this.invCat]) this.invCat = 'todo';
    const firma = `${this.invCat}|${CATEGORIAS.map((c) => cuenta[c.id] || 0).join(',')}`;
    if (tabs.firma !== firma) {
      tabs.firma = firma; tabs.innerHTML = '';
      const tab = (id, icono, n, nombre) => {
        const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab');
        b.className = 'inv-tab' + (this.invCat === id ? ' on' : ''); b.setAttribute('aria-selected', this.invCat === id ? 'true' : 'false');
        b.title = nombre; b.setAttribute('aria-label', `${nombre}: ${n}`); b.style.setProperty('--catc', COLOR_CAT[id] || COLOR_CAT.varios);
        const i = document.createElement('span'); i.textContent = icono; const c = document.createElement('b'); c.textContent = n;
        b.append(i, c);
        b.addEventListener('mousedown', (e) => { e.preventDefault(); this.invCat = id; tabs.firma = ''; this.aplicarFiltros(); });
        tabs.appendChild(b);
      };
      tab('todo', '✦', inv.slots.reduce((a, s) => a + (s ? s.count : 0), 0), 'Todo');
      for (const c of CATEGORIAS) if (cuenta[c.id]) tab(c.id, c.icono, cuenta[c.id], c.nombre);
    }
    const q = sinTildes(this.invBusca).trim(), filtra = this.invCat !== 'todo' || !!q;
    const calza = (s) => s && (this.invCat === 'todo' || categoria(s.id) === this.invCat) && (!q || sinTildes(itemName(s.id)).includes(q));
    const marcar = (els, arr) => { if (els) els.forEach((el, i) => { const s = arr[i], ok = calza(s); el.classList.toggle('apagada', filtra && !ok); el.classList.toggle('resalta', !!q && !!ok); }); };
    marcar(this.invEls, inv.slots);
    if (this.stationEls && this.stationEls.chest && this.station) marcar(this.stationEls.chest, this.station.be.slots);
  }

  renderInventory() {
    const inv = this.game.inventory;
    const grid = $('#inv-grid');
    const hb = $('#inv-hotbar');
    if (!this.invEls) {
      this.invEls = [];
      for (let i = 0; i < SLOTS; i++) {
        const el = document.createElement('div');
        el.className = 'slot';
        el.addEventListener('mousedown', (e) => { e.preventDefault(); this.slotDown('inv', i, e); });
        el.addEventListener('contextmenu', (e) => e.preventDefault());
        el.addEventListener('mouseenter', () => { this.slotEnter('inv', i, el); this.showTooltip(inv.slots[i], el); });
        el.dataset.c = 'inv'; el.dataset.i = i;
        el.addEventListener('mouseleave', () => { if (this.hoverEl === el) this.hoverEl = null; $('#tooltip').classList.add('hidden'); });
        this.invEls.push(el);
        el.style.setProperty('--i', i < 9 ? 27 + i : i - 9);
        (i < 9 ? hb : grid).appendChild(el);
      }
    }
    for (let i = 0; i < SLOTS; i++) this.fillSlot(this.invEls[i], inv.slots[i]);
    this.pintarDesglose();
    this.aplicarFiltros();
    // con un cofre abierto se marca lo del inventario que calza ahí: lo que el cofre ya tiene, o su categoría (por el nombre
    // o porque casi todo lo de adentro es de una misma)
    const calza = this.loQueCalza();
    for (let i = 0; i < SLOTS; i++) this.invEls[i].classList.toggle('calza', !!(calza && inv.slots[i] && calza(inv.slots[i].id)));
    this.fichaBajoMouse();
    if (!this.armorEls) {
      const box = $('#armor-slots');
      const ph = ['⛑️', '🦺', '👖', '🥾', '🛡️'];
      this.armorEls = ph.map((name, i) => {
        const el = document.createElement('div');
        el.className = 'slot'; el.dataset.ph = name; el.dataset.c = 'armor'; el.dataset.i = i;
        el.addEventListener('mousedown', (e) => { e.preventDefault(); this.clickContainer('armor', i, e.button, e.shiftKey); });
        el.addEventListener('contextmenu', (e) => e.preventDefault());
        el.addEventListener('mouseenter', () => { const s = inv.armor[i]; this.showTooltip(s, el); });
        el.addEventListener('mouseleave', () => { if (this.hoverEl === el) this.hoverEl = null; $('#tooltip').classList.add('hidden'); });
        box.appendChild(el);
        return el;
      });
    }
    this.armorEls.forEach((el, i) => { this.fillSlot(el, inv.armor[i]); el.classList.toggle('empty', !inv.armor[i]); });
    const av = inv.armorValue();
    $('#armor-points').textContent = `${av.points}`;
    $('#armor-meter').style.width = `${Math.min(100, (av.points / 20) * 100)}%`;
    $('#tough-points').textContent = `${av.tough}`;
    $('#tough-meter').style.width = `${Math.min(100, (av.tough / 16) * 100)}%`;
    $('#armor-note').textContent = av.points ? `Recibe ${Math.round(Math.min(0.8, av.points * 0.04 + av.tough * 0.02) * 100)} % menos daño` : 'Sin armadura: ¡cuidado con las Sombras!';
    if (this.doll && !this.station && this.state === 'inventory') this.doll.setArmor(inv.armor, true);
    const E = this.stationEls || {};
    if (E.grid) E.grid.forEach((el, i) => this.fillSlot(el, this.grid[i]));
    if (E.result) {
      const r = this.currentRecipe();
      this.fillSlot(E.result, r ? { id: r.out[0], count: r.out[1], ...(r.repara ? { dur: r.dur, ...r.extra } : {}) } : null);
      E.result.classList.toggle('ready', !!r);
    }
    if (E.furnace) E.furnace.forEach((el, i) => this.fillSlot(el, this.station.be.slots[i]));
    if (E.chest) E.chest.forEach((el, i) => this.fillSlot(el, this.station.be.slots[i]));
    this.renderCursor();
    if (!$('#craft-panel').classList.contains('hidden')) this.renderRecipes();
  }

  // Cada cuadro mientras hay una estación abierta (barras del horno, contenido que cambia solo)
  tickStation(dt) {
    if (!this.station || this.station.type !== 'furnace') return;
    const be = this.station.be;
    const E = this.stationEls;
    if (E.flame) E.flame.style.height = `${be.burnMax ? (be.burn / be.burnMax) * 100 : 0}%`;
    if (E.prog) E.prog.style.width = `${(be.cook / COOK_TIME) * 100}%`;
    this.furnaceT = (this.furnaceT || 0) - dt;
    if (this.furnaceT <= 0) { this.furnaceT = 0.25; E.furnace.forEach((el, i) => this.fillSlot(el, be.slots[i])); }
  }

  // ---------- arrastrar para repartir ----------
  // Con algo en el cursor: arrastrar con clic izquierdo reparte en partes iguales;
  // con clic derecho deja uno en cada casilla que tocás. Doble clic junta todo lo igual en el cursor.
  // Alt+clic deja la casilla fija: Ordenar y los botones de cofre la respetan
  alternarFija(i) {
    const M = this.game.meta, F = (M.fijas ||= []), k = F.indexOf(i);
    if (k >= 0) F.splice(k, 1); else { F.push(i); if (!M.fijaDicho) { M.fijaDicho = true; this.toast('📌 Casilla fija: Ordenar y los botones de cofre no la tocan', 3000); } }
    this.audio.play('select', { ui: true, vol: 0.3, pitch: k >= 0 ? 0.9 : 1.3 });
    this.renderInventory();
  }
  slotDown(c, i, e) {
    if (c === 'inv' && e.altKey && e.button === 0) { this.alternarFija(i); return; }
    const now = performance.now();
    const arr = this.containerArr(c);
    const lc = this.lastClick;
    if (e.button === 0 && !e.shiftKey && this.cursor && lc && now - lc.t < 320 && lc.id === this.cursor.id && lc.c === c && lc.i === i) {
      this.gatherToCursor();
      this.lastClick = null;
      return;
    }
    if (this.cursor && !e.shiftKey && (e.button === 0 || e.button === 2) && c !== 'result' && !(c === 'furnace' && i === 2) && (!arr[i] || arr[i].id === this.cursor.id)) {
      this.drag = { button: e.button, slots: [{ c, i }], start: { ...this.cursor }, orig: new Map() };
      this.markDrag();
      return;
    }
    const before = arr[i] ? arr[i].id : null;
    this.clickContainer(c, i, e.button, e.shiftKey);
    if (e.button === 0 && this.cursor) this.lastClick = { t: now, id: this.cursor.id || before, c, i };
  }

  slotEnter(c, i) {
    const d = this.drag;
    if (!d || c === 'result' || (c === 'furnace' && i === 2)) return;
    if (d.slots.some((s) => s.c === c && s.i === i)) return;
    const s = this.containerArr(c)[i];
    if (s && s.id !== d.start.id) return;
    if (s && s.count >= maxStack(s.id)) return;
    if (d.button === 0 && d.slots.length >= d.start.count) return;
    if (d.button === 2 && d.slots.length >= d.start.count) return;
    d.slots.push({ c, i });
    this.repartir(d);
    this.markDrag();
    this.audio.play('select', { ui: true, vol: 0.18, pitch: 1 + d.slots.length * 0.04 });
  }

  markDrag() {
    document.querySelectorAll('.slot.drag').forEach((el) => el.classList.remove('drag'));
    if (!this.drag) return;
    for (const { c, i } of this.drag.slots) {
      const el = document.querySelector(`.slot[data-c="${c}"][data-i="${i}"]`);
      if (el) el.classList.add('drag');
    }
  }

  // v11.10.2: el reparto se ve mientras se arrastra. Clic izquierdo: partes iguales entre las casillas tocadas (se recalcula
  // con cada una); clic derecho: una por casilla. Se rehace siempre desde lo que había, así nada se duplica
  repartir(d) {
    for (const [k, s] of d.orig) { const [c, i] = k.split('|'); this.containerArr(c)[+i] = s ? { ...s } : null; }
    this.cursor = { ...d.start };
    if (d.slots.length < 2) { this.renderInventory(); this.renderCursor(); return; }
    const per = d.button === 0 ? Math.max(1, Math.floor(d.start.count / d.slots.length)) : 1;
    for (const { c, i } of d.slots) {
      const k = `${c}|${i}`, arr = this.containerArr(c);
      if (!d.orig.has(k)) d.orig.set(k, arr[i] ? { ...arr[i] } : null);
      const s = arr[i], room = maxStack(d.start.id) - (s ? s.count : 0), put = Math.min(per, room, this.cursor ? this.cursor.count : 0);
      if (put <= 0) continue;
      if (s) juntar(s, put, d.start.dia, (this.game.day || 1)); else arr[i] = { ...d.start, count: put };
      this.cursor.count -= put;
      if (this.cursor.count <= 0) { this.cursor = null; break; }
    }
    this.renderInventory(); this.renderCursor();
    // la casilla recién tocada aparece con un saltito (sin él con «Movimiento tranquilo»)
    const u = d.slots[d.slots.length - 1], el = document.querySelector(`.slot[data-c="${u.c}"][data-i="${u.i}"]`);
    if (el && !calmaActiva(this.game)) { el.classList.remove('aparece'); void el.offsetWidth; el.classList.add('aparece'); }
    this.audio.play('select', { ui: true, vol: 0.15, pitch: 1.3 + d.slots.length * 0.03 });
  }
  // Esc o soltar fuera de los paneles: todo vuelve a como estaba y al cursor
  cancelarReparto() {
    const d = this.drag;
    if (!d) return;
    for (const [k, s] of d.orig) { const [c, i] = k.split('|'); this.containerArr(c)[+i] = s ? { ...s } : null; }
    this.cursor = { ...d.start };
    this.drag = null;
    this.markDrag(); this.renderInventory(); this.renderCursor();
  }
  endDrag(button) {
    const d = this.drag;
    if (!d || button !== d.button) return;
    this.drag = null;
    this.markDrag();
    if (d.slots.length === 1) { // fue un clic normal
      for (const [k, s] of d.orig) { const [c, i] = k.split('|'); this.containerArr(c)[+i] = s ? { ...s } : null; }
      this.cursor = { ...d.start };
      const { c, i } = d.slots[0];
      this.clickContainer(c, i, d.button, false);
      if (d.button === 0) this.lastClick = { t: performance.now(), id: d.start.id, c, i };
      return;
    }
    // ya quedó repartido en vivo: solo se avisa del cambio a cada contenedor
    for (const c of new Set(d.slots.map((s) => s.c))) this.containerChanged(c);
    this.audio.play('select', { ui: true, vol: 0.3 });
    this.renderInventory();
  }

  // doble clic: juntar en el cursor todo lo del mismo tipo
  gatherToCursor() {
    const c = this.cursor;
    if (!c || maxStack(c.id) <= 1) return;
    const lists = ['inv'];
    if (this.station && (this.station.type === 'chest')) lists.unshift('chest');
    if (this.grid && this.station?.type !== 'crafting') lists.push('grid');
    for (const name of lists) {
      const arr = this.containerArr(name);
      for (let k = 0; k < arr.length && c.count < maxStack(c.id); k++) {
        const s = arr[k];
        if (!s || s.id !== c.id) continue;
        const n = Math.min(s.count, maxStack(c.id) - c.count);
        juntar(c, n, s.dia, (this.game.day || 1)); s.count -= n;
        if (s.count <= 0) arr[k] = null;
      }
      this.containerChanged(name);
    }
    this.audio.play('select', { ui: true, vol: 0.3, pitch: 1.2 });
    this.renderInventory();
  }

  // ---------- ordenar al estilo Terraria ----------
  // Junta montones iguales y ordena: bloques, herramientas, comida, otros (y por id).
  sortRange(arr, from, to) {
    const items = [], fijas = new Set(arr === this.game.inventory.slots ? this.game.meta.fijas || [] : []);
    for (let k = from; k < to; k++) if (arr[k] && !fijas.has(k)) { items.push(arr[k]); arr[k] = null; }
    const merged = [];
    for (const s of items) {
      const max = maxStack(s.id);
      if (max > 1) {
        let left = s.count;
        for (const m of merged) { if (m.id === s.id && m.count < max && left > 0) { const n = Math.min(left, max - m.count); juntar(m, n, s.dia, (this.game.day || 1)); left -= n; } }
        if (left > 0) merged.push({ ...s, count: left });
      } else merged.push({ ...s });
    }
    const orden = (this.game.settings && this.game.settings.ordenInv) || 'categoria', vistos = this.game.inventory.vistos || {};
    const porCat = (a, b) => ordenCategoria(a.id) - ordenCategoria(b.id) || a.id - b.id || b.count - a.count; // por categoría (categorias.js)
    const cmp = orden === 'nombre' ? (a, b) => sinTildes(itemName(a.id)).localeCompare(sinTildes(itemName(b.id))) || b.count - a.count
      : orden === 'cantidad' ? (a, b) => b.count - a.count || porCat(a, b)
        : orden === 'recientes' ? (a, b) => (vistos[b.id] || 0) - (vistos[a.id] || 0) || porCat(a, b) : porCat;
    merged.sort(cmp);
    let pos = from;
    for (const s of merged) { while (fijas.has(pos)) pos++; arr[pos++] = s; }
  }

  // mover de un contenedor a otro; only = solo lo que ya existe en el destino (apilar rápido)
  moveAll(srcName, from, to, dstName, only = false) {
    const src = this.containerArr(srcName), dst = this.containerArr(dstName);
    const present = new Set(dst.filter(Boolean).map((s) => s.id));
    let moved = 0;
    const fijas = new Set(srcName === 'inv' ? this.game.meta.fijas || [] : []);
    for (let k = from; k < to; k++) {
      const s = src[k];
      if (!s || fijas.has(k) || (only && !present.has(s.id))) continue;
      const max = maxStack(s.id);
      for (let j = 0; j < dst.length && s.count > 0; j++) {
        const t = dst[j];
        if (t && t.id === s.id && t.count < max && max > 1) { const n = Math.min(s.count, max - t.count); juntar(t, n, s.dia, (this.game.day || 1)); s.count -= n; moved += n; }
      }
      for (let j = 0; j < dst.length && s.count > 0 && !only; j++) {
        if (!dst[j]) { dst[j] = { ...s }; moved += s.count; s.count = 0; }
      }
      if (s.count <= 0) src[k] = null;
    }
    this.containerChanged(srcName); this.containerChanged(dstName);
    return moved;
  }

  sortAction(kind) {
    const inv = this.game.inventory.slots;
    let moved = 0;
    if (kind === 'sort-inv') this.sortRange(inv, 9, SLOTS);
    const nC = this.station && this.station.be && this.station.be.slots ? this.station.be.slots.length : 27;
    if (kind === 'sort-chest') this.sortRange(this.station.be.slots, 0, nC);
    if (kind === 'loot') moved = this.moveAll('chest', 0, nC, 'inv');
    if (kind === 'casa') { this.confirmarCasa(); return; }
    if (kind === 'deposit') moved = this.moveAll('inv', 9, SLOTS, 'chest');
    if (kind === 'stack') moved = this.moveAll('inv', 0, SLOTS, 'chest', true);
    if (kind === 'stack-near') moved = this.quickStackNearby();
    if (kind === 'traer') { const T = traerReceta(this.game); moved = T.n; this.toast(T.msg, 2200); }
    if (kind === 'sort-inv' || kind === 'sort-chest') { this.containerChanged('inv'); if (kind === 'sort-chest') this.containerChanged('chest'); }
    this.audio.play(moved || kind.startsWith('sort') ? 'craft' : 'select', { ui: true, vol: 0.3 });
    this.renderInventory();
    // pequeño rebote de las casillas tocadas
    document.querySelectorAll('#station-area .slot, #inv-grid .slot').forEach((el, k) => {
      el.classList.remove('bump'); void el.offsetWidth; el.style.animationDelay = `${(k % 9) * 12}ms`; el.classList.add('bump');
    });
    if (kind === 'stack-near') this.toast(moved ? `${moved} objetos guardados en cofres cercanos` : 'No hay cofres cerca con esos objetos', 1600);
  }

  // Terraria: manda a los cofres cercanos lo que ya tienen
  quickStackNearby() {
    const w = this.game.world;
    let moved = 0;
    const inv = this.game.inventory.slots;
    for (const { be, x: bx, y: by, z: bz } of cofresDeCasa(this.game)) { // cofres y baúles de la casa (ni ruinas ni bolsos)
      const present = new Set(be.slots.filter(Boolean).map((s) => s.id));
      for (let k = 9; k < SLOTS; k++) {
        const s = inv[k];
        if (!s || !present.has(s.id)) continue;
        const max = maxStack(s.id);
        for (const t of be.slots) { if (t && t.id === s.id && t.count < max && s.count > 0) { const n = Math.min(s.count, max - t.count); juntar(t, n, s.dia, (this.game.day || 1)); s.count -= n; moved += n; } }
        if (s.count <= 0) inv[k] = null;
      }
      w.touchBE(bx, by, bz);
      if (moved) this.game.particles.burst(bx + 0.5, by + 1, bz + 0.5, [[1, 0.95, 0.7]], 10, 1.5);
    }
    this.game.inventory.changed();
    return moved;
  }

  // Lógica de clic estilo juego de bloques: tomar, dejar, partir a la mitad, dejar de a uno, shift = mover rápido
  clickContainer(c, i, button, shift) {
    this.audio.play('select', { ui: true, vol: 0.3 });
    if (c === 'result') { this.takeResult(shift); return; }
    const arr = this.containerArr(c);
    const s = arr[i];
    const takeOnly = c === 'furnace' && i === 2;
    if (c === 'armor' && this.cursor && !shift) {
      const d = getDef(this.cursor.id);
      if (!d || d.armorSlot !== i) return;
    }
    if (shift && s && c === 'inv' && getDef(s.id) && getDef(s.id).armor) {
      const slot = getDef(s.id).armorSlot;
      const inv = this.game.inventory;
      const old = inv.armor[slot];
      inv.armor[slot] = s; arr[i] = old;
      this.containerChanged('inv');
      this.renderInventory();
      return;
    }
    if (shift && s) {
      let targets;
      if (c === 'inv') {
        if (this.station && this.station.type === 'chest') targets = ['chest', [...Array(this.station.be.slots.length).keys()]];
        else if (this.station && this.station.type === 'furnace') targets = ['furnace', [SMELT[s.id] !== undefined ? 0 : FUEL[s.id] ? 1 : -1]];
        else targets = ['inv', i < 9 ? [...Array(27).keys()].map((k) => k + 9) : [...Array(9).keys()]];
      } else targets = ['inv', [...Array(SLOTS).keys()]];
      const [tc, idxs] = targets;
      const tarr = this.containerArr(tc);
      let left = s.count;
      const max = maxStack(s.id);
      for (const k of idxs) { if (k < 0) continue; const t = tarr[k]; if (t && t.id === s.id && t.count < max && left > 0) { const n = Math.min(left, max - t.count); juntar(t, n, s.dia, (this.game.day || 1)); left -= n; } }
      for (const k of idxs) { if (k < 0 || left <= 0) continue; if (!tarr[k]) { tarr[k] = { ...s, count: left }; left = 0; } }
      arr[i] = left > 0 ? { ...s, count: left } : null;
      this.containerChanged(c); if (tc !== c) this.containerChanged(tc);
      this.renderInventory();
      return;
    }
    if (button === 0) {
      if (!this.cursor) { this.cursor = s; arr[i] = null; }
      else if (takeOnly) {
        if (s && s.id === this.cursor.id && this.cursor.count + s.count <= maxStack(s.id)) { juntar(this.cursor, s.count, s.dia, (this.game.day || 1)); arr[i] = null; }
      } else if (s && s.id === this.cursor.id && maxStack(s.id) > 1) {
        const n = Math.min(this.cursor.count, maxStack(s.id) - s.count);
        juntar(s, n, this.cursor.dia, (this.game.day || 1)); this.cursor.count -= n;
        if (this.cursor.count <= 0) this.cursor = null;
      } else { arr[i] = this.cursor; this.cursor = s; }
    } else if (button === 2) {
      if (!this.cursor && s) {
        const half = Math.ceil(s.count / 2);
        this.cursor = { ...s, count: half };
        s.count -= half;
        if (s.count <= 0) arr[i] = null;
      } else if (this.cursor && !takeOnly) {
        if (!s) { arr[i] = { ...this.cursor, count: 1 }; this.cursor.count--; }
        else if (s.id === this.cursor.id && s.count < maxStack(s.id)) { juntar(s, 1, this.cursor.dia, (this.game.day || 1)); this.cursor.count--; }
        if (this.cursor.count <= 0) this.cursor = null;
      }
    }
    this.containerChanged(c);
    this.renderInventory();
  }

  // Tomar el resultado del crafteo: consume un ítem de cada casilla
  takeResult(shift) {
    let made = 0;
    do {
      const r = this.currentRecipe();
      if (!r) break;
      if (!r.repara && !gastarLenaFogon(this.game, this.station)) break; // v12.1.0: cada tanda del fogón gasta leña
      if (!r.repara && !puedeTaller(this.game, this.station, r)) break; // v12.15.1: herramienta y leña del taller
      const out = { id: r.out[0], count: r.out[1] };
      const yaHecho = this.game.meta.crafted && this.game.meta.crafted[out.id];
      (this.game.meta.crafted = this.game.meta.crafted || {})[out.id] = 1;
      if (!yaHecho && !r.repara) alFabricar(this.game, out.id);
      if (!r.repara) alFabricarTaller(this.game, this.station, r);
      if (r.repara) {
        // reparar: sale la misma pieza, con más vida
        if (shift) { if (this.game.inventory.add(out.id, 1, r.dur, r.extra) > 0) break; } else { if (this.cursor) break; this.cursor = { id: out.id, count: 1, dur: r.dur, ...r.extra }; }
        this.audio.play('craft', { ui: true, vol: 0.3 });
        this.game.achieve('reparar', 'Lo viejo se arregla');
      } else if (shift) {
        if (this.game.inventory.add(out.id, out.count) > 0) break;
      } else {
        if (this.cursor && (this.cursor.id !== out.id || this.cursor.count + out.count > maxStack(out.id))) break;
        if (this.cursor) this.cursor.count += out.count; else this.cursor = { ...out, ...(ITEMS[out.id] && ITEMS[out.id].durability ? { dur: ITEMS[out.id].durability } : {}) };
      }
      for (let k = 0; k < this.grid.length; k++) {
        const s = this.grid[k];
        if (!s) continue;
        s.count--;
        if (s.count <= 0) this.grid[k] = null;
      }
      if (r.returns) for (const id of r.returns) this.game.inventory.add(id, 1);
      made++;
    } while (shift && made < 64);
    if (made) {
      this.audio.play('craft', { ui: true, vol: 0.35 });
      if (this.station && this.station.type === 'cooking') {
        const { x, y, z } = this.station;
        this.game.audio.play('freir', { pos: { x: x + 0.5, y: y + 1, z: z + 0.5 }, vol: 0.6 });
        this.game.particles.burst(x + 0.5, y + 1.3, z + 0.5, [[0.9, 0.9, 0.9], [0.75, 0.75, 0.75]], 14, 1.2);
      }
      if (this.station && this.station.type === 'crafting') {
        const { x, y, z } = this.station;
        this.game.audio.material('wood', 'place', { x: x + 0.5, y: y + 1, z: z + 0.5 });
        const tv = this.game.stations.visuals.get(this.game.stations.key(x, y, z)); if (tv) tv.hitT = 0.6;
        this.game.particles.burst(x + 0.5, y + 1.2, z + 0.5, [[1, 0.95, 0.7], [0.9, 0.8, 0.5]], 16, 1.8);
      }
      this.containerChanged('grid');
    }
    this.renderInventory();
  }

  // Libro de recetas: muestra todo; al hacer clic acomoda los ingredientes uno por uno en la cuadrícula
  renderRecipes() {
    const list = $('#craft-list'), scroll = list.scrollTop;
    const inv = this.game.inventory;
    // v12.1.3: las cantidades se cuentan una vez (antes, cada ingrediente de cada receta recorría el inventario entero)
    const cuenta = new Map();
    for (const x of [...inv.slots, ...this.grid]) if (x) cuenta.set(x.id, (cuenta.get(x.id) || 0) + x.count);
    const have = (id) => (id === COLON ? inv.count(id) : cuenta.get(id) || 0);
    const mode = this.craftMode();
    const sabe = conocidas(this.game);
    const buscaEl = $('#craft-buscar');
    if (!buscaEl.dataset.ok) {
      buscaEl.dataset.ok = '1';
      buscaEl.addEventListener('input', () => this.renderRecipes());
      buscaEl.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.code === 'Escape') { buscaEl.value = ''; buscaEl.blur(); this.renderRecipes(); } });
    }
    const busca = sinTildes(buscaEl.value.trim());
    const coincide = (r) => !busca || sinTildes(itemName(r.out[0])).includes(busca) || [...ingredients(r).keys()].some((id) => sinTildes(itemName(id)).includes(busca));
    const todas = RECIPES.filter((r) => modoDe(r) === mode && (!r.aprende || sabe.has(r.aprende)) && (!r.req || sabe.has(r.req)) && coincide(r)).map((r) => {
      const fits = fitsIn(r, this.craftSize);
      const ok = fits && [...ingredients(r)].every(([id, n]) => have(id) >= n);
      return { r, ok, fits };
    });
    // v11.12.3: filtros del recetario (se pueden sumar); «Puedo hacer» deja solo lo que se puede hacer ya
    const F = (this.filtrosReceta ||= new Set());
    const pasa = ({ r, ok }) => (!F.has('puedo') || ok) && (![...F].some((c) => c !== 'puedo') || F.has(catReceta(r.out[0])));
    const rows = todas.filter(pasa);
    // v12.1.3: la lista solo se rehace si cambia lo que se VE: qué recetas salen, su ✓/✗ y el color de cada ingrediente (alcanza o no).
    // Mover una pila en el inventario casi nunca cambia eso, y así un clic no reconstruye ~600 imágenes
    (this.idxReceta ||= new Map(RECIPES.map((x, k) => [x, k])));
    const estado = todas.map(({ r, ok, fits }) => `${this.idxReceta.get(r)}${ok ? '+' : '-'}${fits ? '' : 'm'}${[...ingredients(r)].map(([id, n]) => (have(id) >= n ? 1 : 0)).join('')}`).join(',');
    const firma = [mode, this.craftSize, busca, [...F].join(','), sabe.size, this.game.meta.recetaFija || '', rows.length, estado].join('|');
    if (firma === this.firmaRecetas && list.childElementCount) return;
    this.firmaRecetas = firma;
    list.innerHTML = '';
    const chips = $('#craft-chips');
    if (chips) {
      chips.innerHTML = '';
      const chip = (id, texto, color, n) => {
        const c = document.createElement('button'); c.type = 'button'; c.className = 'chip'; c.style.setProperty('--cat', color);
        c.setAttribute('aria-pressed', id === 'todo' ? String(!F.size) : String(F.has(id))); c.dataset.n = n;
        c.append(texto + ' '); const sm = document.createElement('small'); sm.textContent = n; c.appendChild(sm);
        c.addEventListener('mousedown', (e) => { e.preventDefault(); if (id === 'todo') F.clear(); else if (F.has(id)) F.delete(id); else F.add(id); this.renderRecipes(); });
        chips.appendChild(c);
      };
      chip('todo', 'Todo', 'var(--text-soft)', todas.length);
      chip('puedo', 'Puedo hacer', 'var(--success)', todas.filter((x) => x.ok).length);
      for (const [id, t, col] of CATS_RECETA) chip(id, t, col, todas.filter((x) => catReceta(x.r.out[0]) === id).length);
    }
    rows.sort((a, b) => (b.ok - a.ok) || (b.fits - a.fits));
    $('#craft-table-note').textContent = this.craftSize === 3 ? '(mesa 3×3)' : '(2×2 — las grandes piden mesa)';
    for (const { r, ok, fits } of rows) {
      const el = document.createElement('div');
      el.className = 'recipe' + (ok ? '' : ' no');
      el.style.setProperty('--cat', `var(--cat-${catReceta(r.out[0]) === 'materiales' ? 'madera' : catReceta(r.out[0])})`); // el punto de su categoría
      const out = document.createElement('img'); out.src = iconURL(r.out[0]); out.alt = '';
      const name = document.createElement('div'); name.className = 'name';
      // en la lista va el nombre corto; lo que va entre paréntesis («en la mochila, protege…») queda en la ficha al pasar el mouse
      const nomLargo = itemName(r.out[0]), nomCorto = nomLargo.replace(/\s*\(.*\)\s*$/, '');
      name.textContent = `${ok ? '✓ ' : '✗ '}${nomCorto}${r.out[1] > 1 ? ' ×' + r.out[1] : ''}${fits ? '' : ' 🔨'}`;
      if (nomCorto !== nomLargo) name.title = nomLargo;
      const ing = document.createElement('div'); ing.className = 'ing';
      for (const [id, n] of ingredients(r)) {
        const im = document.createElement('img'); im.src = iconURL(id); im.alt = ''; im.title = itemName(id);
        const sp = document.createElement('span'); sp.textContent = `${n}`;
        sp.style.color = have(id) >= n ? 'var(--success)' : 'var(--danger)';
        ing.append(im, sp);
      }
      el.append(out, name, ing);
      el.title = fits ? '' : 'Necesita una mesa de trabajo (3×3)';
      if (this.game.meta.recetaFija === r.out[0]) el.classList.add('fija');
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (e.button === 2) { fijarReceta(this.game, r); this.renderRecipes(); return; }
        if (ok) this.layOut(r, e.shiftKey ? this.vecesMax(r, this.tengo()) : 1);
      });
      el.tabIndex = 0; // v11.13.3: con Tab y Enter (Mayús+Enter: el máximo)
      el.addEventListener('keydown', (e) => { if ((e.code === 'Enter' || e.code === 'Space') && ok) { e.preventDefault(); e.stopPropagation(); this.layOut(r, e.shiftKey ? this.vecesMax(r, this.tengo()) : 1); } });
      el.addEventListener('contextmenu', (e) => e.preventDefault());
      list.appendChild(el);
    }
    if (!rows.length) { const v = document.createElement('div'); v.className = 'recipe-vacio'; v.textContent = busca ? `Ninguna receta con «${buscaEl.value.trim()}».` : 'Todavía no hay recetas aquí.'; list.appendChild(v); }
    list.scrollTop = scroll;
  }
  // v12.1.3: cuánto hay ahora mismo (inventario + mesa), para los clics del recetario (la lista puede ser de antes)
  tengo() {
    const inv = this.game.inventory;
    return (id) => inv.count(id) + this.grid.reduce((n, x) => n + (x && x.id === id ? x.count : 0), 0);
  }
  // Mayús+clic: cuántas veces alcanza (cada casilla de la mesa aguanta una pila del ingrediente)
  vecesMax(r, have) {
    let n = 64;
    for (const [id, k] of ingredients(r)) n = Math.min(n, Math.floor(have(id) / k), maxStack(id));
    return Math.max(1, n);
  }

  // Acomoda los ingredientes de a uno (con su sonido y el "pop" sobre la mesa)
  layOut(rec, veces = 1) {
    const inv = this.game.inventory;
    // primero se devuelve lo que había en la cuadrícula
    for (let i = 0; i < this.grid.length; i++) if (this.grid[i]) { inv.add(this.grid[i].id, this.grid[i].count, this.grid[i].dur, extras(this.grid[i])); this.grid[i] = null; }
    this.containerChanged('grid');
    this.renderInventory();
    const cells = layout(rec, this.craftSize);
    if (!cells) return;
    const job = this.layoutJob = { k: 0 };
    const stepFn = () => {
      if (this.layoutJob !== job || this.state !== 'inventory') return;
      const c = cells[job.k++];
      if (!c) return;
      const q = inv.remove(c.id, veces);
      if (q < 1) { this.toast('Faltan materiales'); return; }
      this.grid[c.cell] = { id: c.id, count: q };
      const b = isBlockId(c.id) ? BLOCKS[c.id] : null;
      if (this.station) {
        const { x, y, z } = this.station;
        this.game.audio.material(b && b.sound ? b.sound : 'wood', 'place', { x: x + 0.5, y: y + 1, z: z + 0.5 });
      } else this.audio.play('select', { ui: true, vol: 0.25 });
      this.containerChanged('grid');
      this.renderInventory();
      setTimeout(stepFn, 85);
    };
    stepFn();
  }

  renderCursor() {
    const el = $('#cursor-stack');
    if (!this.cursor) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    this.fillSlot(el, this.cursor);
  }
  moveCursor(x, y) {
    const el = $('#cursor-stack');
    el.style.left = `${x}px`; el.style.top = `${y}px`;
    const tt = $('#tooltip');
    this.fichaBajoMouse();
    if (!tt.classList.contains('hidden')) { tt.style.left = `${x + 16}px`; tt.style.top = `${y - 30}px`; }
  }
  // la ficha se arma con lo que hay AHORA en la casilla de debajo del mouse: antes se armaba solo al entrar, y si la casilla
  // cambiaba (agarrar, soltar, mayús+clic) seguía diciendo lo de antes (una mena de hierro que decía «Puerta»)
  fichaBajoMouse() {
    const tt = $('#tooltip'), el = this.hoverEl;
    if (!el || !el.isConnected || !el.dataset.c) { if (el && !el.isConnected) { this.hoverEl = null; tt.classList.add('hidden'); } return; }
    const s = this.containerArr(el.dataset.c)[+el.dataset.i];
    this.showTooltip(s, el);
  }
  showTooltip(stack, el) {
    const tt = $('#tooltip');
    if (el) this.hoverEl = el;
    if (stack === null || stack === undefined) { tt.classList.add('hidden'); return; }
    tt.textContent = fichaItem(typeof stack === 'number' ? { id: stack } : stack, this.game);
    tt.classList.remove('hidden');
  }

  renderCatalog(filter) {
    const grid = $('#creative-grid');
    grid.innerHTML = '';
    const f = filter.toLowerCase();
    for (const id of creativeCatalog()) {
      const name = itemName(id);
      if (f && !name.toLowerCase().includes(f)) continue;
      const el = document.createElement('div');
      el.className = 'slot';
      this.fillSlot(el, { id, count: 1 });
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.audio.play('select', { ui: true, vol: 0.3 });
        if (this.cursor) { this.cursor = null; } // soltar sobre el catálogo = borrar
        else this.cursor = { id, count: e.button === 2 ? 1 : maxStack(id), ...(ITEMS[id] && ITEMS[id].durability ? { dur: ITEMS[id].durability } : {}) };
        this.renderCursor();
      });
      el.addEventListener('contextmenu', (e) => e.preventDefault());
      el.addEventListener('mouseenter', () => this.showTooltip(id, el));
      el.addEventListener('mouseleave', () => { if (this.hoverEl === el) this.hoverEl = null; $('#tooltip').classList.add('hidden'); });
      grid.appendChild(el);
    }
    if (!this.searchBound) {
      this.searchBound = true;
      $('#creative-search').addEventListener('input', (e) => this.renderCatalog(e.target.value));
      $('#creative-search').addEventListener('keydown', (e) => e.stopPropagation());
    }
  }

  // ---------- ajustes ----------
  bindSettings() {
    const s = this.settings;
    this.guardarAjustes = () => { saveSettings(s); this.game.settings = s; };
    const apply = () => {
      saveSettings(s);
      this.game.settings = s;
      if (this.game.world) this.game.world.renderDistance = s.renderDistance;
      this.audio.setVolume(s.volume);
      this.syncSettings();
    };
    $('#s-rd').addEventListener('input', (e) => { s.renderDistance = Number(e.target.value); apply(); });
    $('#s-fov').addEventListener('input', (e) => { s.fov = Number(e.target.value); apply(); });
    $('#s-sens').addEventListener('input', (e) => { s.sensitivity = Number(e.target.value); apply(); });
    $('#s-vol').addEventListener('input', (e) => { s.volume = Number(e.target.value); apply(); });
    $('#s-mus').addEventListener('input', (e) => { s.music = Number(e.target.value); apply(); });
    $('#s-hostile').addEventListener('change', (e) => { s.hostiles = e.target.checked; apply(); });
    $('#s-bob').addEventListener('change', (e) => { s.viewBobbing = e.target.checked; apply(); });
    $('#s-subs').addEventListener('change', (e) => { s.subtitulos = e.target.checked; apply(); });
    $('#s-aviso-respaldo').addEventListener('change', (e) => { s.avisoRespaldo = e.target.checked; apply(); }); // v12.8.5
    $('#s-objetivo').addEventListener('change', (e) => { s.objetivo = e.target.checked; apply(); });
    $('#s-mirando').addEventListener('change', (e) => { s.mirando = e.target.checked; apply(); });
    $('#s-reloj').addEventListener('change', (e) => { s.reloj = e.target.checked; apply(); });
    $('#s-numeros').addEventListener('change', (e) => { s.numeros = e.target.checked; apply(); });
    $('#s-avisos').addEventListener('change', (e) => { s.avisos = e.target.value; apply(); });
    $('#s-lectura').addEventListener('change', (e) => { s.lectura = e.target.value; apply(); });
    $('#s-correr').addEventListener('change', (e) => { s.correrToggle = e.target.checked; apply(); });
    $('#s-calma').addEventListener('change', (e) => { s.calma = e.target.checked; apply(); });
    $('#btn-settings-reset').addEventListener('click', async () => { if (!(await preguntar('¿Volver todos los ajustes (y las teclas) a como venían?', { si: 'Restablecer' }))) return; for (const k of Object.keys(s)) delete s[k]; Object.assign(s, DEFAULT_SETTINGS); apply(); this.syncSettings(); });
    $('#s-pausa-paneles').addEventListener('change', (e) => { s.pausaPaneles = e.target.checked; apply(); });
    $('#s-herramienta').addEventListener('change', (e) => { s.herramientaSola = e.target.checked; apply(); });
    $('#s-brillo').addEventListener('input', (e) => { s.luz = Number(e.target.value); $('#v-brillo').textContent = textoLuz(s.luz); apply(); }); // se ve en vivo: game.js lo lee cada cuadro
    $('#s-full').addEventListener('change', (e) => { s.fullscreen = e.target.checked; apply(); });
    // v12.9.0: la app instalable (src/pwa.js): botón «Instalar», estado sin conexión y aviso de versión nueva (nunca recarga sola)
    const pintaPwa = () => {
      const est = pwa.estado();
      $('#pwa-estado').textContent = pwa.instalada() ? 'Está instalado como aplicación.' + (est === 'activo' ? ' Listo para jugar sin conexión.' : '') : est === 'activo' ? 'Listo para jugar sin conexión. Desde el navegador (Chrome) también se puede instalar.' : 'Se juega desde el navegador.';
      $('#btn-instalar').classList.toggle('hidden', !pwa.puedeInstalar());
      $('#btn-actualizar').classList.toggle('hidden', !pwa.hayNueva());
      if (pwa.hayNueva() && this.game.world) this.toast('🆕 Hay una versión nueva. Ajustes → Aplicación → Actualizar', 7000, { cat: 'consejo', clave: 'pwa:nueva' });
    };
    $('#btn-instalar').addEventListener('click', () => pwa.instalar());
    $('#btn-actualizar').addEventListener('click', async () => { try { await this.game.save(); } catch { /* el juego guarda también solo */ } pwa.actualizar(); });
    pwa.alCambiar(pintaPwa); pintaPwa();
    $('#s-far').addEventListener('change', (e) => { s.farDistance = Number(e.target.value); apply(); if (this.game.far) this.game.far.setDistance(s.farDistance); });
    $('#s-scale').addEventListener('input', (e) => { s.renderScale = Number(e.target.value); if (this.regulador) this.regulador.olvidar(); apply(); this.game.resize(); });
    document.body.classList.toggle('sin-blur', (s.calidad || 'medio') === 'bajo'); // desde el arranque, no solo al abrir los ajustes
    // v12.0.0: calidad y efectos. Tocar un efecto pasa a «Personalizado» con lo que había
    $('#s-calidad').addEventListener('change', (e) => { if (this.regulador) this.regulador.olvidar(); // v12.5.2: olvidar() ya llama a resize
 if (e.target.value === 'personalizado' && s.calidad !== 'personalizado') s.video = { ...flagsDe(s) }; s.calidad = e.target.value; s.calidadElegida = true; apply(); });
    for (const k of ['tono', 'niebla', 'cielo', 'bruma', 'nitidez', 'agua', 'bloom', 'halos']) $(`#s-v-${k}`).addEventListener('change', (e) => { if (this.regulador) this.regulador.olvidar(); // v12.5.2
 s.video = { ...flagsDe(s), [k]: e.target.checked }; s.calidad = 'personalizado'; s.calidadElegida = true; apply(); });
    $('#s-perf').addEventListener('change', (e) => { s.perf = e.target.checked; apply(); });
    $('#s-calidad-auto').addEventListener('change', (e) => { s.calidadAuto = e.target.checked; if (this.regulador) this.regulador.olvidar(); apply(); }); // v12.5.0
    // el medidor de fps (dos veces por segundo)
    setInterval(() => {
      // v12.2.1: mientras no haya regulador automático, si en Medio (o más) va a menos de 40 fps por 10 s seguidos, el locutor sugiere
      // Bajo una sola vez (solo con la pestaña a la vista y jugando: una pestaña de fondo va lenta a propósito)
      const S2 = this.settings;
      if (this.game.ready && !this.listoDesde) this.listoDesde = performance.now();
      if (!this.game.ready) this.listoDesde = 0;
      if (S2.calidadAuto === false && this.state === 'playing' && document.visibilityState === 'visible' && S2.calidad !== 'bajo' && !S2.avisoFpsDado && this.game.fps && this.listoDesde && performance.now() - this.listoDesde > 20000) {
        this.fpsBajoT = this.game.fps < 40 ? (this.fpsBajoT || 0) + 0.5 : 0;
        if (this.fpsBajoT >= 10) {
          S2.avisoFpsDado = true; saveSettings(S2);
          this.toast('🐢 Va lento. Ajustes → Opciones de video → calidad «Bajo» lo alivia', 6000, { cat: 'consejo', clave: 'fps:bajo' });
        }
      } else this.fpsBajoT = 0;
      const el = $('#perf'), on = !!this.settings.perf && this.state !== 'menu';
      if (!el) return;
      el.classList.toggle('hidden', !on);
      if (on) el.textContent = `${this.game.fps || 0} fps · cpu ${(this.game.msCuadro || 0).toFixed(1)} ms · ${textoMedidor(this.game.renderer)} · ${NOMBRE_CALIDAD[this.game.calidadRegulada || this.settings.calidad] || 'Bajo'}${this.game.calidadRegulada ? ' (automático)' : ''}${(this.game.escalaAuto || 1) < 1 ? ` · resolución ${Math.round(this.game.escalaAuto * 100)} %` : ''}`; // v12.5.0: con la GPU
    }, 500);
  }
  syncSettings() {
    const s = this.settings;
    $('#s-rd').value = s.renderDistance; $('#v-rd').textContent = `${s.renderDistance} chunks${s.renderDistance >= 10 ? ' · pesado: mire los fps' : ''}`; // v12.0.1: hasta 16
    $('#s-fov').value = s.fov; $('#v-fov').textContent = `${s.fov}°`;
    $('#s-sens').value = s.sensitivity; $('#v-sens').textContent = `${Math.round(s.sensitivity * 100)}%`;
    $('#s-vol').value = s.volume; $('#v-vol').textContent = `${Math.round(s.volume * 100)}%`;
    $('#s-mus').value = s.music ?? 0.5; $('#v-mus').textContent = (s.music ?? 0.5) > 0 ? `${Math.round((s.music ?? 0.5) * 100)}%` : 'apagada';
    $('#s-hostile').checked = s.hostiles;
    $('#s-bob').checked = s.viewBobbing;
    $('#s-subs').checked = !!s.subtitulos;
    $('#s-aviso-respaldo').checked = s.avisoRespaldo !== false;
    { const e = document.getElementById('estado-almacen'); if (e) e.textContent = textoAlmacen(); }
    $('#s-objetivo').checked = s.objetivo !== false;
    $('#s-mirando').checked = s.mirando !== false;
    $('#s-reloj').checked = s.reloj !== false;
    $('#s-numeros').checked = s.numeros !== false;
    $('#s-avisos').value = s.avisos || 'normal';
    $('#s-lectura').value = s.lectura || 'normal';
    $('#s-correr').checked = !!s.correrToggle;
    $('#s-calma').checked = !!s.calma;
    $('#s-pausa-paneles').checked = s.pausaPaneles !== false;
    $('#s-herramienta').checked = s.herramientaSola !== false;
    document.body.classList.toggle('calma', calmaActiva({ settings: s })); // la misma regla que la cámara (calma.js)
    pintarTeclas(this);
    $('#s-brillo').value = s.luz ?? 50; $('#v-brillo').textContent = textoLuz(s.luz ?? 50);
    $('#s-full').checked = s.fullscreen;
    $('#s-far').value = String(s.farDistance);
    { // v12.0.0: calidad
      const c = s.calidad || 'bajo', f = flagsDe(s);
      $('#s-calidad').value = c;
      for (const k of ['tono', 'niebla', 'cielo', 'bruma', 'nitidez', 'agua', 'bloom', 'halos']) $(`#s-v-${k}`).checked = !!f[k];
      $('#s-calidad-auto').checked = s.calidadAuto !== false;
      $('#s-perf').checked = !!s.perf;
      $('#calidad-nota').textContent = NOTA_CALIDAD[c] || '';
      document.body.classList.toggle('sin-blur', c === 'bajo'); // en Bajo, sin desenfoque detrás de los paneles
    }
    $('#s-scale').value = s.renderScale; $('#v-scale').textContent = s.renderScale === 1 ? 'normal' : `${Math.round(s.renderScale * 100)}%`;
  }
}
