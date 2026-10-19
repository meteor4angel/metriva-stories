(()=>{'use strict';
const modal=document.getElementById('modal'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
let timer=null,current=null;
function stop(){if(timer)clearInterval(timer);timer=null;current=null}
function bind(){
  const image=modal.classList.contains('hidden')?null:modal.querySelector('.days-actor img[data-character]');
  if(image===current)return;
  stop();if(!image)return;current=image;
  const actor=image.closest('.days-actor'),stage=image.closest('.days-vn');
  const who=window.DAYS_CAST[image.dataset.character],frames=who.images,base=image.dataset.expression||'idle';
  const disabled=reduce.matches||stage.classList.contains('motion-paused');
  const spoken=image.dataset.speaking==='true';
  actor.classList.toggle('is-theo',image.dataset.character==='theo');
  actor.classList.toggle('is-speaking',spoken&&!disabled);
  image.dataset.frame=base;image.src=frames[base];
  if(disabled)return;
  const start=performance.now();
  const speakFor=spoken?Math.min(7000,Math.max(2200,(image.dataset.dialogueText||'').length*55)):0;
  if(image.dataset.character==='theo'){
    // Each pose has its own blink: never jump to an upright pose while listening.
    const blinkFrame=base==='thoughtful'?'thoughtfulBlink':'blink';
    const loaded={};
    for(const key of ['thoughtful','thoughtfulBlink','soft','speaking','emphasis','blink']){
      if(!frames[key])continue;
      const preloaded=new Image();loaded[key]=preloaded;preloaded.src=frames[key];
    }
    let nextBlink=start+1700,blinkUntil=0;
    timer=setInterval(()=>{
      if(!image.isConnected||modal.classList.contains('hidden')){stop();return}
      const now=performance.now(),elapsed=now-start;
      if(now>=nextBlink){blinkUntil=now+210;nextBlink=now+3200+Math.random()*1400}
      const blinking=now<blinkUntil&&loaded[blinkFrame]?.complete&&loaded[blinkFrame]?.naturalWidth>0;
      const talking=spoken&&(image.dataset.audioManaged==='true'?image.dataset.audioSpeaking==='true':elapsed<speakFor);
      actor.classList.toggle('is-speaking',talking);
      const beat=elapsed%2600;
      const frame=blinking?blinkFrame:base==='thoughtful'?base:!talking||beat<250||beat>2420?'idle':beat<700?'soft':beat<1080?'speaking':beat<1450?'soft':beat<1850?'emphasis':beat<2150?'speaking':'soft';
      if(image.dataset.frame!==frame){image.src=frames[frame];image.dataset.frame=frame}
    },70);
    return;
  }
  let blinkAt=start+1900,blinkUntil=0;
  timer=setInterval(()=>{
    if(!image.isConnected||modal.classList.contains('hidden')){stop();return}
    const now=performance.now(),elapsed=now-start;
    if(now>=blinkAt){blinkUntil=now+170;blinkAt=now+4200}
    let frame=base;
    if(now<blinkUntil)frame='blink';
    else if(spoken&&(image.dataset.audioManaged==='true'?image.dataset.audioSpeaking==='true':elapsed<speakFor)){
      if(frames.soft){
        const beat=elapsed%2800;
        frame=beat<450?'idle':beat<1150?'soft':beat<1750?'speaking':beat<2400?'soft':'idle';
      }else{
        const beat=elapsed%2400;
        frame=beat<350?'idle':beat<1050?'speaking':beat<1350?'idle':beat<2050?'emphasis':'speaking';
      }
    }
    actor.classList.toggle('is-speaking',spoken&&(image.dataset.audioManaged==='true'?image.dataset.audioSpeaking==='true':elapsed<speakFor));
    if(image.dataset.frame!==frame){image.src=frames[frame];image.dataset.frame=frame}
  },85);
}
new MutationObserver(bind).observe(modal,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
reduce.addEventListener('change',()=>{stop();bind()});window.addEventListener('pagehide',stop);bind();
})();
