import fs from 'fs';
const tipos=Object.fromEntries(JSON.parse(fs.readFileSync('tipos.json','utf8')).map(t=>[t.key,t]));
const RT=new Set(['capital','basilica','ruinas','fortin','estadio_nacional','estadio_obra','estacion','refineria','playa_lujo','sanatorio','hacienda','beneficio','muelle_limon','marino_ballena','monteverde','grecia','zapote','aeropuerto']);
const PROP=new Set(['feria_pueblo','cementerio_pueblo','casita_bahareque']);
const CUEVA=new Set(['cueva_venado','cueva_barra_honda','geoda_mayor','caverna_rey','catarata_escondida','templo_hundido']);
const cls=(k)=>PROP.has(k)?'propio-pueblo':RT.has(k)?'ROAD_TO':CUEVA.has(k)?'cueva':(tipos[k]&&tipos[k].npc)?'gente':'sin-gente';
const PRE=process.argv[2]; const S=process.argv.slice(3).map(Number); const res={}; const tot={tr:0}; const out=[]; const det=new Map(); const afect=new Set(); const aj={};
for (const s of S){ const d=JSON.parse(fs.readFileSync(`${PRE}_${s}.json`,'utf8')); tot.tr+=d.tramos;
 for (const c of d.cruces){ const e=d.segEnds[c.tramo]; const nearEnd=(vx,vz,L)=>Math.hypot(c.x-vx,c.z-vz)<(L||46)+c.R+30;
   const prop = nearEnd(e[0],e[1],e[2]) || nearEnd(e[3],e[4],e[5]);
   const enAldea = d.vil.some(([x,z,L])=>Math.hypot(c.x-x,c.z-z)<L+4+c.R*0.5); // dentro del radio de rodeo de un pueblo
   const k=cls(c.tipo); const key=s+':'+c.tramo; const k2=(prop?'delExtremo/':enAldea?'enPueblo/':'')+k; res[k2]=res[k2]||{n:0,tr:new Set()}; res[k2].n++; res[k2].tr.add(key);
   if(!prop&&!enAldea&&(k==='gente'||k==='ROAD_TO')){ afect.add(key); const t=det.get(c.tipo)||{n:0,centro:0,R:c.R,k,s:{},kinds:{}}; t.n++; if(c.centro)t.centro++; t.s[s]=(t.s[s]||0)+1; t.kinds[c.kind]=(t.kinds[c.kind]||0)+1; det.set(c.tipo,t); aj[s]=(aj[s]||0)+1; } } }
console.log('tramos',tot.tr); for(const [k,v] of Object.entries(res).sort()) console.log(k.padEnd(28),v.n,'cruces',v.tr.size,'tramos');
console.log('AJENOS reales (gente+ROAD_TO): tramos',afect.size,(100*afect.size/tot.tr).toFixed(1)+'%','cruces',[...det.values()].reduce((a,t)=>a+t.n,0),JSON.stringify(aj));
