// v10 telemetry (paradata). Browser only; engine.js never touches it. Works with mouse, touch, pen and keyboard.
// Active time = sum of gaps between input events, each gap clamped to idleCapMs; hidden-tab time is excluded; one gap >= afkGapMs sets the afk flag.
const Tele=(()=>{const C=DATA.config.telemetry,now=()=>performance.now();let s=null,mod="mouse";
function tick(){if(!s||s.hidAt!=null)return;const t=now();s.act+=Math.min(t-s.last,C.idleCapMs);if(t-s.last>=C.afkGapMs)s.gap=true;s.last=t}
function openH(i){if(s&&i>=0&&i<s.n&&s.inAt[i]==null)s.inAt[i]=now()}
function closeH(i){if(s&&i>=0&&i<s.n&&s.inAt[i]!=null){s.hover[i]+=Math.min(now()-s.inAt[i],C.hoverCapMs);s.inAt[i]=null}}
addEventListener("pointerdown",e=>{mod=e.pointerType||"mouse";tick()},true);addEventListener("keydown",()=>{mod="keyboard";tick()},true);
addEventListener("pointermove",()=>tick(),true);addEventListener("scroll",()=>tick(),true);addEventListener("touchstart",()=>tick(),true);
document.addEventListener("visibilitychange",()=>{if(!s)return;if(document.hidden){tick();s.hidAt=now();for(let i=0;i<s.n;i++)closeH(i)}else if(s.hidAt!=null){s.hid+=now()-s.hidAt;s.hidAt=null;s.last=now()}});
return{
begin(n){s={n,start:now(),last:now(),act:0,hid:0,hidAt:null,gap:false,hover:new Array(n).fill(0),inAt:new Array(n).fill(null),sel:null,changes:0,prev:[],selAt:null,first:null,moves:0,lv:null,dir:0};tick()},
in(i,e){tick();if(e&&e.pointerType==="touch")return;openH(i)},
out(i){tick();closeH(i)},
// select(i) for a choice option; select("s",value01) for a slider (a direction reversal larger than 0.05 counts as a change)
select(i,v){if(!s)return;tick();if(s.first==null)s.first=now()-s.start;s.moves++;
if(i==="s"){const d=s.lv==null?0:Math.sign(v-s.lv);if(s.lv!=null&&Math.abs(v-s.lv)>.05){if(s.dir&&d&&d!==s.dir)s.changes++;s.dir=d||s.dir;s.lv=v}else if(s.lv==null)s.lv=v}
else if(s.sel!=null&&s.sel!==i){s.changes++;if(!s.prev.includes(s.sel))s.prev.push(s.sel)}
s.sel=i;s.selAt=now()},
end(){tick();for(let i=0;i<s.n;i++)closeH(i);const raw=now()-s.start-s.hid,r={ms:Math.max(0,s.act),rawMs:raw,afk:s.gap,hover:s.hover,changes:s.changes,prev:s.prev,modality:mod,confirmMs:s.selAt==null?null:now()-s.selAt,firstMs:s.first,moves:s.moves};s=null;return r}}})();
