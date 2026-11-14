// Regiones de Costa Rica: se deducen del clima y la altura del terreno (calor, humedad, bioma), así cada zona del
// mundo tiene nombre y sentido: Guanacaste seco, Caribe húmedo, Valle Central templado, cordillera fría…
// Sirve para el letrero al entrar, para nombrar los pueblos y para el mapa. Sin gráficos.

export const REGIONES = {
  guanacaste: { name: 'Guanacaste', lema: 'Tierra de sabaneros, bajura y sol', towns: ['Liberia', 'Nicoya', 'Santa Cruz', 'Filadelfia', 'Cañas', 'Bagaces', 'Tilarán', 'Hojancha'] },
  valle: { name: 'Valle Central', lema: 'Cafetales, iglesias y neblina de la mañana', towns: ['San Rafael', 'Santa Bárbara', 'Palmares', 'Atenas', 'Naranjo', 'Sarchí', 'Grecia', 'Barva', 'Santo Domingo', 'Tres Ríos', 'Escazú', 'Puriscal'] },
  caribe: { name: 'Caribe', lema: 'Calipso, rice and beans y selva hasta el mar', towns: ['Siquirres', 'Guápiles', 'Matina', 'Batán', 'Cariari', 'Puerto Viejo', 'Bribri', 'Pocora'] },
  sur: { name: 'Zona Sur', lema: 'Selva, ríos y el Pacífico más verde', towns: ['Pérez Zeledón', 'San Vito', 'Palmar Norte', 'Ciudad Neily', 'Golfito', 'Buenos Aires', 'Osa', 'Uvita'] },
  norte: { name: 'Zona Norte', lema: 'Llanuras, piñales y volcanes en el horizonte', towns: ['Upala', 'Los Chiles', 'Guatuso', 'Ciudad Quesada', 'Pital', 'Aguas Zarcas', 'Florencia'] },
  pacifico: { name: 'Pacífico Central', lema: 'Playas, manglares y atardeceres dorados', towns: ['Esparza', 'Orotina', 'Jacó', 'Parrita', 'Quepos', 'Miramar', 'Garabito'] },
  nuboso: { name: 'Bosque nuboso', lema: 'Musgo, quetzales y nubes que pasan entre los árboles', towns: ['Monteverde', 'Santa Elena', 'San Gerardo', 'Vara Blanca'] },
  cordillera: { name: 'Cordillera de Talamanca', lema: 'Páramo, frío y el techo de Costa Rica', towns: ['División', 'Cerro de la Muerte', 'Providencia'] },
  mar: { name: 'Mar abierto', lema: 'Azul hasta donde da la vista', towns: ['Isla Chira'] },
};

export function regionOf(col) {
  const b = col.biome;
  if (b === 'ocean') return 'mar';
  if (b === 'paramo' || col.h > 98 || b === 'snowy') return 'cordillera';
  if (b === 'nuboso') return 'nuboso';
  if (b === 'bosque_seco' || (col.temp > 0.1 && col.wet < -0.05)) return 'guanacaste';
  if (b === 'jungle') return col.wet > 0.38 ? 'caribe' : 'sur';
  if (b === 'manglar' || b === 'beach') return col.wet > 0.3 ? 'caribe' : 'pacifico';
  if (col.h >= 70 && col.h <= 98) return 'valle';
  if (col.wet > 0.2) return 'norte';
  return col.temp > 0.05 ? 'pacifico' : 'valle';
}

export function regionAt(gen, x, z) { return regionOf(gen.column(Math.floor(x), Math.floor(z))); }
