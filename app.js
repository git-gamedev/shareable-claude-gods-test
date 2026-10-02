const app=document.getElementById("app"),UI=DATA.ui,esc=s=>String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;"),
U=(k,v)=>String(UI[k]).replace(/\{(\w+)\}/g,(m,x)=>v&&x in v?v[x]:m);
let st,q,fp="",sel=null,seen=false,cur=null,pickFn=null;
const tbars=()=>{const{nt}=traits(st);return DATA.traits.map(t=>'<div class="row"><span>'+esc(t.name)+'</span><div class="bar"><i style="width:'+Math.round(nt[t.id]*100)+'%"></i></div><span>'+Math.round(nt[t.id]*100)+'</span></div>').join("")};
function start(){const V=validateData(DATA);V.warnings.forEach(w=>console.warn(w));
if(V.errors.length){app.innerHTML='<h1>Data errors</h1><ul>'+V.errors.map(e=>'<li>'+esc(e)+'</li>').join("")+'</ul>';return}
st=createState(Date.now()%1e9);fp="";seen=false;cur=null;
app.innerHTML='<h1>'+esc(UI.title)+'</h1><p class="c t" style="margin-top:0">'+esc(UI.subtitle)+'</p><p class="c mut">'+U("intro",{traits:DATA.traits.length,afterQ:DATA.split?STAGES[DATA.split.afterStage].end:0,paths:DATA.paths.length,total:TOTAL})+'</p><button class="go" id="b">'+esc(UI.begin)+'</button>';
document.getElementById("b").onclick=next}
function split(){const p=PATHS[st.path],nm=i=>esc(DATA.traits.find(t=>t.id==p.traits[i]).name);
app.innerHTML='<h1>'+esc(UI.splitTitle)+'</h1><p class="c mut">'+esc(UI.splitTraits)+'</p>'+tbars()+'<p class="c t">'+esc(UI.splitRoad)+'</p><h2 class="c">'+esc(p.name)+'</h2><p class="c mut">'+U("splitWhy",{a:nm(0),b:nm(1)})+'</p><button class="go" id="c">'+esc(UI.walk)+'</button>';
document.getElementById("c").onclick=()=>{seen=true;next()}}
function doConfirm(){if(!cur)return;const t=Tele.end();cur=null;answer(st,q,q.sl?document.getElementById("v").value/100:sel,t);next()}
function next(){sel=null;cur=null;if(st.n>=TOTAL||!(q=nextQuestion(st)))return fr();
if(DATA.split&&st.n==STAGES[DATA.split.afterStage].end&&!seen&&st.path){st.used.delete(q.id);return split()}
const pre='<div class="bar"><i style="width:'+st.n/TOTAL*100+'%"></i></div><p class="mut">'+esc(q.stage)+' · '+U("qLabel",{n:st.n+1,total:TOTAL})+'</p><h2>'+esc(q.t)+'</h2>';
if(q.sl){app.innerHTML=pre+'<div class="sl"><span>'+esc(q.sl[0])+'</span><span>'+esc(q.sl[1])+'</span></div><input type="range" id="v" min="0" max="100" value="50"><button class="go" id="k" style="margin-top:14px">'+esc(UI.confirmSlider)+'</button>';
Tele.begin(0);cur="s";const v=document.getElementById("v"),f=()=>Tele.select("s",v.value/100);v.oninput=f;v.onchange=f;document.getElementById("k").onclick=doConfirm;return}
app.innerHTML=pre;const bs=[];Tele.begin(q.opts.length);cur="c";
const pick=i=>{Tele.select(i);sel=i;bs.forEach((x,j)=>{x.classList.toggle("sel",j==i);x.setAttribute("aria-pressed",j==i)});ok.disabled=false;ok.textContent=UI.confirmChoice};
q.opts.forEach((o,i)=>{const b=document.createElement("button");b.textContent=o.text;b.setAttribute("aria-pressed","false");
b.onpointerenter=e=>Tele.in(i,e);b.onpointerleave=()=>Tele.out(i);b.onfocus=()=>Tele.in(i);b.onblur=()=>Tele.out(i);b.onclick=()=>pick(i);app.appendChild(b);bs.push(b)});
const ok=document.createElement("button");ok.className="go";ok.disabled=true;ok.textContent=UI.choose;ok.onclick=()=>{if(sel!=null)doConfirm()};app.appendChild(ok);
const h=document.createElement("p");h.className="mut";h.style.fontSize=".8rem";h.textContent=UI.hint||"";app.appendChild(h);pickFn=pick}
addEventListener("keydown",e=>{if(cur!="c"||/TEXTAREA|INPUT/.test((e.target||{}).tagName||""))return;
if(/^[1-9]$/.test(e.key)&&+e.key<=q.opts.length){pickFn(+e.key-1);e.preventDefault()}else if(e.key=="Enter"&&sel!=null&&(e.target||{}).tagName!="BUTTON"){doConfirm()}});
function fr(){const p=PATHS[st.path]||{name:"",frPrompt:UI.frFallback||""};cur=null;app.innerHTML='<p class="mut">'+U("frLabel",{path:esc(p.name)})+'</p><h2>'+esc(p.frPrompt)+'</h2><textarea id="t" placeholder="'+esc(UI.frPlaceholder)+'"></textarea><button class="go" id="s">'+esc(UI.submit)+'</button><button class="alt" id="k">'+esc(UI.skip)+'</button>';
document.getElementById("s").onclick=()=>{const r=gradeFR(document.getElementById("t").value,FRALL);applyFR(st,r);fp=r.fp;done()};document.getElementById("k").onclick=done}
function done(){const r=result(st),g=G[r[0][0]],sec=G[r[1][0]],bs=behaviorSummary(st),pn=st.path?PATHS[st.path].name:"";
let h='<h1>'+esc(g.name)+'</h1><p class="c t" style="margin-top:0">'+esc(g.title)+'</p><p>'+esc(g.about)+'</p><div class="sec"><p class="t">'+esc(UI.strengths)+'</p><ul>'+g.strengths.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div><div class="sec"><p class="t">'+esc(UI.flaw)+'</p><p>'+esc(g.flaw)+'</p></div><div class="sec"><p class="t">'+esc(UI.secondaryHead)+'</p><p>'+U("secondary",{name:esc(sec.name),title:esc(sec.title.toLowerCase()),tag:esc(sec.tag),god:esc(g.name)})+'</p></div><div class="sec"><p class="t">'+esc(UI.mapHead)+' <span class="mut">'+esc(UI.mapHint)+'</span></p>';
r.slice(0,8).forEach(x=>{const p=Math.round(x[1]*100),o=G[x[0]];h+='<div class="row tip" tabindex="0" data-tip="'+esc(o.title+'. '+o.about)+'"><span>'+esc(o.name)+'</span><div class="bar"><i style="width:'+Math.min(p*3,100)+'%"></i></div><span>'+p+'%</span></div>'});
h+='</div><div class="sec"><p class="t">'+U("traitsHead",{path:esc(pn)})+'</p>'+tbars()+'</div><div class="sec"><p class="t">'+esc(UI.howHead)+'</p><p class="mut">'+U("how",{med:bs.medianSec,cert:bs.avgCertainty,changes:bs.changes,afk:bs.afk,mod:bs.modality})+'</p><button class="alt" id="x">'+esc(UI.copy)+'</button></div>'+(fp?'<p class="fp">'+U("fp",{fp})+'</p>':'')+'<button class="go" id="r" style="margin-top:14px">'+esc(UI.retake)+'</button>';
app.innerHTML=h;document.getElementById("r").onclick=start;document.getElementById("x").onclick=e=>{const s=JSON.stringify({path:st.path,log:st.log,summary:bs},null,1);(navigator.clipboard?navigator.clipboard.writeText(s):Promise.reject()).then(()=>e.target.textContent=UI.copied,()=>{e.target.textContent=UI.copyFail})}}
start();
