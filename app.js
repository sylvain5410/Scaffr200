const $=id=>document.getElementById(id);
let state={nom:"Chantier",travees:6,niveaux:5,type:"facade",acces:false,consoles:false,angle:-.55,materiel:[]};
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".panel").forEach(x=>x.classList.toggle("active",x.id===b.dataset.tab));});
document.querySelectorAll("[data-step]").forEach(b=>b.onclick=()=>{let i=$(b.dataset.step);i.value=Math.max(1,+i.value+(+b.dataset.d));resume();});
["travees","niveaux"].forEach(id=>$(id).oninput=resume);
function resume(){let t=Math.max(1,+$("travees").value||1),n=Math.max(1,+$("niveaux").value||1);$("longueur").textContent=t*3+" m";$("hauteur").textContent=n*2+" m";$("surface").textContent=t*3*n*2+" m²";}
function lire(){state.nom=$("nom").value.trim()||"Chantier";state.travees=Math.max(1,+$("travees").value||1);state.niveaux=Math.max(1,+$("niveaux").value||1);state.type=$("type").value;state.acces=$("acces").checked;state.consoles=$("consoles").checked;let s=state;state.materiel=[
["Socles à vis",2*(s.travees+1),"Deux files de montants"],
["Cadres R200 Progress acier",(s.travees+1)*s.niveaux,"Estimation principale"],
["Planchers alu/bois 3 m",s.travees*s.niveaux,"1 par travée et niveau"],
["Longerons / lisses",s.travees*(s.niveaux+1)*2,"Estimation deux côtés"],
["Garde-corps classiques",s.travees*s.niveaux,"Protection estimative"],
["Plinthes 3 m",s.travees*s.niveaux,"Une par travée de travail"],
["Plinthes d’extrémité",2*s.niveaux,"Deux extrémités"],
["Diagonales",Math.ceil(s.travees/3)*s.niveaux,"Une tous les 3 modules"],
["Amarrages",Math.ceil(s.travees*s.niveaux/6),"Indicatif, à vérifier"],
["Éléments d’accès",s.acces?s.niveaux:0,"Selon accès retenu"],
["Consoles",s.consoles?s.travees*2:0,"À valider"],
["Éléments retour d’angle",s.type==="angle"?s.niveaux*2:0,"Indicatif"]
].filter(x=>x[1]>0);}
function rendu(){let l=$("liste");l.innerHTML=`<h3>${state.nom} — ${state.travees*3} m × ${state.niveaux*2} m</h3>`;state.materiel.forEach(x=>l.innerHTML+=`<div class="row"><div><b>${x[0]}</b><small>${x[2]}</small></div><span class="qty">${x[1]}</span></div>`);}
function calc(){lire();rendu();draw2d();draw3d();}
$("calculer").onclick=()=>{calc();document.querySelector('[data-tab="materiel"]').click();};$("pdf").onclick=()=>{calc();print();};
function draw2d(){let c=$("c2d"),x=c.getContext("2d"),p=70,w=c.width-2*p,h=c.height-2*p,bw=w/state.travees,lh=h/state.niveaux;x.clearRect(0,0,c.width,c.height);x.lineCap="round";for(let i=0;i<=state.travees;i++)line(x,p+i*bw,p,p+i*bw,p+h,6,"#172033");for(let j=0;j<=state.niveaux;j++)line(x,p,p+j*lh,p+w,p+j*lh,5,"#172033");for(let i=0;i<state.travees;i+=3)for(let j=0;j<state.niveaux;j++)line(x,p+i*bw,p+(j+1)*lh,p+Math.min(i+1,state.travees)*bw,p+j*lh,5,"#f59e0b");}
function line(x,a,b,c,d,w,col){x.beginPath();x.lineWidth=w;x.strokeStyle=col;x.moveTo(a,b);x.lineTo(c,d);x.stroke();}
function draw3d(){let c=$("c3d"),x=c.getContext("2d"),p=105,w=c.width-2*p,h=c.height-2*p,bw=w/state.travees,lh=h/state.niveaux,dep=100,dx=Math.cos(state.angle)*dep,dy=Math.sin(state.angle)*dep;x.clearRect(0,0,c.width,c.height);x.lineCap="round";for(let i=0;i<=state.travees;i++){let X=p+i*bw;line(x,X,p,X,p+h,6,"#172033");line(x,X+dx,p+dy,X+dx,p+h+dy,4,"#526075");line(x,X,p,X+dx,p+dy,3,"#7b8799");line(x,X,p+h,X+dx,p+h+dy,3,"#7b8799");}for(let j=0;j<=state.niveaux;j++){let Y=p+j*lh;line(x,p,Y,p+w,Y,5,"#172033");line(x,p+dx,Y+dy,p+w+dx,Y+dy,3,"#526075");}for(let i=0;i<state.travees;i+=3)for(let j=0;j<state.niveaux;j++)line(x,p+i*bw,p+(j+1)*lh,p+Math.min(i+1,state.travees)*bw,p+j*lh,5,"#f59e0b");}
$("gauche").onclick=()=>{state.angle-=.18;draw3d()};$("droite").onclick=()=>{state.angle+=.18;draw3d()};
let sx=null;$("c3d").addEventListener("touchstart",e=>sx=e.touches[0].clientX,{passive:true});$("c3d").addEventListener("touchmove",e=>{if(sx===null)return;let nx=e.touches[0].clientX;state.angle+=(nx-sx)*.006;sx=nx;draw3d()},{passive:true});$("c3d").addEventListener("touchend",()=>sx=null);
function saves(){try{return JSON.parse(localStorage.getItem("scaffr200-v02")||"[]")}catch{return[]}}
function renderSaves(){let a=saves(),d=$("saves");d.innerHTML=a.length?"":'<div class="empty">Aucun chantier sauvegardé.</div>';a.forEach((s,i)=>d.innerHTML+=`<div class="save"><div><b>${s.nom}</b><small>${s.travees} travées • ${s.niveaux} niveaux</small></div><div><button data-open="${i}">Ouvrir</button> <button data-del="${i}">Supprimer</button></div></div>`);}
$("sauver").onclick=()=>{calc();let a=saves();a.unshift({...state});localStorage.setItem("scaffr200-v02",JSON.stringify(a.slice(0,50)));renderSaves();};
$("saves").onclick=e=>{let a=saves();if(e.target.dataset.open!==undefined){let s=a[+e.target.dataset.open];$("nom").value=s.nom;$("travees").value=s.travees;$("niveaux").value=s.niveaux;$("type").value=s.type;$("acces").checked=s.acces;$("consoles").checked=s.consoles;resume();calc();document.querySelector('[data-tab="chantier"]').click()}if(e.target.dataset.del!==undefined){a.splice(+e.target.dataset.del,1);localStorage.setItem("scaffr200-v02",JSON.stringify(a));renderSaves()}};
if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js"));
resume();calc();renderSaves();