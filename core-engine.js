class Component {
  constructor(data={}) {
    this.reference=String(data.reference||'').trim();
    this.designation=String(data.designation||this.reference).trim();
    this.dimensions=String(data.dimensions||'').trim();
    this.section=String(data.section||'Matériel ajouté').trim();
    this.weightKg=Component.parseWeight(data.poids);
    this.provisional=this.reference.startsWith('AUTO-')||this.weightKg<=0;
    Object.freeze(this);
  }
  static parseWeight(value) { return Number(String(value??'0').replace(',','.'))||0; }
  get poids() { return String(this.weightKg).replace('.',','); }
  toJSON() {
    return {reference:this.reference,designation:this.designation,dimensions:this.dimensions,
      section:this.section,poids:this.weightKg,provisional:this.provisional};
  }
}
class ComponentCatalog {
  constructor(items=[]) {
    this.components=new Map();
    this.baseComponents=new Map();
    items.forEach(raw=>{
      const component=this.register(raw);
      this.baseComponents.set(component.reference,component);
    });
  }
  register(raw) {
    const component=raw instanceof Component?raw:new Component(raw);
    if(component.reference)this.components.set(component.reference,component);
    return component;
  }
  get(reference) {
    return this.components.get(reference)||new Component({reference,designation:reference,poids:0});
  }
  has(reference) { return this.components.has(reference); }
  isBase(reference) { return this.baseComponents.has(reference); }
  isModified(reference) {
    const base=this.baseComponents.get(reference),current=this.components.get(reference);
    if(!current)return false;
    if(!base)return true;
    return JSON.stringify(base.toJSON())!==JSON.stringify(current.toJSON());
  }
  restore(reference) {
    if(this.baseComponents.has(reference))this.components.set(reference,this.baseComponents.get(reference));
    else this.components.delete(reference);
  }
  restoreAll() { this.components=new Map(this.baseComponents); }
  values() { return [...this.components.values()]; }
  search(term,limit=40) {
    const needle=String(term||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    if(!needle)return [];
    return this.values().filter(c=>
      `${c.reference} ${c.designation} ${c.section} ${c.dimensions}`
        .normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(needle)
    ).slice(0,limit);
  }
  get size() { return this.components.size; }
  exportData() { return this.values().map(c=>c.toJSON()); }
}
class BomLine {
  constructor(reference) { this.reference=reference;this.quantity=0;this.origins=new Map(); }
  add(quantity,origin='Calcul automatique') {
    const amount=Math.round(Number(quantity)||0);if(!amount)return;
    this.quantity+=amount;
    this.origins.set(origin,(this.origins.get(origin)||0)+amount);
    if(this.origins.get(origin)===0)this.origins.delete(origin);
  }
}
class BomEngine {
  constructor(catalog) { this.catalog=catalog;this.lines=new Map();this.revision=0; }
  reset() { this.lines.clear();this.revision++; }
  add(reference,quantity,origin='Calcul automatique') {
    if(!reference||!quantity)return;
    const line=this.lines.get(reference)||new BomLine(reference);
    line.add(quantity,origin);
    if(line.quantity===0)this.lines.delete(reference);else this.lines.set(reference,line);
  }
  entries() { return [...this.lines.values()].filter(line=>line.quantity>0); }
  toQuantityObject() { return Object.fromEntries(this.entries().map(line=>[line.reference,line.quantity])); }
  toLedgerObject() {
    return Object.fromEntries(this.entries().map(line=>[
      line.reference,Object.fromEntries([...line.origins.entries()].filter(([,v])=>v!==0))
    ]));
  }
  summary() {
    const lines=this.entries();
    const quantity=lines.reduce((sum,line)=>sum+line.quantity,0);
    const weight=lines.reduce((sum,line)=>sum+this.catalog.get(line.reference).weightKg*line.quantity,0);
    const families=new Set(lines.map(line=>this.catalog.get(line.reference).section));
    const provisional=lines.reduce((sum,line)=>sum+(this.catalog.get(line.reference).provisional?line.quantity:0),0);
    return {lines:lines.length,quantity,weight,families:families.size,provisional,revision:this.revision};
  }
  exportModel() {
    return {schema:'scaffr200-bom-1',generatedAt:new Date().toISOString(),revision:this.revision,
      lines:this.entries().map(line=>({component:this.catalog.get(line.reference).toJSON(),
        quantity:line.quantity,origins:Object.fromEntries(line.origins)}))};
  }
}
const COMPONENT_CATALOG=new ComponentCatalog(ITEMS);
const BOM_ENGINE=new BomEngine(COMPONENT_CATALOG);