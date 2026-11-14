// El perezoso en la calle: de día, cerca de una carretera, a veces un perezoso se baja a cruzarla… a su paso (un metro por minuto,
// casi). Si uno le da clic derecho, lo carga en brazos; llevándolo hasta un árbol (junto a un tronco) se suelta solo y se sube
// despacito. Da las gracias a su manera: una calma que dura un rato. Si nadie le ayuda, igual cruza… algún día.
// Estado: g.perezosoCalle (no se guarda), meta.perezosoCd (día).
import { BLOCKS, BLOCK_BY_KEY as K, SOLID } from './blocks.js';
import { anotar } from './diario.js';

const ASFALTO = new Set([K.asfalto, K.asfalto_linea, K.asfalto_parche].filter(Boolean));
const tronco = (id) => { const b = BLOCKS[id]; return !!(b && (/log$|^tronco/.test(b.key))); };
function carreteraCerca(g) {
  const w = g.world, p = g.player.body.pos;
  for (let k = 0; k < 30; k++) {
    const x = Math.floor(p.x + (Math.random() - 0.5) * 40), z = Math.floor(p.z + (Math.random() - 0.5) * 40);
    for (let y = Math.floor(p.y) + 4; y > Math.floor(p.y) - 6; y--) if (ASFALTO.has(w.getBlock(x, y, z)) && !SOLID[w.getBlock(x, y + 1, z)]) return { x: x + 0.5, y: y + 1, z: z + 0.5 };
  }
  return null;
}
export function limpiarPerezosoCalle(g) { const P = g.perezosoCalle; if (P && P.m && !P.m.dead) { P.m.noGravity = false; if (P.m.data.animo && P.m.data.animo.tipo === 'cruza') P.m.data.animo = null; } g.perezosoCalle = null; }
// cada segundo
export function tickPerezosoCalle(g) {
  const P = g.perezosoCalle;
  if (P) { if (P.m.dead || g.dim !== 'tierra' || Math.hypot(P.m.body.pos.x - g.player.body.pos.x, P.m.body.pos.z - g.player.body.pos.z) > 80) limpiarPerezosoCalle(g); return; }
  if (g.dim !== 'tierra' || !g.meta || g.daylight < 0.45 || (g.meta.perezosoCd || 0) > (g.day || 1) || Math.random() > 1 / 200) return;
  const q = carreteraCerca(g);
  if (!q) return;
  const m = g.entities.spawnMob('perezoso', q.x, q.y + 0.1, q.z);
  if (!m) return;
  g.meta.perezosoCd = (g.day || 1) + 2;
  const a = Math.random() * Math.PI * 2;
  m.data.animo = { tipo: 'cruza', dx: Math.cos(a), dz: Math.sin(a) };
  g.perezosoCalle = { m, fase: 'cruza', t: 0 };
  g.ui.toast('🦥 ¡Un perezoso cruza la carretera! Clic derecho lo lleva a un árbol', 4600);
}
// cada cuadro
export function cuadroPerezosoCalle(g, dt) {
  const P = g.perezosoCalle;
  if (!P) return;
  const m = P.m, b = m.body.pos, A = m.data.animo;
  if (m.dead || !A) { g.perezosoCalle = null; return; }
  P.t += dt;
  if (P.fase === 'cruza') {
    b.x += A.dx * dt * 0.08; b.z += A.dz * dt * 0.08; m.moving = true; // a su ritmo
    m.targetYaw = Math.atan2(A.dx, A.dz);
    if (P.t > 300) limpiarPerezosoCalle(g);
  } else if (P.fase === 'brazos') {
    const p = g.player.body.pos, d = g.player.lookDir();
    b.x = p.x + d.x * 0.7; b.z = p.z + d.z * 0.7; b.y = p.y + 0.9; m.body.vel.x = m.body.vel.y = m.body.vel.z = 0;
    m.targetYaw = g.player.yaw + Math.PI; m.moving = false;
    // junto a un tronco: se suelta y se sube
    const w = g.world, x0 = Math.floor(p.x), z0 = Math.floor(p.z), y0 = Math.floor(p.y);
    for (let dx = -2; dx <= 2 && P.fase === 'brazos'; dx++) for (let dz = -2; dz <= 2 && P.fase === 'brazos'; dz++) for (let dy = 0; dy <= 2; dy++) {
      if (!tronco(w.getBlock(x0 + dx, y0 + dy, z0 + dz))) continue;
      P.fase = 'sube'; P.t = 0; P.tx = x0 + dx + 0.5; P.tz = z0 + dz + 0.5; P.ty = y0 + dy;
      b.x = P.tx + 0.55; b.z = P.tz; b.y = P.ty;
      m.noGravity = true;
      g.ui.toast('🦥 Se agarró del tronco y empezó a subir… sin ninguna prisa', 3000);
      break;
    }
  } else if (P.fase === 'sube') {
    b.x = P.tx + 0.55; b.z = P.tz; b.y += dt * 0.35; m.body.vel.y = 0; m.moving = true;
    if (P.t > 7) {
      m.noGravity = false; m.data.animo = null;
      g.addEffect('calma', 180);
      g.achieve('perezoso_calle', 'Le ayudé a cruzar a un perezoso');
      anotar(g, 'Ayudé a un perezoso a cruzar la carretera. Se subió a un árbol y se me quedó viendo.', '🦥');
      g.ui.toast('🦥 Lo mira despacito desde la rama. Una calma rara… (Calma, 3 min)', 4200);
      g.perezosoCalle = null;
    }
  }
}
// clic derecho al perezoso que cruza: cargarlo
export function perezosoCalleInteract(m, g) {
  const P = g.perezosoCalle;
  if (!P || P.m !== m || P.fase !== 'cruza') return false;
  P.fase = 'brazos'; P.t = 0;
  g.audio.play('perezoso', { pos: m.soundPos(), vol: 0.8 });
  g.ui.toast('🦥 Lo cargó con cuidado (pesa más de lo que parece). Llévelo hasta un árbol', 3000);
  return true;
}
export function pruebaPerezosoCalle(g) {
  limpiarPerezosoCalle(g);
  const p = g.player.body.pos, d = g.player.lookDir();
  const m = g.entities.spawnMob('perezoso', p.x + d.x * 3, p.y + 0.2, p.z + d.z * 3);
  if (!m) return 'No se pudo';
  m.data.animo = { tipo: 'cruza', dx: -d.z, dz: d.x };
  g.perezosoCalle = { m, fase: 'cruza', t: 0 };
  return 'Un perezoso cruzando delante: clic derecho para cargarlo y llévelo junto a un tronco';
}
