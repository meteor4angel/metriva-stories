const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
global.window=global;
require('../js/story-engine.js');
const Engine=global.MetrivaStoryEngine;
const root=path.resolve(__dirname,'..');
const {checkAssets}=require('../scripts/story-visual-continuity.js');
global.window=global;
require('../js/days-conversations.js');

for(const number of [1,4,5]){
  const id=String(number).padStart(2,'0');
  const story=require(`../stories/story-${id}.json`);
  test(`Story ${id} is authored in the shared engine schema and retains its five chapters`,()=>{
    assert.equal(Engine.validateDefinition(story),story);
    assert.equal(story.chapters.length,5);
    assert.deepEqual(checkAssets(story,root),[]);
    for(const src of Object.values(story.voiceMap||{}))assert.ok(fs.existsSync(path.join(root,src)),`Missing voice file: ${src}`);
    for(const chapter of story.chapters){
      assert.ok(chapter.scene);
      assert.ok(chapter.evidence.length);
      assert.ok(chapter.gate.allEvidence.length);
      assert.ok(chapter.puzzle.success||chapter.success);
    }
    const page=fs.readFileSync(path.join(root,`story-${id}.html`),'utf8');
    const legacy=fs.readFileSync(path.join(root,story.legacyPage),'utf8');
    assert.equal(page,legacy);
    assert.match(page,/js\/story-engine\.js/);
  });
}

test('Story 1 question answers and follow-ups map to their matching recordings',()=>{
  const story=require('../stories/story-01.json');
  const runtime=Object.create(Engine.StoryRuntime.prototype);runtime.story=story;runtime.voiceMuted=false;
  const stems={'mrs-bellamy':'01-shop-bellamy','clara':'01-clara'};
  for(const characterId of Object.keys(stems)){
    const person=story.chapters[0].characters.find(character=>character.id===characterId);
    for(let index=0;index<person.questions.length;index++){
      const q=person.questions[index],number=String(index+1).padStart(2,'0');
      for(const [text,line,kind] of [[q.reply,'1','answer'],[q.followReply,'3','follow-up']]){
        const key=JSON.stringify([person.name,text,characterId,q.id,line,'0']);
        const expected=`assets/voices/${stems[characterId]}-${q.id.replace('q','q0')}-${kind}.mp3`;
        assert.equal(story.voiceMap[key],expected,`${person.name} ${q.id} ${kind} maps to its matching recording`);
        assert.ok(fs.existsSync(path.join(root,expected)),`Missing audio file: ${expected}`);
        assert.match(runtime.voiceControl(person.name,text,{characterId,questionId:q.id,line:Number(line),chapter:0}),/data-s6="play-voice"/);
        assert.equal(runtime.currentVoice,expected);
      }
    }
    assert.equal(story.voiceMap[JSON.stringify([person.name,person.intro])],undefined,'The character menu introduction must not reuse a question recording.');
  }
});

test('Story 5 dialogue follows the approved chapter scripts and every spoken line has a recording',()=>{
  const story=require('../stories/story-05.json');
  assert.equal(global.DAYS_CONVERSATIONS.length,story.chapters.length);
  const htmlPage=fs.readFileSync(path.join(root,'story-05.html'),'utf8');
  const inlineDefinition=htmlPage.match(/<script type="application\/json" id="story-definition">([\s\S]*?)<\/script>/);
  assert.ok(inlineDefinition,'Story 5 page includes its inline definition');
  assert.deepEqual(JSON.parse(inlineDefinition[1]).conversationScript,global.DAYS_CONVERSATIONS,'built Story 5 page embeds the canonical conversation script');
  for(const [chapterIndex,chapter] of story.chapters.entries()){
    const script=global.DAYS_CONVERSATIONS[chapterIndex];
    assert.ok(script.opening.length>=4,`${chapter.id} has its opening scene`);
    for(const person of chapter.characters){
      const topics=script.topics.filter(topic=>topic.focus===person.id);
      assert.equal(person.questions.length,topics.length,`${chapter.id}/${person.id} topic count`);
      topics.forEach((topic,index)=>{
        assert.equal(topic.lines.length,4,`${topic.id} has four dialogue turns`);
        const question=person.questions[index];
        assert.deepEqual([question.ask,question.reply,question.followUp,question.followReply],topic.lines.map(line=>line.text),`${topic.id} matches Story 5 data`);
      });
    }
    for(const line of [...script.opening,...script.topics.flatMap(topic=>topic.lines)]){
      if(line.speaker==='you')continue;
      const speaker=line.speaker[0].toUpperCase()+line.speaker.slice(1);
      assert.ok(story.voiceMap[JSON.stringify([speaker,line.text])],`Missing voice map for ${speaker}: ${line.text}`);
    }
  }
});

test('Story 5 renders every scripted speaker, addressee, opening, and topic label',()=>{
  const story=require('../stories/story-05.json');
  const script=global.DAYS_CONVERSATIONS;
  const runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story={...story,conversationScript:script};
  runtime.condition=()=>true;runtime.completed=()=>false;runtime.dialogueKey=()=>'';runtime.hasCharacterConversation=()=>true;
  runtime.voiceControl=(speaker)=>`voice:${speaker}`;
  let rendered;runtime.showCharacterConversation=(...args)=>{rendered=args;};
  const html=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  for(const [chapterIndex,chapter] of story.chapters.entries()){
    runtime.state={chapter:chapterIndex,transcript:[],dialogue:{chapter:chapterIndex,characterId:'mira',questionId:null,phase:'opening',line:0}};
    for(const [lineIndex,line] of script[chapterIndex].opening.entries()){
      runtime.state.dialogue.line=lineIndex;runtime.renderDialogue();
      const speaker=line.speaker==='you'?'You':line.speaker[0].toUpperCase()+line.speaker.slice(1);
      assert.ok(rendered[2].includes(`<span class="s6-speaker">${speaker}</span>`),`${chapter.id} opening speaker ${speaker}`);
      assert.ok(rendered[2].includes(html(line.text)),`${chapter.id} opening text`);
      if(line.to){const recipient=line.to==='you'?'You':chapter.characters.find(person=>person.id===line.to).name;assert.ok(rendered[2].includes(`→ ${recipient}`),`${chapter.id} opening recipient ${recipient}`);}
      if(speaker==='You')assert.ok(!rendered[3].includes('voice:'));else assert.ok(rendered[3].includes(`voice:${speaker}`));
    }
    for(const person of chapter.characters){
      runtime.state.dialogue={chapter:chapterIndex,characterId:person.id,questionId:null,phase:'menu',line:0,showIntro:false};runtime.renderDialogue();
      const labels=script[chapterIndex].topics.filter(topic=>topic.focus===person.id).map(topic=>topic.label);
      for(const label of labels)assert.ok(rendered[2].includes(html(label)),`${chapter.id}/${person.id} topic label ${label}`);
      const topics=script[chapterIndex].topics.filter(topic=>topic.focus===person.id);
      for(const [topicIndex,topic] of topics.entries())for(const [lineIndex,line] of topic.lines.entries()){
        runtime.state.dialogue={chapter:chapterIndex,characterId:person.id,questionId:person.questions[topicIndex].id,phase:'exchange',line:lineIndex};runtime.renderDialogue();
        const speaker=line.speaker==='you'?'You':line.speaker[0].toUpperCase()+line.speaker.slice(1);
        assert.ok(rendered[2].includes(`<span class="s6-speaker">${speaker}</span>`),`${topic.id} speaker ${speaker}`);
        assert.ok(rendered[2].includes(html(line.text)),`${topic.id} line text`);
        if(line.to){const recipient=line.to==='you'?'You':chapter.characters.find(item=>item.id===line.to).name;assert.ok(rendered[2].includes(`→ ${recipient}`),`${topic.id} recipient ${recipient}`);}
        if(speaker==='You')assert.ok(!rendered[3].includes('voice:'));else assert.ok(rendered[3].includes(`voice:${speaker}`));
      }
    }
  }
});

test('Story 5 dialogue uses the illustrated conversation stage at desktop and compact widths',()=>{
  const story=require('../stories/story-05.json');
  const runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story=story;runtime.motionPaused=false;runtime.current=()=>story.chapters[0];runtime.sceneSource=()=>story.chapters[0].scene;runtime.portrait=()=>'<img class="s6-conversation-portrait" alt="Mira">';
  const markup=runtime.conversationMarkup({id:'mira',name:'Mira'},'<h2 class="s6-story05-dialogue-title">A Chance Encounter</h2>','Mira','<button>Continue</button>');
  assert.match(markup,/s6-stage-conversation s6-story05-conversation/);
  assert.match(markup,/background-image:url/);
  assert.match(markup,/<footer class="s6-dialog-actions"><button>Continue<\/button>/);
});

test('Context-specific dialogue audio takes priority over a generic line mapping',()=>{
  const runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story={voiceMap:{
    [JSON.stringify(['Clara','A repeated line.'])]:'assets/voices/generic.mp3',
    [JSON.stringify(['Clara','A repeated line.','clara','q2','3'])]:'assets/voices/01-clara-q02-follow-up.mp3'
  }};
  runtime.currentVoice=null;runtime.pendingVoice=null;
  assert.match(runtime.voiceControl('Clara','A repeated line.',{characterId:'clara',questionId:'q2',line:3}),/data-s6="play-voice"/);
  assert.equal(runtime.currentVoice,'assets/voices/01-clara-q02-follow-up.mp3');
});

test('Mr. Finch’s Story 1 replies expose their existing greenhouse recordings',()=>{
  const story=require('../stories/story-01.json'),person=story.chapters[1].characters.find(character=>character.id==='mr-finch');
  const runtime=Object.create(Engine.StoryRuntime.prototype);runtime.story=story;runtime.voiceMuted=false;
  for(let index=0;index<person.questions.length;index++){
    const q=person.questions[index],number=String(index+1).padStart(2,'0');
    for(const [text,line,kind] of [[q.reply,1,'answer'],[q.followReply,3,'follow-up']]){
      const expected=`assets/voices/02-greenhouse-finch-q${number}-${kind}.mp3`;
      assert.equal(story.voiceMap[JSON.stringify([person.name,text,person.id,q.id,String(line),'1'])],expected);
      assert.ok(fs.existsSync(path.join(root,expected)));
      assert.match(runtime.voiceControl(person.name,text,{characterId:person.id,questionId:q.id,line,chapter:1}),/data-s6="play-voice"/);
      assert.equal(runtime.currentVoice,expected);
    }
  }
});

test('Story 1 legacy progress converts its timeline, drawer, garden, conversations, and ending',()=>{
  const story=require('../stories/story-01.json');
  const runtime=Object.create(Engine.StoryRuntime.prototype);runtime.story=story;
  const state=runtime.convertLegacySave({chapter:4,found:['register','window','letter','miso','drawer-open'],timelineSolved:true,timeline:['close','sale','ledger'],drawer:true,token:true,finished:true,resolution:'deliver',heard:['0:0:0','0:1:0']});
  assert.deepEqual(state.solved,story.chapters.map(ch=>ch.puzzle.id));
  assert.deepEqual(state.puzzleDrafts[story.chapters[1].puzzle.id],['close','sale','ledger']);
  assert.equal(state.ending,'send');
  assert.ok(state.completedDialogues.includes('chapter-1:mrs-bellamy:q1'));
  assert.ok(state.completedDialogues.includes('chapter-1:clara:q1'));
});

test('Story 1 keeps the garden lock as a configurable numeric code puzzle',async()=>{
  const story=require('../stories/story-01.json');
  const puzzle=story.chapters[2].puzzle;
  assert.equal(puzzle.type,'input');
  assert.equal(puzzle.answer,'986');
  assert.equal(puzzle.input.mode,'numeric');
  assert.equal(puzzle.input.evidenceRef,'drawer');
  const broken=structuredClone(story);broken.chapters[2].puzzle.input.evidenceRef='missing';
  assert.throws(()=>Engine.validateDefinition(broken),/invalid input evidence link/);
  const runtime=Object.create(Engine.StoryRuntime.prototype);runtime.story=story;runtime.state={chapter:2,puzzleDrafts:{}};
  let modal;runtime.showModal=(title,content,actions,options)=>{modal={title,content,actions,options};};
  runtime.showInputPuzzle(story.chapters[2],puzzle);
  assert.equal((modal.content.match(/class="s6-code-box(?: is-placeholder)?"/g)||[]).length,3);
  assert.match(modal.content,/assets\/clue-desk-drawer\.png/);
  assert.match(modal.content,/class="s6-input-puzzle-clue-button" data-s6="puzzle-evidence" data-id="drawer"/);
  assert.match(modal.content,/Locked drawer · evidence detail/);
  assert.doesNotMatch(modal.content,/<figcaption>/);
  runtime.current=()=>story.chapters[2];let inspected=null;runtime.inspect=(id,stack)=>{inspected={id,stack};};
  const clueControl={dataset:{s6:'puzzle-evidence',id:'drawer'},closest:()=>clueControl};
  await runtime.onClick({target:{closest:()=>clueControl}});
  assert.deepEqual(inspected,{id:'drawer',stack:true});
  assert.match(runtime.modalHeaderMarkup({},'<button class="s6-close"><\/button>'),/Metriva Stories/);
  assert.match(modal.actions,/Unlock the drawer/);
  assert.match(modal.actions,/data-s6="input-reset">Reset entries/);
  assert.match(modal.actions,/Progressive hint/);
  assert.match(modal.actions,/Return to investigation/);
  const digitBoxes=[{}, {}, {}],digitInput={value:'898',focus(){this.focused=true;},setSelectionRange(start,end){this.selection=[start,end];}},entry={querySelector:()=>digitInput};
  const firstBox={parentElement:{children:digitBoxes},closest:()=>entry};digitBoxes[0]=firstBox;
  runtime.selectCodeCharacter(firstBox);
  assert.deepEqual(digitInput.selection,[0,1]);
  assert.equal(digitInput.focused,true);
  runtime.state.puzzleDrafts[puzzle.id]='898';runtime.deductionFeedback='That combination does not fit.';
  const boxes=[{dataset:{placeholder:''},classList:{toggle(){}}},{dataset:{placeholder:''},classList:{toggle(){}}},{dataset:{placeholder:''},classList:{toggle(){}}}],resetFeedback={textContent:'That combination does not fit.'};
  runtime.overlay={querySelector(selector){return selector==='#s6-puzzle-feedback'?resetFeedback:digitInput;},querySelectorAll(){return boxes;}};runtime.save=()=>{};
  runtime.resetInputPuzzle();
  assert.equal(runtime.state.puzzleDrafts[puzzle.id],'');assert.equal(runtime.deductionFeedback,'');assert.equal(digitInput.value,'');assert.equal(resetFeedback.textContent,'');
  const longer={...puzzle,answer:'springtime',input:{...puzzle.input,maxLength:20}};
  runtime.showInputPuzzle(story.chapters[2],longer);
  assert.doesNotMatch(modal.content,/s6-code-box/);
  assert.match(modal.content,/class="s6-code-input"/);
  const feedback={textContent:''};let answer={value:'985'},solved=false,saved=0;
  runtime.current=()=>story.chapters[2];
  runtime.overlay={querySelector(selector){return selector==='#s6-puzzle-feedback'?feedback:answer;}};
  runtime.solvePuzzle=()=>{solved=true;};runtime.save=()=>{saved++;};
  runtime.deductionSubmit();
  assert.equal(solved,false);assert.match(feedback.textContent,/does not fit/);assert.equal(saved,1);
  answer={value:'986'};runtime.deductionSubmit();
  assert.equal(solved,true);assert.equal(runtime.state.puzzleDrafts[puzzle.id],'986');
});

test('Story 1 Chapter 4 inserts the token with motion, opens the box, reads the letter, then continues',async()=>{
  const story=structuredClone(require('../stories/story-01.json')),chapter=story.chapters[3],puzzle=chapter.puzzle,view=puzzle.presentation;
  assert.equal(Engine.validateDefinition(story),story);assert.equal(view.mode,'token-insert');assert.equal(view.sideImage,'assets/clue-bed.png');assert.equal(view.tokenImage,'assets/brass-spring-token.png');
  assert.deepEqual(puzzle.options.map(option=>option.icon),['flower','leaf','leaf']);
  const runtime=Object.create(Engine.StoryRuntime.prototype);runtime.story=story;runtime.state={chapter:3,solved:[],puzzleDrafts:{}};runtime.current=()=>chapter;runtime.deductionChoice='lavender';runtime.deductionPuzzleId=puzzle.id;
  let animated=false,modal;const token={isConnected:true,getBoundingClientRect:()=>({left:0,top:0,width:40,height:40}),animate:()=>{animated=true;return{finished:Promise.resolve()};}},target={getBoundingClientRect:()=>({left:100,top:100,width:50,height:50})};
  runtime.overlay={querySelector:selector=>selector==='[data-token-piece]'?token:selector.includes('data-token-target')?target:null};runtime.has=()=>true;runtime.save=async()=>{};runtime.showModal=(title,body,actions)=>{modal={title,body,actions};};runtime.render=()=>{};
  runtime.findEvidence=()=>null;runtime.showTokenInsertPuzzle(chapter,puzzle);assert.match(modal.body,/class="s6-token-source"/);assert.match(modal.body,/The brass garden token/);assert.match(modal.body,/s6-token-piece-preview/);assert.match(modal.actions,/Reset selection/);
  runtime.resetTokenSelection();assert.match(modal.body,/class="s6-token-source"/);assert.match(modal.body,/The brass garden token/);assert.doesNotMatch(modal.body,/s6-token-piece-preview/);runtime.deductionChoice='lavender';runtime.deductionPuzzleId=puzzle.id;
  runtime.placeToken=runtime.placeToken.bind(runtime);await runtime.placeToken();
  assert.equal(animated,true,'the correct token placement animates into its selected recess');assert.equal(modal.title,'The token fits');assert.match(modal.body,/s6-token-inserted-mark[^>]+src="assets\/brass-spring-token\.png"/);assert.match(modal.actions,/Open the hidden compartment/);assert.equal(runtime.state.puzzleDrafts[puzzle.id].phase,'inserted');
  runtime.openTokenCompartment();assert.equal(modal.title,'The stone opens');assert.match(modal.actions,/Open the memory box/);assert.equal(runtime.state.puzzleDrafts[puzzle.id].phase,'opened');assert.ok(runtime.state.solved.includes(puzzle.id));
  runtime.showRecoveredLetter();assert.equal(modal.title,'The letter that wasn’t sent');assert.match(modal.body,/Dear Elena/);assert.match(modal.body,/With love,<br>Bellamy/);assert.match(modal.actions,/Continue to the next chapter/);
});

test('Story 1 deduction uses the reusable one-question puzzle and Metriva brand header',()=>{
  const story=require('../stories/story-01.json'),runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story=story;runtime.state={chapter:0};runtime.current=()=>story.chapters[0];runtime.chapterGateMet=()=>true;runtime.isSolved=()=>false;
  let modal;runtime.showModal=(title,body,actions,options)=>{modal={title,body,actions,options};};runtime.showPuzzle();
  assert.match(modal.body,/closing checklist places Clara in the greenhouse at 6:20/);
  assert.equal((modal.body.match(/class="s6-choice s6-single-answer/g)||[]).length,3);
  assert.match(modal.body,/Where to search next/);
  assert.match(modal.body,/option-numbered-icon/);
  assert.match(modal.body,/s6-option-icon/);
  assert.match(modal.body,/data-id="greenhouse"/);
  assert.match(modal.actions,/data-s6="deduction-submit"/);
  assert.match(modal.actions,/class="s6-question-action-icon"/);
  assert.equal(modal.options.brandHeader,true);
  assert.equal(story.chapters[0].puzzle.presentation.actions.length,3);
  assert.equal(story.chapters[0].puzzle.presentation.optionStyle,'numbered-icon');
  assert.equal(story.pageAppearance.chapterPickerIcon,'flower');
});

test('Character introductions play once, then return to the question menu without speaking them again',()=>{
  const story=require('../stories/story-01.json'),person=story.chapters[0].characters[1];
  const runtime=Object.create(Engine.StoryRuntime.prototype);runtime.story=story;
  runtime.state={chapter:0,characterIntrosSeen:[],completedDialogues:[],dialogue:null};
  runtime.current=()=>story.chapters[0];runtime.characterAvailable=()=>true;runtime.save=()=>{};runtime.renderDialogue=()=>{};
  runtime.openCharacter(person.id);
  assert.equal(runtime.state.dialogue.showIntro,true);
  runtime.openCharacter(person.id);
  assert.equal(runtime.state.dialogue.showIntro,false);
  runtime.state.characterIntrosSeen=[];
  runtime.state.completedDialogues=['chapter-1:clara:q2'];
  runtime.openCharacter(person.id);
  assert.equal(runtime.state.dialogue.showIntro,false,'an already discussed question suppresses the opening');

  delete runtime.renderDialogue;
  runtime.condition=()=>true;runtime.voiceControl=(speaker,text)=>`<button data-intro-voice>${text}</button>`;
  let content='',actions='';runtime.showCharacterConversation=(_title,_person,body,controls)=>{content=body;actions=controls;};
  runtime.renderDialogue();
  assert.match(content,/What would you like to ask/);
  assert.equal((content.match(new RegExp(person.intro.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length,1);
  assert.doesNotMatch(actions,/data-intro-voice/);

  runtime.state.dialogue.showIntro=true;runtime.renderDialogue();
  assert.match(content,new RegExp(person.intro.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(actions,/data-intro-voice/);
});

test('Story 1 opens with Mrs. Bellamy asking for help, then keeps her character menu silent',()=>{
  const story=require('../stories/story-01.json'),opening=story.openingIntroduction;
  assert.match(opening.text[0],/Will you help me find it/);
  assert.equal(story.voiceMap[JSON.stringify([opening.speaker,opening.text.join(' ')])],'assets/voices/01-shop-bellamy-introduction.mp3');
  const popup=Object.create(Engine.StoryRuntime.prototype);popup.story=story;popup.current=()=>story.chapters[0];popup.sceneSource=chapter=>chapter.scene;popup.motionPaused=false;popup.voiceControl=(speaker,text)=>`<button>${speaker}:${text}</button>`;
  let modal;popup.showModal=(title,body,actions,options)=>{modal={title,body,actions,options};};popup.showOpening();
  assert.equal(modal.title,opening.title);assert.match(modal.body,/s6-stage-conversation s6-story01-conversation/);assert.match(modal.body,/assets\/scene-shop\.png/);assert.match(modal.body,/s6-conversation-portrait s6-sprite-portrait/);assert.match(modal.body,/data-s6="toggle-motion"/);assert.match(modal.body,/I left a letter on the writing desk/);assert.match(modal.body,/Mrs\. Bellamy:I left a letter/);assert.equal(modal.options.voiceDialogue,true);assert.equal(modal.options.scrollPageTopOnClose,true);

  const person=story.chapters[0].characters.find(entry=>entry.id==='mrs-bellamy');
  const runtime=Object.create(Engine.StoryRuntime.prototype);runtime.story=story;runtime.state={chapter:0,characterIntrosSeen:[],completedDialogues:[],dialogue:null};
  runtime.current=()=>story.chapters[0];runtime.characterAvailable=()=>true;runtime.save=()=>{};runtime.renderDialogue=()=>{};runtime.openCharacter(person.id);
  assert.equal(runtime.state.dialogue.showIntro,false);
  let voiceCalled=false;runtime.condition=()=>true;runtime.voiceControl=()=>{voiceCalled=true;return '';};runtime.showCharacterConversation=()=>{};runtime.renderDialogue();
  assert.equal(voiceCalled,false);
});

test('closing or beginning Story 1 after restart scrolls the investigation to the page top',()=>{
  const previousScroll=global.scrollTo,previousDocument=global.document,scrolled=[];
  global.scrollTo=options=>scrolled.push(options);
  global.document={querySelector:()=>null};
  const runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.stopVoice=()=>{};runtime.stopCharacterAnimation=()=>{};runtime.modalStack=[];runtime.completionToken=0;runtime.routeConfirming=null;runtime.lastFocus=null;
  runtime.overlay={classList:{add(){}},innerHTML:''};runtime.root={inert:false,querySelector:()=>null};
  try{
    runtime.scrollPageTopOnClose=true;runtime.closeModal();
    assert.deepEqual(scrolled,[{top:0,behavior:'smooth'}]);
    runtime.scrollPageTopOnClose=true;runtime.closeModal();
    assert.equal(scrolled.length,2,'the opening help button also returns the page to the top');
  }finally{
    if(previousScroll===undefined)delete global.scrollTo;else global.scrollTo=previousScroll;
    if(previousDocument===undefined)delete global.document;else global.document=previousDocument;
  }
});

test('Story 1 uses the floral page backdrop and clue images retain their intrinsic proportions',()=>{
  const one=require('../stories/story-01.json');
  assert.equal(one.pageAppearance.backgroundImage,'assets/flower-cozy.jpg');
  assert.deepEqual(one.pageAppearance.cursorTheme,{default:'assets/cursors/flower.png',interactive:'assets/cursors/arrow.png',disabled:'not-allowed'});
  assert.deepEqual(one.chapters.map(ch=>ch.scene),['assets/scene-shop.png','assets/scene-greenhouse.png','assets/scene-office.png','assets/scene-garden.png','assets/scene-finale.png']);
  for(const number of [1,3,4,5]){
    const story=require(`../stories/story-${String(number).padStart(2,'0')}.json`);
    for(const chapter of story.chapters)for(const clue of chapter.evidence){
      if(!clue.detailImage)continue;
      const {width,height}=require('../scripts/story-visual-continuity.js').imageDimensions(path.resolve(root,clue.detailImage));
      assert.equal(clue.detailImageWidth,width,`${story.id}/${chapter.id}/${clue.id} width`);
      assert.equal(clue.detailImageHeight,height,`${story.id}/${chapter.id}/${clue.id} height`);
    }
  }
});

test('Story 1 conversations stage the existing full-size character over the chapter scene',()=>{
  const story=require('../stories/story-01.json'),runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story=story;runtime.current=()=>story.chapters[0];runtime.sceneSource=chapter=>chapter.scene;
  const person=story.chapters[0].characters[0],markup=runtime.conversationMarkup(person,'<h2>Mrs. Bellamy</h2>',person.name,'<button>Play voice</button>');
  assert.match(markup,/s6-conversation s6-stage-conversation s6-story01-conversation/);
  assert.match(markup,/assets\/scene-shop\.png/);
  assert.match(markup,/s6-conversation-portrait s6-sprite-portrait/);
  assert.match(markup,/data-s6="toggle-motion"/);
});

test('Stories 1, 4, and 5 retain their pre-migration scenes, clue art, and available character motion/audio',()=>{
  const one=require('../stories/story-01.json');
  assert.deepEqual(one.chapters.map(ch=>ch.scene),['assets/scene-shop.png','assets/scene-greenhouse.png','assets/scene-office.png','assets/scene-garden.png','assets/scene-finale.png']);
  for(const ch of one.chapters)for(const clue of ch.evidence)assert.ok(clue.detailImage,`${ch.title}: ${clue.id} retains its clue artwork`);
  assert.equal(one.chapters[2].evidence.find(clue=>clue.id==='drawer').detailImage,'assets/clue-desk-drawer.png');
  assert.equal(one.chapters[2].evidence.find(clue=>clue.id==='notes').detailImage,'assets/clue-desk-notes.png');
  for(const id of ['mrs-bellamy','clara','mr-finch'])assert.ok(one.characterSprites[id].frames.speaking);
  assert.ok(Object.keys(one.voiceMap).length>0);
  assert.equal(one.voiceMap[JSON.stringify(['Mrs. Bellamy',one.chapters[0].characters[0].intro])],undefined,'Do not reuse a follow-up recording as the character-menu introduction.');
  assert.ok(one.voiceMap[JSON.stringify(['Mrs. Bellamy',one.openingIntroduction.text[0]])]);

  const four=require('../stories/story-04.json');
  for(const id of ['celia','rowan'])assert.ok(four.characterSprites[id]?.frames.speaking);
  const five=require('../stories/story-05.json');
  for(const id of ['mira','theo'])assert.ok(five.characterSprites[id]?.frames.speaking);
  assert.ok(Object.keys(five.voiceMap).length>0);
  assert.deepEqual([four.pageAppearance.backgroundImage,five.pageAppearance.backgroundImage],['assets/story04-page-background.png','assets/story05-page-background.png']);
});

test('Speaking portraits animate visibly between speaking, thoughtful, blinking, and idle frames',()=>{
  assert.equal(Engine.characterFrame(true,false,0,5000),'speaking');
  assert.equal(Engine.characterFrame(true,false,700,5000),'idle');
  assert.equal(Engine.characterFrame(false,false,1850,0),'thoughtful');
  assert.equal(Engine.characterFrame(false,false,3300,0),'blink');
  assert.equal(Engine.characterFrame(false,false,0,0),'idle');
});

test('Shared dialogue falls back to static portraits and text when no motion or voice assets are configured',()=>{
  const story={number:1,characterPortraits:{ada:'assets/ada-still.png'},characterSprites:{},voiceMap:{}};
  const runtime=Object.create(Engine.StoryRuntime.prototype);runtime.story=story;
  const person={id:'ada',name:'Ada Vale'};
  assert.match(runtime.portrait(person,'s6-conversation-portrait'),/assets\/ada-still\.png/);
  assert.equal(runtime.voiceControl('Ada Vale','Hello there.'),'');
});

test('The engine validates optional character-frame and audio mappings',()=>{
  const story=structuredClone(require('../stories/story-01.json'));
  assert.equal(Engine.validateDefinition(story),story);
  const badSprite=structuredClone(story);badSprite.characterSprites.clara.frames.speaking=99;
  assert.throws(()=>Engine.validateDefinition(badSprite),/character sprite clara frame speaking is invalid/);
  const badVoice=structuredClone(story);badVoice.voiceMap['not-a-dialogue-key']='assets/voices/missing.mp3';
  assert.throws(()=>Engine.validateDefinition(badVoice),/voiceMap entry not-a-dialogue-key/);
  const contextualVoice=structuredClone(story);contextualVoice.voiceMap[JSON.stringify(['Clara','A line.','clara','q1','3'])]='assets/voices/01-clara-q01-follow-up.mp3';
  assert.equal(Engine.validateDefinition(contextualVoice),contextualVoice);
});

test('Story 1 Chapter 2 uses configurable illustrated sequence data and linked actions',()=>{
  const story=structuredClone(require('../stories/story-01.json'));
  const chapter=story.chapters[1],puzzle=chapter.puzzle,presentation=puzzle.presentation;
  assert.equal(Engine.validateDefinition(story),story);
  assert.equal(puzzle.type,'sequence');
  assert.equal(presentation.mode,'timeline-clean');
  assert.deepEqual(puzzle.answer,['close','sale','ledger']);
  assert.equal(puzzle.items.length,3);
  assert.equal(presentation.layout,'card-slots');
  assert.ok(puzzle.items.every(item=>item.imageCrop&&item.time));
  assert.equal(presentation.actions.find(action=>action.action==='evidence').target,'ledger');
  assert.deepEqual(checkAssets(story,root),[]);

  const runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story=story;runtime.state={chapter:1,puzzleDrafts:{}};runtime.sequencePuzzleId=puzzle.id;runtime.sequenceSelected=null;runtime.sequenceFeedback='';
  runtime.current=()=>chapter;runtime.chapterGateMet=()=>true;runtime.isSolved=()=>false;
  runtime.showModal=(title,body,actions)=>{runtime.modal={title,body,actions};};
  runtime.showPuzzle();
  assert.deepEqual(runtime.state.puzzleDrafts[puzzle.id],[null,null,null]);
  assert.equal((runtime.modal.body.match(/data-timeline-event=/g)||[]).length,3);
  assert.match(runtime.modal.body,/6:00 PM/);
  assert.match(runtime.modal.body,/story01-timeline-illustrations\.png/);
  assert.match(runtime.modal.actions,/data-s6="puzzle-evidence" data-id="ledger"/);
  assert.match(runtime.modal.actions,/data-s6="timeline-reset"/);

  const fourItems=structuredClone(story);
  const sequence=fourItems.chapters[1].puzzle;
  sequence.items.push({id:'witness',label:'Witness arrives'});
  sequence.answer.push('witness');
  assert.equal(Engine.validateDefinition(fourItems),fourItems,'the shared sequence model accepts configurable option counts');
  const badLink=structuredClone(story);badLink.chapters[1].puzzle.presentation.actions[3].target='missing';
  assert.throws(()=>Engine.validateDefinition(badLink),/invalid sequence actions or evidence links/);
});

test('Story 6 adds its reference-inspired scenic page background without changing chapter scenes',()=>{
  const story=require('../stories/story-06.json');
  assert.equal(story.pageAppearance.backgroundImage,'assets/story06-page-background.png');
  assert.deepEqual(story.chapters.map(ch=>ch.scene),['assets/story06-tower-realistic.png','assets/story06-pump-realistic.png','assets/story06-aqueduct-realistic.png','assets/story06-garden-realistic.png','assets/story06-works-realistic.png']);
});
