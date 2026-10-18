import test from 'node:test';
import assert from 'node:assert/strict';
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('both language entries recover their opening music after a failed first load',async()=>{
 for(const [file,language] of [['app.js','zh'],['en-app.js','en']]){
  const gradient={addColorStop(){}};
  const ctx=new Proxy({}, {get:(o,k)=>k==='createLinearGradient'||k==='createRadialGradient'?()=>gradient:o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  class Element {
   constructor(){this.hidden=false;this.disabled=false;this.style={};this.children=[];this.dataset={};this.listeners={};this.attrs={};this.classList={add(){},remove(){}};}
   addEventListener(k,f){this.listeners[k]=f;}setAttribute(k,v){this.attrs[k]=v;}append(x){this.children.push(x);}replaceChildren(...x){this.children=x;}focus(){}
   getContext(){return ctx;}getBoundingClientRect(){return {left:0,top:0,width:480,height:840};}setPointerCapture(){}showModal(){this.open=true;}close(){this.open=false;}
  }
  const ids={};let audio,clock=1000,frame;
  globalThis.document={getElementById:id=>ids[id]??=new Element(),createElement:()=>new Element(),addEventListener(){}};
  globalThis.window={addEventListener(){},matchMedia:()=>({matches:true})};
  globalThis.performance={now:()=>clock};
  globalThis.Audio=class {
   constructor(){audio=this;this.paused=true;this.readyState=3;this.currentTime=0;this.attempts=0;this.loads=0;this.listeners={};}
   setAttribute(){}addEventListener(k,f){this.listeners[k]=f;}pause(){this.paused=true;}
   load(){this.loads++;this.error=null;this.paused=true;}
   play(){if(++this.attempts===1){this.error={code:2};return Promise.reject({name:'NetworkError'});}this.paused=false;return Promise.resolve();}
  };
  globalThis.Image=class {set src(v){this.width=480;this.height=840;queueMicrotask(()=>this.onload?.());}};
  globalThis.requestAnimationFrame=f=>frame=f;
  await import('../'+file+'?opening-audio-test');await flush();
  await ids['choose-'+language].onclick({preventDefault(){}});
  assert.equal(ids.prologue.hidden,false);
  ids['story-play'].onclick();await flush();
  assert.equal(ids.charge.hidden,false);assert.equal(audio.attempts,1);assert.equal(audio.src,'assets/adventure.mp3');
  clock+=800;frame(clock);await flush();
  assert.equal(audio.attempts,2);assert.equal(audio.loads,1);assert.equal(audio.paused,false);assert.equal(ids.sound.attrs['aria-pressed'],'true');
  ids.sound.onclick();assert.equal(audio.paused,true);assert.equal(ids.sound.attrs['aria-pressed'],'false');
  ids.sound.onclick();await flush();assert.equal(audio.paused,false);assert.equal(ids.sound.attrs['aria-pressed'],'true');
 }
});
