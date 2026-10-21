const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
global.window = global;
require('../js/story-engine.js');
const Engine = global.MetrivaStoryEngine;
const story = require('../stories/story-06.json');
const {checkAssets,report}=require('../scripts/story-visual-continuity.js');
const root=path.join(__dirname,'..');

test('every configured story voice path resolves to an available MP3 file',()=>{
  for(const file of fs.readdirSync(path.join(root,'stories')).filter(name=>/^story-\d+\.json$/.test(name))){
    const definition=JSON.parse(fs.readFileSync(path.join(root,'stories',file),'utf8'));
    for(const src of Object.values(definition.voiceMap||{}))assert.ok(fs.existsSync(path.join(root,src)),`${file} points to missing voice audio: ${src}`);
  }
});

test('Story 6 JSON validates and every progression dialogue reference resolves', () => {
  assert.equal(Engine.validateDefinition(story), story);
  const characterIds=new Set(story.chapters.flatMap(chapter=>chapter.characters.map(person=>person.id)));
  characterIds.add(story.caseSubject.id);
  assert.deepEqual(new Set(Object.keys(story.characterPortraits)),characterIds);
  assert.deepEqual(checkAssets(story,root),[]);
  for (const chapter of story.chapters) {
    const keys = new Set(chapter.characters.flatMap(person => person.questions.map(question => `${chapter.id}:${person.id}:${question.id}`)));
    for (const id of chapter.gate.allDialogue || []) assert.ok(keys.has(id), `${chapter.id} gate references ${id}`);
  }
});

test('invalid story definitions fail before render', () => {
  const invalid = structuredClone(story);
  invalid.chapters[0].puzzle.answer = 'unknown';
  assert.throws(() => Engine.validateDefinition(invalid), /invalid choice/i);
});

test('all modal variants share the Metriva Stories brand header',()=>{
  const runtime=Object.create(Engine.StoryRuntime.prototype);runtime.story={title:'The <Quiet> Library'};
  const close='<button class="s6-close" aria-label="Close"></button>';
  for(const options of [{},{voiceDialogue:true},{brandHeader:true},{clueWindow:true,chapterNumber:2,evidenceNumber:2,evidenceTotal:3},{clueWindow:true,clueScroll:true}]){
    const header=runtime.modalHeaderMarkup(options,close);
    assert.match(header,/class="s6-dialog-top s6-clue-brand s6-brand-header"/);
    assert.match(header,/class="s6-clue-book-icon"/);
    assert.match(header,/<strong>Metriva Stories<\/strong>/);
    assert.match(header,/The &lt;Quiet&gt; Library/);
    assert.equal(header.includes('class="s6-close"'),false);
  }
  assert.match(runtime.modalHeaderMarkup({clueWindow:true,chapterNumber:2,evidenceNumber:2,evidenceTotal:3},close),/Chapter 02 · Evidence 02 of 03/);
});

test('new deductions use evidence-backed single answers without unsupported chronology', () => {
  const tower=story.chapters[0].puzzle,aqueduct=story.chapters[2].puzzle;
  assert.equal(tower.type,'choice');assert.equal(tower.answer,'follow-map');
  assert.deepEqual(tower.presentation.evidenceRefs,['cut-rope','bell-ledger','tide-note']);
  assert.doesNotMatch(tower.success,/rope was cut before/i);
  assert.equal(aqueduct.type,'choice');assert.equal(aqueduct.answer,'resonance');
  assert.deepEqual(aqueduct.presentation.evidenceRefs,['water-marks','pipe-diagram','verse-panel','sound-test']);
});

test('machinery plan preserves safe pressure order and its partial selections on resume', () => {
  const puzzle=story.chapters[4].puzzle;
  assert.equal(puzzle.presentation.mode,'machinery-sequence');
  assert.deepEqual(puzzle.answer,['bypass','verify','listen','weight','close-side']);
  const runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story=story;runtime.allowedEvidence=new Set(story.chapters.flatMap(ch=>ch.evidence.map(e=>e.id)));
  runtime.allowedDialogue=new Set(story.chapters.flatMap(ch=>ch.characters.flatMap(p=>p.questions.map(q=>`${ch.id}:${p.id}:${q.id}`))));
  const state=runtime.normalize({chapter:4,puzzleRouteSelections:{[puzzle.id]:['bypass','verify']}});
  assert.deepEqual(state.puzzleRouteSelections[puzzle.id],['bypass','verify']);
  assert.equal(state.rescueDone,false);
  assert.ok(story.chapters[4].rescueDialogue.lines.some(line=>/wouldn't accuse anyone from the ink alone/i.test(line.text)));
});

test('opening uses the existing Edda portrait and current introduction text', () => {
  const runtime=Object.create(Engine.StoryRuntime.prototype);runtime.story=story;
  let modal;runtime.showModal=(title,body)=>{modal={title,body}};
  runtime.showOpening();
  assert.equal(modal.title,story.openingIntroduction.title);
  assert.match(modal.body,/assets\/story06-edda-moss\.png/);
  for(const line of story.openingIntroduction.text)assert.ok(modal.body.includes(line.replaceAll("'",'&#39;').replaceAll('"','&quot;')));
});

test('Chapter 5 board uses master-scene controls and keeps all actions selectable', () => {
  const chapter=story.chapters[4],puzzle=chapter.puzzle,runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story=story;runtime.state={chapter:4,solved:[],puzzleRouteSelections:{[puzzle.id]:['bypass']}};
  let modal;runtime.showModal=(title,body,actions,options)=>{modal={title,body,actions,options}};
  runtime.showMachineryPuzzle(chapter,puzzle);
  assert.equal((modal.body.match(/class="s6-machine-hotspot/g)||[]).length,5);
  assert.equal((modal.body.match(/class="s6-machine-control(?: is-selected)?"/g)||[]).length,5);
  assert.match(modal.body,/story06-works-realistic\.png/);
  assert.match(modal.body,/The gate diagram/);
  assert.match(modal.body,/The upper-hamlet tally/);
  assert.match(modal.body,/s6-machine-system/);
  assert.match(modal.body,/s6-machine-drive-guide/);
  assert.match(modal.body,/s6-machine-water-guide/);
  assert.doesNotMatch(modal.body,/s6-machine-gate-motion/);
  assert.match(modal.body,/s6-machine-timeline/);
  assert.ok(modal.body.indexOf('s6-machine-stage')<modal.body.indexOf('s6-machine-scene'));
  assert.ok(modal.body.indexOf('s6-machine-scene')<modal.body.indexOf('s6-machine-proposal'));
  assert.ok(modal.body.indexOf('s6-machine-proposal')<modal.body.indexOf('s6-machine-actions'));
  assert.doesNotMatch(modal.body,/is-confirming/);
  assert.equal(modal.options.clueScroll,true);
  assert.match(modal.actions,/data-s6="puzzle-check"/);
  assert.doesNotMatch(modal.actions,/data-s6="puzzle-check" disabled/);
  runtime.machineryConfirming=true;
  runtime.showMachineryPuzzle(chapter,puzzle);
  assert.match(modal.body,/is-confirming/);
  assert.match(modal.body,/Counterweight released/);
});

test('Chapter 5 rescue reveals Edda without compositing a false doorway', () => {
  const runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story=story;runtime.state={chapter:4,solved:[]};runtime.save=()=>{};runtime.render=()=>{};
  let modal;runtime.showModal=(title,body,actions)=>{modal={title,body,actions}};
  runtime.solvePuzzle();
  assert.match(modal.body,/story06-edda-moss\.png/);
  assert.match(modal.body,/The bypass drains the chamber/);
  assert.match(modal.actions,/Speak with Edda/);
});

test('Edda is available after rescue using the existing dialogue, and both endings remain', async () => {
  const runtime=Object.create(Engine.StoryRuntime.prototype);runtime.story=story;
  runtime.state={chapter:4,solved:story.chapters.map(ch=>ch.puzzle.id),rescueDone:true,ending:null};
  let modal;runtime.showModal=(title,body,actions)=>{modal={title,body,actions}};
  runtime.showEddaConversation();
  assert.match(modal.body,/story06-edda-expressions\.png/);
  assert.match(modal.body,/s6-stage-conversation s6-story06-conversation/);
  assert.match(modal.body,/<footer class="s6-dialog-actions">[\s\S]*Conversation log[\s\S]*Pause motion/);
  assert.equal(modal.actions,undefined,'conversation controls stay in the dialogue card');
  assert.equal((modal.body.match(/data-s6="edda-ask"/g)||[]).length,6);
  assert.match(modal.body,/class="s6-choice-list"/);
  const lines=story.chapters[4].rescueDialogue.lines;
  for(let index=0;index<lines.length;index+=2){
    runtime.showEddaConversation();
    assert.ok(modal.body.includes(lines[index].text.replaceAll("'",'&#39;').replaceAll('"','&quot;')));
    runtime.showEddaExchange(index);
    assert.ok(modal.body.includes(lines[index].text.replaceAll("'",'&#39;').replaceAll('"','&quot;')));
    assert.match(modal.body,/Hear the reply/);
    runtime.showEddaExchange(index,1);
    assert.ok(modal.body.includes(lines[index+1].text.replaceAll("'",'&#39;').replaceAll('"','&quot;')));
    assert.match(modal.body,/Back to topics/);
    assert.match(modal.body,/Replay this exchange/);
  }
  assert.equal(story.chapters[4].endings.length,2);
  runtime.save=async()=>{};runtime.render=()=>{};
  for(const ending of story.chapters[4].endings){await runtime.chooseEnding(ending.id);assert.equal(runtime.state.ending,ending.id);}
});

test('Story 06 expression sheets exist for every portrait and keep player lines still',()=>{
  const root=path.resolve(__dirname,'..');
  for(const id of Object.keys(story.characterPortraits)){
    const sprite=story.characterSprites[id];
    assert.ok(sprite,`${id} has an expression sheet`);
    assert.ok(fs.existsSync(path.join(root,sprite.src)),sprite.src);
    assert.deepEqual([sprite.frames.idle,sprite.frames.speaking,sprite.frames.thoughtful,sprite.frames.relieved],[0,1,2,3]);
  }
  const runtime=Object.create(Engine.StoryRuntime.prototype);runtime.story=story;
  runtime.current=()=>story.chapters[4];runtime.sceneSource=chapter=>chapter.scene;
  const playerLine=runtime.conversationMarkup({id:'edda',name:'Edda Moss'},'<p>You speak.</p>','You');
  const eddaLine=runtime.conversationMarkup({id:'edda',name:'Edda Moss'},'<p>Edda speaks.</p>','Edda Moss');
  assert.match(playerLine,/data-actor-speaking="false"/);
  assert.match(eddaLine,/data-actor-speaking="true"/);
  assert.match(eddaLine,/s6-stage-conversation s6-story06-conversation/);
  assert.match(eddaLine,/story06-works-realistic\.png/);
});

test('Edda uses the original four-frame portrait without added expression layers',()=>{
  const sheet=story.characterSprites.edda;
  assert.deepEqual(sheet.frames,{idle:0,speaking:1,thoughtful:2,relieved:3});
  assert.equal(sheet.expressions,undefined);
  assert.ok(story.chapters[4].rescueDialogue.lines.every(line=>line.expression===undefined));
  const runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story=story;runtime.state={chapter:4,rescueLine:1,rescueDone:false};
  runtime.current=()=>story.chapters[4];runtime.sceneSource=chapter=>chapter.scene;
  let body;runtime.showModal=(_,content)=>{body=content};
  runtime.showRescueDialogue();
  assert.match(body,/story06-edda-expressions\.png/);
  assert.doesNotMatch(body,/s6-expression-face|data-expression=/);
});

test('reopening a completed conversation returns to topics and Edda replay starts at the question',()=>{
  const person=story.chapters[0].characters[0];
  const runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story=story;
  runtime.state={chapter:0,dialogue:{chapter:0,characterId:person.id,questionId:person.questions[0].id,phase:'exchange',line:3},completedDialogues:['tower:rian:bell']};
  runtime.current=()=>story.chapters[0];runtime.characterAvailable=()=>true;
  runtime.save=()=>{};runtime.renderDialogue=()=>{};
  runtime.openCharacter(person.id);
  assert.deepEqual(runtime.state.dialogue,{chapter:0,characterId:person.id,questionId:null,phase:'menu',line:0,showIntro:false});
  assert.deepEqual(runtime.state.completedDialogues,['tower:rian:bell']);
  assert.deepEqual(runtime.state.characterIntrosSeen,['tower:rian:intro']);

  runtime.state={chapter:4,rescueDone:true};runtime.current=()=>story.chapters[4];
  runtime.sceneSource=chapter=>chapter.scene;runtime.isSolved=()=>true;
  let body;runtime.showModal=(_,content)=>{body=content};
  runtime.showEddaConversation();
  assert.match(body,/data-s6="edda-ask"/);
  runtime.showEddaExchange(2);
  assert.match(body,/We followed your map\. And the bell\./);
  assert.match(body,/Hear the reply/);
  runtime.showEddaExchange(2,1);
  assert.match(body,/Back to topics/);
  assert.match(body,/Replay this exchange/);
  runtime.showEddaExchange(2);
  assert.match(body,/Hear the reply/);
});

test('sequence puzzle inserts a stop at its destination and keeps the saved identity order', () => {
  const puzzle=story.chapters[1].puzzle;
  assert.equal(puzzle.presentation.mode,'interactive-route');
  const initial=puzzle.items.map(item=>item.id);
  const moved=Engine.insertSequenceItem(initial,0,3);
  assert.deepEqual(moved,['east','aqueduct','orchard','springworks']);
  assert.deepEqual(initial,['springworks','east','aqueduct','orchard']);
  assert.deepEqual(Engine.insertSequenceItem(moved,2,1),puzzle.answer);
  assert.deepEqual(Engine.insertSequenceItem(moved,-1,2),moved);
});

test('valve route records partial selections, lights only the correct prefix, and can be corrected', () => {
  const puzzle=story.chapters[1].puzzle,ids=[...puzzle.items,...puzzle.presentation.decoys].map(item=>item.id);
  let selected=[];
  selected=Engine.toggleRouteSelection(selected,'east',ids);
  assert.deepEqual(selected,['east']);
  assert.equal(Engine.routeCorrectPrefix(selected,puzzle.answer),1);
  selected=Engine.toggleRouteSelection(selected,'aqueduct',ids);
  assert.equal(Engine.routeCorrectPrefix(selected,puzzle.answer),1);
  assert.deepEqual(Engine.normalizeRouteSelection(selected,ids),selected);
  selected=Engine.toggleRouteSelection(selected,'aqueduct',ids);
  selected=Engine.toggleRouteSelection(selected,'orchard',ids);
  selected=Engine.toggleRouteSelection(selected,'aqueduct',ids);
  selected=Engine.toggleRouteSelection(selected,'springworks',ids);
  assert.deepEqual(selected,puzzle.answer);
  assert.equal(Engine.routeCorrectPrefix(selected,puzzle.answer),4);
  assert.deepEqual(Engine.normalizeRouteSelection(['east','east'],ids),[]);
  assert.deepEqual(Engine.normalizeRouteSelection(['unknown'],ids),[]);
  assert.deepEqual(Engine.normalizeRouteSelection(['east','lower-return','aqueduct','springworks'],ids,4),['east','lower-return','aqueduct','springworks']);
  assert.deepEqual(Engine.normalizeRouteSelection(['east','lower-return','aqueduct','springworks','orchard'],ids,4),[]);
  assert.equal(puzzle.presentation.network.edges.length,13);
  assert.equal(puzzle.presentation.decoys.length,5);
  assert.deepEqual(Engine.findNetworkPath(puzzle.presentation.network.edges,'east','lower-return').map(edge=>edge.to),['west-junction','lower-return']);
  assert.equal(checkAssets(story,root).length,0);
});

test('interactive chart keeps proposed pipe segments amber until the route is solved', () => {
  const chapter=story.chapters[1],puzzle=chapter.puzzle;
  const runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story=story;
  runtime.state={chapter:1,solved:[],puzzleRouteSelections:{[puzzle.id]:['east','orchard','aqueduct']}};
  runtime.routeZoom=1;
  let modal;
  runtime.showModal=(title,body,actions)=>{modal={title,body,actions};};
  runtime.showRoutePuzzle(chapter,puzzle);
  assert.match(modal.body,/story06-pump-valve-chart-puzzle\.png/);
  assert.match(modal.body,/viewBox="0 0 1672 941"/);
  assert.equal((modal.body.match(/s6-route-pipe is-lit/g)||[]).length,0);
  assert.ok((modal.body.match(/s6-route-pipe is-traced/g)||[]).length>=4);
  assert.equal((modal.body.match(/class="s6-route-valve /g)||[]).length,9);
  assert.match(modal.body,/data-id="lower-return"/);
  assert.doesNotMatch(modal.body,/story06-pump-valve-chart-detail\.png/);
  assert.match(modal.actions,/route-original/);
  runtime.state.puzzleRouteSelections[puzzle.id]=['east','springworks','aqueduct'];
  runtime.showRoutePuzzle(chapter,puzzle);
  assert.equal((modal.body.match(/s6-route-pipe is-lit/g)||[]).length,0);
  assert.ok((modal.body.match(/s6-route-pipe is-traced/g)||[]).length>2);
  runtime.state.puzzleRouteSelections[puzzle.id]=['east','lower-return','aqueduct'];
  runtime.showRoutePuzzle(chapter,puzzle);
  assert.equal((modal.body.match(/s6-route-pipe is-lit/g)||[]).length,0);
  assert.ok((modal.body.match(/s6-route-pipe is-traced/g)||[]).length>=3);
  runtime.routeZoom=2;
  runtime.showRoutePuzzle(chapter,puzzle);
  assert.match(modal.body,/viewBox="[\d.]+ [\d.]+ 836 470\.5"/);
  assert.match(modal.body,/cx="469" cy="328"/);
  runtime.state.solved=[puzzle.id];runtime.showRoutePuzzle(chapter,puzzle);
  assert.ok((modal.body.match(/s6-route-pipe is-lit/g)||[]).length>=4);
  assert.match(modal.body,/Emerald confirms the discovered route/);
});

test('interactive route rejects misaligned or missing chart geometry', () => {
  const missing=structuredClone(story);
  missing.chapters[1].puzzle.presentation.network.edges.pop();
  assert.throws(()=>Engine.validateDefinition(missing),/disconnected valve routes/i);
  const misaligned=structuredClone(story);
  misaligned.chapters[1].puzzle.presentation.locations.east.x=9999;
  assert.throws(()=>Engine.validateDefinition(misaligned),/coordinates for each location/i);
});

test('route selections save halfway, permit correction, and a solved route can be reviewed', async () => {
  const chapter=story.chapters[1],puzzle=chapter.puzzle;
  const runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story=story;
  runtime.state={chapter:1,solved:[],puzzleRouteSelections:{[puzzle.id]:[]}};
  runtime.save=async()=>{};
  runtime.showRoutePuzzle=()=>{};
  runtime.overlay={querySelectorAll:()=>[]};
  await runtime.routeSelect('east');
  await runtime.routeSelect('lower-return');
  const saved=structuredClone(runtime.state.puzzleRouteSelections);
  const ids=[...puzzle.items,...puzzle.presentation.decoys].map(item=>item.id);
  assert.deepEqual(Engine.normalizeRouteSelection(saved[puzzle.id],ids,puzzle.items.length),['east','lower-return']);
  await runtime.routeUndo();assert.deepEqual(runtime.state.puzzleRouteSelections[puzzle.id],['east']);
  await runtime.routeSelect('lower-return');
  await runtime.routeSelect('lower-return');
  await runtime.routeSelect('orchard');
  assert.deepEqual(runtime.state.puzzleRouteSelections[puzzle.id],['east','orchard']);
  await runtime.routeSelect('north-bypass');
  await runtime.routeSelect('basin-feed');
  await runtime.routeSelect('upper-branch');
  assert.deepEqual(runtime.state.puzzleRouteSelections[puzzle.id],['east','orchard','north-bypass','basin-feed']);
  const feedback={textContent:''};
  runtime.overlay.querySelector=selector=>selector==='#s6-puzzle-feedback'?feedback:null;
  let solved=false;runtime.solvePuzzle=()=>{solved=true;};
  await runtime.puzzleCheck();
  assert.equal(solved,false);
  assert.match(feedback.textContent,/does not quite match the evidence/);
  runtime.state.solved=[puzzle.id];
  let reviewed=false;
  runtime.chapterGateMet=()=>true;
  runtime.showRoutePuzzle=()=>{reviewed=true;};
  runtime.showPuzzle();
  assert.equal(reviewed,true);
});

test('garden route uses the survey geography without validating partial selections', () => {
  const chapter=story.chapters[3],puzzle=chapter.puzzle;
  assert.equal(puzzle.presentation.mode,'garden-route');
  assert.equal(puzzle.presentation.image.src,chapter.spatial.views.find(view=>view.id==='garden-map-view').image.src);
  assert.notDeepEqual(puzzle.presentation.verse.map(line=>line.id),puzzle.answer);
  const arch=puzzle.presentation.locations['third-arch'],door=puzzle.presentation.locations['spring-door'];
  assert.ok(Math.hypot(arch.x-door.x,arch.y-door.y)>114,'landmark touch targets must not overlap');
  const runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story=story;runtime.state={chapter:3,solved:[],puzzleRouteSelections:{[puzzle.id]:[]}};
  let modal;runtime.showModal=(title,body,actions)=>{modal={title,body,actions};};
  runtime.showGardenPuzzle(chapter,puzzle);
  assert.match(modal.body,/story06-garden-map-puzzle\.png/);
  assert.match(modal.body,/viewBox="0 0 1672 941"/);
  assert.equal((modal.body.match(/class="s6-garden-landmark /g)||[]).length,4);
  assert.equal((modal.body.match(/class="s6-garden-trace /g)||[]).length,0);
  assert.match(modal.actions,/garden-undo/);
  runtime.state.puzzleRouteSelections[puzzle.id]=['east','reeds','spring-door'];
  runtime.showGardenPuzzle(chapter,puzzle);
  assert.equal((modal.body.match(/s6-garden-trace is-confirmed/g)||[]).length,0);
  assert.equal((modal.body.match(/s6-garden-trace is-exploring/g)||[]).length,2);
  assert.match(modal.body,/Your selected order/);
  runtime.gardenZoom=2;
  runtime.showGardenPuzzle(chapter,puzzle);
  assert.match(modal.body,/viewBox="[\d.]+ [\d.]+ 836 470\.5"/);
  assert.match(modal.body,/translate\(1152 640\)/);
  runtime.state.solved=[puzzle.id];runtime.showGardenPuzzle(chapter,puzzle);
  assert.equal((modal.body.match(/s6-garden-trace is-confirmed/g)||[]).length,3);
});

test('garden route saves partial choices, supports undo and rejects a wrong route', async () => {
  const chapter=story.chapters[3],puzzle=chapter.puzzle,ids=puzzle.items.map(item=>item.id);
  const runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story=story;runtime.state={chapter:3,solved:[],puzzleRouteSelections:{[puzzle.id]:[]}};
  runtime.save=async()=>{};runtime.showGardenPuzzle=()=>{};
  runtime.overlay={querySelectorAll:()=>[],querySelector:selector=>selector==='#s6-puzzle-feedback'?{textContent:''}:null};
  await runtime.gardenSelect('east');await runtime.gardenSelect('third-arch');
  const saved=structuredClone(runtime.state.puzzleRouteSelections);
  assert.deepEqual(Engine.normalizeRouteSelection(saved[puzzle.id],ids,4),['east','third-arch']);
  await runtime.gardenUndo();assert.deepEqual(runtime.state.puzzleRouteSelections[puzzle.id],['east']);
  await runtime.gardenSelect('reeds');await runtime.gardenSelect('spring-door');await runtime.gardenSelect('third-arch');
  let solved=false;runtime.solvePuzzle=()=>{solved=true;};await runtime.puzzleCheck();
  assert.equal(solved,false);assert.match(runtime.gardenFeedback,/does not quite match the evidence/);
  await runtime.gardenSelect('spring-door');await runtime.gardenSelect('spring-door');
  const matchMedia=global.matchMedia;global.matchMedia=()=>({matches:true});
  runtime.render=()=>{};runtime.showPuzzle=()=>{};runtime.overlay.classList={contains:()=>false};runtime.completionToken=0;
  try {await runtime.puzzleCheck();assert.equal(solved,true);} finally {global.matchMedia=matchMedia;}
  const resumed=Object.create(Engine.StoryRuntime.prototype);
  resumed.story=story;resumed.allowedEvidence=new Set(story.chapters.flatMap(ch=>ch.evidence.map(e=>e.id)));
  resumed.allowedDialogue=new Set(story.chapters.flatMap(ch=>ch.characters.flatMap(p=>p.questions.map(q=>`${ch.id}:${p.id}:${q.id}`))));
  assert.deepEqual(resumed.normalize({chapter:3,puzzleRouteSelections:saved}).puzzleRouteSelections[puzzle.id],saved[puzzle.id]);
});

test('garden presentation rejects missing or misplaced landmarks', () => {
  const missing=structuredClone(story);delete missing.chapters[3].puzzle.presentation.locations.reeds;
  assert.throws(()=>Engine.validateDefinition(missing),/garden coordinates/);
  const misplaced=structuredClone(story);misplaced.chapters[3].puzzle.presentation.locations.east.x=3000;
  assert.throws(()=>Engine.validateDefinition(misplaced),/garden coordinates/);
});

test('evidence dialog closes back to its mounted puzzle and restores the opener', () => {
  const originalDocument=global.document;
  const classes=new Set(['is-hidden']);
  const overlay={children:[],classList:{contains:name=>classes.has(name),add:name=>classes.add(name),remove:name=>classes.delete(name)}};
  const makeDialog=markup=>{
    const dialog={markup,hidden:false,inert:false,isConnected:true,attributes:new Map(),setAttribute(name,value){this.attributes.set(name,value)},removeAttribute(name){this.attributes.delete(name)},querySelector(){return {isConnected:true,focus(){global.document.activeElement=this}}},remove(){this.isConnected=false;overlay.children.pop()}};
    return dialog;
  };
  Object.defineProperty(overlay,'innerHTML',{set(value){this.children=value?[makeDialog(value)]:[]},get(){return ''}});
  Object.defineProperty(overlay,'lastElementChild',{get(){return this.children.at(-1)||null}});
  overlay.insertAdjacentHTML=(_,markup)=>overlay.children.push(makeDialog(markup));
  const opener={isConnected:true,focus(){global.document.activeElement=this}};
  global.document={activeElement:opener,querySelector:()=>null};
  try {
    const runtime=Object.create(Engine.StoryRuntime.prototype);
    runtime.story=story;runtime.root={inert:false,querySelector:()=>null};runtime.overlay=overlay;runtime.modalStack=[];runtime.completionToken=0;
    runtime.showModal('Puzzle','<p>Map</p>');
    const puzzleDialog=overlay.lastElementChild;
    const evidenceButton={isConnected:true,focus(){global.document.activeElement=this}};
    global.document.activeElement=evidenceButton;
    runtime.showModal('Evidence','<p>Verse</p>','',{stack:true,clueScroll:true});
    assert.equal(overlay.children.length,2);assert.equal(puzzleDialog.hidden,true);assert.equal(puzzleDialog.inert,true);
    assert.match(overlay.lastElementChild.markup,/class="s6-clue-scroll"/);
    assert.match(overlay.lastElementChild.markup,/<\/div><button type="button" class="s6-close"/);
    runtime.showModal('Evidence','<p>Zoomed verse</p>','',{preserveStack:true});
    assert.equal(overlay.children.length,2,'redrawing the top overlay keeps its puzzle beneath');
    runtime.closeModal();
    assert.equal(overlay.children.length,1);assert.equal(overlay.lastElementChild,puzzleDialog);
    assert.equal(puzzleDialog.hidden,false);assert.equal(puzzleDialog.inert,false);
    assert.equal(global.document.activeElement,evidenceButton);assert.equal(runtime.root.inert,true);
    runtime.closeModal();
    assert.equal(classes.has('is-hidden'),true);assert.equal(runtime.root.inert,false);
  } finally {global.document=originalDocument;}
});

test('a correct valve route saves before its completion animation and is reviewable', async () => {
  const puzzle=story.chapters[1].puzzle;
  const runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story=story;runtime.state={chapter:1,solved:[],puzzleRouteSelections:{[puzzle.id]:[...puzzle.answer]}};
  let saves=0,animated=false,lead=false;
  runtime.save=async()=>{saves++};runtime.render=()=>{};
  runtime.showPuzzle=()=>{animated=runtime.routeConfirming===puzzle.id};
  runtime.solvePuzzle=()=>{lead=true};
  runtime.overlay={querySelector:()=>null,classList:{contains:()=>false}};
  runtime.completionToken=0;
  const matchMedia=global.matchMedia;global.matchMedia=()=>({matches:true});
  try {
    await runtime.puzzleCheck();
    assert.deepEqual(runtime.state.solved,[puzzle.id]);
    assert.equal(saves,1);assert.equal(animated,true);assert.equal(lead,true);
  } finally {global.matchMedia=matchMedia;}
});

test('declarative chapter gates require both evidence and completed conversations', () => {
  const progress={evidence:new Set(),dialogue:new Set()};
  const context={hasEvidence:id=>progress.evidence.has(id),hasDialogue:id=>progress.dialogue.has(id)};
  const gate=story.chapters[0].gate;
  assert.equal(Engine.evaluateCondition(gate,context), false);
  gate.allEvidence.forEach(id=>progress.evidence.add(id));
  assert.equal(Engine.evaluateCondition(gate,context), false);
  gate.allDialogue.forEach(id=>progress.dialogue.add(id));
  assert.equal(Engine.evaluateCondition(gate,context), true);
});

test('local progress repository isolates saves and clears by story id', async () => {
  const values = new Map();
  const storage = {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  const repository = new Engine.LocalProgressRepository(storage);
  await repository.save('story-a',{chapter:2},0);
  await repository.save('story-b',{chapter:1},0);
  assert.equal((await repository.load('story-a')).state.chapter,2);
  await repository.clear('story-a');
  assert.equal(await repository.load('story-a'),null);
  assert.equal((await repository.load('story-b')).state.chapter,1);
});

test('API progress adapter sends ETag preconditions and surfaces write conflicts', async () => {
  const requests=[];
  const fetchImpl=async (_url,options)=>{
    requests.push(options);
    if(!options.method||options.method==='GET')return {ok:true,status:200,headers:{get:()=> '"rev-3"'},json:async()=>({state:{chapter:2},revision:3})};
    if(options.method==='PUT')return {ok:true,status:200,headers:{get:()=> '"rev-4"'},json:async()=>({revision:4})};
    return {ok:false,status:412,headers:{get:()=>null},json:async()=>({})};
  };
  const api=new Engine.ApiProgressRepository({baseUrl:'/api/stories',fetchImpl});
  assert.equal((await api.load('story-a')).revision,3);
  assert.equal((await api.save('story-a',{chapter:3},3)).revision,4);
  assert.equal(requests[1].headers['If-Match'],'"rev-3"');
  await assert.rejects(()=>api.clear('story-a'),/412/);
  let createHeaders;
  const createApi=new Engine.ApiProgressRepository({baseUrl:'/api/stories',fetchImpl:async(_url,options)=>{createHeaders=options.headers;return {ok:true,status:200,headers:{get:()=> '"rev-1"'},json:async()=>({revision:1})};}});
  await createApi.save('new-story',{chapter:0},0);
  assert.equal(createHeaders['If-None-Match'],'*');
});

test('built Story 6 page contains a JSON payload matching the authoring source', () => {
  const html=fs.readFileSync(path.join(__dirname,'..','story-06.html'),'utf8');
  const match=html.match(/<script type="application\/json" id="story-definition">([\s\S]*?)<\/script>/);
  assert.ok(match,'embedded JSON story definition is present');
  assert.deepEqual(JSON.parse(match[1]),story);
});

test('catalog keeps the five existing stories and adds Story 6', () => {
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','js','story-config.js'),'utf8'),context);
  const ids=Array.from(context.window.METRIVA_STORIES,entry=>entry.id);
  assert.deepEqual(ids,['vanishing-letter','echoes-library','midnight-train','letters-after-midnight','days-we-almost-met','brackenmere-bell']);
});

test('each Story 6 clue resolves to one physical object and a master-derived view', () => {
  const ids=new Set();
  for(const chapter of story.chapters){
    assert.equal(chapter.spatial.master.src,chapter.scene);
    assert.equal(chapter.spatial.master.width,1672);
    assert.equal(chapter.spatial.master.height,941);
    for(const clue of chapter.evidence){
      const object=chapter.spatial.objects.find(entry=>entry.id===clue.objectId);
      const view=chapter.spatial.views.find(entry=>entry.id===clue.viewId);
      assert.ok(object,clue.id);
      assert.ok(view,clue.id);
      assert.equal(view.objectId,object.id);
      assert.ok(view.visibleObjectIds.includes(object.id));
      assert.ok(!ids.has(object.id),object.id);
      ids.add(object.id);
      assert.equal(Engine.evidenceView(chapter,clue).src,view.image?.src||chapter.scene);
    }
  }
  assert.equal(ids.size,19);
});

test('spatial validation catches broken references, crops, and physical states', () => {
  const badRef=structuredClone(story);
  badRef.chapters[0].evidence[0].objectId='missing.object';
  assert.throws(()=>Engine.validateDefinition(badRef),/unknown physical object/);
  const badFrame=structuredClone(story);
  badFrame.chapters[0].spatial.views[0].frame.width=120;
  assert.throws(()=>Engine.validateDefinition(badFrame),/invalid close-up frame/);
  const badState=structuredClone(story);
  const object=badState.chapters[0].spatial.objects[0];
  object.states.collected={visible:false};
  badState.chapters[0].evidence[0].onExamine=[{objectId:object.id,toState:'collected'}];
  assert.throws(()=>Engine.validateDefinition(badState),/without a matching scene image/);
  const duplicate=structuredClone(story);
  duplicate.chapters[1].spatial.objects[0].id=duplicate.chapters[0].spatial.objects[0].id;
  assert.throws(()=>Engine.validateDefinition(duplicate),/duplicate physical object ID/);
  const omittedNeighbor=structuredClone(story);
  omittedNeighbor.chapters[2].spatial.views.find(view=>view.id==='verse-panel-view').visibleObjectIds=['brackenmere.aqueduct.verse-panel'];
  assert.throws(()=>Engine.validateDefinition(omittedNeighbor),/omits nearby object/);
});

test('object-state transitions select corresponding master art and survive legacy saves', () => {
  const changed=structuredClone(story);
  const chapter=changed.chapters[0],object=chapter.spatial.objects[0];
  object.states.collected={visible:false};
  chapter.evidence[0].onExamine=[{objectId:object.id,toState:'collected'}];
  chapter.spatial.sceneVariants=[{when:{[object.id]:'collected'},src:'assets/tower-without-rope.png'}];
  chapter.spatial.views.find(view=>view.id==='tide-note-view').variants=[{when:{[object.id]:'collected'},src:'assets/map-without-rope.png',width:1672,height:941}];
  Engine.validateDefinition(changed);
  const states=Engine.applyObjectTransitions(changed,{},chapter.evidence[0].onExamine);
  assert.equal(states[object.id],'collected');
  assert.deepEqual(Engine.normalizeObjectStates(changed,states),states);
  assert.deepEqual(Engine.normalizeObjectStates(changed,{[object.id]:'nonexistent'}),{});
  assert.deepEqual(Engine.normalizeObjectStates(changed,undefined),{});
  assert.equal(Engine.sceneImage(chapter,states),'assets/tower-without-rope.png');
  assert.equal(Engine.evidenceView(chapter,chapter.evidence[0],states).src,'assets/tower-without-rope.png');
  const legacy=structuredClone(story);
  for(const item of legacy.chapters){delete item.spatial;for(const clue of item.evidence){delete clue.objectId;delete clue.viewId;delete clue.inspectionRegion;}}
  assert.equal(Engine.validateDefinition(legacy),legacy);
  assert.equal(Engine.sceneImage(legacy.chapters[0],{}),legacy.chapters[0].scene);
});

test('builder asset checks catch missing files and wrong master dimensions', () => {
  assert.deepEqual(checkAssets(story,root),[]);
  const missingPortrait=structuredClone(story);
  missingPortrait.characterPortraits.rian='assets/missing-rian.png';
  assert.match(checkAssets(missingPortrait,root).join(' '),/character rian portrait: missing image/);
  const missing=structuredClone(story);
  missing.chapters[0].spatial.views[0].image={src:'assets/does-not-exist.png',width:10,height:10};
  assert.match(checkAssets(missing,root).join(' '),/missing image/);
  const wrongSize=structuredClone(story);
  wrongSize.chapters[0].spatial.master.width=100;
  assert.match(checkAssets(wrongSize,root).join(' '),/expected 100×941/);
  assert.match(report(story),/Overlapping inspection regions/);
});

test('overlapping inspection regions choose the nearest visible clue', () => {
  const chapter=story.chapters[0];
  const point={x:52,y:79};
  assert.equal(Engine.pickEvidenceAt(chapter,point).id,'tide-note');
  assert.equal(Engine.pickEvidenceAt(chapter,point,item=>item.id!=='tide-note'),null);
  const overlap={x:37,y:73};
  assert.ok(['cut-rope','tide-note'].includes(Engine.pickEvidenceAt(chapter,overlap).id));
});

test('spatial schema is valid JSON and the scene keeps its intrinsic aspect ratio', () => {
  const schema=JSON.parse(fs.readFileSync(path.join(root,'schemas','story-v1-spatial.schema.json'),'utf8'));
  assert.equal(schema.properties.schemaVersion.const,1);
  assert.ok(schema.$defs.spatial.properties.objects);
  assert.ok(schema.$defs.evidence.properties.markerPosition);
  const css=fs.readFileSync(path.join(root,'css','story-engine.css'),'utf8');
  assert.match(css,/\.s6-scene\{[^}]*aspect-ratio:1672\/941/);
  assert.match(css,/\.s6-inspection-region/);
});

test('generated modal uses the fixed overlay style from the page template', () => {
  const template=fs.readFileSync(path.join(root,'templates','story-page.html'),'utf8');
  const page=fs.readFileSync(path.join(root,'story-06.html'),'utf8');
  const css=fs.readFileSync(path.join(root,'css','story-engine.css'),'utf8');
  for(const html of [template,page])assert.match(html,/<div id="story-modal" class="s6-overlay is-hidden"><\/div>/);
  assert.match(css,/\.s6-overlay\{position:fixed;inset:0;z-index:50;display:grid;place-items:center/);
  assert.match(css,/\.s6-overlay\.is-hidden\{display:none\}/);
});

test('all scene clue markers share a translucent green size and clue buttons stay content-sized',()=>{
  const css=fs.readFileSync(path.join(root,'css','story-engine.css'),'utf8');
  assert.match(css,/\.s6-scene \.s6-hotspot[^}]*width:48px;height:48px;min-width:48px;min-height:48px/);
  assert.match(css,/\.s6-scene \.s6-hotspot[^}]*border:2px solid #668565/);
  assert.match(css,/\.s6-scene \.s6-hotspot[^}]*0 0 0 7px rgba\(198,218,183,\.42\)/);
  assert.match(css,/\.s6-scene \.s6-hotspot[^}]*background:rgba\(196,222,198,\.88\)/);
  assert.match(css,/\.s6-scene \.s6-hotspot:not\(:disabled\)\{cursor:var\(--s6-cursor-interactive,pointer\)!important\}/);
  assert.match(css,/\.s6-evidence-window \.s6-dialog-actions>\*\{flex:0 1 auto;min-width:0;width:auto;max-width:100%;min-height:42px/);
  assert.match(css,/\.s6-evidence-window-recap \.s6-dialog-actions>\*\{flex:0 1 auto;width:auto;max-width:100%/);
});

test('evidence preview and notebook thumbnail use the same master-scene crop', () => {
  const chapter=story.chapters[0],item=chapter.evidence[0];
  const preview=Engine.evidenceImageMarkup(chapter,item,{});
  const thumb=Engine.evidenceImageMarkup(chapter,item,{},'s6-evidence-thumb');
  assert.match(preview,/class="s6-evidence-preview"/);
  assert.match(thumb,/class="s6-evidence-thumb"/);
  for(const markup of [preview,thumb]){
    assert.match(markup,/story06-tower-realistic\.png/);
    assert.match(markup,/background-size:/);
    assert.match(markup,/background-position:/);
    assert.doesNotMatch(markup,/NaN|Infinity/);
  }
  const runtime=fs.readFileSync(path.join(root,'js','story-engine.js'),'utf8');
  assert.match(runtime,/evidenceImageMarkup\(chapter,item,this\.state\.objectStates,/);
  assert.match(runtime,/evidenceImageMarkup\(ch,item,this\.state\.objectStates,'s6-evidence-thumb'\)/);
  assert.match(fs.readFileSync(path.join(root,'css','story-engine.css'),'utf8'),/\.s6-evidence-thumb-frame\{[^}]*aspect-ratio:16\/9/);
});

test('each chapter shows its own evidence count and nearby markers leave clue positions intact', () => {
  for(const chapter of story.chapters){
    for(const item of chapter.evidence){
      assert.ok(item.markerPosition,`${item.id} needs a nearby marker`);
      assert.notDeepEqual(item.markerPosition,item.position,`${item.id} still covers the clue`);
      assert.ok(Math.abs(item.markerPosition.x-item.position.x)<=12&&Math.abs(item.markerPosition.y-item.position.y)<=12,`${item.id} marker is too far from its clue`);
    }
  }
  const invalid=structuredClone(story);
  invalid.chapters[3].evidence[2].markerPosition={x:90,y:1};
  assert.throws(()=>Engine.validateDefinition(invalid),/invalid nearby marker position/);
  const runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story=story;
  runtime.state={chapter:3,found:[...story.chapters[0].evidence.map(item=>item.id),'lantern-trail'],solved:story.chapters.slice(0,3).map(chapter=>chapter.puzzle.id),completedDialogues:[],objectStates:{},ending:null};
  runtime.root={innerHTML:'',querySelector:()=>null,querySelectorAll:()=>[]};
  runtime.storageAvailable=true;runtime.visualDebug=false;runtime.debugOverlay=false;
  runtime.render();
  assert.match(runtime.root.innerHTML,/Chapter 1, Bell Tower, 3 of 3 evidence collected/);
  assert.match(runtime.root.innerHTML,/Chapter 4, Spring Garden, 1 of 4 evidence collected/);
  assert.match(runtime.root.innerHTML,/Chapter 04 · 1 of 4 evidence collected/);
  assert.match(runtime.root.innerHTML,/--x:27%;--y:80%" data-s6="inspect" data-id="lantern-trail"/);
  assert.match(runtime.root.innerHTML,/class="s6-evidence-thumb-frame"/);
});

test('ledger and map evidence carry readable content with document enlargement', () => {
  const chapter=story.chapters[0];
  const ledger=chapter.evidence.find(item=>item.id==='bell-ledger');
  const map=chapter.evidence.find(item=>item.id==='tide-note');
  assert.equal(chapter.evidence.indexOf(ledger)+1,2);
  assert.equal(chapter.evidence.indexOf(map)+1,3);
  assert.match(Engine.documentMarkup(ledger.document),/9:06 — one low note, fourteen seconds/);
  assert.match(Engine.documentMarkup(map.document),/Bell tower.*Old stone run.*Pumping quarter/);
  assert.match(Engine.documentMarkup(map.document),/If it sounds again, check the stone/);
  for(const [item,file] of [[ledger,'story06-tower-ledger-detail.png'],[map,'story06-tower-map-detail.png']]){
    const view=Engine.evidenceView(chapter,item);
    assert.equal(view.src,`assets/${file}`);
    assert.equal(view.fromMaster,false);
    assert.equal(view.width,1672);
    assert.equal(view.height,941);
    assert.match(Engine.evidenceImageMarkup(chapter,item,{}),new RegExp(file.replaceAll('.','\\.')));
  }
  assert.deepEqual(checkAssets(story,root),[]);
  const runtime=fs.readFileSync(path.join(root,'js','story-engine.js'),'utf8');
  assert.match(runtime,/<details class="s6-readable-transcript">/);
  assert.match(runtime,/data-s6="read-document"/);
  assert.match(runtime,/case 'doc-in'/);
  assert.match(runtime,/case 'zoom':this\.zoomEvidence\(id\)/);
  const invalid=structuredClone(story);
  invalid.chapters[0].evidence[1].document.lines=[];
  assert.throws(()=>Engine.validateDefinition(invalid),/invalid readable document/);
});

test('Chapter 5 clue sheet shows the matching supplied panel in evidence and zoom views', () => {
  const chapter=story.chapters[4];
  const expected={
    'gate-diagram':{x:0,y:0},
    'upper-hamlet':{x:50.3255,y:0},
    'tool-roll':{x:0,y:50.1953},
    waterline:{x:50.3255,y:50.1953}
  };
  for(const [id,corner] of Object.entries(expected)){
    const clue=chapter.evidence.find(item=>item.id===id);
    const view=Engine.evidenceView(chapter,clue);
    assert.equal(view.src,'assets/story06-chapter5-clue-sheet.png');
    assert.equal(view.fromMaster,false);
    assert.equal(view.imageCrop.x,corner.x);
    assert.equal(view.imageCrop.y,corner.y);
    const preview=Engine.evidenceImageMarkup(chapter,clue);
    assert.match(preview,/story06-chapter5-clue-sheet\.png/);
    assert.match(preview,/background-size:[\d.]+% [\d.]+%/);
    const ratio=Number(preview.match(/aspect-ratio:([\d.]+)/)[1]);
    assert.ok(ratio>1.5&&ratio<1.7);
  }
  assert.deepEqual(checkAssets(story,root),[]);
});
