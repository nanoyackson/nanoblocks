// v12.5.0 (PLAN_GRAFICOS_2.md §3): el regulador automático de calidad. Reemplaza el aviso de la v12.2.1 («Va lento… baje a Bajo»).
// v12.5.2 (duodécima revisión, §2): lo que baja vive SOLO EN MEMORIA (game.escalaAuto y game.calidadRegulada): nunca toca
// settings.calidad, que se guarda y comparte. No vuelve a subir solo dentro de la sesión (subir y bajar oscilaba cada ~125 s): sube
// el jugador a mano o al recargar. La meta es 60 fps, salvo que el cuadro esté pegado a un tope de pantalla parejo (30 Hz en batería,
// 40/45/48/50 Hz): eso no es el juego lento y no se toca nada. En Bajo no actúa (Bajo = como siempre).
// Mira el intervalo real entre cuadros en ventanas de 5 s; con dos ventanas por debajo del 70 % de la meta baja un escalón:
//   1) resolución propia (escalaAuto 1 → 0.85 → 0.7, multiplica a settings.renderScale sin pisarlo)
//   2) el nivel efectivo (Ultra → Alto → Medio; nunca a Bajo)
// Tocar a mano la calidad, un efecto o la resolución deshace lo bajado y lo deja 3 min sin actuar (no pelea con lo que se escogió).
const ESCALAS = [1, 0.85, 0.7];
const BAJA = { ultra: 'alto', alto: 'medio' };
const VENTANA = 5000, CAMBIO_MIN = 60000, GRACIA = 180000, META = 60;
const TOPES = [30, 40, 45, 48, 50]; // refrescos de pantalla o de ahorro de energía comunes

export class Regulador {
  constructor(game, ui) {
    Object.assign(this, { game, ui, intervalos: [], desde: 0, lentas: 0, ultimoCambio: 0, paso: 0, quietoHasta: 0 });
    game.escalaAuto = 1; game.calidadRegulada = null;
  }
  // lo llama main.js en cada cuadro con el intervalo crudo (ms)
  cuadro(ms, ahora) {
    const g = this.game, ui = this.ui, s = g.settings;
    const activo = s.calidadAuto !== false && s.calidad !== 'bajo' && ui && ui.state === 'playing' && !g.paused && !g.view && g.ready && document.visibilityState === 'visible' && ui.listoDesde && ahora - ui.listoDesde > 8000 && ahora >= this.quietoHasta;
    if (!activo || ms > 250) { this.desde = 0; this.intervalos.length = 0; return; } // carga de chunks, pestaña oculta, pausa: no cuenta
    this.intervalos.push(ms);
    if (!this.desde) this.desde = ahora;
    if (ahora - this.desde < VENTANA) return;
    // una ventana de 5 s
    const o = [...this.intervalos].sort((a, b) => a - b), at = (q) => o[Math.min(o.length - 1, Math.floor(o.length * q))];
    const p10 = at(0.1), p50 = at(0.5), p90 = at(0.9), fps = 1000 / p50;
    this.intervalos.length = 0; this.desde = ahora;
    // ¿un tope de pantalla parejo? (casi sin dispersión y justo en un refresco común): el juego no va lento, la pantalla manda
    const parejo = p90 / Math.max(1, p10) < 1.08 && TOPES.some((t) => Math.abs(fps - t) < 1.5);
    this.ultimaLectura = { fps: Math.round(fps), meta: META, tope: parejo };
    if (!parejo && fps < META * 0.7) this.lentas++; else this.lentas = 0;
    if (ahora - this.ultimoCambio < CAMBIO_MIN || this.lentas < 2) return;
    this.lentas = 0;
    this.bajar(ahora);
  }
  bajar(ahora) {
    const g = this.game, s = g.settings, nivel = g.calidadRegulada || s.calidad;
    if (this.paso < ESCALAS.length - 1) {
      this.paso++; g.escalaAuto = ESCALAS[this.paso]; g.resize();
      this.avisar(`📉 Bajé la resolución a ${Math.round(g.escalaAuto * 100)} % para mantener los fps`);
    } else if (BAJA[nivel]) {
      g.calidadRegulada = BAJA[nivel]; // en memoria: lo guardado sigue siendo lo que escogió el jugador
      this.avisar(`📉 Bajé la calidad a ${g.calidadRegulada === 'alto' ? 'Alto' : 'Medio'} para mantener los fps (en Ajustes se vuelve a subir)`);
    }
    this.ultimoCambio = ahora; // aunque no haya a dónde bajar: no se reintenta en cada ventana
  }
  avisar(t) { if (this.ui) this.ui.toast(t, 3200, { cat: 'consejo', clave: 'regulador:baja' }); }
  // tocar a mano la calidad, un efecto o la resolución: se deshace lo bajado y no actúa por 3 min
  olvidar() {
    this.paso = 0; this.game.escalaAuto = 1; this.game.calidadRegulada = null; this.lentas = 0;
    this.quietoHasta = performance.now() + GRACIA;
    this.game.resize();
  }
}
