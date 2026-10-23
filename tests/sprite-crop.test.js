const test=require('node:test'),assert=require('node:assert/strict');
global.window=global;require('../js/story-engine.js');const Engine=global.MetrivaStoryEngine,story=require('../stories/story-07.json');
const contains=(r,x,y)=>x>=r.x&&x<r.x+r.width&&y>=r.y&&y<r.y+r.height;
test('crop windows exclude observed neighbour fragments while keeping the complete clockmaker and Biscuit',()=>{
 const c=story.characterSprites.clockmaker,b=story.characterSprites.biscuit;
 const observed=[
  [c,15,[1536+150,1024],[1536+90,1024+21,1536+420,1024+509]],
  [c,16,[2048+170,1025],[2048+22,1024+18,2048+434,1024+509]],
  [c,17,[2560+150,1025],[2560+72,1024+22,2560+468,1024+509]],
  [c,18,[400,1536+505],[42,1536+32,488,1536+483]],
  [c,19,[512+220,1536+508],[512+86,1536+16,512+434,1536+486]],
  [b,22,[2048+10,1536+70],[2048+87,1536+24,2048+474,1536+450]]
 ];
 for(const [sprite,index,fragment,body]of observed){const r=sprite.frameWindows[index];assert.ok(!contains(r,...fragment));assert.ok(contains(r,body[0],body[1]));assert.ok(contains(r,body[2],body[3]));}
});
test('atlas crop happens inside the outlined portrait and follows the requested expression',()=>{
 const r=Object.create(Engine.StoryRuntime.prototype);r.story=story;r.motionPaused=true;
 const inner={style:{}},outer={dataset:{spriteId:'clockmaker',expression:'speaking'},style:{},querySelector:()=>inner,closest:()=>({classList:{toggle(){}}})};
 r.overlay={lastElementChild:{querySelector:()=>outer}};r.startCharacterAnimation();
 assert.equal(outer.style.backgroundImage,undefined);assert.equal(inner.style.backgroundImage,'url("'+story.characterSprites.clockmaker.src+'")');assert.equal(inner.style.backgroundRepeat,'no-repeat');
 assert.deepEqual(inner.style,Engine.spriteWindowStyle(story.characterSprites.clockmaker,'speaking'));
 assert.match(r.portrait({id:'clockmaker',name:'Elias',expression:'speaking'},'s6-conversation-portrait'),/class="s6-sprite-frame"/);
 const bad=structuredClone(story);bad.characterSprites.clockmaker.frameWindows[16].height=5000;assert.throws(()=>Engine.validateDefinition(bad),/invalid frame window/);
});
