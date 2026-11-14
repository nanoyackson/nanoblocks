// Revisa cómo clasifica el locutor los avisos del juego (v11.10.1). Lo urgente interrumpe, se salta el tope por minuto y sale en
// plena pelea: si la adivinanza por texto marca de más, el locutor deja de servir. Uso: node tools/revisar-avisos.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { clasificar } from '../src/locutor.js';

const dir = fileURLToPath(new URL('../src/', import.meta.url));
const textos = [];
for (const f of readdirSync(dir).filter((x) => x.endsWith('.js') && !['version.js', 'ayuda.js'].includes(x))) {
  const t = readFileSync(dir + f, 'utf8');
  for (const m of t.matchAll(/toast\(\s*'((?:[^'\\]|\\.)+)'\s*(?:,\s*[^,)]+)?(?:,\s*([^)]+))?\)/g)) textos.push({ f, txt: m[1], marcado: (m[2] || '').trim() });
}
const cuenta = {}, urgentes = [];
for (const x of textos) {
  const c = /urgente/.test(x.marcado) ? 'urgente' : /'(\w+)'|cat: '(\w+)'/.test(x.marcado) ? (x.marcado.match(/'(\w+)'/) || [])[1] : clasificar(x.txt);
  cuenta[c] = (cuenta[c] || 0) + 1;
  if (c === 'urgente') urgentes.push(`${x.f}: ${x.txt.slice(0, 90)}`);
}
console.log(`${textos.length} avisos literales:`, cuenta);
console.log('Urgentes:\n  ' + urgentes.join('\n  '));
const malos = urgentes.filter((u) => /\bya\b/.test(u) && !/\bYA\b/.test(u));
if (urgentes.length > 50 || malos.length) { console.log(`\n¡Ojo! ${urgentes.length} urgentes (tope 50); con «ya» en minúscula: ${malos.length}`); process.exitCode = 1; }

// v12.8.1 (fase 2 de los jefes, PREPARACION_C5_Y_JEFES_F2.md §3.2.4): cada jefe del cuadro de la fase 2 tiene al menos un aviso
// (avisoCaida, avisoEmbestida, anilloAviso, brilloAmago o brilloRojo) en el archivo donde pelea
const AVISOS_POR_JEFE = {
  terciopelo_reina: 'armas2.js', cocodrilo_gigante: 'fauna.js', mono_congo_gigante: 'monocongo.js', reina_bananera: 'jefes2.js',
  cascabel_rey: 'jefes3.js', escarabajo_hercules: 'jefes2.js', sapo_tata: 'jefes3.js', cangrejo_rey: 'jefes3.js', ciempies_rey: 'jefes3.js',
  rey_murcielago: 'caverna.js', jefa_ventanilla: 'archivo.js', senor_arenal: 'inframundo.js', arpia: 'arpia.js', rey_zopilote: 'final.js',
};
const AVISO = /\b(avisoCaida|avisoEmbestida|anilloAviso|brilloAmago|brilloRojo)\(/;
// v12.8.4 (decimoséptima revisión, punto 2): el tramo B también (sus archivos ya tenían avisos viejos y la prueba los daba por hechos)
const PENDIENTES = new Set(); // v12.16.0: el tramo C ya está; los tramos A y B también
const sinAviso = Object.entries(AVISOS_POR_JEFE).filter(([k, f]) => !PENDIENTES.has(k) && !AVISO.test(readFileSync(dir + f, 'utf8')));
console.log(`Pendientes (tramo C): ${[...PENDIENTES].join(', ')}`);
console.log(sinAviso.length ? `\nJefes sin aviso en su archivo: ${sinAviso.map(([k, f]) => `${k} (${f})`).join(', ')}` : `\nLos ${Object.keys(AVISOS_POR_JEFE).length - PENDIENTES.size} jefes de la fase 2 que ya están tienen su aviso.`);
if (sinAviso.length) process.exitCode = 1;

// v12.8.7 (fase 2B): no basta con que el archivo tenga ALGÚN aviso (jefes3.js tiene cuatro jefes): cada ataque del tramo B tiene el suyo
const ATAQUES_B = [
  ['Reina: la nube', 'jefes2.js', /D\.nube -= dt;\s*\n\s*anilloAviso\(g, b\.pos\.x, b\.pos\.y, b\.pos\.z, 4\.5, dt, m, COLOR_AVISO\.verde\)/],
  ['Cascabel: el escupitajo se para', 'jefes3.js', /damagePlayer\(2, m\.body\.pos\.x, m\.body\.pos\.z, 'El escupitajo de la Cascabel'/],
  ['Don Cornudo: trabado', 'jefes2.js', /D\.trabado = true/],
  ['Tata: una masticada', 'jefes3.js', /'Masticada del Tata Sapo', true, true\);\s*\n\s*g\.addEffect\('mareo', 5\);/],
  ['Cangrejo: el carril del chorro', 'jefes3.js', /D\.chorroPre = 0\.6;\s*\n\s*avisoEmbestida\(/],
  ['Ciempiés: el anillo del salto', 'jefes3.js', /if \(A\.t <= 0\.8\) anilloAviso\(/],
];
const faltaB = ATAQUES_B.filter(([, f, re]) => !re.test(readFileSync(dir + f, 'utf8'))).map(([n]) => n);
console.log(faltaB.length ? `\n✘ Ataques del tramo B sin su aviso: ${faltaB.join(', ')}` : `Los ${ATAQUES_B.length} ataques del tramo B tienen su aviso.`);
if (faltaB.length) process.exitCode = 1;

// v12.16.0 (fase 2C): cada ataque del tramo C tiene el suyo
const ATAQUES_C = [
  ['Murciélago Rey: carril de la picada', 'caverna.js', /d\.pre = 0\.7;[^\n]*\n\s*avisoEmbestida\(/],
  ['Murciélago Rey: se cansa', 'caverna.js', /d\.cansa = 3;/],
  ['Jefa: sellazo dorado que se para', 'archivo.js', /COLOR_AVISO\.dorado[\s\S]*g\.blocking/],
  ['Jefa: sellazo doble rojo', 'archivo.js', /M\.doble \? COLOR_AVISO\.rojo/],
  ['Señor: círculo de la bomba', 'inframundo.js', /avisoCaida\(g, tx, pl\.y, tz,/],
  ['Señor: anillo de la onda', 'inframundo.js', /avisoCaida\(g, b\.x, b\.y, b\.z, 5\.5, 1\.2, m\)/],
  ['Arpía: silbido antes de la ráfaga', 'arpia.js', /m\.data\.gustPre = enraged \? 1 : 0\.6;/],
  ['Arpía: se posa tras fallar', 'arpia.js', /m\.data\.posa = ck \+ 2/],
  ['Olvido: anillo al respirar hondo', 'anselmo.js', /G\.roar === 2 \|\| G\.roar === 1\) anilloAviso/],
  ['Sombra Madre: refuerzos con escudo', 'historia.js', /\[0\.33, \['sombra_escudo'/],
];
const faltaC = ATAQUES_C.filter(([, f, re]) => !re.test(readFileSync(dir + f, 'utf8'))).map(([n]) => n);
console.log(faltaC.length ? `\n✘ Ataques del tramo C sin su aviso: ${faltaC.join(', ')}` : `Los ${ATAQUES_C.length} ataques del tramo C tienen su aviso.`);
if (faltaC.length) process.exitCode = 1;
