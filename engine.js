// v9 engine. Everything content-related comes from DATA (data.js). See the format notes there.
const C=DATA.config,T=C.telemetry,TR=DATA.traits.map(t=>t.id),GOD={},GP={};
DATA.gods.forEach(g=>{GOD[g.id]=g;GP[g.id]={};TR.forEach(t=>GP[g.id][t]=g.profile[t]||0)});
const G=GOD,GIDS=DATA.gods.map(g=>g.id),PM={},PS={};
TR.forEach(t=>{PM[t]=GIDS.reduce((a,g)=>a+GP[g][t],0)/GIDS.length;PS[t]=Math.sqrt(GIDS.reduce((a,g)=>a+(GP[g][t]-PM[t])**2,0)/GIDS.length)||1});
const BANK=DATA.questions.map(q=>({...q,qt:q.type=="slider"?[q.slider.leftTrait,q.slider.rightTrait]:[...new Set(q.options.flatMap(o=>Object.keys(o.w)))]}));
const STAGES=[];{let s=0;DATA.flow.forEach(f=>{STAGES.push({...f,start:s,end:s+f.count});s+=f.count})}
const TOTAL=STAGES.length?STAGES[STAGES.length-1].end:0,PATHS=Object.fromEntries(DATA.paths.map(p=>[p.id,p]));
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shuffle(a,r){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const med=a=>{const s=[...a].sort((x,y)=>x-y),m=s.length>>1;return s.length?(s.length%2?s[m]:(s[m-1]+s[m])/2):0};
const sig=x=>1/(1+Math.exp(-x)),clip=(x,a,b)=>Math.max(a,Math.min(b,x));
function createState(seed){const z=()=>Object.fromEntries(TR.map(t=>[t,0]));return{ev:Object.fromEntries(GIDS.map(g=>[g,0])),sum:z(),ex:z(),lo:z(),hi:z(),used:new Set,n:0,path:null,fr:null,tl:[],recs:[],log:[],rng:rng(seed||1)}}
function traits(st){const nt={},ut={},wt={};for(const t of TR){const r=st.hi[t]-st.lo[t];nt[t]=r>0?(st.sum[t]-st.lo[t])/r:.5;ut[t]=r>0?(st.sum[t]-st.ex[t])/r:0;wt[t]=Math.min(1,r/C.coverageRange)}return{nt,ut,wt}}
function logits(st){const{ut,wt}=traits(st),L={};for(const g of GIDS){let d=0,y=0;TR.forEach(t=>{d+=ut[t]*wt[t]*(GP[g][t]-PM[t])/PS[t];y+=((GP[g][t]-PM[t])/PS[t])**2});L[g]=C.K*d/Math.sqrt(y||1)+C.duelWeight*st.ev[g]+(st.fr?C.frWeight*st.fr[g]:0)}return L}
function pmap(st){const L=logits(st),e={};let z=0;for(const g in L){e[g]=Math.exp(L[g]);z+=e[g]}for(const g in e)e[g]/=z;return e}
const rank=st=>{const L=logits(st);return GIDS.slice().sort((a,b)=>(L[b]-L[a])||(a<b?-1:1))};
function choosePath(st){const{nt}=traits(st);let b=null,s=-1;DATA.paths.forEach(p=>{const v=(nt[p.traits[0]]+nt[p.traits[1]])+st.rng()*C.noiseTiebreak;if(v>s){s=v;b=p.id}});return b}
const stageOf=n=>STAGES.find(s=>n>=s.start&&n<s.end);
function nextQuestion(st){const S=stageOf(st.n);if(!S)return null;const top=rank(st).slice(0,3),name=S.name.replace("{path}",st.path?PATHS[st.path].name:"");
if(S.kind=="duel"){const r=rank(st).slice(0,S.gods),id="duel"+st.n;st.used.add(id);
const opts=shuffle(r.map(g=>{const s=GOD[g].statements;return{text:s[(st.n-S.start)%s.length],g,w:{}}}),st.rng);
return{id,t:S.prompt,stage:name,path:st.path,duel:1,opts,chars:S.prompt.length+opts.reduce((a,o)=>a+o.text.length,0)}}
const pool=S.pool=="@path"?st.path:S.pool;let c=BANK.filter(q=>!st.used.has(q.id)&&(pool=="*"||q.pool==pool));if(!c.length)c=BANK.filter(q=>!st.used.has(q.id));if(!c.length)return null;
const{wt}=traits(st),sc=x=>x.qt.reduce((a,t)=>{const v=top.map(g=>GP[g][t]),m=v.reduce((p,q)=>p+q,0)/3;return a+4*v.reduce((p,q)=>p+(q-m)**2,0)/3+.3*(1-wt[t])},0)+st.rng()*C.noiseTiebreak;
const q=S.pick=="info"?c.sort((a,b)=>sc(b)-sc(a))[0]:c[0];st.used.add(q.id);
const base={id:q.id,t:q.text,stage:name,path:st.path};
if(q.type=="slider")return{...base,sl:[q.slider.left,q.slider.right,q.slider.leftTrait,q.slider.rightTrait],qt:q.qt,chars:q.text.length+q.slider.left.length+q.slider.right.length};
const s2=q.options.map(o=>({o,s:Object.keys(o.w).reduce((a,t)=>a+o.w[t]*(top.reduce((p,g)=>p+GP[g][t],0)/3-PM[t]),0)+st.rng()*C.noiseTiebreak})).sort((a,b)=>b.s-a.s);
const opts=shuffle(s2.slice(0,C.aimed).map(x=>x.o).concat(shuffle(s2.slice(C.aimed).map(x=>x.o),st.rng).slice(0,C.shown-C.aimed)),st.rng);
return{...base,pool:q.options,opts,chars:q.text.length+opts.reduce((a,o)=>a+o.text.length,0)}}
// v10: every answer is stored raw (st.recs). After EACH new answer rebuild() re-derives the certainty of ALL answers from the user's current statistics,
// so earlier answers are re-judged as the user's rhythm becomes clearer. Outliers: two-pass median/MAD (robust) with winsorized z-scores.
function robust(v,prior){if(v.length<T.minHist)return{m:0,sd:prior};const m=med(v);return{m,sd:Math.max(T.madFloor,1.4826*med(v.map(a=>Math.abs(a-m))))}}
function evalAll(st){const R=st.recs,ent=[],use=[],sh=[];
R.forEach((r,k)=>{const t=r.t,n=r.q.opts?r.q.opts.length:0;use[k]=false;if(!t)return;const h=(t.hover||[]).slice(0,n),hs=h.reduce((a,b)=>a+b,0);
if(n>1&&t.modality!="touch"&&hs>=T.minHoverMs){use[k]=true;sh[k]=h.map(v=>v/hs);ent[k]=-sh[k].reduce((a,p)=>a+(p>0?p*Math.log(p):0),0)/Math.log(n)}});
const lx=R.map(r=>r.t?Math.log(Math.max(r.t.ms||0,T.minMs))-Math.log(T.baseMs+T.msPerChar*(r.q.chars||0)):0),
lc=R.map(r=>r.t?Math.log(Math.max(r.t.confirmMs||T.confirmBaseMs,T.minMs))-Math.log(T.confirmBaseMs):0);
let ok=R.map(r=>!!r.t&&!r.t.afk&&(r.t.rawMs||0)<=T.afkRawMs),S={m:0,sd:T.priorSd};
for(let p=0;p<2;p++){S=robust(lx.filter((_,k)=>ok[k]),T.priorSd);ok=ok.map((o,k)=>o&&Math.abs((lx[k]-S.m)/S.sd)<=T.afkZ)}
const S2=robust(lc.filter((_,k)=>ok[k]),T.priorSd),eh=ent.filter((_,k)=>ok[k]&&use[k]),mh=eh.length>=T.minHist?med(eh):.5;
return R.map((r,k)=>{const t=r.t,q=r.q,i=q.sl?0:r.i,n=q.opts?q.opts.length:0;
if(!t)return{c:1,p:n?q.opts.map((_,j)=>+(j==i)):null,f:null};
const afk=!ok[k],z=afk?0:clip((lx[k]-S.m)/S.sd,-T.zClip,T.zClip),zc=afk?0:clip((lc[k]-S2.m)/S2.sd,-T.zClip,T.zClip),u=use[k]&&!afk,
dh=u?clip(ent[k]-mh,-.5,.5):0,ch=afk?0:Math.min(3,t.changes||0),
lg=T.b0+T.bSpeed*(-z)-T.bConf*zc+(u?T.bHover*(sh[k][i]-1/n)-T.bEnt*2*dh:0)-T.bChange*ch,c=afk?(T.cMin+T.cMax)/2:T.cMin+(T.cMax-T.cMin)*sig(lg);
let p=null;if(n){const pv=new Set(t.prev||[]),w=q.opts.map((_,j)=>j==i?0:(u?sh[k][j]:0)+T.floor+(pv.has(j)?T.prevBoost:0)),W=w.reduce((a,b)=>a+b,0);p=w.map((v,j)=>j==i?c:(1-c)*v/W)}
return{c,p,f:{speed:-z/T.zClip,hesitation:clip(Math.min(1,ch/3)*2-1+zc/T.zClip,-1,1),spread:u?clip(dh*4,-1,1):0,certainty:(c-(T.cMin+T.cMax)/2)/((T.cMax-T.cMin)/2),afk,z,hs:u?sh[k][i]:null}}})}
function applyRec(st,q,i,r,m=1){const c=r.c;
if(q.duel){q.opts.forEach((o,j)=>st.ev[o.g]+=r.p[j])}
else if(q.sl){const[,,a,b]=q.sl,x=.5+(i-.5)*(T.sliderBase+(1-T.sliderBase)*c);st.sum[a]+=(1-x)*2;st.sum[b]+=x*2;st.hi[a]+=2;st.hi[b]+=2;st.ex[a]+=1;st.ex[b]+=1}
else for(const t of TR){const v=q.pool.map(o=>o.w[t]||0);st.lo[t]+=Math.min(...v);st.hi[t]+=Math.max(...v);st.ex[t]+=v.reduce((a,b)=>a+b,0)/v.length;{const mean=v.reduce((a,b)=>a+b,0)/v.length;st.sum[t]+=m*q.opts.reduce((a,o,j)=>a+r.p[j]*(o.w[t]||0),0)+(1-m)*mean}}
if(r.f&&!q.duel)C.behavior.forEach(rule=>{const f=r.f.afk?0:r.f[rule.feature]||0;for(const t in rule.map){st.sum[t]+=rule.map[t]*f*C.behaviorWeight;const w=Math.abs(rule.map[t])*C.behaviorWeight;st.lo[t]-=w;st.hi[t]+=w}})}
function rebuild(st){const E=evalAll(st);let infl=st.recs.map(()=>1);
for(let pass=0;pass<=(C.consistency?C.consistency.passes:0);pass++){
 for(const t of TR)st.sum[t]=st.lo[t]=st.hi[t]=st.ex[t]=0;for(const g of GIDS)st.ev[g]=0;st.log=[];
 st.recs.forEach((r,k)=>{applyRec(st,r.q,r.i,E[k],infl[k]);const t=r.t;st.log.push({id:r.q.id,stage:r.q.stage,sel:r.i,c:+E[k].c.toFixed(3),infl:+infl[k].toFixed(2),afk:E[k].f?E[k].f.afk:false,ms:t?t.ms:null,changes:t?t.changes:0,modality:t?t.modality:null,confirmMs:t?t.confirmMs:null,firstMs:t?t.firstMs:null,moves:t?t.moves:null})});
 if(!C.consistency||pass==C.consistency.passes||st.recs.length<C.consistency.minAnswers)break;
 // Consistency: how well each choice answer agrees with the current leading gods, relative to the other options in its pool.
 const pm=pmap(st),top=GIDS.slice().sort((a,b)=>pm[b]-pm[a]).slice(0,C.consistency.topGods),fit=o=>top.reduce((a,g)=>a+pm[g]*Object.keys(o.w).reduce((x,t)=>x+o.w[t]*(GP[g][t]-PM[t])/PS[t],0),0);
 const a=st.recs.map(r=>{if(r.q.duel||r.q.sl||!r.q.opts)return null;const f=r.q.pool.map(fit),m=f.reduce((x,y)=>x+y,0)/f.length,sd=Math.sqrt(f.reduce((x,y)=>x+(y-m)**2,0)/f.length)||1;return(fit(r.q.opts[r.i])-m)/sd}),v=a.filter(x=>x!=null),mu=med(v),sg=Math.max(.3,1.4826*med(v.map(x=>Math.abs(x-mu))));
 infl=a.map(x=>x==null?1:clip(1-C.consistency.strength*Math.max(0,(mu-x)/sg-C.consistency.tolerance),C.consistency.floor,1))}
 }
// answer(st,q,sel,tele): sel = shown-option index, or slider position 0..1. tele optional (omit for plain scoring).
function answer(st,q,i,tele){st.recs.push({q,i,t:tele||null});st.n++;rebuild(st);if(DATA.split&&STAGES[DATA.split.afterStage]&&st.n==STAGES[DATA.split.afterStage].end)st.path=choosePath(st)}
// Data check for people editing data.js. Returns {errors, warnings} (strings).
function validateData(D){const e=[],w=[],ids=new Set,tid=new Set((D.traits||[]).map(t=>t.id)),pid=new Set((D.paths||[]).map(p=>p.id)),cf=D.config||{},cnt={};
if(tid.size<2)e.push("traits: need at least 2");
(D.gods||[]).length>=2||e.push("gods: need at least 2");
(D.gods||[]).forEach(g=>{["id","name","title","about","flaw","tag"].forEach(k=>g[k]||e.push("god "+g.id+": missing "+k));
[...tid].every(t=>typeof(g.profile||{})[t]=="number")||e.push("god "+g.id+": profile needs a number for every trait");
(g.strengths||[]).length||w.push("god "+g.id+": no strengths");(g.statements||[]).length||w.push("god "+g.id+": no statements (needed for duels)");(g.refs||[]).length||w.push("god "+g.id+": no refs (free response cannot match it)")});
(D.questions||[]).forEach(q=>{if(ids.has(q.id))e.push("duplicate question id "+q.id);ids.add(q.id);cnt[q.pool]=(cnt[q.pool]||0)+1;if(!q.text)e.push(q.id+": missing text");
if(q.type=="slider"){const s=q.slider||{};tid.has(s.leftTrait)&&tid.has(s.rightTrait)||e.push(q.id+": slider traits unknown");s.left&&s.right||e.push(q.id+": slider needs left and right labels")}
else if(q.type=="choice"){const o=q.options||[];o.length<2&&e.push(q.id+": needs at least 2 options");o.length<cf.shown&&w.push(q.id+": fewer options than config.shown");
o.forEach((x,j)=>{x.text||e.push(q.id+" option "+j+": missing text");Object.keys(x.w||{}).forEach(t=>tid.has(t)||e.push(q.id+" option "+j+": unknown trait "+t));Object.keys(x.w||{}).length||w.push(q.id+" option "+j+": empty weights")});
new Set(o.map(x=>JSON.stringify(x.w))).size<2&&w.push(q.id+": options carry no information")}
else e.push(q.id+': type must be "choice" or "slider"')});
(D.flow||[]).forEach((f,k)=>{if(!(f.count>0))e.push("flow["+k+"]: count must be > 0");if(f.kind=="duel")return;
if(f.pool=="@path")D.paths.forEach(p=>(cnt[p.id]||0)<f.count&&w.push("flow["+k+"]: path "+p.id+" has "+(cnt[p.id]||0)+" questions, needs "+f.count+" (falls back to any unused)"));
else if(f.pool!="*"&&(cnt[f.pool]||0)<f.count)w.push("flow["+k+"]: pool "+f.pool+" has "+(cnt[f.pool]||0)+" questions, needs "+f.count+" (falls back)")});
if(D.split&&!(D.paths||[]).length)e.push("split needs paths");(D.paths||[]).forEach(p=>(p.traits||[]).every(t=>tid.has(t))||e.push("path "+p.id+": unknown trait"));
const need=(D.flow||[]).reduce((a,f)=>a+(f.count||0),0);ids.size<need&&w.push("only "+ids.size+" questions for "+need+" slots (duels need none)");
return{errors:e,warnings:w}}
// Free response: drop filler words (keeping not/no/and/but/or/never), light stemming, hash each token and bigram into buckets,
// compare to each god's reference by cosine; a 32-bit SimHash fingerprint is a second, locality-sensitive hash check.
const FRC=C.fr,STOP=new Set(FRC.stop);
const toks=t=>t.toLowerCase().replace(/'/g,"").split(/[^a-z]+/).filter(w=>w&&!STOP.has(w)).map(w=>w.length>4?w.replace(/(ing|ed|es|s)$/,""):w);
function h32(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function vec(tk){const v={},add=k=>{const b=h32(k)%FRC.buckets;v[b]=(v[b]||0)+1};tk.forEach(add);for(let i=1;i<tk.length;i++)add(tk[i-1]+"_"+tk[i]);return v}
function cos(a,b){let d=0,x=0,y=0;for(const k in a){x+=a[k]*a[k];if(b[k])d+=a[k]*b[k]}for(const k in b)y+=b[k]*b[k];return x&&y?d/Math.sqrt(x*y):0}
function simhash(tk){const c=new Array(32).fill(0);tk.forEach(w=>{const h=h32(w);for(let i=0;i<32;i++)c[i]+=(h>>>i&1)?1:-1});let f=0;c.forEach((v,i)=>{if(v>0)f|=1<<i});return f>>>0}
const pop=x=>{let n=0;while(x){n+=x&1;x>>>=1}return n};
function gradeFR(text,tbl){tbl=tbl||FR;const tk=toks(text),v=vec(tk),fp=simhash(tk),sim={};
for(const g in tbl){let m=0;[].concat(tbl[g]).forEach(r=>{const rt=toks(r);m=Math.max(m,FRC.wCos*cos(v,vec(rt))+FRC.wSim*Math.max(0,(1-pop((fp^simhash(rt))>>>0)/32-0.5)*2))});sim[g]=m}
return{fp:fp.toString(16).padStart(8,"0"),n:tk.length,sim}}
const FRALL=Object.fromEntries(GIDS.map(g=>[g,GOD[g].refs]));
function applyFR(st,res){if(res.n>=FRC.minTokens)st.fr=res.sim}
function result(st){const pm=pmap(st);return rank(st).map(g=>[g,pm[g]])}
function behaviorSummary(st){const L=st.log.filter(l=>l.ms!=null);return{answers:L.length,medianSec:+(med(L.map(l=>l.ms))/1000).toFixed(1),avgCertainty:+(L.reduce((a,l)=>a+l.c,0)/(L.length||1)).toFixed(2),changes:L.reduce((a,l)=>a+l.changes,0),afk:L.filter(l=>l.afk).length,modality:L.length?L[L.length-1].modality:null}}
