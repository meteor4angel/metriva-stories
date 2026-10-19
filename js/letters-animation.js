(()=>{'use strict';
const modal=document.getElementById('modal'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
let current=null,timer=null;
function stop(){if(timer)clearInterval(timer);timer=null;current=null;}
function bind(){
  const actor=modal.classList.contains('hidden')?null:modal.querySelector('.letters-actor');
  if(actor===current)return;stop();if(!actor)return;current=actor;
  const face=actor.querySelector('[data-letter-face-a]'),other=actor.querySelector('[data-letter-face-b]'),blink=actor.querySelector('[data-letter-blink]');
  if(!face||!blink)return;
  const expression=actor.dataset.expression||'neutral',reaction=['warm','concerned'].includes(expression)&&actor.dataset.reactionSprite;
  actor.style.setProperty('--frame','0');
  face.style.setProperty('--face-frame',expression==='listening'?'2':'0');
  face.style.backgroundImage=reaction?`url('${actor.dataset.reactionSprite}')`:'var(--sprite)';
  face.style.backgroundSize=reaction?'200% 100%':'400% 100%';
  face.style.backgroundPosition=reaction?(expression==='warm'?'0% center':'100% center'):(expression==='listening'?'66.6666667% center':'0% center');
  face.style.transform=reaction?`translate(${Number(actor.dataset.faceOffsetX)||0}%,${Number(actor.dataset.faceOffsetY)||0}%)`:'translate(0,0)';
  face.style.opacity='1';if(other)other.style.opacity='0';blink.classList.remove('is-blinking');
  const stage=actor.closest('.letters-vn');if(reduce.matches||stage.classList.contains('motion-paused'))return;
  // Text dialogue has no word-level timing, so animate one held mouth shape per sentence.
  const started=performance.now(),speaking=actor.dataset.speaking==='true';
  const expressive=Boolean(other&&actor.dataset.talkingReactions);
  const line=actor.dataset.dialogueText||'';
  const duration=Math.max(3000,Math.min(18000,line.length*78));
  const sentences=[];let sentenceStart=0;
  for(let i=0;i<line.length;i++)if(/[.!?]/.test(line[i])){
    const part=line.slice(sentenceStart,i).trim();if(part)sentences.push({start:sentenceStart,words:part.split(/\s+/).length});
    sentenceStart=i+1;
  }
  const ending=line.slice(sentenceStart).trim();if(ending)sentences.push({start:sentenceStart,words:ending.split(/\s+/).length});
  if(!sentences.length)sentences.push({start:0,words:Math.max(1,line.split(/\s+/).length)});
  const speechMoments=sentences.flatMap((part,partIndex)=>{
    const begin=Math.max(120,(part.start/Math.max(1,line.length))*duration+180);
    const count=Math.min(5,Math.max(2,Math.ceil(part.words/4)));
    const span=Math.min(1700,Math.max(620,part.words*95));
    const stride=span/count;
    return Array.from({length:count},(_,i)=>({
      start:begin+i*stride,
      end:begin+i*stride+Math.min(260,stride*.72),
      frame:(partIndex+i)%2
    }));
  });
  const pauseMoments=[];for(let i=0;i<line.length;i++)if(/[,.!?;:]/.test(line[i])){
    const at=(i/Math.max(1,line.length))*duration;pauseMoments.push({start:at,end:at+320});
  }
  let expressionBeats=[];
  try{expressionBeats=JSON.parse(actor.dataset.expressionBeats||'[]').map(beat=>{const i=line.indexOf(beat.after);return i<0?null:{start:(i+beat.after.length)/Math.max(1,line.length)*duration,end:(i+beat.after.length)/Math.max(1,line.length)*duration+780,face:beat.face};}).filter(Boolean);}catch{}
  const hasCeliaBeats=actor.dataset.character==='celia'&&Boolean(actor.dataset.dialogueReactions)&&expressionBeats.length>0;
  let nextBlinkAt=started+2600+Math.random()*1600,blinkUntil=0;
  function draw(now){
    const elapsed=now-started,paused=stage.classList.contains('motion-paused');
    if(!paused&&now>=nextBlinkAt){blinkUntil=now+135;nextBlinkAt=now+3200+Math.random()*2500;}
    blink.classList.toggle('is-blinking',!paused&&now<blinkUntil);
    const talking=!paused&&speaking&&elapsed<duration;
    const thoughtful=talking&&pauseMoments.some(m=>elapsed>=m.start&&elapsed<m.end);
    const speechMoment=talking&&!thoughtful&&speechMoments.find(m=>elapsed>=m.start&&elapsed<m.end);
    const celiaBeat=hasCeliaBeats&&talking&&expressionBeats.find(m=>elapsed>=m.start&&elapsed<m.end);
    if(celiaBeat){
      other.style.backgroundImage=`url('${actor.dataset.dialogueReactions}')`;other.style.backgroundSize='200% 100%';
      other.style.backgroundPosition=celiaBeat.face==='reflective'?'0% center':'100% center';other.style.transform=face.style.transform;other.style.opacity='1';
    }else if(hasCeliaBeats){
      if(speechMoment&&expressive){
        other.style.backgroundImage=`url('${actor.dataset.talkingReactions}')`;other.style.backgroundSize='200% 100%';
        other.style.backgroundPosition=speechMoment.frame?'100% center':'0% center';other.style.transform=face.style.transform;other.style.opacity='1';
      }else other.style.opacity='0';
    }else if(thoughtful){
      other.style.backgroundImage='var(--sprite)';other.style.backgroundSize='400% 100%';
      other.style.backgroundPosition='66.6666667% center';other.style.transform='translate(0,0)';other.style.opacity='1';
    }else if(speechMoment&&expressive){
      // A few slow, varied mouth shapes per sentence; keep pauses and emotion readable.
      other.style.backgroundImage=`url('${actor.dataset.talkingReactions}')`;other.style.backgroundSize='200% 100%';
      other.style.backgroundPosition=speechMoment.frame?'100% center':'0% center';
      other.style.transform=face.style.transform;other.style.opacity='1';
    }else other.style.opacity='0';
  }
  draw(started);
  if(reduce.matches||stage.classList.contains('motion-paused')){other.style.opacity='0';return;}
  timer=setInterval(()=>{if(!actor.isConnected||modal.classList.contains('hidden')){stop();return;}draw(performance.now());},50);
}
new MutationObserver(bind).observe(modal,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});reduce.addEventListener('change',()=>{stop();bind();});window.addEventListener('pagehide',stop);bind();
})();
