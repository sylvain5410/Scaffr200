(function(){
'use strict';
class Component{
  constructor(data={}){
    this.reference=String(data.reference||'').trim();
    this.designation=String(data.designation||this.reference||'Composant').trim();
    this.dimensions=String(data.dimensions||'').trim();
    this.section=String(data.section||'Autres composants').trim();
    this.weightKg=Component.parseWeight(data.weightKg??data.poids);
    this.provisional=Boolean(data.provisional)||this.reference.startsWith('AUTO-');
  }
  static parseWeight(value){
    if(typeof value==='number')return Number.isFinite(value)?value:0;
    const n=Number(String(value??'0').replace(',','.').replace(/[^0-9.-]/g,''));
    return Number.isFinite(n)&&n>=0?n:0;
  }
  toJSON(){return {reference:this.reference,designation:this.designation,dimensions:this.dimensions,section:this.section,poids:this.weightKg,weightKg:this.weightKg,provisional:this.provisional}}
}
class ComponentCatalog{
  constructor(rows=[]){this.base=new Map();this.current=new Map();rows.forEach(r=>{const c=new Component(r);if(c.reference){this.base.set(c.reference,c);this.current.set(c.reference,new Component(c.toJSON()));}})}
  get size(){return this.current.size}
  has(ref){return this.current.has(String(ref))}
  get(ref){const key=String(ref);if(!this.current.has(key))this.current.set(key,new Component({reference:key,designation:'Référence '+key,section:'À identifier',provisional:true}));return this.current.get(key)}
  values(){return [...this.current.values()]}
  register(data){const c=new Component(data);if(!c.reference)throw new Error('Référence obligatoire');this.current.set(c.reference,c);return c}
  isBase(ref){return this.base.has(String(ref))}
  isModified(ref){const k=String(ref),a=this.base.get(k),b=this.current.get(k);if(!b)return false;if(!a)return true;return JSON.stringify(a.toJSON())!==JSON.stringify(b.toJSON())}
  restore(ref){const k=String(ref);if(this.base.has(k))this.current.set(k,new Component(this.base.get(k).toJSON()));else this.current.delete(k)}
  restoreAll(){this.current=new Map([...this.base].map(([k,v])=>[k,new Component(v.toJSON())]))}
  search(term,limit=40){const t=String(term||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return this.values().filter(c=>!t||`${c.reference} ${c.designation} ${c.dimensions} ${c.section}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(t)).slice(0,limit)}
  exportData(){return this.values().map(c=>c.toJSON())}
}
class BomEngine{
  constructor(catalog){this.catalog=catalog;this.reset()}
  reset(){this.quantities={};this.ledger={};this.instances=[]}
  add(reference,quantity,origin='Calcul automatique'){
    const ref=String(reference||'').trim(),qty=Number(quantity||0);if(!ref||!Number.isFinite(qty)||qty===0)return;
    this.catalog.get(ref);this.quantities[ref]=(this.quantities[ref]||0)+qty;
    if(!this.ledger[ref])this.ledger[ref]={};this.ledger[ref][origin]=(this.ledger[ref][origin]||0)+qty;
    this.instances.push({id:`P-${this.instances.length+1}`,reference:ref,quantity:qty,origin});
  }
  toQuantityObject(){return Object.fromEntries(Object.entries(this.quantities).map(([k,v])=>[k,Math.round(v)]))}
  toLedgerObject(){return JSON.parse(JSON.stringify(this.ledger))}
  summary(){return {lines:Object.keys(this.quantities).length,instances:this.instances.reduce((s,x)=>s+x.quantity,0),families:new Set(Object.keys(this.quantities).map(r=>this.catalog.get(r).section)).size}}
  exportModel(){return {schema:'scaffr200-project-model-2',version:'9.0',exportedAt:new Date().toISOString(),components:this.catalog.exportData(),bom:this.toQuantityObject(),ledger:this.toLedgerObject(),instances:this.instances}}
}
window.Component=Component;
window.COMPONENT_CATALOG=new ComponentCatalog(window.ITEMS||[]);
window.BOM_ENGINE=new BomEngine(window.COMPONENT_CATALOG);
})();
