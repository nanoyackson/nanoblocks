// La sesión de sala (v12.11.0, F1): la lógica del anfitrión (autoritativo) y del invitado. No importa nada del juego: recibe un «env» con
// lo que necesita (ver pantallas.js). Todo lo que llega pasa por validar.js y limites.js; el remitente es el userId verificado por
// Trystero (nunca un campo del cuerpo). Aún no se construye junto (F2): aquí van la sala, el movimiento, la hora, el clima y el chat.
import { validar, velocidadOk, alcanceOk, textoLimpio, PROTOCOL_VERSION, MAX_BLOQUES, MAX_TROZO, MAX_MOBS } from './validar.js';
import { puedePoner, puedeRomper, esReemplazable, apoyoOk } from './reglas.js';
import { nuevoInvitado, recibir, mirada, nuevoGlobal, gastarGlobal } from './limites.js';
import { abrirSala, MAX_JUGADORES } from './transporte.js';
import { permisoDe, topeProps, cofreOk, contarInv, cierre as cierreCofre, COFRE_TIEMPO_MAX } from './cofres.js';
import { armarCodigo, salaNueva, claveNueva } from './codigo.js';
import { GEN_MAX } from '../version.js';
import { LLAVE, MAX_FICHAS, fichaNueva, invOk, cambioOk, vitalOk, cupoNuevo, recargar, creditoBloque, creditoBotin, copiaInv } from './ficha.js';

export const HZ_POS = 10, HZ_JUG = 10, HZ_TIEMPO = 1, HZ_MOBS = 5;
const RADIO_MOBS = 64, GOLPE_MIN_MS = 220; // criaturas que se le cuentan a cada persona (a ≤ 64 bloques) y el menor tiempo entre dos golpes suyos
const ESPERA_MAX = 90000; // el anfitrión tiene 90 s para decidir
const BUSCA_MAX = 20000; // y el invitado 20 s para encontrar la sala
const CORRECCIONES_MAX = 10, VENTANA_CORRECC = 10000;
const PUESTO_MIN_MS = 10 * 60 * 1000, PUESTOS_MAX = 4000; // M2: lo que un invitado puso no da cupo al romperlo en 10 min (se recuerdan hasta 4000)
const RECHAZOS_MAX = 60; // bloques rechazados en 10 s antes de sacar a un invitado
const HZ_BLOQUES = 20; // el anfitrión junta los cambios y los difunde 20 veces por segundo
const PEND_MAX = 4000, RITMO_BLOQUES = 16; // cambios propios por mandar (invitado) y cuántos manda por segundo
const COLA_MAX = 4000; // si se acumulan más, se manda el estado de los trozos en vez de cambio por cambio
const TROZOS_POR_TIC = 2, TROZOS_COLA_MAX = 64;
const GUARDA_CADA = 5; // segundos: las fichas con cambios se guardan a lo sumo cada 5 s (y de inmediato cuando alguien sale)
const TRAMPAS_MAX = 8; // fotos de mochila rechazadas seguidas antes de sacar a un invitado
const ahora = () => performance.now();
// un aspecto distinto por invitado, sacado de su userId (el vestidor es del que tiene mundo propio)
export const cuerpoPorDefecto = (userId) => { let h = 0; for (const c of userId) h = (h * 31 + c.charCodeAt(0)) >>> 0; return { camisa: h % 6, piel: (h >> 3) % 5, pelo: (h >> 6) % 6 }; };

// lo que pasa con cada código de error, en palabras de persona
export function palabrasDeError(e) {
  const c = e && (e.code || e.motivo || e);
  return ({
    'no-sala': 'No se encontró la sala. Revise que el código esté completo y que la persona anfitriona la tenga abierta.',
    clave: 'El código no es correcto (la clave no coincide). Pídalo de nuevo.',
    'decrypt-failed': 'El código no es correcto (la clave no coincide). Pídalo de nuevo.',
    formato: 'Eso no parece un código de NanoBlocks. Empieza con NB1.',
    llena: 'La sala está llena.', 'room-full': 'La sala está llena.',
    expulsado: 'La persona anfitriona no lo dejó entrar.', banned: 'La persona anfitriona no lo dejó entrar.',
    'no-acepta': 'La persona anfitriona no lo dejó entrar.',
    version: 'Su versión de NanoBlocks no es la misma que la de la sala. Recargue la página para actualizar.',
    'gen-nueva': 'Actualice el juego: recargue la página. La sala usa un mundo más nuevo que su versión de NanoBlocks.',
    'ya-conectado': 'Esta cuenta ya está en la sala desde otra pestaña.',
    fichas: 'Esta sala ya tiene todas sus fichas de jugador ocupadas.',
    'sin-respuesta': 'La persona anfitriona no respondió a tiempo.',
    'sin-red': 'No se pudo contactar con ningún servidor de salas. Revise su conexión o pruebe en otra red.',
    'relay-failed': 'No se pudo contactar con ningún servidor de salas. Revise su conexión o pruebe en otra red.',
    'anfitrion-salio': 'La persona anfitriona cerró la sala.',
    ritmo: 'Se le sacó de la sala por mandar demasiados mensajes.',
    cierre: 'La persona anfitriona cerró la sala.',
    cancelado: 'Cancelado.',
  })[c] || 'No se pudo entrar a la sala.';
}

class Base {
  constructor(canal, env) {
    this.canal = canal; this.env = env;
    this.t = { pos: 0, jug: 0, tiempo: 0, bloques: 0, repara: 0, guarda: 0, inv: 0, mobs: 0 };
    this.seq = 0; this.cerrada = false;
    canal.alMensaje((n, cuerpo, ctx) => {
      if (this.cerrada) return;
      let bytes = 0;
      try { bytes = JSON.stringify(cuerpo).length; } catch { return; }
      this.recibe(n.slice(3), cuerpo, bytes, ctx);
    });
  }
  cerrar() { if (this.cerrada) return; this.cerrada = true; try { this.canal.salir(); } catch { /* ya cerrada */ } }
}

// ───────────────────────────── anfitrión ─────────────────────────────
export class Anfitrion extends Base {
  constructor(canal, env, codigo) {
    super(canal, env);
    this.rol = 'anfitrion'; this.codigo = codigo;
    // peerId → invitado { userId, estado:'espera'|'dentro', nombre, cuerpo, pid, lim, pos, posT, malas:[], silencioHasta, faltas, esperaT }
    this.gente = new Map();
    this.global = nuevoGlobal(ahora());
    this.bloqueados = new Set();
    this.sucio = false; // hay fichas con cambios sin guardar
    this.puestos = new Map(); // 'x,y,z' → cuándo lo puso un invitado
    this.candados = new Map(); // v12.15.0: 'x,y,z' → { quien: peerId | 'host', nombre, t, antes, abre, permiso }: el cofre que alguien tiene abierto
    this.cola = new Map(); // 'x,y,z' → [x,y,z,id]: cambios del mundo por difundir (de quien sea: invitado, anfitrión o la física)
    canal.alSalir((userId, peerId) => this.sale(peerId));
  }

  dentro() { return [...this.gente.values()].filter((g) => g.estado === 'dentro'); }
  pidLibre() { const u = new Set(this.dentro().map((g) => g.pid)); for (let i = 1; i < MAX_JUGADORES; i++) if (!u.has(i)) return i; return 0; }
  lista() {
    const p = this.env.perfil();
    const l = [{ pid: 0, nombre: p.nombre, cuerpo: p.cuerpo, ...this.env.miPos() }];
    for (const g of this.dentro()) if (g.pos) { const { seq, ...p } = g.pos; l.push({ pid: g.pid, nombre: g.nombre, cuerpo: g.cuerpo, ...p }); } // eslint-disable-line no-unused-vars
    return l;
  }
  a(peerId, tipo, cuerpo) { return this.canal.enviar(`nb.${tipo}`, cuerpo, peerId); }
  todos(tipo, cuerpo) { for (const [p, g] of this.gente) if (g.estado === 'dentro') this.a(p, tipo, cuerpo); }

  recibe(tipo, cuerpo, bytes, { userId, peerId }) {
    if (!gastarGlobal(this.global, ahora())) return; // el tope entre todos los invitados
    if (!['hola', 'pos', 'chat', 'salud', 'bloque', 'chunks_pide', 'inv', 'golpe', 'cofre_abre', 'cofre_cierra', 'cama'].includes(tipo)) return; // el invitado solo manda estos
    const g = this.gente.get(peerId);
    if (tipo === 'hola') return this.hola(cuerpo, bytes, userId, peerId, g);
    if (!g || g.estado !== 'dentro') return; // sin «hola» aceptado no hay nada que decir
    if (!recibir(g.lim, tipo, ahora())) {
      if (tipo === 'chat') this.faltaChat(g, peerId);
      else if (tipo === 'bloque' && (!g.lim.flood || g.lim.flood.length <= 200)) this.corregirBloque(peerId, cuerpo, bytes); // v13.5.4
      if (mirada(g.lim, ahora()) === 'expulsa') this.expulsar(peerId, false, 'ritmo');
      return;
    }
    const r = validar(tipo, cuerpo, bytes, true);
    if (!r.ok) { g.lim.malos++; return; }
    if (tipo === 'pos') this.pos(g, peerId, r.msg);
    else if (tipo === 'chat') this.chatDe(g, r.msg.texto);
    else if (tipo === 'bloque') this.bloque(g, peerId, r.msg);
    else if (tipo === 'chunks_pide') this.pideTrozos(g, r.msg.c);
    else if (tipo === 'inv') this.fotoDe(g, peerId, r.msg);
    else if (tipo === 'golpe') this.golpeDe(g, r.msg);
    else if (tipo === 'cofre_abre') this.cofreAbre(g, peerId, r.msg);
    else if (tipo === 'cofre_cierra') this.cofreCierra(g, peerId, r.msg);
    else if (tipo === 'cama') g.cama = r.msg.en === 1;
  }

  hola(cuerpo, bytes, userId, peerId, previo) {
    const lim = previo ? previo.lim : nuevoInvitado(ahora());
    if (!recibir(lim, 'hola', ahora())) return;
    const r = validar('hola', cuerpo, bytes, true);
    if (!r.ok) return this.a(peerId, 'rechazo', { motivo: r.motivo === 'version' ? 'version' : 'hola' });
    if (previo) return; // ya hizo su «hola»
    const m = r.msg;
    if (m.g !== this.env.version) return this.a(peerId, 'rechazo', { motivo: 'version' });
    if (this.bloqueados.has(userId)) return this.a(peerId, 'rechazo', { motivo: 'expulsado' });
    // una segunda pestaña con la misma llave: se rechaza la segunda, la primera sigue
    if ([...this.gente.values()].some((x) => x.userId === userId) || userId === this.canal.userId) return this.a(peerId, 'rechazo', { motivo: 'ya-conectado' });
    if (this.gente.size >= MAX_JUGADORES - 1) return this.a(peerId, 'rechazo', { motivo: 'llena' });
    // v12.13.0: la ficha se guarda por llave: tiene que ser una llave de verdad, no estar bloqueada y haber lugar para una más
    const F = this.env.fichas();
    if (!F) return this.a(peerId, 'rechazo', { motivo: 'hola' }); // v12.16.4: el anfitrión tiene el menú abierto sin partida cargada
    const previa = Object.prototype.hasOwnProperty.call(F, userId) ? F[userId] : null;
    if (!LLAVE.test(userId)) return this.a(peerId, 'rechazo', { motivo: 'hola' });
    if (previa && previa.bloqueado) return this.a(peerId, 'rechazo', { motivo: 'expulsado' });
    if (!previa && Object.keys(F).length >= MAX_FICHAS) return this.a(peerId, 'rechazo', { motivo: 'fichas' });
    this.gente.set(peerId, { userId, estado: 'espera', nombre: m.nombre, cuerpo: m.cuerpo, pid: 0, lim, pos: null, posT: 0, malas: [], silencioHasta: 0, faltas: 0, esperaT: ahora(), rechazos: [], envio: new Map(), ficha: null, rev: 0, cupo: cupoNuevo(), cupoT: ahora(), trampas: 0 });
    this.env.pedirEntrada({ nombre: m.nombre, userId, aceptar: () => this.acepta(peerId), rechazar: (bloquear) => this.rechaza(peerId, bloquear) });
  }

  acepta(peerId) {
    const g = this.gente.get(peerId);
    if (!g || g.estado !== 'espera') return;
    const pid = this.pidLibre();
    if (!pid) return this.rechaza(peerId, false, 'llena');
    g.estado = 'dentro'; g.pid = pid;
    this.a(peerId, 'acepta', { pid, mundo: this.env.mundo(), j: this.lista() });
    this.env.aviso(`${g.nombre} entró a la sala`);
    if (this.env.cambio) this.env.cambio();
    this.mandarMundo(g); // entrada tardía: el estado del mundo, por trozos
    this.entregaFicha(g, peerId);
  }
  bloquea(g) {
    this.bloqueados.add(g.userId); this.canal.expulsar(g.userId, 'bloqueado');
    const F = this.env.fichas();
    if (Object.prototype.hasOwnProperty.call(F, g.userId)) { F[g.userId].bloqueado = true; this.sucio = true; } // y se recuerda al reabrir el mundo
  }
  rechaza(peerId, bloquear, motivo = 'no-acepta') {
    const g = this.gente.get(peerId);
    if (!g) return;
    this.a(peerId, 'rechazo', { motivo: bloquear ? 'expulsado' : motivo });
    if (bloquear) this.bloquea(g);
    this.gente.delete(peerId);
  }
  expulsar(peerId, bloquear = false, motivo = null) {
    const g = this.gente.get(peerId);
    if (!g) return;
    this.a(peerId, 'expulsa', { motivo: motivo || (bloquear ? 'bloqueado' : 'expulsado') });
    if (bloquear) this.bloquea(g);
    this.env.aviso(`${g.nombre} salió de la sala`);
    this.salida(g);
    this.gente.delete(peerId);
    if (this.env.cambio) this.env.cambio();
  }
  sale(peerId) {
    const g = this.gente.get(peerId);
    if (!g) return;
    this.salida(g);
    this.gente.delete(peerId);
    if (g.estado === 'dentro') { this.env.aviso(`${g.nombre} salió de la sala`); if (this.env.cambio) this.env.cambio(); } else if (this.env.cancelaEntrada) this.env.cancelaEntrada(g.userId);
  }

  // ── fichas (F3) ──
  // Al entrar: si la llave ya tenía ficha se le devuelve (y reaparece donde se quedó); si no, empieza con el equipo inicial.
  // La ficha vive SOLO aquí (meta.jugadores del mundo del anfitrión): la mochila que el invitado traiga se reemplaza por esta.
  entregaFicha(g, peerId) {
    const F = this.env.fichas(), creativo = this.env.mundo().modo === 'creative', t = Date.now();
    let f = Object.prototype.hasOwnProperty.call(F, g.userId) ? F[g.userId] : null;
    if (!f) {
      f = fichaNueva(g.nombre, g.cuerpo, t, !creativo);
      F[g.userId] = f;
    } else {
      if (f.nombre !== g.nombre) { f.nombres = [...(f.nombres || []).filter((n) => n !== g.nombre), g.nombre].slice(-5); f.nombre = g.nombre; }
      f.ultimaVez = t; f.cuerpo = g.cuerpo;
      if (!creativo && !f.inv) f.inv = fichaNueva(g.nombre, g.cuerpo, t).inv; // vino de un mundo creativo: empieza con el equipo inicial
    }
    f.estado = 'activo';
    g.ficha = f; this.sucio = true;
    this.mandaFicha(g, peerId, true);
  }
  mandaFicha(g, peerId, conPos) {
    const f = g.ficha, creativo = this.env.mundo().modo === 'creative';
    g.rev++;
    this.a(peerId, 'ficha', {
      rev: g.rev, inv: creativo ? null : copiaInv(f.inv), vital: { ...f.vital },
      pos: conPos && f.pos ? { x: f.pos.x, y: f.pos.y, z: f.pos.z, yaw: f.pos.yaw, pitch: f.pos.pitch } : null,
    });
  }
  // La foto de la mochila: se acepta solo si cuadra con lo guardado y con el cupo; si no, se le manda su ficha verdadera.
  fotoDe(g, peerId, m) {
    const f = g.ficha, creativo = this.env.mundo().modo === 'creative';
    if (!f || m.rev !== g.rev) return; // vieja: se hizo antes de la última corrección
    const t = ahora();
    recargar(g.cupo, (t - g.cupoT) / 1000); g.cupoT = t;
    const v = vitalOk(m.vital, creativo);
    if (!v) return;
    if (!creativo) {
      const r = m.inv && invOk(m.inv) ? cambioOk(f.inv, m.inv, g.cupo, this.permisoDe(g)) : { ok: false };
      if (!r.ok) {
        g.trampas++;
        if (g.trampas >= TRAMPAS_MAX) return this.expulsar(peerId, false, 'ritmo');
        return this.mandaFicha(g, peerId, false); // lo verdadero reemplaza lo que él tenía
      }
      g.cupo.n -= r.gasto; g.trampas = 0;
      f.inv = copiaInv(m.inv);
    }
    f.vital = v; this.sucio = true;
    if (this.env.vidaDe) this.env.vidaDe(g.pid, v.vida); // v12.14.0: las criaturas solo atacan a quien está en pie
  }
  // se pasa a la ficha lo último que se sabe (dónde está) antes de guardar
  volcar(g) {
    if (!g.ficha) return;
    if (g.pos) g.ficha.pos = { x: g.pos.x, y: g.pos.y, z: g.pos.z, yaw: g.pos.yaw, pitch: g.pos.pitch };
    g.ficha.ultimaVez = Date.now(); g.ficha.rev++;
  }
  volcarTodo() { for (const g of this.dentro()) this.volcar(g); }
  salida(g) {
    if (g.estado !== 'dentro' || !g.ficha) return;
    this.sueltaDe(g, false); // v12.15.0: se va con un cofre abierto: se suelta sin duplicar nada
    this.volcar(g); g.ficha.estado = 'fuera'; this.sucio = false;
    if (this.env.guardar) this.env.guardar(); // de inmediato: es un evento crítico
  }

  // ── cofres con candado (v12.15.0) ──
  permisoDe(g) { const c = g.candado && this.candados.get(g.candado); return c && c.quien === g.peerId ? c.permiso : null; }
  clave(m) { return `${m.x},${m.y},${m.z}`; }
  cofreAbre(g, peerId, m) {
    const k = this.clave(m), be = this.env.cofre(m.x, m.y, m.z);
    if (!be) return this.a(peerId, 'cofre_no', { motivo: 'no', quien: '' });
    if (g.pos && Math.hypot(m.x + 0.5 - g.pos.x, m.y + 0.5 - g.pos.y, m.z + 0.5 - g.pos.z) > 9) return this.a(peerId, 'cofre_no', { motivo: 'lejos', quien: '' });
    const c = this.candados.get(k);
    if (c && c.quien !== peerId) return this.a(peerId, 'cofre_no', { motivo: 'ocupado', quien: c.nombre });
    g.peerId = peerId;
    if (g.candado && g.candado !== k) this.sueltaDe(g, true); // una sola persona, un solo cofre a la vez
    if (!c) {
      const inv = g.ficha && g.ficha.inv;
      this.candados.set(k, { quien: peerId, nombre: g.nombre, t: ahora(), x: m.x, y: m.y, z: m.z, antes: JSON.parse(JSON.stringify(be.slots)), abre: inv ? contarInv(inv) : null, permiso: inv ? permisoDe(be.slots) : null, tope: topeProps(be.slots, inv) });
      g.candado = k;
    }
    this.a(peerId, 'cofre', { x: m.x, y: m.y, z: m.z, slots: JSON.parse(JSON.stringify(this.candados.get(k).antes)), nombre: be.nombre || null });
  }
  cofreCierra(g, peerId, m) {
    const c = this.candados.get(this.clave(m));
    if (!c || c.quien !== peerId) return;
    this.suelta(this.clave(m), m.slots, false);
  }
  // el cofre queda como pudo pasar de verdad: se calcula con lo que ganó o perdió su mochila, no con lo que ella diga
  suelta(k, dice, avisar) {
    const c = this.candados.get(k);
    if (!c) return;
    this.candados.delete(k);
    if (c.quien === 'host') return;
    const g = this.gente.get(c.quien);
    if (g) g.candado = null;
    const inv = g && g.ficha && g.ficha.inv;
    if (c.abre && inv) this.env.ponerCofre(c.x, c.y, c.z, cierreCofre(c.antes, dice, c.abre, contarInv(inv), c.tope));
    else if (dice && cofreOk(dice, c.antes ? c.antes.length : 0)) this.env.ponerCofre(c.x, c.y, c.z, dice); // mundo creativo: la mochila no se cuida, pero el catálogo sí (M3); si no pasa, el cofre queda como estaba
    if (avisar && g) this.a(c.quien, 'cofre_suelta', {});
  }
  sueltaDe(g, avisar) { if (g.candado) this.suelta(g.candado, null, avisar); }
  // el anfitrión abre un cofre en su pantalla: libre o no
  cofreHostAbre(x, y, z) {
    const k = `${x},${y},${z}`, c = this.candados.get(k);
    if (c) return { ok: false, quien: c.nombre };
    this.candados.set(k, { quien: 'host', nombre: this.env.perfil().nombre, t: ahora(), x, y, z });
    return { ok: true };
  }
  cofreHostCierra(x, y, z) { const k = `${x},${y},${z}`, c = this.candados.get(k); if (c && c.quien === 'host') this.candados.delete(k); }
  // ── dormir por votación (v12.15.0): la noche pasa cuando todas las personas presentes están en cama ──
  votoDormir() { const d = this.dentro(), falta = d.filter((g) => !g.cama).length; return { falta, total: d.length + 1, listo: falta === 0 }; }
  anunciaSueno(v) { const t = `🛏 Duermen ${v.total - v.falta} de ${v.total}: faltan ${v.falta} en cama para que amanezca`; this.todos('aviso', { texto: t }); this.env.aviso(t); }
  amanece() { this.todos('amanece', {}); for (const g of this.dentro()) g.cama = false; }

  // el movimiento: el invitado dice dónde está, el anfitrión decide si es posible (velocidadOk). Si no, lo corrige y lo cuenta.
  pos(g, peerId, m) {
    const t = ahora();
    // v12.16.4: la velocidad se mide contra una referencia de al menos 0,15 s atrás. Dos posiciones que llegan pegadas (el relé junta
    // mensajes) dan una velocidad falsa enorme y expulsaban a quien solo volaba.
    if (g.pos && g.ref) {
      const dt = (t - g.refT) / 1000;
      if (dt >= 0.15) {
        const vuela = (m.flags & 4) !== 0 || (g.ref.flags & 4) !== 0;
        if (dt < 5 && !velocidadOk(g.ref, m, dt, vuela)) {
          this.a(peerId, 'corrige', { x: g.pos.x, y: g.pos.y, z: g.pos.z, seq: m.seq });
          g.malas.push(t);
          while (g.malas.length && t - g.malas[0] > VENTANA_CORRECC) g.malas.shift();
          if (g.malas.length >= CORRECCIONES_MAX) this.expulsar(peerId, false, 'ritmo'); // expulsión temporal: puede volver a pedir entrada
          return;
        }
        g.ref = m; g.refT = t;
      }
    } else { g.ref = m; g.refT = t; }
    g.pos = m; g.posT = t;
  }
  // ── criaturas (F4) ──
  // Lo único que la persona invitada puede decir es «le pegué a esa» (golpe): el anfitrión mira que exista, que esté al alcance desde
  // donde SABE que está, que no pegue más rápido de lo posible y calcula el daño con el arma de su ficha (no con lo que diga ella).
  golpeDe(g, m) {
    const t = ahora();
    if (!g.pos || t - (g.golpeT || 0) < GOLPE_MIN_MS) return;
    g.golpeT = t;
    this.env.golpearMob({ id: m.mob, pesado: m.pesado, x: g.pos.x, y: g.pos.y, z: g.pos.z, arma: g.pos.arma, pid: g.pid });
  }
  porPid(pid) { for (const [p, g] of this.gente) if (g.estado === 'dentro' && g.pid === pid) return [p, g]; return null; }
  // el daño a una persona invitada: se manda y lo aplica su juego (con su armadura)
  danar(pid, a, x, z, c, i, armored) {
    const e = this.porPid(pid);
    if (!e) return;
    this.a(e[0], 'dano', { a: Math.min(100, Math.max(0.5, a)), x: Number.isFinite(x) ? x : null, z: Number.isFinite(z) ? z : null, c: String(c || ''), i: !!i, m: armored === 'media' ? 2 : armored ? 1 : 0 });
  }
  // un aviso para todas las personas de la sala (un jefe cayó, un logro del mundo)
  aviso(texto) { if (this.dentro().length) this.todos('aviso', { texto }); }
  // el botín de lo que mató esa persona: va a su mochila (y se le acredita en su cupo para que la foto de la mochila cuadre)
  botin(pid, lista) {
    const e = this.porPid(pid);
    if (!e || !e[1].ficha) return false;
    creditoBotin(e[1].cupo, lista.reduce((s, [, n]) => s + n, 0));
    for (let k = 0; k < lista.length; k += 12) this.a(e[0], 'botin', { l: lista.slice(k, k + 12) });
    return true;
  }
  // a cada persona se le cuentan las criaturas de su alrededor (las más cercanas, hasta MAX_MOBS)
  difundirMobs() {
    for (const [p, g] of this.gente) {
      if (g.estado !== 'dentro' || !g.pos) continue;
      const l = this.env.mobsCerca(g.pos.x, g.pos.z, RADIO_MOBS, MAX_MOBS);
      this.a(p, 'mobs', { l });
    }
  }
  faltaChat(g, peerId) {
    g.faltas++;
    if (g.faltas >= 3) { g.silencioHasta = ahora() + 30000; g.faltas = 0; this.a(peerId, 'chatr', { pid: 0, texto: 'Está en silencio 30 segundos por escribir muy rápido.' }); }
  }
  chatDe(g, texto) {
    if (ahora() < g.silencioHasta) return;
    this.env.chat(`<${g.nombre}> ${texto}`);
    this.todos('chatr', { pid: g.pid, texto });
  }
  // ── construir juntos (F2) ──
  // El invitado pide poner o romper UN bloque. Se valida todo contra el mundo real (alcance desde donde el anfitrión SABE que está,
  // qué bloque hay de verdad, si ese tipo viaja por la red, el soporte); lo que no cuadre se corrige con el bloque verdadero.
  bloque(g, peerId, m) {
    const E = this.env;
    if (!g.pos || !E.puedeEditar() || m.y < 0 || m.y > 127) return;
    const corrige = (id) => { if (id >= 0) this.a(peerId, 'bloques', { b: [[m.x, m.y, m.z, id]] }); };
    const rechaza = (id) => {
      const t = ahora();
      g.rechazos.push(t);
      while (g.rechazos.length && t - g.rechazos[0] > 10000) g.rechazos.shift();
      corrige(id);
      if (g.rechazos.length >= RECHAZOS_MAX) this.expulsar(peerId, false, 'ritmo');
    };
    if (!alcanceOk(g.pos, m.x, m.y, m.z, true)) return rechaza(E.leerSiCargado(m.x, m.y, m.z));
    const actual = E.leer(m.x, m.y, m.z);
    const ok = m.viejo === actual && (m.op === 0
      ? m.id === 0 && puedeRomper(actual)
      : m.id !== 0 && puedePoner(m.id) && esReemplazable(actual, m.id) && apoyoOk(m.id, E.leer(m.x, m.y - 1, m.z)));
    if (!ok) return rechaza(actual);
    const kb = this.clave(m), tPuso = this.puestos.get(kb);
    if (m.op === 0) {
      // M2: romper lo que un invitado puso hace poco no da cupo (si no, poner/romper en bucle fabrica cupo); solo lo que ya estaba en el mundo
      if (tPuso !== undefined && ahora() - tPuso < PUESTO_MIN_MS) this.puestos.delete(kb); else creditoBloque(g.cupo);
    } else {
      if (this.puestos.size >= PUESTOS_MAX) this.puestos.delete(this.puestos.keys().next().value);
      this.puestos.delete(kb); this.puestos.set(kb, ahora());
    }
    E.escribir(m.x, m.y, m.z, m.id); // por la misma función de siempre: la física, la luz y el guardado funcionan igual
  }
  // v13.5.4: un bloque que llegó de más (ráfaga) se descarta sin castigo; al invitado se le dice cómo está de verdad ese bloque para que no se quede con uno que el mundo no tiene
  corregirBloque(peerId, cuerpo, bytes) {
    const r = validar('bloque', cuerpo, bytes, true);
    if (!r.ok || !this.env.leerSiCargado) return;
    const id = this.env.leerSiCargado(r.msg.x, r.msg.y, r.msg.z);
    if (id >= 0) this.a(peerId, 'bloques', { b: [[r.msg.x, r.msg.y, r.msg.z, id]] });
  }
  // el mundo avisa de cada cambio (setBlock): se junta y se difunde en la próxima tanda
  bloqueCambiado(x, y, z, old, id) {
    if (!this.dentro().length) return;
    if (this.cola.size >= COLA_MAX) { this.cola.clear(); this.resincronizar(); return; }
    this.cola.set(`${x},${y},${z}`, [x, y, z, id]);
  }
  difundir() {
    if (!this.cola.size) return;
    const todo = [...this.cola.values()];
    this.cola.clear();
    for (let i = 0; i < todo.length; i += MAX_BLOQUES) this.todos('bloques', { b: todo.slice(i, i + MAX_BLOQUES) });
  }
  // los trozos del mundo con cambios, mandados poco a poco (para no atorar el canal); se pide también al reparar
  mandarMundo(g) { for (const [cx, cz] of this.env.chunksConMods()) this.encolaTrozo(g, cx, cz); }
  resincronizar() { for (const g of this.dentro()) this.mandarMundo(g); }
  encolaTrozo(g, cx, cz) { const k = `${cx},${cz}`; if (!g.envio.has(k) && g.envio.size < TROZOS_COLA_MAX) g.envio.set(k, { cx, cz, off: 0 }); }
  pideTrozos(g, lista) { for (const [cx, cz] of lista) this.encolaTrozo(g, cx, cz); }
  vaciarTrozos() {
    for (const [p, g] of this.gente) {
      if (g.estado !== 'dentro') continue;
      for (let n = 0; n < TROZOS_POR_TIC && g.envio.size; n++) {
        const [k, e] = g.envio.entries().next().value;
        const l = this.env.modsDe(e.cx, e.cz); // se lee de nuevo en cada parte: lo que cambió mientras tanto ya viaja en «bloques»
        this.a(p, 'chunks_dato', { cx: e.cx, cz: e.cz, r: e.off === 0 ? 1 : 0, m: l.slice(e.off, e.off + MAX_TROZO) });
        e.off += MAX_TROZO;
        if (e.off >= l.length) g.envio.delete(k);
      }
    }
  }
  hablar(texto) { // el chat del anfitrión
    const t = textoLimpio(texto, 200);
    if (!t || t.startsWith('/')) return false;
    this.env.chat(`<${this.env.perfil().nombre}> ${t}`);
    this.todos('chatr', { pid: 0, texto: t });
    return true;
  }

  tick(dt) {
    const T = this.t;
    T.jug += dt; T.tiempo += dt; T.bloques += dt; T.guarda += dt; T.mobs += dt;
    if (T.guarda >= GUARDA_CADA) { T.guarda = 0; if (this.sucio && this.env.guardar) { this.volcarTodo(); this.sucio = false; this.env.guardar(); } }
    for (const [k, c] of this.candados) if (c.quien !== 'host' && ahora() - c.t > COFRE_TIEMPO_MAX) this.suelta(k, null, true);
    for (const [p, g] of this.gente) if (g.estado === 'espera' && ahora() - g.esperaT > ESPERA_MAX) { this.rechaza(p, false, 'no-acepta'); if (this.env.cancelaEntrada) this.env.cancelaEntrada(g.userId); }
    if (T.jug >= 1 / HZ_JUG) {
      T.jug = 0;
      const l = this.lista();
      if (this.dentro().length) this.todos('jugadores', { j: l });
      this.env.remotos(l.filter((x) => x.pid !== 0));
    }
    if (T.bloques >= 1 / HZ_BLOQUES) { T.bloques = 0; this.difundir(); this.vaciarTrozos(); }
    if (T.mobs >= 1 / HZ_MOBS) { T.mobs = 0; if (this.dentro().length) this.difundirMobs(); }
    if (T.tiempo >= 1 / HZ_TIEMPO) { T.tiempo = 0; if (this.dentro().length) this.todos('tiempo', this.env.tiempo()); }
  }
  cerrar() {
    if (!this.cerrada) {
      this.todos('expulsa', { motivo: 'cierre' });
      for (const g of this.dentro()) this.sueltaDe(g, false);
      for (const g of this.dentro()) { this.volcar(g); if (g.ficha) g.ficha.estado = 'fuera'; }
      if (this.env.guardar) this.env.guardar();
    }
    super.cerrar();
  }
}

// ───────────────────────────── invitado ─────────────────────────────
export class Invitado extends Base {
  constructor(canal, env, anfitrionId) {
    super(canal, env);
    this.rol = 'invitado'; this.anfitrionId = anfitrionId; this.pid = -1; this.estado = 'buscando'; this.mundo = null;
    this.rev = -1; this.invSucio = false; // la versión de la ficha que dio el anfitrión (-1: aún no llega) y si la mochila cambió
    this.pend = []; this.pendPor = new Map(); this.fichas = 20; this.fichaT = ahora(); this.reparoPronto = false; // cambios locales por mandar, ficha de ritmo y si toca pedir el estado de los trozos
    this.alResultado = null; // la pantalla de unirse: (ok, dato) cuando el anfitrión contesta
    canal.alEntrar((userId) => { if (userId === anfitrionId && this.estado === 'buscando') this.saludar(); });
    canal.alSalir((userId) => { if (userId === anfitrionId && !this.cerrada) this.fin('anfitrion-salio'); });
    // al volver a la pestaña (o tras un corte) se pide el estado de los trozos de alrededor: repara lo que se haya perdido
    this.alVolver = () => { if (typeof document !== 'undefined' && !document.hidden) this.reparoPronto = true; };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', this.alVolver);
  }
  cerrar() { if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.alVolver); super.cerrar(); }
  saludar() {
    this.estado = 'esperando';
    const p = this.env.perfil();
    this.canal.enviar('nb.hola', { v: PROTOCOL_VERSION, g: this.env.version, nombre: p.nombre, cuerpo: p.cuerpo }, this.anfitrionId);
  }
  fin(motivo) {
    const antes = this.estado;
    this.estado = 'fuera';
    if (this.alResultado && antes !== 'dentro') this.alResultado(false, motivo); else this.env.cerro(motivo);
    this.cerrar();
  }

  recibe(tipo, cuerpo, bytes, { userId }) {
    if (userId !== this.anfitrionId) return; // solo el anfitrión habla: nada entre invitados
    if (!['acepta', 'rechazo', 'jugadores', 'corrige', 'tiempo', 'chatr', 'expulsa', 'bloques', 'chunks_dato', 'ficha', 'mobs', 'dano', 'botin', 'aviso', 'cofre', 'cofre_no', 'cofre_suelta', 'amanece'].includes(tipo)) return;
    const r = validar(tipo, cuerpo, bytes, true);
    if (!r.ok) return;
    const m = r.msg;
    if (tipo === 'rechazo' || tipo === 'expulsa') return this.fin(m.motivo);
    if (tipo === 'acepta') {
      if (this.estado !== 'esperando') return;
      // v13.1.0: un anfitrión con un generador de terreno más nuevo que el de este juego: no se entra (el terreno saldría distinto)
      if (m.mundo.genVersion > GEN_MAX) { if (this.alResultado) this.alResultado(false, 'gen-nueva'); return; }
      this.estado = 'dentro'; this.pid = m.pid; this.mundo = m.mundo;
      if (this.alResultado) this.alResultado(true, m);
      return;
    }
    if (this.estado !== 'dentro') return;
    if (tipo === 'ficha') { this.rev = m.rev; this.invSucio = false; this.t.inv = 0; this.env.aplicarFicha(m); return; }
    if (tipo === 'jugadores') this.env.remotos(m.j.filter((x) => x.pid !== this.pid));
    else if (tipo === 'corrige') this.env.teleport(m.x, m.y, m.z);
    else if (tipo === 'tiempo') this.env.aplicarTiempo(m);
    else if (tipo === 'mobs') this.env.aplicarMobs(m.l);
    else if (tipo === 'dano') this.env.recibirDano(m);
    else if (tipo === 'botin') this.env.recibirBotin(m.l);
    else if (tipo === 'aviso') this.env.aviso(m.texto);
    else if (tipo === 'cofre') this.env.abrirCofre(m);
    else if (tipo === 'cofre_no') this.env.cofreNo(m);
    else if (tipo === 'cofre_suelta') this.env.cofreSuelto();
    else if (tipo === 'amanece') this.env.amanece();
    else if (tipo === 'bloques') this.env.aplicarBloques(m.b);
    else if (tipo === 'chunks_dato') this.env.aplicarMods(m.cx, m.cz, m.m, m.r === 1);
    else if (tipo === 'chatr') this.env.chat(m.pid === 0 && m.texto.startsWith('Está en silencio') ? m.texto : `<${this.env.nombreDe(m.pid)}> ${m.texto}`);
  }
  hablar(texto) {
    const t = textoLimpio(texto, 200);
    if (!t || t.startsWith('/') || this.estado !== 'dentro') return false;
    this.canal.enviar('nb.chat', { texto: t }, this.anfitrionId);
    return true;
  }
  // un cambio hecho aquí (el mundo lo avisa): se predice en el momento y se manda como intención; el anfitrión confirma o corrige
  bloqueCambiado(x, y, z, old, id) {
    if (this.estado !== 'dentro') return;
    // v13.5.4: varios cambios al mismo bloque se juntan en uno (queda el último, contra el bloque de antes del primero) y una ráfaga larga espera su turno en la cola
    const k = `${x},${y},${z}`, e = this.pendPor.get(k);
    if (e) { e.id = id; return; }
    if (this.pend.length >= PEND_MAX) { this.pend.length = 0; this.pendPor.clear(); this.reparoPronto = true; return; } // un estallido enorme: se repara pidiendo el estado
    const p = { x, y, z, id, viejo: old, k };
    this.pend.push(p); this.pendPor.set(k, p);
  }
  marcarInv() { this.invSucio = true; }
  pedirCofre(x, y, z) { if (this.estado === 'dentro') this.canal.enviar('nb.cofre_abre', { x, y, z }, this.anfitrionId); }
  // al cerrar: primero la foto de la mochila (para que el anfitrión sepa qué se llevó o dejó) y luego cómo quedó el cofre
  cerrarCofre(x, y, z, slots) {
    if (this.estado !== 'dentro') return;
    const foto = this.env.miFoto();
    if (foto && this.rev >= 0) { this.t.inv = 0; this.invSucio = false; this.canal.enviar('nb.inv', { rev: this.rev, inv: foto.inv, vital: foto.vital }, this.anfitrionId); }
    this.canal.enviar('nb.cofre_cierra', { x, y, z, slots }, this.anfitrionId);
  }
  cama(en) { if (this.estado === 'dentro' && !!this.enCama !== !!en) { this.enCama = !!en; this.canal.enviar('nb.cama', { en: en ? 1 : 0 }, this.anfitrionId); } }
  // le pegó a una criatura (un títere): se lo dice al anfitrión, que decide si fue y cuánto daño hizo
  golpear(id, pesado) { if (this.estado === 'dentro') this.canal.enviar('nb.golpe', { mob: id, pesado: !!pesado }, this.anfitrionId); }
  reparar() { const c = this.env.chunksCerca(); if (c.length) this.canal.enviar('nb.chunks_pide', { c }, this.anfitrionId); }
  tick(dt) {
    if (this.estado !== 'dentro') return;
    // v13.5.4: el ritmo se mide con el reloj de verdad (no con el dt del juego: si el juego avanza más rápido que el reloj, el anfitrión lo vería como inundación)
    const t = ahora(), real = Math.min(1, Math.max(0, (t - this.fichaT) / 1000)); this.fichaT = t;
    this.fichas = Math.min(20, this.fichas + real * RITMO_BLOQUES); // por debajo de lo que tolera el anfitrión (20 por segundo)
    while (this.pend.length && this.fichas >= 1) {
      const p = this.pend.shift(); this.pendPor.delete(p.k);
      if (p.id === p.viejo) continue; // se puso y se quitó: no hay nada que mandar
      this.fichas--;
      this.canal.enviar('nb.bloque', { op: p.id === 0 ? 0 : 1, x: p.x, y: p.y, z: p.z, id: p.id, cara: 0, viejo: p.viejo, seq: this.seq = (this.seq + 1) & 0xffff }, this.anfitrionId);
    }
    this.t.repara += dt;
    // v12.16.4: al explorar se piden los trozos de alrededor al cambiar de zona, nunca más de uno cada 3 s (en cola, no en ráfaga)
    if (this.t.repara >= 3 && !this.reparoPronto) { const p = this.env.miPos(), cx = Math.floor(p.x / 16), cz = Math.floor(p.z / 16), u = this.ultimoPedido; if (!u || Math.max(Math.abs(cx - u[0]), Math.abs(cz - u[1])) >= 3) this.reparoPronto = true; }
    if ((this.t.repara >= 30 || this.reparoPronto) && !this.pend.length) { this.t.repara = 0; this.reparoPronto = false; const p = this.env.miPos(); this.ultimoPedido = [Math.floor(p.x / 16), Math.floor(p.z / 16)]; this.reparar(); }
    // v12.13.0: la foto de la mochila y de las constantes vitales, cuando cambian (cada 0,5 s como mucho) o cada 5 s; solo ya con la ficha
    this.t.inv += dt;
    if (this.rev >= 0 && ((this.invSucio && this.t.inv >= 0.5) || this.t.inv >= 5)) {
      const foto = this.env.miFoto();
      if (foto) { this.t.inv = 0; this.invSucio = false; this.canal.enviar('nb.inv', { rev: this.rev, inv: foto.inv, vital: foto.vital }, this.anfitrionId); }
    }
    this.t.pos += dt;
    if (this.t.pos >= 1 / HZ_POS) { this.t.pos = 0; this.canal.enviar('nb.pos', { seq: this.seq = (this.seq + 1) & 0xffff, ...this.env.miPos() }, this.anfitrionId); }
  }
}

// ───────────────────────────── abrir ─────────────────────────────
const conTiempo = (p, ms, code) => { let t; return Promise.race([p, new Promise((_, rej) => { t = setTimeout(() => rej({ code }), ms); })]).finally(() => clearTimeout(t)); };

// crea la sala: devuelve la sesión de anfitrión con su código
export async function crearSala(env, { turn = [] } = {}) {
  const sala = salaNueva(), clave = claveNueva();
  let canal;
  try {
    canal = await abrirSala({ roomId: sala, clave, anfitrion: true, turn });
    await conTiempo(canal.ready, BUSCA_MAX, 'sin-red');
  } catch (e) { if (canal) canal.salir(); throw { code: (e && e.code) || 'sin-red' }; }
  const s = new Anfitrion(canal, env, armarCodigo(sala, canal.userId, clave));
  canal.alError((e) => { if (e.code === 'relay-failed') env.aviso('Los servidores de salas están lentos…'); });
  return s;
}

// entra a una sala: busca al anfitrión (hasta 20 s) y espera su respuesta. Devuelve { sesion, acepta } o lanza { code }.
export async function unirseSala(env, c, { turn = [], cancelar } = {}) {
  let ultimo = 'sin-red';
  for (const respaldo of [false, true]) {
    let canal;
    try {
      canal = await abrirSala({ roomId: c.roomId, clave: c.clave, anfitrion: false, turn, respaldo });
      await conTiempo(canal.ready, BUSCA_MAX, 'sin-red');
    } catch (e) { if (canal) canal.salir(); ultimo = (e && e.code) || 'sin-red'; continue; } // se reintenta una vez con los relés de respaldo
    const s = new Invitado(canal, env, c.userId);
    const res = await new Promise((listo) => {
      let hecho = false;
      const fin = (ok, dato) => { if (hecho) return; hecho = true; clearInterval(iv); clearTimeout(t1); clearTimeout(t2); listo({ ok, dato }); };
      s.alResultado = fin;
      canal.alError((e) => { if (['decrypt-failed', 'room-full', 'banned'].includes(e.code)) fin(false, e.code); });
      const t1 = setTimeout(() => { if (s.estado === 'buscando') fin(false, 'no-sala'); }, BUSCA_MAX); // el anfitrión no apareció
      const t2 = setTimeout(() => fin(false, 'sin-respuesta'), BUSCA_MAX + ESPERA_MAX);
      const iv = setInterval(() => { if (cancelar && cancelar()) fin(false, 'cancelado'); }, 200);
    });
    s.alResultado = null;
    if (res.ok) return { sesion: s, acepta: res.dato };
    s.cerrar();
    // sin red de relés conviene probar con la lista de respaldo; el resto de motivos no mejora con otra lista
    if (['no-sala', 'sin-red'].includes(res.dato) && !respaldo) { ultimo = res.dato; continue; }
    throw { code: res.dato };
  }
  throw { code: ultimo };
}
