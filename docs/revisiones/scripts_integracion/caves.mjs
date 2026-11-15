// flood fill del aire subterráneo. node caves.mjs <raiz> <semilla> <ver> <N trozos de lado>
import { pathToFileURL } from 'url';
const R=process.argv[2], seed=+process.argv[3], VER=+(process.argv[4]||23), N=+(process.argv[5]||32);
const U=(p)=>import(pathToFileURL(R+'/src/'+p).href);
const {Generator}=await U('worldgen.js'); const {BLOCK_BY_KEY:K}=await U('blocks.js');
const g=new Generator(seed,VER,'tierra','normal'); const sp=g.findSpawn();
const ccx=Math.floor(sp.x/16)-N/2, ccz=Math.floor(sp.z/16)-N/2, W=N*16, H=100;
const A=new Uint8Array(W*W*H); // 1 = aire subterraneo
const hmap=new Int16Array(W*W);
let t0=Date.now(), air=0, cols=0; const band=[[1,10],[11,20],[21,30],[31,40],[41,50],[51,60],[61,80]], bt=band.map(()=>[0,0]);
for(let cz=0;cz<N;cz++)for(let cx=0;cx<N;cx++){ const b=new Uint16Array(32768); g.generate(ccx+cx,ccz+cz,b,new Float32Array(768));
 for(let lz=0;lz<16;lz++)for(let lx=0;lx<16;lx++){ const x=cx*16+lx,z=cz*16+lz; const h=g.column((ccx+cx)*16+lx,(ccz+cz)*16+lz).h; hmap[x+z*W]=h;
  for(let y=1;y<Math.min(H,h-3);y++){ const id=b[lx+lz*16+y*256]; band.forEach((bd,i)=>{ if(y>=bd[0]&&y<=bd[1]){bt[i][1]++; if(id===0)bt[i][0]++;} }); if(id===0){ A[x+z*W+y*W*W]=1; air++; } } } }
const msGen=(Date.now()-t0)/(N*N);
const idx=(x,y,z)=>x+z*W+y*W*W;
const seen=new Uint8Array(W*W*H); const comps=[]; const q=new Int32Array(4000000);
const D=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
for(let i=0;i<A.length;i++){ if(!A[i]||seen[i]) continue; let qh=0,qt=0; q[qt++]=i; seen[i]=1; let n=0,x0=1e9,x1=-1,z0=1e9,z1=-1,y0=1e9,y1=-1;
  while(qh<qt){ const c=q[qh++]; n++; const x=c%W, z=Math.floor(c/W)%W, y=Math.floor(c/(W*W)); if(x<x0)x0=x;if(x>x1)x1=x;if(z<z0)z0=z;if(z>z1)z1=z;if(y<y0)y0=y;if(y>y1)y1=y;
   for(const [dx,dy,dz] of D){ const nx=x+dx,ny=y+dy,nz=z+dz; if(nx<0||nx>=W||nz<0||nz>=W||ny<1||ny>=H) continue; const j=idx(nx,ny,nz); if(A[j]&&!seen[j]){ seen[j]=1; if(qt<q.length) q[qt++]=j; } } }
  comps.push({i,n,dx:x1-x0+1,dz:z1-z0+1,dy:y1-y0+1}); }
comps.sort((a,b)=>b.n-a.n);
// distancia a pie dentro del mayor
let maxd=0, far=0; if(comps[0]){ const dist=new Int32Array(W*W*H).fill(-1); let qh=0,qt=0; q[qt++]=comps[0].i; dist[comps[0].i]=0; let farc=comps[0].i;
  const bfs=(start)=>{ dist.fill(-1); qh=0;qt=0;q[qt++]=start;dist[start]=0; let last=start; while(qh<qt){ const c=q[qh++]; last=c; const x=c%W,z=Math.floor(c/W)%W,y=Math.floor(c/(W*W)); for(const [dx,dy,dz] of D){ const nx=x+dx,ny=y+dy,nz=z+dz; if(nx<0||nx>=W||nz<0||nz>=W||ny<1||ny>=H) continue; const j=idx(nx,ny,nz); if(A[j]&&dist[j]<0){ dist[j]=dist[c]+1; q[qt++]=j; } } } return last; };
  const a=bfs(comps[0].i); const b=bfs(a); maxd=dist[b]; }
// salas: erosion 5x5x5
const E=new Uint8Array(W*W*H); const r=2;
for(let y=1+r;y<H-r;y++)for(let z=r;z<W-r;z++)for(let x=r;x<W-r;x++){ if(!A[idx(x,y,z)]) continue; let ok=true; for(let dy=-r;dy<=r&&ok;dy++)for(let dz=-r;dz<=r&&ok;dz++)for(let dx=-r;dx<=r;dx++) if(!A[idx(x+dx,y+dy,z+dz)]){ok=false;break;} if(ok)E[idx(x,y,z)]=1; }
const es=new Uint8Array(W*W*H); const rooms=[];
for(let i=0;i<E.length;i++){ if(!E[i]||es[i]) continue; let qh=0,qt=0;q[qt++]=i;es[i]=1;let n=0,x0=1e9,x1=-1,z0=1e9,z1=-1,y0=1e9,y1=-1;
 while(qh<qt){ const c=q[qh++];n++; const x=c%W,z=Math.floor(c/W)%W,y=Math.floor(c/(W*W)); if(x<x0)x0=x;if(x>x1)x1=x;if(z<z0)z0=z;if(z>z1)z1=z;if(y<y0)y0=y;if(y>y1)y1=y; for(const [dx,dy,dz] of D){ const nx=x+dx,ny=y+dy,nz=z+dz; if(nx<0||nx>=W||nz<0||nz>=W||ny<1||ny>=H) continue; const j=idx(nx,ny,nz); if(E[j]&&!es[j]){es[j]=1;q[qt++]=j;} } }
 rooms.push({n,w:Math.max(x1-x0,z1-z0)+5,h:y1-y0+5}); }
const big=rooms.filter(r=>r.n>=150);
const out={seed,ver:VER,N,chunks:N*N,msGen:+msGen.toFixed(1),airPct:+(100*air/(W*W*(H-1))).toFixed(1),bandas:bt.map((b,i)=>band[i].join('-')+':'+(100*b[0]/Math.max(1,b[1])).toFixed(1)),
 sistemas:comps.length,mayor:comps[0]&&comps[0].n,top5:comps.slice(0,5).map(c=>c.n),mayorBox:comps[0]&&[comps[0].dx,comps[0].dz,comps[0].dy],mayorPctDelAire:+(100*(comps[0]?comps[0].n:0)/air).toFixed(1),
 sistemasMas2000:comps.filter(c=>c.n>2000).length,sistemasMas20000:comps.filter(c=>c.n>20000).length,aPie:maxd,
 salasNucleo:big.length,salasAnchoMax:big.reduce((m,r)=>Math.max(m,r.w),0),salasAltoMax:big.reduce((m,r)=>Math.max(m,r.h),0),salas20:big.filter(r=>r.w>=20).length,salas40:big.filter(r=>r.w>=40).length};
console.log(JSON.stringify(out));
