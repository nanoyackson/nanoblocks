// El arcoíris: cuando escampa de día con el sol afuera, muchas veces sale un arcoíris del lado contrario del sol (y a veces doble,
// con los colores al revés por fuera). Dura un minuto y medio y se va desvaneciendo. Es de ver.
// Estado: g.arcoCielo (no se guarda), g.llovia (si estaba lloviendo el segundo anterior).
import * as THREE from 'three';

const COL = [0xff3030, 0xff9a20, 0xffe040, 0x40d040, 0x3090ff, 0x4a40c0, 0x9a40d0], DURA = 90, D = 800;
function arco(radio, banda, colores, op) {
  const g = new THREE.Group();
  colores.forEach((c, i) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(radio - i * banda, banda * 0.55, 4, 64, Math.PI), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    m.userData.op = op; m.renderOrder = -1; g.add(m);
  });
  return g;
}
export function limpiarArcoirisCielo(g) {
  const A = g.arcoCielo;
  if (!A) return;
  g.scene.remove(A.grupo);
  A.grupo.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  g.arcoCielo = null;
}
// cada segundo: ¿escampó con sol?
export function tickArcoirisCielo(g) {
  const W = g.weather, llueve = !!(W && W.type !== 'clear');
  const escampo = g.llovia && !llueve;
  g.llovia = llueve;
  if (g.arcoCielo || !escampo || g.dim !== 'tierra' || (g.time || 0) < 0.04 || (g.time || 0) > 0.4 || Math.random() > 0.6) return;
  empezar(g, Math.random() < 0.3);
}
function empezar(g, doble) {
  const grupo = new THREE.Group(), R = D * Math.tan((42 * Math.PI) / 180);
  grupo.add(arco(R, 9, COL, 0.38));
  if (doble) grupo.add(arco(R * 1.22, 10, [...COL].reverse(), 0.2));
  g.scene.add(grupo);
  g.arcoCielo = { grupo, t: 0, doble };
  g.ui.toast(doble ? '🌈 ¡Arcoíris doble! Mire para el lado contrario del sol' : '🌈 Escampó y salió el arcoíris', 3200);
  g.achieve('arcoiris_cielo', 'Arcoíris después del aguacero');
  if (doble) g.achieve('arcoiris_doble', 'Arcoíris doble');
}
// cada cuadro: siempre del lado contrario del sol, lejos, y apareciendo y desapareciendo despacito
export function cuadroArcoirisCielo(g, dt) {
  const A = g.arcoCielo;
  if (!A) return;
  A.t += dt;
  if (A.t > DURA || g.dim !== 'tierra') { limpiarArcoirisCielo(g); return; }
  const k = Math.min(1, A.t / 6, (DURA - A.t) / 10);
  const cam = g.camera.position, s = g.sky && g.sky.sun ? g.sky.sun.position : { x: 1, y: 1, z: 0 };
  const l = Math.hypot(s.x, s.z) || 1, ax = -s.x / l, az = -s.z / l;
  A.grupo.position.set(cam.x + ax * D, cam.y - 140, cam.z + az * D);
  A.grupo.rotation.set(0, Math.atan2(ax, az), 0);
  A.grupo.traverse((o) => { if (o.isMesh) o.material.opacity = o.userData.op * k; });
}
export function pruebaArcoirisCielo(g) {
  limpiarArcoirisCielo(g);
  g.time = Math.min(Math.max(g.time || 0.2, 0.08), 0.35);
  empezar(g, true);
  return 'Arcoíris doble, del lado contrario del sol';
}
