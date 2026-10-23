#!/usr/bin/env node
// Builds a local-file-friendly HTML page from the canonical JSON story definition.
const fs = require('node:fs');
const path = require('node:path');
const {checkAssets,report}=require('./story-visual-continuity.js');

const root = path.resolve(__dirname, '..');
const id = process.argv[2];
if (!id) {
  console.error('Usage: node scripts/build-story-page.js <story-id>');
  process.exit(2);
}
const templatePath = path.join(root, 'templates', 'story-page.html');
const jsonFiles = fs.readdirSync(path.join(root, 'stories')).filter(name=>name.endsWith('.json'));
const match = jsonFiles.map(name=>({file:path.join(root,'stories',name),definition:JSON.parse(fs.readFileSync(path.join(root,'stories',name),'utf8'))})).find(entry=>entry.definition.id===id||path.parse(entry.file).name===id);
if (!match) throw new Error(`No JSON story definition found for "${id}" in stories/.`);
const {file:jsonPath,definition}=match;
if (!definition.id || !Number.isInteger(definition.number)) throw new Error(`Story id/number is invalid in ${jsonPath}`);
global.window=globalThis;
if(definition.id==='days-we-almost-met'){
  require('../js/days-conversations.js');
  definition.conversationScript=globalThis.DAYS_CONVERSATIONS;
}
require('../js/story-engine.js');
global.MetrivaStoryEngine.validateDefinition(definition);
const assetErrors=checkAssets(definition,root);
if(assetErrors.length)throw new Error(`Visual asset validation failed:\n• ${assetErrors.join('\n• ')}`);
const missingVoiceAssets=Object.values(definition.voiceMap||{}).filter(src=>!fs.existsSync(path.join(root,src)));
if(missingVoiceAssets.length)throw new Error(`Voice asset validation failed; missing MP3 files:\n• ${[...new Set(missingVoiceAssets)].join('\n• ')}`);
const escapedJson = JSON.stringify(definition)
  .replace(/</g, '\\u003c')
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029');
let html = fs.readFileSync(templatePath, 'utf8')
  .replaceAll('__TITLE__', definition.title.replace(/[&<>"']/g, ''))
  .replace('__STORY_JSON__', escapedJson);
if(definition.companion?.scenePet){
  html=html.replace('<script src="js/story-engine.js', '<script src="js/scene-companion.js?v=story7-gold-progress-20261023"></script>\n  <script src="js/story-engine.js');
  html=html.replace('css/story-engine.css?v=story7-gold-progress-20261023','css/story-engine.css?v=story7-gold-progress-20261023');
  html=html.replace('js/story-engine.js?v=story7-gold-progress-20261023','js/story-engine.js?v=story7-gold-progress-20261023');
}
const outputPath = path.join(root, `story-${String(definition.number).padStart(2, '0')}.html`);
fs.writeFileSync(outputPath, html, 'utf8');
if(definition.legacyPage){
  if(!/^[a-z0-9-]+\.html$/.test(definition.legacyPage))throw new Error('legacyPage must be a simple HTML filename.');
  fs.writeFileSync(path.join(root,definition.legacyPage),html,'utf8');
}
const reportPath=path.join(root,'reports',`story-${String(definition.number).padStart(2,'0')}-visual-continuity.md`);
fs.mkdirSync(path.dirname(reportPath),{recursive:true});
fs.writeFileSync(reportPath,report(definition),'utf8');
console.log(`Built ${path.relative(root, outputPath)} from ${path.relative(root, jsonPath)}`);
console.log(`Wrote ${path.relative(root,reportPath)}`);
