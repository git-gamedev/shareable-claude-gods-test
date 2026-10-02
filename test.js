const fs=require('fs'),vm=require('vm');
const E=vm.runInNewContext(['data.js','engine.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n')+';({TR,PM,GP,G,DATA,createState,nextQuestion,answer,gradeFR,applyFR,result,behaviorSummary,FRALL,PATHS,validateData})');
const T=E.DATA.config.telemetry;let rs=7;const rnd=()=>{rs=(rs*1664525+1013904223)>>>0;return rs/4294967296};const gauss=()=>Math.sqrt(-2*Math.log(rnd()+1e-9))*Math.cos(6.283*rnd());
const pick=(q,g)=>{if(q.duel){let bi=0,bs=-1e9;q.opts.forEach((o,i)=>{const s=o.g==g?1e9:E.TR.reduce((x,k)=>x+(E.GP[o.g][k]-E.PM[k])*(E.GP[g][k]-E.PM[k]),0);if(s>bs){bs=s;bi=i}});return bi}
if(q.sl){const[,,a,b]=q.sl;return E.GP[g][b]/(E.GP[g][a]+E.GP[g][b])}let bi=0,bs=-9;q.opts.forEach((o,i)=>{const s=Object.keys(o.w).reduce((x,t)=>x+o.w[t]*(E.GP[g][t]-E.PM[t]),0);if(s>bs){bs=s;bi=i}});return bi};
// Synthetic telemetry. calm: decisive, hover on the chosen option. torn: spread hover, changes. afk: calm, but some answers have huge idle time.
let lastNoise=false;function tele(q,i,mode){if(mode=="none")return null;if(mode=="mixed")mode=lastNoise?"torn":"calm";const exp=T.baseMs+T.msPerChar*(q.chars||0),n=q.opts?q.opts.length:0;
const torn=mode=="torn",ms=Math.max(400,exp*Math.exp(gauss()*.3+(torn?.6:0))),h=new Array(n).fill(0);
if(n){const tot=ms*.6;if(torn)for(let j=0;j<n;j++)h[j]=tot*(.5+rnd())/n/1.5;else{for(let j=0;j<n;j++)h[j]=tot*.05*rnd();h[i]+=tot*.5}}
let t={ms,rawMs:ms*1.2,afk:false,hover:h,changes:torn?Math.floor(rnd()*3):0,prev:[],modality:"mouse",confirmMs:ms*.15*(torn?2:1)};
if(torn&&n){t.prev=[(i+1)%n]}
if(mode=="afk"&&rnd()<.15)t={...t,ms:T.idleCapMs*3,rawMs:900000,afk:true};return t}
function run(name,choose,frText,seed,mode){const st=E.createState(seed),log=[];let q;
 while(st.n<30&&(q=E.nextQuestion(st))){const i=choose(q),t=tele(q,q.sl?0:i,mode);log.push(`${st.n+1}. [${q.stage}] ${q.t}\n   ${q.duel?`duel, chose: ${q.opts[i].text}`:q.sl?`slider ${q.sl[0]} <-> ${q.sl[1]}, set to ${(+i).toFixed(2)}`:`shown: ${q.opts.map(o=>o.text).join(" | ")}\n   chose: ${q.opts[i].text}`}${t?`\n   telemetry: ${Math.round(t.ms)}ms active, changes ${t.changes}, certainty ${(E.answer.length,"")}`:""}`.replace(/, certainty $/,""));E.answer(st,q,i,t)}
 let fr="";if(frText){const r=E.gradeFR(frText,E.FRALL);E.applyFR(st,r);fr=`Free response (${E.PATHS[st.path].name}): "${frText}"`}
 return{name,st,res:E.result(st),log,fr}}
const top=(r,n)=>r.res.slice(0,n).map(x=>`${E.G[x[0]].name} ${Math.round(x[1]*100)}%`).join(", ");
const R1=run("Run 1: always the first option (calm behavior)",q=>q.sl?.5:0,"Not sure. I would just sit here and think about it.",11,"calm");
const R2=run("Run 2: random answers (torn behavior)",q=>q.sl?rnd():Math.floor(rnd()*q.opts.length),"I guess I would walk around and see what happens, maybe ask someone nearby.",12,"torn");
const R3=run("Run 3: answering as Nemesis (calm behavior)",q=>pick(q,"nm"),"I figure out who is responsible for this and make them answer for it. It's only fair that the debt is repaid.",13,"calm");
const rank3=R3.res.findIndex(x=>x[0]=="nm")+1,ids=new Set(R1.st.log.map(l=>l.id)).size;
const g1=R1.log.length==30&&ids==30?10:4,g2=R2.res[0][1]<.25?10:R2.res[0][1]<.4?8:5,g3=rank3==1?10:rank3<=3?8:rank3<=5?6:3;
function sweep(mode,noise,seeds){let h1=0,h3=0,n=0;for(const g in E.G)for(const seed of seeds){const r=run("s",q=>(lastNoise=!!(noise&&rnd()<noise))?(q.sl?rnd():Math.floor(rnd()*q.opts.length)):pick(q,g),"",seed,mode),k=r.res.findIndex(x=>x[0]==g)+1;n++;if(k==1)h1++;if(k<=3)h3++}return`top-1 ${h1}/${n} (${Math.round(h1/n*100)}%), top-3 ${h3}/${n} (${Math.round(h3/n*100)}%)`}
const S=[["no telemetry",sweep("none",0,[21,22,23])],["calm telemetry",sweep("calm",0,[21,22,23])],["AFK outliers (15% of answers idle 15 min)",sweep("afk",0,[21,22,23])],["40% random answers, none",sweep("none",.4,[31,32,33,34])],["40% random answers, calm behavior on all (adversarial: confident noise)",sweep("calm",.4,[31,32,33,34])],["40% random answers, torn behavior on the random ones (realistic)",sweep("mixed",.4,[31,32,33,34])]];
// certainty sanity: chosen option must always have the highest probability; AFK must give neutral certainty
let viol=0,cs=0,cn=0;{const st=E.createState(5);let q;while((q=E.nextQuestion(st))){const i=q.sl?.5:0;const t=tele(q,q.sl?0:i,"torn");E.answer(st,q,i,t)}const L=st.log;cs=L.reduce((a,l)=>a+l.c,0)/L.length}
const wins={};for(let s=1;s<=200;s++){const r=run("w",q=>q.sl?rnd():Math.floor(rnd()*q.opts.length),"",100+s,"torn");wins[r.res[0][0]]=(wins[r.res[0][0]]||0)+1}
const out=[R1,R2,R3].map(r=>`## ${r.name}\nPath after question ${E.DATA.flow[0].count}: ${E.PATHS[r.st.path].name}\nBehavior: ${JSON.stringify(E.behaviorSummary(r.st))}\n\n${r.log.join("\n")}\n\n${r.fr}\n\n**Result:** ${top(r,5)}\n`).join("\n");
const rep=`\n## Grades\n- Run 1 (always first): ${g1}/10. 30 distinct questions; ${top(R1,3)}.\n- Run 2 (random, torn behavior): ${g2}/10. Top god ${Math.round(R2.res[0][1]*100)}%.\n- Run 3 (as Nemesis): ${g3}/10. Nemesis ranked #${rank3}.\n${S.map(s=>`- Sweep, every god, ${s[0]}: ${s[1]}`).join("\n")}\n- Random winners over 200 runs: most common god won ${Math.max(...Object.values(wins))}/200; ${Object.keys(wins).length} of 20 gods won at least once.\n- Mean certainty of the 'torn' behavior profile: ${cs.toFixed(2)} (calm ~0.8+; lower = less weight on that answer).\n`;
let re0=0,re1=0;{const st=E.createState(9);let q,k=0;while(q=E.nextQuestion(st)){const i=q.sl?.5:0;E.answer(st,q,i,tele(q,q.sl?0:i,"mixed"));if(++k==6)re0=st.log[0].c}re1=st.log[0].c}
const VR=E.validateData(E.DATA);
const rep2=`- Data validator: ${VR.errors.length} errors, ${VR.warnings.length} warnings${VR.errors.concat(VR.warnings).slice(0,5).map(x=>"\n  - "+x).join("")}\n- Re-evaluation: certainty of answer 1 was ${re0.toFixed(3)} after 6 answers and ${re1.toFixed(3)} after 30 (changes as the user's statistics firm up).\n`;
fs.writeFileSync("test-log.md","# Test log (v9, 3 runs, with synthetic telemetry)\n\n"+out+rep+rep2);console.log(rep+rep2);
