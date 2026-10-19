/* Metriva Story Engine v1 — generic runtime. Story definitions remain versioned JSON. */
((global) => {
  'use strict';
  const ENGINE_VERSION = '1.7.0';
  const clone = value => JSON.parse(JSON.stringify(value));
  const characterFrame = (characterSpeaking,voiceSpeaking,elapsed,speakFor) => characterSpeaking&&(voiceSpeaking||elapsed<speakFor)&&elapsed%480<230?'speaking':elapsed%4400>4000?'blink':'idle';
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const validRect = rect => rect && ['x','y','width','height'].every(key=>Number.isFinite(rect[key])) && rect.x>=0 && rect.y>=0 && rect.width>0 && rect.height>0 && rect.x+rect.width<=100 && rect.y+rect.height<=100;
  const intersects = (a,b) => a.x<b.x+b.width && a.x+a.width>b.x && a.y<b.y+b.height && a.y+a.height>b.y;
  const pointIn = (point,rect) => Number.isFinite(point?.x)&&Number.isFinite(point?.y)&&point.x>=rect.x && point.x<=rect.x+rect.width && point.y>=rect.y && point.y<=rect.y+rect.height;
  function insertSequenceItem(order,from,to) {
    if(!Array.isArray(order)||!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=order.length||to>=order.length)return order;
    const next=[...order];next.splice(to,0,next.splice(from,1)[0]);return next;
  }
  const isInteractiveRoute = puzzle => puzzle?.type==='sequence'&&puzzle.presentation?.mode==='interactive-route';
  const isGardenRoute = puzzle => puzzle?.type==='sequence'&&puzzle.presentation?.mode==='garden-route';
  const isMachinery = puzzle => puzzle?.type==='sequence'&&puzzle.presentation?.mode==='machinery-sequence';
  const isVisualRoute = puzzle => isInteractiveRoute(puzzle)||isGardenRoute(puzzle);
  function toggleRouteSelection(selected,id,validIds,limit=validIds.length) {
    if(!validIds.includes(id))return selected;
    return selected.includes(id)?selected.filter(entry=>entry!==id):selected.length<limit?[...selected,id]:selected;
  }
  function routeCorrectPrefix(selected,answer) {
    let length=0;while(length<selected.length&&selected[length]===answer[length])length++;return length;
  }
  function normalizeRouteSelection(raw,validIds,limit=validIds.length) {
    const valid=new Set(validIds);
    return Array.isArray(raw)&&raw.length<=limit&&new Set(raw).size===raw.length&&raw.every(id=>valid.has(id))?[...raw]:[];
  }
  function routeChoices(puzzle) {
    const choices=[...puzzle.items,...(Array.isArray(puzzle.presentation?.decoys)?puzzle.presentation.decoys:[])];
    const order=puzzle.presentation?.choiceOrder;
    return Array.isArray(order)?[...choices].sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id)):choices;
  }
  function findNetworkPath(edges,from,to) {
    if(from===to)return [];
    const queue=[{node:from,path:[]}],seen=new Set([from]);
    for(let index=0;index<queue.length;index++){
      const current=queue[index];
      for(const edge of edges||[]){
        const next=edge.from===current.node?edge.to:edge.to===current.node?edge.from:null;
        if(!next||seen.has(next))continue;
        const path=[...current.path,edge];if(next===to)return path;
        seen.add(next);queue.push({node:next,path});
      }
    }
    return [];
  }
  const activeObjectState = (object,states={}) => states[object.id] || object.initialState || 'default';
  const matchesStates = (when,states,objects) => Object.entries(when||{}).every(([id,state])=>objects.has(id) && activeObjectState(objects.get(id),states)===state);

  function sceneImage(chapter,states={}) {
    const spatial=chapter.spatial;
    if(!spatial)return chapter.scene;
    const objects=new Map(spatial.objects.map(object=>[object.id,object]));
    return spatial.sceneVariants?.findLast(variant=>matchesStates(variant.when,states,objects))?.src || spatial.master.src;
  }

  function evidenceView(chapter,evidence,states={}) {
    if(evidence.detailImage)return {src:evidence.detailImage,fromMaster:false,width:evidence.detailImageWidth,height:evidence.detailImageHeight};
    const spatial=chapter.spatial;
    const view=spatial?.views.find(entry=>entry.id===evidence.viewId);
    if(!view)return {src:sceneImage(chapter,states),frame:evidence.detailFrame||{x:Math.max(0,evidence.position.x-18),y:Math.max(0,evidence.position.y-18),width:36,height:36},fromMaster:true};
    const objects=new Map(spatial.objects.map(object=>[object.id,object]));
    const variant=view.variants?.findLast(entry=>matchesStates(entry.when,states,objects));
    return {src:variant?.src||view.image?.src||sceneImage(chapter,states),frame:view.frame,imageCrop:variant?null:view.image?.crop,fromMaster:!variant&&!view.image,width:variant?.width||view.image?.width||spatial.master.width,height:variant?.height||view.image?.height||spatial.master.height};
  }

  function evidenceImagePresentation(chapter,evidence,states={},preview=false) {
    const view=evidenceView(chapter,evidence,states);
    const frame=view.imageCrop||(view.fromMaster?view.frame:null)||(preview?evidence.detailPreviewCrop:null);
    const width=view.width||chapter.spatial?.master.width||1672;
    const height=view.height||chapter.spatial?.master.height||941;
    const ratio=frame?width*frame.width/(height*frame.height):width/height;
    const size=frame?`${10000/frame.width}% ${10000/frame.height}%`:evidence.detailImage?'contain':'cover';
    const position=frame?`${frame.x/(100-frame.width)*100||0}% ${frame.y/(100-frame.height)*100||0}%`:'center';
    return {src:view.src,ratio,size,position,fromMaster:view.fromMaster};
  }

  function evidenceImageMarkup(chapter,evidence,states={},className='s6-evidence-preview') {
    const {src,ratio,size,position}=evidenceImagePresentation(chapter,evidence,states,true);
    const thumbWidth=Math.ceil(Math.max(1,ratio/(16/9))*100);
    return `<div class="${className}" role="img" aria-label="${escapeHtml(evidence.title)} in ${escapeHtml(chapter.location)}" style="--s6-image-ratio:${ratio};--s6-clue-fit-width:${Math.round(ratio*4000)/100}dvh;--s6-thumb-width:${thumbWidth}%;aspect-ratio:${ratio};background-image:url(&quot;${escapeHtml(src)}&quot;);background-size:${size};background-position:${position}"></div>`;
  }

  function documentMarkup(document,scale=1) {
    if(!document)return '';
    const route=document.route?.length?`<div class="s6-document-route" aria-label="Map route">${document.route.map((point,index)=>`${index?'<span aria-hidden="true">→</span>':''}<strong>${escapeHtml(point)}</strong>`).join('')}</div>`:'';
    return `<section class="s6-document s6-document-${document.kind}" style="--s6-doc-scale:${scale}" aria-label="Readable ${escapeHtml(document.heading)}"><span class="s6-document-kicker">Readable ${document.kind==='map'?'map and note':'ledger entry'}</span><h3>${escapeHtml(document.heading)}</h3><small>${escapeHtml(document.reference)}</small>${route}${document.lines.map(line=>`<p>${escapeHtml(line)}</p>`).join('')}${document.annotation?`<aside>${escapeHtml(document.annotation)}</aside>`:''}</section>`;
  }

  function readableDetailMarkup(evidence) {
    const detail=evidence.readableDetail;if(!detail)return '';
    const labels=(detail.labels||[]).map((label,index)=>`<li><span>${String(index+1).padStart(2,'0')}</span>${escapeHtml(label)}</li>`).join('');
    return `<section class="s6-readable-detail ${detail.kind==='schematic'?'is-schematic':'is-record'}" aria-label="${escapeHtml(detail.heading)}"><span class="s6-eyebrow">Enlarged interpretation of the pictured clue</span><h3>${escapeHtml(detail.heading)}</h3><ol>${labels}</ol><p>${escapeHtml(detail.warning||'')}</p></section>`;
  }

  function applyObjectTransitions(story,states,transitions=[]) {
    const next={...states};
    const objects=new Map(story.chapters.flatMap(chapter=>(chapter.spatial?.objects||[]).map(object=>[object.id,object])));
    for(const transition of transitions){
      const object=objects.get(transition.objectId);
      if(!object||!Object.hasOwn(object.states,transition.toState))throw new Error(`Invalid object transition ${transition.objectId} → ${transition.toState}`);
      next[object.id]=transition.toState;
    }
    return next;
  }

  function normalizeObjectStates(story,saved={}) {
    const states={};
    for(const chapter of story.chapters)for(const object of chapter.spatial?.objects||[]){
      const value=saved?.[object.id];
      if(typeof value==='string'&&Object.hasOwn(object.states,value))states[object.id]=value;
    }
    return states;
  }

  function pickEvidenceAt(chapter,point,isVisible=()=>true) {
    const objects=new Map((chapter.spatial?.objects||[]).map(object=>[object.id,object]));
    return chapter.evidence.filter(item=>item.inspectionRegion&&pointIn(point,item.inspectionRegion)&&isVisible(item)).sort((a,b)=>{
      const distance=item=>(item.position.x-point.x)**2+(item.position.y-point.y)**2;
      return distance(a)-distance(b)||(objects.get(b.objectId)?.layer||0)-(objects.get(a.objectId)?.layer||0)||(objects.get(b.objectId)?.depth||0)-(objects.get(a.objectId)?.depth||0);
    })[0]||null;
  }

  class InlineJsonStorySource {
    constructor(jsonText) { this.jsonText = jsonText; }
    async load() { return JSON.parse(this.jsonText); }
  }

  class FetchJsonStorySource {
    constructor(url, options = {}) { this.url = url; this.options = options; }
    async load() {
      const response = await fetch(this.url, {headers:{Accept:'application/json',...this.options.headers},credentials:this.options.credentials || 'same-origin',signal:this.options.signal});
      if (!response.ok) throw new Error(`Story data request failed (${response.status}).`);
      return response.json();
    }
  }

  class LocalProgressRepository {
    constructor(storage = null) { this.storage = storage; }
    store() { return this.storage || global.localStorage; }
    key(storyId) { return `metriva:story:${storyId}:progress:v1`; }
    async load(storyId) {
      try {
        const raw = this.store().getItem(this.key(storyId));
        if (!raw) return null;
        const envelope = JSON.parse(raw);
        if (envelope.schemaVersion !== 1 || envelope.storyId !== storyId || !envelope.state) return null;
        return {state:envelope.state,revision:envelope.revision || 0,savedAt:envelope.savedAt || null};
      } catch { return null; }
    }
    async save(storyId, state, revision = 0) {
      const envelope = {schemaVersion:1,storyId,revision:revision+1,savedAt:new Date().toISOString(),state};
      this.store().setItem(this.key(storyId), JSON.stringify(envelope));
      return {revision:envelope.revision,savedAt:envelope.savedAt};
    }
    async clear(storyId) { this.store().removeItem(this.key(storyId)); }
  }

  // Future API adapter: use the same repository contract with an authenticated JSON endpoint.
  // The caller can inject auth headers and an endpoint without changing story or UI code.
  class ApiProgressRepository {
    constructor({baseUrl,headers = {},credentials = 'same-origin',fetchImpl = fetch}) {
      if (!baseUrl) throw new Error('ApiProgressRepository requires baseUrl.');
      this.baseUrl = baseUrl.replace(/\/$/, ''); this.headers = headers; this.credentials = credentials; this.fetchImpl = fetchImpl; this.etags = new Map();
    }
    endpoint(storyId) { return `${this.baseUrl}/${encodeURIComponent(storyId)}/progress`; }
    async load(storyId) {
      const response = await this.fetchImpl(this.endpoint(storyId), {headers:{Accept:'application/json',...this.headers},credentials:this.credentials});
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`Progress request failed (${response.status}).`);
      this.etags.set(storyId, response.headers.get('ETag'));
      const envelope = await response.json();
      return {state:envelope.state,revision:envelope.revision || 0,savedAt:envelope.savedAt || null};
    }
    async save(storyId, state, revision = 0) {
      const etag = this.etags.get(storyId);
      const response = await this.fetchImpl(this.endpoint(storyId), {method:'PUT',headers:{'Content-Type':'application/json',Accept:'application/json',...(etag?{'If-Match':etag}:{'If-None-Match':'*'}),...this.headers},credentials:this.credentials,body:JSON.stringify({schemaVersion:1,storyId,revision:revision+1,savedAt:new Date().toISOString(),state})});
      if (response.status === 409 || response.status === 412) throw new Error('This save changed in another session. Reload the latest progress before continuing.');
      if (!response.ok) throw new Error(`Progress save failed (${response.status}).`);
      this.etags.set(storyId,response.headers.get('ETag'));
      const result = await response.json().catch(()=>({}));
      return {revision:result.revision || revision+1,savedAt:result.savedAt || new Date().toISOString()};
    }
    async clear(storyId) {
      const response = await this.fetchImpl(this.endpoint(storyId), {method:'DELETE',headers:{...this.headers,...(this.etags.get(storyId)?{'If-Match':this.etags.get(storyId)}:{})},credentials:this.credentials});
      if (!response.ok && response.status !== 404) throw new Error(`Progress reset failed (${response.status}).`);
      this.etags.delete(storyId);
    }
  }

  function validateSpatial(story) {
    const errors=[];
    const allObjects=new Set();
    const allScenes=new Set();
    for(const chapter of story?.chapters||[]){
      const spatial=chapter.spatial;
      if(!spatial)continue; // v1 stories without a manifest remain valid.
      const where=`chapter ${chapter.id} spatial`;
      if(spatial.version!==1||!spatial.sceneId||!spatial.master?.src||!Number.isInteger(spatial.master?.width)||spatial.master.width<1||!Number.isInteger(spatial.master?.height)||spatial.master.height<1)errors.push(`${where} needs version 1, sceneId, and master image dimensions`);
      if(allScenes.has(spatial.sceneId))errors.push(`${where} duplicates scene ID ${spatial.sceneId}`);
      allScenes.add(spatial.sceneId);
      if(spatial.master?.src!==chapter.scene)errors.push(`${where} master must match chapter.scene`);
      if(!spatial.environment?.layout||!spatial.environment?.lighting||!Array.isArray(spatial.environment?.landmarks))errors.push(`${where} needs environment layout, lighting, and landmarks`);
      if(!Array.isArray(spatial.objects)||!Array.isArray(spatial.views)){errors.push(`${where} needs objects and views arrays`);continue;}
      const objects=new Map(),views=new Map();
      for(const object of spatial.objects){
        if(!object.id||allObjects.has(object.id)||objects.has(object.id))errors.push(`${where} has missing or duplicate physical object ID ${object.id||'(missing)'}`);
        if(object.id){allObjects.add(object.id);objects.set(object.id,object);}
        if(!validRect(object.footprint))errors.push(`object ${object.id} has an invalid footprint`);
        if(!object.appearance||!object.material||!object.support||!Number.isFinite(object.depth)||object.depth<0||object.depth>1||!Number.isInteger(object.layer)||object.layer<0)errors.push(`object ${object.id} lacks visual continuity metadata`);
        if(!object.states||typeof object.states!=='object'||Array.isArray(object.states)||!Object.hasOwn(object.states,object.initialState||'default'))errors.push(`object ${object.id} has invalid states or initialState`);
        else for(const [stateId,state] of Object.entries(object.states))if(!stateId||typeof state.visible!=='boolean')errors.push(`object ${object.id} state ${stateId} needs visible`);
      }
      for(const object of spatial.objects)for(const near of object.nearby||[])if(!objects.has(near)||near===object.id)errors.push(`object ${object.id} has invalid nearby object ${near}`);
      for(const view of spatial.views){
        if(!view.id||views.has(view.id))errors.push(`${where} has missing or duplicate view ID ${view.id||'(missing)'}`);
        if(view.id)views.set(view.id,view);
        if(!objects.has(view.objectId))errors.push(`view ${view.id} references unknown object ${view.objectId}`);
        if(!validRect(view.frame))errors.push(`view ${view.id} has invalid close-up frame`);
        if(!Array.isArray(view.visibleObjectIds)||!view.visibleObjectIds.includes(view.objectId))errors.push(`view ${view.id} must list its subject among visible objects`);
        for(const id of view.visibleObjectIds||[]){
          const object=objects.get(id);
          if(!object){errors.push(`view ${view.id} references unknown visible object ${id}`);continue;}
          if(validRect(view.frame)&&validRect(object.footprint)&&!intersects(view.frame,object.footprint)&&!view.continuityException)errors.push(`view ${view.id} includes ${id} outside its frame without an approved exception`);
        }
        const subject=objects.get(view.objectId);
        for(const nearbyId of subject?.nearby||[]){const nearby=objects.get(nearbyId);if(nearby&&validRect(view.frame)&&validRect(nearby.footprint)&&intersects(view.frame,nearby.footprint)&&!view.visibleObjectIds?.includes(nearbyId)&&!view.continuityException)errors.push(`view ${view.id} omits nearby object ${nearbyId} inside its frame`);}
        if(view.image&&(!view.image.src||!Number.isInteger(view.image.width)||!Number.isInteger(view.image.height)))errors.push(`view ${view.id} detailed image needs src and dimensions`);
        if(view.image?.crop&&!validRect(view.image.crop))errors.push(`view ${view.id} detailed image has an invalid crop`);
        for(const variant of view.variants||[])if(!variant.src||!variant.when||typeof variant.when!=='object'||Object.entries(variant.when).some(([id,state])=>!objects.get(id)?.states?.[state]))errors.push(`view ${view.id} has invalid state image variant`);
      }
      for(const variant of spatial.sceneVariants||[])if(!variant.src||!variant.when||typeof variant.when!=='object'||Object.entries(variant.when).some(([id,state])=>!objects.get(id)?.states?.[state]))errors.push(`${where} has invalid scene state image variant`);
      for(const evidence of chapter.evidence||[]){
        const object=objects.get(evidence.objectId),view=views.get(evidence.viewId);
        if(!object)errors.push(`evidence ${evidence.id} references unknown physical object ${evidence.objectId}`);
        if(!view||view.objectId!==evidence.objectId)errors.push(`evidence ${evidence.id} references an invalid clue view ${evidence.viewId}`);
        if(evidence.inspectionRegion!==undefined&&!validRect(evidence.inspectionRegion))errors.push(`evidence ${evidence.id} has invalid inspection region`);
        if(validRect(evidence.inspectionRegion)&&!pointIn(evidence.position,evidence.inspectionRegion))errors.push(`evidence ${evidence.id} marker lies outside its inspection region`);
        if(object&&validRect(object.footprint)&&!pointIn(evidence.position,object.footprint)&&!evidence.continuityException)errors.push(`evidence ${evidence.id} marker lies outside its object footprint`);
        if(evidence.markerPosition!==undefined&&(!Number.isFinite(evidence.markerPosition?.x)||!Number.isFinite(evidence.markerPosition?.y)||evidence.markerPosition.x<0||evidence.markerPosition.x>100||evidence.markerPosition.y<0||evidence.markerPosition.y>100||Math.abs(evidence.markerPosition.x-evidence.position.x)>12||Math.abs(evidence.markerPosition.y-evidence.position.y)>12))errors.push(`evidence ${evidence.id} has an invalid nearby marker position`);
        for(const transition of evidence.onExamine||[]){
          const target=objects.get(transition.objectId);
          if(!target?.states?.[transition.toState])errors.push(`evidence ${evidence.id} transitions to unknown object state ${transition.objectId}:${transition.toState}`);
          const nextState=target?.states?.[transition.toState],initial=target?.states?.[target.initialState||'default'];
          const changesImage=nextState&&(nextState.visualChange||nextState.visible!==initial?.visible);
          if(changesImage&&!spatial.sceneVariants?.some(variant=>variant.when?.[target.id]===transition.toState))errors.push(`evidence ${evidence.id} changes ${target.id} visually without a matching scene image`);
          if(changesImage)for(const relatedView of spatial.views.filter(entry=>entry.visibleObjectIds?.includes(target.id)&&entry.image&&!entry.variants?.some(variant=>variant.when?.[target.id]===transition.toState)))errors.push(`view ${relatedView.id} lacks a state image for ${target.id}:${transition.toState}`);
        }
      }
    }
    return errors;
  }

  function validateDefinition(story) {
    const errors = [];
    if (!story || story.schemaVersion !== 1) errors.push('schemaVersion must be 1');
    if (!/^[a-z0-9-]+$/.test(story?.id || '')) errors.push('id must be a lowercase slug');
    if (!story?.title || !Array.isArray(story?.chapters) || story.chapters.length < 1) errors.push('title and chapters are required');
    const chapterIds = new Set();
    const evidenceIds = new Set();
    const dialogueIds = new Set();
    const puzzleIds = new Set();
    const characterIds = new Set();
    for (const [index, chapter] of (story?.chapters || []).entries()) {
      if (!chapter.id || chapterIds.has(chapter.id)) errors.push(`chapter ${index+1} has a missing or duplicate id`);
      chapterIds.add(chapter.id);
      if (!chapter.title || !chapter.scene || !chapter.intro || !Array.isArray(chapter.evidence) || !Array.isArray(chapter.characters) || !chapter.puzzle || !chapter.gate) errors.push(`chapter ${chapter.id} is missing required fields`);
      for (const evidence of chapter.evidence || []) {
        if (!evidence.id || evidenceIds.has(evidence.id)) errors.push(`evidence id ${evidence.id || '(missing)'} is missing or duplicated`);
        evidenceIds.add(evidence.id);
        if (!evidence.title || !evidence.detail || !Number.isFinite(evidence.position?.x) || !Number.isFinite(evidence.position?.y) || evidence.position.x<0 || evidence.position.x>100 || evidence.position.y<0 || evidence.position.y>100) errors.push(`evidence ${evidence.id} has invalid detail or scene coordinates`);
        const previewCrop=evidence.detailPreviewCrop;
        if(previewCrop&&(!evidence.detailImage||!['x','y','width','height'].every(key=>Number.isFinite(previewCrop[key]))||previewCrop.x<0||previewCrop.y<0||previewCrop.width<=0||previewCrop.height<=0||previewCrop.x+previewCrop.width>100||previewCrop.y+previewCrop.height>100))errors.push(`evidence ${evidence.id} has an invalid detail preview crop`);
        const document=evidence.document;
        if(document&&(!['ledger','map'].includes(document.kind)||!document.heading||!document.reference||!Array.isArray(document.lines)||!document.lines.length||!document.lines.every(line=>typeof line==='string'&&line.trim())||(document.route&&(!Array.isArray(document.route)||document.route.length<2||!document.route.every(point=>typeof point==='string'&&point.trim())))))errors.push(`evidence ${evidence.id} has an invalid readable document`);
      }
      for (const person of chapter.characters || []) {
        if (!person.id || !Array.isArray(person.questions)) errors.push(`character in ${chapter.id} has invalid questions`);
        if(person.id)characterIds.add(person.id);
        for (const question of person.questions || []) {
          const key = `${chapter.id}:${person.id}:${question.id}`;
          if (!question.id || dialogueIds.has(key)) errors.push(`dialogue id ${key} is missing or duplicated`);
          dialogueIds.add(key);
          if (![question.ask,question.reply,question.followUp,question.followReply].every(value=>typeof value==='string'&&value.trim())) errors.push(`dialogue ${key} is missing one of its four lines`);
        }
      }
      if (!chapter.puzzle.id || puzzleIds.has(chapter.puzzle.id)) errors.push(`puzzle id ${chapter.puzzle.id || '(missing)'} is missing or duplicated`);
      puzzleIds.add(chapter.puzzle.id);
      if (!['choice','sequence'].includes(chapter.puzzle.type)) errors.push(`puzzle ${chapter.puzzle.id} uses an unsupported type`);
      if (chapter.puzzle.type === 'choice' && (!(chapter.puzzle.options || []).some(option => option.id === chapter.puzzle.answer) || new Set((chapter.puzzle.options||[]).map(option=>option.id)).size!==(chapter.puzzle.options||[]).length)) errors.push(`puzzle ${chapter.puzzle.id} has an invalid choice set or answer`);
      if (chapter.puzzle.type === 'sequence' && (!Array.isArray(chapter.puzzle.items) || !Array.isArray(chapter.puzzle.answer) || chapter.puzzle.items.length !== chapter.puzzle.answer.length || new Set(chapter.puzzle.items.map(item=>item.id)).size!==chapter.puzzle.items.length || new Set(chapter.puzzle.answer).size!==chapter.puzzle.answer.length || !chapter.puzzle.answer.every(id => chapter.puzzle.items.some(item => item.id === id)))) errors.push(`puzzle ${chapter.puzzle.id} has an invalid sequence`);
      if(chapter.puzzle.presentation&&chapter.puzzle.type==='sequence'){
        const presentation=chapter.puzzle.presentation;
        if(!['route','timeline','interactive-route','garden-route','machinery-sequence','bookshelf'].includes(presentation.mode)||['topLabel','bottomLabel'].some(key=>presentation[key]!==undefined&&(typeof presentation[key]!=='string'||presentation[key].length>60)))errors.push(`puzzle ${chapter.puzzle.id} has invalid presentation settings`);
        if(presentation.mode==='bookshelf'){
          const candidates=presentation.candidates||[],ids=candidates.map(item=>item.id);
          if(!presentation.shelfImage||!presentation.slipText||!presentation.note||candidates.length<chapter.puzzle.items.length||new Set(ids).size!==ids.length||chapter.puzzle.answer.some(id=>!ids.includes(id))||candidates.some(item=>!item.label||!item.spineImage)||!Array.isArray(presentation.handles)||presentation.handles.length!==4||new Set(presentation.handles.map(item=>item.id)).size!==4)errors.push(`puzzle ${chapter.puzzle.id} needs a valid bookshelf, candidates, note, and four handles`);
          const sheet=presentation.spineSheetSize;
          if(sheet&&(!Number.isFinite(sheet.width)||!Number.isFinite(sheet.height)||sheet.width<=0||sheet.height<=0||candidates.some(item=>{const f=item.spineFrame;return !f||!['x','y','width','height'].every(key=>Number.isFinite(f[key]))||f.x<0||f.y<0||f.width<=0||f.height<=0||f.x+f.width>sheet.width||f.y+f.height>sheet.height})))errors.push(`puzzle ${chapter.puzzle.id} has invalid book artwork frames`);
        }
        if(presentation.mode==='machinery-sequence'){
          const ids=chapter.puzzle.items.map(item=>item.id),order=presentation.choiceOrder,positions=presentation.controlPositions,frames=presentation.controlFrames;
          if(!presentation.image?.src||!Number.isInteger(presentation.image.width)||!Number.isInteger(presentation.image.height)||!Array.isArray(presentation.evidenceRefs)||presentation.evidenceRefs.some(id=>!chapter.evidence.some(item=>item.id===id)))errors.push(`puzzle ${chapter.puzzle.id} needs a chamber image and linked evidence`);
          if(!Array.isArray(order)||order.length!==ids.length||new Set(order).size!==ids.length||order.some(id=>!ids.includes(id)))errors.push(`puzzle ${chapter.puzzle.id} needs a complete machinery choice order`);
          if(!positions||ids.some(id=>!Number.isFinite(positions[id]?.x)||!Number.isFinite(positions[id]?.y)||positions[id].x<0||positions[id].x>100||positions[id].y<0||positions[id].y>100))errors.push(`puzzle ${chapter.puzzle.id} needs machinery hotspot positions`);
          if(!frames||ids.some(id=>!validRect(frames[id])))errors.push(`puzzle ${chapter.puzzle.id} needs master-scene control crops`);
        }
        if(presentation.mode==='garden-route'){
          const image=presentation.image,ids=chapter.puzzle.items.map(item=>item.id),locations=presentation.locations,verse=presentation.verse;
          const inImage=point=>Number.isFinite(point?.x)&&Number.isFinite(point?.y)&&point.x>=0&&point.y>=0&&point.x<=(image?.width||0)&&point.y<=(image?.height||0);
          if(!image?.src||!Number.isInteger(image.width)||image.width<1||!Number.isInteger(image.height)||image.height<1)errors.push(`puzzle ${chapter.puzzle.id} needs a garden image`);
          if(!locations||Object.keys(locations).length!==ids.length||ids.some(id=>!inImage(locations[id])))errors.push(`puzzle ${chapter.puzzle.id} needs garden coordinates for every landmark`);
          if(!Array.isArray(verse)||verse.length!==ids.length||new Set(verse.map(entry=>entry.id)).size!==ids.length||verse.some(entry=>!ids.includes(entry.id)||typeof entry.text!=='string'||!entry.text.trim()||typeof entry.symbol!=='string'))errors.push(`puzzle ${chapter.puzzle.id} needs verse references for every landmark`);
          if(presentation.shortLabels&&(Object.keys(presentation.shortLabels).length!==ids.length||ids.some(id=>typeof presentation.shortLabels[id]!=='string'||!presentation.shortLabels[id].trim())))errors.push(`puzzle ${chapter.puzzle.id} needs short labels for every landmark`);
          if(!chapter.evidence.some(item=>item.id===presentation.verseEvidenceId)||!chapter.evidence.some(item=>item.id===presentation.mapEvidenceId))errors.push(`puzzle ${chapter.puzzle.id} needs linked verse and map evidence`);
        }
        if(presentation.mode==='interactive-route'){
          const image=presentation.image,ids=routeChoices(chapter.puzzle).map(item=>item.id),locations=presentation.locations,connections=presentation.connections;
          if(!image?.src||!Number.isInteger(image.width)||image.width<1||!Number.isInteger(image.height)||image.height<1||!chapter.evidence.some(item=>item.id===presentation.evidenceId))errors.push(`puzzle ${chapter.puzzle.id} needs an image and linked evidence`);
          const inImage=point=>Number.isFinite(point?.x)&&Number.isFinite(point?.y)&&point.x>=0&&point.y>=0&&point.x<=(image?.width||0)&&point.y<=(image?.height||0);
          if(new Set(ids).size!==ids.length||!Array.isArray(presentation.decoys||[])||ids.some(id=>!id||typeof id!=='string')||routeChoices(chapter.puzzle).some(item=>typeof item.label!=='string'||!item.label.trim()))errors.push(`puzzle ${chapter.puzzle.id} has invalid valve choices`);
          if(!locations||Object.keys(locations).length!==ids.length||ids.some(id=>!inImage(locations[id])))errors.push(`puzzle ${chapter.puzzle.id} needs coordinates for each location`);
          if(presentation.choiceOrder&&(!Array.isArray(presentation.choiceOrder)||presentation.choiceOrder.length!==ids.length||new Set(presentation.choiceOrder).size!==ids.length||presentation.choiceOrder.some(id=>!ids.includes(id))))errors.push(`puzzle ${chapter.puzzle.id} has invalid valve choice order`);
          if(presentation.network){
            const junctions=presentation.network.junctions||{},edges=presentation.network.edges,allIds=[...ids,...Object.keys(junctions)];
            if(new Set(allIds).size!==allIds.length||Object.values(junctions).some(point=>!inImage(point))||!Array.isArray(edges)||!edges.length||edges.some(edge=>!allIds.includes(edge.from)||!allIds.includes(edge.to)||edge.from===edge.to||typeof edge.d!=='string'||!/^[MmLlHhVv0-9.,\s-]+$/.test(edge.d)))errors.push(`puzzle ${chapter.puzzle.id} has invalid pipe network geometry`);
            else if(ids.some(id=>!findNetworkPath(edges,ids[0],id).length&&id!==ids[0]))errors.push(`puzzle ${chapter.puzzle.id} has disconnected valve routes`);
          }else{
            const expectedPairs=new Set(ids.flatMap((id,index)=>ids.slice(index+1).map(other=>[id,other].sort().join('|'))));
            const actualPairs=new Set((Array.isArray(connections)?connections:[]).map(edge=>[edge.from,edge.to].sort().join('|')));
            if(!Array.isArray(connections)||actualPairs.size!==expectedPairs.size||connections.length!==expectedPairs.size||[...actualPairs].some(pair=>!expectedPairs.has(pair))||connections.some(edge=>typeof edge.d!=='string'||!/^[MmLlHhVv0-9.,\s-]+$/.test(edge.d)))errors.push(`puzzle ${chapter.puzzle.id} needs a pipe path between every pair of locations`);
          }
        }
      }
    }
    const knownConditionKeys=new Set(['always','allEvidence','anyEvidence','allDialogue','anyDialogue','puzzleSolved','chapterSolved','all','any','not']);
    const validateCondition=(rule,where,depth=0)=>{
      if(rule===undefined)return;
      if(!rule||typeof rule!=='object'||Array.isArray(rule)||depth>12){errors.push(`${where} is not a valid condition object`);return;}
      const keys=Object.keys(rule);
      for(const key of keys)if(!knownConditionKeys.has(key))errors.push(`${where} uses unknown condition "${key}"`);
      if(rule.always!==undefined&&(rule.always!==true||keys.length!==1))errors.push(`${where}.always must stand alone and be true`);
      for(const key of ['allEvidence','anyEvidence'])if(rule[key]!==undefined){if(!Array.isArray(rule[key]))errors.push(`${where}.${key} must be an array`);else for(const id of rule[key])if(!evidenceIds.has(id))errors.push(`${where} references unknown evidence ${id}`);}
      for(const key of ['allDialogue','anyDialogue'])if(rule[key]!==undefined){if(!Array.isArray(rule[key]))errors.push(`${where}.${key} must be an array`);else for(const id of rule[key])if(!dialogueIds.has(id))errors.push(`${where} references unknown dialogue ${id}`);}
      if(rule.puzzleSolved!==undefined&&!puzzleIds.has(rule.puzzleSolved))errors.push(`${where} references unknown puzzle ${rule.puzzleSolved}`);
      if(rule.chapterSolved!==undefined&&(!Number.isInteger(rule.chapterSolved)||rule.chapterSolved<0||rule.chapterSolved>=(story?.chapters?.length||0)))errors.push(`${where}.chapterSolved references an invalid chapter`);
      for(const key of ['all','any'])if(rule[key]!==undefined){if(!Array.isArray(rule[key])||!rule[key].length)errors.push(`${where}.${key} must be a nonempty array`);else rule[key].forEach((child,index)=>validateCondition(child,`${where}.${key}[${index}]`,depth+1));}
      if(rule.not!==undefined)validateCondition(rule.not,`${where}.not`,depth+1);
    };
    for (const chapter of story?.chapters || []) {
      validateCondition(chapter.gate,`chapter ${chapter.id} gate`);
      const chapterDialogueIds=new Set(chapter.characters.flatMap(person=>person.questions.map(question=>`${chapter.id}:${person.id}:${question.id}`)));
      for(const id of chapter.gate?.allDialogue||[])if(!chapterDialogueIds.has(id))errors.push(`chapter ${chapter.id} gate references unknown or out-of-chapter dialogue ${id}`);
      for(const id of chapter.gate?.anyDialogue||[])if(!chapterDialogueIds.has(id))errors.push(`chapter ${chapter.id} gate references unknown or out-of-chapter dialogue ${id}`);
      for (const person of chapter.characters || []) {
        validateCondition(person.availableWhen,`character ${person.id} availability`);
        for (const q of person.questions) validateCondition(q.availableWhen,`dialogue ${chapter.id}:${person.id}:${q.id} availability`);
      }
      for (const hint of chapter.hints || []) if(typeof hint!=='string')validateCondition(hint.availableWhen,`chapter ${chapter.id} hint`);
    }
    if(story?.caseSubject){
      if(!story.caseSubject.id||!story.caseSubject.name||!story.caseSubject.description)errors.push('caseSubject needs an id, name, and description');
      else characterIds.add(story.caseSubject.id);
    }
    const portraits=story?.characterPortraits;
    if(portraits!==undefined){
      if(!portraits||typeof portraits!=='object'||Array.isArray(portraits))errors.push('characterPortraits must be a map of character IDs to image paths');
      else for(const [id,src] of Object.entries(portraits))if(!characterIds.has(id)||typeof src!=='string'||!src.trim())errors.push(`character portrait ${id} has an unknown character or invalid image path`);
    }
    errors.push(...validateSpatial(story));
    if (errors.length) throw new Error(`Invalid story JSON:\n• ${[...new Set(errors)].join('\n• ')}`);
    return story;
  }

  function evaluateCondition(rule,context={},depth=0) {
    if(!rule||depth>12||typeof rule!=='object')return false;
    const {hasEvidence=()=>false,hasDialogue=()=>false,hasPuzzle=()=>false,hasChapter=()=>false}=context;
    if(rule.always===true)return true;
    if(Array.isArray(rule.allEvidence)&&!rule.allEvidence.every(hasEvidence))return false;
    if(Array.isArray(rule.anyEvidence)&&!rule.anyEvidence.some(hasEvidence))return false;
    if(Array.isArray(rule.allDialogue)&&!rule.allDialogue.every(hasDialogue))return false;
    if(Array.isArray(rule.anyDialogue)&&!rule.anyDialogue.some(hasDialogue))return false;
    if(rule.puzzleSolved&&!hasPuzzle(rule.puzzleSolved))return false;
    if(rule.chapterSolved!==undefined&&!hasChapter(rule.chapterSolved))return false;
    if(Array.isArray(rule.all)&&!rule.all.every(item=>evaluateCondition(item,context,depth+1)))return false;
    if(Array.isArray(rule.any)&&!rule.any.some(item=>evaluateCondition(item,context,depth+1)))return false;
    if(rule.not&&!evaluateCondition(rule.not,context,depth+1))return false;
    return Object.keys(rule).length>0;
  }

  const freshState = () => ({schemaVersion:1,chapter:0,found:[],solved:[],completedDialogues:[],transcript:[],dialogue:null,puzzleDrafts:{},puzzleRouteSelections:{},objectStates:{},openingSeen:false,rescueLine:0,rescueDone:false,resolutionLine:0,resolutionDone:false,booksSeen:[],bookshelfSlots:[null,null,null,null],bookSlipReady:false,ending:null});

  class StoryRuntime {
    constructor({story,repository,mount,modal}) {
      this.story = validateDefinition(story); this.repository = repository; this.root = document.querySelector(mount); this.overlay = document.querySelector(modal); this.revision = 0; this.savedAt = null; this.storageAvailable = true; this.hintIndex = 0; this.zoom = {scale:1,dx:0,dy:0,pointer:null}; this.feedback = ''; this.sequenceSelected=null;this.sequenceFeedback='';this.sequenceDrag=null;this.modalStack=[];this.completionToken=0; this.visualDebug=Boolean(global.location?.search&&new URLSearchParams(global.location.search).has('visual-debug'));this.debugOverlay=this.visualDebug;
      this.voiceMuted=false;this.motionPaused=false;this.voiceSpeaking=false;this.spriteTimer=null;
      try {this.voiceMuted=global.localStorage?.getItem(`metrivastories_story${String(story.number).padStart(2,'0')}_voices`)==='muted';this.motionPaused=global.localStorage?.getItem(`metrivastories_story${String(story.number).padStart(2,'0')}_motion`)==='paused';} catch {}
      if (!this.root || !this.overlay) throw new Error('Story mount or modal container is missing.');
      this.allowedEvidence = new Set(story.chapters.flatMap(ch=>ch.evidence.map(e=>e.id)));
      this.allowedDialogue = new Set(story.chapters.flatMap(ch=>ch.characters.flatMap(p=>p.questions.map(q=>`${ch.id}:${p.id}:${q.id}`))));
      this.bindEvents();
    }
    async start() {
      let saved = await this.repository.load(this.story.id);
      if(!saved&&this.story.legacySaveKey){const legacy=this.readLegacySave();if(legacy)saved=await this.repository.save(this.story.id,legacy,0).then(meta=>({state:legacy,...meta}));}
      this.state = this.normalize(saved?.state);
      this.revision = saved?.revision || 0; this.savedAt = saved?.savedAt || null;
      this.goToUnlockedChapter(); this.render();
      if(!saved?.state&&this.story.openingIntroduction)this.showOpening();
      else if(this.isSolved(this.story.chapters.length-1)&&!this.state.rescueDone&&this.story.chapters.at(-1).rescueDialogue)this.showRescueDialogue();
      if (!this.storageAvailable) this.toast('Progress could not be loaded from this browser.');
      return this;
    }
    readLegacySave() {
      try {
        for(const key of [this.story.legacySaveKey,...(this.story.legacySaveKeys||[])]){
          const old=JSON.parse(global.localStorage.getItem(key)||'null');
          if(old)return this.convertLegacySave(old);
        }
        return null;
      }catch{return null;}
    }
    convertLegacySave(old) {
        const state=freshState();state.chapter=old.chapter||0;state.found=old.found||[];
        state.solved=(old.solved||[]).map(index=>this.story.chapters[index]?.puzzle.id).filter(Boolean);
        state.completedDialogues=(old.heard||[]).map(key=>{const [chapter,person,question]=key.split(':').map(Number);return `${this.story.chapters[chapter]?.id}:${this.story.chapters[chapter]?.characters[person]?.id}:q${question+1}`;});
        state.transcript=(old.transcript||[]).map(line=>({...line,chapter:Math.min(state.chapter,this.story.chapters.length-1)}));
        if(Array.isArray(old.bookOrder)){
          state.puzzleDrafts[this.story.chapters[0].puzzle.id]=old.bookOrder;
          state.bookshelfSlots=old.bookOrder;
        }
        state.booksSeen=old.bookSeen||[];state.bookSlipReady=Boolean(old.bookSlipReady);
        state.ending=old.ending||null;state.resolutionDone=Boolean(old.ending);
        return state;
    }
    normalize(raw) {
      const state = freshState();
      if (!raw || typeof raw !== 'object') return state;
      state.openingSeen=raw.openingSeen!==false;
      state.rescueDone=Boolean(raw.rescueDone||raw.ending);
      state.resolutionDone=Boolean(raw.resolutionDone||raw.ending);
      state.resolutionLine=Number.isInteger(raw.resolutionLine)?Math.max(0,Math.min((this.story.resolution?.dialogue?.length||1)-1,raw.resolutionLine)):0;
      const bookshelf=this.story.chapters.find(ch=>ch.puzzle.presentation?.mode==='bookshelf')?.puzzle;
      const candidateIds=bookshelf?.presentation.candidates.map(item=>item.id)||[];
      state.booksSeen=Array.isArray(raw.booksSeen)?[...new Set(raw.booksSeen.filter(id=>candidateIds.includes(id)))]:[];
      const slots=raw.bookshelfSlots;
      state.bookshelfSlots=Array.isArray(slots)&&slots.length===4&&new Set(slots.filter(Boolean)).size===slots.filter(Boolean).length&&slots.every(id=>id===null||candidateIds.includes(id))?[...slots]:[null,null,null,null];
      state.rescueLine=Number.isInteger(raw.rescueLine)?Math.max(0,Math.min(this.story.chapters.at(-1).rescueDialogue?.lines.length-1||0,raw.rescueLine)):0;
      state.found = [...new Set((Array.isArray(raw.found)?raw.found:[]).filter(id=>this.allowedEvidence.has(id)))];
      state.objectStates=normalizeObjectStates(this.story,raw.objectStates);
      const savedSolved=new Set((Array.isArray(raw.solved)?raw.solved:[]).filter(id=>this.story.chapters.some(ch=>ch.puzzle.id===id)));
      for(const chapter of this.story.chapters){if(!savedSolved.has(chapter.puzzle.id))break;state.solved.push(chapter.puzzle.id);}
      state.completedDialogues = [...new Set((Array.isArray(raw.completedDialogues)?raw.completedDialogues:[]).filter(id=>this.allowedDialogue.has(id)))];
      state.transcript = (Array.isArray(raw.transcript)?raw.transcript:[]).filter(line=>line&&typeof line.speaker==='string'&&typeof line.text==='string'&&Number.isInteger(line.chapter)).map(line=>({chapter:Math.max(0,Math.min(this.story.chapters.length-1,line.chapter)),speaker:line.speaker.slice(0,80),text:line.text.slice(0,2000)})).slice(-300);
      state.chapter = Number.isInteger(raw.chapter)?Math.max(0,Math.min(this.story.chapters.length-1,raw.chapter)):0;
      state.ending = state.solved.length===this.story.chapters.length&&this.story.chapters.at(-1).endings?.some(ending=>ending.id===raw.ending)?raw.ending:null;
      state.puzzleDrafts = {};
      state.puzzleRouteSelections = {};
      for(const chapter of this.story.chapters){
        const puzzle=chapter.puzzle;
        if(puzzle.type!=='sequence')continue;
        const validIds=new Set(puzzle.items.map(item=>item.id));
        const draft=raw.puzzleDrafts?.[puzzle.id];
        state.puzzleDrafts[puzzle.id]=Array.isArray(draft)&&draft.length===validIds.size&&new Set(draft).size===validIds.size&&draft.every(id=>validIds.has(id))?[...draft]:puzzle.items.map(item=>item.id);
        if(isVisualRoute(puzzle)||isMachinery(puzzle)){
          state.puzzleRouteSelections[puzzle.id]=normalizeRouteSelection(raw.puzzleRouteSelections?.[puzzle.id],routeChoices(puzzle).map(item=>item.id),puzzle.items.length);
        }
      }
      state.bookSlipReady=Boolean(raw.bookSlipReady&&bookshelf&&state.bookshelfSlots.join('|')===bookshelf.answer.join('|'));
      const d=raw.dialogue;
      if (d&&Number.isInteger(d.chapter)&&this.story.chapters[d.chapter]) {
        const person=this.story.chapters[d.chapter].characters.find(p=>p.id===d.characterId);
        const question=person?.questions.find(q=>q.id===d.questionId);
        if (person&&((d.phase==='menu'&&!d.questionId)||(d.phase==='exchange'&&question&&Number.isInteger(d.line)&&d.line>=0&&d.line<4))) {
          const line=d.line||0;
          const replySpeaker=person.historical?'Eleanor’s manuscript':person.name;
          const lines=question?[{speaker:'You',text:question.ask},{speaker:replySpeaker,text:question.reply},{speaker:'You',text:question.followUp},{speaker:replySpeaker,text:question.followReply}]:[];
          const last=state.transcript.at(-1);
          const recorded=d.recordedLine===line&&last?.chapter===d.chapter&&last?.speaker===lines[line]?.speaker&&last?.text===lines[line]?.text?line:null;
          state.dialogue={chapter:d.chapter,characterId:d.characterId,questionId:d.questionId||null,phase:d.phase,line,recordedLine:recorded};
        }
      }
      return state;
    }
    current() { return this.story.chapters[this.state.chapter]; }
    has(id) { return this.state.found.includes(id); }
    isSolved(chapter) { return this.state.solved.includes(this.story.chapters[chapter].puzzle.id); }
    completed(id) { return this.state.completedDialogues.includes(id); }
    dialogueKey(personId,questionId,chapterIndex=this.state.chapter) { return `${this.story.chapters[chapterIndex].id}:${personId}:${questionId}`; }
    condition(rule, depth=0) {
      return evaluateCondition(rule,{hasEvidence:id=>this.has(id),hasDialogue:id=>this.completed(id),hasPuzzle:id=>this.state.solved.includes(id),hasChapter:index=>this.isSolved(index)},depth);
    }
    chapterUnlocked(index) { return index<=this.unlockedChapter(); }
    unlockedChapter() { let index=0; while(index<this.story.chapters.length-1&&this.isSolved(index)) index++; return index; }
    goToUnlockedChapter() { this.state.chapter=Math.min(this.state.chapter,this.unlockedChapter()); }
    chapterGateMet(chapter=this.current()) { return this.condition(chapter.gate); }
    characterAvailable(person, chapter=this.current()) { return this.condition(person.availableWhen || {always:true}); }
    availableQuestions(person) { return person.questions.filter(q=>this.condition(q.availableWhen || {always:true})); }
    progress() { return Math.round((this.state.solved.length/this.story.chapters.length)*100); }
    objectVisible(chapter,evidence) { const object=chapter.spatial?.objects.find(entry=>entry.id===evidence.objectId);return !object||object.states[activeObjectState(object,this.state.objectStates)]?.visible!==false; }
    sceneSource(chapter) { return sceneImage(chapter,this.state.objectStates); }
    debugMarkup(chapter) {
      if(!this.debugOverlay||!chapter.spatial)return '';
      const objects=chapter.spatial.objects.map(object=>`<div class="s6-debug-object" style="left:${object.footprint.x}%;top:${object.footprint.y}%;width:${object.footprint.width}%;height:${object.footprint.height}%" title="${escapeHtml(object.id)}"><span>${escapeHtml(object.name||object.id)}</span></div>`).join('');
      const frames=chapter.spatial.views.map(view=>`<div class="s6-debug-frame" style="left:${view.frame.x}%;top:${view.frame.y}%;width:${view.frame.width}%;height:${view.frame.height}%" title="${escapeHtml(view.id)}"></div>`).join('');
      const regions=chapter.evidence.filter(e=>e.inspectionRegion).map(e=>`<div class="s6-debug-region" style="left:${e.inspectionRegion.x}%;top:${e.inspectionRegion.y}%;width:${e.inspectionRegion.width}%;height:${e.inspectionRegion.height}%" title="${escapeHtml(e.id)} inspection region"></div>`).join('');
      return `<div class="s6-debug-layer" aria-hidden="true">${frames}${regions}${objects}</div>`;
    }
    async save() {
      try {
        const result=await this.repository.save(this.story.id,this.state,this.revision);
        this.revision=result.revision; this.savedAt=result.savedAt; this.storageAvailable=true;
        global.dispatchEvent(new CustomEvent('metriva:progress',{detail:{storyId:this.story.id,revision:this.revision,state:clone(this.state)}}));
      } catch(error) { this.storageAvailable=false; this.lastError=error.message; }
    }
    toast(message) { this.lastError=message; this.render(); }
    bindEvents() {
      this.root.addEventListener('click',event=>this.onClick(event));
      this.root.addEventListener('change',event=>{if(event.target.id==='s6-import-file'&&event.target.files?.[0]){this.importSave(event.target.files[0]);event.target.value='';}});
      this.overlay.addEventListener('click',event=>this.onClick(event));
      const previewMachine=(event,active)=>{
        const control=event.target.closest?.('.s6-machine-control,.s6-machine-hotspot');
        const board=control?.closest('.s6-machine-puzzle');
        if(!board)return;
        if(!active&&control.contains(event.relatedTarget))return;
        for(const peer of board.querySelectorAll(`[data-s6="machine-select"][data-id="${control.dataset.id}"]`))peer.classList.toggle('is-preview',active);
      };
      this.overlay.addEventListener('pointerover',event=>previewMachine(event,true));
      this.overlay.addEventListener('pointerout',event=>previewMachine(event,false));
      this.overlay.addEventListener('focusin',event=>previewMachine(event,true));
      this.overlay.addEventListener('focusout',event=>previewMachine(event,false));
      this.overlay.addEventListener('wheel',event=>{if(event.target.closest('.s6-garden-svg')){event.preventDefault();this.changeGardenZoom(event.deltaY<0?.2:-.2)}else if(event.target.closest('.s6-zoom-view')){event.preventDefault();this.changeZoom(event.deltaY<0?.15:-.15)}},{passive:false});
      this.overlay.addEventListener('pointerdown',event=>{this.gardenPanStart(event);this.zoomStart(event)});
      this.overlay.addEventListener('pointermove',event=>{this.gardenPanMove(event);this.zoomMove(event)});
      this.overlay.addEventListener('pointerup',event=>{this.gardenPanEnd(event);this.zoomEnd(event)});
      this.overlay.addEventListener('pointercancel',event=>{this.gardenPanEnd(event);this.zoomEnd(event)});
      this.overlay.addEventListener('dragstart',event=>this.sequenceDragStart(event));
      this.overlay.addEventListener('dragover',event=>this.sequenceDragOver(event));
      this.overlay.addEventListener('drop',event=>this.sequenceDrop(event));
      this.overlay.addEventListener('dragend',()=>this.sequenceDragEnd());
      this.overlay.addEventListener('dragstart',event=>{const candidate=event.target.closest?.('.s6-library-candidate-pick'),slot=event.target.closest?.('.s6-library-slot.is-filled');if(!candidate&&!slot)return;this.bookDrag=candidate?{kind:'candidate',id:candidate.dataset.id}:{kind:'slot',index:Number(slot.dataset.index)};event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain','book');});
      this.overlay.addEventListener('dragover',event=>{if(this.bookDrag&&event.target.closest?.('.s6-library-slot')){event.preventDefault();event.dataTransfer.dropEffect='move';}});
      this.overlay.addEventListener('drop',event=>{const slot=event.target.closest?.('.s6-library-slot');if(!this.bookDrag||!slot)return;event.preventDefault();this.bookSelection=this.bookDrag;this.bookDrag=null;this.chooseBookSlot(Number(slot.dataset.index));});
      this.overlay.addEventListener('dragend',()=>{this.bookDrag=null;});
      document.addEventListener('keydown',event=>{
        if(this.overlay.classList.contains('is-hidden'))return;
        if(event.key==='Escape'){event.preventDefault();this.closeModal();return;}
        if((event.key==='Enter'||event.key===' ')&&document.activeElement?.matches?.('.s6-route-valve[data-s6="route-select"],.s6-garden-landmark[data-s6="garden-select"]')){event.preventDefault();const control=document.activeElement;if(control.dataset.s6==='garden-select')this.gardenSelect(control.dataset.id);else this.routeSelect(control.dataset.id);return;}
        if(event.key==='Tab'){
          const focusable=[...this.overlay.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),[tabindex]:not([tabindex="-1"])')].filter(node=>node.offsetParent!==null);
          if(!focusable.length){event.preventDefault();return;}
          const first=focusable[0],last=focusable.at(-1);
          if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
          else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
        }
      });
    }
    portrait(person,className='s6-person-portrait') {
      const sprite=this.story.characterSprites?.[person.id];
      const src=typeof sprite==='string'?sprite:sprite?.src;
      if(src&&([2,3].includes(this.story.number)||className==='s6-conversation-portrait')){
        const columns=Number(sprite?.columns)||2,rows=Number(sprite?.rows)||2;
        return `<span class="${className} s6-sprite-portrait" role="img" aria-label="Portrait of ${escapeHtml(person.name)}" data-sprite-id="${escapeHtml(person.id)}" style="background-image:url(&quot;${escapeHtml(src)}&quot;);background-size:${columns*100}% ${rows*100}%;background-position:0% 0%;aspect-ratio:${escapeHtml(sprite?.aspectRatio||'1')}"></span>`;
      }
      const portraitSrc=this.story.characterPortraits?.[person.id];
      return portraitSrc?`<img class="${className}" src="${escapeHtml(portraitSrc)}" alt="Portrait of ${escapeHtml(person.name)}" loading="lazy" decoding="async">`:`<span class="s6-person-fallback">${escapeHtml(person.initials||person.name.split(/\s+/).map(part=>part[0]).join('').slice(0,2))}</span>`;
    }
    render() {
      const ch=this.current(),gate=this.chapterGateMet(ch),foundInChapter=ch.evidence.filter(e=>this.has(e.id)).length,solved=this.isSolved(this.state.chapter),puzzle=ch.puzzle;
      const tabs=this.story.chapters.map((chapter,index)=>{const collected=chapter.evidence.filter(item=>this.has(item.id)).length,total=chapter.evidence.length;return `<button class="${index===this.state.chapter?'is-active':''}" data-s6="chapter" data-index="${index}" aria-label="Chapter ${index+1}, ${escapeHtml(chapter.location)}, ${collected} of ${total} evidence collected" ${index===this.state.chapter?'aria-current="page"':''} ${!this.chapterUnlocked(index)?'disabled title="Solve the current chapter puzzle to unlock this location"':''}><span>${String(index+1).padStart(2,'0')} · ${escapeHtml(chapter.location)}</span><span class="s6-tab-count">${collected}/${total}</span></button>`}).join('');
      const regions=ch.evidence.map(e=>this.objectVisible(ch,e)&&e.inspectionRegion?`<button class="s6-inspection-region" style="left:${e.inspectionRegion.x}%;top:${e.inspectionRegion.y}%;width:${e.inspectionRegion.width}%;height:${e.inspectionRegion.height}%" data-s6="inspect-region" data-id="${e.id}" tabindex="-1" aria-hidden="true"></button>`:'').join('');
      const hotspots=ch.evidence.map((e,index)=>this.objectVisible(ch,e)?`<button class="s6-hotspot ${this.has(e.id)?'is-found':''}" style="--x:${e.markerPosition?.x??e.position.x}%;--y:${e.markerPosition?.y??e.position.y}%" data-s6="inspect" data-id="${e.id}" aria-label="${this.has(e.id)?'Review':'Examine'} ${escapeHtml(e.title)}" title="${escapeHtml(e.title)}">${this.has(e.id)?'✓':index+1}</button>`:'').join('');
      const people=ch.characters.map(person=>{const available=this.characterAvailable(person,ch);const questions=this.availableQuestions(person).length;const unread=person.questions.filter(q=>this.condition(q.availableWhen||{always:true})&&!this.completed(this.dialogueKey(person.id,q.id))).length;return `<button class="s6-person" data-s6="character" data-id="${person.id}" ${!available?'disabled title="Examine more evidence to meet this person"':''}><span class="s6-person-mark">${this.portrait(person)}</span><span><strong>${escapeHtml(person.name)}</strong><small>${escapeHtml(person.role)} · ${available?`${questions} questions available`:'Not introduced yet'}</small></span><span class="s6-person-state">${available&&unread?`New · ${unread}`:available?'Speak →':'Locked'}</span></button>`}).join('');
      const evidence=ch.evidence.filter(item=>this.has(item.id));
      const subject=this.story.caseSubject,recovered=this.isSolved(this.story.chapters.length-1);
      const caseSubjectCard=subject?(recovered?`<button type="button" class="s6-case-subject is-rescued" data-s6="edda-conversation" aria-label="Speak with ${escapeHtml(subject.name)} after her rescue"><span class="s6-person-mark">${this.portrait(subject)}</span><span><strong>${escapeHtml(subject.name)}</strong><small>${escapeHtml(subject.recoveredDescription||'Found safe.')} · Speak with her</small></span><span class="s6-person-state">Speak →</span></button>`:`<div class="s6-case-subject"><span class="s6-person-mark">${this.portrait(subject)}</span><span><strong>${escapeHtml(subject.name)}</strong><small>${escapeHtml(subject.description)}</small></span><span class="s6-person-state">Missing</span></div>`):'';
      const status=solved?'Chapter solved. Your progress is saved.':gate?'Evidence and conversations complete. Solve the chapter puzzle to continue.':`${foundInChapter} of ${ch.evidence.length} clues examined; talk to the people here to complete the lead.`;
      this.root.innerHTML=`<header class="s6-heading"><div><span class="s6-eyebrow">Story ${String(this.story.number).padStart(2,'0')} · ${escapeHtml(this.story.genre)} · ${this.story.duration}</span><h1>${escapeHtml(this.story.title)}</h1><p>${escapeHtml(this.story.tagline)}</p></div><div class="s6-progress"><div class="s6-progress-label"><span>Case progress</span><span>${this.progress()}%</span></div><div class="s6-progress-track" role="progressbar" aria-valuenow="${this.progress()}" aria-valuemin="0" aria-valuemax="100"><span style="width:${this.progress()}%"></span></div></div></header>
      <nav class="s6-tabs" aria-label="Unlocked locations">${tabs}</nav>
      <div class="s6-game"><section class="s6-scene-card"><header class="s6-scene-head"><span class="s6-eyebrow">Chapter ${String(this.state.chapter+1).padStart(2,'0')} of ${String(this.story.chapters.length).padStart(2,'0')}</span><h2>${escapeHtml(ch.title)}</h2><p>${escapeHtml(ch.subtitle)}</p></header><div class="s6-scene" style="aspect-ratio:${ch.spatial?.master.width||1672}/${ch.spatial?.master.height||941}"><img src="${escapeHtml(this.sceneSource(ch))}" alt="Scene: ${escapeHtml(ch.location)}">${regions}${this.debugMarkup(ch)}${hotspots}</div><div class="s6-scene-foot"><span>${foundInChapter} of ${ch.evidence.length} evidence collected</span><span class="s6-foot-help">Select a numbered marker or a clue below${this.visualDebug?' · Developer geometry preview':''}</span></div>${this.visualDebug?`<button class="s6-quiet s6-debug-toggle" data-s6="debug-toggle">${this.debugOverlay?'Hide':'Show'} scene geometry</button>`:''}<div class="s6-object-list">${ch.evidence.map((e,i)=>`<button class="${this.has(e.id)?'is-found':''}" data-s6="inspect" data-id="${e.id}">${i+1}. ${escapeHtml(e.title)} ${this.has(e.id)?'✓':''}</button>`).join('')}</div></section>
      <aside class="s6-panel"><section class="s6-panel-main"><h2>Investigation</h2><p class="s6-objective">${escapeHtml(ch.intro)}</p><div class="s6-completion ${solved?'is-done':''}">${solved?'✓ Chapter complete':gate?'✓ Investigation gate open':escapeHtml(status)}</div><div class="s6-actions"><button class="s6-btn" data-s6="puzzle" ${!gate||solved?'disabled':''}>${escapeHtml(puzzle.title)} →</button>${solved&&this.state.chapter<this.story.chapters.length-1?'<button class="s6-btn" data-s6="continue">Continue to next chapter →</button>':''}${solved&&this.state.chapter===this.story.chapters.length-1&&!this.state.ending?(ch.rescueDialogue&&!this.state.rescueDone?'<button class="s6-btn" data-s6="rescue-dialogue">Continue Edda’s conversation →</button>':'<button class="s6-btn" data-s6="ending">Choose the next step →</button>'):''}${this.state.ending?'<button class="s6-quiet" data-s6="ending-review">Review the resolution →</button>':''}<button class="s6-quiet" data-s6="hint">💡 Progressive hint</button></div>${this.state.ending?`<div class="s6-note"><strong>Case resolved.</strong> ${escapeHtml(this.story.chapters.at(-1).endings.find(item=>item.id===this.state.ending)?.label||'')}</div>`:''}${this.lastError?`<p class="s6-feedback" role="status">${escapeHtml(this.lastError)}</p>`:''}</section><section><hr><h3>People in this case</h3><div class="s6-people">${people}${caseSubjectCard}</div><p class="s6-foot-help">Ask an available person about a clue, then follow up. Their answers are added to your conversation log.</p></section></aside></div>
      <section class="s6-notebook"><div class="s6-notebook-head"><h2>Case notebook</h2><span class="s6-eyebrow">Chapter ${String(this.state.chapter+1).padStart(2,'0')} · ${foundInChapter} of ${ch.evidence.length} evidence collected</span></div>${evidence.length?`<div class="s6-evidence-grid">${evidence.map(item=>`<button class="s6-evidence-card" data-s6="inspect" data-id="${item.id}"><span class="s6-evidence-thumb-frame">${evidenceImageMarkup(ch,item,this.state.objectStates,'s6-evidence-thumb')}</span><span class="s6-evidence-copy"><small class="s6-evidence-index">Evidence ${String(ch.evidence.findIndex(entry=>entry.id===item.id)+1).padStart(2,'0')}</small><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.note||'Evidence collected · Examine again')}</small></span></button>`).join('')}</div>`:'<p class="s6-foot-help">Your notebook is empty. Examine a marked object in the scene to begin.</p>'}<div class="s6-tools"><p>${this.storageAvailable?'Progress saved in this browser.':'Progress could not be saved. Export a copy before closing this page.'}${this.savedAt?` Last saved ${new Date(this.savedAt).toLocaleString()}.`:''}</p><button class="s6-quiet" data-s6="transcript">Conversation log</button><button class="s6-quiet" data-s6="export">Export save</button><button class="s6-quiet" data-s6="import">Import save</button><button class="s6-quiet s6-restart" data-s6="restart">Restart this story</button><input type="file" id="s6-import-file" accept="application/json,.json" class="s6-hidden"></div></section>`;
      if(solved&&isVisualRoute(puzzle)){
        const review=this.root.querySelector('[data-s6="puzzle"]');
        if(review){review.disabled=false;review.textContent='Review the route →';}
      }
    }
    showModal(title,content,actions='',options={}) {
      const pendingVoice=this.pendingVoice;this.pendingVoice=null;
      this.stopVoice();
      this.stopCharacterAnimation();
      if(this.overlay.classList.contains('is-hidden'))this.lastFocus=document.activeElement;
      this.overlay.classList.remove('is-hidden');
      this.root.inert=true;document.querySelector('.story6-top')?.setAttribute('inert','');document.querySelector('.story6-footer')?.setAttribute('inert','');
      const closeLabel=options.stack?'Close and return to the previous view':'Close this window';
      const closeButton=`<button type="button" class="s6-close" data-s6="close" aria-label="${closeLabel}" title="${closeLabel}"><span aria-hidden="true">×</span></button>`;
      const header=`<header class="s6-dialog-top"><span>Metriva · ${escapeHtml(this.story.title)}</span>${options.clueScroll?'':closeButton}</header>`;
      const body=`${header}${content}${actions?`<footer class="s6-dialog-actions">${actions}</footer>`:''}`;
      const markup=options.clueScroll?`<section class="s6-dialog s6-clue-dialog" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><div class="s6-clue-scroll">${body}</div>${closeButton}</section>`:`<section class="s6-dialog" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">${body}</section>`;
      const parent=options.stack?this.overlay.lastElementChild:null;
      if(parent){
        this.modalStack.push({dialog:parent,opener:document.activeElement});
        parent.hidden=true;parent.inert=true;parent.setAttribute('aria-hidden','true');parent.setAttribute('aria-modal','false');
        this.overlay.insertAdjacentHTML('beforeend',markup);
      }else if(options.preserveStack&&this.modalStack.length){this.overlay.lastElementChild?.remove();this.overlay.insertAdjacentHTML('beforeend',markup);}
      else{if(!options.preserveStack)this.modalStack=[];this.overlay.innerHTML=markup;}
      this.overlay.lastElementChild?.querySelector('.s6-close')?.focus();
      this.startCharacterAnimation();
      if(this.story.autoVoice&&pendingVoice&&!this.voiceMuted){const button=this.overlay.lastElementChild?.querySelector('[data-s6="play-voice"]');if(button)global.setTimeout(()=>{if(button.isConnected&&!this.voiceMuted&&!this.voiceAudio&&this.currentVoice===pendingVoice)this.playVoice();},250);}
    }
    closeModal() {
      this.stopVoice();
      this.stopCharacterAnimation();
      if(this.modalStack.length){
        this.overlay.lastElementChild?.remove();
        const {dialog,opener}=this.modalStack.pop();dialog.hidden=false;dialog.inert=false;dialog.removeAttribute('aria-hidden');dialog.setAttribute('aria-modal','true');
        if(opener?.isConnected)opener.focus();else dialog.querySelector('button:not(:disabled)')?.focus();
        this.startCharacterAnimation();
        return;
      }
      this.completionToken++;this.routeConfirming=null;this.overlay.classList.add('is-hidden');this.overlay.innerHTML='';this.root.inert=false;document.querySelector('.story6-top')?.removeAttribute('inert');document.querySelector('.story6-footer')?.removeAttribute('inert');if(this.lastFocus?.isConnected)this.lastFocus.focus();else this.root.querySelector('button:not(:disabled)')?.focus();
    }
    findEvidence(id) { return this.story.chapters.flatMap((chapter,index)=>chapter.evidence.map(item=>({...item,chapter:index}))).find(item=>item.id===id); }
    inspect(id,stack=false,fromScene=false) {
      const item=this.findEvidence(id); if(!item||item.chapter!==this.state.chapter)return;
      if(!this.has(id)){this.state.found.push(id);this.state.objectStates=applyObjectTransitions(this.story,this.state.objectStates,item.onExamine);this.save();this.render();}
      if(fromScene&&item.conversationOnInspect){this.openCharacter(item.conversationOnInspect);return;}
      const chapter=this.story.chapters[item.chapter];
      const number=chapter.evidence.findIndex(entry=>entry.id===item.id)+1;
      this.showModal(item.title,`<span class="s6-eyebrow">Chapter ${String(item.chapter+1).padStart(2,'0')} · Evidence ${String(number).padStart(2,'0')} of ${String(chapter.evidence.length).padStart(2,'0')}</span><h2>${escapeHtml(item.title)}</h2>${evidenceImageMarkup(chapter,item,this.state.objectStates,item.document?'s6-evidence-preview has-document':'s6-evidence-preview')}${readableDetailMarkup(item)}${item.document?`<details class="s6-readable-transcript"><summary>Read transcription</summary>${documentMarkup(item.document)}</details>`:''}<div class="s6-note">${escapeHtml(item.detail)}</div><p class="s6-foot-help">${escapeHtml(item.note||'Added to your notebook.')}</p>`,`<button class="s6-btn" data-s6="zoom" data-id="${item.id}">⊕ Zoom clue image →</button>${item.conversationOnInspect?`<button class="s6-quiet" data-s6="character" data-id="${escapeHtml(item.conversationOnInspect)}">Speak with ${escapeHtml(chapter.characters.find(person=>person.id===item.conversationOnInspect)?.name||'this person')} →</button>`:''}${item.document?`<button class="s6-quiet" data-s6="read-document" data-id="${item.id}">Enlarge written text →</button>`:''}<button class="s6-quiet" data-s6="close">${stack?'Back to puzzle':'Return to investigation'}</button>`,{stack,clueScroll:true});
      this.zoom={scale:1,dx:0,dy:0,item,scene:this.sceneSource(chapter)};
    }
    readDocument(id) {
      const item=this.findEvidence(id);if(!item?.document)return;
      this.documentScale=1.3;
      const chapter=this.story.chapters[item.chapter],number=chapter.evidence.findIndex(entry=>entry.id===id)+1;
      this.showModal(item.document.heading,`<span class="s6-eyebrow">Chapter ${String(item.chapter+1).padStart(2,'0')} · Evidence ${String(number).padStart(2,'0')} · Readable document</span>${documentMarkup(item.document,this.documentScale)}<p class="s6-foot-help">The writing is transcribed from the ${escapeHtml(item.document.kind==='map'?'map and the note beneath it':'ledger')} so it can be read clearly. The scene view shows where it was found.</p>`,`<button class="s6-quiet" data-s6="doc-out" aria-label="Make document smaller">−</button><output class="s6-doc-level">130%</output><button class="s6-quiet" data-s6="doc-in" aria-label="Make document larger">+</button><button class="s6-quiet" data-s6="doc-reset">Reset size</button><button class="s6-btn" data-s6="evidence-back" data-id="${id}">Back to evidence →</button>`,{stack:true,clueScroll:true});
    }
    changeDocumentScale(delta) {
      this.documentScale=Math.max(1,Math.min(2.4,Math.round((this.documentScale+delta)*100)/100));
      this.overlay.querySelector('.s6-document')?.style.setProperty('--s6-doc-scale',this.documentScale);
      const output=this.overlay.querySelector('.s6-doc-level');if(output)output.textContent=`${Math.round(this.documentScale*100)}%`;
    }
    zoomEvidence(id) {
      const item=this.findEvidence(id); if(!item)return;
      const ch=this.story.chapters[item.chapter],art=evidenceImagePresentation(ch,item,this.state.objectStates);
      this.zoom={scale:1,baseScale:1,dx:0,dy:0,item,art,pointer:null};
      this.renderZoom(true);
    }
    renderZoom(stack=false) {
      const z=this.zoom;
      const chapter=this.story.chapters[z.item.chapter],number=chapter.evidence.findIndex(entry=>entry.id===z.item.id)+1;
      this.showModal(z.item.title,`<div class="s6-zoom-tools"><span class="s6-eyebrow">Evidence ${String(number).padStart(2,'0')} · ${escapeHtml(chapter.location)} · clue detail</span><span><button class="s6-quiet" data-s6="zoom-out" aria-label="Zoom out">−</button> <output>${Math.round(z.scale*100)}%</output> <button class="s6-quiet" data-s6="zoom-in" aria-label="Zoom in">+</button> <button class="s6-quiet" data-s6="zoom-reset">Reset</button></span></div><div class="s6-zoom-composition${z.item.readableDetail?' has-readable-detail':''}"><div class="s6-zoom-view" style="aspect-ratio:${z.art.ratio}" aria-label="Zoomable image of ${escapeHtml(z.item.title)}"><div class="s6-zoom-art" role="img" aria-label="${escapeHtml(z.item.title)}" style="background-image:url(&quot;${escapeHtml(z.art.src)}&quot;);background-size:${z.art.size};background-position:${z.art.position};transform:translate(${z.dx}px,${z.dy}px) scale(${z.scale})"></div></div>${readableDetailMarkup(z.item)}</div><p class="s6-foot-help">Scroll to zoom · Drag to explore · Reset to show the whole clue</p>`,`<button class="s6-quiet" data-s6="evidence-back" data-id="${z.item.id}">Back to evidence</button>`,{stack,preserveStack:!stack,clueScroll:true});
    }
    changeZoom(delta) { this.zoom.scale=Math.min(4,Math.max(1,Math.round((this.zoom.scale+delta)*100)/100)); this.renderZoom(); }
    resetZoom() { this.zoom.scale=1;this.zoom.dx=0;this.zoom.dy=0;this.renderZoom(); }
    zoomStart(event) { const view=event.target.closest('.s6-zoom-view'); if(!view||this.zoom.scale<=1)return;this.zoom.pointer={id:event.pointerId,x:event.clientX,y:event.clientY,dx:this.zoom.dx,dy:this.zoom.dy};view.setPointerCapture(event.pointerId);view.classList.add('is-dragging'); }
    zoomMove(event) { if(!this.zoom.pointer||event.pointerId!==this.zoom.pointer.id)return;this.zoom.dx=this.zoom.pointer.dx+(event.clientX-this.zoom.pointer.x);this.zoom.dy=this.zoom.pointer.dy+(event.clientY-this.zoom.pointer.y);const art=this.overlay.querySelector('.s6-zoom-art');if(art)art.style.transform=`translate(${this.zoom.dx}px,${this.zoom.dy}px) scale(${this.zoom.scale})`; }
    zoomEnd(event) { if(this.zoom.pointer&&event.pointerId===this.zoom.pointer.id){this.zoom.pointer=null;this.overlay.querySelector('.s6-zoom-view')?.classList.remove('is-dragging');} }
    openCharacter(id) {
      const chapter=this.current(),person=chapter.characters.find(entry=>entry.id===id); if(!person||!this.characterAvailable(person))return;
      this.state.dialogue={chapter:this.state.chapter,characterId:id,questionId:null,phase:'menu',line:0};this.save();this.renderDialogue();
    }
    conversationMarkup(person,content,speaker=person.name,actions='') {
      const animated=Boolean(this.story.characterSprites?.[person.id]?.frames);
      if([2,3,6].includes(this.story.number)){
        const scene=this.sceneSource(this.current());
        const backdrop=this.current().conversationBackdrop||{};
        const motion=animated?`<button type="button" class="s6-quiet" data-s6="toggle-motion" aria-pressed="${!this.motionPaused}">${this.motionPaused?'Resume motion':'Pause motion'}</button>`:'';
        const status='<span class="s6-voice-status" role="status"></span>';
        return `<div class="s6-conversation s6-stage-conversation s6-story${String(this.story.number).padStart(2,'0')}-conversation" style="background-image:url(&quot;${escapeHtml(scene)}&quot;);--s6-conversation-bg-size:${escapeHtml(backdrop.size||'cover')};--s6-conversation-bg-position:${escapeHtml(backdrop.position||'center')}"><div class="s6-conversation-art" data-actor-speaking="${speaker!=='You'}">${this.portrait(person,'s6-conversation-portrait')}</div><div class="s6-conversation-body">${content}${actions||motion?`<footer class="s6-dialog-actions">${actions}${motion}${status}</footer>`:''}</div></div>`;
      }
      return `<div class="s6-conversation"><div class="s6-conversation-art" data-actor-speaking="${speaker!=='You'}">${this.portrait(person,'s6-conversation-portrait')}${animated?`<button type="button" class="s6-quiet s6-motion-toggle" data-s6="toggle-motion" aria-pressed="${!this.motionPaused}">${this.motionPaused?'Resume motion':'Pause motion'}</button>`:''}</div><div class="s6-conversation-body">${content}</div></div>`;
    }
    showCharacterConversation(title,person,content,actions,speaker=person.name) {
      const staged=[2,3,6].includes(this.story.number);
      this.showModal(title,this.conversationMarkup(person,content,speaker,staged?actions:''),staged?'':actions);
    }
    voiceControl(speaker,spokenText) {
      const src=this.story.voiceMap?.[JSON.stringify([speaker,spokenText])];
      this.currentVoice=src||null;this.pendingVoice=src||null;
      if(!src)return '';
      return `<button type="button" class="s6-quiet" data-s6="play-voice">▶ Play voice</button><button type="button" class="s6-quiet" data-s6="toggle-voices" aria-pressed="${!this.voiceMuted}">${this.voiceMuted?'Enable voices':'Mute voices'}</button>`;
    }
    stopVoice() {this.voiceSpeaking=false;if(this.voiceAudio){this.voiceAudio.pause();this.voiceAudio.removeAttribute('src');this.voiceAudio=null;}}
    playVoice() {
      if(!this.currentVoice)return;
      this.stopVoice();this.voiceMuted=false;
      try {global.localStorage?.setItem(`metrivastories_story${String(this.story.number).padStart(2,'0')}_voices`,'enabled');} catch {}
      const mute=this.overlay.querySelector('[data-s6="toggle-voices"]');if(mute){mute.textContent='Mute voices';mute.setAttribute('aria-pressed','true');}
      const player=new Audio(this.currentVoice);this.voiceAudio=player;
      player.onplaying=()=>{if(this.voiceAudio===player){this.voiceSpeaking=true;const status=this.overlay.querySelector('.s6-voice-status');if(status)status.textContent=`${this.overlay.querySelector('.s6-speaker')?.textContent||this.overlay.querySelector('.s6-conversation-body h2')?.textContent||'Voice'} is speaking…`;}};
      player.onended=()=>{if(this.voiceAudio===player){this.voiceSpeaking=false;const status=this.overlay.querySelector('.s6-voice-status');if(status)status.textContent='Voice finished.';}};
      player.onerror=()=>{if(this.voiceAudio===player){this.voiceSpeaking=false;const status=this.overlay.querySelector('.s6-voice-status');if(status)status.textContent='Voice unavailable. You can continue reading.';}};
      player.play().catch(()=>{if(this.voiceAudio!==player)return;this.voiceSpeaking=false;const status=this.overlay.querySelector('.s6-voice-status');if(status)status.textContent='Select Play voice to listen, or continue reading.';});
    }
    toggleVoices() {
      this.voiceMuted=!this.voiceMuted;
      if(this.voiceMuted)this.stopVoice();else if(this.currentVoice)this.playVoice();
      try {global.localStorage?.setItem(`metrivastories_story${String(this.story.number).padStart(2,'0')}_voices`,this.voiceMuted?'muted':'enabled');} catch {}
      const button=this.overlay.querySelector('[data-s6="toggle-voices"]');if(button){button.textContent=this.voiceMuted?'Enable voices':'Mute voices';button.setAttribute('aria-pressed',String(!this.voiceMuted));}
    }
    stopCharacterAnimation() {if(this.spriteTimer){global.clearInterval(this.spriteTimer);this.spriteTimer=null;}}
    startCharacterAnimation() {
      const actor=this.overlay.lastElementChild?.querySelector('.s6-conversation-portrait[data-sprite-id]');
      if(!actor?.dataset?.spriteId)return;
      const sprite=this.story.characterSprites?.[actor.dataset.spriteId];
      if(!sprite||typeof sprite==='string'||!sprite.frames)return;
      const columns=Number(sprite.columns)||2,rows=Number(sprite.rows)||2,frames=sprite.frames;
      const setFrame=name=>{
        const frame=frames[name]??frames.idle??0;
        if(typeof frame==='string'){
          actor.style.backgroundImage=`url("${frame.replaceAll('"','%22')}")`;
          actor.style.backgroundSize='contain';
          actor.style.backgroundPosition='center bottom';
        }else{
          const index=Number(frame);
          actor.style.backgroundPosition=`${(index%columns)*100/(columns-1||1)}% ${Math.floor(index/columns)*100/(rows-1||1)}%`;
        }
      };
      setFrame('idle');
      const reduced=global.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      actor.closest('.s6-conversation-art')?.classList.toggle('is-motion-paused',Boolean(this.motionPaused||reduced));
      if(this.motionPaused||reduced)return;
      const start=Date.now(),speaks=actor.closest('.s6-conversation-art')?.dataset.actorSpeaking==='true';
      const body=actor.closest('.s6-conversation')?.querySelector('.s6-conversation-body');
      const spokenText=body?.querySelector('.s6-dialogue-text')?.textContent||body?.querySelector('p:not(.s6-stage-direction)')?.textContent||'';
      const speakFor=Math.min(6500,Math.max(1800,spokenText.length*48));
      this.spriteTimer=global.setInterval(()=>{
        if(!actor.isConnected){this.stopCharacterAnimation();return;}
        const elapsed=Date.now()-start;
        setFrame(characterFrame(speaks,this.voiceSpeaking,elapsed,speakFor));
      },90);
    }
    toggleMotion() {
      this.motionPaused=!this.motionPaused;
      try {global.localStorage?.setItem(`metrivastories_story${String(this.story.number).padStart(2,'0')}_motion`,this.motionPaused?'paused':'enabled');} catch {}
      const button=this.overlay.querySelector('[data-s6="toggle-motion"]');if(button){button.textContent=this.motionPaused?'Resume motion':'Pause motion';button.setAttribute('aria-pressed',String(!this.motionPaused));}
      this.stopCharacterAnimation();this.startCharacterAnimation();
    }
    renderDialogue() {
      const d=this.state.dialogue;if(!d)return;
      const chapter=this.story.chapters[d.chapter],person=chapter.characters.find(item=>item.id===d.characterId);if(!person)return;
      if(d.phase==='exchange'){
        const q=person.questions.find(item=>item.id===d.questionId);if(!q)return;
        const replySpeaker=person.historical?'Eleanor’s manuscript':person.name;
        const lines=[{speaker:'You',text:q.ask},{speaker:replySpeaker,text:q.reply,direction:person.direction||'A thoughtful pause.'},{speaker:'You',text:q.followUp},{speaker:replySpeaker,text:q.followReply,direction:person.direction||'They answer gently.'}];
        const line=lines[d.line];
        if(d.recordedLine!==d.line){this.state.transcript.push({chapter:d.chapter,speaker:line.speaker,text:line.text});this.state.transcript=this.state.transcript.slice(-300);d.recordedLine=d.line;this.save();}
        const controls=d.line<3?`<button class="s6-btn" data-s6="dialogue-next">${d.line===0?'Hear the reply →':'Continue →'}</button>`:`<button class="s6-btn" data-s6="dialogue-finish">Finish this conversation →</button>`;
        this.showCharacterConversation(`${person.name} · conversation`,person,`<span class="s6-eyebrow">${escapeHtml(chapter.location)} · conversation</span><p class="s6-stage-direction">${line.speaker==='You'?'You ask the question.':escapeHtml(line.direction||'')}</p><span class="s6-speaker">${escapeHtml(line.speaker)}</span><p class="s6-dialogue-text">${escapeHtml(line.text)}</p>`,`${controls}${this.voiceControl(line.speaker,line.text)}<button class="s6-quiet" data-s6="transcript">Conversation log</button><button class="s6-quiet" data-s6="close">Return to investigation</button>`,line.speaker);
        return;
      }
      const questions=person.questions.map(q=>{const available=this.condition(q.availableWhen||{always:true});const done=this.completed(this.dialogueKey(person.id,q.id,d.chapter));return `<button class="s6-question" data-s6="ask" data-id="${q.id}" ${!available?'disabled title="Examine related evidence to unlock this question"':''}>${escapeHtml(q.ask)}${done?'<small>Discussed · ask again</small>':!available?'<small>Locked · investigate related evidence</small>':''}</button>`}).join('');
      this.showCharacterConversation(`Speak with ${person.name}`,person,`<span class="s6-eyebrow">${escapeHtml(chapter.location)} · ${escapeHtml(person.role)}</span><h2>${escapeHtml(person.name)}</h2><p class="s6-stage-direction">${escapeHtml(person.bio)}</p><p>${escapeHtml(person.intro||'Ask what you would like to know. Their answers may help connect the evidence.')}</p><div class="s6-choice-list">${questions}</div>`,`${this.voiceControl(person.historical?'Eleanor’s manuscript':person.name,person.intro)}<button class="s6-quiet" data-s6="transcript">Conversation log</button><button class="s6-quiet" data-s6="close">Return to investigation</button>`);
    }
    nextDialogue() { const d=this.state.dialogue;if(!d||d.phase!=='exchange')return;d.line=Math.min(3,d.line+1);d.recordedLine=null;this.save();this.renderDialogue(); }
    finishDialogue() { const d=this.state.dialogue;if(!d||d.phase!=='exchange')return;this.state.completedDialogues.push(this.dialogueKey(d.characterId,d.questionId,d.chapter));this.state.completedDialogues=[...new Set(this.state.completedDialogues)];this.state.dialogue={chapter:d.chapter,characterId:d.characterId,questionId:null,phase:'menu',line:0};this.save();this.render();this.renderDialogue(); }
    showHint(index=null) {
      const chapter=this.current(),hints=chapter.hints||[{text:'Examine the scene and talk with the people here.'}];
      let available=0;for(let i=1;i<hints.length;i++){const entry=hints[i];const rule=typeof entry==='string'?(i===1?{anyEvidence:chapter.evidence.map(item=>item.id)}:chapter.gate):entry.availableWhen;if(this.condition(rule))available=i;else break;}
      if(index!==null)this.hintIndex=Math.min(available,Math.max(0,index));else this.hintIndex=Math.min(available,this.hintIndex);
      const steps=hints.map((hint,i)=>`<button class="${i===this.hintIndex?'is-current':''}" data-s6="hint-step" data-index="${i}" ${i>available?'disabled title="Continue investigating to unlock this hint"':''} aria-label="Hint ${i+1}${i>available?' locked':''}">${i>available?'🔒':i+1}</button>`).join('');
      const next=this.hintIndex<available?'<button class="s6-btn" data-s6="hint-next">Clearer hint →</button>':'';
      const text=typeof hints[this.hintIndex]==='string'?hints[this.hintIndex]:hints[this.hintIndex].text;
      const current=this.overlay.lastElementChild,refresh=Boolean(current?.querySelector('.s6-hint-steps')),fromPuzzle=Boolean(current?.querySelector('.s6-deduction,.s6-machine-puzzle,.s6-route-puzzle,.s6-garden-puzzle,.s6-library-puzzle,.s6-sequence'));
      this.showModal('A gentle hint',`<span class="s6-eyebrow">Chapter ${String(this.state.chapter+1).padStart(2,'0')} · progressive hints</span><h2>A gentle nudge</h2><div class="s6-hint-steps">${steps}</div><p>${escapeHtml(text)}</p>${available<hints.length-1?'<p class="s6-foot-help">Clearer hints unlock as you examine evidence and speak with the characters.</p>':''}`,`<button class="s6-quiet" data-s6="hint-prev" ${this.hintIndex===0?'disabled':''}>← Previous</button>${next}<button class="s6-quiet" data-s6="close">${fromPuzzle||this.modalStack.length?'Return to puzzle':'Return to investigation'}</button>`,{stack:fromPuzzle,preserveStack:refresh});
    }
    showPuzzle() {
      const ch=this.current(),p=ch.puzzle;
      if(!this.chapterGateMet(ch)||(this.isSolved(this.state.chapter)&&!isVisualRoute(p)&&!isMachinery(p)))return;
      if(p.presentation?.mode==='bookshelf'){this.showBookshelfPuzzle(ch,p);return;}
      if(isInteractiveRoute(p)){this.showRoutePuzzle(ch,p);return;}
      if(isGardenRoute(p)){this.showGardenPuzzle(ch,p);return;}
      if(isMachinery(p)){this.showMachineryPuzzle(ch,p);return;}
      if(p.type==='choice'){
        const evidence=(p.presentation?.evidenceRefs||[]).map(id=>{const item=ch.evidence.find(entry=>entry.id===id);return item?`<button class="s6-deduction-evidence" data-s6="puzzle-evidence" data-id="${escapeHtml(id)}">${evidenceImageMarkup(ch,item,this.state.objectStates,'s6-deduction-image')}<strong>${escapeHtml(item.title)}</strong><small>Examine clue →</small></button>`:''}).join('');
        this.deductionChoice=this.deductionPuzzleId===p.id?this.deductionChoice:null;this.deductionPuzzleId=p.id;
        this.showModal(p.title,`<div class="s6-deduction"><header class="s6-deduction-hero" style="background-image:linear-gradient(90deg,#11271fea,#11271f66),url(&quot;${escapeHtml(ch.scene)}&quot;)"><span class="s6-eyebrow">Chapter ${String(this.state.chapter+1).padStart(2,'0')} · deduction</span><h2>${escapeHtml(p.title)}</h2></header>${evidence?`<div class="s6-deduction-board" aria-label="Clues to review">${evidence}</div>`:''}<section class="s6-deduction-question-panel"><p class="s6-deduction-question">${escapeHtml(p.prompt)}</p><div class="s6-choice-list" role="radiogroup" aria-label="Choose one explanation">${p.options.map(option=>`<button type="button" class="s6-choice s6-deduction-option${this.deductionChoice===option.id?' is-selected':''}" role="radio" aria-checked="${this.deductionChoice===option.id}" data-s6="puzzle-choice" data-id="${option.id}"><span aria-hidden="true" class="s6-radio-dot"></span>${escapeHtml(option.label)}</button>`).join('')}</div><p class="s6-feedback" id="s6-puzzle-feedback" role="status" aria-live="polite">${escapeHtml(this.deductionFeedback||'')}</p></section></div>`,`<button class="s6-btn" data-s6="deduction-submit" ${this.deductionChoice?'':'disabled'}>Submit answer →</button><button class="s6-quiet" data-s6="hint">Progressive hint</button><button class="s6-quiet" data-s6="close">Return to evidence</button>`);
      }else{
        const draft=this.state.puzzleDrafts[p.id]||p.items.map(item=>item.id);this.state.puzzleDrafts[p.id]=draft;
        if(this.sequencePuzzleId!==p.id){this.sequencePuzzleId=p.id;this.sequenceSelected=null;this.sequenceFeedback='';}
        const route=p.presentation?.mode==='route',topLabel=p.presentation?.topLabel||'First',bottomLabel=p.presentation?.bottomLabel||'Last';
        const steps=draft.map((id,index)=>{
          const item=p.items.find(entry=>entry.id===id),selected=this.sequenceSelected===index;
          return `<div class="s6-sequence-step${selected?' is-selected':''}" data-sequence-index="${index}" draggable="true"><span class="s6-sequence-pin" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><button type="button" class="s6-sequence-main" data-s6="sequence-select" data-index="${index}" aria-pressed="${selected}" aria-label="${escapeHtml(item?.label||id)}, position ${index+1}. ${selected?'Selected; choose a destination.':'Select to move.'}"><span class="s6-sequence-label">${escapeHtml(item?.label||id)}</span>${item?.caption||selected?`<small>${selected?'Choose a destination':escapeHtml(item?.caption)}</small>`:''}</button><span class="s6-sequence-controls"><button type="button" data-s6="move" data-index="${index}" data-delta="-1" ${index===0?'disabled':''} aria-label="Move ${escapeHtml(item?.label||id)} earlier">↑</button><button type="button" data-s6="move" data-index="${index}" data-delta="1" ${index===draft.length-1?'disabled':''} aria-label="Move ${escapeHtml(item?.label||id)} later">↓</button></span></div>`;
        }).join('');
        this.showModal(p.title,`<span class="s6-eyebrow">Chapter ${String(this.state.chapter+1).padStart(2,'0')} · sequence</span><h2>${escapeHtml(p.title)}</h2><p>${escapeHtml(p.prompt)}</p><section class="s6-sequence ${route?'is-route':'is-timeline'}" aria-label="Arrange the sequence"><div class="s6-sequence-heading"><span class="s6-sequence-emblem" aria-hidden="true">${route?'⌖':'✦'}</span><div><strong>${route?'Reconstruct the route':'Put the events in order'}</strong><small>Drag a card, or tap one and then its destination. Arrow buttons also move each card.</small></div></div><div class="s6-sequence-board"><div class="s6-sequence-endpoint"><span class="s6-endpoint-dot" aria-hidden="true"></span>${escapeHtml(topLabel)}</div><div class="s6-sequence-steps">${steps}</div><div class="s6-sequence-endpoint is-last"><span class="s6-endpoint-dot" aria-hidden="true"></span>${escapeHtml(bottomLabel)}</div></div></section><p class="s6-feedback" id="s6-puzzle-feedback" role="status" aria-live="polite">${escapeHtml(this.sequenceFeedback)}</p>`,`<button class="s6-btn" data-s6="puzzle-check">Check the sequence →</button><button class="s6-quiet" data-s6="puzzle-reset">Reset arrangement</button><button class="s6-quiet" data-s6="hint">Need a gentle hint?</button><button class="s6-quiet" data-s6="close">Return to evidence</button>`);
      }
    }
    showBookshelfPuzzle(ch,p) {
      const art=p.presentation,slots=this.state.bookshelfSlots,candidate=id=>art.candidates.find(item=>item.id===id);
      const bookArt=item=>{
        const frame=item.spineFrame,sheet=art.spineSheetSize;
        const image=`background-image:url(&quot;${escapeHtml(item.spineImage)}&quot;);`;
        const crop=frame&&sheet?`background-size:${sheet.width/frame.width*100}% ${sheet.height/frame.height*100}%;background-position:${frame.x/(sheet.width-frame.width)*100}% ${frame.y/(sheet.height-frame.height)*100}%;`:'';
        return `<span class="s6-library-book-art${frame?' has-sprite':''}" role="img" aria-label="Catalog ${escapeHtml(item.id)}" style="${image}${crop}"></span>`;
      };
      const shelfSlots=slots.map((id,index)=>`<button type="button" class="s6-library-slot${id?' is-filled':''}${this.bookSelection?.kind==='slot'&&this.bookSelection.index===index?' is-picked':''}" data-s6="books-slot" data-index="${index}" draggable="${Boolean(id)}" aria-label="Shelf space ${index+1}${id?`, catalog ${escapeHtml(id)}`:', empty'}${this.bookSelection?', select to place or move':''}">${id?bookArt(candidate(id)):''}</button>`).join('');
      const handles=art.handles.map(handle=>`<button type="button" class="s6-library-handle is-${escapeHtml(handle.id)}" data-s6="books-handle" data-id="${escapeHtml(handle.id)}" aria-label="Try handle ${escapeHtml(handle.id)}, ${escapeHtml(handle.label)}" title="Try the ${escapeHtml(handle.label.toLowerCase())}"><span>${escapeHtml(handle.id)}</span></button>`).join('');
      const available=art.candidates.map(item=>slots.includes(item.id)?'<div class="s6-library-candidate is-vacant" aria-hidden="true"><span class="s6-library-vacant"></span></div>':`<div class="s6-library-candidate"><button type="button" class="s6-library-candidate-pick${this.bookSelection?.kind==='candidate'&&this.bookSelection.id===item.id?' is-picked':''}" draggable="true" data-s6="books-pick" data-id="${escapeHtml(item.id)}" aria-pressed="${this.bookSelection?.kind==='candidate'&&this.bookSelection.id===item.id}" aria-label="Select catalog book ${escapeHtml(item.id)}">${bookArt(item)}</button></div>`).join('');
      const selected=slots.map((id,index)=>`<div class="s6-library-selected-slot" aria-label="Position ${index+1}${id?`, catalog ${escapeHtml(id)}`:', empty'}">${id?bookArt(candidate(id)):'<span class="s6-library-selected-empty" aria-hidden="true"></span>'}<span class="s6-library-selected-index">${index+1}</span></div>`).join('');
      const cartNumbers=(art.cartNumbers||[]).map(id=>`<span>${escapeHtml(id)}</span>`).join('');
      this.showModal(p.title,`<div class="s6-library-puzzle"><nav class="s6-library-nav"><button type="button" class="s6-library-back" data-s6="close">← Back to investigation</button><span>Chapter 01 · library puzzle</span></nav><div class="s6-library-layout"><div class="s6-library-scene" style="background-image:url(&quot;${escapeHtml(art.shelfImage)}&quot;)"><div class="s6-library-slot-track">${shelfSlots}</div><div class="s6-library-handle-track">${handles}</div><div class="s6-library-drawer${this.state.bookSlipReady?' is-open':''}"><span class="s6-library-drawer-inset">${this.state.bookSlipReady?`<button type="button" data-s6="books-collect" class="s6-library-slip" aria-label="Collect concealed catalog slip ${escapeHtml(art.slipText)}">${escapeHtml(art.slipText)} →</button>`:''}</span></div></div><aside class="s6-library-board"><span class="s6-eyebrow">The library cabinet</span><h2>${escapeHtml(p.title)}</h2><p>${escapeHtml(p.prompt)}</p><div class="s6-library-note"><h3>Eleanor’s Note</h3><p>${escapeHtml(art.note)}</p></div><div class="s6-library-selected"><h3>Your selected books</h3><div class="s6-library-selected-books">${selected}</div></div><div class="s6-library-cart"><h3>From the Book Cart</h3><div class="s6-library-cart-numbers">${cartNumbers}</div></div><p class="s6-library-status" id="s6-puzzle-feedback" role="status" aria-live="polite">${escapeHtml(this.bookFeedback||'Select a book below, then a space on the shelf. Try the brass handles when ready.')}</p></aside></div><section class="s6-library-available"><h3>Available Books <small>· select a book, then a space on the shelf</small></h3><div class="s6-library-candidates">${available}</div></section></div>`,`<button class="s6-quiet" data-s6="books-clue">View Book Cart clue</button><button class="s6-quiet" data-s6="hint">Hint</button><button class="s6-quiet" data-s6="puzzle-reset">Reset arrangement</button>`);
      this.overlay?.lastElementChild?.querySelector('.s6-library-back')?.focus();
    }
    openBook(id) {
      const p=this.current().puzzle,item=p.presentation?.candidates?.find(entry=>entry.id===id);if(!item)return;
      if(!this.state.booksSeen.includes(id)){this.state.booksSeen.push(id);this.save();}
      this.showModal('Inside the front cover',`<span class="s6-eyebrow">Inside the front cover</span><h2>${escapeHtml(item.label)}</h2>${item.coverImage?`<img class="s6-book-cover" src="${escapeHtml(item.coverImage)}" alt="Opened book showing catalog stamp ${escapeHtml(id)}">`:`<div class="s6-library-inside-cover"><span>Willowmere Library</span><strong>Catalog ${escapeHtml(id)}</strong><small>${escapeHtml(item.label)}</small></div>`}<p>Catalog ${escapeHtml(id)}</p>`,`<button class="s6-quiet" data-s6="close">Return to shelf</button>`,{stack:true});
    }
    pickBook(id) {const p=this.current().puzzle;if(!p.presentation?.candidates?.some(item=>item.id===id)||this.state.bookshelfSlots.includes(id))return;this.bookSelection=this.bookSelection?.kind==='candidate'&&this.bookSelection.id===id?null:{kind:'candidate',id};this.bookFeedback=this.bookSelection?`Choose a space on the shelf for catalog ${id}.`:'Selection cleared.';this.showPuzzle();}
    async chooseBookSlot(index) {const slots=[...this.state.bookshelfSlots];if(!Number.isInteger(index)||index<0||index>=slots.length)return;
      if(!this.bookSelection){if(!slots[index]){this.bookFeedback='Select a book from the available shelf first.';}else{this.bookSelection={kind:'slot',index};this.bookFeedback='Choose another slot to move this book, or select it again to remove it.';}this.showPuzzle();return;}
      if(this.bookSelection.kind==='candidate'){const id=this.bookSelection.id,old=slots.indexOf(id);if(old!==-1)slots[old]=null;slots[index]=id;this.bookFeedback=`Catalog ${id} placed in position ${index+1}.`;}else{const from=this.bookSelection.index;if(from===index){this.bookFeedback=`Catalog ${slots[index]} returned to the available books.`;slots[index]=null;}else{[slots[from],slots[index]]=[slots[index],slots[from]];this.bookFeedback='The books change places on the shelf.';}}
      this.bookSelection=null;this.state.bookshelfSlots=slots;this.state.bookSlipReady=false;await this.save();this.showPuzzle();
    }
    async pullBookHandle(id) {const p=this.current().puzzle,handle=p.presentation?.handles?.find(item=>item.id===id);if(!handle)return;
      if(id==='D'){
        if(this.state.bookshelfSlots.join('|')!==p.answer.join('|'))this.bookFeedback='The brass handle resists. Something in the cabinet has not aligned.';
        else{this.state.bookSlipReady=true;this.bookFeedback=`A brass latch clicks. The narrow concealed drawer slides out with the ${p.presentation.slipText} slip.`;await this.save();}
      }else this.bookFeedback=handle.feedback;
      this.showPuzzle();
    }
    showMachineryPuzzle(ch,p) {
      const previous=this.overlay?.lastElementChild;
      const previousScroll=previous?.querySelector('.s6-machine-puzzle')?(previous.querySelector('.s6-clue-scroll')?.scrollTop??previous.scrollTop):0;
      const selected=this.state.puzzleRouteSelections[p.id]||[],solved=this.isSolved(this.state.chapter),confirming=this.machineryConfirming;
      const spec=p.presentation,ordered=Array.isArray(spec.choiceOrder)?spec.choiceOrder.map(id=>p.items.find(item=>item.id===id)).filter(Boolean):p.items;
      const crop=item=>{const frame=spec.controlFrames?.[item.id];if(!frame)return '';const x=frame.x/(100-frame.width)*100,y=frame.y/(100-frame.height)*100;return `background-image:url(&quot;${escapeHtml(spec.image.src)}&quot;);background-size:${10000/frame.width}% ${10000/frame.height}%;background-position:${x}% ${y}%`};
      const markers=ordered.map(item=>{const point=spec.controlPositions?.[item.id];if(!point)return '';const rank=selected.indexOf(item.id);return `<button type="button" class="s6-machine-hotspot${rank>=0?' is-selected':''}" style="left:${point.x}%;top:${point.y}%" data-s6="machine-select" data-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(item.label)}${rank>=0?`, proposed action ${rank+1}`:''}" aria-pressed="${rank>=0}" title="${escapeHtml(item.label)}">${rank>=0?rank+1:'+'}</button>`}).join('');
      const controls=ordered.map(item=>{const rank=selected.indexOf(item.id);return `<button type="button" class="s6-machine-control${rank>=0?' is-selected':''}" data-s6="machine-select" data-id="${escapeHtml(item.id)}" aria-pressed="${rank>=0}"><span class="s6-machine-control-image" style="${crop(item)}" aria-hidden="true"></span><span class="s6-machine-control-copy"><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.caption||'')}</small></span><span class="s6-machine-number" aria-hidden="true">${rank>=0?rank+1:'+'}</span></button>`}).join('');
      const sequence=selected.length?selected.map((id,index)=>{const item=p.items.find(entry=>entry.id===id);return `<div class="s6-machine-step"><span class="s6-machine-step-number">${index+1}</span><span class="s6-machine-step-thumb" style="${crop(item)}" aria-hidden="true"></span><span class="s6-machine-step-copy"><strong>${escapeHtml(item?.label||id)}</strong><small>${escapeHtml(item?.caption||'')}</small></span><span class="s6-machine-step-controls">${index===0?'':`<button data-s6="machine-up" data-index="${index}" aria-label="Move ${escapeHtml(item?.label||id)} earlier">↑</button>`}${index===selected.length-1?'':`<button data-s6="machine-down" data-index="${index}" aria-label="Move ${escapeHtml(item?.label||id)} later">↓</button>`}<button data-s6="machine-remove" data-id="${escapeHtml(id)}" aria-label="Remove ${escapeHtml(item?.label||id)}">×</button></span></div>`}).join(''):'<p>Choose an action on the chamber or below to begin.</p>';
      const evidence=spec.evidenceRefs.map(id=>{const item=ch.evidence.find(entry=>entry.id===id);return item?`<button type="button" class="s6-machine-evidence" data-s6="machine-evidence" data-id="${escapeHtml(id)}">${escapeHtml(item.title)} ↗</button>`:''}).join('');
      const systemTrace=`<svg class="s6-machine-system" viewBox="0 0 1672 941" preserveAspectRatio="none" aria-hidden="true"><path class="s6-machine-drive-guide" d="M 166 195 C 320 193 485 208 707 193"/><path class="s6-machine-pipe-guide" d="M 1475 449 C 1535 455 1600 454 1665 458"/><path class="s6-machine-outlet-guide" d="M 1510 685 C 1564 681 1620 682 1666 688"/><path class="s6-machine-water-guide" d="M 1635 749 C 1632 795 1607 817 1558 830 C 1425 843 1306 826 1192 841"/></svg>`;
      const status=confirming?'<span>Bypass draining</span><span>Pressure falling</span><span>Counterweight released</span>':'The chamber water remains above the safe line';
      this.showModal(p.title,`<div class="s6-machine-puzzle${confirming?' is-confirming':''}"><div class="s6-machine-intro"><span class="s6-eyebrow">Chapter ${String(this.state.chapter+1).padStart(2,'0')} · Springworks rescue</span><h2>${escapeHtml(p.title)}</h2><p>${escapeHtml(p.prompt)}</p></div><div class="s6-machine-stage"><div class="s6-machine-scene"><img src="${escapeHtml(spec.image.src)}" alt="Springworks chamber with its gate, counterweight, side channel and Edda's tool roll">${systemTrace}${markers}<span class="s6-machine-counterweight-release" aria-hidden="true">↓</span><div class="s6-machine-meter" aria-label="Chamber pressure ${confirming?'safe':'high'}"><span>Water level</span><div><i style="height:${confirming?'24':'78'}%"></i></div><strong>${confirming?'Safe':'High'}</strong></div><div class="s6-machine-status">${status}</div></div><aside class="s6-machine-proposal"><strong>Your proposed sequence · ${selected.length} of ${p.items.length}</strong><div class="s6-machine-timeline">${sequence}</div></aside></div><section class="s6-machine-actions"><span class="s6-eyebrow">Your actions</span><p>Select the controls in a safe order. Tap a chosen action again to remove it.</p><div class="s6-machine-controls">${controls}</div><div class="s6-machine-evidence-row" aria-label="Review the chamber clues">${evidence}</div></section><p class="s6-feedback" id="s6-puzzle-feedback" role="status" aria-live="polite">${escapeHtml(this.machineryFeedback||'')}</p></div>`,`<button class="s6-quiet" data-s6="machine-reset" ${!selected.length?'hidden':''}>Reset actions</button><button class="s6-quiet" data-s6="hint">Progressive hint</button><button class="s6-btn" data-s6="puzzle-check">Submit rescue plan →</button><button class="s6-quiet" data-s6="close">Return to evidence</button>`,{clueScroll:true});
      const scroll=this.overlay?.lastElementChild?.querySelector('.s6-clue-scroll');if(scroll)scroll.scrollTop=previousScroll;
    }
    async machineSelect(id) {
      const p=this.current().puzzle;if(!isMachinery(p)||this.isSolved(this.state.chapter)||this.machineryConfirming)return;
      const selected=this.state.puzzleRouteSelections[p.id]||[];
      this.state.puzzleRouteSelections[p.id]=selected.includes(id)?selected.filter(value=>value!==id):[...selected,id];
      this.machineryFeedback='';await this.save();this.showPuzzle();this.overlay.querySelector(`[data-s6="machine-select"][data-id="${id}"]`)?.focus();
    }
    async machineMove(index,delta) {
      const p=this.current().puzzle,selected=this.state.puzzleRouteSelections[p.id]||[];
      if(!isMachinery(p)||this.machineryConfirming||index+delta<0||index+delta>=selected.length)return;
      this.state.puzzleRouteSelections[p.id]=insertSequenceItem(selected,index,index+delta);
      await this.save();this.showPuzzle();
    }
    showRoutePuzzle(ch,p) {
      if(this.routePuzzleId!==p.id){this.routePuzzleId=p.id;this.routeZoom=1;this.routeFeedback='';}
      const spec=p.presentation,image=spec.image,solved=this.isSolved(this.state.chapter),choices=routeChoices(p);
      const selected=solved?p.answer:(this.state.puzzleRouteSelections[p.id]||[]),confirmed=solved;
      const zoom=this.routeZoom||1,viewWidth=image.width/zoom,viewHeight=image.height/zoom;
      const focus=spec.locations[selected.at(-1)]||{x:image.width/2,y:image.height/2};
      const viewX=Math.max(0,Math.min(image.width-viewWidth,focus.x-viewWidth/2)),viewY=Math.max(0,Math.min(image.height-viewHeight,focus.y-viewHeight/2));
      const paths=selected.slice(1).map((id,index)=>{
        const before=selected[index],edges=spec.network?findNetworkPath(spec.network.edges,before,id):spec.connections.filter(item=>(item.from===before&&item.to===id)||(item.from===id&&item.to===before));
        return edges.map(edge=>`<path class="s6-route-pipe ${confirmed?'is-lit':'is-traced'}" style="--s6-step:${index+1}" d="${escapeHtml(edge.d)}"/>`).join('');
      }).join('');
      const valves=choices.map(item=>{
        const point=spec.locations[item.id],index=selected.indexOf(item.id),lit=confirmed&&index!==-1;
        return `<g class="s6-route-valve ${index===-1?'is-available':lit?'is-lit':'is-selected'}" style="--s6-step:${index}" data-s6="route-select" data-id="${escapeHtml(item.id)}" role="button" tabindex="${solved?'-1':'0'}" aria-label="${escapeHtml(item.label)}. ${index===-1?'Not selected':`Selected as stop ${index+1}`}." aria-pressed="${index!==-1}"><circle class="s6-route-hit" cx="${point.x}" cy="${point.y}" r="48"/><circle class="s6-route-ring" cx="${point.x}" cy="${point.y}" r="37"/><circle class="s6-route-center" cx="${point.x}" cy="${point.y}" r="9"/>${index!==-1?`<circle class="s6-route-number-bg" cx="${point.x+34}" cy="${point.y-35}" r="20"/><text class="s6-route-number" x="${point.x+34}" y="${point.y-35}" text-anchor="middle" dominant-baseline="middle">${index+1}</text>`:''}</g>`;
      }).join('');
      const cards=choices.map(item=>{
        const point=spec.locations[item.id],index=selected.indexOf(item.id),lit=confirmed&&index!==-1;
        const x=Math.max(0,Math.min(image.width-310,point.x-155)),y=Math.max(0,Math.min(image.height-220,point.y-110));
        return `<button class="s6-route-card ${index===-1?'':lit?'is-lit':'is-selected'}" data-s6="route-select" data-id="${escapeHtml(item.id)}" ${solved?'disabled':''}><svg class="s6-route-thumb" viewBox="${x} ${y} 310 220" aria-hidden="true"><image href="${escapeHtml(image.src)}" width="${image.width}" height="${image.height}"/></svg><span class="s6-route-card-number">${index===-1?'—':index+1}</span><span class="s6-route-card-copy"><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.caption||'Valve location')}</small></span><span class="s6-route-card-arrow" aria-hidden="true">${index===-1?'＋':'×'}</span></button>`;
      }).join('');
      const status=solved?'Route established. The waterworks lead is saved.':selected.length===p.items.length?'All valves selected. Submit the route or change a valve.':`${selected.length} of ${p.items.length} valves selected. Select them in Edda’s order.`;
      this.showModal(p.title,`<div class="s6-route-puzzle ${this.routeConfirming===p.id?'is-confirming':''}"><div class="s6-route-intro"><span class="s6-eyebrow">Chapter ${String(this.state.chapter+1).padStart(2,'0')} · waterworks reconstruction</span><h2>${escapeHtml(p.title)}</h2><p>${escapeHtml(p.prompt)}</p></div><div class="s6-route-layout"><div class="s6-route-chart"><svg class="s6-route-svg" viewBox="${viewX} ${viewY} ${viewWidth} ${viewHeight}" aria-label="Interactive valve chart"><image href="${escapeHtml(image.src)}" width="${image.width}" height="${image.height}"/><g class="s6-route-lines">${paths}</g><g class="s6-route-valves">${valves}</g></svg><div class="s6-route-chart-caption"><span>Valve chart · ${Math.round(zoom*100)}%</span><span>Tap the valve wheels on the drawing</span></div></div><aside class="s6-route-panel"><span class="s6-route-panel-kicker">Investigation board</span><h3>Reconstruct the route</h3><p>Choose the valves in the order Edda followed. Tap a selected valve again to remove it.</p><div class="s6-route-card-list">${cards}</div><p class="s6-route-legend"><span class="s6-route-legend-dot"></span> ${solved?'Emerald confirms the discovered route.':'Gold marks your proposed route.'}</p></aside></div><p class="s6-route-status" id="s6-puzzle-feedback" role="status" aria-live="polite">${escapeHtml(this.routeFeedback||status)}</p></div>`,`<button class="s6-quiet" data-s6="route-original">View original chart</button><button class="s6-quiet" data-s6="route-zoom-out" ${zoom<=1?'disabled':''} aria-label="Zoom chart out">−</button><button class="s6-quiet" data-s6="route-zoom-in" ${zoom>=2.5?'disabled':''}>Zoom +</button><button class="s6-quiet" data-s6="route-zoom-reset" ${zoom===1?'disabled':''}>Reset view</button>${solved?'':`<button class="s6-quiet" data-s6="route-undo" ${!selected.length?'disabled':''}>Undo last</button><button class="s6-quiet" data-s6="puzzle-reset" ${!selected.length?'disabled':''}>Reset route</button><button class="s6-btn" data-s6="puzzle-check" ${selected.length!==p.items.length?'disabled':''}>Submit route →</button>`}<button class="s6-quiet" data-s6="close">Return to investigation</button>`);
    }
    gardenViewBox(image) {
      const zoom=this.gardenZoom||1,width=image.width/zoom,height=image.height/zoom;
      const center=this.gardenCenter||{x:image.width/2,y:image.height/2};
      const x=Math.max(0,Math.min(image.width-width,center.x-width/2));
      const y=Math.max(0,Math.min(image.height-height,center.y-height/2));
      return {x,y,width,height};
    }
    showGardenPuzzle(ch,p) {
      if(this.gardenPuzzleId!==p.id){this.gardenPuzzleId=p.id;this.gardenZoom=1;this.gardenCenter={x:p.presentation.image.width/2,y:p.presentation.image.height/2};this.gardenFeedback='';}
      const spec=p.presentation,image=spec.image,solved=this.isSolved(this.state.chapter);
      const selected=solved?p.answer:(this.state.puzzleRouteSelections[p.id]||[]),confirmed=solved,box=this.gardenViewBox(image);
      const routes=selected.slice(1).map((id,index)=>{
        const from=spec.locations[selected[index]],to=spec.locations[id];
        const bendX=(from.x+to.x)/2,bendY=(from.y+to.y)/2-20;
        return `<path class="s6-garden-trace ${confirmed?'is-confirmed':'is-exploring'}" style="--s6-step:${index+1}" d="M ${from.x} ${from.y} Q ${bendX} ${bendY} ${to.x} ${to.y}"/>`;
      }).join('');
      const markers=p.items.map(item=>{
        const point=spec.locations[item.id],index=selected.indexOf(item.id),lit=confirmed&&index!==-1;
        return `<g class="s6-garden-landmark ${index===-1?'':lit?'is-confirmed':'is-selected'}" style="--s6-step:${index}" data-s6="garden-select" data-id="${escapeHtml(item.id)}" role="button" tabindex="${solved?'-1':'0'}" aria-pressed="${index!==-1}" aria-label="${escapeHtml(item.label)}. ${index===-1?'Not selected':`Selected as landmark ${index+1}`}." transform="translate(${point.x} ${point.y})"><circle class="s6-garden-hit" r="57"/><circle class="s6-garden-halo" r="34"/><circle class="s6-garden-core" r="25"/><text class="s6-garden-marker-text" text-anchor="middle" dominant-baseline="central">${index===-1?'?':index+1}</text></g>`;
      }).join('');
      const verse=spec.verse.map(entry=>{
        const selectedIndex=selected.indexOf(entry.id);
        return `<div class="s6-garden-verse ${selectedIndex===-1?'':confirmed?'is-confirmed':'is-selected'}"><span class="s6-garden-verse-symbol" aria-hidden="true">${escapeHtml(entry.symbol)}</span><span>${escapeHtml(entry.text)}</span>${selectedIndex===-1?'':`<strong aria-label="Your selected stop ${selectedIndex+1}">${selectedIndex+1}</strong>`}</div>`;
      }).join('');
      const proposal=selected.map((id,index)=>`<span><b>${index+1}</b>${escapeHtml(spec.shortLabels?.[id]||p.items.find(item=>item.id===id)?.label||id)}</span>`).join('<em aria-hidden="true">→</em>');
      const status=solved?'The verse leads beneath the third arch to the spring door. The next step is to investigate how to open it safely.':selected.length===p.items.length?'Four landmarks selected. Submit the route, or change a landmark.':`${selected.length} of ${p.items.length} landmarks selected. Trace the verse on the map.`;
      const desktop=global.matchMedia?.('(min-width: 761px)').matches;
      this.showModal(p.title,`<div class="s6-garden-puzzle ${this.routeConfirming===p.id?'is-confirming':''}"><header class="s6-garden-intro"><span class="s6-eyebrow">Chapter ${String(this.state.chapter+1).padStart(2,'0')} · follow the verse</span><h2>${escapeHtml(p.title)}</h2><p>${escapeHtml(p.prompt)}</p></header><div class="s6-garden-layout"><div class="s6-garden-map"><svg class="s6-garden-svg" viewBox="${box.x} ${box.y} ${box.width} ${box.height}" role="group" aria-label="Illustrated garden map with four interactive landmarks"><image href="${escapeHtml(image.src)}" width="${image.width}" height="${image.height}"/><g class="s6-garden-lines">${routes}</g><g class="s6-garden-markers">${markers}</g></svg><div class="s6-garden-caption"><span>Garden survey · ${Math.round((this.gardenZoom||1)*100)}%</span><span>Choose landmarks on the map · drag to explore when zoomed</span></div></div><aside class="s6-garden-panel"><span class="s6-garden-kicker">Investigation board</span><h3>Follow the carved verse</h3><p>Interpret the stones and the map, then select four landmarks. The verse fragments are kept here for reference.</p><div class="s6-garden-proposal"><strong>Your selected order</strong><div>${proposal||'<small>Choose a landmark to begin.</small>'}</div></div><details class="s6-garden-verse-details" ${desktop?'open':''}><summary>Verse fragments</summary><div class="s6-garden-verse-list">${verse}</div></details><p class="s6-garden-legend"><span></span> ${solved?'Emerald confirms the discovered route.':'Gold marks your proposed route.'}</p></aside></div><p class="s6-garden-status" id="s6-puzzle-feedback" role="status" aria-live="polite">${escapeHtml(this.gardenFeedback||status)}</p></div>`,`<button class="s6-quiet" data-s6="garden-evidence" data-id="${escapeHtml(spec.verseEvidenceId)}">View verse stones</button><button class="s6-quiet" data-s6="garden-evidence" data-id="${escapeHtml(spec.mapEvidenceId)}">View original garden map</button><button class="s6-quiet" data-s6="garden-zoom-out" ${this.gardenZoom<=1?'disabled':''} aria-label="Zoom map out">−</button><button class="s6-quiet" data-s6="garden-zoom-in" ${this.gardenZoom>=2.4?'disabled':''}>Zoom +</button><button class="s6-quiet" data-s6="garden-zoom-reset" ${this.gardenZoom===1?'disabled':''}>Reset view</button>${solved?'':`<button class="s6-quiet" data-s6="garden-undo" ${!selected.length?'disabled':''}>Undo last</button><button class="s6-quiet" data-s6="puzzle-reset" ${!selected.length?'disabled':''}>Reset route</button><button class="s6-btn" data-s6="puzzle-check" ${selected.length!==p.items.length?'disabled':''}>Submit route →</button>`}<button class="s6-quiet" data-s6="close">Return to investigation</button>`);
    }
    async gardenSelect(id) {
      const p=this.current().puzzle;if(!isGardenRoute(p)||this.isSolved(this.state.chapter))return;
      const before=this.state.puzzleRouteSelections[p.id]||[];
      const selected=toggleRouteSelection(before,id,p.items.map(item=>item.id),p.items.length);
      if(selected===before)return;
      this.state.puzzleRouteSelections[p.id]=selected;this.gardenFeedback='';await this.save();this.showGardenPuzzle(this.current(),p);
      [...this.overlay.querySelectorAll('.s6-garden-landmark')].find(node=>node.dataset.id===id)?.focus();
    }
    async gardenUndo() {
      const p=this.current().puzzle;if(!isGardenRoute(p)||this.isSolved(this.state.chapter))return;
      this.state.puzzleRouteSelections[p.id]=(this.state.puzzleRouteSelections[p.id]||[]).slice(0,-1);
      this.gardenFeedback='Last landmark removed.';await this.save();this.showGardenPuzzle(this.current(),p);
    }
    showGardenEvidence(id) {
      const ch=this.current(),p=ch.puzzle,item=ch.evidence.find(entry=>entry.id===id);
      if(!isGardenRoute(p)||!item||![p.presentation.verseEvidenceId,p.presentation.mapEvidenceId].includes(id))return;
      this.showModal(item.title,`<span class="s6-eyebrow">Chapter ${String(this.state.chapter+1).padStart(2,'0')} · original evidence</span><h2>${escapeHtml(item.title)}</h2>${evidenceImageMarkup(ch,item,this.state.objectStates)}<div class="s6-note">${escapeHtml(item.detail)}</div>`,`<button class="s6-btn" data-s6="garden-back">Back to garden route →</button>`,{stack:true});
    }
    changeGardenZoom(delta) {
      if(!isGardenRoute(this.current().puzzle))return;
      this.gardenZoom=Math.max(1,Math.min(2.4,Math.round(((this.gardenZoom||1)+delta)*100)/100));this.showPuzzle();
    }
    gardenPanStart(event) {
      const svg=event.target.closest?.('.s6-garden-svg');
      if(!svg||event.target.closest?.('.s6-garden-landmark')||(this.gardenZoom||1)<=1)return;
      this.gardenPointer={id:event.pointerId,x:event.clientX,y:event.clientY,center:{...this.gardenCenter}};
      svg.setPointerCapture(event.pointerId);svg.classList.add('is-panning');
    }
    gardenPanMove(event) {
      const drag=this.gardenPointer;if(!drag||drag.id!==event.pointerId)return;
      const svg=this.overlay.querySelector('.s6-garden-svg'),image=this.current().puzzle.presentation.image;
      if(!svg)return;
      const box=svg.getBoundingClientRect(),width=image.width/(this.gardenZoom||1),height=image.height/(this.gardenZoom||1);
      this.gardenCenter={x:drag.center.x-(event.clientX-drag.x)*width/box.width,y:drag.center.y-(event.clientY-drag.y)*height/box.height};
      const view=this.gardenViewBox(image);svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.width} ${view.height}`);
    }
    gardenPanEnd(event) {if(this.gardenPointer?.id===event.pointerId){this.gardenPointer=null;this.overlay.querySelector('.s6-garden-svg')?.classList.remove('is-panning');}}
    async routeSelect(id) {
      const p=this.current().puzzle;if(!isInteractiveRoute(p)||this.isSolved(this.state.chapter))return;
      const valid=routeChoices(p).map(item=>item.id),before=this.state.puzzleRouteSelections[p.id]||[];
      const selected=toggleRouteSelection(before,id,valid,p.items.length);
      if(selected===before)return;
      this.state.puzzleRouteSelections[p.id]=selected;this.routeFeedback='';await this.save();this.showRoutePuzzle(this.current(),p);
      [...this.overlay.querySelectorAll('.s6-route-card')].find(card=>card.dataset.id===id)?.focus();
    }
    async routeUndo() {
      const p=this.current().puzzle;if(!isInteractiveRoute(p)||this.isSolved(this.state.chapter))return;
      this.state.puzzleRouteSelections[p.id]=(this.state.puzzleRouteSelections[p.id]||[]).slice(0,-1);
      this.routeFeedback='Last valve removed.';await this.save();this.showRoutePuzzle(this.current(),p);
    }
    showOriginalRouteChart() {
      const ch=this.current(),p=ch.puzzle,item=ch.evidence.find(evidence=>evidence.id===p.presentation.evidenceId);
      if(!item)return;
      this.showModal(item.title,`<span class="s6-eyebrow">Evidence · original document</span><h2>${escapeHtml(item.title)}</h2>${evidenceImageMarkup(ch,item,this.state.objectStates)}<div class="s6-note">${escapeHtml(item.detail)}</div>`,`<button class="s6-btn" data-s6="route-back">Back to route →</button>`,{stack:true});
    }
    changeRouteZoom(delta) {this.routeZoom=Math.max(1,Math.min(2.5,Math.round(((this.routeZoom||1)+delta)*100)/100));this.showPuzzle();}
    async moveSequence(from,to) {
      const p=this.current().puzzle;if(p.type!=='sequence')return;
      const draft=this.state.puzzleDrafts[p.id]||p.items.map(item=>item.id);
      if(from===to||from<0||to<0||from>=draft.length||to>=draft.length)return;
      const id=draft[from];this.state.puzzleDrafts[p.id]=insertSequenceItem(draft,from,to);
      if(p.presentation?.mode==='bookshelf')this.state.bookSlipReady=false;
      this.sequenceSelected=null;this.sequenceFeedback=`${p.items.find(item=>item.id===id)?.label||id} moved to position ${to+1}.`;
      await this.save();this.showPuzzle();
      this.overlay.querySelector(`[data-s6="sequence-select"][data-index="${to}"]`)?.focus();
    }
    sequenceDragStart(event) {
      const step=event.target.closest?.('.s6-sequence-step,.s6-book-spine');
      if(!step)return;
      if(event.target.closest('.s6-sequence-controls')){event.preventDefault();return;}
      this.sequenceDrag=Number(step.dataset.sequenceIndex);
      event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',String(this.sequenceDrag));
      step.classList.add('is-dragging');
    }
    sequenceDragOver(event) {
      const step=event.target.closest?.('.s6-sequence-step,.s6-book-spine');if(!step||this.sequenceDrag===null)return;
      event.preventDefault();event.dataTransfer.dropEffect='move';
      this.overlay.querySelectorAll('.s6-sequence-step.is-drop-target,.s6-book-spine.is-drop-target').forEach(node=>node.classList.remove('is-drop-target'));
      if(Number(step.dataset.sequenceIndex)!==this.sequenceDrag)step.classList.add('is-drop-target');
    }
    async sequenceDrop(event) {
      const step=event.target.closest?.('.s6-sequence-step,.s6-book-spine');if(!step||this.sequenceDrag===null)return;
      event.preventDefault();const from=this.sequenceDrag,to=Number(step.dataset.sequenceIndex);
      this.sequenceDragEnd();await this.moveSequence(from,to);
    }
    sequenceDragEnd() {
      this.sequenceDrag=null;
      this.overlay.querySelectorAll('.s6-sequence-step.is-dragging,.s6-sequence-step.is-drop-target,.s6-book-spine.is-dragging,.s6-book-spine.is-drop-target').forEach(node=>node.classList.remove('is-dragging','is-drop-target'));
    }
    puzzleChoice(id) { const p=this.current().puzzle;if(!p.options?.some(option=>option.id===id))return;this.deductionChoice=id;this.deductionFeedback='';this.showPuzzle();this.overlay.querySelector(`[data-s6="puzzle-choice"][data-id="${id}"]`)?.focus(); }
    deductionSubmit() {const p=this.current().puzzle;if(!this.deductionChoice)return;if(this.deductionChoice!==p.answer){this.deductionFeedback='That answer does not fit all the clues. Review the evidence and try again.';this.overlay.querySelector('#s6-puzzle-feedback').textContent=this.deductionFeedback;return;}this.deductionFeedback='';this.solvePuzzle();}
    async puzzleCheck() {
      if(this.machineryConfirming)return;
      const p=this.current().puzzle,draft=isVisualRoute(p)||isMachinery(p)?this.state.puzzleRouteSelections[p.id]||[]:this.state.puzzleDrafts[p.id]||[];
      if(p.presentation?.mode==='bookshelf'&&this.state.bookSlipReady){this.solvePuzzle();return;}
      if(isMachinery(p)&&draft.length<p.items.length){this.machineryFeedback=`Choose ${p.items.length-draft.length} more action${p.items.length-draft.length===1?'':'s'} before submitting.`;const feedback=this.overlay.querySelector('#s6-puzzle-feedback');if(feedback)feedback.textContent=this.machineryFeedback;return;}
      if(draft.join('|')!==p.answer.join('|')){
        const feedback=this.overlay.querySelector('#s6-puzzle-feedback');
        if(feedback)feedback.textContent=isMachinery(p)?'That order may put Edda at risk. Check the waterline and the gate warning, then adjust your plan.':isVisualRoute(p)?'The route does not quite match the evidence. Revisit the clues and adjust your path.':'Not quite. Review the evidence and adjust the order.';
        if(isMachinery(p)){this.machineryFeedback=feedback?.textContent||'';return;}
        if(isGardenRoute(p))this.gardenFeedback=feedback?.textContent||'';else this.routeFeedback=feedback?.textContent||'';
        const board=this.overlay.querySelector('.s6-route-puzzle,.s6-garden-puzzle');
        if(board){board.classList.remove('is-route-error');void board.offsetWidth;board.classList.add('is-route-error');}
        return;
      }
      if(p.presentation?.mode==='bookshelf'){this.state.bookSlipReady=true;this.sequenceFeedback=`The books settle into place. A folded catalog slip marked ${p.presentation.slipText} appears between them.`;await this.save();this.showPuzzle();return;}
      if(isMachinery(p)){
        const token=this.completionToken||0;this.machineryConfirming=true;this.showPuzzle();
        await new Promise(resolve=>setTimeout(resolve,global.matchMedia?.('(prefers-reduced-motion: reduce)').matches?0:3600));
        this.machineryConfirming=false;if(this.completionToken!==token||this.overlay.classList.contains('is-hidden'))return;this.solvePuzzle();return;
      }
      if(!isVisualRoute(p)){this.solvePuzzle();return;}
      if(!this.state.solved.includes(p.id))this.state.solved.push(p.id);
      await this.save();this.render();
      this.routeConfirming=p.id;
      const token=this.completionToken||0;
      this.showPuzzle();
      await new Promise(resolve=>setTimeout(resolve,global.matchMedia?.('(prefers-reduced-motion: reduce)').matches?0:2300));
      this.routeConfirming=null;
      if(this.completionToken!==token||this.overlay.classList.contains('is-hidden'))return;
      this.solvePuzzle();
    }
    solvePuzzle() {
      const ch=this.current();if(!this.state.solved.includes(ch.puzzle.id))this.state.solved.push(ch.puzzle.id);
      this.save();this.render();
      const result=`<p>${escapeHtml(ch.puzzle.success)}</p><div class="s6-note">${escapeHtml(ch.clue)}</div>`;
      const portrait=ch.rescueDialogue&&this.story.characterPortraits?.edda?`<div class="s6-rescue-success"><img src="${escapeHtml(this.story.characterPortraits.edda)}" alt="Edda Moss, rescued from the springworks"><div>${result}</div></div>`:result;
      this.showModal('Lead established',`<span class="s6-eyebrow">Chapter ${String(this.state.chapter+1).padStart(2,'0')} · new lead</span><h2>${escapeHtml(ch.puzzle.title)}</h2>${portrait}`,this.state.chapter<this.story.chapters.length-1?'<button class="s6-btn" data-s6="continue">Continue to the next chapter →</button>':ch.rescueDialogue?'<button class="s6-btn" data-s6="rescue-dialogue">Speak with Edda →</button>':this.story.resolution?.dialogue?'<button class="s6-btn" data-s6="resolution-dialogue">Discuss what the records show →</button>':'<button class="s6-btn" data-s6="ending">Choose how to resolve the case →</button>');
    }
    showOpening() {const intro=this.story.openingIntroduction;if(!intro)return;const portrait=this.story.characterPortraits?.[this.story.caseSubject?.id];this.showModal(intro.title,`<div class="s6-opening-layout">${portrait?`<div class="s6-opening-portrait"><img src="${escapeHtml(portrait)}" alt="Portrait of Edda Moss, the missing bellkeeper"></div>`:''}<div class="s6-opening-copy"><span class="s6-eyebrow">Story ${String(this.story.number).padStart(2,'0')} · opening</span><h2>${escapeHtml(intro.title)}</h2><div class="s6-opening">${intro.text.map(line=>`<p>${escapeHtml(line)}</p>`).join('')}</div><button class="s6-btn" data-s6="opening-begin">${escapeHtml(intro.buttonText||'Begin the investigation')} →</button></div></div>`);}
    showEddaConversation() {
      if(!this.isSolved(this.story.chapters.length-1))return;
      if(!this.state.rescueDone){this.showRescueDialogue();return;}
      const lines=this.story.chapters.at(-1).rescueDialogue?.lines||[];
      const questions=[];
      for(let index=0;index+1<lines.length;index+=2)questions.push(`<button type="button" class="s6-question" data-s6="edda-ask" data-index="${index}">${escapeHtml(lines[index].text)}<small>Discussed · ask again</small></button>`);
      this.showModal('Speak with Edda Moss',this.conversationMarkup({id:'edda',name:'Edda Moss'},`<span class="s6-eyebrow">The Springworks · after the rescue</span><h2>Edda Moss</h2><div class="s6-choice-list">${questions.join('')}</div>`,'Edda Moss',`<button class="s6-quiet" data-s6="transcript">Conversation log</button><button class="s6-quiet" data-s6="close">Return to investigation</button>`));
    }
    showEddaExchange(index,line=0) {
      const lines=this.story.chapters.at(-1).rescueDialogue?.lines||[];
      if(!this.state.rescueDone||index<0||index%2||!lines[index+1])return;
      const entry=lines[index+line];
      this.showModal('Edda Moss · conversation',this.conversationMarkup({id:'edda',name:'Edda Moss'},`<span class="s6-eyebrow">The Springworks · conversation</span><p class="s6-stage-direction">${line?'Edda replies.':'You ask the question.'}</p><span class="s6-speaker">${escapeHtml(entry.speaker)}</span><p class="s6-dialogue-text">${escapeHtml(entry.text)}</p>`,entry.speaker,`${line?`<button class="s6-btn" data-s6="edda-menu">Back to topics →</button><button class="s6-quiet" data-s6="edda-ask" data-index="${index}">Replay this exchange</button>`:`<button class="s6-btn" data-s6="edda-reply" data-index="${index}">Hear the reply →</button>`}<button class="s6-quiet" data-s6="transcript">Conversation log</button><button class="s6-quiet" data-s6="close">Return to investigation</button>`));
    }
    async beginOpening() {this.state.openingSeen=true;await this.save();this.closeModal();}
    showRescueDialogue() {const dialogue=this.story.chapters.at(-1).rescueDialogue;if(!dialogue||this.state.rescueDone)return;const line=dialogue.lines[this.state.rescueLine]||dialogue.lines[0],person={id:'edda',name:'Edda Moss'};this.showModal(dialogue.title,this.conversationMarkup(person,`<span class="s6-eyebrow">The Springworks · rescue conversation · ${this.state.rescueLine+1} of ${dialogue.lines.length}</span><h2>${escapeHtml(dialogue.title)}</h2><span class="s6-speaker">${escapeHtml(line.speaker)}</span><p class="s6-dialogue-text">${escapeHtml(line.text)}</p>`,line.speaker,`<button class="s6-btn" data-s6="rescue-next">${this.state.rescueLine<dialogue.lines.length-1?'Continue conversation →':'Consider the next step →'}</button>`));}
    async nextRescueLine() {const dialogue=this.story.chapters.at(-1).rescueDialogue,line=dialogue?.lines[this.state.rescueLine];if(!line)return;this.state.transcript.push({chapter:this.story.chapters.length-1,speaker:line.speaker,text:line.text});this.state.transcript=this.state.transcript.slice(-300);if(this.state.rescueLine<dialogue.lines.length-1){this.state.rescueLine++;await this.save();this.showRescueDialogue();}else{this.state.rescueDone=true;await this.save();this.render();this.showEnding();}}
    continueChapter() { if(this.state.chapter>=this.story.chapters.length-1||!this.isSolved(this.state.chapter))return;this.state.chapter++;this.state.dialogue=null;this.save();this.closeModal();this.render();global.scrollTo({top:0,behavior:'smooth'}); }
    showResolutionDialogue() {const lines=this.story.resolution?.dialogue;if(!lines?.length)return this.showEnding();const line=lines[this.state.resolutionLine],ada={id:'ada',name:'Ada Vale'};this.showCharacterConversation(this.story.resolution.title,ada,`<span class="s6-eyebrow">${escapeHtml(this.story.chapters.at(-1).location)} · final conversation · ${this.state.resolutionLine+1} of ${lines.length}</span><h2>${escapeHtml(this.story.resolution.title)}</h2><span class="s6-speaker">${escapeHtml(line.speaker)}</span><p class="s6-dialogue-text">${escapeHtml(line.text)}</p>`,`<button class="s6-btn" data-s6="resolution-next">${this.state.resolutionLine<lines.length-1?'Continue conversation →':'Choose how to reveal the truth →'}</button>${this.voiceControl(line.speaker,line.text)}`,line.speaker);}
    async nextResolutionLine() {const lines=this.story.resolution?.dialogue||[],line=lines[this.state.resolutionLine];if(!line)return;this.state.transcript.push({chapter:this.story.chapters.length-1,speaker:line.speaker,text:line.text});this.state.transcript=this.state.transcript.slice(-300);if(this.state.resolutionLine<lines.length-1){this.state.resolutionLine++;await this.save();this.showResolutionDialogue();}else{this.state.resolutionDone=true;await this.save();this.showEnding();}}
    showEnding() {if(this.story.resolution?.dialogue&&!this.state.resolutionDone)return this.showResolutionDialogue();const endings=this.story.chapters.at(-1).endings||[],title=this.story.resolution?.title||'Resolve the case',prompt=this.story.resolution?.prompt||"Edda is safe. The bell's cause is understood. The upper hamlet still needs water, and the way the diversion was handled must be addressed.";this.showModal(title,`<span class="s6-eyebrow">Story ${String(this.story.number).padStart(2,'0')} · final choice</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(prompt)}</p><div class="s6-ending">${endings.map(ending=>`<button class="s6-choice" data-s6="choose-ending" data-id="${ending.id}"><strong>${escapeHtml(ending.label)}</strong><br><small>${escapeHtml(ending.text)}</small></button>`).join('')}</div>`); }
    chooseEnding(id) { const ending=this.story.chapters.at(-1).endings?.find(item=>item.id===id);if(!ending)return;this.state.ending=id;this.save();this.render();this.showModal('The case is closed',`<span class="s6-eyebrow">${escapeHtml(ending.label)}</span><h2>${escapeHtml(ending.label)}</h2><p>${escapeHtml(ending.text)}</p><div class="s6-note">${escapeHtml(this.story.resolution?.finalNote||this.story.chapters.at(-1).clue)}</div>`,`<button class="s6-quiet" data-s6="close">Return to your case</button><button class="s6-quiet" data-s6="transcript">Conversation log</button>`); }
    showTranscript() { const entries=this.state.transcript.map(line=>`<article class="s6-note"><span class="s6-eyebrow">${escapeHtml(this.story.chapters[line.chapter]?.location||'Conversation')}</span><br><strong>${escapeHtml(line.speaker)}</strong><br>${escapeHtml(line.text)}</article>`).join('');const stack=!this.overlay.classList.contains('is-hidden');this.showModal('Conversation log',`<div class="s6-log-heading"><span class="s6-eyebrow">Saved conversation history</span><h2>Conversation log</h2></div>${entries?`<div class="s6-transcript" tabindex="0" aria-label="Conversation entries">${entries}</div>`:'<p>No conversations have been recorded yet.</p>'}`,`<button class="s6-quiet" data-s6="close">${stack?'Return to previous view':'Return to investigation'}</button>`,{stack}); }
    restartPrompt() { this.showModal('Restart this story?',`<span class="s6-eyebrow">${escapeHtml(this.story.title)}</span><h2>Begin this case again?</h2><p>This clears this story's clues, conversations, chapter progress, and ending from this browser. Your other stories are not affected.</p>`,`<button class="s6-restart s6-quiet" data-s6="restart-confirm">Restart this story</button><button class="s6-btn" data-s6="close">Keep my progress</button>`); }
    async restart() { await this.repository.clear(this.story.id);for(const key of [this.story.legacySaveKey,...(this.story.legacySaveKeys||[])])if(key)global.localStorage.removeItem(key);this.state=freshState();this.revision=0;this.savedAt=null;this.lastError=null;this.closeModal();this.render();if(this.story.openingIntroduction)this.showOpening(); }
    async exportSave() { const envelope={format:'metriva-story-save',schemaVersion:1,storyId:this.story.id,exportedAt:new Date().toISOString(),state:this.state};const blob=new Blob([JSON.stringify(envelope,null,2)],{type:'application/json'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`${this.story.id}-save.json`;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000); }
    importSavePicker() { const input=this.root.querySelector('#s6-import-file');if(input)input.click(); }
    async importSave(file) { try { const envelope=JSON.parse(await file.text());const current=envelope.format==='metriva-story-save'&&envelope.schemaVersion===1&&envelope.storyId===this.story.id;const legacy=this.story.legacySaveKey&&envelope.story===this.story.id&&envelope.state;const train=this.story.id==='midnight-train'&&envelope.format==='metriva-story03'&&envelope.state;if(!current&&!legacy&&!train)throw new Error('This save belongs to a different story or uses an unsupported version.');this.state=this.normalize(legacy||train?this.convertLegacySave(envelope.state):envelope.state);this.goToUnlockedChapter();await this.save();this.closeModal();this.render(); }catch(error){this.showModal('Save not imported',`<h2>Save not imported</h2><p>${escapeHtml(error.message)}</p>`,`<button class="s6-quiet" data-s6="close">Return to investigation</button>`);} }
    async onClick(event) {
      const file=event.target.closest('#s6-import-file');if(file&&file.files?.[0]){await this.importSave(file.files[0]);file.value='';return;}
      const control=event.target.closest('[data-s6]');if(!control)return;const action=control.dataset.s6,id=control.dataset.id;
      if(this.routeConfirming===this.current().puzzle.id&&action!=='close')return;
      switch(action){
        case 'chapter':{const index=Number(control.dataset.index);if(this.chapterUnlocked(index)){this.state.chapter=index;this.state.dialogue=null;await this.save();this.closeModal();this.render();global.scrollTo({top:0,behavior:'smooth'});}break;}
        case 'inspect':this.inspect(id,false,Boolean(control.closest('.s6-hotspot,.s6-scene')));break;
        case 'inspect-region':{
          const scene=control.closest('.s6-scene'),box=scene?.getBoundingClientRect();
          if(!box||event.detail===0){this.inspect(id,false,true);break;}
          const point={x:100*(event.clientX-box.left)/box.width,y:100*(event.clientY-box.top)/box.height};
          const selected=pickEvidenceAt(this.current(),point,item=>this.objectVisible(this.current(),item));
          if(selected)this.inspect(selected.id,false,true);
          break;
        }
        case 'zoom':this.zoomEvidence(id);break;
        case 'read-document':this.readDocument(id);break;
        case 'evidence-back':this.modalStack.length?this.closeModal():this.inspect(id);break;
        case 'doc-in':this.changeDocumentScale(.2);break;
        case 'doc-out':this.changeDocumentScale(-.2);break;
        case 'doc-reset':this.changeDocumentScale(1.3-this.documentScale);break;
        case 'zoom-in':this.changeZoom(.2);break;
        case 'zoom-out':this.changeZoom(-.2);break;
        case 'zoom-reset':this.resetZoom();break;
        case 'debug-toggle':this.debugOverlay=!this.debugOverlay;this.render();break;
        case 'character':this.openCharacter(id);break;
        case 'ask':{const d=this.state.dialogue,p=this.current().characters.find(person=>person.id===d?.characterId),q=p?.questions.find(question=>question.id===id);if(q&&this.condition(q.availableWhen||{always:true})){d.phase='exchange';d.questionId=id;d.line=0;d.recordedLine=null;await this.save();this.renderDialogue();}break;}
        case 'dialogue-next':this.nextDialogue();break;
        case 'dialogue-finish':this.finishDialogue();break;
        case 'transcript':this.showTranscript();break;
        case 'close':this.closeModal();break;
        case 'hint':this.showHint();break;
        case 'hint-step':this.showHint(Number(control.dataset.index));break;
        case 'hint-next':this.showHint(this.hintIndex+1);break;
        case 'hint-prev':this.showHint(this.hintIndex-1);break;
        case 'puzzle':this.showPuzzle();break;
        case 'route-select':await this.routeSelect(id);break;
        case 'route-undo':await this.routeUndo();break;
        case 'route-original':this.showOriginalRouteChart();break;
        case 'route-back':this.closeModal();break;
        case 'route-zoom-in':this.changeRouteZoom(.5);break;
        case 'route-zoom-out':this.changeRouteZoom(-.5);break;
        case 'route-zoom-reset':this.routeZoom=1;this.showPuzzle();break;
        case 'garden-select':await this.gardenSelect(id);break;
        case 'garden-undo':await this.gardenUndo();break;
        case 'garden-evidence':this.showGardenEvidence(id);break;
        case 'garden-back':this.closeModal();break;
        case 'garden-zoom-in':this.changeGardenZoom(.4);break;
        case 'garden-zoom-out':this.changeGardenZoom(-.4);break;
        case 'garden-zoom-reset':this.gardenZoom=1;this.gardenCenter={x:this.current().puzzle.presentation.image.width/2,y:this.current().puzzle.presentation.image.height/2};this.showPuzzle();break;
        case 'book-open':this.openBook(id);break;
        case 'play-voice':this.playVoice();break;
        case 'toggle-voices':this.toggleVoices();break;
        case 'toggle-motion':this.toggleMotion();break;
        case 'stop-voice':this.stopVoice();break;
        case 'books-pick':this.pickBook(id);break;
        case 'books-slot':await this.chooseBookSlot(Number(control.dataset.index));break;
        case 'books-handle':await this.pullBookHandle(id);break;
        case 'books-collect':if(this.state.bookSlipReady)this.solvePuzzle();break;
        case 'books-clue':this.inspect('cart',true);break;
        case 'puzzle-choice':this.puzzleChoice(id);break;
        case 'deduction-submit':this.deductionSubmit();break;
        case 'puzzle-evidence':this.inspect(id,true);break;
        case 'machine-select':await this.machineSelect(id);break;
        case 'machine-evidence':if(!this.machineryConfirming)this.inspect(id,true);break;
        case 'machine-remove':await this.machineSelect(id);break;
        case 'machine-up':await this.machineMove(Number(control.dataset.index),-1);break;
        case 'machine-down':await this.machineMove(Number(control.dataset.index),1);break;
        case 'machine-reset':{if(this.machineryConfirming)break;const p=this.current().puzzle;this.state.puzzleRouteSelections[p.id]=[];this.machineryFeedback='Plan cleared.';await this.save();this.showPuzzle();break;}
        case 'opening-begin':await this.beginOpening();break;
        case 'rescue-dialogue':this.showRescueDialogue();break;
        case 'edda-conversation':this.showEddaConversation();break;
        case 'edda-ask':this.showEddaExchange(Number(control.dataset.index));break;
        case 'edda-reply':this.showEddaExchange(Number(control.dataset.index),1);break;
        case 'edda-menu':this.showEddaConversation();break;
        case 'rescue-next':await this.nextRescueLine();break;
        case 'resolution-dialogue':this.showResolutionDialogue();break;
        case 'resolution-next':await this.nextResolutionLine();break;
        case 'sequence-select':{const index=Number(control.dataset.index);if(this.sequenceSelected===null){this.sequenceSelected=index;this.sequenceFeedback='Select the position where this card should go.';this.showPuzzle();this.overlay.querySelector(`[data-s6="sequence-select"][data-index="${index}"]`)?.focus();}else if(this.sequenceSelected===index){this.sequenceSelected=null;this.sequenceFeedback='Selection cleared.';this.showPuzzle();}else await this.moveSequence(this.sequenceSelected,index);break;}
        case 'move':{const index=Number(control.dataset.index);await this.moveSequence(index,index+Number(control.dataset.delta));break;}
        case 'puzzle-check':await this.puzzleCheck();break;
        case 'puzzle-reset':{const p=this.current().puzzle;if(p.presentation?.mode==='bookshelf'){this.state.bookshelfSlots=[null,null,null,null];this.state.bookSlipReady=false;this.bookSelection=null;this.bookFeedback='The four shelf positions are empty again.';}else if(isVisualRoute(p)){this.state.puzzleRouteSelections[p.id]=[];if(isGardenRoute(p))this.gardenFeedback='Route cleared. Choose a landmark on the map.';else this.routeFeedback='Route cleared. Select the first valve on the chart.';}else{this.state.puzzleDrafts[p.id]=p.items.map(item=>item.id);this.sequenceSelected=null;this.sequenceFeedback='Arrangement reset.';}await this.save();this.showPuzzle();break;}
        case 'continue':this.continueChapter();break;
        case 'ending':this.showEnding();break;
        case 'choose-ending':await this.chooseEnding(id);break;
        case 'ending-review':this.chooseEnding(this.state.ending);break;
        case 'restart':this.restartPrompt();break;
        case 'restart-confirm':await this.restart();break;
        case 'export':await this.exportSave();break;
        case 'import':this.importSavePicker();break;
      }
    }
  }

  async function boot(options) {
    const mount=options.mount||'#story-root',modal=options.modal||'#story-modal';
    try {
      const source=options.dataSource||new InlineJsonStorySource(document.querySelector('#story-definition').textContent);
      const story=validateDefinition(await source.load());
      return await new StoryRuntime({story,repository:options.repository||new LocalProgressRepository(),mount,modal}).start();
    } catch(error) {
      const root=document.querySelector(mount);if(root)root.innerHTML=`<section class="s6-error"><h1>Story could not be opened</h1><p>${escapeHtml(error.message)}</p><a href="index.html#catalog">Return to story library</a></section>`;
      console.error('[Metriva Story Engine]',error);return null;
    }
  }

  global.MetrivaStoryEngine={version:ENGINE_VERSION,boot,StoryRuntime,validateDefinition,validateSpatial,evaluateCondition,sceneImage,evidenceView,evidenceImageMarkup,documentMarkup,characterFrame,insertSequenceItem,toggleRouteSelection,routeCorrectPrefix,normalizeRouteSelection,findNetworkPath,applyObjectTransitions,normalizeObjectStates,pickEvidenceAt,InlineJsonStorySource,FetchJsonStorySource,LocalProgressRepository,ApiProgressRepository};
})(window);
