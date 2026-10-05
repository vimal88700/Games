/* Compact chess rules: castling, en passant, promotion (queen), check, mate, stalemate, 50-move. Board: 64 cells, 0 = a8. */
const CHESS=(()=>{
const N8=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]],K8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const isW=p=>p===p.toUpperCase(),inb=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
function start(){const b=Array(64).fill(null);'rnbqkbnr'.split('').forEach((p,i)=>{b[i]=p;b[56+i]=p.toUpperCase();b[8+i]='p';b[48+i]='P'});return{b,t:0,c:'KQkq',ep:-1,hm:0}}
function atk(b,sq,byW){const r=sq>>3,c=sq&7,pd=byW?1:-1,at=(rr,cc,ch)=>inb(rr,cc)&&b[rr*8+cc]===(byW?ch:ch.toLowerCase());
 if(at(r+pd,c-1,'P')||at(r+pd,c+1,'P'))return true;
 for(const[dc,dr]of N8)if(at(r+dr,c+dc,'N'))return true;
 for(const[dc,dr]of K8){if(at(r+dr,c+dc,'K'))return true;let rr=r+dr,cc=c+dc;
  while(inb(rr,cc)){const x=b[rr*8+cc];if(x){if(isW(x)===byW){const u=x.toUpperCase();if(u==='Q'||u===(dc&&dr?'B':'R'))return true}break}rr+=dr;cc+=dc}}
 return false}
function gen(s){const b=s.b,w=s.t===0,M=[];
 for(let f=0;f<64;f++){const p=b[f];if(!p||isW(p)!==w)continue;const u=p.toUpperCase(),r=f>>3,c=f&7,add=(t,x)=>M.push(x?{f,t,...x}:{f,t});
  if(u==='P'){const d=w?-1:1,t1=f+d*8,last=w?0:7;
   if(!b[t1]){add(t1,(t1>>3)===last?{pr:1}:null);if(r===(w?6:1)&&!b[t1+d*8])add(t1+d*8)}
   for(const dc of[-1,1]){const cc=c+dc;if(cc<0||cc>7)continue;const t=t1+dc,q=b[t];
    if(q&&isW(q)!==w)add(t,(t>>3)===last?{pr:1}:null);else if(!q&&t===s.ep)add(t,{ep:1})}}
  else if(u==='N'||u==='K'){for(const[dc,dr]of(u==='N'?N8:K8)){const rr=r+dr,cc=c+dc;if(!inb(rr,cc))continue;const t=rr*8+cc,q=b[t];if(!q||isW(q)!==w)add(t)}
   if(u==='K'){const h=w?60:4,K=w?'K':'k',Q=w?'Q':'q',R=w?'R':'r';
    if(f===h){if(s.c.includes(K)&&!b[h+1]&&!b[h+2]&&b[h+3]===R)add(h+2,{cs:1});
     if(s.c.includes(Q)&&!b[h-1]&&!b[h-2]&&!b[h-3]&&b[h-4]===R)add(h-2,{cs:1})}}}
  else{const D=u==='B'?K8.slice(4):u==='R'?K8.slice(0,4):K8;
   for(const[dc,dr]of D){let rr=r+dr,cc=c+dc;while(inb(rr,cc)){const t=rr*8+cc,q=b[t];if(!q)add(t);else{if(isW(q)!==w)add(t);break}rr+=dr;cc+=dc}}}}
 return M}
function apply(s,m){const b=s.b.slice(),p=b[m.f],w=isW(p),cap=b[m.t]||m.ep;
 b[m.t]=m.pr?(w?'Q':'q'):p;b[m.f]=null;if(m.ep)b[m.t+(w?8:-8)]=null;
 if(m.cs){if(m.t>m.f){b[m.f+1]=b[m.f+3];b[m.f+3]=null}else{b[m.f-1]=b[m.f-4];b[m.f-4]=null}}
 let c=s.c;if(p==='K')c=c.replace(/[KQ]/g,'');if(p==='k')c=c.replace(/[kq]/g,'');
 for(const[sq,ch]of[[63,'K'],[56,'Q'],[7,'k'],[0,'q']])if(m.f===sq||m.t===sq)c=c.replace(ch,'');
 const pawn=p.toUpperCase()==='P';
 return{b,t:1-s.t,c,ep:pawn&&Math.abs(m.t-m.f)===16?(m.f+m.t)/2:-1,hm:pawn||cap?0:s.hm+1,last:[m.f,m.t]}}
function legal(s){const w=s.t===0,out=[];
 for(const m of gen(s)){if(m.cs&&(atk(s.b,m.f,!w)||atk(s.b,(m.f+m.t)/2,!w)))continue;
  const n=apply(s,m);if(!atk(n.b,n.b.indexOf(w?'K':'k'),!w))out.push(m)}
 return out}
function result(s){if(s.hm>=100)return{draw:1};if(legal(s).length)return null;const w=s.t===0;
 return atk(s.b,s.b.indexOf(w?'K':'k'),!w)?{w:1-s.t}:{draw:1}}

/* ---- search: iterative deepening negamax + alpha-beta + quiescence, time limited ---- */
const VAL={p:100,n:320,b:330,r:500,q:900,k:0};
const T8=a=>a;const PST={
p:[0,0,0,0,0,0,0,0,50,50,50,50,50,50,50,50,10,10,20,30,30,20,10,10,5,5,10,25,25,10,5,5,0,0,0,20,20,0,0,0,5,-5,-10,0,0,-10,-5,5,5,10,10,-20,-20,10,10,5,0,0,0,0,0,0,0,0],
n:[-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,0,0,0,-20,-40,-30,0,10,15,15,10,0,-30,-30,5,15,20,20,15,5,-30,-30,0,15,20,20,15,0,-30,-30,5,10,15,15,10,5,-30,-40,-20,0,5,5,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50],
b:[-20,-10,-10,-10,-10,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,10,10,5,0,-10,-10,5,5,10,10,5,5,-10,-10,0,10,10,10,10,0,-10,-10,10,10,10,10,10,10,-10,-10,5,0,0,0,0,5,-10,-20,-10,-10,-10,-10,-10,-10,-20],
r:[0,0,0,0,0,0,0,0,5,10,10,10,10,10,10,5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,0,0,0,5,5,0,0,0],
q:[-20,-10,-10,-5,-5,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,5,5,5,0,-10,-5,0,5,5,5,5,0,-5,0,0,5,5,5,5,0,-5,-10,5,5,5,5,5,0,-10,-10,0,5,0,0,0,0,-10,-20,-10,-10,-5,-5,-10,-10,-20],
k:[-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10,20,20,0,0,0,0,20,20,20,30,10,0,0,10,30,20]};
function evalS(s){let v=0;for(let i=0;i<64;i++){const x=s.b[i];if(!x)continue;const u=x.toLowerCase();if(isW(x))v+=VAL[u]+PST[u][i];else v-=VAL[u]+PST[u][i^56]}return s.t===0?v:-v}
const ORD=(s,ms)=>{for(const m of ms){const v=s.b[m.t];m.o=(v?10*VAL[v.toLowerCase()]-VAL[s.b[m.f].toLowerCase()]/10+1000:0)+(m.pr?800:0)}return ms.sort((a,b)=>b.o-a.o)};
const kingHit=(n,w)=>atk(n.b,n.b.indexOf(w?'K':'k'),!w);
function qs(s,al,be,T){const e=evalS(s);if(e>=be)return e;if(e>al)al=e;const w=s.t===0;
 for(const m of ORD(s,gen(s).filter(m=>s.b[m.t]||m.ep||m.pr))){const n=apply(s,m);if(kingHit(n,w))continue;
  const v=-qs(n,-be,-al,T);if(T.stop)return 0;if(v>=be)return v;if(v>al)al=v}return al}
function nm(s,d,al,be,ply,T){if((++T.n&1023)===0&&Date.now()>T.end)T.stop=1;if(T.stop)return 0;if(s.hm>=100)return 0;if(d<=0)return qs(s,al,be,T);
 const w=s.t===0;let best=-1e9,cnt=0;
 for(const m of ORD(s,gen(s))){if(m.cs&&(atk(s.b,m.f,!w)||atk(s.b,(m.f+m.t)/2,!w)))continue;const n=apply(s,m);if(kingHit(n,w))continue;cnt++;
  const v=-nm(n,d-1,-be,-al,ply+1,T);if(T.stop)return 0;if(v>best){best=v;if(ply===0)T.bm=m}if(v>al)al=v;if(al>=be)break}
 if(!cnt)return atk(s.b,s.b.indexOf(w?'K':'k'),!w)?-30000+ply:0;return best}
function best(s,ms,maxD){const T={end:Date.now()+ms,n:0,stop:0};let bm=null;
 for(let d=1;d<=(maxD||9);d++){T.bm=null;const v=nm(s,d,-1e9,1e9,0,T);if(T.stop)break;if(T.bm)bm=T.bm;if(Math.abs(v)>29000)break}
 return bm||legal(s)[0]}
return{start,legal,apply,result,atk,best,evalS}})();
if(typeof module!=='undefined')module.exports=CHESS;
