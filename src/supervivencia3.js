// Más supervivencia: heridas que sangran (hasta vendarse), el cansancio por no dormir y el botiquín de la farmacia.
import { difOf } from './supervivencia.js';
import { BLOCK_BY_KEY as K, SOLID } from './blocks.js';
import { fogataCerca } from './supervivencia2.js';
import { quedaCojera } from './cuerpo.js';

export const VENDA = 440, ALCOHOL = 441, SUERO = 442, BOTIQUIN = 443, TABLILLA = 508;
export const CURAS = { [VENDA]: 1, [ALCOHOL]: 1, [SUERO]: 1, [BOTIQUIN]: 1, [TABLILLA]: 1 };

// un golpe fuerte de una criatura puede dejarlo sangrando
export function quizaSangra(g, amount, deCriatura) {
  if (g.mode !== 'survival' || !deCriatura || amount < 4 || !g.player.alive) return;
  const prob = { tranquilo: 0.15, normal: 0.3, dificil: 0.5 }[(g.meta && g.meta.dificultad) || 'normal'] ?? 0.3;
  if (Math.random() > prob) return;
  if (!g.player.effects.sangrando) g.ui.toast('🩸 ¡Está sangrando! Una venda o el botiquín lo paran', 2600, 'urgente');
  g.addEffect('sangrando', 90);
}

export function usarCura(g, id) {
  const p = g.player, fx = p.effects;
  if (id === VENDA) {
    delete fx.sangrando; p.health = Math.min(p.maxHealth, p.health + (g.meta.cuaderno && g.meta.cuaderno.vendas ? 5 : 2));
    g.ui.toast('🩹 Vendado: ya no sangra', 1600);
  }
  if (id === TABLILLA) {
    const estaba = !!fx.quebrado;
    delete fx.quebrado;
    g.ui.toast('🦴 Entablillada. Ya se puede caminar', 2000);
    if (estaba && g.mode === 'survival') quedaCojera(g); // v12.2.0
  }
  if (id === ALCOHOL) {
    delete fx.sangrando;
    if (fx.garrapatas) { delete fx.garrapatas; g.ui.toast('🧴 Con el alcohol se soltaron las garrapatas', 2000); }
    if (fx.veneno) fx.veneno = Math.max(0, fx.veneno - 8);
    g.ui.toast('🧴 ¡Ardió! Pero la herida quedó limpia', 1800);
    g.ui.hurtFlash();
  }
  if (id === SUERO) {
    p.water = 20; delete fx.panza; delete fx.mareo; delete fx.fiebre;
    g.ui.toast('🥤 Suero oral: se le quitó la deshidratación y el malestar', 2000);
  }
  if (id === BOTIQUIN) {
    for (const k of ['sangrando', 'veneno', 'panza', 'mareo', 'escalofrio', 'fiebre', 'paralisis', 'garrapatas', 'torsalo', 'bala']) delete fx[k]; // v12.2.0: el hueso, solo con la tablilla
    delete g.meta.torsaloSale;
    p.health = Math.min(p.maxHealth, p.health + 10); p.water = Math.max(p.water ?? 20, 14);
    g.ui.toast(fx.quebrado ? '🧰 Botiquín: curado, pero la pierna quebrada pide una tablilla' : '🧰 Botiquín: curado de todo', 2400);
    g.achieve('botiquin', 'Primeros auxilios');
  }
  g.audio.play('dig.cloth', { ui: true, vol: 0.5, pitch: 1.2 });
}

// cada segundo: sangrado y cansancio
export function tickHeridas(g) {
  const p = g.player, fx = p.effects;
  if (g.mode !== 'survival' || !p.alive) return;
  if (fx.sangrando) {
    g.sangraT = (g.sangraT || 0) + 1;
    const b = p.body.pos;
    g.particles.burst(b.x, b.y + 0.6, b.z, [[0.7, 0.05, 0.05], [0.5, 0, 0]], 3, 0.6);
    if (g.sangraT >= 4) {
      g.sangraT = 0;
      if (difOf(g).starveKills || p.health > 2) g.damagePlayer(1, null, null, 'Se desangró', true);
    }
  }
  tickCansancio(g);
  tickGarrapatas(g);
  tickMojado(g);
}

// empapado: el agua y el aguacero sin techo mojan. Mojado gasta más comida y de noche da escalofríos; junto a la fogata se seca rápido
function tickMojado(g) {
  const p = g.player, fx = p.effects, b = p.body, q = b.pos, w = g.world;
  let techo = false;
  for (let y = Math.floor(q.y) + 2; y < Math.floor(q.y) + 25 && !techo; y++) techo = !!SOLID[w.getBlock(Math.floor(q.x), y, Math.floor(q.z))];
  const llueve = g.dim === 'tierra' && g.weather && g.weather.type !== 'clear' && g.weather.intensity > 0.35 && !g.dry && !g.cold;
  // v12.4.6 (C3): una gotera es un hueco en el techo: arriba no hay nada, pero las cuatro columnas de al lado sí tienen techo
  let gotera = false, yTecho = 0;
  if (llueve && !techo) {
    const cx = Math.floor(q.x), cz = Math.floor(q.z), y0 = Math.floor(q.y) + 2;
    const tapa = (x, z) => { for (let y = y0; y < y0 + 8; y++) if (SOLID[w.getBlock(x, y, z)]) return y; return 0; };
    const lados = [tapa(cx + 1, cz), tapa(cx - 1, cz), tapa(cx, cz + 1), tapa(cx, cz - 1)];
    gotera = lados.every((y) => y > 0);
    if (gotera) yTecho = Math.max(...lados);
  }
  const lluvia = llueve && !techo && !gotera;
  const antes = g.mojado || 0;
  let m = antes;
  if (b.inWater) m = 100;
  else if (lluvia && !(g.inventory.armor[1] && g.inventory.armor[1].id === 571)) m = Math.min(100, m + 7); // v12.3.0: con el capote de hule, no
  else if (gotera && !(g.inventory.armor[1] && g.inventory.armor[1].id === 571)) { // v12.4.9: el capote también tapa la gotera
    m = Math.min(100, m + 1);
    for (let i = 0; i < 3; i++) g.particles.spawn(Math.floor(q.x) + 0.5, yTecho - 0.1 - i * 0.6, Math.floor(q.z) + 0.5, [0.55, 0.7, 0.95], 0, -4, 0, 0.5, 0, false);
    if (!g.meta.goteraDicha) { g.meta.goteraDicha = true; g.ui.toast('💧 ¡Gotera! Hay un hueco en el techo', 2600); }
  }
  else if (m > 0) m = Math.max(0, m - (fogataCerca(g, q.x, q.y, q.z, 4) ? 12 : g.daylight > 0.6 && !techo ? 3 : 1.5));
  g.mojado = m;
  if (m >= 50) {
    g.addEffect('empapado', 3);
    if (fx.termal || fx.ignifugo) return;
    const noche = g.daylight < 0.35;
    p.hungerT += noche ? 0.6 : 0.2;
    if (noche && m >= 80) g.addEffect('escalofrio', 3);
    if (antes < 50 && !g.meta.empapadoDicho) { g.meta.empapadoDicho = true; g.ui.toast('🌧 Ropa empapada: gasta más comida y da frío. Séquese junto a una fogata', 4200); }
  } else if (antes >= 50 && fx.empapado) delete fx.empapado;
}

// las garrapatas: se pegan al caminar por el zacate alto de los potreros y el bosque seco. Pican poquito y dan hambre hasta que uno se
// las quita (alcohol, el botiquín, un buen rato en el río o dormir en una Casa de leyenda)
function tickGarrapatas(g) {
  const p = g.player, fx = p.effects, b = p.body;
  if (b.inWater && fx.enlodado) delete fx.enlodado; // el agua quita el lodo
  if (fx.garrapatas) {
    if (b.inWater) { g.banoT = (g.banoT || 0) + 1; if (g.banoT >= 6) { delete fx.garrapatas; g.banoT = 0; g.ui.toast('🌊 El agua le quitó las garrapatas', 2000); return; } } else g.banoT = 0;
    fx.garrapatas = Math.max(fx.garrapatas, 5); // no se van solas
    g.garraT = (g.garraT || 0) + 1;
    if (g.garraT >= 25) { g.garraT = 0; p.food = Math.max(0, p.food - 1); if (p.health > 4) g.damagePlayer(0.5, null, null, 'Las garrapatas', true, false); }
    return;
  }
  const bio = g.env && g.env.biome;
  if (!['plains', 'bosque_seco'].includes(bio) || Math.hypot(b.vel.x, b.vel.z) < 1) return;
  const w = g.world, x = Math.floor(b.pos.x), y = Math.floor(b.pos.y), z = Math.floor(b.pos.z);
  if (w.getBlock(x, y, z) !== K.tall_grass) return;
  if (Math.random() < 0.02) { g.addEffect('garrapatas', 5); g.ui.toast('🕷 ¡Se le pegaron garrapatas del zacate! Alcohol, el botiquín o un buen baño en el río', 3200); g.achieve('garrapatas', 'Garrapatas de potrero'); }
}

// el cansancio: cada día que pasa sin dormir en cama suma una noche en vela
function tickCansancio(g) {
  const M = g.meta, fx = g.player.effects;
  if (M.diaVisto === undefined) M.diaVisto = g.day || 1;
  if ((g.day || 1) !== M.diaVisto) {
    M.diaVisto = g.day || 1;
    M.sinDormir = M.durmio ? 0 : (M.sinDormir || 0) + 1;
    M.durmio = false;
    if (M.sinDormir === 2) g.ui.toast('🥱 Dos noches sin dormir: más lento y ve borroso. Cama o café', 4200);
  }
  const n = M.sinDormir || 0;
  const cafe = fx.energia;
  if (n >= 2 && !cafe) g.addEffect('cansado', 3);
  g.cansaBlur = n >= 2 && !cafe ? Math.min(1.4, (n - 1) * 0.45) : 0;
  // con 3 o más noches en vela, se le cierran los ojos de vez en cuando
  if (n >= 3 && !cafe && Math.random() < 0.025 * (n - 2)) g.ui.pestaneo();
}
export function durmio(g) { g.meta.durmio = true; g.meta.sinDormir = 0; g.cansaBlur = 0; delete g.player.effects.cansado; }
export function siestita(g) { g.meta.sinDormir = Math.max(0, (g.meta.sinDormir || 0) - 1); }
