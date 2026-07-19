
const $ = id => document.getElementById(id);
const LENGTH_PRESETS = [0.7,1,1.5,2,2.5,3];

let state = {
  name:"Chantier",
  levels:5,
  mountType:"facade",
  access:false,
  consoles:false,
  endGuardrails:true,
  angle3d:-0.55,
  bays:[
    {length:3,type:"standard"},{length:3,type:"standard"},{length:3,type:"standard"},
    {length:3,type:"standard"},{length:3,type:"standard"},{length:3,type:"standard"}
  ],
  materials:[]
};

function fmt(n){
  return Number(n).toLocaleString("fr-FR",{minimumFractionDigits:Number(n)%1?2:0,maximumFractionDigits:2});
}
function totalLength(){ return state.bays.reduce((s,b)=>s+Number(b.length||0),0); }
function totalArea(){ return totalLength()*state.levels*2; }

function switchTab(id){
  document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("active",b.dataset.tab===id));
  document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("active",p.id===id));
}
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));

document.querySelectorAll("[data-step]").forEach(b=>b.onclick=()=>{
  const input=$(b.dataset.step);
  input.value=Math.max(Number(input.min||1),Number(input.value||1)+Number(b.dataset.delta));
  syncForm();
});

["projectName","levels","mountType","access","consoles","endGuardrails"].forEach(id=>{
  $(id).addEventListener("input",syncForm);
  $(id).addEventListener("change",syncForm);
});

function syncForm(){
  state.name=$("projectName").value.trim()||"Chantier";
  state.levels=Math.max(1,Number($("levels").value||1));
  state.mountType=$("mountType").value;
  state.access=$("access").checked;
  state.consoles=$("consoles").checked;
  state.endGuardrails=$("endGuardrails").checked;
  updateSummary();
  draw2D();
  draw3D();
}

function updateSummary(){
  $("sumLength").textContent=fmt(totalLength())+" m";
  $("sumHeight").textContent=fmt(state.levels*2)+" m";
  $("sumArea").textContent=fmt(totalArea())+" m²";
}

function renderBays(){
  const list=$("bayList");
  list.innerHTML="";
  state.bays.forEach((bay,index)=>{
    const card=document.createElement("div");
    card.className="bay-card";
    const presetOptions=LENGTH_PRESETS.map(v=>`<option value="${v}" ${Number(v)===Number(bay.length)?"selected":""}>${fmt(v)} m</option>`).join("");
    card.innerHTML=`
      <div class="top">
        <h3>Travée ${index+1}</h3>
        <button data-remove="${index}" aria-label="Supprimer">Supprimer</button>
      </div>
      <label>Longueur
        <select data-length="${index}">
          ${presetOptions}
          <option value="custom" ${LENGTH_PRESETS.includes(Number(bay.length))?"":"selected"}>Personnalisée</option>
        </select>
      </label>
      <div class="custom-row" ${LENGTH_PRESETS.includes(Number(bay.length))?'style="display:none"':""}>
        <input data-custom="${index}" type="number" min="0.3" max="5" step="0.01" value="${bay.length}">
        <span style="align-self:center">mètres</span>
      </div>
      <label>Fonction
        <select data-type="${index}">
          <option value="standard" ${bay.type==="standard"?"selected":""}>Standard</option>
          <option value="access" ${bay.type==="access"?"selected":""}>Accès</option>
          <option value="angle" ${bay.type==="angle"?"selected":""}>Angle</option>
        </select>
      </label>`;
    list.appendChild(card);
  });

  list.querySelectorAll("[data-remove]").forEach(btn=>btn.onclick=()=>{
    if(state.bays.length===1) return;
    state.bays.splice(Number(btn.dataset.remove),1);
    renderAll();
  });
  list.querySelectorAll("[data-length]").forEach(sel=>sel.onchange=()=>{
    const i=Number(sel.dataset.length);
    const card=sel.closest(".bay-card");
    const custom=card.querySelector("[data-custom]");
    const row=custom.parentElement;
    if(sel.value==="custom"){row.style.display="grid";state.bays[i].length=Number(custom.value||3);}
    else{row.style.display="none";state.bays[i].length=Number(sel.value);}
    renderAll(false);
  });
  list.querySelectorAll("[data-custom]").forEach(inp=>inp.oninput=()=>{
    state.bays[Number(inp.dataset.custom)].length=Math.max(.3,Number(inp.value||.3));
    renderAll(false);
  });
  list.querySelectorAll("[data-type]").forEach(sel=>sel.onchange=()=>{
    state.bays[Number(sel.dataset.type)].type=sel.value;
    renderAll(false);
  });
}

$("addBay").onclick=()=>{
  state.bays.push({length:Number($("defaultLength").value),type:"standard"});
  renderAll();
};
$("removeLast").onclick=()=>{
  if(state.bays.length>1){state.bays.pop();renderAll();}
};
$("duplicateLast").onclick=()=>{
  state.bays.push({...state.bays[state.bays.length-1]});
  renderAll();
};
$("applyAll").onclick=()=>{
  const length=Number($("defaultLength").value);
  state.bays.forEach(b=>b.length=length);
  renderAll();
};

$("goEditor").onclick=()=>switchTab("editor");

function bayPositions(start,width){
  const total=totalLength()||1;
  const scale=width/total;
  const out=[start];
  let x=start;
  state.bays.forEach(b=>{x+=b.length*scale;out.push(x);});
  return out;
}
function line(ctx,x1,y1,x2,y2,w=4,color="#172033"){
  ctx.beginPath();ctx.lineWidth=w;ctx.strokeStyle=color;ctx.lineCap="round";
  ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
}

function draw2D(){
  const c=$("planCanvas"),ctx=c.getContext("2d");
  const p=80,w=c.width-2*p,h=c.height-2*p,lh=h/state.levels,pos=bayPositions(p,w);
  ctx.clearRect(0,0,c.width,c.height);

  pos.forEach(x=>line(ctx,x,p,x,p+h,6));
  for(let j=0;j<=state.levels;j++) line(ctx,p,p+j*lh,p+w,p+j*lh,5);

  for(let i=0;i<state.bays.length;i+=3){
    for(let j=0;j<state.levels;j++){
      line(ctx,pos[i],p+(j+1)*lh,pos[Math.min(i+1,state.bays.length)],p+j*lh,5,"#f59e0b");
    }
  }

  state.bays.forEach((b,i)=>{
    if(b.type==="access"){
      ctx.fillStyle="rgba(59,130,246,.18)";
      ctx.fillRect(pos[i],p,pos[i+1]-pos[i],h);
    } else if(b.type==="angle"){
      ctx.fillStyle="rgba(168,85,247,.15)";
      ctx.fillRect(pos[i],p,pos[i+1]-pos[i],h);
    }
  });

  ctx.fillStyle="#172033";
  ctx.font="700 20px system-ui";
  state.bays.forEach((b,i)=>ctx.fillText(fmt(b.length)+" m",(pos[i]+pos[i+1])/2-26,c.height-28));
}

function draw3D(){
  const c=$("view3dCanvas"),ctx=c.getContext("2d");
  const p=115,w=c.width-2*p,h=c.height-2*p,lh=h/state.levels,pos=bayPositions(p,w);
  const depth=110,dx=Math.cos(state.angle3d)*depth,dy=Math.sin(state.angle3d)*depth;
  ctx.clearRect(0,0,c.width,c.height);

  pos.forEach(x=>{
    line(ctx,x,p,x,p+h,6);
    line(ctx,x+dx,p+dy,x+dx,p+h+dy,4,"#526075");
    line(ctx,x,p,x+dx,p+dy,3,"#7b8799");
    line(ctx,x,p+h,x+dx,p+h+dy,3,"#7b8799");
  });
  for(let j=0;j<=state.levels;j++){
    const y=p+j*lh;
    line(ctx,p,y,p+w,y,5);
    line(ctx,p+dx,y+dy,p+w+dx,y+dy,3,"#526075");
  }
  for(let i=0;i<state.bays.length;i+=3){
    for(let j=0;j<state.levels;j++){
      line(ctx,pos[i],p+(j+1)*lh,pos[Math.min(i+1,state.bays.length)],p+j*lh,5,"#f59e0b");
    }
  }
}

$("rotateLeft").onclick=()=>{state.angle3d-=.18;draw3D();};
$("rotateRight").onclick=()=>{state.angle3d+=.18;draw3D();};
$("resetView").onclick=()=>{state.angle3d=-.55;draw3D();};

let touchX=null;
$("view3dCanvas").addEventListener("touchstart",e=>touchX=e.touches[0].clientX,{passive:true});
$("view3dCanvas").addEventListener("touchmove",e=>{
  if(touchX===null)return;
  const x=e.touches[0].clientX;
  state.angle3d+=(x-touchX)*.006;
  touchX=x;draw3D();
},{passive:true});
$("view3dCanvas").addEventListener("touchend",()=>touchX=null);

function calculateMaterials(){
  syncForm();
  const grouped={};
  state.bays.forEach(b=>{
    const key=Number(b.length).toFixed(2);
    grouped[key]=(grouped[key]||0)+1;
  });

  const rows=[];
  rows.push({group:"Structure",name:"Socles à vis",qty:2*(state.bays.length+1),note:"Deux files de montants"});
  rows.push({group:"Structure",name:"Cadres R200 Progress acier",qty:(state.bays.length+1)*state.levels,note:"Estimation principale"});
  Object.entries(grouped).forEach(([len,count])=>{
    rows.push({group:"Planchers",name:`Planchers alu/bois ${fmt(Number(len))} m`,qty:count*state.levels,note:`${count} travée(s) × ${state.levels} niveau(x)`});
    rows.push({group:"Plinthes",name:`Plinthes longitudinales ${fmt(Number(len))} m`,qty:count*state.levels,note:"Estimation par longueur"});
  });
  rows.push({group:"Protection",name:"Garde-corps classiques",qty:state.bays.length*state.levels,note:"Estimation de façade"});
  rows.push({group:"Structure",name:"Longerons / lisses",qty:state.bays.length*(state.levels+1)*2,note:"Estimation deux côtés"});
  rows.push({group:"Contreventement",name:"Diagonales",qty:Math.ceil(state.bays.length/3)*state.levels,note:"Une tous les 3 modules"});
  rows.push({group:"Extrémités",name:"Plinthes d’extrémité",qty:2*state.levels,note:"Deux extrémités"});
  if(state.endGuardrails) rows.push({group:"Extrémités",name:"Garde-corps d’extrémité",qty:2*state.levels,note:"Deux extrémités"});
  const accessCount=state.bays.filter(b=>b.type==="access").length+(state.access?1:0);
  if(accessCount) rows.push({group:"Accès",name:"Éléments d’accès",qty:accessCount*state.levels,note:"Selon configuration retenue"});
  const angleCount=state.bays.filter(b=>b.type==="angle").length+(state.mountType==="angle"?1:0);
  if(angleCount) rows.push({group:"Angles",name:"Éléments de retour d’angle",qty:angleCount*state.levels*2,note:"Indicatif"});
  if(state.consoles) rows.push({group:"Consoles",name:"Consoles",qty:state.bays.length*2,note:"À vérifier selon largeur"});
  rows.push({group:"Amarrages",name:"Amarrages",qty:Math.ceil(state.bays.length*state.levels/6),note:"Valeur indicative à vérifier par étude"});

  state.materials=rows;
  renderMaterials();
}

function renderMaterials(){
  $("materialTitle").textContent=`${state.name} — ${fmt(totalLength())} m × ${fmt(state.levels*2)} m`;
  const box=$("materialList");box.innerHTML="";
  let current="";
  state.materials.forEach(r=>{
    if(r.group!==current){
      current=r.group;
      box.insertAdjacentHTML("beforeend",`<h3 class="group-title">${current}</h3>`);
    }
    box.insertAdjacentHTML("beforeend",`<div class="row"><div><strong>${r.name}</strong><small>${r.note}</small></div><span class="qty">${r.qty}</span></div>`);
  });
}

$("calculateBtn").onclick=()=>{calculateMaterials();switchTab("materials");};
$("printPdf").onclick=()=>{calculateMaterials();window.print();};

function savedProjects(){
  try{return JSON.parse(localStorage.getItem("scaffr200-v1-projects")||"[]");}
  catch{return [];}
}
function saveProjects(items){localStorage.setItem("scaffr200-v1-projects",JSON.stringify(items));}
function renderSaved(){
  const items=savedProjects(),box=$("savedList");box.innerHTML="";
  if(!items.length){box.innerHTML='<div class="empty">Aucun chantier sauvegardé.</div>';return;}
  items.forEach((p,i)=>{
    box.insertAdjacentHTML("beforeend",`<div class="saved-item">
      <div><strong>${p.name}</strong><small>${fmt(p.bays.reduce((s,b)=>s+b.length,0))} m • ${p.levels} niveaux</small></div>
      <div class="saved-actions"><button data-open="${i}">Ouvrir</button><button data-delete="${i}">Supprimer</button></div>
    </div>`);
  });
}
$("saveProject").onclick=()=>{
  calculateMaterials();
  const items=savedProjects();
  items.unshift({...state,bays:state.bays.map(b=>({...b})),savedAt:new Date().toISOString()});
  saveProjects(items.slice(0,50));renderSaved();
};
$("savedList").onclick=e=>{
  const items=savedProjects();
  if(e.target.dataset.open!==undefined){
    const p=items[Number(e.target.dataset.open)];
    state={...state,...p,bays:p.bays.map(b=>({...b}))};
    $("projectName").value=state.name;$("levels").value=state.levels;$("mountType").value=state.mountType;
    $("access").checked=state.access;$("consoles").checked=state.consoles;$("endGuardrails").checked=state.endGuardrails;
    renderAll();switchTab("project");
  }
  if(e.target.dataset.delete!==undefined){
    items.splice(Number(e.target.dataset.delete),1);saveProjects(items);renderSaved();
  }
};

$("exportJson").onclick=()=>{
  calculateMaterials();
  const blob=new Blob([JSON.stringify({...state,bays:state.bays.map(b=>({...b}))},null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);
  a.download=(state.name||"chantier").replace(/[^a-z0-9_-]+/gi,"_")+".json";a.click();
  URL.revokeObjectURL(a.href);
};
$("importJson").onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  try{
    const data=JSON.parse(await file.text());
    if(!Array.isArray(data.bays)||!data.bays.length) throw new Error();
    state={...state,...data,bays:data.bays.map(b=>({length:Number(b.length),type:b.type||"standard"}))};
    $("projectName").value=state.name||"";$("levels").value=state.levels||1;$("mountType").value=state.mountType||"facade";
    $("access").checked=!!state.access;$("consoles").checked=!!state.consoles;$("endGuardrails").checked=state.endGuardrails!==false;
    renderAll();switchTab("project");
  }catch{alert("Fichier de chantier invalide.");}
};

function renderAll(rebuildBays=true){
  syncForm();
  if(rebuildBays)renderBays();
  updateSummary();draw2D();draw3D();calculateMaterials();
}

if("serviceWorker" in navigator){
  addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js"));
}
renderBays();renderAll(false);renderSaved();
