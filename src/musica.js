// Música generativa con notas reales (marimba y arpa grabadas, biblioteca VCSL en dominio público).
// Cada tanto suena una pieza corta: de día marimba en 6/8 con bajo, de noche y en cuevas arpa lenta.
// Las notas se transponen desde la grabación más cercana para tocar escalas pentatónicas.
export const MARIMBA = [41, 48, 54, 59, 65, 72, 78, 83, 89, 96];
export const ARPA = [28, 54, 65, 78, 89, 98, 101];

const MAJOR = [0, 2, 4, 7, 9]; // pentatónica mayor
const MINOR = [0, 3, 5, 7, 10]; // pentatónica menor

export class Music {
  constructor(audio) {
    this.audio = audio;
    this.wait = 25 + Math.random() * 20; // la primera pieza llega pronto
    this.queue = [];
    this.playing = false;
    this.gain = null;
  }

  ensureBus() {
    const a = this.audio;
    if (this.gain || !a.ctx || !a.master) return !!this.gain;
    this.gain = a.ctx.createGain();
    this.gain.gain.value = 0.5;
    this.gain.connect(a.master);
    return true;
  }

  // toca una nota MIDI con el instrumento dado, transponiendo la grabación más cercana
  note(inst, midi, when, vol) {
    const a = this.audio;
    const list = inst === 'arpa' ? ARPA : MARIMBA;
    let best = list[0];
    for (const m of list) if (Math.abs(m - midi) < Math.abs(best - midi)) best = m;
    const buf = a.buffers.get((a.banks[`nota.${inst}.${best}`] || [])[0]);
    if (!buf) return;
    const c = a.ctx;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = Math.pow(2, (midi - best) / 12);
    const g = c.createGain();
    g.gain.value = vol;
    src.connect(g); g.connect(this.gain);
    src.start(c.currentTime + when);
    const fin = c.currentTime + when + buf.duration;
    this.sonando = (this.sonando || []).filter((q) => q.fin > c.currentTime);
    this.sonando.push({ src, g, fin });
  }
  // lo que quedó programado se apaga en medio segundo
  callar() {
    const c = this.audio.ctx, t = c.currentTime;
    for (const q of this.sonando || []) { q.g.gain.setTargetAtTime(0, t, 0.12); try { q.src.stop(t + 0.6); } catch { /* ya terminó */ } }
    this.sonando = [];
    this.ev = [];
  }

  // arma una pieza: lista de { t, inst, midi, vol }
  // la región cambia el aire de la pieza: calipso en el Caribe, punto guanacasteco en Guanacaste, marimba en terceras
  // en el Valle, arpa tranquila en el bosque nuboso y la cordillera, y algo más espaciado en el Pacífico
  compose(night, cave, region = null) {
    const altura = region === 'nuboso' || region === 'cordillera';
    const inst = night || cave || altura ? 'arpa' : 'marimba';
    const R = night || cave ? null : region;
    const root = 60 + [0, 2, 5, 7, -3][Math.floor(Math.random() * 5)];
    const scale = night || cave ? MINOR : R === 'caribe' || R === 'pacifico' || altura ? MAJOR : (Math.random() < 0.8 ? MAJOR : MINOR);
    const deg = (d) => { const o = Math.floor(d / 5); return root + o * 12 + scale[((d % 5) + 5) % 5]; };
    const notes = [];
    let beat = inst === 'arpa' ? 0.62 + Math.random() * 0.15 : 0.24 + Math.random() * 0.05; // corchea en 6/8
    if (R === 'caribe') beat = 0.19 + Math.random() * 0.03;
    if (R === 'valle') beat = 0.28 + Math.random() * 0.04;
    if (altura && !night) beat = 0.5 + Math.random() * 0.1;
    const bars = inst === 'arpa' ? 10 + Math.floor(Math.random() * 6) : 14 + Math.floor(Math.random() * 8);
    let d = 5 + Math.floor(Math.random() * 3);
    // un motivo de 6 notas que se repite y varía, como una canción
    const motif = Array.from({ length: 6 }, () => (Math.random() < 0.25 ? null : Math.floor(Math.random() * 5) - 2));
    for (let b = 0; b < bars; b++) {
      const t0 = b * 6 * beat;
      // bajo: tónica o quinta en el primer tiempo
      if (inst === 'marimba') notes.push({ t: t0, inst, midi: deg(b % 4 === 3 ? 3 : 0) - 12, vol: 0.3 });
      if (R === 'caribe') notes.push({ t: t0 + 3.5 * beat, inst, midi: deg(3) - 12, vol: 0.24 });
      else if (b % 2 === 0) notes.push({ t: t0, inst, midi: deg(0) - 12, vol: 0.28 });
      const vary = b % 4 === 3;
      for (let k = 0; k < 6; k++) {
        const step = motif[k];
        if (step === null || (inst === 'arpa' && k % 2 === 1 && Math.random() < 0.6)) continue;
        if (R === 'pacifico' && k % 3 === 2 && Math.random() < 0.6) continue;
        d += vary ? Math.floor(Math.random() * 5) - 2 : step;
        d = Math.max(2, Math.min(12, d));
        // calipso: las notas de los tiempos débiles se corren a contratiempo
        const swing = R === 'caribe' && k % 2 === 1 ? beat * 0.35 : 0;
        const t = t0 + k * beat + swing + (Math.random() - 0.5) * 0.012;
        const accent = k === 0 || k === 3 ? 1 : 0.75;
        notes.push({ t, inst, midi: deg(d), vol: 0.22 * accent });
        // a veces en terceras, como se toca la marimba a dos manos
        if (inst === 'marimba' && Math.random() < (R === 'valle' ? 0.55 : 0.3)) notes.push({ t, inst, midi: deg(d - 2), vol: 0.14 * accent });
        // en el Caribe, un adorno agudo como de steel pan
        if (R === 'caribe' && Math.random() < 0.18) notes.push({ t: t + beat * 0.5, inst, midi: deg(d) + 12, vol: 0.1 });
      }
    }
    // final en la tónica
    const end = bars * 6 * beat;
    notes.push({ t: end, inst, midi: deg(5), vol: 0.24 }, { t: end, inst, midi: deg(0) - 12, vol: 0.24 });
    return { notes, length: end + 3 };
  }

  // música de pelea: el arpa en lo grave, un ostinato apurado en menor con golpes arriba
  composePelea() {
    const root = 45 + [0, 2, -2][Math.floor(Math.random() * 3)], beat = 0.17 + Math.random() * 0.02, notes = [], bars = 16;
    const deg = (d) => { const o = Math.floor(d / 5); return root + o * 12 + MINOR[((d % 5) + 5) % 5]; };
    const giro = [0, 0, 3, 0, 2, 0, -1, 0];
    for (let b = 0; b < bars; b++) {
      const t0 = b * 8 * beat, sube = b % 8 >= 6 ? 1 : 0;
      giro.forEach((d, k) => notes.push({ t: t0 + k * beat, inst: 'arpa', midi: deg(d + sube), vol: k % 4 === 0 ? 0.34 : 0.2 }));
      if (b % 2 === 1) notes.push({ t: t0 + 4 * beat, inst: 'marimba', midi: deg(5 + (b % 4 === 3 ? 2 : 0)), vol: 0.2 }, { t: t0 + 6 * beat, inst: 'marimba', midi: deg(7), vol: 0.14 });
    }
    return { notes, length: bars * 8 * beat };
  }

  // música del Rey Zopilote (v12.16.3, fase 5): crece por fase. fase = 0.5 preludio, 1..4 las cuatro fases, 5 golpe final (silencio y el himno de la casa).
  // Notas reales de arpa y marimba, más golpes de los bancos CC0 que ya hay (latido, trueno, campana): `ev` = [{ t, banco, vol, pitch }] que update() dispara.
  composeRey(fase) {
    const notes = [], ev = [], root = 45;
    const menor = (d) => { const o = Math.floor(d / 5); return root + o * 12 + MINOR[((d % 5) + 5) % 5]; };
    const mayor = (d) => { const o = Math.floor(d / 5); return 60 + o * 12 + MAJOR[((d % 5) + 5) % 5]; };
    if (fase < 1) { // preludio: un latido cada 2 s y una nota larga de arpa en menor, a 40 por minuto
      for (let i = 0; i < 4; i++) ev.push({ t: i * 2, banco: 'latido', vol: 0.5, pitch: 0.8 });
      notes.push({ t: 0.2, inst: 'arpa', midi: menor(0), vol: 0.34 }, { t: 3.2, inst: 'arpa', midi: menor(2), vol: 0.3 });
      return { notes, ev, length: 8 };
    }
    if (fase >= 5) { // el himno de la casa: 12 notas de marimba, solas, en mayor, después de un segundo de silencio
      [0, 2, 4, 2, 5, 4, 2, 0, 2, 4, 7, 5].forEach((d, k) => notes.push({ t: 1 + k * 0.5, inst: 'marimba', midi: mayor(d + 5), vol: k === 11 ? 0.3 : 0.24 }));
      notes.push({ t: 7, inst: 'marimba', midi: mayor(0), vol: 0.22 });
      return { notes, ev, length: 11 };
    }
    const beat = [0.19, 0.17, 0.155, 0.22][fase - 1], bars = 4, giro = [0, 0, 3, 0, 2, 0, -1, 0];
    for (let b = 0; b < bars; b++) {
      const t0 = b * 8 * beat;
      if (fase < 4) {
        giro.forEach((d, k) => {
          notes.push({ t: t0 + k * beat, inst: 'arpa', midi: menor(d), vol: k % 4 === 0 ? 0.34 : 0.2 });
          if (fase === 3) notes.push({ t: t0 + k * beat, inst: 'arpa', midi: menor(d) + 12, vol: 0.14 }); // doblado una octava arriba
        });
        ev.push({ t: t0, banco: 'latido', vol: 0.45, pitch: 1 });
        if (fase >= 2) notes.push({ t: t0, inst: 'marimba', midi: menor(b % 2 ? 2 : 0) - 12, vol: 0.3 }, { t: t0 + 4 * beat, inst: 'marimba', midi: menor(0) - 12, vol: 0.22 }); // el bajo
        if (fase === 2 && b % 4 === 0) ev.push({ t: t0, banco: 'trueno', vol: 0.4, pitch: 1.1 });
        if (fase === 3) { ev.push({ t: t0, banco: 'campana', vol: 0.3, pitch: 0.9 }, { t: t0 + 4 * beat, banco: 'campana', vol: 0.24, pitch: 1.1 }); }
      } else { // fase 4: pentatónica mayor, marimba en terceras, arpa arriba, una campana cada dos compases
        [0, 2, 4, 2, 5, 4, 2, 0].forEach((d, k) => {
          notes.push({ t: t0 + k * beat, inst: 'marimba', midi: mayor(d + 3), vol: k % 4 === 0 ? 0.26 : 0.18 }, { t: t0 + k * beat, inst: 'marimba', midi: mayor(d + 1), vol: 0.12 });
          if (k % 2 === 0) notes.push({ t: t0 + k * beat, inst: 'arpa', midi: mayor(d + 8), vol: 0.14 });
        });
        notes.push({ t: t0, inst: 'marimba', midi: mayor(b % 2 ? 2 : 0) - 12, vol: 0.28 });
        if (b % 2 === 0) ev.push({ t: t0, banco: 'campana', vol: 0.3, pitch: 1.2 });
      }
    }
    return { notes, ev, length: bars * 8 * beat };
  }

  update(dt, s) {
    if (!this.ensureBus()) return;
    const vol = s.volume ?? 0.5, rey = s.rey || 0;
    // el volumen sube un 25 % por fase del Rey (y respeta el ajuste «Música»)
    const sube = rey > 0 ? [0.8, 1, 1.25, 1.5, 1.4, 1][rey < 1 ? 0 : Math.floor(rey)] ?? 1 : 1;
    this.gain.gain.setTargetAtTime(vol * 0.55 * sube, this.audio.ctx.currentTime, 0.5);
    if (vol <= 0.001) return;
    if (rey !== (this.reyPrev || 0)) { // cambió la fase del Rey: lo anterior se apaga y entra lo nuevo
      this.reyPrev = rey; this.callar(); this.playing = false; this.wait = rey > 0 ? 0.15 : 40;
    }
    const lucha = !!s.pelea || rey > 0;
    // en una pelea grande entra la música de pelea, sin esperar a que le toque
    if (lucha && !this.enPelea) { this.enPelea = true; this.callar(); this.playing = false; this.wait = 0.5; }
    if (!lucha && this.enPelea) { this.enPelea = false; this.callar(); this.playing = false; this.wait = 40; }
    if (this.playing) {
      this.left -= dt;
      for (const e of this.ev || []) { e.t -= dt; if (e.t <= 0 && !e.hecho) { e.hecho = true; this.audio.play(e.banco, { ui: true, vol: e.vol, pitch: e.pitch }); } }
      if (this.left <= 0) { this.playing = false; this.ev = []; this.wait = rey >= 5 ? 9999 : lucha ? 0.5 : 120 + Math.random() * 180; } // el himno suena una sola vez
      return;
    }
    this.wait -= dt;
    if (this.wait > 0 || s.underwater) return;
    const song = rey > 0 ? this.composeRey(rey) : s.pelea ? this.composePelea() : this.compose(s.daylight < 0.3, s.cave > 0.6, s.region);
    for (const n of song.notes) this.note(n.inst, n.midi, n.t, n.vol);
    this.ev = (song.ev || []).map((e) => ({ ...e }));
    this.playing = true;
    this.left = song.length;
  }

  // para probar desde la consola: suena ya
  now() { this.wait = 0; this.playing = false; }

  // función del teatro: una pieza de marimba de día aunque sea de noche; devuelve cuánto dura
  concert() {
    if (!this.ensureBus()) return 30;
    const song = this.compose(false, false);
    for (const n of song.notes) this.note(n.inst, n.midi, n.t + 0.5, n.vol * 1.2);
    this.playing = true;
    this.left = song.length + 1;
    return song.length;
  }
}
