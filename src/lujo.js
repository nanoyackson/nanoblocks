// Playa de lujo (generador v6): resort de cinco estrellas con piscina infinita, beach club, restaurante «de autor»,
// café de especialidad, estudio de yoga, inmobiliaria, villa en la loma, condominio cerrado, marina con yate y un
// proyecto abandonado… y al lado, la soda y el rancho de los de siempre. La sátira es contra los precios y la
// especulación, no contra la gente. La playa sigue siendo pública. +z local mira al mar. Sin gráficos.
import { BLOCK_BY_KEY as K } from './blocks.js';

// caja moderna: paredes, ventanales y techo plano (en coordenadas locales de la estructura)
function box(c, x0, z0, x1, z1, y0, h, wall, glassFront = true) {
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    for (let y = y0; y < y0 + h; y++) {
      if (!edge) { c.set(x, y, z, 0); continue; }
      const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
      const front = z === z1 && glassFront;
      c.set(x, y, z, corner ? K.concreto : front && y > y0 ? K.glass : y === y0 + h - 1 ? K.concreto : wall);
    }
    c.set(x, y0 + h, z, K.concreto);
    c.set(x, y0 - 1, z, K.smooth_stone);
  }
}
function palm(c, x, z, h = 6) {
  const g = c.ground(x, z);
  for (let y = Math.min(g, 0) + 1; y <= Math.max(g, 0) + h; y++) c.set(x, y, z, K.jungle_log);
  const top = Math.max(g, 0) + h + 1;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2], [1, 1], [-1, -1], [1, -1], [-1, 1]]) c.set(x + dx, top - (Math.abs(dx) + Math.abs(dz) > 1 ? 1 : 0), z + dz, K.jungle_leaves);
  c.set(x, top, z, K.jungle_leaves);
}

export function buildPlayaLujo(c) {
  c.foundation(-46, -46, 46, 6, K.cobble, K.smooth_stone, 30);
  // paseo y jardín
  for (let z = -46; z <= 6; z++) for (let x = -46; x <= 46; x++) if ((x + z) % 2 === 0 && z > -4) c.set(x, 0, z, K.calcite);
  // ---- resort: hotel escalonado de cuatro pisos ----
  for (let f = 0; f < 4; f++) box(c, -32 + f, -30, -6 - f, -10 - f * 3, 1 + f * 4, 4, K.plaster);
  for (let f = 1; f < 4; f++) for (let x = -31 + f; x <= -7 - f; x++) c.set(x, f * 4 + 1, -10 - f * 3 + 2, K.leaves);
  c.door(-19, 1, -10, 0); c.set(-18, 1, -10, 0); c.set(-18, 2, -10, 0);
  c.fill(-22, 1, -8, -16, 1, -8, K.losa_lisa);
  c.set(-24, 3, -14, K.lamp); c.set(-14, 3, -14, K.lamp);
  c.fill(-28, 1, -26, -24, 1, -26, K.planks);
  c.placa(-21, 2, -9, 0, 'Grand Ocean Paradise Resort ★★★★★', 'Habitación con vista al mar: ₡300 000 la noche (vista al parqueo: ₡250 000). Desayuno «Organic Authentic Breakfast Experience» (gallo pinto) no incluido.');
  // piscina infinita
  for (let z = -6; z <= 2; z++) for (let x = -30; x <= -8; x++) {
    const rim = x === -30 || x === -8 || z === -6;
    c.set(x, 0, z, rim ? K.calcite : K.water);
    if (z === 2) c.set(x, 0, z, K.glass);
  }
  for (let x = -28; x <= -10; x += 3) { c.set(x, 1, 4, K.losa_tablas); c.set(x, 1, 5, K.losa_tablas); }
  for (const x of [-34, -4]) palm(c, x, 0, 7);
  palm(c, -20, 6, 6);
  // ---- beach club ----
  for (let z = -2; z <= 8; z++) for (let x = 2; x <= 16; x++) c.set(x, 1, z, K.planks);
  c.fill(4, 2, -1, 12, 2, -1, K.planks); c.fill(4, 3, -1, 12, 3, -1, K.lamina_metal);
  for (let x = 4; x <= 12; x++) c.set(x, 4, -2, K.estante);
  for (const [x, z] of [[4, 4], [9, 4], [14, 4], [6, 7], [12, 7]]) {
    c.fill(x, 2, z, x, 4, z, K.cerca);
    c.circle(1.5, (dx, dz) => c.set(x + dx, 5, z + dz, K.wool));
    c.set(x + 1, 2, z, K.wool);
  }
  c.placa(2, 2, 0, 0, 'Ocean Breeze Beach Club', 'Entrada: ₡40 000 con consumo mínimo. Cóctel de pipa: ₡6 000 (la pipa de afuera vale ₡1.4, pero no tiene sombrilla).');
  // ---- fila de locales: restaurante de autor, café de especialidad, boutique ----
  const shops = [
    [4, 'The Casado Experience', 'Casado de autor deconstruido sobre espuma de frijol. ₡15 000. La vista al mar se cobra por separado.'],
    [14, 'Third Wave Coffee Lab', 'Café de especialidad con energía espiritual: ₡5 000. Leche de avena, almendra o de vaca feliz (+₡1 500).'],
    [24, 'Boutique Pura Vida™', 'Camiseta que dice «Pura Vida»: ₡28 000. Hecha muy lejos de aquí.'],
  ];
  for (const [x0, title, text] of shops) {
    box(c, x0, -24, x0 + 8, -14, 1, 5, K.lamina_metal);
    c.door(x0 + 4, 1, -14, 0);
    c.placa(x0 + 2, 2, -13, 0, title, text);
    c.fill(x0 + 1, 1, -22, x0 + 7, 1, -22, K.planks);
    c.set(x0 + 4, 4, -19, K.lamp);
  }
  // ---- estudio de yoga ----
  for (let z = -8; z <= 2; z++) for (let x = 30; x <= 40; x++) { c.set(x, 1, z, K.planks); c.set(x, 6, z, K.teja); }
  for (const [x, z] of [[30, -8], [40, -8], [30, 2], [40, 2]]) c.fill(x, 2, z, x, 5, z, K.jungle_log);
  for (let x = 32; x <= 38; x += 3) for (let z = -6; z <= 0; z += 3) c.set(x, 2, z, K.wool);
  c.placa(29, 2, 3, 0, 'Yoga Shala Namasté', 'Clase de yoga al atardecer: ₡25 000. Incluye respirar (el aire es gratis… por ahora).');
  // ---- inmobiliaria ----
  box(c, 18, -36, 28, -28, 1, 5, K.plaster);
  c.door(23, 1, -28, 0);
  c.placa(21, 2, -27, 0, 'Paradise Real Estate', 'Lote con vista al mar: ₡999 en el juego (en la vida real ni pregunte). Se aceptan dólares, criptomonedas y riñones.');
  c.fill(20, 1, -34, 26, 1, -34, K.planks);
  // ---- villa en la loma con piscina infinita ----
  for (let z = -46; z <= -34; z++) for (let x = -10; x <= 8; x++) for (let y = 1; y <= 4; y++) c.set(x, y, z, y === 4 ? K.smooth_stone : K.cobble);
  box(c, -8, -46, 6, -40, 5, 5, K.plaster);
  for (let z = -38; z <= -35; z++) for (let x = -8; x <= 6; x++) c.set(x, 4, z, z === -35 || x === -8 || x === 6 ? K.glass : K.water);
  for (let y = 1; y <= 4; y++) c.stair(K.escalera_piedra, 10, y, -31 - y, 2);
  c.chest(4, 5, -44, 0, c.loot([[360, 20, 60], [369, 1, 3], [259, 2, 5], [375, 1, 2]], 6));
  c.placa(9, 1, -30, 0, 'Villa Horizonte', 'Casa de vacaciones: se usa 2 semanas al año. El resto del tiempo la cuida Don Chepe, que vive en una cabina de alquiler en el pueblo.');
  // ---- condominio cerrado con caseta ----
  box(c, 34, -30, 38, -26, 1, 4, K.plaster);
  for (let x = 30; x <= 33; x++) c.set(x, 2, -28, K.barrera);
  for (let z = -46; z <= -32; z++) c.set(33, 1, z, K.verja);
  c.placa(34, 2, -25, 0, 'Condominio Las Palmas Exclusive', 'Solo residentes. Visitas: con cita, cédula y una carta de recomendación del Papa.');
  // ---- marina con yate ----
  for (let z = 6; z <= 30; z++) for (let x = 20; x <= 22; x++) {
    const g = c.ground(x, z);
    c.set(x, 0, z, K.planks);
    if (z % 4 === 0 && (x === 20 || x === 22)) for (let y = g; y < 0; y++) c.set(x, y, z, K.log);
  }
  for (let z = 16; z <= 26; z++) for (let x = 24; x <= 28; x++) {
    const hull = Math.abs(x - 26) <= (z < 18 ? 1 : 2);
    if (!hull) continue;
    c.set(x, 0, z, K.plaster);
    if (z > 18 && z < 25 && Math.abs(x - 26) <= 1) { c.set(x, 1, z, z % 2 ? K.glass : K.plaster); c.set(x, 2, z, K.plaster); }
  }
  c.placa(21, 1, 6, 0, 'Marina privada', 'Atracar un yate: ₡2 000 000 al mes. El muelle de los pescadores está al otro lado, y ese sí es gratis.');
  // ---- proyecto abandonado ----
  for (let x = 40; x <= 46; x += 3) for (let z = -24; z <= -12; z += 4) { c.fill(x, 1, z, x, 9, z, K.concreto); c.set(x, 10, z, K.varilla); }
  for (const y of [4, 8]) c.fill(40, y, -24, 46, y, -12, K.concreto);
  c.placa(42, 1, -11, 0, 'Próximamente: Ocean View Residences', 'Preventa desde 2015. Avance: el rótulo. Pregunte por nuestro plan de financiamiento.');
  // ---- los de siempre: soda y rancho de pescadores ----
  for (let z = -8; z <= 0; z++) for (let x = -46; x <= -38; x++) {
    const edge = x === -46 || x === -38 || z === -8;
    c.set(x, 1, z, K.planks);
    for (let y = 2; y <= 4; y++) c.set(x, y, z, edge ? (y === 3 && x % 2 ? K.glass : K.adobe) : 0);
    c.set(x, 5, z, K.zinc);
  }
  c.fill(-45, 2, -2, -40, 2, -2, K.planks);
  c.placa(-42, 2, 1, 0, 'Soda La Bendición', 'Casado ₡6, café ₡1.8, pipa ₡1.4. Aquí no hay vista al mar de pago: la vista es gratis y el casado viene con maduro.');
  c.placa(-1, 1, 7, 0, 'La playa es pública', 'En Costa Rica las playas son de todos: los primeros 50 metros desde el mar son zona pública. Nadie le puede cobrar por estar en la arena.');
  // ---- gente ----
  c.npc(-19, 1, -11, { role: 'recepcionista', name: 'Kendall (recepción)' });
  c.npc(8, 2, -2, { role: 'bartender', name: 'Brandon (bartender)' });
  c.npc(8, 1, -20, { role: 'chef_lujo', name: 'Chef Jean-Pierre Rodríguez' });
  c.npc(18, 1, -20, { role: 'barista_lujo', name: 'Barista Alessandro (de Desamparados)' });
  c.npc(23, 1, -32, { role: 'inmobiliaria', name: 'Steve (agente de bienes raíces)' });
  c.npc(35, 2, -2, { role: 'yogui', name: 'Instructora Luz Divina' });
  c.npc(36, 1, -24, { role: 'guarda_condominio', name: 'Don Rafa (guarda)' });
  c.npc(-42, 2, -5, { role: 'sodera_playa', name: 'Doña Mayela (soda)' });
  c.npc(-36, 1, 4, { role: 'desplazado', name: 'Don Chepe (vecino de toda la vida)' });
  c.npc(-14, 1, 4, { role: 'turista', name: 'Turista feliz' });
  c.npc(10, 2, 6, { role: 'turista', name: 'Turista con bloqueador' });
  c.npc(21, 1, 12, { role: 'pescador', name: 'Don Beto (pescador)' });
}
