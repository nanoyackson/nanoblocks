// El transporte (v12.11.0): ÚNICO archivo que importa Trystero 0.27.0 (Nostr para encontrarse, WebRTC para hablar). Va en su propio
// trozo «red» con import dinámico: el juego sin red nunca lo descarga. No sabe nada del juego: solo abre la sala y mueve mensajes
// ya serializados; lo que llega lo entrega con el userId verificado (el remitente NUNCA se lee del cuerpo, ESPEC §3.1).
import { APP_ID } from './codigo.js';
import { TOPE_BYTES } from './validar.js';

// mensajes de la espec (§3). Los del anfitrión llevan roles:['admin']: Trystero verifica su certificado, un invitado no puede mandarlos.
export const DEL_ANFITRION = ['nb.acepta', 'nb.rechazo', 'nb.jugadores', 'nb.corrige', 'nb.tiempo', 'nb.chatr', 'nb.expulsa', 'nb.bloques', 'nb.chunks_dato', 'nb.ficha', 'nb.mobs', 'nb.dano', 'nb.botin', 'nb.aviso', 'nb.cofre', 'nb.cofre_no', 'nb.cofre_suelta', 'nb.amanece'];
export const DEL_INVITADO = ['nb.hola', 'nb.pos', 'nb.chat', 'nb.salud', 'nb.bloque', 'nb.chunks_pide', 'nb.inv', 'nb.golpe', 'nb.cofre_abre', 'nb.cofre_cierra', 'nb.cama'];
export const MAX_JUGADORES = 6;
// si el grupo de relés por defecto no contesta, se reintenta una vez con esta lista (ESPEC §2.2, probados 28/30)
export const RELES_RESPALDO = ['wss://fanfares.nostr1.com', 'wss://no.str.cr', 'wss://nostr.azzamo.net', 'wss://nostr.hifish.org', 'wss://nostr.liberty.fans', 'wss://relay.primal.net', 'wss://relay.snort.social', 'wss://relay.nostr.net', 'wss://relay.ditto.pub'];

const LLAVE = 'nanoblocks.red.llave';
// cada pestaña puede tener su propio «perfil de red» (sessionStorage nb.perfilRed): sirve para probar anfitrión e invitado en el mismo
// navegador sin chocar de userId. Sin perfil, todas las pestañas comparten la llave, y por eso una segunda pestaña se rechaza.
function claveAlmacen() {
  let p = '';
  try { p = sessionStorage.getItem('nb.perfilRed') || ''; } catch { /* sin sessionStorage */ }
  return p ? `${LLAVE}.${p}` : LLAVE;
}
async function cargarIdentidad(T) {
  const k = claveAlmacen();
  try {
    const g = localStorage.getItem(k);
    if (g) return await T.importUserIdentity(g);
  } catch { /* llave dañada: se hace otra */ }
  const id = await T.createUserIdentity();
  try { localStorage.setItem(k, T.exportUserIdentity(id)); } catch { /* sin localStorage: identidad de esta sesión */ }
  return id;
}

// TURN opcional: la clave de Open Relay (Metered) la pone cada anfitrión en Ajustes; se pide la lista de servidores y se pasa tal cual.
export async function pedirTurn(clave) {
  const k = String(clave || '').trim();
  if (!/^[\w-]{8,64}$/.test(k)) return [];
  try {
    const r = await fetch(`https://openrelay.metered.ca/api/v1/turn/credentials?apiKey=${encodeURIComponent(k)}`, { cache: 'no-store' });
    if (!r.ok) return [];
    const l = await r.json();
    return Array.isArray(l) ? l.filter((s) => s && typeof s.urls !== 'undefined').map((s) => ({ urls: s.urls, username: s.username, credential: s.credential })) : [];
  } catch { return []; }
}

// abre la sala. Devuelve un «canal» con lo mínimo que usa la sesión.
//   anfitrion: true → sala nueva (roomId = sala base); false → roomId = sala~userIdAnfitrion
export async function abrirSala({ roomId, clave, anfitrion, turn = [], respaldo = false }) {
  const T = await import('trystero');
  const identity = await cargarIdentidad(T);
  const config = {
    appId: APP_ID, identity, maxUsers: MAX_JUGADORES, password: clave, maxReceiveBytes: TOPE_BYTES,
    use: [T.roles(anfitrion ? { selfAsAdmin: true } : undefined)],
    relayConfig: respaldo ? { urls: RELES_RESPALDO, redundancy: 4, warnOnRelayFailure: false } : { redundancy: 6, warnOnRelayFailure: false },
  };
  if (turn.length) config.turnConfig = turn;
  const room = T.joinRoom(config, roomId);

  const oyentes = { msg: [], entra: [], sale: [], error: [] };
  const presentes = new Map(); // peerId → userId: quien ya estaba cuando se registra el oyente también cuenta
  const cola = []; // mensajes llegados antes de que alguien los escuche
  const acciones = {};
  for (const n of [...DEL_ANFITRION, ...DEL_INVITADO]) {
    const admin = DEL_ANFITRION.includes(n);
    const a = room.makeAction(n, admin ? { roles: ['admin'] } : undefined);
    a.onReceive((ctx) => ctx.byteLength <= TOPE_BYTES);
    a.onMessage((data, ctx) => { const c = { userId: ctx.userId, peerId: ctx.peerId }; if (!oyentes.msg.length) { if (cola.length < 50) cola.push([n, data, c]); return; } for (const f of oyentes.msg) f(n, data, c); });
    acciones[n] = a;
  }
  room.onPeerJoin((c) => { presentes.set(c.peerId, c.userId); for (const f of oyentes.entra) f(c.userId, c.peerId); });
  room.onPeerLeave((c) => { presentes.delete(c.peerId); for (const f of oyentes.sale) f(c.userId, c.peerId); });
  room.onError((e) => { for (const f of oyentes.error) f(e); });

  return {
    userId: identity.userId,
    ready: room.ready,
    // anfitrión: sin destino = a todos los invitados; con destino = un peerId (o userId). Invitado: siempre con destino (el anfitrión)
    enviar(tipo, cuerpo, destino) { return acciones[tipo].send(cuerpo, destino ? { target: destino } : undefined).catch(() => {}); },
    alMensaje: (f) => { oyentes.msg.push(f); for (const [n, d, c] of cola.splice(0)) f(n, d, c); },
    alEntrar: (f) => { oyentes.entra.push(f); for (const [p, u] of presentes) f(u, p); },
    alSalir: (f) => oyentes.sale.push(f),
    alError: (f) => oyentes.error.push(f),
    expulsar: (userId, motivo) => (room.ban ? room.ban(userId, { reason: motivo || 'expulsado' }) : Promise.resolve()),
    gente: () => Object.keys(room.getPeers()).length,
    salir: () => { try { return room.leave(); } catch { return undefined; } },
  };
}
