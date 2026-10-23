#!/usr/bin/env node
// Checks canonical conversations and the scripts actually displayed by the shared engine.
const fs=require('node:fs'),path=require('node:path');
const normalize=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function audit(root=path.resolve(__dirname,'..')){
 const stories=Array.from({length:7},(_,i)=>JSON.parse(fs.readFileSync(path.join(root,'stories',`story-0${i+1}.json`),'utf8')));
 global.window=global;require(path.join(root,'js/days-conversations.js'));stories[4].conversationScript=global.DAYS_CONVERSATIONS;
 const topics=[],spoken=[],drift=[];
 for(const story of stories)for(const [ci,chapter]of story.chapters.entries()){
  const loc={story:story.number,chapter:ci+1};
  for(const person of chapter.characters){
   if(person.intro&&!story.conversationScript?.[ci]?.opening?.some(line=>line.speaker===person.id&&normalize(line.text)===normalize(person.intro)))spoken.push({...loc,character:person.id,kind:'intro',text:person.intro});
   const scripts=story.conversationScript?.[ci]?.topics?.filter(t=>t.focus===person.id);
   person.questions.forEach((q,qi)=>{
    const row={...loc,character:person.id,question:q.id};topics.push({...row,text:['ask','reply','followUp','followReply'].map(k=>normalize(q[k])).join('|')});
    if(!story.conversationScript?.[ci])for(const key of ['ask','reply','followUp','followReply'])spoken.push({...row,kind:key,text:q[key]});
    if(story.number===7){const lines=scripts?.[qi]?.lines;for(const [li,key]of ['ask','reply','followUp','followReply'].entries())if(normalize(lines?.[li]?.text)!==normalize(q[key]))drift.push({...row,field:key});}
   });
  }
  const script=story.conversationScript?.[ci];
  if(script){for(const [i,line]of script.opening.entries())spoken.push({...loc,kind:'opening',line:i,speaker:line.speaker,text:line.text});for(const [ti,t]of script.topics.entries())for(const [li,line]of t.lines.entries())spoken.push({...loc,kind:'script',topic:ti,line:li,speaker:line.speaker,text:line.text});}
 }
 function duplicates(rows,key){const groups=new Map;for(const row of rows){const k=key(row);if(!k)continue;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(row);}return [...groups.values()].filter(g=>g.length>1);}
 return {stories:stories.length,chapters:stories.reduce((n,s)=>n+s.chapters.length,0),topics:topics.length,spokenLines:spoken.length,duplicateTopics:duplicates(topics,r=>r.text),duplicateSpokenLines:duplicates(spoken,r=>normalize(r.text)),scriptDrift:drift};
}
module.exports={audit,normalize};
if(require.main===module){const result=audit();console.log(JSON.stringify(result,null,2));if(result.duplicateTopics.length||result.duplicateSpokenLines.length||result.scriptDrift.length)process.exitCode=1;}
