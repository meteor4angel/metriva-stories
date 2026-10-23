const test=require('node:test'),assert=require('node:assert/strict');
global.window=global;require('../js/story-engine.js');const Engine=global.MetrivaStoryEngine,story=require('../stories/story-07.json');
function harness(found=[]){const r=Object.create(Engine.StoryRuntime.prototype);r.story=story;r.allowedEvidence=new Set(story.chapters.flatMap(c=>c.evidence.map(e=>e.id)));r.allowedDialogue=new Set();r.allowedCharacterIntros=new Set();r.state=r.normalize({chapter:3,found});r.current=()=>story.chapters[3];r.root={querySelector:()=>null,querySelectorAll:()=>[],innerHTML:''};r.objectVisible=()=>true;r.chapterGateMet=()=>false;r.isSolved=()=>false;r.chapterUnlocked=i=>i<=3;r.availableQuestions=p=>p.questions;r.characterAvailable=()=>true;r.completed=()=>false;r.progress=()=>0;r.debugMarkup=()=>'';r.decorateInvestigationPage=()=>{};r.decorateStory7Scene=()=>{};r.storageAvailable=true;return r;}
test('browsing and following a preview never collect clues or expose the unrevealed clue text',()=>{
 const r=harness(),c=r.current(),p=r.sceneExplorerMarkup();assert.match(p,/Explore the scene/);assert.match(p,/Examine this clue/);assert.ok(!p.includes(c.evidence[0].detail));
 r.selectExplorer(1);assert.equal(r.sceneExplorerModel().item.id,c.evidence[1].id);r.followCompanionClue(c.evidence[2].id);assert.equal(r.sceneExplorerModel().item.id,c.evidence[2].id);assert.deepEqual(r.state.found,[]);
 r.selectExplorer(3);assert.equal(r.explorerIndex,0);r.selectExplorer(-1);assert.equal(r.explorerIndex,2);
});
test('notebook is empty with zero examined clues and includes only the examined subset',()=>{
 const c=story.chapters[3];for(const ids of [[],[c.evidence[1].id],c.evidence.map(e=>e.id)]){
  const r=harness(ids);r.render();const notebook=r.root.innerHTML.split('<section class="s6-notebook">')[1].split('<div class="s6-tools">')[0];
  assert.equal((notebook.match(/class="s6-evidence-card"/g)||[]).length,ids.length);
  for(const e of c.evidence)assert.equal(notebook.includes('data-id="'+e.id+'"'),ids.includes(e.id));
  if(!ids.length)assert.match(notebook,/Your notebook is empty/);assert.ok(!notebook.includes('locked'));
 }
});
test('Biscuit has a large expressive portrait and following requires no affection threshold',()=>{
 const r=harness();r.state.companion.affection=0;r.state.companion.searchTarget=r.current().evidence[0].id;
 const html=r.companionMarkup(r.current());assert.match(html,/s7-companion-hero/);assert.match(html,/Follow Biscuit to this clue/);assert.match(html,/Trust 0%/);
 r.state.found.push(r.state.companion.searchTarget);assert.ok(!r.companionMarkup(r.current()).includes('data-s6="companion-follow"'));
});
