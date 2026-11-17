const R=process.argv[2], ver=+process.argv[3], seed=+process.argv[4];
const {pathToFileURL}=await import('url');
const U=(p)=>import(pathToFileURL(R+'/src/'+p).href);
const {Generator}=await U('worldgen.js'); const C=await U('carreteras.js');
const g=new Generator(seed,ver,'tierra','normal'); const sp=g.findSpawn();
const seen=new Map(); let n=0; const oc=g.column.bind(g); g.column=(x,z)=>{n++; const k=x*65537+z; seen.set(k,(seen.get(k)||0)+1); return oc(x,z);};
const t0=performance.now(); C.roadsNear(g,sp.x,sp.z,12); const dt=performance.now()-t0;
let rep=0; for(const v of seen.values()) if(v>1) rep+=v-1;
const keysSt=g.structCache?g.structCache.size:0; let ncell=0,nplace=0; if(g.structCache){for(const v of g.structCache.values()){ncell++; if(v)nplace++;}}
console.log(JSON.stringify({ver,seed,ms:+dt.toFixed(0),llamadasColumn:n,unicas:seen.size,repetidas:rep,pctRepetidas:+(100*rep/n).toFixed(0),celdasEstructura:ncell,conEstructura:nplace}));
