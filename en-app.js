import {AudioPlayback} from './audio-playback.js?v=20261019-audio-recovery';
import {wireWelcome} from './welcome.js';
import {STORY} from './story.js';
import {AUDIO} from './media.js?v=20261018-shared';
import {Game,TARGETS,WIDTH,HEIGHT} from './en-engine.js';
import {drawScene} from './en-scene.js';
const $=id=>document.getElementById(id),game=new Game(),canvas=$('stage'),ctx=canvas.getContext('2d'),assets={};
game.phase=new URLSearchParams(globalThis.location?.search||'').has('journey')?'prologue':'welcome';
const meditation=AUDIO.meditation.en;game.meditationDuration=meditation.duration;
const story=STORY.en;let storyIndex=0,storyClock=0,storyComplete=false,storySound=false;
let loading=false,queuedStart=false,welcomeStartedAt=0,deferredStarted=false,introAssetsStarted=false,sceneWaiting=false;
let loaded=false,loadFailed=false,last=0,lastPhase='',toastUntil=0,muted=true,musicTrack=null,autoPaused=false;
const music=new Audio();music.preload='none';music.src=AUDIO.adventure;music.volume=.8;music.setAttribute('playsinline','');let fadeContext=null,fadeGain=null;
const playback=new AudioPlayback(music,reason=>{toast(reason==='permission'?'Tap the music button to turn on sound':'Music could not load. Tap the music button to retry.');$('sound').textContent='♪';$('sound').setAttribute('aria-label','Turn on music or retry loading');$('sound').setAttribute('aria-pressed','false');});
function activateFades(){
 try{if(!fadeContext){const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;fadeContext=new AudioCtx();const source=fadeContext.createMediaElementSource(music);fadeGain=fadeContext.createGain();source.connect(fadeGain);fadeGain.connect(fadeContext.destination);music.volume=1;}fadeContext.resume().catch(()=>playback.requireGesture());}catch{fadeContext=null;fadeGain=null;}
}
const show=(id,on)=>{$(id).hidden=!on;};
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');toastUntil=performance.now()+2600;}
async function imageLoad(src,priority='low'){
 return new Promise((resolve,reject)=>{
  const img=new Image();img.fetchPriority=priority;img.decoding='async';
  const timeout=setTimeout(()=>{img.onload=null;img.onerror=null;reject(new Error('Image timeout'));},15000);
  img.onload=()=>{clearTimeout(timeout);resolve(img);};img.onerror=()=>{clearTimeout(timeout);reject(new Error('Image unavailable'));};img.src=src;
 });
}
async function loadAssets(){
 if(loading||loaded)return;loading=true;loadFailed=false;$('start').setAttribute('aria-busy','true');
 const slowNote=setTimeout(()=>{$('story-loadnote').textContent=$('loadnote').textContent="Your scene is on its way. Breathe with the light.";},2200);
 try{
  assets.archer=await imageLoad('assets/bolo-archer.webp','high');loaded=true;
  $('home').dataset.ready='true';$('story-loadnote').textContent='';$('loadnote').textContent="Drag to aim · Release to shoot";
 }catch{loadFailed=true;queuedStart=false;stopMusic();$('story-loadnote').textContent=$('loadnote').textContent="The connection is slow. Tap Begin to retry.";}
 finally{loading=false;clearTimeout(slowNote);$('start').disabled=false;$('story-play').disabled=false;$('start').setAttribute('aria-busy','false');}
 if(loaded&&queuedStart)begin();
}
const assetJobs={heads:'ravana-heads.webp',body:'ravana-body.webp',standing:'bolo-standing-reference.jpg',rainbow:'bolo-approved.png',cosmic:'cosmic.webp',cosmicRest:'cosmic-rest.webp'};
const assetLoads=new Map(),assetErrors=new Set();
async function fetchAsset(key){
 if(assets[key])return assets[key];if(assetLoads.has(key))return assetLoads.get(key);
 assetErrors.delete(key);const task=imageLoad('assets/'+assetJobs[key]).then(img=>assets[key]=img).catch(error=>{assetErrors.add(key);throw error;}).finally(()=>assetLoads.delete(key));assetLoads.set(key,task);return task;
}
async function loadIntroAssets(){if(introAssetsStarted)return;introAssetsStarted=true;await Promise.allSettled(['heads','body'].map(fetchAsset));}
async function loadDeferredAssets(){
 if(deferredStarted)return;deferredStarted=true;
 const jobs=['heads','body','standing','rainbow','cosmic','cosmicRest'];
 async function worker(){while(jobs.length){const key=jobs.shift();try{await fetchAsset(key);}catch{try{await fetchAsset(key);}catch{}}}}
 await Promise.all([worker(),worker()]);deferredStarted=false;
}

function waitForSceneAssets(){
 const needed=game.phase==='burn'&&game.phaseTime>=6.6?['standing','rainbow']:game.phase==='prayer'&&game.phaseTime>=4.8?['cosmic','cosmicRest']:[];
 sceneWaiting=needed.some(key=>!assets[key]);show('scene-wait',sceneWaiting);
 if(sceneWaiting){
  const failed=needed.some(key=>assetErrors.has(key));
  $('scene-wait-text').textContent=failed?'The scene could not load. Please retry.':'Preparing the next scene. One moment…';
  $('scene-wait-count').textContent=needed.filter(key=>assets[key]).length+' / '+needed.length+' '+'images ready';
  $('scene-retry').hidden=!failed;
 }
 return sceneWaiting;
}
$('scene-retry').onclick=async()=>{
 $('scene-retry').disabled=true;
 const needed=game.phase==='burn'?['standing','rainbow']:['cosmic','cosmicRest'];
 await Promise.allSettled(needed.map(fetchAsset));$('scene-retry').disabled=false;
};

loadAssets();
wireWelcome('en',()=>{game.enter('prologue');loadIntroAssets();sync();$('story-title').focus({preventScroll:true});});
if(game.phase==='prologue')loadIntroAssets();
if(document.fonts)document.fonts.load('600 21px Arial').catch(()=>{});
function stopMusic(){playback.stop();}
function scheduleMusic(){
 const track=['grow','prayer','cosmos'].includes(game.phase)?'meditation':(['charge','play','burn'].includes(game.phase)||queuedStart||storySound&&game.phase==='prologue')?'adventure':null;
 if(muted||game.paused||sceneWaiting||!track){stopMusic();return;}
 if(musicTrack!==track){stopMusic();musicTrack=track;music.src=track==='meditation'?meditation.src:AUDIO.adventure;music.loop=track==='adventure';music.currentTime=0;playback.reset(true);}
 // Ease volume at scene boundaries rather than cutting an audible track.
 let envelope=1;
 if(game.phase==='burn')envelope=Math.max(0,Math.min(1,(7-game.phaseTime)/2));
 if(queuedStart)envelope=Math.min(1,(performance.now()-welcomeStartedAt)/1500);
 if(game.phase==='charge'&&!welcomeStartedAt)envelope=Math.min(1,game.phaseTime/1.5);
 if(game.phase==='grow'){const fadeIn=meditation.fadeIn??2.5;envelope=fadeIn>0?Math.min(1,game.phaseTime/fadeIn):1;}
 if(game.phase==='cosmos'&&meditation.fadeOut>0){const remaining=Number.isFinite(music.duration)?music.duration-music.currentTime:game.meditationDuration-21-game.phaseTime;envelope=Math.max(0,Math.min(1,remaining/meditation.fadeOut));}
 const volume=.8*(.5-.5*Math.cos(Math.PI*envelope));
 if(fadeGain)fadeGain.gain.setTargetAtTime(volume,fadeContext.currentTime,.025);else music.volume=volume;
 if(!(musicTrack==='meditation'&&music.ended))playback.play();
}
function hitSound(){}
function updateSound(){$('sound').setAttribute('aria-pressed',String(!muted));$('sound').setAttribute('aria-label',muted?'Turn on music':'Turn off music');$('sound').textContent=muted?'♪':'♫';}
function begin(){activateFades();if(!loaded){if(!queuedStart)welcomeStartedAt=performance.now();queuedStart=true;muted=false;playback.reset();updateSound();scheduleMusic();$('start').disabled=true;$('story-play').disabled=true;loadAssets();return;}const warmStart=queuedStart||storySound;queuedStart=false;storySound=false;if(!warmStart){welcomeStartedAt=0;stopMusic();musicTrack=null;}game.start();loadDeferredAssets();$('easy').textContent='Easy mode';$('easy').setAttribute('aria-pressed','false');muted=false;playback.reset();updateSound();scheduleMusic();sync();}
$('start').onclick=begin;$('replay').onclick=begin;
$('story-play').onclick=begin;
$('story-next').onclick=()=>{if(!storyComplete){storyComplete=true;$('story-copy').textContent=story[storyIndex][1];}else if(storyIndex===story.length-1){begin();}else{storyIndex++;storyClock=0;storyComplete=false;}};
$('story-sound').onclick=()=>{activateFades();if(!welcomeStartedAt)welcomeStartedAt=performance.now();storySound=true;muted=false;playback.reset();updateSound();scheduleMusic();};
$('sound').onclick=()=>{activateFades();if(game.phase==='prologue')storySound=true;if(playback.recovering||(!muted&&music.paused)||(fadeContext&&fadeContext.state!=='running'))muted=false;else muted=!muted;if(!muted)playback.reset();updateSound();if(muted)stopMusic();else scheduleMusic();};
$('skip').onclick=()=>{if(game.phase==='charge')game.enter('play');};
function pause(on,automatic=false){if(['home','welcome','prologue','done'].includes(game.phase))return;game.paused=on;game.aim=null;game.recharge=false;autoPaused=automatic;show('pausepanel',on);$('pause').textContent=on?'▶':'Ⅱ';$('pause').setAttribute('aria-label',on?'Resume game':'Pause game');if(on)stopMusic();else{last=0;scheduleMusic();}}
$('pause').onclick=()=>pause(!game.paused);$('resume').onclick=()=>{activateFades();pause(false);};
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(true,true);});
$('easy').onclick=()=>{game.easy=!game.easy;$('easy').setAttribute('aria-pressed',String(game.easy));$('easy').textContent=game.easy?'Easy mode ✓':'Easy mode';toast(game.easy?'The masks have slowed down. Take your time.':'The masks are moving again');};
const coord=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*WIDTH,y:(e.clientY-r.top)/r.height*HEIGHT};};
let pointer=null;
canvas.addEventListener('pointerdown',e=>{if(game.phase!=='play'||game.paused||game.feedbackTime>0)return;e.preventDefault();pointer=e.pointerId;canvas.setPointerCapture(e.pointerId);game.aim=coord(e);});
canvas.addEventListener('pointermove',e=>{if(pointer===e.pointerId)game.aim=coord(e);});
canvas.addEventListener('pointerup',e=>{if(pointer!==e.pointerId)return;const p=coord(e);game.shoot(p.x,p.y);game.aim=null;pointer=null;});
canvas.addEventListener('pointercancel',()=>{game.aim=null;pointer=null;});canvas.addEventListener('lostpointercapture',()=>{game.aim=null;pointer=null;});
$('recharge').addEventListener('pointerdown',e=>{if(game.phase!=='play'||game.paused)return;e.preventDefault();$('recharge').setPointerCapture(e.pointerId);game.recharge=true;});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])$('recharge').addEventListener(ev,()=>game.recharge=false);
$('recharge').addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();game.recharge=true;}});$('recharge').addEventListener('keyup',()=>game.recharge=false);$('recharge').addEventListener('blur',()=>game.recharge=false);
function openInfo(){if(!['home','welcome','prologue','done'].includes(game.phase)&&!game.paused)pause(true);$('info').showModal();}
$('about').onclick=openInfo;$('credits').onclick=openInfo;$('close').onclick=()=>$('info').close();
const container=$('accessible-targets');TARGETS.forEach((v,i)=>{const b=document.createElement('button');b.textContent=`Shoot at the ${v[0]} mask`;b.onclick=()=>{const p=game.position(game.heads[i]);game.shoot(p.x,p.y);};b.dataset.target=i;container.append(b);});
async function share(){const url=location.origin+location.pathname;const data={title:'Bolo · Ten Lights',text:'Nine nights of strength. Ten arrows of release. Come light up Bolo’s rainbow crown.',url};try{if(navigator.share)await navigator.share(data);else if(navigator.clipboard){await navigator.clipboard.writeText(url);toast('Game link copied. Share it with a friend.');}else{toast('Copy the address in your browser to share the game');}}catch(e){if(e.name!=='AbortError')toast('Copy the address in your browser to share the game');}}
$('share').onclick=share;
function sync(){
 const p=game.phase;
 $('ceremony').dataset.phase=p;
 for(const [id,on] of Object.entries({welcome:p==='welcome','language-switch':p!=='welcome',home:p==='home',prologue:p==='prologue',charge:p==='charge',hud:p==='play',ceremony:['burn','grow','prayer','cosmos'].includes(p),result:p==='done',pause:!['home','welcome','prologue','done'].includes(p)}))show(id,on);
 if(p!==lastPhase){lastPhase=p;
  if(p==='grow'){$('ceremonylabel').textContent='Act IV · Growing in Light';$('ceremonytitle').innerHTML='Three streams of light<br>rise to the crown';$('ceremonytext').textContent='Left · Centre · Right, united in rainbow light';}
  if(p==='prayer'){$('ceremonylabel').textContent='Let Your Strength Find Stillness';$('ceremonytitle').innerHTML='Breathe slowly<br>return to yourself';$('ceremonytext').textContent='Carry the light as you gently sit down';}
  if(p==='cosmos'){$('ceremonylabel').textContent='Among the Stars · Meditation';$('ceremonytitle').innerHTML='A vast universe<br>a quiet moment';$('ceremonytext').textContent='Let the rainbow light gently unfold';}
  if(p==='burn'){$('ceremonylabel').textContent='Act III · The Bonfire';$('ceremonytitle').innerHTML='Let old burdens<br>turn into light';$('ceremonytext').textContent='Ten masks, now laid to rest';}
  if(p==='done'){$('virtues').replaceChildren(...TARGETS.map(v=>{const el=document.createElement('span');el.textContent=v[1];el.style.color=v[3];return el;}));$('stats').textContent=`10 strengths · ${game.shots} arrows · ${Math.floor(game.elapsed/60)}m ${Math.floor(game.elapsed%60)}s`;$('share').focus({preventScroll:true});}
 }
 $('nightname').textContent=`Night ${['One','Two','Three','Four','Five','Six','Seven','Eight','Nine'][Math.min(8,Math.floor(game.phaseTime/1.15))]}`;
 $('progress').textContent=game.cleared+' / 10';$('energy').style.width=game.energy+'%';
 container.hidden=p!=='play';for(const b of container.children)b.disabled=game.heads[Number(b.dataset.target)].down;
 while(game.events.length){const ev=game.events.shift();if(ev.type==='hit'||ev.type==='clear')hitSound();if(ev.type==='empty')toast('Take a moment. Your strength is returning.');if(ev.type==='shield')toast('Its shield is up. Wait for the face to reappear.');if(ev.type==='clear')canvas.setAttribute('aria-label',`Released ${TARGETS[ev.i][0]}, awakened ${TARGETS[ev.i][1]}. ${game.cleared} of 10 complete`);}
}
function updateStory(dt){
 if(game.phase!=='prologue')return;
 if(!document.hidden)storyClock+=dt;
 const [title,copy]=story[storyIndex],speed="en"==='zh'?15:42;
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const count=storyComplete||reduced?copy.length:Math.min(copy.length,Math.max(3,Math.floor(storyClock*speed)));
 $('story-title').textContent=title;$('story-copy').textContent=copy.slice(0,count);
 $('story-count').textContent=(storyIndex+1)+' / '+story.length;
 if(count===copy.length)storyComplete=true;$('story-next').textContent=storyIndex===story.length-1?'Begin →':'Read on →';
 if(storyIndex<story.length-1&&storyClock>copy.length/speed+5){storyIndex++;storyClock=0;storyComplete=false;}
}
function frame(now){if(!last)last=now;const dt=Math.min(.05,(now-last)/1000);last=now;updateStory(dt);if(musicTrack==='meditation'&&Number.isFinite(music.duration)&&music.duration>0)game.meditationDuration=music.duration;game.meditationAudioActive=musicTrack==='meditation'&&Number.isFinite(music.duration)&&!muted&&!playback.blocked&&!music.paused&&!music.ended&&!music.error;if(!waitForSceneAssets())game.advance(dt);sync();drawScene(ctx,game,assets);scheduleMusic();if(toastUntil&&now>toastUntil){$('toast').classList.remove('show');toastUntil=0;}requestAnimationFrame(frame);}
requestAnimationFrame(frame);
window.addEventListener('pagehide',stopMusic);
