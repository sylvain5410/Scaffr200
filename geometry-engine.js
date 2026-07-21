(function(global){
  'use strict';
  const EPS=1e-6;
  const sum=a=>a.reduce((s,v)=>s+(+v||0),0);
  function cumulative(seq){const a=[0];seq.forEach(v=>a.push(a[a.length-1]+(+v||0)));return a;}
  function extension(d){
    const w=+d.width||.73,m=d.extendMode||'none';
    return {left:(m==='left'||m==='both')?w:0,right:(m==='right'||m==='both')?w:0};
  }
  function sequence(d){
    if(Array.isArray(d.baySequence)&&d.baySequence.length)return d.baySequence.map(Number).filter(v=>v>EPS);
    const order=[3,2.5,2,1.5,1.2,.8,.44],out=[];
    order.forEach(l=>{for(let i=0;i<(+((d.bays||{})[l])||0);i++)out.push(l)});
    return out;
  }
  function part(type,facade,points,meta={}){return {id:`${facade}-${type}-${Math.random().toString(36).slice(2,9)}`,type,facade,points,meta};}
  function buildFacade(key,d){
    if(!d||!d.enabled)return {key,enabled:false,parts:[],sequence:[],total:0,buildingLength:0};
    const seq=sequence(d),xs=cumulative(seq),total=sum(seq),width=+d.width||.73,height=+d.height||2,levels=Math.max(1,Math.round(+d.levels||1));
    const ext=extension(d),buildingLength=Math.max(.2,total-ext.left-ext.right),parts=[];
    const top=height+1.05+(d.rehausse?1:0);
    xs.forEach((u,i)=>{
      parts.push(part('post',key,[[u,0,0],[u,top,0]],{row:'outer',index:i}));
      parts.push(part('post',key,[[u,0,width],[u,top,width]],{row:'inner',index:i}));
    });
    for(let lv=1;lv<=levels;lv++){
      const y=height/levels*lv,y0=height/levels*(lv-1);
      seq.forEach((len,i)=>{
        const a=xs[i],b=xs[i+1];
        parts.push(part('deck',key,[[a,y,0],[b,y,0],[b,y,width],[a,y,width]],{level:lv,length:len}));
        parts.push(part('toeBoard',key,[[a,y,0],[b,y,0]],{level:lv,length:len}));
        parts.push(part('rail',key,[[a,y+.5,0],[b,y+.5,0]],{level:lv,kind:'mid'}));
        parts.push(part('rail',key,[[a,y+1,0],[b,y+1,0]],{level:lv,kind:'top'}));
      });
      [0,total].forEach(u=>{
        parts.push(part('endRail',key,[[u,y+.5,0],[u,y+.5,width]],{level:lv,kind:'mid'}));
        parts.push(part('endRail',key,[[u,y+1,0],[u,y+1,width]],{level:lv,kind:'top'}));
        parts.push(part('endToeBoard',key,[[u,y,0],[u,y,width]],{level:lv}));
      });
      const diag=(d.diagBays||[]).length?d.diagBays:Array.from({length:Math.max(1,Math.ceil(seq.length/4))},(_,i)=>Math.min(i*4,seq.length-1));
      diag.forEach(i=>{if(i<seq.length){const rev=lv%2===0;parts.push(part('diagonal',key,[[rev?xs[i+1]:xs[i],y0,0],[rev?xs[i]:xs[i+1],y,0]],{level:lv,bay:i}));}});
    }
    if(d.rehausse){
      seq.forEach((len,i)=>{
        parts.push(part('rail',key,[[xs[i],height+1.5,0],[xs[i+1],height+1.5,0]],{kind:'rehausse-mid'}));
        parts.push(part('rail',key,[[xs[i],height+2,0],[xs[i+1],height+2,0]],{kind:'rehausse-top'}));
      });
    }
    return {key,name:d.name||key,enabled:true,sequence:seq,total,width,height,levels,extensions:ext,buildingLength,parts};
  }
  function buildProjectModel(state){
    const facades={};['A','B','C','D'].forEach(k=>facades[k]=buildFacade(k,state.facades&&state.facades[k]));
    const active=Object.values(facades).filter(f=>f.enabled);
    const pick=(a,b)=>facades[a].enabled?facades[a]:facades[b];
    const ns=[facades.A,facades.C].filter(f=>f.enabled),ew=[facades.B,facades.D].filter(f=>f.enabled);
    const building={length:Math.max(.2,...ns.map(f=>f.buildingLength),...(active.length?[active[0].buildingLength]:[.2])),depth:Math.max(.2,...ew.map(f=>f.buildingLength),...(active.length?[active[0].buildingLength]:[.2])),height:Math.max(2,...active.map(f=>f.height*.82))};
    const parts=active.flatMap(f=>f.parts);
    const counts=parts.reduce((o,p)=>(o[p.type]=(o[p.type]||0)+1,o),{});
    return {version:'6.0',facades,active,building,parts,counts,generatedAt:new Date().toISOString()};
  }
  global.ScaffGeometry={buildProjectModel,buildFacade,sequence,extension};
})(window);