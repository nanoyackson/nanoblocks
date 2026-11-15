// v13.1.0 (C1 de cuevas): (1) los mundos de generador 21 o menos salen IDÉNTICOS a como salían antes del rediseño (huella FNV de columnas
// completas, calculada con el código de la v13.0.5); (2) el generador 22 es determinista y no usa Math.random (los invitados generan el
// terreno en su máquina); (3) 22 sí cambia las cuevas. Uso: node tools/revisar-cuevas.mjs
import { Generator } from '../src/worldgen.js';
import { GEN_CUEVAS } from '../src/worldgen2.js';
import { Invitado, palabrasDeError } from '../src/red/sesion.js';
import { GEN_MAX } from '../src/version.js';

const HUELLAS_ANTES = { '123457/21': '0x48c9dfa5', '777/21': '0x753b2474', '2026/17': '0xa0ba7f93' }; // calculadas con el código de la v13.0.5
function huella(seed, ver, cx0 = -3, cz0 = -3, n = 6) {
  const gen = new Generator(seed, ver);
  const buf = new Uint16Array(16 * 16 * 128);
  let h = 2166136261 >>> 0;
  for (let cz = cz0; cz < cz0 + n; cz++) for (let cx = cx0; cx < cx0 + n; cx++) {
    buf.fill(0); gen.generate(cx, cz, buf, null);
    for (let i = 0; i < buf.length; i++) { h ^= buf[i]; h = Math.imul(h, 16777619) >>> 0; }
  }
  return '0x' + h.toString(16);
}
let fallas = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fallas++; };

for (const k of Object.keys(HUELLAS_ANTES)) {
  const [s, v] = k.split('/').map(Number);
  const h = huella(s, v);
  ok(h === HUELLAS_ANTES[k], `mundo ${v} (semilla ${s}) idéntico a antes del rediseño: ${h}${h === HUELLAS_ANTES[k] ? '' : ' (esperaba ' + HUELLAS_ANTES[k] + ')'}`);
}
ok(GEN_CUEVAS === 22, 'GEN_CUEVAS = 22');
const aleat = Math.random; let usos = 0; Math.random = () => { usos++; return aleat(); };
const a = huella(123457, 22), b = huella(123457, 22);
Math.random = aleat;
ok(usos === 0, `el generador 22 no usa Math.random (${usos} usos)`);
ok(a === b, `generador 22 determinista: ${a} = ${b}`);
ok(a !== huella(123457, 21), 'el generador 22 cambia las cuevas respecto al 21');
// red: un anfitrión con un generador MÁS NUEVO que el del cliente se rechaza con un mensaje claro; uno igual o menor entra
ok(GEN_MAX >= GEN_CUEVAS, `GEN_MAX (${GEN_MAX}) cubre GEN_CUEVAS`);
function entrada(genVersion) {
  const canal = { alMensaje() {}, alError() {}, alEntrar() {}, alSalir() {}, salir() {} };
  const env = { aplicarFicha() {}, remotos() {}, teleport() {}, aplicarTiempo() {}, aplicarMobs() {}, recibirDano() {}, recibirBotin() {}, aviso() {} };
  const s = new Invitado(canal, env, 'yo'); s.anfitrionId = 'anf'; s.estado = 'esperando';
  let res = null; s.alResultado = (okk, dato) => { res = { okk, dato }; };
  const mundo = { nombre: 'M', seed: 5, genVersion, tipo: 'normal', dificultad: 'normal', modo: 'survival', dim: 'tierra', dia: 1, hora: 0.3, spawn: { x: 0, y: 70, z: 0 } };
  s.recibe('acepta', { pid: 1, mundo, j: [] }, 300, { userId: 'anf' });
  return { res, estado: s.estado };
}
const nueva = entrada(GEN_MAX + 1), igual = entrada(GEN_MAX), vieja = entrada(21);
ok(nueva.res && nueva.res.okk === false && nueva.res.dato === 'gen-nueva' && nueva.estado !== 'dentro', 'anfitrión con generador más nuevo: se rechaza con gen-nueva y no se entra');
ok(/Actualice el juego: recargue la página/.test(palabrasDeError({ code: 'gen-nueva' })), 'el mensaje dice «Actualice el juego: recargue la página»');
ok(igual.res && igual.res.okk === true && vieja.res && vieja.res.okk === true, 'anfitrión con generador igual o más viejo (21): entra');
process.exitCode = fallas ? 1 : 0;
console.log(fallas ? `\n✘ ${fallas} falla(s)` : '\nCuevas: todo bien.');
