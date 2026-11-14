// El bus del pueblo: cada tanto llega por la calle a la parada (frena con el «pssst» de los frenos de aire, se
// ladea y abre la puerta), espera un rato y se va. Mientras está parado uno escoge destino (clic derecho) y se sube
// (Shift + clic, paga el pasaje): queda sentado adentro, la puerta se cierra, pita y arranca con uno a bordo por la
// calle; la pantalla se oscurece durante el viaje y el bus llega a la parada del otro pueblo, abre y uno se baja.
import * as THREE from 'three';
import { carroceriaBus, armarChofer, llantaBus } from './modelos-cosas.js';
import { villageAt, CELL } from './pueblogen.js';
import { SOLID } from './blocks.js';
import { viajaGratis } from './comite.js';
import { pal, tintModel } from './models.js';
import { box, flat, solid } from './fauna.js';

const COLON = 360;
const IN = 50; // de dónde sale y hasta dónde llega el bus (bloques desde la parada, por la calle)
const CHISTES = ['Iba lleno: medio viaje de pie y con la mochila de otro en la cara.', 'El chofer paró en todas las esquinas y en una soda.', 'Hubo presa por un derrumbe… y por una vaca en la calle.', 'Le tocó al lado de una señora que le contó toda su vida. Muy amable.', 'El bus no tenía aire acondicionado, pero sí reguetón a todo volumen.', 'Un señor se subió a vender chicles y a contar su historia. Le compró dos.'];

// altura de la calle debajo de (x, z): las calles siguen la loma, el bus también
function surfaceAt(g, x, z, yHint) {
  const w = g.world, fx = Math.floor(x), fz = Math.floor(z);
  if (!w.isLoaded(fx, fz)) return yHint;
  for (let y = Math.floor(yHint) + 6; y > yHint - 10; y--) if (SOLID[w.getBlock(fx, y, fz)]) return y + 1;
  return yHint;
}

// de coordenadas del bus (x a la derecha, z hacia el frente) al mundo
function toWorld(m, lx, lz) {
  const c = Math.cos(m.yaw), s = Math.sin(m.yaw), b = m.body.pos;
  return [b.x + lx * c + lz * s, b.z - lx * s + lz * c];
}

export const BUS = {
  name: 'Bus de Transportes La Ilusión (ficticio)', w: 2.4, h: 2.8, health: 999, speed: 0, bus: true, hurtSound: 'hueco', idleSound: null,
  particle: [[0.9, 0.9, 0.85]], drops: [],
  build() {
    const g = new THREE.Group();
    const body = new THREE.Group(); g.add(body);
    // carrocería (sin el lado de la puerta adelante) y el techo
    const shell = [];
    const caja = carroceriaBus(); body.add(caja); shell.push(caja);
    body.add(flat(0x3a3a3e, 2.46, 0.3, 7.7, 0, 0.5, 0));
    body.add(flat(0xd0ccc0, 2.2, 0.12, 7.2, 0, 2.7, 0));
    // ventanas, parabrisas, rótulo de ruta encendido, focos y stops
    for (const s of [-1, 1]) for (let k = 0; k < 6; k++) if (!(s > 0 && k === 5)) { const gl = flat(0x7aa8c0, 0.02, 0.7, 0.9, s * 1.21, 1.95, -2.9 + k * 1.1); body.add(gl); shell.push(gl); }
    const parabrisas = flat(0x7aa8c0, 2.1, 1.0, 0.02, 0, 1.9, 3.81); body.add(parabrisas); shell.push(parabrisas);
    body.add(flat(0xff9a20, 1.6, 0.3, 0.02, 0, 2.55, 3.82, true));
    // el interior (solo se ve cuando uno va sentado): ventanas abiertas entre columnas, tablero y techo
    const interior = new THREE.Group(); interior.visible = false; body.add(interior);
    const BL = 0xece8dc;
    for (const s of [-1, 1]) {
      interior.add(flat(BL, 0.04, 1.0, 7.4, s * 1.17, 0.95, 0));
      interior.add(flat(BL, 0.04, 0.3, 7.4, s * 1.17, 2.5, 0));
      for (let k = 0; k <= 6; k++) interior.add(flat(0x4a4a50, 0.05, 0.8, 0.12, s * 1.16, 1.95, -3.45 + k * 1.1));
    }
    interior.add(flat(0xd0ccc0, 2.3, 0.04, 7.4, 0, 2.66, 0), flat(BL, 2.3, 2.2, 0.04, 0, 1.55, -3.75));
    interior.add(flat(0x2a2a2e, 2.2, 0.35, 0.5, 0, 1.15, 3.5), flat(0x9ad0ff, 0.3, 0.1, 0.02, 0.5, 1.34, 3.26, true));
    interior.add(flat(0x7a7a80, 0.06, 1.6, 0.06, 0.35, 1.7, 2.3));
    for (const s of [-1, 1]) { body.add(flat(0xfff2b0, 0.3, 0.2, 0.04, s * 0.9, 0.9, 3.82, true)); body.add(flat(0xc81818, 0.25, 0.3, 0.04, s * 1.0, 0.95, -3.82, true)); }
    body.add(flat(0x2a2a2e, 2.3, 0.2, 0.1, 0, 0.55, 3.86), flat(0xf4f4f0, 0.6, 0.18, 0.02, 0, 0.62, -3.87));
    // adentro: asientos rojos, el chofer con su gorra y el timón
    for (let k = 0; k < 5; k++) for (const s of [-1, 1]) body.add(box('bus-asiento', 0.7, 0.5, 0.5, solid(pal('#8a1c1c', '#a02424')), s * 0.65, 1.0, -2.8 + k * 1.15));
    const chofer = armarChofer();
    body.add(chofer);
    // la puerta delantera (lado derecho): dos hojas que se abren hacia afuera
    const door = [];
    for (const [z, dir] of [[3.45, -1], [2.25, 1]]) {
      const hinge = new THREE.Group(); hinge.position.set(1.2, 0.5, z);
      hinge.add(box('bus-puerta', 0.06, 1.9, 0.6, (f, s) => { solid(pal('#3a3a40', '#44444a'))(f, s); for (let y = 3; y < s.h - 4; y++) for (let x = 1; x < s.w - 1; x++) s.set(x, y, [120, 168, 192]); }, 0, 0.95, dir * 0.3));
      body.add(hinge); door.push({ hinge, dir });
    }
    const wheels = [];
    for (const [x, z] of [[-1.15, 2.6], [1.15, 2.6], [-1.15, -2.4], [1.15, -2.4]]) {
      const w = new THREE.Group(); w.position.set(x, 0.45, z);
      w.add(llantaBus(0.45, 0.3));
      body.add(w); wheels.push(w);
    }
    g.userData = { body, wheels, door, shell, interior };
    return g;
  },
  update(m, dt) {
    const g = m.game, b = m.body, d = m.data, u = m.group.userData;
    const R = d.route;
    if (!R) { m.dead = true; return; }
    let v = 0, brake = 0;
    if (d.hold) { /* esperando a que cargue el pueblo de destino */ } else if (d.phase === 'llega') {
      const left = R.stopX - b.pos.x;
      v = Math.min(10, Math.max(1.0, left * 0.55));
      brake = left < 12 ? 1 - left / 12 : 0;
      b.pos.x += v * dt;
      if (left < 7 && !d.frenoSono) { d.frenoSono = true; g.audio.play('bus.freno', { pos: b.pos, vol: 0.9 }); }
      if (left <= 0.15) {
        b.pos.x = R.stopX;
        d.phase = 'para'; d.t = d.arrive ? 6 : 26;
        g.audio.play('bus.puerta', { pos: b.pos, vol: 0.8 });
        const p = g.player.body.pos;
        if (!d.arrive && Math.hypot(p.x - b.pos.x, p.z - b.pos.z) < 40) g.ui.toast(`🚌 Llegó el bus a la parada de ${R.name}. Clic derecho para ver destinos`, 3200);
        if (d.arrive && g.riding === m) d.exitT = 1.4;
      }
    } else if (d.phase === 'para') {
      d.t -= dt;
      // al llegar con pasajero, se baja solito en la parada
      if (d.exitT !== undefined && (d.exitT -= dt) <= 0) { d.exitT = undefined; bajarse(g, m, true); }
      if (d.t <= 0) { d.phase = 'cierra'; d.t = 1.1; g.audio.play('bus.puerta', { pos: b.pos, vol: 0.6, pitch: 1.1 }); }
    } else if (d.phase === 'cierra') {
      d.t -= dt;
      if (d.t <= 0) { d.phase = 'sale'; d.frenoSono = false; g.audio.play('pito', { pos: b.pos, vol: 0.9, pitch: 0.75 }); }
    } else {
      d.vs = Math.min(12, (d.vs || 0) + 2.6 * dt); v = d.vs;
      b.pos.x += v * dt;
      // con pasajero: un rato de calle y después el viaje (pantalla a negro)
      if (d.trip && g.riding === m && b.pos.x > R.stopX + 26 && !d.fading) { d.fading = true; viajar(g, m); }
      if (b.pos.x > R.stopX + IN && !d.fading) { if (g.riding === m) bajarse(g, m, false); m.dead = true; g.audio.setEmitter('bus', 'loop.motor', null); return; }
    }
    // sentado adentro: se esconde la carrocería de afuera y se ve el interior con las ventanas abiertas
    const inside = g.riding === m;
    if (u.interior.visible !== inside) { u.interior.visible = inside; u.shell.forEach((o) => { o.visible = !inside; }); }
    // la puerta: abierta mientras está parado
    const open = d.phase === 'para' ? 1 : 0;
    d.doorK = (d.doorK || 0) + (open - (d.doorK || 0)) * Math.min(1, dt * 5);
    u.door.forEach(({ hinge, dir }) => { hinge.rotation.y = dir * d.doorK * 1.35; });
    // se inclina al frenar, se ladea hacia la acera parado y vibra el motor
    d.spin = (d.spin || 0) + v * dt * 2.2;
    u.wheels.forEach((w) => { w.rotation.x = d.spin; });
    d.pitch = (d.pitch || 0) + ((brake * 0.035) - (d.pitch || 0)) * Math.min(1, dt * 4);
    u.body.rotation.z = -d.doorK * 0.025;
    u.body.position.y = Math.sin(m.t * 22) * (v > 0.5 ? 0.012 : 0.006);
    g.audio.setEmitter('bus', 'loop.motor', { x: b.pos.x, y: b.pos.y + 1, z: b.pos.z }, 0.45);
    // sigue la calle: altura del centro (suavizada) e inclinación entre las ruedas de adelante y de atrás
    const hF = surfaceAt(g, b.pos.x + 2.6, R.z, d.yS ?? R.y), hB = surfaceAt(g, b.pos.x - 2.4, R.z, d.yS ?? R.y);
    const target = Math.max(hF, hB) - Math.abs(hF - hB) * 0.5;
    d.yS = d.yS === undefined ? target : d.yS + (target - d.yS) * Math.min(1, dt * 6);
    const slope = Math.max(-0.1, Math.min(0.1, Math.atan2(hF - hB, 5) * 0.5));
    d.slope = (d.slope || 0) + (slope - (d.slope || 0)) * Math.min(1, dt * 4);
    u.body.rotation.x = d.pitch - d.slope;
    b.pos.y = d.yS; b.pos.z = R.z;
    m.yaw = Math.PI / 2;
    m.group.position.set(b.pos.x, b.pos.y, b.pos.z);
    m.group.rotation.y = m.yaw;
    tintModel(m.group, m.lightLevel(), 0);
  },
  onHurt() { return false; },
  interact(m, g) {
    const d = m.data;
    if (g.riding === m) return true;
    if (d.phase !== 'para' || d.arrive) { g.ui.dialog('Chofer', '¡Espere a que pare, mae!', 1800); return true; }
    const dests = destinos(g, d.route);
    if (!dests.length) { g.ui.dialog('Chofer', 'Esta ruta llega hasta aquí nada más.', 2200); return true; }
    const sneaking = g.player.sneaking || (g.keys && (g.keys.has('ShiftLeft') || g.keys.has('ShiftRight')));
    if (d.sel === undefined || !sneaking) {
      d.sel = d.sel === undefined ? 0 : (d.sel + 1) % dests.length;
      const D = dests[d.sel];
      g.ui.dialog('Chofer', `¿Para dónde va? ${D.name} · ${(D.d / 1000).toFixed(1)} km · ${D.price} colones. (Clic: otro destino · Shift + clic: ¡súbase!)`, 6000);
      d.t = Math.max(d.t, 8);
      return true;
    }
    const D = dests[d.sel % dests.length];
    if (g.mode === 'survival' && viajaGratis(g, d.route && d.route.vid, D.id)) g.ui.toast('🛣 Pase de los Caminos: este viaje va por cuenta del Comité', 2200);
    else if (g.mode === 'survival') {
      if (g.inventory.count(COLON) < D.price) { g.ui.dialog('Chofer', `Son ${D.price} colones, mae. Sin pasaje no hay viaje.`, 2400); return true; }
      g.inventory.remove(COLON, D.price);
    }
    g.audio.play('monedas', { ui: true, vol: 0.5 });
    g.llegoEnBus = (g.clock || 0) + 60; // v12.5.1: el viaje dura un ratito; desde ahí cuenta (encargos2.js: el mandado paga menos)
    subirse(g, m, D);
    return true;
  },
};

// pueblos de cuadras cercanos (los más cerca primero)
function destinos(g, R) {
  const gen = g.world.gen, res = [];
  const cx = Math.floor(R.vx / CELL), cz = Math.floor(R.vz / CELL);
  for (let dz = -6; dz <= 6; dz++) for (let dx = -6; dx <= 6; dx++) {
    const v = villageAt(gen, cx + dx, cz + dz);
    if (!v || !v.streets || v.id === R.vid) continue;
    const d = Math.hypot(v.x - R.vx, v.z - R.vz);
    res.push({ name: v.name || 'Pueblo', x: v.x, y: v.y, z: v.z, d, price: Math.max(1, Math.ceil(d / 400)), id: v.id });
  }
  return res.sort((a, b) => a.d - b.d).slice(0, 4);
}

function routeFor(v) {
  const stopX = v.x + 4;
  return { stopX, z: v.z + 13.5, y: v.y + 1, name: v.name || 'el pueblo', vx: v.x, vz: v.z, vid: v.id };
}

function subirse(g, m, D) {
  const d = m.data;
  g.riding = m; d.ridden = true; d.trip = D;
  g.player.flying = false;
  d.t = Math.min(d.t, 1.6);
  g.ui.toast(`🚌 ¡Vámonos para ${D.name}! Siéntese, que el chofer maneja rapidito`, 2800);
}

function bajarse(g, m, llego) {
  const d = m.data;
  if (g.riding !== m) return;
  g.riding = null; d.ridden = false;
  const [x, z] = toWorld(m, 2.4, 2.85);
  const p = g.player.body;
  p.pos.x = x; p.pos.z = z; p.pos.y = m.body.pos.y + 0.1;
  p.vel.x = p.vel.y = p.vel.z = 0; p.fallStart = null;
  g.player.eyeHeight = 1.62;
  if (llego) {
    d.arrive = false;
    g.ui.toast(`🚌 Llegó a ${d.route.name}. ${CHISTES[Math.floor(Math.random() * CHISTES.length)]}`, 5200);
    g.achieve('bus', 'Viaje en bus');
    g.meta.viajesBus = (g.meta.viajesBus || 0) + 1;
    if (g.meta.viajesBus >= 5) g.achieve('bus5', 'Cliente fijo del bus');
  }
}

// la pantalla a negro: el bus «viaja» y reaparece entrando al otro pueblo con uno adentro
function viajar(g, m) {
  const d = m.data, D = d.trip;
  const mins = Math.round(D.d / 1000 * 25 + 10 + Math.random() * 30);
  // a negro; en negro el bus se pasa al otro pueblo y espera quieto a que cargue el terreno; después aparece la imagen
  // y el bus entra a la parada
  const o = document.getElementById('sleep-overlay');
  if (o) { o.style.transition = 'opacity 1.2s'; o.style.opacity = 1; }
  setTimeout(() => {
    d.route = routeFor(D);
    m.body.pos.x = d.route.stopX - 34; m.body.pos.y = d.route.y; m.body.pos.z = d.route.z;
    d.phase = 'llega'; d.vs = 0; d.frenoSono = false; d.trip = null; d.arrive = true; d.fading = false; d.hold = true; d.yS = undefined;
    busRide(g, m, 0, {});
    g.time = (g.time + mins / 1440) % 1;
    g.player.food = Math.max(0, g.player.food - 1);
    g.ui.toast(`🕐 ${mins} minutos de viaje después…`, 3000);
    setTimeout(() => { if (o) o.style.opacity = 0; setTimeout(() => { d.hold = false; }, 500); }, 2400);
  }, 1300);
}

// sentado en el bus: la cámara va con el bus; Shift se baja solo si está parado
export function busRide(g, m, dt, input) {
  const p = g.player, d = m.data;
  if (input.sneak) {
    if (d.phase === 'para' && !d.trip) { bajarse(g, m, !!d.arrive); return; }
    if (!d.toldWait) { d.toldWait = true; g.ui.toast('El chofer no para aquí: espere a la parada', 1600); }
  } else d.toldWait = false;
  const [x, z] = toWorld(m, 0.65, 1.2);
  p.body.pos.x = x; p.body.pos.z = z; p.body.pos.y = m.body.pos.y + 0.75;
  p.body.vel.x = p.body.vel.y = p.body.vel.z = 0;
  p.body.onGround = true; p.body.fallStart = null;
  p.eyeHeight = 1.15;
}

// cada segundo: si uno está cerca de la parada de un pueblo de cuadras y no hay bus, de vez en cuando llega uno
export function tickBus(g) {
  if (g.dim !== 'tierra' || !g.world || g.world.gen.version < 6) return;
  const E = g.entities;
  if (E.mobs.some((m) => m.type === 'bus' && !m.dead)) return;
  const ck = g.clock || 0;
  if (ck < (g.busCd || 0)) return;
  const p = g.player.body.pos, gen = g.world.gen;
  const cx = Math.floor(p.x / CELL), cz = Math.floor(p.z / CELL);
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const v = villageAt(gen, cx + dx, cz + dz);
    if (!v || !v.streets) continue;
    const route = routeFor(v);
    if (Math.hypot(p.x - route.stopX, p.z - route.z) > 45) continue;
    if (Math.random() > 0.12) return;
    g.busCd = ck + 60 + Math.random() * 40;
    const m = E.spawnMob('bus', route.stopX - IN, route.y, route.z);
    m.data.route = route; m.data.phase = 'llega';
    m.yaw = Math.PI / 2;
    g.audio.play('pito', { pos: { x: route.stopX - 30, y: route.y, z: route.z }, vol: 0.6, pitch: 0.75 });
    return;
  }
}
