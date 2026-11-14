// Inventario (36 espacios: 0-8 barra rápida). Las recetas están en recipes.js.
import { ITEMS, maxStack, getDef } from './blocks.js';
import { COLON, K, VALOR, VIEJAS, desglose } from './plata.js';

export const SLOTS = 36;
// la plata (plata.js): count(COLON) y remove(COLON, n) hablan en unidades del juego (cada una vale K colones)
export { COLON } from './plata.js';

// lo que no se puede volver a conseguir: nada se lo puede robar
export const esUnico = (id) => { const d = getDef(id); return !!d && (d.trofeo || d.key === 'corazon_tiquicia' || id === 490 || id === 1190 || id === 1191 || id === 698 || (id >= 510 && id <= 520) || id === 522 || (id >= 495 && id <= 498) || (id >= 502 && id <= 507)); }; // pedazos, Permiso de Todo, maletín y reliquias
// lo que el objeto lleva encima, para que no se pierda al tirarlo, recogerlo o sacarlo de la cuadrícula
export const extras = (s) => (s && (s.mejora || s.filo || s.cruda || s.dia !== undefined) ? { ...(s.mejora ? { mejora: s.mejora } : {}), ...(s.filo ? { filo: s.filo } : {}), ...(s.cruda ? { cruda: true } : {}), ...(s.dia !== undefined ? { dia: s.dia } : {}) } : undefined); // cruda: el agua sin hervir sigue sin hervir; dia (v12.1.0): la comida no se renueva al tirarla y recogerla

// v12.4.1: junta n piezas en la pila t; la fecha de la comida (dia) queda en el promedio ponderado por cantidad. Lo que no tiene fecha
// cuenta como de hoy (si se sabe el día), así la carne fresca no toma la fecha de una pila vieja ni la vieja se rejuvenece entera
export function juntar(t, n, dia, hoy) {
  if (n <= 0) return;
  if (dia !== undefined || t.dia !== undefined) {
    const a = t.dia ?? hoy ?? dia, b = dia ?? hoy ?? t.dia;
    if (a !== undefined && b !== undefined) t.dia = (a * t.count + b * n) / (t.count + n); // v12.4.4: sin redondear (se rejuvenecía media jornada)
  }
  t.count += n;
}

export class Inventory {
  constructor() {
    this.slots = new Array(SLOTS).fill(null); // { id, count, dur? }
    this.armor = [null, null, null, null, null]; // casco, pechera, pantalones, botas, escudo
    this.selected = 0;
    this.billetera = {}; // v11.10.5: la plata no ocupa casillas (id de la pieza → cuántas)
    this.onChange = null;
  }

  changed() { if (this.onChange) this.onChange(); }

  get held() { return this.slots[this.selected]; }

  // Agrega y devuelve cuántos no cupieron. `extra`: lo que el objeto lleva encima (mejora, aceite).
  add(id, count = 1, dur, extra) {
    (this.vistos ||= {})[id] = (this.reloj = (this.reloj || 0) + 1); // v11.12.0: para ordenar por «recientes»
    if (id === COLON && !extra) return this.darColones(count * K); // la plata entra ya acomodada en la menor cantidad de piezas
    if (VALOR[id] && VIEJAS.has(id)) { this.darColones(count * VALOR[id]); return 0; } // un billete viejo: se cambia por piezas de verdad
    if (VALOR[id]) { this.billetera[id] = (this.billetera[id] || 0) + count; this.changed(); return 0; } // una pieza recogida: a la billetera
    const max = maxStack(id);
    let left = count;
    if (max > 1) {
      for (let i = 0; i < SLOTS && left > 0; i++) {
        const s = this.slots[i];
        if (s && s.id === id && s.count < max) {
          const n = Math.min(left, max - s.count);
          juntar(s, n, extra && extra.dia, this.hoy); left -= n;
        }
      }
    }
    for (let i = 0; i < SLOTS && left > 0; i++) {
      if (!this.slots[i]) {
        const n = Math.min(left, max);
        this.slots[i] = { id, count: n };
        if (ITEMS[id] && ITEMS[id].durability) this.slots[i].dur = dur ?? ITEMS[id].durability;
        if (extra) Object.assign(this.slots[i], extra);
        left -= n;
      }
    }
    this.changed();
    return left;
  }

  count(id) {
    if (id === COLON) return Math.floor(this.colones() / K); // la plata: en unidades, con todas las monedas y billetes
    let n = 0;
    for (const s of this.slots) if (s && s.id === id) n += s.count;
    return n;
  }
  // la plata: lo de la billetera más las piezas que uno haya sacado a las casillas (para dar, botar o guardar)
  colones() {
    let c = 0;
    for (const [id, n] of Object.entries(this.billetera)) c += (VALOR[id] || 0) * n;
    for (const s of this.slots) if (s && VALOR[s.id]) c += s.count * VALOR[s.id];
    return c;
  }
  enBilletera() { let c = 0; for (const [id, n] of Object.entries(this.billetera)) c += (VALOR[id] || 0) * n; return c; }
  // sacar piezas de la billetera (al cursor): devuelve la pila o null
  sacarPlata(id, n) {
    const hay = this.billetera[id] || 0, q = Math.min(hay, n, maxStack(+id)); // v11.13.3: nunca más que una pila
    if (q <= 0) return null;
    this.billetera[id] = hay - q; if (!this.billetera[id]) delete this.billetera[id];
    this.changed();
    return { id: +id, count: q };
  }
  meterPlata(s) { if (!s || !VALOR[s.id]) return false; this.billetera[s.id] = (this.billetera[s.id] || 0) + s.count; this.changed(); return true; }

  remove(id, count) {
    if (id === COLON) return Math.floor(this.pagarColones(count * K) / K);
    let left = count;
    for (let i = SLOTS - 1; i >= 0 && left > 0; i--) {
      const s = this.slots[i];
      if (s && s.id === id) {
        const n = Math.min(left, s.count);
        s.count -= n; left -= n;
        if (s.count <= 0) this.slots[i] = null;
      }
    }
    this.changed();
    return count - left;
  }
  // pagar en colones: se saca toda la plata y vuelve lo que sobra en la menor cantidad de piezas (el vuelto ya va adentro)
  pagarColones(c) {
    const total = this.colones(), paga = Math.min(total, Math.max(0, Math.round(c)));
    this.reacomodarPlata(total - paga);
    return paga;
  }
  // recibir colones: igual, todo junto en la menor cantidad de piezas. Devuelve las unidades que no cupieron
  darColones(c) {
    const sobra = this.reacomodarPlata(this.colones() + Math.max(0, Math.round(c)));
    return Math.ceil(sobra / K);
  }
  // deja exactamente `total` colones en la billetera, en la menor cantidad de piezas (las que estaban sacadas en casillas entran)
  reacomodarPlata(total) {
    for (let i = 0; i < SLOTS; i++) if (this.slots[i] && VALOR[this.slots[i].id]) this.slots[i] = null;
    this.billetera = {};
    for (const [id, n] of desglose(total)) this.billetera[id] = n;
    this.changed();
    return 0;
  }
  // en cualquier comerciante: juntar todo en billetes, o partirlo en monedas de 500 (lo menudo se queda como está)
  cambiar(aBilletes) {
    const total = this.enBilletera();
    if (!total) return 0;
    if (aBilletes) { const sacadas = this.colones() - total; this.reacomodarPlata(total + sacadas); return total; }
    const q = Math.floor(total / 500), resto = total - q * 500;
    this.billetera = q ? { [COLON]: q } : {};
    for (const [id, n] of desglose(resto)) this.billetera[id] = (this.billetera[id] || 0) + n;
    this.changed();
    return total;
  }

  consumeHeld(n = 1) {
    const s = this.slots[this.selected];
    if (!s) return;
    s.count -= n;
    if (s.count <= 0) {
      this.slots[this.selected] = null;
      // se acabó: se rellena solo con el mismo ítem de la mochila (antorchas, bloques, comida…)
      for (let i = 9; i < this.slots.length; i++) if (this.slots[i] && this.slots[i].id === s.id) { this.slots[this.selected] = this.slots[i]; this.slots[i] = null; break; }
    }
    this.changed();
  }

  // Desgasta la herramienta en la mano. Devuelve true si se rompió.
  wearHeld() {
    const s = this.slots[this.selected];
    if (!s || s.dur === undefined) return false;
    if (ITEMS[s.id] && ITEMS[s.id].agua) return false; // la bomba de espalda: su «dur» es agua, no desgaste
    if (this.ahorro && Math.random() < this.ahorro) return false; // la hoja del cuaderno sobre cuidar las herramientas
    s.dur--;
    if (this.onWear) this.onWear(s);
    if (s.dur <= 0) {
      this.slots[this.selected] = null;
      // se rompió: si hay otra igual (o del mismo tipo) en la mochila, pasa a la mano
      const def = ITEMS[s.id];
      let j = this.slots.findIndex((o, i) => o && o.id === s.id && i !== this.selected);
      if (j < 0 && def && def.tool) j = this.slots.findIndex((o, i) => o && i !== this.selected && ITEMS[o.id] && ITEMS[o.id].tool === def.tool);
      if (j >= 9 || (j >= 0 && ITEMS[this.slots[j].id].tool)) { this.slots[this.selected] = this.slots[j]; this.slots[j] = null; }
      this.changed();
      return true;
    }
    this.changed();
    return false;
  }

  // Protección total de la armadura puesta
  armorValue() {
    let points = 0, tough = 0;
    for (const s of this.armor) if (s && ITEMS[s.id]) { points += ITEMS[s.id].points + (s.mejora || 0) * 0.25; tough += ITEMS[s.id].toughness; }
    return { points, tough };
  }

  // Cada golpe gasta un poco cada pieza. Devuelve true si alguna se rompió.
  wearArmor() {
    let broke = false;
    this.armor.forEach((s, i) => {
      if (!s || i === 4) return; // el escudo se gasta solo al bloquear
      s.dur = (s.dur ?? ITEMS[s.id].durability) - 1;
      if (this.onWear) this.onWear(s);
      if (s.dur <= 0) { this.armor[i] = null; broke = true; }
    });
    this.changed();
    return broke;
  }

  toJSON() { return { slots: this.slots, selected: this.selected, armor: this.armor, billetera: this.billetera }; }
  load(data) {
    if (!data) return;
    this.slots = new Array(SLOTS).fill(null);
    (data.slots || []).forEach((s, i) => { if (s && i < SLOTS) this.slots[i] = { ...s, ...(s.id === 550 ? { id: 374 } : {}) }; }); // 550: la bombeta que duró poco (v5.1–v5.5)
    this.selected = data.selected || 0;
    this.armor = [0, 1, 2, 3, 4].map((i) => (data.armor && data.armor[i] ? { ...data.armor[i] } : null));
    // la billetera (v11.10.5); los guardados de antes traen la plata en casillas: entra a la billetera al cargar
    this.billetera = { ...(data.billetera || {}) };
    for (let i = 0; i < SLOTS; i++) { const s = this.slots[i]; if (s && VALOR[s.id]) { this.billetera[s.id] = (this.billetera[s.id] || 0) + s.count; this.slots[i] = null; } }
    // los «billetes viejos» de 25 000 y 50 000 no existen: se cambian por piezas de verdad, por su valor
    if (Object.keys(this.billetera).some((id) => VIEJAS.has(+id))) { const t = this.enBilletera(); this.billetera = {}; for (const [id, n] of desglose(t)) this.billetera[id] = n; }
    this.changed();
  }
}
