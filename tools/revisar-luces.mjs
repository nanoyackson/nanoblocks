// v12.8.6 (decimoctava revisión, punto 2): que cada bloque que brilla esté decidido. «glow» es la bandera del motor de luz de vóxeles;
// el resplandor (halo en Medio, bloom en Alto y Ultra) es de LUCES (b.luz). Cada bloque con glow tiene que estar en LUCES o en
// SIN_RESPLANDOR, y cada luz que no sea agua ni lava tiene que llegar al mallador con el +8 del emisor (animDe ≥ 8; en la v12.8.4 el
// farol y la fogata se quedaban sin él porque ya tenían anim 1). Uso: node tools/revisar-luces.mjs
import { BLOCKS, LUCES, SIN_RESPLANDOR, animDe } from '../src/blocks.js';

const err = [];
const conGlow = BLOCKS.filter((b) => b && b.glow);
const sinDecidir = conGlow.filter((b) => !LUCES.has(b.key) && !SIN_RESPLANDOR.has(b.key));
if (sinDecidir.length) err.push(`Con glow y sin decidir (súmelos a LUCES o a SIN_RESPLANDOR en blocks.js): ${sinDecidir.map((b) => b.key).join(', ')}`);
const enAmbas = [...LUCES].filter((k) => SIN_RESPLANDOR.has(k));
if (enAmbas.length) err.push(`En LUCES y en SIN_RESPLANDOR a la vez: ${enAmbas.join(', ')}`);
const claves = new Set(BLOCKS.filter(Boolean).map((b) => b.key));
const noExisten = [...LUCES, ...SIN_RESPLANDOR].filter((k) => !claves.has(k));
if (noExisten.length) err.push(`Claves que no son bloques: ${noExisten.join(', ')}`);
const luces = BLOCKS.filter((b) => b && b.luz);
const sinEmisor = luces.filter((b) => b.render !== 'water' && b.render !== 'lava' && !b.level && animDe(b) < 8);
if (sinEmisor.length) err.push(`Luces sin el +8 del emisor en el mallador: ${sinEmisor.map((b) => `${b.key} (aAnim ${animDe(b)})`).join(', ')}`);
const malAnim = BLOCKS.filter((b) => b && !b.luz && animDe(b) >= 8);
if (malAnim.length) err.push(`Bloques que no son luz con aAnim ≥ 8 (el vértice los tomaría por emisores): ${malAnim.map((b) => b.key).join(', ')}`);

console.log(`${conGlow.length} bloques con glow: ${luces.length} resplandecen (LUCES), ${SIN_RESPLANDOR.size} no (SIN_RESPLANDOR).`);
console.log(`Emisores del bloom: ${luces.filter((b) => animDe(b) >= 8).map((b) => `${b.key}${b.anim ? ` (${animDe(b)})` : ''}`).join(', ')}`);
if (err.length) { console.log('\n✘ ' + err.join('\n✘ ')); process.exitCode = 1; } else console.log('Todas las luces están decididas y llegan al mallador.');
