/* Shared game rules + bots. Runs in the browser (global GAMES) and on the server (require). No UI here.
   Every game: init(n?), move(s,p,m)->new state|null, result(s)->{w}|{draw:1}|null; state.t = whose turn. */
(function(root){
const NODE=typeof module!=='undefined',CH=NODE?require('./chess.js'):root.CHESS;
const LOGIC={};
const LINES=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
LOGIC.tictactoe={seats:2,depth:[0,2,9],
 init:()=>({b:Array(9).fill(null),t:0}),
 moves:s=>s.b.map((v,i)=>v===null?i:-1).filter(i=>i>=0),
 move(s,p,i){if(s.t!==p||s.b[i]!==null)return null;const b=[...s.b];b[i]=p;return{b,t:1-p}},
 result(s){for(const[a,b,c]of LINES)if(s.b[a]!==null&&s.b[a]===s.b[b]&&s.b[a]===s.b[c])return{w:s.b[a]};return s.b.every(v=>v!==null)?{draw:1}:null}};
LOGIC.connect4={seats:2,depth:[0,2,5],
 init:()=>({b:Array(42).fill(null),t:0}),
 moves:s=>[3,2,4,1,5,0,6].filter(c=>s.b[c]===null),
 move(s,p,c){if(s.t!==p||s.b[c]!==null)return null;const b=[...s.b];let r=5;while(b[r*7+c]!==null)r--;b[r*7+c]=p;return{b,t:1-p}},
 result(s){const b=s.b;for(let r=0;r<6;r++)for(let c=0;c<7;c++){const v=b[r*7+c];if(v===null)continue;
  for(const[dr,dc]of[[0,1],[1,0],[1,1],[1,-1]]){let k=1;while(k<4){const y=r+dr*k,x=c+dc*k;if(y<0||y>5||x<0||x>6||b[y*7+x]!==v)break;k++}if(k===4)return{w:v}}}
  return b.slice(0,7).every(v=>v!==null)?{draw:1}:null}};
const VAL={p:1,n:3,b:3,r:5,q:9,k:0};
LOGIC.chess={seats:2,
 init:()=>CH.start(),
 moves(s){return CH.legal(s).sort((a,b)=>(s.b[b.t]?1:0)-(s.b[a.t]?1:0))},
 move(s,p,m){if(s.t!==p||!m)return null;const L=CH.legal(s).find(x=>x.f===m.f&&x.t===m.t);return L?CH.apply(s,L):null},
 result:s=>CH.result(s),
 heur(s,me){let v=0;for(const x of s.b)if(x){const q=VAL[x.toLowerCase()];v+=(x===x.toUpperCase())===(me===0)?q:-q}return v},
 bot(s,me,lvl,o){const L=CH.legal(s);if(!lvl){const c=L.filter(m=>s.b[m.t]);return(c.length&&Math.random()<.5?c:L)[Math.random()*(c.length&&Math.random()<.5?c.length:L.length)|0]||L[0]}
  return CH.best(s,(o&&o.ms)||(lvl===1?300:1500),lvl===1?3:9)}};
/* Ludo: n players (2 or 4), 4 tokens each. pos -1 yard, 0..50 ring, 51..56 home column, 57 home. */
const OFF={2:[0,26],4:[0,13,26,39]},SAFE=new Set([0,8,13,21,26,34,39,47]);
const A_=(s,p,r)=>(OFF[s.pos.length][p]+r)%52;
const legalT=(s,p,v)=>[0,1,2,3].filter(k=>{const r=s.pos[p][k];return r===-1?v===6:r+v<=57});
LOGIC.ludo={seats:4,legalT,SAFE,OFF,
 init:(n=4)=>({pos:Array.from({length:n},()=>[-1,-1,-1,-1]),t:0,d:null,last:null}),
 move(s,p,m){if(s.t!==p||!m)return null;const n=s.pos.length;
  if(m.roll!==undefined){if(s.d!==null||!(m.roll>=1&&m.roll<=6))return null;const r={...s,d:m.roll,last:{p,v:m.roll}};if(!legalT(s,p,m.roll).length){r.d=null;r.t=(p+1)%n}return r}
  if(s.d===null||!legalT(s,p,s.d).includes(m.tok))return null;
  const v=s.d,pos=s.pos.map(a=>a.slice()),r=pos[p][m.tok],nr=r===-1?0:r+v;pos[p][m.tok]=nr;
  if(nr<=50&&!SAFE.has(A_(s,p,nr)))for(let q=0;q<n;q++)if(q!==p)pos[q]=pos[q].map(x=>x>=0&&x<=50&&A_(s,q,x)===A_(s,p,nr)?-1:x);
  return{pos,t:v===6?p:(p+1)%n,d:null,last:{p,v}}},
 result(s){const w=s.pos.findIndex(a=>a.every(r=>r===57));return w>=0?{w}:null},
 bot(s,me,lvl){if(s.d===null)return{roll:1+(Math.random()*6|0)};const L=legalT(s,me,s.d);if(!lvl)return{tok:L[Math.random()*L.length|0]};
  let best=-1,pick=L[0];for(const k of L){const r=s.pos[me][k],nr=r===-1?0:r+s.d;let sc=nr;if(nr===57)sc+=80;if(r===-1)sc+=50;
   if(nr<=50&&!SAFE.has(A_(s,me,nr))&&s.pos.some((a,q)=>q!==me&&a.some(x=>x>=0&&x<=50&&A_(s,q,x)===A_(s,me,nr))))sc+=100;
   if(lvl>1&&nr<=50&&SAFE.has(A_(s,me,nr)))sc+=25;if(sc>best){best=sc;pick=k}}
  return{tok:pick}}};
/* Carrom: 400x400 board, p0 (white) shoots from the bottom, p1 (black) from the top. Shot m={x,a,pw}. */
const CW=400,CRAD=11,SRAD=14,PRAD=19,PK=[[9,9],[391,9],[9,391],[391,391]];
function carromStart(){const c=[{x:200,y:200,c:'q'}];for(let i=0;i<6;i++){const a=i*Math.PI/3;c.push({x:+(200+25*Math.cos(a)).toFixed(2),y:+(200+25*Math.sin(a)).toFixed(2),c:i%2?'b':'w'})}
 for(let i=0;i<12;i++){const a=i*Math.PI/6+Math.PI/12;c.push({x:+(200+48*Math.cos(a)).toFixed(2),y:+(200+48*Math.sin(a)).toFixed(2),c:i%2?'w':'b'})}return c}
function sim(coins,sx,sy,a,pw,rec){
 const B=[{x:sx,y:sy,vx:Math.cos(a)*pw*22,vy:Math.sin(a)*pw*22,r:SRAD,m:2.2,on:1}];
 coins.forEach(c=>B.push({x:c.x,y:c.y,vx:0,vy:0,r:CRAD,m:1,on:1,c:c.c}));
 const fr=[],pk=[];let sp=0;
 for(let step=0;step<3000;step++){let mv=0;
  for(const b of B){if(!b.on)continue;b.x+=b.vx*.5;b.y+=b.vy*.5;b.vx*=.991;b.vy*=.991;
   if(b.x<b.r){b.x=b.r;b.vx=Math.abs(b.vx)*.8}if(b.x>CW-b.r){b.x=CW-b.r;b.vx=-Math.abs(b.vx)*.8}
   if(b.y<b.r){b.y=b.r;b.vy=Math.abs(b.vy)*.8}if(b.y>CW-b.r){b.y=CW-b.r;b.vy=-Math.abs(b.vy)*.8}
   if(Math.abs(b.vx)+Math.abs(b.vy)>.06)mv=1;else{b.vx=0;b.vy=0}}
  for(let i=0;i<B.length;i++){const p=B[i];if(!p.on)continue;for(let j=i+1;j<B.length;j++){const q=B[j];if(!q.on)continue;
   const dx=q.x-p.x,dy=q.y-p.y,rr=p.r+q.r,d2=dx*dx+dy*dy;if(d2>=rr*rr||d2===0)continue;
   const d=Math.sqrt(d2),nx=dx/d,ny=dy/d,ov=rr-d,tm=p.m+q.m;p.x-=nx*ov*q.m/tm;p.y-=ny*ov*q.m/tm;q.x+=nx*ov*p.m/tm;q.y+=ny*ov*p.m/tm;
   const vn=(q.vx-p.vx)*nx+(q.vy-p.vy)*ny;if(vn<0){const j2=-1.92*vn/(1/p.m+1/q.m);p.vx-=j2*nx/p.m;p.vy-=j2*ny/p.m;q.vx+=j2*nx/q.m;q.vy+=j2*ny/q.m}}}
  for(let i=0;i<B.length;i++){const b=B[i];if(!b.on)continue;for(const[px,py]of PK)if((b.x-px)**2+(b.y-py)**2<PRAD*PRAD){b.on=0;if(i===0)sp=1;else pk.push(b.c)}}
  if(rec&&step%8===0&&fr.length<400)fr.push(B.map(b=>b.on?[+b.x.toFixed(1),+b.y.toFixed(1)]:0));
  if(!mv&&step>5)break}
 if(rec)fr.push(B.map(b=>b.on?[+b.x.toFixed(1),+b.y.toFixed(1)]:0));
 return{coins:B.slice(1).filter(b=>b.on).map(b=>({x:+b.x.toFixed(2),y:+b.y.toFixed(2),c:b.c})),pk,sp,fr}}
LOGIC.carrom={seats:2,
 init:()=>({coins:carromStart(),sc:[0,0],t:0,shots:0,last:null}),
 move(s,p,m,rec=true){if(s.t!==p||!m)return null;const x=Math.max(70,Math.min(330,+m.x||200)),sy=p?55:345;let a=+m.a;if(!isFinite(a))return null;
  const dir=p?Math.PI/2:-Math.PI/2;let da=Math.atan2(Math.sin(a-dir),Math.cos(a-dir));da=Math.max(-1.35,Math.min(1.35,da));a=dir+da;
  const pw=Math.max(.06,Math.min(1,+m.pw||0)),r=sim(s.coins,x,sy,a,pw,rec),sc=s.sc.slice(),mine=p?'b':'w';let own=0,q=0;
  for(const c of r.pk){if(c==='q'){sc[p]+=3;q=1}else if(c===mine){sc[p]++;own++}else sc[1-p]++}
  if(r.sp)sc[p]=Math.max(0,sc[p]-1);const extra=!r.sp&&(own>0||q);
  return{coins:r.coins,sc,t:extra?p:1-p,shots:s.shots+1,last:{p,pk:r.pk,foul:!!r.sp},anim:rec?{f:r.fr,col:s.coins.map(c=>c.c).join(''),sx:x,sy}:undefined}},
 result(s){const w=s.coins.some(c=>c.c==='w'),b=s.coins.some(c=>c.c==='b');if(w&&b&&s.shots<60)return null;
  return s.sc[0]>s.sc[1]?{w:0}:s.sc[1]>s.sc[0]?{w:1}:{draw:1}},
 bot(s,me,lvl){const N=[1,14,40][lvl],mine=me?'b':'w',sy=me?55:345,dir=me?Math.PI/2:-Math.PI/2,T=s.coins.filter(c=>c.c===mine||c.c==='q');
  const cand=()=>{const x=70+Math.random()*260;if(T.length&&Math.random()<.75){const t=T[Math.random()*T.length|0];return{x,a:Math.atan2(t.y-sy,t.x-x)+(Math.random()-.5)*.08,pw:.45+Math.random()*.55}}return{x,a:dir+(Math.random()-.5)*1.8,pw:.4+Math.random()*.6}};
  if(!lvl)return cand();let best=-1e9,pick=cand();
  for(let i=0;i<N;i++){const m=cand(),n=this.move(s,me,m,false);const v=(n.sc[me]-s.sc[me])-(n.sc[1-me]-s.sc[1-me])+(n.t===me?.6:0);if(v>best||(v===best&&Math.random()<.3)){best=v;pick=m}}return pick}};

function ab(g,s,me,d,al,be){const r=g.result(s);if(r)return r.w===me?1000+d:r.w===undefined?0:-1000-d;if(!d)return g.heur?g.heur(s,me):0;
 const max=s.t===me;let v=max?-1e9:1e9;
 for(const m of g.moves(s)){const x=ab(g,g.move(s,s.t,m),me,d-1,al,be);
  if(max){v=Math.max(v,x);al=Math.max(al,v)}else{v=Math.min(v,x);be=Math.min(be,v)}if(al>=be)break}
 return v}
function botMove(id,s,me,lvl,o){const g=LOGIC[id];if(g.bot)return g.bot(s,me,lvl,o||{});const mv=g.moves(s);if(!lvl)return mv[Math.random()*mv.length|0];
 let best=-1e9,pick=[];for(const m of mv){const x=ab(g,g.move(s,me,m),me,g.depth[lvl]-1,-1e9,1e9);if(x>best){best=x;pick=[m]}else if(x===best)pick.push(m)}
 return pick[Math.random()*pick.length|0]}
/* who is ahead when the match clock runs out: seat index, or -1 for a tie */
function adjudicate(id,s){const top=a=>{const m=Math.max(...a);return a.filter(x=>x===m).length>1?-1:a.indexOf(m)};
 if(id==='chess'){const v=LOGIC.chess.heur(s,0);return v>0?0:v<0?1:-1}
 if(id==='ludo')return top(s.pos.map(a=>a.reduce((x,r)=>x+Math.max(0,r+1),0)));
 if(id==='carrom')return top(s.sc);return -1}
const META={tictactoe:{seats:2,turn:20000,match:240000},connect4:{seats:2,turn:25000,match:300000},chess:{seats:2,turn:45000,match:720000},
 ludo:{seats:4,turn:25000,match:600000},carrom:{seats:2,turn:35000,match:600000}};
const API={LOGIC,botMove,adjudicate,META,sim};
if(NODE)module.exports=API;else root.GAMES=API;
})(typeof window!=='undefined'?window:globalThis);
