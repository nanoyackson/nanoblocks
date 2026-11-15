// Las pantallas de la sala (v12.11.0): unirse con un código, abrir el mundo a amistades, decidir quién entra, expulsar y chatear.
// Esto es lo único de la red que toca el juego (ui y game llegan por argumento; nada se importa de ellos). Va en el trozo «red»:
// el juego sin red nunca lo descarga.
import { GAME_VERSION } from '../version.js';
import { leerCodigo, enlaceDe } from './codigo.js';
import { crearSala, unirseSala, palabrasDeError, cuerpoPorDefecto } from './sesion.js';
import { pedirTurn } from './transporte.js';
import { textoLimpio } from './validar.js';
import { Remotos } from './remotos.js';
import { ITEMS, itemName, BLOCK_BY_KEY as K } from '../blocks.js';
import { idValido } from '../importar.js';

const K_NOMBRE = 'nanoblocks.red.nombre', K_TURN = 'nanoblocks.red.turn', K_CUERPO = 'nanoblocks.red.cuerpo';
const leer = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };
const CLIMAS = ['clear', 'rain', 'storm'];
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const E = { ui: null, g: null, sesion: null, el: null, modo: 'unirse', estado: 'quieto', error: '', pendientes: [], cancelar: false, codigo: '', texto: '' };

const nombreGuardado = () => textoLimpio(leer(K_NOMBRE), 16) || 'Jugador';
function cuerpoPropio() {
  const g = E.g;
  if (g && g.meta && g.meta.apariencia && !g.meta.invitado) { const a = g.meta.apariencia; return { camisa: (a.camisa | 0) & 31, piel: (a.piel | 0) & 31, pelo: (a.pelo | 0) & 31 }; }
  try { const c = JSON.parse(leer(K_CUERPO)); if (c && Number.isInteger(c.camisa)) return { camisa: c.camisa & 31, piel: c.piel & 31, pelo: c.pelo & 31 }; } catch { /* se hace uno */ }
  const c = cuerpoPorDefecto(String(Math.random()) + Date.now());
  guardar(K_CUERPO, JSON.stringify(c));
  return c;
}
const enRango = (v, a, b) => Math.min(b, Math.max(a, Number.isFinite(v) ? v : 0));

// lo que la sesión necesita del juego, sin que la sesión conozca el juego
function crearEnv() {
  const ui = E.ui;
  const g = () => E.g;
  return {
    version: GAME_VERSION,
    perfil: () => ({ nombre: nombreGuardado(), cuerpo: cuerpoPropio() }),
    miPos() {
      const p = g().player, b = p.body.pos, f = (p.sneaking ? 1 : 0) | (p.sprinting ? 2 : 0) | (p.flying ? 4 : 0) | (p.body.onGround ? 8 : 0) | (p.body.inWater ? 16 : 0) | (g().swing > 0 ? 32 : 0); // v13.3.1: 32 = está golpeando (picando, talando, pegando)
      const h = g().inventory && g().inventory.held;
      return { x: enRango(b.x, -3e7, 3e7), y: enRango(b.y, -20, 600), z: enRango(b.z, -3e7, 3e7), yaw: Number.isFinite(p.yaw) ? p.yaw : 0, pitch: Number.isFinite(p.pitch) ? p.pitch : 0, flags: f, arma: h && Number.isInteger(h.id) && h.id > 0 && h.id < 65536 ? h.id : 0, dim: 0 };
    },
    mundo() {
      const G = g(), m = G.meta, b = G.player.body.pos;
      return { nombre: textoLimpio(m.name, 40) || 'Mundo', seed: (m.seed >>> 0), genVersion: m.genVersion || 1, tipo: m.tipoMundo === 'compacto' ? 'compacto' : 'normal', dificultad: ['tranquilo', 'normal', 'dificil'].includes(m.dificultad) ? m.dificultad : 'normal', modo: G.mode === 'creative' ? 'creative' : 'survival', dim: 'tierra', dia: Math.max(1, G.day | 0), hora: enRango(G.time, 0, 1), spawn: { x: enRango(b.x, -3e7, 3e7), y: enRango(b.y, -20, 600), z: enRango(b.z, -3e7, 3e7) } };
    },
    tiempo() { const G = g(); return { dia: Math.max(1, G.day | 0), hora: enRango(G.time, 0, 1), clima: Math.max(0, CLIMAS.indexOf(G.weather ? G.weather.type : 'clear')) }; },
    aplicarTiempo(m) {
      const G = g();
      G.day = m.dia; G.time = m.hora;
      const t = CLIMAS[m.clima];
      if (G.weather && t && G.weather.type !== t) G.weather.set(t);
    },
    teleport(x, y, z) { const b = g().player.body; b.pos.x = x; b.pos.y = y; b.pos.z = z; b.vel.x = b.vel.y = b.vel.z = 0; },
    // construir juntos (v12.12.0). Anfitrión: solo se edita la Tierra y jamás desde el mundo de un invitado
    puedeEditar: () => { const G = g(); return !!G && !G.meta.invitado && G.dim === 'tierra' && !!G.world; },
    leer(x, y, z) { const w = g().world; if (y < 0 || y > 127) return 0; for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) w.cargarFijo(Math.floor(x / 16) + dx, Math.floor(z / 16) + dz); return w.getBlock(x, y, z); },
    leerSiCargado(x, y, z) { return y < 0 || y > 127 ? -1 : g().world.getBlock(x, y, z); },
    escribir(x, y, z, id) { g().world.setBlock(x, y, z, id); },
    modsDe: (cx, cz) => g().world.modsDe(cx, cz),
    chunksConMods: () => g().world.chunksConMods(),
    // invitado
    aplicarBloques(l) { const w = g().world; for (const [x, y, z, id] of l) w.aplicarRemoto(x, y, z, id); },
    aplicarMods(cx, cz, l, reset) { g().world.aplicarMods(cx, cz, l, reset); },
    chunksCerca() {
      const G = g(), b = G.player.body.pos, cx = Math.floor(b.x / 16), cz = Math.floor(b.z / 16), l = [];
      for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) l.push([cx + dx, cz + dz, dx * dx + dz * dz]);
      return l.sort((a, c) => a[2] - c[2]).slice(0, 16).map((e) => [e[0], e[1]]);
    },
    chat: (t) => ui.chat(t),
    aviso: (t) => ui.toast(t, 2500),
    remotos: (l) => { const G = g(); if (G && G.remotos) G.remotos.poner(l); },
    pedirEntrada(p) {
      E.pendientes.push(p);
      ui.toast(`🙋 ${p.nombre} pide entrar a su mundo. Pulse Esc para decidir`, 6000, 'urgente');
      pintar();
    },
    cancelaEntrada(userId) { E.pendientes = E.pendientes.filter((p) => p.userId !== userId); pintar(); },
    cambio: () => pintar(),
    cerro(motivo) { // el anfitrión nos sacó o cerró: volvemos al menú y se dice por qué
      const SALIDA = { expulsado: 'La persona anfitriona le sacó de la sala.', bloqueado: 'La persona anfitriona le sacó de la sala y no podrá volver a entrar.' };
      E.error = SALIDA[motivo] || palabrasDeError({ code: motivo });
      E.motivoSalida = motivo; // para depurar
      E.sesion = null;
      ui.quitToMenu().then(() => abrir(ui, 'unirse'));
    },
    // fichas (v12.13.0). Anfitrión: las fichas viven en meta.jugadores y se guardan con el mundo
    fichas: () => { const G = g(); return G && G.meta ? G.meta.jugadores || (G.meta.jugadores = {}) : null; }, // v12.16.4: sin partida cargada no hay fichas (null)
    guardar: () => { const G = g(); if (G && G.save) G.save(); },
    // invitado: la foto de lo propio, y reemplazar lo propio por lo que dice el anfitrión (nunca al revés)
    miFoto() {
      const G = g(), p = G.player;
      return { inv: G.mode === 'creative' ? null : JSON.parse(JSON.stringify(G.inventory.toJSON())), vital: { vida: enRango(p.health, 0, 200), hambre: enRango(p.food, 0, 20), agua: enRango(p.water ?? 20, 0, 20), aire: enRango(p.air, 0, 1000), volando: !!p.flying } };
    },
    aplicarFicha(f) {
      const G = g(), p = G.player;
      if (f.inv) G.inventory.load(f.inv);
      p.health = f.vital.vida; p.food = f.vital.hambre; p.water = f.vital.agua; p.air = f.vital.aire; p.flying = f.vital.volando && G.mode === 'creative';
      if (f.pos) { this.teleport(f.pos.x, f.pos.y, f.pos.z); p.yaw = f.pos.yaw; p.pitch = f.pos.pitch; }
      if (G.ui) { G.ui.refreshHotbar(); G.ui.refreshBars(); }
    },
    // criaturas (v12.14.0, F4). Anfitrión: las que se le cuentan a cada persona, los golpes que ella da y la vida con la que está
    mobsCerca(x, z, radio, max) {
      const l = [];
      for (const m of g().entities.mobs) {
        if (m.titere || m.dead || m.descartado || !/^[a-z0-9_]{1,40}$/.test(m.type || '')) continue;
        const b = m.body.pos, d = Math.hypot(b.x - x, b.z - z), jefe = m.kind.boss || m.kind.legend;
        // v12.14.1: los jefes y leyendas van primero (aunque haya 40 criaturas), con su vida máxima y si pelea (barra) o va en segunda fase
        const vm = Math.max(m.kind.health || 1, m.data.vmax || 0, m.health), fl = (m.dying ? 1 : 0) | (m.kind.boss && (m.data.angry || m.data.transformed || m.data.provoked || m.type === 'llorona') ? 2 : 0) | (jefe && (m.data.fase2 || m.health < vm * 0.5) ? 4 : 0);
        if (d <= radio) l.push([jefe ? d - 1000 : d, [m.nid, m.type, Math.round(b.x * 100) / 100, Math.round(b.y * 100) / 100, Math.round(b.z * 100) / 100, Math.round((Number.isFinite(m.yaw) ? m.yaw : 0) * 100) / 100, Math.max(0, Math.round(m.health)), fl, Math.round(vm)]]);
      }
      return l.sort((a, c) => a[0] - c[0]).slice(0, max).map((e) => e[1]);
    },
    golpearMob(q) {
      const G = g(), m = G.entities.mobs.find((e) => e.nid === q.id);
      if (!m || m.dying || m.dead || m.titere) return;
      const b = m.body.pos;
      if (Math.hypot(b.x - q.x, b.z - q.z) > 6 + m.kind.w * 0.5 || Math.abs(b.y - q.y) > 4 + m.kind.h) return; // más lejos de lo que llega un arma (con margen por la demora)
      const d = G.mode === 'creative' ? 100 : Math.min(40, ((ITEMS[q.arma] && ITEMS[q.arma].damage) || 1) * (q.pesado ? 1.5 : 1)); // el daño sale de SU arma, no del mensaje
      const jefe = m.kind.boss || m.kind.legend;
      if (jefe) (m.partRed ||= new Set()).add(q.pid); // v12.14.1: quienes le pegan a un jefe se reparten la recompensa
      G.golpeando = m;
      try { m.hurt(d, q.x, q.z); } finally { G.golpeando = null; }
      if (m.dying && jefe) G.killedMob(m); // el jefe vencido cuenta para el mundo (logros, monedas del anfitrión, xp) y paga a quienes ayudaron
      else if (m.dying && m.data.botinPara === undefined) m.data.botinPara = q.pid; // el botín es de quien da el último golpe (y no hay fuego amigo: las demás personas no son blancos)
    },
    vidaDe(pid, vida) { const G = g(); if (G && G.remotos && G.remotos.vivo) G.remotos.vivo(pid, vida > 0); },
    // invitado: lo que el anfitrión cuenta
    aplicarMobs(l) {
      const G = g(), E2 = G.entities;
      E2.titeres ||= new Map();
      const vistos = new Set();
      for (const [id, tipo, x, y, z, yaw, hp, fl, vm] of l) {
        vistos.add(id);
        let m = E2.titeres.get(id);
        if (!m) {
          if (E2.titeres.size >= 80) continue;
          m = E2.crearTitere({ id, tipo, x, y, z, yaw, hp });
          if (!m) continue;
          E2.titeres.set(id, m);
          if (m.kind.boss || m.kind.legend) { ui.toast(`⚠️ ${m.kind.name} anda cerca`, 3000, 'urgente'); }
        }
        m.red = { x, y, z, yaw }; m.noVisto = 0;
        if (hp < m.health) m.hurtT = 0.4;
        m.health = hp;
        m.data.vmax = vm; m.data.provoked = !!(fl & 2); // la barra de jefe (updateBossBar) mira provoked y la vida máxima
        if ((fl & 4) && !m.fase2Vista) { m.fase2Vista = true; if (m.kind.boss || m.kind.legend) ui.combatFlash('crit', `¡${m.kind.name} se enfurece!`); }
        if ((fl & 1) && !m.dying) m.dying = 0.001;
      }
      for (const [id, m] of E2.titeres) {
        if (vistos.has(id)) continue;
        if (m.dead || (m.noVisto = (m.noVisto || 0) + 1) >= 3) { m.dead = true; E2.titeres.delete(id); } // ya no lo cuenta el anfitrión (murió, se fue lejos o lo tiró)
      }
    },
    recibirDano(d) { g().damagePlayer(d.a, d.x, d.z, d.c, d.i, d.m === 2 ? 'media' : d.m === 1); },
    recibirBotin(l) {
      const G = g();
      for (const [id, n] of l) {
        if (!idValido(id)) continue;
        const resto = G.inventory.add(id, n);
        if (resto < n) ui.toast(`🎒 +${n - resto} ${itemName(id)}`, 1600);
        if (resto > 0) ui.toast(`🎒 No le cupo ${itemName(id)}`, 2200);
      }
    },
    // cofres con candado (v12.15.0). Anfitrión: lee y escribe el cofre de verdad. Invitado: abre la copia que le da el anfitrión
    cofre(x, y, z) {
      const G = g();
      if (!G.world || G.dim !== 'tierra' || G.world.getBlock(x, y, z) !== K.chest) return null;
      const be = G.world.getBE(x, y, z);
      return be && Array.isArray(be.slots) ? be : null;
    },
    ponerCofre(x, y, z, slots) { const be = g().world.getBE(x, y, z); if (be && Array.isArray(be.slots) && slots.length === be.slots.length) be.slots = slots; },
    abrirCofre(m) {
      const G = g(), w = G.world;
      if (G.ui.station || G.ui.state !== 'playing') return; // ya hay algo abierto: el candado se soltará solo
      const ant = w.getBE(m.x, m.y, m.z);
      w.setBE(m.x, m.y, m.z, { type: 'chest', facing: (ant && ant.facing) || 0, slots: m.slots, ...(m.nombre ? { nombre: m.nombre } : {}) });
      G.ui.openStation('chest', m.x, m.y, m.z);
    },
    cofreNo(m) { ui.toast(m.motivo === 'ocupado' ? `🔒 ${m.quien || 'Otra persona'} tiene abierto ese cofre. Espere a que lo cierre` : m.motivo === 'lejos' ? 'Ese cofre le queda muy lejos' : 'Ese cofre no se puede abrir', 2400); },
    cofreSuelto() { const G = g(); if (G.ui.station && G.ui.station.type === 'chest') { G.ui.closeInventory(); ui.toast('El cofre se cerró (pasó mucho rato abierto)', 2400); } },
    amanece() { const G = g(); if (G.lying && !G.lying.day && !G.sleeping) G.sleepNight(); },
    nombreDe: (pid) => (E.sesion && E.sesion.pid === pid ? nombreGuardado() : g().remotos ? g().remotos.nombreDe(pid) : 'Alguien'),
  };
}

async function turn() { return pedirTurn(leer(K_TURN)); }

function conectar(sesion) {
  const G = E.g;
  E.sesion = sesion; G.red = sesion;
  G.remotos = new Remotos(G, G.AvatarClase);
  // v12.14.0 (F4): el anfitrión le manda a cada persona el daño que le toca; el golpe de un invitado a un títere va por la sesión
  if (sesion.rol === 'anfitrion') G.alDanarRemoto = (obj, a, fx, fz, causa, ig, armored) => { const pid = G.remotos ? G.remotos.pidDe(obj) : -1; if (pid >= 0 && E.sesion) E.sesion.danar(pid, a, fx, fz, causa, ig, armored); };
  if (sesion.rol === 'invitado') { // cada cambio de la mochila se avisa a la sesión (ella decide cuándo mandar la foto)
    const antes = G.inventory.onChange;
    G.inventory.onChange = () => { if (antes) antes(); sesion.marcarInv(); };
  }
}

// ───────────── unirse a la sala de otra persona ─────────────
async function unirse(texto) {
  E.error = '';
  const c = leerCodigo(texto);
  if (!c.ok) { E.error = palabrasDeError({ code: c.motivo }); pintar(); return; }
  E.cancelar = false; E.estado = 'buscando'; pintar();
  const ui = E.ui;
  E.g = ui.game;
  const env = crearEnv();
  try {
    const { sesion, acepta } = await unirseSala(env, c, { turn: await turn(), cancelar: () => E.cancelar });
    const m = acepta.mundo, j0 = acepta.j.find((x) => x.pid === 0);
    const meta = { id: `red-${Date.now()}`, name: m.nombre, seed: m.seed, mode: m.modo === 'creative' ? 'creative' : 'survival', dificultad: m.dificultad, spawn: j0 ? { x: j0.x, y: j0.y, z: j0.z } : m.spawn, tipoMundo: m.tipo, genVersion: m.genVersion, time: m.hora, day: m.dia, invitado: true, apariencia: cuerpoPropio(), jugadores: {}, epoca: 1 };
    E.estado = 'quieto';
    ui.startGame(meta, new Map(), new Map());
    conectar(sesion);
    E.g.remotos.poner(acepta.j.filter((x) => x.pid !== acepta.pid));
  } catch (e) {
    E.estado = 'quieto';
    E.error = e && e.code === 'cancelado' ? '' : palabrasDeError(e);
    pintar();
  }
}

// ───────────── abrir el mundo propio a amistades ─────────────
async function abrirSala() {
  E.error = ''; E.estado = 'abriendo'; pintar();
  try {
    const s = await crearSala(crearEnv(), { turn: await turn() });
    conectar(s);
    E.codigo = s.codigo;
  } catch (e) { E.error = palabrasDeError(e); }
  E.estado = 'quieto'; pintar();
}
function cerrarSala() {
  const G = E.g;
  if (G.red) { G.red.cerrar(); G.red = null; }
  if (G.remotos) { G.remotos.limpiar(); G.remotos = null; }
  G.alDanarRemoto = null;
  E.sesion = null; E.codigo = ''; E.pendientes = [];
  pintar();
}

// ───────────── la pantalla ─────────────
function dom() {
  if (E.el) return E.el;
  const el = document.createElement('div');
  el.id = 'screen-red'; el.className = 'screen dim';
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
  el.innerHTML = '<div class="panel wide" id="red-panel"></div>';
  document.body.appendChild(el);
  E.el = el;
  el.addEventListener('click', (ev) => { const b = ev.target.closest('[data-r]'); if (b) accion(b.dataset.r, b.dataset.a, b); });
  el.addEventListener('submit', (ev) => ev.preventDefault());
  return el;
}

function copiar(texto, b) {
  const listo = () => { const t = b.textContent; b.textContent = '¡Copiado!'; setTimeout(() => { b.textContent = t; }, 1400); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(listo, () => {});
}

function accion(r, a, b) {
  const s = E.sesion, ui = E.ui;
  if (r === 'volver') { E.cancelar = true; if (ui.state === 'paused') ui.show('pause'); else ui.show('menu'); return; }
  if (r === 'unirse') { const n = E.el.querySelector('#red-nombre'); guardar(K_NOMBRE, textoLimpio(n.value, 16) || 'Jugador'); E.texto = E.el.querySelector('#red-codigo').value; unirse(E.texto); return; }
  if (r === 'cancelar') { E.cancelar = true; return; }
  if (r === 'abrir') { const n = E.el.querySelector('#red-nombre'); if (n) guardar(K_NOMBRE, textoLimpio(n.value, 16) || 'Jugador'); abrirSala(); return; }
  if (r === 'cerrar') { cerrarSala(); return; }
  if (r === 'salir') { E.cancelar = true; ui.quitToMenu(); return; }
  if (r === 'copiar-codigo') { copiar(E.codigo, b); return; }
  if (r === 'copiar-enlace') { copiar(enlaceDe(E.codigo, location.origin + location.pathname), b); return; }
  if (r === 'entrar' || r === 'no' || r === 'bloquear') {
    const p = E.pendientes[Number(a)];
    if (!p) return;
    E.pendientes.splice(Number(a), 1);
    if (r === 'entrar') p.aceptar(); else p.rechazar(r === 'bloquear');
    pintar(); return;
  }
  if (r === 'expulsar' || r === 'bloq' || r === 'bloquear-dentro') {
    if (s && s.rol === 'anfitrion') s.expulsar(a, r !== 'expulsar');
    pintar(); return;
  }
  if (r === 'chat') {
    const i = E.el.querySelector('#red-chat'); const t = i.value; i.value = '';
    if (s && t.trim()) s.hablar(t);
  }
}

function gente() {
  const s = E.sesion, G = E.g;
  const filas = [];
  if (s.rol === 'anfitrion') {
    filas.push(`<li>👑 ${esc(nombreGuardado())} (usted)</li>`);
    for (const [peerId, p] of s.gente) {
      if (p.estado !== 'dentro') continue;
      filas.push(`<li>${esc(p.nombre)} <button type="button" class="ghost" data-r="expulsar" data-a="${esc(peerId)}">Sacar</button> <button type="button" class="ghost" data-r="bloq" data-a="${esc(peerId)}">Sacar y bloquear</button></li>`);
    }
  } else {
    filas.push(`<li>${esc(nombreGuardado())} (usted)</li>`);
    if (G.remotos) for (const [pid, r] of G.remotos.por) filas.push(`<li>${pid === 0 ? '👑 ' : ''}${esc(r.nombre)}</li>`);
  }
  return `<ul class="red-gente">${filas.join('')}</ul>`;
}

// La guía corta (v12.15.0): va dentro de la pantalla de la sala, en todos sus estados. Tono «usted», neutro.
function guia() {
  return `<details class="red-guia"><summary>Cómo jugar con amistades</summary>
    <ol class="nota-ajuste">
      <li><b>Abrir la sala.</b> Entre a su mundo, pause el juego y pulse «Sala de amistades», luego «Abrir a amistades». Hasta 5 personas más pueden entrar.</li>
      <li><b>Compartir el código.</b> Pulse «Copiar código» (o «Copiar enlace») y envíelo por el medio que prefiera. Solo sirve mientras usted tenga la sala abierta.</li>
      <li><b>Aprobar.</b> Cuando alguien pida entrar, le saldrá un aviso: pulse Esc y elija «Dejar entrar» o «No». Nadie entra sin su permiso, y puede sacar o bloquear a cualquiera.</li>
      <li><b>Para unirse.</b> Desde el menú principal, «Jugar con amistades»: escriba su nombre, pegue el código y espere a que la persona anfitriona le deje entrar. Ambas personas deben tener la misma versión del juego.</li>
      <li><b>Cofres y camas.</b> Un cofre lo tiene abierto una sola persona a la vez. La noche pasa cuando todas las personas presentes están en cama; el aviso dice cuántas faltan.</li>
      <li><b>Si no conecta.</b> Revise su internet y pruebe de nuevo; pida un código nuevo; recargue la página en ambos lados (misma versión); pruebe en otra red o con datos móviles. Algunas redes de oficinas o escuelas bloquean las conexiones directas.</li>
      <li><b>Conexión de respaldo (TURN, opcional).</b> Si dos personas no logran conectarse aun así, la persona anfitriona puede pegar una clave de Open Relay en Ajustes → «Jugar en línea» → «Clave TURN». Solo se necesita en esos casos.</li>
    </ol></details>`;
}

function pintar() {
  if (!E.el) return;
  const p = E.el.querySelector('#red-panel'), s = E.sesion;
  const msg = E.error ? `<p class="nota-ajuste red-error" role="alert">${esc(E.error)}</p>` : '';
  const enterrado = (valor = '') => `<input id="red-chat" maxlength="200" autocomplete="off" placeholder="Escriba un mensaje…" ${valor} />`;
  let h = '';
  if (E.estado === 'buscando') {
    h = '<h2>Buscando la sala…</h2><p class="nota-ajuste">Puede tardar unos segundos. Si la persona anfitriona tiene que aceptarlo, espere su respuesta.</p><button type="button" data-r="cancelar" class="ghost">Cancelar</button>';
  } else if (E.estado === 'abriendo') {
    h = '<h2>Abriendo la sala…</h2><p class="nota-ajuste">Conectando con los servidores de salas.</p>';
  } else if (!s && E.modo === 'unirse') {
    h = `<h2>Jugar con amistades</h2>
      <p class="nota-ajuste">🔒 Jugar en línea muestra su dirección de red a las demás personas de la sala. Solo entre en salas de gente que conoce.</p>
      ${msg}
      <label>Su nombre: <input id="red-nombre" maxlength="16" value="${esc(nombreGuardado())}" /></label>
      <label>Código de la sala: <input id="red-codigo" placeholder="NB1.…" value="${esc(E.texto)}" autocomplete="off" /></label>
      <button type="button" data-r="unirse">Unirse</button>
      <p class="nota-ajuste">Para abrir su propio mundo a amistades: entre a su mundo, pause el juego y pulse «Sala de amistades».</p>
      ${guia()}
      <button type="button" data-r="volver" class="ghost">Volver</button>`;
  } else if (!s) { // anfitrión sin sala abierta todavía
    h = `<h2>Sala de amistades</h2>
      <p class="nota-ajuste">🔒 Abrir la sala muestra su dirección de red a quienes entren. Usted decide quién entra: nadie pasa sin su permiso. Hasta 5 personas más.</p>
      ${msg}
      <label>Su nombre: <input id="red-nombre" maxlength="16" value="${esc(nombreGuardado())}" /></label>
      <button type="button" data-r="abrir">Abrir a amistades</button>
      ${guia()}
      <button type="button" data-r="volver" class="ghost">Volver</button>`;
  } else if (s.rol === 'anfitrion') {
    const pend = E.pendientes.map((x, i) => `<li>🙋 ${esc(x.nombre)} pide entrar <button type="button" data-r="entrar" data-a="${i}">Dejar entrar</button> <button type="button" class="ghost" data-r="no" data-a="${i}">No</button> <button type="button" class="ghost" data-r="bloquear" data-a="${i}">Bloquear</button></li>`).join('');
    h = `<h2>Su sala está abierta</h2>
      ${msg}
      <p class="nota-ajuste">Pase este código a quien quiera invitar (solo sirve mientras usted tenga la sala abierta):</p>
      <input readonly id="red-codigo-ver" value="${esc(E.codigo)}" />
      <div class="row"><button type="button" data-r="copiar-codigo">Copiar código</button><button type="button" data-r="copiar-enlace" class="ghost">Copiar enlace</button></div>
      ${pend ? `<h3>Piden entrar</h3><ul class="red-gente">${pend}</ul>` : ''}
      <h3>En la sala</h3>${gente()}
      <form id="red-form">${enterrado()}<button type="submit" data-r="chat" class="ghost">Enviar</button></form>
      ${guia()}
      <button type="button" data-r="cerrar" class="ghost">Cerrar la sala</button>
      <button type="button" data-r="volver">Volver al juego</button>`;
  } else {
    h = `<h2>En la sala de ${esc(E.g.meta.name)}</h2>${msg}<h3>En la sala</h3>${gente()}
      <form id="red-form">${enterrado()}<button type="submit" data-r="chat" class="ghost">Enviar</button></form>
      ${guia()}
      <button type="button" data-r="salir" class="ghost">Salir de la sala</button>
      <button type="button" data-r="volver">Volver al juego</button>`;
  }
  const conFoco = p.contains(document.activeElement) && document.activeElement.id ? document.activeElement.id : '';
  const chatTxt = p.querySelector('#red-chat') ? p.querySelector('#red-chat').value : '';
  p.innerHTML = h;
  const ch = p.querySelector('#red-chat'); if (ch) ch.value = chatTxt;
  const f = conFoco && p.querySelector(`#${conFoco}`); if (f) f.focus();
  const ver = p.querySelector('#red-codigo-ver'); if (ver) ver.addEventListener('click', () => ver.select()); // v12.16.4: sin onclick inline (CSP)
  const form = p.querySelector('#red-form');
  if (form) form.addEventListener('submit', () => accion('chat'));
  // «Volver al juego» sale de la pantalla; en pausa vuelve a la pausa
}

// punto de entrada: modo 'unirse' (desde el menú) o 'sala' (desde la pausa, del que ya tiene un mundo abierto)
export function abrir(ui, modo, codigoTexto) {
  E.ui = ui; E.modo = modo; E.g = ui.game;
  if (codigoTexto) E.texto = codigoTexto;
  if (!ui.game.red) { E.sesion = null; E.codigo = ''; }
  dom();
  pintar();
  ui.show('red');
}

// otros archivos del juego que necesitan decirle algo a la sala sin importarla (el chat, por ejemplo)
export const hablar = (texto) => (E.sesion ? E.sesion.hablar(texto) : false);
