/* Responsive hotspot collision avoidance for every story scene. */
(()=>{
  function position(){
    document.querySelectorAll('.scene').forEach(scene=>{
      const els=[...scene.querySelectorAll('.hotspot')];
      if(!els.length)return;
      const w=scene.clientWidth||800,h=scene.clientHeight||460;
      const r=27,top=r,bottom=h-r,gap=58;
      const p=els.map((el,i)=>({el,x:Math.max(r,Math.min(w-r,parseFloat(el.dataset.originalX||el.style.left)*w/100)),y:Math.max(top,Math.min(bottom,parseFloat(el.dataset.originalY||el.style.top)*h/100))}));
      els.forEach((el,i)=>{if(!el.dataset.originalX){el.dataset.originalX=parseFloat(el.style.left);el.dataset.originalY=parseFloat(el.style.top)}});
      for(let k=0;k<90;k++){
        for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++){
          const a=p[i],b=p[j];let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
          if(d<gap){if(d<.01){dx=1;dy=1;d=Math.SQRT2}const v=(gap-d)/2+.2;a.x-=dx/d*v;a.y-=dy/d*v;b.x+=dx/d*v;b.y+=dy/d*v}
        }
        p.forEach(v=>{v.x=Math.max(r,Math.min(w-r,v.x));v.y=Math.max(top,Math.min(bottom,v.y))});
      }
      p.forEach(v=>{v.el.style.left=(v.x/w*100).toFixed(3)+'%';v.el.style.top=(v.y/h*100).toFixed(3)+'%'});
    });
  }
  const app=document.getElementById('app');
  if(app)new MutationObserver(position).observe(app,{childList:true,subtree:true});
  position();window.addEventListener('resize',position);
})();
