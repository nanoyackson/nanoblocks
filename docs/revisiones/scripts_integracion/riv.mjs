import { pathToFileURL } from 'url';
const R=process.argv[2], seed=+process.argv[3];
const U=(p)=>import(pathToFileURL(R+'/src/'+p).href);
const {Generator}=await U('worldgen.js'); const SEA=62;
const g=new Generator(seed,23,'tierra','normal'); const sp=g.findSpawn(); const A=1200, st=2;
const memo=new Map(); const col=(x,z)=>{const k=x*200003+z; let v=memo.get(k); if(!v){v=g.column(x,z); memo.set(k,v);} return v;};
const walls=[]; let total=0, area=(2*A/st)**2; let vert=0, alto=0;
const D=[[1,0],[-1,0],[0,1],[0,-1],[.7,.7],[-.7,.7],[.7,-.7],[-.7,-.7]];
for(let z=Math.round(sp.z)-A;z<Math.round(sp.z)+A;z+=st)for(let x=Math.round(sp.x)-A;x<Math.round(sp.x)+A;x+=st){ const c=col(x,z); if(c.biome==='ocean'||c.rio>=0.012||c.h>=SEA+1) continue; total++;
 let w=0,v=0; for(const [dx,dz] of D){ const h12=col(Math.round(x+dx*12),Math.round(z+dz*12)).h, h3=col(Math.round(x+dx*3),Math.round(z+dz*3)).h; w=Math.max(w,h12-c.h); v=Math.max(v,h3-c.h); } walls.push(w); if(w>=20&&v>=6) vert++; if(w>=20) alto++; if(memo.size>500000) memo.clear(); }
walls.sort((a,b)=>a-b); const pc=(p)=>walls[Math.floor(p*(walls.length-1))];
console.log(JSON.stringify({seed,cols:total,mediana:pc(.5),p75:pc(.75),p90:pc(.9),max:walls[walls.length-1],pct10:+(100*walls.filter(w=>w>=10).length/total).toFixed(1),pct20:+(100*alto/total).toFixed(1),pct30:+(100*walls.filter(w=>w>=30).length/total).toFixed(1),vertical20:+(100*vert/total).toFixed(1),porMilChunks:+(alto*st*st/256/((2*A)/16)**2*1000).toFixed(1)}));
