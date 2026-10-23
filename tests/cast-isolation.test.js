const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
global.window=global;require('../js/story-engine.js');
const story=require('../stories/story-07.json'),root=path.resolve(__dirname,'..');

function transparentMargin(png,margin){
  const w=png.readUInt32BE(16),h=png.readUInt32BE(20);assert.equal(png[25],6,'isolated frames retain RGBA transparency');
  const chunks=[];
  for(let at=8;at<png.length;){const size=png.readUInt32BE(at),type=png.toString('ascii',at+4,at+8);if(type==='IDAT')chunks.push(png.subarray(at+8,at+8+size));at+=size+12;}
  const raw=zlib.inflateSync(Buffer.concat(chunks)),stride=w*4;let previous=Buffer.alloc(stride),offset=0;
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
  for(let y=0;y<h;y++){
    const filter=raw[offset++],row=Buffer.alloc(stride);
    for(let i=0;i<stride;i++){
      const a=i>=4?row[i-4]:0,b=previous[i],c=i>=4?previous[i-4]:0;
      row[i]=(raw[offset++]+(filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):filter===4?paeth(a,b,c):0))&255;
    }
    for(let x=0;x<w;x++)if(x<margin||x>=w-margin||y<margin||y>=h-margin)assert.equal(row[x*4+3],0,`transparent frame margin at ${x},${y}`);
    previous=row;
  }
}

test('every Lena, Jonah, Poppy and Alden pose is 512px with a clear margin on all four sides',()=>{
  for(const id of ['lena','jonah','poppy','alden'])for(const file of story.characterSprites[id].frameFiles){
    const png=fs.readFileSync(path.join(root,file));
    assert.equal(png.readUInt32BE(16),512);assert.equal(png.readUInt32BE(20),512);
    transparentMargin(png,20);
  }
});

test('a requested expression initially renders its own file, without the atlas or an idle flash',()=>{
  const runtime=Object.create(global.MetrivaStoryEngine.StoryRuntime.prototype);runtime.story=story;
  for(const id of ['lena','jonah','poppy','alden']){
    const image=story.characterSprites[id].frames.speaking;
    const html=runtime.portrait({id,name:id,expression:'speaking'},'s6-conversation-portrait');
    assert.ok(html.includes(image));assert.ok(html.includes('background-size:contain'));
    assert.ok(!html.includes(`${id}-expressions.png`));
    const art={classList:{toggle(){}}},actor={dataset:{spriteId:id,expression:'speaking'},style:{},closest:()=>art};
    runtime.overlay={lastElementChild:{querySelector:()=>actor}};runtime.motionPaused=false;
    runtime.startCharacterAnimation();
    assert.equal(actor.style.backgroundImage,`url("${image}")`);
    assert.equal(actor.style.backgroundSize,'contain');
    assert.equal(actor.style.backgroundPosition,'center bottom');
  }
});
