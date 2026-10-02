const fs=require('fs'),vm=require('vm');
const src=['data.js','engine.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
const E=vm.runInNewContext(src+'\n;({createState,nextQuestion,answer,gradeFR,applyFR,result,G,FR,FR2,toks})');
function run(name,choose,frText,seed){const st=E.createState(seed),log=[];let q;
 while(st.n<30&&(q=E.nextQuestion(st))){const i=choose(q);log.push(`${st.n+1}. [${q.id}/${q.tier}] ${q.t}\n   shown: ${q.opts.map(o=>o.text).join(" | ")}\n   chose: ${q.opts[i].text}`);E.answer(st,q,i)}
 let fr="";if(frText){const r=E.gradeFR(frText,0);E.applyFR(st,r);fr=`Free response: "${frText}"\n   fingerprint ${r.fp}, tokens kept ${r.n}`}
 return{name,st,res:E.result(st),log,fr}}
const t3="I figure out who is responsible for this and make them answer for it. It's only fair that the debt is repaid before we move on.";
const R1=run("Run 1: always the first option",q=>0,"Not sure. I would just sit here and think about it.",11);
let rs=7;const rnd=()=>{rs=(rs*1664525+1013904223)>>>0;return rs/4294967296};
const R2=run("Run 2: random answers",q=>Math.floor(rnd()*q.opts.length),"I guess I would walk around and see what happens, maybe ask someone nearby.",12);
const R3=run("Run 3: answering as Nemesis",q=>{let b=0,s=-1;q.opts.forEach((o,i)=>{if((o.w.nm||0)>s){s=o.w.nm||0;b=i}});return b},t3,13);
const top=(r,n)=>r.res.slice(0,n).map(x=>`${E.G[x[0]][0]} ${Math.round(x[1]*100)}%`).join(", ");
const rank3=R3.res.findIndex(x=>x[0]=="nm")+1;
const g1=new Set(R1.log.map(l=>l.split("]")[0])).size==R1.log.length&&R1.log.length==30?10:4;
const g2=R2.res[0][1]<0.25?10:R2.res[0][1]<0.4?8:5;
const g3=rank3==1?10:rank3<=3?8:rank3<=5?6:3;
// sweep: every god, MCQ-only, 3 seeds
let hit1=0,hit3=0,N=0;const miss=[];
for(const g in E.G)for(const seed of [21,22,23]){const r=run("s",q=>{let b=0,s=-1;q.opts.forEach((o,i)=>{if((o.w[g]||0)>s){s=o.w[g]||0;b=i}});return b},"",seed);const k=r.res.findIndex(x=>x[0]==g)+1;N++;if(k==1)hit1++;if(k<=3)hit3++;if(k>3)miss.push(g+":"+k)}
const out=[R1,R2,R3].map(r=>`## ${r.name}\n\n${r.log.join("\n")}\n\n${r.fr}\n\n**Result:** ${top(r,5)}\n`).join("\n");
const rep=`\n## Grades\n- Run 1 (always first option): ${g1}/10. Completed 30 distinct questions; result: ${top(R1,3)}.\n- Run 2 (random): ${g2}/10. Top god only ${Math.round(R2.res[0][1]*100)}% (a flat map is the right outcome for random input).\n- Run 3 (answering as Nemesis): ${g3}/10. Nemesis ranked #${rank3}.\n- Sweep, every god x 3 seeds, MCQ only: top-1 ${hit1}/${N} (${Math.round(hit1/N*100)}%), top-3 ${hit3}/${N} (${Math.round(hit3/N*100)}%). Misses outside top 3: ${miss.join(", ")||"none"}.\n`;
fs.writeFileSync("test-log.md","# Test log (3 runs)\n\n"+out+rep);console.log(rep);
// Noisy sweep: persona picks its god's best option only 60% of the time, otherwise random (more human-like)
{let h1=0,h3=0,n=0,rs2=99;const rr=()=>{rs2=(rs2*1664525+1013904223)>>>0;return rs2/4294967296};
for(const g in E.G)for(const seed of [31,32,33,34]){const r=run("n",q=>{if(rr()<0.4)return Math.floor(rr()*q.opts.length);let b=0,s=-1;q.opts.forEach((o,i)=>{if((o.w[g]||0)>s){s=o.w[g]||0;b=i}});return b},"",seed);const k=r.res.findIndex(x=>x[0]==g)+1;n++;if(k==1)h1++;if(k<=3)h3++}
const line=`- Noisy sweep (60% on-persona answers, 40% random; 20 gods x 4 seeds): top-1 ${h1}/${n} (${Math.round(h1/n*100)}%), top-3 ${h3}/${n} (${Math.round(h3/n*100)}%).\n`;
fs.appendFileSync("test-log.md",line);console.log(line)}

// FR robustness: each reference with every 4th word dropped, then reordered clauses, graded on its own prompt
{let ok=0,n=0,ok2=0;for(const [tbl,nm] of [[E.FR,"FR"],[E.FR2,"FR2"]])for(const g in tbl)for(const ref of [].concat(tbl[g])){const w=ref.split(" ").filter((x,i)=>i%4!=3).join(" ");const s=E.gradeFR(w,tbl).sim;const k=Object.keys(s).sort((a,b)=>s[b]-s[a]).indexOf(g)+1;n++;if(k==1)ok++;if(k<=3)ok2++}
const line=`- FR self-check (references with every 4th word dropped, both prompts; 40 cases): top-1 ${ok}/${n}, top-3 ${ok2}/${n}. Circular by construction; real text needed.\n`;fs.appendFileSync("test-log.md",line);console.log(line)}
