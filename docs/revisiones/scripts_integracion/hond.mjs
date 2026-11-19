import { pathToFileURL } from 'url';
const R=process.argv[2], seed=+process.argv[3];
const U=(p)=>import(pathToFileURL(R+'/src/'+p).href);
const {Generator}=await U('worldgen.js'); const {BLOCK_BY_KEY:K}=await U('blocks.js');
const g=new Generator(seed,31,'tierra','normal'); const sp=g.findSpawn(); const cx0=Math.floor(sp.x/16)-8, cz0=Math.floor(sp.z/16)-8;
const bands=[[1,10],[11,15],[16,20],[21,25],[26,30],[31,40],[41,50]];
const A=bands.map(()=>({air:0,lava:0,water:0,tot:0,dia:0,jade:0,gold:0,cris:0,iron:0}));
const bandOf=(y)=>bands.findIndex(([a,b])=>y>=a&&y<=b);
const ids={dia:[K.diamond_ore,K.deep_diamond_ore],jade:[K.jade_ore],gold:[K.gold_ore,K.deep_gold_ore],cris:[K.cristal,K.cristal_bloque],iron:[K.iron_ore,K.deep_iron_ore]};
let n=0,t=0;
for(let cz=0;cz<16;cz++)for(let cx=0;cx<16;cx++){const b=new Uint16Array(32768);const t0=performance.now();g.generate(cx0+cx,cz0+cz,b,new Float32Array(768));t+=performance.now()-t0;n++;
 for(let i=0;i<32768;i++){const y=i>>8;const k=bandOf(y);if(k<0)continue;const id=b[i];const a=A[k];a.tot++;if(id===0)a.air++;else if(id===K.lava)a.lava++;else if(id===K.water)a.water++;else for(const key in ids)if(ids[key].includes(id))a[key]++;}}
const out={seed,ms:+(t/n).toFixed(1),bands:{}};bands.forEach(([a,b],i)=>{const x=A[i];out.bands[a+'-'+b]={aire:+(100*x.air/x.tot).toFixed(1),lava:+(100*x.lava/x.tot).toFixed(1),agua:+(100*x.water/x.tot).toFixed(1),diaPorTrozo:+(x.dia/n).toFixed(2),jadePorTrozo:+(x.jade/n).toFixed(2),oroPorTrozo:+(x.gold/n).toFixed(2),cristalPorTrozo:+(x.cris/n).toFixed(2)}});
console.log(JSON.stringify(out));
