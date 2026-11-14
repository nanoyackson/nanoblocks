// «Hora dorada» (v12.0.0, docs/revisiones/PLAN_GRAFICOS.md, fases 0 y ★2): la atmósfera «de material», sin postproceso.
// Un solo objeto con las uniformes que comparten los bloques (world.js), el terreno lejano (lod.js) y la cúpula del cielo (sky.js):
// - tono: gradación por hora (luces ámbar y sombras azuladas al atardecer) y un hombro suave arriba de 0.8 (nada se «quema»);
// - niebla: niebla de altura exponencial (valles con bruma) que se tiñe hacia el sol cuando se mira hacia él;
// - cielo: cúpula mejorada (dispersión aproximada: horizonte más claro, halo grande del sol, el lado del sol más cálido);
// - bruma: el color y el espesor de la bruma según el bioma donde está uno (selva húmeda, desierto, páramo, costa).
// REGLA DE ORO: en «Bajo» nada de esto se compila (cada cosa va detrás de un #define), así que Bajo dibuja igual que antes.
import * as THREE from 'three';

export const NIVELES = ['bajo', 'medio', 'alto', 'ultra'];
export const NOMBRE_NIVEL = { bajo: 'Bajo', medio: 'Medio', alto: 'Alto', ultra: 'Ultra', personalizado: 'Personalizado' };
// qué enciende cada nivel (lo de Alto y Ultra crecerá con el agua, el postproceso y las sombras)
export const FLAGS = {
  bajo: { tono: false, niebla: false, cielo: false, bruma: false, nitidez: false, agua: false, bloom: false, halos: false },
  medio: { tono: true, niebla: true, cielo: true, bruma: false, nitidez: true, agua: true, bloom: false, halos: true },
  alto: { tono: true, niebla: true, cielo: true, bruma: true, nitidez: true, agua: true, bloom: true, halos: false },
  ultra: { tono: true, niebla: true, cielo: true, bruma: true, nitidez: true, agua: true, bloom: true, halos: false },
};
export const NOMBRE_FLAG = { tono: 'Tono y color según la hora', niebla: 'Niebla de altura y luz del sol', cielo: 'Cielo mejorado', bruma: 'Bruma según el bioma', nitidez: 'Texturas nítidas de lejos', agua: 'Agua que refleja el cielo', bloom: 'Brillo de antorchas y lava (bloom)', halos: 'Halos de luz sobre antorchas y lava (barato)' };
// v12.5.0: la anisotropía de la nitidez según el nivel (Personalizado: la de Medio)
export const ANISO = { medio: 4, alto: 8, ultra: 16, personalizado: 4 };
// las banderas efectivas de unos ajustes (Personalizado usa las suyas)
export function flagsDe(s) {
  const c = s && s.calidad;
  if (c === 'personalizado') return { ...FLAGS.bajo, ...(s.video || {}) };
  return FLAGS[c] || FLAGS.bajo;
}

// uniformes compartidas (los materiales las enganchan en onBeforeCompile)
export const ATMOS = {
  uSunDir: { value: new THREE.Vector3(1, 0.3, 0.15).normalize() },
  uSunCol: { value: new THREE.Color(1, 0.75, 0.5) },
  uLuzTinte: { value: new THREE.Color(1, 1, 1) }, // a qué se tiñen las luces altas
  uSombraTinte: { value: new THREE.Color(0, 0, 0) }, // a qué se levantan las sombras
  uGrado: { value: new THREE.Vector4(0, 0, 0, 0) }, // x: tinte de luces, y: tinte de sombras, z: saturación extra, w: contraste extra
  uHora: { value: new THREE.Vector2(0, 0) }, // x: hora dorada (1 al ponerse o salir el sol), y: noche
  uNiebla: { value: new THREE.Vector4(0, 0.045, 62, 0) }, // x: densidad, y: caída con la altura, z: altura base, w: dispersión hacia el sol
  uBruma: { value: new THREE.Vector4(1, 1, 1, 0) }, // rgb: TINTE de la bruma del bioma (multiplica el color del cielo: nunca gris), w: cuánto
  uCieloHoriz: { value: new THREE.Color(0.6, 0.75, 0.9) }, // v12.6.2: los colores de la cúpula (sky.js), para el reflejo del agua
  uCieloCenit: { value: new THREE.Color(0.3, 0.5, 0.85) },
  uAgua: { value: new THREE.Vector3(1e4, 2e4, 0) }, // v12.6.5: x, y = dónde empieza y termina el fundido con el agua lejana; z = nublado/lluvia (0–1)
};

// --- GLSL compartido ---
export const GLSL_UNIFORMES = `
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uLuzTinte; uniform vec3 uSombraTinte; uniform vec4 uGrado; uniform vec4 uNiebla; uniform vec4 uBruma; uniform vec3 uAgua; uniform vec3 uCieloHoriz; uniform vec3 uCieloCenit;`;
// gradación por hora (v12.1.1): la luz directa ámbar/naranja, las sombras azul-violeta, saturación y contraste ARRIBA al atardecer;
// al mediodía casi nada (un poquito más rico que Bajo). Y el hombro suave (lo de abajo de 0.8 casi no cambia)
export const GLSL_GRADO = `
vec3 atmosGrado(vec3 c) {
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(c, c * uLuzTinte, smoothstep(0.1, 0.65, l) * uGrado.x);
  float sh = 1.0 - smoothstep(0.04, 0.42, l);
  c = mix(c, c * (vec3(1.0) + uSombraTinte * 5.0), sh * uGrado.y) + uSombraTinte * sh * uGrado.y * 0.45;
  float l2 = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = max(mix(vec3(l2), c, 1.0 + uGrado.z), vec3(0.0));
  c = max((c - 0.38) * (1.0 + uGrado.w) + 0.38, vec3(0.0));
  vec3 hombro = 0.8 + 0.2 * (1.0 - exp(-(c - 0.8) / 0.2));
  return mix(c, hombro, step(vec3(0.8), c));
}`;
// niebla: la lineal de siempre + la de altura; el color se calienta hacia el sol y toma la bruma del bioma
export const GLSL_NIEBLA = `
vec3 atmosNiebla(vec3 col, vec3 wp, float fogLineal) {
  vec3 v = wp - cameraPosition;
  float dist = length(v);
  vec3 dir = v / max(dist, 0.001);
  float dens = uNiebla.x * (1.0 + uBruma.w * 1.6);
  // integral de una densidad que cae con la altura entre la cámara y el punto
  float k = uNiebla.y;
  float hc = max(cameraPosition.y - uNiebla.z, 0.0), hp = max(wp.y - uNiebla.z, 0.0);
  float dy = hp - hc;
  float media = abs(dy) < 0.01 ? exp(-k * hc) : (exp(-k * hc) - exp(-k * hp)) / (k * dy);
  // v12.1.1: la niebla de altura solo a lo lejos (desde el 55 % del alcance de la niebla): lo cercano no se lava
  float alt = (1.0 - exp(-dens * dist * media * 0.004)) * smoothstep(fogFar * 0.55, fogFar * 0.95, dist);
  float f = clamp(max(fogLineal, alt), 0.0, 1.0);
  float sol = pow(max(dot(dir, uSunDir), 0.0), 6.0) * uNiebla.w;
  // el color: el del cielo en el horizonte, teñido por el bioma (multiplica, nunca gris) y dorado hacia el sol
  vec3 fc = mix(fogColor, fogColor * uBruma.rgb, uBruma.w);
  fc = mix(fc, uSunCol, clamp(sol, 0.0, 0.9));
  return mix(col, fc, f);
}`;

// reemplazo del <fog_fragment> de three para MeshBasicMaterial (necesita vAtmosWP del vertex)
export const FRAG_NIEBLA = `
#ifdef ATMOS_NIEBLA
  #ifdef USE_FOG
    float fogLin = smoothstep(fogNear, fogFar, vFogDepth);
    gl_FragColor.rgb = atmosNiebla(gl_FragColor.rgb, vAtmosWP, fogLin);
  #endif
#else
  #include <fog_fragment>
#endif
#ifdef ATMOS_TONO
  gl_FragColor.rgb = atmosGrado(gl_FragColor.rgb);
#endif`;

// parchea un MeshBasicMaterial ya parcheado: la posición de mundo, las uniformes y el final del fragment
export function parcheAtmos(shader) {
  Object.assign(shader.uniforms, ATMOS);
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\n#if defined(ATMOS_NIEBLA) || defined(ATMOS_TONO) || defined(ATMOS_AGUA)\nvarying vec3 vAtmosWP;\n#endif')
    .replace('#include <fog_vertex>', '#include <fog_vertex>\n#if defined(ATMOS_NIEBLA) || defined(ATMOS_TONO) || defined(ATMOS_AGUA)\nvAtmosWP = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#endif');
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>
#if defined(ATMOS_NIEBLA) || defined(ATMOS_TONO) || defined(ATMOS_AGUA)
varying vec3 vAtmosWP;${GLSL_UNIFORMES}
#endif
#ifdef ATMOS_TONO${GLSL_GRADO}
#endif`)
    .replace('#include <fog_fragment>', FRAG_NIEBLA);
  if (shader.fragmentShader.includes('atmosNiebla(')) {
    // la función de niebla necesita fogColor/fogNear, que three declara en <fog_pars_fragment>
    shader.fragmentShader = shader.fragmentShader.replace('#include <fog_pars_fragment>', `#include <fog_pars_fragment>
#if defined(ATMOS_NIEBLA) && defined(USE_FOG)${GLSL_NIEBLA}
#endif`);
  }
}

// los #define de unas banderas (para material.defines)
export function definesDe(f) {
  const d = {};
  if (f.tono) d.ATMOS_TONO = '';
  if (f.niebla) d.ATMOS_NIEBLA = '';
  if (f.cielo) d.ATMOS_CIELO = '';
  return d;
}
// aplica las banderas a unos materiales (solo recompila si cambiaron)
export function aplicarDefines(mats, f) {
  const base = definesDe(f);
  for (const m of mats) {
    if (!m) continue;
    // v12.6.2: ATMOS_AGUA solo en el material del agua (los demás no se recompilan por ella)
    // v12.8.0: ATMOS_AGUA también en el agua lejana del lod («lejos»); POST_HDR (emisores por encima de 1) solo en los bloques
    const nom = m.userData.atmosNombre, d = { ...base };
    if (f.agua && (nom === 'agua' || nom === 'lejos')) d.ATMOS_AGUA = '';
    if (f.bloom && nom === 'bloques') d.POST_HDR = '';
    const clave = Object.keys(d).join(',');
    if (m.userData.atmosClave === clave) continue;
    m.userData.atmosClave = clave;
    m.defines = { ...(m.defines || {}) };
    for (const k of ['ATMOS_TONO', 'ATMOS_NIEBLA', 'ATMOS_CIELO', 'ATMOS_AGUA', 'POST_HDR']) delete m.defines[k];
    Object.assign(m.defines, d);
    const nombre = m.userData.atmosNombre || m.name || m.type; // fijo por material (no el uuid: cada mundo volvería a compilar)
    m.customProgramCacheKey = () => `${nombre}|${clave}`; // v12.4.1: con el nombre del material
    m.needsUpdate = true;
  }
}

// bruma por bioma (v12.1.1): un TINTE sobre el color del cielo (no un gris) y cuánto
const BRUMA = {
  jungle: [0.9, 1.06, 0.92, 0.5], selva: [0.9, 1.06, 0.92, 0.5], swamp: [0.88, 1.04, 0.86, 0.55], manglar: [0.9, 1.04, 0.9, 0.45],
  desert: [1.12, 0.98, 0.8, 0.45], bosque_seco: [1.08, 0.98, 0.84, 0.35], savanna: [1.08, 0.98, 0.84, 0.3],
  paramo: [0.94, 0.98, 1.1, 0.45], mountains: [0.94, 0.98, 1.08, 0.35], snowy: [0.98, 1.0, 1.06, 0.35],
  beach: [0.96, 1.02, 1.08, 0.3], ocean: [0.94, 1.0, 1.1, 0.35], forest: [0.94, 1.04, 0.96, 0.3], plains: [1.0, 1.0, 1.0, 0.1],
};

// cada cuadro: la hora, el sol y la bruma (lo llama game.js después del cielo)
export function actualizarAtmosfera(g, dt, f, bajoAgua = false) {
  const ang = g.time * Math.PI * 2, sunH = Math.sin(ang);
  ATMOS.uSunDir.value.set(Math.cos(ang), Math.sin(ang), 0.15).normalize();
  const dorada = sunH > -0.2 ? Math.max(0, 1 - Math.abs(sunH - 0.05) * 2.2) : 0; // 1 justo al ponerse o salir el sol
  const noche = 1 - THREE.MathUtils.clamp((sunH + 0.25) / 0.3, 0, 1);
  const over = g.weather ? g.weather.intensity : 0;
  { const R16 = ((g.world && g.world.renderDistance) || 6) * 16; ATMOS.uAgua.value.set(R16 * 0.5, R16 * 0.92, over); } // v12.6.5: el agua cercana se funde con la del lod
  const infra = g.dim === 'inframundo';
  ATMOS.uHora.value.set(infra ? 0 : dorada * (1 - over * 0.8), noche);
  // el color del sol: blanco cálido de día, naranja fuerte al ponerse
  ATMOS.uSunCol.value.setRGB(1.0, 0.86 - dorada * 0.34, 0.66 - dorada * 0.42).multiplyScalar(Math.max(0.2, g.daylight || 1) * (1 - over * 0.6) * (1 + dorada * 0.25));
  // gradación: la luz directa ámbar/naranja y las sombras azul-violeta al atardecer; de noche, azul de luna; al mediodía, casi nada
  ATMOS.uLuzTinte.value.setRGB(1.22, 0.93, 0.68);
  ATMOS.uSombraTinte.value.setRGB(0.07 * dorada + 0.02 * noche, 0.035 * dorada + 0.035 * noche, 0.13 * dorada + 0.085 * noche);
  const sin = infra ? 0 : 1 - over * 0.7;
  ATMOS.uGrado.value.set(dorada * 0.62 * sin, (dorada * 0.8 + noche * 0.55) * sin, infra ? 0.05 : 0.05 + dorada * 0.14 - noche * 0.04 - over * 0.1, infra ? 0 : (0.03 + dorada * 0.12) * sin);
  // niebla de altura: más en la mañana y al atardecer, nada bajo el agua ni en el inframundo
  const nieblaOn = f.niebla && !infra && !bajoAgua && g.dim !== 'cielo';
  ATMOS.uNiebla.value.set(nieblaOn ? 0.5 + dorada * 0.4 + over * 0.6 : 0, 0.045, 64, nieblaOn ? 0.3 + dorada * 0.7 : 0);
  // bruma del bioma (suave al cambiar)
  const b = f.bruma && nieblaOn && g.env ? BRUMA[g.env.biome] : null;
  const B = ATMOS.uBruma.value, k = Math.min(1, dt * 0.5);
  const meta = b ? [b[0], b[1], b[2], b[3]] : [B.x, B.y, B.z, 0];
  B.set(B.x + (meta[0] - B.x) * k, B.y + (meta[1] - B.y) * k, B.z + (meta[2] - B.z) * k, B.w + (meta[3] - B.w) * k);
  return dorada;
}
