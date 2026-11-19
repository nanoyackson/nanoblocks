import fs from 'fs';
const ui=fs.readFileSync('src/ui.js','utf8');
const blk=ui.slice(ui.indexOf('const CAPTIONS = {'),ui.indexOf('const captionText'));
const caps=new Set([...blk.matchAll(/(?:^|[ ,{])'?([A-Za-z_.ñ0-9]+)'?:\s*'/gm)].map(m=>m[1]));
const files=fs.readdirSync('src').filter(f=>f.endsWith('.js'));
const uses={}; // name -> {pos:n,sinpos:n,ui:n, files:Set}
for(const f of files){const s=fs.readFileSync('src/'+f,'utf8');
  for(const m of s.matchAll(/\.play\(\s*['"`]([A-Za-z_.ñ0-9]+)['"`]\s*(?:,\s*(\{[^;\n]*?\}))?\s*\)/g)){
    const n=m[1],o=m[2]||'';const u=uses[n]=uses[n]||{pos:0,sinpos:0,ui:0,f:new Set()};
    if(/\bui:\s*true/.test(o))u.ui++;else if(/\bpos\b/.test(o))u.pos++;else u.sinpos++;u.f.add(f);}
}
const sin=[],sinpos=[];
for(const [n,u] of Object.entries(uses)){ if(u.pos&&!caps.has(n))sin.push(n+'('+u.pos+')'); if(u.sinpos&&!caps.has(n)&&!u.pos)sinpos.push(n+'('+u.sinpos+')'); }
console.log('captions',caps.size,'sonidos usados',Object.keys(uses).length);
console.log('CON pos y SIN subtitulo:',sin.sort().join(' '));
console.log('SIN pos (no hay subtitulo aunque se oiga; excluye ui):',sinpos.sort().join(' '));
