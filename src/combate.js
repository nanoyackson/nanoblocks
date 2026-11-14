// Combate con más profundidad (estilo juegos de supervivencia con armas, hecho a nuestra manera):
// estamina, escudo para bloquear (clic derecho sostenido) y parry (bloquear justo cuando llega el golpe deja al
// enemigo aturdido y recibe el doble), ataque fuerte (clic del medio o F), combos de tres golpes, esquive
// (espacio mientras bloqueás) y el escudo visible en la mano izquierda.
import { rebotarGolpe } from './golpes.js';
import { ventaja, mana } from './progreso.js';
import { manaJefe } from './manasjefe.js';
import * as THREE from 'three';
import { ITEMS, isBlockId } from './blocks.js';
import { perfil, AGUANTE_MAX, claseDe } from './armas3.js';
import { bonoAguante } from './maestria.js';

export const SHIELD_SLOT = 4;
export function shieldDef(g) { const s = g.inventory.armor[SHIELD_SLOT]; return s && ITEMS[s.id] && ITEMS[s.id].block ? ITEMS[s.id] : null; }
// con qué se puede bloquear: mano vacía, armas y herramientas (con un bloque en la mano, el clic derecho coloca)
export function blockHand(def) { return !def || !!def.tool || !!def.damage || !!def.machete; }

// peso de cada arma: cuánto tarda entre golpes y cuánta estamina gasta (lo liviano es rápido, lo pesado pega duro)
export function weaponStats(def) {
  // desde la v4.97 lo manda la clase del arma (armas3.js)
  const P = perfil(def);
  if (P) return { cd: P.cd, cost: P.cost, name: P.nombre };
  if (!def || isBlockId(def.id)) return { cd: 0.35, cost: 5, name: 'puño' };
  if (def.machete) return { cd: 0.38, cost: 6 };
  if (def.thrust) return { cd: 0.65, cost: 9 };
  if (def.key === 'mazo') return { cd: 0.95, cost: 15 };
  if (def.key === 'garrote') return { cd: 0.7, cost: 10 };
  if (def.tool === 'sword') return { cd: 0.5, cost: 9 };
  if (def.tool === 'axe') return { cd: 0.72, cost: 12 };
  if (def.tool === 'pickaxe') return { cd: 0.75, cost: 11 };
  if (def.tool) return { cd: 0.55, cost: 8 };
  return { cd: 0.4, cost: 6 };
}

export function spend(g, n, pausa = 1.0) {
  if (g.mode !== 'survival') return true;
  const ok = g.stamina >= n * 0.5;
  g.stamina = Math.max(0, g.stamina - n);
  g.staminaT = Math.max(g.staminaT || 0, pausa); // después de pegar se recupera antes que después de correr o cubrirse
  return ok;
}

export function startBlock(g) {
  if (g.blocking) return;
  g.blocking = true;
  g.blockStart = g.clock || 0;
  g.audio.play('armadura.cuero', { ui: true, vol: 0.25, pitch: 1.2 });
}
export function stopBlock(g) { g.blocking = false; }

export function tryDodge(g) {
  if (!g.blocking || g.roll) return false;
  if (!spend(g, manaJefe(g, 'mil_patas') ? 13.5 : 18)) { g.ui.toast('Sin aire para esquivar', 900); return false; }
  const k = g.keys, yaw = g.player.yaw;
  let fx = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0), fz = (k.has('KeyS') ? 1 : 0) - (k.has('KeyW') ? 1 : 0);
  if (!fx && !fz) fz = 1; // sin dirección: para atrás
  const l = Math.hypot(fx, fz);
  fx /= l; fz /= l;
  const vx = fx * Math.cos(yaw) + fz * Math.sin(yaw), vz = -fx * Math.sin(yaw) + fz * Math.cos(yaw);
  g.roll = { t: 0.3, vx: vx * 11, vz: vz * 11, side: fx };
  g.iframes = 0.42;
  g.audio.play('swish', { ui: true, vol: 0.35, pitch: 0.8 });
  return true;
}

// voltereta (V): rueda hacia donde caminás, con un instante sin que te peguen
export function tryRoll(g) {
  if (g.roll || g.flip || !g.player.body.onGround) return false;
  if (!spend(g, 18)) { g.ui.toast('Sin aire para la voltereta', 900); return false; }
  const [vx, vz, side] = moveDir(g, 0, -1);
  g.roll = { t: 0.42, vx: vx * 10, vz: vz * 10, side, spin: true };
  g.iframes = 0.45;
  g.audio.play('armadura.cuero', { ui: true, vol: 0.4, pitch: 0.8 });
  return true;
}

// barrerse (Z): caminando hacia adelante, se barre por el suelo; corriendo llega más lejos. Antes era Shift corriendo, y el mismo
// Shift que sirve para agacharse en un borde lo tiraba por el borde.
export function trySlide(g) {
  if (g.slide || g.roll || !g.player.body.onGround) return false;
  if (!spend(g, manaJefe(g, 'mil_patas') ? 7.5 : 10)) { g.ui.toast('Sin aire para barrerse', 900, 'registro'); return false; }
  // v11.10: se barre hacia donde camina (adelante, atrás o de lado), como el esquive; sin teclas, hacia adelante.
  // Para atrás llega menos lejos
  const [dx, dz, lado] = moveDir(g, 0, -1), atras = g.keys.has('KeyS') && !g.keys.has('KeyW');
  const v = (g.player.sprinting ? 12 : 9) * (atras ? 0.7 : 1);
  g.slide = { t: g.player.sprinting ? 0.65 : 0.5, vx: dx * v, vz: dz * v, lado, atras };
  g.iframes = Math.max(g.iframes || 0, 0.25);
  g.audio.play('step.gravel', { ui: true, vol: 0.6, pitch: 0.7 });
  g.audio.play('swish', { ui: true, vol: 0.25, pitch: 0.6 });
  return true;
}

// enfoque (R): fija la vista en el enemigo más cercano al frente; con espacio + dirección se salta de lado o para atrás
export function toggleLock(g) {
  if (g.lockOn) { g.lockOn = null; return; }
  const p = g.player.body.pos, yaw = g.player.yaw;
  let best = null, bs = -1;
  for (const m of g.entities.mobs) {
    if (m.dead || m.dying) continue;
    const dx = m.body.pos.x - p.x, dz = m.body.pos.z - p.z, d = Math.hypot(dx, dz);
    if (d > 20 || d < 0.5) continue;
    const front = (dx / d) * -Math.sin(yaw) + (dz / d) * -Math.cos(yaw);
    if (front < 0.4) continue;
    const score = front * 2 - d / 20 + (m.kind.hostile ? 1 : 0);
    if (score > bs) { bs = score; best = m; }
  }
  g.lockOn = best;
  if (best) g.audio.play('click', { ui: true, vol: 0.4 }); else g.ui.toast('No hay nadie al frente para enfocar', 1000);
}
export function tryHop(g) {
  if (!g.lockOn || !g.player.body.onGround || g.flip) return false;
  const k = g.keys;
  const side = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0), back = k.has('KeyS');
  if (!side && !back) return false; // espacio solo: salto normal
  if (!spend(g, 12)) return false;
  const yaw = g.player.yaw;
  const rx = Math.cos(yaw), rz = -Math.sin(yaw), bx = Math.sin(yaw), bz = Math.cos(yaw);
  const b = g.player.body;
  if (back) { b.vel.x = bx * 8; b.vel.z = bz * 8; b.vel.y = 7.2; g.flip = { t: 0.55, back: true }; }
  else { b.vel.x = rx * side * 9; b.vel.z = rz * side * 9; b.vel.y = 5; g.flip = { t: 0.4, side }; }
  g.iframes = 0.35;
  g.hopLock = 0.25;
  g.audio.play('swish', { ui: true, vol: 0.35, pitch: 1.1 });
  return true;
}
function moveDir(g, defX, defZ) {
  const k = g.keys, yaw = g.player.yaw;
  let fx = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0), fz = (k.has('KeyS') ? 1 : 0) - (k.has('KeyW') ? 1 : 0);
  if (!fx && !fz) { fx = defX; fz = defZ; }
  const l = Math.hypot(fx, fz) || 1;
  fx /= l; fz /= l;
  return [fx * Math.cos(yaw) + fz * Math.sin(yaw), -fx * Math.sin(yaw) + fz * Math.cos(yaw), fx];
}

// Cuando algo le pega al jugador desde (fromX, fromZ): esquive, parry o bloqueo. Devuelve el daño que queda.
export function onPlayerHit(g, amount, fromX, fromZ) {
  if ((g.iframes || 0) > 0) {
    // esquive perfecto: rodando (o brincando de lado) justo cuando llegaba el golpe: cámara lenta y el próximo golpe es contraataque
    const ck = g.clock || 0;
    if ((g.roll || g.flip || (g.slide && !g.slide.lanza)) && fromX !== null && fromX !== undefined && !((g.perfectoCd || 0) > ck) && g.mode === 'survival') {
      g.perfectoCd = ck + 2; g.slowmo = 0.55; g.contra = ck + 1.6;
      g.ui.combatFlash('parry', '¡Esquive perfecto!');
      g.audio.play('swish', { ui: true, vol: 0.8, pitch: 0.6 });
      g.stamina = Math.min(g.stamina + 15, 100 + (g.aguanteExtra || 0)); // devuelve un poco de aire
      g.achieve('esquive_perfecto', 'Esquive perfecto');
    }
    return 0;
  }
  if (!g.blocking || fromX === null || fromX === undefined) return amount;
  const sh = shieldDef(g);
  const p = g.player.body.pos, yaw = g.player.yaw;
  const dx = fromX - p.x, dz = fromZ - p.z, l = Math.hypot(dx, dz) || 1;
  const facing = (dx / l) * -Math.sin(yaw) + (dz / l) * -Math.cos(yaw);
  if (facing < 0.25) return amount; // le pegaron por la espalda
  const ck = g.clock || 0;
  const pos = { x: p.x - Math.sin(yaw) * 0.8, y: p.y + 1.2, z: p.z - Math.cos(yaw) * 0.8 };
  // PARRY: se levantó el escudo justo a tiempo
  // sin escudo también se puede cubrir con el arma (ataja menos y el desvío pide más puntería)
  const PA = perfil(g.heldDef()), conArma = !sh && PA.bloqueo > 0;
  if ((sh || conArma) && ck - g.blockStart < (sh ? (mana(g, 'reflejos') ? 0.45 : 0.3) + (sh && manaJefe(g, 'concha') ? 0.05 : 0) : (mana(g, 'reflejos') ? 0.34 : 0.26))) {
    let best = null, bd = 6;
    for (const m of g.entities.mobs) { if (m.dead || m.dying || !(m.kind.hostile || m.kind.legend || m.kind.boss)) continue; const d = Math.hypot(m.body.pos.x - fromX, m.body.pos.z - fromZ); if (d < bd) { bd = d; best = m; } }
    if (best) {
      best.stunT = best.kind.boss ? 1.6 : 2.2; best.windT = 0; rebotarGolpe(best); if (best.kind.alParry) best.kind.alParry(best, g); best.body.vel.x += (dx / l) * 6; best.body.vel.z += (dz / l) * 6;
      // el escudo de concha devuelve el golpe
      if (sh && sh.key === 'escudo_concha' && bd < 3.5) { let entro = false; g.golpeando = best; try { entro = best.hurt(amount * 2.5, p.x, p.z) !== false; } finally { g.golpeando = null; } if (entro && best.dying) g.killedMob(best); if (entro) g.achieve('escudo_concha', 'Se lo devolví'); } // solo al que pegó de cerca, no a un inocente
    }
    g.audio.play('armadura.metal', { ui: true, vol: 0.8, pitch: 1.25 });
    g.audio.play('tajo', { ui: true, vol: 0.35, pitch: 1.4 });
    g.particles.burst(pos.x, pos.y, pos.z, [[1, 0.95, 0.6], [1, 1, 1], [1, 0.8, 0.2]], 22, 4);
    g.ui.combatFlash('parry', '¡PARRY!');
    g.parryT = 0.35;
    g.slowmo = Math.max(g.slowmo || 0, 0.22); // el mundo se frena un toque: el parry se siente
    g.shake = Math.max(g.shake || 0, 0.22);
    g.achieve('parry', '¡Parry perfecto!');
    return 0;
  }
  // BLOQUEO: el escudo aguanta según su material; gasta estamina y desgasta el escudo
  const power = sh ? sh.block : conArma ? PA.bloqueo : 0.35;
  const left = spend(g, amount * (sh ? 7 : 9) * (g.conjunto === 'iron' ? 0.75 : 1)); // el conjunto de hierro cansa menos
  g.blockHitT = 0.25;
  g.particles.burst(pos.x, pos.y, pos.z, [[0.9, 0.9, 0.9], [1, 0.7, 0.3]], 8, 2);
  if (!left) {
    g.blocking = false;
    g.ui.combatFlash('break', '¡Le rompieron la guardia!');
    g.audio.play('toolbreak', { ui: true, vol: 0.5 });
    return amount * 0.7;
  }
  g.audio.play(sh && sh.mat === 'wood' ? 'dig.wood' : 'armadura.metal', { ui: true, vol: 0.55 });
  if (sh) {
    const s = g.inventory.armor[SHIELD_SLOT];
    if (!(manaJefe(g, 'concha') && Math.random() < 0.2)) s.dur = (s.dur ?? sh.durability) - 1; // v12.16.5: «Concha», el escudo aguanta 20 % más
    if (s.dur <= 0) { g.inventory.armor[SHIELD_SLOT] = null; g.audio.play('toolbreak'); g.ui.toast('¡Se rompió el escudo!'); }
    g.inventory.changed();
  }
  return amount * (1 - power);
}

// Multiplicador de un golpe del jugador. heavy = ataque fuerte.
export function strike(g, mob, heavy) {
  const def = g.heldDef();
  const ck = g.clock || 0;
  const ws = weaponStats(def), P = perfil(def);
  const cost = (heavy ? ws.cost * 2.2 : ws.cost) * bonoAguante(g, claseDe(def)); // la maestría gasta menos aire
  const fresh = spend(g, cost, 0.55); // el aire ya se revisó antes de pegar (hayAire en armas3.js)
  let mult = 1;
  // la cadena de golpes de cada arma: cada paso pega distinto y el último remata
  const arma = g.inventory.held ? g.inventory.held.id : 0;
  if (g.comboArma !== arma) { g.comboArma = arma; g.comboPaso = -1; g.lastHitT = 0; } // otra arma, otra cadena
  const paso = heavy ? P.combo.length - 1 : ck - (g.lastHitT || 0) < ws.cd + 0.55 ? ((g.comboPaso ?? -1) + 1) % P.combo.length : 0;
  g.comboPaso = heavy ? -1 : paso;
  g.lastHitT = ck;
  g.comboVis = { n: P.combo.length, paso: heavy ? P.combo.length - 1 : paso, desde: ck, hasta: ck + ws.cd + 0.55 }; // los puntitos bajo la mira (armas3.js)
  if (!heavy) mult *= P.combo[paso];
  if (!heavy && paso === P.combo.length - 1 && P.combo[paso] >= 1.3) g.ui.combatFlash('combo', `Remate ×${P.combo[paso]}`);
  if (heavy) mult *= P.area || (def && def.slow) ? 2.6 : 2.1;
  let crit = false;
  if ((mob.stunT || 0) > 0) { mult *= 2; crit = true; }
  // el contraataque después de un esquive perfecto
  if ((g.contra || 0) > ck && mob.body) { g.contra = 0; mult *= 1.6; crit = true; g.ui.combatFlash('crit', '¡Contraataque!'); }
  return { mult, crit, fresh, def, ws, paso };
}

export function afterStrike(g, mob, heavy, info) {
  const b = mob.body.pos;
  if (heavy) {
    mob.body.vel.x *= 1.8; mob.body.vel.z *= 1.8;
    // el mazo y los golpes fuertes aturden un ratito
    mob.stunT = Math.max(mob.stunT || 0, info.def && info.def.slow ? 1.2 : 0.45);
    g.shake = Math.max(g.shake || 0, 0.25);
  }
  if (info.crit) {
    g.particles.burst(b.x, b.y + mob.kind.h * 0.7, b.z, [[1, 0.9, 0.3], [1, 1, 1]], 18, 3.5);
    g.ui.combatFlash('crit', '¡Crítico!');
  }
}

// ---------- por cuadro: estamina, esquive, barra y escudo en la mano ----------
export function tickCombat(g, dt) {
  if (g.stamina === undefined) { g.stamina = AGUANTE_MAX(g); g.staminaT = 0; }
  g.staminaT -= dt;
  const p = g.player;
  if (p.sprinting && g.mode === 'survival') { g.stamina = Math.max(0, g.stamina - 5 * dt); g.staminaT = Math.max(g.staminaT, 0.4); if (g.stamina <= 0) g.sprintKey = false; }
  if (g.staminaT <= 0 && !g.blocking) g.stamina = Math.min(AGUANTE_MAX(g), g.stamina + 24 * ventaja.estamina(g) * (g.player.effects.descansado ? 1.5 : 1) * dt);
  if (g.blocking && (!shieldDef(g) && !blockHand(g.heldDef()) || !g.mouse.right)) g.blocking = false;
  g.iframes = Math.max(0, (g.iframes || 0) - dt);
  g.parryT = Math.max(0, (g.parryT || 0) - dt);
  g.blockHitT = Math.max(0, (g.blockHitT || 0) - dt);
  p.forcedVel = null;
  if (g.slide) {
    g.slide.t -= dt;
    const k = Math.max(0, g.slide.t / 0.65);
    p.forcedVel = { x: g.slide.vx * (0.35 + k * 0.65), z: g.slide.vz * (0.35 + k * 0.65) };
    g.landHit = Math.max(g.landHit || 0, 0.7 * Math.min(1, k * 3));
    // la vista se ladea hacia el lado del barrido y se va un toque para atrás si es de reversa
    if (g.slide.lado) g.hurtTilt = -g.slide.lado * 0.18 * Math.min(1, k * 2);
    if (g.slide.atras) g.flipPitch = 0.08 * Math.min(1, k * 2);
    if (Math.random() < dt * 30) g.particles.spawn(p.body.pos.x, p.body.pos.y + 0.1, p.body.pos.z, [0.55, 0.45, 0.35], (Math.random() - 0.5), 0.8, (Math.random() - 0.5), 0.5, 4);
    if (g.slide.t <= 0) { if (g.slide.lado) g.hurtTilt = 0; if (g.slide.atras) g.flipPitch = 0; g.slide = null; }
  }
  if (g.flip) {
    g.flip.t -= dt;
    const T = g.flip.back ? 0.55 : 0.4, k = 1 - Math.max(0, g.flip.t) / T;
    if (g.flip.back) g.flipPitch = k * Math.PI * 2; else g.hurtTilt = -(g.flip.side || 0) * Math.sin(k * Math.PI) * 0.35;
    if (g.flip.t <= 0) { g.flip = null; g.flipPitch = 0; }
  }
  g.hopLock = Math.max(0, (g.hopLock || 0) - dt);
  // enfoque: la vista sigue al enemigo
  const L = g.lockOn;
  if (L) {
    const lp = g.player.body.pos, dx = L.body.pos.x - lp.x, dz = L.body.pos.z - lp.z, d = Math.hypot(dx, dz);
    if (L.dead || L.dying || d > 26) g.lockOn = null;
    else {
      const want = Math.atan2(-dx, -dz);
      let dy = want - g.player.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      g.player.yaw += dy * Math.min(1, dt * 9);
      const wantP = Math.atan2(L.body.pos.y + L.kind.h * 0.6 - (lp.y + 1.6), d) * 0.8;
      g.player.pitch += (wantP - g.player.pitch) * Math.min(1, dt * 5);
    }
  }
  if (!g.lockMark) {
    g.lockMark = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 6, 24), new THREE.MeshBasicMaterial({ color: 0xffd040, transparent: true, opacity: 0.9, depthTest: false }));
    g.lockMark.renderOrder = 20;
    g.scene.add(g.lockMark);
  }
  g.lockMark.visible = !!g.lockOn;
  if (g.lockOn) {
    const lm = g.lockOn.body.pos;
    g.lockMark.position.set(lm.x, lm.y + g.lockOn.kind.h + 0.55 + Math.sin((g.clock || 0) * 4) * 0.08, lm.z);
    g.lockMark.rotation.set(Math.PI / 2, 0, (g.clock || 0) * 2);
    g.lockMark.material.color.set(g.lockOn.stunT > 0 ? 0xffffff : g.lockOn.kind.hostile ? 0xff5030 : 0xffd040);
  }
  if (g.roll) {
    g.roll.t -= dt;
    p.forcedVel = { x: g.roll.vx * (g.roll.t > 0 ? 1 : 0.3), z: g.roll.vz * (g.roll.t > 0 ? 1 : 0.3) };
    g.landHit = Math.max(g.landHit || 0, 0.25 * Math.sin(Math.max(0, g.roll.t) / 0.3 * Math.PI));
    if (g.roll.spin) g.flipPitch = -(1 - Math.max(0, g.roll.t) / 0.42) * Math.PI * 2; else g.hurtTilt = -0.2 * (g.roll.side || 0) * Math.sin(Math.max(0, g.roll.t) / 0.3 * Math.PI);
    if (g.roll.t <= -0.05) { g.roll = null; if (!g.flip) g.flipPitch = 0; }
  }
  g.ui.setStamina(g.stamina / AGUANTE_MAX(g), g.mode === 'survival' && g.stamina < AGUANTE_MAX(g) - 0.5);
}

// escudo redondo de tablas (estilo vikingo), pintado por cuartos con los colores de la bandera, con bordes de
// hierro, clavos y una cazoleta de metal en el centro; las tablas tienen golpes y rayones
const roundTex = new Map();
function roundShieldTexture(def) {
  if (roundTex.has(def.id)) return roundTex.get(def.id);
  const N = 64, c = document.createElement('canvas'); c.width = c.height = N;
  const x = c.getContext('2d');
  const wood = def.mat === 'jade' ? ['#2e6a48', '#3a7c56'] : ['#7a4e26', '#8e5e30'];
  for (let i = 0; i < N; i += 8) { x.fillStyle = (i / 8) % 2 ? wood[0] : wood[1]; x.fillRect(i, 0, 8, N); x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(i, 0, 1, N); }
  // pintura por cuartos (azul y rojo) con franja blanca
  const paint = def.mat === 'wood' ? 0.55 : 0.8;
  for (let q = 0; q < 4; q++) {
    x.globalAlpha = paint; x.fillStyle = q % 2 ? '#1a3e9a' : '#b81e28';
    x.beginPath(); x.moveTo(N / 2, N / 2); x.arc(N / 2, N / 2, N / 2, (q * Math.PI) / 2, ((q + 1) * Math.PI) / 2); x.closePath(); x.fill();
  }
  x.globalAlpha = 1;
  x.fillStyle = '#ece6d8'; x.fillRect(N / 2 - 3, 0, 6, N); x.fillRect(0, N / 2 - 3, N, 6);
  // rayones y golpes
  x.strokeStyle = 'rgba(30,18,10,0.55)'; x.lineWidth = 1;
  for (let k = 0; k < 9; k++) { const a = (k * 2.4) % 6.28, r = 8 + ((k * 7) % 20); x.beginPath(); x.moveTo(N / 2 + Math.cos(a) * r, N / 2 + Math.sin(a) * r); x.lineTo(N / 2 + Math.cos(a + 0.3) * (r + 6), N / 2 + Math.sin(a + 0.3) * (r + 6)); x.stroke(); }
  // clavos en el borde
  x.fillStyle = '#d8d0b8';
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; x.fillRect(N / 2 + Math.cos(a) * 28 - 1, N / 2 + Math.sin(a) * 28 - 1, 2, 2); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  roundTex.set(def.id, t);
  return t;
}
function buildRoundShield(def) {
  const g = new THREE.Group();
  const R = 0.28;
  const face = new THREE.MeshBasicMaterial({ map: roundShieldTexture(def) });
  const edge = new THREE.MeshBasicMaterial({ color: def.mat === 'wood' ? 0x5a3a1c : 0x8a8f96 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.035, 28), [edge, face, face]);
  disc.rotation.x = Math.PI / 2;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.016, 6, 32), new THREE.MeshBasicMaterial({ color: def.mat === 'jade' ? 0xd8b040 : 0x5a5e66 }));
  const boss = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: def.mat === 'jade' ? 0xe8c858 : def.mat === 'iron' ? 0xb8bec6 : 0x7a7e86 }));
  boss.rotation.x = Math.PI / 2; boss.position.z = 0.018;
  const bossRing = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.01, 6, 20), new THREE.MeshBasicMaterial({ color: 0x3a3a40 }));
  bossRing.position.z = 0.02;
  g.add(disc, rim, boss, bossRing);
  return g;
}

// el escudo en la mano izquierda: abajo en reposo, al frente cuando bloqueás, con temblor al recibir golpes
export function updateShieldHand(g, dt, light) {
  const def = shieldDef(g);
  if (!def) { if (g.shieldMesh) g.shieldMesh.visible = false; return; }
  if (!g.shieldMesh || g.shieldMesh.userData.id !== def.id) {
    if (g.shieldMesh) { g.handScene.remove(g.shieldMesh); g.shieldMesh.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach((mm) => mm.dispose()); } }); }
    const m = buildRoundShield(def);
    m.userData.id = def.id;
    g.handScene.add(m);
    g.shieldMesh = m;
    // v11.11.2: el antebrazo izquierdo detrás del escudo, agarrando la correa (sale hacia abajo a la izquierda, hacia la cámara)
    if (g.armMesh) {
      const T = THREE, base = new T.Matrix4().compose(new T.Vector3(-0.55, -0.52, -0.75), new T.Quaternion().setFromEuler(new T.Euler(-0.1, 0.55, 0.15)), new T.Vector3(1, 1, 1));
      const X = new T.Vector3(0, 1, 0), Z = new T.Vector3(-0.45, -0.6, 0.66).normalize(); Z.sub(X.clone().multiplyScalar(Z.dot(X))).normalize();
      const Y = new T.Vector3().crossVectors(Z, X), R = new T.Matrix4().makeBasis(X, Y, Z);
      const punto = new T.Vector3(-0.53, -0.53, -0.69), pos = punto.sub(new T.Vector3(0, -0.035, -0.262).applyMatrix4(R));
      const brazo = g.armMesh({ puno: true });
      base.invert().multiply(R.setPosition(pos)).decompose(brazo.position, brazo.quaternion, brazo.scale);
      brazo.userData.brazo = true;
      m.add(brazo);
    }
    g.shieldPose = 0;
  }
  const m = g.shieldMesh;
  m.visible = true;
  g.shieldPose += ((g.blocking ? 1 : 0) - g.shieldPose) * Math.min(1, dt * (g.blocking ? 16 : 8));
  const k = g.shieldPose, hit = g.blockHitT > 0 ? Math.sin(g.blockHitT * 60) * 0.03 : 0, par = g.parryT > 0 ? g.parryT * 0.5 : 0;
  m.position.set(-0.55 + k * 0.26 + hit, -0.52 + k * 0.26 - par * 0.2, -0.75 + k * 0.02 + par);
  m.rotation.set(-0.1 + k * 0.08, 0.55 - k * 0.22, 0.15 - k * 0.12);
  const lv = g.parryT > 0 ? 1.6 : light;
  m.traverse((o) => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach((mm) => { if (mm.map || o.userData.brazo) mm.color.setScalar(o.userData.brazo ? light : lv); }); });
}
