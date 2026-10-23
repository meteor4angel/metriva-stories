const test=require('node:test'),assert=require('node:assert/strict');
global.window=global;require('../js/story-engine.js');const Engine=global.MetrivaStoryEngine;
const stories=[1,2,3,4,5,6,7].map(n=>require('../stories/story-0'+n+'.json'));
const puzzles=stories.flatMap(story=>story.chapters.map((ch,index)=>({story,ch,index}))).filter(x=>x.ch.puzzle.presentation?.layout==='card-slots');
test('all 13 list puzzles share card placement while spatial puzzles keep their presentations',()=>{assert.equal(puzzles.length,13);assert.equal(stories[1].chapters[0].puzzle.presentation.mode,'bookshelf');assert.deepEqual(stories[5].chapters.filter(c=>c.puzzle.type==='sequence').map(c=>c.puzzle.presentation.mode),['interactive-route','garden-route','machinery-sequence']);});
for(const {story,ch,index} of puzzles)test(story.title+' / '+ch.puzzle.title+': place, swap, resume, remove, reset and solve',async()=>{
 const p=ch.puzzle,r=Object.create(Engine.StoryRuntime.prototype);r.allowedEvidence=new Set(story.chapters.flatMap(c=>c.evidence.map(e=>e.id)));r.allowedDialogue=new Set();r.allowedCharacterIntros=new Set();r.story=story;r.state={chapter:index,puzzleDrafts:{}};r.current=()=>ch;r.save=async()=>{};r.showModal=(t,b,a)=>{r.body=b;r.actions=a;};r.showCleanTimelinePuzzle(ch,p);
 assert.deepEqual(r.state.puzzleDrafts[p.id],Array(p.items.length).fill(null));assert.match(r.body,/s6-clean-timeline-art/);assert.match(r.body,/data-timeline-event/);
 let solved=0;r.solvePuzzle=()=>solved++;await r.checkCleanTimeline();assert.equal(solved,0);
 const [a,b]=p.items;await r.placeCleanTimelineEvent(a.id,0);await r.placeCleanTimelineEvent(b.id,1);await r.placeCleanTimelineEvent(a.id,1);assert.equal(r.state.puzzleDrafts[p.id][0],b.id);assert.equal(r.state.puzzleDrafts[p.id][1],a.id);
 const resumed=r.normalize({chapter:index,puzzleDrafts:r.state.puzzleDrafts});assert.deepEqual(resumed.puzzleDrafts[p.id],r.state.puzzleDrafts[p.id]);
 await r.removeCleanTimelineEvent(1);assert.equal(r.state.puzzleDrafts[p.id][1],null);await r.resetCleanTimeline();assert.ok(r.state.puzzleDrafts[p.id].every(x=>x===null));
 for(let i=0;i<p.answer.length;i++)await r.placeCleanTimelineEvent(p.answer[i],i);await r.placeCleanTimelineEvent(p.answer[0],1);await r.checkCleanTimeline();assert.equal(solved,0);await r.placeCleanTimelineEvent(p.answer[0],0);await r.checkCleanTimeline();assert.equal(solved,1);
});
