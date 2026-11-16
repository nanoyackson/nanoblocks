import { pathToFileURL } from 'url';
const R=process.argv[2], seed=+process.argv[3], VER=+process.argv[4];
const U=(p)=>import(pathToFileURL(R+'/src/'+p).href);
const {Generator}=await U('worldgen.js'); const {BLOCK_BY_KEY:K}=await U('blocks.js');
const g=new Generator(seed,VER,'tierra','normal'); const sp=g.findSpawn();
const W=g.worldgen2||g; // intento de hallar cmNodo
let host=null; for(const k of Object.keys(g)){ if(g[k]&&typeof g[k].cmNodo==='function'){host=g[k];break;} } if(!host&&typeof g.cmNodo==='function')host=g;
if(!host){console.log('NOHOST',Object.keys(g).join(','));process.exit();}
const RC=96, cache=new Map();
const chunk=(cx,cz)=>{const k=cx+','+cz; let b=cache.get(k); if(!b){b=new Uint16Array(32768); g.generate(cx,cz,b,new Float32Array(768)); cache.set(k,b); if(cache.size>400){cache.delete(cache.keys().next().value);}} return b;};
const get=(x,y,z)=>chunk(Math.floor(x/16),Math.floor(z/16))[(x&15)+(z&15)*16+y*256];
const gx0=Math.floor((sp.x-1000)/RC), gx1=Math.floor((sp.x+1000)/RC), gz0=Math.floor((sp.z-1000)/RC), gz1=Math.floor((sp.z+1000)/RC);
const rows=[];
for(let gz=gz0;gz<=gz1;gz++)for(let gx=gx0;gx<=gx1;gx++){const n=host.cmNodo(gx,gz); if(!n.salon)continue;
  let tot=0,lava=0,agua=0,sol=0;
  for(let dz=-0.7;dz<=0.7;dz+=0.14)for(let dx=-0.7;dx<=0.7;dx+=0.14){ if(dx*dx+dz*dz>0.49)continue;
    const x=Math.floor(n.x+dx*n.rx), z=Math.floor(n.z+dz*n.rz);
    // columna: buscar celda de aire dentro del salón y bajar hasta el primer sólido/líquido
    let y=Math.floor(n.y); if(get(x,y,z)!==0 && get(x,y,z)!==K.water && get(x,y,z)!==K.lava) { y=Math.floor(n.y+n.ry*0.3); }
    let found=false; for(let yy=Math.floor(n.y+n.ry*0.5); yy>Math.floor(n.y-n.ry-6)&&yy>2; yy--){ const id=get(x,yy,z); if(id===0)continue; found=true; tot++; if(id===K.lava)lava++; else if(id===K.water)agua++; else sol++; break; }
  }
  if(tot>=20) rows.push({piso:Math.round(n.y-n.ry),lava:lava/tot,agua:agua/tot});
}
const band=(p)=>p>=45?'a_Alta>=45':p>=30?'b_Media30-44':p>=20?'c_Honda20-29':'d_Honda<20';
const out={}; for(const r of rows){const b=band(r.piso); const o=out[b]=out[b]||{n:0,lava50:0,agua50:0,liq50:0,lavaMed:0,aguaMed:0}; o.n++; if(r.lava>0.5)o.lava50++; if(r.agua>0.5)o.agua50++; if(r.lava+r.agua>0.5)o.liq50++; o.lavaMed+=r.lava; o.aguaMed+=r.agua;}
for(const b in out){out[b].lavaMed=+(out[b].lavaMed/out[b].n).toFixed(2); out[b].aguaMed=+(out[b].aguaMed/out[b].n).toFixed(2);}
console.log(JSON.stringify({seed,VER,salones:rows.length,out}));
