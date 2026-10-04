/* Score-attack games. Plug-in: {name,icon,col,init(rand),step(st,inp,dt),draw(ctx,st), optional touch: down/move/up}.
   st.sc = score, st.dead = game over, st.hp = lives (optional), st.tt = elapsed ms. Canvas units are 320x480.
   Touch handlers get canvas coordinates; press('l'|'r'|'u'|'d'|'a') feeds the same input as the keyboard. */
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const CL=(v,a,b)=>Math.max(a,Math.min(b,v));
const R=(c,col,x,y,w,h,r)=>{c.fillStyle=col;if(r&&c.roundRect){c.beginPath();c.roundRect(x,y,w,h,r);c.fill()}else c.fillRect(x,y,w,h)};
const GR=(c,a,b)=>{const g=c.createLinearGradient(0,0,0,480);g.addColorStop(0,a);g.addColorStop(1,b);c.fillStyle=g;c.fillRect(0,0,320,480)};
const TX=(c,t,x,y,s=18,col='#fff',al='left')=>{c.fillStyle=col;c.font=`800 ${s}px system-ui,sans-serif`;c.textAlign=al;c.fillText(t,x,y);c.textAlign='left'};
const CI=(c,col,x,y,r)=>{c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,7);c.fill()};
const HP=(c,n)=>TX(c,'❤️'.repeat(Math.max(0,n)),10,30,18);
/* tetris helpers */
const TP=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]],[[0,1,1],[1,1,0]],[[1,1,0],[0,1,1]]];
const TC=['','#4dd8ff','#ffd23f','#c58cff','#6b8bff','#ff9d4a','#5eead4','#ff6b8b'];
const tHit=(st,m,x,y)=>m.some((row,j)=>row.some((v,i)=>v&&(x+i<0||x+i>9||y+j>19||st.g[y+j][x+i])));
const tSpawn=st=>{const n=st.r()*7|0;st.p={m:TP[n],c:n+1,x:3,y:0};if(tHit(st,st.p.m,3,0))st.dead=1};
const tLock=st=>{const p=st.p;p.m.forEach((row,j)=>row.forEach((v,i)=>{if(v)st.g[p.y+j][p.x+i]=p.c}));
 const keep=st.g.filter(r=>r.some(v=>!v)),n=20-keep.length;st.g=[...Array.from({length:n},()=>Array(10).fill(0)),...keep];st.sc+=[0,100,300,500,800][n];tSpawn(st)};
const tMv=(st,d)=>{const q=st.p;if(!tHit(st,q.m,q.x+d,q.y))q.x+=d};
const tRot=st=>{const q=st.p,m=q.m[0].map((_,a)=>q.m.map(r=>r[a]).reverse());for(const k of[0,-1,1])if(!tHit(st,m,q.x+k,q.y)){q.m=m;q.x+=k;return}};
const tDrop=st=>{const q=st.p;while(!tHit(st,q.m,q.x,q.y+1))q.y++;tLock(st)};
const add2048=st=>{const e=st.b.map((v,i)=>v?-1:i).filter(i=>i>=0);if(e.length)st.b[e[st.r()*e.length|0]]=st.r()<.9?2:4};
const HOLE=(x,y)=>{for(let k=0;k<9;k++)if(Math.hypot(x-(60+100*(k%3)),y-(170+100*(k/3|0)))<46)return k;return-1};
function jetShape(c,x,y,col,down){const s=down?-1:1;c.fillStyle=col;c.beginPath();c.moveTo(x,y-18*s);c.lineTo(x+15,y+14*s);c.lineTo(x,y+7*s);c.lineTo(x-15,y+14*s);c.closePath();c.fill()}

const ARC={
snake:{name:'Snake',icon:'🐍',col:'#1f5a31',
 init(r){return{s:[[8,12],[7,12],[6,12]],d:[1,0],f:[3,3],t:0,sc:0,dead:0,r,ax:0,ay:0}},
 turn(st,dx,dy){if(Math.abs(dx)>Math.abs(dy)){if(dx>0&&st.d[0]!==-1)st.nd=[1,0];if(dx<0&&st.d[0]!==1)st.nd=[-1,0]}
  else{if(dy>0&&st.d[1]!==-1)st.nd=[0,1];if(dy<0&&st.d[1]!==1)st.nd=[0,-1]}},
 down(st,x,y){st.ax=x;st.ay=y},
 move(st,x,y){const dx=x-st.ax,dy=y-st.ay;if(Math.max(Math.abs(dx),Math.abs(dy))>14){this.turn(st,dx,dy);st.ax=x;st.ay=y}},
 step(st,i,dt){const p=i.p;if(p.l)this.turn(st,-1,0);if(p.r)this.turn(st,1,0);if(p.u)this.turn(st,0,-1);if(p.d)this.turn(st,0,1);
  st.t+=dt;if(st.t<Math.max(100,150-st.sc))return;st.t=0;if(st.nd)st.d=st.nd;
  const h=[st.s[0][0]+st.d[0],st.s[0][1]+st.d[1]];
  if(h[0]<0||h[1]<0||h[0]>15||h[1]>23||st.s.some(c=>c[0]===h[0]&&c[1]===h[1])){st.dead=1;return}
  st.s.unshift(h);if(h[0]===st.f[0]&&h[1]===st.f[1]){st.sc+=10;do{st.f=[st.r()*16|0,st.r()*24|0]}while(st.s.some(c=>c[0]===st.f[0]&&c[1]===st.f[1]))}else st.s.pop()},
 draw(c,st){for(let y=0;y<24;y++)for(let x=0;x<16;x++)R(c,(x+y)%2?'#1d5530':'#226338',x*20,y*20,20,20);
  CI(c,'#ff4d5e',st.f[0]*20+10,st.f[1]*20+11,8);R(c,'#7bd36b',st.f[0]*20+10,st.f[1]*20+1,5,4,2);
  st.s.forEach(([x,y],k)=>R(c,k?`hsl(${140-k*2},60%,${52-Math.min(k,12)}%)`:'#c8ff7a',x*20+1,y*20+1,18,18,k?6:9));
  const[hx,hy]=st.s[0];CI(c,'#102',hx*20+7,hy*20+8,2.2);CI(c,'#102',hx*20+13,hy*20+8,2.2);TX(c,st.sc,160,38,30,'#fff','center')}},

jet:{name:'Fighter Jet',icon:'✈️',col:'#16206b',
 init(r){return{x:160,b:[],e:[],cd:0,sp:0,sc:0,hp:3,inv:0,dead:0,r,stars:Array.from({length:45},()=>[r()*320,r()*480,.4+r()*1.4])}},
 down(st,x){st.tx=x},move(st,x){st.tx=x},
 step(st,i,dt){const k=dt/16;if(i.h.l)st.tx=st.x-70;if(i.h.r)st.tx=st.x+70;
  if(st.tx!=null)st.x+=(st.tx-st.x)*Math.min(1,.3*k);st.x=CL(st.x,16,304);
  st.inv-=dt;st.cd-=dt;if(st.cd<=0){st.b.push([st.x,415]);st.cd=190}
  st.sp-=dt;if(st.sp<=0){st.e.push([20+st.r()*280,-20]);st.sp=Math.max(320,850-st.sc*3)}
  st.b.forEach(b=>b[1]-=9*k);st.e.forEach(e=>e[1]+=(1.8+st.sc/180)*k);st.b=st.b.filter(b=>b[1]>-10);
  for(const e of st.e)for(const b of st.b)if(!e.h&&Math.abs(e[0]-b[0])<17&&Math.abs(e[1]-b[1])<17){e.h=1;b[1]=-99;st.sc+=10}
  st.e=st.e.filter(e=>{if(e.h)return false;if(e[1]>500){st.hp--;return false}
   if(st.inv<=0&&Math.abs(e[0]-st.x)<20&&Math.abs(e[1]-430)<20){st.hp--;st.inv=900;return false}return true});
  if(st.hp<=0)st.dead=1},
 draw(c,st){GR(c,'#050a24','#1b2a80');st.stars.forEach(([x,y,s])=>R(c,'rgba(255,255,255,.7)',x,(y+st.tt*.03*s*3)%480,s,s));
  c.fillStyle='#ffd23f';st.b.forEach(b=>c.fillRect(b[0]-2,b[1],4,12));st.e.forEach(e=>jetShape(c,e[0],e[1],'#ff4d5e',1));
  if(st.inv<=0||(st.tt/80|0)%2)jetShape(c,st.x,430,'#7fe3ff');HP(c,st.hp);TX(c,st.sc,310,30,26,'#fff','right')}},

tetris:{name:'Tetris',icon:'🧱',col:'#3a1f6b',
 init(r){const st={g:Array.from({length:20},()=>Array(10).fill(0)),t:0,sc:0,dead:0,r};tSpawn(st);return st},
 down(st,x,y){st.ax=x;st.ay=y;st.mv=0;st.soft=0},
 move(st,x,y){while(x-st.ax>=22){tMv(st,1);st.ax+=22;st.mv=1}while(st.ax-x>=22){tMv(st,-1);st.ax-=22;st.mv=1}st.soft=y-st.ay>45},
 up(st,x,y,dx,dy,dt){st.soft=0;if(!st.mv&&Math.abs(dx)<12&&Math.abs(dy)<12&&dt<350)tRot(st);else if(dy>80&&Math.abs(dx)<45&&dt<450)tDrop(st)},
 step(st,i,dt){const q=st.p,p=i.p;if(p.l)tMv(st,-1);if(p.r)tMv(st,1);if(p.u)tRot(st);if(p.a){tDrop(st);return}
  st.t+=dt+(i.h.d||st.soft?70:0);if(st.t>Math.max(90,700-st.sc/4)){st.t=0;if(!tHit(st,q.m,q.x,q.y+1))q.y++;else tLock(st)}},
 draw(c,st){GR(c,'#1a0b36','#341a63');R(c,'rgba(0,0,0,.35)',40,0,240,480);c.strokeStyle='rgba(255,255,255,.06)';
  for(let i=0;i<=10;i++){c.beginPath();c.moveTo(40+i*24,0);c.lineTo(40+i*24,480);c.stroke()}
  const cell=(x,y,col)=>{R(c,col,40+x*24+1,y*24+1,22,22,5);R(c,'rgba(255,255,255,.25)',40+x*24+3,y*24+3,18,5,3)};
  st.g.forEach((row,j)=>row.forEach((v,i)=>v&&cell(i,j,TC[v])));const q=st.p;q.m.forEach((row,j)=>row.forEach((v,i)=>v&&cell(q.x+i,q.y+j,TC[q.c])));
  TX(c,st.sc,8,30,24,'#fff')}},

g2048:{name:'2048',icon:'🔢',col:'#d9c8ad',
 init(r){const st={b:Array(16).fill(0),sc:0,dead:0,r};add2048(st);add2048(st);return st},
 up(st,x,y,dx,dy,dt,press){if(Math.max(Math.abs(dx),Math.abs(dy))>24)press(Math.abs(dx)>Math.abs(dy)?(dx>0?'r':'l'):(dy>0?'d':'u'))},
 step(st,i){const p=i.p,d=p.l?0:p.r?1:p.u?2:p.d?3:-1;if(d<0)return;let moved=0;
  for(let k=0;k<4;k++){const idx=[0,1,2,3].map(j=>d<2?k*4+(d?3-j:j):(d===2?j:3-j)*4+k);
   const v=idx.map(q=>st.b[q]).filter(Boolean);for(let j=0;j<v.length-1;j++)if(v[j]===v[j+1]){v[j]*=2;st.sc+=v[j];v.splice(j+1,1)}
   while(v.length<4)v.push(0);idx.forEach((q,j)=>{if(st.b[q]!==v[j]){moved=1;st.b[q]=v[j]}})}
  if(moved)add2048(st);const b=st.b;if(!b.includes(0)&&!b.some((v,q)=>(q%4<3&&v===b[q+1])||(q<12&&v===b[q+4])))st.dead=1},
 draw(c,st){R(c,'#f4ead8',0,0,320,480);TX(c,'2048',16,52,34,'#6b5338');TX(c,st.sc,304,52,26,'#6b5338','right');R(c,'#cdb995',8,90,304,304,14);
  st.b.forEach((v,q)=>{const x=16+(q%4)*74,y=98+(q/4|0)*74,l=v?Math.log2(v):0;R(c,v?`hsl(${(260-l*18+360)%360},55%,${80-l*2.5}%)`:'#dfcfb0',x,y,68,68,10);
   if(v)TX(c,v,x+34,y+43,v>999?22:v>99?28:34,l<3?'#5a4630':'#fff','center')})}},

flappy:{name:'Flappy',icon:'🐤',col:'#4fc3e8',
 init(r){return{y:240,v:0,p:[[340,r()*220+110]],sc:0,hp:3,inv:0,dead:0,r}},
 down(st,x,y,press){press('a')},
 step(st,i,dt){const k=dt/16;st.inv-=dt;if(i.p.a||i.p.u)st.v=-7;st.v+=.45*k;st.y+=st.v*k;
  st.p.forEach(p=>{p[0]-=2.4*k;if(!p.s&&p[0]<0){p.s=1;st.sc++}});
  if(st.p[st.p.length-1][0]<170)st.p.push([340,st.r()*220+110]);st.p=st.p.filter(p=>p[0]>-60);
  const hit=st.y<8||st.y>440||st.p.some(p=>p[0]<72&&p[0]>-2&&(st.y<p[1]-60||st.y>p[1]+60));
  if(hit&&st.inv<=0){st.hp--;st.inv=1300;const n=st.p.find(p=>p[0]>-2);st.y=n?n[1]:240;st.v=0;if(st.hp<=0)st.dead=1}},
 draw(c,st){GR(c,'#5fd0f4','#c7f0ff');for(let i=0;i<4;i++){const x=((i*140-st.tt*.03*(1+i%2))%520+520)%520-100;CI(c,'rgba(255,255,255,.8)',x,70+i*55,26);CI(c,'rgba(255,255,255,.8)',x+24,78+i*55,20)}
  st.p.forEach(p=>{R(c,'#3fae4c',p[0],0,50,p[1]-60);R(c,'#2f8a3b',p[0]-4,p[1]-78,58,18,4);R(c,'#3fae4c',p[0],p[1]+60,50,480);R(c,'#2f8a3b',p[0]-4,p[1]+60,58,18,4)});
  R(c,'#d9b45a',0,452,320,28);R(c,'#7ac74f',0,452,320,8);
  if(st.inv<=0||(st.tt/90|0)%2){CI(c,'#ffd23f',60,st.y,14);CI(c,'#fff',66,st.y-4,5);CI(c,'#111',68,st.y-4,2);c.fillStyle='#ff8a3d';c.beginPath();c.moveTo(72,st.y);c.lineTo(84,st.y+3);c.lineTo(72,st.y+7);c.fill()}
  TX(c,st.sc,160,60,44,'#fff','center');HP(c,st.hp)}},

breakout:{name:'Breakout',icon:'🏓',col:'#2a1250',
 init(r){const st={px:160,bx:160,by:420,vx:0,vy:0,br:[],sc:0,hp:3,dead:0,r,lv:0};this.wave(st);return st},
 wave(st){st.br=[];for(let j=0;j<5;j++)for(let i=0;i<8;i++)st.br.push([8+i*38,70+j*20,1,j]);this.serve(st)},
 serve(st){st.bx=st.px;st.by=420;const a=st.r()*.9-.45,s=4+st.lv*.6;st.vx=s*Math.sin(a);st.vy=-s*Math.cos(a);st.wait=500},
 down(st,x){st.ptx=x},move(st,x){st.ptx=x},
 step(st,i,dt){const k=dt/16;if(i.h.l)st.ptx=st.px-70;if(i.h.r)st.ptx=st.px+70;if(st.ptx!=null)st.px+=(st.ptx-st.px)*Math.min(1,.4*k);st.px=CL(st.px,32,288);
  if(st.wait>0){st.wait-=dt;st.bx=st.px;return}
  st.bx+=st.vx*k;st.by+=st.vy*k;if(st.bx<6||st.bx>314)st.vx*=-1;if(st.by<6)st.vy=Math.abs(st.vy);
  if(st.vy>0&&st.by>=438&&st.by<=452&&Math.abs(st.bx-st.px)<38){const s=Math.hypot(st.vx,st.vy);st.vx=(st.bx-st.px)/38*s*.85;st.vy=-Math.sqrt(Math.max(s*s-st.vx*st.vx,4))}
  for(const b of st.br)if(b[2]&&st.bx>b[0]-5&&st.bx<b[0]+39&&st.by>b[1]-5&&st.by<b[1]+17){b[2]=0;st.vy*=-1;st.sc+=10;break}
  if(!st.br.some(b=>b[2])){st.lv++;st.sc+=50;this.wave(st)}
  if(st.by>490){st.hp--;if(st.hp<=0)st.dead=1;else this.serve(st)}},
 draw(c,st){GR(c,'#12062b','#3a1a6e');st.br.forEach(b=>b[2]&&R(c,`hsl(${b[3]*55+300},90%,62%)`,b[0],b[1],34,16,4));
  R(c,'#7fe3ff',st.px-32,444,64,10,5);CI(c,'#fff',st.bx,st.by,6);HP(c,st.hp);TX(c,st.sc,310,30,26,'#fff','right')}},

dodge:{name:'Dodge',icon:'☄️',col:'#5a1d10',
 init(r){return{x:160,y:400,rk:[],sp:0,sc:0,hp:3,inv:0,ms:0,dead:0,r}},
 down(st,x,y){st.tx=x;st.ty=y-50},move(st,x,y){st.tx=x;st.ty=y-50},
 step(st,i,dt){const k=dt/16;if(i.h.l)st.tx=st.x-90;if(i.h.r)st.tx=st.x+90;if(i.h.u)st.ty=st.y-90;if(i.h.d)st.ty=st.y+90;
  if(st.tx!=null){st.x+=(st.tx-st.x)*Math.min(1,.35*k);st.y+=(st.ty-st.y)*Math.min(1,.35*k)}
  st.x=CL(st.x,14,306);st.y=CL(st.y,180,455);st.inv-=dt;st.ms+=dt;st.sc=Math.floor(st.ms/100);
  st.sp-=dt;if(st.sp<=0){st.rk.push([14+st.r()*292,-20,10+st.r()*12,2+st.r()*2+st.ms/9000]);st.sp=Math.max(150,600-st.ms/40)}
  st.rk.forEach(o=>o[1]+=o[3]*k);st.rk=st.rk.filter(o=>o[1]<510);
  for(const o of st.rk)if(st.inv<=0&&Math.hypot(o[0]-st.x,o[1]-st.y)<o[2]+9){st.hp--;st.inv=1000;o[1]=999;if(st.hp<=0)st.dead=1}},
 draw(c,st){GR(c,'#2a0b06','#8a2c10');for(let i=0;i<6;i++)R(c,'rgba(255,160,60,.07)',0,i*90+(st.tt*.1)%90,320,30);
  st.rk.forEach(o=>{CI(c,'#6b5a50',o[0],o[1],o[2]);CI(c,'#4a3c35',o[0]-o[2]/3,o[1]-o[2]/4,o[2]/4);CI(c,'#4a3c35',o[0]+o[2]/3,o[1]+o[2]/3,o[2]/5)});
  if(st.inv<=0||(st.tt/80|0)%2){CI(c,'#7fe3ff',st.x,st.y,11);CI(c,'#fff',st.x-3,st.y-3,4)}HP(c,st.hp);TX(c,st.sc,310,30,26,'#fff','right')}},

whack:{name:'Whack-a-Mole',icon:'🔨',col:'#2f5a22',
 init(r){return{m:Array(9).fill(0),hit:Array(9).fill(0),sp:300,left:30000,sc:0,dead:0,r}},
 down(st,x,y){const i=HOLE(x,y);if(i>=0&&st.m[i]>0){st.m[i]=0;st.hit[i]=250;st.sc+=10}},
 step(st,i,dt){st.left-=dt;if(st.left<=0){st.dead=1;return}st.m=st.m.map(v=>Math.max(0,v-dt));st.hit=st.hit.map(v=>Math.max(0,v-dt));
  st.sp-=dt;if(st.sp<=0){const e=st.m.map((v,k)=>v?-1:k).filter(k=>k>=0);if(e.length)st.m[e[st.r()*e.length|0]]=Math.max(520,1100-st.sc*3);st.sp=Math.max(230,600-st.sc*2)}},
 draw(c,st){GR(c,'#6fcf5a','#2f7a2a');for(let i=0;i<8;i++)R(c,'rgba(0,0,0,.05)',0,i*60,320,30);
  TX(c,Math.ceil(Math.max(0,st.left)/1000)+'s',16,40,28,'#fff');TX(c,st.sc,304,40,28,'#fff','right');
  for(let k=0;k<9;k++){const x=60+100*(k%3),y=170+100*(k/3|0);c.fillStyle='#3b2412';c.beginPath();c.ellipse(x,y+22,42,17,0,0,7);c.fill();
   if(st.m[k]>0||st.hit[k]>0){const up=st.m[k]>0?Math.min(1,st.m[k]/160):0;CI(c,st.hit[k]>0?'#ffd23f':'#a8693a',x,y+14-up*10-(st.hit[k]>0?0:0),26);CI(c,'#111',x-9,y+6-up*10,3.5);CI(c,'#111',x+9,y+6-up*10,3.5);CI(c,'#ff9a9a',x,y+18-up*10,6)}
   c.fillStyle='#3b2412';c.beginPath();c.ellipse(x,y+27,42,12,0,0,Math.PI);c.fill()}}},

stack:{name:'Stack',icon:'🏗️',col:'#27346f',
 init(r){return{bl:[{x:100,w:120}],x:0,w:120,d:1,sp:2.2,sc:0,dead:0,r}},
 down(st,x,y,press){press('a')},
 step(st,i,dt){const k=dt/16;st.x+=st.d*st.sp*k;if(st.x<0){st.x=0;st.d=1}if(st.x+st.w>320){st.x=320-st.w;st.d=-1}
  if(i.p.a){const t=st.bl[st.bl.length-1],l=Math.max(st.x,t.x),rr=Math.min(st.x+st.w,t.x+t.w),ov=rr-l;if(ov<=0){st.dead=1;return}
   if(Math.abs(st.x-t.x)<5){st.bl.push({x:t.x,w:t.w});st.sc+=3}else{st.bl.push({x:l,w:ov});st.w=ov;st.sc+=1}
   st.sp=Math.min(6,2.2+st.bl.length*.08);st.x=st.d>0?0:320-st.w}},
 draw(c,st){const n=st.bl.length,off=Math.max(0,n-12);GR(c,`hsl(${(230+n*6)%360},60%,22%)`,`hsl(${(260+n*6)%360},70%,45%)`);
  st.bl.forEach((b,j)=>R(c,`hsl(${(j*14+200)%360},75%,60%)`,b.x,420-(j-off)*24,b.w,22,4));
  R(c,`hsl(${(n*14+200)%360},75%,70%)`,st.x,420-(n-off)*24,st.w,22,4);TX(c,st.sc,160,60,44,'#fff','center')}}
};
