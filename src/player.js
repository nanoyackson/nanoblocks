// Jugador: movimiento, vuelo, nado, vida, hambre y aire.
import { quizaQuebrar } from './mina.js';
import { ventaja, mana } from './progreso.js';
import { Body } from './physics.js';
import { BLOCKS, BLOCK_BY_KEY } from './blocks.js';
import { difOf } from './supervivencia.js';
import { mult, lv as skillLv } from './habilidades.js';
import { caidaPendiente } from './cuerpo.js';

export const EYE = 1.62;
export const EYE_SNEAK = 1.45;

const WALK = 4.317, SPRINT = 5.612, SNEAK = 1.31, FLY = 10.9, FLY_SPRINT = 21.6;
const JUMP_V = 8.4;

export class Player {
  constructor() {
    this.body = new Body(0.6, 1.8);
    this.yaw = 0; // giro horizontal
    this.pitch = 0; // mirada arriba/abajo
    this.health = 20;
    this.vidaExtra = 0; // corazones ganados (2 = un corazón)
    this.food = 20;
    this.air = 10;
    this.flying = false;
    this.alive = true;
    this.sprinting = false;
    this.sneaking = false;
    this.hurtCd = 0;
    this.regenT = 0;
    this.starveT = 0;
    this.drownT = 0;
    this.cactusT = 0;
    this.hungerT = 0;
    this.stepDist = 0;
    this.bob = 0;
    this.lastSpaceTap = 0;
    this.eyeHeight = EYE;
    this.effects = {};
  }

  get maxHealth() { return Math.max(8, 20 + (this.vidaExtra || 0) + (this.vidaComida || 0) - (this.necrosis || 0) * 2); } // vidaComida: la fuerza de lo comido (fuerza.js) // la necrosis (terciopelo) baja el tope hasta que se cure
  get eye() { return { x: this.body.pos.x, y: this.body.pos.y + this.eyeHeight, z: this.body.pos.z }; }

  lookDir() {
    const cp = Math.cos(this.pitch);
    return { x: -Math.sin(this.yaw) * cp, y: Math.sin(this.pitch), z: -Math.cos(this.yaw) * cp };
  }

  toJSON() {
    const p = this.body.pos;
    return { x: p.x, y: p.y, z: p.z, yaw: this.yaw, pitch: this.pitch, health: this.health, food: this.food, water: this.water ?? 20, air: this.air, flying: this.flying };
  }

  load(d) {
    if (!d) return;
    this.body.pos.x = d.x; this.body.pos.y = d.y; this.body.pos.z = d.z;
    this.yaw = d.yaw || 0; this.pitch = d.pitch || 0;
    this.health = d.health ?? 20; this.food = d.food ?? 20; this.water = d.water ?? 20; this.air = d.air ?? 10;
    this.flying = !!d.flying;
  }

  // input: { forward, back, left, right, jump, sneak, sprint }
  update(dt, input, game) {
    const b = this.body;
    const v = b.vel;
    const creative = game.mode === 'creative';
    if (!creative) this.flying = false;

    this.sneaking = input.sneak && !this.flying;
    const moving = input.forward || input.back || input.left || input.right;
    if (input.sprint && input.forward && !this.sneaking && (creative || this.food > 6)) this.sprinting = true;
    if (!input.forward || this.sneaking || b.hitWall || this.effects.bala || this.effects.cojera) this.sprinting = false; // v12.4.1: la cojera, también

    // dirección deseada
    let fx = 0, fz = 0;
    if (input.forward) fz -= 1;
    if (input.back) fz += 1;
    if (input.left) fx -= 1;
    if (input.right) fx += 1;
    const len = Math.hypot(fx, fz) || 1;
    fx /= len; fz /= len;
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    const wx = fx * cos + fz * sin;
    const wz = -fx * sin + fz * cos;

    let speed = this.flying ? (this.sprinting ? FLY_SPRINT : FLY) : this.sneaking ? SNEAK : this.sprinting ? SPRINT : WALK;
    if (b.inWater && !this.flying) speed *= 0.55;
    if (this.effects.energia && !this.flying) speed *= 1.25;
    if (game && game.conjunto === 'leather' && !this.flying) speed *= 1.08; // el conjunto de cuero (conjuntos.js)
    if (this.effects.cansado && !this.flying) speed *= 0.88;
    if (this.effects.sangrando && this.sprinting && !this.flying) speed *= 0.9;
    if (this.sprinting && !this.flying && game && skillLv(game, 'exploracion') >= 10) speed *= 1.08;
    if (!this.flying && game && mana(game, 'pata_de_perro')) speed *= 1.07;
    if (this.effects.delfin && b.inWater && !this.flying) speed *= 1.9;
    if (this.effects.miedo && !this.flying) speed *= 0.6;
    if (this.effects.escalofrio && !this.flying) speed *= 0.8;
    if (this.effects.fiebre && !this.flying) speed *= 0.88;
    if (this.effects.enredado && !this.flying) speed *= 0.3;
    if (this.effects.panza && !this.flying) speed *= 0.85;
    if (this.effects.quebrado && !this.flying) speed *= 0.55;
    if (this.effects.paralisis && !this.flying) speed *= 0.45; // la coral: las piernas no responden
    if (this.effects.enlodado && !this.flying) speed *= 0.7; // lodo del lahar hasta las rodillas
    if (this.effects.bala && !this.flying) speed *= 0.8; // la picada de la hormiga bala
    const under = BLOCKS[b.blockUnderFeet(game.world)];
    const slippery = under && under.slippery;

    let accel;
    if (this.flying) accel = 10;
    else if (b.onGround) accel = slippery ? 3 : 18;
    else if (b.inWater) accel = 6;
    else accel = 3.2;
    const k = 1 - Math.exp(-accel * dt);
    const tx = moving ? wx * speed : 0;
    const tz = moving ? wz * speed : 0;
    if (this.forcedVel) {
      // voltereta o deslizada: la velocidad la manda el movimiento especial
      v.x = this.forcedVel.x; v.z = this.forcedVel.z;
    } else if (!b.onGround && !this.flying && !b.inWater && !moving) {
      // conservar el impulso en el aire
      v.x *= Math.pow(0.6, dt); v.z *= Math.pow(0.6, dt);
    } else {
      v.x += (tx - v.x) * k;
      v.z += (tz - v.z) * k;
    }

    if (this.flying) {
      const ty = input.jump ? 7.5 : input.sneak ? -7.5 : 0;
      v.y += (ty - v.y) * (1 - Math.exp(-12 * dt));
    } else if (b.inWater) {
      if (input.jump) {
        v.y = Math.min(v.y + 22 * dt, 3.4);
        if (b.hitWall) v.y = 5.2; // salir del agua trepando
      }
    } else if (input.jump && b.onGround) {
      v.y = JUMP_V;
      game.particles.dust(b.pos.x, b.pos.y, b.pos.z, b.blockUnderFeet(game.world), 3); // el empujón levanta un poquito
      if (this.sprinting) { v.x += wx * 1.6; v.z += wz * 1.6; }
      this.hungerT += 0.6;
    }

    if (b.inWater && !this.flying && (moving || input.jump)) {
      this.swimT = (this.swimT || 0) - dt;
      if (this.swimT <= 0) { this.swimT = 0.75; game.audio.play('swim', { vol: 0.3, pos: { x: b.pos.x, y: b.pos.y + 1, z: b.pos.z } }); }
    }
    // v13.4.3 (CC4): la cuerda de espeleólogo se trepa: salto sube, agacharse baja, y quieto se sostiene
    b.enCuerda = !this.flying && !b.inWater && (game.world.getBlock(Math.floor(b.pos.x), Math.floor(b.pos.y + 0.4), Math.floor(b.pos.z)) === BLOCK_BY_KEY.cuerda || game.world.getBlock(Math.floor(b.pos.x), Math.floor(b.pos.y + 1.2), Math.floor(b.pos.z)) === BLOCK_BY_KEY.cuerda);
    if (b.enCuerda) v.y = input.jump ? 3.2 : input.sneak ? -3.2 : 0;
    const wasAir = !b.onGround, wasWater = b.inWater;
    const vyBefore = v.y;
    const res = b.step(game.world, dt, { flying: this.flying, sneak: this.sneaking });
    // el chapuzón: agua para todos lados, según qué tan duro cayó
    if (!wasWater && b.inWater && !this.flying && vyBefore < -3.5 && game.ready) {
      const duro = Math.min(1, -vyBefore / 16);
      game.particles.burst(b.pos.x, b.pos.y + 0.5, b.pos.z, [[0.78, 0.9, 1], [0.5, 0.72, 0.96], [1, 1, 1]], Math.round(10 + duro * 26), 2.6 + duro * 3.4);
      game.audio.play('splash', { pos: { x: b.pos.x, y: b.pos.y + 0.5, z: b.pos.z }, vol: 0.35 + duro * 0.45, pitch: 1.15 - duro * 0.3 });
      game.landHit = Math.max(game.landHit || 0, 0.04 + duro * 0.1);
      game.chapuzonT = game.clock || 0;
    }
    if (wasAir && b.onGround && vyBefore < -6) {
      game.landHit = Math.min(0.25, -vyBefore * 0.012);
      const under = b.blockUnderFeet(game.world);
      game.particles.dust(b.pos.x, b.pos.y, b.pos.z, under, Math.min(14, Math.floor(-vyBefore)));
      const bl = BLOCKS[under];
      if (bl && bl.sound) game.audio.material(bl.sound, 'step', { x: b.pos.x, y: b.pos.y, z: b.pos.z });
    }
    if (this.flying && b.onGround && creative && !input.jump) this.flying = false;

    // cámara: altura de ojos y balanceo al caminar
    const targetEye = game && game.sentado ? 1.0 : this.sneaking ? EYE_SNEAK : EYE;
    this.eyeHeight += (targetEye - this.eyeHeight) * Math.min(1, dt * 12);
    const hs = Math.hypot(v.x, v.z);
    if (b.onGround && hs > 0.5) {
      this.bob += hs * dt * 1.9;
      this.stepDist += hs * dt;
      if (this.stepDist > 2.1) {
        this.stepDist = 0;
        const underId = b.blockUnderFeet(game.world);
        const blk = BLOCKS[underId];
        if (blk && blk.sound) game.audio.material(blk.sound, 'step', { x: b.pos.x, y: b.pos.y, z: b.pos.z });
        if (this.sprinting) game.particles.dust(b.pos.x, b.pos.y, b.pos.z, underId, 3);
      }
    }

    // ---- supervivencia ----
    if (creative) { this.health = this.maxHealth; this.food = 20; this.air = 10; return; }
    const softLanding = BLOCKS[b.blockUnderFeet(game.world)].soft || this.effects.pluma || this.capa || (game.sinCaida || 0) > (game.clock || 0); // sinCaida: un rato sin daño por caída (soltarse del palo, un revolcón)
    // v12.2.0: con una caída fuerte, el golpe espera 0.25 s por si rueda (cuerpo.js)
    if (res.fallDamage > 0 && !softLanding) { const pie = mana(game, 'cae_de_pie'); if (!caidaPendiente(game, res.fallDamage, pie, (d) => quizaQuebrar(game, d))) { game.damagePlayer(res.fallDamage * (pie ? 0.5 : 1), null, null, 'Caída desde muy alto'); if (!pie) quizaQuebrar(game, res.fallDamage); } }
    // pluma dorada: se cae despacito
    if (this.effects.pluma && b.vel.y < -3.5 && !this.flying) b.vel.y = -3.5;
    // capa de la Arpía: planea (cae lento salvo agachado)
    if (this.capa && b.vel.y < -5 && !this.flying && !this.sneaking) b.vel.y = -5;
    if (res.landedSpeed < -12) game.audio.material('gravel', 'break', { x: b.pos.x, y: b.pos.y, z: b.pos.z });

    this.hurtCd = Math.max(0, this.hurtCd - dt);
    // hambre
    // con Calma (abrazo de perezoso) el hambre baja mucho más lento
    const dif = difOf(game);
    this.hungerT += dt * (this.sprinting ? (this.effects.calor ? 3.75 : 3) : moving ? 1.2 : 0.8) * (this.effects.calma ? 0.35 : 1) * (this.effects.panza ? 2 : 1) * dif.hunger * mult.gasto(game);
    if (this.hungerT >= 45) { this.hungerT = 0; this.food = Math.max(0, this.food - 1); }
    // regeneración y hambre extrema
    // curarse pide estar bien comido y con agua (antes se podía sanar muriéndose de sed)
    if (this.food >= 15 && (this.water ?? 20) >= 6 && !this.effects.fiebre && !this.effects.ardor && this.health < this.maxHealth) {
      this.regenT += dt;
      // curarse cuesta comida (más en Difícil)
      if (this.regenT >= 3 * ventaja.regen(game)) { this.regenT = 0; this.health = Math.min(this.maxHealth, this.health + 1); this.hungerT += dif.regenCost; }
    } else this.regenT = 0;
    if (this.food <= 0) {
      this.starveT += dt;
      if (this.starveT >= 4) {
        this.starveT = 0;
        if (dif.starveKills) game.damagePlayer(1, null, null, 'Se murió de hambre', true);
        else if (this.health > 1) game.damagePlayer(1, null, null, 'El hambre le quitó las fuerzas', true);
        if (this.health <= 4 && !this.toldHambre) { this.toldHambre = true; game.ui.toast('🍽 ¡Tiene mucha hambre! Coma algo ya', 2400); }
      }
    } else this.toldHambre = false;
    // aire bajo el agua
    if (b.headInWater) {
      this.air = Math.max(0, this.air - dt * (this.effects.buceo ? 0.33 : 1));
      if (this.air <= 0) {
        this.drownT += dt;
        if (this.drownT >= 1) { this.drownT = 0; game.damagePlayer(2, null, null, 'Se ahogó', true); }
      }
    } else this.air = Math.min(10, this.air + dt * 4);
    // cactus
    this.cactusT = Math.max(0, this.cactusT - dt);
    if (this.cactusT <= 0 && b.touchingBlock(game.world, (bl) => bl.hurts)) { this.cactusT = 0.5; game.damagePlayer(1, null, null, 'Abrazó un cactus', true, true); }
    // lava
    this.lavaT = Math.max(0, (this.lavaT || 0) - dt);
    if (b.inLava && this.lavaT <= 0 && !this.effects.ignifugo) { this.lavaT = 0.5; const bo = game.inventory.armor[3]; game.damagePlayer(bo && bo.id === 1168 ? 2 : 4, null, null, 'Se bañó en lava', true, true); } // v12.15.2: las botas de ceniza, a la mitad
    if (!b.inLava && b.onGround && !this.sneaking && !this.effects.ignifugo && BLOCKS[b.blockUnderFeet(game.world)].magma && this.lavaT <= 0) { this.lavaT = 1; game.damagePlayer(1, null, null, 'Se quemó con el magma', true, true); }
    // laguna ácida del Poás
    this.acidT = Math.max(0, (this.acidT || 0) - dt);
    if (this.acidT <= 0 && b.touchingBlock(game.world, (bl) => bl.acid)) { this.acidT = 1; game.damagePlayer(1, null, null, 'El ácido de la laguna del Poás quema', true, true); }
    // vacío
    if (b.pos.y < -20) game.damagePlayer(4, null, null, 'Se cayó del mundo', true);
  }
}
