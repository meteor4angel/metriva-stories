(() => {
  'use strict';

  const story = window.LETTERS;
  const KEY = 'metrivastories_letters_after_midnight_v01';
  const evidenceData=window.LETTERS_EVIDENCE_DATA,dialogueData=window.LETTERS_DIALOGUE_DATA,hintData=window.LETTERS_HINT_DATA;
  const {masters,positions}=evidenceData;
  const {people,alex}=dialogueData;
  const puzzleData = {
    pages:{title:'Restore the Torn Letter',description:'Use the torn edges and the writing across the pages.',items:[['A','A · Dear Julian'],['B','B · The stairs were closed'],['D','D · I hope you understand'],['C','C · I waited by the station']],answer:['A','C','B','D']},
    years:{title:'Arrange the Unsent Years',description:'Order the dated letters from earliest to latest.',items:[['2004','Julian · April 2004'],['1987j','Julian · June 13, 1987'],['1995','Iris · September 1995'],['1987i','Iris · June 12, 1987']],answer:['1987i','1987j','1995','2004']},
    stars:{title:'The Three-Star Lock',description:'Follow the day from first light to last.',items:[['dusk','Dusk'],['dawn','Dawn'],['noon','Noon']],answer:['dawn','noon','dusk']}
  };
  const initial = () => ({chapter:0,found:[],solved:[],ending:null,asked:[],notebook:'evidence',transcript:[],met:[]});
  let state;
  try { state = {...initial(),...JSON.parse(localStorage.getItem(KEY)||'{}')}; } catch { state=initial(); }
  if(!Array.isArray(state.found)) state.found=[];
  if(!Array.isArray(state.solved)) state.solved=[];
  if(!Array.isArray(state.asked)) state.asked=[];
  state.chapter=Math.max(0,Math.min(4,Number(state.chapter)||0));
  state.transcript=Array.isArray(state.transcript)?state.transcript.filter(l=>l&&typeof l.speaker==='string'&&typeof l.text==='string').slice(-150):[];
  if(!['evidence','people','notes'].includes(state.notebook))state.notebook='evidence';
  state.met=Array.isArray(state.met)?state.met.filter(id=>['alex','celia','rowan'].includes(id)):[];
  Object.entries(people).forEach(([chapter,p])=>{if(state.found.includes(`${chapter}:${p.id}`)||state.found.includes(p.id)){const id=p.id.startsWith('rowan')?'rowan':p.id;if(!state.met.includes(id))state.met.push(id);}});
  let storageOK=true;
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}};
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ch=()=>story.chapters[state.chapter];
  const found=(id,i=state.chapter)=>state.found.includes(`${i}:${id}`)||(state.found.includes(id)&&(id!=='box'||i===1));
  const add=(id,i=state.chapter)=>{if(!found(id,i))state.found.push(`${i}:${id}`);save();};
  const solved=i=>state.solved.includes(i);
  const unlocked=()=>Math.min(4,state.solved.length);
  const evidence=()=>ch().spots.filter(s=>!people[state.chapter]||s.id!==people[state.chapter].id);
  const complete=()=>ch().required.every(id=>found(id));
  const modalRoot=document.getElementById('modal');
  let lastFocus=null;
  function close(){modalRoot.className='hidden';modalRoot.innerHTML='';conversation=null;lastFocus?.focus?.();}
  function modal(body,type=''){
    if(modalRoot.classList.contains('hidden'))lastFocus=document.activeElement;
    modalRoot.className='overlay';
    modalRoot.innerHTML=`<div class="dialog ${type}" role="dialog" aria-modal="true" aria-label="Story detail"><div class="dialog-top"><span class="eyebrow">Metriva · Letters After Midnight</span><button type="button" data-close aria-label="Close">✕</button></div>${body}</div>`;
    modalRoot.querySelector('[data-close]').onclick=close;
    modalRoot.querySelector('[data-close]').focus();
  }
  modalRoot.addEventListener('click',e=>{if(e.target===modalRoot)close();});
  document.addEventListener('keydown',e=>{if(modalRoot.classList.contains('hidden')||document.querySelector('.clue-zoom-overlay'))return;if(e.key==='Escape')close();if(e.key==='Tab'){const buttons=[...modalRoot.querySelectorAll('button:not(:disabled),a[href]')];if(!buttons.length)return;if(e.shiftKey&&document.activeElement===buttons[0]){e.preventDefault();buttons.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===buttons.at(-1)){e.preventDefault();buttons[0].focus();}}});
  function personArt(p,className='letters-portrait-thumb'){if(p.frames)return `<span class="${className}" role="img" aria-label="${esc(p.name)}" style="--sprite:url('${new URL(p.frames,document.baseURI).href}')"></span>`;return `<img class="${className}" src="${p.portrait}" alt="${esc(p.name)}">`;}
  function render(){
    const i=state.chapter,c=ch(),done=complete(),p=state.ending?100:Math.min(99,Math.round(99*(state.solved.length+story.chapters.reduce((sum,c,n)=>sum+c.spots.filter(s=>found(s.id,n)).length,0))/(story.chapters.reduce((sum,c)=>sum+c.spots.length,0)+5))),person=people[i];
    const spots=evidence();
    const actionHTML=state.ending
      ? '<button class="primary" id="review-ending">Review the ending →</button>'
      : `<button class="primary" id="puzzle" ${!done||solved(i)?'disabled':''}>Solve chapter puzzle →</button>${solved(i)&&i<4?'<button class="secondary" id="next">Next chapter →</button>':''}${solved(4)?'<button class="secondary" id="ending">Choose how to preserve the letters →</button>':''}<button class="quiet" id="hint">A gentle hint</button>`;
    const castHTML=`<div><hr class="divider"><h3>People here</h3><div class="story-cast"><button type="button" class="person-card" data-alex>${personArt(alex)}<span><strong>${alex.name}</strong><small>${alex.role}</small><em>Alex’s thoughts →</em></span></button>${person?`<button type="button" class="person-card" data-person>${personArt(person)}<span><strong>${esc(person.name)}</strong><small>${esc(person.role)}</small><em>${found(person.id)?'Speak again':'Talk and record testimony'} →</em></span></button>`:''}</div></div>`;
    document.getElementById('app').innerHTML=`
      <div class="heading"><div><span class="eyebrow">Story 04 · Early 2000s · Five chapters</span><h1>${esc(story.title)}</h1><p>One lost letter. Two people who kept writing. A truth waiting to be read.</p></div><button type="button" class="quiet" id="locations">Locations</button></div>
      <div class="chaptertabs" aria-label="Chapters">${story.chapters.map((x,n)=>`<button type="button" data-ch="${n}" class="${n===i?'active':''}" ${n===i?'aria-current="step"':''} ${n>unlocked()?'disabled':''}>${n+1}. ${esc(x.title)}</button>`).join('')}</div>
      <div class="game"><section class="scene-card"><div class="scene-title"><h2>${esc(c.title)}</h2><span>Chapter ${String(i+1).padStart(2,'0')} / 05</span></div><div class="scene ${i===0?'scene-attic':''}"><img class="scene-art" src="${masters[i]}" alt="${esc(c.title)} investigation scene">${spots.map((s,n)=>{const [x,y]=positions[i][s.id];return `<button type="button" class="hotspot ${found(s.id)?'done':''}" data-spot="${esc(s.id)}" style="--x:${x};--y:${y}" title="${esc(s.label)}" aria-label="Examine ${esc(s.label)}">${found(s.id)?'✓':n+1}</button>`}).join('')}${i===1?`<button type="button" class="hotspot person-marker ${found('rowan')?'done':''}" data-person style="--x:87;--y:33" title="Talk to Rowan" aria-label="Talk to Rowan">${found('rowan')?'✓':'5'}</button>`:''}</div><div class="scene-footer"><span>${esc(c.subtitle)}</span><span>${c.spots.filter(s=>!found(s.id)).length} clues left to examine</span></div><div class="objects">${spots.map((s,n)=>`<button type="button" data-spot="${esc(s.id)}" class="${found(s.id)?'done':''}">${n+1}. ${esc(s.label)} ${found(s.id)?'✓':''}</button>`).join('')}${i===1?`<button type="button" data-person class="${found('rowan')?'done':''}">5. Talk to Rowan ${found('rowan')?'✓':''}</button>`:''}</div></section>
      <aside class="panel panel-investigation"><div><h2>Investigation</h2><div class="meta">Case progress · ${p}%</div><div class="progress" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100" aria-label="Case progress"><span style="width:${p}%"></span></div><p class="story-intro">${esc(c.intro)}</p><div class="objective">${state.ending?'The letters have found their place.':solved(i)?'Chapter solved. Continue when ready.':done?'Every clue is recorded. Piece them together.':'Examine the scene and speak with anyone present.'}</div><div class="actions">${actionHTML}</div></div>${castHTML}</aside></div>
      <section class="notebook panel"><div class="notebook-header"><h2>Case notebook</h2><div class="notebook-tabs"><button type="button" data-tab="evidence" class="${state.notebook==='evidence'?'active':''}">Evidence</button><button type="button" data-tab="people" class="${state.notebook==='people'?'active':''}">People</button><button type="button" data-tab="notes" class="${state.notebook==='notes'?'active':''}">Notes</button></div></div><div id="notebook-content">${notebook()}</div></section><div class="case-tools"><p>${storageOK?'Progress is saved automatically in this browser.':'Browser storage is unavailable. Keep this page open to retain your progress.'}</p><button type="button" class="quiet" id="export-save">Export save</button><button type="button" class="quiet" id="import-save-button">Import save</button><input type="file" id="import-save" accept=".json,application/json" hidden><button type="button" class="quiet" id="restart">↺ Restart this story</button></div>`;
    document.getElementById('locations').onclick=showLocations;
    document.querySelectorAll('[data-evidence-chapter]').forEach(b=>b.onclick=()=>showClue(b.dataset.evidenceId,Number(b.dataset.evidenceChapter),false));
    document.querySelectorAll('[data-ch]').forEach(b=>b.onclick=()=>{if(Number(b.dataset.ch)>unlocked())return;state.chapter=Number(b.dataset.ch);save();render();window.scrollTo(0,0);});
    document.querySelectorAll('[data-spot]').forEach(b=>b.onclick=()=>showClue(b.dataset.spot));
    document.querySelectorAll('[data-person]').forEach(b=>b.onclick=showPerson);
    document.querySelectorAll('[data-alex]').forEach(b=>b.onclick=showAlex);
    document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{state.notebook=b.dataset.tab;save();render();});
    if(document.getElementById('puzzle'))document.getElementById('puzzle').onclick=showPuzzle;
    if(document.getElementById('next'))document.getElementById('next').onclick=()=>{state.chapter++;save();render();window.scrollTo(0,0);};
    if(document.getElementById('ending'))document.getElementById('ending').onclick=showEnding;
    if(document.getElementById('review-ending'))document.getElementById('review-ending').onclick=showEndingResult;
    if(document.getElementById('hint'))document.getElementById('hint').onclick=showHint;
    document.getElementById('restart').onclick=restartDialog;
    document.getElementById('export-save').onclick=exportSave;
    document.getElementById('import-save-button').onclick=()=>document.getElementById('import-save').click();
    document.getElementById('import-save').onchange=e=>{if(e.target.files?.length)importSave(e.target);};
  }
  function notebook(){
    if(state.notebook==='notes')return `<p>${esc(ch().intro)}</p><p class="note">${state.ending?'Iris and Julian’s letters have been preserved.':solved(state.chapter)?esc(ch().success):'Read the letters, compare their dates, and speak with anyone who remembers Iris or Julian.'}</p>`;
    if(state.notebook==='people'&&!state.met.length)return '<p class="meta">Speak with someone to begin your people notes. Alex’s own thoughts can be recorded from the People here panel.</p>';
    if(state.notebook==='people')return `<div class="people-book">${[alex,people[0],people[1]].filter(p=>state.met.includes(p.id||'alex')).map(p=>`<div>${personArt(p,'notebook-portrait letters-person-art')}<h3>${esc(p.name)}</h3><p>${esc(p.role)}</p></div>`).join('')}</div><div class="testimony-list">${Object.entries(people).filter(([i,p])=>found(p.id,Number(i))).map(([i,p])=>`<p><strong>Chapter ${String(Number(i)+1).padStart(2,'0')} · ${esc(p.name)}:</strong> ${esc(story.chapters[Number(i)].spots.find(s=>s.id===p.id).text)}</p>`).join('')||'<p>Speak with Celia or Rowan to record their memories.</p>'}</div>`;
    const cards=story.chapters.flatMap((c,i)=>c.spots.filter(s=>found(s.id,i)&&(!people[i]||s.id!==people[i].id)).map(s=>({s,i})));
    return `<div class="evidence-grid">${cards.length?cards.map(({s,i})=>`<button type="button" class="evidence-card" data-evidence-chapter="${i}" data-evidence-id="${s.id}" aria-label="Revisit ${esc(s.label)}"><img src="${i===0&&s.id==='envelope'?'assets/letters-c1-envelope-front.png':`assets/letters-c${i+1}-${s.id}.png`}" alt=""><span><small>Chapter ${String(i+1).padStart(2,'0')}</small><strong>${esc(s.clue)}</strong></span></button>`).join(''):'<p>Examine an object or speak to someone to begin your notebook.</p>'}</div>`;
  }
  function letterReading(id,zoom=false,chapterIndex=state.chapter){
    if(chapterIndex!==0||!['paper','edges'].includes(id))return '';
    const fragments=[['A','Dear Julian'],['B','The stairs were closed'],['C','I waited by the station'],['D','I hope you understand']];
    return `<section class="letter-reading" ${zoom?'data-zoom-transcript hidden':''} aria-label="Readable letter fragments"><span class="eyebrow">Reading the original handwriting</span><div class="letter-fragments">${fragments.map(([mark,line])=>`<div><strong>${mark}</strong><span>“${esc(line)}”</span></div>`).join('')}</div>${id==='edges'?'<p>The torn edges and continuing sentences join A → C → B → D.</p>':'<p>Each fragment bears the same pressed-flower watermark.</p>'}</section>`;
  }
  function showClue(id,chapterIndex=state.chapter,record=true){
    const s=story.chapters[chapterIndex]?.spots.find(x=>x.id===id),meta=evidenceData.chapters[chapterIndex]?.items[id];if(!s||!meta)return;
    if(record)add(id,chapterIndex);render();
    const number=story.chapters[chapterIndex].spots.indexOf(s)+1;
    modal(`<article class="case-journal"><header class="journal-heading"><span class="eyebrow">Chapter ${String(chapterIndex+1).padStart(2,'0')} · Evidence ${String(number).padStart(2,'0')}</span><h2>${esc(meta.title)}</h2><p class="journal-subtitle">A curious detail from ${esc(story.chapters[chapterIndex].title)}</p></header><div class="journal-illustration"><img class="evidence-large" src="${meta.image}" alt="${esc(meta.title)} in the same investigation scene"></div><div class="journal-image-actions"><button type="button" class="journal-examine" data-letter-examine>⊕ Examine illustration</button><span class="journal-recorded">✓ In your notebook</span></div>${letterReading(id,false,chapterIndex)}<section class="journal-observation"><span class="eyebrow">Observation</span><p>${esc(s.text)}</p></section><section class="journal-note"><span class="journal-note-heading">▤ Your case notes</span><span>${esc(meta.caseNote)}</span><p>${esc(meta.question)}</p></section><div class="journal-footer"><button type="button" class="primary" data-return>Return to investigation →</button></div></article>`,'dialog-journal');
    modalRoot.querySelector('[data-return]').onclick=close;
    modalRoot.querySelector('[data-letter-examine]').onclick=()=>zoomEvidence(id,chapterIndex);
  }
  function zoomEvidence(id,chapterIndex){
    const meta=evidenceData.chapters[chapterIndex]?.items[id];if(!meta)return;
    let scale=1,x=0,y=0,drag=null;
    modal(`<div class="journal-zoom"><div class="journal-zoom-toolbar"><div class="journal-zoom-heading"><span class="eyebrow">Letters After Midnight · Evidence</span><h2 class="journal-zoom-title">Examining ${esc(meta.title)}</h2></div><div class="journal-zoom-controls"><button type="button" data-letter-zoom-out aria-label="Zoom out">−</button><output data-letter-zoom-level>100%</output><button type="button" data-letter-zoom-in aria-label="Zoom in">+</button><button type="button" data-letter-zoom-reset>Reset</button></div></div><div class="journal-zoom-viewport" data-letter-zoom-viewport aria-label="Zoomable evidence illustration"><div class="journal-zoom-art" data-letter-zoom-art><img class="evidence-large" src="${meta.image}" alt="${esc(meta.title)}"></div></div>${letterReading(id,false,chapterIndex)}<div class="journal-zoom-bottom"><p>Scroll to zoom · Drag to explore · Double-click to reset</p><button type="button" class="primary" data-letter-back>← Back to journal</button></div></div>`,'dialog-journal-zoom');
    const viewport=modalRoot.querySelector('[data-letter-zoom-viewport]'),art=modalRoot.querySelector('[data-letter-zoom-art]');
    function update(){if(scale===1)x=y=0;const img=art.firstElementChild,maxX=Math.max(0,((img?.offsetWidth||0)*scale-(viewport.clientWidth||0))/2),maxY=Math.max(0,((img?.offsetHeight||0)*scale-(viewport.clientHeight||0))/2);x=Math.max(-maxX,Math.min(maxX,x));y=Math.max(-maxY,Math.min(maxY,y));art.style.transform=`translate(${x}px,${y}px) scale(${scale})`;modalRoot.querySelector('[data-letter-zoom-level]').textContent=Math.round(scale*100)+'%';}
    function zoom(delta){scale=Math.max(1,Math.min(4,scale+delta));update();}
    modalRoot.querySelector('[data-letter-zoom-in]').onclick=()=>zoom(.5);
    modalRoot.querySelector('[data-letter-zoom-out]').onclick=()=>zoom(-.5);
    const reset=()=>{scale=1;x=y=0;update();};
    modalRoot.querySelector('[data-letter-zoom-reset]').onclick=reset;
    modalRoot.querySelector('[data-letter-back]').onclick=()=>showClue(id,chapterIndex,false);
    viewport.onwheel=e=>{e.preventDefault();zoom(e.deltaY<0?.25:-.25);};
    viewport.onpointerdown=e=>{if(scale===1)return;drag={px:e.clientX,py:e.clientY,x,y};viewport.setPointerCapture(e.pointerId);};
    viewport.onpointermove=e=>{if(!drag)return;x=drag.x+e.clientX-drag.px;y=drag.y+e.clientY-drag.py;update();};
    viewport.onpointerup=viewport.onpointercancel=()=>{drag=null;};viewport.ondblclick=reset;
    requestAnimationFrame(update);
  }

  let conversation=null,motionPaused=false;
  const plain=text=>String(text).replace(/^[“”]+|[“”]+$/g,'');
  function remember(speaker,text){state.transcript.push({chapter:state.chapter,speaker,text:plain(text)});state.transcript=state.transcript.slice(-150);save();}
  function showAlex(){if(!state.met.includes('alex')){state.met.push('alex');save();render();}conversation={kind:'thought',phase:'thought'};remember(alex.name,alex.thoughts[state.chapter]);drawConversation();}
  function showPerson(){const p=people[state.chapter];if(!p)return;const id=p.id.startsWith('rowan')?'rowan':p.id;if(!state.met.includes(id))state.met.push(id);add(p.id);render();conversation={kind:'person',phase:'intro',question:null};remember(p.name,p.intro);drawConversation();}
  function drawConversation(){
    if(!conversation)return;
    const p=conversation.kind==='thought'?alex:people[state.chapter];if(!p)return;
    const phase=conversation.phase,playerTurn=phase==='question',menu=phase==='menu',expression=playerTurn?(p.listeningExpressions?.[conversation.question]||'listening'):menu?'listening':conversation.kind==='thought'?(alex.thoughtExpressions?.[state.chapter]||'listening'):phase==='intro'?(p.introExpression||'neutral'):phase==='answer'?(p.answerExpressions?.[conversation.question]||'neutral'):'neutral';
    let speaker=p.name,text=conversation.kind==='thought'?alex.thoughts[state.chapter]:plain(p.intro),controls='';
    if(menu){text='What would you like to ask?';controls=`<div class="choices dialogue-choices">${p.questions.map(([q],n)=>`<button type="button" data-letter-question="${n}">${esc(q)}${state.asked.includes(`${state.chapter}:${p.id}:${n}`)?'<small>Discussed · ask again</small>':''}</button>`).join('')}</div>`;}
    else if(phase==='question'){speaker='You';text=p.questions[conversation.question][0];}
    else if(phase==='answer')text=plain(p.questions[conversation.question][1]);
    if(!menu)controls=conversation.kind==='thought'?'<button type="button" class="primary" data-letter-close>Return to investigation →</button>':`<button type="button" class="primary" data-letter-next>${phase==='answer'?'Ask another question':'Continue'} →</button>`;
    const expressionBeats=phase==='intro'?p.expressionBeats?.intro:phase==='answer'?p.expressionBeats?.answers?.[conversation.question]:[];
    const reaction=['warm','concerned'].includes(expression)&&p.reactions,faceSprite=reaction?new URL(p.reactions,document.baseURI).href:new URL(p.frames,document.baseURI).href,faceColumns=reaction?2:4,facePosition=reaction?(expression==='warm'?0:100):(expression==='listening'?200/3:0),faceOffset=reaction?(p.reactionAlignment?.[expression]||{x:0,y:0}):{x:0,y:0};
    modal(`<div class="vn-stage letters-vn ${playerTurn?'player-turn':''} ${motionPaused?'motion-paused':''}" style="--stage:url('${new URL(masters[state.chapter],document.baseURI).href}')"><div class="vn-sprite">${p.frames?`<div class="letters-actor" role="img" aria-label="${esc(p.name)}, ${expression}" data-character="${p.id}" data-speaking="${(conversation.kind==='person'&&(phase==='intro'||phase==='answer'))||conversation.kind==='thought'}" data-expression="${expression}" data-dialogue-reactions="${p.dialogueReactions?new URL(p.dialogueReactions,document.baseURI).href:''}" data-expression-beats="${esc(JSON.stringify(expressionBeats||[]))}" data-face-offset-x="${faceOffset.x}" data-face-offset-y="${faceOffset.y}" data-talking-reactions="${p.talkingReactions?new URL(p.talkingReactions,document.baseURI).href:''}" data-reaction-sprite="${p.reactions?new URL(p.reactions,document.baseURI).href:''}" data-dialogue-text="${esc(plain(text))}" style="--sprite:url('${new URL(p.frames,document.baseURI).href}');--frame-ratio:${p.frameRatio};--frame:0"><span class="letters-face" data-letter-face-a aria-hidden="true" style="background-image:url('${faceSprite}');background-size:${faceColumns*100}% 100%;background-position:${facePosition}% center;transform:translate(${faceOffset.x}%,${faceOffset.y}%);opacity:1"></span><span class="letters-face" data-letter-face-b aria-hidden="true" style="--face-frame:0;opacity:0"></span><span class="letters-eye-blink" data-letter-blink aria-hidden="true"></span></div>`:`<img class="letters-conversation-portrait" src="${p.portrait}" alt="${esc(p.name)}${playerTurn?', listening':''}">`}</div><section class="vn-card"><div class="vn-kicker">${esc(ch().title)} · ${conversation.kind==='thought'?'Alex’s thoughts':'Conversation'}</div>${menu?'':`<span class="speaker">${esc(speaker)}</span>`}<p class="dialogue-line" aria-live="polite">${menu?esc(text):`“${esc(plain(text))}”`}</p>${controls}<div class="vn-footer"><button type="button" class="quiet" data-letter-log>Conversation log</button><button type="button" class="quiet" data-letter-motion>${motionPaused?'Resume motion':'Pause motion'}</button><button type="button" class="quiet" data-letter-close>Return to investigation</button></div></section></div>`,'dialog-conversation');
    modalRoot.querySelectorAll('[data-letter-close]').forEach(b=>b.onclick=close);
    modalRoot.querySelector('[data-letter-motion]').onclick=()=>{motionPaused=!motionPaused;drawConversation();};
    modalRoot.querySelector('[data-letter-log]').onclick=showConversationLog;
    modalRoot.querySelectorAll('[data-letter-question]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.letterQuestion);if(!p.questions[n])return;conversation.question=n;conversation.phase='question';remember('You',p.questions[n][0]);drawConversation();});
    const next=modalRoot.querySelector('[data-letter-next]');if(next)next.onclick=()=>{if(conversation.phase==='intro')conversation.phase='menu';else if(conversation.phase==='question'){conversation.phase='answer';remember(p.name,p.questions[conversation.question][1]);}else{const key=`${state.chapter}:${p.id}:${conversation.question}`;if(!state.asked.includes(key))state.asked.push(key);save();conversation.phase='menu';}drawConversation();};
    modalRoot.querySelector('[data-letter-next],[data-letter-question],[data-letter-close]')?.focus();
  }
  function showConversationLog(){modal(`<h2>Conversation log</h2><div class="transcript">${state.transcript.length?state.transcript.map(l=>`<p><b>${esc(l.speaker)}</b><br>“${esc(plain(l.text))}”</p>`).join(''):'<p>No conversations recorded yet.</p>'}</div><button type="button" class="primary" data-letter-resume>Return to conversation</button>`);modalRoot.querySelector('[data-letter-resume]').onclick=drawConversation;}
  function showLocations(){modal(`<h2>Locations</h2><div class="map">${story.chapters.map((c,i)=>`<button type="button" data-letter-location="${i}" ${i>unlocked()?'disabled':''}><img src="${masters[i]}" alt=""><span>${i+1}. ${esc(c.title)}<small>${i===state.chapter?'You are here':i>unlocked()?'Not yet unlocked':'Visit location →'}</small></span></button>`).join('')}</div>`);modalRoot.querySelectorAll('[data-letter-location]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.letterLocation);if(i>unlocked())return;state.chapter=i;save();close();render();window.scrollTo(0,0);});}

  let hintView={chapter:-1,index:0};
  function hintRuleMet(rule){if(rule.always)return true;if(rule.chapterEvidenceComplete)return complete();if(rule.chapterEvidenceCountAtLeast)return ch().spots.filter(s=>found(s.id)).length>=rule.chapterEvidenceCountAtLeast;return false;}
  function showHint(index){
    const entries=hintData.chapters[state.chapter].hints;let available=0;
    for(let i=1;i<entries.length;i++){if(!hintRuleMet(entries[i].availableWhen))break;available=i;}
    if(hintView.chapter!==state.chapter)hintView={chapter:state.chapter,index:0};
    if(Number.isInteger(index))hintView.index=Math.max(0,Math.min(available,index));else hintView.index=Math.min(hintView.index,available);
    const current=hintView.index;
    modal(`<h2>A gentle hint</h2><span class="hint-count">Hint ${current+1} of 3</span><div class="hint-steps" role="group" aria-label="Choose an available hint">${entries.map((entry,i)=>`<button type="button" class="hint-step ${i===current?'is-current':''} ${i>available?'is-locked':''}" data-letter-hint="${i}" ${i>available?'disabled aria-disabled="true" title="Continue investigating to unlock this hint"':''} ${i===current?'aria-current="step"':''} aria-label="${i>available?'Hint '+(i+1)+' locked':'View hint '+(i+1)}">${i>available?'🔒':i+1}</button>`).join('')}</div><p class="hint-text">${esc(entries[current].text)}</p>${available<2?'<p class="hint-unlock-note">More hints become available as you investigate.</p>':''}<div class="hint-navigation"><button type="button" class="quiet" data-letter-hint-prev ${current===0?'disabled':''}>← Previous</button>${current<available?'<button type="button" class="secondary" data-letter-hint-next>Next hint →</button>':''}<button type="button" class="quiet" data-letter-hint-close>Return to investigation</button></div>`);
    modalRoot.querySelectorAll('[data-letter-hint]').forEach(b=>b.onclick=()=>{if(!b.disabled)showHint(Number(b.dataset.letterHint));});
    modalRoot.querySelector('[data-letter-hint-prev]').onclick=()=>showHint(current-1);
    const next=modalRoot.querySelector('[data-letter-hint-next]');if(next)next.onclick=()=>showHint(current+1);
    modalRoot.querySelector('[data-letter-hint-close]').onclick=close;
  }
  function restartDialog(){modal(`<div class="restart-story"><span class="eyebrow">Your investigation</span><h2>Begin the story again?</h2><p>Restarting <strong>Letters After Midnight</strong> clears its collected evidence, conversations, puzzles, and ending.</p><p class="restart-story-note">Your other stories won't be affected. Export your save first if you want to keep this progress.</p><div class="restart-story-actions"><button type="button" class="primary" data-letter-keep>Keep my progress</button><button type="button" class="quiet" data-letter-restart>Restart story</button></div></div>`,'dialog-restart');modalRoot.querySelector('[data-letter-keep]').onclick=close;modalRoot.querySelector('[data-letter-restart]').onclick=()=>{state=initial();hintView={chapter:-1,index:0};save();close();render();};}
  function exportSave(){const blob=new Blob([JSON.stringify({format:'metriva-story04',version:1,state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='metriva-story04-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async function importSave(input){try{const raw=JSON.parse(await input.files[0].text());if(raw.format!=='metriva-story04'||!raw.state||!Array.isArray(raw.state.found)||!Array.isArray(raw.state.solved)||!Number.isInteger(raw.state.chapter)||raw.state.chapter<0||raw.state.chapter>4)throw Error('invalid');const next={...initial(),...raw.state};if(next.found.some(id=>typeof id!=='string'||!story.chapters.some((c,i)=>c.spots.some(s=>id===`${i}:${s.id}`||id===s.id))))throw Error('invalid evidence');next.solved=[...new Set(next.solved.filter(i=>Number.isInteger(i)&&i>=0&&i<5))].sort();if(next.solved.some((n,i)=>n!==i))throw Error('invalid progress');next.chapter=Math.min(next.chapter,next.solved.length,4);next.asked=Array.isArray(next.asked)?next.asked.filter(k=>typeof k==='string'):[];next.met=Array.isArray(next.met)?next.met.filter(k=>['alex','celia','rowan'].includes(k)):[];next.transcript=Array.isArray(next.transcript)?next.transcript.filter(l=>l&&typeof l.speaker==='string'&&typeof l.text==='string').slice(-150):[];Object.entries(people).forEach(([i,p])=>{if(next.found.includes(`${i}:${p.id}`)||next.found.includes(p.id)){const id=p.id.startsWith('rowan')?'rowan':p.id;if(!next.met.includes(id))next.met.push(id);}});next.notebook=['evidence','people','notes'].includes(next.notebook)?next.notebook:'evidence';next.ending=next.solved.includes(4)&&['share','private'].includes(next.ending)?next.ending:null;modal(`<h2>Import this save?</h2><p>Replace only Letters After Midnight progress with this saved investigation?</p><button type="button" class="primary" data-letter-apply-import>Use imported save</button><button type="button" class="quiet" data-letter-cancel-import>Keep current progress</button>`);modalRoot.querySelector('[data-letter-apply-import]').onclick=()=>{state=next;save();close();render();};modalRoot.querySelector('[data-letter-cancel-import]').onclick=close;}catch{modal('<h2>Save not imported</h2><p>Choose a valid Letters After Midnight save. Your progress is unchanged.</p>');}}

  function showPuzzle(){
    const type=ch().puzzle;
    if(puzzleData[type])return sequencePuzzle(puzzleData[type]);
    const choices=type==='ink'?[['iris','Iris Morgan'],['julian','Julian Ellis'],['rowan','Rowan Ellis'],['celia','Celia']]:[['abandoned','Julian chose not to come'],['different','They waited in different places because a letter was never delivered'],['forgot','Iris forgot the date'],['train','The train was canceled']];
    modal(`<h2>${type==='ink'?'Who Wrote the Violet Note?':'What Really Happened on June 19?'}</h2><p>${type==='ink'?'Compare the ink testing sheet, notebook, and framed signature.':'Compare Iris’s station note, Julian’s changed plan, and the storm closure record.'}</p><div class="choices">${choices.map(([id,label])=>`<button type="button" data-answer="${id}">${esc(label)}</button>`).join('')}</div><p class="feedback" id="feedback" aria-live="polite"></p>`);
    modalRoot.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{if(b.dataset.answer===(type==='ink'?'julian':'different'))completePuzzle();else modalRoot.querySelector('#feedback').textContent='That does not match the evidence. Revisit the clues and try again.';});
  }
  function sequencePuzzle(p){let order=p.items.map(x=>x[0]);function draw(){modal(`<h2>${esc(p.title)}</h2><p>${esc(p.description)}</p><div class="sequence">${order.map((id,n)=>`<div><span>${n+1}. ${esc(p.items.find(x=>x[0]===id)[1])}</span><button type="button" data-up="${n}" aria-label="Move up" ${n===0?'disabled':''}>↑</button><button type="button" data-down="${n}" aria-label="Move down" ${n===order.length-1?'disabled':''}>↓</button></div>`).join('')}</div><p class="feedback" id="feedback" aria-live="polite"></p><button type="button" class="primary" id="check">Check sequence →</button>`);modalRoot.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{const n=+b.dataset.up;[order[n],order[n-1]]=[order[n-1],order[n]];draw();});modalRoot.querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>{const n=+b.dataset.down;[order[n],order[n+1]]=[order[n+1],order[n]];draw();});modalRoot.querySelector('#check').onclick=()=>order.join('|')===p.answer.join('|')?completePuzzle():modalRoot.querySelector('#feedback').textContent='Not quite. Review the evidence and rearrange the sequence.';}draw();}
  function completePuzzle(){if(!solved(state.chapter))state.solved.push(state.chapter);save();const c=ch();modal(`<h2>Discovery made</h2><p>${esc(c.success)}</p><button type="button" class="primary" id="proceed">${state.chapter===4?'Decide what happens next →':'Continue investigation →'}</button>`);modalRoot.querySelector('#proceed').onclick=()=>{close();if(state.chapter<4){state.chapter++;save();render();window.scrollTo(0,0);}else{render();showEnding();}};}
  function showEndingResult(){
    if(!state.ending)return showEnding();
    modal(`<h2>${state.ending==='share'?'The Letters Preserved':'A Story Kept Close'}</h2><p>${state.ending==='share'?'Alex and Rowan arrange a small exhibition at the bookbinding studio. Iris and Julian’s letters finally reach the people who needed to read them.':'Alex and Rowan preserve the letters in a hand-bound keepsake, sharing the story with family before deciding whether to make it public.'}</p><p>Neither Iris nor Julian abandoned the other. Both kept writing.</p><button type="button" class="primary" data-return>Return to story library</button>`);
    modalRoot.querySelector('[data-return]').onclick=()=>location.href='index.html#catalog';
  }
  function showEnding(){
    modal(`<h2>The Letter Never Sent</h2><p>Iris waited at the station. Julian waited in the rooftop garden. His change-of-plans note was never delivered, and the storm closed the stairs.</p><p>“They both showed up,” Rowan says softly. “Just not in the same place.”</p><p>How should their letters be remembered?</p><div class="choices"><button type="button" data-ending="share">Create a public exhibition celebrating their letters</button><button type="button" data-ending="private">Preserve the letters privately with both families</button></div>`);
    modalRoot.querySelectorAll('[data-ending]').forEach(b=>b.onclick=()=>{state.ending=b.dataset.ending;save();close();render();showEndingResult();});
  }
  render();
})();
