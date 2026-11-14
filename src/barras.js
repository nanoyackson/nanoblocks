// Barras de vida sobre las criaturas (v6.0): cuando uno le pega a algo (o algo le pega a uno), sobre su cabeza aparece una barrita con
// lo que le queda, por unos segundos. Se pone amarilla y después roja según baja, y deja ver el pedazo recién perdido (se va vaciando
// atrasado). Los jefes no la llevan: ellos tienen la barra grande de arriba. Se hace con sprites compartidos (sin texturas nuevas).
import * as THREE from 'three';

const ANCHO = 0.9, ALTO = 0.09, DURA = 5;
let mats = null;
const material = () => (mats ||= {
  fondo: new THREE.SpriteMaterial({ color: 0x101010, transparent: true, opacity: 0.75, depthWrite: false, fog: false }),
  perdido: new THREE.SpriteMaterial({ color: 0xf0f0e0, transparent: true, opacity: 0.85, depthWrite: false, fog: false }),
  verde: new THREE.SpriteMaterial({ color: 0x5ad040, depthWrite: false, fog: false }),
  amarillo: new THREE.SpriteMaterial({ color: 0xf0c830, depthWrite: false, fog: false }),
  rojo: new THREE.SpriteMaterial({ color: 0xe03a2a, depthWrite: false, fog: false }),
});
function armar(m) {
  const M = material(), g = new THREE.Group();
  const s = (mt, z) => { const q = new THREE.Sprite(mt); q.center.set(0, 0.5); q.renderOrder = 15 + z; q.userData.glow = true; g.add(q); return q; };
  const fondo = s(M.fondo, 0), perdido = s(M.perdido, 1), vida = s(M.verde, 2);
  fondo.scale.set(ANCHO + 0.06, ALTO + 0.05, 1); fondo.position.x = -(ANCHO + 0.06) / 2;
  perdido.position.x = -ANCHO / 2; vida.position.x = -ANCHO / 2;
  m.group.add(g);
  return { g, perdido, vida, atras: 1 };
}
// cada cuadro
export function cuadroBarras(g, dt) {
  const ck = g.clock || 0;
  for (const m of g.entities.mobs) {
    const B = m.barraVida;
    const ver = !m.dead && !m.dying && !m.kind.boss && m.data.golpeT !== undefined && ck - m.data.golpeT < DURA && m.group;
    if (!ver) { if (B) B.g.visible = false; continue; }
    const b = B || (m.barraVida = armar(m));
    b.g.visible = true;
    const u = m.group.userData, esc = (u && u.babyScale) || 1;
    // encima de la cabeza (en el espacio del modelo), del mismo tamaño en pantalla aunque la criatura sea grande o chiquita
    b.g.position.set(0, (m.kind.h || 1) / esc + 0.25 / esc + (m.data.estrellas ? 0.35 / esc : 0), 0);
    b.g.scale.setScalar(1 / esc);
    b.g.quaternion.copy(m.group.quaternion).invert(); // que no gire con la criatura (los sprites cuelgan de un lado)
    const max = Math.max(m.data.vmax || 0, m.kind.health || 1, m.health), f = Math.max(0, Math.min(1, m.health / max));
    b.atras += (f - b.atras) * Math.min(1, dt * 2.5); if (b.atras < f) b.atras = f;
    b.vida.scale.set(Math.max(0.001, ANCHO * f), ALTO, 1);
    b.perdido.scale.set(Math.max(0.001, ANCHO * b.atras), ALTO, 1);
    const M = material();
    b.vida.material = f > 0.5 ? M.verde : f > 0.25 ? M.amarillo : M.rojo;
  }
}
