const TOTAL=30,app=document.getElementById("app");let st,q,fp="";
function start(){st=createState(Date.now()%1e9);fp="";
app.innerHTML='<h1>Which God Are You?</h1><p class="c t" style="margin-top:0">Deep Cuts Edition</p><p class="c mut">An adaptive quiz: after every answer it updates a running map of all '+Object.keys(G).length+' gods and picks your next question to sharpen it. '+TOTAL+' questions, then two free-response questions.</p><button class="go" id="b">Begin</button>';
document.getElementById("b").onclick=next}
function next(){if(st.n>=TOTAL||!(q=nextQuestion(st)))return fr();
app.innerHTML='<div class="bar"><i style="width:'+st.n/TOTAL*100+'%"></i></div><p class="mut">Question '+(st.n+1)+' of '+TOTAL+'</p><h2>'+q.t+'</h2>';
q.opts.forEach((o,i)=>{const b=document.createElement("button");b.textContent=o.text;b.onclick=()=>{answer(st,q,i);next()};app.appendChild(b)})}
let t1="";
function fr(n){n=n||1;app.innerHTML='<p class="mut">Final questions: free response '+n+' of 2</p><h2>'+(n==1?FRPROMPT:FRPROMPT2)+'</h2><textarea id="t" placeholder="Write a few sentences..."></textarea><button class="go" id="s">Submit</button><button class="alt" id="k">Skip</button>';
const fin=t=>{if(n==1){t1=t;fr(2)}else{const all=(t1+" "+t).trim();if(all)fp=gradeFR(all).fp;done()}};
document.getElementById("s").onclick=()=>{const t=document.getElementById("t").value;applyFR(st,gradeFR(t,n==1?FR:FR2),6);fin(t)};
document.getElementById("k").onclick=()=>fin("")}
function done(){const r=result(st),g=G[r[0][0]],sec=G[r[1][0]];
let h='<h1>'+g[0]+'</h1><p class="c t" style="margin-top:0">'+g[1]+'</p><p>'+g[2]+'</p>'
+'<div class="sec"><p class="t">Divine Strengths</p><ul>'+g[3].map(x=>'<li>'+x+'</li>').join('')+'</ul></div>'
+'<div class="sec"><p class="t">Fatal Flaw</p><p>'+g[4]+'</p></div>'
+'<div class="sec"><p class="t">Your Secondary Pull</p><p><b>'+sec[0]+'</b>, '+sec[1].toLowerCase()+'. You also carry '+sec[5]+', which is why you aren\'t a pure '+g[0]+'.</p></div>'
+'<div class="sec"><p class="t">Your Final Map</p>';
r.slice(0,6).forEach(x=>{const p=Math.round(x[1]*100);h+='<div class="row"><span>'+G[x[0]][0]+'</span><div class="bar"><i style="width:'+Math.min(p*2.5,100)+'%"></i></div><span>'+p+'%</span></div>'});
h+='</div>'+(fp?'<p class="fp">Your free-response fingerprint: '+fp+'</p>':'')+'<button class="go" id="r" style="margin-top:14px">Retake</button>';
app.innerHTML=h;document.getElementById("r").onclick=start}
start();
