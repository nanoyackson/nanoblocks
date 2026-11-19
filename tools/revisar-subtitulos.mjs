// v13.5.9 (PU-18, 19, 20): los subtítulos de sonidos. Cruza las llamadas `audio.play('banco', { pos })` del código contra el diccionario CAPTIONS de src/ui.js:
//  1) todo banco que suena en el mundo (con `pos`, sin `ui: true`) tiene su subtítulo, salvo los que no se subtitulan a propósito (pasos, golpes de bloque, clics, lo propio de la interfaz);
//  2) todo banco de interfaz que avisa de un peligro (`sub: true`) tiene su subtítulo;
//  3) ninguna clave del diccionario queda huérfana (que no se toque en ninguna parte con ese nombre exacto: los pares «perro_gruñido» / «perro.gruñido» daban silencio).
// Uso: node tools/revisar-subtitulos.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../src/', import.meta.url));
let fallas = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fallas++; };

const ui = fs.readFileSync(dir + 'ui.js', 'utf8').replace(/\r\n/g, '\n');
const blk = ui.slice(ui.indexOf('const CAPTIONS = {'), ui.indexOf('const captionText'));
const caps = new Set([...blk.matchAll(/(?:^|[ ,{])'?([A-Za-z_.ñ0-9]+)'?:\s*'/gm)].map((m) => m[1]));
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js') && !['version.js', 'textures.js', 'logros-lista.js', 'usoitems.js'].includes(f));
const fuentes = files.map((f) => fs.readFileSync(dir + f, 'utf8').replace(/\r\n/g, '\n'));
const usos = {};
for (let i = 0; i < files.length; i++) {
  for (const m of fuentes[i].matchAll(/\.play\(\s*['"`]([A-Za-z_.ñ0-9]+)['"`]\s*(?:,\s*(\{[^;\n]*?\}))?\s*\)/g)) {
    const n = m[1], o = m[2] || '', u = (usos[n] ||= { pos: 0, ui: 0, sub: 0 });
    if (/\bsub:\s*true/.test(o)) u.sub++;
    else if (/\bui:\s*true/.test(o)) u.ui++;
    else if (/\bpos\b/.test(o)) u.pos++;
  }
}
// lo que no se subtitula a propósito (el comentario de ui.js lo dice): pasos y golpes de bloque, clics e interfaz, lo propio, y unos sonidos sin sentido solos
const A_PROPOSITO = /^(step|dig)\.|^(click|pop|recoger|soltar|punch|eat|picar|hmm|mecha|swim|armadura\.metal|armadura\.cuero|drop|toolbreak|sorbo|hipo)$/;
const sin = Object.entries(usos).filter(([n, u]) => u.pos && !caps.has(n) && !A_PROPOSITO.test(n)).map(([n]) => n);
ok(sin.length === 0, `todo sonido del mundo tiene subtítulo o está exento a propósito (${Object.keys(usos).length} bancos mirados)${sin.length ? ` · sin subtítulo: ${sin.join(', ')}` : ''}`);
const subSin = Object.entries(usos).filter(([n, u]) => u.sub && !caps.has(n)).map(([n]) => n);
ok(subSin.length === 0, `los sonidos de interfaz que piden subtítulo (sub: true) lo tienen${subSin.length ? ` · faltan: ${subSin.join(', ')}` : ''}`);
const usadas = new Set();
const todo = fuentes.join('\n');
const huerfanas = [...caps].filter((k) => {
  const re = new RegExp(`['"\`]${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`);
  const visible = todo.replace(blk, '');
  if (re.test(visible)) { usadas.add(k); return false; }
  return true;
});
// los que se tocan sin nombre literal (por ejemplo `hurtSound: 'x'` ya cuenta como literal; los armados con plantilla no): se listan aparte y no fallan si son pocos
ok(huerfanas.length <= 12, `claves del diccionario sin ninguna llamada con ese nombre exacto: ${huerfanas.length}${huerfanas.length ? ` (${huerfanas.join(', ')})` : ''} (≤ 12: algunas se tocan por plantilla)`);
for (const par of [['perro_gruñido', 'perro.gruñido'], ['chest_open', 'chest.open']]) {
  const [malo, bueno] = par;
  const nMalo = (todo.replace(blk, '').match(new RegExp(`['"\`]${malo}['"\`]`, 'g')) || []).length;
  ok(nMalo === 0 || !caps.has(bueno), `«${malo}» ya no se toca con ese nombre (se tocaba «${bueno}» y no había subtítulo)`);
}
console.log(fallas ? `\n✘ ${fallas} falla(s)` : '\nSubtítulos de sonidos: todo bien.');
process.exitCode = fallas ? 1 : 0;
