import {wireWelcome} from './welcome.js';
import {STORY} from './story.js';
import {AUDIO} from './media.js?v=20261018-shared';
import {Game,TARGETS,WIDTH,HEIGHT} from './engine.js';
import {drawScene} from './scene.js';
const $=id=>document.getElementById(id),game=new Game(),canvas=$('stage'),ctx=canvas.getContext('2d'),assets={};
game.phase=new URLSearchParams(globalThis.location?.search||'').has('journey')?'prologue':'welcome';
const meditation=AUDIO.meditation.zh;game.meditationDuration=meditation.duration;
const story=STORY.zh;let storyIndex=0,storyClock=0,storyComplete=false,storySound=false;
let loading=false,queuedStart=false,welcomeStartedAt=0,deferredStarted=false,introAssetsStarted=false,sceneWaiting=false;
let loaded=false,loadFailed=false,last=0,lastPhase='',toastUntil=0,muted=true,musicTrack=null,autoPaused=false;
const music=new Audio();music.preload='none';music.src=AUDIO.adventure;music.volume=.8;music.setAttribute('playsinline','');let playPending=false,audioBlocked=false,fadeContext=null,fadeGain=null;
function activateFades(){
 try{if(!fadeContext){const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;fadeContext=new AudioCtx();const source=fadeContext.createMediaElementSource(music);fadeGain=fadeContext.createGain();source.connect(fadeGain);fadeGain.connect(fadeContext.destination);music.volume=1;}fadeContext.resume().catch(()=>{});}catch{fadeContext=null;fadeGain=null;}
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
 const slowNote=setTimeout(()=>{$('story-loadnote').textContent=$('loadnote').textContent="开场画面准备中，跟着星光慢慢呼吸";},2200);
 try{
  assets.archer=await imageLoad('assets/bolo-archer.webp','high');loaded=true;
  $('home').dataset.ready='true';$('story-loadnote').textContent='';$('loadnote').textContent="拖动瞄准 · 松手射箭";
 }catch{loadFailed=true;queuedStart=false;stopMusic();$('story-loadnote').textContent=$('loadnote').textContent="连接有点慢，点“出发”重试";}
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
  $('scene-wait-text').textContent=failed?'画面暂时没能载入，点下方重试':'下一幕正在准备，稍等片刻';
  $('scene-wait-count').textContent=needed.filter(key=>assets[key]).length+' / '+needed.length+' '+'幅画面已准备好';
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
wireWelcome('zh',()=>{game.enter('prologue');loadIntroAssets();sync();$('story-title').focus({preventScroll:true});});
if(game.phase==='prologue')loadIntroAssets();
if(document.fonts)document.fonts.load('600 21px GameCJK').catch(()=>{});
function stopMusic(){music.pause();playPending=false;}
function scheduleMusic(){
 const track=['grow','prayer','cosmos'].includes(game.phase)?'meditation':(['charge','play','burn'].includes(game.phase)||queuedStart||storySound&&game.phase==='prologue')?'adventure':null;
 if(muted||game.paused||sceneWaiting||!track){stopMusic();return;}
 if(musicTrack!==track){stopMusic();musicTrack=track;music.src=track==='meditation'?meditation.src:AUDIO.adventure;music.loop=track==='adventure';music.currentTime=0;audioBlocked=false;}
 // Ease volume at scene boundaries rather than cutting an audible track.
 let envelope=1;
 if(game.phase==='burn')envelope=Math.max(0,Math.min(1,(7-game.phaseTime)/2));
 if(queuedStart)envelope=Math.min(1,(performance.now()-welcomeStartedAt)/1500);
 if(game.phase==='charge'&&!welcomeStartedAt)envelope=Math.min(1,game.phaseTime/1.5);
 if(game.phase==='grow'){const fadeIn=meditation.fadeIn??2.5;envelope=fadeIn>0?Math.min(1,game.phaseTime/fadeIn):1;}
 if(game.phase==='cosmos'&&meditation.fadeOut>0){const remaining=Number.isFinite(music.duration)?music.duration-music.currentTime:game.meditationDuration-21-game.phaseTime;envelope=Math.max(0,Math.min(1,remaining/meditation.fadeOut));}
 const volume=.8*(.5-.5*Math.cos(Math.PI*envelope));
 if(fadeGain)fadeGain.gain.setTargetAtTime(volume,fadeContext.currentTime,.025);else music.volume=volume;
 if(!music.paused||playPending||audioBlocked||(musicTrack==='meditation'&&music.ended))return;
 playPending=true;
 const attempt=music.play();
 if(attempt&&attempt.then)attempt.then(()=>{playPending=false;}).catch(()=>{playPending=false;audioBlocked=true;toast('点右上角“音”开启音乐');$('sound').textContent='音';$('sound').setAttribute('aria-label','点击开启音乐');});else playPending=false;
}
function hitSound(){}
function updateSound(){$('sound').setAttribute('aria-pressed',String(!muted));$('sound').setAttribute('aria-label',muted?'开启音乐':'关闭音乐');$('sound').textContent=muted?'音':'♫';}
function begin(){activateFades();if(!loaded){if(!queuedStart)welcomeStartedAt=performance.now();queuedStart=true;muted=false;audioBlocked=false;updateSound();scheduleMusic();$('start').disabled=true;$('story-play').disabled=true;loadAssets();return;}const warmStart=queuedStart||storySound;queuedStart=false;storySound=false;if(!warmStart){welcomeStartedAt=0;stopMusic();musicTrack=null;}game.start();loadDeferredAssets();$('easy').textContent='轻松模式';$('easy').setAttribute('aria-pressed','false');muted=false;audioBlocked=false;updateSound();scheduleMusic();sync();}
$('start').onclick=begin;$('replay').onclick=begin;
$('story-play').onclick=begin;
$('story-next').onclick=()=>{if(!storyComplete){storyComplete=true;$('story-copy').textContent=story[storyIndex][1];}else if(storyIndex===story.length-1){begin();}else{storyIndex++;storyClock=0;storyComplete=false;}};
$('story-sound').onclick=()=>{activateFades();if(!welcomeStartedAt)welcomeStartedAt=performance.now();storySound=true;muted=false;audioBlocked=false;updateSound();scheduleMusic();};
$('sound').onclick=()=>{activateFades();if(game.phase==='prologue')storySound=true;if(audioBlocked){audioBlocked=false;muted=false;}else muted=!muted;updateSound();if(muted)stopMusic();else scheduleMusic();};
$('skip').onclick=()=>{if(game.phase==='charge')game.enter('play');};
function pause(on,automatic=false){if(['home','welcome','prologue','done'].includes(game.phase))return;game.paused=on;game.aim=null;game.recharge=false;autoPaused=automatic;show('pausepanel',on);$('pause').textContent=on?'▶':'Ⅱ';$('pause').setAttribute('aria-label',on?'继续游戏':'暂停游戏');if(on)stopMusic();else{last=0;scheduleMusic();}}
$('pause').onclick=()=>pause(!game.paused);$('resume').onclick=()=>{activateFades();pause(false);};
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(true,true);});
$('easy').onclick=()=>{game.easy=!game.easy;$('easy').setAttribute('aria-pressed',String(game.easy));$('easy').textContent=game.easy?'轻松模式 ✓':'轻松模式';toast(game.easy?'面具放慢了脚步，慢慢来':'恢复会移动的面具');};
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
const container=$('accessible-targets');TARGETS.forEach((v,i)=>{const b=document.createElement('button');b.textContent=`向${v[0]}面具射箭`;b.onclick=()=>{const p=game.position(game.heads[i]);game.shoot(p.x,p.y);};b.dataset.target=i;container.append(b);});
async function share(){const url=location.origin+location.pathname;const data={title:'小Bolo · 十胜之光',text:'九夜蓄力，十箭释怀。来点亮小Bolo的五彩叶冠。',url};try{if(navigator.share)await navigator.share(data);else if(navigator.clipboard){await navigator.clipboard.writeText(url);toast('游戏链接已复制，可以发给朋友');}else{toast('复制浏览器中的网址，就能分享游戏');}}catch(e){if(e.name!=='AbortError')toast('复制浏览器中的网址，就能分享游戏');}}
$('share').onclick=share;
function sync(){
 const p=game.phase;
 $('ceremony').dataset.phase=p;
 for(const [id,on] of Object.entries({welcome:p==='welcome','language-switch':p!=='welcome',home:p==='home',prologue:p==='prologue',charge:p==='charge',hud:p==='play',ceremony:['burn','grow','prayer','cosmos'].includes(p),result:p==='done',pause:!['home','welcome','prologue','done'].includes(p)}))show(id,on);
 if(p!==lastPhase){lastPhase=p;
  if(p==='grow'){$('ceremonylabel').textContent='第四幕 · 彩光成长';$('ceremonytitle').innerHTML='三道光流<br>向着头顶升起';$('ceremonytext').textContent='左 · 中 · 右，汇成五彩之光';}
  if(p==='prayer'){$('ceremonylabel').textContent='让力量，安静下来';$('ceremonytitle').innerHTML='慢慢呼吸<br>回到内心';$('ceremonytext').textContent='带着光，慢慢坐下';}
  if(p==='cosmos'){$('ceremonylabel').textContent='星河之中 · 片刻冥想';$('ceremonytitle').innerHTML='宇宙很大<br>这一刻，很安静';$('ceremonytext').textContent='让五彩的光，静静绽放';}
  if(p==='burn'){$('ceremonylabel').textContent='第三幕 · 巨像焚烧';$('ceremonytitle').innerHTML='让旧的重量<br>化成光';$('ceremonytext').textContent='十个面具，已经放下';}
  if(p==='done'){$('virtues').replaceChildren(...TARGETS.map(v=>{const el=document.createElement('span');el.textContent=v[1];el.style.color=v[3];return el;}));$('stats').textContent=`点亮 10 种力量 · ${game.shots} 箭 · ${Math.floor(game.elapsed/60)}分${Math.floor(game.elapsed%60)}秒`;$('share').focus({preventScroll:true});}
 }
 $('nightname').textContent=`第${['一','二','三','四','五','六','七','八','九'][Math.min(8,Math.floor(game.phaseTime/1.15))]}夜`;
 $('progress').textContent=game.cleared+' / 10';$('energy').style.width=game.energy+'%';
 container.hidden=p!=='play';for(const b of container.children)b.disabled=game.heads[Number(b.dataset.target)].down;
 while(game.events.length){const ev=game.events.shift();if(ev.type==='hit'||ev.type==='clear')hitSound();if(ev.type==='empty')toast('停一停，力量正在恢复');if(ev.type==='shield')toast('它护住了自己，等面具重新露出脸');if(ev.type==='clear')canvas.setAttribute('aria-label',`已放下${TARGETS[ev.i][0]}，点亮${TARGETS[ev.i][1]}，完成${game.cleared}/10`);}
}
function updateStory(dt){
 if(game.phase!=='prologue')return;
 if(!document.hidden)storyClock+=dt;
 const [title,copy]=story[storyIndex],speed="zh"==='zh'?15:42;
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const count=storyComplete||reduced?copy.length:Math.min(copy.length,Math.max(3,Math.floor(storyClock*speed)));
 $('story-title').textContent=title;$('story-copy').textContent=copy.slice(0,count);
 $('story-count').textContent=(storyIndex+1)+' / '+story.length;
 if(count===copy.length)storyComplete=true;$('story-next').textContent=storyIndex===story.length-1?'进入游戏 →':'继续读 →';
 if(storyIndex<story.length-1&&storyClock>copy.length/speed+5){storyIndex++;storyClock=0;storyComplete=false;}
}
function frame(now){if(!last)last=now;const dt=Math.min(.05,(now-last)/1000);last=now;updateStory(dt);if(musicTrack==='meditation'&&Number.isFinite(music.duration)&&music.duration>0)game.meditationDuration=music.duration;game.meditationAudioActive=musicTrack==='meditation'&&Number.isFinite(music.duration)&&!muted&&!audioBlocked&&!music.paused&&!music.ended&&!music.error;if(!waitForSceneAssets())game.advance(dt);sync();drawScene(ctx,game,assets);scheduleMusic();if(toastUntil&&now>toastUntil){$('toast').classList.remove('show');toastUntil=0;}requestAnimationFrame(frame);}
requestAnimationFrame(frame);
window.addEventListener('pagehide',stopMusic);
