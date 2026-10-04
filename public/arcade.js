/* Score-attack games: each player plays solo (same seed in a battle), higher score wins.
   Plug-in: {name,icon,init(rand),step(st,inp,dt),draw(ctx,st)}; st.sc = score, st.dead = game over.
   inp.h = held keys, inp.p = keys pressed this frame (l r u d a). Canvas is 320x480. */
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const BG=c=>{c.fillStyle='#0b222a';c.fillRect(0,0,320,480)};
const TXT=(c,t,x,y,s=18,col='#f4efe2')=>{c.fillStyle=col;c.font=`bold ${s}px system-ui`;c.fillText(t,x,y)};
const TP=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]],[[0,1,1],[1,1,0]],[[1,1,0],[0,1,1]]];
const TC=['','#62d2ff','#f2c230','#c58cff','#6b8bff','#ff9d4a','#7fe0b0','#ff6b8b'];
const thit=(st,m,x,y)=>m.some((row,j)=>row.some((v,i)=>v&&(x+i<0||x+i>9||y+j>19||st.g[y+j][x+i])));
const tspawn=st=>{const n=st.r()*7|0;st.p={m:TP[n],c:n+1,x:3,y:0};if(thit(st,st.p.m,3,0))st.dead=1};
const tlock=st=>{const p=st.p;p.m.forEach((row,j)=>row.forEach((v,i)=>{if(v)st.g[p.y+j][p.x+i]=p.c}));
 const keep=st.g.filter(r=>r.some(v=>!v)),n=20-keep.length;st.g=[...Array.from({length:n},()=>Array(10).fill(0)),...keep];st.sc+=[0,100,300,500,800][n];tspawn(st)};
const add2048=st=>{const e=st.b.map((v,i)=>v?-1:i).filter(i=>i>=0);if(e.length)st.b[e[st.r()*e.length|0]]=st.r()<.9?2:4};

const ARC={
snake:{name:'Snake',icon:'🐍',
 init(r){return{s:[[8,12],[7,12],[6,12]],d:[1,0],f:[3,3],t:0,sc:0,dead:0,r}},
 step(st,i,dt){const p=i.p;if(p.l&&st.d[0]!==1)st.nd=[-1,0];if(p.r&&st.d[0]!==-1)st.nd=[1,0];if(p.u&&st.d[1]!==1)st.nd=[0,-1];if(p.d&&st.d[1]!==-1)st.nd=[0,1];
  st.t+=dt;if(st.t<110)return;st.t=0;if(st.nd)st.d=st.nd;
  const h=[st.s[0][0]+st.d[0],st.s[0][1]+st.d[1]];
  if(h[0]<0||h[1]<0||h[0]>15||h[1]>23||st.s.some(c=>c[0]===h[0]&&c[1]===h[1])){st.dead=1;return}
  st.s.unshift(h);if(h[0]===st.f[0]&&h[1]===st.f[1]){st.sc+=10;st.f=[st.r()*16|0,st.r()*24|0]}else st.s.pop()},
 draw(c,st){BG(c);c.fillStyle='#f2c230';c.fillRect(st.f[0]*20+3,st.f[1]*20+3,14,14);c.fillStyle='#7fe0b0';st.s.forEach(([x,y])=>c.fillRect(x*20+1,y*20+1,18,18))}},

jet:{name:'Fighter Jet',icon:'✈️',
 init(r){return{x:160,b:[],e:[],cd:0,sp:0,sc:0,hp:3,dead:0,r}},
 step(st,i,dt){const k=dt/16;if(i.h.l)st.x-=5*k;if(i.h.r)st.x+=5*k;st.x=Math.max(14,Math.min(306,st.x));
  st.cd-=dt;if((i.h.a||i.h.u)&&st.cd<=0){st.b.push([st.x,440]);st.cd=220}
  st.sp-=dt;if(st.sp<=0){st.e.push([20+st.r()*280,-20]);st.sp=Math.max(350,900-st.sc*4)}
  st.b.forEach(b=>b[1]-=9*k);st.e.forEach(e=>e[1]+=(2+st.sc/150)*k);st.b=st.b.filter(b=>b[1]>-10);
  for(const e of st.e)for(const b of st.b)if(!e.hit&&Math.abs(e[0]-b[0])<16&&Math.abs(e[1]-b[1])<16){e.hit=1;b[1]=-99;st.sc+=10}
  st.e=st.e.filter(e=>{if(e.hit)return false;if(e[1]>490||(Math.abs(e[0]-st.x)<18&&e[1]>430)){st.hp--;return false}return true});
  if(st.hp<=0)st.dead=1},
 draw(c,st){BG(c);c.font='28px serif';c.fillText('✈️',st.x-14,475);st.e.forEach(e=>c.fillText('👾',e[0]-14,e[1]));
  c.fillStyle='#f2c230';st.b.forEach(b=>c.fillRect(b[0]-2,b[1],4,12));TXT(c,'♥'.repeat(Math.max(0,st.hp)),10,24,18,'#ff6b8b')}},

tetris:{name:'Tetris',icon:'🧱',
 init(r){const st={g:Array.from({length:20},()=>Array(10).fill(0)),t:0,sc:0,dead:0,r};tspawn(st);return st},
 step(st,i,dt){const q=st.p,p=i.p;
  if(p.l&&!thit(st,q.m,q.x-1,q.y))q.x--;if(p.r&&!thit(st,q.m,q.x+1,q.y))q.x++;
  if(p.u){const m=q.m[0].map((_,a)=>q.m.map(r=>r[a]).reverse());if(!thit(st,m,q.x,q.y))q.m=m}
  if(p.a){while(!thit(st,q.m,q.x,q.y+1))q.y++;tlock(st);return}
  st.t+=dt+(i.h.d?60:0);if(st.t>Math.max(100,700-st.sc/5)){st.t=0;if(!thit(st,q.m,q.x,q.y+1))q.y++;else tlock(st)}},
 draw(c,st){BG(c);c.fillStyle='#12303a';c.fillRect(40,0,240,480);
  st.g.forEach((row,j)=>row.forEach((v,i)=>{if(v){c.fillStyle=TC[v];c.fillRect(40+i*24+1,j*24+1,22,22)}}));
  const q=st.p;c.fillStyle=TC[q.c];q.m.forEach((row,j)=>row.forEach((v,i)=>v&&c.fillRect(40+(q.x+i)*24+1,(q.y+j)*24+1,22,22)));TXT(c,st.sc,6,24)}},

g2048:{name:'2048',icon:'🔢',
 init(r){const st={b:Array(16).fill(0),sc:0,dead:0,r};add2048(st);add2048(st);return st},
 step(st,i){const p=i.p,d=p.l?0:p.r?1:p.u?2:p.d?3:-1;if(d<0)return;let moved=0;
  for(let k=0;k<4;k++){const idx=[0,1,2,3].map(j=>d<2?k*4+(d?3-j:j):(d===2?j:3-j)*4+k);
   const v=idx.map(q=>st.b[q]).filter(Boolean);for(let j=0;j<v.length-1;j++)if(v[j]===v[j+1]){v[j]*=2;st.sc+=v[j];v.splice(j+1,1)}
   while(v.length<4)v.push(0);idx.forEach((q,j)=>{if(st.b[q]!==v[j]){moved=1;st.b[q]=v[j]}})}
  if(moved)add2048(st);
  const b=st.b;if(!b.includes(0)&&!b.some((v,q)=>(q%4<3&&v===b[q+1])||(q<12&&v===b[q+4])))st.dead=1},
 draw(c,st){BG(c);TXT(c,'Score '+st.sc,16,50,24);st.b.forEach((v,q)=>{const x=16+(q%4)*72,y=90+(q/4|0)*72;
  c.fillStyle=v?`hsl(${200-Math.log2(v)*16},60%,${70-Math.log2(v)*3}%)`:'#1b4653';c.fillRect(x,y,66,66);
  if(v)TXT(c,v,x+(v>999?6:v>99?12:v>9?19:26),y+42,v>999?20:26,'#0b222a')})}},

flappy:{name:'Flappy',icon:'🐤',
 init(r){return{y:240,v:0,p:[[340,r()*240+100]],sc:0,dead:0,r}},
 step(st,i,dt){const k=dt/16;if(i.p.a||i.p.u)st.v=-7;st.v+=.45*k;st.y+=st.v*k;
  st.p.forEach(p=>{p[0]-=2.4*k;if(!p.s&&p[0]<0){p.s=1;st.sc++}});
  if(st.p[st.p.length-1][0]<170)st.p.push([340,st.r()*240+100]);st.p=st.p.filter(p=>p[0]>-60);
  if(st.y<0||st.y>470||st.p.some(p=>p[0]<72&&p[0]>-2&&(st.y<p[1]-60||st.y>p[1]+60)))st.dead=1},
 draw(c,st){BG(c);c.fillStyle='#7fe0b0';st.p.forEach(p=>{c.fillRect(p[0],0,50,p[1]-60);c.fillRect(p[0],p[1]+60,50,480)});
  c.font='28px serif';c.fillText('🐤',46,st.y+12);TXT(c,st.sc,150,50,32)}}
};
