import { pathToFileURL } from 'url';
const R=process.argv[2], seed=+process.argv[3], VER=+(process.argv[4]||23);
const U=(p)=>import(pathToFileURL(R+'/src/'+p).href);
const {Generator}=await U('worldgen.js'); const C=await U('carreteras.js'); const E=await U('estructuras.js'); const V=await U('pueblogen.js');
const SEA=62; const g=new Generator(seed,VER,'tierra','normal');
const S=2400;
const segs=C.roadsNear(g,0,0,S+400).filter(s=>Math.abs(s.xs[0])<S+400);
const out={seed,segs:segs.length,len:0,diqueRuns:0,diqueCols:0,puentes:0,puenteCols:0,saltos2:0,trinchera4:0,terraplen4:0,trincheraRuns:0,terraplenRuns:0,sobreEstr:0,sobreEstrTipos:{},kinds:{},muyEmpinado:0,lastreMaxStep:0,cruzaPueblo:0,pasoEnRioCols:0,pasoEnRioRuns:0,diqueMasAnchos:0};
const structs=E.structuresNear(g,0,0,S+400,null);
for(const s of segs){
  out.kinds[s.kind]=(out.kinds[s.kind]||0)+1; out.len+=s.n;
  const A=s.A,B=s.B;
  let runD=0,runT=0,runB=0,runBr=0,runR=0;
  const h=s.xs.map((x,i)=>g.column(x,s.zs[i]));
  for(let i=0;i<s.n;i++){
    const c=h[i]; const y=s.ys[i];
    if(s.water[i]){ out.puenteCols++; runBr++; } else { if(runBr>0) out.puentes++; runBr=0; }
    if(!s.water[i]&&c.h<SEA){ out.diqueCols++; runD++; } else { if(runD>0) out.diqueRuns++; runD=0; }
    if(!s.water[i]&&c.rio<0.045&&c.h<SEA+8){ out.pasoEnRioCols++; runR++; } else { if(runR>0) out.pasoEnRioRuns++; runR=0; }
    if(!s.water[i]&&y-c.h>=4){ out.terraplen4++; runT++; } else { if(runT>0) out.terraplenRuns++; runT=0; }
    if(!s.water[i]&&c.h-y>=4){ out.trinchera4++; runB++; } else { if(runB>0) out.trincheraRuns++; runB=0; }
    if(i>0&&Math.abs(s.ys[i]-s.ys[i-1])>=2) out.saltos2++;
  }
  // cruza otras estructuras (que no sean sus extremos)
  const hit=new Set();
  for(const P of structs){
    const r=E.structRadius(g,P.type);
    if(Math.hypot(P.x-A.x,P.z-A.z)<8||Math.hypot(P.x-B.x,P.z-B.z)<8) continue;
    for(let i=0;i<s.n;i+=3){ if(Math.abs(s.xs[i]-P.x)<r-2&&Math.abs(s.zs[i]-P.z)<r-2){ hit.add(P.type); break; } }
  }
  if(hit.size){ out.sobreEstr++; for(const t of hit) out.sobreEstrTipos[t]=(out.sobreEstrTipos[t]||0)+1; }
}
console.log(JSON.stringify(out));
