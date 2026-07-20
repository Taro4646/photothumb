(()=>{"use strict";
const $=id=>document.getElementById(id);
const cv=$("big"),ctx=cv.getContext("2d");

/* formats: preview widths are the sizes these are actually seen at */
const RATIOS=[
 {id:"ig45",  nm:"Instagram", sub:"4:5",  w:1080,h:1350, small:120,mid:184, safe:"igsquare"},
 {id:"ig11",  nm:"Instagram", sub:"1:1",  w:1080,h:1080, small:120,mid:184, safe:null},
 {id:"story", nm:"Story",     sub:"9:16", w:1080,h:1920, small:96, mid:150, safe:"story"},
 {id:"yt",    nm:"YouTube",   sub:"16:9", w:1280,h:720,  small:168,mid:246, safe:"yt"}
];
const LAYOUTS=[
 {id:"band", nm:"下ベタ帯", ds:"最も潰れにくい"},
 {id:"center", nm:"中央抜き", ds:"写真を見せる"},
 {id:"left", nm:"左寄せ縦", ds:"IGグリッド向き"}
];
const TYPES=[
 {id:"impact",nm:"IMPACT",ds:"Anton × Noto Sans 900 ／ 一番読める",
  disp:{f:'"Anton", sans-serif',w:400,tr:0},jp:{f:'"Noto Sans JP", sans-serif',w:900,tr:.01},
  sub:{f:'"Noto Sans JP", sans-serif',w:700,tr:.04},
  score:a=>1.0+a.edge*.8+a.sat*.5},
 {id:"mag",nm:"MAGAZINE",ds:"Bodoni × Zen Old Mincho 900 ／ 雑誌の質感",
  disp:{f:'"Bodoni Moda", serif',w:800,tr:.03},jp:{f:'"Zen Old Mincho", serif',w:900,tr:.03},
  sub:{f:'"Bodoni Moda", serif',w:600,tr:.16},
  score:a=>.9+(1-a.sat)*.9+(1-a.edge)*.6},
 {id:"still",nm:"STILL",ds:"Archivo Black × しっぽり明朝 ／ 静かな写真に",
  disp:{f:'"Archivo Black", sans-serif',w:400,tr:.02},jp:{f:'"Shippori Mincho", serif',w:800,tr:.06},
  sub:{f:'"Bodoni Moda", serif',w:600,tr:.18},
  score:a=>.8+(1-a.luma)*1.1+(1-a.edge)*.7}
];

let ratio=RATIOS[0],layout=LAYOUTS[0],type=TYPES[0];
let img=null,analysis=null,accent="#ff4d2e",mask={x:.5,y:.42},ranked=[];

/* ---------- analysis ---------- */
function analyze(im){
  const n=96,c=document.createElement("canvas");c.width=c.height=n;
  const g=c.getContext("2d",{willReadFrequently:true});g.drawImage(im,0,0,n,n);
  const d=g.getImageData(0,0,n,n).data;
  let lum=0,sat=0;const gray=new Float32Array(n*n),pts=[];
  for(let i=0,p=0;i<d.length;i+=4,p++){
    const r=d[i]/255,gg=d[i+1]/255,b=d[i+2]/255;
    const mx=Math.max(r,gg,b),mn=Math.min(r,gg,b);
    const l=.2126*r+.7152*gg+.0722*b;lum+=l;sat+=mx?(mx-mn)/mx:0;gray[p]=l;
    if(p%2===0)pts.push([d[i],d[i+1],d[i+2]]);
  }
  const px=n*n;lum/=px;sat/=px;
  let e=0;for(let y=1;y<n-1;y++)for(let x=1;x<n-1;x++){const i=y*n+x;e+=Math.abs(gray[i]-gray[i+1])+Math.abs(gray[i]-gray[i+n]);}
  return{palette:kmeans(pts,5),luma:lum,sat:Math.min(1,sat),edge:Math.min(1,e/(px*.18))};
}
function kmeans(pts,k){
  let cen=[];for(let i=0;i<k;i++)cen.push(pts[Math.floor((i+.5)*pts.length/k)].slice());
  const as=new Array(pts.length).fill(0);
  for(let it=0;it<8;it++){
    for(let i=0;i<pts.length;i++){let b=0,bd=1/0;
      for(let j=0;j<k;j++){const dr=pts[i][0]-cen[j][0],dg=pts[i][1]-cen[j][1],db=pts[i][2]-cen[j][2];const dd=dr*dr+dg*dg+db*db;if(dd<bd){bd=dd;b=j;}}
      as[i]=b;}
    const s=Array.from({length:k},()=>[0,0,0,0]);
    pts.forEach((p,i)=>{const a=as[i];s[a][0]+=p[0];s[a][1]+=p[1];s[a][2]+=p[2];s[a][3]++;});
    for(let j=0;j<k;j++)if(s[j][3])cen[j]=[s[j][0]/s[j][3],s[j][1]/s[j][3],s[j][2]/s[j][3]];
  }
  const cnt=new Array(k).fill(0);as.forEach(a=>cnt[a]++);
  return cen.map((c,i)=>({c,n:cnt[i]})).sort((a,b)=>b.n-a.n).map(o=>hex(o.c));
}
const hex=c=>"#"+c.map(v=>Math.max(0,Math.min(255,v|0)).toString(16).padStart(2,"0")).join("");
const toRgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const lu=h=>{const[r,g,b]=toRgb(h);return(.2126*r+.7152*g+.0722*b)/255;};
function pickAccent(p){let best=p[0],bs=-1;p.forEach(h=>{const[r,g,b]=toRgb(h);const mx=Math.max(r,g,b),mn=Math.min(r,g,b);
  const s=mx?(mx-mn)/mx:0,l=lu(h);const v=s*1.7+(1-Math.abs(l-.5)*2)*.7;if(v>bs){bs=v;best=h;}});return best;}

/* ---------- text helpers ---------- */
const setF=(f,s,w)=>ctx.font=`${w} ${s}px ${f}`;
function tw(str,tr){let w=0;for(const ch of str)w+=ctx.measureText(ch).width+tr;return w-tr;}
function draw(str,x,y,tr,al="left",stroke=0){
  const w=tw(str,tr);let cx=al==="center"?x-w/2:al==="right"?x-w:x;
  for(const ch of str){
    if(stroke){ctx.lineWidth=stroke;ctx.lineJoin="round";ctx.strokeText(ch,cx,y);}
    ctx.fillText(ch,cx,y);cx+=ctx.measureText(ch).width+tr;
  }
  return w;
}
const isLatin=s=>!/[^\x00-\x7F]/.test(s);
function fontFor(str){return isLatin(str)?type.disp:type.jp;}
function fit(lines,maxW,maxSize,fo){
  let s=maxSize;
  for(let i=0;i<50;i++){setF(fo.f,s,fo.w);
    if(lines.every(l=>tw(l,s*fo.tr)<=maxW))break;s*=.95;}
  return s;
}

/* ---------- render ---------- */
function render(){
  const W=cv.width,H=cv.height;
  ctx.clearRect(0,0,W,H);ctx.fillStyle="#1b1e23";ctx.fillRect(0,0,W,H);
  if(!img){ph();syncPv();return;}
  const zoom=+$("sZoom").value/100;
  photo(zoom);
  const dark=+$("sDark").value/100;
  scrim(dark);

  const main=$("tMain").value.split("\n").filter(Boolean).slice(0,3);
  const sub=$("tSub").value.trim(),tag=$("tTag").value.trim();
  const sc=+$("sType").value/100;
  const pad=W*.06;

  if(layout.id==="band")   bandLayout(main,sub,tag,pad,sc);
  if(layout.id==="center") centerLayout(main,sub,tag,pad,sc,zoom,dark);
  if(layout.id==="left")   leftLayout(main,sub,tag,pad,sc);

  if($("cSafe").checked) safe();
  syncPv();
}
function photo(z){
  const W=cv.width,H=cv.height;
  const s=Math.max(W/img.width,H/img.height)*z,w=img.width*s,h=img.height*s;
  ctx.drawImage(img,(W-w)/2,(H-h)/2,w,h);
}
function scrim(d){
  if(d<=0)return;const W=cv.width,H=cv.height;
  const g=ctx.createLinearGradient(0,H*.25,0,H);
  g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,`rgba(0,0,0,${.9*d})`);
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle=`rgba(0,0,0,${.25*d})`;ctx.fillRect(0,0,W,H);
}
function tagChip(x,y,txt,align="left"){
  if(!txt)return 0;
  const W=cv.width,s=W*.026;
  setF(type.sub.f,s,type.sub.w);
  const t=isLatin(txt)?txt.toUpperCase():txt,tr=s*type.sub.tr;
  const w=tw(t,tr),px=s*.7,h=s*1.9;
  const bx=align==="center"?x-(w+px*2)/2:x;
  ctx.fillStyle=accent;ctx.fillRect(bx,y-h*.72,w+px*2,h);
  ctx.fillStyle=lu(accent)>.62?"#111":"#fff";
  draw(t,bx+px,y+s*.1,tr);
  return h;
}
function bandLayout(main,sub,tag,pad,sc){
  const W=cv.width,H=cv.height;
  const fo=fontFor(main[0]||"");
  const size=fit(main,W-pad*2,W*(cv.width>cv.height?.115:.135)*sc,fo);
  const lh=size*1.22;
  const blockH=lh*main.length+(sub?size*.85:0)+(tag?size*.9:0)+pad*1.2;
  ctx.fillStyle="rgba(0,0,0,.55)";ctx.fillRect(0,H-blockH-pad*.4,W,blockH+pad*.4);
  ctx.fillStyle=accent;ctx.fillRect(0,H-blockH-pad*.4,W,Math.max(4,W*.006));
  let y=H-pad-(sub?size*.9:0)-(main.length-1)*lh;
  setF(fo.f,size,fo.w);
  ctx.fillStyle="#fff";ctx.strokeStyle="rgba(0,0,0,.55)";
  const st=$("cEdge").checked?size*.055:0;
  main.forEach((l,i)=>draw(isLatin(l)?l.toUpperCase():l,pad,y+i*lh,size*fo.tr,"left",st));
  if(tag)tagChip(pad,y-lh*.92,tag);
  if(sub){const s2=W*.03*sc;setF(type.sub.f,s2,type.sub.w);ctx.fillStyle="rgba(255,255,255,.92)";
    draw(isLatin(sub)?sub.toUpperCase():sub,pad,y+(main.length-1)*lh+size*.82,s2*type.sub.tr);}
}
function centerLayout(main,sub,tag,pad,sc,zoom,dark){
  const W=cv.width,H=cv.height;
  const fo=fontFor(main[0]||"");
  const size=fit(main,W-pad*2,W*(W>H?.13:.16)*sc,fo);
  const lh=size*1.2;
  let y=H*.5-((main.length-1)*lh)/2+size*.32;
  setF(fo.f,size,fo.w);ctx.fillStyle="#fff";ctx.strokeStyle="rgba(0,0,0,.5)";
  const st=$("cEdge").checked?size*.06:0;
  main.forEach((l,i)=>draw(isLatin(l)?l.toUpperCase():l,W/2,y+i*lh,size*fo.tr,"center",st));
  if($("cMask").checked&&img){
    ctx.save();ctx.beginPath();
    ctx.ellipse(mask.x*W,mask.y*H,W*(+$("sMaskW").value/100)/2,H*(+$("sMaskH").value/100)/2,0,0,Math.PI*2);
    ctx.clip();photo(zoom);scrim(dark);ctx.restore();
  }
  if(tag)tagChip(W/2,H*.5-((main.length-1)*lh)/2-size*.95,tag,"center");
  if(sub){const s2=W*.03*sc;setF(type.sub.f,s2,type.sub.w);ctx.fillStyle="rgba(255,255,255,.92)";
    draw(isLatin(sub)?sub.toUpperCase():sub,W/2,y+(main.length-1)*lh+size*.95,s2*type.sub.tr,"center");}
}
function leftLayout(main,sub,tag,pad,sc){
  const W=cv.width,H=cv.height;
  ctx.fillStyle=accent;ctx.fillRect(0,0,Math.max(6,W*.022),H);
  const fo=fontFor(main[0]||"");
  const size=fit(main,W*.62,W*(W>H?.115:.14)*sc,fo);
  const lh=size*1.2,x=pad*1.25;
  let y=H*.62-((main.length-1)*lh);
  setF(fo.f,size,fo.w);ctx.fillStyle="#fff";ctx.strokeStyle="rgba(0,0,0,.5)";
  const st=$("cEdge").checked?size*.06:0;
  main.forEach((l,i)=>draw(isLatin(l)?l.toUpperCase():l,x,y+i*lh,size*fo.tr,"left",st));
  if(tag)tagChip(x,y-lh*.95,tag);
  if(sub){const s2=W*.029*sc;setF(type.sub.f,s2,type.sub.w);ctx.fillStyle="rgba(255,255,255,.9)";
    draw(isLatin(sub)?sub.toUpperCase():sub,x,y+(main.length-1)*lh+size*.85,s2*type.sub.tr);}
}
function safe(){
  const W=cv.width,H=cv.height;
  ctx.save();ctx.setLineDash([W*.012,W*.012]);ctx.lineWidth=Math.max(2,W*.003);
  ctx.strokeStyle="rgba(255,255,255,.45)";
  if(ratio.safe==="yt"){ // 再生時間バッジ
    const bw=W*.11,bh=H*.075;ctx.strokeRect(W-bw-W*.02,H-bh-H*.03,bw,bh);
  }
  if(ratio.safe==="igsquare"){ // グリッドで正方形に切られる範囲
    const s=W,top=(H-s)/2;ctx.strokeRect(0,top,s,s);
  }
  if(ratio.safe==="story"){ // 上下UIに隠れる帯
    ctx.fillStyle="rgba(255,0,0,.10)";
    ctx.fillRect(0,0,W,H*.13);ctx.fillRect(0,H*.82,W,H*.18);
    ctx.strokeRect(0,H*.13,W,H*.69);
  }
  ctx.restore();
}
function ph(){
  const W=cv.width,H=cv.height;
  ctx.fillStyle="#262a30";ctx.fillRect(0,0,W,H);
  ctx.fillStyle="#666c76";ctx.textAlign="center";
  ctx.font=`500 ${W*.032}px "Shippori Mincho", serif`;
  ctx.fillText("写真がまだありません",W/2,H/2);ctx.textAlign="left";
}

/* ---------- actual size preview ---------- */
let pvTimer=null;
function syncPv(){
  clearTimeout(pvTimer);
  pvTimer=setTimeout(()=>{
    const url=cv.toDataURL("image/png");
    const r=cv.height/cv.width;
    [["pv1","c1",ratio.small],["pv2","c2",ratio.mid]].forEach(([i,c,w])=>{
      const el=$(i);el.src=url;el.style.width=w+"px";el.style.height=Math.round(w*r)+"px";
      $(c).textContent=w+"px";
    });
  },90);
}

/* ---------- ui ---------- */
function segs(){
  const r=$("ratios");r.innerHTML="";
  RATIOS.forEach(x=>{const b=document.createElement("button");
    b.innerHTML=`${x.nm}<small>${x.sub}</small>`;b.setAttribute("aria-pressed",x.id===ratio.id);
    b.onclick=()=>{ratio=x;cv.width=x.w;cv.height=x.h;segs();render();};r.appendChild(b);});
  const l=$("layouts");l.innerHTML="";
  LAYOUTS.forEach(x=>{const b=document.createElement("button");
    b.innerHTML=`${x.nm}<small>${x.ds}</small>`;b.setAttribute("aria-pressed",x.id===layout.id);
    b.onclick=()=>{layout=x;segs();render();};l.appendChild(b);});
}
function paintChips(){
  const box=$("chips");box.innerHTML="";
  if(!analysis)return;
  analysis.palette.forEach(h=>{const b=document.createElement("button");
    b.className="chip";b.style.background=h;b.title=`アクセントを ${h} にする`;
    b.setAttribute("aria-pressed",h===accent);
    b.onclick=()=>{accent=h;paintChips();checkContrast();render();};box.appendChild(b);});
}
function paintPresets(){
  const box=$("presets");box.innerHTML="";
  (ranked.length?ranked:TYPES).forEach((p,i)=>{
    const b=document.createElement("button");b.className="preset";
    b.setAttribute("aria-pressed",type.id===p.id);
    b.innerHTML=`<span class="rk">${i+1}</span><span>${p.nm}<span class="ds">${p.ds}</span></span>`;
    b.onclick=()=>{type=p;paintPresets();render();};box.appendChild(b);});
}
function checkContrast(){
  const box=$("contrast");
  if(!analysis){box.innerHTML="";return;}
  const l=analysis.luma,e=analysis.edge;
  let msg="",ok=false;
  if(l>.68) msg="写真が明るい。白文字は飛ぶので「写真を沈める」を上げるか、下ベタ帯を使う。";
  else if(e>.62) msg="ディテールが多い写真。文字の裏が騒がしいので、縁つきか帯を推奨。";
  else {ok=true;msg="文字が乗りやすい写真。中央抜きでも成立する。";}
  box.innerHTML=`<div class="warn${ok?" ok":""}">${msg}</div>`;
}
function counts(){
  const m=$("tMain").value.replace(/\n/g,"").length,s=$("tSub").value.length;
  $("cnMain").textContent=m;$("cnMain").className="count"+(m>12?" over":"");
  $("cnSub").textContent=s;$("cnSub").className="count"+(s>22?" over":"");
}
function load(f){
  if(!f||!f.type.startsWith("image/"))return;
  const url=URL.createObjectURL(f),im=new Image();
  im.onload=()=>{img=im;analysis=analyze(im);accent=pickAccent(analysis.palette);
    ranked=[...TYPES].sort((a,b)=>b.score(analysis)-a.score(analysis));type=ranked[0];
    paintChips();paintPresets();checkContrast();render();URL.revokeObjectURL(url);};
  im.src=url;
}
$("drop").onclick=()=>$("file").click();
$("file").onchange=e=>load(e.target.files[0]);
["dragover","dragenter"].forEach(ev=>$("drop").addEventListener(ev,e=>e.preventDefault()));
$("drop").addEventListener("drop",e=>{e.preventDefault();load(e.dataTransfer.files[0]);});
["tMain","tSub","tTag"].forEach(i=>$(i).addEventListener("input",()=>{counts();render();}));
["cMask","cEdge","cSafe"].forEach(i=>$(i).addEventListener("change",render));
[["sType","vType"],["sDark","vDark"],["sZoom","vZoom"],["sMaskW","vMaskW"],["sMaskH","vMaskH"]]
  .forEach(([s,v])=>$(s).addEventListener("input",()=>{$(v).textContent=$(s).value;render();}));

let drag=false;
const loc=e=>{const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};};
cv.addEventListener("pointerdown",e=>{drag=true;cv.setPointerCapture(e.pointerId);mask=loc(e);render();});
cv.addEventListener("pointermove",e=>{if(drag){e.preventDefault();mask=loc(e);render();}});
["pointerup","pointercancel"].forEach(ev=>cv.addEventListener(ev,()=>drag=false));

$("save").onclick=()=>{
  const safeOn=$("cSafe").checked;
  if(safeOn){$("cSafe").checked=false;render();}
  cv.toBlob(b=>{const a=document.createElement("a");a.href=URL.createObjectURL(b);
    a.download=`thumb-${ratio.id}-${Date.now()}.png`;a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),2000);
    if(safeOn){$("cSafe").checked=true;render();}
  },"image/png");
};

segs();paintPresets();counts();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(render);
render();
})();
