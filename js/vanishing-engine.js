(()=>{'use strict';
const {story,conversations}=window.VANISHING_DATA,KEY='metrivastories_v01';
const portraits={'Mrs. Bellamy':['character-bellamy.png','bellamy'],'Clara':['character-clara.png','clara'],'Mr. Finch':['character-finch.png','finch']};
conversations[0][0].intro='I left a letter on the writing desk. It means more to me than I can explain. Will you help me find it?';
const scenes=['shop','greenhouse','office','garden','finale'];story.forEach((ch,i)=>{ch.background=`assets/scene-${scenes[i]}.png`;ch.spots.forEach(s=>s.image=`assets/clue-${s.id==='miso'?'token':s.id}.png`)});
story[0].spots.find(s=>s.id==='register').text='The last sale was entered at 6:12 PM: one lavender ribbon, with no customer name. The shop’s closing notice says 6:00 PM.';
const positions=[[[77,50],[90,25],[74,83],[29,65]],[[25,72],[64,72],[78,48]],[[25,58],[73,84],[47,65]],[[60,72],[81,88],[29,69]],[[50,68]]];story.forEach((ch,i)=>ch.spots.forEach((s,j)=>{[s.x,s.y]=positions[i][j]}));
story[2].spots.find(s=>s.id==='drawer').text='A three-wheel brass lock secures the right-hand drawer built into the writing desk. On the desktop beside the correspondence, a pencilled reminder reads: “The last three digits of the year our first spring began.”';
const fresh=()=>({chapter:0,found:[],timeline:[null,null,null],timelineSolved:false,drawer:false,token:false,finished:false,resolution:null,heard:[],met:[],hints:[0,0,0,0,0],seenIntro:false,dialogue:null,transcript:[]});
const lookup=id=>story.flatMap(ch=>ch.spots).find(s=>s.id===id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function normalize(raw){if(!raw||typeof raw!=='object')return fresh();const s=fresh();s.found=Array.isArray(raw.found)?[...new Set(raw.found.filter(id=>lookup(id)||id==='drawer-open'))]:[];s.timeline=Array.isArray(raw.timeline)&&raw.timeline.length===3?raw.timeline.map(id=>['close','sale','ledger'].includes(id)?id:null):[null,null,null];s.timelineSolved=raw.timelineSolved===true||s.timeline.join(',')==='close,sale,ledger';for(const k of ['drawer','token','finished','seenIntro'])s[k]=raw[k]===true;s.resolution=['keep','deliver'].includes(raw.resolution)?raw.resolution:null;s.heard=Array.isArray(raw.heard)?raw.heard.filter(v=>typeof v==='string'&&/^\d:\d:\d$/.test(v)):[];s.met=Array.isArray(raw.met)?raw.met.filter(v=>Object.hasOwn(portraits,v)):[];s.hints=Array.isArray(raw.hints)?s.hints.map((v,i)=>Math.min(2,Math.max(0,Number.isInteger(raw.hints[i])?raw.hints[i]:0))):s.hints;s.chapter=Number.isInteger(raw.chapter)?Math.min(4,Math.max(0,raw.chapter)):0;s.transcript=Array.isArray(raw.transcript)?raw.transcript.filter(v=>v&&typeof v.speaker==='string'&&typeof v.text==='string').map(v=>({speaker:v.speaker.slice(0,80),text:v.text.slice(0,1500)})).slice(-100):[];const d=raw.dialogue;if(d&&d.chapter===s.chapter&&Number.isInteger(d.index)&&conversations[d.chapter]?.[d.index]&&['intro','menu','exchange','complete','reveal'].includes(d.phase)){const person=conversations[d.chapter][d.index];if(d.phase==='reveal'&&(!Number.isInteger(d.line)||d.line<0||d.line>5))return s;if(d.phase!=='exchange'||Number.isInteger(d.question)&&person.options[d.question]&&Number.isInteger(d.line)&&d.line>=0&&d.line<4)s.dialogue={chapter:d.chapter,index:d.index,phase:d.phase,question:d.question??null,line:d.line??0}}return s}
let state;try{state=normalize(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{state=fresh()}let storageOK=true,tab='evidence',lastFocus;const characterBios={'Mrs. Bellamy':'The warm flower-shop owner, quietly worried about a letter she once wrote.','Clara':'A young florist whose careful records help untangle the evening.','Mr. Finch':'A longtime gardener who knows the greenhouse and garden history.'};const has=id=>state.found.includes(id),all=i=>story[i].spots.every(s=>has(s.id));
// Shared data-driven dialogue availability. Missing rules default to legacy availability
// for chapters not migrated yet (Chapters 3–5).
// Safe fallback if the external rules file is missing, stale, or blocked.
// Prevents Chapter 1/2 questions and characters from becoming unlocked by default.
const fallbackDialogueRules = {
  '0': {
    'Mrs. Bellamy': {availableWhen:{always:true},notificationExclude:[0],questions:{'0':{always:true},'1':{evidenceFound:['window']},'2':{evidenceFound:['letter']}}},
    'Clara': {availableWhen:{dialogueCompleted:['0:0:1']},lockedLabel:'Not introduced yet',questions:{'0':{dialogueCompleted:['0:0:1']},'1':{evidenceFound:['register']},'2':{evidenceFound:['miso']}}}
  },
  '1': {
    'Clara': {availableWhen:{evidenceFound:['ledger']},lockedLabel:'Examine the greenhouse ledger',questions:{'0':{evidenceFound:['ledger']},'1':{evidenceFound:['ledger']}}},
    'Mr. Finch': {availableWhen:{evidenceFound:['pots']},lockedLabel:'Not introduced yet',questions:{'0':{evidenceFound:['pots']},'1':{evidenceFound:['labels']},'2':{evidenceFound:['labels']}}}
  }
};
const externalDialogueRules = window.VANISHING_DIALOGUE_RULES;
const dialogueRules = externalDialogueRules?.storyId === 'vanishing-letter' && externalDialogueRules?.schemaVersion === 1
  ? {...fallbackDialogueRules, ...externalDialogueRules.chapters}
  : fallbackDialogueRules;
function dialogueRule(chapter, personIndex) {
  const person = conversations[chapter]?.[personIndex];
  return person ? dialogueRules[String(chapter)]?.[person.name] : undefined;
}
function meetsDialogueCondition(rule) {
  if (!rule) return true;
  if (rule.always === true) return true;
  if (Array.isArray(rule.evidenceFound) && !rule.evidenceFound.every(has)) return false;
  if (Array.isArray(rule.dialogueCompleted) && !rule.dialogueCompleted.every(key => state.heard.includes(key))) return false;
  return true;
}
function isCharacterAvailable(chapter, personIndex) {
  const rule = dialogueRule(chapter, personIndex);
  return rule ? meetsDialogueCondition(rule.availableWhen) : true;
}
function isClaraIntroduced() {
  const index = conversations[0].findIndex(person => person.name === 'Clara');
  return index < 0 || isCharacterAvailable(0, index);
}
function characterLockedLabel(chapter, personIndex) {
  return dialogueRule(chapter, personIndex)?.lockedLabel || 'Not introduced yet';
}

function chapterOneComplete() {
  return all(0) &&
    state.heard.includes('0:0:1') &&
    state.heard.includes('0:1:0');
}


function unlocked() {
  if (state.token || state.finished) return 4;
  if (state.drawer) return 3;
  if (state.timelineSolved) return 2;

  if (chapterOneComplete() ||
      (state.chapter > 0 && all(1))) {
    return 1;
  }

  return 0;
}

state.chapter=Math.min(state.chapter,unlocked());if(state.dialogue&&state.dialogue.chapter!==state.chapter)state.dialogue=null;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true}catch{storageOK=false}}function add(id){if(!has(id))state.found.push(id);save()}
function progress(){if(state.finished)return 100;return Math.min(99,Math.round(state.found.filter(id=>lookup(id)).length/14*65+(state.timelineSolved?10:0)+(state.drawer?10:0)+(state.token?10:0)))}
function portrait(name){const [file]=portraits[name];return `<div class="portrait sprite-thumb"><img src="assets/${file}" alt="${esc(name)} character illustration"></div>`}
function boxArt(large=false){return `<div class="memory-box-crop ${large?'evidence-large':''}" role="img" aria-label="The same open garden box, containing the sealed envelope, letter, and lavender"></div>`}
function clueArt(s,large=false){if(s.id==='pots')return `<div class="greenhouse-soil-detail ${large?'evidence-large':''}" role="img" aria-label="The undisturbed wooden tray of bare potting soil shown in the greenhouse scene"></div>`;if(s.id==='notes')return `<div class="desk-notes-detail ${large?'evidence-large':''}" role="img" aria-label="The correspondence note beside the letters on the same writing desk shown in the wide scene"></div>`;if(s.id==='drawer')return `<div class="desk-drawer-detail ${large?'evidence-large':''}" role="img" aria-label="The separate drawer reminder above the three-wheel brass lock on the same writing desk"></div>`;return s.id==='box'?boxArt(large):`<img class="${large?'evidence-large':''}" src="${s.image}" alt="Illustration of ${esc(s.label)}">`}
function modal(title,html,kind=''){const overlay=document.getElementById('modal');if(overlay.classList.contains('hidden'))lastFocus=document.activeElement;overlay.className='overlay';overlay.innerHTML=`<section class="dialog ${kind}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="dialog-top"><span class="eyebrow">Metriva · The Vanishing Letter</span><button data-action="close" aria-label="Close dialogue">✕</button></div>${html}</section>`;document.getElementById('app').inert=true;document.querySelector('.top').inert=true;overlay.querySelector('button,input')?.focus()}
function close(){state.dialogue=null;save();document.getElementById('modal').className='hidden';document.getElementById('app').inert=false;document.querySelector('.top').inert=false;if(lastFocus?.isConnected)lastFocus.focus()}

function objective() {
  return [
    chapterOneComplete()
      ? 'The clues and conversations are complete. Follow the stock records to the greenhouse.'
      : !all(0)
        ? 'A letter has vanished. Examine the four marked objects in the flower shop.'
        : !state.heard.includes('0:0:1')
          ? 'All four clues examined. Ask Mrs. Bellamy who could enter after closing.'
          : 'Speak with Clara about the shop records before visiting the greenhouse.',

    state.timelineSolved
      ? 'The timeline is reconstructed. Follow the correspondence trail to the back office.'
      : 'Inspect the ledger, soil and planting labels. Then arrange the recorded times.',

    state.drawer
      ? 'The postcards point toward the old garden.'
      : 'A photograph dates the first garden to 1986. Find the reminder for the locked drawer.',

    state.token
      ? 'The stone recess is open. Recover the memory box.'
      : 'Match the token’s inscription to the planting note and open the stone recess.',

    state.finished
      ? 'The mystery is solved. You can revisit the letter and your ending.'
      : has('box')
        ? 'Final step: read the letter, hear Mrs. Bellamy, and choose an ending to complete the case.'
        : 'Recover the letter and hear Mrs. Bellamy’s explanation.'
  ][state.chapter];
}

function action(){const n=state.chapter;if(n===0)return `<button class="primary" data-action="next" data-index="1" ${chapterOneComplete()?'':'disabled'}>Visit the greenhouse →</button>`;if(n===1)return `<button class="primary" data-action="${state.timelineSolved?'next':'timeline'}" data-index="2" ${all(1)||state.timelineSolved?'':'disabled'}>${state.timelineSolved?'Visit the back office':'Reconstruct timeline'} →</button>${state.timelineSolved?'<button class="quiet" data-action="timeline">Review timeline</button>':''}`;if(n===2)return `<button class="primary" data-action="${state.drawer?'next':'drawer'}" data-index="3" ${all(2)||state.drawer?'':'disabled'}>${state.drawer?'Visit Memorial Garden':'Open locked drawer'} →</button>`;if(n===3)return `<button class="primary" data-action="${state.token?'next':'garden'}" data-index="4" ${all(3)||state.token?'':'disabled'}>${state.token?'Open the memory box':'Investigate garden recess'} →</button>`;return `<button class="primary" data-action="finale" ${has('box')?'':'disabled'}>${state.finished?'Revisit letter and ending':'Read the letter'} →</button>`}
// Shared character notification: derived from existing dialogue progress, not saved separately.
function newDialogueCount(chapter, personIndex) {
  const person = conversations[chapter]?.[personIndex];
  if (!person || !isCharacterAvailable(chapter, personIndex)) return 0;
  const excluded = dialogueRule(chapter, personIndex)?.notificationExclude || [];
  return person.options.reduce((count, option, questionIndex) => {
    if (!isQuestionUnlocked(chapter, personIndex, questionIndex)) return count;
    if (state.heard.includes(`${chapter}:${personIndex}:${questionIndex}`)) return count;
    return count + (excluded.includes(questionIndex) ? 0 : 1);
  }, 0);
}
function render(){const ch=story[state.chapter];document.getElementById('app').innerHTML=`<header class="heading"><div><span class="eyebrow">Story 01 · Cozy mystery · 10–20 min</span><h1>The Vanishing Letter</h1><p>A forgotten letter. A garden full of memories.</p></div><button class="quiet" data-action="map">Locations</button></header><div class="chaptertabs" aria-label="Chapters">${story.map((c,i)=>`<button data-action="next" data-index="${i}" ${i>unlocked()?'disabled':''} ${i===state.chapter?'class="active" aria-current="step"':''}>${i+1}. ${esc(c.name)}</button>`).join('')}</div><div class="game"><section class="scene-card"><div class="scene-title"><h2>${esc(ch.name)}</h2><span>Chapter 0${state.chapter+1} / 05</span></div><div class="scene"><img class="scene-art" src="${ch.background}" alt="${esc(ch.name)} illustration">${ch.spots.map((s,i)=>`<button class="hotspot ${has(s.id)?'done':''}" style="--x:${s.x};--y:${s.y}" aria-label="Investigate ${esc(s.label)}" title="${esc(s.label)}" data-action="inspect" data-id="${s.id}">${has(s.id)?'✓':i+1}</button>`).join('')}</div><div class="scene-footer"><span>${ch.spots.filter(s=>!has(s.id)).length} clues left to examine</span><span class="extra">Select a marker or an object below</span></div><div class="objects">${ch.spots.map((s,i)=>`<button data-action="inspect" data-id="${s.id}" class="${has(s.id)?'done':''}">${i+1}. ${esc(s.label)} ${has(s.id)?'✓':''}</button>`).join('')}</div></section><aside class="panel panel-investigation"><div><h2>Investigation</h2><span class="meta">Story progress · ${progress()}%</span><div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress()}" aria-label="Required story milestone progress"><span style="width:${progress()}%"></span></div><p class="objective">${objective()}</p><div class="story-completion ${state.finished?'is-complete':'is-pending'}" role="status"><span class="story-completion-icon" aria-hidden="true">${state.finished?'✓':'○'}</span><span><strong>${state.finished?'Story complete':'Story not yet complete'}</strong><small>${state.finished?'The final chapter and ending are saved.':'Finish the final chapter to complete the story.'}</small></span></div><div class="actions">${action()}<button class="quiet" data-action="hint">Need a gentle hint?</button></div></div><div><hr class="divider"><h3>People here</h3><div class="cast character-list">${conversations[state.chapter].map((p, i) => {
  const locked = !isCharacterAvailable(state.chapter, i);
  const lockedLabel = characterLockedLabel(state.chapter, i);
  const newCount = locked ? 0 : newDialogueCount(state.chapter, i);

  return `
    <button
      data-action="talk"
      data-index="${i}"
      aria-label="${locked ? `${esc(p.name)} — ${esc(lockedLabel)}` : `Talk to ${esc(p.name)}${newCount ? ` — ${newCount} new ${newCount === 1 ? 'question' : 'questions'}` : ''}`}"
      ${locked ? 'disabled' : ''}
    >
      ${portrait(p.name)}
      <span class="name">${esc(p.name)}</span>
      <span class="character-description">
        ${newCount ? `<span class="dialogue-new" aria-hidden="true">New dialogue${newCount > 1 ? ` · ${newCount}` : ''}</span>` : ''}
        <span class="character-bio">${locked
          ? esc(lockedLabel)
          : `${esc(p.role)} · ${esc(characterBios[p.name] || '')}`
        }</span>
      </span>
    </button>
  `;
}).join('')}</div><p class="meta">Ask questions. A clue can have more than one explanation.</p></div></aside></div><section class="panel notebook"><div class="notebook-header"><h2>Your notebook</h2><nav class="notebook-tabs" aria-label="Notebook">${['evidence','people','timeline'].map(t=>`<button data-action="tab" data-tab="${t}" ${tab===t?'class="active" aria-current="page"':''}>${t[0].toUpperCase()+t.slice(1)}</button>`).join('')}</nav></div><div id="notebook-content">${notebook()}</div></section><div class="case-tools"><p>${storageOK?'Progress saved in this browser. Export a save before moving the site.':'Browser storage is unavailable. Export a save before closing this page.'}${state.resolution?`<br>Saved ending: ${state.resolution==='deliver'?'A first step together':'Room for courage'}`:''}</p><button class="quiet" data-action="export">Export save</button><button class="quiet" data-action="import">Import save</button><button class="quiet" data-action="restart">Restart case</button><input type="file" id="import-save" accept=".json,application/json" hidden></div>`}
function notebook(){if(tab==='people'){const names=state.met;return names.length?`<div class="people-book">${names.map(name=>`<article>${portrait(name)}<h3>${esc(name)}</h3><p>${esc(conversations.flat().find(p=>p.name===name).role)}</p><small>${esc(characterBios[name]||'')}</small></article>`).join('')}</div>`:'<p class="meta">Speak to someone to add them to your notebook.</p>'}if(tab==='timeline')return `<p class="meta">${state.timelineSolved?'Verified order of events. The ledger does not prove who entered at 6:12.':'Collect the receipt and greenhouse ledger to compare the recorded times.'}</p><ol class="timeline"><li>6:00 PM · Shop closes</li>${has('register')?'<li>6:12 PM · Lavender ribbon sale</li>':''}${has('ledger')?'<li>6:20 PM · Clara signs the greenhouse stock count</li>':''}</ol>`;return state.found.length?`<div class="evidence-grid">${state.found.filter(id=>lookup(id)).map(id=>{const s=lookup(id);return `<button class="evidence-card" data-action="evidence" data-id="${id}">${clueArt(s)}<span>${esc(notebookTitle(s))}</span></button>`}).join('')}${has('drawer-open')?'<button class="evidence-card evidence-card-discovery" data-action="discovery"><img src="assets/clue-notes.png" alt="Old postcards from the correspondence drawer"><span>Correspondence drawer</span></button>':''}</div>`:'<p class="meta">Your notebook is empty. Select an object to begin.</p>'}
function showDiscovery(){
  if(!has('drawer-open'))return;
  const d=window.VANISHING_EVIDENCE?.discoveries?.['drawer-open'] || {};
  modal(d.title || 'The Correspondence Drawer',`<article class="case-journal"><header class="journal-heading"><span class="eyebrow">Chapter 03 · Discovery</span><h2>${esc(d.title || 'The Correspondence Drawer')}</h2><p class="journal-subtitle">A discovery from The Back Office</p></header><div class="journal-illustration"><img class="evidence-large" src="assets/clue-notes.png" alt="Old correspondence and postcards"></div><section class="journal-observation"><span class="eyebrow">Observation</span><p>${esc(d.observation || 'Inside the drawer are postcards signed “E.” One points to the place where their first spring began.')}</p></section><section class="journal-note"><span class="journal-note-heading">Your case notes</span><p>${esc(d.question || 'Why was the Memorial Garden important to the sender?')}</p></section><div class="journal-footer"><button class="primary" data-action="close">Return to investigation →</button></div></article>`,'dialog-journal');
}
function go(i){if(!Number.isInteger(i)||i<0||i>unlocked())return;state.chapter=i;save();close();render();window.scrollTo({top:0,behavior:'smooth'})}

// Only Chapter 1 uses the external metadata in Phase 1.
// Other chapters keep their existing labels until their own migration.
function evidenceMeta(s) {
  if (!story[0].spots.includes(s)) return null;
  return window.VANISHING_EVIDENCE?.chapters?.['flower-shop']?.[s.id] || null;
}
function evidenceTitle(s) { return evidenceMeta(s)?.title || s.label; }
function evidenceNote(s) { return evidenceMeta(s)?.caseNote || s.clue; }
function notebookTitle(s) { return evidenceMeta(s)?.notebookTitle || s.clue; }
function zoomTitle(s) { return evidenceMeta(s)?.zoomTitle || `Examining ${s.label}`; }
function evidenceQuestion(s) { return evidenceMeta(s)?.question || 'How might this detail connect to the other evidence?'; }

function evidence(id, collect = false) {
  const s = lookup(id);
  if (!s || (collect && !story[state.chapter].spots.includes(s))) return;
  if (collect) { add(id); render(); }

  const chapter = story.findIndex(ch => ch.spots.includes(s));
  const number = story[chapter].spots.indexOf(s) + 1;
  const question = evidenceQuestion(s);

  modal(evidenceTitle(s), `
    <article class="case-journal">
      <header class="journal-heading">
        <span class="eyebrow">Chapter ${String(chapter + 1).padStart(2,'0')} · Evidence ${String(number).padStart(2,'0')}</span>
        <h2>${esc(evidenceTitle(s))}</h2>
        <p class="journal-subtitle">A curious detail from ${esc(story[chapter].name)}</p>
      </header>
      <div class="journal-illustration">${clueArt(s, true)}</div>
      <div class="journal-image-actions">
        <button class="journal-examine" data-action="zoom-clue" data-id="${esc(s.id)}">⊕ Examine illustration</button>
        <span class="journal-recorded">✓ In your notebook</span>
      </div>
      <section class="journal-observation">
        <span class="eyebrow">Observation</span>
        <p>${esc(s.text)}</p>
      </section>
      <section class="journal-note">
        <span class="journal-note-heading">▤ Your case notes</span>
        <span>${esc(evidenceNote(s))}</span>
        <p>${esc(question)}</p>
      </section>
      <div class="journal-footer"><button class="primary" data-action="close">Return to investigation →</button></div>
    </article>
  `, 'dialog-journal');
}

let zoomScale = 1;
let zoomOffset = { x: 0, y: 0 };
let zoomDrag = null;

function zoomClue(id) {
  const s = lookup(id);
  if (!s || !has(id)) return;
  zoomScale = 1;
  zoomOffset = { x: 0, y: 0 };
  zoomDrag = null;
  modal(evidenceTitle(s), `
    <div class="journal-zoom">
      <div class="journal-zoom-toolbar">
        <div class="journal-zoom-heading"><span class="eyebrow">The Vanishing Letter · Evidence</span><h2 class="journal-zoom-title">${esc(zoomTitle(s))}</h2></div>
        <div class="journal-zoom-controls">
          <button data-action="zoom-out" aria-label="Zoom out">−</button>
          <output id="journal-zoom-level">100%</output>
          <button data-action="zoom-in" aria-label="Zoom in">+</button>
          <button data-action="zoom-reset">Reset</button>
        </div>
      </div>
      <div class="journal-zoom-viewport" id="journal-zoom-viewport" aria-label="Zoomable evidence illustration">
        <div class="journal-zoom-art" id="journal-zoom-art">${clueArt(s, true)}</div>
      </div>
      <div class="journal-zoom-bottom">
        <p>Scroll to zoom · Drag to explore · Double-click to reset</p>
        <button class="primary" data-action="back-to-evidence" data-id="${esc(id)}">← Back to journal</button>
      </div>
    </div>
  `, 'dialog-journal-zoom');
  updateClueZoom();
}

function clampCluePan() {
  const viewport = document.getElementById('journal-zoom-viewport');
  const art = document.getElementById('journal-zoom-art');
  if (!viewport || !art) return;
  const subject = art.firstElementChild;
  if (!subject) return;
  // The untransformed illustration's rendered dimensions determine the
  // available pan range, not the dimensions of the full-screen container.
  const width = subject.offsetWidth;
  const height = subject.offsetHeight;
  const maxX = Math.max(0, (width * zoomScale - viewport.clientWidth) / 2);
  const maxY = Math.max(0, (height * zoomScale - viewport.clientHeight) / 2);
  zoomOffset.x = Math.max(-maxX, Math.min(maxX, zoomOffset.x));
  zoomOffset.y = Math.max(-maxY, Math.min(maxY, zoomOffset.y));
}

function updateClueZoom() {
  const art = document.getElementById('journal-zoom-art');
  if (!art) return;
  if (zoomScale <= 1) zoomOffset = { x: 0, y: 0 };
  clampCluePan();
  art.style.transform = `translate3d(${zoomOffset.x}px, ${zoomOffset.y}px, 0) scale(${zoomScale})`;
  const level = document.getElementById('journal-zoom-level');
  if (level) level.textContent = `${Math.round(zoomScale * 100)}%`;
}

function changeClueZoom(amount) {
  zoomScale = Math.round(Math.max(1, Math.min(4, zoomScale + amount)) * 100) / 100;
  updateClueZoom();
}

function resetClueZoom() {
  zoomScale = 1;
  zoomOffset = { x: 0, y: 0 };
  updateClueZoom();
}

document.addEventListener('pointerdown', e => {
  const viewport = e.target.closest('#journal-zoom-viewport');
  if (!viewport || zoomScale <= 1) return;
  e.preventDefault();
  zoomDrag = {
    id: e.pointerId, x: e.clientX, y: e.clientY,
    offsetX: zoomOffset.x, offsetY: zoomOffset.y
  };
  viewport.setPointerCapture(e.pointerId);
  viewport.classList.add('is-dragging');
});
document.addEventListener('pointermove', e => {
  if (!zoomDrag || e.pointerId !== zoomDrag.id) return;
  zoomOffset.x = zoomDrag.offsetX + e.clientX - zoomDrag.x;
  zoomOffset.y = zoomDrag.offsetY + e.clientY - zoomDrag.y;
  updateClueZoom();
});
function endClueDrag(e) {
  if (zoomDrag && e.pointerId === zoomDrag.id) {
    zoomDrag = null;
    document.getElementById('journal-zoom-viewport')?.classList.remove('is-dragging');
  }
}
document.addEventListener('pointerup', endClueDrag);
document.addEventListener('pointercancel', endClueDrag);
document.addEventListener('wheel', e => {
  if (!e.target.closest('#journal-zoom-viewport')) return;
  e.preventDefault();
  changeClueZoom(e.deltaY < 0 ? 0.25 : -0.25);
}, { passive: false });
document.addEventListener('dblclick', e => {
  if (e.target.closest('#journal-zoom-viewport')) resetClueZoom();
});

// Conversations advance through distinct player and character turns.
const followups={
 'Clara':[
  [['So the letter was still here when the shop closed?','Yes. I never took it to the post. We should find out what happened after closing.'],['That signature cannot tell us what happened at 6:12?','Exactly. The ledger records one moment. It does not explain the earlier ribbon sale.'],['Something brass? Perhaps Miso has found our next clue.','Look under the counter. He has been batting it around all afternoon.']],
  [['So 6:20 records the end of your count?','Yes. Read it together with the receipt, and keep the times separate.'],['I will ask him about the first planting.','The old records should help you connect the token to a place.']],
  [['1986. I should compare that with the drawer reminder.','The photograph and the lock belong to the same history.'],['Then I will look for the reminder beside the lock.','Take your time. Mrs. Bellamy kept those words for a reason.']],
  [],
  [['The evidence looked like a theft at first.','That is why it mattered to listen before deciding what the clues meant.']]
 ],
 'Mrs. Bellamy':[
  [['I will begin with the desk and the counter.','Thank you. The little things may explain more than I can just now.'],['Then the window deserves a careful look.','Yes. It has been troublesome for years. Please do not assume the worst of Clara.'],['Elena must mean a great deal to you.','She does. Some friendships stay with us even when the letters stop.']],
  [],
  [['The first garden began in 1986.','Yes. I remember the lavender as if it had been planted yesterday.'],['Perhaps the old letters can help us understand.','Handle them gently. They contain things I never found the courage to say.'],['I will use the year in the photograph.','Only its last three digits. The reminder is there beside the lock.']],
  [['Then this was a meeting place, not merely a garden.','It was a promise. I hoped it might become one again.'],['I will keep that in mind when we find it.','Thank you. The letter belongs to a friendship, not to a stranger.']],
  [['You moved your own letter. That explains the traces.','I did. I was afraid to send it, and afraid to let it go.'],['You do not have to take that step alone.','Perhaps this time I will choose words before silence chooses for me.']]
 ],
 'Mr. Finch':[
  [],
  [['So matching soil cannot identify one person.','Precisely. It is a useful connection, but not proof of who opened the window.'],['Then I should compare that with the planting note.','Let the records guide you. The first spring bed was lavender.'],['I will rely on the recorded times instead.','A wise distinction. What I did not see cannot serve as anyone’s alibi.']],
  [],
  [['I will look beneath the lavender.','Find the small stone recess. The old token was made for it.'],['So the token and the recess belong together.','Yes. The inscription tells you where to begin.']],
  []
 ]
};
function exchange(p,q){const pair=followups[p.name]?.[state.chapter]?.[q]||['I will compare that with the evidence.','Take your time. A clue can have more than one explanation.'];return [{speaker:'You',text:p.options[q][0]},{speaker:p.name,text:p.options[q][1]},{speaker:'You',text:pair[0]},{speaker:p.name,text:pair[1]}]}
function quotedLine(text,spoken){return spoken&&!(/^“[\s\S]*”$/.test(text))?`“${text}”`:text}
function voiceFile(d,p,speaker){
 if(speaker!==p.name)return '';
 if(d.phase==='intro')return d.chapter===0&&p.name==='Mrs. Bellamy'?'assets/voices/01-shop-bellamy-introduction.mp3':'';
 if(d.phase==='reveal')return d.line===2||d.line===4?`assets/voices/05-finale-bellamy-reveal-0${d.line+1}.mp3`:'';
 if(d.phase!=='exchange'||d.line!==1&&d.line!==3)return '';
 const prefix=p.name==='Mrs. Bellamy'?['01-shop-bellamy','','03-office-bellamy','04-garden-bellamy','05-finale-bellamy'][d.chapter]:p.name==='Mr. Finch'?['','02-greenhouse-finch','','04-garden-finch',''][d.chapter]:p.name==='Clara'?`${String(d.chapter+1).padStart(2,'0')}-clara`:'';
 return prefix?`assets/voices/${prefix}-q${String(d.question+1).padStart(2,'0')}-${d.line===1?'answer':'follow-up'}.mp3`:'';
}
function rememberLine(speaker,text){const last=state.transcript.at(-1);if(!last||last.speaker!==speaker||last.text!==text)state.transcript.push({speaker,text});state.transcript=state.transcript.slice(-100);save()}
function talk(i){const p=conversations[state.chapter][i];if(!p)return;if(!isCharacterAvailable(state.chapter,i))return;if(!state.met.includes(p.name))state.met.push(p.name);const introduction=state.chapter===0&&p.name==='Mrs. Bellamy';state.dialogue={chapter:state.chapter,index:i,phase:introduction?'intro':'menu',question:null,line:0};if(introduction)rememberLine(p.name,p.intro);else save();render();showConversation()}
function isQuestionUnlocked(chapter, personIndex, questionIndex) {
  const person = conversations[chapter]?.[personIndex];
  if (!person?.options[questionIndex] || !isCharacterAvailable(chapter, personIndex)) return false;
  const rule = dialogueRule(chapter, personIndex);
  if (!rule) return true; // Unmigrated chapters retain original behavior.
  const condition = rule.questions?.[String(questionIndex)];
  // Missing question rule in a migrated chapter stays locked rather than leaking content.
  return condition !== undefined && meetsDialogueCondition(condition);
}
function chooseQuestion(q) {
  const d = state.dialogue;
  const p = d && conversations[d.chapter][d.index];

  if (!p || !p.options[q]) return;

  // Prevent selecting questions before their clues are discovered.
  if (!isQuestionUnlocked(d.chapter, d.index, q)) return;

  d.phase = 'exchange';
  d.question = q;
  d.line = 0;

  rememberLine('You', p.options[q][0]);
  showConversation();
}
function nextDialogue(){const d=state.dialogue;if(!d)return;const p=conversations[d.chapter][d.index];if(d.phase==='reveal'){if(d.line<revealScript.length-1){d.line++;const line=revealScript[d.line];rememberLine(line.speaker,line.text)}save();showConversation();return}if(d.phase==='intro'){d.phase='menu'}else if(d.phase==='exchange'){if(d.line<3){d.line++;const line=exchange(p,d.question)[d.line];rememberLine(line.speaker,line.text);}else{const key=`${state.chapter}:${d.index}:${d.question}`;if(!state.heard.includes(key))state.heard.push(key);d.phase='complete';render()}}else{d.phase='menu'}save();showConversation()}
function showConversation(){const d=state.dialogue;if(!d)return;const p=conversations[d.chapter][d.index];if(!p)return;if(!isCharacterAvailable(d.chapter,d.index)){state.dialogue=null;save();render();return;}if(d.phase==='intro'&&(d.chapter!==0||p.name!=='Mrs. Bellamy')){d.phase='menu';save()}let speaker=p.name,text=p.intro,controls='';if(d.phase==='reveal'){({speaker,text}=revealScript[d.line]);controls=d.line===revealScript.length-1?'<div class="choices"><button data-action="ending" data-id="deliver">Offer to accompany her to Elena →</button><button data-action="ending" data-id="keep">Give her time to decide</button></div>':'<button class="primary" data-action="dialogue-next">Next →</button>'
}else if (d.phase === 'menu') {
  text = 'What would you like to ask?';

  const availableQuestions = p.options
    .map((option, index) => ({ option, index }))
    .filter(({ index }) =>
      isQuestionUnlocked(d.chapter, d.index, index)
    );

  controls = `<div class="choices dialogue-choices">${
    availableQuestions.map(({ option, index }) => `
      <button data-action="answer" data-answer="${index}">
        ${esc(option[0])}
        ${
          state.heard.includes(`${d.chapter}:${d.index}:${index}`)
            ? '<small>Discussed · ask again</small>'
            : ''
        }
      </button>
    `).join('')
  }</div>`;
}
else if(d.phase==='exchange'){({speaker,text}=exchange(p,d.question)[d.line]);controls='<button class="primary" data-action="dialogue-next">Next →</button>'}else if(d.phase==='complete'){text='You have a little more to consider. Keep talking, or return to the clues.';speaker='Narration';controls='<button class="primary" data-action="dialogue-next">Ask another question →</button>'}else{controls='<button class="primary" data-action="dialogue-next">Continue →</button>'}const file=portraits[p.name][0],expression=(d.phase==='exchange'||d.phase==='reveal')&&speaker==='You'?'thoughtful':'idle',speaking=(d.phase==='exchange'||d.phase==='intro'||d.phase==='reveal')&&speaker===p.name,voice=voiceFile(d,p,speaker),spoken=(d.phase==='intro'||d.phase==='exchange'||d.phase==='reveal')&&speaker!=='Narration',direction=d.phase==='menu'&&!(d.chapter===0&&p.name==='Mrs. Bellamy')&&!state.heard.some(key=>key.startsWith(`${d.chapter}:${d.index}:`))?p.intro:'',place=state.chapter===0?'assets/dialogue-shop.png':state.chapter===4?'assets/scene-garden.png':story[state.chapter].background;modal(p.name,`<div class="vn-stage character-${portraits[p.name][1]} ${speaker==='You'?'player-turn':''}" style="--stage:url('${new URL(place,document.baseURI).href}')"><div class="vn-sprite"><img src="assets/${file}" data-character="${portraits[p.name][1]}" data-expression="${expression}" data-speaking="${speaking}" data-dialogue-text="${esc(text)}" alt="${esc(p.name)} character illustration"></div><section class="vn-card ${direction?'has-stage-direction':''}" data-voice="${voice}"><div class="vn-kicker">${esc(story[state.chapter].name)} · Conversation</div>${direction?`<p class="stage-direction">${esc(direction)}</p>`:''}${d.phase==='menu'?'':`<span class="speaker">${esc(speaker)}</span>`}<p class="dialogue-line" aria-live="polite">${esc(quotedLine(text,spoken))}</p>${controls}<div class="vn-footer"><button class="quiet" data-action="dialogue-log">Conversation log</button><button class="quiet" data-action="toggle-motion">Pause motion</button><button class="quiet" data-action="close">Return to investigation</button></div></section></div>`,'dialog-conversation')}
function conversationLog(){modal('Conversation log',`<h2>Conversation log</h2><div class="transcript">${state.transcript.map(line=>`<p><b>${esc(line.speaker)}</b><br>${esc(quotedLine(line.text,line.speaker!=='Narration'&&(line.speaker==='You'||line.text===conversations[0][0].intro||!conversations.flat().some(p=>p.intro===line.text))))}</p>`).join('')}</div><button class="primary" data-action="resume-dialogue">Return to conversation</button>`)}
const revealScript=[
{speaker:'Narration',text:'The envelope is addressed to Elena—the “E.” in the old photograph. Mrs. Bellamy wrote the letter years ago and never mailed it.'},
{speaker:'You',text:'This was your own letter. How did it end up in the garden?'},
{speaker:'Mrs. Bellamy',text:'“I took it from the desk after closing. I went through the back window because I’d already locked the front. I bought a ribbon to replace the one I spoiled.”'},
{speaker:'You',text:'That explains the 6:12 ribbon sale and the soil on the window. Clara’s later ledger entry was never an alibi for a theft.'},
{speaker:'Mrs. Bellamy',text:'“I changed my mind about sending it. I thought if I put it in our old place, I might find the courage to tell Elena. I could not send it, but I could not destroy it either.”'},
{speaker:'Narration',text:'No stranger broke in. Mrs. Bellamy moved her own letter. Miso found the token she dropped. A misunderstanding separated two friends; perhaps words can bring them together again. How will you support her next step?'}];
function beginReveal(){if(!has('box')||!state.token)return;if(!state.met.includes('Mrs. Bellamy'))state.met.push('Mrs. Bellamy');state.dialogue={chapter:4,index:0,phase:'reveal',question:null,line:0};rememberLine(revealScript[0].speaker,revealScript[0].text);showConversation()}
const hintChapters = window.VANISHING_HINT_DATA?.chapters;
if (!Array.isArray(hintChapters) || hintChapters.length !== story.length ||
    hintChapters.some(ch => !Array.isArray(ch.hints) || ch.hints.length !== 3)) {
  throw new Error('Metriva hint data is missing or invalid. Check vanishing-hint-data.js script order.');
}
// Availability is derived from story progress, not from clicks or saved hint levels.
function hintRuleMet(rule, chapter) {
  if (!rule || typeof rule !== 'object') return false;
  if (rule.always === true) return true;
  if (Array.isArray(rule.allEvidence)) return rule.allEvidence.every(has);
  if (Array.isArray(rule.anyEvidence)) return rule.anyEvidence.some(has);
  if (Array.isArray(rule.evidenceFound)) return rule.evidenceFound.every(has);
  if (Number.isInteger(rule.chapterEvidenceCountAtLeast))
    return story[chapter].spots.filter(s => has(s.id)).length >= rule.chapterEvidenceCountAtLeast;
  if (rule.chapterEvidenceComplete === true) return all(chapter);
  if (rule.revealStarted === true)
    return state.finished || state.transcript.some(line =>
      line.text === revealScript[0].text || line.text === revealScript[1].text);
  return false;
}
function highestAvailableHint(chapter) {
  const entries = hintChapters[chapter].hints;
  let highest = 0;
  for (let i = 1; i < entries.length; i++) {
    if (!hintRuleMet(entries[i].availableWhen, chapter)) break;
    highest = i;
  }
  return highest;
}
let hintView = null;
function hint(index = null) {
  const chapter = state.chapter;
  const available = highestAvailableHint(chapter);
  // Preserve the legacy save field for compatibility, but never use it to grant access.
  if (state.hints[chapter] !== available) { state.hints[chapter] = available; save(); }
  if (hintView?.chapter !== chapter) hintView = {chapter, index: 0};
  if (Number.isInteger(index)) hintView.index = Math.max(0, Math.min(available, index));
  else hintView.index = Math.min(hintView.index, available);
  const current = hintView.index;
  const choices = hintChapters[chapter].hints.map((entry, i) => {
    const locked = i > available;
    return `<button class="hint-step ${i === current ? 'is-current' : ''} ${locked ? 'is-locked' : ''}" data-action="hint-select" data-index="${i}" ${locked ? 'disabled aria-disabled="true" title="Continue investigating to unlock this hint"' : ''} ${i === current ? 'aria-current="step"' : ''} aria-label="${locked ? `Hint ${i+1} locked` : `View hint ${i+1}`}">${locked ? '🔒' : i+1}</button>`;
  }).join('');
  const next = current < available
    ? '<button class="secondary" data-action="hint-next">Next hint →</button>'
    : '';
  const status = available < 2
    ? '<p class="hint-unlock-note">More hints become available as you investigate.</p>'
    : '';
  modal('A gentle hint', `<h2>A gentle hint</h2><span class="hint-count">Hint ${current+1} of 3</span><div class="hint-steps" role="group" aria-label="Choose an available hint">${choices}</div><p class="hint-text">${esc(hintChapters[chapter].hints[current].text)}</p>${status}<div class="hint-navigation"><button class="quiet" data-action="hint-prev" ${current === 0 ? 'disabled' : ''}>← Previous</button>${next}<button class="quiet" data-action="close">Return to investigation</button></div>`);
}
function map(){modal('Explore Willowmere',`<h2>Explore Willowmere</h2><p>Return to any unlocked location.</p><div class="map">${story.map((ch,i)=>`<button data-action="next" data-index="${i}" ${i>unlocked()?'disabled':''}><img src="${ch.background}" alt=""><span>${i+1}. ${esc(ch.name)}<small>${i===state.chapter?'You are here':i>unlocked()?'Not yet unlocked':'Visit location →'}</small></span></button>`).join('')}</div>`)}
let order=[],picked=null;const times={close:'6:00 PM · Shop closes',sale:'6:12 PM · Lavender ribbon sale',ledger:'6:20 PM · Greenhouse entry'};
function timeline(reset=false){
  if(!all(1)&&!state.timelineSolved)return;
  if(reset){order=[null,null,null];picked=null}
  else if(order.length!==3)order=[...state.timeline];
  const available=Object.entries(times).filter(([id])=>!order.includes(id));
  modal('After closing',`
    <article class="timeline-journal">
      <header class="timeline-journal-heading">
        <span class="eyebrow">Chapter 02 · The Greenhouse</span>
        <h2>After closing</h2>
        <p>Reconstruct the evening from the recorded times.</p>
      </header>
      <section class="timeline-puzzle-section" aria-label="Recorded events">
        <div class="timeline-section-heading"><span class="eyebrow">The evidence</span><span class="timeline-section-note">Select a card or drag it into place</span></div>
        <div class="timeline-cards">
          ${Object.entries(times).map(([id,label])=>`<button class="timeline-evidence ${picked===id?'read':''} ${order.includes(id)?'is-placed':''}" data-action="pick-time" data-id="${id}" data-time-id="${id}" draggable="${!order.includes(id)}" ${order.includes(id)?'disabled':''} aria-pressed="${picked===id}"><span class="timeline-card-mark">${order.includes(id)?'✓':'↗'}</span><span>${esc(label)}</span></button>`).join('')}
        </div>
      </section>
      <section class="timeline-puzzle-section" aria-label="Event sequence">
        <div class="timeline-section-heading"><span class="eyebrow">Your timeline</span><span class="timeline-section-note">Earliest to latest</span></div>
        <div class="timeline-slots">
          ${order.map((id,i)=>`<button class="timeline-drop ${id?'is-filled':'is-empty'}" data-action="place-time" data-index="${i}" data-time-id="${id||''}" draggable="${!!id}" aria-label="Slot ${i+1}: ${id?times[id]:'empty'}"><span class="timeline-slot-number">${String(i+1).padStart(2,'0')}</span><span class="timeline-slot-value">${id?esc(times[id]):'Place an event here'}</span>${id?'<span class="timeline-slot-remove" aria-hidden="true">×</span>':''}</button>`).join('')}
        </div>
      </section>
      <p id="feedback" class="feedback timeline-feedback" aria-live="polite"></p>
      <footer class="timeline-journal-footer"><button class="primary" data-action="check-time">Check sequence →</button><button class="quiet" data-action="reset-time">Reset arrangement</button></footer>
    </article>`, 'dialog-timeline');
}
function dropTime(id,index){if(!Object.hasOwn(times,id)||index<0||index>=3)return;const old=order.indexOf(id),replaced=order[index];if(old>=0)order[old]=replaced;order[index]=id;picked=null;state.timeline=[...order];save();timeline()}
function checkTime(){if(order.join(',')!=='close,sale,ledger'){document.getElementById('feedback').textContent='Not quite. Compare the recorded timestamps and try again.';return}state.timeline=[...order];state.timelineSolved=true;save();render();modal('The timeline holds',`<h2>The timeline holds</h2><p>The shop closed at six, but someone entered a ribbon sale at 6:12. Clara’s stock count was signed at 6:20, eight minutes later. It cannot establish where she was at 6:12.</p><p class="note">A lead, not an accusation. The office correspondence may explain the ribbon.</p><button class="primary" data-action="next" data-index="2">Visit the back office →</button>`)}
function drawer(){if(!all(2)&&!state.drawer)return;modal('The locked drawer',`<h2>The locked drawer</h2><p>A pencilled reminder reads: “The last three digits of the year our first spring began.”</p><label for="code">Three-digit combination</label><input class="code" id="code" maxlength="3" inputmode="numeric" autocomplete="off" placeholder="Three digits"><p id="feedback" class="feedback" aria-live="polite"></p><button class="primary" data-action="check-drawer">Try combination</button>`)}
function checkDrawer(){if(document.getElementById('code').value.trim()!=='986'){document.getElementById('feedback').textContent='That does not open the drawer. Recheck the photograph and the reminder.';return}state.drawer=true;add('drawer-open');render();modal('The correspondence box',`<h2>The correspondence box</h2><img class="evidence-large" src="assets/clue-notes.png" alt="Old correspondence"><p>Inside are postcards signed “E.” One says: “If the letter ever returns, leave it where our first spring began.”</p><p class="note">The garden was a chosen meeting place.</p><button class="primary" data-action="next" data-index="3">Visit Memorial Garden →</button>`)}
let plant=null;
function garden(){
  if(!all(3)&&!state.token)return;
  const choices=['Lavender','Rosemary','Ivy'].map((name,i)=>`
    <button type="button" class="garden-recess ${plant===name?'selected':''}" data-action="plant" data-id="${name}" aria-pressed="${plant===name}">
      <span class="garden-engraving" aria-hidden="true">${['✿','❧','☘'][i]}</span>
      <span class="garden-recess-ring" aria-hidden="true"></span>
      <span class="garden-plant-name">${name}</span>
    </button>`).join('');
  modal('Where spring began',`
    <div class="garden-puzzle">
      <header class="garden-heading"><span class="eyebrow">Chapter 04 · Memorial Garden</span><h2>Where spring began</h2>
      <p>The planting note names the flower that marked their first spring. Find its engraving on the memorial stone.</p></header>
      <div class="garden-stone" role="group" aria-label="Choose the engraved plant">${choices}</div>
      <div class="garden-token-tray"><span class="garden-token" aria-hidden="true">✿</span><div><strong>The brass garden token</strong><small>Found beside Miso in the flower shop</small></div></div>
      <p id="feedback" class="garden-feedback" role="status" aria-live="polite">${plant ? `${esc(plant)} selected. ${plant==='Lavender'?'The engraving looks familiar.':'Compare it with the planting note.'}` : 'Select an engraving to examine its recess.'}</p>
      <div class="garden-actions"><button class="primary" data-action="check-garden" ${plant?'':'disabled'}>Place brass token →</button><button class="quiet" data-action="close">Return to investigation</button></div>
    </div>`, 'dialog-garden');
}
function checkGarden(){
  const feedback=document.getElementById('feedback');
  if(plant!=='Lavender'||!has('miso')){
    if(feedback)feedback.textContent='The token does not fit. Review the planting note and the token Miso found.';
    return;
  }
  // Animate the correct placement before revealing the established story discovery.
  modal('The token fits',`<div class="garden-puzzle garden-success">
    <span class="eyebrow">Chapter 04 · Memorial Garden</span><h2>The token fits</h2>
    <p>The brass token settles into the lavender-shaped recess. A hidden catch clicks beneath the stone.</p>
    <div class="garden-stone garden-stone-opening" aria-label="The brass token slides into the lavender recess">
      <div class="garden-recess selected"><span class="garden-engraving" aria-hidden="true">✿</span><span class="garden-recess-ring" aria-hidden="true"></span><span class="garden-plant-name">Lavender</span></div>
      <span class="garden-animated-token" aria-hidden="true">✿</span>
    </div>
    <div class="garden-actions"><button class="primary" data-action="garden-reveal">Open the hidden compartment →</button></div>
  </div>`, 'dialog-garden');
}
function revealGarden(){
  if(plant!=='Lavender'||!has('miso')||(!all(3)&&!state.token))return;
  state.token=true;save();render();
  modal('The stone opens',`<h2>The stone opens</h2>${boxArt(true)}<p>The token fits beneath the lavender. A wooden box rests inside, protected from the rain. Someone knew exactly where to leave it.</p><button class="primary" data-action="next" data-index="4">Open the memory box →</button>`);
}
function finale(){if(!has('box')||!state.token)return;modal('The letter that wasn’t sent',`<h2>The letter that wasn’t sent</h2>${boxArt(true)}<blockquote class="letter-paper">Dear Elena,<br><br>I mistook your silence for a goodbye. I should have asked instead of letting the years answer for you. I still remember the lavender we planted that first spring. If you wish, meet me there. There is so much I would like to say.<br><br>With love,<br>Bellamy</blockquote><p>Mrs. Bellamy looks at the recovered envelope. There is something she needs to tell you.</p><button class="primary" data-action="begin-reveal">Hear Mrs. Bellamy’s explanation →</button>`)}
function ending(choice){if(!['deliver','keep'].includes(choice)||!has('box')||!state.token)return;state.finished=true;state.resolution=choice;state.dialogue=null;save();render();modal('Case closed',`<h2>${choice==='deliver'?'A first step together':'Room for courage'}</h2><p>${choice==='deliver'?'Mrs. Bellamy takes the letter. You walk beside her toward Elena’s home, leaving the choice to knock in her hands.':'You return the letter to Mrs. Bellamy. She keeps it close and promises herself that this time, she will choose her words before silence chooses for her.'}</p><p class="note">Story complete · Your ending is saved.</p><a class="primary" href="index.html#catalog">Return to all five stories →</a><button class="quiet" data-action="close">Stay in the garden</button>`)}
function exportSave(){const blob=new Blob([JSON.stringify({format:'metriva-story01',version:2,state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='metriva-story01-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
let imported;async function importSave(input){try{const raw=JSON.parse(await input.files[0].text());if(raw.format!=='metriva-story01'||!raw.state||!Number.isInteger(raw.state.chapter)||!Array.isArray(raw.state.found)||raw.state.found.some(id=>!lookup(id)&&id!=='drawer-open'))throw Error();imported=normalize(raw.state);modal('Import this save?',`<h2>Import this save?</h2><p>Replace only Story 01 progress with the imported save?</p><button class="primary" data-action="apply-import">Use imported save</button><button class="quiet" data-action="close">Keep current progress</button>`)}catch{modal('Save not imported','<h2>Save not imported</h2><p>Choose a valid exported Metriva Story 01 save. Your progress is unchanged.</p>')}}

document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b||b.disabled)return;const i=Number(b.dataset.index),id=b.dataset.id;
switch(b.dataset.action){
case 'zoom-clue':
  zoomClue(id);
  break;

case 'zoom-in':
  changeClueZoom(0.25);
  break;

case 'zoom-out':
  changeClueZoom(-0.25);
  break;

case 'zoom-reset':
  resetClueZoom();
  break;

case 'back-to-evidence':
  evidence(id, false);
  break;
case'close':close();break;case'next':go(i);break;case'inspect':evidence(id,true);break;case'evidence':evidence(id);break;case'discovery':showDiscovery();break;case'talk':talk(i);break;case'answer':chooseQuestion(Number(b.dataset.answer));break;case'dialogue-next':nextDialogue();break;case'dialogue-log':conversationLog();break;case'resume-dialogue':showConversation();break;case'tab':tab=b.dataset.tab;render();break;case'hint':hintView=null;hint();break;case'hint-prev':hint(hintView.index-1);break;case'hint-next':hint(hintView.index+1);break;case'hint-select':hint(i);break;case'map':map();break;case'timeline':timeline();break;case'pick-time':picked=id;timeline();break;case'place-time':if(picked){order=order.map(v=>v===picked?null:v);order[i]=picked;picked=null}else order[i]=null;state.timeline=[...order];save();timeline();break;case'reset-time':timeline(true);break;case'check-time':checkTime();break;case'drawer':drawer();break;case'check-drawer':checkDrawer();break;case'garden':garden();break;case'plant':plant=id;garden();break;case'check-garden':checkGarden();break;case'garden-reveal':revealGarden();break;case'finale':finale();break;case'begin-reveal':beginReveal();break;case'ending':ending(id);break;case'export':exportSave();break;case'import':document.getElementById('import-save').click();break;case'apply-import':state=imported;state.chapter=Math.min(state.chapter,unlocked());if(state.dialogue&&state.dialogue.chapter!==state.chapter)state.dialogue=null;imported=null;save();close();render();break;case'restart':modal('Begin the story again?',`<div class="restart-story"><span class="eyebrow">Your investigation</span><h2>Begin the story again?</h2><p>Restarting <strong>The Vanishing Letter</strong> clears its collected evidence, conversations, puzzles, and ending.</p><p class="restart-story-note">Your other stories won't be affected. Export your save first if you want to keep this progress.</p><div class="restart-story-actions"><button class="primary" data-action="close">Keep my progress</button><button class="quiet" data-action="confirm-restart">Restart story</button></div></div>`,'dialog-restart');break;case'confirm-restart':state=fresh();hintView=null;order=[];plant=null;save();close();render();break}});
let draggedTime=null;
document.addEventListener('dragstart',e=>{const card=e.target.closest('#modal [data-time-id][draggable="true"]');if(!card||!card.dataset.timeId)return;draggedTime=card.dataset.timeId;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',draggedTime);card.classList.add('timeline-dragging')});
document.addEventListener('dragover',e=>{const slot=e.target.closest('#modal .timeline-drop');if(!slot||!draggedTime)return;e.preventDefault();e.dataTransfer.dropEffect='move';document.querySelectorAll('#modal .timeline-drop').forEach(b=>b.classList.toggle('timeline-over',b===slot))});
document.addEventListener('dragleave',e=>{const slot=e.target.closest('#modal .timeline-drop');if(slot&&!slot.contains(e.relatedTarget))slot.classList.remove('timeline-over')});
document.addEventListener('drop',e=>{const slot=e.target.closest('#modal .timeline-drop');if(!slot||!draggedTime)return;e.preventDefault();const id=e.dataTransfer.getData('text/plain')||draggedTime;draggedTime=null;dropTime(id,Number(slot.dataset.index))});
document.addEventListener('dragend',()=>{draggedTime=null;document.querySelectorAll('#modal .timeline-over,#modal .timeline-dragging').forEach(b=>b.classList.remove('timeline-over','timeline-dragging'))});
document.addEventListener('change',e=>{if(e.target.id==='import-save')importSave(e.target)});document.addEventListener('keydown',e=>{const overlay=document.getElementById('modal');if(overlay.classList.contains('hidden'))return;if(e.key==='Escape'){close();return}if(e.key==='Enter'&&e.target.id==='code'){checkDrawer();return}if(e.key==='Tab'){const a=[...overlay.querySelectorAll('button:not(:disabled),input,a[href]')],first=a[0],last=a.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
save();render();if(state.dialogue){showConversation()}else if(!state.seenIntro&&state.found.length===0){state.seenIntro=true;save();talk(0)}
})();


