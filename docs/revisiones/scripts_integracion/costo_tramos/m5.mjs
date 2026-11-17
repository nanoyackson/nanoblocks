const {pathToFileURL}=await import('url'); const R='head2';
const U=(p)=>import(pathToFileURL(process.cwd()+'/'+R+'/src/'+p).href);
const {Generator}=await U('worldgen.js'); const C=await U('carreteras.js');
const seed=+process.argv[2]; const g=new Generator(seed,30,'tierra','normal'); const sp=g.findSpawn();
const t0=performance.now(); C.roadsNear(g,sp.x,sp.z,12); const dt=performance.now()-t0;
const T=globalThis.__t.sort((a,b)=>b[0]-a[0]); const tot=T.reduce((s,v)=>s+v[0],0);
console.log(JSON.stringify({seed,ms:+dt.toFixed(0),celdasTope:T.length,sumaTope:+tot.toFixed(0),mediana:+T[T.length>>1][0].toFixed(2),p99:+T[Math.floor(T.length*0.01)][0].toFixed(1),max5:T.slice(0,5).map(v=>[+v[0].toFixed(0),v[1]])}));
