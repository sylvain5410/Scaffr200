const tbody=document.querySelector('#catalogue');
const search=document.querySelector('#search');
const statusEl=document.querySelector('#status');

let items=[];
let onlySelected=false;
let quantities=JSON.parse(localStorage.getItem('scaffr200-quantities')||'{}');

const fmt=n=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1}).format(n);

function save(){
  localStorage.setItem('scaffr200-quantities',JSON.stringify(quantities));
  statusEl.textContent='Enregistré';
  setTimeout(()=>statusEl.textContent='',1500);
}

function getItem(ref){
  return items.find(x=>x.reference===ref);
}

function add(ref, qty){
  if(!getItem(ref)) return;
  quantities[ref]=(Number(quantities[ref]||0)+qty);
}

function setQty(ref, qty){
  if(!getItem(ref)) return;
  quantities[ref]=Math.max(0,Math.round(qty));
}

function render(){
  const q=search.value.trim().toLowerCase();
  tbody.innerHTML='';

  items.filter(x=>{
    const qty=Number(quantities[x.reference]||0);
    const match=(x.reference+' '+x.designation+' '+x.dimensions).toLowerCase().includes(q);
    return match&&(!onlySelected||qty>0);
  }).forEach(x=>{
    const qty=Number(quantities[x.reference]||0);
    const tr=document.createElement('tr');
    if(qty>0) tr.className='selected';
    tr.innerHTML=`
      <td>${x.reference}</td>
      <td>${x.designation}</td>
      <td>${x.dimensions||'—'}</td>
      <td>${x.poids?x.poids+' kg':'—'}</td>
      <td><input class="qty" type="number" min="0" step="1" value="${qty}" data-ref="${x.reference}"></td>`;
    tbody.appendChild(tr);
  });

  updateSummary();
}

function updateSummary(){
  let lines=0,total=0,weight=0;
  for(const x of items){
    const n=Number(quantities[x.reference]||0);
    if(n>0){
      lines++;
      total+=n;
      weight+=n*Number((x.poids||'0').replace(',','.'));
    }
  }
  document.querySelector('#lineCount').textContent=`${lines} article${lines>1?'s':''} sélectionné${lines>1?'s':''}`;
  document.querySelector('#totalQty').textContent=`Quantité totale : ${total}`;
  document.querySelector('#totalWeight').textContent=`Poids estimé : ${fmt(weight)} kg`;
}

function calculateFacade(){
  const bays=Math.max(1,Number(document.querySelector('#bayCount').value||1));
  const bayLength=Number(document.querySelector('#bayLength').value);
  const height=Math.max(2,Number(document.querySelector('#height').value||2));
  const deckLevels=Math.max(1,Number(document.querySelector('#deckLevels').value||1));
  const guardrailType=document.querySelector('#guardrailType').value;

  const twoMetreLifts=Math.floor(height/2);
  const needsOneMetreTop=(height%2)>=0.5;
  const standards=bays+1;

  quantities={};

  // Base simple
  setQty('04101004', standards*2); // socles
  setQty('04002004', standards*twoMetreLifts); // cadres 2 m
  if(needsOneMetreTop) setQty('04002005', standards); // demi-cadres 1 m

  // Longeron correspondant à la maille, deux files par niveau
  const ledgerRefs={
    '3':'04204011',
    '2.5':'04204010',
    '2':'04204009',
    '1.5':'04204008'
  };
  setQty(ledgerRefs[String(bayLength)], bays*(twoMetreLifts+1)*2);

  // Diagonales : estimation minimale d'une travée diagonalisée par niveau
  const diagRefs={
    '3':'04005005',
    '2.5':'04005006',
    '2':'04005007',
    '1.5':'04005008'
  };
  setQty(diagRefs[String(bayLength)], Math.max(1,twoMetreLifts));

  // Garde-corps / plinthes : une face extérieure par travée et par niveau planché
  const fusioRefs={
    '3':'04004043',
    '2.5':'04004044',
    '2':'04004046',
    '1.5':'04004047'
  };
  const standardGcRefs={
    '3':'04004010',
    '2.5':'04004011',
    '2':'04004012',
    '1.5':'04004013'
  };
  const plinthRefs={
    '3':'04010201',
    '2.5':'04010202',
    '2':'04010204',
    '1.5':'04010205'
  };

  if(guardrailType==='fusio'){
    setQty(fusioRefs[String(bayLength)], bays*deckLevels);
  }else{
    setQty(standardGcRefs[String(bayLength)], bays*deckLevels);
    setQty(plinthRefs[String(bayLength)], bays*deckLevels);
  }

  save();
  render();

  const length=bays*bayLength;
  document.querySelector('#calcInfo').textContent=
    `Estimation créée pour ${fmt(length)} m de façade et ${fmt(height)} m de hauteur.`;
}

tbody.addEventListener('input',e=>{
  if(!e.target.matches('.qty')) return;
  quantities[e.target.dataset.ref]=Math.max(0,Number(e.target.value||0));
  e.target.closest('tr').classList.toggle('selected',quantities[e.target.dataset.ref]>0);
  updateSummary();
  save();
});

search.addEventListener('input',render);

document.querySelector('#showSelected').onclick=e=>{
  onlySelected=!onlySelected;
  e.target.textContent=onlySelected?'Voir toute la liste':'Voir seulement les quantités';
  render();
};

document.querySelector('#resetBtn').onclick=()=>{
  if(confirm('Remettre toutes les quantités à zéro ?')){
    quantities={};
    save();
    render();
  }
};

document.querySelector('#calculateBtn').onclick=calculateFacade;
document.querySelector('#saveBtn').onclick=save;
document.querySelector('#printBtn').onclick=()=>window.print();

document.querySelector('#exportCsv').onclick=()=>{
  const rows=[['Référence','Désignation','Dimensions','Poids unitaire kg','Quantité','Poids total kg']];
  items.forEach(x=>{
    const n=Number(quantities[x.reference]||0);
    if(n>0){
      rows.push([
        x.reference,x.designation,x.dimensions,x.poids,n,
        (n*Number((x.poids||'0').replace(',','.'))).toFixed(1).replace('.',',')
      ]);
    }
  });
  const csv=rows.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(';')).join('\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='liste-materiel-scaffr200.csv';
  a.click();
  URL.revokeObjectURL(a.href);
};

fetch('catalogue.json')
  .then(r=>r.json())
  .then(data=>{items=data;render();})
  .catch(()=>{
    tbody.innerHTML='<tr><td colspan="5">Impossible de charger catalogue.json. Vérifiez que tous les fichiers sont bien dans le dépôt GitHub.</td></tr>';
  });
