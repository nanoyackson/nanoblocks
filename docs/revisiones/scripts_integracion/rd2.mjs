import { pathToFileURL } from 'url';
const R=process.argv[2], seed=+process.argv[3];
const U=(p)=>import(pathToFileURL(R+'/src/'+p).href);
const {Generator}=await U('worldgen.js'); const C=await U('carreteras.js'); const SEA=62;
const g=new Generator(seed,23,'tierra','normal'); const S=2400;
const segs=C.roadsNear(g,0,0,S+400);
const o={seed,segs:segs.length,len:0,alto:0,trin8:0,trin12:0,trin20:0,ter8:0,ter12:0,maxTrin:0,sobre30:0,saltos:0,dique:0};
for(const s of segs){ o.len+=s.n; let rt=0,rf=0;
 for(let i=0;i<s.n;i++){ const c=g.column(s.xs[i],s.zs[i]); const y=s.ys[i];
  if(c.h>SEA+30) o.alto++; if(s.water[i]) {continue;} if(c.h<SEA&&!s.water[i]) o.dique++;
  const cut=c.h-y, fill=y-c.h; if(cut>rt) rt=cut; if(fill>rf) rf=fill;
  if(i>0&&Math.abs(s.ys[i]-s.ys[i-1])>=2) o.saltos++;
  const last=i===s.n-1||(cut<4&&fill<4);
  if(cut<4&&rt>=4||i===s.n-1&&rt>=4){ if(rt>=8)o.trin8++; if(rt>=12)o.trin12++; if(rt>=20)o.trin20++; if(rt>o.maxTrin)o.maxTrin=rt; rt=0; }
  if(fill<4&&rf>=4||i===s.n-1&&rf>=4){ if(rf>=8)o.ter8++; if(rf>=12)o.ter12++; rf=0; } } }
console.log(JSON.stringify(o));
