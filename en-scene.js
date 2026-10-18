import {TARGETS,WIDTH,HEIGHT,ORIGIN} from './en-engine.js';
const TAU=Math.PI*2;
function path(c,points){c.beginPath();for(let i=0;i<points.length;i++){if(i)c.lineTo(...points[i]);else c.moveTo(...points[i]);}c.closePath();}
function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
function text(c,txt,x,y,size=18,color='#edd1a1',maxWidth=420){c.font=`600 ${size}px Arial, Helvetica, sans-serif`;c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.fillText(txt,x,y,maxWidth);}
function line(c,x1,y1,x2,y2,color,w=1){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=w;c.stroke();}
function sparkle(c,x,y,r,color){path(c,[[x,y-r],[x+r*.22,y-r*.22],[x+r,y],[x+r*.22,y+r*.22],[x,y+r],[x-r*.22,y+r*.22],[x-r,y],[x-r*.22,y-r*.22]]);c.fillStyle=color;c.fill();}
function lantern(c,x,y,scale,t){c.save();c.translate(x,y);c.scale(scale,scale);glow(c,0,5,45,'#c9934930');line(c,0,-33,0,-10,'#bb975760');c.fillStyle='#aa7448';c.fillRect(-12,-10,24,4);c.fillRect(-12,18,24,4);const g=c.createLinearGradient(-10,0,10,0);g.addColorStop(0,'#94734b');g.addColorStop(.5,'#f3c979');g.addColorStop(1,'#9a663d');c.fillStyle=g;c.beginPath();c.roundRect(-10,-6,20,24,4);c.fill();line(c,-7,-6,-7,18,'#694729',1);line(c,7,-6,7,18,'#694729',1);glow(c,0,7,12,'#ffeac66b');c.restore();}
function landscape(c,t){
 const g=c.createLinearGradient(0,0,0,840);g.addColorStop(0,'#101e2e');g.addColorStop(.5,'#243438');g.addColorStop(1,'#373329');c.fillStyle=g;c.fillRect(0,0,480,840);
 glow(c,365,176,180,'#5f929d21');glow(c,120,615,180,'#b5864324');
 for(let i=0;i<72;i++){const x=(i*137.23)%480,y=(i*79.53)%515;const a=.22+.2*Math.sin(t*.65+i);c.fillStyle=`rgba(237,221,181,${a})`;c.beginPath();c.arc(x,y,i%8===0?1.4:.65,0,TAU);c.fill();}
 c.fillStyle='#ccd9d4';c.beginPath();c.arc(370,90,15,0,TAU);c.fill();c.fillStyle='#172937';c.beginPath();c.arc(377,85,15,0,TAU);c.fill();
 for(let k=0;k<3;k++){c.fillStyle=['#1a2e36','#213339','#26383a'][k];c.beginPath();c.moveTo(0,840);c.lineTo(0,430+k*38);for(let i=0;i<=12;i++)c.lineTo(i*44,385+k*49+Math.sin(i*.9+k)*35+Math.cos(i*1.9)*18);c.lineTo(480,840);c.fill();}
 // Distant sandstone terraces and domed pavilions.
 for(let i=0;i<8;i++){const x=12+i*64,y=455+(i%3)*26;c.fillStyle=i%2?'#574539':'#66513a';c.fillRect(x,y,45,110);c.beginPath();c.arc(x+22,y,22,Math.PI,TAU);c.fill();line(c,x+22,y-29,x+22,y-21,'#a98c58',2);for(let j=0;j<3;j++){c.fillStyle='#d3a46755';c.fillRect(x+7+j*12,y+17,5,12);}}
 const floor=c.createLinearGradient(0,540,0,840);floor.addColorStop(0,'#463c2a');floor.addColorStop(1,'#161d22');c.fillStyle=floor;c.beginPath();c.moveTo(170,543);c.lineTo(310,543);c.lineTo(480,840);c.lineTo(0,840);c.fill();
 for(let i=0;i<9;i++){const y=560+i*i*3.8;line(c,0,y,480,y,'#c1955312');}for(let i=0;i<6;i++)line(c,210+i*13,550,-160+i*180,840,'#d6af7520');
 for(const x of [20,460]){c.fillStyle='#574538';c.fillRect(x-7,100,14,620);c.fillStyle='#ad875d44';c.fillRect(x-5,100,3,620);}
 c.beginPath();c.moveTo(-20,105);c.quadraticCurveTo(240,195,500,105);c.strokeStyle='#9d835655';c.lineWidth=1.5;c.stroke();for(let i=0;i<15;i++){const x=i*36,y=108+Math.sin(i/14*Math.PI)*40;c.fillStyle=i%2?'#ac8247':'#bd985b';c.beginPath();c.arc(x,y,3,0,TAU);c.fill();}
 lantern(c,25,420,1.05,t);lantern(c,456,420,1.05,t);lantern(c,12,695,1.45,t);lantern(c,473,695,1.45,t);for(let i=0;i<8;i++)lantern(c,110+i*38,520+Math.sin(i)*12,.24,t);
 // Delicate rangoli in the foreground, drawn as a festival floor ornament.
 c.save();c.translate(315,755);c.scale(1,.3);for(let k=0;k<12;k++){c.rotate(TAU/12);c.strokeStyle='#d7b87933';c.lineWidth=1.1;c.beginPath();c.ellipse(28,0,28,9,0,0,TAU);c.stroke();}c.restore();
}
function mask(c,h,p,t,shield,atlas){
 const {x,y}=p;const color=TARGETS[h.i][3];c.save();c.translate(x,y);c.rotate(Math.sin(t*1.1+h.i)*.045);
 if(atlas){const cw=(atlas.naturalWidth||atlas.width)/5,ch=(atlas.naturalHeight||atlas.height)/2;glow(c,0,0,42,h.flash?'#ffe6a765':'#d4a15412');c.drawImage(atlas,(h.i%5)*cw,Math.floor(h.i/5)*ch,cw,ch,-41,-50,82,82);
  for(let i=0;i<h.max;i++){c.fillStyle=i<h.hp?'#f1d193':'#665849';c.beginPath();c.arc((i-(h.max-1)/2)*9,-67,2.7,0,TAU);c.fill();}
  if(shield){c.fillStyle='#304550de';c.beginPath();c.roundRect(-34,-28,68,60,15);c.fill();c.strokeStyle='#c8c5ad';c.lineWidth=1.5;c.stroke();path(c,[[0,-19],[13,0],[0,19],[-13,0]]);c.stroke();}c.restore();text(c,TARGETS[h.i][0],x,y+56,13,'#f0d8b0',74);return;
 }
 glow(c,0,0,43,h.flash?'#ffe6a785':'#db9f3520');
 c.shadowColor='#0009';c.shadowBlur=8;c.shadowOffsetY=4;
 const g=c.createRadialGradient(-12,-13,1,4,4,42);g.addColorStop(0,'#da9270');g.addColorStop(.4,['#9c5a4d','#a2744c','#a65e52','#817760','#8b6377'][h.i%5]);g.addColorStop(1,'#352f36');c.fillStyle=g;c.beginPath();c.roundRect(-30,-26,60,63,[19,19,25,25]);c.fill();c.shadowBlur=0;c.shadowOffsetY=0;
 c.strokeStyle='#ddb77c';c.lineWidth=1.3;c.stroke();
 // A ceremonial crown, copper ears, and playful mustache.
 path(c,[[-31,-25],[-29,-44],[-17,-36],[0,-55],[17,-36],[29,-44],[31,-25]]);const crown=c.createLinearGradient(0,-55,0,-22);crown.addColorStop(0,'#efcf8c');crown.addColorStop(.45,'#997849');crown.addColorStop(1,'#d0a366');c.fillStyle=crown;c.fill();c.strokeStyle='#e6be77';c.stroke();line(c,-29,-28,29,-28,'#f8d997',3);c.fillStyle=color;c.beginPath();c.ellipse(0,-36,4,6,0,0,TAU);c.fill();
 for(const dir of [-1,1]){c.strokeStyle='#c99c62';c.lineWidth=2;c.beginPath();c.ellipse(dir*32,8,4,7,0,0,TAU);c.stroke();}
 const blink=Math.sin(t*1.3+h.i)> .975;c.fillStyle='#e5d5b4';for(const dir of [-1,1]){c.beginPath();c.ellipse(dir*12,-1,8,blink?1:4,-dir*.12,0,TAU);c.fill();if(!blink){c.fillStyle='#23202a';c.beginPath();c.arc(dir*12+Math.sin(t+h.i)*1.5,-1,2.5,0,TAU);c.fill();c.fillStyle='#e5d5b4';}}
 c.strokeStyle='#26242a';c.lineWidth=3;c.lineCap='round';for(const dir of [-1,1]){c.beginPath();c.moveTo(dir*5,-12);c.quadraticCurveTo(dir*13,-17-Math.sin(t+h.i)*3,dir*22,-10);c.stroke();}
 c.strokeStyle='#ddb084';c.lineWidth=2;c.beginPath();c.moveTo(0,2);c.lineTo(-3,11);c.lineTo(3,11);c.stroke();
 c.fillStyle='#242027';for(const dir of [-1,1]){c.beginPath();c.moveTo(0,17);c.bezierCurveTo(dir*10,8,dir*17,25,dir*24,13);c.bezierCurveTo(dir*23,32,dir*7,25,0,20);c.fill();}
 c.strokeStyle='#e1ac89';c.lineWidth=1;c.beginPath();c.arc(0,27,6,0,Math.PI);c.stroke();
 for(let i=0;i<h.max;i++){c.fillStyle=i<h.hp?'#f1d193':'#665849';c.beginPath();c.arc((i-(h.max-1)/2)*9,-67,2.7,0,TAU);c.fill();}
 if(shield){c.fillStyle='#3b515adb';c.beginPath();c.roundRect(-32,-30,64,61,15);c.fill();c.strokeStyle='#bdc5b1';c.lineWidth=2;c.stroke();text(c,'◇',0,0,30,'#c8d8cc');}
 c.restore();text(c,TARGETS[h.i][0],x,y+56,13,'#f0d8b0',74);
}
function effigy(c,s,burning=false,body){
 c.save();if(burning)c.globalAlpha=Math.max(0,1-s.phaseTime/7);
 if(body){sprite(c,body,131,388+Math.sin(s.time*.7)*2,218,327);c.restore();return;}
 const bob=Math.sin(s.time*.7)*3;c.translate(240,460+bob);
 const robe=c.createLinearGradient(-60,0,70,110);robe.addColorStop(0,'#614a3d');robe.addColorStop(.45,'#af7d4d');robe.addColorStop(1,'#3b3941');c.fillStyle=robe;path(c,[[-50,-35],[50,-35],[70,95],[-70,95]]);c.fill();c.strokeStyle='#c5a16b';c.lineWidth=1.5;c.stroke();
 c.fillStyle='#b2915d';c.beginPath();c.ellipse(0,-30,56,9,0,0,TAU);c.fill();
 for(let i=-2;i<=2;i++){line(c,i*18,-25,i*26,93,'#d4b07466');}line(c,-63,59,63,59,'#dfb777',4);
 c.strokeStyle='#d6ad6d';c.lineWidth=1.3;for(let j=0;j<3;j++){c.beginPath();c.ellipse(0,14+j*17,25+j*7,12,0,0,TAU);c.stroke();}glow(c,0,22,30,'#dda94930');sparkle(c,0,20,15,'#e4c586');
 for(const dir of [-1,1]){path(c,[[dir*45,-20],[dir*93,28],[dir*82,40],[dir*40,12]]);c.fillStyle='#8e6c4a';c.fill();c.stroke();}line(c,-35,95,-35,112,'#8e7655',8);line(c,35,95,35,112,'#8e7655',8);c.restore();
}
function particles(c,s){for(const p of s.particles){c.globalAlpha=Math.min(1,p.life);c.fillStyle=p.color;c.beginPath();c.arc(p.x,p.y,2,0,TAU);c.fill();}c.globalAlpha=1;}
function sprite(c,img,x,y,w,h){if(img)c.drawImage(img,x,y,w,h);}
function nadi(c,s,strength=1){
 const t=s.phaseTime;const colors=['#80c9fa','#fff0b2','#f19b77'];
 for(let j=0;j<3;j++){const side=j-1;c.save();c.globalAlpha=strength;const g=c.createLinearGradient(0,785,0,268);g.addColorStop(0,'transparent');g.addColorStop(.3,colors[j]+'a0');g.addColorStop(.85,colors[j]);g.addColorStop(1,'transparent');
  c.strokeStyle=g;c.lineWidth=j===1?5:3;c.shadowColor=colors[j];c.shadowBlur=10;c.beginPath();c.moveTo(242+side*38,773);c.bezierCurveTo(242+side*75,630,242+side*42,460,242,277);c.stroke();
  for(let k=0;k<7;k++){const u=((t*.15+k/7)%1),y=770-u*493,x=242+side*(38*(1-u)+30*Math.sin(u*Math.PI));glow(c,x,y,10,colors[j]+'65');c.fillStyle=colors[j];c.beginPath();c.arc(x,y,2.7,0,TAU);c.fill();}c.restore();
 }
 glow(c,242,282,65,'#f8d37d55');for(let i=0;i<7;i++){const a=-Math.PI+(i/6)*Math.PI,x=242+Math.cos(a)*58,y=282+Math.sin(a)*48;glow(c,x,y,28,['#ff867d50','#ffc77a50','#f7e5a450','#9cdcb450','#8ed8da50','#a8baf450','#c0a0eb50'][i]);}
}
export function drawScene(c,s,assets={}){
 c.save();c.clearRect(0,0,WIDTH,HEIGHT);landscape(c,s.time);
 if(s.phase==='prologue'){
  c.save();c.translate(36,205);c.scale(.85,.85);
  effigy(c,s,false,assets.body);
  for(const h of s.heads){const p=s.position(h);mask(c,h,p,s.time,false,assets.heads);}
  c.restore();
 }
 if(['home','charge'].includes(s.phase)){
  glow(c,230,600,170,'#d7a65622');sprite(c,assets.archer,85,315,300,341);
  if(s.phase==='charge'){
   const count=Math.min(9,Math.floor(s.phaseTime/1.15));for(let i=0;i<9;i++){const a=-Math.PI+i*Math.PI/8,x=240+Math.cos(a)*160,y=425+Math.sin(a)*85;glow(c,x,y,i<count?24:13,i<count?'#f5d7896b':'#c6ad7e12');c.fillStyle=i<count?'#f8db9b':'#71664c';c.beginPath();c.arc(x,y,4,0,TAU);c.fill();text(c,String(i+1),x,y-20,12,i<count?'#f5d696':'#827967');}
   for(let i=0;i<count;i++){const u=((s.phaseTime*.55+i*.13)%1);const a=-Math.PI+i*Math.PI/8,x=(240+Math.cos(a)*160)*(1-u)+235*u,y=(425+Math.sin(a)*85)*(1-u)+585*u;glow(c,x,y,14,'#f8dd9770');}glow(c,238,584,65,'#ebc5683a');
  }
 }
 if(s.phase==='play'){
  for(const h of s.heads){const p=s.position(h);if(!h.down)line(c,p.x,p.y+31,240,431,'#b690543a');}effigy(c,s,false,assets.body);
  for(const h of s.heads){const p=s.position(h);if(!h.down)mask(c,h,p,s.time,s.shield(h),assets.heads);else{glow(c,p.x,p.y,25,TARGETS[h.i][3]+'35');sparkle(c,p.x,p.y,16,TARGETS[h.i][3]);text(c,TARGETS[h.i][1],p.x,p.y+56,13,TARGETS[h.i][3],74);}}
  sprite(c,assets.archer,21,510,258,293);
  for(let i=0;i<s.cleared;i++){glow(c,66+i%5*30,551+Math.floor(i/5)*18,11,TARGETS[i][3]+'60');}
  if(s.aim&&s.feedbackTime===0){const dx=s.aim.x-ORIGIN.x,dy=s.aim.y-ORIGIN.y,len=Math.hypot(dx,dy);if(dy<-25&&len){c.setLineDash([3,9]);line(c,ORIGIN.x,ORIGIN.y,s.aim.x,s.aim.y,'#f4d19888',1.3);c.setLineDash([]);c.strokeStyle='#f5d395';c.lineWidth=1;c.beginPath();c.arc(s.aim.x,s.aim.y,18,0,TAU);c.stroke();line(c,s.aim.x-26,s.aim.y,s.aim.x+26,s.aim.y,'#d8bb78',1);line(c,s.aim.x,s.aim.y-26,s.aim.x,s.aim.y+26,'#d8bb78',1);}}
  for(const a of s.arrows){const ang=Math.atan2(a.vy,a.vx);c.save();c.translate(a.x,a.y);c.rotate(ang);c.shadowColor='#f7d079';c.shadowBlur=15;line(c,-27,0,3,0,'#ffe7ab',2);path(c,[[7,0],[-2,-5],[-1,0],[-2,5]]);c.fillStyle='#fff0c2';c.fill();c.restore();}
  if(s.feedbackTime>0&&s.feedback){const v=TARGETS[s.feedback.i];c.save();c.fillStyle='#0b1826e8';c.beginPath();c.roundRect(54,380,372,103,14);c.fill();c.strokeStyle=v[3]+'80';c.lineWidth=1;c.stroke();text(c,v[0]+'  →  '+v[1],240,414,23,v[3]);text(c,v[2],240,455,15,'#dfd0b5');c.restore();}
 }
 if(s.phase==='burn'){
  effigy(c,s,true,assets.body);
  const strength=Math.min(1,s.phaseTime/.7)*Math.min(1,(7-s.phaseTime)/1.2);
  c.save();c.globalAlpha=strength;glow(c,240,555,220,'#ff751060');
  for(let i=0;i<15;i++){
   const x=142+i*14,base=713,height=170+100*(.5+.5*Math.sin(s.time*7+i*1.9)),sway=Math.sin(s.time*9+i)*16;
   const flame=c.createLinearGradient(x,base,x,base-height);flame.addColorStop(0,'#ffba22');flame.addColorStop(.45,'#ff6a08');flame.addColorStop(1,'#ff3b0088');c.fillStyle=flame;c.beginPath();c.moveTo(x-20,base);c.bezierCurveTo(x-42,base-height*.4,x+25+sway,base-height*.65,x+sway,base-height);c.bezierCurveTo(x+5+sway,base-height*.5,x+38,base-height*.35,x+20,base);c.closePath();c.fill();
   c.fillStyle='#fff1a0';c.beginPath();c.moveTo(x-9,base);c.quadraticCurveTo(x-18,base-55,x+sway*.4,base-height*.52);c.quadraticCurveTo(x+21,base-50,x+9,base);c.fill();
  }
  for(let i=0;i<60;i++){const u=(s.phaseTime*.35+i*.071)%1,x=240+Math.sin(i*5.7+u*5)*(40+u*80),y=705-u*390;c.globalAlpha=strength*(1-u);c.fillStyle=i%3?'#ffae34':'#fff1a0';c.beginPath();c.arc(x,y,1.5+(1-u)*2.5,0,TAU);c.fill();}
  c.restore();sprite(c,assets.archer,35,575,180,205);
 }
 if(['grow','prayer'].includes(s.phase)){
  const seated=s.phase==='prayer'?1:Math.max(0,Math.min(1,(s.phaseTime-9)/3));
  if(seated<1){
   c.save();c.globalAlpha=(1-seated)*Math.min(1,s.phaseTime/1.5);
   // Display only reference panel 02, excluding its number; preserve its artwork.
   if(assets.standing){const img=assets.standing,iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;c.drawImage(img,iw*.502,ih*.115,iw*.495,ih*.885,0,220,480,580);}
   c.restore();
  }
  if(seated>0){c.globalAlpha=seated;sprite(c,assets.rainbow,0,110,480,840);c.globalAlpha=1;}

 }
 if(['cosmos','done'].includes(s.phase)){
  const fade=s.phase==='done'?1:Math.min(1,s.phaseTime/3);c.globalAlpha=fade;
  // Slow breathing camera over the final seated meditation scene.
  const z=1+Math.sin(s.time*.1)*.009,w=480*z,h=840*z;
  sprite(c,assets.cosmic,(480-w)/2,(s.phase==='done'?0:110)+(840-h)/2,w,h);
  const rest=s.phase==='done'?1:Math.max(0,Math.min(1,(s.phaseTime-6)/3));c.globalAlpha=fade*rest;sprite(c,assets.cosmicRest,(480-w)/2,(s.phase==='done'?0:110)+(840-h)/2,w,h);c.globalAlpha=1;
  if(s.phase==='cosmos'&&s.phaseTime<3){c.globalAlpha=1-fade;sprite(c,assets.rainbow,0,110,480,840);c.globalAlpha=1;}
  // Crown rays and tiny orbital lights remain gently alive.
  for(let i=0;i<7;i++){const x=201+i*13,base=353+Math.sin(i)*9;const colors=['#e56f75','#eea967','#e4ce81','#8bcca2','#83c8d6','#96ace5','#b794d0'];c.save();c.globalAlpha=.14+.055*Math.sin(s.time*.7+i);c.strokeStyle=colors[i];c.shadowColor=colors[i];c.shadowBlur=12;c.lineWidth=5;c.beginPath();c.moveTo(x,base);c.bezierCurveTo(x-10,base-35,x+10,base-65,x+(i-3)*8,base-110);c.stroke();c.restore();}
  for(let i=0;i<8;i++){const a=s.time*.035+i*TAU/8,x=240+Math.cos(a)*196,y=451+Math.sin(a)*197;glow(c,x,y,8,'#d0dcf53c');c.fillStyle='#d5dff28a';c.beginPath();c.arc(x,y,1.6,0,TAU);c.fill();}
 }
 particles(c,s);const vignette=c.createRadialGradient(240,420,220,240,420,580);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#08111b70');c.fillStyle=vignette;c.fillRect(0,0,480,840);c.restore();
}
