(()=>{'use strict';
const modal=document.getElementById('modal'),KEY='metrivastories_story05_voices';
const player=new Audio();player.preload='auto';player.volume=.9;
let current=null,entry=null,muted=false,generation=0,waitCancel=null;
try{muted=localStorage.getItem(KEY)==='muted'}catch{}
const clean=text=>String(text||'').replace(/[“”]/g,'').trim();
const HEARD_KEY='metrivastories_story05_heard_v1';
let heard=new Set();
try{const saved=JSON.parse(localStorage.getItem(HEARD_KEY)||'[]');if(Array.isArray(saved))heard=new Set(saved.filter(x=>typeof x==='string'))}catch{}
const heardId=(who,text)=>JSON.stringify([who,clean(text)]);
window.DAYS_HEARD={has:(who,text)=>heard.has(heardId(who,text))};
function markHeard(image){
  heard.add(heardId(image.dataset.character,image.dataset.dialogueText));
  try{localStorage.setItem(HEARD_KEY,JSON.stringify([...heard]))}catch{}
  image.dataset.voiceHeard='true';
}
function status(text){const node=modal.querySelector('.days-voice-status');if(node)node.textContent=text}
function stop(){
  generation++;
  if(waitCancel){waitCancel();waitCancel=null}
  player.onplaying=player.ontimeupdate=player.onended=player.onerror=player.onpause=null;
  player.pause();
  if(current)current.dataset.audioSpeaking='false';
}
function controls(){
  const mute=modal.querySelector('[data-action="days-toggle-voices"]');
  if(mute){mute.textContent=muted?'Enable voices':'Mute voices';mute.setAttribute('aria-pressed',String(!muted))}
}
function ready(){
  if(player.readyState>=4)return Promise.resolve(true);
  return new Promise(resolve=>{
    let timeout;
    const finish=ok=>{clearTimeout(timeout);player.removeEventListener('canplaythrough',loaded);player.removeEventListener('error',failed);if(waitCancel===cancel)waitCancel=null;resolve(ok)};
    const loaded=()=>finish(true),failed=()=>finish(false),cancel=()=>finish(false);
    waitCancel=cancel;player.addEventListener('canplaythrough',loaded,{once:true});player.addEventListener('error',failed,{once:true});timeout=setTimeout(failed,15000);
  });
}
async function play(){
  if(!current||!entry||muted)return;
  stop();const image=current,clip=entry,token=generation;
  const speaker=window.DAYS_CAST?.[image.dataset.character]?.name||(image.dataset.character==='theo'?'Theo':'Mira');
  image.dataset.audioSpeaking='false';image.dataset.voiceState='loading';status('Loading voice…');
  const valid=()=>token===generation&&current===image&&image.isConnected&&!muted;
  const sync=()=>{
    if(!valid())return;
    const speaking=!player.paused&&player.currentTime>=clip.speechStart&&player.currentTime<=clip.speechEnd;
    image.dataset.audioSpeaking=String(speaking);image.dataset.voiceState=speaking?'playing':'waiting';
    status(speaking?`${speaker} is speaking…`:'');
  };
  player.onplaying=sync;player.ontimeupdate=sync;
  player.onpause=()=>{if(valid())image.dataset.audioSpeaking='false'};
  player.onended=()=>{if(valid()){image.dataset.audioSpeaking='false';image.dataset.voiceState='finished';markHeard(image);status('✓ Voice heard')}};
  player.onerror=()=>{if(valid()){image.dataset.audioSpeaking='false';image.dataset.voiceState='error';status('Voice unavailable. You can continue reading.')}};
  // A persistent player, fully buffered media, and a file-level lead-in protect
  // sentence openings. Never seek past the lead-in or fade in over spoken words.
  player.src=new URL(clip.file,document.baseURI).href;
  const buffered=ready();player.load();
  if(!await buffered||!valid())return;
  player.currentTime=0;
  try{await player.play();if(!valid())return;const replay=modal.querySelector('[data-action="days-replay-voice"]');if(replay)replay.textContent='Replay voice'}
  catch(error){if(valid()){image.dataset.audioSpeaking='false';image.dataset.voiceState='ready';status(error.name==='NotAllowedError'?'Select Play voice to listen.':'Voice unavailable. You can continue reading.')}}
}
function bind(){
  const image=modal.classList.contains('hidden')?null:modal.querySelector('.days-actor img[data-character]');
  if(image===current)return;
  stop();current=image;entry=null;if(!image)return;
  if(image.dataset.speaking!=='true')return;
  entry=window.DAYS_VOICES?.[JSON.stringify([image.dataset.character,clean(image.dataset.dialogueText)])];
  if(!entry)return;
  image.dataset.audioManaged='true';image.dataset.audioSpeaking='false';
  const footer=modal.querySelector('.days-controls');
  const previouslyHeard=window.DAYS_HEARD.has(image.dataset.character,image.dataset.dialogueText);
  image.dataset.voiceHeard=String(previouslyHeard);
  footer.insertAdjacentHTML('afterbegin',`<button class="quiet" data-action="days-toggle-voices" aria-pressed="${!muted}">${muted?'Enable voices':'Mute voices'}</button><button class="quiet" data-action="days-replay-voice">${previouslyHeard?'Replay voice':'Play voice'}</button>`);
  footer.insertAdjacentHTML('afterend','<p class="days-voice-status" role="status" aria-live="polite"></p>');
  if(previouslyHeard)status('✓ Previously heard');
  if(!muted)play();
}
document.addEventListener('click',event=>{
  if(event.target.closest('[data-action="days-toggle-voices"]')){
    muted=!muted;try{localStorage.setItem(KEY,muted?'muted':'enabled')}catch{}
    controls();if(muted){stop();status('Voices muted')}else play();
  }else if(event.target.closest('[data-action="days-replay-voice"]')){
    muted=false;try{localStorage.setItem(KEY,'enabled')}catch{}controls();play();
  }
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();status('Select Play voice to listen again.')}});
new MutationObserver(bind).observe(modal,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
window.addEventListener('pagehide',stop);bind();
})();
