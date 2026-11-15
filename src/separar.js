// v13.0.3: separación suave entre criaturas, gente y jugador. Antes `Body` solo chocaba contra bloques: dos personas del pueblo (o una
// persona y quien camina) se podían meter una dentro de la otra. Aquí cada par que se traslapa en el plano XZ (y a la misma altura) se
// empuja en sentido contrario, proporcional al traslape, y el empuje pasa por `moveAxis` (la misma colisión con bloques: nunca queda
// dentro de una pared). Se hace una sola vez por cuadro, con una cuadrícula de 2 bloques (nada de todos contra todos), solo cerca de
// quien juega, y solo en el anfitrión: la posición ya viaja en los mensajes de criaturas de siempre, así que no suma tráfico.
const CELDA = 2, RADIO_ACTIVO = 48, TASA = 10, VEL_MAX = 2.5, VEL_MAX_JUGADOR = 7, UMBRAL = 0.015;
const SIN_SEPARAR = new Set(['carro', 'bote']);

// ancho con el que se separan: el del modelo (brazos y sombrero), no el de la caja de choque (que debe caber por una puerta)
export const anchoSep = (kind) => kind.sepW ?? kind.w + 0.1;

const cuadricula = new Map();
const lista = [];

function peso(m) { return m.kind.boss ? 0 : 1; } // los jefes no se mueven: los demás se apartan de ellos

export function separar(g, mobs, dt) {
  if (dt <= 0 || g.meta.invitado) return 0;
  const pl = g.player.body, pp = pl.pos;
  lista.length = 0; cuadricula.clear();
  for (const m of mobs) {
    if (m.dead || m.dying || m.titere || SIN_SEPARAR.has(m.type) || m.descartado) continue;
    const p = m.body.pos;
    if (Math.abs(p.x - pp.x) > RADIO_ACTIVO || Math.abs(p.z - pp.z) > RADIO_ACTIVO) continue;
    m.sx = 0; m.sz = 0;
    const i = lista.push(m) - 1;
    const k = Math.floor(p.x / CELDA) * 100003 + Math.floor(p.z / CELDA);
    const c = cuadricula.get(k); if (c) c.push(i); else cuadricula.set(k, [i]);
  }
  if (!lista.length) return 0;
  const k = Math.min(1, dt * TASA);
  let pares = 0, jx = 0, jz = 0;
  // el jugador contra los que no son enemigos ni jefes
  const rp = pl.w / 2 + 0.05;
  for (let a = 0; a < lista.length; a++) {
    const A = lista[a], pa = A.body.pos, ra = anchoSep(A.kind) / 2;
    // contra otros de la cuadrícula (cada par una sola vez: solo los de índice mayor)
    const cx = Math.floor(pa.x / CELDA), cz = Math.floor(pa.z / CELDA);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const c = cuadricula.get((cx + dx) * 100003 + (cz + dz)); if (!c) continue;
      for (const b of c) {
        if (b <= a) continue;
        const B = lista[b], pb = B.body.pos, r = ra + anchoSep(B.kind) / 2;
        let ex = pb.x - pa.x, ez = pb.z - pa.z;
        if (Math.abs(ex) >= r || Math.abs(ez) >= r) continue;
        if (pa.y >= pb.y + B.body.h - 0.1 || pb.y >= pa.y + A.body.h - 0.1) continue; // uno arriba del otro
        let d = Math.hypot(ex, ez);
        if (d >= r) continue;
        if (d < 1e-3) { const ang = (A.nid * 2.399 + B.nid) % 6.2832; ex = Math.cos(ang) * 1e-3; ez = Math.sin(ang) * 1e-3; d = 1e-3; }
        const sol = r - d; if (sol < UMBRAL) continue;
        const wa = peso(A), wb = peso(B), tot = wa + wb; if (!tot) continue;
        const mov = sol * k, nx = ex / d, nz = ez / d;
        A.sx -= nx * mov * (wa / tot); A.sz -= nz * mov * (wa / tot);
        B.sx += nx * mov * (wb / tot); B.sz += nz * mov * (wb / tot);
        pares++;
      }
    }
    // el jugador: se aparta él mismo (más) y la criatura apenas (leve, para no usarla de empujón por un precipicio)
    if (!A.kind.hostile && !A.kind.boss && !g.sleeping) {
      const ex = pa.x - pp.x, ez = pa.z - pp.z, r = ra + rp;
      if (Math.abs(ex) < r && Math.abs(ez) < r && !(pp.y >= pa.y + A.body.h - 0.1 || pa.y >= pp.y + pl.h - 0.1)) {
        let d = Math.hypot(ex, ez);
        if (d < r) {
          let nx, nz;
          if (d < 1e-3) { const ang = (A.nid * 2.399) % 6.2832; nx = Math.cos(ang); nz = Math.sin(ang); d = 0; } else { nx = ex / d; nz = ez / d; }
          const sol = r - d;
          if (sol >= UMBRAL) {
            // quien juega sale entero de su parte (si no, corriendo atraviesa a la persona); la persona se aparta apenas, y con tope
            A.sx += nx * sol * k * 0.2; A.sz += nz * sol * k * 0.2;
            jx -= nx * sol * 0.8; jz -= nz * sol * 0.8;
            pares++;
          }
        }
      }
    }
  }
  // aplicar todo junto, por la colisión con bloques; la velocidad se topa para que nada salga disparado
  for (const m of lista) {
    let dx = m.sx, dz = m.sz;
    if (Math.abs(dx) < 1e-5 && Math.abs(dz) < 1e-5) continue;
    const tope = VEL_MAX * dt, l = Math.hypot(dx, dz);
    if (l > tope) { dx *= tope / l; dz *= tope / l; }
    empujar(m.body, g.world, dx, dz, !m.kind.flying);
  }
  if (jx || jz) {
    const tope = VEL_MAX_JUGADOR * Math.max(dt, 1 / 60), l = Math.hypot(jx, jz);
    if (l > tope) { jx *= tope / l; jz *= tope / l; }
    empujar(pl, g.world, jx, jz, false);
  }
  return pares;
}

// mueve por la colisión con bloques; si estaba parado en el suelo y el empujón lo dejaría sin suelo (un precipicio), se queda
function empujar(body, world, dx, dz, cuidaBorde) {
  const p = body.pos, x0 = p.x, z0 = p.z, tenia = cuidaBorde && body.onGround;
  if (dx) body.moveAxis(world, 'x', dx);
  if (dz) body.moveAxis(world, 'z', dz);
  if (tenia && !body.hasGroundUnder(world, p.x, p.z)) { p.x = x0; p.z = z0; }
}
