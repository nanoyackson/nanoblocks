// Procesa las grabaciones de Freesound (assets-src/freesound) en sonidos listos para el juego:
// - corta cada paso/golpe individual detectando el ataque (onset),
// - normaliza el volumen, recorta silencios y aplica fundidos,
// - arma bucles de ambiente sin costura (fundido cruzado entre el final y el principio),
// - exporta a OGG mono en public/sounds/real/ con un manifest.json de bancos.
// Uso: node tools/process-sounds.mjs   (requiere ffmpeg en el PATH)
import { execFileSync } from 'node:child_process';
import { readdirSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'assets-src', 'freesound');
const OUT = join(ROOT, 'public', 'sounds', 'real');
const SR = 44100;
// FORCE=1 rehace todo (si cambiaste cortes o volúmenes); si no, solo se codifican los archivos que faltan
if (process.env.FORCE) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

function decode(file) {
  const buf = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}
function encode(samples, name) {
  const path = join(OUT, `${name}.ogg`);
  if (existsSync(path)) return `real/${name}.ogg`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', '-', '-c:a', 'libvorbis', '-q:a', '4', path], { input: Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength) });
  return `real/${name}.ogg`;
}
function normalize(x, peak = 0.89) {
  let m = 0;
  for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i]));
  if (m > 0) for (let i = 0; i < x.length; i++) x[i] *= peak / m;
  return x;
}
function fade(x, fin = 0.004, fout = 0.04) {
  const a = Math.floor(fin * SR), b = Math.floor(fout * SR);
  for (let i = 0; i < a && i < x.length; i++) x[i] *= i / a;
  for (let i = 0; i < b && i < x.length; i++) x[x.length - 1 - i] *= i / b;
  return x;
}
// filtro pasa-altos simple para quitar retumbes de manejo del micrófono
function highpass(x, hz = 60) {
  const rc = 1 / (2 * Math.PI * hz), dt = 1 / SR, a = rc / (rc + dt);
  const y = new Float32Array(x.length);
  let px = 0, py = 0;
  for (let i = 0; i < x.length; i++) { py = a * (py + x[i] - px); px = x[i]; y[i] = py; }
  return y;
}

// Detecta ataques: energía en ventanas de 10 ms que sube fuerte respecto al piso de ruido.
function onsets(x, minGap) {
  const W = Math.floor(SR * 0.01);
  const env = [];
  for (let i = 0; i + W <= x.length; i += W) {
    let s = 0;
    for (let j = 0; j < W; j++) s += x[i + j] * x[i + j];
    env.push(Math.sqrt(s / W));
  }
  const sorted = [...env].sort((a, b) => a - b);
  const floor = sorted[Math.floor(sorted.length * 0.3)] || 0;
  const max = sorted[sorted.length - 1] || 1;
  const thr = Math.max(floor * 4, max * 0.18);
  const out = [];
  let last = -1e9;
  for (let k = 2; k < env.length; k++) {
    const prev = Math.max(env[k - 1], env[k - 2]);
    if (env[k] > thr && env[k] > prev * 1.6 && (k - last) * 0.01 >= minGap) {
      // buscar el pico cercano para medir la fuerza
      let pk = env[k];
      for (let j = k; j < Math.min(env.length, k + 8); j++) pk = Math.max(pk, env[j]);
      out.push({ t: k * 0.01, strength: pk });
      last = k;
    }
  }
  return out;
}

function slices(files, { len, pre = 0.012, minGap = 0.22, max = 8, peak = 0.89 }) {
  const all = [];
  for (const f of files) {
    const x = highpass(decode(f));
    for (const o of onsets(x, minGap)) {
      const a = Math.max(0, Math.floor((o.t - pre) * SR));
      const b = Math.min(x.length, a + Math.floor(len * SR));
      if (b - a < len * SR * 0.6) continue;
      all.push({ strength: o.strength, data: x.slice(a, b) });
    }
  }
  // los más claros primero, sin pasarse del máximo
  all.sort((p, q) => q.strength - p.strength);
  return all.slice(0, max).map((s) => fade(normalize(s.data, peak)));
}

function whole(file, { start = 0, len, peak = 0.89, fout = 0.08 }) {
  const x = highpass(decode(file));
  const a = Math.floor(start * SR);
  const b = Math.min(x.length, a + Math.floor((len || x.length / SR) * SR));
  return fade(normalize(x.slice(a, b), peak), 0.004, fout);
}

// Bucle sin costura: los últimos `xf` segundos se funden con el principio.
function loop(file, { start = 0, len, xf = 2, peak = 0.7 }) {
  const x = highpass(decode(file));
  const a = Math.floor(start * SR);
  const L = Math.min(Math.floor(len * SR), x.length - a - Math.floor(xf * SR));
  const F = Math.floor(xf * SR);
  const out = x.slice(a, a + L);
  for (let i = 0; i < F; i++) {
    const t = i / F;
    out[i] = out[i] * Math.sqrt(t) + x[a + L + i] * Math.sqrt(1 - t);
  }
  return normalize(out, peak);
}

const src = (group) => readdirSync(SRC).filter((f) => f.startsWith(group + '__')).map((f) => join(SRC, f));
const one = (group, id) => join(SRC, `${group}__${id}.mp3`);

const banks = {};
const put = (bank, arr) => { banks[bank] = arr.map((x, i) => encode(x, `${bank.replace(/\./g, '_')}_${i}`)); };

// Pasos (también se usan, más fuertes, para colocar y para golpear como hace un juego de bloques)
put('step.grass', slices(src('step_grass'), { len: 0.32, max: 8 }));
put('step.gravel', slices(src('step_dirt'), { len: 0.34, max: 8 }));
put('step.sand', slices(src('step_sand'), { len: 0.34, max: 8 }));
put('step.snow', slices(src('step_snow'), { len: 0.36, max: 6 }));
put('step.wood', slices(src('step_wood'), { len: 0.3, max: 8 }));
put('step.stone', slices(src('step_stone'), { len: 0.3, max: 8 }));
// Excavar / golpear
put('dig.stone', slices(src('hit_stone'), { len: 0.32, minGap: 0.15, max: 8 }));
put('dig.gravel', slices([...src('hit_gravel'), ...src('dig_dirt')], { len: 0.4, minGap: 0.2, max: 8 }));
put('dig.wood', slices(src('hit_wood'), { len: 0.3, minGap: 0.12, max: 6 }));
put('dig.leaves', slices(src('leaves'), { len: 0.45, minGap: 0.3, max: 5 }));
put('dig.cloth', slices(src('cloth'), { len: 0.4, minGap: 0.3, max: 5 }));
put('break.glass', [whole(one('break_glass', 141563), { len: 1.6 }), whole(one('break_glass', 212698), { len: 1.8 })]);
// Varios
put('pop', [whole(one('pop', 202230), { len: 0.35, fout: 0.05 }), whole(one('pop', 447910), { len: 0.2, fout: 0.04 })]);
put('eat', slices(src('eat'), { len: 0.32, minGap: 0.18, max: 6 }));
put('splash', [whole(one('splash', 9508), { len: 1.8 }), ...slices([one('splash', 434978)], { len: 1.4, minGap: 1, max: 2 })]);
put('swim', slices(src('swim'), { len: 0.8, minGap: 0.5, max: 4, peak: 0.7 }));
put('ignite', [whole(one('fire', 534702), { len: 2.5 })]);
put('chest.open', [whole(one('chest', 271378), { start: 2.2, len: 2.2 })]);
put('chest.close', slices([one('chest', 271378)], { len: 0.5, minGap: 0.4, max: 2 }));
put('creak', [whole(one('chest', 377552), {})]);
put('door.open', [whole(one('door', 219499), {})]);
put('door.close', [whole(one('door', 219492), { len: 1.2 })]);
put('explode', [whole(one('explosion', 235968), { len: 4.5, fout: 1.2 }), whole(one('explosion', 47252), { fout: 0.6 })]);
put('hurt', [whole(one('hurt', 515624), {})]);
// Bucles de ambiente
put('loop.fire', [loop(one('fire', 532191), { start: 5, len: 20, peak: 0.6 })]);
put('loop.underwater', [loop(one('underwater', 173439), { len: 4, xf: 1, peak: 0.6 })]);
put('loop.birds', [loop(one('amb_birds', 387978), { len: 22, peak: 0.55 }), loop(one('amb_birds', 423711), { start: 2, len: 34, peak: 0.55 })]);
put('loop.crickets', [loop(one('amb_crickets', 129678), { len: 12, xf: 1.5, peak: 0.5 })]);
put('loop.cave', [loop(one('amb_cave', 177958), { start: 5, len: 40, peak: 0.6 })]);
put('loop.wind', [loop(one('amb_wind', 22331), { len: 28, peak: 0.6 })]);

// ---- v1.5: animales reales y más ambiente ----
// llamados: se cortan los más fuertes de cada grabación
put('mono', slices(src('a_mono'), { len: 2.6, minGap: 2.5, max: 4, peak: 0.95 }));
put('cara_blanca', slices(src('a_carablanca'), { len: 0.7, minGap: 0.6, max: 5 }));
put('tucan', slices(src('a_tucan'), { len: 0.9, minGap: 0.8, max: 5 }));
put('lapa', slices(src('a_lapa'), { len: 1.0, minGap: 0.9, max: 5 }));
put('jaguar', [whole(one('a_jaguar', 571287), { fout: 0.3 })]);
put('cocodrilo', [whole(one('a_cocodrilo', 527844), { len: 4, fout: 0.5 }), ...slices([one('a_cocodrilo', 527844)], { len: 1.5, minGap: 1.4, max: 2 })]);
put('rana', [whole(one('a_rana', 354132), {}), whole(one('a_rana', 361117), {}), ...slices([one('a_ranas_coro', 429590)], { len: 0.8, minGap: 0.7, max: 4 })]);
put('serpiente', [whole(one('a_serpiente', 540162), { fout: 0.4 }), whole(one('a_serpiente', 553374), { fout: 0.4 })]);
put('murcielago', slices(src('a_murcielago'), { len: 0.35, minGap: 0.3, max: 6 }));
put('pizote', [whole(one('a_pizote', 850005), {})]);
put('aleteo', [whole(one('a_aleteo', 389634), {}), whole(one('a_aleteo', 240476), {}), ...slices([one('a_aleteo', 386706)], { len: 0.5, minGap: 0.4, max: 2 })]);
put('colibri', slices([one('a_aleteo_rapido', 71417)], { len: 0.9, minGap: 0.8, max: 3, peak: 0.5 }));
put('gallina', [...slices([one('a_gallina', 456803)], { len: 0.9, minGap: 0.8, max: 4 }), whole(one('a_gallina', 316920), {})]);
put('gallo', [whole(one('a_gallina', 43382), {})]);
put('vaca', slices(src('a_vaca'), { len: 2.2, minGap: 2, max: 4 }));
put('trueno', [whole(one('g_trueno', 244053), { fout: 2 }), whole(one('g_trueno', 399656), { len: 10, fout: 3 })]);
put('loop.rain', [loop(one('g_lluvia', 507902), { start: 4, len: 30, peak: 0.6 }), loop(one('g_lluvia', 200273), { start: 4, len: 30, peak: 0.6 })]);
put('loop.waves', [loop(one('g_olas', 531015), { start: 2, len: 40, peak: 0.6 })]);
put('loop.river', [loop(one('g_rio', 415151), { len: 24, peak: 0.55 })]);
put('loop.jungle_night', [loop(one('g_selva_noche', 342191), { start: 10, len: 45, peak: 0.55 })]);
put('loop.jungle_day', [loop(one('g_selva_dia', 653742), { len: 26, peak: 0.55 })]);
put('loop.frogs', [loop(one('a_ranas_coro', 429590), { start: 5, len: 40, peak: 0.5 })]);
put('loop.bees', [loop(one('a_abejas', 341639), { start: 3, len: 20, peak: 0.5 })]);

// ---- v1.6: finca ----
put('perro', [...slices(src('b_perro'), { len: 0.6, minGap: 0.4, max: 6 })]);
put('perro.gruñido', slices(src('b_perro_gruñido'), { len: 1.6, minGap: 1.5, max: 3 }));
put('caballo', [whole(one('b_caballo', 269571), {}), ...slices([one('b_caballo', 510903)], { len: 1.8, minGap: 1.6, max: 2 })]);
put('resoplido', slices(src('b_resoplido'), { len: 1.0, minGap: 0.9, max: 4 }));
put('galope', slices(src('b_galope'), { len: 0.32, minGap: 0.12, max: 8 }));
put('balde', [whole(one('b_balde', 173930), { len: 1.6, fout: 0.4 }), whole(one('b_balde', 533146), {})]);
put('montura', [whole(one('b_montura', 481831), { len: 2, fout: 0.3 })]);

// ---- v1.7: cocina ----
put('freir', [whole(one('c_freir', 201936), { start: 1, len: 3, fout: 0.8 }), whole(one('c_freir', 353124), { start: 2, len: 3, fout: 0.8 })]);
put('chorrear', [whole(one('c_cafe', 432775), { fout: 0.5 }), whole(one('c_cafe', 658711), { len: 5, fout: 0.5 })]);
put('loop.hervir', [loop(one('c_hervir', 420228), { start: 4, len: 20, peak: 0.5 })]);
put('sorbo', [whole(one('c_sorbo', 272037), {}), whole(one('c_sorbo', 194808), {})]);

// ---- v1.8: pueblos ----
put('campana', [whole(one('p_campana', 76405), { fout: 1.2 }), whole(one('p_campana', 425172), { len: 9, fout: 3 })]);
put('monedas', [whole(one('p_monedas', 17502), { fout: 0.3 }), whole(one('p_monedas', 443334), { fout: 0.3 }), whole(one('p_monedas', 338260), { fout: 0.3 })]);
put('caja', [whole(one('p_caja', 209578), { fout: 0.4 })]);
put('balon', slices(src('p_balon'), { len: 0.5, minGap: 0.4, max: 4 }));
put('hmm', [whole(one('p_hmm', 170768), {}), whole(one('p_hmm', 165011), {}), whole(one('p_hmm', 394231), { len: 1.6, fout: 0.3 })]);
put('loop.pueblo', [loop(one('amb_pueblo', 482990), { start: 10, len: 40, peak: 0.5 }), loop(one('amb_pueblo', 222993), { len: 15, xf: 1.5, peak: 0.5 })]);

// ---- v1.9: mar y costa ----
put('ballena', [whole(one('m_ballena', 684188), { fout: 1.5 }), whole(one('m_ballena', 171945), { len: 10, fout: 2 }), whole(one('m_ballena', 88449), { fout: 1 })]);
put('delfin', [whole(one('m_delfin', 456151), { fout: 0.3 }), ...slices([one('m_delfin', 161691), one('m_delfin', 391317)], { len: 1.4, minGap: 1.2, max: 4 })]);
put('carrete', [whole(one('m_carrete', 118973), { len: 2.2, fout: 0.3 }), whole(one('m_carrete', 95564), { start: 1, len: 2.2, fout: 0.3 })]);
put('lanzar', [whole(one('m_lanzar', 60006), {}), ...slices([one('m_lanzar', 371313)], { len: 0.6, minGap: 0.8, max: 3 })]);
put('remo', slices(src('m_remo'), { len: 1.1, minGap: 0.9, max: 6, peak: 0.7 }));
put('pez', [whole(one('m_pez', 321490), {}), whole(one('m_pez', 507093), { len: 2, fout: 0.4 })]);
put('loop.gaviotas', [loop(one('m_gaviota', 353416), { len: 28, peak: 0.5 })]);
put('gaviota', slices([one('m_gaviota', 166703)], { len: 1.3, minGap: 1, max: 3 }));

// ---- v2.0: leyendas y armas ----
put('cadenas', [whole(one('l_cadenas', 370877), { len: 3, fout: 0.6 }), whole(one('l_cadenas', 448917), { start: 1, len: 3, fout: 0.6 })]);
put('loop.llanto', [loop(one('l_llanto', 172738), { len: 22, peak: 0.6 }), loop(one('l_llanto', 171946), { start: 2, len: 28, peak: 0.6 })]);
put('susurro', [whole(one('l_susurro', 234044), { fout: 0.5 }), whole(one('l_susurro', 175944), { start: 3, len: 5, fout: 1 })]);
put('grito', [whole(one('l_grito', 333832), { fout: 0.4 })]);
put('relincho', [whole(one('l_relincho', 149024), { len: 3, fout: 0.5 })]);
put('cadejos', slices(src('l_grunido'), { len: 1.6, minGap: 1.3, max: 5 }));
put('arco', [whole(one('w_arco', 394179), {}), whole(one('w_arco', 384918), { len: 0.6, fout: 0.2 })]);
put('flecha', [whole(one('w_flecha', 205938), {}), whole(one('w_flecha', 521552), {})]);
put('nivel', [whole(one('w_nivel', 717771), { fout: 0.2 }), whole(one('w_nivel', 541985), { fout: 0.3 })]);

// ---- v2.1: bombetas ----
put('silbido', [whole(one('f_silbido', 186933), { fout: 0.2 }), whole(one('f_silbido', 140726), { fout: 0.3 })]);
put('bombeta', [whole(one('f_estallido', 587196), {}), whole(one('f_estallido', 140717), { fout: 0.3 }), whole(one('f_estallido', 140711), { fout: 0.3 })]);
put('mecha', [whole(one('f_mecha', 140715), { len: 1.4, fout: 0.3 })]);

// ---- v2.3: notas reales para la música (VCSL, dominio público) ----
const MARIMBA_NOTES = { 373577: 59, 373578: 83, 373579: 48, 373580: 72, 373581: 96, 373582: 41, 373583: 65, 373584: 89, 373585: 54, 373586: 78 };
const ARPA_NOTES = { 373570: 65, 373571: 89, 373572: 54, 373573: 78, 373574: 98, 373575: 28, 373576: 101 };
for (const [id, midi] of Object.entries(MARIMBA_NOTES)) put(`nota.marimba.${midi}`, [whole(one('mus_marimba', id), { len: 2.4, fout: 0.9, peak: 0.8 })]);
for (const [id, midi] of Object.entries(ARPA_NOTES)) put(`nota.arpa.${midi}`, [whole(one('mus_arpa', id), { len: 3.6, fout: 1.4, peak: 0.8 })]);

// ---- v2.4: ideas locas ----
put('hipo', [whole(one('x_hipo', 250140), {}), whole(one('x_hipo', 202800), {}), whole(one('x_hipo', 338196), { len: 0.8, fout: 0.2 })]);

// ---- v2.5: Inframundo Volcánico ----
put('portal', [whole(one('i_portal', 657653), { fout: 0.6 }), whole(one('i_portal', 735062), { fout: 0.3 })]);
put('loop.lava', [loop(one('i_lava', 474852), { len: 30, peak: 0.6 }), loop(one('i_lava', 334671), { start: 5, len: 40, peak: 0.55 })]);
put('loop.volcan', [loop(one('i_volcan', 385098), { start: 3, len: 40, peak: 0.6 })]);
put('monstruo', [whole(one('i_monstruo', 344903), { fout: 0.3 }), whole(one('i_monstruo', 345733), { fout: 0.3 }), whole(one('i_monstruo', 222523), { len: 2.5, fout: 0.5 })]);

// ---- v2.7: San José ----
put('aplausos', [whole(one('t_aplausos', 396549), { start: 2, len: 7, fout: 2 }), whole(one('t_aplausos', 432333), { fout: 1.5 })]);

// ---- v2.16: estadios y tren ----
put('gol', [whole(one('t_gol', 241630), { len: 7, fout: 2 }), whole(one('t_gol', 397434), { start: 1, len: 8, fout: 2 })]);
put('tren', [whole(one('t_tren', 71778), { fout: 0.4 })]);

// ---- v2.22: machete, armadura, inventario y los últimos que eran sintetizados ----
put('swish', [whole(one('s_swish', 19312), { len: 0.7, fout: 0.15 }), whole(one('s_swish', 240640), { fout: 0.08 }), whole(one('s_swish', 419341), { len: 0.8, fout: 0.2 })]);
put('tajo', [whole(one('s_tajo', 411122), { len: 0.9, fout: 0.25 }), ...slices([one('s_tajo', 395370)], { len: 0.6, max: 2 })]);
put('armadura.metal', [whole(one('s_metal', 616492), { fout: 0.1 }), ...slices([one('s_metal', 675817)], { len: 0.7, max: 5 })]);
put('armadura.cuero', [whole(one('s_cuero', 396429), { len: 1.2, fout: 0.3 }), whole(one('s_cuero', 743265), {}), whole(one('s_cuero', 743266), {})]);
put('inv.open', [whole(one('s_inv', 568992), { fout: 0.15 })]);
put('inv.close', [whole(one('s_inv', 568991), { fout: 0.15 })]);
put('fuse', [whole(one('s_mecha', 45650), { start: 0.5, len: 3, fout: 0.6, peak: 0.6 })]);
put('rumble', [whole(one('s_retumbo', 258341), { start: 4, len: 5, fout: 1.5 }), whole(one('s_retumbo', 217657), { start: 6, len: 6, fout: 2 })]);
// v2.23: sonidos de objeto (nada de «pin»): madera, tela, piedra y golpes de verdad
put('recoger', [whole(one('s_recoger', 609569), { fout: 0.1 }), whole(one('s_recoger', 426631), { start: 6.05, len: 0.5, fout: 0.15 }), ...slices([one('s_recoger', 565969)], { len: 0.45, max: 3 })]);
put('soltar', [whole(one('s_soltar', 339365), { len: 0.6, fout: 0.2 }), whole(one('s_soltar', 272065), { len: 0.8, fout: 0.25 }), ...slices([one('s_soltar', 174631)], { len: 0.5, max: 4 })]);
put('cofre.abrir', [whole(one('s_cofre_a', 573654), { len: 1.6, fout: 0.4 }), whole(one('s_cofre_a', 422975), { start: 0.2, len: 1.0, fout: 0.3 }), ...slices([one('s_cofre_a', 271378)], { len: 0.9, max: 2 })]);
put('cofre.cerrar', slices([one('s_cofre_c', 676420), one('s_cofre_c', 475294)], { len: 0.6, max: 6 }));
put('picar', slices([one('s_picar', 487084), one('s_picar', 841053)], { len: 0.35, max: 8 }));
// criaturas que todavía sonaban sintetizadas
put('danta', [whole(one('s_danta', 800274), { fout: 0.05 })]);
put('danta.hurt', [whole(one('s_danta', 352698), { len: 1.6, fout: 0.4 })]);
put('sombra', [whole(one('s_sombra', 643741), { len: 3.5, fout: 1 }), whole(one('s_sombra', 204963), { start: 0.8, len: 4, fout: 1 })]);
put('sombra.hurt', [whole(one('s_sombra', 473525), { len: 2, fout: 0.5 })]);
put('perezoso', [whole(one('s_perezoso', 435748), { len: 1.2, fout: 0.3 })]);
put('quetzal', slices([one('s_quetzal', 456930)], { len: 1.4, minGap: 1, max: 4 }));
put('tortuga', [whole(one('s_tortuga', 871251), {})]);
// v2.39: la Arpía de la Tormenta (grito de águila y ráfaga de viento reales)
put('arpia', [whole(one('s_arpia', 381200), { fout: 0.3 }), whole(one('s_arpia', 39338), { start: 1.2, len: 2.6, fout: 0.6 })]);
put('rafaga', [whole(one('s_rafaga', 146932), { start: 0.3, len: 2.8, fout: 1 }), whole(one('s_rafaga', 683096), { fout: 0.3 })]);
// v2.44: el carro viejo (arranque, motor en marcha, pito, hueco y llanta reventada)
put('carro.arranque', [whole(one('s_motor', 250009), { start: 0.7, len: 3.2, fout: 0.8 })]);
put('loop.motor', [loop(one('s_motor', 369054), { len: 4, xf: 0.6, peak: 0.6 }), loop(one('s_motor', 349171), { start: 0.5, len: 6, xf: 0.8, peak: 0.6 })]);
put('pito', [whole(one('s_pito', 434878), { fout: 0.1 }), whole(one('s_pito', 423990), { fout: 0.1 })]);
put('hueco', [whole(one('s_hueco', 96137), { fout: 0.1 }), whole(one('s_hueco', 170633), { fout: 0.2 })]);
put('llanta', [whole(one('s_llanta', 243375), { len: 0.45, fout: 0.15 })]);
// v2.46: el bus (frenos de aire y la puerta)
put('bus.freno', [whole(one('s_freno', 801435), { start: 0.9, len: 1.4, fout: 0.4 }), whole(one('s_freno', 422442), { len: 0.85, fout: 0.25 })]);
put('bus.puerta', [whole(one('s_puerta_bus', 380320), { start: 0.3, len: 3.2, fout: 0.4 })]);
// v2.47: la polea corriendo por el cable de la tirolesa (grabación real de una tirolina)
put('loop.tirolesa', [loop(one('s_tirolina', 196403), { start: 4, len: 10, xf: 1, peak: 0.7 })]);
// v2.50: mono tití y tepezcuintle
// v2.53: el zancudo zumbando
put('loop.zancudo', [loop(one('s_zancudo', 662970), { start: 1, len: 6, xf: 0.6, peak: 0.6 })]);
// v2.56: gatos del pueblo
put('gato', [whole(one('s_gato', 110011), { fout: 0.2 }), whole(one('s_gato', 333916), { fout: 0.2 }), whole(one('s_gato', 412017), { fout: 0.25 })]);
put('gato.ronroneo', [whole(one('s_ronroneo', 260881), { start: 2, len: 2.5, fout: 0.6 })]);
put('gato.bufido', [whole(one('s_bufido', 343927), { fout: 0.15 })]);
put('titi', slices([one('s_titi', 479823)], { len: 0.8, minGap: 0.5, max: 5 }));
put('tepezcuintle', slices([one('s_tepezcuintle', 430055)], { len: 0.6, minGap: 0.4, max: 5 }));
// v2.65: fauna nueva
put('coyote', [...slices([one('f_coyote', 256533)], { len: 3.2, minGap: 2.5, max: 3 }), ...slices([one('f_coyote', 640060)], { len: 4, minGap: 3, max: 2 })]);
put('ardilla', slices([one('f_ardilla', 111393)], { len: 1.6, minGap: 1.2, max: 4 }));
put('zorro_pelon', [whole(one('f_zorro', 447636), {})]);
put('guatusa', [whole(one('f_guatusa', 288941), {}), whole(one('f_guatusa', 435748), {})]);
put('arena', [whole(one('f_arena', 651292), {}), whole(one('f_arena', 651293), {})]);

// v2.94: comparsa de carnaval
put('loop.comparsa', [loop(one('f_comparsa', 435501), { start: 2, len: 20, xf: 1, peak: 0.7 })]);

// v2.99: el canto de la sirena
put('loop.chicharras', [loop(one('f_chicharra', 268964), { start: 3, len: 24, xf: 1.5, peak: 0.55 }), loop(one('f_chicharra', 320113), { start: 4, len: 24, xf: 1.5, peak: 0.55 })]);
put('loop.marimba', [loop(one('f_marimba', 522193), { start: 0, len: 7.9, xf: 0.15, peak: 0.7 }), loop(one('f_marimba', 586014), { start: 0, len: 5.8, xf: 0.15, peak: 0.7 })]);
put('yiguirro', slices([one('f_yiguirro', 785669)], { len: 2.6, minGap: 1.2, max: 5 }));
put('silbato', [whole(one('f_silbato', 538422), { fout: 0.1 }), whole(one('f_silbato', 218318), { len: 1.3, fout: 0.3 })]);
put('loop.sirena', [loop(one('f_sirena', 646179), { start: 1, len: 24, xf: 1.5, peak: 0.6 }), loop(one('f_sirena', 680709), { start: 2, len: 26, xf: 1.5, peak: 0.6 })]);

// v3.54: oropéndolas y granizo
put('oropendola', slices([one('f_oropendola', 512109)], { len: 2.4, minGap: 1.8, max: 6 }));
put('loop.granizo', [loop(one('f_granizo', 232288), { start: 1, len: 15, xf: 1.2, peak: 0.65 })]);

// v3.58: el chancho
put('chancho', [...slices([one('f_chancho', 421734)], { len: 0.9, minGap: 0.7, max: 5 }), whole(one('f_chancho', 442907), { fout: 0.05 })]);
put('chancho.chillido', slices([one('f_chillido', 260640)], { len: 1.4, minGap: 1.0, max: 4 }));

// v3.59: la lechuza
put('lechuza', [...slices([one('f_lechuza', 397690)], { len: 1.8, minGap: 1.5, max: 4 }), ...slices([one('f_lechuza', 101344)], { len: 1.8, minGap: 1.5, max: 3 })]);

// v3.87: el corazón con poca vida
put('latido', slices([one('f_latido', 91258)], { len: 0.9, minGap: 0.7, max: 3 }));
// v3.79: derrumbe y chancleta
put('derrumbe', slices([one('f_derrumbe', 488660)], { len: 3.2, minGap: 2, max: 2 }));
put('chancleta.golpe', slices([one('f_chancleta', 523267)], { len: 0.3, minGap: 0.2, max: 6 }));
// v3.70: el yunque
put('yunque', slices([one('f_yunque', 321889)], { len: 0.7, minGap: 0.45, max: 6 }));
// v3.67: defender la casa
put('cencerro', slices([one('f_cencerro', 231275)], { len: 1.2, minGap: 0.9, max: 4 }));
put('puerta.golpe', slices([one('f_puerta', 450793)], { len: 0.7, minGap: 0.5, max: 5 }));

const credits = JSON.parse(readFileSync(join(SRC, 'creditos.json'), 'utf8'));
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify({ banks, credits }, null, 1));
for (const [b, f] of Object.entries(banks)) console.log(b.padEnd(16), f.length);
