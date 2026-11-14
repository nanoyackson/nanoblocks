// El código de sala (ESPEC_PWA_MULTIJUGADOR §2.4, v12.11.0). Funciones PURAS (se prueban en Node: tools/revisar-red.mjs).
// Formato: NB1.<sala 22 base62>~<userId del anfitrión 22 base62>.<clave 10 en base32 Crockford>
// La clave NO viaja por la red: es la contraseña con que Trystero cifra la señalización. El userId es el del anfitrión, para que el
// invitado verifique que el que responde es de verdad quien creó la sala (plugin roles()).
const B62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford: sin I, L, O, U
export const APP_ID = 'nanoblocks-nanoyackson';

function azar(n, alfabeto, rnd) {
  const b = new Uint8Array(n);
  rnd(b);
  let s = '';
  const tope = 256 - (256 % alfabeto.length); // sin sesgo: se descartan los bytes que no caben
  for (let i = 0; i < n; i++) { let v = b[i]; while (v >= tope) { const c = new Uint8Array(1); rnd(c); v = c[0]; } s += alfabeto[v % alfabeto.length]; }
  return s;
}
const aleatorio = (b) => globalThis.crypto.getRandomValues(b);
export const salaNueva = (rnd = aleatorio) => azar(22, B62, rnd);
export const claveNueva = (rnd = aleatorio) => azar(10, B32, rnd);

export const armarCodigo = (sala, userId, clave) => `NB1.${sala}~${userId}.${clave}`;
export const enlaceDe = (codigo, base) => `${base}#sala=${codigo}`;

// la clave se escribe a mano: mayúsculas, sin guiones ni espacios, y las confusiones típicas (I, L → 1; O → 0)
const limpiaClave = (c) => c.toUpperCase().replace(/[\s-]/g, '').replace(/[IL]/g, '1').replace(/O/g, '0');
const RE = /^NB1\.([0-9A-Za-z]{22})~([0-9A-Za-z]{22})\.([0-9A-Za-z-]{10,14})$/;

// acepta el código pelado o un enlace con #sala=…; devuelve { ok, sala, userId, clave, roomId } o { ok:false, motivo }
export function leerCodigo(texto) {
  if (typeof texto !== 'string' || texto.length > 400) return { ok: false, motivo: 'formato' };
  let t = texto.trim();
  const i = t.indexOf('#sala=');
  if (i >= 0) t = t.slice(i + 6);
  t = t.replace(/\s+/g, '');
  const m = RE.exec(t);
  if (!m) return { ok: false, motivo: 'formato' };
  const clave = limpiaClave(m[3]);
  if (!/^[0-9A-HJKMNP-TV-Z]{10}$/.test(clave)) return { ok: false, motivo: 'clave' };
  return { ok: true, sala: m[1], userId: m[2], clave, roomId: `${m[1]}~${m[2]}` };
}

// la clave se muestra en grupos para leerla por teléfono: NB1.….ABCDE-FGHJK
export const claveBonita = (c) => `${c.slice(0, 5)}-${c.slice(5)}`;
