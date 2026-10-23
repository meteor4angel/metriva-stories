// Keep JSON authoritative while supporting classic script loading from file://.
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const source=path.join(root,'public/assets/welcome/welcome-experience.json');
const target=path.join(root,'public/assets/welcome/welcome-config.js');
const config=JSON.parse(fs.readFileSync(source,'utf8').replace(/^\uFEFF/,''));
const output='// Generated from welcome-experience.json. Run node scripts/sync-welcome-config.js after editing JSON.\nwindow.METRIVA_WELCOME_CONFIG = '+JSON.stringify(config,null,2)+';\n';
if(process.argv.includes('--check')){
 if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==output)throw Error('Welcome config is stale; run node scripts/sync-welcome-config.js');
}else{fs.writeFileSync(target,output);console.log('Synced public/assets/welcome/welcome-config.js');}
