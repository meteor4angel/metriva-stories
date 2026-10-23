const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {audit}=require('../scripts/audit-story-dialogue.js');
const story=require('../stories/story-07.json');
test('all 35 chapters have distinct conversations, responses and openings in their actual runtime scripts',()=>{
 const result=audit(path.resolve(__dirname,'..'));assert.equal(result.stories,7);assert.equal(result.chapters,35);assert.equal(result.topics,151);
 assert.deepEqual(result.duplicateTopics,[]);assert.deepEqual(result.duplicateSpokenLines,[]);assert.deepEqual(result.scriptDrift,[]);
});
test('Story 7 reserves Elias’s admission and grief explanation for the sunset chapter',()=>{
 const early=JSON.stringify({chapters:story.chapters.slice(0,4),scripts:story.conversationScript.slice(0,4)});
 for(const spoiler of ['I should have told the town it was a deliberate stop','Did you mean to keep the town clock there forever','Grief made that promise easy to extend','I removed the stop pawl','Elias stopped the clock to hold onto'])assert.ok(!early.includes(spoiler),spoiler);
 const slip=story.chapters[1].evidence.find(e=>e.id==='repair-note');assert.match(slip.detail,/unsigned/i);assert.match(slip.note,/author is unknown/i);
 const final=story.chapters[4].characters.find(p=>p.id==='clockmaker').questions.find(q=>q.id==='truth');assert.match(final.reply,/Yes\. I removed the stop pawl/);assert.match(final.followReply,/last minute Mara and I shared/);
});
test('dialogue rewrites retain every chapter progression gate and stable question identity',()=>{
 for(const n of [4,7]){const s=require('../stories/story-0'+n+'.json');for(const c of s.chapters){const valid=new Set(c.characters.flatMap(p=>p.questions.map(q=>c.id+':'+p.id+':'+q.id)));for(const key of c.gate?.allDialogue||[])assert.ok(valid.has(key),key);}}
});
test('Story 5 does not repeat a character greeting already spoken in the chapter opening',()=>{
 global.window=global;require('../js/story-engine.js');require('../js/days-conversations.js');
 const s=require('../stories/story-05.json'),runtime=Object.create(global.MetrivaStoryEngine.StoryRuntime.prototype);
 runtime.story={...s,conversationScript:global.DAYS_CONVERSATIONS};runtime.characterAvailable=()=>true;runtime.save=()=>{};runtime.renderDialogue=()=>{};
 for(const [chapter,c]of s.chapters.entries()){
  runtime.state={chapter,conversationOpenings:[chapter],completedDialogues:[],characterIntrosSeen:[]};runtime.current=()=>c;
  for(const person of c.characters){runtime.openCharacter(person.id);assert.equal(runtime.state.dialogue.phase,'menu');assert.equal(runtime.state.dialogue.showIntro,false,`${chapter+1}/${person.id}`);}
 }
});
