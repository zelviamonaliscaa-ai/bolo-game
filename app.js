import {Game,TARGETS,WIDTH,HEIGHT} from './engine.js';
import {drawScene} from './scene.js';
const $=id=>document.getElementById(id),game=new Game(),canvas=$('stage'),ctx=canvas.getContext('2d'),assets={};
let loaded=false,loadFailed=false,last=0,lastPhase='',toastUntil=0,muted=true,musicTrack=null,autoPaused=false;
const music=new Audio('assets/adventure.mp3');music.preload='auto';music.volume=.8;music.setAttribute('playsinline','');let playPending=false,audioBlocked=false,fadeContext=null,fadeGain=null;
function activateFades(){
 try{if(!fadeContext){const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;fadeContext=new AudioCtx();const source=fadeContext.createMediaElementSource(music);fadeGain=fadeContext.createGain();source.connect(fadeGain);fadeGain.connect(fadeContext.destination);music.volume=1;}fadeContext.resume().catch(()=>{});}catch{fadeContext=null;fadeGain=null;}
}
const show=(id,on)=>{$(id).hidden=!on;};
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');toastUntil=performance.now()+2600;}
async function imageLoad(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});}
$('start').disabled=true;
async function loadAssets(){
 try{const [archer,rainbow,prayer,cosmic,cosmicRest,heads,body,standing]=await Promise.all([imageLoad('assets/bolo-archer.webp'),imageLoad('assets/bolo-approved.png'),imageLoad('assets/bolo-prayer.webp'),imageLoad('assets/cosmic.webp'),imageLoad('assets/cosmic-rest.webp'),imageLoad('assets/ravana-heads.webp'),imageLoad('assets/ravana-body.webp'),imageLoad('assets/bolo-standing-reference.jpg')]);Object.assign(assets,{archer,rainbow,prayer,cosmic,cosmicRest,heads,body,standing});loaded=true;loadFailed=false;$('start').disabled=false;$('loadnote').textContent='拖动瞄准 · 松手射箭';}
 catch{loadFailed=true;$('start').disabled=false;$('loadnote').textContent='角色加载未完成，点出发可重试';}
}
loadAssets();
if(document.fonts)document.fonts.load('600 21px GameCJK').catch(()=>{});
function stopMusic(){music.pause();playPending=false;}
function scheduleMusic(){
 const track=['grow','prayer','cosmos'].includes(game.phase)?'meditation':['charge','play','burn'].includes(game.phase)?'adventure':null;
 if(muted||game.paused||!track){stopMusic();return;}
 if(musicTrack!==track){stopMusic();musicTrack=track;music.src=track==='meditation'?'assets/meditation.mp3':'assets/adventure.mp3';music.loop=track==='adventure';music.currentTime=0;audioBlocked=false;}
 // Ease volume at scene boundaries rather than cutting an audible track.
 let envelope=1;
 if(game.phase==='burn')envelope=Math.max(0,Math.min(1,(7-game.phaseTime)/2));
 if(game.phase==='charge')envelope=Math.min(1,game.phaseTime/1.5);
 if(game.phase==='grow')envelope=Math.min(1,game.phaseTime/2.5);
 if(game.phase==='cosmos')envelope=Math.max(0,Math.min(1,(231.48-game.phaseTime)/3));
 const volume=.8*(.5-.5*Math.cos(Math.PI*envelope));
 if(fadeGain)fadeGain.gain.setTargetAtTime(volume,fadeContext.currentTime,.025);else music.volume=volume;
 if(!music.paused||playPending||audioBlocked)return;
 playPending=true;
 const attempt=music.play();
 if(attempt&&attempt.then)attempt.then(()=>{playPending=false;}).catch(()=>{playPending=false;audioBlocked=true;toast('点右上角“音”开启音乐');$('sound').textContent='音';$('sound').setAttribute('aria-label','点击开启音乐');});else playPending=false;
}
function hitSound(){}
function updateSound(){$('sound').setAttribute('aria-pressed',String(!muted));$('sound').setAttribute('aria-label',muted?'开启音乐':'关闭音乐');$('sound').textContent=muted?'音':'♫';}
function begin(){activateFades();if(!loaded){loadAssets();return;}stopMusic();musicTrack=null;game.start();$('easy').textContent='轻松模式';$('easy').setAttribute('aria-pressed','false');muted=false;audioBlocked=false;updateSound();scheduleMusic();sync();}
$('start').onclick=begin;$('replay').onclick=begin;
$('sound').onclick=()=>{activateFades();if(audioBlocked){audioBlocked=false;muted=false;}else muted=!muted;updateSound();if(muted)stopMusic();else scheduleMusic();};
$('skip').onclick=()=>{if(game.phase==='charge')game.enter('play');};
function pause(on,automatic=false){if(['home','done'].includes(game.phase))return;game.paused=on;game.aim=null;game.recharge=false;autoPaused=automatic;show('pausepanel',on);$('pause').textContent=on?'▶':'Ⅱ';$('pause').setAttribute('aria-label',on?'继续游戏':'暂停游戏');if(on)stopMusic();else{last=0;scheduleMusic();}}
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
function openInfo(){if(!['home','done'].includes(game.phase)&&!game.paused)pause(true);$('info').showModal();}
$('about').onclick=openInfo;$('credits').onclick=openInfo;$('close').onclick=()=>$('info').close();
const container=$('accessible-targets');TARGETS.forEach((v,i)=>{const b=document.createElement('button');b.textContent=`向${v[0]}面具射箭`;b.onclick=()=>{const p=game.position(game.heads[i]);game.shoot(p.x,p.y);};b.dataset.target=i;container.append(b);});
async function share(){const url=location.origin+location.pathname;const data={title:'小Bolo · 十胜之光',text:'九夜蓄力，十箭释怀。来点亮小Bolo的五彩叶冠。',url};try{if(navigator.share)await navigator.share(data);else if(navigator.clipboard){await navigator.clipboard.writeText(url);toast('游戏链接已复制，可以发给朋友');}else{toast('复制浏览器中的网址，就能分享游戏');}}catch(e){if(e.name!=='AbortError')toast('复制浏览器中的网址，就能分享游戏');}}
$('share').onclick=share;
function sync(){
 const p=game.phase;
 $('ceremony').dataset.phase=p;
 for(const [id,on] of Object.entries({home:p==='home',charge:p==='charge',hud:p==='play',ceremony:['burn','grow','prayer','cosmos'].includes(p),result:p==='done',pause:!['home','done'].includes(p)}))show(id,on);
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
function frame(now){if(!last)last=now;const dt=Math.min(.05,(now-last)/1000);last=now;game.advance(dt);sync();drawScene(ctx,game,assets);scheduleMusic();if(toastUntil&&now>toastUntil){$('toast').classList.remove('show');toastUntil=0;}requestAnimationFrame(frame);}
requestAnimationFrame(frame);
window.addEventListener('pagehide',stopMusic);
