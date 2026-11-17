import fs from 'fs';
const f=fs.readdirSync('prof').filter(x=>x.endsWith('.cpuprofile')).map(x=>'prof/'+x).sort((a,b)=>fs.statSync(b).mtimeMs-fs.statSync(a).mtimeMs)[0];
const p=JSON.parse(fs.readFileSync(f,'utf8')); const nodes=new Map(p.nodes.map(n=>[n.id,n])); const parent=new Map();
for(const n of p.nodes)for(const c of n.children||[])parent.set(c,n.id);
const self=new Map(); for(let i=0;i<p.samples.length;i++){self.set(p.samples[i],(self.get(p.samples[i])||0)+(p.timeDeltas[i]||0));}
const incl={}; const selfBy={};
for(const [id,t] of self){ const n=nodes.get(id); const key=n.callFrame.functionName||'(anon)'; selfBy[key]=(selfBy[key]||0)+t;
  const seen=new Set(); let cur=id; while(cur!==undefined){const nn=nodes.get(cur); const k=(nn.callFrame.functionName||'(anon)')+' '+nn.callFrame.url.split('/').pop()+':'+nn.callFrame.lineNumber; if(!seen.has(k)){seen.add(k); incl[k]=(incl[k]||0)+t;} cur=parent.get(cur);} }
const top=(o,n)=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k,v])=>(v/1000).toFixed(0).padStart(6)+' ms  '+k);
console.log('INCLUSIVO'); console.log(top(incl,28).join('\n')); console.log('PROPIO'); console.log(top(selfBy,10).join('\n'));
