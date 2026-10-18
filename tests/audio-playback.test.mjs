import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioPlayback} from '../audio-playback.js';

const flush=()=>new Promise(resolve=>setImmediate(resolve));
class Media {
 constructor(){this.paused=true;this.currentTime=0;this.readyState=0;this.error=null;this.calls=[];this.loads=0;this.listeners={};}
 addEventListener(type,fn){this.listeners[type]=fn;}
 play(){this.paused=false;return new Promise((resolve,reject)=>this.calls.push({resolve,reject}));}
 pause(){this.paused=true;}
 load(){this.loads++;this.error=null;this.paused=true;this.currentTime=0;}
}
function setup(){let time=0;const media=new Media(),notices=[];const player=new AudioPlayback(media,reason=>notices.push(reason),()=>time);return {media,player,notices,advance:ms=>time+=ms};}

test('a late rejection from an interrupted play cannot block a newer play',async()=>{
 const {media,player,notices}=setup();player.play();player.stop();player.play();
 media.calls[0].reject({name:'AbortError'});await flush();
 assert.equal(player.pending,true);assert.equal(player.blocked,false);assert.equal(player.retries,0);
 media.calls[1].resolve();await flush();assert.equal(player.pending,false);assert.deepEqual(notices,[]);
});
test('temporary load failure reloads with backoff and recovers without another click',async()=>{
 const {media,player,notices,advance}=setup();player.play();media.error={code:2};media.calls[0].reject({name:'NotSupportedError'});await flush();
 for(let i=0;i<100;i++)player.play();assert.equal(media.calls.length,1);
 advance(750);player.play();assert.equal(media.loads,1);assert.equal(media.calls.length,2);
 media.calls[1].resolve();await flush();assert.equal(player.blocked,false);assert.equal(player.retries,0);assert.deepEqual(notices,[]);
});
test('autoplay denial waits for a click rather than making repeated requests',async()=>{
 const {media,player,notices,advance}=setup();player.play();media.calls[0].reject({name:'NotAllowedError'});await flush();
 advance(60000);player.play();assert.equal(media.calls.length,1);assert.deepEqual(notices,['permission']);
 player.reset();player.play();assert.equal(media.calls.length,2);media.calls[1].resolve();await flush();assert.equal(player.blocked,false);
});
test('a permanently stalled opening has only three automatic retries, then offers manual retry',async()=>{
 const {media,player,notices,advance}=setup();player.play();
 for(const delay of [750,1500,3000]){advance(15000);player.play();advance(delay);player.play();}
 advance(15000);player.play();assert.equal(media.calls.length,4);assert.equal(player.blocked,true);assert.deepEqual(notices,['load']);
 advance(60000);player.play();assert.equal(media.calls.length,4);
 player.reset();player.play();assert.equal(media.calls.length,5);media.calls[4].resolve();await flush();assert.equal(player.blocked,false);
});
test('buffer recovery resumes the existing audio position; a new track clears that seek',async()=>{
 const {media,player,advance}=setup();player.play();media.calls[0].resolve();await flush();
 media.currentTime=37;player.play();advance(15000);player.play();advance(750);player.play();
 assert.equal(media.loads,1);media.listeners.loadedmetadata();assert.equal(media.currentTime,37);
 player.stop();player.reset(true);media.currentTime=0;media.listeners.loadedmetadata();assert.equal(media.currentTime,0);
});
test('muting or pausing during a pending play does not later request user recovery',async()=>{
 const {media,player,notices}=setup();player.play();player.stop();media.calls[0].reject({name:'AbortError'});await flush();
 assert.equal(player.blocked,false);assert.equal(player.recovering,false);assert.equal(media.paused,true);assert.deepEqual(notices,[]);
});
