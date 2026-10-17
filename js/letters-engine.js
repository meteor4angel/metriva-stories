(() => {
  'use strict';

  const story = window.LETTERS;
  const KEY = 'metrivastories_letters_after_midnight_v01';
  const masters = [
    'assets/cover-letters-after-midnight.png',
    'assets/letters-master-ch2.png',
    'assets/letters-master-ch3.png',
    'assets/letters-master-ch4.png',
    'assets/letters-master-ch5.png'
  ];
  const positions = [
    { paper:[25,76], edges:[58,59], envelope:[91,53], photo:[9,56] },
    { ink:[28,78], studio:[64,78], box:[94,75], frame:[23,27], rowan:[87,32] },
    { iris87:[8,65], julian87:[70,87], postcard:[67,35], last:[93,45], calendar:[25,44] },
    { mosaic:[44,88], bench:[39,45], door:[80,56], box:[94,73] },
    { station:[25,85], change:[72,88], storm:[94,65], collections:[91,85] }
  ];
  const people = {
    0:{id:'celia',name:'Celia',role:'Iris’s longtime caretaker',portrait:'assets/letters-celia.png',intro:'“Iris kept the attic much as it was. She wrote when the city went quiet.”',questions:[
      ['Why did Iris keep the letters?','“She never told me. But she could never bring herself to throw away even a torn page.”'],
      ['Did she know Julian?','“I heard the name once. She said it softly, as though the years had not made it any easier.”'],
      ['What was Iris like near the end?','“She still visited the rooftop each spring. Some places hold a person’s whole life.”']
    ]},
    1:{id:'rowan',name:'Rowan Ellis',role:'Julian’s grandson and bookbinder',portrait:'assets/letters-rowan.png',intro:'“Granddad never spoke much about this box. He kept every letter.”',questions:[
      ['Did Julian mention Iris?','“No. He was kind, but the past was the one thing he would not explain.”'],
      ['Why were there two bundles?','“The green ink is hers; the violet is his. I had never realized both of them kept writing.”'],
      ['Can we examine the studio?','“Of course. The notebook and the old stationery tin are still where he left them.”']
    ]},
    3:{id:'rowan2',name:'Rowan Ellis',role:'At the rooftop garden',portrait:'assets/letters-rowan.png',intro:'“He came up here every spring. I thought he loved the view.”',questions:[
      ['Do you remember the bench?','“He tended the roses beside it. I never noticed the initials until today.”'],
      ['What happened to the stairwell?','“The notice has been here for years. The storm must have closed it on the very night they planned to meet.”'],
      ['Have you seen the brass box?','“Only from a distance. The stars on its lock look like the tiles beneath our feet.”']
    ]},
    4:{id:'rowan3',name:'Rowan Ellis',role:'Putting the letters together',portrait:'assets/letters-rowan.png',intro:'“We cannot give them that evening back. We can still understand it.”',questions:[
      ['What do the letters tell us?','“They both came. They were simply sent to different places, and the new message never reached Iris.”'],
      ['Why did they keep writing?','“Perhaps each hoped the other might one day hear the words. Neither bundle was ever mailed.”'],
      ['What should we do now?','“First, we tell the truth of that night. Then we can decide how to care for their letters.”']
    ]}
  };
  const alex = {
    name:'Alex Morgan', role:'Iris’s relative · Your investigator', portrait:'assets/letters-alex.png',
    thoughts:[
      'These pages are all Iris left unsaid. I need to understand why she kept them.',
      'Julian kept writing too. There is more to this than a letter that missed the post.',
      'Their dates may explain the silence between them.',
      'The rooftop still holds the pieces of that evening.',
      'We know what happened. Now we decide how their words should be remembered.'
    ]
  };
  const puzzleData = {
    pages:{title:'Restore the Torn Letter',description:'Use the torn edges and the writing across the pages.',items:[['A','A · Dear Julian'],['B','B · The stairs were closed'],['D','D · I hope you understand'],['C','C · I waited by the station']],answer:['A','C','B','D']},
    years:{title:'Arrange the Unsent Years',description:'Order the dated letters from earliest to latest.',items:[['2004','Julian · April 2004'],['1987j','Julian · June 13, 1987'],['1995','Iris · September 1995'],['1987i','Iris · June 12, 1987']],answer:['1987i','1987j','1995','2004']},
    stars:{title:'The Three-Star Lock',description:'Follow the day from first light to last.',items:[['dusk','Dusk'],['dawn','Dawn'],['noon','Noon']],answer:['dawn','noon','dusk']}
  };
  const initial = () => ({chapter:0,found:[],solved:[],ending:null,asked:[],notebook:'evidence'});
  let state;
  try { state = {...initial(),...JSON.parse(localStorage.getItem(KEY)||'{}')}; } catch { state=initial(); }
  if(!Array.isArray(state.found)) state.found=[];
  if(!Array.isArray(state.solved)) state.solved=[];
  if(!Array.isArray(state.asked)) state.asked=[];
  state.chapter=Math.max(0,Math.min(4,Number(state.chapter)||0));
  const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ch=()=>story.chapters[state.chapter];
  const found=(id,i=state.chapter)=>state.found.includes(`${i}:${id}`)||(state.found.includes(id)&&(id!=='box'||i===1));
  const add=(id,i=state.chapter)=>{if(!found(id,i))state.found.push(`${i}:${id}`);save();};
  const solved=i=>state.solved.includes(i);
  const unlocked=()=>Math.min(4,state.solved.length);
  const evidence=()=>ch().spots.filter(s=>!people[state.chapter]||s.id!==people[state.chapter].id);
  const complete=()=>ch().required.every(id=>found(id));
  const modalRoot=document.getElementById('modal');
  function close(){modalRoot.className='hidden';modalRoot.innerHTML='';}
  function modal(body,type=''){
    modalRoot.className='overlay';
    modalRoot.innerHTML=`<div class="dialog ${type}" role="dialog" aria-modal="true" aria-label="Story detail"><div class="dialog-top"><span class="eyebrow">Metriva · Letters After Midnight</span><button type="button" data-close aria-label="Close">✕</button></div>${body}</div>`;
    modalRoot.querySelector('[data-close]').onclick=close;
    modalRoot.querySelector('[data-close]').focus();
  }
  modalRoot.addEventListener('click',e=>{if(e.target===modalRoot)close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modalRoot.classList.contains('hidden')&&!document.querySelector('.clue-zoom-overlay'))close();});
  function render(){
    const i=state.chapter,c=ch(),done=complete(),p=state.ending?100:Math.round(state.solved.length*20),person=people[i];
    const spots=evidence();
    const actionHTML=state.ending
      ? '<button class="primary" id="review-ending">Review the ending →</button>'
      : `<button class="primary" id="puzzle" ${!done||solved(i)?'disabled':''}>Solve chapter puzzle →</button>${solved(i)&&i<4?'<button class="secondary" id="next">Next chapter →</button>':''}${solved(4)?'<button class="secondary" id="ending">Choose how to preserve the letters →</button>':''}<button class="quiet" id="hint">A gentle hint</button>`;
    const castHTML=`<div><hr class="divider"><h3>People</h3><div class="story-cast"><button type="button" class="person-card" data-alex><img src="${alex.portrait}" alt=""><span><strong>${alex.name}</strong><small>${alex.role}</small><em>Alex’s thoughts →</em></span></button>${person?`<button type="button" class="person-card" data-person><img src="${person.portrait}" alt=""><span><strong>${esc(person.name)}</strong><small>${esc(person.role)}</small><em>${found(person.id)?'Speak again':'Talk and record testimony'} →</em></span></button>`:''}</div></div>`;
    document.getElementById('app').innerHTML=`
      <div class="heading"><div><span class="eyebrow">Story 04 · Early 2000s · Five chapters</span><h1>${esc(story.title)}</h1><p>One lost letter. Two people who kept writing. A truth waiting to be read.</p></div><a class="quiet back-link" href="index.html#catalog">← Story library</a></div>
      <div class="chaptertabs" aria-label="Chapters">${story.chapters.map((x,n)=>`<button type="button" data-ch="${n}" class="${n===i?'active':''}" ${n>unlocked()?'disabled':''}>${n+1}. ${esc(x.title)}</button>`).join('')}</div>
      <div class="game"><section class="scene-card"><div class="scene-title"><h2>${esc(c.title)}</h2><span>Chapter ${String(i+1).padStart(2,'0')} / 05</span></div><div class="scene ${i===0?'scene-attic':''}"><img class="scene-art" src="${masters[i]}" alt="${esc(c.title)} investigation scene">${spots.map((s,n)=>{const [x,y]=positions[i][s.id];return `<button type="button" class="hotspot ${found(s.id)?'done':''}" data-spot="${esc(s.id)}" style="--x:${x};--y:${y}" title="${esc(s.label)}" aria-label="Examine ${esc(s.label)}">${found(s.id)?'✓':n+1}</button>`}).join('')}${i===1?`<button type="button" class="hotspot person-marker ${found('rowan')?'done':''}" data-person style="--x:87;--y:33" title="Talk to Rowan" aria-label="Talk to Rowan">${found('rowan')?'✓':'5'}</button>`:''}</div><div class="scene-footer"><span>${esc(c.subtitle)}</span><span>${c.spots.filter(s=>!found(s.id)).length} clues left to examine</span></div><div class="objects">${spots.map(s=>`<button type="button" data-spot="${esc(s.id)}" class="${found(s.id)?'done':''}">${found(s.id)?'✓':'○'} ${esc(s.label)}</button>`).join('')}</div></section>
      <aside class="panel panel-investigation"><div><h2>Investigation</h2><div class="meta">Case progress · ${p}%</div><div class="progress"><span style="width:${p}%"></span></div><p class="story-intro">${esc(c.intro)}</p><div class="objective">${state.ending?'The letters have found their place.':solved(i)?'Chapter solved. Continue when ready.':done?'Every clue is recorded. Piece them together.':'Examine the scene and speak with anyone present.'}</div><div class="actions">${actionHTML}</div></div>${castHTML}</aside></div>
      <section class="notebook panel"><div class="notebook-header"><h2>Case notebook</h2><div class="notebook-tabs"><button type="button" data-tab="evidence" class="${state.notebook==='evidence'?'active':''}">Evidence</button><button type="button" data-tab="people" class="${state.notebook==='people'?'active':''}">People</button></div></div><div id="notebook-content">${notebook()}</div></section><div class="case-tools"><p>Progress is saved automatically in this browser.</p><button type="button" class="quiet" id="restart">↺ Restart this story</button></div>`;
    document.querySelectorAll('[data-ch]').forEach(b=>b.onclick=()=>{state.chapter=Number(b.dataset.ch);save();render();window.scrollTo(0,0);});
    document.querySelectorAll('[data-spot]').forEach(b=>b.onclick=()=>showClue(b.dataset.spot));
    document.querySelectorAll('[data-person]').forEach(b=>b.onclick=showPerson);
    document.querySelectorAll('[data-alex]').forEach(b=>b.onclick=showAlex);
    document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{state.notebook=b.dataset.tab;save();render();});
    if(document.getElementById('puzzle'))document.getElementById('puzzle').onclick=showPuzzle;
    if(document.getElementById('next'))document.getElementById('next').onclick=()=>{state.chapter++;save();render();window.scrollTo(0,0);};
    if(document.getElementById('ending'))document.getElementById('ending').onclick=showEnding;
    if(document.getElementById('review-ending'))document.getElementById('review-ending').onclick=showEndingResult;
    if(document.getElementById('hint'))document.getElementById('hint').onclick=showHint;
    document.getElementById('restart').onclick=()=>{if(confirm('Restart Letters After Midnight? Only this story’s saved progress will be erased.')){state=initial();save();render();}};
  }
  function notebook(){
    if(state.notebook==='people')return `<div class="people-book">${[alex,people[0],people[1]].map(p=>`<div><img class="notebook-portrait" src="${p.portrait}" alt=""><h3>${esc(p.name)}</h3><p>${esc(p.role)}</p></div>`).join('')}</div><div class="testimony-list">${Object.entries(people).filter(([i,p])=>found(p.id,Number(i))).map(([i,p])=>`<p><strong>Chapter ${String(Number(i)+1).padStart(2,'0')} · ${esc(p.name)}:</strong> ${esc(story.chapters[Number(i)].spots.find(s=>s.id===p.id).text)}</p>`).join('')||'<p>Speak with Celia or Rowan to record their memories.</p>'}</div>`;
    const cards=story.chapters.flatMap((c,i)=>c.spots.filter(s=>found(s.id,i)&&(!people[i]||s.id!==people[i].id)).map(s=>({s,i})));
    return `<div class="evidence-grid">${cards.length?cards.map(({s,i})=>`<div class="evidence-card"><img src="assets/letters-c${i+1}-${s.id}.png" alt=""><span><small>Chapter ${String(i+1).padStart(2,'0')}</small><strong>${esc(s.clue)}</strong></span></div>`).join(''):'<p>Examine an object or speak to someone to begin your notebook.</p>'}</div>`;
  }
  function letterReading(id,zoom=false){
    if(state.chapter!==0||!['paper','edges'].includes(id))return '';
    const fragments=[['A','Dear Julian'],['B','The stairs were closed'],['C','I waited by the station'],['D','I hope you understand']];
    return `<section class="letter-reading" ${zoom?'data-zoom-transcript hidden':''} aria-label="Readable letter fragments"><span class="eyebrow">Reading the original handwriting</span><div class="letter-fragments">${fragments.map(([mark,line])=>`<div><strong>${mark}</strong><span>“${esc(line)}”</span></div>`).join('')}</div>${id==='edges'?'<p>The torn edges and continuing sentences join A → C → B → D.</p>':'<p>Each fragment bears the same pressed-flower watermark.</p>'}</section>`;
  }
  function showClue(id){
    const s=ch().spots.find(x=>x.id===id);if(!s)return;
    add(id);render();
    const flipped=state.chapter===0&&id==='envelope';
    const image=flipped?'assets/letters-c1-envelope-front.png':`assets/letters-c${state.chapter+1}-${id}.png`;
    const alt=flipped?'Front of the same envelope after it has been turned over':`Close view of ${s.label} in the same scene`;
    modal(`<span class="eyebrow">Evidence · Chapter ${String(state.chapter+1).padStart(2,'0')}</span><h2>${esc(s.label)}</h2><div class="clue-detail-visual"><img src="${image}" alt="${esc(alt)}"><button type="button" class="clue-zoom-trigger" data-clue-zoom>Zoom image ⤢</button>${letterReading(id,true)}</div>${letterReading(id)}<p class="clue-reading">${esc(s.text)}</p><div class="note"><strong>Notebook:</strong> ${esc(s.clue)}</div><button type="button" class="primary return-button" data-return>Continue exploring →</button>`,'clue-dialog');
    modalRoot.querySelector('[data-return]').onclick=close;
  }
  function showAlex(){
    modal(`<span class="eyebrow">Your character · 2005</span><h2>${alex.name}</h2><div class="conversation"><img src="${alex.portrait}" alt="Portrait of Alex Morgan"><div><span class="speaker">${alex.role}</span><p class="dialogue-line">“${esc(alex.thoughts[state.chapter])}”</p><p>Alex follows the letters from Iris’s attic to Julian’s studio and the rooftop where their story began.</p></div></div><button type="button" class="secondary return-button" data-return>Return to investigation</button>`);
    modalRoot.querySelector('[data-return]').onclick=close;
  }
  function showPerson(){
    const p=people[state.chapter];if(!p)return;
    add(p.id);render();
    function draw(reply=''){
      modal(`<span class="eyebrow">Conversation · Chapter ${String(state.chapter+1).padStart(2,'0')}</span><h2>${esc(p.name)}</h2><div class="conversation"><img src="${p.portrait}" alt="Portrait of ${esc(p.name)}"><div><span class="speaker">${esc(p.role)}</span><p class="dialogue-line">${esc(reply||p.intro)}</p><div class="alex-speaker"><img src="${alex.portrait}" alt=""><span>Alex Morgan asks</span></div><div class="choices">${p.questions.map(([q],n)=>`<button type="button" data-question="${n}" class="${state.asked.includes(`${state.chapter}:${p.id}:${n}`)?'read':''}">${esc(q)} →</button>`).join('')}</div></div></div><button type="button" class="secondary return-button" data-return>Return to investigation</button>`);
      modalRoot.querySelectorAll('[data-question]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.question),key=`${state.chapter}:${p.id}:${n}`;if(!state.asked.includes(key))state.asked.push(key);save();draw(p.questions[n][1]);});
      modalRoot.querySelector('[data-return]').onclick=close;
    }
    draw();
  }
  function showHint(){const c=ch(),key=`letters_hint_${state.chapter}`,n=Math.min(2,Number(sessionStorage.getItem(key)||0));modal(`<h2>A gentle nudge</h2><p>${esc(c.hint[n])}</p><button type="button" class="primary" data-more>${n<2?'A clearer hint →':'Return to investigation'}</button>`);modalRoot.querySelector('[data-more]').onclick=()=>{close();if(n<2){sessionStorage.setItem(key,n+1);showHint();}};}
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
