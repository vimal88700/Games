/* More score-attack games (same plug-in format as arcade.js). */
const FR=['🍎','🍊','🍌','🍇','🍓'];
const EM=(c,e,x,y,s=28)=>{c.font=`${s}px serif`;c.textAlign='center';c.fillText(e,x,y+s/3);c.textAlign='left'};
Object.assign(ARC,{
catch:{name:'Fruit Catch',icon:'🍎',col:'#8a3a22',
 init(r){return{x:160,it:[],sp:0,sc:0,hp:3,dead:0,r}},
 down(st,x){st.tx=x},move(st,x){st.tx=x},
 step(st,i,dt){const k=dt/16;if(i.h.l)st.tx=st.x-90;if(i.h.r)st.tx=st.x+90;if(st.tx!=null)st.x+=(st.tx-st.x)*Math.min(1,.4*k);st.x=CL(st.x,36,284);
  st.sp-=dt;if(st.sp<=0){st.it.push([20+st.r()*280,-20,st.r()<.22?1:0,2+st.r()*1.6+st.sc/220,FR[st.r()*5|0]]);st.sp=Math.max(280,750-st.sc*2)}
  st.it.forEach(o=>o[1]+=o[3]*k);
  st.it=st.it.filter(o=>{if(o[1]>420&&o[1]<462&&Math.abs(o[0]-st.x)<40){if(o[2]){if(--st.hp<=0)st.dead=1}else st.sc+=10;return false}
   if(o[1]>490){if(!o[2]&&--st.hp<=0)st.dead=1;return false}return true})},
 draw(c,st){GR(c,'#ffb26b','#7a2e4d');CI(c,'rgba(255,240,170,.9)',250,110,38);R(c,'#5a3a22',0,462,320,18);
  st.it.forEach(o=>EM(c,o[2]?'💣':o[4],o[0],o[1]));R(c,'#9b6a36',st.x-38,440,76,26,10);R(c,'#c58a4a',st.x-42,434,84,10,5);HP(c,st.hp);TX(c,st.sc,310,30,26,'#fff','right')}},

runner:{name:'Runner',icon:'🏃',col:'#3a2a6b',
 init(r){return{y:0,v:0,ob:[],d:0,sc:0,dead:0,r,sp:4,nx:80}},
 down(st,x,y,press){press('a')},
 step(st,i,dt){const k=dt/16;st.d+=st.sp*k;st.sc=Math.floor(st.d/10);st.sp=Math.min(10,4+st.sc/90);
  if((i.p.a||i.p.u)&&st.y===0)st.v=11;if(st.y>0||st.v>0){st.y+=st.v*k;st.v-=.6*k;if(st.y<=0){st.y=0;st.v=0}}
  st.nx-=st.sp*k;if(st.nx<=0){st.ob.push([340,16+st.r()*22,22+st.r()*28]);st.nx=Math.max(70,150+st.r()*170-st.sc/4)}
  st.ob.forEach(o=>o[0]-=st.sp*k);st.ob=st.ob.filter(o=>o[0]>-50);
  for(const o of st.ob)if(o[0]<86&&o[0]+o[1]>58&&st.y<o[2]-2)st.dead=1},
 draw(c,st){GR(c,'#140a33','#3a2a6b');for(let i=0;i<6;i++)R(c,'#241a52',((i*90-st.d*.3)%540+540)%540-60,290-(i%3)*30,60,110,4);
  R(c,'#1b1340',0,400,320,80);for(let i=0;i<8;i++)R(c,'#3a2a6b',((i*50-st.d)%400+400)%400-40,430,26,4);
  st.ob.forEach(o=>R(c,'#ff5d73',o[0],400-o[2],o[1],o[2],4));const y=400-st.y;R(c,'#7fe3ff',58,y-30,28,30,7);CI(c,'#102',78,y-20,3);TX(c,st.sc,160,50,40,'#fff','center')}},

bubble:{name:'Bubble Pop',icon:'🫧',col:'#1f6f8b',
 init(r){return{b:[],sp:0,sc:0,hp:3,dead:0,r}},
 down(st,x,y){for(let k=st.b.length-1;k>=0;k--){const o=st.b[k];if(Math.hypot(o[0]-x,o[1]-y)<o[2]+10){st.b.splice(k,1);st.sc+=10;return}}},
 step(st,i,dt){const k=dt/16;st.sp-=dt;if(st.sp<=0){st.b.push([30+st.r()*260,500,20+st.r()*16,1.2+st.r()*1.2+st.sc/300]);st.sp=Math.max(260,800-st.sc*2.5)}
  st.b.forEach(o=>o[1]-=o[3]*k);st.b=st.b.filter(o=>{if(o[1]<-40){if(--st.hp<=0)st.dead=1;return false}return true})},
 draw(c,st){GR(c,'#0d3b66','#25b5d6');st.b.forEach(o=>{CI(c,'rgba(255,255,255,.22)',o[0],o[1],o[2]);c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=2;c.beginPath();c.arc(o[0],o[1],o[2],0,7);c.stroke();CI(c,'rgba(255,255,255,.8)',o[0]-o[2]/3,o[1]-o[2]/3,o[2]/5)});HP(c,st.hp);TX(c,st.sc,310,30,26,'#fff','right')}},

pong:{name:'Pong Rally',icon:'🏸',col:'#0f4d4d',
 init(r){return{px:160,bx:160,by:160,vx:2.6,vy:3.4,sc:0,hp:3,dead:0,r}},
 down(st,x){st.ptx=x},move(st,x){st.ptx=x},
 step(st,i,dt){const k=dt/16;if(i.h.l)st.ptx=st.px-80;if(i.h.r)st.ptx=st.px+80;if(st.ptx!=null)st.px+=(st.ptx-st.px)*Math.min(1,.4*k);st.px=CL(st.px,40,280);
  st.bx+=st.vx*k;st.by+=st.vy*k;if(st.bx<8||st.bx>312){st.vx*=-1;st.bx=CL(st.bx,8,312)}if(st.by<8){st.vy=Math.abs(st.vy);st.by=8}
  if(st.vy>0&&st.by>=436&&st.by<=452&&Math.abs(st.bx-st.px)<46){st.vy=-Math.min(10,Math.abs(st.vy)*1.05);st.vx=(st.bx-st.px)/46*6;st.sc+=5}
  if(st.by>490){if(--st.hp<=0)st.dead=1;else{st.bx=160;st.by=160;st.vx=2.6;st.vy=3.4}}},
 draw(c,st){GR(c,'#073434','#0f6a62');c.fillStyle='rgba(255,255,255,.15)';for(let y=10;y<480;y+=30)c.fillRect(158,y,4,14);
  R(c,'#ffd23f',st.px-40,444,80,10,5);CI(c,'#fff',st.bx,st.by,7);HP(c,st.hp);TX(c,st.sc,310,30,26,'#fff','right')}},

taprush:{name:'Number Rush',icon:'🔢',col:'#2b4a8f',
 init(r){const st={n:[],next:1,left:30000,sc:0,dead:0,r};this.fill(st);return st},
 fill(st){const a=[...Array(16).keys()].map(x=>x+1);for(let i=15;i>0;i--){const j=st.r()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}st.n=a;st.next=1},
 down(st,x,y){const c=Math.floor((x-16)/74),r=Math.floor((y-120)/74);if(c<0||c>3||r<0||r>3)return;const v=st.n[r*4+c];
  if(v===st.next){st.sc+=10;st.next++;if(st.next>16){st.sc+=50;st.left+=3000;this.fill(st)}}else st.left-=1000},
 step(st,i,dt){st.left-=dt;if(st.left<=0)st.dead=1},
 draw(c,st){GR(c,'#16224d','#2b4a8f');TX(c,Math.ceil(Math.max(0,st.left)/1000)+'s',16,50,30,'#fff');TX(c,st.sc,304,50,30,'#fff','right');TX(c,'Tap '+Math.min(st.next,16),160,95,22,'#ffd23f','center');
  st.n.forEach((v,q)=>{const x=16+(q%4)*74,y=120+(q/4|0)*74;R(c,v<st.next?'rgba(255,255,255,.08)':`hsl(${v*22},65%,58%)`,x,y,68,68,12);if(v>=st.next)TX(c,v,x+34,y+44,30,'#fff','center')})}},

simon:{name:'Simon',icon:'🎵',col:'#3a2a63',
 init(r){const st={seq:[],ph:'show',t:0,lit:-1,lt:0,pi:0,sc:0,dead:0,r};this.grow(st);return st},
 grow(st){st.seq.push(st.r()*4|0);st.ph='show';st.t=-500;st.pi=0},
 down(st,x,y){if(st.ph!=='in'||y<100||y>430)return;const q=(y<265?0:2)+(x<160?0:1);st.lit=q;st.lt=220;
  if(q===st.seq[st.pi]){if(++st.pi===st.seq.length){st.sc=st.seq.length*10;st.ph='wait';st.t=0}}else st.dead=1},
 step(st,i,dt){if(st.lt>0&&(st.lt-=dt)<=0)st.lit=-1;
  if(st.ph==='show'){st.t+=dt;if(st.t>=0){const q=Math.floor(st.t/600);if(q>=st.seq.length){st.ph='in';st.lit=-1}else st.lit=st.t%600<420?st.seq[q]:-1}}
  else if(st.ph==='wait'){st.t+=dt;if(st.t>600)this.grow(st)}},
 draw(c,st){GR(c,'#1d1240','#3a2a63');const C=['#ff5d73','#4dc3ff','#5eead4','#ffd23f'];
  for(let q=0;q<4;q++){const x=10+(q%2)*160,y=110+(q>>1)*160;R(c,C[q],x,y,140,140,22);if(st.lit!==q)R(c,'rgba(10,5,30,.55)',x,y,140,140,22)}
  TX(c,st.sc,160,60,40,'#fff','center');TX(c,st.ph==='in'?'Your turn':st.ph==='show'?'Watch…':'Nice!',160,95,18,'#ffd23f','center')}},

memory:{name:'Memory',icon:'🃏',col:'#2b2f6b',
 init(r){const e=['🐶','🐱','🦊','🐼','🐸','🦁','🐙','🦄'],d=[...e,...e];for(let i=15;i>0;i--){const j=r()*(i+1)|0;[d[i],d[j]]=[d[j],d[i]]}
  return{c:d,f:Array(16).fill(0),open:[],lock:0,ms:0,miss:0,pairs:0,sc:0,dead:0,r}},
 down(st,x,y){if(st.lock>0)return;const c=Math.floor((x-16)/74),r=Math.floor((y-110)/74);if(c<0||c>3||r<0||r>3)return;const q=r*4+c;if(st.f[q])return;
  st.f[q]=1;st.open.push(q);if(st.open.length===2){const[a,b]=st.open;if(st.c[a]===st.c[b]){st.f[a]=st.f[b]=2;st.open=[];st.pairs++;
    if(st.pairs===8){st.bonus=Math.max(0,300-Math.floor(st.ms/1000)*5);st.dead=1}}else{st.miss++;st.lock=700}}
  st.sc=Math.max(0,st.pairs*100-st.miss*20)+(st.bonus||0)},
 step(st,i,dt){st.ms+=dt;if(st.lock>0&&(st.lock-=dt)<=0){st.open.forEach(q=>st.f[q]=0);st.open=[]}},
 draw(c,st){GR(c,'#191c4a','#3b3f93');TX(c,st.sc,16,50,30,'#fff');TX(c,Math.floor(st.ms/1000)+'s',304,50,26,'#ffd23f','right');
  st.c.forEach((e,q)=>{const x=16+(q%4)*74,y=110+(q/4|0)*74;if(st.f[q]){R(c,st.f[q]===2?'#d9f7e5':'#fff',x,y,68,68,12);EM(c,e,x+34,y+34,34)}else{R(c,'#6c72e8',x,y,68,68,12);TX(c,'?',x+34,y+46,32,'rgba(255,255,255,.7)','center')}})}}
});
