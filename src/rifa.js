// La Rifa Dominical (ficticia): en la pulpería y el minisúper se venden fracciones (₡2). El domingo a mediodía la radio canta el
// número y se revisan las fracciones que uno tenga: alguna puede traer premio chiquito (₡10) y, muy de vez en cuando, el gordito
// (₡250). Como toda rifa, la casa gana: en promedio se pierde un poco (no es negocio). Estado: meta.rifaDia (último domingo cantado).
export const FRACCION = 533;
const COLON = 360, TOPE = 10;
export const domingo = (g) => ((g.day || 1) % 7) === 0;
// cada segundo
export function tickRifa(g) {
  if (!g.meta || !domingo(g) || g.meta.rifaDia === g.day) return;
  if ((g.time || 0) < 0.22) return; // a mediodía
  g.meta.rifaDia = g.day;
  const n = Math.min(TOPE, g.inventory.count(FRACCION));
  const numero = String(Math.floor(Math.random() * 100)).padStart(2, '0'), serie = 100 + Math.floor(Math.random() * 900);
  if (!n) { if (g.dim === 'tierra' && Math.random() < 0.5) g.ui.toast(`📻 Radio Marimba: «Ya se cantó la Rifa Dominical: salió el ${numero}, serie ${serie}. ¡Felicidades al ganador!»`, 4200); return; }
  g.inventory.remove(FRACCION, g.inventory.count(FRACCION));
  let premio = 0, gordo = false;
  for (let i = 0; i < n; i++) { const r = Math.random(); if (r < 1 / 200) { premio += 250; gordo = true; } else if (r < 1 / 200 + 1 / 25) premio += 10; }
  g.audio.play('campana', { ui: true, vol: 0.4, pitch: 1.3 });
  if (premio) {
    g.giveItem(COLON, premio);
    g.audio.play('monedas', { ui: true, vol: 0.8 });
    g.ui.toast(gordo ? `📻 «¡Salió el ${numero}, serie ${serie}!»… ¡Es SU fracción! ¡Se sacó el gordito: ₡${premio}! El pueblo entero lo va a saber` : `📻 Salió el ${numero}. Una de sus ${n} fracciones trae premio chiquito: ₡${premio}. Algo es algo`, 5200);
    g.achieve('rifa', 'Premio en la Rifa Dominical');
    if (gordo) g.achieve('rifa_gordo', '¡Me saqué el gordito!');
  } else g.ui.toast(`📻 Salió el ${numero}, serie ${serie}. Sus ${n} fracciones, ni la terminación. «El otro domingo sí», dicen todos`, 4200);
}
export function pruebaRifa(g) {
  g.giveItem(FRACCION, 5);
  g.day = Math.ceil((g.day || 1) / 7) * 7; g.time = 0.25; g.meta.rifaDia = 0;
  return 'Cinco fracciones y ya es domingo a mediodía: en un segundo cantan la rifa';
}
