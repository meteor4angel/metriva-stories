// Build-time asset checks and an author-facing continuity report.
const fs = require('node:fs');
const path = require('node:path');

function imageDimensions(file) {
  const data=fs.readFileSync(file);
  if(data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return {width:data.readUInt32BE(16),height:data.readUInt32BE(20)};
  if(data.toString('ascii',0,4)==='RIFF'&&data.toString('ascii',8,12)==='WEBP'){
    const kind=data.toString('ascii',12,16);
    if(kind==='VP8X')return {width:1+data.readUIntLE(24,3),height:1+data.readUIntLE(27,3)};
    if(kind==='VP8L')return {width:1+(((data[22]&63)<<8)|data[21]),height:1+(((data[24]&15)<<10)|(data[23]<<2)|((data[22]&192)>>6))};
    if(kind==='VP8 ')return {width:data.readUInt16LE(26)&0x3fff,height:data.readUInt16LE(28)&0x3fff};
  }
  if(data[0]===0xff&&data[1]===0xd8){
    let offset=2;
    while(offset<data.length-9){
      if(data[offset]!==0xff){offset++;continue;}
      const marker=data[offset+1],size=data.readUInt16BE(offset+2);
      if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))return {width:data.readUInt16BE(offset+7),height:data.readUInt16BE(offset+5)};
      if(size<2)break;
      offset+=size+2;
    }
  }
  if(path.extname(file).toLowerCase()==='.svg'){
    const xml=data.toString('utf8');
    const tag=xml.match(/<svg\b[^>]*>/i)?.[0]||'';
    const width=Number(tag.match(/\bwidth=["']([\d.]+)/i)?.[1]);
    const height=Number(tag.match(/\bheight=["']([\d.]+)/i)?.[1]);
    if(width>0&&height>0)return {width,height};
    const viewBox=tag.match(/\bviewBox=["']([\d.\s-]+)["']/i)?.[1]?.trim().split(/\s+/).map(Number);
    if(viewBox?.length===4)return {width:viewBox[2],height:viewBox[3]};
  }
  throw new Error(`Cannot read image dimensions: ${file}`);
}

function checkAssets(story,root) {
  const errors=[];
  function check(src,expected,where){
    if(typeof src!=='string'||!src||/^\w+:/.test(src)||path.isAbsolute(src)){errors.push(`${where}: invalid asset path ${src}`);return;}
    const resolved=path.resolve(root,src);
    if(!resolved.startsWith(`${root}${path.sep}`)){errors.push(`${where}: asset escapes project (${src})`);return;}
    if(!fs.existsSync(resolved)){errors.push(`${where}: missing image ${src}`);return;}
    try{
      const actual=imageDimensions(resolved);
      if(expected&&(actual.width!==expected.width||actual.height!==expected.height))errors.push(`${where}: ${src} is ${actual.width}×${actual.height}, expected ${expected.width}×${expected.height}`);
    }catch(error){errors.push(`${where}: ${error.message}`);}
  }
  if(story.pageAppearance?.backgroundImage)check(story.pageAppearance.backgroundImage,null,'page background');
  for(const [state,src] of Object.entries(story.pageAppearance?.cursorTheme||{}))if(state!=='disabled')check(src,null,`${state} cursor`);
  for(const chapter of story.chapters){
    const spatial=chapter.spatial;
    check(chapter.scene,spatial?.master,`chapter ${chapter.id} master`);
    if(chapter.puzzle?.presentation?.mode==='timeline'){
      const sheet=chapter.puzzle.presentation.imageSheet;
      if(sheet)check(sheet.src,{width:sheet.width,height:sheet.height},`puzzle ${chapter.puzzle.id} sequence artwork`);
      for(const item of chapter.puzzle.items||[])if(item.image)check(item.image,null,`puzzle ${chapter.puzzle.id} item ${item.id}`);
    }
    for(const evidence of chapter.evidence||[])if(evidence.detailImage)check(evidence.detailImage,evidence.detailImageWidth&&evidence.detailImageHeight?{width:evidence.detailImageWidth,height:evidence.detailImageHeight}:null,`evidence ${evidence.id} detail`);
    if(chapter.puzzle?.presentation?.mode==='bookshelf'){
      const p=chapter.puzzle.presentation;check(p.shelfImage,null,`puzzle ${chapter.puzzle.id} shelf`);
      if(p.layout==='catalog-inspection')for(const [key,label] of [['solvedImage','solved shelf'],['parchmentImage','parchment'],['inspectionPanelImage','inspection panel'],['trayImage','book tray'],['openSheet','open-book sheet']])check(p[key],null,`puzzle ${chapter.puzzle.id} ${label}`);
      for(const item of p.candidates){check(item.spineImage,null,`book ${item.id} spine`);if(item.coverImage)check(item.coverImage,null,`book ${item.id} cover`);}
    }
    if(['interactive-route','garden-route'].includes(chapter.puzzle?.presentation?.mode))check(chapter.puzzle.presentation.image?.src,chapter.puzzle.presentation.image,`puzzle ${chapter.puzzle.id} artwork`);
    if(!spatial)continue;
    for(const variant of spatial.sceneVariants||[])check(variant.src,spatial.master,`chapter ${chapter.id} scene state`);
    for(const view of spatial.views){
      if(view.image)check(view.image.src,view.image,`view ${view.id} detail`);
      for(const variant of view.variants||[])check(variant.src,variant.width&&variant.height?variant:view.image||null,`view ${view.id} state`);
    }
  }
  for(const [id,src] of Object.entries(story.characterPortraits||{}))check(src,null,`character ${id} portrait`);
  for(const [id,sprite] of Object.entries(story.characterSprites||{})){
    const src=typeof sprite==='string'?sprite:sprite?.src;
    check(src,null,`character ${id} sprite`);
    if(typeof sprite==='object'&&sprite!==null){
      const count=sprite.columns*sprite.rows;
      if(!Number.isInteger(sprite.columns)||!Number.isInteger(sprite.rows)||sprite.columns<1||sprite.rows<1)errors.push(`character ${id} sprite: invalid grid`);
      if(!sprite.frames||Object.values(sprite.frames).some(frame=>typeof frame==='string'?!frame.trim():!Number.isInteger(frame)||frame<0||frame>=count))errors.push(`character ${id} sprite: invalid frame index or image path`);
      for(const [name,frame] of Object.entries(sprite.frames||{}))if(typeof frame==='string')check(frame,null,`character ${id} ${name} frame`);
      if(sprite.expressions){
        const base=fs.existsSync(path.join(root,src))?imageDimensions(path.join(root,src)):null;
        for(const [name,expression] of Object.entries(sprite.expressions)){
          check(expression.src,base,`character ${id} expression ${name}`);
          if(!Number.isInteger(expression.frame)||expression.frame<0||expression.frame>=count)errors.push(`character ${id} expression ${name}: invalid frame index`);
        }
      }
    }
  }
  for(const [line,src] of Object.entries(story.voiceMap||{}))if(typeof src!=='string'||!src.startsWith('assets/voices/')||!fs.existsSync(path.join(root,src)))errors.push(`voice ${line}: missing or invalid audio ${src}`);
  return errors;
}

function overlap(a,b) { return a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y; }
function formatRect(rect) { return `${rect.x}, ${rect.y}, ${rect.width}×${rect.height}%`; }

function report(story) {
  const lines=[`# ${story.title} — visual continuity report`,'',`Definition: \`stories/story-${String(story.number).padStart(2,'0')}.json\` · Spatial manifest v1 · ${story.chapters.length} scenes`,'','All rectangles use percentages of the uncropped master image. This report checks metadata and geometry; a human must still compare the artwork.',''];
  for(const chapter of story.chapters){
    const spatial=chapter.spatial;
    lines.push(`## ${chapter.location} (${chapter.id})`,'');
    if(!spatial){lines.push(`Legacy scene: \`${chapter.scene}\` (no spatial manifest).`,'');continue;}
    lines.push(`- Master: \`${spatial.master.src}\` (${spatial.master.width}×${spatial.master.height})`,`- Layout: ${spatial.environment.layout}`,`- Lighting: ${spatial.environment.lighting}`,`- Landmarks: ${spatial.environment.landmarks.join('; ')}`,'','| Physical object | Footprint x, y, width×height | Depth / layer | Surface / material | Nearby | States |','|---|---|---|---|---|---|');
    for(const object of spatial.objects)lines.push(`| ${object.id} | ${formatRect(object.footprint)} | ${object.depth} / ${object.layer} | ${object.support} / ${object.material} | ${object.nearby?.join(', ')||'—'} | ${Object.keys(object.states).join(', ')} |`);
    lines.push('');
    for(const object of spatial.objects)lines.push(`- **${object.name}**: ${object.appearance}`);
    lines.push('','| Clue | Marker x,y | Inspection region | View frame | Visible objects | Detail source |','|---|---|---|---|---|---|');
    for(const clue of chapter.evidence){
      const view=spatial.views.find(candidate=>candidate.id===clue.viewId);
      lines.push(`| ${clue.title} | ${clue.position.x}, ${clue.position.y}% | ${clue.inspectionRegion?formatRect(clue.inspectionRegion):'marker only'} | ${view?formatRect(view.frame):'missing'} | ${view?.visibleObjectIds.join(', ')||'missing'} | ${view?.image?.src||'master crop'} |`);
    }
    const overlaps=[];
    for(let i=0;i<chapter.evidence.length;i++)for(let j=i+1;j<chapter.evidence.length;j++){
      const a=chapter.evidence[i],b=chapter.evidence[j];
      if(a.inspectionRegion&&b.inspectionRegion&&overlap(a.inspectionRegion,b.inspectionRegion)){
        const first=spatial.objects.find(object=>object.id===a.objectId),second=spatial.objects.find(object=>object.id===b.objectId);
        const related=first?.nearby?.includes(second?.id)&&second?.nearby?.includes(first?.id);
        overlaps.push(`${a.id} ↔ ${b.id}${related?' (declared nearby)':' (screen overlap only; review depth and framing)'}`);
      }
    }
    const omissions=[];
    for(const view of spatial.views)for(const object of spatial.objects){
      if(overlap(view.frame,object.footprint)&&!view.visibleObjectIds.includes(object.id))omissions.push(`${view.id} ↔ ${object.id}${view.continuityException?' (approved exception)':' (review occlusion/depth)'}`);
    }
    lines.push('',`Overlapping inspection regions: ${overlaps.join('; ')||'none'}.`,`Potentially visible objects omitted from views: ${omissions.join('; ')||'none'}.`,'');
  }
  lines.push('## Manual visual-review checklist','','- Compare each close-up against its master for furniture, object identity, orientation, damage, and light direction.','- Check that each neighboring object listed as visible genuinely falls inside the view and has the same physical relationship.','- Check overlap warnings against actual depth; a 2D overlap does not prove adjacency.','- Test scene and clue state variants before and after interaction, refresh, export, and import.','- Open the playable page with `?visual-debug=1` to overlay object footprints (teal), inspection regions (orange), and view frames (yellow).','');
  return lines.join('\n');
}

module.exports={imageDimensions,checkAssets,report};
