// Kit de modelado low-poly (v8.6): volúmenes de verdad en vez de cajas. Una Pieza junta bultos (elipsoides deformables) y tubos
// (patas, cuernos y antenas que se afinan) en una sola malla, con el sombreado horneado en los vértices: cara por cara, luz de arriba,
// panza oscura, grano y un brillo opcional para los caparazones. El material es básico, así que tintModel la sigue oscureciendo con
// la luz del mundo como a todo lo demás. Todo se calcula al armar la criatura; por cuadro no cuesta nada.
import * as THREE from 'three';

const LUZ = new THREE.Vector3(0.35, 0.85, 0.4).normalize();
const MEDIO = new THREE.Vector3(0.2, 0.8, 0.75).normalize();
const AB = new THREE.Vector3(), AC = new THREE.Vector3(), N = new THREE.Vector3(), M = new THREE.Vector3(), U = new THREE.Vector3(), C = new THREE.Color();
const ruido = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };

export class Pieza {
  constructor() { this.pos = []; this.col = []; }
  // un triángulo ya en su lugar; `u` es el punto de referencia para pintar (espacio propio de la pieza)
  tri(a, b, c, color, o, u) {
    AB.subVectors(b, a); AC.subVectors(c, a); N.crossVectors(AB, AC).normalize();
    M.copy(a).add(b).add(c).divideScalar(3);
    const pintado = o.pinta ? o.pinta(u, N) : null;
    C.set(pintado ?? color);
    const dif = Math.max(0, N.dot(LUZ)), panza = Math.max(0, -N.y);
    let k = (o.amb ?? 0.66) + dif * 0.5 - panza * 0.2;
    k *= 1 + (ruido(M.x * 9, M.y * 9, M.z * 9) - 0.5) * (o.grano ?? 0.1);
    const sp = o.brillo ? Math.pow(Math.max(0, N.dot(MEDIO)), 18) * o.brillo * 0.55 : 0;
    const r = Math.min(1, C.r * k + sp), g = Math.min(1, C.g * k + sp), bl = Math.min(1, C.b * k + sp);
    this.pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    this.col.push(r, g, bl, r, g, bl, r, g, bl);
  }
  // elipsoide. o: x, y, z, rot [x,y,z], det (0–4), forma(v) deforma en la esfera unidad, pinta(u, n) devuelve un color o null
  bulto(color, rx, ry, rz, o = {}) {
    const geo = new THREE.IcosahedronGeometry(1, o.det ?? 2), at = geo.getAttribute('position');
    const eu = o.rot ? new THREE.Euler(o.rot[0], o.rot[1], o.rot[2]) : null;
    const vs = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], un = new THREE.Vector3();
    for (let i = 0; i < at.count; i += 3) {
      un.set(0, 0, 0);
      for (let k = 0; k < 3; k++) {
        const v = vs[k];
        v.fromBufferAttribute(at, i + k); un.add(v);
        if (o.forma) o.forma(v);
        v.set(v.x * rx, v.y * ry, v.z * rz);
        if (eu) v.applyEuler(eu);
        v.set(v.x + (o.x || 0), v.y + (o.y || 0), v.z + (o.z || 0));
      }
      U.copy(un).divideScalar(3);
      this.tri(vs[0], vs[1], vs[2], color, o, U);
    }
    geo.dispose();
    return this;
  }
  // tubo que pasa por `puntos` con su radio en cada uno. o: lados, pasos (suaviza la curva), pinta(u, n) con u.x = avance de 0 a 1
  tubo(color, puntos, radios, o = {}) {
    const lados = o.lados ?? 5, pasos = o.pasos ?? 4;
    const curva = new THREE.CatmullRomCurve3(puntos.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
    const n = (puntos.length - 1) * pasos, anillos = [], centros = [];
    const radio = (t) => { const f = t * (radios.length - 1), i = Math.min(radios.length - 2, Math.floor(f)); return radios[i] + (radios[i + 1] - radios[i]) * (f - i); };
    let ref = new THREE.Vector3(0, 0, 1);
    for (let i = 0; i <= n; i++) {
      const t = i / n, c = curva.getPoint(t), tg = curva.getTangent(t);
      if (Math.abs(ref.dot(tg)) > 0.95) ref = new THREE.Vector3(1, 0, 0);
      const a = new THREE.Vector3().crossVectors(tg, ref).normalize(), b = new THREE.Vector3().crossVectors(tg, a).normalize();
      ref = b.clone().negate(); // así el marco no se voltea de un anillo al otro
      const r = radio(t), anillo = [];
      for (let k = 0; k < lados; k++) { const ang = (k / lados) * Math.PI * 2; const rr = r * (o.pliegue ? o.pliegue(ang, t) : 1); anillo.push(c.clone().addScaledVector(a, Math.cos(ang) * rr).addScaledVector(b, Math.sin(ang) * rr)); }
      anillos.push(anillo); centros.push(c);
    }
    const hacia = (p, q, s, centro, t) => {
      // el orden que deja la cara mirando para afuera
      AB.subVectors(q, p); AC.subVectors(s, p); N.crossVectors(AB, AC);
      M.copy(p).add(q).add(s).divideScalar(3).sub(centro);
      U.set(t, 0, 0);
      if (N.dot(M) >= 0) this.tri(p, q, s, color, o, U); else this.tri(p, s, q, color, o, U);
    };
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, cen = centros[i].clone().add(centros[i + 1]).multiplyScalar(0.5);
      for (let k = 0; k < lados; k++) {
        const k2 = (k + 1) % lados, a = anillos[i][k], b = anillos[i][k2], c = anillos[i + 1][k], d = anillos[i + 1][k2];
        hacia(a, b, c, cen, t); hacia(b, d, c, cen, t);
      }
    }
    // tapas: que no se vea hueco por las puntas
    const tapa = (anillo, centro, afuera, t) => { const p = centro.clone().addScaledVector(afuera, 0.001); for (let k = 0; k < lados; k++) { const a = anillo[k], b = anillo[(k + 1) % lados]; AB.subVectors(a, p); AC.subVectors(b, p); N.crossVectors(AB, AC); U.set(t, 0, 0); if (N.dot(afuera) >= 0) this.tri(p, a, b, color, o, U); else this.tri(p, b, a, color, o, U); } };
    tapa(anillos[0], centros[0], curva.getTangent(0).negate(), 0);
    tapa(anillos[n], centros[n], curva.getTangent(1), 1);
    return this;
  }
  // superficie suave por secciones, de abajo para arriba: cada sección es { y, rx, rz, x, z } y entre ellas se interpola con curva.
  // Se sombrea por vértice (no por cara), así que no se ven facetas: es lo que se usa para los cuerpos.
  // o: lados, pasos, cuadrado (2 = elipse, más = caja redondeada), pinta(u) con u.a (vuelta de 0 a 1; 0.25 es el frente), u.t (de 0 a 1), u.y, u.x, u.z
  loft(color, secciones, o = {}) {
    const lados = o.lados ?? 20, pasos = o.pasos ?? 3, exp = 2 / (o.cuadrado ?? 2.3), n = (secciones.length - 1) * pasos;
    const campo = (k, def) => secciones.map((q) => q[k] ?? def);
    const cr = (v, f) => { const i = Math.min(v.length - 2, Math.floor(f)), t = f - i, p0 = v[Math.max(0, i - 1)], p1 = v[i], p2 = v[i + 1], p3 = v[Math.min(v.length - 1, i + 2)]; return 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t); };
    const Y = campo('y', 0), RX = campo('rx', 0), RZ = campo('rz', 0), X = campo('x', 0), Z = campo('z', 0);
    const P = [], cen = [];
    for (let i = 0; i <= n; i++) {
      const f = (i / n) * (secciones.length - 1), y = cr(Y, f), rx = Math.max(0.0001, cr(RX, f)), rz = Math.max(0.0001, cr(RZ, f)), cx = cr(X, f), cz = cr(Z, f), fila = [];
      for (let k = 0; k <= lados; k++) { const a = (k / lados) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a); fila.push(new THREE.Vector3(cx + Math.sign(c) * Math.abs(c) ** exp * rx, y, cz + Math.sign(sn) * Math.abs(sn) ** exp * rz)); }
      P.push(fila); cen.push(new THREE.Vector3(cx, y, cz));
    }
    const nor = P.map((fila, i) => fila.map((p, k) => {
      const ka = fila[(k + lados - 1) % lados], kb = fila[(k + 1) % lados], ia = P[Math.max(0, i - 1)][k], ib = P[Math.min(n, i + 1)][k];
      const v = new THREE.Vector3().crossVectors(new THREE.Vector3().subVectors(kb, ka), new THREE.Vector3().subVectors(ib, ia)).normalize();
      if (v.dot(new THREE.Vector3().subVectors(p, cen[i])) < 0) v.negate();
      return v;
    }));
    const tono = (nv, base) => {
      const dif = Math.max(0, nv.dot(LUZ)), panza = Math.max(0, -nv.y);
      const k = (o.amb ?? 0.68) + dif * 0.46 - panza * 0.16, sp = o.brillo ? Math.pow(Math.max(0, nv.dot(MEDIO)), 18) * o.brillo * 0.55 : 0;
      return [Math.min(1, base.r * k + sp), Math.min(1, base.g * k + sp), Math.min(1, base.b * k + sp)];
    };
    const u = { a: 0, t: 0, x: 0, y: 0, z: 0 }, base = new THREE.Color();
    const tri = (a, b, c, na, nb, nc) => {
      AB.subVectors(b, a); AC.subVectors(c, a); N.crossVectors(AB, AC);
      if (N.dot(na) < 0) { [b, c] = [c, b]; [nb, nc] = [nc, nb]; }
      for (const [p, q] of [[a, na], [b, nb], [c, nc]]) { this.pos.push(p.x, p.y, p.z); this.col.push(...tono(q, base)); }
    };
    for (let i = 0; i < n; i++) for (let k = 0; k < lados; k++) {
      const a = P[i][k], b = P[i][k + 1], c = P[i + 1][k], d = P[i + 1][k + 1];
      u.a = (k + 0.5) / lados; u.t = (i + 0.5) / n; u.x = (a.x + d.x) / 2; u.y = (a.y + d.y) / 2; u.z = (a.z + d.z) / 2;
      base.set((o.pinta && o.pinta(u)) ?? color);
      const na = nor[i][k], nb = nor[i][(k + 1) % lados], nc = nor[i + 1][k], nd = nor[i + 1][(k + 1) % lados];
      tri(a, b, c, na, nb, nc); tri(b, d, c, nb, nd, nc);
    }
    // las tapas
    for (const [i, arriba] of [[0, false], [n, true]]) {
      const nv = new THREE.Vector3(0, arriba ? 1 : -1, 0); u.t = i / n; u.y = cen[i].y; u.x = cen[i].x; u.z = cen[i].z; u.a = 0.25; base.set((o.pinta && o.pinta(u)) ?? color);
      for (let k = 0; k < lados; k++) tri(cen[i], P[i][k], P[i][k + 1], nv, nv, nv);
    }
    return this;
  }
  malla() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true }));
  }
}
// formas de uso común para `bulto`
export const aplastarPanza = (k = 0.45) => (v) => { if (v.y < 0) v.y *= k; };
// de esfera a caja de esquinas redondeadas: entre más bajo k, más caja
export const cubico = (k = 0.55) => (v) => { v.x = Math.sign(v.x) * Math.abs(v.x) ** k; v.y = Math.sign(v.y) * Math.abs(v.y) ** k; v.z = Math.sign(v.z) * Math.abs(v.z) ** k; };
export const huevo = (k = 0.2) => (v) => { const f = 1 + v.z * k; v.x *= f; v.y *= f; };
// anillos a lo largo de un tubo: `claro` en las bandas, null en lo demás
export const bandas = (claro, veces = 3, ancho = 0.3) => (u) => { const f = u.x * veces - Math.floor(u.x * veces); return f < ancho ? claro : null; };
