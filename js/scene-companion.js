(function(global){
  'use strict';
  const unit=(value,fallback=.95)=>Number.isFinite(value)?Math.max(0,Math.min(1,value)):fallback;
  function placement(position,scene,pet){
    return {left:unit(position?.x)*Math.max(0,scene.width-pet.width),top:unit(position?.y)*Math.max(0,scene.height-pet.height)};
  }
  function coordinates(left,top,scene,pet){
    return {x:unit(left/Math.max(1,scene.width-pet.width)),y:unit(top/Math.max(1,scene.height-pet.height))};
  }
  class SceneCompanion {
    constructor(runtime){
      this.runtime=runtime;this.state=runtime.state.companion;this.chapter=runtime.current();this.scene=runtime.root.querySelector('.s6-scene');
      this.timers=new Set();this.abort=new AbortController();this.destroyed=false;this.searching=false;
      this.config=runtime.story.companion.scenePet;this.sprite=runtime.story.characterSprites.biscuit;
      this.state.positions||={};this.position=this.state.positions[this.chapter.id]||{...this.config.home};
      this.layer=document.createElement('div');this.layer.className='s7-scene-pet';this.scene.append(this.layer);
      this.anchor=document.createElement('div');this.anchor.className='s7-pet-anchor';this.layer.append(this.anchor);
      this.body=this.button('Biscuit: click to pet; drag or use arrow keys to move; Home returns him to his corner','s7-pet-body');
      this.art=document.createElement('span');this.art.className='s7-pet-sprite';this.art.setAttribute('aria-hidden','true');this.body.append(this.art);
      this.frameArt=document.createElement('span');this.frameArt.className='s6-sprite-frame';this.art.append(this.frameArt);
      this.art.style.backgroundImage=`url("${this.sprite.src}")`;this.art.style.backgroundSize=`${this.sprite.columns*100}% ${this.sprite.rows*100}%`;
      this.anchor.append(this.body);
      this.menuButton=this.button('Biscuit actions','s7-pet-menu-toggle','•••');this.anchor.append(this.menuButton);
      this.minimize=this.button('Minimize Biscuit','s7-pet-minimize','−');this.anchor.append(this.minimize);
      this.status=document.createElement('span');this.status.className='s7-pet-status';this.status.setAttribute('role','status');this.status.setAttribute('aria-live','polite');this.layer.append(this.status);
      this.menu=document.createElement('section');this.menu.className='s7-pet-menu';this.menu.hidden=true;this.menu.setAttribute('aria-label','Biscuit actions');this.layer.append(this.menu);
      const label=document.createElement('strong');label.textContent='Biscuit';this.menu.append(label);
      const close=this.button('Close Biscuit actions','s7-pet-menu-close','×');this.menu.append(close);
      const help=document.createElement('small');help.textContent='Drag Biscuit, or focus him and use the arrow keys.';this.menu.append(help);
      const actions=document.createElement('div');this.menu.append(actions);
      for(const [action,text] of [['pet','♡ Pet'],['treat','Give treat'],['play','Play'],['search','Search for a clue'],['view','View highlighted clue'],['motion','Pause motion'],['home','Return to corner']]){
        const button=this.button(text,'',text);button.dataset.petAction=action;actions.append(button);
        this.listen(button,'click',()=>this.action(action));
      }
      this.listen(close,'click',()=>this.toggleMenu(false));
      this.listen(this.menuButton,'click',()=>this.toggleMenu(this.menu.hidden));
      this.listen(this.minimize,'click',()=>this.collapse(true));
      this.listen(this.body,'click',()=>{if(performance.now()<(this.suppressClickUntil||0))return;this.state.minimized?this.collapse(false):this.action('pet');});
      this.listen(this.body,'pointerdown',e=>this.dragStart(e));
      this.listen(this.body,'pointermove',e=>this.dragMove(e));
      this.listen(this.body,'pointerup',e=>this.dragEnd(e));
      this.listen(this.body,'pointercancel',e=>this.dragEnd(e));
      this.listen(this.body,'lostpointercapture',e=>this.dragEnd(e));
      this.listen(this.body,'keydown',e=>this.key(e));
      this.listen(this.layer,'keydown',e=>{if(e.key==='Escape'){this.toggleMenu(false);this.body.focus();}});
      this.listen(this.body,'pointerenter',e=>{if(e.pointerType==='mouse'&&!this.searching&&!this.state.minimized&&!this.drag)this.frame('wink');});
      this.listen(this.body,'pointerleave',()=>{if(!this.searching&&!this.drag)this.frame(this.state.mood||'idle');});
      this.resize=new ResizeObserver(()=>this.place(false));this.resize.observe(this.scene);
      this.refresh();this.place(false);
      if(!['idle','sleepy'].includes(this.state.mood))this.later(()=>this.settle(),2500);
      this.idle();
    }
    button(label,className,text=''){const b=document.createElement('button');b.type='button';b.className=className;b.setAttribute('aria-label',label);b.textContent=text;return b;}
    listen(node,event,fn){node.addEventListener(event,fn,{signal:this.abort.signal});}
    later(fn,delay){const id=setTimeout(()=>{this.timers.delete(id);if(!this.destroyed)fn();},delay);this.timers.add(id);return id;}
    get reduced(){return this.state.paused||this.runtime.motionPaused||Boolean(global.matchMedia?.('(prefers-reduced-motion: reduce)').matches);}
    frame(name){if(this.sprite.sheetSize&&this.sprite.frameWindows){this.art.style.backgroundImage='none';Object.assign(this.frameArt.style,global.MetrivaStoryEngine.spriteWindowStyle(this.sprite,name));this.art.dataset.expression=name;return;}const index=this.sprite.frames[name]??this.sprite.frames.idle??0;this.art.style.backgroundPosition=`${(index%this.sprite.columns)*100/(this.sprite.columns-1)}% ${Math.floor(index/this.sprite.columns)*100/(this.sprite.rows-1)}%`;this.art.dataset.expression=name;}
    refresh(){
      this.anchor.classList.toggle('is-minimized',this.state.minimized);this.anchor.classList.toggle('is-still',this.reduced);
      this.body.setAttribute('aria-label',this.state.minimized?'Restore Biscuit':'Biscuit: click to pet; drag or use arrow keys to move; Home returns him to his corner');
      this.menuButton.hidden=this.minimize.hidden=this.state.minimized;
      this.menuButton.setAttribute('aria-expanded',String(!this.menu.hidden));
      this.menu.querySelector('[data-pet-action="view"]').hidden=!this.state.searchTarget;
      this.menu.querySelector('[data-pet-action="motion"]').textContent=this.state.paused?'Resume motion':'Pause motion';
      this.frame(this.state.minimized?'idle':this.state.mood||'idle');
    }
    sizes(){return {scene:{width:this.scene.clientWidth,height:this.scene.clientHeight},pet:{width:this.anchor.offsetWidth,height:this.anchor.offsetHeight}};}
    place(animate=true){const {scene,pet}=this.sizes(),p=placement(this.position,scene,pet);this.anchor.classList.toggle('is-travelling',animate&&!this.reduced);this.anchor.style.left=`${p.left}px`;this.anchor.style.top=`${p.top}px`;}
    remember(){this.state.positions[this.chapter.id]={x:unit(this.position.x),y:unit(this.position.y)};this.runtime.save();}
    message(text){this.status.textContent=text;this.state.message=text;if(this.runtime.refreshCompanionPanel)this.runtime.refreshCompanionPanel();else {const sidebar=this.runtime.root.querySelector('.s7-companion-message');if(sidebar)sidebar.textContent=text;}}
    settle(){if(this.searching||this.drag||this.state.minimized)return;const changed=this.state.mood!=='idle';this.state.mood='idle';this.frame('idle');this.anchor.classList.remove('is-celebrating');if(changed)this.runtime.refreshCompanionPanel?.();}
    idle(){this.later(()=>{if(!this.reduced&&!this.searching&&!this.drag&&!this.state.minimized&&(this.runtime.overlay?.classList.contains('is-hidden')??true)){this.frame(['happy','curious','wink','content'][(this.idleTick=(this.idleTick||0)+1)%4]);this.later(()=>this.settle(),450);}this.idle();},6500);}
    toggleMenu(open){this.menu.hidden=!open;this.menuButton.setAttribute('aria-expanded',String(open));if(open)this.menu.querySelector('[data-pet-action="pet"]').focus();else this.menuButton.focus();}
    collapse(value){this.state.minimized=value;this.menu.hidden=true;this.refresh();this.place(false);this.remember();this.body.focus();}
    async action(action){
      if(action==='search'){this.toggleMenu(false);return this.search();}
      if(action==='view'){const id=this.state.searchTarget;if(id)this.runtime.inspect(id,false,true);return;}
      if(action==='home'){this.position={...this.config.home};this.place();this.remember();return;}
      if(action==='motion'){this.state.paused=!this.state.paused;this.refresh();this.place(false);this.remember();return;}
      if(this.searching){this.message('Biscuit is following a scent. Give him a moment.');return;}
      if(action==='play'){this.frame('playful-crouch');this.message('Biscuit bows, ready to play!');this.later(()=>this.frame('playful-jump'),600);this.later(()=>this.frame('roll-over'),1400);this.later(()=>this.settle(),2800);return;}
      await this.runtime.petCompanion(action);
      this.runtime.sceneCompanion?.body.focus();
    }
    dragStart(e){if(e.button!==0||this.searching)return;this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,start:{...this.position},moved:false};this.body.setPointerCapture(e.pointerId);}
    dragMove(e){if(!this.drag||e.pointerId!==this.drag.id)return;const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;if(Math.hypot(dx,dy)<5&&!this.drag.moved)return;this.drag.moved=true;const {scene,pet}=this.sizes(),start=placement(this.drag.start,scene,pet);this.position=coordinates(start.left+dx,start.top+dy,scene,pet);this.anchor.classList.add('is-dragging');this.frame('curious');this.place(false);e.preventDefault();}
    dragEnd(e){if(!this.drag||this.drag.id!==e.pointerId)return;const moved=this.drag.moved;this.drag=null;this.anchor.classList.remove('is-dragging');if(moved){this.suppressClickUntil=performance.now()+500;this.remember();this.frame('idle');}if(this.body.hasPointerCapture?.(e.pointerId))this.body.releasePointerCapture(e.pointerId);}
    key(e){
      if(this.searching)return;
      if(e.key==='Home'){e.preventDefault();this.action('home');return;}
      const moves={ArrowLeft:[-16,0],ArrowRight:[16,0],ArrowUp:[0,-16],ArrowDown:[0,16]},move=moves[e.key];if(!move)return;
      e.preventDefault();const {scene,pet}=this.sizes(),p=placement(this.position,scene,pet);this.position=coordinates(p.left+move[0],p.top+move[1],scene,pet);this.place(false);this.remember();
    }
    search(){
      if(this.searching)return;
      const spec=this.chapter.companionSearch||{},id=spec.targets?.find(id=>!this.runtime.has(id));
      if(!id){this.frame('curious');this.message(spec.emptyMessage||'Biscuit has checked all the clues here.');return;}
      const target=this.chapter.evidence.find(e=>e.id===id);if(!target)return;
      this.state.minimized=false;this.state.searchTarget=id;this.state.mood='sniffing';this.searching=true;this.refresh();this.frame('sniffing');this.message('Biscuit is following a scent…');
      const floor=this.chapter.companionFloor||{left:.08,right:.82,top:.72,bottom:.96},point=target.markerPosition||target.position;
      this.position={x:Math.max(floor.left,Math.min(floor.right,(point?.x||50)/100)),y:(floor.top+floor.bottom)/2};
      if(!this.reduced){this.frame('running');this.place(true);this.later(()=>this.frame('sniffing'),950);}else this.place(false);
      this.later(()=>{
        this.searching=false;this.state.mood='proud';this.state.discoveries=[...new Set([...this.state.discoveries,id])];
        const marker=[...this.scene.querySelectorAll('.s6-hotspot')].find(node=>node.dataset.id===id);
        if(marker){marker.classList.add('is-biscuit-clue');marker.textContent='🐾';}
        this.frame(/letter|note/i.test(target.title)?'found-letter':'alert');this.message(`Woof! Look at ${target.title.toLowerCase()}. Select its paw marker to examine it.`);
        this.anchor.classList.add('is-celebrating');this.remember();this.refreshView();
        this.later(()=>{this.frame('celebrate');this.later(()=>this.settle(),1300);},650);
      },this.reduced?100:1800);
    }
    refreshView(){this.menu.querySelector('[data-pet-action="view"]').hidden=!this.state.searchTarget;}
    destroy(){this.destroyed=true;this.abort.abort();this.resize?.disconnect();for(const id of this.timers)clearTimeout(id);this.timers.clear();this.layer.remove();}
  }
  global.MetrivaSceneCompanion={placement,coordinates,Controller:SceneCompanion,mount(runtime){return new SceneCompanion(runtime);}};
})(typeof window!=='undefined'?window:globalThis);
