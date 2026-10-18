// Keep interrupted/slow loads recoverable without retrying browser permission failures.
export class AudioPlayback {
 constructor(media,onBlocked,now=()=>performance.now()){
  this.media=media;this.onBlocked=onBlocked;this.now=now;
  this.sequence=0;this.pending=false;this.blocked=false;this.retries=0;
  this.retryAt=0;this.needsReload=false;this.waitSince=null;this.seekAfterLoad=null;
  media.addEventListener('loadedmetadata',()=>{
   if(this.seekAfterLoad!==null){try{media.currentTime=this.seekAfterLoad;}catch{}this.seekAfterLoad=null;}
  });
 }
 get recovering(){return this.blocked||this.retryAt>0||this.needsReload;}
 reset(newTrack=false){
  this.blocked=false;this.retries=0;this.retryAt=0;
  this.needsReload=newTrack?false:this.needsReload||Boolean(this.media.error);
  if(newTrack)this.seekAfterLoad=null;
 }
 stop(){
  const pending=this.pending;
  ++this.sequence;this.pending=false;this.waitSince=null;
  if(pending||!this.media.paused)this.media.pause();
 }
 requireGesture(){this.blocked=true;this.onBlocked('permission');}
 fail(error,sequence){
  if(sequence!==this.sequence)return;
  this.stop();
  if(error?.name==='NotAllowedError'){this.requireGesture();return;}
  this.needsReload=error?.name!=='AbortError';
  if(this.retries>=3){this.blocked=true;this.onBlocked('load');return;}
  this.retryAt=this.now()+[750,1500,3000][this.retries++];
 }
 play(){
  const media=this.media,now=this.now();
  if(this.blocked||now<this.retryAt)return;
  if(this.pending){
   if(now-this.waitSince>=15000)this.fail({name:'TimeoutError'},this.sequence);
   return;
  }
  if(this.needsReload){
   this.seekAfterLoad=media.currentTime>0?media.currentTime:null;
   this.needsReload=false;media.load();
  }else if(media.error){this.fail({name:'NetworkError'},this.sequence);return;}
  if(!media.paused){
   if(media.readyState>=3)this.waitSince=null;
   else if(this.waitSince===null)this.waitSince=now;
   else if(now-this.waitSince>=15000)this.fail({name:'TimeoutError'},this.sequence);
   return;
  }
  const sequence=++this.sequence;
  this.pending=true;this.waitSince=now;this.retryAt=0;
  try{
   Promise.resolve(media.play()).then(()=>{
    if(sequence!==this.sequence)return;
    this.pending=false;this.waitSince=null;this.retries=0;
   }).catch(error=>this.fail(error,sequence));
  }catch(error){this.fail(error,sequence);}
 }
}
