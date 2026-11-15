import { pathToFileURL } from 'url';
const R=process.argv[2], seed=+process.argv[3], VER=+(process.argv[4]||25);
const U=(p)=>import(pathToFileURL(R+'/src/'+p).href);
const {Generator}=await U('worldgen.js');
const g=new Generator(seed,VER,'tierra','normal'); const sp=g.findSpawn();
const ST=8, N=300; // 2400 x 2400
const X0=Math.round(sp.x)-N*ST/2, Z0=Math.round(sp.z)-N*ST/2;
const grid=new Array(N*N), hh=new Float32Array(N*N);
for(let j=0;j<N;j++)for(let i=0;i<N;i++){const c=g.column(X0+i*ST,Z0+j*ST); grid[j*N+i]=c.biome; hh[j*N+i]=c.h;}
const cnt={}; for(const b of grid)cnt[b]=(cnt[b]||0)+1;
// manchas (4-vecinos)
const seen=new Uint8Array(N*N), patches={};
for(let s=0;s<N*N;s++){ if(seen[s])continue; const b=grid[s]; const st=[s]; seen[s]=1; let a=0;
  while(st.length){const k=st.pop(); a++; const x=k%N,y=(k/N)|0; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy; if(nx<0||ny<0||nx>=N||ny>=N)continue; const q=ny*N+nx; if(!seen[q]&&grid[q]===b){seen[q]=1;st.push(q);}}}
  (patches[b]=patches[b]||[]).push(a*ST*ST/256); } // area en trozos
const ag={}; for(const b in patches){const t=patches[b].reduce((a,c)=>a+c,0); const gr=patches[b].filter(v=>v>=40).reduce((a,c)=>a+c,0); ag[b]=+(100*gr/t).toFixed(0);} console.log("AG",seed,JSON.stringify(ag)); const pm={}; for(const b in patches){const a=patches[b].sort((x,y)=>x-y); const big=a.filter(v=>v>=40); pm[b]={n:a.length,mediana:+a[a.length>>1].toFixed(0),max:Math.round(a[a.length-1]),grandes40:big.length};}
// transiciones
const tr={}; for(let j=0;j<N;j++)for(let i=0;i<N-1;i++){const a=grid[j*N+i],b=grid[j*N+i+1]; if(a!==b){const k=[a,b].sort().join('|'); tr[k]=(tr[k]||0)+1;} }
for(let j=0;j<N-1;j++)for(let i=0;i<N;i++){const a=grid[j*N+i],b=grid[(j+1)*N+i]; if(a!==b){const k=[a,b].sort().join('|'); tr[k]=(tr[k]||0)+1;} }
// distancia al spawn del primer bioma de cada tipo (en bloques)
const dmin={}; for(let j=0;j<N;j++)for(let i=0;i<N;i++){const b=grid[j*N+i]; const d=Math.hypot(X0+i*ST-sp.x,Z0+j*ST-sp.z); if(dmin[b]===undefined||d<dmin[b])dmin[b]=Math.round(d);}
// salto de altura entre vecinos > 6 (en 8 bloques) = borde brusco
let br=0,tt=0; for(let j=0;j<N;j++)for(let i=0;i<N-1;i++){const a=grid[j*N+i],b=grid[j*N+i+1]; if(a!==b){tt++; if(Math.abs(hh[j*N+i]-hh[j*N+i+1])>8)br++;}}
const tot=N*N; const pct={}; for(const b in cnt)pct[b]=+(100*cnt[b]/tot).toFixed(1);
console.log(JSON.stringify({seed,VER,pct,patches:pm,dmin,transTop:Object.entries(tr).sort((a,b)=>b[1]-a[1]).slice(0,40),bordeAltoBrusco:+(br/tt).toFixed(3)}));
