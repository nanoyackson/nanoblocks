// v13.4.3 (CC4 del plan de contenido): los dueños de los salones, minijefes de tiempo real (sin generador: valen en todo mundo con generador >= 28, que es el que trae salones con lugares).
// Un dueño vive en un salón con lugar, solo en la zona 2 (Centinela y Madre) o la 3 (los tres), y solo si el piso del salón es hondo (< 30). Lo hace aparecer el ANFITRIÓN cuando
// alguien se acerca; uno por salón y no regresa una vez vencido (meta.duenosVencidos). Pagan como los minijefes (precios.js: el primero del día completo, el 10 % los demás).
// Todo lo que decide el azar sale de hash3 (el salón es el mismo en todas las máquinas); el azar de los golpes es de tiempo real y solo lo corre el anfitrión.
import { CUEVA_FAUNA } from './cuevavida.js';
import { atacar, avisoCaida } from './golpes.js';
import { BLOCK_BY_KEY as K } from './blocks.js';
import { hash3 } from './noise.js';
import { aguaDelSalon } from './salonlugar.js';

function grande(base, escala, extra) {
  return {
    ...base, ...extra, boss: true, mini: true, hostile: true,
    w: base.w * escala * 0.85, h: base.h * escala,
    build() {
      const m = base.build();
      m.userData.babyScale = escala;
      m.traverse((o) => { if (!o.material || !o.material.color || o.userData.glow) return; o.material = o.material.clone(); o.material.color.multiplyScalar(extra.tono || 0.8); });
      return m;
    },
  };
}
const ataca = (m, c, dano, causa, alcance = 2.4) => {
  const { g, distP, pl } = c;
  if (distP < alcance && Math.abs(pl.y - m.body.pos.y) < 2.5 && m.attackCd <= 0 && g.player.alive) atacar(m, g, { dano, causa, alcance, cd: 1.4, tipo: 'mordida' });
};
const vivo = (c) => c.g.player.alive && c.g.mode === 'survival';

// los racimos del Centinela: cuatro bloques de cristal alrededor del lugar; mientras quede uno, el Centinela no recibe golpes
export const RACIMOS = [[6, 6], [-6, 6], [6, -6], [-6, -6]];
const racimosVivos = (m, g) => (m.data.racimos || []).filter((r) => g.world.getBlock(r.x, r.y, r.z) === K.cristal_bloque).length;

export const DUENOS = {
  centinela_cristal: grande(CUEVA_FAUNA.escarabajo_calcita, 5, {
    name: 'El Centinela de Cristal', health: 95, speed: 2.6, drops: [[1192, 3, 5]], tono: 0.9,
    onHurt(m, g) { if (racimosVivos(m, g) > 0) { g.ui.toast('💎 El Centinela es de cristal: rompa primero los cuatro racimos que lo alimentan', 1800); return false; } return true; },
    brain(m, dt, c) {
      const { distP, dxp, dzp } = c;
      m.data.angry = distP < 24 && vivo(c);
      if (!m.data.angry) return false;
      m.targetYaw = Math.atan2(dxp, dzp);
      m.moving = distP > 2.2; m.speedMul = 1;
      ataca(m, c, 6, 'El Centinela de Cristal lo aplastó');
      return true;
    },
  }),
  madre_esporal: grande(CUEVA_FAUNA.cangrejo_ciego, 7, {
    name: 'La Madre Esporal', health: 85, speed: 2.2, drops: [[K.glow_mushroom, 4, 8], [1195, 1, 2]], tono: 0.8,
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c;
      m.data.angry = distP < 24 && vivo(c);
      if (!m.data.angry) return false;
      m.targetYaw = Math.atan2(dxp, dzp);
      // la nube de esporas: cada 5 s suelta una de 4 de radio que dura 3 s; adentro, lentitud y 1 de daño por segundo (3 como máximo por nube)
      m.data.nube = (m.data.nube ?? 3) - dt;
      if (!m.data.esp && m.data.nube <= 0) { m.data.nube = 5; m.data.esp = { t: 3, x: m.body.pos.x, y: m.body.pos.y, z: m.body.pos.z, golpes: 0, tic: 1 }; }
      if (m.data.esp) {
        const E = m.data.esp; E.t -= dt; E.tic -= dt;
        g.particles.burst(E.x + (Math.random() - 0.5) * 6, E.y + 0.6, E.z + (Math.random() - 0.5) * 6, [[0.75, 0.9, 0.45]], 2, 0.6);
        if (E.tic <= 0 && E.golpes < 3) { E.tic = 1; if (Math.hypot(pl.x - E.x, pl.z - E.z) < 4.2 && Math.abs(pl.y - E.y) < 3) { E.golpes++; g.addEffect('escalofrio', 3); g.atacante = m; g.damagePlayer(1, E.x, E.z, 'La Madre Esporal lo ahogó en esporas', true, true); } }
        if (E.t <= 0) m.data.esp = null;
      }
      m.moving = distP > 2.6; m.speedMul = 0.8;
      ataca(m, c, 5, 'La Madre Esporal lo aplastó', 2.8);
      return true;
    },
  }),
  reina_agujas: grande(CUEVA_FAUNA.grillo_cueva, 8, {
    name: 'La Reina de las Agujas', health: 110, speed: 2.8, drops: [[1126, 4, 6]], tono: 0.85,
    brain(m, dt, c) {
      const { g, distP, dxp, dzp, pl } = c;
      m.data.angry = distP < 26 && vivo(c);
      if (!m.data.angry) return false;
      m.targetYaw = Math.atan2(dxp, dzp);
      // la tela: cada 6 s tiende una telaraña donde está uno (avisa 1 s); y cada 7 s tira una estalactita (anillo rojo 1,2 s, 3 de daño)
      m.data.tela = (m.data.tela ?? 3) - dt;
      if (!m.data.telaP && m.data.tela <= 0 && distP > 3) { m.data.tela = 6; m.data.telaP = { t: 1, x: Math.floor(pl.x), y: Math.floor(pl.y), z: Math.floor(pl.z) }; avisoCaida(g, pl.x, pl.y, pl.z, 1.4, 1, m); }
      if (m.data.telaP) {
        const T = m.data.telaP; T.t -= dt;
        if (T.t <= 0) { m.data.telaP = null; if (g.world.getBlock(T.x, T.y, T.z) === 0) { g.world.setBlock(T.x, T.y, T.z, K.cobweb); (m.data.telas = m.data.telas || []).push({ ...T, t: 7 }); } }
      }
      for (const T of m.data.telas || []) { T.t -= dt; if (T.t <= 0 && g.world.getBlock(T.x, T.y, T.z) === K.cobweb) g.world.setBlock(T.x, T.y, T.z, 0); }
      if (m.data.telas) m.data.telas = m.data.telas.filter((T) => T.t > 0);
      m.data.cae = (m.data.cae ?? 5) - dt;
      if (!m.data.caeP && m.data.cae <= 0 && distP < 18) { m.data.cae = 7; m.data.caeP = { t: 1.2, x: pl.x, y: pl.y, z: pl.z }; avisoCaida(g, pl.x, pl.y, pl.z, 1.6, 1.2, m); }
      if (m.data.caeP) {
        const P = m.data.caeP; P.t -= dt;
        if (P.t <= 0) {
          m.data.caeP = null;
          g.particles.burst(P.x, P.y + 0.3, P.z, [[0.8, 0.78, 0.7]], 18, 2);
          if (Math.hypot(g.player.body.pos.x - P.x, g.player.body.pos.z - P.z) < 1.8 && Math.abs(g.player.body.pos.y - P.y) < 2) { g.atacante = m; g.damagePlayer(3, P.x, P.z, 'Una estalactita de la Reina de las Agujas', true, false); }
        }
      }
      m.moving = distP > 2.6; m.speedMul = 1;
      ataca(m, c, 6, 'La Reina de las Agujas lo clavó', 2.6);
      return true;
    },
  }),
};
export const NOMBRES_DUENO = { centinela_cristal: 'Vencí al Centinela de Cristal', madre_esporal: 'Vencí a la Madre Esporal', reina_agujas: 'Vencí a la Reina de las Agujas', anguila_mayor: 'Vencí a la Anguila Mayor', tizon_mayor: 'Vencí al Tizón Mayor' };
const DUENO_DE = { candil: 'centinela_cristal', hongueada: 'madre_esporal', agujas: 'reina_agujas', laguna: 'anguila_mayor' }; // v13.6.0: la Laguna Honda también tiene dueña

// ¿qué dueño tiene este nodo de la Red Honda (o null)? Solo con lugar, zona 2 o 3 (la Reina solo en la 3), piso hondo y la mitad de ellos (hash)
export function duenoDe(gen, n) {
  if (!n.salon || !n.lugar || n.piso >= 30) return null;
  const tipo = DUENO_DE[n.tipo];
  if (!tipo || n.lugar.zona < 2 || (n.lugar.zona === 2 && tipo === 'reina_agujas')) return null;
  return hash3(gen.seed, n.gx, 9500, n.gz) < 0.5 ? tipo : null;
}

// v13.7.1 (La Hondura): el Tizón Mayor vive en la fragua con lugar (La Fragua de los Antiguos); ~0,65 por cada 1 000 trozos en la zona 2 y ~1,2 en la 3 (con el 0,7 de fraguas que traen lugar); una vez por mundo y no regresa
export function duenoHondo(gen, n) {
  if (!n.cam || n.tipo !== 'fragua' || !n.lugar) return null;
  return hash3(gen.seed, n.gx, 9501, n.gz) < (n.lugar.zona === 2 ? 0.45 : 0.8) ? 'tizon_mayor' : null;
}

// cada segundo (tickZones): si alguien está a 30 del lugar de un salón con dueño no vencido, y no hay otro dueño vivo, el anfitrión lo hace aparecer
export function tickDuenos(g) {
  const gen = g.world && g.world.gen;
  if (g.meta.invitado || g.dim !== 'tierra' || g.mode !== 'survival' || !gen || gen.version < 28 || !gen.v2) return;
  const V = (g.meta.duenosVencidos = g.meta.duenosVencidos || {});
  if (g.entities.mobs.some((m) => m.data && m.data.dueno && !m.dead)) return;
  for (const pl of [g.player, ...g.otrosJugadores()]) {
    if (!pl.alive) continue;
    const p = pl.body.pos, RC = 96;
    for (let gz = Math.floor(p.z / RC) - 1; gz <= Math.floor(p.z / RC) + 1; gz++) for (let gx = Math.floor(p.x / RC) - 1; gx <= Math.floor(p.x / RC) + 1; gx++) {
      const n = gen.v2.cmNodo(gx, gz), tipo = duenoDe(gen, n), key = `${gx},${gz}`;
      if (!tipo || V[key]) continue;
      const L = n.lugar;
      if (Math.hypot(L.x - p.x, L.z - p.z) > 30 || Math.abs(L.y - p.y) > 14) continue;
      // la Anguila Mayor nace en el agua de la laguna (no en la isla); si no se halla agua honda cerca del lugar, hoy no sale
      const agua = tipo === 'anguila_mayor' ? aguaDelSalon(g.world, n.x, L.y, n.z) : null;
      if (tipo === 'anguila_mayor' && !agua) continue;
      const m = agua ? g.entities.spawnMob(tipo, agua.x, agua.y, agua.z) : g.entities.spawnMob(tipo, L.x + 0.5, L.y + 1.5, L.z + 4.5);
      if (!m) return;
      m.data.dueno = tipo; m.data.salon = key; m.data.angry = true;
      if (tipo === 'centinela_cristal') {
        m.data.racimos = [];
        for (const [dx, dz] of RACIMOS) { // en el piso de ahí: el primer aire con piso sólido debajo, entre 6 bloques abajo y 10 arriba del lugar
          for (let y = L.y + 10; y >= L.y - 6; y--) { const x = L.x + dx, z = L.z + dz, abajo = g.world.getBlock(x, y - 1, z); if (g.world.getBlock(x, y, z) === 0 && abajo !== 0 && abajo !== K.water && abajo !== K.lava) { g.world.setBlock(x, y, z, K.cristal_bloque); m.data.racimos.push({ x, y, z }); break; } }
        }
      }
      g.ui.toast(`⚠ ${m.kind.name} despertó en el salón`, 3000);
      g.shake = Math.max(g.shake || 0, 0.5);
      return;
    }
    // las cámaras hondas (generador >= 32)
    if (gen.version < 32) continue;
    const RH = 192;
    for (let gz = Math.floor(p.z / RH) - 1; gz <= Math.floor(p.z / RH) + 1; gz++) for (let gx = Math.floor(p.x / RH) - 1; gx <= Math.floor(p.x / RH) + 1; gx++) {
      const n = gen.v2.hondoNodo(gx, gz), tipo = duenoHondo(gen, n), key = `h${gx},${gz}`;
      if (!tipo || V[key]) continue;
      const L = n.lugar;
      if (Math.hypot(L.x - p.x, L.z - p.z) > 30 || Math.abs(L.y - p.y) > 14) continue;
      const m = g.entities.spawnMob(tipo, L.x + 0.5, L.y + 1.5, L.z + 4.5);
      if (!m) return;
      m.data.dueno = tipo; m.data.salon = key; m.data.angry = true;
      g.ui.toast(`⚠ ${m.kind.name} despertó en la cámara`, 3000);
      g.shake = Math.max(g.shake || 0, 0.5);
      return;
    }
  }
}
