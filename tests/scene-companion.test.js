const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
global.window=global;
require('../js/story-engine.js');
require('../js/scene-companion.js');
const story=require('../stories/story-07.json');
const {placement,coordinates,Controller}=global.MetrivaSceneCompanion;

test('Biscuit remains inside desktop, phone and resized scene bounds',()=>{
  for(const scene of [{width:980,height:552},{width:350,height:197},{width:210,height:118}]){
    const pet={width:82,height:82};
    for(const input of [{x:0,y:0},{x:1,y:1},{x:-50,y:99},{x:NaN,y:Infinity}]){
      const p=placement(input,scene,pet);
      assert.ok(p.left>=0&&p.top>=0);
      assert.ok(p.left+pet.width<=scene.width);
      assert.ok(p.top+pet.height<=scene.height);
    }
    const outside=coordinates(-500,5000,scene,pet);
    assert.deepEqual(outside,{x:0,y:1});
  }
});

test('positions and independent minimise/motion preferences survive save normalization',()=>{
  const runtime=Object.create(global.MetrivaStoryEngine.StoryRuntime.prototype);
  runtime.story=story;runtime.allowedEvidence=new Set(story.chapters.flatMap(c=>c.evidence.map(e=>e.id)));runtime.allowedDialogue=new Set();
  const state=runtime.normalize({companion:{positions:{workshop:{x:.23,y:.91},'town-square':{x:-8,y:40}},minimized:true,paused:true}});
  assert.deepEqual(state.companion.positions.workshop,{x:.23,y:.91});
  assert.deepEqual(state.companion.positions['town-square'],{x:0,y:1});
  assert.equal(state.companion.minimized,true);
  assert.equal(state.companion.collapsed,false,'scene minimising leaves the sidebar available');
  assert.equal(state.companion.paused,true);
  assert.deepEqual(runtime.normalize({}).companion.positions.workshop,{x:.95,y:.98});
});

function searchHarness(){
  const pet=Object.create(Controller.prototype),chapter=story.chapters[0],marker={dataset:{id:chapter.companionSearch.targets[0]},classList:{add(){}}};
  pet.state={affection:0,paused:true,positions:{},discoveries:[],minimized:false};pet.chapter=chapter;
  pet.runtime={state:{found:[]},motionPaused:false,has:()=>false,save:async()=>{},inspect:()=>assert.fail('search must wait for the player to open evidence')};
  pet.scene={querySelectorAll:()=>[marker]};pet.anchor={classList:{add(){}}};pet.refresh=()=>{};pet.frame=()=>{};pet.message=()=>{};pet.place=()=>{};pet.remember=()=>{};pet.refreshView=()=>{};
  pet.timers=new Set();pet.abort=new AbortController();pet.layer={remove(){}};
  return pet;
}

test('search at zero affection highlights evidence without collecting or opening it',async()=>{
  const pet=searchHarness();pet.search();
  assert.equal(pet.searching,true);
  assert.deepEqual(pet.state.discoveries,[]);
  await new Promise(resolve=>setTimeout(resolve,125));
  assert.deepEqual(pet.state.discoveries,[pet.chapter.companionSearch.targets[0]]);
  assert.deepEqual(pet.runtime.state.found,[]);
  assert.equal(pet.state.affection,0);
  assert.equal(pet.searching,false);
  pet.destroy();
});

test('leaving a scene cancels pending search and reaction timers',async()=>{
  const pet=searchHarness();pet.search();pet.destroy();
  await new Promise(resolve=>setTimeout(resolve,125));
  assert.deepEqual(pet.state.discoveries,[]);
  assert.equal(pet.timers.size,0);
});

test('all thirty labelled poses use the dedicated six-column sheet',()=>{
  const sprite=story.characterSprites.biscuit;
  const png=fs.readFileSync(path.join(__dirname,'..',sprite.src));
  assert.equal(png.readUInt32BE(16),3072);assert.equal(png.readUInt32BE(20),2560);
  assert.equal(sprite.columns,6);assert.equal(sprite.rows,5);
  assert.equal(story.characterExpressions.biscuit.length,30);
  assert.equal(sprite.frames.sniffing,13);assert.equal(sprite.frames.treat,15);assert.equal(sprite.frames['found-letter'],28);assert.equal(sprite.frames.celebrate,29);
  const page=fs.readFileSync(path.join(__dirname,'..','story-07.html'),'utf8');
  assert.ok(page.indexOf('js/scene-companion.js')<page.indexOf('js/story-engine.js'));
});

test('settling after a treat refreshes the sidebar to match the floating idle pose',()=>{
  const pet=Object.create(Controller.prototype);pet.state={mood:'treat'};
  let refreshed=0,pose;
  pet.runtime={refreshCompanionPanel(){refreshed++;assert.equal(pet.state.mood,'idle');}};
  pet.frame=name=>{pose=name;};pet.anchor={classList:{remove(){}}};
  pet.settle();assert.equal(pose,'idle');assert.equal(refreshed,1);
});
