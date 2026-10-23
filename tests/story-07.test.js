const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
global.window=global;
require('../js/story-engine.js');
const Engine=global.MetrivaStoryEngine;
const story=require('../stories/story-07.json');
const root=path.resolve(__dirname,'..');
const {checkAssets}=require('../scripts/story-visual-continuity.js');

test('Story 7 validates with five complete chapters and local artwork',()=>{
  assert.equal(Engine.validateDefinition(story),story);
  assert.deepEqual(checkAssets(story,root),[]);
  const page=fs.readFileSync(path.join(root,'story-07.html'),'utf8');
  const embedded=page.match(/<script type="application\/json" id="story-definition">([\s\S]*?)<\/script>/);
  assert.ok(embedded,'generated page has an embedded story definition');
  assert.deepEqual(JSON.parse(embedded[1]),story);
  assert.deepEqual(story.chapters.map(chapter=>chapter.location),[
    'Clockmaker’s Workshop','The Forgotten Hour','Town Square','Hidden Mechanism','Clockmaker’s Last Hour · Sunset Terrace'
  ]);
  for(const chapter of story.chapters){
    const ids=new Set(chapter.characters.flatMap(person=>person.questions.map(question=>`${chapter.id}:${person.id}:${question.id}`)));
    assert.equal(chapter.evidence.length,3);
    for(const evidence of chapter.evidence)assert.ok(chapter.gate.allEvidence.includes(evidence.id));
    for(const dialogue of chapter.gate.allDialogue)assert.ok(ids.has(dialogue),`${chapter.id} gate references ${dialogue}`);
    assert.ok(chapter.characters.find(person=>person.id==='biscuit'&&person.companion));
    assert.ok(chapter.puzzle.answer);
    assert.ok(story.conversationScript[story.chapters.indexOf(chapter)].opening.length);
    if(chapter.puzzle.type==='sequence'){
      assert.notDeepEqual(chapter.puzzle.presentation.initialOrder,chapter.puzzle.answer,`${chapter.id} begins unsolved`);
    }
  }
  assert.equal(story.chapters[4].puzzle.answer,'elias');
  assert.equal(story.chapters[4].puzzle.presentation.mode,'single-question-clues');
  for(const id of story.chapters[4].puzzle.presentation.evidenceRefs)assert.ok(story.chapters[4].evidence.some(item=>item.id===id));
  assert.equal(story.openingIntroduction.characterId,'clockmaker');
  assert.equal(story.openingIntroduction.scriptedConversation,true);
});

test('Chapter 1 uses the wide workshop scene and a dedicated stopped-watch clue image',()=>{
  const chapter=story.chapters[0];
  const watch=chapter.evidence.find(item=>item.id==='stopped-watch');
  assert.equal(chapter.scene,'assets/story07/workshop.png');
  assert.equal(watch.detailImage,'assets/story07/stopped-pocket-watch.png');
  assert.ok(fs.existsSync(path.join(root,watch.detailImage)));
  assert.equal(watch.detailImageWidth,1254);
  assert.equal(watch.detailImageHeight,1254);
});

test('Clockmaker expression atlas uses the clean 6-by-4 pose sheet',()=>{
  const sprite=story.characterSprites.clockmaker;
  const frames=Object.values(sprite.frames);
  assert.equal(sprite.columns,6);
  assert.equal(sprite.rows,4);
  assert.equal(sprite.aspectRatio,'1');
  for(const frame of frames)assert.ok(frame>=0&&frame<24,`frame ${frame} fits inside its square`);
  for(const included of [20,21,22,23])assert.ok(frames.includes(included),`frame ${included} from the new bottom row is available`);
  assert.ok(fs.existsSync(path.join(root,sprite.src)));
});

test('Clockmaker and Biscuit retain 512-pixel expressions in their HD atlases and individual files',()=>{
  for(const id of ['clockmaker','biscuit']){
    const sprite=story.characterSprites[id],png=fs.readFileSync(path.join(root,sprite.src));
    assert.equal(png.readUInt32BE(16)/sprite.columns,512);
    assert.equal(png.readUInt32BE(20)/sprite.rows,512);
    for(let index=1;index<=sprite.columns*sprite.rows;index++){
      const frame=fs.readFileSync(path.join(root,'assets/story07/expressions',id,`${String(index).padStart(2,'0')}.png`));
      assert.equal(frame.readUInt32BE(16),512);assert.equal(frame.readUInt32BE(20),512);
    }
  }
});

test('Clockmaker scripted emotions cycle through poses and respect Pause motion',t=>{
  let tick,now=0,intervals=0;
  t.mock.method(Date,'now',()=>now);
  t.mock.method(global,'setInterval',fn=>{tick=fn;intervals++;return 7;});
  t.mock.method(global,'clearInterval',()=>{});
  const art={classList:{toggle(){}},dataset:{actorSpeaking:'true'}};
  const actor={dataset:{spriteId:'clockmaker',expression:'thoughtful'},style:{},isConnected:true,closest:selector=>selector==='.s6-conversation-art'?art:{querySelector:()=>({querySelector:()=>({textContent:'A thoughtful line about the watch.'})})}};
  const runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story=story;runtime.overlay={lastElementChild:{querySelector:()=>actor}};runtime.motionPaused=false;
  runtime.startCharacterAnimation();
  const initial=actor.style.backgroundPosition;
  assert.equal(intervals,1,'a scripted emotion still starts its configured cycle');
  now=1500;tick();
  assert.notEqual(actor.style.backgroundPosition,initial,'the pose changes while the same dialogue line stays open');
  runtime.stopCharacterAnimation();runtime.motionPaused=true;runtime.startCharacterAnimation();
  assert.equal(intervals,1,'paused motion does not schedule another cycle');
  assert.equal(actor.style.backgroundPosition,initial,'paused motion holds the requested emotion');
});

test('Story 7 character dialogue uses one scene without a tint or gray portrait panel',()=>{
  const css=fs.readFileSync(path.join(root,'css/story-engine.css'),'utf8');
  assert.ok(css.includes('.s6-story07-conversation .s6-conversation-art{background:transparent}'));
  assert.doesNotMatch(css,/url\('\.\.\/assets\/story07\/clockmaker-dialogue-backdrop\.png'\)/);
  assert.ok(story.chapters[0].scene,'the conversation retains its single workshop scene image');
  assert.ok(fs.existsSync(path.join(root,'assets/story07/clockmaker-dialogue-backdrop.png')),'the left-side artwork stays available for later');
});

test('Lena and Jonah use individual expression images instead of cropped atlases',()=>{
  for(const id of ['lena','jonah']){
    const sprite=story.characterSprites[id];
    assert.equal(sprite.columns,1);assert.equal(sprite.rows,1);
    assert.equal(sprite.aspectRatio,'1');
    assert.equal(sprite.frameFiles.length,id==='lena'?32:24);
    assert.equal(story.characterPortraits[id],sprite.frames.idle);
    for(const frame of Object.values(sprite.frames))assert.ok(sprite.frameFiles.includes(frame));
  }
});

test('Poppy Whitmore replaces Iris and uses her 8-by-4 researcher sheet',()=>{
  assert.equal(story.characterSprites.iris,undefined);
  assert.equal(story.characterPortraits.iris,undefined);
  assert.equal(story.characterSprites.poppy.src,'assets/story07/expressions/poppy/01.png');
  assert.equal(story.characterSprites.poppy.columns,1);
  assert.equal(story.characterSprites.poppy.rows,1);
  assert.equal(story.characterSprites.poppy.aspectRatio,'1');assert.equal(story.characterSprites.poppy.frameFiles.length,32);
  assert.ok(fs.existsSync(path.join(root,story.characterSprites.poppy.src)));
  assert.ok(fs.existsSync(path.join(root,story.characterPortraits.poppy)));
  assert.ok(story.chapters.some(chapter=>chapter.characters.some(person=>person.id==='poppy'&&person.name==='Poppy Whitmore'&&person.role==='Local researcher')));
  for(const frame of Object.values(story.characterSprites.poppy.frames))assert.ok(story.characterSprites.poppy.frameFiles.includes(frame));
  assert.ok(story.conversationScript.some(chapter=>JSON.stringify(chapter).includes('poppy')));
});

test('a new Story 7 opening enters Elias’s scripted dialogue',()=>{
  const runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story=story;runtime.state={};runtime.revision=0;runtime.savedAt=null;runtime.lastError=null;
  let rendered=0;runtime.save=async()=>{};runtime.renderDialogue=()=>rendered++;
  runtime.showOpening();
  assert.deepEqual(runtime.state.dialogue,{chapter:0,characterId:'clockmaker',questionId:null,phase:'opening',line:0});
  assert.equal(rendered,1);
});

test('restarting Story 7 clears progress and begins Elias’s dialogue again',async()=>{
  const runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story=story;runtime.repository={clear:async()=>{}};runtime.state={chapter:3};runtime.revision=8;runtime.savedAt='old';runtime.lastError='old';
  runtime.closeModal=()=>{};runtime.render=()=>{};runtime.save=async()=>{};runtime.renderDialogue=()=>{};
  await runtime.restart();
  assert.equal(runtime.state.chapter,0);
  assert.equal(runtime.state.dialogue.phase,'opening');
  assert.equal(runtime.state.dialogue.characterId,'clockmaker');
  assert.equal(runtime.revision,0);
});

test('Biscuit search discovers an optional clue without affection or pet gates',async()=>{
  const previous=global.matchMedia;
  global.matchMedia=()=>({matches:true});
  try{
    const runtime=Object.create(Engine.StoryRuntime.prototype),clue=story.chapters[0].evidence[0];
    runtime.story=story;runtime.state={chapter:0,found:[],objectStates:{},companion:{affection:0,mood:'idle',collapsed:false,discoveries:[],searchTarget:null,message:''}};
    runtime.current=()=>story.chapters[runtime.state.chapter];runtime.has=id=>runtime.state.found.includes(id);
    runtime.save=async()=>{};runtime.render=()=>{};runtime.inspect=id=>{runtime.inspected=id;};
    await runtime.petCompanion('pet');
    assert.equal(runtime.state.companion.affection,3);
    runtime.state.companion.affection=0;
    await runtime.petCompanion('search');
    await new Promise(resolve=>setTimeout(resolve,10));
    assert.ok(runtime.state.found.includes(clue.id));
    assert.ok(runtime.state.companion.discoveries.includes(clue.id));
    assert.equal(runtime.inspected,clue.id);
    assert.equal(runtime.state.companion.affection,0,'required clues never depend on affection');
  }finally{if(previous===undefined)delete global.matchMedia;else global.matchMedia=previous;}
});

test('GA4 tag is installed on the library and Story 7 page',()=>{
  for(const file of ['index.html','story-07.html']){
    const html=fs.readFileSync(path.join(root,file),'utf8');
    assert.match(html,/googletagmanager\.com\/gtag\/js\?id=G-CPG5VQV0Y8/);
    assert.match(html,/gtag\('config',\s*'G-CPG5VQV0Y8'\)/);
  }
});

test('Story 7 chapters open the selected character instead of borrowing Elias’s opening',()=>{
 for(let chapter=0;chapter<story.chapters.length;chapter++){
  const ch=story.chapters[chapter],r=Object.create(Engine.StoryRuntime.prototype);
  r.story=story;r.state={chapter,conversationOpenings:[],characterIntrosSeen:[],completedDialogues:[],transcript:[]};r.current=()=>ch;r.characterAvailable=()=>true;r.save=()=>{};r.renderDialogue=()=>{};
  for(const person of ch.characters.filter(p=>p.questions.length)){
   r.openCharacter(person.id);assert.equal(r.state.dialogue.characterId,person.id);
   assert.equal(r.state.dialogue.phase,person.id===story.conversationScript[chapter].openingCharacterId?'opening':'menu');
  }
  r.state.conversationOpenings=[chapter];r.openCharacter('clockmaker');assert.equal(r.state.dialogue.phase,'menu');
 }
});
