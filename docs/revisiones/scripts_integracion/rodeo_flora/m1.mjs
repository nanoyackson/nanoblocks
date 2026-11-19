const R=process.argv[2], ver=+process.argv[3], seed=+process.argv[4];
const {pathToFileURL}=await import('url');
const U=(p)=>import(pathToFileURL(R+'/src/'+p).href);
const {Generator}=await U('worldgen.js'); const {roadsNear}=await U('carreteras.js');
const g=new Generator(seed,ver,'tierra','normal'); const t00=performance.now(); const sp=g.findSpawn(); const tsp=performance.now()-t00;
const t=[]; for(let d=0;d<=3000;d+=16){const t0=performance.now(); roadsNear(g,sp.x+d,sp.z,12); t.push([performance.now()-t0,d]);}
const tot=t.reduce((s,v)=>s+v[0],0); const pe=[...t].sort((a,b)=>b[0]-a[0]).slice(0,4);
console.log(JSON.stringify({ver,seed,findSpawn:+tsp.toFixed(0),total:+tot.toFixed(0),peores:pe.map(([ms,d])=>[+ms.toFixed(0),d]),primera:+t[0][0].toFixed(0)}));
