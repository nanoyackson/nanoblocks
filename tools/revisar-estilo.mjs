// Vigila el estilo «vidrio» (v11.13.1; reforzada en la v11.13.5 tras la sexta revisión). Uso: node tools/revisar-estilo.mjs [--suave] [--todo]
// 1. Colores y radios escritos a mano (no por token): en el CSS (también dentro de @keyframes) y en los estilos en línea de src/*.js
//    (style.x = …, cssText completo, setProperty, style="…" en plantillas). El dibujo en canvas y three.js no cuenta: es contenido.
// 2. `monospace` en la interfaz (la letra es Inter).
// 3. CONTRASTE: en cada regla con letra y fondo (o con letra y un padre directo con fondo), resuelve los tokens de tokens.css,
//    mezcla el fondo translúcido sobre el peor fondo del juego (blanco de nieve, cielo de día o negro de cueva) y exige ≥ 4.5:1.
//    Así habría atrapado G1 (letra = fondo en las cartas, el bingo y el álbum) y G2 (texto sobre --velo con cielo claro detrás).
// (Una línea de JS con «// contenido: …» es un tinte del mundo —luna roja, eclipse, la cueva—, no interfaz.)
// 4. Letra de menos de 13 px (el piso del sistema; 11–12 solo con la marca /* chico: … */ en la misma regla).
// --todo: lista cada caso; --suave: no falla, solo avisa.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../src/', import.meta.url));
const suave = process.argv.includes('--suave'), todo = process.argv.includes('--todo');
const leer = (f) => readFileSync(dir + f, 'utf8');
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '');
const CSS = ['tokens.css', 'style.css', 'vidrio.css'];
const COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g;
const problemas = { mano: [], mono: [], contraste: [], chico: [] };

// ---------- tokens ----------
const tokens = {};
for (const f of CSS) {
  for (const m of sinComentarios(leer(f)).matchAll(/:root\s*\{([^}]*)\}/g)) {
    for (const d of m[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) if (!(d[1] in tokens)) tokens[d[1]] = d[2].trim();
  }
}
const NOMBRES = { white: [255, 255, 255, 1], black: [0, 0, 0, 1], transparent: [0, 0, 0, 0] };
function color(v, prof = 0) {
  if (!v || prof > 8) return null;
  v = v.trim();
  const va = v.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/);
  if (va) return color(tokens[va[1]] ?? va[2], prof + 1);
  if (NOMBRES[v]) return NOMBRES[v];
  let m = v.match(/^#([0-9a-f]{3,8})$/i);
  if (m) {
    let h = m[1];
    if (h.length <= 4) h = [...h].map((c) => c + c).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1];
  }
  m = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
  if (m) return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : +m[4]];
  return null;
}
// colores de un valor de fondo (un color, un gradiente de varios, o url → null: no se puede medir)
function coloresFondo(v) {
  if (!v || /url\(/.test(v)) return null;
  const partes = v.match(/var\([^()]*(?:\([^()]*\))?[^()]*\)|#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|\b(?:white|black|transparent)\b/gi) || [];
  const cs = partes.map((p) => color(p)).filter(Boolean);
  if (!cs.length) return null;
  // una capa muy transparente que no es un velo (--surface-2/3, --campo, --acento-suave…) va siempre dentro de un panel
  cs.capa = !/velo/.test(v) && cs.every((c) => c[3] < 0.3);
  return cs;
}
const sobre = (c, base) => [0, 1, 2].map((i) => c[i] * c[3] + base[i] * (1 - c[3]));
const lum = (c) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const razon = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
// el peor caso detrás del vidrio: nieve, cielo de día, cueva
const DETRAS = [[255, 255, 255], [232, 240, 255], [0, 0, 0]];
function peorContraste(letra, fondos) {
  let peor = Infinity;
  for (const base of DETRAS) {
    // los fondos se apilan: el último de la lista es el de más abajo (padre), el primero el de más arriba
    for (const f of fondos[0]) {
      let b = base;
      for (let k = fondos.length - 1; k >= 1; k--) b = sobre(fondos[k][0], b);
      b = sobre(f, b);
      peor = Math.min(peor, razon(letra[3] < 1 ? sobre(letra, b) : letra, b));
    }
  }
  return peor;
}

// ---------- reglas del CSS ----------
const reglas = [];
for (const f of ['style.css', 'vidrio.css']) {
  const crudo = leer(f);
  // colores a mano: todo menos los comentarios (los @keyframes también cuentan desde la v11.13.5)
  for (const [i, linea] of sinComentarios(crudo).split(/\r?\n/).entries()) {
    for (const c of linea.match(COLOR) || []) problemas.mano.push(`${f}:${i + 1} ${c}`);
    if (/border-radius\s*:\s*[^;]*\d+px/.test(linea)) problemas.mano.push(`${f}:${i + 1} radio a mano`);
    if (/monospace/.test(linea)) problemas.mono.push(`${f}:${i + 1}`);
  }
  const t = crudo.replace(/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
  for (const m of t.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const marcaChico = /\/\*\s*chico\b/.test(m[2]);
    const decl = {};
    for (const d of sinComentarios(m[2]).matchAll(/([\w-]+)\s*:\s*([^;]+)/g)) decl[d[1]] = d[2].trim().replace(/\s*!important$/, '');
    for (const sel of sinComentarios(m[1]).split(',').map((s) => s.trim().replace(/^@[^{]*$/, '')).filter(Boolean)) reglas.push({ f, sel, decl, marcaChico });
  }
}
// la cascada: lo que vale al final para cada selector (vidrio.css va después de style.css y pisa)
const efectivo = new Map();
for (const r of reglas) { const e = efectivo.get(r.sel) || { f: r.f, sel: r.sel, decl: {}, marcaChico: false }; Object.assign(e.decl, r.decl); e.f = r.f; e.marcaChico ||= r.marcaChico; efectivo.set(r.sel, e); }
// el fondo efectivo de un selector: el suyo, o el de la regla «padre» (el mismo selector sin el último paso)
const fondoDe = (sel) => {
  const r = efectivo.get(sel);
  return r && (r.decl.background || r.decl['background-color']) ? coloresFondo(r.decl['background-color'] || r.decl.background) : null;
};
const padre = (sel) => { const p = sel.replace(/\s*[>+~]?\s*[^\s>+~]+$/, '').trim(); return p && p !== sel ? p : null; };
const vistos = new Set();
for (const r of efectivo.values()) {
  const c = r.decl.color;
  if (!c || /inherit|currentcolor|transparent/i.test(c)) continue;
  const letra = color(c);
  if (!letra) continue;
  const fondos = [];
  let s = r.sel, propio = coloresFondo(r.decl['background-color'] || r.decl.background);
  if (propio) fondos.push(propio);
  else { const f0 = fondoDe(s); if (f0) fondos.push(f0); }
  // un nivel de padre para la pila (p. ej. «.estampa b» dentro de «.estampa»)
  const pa = padre(s);
  if (pa) { const fp = fondoDe(pa); if (fp) { if (!fondos.length) fondos.push(fp); else fondos.push(fp); } }
  if (!fondos.length) continue;
  if (fondos[fondos.length - 1].capa) fondos.push([color('var(--surface)')]);
  const k = peorContraste(letra, fondos.map((f) => f));
  const clave = `${r.sel}|${c}`;
  if (k < 4.5 && !vistos.has(clave)) { vistos.add(clave); problemas.contraste.push(`${r.f} «${r.sel}»: ${c} sobre ${(r.decl['background-color'] || r.decl.background || '(fondo del padre)').slice(0, 40)} → ${k.toFixed(2)}:1`); }
  s = null;
}
// letra chica
for (const r of efectivo.values()) {
  const fs = r.decl['font-size'] || (r.decl.font && (r.decl.font.match(/(?:^|\s)([\d.]+px|var\(--fs-[\w-]+\))/) || [])[1]);
  if (!fs) continue;
  const px = fs.startsWith('var(') ? parseFloat(tokens[fs.slice(4, -1)]) : parseFloat(fs);
  if (px < 13 && !r.marcaChico) problemas.chico.push(`${r.f} «${r.sel}»: ${px}px`);
}

// ---------- estilos en línea de src/*.js ----------
for (const f of readdirSync(dir).filter((x) => x.endsWith('.js'))) {
  const t = leer(f);
  for (const [i, linea] of t.split(/\r?\n/).entries()) {
    if (/^\s*\/\//.test(linea) || /\/\/ contenido:/.test(linea)) continue; // «// contenido: …» marca un tinte del mundo, no interfaz
    const enEstilo = /\.style\.\w+\s*=|cssText|setProperty\(|style="|style='|style=\$\{|style: /.test(linea);
    if (enEstilo) for (const c of linea.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g) || []) problemas.mano.push(`${f}:${i + 1} ${c} (en línea)`);
    if (/monospace/.test(linea) && !/ctx|\.font\s*=\s*`?[^`]*canvas/i.test(linea) && /style|cssText|font-family|font:/.test(linea)) problemas.mono.push(`${f}:${i + 1}`);
  }
}

// ---------- informe ----------
const TOPE = { mano: 0, mono: 0, contraste: 0, chico: 0 };
const NOMBRE = { mano: 'colores o radios a mano', mono: 'monospace en la interfaz', contraste: 'pares letra-fondo con menos de 4.5:1', chico: 'reglas con letra de menos de 13 px' };
let falla = false;
for (const k of Object.keys(problemas)) {
  const n = problemas[k].length, mal = n > TOPE[k];
  falla ||= mal;
  console.log(`${mal ? '✘' : '✔'} ${NOMBRE[k]}: ${n}`);
  if (n && (todo || mal)) for (const p of problemas[k].slice(0, todo ? 999 : 15)) console.log(`   ${p}`);
  if (n > 15 && !todo && mal) console.log(`   … y ${n - 15} más (--todo para verlas)`);
}
console.log(`\n${falla ? '✘ hay que arreglar' : '✔ todo con tokens, legible y del tamaño mínimo'} (${reglas.length} reglas, ${Object.keys(tokens).length} tokens)`);
if (falla && !suave) process.exitCode = 1;
