// El influencer extranjero (ficticio): de día, en los pueblos y las playas, a veces aparece un turista con su palo de
// selfie que lo sigue a uno grabando («¡Hola, mis amigos! Aquí con un local auténtico»). Si mientras graba uno hace
// algo espectacular (matar un bicho, pescar, volar en parapente, surfear una ola, despegar en avioneta…), el video
// suma vistas; al llegar a 100 mil se hace viral y le paga a uno «por la colaboración».
import * as THREE from 'three';
import { decir } from './misiones.js';

const NOMBRES = ['Brayden (@puravibesonly)', 'Skyler (@wanderlust.forever)', 'Chad (@slothhunter)'];
const FRASES = [
  '¡Hola, mis amigos! Aquí con un local auténtico. ¡Pura vida!', '¡Esto es contenido, bro! No pare.', 'Guys, guys, GUYS, ¿vieron eso?',
  '¿Cómo se dice «like and subscribe» en tico?', 'Esto va directo a mi vlog de «hidden gems».', 'Me hice un tatuaje que dice «pura vida»… creo.',
  'Bro, ¿esto es orgánico? Todo aquí es tan orgánico.', '¡Dele otra vez que no grabé!',
];
const META = 100000;

function palo(m) {
  const u = m.group.userData;
  if (!u.npcArms || u.selfie) return;
  const g = new THREE.Group();
  const vara = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.9), new THREE.MeshBasicMaterial({ color: 0x2a2a2e }));
  vara.position.z = 0.45;
  const cel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.26, 0.03), new THREE.MeshBasicMaterial({ color: 0x111114 }));
  cel.position.set(0, 0.06, 0.9);
  const luz = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.02), new THREE.MeshBasicMaterial({ color: 0xff3030 }));
  luz.position.set(0.04, 0.16, 0.92);
  g.add(vara, cel, luz);
  g.position.set(0, -0.55, 0.05);
  g.rotation.x = -1.1;
  u.npcArms[1].add(g);
  u.selfie = g; u.selfieLuz = luz;
  // pinta de turista: camisa hawaiana encima del torso y lentes oscuros
  const torso = u.body && u.body.children[0];
  if (torso && torso.geometry && torso.geometry.parameters) {
    const { width: w, height: h, depth: d } = torso.geometry.parameters;
    const cv = document.createElement('canvas'); cv.width = 16; cv.height = 16;
    const c = cv.getContext('2d');
    c.fillStyle = '#ff7a2a'; c.fillRect(0, 0, 16, 16);
    for (const [x, y, col] of [[2, 2, '#ffe14a'], [10, 4, '#2ad8c8'], [5, 9, '#ff3a8a'], [12, 12, '#ffe14a'], [1, 13, '#2ad8c8'], [8, 1, '#ff3a8a']]) { c.fillStyle = col; c.fillRect(x, y, 3, 3); c.fillStyle = '#2a8a3a'; c.fillRect(x + 3, y + 1, 1, 2); }
    const tex = new THREE.CanvasTexture(cv); tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
    const camisa = new THREE.Mesh(new THREE.BoxGeometry(w * 1.06, h * 0.82, d * 1.08), new THREE.MeshBasicMaterial({ map: tex }));
    camisa.position.copy(torso.position); camisa.position.y += h * 0.08;
    u.body.add(camisa);
  }
  if (u.head) {
    const lentes = new THREE.Group();
    const negro = new THREE.MeshBasicMaterial({ color: 0x0a0a0c });
    for (const sx of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.02), negro); l.position.set(sx * 0.11, 0.27, 0.235); lentes.add(l); }
    const puente = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.02), negro); puente.position.set(0, 0.29, 0.235); lentes.add(puente);
    u.head.add(lentes);
  }
}

export function tickInfluencer(g, dt) {
  if (g.dim !== 'tierra') return;
  g.inflT = (g.inflT || 0) - dt;
  const I = g.influencer;
  if (I) {
    const m = I.m;
    if (m.dead || !g.entities.mobs.includes(m)) { g.influencer = null; pintar(g); return; }
    if (m.group.userData.pending && m.kind.dress) m.kind.dress(m);
    palo(m);
    // la lucecita roja de «grabando» parpadea
    if (m.group.userData.selfieLuz) m.group.userData.selfieLuz.visible = ((g.clock || 0) % 1) < 0.6;
    I.t += dt;
    I.fraseT -= dt;
    const d = Math.hypot(m.body.pos.x - g.player.body.pos.x, m.body.pos.z - g.player.body.pos.z);
    if (I.fraseT <= 0 && d < 12) { I.fraseT = 9 + Math.random() * 8; decir(g, m, FRASES[Math.floor(Math.random() * FRASES.length)], 4); }
    // se va a los 4 minutos (o si uno lo deja botado)
    if (I.t > 240 || d > 60) { m.data.sigue = false; m.data.irse = 4; m.data.influencer = false; g.influencer = null; g.ui.toast('🤳 El influencer se fue a grabar un «sunset» a otra playa', 2200); pintar(g); return; }
    m.data.sigue = d > 4;
    if (!m.data.sigue) { m.targetYaw = Math.atan2(g.player.body.pos.x - m.body.pos.x, g.player.body.pos.z - m.body.pos.z); m.moving = false; }
    return;
  }
  // ¿aparece uno? (de día, en pueblo o playa, uno por día como mucho)
  if (g.inflT > 0) return;
  g.inflT = 20;
  if (g.daylight < 0.5 || g.meta.inflDia === g.day || Math.random() > 0.12) return;
  const p = g.player.body.pos, v = g.nearestVillage(p.x, p.z), bio = g.env && g.env.biome;
  if (!((v && v.dist < 60) || bio === 'beach')) return;
  g.meta.inflDia = g.day;
  const a = Math.random() * Math.PI * 2;
  const m = g.entities.spawnMob('vecino', p.x + Math.cos(a) * 9, p.y + 1, p.z + Math.sin(a) * 9);
  const here = { x: Math.floor(m.body.pos.x), y: Math.floor(p.y), z: Math.floor(m.body.pos.z) };
  const nombre = NOMBRES[Math.floor(Math.random() * NOMBRES.length)];
  Object.assign(m.data, { home: here, plaza: { ...here }, name: nombre, role: 'vecino', vid: `influ:${Math.random()}`, seed: 4242 + Math.floor(Math.random() * 50), influencer: true, sigue: true });
  if (m.kind.dress) m.kind.dress(m);
  g.influencer = { m, t: 0, fraseT: 1, vistas: 0, viral: false };
  g.ui.toast(`🤳 ¡Un influencer lo está grabando! (${nombre}). Haga algo espectacular y se hace viral`, 3600);
  g.achieve('influencer', 'Salí en un vlog');
  pintar(g);
}

// las cosas espectaculares que suman vistas (las llaman las otras partes del juego)
export function influencerEvento(g, que, base = 1000) {
  const I = g.influencer;
  if (!I) return;
  const d = Math.hypot(I.m.body.pos.x - g.player.body.pos.x, I.m.body.pos.z - g.player.body.pos.z);
  if (d > 40) return;
  const vistas = Math.round(base * (0.6 + Math.random() * 1.2));
  I.vistas += vistas;
  decir(g, I.m, ['¡NOOO, BRO! ¿Vieron eso?', '¡Esto se va a hacer viral!', '¡Contenido, contenido, CONTENIDO!', '¡Dele like si quiere más!'][Math.floor(Math.random() * 4)], 2.5);
  g.ui.toast(`📱 +${vistas.toLocaleString('es-CR')} vistas (${que})`, 1400);
  pintar(g);
  if (!I.viral && I.vistas >= META) {
    I.viral = true;
    g.giveItem(360, 25);
    g.audio.play('aplausos', { ui: true, vol: 0.5 });
    g.ui.toast('🔥 ¡Viral! El influencer le paga ₡25 «por la colaboración»', 4200);
    g.achieve('viral', 'Me hice viral');
    g.meta.reputation = (g.meta.reputation || 0) + 2;
  }
}

function pintar(g) {
  const I = g.influencer;
  let el = document.getElementById('vistas');
  if (!I) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'vistas'; document.getElementById('hud').appendChild(el); }
  el.innerHTML = `<span class="rec">● REC</span> ${I.vistas.toLocaleString('es-CR')} vistas${I.viral ? ' 🔥' : ` <small>/ ${META.toLocaleString('es-CR')}</small>`}`;
  el.classList.remove('sube'); void el.offsetWidth; el.classList.add('sube');
}
export function limpiarInfluencer(g) { g.influencer = null; pintar(g); }
