import { pathToFileURL } from 'url'; import fs from 'fs';
const R=process.argv[2], seed=+process.argv[3], RAD=+(process.argv[4]||1000);
const U=(p)=>import(pathToFileURL(R+'/src/'+p).href);
const {Generator}=await U('worldgen.js'); const {structuresNear}=await U('estructuras.js');
const tipos=JSON.parse(fs.readFileSync('tipos.json','utf8'));
const g=new Generator(seed,31,'tierra','normal'); const sp=g.findSpawn();
const out=[]; let acc=0;
for (const t of tipos){ const t0=performance.now(); const r=structuresNear(g,sp.x,sp.z,RAD,new Set([t.key])); const ms=performance.now()-t0; acc+=ms; out.push([t.key,Math.round(ms),r.length,Math.round(acc)]); }
console.log(JSON.stringify(out));
