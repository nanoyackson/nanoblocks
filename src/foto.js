// Modo foto (F2): la cámara se separa del personaje y vuela libre (W/A/S/D, Espacio sube, Shift baja, Ctrl más
// rápido, la rueda acerca o aleja); el personaje se queda quieto y se ve, y Enter guarda la foto en Descargas.
// Cámara cinematográfica: 1 guarda un punto, 2 reproduce el recorrido suave entre los puntos, 3 los borra.
// Z congela el tiempo (todo se queda quieto) y X cambia el filtro (normal, blanco y negro, sepia, colores vivos).
// C pone cámara lenta (½, ¼, ⅒; la cámara se sigue moviendo normal), V pone barras de cine (formato película) y
// T pone time-lapse (el día corre ×60, ×200 o ×600) y O la toma de dron (la cámara gira sola alrededor del personaje).

import { REGIONES, regionAt } from './regiones.js';

export function toggleFoto(g) {
  if (g.foto) {
    g.player.yaw = g.foto.yaw; g.player.pitch = g.foto.pitch;
    g.foto = null;
    if (g.congelado) { g.congelado = false; g.paused = false; }
    g.fotoFiltro = '';
    g.camaraLenta = 0; g.timelapse = 0;
    barras(false);
    g.hudHidden = g.fotoHudPrev || false;
    g.ui.setHudHidden(g.hudHidden);
    document.body.classList.remove('modo-foto');
    g.ui.toast('📷 Modo foto apagado', 1200);
    return;
  }
  const c = g.camera.position, b = g.player.body.pos;
  g.foto = { x: c.x, y: c.y, z: c.z, ancla: { x: b.x, y: b.y, z: b.z }, fov: g.settings.fov, yaw: g.player.yaw, pitch: g.player.pitch };
  g.fotoHudPrev = g.hudHidden;
  g.hudHidden = true;
  g.ui.setHudHidden(true);
  document.body.classList.add('modo-foto');
  g.ui.toast('📷 Modo foto: WASD mueve · Espacio/Shift sube y baja · rueda zoom · Enter foto (más en la ayuda)', 6000);
  g.achieve('foto', 'Fotógrafo de NanoBlocks');
}

// cada cuadro, antes de la física: el personaje queda quieto y la cámara se mueve
export function tickFoto(g, dt) {
  const F = g.foto;
  if (!F) return false;
  const k = g.keys, p = g.player, b = p.body;
  if (F.ruta) { reproducir(g, F, dt); return true; }
  if (F.dron) { dron(g, F, dt); return true; }
  b.pos.x = F.ancla.x; b.pos.y = F.ancla.y; b.pos.z = F.ancla.z; b.vel.x = b.vel.y = b.vel.z = 0;
  const v = (k.has('ControlLeft') || k.has('ControlRight') ? 22 : 7) * dt;
  const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw), cp = Math.cos(p.pitch), sp = Math.sin(p.pitch);
  const rx = Math.cos(p.yaw), rz = -Math.sin(p.yaw);
  if (k.has('KeyW')) { F.x += fx * cp * v; F.y += sp * v; F.z += fz * cp * v; }
  if (k.has('KeyS')) { F.x -= fx * cp * v; F.y -= sp * v; F.z -= fz * cp * v; }
  if (k.has('KeyD')) { F.x += rx * v; F.z += rz * v; }
  if (k.has('KeyA')) { F.x -= rx * v; F.z -= rz * v; }
  if (k.has('Space')) F.y += v;
  if (k.has('ShiftLeft') || k.has('ShiftRight')) F.y -= v;
  return true;
}

// después de acomodar la cámara normal: la pone donde está la de la foto
export function camaraFoto(g) {
  const F = g.foto;
  if (!F) return;
  g.camera.position.set(F.x, F.y, F.z);
  g.camera.rotation.set(g.player.pitch, g.player.yaw, 0);
  if (Math.abs(g.camera.fov - F.fov) > 0.01) { g.camera.fov = F.fov; g.camera.updateProjectionMatrix(); }
}
export function zoomFoto(g, dy) {
  if (!g.foto) return false;
  g.foto.fov = Math.max(15, Math.min(110, g.foto.fov + (dy > 0 ? 4 : -4)));
  return true;
}

// Enter: la próxima imagen se guarda (justo después de dibujarla, cuando el lienzo todavía la tiene)
export function pedirFoto(g) { if (g.foto) g.fotoPendiente = true; }
export function guardarSiToca(g) {
  if (!g.fotoPendiente) return;
  g.fotoPendiente = false;
  try {
    const url = g.renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    const d = new Date();
    a.download = `nanoblocks-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}.png`;
    a.href = url;
    document.body.appendChild(a); a.click(); a.remove();
    g.audio.play('click', { ui: true, vol: 0.8, pitch: 0.7 });
    const fl = document.createElement('div'); fl.className = 'flash-foto'; document.getElementById('hud').appendChild(fl); setTimeout(() => fl.remove(), 500);
    g.meta.fotos = (g.meta.fotos || 0) + 1;
    if (g.meta.fotos >= 10) g.achieve('fotos10', 'Álbum de viaje');
  } catch { g.ui.toast('No se pudo guardar la foto', 1600); }
}

// ---------- cámara cinematográfica, congelar y filtros ----------
const FILTROS = [['', 'normal'], ['grayscale(1) contrast(1.1)', 'blanco y negro'], ['sepia(0.85) contrast(1.05)', 'sepia'], ['saturate(1.8) contrast(1.1)', 'colores vivos']];
export function fotoTecla(g, code) {
  const F = g.foto;
  if (!F) return false;
  const p = g.player;
  if (code === 'Digit1') {
    F.puntos = F.puntos || [];
    F.puntos.push({ x: F.x, y: F.y, z: F.z, yaw: p.yaw, pitch: p.pitch, fov: F.fov });
    g.ui.toast(`🎬 Punto ${F.puntos.length} guardado (2 reproduce el recorrido)`, 1400);
    return true;
  }
  if (code === 'Digit2') {
    if (!F.puntos || F.puntos.length < 2) { g.ui.toast('Guarde por lo menos 2 puntos con el 1', 1600); return true; }
    F.ruta = { t: 0, seg: 3 };
    g.ui.toast('🎬 ¡Acción! (cualquier tecla de movimiento lo detiene)', 1600);
    g.achieve('cine', 'Director de cine');
    return true;
  }
  if (code === 'Digit3') { F.puntos = []; F.ruta = null; g.ui.toast('🎬 Puntos borrados', 1200); return true; }
  if (code === 'KeyZ') {
    g.congelado = !g.congelado; g.paused = g.congelado;
    g.ui.toast(g.congelado ? '⏸ Tiempo congelado' : '▶ El tiempo sigue', 1200);
    return true;
  }
  if (code === 'KeyC') {
    const pasos = [0, 0.5, 0.25, 0.1];
    g.camaraLenta = pasos[(pasos.indexOf(g.camaraLenta || 0) + 1) % pasos.length];
    g.ui.toast(g.camaraLenta ? `🐢 Cámara lenta: ×${g.camaraLenta}` : '▶ Velocidad normal', 1200);
    if (g.camaraLenta) g.achieve('camara_lenta', 'Todo en cámara lenta');
    return true;
  }
  if (code === 'KeyY') {
    // el cartel de título para el video: nombre del mundo, el día y la región, entra y sale con animación
    document.getElementById('titulo-video')?.remove();
    const el = document.createElement('div');
    el.id = 'titulo-video';
    const p = g.player.body.pos, reg = REGIONES[regionAt(g.world.gen, p.x, p.z)];
    const hora = g.daylight > 0.6 ? 'de día' : g.daylight > 0.3 ? 'al atardecer' : 'de noche';
    el.innerHTML = `<small>NanoBlocks presenta</small><b>${(g.meta.name || 'Mi mundo').replace(/[<>&]/g, '')}</b><span>Día ${g.day || 1} · ${reg ? reg.name : 'Tiquicia'} · ${hora}</span>`;
    document.getElementById('hud').appendChild(el);
    setTimeout(() => el.classList.add('sale'), 3800);
    setTimeout(() => el.remove(), 4800);
    g.achieve('titulo', 'Con título y todo');
    return true;
  }
  if (code === 'KeyO') {
    const a = F.ancla;
    if (!F.dron) {
      const dx = F.x - a.x, dz = F.z - a.z;
      F.dron = { ang: Math.atan2(dz, dx), r: Math.max(4, Math.hypot(dx, dz)), h: Math.max(1.5, F.y - a.y), vel: 0, meta: 0.3 };
      g.ui.toast('🚁 Toma de dron (O otra vez: más rápido · una tecla de movimiento la para)', 1800);
      g.achieve('dron', 'Toma de dron');
    } else if (F.dron.meta < 0.6) { F.dron.meta = 0.75; g.ui.toast('🚁 Dron rápido', 1000); }
    else { F.dron = null; g.ui.toast('🚁 Dron apagado', 1000); }
    return true;
  }
  if (code === 'KeyT') {
    const pasos = [0, 60, 200, 600];
    g.timelapse = pasos[(pasos.indexOf(g.timelapse || 0) + 1) % pasos.length];
    g.ui.toast(g.timelapse ? `🌅 Time-lapse ×${g.timelapse}` : '▶ El tiempo va normal', 1200);
    if (g.timelapse) g.achieve('timelapse', 'Atardecer en time-lapse');
    return true;
  }
  if (code === 'KeyV') {
    const on = !document.getElementById('barras-cine');
    barras(on);
    g.ui.toast(on ? '🎬 Barras de cine' : '🎬 Sin barras', 1000);
    return true;
  }
  if (code === 'KeyX') {
    g.fotoFiltroI = ((g.fotoFiltroI || 0) + 1) % FILTROS.length;
    g.fotoFiltro = FILTROS[g.fotoFiltroI][0];
    g.ui.toast(`🎞 Filtro: ${FILTROS[g.fotoFiltroI][1]}`, 1200);
    return true;
  }
  return false;
}
function barras(on) {
  const b = document.getElementById('barras-cine');
  if (on && !b) { const e = document.createElement('div'); e.id = 'barras-cine'; e.innerHTML = '<i></i><i></i>'; document.getElementById('hud').appendChild(e); }
  if (!on && b) b.remove();
}
// el dron: da vueltas alrededor del personaje (arranca suave), sube y baja un poquito y siempre lo mira
function dron(g, F, dt) {
  const D = F.dron, k = g.keys, a = F.ancla;
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].some((c) => k.has(c))) { F.dron = null; return; }
  D.vel += (D.meta - D.vel) * Math.min(1, dt * 1.5);
  D.ang += D.vel * dt;
  D.t = (D.t || 0) + dt;
  F.x = a.x + Math.cos(D.ang) * D.r; F.z = a.z + Math.sin(D.ang) * D.r;
  F.y = a.y + D.h + Math.sin(D.t * 0.6) * 0.6;
  const dx = a.x - F.x, dy = a.y + 1.4 - F.y, dz = a.z - F.z;
  g.player.yaw = Math.atan2(-dx, -dz);
  g.player.pitch = Math.atan2(dy, Math.hypot(dx, dz));
}
// Catmull-Rom entre los puntos guardados (segmentos de 3 s)
const cr = (a, b, c, d, t) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
function angulo(a, b) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d; }
function reproducir(g, F, dt) {
  const R = F.ruta, P = F.puntos, k = g.keys;
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].some((c) => k.has(c))) { F.ruta = null; return; }
  R.t += dt;
  const n = P.length - 1, u = Math.min(n - 1e-6, R.t / R.seg), i = Math.floor(u), t = u - i;
  const q = (j) => P[Math.max(0, Math.min(n, j))];
  const a = q(i - 1), b = q(i), c = q(i + 1), d = q(i + 2);
  // los ángulos «desenvueltos» para que no den la vuelta larga
  const yb = b.yaw, yc = angulo(yb, c.yaw), ya = angulo(yb, a.yaw), yd = angulo(yc, d.yaw);
  F.x = cr(a.x, b.x, c.x, d.x, t); F.y = cr(a.y, b.y, c.y, d.y, t); F.z = cr(a.z, b.z, c.z, d.z, t);
  g.player.yaw = cr(ya, yb, yc, yd, t); g.player.pitch = cr(a.pitch, b.pitch, c.pitch, d.pitch, t);
  F.fov = cr(a.fov, b.fov, c.fov, d.fov, t);
  if (R.t >= n * R.seg) { F.ruta = null; g.ui.toast('🎬 ¡Corte! (2 lo repite)', 1400); }
}
