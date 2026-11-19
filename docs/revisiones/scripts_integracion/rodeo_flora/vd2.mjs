import fs from 'fs';
const tipos=Object.fromEntries(JSON.parse(fs.readFileSync('tipos.json','utf8')).map(t=>[t.key,t]));
const flo=Object.fromEntries(JSON.parse(fs.readFileSync('flora.json','utf8')).map(t=>[t.k,t]));
const A={};
for (const s of [101,202,303,404]) { const d=JSON.parse(fs.readFileSync(`vd_${s}.json`,'utf8')).res; for (const [k,q] of Object.entries(d)) { const a=A[k]||(A[k]={n:0,nIn:0,pIn:0,hIn:0,nOut:0,pOut:0,hOut:0,r:q.r}); for (const f of ['n','nIn','pIn','hIn','nOut','pOut','hOut']) a[f]+=q[f]; } }
const rows=Object.entries(A).map(([k,a])=>({k,n:a.n,r:a.r,pIn:100*a.pIn/Math.max(1,a.nIn),hIn:100*a.hIn/Math.max(1,a.nIn),pOut:100*a.pOut/Math.max(1,a.nOut),hOut:100*a.hOut/Math.max(1,a.nOut)}));
rows.sort((x,y)=>(x.pIn+x.hIn)-(y.pIn+y.hIn));
for (const r of rows) console.log(r.k.padEnd(20),'n'+r.n,'R'+String(r.r).padStart(2),'dentro plantas',r.pIn.toFixed(1).padStart(5)+'% hojas',r.hIn.toFixed(1).padStart(5)+'%','| anillo plantas',r.pOut.toFixed(1).padStart(5)+'% hojas',r.hOut.toFixed(1).padStart(5)+'%','|',tipos[r.k]?.npc?'npc':'   ','flora()='+(flo[r.k]?.flora??'?'),'rel',(r.pOut>0?(r.pIn/r.pOut).toFixed(2):'-'));
fs.writeFileSync('vd_agg.json',JSON.stringify(rows));
