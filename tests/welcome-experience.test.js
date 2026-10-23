const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {WelcomeExperience,SafeStore,visitMode,CAST,STATES}=require('../js/welcome-experience.js');
const config=require('../public/assets/welcome/welcome-experience.json');
const base=path.join(__dirname,'../public/assets/welcome');
const memory=()=>new SafeStore(null);
function clock(){let next=0;const jobs=new Map();return {jobs,setTimeout(fn,ms){const id=++next;jobs.set(id,{fn,ms});return id},clearTimeout(id){jobs.delete(id)},tick(){const [id,job]=jobs.entries().next().value||[];if(job){jobs.delete(id);job.fn()}}};}
function harness(){
 const c=clock(),local={},session={};
 const r=new WelcomeExperience(config,{document:{baseURI:'http://localhost/'},localStorage:local,sessionStorage:session,clock:c,media:{matches:false}});
 r.transition=state=>{assert.ok(STATES.has(state));r.state=state;};r.showCast=()=>{};r.showGroupPose=()=>{};r.playVoice=()=>{};
 r.caption={};r.root={dataset:{},classList:{toggle(){}}};r.waiting=()=>{r.state='waiting'};
 return {r,c};
}
test('visitor state uses local visit history and session-only suppression',()=>{
 const local=memory(),session=memory();assert.equal(visitMode(config,local,session),'firstVisit');
 local.set(config.storage.visitedKey,true);assert.equal(visitMode(config,local,session),'returningVisit');
 session.set(config.storage.seenSessionKey,true);assert.equal(visitMode(config,local,session),'waiting');
 session.set(config.storage.dismissedSessionKey,true);assert.equal(visitMode(config,local,session),'minimized');
 assert.equal(visitMode(config,local,memory()),'returningVisit');
});
test('blocked storage safely retains this page visitor preferences',()=>{
 const s=new SafeStore({getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}});
 s.set('visited',true);assert.equal(s.get('visited'),'true');assert.equal(s.get('missing'),null);
});
test('all 36 illustration references exist and no story sprites are reused',()=>{
 let count=0;
 for(const id of CAST)for(const file of Object.values(config.characters[id].expressions)){assert.ok(fs.existsSync(path.join(base,file)),file);assert.ok(!file.includes('story07'));count++;}
 for(const file of Object.values(config.groupWaiting.assets)){assert.ok(fs.existsSync(path.join(base,file)));count++;}
 assert.equal(count,36);assert.deepEqual(config.groupWaiting.sequence,[1,2,3,4,5,6,7,8]);
});
test('first-time and returning dialogues advance to waiting independently',()=>{
 for(const type of ['firstVisit','returningVisit']){
  const {r,c}=harness();r.run(config.sequences[type]);let n=0;
  while(c.jobs.size&&n++<20)c.tick();assert.equal(r.state,'waiting');assert.equal(c.jobs.size,0);
 }
});
test('canceling navigation stops all queued speech and movement',()=>{
 const {r,c}=harness();r.run(config.sequences.firstVisit);assert.ok(c.jobs.size);
 r.cancel();assert.equal(c.jobs.size,0);assert.equal(r.timers.size,0);
});
test('reduced motion shortens captions without removing dialogue',()=>{
 const {r,c}=harness();r.reduced=true;r.run(config.sequences.firstVisit,1);
 assert.match(r.caption.textContent,/Hello/);assert.equal([...c.jobs.values()][0].ms,1800);
});
test('voice requires BOTH an explicit gesture and available prerecorded clip',()=>{
 const {r}=harness();delete r.playVoice;r.sound=true;r.gesture=false;
 assert.doesNotThrow(()=>WelcomeExperience.prototype.playVoice.call(r,{audio:'female/welcome.mp3'}));
 r.gesture=true;assert.doesNotThrow(()=>WelcomeExperience.prototype.playVoice.call(r,{audio:'female/welcome.mp3'}));assert.equal(r.audio,undefined);
});
test('goodbye has reaction, rightward door exit and door close before hidden',()=>{
 assert.equal(config.sequences.onClose[0].state,'disappointed');assert.equal(config.sequences.onClose[2].door,'open');assert.equal(config.sequences.onClose[3].door,'closed');assert.equal(config.sequences.onClose.at(-1).state,'hidden');
 for(const seq of Object.values(config.sequences))for(const step of seq)assert.ok(STATES.has(step.state));
});
test('storyboard beats use the left peek, close cast reactions, and final door peek',()=>{
 assert.equal(config.sequences.firstVisit[0].tableau,'peek-left');
 assert.equal(config.sequences.firstVisit[1].poses.male,'wave');
 assert.equal(config.sequences.firstVisit[2].text,"We're so happy you're here!");
 assert.equal(config.sequences.onClose[0].poses.male,'disappointed');
 assert.equal(config.sequences.onClose[2].tableau,'door-peek');
 assert.equal(config.sequences.onClose[2].text,'See you around!');
 assert.ok(fs.existsSync(path.join(base,config.door.art)));
});
test('waiting scheduler uses all eight supplied poses, and reduced motion holds frame 1',()=>{
 const {r,c}=harness(),frames=[];r.groupFrame=n=>frames.push(n);
 WelcomeExperience.prototype.waiting.call(r);for(let i=0;i<8;i++)c.tick();
 assert.deepEqual(frames,[1,2,3,4,5,6,7,8,1]);
 r.reduced=true;WelcomeExperience.prototype.waiting.call(r);assert.equal(frames.at(-1),1);assert.equal(c.jobs.size,0);
});
test('close cancels the intro, and a second close skips to the accessible reopen button',()=>{
 const {r,c}=harness();r.root.querySelector=()=>({setAttribute(){},focus(){}});
 r.run(config.sequences.firstVisit);r.close();
 assert.equal(r.state,'disappointed');assert.equal(c.jobs.size,1);assert.equal(r.session.get(config.storage.dismissedSessionKey),'true');
 r.close();assert.equal(r.state,'minimized');assert.equal(c.jobs.size,0);
});
test('unavailable group images fail gracefully without rendering individual layers',async()=>{
 const {r}=harness();r.state='waiting';r.preload=async()=>false;await r.groupFrame(1);
 assert.equal(r.root.dataset.groupFrame,undefined);assert.equal(r.state,'waiting');
});
test('generated classic-script configuration matches the authoritative JSON',()=>{
 const vm=require('node:vm'),context={window:{}};
 vm.runInNewContext(fs.readFileSync(path.join(base,'welcome-config.js'),'utf8'),context);
 assert.deepEqual(JSON.parse(JSON.stringify(context.window.METRIVA_WELCOME_CONFIG)),config);
});
test('direct-file welcome loads the bundled data without any fetch',async()=>{
 const api=require('../js/welcome-experience.js'),url=new URL('file:///C:/project/public/assets/welcome/welcome-experience.json');
 global.METRIVA_WELCOME_CONFIG=config;
 try{
  const actual=await api.resolveConfig({fetch:()=>assert.fail('file mode must not fetch JSON')},url);
  assert.equal(actual,config);
  assert.equal(new URL(config.characters.female.expressions.wave,new URL('.',url)).href,'file:///C:/project/public/assets/welcome/female/wave.webp');
 }finally{delete global.METRIVA_WELCOME_CONFIG;}
});

test('every active welcome beat selects a complete supplied group',()=>{
 assert.equal(config.groupPoses.enabled,true);
 assert.equal(Object.keys(config.groupPoses.assets).length,14);
 for(const seq of Object.values(config.sequences))for(const step of seq){
  if(step.state==='waiting'||step.state==='hidden')continue;
  const file=config.groupPoses.assets[step.groupPose];
  assert.ok(file,step.id+' needs a composed group');
  assert.ok(fs.existsSync(path.join(base,file)),file);
 }
 assert.equal(config.door.mode,'included-in-group');
 assert.ok(fs.existsSync(path.join(base,config.groupPoses.fallback)));
 const {r}=harness();r.cast={classList:{add(value){assert.equal(value,'is-hidden')}}};
 WelcomeExperience.prototype.showCast.call(r,{});
});

test('dragging stays inside the viewport and re-clamps after resizing',()=>{
 const {r}=harness(),view={innerWidth:1000,innerHeight:700};
 r.document.defaultView=view;r.root.getBoundingClientRect=()=>({width:450,height:430});r.slot={style:{}};
 r.moveTo(900,600);assert.deepEqual(r.position,{x:542,y:262});assert.equal(r.slot.style.bottom,'auto');
 view.innerWidth=500;view.innerHeight=500;r.moveTo(r.position.x,r.position.y);
 assert.deepEqual(r.position,{x:42,y:62});
 r.moveTo(-100,-100);assert.deepEqual(r.position,{x:8,y:8});
});

test('hover holds the supplied reaction and restores the current waiting pose',()=>{
 const {r}=harness(),seen=[];r.state='waiting';r.groupIndex=3;
 r.showGroupAsset=(...args)=>seen.push(args);r.groupFrame=(...args)=>seen.push(args);
 r.setWaitingHover(true);assert.equal(r.hovered,true);assert.equal(seen[0][0],config.groupWaiting.hoverAsset);
 r.setWaitingHover(true);assert.equal(seen.length,1);
 r.setWaitingHover(false);assert.deepEqual(seen[1],[4,true]);
 r.state='exiting';r.setWaitingHover(true);assert.equal(seen.length,2);
 assert.ok(fs.existsSync(path.join(base,config.groupWaiting.hoverAsset)));
});
