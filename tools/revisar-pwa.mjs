// v13.2.1: la actualización automática (src/pwa.js). Sin navegador: la lógica de decidir (solo se aplica sola en el menú, nunca con un mundo
// abierto ni con invitados, ni dos veces con la misma versión), el intervalo de búsqueda, que el SW generado contesta «version» y que ui.js
// lo tiene todo enlazado (guardar antes de recargar, aplicar al volver al menú). La prueba con dos builds de verdad se hace en el navegador.
// Uso: node tools/revisar-pwa.mjs
import fs from 'node:fs';
import { decidir, INTERVALO_BUSCAR } from '../src/pwa.js';

let fallas = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fallas++; };
const base = { hayNueva: true, version: '13.2.1', intento: '', mundoAbierto: false, aplazada: false };

ok(decidir({ ...base, hayNueva: false }) === 'nada', 'sin versión nueva esperando: nada');
ok(decidir(base) === 'aplicar', 'en el menú, con una versión nueva: se aplica sola');
ok(decidir({ ...base, mundoAbierto: true }) === 'avisar', 'con un mundo abierto: solo el aviso fijo (nunca recarga a media partida)');
ok(decidir({ ...base, mundoAbierto: true, intento: '9.9.9' }) === 'avisar', 'con un mundo abierto y un intento viejo: sigue avisando');
ok(decidir({ ...base, aplazada: true }) === 'avisar', 'un anfitrión que salió con invitados: solo avisa');
ok(decidir({ ...base, intento: '13.2.1' }) === 'avisar', 'sin bucles: la misma versión ya intentada no se vuelve a aplicar sola');
ok(decidir({ ...base, intento: '13.2.0' }) === 'aplicar', 'una versión más nueva que la ya intentada sí se aplica');
ok(decidir({ ...base, version: '', intento: 'nueva' }) === 'avisar' && decidir({ ...base, version: '' }) === 'aplicar', 'si el SW no dice su versión, «nueva» hace de marca para no repetir');
// sin bucle de principio a fin: se aplica, se marca el intento, y la siguiente decisión con la misma versión ya no aplica
let intento = '', aplicaciones = 0;
for (let i = 0; i < 5; i++) { if (decidir({ ...base, intento }) === 'aplicar') { aplicaciones++; intento = base.version; } }
ok(aplicaciones === 1, `cinco revisiones seguidas con la misma versión: ${aplicaciones} aplicación automática`);
ok(INTERVALO_BUSCAR === 15 * 60 * 1000, 'se busca versión nueva cada 15 minutos');

const pwa = fs.readFileSync(new URL('../src/pwa.js', import.meta.url), 'utf8');
ok(/window\.addEventListener\('focus', buscar\)/.test(pwa) && /visibilitychange/.test(pwa) && /\n {4}buscar\(\);/.test(pwa), 'busca al arrancar, al volver a la pestaña y al volver a la ventana');
ok(/sessionStorage\.setItem\(K_INTENTO/.test(pwa) && /marcarIntento\(versionNueva/.test(pwa), 'la versión ya intentada se guarda en sessionStorage antes de activar');
{ const cc = pwa.slice(pwa.indexOf("'controllerchange'")); const m = cc.indexOf('mundoAbierto()'), r = cc.indexOf('recargar()');
  ok(m > 0 && r > m && /cambio = true/.test(cc.slice(m, r)) && /cambio && !conInvitados/.test(pwa), 'v13.2.3: con un mundo abierto controllerchange NUNCA recarga (aviso fijo; se recarga al salir al menú); sin mundo sí'); }
ok(/redundant/.test(pwa), 'si el SW nuevo falla o lo reemplaza otro, el juego sigue con el viejo (sin error)');
const sw = fs.readFileSync(new URL('./generar-sw.mjs', import.meta.url), 'utf8');
ok(/e\.data === 'version'/.test(sw) && /postMessage\(VERSION\)/.test(sw) && /e\.data === 'activar'/.test(sw), 'el service worker contesta «version» y sigue activándose con «activar»');
const ui = fs.readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
ok(/pwa\.enlazar\(\{ mundoAbierto/.test(ui) && /guardar: async/.test(ui), 'ui.js le dice a pwa.js cuándo hay un mundo abierto y cómo guardarlo');
ok(/pwa\.salioDelMundo\(gente > 0\)/.test(ui) && /await this\.game\.stop\(\);\n {4}this\.show\('menu'\);\n {4}pwa\.salioDelMundo/.test(ui), 'al volver al menú (ya guardado por stop()) se aplica la versión nueva; un anfitrión con invitados solo recibe el aviso');
ok(/id="aviso-pwa"/.test(fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8')) && /Actualizando\$\{v \?/.test(ui), 'el aviso fijo «Actualizar ahora» y el «Actualizando a la versión X…» existen');
process.exitCode = fallas ? 1 : 0;
console.log(fallas ? `\n✘ ${fallas} falla(s)` : '\nActualización automática: todo bien.');
