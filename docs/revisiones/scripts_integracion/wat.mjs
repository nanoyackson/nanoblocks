import { pathToFileURL } from 'url';
const R=process.argv[2], seed=+process.argv[3], VER=+(process.argv[4]||23), MAXT=+(process.argv[5]||3);
const U=(p)=>import(pathToFileURL(R+'/src/'+p).href);
const {Generator}=await U('worldgen.js'); const {BLOCK_BY_KEY:K}=await U('blocks.js'); const E=await U('estructuras.js'); const V=await U('pueblogen.js');
const SEA=62; const g=new Generator(seed,VER,'tierra','normal'); const gB=new Generator(seed,VER,'tierra','normal'); gB.structTypes=[]; gB.villageCache={has:()=>true,get:()=>null,set(){}};
const cache=new Map(); function ch(gen,tag,cx,cz){ const k=tag+cx+','+cz; let b=cache.get(k); if(b) return b; b=new Uint16Array(32768); gen.generate(cx,cz,b,new Float32Array(768)); cache.set(k,b); if(cache.size>800) cache.delete(cache.keys().next().value); return b; }
function medir(x0,z0,x1,z1){ let add=0, addMax=0, dom=0, cols=0; const seen=new Set();
 for(let cz=Math.floor(z0/16);cz<=Math.floor(z1/16);cz++)for(let cx=Math.floor(x0/16);cx<=Math.floor(x1/16);cx++){ const f=ch(g,'f',cx,cz), b=ch(gB,'b',cx,cz);
  for(let lz=0;lz<16;lz++)for(let lx=0;lx<16;lx++){ const x=cx*16+lx,z=cz*16+lz; if(x<x0||x>x1||z<z0||z>z1) continue; const h=g.column(x,z).h; let colAdd=0;
   for(let y=SEA+1;y<127;y++){ const i=lx+lz*16+y*256; if(f[i]===K.water && b[i]!==K.water){ add++; colAdd=y-SEA; } }
   if(colAdd>addMax) addMax=colAdd; if(colAdd>0) cols++; } } return {add,addMax,cols}; }
const res={seed,estructuras:[],pueblos:[]};
const S=2400; const todas=E.structuresNear(g,0,0,S,null).filter(P=>Math.abs(P.x)<=S&&Math.abs(P.z)<=S);
const por=new Map(); for(const P of todas){ if(!por.has(P.type)) por.set(P.type,[]); por.get(P.type).push(P); }
for(const [t,l] of por){ const r=E.structRadius(g,t); l.sort((a,b)=>Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z));
 for(const P of l.slice(0,MAXT)){ const o=medir(P.x-r-3,P.z-r-3,P.x+r+3,P.z+r+3); o.tipo=t; o.R=r; o.mar=g.column(P.x,P.z).h<SEA+3; res.estructuras.push(o); } }
const vil=[]; for(let gz=-6;gz<=6;gz++)for(let gx=-6;gx<=6;gx++){ const v=V.villageAt(g,gx,gz); if(v&&Math.abs(v.x)<S&&Math.abs(v.z)<S) vil.push(v); }
for(const v of vil.slice(0,4)){ const R2=v.R||46; const o=medir(v.x-R2,v.z-R2,v.x+R2,v.z+R2); o.id=v.id; res.pueblos.push(o); }
console.log(JSON.stringify(res));
