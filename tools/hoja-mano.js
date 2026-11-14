// v12.6.6: hoja de contactos de la mano. Pasa por los ítems (y algunos bloques) y, para cada uno, dibuja cómo se ve en la mano en
// primera persona (izquierda) y en tercera persona (derecha, la mano derecha del muñeco), con el tipo de agarre (agarre.js).
// Uso desde la consola, con un mundo abierto (el jugador en un lugar abierto, de día; 30 por hoja):
//   const H = await import('/tools/hoja-mano.js'); H.ids(window.nanoblocks.game).length   // cuántos hay
//   H.hoja(window.nanoblocks.game, 0)      // muestra la hoja 0 encima del juego; H.cerrar() la quita
// Se le toma captura a la pantalla: así salieron docs/capturas/v12.6.6/mano-*.jpg.
import * as THREE from 'three';
import { ITEMS, BLOCKS, isBlockId, getDef } from '../src/blocks.js';
import { tipoAgarre } from '../src/agarre.js';

const BLOQUES = ['stone', 'planks', 'torch', 'glass', 'flower_yellow', 'sand'];
export function ids(g) {
  // v12.8.2: también las armaduras y los escudos (antes se saltaban los que tenían armorSlot), al final, en su propia hoja
  const todos = Object.keys(ITEMS).map(Number).filter((i) => ITEMS[i] && ITEMS[i].key).sort((a, b) => a - b);
  const arm = (i) => ITEMS[i].armorSlot !== undefined, L = [...todos.filter((i) => !arm(i)), ...todos.filter(arm)];
  const B = BLOCKS.filter((b) => b && BLOQUES.includes(b.key)).map((b) => b.id);
  return [...B, ...L].filter((i) => g && (isBlockId(i) || getDef(i)));
}

let capa = null;
export function cerrar() { if (capa) { capa.remove(); capa = null; } }

export function hoja(g, n = 0, { porHoja = 30, cols = 6, solo = null } = {}) {
  cerrar();
  const todos = solo || ids(g), lista = todos.slice(n * porHoja, (n + 1) * porHoja); // solo: una lista de ids para mirar de cerca
  const W = innerWidth, H = innerHeight - 4, filas = Math.ceil(porHoja / cols), tw = Math.floor(W / cols), th = Math.floor(H / filas);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  Object.assign(cv.style, { position: 'fixed', left: '0', top: '0', zIndex: 99999, background: '#7aa7d8' });
  const ctx = cv.getContext('2d'); ctx.fillStyle = '#7aa7d8'; ctx.fillRect(0, 0, W, H);
  const r = g.renderer, inv = g.inventory, half = Math.floor(tw * 0.6), ih = th - 14;
  const rt1 = new THREE.WebGLRenderTarget(half, ih), rt3 = new THREE.WebGLRenderTarget(tw - half, ih);
  const cam3 = new THREE.PerspectiveCamera(40, (tw - half) / ih, 0.05, 50);
  const antes = { slot: inv.slots[inv.selected], view: g.view, aspect: g.handCamera.aspect };
  const leer = (rt, w, h, x, y) => {
    const px = new Uint8Array(w * h * 4); r.readRenderTargetPixels(rt, 0, 0, w, h, px);
    const im = ctx.createImageData(w, h);
    for (let yy = 0; yy < h; yy++) im.data.set(px.subarray((h - 1 - yy) * w * 4, (h - yy) * w * 4), yy * w * 4);
    ctx.putImageData(im, x, y);
  };
  const p = g.player;
  try {
    // la primera persona: el recorte de abajo a la derecha de una pantalla de 800 × 600 (donde va la mano), con la misma proporción
    const rh = 430, rw = Math.round(rh * half / ih);
    g.handCamera.aspect = 800 / 600; g.handCamera.setViewOffset(800, 600, 800 - rw, 600 - rh, rw, rh); g.handCamera.updateProjectionMatrix();
    lista.forEach((id, k) => {
      const x = (k % cols) * tw, y = Math.floor(k / cols) * th;
      inv.slots[inv.selected] = { id, count: 1 };
      g.view = 0; g.handHeldId = -2; g.equip = 0;
      for (let i = 0; i < 8; i++) g.updateHand(0.2, 1);
      // primera persona: solo la escena de la mano, con el cielo de fondo
      r.setRenderTarget(rt1); r.setClearColor(0x8fb8e8, 1); r.clear(); r.render(g.handScene, g.handCamera);
      leer(rt1, half, ih, x, y);
      // tercera persona: el muñeco del juego, de frente, mirando la mano derecha
      g.view = 1; p.yaw = 0; p.pitch = 0;
      g.avatar.update(0.05, g, true); g.avatar.update(0.05, g, true);
      const o = g.avatar.heldObj || g.avatar.P.armR, w0 = new THREE.Vector3(); o.getWorldPosition(w0);
      cam3.position.set(w0.x - 0.35, w0.y + 0.25, w0.z - 1.3); cam3.lookAt(w0.x, w0.y + 0.05, w0.z);
      r.setRenderTarget(rt3); r.setClearColor(0x8fb8e8, 1); r.clear(); r.render(g.scene, cam3);
      leer(rt3, tw - half, ih, x + half, y);
      ctx.fillStyle = '#123'; ctx.fillRect(x, y + ih, tw, 14);
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
      const d = getDef(id) || {};
      ctx.fillText(`${id} ${(d.key || '').slice(0, 18)} · ${tipoAgarre(id)}`, x + 3, y + ih + 11);
      ctx.strokeStyle = '#123'; ctx.strokeRect(x + 0.5, y + 0.5, tw - 1, th - 1);
    });
  } finally {
    r.setRenderTarget(null); rt1.dispose(); rt3.dispose();
    inv.slots[inv.selected] = antes.slot; g.view = antes.view; g.handCamera.clearViewOffset(); g.handCamera.aspect = antes.aspect; g.handCamera.updateProjectionMatrix(); g.handHeldId = -2;
  }
  document.body.appendChild(cv); capa = cv;
  return { hoja: n, de: Math.ceil(todos.length / porHoja), ids: lista.length };
}
