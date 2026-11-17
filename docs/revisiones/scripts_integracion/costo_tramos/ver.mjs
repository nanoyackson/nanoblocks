const {pathToFileURL}=await import('url'); const base=process.cwd();
const U=(d,p)=>import(pathToFileURL(base+'/'+d+'/src/'+p).href);
const A=process.argv[2], B=process.argv[3], ver=+process.argv[4], seed=+process.argv[5];
const [GA,CA]=[(await U(A,'worldgen.js')).Generator,await U(A,'carreteras.js')]; const [GB,CB]=[(await U(B,'worldgen.js')).Generator,await U(B,'carreteras.js')];
const a=new GA(seed,ver,'tierra','normal'), b=new GB(seed,ver,'tierra','normal'); const sp=a.findSpawn();
let colDif=0,colN=0; for(let x=-1500;x<=1500;x+=37)for(let z=-1500;z<=1500;z+=41){const p=a.column(sp.x+x,sp.z+z),q=b.column(sp.x+x,sp.z+z);colN++; if(JSON.stringify(p)!==JSON.stringify(q))colDif++;}
const sig=(s)=>s.id+'|'+s.n+'|'+s.xs[0]+','+s.zs[0]+','+s.ys[0]+'|'+s.xs[s.n-1]+','+s.zs[s.n-1]+'|'+s.xs.reduce((u,v,i)=>(u*31+v+s.zs[i]*7+s.ys[i])|0,0);
let qn=0,qdif=0,segs=0; for(let x=-2400;x<=2400;x+=48)for(let z=-2400;z<=2400;z+=48){qn++; const p=CA.roadsNear(a,sp.x+x,sp.z+z,12).map(sig), q=CB.roadsNear(b,sp.x+x,sp.z+z,12).map(sig); segs+=p.length; if(p.join(';')!==q.join(';'))qdif++;}
console.log(JSON.stringify({A,B,ver,seed,columnas:colN,columnasDistintas:colDif,consultas:qn,consultasDistintas:qdif,tramosVistos:segs}));
