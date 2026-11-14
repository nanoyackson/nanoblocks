// Elecciones municipales (todo ficticio): cada 20 días hay 4 días de campaña con caravanas de pitos y banderas
// dando vueltas a la plaza, candidatos que reparten tamales y promesas, y el día de elecciones uno vota con clic
// derecho. En la noche salen los resultados (con su abstencionismo) y las promesas… siguen «en estudio».
import * as THREE from 'three';
import { flat } from './fauna.js';
import { decir } from './misiones.js';

const CICLO = 20, TAMAL = 353;
export const PARTIDOS = [
  {
    sigla: 'PUVU', nombre: 'Partido Unión de Vecinos Unidos', color: 0xd83030, rgb: [0.85, 0.2, 0.2], candidato: 'Don Prometeo Solís', lema: '¡Unidos por la unión!',
    promesas: ['Si gano, el bus pasa cada cinco minutos… y con aire acondicionado.', 'Voy a tapar TODOS los huecos. Bueno, los de la calle principal. Bueno, uno.', '¡Wifi gratis en la plaza, en la iglesia y en el potrero!', 'Un puente nuevo sobre el río. Ya tengo la maqueta.'],
  },
  {
    sigla: 'PPV', nombre: 'Partido del Progreso que Viene', color: 0x2a6ad8, rgb: [0.2, 0.45, 0.9], candidato: 'Doña Fidelia Cascante', lema: '¡El progreso viene! (algún día)',
    promesas: ['Un estadio nuevo con techo, gradería y parqueo. Para el 2090.', 'Cero presas: vamos a mover la hora pico para las tres de la mañana.', 'Alumbrado en todas las calles. Con bombillos de los buenos.', 'El tren va a llegar hasta aquí. Ya pedimos el estudio del estudio.'],
  },
  {
    sigla: 'MBC', nombre: 'Movimiento Bache Cero', color: 0x2aa84a, rgb: [0.2, 0.7, 0.3], candidato: 'Lic. Asfaltino Rojas', lema: '¡Cero baches, cero excusas!',
    promesas: ['Bachearemos los baches de los baches.', 'Una rotonda en cada esquina. ¡Rotondas para todos!', 'La calle nueva se abre una sola vez. Palabra.', 'Ciclovía de aquí a la capital. Con sombrita.'],
  },
];
const EN_ESTUDIO = [
  (p, pr) => `📰 La promesa del ${p.sigla} («${pr}») sigue «en estudio»`,
  (p, pr) => `📰 Se formó una comisión para analizar la promesa del ${p.sigla}: «${pr}»`,
  (p) => `📰 La municipalidad anunció que la promesa del ${p.sigla} «va muy avanzada» (no hay nada)`,
];

export const enCampana = (g) => ((g.day || 1) % CICLO) >= 16;
export const diaElecciones = (g) => (g.day || 1) >= CICLO && (g.day || 1) % CICLO === 0;
const ciclo = (g) => Math.ceil((g.day || 1) / CICLO);

function bandera(m, color) {
  const u = m.group.userData;
  if (!u.npcArms || u.bandera) return;
  const asta = flat(0x6a4a2a, 0.04, 1.1, 0.04, 0, -0.2, 0.12);
  const tela = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.32, 0.5), new THREE.MeshBasicMaterial({ color }));
  tela.position.set(0, 0.36, -0.26);
  asta.add(tela);
  u.npcArms[1].add(asta);
  u.bandera = asta;
}

export function tickElecciones(g, dt) {
  if (g.dim !== 'tierra') return;
  g.elecT = (g.elecT || 0) - dt;
  if (g.elecT > 0) return;
  g.elecT = 1;
  const M = g.meta, E = (M.elecciones ||= {});
  const camp = enCampana(g), hoy = diaElecciones(g), dia = g.daylight > 0.4;
  if (camp && dia && E.avisoCamp !== ciclo(g)) { E.avisoCamp = ciclo(g); g.ui.toast('🗳 ¡Arrancó la campaña municipal! Caravanas, pitos, banderas y promesas en los pueblos', 3600); }
  if (hoy && dia && E.avisoHoy !== g.day) { E.avisoHoy = g.day; g.ui.toast('🗳 ¡Elecciones municipales! Vaya al pueblo y vote (clic derecho a un candidato)', 4000); }
  // resultados en la noche del día de elecciones
  if (hoy && g.daylight < 0.3 && E.resultado !== ciclo(g)) resultados(g, E);
  // promesas incumplidas
  const A = M.alcalde;
  if (A && A.avisos < 3 && g.day > A.dia && (g.day - A.dia) % 4 === 0 && A.ultimo !== g.day && dia) {
    A.ultimo = g.day;
    const p = PARTIDOS[A.partido];
    g.ui.toast(EN_ESTUDIO[A.avisos](p, A.promesa), 4200);
    A.avisos++;
    if (A.avisos === 3) g.achieve('promesas', 'Promesas de campaña');
  }
  // caravanas en el pueblo
  const pl = g.player.body.pos, near = g.nearestVillage(pl.x, pl.z);
  const activos = g.entities.mobs.filter((m) => m.data && m.data.caravana != null && !m.dead);
  const toca = (camp || hoy) && dia && near && near.dist < 70;
  if (!toca) {
    for (const m of activos) { if (Math.hypot(m.body.pos.x - pl.x, m.body.pos.z - pl.z) > 25) m.dead = true; else if (!m.data.irse) { m.data.ruta = null; m.data.irse = 5; } }
    return;
  }
  const c = near.v, cy = c.y || pl.y;
  PARTIDOS.forEach((P, i) => {
    const suyos = activos.filter((m) => m.data.caravana === i);
    if (suyos.length >= 3) return;
    const lider = !suyos.some((m) => m.data.candidato != null);
    const a = (i / 3) * Math.PI * 2 + suyos.length * 0.35;
    const r = 8 + i * 2.5;
    const m = g.entities.spawnMob('vecino', c.x + Math.cos(a) * r, cy + 1, c.z + Math.sin(a) * r);
    const here = { x: Math.floor(m.body.pos.x), y: Math.floor(cy), z: Math.floor(m.body.pos.z) };
    const nombre = lider ? `${P.candidato} (${P.sigla})` : `Seguidor del ${P.sigla}`;
    Object.assign(m.data, { home: here, plaza: { ...here }, name: nombre, role: 'vecino', vid: `campana:${i}:${Math.random()}`, seed: 1 + Math.floor(Math.random() * 1e6) });
    m.data.caravana = i;
    m.data.ruta = { cx: c.x, cz: c.z, r, a };
    if (lider) m.data.candidato = i;
    if (m.kind.dress) m.kind.dress(m);
  });
  for (const m of activos) {
    if (m.group.userData.pending) { if (m.kind.dress) m.kind.dress(m); continue; }
    const P = PARTIDOS[m.data.caravana];
    bandera(m, P.color);
    const d = Math.hypot(m.body.pos.x - pl.x, m.body.pos.z - pl.z);
    // pitos y papelitos de colores
    if (m.data.candidato == null && Math.random() < 0.18 && d < 40) {
      g.audio.play('pito', { pos: m.soundPos(), vol: 0.45, pitch: 0.9 + Math.random() * 0.3 });
      for (let k = 0; k < 8; k++) g.particles.spawn(m.body.pos.x, m.body.pos.y + 2.2, m.body.pos.z, k % 2 ? P.rgb : [1, 1, 1], (Math.random() - 0.5) * 2, 1.5, (Math.random() - 0.5) * 2, 1.6, 2, false);
    }
    // el candidato grita promesas
    if (m.data.candidato != null && d < 18) {
      m.data.gritoT = (m.data.gritoT ?? Math.random() * 4) - 1;
      if (m.data.gritoT <= 0) {
        m.data.gritoT = 9 + Math.random() * 8;
        decir(g, m, Math.random() < 0.3 ? P.lema : P.promesas[Math.floor(Math.random() * P.promesas.length)], 4);
      }
    }
  }
  if (near.dist < 40) g.achieve('caravana', 'Pito, bandera y caravana');
}

function resultados(g, E) {
  E.resultado = ciclo(g);
  const votoJ = E.voto && E.voto.ciclo === ciclo(g) ? E.voto.partido : null;
  const pesos = PARTIDOS.map((_, i) => 0.6 + Math.random() + (i === votoJ ? 0.15 : 0));
  const tot = pesos.reduce((a, b) => a + b, 0);
  const pct = pesos.map((w) => Math.round((w / tot) * 100));
  const gana = pct.indexOf(Math.max(...pct));
  const abst = 55 + Math.floor(Math.random() * 16);
  const P = PARTIDOS[gana];
  const promesa = P.promesas[Math.floor(Math.random() * P.promesas.length)];
  g.meta.alcalde = { partido: gana, promesa, dia: g.day, avisos: 0 };
  g.ui.toast(`🗳 Resultados: ganó ${P.candidato} (${P.sigla}) con ${pct[gana]} %. ${PARTIDOS.map((p, i) => `${p.sigla} ${pct[i]} %`).join(' · ')}. Abstencionismo: ${abst} %`, 6500);
  if (votoJ === gana) g.achieve('voto_ganador', 'Voté por el que ganó');
}

// clic derecho a alguien de la caravana
export function eleccionInteract(m, g) {
  const i = m.data.caravana;
  if (i == null) return false;
  const P = PARTIDOS[i], E = (g.meta.elecciones ||= {});
  if (m.data.candidato == null) { decir(g, m, `¡Vote ${P.sigla}! ${P.lema}`, 3); return true; }
  if (diaElecciones(g)) {
    if (E.voto && E.voto.ciclo === ciclo(g)) { decir(g, m, 'Usted ya votó, mi estimado. ¡Una sola vez por cabeza!', 3); return true; }
    E.voto = { ciclo: ciclo(g), partido: i };
    decir(g, m, '¡Gracias por su voto! No se va a arrepentir… creo.', 3.5);
    g.ui.toast(`🗳 Votó por ${P.candidato} (${P.sigla}). Le quedó el dedo morado de tinta 🟣`, 3200);
    g.achieve('votar', 'Ejercí mi derecho al voto');
    return true;
  }
  // en campaña: tamal y promesa (uno por candidato por día)
  const k = `${i}:${g.day}`;
  if ((E.tamales ||= []).includes(k)) { decir(g, m, 'Ya le di su tamalito hoy. ¡No sea abusado!', 3); return true; }
  E.tamales.push(k);
  if (E.tamales.length > 12) E.tamales.shift();
  g.giveItem(TAMAL, 1);
  decir(g, m, `¡Tome un tamalito! Y acuérdese: ${P.promesas[Math.floor(Math.random() * P.promesas.length)]}`, 4.5);
  g.achieve('tamal_campana', 'El tamal de campaña');
  return true;
}
