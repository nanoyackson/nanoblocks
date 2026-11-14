// El clásico del domingo: los domingos en la tarde, cerca de un pueblo, se oye por la radio el partido (ficticio) entre el Deportivo
// Tiquicia y el Real Chayote. Noventa minutos en noventa segundos, con narración, goles («¡GOOOL!»), y la gente del pueblo que celebra
// o se lamenta según de cuál equipo sea (cada vecino tiene el suyo). Estado: g.clasico (no se guarda), meta.clasicoDia.
import { decir } from './misiones.js';

const EQ = ['Deportivo Tiquicia', 'Real Chayote'];
const NARRA = [
  'Toca para atrás… para atrás… ¡qué miedo jugar para adelante, señores!',
  'Tiro de esquina. Se acomodan todos en el área… y despejan.',
  '¡Uy! Pegó en el palo. ¡El palo, señoras y señores!',
  'Tarjeta amarilla. El árbitro no perdona hoy.',
  'Se tira, se tira… ¡y no le pitan nada! Que se levante.',
  'El portero sale jugando con los pies. Ay, Dios mío.',
  'Cambio en el {E}: sale el diez, entra el veinte.',
  'Llueve en el estadio y la bola no camina en el barro.',
  'Contragolpe del {E}… ¡se la quitan en el último momento!',
  'Se pierde el gol solito frente al marco. ¡Increíble!',
];
const FAN = ['¡Eso, eso, eso!', '¡GOOOOOL!', '¡Vamos, vamos, vamos!', '¡Qué golazo!'];
const TRISTE = ['Nooo…', '¡Ese árbitro está comprado!', 'Diay… así es el fútbol.', '¡Qué despiste de la defensa!'];
export const domingo = (g) => ((g.day || 1) % 7) === 0;
const vecinos = (g, r) => { const p = g.player.body.pos; return g.entities.mobs.filter((m) => m.type === 'vecino' && !m.dead && Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z) < r); };
// cada segundo
export function tickClasico(g) {
  const C = g.clasico;
  if (!C) {
    if (!g.meta || !domingo(g) || g.meta.clasicoDia === g.day || g.dim !== 'tierra') return;
    const t = g.time || 0;
    if (t < 0.26 || t > 0.36) return; // la tarde del domingo
    const p = g.player.body.pos, v = g.nearestVillage && g.nearestVillage(p.x, p.z);
    if (!v || v.dist > 60) return;
    g.meta.clasicoDia = g.day;
    // los goles del partido, de una vez (entre cero y cinco)
    const goles = [];
    for (let i = 0; i < 6; i++) if (Math.random() < 0.42) goles.push({ min: 3 + Math.floor(Math.random() * 87), eq: Math.random() < 0.5 ? 0 : 1 });
    goles.sort((a, b) => a.min - b.min);
    g.clasico = { min: 0, goles, mar: [0, 0] };
    g.ui.toast(`📻 ¡Arrancó el clásico! ${EQ[0]} contra ${EQ[1]}`, 4200, 'ambiente');
    return;
  }
  C.min++;
  const gol = C.goles.find((q) => q.min === C.min);
  if (gol) {
    C.mar[gol.eq]++;
    g.audio.play('gol', { ui: true, vol: 0.5 });
    g.ui.toast(`📻 ¡GOOOL del ${EQ[gol.eq]}! ${EQ[0]} ${C.mar[0]}, ${EQ[1]} ${C.mar[1]}`, 3600, { cat: 'ambiente', clave: 'clasico:gol' });
    for (const m of vecinos(g, 30)) { const suyo = (m.data.seed || 1) % 2 === gol.eq; if (Math.random() < 0.6) decir(g, m, suyo ? FAN[Math.floor(Math.random() * FAN.length)] : TRISTE[Math.floor(Math.random() * TRISTE.length)], 2.6); if (suyo && m.body.onGround) m.body.vel.y = 5; }
  } else if (C.min % 15 === 7 && Math.random() < 0.8) g.ui.toast(`📻 «${NARRA[Math.floor(Math.random() * NARRA.length)].replace('{E}', EQ[Math.floor(Math.random() * 2)])}»`, 3000, 'ambiente');
  if (C.min === 45) g.ui.toast(`📻 Medio tiempo: ${EQ[0]} ${C.mar[0]}, ${EQ[1]} ${C.mar[1]}`, 3000, 'ambiente');
  if (C.min >= 90) {
    const [a, b] = C.mar, txt = a === b ? `Empate a ${a}. Nadie queda contento` : `¡Ganó el ${EQ[a > b ? 0 : 1]}, ${Math.max(a, b)} a ${Math.min(a, b)}!`;
    g.ui.toast(`📻 Pitazo final: ${txt}`, 4200, 'importante');
    if (a !== b) for (const m of vecinos(g, 30)) if (Math.random() < 0.5) decir(g, m, (m.data.seed || 1) % 2 === (a > b ? 0 : 1) ? '¡Campeones, campeones!' : 'El otro domingo nos desquitamos.', 3);
    g.achieve('clasico', 'Oí el clásico entero por la radio');
    if (a + b >= 5) g.achieve('clasico_goleada', 'Un clásico de muchos goles');
    g.clasico = null;
  }
}
export const limpiarClasico = (g) => { g.clasico = null; };
export function pruebaClasico(g) {
  g.day = Math.ceil((g.day || 1) / 7) * 7; g.time = 0.28; g.meta.clasicoDia = 0;
  return 'Ya es domingo en la tarde: cerca de un pueblo arranca el clásico por la radio (90 segundos)';
}
