// Pasarela de modelos: arma las criaturas en un escenario neutro y deja la imagen encima de la página, para revisarlas de cerca.
// En la consola: const { pasarela } = await import('/tools/pasarela.js'); await pasarela(['escarabajo', 'sapo_bufo'], { cols: 2 });
import * as THREE from 'three';

export async function pasarela(tipos, { cols = 4, paso = 1.9, dist = 8.4, giro = 0.6, altoFila = 2.3, alto = 1.2, ajuste = null } = {}) {
  const g = window.nanoblocks.game; g.running = false;
  const sc = new THREE.Scene(); sc.background = new THREE.Color(0x8fa8b8);
  const filas = Math.ceil(tipos.length / cols), p = g.player.body.pos;
  tipos.forEach((t, i) => {
    // 'vecino:rol:semilla' viste a un vecino de ese oficio
    const [tipo, rol, semilla] = t.split(':');
    let m = g.entities.mobs.find((o) => o.type === tipo);
    if (!m) m = g.entities.spawnMob(tipo, p.x, p.y + 3, p.z);
    const grp = m.kind.build(), f = Math.floor(i / cols);
    if (rol) m.kind.dress({ group: grp, data: { role: rol, seed: Number(semilla) || 1 } });
    grp.position.set((i % cols) * paso - ((cols - 1) * paso) / 2, ((filas - 1) / 2 - f) * altoFila - 0.3, 0);
    if (grp.userData.segs) grp.userData.segs.forEach((q, k) => { q.position.z = -0.12 - k * 0.36; }); // los cuerpos largos, estirados
    if (ajuste) ajuste(grp, t, i);
    grp.rotation.y = giro; sc.add(grp);
  });
  const c = g.renderer.domElement, cam = new THREE.PerspectiveCamera(32, c.width / c.height, 0.1, 100);
  cam.position.set(0, alto, dist); cam.lookAt(0, 0.1, 0);
  g.renderer.setRenderTarget(null); g.renderer.render(sc, cam);
  const url = c.toDataURL('image/jpeg', 0.92);
  for (const e of document.body.children) if (e.id !== 'pasarela') e.style.visibility = 'hidden';
  let im = document.getElementById('pasarela');
  if (!im) { im = document.createElement('img'); im.id = 'pasarela'; im.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:99999;object-fit:contain;background:#000'; document.body.appendChild(im); }
  im.src = url;
  await new Promise((r) => { setTimeout(r, 300); });
  return tipos.length;
}
