// Headless UI smoke test: stub DOM, drive the whole quiz through app.js + telemetry.js + engine.js. node smoke.js
const fs=require('fs'),vm=require('vm');let html="",els={},kids=[],t0=0;
const mk=()=>({style:{},className:"",classList:{toggle(){}},setAttribute(){},appendChild(c){kids.push(c)},onclick:null,value:"50",disabled:false,textContent:""});
const app=mk();Object.defineProperty(app,"innerHTML",{set(v){html=v;els={};kids=[]},get(){return html}});
const doc={getElementById:id=>id=="app"?app:(els[id]=els[id]||mk()),createElement:mk,addEventListener(){},hidden:false};
const ctx={document:doc,performance:{now:()=>t0+=700},addEventListener(){},navigator:{},console,Date,Math};vm.createContext(ctx);
for(const f of['data.js','telemetry.js','engine.js','app.js'])vm.runInContext(fs.readFileSync(f,'utf8').replace(/^(const|let) /gm,'var '),ctx);
let n=0,ch=0,sl=0,fail="";els.b.onclick();
for(let g=0;g<200&&!/Retake/.test(html)&&!fail;g++){
 if(/Walk on/.test(html)){els.c.onclick();continue}
 if(/<textarea/.test(html)){els.t=mk();els.t.value="I plan carefully and build a lever";els.s.onclick();continue}
 if(/type="range"/.test(html)){els.v=els.v||mk();els.v.value="80";els.k.onclick();sl++;n++;continue}
 const bs=kids.filter(k=>k.onpointerenter);if(!bs.length){fail="no options at step "+g;break}
 bs[0].onpointerenter({pointerType:"mouse"});bs[0].onclick();bs[1].onclick();ch++;kids[kids.length-2].onclick&&0;
 const ok=kids.find(k=>k.className=="go");if(ok.disabled){fail="confirm disabled";break}ok.onclick();n++}
console.log("answered",n,"(sliders",sl,") reached result:",/Retake/.test(html),fail||"");
const x=vm.runInContext("st.log",ctx);console.log("log rows",x.length,"changes logged",x.reduce((a,l)=>a+l.changes,0),"modality",x[3].modality);
