const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
global.window=global;
require('../js/story-engine.js');
const Engine=global.MetrivaStoryEngine;
const story=require('../stories/story-03.json');
const {checkAssets}=require('../scripts/story-visual-continuity.js');
const root=path.resolve(__dirname,'..');

function legacy(){
  const window={};
  for(const file of ['stories/midnight-train.js','js/train-dialogue.js','js/train-voice-map.js'])
    vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),{window});
  return JSON.parse(JSON.stringify(window));
}

test('Story 3 builds from JSON with five original chapters and solutions',()=>{
  assert.equal(Engine.validateDefinition(story),story);
  assert.deepEqual(checkAssets(story,root),[]);
  assert.equal(story.chapters.length,5);
  assert.deepEqual(story.chapters.map(ch=>ch.puzzle.answer),['4C',['tea','watch','water'],'blackthorn','0007',['3','2','1']]);
  const page=fs.readFileSync(path.join(root,'story-03.html'),'utf8');
  const alias=fs.readFileSync(path.join(root,'midnight-train.html'),'utf8');
  assert.equal(page,alias);
  assert.deepEqual(JSON.parse(page.match(/<script type="application\/json" id="story-definition">([\s\S]*?)<\/script>/)[1]),story);
  assert.match(fs.readFileSync(path.join(root,'js/story-config.js'),'utf8'),/id:'midnight-train'[^\n]*url:'story-03\.html'/);
});

test('Story 3 retains clues, dialogue, voices, and individual expression frames',()=>{
  const old=legacy();
  for(const [index,source] of old.MIDNIGHT.chapters.entries()){
    const chapter=story.chapters[index];
    assert.deepEqual(chapter.evidence.map(item=>item.id),source.spots.map(item=>item.id));
    assert.deepEqual(chapter.evidence.map(item=>item.detail),source.spots.map(item=>item.text));
    assert.deepEqual(chapter.hints,source.hint);
    for(const [personIndex,original] of old.TRAIN_DIALOGUE[index].entries()){
      const migrated=chapter.characters[personIndex],cast=old.TRAIN_CAST[original.who];
      assert.equal(migrated.name,cast.name);
      assert.ok(story.voiceMap[JSON.stringify([cast.name,migrated.intro])]);
      for(const [questionIndex,lines] of original.questions.entries()){
        const q=migrated.questions[questionIndex];
        assert.deepEqual([q.ask,q.reply,q.followUp,q.followReply],[...lines]);
        for(const [speaker,text] of [['You',q.ask],[cast.name,q.reply],['You',q.followUp],[cast.name,q.followReply]])
          if(speaker!=='You')assert.ok(story.voiceMap[JSON.stringify([speaker,text])]);
      }
    }
  }
  for(const [id,cast] of Object.entries(old.TRAIN_CAST))
    assert.deepEqual(story.characterSprites[id].frames,{idle:cast.images.idle,blink:cast.images.blink,speaking:cast.images.speaking,thoughtful:cast.images.thoughtful});
});

test('Story 3 old browser progress converts to the shared saved state',()=>{
  const runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story=story;
  runtime.allowedEvidence=new Set(story.chapters.flatMap(ch=>ch.evidence.map(item=>item.id)));
  runtime.allowedDialogue=new Set(story.chapters.flatMap(ch=>ch.characters.flatMap(person=>person.questions.map(q=>`${ch.id}:${person.id}:${q.id}`))));
  const converted=runtime.normalize(runtime.convertLegacySave({chapter:2,found:['ticket','tea','log'],solved:[0,1],heard:['0:0:1'],transcript:[{speaker:'Elias Ward',text:'A reply.'}]}));
  assert.deepEqual(converted.solved,['train-seat','train-timeline']);
  assert.ok(converted.completedDialogues.includes('carriage-four:ward:q2'));
  assert.equal(converted.chapter,2);
  assert.equal(converted.transcript[0].text,'A reply.');
});

test('Story 3 conversations stage existing portrait frames and recorded speech over the train',()=>{
  const runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story=story;runtime.motionPaused=false;
  runtime.current=()=>story.chapters[0];runtime.sceneSource=chapter=>chapter.scene;
  const ward=story.chapters[0].characters[0];
  const player=runtime.conversationMarkup(ward,'<p class="s6-dialogue-text">A question.</p>','You','<button>Continue</button>');
  const reply=runtime.conversationMarkup(ward,'<p class="s6-dialogue-text">A reply.</p>',ward.name,'<button>Continue</button>');
  assert.match(player,/s6-story03-conversation/);
  assert.match(player,/data-actor-speaking="false"/);
  assert.match(reply,/data-actor-speaking="true"/);
  assert.match(reply,/train-ward-idle\.png/);
  assert.match(reply,/cover-midnight-train\.png/);
  assert.match(runtime.voiceControl(ward.name,ward.intro),/Play voice/);
});

test('both reusable single-question layouts share light answers, and option 2 links clues',()=>{
  const runtime=Object.create(Engine.StoryRuntime.prototype);
  runtime.story=story;runtime.state={chapter:0,objectStates:{}};
  let modal;
  runtime.showModal=(title,body,actions,options)=>{modal={title,body,actions,options}};
  const puzzle=story.chapters[0].puzzle;
  assert.equal(puzzle.presentation.mode,'single-question-clues');
  runtime.showSingleQuestionPuzzle(story.chapters[0],puzzle);
  assert.match(modal.body,/s6-single-question/);
  assert.match(modal.body,/Which seat was removed from the compartment chart/);
  assert.match(modal.body,/--s6-quiz-accent:#436854/);
  assert.equal((modal.body.match(/class="s6-choice s6-single-answer/g)||[]).length,4);
  assert.equal((modal.body.match(/class="s6-single-clue"/g)||[]).length,3);
  assert.match(modal.body,/data-s6="puzzle-evidence"/);
  assert.doesNotMatch(modal.body,/s6-deduction-hero|s6-deduction-board/);
  assert.match(modal.actions,/data-s6="deduction-submit"/);
  assert.equal(modal.options.brandHeader,true);
  assert.match(modal.actions,/s6-question-actions/);
  assert.deepEqual(story.chapters.filter(ch=>ch.puzzle.type==='choice').map(ch=>ch.puzzle.presentation.mode),['single-question-clues','single-question-clues','single-question-clues']);

  const custom=structuredClone(story);
  custom.chapters[0].puzzle.presentation.mode='single-question';
  custom.chapters[0].puzzle.presentation.theme.accent='#647d92';
  assert.equal(Engine.validateDefinition(custom),custom);
  custom.chapters[0].puzzle.presentation.actions=[{action:'submit',label:'Submit deduction',icon:'submit'},{action:'evidence',target:'chart',label:'Review the route chart',icon:'evidence'}];
  assert.equal(Engine.validateDefinition(custom),custom);
  runtime.showSingleQuestionPuzzle(custom.chapters[0],custom.chapters[0].puzzle);
  assert.doesNotMatch(modal.body,/s6-single-clues|background-image/);
  assert.match(modal.actions,/Review the route chart/);
  assert.match(modal.actions,/data-id="chart"/);
  custom.chapters[0].puzzle.presentation.theme.accent='red; background:url(bad)';
  assert.throws(()=>Engine.validateDefinition(custom),/invalid single-question theme colors/);
  custom.chapters[0].puzzle.presentation.theme.accent='#647d92';custom.chapters[0].puzzle.presentation.actions[1].target='missing';
  assert.throws(()=>Engine.validateDefinition(custom),/invalid single-question actions or evidence links/);
  custom.chapters[0].puzzle.presentation.actions=[{action:'submit',label:'Submit deduction',icon:'submit'}];
  custom.chapters[0].puzzle.presentation.optionStyle='unknown';
  assert.throws(()=>Engine.validateDefinition(custom),/invalid single-question option style/);
  custom.chapters[0].puzzle.presentation.optionStyle='numbered-icon';
  assert.equal(Engine.validateDefinition(custom),custom);
  custom.chapters[0].puzzle.presentation.mode='single-question-clues';
  custom.chapters[0].puzzle.presentation.theme.accent='#647d92';
  custom.chapters[0].puzzle.presentation.evidenceRefs=['missing-clue'];
  assert.throws(()=>Engine.validateDefinition(custom),/needs valid linked clues/);
});
