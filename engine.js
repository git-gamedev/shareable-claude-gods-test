// Adaptive engine: running percentage map per god; question tier (broad > mid > narrow) and question choice depend on the map.
const CL={mk:"he ar ac at ch ap",so:"hm ir nk er mo hs",wi:"pn ty nr ar nk hm ir",ni:"ny hy mp tn nm mo ch"};
function parse(sp){const w={};sp.split(" ").forEach(p=>{if(!p)return;if(p[0]=="@")CL[p.slice(1,3)].split(" ").forEach(g=>w[g]=(w[g]||0)+ +p[3]);else w[p.slice(0,2)]=(w[p.slice(0,2)]||0)+ +p[2]})
return w}
const POOL=[];
RAW_B.forEach((q,i)=>POOL.push({id:"B"+(i+1),tier:"B",t:q[0],o:q[1].map(o=>({text:o[0],w:parse(o[1])}))}));
RAW_M.forEach((q,i)=>POOL.push({id:"M"+(i+1),tier:"M",t:q[0],o:q[1].map(o=>({text:o[0],w:parse(o[1])}))}));
// Narrow questions are generated live from the leading gods' own strengths, flaws, tags and titles.
const FAM=[["s",0],["s",1],["s",2],["f"],["g"],["t"]],NAR=[];
[0,2].forEach(off=>FAM.forEach(f=>NAR.push({id:"N"+f.join("")+off,f,off})));
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shuffle(a,r){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function createState(seed){const S={};for(const g in G)S[g]=0;return{S,used:new Set(),n:0,rng:rng(seed||1)}}
function pmap(st){const e={};let z=0;for(const g in G){e[g]=Math.exp(st.S[g]/3);z+=e[g]}for(const g in e)e[g]/=z;return e}
const rank=st=>Object.keys(G).sort((a,b)=>(st.S[b]-st.S[a])||(a<b?-1:1));
function rel(q,top,st){let r=0;top.forEach(g=>{const ws=q.o.map(o=>o.w[g]||0);r+=Math.max(...ws)-ws.reduce((x,y)=>x+y,0)/ws.length});return r+st.rng()*0.01}
// Show 5 options: the 3 that point most at the current top gods plus 2 random others from the pool.
function pick(st,opts,top){const sc=opts.map(o=>({o,s:top.reduce((a,g)=>a+(o.w[g]||0),0)+st.rng()*0.01})).sort((a,b)=>b.s-a.s);
return shuffle(sc.slice(0,3).map(x=>x.o).concat(shuffle(sc.slice(3).map(x=>x.o),st.rng).slice(0,2)),st.rng)}
function buildN(st,k,r){const gs=r.slice(k.off,k.off+6),f=k.f[0],i=k.f[1];let t,fn;
if(f=="s"){t="Which of these strengths feels most like yours?";fn=g=>G[g][3][i]}
else if(f=="f"){t="Which flaw do you recognize in yourself?";fn=g=>G[g][4].split(". ")[0].replace(/\.$/,"")+"."}
else if(f=="g"){t="Which of these sounds most like you?";fn=g=>G[g][5].replace(/^./,c=>c.toUpperCase())}
else{t="Which title would you rather hold?";fn=g=>G[g][1]}
return{id:k.id,t,opts:pick(st,gs.map(g=>({text:fn(g),w:{[g]:2.5}})),r.slice(0,5))}}
function nextQuestion(st){const pm=pmap(st),r=rank(st),pmax=pm[r[0]],K=pmax<0.25?5:3,top=r.slice(0,K);
const tier=st.n<4||pmax<0.12?"B":pmax<0.25?"M":"N";
const order=tier=="B"?["B","M","N"]:tier=="M"?["M","N","B"]:["N","M","B"];
for(const t of order){let q=null;
if(t=="N"){const k=NAR.find(x=>!st.used.has(x.id));if(k)q=buildN(st,k,r)}
else{const c=POOL.filter(x=>x.tier==t&&!st.used.has(x.id));if(c.length){c.sort((a,b)=>rel(b,top,st)-rel(a,top,st));q={id:c[0].id,t:c[0].t,opts:pick(st,c[0].o,top)}}}
if(q){st.used.add(q.id);q.tier=t;return q}}
return null}
function answer(st,q,i){const o=q.opts[i];for(const g in o.w)st.S[g]+=o.w[g];st.n++}
// Free response: drop filler words (keeping not/no/and/but/or/never), light stemming, hash each token and bigram into buckets,
// compare to each god's reference by cosine; a 32-bit SimHash fingerprint is a second, locality-sensitive hash check.
const STOP=new Set("the a an uh uhh um umm er eh hm hmm oh ah well so just really very is are was were be been am to of in on at it its i me my that this then there here you your we our they their them as with for from by do does did have has had will would can could might maybe".split(" "));
const toks=t=>t.toLowerCase().replace(/'/g,"").split(/[^a-z]+/).filter(w=>w&&!STOP.has(w)).map(w=>w.length>4?w.replace(/(ing|ed|es|s)$/,""):w);
function h32(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function vec(tk){const v={},add=k=>{const b=h32(k)%4096;v[b]=(v[b]||0)+1};tk.forEach(add);for(let i=1;i<tk.length;i++)add(tk[i-1]+"_"+tk[i]);return v}
function cos(a,b){let d=0,x=0,y=0;for(const k in a){x+=a[k]*a[k];if(b[k])d+=a[k]*b[k]}for(const k in b)y+=b[k]*b[k];return x&&y?d/Math.sqrt(x*y):0}
function simhash(tk){const c=new Array(32).fill(0);tk.forEach(w=>{const h=h32(w);for(let i=0;i<32;i++)c[i]+=(h>>>i&1)?1:-1});let f=0;c.forEach((v,i)=>{if(v>0)f|=1<<i});return f>>>0}
const pop=x=>{let n=0;while(x){n+=x&1;x>>>=1}return n};
function gradeFR(text){const tk=toks(text),v=vec(tk),fp=simhash(tk),sim={};
for(const g in FR){const rt=toks(FR[g]);sim[g]=0.8*cos(v,vec(rt))+0.2*Math.max(0,(1-pop((fp^simhash(rt))>>>0)/32-0.5)*2)}
return{fp:fp.toString(16).padStart(8,"0"),n:tk.length,sim}}
function applyFR(st,res){if(res.n<3)return;for(const g in res.sim)st.S[g]+=10*res.sim[g]}
function result(st){const pm=pmap(st);return rank(st).map(g=>[g,pm[g]])}
