import { DEFAULTS, sanitizeConfig, StageSimulation } from './physics.js';
import { StageView } from './scene.js';
import { getLanguage, setLanguage, t, translateDOM, formatNumber } from './i18n.js';

import { AudioPlayer } from './audio.js';

const $=id=>document.getElementById(id);
const STORAGE='ghostlight-stage-v1';
let view,sim,activeTab='rig',jawTest=false,jaw=0,audioPlayer,toastTimer,lastToast;
const nf=(n,d=2)=>formatNumber(n,d);
const formNumber=n=>Number(n).toFixed(2);
function toast(message,vars={}){lastToast={message,vars};$('toast').textContent=t(message,vars);$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4200);}
function download(data,name,type='application/octet-stream'){
  const blob=data instanceof Blob?data:new Blob([data],{type});const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function snapshot(){return {schema:'ghostlight-stage/v1',language:getLanguage(),units:'metres-kilograms-seconds',config:{...sim.config,initialHeight:sim.driver.height},camera:{position:view.camera.position.toArray(),target:view.controls.target.toArray()}};}
function configFromObject(data){if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Choose a Ghostlight configuration JSON file.');if(data.schema&&data.schema!=='ghostlight-stage/v1')throw Error('This configuration version is not supported.');const raw=data.config||data;if(!Object.keys(raw).some(k=>k in DEFAULTS))throw Error('No recognised stage settings in this file.');return sanitizeConfig(raw);}
function initialConfig(){
  try{if(location.hash.startsWith('#setup=')){const text=decodeURIComponent(escape(atob(location.hash.slice(7))));return configFromObject(JSON.parse(text));}}
  catch{setTimeout(()=>toast('The shared setup could not be read. Default scene loaded.'),500);return {...DEFAULTS};}
  try{const stored=localStorage.getItem(STORAGE);if(stored)return configFromObject(JSON.parse(stored));}catch{}
  return {...DEFAULTS};
}
function persist(){try{localStorage.setItem(STORAGE,JSON.stringify(snapshot()));}catch{}}

const number=(key,label,min,max,step=0.1,unit='m',scale=1)=>({key,label,min,max,step,unit,scale});
const toggle=(key,label)=>({key,label,type:'checkbox'});
const select=(key,label,options)=>({key,label,type:'select',options});
const PANELS={
  rig:[
    {title:'Mechanism',custom:'mechanism'},
    {title:'Vertical travel',fields:[number('topHeight','Highest head centre',1,9.4,.05),number('bottomHeight','Lowest head centre',.65,8.8,.05),number('micOffset','Mic offset from mouth',-.7,.7,.01)],custom:'height',note:'Travel limits are measured above the deck. The microphone follows the mouth height as the head tilts.'},
    {title:'Motion profile',fields:[number('downSpeed','Descent speed',1,80,.5,'mm/s',1000),number('upSpeed','Return speed',5,200,1,'mm/s',1000),number('acceleration','Acceleration',5,200,1,'mm/s²',1000),number('holdDuration','Bottom hold',0,120,1,'s')],custom:'duration'},
    {title:'Boom geometry',fields:[number('boomLength','Pivot to tip',1,7,.05)],note:'In boom mode the head follows an arc. The pivot is derived from travel limits; the microphone stays on its own vertical path.'}
  ],
  stage:[
    {title:'The space',fields:[number('stageWidth','Stage width',6,18,.25),number('stageDepth','Stage depth',4,14,.25),number('deckHeight','Deck above floor',0,1.5,.05),number('rigHeight','Rigging above deck',3.5,10,.1)]},
    {title:'Head suspension position',fields:[number('headX','Left / right · X',-7,7,.05),number('headZ','Front / back · Z',-5,5,.05)],note:'Positive X is audience-right. Positive Z faces the audience. In boom mode these coordinates set the upper endpoint.'},
    {title:'Microphone position',fields:[number('micX','Left / right · X',-7,7,.05),number('micZ','Front / back · Z',-5,5,.05)]},
    {title:'Performer reference',fields:[toggle('actorVisible','Show performer'),number('actorHeight','Performer height',1,2.2,.01),number('actorX','Left / right · X',-7,7,.05),number('actorZ','Front / back · Z',-5,5,.05)]},
    {title:'Presentation',fields:[select('lightPreset','Stage lighting',[['midnight','Midnight'],['warm','Warm theatre'],['worklight','Work lights']]),toggle('labels','Object labels'),toggle('grid','Deck grid'),toggle('engineering','Cutaway view')]}
  ],
  head:[
    {title:'The floating head',fields:[number('headScale','Head size',.6,1.8,.05,'×'),number('headMass','Moving head mass',.2,8,.1,'kg'),number('micMass','Mic + moving cable',.05,2,.05,'kg')],note:'The foam mannequin has a smooth face and a hinged lower jaw.'},
    {title:'Expression',fields:[number('topTilt','Pitch at the top',-60,30,1,'°'),number('bottomTilt','Pitch at the bottom',-20,70,1,'°'),number('jawAngle','Maximum jaw opening',0,45,1,'°')],note:'Negative pitch looks up; positive pitch looks down. The pitch follows actual head height.',custom:'jaw'},
    {title:'Voice synchronisation',custom:'audio',note:'A local audio file can drive the jaw from its volume. Enable Drive jaw in the audio player.'},
    {title:'Internal light',fields:[{key:'ledColor',label:'LED colour',type:'color'},number('ledBrightness','Brightness',0,100,5,'%',100),toggle('colorCycle','Slow colour cycle')]}
  ],
  physics:[
    {title:'Pendulum model',fields:[number('gravity','Gravity',1,15,.1,'m/s²'),number('damping','Velocity damping',0,2,.05,'1/s'),toggle('collisions','Payload collisions')],note:'Gravity, variable-length rope constraints and moving anchors. Head and mic are point masses with spherical contact envelopes; the performer is a cylinder.'},
    {title:'Manual pendant',custom:'manual',note:'Hold a button to move; release to hold. The emergency stop latches until you reset it. All controls here are simulation only.'},
    {title:'Load estimates',custom:'load',note:'Line loads are approximate pendulum loads. No structural deflection, rope stretch, brake dynamics, motor losses, rigging capacity or compliance calculation is included.'},
    {title:'Disturbance test',custom:'nudge',note:'Apply a 0.38 N·s sideways impulse to the head. Compare damping, head mass and changing cable length.'}
  ]
};
function fieldHTML(f){
  const id='field-'+f.key,c=sim.config;let control;
  if(f.type==='checkbox')control=`<input id="${id}" data-param="${f.key}" type="checkbox" ${c[f.key]?'checked':''}>`;
  else if(f.type==='select')control=`<select id="${id}" data-param="${f.key}">${f.options.map(([v,l])=>`<option value="${v}" ${c[f.key]===v?'selected':''}>${t(l)}</option>`).join('')}</select>`;
  else if(f.type==='color')control=`<input id="${id}" data-param="${f.key}" type="color" value="${c[f.key]}">`;
  else{const val=Math.round(c[f.key]*f.scale*10000)/10000;control=`<span class="number-wrap"><input id="${id}" data-param="${f.key}" data-scale="${f.scale}" type="number" min="${f.min}" max="${f.max}" step="${f.step}" value="${val}" inputmode="decimal"><span>${f.unit}</span></span>`;}
  return `<div class="control-row"><label for="${id}">${t(f.label)}</label>${control}</div>`;
}
function customHTML(kind){
  const c=sim.config;
  if(kind==='mechanism')return `<div class="mechanism-picker"><button data-mechanism="vertical" class="${c.mechanism==='vertical'?'active':''}" aria-pressed="${c.mechanism==='vertical'}">${t('╎ Suspended')}</button><button data-mechanism="boom" class="${c.mechanism==='boom'?'active':''}" aria-pressed="${c.mechanism==='boom'}">${t('⌁ Pivoting boom')}</button></div><p class="control-note">${t('One shared height command. Independent jaw and head pitch.')}</p>`;
  if(kind==='duration')return `<p class="control-note" id="duration-note"></p>`;
  if(kind==='height')return `<div class="control-row"><label for="pose-height">${t('Current head centre')}</label><span class="number-wrap"><input id="pose-height" type="number" value="${formNumber(sim.driver.height)}" min="${c.bottomHeight}" max="${c.topHeight}" step="0.01" inputmode="decimal"><span>m</span></span></div>`;
  if(kind==='jaw')return `<button id="jaw-test" class="button wide-button" aria-pressed="${jawTest}">${t(jawTest?'Stop jaw test':'Animate jaw')}</button>`;
  if(kind==='audio')return `<button id="head-audio" class="button wide-button">${t('Audio player')}</button>`;
  if(kind==='manual')return `<div class="manual-controls"><button data-manual="up" class="button">${t('↑ Hold to raise')}</button><button data-manual="down" class="button">${t('↓ Hold to lower')}</button></div>`;
  if(kind==='load')return `<div class="metric-note"><span class="control-note">${t('Suspended mass, head + microphone')}</span><strong id="mass-note"></strong><span class="control-note">${t('Peak estimated combined line load')}</span><strong id="peak-note"></strong><span class="control-note">${t('Boom payload moment, before counterweight')}</span><strong id="moment-note"></strong></div>`;
  if(kind==='nudge')return `<button id="physics-nudge" class="button wide-button">${t('↝ Apply sideways impulse')}</button>`;
  return '';
}
function buildPanel(){
  $('settings-content').innerHTML=PANELS[activeTab].map(s=>`<section class="control-section"><h2 class="section-heading">${t(s.title)}</h2>${(s.fields||[]).map(fieldHTML).join('')}${s.custom?customHTML(s.custom):''}${s.note?`<p class="control-note">${t(s.note)}</p>`:''}</section>`).join('');
  document.querySelectorAll('[data-param]').forEach(input=>input.addEventListener('change',()=>{
    const val=input.type==='checkbox'?input.checked:input.type==='number'?Number(input.value)/Number(input.dataset.scale):input.value;
    if(input.type==='number'&&(input.value.trim()===''||!Number.isFinite(val))){buildPanel();return;}
    setParam(input.dataset.param,val);
  }));
  document.querySelectorAll('[data-mechanism]').forEach(b=>b.onclick=()=>setParam('mechanism',b.dataset.mechanism));
  if($('jaw-test'))$('jaw-test').onclick=()=>{jawTest=!jawTest;buildPanel();};
  if($('pose-height'))$('pose-height').onchange=e=>{const value=Number(e.target.value);if(sim.driver.latched){toast('Reset the simulated stop before seeking a pose.');buildPanel();return;}if(e.target.value.trim()&&Number.isFinite(value)){sim.seek(value);persist();}buildPanel();};
  if($('head-audio'))$('head-audio').onclick=()=>audioPlayer.open();
  if($('physics-nudge'))$('physics-nudge').onclick=nudge;
  document.querySelectorAll('[data-manual]').forEach(b=>{
    const start=e=>{e.preventDefault();if(e.pointerId!==undefined)b.setPointerCapture(e.pointerId);command(b.dataset.manual);};
    const end=()=>{if(['up','down'].includes(sim.driver.phase))command('hold');};
    b.addEventListener('pointerdown',start);b.addEventListener('pointerup',end);b.addEventListener('pointercancel',end);b.addEventListener('lostpointercapture',end);
    b.addEventListener('keydown',e=>{if((e.code==='Space'||e.code==='Enter')&&!e.repeat)start(e);});b.addEventListener('keyup',end);b.addEventListener('blur',end);
  });
  updateDuration();
}
const GEOMETRY_KEYS=new Set(['stageWidth','stageDepth','deckHeight','rigHeight','topHeight','bottomHeight','headX','headZ','micX','micZ','boomLength','mechanism','headScale','micOffset','actorX','actorZ','actorHeight']);
function setParam(key,value){
  const next=sanitizeConfig({...sim.config,[key]:value});
  if(GEOMETRY_KEYS.has(key)){sim.configure(next);view.build(next);}
  else{sim.config=next;sim.head.mass=next.headMass;sim.mic.mass=next.micMass;if(key==='lightPreset')view.setLighting(next.lightPreset);view.setVisibility(next);}
  syncUI();buildPanel();persist();
}
function syncUI(){
  $('mechanism-label').textContent=t(sim.config.mechanism==='boom'?'COUNTERBALANCED BOOM':'VERTICAL SUSPENSION');
  $('grid-button').setAttribute('aria-pressed',sim.config.grid);$('cutaway-button').setAttribute('aria-pressed',sim.config.engineering);
  $('preview-rate').value=String(sim.config.previewSpeed);if(!$('preview-rate').value){const o=new Option(`${sim.config.previewSpeed}×`,sim.config.previewSpeed);$('preview-rate').add(o);$('preview-rate').value=String(sim.config.previewSpeed);}
  $('actor-label').textContent=t('PERFORMER · {height} m',{height:nf(sim.config.actorHeight)});
  $('performer-button').textContent=t(sim.config.actorVisible?'Hide performer':'Show performer');
  $('performer-button').setAttribute('aria-pressed',String(!sim.config.actorVisible));
  $('settings-toggle').textContent=t($('settings').classList.contains('open')?'Close':'Settings');
  $('model-note').textContent=t(view.software?'Software 3D · simplified lighting · concept physics':'Concept physics · not structural validation');
}
function refreshLanguage(code=getLanguage()){
  const scroll=$('settings-content').scrollTop;setLanguage(code);translateDOM(document);
  document.title=t('Ghostlight — Stage Lab');
  const meta=document.querySelector('meta[name="description"]');meta.content=t('Explore a floating animatronic head and descending microphone on an editable 3D theatre stage. A motion and clearance study built with Three.js.');
  $('language-select').value=getLanguage();buildPanel();$('settings-content').scrollTop=scroll;syncUI();updateTelemetry();audioPlayer.localize();view.dirty=true;
  $('export-button').textContent=t($('export-button').disabled?'Exporting…':'Export ↓');
  if(!$('toast').hidden&&lastToast)$('toast').textContent=t(lastToast.message,lastToast.vars);
}
function command(mode){if(!sim.driver.command(mode))toast('Reset the simulated emergency stop before moving.');}
function nudge(){sim.head.impulse(.38,.14);toast('Sideways impulse applied to the head. Use 1× to inspect real-time sway.');}
function timeText(seconds,decimals=false){const minutes=Math.floor(seconds/60);const sec=seconds%60;return `${String(minutes).padStart(2,'0')}:${decimals?nf(sec,1).padStart(4,'0'):String(Math.floor(sec)).padStart(2,'0')}`;}
function updateDuration(){const c=sim.config,d=c.topHeight-c.bottomHeight;if($('duration-note'))$('duration-note').textContent=t('{distance} m travel · descent ≈ {down} · return ≈ {up} at real time, plus ramps.',{distance:nf(d),down:timeText(d/c.downSpeed),up:timeText(d/c.upSpeed)});}
function updateTelemetry(){
  const m=sim.metrics(),c=sim.config;
  $('metric-height').innerHTML=`${nf(sim.head.p.y)}<small> m</small>`;
  $('metric-error').innerHTML=`${nf(Math.abs(m.heightError)*1000,0)}<small> mm</small>`;
  $('metric-sway').innerHTML=`${nf(m.sway,1)}<small>°</small>`;
  $('metric-tension').innerHTML=`${nf(m.tension,1)}<small> N</small>`;
  $('metric-clearance').innerHTML=Number.isFinite(m.clearance)?`${nf(Math.max(0,m.clearance))}<small> m</small>`:'—';
  $('head-height-label').textContent=`${nf(sim.head.p.y)} m`;
  $('elapsed').textContent=timeText(sim.driver.elapsed,true);
  const names={hold:'Standby',down:'Descending',up:'Returning',dwell:'Holding below'};
  $('phase-name').textContent=t(sim.driver.latched?'Stop latched':names[sim.driver.phase]||'Standby');
  $('travel-readout').textContent=`${nf(sim.driver.height)} m`;
  if($('pose-height')&&document.activeElement!==$('pose-height'))$('pose-height').value=formNumber(sim.driver.height);
  $('height-scrub').value=String((c.topHeight-sim.driver.height)/(c.topHeight-c.bottomHeight)*1000);
  const status=$('condition'),label=$('condition-text');status.className='condition';
  if(sim.driver.latched){status.classList.add('danger');label.textContent='Stop latched';}
  else if(m.contact){status.classList.add('danger');label.textContent='Contact detected';}
  else if(m.outside){status.classList.add('warning');label.textContent='Outside deck';}
  else if(m.clearance<.15){status.classList.add('warning');label.textContent='Close clearance';}
  else if(Math.abs(m.heightError)>.05){status.classList.add('warning');label.textContent='Height mismatch';}
  else label.textContent=sim.driver.phase==='hold'?'Lift holding':'Motion active';
  label.textContent=t(label.textContent);
  if($('mass-note'))$('mass-note').textContent=`${nf(c.headMass+c.micMass)} kg`;
  if($('peak-note'))$('peak-note').textContent=`${nf(sim.peakTension,1)} N`;
  if($('moment-note'))$('moment-note').textContent=c.mechanism==='boom'?`${nf(m.payloadMoment,1)} N·m`:t('Boom not active');
  $('emergency-button').classList.toggle('latched',sim.driver.latched);$('emergency-button').textContent=t(sim.driver.latched?'↻ Reset stop':'■ STOP');
}
function applySnapshot(data){
  const next=configFromObject(data);sim=new StageSimulation(next);view.build(next);
  const cam=data.camera;const valid=a=>Array.isArray(a)&&a.length===3&&a.every(v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<100);
  if(cam&&valid(cam.position)&&valid(cam.target)){view.camera.position.set(...cam.position);view.controls.target.set(...cam.target);view.controls.update();}
  refreshLanguage(data.language||getLanguage());persist();
}
async function exportKind(kind){
  $('export-menu').hidden=true;
  try{
    if(kind==='help'){$('help-dialog').showModal();return;}
    if(kind==='config')download(JSON.stringify(snapshot(),null,2),'ghostlight-setup.json','application/json');
    if(kind==='csv'){
      const rows=sim.trace.length?sim.trace:[sim.sample()];const keys=Object.keys(rows[0]);
      download(keys.join(',')+'\n'+rows.map(r=>keys.map(k=>Number(r[k]).toFixed(6)).join(',')).join('\n'),'ghostlight-motion.csv','text/csv');
      toast('Exported {count} samples. SI units; sample period ≈ 0.1 s.',{count:nf(rows.length,0)});
    }
    if(kind==='glb'){$('export-button').disabled=true;$('export-button').textContent=t('Exporting…');try{const data=await view.exportGLB(message=>{toast(message);$('export-button').dataset.progress=message;});download(data,'ghostlight-stage.glb','model/gltf-binary');toast('3D scene exported. This captures the current pose.');}finally{$('export-button').disabled=false;$('export-button').textContent=t('Export ↓');}}
    if(kind==='png'){const blob=await view.capturePNG();if(blob)download(blob,'ghostlight-stage.png','image/png');else throw Error('Could not encode the current view.');}
    if(kind==='freecad'){const template=await fetch(new URL('../cad/GhostlightStage.FCMacro',import.meta.url));if(!template.ok)throw Error('FreeCAD template unavailable.');const text=await template.text();const embedded='EMBEDDED_CONFIG = json.loads('+JSON.stringify(JSON.stringify(snapshot()))+')';download(text.replace('EMBEDDED_CONFIG = None',embedded),'GhostlightStage.FCMacro','text/x-python');toast('FreeCAD macro exported with your current dimensions and pose.');}
  }catch(e){console.error(e);toast('Export failed: {error}',{error:t(e.message)});}
}
function wireEvents(){
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{activeTab=b.dataset.tab;document.querySelectorAll('[data-tab]').forEach(el=>{el.classList.toggle('active',el===b);el.setAttribute('aria-selected',el===b);});buildPanel();$('settings-content').scrollTop=0;});
  document.querySelectorAll('[data-camera]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-camera]').forEach(el=>el.classList.toggle('active',el===b));view.cameraView(b.dataset.camera,sim);});
  document.querySelectorAll('[data-command]').forEach(b=>b.onclick=()=>command(b.dataset.command));
  $('run-button').onclick=()=>command('cycle');$('nudge-button').onclick=nudge;
  $('emergency-button').onclick=()=>{if(sim.driver.latched){sim.driver.rearm();toast('Stop reset. The lift remains on hold.');}else{sim.driver.emergency();audioPlayer.pause();toast('Simulated stop latched. Drive motion stopped; residual sway continues.');}};
  $('height-scrub').addEventListener('input',e=>{if(sim.driver.latched)return;const c=sim.config;sim.seek(c.topHeight-(c.topHeight-c.bottomHeight)*Number(e.target.value)/1000);});
  $('height-scrub').addEventListener('change',persist);
  $('preview-rate').onchange=e=>{sim.config.previewSpeed=Number(e.target.value);persist();};
  $('grid-button').onclick=()=>setParam('grid',!sim.config.grid);
  $('cutaway-button').onclick=()=>setParam('engineering',!sim.config.engineering);
  $('performer-button').onclick=()=>setParam('actorVisible',!sim.config.actorVisible);
  $('language-select').onchange=e=>{refreshLanguage(e.target.value);persist();};
  $('close-help').onclick=()=>$('help-dialog').close();
  $('help-dialog').addEventListener('click',e=>{if(e.target===$('help-dialog'))$('help-dialog').close();});
  $('settings-toggle').onclick=()=>{$('settings').classList.toggle('open');$('settings-toggle').textContent=t($('settings').classList.contains('open')?'Close':'Settings');};
  $('reset-button').onclick=()=>{audioPlayer.pause();jawTest=false;applySnapshot({config:DEFAULTS});view.cameraView('audience',sim);history.replaceState(null,'',location.pathname+location.search);toast('Default stage restored.');};
  $('save-button').onclick=()=>exportKind('config');$('load-button').onclick=()=>$('config-file').click();
  $('config-file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>100000)throw Error('Configuration is too large.');applySnapshot(JSON.parse(await f.text()));toast('Stage setup loaded.');}catch(err){toast(err instanceof SyntaxError?'Choose a Ghostlight configuration JSON file.':err.message);}e.target.value='';};
  $('export-button').onclick=()=>$('export-menu').hidden=!$('export-menu').hidden;
  document.querySelectorAll('[data-export]').forEach(b=>b.onclick=()=>exportKind(b.dataset.export));
  document.addEventListener('click',e=>{if(!$('export-menu').contains(e.target)&&!$('export-button').contains(e.target))$('export-menu').hidden=true;});
  $('share-button').onclick=async()=>{const encoded=btoa(unescape(encodeURIComponent(JSON.stringify(snapshot()))));const url=location.origin+location.pathname+'#setup='+encoded;
    try{await navigator.clipboard.writeText(url);toast('Setup link copied. It includes dimensions, position and camera view.');}catch{download(url,'ghostlight-share-link.txt','text/plain');toast('Share link saved as a text file.');}};
  document.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA|BUTTON/.test(document.activeElement.tagName))return;if(e.code==='Space'){e.preventDefault();command(sim.driver.phase==='hold'?'cycle':'hold');}if(e.code==='Escape'){sim.driver.emergency();audioPlayer.pause();$('settings').classList.remove('open');$('export-menu').hidden=true;}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)audioPlayer.pause();});
}
try{
  sim=new StageSimulation(initialConfig());view=new StageView($('viewport'),sim.config);
  audioPlayer=new AudioPlayer({
    canStartShow:()=>!sim.driver.latched&&sim.driver.phase==='hold'&&!document.hidden,
    startShow:()=>{
      sim.config.previewSpeed=1;
      $('preview-rate').value='1';
      command('cycle');
      persist();
    }
  });
  view.cameraView('audience',sim);
  view.attachLabels({head:$('head-label'),mic:$('mic-label'),actor:$('actor-label')});
  // Read camera from a shared link when present.
  if(location.hash.startsWith('#setup=')){try{const data=JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(7)))));if(data.camera)applySnapshot(data);}catch{}}
  refreshLanguage();wireEvents();document.body.classList.add('ready');$('loading').hidden=true;
  let last=performance.now(),accumulator=0,lastTelemetry=0;const dt=1/120;
  function animate(now){
    const realDt=Math.min((now-last)/1000,.25);last=now;
    if(!document.hidden){accumulator+=realDt*sim.config.previewSpeed;while(accumulator>=dt){sim.step(dt);accumulator-=dt;}}
    let target=audioPlayer.jawOpening();
    if(target===null){
      const seconds=now/1000;
      target=jawTest?Math.max(0,Math.sin(seconds*8.5))*(.45+.35*Math.sin(seconds*1.9)**2):0;
    }
    jaw+=(target-jaw)*(1-Math.exp(-realDt*(target>jaw?24:12)));
    view.update(sim,jaw);
    if(now-lastTelemetry>90){updateTelemetry();if(audioPlayer.panel.open)audioPlayer.refresh();lastTelemetry=now;}
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
  // Read-only diagnostic snapshot for reproducible browser checks; no hardware interface.
  window.ghostlight={get state(){return {config:{...sim.config},sample:sim.sample(),metrics:sim.metrics(),phase:sim.driver.phase,latched:sim.driver.latched,renderer: view.renderer.info.render};}};
}catch(e){console.error(e);translateDOM(document);$('loading').hidden=true;$('webgl-error').hidden=false;$('error-text').textContent=t('{error}. Open the project through HTTP (GitHub Pages or a local server), and use a browser with WebGL 2 enabled.',{error:t(e.message)});}
