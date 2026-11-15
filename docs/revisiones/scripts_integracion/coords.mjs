// Coordenadas fuera del trozo, bloques que no coinciden con sus datos, y dependencia del orden. node coords.mjs <raiz> <semilla> <ver>
import { pathToFileURL } from 'url';
const R=process.argv[2], seed=+process.argv[3], VER=+(process.argv[4]||23);
const U=(p)=>import(pathToFileURL(R+'/src/'+p).href);
const {Generator}=await U('worldgen.js'); const {BLOCKS,BLOCK_BY_KEY:K}=await U('blocks.js'); const E=await U('estructuras.js'); const V=await U('pueblogen.js'); const C=await U('carreteras.js');
const g=new Generator(seed,VER,'tierra','normal');
const S=2000;
const out={seed,chunks:0,entradas:0,fuera:0,sinBloque:0,sinBloqueTipos:{},fueraTipos:{},npcs:0,errores:0,orden:{probados:0,distintos:0,ejemplos:[]}};
const chunksSet=new Set();
const add=(x0,z0,x1,z1)=>{ for(let cz=Math.floor(z0/16);cz<=Math.floor(z1/16);cz++) for(let cx=Math.floor(x0/16);cx<=Math.floor(x1/16);cx++) chunksSet.add(cx+','+cz); };
const todas=E.structuresNear(g,0,0,S,null).filter(P=>Math.abs(P.x)<=S&&Math.abs(P.z)<=S);
const porTipo=new Map(); for(const P of todas){ if(!porTipo.has(P.type)) porTipo.set(P.type,[]); porTipo.get(P.type).push(P); }
for(const [t,l] of porTipo){ l.sort((a,b)=>Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z)); const r=E.structRadius(g,t)+4; for(const P of l.slice(0,2)) add(P.x-r,P.z-r,P.x+r,P.z+r); }
const vil=[]; for(let gz=-5;gz<=5;gz++) for(let gx=-5;gx<=5;gx++){ const v=V.villageAt(g,gx,gz); if(v&&Math.abs(v.x)<S&&Math.abs(v.z)<S) vil.push(v); }
vil.sort((a,b)=>Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z));
for(const v of vil.slice(0,4)){ const r=(v.R||46)+4; add(v.x-r,v.z-r,v.x+r,v.z+r); }
// tramos de carretera: chunks a lo largo de 3 tramos
for(const s of C.roadsNear(g,0,0,S).slice(0,4)) for(let i=0;i<s.n;i+=12) add(s.xs[i]-8,s.zs[i]-8,s.xs[i]+8,s.zs[i]+8);
const lista=[...chunksSet].map(k=>k.split(',').map(Number));
const refs=new Map();
for(const [cx,cz] of lista){
  const b=new Uint16Array(32768); let st=[];
  try{ st=g.generate(cx,cz,b,new Float32Array(768))||[]; }catch(e){ out.errores++; continue; }
  out.chunks++; refs.set(cx+','+cz,b);
  for(const s of st){
    if(s.npc||s.zone||s.beacon){ out.npcs++; continue; }
    out.entradas++;
    const tipo=(s.be&&s.be.type)||'?';
    if(!(s.x>=0&&s.x<16&&s.z>=0&&s.z<16&&s.y>=0&&s.y<128)){ out.fuera++; out.fueraTipos[tipo]=(out.fueraTipos[tipo]||0)+1; continue; }
    const id=b[s.x+s.z*16+s.y*256]; const bq=BLOCKS[id];
    if(!bq||(s.id?id!==s.id:bq.key!==s.be.type)){ out.sinBloque++; out.sinBloqueTipos[tipo]=(out.sinBloqueTipos[tipo]||0)+1; }
  }
}
// dependencia del orden: otro generador, orden aleatorio determinista, distinta vecindad calentada
const g2=new Generator(seed,VER,'tierra','normal');
let rs=seed; const rnd=()=>{ rs=(rs*1103515245+12345)&0x7fffffff; return rs/0x7fffffff; };
const muestra=lista.filter(()=>rnd()<0.25).slice(0,60);
// calentar: generar primero 40 trozos cualesquiera de la lista (otro orden), luego los de la muestra al revés
for(const [cx,cz] of lista.slice().sort(()=>rnd()-0.5).slice(0,40)) g2.generate(cx,cz,new Uint16Array(32768),new Float32Array(768));
for(const [cx,cz] of muestra.reverse()){
  const b=new Uint16Array(32768); g2.generate(cx,cz,b,new Float32Array(768));
  const r=refs.get(cx+','+cz); out.orden.probados++;
  let d=0; for(let i=0;i<32768;i++) if(b[i]!==r[i]) d++;
  if(d){ out.orden.distintos++; if(out.orden.ejemplos.length<3) out.orden.ejemplos.push([cx,cz,d]); }
}
console.log(JSON.stringify(out));
