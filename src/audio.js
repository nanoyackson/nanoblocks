// Audio: grabaciones reales (Freesound CC0, recortadas por tools/process-sounds.mjs) por material,
// sonido 3D, eco de cueva, filtro bajo el agua, emisores en bucle (fuego del horno) y ambientes grabados
// (pájaros, grillos, viento, cueva, bajo el agua) que se mezclan según el lugar y la hora.
// Los clics de menú vienen de Kenney (CC0).

const range = (prefix, n, pad = 3, start = 0) => Array.from({ length: n }, (_, i) => `${prefix}${String(i + start).padStart(pad, '0')}.ogg`);

// Bancos de interfaz (Kenney); los demás llegan desde sounds/real/manifest.json
const UI_BANKS = {
  click: range('ui_click_', 5, 3, 1),
  select: range('ui_select_', 8, 3, 1),
  open: range('ui_open_', 4, 3, 1),
  close: range('ui_close_', 4, 3, 1),
  craft: range('ui_confirmation_', 4, 3, 1),
  drop: range('ui_drop_', 4, 3, 1),
  punch: range('impactPunch_medium_', 5),
  toolbreak: range('impactTin_medium_', 5),
};

// Cómo suena cada material: capas [banco, volumen, tono]. Como en la vida real, colocar o romper un bloque
// suena al mismo material que pisarlo, pero más fuerte; romper suma el desmoronamiento.
const FAMILY = {
  stone: { step: [['step.stone', 0.3, 1]], hit: [['dig.stone', 0.32, 1]], break: [['dig.stone', 0.7, 0.9], ['dig.gravel', 0.35, 0.8]], place: [['step.stone', 0.85, 0.8], ['dig.stone', 0.25, 0.9]] },
  wood: { step: [['step.wood', 0.32, 1]], hit: [['dig.wood', 0.35, 1]], break: [['dig.wood', 0.75, 0.85], ['step.wood', 0.5, 0.75]], place: [['step.wood', 0.9, 0.8]] },
  grass: { step: [['step.grass', 0.3, 1]], hit: [['step.grass', 0.4, 0.9]], break: [['step.grass', 0.85, 0.85], ['dig.leaves', 0.3, 1]], place: [['step.grass', 0.8, 0.85]] },
  gravel: { step: [['step.gravel', 0.32, 1]], hit: [['dig.gravel', 0.35, 1.05]], break: [['dig.gravel', 0.8, 0.9]], place: [['step.gravel', 0.85, 0.85]] },
  sand: { step: [['step.sand', 0.32, 1]], hit: [['step.sand', 0.4, 1.05]], break: [['step.sand', 0.85, 0.9], ['dig.gravel', 0.25, 1.2]], place: [['step.sand', 0.85, 0.85]] },
  snow: { step: [['step.snow', 0.32, 1]], hit: [['step.snow', 0.4, 1.05]], break: [['step.snow', 0.85, 0.9]], place: [['step.snow', 0.8, 0.85]] },
  glass: { step: [['step.stone', 0.3, 1.15]], hit: [['dig.stone', 0.22, 1.5]], break: [['break.glass', 0.75, 1]], place: [['step.stone', 0.7, 1.3]] },
  cloth: { step: [['dig.cloth', 0.25, 1]], hit: [['dig.cloth', 0.35, 1]], break: [['dig.cloth', 0.8, 0.9]], place: [['dig.cloth', 0.75, 0.9]] },
  leaves: { step: [['step.grass', 0.25, 1.1]], hit: [['dig.leaves', 0.35, 1.1]], break: [['dig.leaves', 0.8, 1]], place: [['dig.leaves', 0.7, 0.95]] },
  water: { step: [['swim', 0.25, 1]] },
};

export class Audio {
  constructor() {
    this.ctx = null;
    this.volume = 0.6;
    this.buffers = new Map();
    this.banks = { ...UI_BANKS };
    this.credits = [];
    this.loading = false;
    this.listener = { x: 0, y: 0, z: 0, yaw: 0 };
    this.emitters = new Map();
    this.amb = null;
  }

  resume() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const c = this.ctx = new AC();
      this.master = c.createGain();
      this.master.gain.value = this.volume;
      // compresor suave para que las capas no saturen
      this.comp = c.createDynamicsCompressor();
      this.comp.threshold.value = -14; this.comp.ratio.value = 3; this.comp.attack.value = 0.005; this.comp.release.value = 0.2;
      this.waterFilter = c.createBiquadFilter();
      this.waterFilter.type = 'lowpass';
      this.waterFilter.frequency.value = 20000;
      this.waterFilter.connect(this.comp);
      this.comp.connect(this.master);
      this.master.connect(c.destination);
      this.sfx = c.createGain();
      this.sfx.connect(this.waterFilter);
      this.reverb = c.createConvolver();
      this.reverb.buffer = this.makeImpulse(2.6, 2.2);
      this.reverbSend = c.createGain();
      this.reverbSend.gain.value = 0.04;
      this.sfx.connect(this.reverbSend);
      this.reverbSend.connect(this.reverb);
      this.reverb.connect(this.waterFilter);
      const len = c.sampleRate * 2;
      this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.loadAll();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  makeImpulse(seconds, decay) {
    const c = this.ctx;
    const len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  async loadAll() {
    if (this.loading) return;
    this.loading = true;
    try {
      const man = await (await fetch('./sounds/real/manifest.json')).json();
      Object.assign(this.banks, man.banks);
      this.credits = man.credits || [];
    } catch { /* sin manifest: solo sonidos sintetizados */ }
    const files = new Set(Object.values(this.banks).flat());
    await Promise.all([...files].map(async (f) => {
      try {
        const res = await fetch(`./sounds/${f}`);
        if (!res.ok) return;
        this.buffers.set(f, await this.ctx.decodeAudioData(await res.arrayBuffer()));
      } catch { /* si un archivo falla, se usa el respaldo sintetizado */ }
    }));
    this.startAmbience();
  }

  setVolume(v) {
    this.volume = v;
    if (this.master) this.master.gain.value = v;
  }

  setListener(x, y, z, yaw) { this.listener.x = x; this.listener.y = y; this.listener.z = z; this.listener.yaw = yaw; }

  spatial(pos, range = 28) {
    if (!pos) return { gain: 1, pan: 0 };
    const L = this.listener;
    const dx = pos.x - L.x, dy = pos.y - L.y, dz = pos.z - L.z;
    const d = Math.hypot(dx, dy, dz);
    const gain = Math.pow(Math.max(0, 1 - d / range), 1.6);
    const right = (dx * Math.cos(L.yaw) - dz * Math.sin(L.yaw)) / (Math.hypot(dx, dz) || 1);
    return { gain, pan: Math.max(-1, Math.min(1, right * 0.75)), far: Math.min(1, d / range) };
  }

  buffer(name) {
    const files = this.banks[name];
    if (!files || !files.length) return null;
    // evita repetir el mismo archivo dos veces seguidas
    this.lastPick = this.lastPick || {};
    let i = Math.floor(Math.random() * files.length);
    if (files.length > 1 && i === this.lastPick[name]) i = (i + 1) % files.length;
    this.lastPick[name] = i;
    return this.buffers.get(files[i]) || null;
  }

  // Reproduce un banco. opts: { vol, pitch, pos, ui, when, vary }
  play(name, opts = {}) {
    if (!this.ctx) return null;
    // subtítulos: avisa qué sonó en el mundo y dónde (los de la interfaz no)
    if (this.onCaption && opts.pos && !opts.ui) this.onCaption(name, opts.pos);
    const buf = this.buffer(name);
    if (!buf) { this.synth(name, opts); return null; }
    const sp = this.spatial(opts.pos, opts.range);
    const vol = (opts.vol ?? 0.7) * sp.gain;
    if (vol <= 0.001) return null;
    const c = this.ctx;
    const src = c.createBufferSource();
    src.buffer = buf;
    const vary = opts.vary ?? 0.08;
    src.playbackRate.value = (opts.pitch ?? 1) * (1 - vary + Math.random() * vary * 2);
    const g = c.createGain();
    g.gain.value = vol;
    const pan = c.createStereoPanner();
    pan.pan.value = sp.pan;
    // lo lejano llega opaco (el aire se come los agudos), como en la vida real
    if (sp.far > 0.25) {
      const f = c.createBiquadFilter(); f.type = 'lowpass';
      f.frequency.value = Math.max(700, 16000 * Math.pow(1 - sp.far, 2.2));
      src.connect(f); f.connect(g);
    } else src.connect(g);
    g.connect(pan); pan.connect(opts.ui ? this.master : this.sfx);
    src.start(c.currentTime + (opts.when || 0));
    return src;
  }

  material(kind, action, pos) {
    const fam = FAMILY[kind] || FAMILY.stone;
    const layers = fam[action];
    if (!layers) return;
    for (const [bank, vol, pitch] of layers) this.play(bank, { vol, pitch, pos });
  }

  // comer: varias mordidas seguidas, como masticando
  eat(pos) {
    for (let i = 0; i < 4; i++) this.play('eat', { vol: 0.45, pitch: 0.95, pos, when: i * 0.16, vary: 0.12 });
  }

  pickup() { if (this.buffer('recoger')) this.play('recoger', { ui: true, vol: 0.4, vary: 0.1 }); else this.play('pop', { ui: true, vol: 0.22, pitch: 0.9, vary: 0.15 }); }
  drop() { this.play(this.buffer('soltar') ? 'soltar' : 'drop', { ui: true, vol: 0.45, vary: 0.1 }); }

  // cofre de madera: crujido de bisagra al abrir (con su pestillo), golpe seco al cerrar
  chest(open, pos) {
    if (open) { this.play(this.buffer('cofre.abrir') ? 'cofre.abrir' : 'chest.open', { pos, vol: 0.65, vary: 0.06 }); this.play('chest.open', { pos, vol: 0.2, when: 0.05 }); }
    else { this.play(this.buffer('cofre.cerrar') ? 'cofre.cerrar' : 'chest.close', { pos, vol: 0.7, vary: 0.06, when: 0.12 }); }
  }

  // tajo de machete en capas: el silbido del aire, y si pegó, el golpe seco del filo
  slash(hit, pos) {
    this.play('swish', { vol: 0.42, vary: 0.12 });
    if (hit) this.play('tajo', { vol: 0.5, pos, vary: 0.1, when: 0.04 });
  }

  // ponerse una pieza: el material suena distinto (cuero, metal, la máscara de cartón)
  armor(mat, off = false) {
    const bank = mat === 'leather' || mat === 'mascarada' ? 'armadura.cuero' : 'armadura.metal';
    this.play(bank, { ui: true, vol: off ? 0.3 : 0.5, pitch: off ? 0.85 : 1, vary: 0.08 });
    if (!off && bank === 'armadura.metal') this.play('armadura.cuero', { ui: true, vol: 0.18, when: 0.05 });
  }

  // ---------- emisores en bucle (fuego del horno, etc.) ----------
  setEmitter(key, bank, pos, vol = 0.5) {
    if (!this.ctx) return;
    let e = this.emitters.get(key);
    if (!pos) {
      if (e) { e.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2); e.src.stop(this.ctx.currentTime + 1); this.emitters.delete(key); }
      return;
    }
    if (!e) {
      const buf = this.buffer(bank);
      if (!buf) return;
      const src = this.ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      src.loopStart = 0; src.loopEnd = buf.duration;
      src.start(this.ctx.currentTime, Math.random() * buf.duration);
      const g = this.ctx.createGain(); g.gain.value = 0;
      const p = this.ctx.createStereoPanner();
      src.connect(g); g.connect(p); p.connect(this.sfx);
      e = { src, g, p, pos, vol };
      this.emitters.set(key, e);
    }
    e.pos = pos; e.vol = vol;
  }

  // al salir al menú: se apaga todo lo que suena «en el mundo» (ambiente, lluvia, emisores)
  silenceWorld() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const k of [...this.emitters.keys()]) this.setEmitter(k, null, null);
    if (this.amb) this.amb.out.gain.setTargetAtTime(0, now, 0.12);
    if (this.rain) { this.rain.hi.g.gain.setTargetAtTime(0, now, 0.12); this.rain.lo.g.gain.setTargetAtTime(0, now, 0.12); }
    this.waterFilter.frequency.setTargetAtTime(20000, now, 0.05);
    this.worldMuted = true;
  }

  updateEmitters() {
    const now = this.ctx.currentTime;
    for (const e of this.emitters.values()) {
      const sp = this.spatial(e.pos, 16);
      e.g.gain.setTargetAtTime(e.vol * sp.gain, now, 0.1);
      e.p.pan.setTargetAtTime(sp.pan, now, 0.1);
    }
  }

  // ---------- respaldos sintetizados ----------
  noise(dur, freq, q, gain, type = 'bandpass', when = 0, out = this.sfx, attack = 0.002) {
    const c = this.ctx;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    const t = c.currentTime + when;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(out);
    src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.05);
  }

  tone(freq, dur, gain, type = 'sine', slideTo = null, when = 0, out = this.sfx, attack = 0.005) {
    const c = this.ctx;
    const o = c.createOscillator();
    o.type = type;
    const t = c.currentTime + when;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out);
    o.start(t); o.stop(t + dur + 0.05);
    return o;
  }

  bus(pos) {
    const sp = this.spatial(pos);
    if (sp.gain <= 0.001) return null;
    const g = this.ctx.createGain();
    g.gain.value = sp.gain;
    const p = this.ctx.createStereoPanner();
    p.pan.value = sp.pan;
    g.connect(p); p.connect(this.sfx);
    return g;
  }

  synth(name, opts = {}) {
    if (!this.ctx) return;
    const out = this.bus(opts.pos);
    if (!out) return;
    switch (name) {
      case 'fuse': this.noise(2.8, 6500, 0.4, 0.1, 'highpass', 0, out, 0.05); break;
      case 'rumble': this.tone(55, 1.6, 0.6, 'sine', 25, 0, out, 0.01); this.noise(2.2, 120, 0.6, 0.5, 'lowpass', 0, out, 0.01); break;
      case 'danta': {
        // las dantas reales "silban": tono agudo con vibrato, suave
        const o = this.tone(1500, 0.5, 0.05, 'sine', 1900, 0, out, 0.05);
        const lfo = this.ctx.createOscillator(); const lg = this.ctx.createGain();
        lfo.frequency.value = 8; lg.gain.value = 30;
        lfo.connect(lg); lg.connect(o.frequency);
        lfo.start(); lfo.stop(this.ctx.currentTime + 0.55);
        break;
      }
      case 'danta.hurt':
        this.tone(1900, 0.22, 0.08, 'triangle', 1300, 0, out);
        this.noise(0.15, 600, 1, 0.15, 'lowpass', 0, out);
        break;
      case 'sombra':
        this.tone(73, 1.8, 0.1, 'sawtooth', 61, 0, out, 0.4);
        this.tone(77.5, 1.8, 0.08, 'sawtooth', 58, 0, out, 0.4);
        this.noise(1.6, 420, 0.8, 0.1, 'bandpass', 0, out, 0.5);
        break;
      case 'mono': {
        // aullido del mono congo: grave, áspero, con resonancia que sube y baja
        const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 3;
        f.frequency.setValueAtTime(400, this.ctx.currentTime);
        f.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.6);
        f.frequency.linearRampToValueAtTime(350, this.ctx.currentTime + 1.6);
        f.connect(out);
        for (let i = 0; i < 3; i++) {
          this.tone(95 + i * 3, 1.7, 0.3, 'sawtooth', 80, i * 0.04, f, 0.25);
        }
        this.noise(1.6, 500, 1.2, 0.15, 'bandpass', 0, f, 0.3);
        break;
      }
      case 'lapa':
        // graznido de lapa: áspero y agudo, dos golpes
        for (let i = 0; i < 2; i++) {
          this.tone(1100, 0.22, 0.12, 'sawtooth', 700, i * 0.28, out, 0.01);
          this.noise(0.2, 1800, 2, 0.12, 'bandpass', i * 0.28, out, 0.01);
        }
        break;
      case 'perezoso':
        // chillido suave y agudo, como un silbidito largo
        this.tone(1900, 0.9, 0.05, 'sine', 1500, 0, out, 0.2);
        break;
      case 'quetzal': {
        // canto del quetzal: dos notas silbadas que suben ("kiou-kiou")
        for (let i = 0; i < 2; i++) { this.tone(900, 0.35, 0.09, 'sine', 1350, i * 0.5, out, 0.05); this.tone(1800, 0.3, 0.02, 'sine', 2700, i * 0.5, out, 0.05); }
        break;
      }
      case 'tortuga':
        this.noise(0.8, 300, 0.6, 0.08, 'lowpass', 0, out, 0.2);
        break;
      case 'murcielago':
        for (let i = 0; i < 3; i++) this.tone(6000 + Math.random() * 2000, 0.04, 0.05, 'sine', 4500, i * 0.07, out, 0.003);
        break;
      case 'aleteo':
        this.noise(0.12, 900, 0.8, 0.12, 'bandpass', 0, out, 0.01);
        break;
      // v13.1.2 (C4 de cuevas): goteo, agua corriendo, grillo y cangrejo de cueva
      case 'gota': {
        const f = 900 + Math.random() * 500;
        this.tone(f, 0.09, 0.16, 'sine', f * 0.45, 0, out, 0.002);
        this.tone(f * 2.1, 0.05, 0.05, 'sine', f * 1.2, 0.01, out, 0.002);
        break;
      }
      case 'agua_corre':
        this.noise(1.3, 1500, 0.5, 0.09, 'bandpass', 0, out, 0.35);
        this.noise(1.1, 3200, 0.8, 0.035, 'bandpass', 0.1, out, 0.3);
        break;
      // v13.4.4 (CC5): el sonido propio de cada tipo de salón: el cristal canta (Candil), el hongo burbujea (Hongueada), el magma bulle (Caldera)
      case 'cristal_canta': {
        const f = 1500 + Math.random() * 900;
        this.tone(f, 1.1, 0.07, 'sine', f * 0.997, 0, out, 0.005);
        this.tone(f * 2.76, 0.7, 0.03, 'sine', f * 2.74, 0, out, 0.005);
        break;
      }
      case 'hongo_burbuja':
        this.tone(240, 0.16, 0.1, 'sine', 520, 0, out, 0.01);
        this.tone(330, 0.12, 0.06, 'sine', 640, 0.09, out, 0.01);
        break;
      case 'magma_burbujea':
        this.noise(0.5, 220, 0.7, 0.12, 'lowpass', 0, out, 0.05);
        this.tone(70, 0.4, 0.1, 'sine', 110, 0, out, 0.03);
        break;
      case 'grillo_cueva':
        for (let i = 0; i < 3; i++) this.tone(3600 + i * 120, 0.05, 0.05, 'square', 3300, i * 0.09, out, 0.004);
        break;
      case 'cangrejo_ciego':
        this.noise(0.03, 3500, 2, 0.1, 'bandpass', 0, out, 0.001); this.noise(0.03, 2800, 2, 0.08, 'bandpass', 0.08, out, 0.001);
        break;
      case 'sombra.hurt':
        this.tone(160, 0.4, 0.15, 'sawtooth', 70, 0, out);
        this.noise(0.4, 700, 1, 0.15, 'bandpass', 0, out);
        break;
      default:
        this.noise(0.08, 900, 1, 0.08, 'bandpass', 0, out);
    }
  }

  // ---------- lluvia y truenos ----------
  // Lluvia: ruido filtrado en dos capas (golpeteo agudo + rumor grave); bajo techo suena apagada.
  setRain(intensity, covered, snow) {
    if (!this.ctx || !this.noiseBuf) return;
    const c = this.ctx;
    if (!this.rain && this.banks['loop.rain'] && this.banks['loop.rain'].every((f) => this.buffers.get(f))) { // con todas cargadas: si una falta, el juego se caía si llovía justo al arrancar
      // lluvia grabada: dos capas (fuerte y suave) con filtro para cuando estás bajo techo
      const mk = (file) => {
        const src = c.createBufferSource(); src.buffer = this.buffers.get(file); src.loop = true;
        const g = c.createGain(); g.gain.value = 0;
        src.connect(g); src.start(c.currentTime, Math.random() * src.buffer.duration);
        return { g };
      };
      const files = this.banks['loop.rain'];
      const hi = mk(files[0]), lo = mk(files[1] || files[0]);
      const muffle = c.createBiquadFilter(); muffle.type = 'lowpass'; muffle.frequency.value = 20000;
      hi.g.connect(muffle); lo.g.connect(muffle); muffle.connect(this.waterFilter);
      this.rain = { hi, lo, muffle, real: true };
    }
    if (!this.rain) {
      const mk = (type, f, q) => {
        const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
        src.playbackRate.value = 0.8 + Math.random() * 0.4;
        const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
        const g = c.createGain(); g.gain.value = 0;
        src.connect(fl); fl.connect(g); src.start();
        return { fl, g };
      };
      const hi = mk('bandpass', 3200, 0.5), lo = mk('lowpass', 900, 0.4);
      const muffle = c.createBiquadFilter(); muffle.type = 'lowpass'; muffle.frequency.value = 20000;
      hi.g.connect(muffle); lo.g.connect(muffle); muffle.connect(this.waterFilter);
      this.rain = { hi, lo, muffle };
      this.dropT = 0;
    }
    const now = c.currentTime;
    const v = snow ? intensity * 0.15 : intensity;
    if (this.rain.real) {
      this.rain.hi.g.gain.setTargetAtTime(Math.max(0, v - 0.4) * 0.6, now, 0.8);
      this.rain.lo.g.gain.setTargetAtTime(Math.min(1, v * 1.6) * 0.35, now, 0.8);
    } else {
      this.rain.hi.g.gain.setTargetAtTime(v * 0.05, now, 0.6);
      this.rain.lo.g.gain.setTargetAtTime(v * 0.08, now, 0.6);
    }
    this.rain.muffle.frequency.setTargetAtTime(covered ? 700 : 20000, now, 0.4);
  }

  // gotas sueltas en el techo/hojas cuando llueve
  rainDrip(intensity) {
    if (!this.ctx || intensity < 0.2) return;
    if (Math.random() < intensity * 0.5) {
      const f = 1800 + Math.random() * 2600;
      const g = this.ctx.createGain(); g.gain.value = 0.02 * intensity;
      const p = this.ctx.createStereoPanner(); p.pan.value = Math.random() * 2 - 1;
      g.connect(p); p.connect(this.sfx);
      this.tone(f, 0.05, 0.6, 'sine', f * 0.6, 0, g, 0.002);
    }
  }

  // Trueno: chasquido cercano + retumbe grave largo; más lejos, más grave y más suave.
  thunder(dist) {
    if (!this.ctx) return;
    if (this.buffer('trueno')) {
      const near = Math.max(0, 1 - dist / 340);
      const src = this.play('trueno', { vol: 0.35 + near * 0.65, pitch: 0.8 + near * 0.25, vary: 0.05 });
      if (src && near < 0.6) {
        // opacar los lejanos
        const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400 + near * 2500;
        src.disconnect(); const g = this.ctx.createGain(); g.gain.value = 0.35 + near * 0.65;
        src.connect(f); f.connect(g); g.connect(this.sfx);
      }
      return;
    }
    const near = Math.max(0, 1 - dist / 340);
    const out = this.ctx.createGain(); out.gain.value = 0.5 + near * 0.7;
    out.connect(this.sfx);
    if (near > 0.5) this.noise(0.25, 2500, 0.5, 0.6 * near, 'highpass', 0, out, 0.002);
    this.noise(3.5 + (1 - near) * 2, 120 + near * 200, 0.4, 0.9, 'lowpass', 0.02, out, 0.08);
    for (let i = 0; i < 6; i++) this.noise(0.6 + Math.random(), 70 + Math.random() * 120, 0.6, 0.35 * (0.5 + near), 'lowpass', 0.2 + Math.random() * 2.5, out, 0.15);
  }

  // ---------- ambiente grabado ----------
  startAmbience() {
    if (this.amb) return;
    const c = this.ctx;
    const amb = this.amb = { layers: {} };
    amb.out = c.createGain();
    amb.out.gain.value = 1;
    amb.out.connect(this.waterFilter);
    const layer = (bank, idx = 0) => {
      const files = this.banks[bank];
      const buf = files && this.buffers.get(files[Math.min(idx, files.length - 1)]);
      if (!buf) return null;
      const src = c.createBufferSource();
      src.buffer = buf; src.loop = true;
      const g = c.createGain(); g.gain.value = 0;
      src.connect(g); g.connect(amb.out);
      src.start(c.currentTime, Math.random() * buf.duration);
      return g;
    };
    amb.layers = {
      birds: layer('loop.birds', 0), jungle: layer('loop.birds', 1), crickets: layer('loop.crickets'),
      wind: layer('loop.wind'), cave: layer('loop.cave'), underwater: layer('loop.underwater'),
      jungleDay: layer('loop.jungle_day'), jungleNight: layer('loop.jungle_night'), frogs: layer('loop.frogs'),
      waves: layer('loop.waves'), river: layer('loop.river'), bees: layer('loop.bees'),
      pueblo: layer('loop.pueblo', 0), gaviotas: layer('loop.gaviotas'),
      lava: layer('loop.lava'), volcan: layer('loop.volcan'),
    };
  }

  // Mezcla del ambiente según el entorno: { cave, water, trees, y, daylight, underwater }
  ambience(dt, s) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.reverbSend.gain.setTargetAtTime(0.04 + s.cave * 0.5 * (0.6 + 0.8 * (s.sala ?? 0.5)), now, 0.6); // v13.1.2: el eco crece con el tamaño de la sala (s.sala 0–1)
    this.waterFilter.frequency.setTargetAtTime(s.underwater ? 600 : 20000, now, 0.08);
    this.updateEmitters();
    if (!this.amb) return;
    // volviendo a un mundo: el ambiente sube de nuevo
    if (this.worldMuted) { this.worldMuted = false; this.amb.out.gain.setTargetAtTime(1, now, 0.6); }
    const L = this.amb.layers;
    const open = 1 - s.cave;
    const day = Math.max(0, Math.min(1, (s.daylight - 0.35) / 0.4));
    const night = 1 - Math.max(0, Math.min(1, (s.daylight - 0.15) / 0.3));
    const height = Math.max(0, Math.min(1, (s.y - 68) / 40));
    const uw = s.underwater ? 1 : 0;
    const set = (g, v) => { if (g) g.gain.setTargetAtTime(Math.max(0, v), now, 1.2); };
    set(L.birds, 0.16 * day * open * s.trees * (1 - uw) * (1 - height * 0.7));
    set(L.jungle, 0.1 * day * open * Math.max(0, s.trees - 0.4) * (1 - uw));
    set(L.crickets, 0.12 * night * open * (1 - uw) * (1 - height * 0.5));
    set(L.wind, (0.03 + height * 0.16) * open * (1 - uw));
    set(L.cave, 0.22 * Math.max(0, s.cave - 0.4) / 0.6 * (1 - uw));
    if (L.underwater) L.underwater.gain.setTargetAtTime(0.35 * uw, now, 0.15);
    const jungle = s.biome === 'jungle' ? 1 : s.biome === 'nuboso' || s.biome === 'manglar' ? 0.7 : s.biome === 'forest' ? 0.35 : 0;
    const rainy = s.rain || 0;
    set(L.jungleDay, 0.22 * day * open * jungle * (1 - uw) * (1 - rainy * 0.6));
    set(L.jungleNight, 0.26 * night * open * Math.max(jungle, 0.25) * (1 - uw));
    set(L.frogs, 0.16 * Math.max(night, rainy) * open * Math.max(jungle, s.water) * (1 - uw));
    set(L.waves, 0.3 * (s.ocean || 0) * open * (1 - uw));
    set(L.river, 0.2 * (s.water || 0) * (1 - (s.ocean || 0)) * open * (1 - uw));
    set(L.bees, 0.15 * (s.hive || 0) * day);
    set(L.lava, 0.32 * (s.infra || 0));
    set(L.volcan, 0.22 * Math.max(s.infra || 0, s.volcan || 0));
    set(L.gaviotas, 0.12 * (s.ocean || 0) * day * open * (1 - uw) * (1 - rainy * 0.8));
    set(L.pueblo, 0.11 * (s.pueblo || 0) * day * open * (1 - uw) * (1 - rainy * 0.7));
  }
}
