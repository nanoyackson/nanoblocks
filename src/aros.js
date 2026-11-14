// Circuito de aros: con la bandera de circuito (clic derecho) aparecen 8 aros grandes en el cielo, en una vuelta
// alrededor de uno. Hay que pasarlos en orden (el que toca brilla amarillo) en avioneta o en parapente; el cronómetro
// arranca en el primero y en el último se anota el tiempo (y el récord). Otro clic derecho con la bandera lo quita.
import * as THREE from 'three';

export const BANDERA = 478;
const N = 8, R_ARO = 5.5;

export function usarBandera(g) {
  if (g.aros) { quitar(g); g.ui.toast('🏁 Quitó el circuito de aros', 1400); return; }
  if (g.dim !== 'tierra') { g.ui.toast('Aquí no se puede armar el circuito', 1400); return; }
  const p = g.player.body.pos;
  const radio = 70, base = Math.max(p.y, g.world.gen.column(Math.floor(p.x), Math.floor(p.z)).h) + 22;
  const aros = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const x = p.x + Math.cos(a) * radio, z = p.z + Math.sin(a) * radio;
    const suelo = g.world.gen.column(Math.floor(x), Math.floor(z)).h;
    const y = Math.max(base + Math.sin(i * 1.9) * 12, suelo + 14);
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(R_ARO, 0.45, 8, 28), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }));
    mesh.position.set(x, y, z);
    // el aro mira en la dirección de la vuelta (tangente)
    mesh.rotation.y = -a;
    mesh.scale.setScalar(0.01);
    g.scene.add(mesh);
    aros.push({ mesh, x, y, z, t: -i * 0.12, pulso: 0, meta: 1 });
  }
  g.aros = { aros, sig: 0, t0: 0, creado: g.clock || 0 };
  pintar(g);
  g.ui.toast('🏁 ¡8 aros en el cielo! Páselos en orden (el amarillo sigue), en avioneta o parapente', 3800);
  g.achieve('circuito', 'Armé un circuito');
}
function pintar(g) {
  const A = g.aros;
  A.aros.forEach((r, i) => {
    const sig = i === A.sig;
    r.mesh.material.color.setHex(i < A.sig ? 0x5aff7a : sig ? 0xffd030 : 0xffffff);
    r.mesh.material.opacity = sig ? 0.95 : i < A.sig ? 0.25 : 0.5;
    r.meta = sig ? 1.12 : 1;
  });
}
function quitar(g) {
  for (const r of (g.aros && g.aros.aros) || []) { g.scene.remove(r.mesh); r.mesh.geometry.dispose(); r.mesh.material.dispose(); }
  g.aros = null;
}
export function limpiarAros(g) { quitar(g); }

export function tickAros(g, dt) {
  const A = g.aros;
  if (!A) return;
  if ((g.clock || 0) - A.creado > 600) { quitar(g); g.ui.toast('🏁 El circuito de aros se desarmó', 1600); return; }
  // aparecen uno tras otro con rebote; el que sigue respira; el recién pasado da un latido
  for (const a of A.aros) {
    a.t += dt;
    const k = Math.max(0, Math.min(1, a.t / 0.45)), e = k - 1;
    const base = k <= 0 ? 0.01 : 1 + 2.4 * e * e * e + 1.4 * e * e;
    a.pulso = Math.max(0, a.pulso - dt * 2.5);
    a.mesh.scale.setScalar(Math.max(0.01, base * a.meta * (1 + Math.sin(a.pulso * Math.PI) * 0.35)));
  }
  const r = A.aros[A.sig];
  r.mesh.rotation.z += dt * 1.5;
  r.meta = 1.1 + Math.sin((g.clock || 0) * 4) * 0.04;
  const q = g.riding ? g.riding.body.pos : g.player.body.pos;
  const cy = g.riding ? q.y + 1 : q.y + 1;
  if (Math.hypot(q.x - r.x, cy - r.y, q.z - r.z) < R_ARO + 0.8) {
    if (A.sig === 0) A.t0 = g.clock || 0;
    r.pulso = 1;
    A.sig++;
    g.audio.play('click', { ui: true, vol: 0.9, pitch: 1.2 + A.sig * 0.08 });
    g.particles.burst(r.x, r.y, r.z, [[1, 0.85, 0.2], [1, 1, 1]], 30, 5);
    if (A.sig >= N) {
      const t = (g.clock || 0) - A.t0;
      const rec = g.meta.arosRecord;
      const nuevo = !rec || t < rec;
      if (nuevo) g.meta.arosRecord = t;
      g.audio.play('aplausos', { ui: true, vol: 0.6 });
      g.ui.toast(`🏁 ¡Circuito completo en ${t.toFixed(1)} s!${nuevo ? ' ¡NUEVO RÉCORD!' : ` (récord: ${rec.toFixed(1)} s)`}`, 4200);
      g.achieve('circuito_completo', 'Ocho de ocho');
      if (t < 45) g.achieve('circuito_rapido', 'As del aire');
      quitar(g);
      return;
    }
    g.ui.toast(`🏁 Aro ${A.sig} de ${N}${A.sig === 1 ? ' · ¡arrancó el cronómetro!' : ` · ${((g.clock || 0) - A.t0).toFixed(1)} s`}`, 1200);
    pintar(g);
  }
}
