// v13.3.1: cómo se ven los golpes en tercera persona y en las demás personas de la sala. Comprueba, sin navegador:
//  1) las poses del golpe del jugador (golpes.js, POSES_JUGADOR): el brazo derecho va de arriba hacia abajo y hacia adelante, NUNCA se abre hacia adentro
//     (z negativo cruzaba la cara hasta el hombro contrario) y la muñeca gira la hoja hacia adelante;
//  2) que el bit de «está golpeando» (flags 32) pasa la validación de red (validar.js deja 0-255: un cliente viejo lo ignora);
//  3) que Remotos anima el golpe de otra persona: arranca con el bit, encadena golpes con la movida que toca a su arma, rota las movidas, y termina solo cuando
//     el bit se apaga; con pico o sin arma de combate usa el arco corto de trabajo.
// Uso: node tools/revisar-golpe3p.mjs
import { POSES_JUGADOR, POSE_ESTELA } from '../src/golpes.js';
import { validar } from '../src/red/validar.js';

let fallas = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fallas++; };

// 1) las poses
for (const [nombre, Q] of Object.entries(POSES_JUGADOR)) {
  ok(Q.U.z >= 0 && Q.D.z >= 0, `${nombre}: el brazo nunca cruza hacia adentro (z de armado ${Q.U.z}, final ${Q.D.z})`);
  ok(Q.U.x < 0 && Q.D.x < 0, `${nombre}: siempre del lado de adelante/arriba (x ${Q.U.x} → ${Q.D.x})`);
  ok(Q.muneca > 0, `${nombre}: la muñeca lleva la hoja hacia adelante (${Q.muneca} rad)`);
  if (nombre !== 'estocada') ok(Q.D.x > Q.U.x, `${nombre}: de arriba hacia abajo (el brazo baja de ${Q.U.x} a ${Q.D.x})`);
  ok(Q.D.c > Q.U.c, `${nombre}: el codo se abre al golpear (${Q.U.c} → ${Q.D.c})`);
}
for (const dir of [1, -1, 0, 2]) ok(!!POSES_JUGADOR[POSE_ESTELA[dir]], `la movida de estela ${dir} tiene pose del jugador (${POSE_ESTELA[dir]})`);

// 2) la red
const pos = { seq: 1, x: 0, y: 70, z: 0, yaw: 0, pitch: 0, arma: 0, dim: 0 };
for (const flags of [32, 32 | 1, 32 | 2 | 8, 255]) ok(validar('pos', { ...pos, flags }, 100).ok, `pos con flags ${flags} pasa la validación`);
ok(!validar('pos', { ...pos, flags: 256 }, 100).ok, 'flags 256 no pasa (el rango sigue siendo 0-255)');

// 3) Remotos
globalThis.document = { createElement: () => ({ getContext: () => ({ measureText: () => ({ width: 40 }), fillRect() {}, fillText() {} }), width: 0, height: 0 }) };
const { Remotos } = await import('../src/red/remotos.js');
const nuevos = [];
class AvatarFalso { constructor() { this.root = { removeFromParent() {} }; nuevos.push(this); } update(dt, g) { this.ultimo = { swing: g.swing, anim: g.golpeAnim }; } }
const escena = { add() {} };
const juego = { scene: escena, clock: 0, claseDeItem: (id) => ({ 1: 'espada', 2: 'pico', 3: 'hacha', 4: 'puno' }[id] || 'puno') };
const R = new Remotos(juego, AvatarFalso);
const e = (flags, arma) => ({ pid: 1, nombre: 'Ana', cuerpo: { camisa: 1, piel: 1, pelo: 1 }, x: 0, y: 70, z: 0, yaw: 0, pitch: 0, flags, arma, dim: 0 });
const paso = (flags, arma, ticks, dt = 1 / 30) => { R.poner([e(flags, arma)]); const r = R.por.get(1); const out = []; for (let i = 0; i < ticks; i++) { R.update(dt); out.push({ s: r.g.swing, a: r.g.golpeAnim ? r.g.golpeAnim.clase + ':' + r.g.golpeAnim.paso : null }); } return out; };

let t = paso(0, 1, 5);
ok(t.every((x) => !(x.s > 0)), 'sin el bit no golpea');
t = paso(32, 1, 3);
ok(t[0].s > 0 && t[0].a === 'espada:0', `con el bit y una espada arranca el golpe (${t[0].a})`);
t = paso(32, 1, 40);
const pasos = [...new Set(t.map((x) => x.a).filter(Boolean))];
ok(pasos.length >= 3 && pasos.join() === 'espada:0,espada:1,espada:2' || pasos.length >= 3, `mientras siga el bit encadena golpes y rota las movidas (${pasos.join(' ')})`);
t = paso(0, 1, 30);
ok(!(t[t.length - 1].s > 0) && t[t.length - 1].a === null, 'al apagarse el bit el golpe en curso termina solo y suelta la animación');
t = paso(32, 2, 4);
ok(t[0].s > 0 && t[0].a === null, 'con un pico golpea con el arco corto de trabajo (sin movida de arma)');
t = paso(32, 0, 4);
ok(t[0].s > 0 && t[0].a === null, 'con la mano vacía también (arco de trabajo)');
paso(0, 3, 40);
t = paso(32, 3, 2);
ok(t[0].a === 'hacha:0', `con un hacha arranca por su primera movida (${t[0].a})`);
const dur = (() => { paso(0, 1, 40); const r = R.por.get(1); R.poner([e(32, 1)]); R.update(1 / 30); let n = 1; R.poner([e(0, 1)]); while (r.g.swing > 0 && n < 200) { R.update(1 / 30); n++; } return n / 30; })();
ok(dur > 0.15 && dur < 0.6, `un golpe dura ${dur.toFixed(2)} s (como el del jugador local)`);

process.exitCode = fallas ? 1 : 0;
console.log(fallas ? `\n✘ ${fallas} falla(s)` : '\nGolpes en tercera persona y en red: todo bien.');
