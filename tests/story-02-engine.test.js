const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
global.window=global;
require('../js/story-engine.js');
const Engine=global.MetrivaStoryEngine;
const story=require('../stories/story-02.json');
const root=path.resolve(__dirname,'..');
const {checkAssets}=require('../scripts/story-visual-continuity.js');

test('Story 02 opens and restarts with Evelyn’s first dialogue',async()=>{
  const chapter=story.chapters[0],evelyn=chapter.characters.find(person=>person.id==='evelyn'),intro=story.openingIntroduction;
  assert.equal(intro.characterId,'evelyn');assert.equal(intro.speaker,'Evelyn Hart');assert.equal(intro.text[0],evelyn.intro);
  assert.ok(story.voiceMap[JSON.stringify([intro.speaker,intro.text.join(' ')])]);
  const runtime=Object.create(Engine.StoryRuntime.prototype);runtime.story=story;runtime.repository={load:async()=>null,clear:async id=>assert.equal(id,story.id)};runtime.applyPageAppearance=()=>{};runtime.normalize=()=>({chapter:0});runtime.goToUnlockedChapter=()=>{};runtime.render=()=>{};runtime.storageAvailable=true;runtime.showRescueDialogue=()=>{};
  let openings=0;runtime.showOpening=()=>{openings++;};await runtime.start();assert.equal(openings,1,'a first visit opens Evelyn’s dialogue');
  runtime.closeModal=()=>{};runtime.render=()=>{};runtime.revision=0;runtime.savedAt=null;runtime.lastError=null;runtime.state={};const previousStorage=global.localStorage;global.localStorage={removeItem(){}};try{await runtime.restart();}finally{global.localStorage=previousStorage;}assert.equal(openings,2,'restarting opens Evelyn’s dialogue again');
  let modal;delete runtime.showOpening;runtime.voiceControl=(speaker,text)=>`<button>${speaker}:${text}</button>`;runtime.conversationMarkup=(person,content,speaker,actions)=>`${person.name}|${speaker}|${content}|${actions}`;runtime.showModal=(title,body,actions,options)=>{modal={title,body,actions,options};};runtime.showOpening();
  assert.equal(modal.title,intro.title);assert.match(modal.body,/Evelyn Hart\|Evelyn Hart/);assert.match(modal.body,/Welcome to Willowmere/);assert.match(modal.body,/Help Evelyn investigate/);assert.equal(modal.options.voiceDialogue,true);
});

test('Story 02 page appearance is reusable, validated, and applies without changing story data',()=>{
  assert.equal(Engine.validateDefinition(story),story);
  assert.equal(story.pageAppearance.chapterPickerIcon,'book');
  assert.deepEqual(checkAssets(story,root),[]);
  const applied=new Map(),classes=new Map(),previousDocument=global.document;
  global.document={baseURI:'file:///C:/metriva-stories/story-02.html',body:{style:{setProperty:(key,value)=>applied.set(key,value)},classList:{toggle:(key,value)=>classes.set(key,value)}}};
  try{
    const runtime=Object.create(Engine.StoryRuntime.prototype);runtime.story=story;runtime.applyPageAppearance();
    assert.equal(classes.get('has-page-appearance'),true);
    assert.equal(applied.get('--s6-page-image'),'url("file:///C:/metriva-stories/assets/story02-library-wide-sunlit.png")');
    assert.equal(applied.get('--s6-green'),story.pageAppearance.palette.accent);
    assert.equal(applied.get('--s6-heading-ink'),story.pageAppearance.palette.headingInk);
    assert.equal(applied.get('--s6-heading-muted'),story.pageAppearance.palette.headingMuted);
    assert.equal(applied.get('--s6-sidebar-width'),'30%');
  }finally{global.document=previousDocument;}
  const invalid=structuredClone(story);invalid.pageAppearance.backgroundImage='../outside.png';
  assert.throws(()=>Engine.validateDefinition(invalid),/pageAppearance.backgroundImage/);
  const invalidIcon=structuredClone(story);invalidIcon.pageAppearance.chapterPickerIcon='<svg>';
  assert.throws(()=>Engine.validateDefinition(invalidIcon),/chapterPickerIcon/);
  const missing=structuredClone(story);missing.pageAppearance.backgroundImage='assets/missing-library.png';
  assert.match(checkAssets(missing,root).join(' '),/page background: missing image/);
});

test('solved chapters review their revelation and B-17 without changing progress',()=>{
  const runtime=Object.create(Engine.StoryRuntime.prototype),puzzle=story.chapters[0].puzzle;
  runtime.story=story;runtime.state={chapter:0,solved:[puzzle.id],bookSlipReady:false};
  let modal;runtime.showModal=(title,body,actions,options)=>{modal={title,body,actions,options};};
  runtime.save=()=>{throw new Error('Review must not save progress');};
  runtime.showPuzzleReview();
  assert.equal(modal.title,'Review the revelations');
  assert.match(modal.body,/library-bookshelf-solved\.png/);
  assert.match(modal.body,/The Misplaced Books/);
  assert.match(modal.body,/folded slip falls from the final book: B-17/);
  assert.equal(modal.options.clueWindow,true);
  assert.match(modal.actions,/data-s6="books-view-slip"/);
  runtime.showCatalogParchment();
  assert.equal(modal.title,'B-17 archival reference');
  assert.equal(modal.options.stack,true);
  assert.doesNotMatch(modal.actions,/books-finish/);
  runtime.state.chapter=1;runtime.state.solved.push(story.chapters[1].puzzle.id);
  runtime.showPuzzleReview();
  assert.match(modal.body,/The solution/);
  assert.match(modal.body,/Clock chime/);
});

test('notebook arrows appear only when cards are clipped and disable at each end',()=>{
  const runtime=Object.create(Engine.StoryRuntime.prototype);
  const previous={hidden:true,disabled:false},next={hidden:true,disabled:false};
  const carousel={classList:{toggle:(name,value)=>{assert.equal(name,'is-overflowing');carousel.overflow=value;}},querySelector:selector=>selector.includes('is-previous')?previous:next};
  const track={parentElement:carousel,scrollWidth:600,clientWidth:300,scrollLeft:0};
  runtime.root={querySelector:()=>track};runtime.updateNotebookNavigation();
  assert.equal(carousel.overflow,true);assert.equal(previous.disabled,true);assert.equal(next.disabled,false);
  track.scrollLeft=300;runtime.updateNotebookNavigation();
  assert.equal(previous.disabled,false);assert.equal(next.disabled,true);
  track.scrollWidth=300;runtime.updateNotebookNavigation();
  assert.equal(previous.hidden,true);assert.equal(next.hidden,true);
});

test('Story 02 keeps the full cast in the panel and shows a visual location picker',()=>{
  assert.equal(story.pageAppearance.peopleMode,'all');
  const runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story=story;runtime.state={chapter:0,solved:[],found:[],completedDialogues:[],objectStates:{}};
  const list={innerHTML:''},help={textContent:''};
  runtime.root={querySelector:selector=>selector==='.s6-people'?list:selector==='.s6-panel .s6-foot-help'?help:null};
  runtime.showAllPeopleInPanel(story.chapters[0]);
  for(const name of ['Evelyn Hart','Theo Mercer','Ada Vale','Eleanor Vale'])assert.match(list.innerHTML,new RegExp(name));
  assert.match(list.innerHTML,/data-s6="character" data-id="evelyn"/);
  assert.match(list.innerHTML,/Theo Mercer[\s\S]*?Not yet met/);
  assert.match(help.textContent,/unlocked location/);
  let modal;runtime.showModal=(title,body)=>{modal={title,body};};
  runtime.showLocations();
  assert.equal(modal.title,'Locations');
  assert.match(modal.body,/You are here/);
  assert.match(modal.body,/Not yet unlocked/);
  assert.equal((modal.body.match(/class="s6-location-card/g)||[]).length,5);
});

test('Story 02 uses the shared definition, existing art, and five original solutions',()=>{
  assert.equal(Engine.validateDefinition(story),story);
  assert.deepEqual(checkAssets(story,root),[]);
  assert.equal(story.chapters.length,5);
  assert.equal(story.chapters.reduce((n,ch)=>n+ch.evidence.length,0),22);
  assert.deepEqual(story.chapters.map(ch=>ch.puzzle.answer),[['120','305','640','810'],['chime','steps','whisper'],'B-17',['window','pillar','stairs'],'eleanor']);
  assert.equal(story.chapters[0].puzzle.presentation.mode,'bookshelf');
  assert.equal(story.chapters[0].puzzle.presentation.candidates.length,7);
  assert.equal(story.chapters[0].puzzle.presentation.handles.length,4);
  assert.deepEqual(story.chapters.at(-1).endings.map(item=>item.id),['exhibit','trustees']);
});

test('Story 02 Chapter 2 uses the ordered-card timeline with fixed side art and configurable icons',async()=>{
  const chapter=story.chapters[1],puzzle=chapter.puzzle,runtime=Object.create(Engine.StoryRuntime.prototype);
  assert.equal(Engine.validateDefinition(story),story);assert.equal(puzzle.presentation.mode,'timeline-clean');assert.equal(puzzle.presentation.layout,'card-slots');
  assert.equal(puzzle.presentation.sideImage,'assets/library-listening-painted.png');assert.deepEqual(puzzle.items.map(item=>item.icon),['speech','clock','footsteps']);
  runtime.story=story;runtime.state={chapter:1,puzzleDrafts:{}};runtime.sequencePuzzleId=puzzle.id;runtime.sequenceSelected=null;runtime.sequenceFeedback='';runtime.current=()=>chapter;
  runtime.showModal=(title,body,actions)=>{runtime.modal={title,body,actions};};runtime.showCleanTimelinePuzzle(chapter,puzzle);
  assert.match(runtime.modal.body,/s6-clean-timeline-layout/);assert.match(runtime.modal.body,/class="s6-clean-timeline-art"/);assert.match(runtime.modal.body,/library-listening-painted\.png/);
  assert.match(runtime.modal.body,/s6-clean-timeline-thumbnail/);assert.match(runtime.modal.body,/data-timeline-slot/);assert.match(runtime.modal.actions,/timeline-check/);assert.match(runtime.modal.actions,/timeline-reset/);
  assert.deepEqual(runtime.state.puzzleDrafts[puzzle.id],[null,null,null]);
  runtime.save=async()=>{};runtime.showCleanTimelinePuzzle=()=>{};await runtime.placeCleanTimelineEvent('chime',0);assert.deepEqual(runtime.state.puzzleDrafts[puzzle.id],['chime',null,null]);
  const broken=structuredClone(story);broken.chapters[1].puzzle.items[0].icon='bad-icon';assert.throws(()=>Engine.validateDefinition(broken),/unsupported timeline item icon/);
  const badImage=structuredClone(story);badImage.chapters[1].puzzle.presentation.sideImage='../private.png';assert.throws(()=>Engine.validateDefinition(badImage),/invalid timeline side artwork/);
});

test('migration retains the original conversation and hint lines',()=>{
  const window={};
  for(const file of ['stories/echoes-library.js','js/library-dialogue.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),{window});
  for(const [chapterIndex,original] of window.LIBRARY_DIALOGUE.entries())for(const [personIndex,person] of original.entries()){
    const migrated=story.chapters[chapterIndex].characters[personIndex];
    assert.equal(migrated.intro,person.intro);
    for(const [questionIndex,lines] of person.questions.entries())assert.deepEqual([migrated.questions[questionIndex].ask,migrated.questions[questionIndex].reply,migrated.questions[questionIndex].followUp,migrated.questions[questionIndex].followReply],[...lines]);
  }
  for(const [index,original] of window.ECHOES.chapters.entries())assert.deepEqual(story.chapters[index].hints,[...original.hint]);
});

test('every Story 02 conversation line has recorded audio and a four-frame portrait',()=>{
  let matched=0;
  for(const chapter of story.chapters)for(const person of chapter.characters){
    const sprite=story.characterSprites[person.id];
    assert.ok(sprite?.src);
    assert.deepEqual(sprite.frames,{idle:0,blink:1,speaking:2,thoughtful:3});
    const speaker=person.historical?'Eleanor’s manuscript':person.name;
    const lines=[[speaker,person.intro],...person.questions.flatMap(q=>[['You',q.ask],[speaker,q.reply],['You',q.followUp],[speaker,q.followReply]])];
    for(const line of lines){assert.ok(story.voiceMap[JSON.stringify(line)],`${person.name}: ${line[1]}`);matched++;}
  }
  for(const line of story.resolution.dialogue){assert.ok(story.voiceMap[JSON.stringify([line.speaker,line.text])]);matched++;}
  assert.equal(matched,76);
  assert.equal(story.autoVoice,true);
});

test('missing animation or audio falls back to a still portrait and readable dialogue',()=>{
  const runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story={characterPortraits:{ada:'assets/ada-still.png'},characterSprites:{},voiceMap:{}};
  const portrait=runtime.portrait({id:'ada',name:'Ada Vale'});
  assert.match(portrait,/img/);assert.match(portrait,/ada-still\.png/);
  assert.equal(runtime.voiceControl('Ada Vale','An unrecorded line.'),'');
  assert.match(runtime.conversationMarkup({id:'ada',name:'Ada Vale'},'<p>Readable dialogue.</p>'),/Readable dialogue/);
  runtime.story=story;
  assert.match(runtime.portrait({id:'ada',name:'Ada Vale'}),/background-position:0% 0%/);
});

test('Story 02 conversation uses a transparent character over the room and moves the mouth only on character lines',()=>{
  const runtime=Object.create(Engine.StoryRuntime.prototype);runtime.story=story;runtime.motionPaused=false;
  runtime.current=()=>story.chapters[0];runtime.sceneSource=chapter=>chapter.scene;
  const person={id:'evelyn',name:'Evelyn Hart'};
  const player=runtime.conversationMarkup(person,'<p class="s6-dialogue-text">A question.</p>','You','<button>Continue</button>');
  const reply=runtime.conversationMarkup(person,'<p class="s6-dialogue-text">An answer.</p>','Evelyn Hart','<button>Continue</button>');
  assert.match(player,/s6-story02-conversation/);assert.match(player,/story02-library-wide-sunlit\.png/);
  assert.match(player,/data-actor-speaking="false"/);assert.match(reply,/data-actor-speaking="true"/);
  assert.match(reply,/s6-conversation-body[\s\S]*<footer class="s6-dialog-actions">/);
  assert.notEqual(Engine.characterFrame(true,false,0,3000),'idle');
  assert.notEqual(Engine.characterFrame(false,false,4100,3000),'speaking');
  assert.equal(Engine.characterFrame(false,true,0,3000),'idle');
  assert.equal(Engine.characterFrame(true,true,0,3000),'speaking');
});

test('Ada and Theo scene clues open their conversations while notebook evidence stays inspectable',()=>{
  for(const [chapterIndex,clueId,personId] of [[1,'theo','theo'],[2,'ada','ada'],[3,'theo2','theo']]){
    const runtime=Object.create(Engine.StoryRuntime.prototype);
    runtime.story=story;runtime.state={chapter:chapterIndex,found:[clueId],objectStates:{}};
    let opened=null,detail=false;
    runtime.openCharacter=id=>{opened=id};runtime.showModal=()=>{detail=true};runtime.sceneSource=chapter=>chapter.scene;
    runtime.inspect(clueId,false,true);
    assert.equal(opened,personId);assert.equal(detail,false);
    runtime.inspect(clueId,false,false);
    assert.equal(detail,true);
  }
  for(const [chapterIndex,clueId] of [[1,'theo'],[3,'theo2']]){
    const chapter=story.chapters[chapterIndex],clue=chapter.evidence.find(item=>item.id===clueId);
    assert.equal(Engine.evidenceView(chapter,clue).frame.y,clue.detailFrame.y);
    assert.ok(clue.detailFrame.y<20,'detail crop includes Theo’s head');
  }
});

test('Story 02 clue art uses the new close-ups and keeps full images available in zoom',()=>{
  assert.equal(story.chapters[0].scene,'assets/story02-library-wide-sunlit.png');
  assert.equal(story.chapters[0].evidence.find(item=>item.id==='music').detailImage,'assets/story02-library-music-box-detached.png');
  assert.equal(story.chapters[0].evidence.find(item=>item.id==='portrait').detailImage,'assets/story02-eleanor-portrait-detached.png');
  for(const [id,image] of Object.entries({register:'story02-accession-register-closeup.png',desk:'story02-eleanor-desk-note-closeup.png',clock:'story02-library-clock-closeup.png'})){
    assert.equal(story.chapters[0].evidence.find(item=>item.id===id).detailImage,`assets/${image}`);
  }
  for(const clue of story.chapters[0].evidence){
    assert.ok(clue.detailImageWidth>0&&clue.detailImageHeight>0,`${clue.id} needs its actual image dimensions`);
    const markup=Engine.evidenceImageMarkup(story.chapters[0],clue);
    if(clue.id==='portrait')continue;
    assert.match(markup,/background-size:contain/);
    assert.ok(markup.includes(`aspect-ratio:${clue.detailImageWidth/clue.detailImageHeight}`));
  }
  const portrait=story.chapters[0].evidence.find(item=>item.id==='portrait');
  const preview=Engine.evidenceImageMarkup(story.chapters[0],portrait);
  assert.ok(!preview.includes('background-size:contain'),'portrait preview focuses on Eleanor and the nameplate');
  const runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story=story;runtime.state={objectStates:{}};runtime.showModal=(_,body)=>{runtime.modalBody=body};
  runtime.zoomEvidence('portrait');
  assert.match(runtime.modalBody,/background-size:contain/,'zoom starts with the complete portrait image');
});

test('voice status follows every Story 02 conversation control',()=>{
  const runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story=story;runtime.current=()=>story.chapters[1];runtime.sceneSource=chapter=>chapter.scene;
  runtime.motionPaused=false;runtime.showModal=(_,body)=>{runtime.modalBody=body};
  runtime.showCharacterConversation('Theo',{id:'theo',name:'Theo Mercer'},'<h2>Theo Mercer</h2>','<button>Conversation log</button><button>Return to investigation</button>');
  assert.ok(runtime.modalBody.indexOf('Pause motion')<runtime.modalBody.indexOf('s6-voice-status'));
  assert.ok(runtime.modalBody.indexOf('Conversation log')<runtime.modalBody.indexOf('s6-voice-status'));
  assert.match(runtime.modalBody,/--s6-conversation-bg-position:right center/);
});

test('legacy browser progress converts to the shared save without losing books or ending',()=>{
  const runtime=Object.create(Engine.StoryRuntime.prototype);runtime.story=story;
  runtime.allowedEvidence=new Set(story.chapters.flatMap(ch=>ch.evidence.map(e=>e.id)));
  runtime.allowedDialogue=new Set(story.chapters.flatMap(ch=>ch.characters.flatMap(p=>p.questions.map(q=>`${ch.id}:${p.id}:${q.id}`))));
  const legacy={chapter:4,found:story.chapters.flatMap(ch=>ch.evidence.map(e=>e.id)),solved:[0,1,2,3,4],heard:['0:0:0'],bookOrder:['120','305','640','810'],bookSeen:['120','305'],bookSlipReady:true,ending:'exhibit'};
  const migrated=runtime.normalize(runtime.convertLegacySave(legacy));
  assert.equal(migrated.chapter,4);assert.equal(migrated.ending,'exhibit');
  assert.deepEqual(migrated.solved,story.chapters.map(ch=>ch.puzzle.id));
  assert.deepEqual(migrated.puzzleDrafts['library-books'],legacy.bookOrder);
  assert.deepEqual(migrated.bookshelfSlots,legacy.bookOrder);
  assert.equal(migrated.bookSlipReady,true);
  assert.ok(migrated.completedDialogues.includes('chapter-1:evelyn:q1'));
});

test('only the exact four-book order opens the compartment',async()=>{
  const scene={isConnected:true,classList:{add(){},remove(){}}},button={disabled:false};
  const runtime=Object.create(Engine.StoryRuntime.prototype);runtime.story=story;runtime.state={bookshelfSlots:['120','210','640','810'],bookSlipReady:false};
  runtime.current=()=>story.chapters[0];runtime.save=async()=>{};runtime.showPuzzle=()=>{};
  runtime.overlay={querySelector:()=>scene,lastElementChild:{querySelector:()=>button,append(){}}};
  const oldDocument=global.document,oldMatchMedia=global.matchMedia;
  global.document={createElement:()=>({dataset:{}})};global.matchMedia=()=>({matches:true});
  try{
    await runtime.checkCatalogBookshelf();assert.equal(runtime.state.bookSlipReady,false);
    runtime.state.bookshelfSlots=['120','305','640','810'];await runtime.checkCatalogBookshelf();assert.equal(runtime.state.bookSlipReady,true);
  }finally{global.document=oldDocument;global.matchMedia=oldMatchMedia;}
});

test('the supplied shelf, fixed tray, book inspection, and parchment replace the old handles and notes',()=>{
  const runtime=Object.create(Engine.StoryRuntime.prototype);runtime.story=story;
  runtime.state={bookshelfSlots:[null,'640',null,'810'],bookInspectionId:'640',bookSlipReady:false};
  runtime.overlay={lastElementChild:null};
  let markup='',actions='';runtime.showModal=(_title,content,footer)=>{markup=content;actions=footer;runtime.overlay.lastElementChild={scrollTop:0,querySelector:()=>null};};
  runtime.showBookshelfPuzzle(story.chapters[0],story.chapters[0].puzzle);
  assert.equal((markup.match(/data-s6="books-slot"/g)||[]).length,4);
  assert.equal((markup.match(/data-s6="books-pick"/g)||[]).length,5);
  assert.doesNotMatch(markup,/data-s6="books-pick"[^>]*data-id="(?:640|810)"/);
  assert.match(markup,/library-bookshelf-original\.png/);
  assert.match(markup,/library-bookshelf-solved\.png/);
  assert.match(markup,/library-catalog-seven\.png/);
  assert.match(markup,/data-s6="books-close"/);
  assert.match(markup,/data-s6="books-clue"/);
  assert.match(markup,/data-s6="puzzle-reset"/);
  assert.doesNotMatch(markup,/data-s6="books-handle"|Your selected books|Eleanor’s Note|data-s6="hint"/);
  assert.ok(!actions);
  runtime.state.bookshelfSlots=[null,null,null,null];
  runtime.state.bookInspectionId=null;
  runtime.showBookshelfPuzzle(story.chapters[0],story.chapters[0].puzzle);
  assert.equal((markup.match(/data-s6="books-pick"/g)||[]).length,7,'all seven books remain available when the shelf is empty');
  assert.equal((markup.match(/class="s6-catalog-tray-cell/g)||[]).length,7);
  runtime.state.bookSlipReady=true;runtime.showBookshelfPuzzle(story.chapters[0],story.chapters[0].puzzle);
  assert.match(markup,/data-s6="books-view-slip"/);
});

test('books can be placed, swapped, removed, and resumed from saved slots',async()=>{
  const runtime=Object.create(Engine.StoryRuntime.prototype);runtime.story=story;runtime.state={bookshelfSlots:[null,null,null,null],bookSlipReady:false};
  runtime.current=()=>story.chapters[0];runtime.save=async()=>{};runtime.showPuzzle=()=>{};
  runtime.bookSelection={kind:'candidate',id:'450'};await runtime.chooseBookSlot(0);
  runtime.bookSelection={kind:'candidate',id:'120'};await runtime.chooseBookSlot(1);
  assert.deepEqual(runtime.state.bookshelfSlots,['450','120',null,null]);
  runtime.bookSelection={kind:'slot',index:0};await runtime.chooseBookSlot(1);
  assert.deepEqual(runtime.state.bookshelfSlots,['120','450',null,null]);
  runtime.bookSelection={kind:'slot',index:1};await runtime.chooseBookSlot(1);
  assert.deepEqual(runtime.state.bookshelfSlots,['120',null,null,null]);
  runtime.allowedEvidence=new Set(story.chapters.flatMap(ch=>ch.evidence.map(e=>e.id)));
  runtime.allowedDialogue=new Set(story.chapters.flatMap(ch=>ch.characters.flatMap(p=>p.questions.map(q=>`${ch.id}:${p.id}:${q.id}`))));
  assert.deepEqual(runtime.normalize(runtime.state).bookshelfSlots,['120',null,null,null]);
});

test('both Story 02 entry pages are built from the identical JSON definition',()=>{
  for(const page of ['story-02.html','echoes-library.html']){
    const html=fs.readFileSync(path.join(root,page),'utf8');
    assert.match(html,/js\/story-engine\.js/);
    const payload=html.match(/<script type="application\/json" id="story-definition">([\s\S]*?)<\/script>/)?.[1];
    assert.ok(payload);
    assert.deepEqual(JSON.parse(payload),story);
  }
});
