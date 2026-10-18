export const TARGETS = [
 ['贪婪','知足','把不够，变成已经拥有。','#ef9666'],
 ['自私','分享','把一份温暖，留给别人。','#e9b66a'],
 ['愤怒','平和','让力量，回到清醒的手里。','#ec7986'],
 ['嫉妒','欣赏','别人的光，也能照亮世界。','#91c9b3'],
 ['傲慢','谦逊','放低一点，才能看见更多。','#b0a6db'],
 ['执念','放下','松开手，让新的可能进来。','#87bdce'],
 ['欺骗','真诚','让心里的话，变得清澈。','#efca77'],
 ['怨恨','宽恕','把过去的重量，轻轻放下。','#c0a2cc'],
 ['恐惧','勇气','带着不安，也能向前一步。','#9db9ea'],
 ['迷失','清明','安静下来，找回自己的方向。','#d1cf9d']
];
export const WIDTH=480, HEIGHT=840, ORIGIN={x:225,y:657};
export function segmentDistance(px,py,ax,ay,bx,by) {
 const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy;
 const u=l?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l)):0;
 return Math.hypot(px-ax-u*dx,py-ay-u*dy);
}
export class Game {
 constructor(){this.meditationDuration=252.48;this.meditationAudioActive=false;this.reset();}
 reset(){this.meditationAudioActive=false;this.phase='home';this.phaseTime=0;this.time=0;this.elapsed=0;this.energy=100;this.heads=TARGETS.map((v,i)=>({i,hp:i<3?2:3,max:i<3?2:3,down:false,flash:0}));this.arrows=[];this.particles=[];this.hitCount=0;this.shots=0;this.lastShot=-5;this.aim=null;this.recharge=false;this.feedback=null;this.feedbackTime=0;this.paused=false;this.easy=false;this.events=[];}
 enter(phase){this.phase=phase;this.phaseTime=0;this.aim=null;this.events.push({type:'phase',phase});}
 start(){this.reset();this.enter('charge');}
 get cleared(){return this.heads.filter(h=>h.down).length;}
 position(h){const col=h.i%5,row=Math.floor(h.i/5),amp=this.easy?0:5+this.cleared*.4;return {x:64+col*88+Math.sin(this.time*.82+h.i*1.3)*amp,y:202+row*148+Math.sin(this.time*1.07+h.i)*5};}
 shield(h){return !this.easy && h.i>=3 && ((this.time+h.i*.66)%5.2)>4.15;}
 shoot(x,y){
  if(this.phase!=='play'||this.paused||this.feedbackTime>0||this.time-this.lastShot<.8)return false;
  if(this.energy<18){this.events.push({type:'empty'});return false;}
  if(y>ORIGIN.y-25)return false;
  const dx=x-ORIGIN.x,dy=y-ORIGIN.y,l=Math.hypot(dx,dy);if(!l)return false;
  this.energy-=18;this.shots++;this.lastShot=this.time;
  this.arrows.push({x:ORIGIN.x,y:ORIGIN.y,vx:dx/l*510,vy:dy/l*510,age:0});this.events.push({type:'shoot'});return true;
 }
 burst(x,y,color,n=18){for(let i=0;i<n;i++){const a=i*2.399,sp=35+(i%7)*16;this.particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,color,life:1.2+(i%5)*.2,max:2});}}
 advance(dt){
  if(this.paused)return;dt=Math.min(.1,Math.max(0,dt));this.time+=dt;this.phaseTime+=dt;
  if(this.phase==='charge'&&this.phaseTime>=12)this.enter('play');
  if(this.phase==='burn'&&this.phaseTime>=7)this.enter('grow');
  if(this.phase==='grow'&&this.phaseTime>=16)this.enter('prayer');
  if(this.phase==='prayer'&&this.phaseTime>=5)this.enter('cosmos');
  if(this.phase==='cosmos'&&this.phaseTime>=Math.max(0,this.meditationDuration-21)&&!this.meditationAudioActive)this.enter('done');
  if(this.phase==='play'){
   this.elapsed+=dt;this.energy=Math.min(100,this.energy+dt*(this.recharge?22:6));
   this.feedbackTime=Math.max(0,this.feedbackTime-dt);if(!this.feedbackTime&&this.cleared===10){this.enter('burn');this.arrows=[];}
   for(const h of this.heads)h.flash=Math.max(0,h.flash-dt);
   for(const a of this.arrows){const ox=a.x,oy=a.y;a.x+=a.vx*dt;a.y+=a.vy*dt;a.age+=dt;
    for(const h of this.heads){if(h.down)continue;const p=this.position(h);
     if(segmentDistance(p.x,p.y,ox,oy,a.x,a.y)<33){a.dead=true;
      if(this.shield(h)){this.burst(p.x,p.y,'#a5b6bf',7);this.events.push({type:'shield'});}
      else{h.hp--;h.flash=.35;this.hitCount++;this.burst(p.x,p.y,TARGETS[h.i][3]);this.events.push({type:'hit'});
       if(h.hp<=0){h.down=true;this.feedback={i:h.i,...p};this.feedbackTime=2.5;this.events.push({type:'clear',i:h.i});}}
      break;}}
   }
   this.arrows=this.arrows.filter(a=>!a.dead&&a.age<2.2&&a.x>-20&&a.x<500&&a.y>-30);
  }
  for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=dt*18;}
  this.particles=this.particles.filter(p=>p.life>0);
 }
}
