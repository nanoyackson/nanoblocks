// Registro de bloques e ítems.
// IDs de bloque: 0–255 y, desde la v2.80, 600–1023 (bloques extendidos; los chunks se guardan en Uint16Array).
// Los ítems usan 256–599 y, desde la v12.4.11, 1100–1299 (EXT_ITEM: C5–C8; por encima de MAX_BLOCK, así que isBlockId da falso).
// Para saber si un ID es bloque: isBlockId(id). Al agregar ids, subir MIN_VERSION y MIN_IDS (version.js; lo vigila tools/revisar-version.mjs)
export const MAX_BLOCK = 1024, EXT_BLOCK = 600, EXT_ITEM = 1100, MAX_ITEM = 1300;
export const isBlockId = (id) => id >= 0 && (id < 256 || (id >= EXT_BLOCK && id < MAX_BLOCK));

export const AIR = 0;

// render: 'cube' (opaco), 'cutout' (cubo con huecos: hojas, vidrio), 'cross' (plantas), 'water',
//         'torch' (palito con llama), 'model' (lo dibuja stations.js: cofre, puerta)
// facing: el bloque mira hacia el jugador al colocarlo (usa tex.front en esa cara)
// station: se abre con clic derecho ('crafting' | 'furnace' | 'chest')
// tool: herramienta que acelera ('pickaxe' | 'axe' | 'shovel' | null)
// tier: nivel mínimo de pico para que suelte algo (0 = cualquier cosa)
// sound: tipo de sonido al romper/pisar
const defs = [
  { id: 1, key: 'grass', name: 'Bloque de pasto', tex: { top: 'grass_top', side: 'grass_side', bottom: 'dirt' }, hardness: 0.6, tool: 'shovel', sound: 'grass', drop: 2 },
  { id: 2, key: 'dirt', name: 'Tierra', tex: 'dirt', hardness: 0.5, tool: 'shovel', sound: 'gravel' },
  { id: 3, key: 'stone', name: 'Piedra', tex: 'stone', hardness: 1.5, tool: 'pickaxe', tier: 1, sound: 'stone', drop: 4 },
  { id: 4, key: 'cobble', name: 'Piedra labrada', tex: 'cobble', hardness: 2, tool: 'pickaxe', tier: 1, sound: 'stone' },
  { id: 5, key: 'sand', name: 'Arena', tex: 'sand', hardness: 0.5, tool: 'shovel', sound: 'sand', gravity: true },
  { id: 6, key: 'gravel', name: 'Grava', tex: 'gravel', hardness: 0.6, tool: 'shovel', sound: 'gravel', gravity: true },
  { id: 7, key: 'log', name: 'Tronco de roble', tex: { top: 'log_top', side: 'log_side', bottom: 'log_top' }, hardness: 2, tool: 'axe', sound: 'wood' },
  { id: 8, key: 'leaves', name: 'Hojas de roble', tex: 'leaves', render: 'cutout', hardness: 0.2, sound: 'leaves', drop: 0, leafy: true },
  { id: 9, key: 'planks', name: 'Tablas', tex: 'planks', hardness: 2, tool: 'axe', sound: 'wood' },
  { id: 10, key: 'glass', name: 'Vidrio', tex: 'glass', render: 'cutout', hardness: 0.3, sound: 'glass', drop: 0 },
  { id: 11, key: 'water', name: 'Agua', tex: 'water', render: 'water', solid: false, hardness: -1, sound: 'water', level: 8, source: true },
  { id: 12, key: 'bedrock', name: 'Roca madre', tex: 'bedrock', hardness: -1, sound: 'stone' },
  { id: 13, key: 'coal_ore', name: 'Mena de carbón', tex: 'ore_coal', hardness: 3, tool: 'pickaxe', tier: 1, sound: 'stone', drop: 257 },
  { id: 14, key: 'iron_ore', name: 'Mena de hierro', tex: 'ore_iron', hardness: 3, tool: 'pickaxe', tier: 2, sound: 'stone' },
  { id: 15, key: 'gold_ore', name: 'Mena de oro', tex: 'ore_gold', hardness: 3, tool: 'pickaxe', tier: 3, sound: 'stone' },
  { id: 16, key: 'diamond_ore', name: 'Mena de diamante', tex: 'ore_diamond', hardness: 3, tool: 'pickaxe', tier: 3, sound: 'stone', drop: 260 },
  { id: 17, key: 'snow_grass', name: 'Pasto nevado', tex: { top: 'snow', side: 'snow_side', bottom: 'dirt' }, hardness: 0.6, tool: 'shovel', sound: 'snow', drop: 2 },
  { id: 18, key: 'snow', name: 'Nieve', tex: 'snow', hardness: 0.2, tool: 'shovel', sound: 'snow' },
  { id: 19, key: 'ice', name: 'Hielo', tex: 'ice', hardness: 0.5, tool: 'pickaxe', sound: 'glass', drop: 0, slippery: true },
  { id: 20, key: 'cactus', name: 'Cactus', tex: { top: 'cactus_top', side: 'cactus_side', bottom: 'cactus_top' }, render: 'shape', boxes: [[1, 0, 1, 15, 16, 15]], hardness: 0.4, sound: 'cloth', needsSupport: [5, 20], hurts: true },
  { id: 21, key: 'sandstone', name: 'Arenisca', tex: { top: 'sandstone_top', side: 'sandstone_side', bottom: 'sandstone_top' }, hardness: 0.8, tool: 'pickaxe', tier: 1, sound: 'stone' },
  { id: 22, key: 'table', name: 'Mesa de trabajo', tex: { top: 'table_top', side: 'table_side', bottom: 'planks' }, hardness: 2.5, tool: 'axe', sound: 'wood', station: 'crafting' },
  { id: 23, key: 'bricks', name: 'Ladrillos', tex: 'bricks', hardness: 2, tool: 'pickaxe', tier: 1, sound: 'stone' },
  { id: 24, key: 'birch_log', name: 'Tronco de abedul', tex: { top: 'birch_top', side: 'birch_side', bottom: 'birch_top' }, hardness: 2, tool: 'axe', sound: 'wood' },
  { id: 25, key: 'birch_leaves', name: 'Hojas de abedul', tex: 'birch_leaves', render: 'cutout', hardness: 0.2, sound: 'leaves', drop: 0, leafy: true },
  { id: 26, key: 'wool', name: 'Lana', tex: 'wool', hardness: 0.8, sound: 'cloth' },
  { id: 27, key: 'tall_grass', name: 'Pasto alto', tex: 'tall_grass', render: 'cross', solid: false, hardness: 0, sound: 'grass', drop: 0, needsSupport: [1, 2, 17] },
  { id: 28, key: 'flower_red', name: 'Flor roja', tex: 'flower_red', render: 'cross', solid: false, hardness: 0, sound: 'grass', needsSupport: [1, 2, 17] },
  { id: 29, key: 'flower_yellow', name: 'Flor amarilla', tex: 'flower_yellow', render: 'cross', solid: false, hardness: 0, sound: 'grass', needsSupport: [1, 2, 17] },
  { id: 30, key: 'bookshelf', name: 'Librero', tex: { top: 'planks', side: 'bookshelf', bottom: 'planks' }, hardness: 1.5, tool: 'axe', sound: 'wood' },
  { id: 31, key: 'dynamite', name: 'Dinamita', tex: { top: 'dyn_top', side: 'dyn_side', bottom: 'dyn_top' }, hardness: 0, sound: 'cloth', explosive: true },
  { id: 32, key: 'mossy', name: 'Piedra musgosa', tex: 'mossy', hardness: 2, tool: 'pickaxe', tier: 1, sound: 'stone' },
  { id: 33, key: 'clay', name: 'Barro', tex: 'clay', hardness: 0.6, tool: 'shovel', sound: 'gravel' },
  { id: 34, key: 'lamp', name: 'Lámpara', tex: 'lamp', hardness: 0.3, sound: 'glass', glow: true, toggleTo: 'lamp_off' },
  { id: 35, key: 'furnace', name: 'Horno', tex: { top: 'furnace_top', side: 'furnace_side', bottom: 'furnace_top', front: 'furnace_front' }, hardness: 3.5, tool: 'pickaxe', tier: 1, sound: 'stone', facing: true, station: 'furnace' },
  { id: 36, key: 'furnace_lit', name: 'Horno encendido', tex: { top: 'furnace_top', side: 'furnace_side', bottom: 'furnace_top', front: 'furnace_front_lit' }, hardness: 3.5, tool: 'pickaxe', tier: 1, sound: 'stone', facing: true, station: 'furnace', glow: true, drop: 35, hidden: true },
  { id: 37, key: 'chest', name: 'Cofre', tex: { top: 'cofre_tapa', side: 'cofre_madera', bottom: 'cofre_madera', front: 'chest_front' }, render: 'model', hardness: 2.5, tool: 'axe', sound: 'wood', facing: true, station: 'chest', collide: [[1, 0, 1, 15, 14, 15]] },
  { id: 38, key: 'door_lower', name: 'Puerta', tex: 'door', render: 'model', hardness: 3, tool: 'axe', sound: 'wood', drop: 266, door: true, hidden: true },
  { id: 39, key: 'door_upper', name: 'Puerta', tex: 'door', render: 'model', hardness: 3, tool: 'axe', sound: 'wood', drop: 0, door: true, upper: true, hidden: true },
  { id: 40, key: 'door_lower_open', name: 'Puerta', tex: 'door', render: 'model', solid: false, hardness: 3, tool: 'axe', sound: 'wood', drop: 266, door: true, open: true, hidden: true },
  { id: 41, key: 'door_upper_open', name: 'Puerta', tex: 'door', render: 'model', solid: false, hardness: 3, tool: 'axe', sound: 'wood', drop: 0, door: true, upper: true, open: true, hidden: true },
  { id: 42, key: 'torch', name: 'Antorcha', tex: 'torch', render: 'torch', solid: false, hardness: 0, sound: 'wood', glow: true, needsSolidBelow: true },
  // ---- v1.3: cultivos ----
  { id: 43, key: 'farmland', name: 'Tierra arada', tex: { top: 'farmland', side: 'dirt', bottom: 'dirt' }, hardness: 0.6, tool: 'shovel', sound: 'gravel', drop: 2 },
  { id: 44, key: 'farmland_wet', name: 'Tierra arada húmeda', tex: { top: 'farmland_wet', side: 'dirt', bottom: 'dirt' }, hardness: 0.6, tool: 'shovel', sound: 'gravel', drop: 2, hidden: true },
  { id: 45, key: 'corn0', name: 'Maíz', tex: 'corn0', render: 'cross', solid: false, hardness: 0, sound: 'grass', drop: 0, needsSupport: [43, 44], crop: 'corn', stage: 0, hidden: true },
  { id: 46, key: 'corn1', name: 'Maíz', tex: 'corn1', render: 'cross', solid: false, hardness: 0, sound: 'grass', drop: 0, needsSupport: [43, 44], crop: 'corn', stage: 1, hidden: true },
  { id: 47, key: 'corn2', name: 'Maíz', tex: 'corn2', render: 'cross', solid: false, hardness: 0, sound: 'grass', drop: 0, needsSupport: [43, 44], crop: 'corn', stage: 2, hidden: true },
  { id: 48, key: 'corn3', name: 'Maíz', tex: 'corn3', render: 'cross', solid: false, hardness: 0, sound: 'grass', drop: 0, needsSupport: [43, 44], crop: 'corn', stage: 3, hidden: true },
  { id: 49, key: 'beans0', name: 'Frijolar', tex: 'beans0', render: 'cross', solid: false, hardness: 0, sound: 'grass', drop: 0, needsSupport: [43, 44], crop: 'beans', stage: 0, hidden: true },
  { id: 50, key: 'beans1', name: 'Frijolar', tex: 'beans1', render: 'cross', solid: false, hardness: 0, sound: 'grass', drop: 0, needsSupport: [43, 44], crop: 'beans', stage: 1, hidden: true },
  { id: 51, key: 'beans2', name: 'Frijolar', tex: 'beans2', render: 'cross', solid: false, hardness: 0, sound: 'grass', drop: 0, needsSupport: [43, 44], crop: 'beans', stage: 2, hidden: true },
  { id: 52, key: 'beans3', name: 'Frijolar', tex: 'beans3', render: 'cross', solid: false, hardness: 0, sound: 'grass', drop: 0, needsSupport: [43, 44], crop: 'beans', stage: 3, hidden: true },
  // ---- v1.3: cuevas y minerales ----
  { id: 53, key: 'lava', name: 'Lava', tex: 'lava', render: 'lava', solid: false, hardness: -1, sound: 'water', glow: true, level: 8, source: true, hidden: true },
  { id: 54, key: 'obsidian', name: 'Obsidiana', tex: 'obsidian', hardness: 25, tool: 'pickaxe', tier: 4, sound: 'stone' },
  { id: 55, key: 'deep_rock', name: 'Roca profunda', tex: { top: 'deep_rock_top', side: 'deep_rock', bottom: 'deep_rock_top' }, hardness: 3, tool: 'pickaxe', tier: 1, sound: 'stone' },
  { id: 56, key: 'deep_iron_ore', name: 'Mena de hierro profunda', tex: 'deep_ore_iron', hardness: 4.5, tool: 'pickaxe', tier: 2, sound: 'stone' },
  { id: 57, key: 'deep_gold_ore', name: 'Mena de oro profunda', tex: 'deep_ore_gold', hardness: 4.5, tool: 'pickaxe', tier: 3, sound: 'stone' },
  { id: 58, key: 'deep_diamond_ore', name: 'Mena de diamante profunda', tex: 'deep_ore_diamond', hardness: 4.5, tool: 'pickaxe', tier: 3, sound: 'stone', drop: 260 },
  { id: 59, key: 'jade_ore', name: 'Mena de jade', tex: 'ore_jade', hardness: 6, tool: 'pickaxe', tier: 4, sound: 'stone', drop: 273, glowDim: true },
  { id: 60, key: 'glow_mushroom', name: 'Hongo brillante', tex: 'glow_mushroom', render: 'cross', solid: false, hardness: 0, sound: 'leaves', glow: true, needsSolidBelow: true },
  { id: 61, key: 'moss', name: 'Musgo', tex: 'moss', hardness: 0.3, tool: 'shovel', sound: 'cloth' },
  { id: 62, key: 'stalactite', name: 'Estalactita', tex: 'stalactite', render: 'cross', solid: false, hardness: 1, tool: 'pickaxe', sound: 'stone', needsSolidAbove: true },
  { id: 63, key: 'stalagmite', name: 'Estalagmita', tex: 'stalagmite', render: 'cross', solid: false, hardness: 1, tool: 'pickaxe', sound: 'stone', needsSolidBelow: true },
  { id: 64, key: 'quartz_block', name: 'Cristal de cuarzo', tex: 'quartz_block', render: 'cutout', hardness: 1.5, tool: 'pickaxe', sound: 'glass', drop: 272, glow: true },
  { id: 65, key: 'calcite', name: 'Calcita', tex: 'calcite', hardness: 0.8, tool: 'pickaxe', tier: 1, sound: 'stone' },
  { id: 66, key: 'basalt', name: 'Basalto', tex: { top: 'basalt_top', side: 'basalt', bottom: 'basalt_top' }, hardness: 1.3, tool: 'pickaxe', tier: 1, sound: 'stone' },
  // antorchas en la pared (el número es hacia dónde apuntan, lejos de la pared)
  { id: 67, key: 'wall_torch0', name: 'Antorcha', tex: 'torch', render: 'torch', solid: false, hardness: 0, sound: 'wood', glow: true, drop: 42, wall: 0, hidden: true },
  { id: 68, key: 'wall_torch1', name: 'Antorcha', tex: 'torch', render: 'torch', solid: false, hardness: 0, sound: 'wood', glow: true, drop: 42, wall: 1, hidden: true },
  { id: 69, key: 'wall_torch2', name: 'Antorcha', tex: 'torch', render: 'torch', solid: false, hardness: 0, sound: 'wood', glow: true, drop: 42, wall: 2, hidden: true },
  { id: 70, key: 'wall_torch3', name: 'Antorcha', tex: 'torch', render: 'torch', solid: false, hardness: 0, sound: 'wood', glow: true, drop: 42, wall: 3, hidden: true },
  { id: 71, key: 'quartz_lamp', name: 'Lámpara de cuarzo', tex: 'quartz_lamp', hardness: 0.5, sound: 'glass', glow: true },
  // ---- v1.3: agua y lava con niveles (1 = casi seco, 8 = lleno) ----
  { id: 72, key: 'water_flow1', name: 'Agua', tex: 'water', render: 'water', solid: false, hardness: -1, sound: 'water', level: 1, hidden: true },
  { id: 73, key: 'water_flow2', name: 'Agua', tex: 'water', render: 'water', solid: false, hardness: -1, sound: 'water', level: 2, hidden: true },
  { id: 74, key: 'water_flow3', name: 'Agua', tex: 'water', render: 'water', solid: false, hardness: -1, sound: 'water', level: 3, hidden: true },
  { id: 75, key: 'water_flow4', name: 'Agua', tex: 'water', render: 'water', solid: false, hardness: -1, sound: 'water', level: 4, hidden: true },
  { id: 76, key: 'water_flow5', name: 'Agua', tex: 'water', render: 'water', solid: false, hardness: -1, sound: 'water', level: 5, hidden: true },
  { id: 77, key: 'water_flow6', name: 'Agua', tex: 'water', render: 'water', solid: false, hardness: -1, sound: 'water', level: 6, hidden: true },
  { id: 78, key: 'water_flow7', name: 'Agua', tex: 'water', render: 'water', solid: false, hardness: -1, sound: 'water', level: 7, hidden: true },
  { id: 79, key: 'water_fall', name: 'Agua', tex: 'water', render: 'water', solid: false, hardness: -1, sound: 'water', level: 8, falling: true, hidden: true },
  { id: 80, key: 'lava_flow1', name: 'Lava', tex: 'lava', render: 'lava', solid: false, hardness: -1, sound: 'water', glow: true, level: 2, hidden: true },
  { id: 81, key: 'lava_flow2', name: 'Lava', tex: 'lava', render: 'lava', solid: false, hardness: -1, sound: 'water', glow: true, level: 4, hidden: true },
  { id: 82, key: 'lava_flow3', name: 'Lava', tex: 'lava', render: 'lava', solid: false, hardness: -1, sound: 'water', glow: true, level: 6, hidden: true },
  // ---- v1.3: selva, ruinas y monumentos ----
  { id: 84, key: 'jungle_log', name: 'Tronco de selva', tex: { top: 'jungle_log_top', side: 'jungle_log', bottom: 'jungle_log_top' }, hardness: 2, tool: 'axe', sound: 'wood' },
  { id: 85, key: 'jungle_leaves', name: 'Hojas de selva', tex: 'jungle_leaves', render: 'cutout', hardness: 0.2, sound: 'leaves', drop: 0, leafy: true },
  { id: 86, key: 'vine', name: 'Liana', tex: 'vine', render: 'cross', solid: false, hardness: 0.2, sound: 'leaves', drop: 0, needsAbove: true },
  { id: 87, key: 'cobweb', name: 'Telaraña', tex: 'cobweb', render: 'cross', solid: false, hardness: 2, tool: 'sword', sound: 'cloth', drop: 0, sticky: true },
  { id: 88, key: 'smooth_stone', name: 'Piedra pulida', tex: 'smooth_stone', hardness: 2, tool: 'pickaxe', tier: 1, sound: 'stone' },
  { id: 89, key: 'bed', name: 'Cama', tex: { top: 'bed_top', side: 'cama_lado', bottom: 'planks', front: 'cama_lado' }, render: 'model', hardness: 0.5, tool: 'axe', sound: 'cloth', facing: true, bed: true },
  // ---- v1.5: fauna ----
  { id: 90, key: 'banana_bunch', name: 'Racimo de bananos', tex: 'banana_bunch', render: 'cross', solid: false, hardness: 0.2, sound: 'leaves', drop: 0, needsAbove: true },
  { id: 91, key: 'hive', name: 'Colmena de meliponas', tex: { top: 'hive_top', side: 'hive', bottom: 'hive_top', front: 'hive_front' }, hardness: 1, tool: 'axe', sound: 'wood', facing: true, hive: true },
  { id: 92, key: 'turtle_nest', name: 'Nido de tortuga', tex: { top: 'turtle_nest', side: 'sand', bottom: 'sand' }, hardness: 0.3, sound: 'sand', drop: 0, hidden: true },
  { id: 93, key: 'morpho_jar', name: 'Frasco con morfo', tex: 'morpho_jar', render: 'cutout', hardness: 0.2, sound: 'glass', glow: true, needsSolidBelow: true },
  // ---- v1.7: cocina tica ----
  { id: 94, key: 'cafe0', name: 'Cafeto', tex: 'cafe0', render: 'cross', solid: false, hardness: 0.3, sound: 'leaves', drop: 0, needsSupport: [1, 2, 43, 44], crop: 'cafe', stage: 0, hidden: true },
  { id: 95, key: 'cafe1', name: 'Cafeto', tex: 'cafe1', render: 'cross', solid: false, hardness: 0.3, sound: 'leaves', drop: 0, needsSupport: [1, 2, 43, 44], crop: 'cafe', stage: 1, hidden: true },
  { id: 96, key: 'cafe2', name: 'Cafeto', tex: 'cafe2', render: 'cross', solid: false, hardness: 0.3, sound: 'leaves', drop: 0, needsSupport: [1, 2, 43, 44], crop: 'cafe', stage: 2, hidden: true },
  { id: 97, key: 'cafe3', name: 'Cafeto con café maduro', tex: 'cafe3', render: 'cross', solid: false, hardness: 0.3, sound: 'leaves', drop: 0, needsSupport: [1, 2, 43, 44], crop: 'cafe', stage: 3, hidden: true },
  { id: 98, key: 'cane', name: 'Caña de azúcar', tex: 'cane', render: 'cross', solid: false, hardness: 0, sound: 'grass', drop: 296, cane: true, crop: 'cane', stage: 0, hidden: true },
  { id: 99, key: 'trapiche', name: 'Trapiche', tex: { top: 'trapiche_top', side: 'trapiche', bottom: 'planks' }, render: 'model', hardness: 2.5, tool: 'axe', sound: 'wood' },
  // ---- v1.8: pueblos ticos ----
  { id: 101, key: 'paint_blue', name: 'Madera pintada celeste', tex: 'paint_blue', hardness: 2, tool: 'axe', sound: 'wood' },
  { id: 102, key: 'paint_green', name: 'Madera pintada verde', tex: 'paint_green', hardness: 2, tool: 'axe', sound: 'wood' },
  { id: 103, key: 'paint_yellow', name: 'Madera pintada amarilla', tex: 'paint_yellow', hardness: 2, tool: 'axe', sound: 'wood' },
  { id: 104, key: 'paint_pink', name: 'Madera pintada rosada', tex: 'paint_pink', hardness: 2, tool: 'axe', sound: 'wood' },
  { id: 105, key: 'adobe', name: 'Adobe', tex: 'adobe', hardness: 1.5, tool: 'pickaxe', sound: 'stone' },
  { id: 106, key: 'plaster', name: 'Repello blanco', tex: 'plaster', hardness: 1.5, tool: 'pickaxe', sound: 'stone' },
  { id: 107, key: 'teja', name: 'Teja de barro', tex: { top: 'teja', side: 'teja_side', bottom: 'planks' }, hardness: 1.2, tool: 'pickaxe', sound: 'stone' },
  // ---- v2.6: Costa Rica monumental ----
  { id: 148, key: 'placa', name: 'Placa', tex: { top: 'smooth_stone', side: 'smooth_stone', bottom: 'smooth_stone', front: 'placa_front' }, hardness: 2, tool: 'pickaxe', sound: 'stone', facing: true },
  { id: 149, key: 'rueda_carreta', name: 'Rueda de carreta', tex: { top: 'planks', side: 'rueda', bottom: 'planks' }, render: 'shape', boxes: [[7, 0, 0, 9, 16, 16]], hardness: 1.5, tool: 'axe', sound: 'wood' },
  { id: 150, key: 'rueda_carreta_z', name: 'Rueda de carreta', tex: { top: 'planks', side: 'rueda', bottom: 'planks' }, render: 'shape', boxes: [[0, 0, 7, 16, 16, 9]], hardness: 1.5, tool: 'axe', sound: 'wood', drop: 149, hidden: true },
  { id: 151, key: 'madera_carreta', name: 'Madera pintada de Sarchí', tex: 'madera_carreta', hardness: 2, tool: 'axe', sound: 'wood' },
  // ---- v2.14: pueblos y ciudad ----
  { id: 183, key: 'asfalto', name: 'Asfalto', tex: 'asfalto', hardness: 1.5, tool: 'pickaxe', sound: 'stone' },
  { id: 184, key: 'asfalto_linea', name: 'Asfalto con línea amarilla', tex: { top: 'asfalto_linea', side: 'asfalto', bottom: 'asfalto' }, hardness: 1.5, tool: 'pickaxe', sound: 'stone', drop: 183 },
  { id: 188, key: 'acera', name: 'Acera de concreto', tex: 'acera', hardness: 1.5, tool: 'pickaxe', sound: 'stone' },
  { id: 189, key: 'bloque_concreto', name: 'Bloques de concreto', tex: 'bloque_concreto', hardness: 2, tool: 'pickaxe', tier: 0, sound: 'stone' },
  { id: 190, key: 'concreto', name: 'Concreto', tex: 'concreto', hardness: 2, tool: 'pickaxe', sound: 'stone' },
  { id: 191, key: 'zinc', name: 'Lámina de zinc', tex: 'zinc', hardness: 1.2, tool: 'pickaxe', sound: 'glass' },
  { id: 192, key: 'verja', name: 'Verja de hierro', tex: 'verja', render: 'cutout', hardness: 2.5, tool: 'pickaxe', sound: 'glass' },
  { id: 193, key: 'estante', name: 'Estante de tienda', tex: { top: 'planks', side: 'estante', bottom: 'planks' }, hardness: 1.5, tool: 'axe', sound: 'wood' },
  { id: 194, key: 'poste', name: 'Poste de luz', tex: 'concreto', render: 'shape', boxes: [[6, 0, 6, 10, 16, 10]], hardness: 2, tool: 'pickaxe', sound: 'stone' },
  { id: 195, key: 'cable', name: 'Cable eléctrico', tex: 'cable', render: 'shape', boxes: [[0, 11.5, 7.5, 16, 12.5, 8.5]], solid: false, hardness: 0.1, sound: 'cloth' },
  { id: 196, key: 'cable_z', name: 'Cable eléctrico', tex: 'cable', render: 'shape', boxes: [[7.5, 11.5, 0, 8.5, 12.5, 16]], solid: false, hardness: 0.1, sound: 'cloth', drop: 195, hidden: true },
  { id: 197, key: 'tanque_agua', name: 'Tanque de agua', tex: { top: 'tanque_top', side: 'tanque', bottom: 'tanque_top' }, hardness: 1, tool: 'axe', sound: 'wood' },
  // ---- v2.15: carreteras ----
  { id: 198, key: 'asfalto_parche', name: 'Parche de asfalto', tex: 'asfalto_parche', hardness: 1.5, tool: 'pickaxe', sound: 'stone' },
  { id: 199, key: 'asfalto_roto', name: 'Asfalto agrietado', tex: 'asfalto_roto', hardness: 1.2, tool: 'pickaxe', sound: 'stone', drop: 183 },
  { id: 200, key: 'cono', name: 'Cono', tex: 'cono', render: 'shape', boxes: [[3, 0, 3, 13, 1.5, 13], [5, 1.5, 5, 11, 7, 11], [6.5, 7, 6.5, 9.5, 13, 9.5]], hardness: 0.3, sound: 'cloth' },
  { id: 201, key: 'fondo_hueco', name: 'Fondo de hueco', tex: 'fondo_hueco', hardness: 0.6, tool: 'shovel', sound: 'gravel', drop: 3 },
  { id: 202, key: 'maquina', name: 'Lata de maquinaria', tex: 'maquina', hardness: 3, tool: 'pickaxe', tier: 1, sound: 'glass' },
  { id: 203, key: 'barrera', name: 'Barrera', tex: 'barrera', render: 'shape', boxes: [[0, 9, 6.5, 16, 12, 9.5]], solid: false, hardness: 0.5, sound: 'wood' },
  // ---- v2.16: estadios y tren ----
  { id: 205, key: 'varilla', name: 'Varilla', tex: 'varilla', render: 'cross', solid: false, hardness: 1, tool: 'pickaxe', sound: 'glass' },
  { id: 206, key: 'andamio', name: 'Andamio', tex: 'andamio', render: 'cutout', hardness: 1, tool: 'axe', sound: 'wood' },
  { id: 207, key: 'rieles', name: 'Rieles del tren', tex: 'rieles', render: 'shape', boxes: [[0, 0, 0, 16, 1, 16]], hardness: 1.5, tool: 'pickaxe', sound: 'glass' },
  { id: 208, key: 'metal_rojo', name: 'Lámina roja de hierro', tex: 'metal_rojo', hardness: 3, tool: 'pickaxe', tier: 1, sound: 'glass' },
  { id: 209, key: 'lamina_metal', name: 'Lámina de hierro', tex: 'lamina_metal', hardness: 3, tool: 'pickaxe', tier: 1, sound: 'glass' },
  { id: 210, key: 'cesped', name: 'Zacate de cancha', tex: { top: 'cesped', side: 'grass_side', bottom: 'dirt' }, hardness: 0.6, tool: 'shovel', sound: 'grass', drop: 2 },
  // ---- v2.18: la refinería que no refina ----
  { id: 211, key: 'oxido', name: 'Metal oxidado', tex: 'oxido', hardness: 2.5, tool: 'pickaxe', tier: 1, sound: 'glass' },
  { id: 212, key: 'tuberia', name: 'Tubería', tex: { top: 'tuberia_end', side: 'tuberia', bottom: 'tuberia_end' }, render: 'shape', boxes: [[4, 4, 0, 12, 12, 16]], hardness: 2, tool: 'pickaxe', sound: 'glass' },
  { id: 213, key: 'tuberia_x', name: 'Tubería', tex: { top: 'tuberia', side: 'tuberia', bottom: 'tuberia' }, render: 'shape', boxes: [[0, 4, 4, 16, 12, 12]], hardness: 2, tool: 'pickaxe', sound: 'glass', drop: 212, hidden: true },
  // ---- v2.20: campo ----
  { id: 215, key: 'cafe_secado', name: 'Café secándose al sol', tex: 'cafe_secado', hardness: 0.6, tool: 'shovel', sound: 'gravel', drop: 294 },
  { id: 216, key: 'saco_cafe', name: 'Saco de café', tex: { top: 'saco_top', side: 'saco_cafe', bottom: 'saco_top' }, hardness: 0.8, sound: 'cloth', drop: 295 },
  // ---- v2.24: Rincón de la Vieja ----
  { id: 217, key: 'lodo', name: 'Lodo hirviendo', tex: 'lodo', hardness: 0.6, tool: 'shovel', sound: 'gravel', hurts: true, drop: 3 },
  // ---- v2.26: río Celeste ----
  { id: 218, key: 'agua_celeste', name: 'Agua del río Celeste', tex: 'agua_celeste', render: 'water', solid: false, hardness: -1, sound: 'water', level: 8, source: true, hidden: true },
  // ---- v2.27: potrero ----
  { id: 219, key: 'bonita', name: 'Boñiga de vaca', tex: { top: 'bonita_top', side: 'bonita_side', bottom: 'bonita_top' }, render: 'shape', boxes: [[2, 0, 3, 13, 2, 13], [4, 2, 5, 11, 3, 11]], solid: false, hardness: 0.2, sound: 'gravel', needsSupport: [1, 2, 3] },
  { id: 220, key: 'bonita_hongos', name: 'Boñiga con hongos', tex: { top: 'bonita_hongos_top', side: 'bonita_hongos_side', bottom: 'bonita_top' }, render: 'shape',
    boxes: [[2, 0, 3, 13, 2, 13], [4, 2, 5, 11, 3, 11], [6, 3, 6, 7, 6, 7], [4.5, 6, 4.5, 8.5, 7.5, 8.5], [10, 3, 9.5, 11, 6, 10.5], [8.5, 6, 8, 12.5, 7.5, 12], [4, 3, 11, 5, 6, 12], [3, 6, 10, 6, 7.5, 13]],
    solid: false, hardness: 0.2, sound: 'gravel', drop: 395, needsSupport: [1, 2, 3], hidden: true },
  // ---- v2.42: mazorca de cacao (se cosecha rompiéndola) ----
  { id: 221, key: 'mazorca_cacao', name: 'Mazorca de cacao', tex: 'mazorca_cacao', render: 'cross', solid: false, hardness: 0.2, sound: 'leaves', drop: 408 },
  // ---- v2.49: portón, cortina, maceta y palanca (los que se abren cambian de bloque con clic derecho) ----
  { id: 222, key: 'porton', name: 'Portón de madera', tex: 'porton', render: 'shape', boxes: [[0, 0, 7, 16, 15, 9]], hardness: 1.5, tool: 'axe', sound: 'wood', toggleTo: 'porton_open' },
  { id: 223, key: 'porton_z', name: 'Portón de madera', tex: 'porton', render: 'shape', boxes: [[7, 0, 0, 9, 15, 16]], hardness: 1.5, tool: 'axe', sound: 'wood', toggleTo: 'porton_z_open', drop: 222, hidden: true },
  { id: 224, key: 'porton_open', name: 'Portón de madera', tex: 'porton', render: 'shape', boxes: [[0, 0, 0, 2, 15, 16]], solid: false, hardness: 1.5, tool: 'axe', sound: 'wood', toggleTo: 'porton', drop: 222, hidden: true },
  { id: 225, key: 'porton_z_open', name: 'Portón de madera', tex: 'porton', render: 'shape', boxes: [[0, 0, 0, 16, 15, 2]], solid: false, hardness: 1.5, tool: 'axe', sound: 'wood', toggleTo: 'porton_z', drop: 222, hidden: true },
  { id: 226, key: 'cortina', name: 'Cortina', tex: 'cortina', render: 'shape', boxes: [[0, 0, 7.5, 16, 16, 8.5]], solid: false, hardness: 0.3, sound: 'cloth', toggleTo: 'cortina_open' },
  { id: 227, key: 'cortina_z', name: 'Cortina', tex: 'cortina', render: 'shape', boxes: [[7.5, 0, 0, 8.5, 16, 16]], solid: false, hardness: 0.3, sound: 'cloth', toggleTo: 'cortina_z_open', drop: 226, hidden: true },
  { id: 228, key: 'cortina_open', name: 'Cortina', tex: 'cortina', render: 'shape', boxes: [[0, 0, 7, 3, 16, 9], [13, 0, 7, 16, 16, 9]], solid: false, hardness: 0.3, sound: 'cloth', toggleTo: 'cortina', drop: 226, hidden: true },
  { id: 229, key: 'cortina_z_open', name: 'Cortina', tex: 'cortina', render: 'shape', boxes: [[7, 0, 0, 9, 16, 3], [7, 0, 13, 9, 16, 16]], solid: false, hardness: 0.3, sound: 'cloth', toggleTo: 'cortina_z', drop: 226, hidden: true },
  { id: 230, key: 'maceta', name: 'Maceta con flores', tex: { top: 'maceta_top', side: 'maceta_side', bottom: 'maceta_side' }, render: 'shape', boxes: [[4, 0, 4, 12, 6, 12], [7.5, 6, 7.5, 8.5, 10, 8.5], [5.5, 10, 5.5, 10.5, 13, 10.5]], solid: false, hardness: 0.3, sound: 'stone' },
  { id: 231, key: 'palanca', name: 'Palanca', tex: 'palanca', render: 'shape', boxes: [[5, 0, 4, 11, 2, 12], [7, 2, 5, 9, 10, 7]], solid: false, hardness: 0.5, sound: 'stone', toggleTo: 'palanca_on', lever: true },
  { id: 233, key: 'lamp_off', name: 'Lámpara (apagada)', tex: 'lamp_off', hardness: 0.3, sound: 'glass', toggleTo: 'lamp', drop: 34, hidden: true },
  { id: 234, key: 'farol_off', name: 'Farol (apagado)', tex: { top: 'farol_top_off', side: 'farol_off', bottom: 'farol_top_off' }, render: 'shape', solid: false,
    boxes: [[5, 1, 5, 11, 9, 11], [6, 9, 6, 10, 10, 10], [7.5, 10, 7.5, 8.5, 16, 8.5]], hardness: 0.5, sound: 'glass', toggleTo: 'farol', drop: 134, hidden: true },
  // ---- v2.60: la fogata (luz, calor, espanta zancudos y asa lo crudo) ----
  // v2.80: bloques extendidos (600–1023)
  // v3.8: piñal
  { id: 607, key: 'pina0', name: 'Piñal', tex: 'pina0', render: 'cross', solid: false, hardness: 0.3, sound: 'leaves', drop: 0, needsSupport: [1, 2, 43, 44], crop: 'pina', stage: 0, hidden: true },
  { id: 608, key: 'pina1', name: 'Piñal', tex: 'pina1', render: 'cross', solid: false, hardness: 0.3, sound: 'leaves', drop: 0, needsSupport: [1, 2, 43, 44], crop: 'pina', stage: 1, hidden: true },
  { id: 609, key: 'pina2', name: 'Piñal', tex: 'pina2', render: 'cross', solid: false, hardness: 0.3, sound: 'leaves', drop: 0, needsSupport: [1, 2, 43, 44], crop: 'pina', stage: 2, hidden: true },
  { id: 610, key: 'pina3', name: 'Piñal con piña madura', tex: 'pina3', render: 'cross', solid: false, hardness: 0.3, sound: 'leaves', drop: 0, needsSupport: [1, 2, 43, 44], crop: 'pina', stage: 3, hidden: true },
  { id: 622, key: 'puntal', name: 'Puntal', tex: 'puntal', render: 'shape', solid: false, boxes: [[6, 0, 6, 10, 16, 10]], hardness: 0.8, tool: 'axe', sound: 'wood' },
  { id: 623, key: 'corazon_tiquicia', name: 'Corazón de Tiquicia', tex: 'corazon_tiquicia', render: 'shape', solid: true, glow: true, boxes: [[4, 0, 4, 12, 2, 12], [2, 2, 2, 14, 12, 14], [4, 12, 4, 12, 14, 12]], hardness: 6, tool: 'pickaxe', tier: 1, sound: 'stone' },
  { id: 624, key: 'trofeo_rey_murcielago', name: 'Trofeo: Murciélago Rey', tex: 'trofeo_rey_murcielago', render: 'shape', solid: true, boxes: [[3, 0, 3, 13, 3, 13], [5, 3, 5, 11, 12, 11]], hardness: 1, tool: 'axe', sound: 'wood', trofeo: true },
  { id: 625, key: 'trofeo_senor_arenal', name: 'Trofeo: Señor del Arenal', tex: 'trofeo_senor_arenal', render: 'shape', solid: true, boxes: [[3, 0, 3, 13, 3, 13], [5, 3, 5, 11, 12, 11]], hardness: 1, tool: 'axe', sound: 'wood', trofeo: true },
  { id: 626, key: 'trofeo_arpia', name: 'Trofeo: Arpía de la Tormenta', tex: 'trofeo_arpia', render: 'shape', solid: true, boxes: [[3, 0, 3, 13, 3, 13], [5, 3, 5, 11, 12, 11]], hardness: 1, tool: 'axe', sound: 'wood', trofeo: true },
  { id: 627, key: 'trofeo_sombra_madre', name: 'Trofeo: Sombra Madre', tex: 'trofeo_sombra_madre', render: 'shape', solid: true, boxes: [[3, 0, 3, 13, 3, 13], [5, 3, 5, 11, 12, 11]], hardness: 1, tool: 'axe', sound: 'wood', trofeo: true },
  { id: 628, key: 'trofeo_mono_congo_gigante', name: 'Trofeo: Mono congo gigante', tex: 'trofeo_mono_congo_gigante', render: 'shape', solid: true, boxes: [[3, 0, 3, 13, 3, 13], [5, 3, 5, 11, 12, 11]], hardness: 1, tool: 'axe', sound: 'wood', trofeo: true },
  { id: 633, key: 'olla_caliente', name: 'Olla caliente', tex: { top: 'olla_top', side: 'olla_lado', bottom: 'olla_lado' }, render: 'shape', solid: true, boxes: [[3, 0, 3, 13, 9, 13]], hardness: 1.5, tool: 'pickaxe', sound: 'stone' },
  { id: 634, key: 'alambre', name: 'Alambre de púas', tex: 'alambre', render: 'cross', solid: false, hardness: 0.5, tool: 'axe', sound: 'wood', needsSupport: [1, 2, 3, 4, 12, 17, 43, 44] },
  { id: 631, key: 'plato_servido', name: 'Plato servido', tex: { top: 'plato_servido', side: 'plato_lado', bottom: 'plato_lado' }, render: 'shape', solid: false, boxes: [[3, 0, 3, 13, 2, 13]], hardness: 0.3, sound: 'stone', drop: 0 },
  { id: 632, key: 'plato_vacio', name: 'Plato vacío', tex: { top: 'plato_vacio', side: 'plato_lado', bottom: 'plato_lado' }, render: 'shape', solid: false, boxes: [[3, 0, 3, 13, 2, 13]], hardness: 0.3, sound: 'stone' },
  { id: 630, key: 'trofeo_olvido', name: 'Trofeo: El Olvido', tex: 'trofeo_olvido', render: 'shape', solid: true, boxes: [[3, 0, 3, 13, 3, 13], [5, 3, 5, 11, 12, 11]], hardness: 1, tool: 'axe', sound: 'wood', trofeo: true },
  { id: 635, key: 'trofeo_toro_guaco', name: 'Trofeo: Toro Guaco', tex: 'trofeo_toro_guaco', render: 'shape', solid: true, boxes: [[3, 0, 3, 13, 3, 13], [5, 3, 5, 11, 12, 11]], hardness: 1, tool: 'axe', sound: 'wood', trofeo: true },
  { id: 636, key: 'trofeo_cuche_monte', name: 'Trofeo: Cuche de monte', tex: 'trofeo_cuche_monte', render: 'shape', solid: true, boxes: [[3, 0, 3, 13, 3, 13], [5, 3, 5, 11, 12, 11]], hardness: 1, tool: 'axe', sound: 'wood', trofeo: true },
  { id: 637, key: 'trofeo_chupacabras', name: 'Trofeo: Chupacabras', tex: 'trofeo_chupacabras', render: 'shape', solid: true, boxes: [[3, 0, 3, 13, 3, 13], [5, 3, 5, 11, 12, 11]], hardness: 1, tool: 'axe', sound: 'wood', trofeo: true },
  { id: 638, key: 'trofeo_becquer', name: 'Trofeo: Bécquer', tex: 'trofeo_becquer', render: 'shape', solid: true, boxes: [[3, 0, 3, 13, 3, 13], [5, 3, 5, 11, 12, 11]], hardness: 1, tool: 'axe', sound: 'wood', trofeo: true },
  { id: 642, key: 'pararrayos', name: 'Pararrayos (jala los rayos de la tormenta: póngalo en lo más alto)', tex: 'pararrayos', render: 'shape', solid: false, boxes: [[5, 0, 5, 11, 2, 11], [7, 2, 7, 9, 16, 9]], hardness: 2, tool: 'pickaxe', sound: 'stone' },
  { id: 645, key: 'trofeo_reina', name: 'Trofeo: La Reina Bananera', tex: 'trofeo_reina', render: 'shape', solid: true, boxes: [[3, 0, 3, 13, 3, 13], [5, 3, 5, 11, 12, 11]], hardness: 1, tool: 'axe', sound: 'wood', trofeo: true },
  { id: 646, key: 'trofeo_cornudo', name: 'Trofeo: Don Cornudo', tex: 'trofeo_cornudo', render: 'shape', solid: true, boxes: [[3, 0, 3, 13, 3, 13], [5, 3, 5, 11, 12, 11]], hardness: 1, tool: 'axe', sound: 'wood', trofeo: true },
  { id: 647, key: 'trofeo_tata', name: 'Trofeo: El Tata Sapo', tex: 'trofeo_tata', render: 'shape', solid: true, boxes: [[3, 0, 3, 13, 3, 13], [5, 3, 5, 11, 12, 11]], hardness: 1, tool: 'axe', sound: 'wood', trofeo: true },
  { id: 648, key: 'trofeo_cascabel', name: 'Trofeo: La Cascabel del Llano', tex: 'trofeo_cascabel', render: 'shape', solid: true, boxes: [[3, 0, 3, 13, 3, 13], [5, 3, 5, 11, 12, 11]], hardness: 1, tool: 'axe', sound: 'wood', trofeo: true },
  { id: 649, key: 'trofeo_cangrejo', name: 'Trofeo: El Cangrejo Rey', tex: 'trofeo_cangrejo', render: 'shape', solid: true, boxes: [[3, 0, 3, 13, 3, 13], [5, 3, 5, 11, 12, 11]], hardness: 1, tool: 'axe', sound: 'wood', trofeo: true },
  { id: 650, key: 'trofeo_ciempies', name: 'Trofeo: El Ciempiés Rey', tex: 'trofeo_ciempies', render: 'shape', solid: true, boxes: [[3, 0, 3, 13, 3, 13], [5, 3, 5, 11, 12, 11]], hardness: 1, tool: 'axe', sound: 'wood', trofeo: true },
  { id: 644, key: 'ermita', name: 'Ermita de camino (clic derecho: viajar a otra ermita)', tex: { top: 'ermita_top', side: 'ermita', bottom: 'ermita_top' }, render: 'shape', solid: true, boxes: [[2, 0, 2, 14, 2, 14], [4, 2, 4, 12, 11, 12], [3, 11, 3, 13, 13, 13], [7, 13, 7, 9, 16, 9]], hardness: 1.5, tool: 'pickaxe', sound: 'stone' },
  { id: 643, key: 'trofeo_rey_zopilote', name: 'Trofeo: Cabeza del Rey Zopilote', tex: 'trofeo_rey_zopilote', render: 'shape', solid: true, boxes: [[3, 0, 3, 13, 3, 13], [5, 3, 5, 11, 12, 11]], hardness: 1, tool: 'axe', sound: 'wood', trofeo: true },
  { id: 641, key: 'trofeo_bailarin', name: 'Trofeo: Bailarín Elegante', tex: 'trofeo_bailarin', render: 'shape', solid: true, boxes: [[3, 0, 3, 13, 3, 13], [5, 3, 5, 11, 12, 11]], hardness: 1, tool: 'axe', sound: 'wood', trofeo: true },
  { id: 640, key: 'trofeo_puma', name: 'Trofeo: Puma', tex: 'trofeo_puma', render: 'shape', solid: true, boxes: [[3, 0, 3, 13, 3, 13], [5, 3, 5, 11, 12, 11]], hardness: 1, tool: 'axe', sound: 'wood', trofeo: true },
  { id: 639, key: 'trofeo_padre', name: 'Trofeo: Padre sin Cabeza', tex: 'trofeo_padre', render: 'shape', solid: true, boxes: [[3, 0, 3, 13, 3, 13], [5, 3, 5, 11, 12, 11]], hardness: 1, tool: 'axe', sound: 'wood', trofeo: true },
  { id: 629, key: 'trofeo_cadejos', name: 'Trofeo: Cadejos', tex: 'trofeo_cadejos', render: 'shape', solid: true, boxes: [[3, 0, 3, 13, 3, 13], [5, 3, 5, 11, 12, 11]], hardness: 1, tool: 'axe', sound: 'wood', trofeo: true },
  { id: 620, key: 'yunque', name: 'Yunque', tex: 'yunque', render: 'shape', solid: true,
    boxes: [[3, 0, 4, 13, 3, 12], [6, 3, 6, 10, 8, 10], [1, 8, 4, 15, 13, 12]], hardness: 3, tool: 'pickaxe', tier: 1, sound: 'stone' },
  { id: 621, key: 'compostera', name: 'Compostera', tex: { top: 'compostera_top', side: 'compostera', bottom: 'compostera' }, hardness: 1, tool: 'axe', sound: 'wood' },
  { id: 617, key: 'nido_sombra', name: 'Nido de Sombra', tex: 'nido_sombra', hardness: 18, tool: 'axe', sound: 'wood', drop: 0 },
  { id: 618, key: 'nido_raiz', name: 'Raíz de Sombra', tex: 'nido_raiz', render: 'cross', solid: false, hardness: 0.3, sound: 'leaves', drop: 0 },
  { id: 619, key: 'farol_zenaida', name: 'Farol de Zenaida', tex: { top: 'farol_top', side: 'farol_zenaida', bottom: 'farol_top' }, render: 'shape', solid: false, glow: true, anim: 1,
    boxes: [[5, 1, 5, 11, 9, 11], [6, 9, 6, 10, 10, 10], [7.5, 10, 7.5, 8.5, 16, 8.5]], hardness: 0.5, sound: 'glass' },
  { id: 616, key: 'cencerro', name: 'Cencerro', tex: 'cencerro', render: 'cross', solid: false, hardness: 0.4, tool: 'axe', sound: 'wood' },
  { id: 615, key: 'carpa', name: 'Carpa de campamento', tex: 'cama_manta', render: 'model', hardness: 0.4, tool: 'axe', sound: 'cloth', facing: true, bed: true },
  { id: 611, key: 'trampa', name: 'Trampa de lazo', tex: 'trampa', render: 'cross', solid: false, hardness: 0.4, tool: 'axe', sound: 'wood', station: 'chest', needsSupport: [1, 2, 17, 43, 44] },
  { id: 612, key: 'nasa', name: 'Nasa de pesca', tex: 'nasa', hardness: 0.5, tool: 'axe', sound: 'wood', station: 'chest' },
  { id: 613, key: 'barril', name: 'Barril de lluvia', tex: { top: 'barril_top', side: 'barril', bottom: 'barril_top' }, hardness: 1, tool: 'axe', sound: 'wood', barril: true },
  { id: 614, key: 'estacas', name: 'Estacas', tex: 'estacas', render: 'cross', solid: false, hardness: 0.5, tool: 'axe', sound: 'wood', needsSupport: [1, 2, 3, 4, 12, 17, 43, 44] },
  { id: 606, key: 'meteorito', name: 'Meteorito', tex: 'meteorito', glow: true, hardness: 4, tool: 'pickaxe', tier: 2, sound: 'stone', drop: 465 },
  { id: 605, key: 'red_pesca', name: 'Red de pesca (tirada)', tex: { top: 'red_pesca', side: 'red_pesca', bottom: 'red_pesca' }, render: 'shape', solid: false, boxes: [[0, 12, 0, 16, 14, 16]], hardness: 0.3, sound: 'cloth', drop: 463, hidden: true },
  { id: 603, key: 'cristal', name: 'Racimo de cristal', tex: 'cristal', render: 'cross', solid: false, glow: true, hardness: 1, tool: 'pickaxe', sound: 'glass' },
  { id: 604, key: 'cristal_bloque', name: 'Bloque de cristal', tex: 'cristal_bloque', glow: true, hardness: 2.5, tool: 'pickaxe', sound: 'glass' },
  { id: 601, key: 'tronco_quemado', name: 'Tronco quemado', tex: { top: 'tronco_quemado_top', side: 'tronco_quemado', bottom: 'tronco_quemado_top' }, hardness: 1.5, tool: 'axe', sound: 'wood', drop: 257 },
  { id: 602, key: 'ceniza_capa', name: 'Capa de ceniza', tex: 'ceniza', render: 'shape', solid: false, boxes: [[0, 0, 0, 16, 2, 16]], hardness: 0.1, tool: 'shovel', sound: 'gravel', drop: 0 },
  { id: 600, key: 'baldosa_roja', name: 'Baldosa roja', tex: 'baldosa_roja', hardness: 1.5, tool: 'pickaxe', sound: 'stone' },
  // v2.75: construcción tica
  { id: 249, key: 'repello_celeste', name: 'Repello celeste', tex: 'repello_celeste', hardness: 1.5, tool: 'pickaxe', sound: 'stone' },
  { id: 250, key: 'repello_amarillo', name: 'Repello amarillo', tex: 'repello_amarillo', hardness: 1.5, tool: 'pickaxe', sound: 'stone' },
  { id: 251, key: 'repello_verde', name: 'Repello verde menta', tex: 'repello_verde', hardness: 1.5, tool: 'pickaxe', sound: 'stone' },
  { id: 252, key: 'azulejo', name: 'Azulejo', tex: 'azulejo', hardness: 1.5, tool: 'pickaxe', sound: 'glass' },
  { id: 253, key: 'mosaico', name: 'Mosaico de colores', tex: 'mosaico', hardness: 1.5, tool: 'pickaxe', sound: 'stone' },
  { id: 254, key: 'reja', name: 'Reja de hierro forjado', tex: 'reja', render: 'cutout', hardness: 4, tool: 'pickaxe', sound: 'stone' },
  // v2.74: sitio arqueológico
  { id: 245, key: 'esfera_piedra', name: 'Esfera de piedra', tex: 'esfera_piedra', render: 'shape', boxes: [[3, 0, 3, 13, 10, 13], [2, 2, 2, 14, 8, 14], [4, 10, 4, 12, 11, 12]], hardness: 2, tool: 'pickaxe', sound: 'stone' },
  { id: 246, key: 'pedestal', name: 'Pedestal antiguo', tex: { top: 'pedestal_top', side: 'petroglifo', bottom: 'cobble' }, hardness: -1, sound: 'stone' },
  { id: 247, key: 'petroglifo', name: 'Petroglifo', tex: 'petroglifo', hardness: 3, tool: 'pickaxe', sound: 'stone' },
  { id: 248, key: 'puerta_piedra', name: 'Puerta de piedra', tex: 'puerta_piedra', hardness: -1, sound: 'stone' },
  // v2.72: muebles
  { id: 237, key: 'silla', name: 'Silla', tex: 'planks', render: 'shape', solid: false, boxes: [[3, 0, 3, 5, 8, 5], [11, 0, 3, 13, 8, 5], [3, 0, 11, 5, 8, 13], [11, 0, 11, 13, 8, 13], [2, 8, 2, 14, 10, 14], [2, 10, 12, 14, 16, 14]], hardness: 1, tool: 'axe', sound: 'wood' },
  { id: 238, key: 'mesa_comedor', name: 'Mesa de comedor', tex: { top: 'mesa_comedor', side: 'planks', bottom: 'planks' }, render: 'shape', boxes: [[0, 13, 0, 16, 16, 16], [1, 0, 1, 3, 13, 3], [13, 0, 1, 15, 13, 3], [1, 0, 13, 3, 13, 15], [13, 0, 13, 15, 13, 15]], hardness: 1.2, tool: 'axe', sound: 'wood' },
  { id: 239, key: 'hamaca', name: 'Hamaca', tex: 'hamaca', render: 'shape', solid: false, boxes: [[1, 6, 3, 15, 7, 13], [0, 0, 7, 1, 11, 9], [15, 0, 7, 16, 11, 9], [0, 7, 6, 1, 8, 10], [15, 7, 6, 16, 8, 10]], hardness: 0.4, sound: 'cloth' },
  { id: 240, key: 'tele', name: 'Tele vieja', tex: { top: 'tele_lado', side: 'tele_lado', bottom: 'tele_lado', front: 'tele_apagada' }, render: 'shape', facing: true, boxes: [[1, 0, 2, 15, 13, 14]], hardness: 1, tool: 'pickaxe', sound: 'stone', toggleTo: 'tele_on' },
  { id: 241, key: 'tele_on', name: 'Tele vieja (encendida)', tex: { top: 'tele_lado', side: 'tele_lado', bottom: 'tele_lado', front: 'tele_prendida' }, render: 'shape', facing: true, boxes: [[1, 0, 2, 15, 13, 14]], hardness: 1, tool: 'pickaxe', sound: 'stone', toggleTo: 'tele', glow: true, drop: 240, hidden: true },
  { id: 242, key: 'radio', name: 'Radio', tex: { top: 'radio_lado', side: 'radio_lado', bottom: 'radio_lado', front: 'radio_frente' }, render: 'shape', facing: true, boxes: [[2, 0, 5, 14, 8, 11]], hardness: 0.6, sound: 'wood', toggleTo: 'radio_on' },
  { id: 243, key: 'radio_on', name: 'Radio (encendida)', tex: { top: 'radio_lado', side: 'radio_lado', bottom: 'radio_lado', front: 'radio_frente' }, render: 'shape', facing: true, boxes: [[2, 0, 5, 14, 8, 11]], hardness: 0.6, sound: 'wood', toggleTo: 'radio', drop: 242, hidden: true },
  // v11.10.7: el chanchito de barro (alcancía): todos los del jugador comparten las mismas 27 casillas (meta.chanchito), que nunca se pierden
  // v12.1.0: la fogata sin leña pasa a brasas (alumbra y calienta poco) y después se apaga
  { id: 653, key: 'fogata_brasas', name: 'Fogata en brasas', tex: { top: 'fogata_brasas_top', side: 'fogata_brasas', bottom: 'fogata_top' }, render: 'shape', solid: false, glow: true,
    boxes: [[1, 0, 6, 15, 3, 10], [6, 0, 1, 10, 3, 15], [5, 3, 5, 11, 5, 11]], hardness: 0.6, tool: 'axe', sound: 'wood', drop: 235, hidden: true },
  { id: 654, key: 'fogata_apagada', name: 'Fogata apagada', tex: { top: 'fogata_apagada_top', side: 'fogata_apagada', bottom: 'fogata_apagada_top' }, render: 'shape', solid: false,
    boxes: [[1, 0, 6, 15, 3, 10], [6, 0, 1, 10, 3, 15]], hardness: 0.6, tool: 'axe', sound: 'wood', drop: 235, hidden: true },
  // v12.4.0 C4: la construcción tradicional y la mecedora
  { id: 655, key: 'mecedora', name: 'Mecedora (clic derecho: sentarse y mecerse; recupera la vida)', tex: 'planks', render: 'shape', solid: false,
    boxes: [[3, 1, 3, 5, 8, 5], [11, 1, 3, 13, 8, 5], [3, 1, 11, 5, 8, 13], [11, 1, 11, 13, 8, 13], [2, 8, 2, 14, 10, 14], [2, 10, 12, 14, 17, 14], [1, 0, 2, 3, 1, 14], [13, 0, 2, 15, 1, 14]], hardness: 1, tool: 'axe', sound: 'wood' },
  { id: 656, key: 'bahareque', name: 'Pared de bahareque', tex: 'bahareque', hardness: 1.4, tool: 'shovel', sound: 'gravel' },
  { id: 657, key: 'bahareque_encalado', name: 'Bahareque encalado', tex: 'bahareque_encalado', hardness: 1.4, tool: 'shovel', sound: 'gravel' },
  { id: 658, key: 'horcon', name: 'Horcón', tex: { top: 'log_top', side: 'horcon_lado', bottom: 'log_top' }, render: 'shape', boxes: [[4, 0, 4, 12, 16, 12]], hardness: 2, tool: 'axe', sound: 'wood' },
  { id: 659, key: 'techo_palma', name: 'Techo de palma', tex: 'techo_palma', render: 'shape', boxes: [[0, 0, 0, 16, 8, 16]], hardness: 0.5, sound: 'leaves' },
  { id: 660, key: 'postigo', name: 'Postigo (clic derecho: abrir o cerrar)', tex: 'postigo', render: 'shape', boxes: [[0, 0, 7, 16, 16, 9]], hardness: 1.2, tool: 'axe', sound: 'wood', toggleTo: 'postigo_abierto' },
  { id: 662, key: 'postigo_abierto', name: 'Postigo abierto', tex: 'postigo', render: 'shape', solid: false, boxes: [[0, 0, 7, 2, 16, 15], [14, 0, 7, 16, 16, 15]], hardness: 1.2, tool: 'axe', sound: 'wood', toggleTo: 'postigo', drop: 660, hidden: true },
  { id: 663, key: 'postigo_z', name: 'Postigo (clic derecho: abrir o cerrar)', tex: 'postigo', render: 'shape', boxes: [[7, 0, 0, 9, 16, 16]], hardness: 1.2, tool: 'axe', sound: 'wood', toggleTo: 'postigo_z_abierto', drop: 660, hidden: true }, // v12.4.9: el de la pared que va de frente a uno
  { id: 664, key: 'postigo_z_abierto', name: 'Postigo abierto', tex: 'postigo', render: 'shape', solid: false, boxes: [[7, 0, 0, 15, 16, 2], [7, 0, 14, 15, 16, 16]], hardness: 1.2, tool: 'axe', sound: 'wood', toggleTo: 'postigo_z', drop: 660, hidden: true },
  { id: 692, key: 'tablon_encargos', name: 'Tablón de encargos (clic derecho: ver los encargos del pueblo)', tex: 'planks', render: 'shape', boxes: [[1, 0, 7, 3, 16, 9], [13, 0, 7, 15, 16, 9], [0, 7, 6, 16, 16, 10]], hardness: 2, tool: 'axe', sound: 'wood' }, // v12.4.12 (C8-A)
  // v12.6.0 (C5-B «Tortugas y arrecife»)
  { id: 670, key: 'secadero', name: 'Secadero (pescado y sal: en 3 días, pescado seco)', tex: 'secadero', render: 'cutout', hardness: 0.6, tool: 'axe', sound: 'wood' }, // v12.7.2 (C5-A2)
  { id: 668, key: 'nido_marcado', name: 'Nido protegido (con estaca y malla)', tex: { top: 'nido_marcado', side: 'sand', bottom: 'sand' }, hardness: 0.6, sound: 'sand', drop: 0 },
  { id: 669, key: 'vivero_coral', name: 'Vivero de coral (cada 3 días da 2 fragmentos)', tex: 'vivero_coral', render: 'cutout', hardness: 0.8, tool: 'axe', sound: 'wood' },
  { id: 671, key: 'pecera', name: 'Pecera (con un pez vivo da comodidad)', tex: 'pecera', render: 'cutout', hardness: 0.3, sound: 'glass' },
  { id: 698, key: 'foto_cumbre', name: 'Foto de la cumbre (la gente de la casa, a contraluz)', tex: 'planks', render: 'shape', boxes: [[2, 0, 6, 14, 12, 8], [5, 0, 8, 11, 7, 10]], hardness: 0.8, tool: 'axe', sound: 'wood' }, // v12.16.5
  { id: 697, key: 'coral_blanco', name: 'Coral blanqueado (se revive con un fragmento)', tex: 'coral_blanco', hardness: 0.6, tool: 'pickaxe', sound: 'stone' },
  // v12.15.1 (C6 «Manos de maestro»): los talleres (station 'taller': la cuadrícula solo da las recetas de su oficio) y lo que sale de ellos
  { id: 672, key: 'banco_carpintero', name: 'Banco de carpintero (clic derecho: tabla fina, muebles y más)', tex: { top: 'table_top', side: 'table_side', bottom: 'planks' }, hardness: 2.5, tool: 'axe', sound: 'wood', station: 'taller', taller: 'carpinteria' },
  { id: 673, key: 'fragua', name: 'Fragua (clic derecho: clavos, bisagras y herraduras; gasta leña)', tex: { top: 'cobble', side: 'bricks', bottom: 'cobble' }, hardness: 3, tool: 'pickaxe', sound: 'stone', station: 'taller', taller: 'herreria' },
  { id: 674, key: 'torno_alfarero', name: 'Torno de alfarero (clic derecho: barro amasado y engobes)', tex: { top: 'clay', side: 'planks', bottom: 'planks' }, hardness: 2, tool: 'axe', sound: 'wood', station: 'taller', taller: 'alfareria' },
  { id: 675, key: 'horno_barro', name: 'Horno de barro (clic derecho: cuece la cerámica; gasta leña)', tex: { top: 'clay', side: 'bricks', bottom: 'cobble' }, hardness: 3, tool: 'pickaxe', sound: 'stone', station: 'taller', taller: 'horno' },
  { id: 676, key: 'alacena', name: 'Alacena (guarda comida: se echa a perder a la mitad de prisa)', tex: { top: 'planks', side: 'planks', bottom: 'planks', front: 'chest_front' }, facing: true, hardness: 2, tool: 'axe', sound: 'wood', station: 'chest' },
  { id: 677, key: 'armario', name: 'Armario (18 casillas)', tex: { top: 'planks', side: 'planks', bottom: 'planks', front: 'chest_front' }, facing: true, hardness: 2, tool: 'axe', sound: 'wood', station: 'chest' },
  { id: 678, key: 'mesa_grande', name: 'Mesa grande (la mesa de la familia: comer sentado a ella rinde más)', tex: 'planks', render: 'shape', boxes: [[0, 12, 0, 16, 15, 16], [1, 0, 1, 3, 12, 3], [13, 0, 1, 15, 12, 3], [1, 0, 13, 3, 12, 15], [13, 0, 13, 15, 12, 15]], hardness: 1.5, tool: 'axe', sound: 'wood' },
  { id: 679, key: 'tinaja', name: 'Tinaja (guarda 9 cosas, ideal para el agua)', tex: 'clay', hardness: 1.2, tool: 'pickaxe', sound: 'stone', station: 'chest' },
  { id: 680, key: 'mostrador', name: 'Mostrador (ponga piezas de oficio: se venden solas de 8 a 5)', tex: { top: 'planks', side: 'planks', bottom: 'planks', front: 'chest_front' }, facing: true, hardness: 2, tool: 'axe', sound: 'wood', station: 'chest' },
  { id: 681, key: 'jarron_chorotega', name: 'Jarrón chorotega', tex: 'clay', render: 'shape', boxes: [[4, 0, 4, 12, 10, 12], [6, 10, 6, 10, 14, 10]], hardness: 0.6, sound: 'stone' },
  { id: 682, key: 'puerta_tallada', name: 'Puerta tallada (adorno de pared; da comodidad)', tex: 'planks', render: 'shape', boxes: [[0, 0, 7, 16, 16, 9]], hardness: 1.5, tool: 'axe', sound: 'wood' },
  { id: 683, key: 'verja_forjada', name: 'Verja forjada', tex: 'verja', render: 'cutout', hardness: 2.5, tool: 'pickaxe', sound: 'glass' },
  { id: 699, key: 'farol_cristal', name: 'Farol de cristal (luz fría que no se apaga y mantiene limpio el aire malo)', tex: { top: 'farol_top', side: 'farol', bottom: 'farol_top' }, render: 'shape', solid: false, glow: true, boxes: [[6, 0, 6, 10, 10, 10], [5, 10, 5, 11, 14, 11]], hardness: 0.8, tool: 'pickaxe', sound: 'glass' }, // v13.3.4 (CC1)
  { id: 684, key: 'farol_forjado', name: 'Farol forjado (luz de plaza)', tex: { top: 'farol_top', side: 'farol', bottom: 'farol_top' }, render: 'shape', solid: false, glow: true, boxes: [[7, 0, 7, 9, 12, 9], [5, 12, 5, 11, 16, 11]], hardness: 1, tool: 'pickaxe', sound: 'glass' },
  // v12.15.2 (C7 «Fuego de la tierra»): tubos de lava, fumarolas y aguas termales (el observatorio, la ceniza y la erupción quedan para otra vuelta)
  { id: 685, key: 'fumarola', name: 'Fumarola (vapor y gas: con la mascarilla se pica y suelta cristales de azufre)', tex: 'fumarola', hardness: 1.5, tool: 'pickaxe', sound: 'stone', drop: 1162 },
  { id: 688, key: 'aguas_termales', name: 'Aguas termales', tex: 'agua_termal', render: 'water', solid: false, hardness: -1, sound: 'water', level: 8, source: true, termal: true, hidden: true },
  { id: 689, key: 'cristal_azufre_bloque', name: 'Cristales de azufre', tex: 'cristal_azufre_bloque', hardness: 1.2, tool: 'pickaxe', sound: 'glass', drop: 1162 },
  { id: 690, key: 'veta_obsidiana', name: 'Veta de obsidiana (suelta lascas)', tex: 'veta_obsidiana', hardness: 5, tool: 'pickaxe', tier: 2, sound: 'stone', drop: 1160 },
  { id: 691, key: 'pomez_bloque', name: 'Bloque de pómez', tex: 'pomez_bloque', hardness: 0.8, tool: 'pickaxe', sound: 'stone', drop: 1163 },
  // v12.15.3 (C8-C): el mojón del camino (arte provisional: la textura de la pómez; ver PEDIDOS_ARTE.md)
  { id: 696, key: 'mojon_camino', name: 'Mojón del camino (obra del Comité de Caminos)', tex: 'pomez_bloque', render: 'shape', boxes: [[4, 0, 4, 12, 13, 12], [3, 13, 3, 13, 16, 13]], hardness: 2, tool: 'pickaxe', sound: 'stone' },
  // v12.15.4 (C8-B «Fiesta patronal»): estandarte, tarima y arco de la fiesta (arte provisional: lana y tablas; ver PEDIDOS_ARTE.md)
  { id: 693, key: 'estandarte_santo', name: 'Estandarte del santo (fiesta patronal)', tex: 'wool', render: 'shape', boxes: [[7, 0, 7, 9, 16, 9], [2, 4, 7.5, 14, 15, 8.5]], hardness: 0.8, tool: 'axe', sound: 'cloth' },
  { id: 694, key: 'tarima', name: 'Tarima (el escenario de la plaza)', tex: 'planks', render: 'shape', boxes: [[0, 0, 0, 16, 8, 16]], hardness: 2, tool: 'axe', sound: 'wood' },
  { id: 695, key: 'arco_fiesta', name: 'Arco de fiesta (la entrada a la plaza)', tex: 'planks', render: 'shape', boxes: [[0, 0, 6, 3, 16, 10], [13, 0, 6, 16, 16, 10], [0, 13, 5, 16, 16, 11]], hardness: 2, tool: 'axe', sound: 'wood' },
  { id: 661, key: 'banca_corredor', name: 'Banca de corredor (clic derecho: sentarse)', tex: 'planks', render: 'shape', solid: false, boxes: [[0, 6, 3, 16, 8, 13], [1, 0, 4, 3, 6, 12], [13, 0, 4, 15, 6, 12]], hardness: 1, tool: 'axe', sound: 'wood' },
  { id: 652, key: 'chanchito', name: 'Chanchito de barro', tex: { top: 'chanchito_lomo', side: 'chanchito_lado', bottom: 'chanchito_lado', front: 'chanchito_cara' }, render: 'model', facing: true, hardness: 0.8, sound: 'stone', station: 'chest', collide: [[3, 0, 2, 13, 10, 15]] },
  { id: 651, key: 'baul', name: 'Baúl grande', tex: { top: 'cofre_tapa', side: 'cofre_madera', bottom: 'cofre_madera', front: 'chest_front' }, facing: true, hardness: 2.5, tool: 'axe', sound: 'wood', station: 'chest' }, // 54 espacios (v11.8)
  { id: 244, key: 'refri', name: 'Refri', tex: { top: 'refri', side: 'refri', bottom: 'refri', front: 'refri_frente' }, facing: true, hardness: 2, tool: 'pickaxe', sound: 'stone', station: 'chest' },
  { id: 236, key: 'rotulo_soda', name: 'Rótulo de soda', tex: { top: 'planks', side: 'rotulo_soda', bottom: 'planks' }, hardness: 1, tool: 'axe', sound: 'wood' },
  { id: 235, key: 'fogata', name: 'Fogata', tex: { top: 'fogata_top', side: 'fogata', bottom: 'fogata_top' }, render: 'shape', solid: false, glow: true, anim: 1,
    boxes: [[1, 0, 6, 15, 3, 10], [6, 0, 1, 10, 3, 15], [4, 3, 4, 12, 9, 12]], hardness: 0.6, tool: 'axe', sound: 'wood' },
  { id: 232, key: 'palanca_on', name: 'Palanca', tex: 'palanca', render: 'shape', boxes: [[5, 0, 4, 11, 2, 12], [7, 2, 9, 9, 10, 11]], solid: false, hardness: 0.5, sound: 'stone', toggleTo: 'palanca', lever: true, drop: 231, hidden: true },
  // ---- v2.12: Tierras del Cielo ----
  { id: 185, key: 'nube', name: 'Nube', tex: 'nube', hardness: 0.3, sound: 'cloth', soft: true },
  { id: 186, key: 'portal_cielo', name: 'Portal del cielo', tex: 'portal_cielo', render: 'cutout', solid: false, hardness: 0, sound: 'glass', drop: 0, glow: true, hidden: true },
  { id: 187, key: 'piedra_cielo', name: 'Piedra celeste', tex: 'piedra_cielo', hardness: 2, tool: 'pickaxe', tier: 1, sound: 'stone' },
  // ---- v2.8: volcanes y cerros ----
  { id: 154, key: 'agua_acida', name: 'Laguna ácida', tex: 'agua_acida', render: 'water', solid: false, hardness: -1, sound: 'water', level: 8, source: true, acid: true, hidden: true },
  { id: 155, key: 'pajon', name: 'Pajonal', tex: 'pajon', render: 'cross', solid: false, hardness: 0, sound: 'grass', drop: 0, needsSupport: [1, 2], anim: 2 },
  { id: 156, key: 'azufre_bloque', name: 'Costra de azufre', tex: 'azufre_bloque', hardness: 1, tool: 'pickaxe', sound: 'stone', drop: 379 },
  { id: 153, key: 'arbolito_guanacaste', name: 'Arbolito de guanacaste', tex: 'arbolito_guanacaste', render: 'cross', solid: false, hardness: 0, sound: 'grass', drop: 384, needsSupport: [1, 2], crop: 'guanacaste', stage: 0, hidden: true },
  { id: 152, key: 'repello_rojo', name: 'Repello rojo', tex: 'repello_rojo', hardness: 1.5, tool: 'pickaxe', sound: 'stone' },
  // ---- v2.5: Inframundo Volcánico ----
  { id: 140, key: 'portal', name: 'Portal volcánico', tex: 'portal', render: 'cutout', solid: false, hardness: 0, sound: 'glass', drop: 0, glow: true, hidden: true },
  { id: 141, key: 'ceniza', name: 'Ceniza', tex: 'ceniza', hardness: 0.5, tool: 'shovel', sound: 'sand', gravity: true },
  { id: 142, key: 'basalto_columnar', name: 'Basalto columnar', tex: { top: 'basalto_col_top', side: 'basalto_col', bottom: 'basalto_col_top' }, hardness: 2.5, tool: 'pickaxe', tier: 1, sound: 'stone' },
  { id: 143, key: 'azufre_ore', name: 'Mena de azufre', tex: 'azufre_ore', hardness: 2, tool: 'pickaxe', tier: 1, sound: 'stone', drop: 379 },
  { id: 144, key: 'oro_volcanico', name: 'Oro volcánico', tex: 'oro_volcanico', hardness: 3, tool: 'pickaxe', tier: 2, sound: 'stone', drop: 259, glow: true },
  { id: 145, key: 'magma', name: 'Magma', tex: 'magma', hardness: 1.5, tool: 'pickaxe', tier: 1, sound: 'stone', glow: true, magma: true },
  { id: 146, key: 'hongo_fuego', name: 'Hongo de fuego', tex: 'hongo_fuego', render: 'cross', solid: false, hardness: 0, sound: 'grass', glow: true, needsSupport: [141, 142, 66, 145] },
  { id: 147, key: 'piedra_pomez', name: 'Piedra pómez', tex: 'piedra_pomez', hardness: 1, tool: 'pickaxe', tier: 1, sound: 'stone' },
  // ---- v2.2: biomas ticos ----
  { id: 135, key: 'tronco_musgoso', name: 'Tronco con musgo', tex: { top: 'log_top', side: 'tronco_musgoso', bottom: 'log_top' }, hardness: 2, tool: 'axe', sound: 'wood' },
  { id: 136, key: 'bromelia', name: 'Bromelia', tex: 'bromelia', render: 'cross', solid: false, hardness: 0, sound: 'grass', needsSupport: [1, 2, 8, 85, 25, 135, 7, 84, 138] },
  { id: 137, key: 'helecho', name: 'Helecho', tex: 'helecho', render: 'cross', solid: false, hardness: 0, sound: 'grass', drop: 0, needsSupport: [1, 2, 135, 138] },
  { id: 138, key: 'musgo', name: 'Alfombra de musgo', tex: 'musgo', render: 'shape', boxes: [[0, 0, 0, 16, 1, 16]], solid: false, hardness: 0.1, sound: 'grass' },
  { id: 139, key: 'travertino', name: 'Travertino', tex: 'travertino', hardness: 1.5, tool: 'pickaxe', tier: 1, sound: 'stone' },
  // ---- v1.9: mar y costa ----
  { id: 108, key: 'coral_red', name: 'Coral rojo', tex: 'coral_red', hardness: 0.6, tool: 'pickaxe', sound: 'stone' },
  { id: 109, key: 'coral_orange', name: 'Coral anaranjado', tex: 'coral_orange', hardness: 0.6, tool: 'pickaxe', sound: 'stone' },
  { id: 110, key: 'coral_yellow', name: 'Coral amarillo', tex: 'coral_yellow', hardness: 0.6, tool: 'pickaxe', sound: 'stone' },
  { id: 111, key: 'coral_purple', name: 'Coral morado', tex: 'coral_purple', hardness: 0.6, tool: 'pickaxe', sound: 'stone', glow: true },
  { id: 100, key: 'stove', name: 'Fogón de leña', tex: { top: 'stove_top', side: 'stove_side', bottom: 'stove_side', front: 'stove_front' }, hardness: 3, tool: 'pickaxe', sound: 'stone', facing: true, station: 'cooking', glow: true },
  { id: 83, key: 'lava_fall', name: 'Lava', tex: 'lava', render: 'lava', solid: false, hardness: -1, sound: 'water', glow: true, level: 8, falling: true, hidden: true },
];

// ---- v2.1: construcción (losas, escaleras de 4 orientaciones, cerca, farol). Cajas en dieciseisavos ----
const SLABS = [
  [112, 'losa_tablas', 'Losa de tablas', 'planks', 'planks', 'axe', 'wood', 2],
  [113, 'losa_piedra', 'Losa de piedra labrada', 'cobble', 'cobble', 'pickaxe', 'stone', 2],
  [114, 'losa_lisa', 'Losa de piedra lisa', 'smooth_stone', 'smooth_stone', 'pickaxe', 'stone', 2],
  [115, 'losa_teja', 'Losa de teja', { top: 'teja', side: 'teja_side', bottom: 'planks' }, 'teja', 'pickaxe', 'stone', 1.2],
  [116, 'losa_adobe', 'Losa de adobe', 'adobe', 'adobe', 'pickaxe', 'stone', 1.5],
  [204, 'losa_asfalto', 'Losa de asfalto', 'asfalto', 'asfalto', 'pickaxe', 'stone', 1.5],
];
for (const [id, key, name, tex, full, tool, sound, hardness] of SLABS) defs.push({ id, key, name, tex, render: 'shape', boxes: [[0, 0, 0, 16, 8, 16]], slab: true, full, tool, sound, hardness, tier: tool === 'pickaxe' ? 1 : 0 });
const STAIRS = [
  [117, 'escalera_tablas', 'Escalera de tablas', 'planks', 'axe', 'wood', 2],
  [121, 'escalera_piedra', 'Escalera de piedra labrada', 'cobble', 'pickaxe', 'stone', 2],
  [125, 'escalera_teja', 'Escalera de teja', { top: 'teja', side: 'teja_side', bottom: 'planks' }, 'pickaxe', 'stone', 1.2],
  [129, 'escalera_adobe', 'Escalera de adobe', 'adobe', 'pickaxe', 'stone', 1.5],
];
// la mitad alta queda hacia donde mira la escalera (0 +z, 1 +x, 2 -z, 3 -x)
const STAIR_TOP = [[0, 8, 8, 16, 16, 16], [8, 8, 0, 16, 16, 16], [0, 8, 0, 16, 16, 8], [0, 8, 0, 8, 16, 16]];
for (const [base, key, name, tex, tool, sound, hardness] of STAIRS) {
  for (let f = 0; f < 4; f++) defs.push({ id: base + f, key: f ? `${key}${f}` : key, name, tex, render: 'shape', boxes: [[0, 0, 0, 16, 8, 16], STAIR_TOP[f]], stairBase: base, drop: base, hidden: f > 0, tool, sound, hardness, tier: tool === 'pickaxe' ? 1 : 0 });
}
// v2.9: mural del cielo raso del teatro (4x2 bloques) y rueda grande de carreta (3x3, en los dos sentidos)
for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) defs.push({ id: 157 + j * 4 + i, key: `mural_${i}_${j}`, name: 'Mural del Teatro', tex: { top: 'planks', side: 'plaster', bottom: `mural_${i}_${j}` }, hardness: 1, tool: 'pickaxe', sound: 'stone', drop: 0, hidden: true });
for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
  const tex = { top: 'planks', side: `ruedag_${i}_${j}`, bottom: 'planks' };
  defs.push({ id: 165 + j * 3 + i, key: `ruedag_${i}_${j}`, name: 'Rueda grande de carreta', tex, render: 'shape', boxes: [[7, 0, 0, 9, 16, 16]], hardness: 1.5, tool: 'axe', sound: 'wood', drop: 149, hidden: true });
  defs.push({ id: 174 + j * 3 + i, key: `ruedagz_${i}_${j}`, name: 'Rueda grande de carreta', tex, render: 'shape', boxes: [[0, 0, 7, 16, 16, 9]], hardness: 1.5, tool: 'axe', sound: 'wood', drop: 149, hidden: true });
}
defs.push(
  { id: 133, key: 'cerca', name: 'Cerca de madera', tex: 'planks', render: 'shape', fence: true, collide: [[0, 0, 0, 16, 24, 16]], hardness: 2, tool: 'axe', sound: 'wood' },
  { id: 134, key: 'farol', name: 'Farol', tex: { top: 'farol_top', side: 'farol', bottom: 'farol_top' }, render: 'shape', solid: false, glow: true, anim: 1, toggleTo: 'farol_off',
    boxes: [[5, 1, 5, 11, 9, 11], [6, 9, 6, 10, 10, 10], [7.5, 10, 7.5, 8.5, 16, 8.5]], hardness: 0.5, sound: 'glass' },
);

export const BLOCKS = [];
export const BLOCK_BY_KEY = {};
for (const d of defs) {
  const b = {
    render: 'cube',
    solid: true,
    tool: null,
    tier: 0,
    drop: d.id,
    gravity: false,
    ...d,
  };
  if (typeof b.tex === 'string') b.tex = { top: b.tex, side: b.tex, bottom: b.tex };
  if (!b.tex.front) b.tex.front = b.tex.side;
  b.opaque = b.render === 'cube';
  // variación: rotar la textura de arriba / reflejar los lados según la posición, para que no se note la repetición
  b.vary = ['grass', 'dirt', 'stone', 'sand', 'gravel', 'snow', 'snow_grass', 'clay', 'bedrock', 'cobble', 'leaves', 'birch_leaves', 'wool', 'mossy', 'coal_ore', 'iron_ore', 'gold_ore', 'diamond_ore'].includes(b.key);
  b.flipSides = b.vary && b.key !== 'grass' && b.key !== 'snow_grass';
  // tinte por bioma (arriba del pasto, hojas y pasto alto)
  b.tint = ['grass', 'leaves', 'tall_grass', 'birch_leaves'].includes(b.key);
  // animación en el shader: 1 = hojas que se mecen, 2 = plantas, 3 = agua
  b.anim = d.anim || (b.leafy ? 1 : b.render === 'cross' ? 2 : b.render === 'water' ? 3 : 0);
  // que el raycast apunte a una caja más chica en plantas y antorchas
  b.thin = b.render === 'cross' || b.render === 'torch';
  b.fluid = b.render === 'water' || b.render === 'lava';
  b.isBlock = true;
  BLOCKS[b.id] = b;
  BLOCK_BY_KEY[b.key] = b.id;
}
BLOCKS[0] = { id: 0, key: 'air', name: 'Aire', render: 'none', solid: false, opaque: false, hardness: 0, tex: null, isBlock: true };
for (let i = 0; i < MAX_BLOCK; i++) if (!BLOCKS[i]) BLOCKS[i] = BLOCKS[0];

// Tablas rápidas para el mallado y la física.
export const OPAQUE = new Uint8Array(MAX_BLOCK);
export const SOLID = new Uint8Array(MAX_BLOCK);
export const LIGHT_BLOCK = new Uint8Array(MAX_BLOCK); // bloquea la luz del cielo
for (let i = 0; i < MAX_BLOCK; i++) {
  OPAQUE[i] = BLOCKS[i].opaque ? 1 : 0;
  SOLID[i] = BLOCKS[i].solid ? 1 : 0;
  LIGHT_BLOCK[i] = BLOCKS[i].opaque || BLOCKS[i].render === 'water' ? 1 : 0;
}
// cajas de colisión (unidades de bloque) para los bloques con forma; null = cubo entero
export const BOXES = new Array(MAX_BLOCK).fill(null);
for (let i = 0; i < MAX_BLOCK; i++) {
  const b = BLOCKS[i];
  const src = b.collide || b.boxes;
  if ((b.render === 'shape' || b.render === 'model') && src && b.solid) BOXES[i] = src.map((q) => q.map((v) => v / 16));
}
// las puertas: su caja depende de para dónde mira y de la bisagra (está en la entidad del bloque): la arma world.cajas()
export const CAJA_DINAMICA = new Uint8Array(MAX_BLOCK);
for (let i = 0; i < MAX_BLOCK; i++) if (BLOCKS[i].door && BLOCKS[i].render === 'model') CAJA_DINAMICA[i] = 1;
export const WATER = 11;
export const LAVA = 53;
// familia de fluido: 1 = agua, 2 = lava; nivel 0..8
export const FLUID = new Uint8Array(MAX_BLOCK);
export const FLUID_LEVEL = new Uint8Array(MAX_BLOCK);
for (let i = 0; i < MAX_BLOCK; i++) {
  FLUID[i] = BLOCKS[i].render === 'water' ? 1 : BLOCKS[i].render === 'lava' ? 2 : 0;
  FLUID_LEVEL[i] = BLOCKS[i].level || 0;
}
export const isWater = (id) => FLUID[id] === 1;
export const isLava = (id) => FLUID[id] === 2;
// id del bloque de un fluido con cierto nivel (8 sin fuente = cayendo)
export function fluidId(fam, level, falling = false) {
  if (fam === 1) return falling ? 79 : level >= 8 ? WATER : 71 + level;
  return falling ? 83 : level >= 8 ? LAVA : 79 + Math.max(1, Math.min(3, Math.ceil(level / 2)));
}

// ---------- Ítems (no bloques) ----------
const TOOL_MATS = [
  { mat: 'wood', name: 'madera', tier: 1, speed: 2, dur: 60, dmg: 0, color: [150, 116, 66], sprite: 'bronze' },
  { mat: 'stone', name: 'piedra', tier: 2, speed: 4, dur: 132, dmg: 1, color: [125, 125, 125], sprite: 'iron' },
  { mat: 'iron', name: 'hierro', tier: 3, speed: 6, dur: 251, dmg: 2, color: [222, 222, 222], sprite: 'silver' },
  { mat: 'diamond', name: 'diamante', tier: 4, speed: 8, dur: 1562, dmg: 3, color: [80, 230, 220], sprite: 'diamond' },
  { mat: 'jade', name: 'jade', tier: 5, speed: 10, dur: 2400, dmg: 4, color: [60, 170, 110], sprite: 'diamond', tintJade: true },
];
const TOOL_KINDS = [
  { kind: 'pickaxe', name: 'Pico', baseDmg: 2, sprite: 'pick' },
  { kind: 'axe', name: 'Hacha', baseDmg: 3, sprite: 'axe' },
  { kind: 'shovel', name: 'Pala', baseDmg: 1.5, sprite: 'shovel' },
  { kind: 'sword', name: 'Espada', baseDmg: 4, sprite: 'sword' },
  { kind: 'hoe', name: 'Azada', baseDmg: 1, sprite: 'hoe' },
];

export const ITEMS = {};
const simpleItems = [
  { id: 256, key: 'stick', name: 'Palo', sprite: 'stick' },
  { id: 257, key: 'coal', name: 'Carbón', sprite: 'ore_coal' },
  { id: 258, key: 'iron', name: 'Hierro', sprite: 'ore_iron' },
  { id: 259, key: 'gold', name: 'Oro', sprite: 'ore_gold' },
  { id: 260, key: 'diamond', name: 'Diamante', sprite: 'ore_diamond' },
  { id: 261, key: 'apple', name: 'Manzana', food: 4, sprite: 'apple' },
  { id: 262, key: 'meat', name: 'Carne cruda', food: 6, sprite: 'meat' },
  { id: 263, key: 'bread', name: 'Gallo pinto', food: 8, sprite: 'stew' },
  { id: 264, key: 'brick', name: 'Ladrillo' },
  { id: 265, key: 'cooked_meat', name: 'Carne asada', food: 9 },
  { id: 266, key: 'door', name: 'Puerta', places: 38 },
  { id: 267, key: 'corn_seeds', name: 'Semillas de maíz', places: 45, plant: true },
  { id: 268, key: 'corn', name: 'Mazorca', food: 3 },
  { id: 269, key: 'beans', name: 'Frijoles', places: 49, plant: true },
  { id: 270, key: 'tortilla', name: 'Tortilla', food: 6 },
  { id: 271, key: 'leather', name: 'Cuero' },
  { id: 272, key: 'quartz', name: 'Cuarzo' },
  { id: 273, key: 'jade_shard', name: 'Fragmento de jade', sprite: 'ore_emerald' },
  { id: 274, key: 'jade_ingot', name: 'Lingote de jade' },
  { id: 275, key: 'banana', name: 'Banano', food: 4 },
  { id: 276, key: 'papaya', name: 'Papaya', food: 5 },
  { id: 277, key: 'macaw_feather', name: 'Pluma de lapa' },
  { id: 278, key: 'quetzal_feather', name: 'Pluma de quetzal' },
  { id: 279, key: 'honey', name: 'Miel de melipona', food: 4, cures: true },
  { id: 280, key: 'guano', name: 'Guano (abono)', fertilizer: true },
  { id: 281, key: 'antivenom', name: 'Suero antiofídico', cures: true, drink: true },
  { id: 282, key: 'net', name: 'Red para mariposas', net: true },
  { id: 283, key: 'jar', name: 'Frasco vacío' },
  { id: 284, key: 'dart_frog', name: 'Rana dardo (en frasco)' },
  { id: 285, key: 'lucky_amulet', name: 'Amuleto de la suerte' },
  { id: 286, key: 'morpho_jar_item', name: 'Frasco con morfo', places: 93 },
  { id: 287, key: 'egg', name: 'Huevo' },
  { id: 288, key: 'fried_egg', name: 'Huevo frito', food: 5 },
  { id: 289, key: 'bucket', name: 'Balde', bucket: 'empty' },
  { id: 290, key: 'water_bucket', name: 'Balde con agua', bucket: 'water' },
  { id: 291, key: 'lava_bucket', name: 'Balde con lava', bucket: 'lava' },
  { id: 292, key: 'milk_bucket', name: 'Balde de leche', food: 4, cures: true, returns: 289 },
  { id: 293, key: 'saddle', name: 'Albarda' },
  { id: 294, key: 'coffee_cherry', name: 'Café en cereza', places: 94, plant: true },
  { id: 295, key: 'roasted_coffee', name: 'Café tostado' },
  { id: 296, key: 'cane_item', name: 'Caña de azúcar', places: 98 },
  { id: 297, key: 'tapa_dulce', name: 'Tapa de dulce', food: 2 },
  { id: 298, key: 'cafe_chorreado', name: 'Café chorreado', food: 2, energy: 120, sip: true },
  { id: 299, key: 'agua_dulce', name: 'Agua dulce', food: 4, energy: 60, sip: true },
  { id: 350, key: 'pinto_huevo', name: 'Gallo pinto con huevo', food: 12 },
  { id: 351, key: 'casado', name: 'Casado', food: 16 },
  { id: 352, key: 'chifrijo', name: 'Chifrijo', food: 11 },
  { id: 353, key: 'tamal', name: 'Tamal', food: 11 },
  { id: 356, key: 'platano_maduro', name: 'Plátano maduro', food: 6 },
  // la plata (v11.10.3, plata.js): monedas y billetes de Tiquicia con arte propio; «plata» es el valor en colones
  { id: 329, key: 'moneda_5', name: 'Moneda de 5', stack: 999, plata: 5, sprite: 'plata_5' },
  { id: 346, key: 'moneda_10', name: 'Moneda de 10', stack: 999, plata: 10, sprite: 'plata_10' },
  { id: 347, key: 'moneda_25', name: 'Moneda de 25', stack: 999, plata: 25, sprite: 'plata_25' },
  { id: 348, key: 'moneda_50', name: 'Moneda de 50', stack: 999, plata: 50, sprite: 'plata_50' },
  { id: 349, key: 'moneda_100', name: 'Moneda de 100', stack: 999, plata: 100, sprite: 'plata_100' },
  { id: 360, key: 'colon', name: 'Moneda de 500', stack: 999, plata: 500, sprite: 'plata_500' }, // la de siempre: el «colón» del juego vale ₡500
  { id: 354, key: 'billete_1000', name: 'Billete de 1000 (el de la carreta)', stack: 99, plata: 1000, sprite: 'plata_1000' },
  { id: 355, key: 'billete_2000', name: 'Billete de 2000 (el de la guaria)', stack: 99, plata: 2000, sprite: 'plata_2000' },
  { id: 359, key: 'billete_5000', name: 'Billete de 5000 (el del volcán)', stack: 99, plata: 5000, sprite: 'plata_5000' },
  { id: 385, key: 'billete_20', name: 'Billete de 10 000 (el del yigüirro)', stack: 99, plata: 10000, sprite: 'plata_10000' }, // el «de 20» de la v11.10 valía justo esto
  { id: 370, key: 'billete_20000', name: 'Billete de 20 000 (el de la ballena)', stack: 99, plata: 20000, sprite: 'plata_20000' },
  { id: 386, key: 'billete_50', name: 'Billete viejo de 25 000 (cámbielo donde un comerciante)', stack: 99, plata: 25000 },
  { id: 387, key: 'billete_100', name: 'Billete viejo de 50 000 (cámbielo donde un comerciante)', stack: 99, plata: 50000 },
  { id: 357, key: 'cana_pescar', name: 'Caña de pescar', rod: true },
  { id: 325, key: 'machete', name: 'Machete', machete: true, damage: 4, dur: 250 },
  { id: 328, key: 'machete_cadejos', name: 'Machete del Cadejos', machete: true, damage: 9, dur: 900 },
  { id: 326, key: 'arco', name: 'Arco', bow: true, dur: 200 },
  { id: 327, key: 'flecha', name: 'Flecha' },
  { id: 374, key: 'bombeta', name: 'Bombeta (clic derecho: al cielo; planeando con las alas, un empujón)' },
  { id: 375, key: 'guaro', name: 'Guaro de caña', food: 1, sip: true, guaro: true },
  { id: 377, key: 'mango', name: 'Mango', food: 4 },
  { id: 378, key: 'llave_volcan', name: 'Llave del volcán' },
  { id: 388, key: 'pluma_dorada', name: 'Pluma dorada' },
  { id: 395, key: 'hongo_potrero', name: 'Hongo de potrero', food: 1, trip: 120 },
  { id: 396, key: 'cajeta', name: 'Cajeta de leche', food: 5 },
  { id: 397, key: 'chicharron', name: 'Chicharrón', food: 8 },
  { id: 406, key: 'pluma_arpia', name: 'Pluma de la Arpía' },
  { id: 408, key: 'cacao', name: 'Semillas de cacao', food: 1 },
  { id: 416, key: 'arroz_con_leche', name: 'Arroz con leche', food: 7 },
  { id: 417, key: 'sopa_negra', name: 'Sopa negra', food: 11, cures: true },
  { id: 418, key: 'gallo_picadillo', name: 'Gallos de picadillo', food: 8 },
  { id: 419, key: 'platano_queso', name: 'Plátano con queso', food: 9 },
  { id: 420, key: 'tres_leches', name: 'Tres leches', food: 8 },
  { id: 421, key: 'cafe_con_leche', name: 'Café con leche', food: 4, energy: 180, sip: true },
  { id: 422, key: 'arroz', name: 'Arroz' },
  { id: 423, key: 'repelente', name: 'Repelente de limón' },
  { id: 425, key: 'bola', name: 'Bola de fútbol' },
  { id: 426, key: 'cantimplora_vacia', name: 'Cantimplora (vacía)' },
  { id: 427, key: 'cantimplora', name: 'Cantimplora con agua', stack: 1 },
  { id: 428, key: 'sabila', name: 'Sábila' },
  { id: 429, key: 'manzanilla', name: 'Manzanilla' },
  { id: 430, key: 'hierbabuena', name: 'Hierbabuena' },
  { id: 431, key: 'jengibre', name: 'Jengibre' },
  { id: 432, key: 'honda', name: 'Honda', dur: 150, stack: 1 },
  { id: 433, key: 'cerbatana', name: 'Cerbatana', dur: 120, stack: 1 },
  { id: 434, key: 'dardo', name: 'Dardo envenenado' },
  { id: 435, key: 'jabalina', name: 'Jabalina (para tirar)', stack: 4 },
  { id: 436, key: 'colmillo_jaguar', name: 'Colmillo del Jaguar viejo' },
  { id: 437, key: 'diente_cocodrilo', name: 'Diente del cocodrilo del Tárcoles' },
  { id: 438, key: 'veneno_reina', name: 'Veneno de la Terciopelo reina' },
  // v3.46: pejibayes
  { id: 492, key: 'racimo_pejibaye', name: 'Racimo de pejibayes (crudos)' },
  { id: 493, key: 'pejibaye', name: 'Pejibayes cocinados', food: 5 },
  { id: 494, key: 'pejibaye_mayonesa', name: 'Pejibayes con mayonesa', food: 9 },
  { id: 495, key: 'pedazo_tierra', name: 'Pedazo de la tierra' },
  { id: 496, key: 'pedazo_agua', name: 'Pedazo del agua' },
  { id: 497, key: 'pedazo_fuego', name: 'Pedazo del fuego' },
  { id: 498, key: 'pedazo_cielo', name: 'Pedazo del cielo' },
  { id: 499, key: 'esencia_sombra', name: 'Esencia de sombra' },
  { id: 503, key: 'machete_zenaida', name: 'Machete de Zenaida', machete: true, damage: 8, dur: 800 },
  { id: 505, key: 'chancleta_zenaida', name: 'Chancleta de Zenaida (clic derecho: se tira y vuelve)', damage: 3, dur: 350, mat: 'leather' },
  { id: 507, key: 'cucharon_zenaida', name: 'Cucharón de Zenaida (con tenerlo, la comida rinde más)', stack: 1 },
  { id: 508, key: 'tablilla', name: 'Tablilla (arregla la pierna quebrada)' },
  { id: 521, key: 'sobre_estampas', name: 'Sobre de estampas (clic derecho: abrirlo)' },
  { id: 534, key: 'cuchara_oro', name: 'Cuchara de Oro del concurso de gallo pinto' },
  // v4.99: armas nuevas, los trofeos de los jefes del monte y lo que se hace con ellos (jefes2.js)
  { id: 535, key: 'cuchillo', name: 'Cuchillo de monte (rápido; por la espalda pega el triple)', clase: 'cuchillo', damage: 5, dur: 250, mat: 'iron' },
  { id: 536, key: 'seda_reina', name: 'Seda de la Reina Bananera' },
  { id: 537, key: 'cuerno_hercules', name: 'Cuerno de Don Cornudo' },
  { id: 538, key: 'glandula_tata', name: 'Glándula del Tata Sapo' },
  { id: 539, key: 'cascabel_llano', name: 'Cascabel de la Cascabel del Llano' },
  { id: 540, key: 'pinza_rey', name: 'Pinza del Cangrejo Rey' },
  { id: 541, key: 'colmillo_ciempies', name: 'Colmillo del Ciempiés Rey' },
  { id: 542, key: 'ofrenda', name: 'Ofrenda del monte (de noche, en el bioma de un jefe: lo llama)' },
  { id: 543, key: 'mazo_cuerno', name: 'Mazo de cuerno (pega en área y rompe escudos)', clase: 'mazo', damage: 14, dur: 700, mat: 'cuerno' },
  { id: 544, key: 'lanza_colmillo', name: 'Lanza de colmillo (envenena)', clase: 'lanza', damage: 10, dur: 600, mat: 'cuerno', veneno: true },
  { id: 1161, key: 'cuchillo_obsidiana', name: 'Cuchillo de obsidiana (afilado y frágil: para cazar, no para jefes)', clase: 'cuchillo', damage: 6, dur: 120, mat: 'cuerno', icono: 'cuchillo', tinte: '#101020' },
  { id: 545, key: 'cuchillo_pinza', name: 'Cuchillo de pinza (hace sangrar)', clase: 'cuchillo', damage: 8, dur: 600, mat: 'cuerno' },
  // v5.1: el final (final.js, alas.js)
  { id: 551, key: 'pluma_rey', name: 'Pluma del Rey Zopilote' },
  { id: 552, key: 'corona_monte', name: 'Corona del monte (de noche, en lo más alto: llama al Rey Zopilote)' },
  { id: 553, key: 'polvora', name: 'Pólvora de bombeta' },
  { id: 554, key: 'cana_brava', name: 'Caña brava' },
  { id: 559, key: 'muneco_practica', name: 'Muñeco de práctica (póngalo en el suelo; clic derecho le cambia el material)' },
  { id: 558, key: 'gancho', name: 'Gancho con mecate (clic derecho a un bloque lejos: lo jala hasta allá)', dur: 200, mat: 'iron' },
  { id: 557, key: 'machete_viento', name: 'Machete del Viento (el golpe fuerte suelta un tajo de viento)', machete: true, damage: 10, dur: 1500, mat: 'pluma' },
  { id: 555, key: 'flecha_fuego', name: 'Flecha de fuego (quema un rato)' },
  { id: 556, key: 'flecha_veneno', name: 'Flecha envenenada' },
  // v12.1.0 C1 «Fogón y despensa» (despensa.js): leña, sal, lo que se guarda y la botica de infusiones
  { id: 561, key: 'lena', name: 'Leña (clic derecho a la fogata o al fogón)' },
  { id: 562, key: 'sal', name: 'Sal' },
  { id: 563, key: 'carne_ahumada', name: 'Carne ahumada (dura semanas)', food: 11 },
  { id: 564, key: 'carne_salada', name: 'Carne salada (dura semanas)', food: 9 },
  { id: 565, key: 'pescado_salado', name: 'Pescado salado (dura semanas)', food: 6 },
  { id: 566, key: 'agua_manzanilla', name: 'Agua de manzanilla (calma el cuerpo: quita el mareo y el escalofrío)', food: 1, sip: true },
  { id: 567, key: 'agua_jengibre', name: 'Agua de jengibre (quita el dolor de panza y da aguante)', food: 1, sip: true },
  { id: 568, key: 'te_hierbabuena', name: 'Té de hierbabuena (panza tranquila y sin garrapatas)', food: 1, sip: true },
  { id: 569, key: 'jarabe_sabila', name: 'Jarabe de sábila (para la sangre y cura)', food: 1, sip: true },
  { id: 570, key: 'sobras', name: 'Sobras (para la compostera)' },
  // v12.4.0 C4 «Pura vida en la finca»: del trapiche
  { id: 574, key: 'guarapo', name: 'Balde de guarapo (jugo de caña: quita la sed y da aire; dura un día)', food: 1, sip: true, returns: 289 },
  { id: 575, key: 'miel_cana', name: 'Miel de caña', food: 3 },
  // v12.4.2 C4 parte 2: para el zaguate y el premio de la feria
  { id: 576, key: 'collar_cuero', name: 'Collar de cuero (clic derecho a su zaguate: más vida y elegancia)' },
  { id: 577, key: 'liston_feria', name: 'Listón de la feria (premio a la mejor cosecha del cantón)', stack: 1 },
  { id: 548, key: 'antidoto', name: 'Antídoto del Tata (quita el veneno y lo aguanta un rato)', food: 1, sip: true },
  { id: 533, key: 'fraccion_rifa', name: 'Fracción de la Rifa Dominical (ficticia): se canta el domingo a mediodía' },
  { id: 532, key: 'lampara_carburo', name: 'Lámpara de carburo de Don Eliseo (salió de la mina)' },
  { id: 531, key: 'foto_vela', name: 'Foto con el pez vela (lo devolvió al mar)' },
  { id: 530, key: 'farol_goleta', name: 'Farol de la goleta fantasma (el recuerdo del capitán: todavía alumbra verde)' },
  { id: 529, key: 'cacho_toro', name: 'Cacho del Toro Guaco (clic derecho: lo sopla y espanta a las criaturas)' },
  { id: 526, key: 'piel_becquer', name: 'Piel de bécquer' },
  { id: 525, key: 'mascarilla', name: 'Mascarilla de gases (en la mochila, protege de los gases del cráter)' },
  { id: 524, key: 'guaco', name: 'Guaco (clic derecho: cura la mordida de culebra)' },
  { id: 523, key: 'agua_bendita', name: 'Agua bendita (clic derecho: 3 minutos en que sus golpes le entran a los espantos)', bendita: true },
  { id: 522, key: 'bomba_espalda', name: 'Bomba de espalda (clic derecho: rocía agua lejos; se llena en el agua)', dur: 8, agua: true },
  { id: 520, key: 'sello_goma', name: 'Sello de goma (a veces deja aturdido)', machete: true, damage: 8, dur: 600 },
  { id: 519, key: 'sello_oficina', name: 'Sello de oficina' },
  { id: 518, key: 'otra_chancleta', name: 'La otra chancleta (con las dos, se pega más duro)' },
  { id: 517, key: 'sobre_marielos', name: 'Sobre sellado: «Para Marielos»' },
  { id: 516, key: 'catalejo_wilber', name: 'Catalejo de Mae Wilber' },
  { id: 515, key: 'mata_flor', name: 'La mata de Doña Flor' },
  { id: 514, key: 'recetario_chepa', name: 'Recetario de Niña Chepa' },
  { id: 513, key: 'martillo_tino', name: 'Martillo de Ñor Tino' },
  { id: 512, key: 'escritura_casa', icono: 'escritura', name: 'Escritura de la casa, de 1931' }, // antes compartía la clave con la del lote (389)
  { id: 511, key: 'hoja_firmas', name: 'Hoja de firmas (clic derecho a un vecino)' },
  { id: 510, key: 'cigarros_62', name: 'Cigarros del 62, sin abrir (un recuerdo)' },
  { id: 509, key: 'tranca', name: 'Tranca (clic derecho a una puerta)' },
  { id: 502, key: 'maletin', name: 'Maletín del tío Rigo', stack: 1 },
  { id: 501, key: 'candela_regreso', name: 'Candela de regreso (clic derecho: vuelve a donde durmió)' },
  { id: 500, key: 'aceite_filo', name: 'Aceite de filo (clic derecho: va a su mejor arma)' },
  { id: 491, key: 'saco_gangoche', name: 'Saco de gangoche (clic derecho: carrera de sacos)', stack: 1 },
  { id: 490, key: 'permiso_todo', name: 'Permiso de Todo (sellado siete veces)', stack: 1 },
  { id: 488, key: 'arco_cintas', name: 'Arco de cintas (clic derecho: armarlo)' },
  { id: 489, key: 'cinta', name: 'Cinta de la carrera de cintas', stack: 16 },
  { id: 487, key: 'carreta_bueyes', name: 'Carreta con bueyes (clic derecho al suelo: ponerla)', stack: 1 },
  { id: 486, key: 'peluche_perezoso', name: 'Peluche de perezoso (premio de feria)', stack: 1 },
  { id: 485, key: 'trofeo_pesca', name: 'Trofeo del torneo de pesca', stack: 1 },
  // v3.27: comida guanacasteca
  { id: 480, key: 'yuca', name: 'Yuca', food: 1 },
  { id: 481, key: 'vigoron', name: 'Vigorón', food: 9 },
  { id: 482, key: 'rosquillas', name: 'Rosquillas', food: 4 },
  { id: 483, key: 'tanelas', name: 'Tanelas', food: 5 },
  { id: 484, key: 'arroz_con_pollo', name: 'Arroz con pollo', food: 10 },
  { id: 479, key: 'tabla_surf', name: 'Tabla de surf (clic derecho en el mar)', stack: 1 },
  { id: 478, key: 'bandera_circuito', name: 'Bandera de circuito (clic derecho: aros en el cielo)', stack: 1 },
  { id: 477, key: 'avioneta', name: 'Avioneta (clic derecho al suelo: ponerla)', stack: 1 },
  { id: 476, key: 'parapente', name: 'Parapente (clic derecho cayendo: abrirlo)', stack: 1 },
  { id: 473, key: 'papalote', name: 'Papalote (clic derecho: volarlo)', stack: 1 },
  { id: 474, key: 'trompo', name: 'Trompo (clic derecho al piso: bailarlo)' },
  { id: 475, key: 'chumicos', name: 'Chumicos (clic derecho a un vecino: jugar)' },
  { id: 471, key: 'silbato_reto', name: 'Silbato del reto (clic derecho: arma la arena)' },
  { id: 472, key: 'copa_reto', name: 'Copa del reto', stack: 1 },
  { id: 470, key: 'mechon_congo', name: 'Mechón del Mono congo (clic derecho: aullar)', stack: 1 },
  { id: 466, key: 'corona_pina', name: 'Corona de piña (para sembrar)', places: 607, plant: true },
  { id: 467, key: 'pina', name: 'Piña', food: 4 },
  { id: 468, key: 'fresco_pina', name: 'Fresco de piña', food: 3, energy: 60, sip: true },
  { id: 469, key: 'cajeta_pina', name: 'Cajeta de piña', food: 6 },
  { id: 465, key: 'fragmento_meteorito', name: 'Fragmento de meteorito' },
  { id: 464, key: 'escama_sirena', name: 'Escama de sirena' },
  { id: 463, key: 'red_pesca_item', name: 'Red de pesca' },
  { id: 462, key: 'cartelito', name: 'Cartelito para nombre' },
  { id: 458, key: 'cajuela', name: 'Cajuela (canasto para coger café)', stack: 1 },
  { id: 459, key: 'cajuela_llena', name: 'Cajuela llena de café' },
  { id: 460, key: 'batea', name: 'Batea', dur: 80, stack: 1 },
  { id: 461, key: 'pepita', name: 'Pepita de oro' },
  { id: 457, key: 'lancha', name: 'Lancha con motor', stack: 1 },
  { id: 455, key: 'bicicleta', name: 'Bicicleta', stack: 1 },
  { id: 456, key: 'moto', name: 'Moto', stack: 1 },
  { id: 452, key: 'plano_adobe', name: 'Plano: casita de adobe', stack: 1 },
  { id: 453, key: 'plano_madera', name: 'Plano: casa de madera con corredor', stack: 1 },
  { id: 454, key: 'plano_rancho', name: 'Plano: rancho de playa', stack: 1 },
  // v12.7.0 (C5-A1 «Pesca a fondo»): las cañas por nivel y la carnada
  { id: 1100, key: 'cana_fibra', name: 'Caña de fibra (río, estero y arrecife)', rod: true, icono: 'cana_pescar', tinte: '#e8c850' },
  { id: 1101, key: 'cana_altamar', name: 'Caña de altamar (mar adentro, en bote)', rod: true, icono: 'cana_pescar', tinte: '#2c4a78' },
  { id: 1102, key: 'lombriz', name: 'Lombriz (carnada de río)' },
  { id: 1103, key: 'sardina', name: 'Sardina (carnada de mar)', icono: 'corvina', tinte: '#9fc0e0' },
  { id: 1104, key: 'senuelo', name: 'Señuelo (carnada de estero; dura 60 usos)', dur: 60, stack: 1 },
  { id: 1121, key: 'fragmento_coral', name: 'Fragmento de coral (plántelo en un coral blanco)' }, // v12.6.0 (C5-B)
  { id: 1124, key: 'estaca_nido', name: 'Estaca de nido (clic derecho a un nido de la arribada)' },
  { id: 1125, key: 'banderita_azul', name: 'Banderita azul (100 tortuguitas al mar)', stack: 1 },
  { id: 1126, key: 'cabuya', name: 'Cabuya (fibra para amarrar)' },
  // v12.15.1 (C6): herramientas, piezas y obras de los tres oficios (mango y barro amasado llevan el ícono de un palo y un ladrillo, de pedido)
  { id: 1130, key: 'serrucho', name: 'Serrucho (herramienta de carpintería)', stack: 1 },
  { id: 1131, key: 'cepillo', name: 'Cepillo de carpintero (da las tablas finas)', stack: 1 },
  { id: 1132, key: 'formon', name: 'Formón (para la talla)', stack: 1 },
  { id: 1133, key: 'martillo_forja', name: 'Martillo de forja', stack: 1 },
  { id: 1134, key: 'tenazas', name: 'Tenazas', stack: 1 },
  { id: 1135, key: 'clavos', name: 'Clavos' },
  { id: 1136, key: 'bisagras', name: 'Bisagras' },
  { id: 1137, key: 'mango_madera', name: 'Mango de madera', icono: 'stick', tinte: '#a06a3a' },
  { id: 1138, key: 'tabla_fina', name: 'Tabla fina (cepillada)' },
  { id: 1139, key: 'barro_amasado', name: 'Barro amasado', icono: 'brick', tinte: '#b87a58' } /* el arte manda; el ladrillo tinteado es el respaldo */,
  { id: 1140, key: 'engobe_rojo', name: 'Engobe rojo' },
  { id: 1141, key: 'engobe_negro', name: 'Engobe negro' },
  { id: 1142, key: 'engobe_crema', name: 'Engobe crema' },
  { id: 1143, key: 'herradura', name: 'Herradura (el caballo corre un 10 % más si la lleva en la mochila)' },
  { id: 1144, key: 'candado', name: 'Candado (de herrería; se vende en el mostrador)' },
  { id: 1145, key: 'olla_barro', name: 'Olla de barro (en la mochila, los platos salen un 10 % más llenos)', stack: 1 },
  { id: 1146, key: 'comal', name: 'Comal (en la mochila, tortillas y arepas dan 1 más)', stack: 1 },
  { id: 1147, key: 'vajilla_chorotega', name: 'Vajilla chorotega (se vende en el mostrador)' },
  { id: 1148, key: 'cayuco', name: 'Cayuco (canoa de un tronco: al 70 % del bote, sin cofre)', boat: true },
  { id: 1149, key: 'yugo', name: 'Yugo (de carpintería; se vende en el mostrador)', stack: 1 },
  { id: 1150, key: 'libro_carpinteria', name: 'Libro de carpintería (clic derecho: abre los niveles 1 a 3)', stack: 1 },
  { id: 1151, key: 'libro_herreria', name: 'Libro de herrería (clic derecho: abre los niveles 1 a 3)', stack: 1 },
  { id: 1152, key: 'libro_alfareria', name: 'Libro de alfarería (clic derecho: abre los niveles 1 a 3)', stack: 1 },
  { id: 1153, key: 'sello_maestro', name: 'Sello de maestro (en la mochila, a nivel 8 salen obras maestras)', stack: 1 },
  // v12.15.2 (C7): materiales del volcán, comida y el pase de los termales (sin arte propio todavía: PEDIDOS_ARTE.md)
  { id: 1160, key: 'lasca_obsidiana', name: 'Lasca de obsidiana (filo de volcán)', icono: 'brick', tinte: '#101020' },
  { id: 1162, key: 'cristal_azufre', name: 'Cristal de azufre (azufre puro de las fumarolas)', icono: 'azufre', tinte: '#f8e060' },
  { id: 1163, key: 'piedra_pomez', name: 'Piedra pómez (liviana)', icono: 'brick', tinte: '#d8d4c8' },
  { id: 1165, key: 'huevo_termal', name: 'Huevo de aguas termales (cocido en la poza con sal volcánica)', food: 7, icono: 'egg', tinte: '#58c0d4' },
  { id: 1169, key: 'pase_termales', name: 'Pase a los termales (clic derecho: 10 minutos en las pozas)', icono: 'cartelito', tinte: '#58c0d4' },
  { id: 1188, key: 'sello_comite', name: 'Sello del Comité de Caminos (de Don Evelio)', icono: 'cartelito', tinte: '#c8a040', stack: 1 },
  { id: 1189, key: 'pase_caminos', name: 'Pase de los Caminos (el bus entre los pueblos del Comité es gratis)', icono: 'cartelito', tinte: '#58a858', stack: 1 },
  // v12.15.4 (C8-B): la fiesta patronal (arte provisional con íconos teñidos; las máscaras 1182–1184 van más abajo, como cascos)
  { id: 1180, key: 'tambor_cimarrona', name: 'Tambor de cimarrona (clic derecho: tocar un golpe)', icono: 'cartelito', tinte: '#a8683a', stack: 1 },
  { id: 1181, key: 'trompeta', name: 'Trompeta (clic derecho: tocar una nota)', icono: 'cartelito', tinte: '#e8c040', stack: 1 },
  { id: 1185, key: 'banda_mayordomo', name: 'Banda de mayordomo (honor de la fiesta patronal)', icono: 'cartelito', tinte: '#4878d8', stack: 1 },
  { id: 1186, key: 'vela_novena', name: 'Vela de la novena (clic derecho en el pueblo, la noche de la novena)', icono: 'cartelito', tinte: '#f4ecc8' },
  // v12.16.5 (fase 7 del final): los únicos del Rey. La campana (clic derecho en el patio: llama a la mesa) y la mantilla (el epílogo); la foto es un bloque (698)
  { id: 1190, key: 'campana_casa', name: 'Campana de la casa (clic derecho en el patio: llama a la gente a la mesa)', stack: 1 },
  { id: 1191, key: 'mantilla_zenaida', name: 'Mantilla de Zenaida (en el bolso: recibe 5 % menos de daño)', stack: 1 },
  // v13.3.4 (CC1, cuevacosas.js): el botín de las cuevas (arte provisional con íconos teñidos)
  { id: 1192, key: 'esquirla_cristal', name: 'Esquirla de cristal (salta de los racimos: farol, eco y lente)', icono: 'azufre', tinte: '#8fe0ff' },
  { id: 1193, key: 'cristal_eco', name: 'Cristal de eco (clic derecho bajo tierra: marca salones y hitos cercanos 20 s; 12 usos)', icono: 'azufre', tinte: '#c9a8ff', stack: 1, dur: 12 },
  { id: 1195, key: 'sopa_hongo', name: 'Sopa de hongo (comida buena y vista nocturna 2 minutos)', icono: 'caldo_hongo', tinte: '#e8c888', food: 7, sip: true },
  { id: 1187, icono: 'libro_recetas', tinte: '#7a5030', key: 'libro_encargos', name: 'Libro de encargos (clic derecho: los que lleva)', stack: 1 }, // v12.4.12 (C8-A): el primer ítem del rango EXT_ITEM
  { id: 578, key: 'plano_bahareque', name: 'Plano: casa de bahareque con corredor', stack: 1 }, // v12.4.7 (C4)
  { id: 448, key: 'pan_casero', name: 'Pan casero de la abuela', food: 9 },
  { id: 449, key: 'agua_de_sapo', name: 'Agua de sapo', food: 3, sip: true },
  { id: 450, key: 'arroz_con_leche_zenaida', icono: 'arroz_con_leche', name: 'Arroz con leche de Zenaida', food: 8 }, // la receta aprendida: rinde más y llena más
  { id: 451, key: 'libro_recetas', name: 'Libro de recetas viejo', stack: 1 },
  { id: 447, key: 'mochila', name: 'Mochila de cuero', stack: 1 },
  { id: 446, key: 'brocha', name: 'Brocha', dur: 96, stack: 1 },
  { id: 444, key: 'mapa_tesoro', name: 'Mapa del tesoro', stack: 1 },
  { id: 445, key: 'careta', name: 'Careta de buceo', stack: 4 },
  { id: 440, key: 'venda', name: 'Venda' },
  { id: 441, key: 'alcohol', name: 'Alcohol' },
  { id: 442, key: 'suero', name: 'Suero oral' },
  { id: 443, key: 'botiquin', name: 'Botiquín', stack: 4 },
  { id: 439, key: 'machete_doble', name: 'Machete de doble filo', machete: true, damage: 8, dur: 700 },
  { id: 424, key: 'corazon_monte', name: 'Corazón del monte', food: 8, monte: true },
  { id: 409, key: 'chocolate', name: 'Chocolate artesanal', food: 6, energy: 90 },
  { id: 410, key: 'queso_turrialba', name: 'Queso Turrialba', food: 7 },
  { id: 411, key: 'natilla', name: 'Natilla', food: 4 },
  { id: 398, key: 'corazon_arenal', name: 'Corazón del Arenal', food: 6, corazon: true },
  { id: 392, key: 'olla_carne', name: 'Olla de carne', food: 15 },
  { id: 393, key: 'empanada', name: 'Empanada', food: 7 },
  { id: 394, key: 'chorreada', name: 'Chorreada', food: 6 },
  { id: 391, key: 'mechero', name: 'Mechero', dur: 48 },
  { id: 390, key: 'bidon', name: 'Bidón de combustible' },
  { id: 389, key: 'escritura', name: 'Escritura de lote con vista al mar' },
  { id: 413, key: 'escritura_pueblo', name: 'Escritura de lote en el pueblo' },
  { id: 384, key: 'oreja_guanacaste', name: 'Oreja de guanacaste (semilla)', places: 153, plant: true },
  { id: 381, key: 'churchill', name: 'Churchill', food: 6, energy: 60 },
  { id: 382, key: 'pipa', name: 'Pipa fría', food: 3, sip: true },
  { id: 383, key: 'copo', name: 'Copo', food: 3 },
  { id: 379, key: 'azufre', name: 'Azufre' },
  { id: 380, key: 'caldo_hongo', name: 'Caldo de hongo de fuego', food: 3, sip: true, ignifugo: 120, returns: 289 },
  { id: 371, key: 'colmillo_cadejos', name: 'Colmillo del Cadejos' },
  { id: 372, key: 'calavera_segua', name: 'Calavera de la Segua' },
  { id: 373, key: 'lagrima_llorona', name: 'Lágrima de la Llorona' },
  { id: 358, key: 'bote', name: 'Bote de remos', boat: true },
  { id: 414, key: 'carro_viejo', name: 'Carro viejo (de segunda)' },
  { id: 415, key: 'polea', name: 'Polea de tirolesa' },
  { id: 361, key: 'pargo', name: 'Pargo rojo', food: 2 },
  { id: 362, key: 'corvina', name: 'Corvina', food: 2 },
  { id: 363, key: 'guapote', name: 'Guapote', food: 2 },
  { id: 364, key: 'dorado', name: 'Dorado', food: 3 },
  // v12.7.0 (C5-A1): las especies nuevas (se compran, no se venden en tienda)
  { id: 1105, key: 'machaca', name: 'Machaca (de río)', food: 2, icono: 'guapote', tinte: '#c8d0d8' },
  { id: 1106, key: 'tilapia', name: 'Tilapia (de río)', food: 2, icono: 'guapote', tinte: '#7a8a9a' },
  { id: 1107, key: 'robalo', name: 'Róbalo (de estero)', food: 2, icono: 'corvina', tinte: '#d8d890' },
  { id: 1108, key: 'trucha', name: 'Trucha (de río frío)', food: 2, icono: 'guapote', tinte: '#e8a0b8' },
  { id: 1109, key: 'sabalo', name: 'Sábalo (de estero)', food: 3, icono: 'corvina', tinte: '#f0f4ff' },
  { id: 1110, key: 'pez_gallo', name: 'Pez gallo', food: 3, icono: 'dorado', tinte: '#a0a0c0' },
  { id: 1111, key: 'atun', name: 'Atún (de altamar)', food: 4, icono: 'corvina', tinte: '#3a5a9a' },
  // v12.7.2 (C5-A2): los mariscos y la cocina del mar
  { id: 1113, key: 'langosta', name: 'Langosta (solo sale en la nasa del arrecife)', food: 3 },
  { id: 1114, key: 'camaron', name: 'Camarón', food: 1 },
  { id: 1115, key: 'piangua', name: 'Piangua (de las raíces del manglar)', food: 1 },
  { id: 1116, key: 'ostion', name: 'Ostión', food: 1 },
  { id: 1117, key: 'sopa_mariscos', name: 'Sopa de mariscos', food: 12, icono: 'sopa_negra', tinte: '#e07a40' },
  { id: 1118, key: 'arroz_camarones', name: 'Arroz con camarones', food: 10, icono: 'arroz_con_pollo', tinte: '#f09070' },
  { id: 1119, key: 'langosta_gratinada', name: 'Langosta gratinada', food: 14 },
  { id: 1120, key: 'pescado_seco', name: 'Pescado seco (dura un mes)', food: 4, icono: 'pescado_frito', tinte: '#c8a060' },
  { id: 1112, key: 'pargo_mancha', name: 'Pargo mancha (de arrecife)', food: 2, icono: 'pargo', tinte: '#f07a40' },
  { id: 365, key: 'pescado_frito', name: 'Pescado frito', food: 8 },
  { id: 366, key: 'ceviche', name: 'Ceviche', food: 10 },
  { id: 367, key: 'limon', name: 'Limón mandarina', food: 1 },
  { id: 368, key: 'bota_vieja', name: 'Bota vieja' },
  { id: 369, key: 'perla', name: 'Perla' },
];
for (const it of simpleItems) ITEMS[it.id] = { ...it, isBlock: false, stack: it.stack ?? (it.net || it.rod || it.boat || it.dur || it.key === 'lucky_amulet' || it.key === 'saddle' || (it.bucket && it.bucket !== 'empty') || it.key === 'milk_bucket' ? 1 : it.key === 'bucket' || it.key === 'egg' ? 16 : 64), durability: it.net || it.rod ? 64 : it.dur }; // el stack declarado manda (v11.10.2: antes se ignoraba y la bici o la jabalina se apilaban a 64)

export const TOOL_IDS = {};
// Los ids de herramientas no pueden cambiar (están en las partidas guardadas):
// 300-315 = (pico, hacha, pala, espada) × (madera, piedra, hierro, diamante); lo nuevo va después.
function toolId(ki, mi) {
  if (ki < 4 && mi < 4) return 300 + ki * 4 + mi;
  if (ki === 4) return 316 + mi; // azadas 316-320
  return 321 + ki; // herramientas de jade 321-324
}
for (const [ki, k] of TOOL_KINDS.entries()) {
  for (const [mi, m] of TOOL_MATS.entries()) {
    const id = toolId(ki, mi);
    ITEMS[id] = {
      id,
      key: `${m.mat}_${k.kind}`,
      name: `${k.name} de ${m.name}`,
      isBlock: false,
      stack: 1,
      tool: k.kind,
      tier: m.tier,
      speed: m.speed,
      durability: m.dur,
      damage: k.baseDmg + m.dmg,
      mat: m.mat,
      color: m.color,
      sprite: `${k.sprite}_${m.sprite}`,
      tintJade: !!m.tintJade,
    };
    TOOL_IDS[`${m.mat}_${k.kind}`] = id;
  }
}

// ---------- Armadura ----------
export const ARMOR_SLOTS = ['head', 'chest', 'legs', 'feet'];
const ARMOR_MATS = [
  { mat: 'leather', name: 'cuero', pts: [1, 3, 2, 1], dur: 80, tough: 0, color: '#8a5a33' },
  { mat: 'iron', name: 'hierro', pts: [2, 6, 5, 2], dur: 240, tough: 0, color: '#c9ccd1' },
  { mat: 'diamond', name: 'diamante', pts: [3, 8, 6, 3], dur: 530, tough: 2, color: '#5fe3dc' },
  { mat: 'jade', name: 'jade', pts: [3, 8, 6, 3], dur: 700, tough: 4, color: '#3caa6c' },
];
const ARMOR_PIECES = [
  { slot: 'head', name: 'Casco', k: 0 },
  { slot: 'chest', name: 'Pechera', k: 1 },
  { slot: 'legs', name: 'Pantalones', k: 2 },
  { slot: 'feet', name: 'Botas', k: 3 },
];
export const ARMOR_IDS = {};
ARMOR_MATS.forEach((m, mi) => ARMOR_PIECES.forEach((p, pi) => {
  const id = 330 + mi * 4 + pi;
  ITEMS[id] = {
    id, key: `${m.mat}_${p.slot}`, name: `${p.name} de ${m.name}`, isBlock: false, stack: 1,
    armor: p.slot, armorSlot: pi, points: m.pts[p.k], toughness: m.tough, durability: m.dur, mat: m.mat, color: m.color,
  };
  ARMOR_IDS[`${m.mat}_${p.slot}`] = id;
}));

// la máscara de mascarada se usa como casco (disfraz)
// escudos (van en la mano izquierda: la quinta casilla del vestidor) y armas de combate
for (const [id, key, name, mat, block, dur, color] of [[560, 'escudo_concha', 'Escudo de concha (al desviar, devuelve el golpe)', 'concha', 0.85, 1200, '#d8c8a8'], [399, 'escudo_madera', 'Escudo de madera', 'wood', 0.55, 160, '#8a5a2c'], [400, 'escudo_hierro', 'Escudo de hierro', 'iron', 0.75, 420, '#a8adb4'], [401, 'escudo_jade', 'Escudo de jade', 'jade', 0.9, 1000, '#2e8a58']]) {
  ITEMS[id] = { id, key, name, isBlock: false, stack: 1, armor: 'offhand', armorSlot: 4, points: 0, toughness: 0, durability: dur, block, mat, color };
}
// el sombrero de la Tulevieja: casco con un poquito de protección y mucho estilo
ITEMS[1194] = { id: 1194, key: 'casco_lente', name: 'Casco con lente (la linterna llega más lejos bajo tierra)', isBlock: false, stack: 1, armor: 'head', armorSlot: 0, points: 2, toughness: 0, durability: 300, mat: 'iron', color: '#6cc8e8' }; // v13.3.4 (CC1)
ITEMS[1167] = { id: 1167, key: 'casco_minero', name: 'Casco de espeleólogo (con linterna propia: alumbra las cuevas)', isBlock: false, stack: 1, armor: 'head', armorSlot: 0, points: 2, toughness: 0, durability: 300, mat: 'iron', color: '#c89a30' };
ITEMS[1168] = { id: 1168, key: 'botas_ceniza', name: 'Botas de ceniza (lava y fuego a la mitad; no queman en ceniza caliente)', isBlock: false, stack: 1, armor: 'feet', armorSlot: 3, points: 1, toughness: 0, durability: 400, mat: 'leather', color: '#6a6660' };
ITEMS[504] = { id: 504, key: 'delantal_zenaida', name: 'Delantal de Zenaida', isBlock: false, stack: 1, armor: 'chest', armorSlot: 1, points: 6, toughness: 2, durability: 700, mat: 'leather', color: '#e8dcc0' };
ITEMS[506] = { id: 506, key: 'sombrero_zenaida', name: 'Sombrero de Zenaida', isBlock: false, stack: 1, armor: 'head', armorSlot: 0, points: 4, toughness: 2, durability: 500, mat: 'leather', color: '#c8a868' };
ITEMS[407] = { id: 407, key: 'capa_arpia', name: 'Capa de la Arpía', isBlock: false, stack: 1, armor: 'chest', armorSlot: 1, points: 7, toughness: 3, durability: 900, mat: 'arpia', color: '#4a4e5c' };
ITEMS[412] = { id: 412, key: 'sombrero_sabanero', name: 'Sombrero de sabanero', isBlock: false, stack: 1, armor: 'head', armorSlot: 0, points: 2, toughness: 1, durability: 400, mat: 'sabanero', color: '#7a5030' };
ITEMS[549] = { id: 549, key: 'alas_zopilote', name: 'Alas del Rey Zopilote (en el aire, Espacio: a planear)', isBlock: false, stack: 1, armor: 'chest', armorSlot: 1, points: 4, toughness: 1, durability: 600, mat: 'pluma', color: '#1a1a1e', alas: true };
ITEMS[546] = { id: 546, key: 'chaleco_seda', name: 'Chaleco de seda bananera (liviano; las telarañas no se le pegan)', isBlock: false, stack: 1, armor: 'chest', armorSlot: 1, points: 6, toughness: 2, durability: 700, mat: 'seda', color: '#e8dcb8', antiTela: true };
ITEMS[547] = { id: 547, key: 'botas_cascabel', name: 'Botas de cascabel (aguantan el veneno de las culebras y no hacen ruido)', isBlock: false, stack: 1, armor: 'feet', armorSlot: 3, points: 3, toughness: 2, durability: 600, mat: 'leather', color: '#8a6a44', antiCulebra: true };
ITEMS[527] = { id: 527, key: 'botas_becquer', name: 'Botas de bécquer (aguantan el veneno de las culebras)', isBlock: false, stack: 1, armor: 'feet', armorSlot: 3, points: 3, toughness: 1, durability: 450, mat: 'leather', color: '#6a5634', antiCulebra: true };
ITEMS[528] = { id: 528, key: 'panuelo_chata', name: 'Pañuelo de los Chatas (puesto, le confunden con alguien de la banda)', isBlock: false, stack: 1, armor: 'head', armorSlot: 0, points: 1, toughness: 0, durability: 250, mat: 'leather', color: '#7a1a1a', disfrazChata: true };
// v12.3.0 C3 «Lluvia y verano» (temporadas.js): ropa contra el aguacero, el sol y el frío. Sin defensa: o abrigo, o armadura
ITEMS[571] = { id: 571, key: 'capote_hule', name: 'Capote de hule (no lo moja el aguacero; ocupa el puesto de la pechera)', isBlock: false, stack: 1, armor: 'chest', armorSlot: 1, points: 0, toughness: 0, durability: 600, mat: 'leather', color: '#e8c020', capote: true };
ITEMS[572] = { id: 572, key: 'sombrero_paja', name: 'Sombrero de paja (quita el sol fuerte)', isBlock: false, stack: 1, armor: 'head', armorSlot: 0, points: 0, toughness: 0, durability: 400, mat: 'leather', color: '#e0c070' };
ITEMS[573] = { id: 573, key: 'cobija_lana', name: 'Cobija de lana (clic derecho: 4 minutos de abrigo, 5 usos)', isBlock: false, stack: 1, durability: 5 };
ITEMS[405] = { id: 405, key: 'sombrero_tule', name: 'Sombrero de tule', isBlock: false, stack: 1, armor: 'head', armorSlot: 0, points: 2, toughness: 1, durability: 500, mat: 'tule', color: '#c8aa68' };
ITEMS[402] = { id: 402, key: 'lanza', name: 'Lanza de hierro', isBlock: false, stack: 1, damage: 7, durability: 300, thrust: true, mat: 'iron' };
ITEMS[403] = { id: 403, key: 'mazo', name: 'Mazo de hierro', isBlock: false, stack: 1, damage: 11, durability: 350, slow: true, mat: 'iron' };
ITEMS[404] = { id: 404, key: 'garrote', name: 'Garrote de guayabo', isBlock: false, stack: 1, damage: 6, durability: 90, slow: true, mat: 'wood' };
ITEMS[376] = { id: 376, key: 'mascarada', name: 'Máscara de mascarada', isBlock: false, stack: 1, armor: 'head', armorSlot: 0, points: 1, toughness: 0, durability: 300, mat: 'mascarada', color: '#e04a8a' };
// v12.15.4 (C8-B): las máscaras de la mascarada costarricense (cartón pintado); sirven de disfraz como la 376
for (const [id, key, name, color] of [[1182, 'mascara_giganta', 'Máscara de giganta', '#f0d0a0'], [1183, 'mascara_calavera', 'Máscara de calavera', '#f4f0e8'], [1184, 'mascara_diablo', 'Máscara de diablo', '#c82a2a']]) ITEMS[id] = { id, key, name, isBlock: false, stack: 1, armor: 'head', armorSlot: 0, points: 1, toughness: 0, durability: 300, mat: 'mascarada', color };

export function getDef(id) {
  if (isBlockId(id)) return BLOCKS[id];
  return ITEMS[id] || null;
}

export function itemName(id) {
  const d = getDef(id);
  return d ? d.name : '???';
}

export function maxStack(id) {
  if (isBlockId(id)) return 64;
  return ITEMS[id] ? ITEMS[id].stack : 64;
}

// Todo lo que aparece en el catálogo del modo creativo.
export function creativeCatalog() {
  const list = [];
  for (let i = 1; i < MAX_BLOCK; i++) {
    if (!isBlockId(i)) continue;
    const b = BLOCKS[i];
    if (b.id === i && b.id !== 0 && b.key !== 'water' && b.key !== 'bedrock' && !b.hidden) list.push(i);
  }
  for (const id of Object.keys(ITEMS)) list.push(Number(id));
  return list;
}

// v11.11.3: el arte de GPT (public/sprites/arte/<clave>.png, 128 px): manda sobre el pixel art y el sprite viejo, que quedan de
// respaldo si la imagen no carga. Los pedidos están en docs/PEDIDOS_ARTE.md
export const ARTE = ['campana_casa', 'foto_cumbre', 'mantilla_zenaida', 'cigarros_62', 'agua_bendita', 'agua_dulce', 'agua_jengibre', 'agua_manzanilla', 'alcohol', 'antivenom', 'arco', 'azufre', 'bahareque', 'bahareque_encalado', 'banana', 'banca_corredor', 'beans', 'botiquin', 'bread', 'brick', 'bucket', 'cafe_chorreado', 'cajeta', 'capote_hule', 'carne_ahumada', 'carne_salada', 'casado', 'cascabel_llano', 'ceviche', 'chanchito', 'chancleta_zenaida', 'coal', 'cobija_lana', 'collar_cuero', 'colmillo_ciempies', 'cooked_meat', 'corn', 'corn_seeds', 'corona_monte', 'cucharon_zenaida', 'cuerno_hercules', 'delantal_zenaida', 'diamond', 'diamond_chest', 'diamond_feet', 'diamond_head', 'diamond_legs', 'diamond_pickaxe', 'diamond_sword', 'empanada', 'escritura', 'escudo_hierro', 'escudo_jade', 'escudo_madera', 'fogata_apagada', 'fogata_brasas', 'glandula_tata', 'gold', 'guarapo', 'guaro', 'hoja_firmas', 'honda', 'horcon', 'iron', 'iron_axe', 'iron_chest', 'iron_feet', 'iron_head', 'iron_hoe', 'iron_legs', 'iron_pickaxe', 'iron_shovel', 'iron_sword', 'jabalina', 'jade_chest', 'jade_feet', 'jade_head', 'jade_ingot', 'jade_legs', 'jade_sword', 'jarabe_sabila', 'lava_bucket', 'leather_chest', 'leather_feet', 'leather_head', 'leather_legs', 'lena', 'liston_feria', 'machete', 'meat', 'mecedora', 'miel_cana', 'milk_bucket', 'panuelo_chata', 'pescado_salado', 'pinto_huevo', 'pinza_rey', 'pluma_rey', 'postigo', 'sal', 'seda_reina', 'sobras', 'sombrero_paja', 'sombrero_zenaida', 'stick', 'stone_axe', 'stone_hoe', 'stone_pickaxe', 'stone_shovel', 'stone_sword', 'suero', 'tablilla', 'tamal', 'tapa_dulce', 'te_hierbabuena', 'techo_palma', 'trofeo_arpia', 'trofeo_cangrejo', 'trofeo_cascabel', 'trofeo_ciempies', 'trofeo_cornudo', 'trofeo_reina', 'trofeo_rey_zopilote', 'trofeo_senor_arenal', 'trofeo_tata', 'venda', 'water_bucket', 'wood_hoe', 'wood_pickaxe', 'wood_sword',
  // v12.8.9: el resto del arte ya generado (tools/conectar-arte.py)
  'arroz_camarones', 'atun', 'banderita_azul', 'billete_1000', 'billete_20', 'billete_2000', 'billete_20000', 'billete_5000', 'cabuya', 'camaron', 'cana_altamar', 'cana_fibra', 'colon', 'coral_blanco', 'fragmento_coral', 'langosta', 'langosta_gratinada', 'lombriz', 'machaca', 'moneda_10', 'moneda_100', 'moneda_25', 'moneda_5', 'moneda_50', 'nido_marcado', 'ostion', 'pargo_mancha', 'pecera', 'pescado_seco', 'pez_gallo', 'piangua', 'robalo', 'sabalo', 'sardina', 'secadero', 'senuelo', 'sopa_mariscos', 'tilapia', 'trucha', 'vivero_coral',
  // v12.15.1 (C6)
  'alacena', 'armario', 'banco_carpintero', 'barro_amasado', 'bisagras', 'candado', 'cayuco', 'cepillo', 'clavos', 'comal', 'engobe_crema', 'engobe_negro', 'engobe_rojo', 'formon', 'fragua', 'herradura', 'horno_barro', 'jarron_chorotega', 'libro_alfareria', 'libro_carpinteria', 'libro_herreria', 'martillo_forja', 'mesa_grande', 'mostrador', 'olla_barro', 'puerta_tallada', 'sello_maestro', 'serrucho', 'tabla_fina', 'tenazas', 'tinaja', 'torno_alfarero', 'vajilla_chorotega', 'verja_forjada', 'yugo'];
for (const k of ARTE) {
  const it = Object.values(ITEMS).find((x) => x && x.key === k) || (BLOCK_BY_KEY[k] !== undefined ? BLOCKS[BLOCK_BY_KEY[k]] : null);
  if (it) it.arte = `arte/${k}`;
}

// v12.7.0 (C5-A1, PREPARACION_C5_Y_JEFES_F2.md §«Lo que cambia» 3 y 4): un solo registro de cañas y de pescados crudos. Antes la caña
// 357 y los pescados 361–364 estaban escritos a mano en ~15 sitios; un pez nuevo que no estuviera ahí no se cocía ni se pudría
export const PESCADOS = new Set([361, 362, 363, 364, 1105, 1106, 1107, 1108, 1109, 1110, 1111, 1112, 1113, 1114, 1115, 1116]); // v12.7.2: y los mariscos crudos
export const esPescado = (id) => PESCADOS.has(id);
export const esCana = (id) => !!(ITEMS[id] && ITEMS[id].rod);

// v12.8.4 (decimoséptima revisión, punto 4): lo que RESPLANDECE (halo en Medio, bloom en Alto y Ultra): antorchas, lámparas, faroles,
// fogatas, lava, el horno y la cocina encendidos. v12.8.6: también el hongo de fuego, el corazón de Tiquicia, los portales y la jarra
// de morfos. «glow» es otra cosa: la bandera del motor de luz de vóxeles (todos esos bloques alumbran el mapa); los de SIN_RESPLANDOR
// alumbran pero no resplandecen. tools/revisar-luces.mjs exige que cada bloque con glow esté en una de las dos listas.
export const LUCES = new Set(['lamp', 'quartz_lamp', 'furnace_lit', 'stove', 'torch', 'wall_torch0', 'wall_torch1', 'wall_torch2', 'wall_torch3', 'lava', 'lava_flow1', 'lava_flow2', 'lava_flow3', 'lava_fall', 'magma', 'farol', 'farol_zenaida', 'fogata', 'fogata_brasas', 'farol_forjado', 'farol_cristal', 'hongo_fuego', 'corazon_tiquicia', 'portal', 'portal_cielo', 'morpho_jar']);
export const SIN_RESPLANDOR = new Set(['glow_mushroom', 'quartz_block', 'coral_purple', 'cristal', 'cristal_bloque', 'meteorito', 'oro_volcanico', 'tele_on']);
for (const b of BLOCKS) if (b && LUCES.has(b.key)) b.luz = true;
// v12.8.6 (decimoctava revisión, punto 2): el aAnim del mallador. El emisor del bloom SUMA 8 a la animación del bloque (el farol y la
// fogata tienen anim 1, el vaivén de la llama, y con un «||» se quedaban sin el 8); world.js lo separa con step(7.5)
export const animDe = (b) => (b ? (b.anim || 0) + (b.luz && b.render !== 'water' && b.render !== 'lava' && !b.level ? 8 : 0) : 0);
