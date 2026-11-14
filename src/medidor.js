// v12.5.0 (PLAN_GRAFICOS_2.md §1): medir la GPU. El «ms» del panel es solo CPU: un efecto que cuesta 3 ms de GPU no lo mueve y los
// fps se quedan pegados al vsync. Aquí: el tiempo real de GPU de cada cuadro (EXT_disjoint_timer_query_webgl2, si el navegador la
// tiene; en Safari y Firefox por defecto no: «gpu —»), las llamadas, los triángulos y la memoria, y window.nanoblocks.costo(): una
// prueba que no depende de requestAnimationFrame (sirve con el panel oculto). Ojo: con el panel
// oculto el navegador puede limitar el dibujo; lo que vale es la diferencia entre «sin» y «con» medidas igual.
let ext = null, gl = null, listo = false;
const pendientes = [], muestras = [];

function iniciar(renderer) {
  listo = true;
  gl = renderer.getContext();
  ext = gl && gl.getExtension ? gl.getExtension('EXT_disjoint_timer_query_webgl2') : null;
  renderer.info.autoReset = false; // las tres pasadas del cuadro se cuentan juntas (se reinicia en empezarCuadro)
}

// al empezar a dibujar un cuadro
export function empezarCuadro(renderer, activo = true) {
  if (!listo) iniciar(renderer);
  renderer.info.reset();
  if (!activo) { if (pendientes.length && gl) { for (const q of pendientes) gl.deleteQuery(q); pendientes.length = 0; muestras.length = 0; } return null; } // v12.5.2: sin panel, nada
  if (!ext) return null;
  // se recogen las consultas viejas que ya tengan respuesta
  while (pendientes.length) {
    const q = pendientes[0];
    if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) break;
    pendientes.shift();
    if (!gl.getParameter(ext.GPU_DISJOINT_EXT)) { muestras.push(gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6); if (muestras.length > 60) muestras.shift(); }
    gl.deleteQuery(q);
  }
  if (pendientes.length > 8) return null; // la GPU va atrasada: no se apilan más
  const q = gl.createQuery();
  gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
  return q;
}
export function terminarCuadro(q) {
  if (!q || !ext) return;
  gl.endQuery(ext.TIME_ELAPSED_EXT);
  pendientes.push(q);
}

// lo que dice el panel
export function lecturaGPU() { return ext && muestras.length ? muestras.reduce((a, b) => a + b, 0) / muestras.length : null; }
export function textoMedidor(renderer) {
  const i = renderer.info, gpu = lecturaGPU();
  const k = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} M` : n >= 1e3 ? `${Math.round(n / 1e3)} k` : `${n}`);
  return `gpu ${gpu === null ? '—' : `${gpu.toFixed(1)} ms`} · ${i.render.calls} llamadas · ${k(i.render.triangles)} triángulos · ${i.memory.textures} tex`;
}

// window.nanoblocks.costo(clave): cuánto cuesta una bandera de calidad (tono, niebla, cielo, bruma, nitidez) dibujando 120 cuadros
// seguidos con la cámara quieta, sin y con la bandera, esperando a la GPU (gl.finish). Devuelve ms por cuadro y la diferencia
export function costo(game, clave, n = 120) {
  const s = game.settings, antes = { calidad: s.calidad, video: s.video, perf: s.perf };
  s.perf = true; // mientras mide, el medidor encendido
  const medir = (on) => {
    s.calidad = 'personalizado'; s.video = { ...(antes.calidad === 'personalizado' ? antes.video : {}), [clave]: on };
    game.render(1 / 60); game.renderer.getContext().finish();
    const t0 = performance.now();
    for (let i = 0; i < n; i++) game.render(0);
    game.renderer.getContext().finish();
    return (performance.now() - t0) / n;
  };
  try {
    medir(false); medir(true); // calentar: la primera vez se compilan los shaders
    let sin = 0, con = 0;
    for (let k = 0; k < 3; k++) { sin += medir(false); con += medir(true); } // alternado, para que el orden no pese
    sin /= 3; con /= 3;
    return { clave, sin: +sin.toFixed(3), con: +con.toFixed(3), delta: +(con - sin).toFixed(3) };
  } finally { s.calidad = antes.calidad; s.video = antes.video; s.perf = antes.perf; }
}
// para depurar desde la consola
export function estadoMedidor() { return { ext: !!ext, pendientes: pendientes.length, muestras: muestras.length, listo }; }
