// C2 «El cuerpo que siente» (v12.2.0, docs/revisiones/DISENO_CONTENIDO_C1-C4.md): nada de ítems nuevos, todo es sensación.
// Rodar al aterrizar, las señales del cuerpo (tripas, mano que tiembla, vaho, bostezo), sentarse sin saltos, beber con las manos en
// tres tragos, despertar con sobresalto y la cojera después de la tablilla. Con «Movimiento tranquilo» solo quedan el sonido y el texto.
// Nada se guarda (caidaPend, bebeManos y lo demás viven en g); la cojera es un efecto como los de siempre.
import { calmaActiva } from './calma.js';
import { consejoUnaVez } from './supervivencia.js';

const VENTANA = 0.25; // segundos para rodar al tocar el suelo

// ---------- rodar al aterrizar ----------
// player.js la llama al tocar el suelo con daño de caída: si la caída es fuerte, el daño espera 0.25 s por si rueda (o si ya había
// tocado rodar justo antes de llegar). Devuelve true si se quedó esperando
export function caidaPendiente(g, dano, pie, quebrar) {
  if (dano < 3 || g.mode !== 'survival') return false;
  const antes = (g.clock || 0) - (g.rollIntento ?? -9) < VENTANA; // tocó rodar en el aire justo antes de llegar (v12.4.1)
  g.rollIntento = null;
  g.caidaPend = { dano, pie, quebrar, t: VENTANA, antes };
  consejoUnaVez(g, 'rodar', '🤸 Al caer de alto, toque rodar justo antes del suelo: el golpe pega menos', 5000);
  return true;
}
function resolverCaida(g, rodo) {
  const C = g.caidaPend;
  g.caidaPend = null;
  if (!C) return;
  const k = (C.pie ? 0.5 : 1) * (rodo ? 0.4 : 1);
  if (rodo) {
    g.ui.toast('🤸 ¡Cayó como gato de potrero!', 1800);
    g.achieve('gato_potrero', 'Cayó como gato de potrero');
  }
  // la voltereta da unos instantes sin daño: el golpe de la caída igual entra (rebajado si rodó)
  const fr = g.iframes; g.iframes = 0;
  g.damagePlayer(C.dano * k, null, null, 'Caída desde muy alto', true);
  g.iframes = fr;
  if (!rodo && !C.pie && C.quebrar) C.quebrar(C.dano);
}

// ---------- beber con las manos ----------
// lo arranca beberDelRio (supervivencia2.js): tres tragos de 0.4 s; un golpe lo corta
export function empezarBeber(g, alTrago) {
  if (g.bebeManos) return;
  g.bebeManos = { n: 3, t: 0.15, alTrago, vida: g.player.health };
  if (!calmaActiva(g)) g.landHit = 0.15;
}

// ---------- cada cuadro ----------
export function tickCuerpo2(g, dt) {
  const P = g.player, fx = P.effects;
  // la caída pendiente: rodó (o había tocado rodar justo antes), se acabó la ventana, o pasó algo grave (murió, viaje, otra dimensión)
  if (g.caidaPend) {
    const C = g.caidaPend;
    C.t -= dt;
    if (!P.alive || !g.ready) resolverCaida(g, false);
    else if (g.roll) resolverCaida(g, true);
    else if (C.antes) { C.antes = false; if (g.intentarRodar && g.intentarRodar()) resolverCaida(g, true); } // v12.4.1: solo si la voltereta de verdad sale (aire y enfriamiento), en el mismo cuadro
    else if (C.t <= 0) resolverCaida(g, false);
  }
  // los tragos
  const B = g.bebeManos;
  if (B) {
    if (P.health < B.vida || !P.alive) { g.bebeManos = null; g.landHit = 0; }
    else {
      B.t -= dt;
      if (B.t <= 0) {
        B.t = 0.4; B.n--;
        B.alTrago();
        g.audio.play('sorbo', { vol: 0.5 });
        const e = P.eye;
        for (let i = 0; i < 4; i++) g.particles.spawn(e.x + (Math.random() - 0.5) * 0.3, e.y - 0.35, e.z + (Math.random() - 0.5) * 0.3, [0.6, 0.78, 0.95], 0, 1.2, 0, 0.6, -2);
        if (B.n <= 0) { g.bebeManos = null; g.landHit = 0; g.achieve('bebe_manos', 'Agüita en las manos'); }
      }
    }
  }
  if (g.mode !== 'survival' || !P.alive) return;
  const calma = calmaActiva(g);
  // tripas que suenan con hambre
  g.tripasT = (g.tripasT ?? 25) - dt;
  if (P.food <= 6 && g.tripasT <= 0) {
    g.tripasT = 20 + Math.random() * 20;
    g.audio.play('rumble', { ui: true, vol: 0.18, pitch: 1.8 });
    consejoUnaVez(g, 'tripas', '🍽 Si le suenan las tripas, coma algo', 3600);
  }
  // con sed la mano tiembla y los párpados pesan
  if ((P.water ?? 20) < 6 && !calma && g.handLag) { g.handLag.x += (Math.random() - 0.5) * 0.01; g.handLag.y += (Math.random() - 0.5) * 0.01; }
  g.parpadoT = (g.parpadoT ?? 40) - dt;
  if ((P.water ?? 20) < 6 && g.parpadoT <= 0) { g.parpadoT = 40; if (!calma && g.ui.pestaneo) g.ui.pestaneo(); }
  // vaho con frío o sueño (una nubecita delante de la cara)
  const frio = g.cold || fx.escalofrio, sueno = fx.cansado;
  g.vahoT = (g.vahoT ?? 2.5) - dt;
  if ((frio || sueno) && g.vahoT <= 0 && !calma && !g.view) {
    g.vahoT = 2.5;
    const e = P.eye, d = P.lookDir();
    for (let i = 0; i < 3; i++) g.particles.spawn(e.x + d.x * 0.45, e.y - 0.12, e.z + d.z * 0.45, [0.92, 0.94, 0.98], d.x * 0.6, 0.25, d.z * 0.6, 0.9, -0.1);
  }
  // un bostezo escrito por cada bajón de sueño
  if (sueno && !g.bostezo) { g.bostezo = true; g.ui.toast('🥱 Qué sueño…', 1600); } else if (!sueno) g.bostezo = false;
}

// ---------- despertar con sobresalto ----------
// game.js la llama si a uno le pegan acostado o durmiendo: se levanta de un brinco y ese despertar no da buen descanso
export function despertarSusto(g) {
  if (!g.lying) return;
  if (g.sleeping) { g.sleeping = false; g.sobresalto = true; delete g.player.effects.descansado; }
  g.getUp();
  if (!calmaActiva(g)) { g.landHit = -0.35; setTimeout(() => { g.landHit = 0; }, 400); }
  g.ui.toast('😮 ¡Qué susto!', 1600);
}

// ---------- la cojera ----------
export function quedaCojera(g) {
  g.addEffect('cojera', 180);
  g.ui.toast('🦵 Se le arregló la pierna, pero cojea un rato: no corra todavía', 2600);
}
