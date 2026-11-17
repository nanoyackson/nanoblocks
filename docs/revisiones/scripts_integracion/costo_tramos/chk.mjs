const {pathToFileURL}=await import('url'); const base=process.cwd();
const U=(d,p)=>import(pathToFileURL(base+'/'+d+'/src/'+p).href);
const [A,B,ver,seed]=[process.argv[2],process.argv[3],+process.argv[4],+process.argv[5]];
const GA=(await U(A,'worldgen.js')), GB=(await U(B,'worldgen.js'));
const a=new GA.Generator(seed,ver,'tierra','normal'), b=new GB.Generator(seed,ver,'tierra','normal'); const sp=a.findSpawn();
const f=(G,g,cx,cz)=>{const buf=new GA.Generator?new Uint16Array(32768):null; const t=new Float32Array(768); const st=g.generate(cx,cz,buf,t); let h=0; for(let i=0;i<buf.length;i++)h=(h*31+buf[i])|0; return h+':'+JSON.stringify(st||[]).length;};
let d=0,n=0; for(const [dx,dz] of [[0,0],[5,5],[-9,3],[30,-30],[70,12],[-120,-60]]){const cx=Math.floor(sp.x/16)+dx,cz=Math.floor(sp.z/16)+dz;n++; if(f(GA,a,cx,cz)!==f(GB,b,cx,cz))d++;}
console.log(JSON.stringify({A,B,ver,seed,trozos:n,distintos:d}));
