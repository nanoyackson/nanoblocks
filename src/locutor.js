// El locutor (v11.9): por aquí pasan todos los textos pasajeros del juego (avisos, consejos, comentarios, logros). Antes salía un
// texto tras otro y no daba tiempo de leer: ahora sale uno a la vez, por orden de importancia y al ritmo de la lectura.
//
// Categorías, de más a menos importante:
//   urgente    peligro inmediato (vida, tsunami, incendio, se rompió la herramienta): interrumpe y pasa adelante
//   importante misión, logro, jefe, capítulo, plata: espera su turno
//   consejo    tutoriales y pistas: espera, nunca sale en combate y se guarda hasta que haya ~8 s de calma
//   ambiente   radio, chismes, comentarios del pueblo: se bota si hay fila o si salió otro hace menos de 45 s
//   registro   «Volando», «Guardado»: va al rincón de lo recogido, compacto, sin hacer fila
// Nada se pierde: lo dicho y lo botado queda en el historial («Lo que se dijo», en la libreta).
import { calmaActiva } from './calma.js';

export const CATEGORIAS = ['urgente', 'importante', 'consejo', 'ambiente', 'registro'];
const PRIO = { urgente: 0, importante: 1, consejo: 2, ambiente: 3, registro: 4 };
const COLA_MAX = 4, PAUSA = 600, DUP_MS = 20000, AMBIENTE_MS = 45000, CALMA_MS = 8000, POR_MINUTO = 6, HIST_MAX = 60;

// los avisos viejos llegan sin categoría: se adivina por lo que dicen
// conservador: lo urgente de verdad lo marca quien lo dice ({ cat: 'urgente' }); esto es solo para los avisos viejos.
// (v11.10.1: «\bYA\b» con la i casaba con cualquier «ya», 🔥 y 🌊 solos marcaban urgente un fuego rico o una ola bonita, y
// «lava» casaba con «lavanderas»: 73 de 126 urgentes no lo eran)
const URGENTE = /tsunami|se quema una casa|¡corra|suba a lo alto|súbase a lo alto|\bYA\b|se rompió la herramienta|no se pudo guardar|lo dejaron sangrando|¡está sangrando|¡cuidado|¡auxilio|se le viene(n)? encima|van a la casa|se llevan una|se está ahogando|se ahoga|sin aire|¡resaca/;
const PRIMER = /^\s*(⚠|🆘|🚨)/u;
const AMBIENTE = /^\s*(📻|🎵|🎶|🗣|💬|🐦|🦜|🐠|🦋|🐒|🌺|🦩)|se oye|se escucha|dicen que|cuentan que|comenta|murmura/iu;
const CONSEJO = /clic derecho|clic izquierdo|mayús|shift|\bctrl\b|tecla|\(tecla|mantenga|con .{1,30} en la mano|póngase|haga una|use |busque|vaya a|recuerde|para (curarse|abrir|subir|bajar)|cómo|se hace con|se fabrica|en la libreta|en el mapa \(m\)|brújula/i;

export function clasificar(text) {
  const t = String(text || '');
  if (PRIMER.test(t) || URGENTE.test(t)) return 'urgente';
  if (AMBIENTE.test(t)) return 'ambiente';
  if (t.length <= 22 && !/!/.test(t)) return 'registro';
  if (CONSEJO.test(t)) return 'consejo';
  return 'importante';
}

// cuánto se queda en pantalla: lo que tarda en leerse (mín. 2.5 s, ~55 ms por letra, tope 9 s) por la velocidad elegida
export function duracion(text, velocidad = 'normal') {
  const k = velocidad === 'tranquila' ? 1.4 : velocidad === 'rapida' ? 0.75 : 1;
  return Math.min(9000, 2500 + String(text).length * 55) * k;
}

export class Locutor {
  constructor(ui) {
    Object.assign(this, { ui, cola: [], espera: [], diferidos: [], reloj: 0, ultTick: 0, actual: null, libreHasta: 0, hist: [], dichos: new Map(), ventana: [], ultAmbiente: -1e9, vistos: new Set(), calmaDesde: 0 });
    this.timer = setInterval(() => this.tick(), 100);
  }
  get g() { return this.ui.game; }
  get ajustes() { const s = (this.g && this.g.settings) || {}; return { modo: s.avisos || 'normal', vel: s.lectura || 'normal' }; }

  // ¿anda peleando? (un bravo cerca o le pegaron hace poco)
  enCombate() {
    const g = this.g;
    if (!g || !g.player || !g.entities) return false;
    const reloj = g.clock || 0;
    if (reloj - (g.danoT ?? -99) < 4) return true;
    const p = g.player.body.pos;
    // un bravo atacando a 12 bloques, uno a 6, o uno al que se le pegó hace poco: no basta con que haya uno dormido por ahí
    return g.entities.mobs.some((m) => {
      if (m.dead || m.dying || m.tamed || !(m.kind.hostile || m.kind.boss || m.data.provoked)) return false;
      const d = Math.hypot(m.body.pos.x - p.x, m.body.pos.z - p.z);
      return d < 6 || (d < 12 && (m.atk || reloj - (m.data.golpeT ?? -99) < 8));
    });
  }

  // la entrada de todo: decir(texto, { cat, clave, logro: { icono, n } })
  decir(text, o = {}) {
    if (!text) return;
    const ahora = performance.now(), cat = o.cat || clasificar(text), clave = o.clave || text, { modo } = this.ajustes;
    const e = { text, cat, clave, n: 1, logro: o.logro || null, render: o.render || null, t: ahora };
    // con el inventario (o un cofre, la mesa…) abierto, lo que no es urgente sale ahí mismo, en una línea del panel, sin hacer fila
    if (this.ui.state === 'inventory' && cat !== 'urgente' && !o.render && this.ui.avisoPanel) { this.anotar(e, 'dicho'); this.ui.avisoPanel(e.logro ? text : text); return; }
    if (cat === 'registro') { this.anotar(e, 'dicho'); this.ui.registroTexto(text); return; }
    if (modo === 'pocos' && cat === 'ambiente') { this.anotar(e, 'botado'); return; }
    if (modo === 'pocos' && cat === 'consejo' && this.vistos.has(clave)) { this.anotar(e, 'botado'); return; }
    // repetidos: se funden en vez de repetirse
    if (this.actual && this.actual.clave === clave) { this.actual.n++; this.pintar(this.actual); this.actual.hasta = Math.max(this.actual.hasta, ahora + 1500); this.anotar(e, 'repetido'); return; }
    const enCola = this.cola.find((q) => q.clave === clave) || this.espera.find((q) => q.clave === clave) || this.diferidos.find((q) => q.clave === clave); // v12.5.1: también en los diferidos
    if (enCola) { enCola.n++; this.anotar(e, 'repetido'); return; }
    if (cat !== 'urgente' && ahora - (this.dichos.get(clave) || -1e9) < DUP_MS) { this.anotar(e, 'repetido'); return; }
    if (cat === 'ambiente') {
      if (this.cola.length || (this.actual && this.actual.cat !== 'ambiente') || (modo !== 'todos' && ahora - this.ultAmbiente < AMBIENTE_MS) || this.enCombate()) { this.anotar(e, 'botado'); return; }
    }
    if (cat === 'consejo') { this.espera.push(e); if (this.espera.length > 6) this.anotar(this.espera.shift(), 'botado'); return; }
    if (cat === 'urgente') {
      // interrumpe: lo que estaba vuelve a la fila si era importante
      if (this.actual && this.actual.cat !== 'urgente') { const a = this.actual; this.quitar(); if (a.cat === 'importante') this.cola.unshift(a); }
      this.cola.unshift(e);
    } else this.cola.push(e);
    this.cola.sort((a, b) => PRIO[a.cat] - PRIO[b.cat]); // estable: mismo nivel, en orden de llegada
    while (this.cola.length > COLA_MAX) {
      let k = -1; // lo de menos prioridad (nunca un urgente)
      for (let i = 0; i < this.cola.length; i++) if (this.cola[i].cat !== 'urgente' && (k < 0 || PRIO[this.cola[i].cat] >= PRIO[this.cola[k].cat])) k = i; // v12.4.12: con la misma prioridad sale el más nuevo (se respeta el orden de llegada)
      if (k < 0) break;
      const [x] = this.cola.splice(k, 1);
      // v12.4.12: lo importante que no cabe (la ráfaga del amanecer: 10 a 15 avisos juntos) espera su turno en vez de perderse
      if (x.cat === 'consejo') this.espera.unshift(x); else if (x.cat === 'importante') { x.tDif = this.reloj; this.diferidos.push(x); if (this.diferidos.length > 12) this.anotar(this.diferidos.shift(), 'botado'); } else this.anotar(x, 'botado');
    }
    this.tick();
  }

  // cuántos textos no urgentes salieron en el último minuto
  enElMinuto(ahora) { this.ventana = this.ventana.filter((t) => ahora - t < 60000); return this.ventana.length; }

  tick() {
    const ahora = performance.now(), ui = this.ui;
    // v12.5.1: un reloj que solo corre jugando (en menús, la tienda o la libreta no envejecen los diferidos)
    if (ui.state === 'playing' && this.ultTick) this.reloj += Math.min(1000, ahora - this.ultTick);
    this.ultTick = ahora;
    // los diferidos que llevan 3 min de juego esperando ya no vienen al caso: al historial
    while (this.diferidos.length && this.reloj - (this.diferidos[0].tDif ?? this.reloj) > 180000) this.anotar(this.diferidos.shift(), 'botado');
    if (this.actual && ahora >= this.actual.hasta) { this.quitar(); this.libreHasta = ahora + PAUSA; }
    const jugando = ui.state === 'playing';
    const combate = jugando && this.enCombate();
    if (combate) this.calmaDesde = ahora;
    if (this.actual || ahora < this.libreHasta || !jugando) return;
    const hablando = ahora < (ui.dialogoHasta || 0); // mientras alguien habla (diálogo abierto), solo lo urgente
    const { modo } = this.ajustes, libre = modo === 'todos' || this.enElMinuto(ahora) < POR_MINUTO;
    // el siguiente: el urgente siempre; lo demás si no hay pelea y queda presupuesto
    let i = this.cola.findIndex((q) => q.cat === 'urgente' || (!hablando && ((!combate && libre) || (q.cat === 'importante' && ahora - q.t > 10000)))); // lo importante no espera más de 10 s, ni peleando
    // v12.4.12: los diferidos salen cuando hay presupuesto; si al minuto quedan dos o más, se juntan en un solo aviso (van al historial)
    if (this.diferidos.length >= 2 && this.reloj - (this.diferidos[0].tDif ?? this.reloj) > 60000) {
      const n = this.diferidos.length;
      for (const x of this.diferidos) this.anotar(x, 'botado');
      this.diferidos = [];
      this.cola.push({ text: `📋 Hoy hay ${n} avisos más: están en la libreta («Lo que se dijo»)`, cat: 'importante', clave: 'resumen:diferidos', n: 1, logro: null, render: null, t: ahora });
    }
    if (i < 0 && !combate && !hablando && !this.cola.length && this.diferidos.length && libre) { this.cola.push(this.diferidos.shift()); i = 0; }
    if (i < 0 && !combate && !hablando && !this.cola.length && this.espera.length && libre && ahora - this.calmaDesde > CALMA_MS) { this.cola.push(this.espera.shift()); i = 0; }
    if (i < 0) return;
    const [e] = this.cola.splice(i, 1);
    if (e.cat === 'ambiente' && ahora - e.t > 20000) { this.anotar(e, 'botado'); return; } // el comentario ya no viene al caso
    this.mostrar(e, ahora);
  }

  mostrar(e, ahora) {
    const { vel } = this.ajustes;
    this.actual = e;
    e.hasta = ahora + duracion(e.text, vel);
    if (e.cat !== 'urgente') this.ventana.push(ahora);
    if (e.cat === 'ambiente') this.ultAmbiente = ahora;
    this.dichos.set(e.clave, ahora);
    this.vistos.add(e.clave);
    if (!e.anotado) { e.anotado = true; this.anotar(e, 'dicho'); } // si lo interrumpieron y vuelve a salir, ya estaba en el historial
    this.pintar(e, true);
  }
  pintar(e, nuevo = false) {
    const txt = e.n > 1 ? `${e.text} ×${e.n}` : e.text;
    if (e.render) { if (nuevo) e.render.mostrar(); return; }
    if (e.logro) this.ui.tarjetaLogro(txt, e.logro.icono, e.logro.n, nuevo);
    else this.ui.pintarAviso(txt, e.cat, nuevo, !calmaActiva(this.g));
  }
  quitar() {
    const e = this.actual;
    this.actual = null;
    if (!e) return;
    if (e.render) { if (e.render.quitar) e.render.quitar(); return; }
    if (e.logro) this.ui.tarjetaLogro(null); else this.ui.pintarAviso(null);
  }
  // borra todo lo pendiente (al salir del mundo); el historial se queda si no se pide
  limpiar(todo = false) {
    this.cola = []; this.espera = []; this.diferidos = []; this.quitar(); this.libreHasta = 0;
    if (todo) { this.hist = []; this.dichos.clear(); this.ventana = []; this.vistos.clear(); }
  }

  anotar(e, estado) {
    const g = this.g, t = (g && g.time) || 0, m = Math.floor((((t + 0.25) % 1) * 24 * 60));
    const hora = g && g.player ? `Día ${g.day || 1} · ${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` : '';
    const ult = this.hist[this.hist.length - 1];
    if (ult && ult.text === e.text && ult.estado === estado) { ult.n++; return; }
    this.hist.push({ text: e.text, cat: e.cat, estado, hora, n: 1 });
    if (this.hist.length > HIST_MAX) this.hist.shift();
    if (estado === 'dicho') { const H = (this.ui.avisos ||= []); H.push(e.text); if (H.length > 40) H.shift(); } // el diario sigue mostrando los últimos
  }
}
