// Criaturas (Danta y Sombra), ítems tirados en el suelo, dinamita encendida y partículas.
import { curvaLuz } from './brillo.js';
import { separar } from './separar.js';
import { atacar, tickGolpe, poseGolpe } from './golpes.js';
import * as THREE from 'three';
import { Body } from './physics.js';
import { BLOCKS, BLOCK_BY_KEY as K, AIR, SOLID, itemName, maxStack } from './blocks.js';
import { tilePixels } from './textures.js';
import { SEA } from './worldgen.js';
import { pal, tintModel, disposeModel, makeItemMesh } from './models.js';
import { FAUNA, faunaSpawn, flat } from './fauna.js';
import { FINCA, fincaSpawn } from './finca.js';
import { VECINO } from './pueblo.js';
import { MAR, seaSpawn } from './mar.js';
import { LEYENDAS, legendSpawn } from './leyendas.js';
import { TULEVIEJA } from './tulevieja.js';
import { ARPIA, arpiaSpawn } from './arpia.js';
import { CARRO } from './vehiculos.js';
import { ZANCUDO } from './zancudos.js';
import { BOLA } from './mejenga.js';
import { MINIJEFES, miniSpawn } from './armas2.js';
import { FAUNA2, fauna2Spawn } from './fauna2.js';
import { BRAVOS, bravosSpawn } from './bravos.js';
import { ALMAS } from './neblina.js';
import { ANIMA } from './procesion.js';
import { BAILARIN } from './bailarin.js';
import { PLAYA2, playaSpawn } from './playa2.js';
import { BICHOS, bichosSpawn } from './bichos.js';
import { BICHOS2 } from './bichos2.js';
import { BICHOS3, bichos3Spawn } from './bichos3.js';
import { JEFES2 } from './jefes2.js';
import { JEFES3 } from './jefes3.js';
import { FINAL } from './final.js';
import { ENJAMBRE } from './abejas.js';
import { MUNECOS } from './muneco.js';
import { identidadSpawn } from './identidad.js'; // v13.3.5 (BI0)
import { HONGOS, hongosSpawn } from './hongos.js';
import { CUEVA_FAUNA, cuevaFaunaSpawn } from './cuevavida.js';
import { armarSombra } from './modelos-sombra.js';
import { armarDanta } from './modelos-finca.js';
import { armarLapa } from './modelos-aves.js';
import { armarMono, armarMurcielago } from './modelos-menores.js';
import { quizaEstrellas } from './estrellas.js';
import { GOLETA } from './goleta.js';
import { MINA_ORO } from './minaoro.js';
import { perezosoCalleInteract } from './perezosocalle.js';
import { CHOMPIPE } from './chompipe.js';
import { GLOBO } from './globo.js';
import { FAUNA4 } from './fauna4.js';
import { TORO } from './toros.js';
import { MAR2, mar2Spawn } from './mar2.js';
import { MONO_CONGO_GIGANTE, monoCongoSpawn } from './monocongo.js';
import { capitana, sombraMadre, elOlvido, jefaVentanilla } from './arena.js';
import { calmaPlatos } from './plato.js';
import { esUnico } from './inventory.js';
import { doblarRodilla, doblarCodo } from './anatomia.js';
import { zonaSegura } from './historia.js';
import { calmaComarca, nidoCerca } from './nidos.js';
import { SAPO } from './mundo2.js';
import { MAPACHE, mapacheSpawn } from './fauna3.js';
import { BRUJA_ZARATE, zarateSpawn } from './leyendas2.js';
import { AVIONETA } from './avioneta.js';
import { TORTUGA_LORA } from './arribada.js';
import { FRAGATA } from './arrecife.js';
import { PATITO } from './tiro.js';
import { CARRETA as CARRETA_BUEYES } from './carreta.js';
import { RANA_VIDRIO, ranaVidrioSpawn } from './extras10.js';
import { variantesSombra, tipoSombra, soltarBotin } from './sombras2.js';
import { DOS_RUEDAS } from './vehiculos2.js';
import { REY } from './caverna.js';
import { LORO, mascotaInteract, loroSpawn } from './mascotas.js';
import { caneloInteract } from './canelo.js';
import { darTrofeo } from './hogar.js';
import { SIRENA, sirenaSpawn } from './sirena.js';
import { difOf } from './supervivencia.js';
import { BUS } from './bus.js';
import { INFRA_MOBS, infraSpawn, bossSpawn } from './inframundo.js';
import { JEFES_BALANCE } from './jefes-balance.js';

// ---------- pieles ----------




// ---------- tipos de criatura ----------
const DANTA = {
  name: 'Danta', w: 0.9, h: 1.15, health: 10, speed: 1.5, hostile: false,
  // con fruta se hace tu compañera; con un cofre se vuelve animal de carga
  brain(m, dt, c) {
    if (!m.tamed) return false;
    m.follow(c.distP, c.dxp, c.dzp, m.data.stay ? 999 : 3.5);
    if (m.data.stay) m.moving = false;
    return true;
  },
  interact(m, g, held) {
    if (!m.tamed && held && (held.id === 275 || held.id === 276 || held.id === 261)) {
      if (g.mode === 'survival') g.inventory.consumeHeld(1);
      m.tamed = true;
      g.particles.burst(m.body.pos.x, m.body.pos.y + 1.2, m.body.pos.z, [[1, 0.45, 0.6], [1, 0.7, 0.8]], 10, 1.2);
      g.ui.toast('¡La danta ahora es su compañera! Déle un cofre para que cargue cosas', 2600);
      g.achieve('danta_amiga', 'Amiga danta');
      return true;
    }
    if (m.tamed && held && held.id === K.chest && !m.data.chest) {
      if (g.mode === 'survival') g.inventory.consumeHeld(1);
      m.data.chest = new Array(18).fill(null);
      g.ui.toast('La danta ahora carga un cofre (clic derecho para abrirlo)', 2200);
      return true;
    }
    if (m.tamed && m.data.chest) { g.ui.openEntityChest(m); return true; }
    if (m.tamed) { m.data.stay = !m.data.stay; g.ui.toast(m.data.stay ? 'La danta se queda aquí' : 'La danta anda con usted', 1300); return true; }
    return false;
  },
  animate(m, dt, u) {
    if (m.data.chest && !u.pack) { u.pack = makeItemMesh(K.chest, 0.5); u.pack.position.set(0, 1.3, -0.1); u.body.add(u.pack); }
  },
  hurtSound: 'danta.hurt', idleSound: 'danta', particle: [[0.16, 0.13, 0.12], [0.25, 0.21, 0.19], [0.6, 0.55, 0.47]],
  drops: [[262, 1, 2], [271, 1, 2]],
  build() { return armarDanta(); },
};

const SOMBRA = {
  name: 'Sombra', w: 0.7, h: 1.9, health: 20, speed: 3, hostile: true, attack: 3,
  // al morir no cae: se deshace. La tela se desploma, se hunde en una columna de humo negro con brasas, y los ojos quedan
  // brillando un instante antes de apagarse
  morirDura: 1.15,
  morir(m, dt, esc, g) {
    const t = m.dying, k = Math.min(1, t / 1.1), b = m.body.pos;
    m.group.rotation.x = 0; m.group.rotation.z = Math.sin(t * 20) * 0.04 * (1 - k);
    m.group.scale.set(esc * (1 + k * 0.4), esc * Math.max(0.04, 1 - k * k), esc * (1 + k * 0.4));
    m.group.position.set(b.x, b.y - k * 0.25, b.z);
    const w = m.kind.w || 0.7, h = (m.kind.h || 1.9) * (1 - k * 0.7);
    for (let i = 0; i < 3; i++) g.particles.spawn(b.x + (Math.random() - 0.5) * w * 1.6, b.y + Math.random() * h, b.z + (Math.random() - 0.5) * w * 1.6, Math.random() < 0.5 ? [0.05, 0.05, 0.08] : [0.16, 0.14, 0.2], (Math.random() - 0.5) * 0.4, 1.4 + Math.random(), (Math.random() - 0.5) * 0.4, 1.1, -0.6);
    if (Math.random() < dt * 14) g.particles.spawn(b.x + (Math.random() - 0.5) * w, b.y + h * 0.8, b.z + (Math.random() - 0.5) * w, [1, 0.6, 0.2], (Math.random() - 0.5), 2, (Math.random() - 0.5), 0.6, -0.5, true);
    const u = m.group.userData;
    if (u.eyes) u.eyes.children.forEach((e) => { e.material.transparent = true; e.material.opacity = Math.max(0, 1 - Math.max(0, k - 0.6) * 2.5); });
    tintModel(m.group, m.lightLevel() * (1 - k * 0.5), 0);
  },
  hurtSound: 'sombra.hurt', idleSound: 'sombra', particle: [[0.05, 0.08, 0.1], [0.1, 0.16, 0.2], [1, 0.7, 0.25]],
  drops: [[257, 0, 2]],
  build() { return armarSombra(); },
};
// ---------- fauna tica ----------
const RED = pal('#8e1414', '#b51f1f', '#d62f2a', '#ea4a3c');
const LAPA = {
  name: 'Lapa roja', w: 0.5, h: 0.5, health: 6, speed: 5, hostile: false, flying: true, flyHigh: true,
  hurtSound: 'lapa', idleSound: 'lapa', particle: [RED[2].map((v) => v / 255), [0.95, 0.77, 0.16], [0.16, 0.43, 0.82]],
  drops: [],
  build() { return armarLapa(); },
};

const MONO = {
  name: 'Mono congo', w: 0.5, h: 0.75, health: 8, speed: 2.4, hostile: false, climber: true,
  hurtSound: 'mono', idleSound: 'mono', idleEvery: [8, 18], particle: [[0.1, 0.08, 0.07], [0.35, 0.24, 0.12]],
  drops: [],
  build() { return armarMono(); },
};

const MURCIELAGO = {
  name: 'Murciélago', w: 0.35, h: 0.35, health: 3, speed: 4, hostile: false, flying: true, cave: true,
  hurtSound: 'murcielago', idleSound: 'murcielago', idleEvery: [3, 7], particle: [[0.15, 0.12, 0.1]],
  drops: [],
  build() { return armarMurcielago(); },
};

// v2.55: el vampiro (sí hay en Costa Rica): en lo hondo de las cuevas, se acerca volando bajito, muerde y se aleja
const VAMPIRO = {
  name: 'Murciélago vampiro', w: 0.35, h: 0.35, health: 5, speed: 4.5, hostile: true, flying: true, attack: 1, xp: 3,
  hurtSound: 'murcielago', idleSound: 'murcielago', idleEvery: [2, 5], particle: [[0.3, 0.05, 0.05], [0.15, 0.12, 0.1]], drops: [[280, 0, 2]],
  build() {
    const g = MURCIELAGO.build();
    const body = g.userData.body;
    // cara de vampiro: ojitos rojos que brillan, colmillos y orejas más grandes
    body.add(flat(0xff2a1a, 0.03, 0.025, 0.01, -0.024, 0.06, 0.121, true), flat(0xff2a1a, 0.03, 0.025, 0.01, 0.024, 0.06, 0.121, true));
    body.add(flat(0xf4f0e0, 0.012, 0.03, 0.01, -0.016, 0.015, 0.115), flat(0xf4f0e0, 0.012, 0.03, 0.01, 0.016, 0.015, 0.115));
    for (const sx of [-1, 1]) body.add(flat(0x2a1a16, 0.04, 0.08, 0.02, sx * 0.05, 0.12, 0.02));
    g.userData.babyScale = 1.2;
    return g;
  },
  flyGoal(m, g) {
    const pl = g.player.body.pos, b = m.body.pos, ck = g.clock || 0;
    if (ck < (m.data.away || 0)) return { x: b.x + (b.x - pl.x), y: pl.y + 3, z: b.z + (b.z - pl.z) };
    const d = Math.hypot(pl.x - b.x, pl.y + 1 - b.y, pl.z - b.z);
    if (d < 0.9 && g.mode === 'survival' && g.player.alive) {
      m.data.away = ck + 2.5 + Math.random() * 2;
      g.damagePlayer(1, b.x, b.z, 'Lo mordió un murciélago vampiro', false, false);
      m.health = Math.min(VAMPIRO.health, m.health + 1);
      if (!g.meta.vampiro) { g.meta.vampiro = true; g.ui.toast('🦇 ¡Un vampiro! Muerde y se va. Una antorcha cerca los espanta', 2800); }
    }
    return { x: pl.x + Math.cos(ck * 4) * 0.5, y: pl.y + 1.1, z: pl.z + Math.sin(ck * 4) * 0.5 };
  },
};

const SOMBRAS2 = variantesSombra(SOMBRA);
export const MOB_TYPES = { danta: DANTA, sombra: SOMBRA, ...SOMBRAS2, ...BRAVOS, ...ALMAS, ...ANIMA, ...BAILARIN, ...PLAYA2, ...BICHOS, ...BICHOS2, ...BICHOS3, ...JEFES2, ...JEFES3, ...FINAL, ...ENJAMBRE, ...MUNECOS, ...HONGOS, ...CUEVA_FAUNA, ...GOLETA, ...MINA_ORO, ...CHOMPIPE, ...GLOBO, ...FAUNA4, ...TORO, sombra_capitana: capitana(SOMBRA), sombra_madre: sombraMadre(SOMBRA), el_olvido: elOlvido(SOMBRA), jefa_ventanilla: jefaVentanilla(SOMBRA), lapa: LAPA, mono: MONO, murcielago: MURCIELAGO, vampiro: VAMPIRO, ...FAUNA, ...FINCA, vecino: VECINO, ...MAR, ...LEYENDAS, tulevieja: TULEVIEJA, arpia: ARPIA, carro: CARRO, bus: BUS, zancudo: ZANCUDO, bola: BOLA, ...MINIJEFES, ...FAUNA2, ...MAR2, mono_congo_gigante: MONO_CONGO_GIGANTE, sapo: SAPO, mapache: MAPACHE, bruja_zarate: BRUJA_ZARATE, avioneta: AVIONETA, tortuga_lora: TORTUGA_LORA, fragata: FRAGATA, patito: PATITO, carreta: CARRETA_BUEYES, rana_vidrio: RANA_VIDRIO, ...DOS_RUEDAS, rey_murcielago: REY, loro: LORO, sirena: SIRENA, ...INFRA_MOBS };
// v12.4.9: la vida de los jefes sale de la tabla calibrada con el bot (jefes-balance.js)
for (const [t, J] of Object.entries(JEFES_BALANCE)) if (MOB_TYPES[t] && J.vida) MOB_TYPES[t].health = J.vida;

let SIG_NID = 0; // v12.14.0 (F4): el número con que el anfitrión nombra a cada criatura ante las demás personas
class Mob {
  constructor(game, kind, x, y, z) {
    this.game = game;
    this.nid = ++SIG_NID;
    this.kind = kind;
    this.body = new Body(kind.w, kind.h);
    this.body.pos.x = x; this.body.pos.y = y; this.body.pos.z = z;
    this.health = kind.health;
    this.yaw = Math.random() * Math.PI * 2;
    this.targetYaw = this.yaw;
    this.headYaw = 0; this.headPitch = 0;
    this.walk = 0; this.walkAmt = 0;
    this.thinkT = 0;
    this.moving = false;
    this.panic = 0;
    this.hurtT = 0;
    this.attackCd = 0;
    this.lunge = 0;
    this.graze = 0;
    this.earT = 0;
    this.idleT = 3 + Math.random() * 8;
    this.t = Math.random() * 10;
    this.dying = 0;
    this.dead = false;
    this.spawnT = 0;
    this.sq = 0; this.sqV = 0; this.lean = 0; this.roll = 0; this.prevYaw = null; this.deathSide = 1;
    this.data = {};
    this.tamed = false;
    this.group = kind.build();
    this.group.rotation.order = 'YXZ';
    this.group.scale.setScalar(0.01);
    game.scene.add(this.group);
  }

  soundPos() { return { x: this.body.pos.x, y: this.body.pos.y + this.kind.h * 0.6, z: this.body.pos.z }; }

  // clic derecho del jugador sobre la criatura; devuelve true si hizo algo
  interact(held) {
    if (this.titere) return false; // el títere de un invitado solo se mira
    if (perezosoCalleInteract(this, this.game)) return true;
    if (caneloInteract(this, this.game, held)) return true;
    if (mascotaInteract(this, this.game, held)) return true;
    return this.kind.interact ? !!this.kind.interact(this, this.game, held) : false;
  }

  // ir hacia un punto (ajusta el rumbo; la física la hace update)
  goTo(x, z, speedMul = 1) {
    const b = this.body.pos;
    this.targetYaw = Math.atan2(x - b.x, z - b.z);
    this.moving = Math.hypot(x - b.x, z - b.z) > 0.6;
    this.speedMul = speedMul;
  }

  // seguir al jugador (mascotas)
  follow(distP, dxp, dzp, near = 3, tp = 28) {
    const g = this.game, pl = g.player.body.pos;
    if (distP > tp) { this.body.pos.x = pl.x - dxp / distP * 2; this.body.pos.z = pl.z - dzp / distP * 2; this.body.pos.y = pl.y + 0.5; return; }
    if (distP > near) this.goTo(pl.x, pl.z, distP > 8 ? 1.8 : 1.2);
    else { this.moving = false; this.targetYaw = Math.atan2(dxp, dzp); }
  }

  hurt(dmg, fromX, fromZ) {
    if (this.dying || this.titere || (this.data && this.data.inmortal)) return false; // (v12.16.5: los vecinos de la ladera del Rey son inmortales) al títere solo le pega el anfitrión (golpe por la red)
    this.data.provoked = true;
    const atajo = this.kind.onHurt ? this.kind.onHurt(this, this.game, dmg) : true;
    if (atajo === false) return false; // atajado (escudo, concha, caparazón…)
    if (typeof atajo === 'number') dmg *= atajo; // atajado a medias: solo entra esa parte (la tenaza del cangrejo)
    this.health -= dmg;
    this.data.golpeT = this.game.clock || 0; // para la barrita de vida (barras.js)
    if (this.game.mode === 'survival' && dmg < 1000) this.game.ui.numeroDano(dmg, this.body.pos.x, this.body.pos.y + this.kind.h + 0.2, this.body.pos.z);
    this.hurtT = 0.4;
    const dx = this.body.pos.x - fromX, dz = this.body.pos.z - fromZ;
    const len = Math.hypot(dx, dz) || 1;
    const kb = this.game.kbGolpe ?? 1; // el empuje del arma (armas3.js): el mazo tira lejos, el cuchillo casi nada
    this.body.vel.x = (dx / len) * 7 * kb;
    this.body.vel.z = (dz / len) * 7 * kb;
    this.body.vel.y = 6 * Math.min(1.25, 0.55 + kb * 0.45);
    this.panic = 5;
    this.sqV += 6; // se aplasta con el golpe y rebota
    this.headKick = 1;
    // el golpe se le ve en el cuerpo: se va para atrás o de lado según de dónde vino
    if (Number.isFinite(this.yaw)) {
      const fuerza = Math.min(1.3, 0.6 + (this.game.kbGolpe ?? 1) * 0.4) * (this.kind.boss ? 0.4 : 1), sy = Math.sin(this.yaw), cy = Math.cos(this.yaw), px = dx / len, pz = dz / len;
      // v13.2.4: un balanceo CORTO (antes se sumaba en cada golpe sin tope: hasta 1,7 rad y se acostaban/retorcían sobre los pies): con tope y siempre vuelve
      this.lean = Math.max(-0.12, Math.min(0.12, (this.lean || 0) + (px * sy + pz * cy) * 0.1 * fuerza));
      this.roll = Math.max(-0.09, Math.min(0.09, (this.roll || 0) - (px * cy - pz * sy) * 0.09 * fuerza));
    }
    this.deathSide = (dx * Math.cos(this.yaw) - dz * Math.sin(this.yaw)) >= 0 ? -1 : 1;
    this.game.audio.play(this.kind.hurtSound, { pos: this.soundPos() });
    this.game.particles.burst(this.body.pos.x, this.body.pos.y + this.kind.h * 0.6, this.body.pos.z, this.kind.particle, 6, 2);
    if (this.health <= 0) {
      this.dying = 0.001; darTrofeo(this.game, this);
      // la caída de un jefe tiene su momento: cámara lenta, temblor, estallido y el trueno
      if (this.kind.boss && this.game.mode === 'survival') {
        const g = this.game, p = this.body.pos;
        g.slowmo = Math.max(g.slowmo || 0, 1.1); g.shake = Math.max(g.shake || 0, 0.9);
        g.particles.burst(p.x, p.y + this.kind.h * 0.6, p.z, [...(this.kind.particle || [[1, 1, 1]]), [1, 0.9, 0.5], [1, 1, 1]], 70, 6);
        g.audio.play('trueno', { ui: true, vol: 0.7, pitch: 1.3 });
        g.ui.combatFlash('crit', `¡${this.kind.name} cayó!`);
      }
    }
    return true;
  }

  finishDeath() {
    this.dead = true;
    const p = this.body.pos;
    this.game.particles.burst(p.x, p.y + this.kind.h / 2, p.z, this.kind.particle, 30, 3.5);
    if (this.titere) return; // el títere solo se deshace: el botín lo reparte el anfitrión
    const botin = [];
    for (const [id, n] of this.sortearBotin()) if (this.data.botinPara !== undefined) botin.push([id, n]); else this.game.entities.dropItem(id, n, p.x, p.y + 0.5, p.z);
    // v12.14.0 (F4): si lo mató una persona invitada, el botín es de ella; si no pudo llegarle, queda en el suelo como siempre
    if (botin.length) {
      const R = this.game.red;
      if (!(R && R.botin && R.botin(this.data.botinPara, botin))) for (const [id, n] of botin) this.game.entities.dropItem(id, n, p.x, p.y + 0.5, p.z);
    }
  }

  // lo que suelta al morir (con estrellas suelta el doble o el triple; la revancha, el doble). v12.14.1: aparte para repartirlo a cada persona que participó
  sortearBotin() {
    const l = [];
    for (const [id, min, max] of this.kind.drops) {
      const n = (min + Math.floor(Math.random() * (max - min + 1))) * (1 + (this.data.estrellas || 0) + (this.data.revancha ? 1 : 0));
      if (n > 0) l.push([id, n]);
    }
    return l;
  }

  remove() {
    if (this.kind.onRemove) this.kind.onRemove(this, this.game);
    this.game.scene.remove(this.group);
    disposeModel(this.group);
  }

  update(dt) {
    if (this.descartado) return; // un invitado no simula criaturas propias: lo que nace en su mundo se tira
    const g = this.game;
    const b = this.body;
    const u = this.group.userData;
    this.t += dt;
    this.spawnT = Math.min(1, this.spawnT + dt * 2.6);
    // resorte de aplastar/estirar (golpes, saltos y aterrizajes)
    this.sqV += (-this.sq * 170 - this.sqV * 13) * Math.min(dt, 0.05);
    this.sq = Math.max(-0.35, Math.min(0.4, this.sq + this.sqV * Math.min(dt, 0.05)));
    // aparece con un rebotito (sale un poquito más grande y se acomoda)
    const st = this.spawnT - 1, aparece = this.spawnT < 1 ? 1 + 2.4 * st * st * st + 1.4 * st * st : 1;
    const esc = aparece * (u.babyScale || 1);
    // el encogerse final de la muerte
    const fin = this.dying > 0.62 ? Math.max(0, 1 - (this.dying - 0.62) / 0.28) : 1;
    this.group.scale.set(esc * (1 + this.sq * 0.45) * fin, esc * (1 - this.sq) * fin, esc * (1 + this.sq * 0.45) * fin);

    if (this.dying) {
      // cae de lado, se pone rojo y desaparece en una nube
      this.dying += dt;
      // las que tienen su propia muerte (las Sombras se deshacen en humo)
      if (this.kind.morir) {
        this.kind.morir(this, dt, esc, g);
        b.vel.x *= Math.pow(0.02, dt); b.vel.z *= Math.pow(0.02, dt);
        b.step(g.world, dt);
        if (this.dying > (this.kind.morirDura || 0.9)) this.finishDeath();
        return;
      }
      // cae hacia el lado contrario del golpe con un rebotito al tocar el suelo
      const k = Math.min(1, this.dying / 0.42);
      const caida = k < 0.8 ? (k / 0.8) * (k / 0.8) : 1 - Math.sin(((k - 0.8) / 0.2) * Math.PI) * 0.08;
      this.group.rotation.z = this.deathSide * caida * (Math.PI / 2) * 0.92;
      this.group.rotation.x = 0;
      // el polvo al pegar contra el suelo
      if (k >= 0.8 && !this.polvoMuerte) { this.polvoMuerte = true; g.particles.burst(b.pos.x + this.deathSide * this.kind.h * 0.4 * Math.cos(this.yaw || 0), b.pos.y + 0.1, b.pos.z, [[0.55, 0.48, 0.38], [0.42, 0.36, 0.28]], 8, 1.4); }
      b.vel.x *= Math.pow(0.02, dt); b.vel.z *= Math.pow(0.02, dt);
      b.step(g.world, dt);
      this.group.position.set(b.pos.x, b.pos.y, b.pos.z);
      tintModel(this.group, this.lightLevel(), 0.8);
      if (this.dying > 0.9) this.finishDeath();
      return;
    }

    if (this.titere) { this.updateTitere(dt); return; }
    tickGolpe(this, g, dt);
    if (this.kind.update) { this.stunT = Math.max(0, (this.stunT || 0) - dt); this.conObjetivoCercano(() => this.kind.update(this, dt)); poseGolpe(this); return; } // el aturdimiento se va (antes al Rey Zopilote se le quedaba para siempre)
    if (this.kind.flying) { this.flyUpdate(dt); poseGolpe(this); return; }

    this.thinkT -= dt;
    this.panic = Math.max(0, this.panic - dt);
    this.hurtT = Math.max(0, this.hurtT - dt);
    this.attackCd = Math.max(0, this.attackCd - dt);
    // v12.14.0 (F4): con invitados, la persona más cercana (la local o una de fuera); si no, siempre la local, como antes
    const objetivo = g.red ? g.jugadorMasCercano(b.pos.x, b.pos.z) : g.player;
    this.objetivo = objetivo === g.player ? null : objetivo;
    const pl = objetivo.body.pos;
    const dxp = pl.x - b.pos.x, dzp = pl.z - b.pos.z;
    const distP = Math.hypot(dxp, dzp);

    let speed = this.kind.speed * (this.speedMul || 1);
    this.speedMul = 1;
    // cada especie puede decidir por su cuenta (devuelve true si ya decidió qué hacer)
    // aturdido (parry o golpe fuerte): se tambalea con estrellitas y no ataca
    const stunned = (this.stunT || 0) > 0;
    if (stunned) {
      this.stunT -= dt; this.moving = false;
      if (Math.random() < dt * 8) g.particles.spawn(b.pos.x + Math.cos(this.t * 6) * 0.5, b.pos.y + this.kind.h + 0.25, b.pos.z + Math.sin(this.t * 6) * 0.5, [1, 0.95, 0.4], 0, 0.2, 0, 0.35, 0, true);
    }
    // los que siguen al jugador en una historia (el Canelo, la Pinta, Chepe)
    if (this.data.sigue && !stunned) this.follow(distP, dxp, dzp, 2.5);
    // los que van en un desfile dan vueltas a la plaza
    if (this.data.ruta && !stunned && !this.data.sigue) { const r = this.data.ruta; r.a += dt * 0.12; this.goTo(r.cx + Math.cos(r.a) * r.r, r.cz + Math.sin(r.a) * r.r * 0.75, 0.7); }
    const espantado = !stunned && (this.data.espanto || 0) > (g.clock || 0); // un aullido o un cacho: sale corriendo
    if (espantado) this.panic = Math.max(this.panic, 0.5);
    if (this.data.duerme && !stunned && !espantado) this.moving = false; // v12.4.2: de noche duermen (finca2.js)
    // v12.4.7: las rutinas de día (finca2.js destinoRutina): al techo, a la sombra o a la orilla a beber
    const rutina = !stunned && !espantado && !this.data.duerme && !this.atk && this.rutina;
    if (rutina) {
      const R = this.rutina, dr = Math.hypot(R.x - b.pos.x, R.z - b.pos.z);
      if (R.llego || dr < 1.1) { this.moving = false; if (R.mira) this.targetYaw = Math.atan2(R.mira.x - b.pos.x, R.mira.z - b.pos.z); if (R.mira) this.graze = Math.max(this.graze, 0.5); } // bebiendo: la cabeza abajo
      else this.goTo(R.x, R.z, 0.8);
    }
    const decided = (this.data.duerme || rutina) && !stunned && !espantado ? true : espantado ? false : this.data.comensalFn && !stunned && this.data.comensalFn(this, dt) ? true : stunned || this.atk || this.data.sigue || this.data.ruta || this.data.arreo || this.data.animo ? true : this.kind.brain ? this.kind.brain(this, dt, { g, pl, dxp, dzp, distP }) : false;
    if (decided) {
      if (!this.data.sereno) speed = this.kind.speed * (this.speedMul || 1); // el sereno ya trae su paso de la ronda
    } else if (!espantado && this.kind.hostile && distP < (this.data.provoked ? 60 : 24 * (g.conjunto === 'leather' && g.player.sneaking ? 0.5 : 1)) && objetivo.alive && g.mode === 'survival' && !(g.disguised && distP > 3 && this.hurtT <= 0 && !this.data.provoked)) {
      // en manada no llegan en fila: cada una entra por su lado (rodean a uno) y de cerca van derecho
      if (this.data.flanco === undefined) this.data.flanco = (Math.random() - 0.5) * 1.8;
      this.targetYaw = Math.atan2(dxp, dzp) + (distP > 3.2 ? this.data.flanco * Math.min(1, (distP - 3.2) / 6) : 0);
      this.moving = distP > 0.9;
      speed *= 1.25;
      // entre golpe y golpe se mueven alrededor de uno, midiendo la distancia, en vez de quedarse pegados
      if (this.attackCd > 0.25 && distP < 3 && !this.kind.boss) {
        if (this.data.rondaLado === undefined || Math.random() < dt * 0.7) this.data.rondaLado = Math.random() < 0.5 ? 1 : -1;
        this.targetYaw = Math.atan2(dxp, dzp) + this.data.rondaLado * (distP < 1.5 ? 2.1 : 1.35);
        this.moving = true; speed *= 0.55;
      }
      if (distP < 1.4 + this.kind.w * 0.5 && Math.abs(pl.y - b.pos.y) < 1.8 && this.attackCd <= 0) atacar(this, g, { dano: this.kind.attack * (this.data.fuerza || 1), causa: `Golpe de ${this.data.nemesis ? `«${this.data.name}»` : this.kind.name}`, cd: 1.1 });
    } else if (this.panic > 0) {
      if (this.thinkT <= 0) { this.targetYaw = Math.atan2(-dxp, -dzp) + (Math.random() - 0.5) * 1.5; this.thinkT = 0.6; }
      this.moving = true;
      speed *= 2.1;
      this.graze = 0;
    } else if (this.thinkT <= 0) {
      this.thinkT = 2 + Math.random() * 4;
      this.moving = Math.random() < 0.5;
      this.targetYaw = Math.random() * Math.PI * 2;
      if (!this.moving && !this.kind.hostile && Math.random() < 0.5) this.graze = 2 + Math.random() * 2;
    }
    this.graze = Math.max(0, this.graze - dt);
    // protección: un giro inválido (NaN) deja a la criatura invisible y quieta; se corrige solo
    if (!Number.isFinite(this.targetYaw)) this.targetYaw = Number.isFinite(this.yaw) ? this.yaw : 0;
    if (!Number.isFinite(this.yaw)) this.yaw = this.targetYaw;
    let dy = this.targetYaw - this.yaw;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    const giroTope = (this.kind.giroMax || 5.5) * (this.panic > 0 ? 1.5 : 1), giroQuiere = Math.max(-giroTope, Math.min(giroTope, dy * 6.5));
    this.yawV = (this.yawV || 0) + (giroQuiere - (this.yawV || 0)) * Math.min(1, dt * 11);
    this.yaw += this.yawV * dt;

    const ctrl = b.onGround ? 1 : 0.25;
    const enAire = !b.onGround, vyAntes = b.vel.y;
    const bx = b.pos.x, bz = b.pos.z;
    if (this.frozen) {
      // colgado o quieto: sin física (perezosos en las ramas, etc.); si lo montan, la física la maneja el jinete
      if (!this.data.ridden) b.vel.x = b.vel.y = b.vel.z = 0;
    } else {
    if (this.moving && this.hurtT <= 0) {
      if (this.data.enredo > 0) { this.data.enredo -= dt; speed *= 0.35; } // alambre de púas
      const tx = Math.sin(this.yaw) * speed, tz = Math.cos(this.yaw) * speed;
      b.vel.x += (tx - b.vel.x) * Math.min(1, dt * 10 * ctrl);
      b.vel.z += (tz - b.vel.z) * Math.min(1, dt * 10 * ctrl);
    } else {
      const f = Math.pow(b.onGround ? 0.0005 : 0.3, dt);
      b.vel.x *= f; b.vel.z *= f;
    }
    if (b.inWater && !this.kind.swimmer) b.vel.y = Math.max(b.vel.y, 1.5);
    b.step(g.world, dt, { flying: !!this.noGravity });
    if (b.hitWall && b.onGround && this.moving && !this.kind.noJump) { b.vel.y = 8.2; this.sqV -= 4; }
    // aterrizaje: se aplasta un poquito según la caída
    if (enAire && b.onGround && vyAntes < -4) this.sqV += Math.min(7, -vyAntes * 0.55);
    }
    if (!this.frozen && b.onGround && this.panic <= 0 && !this.kind.hostile && !this.tamed) {
      const ax = Math.floor(b.pos.x + Math.sin(this.yaw)), az = Math.floor(b.pos.z + Math.cos(this.yaw));
      if ((this.bordeT = Math.max(0, (this.bordeT || 0) - dt)) <= 0 && !SOLID[g.world.getBlock(ax, Math.floor(b.pos.y - 1), az)] && !SOLID[g.world.getBlock(ax, Math.floor(b.pos.y - 2), az)]) { this.targetYaw = this.yaw + Math.PI + (Math.random() - 0.5) * 0.8; this.bordeT = 1.1; }
    }
    const moved = Math.hypot(b.pos.x - bx, b.pos.z - bz);
    const spd = moved / Math.max(dt, 1e-4);
    const pasito = b.onGround ? Math.min(0.4, Math.abs(this.yawV || 0) * 0.22) : 0; // gira sobre el sitio dando pasitos
    this.walk += moved * 3.4 + pasito * dt * 7;
    this.walkAmt += (Math.max(Math.min(1, spd / 2), pasito) - this.walkAmt) * Math.min(1, dt * 8);
    if (b.pos.y < -10) this.dead = true;
    this.lavaT = Math.max(0, (this.lavaT || 0) - dt);
    if (b.inLava && this.lavaT <= 0) { this.lavaT = 0.5; this.hurt(4, b.pos.x, b.pos.z); }

    this.idleT -= dt;
    if (this.idleT <= 0) {
      const [a, bb] = this.kind.idleEvery || [6, 18];
      this.idleT = a + Math.random() * (bb - a);
      // el aullido del mono congo se oye de lejos
      if (distP < (this.type === 'mono' ? 60 : 20)) g.audio.play(this.kind.idleSound, { pos: this.soundPos(), vol: this.type === 'mono' ? 1 : 0.7 });
    }
    if (u.tail && this.type === 'mono') u.tail.rotation.y = Math.sin(this.t * 1.2) * 0.4;
    if (this.kind.animate) this.kind.animate(this, dt, u);

    // ---- animación ----
    this.group.position.set(b.pos.x, b.pos.y, b.pos.z);
    this.group.rotation.y = this.yaw;
    // se inclina hacia adelante al andar y hacia adentro al doblar (con su vaivén al caminar)
    if (u.legs && !this.frozen) {
      let giro = this.prevYaw == null ? 0 : this.yaw - this.prevYaw;
      while (giro > Math.PI) giro -= Math.PI * 2;
      while (giro < -Math.PI) giro += Math.PI * 2;
      const vg = giro / Math.max(dt, 1e-4);
      const rollMeta = Math.max(-0.16, Math.min(0.16, -vg * 0.05 * this.walkAmt)) + Math.sin(this.walk) * 0.035 * this.walkAmt;
      const leanMeta = this.walkAmt * Math.min(0.09, spd * 0.015) + (b.onGround ? 0 : Math.max(-0.1, Math.min(0.1, -b.vel.y * 0.012)));
      this.roll += (rollMeta - this.roll) * Math.min(1, dt * 8);
      this.lean += (leanMeta - this.lean) * Math.min(1, dt * 6);
      this.group.rotation.z = this.roll; this.group.rotation.x = this.lean;
    } else { this.roll *= Math.max(0, 1 - dt * 8); this.lean *= Math.max(0, 1 - dt * 8); } // sin patas el balanceo no se aplica, pero tampoco se queda guardado
    this.prevYaw = this.yaw;
    const sw = Math.sin(this.walk) * this.walkAmt;
    if (u.legs) u.legs.forEach((l, i) => { l.rotation.x = (i === 0 || i === 2 ? sw : -sw) * 0.75; doblarRodilla(l, this.walk + (i === 0 || i === 2 ? 0 : Math.PI), this.walkAmt * 0.95, dt, b.onGround ? 0 : 1); });
    const brazosGente = u.npcArms || u.brazos;
    if (brazosGente) for (const a of brazosGente) doblarCodo(a, dt, a.children.length <= 2); // con algo colgado del brazo, va derecho
    if (u.legs) u.body.position.y = Math.abs(Math.cos(this.walk)) * 0.04 * this.walkAmt + Math.sin(this.t * 1.8) * 0.006;
    if (u.body && !this.frozen) { if (u.bodyS === undefined) { u.bodyS = u.body.scale.x; u.fase = Math.random() * 6.28; } const resp = Math.sin(this.t * 1.7 + u.fase) * 0.014 * (1 - this.walkAmt); u.body.scale.set(u.bodyS * (1 + resp * 0.7), u.bodyS * (1 + resp), u.bodyS * (1 + resp * 0.7)); }
    // mirar al jugador si está cerca
    let wantHeadYaw = 0, wantHeadPitch = 0;
    this.miraT = (this.miraT ?? Math.random() * 3) - dt;
    if (this.miraT < -2 - Math.random()) this.miraT = 2 + Math.random() * 3;
    if (distP < 7 && objetivo.alive && (this.kind.hostile || this.tamed || this.miraT > 0)) {
      let rel = Math.atan2(dxp, dzp) - this.yaw;
      while (rel > Math.PI) rel -= Math.PI * 2;
      while (rel < -Math.PI) rel += Math.PI * 2;
      if (Math.abs(rel) < 1.6) {
        wantHeadYaw = Math.max(-0.8, Math.min(0.8, rel));
        const eyeY = b.pos.y + this.kind.h * 0.8;
        wantHeadPitch = Math.max(-0.4, Math.min(0.4, -Math.atan2(pl.y + 1.5 - eyeY, distP)));
      }
    }
    if (this.graze > 0) { wantHeadPitch = 0.75 + Math.sin(this.t * 6) * 0.05; wantHeadYaw = 0; }
    this.headYaw += (wantHeadYaw - this.headYaw) * Math.min(1, dt * 6);
    this.headPitch += (wantHeadPitch - this.headPitch) * Math.min(1, dt * 5);
    this.headKick = Math.max(0, (this.headKick || 0) - dt * 4);
    if (u.head) { u.head.rotation.y = this.headYaw; u.head.rotation.x = (u.headRx || 0) + this.headPitch - this.headKick * 0.4; } // headRx: los cuellos que ya vienen inclinados
    if (u.trunk) {
      u.trunk.rotation.x = Math.sin(this.t * 2.2) * 0.12 + (this.graze > 0 ? 0.3 : 0);
      u.trunk.rotation.y = Math.sin(this.t * 1.3) * 0.1;
    }
    if (u.tail) u.tail.rotation.z = Math.sin(this.t * 3) * 0.3;
    if (u.ears) {
      this.earT -= dt;
      if (this.earT <= 0) this.earT = 1.5 + Math.random() * 4;
      const flick = this.earT < 0.2 ? Math.sin(this.earT * 30) * 0.5 : 0;
      u.ears[0].rotation.z = 0.25 + flick; u.ears[1].rotation.z = -0.25 - flick;
    }
    // sombra: flota, la capa ondea, los ojos parpadean
    if (this.kind.hostile && u.cloth) {
      u.body.position.y = 0.12 + Math.sin(this.t * 2.1) * 0.07;
      this.lunge = Math.max(0, this.lunge - dt);
      u.body.rotation.x = Math.min(0.3, spd * 0.05) + this.lunge * 1.2;
      u.cloth.forEach((c, i) => { c.rotation.y = Math.sin(this.t * 1.5 + i) * 0.08; c.scale.x = 1 + Math.sin(this.t * 3 + i) * 0.02; });
      const caza = Math.min(1, spd / 1.5);
      if (u.arms) u.arms.forEach((a, i) => { if (i === 1 && this.kind.brazoPropio) return; a.rotation.x = -0.25 - caza * 1.15 - this.lunge * 2 + Math.sin(this.t * 2 + i * 2) * 0.12; a.rotation.z = (i ? -1 : 1) * 0.08; });
      const blink = (this.t % 4.2) < 0.12;
      if (u.eyes) u.eyes.scale.y = blink ? 0.15 : 1 + Math.sin(this.t * 9) * 0.1;
      if (Math.random() < dt * 6) g.particles.spawn(b.pos.x + (Math.random() - 0.5) * 0.6, b.pos.y + 0.1, b.pos.z + (Math.random() - 0.5) * 0.6, this.kind.particle[0], 0, 0.4, 0, 0.8, 0);
      // brasas que se le caen de la capa (se ven de noche)
      if (Math.random() < dt * 4) g.particles.spawn(b.pos.x + (Math.random() - 0.5) * 0.7, b.pos.y + 0.3 + Math.random() * 0.8, b.pos.z + (Math.random() - 0.5) * 0.7, [1, 0.55 + Math.random() * 0.3, 0.15], 0, -0.3, 0, 0.7, 0.5, true);
    }
    poseGolpe(this);
    tintModel(this.group, this.lightLevel(), this.hurtT > 0 ? Math.min(1, this.hurtT * 3) * 0.7 : 0);
  }

  // v12.14.1: con invitados, los jefes y leyendas (que piensan con g.player) ven a la persona más cercana: por esa llamada g.player es ella,
  // y todo daño sin destinatario va a ella (Game.damagePlayer lo reenvía por la red). Sin invitados no cambia nada.
  conObjetivoCercano(f) {
    const g = this.game;
    if (!g.red || !g.otrosJugadores().length) { f(); return; }
    const T = g.jugadorMasCercano(this.body.pos.x, this.body.pos.z);
    if (T === g.player || g.jugadorReal) { f(); return; }
    g.jugadorReal = g.player; g.player = T;
    try { f(); } finally { g.player = g.jugadorReal; g.jugadorReal = null; }
  }

  // v12.14.0 (F4): el títere de un invitado: no piensa ni tiene física; se acerca suave a lo que dijo el anfitrión y camina al moverse
  updateTitere(dt) {
    const b = this.body.pos, e = this.red, u = this.group.userData, k = Math.min(1, dt * 10);
    this.hurtT = Math.max(0, this.hurtT - dt);
    const antes = { x: b.x, z: b.z };
    if (e) {
      if (Math.hypot(e.x - b.x, e.z - b.z) > 8 || Math.abs(e.y - b.y) > 8) { b.x = e.x; b.y = e.y; b.z = e.z; } else { b.x += (e.x - b.x) * k; b.y += (e.y - b.y) * k; b.z += (e.z - b.z) * k; }
      let d = e.yaw - this.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      this.yaw += d * k;
    }
    const moved = Math.hypot(b.x - antes.x, b.z - antes.z), spd = moved / Math.max(dt, 1e-4);
    this.walk += moved * 3.4;
    this.walkAmt += (Math.min(1, spd / 2) - this.walkAmt) * Math.min(1, dt * 8);
    this.group.position.set(b.x, b.y, b.z);
    this.group.rotation.y = this.yaw;
    const sw = Math.sin(this.walk) * this.walkAmt;
    if (u.legs) u.legs.forEach((l, i) => { l.rotation.x = (i === 0 || i === 2 ? sw : -sw) * 0.75; });
    if (u.tail) u.tail.rotation.z = Math.sin(this.t * 3) * 0.3;
    tintModel(this.group, this.lightLevel(), this.hurtT > 0 ? Math.min(1, this.hurtT * 3) * 0.7 : 0);
  }

  // Vuelo: elige un punto cercano y se dirige ahí con giros suaves; aletea más al subir
  flyUpdate(dt) {
    const g = this.game, b = this.body, u = this.group.userData, w = g.world;
    this.hurtT = Math.max(0, this.hurtT - dt);
    this.thinkT -= dt;
    const pl = g.player.body.pos;
    const custom = this.kind.flyGoal ? this.kind.flyGoal(this, g) : null;
    if (custom) { this.goal = custom; this.thinkT = 0.5; } else if (!this.goal || this.thinkT <= 0 || b.hitWall) {
      this.thinkT = 2 + Math.random() * 4;
      for (let tries = 0; tries < 8; tries++) {
        const r = this.kind.cave ? 6 : 14;
        const gx = b.pos.x + (Math.random() - 0.5) * r * 2, gz = b.pos.z + (Math.random() - 0.5) * r * 2;
        let gy;
        if (this.kind.flyHigh) {
          let top = 120; while (top > 1 && !SOLID[w.getBlock(Math.floor(gx), top, Math.floor(gz))]) top--;
          gy = top + 4 + Math.random() * 12;
        } else gy = b.pos.y + (Math.random() - 0.5) * 6;
        if (w.getBlock(Math.floor(gx), Math.floor(gy), Math.floor(gz)) === AIR) { this.goal = { x: gx, y: gy, z: gz }; break; }
      }
      if (!this.goal) this.goal = { x: b.pos.x, y: b.pos.y + 2, z: b.pos.z };
    }
    // si el jugador se acerca mucho, se espantan
    const dpl = Math.hypot(pl.x - b.pos.x, pl.y - b.pos.y, pl.z - b.pos.z);
    if (dpl < 3 && !this.kind.cave && !this.tamed && !custom) this.goal = { x: b.pos.x + (b.pos.x - pl.x) * 4, y: b.pos.y + 6, z: b.pos.z + (b.pos.z - pl.z) * 4 };
    const dx = this.goal.x - b.pos.x, dy = this.goal.y - b.pos.y, dz = this.goal.z - b.pos.z;
    const d = Math.hypot(dx, dy, dz) || 1;
    const sp = this.kind.speed * (this.kind.cave ? 0.8 + Math.sin(this.t * 7) * 0.4 : 1);
    const k = Math.min(1, dt * 2.5);
    b.vel.x += ((dx / d) * sp - b.vel.x) * k;
    b.vel.y += ((dy / d) * sp * 0.7 - b.vel.y) * k;
    b.vel.z += ((dz / d) * sp - b.vel.z) * k;
    if (this.kind.cave || this.kind.erratic) { b.vel.x += (Math.random() - 0.5) * 8 * dt; b.vel.y += (Math.random() - 0.5) * 8 * dt; b.vel.z += (Math.random() - 0.5) * 8 * dt; }
    b.step(w, dt, { flying: true });
    if (d < 1) this.thinkT = 0;
    // murciélagos: dejan guano (abono) en las cuevas
    if (this.type === 'murcielago' && Math.random() < dt * 0.012) g.entities.dropItem(280, 1, b.pos.x, b.pos.y, b.pos.z, { x: 0, y: 0, z: 0 }, 1);
    const tyaw = Math.atan2(b.vel.x, b.vel.z);
    let dyaw = tyaw - this.yaw;
    while (dyaw > Math.PI) dyaw -= Math.PI * 2;
    while (dyaw < -Math.PI) dyaw += Math.PI * 2;
    this.yaw += dyaw * Math.min(1, dt * 4);
    this.group.position.set(b.pos.x, b.pos.y, b.pos.z);
    this.group.rotation.y = this.yaw;
    // inclinarse al girar y al subir/bajar
    // suavizado: al cambiar de rumbo se ladea poco a poco, sin sacudirse de un cuadro a otro
    const kInc = Math.min(1, dt * 6);
    this.rollS = (this.rollS || 0) + (Math.max(-0.55, Math.min(0.55, -dyaw * 0.6)) - (this.rollS || 0)) * kInc;
    this.pitchS = (this.pitchS || 0) + (-Math.max(-0.5, Math.min(0.5, b.vel.y * 0.08)) - (this.pitchS || 0)) * kInc;
    u.body.rotation.z = this.rollS;
    u.body.rotation.x = this.pitchS;
    const flapSpeed = this.kind.flapSpeed || (this.kind.cave ? 26 : 10 + Math.max(0, b.vel.y) * 3);
    this.flap = (this.flap || 0) + dt * flapSpeed;
    this.glideS = (this.glideS ?? 1) + ((!this.kind.cave && b.vel.y < -0.5 ? 0.25 : 1) - (this.glideS ?? 1)) * Math.min(1, dt * 5);
    const glide = this.glideS; // planear entra de a poquito, no de golpe
    u.wings.forEach(({ p, side }) => { p.rotation.z = side * (Math.sin(this.flap) * 0.9 * glide + 0.1); });
    if (u.tail) u.tail.rotation.x = Math.sin(this.flap * 0.5) * 0.08;
    if (Math.sin(this.flap) > 0.97 && Math.random() < 0.3 && dpl < 12) g.audio.play('aleteo', { pos: this.soundPos(), vol: 0.35 });
    this.idleT -= dt;
    if (this.idleT <= 0) {
      const [a, bb] = this.kind.idleEvery || [6, 14];
      this.idleT = a + Math.random() * (bb - a);
      if (dpl < 30) g.audio.play(this.kind.idleSound, { pos: this.soundPos() });
    }
    if (b.pos.y < -10) this.dead = true;
    tintModel(this.group, this.lightLevel(), this.hurtT > 0 ? Math.min(1, this.hurtT * 3) * 0.7 : 0);
  }

  lightLevel() {
    const g = this.game;
    const b = this.body.pos;
    let covered = false;
    for (let y = Math.floor(b.y + this.kind.h) + 1; y < Math.floor(b.y) + 20; y++) {
      if (BLOCKS[g.world.getBlock(Math.floor(b.x), y, Math.floor(b.z))].opaque) { covered = true; break; }
    }
    return Math.max(0.12, (covered ? 0.45 : 1) * g.daylight);
  }
}

// ---------- Ítems tirados ----------
class ItemDrop {
  constructor(game, id, count, dur, x, y, z, vx, vy, vz, delay) {
    this.game = game;
    this.id = id; this.count = count; this.dur = dur;
    this.body = new Body(0.25, 0.25);
    this.body.pos.x = x; this.body.pos.y = y; this.body.pos.z = z;
    this.body.vel.x = vx; this.body.vel.y = vy; this.body.vel.z = vz;
    this.body.gravity = 22;
    this.age = 0;
    this.delay = delay;
    this.spin = Math.random() * Math.PI * 2;
    this.dead = false;
    this.mesh = makeItemMesh(id, 0.26);
    if (count > 1 && this.mesh.userData.kind === 'block') {
      const extra = makeItemMesh(id, 0.26);
      extra.position.set(0.08, 0.06, -0.06);
      this.mesh.add(extra);
    }
    game.scene.add(this.mesh);
  }
  // dos montones iguales que quedan juntos en el suelo se hacen uno
  unirse() {
    const g = this.game, b = this.body, max = maxStack(this.id);
    if (this.dur != null || this.extra || this.vida || this.count >= max) return;
    for (const o of g.entities.items) {
      if (o === this || o.dead || o.recogido !== undefined || o.id !== this.id || o.dur != null || o.extra || o.vida || !o.body.onGround || o.count + this.count > max) continue;
      if (Math.hypot(o.body.pos.x - b.pos.x, o.body.pos.y - b.pos.y, o.body.pos.z - b.pos.z) < 1) { o.count += this.count; o.age = Math.min(o.age, this.age); this.dead = true; return; }
    }
  }
  update(dt) {
    const g = this.game, b = this.body;
    this.age += dt;
    this.spin += dt * 1.6;
    const pl = g.player;
    const pp = pl.body.pos;
    if (this.escala === undefined) this.escala = this.mesh.scale.x;
    // ya entró a la mochila: se encoge rumbo al pecho en vez de desaparecer de golpe
    if (this.recogido !== undefined) {
      this.recogido += dt / 0.11;
      const k = Math.min(1, this.recogido), m = this.mesh.position, f = Math.min(1, dt * 24);
      m.x += (pp.x - m.x) * f; m.y += (pp.y + 0.9 - m.y) * f; m.z += (pp.z - m.z) * f;
      this.mesh.scale.setScalar(this.escala * (1 - k * 0.85));
      if (k >= 1) this.dead = true;
      return;
    }
    this.sinCupo = Math.max(0, (this.sinCupo || 0) - dt);
    const dx = pp.x - b.pos.x, dy = pp.y + 0.8 - b.pos.y, dz = pp.z - b.pos.z;
    const d = Math.hypot(dx, dy, dz);
    // caja de recogida alrededor del jugador (1.3 a los lados, de los pies a la cabeza con margen)
    const inBox = Math.abs(dx) < 1.3 && Math.abs(dz) < 1.3 && b.pos.y > pp.y - 0.7 && b.pos.y < pp.y + 2.3;
    let magnet = false;
    if (this.age > this.delay && pl.alive && !this.sinCupo && (d < 2.4 || inBox)) {
      // imán hacia el jugador
      magnet = true;
      const f = (18 * dt) / Math.max(0.3, d);
      b.vel.x += dx * f; b.vel.y += dy * f; b.vel.z += dz * f;
      if (d < 0.9 || inBox) {
        const left = g.inventory.add(this.id, this.count, this.dur, this.extra);
        if (left < this.count) { g.audio.pickup(); g.ui.registroObjeto(this.id, this.count - left); }
        else if ((g.clock || 0) > (g.mochilaT || 0)) { g.mochilaT = (g.clock || 0) + 60; g.ui.toast('🎒 Mochila llena: bote algo con Q o guárdelo en un cofre', 2600, { cat: 'consejo', clave: 'mochila' }); }
        this.count = left;
        if (left <= 0) { this.recogido = 0; return; }
        this.sinCupo = 1.4; // sin campo: que no se le quede pegado encima
      }
    }
    if (b.onGround && !magnet) { b.vel.x *= Math.pow(0.02, dt); b.vel.z *= Math.pow(0.02, dt); }
    if (b.inWater) b.vel.y = Math.max(b.vel.y, 0.8);
    b.step(g.world, dt);
    if (b.onGround && (this.unirT = (this.unirT ?? 0.5) - dt) <= 0) { this.unirT = 0.7; this.unirse(); }
    const bob = Math.sin(this.age * 2.5) * 0.06 + 0.12;
    this.mesh.position.set(b.pos.x, b.pos.y + bob + 0.05, b.pos.z);
    if (this.age < 0.14) this.mesh.scale.setScalar(this.escala * (0.35 + 0.65 * (this.age / 0.14))); else if (!this.crecio) { this.crecio = true; this.mesh.scale.setScalar(this.escala); }
    this.mesh.rotation.y = this.spin;
    const light = g.entities.lightAt(b.pos.x, b.pos.y + 0.5, b.pos.z);
    this.mesh.traverse((o) => { if (o.isMesh) o.material.color.setScalar(light); });
    if ((this.age > (this.vida || 300) && !esUnico(this.id)) || b.pos.y < -20) this.dead = true;
    if (b.inLava) { this.dead = true; g.particles.burst(b.pos.x, b.pos.y + 0.3, b.pos.z, [[1, 0.6, 0.2], [0.4, 0.4, 0.4]], 8, 1.2); g.audio.play('ignite', { pos: b.pos, vol: 0.25, pitch: 1.6 }); }
  }
  remove() {
    this.game.scene.remove(this.mesh);
    this.mesh.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  }
}

// ---------- Bloque que cae (arena, grava) ----------
class FallingBlock {
  constructor(game, id, x, y, z) {
    this.game = game;
    this.id = id;
    this.body = new Body(0.98, 0.98);
    this.body.pos.x = x + 0.5; this.body.pos.y = y; this.body.pos.z = z + 0.5;
    this.dead = false;
    this.mesh = makeItemMesh(id, 1);
    this.mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
    game.scene.add(this.mesh);
    this.t = 0;
  }
  update(dt) {
    const g = this.game, w = g.world, b = this.body;
    this.t += dt;
    b.step(w, dt);
    this.mesh.position.set(b.pos.x, b.pos.y + 0.5, b.pos.z);
    this.mesh.material.color.setScalar(g.entities.lightAt(b.pos.x, b.pos.y + 0.5, b.pos.z));
    if (Math.random() < dt * 20) g.particles.dust(b.pos.x, b.pos.y + 0.9, b.pos.z, this.id, 1);
    if ((b.onGround && this.t > 0.05) || b.pos.y < 0 || this.t > 30) {
      this.dead = true;
      const x = Math.floor(b.pos.x), y = Math.floor(b.pos.y + 0.2), z = Math.floor(b.pos.z);
      const here = w.getBlock(x, y, z);
      const bb = BLOCKS[here];
      if (here === AIR || bb.render === 'cross' || bb.render === 'torch' || bb.fluid) {
        if (here !== AIR && !bb.fluid && g.dropFromBlock) g.dropFromBlock(here, x, y, z);
        w.setBlock(x, y, z, this.id);
        g.audio.material(BLOCKS[this.id].sound, 'place', { x: x + 0.5, y: y + 0.5, z: z + 0.5 });
        g.particles.dust(x + 0.5, y, z + 0.5, this.id, 10);
      } else if (g.mode === 'survival') g.entities.dropItem(this.id, 1, b.pos.x, b.pos.y + 0.5, b.pos.z);
    }
  }
  remove() {
    this.game.scene.remove(this.mesh);
    this.mesh.geometry.dispose(); this.mesh.material.dispose();
  }
}

// ---------- Dinamita encendida ----------
class LitDynamite {
  constructor(game, x, y, z, fuse) {
    this.game = game;
    this.body = new Body(0.98, 0.98);
    this.body.pos.x = x + 0.5; this.body.pos.y = y; this.body.pos.z = z + 0.5;
    this.body.vel.y = 3;
    this.fuse = fuse;
    this.dead = false;
    this.mesh = makeItemMesh(K.dynamite, 1);
    this.flash = new THREE.Mesh(new THREE.BoxGeometry(1.02, 1.02, 1.02), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
    this.mesh.add(this.flash);
    game.scene.add(this.mesh);
    game.audio.play('fuse', { pos: { x: x + 0.5, y: y + 0.5, z: z + 0.5 } });
  }
  update(dt) {
    this.fuse -= dt;
    this.body.step(this.game.world, dt);
    const p = this.body.pos;
    this.mesh.position.set(p.x, p.y + 0.5, p.z);
    this.flash.material.opacity = Math.floor(this.fuse * 5) % 2 === 0 ? 0.55 : 0;
    this.mesh.scale.setScalar(1 + Math.max(0, 0.5 - this.fuse) * 0.3);
    if (Math.random() < dt * 25) this.game.particles.spawn(p.x, p.y + 1.05, p.z, [0.95, 0.85, 0.5], (Math.random() - 0.5) * 0.6, 1.5, (Math.random() - 0.5) * 0.6, 0.4, 0);
    if (this.fuse <= 0) { this.dead = true; this.game.explode(p.x, p.y + 0.5, p.z, 3.6); }
  }
  remove() {
    this.game.scene.remove(this.mesh);
    this.mesh.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  }
}

// ---------- Partículas ----------
class Particles {
  constructor(scene) {
    this.max = 2500;
    this.pos = new Float32Array(this.max * 3);
    this.col = new Float32Array(this.max * 3);
    this.base = new Float32Array(this.max * 3);
    this.vel = new Float32Array(this.max * 3);
    this.life = new Float32Array(this.max);
    this.grav = new Float32Array(this.max);
    this.bright = new Uint8Array(this.max); // llamas: no se oscurecen de noche
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.mat = new THREE.PointsMaterial({ size: 0.11, vertexColors: true, sizeAttenuation: true });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    this.next = 0;
    for (let i = 0; i < this.max; i++) this.pos[i * 3 + 1] = -1000;
    scene.add(this.points);
  }
  spawn(x, y, z, c, vx, vy, vz, life, grav = 18, bright = false) {
    const i = this.next; this.next = (this.next + 1) % this.max;
    this.bright[i] = bright ? 1 : 0;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.base[i * 3] = c[0]; this.base[i * 3 + 1] = c[1]; this.base[i * 3 + 2] = c[2];
    this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.life[i] = life; this.grav[i] = grav;
  }
  // colors: un color o una lista; se elige uno al azar por partícula
  burst(x, y, z, colors, n, speed = 3) {
    const list = Array.isArray(colors[0]) ? colors : [colors];
    for (let k = 0; k < n; k++) {
      this.spawn(x + (Math.random() - 0.5) * 0.6, y + (Math.random() - 0.5) * 0.6, z + (Math.random() - 0.5) * 0.6, list[Math.floor(Math.random() * list.length)],
        (Math.random() - 0.5) * speed, Math.random() * speed, (Math.random() - 0.5) * speed, 0.4 + Math.random() * 0.7);
    }
  }
  // usa pixeles reales de la textura del bloque
  blockBreak(x, y, z, id, n = 22) {
    const b = BLOCKS[id];
    if (!b.tex) return;
    const px = tilePixels(b.tex.side).concat(tilePixels(b.tex.top));
    for (let k = 0; k < n; k++) {
      this.spawn(x + 0.15 + Math.random() * 0.7, y + 0.15 + Math.random() * 0.7, z + 0.15 + Math.random() * 0.7, px[Math.floor(Math.random() * px.length)],
        (Math.random() - 0.5) * 3, Math.random() * 3.5, (Math.random() - 0.5) * 3, 0.5 + Math.random() * 0.6);
    }
  }
  // astillas al picar: salen de la cara apuntada
  chip(t) {
    const b = BLOCKS[t.id];
    if (!b.tex) return;
    const px = tilePixels(b.tex.side);
    for (let k = 0; k < 3; k++) {
      const ox = t.nx ? t.nx * 0.52 : Math.random() - 0.5;
      const oy = t.ny ? t.ny * 0.52 : Math.random() - 0.5;
      const oz = t.nz ? t.nz * 0.52 : Math.random() - 0.5;
      this.spawn(t.x + 0.5 + ox, t.y + 0.5 + oy, t.z + 0.5 + oz, px[Math.floor(Math.random() * px.length)],
        t.nx * 1.5 + (Math.random() - 0.5), t.ny * 1.5 + Math.random() * 1.5, t.nz * 1.5 + (Math.random() - 0.5), 0.4);
    }
  }
  // polvo de los pasos o al aterrizar
  dust(x, y, z, id, n) {
    const b = BLOCKS[id];
    if (!b || !b.tex) return;
    const px = tilePixels(b.tex.top);
    for (let k = 0; k < n; k++) {
      this.spawn(x + (Math.random() - 0.5) * 0.6, y + 0.05, z + (Math.random() - 0.5) * 0.6, px[Math.floor(Math.random() * px.length)],
        (Math.random() - 0.5) * 1.5, 1 + Math.random() * 1.2, (Math.random() - 0.5) * 1.5, 0.35, 12);
    }
  }
  update(dt, world, light) {
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      if (this.life[i] <= 0) { this.pos[i * 3 + 1] = -1000; continue; }
      this.vel[i * 3 + 1] -= this.grav[i] * dt;
      const nx = this.pos[i * 3] + this.vel[i * 3] * dt;
      const ny = this.pos[i * 3 + 1] + this.vel[i * 3 + 1] * dt;
      const nz = this.pos[i * 3 + 2] + this.vel[i * 3 + 2] * dt;
      if (SOLID[world.getBlock(Math.floor(nx), Math.floor(ny), Math.floor(nz))]) {
        this.vel[i * 3] *= 0.3; this.vel[i * 3 + 1] = 0; this.vel[i * 3 + 2] *= 0.3;
      } else {
        this.pos[i * 3] = nx; this.pos[i * 3 + 1] = ny; this.pos[i * 3 + 2] = nz;
      }
      const l = this.bright[i] ? 1 : light;
      this.col[i * 3] = this.base[i * 3] * l; this.col[i * 3 + 1] = this.base[i * 3 + 1] * l; this.col[i * 3 + 2] = this.base[i * 3 + 2] * l;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
  }
}

// ---------- Administrador ----------
export class Entities {
  constructor(game) {
    this.game = game;
    this.mobs = [];
    this.dynamite = [];
    this.items = [];
    this.falling = [];
    this.spawnT = 0;
    game.particles = new Particles(game.scene);
  }

  clear() {
    for (const m of this.mobs) { m.dead = true; m.remove(); }
    for (const d of this.dynamite) d.remove();
    for (const it of this.items) it.remove();
    for (const f of this.falling) f.remove();
    this.mobs = []; this.dynamite = []; this.items = []; this.falling = []; this.titeres = null;
  }

  lightAt(x, y, z) {
    const g = this.game;
    for (let yy = Math.floor(y) + 1; yy < Math.floor(y) + 16; yy++) {
      if (BLOCKS[g.world.getBlock(Math.floor(x), yy, Math.floor(z))].opaque) return curvaLuz(Math.max(0.15, g.daylight * 0.5));
    }
    return curvaLuz(Math.max(0.15, g.daylight)); // con el deslizador de brillo (criaturas, objetos y la mano)
  }

  spawnMob(type, x, y, z) {
    const m = new Mob(this.game, MOB_TYPES[type], x, y, z);
    m.type = type;
    this.mobs.push(m);
    if (this.game.meta.invitado) { m.descartado = true; m.dead = true; return m; } // v12.14.0: el mundo de un invitado no simula criaturas, solo muestra las del anfitrión
    if (this.natural) quizaEstrellas(this.game, m);
    // v12.14.1: en grupo los jefes y leyendas aguantan más: +50 % por persona extra, tope ×2,5
    if ((m.kind.boss || m.kind.legend) && this.game.red && this.game.red.rol === 'anfitrion') {
      const f = Math.min(2.5, 1 + 0.5 * this.game.otrosJugadores().length);
      if (f > 1) { m.health *= f; m.data.vmax = m.health; }
    }
    return m;
  }

  // v12.14.0 (F4): el títere de una criatura del anfitrión (solo en el mundo de un invitado). e = { id, tipo, x, y, z, yaw, hp, vuelo }
  crearTitere(e) {
    const kind = Object.prototype.hasOwnProperty.call(MOB_TYPES, e.tipo) ? MOB_TYPES[e.tipo] : null; // nunca «constructor» ni «__proto__»
    if (!kind) return null;
    const m = new Mob(this.game, kind, e.x, e.y, e.z);
    m.type = e.tipo; m.nid = e.id; m.titere = true; m.yaw = e.yaw; m.targetYaw = e.yaw; m.health = e.hp; m.red = { x: e.x, y: e.y, z: e.z, yaw: e.yaw };
    m.spawnT = 0.6; // los títeres no «nacen» con rebote: ya estaban
    this.mobs.push(m);
    return m;
  }

  dropItem(id, count, x, y, z, vel, delay = 0.35, dur, extra) {
    const v = vel || { x: (Math.random() - 0.5) * 2.5, y: 3 + Math.random() * 1.5, z: (Math.random() - 0.5) * 2.5 };
    const it = new ItemDrop(this.game, id, count, dur, x, y, z, v.x, v.y, v.z, delay);
    it.extra = extra;
    this.items.push(it);
    if (this.items.length > 400) { const k = this.items.findIndex((x) => !esUnico(x.id)); if (k >= 0) { this.items[k].remove(); this.items.splice(k, 1); } } // se va lo más viejo que no sea único (antes cualquiera, a los 300)
    return it;
  }

  spawnFalling(id, x, y, z) {
    this.falling.push(new FallingBlock(this.game, id, x, y, z));
  }

  lightDynamite(x, y, z, fuse = 3) {
    this.game.world.setBlock(x, y, z, AIR);
    this.dynamite.push(new LitDynamite(this.game, x, y, z, fuse));
  }

  raycastMob(ox, oy, oz, dx, dy, dz, maxDist) {
    let best = null, bestT = maxDist;
    for (const m of this.mobs) {
      if (m.dying) continue;
      const p = m.body.pos, e = m.escHit || 1, hw = (m.kind.w * e) / 2 + 0.1;
      const t = rayBox(ox, oy, oz, dx, dy, dz, p.x - hw, p.y, p.z - hw, p.x + hw, p.y + m.kind.h * e, p.z + hw);
      if (t !== null && t < bestT) { bestT = t; best = m; }
    }
    return best ? { mob: best, dist: bestT } : null;
  }

  update(dt) {
    if (dt <= 0) return;
    const g = this.game;
    for (const m of this.mobs) m.update(dt);
    separar(g, this.mobs, dt); // v13.0.3: nadie se mete dentro de nadie
    for (const d of this.dynamite) d.update(dt);
    for (const it of this.items) it.update(dt);
    for (const f of this.falling) f.update(dt);
    this.falling = this.falling.filter((f) => { if (f.dead) { f.remove(); return false; } return true; });
    const pl = g.player.body.pos, otros = g.otrosJugadores();
    this.mobs = this.mobs.filter((m) => {
      // v12.14.0: lejos de TODAS las personas (con invitados, no se tira lo que está cerca de la otra persona)
      const lejos = (p) => Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) > 96;
      const far = lejos(pl) && otros.every((o) => lejos(o.body.pos)) && !m.tamed && !m.data.noche && !m.data.robado;
      const burned = !m.titere && g.dim === 'tierra' && m.kind.hostile && !m.kind.diurno && !m.data.arena && !m.data.nido && !m.data.apuro && !m.dying && g.daylight > 0.7 && m.lightLevel() > 0.6 && Math.random() < dt * 0.5;
      if (burned) g.particles.burst(m.body.pos.x, m.body.pos.y + 1, m.body.pos.z, m.kind.particle, 26, 2.5);
      if (!m.dead && m.tamed && !g.world.isLoaded(m.body.pos.x, m.body.pos.z)) {
        (g.pendingPets = g.pendingPets || []).push({ type: m.type, x: m.body.pos.x, y: m.body.pos.y, z: m.body.pos.z, data: m.data });
        m.remove(); return false;
      }
      if (m.dead || far || burned || !g.world.isLoaded(m.body.pos.x, m.body.pos.z)) { if (m.data.robado) soltarBotin(g, m, false); m.dead = true; /* las peleas guardan su lista: que no quede una fantasma */ m.remove(); return false; }
      return true;
    });
    this.dynamite = this.dynamite.filter((d) => { if (d.dead) { d.remove(); return false; } return true; });
    this.items = this.items.filter((it) => {
      if (!it.dead && !g.world.isLoaded(it.body.pos.x, it.body.pos.z) && esUnico(it.id) && g.mode === 'survival') {
        // lo que no se puede volver a conseguir no se queda en un suelo que ya no existe
        const left = g.inventory.add(it.id, it.count, it.dur, it.extra);
        if (left < it.count) g.ui.toast(`🎒 Lo que dejó en el suelo volvió con usted: ${itemName(it.id)}`, 3000);
        else if (!it.avisado) { it.avisado = true; g.ui.toast(`🎒 No le cupo ${itemName(it.id)}: quedó a sus pies`, 3000); }
        if (left > 0) { const p = g.player.body.pos; it.count = left; it.body.pos.x = p.x; it.body.pos.y = p.y + 1; it.body.pos.z = p.z; return true; }
        it.remove();
        return false;
      }
      if (it.dead || !g.world.isLoaded(it.body.pos.x, it.body.pos.z)) { it.remove(); return false; }
      return true;
    });
    this.spawnT -= dt;
    if (this.spawnT <= 0 && g.meta.invitado) this.spawnT = 2; // el mundo de un invitado no hace nacer nada
    else if (this.spawnT <= 0) { this.spawnT = 2; this.natural = true; try { this.trySpawn(); } finally { this.natural = false; } } // natural: las que nacen solas pueden traer estrellas (estrellas.js)
    g.particles.update(dt, g.world, Math.max(0.25, g.daylight));
  }

  // murciélagos: en cuevas oscuras cerca del jugador
  trySpawnCave() {
    const g = this.game, w = g.world, pl = g.player.body.pos;
    if (!g.env || g.env.cave < 0.6) return;
    if (cuevaFaunaSpawn(this, g)) return; // v13.1.2: cangrejo ciego, grillo de cueva y escarabajo de calcita (cuevavida.js)
    if (this.mobs.filter((m) => m.type === 'murcielago').length >= 5) return;
    // v13.3.3: tope de fauna por salón (un salón de 96 de ancho no se llena de bichos): a lo sumo 10 criaturas de cueva a 40 bloques
    if (this.mobs.filter((m) => (m.type === 'murcielago' || m.type === 'vampiro') && Math.hypot(m.body.pos.x - pl.x, m.body.pos.z - pl.z) < 40).length >= 8) return;
    for (let tries = 0; tries < 10; tries++) {
      const x = Math.floor(pl.x + (Math.random() - 0.5) * 24), y = Math.floor(pl.y + (Math.random() - 0.5) * 10), z = Math.floor(pl.z + (Math.random() - 0.5) * 24);
      if (w.getBlock(x, y, z) !== AIR || w.getBlock(x, y + 1, z) !== AIR) continue;
      if (Math.hypot(x - pl.x, z - pl.z) < 8) continue;
      const n = 1 + Math.floor(Math.random() * 3);
      // en lo hondo (y < 40), de noche y en supervivencia, a veces son vampiros
      const vamp = y < 40 && g.mode === 'survival' && !g.meta.invitado && g.settings.hostiles && difOf(g).hostiles && Math.random() < 0.4 && this.mobs.filter((m) => m.type === 'vampiro').length < 3;
      for (let i = 0; i < n; i++) this.spawnMob(vamp ? 'vampiro' : 'murcielago', x + 0.5, y + 0.3, z + 0.5);
      return;
    }
  }

  trySpawn() {
    const g = this.game;
    const pl = g.puntoDeSpawn(); // v12.14.0: con invitados, el punto de cualquiera de las personas
    if (g.dim === 'inframundo') { bossSpawn(this, g); if (this.mobs.length < 14) infraSpawn(this, g); return; }
    if (g.dim === 'cielo') {
      if (arpiaSpawn(this, g)) return;
      // quetzales y colibríes entre las islas
      const n = (t) => this.mobs.filter((m) => m.type === t).length;
      const a = Math.random() * Math.PI * 2, r = 14 + Math.random() * 20;
      const x = pl.x + Math.cos(a) * r, z = pl.z + Math.sin(a) * r;
      if (n('quetzal') < 4 && Math.random() < 0.5) this.spawnMob('quetzal', x, pl.y + 4 + Math.random() * 6, z);
      else if (n('colibri') < 4) this.spawnMob('colibri', x, pl.y + 2 + Math.random() * 3, z);
      return;
    }
    if (g.asedio || g.nocheLarga || g.apuro || g.ceniza || g.grieta || g.ventanilla) return; // en una pelea grande solo vienen las oleadas: si no se amontonan hasta 14, con culebras y leyendas encima
    // noches bravas: de noche la Sombra va primero (antes la fauna, la finca y las leyendas se comían los turnos)
    if (g.daylight < 0.35 && Math.random() < 0.6 && this.sombraNoche(g, pl)) return;
    if (Math.random() < 0.35) this.trySpawnCave();
    if (Math.random() < 0.5 && seaSpawn(this, g)) return;
    if (Math.random() < 0.3 && mar2Spawn(this, g)) return;
    if (Math.random() < 0.5 && bravosSpawn(this, g)) return;
    if (Math.random() < 0.2 && identidadSpawn(this, g)) return; // v13.3.5 (BI0): fauna que faltaba en desierto, páramo y nuboso
    if (Math.random() < 0.15 && hongosSpawn(this, g)) return; // los hongos reventones (hongos.js)
    if (Math.random() < 0.45 && bichos3Spawn(this, g)) return; // los bichos de cada bioma (bichos3.js): que la noche no sea solo Sombras
    if (Math.random() < 0.4 && playaSpawn(this, g)) return;
    if (Math.random() < 0.3 && bichosSpawn(this, g)) return;
    if (legendSpawn(this, g)) return;
    if (miniSpawn(this, g)) return;
    if (monoCongoSpawn(this, g)) return;
    if (mapacheSpawn(this, g)) return;
    if (zarateSpawn(this, g)) return;
    if (ranaVidrioSpawn(this, g)) return;
    if (Math.random() < 0.35 && fauna2Spawn(this, g)) return;
    if (loroSpawn(this, g)) return;
    if (sirenaSpawn(this, g)) return;
    const dantas = this.mobs.filter((m) => m.type === 'danta').length;
    const sombras = this.mobs.filter((m) => m.type.startsWith('sombra')).length;
    const night = g.daylight < 0.35;
    const dif = difOf(g);
    // las noches se ponen más bravas con los días (una Sombra más cada 5 días, hasta 4) y en luna llena
    const extra = Math.min(4, Math.floor(((g.day || 1) - 1) / 5)) + ((g.day || 1) % 7 === 0 ? 2 : 0);
    const calma = (g.meta.hist && g.meta.hist.fin ? 2 : 0) + calmaComarca(g) + calmaPlatos(g); // con el Corazón entero y sin nidos, las noches son más tranquilas
    const nido = nidoCerca(g, pl.x, pl.z) ? 2 : 0; // cerca de un nido vivo nacen más
    const novato = Math.max(0, 3 - (g.day || 1)); // las primeras dos noches vienen un poco menos
    const wantSombra = night && sombras < (dif.sombras ? dif.sombras + extra + nido - calma - novato : 0) && g.mode === 'survival' && !g.meta.invitado && g.settings.hostiles && dif.hostiles;
    const wantDanta = dantas < 8;
    if (!wantSombra && !wantDanta) return;
    const a = Math.random() * Math.PI * 2, r = 22 + Math.random() * 26;
    const x = Math.floor(pl.x + Math.cos(a) * r), z = Math.floor(pl.z + Math.sin(a) * r);
    if (!g.world.isLoaded(x, z)) return;
    let y = 120;
    while (y > 1 && !SOLID[g.world.getBlock(x, y, z)]) y--;
    const ground = g.world.getBlock(x, y, z);
    const above = g.world.getBlock(x, y + 1, z);
    if (above !== AIR && BLOCKS[above].render !== 'cross') return;
    if (g.world.getBlock(x, y + 2, z) !== AIR) return;
    if (y < SEA) return;
    const col = g.world.gen.column(x, z);
    const count = (t) => this.mobs.filter((m) => m.type === t).length;
    if (this.mobs.length < 40 && (fincaSpawn(this, g, x, y, z, col, ground) || faunaSpawn(this, g, x, y, z, col, ground))) return;
    if (col.biome === 'jungle' && g.daylight > 0.4 && Math.random() < 0.5) {
      if (count('lapa') < 4 && Math.random() < 0.5) { const n = 1 + Math.floor(Math.random() * 2); for (let i = 0; i < n; i++) this.spawnMob('lapa', x + 0.5 + i, y + 6 + i, z + 0.5); return; }
      if (count('mono') < 4 && BLOCKS[ground].leafy) { this.spawnMob('mono', x + 0.5, y + 1, z + 0.5); return; }
    }
    if (wantSombra && Math.random() < 0.6) {
      // ni cerca de la casa arreglada ni donde hay luz: las antorchas de verdad protegen. Con los días vienen más duras.
      if (!BLOCKS[ground].fluid && !zonaSegura(g, x, z) && !hayLuzCerca(g.world, x, y + 1, z)) {
        const s = this.spawnMob(tipoSombra(g), x + 0.5, y + 1, z + 0.5);
        if (s) s.health += Math.min(14, Math.floor((g.day || 1) / 2));
      }
    } else if (wantDanta && (ground === K.grass || ground === K.snow_grass) && Math.random() < 0.5) {
      const n = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) this.spawnMob('danta', x + 0.5 + i * 0.3, y + 1, z + 0.5);
    }
  }
}

// cuántas Sombras quiere la noche ahora mismo (0 si ninguna)
function topeSombras(g, pl) {
  const dif = difOf(g);
  if (!dif.sombras || g.mode !== 'survival' || g.meta.invitado || !g.settings.hostiles || !dif.hostiles) return 0;
  const extra = Math.min(4, Math.floor(((g.day || 1) - 1) / 5)) + ((g.day || 1) % 7 === 0 ? 2 : 0);
  const calma = (g.meta.hist && g.meta.hist.fin ? 2 : 0) + calmaComarca(g) + calmaPlatos(g);
  const nido = nidoCerca(g, pl.x, pl.z) ? 2 : 0;
  const novato = Math.max(0, 3 - (g.day || 1));
  return Math.max(0, dif.sombras + extra + nido - calma - novato);
}
// la Sombra de la noche: busca dónde nacer (sin luz, lejos de la casa) y desde el día 3 viene en manada
Entities.prototype.sombraNoche = function (g, pl) {
  const tope = topeSombras(g, pl), hay = this.mobs.filter((m) => m.type.startsWith('sombra')).length;
  if (hay >= tope) return false;
  const a = Math.random() * Math.PI * 2, r = 18 + Math.random() * 22;
  const x = Math.floor(pl.x + Math.cos(a) * r), z = Math.floor(pl.z + Math.sin(a) * r);
  if (!g.world.isLoaded(x, z)) return false;
  let y = 120;
  while (y > 1 && !SOLID[g.world.getBlock(x, y, z)]) y--;
  const ground = g.world.getBlock(x, y, z), above = g.world.getBlock(x, y + 1, z);
  if (y < SEA || BLOCKS[ground].fluid || (above !== AIR && BLOCKS[above].render !== 'cross') || g.world.getBlock(x, y + 2, z) !== AIR) return false;
  if (zonaSegura(g, x, z) || hayLuzCerca(g.world, x, y + 1, z)) return false;
  const dia = g.day || 1;
  const n = Math.min(tope - hay, dia >= 3 ? 1 + (Math.random() < 0.5 ? 1 : 0) + (dia >= 7 && Math.random() < 0.35 ? 1 : 0) : 1);
  for (let i = 0; i < n; i++) {
    const s = this.spawnMob(tipoSombra(g), x + 0.5 + (i % 2) * 1.2, y + 1, z + 0.5 + Math.floor(i / 2) * 1.2);
    if (s) s.health += Math.min(14, Math.floor(dia / 2));
  }
  return true;
};

// ¿hay una luz puesta a 8 bloques o menos? (la Sombra no nace ahí)
const LUCES = new Set(['torch', 'wall_torch0', 'wall_torch1', 'wall_torch2', 'wall_torch3', 'fogata', 'stove', 'furnace_lit', 'farol', 'farol_zenaida', 'lamp', 'lava'].map((k) => K[k]).filter(Boolean));
function hayLuzCerca(w, x, y, z) {
  for (let dx = -8; dx <= 8; dx++) for (let dz = -8; dz <= 8; dz++) for (let dy = -3; dy <= 4; dy++) if (LUCES.has(w.getBlock(x + dx, y + dy, z + dz))) return true;
  return false;
}

function rayBox(ox, oy, oz, dx, dy, dz, x0, y0, z0, x1, y1, z1) {
  let tmin = -Infinity, tmax = Infinity;
  const o = [ox, oy, oz], d = [dx, dy, dz], lo = [x0, y0, z0], hi = [x1, y1, z1];
  for (let a = 0; a < 3; a++) {
    if (Math.abs(d[a]) < 1e-9) {
      if (o[a] < lo[a] || o[a] > hi[a]) return null;
    } else {
      let t1 = (lo[a] - o[a]) / d[a], t2 = (hi[a] - o[a]) / d[a];
      if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }
  }
  if (tmax < 0) return null;
  return Math.max(0, tmin);
}
