const fs=require('fs'),vm=require('vm');
const E=vm.runInNewContext(['data.js','engine.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n')+';({createState,nextQuestion,answer,result,G,POOL})');
let top=0,cnt={},N=300,rs=5;const rnd=()=>{rs=(rs*1664525+1013904223)>>>0;return rs/4294967296};
for(let s=1;s<=N;s++){const st=E.createState(s);let q;while(st.n<30&&(q=E.nextQuestion(st)))E.answer(st,q,Math.floor(rnd()*q.opts.length));const r=E.result(st);top+=r[0][1];cnt[r[0][0]]=(cnt[r[0][0]]||0)+1}
console.log("avg top%",(top/N*100).toFixed(1),JSON.stringify(Object.entries(cnt).sort((a,b)=>b[1]-a[1])));
// total weight mass per god across handwritten pool
const m={};E.POOL.forEach(q=>q.o.forEach(o=>{for(const g in o.w)m[g]=(m[g]||0)+o.w[g]}));
console.log(JSON.stringify(Object.entries(m).sort((a,b)=>b[1]-a[1])));
