// One short, responsive interaction before either language's story.
export function wireWelcome(locale,onChoose){
 const $=id=>document.getElementById(id);let choosing=false;
 for(const language of ['zh','en'])$('choose-'+language).onclick=async event=>{
  if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button>0)return;
  event.preventDefault();if(choosing)return;choosing=true;
  const selected=$('choose-'+language),welcome=$('welcome'),arrow=$('chosen-arrow'),hand=$('welcome-hand');
  selected.classList.add('selected');welcome.classList.add('choosing');
  const origin=$('bow-'+language).getBoundingClientRect(),target=hand.getBoundingClientRect(),bounds=welcome.getBoundingClientRect();
  const x=origin.left+origin.width/2-bounds.left,y=origin.top+origin.height/2-bounds.top;
  const tx=target.left+target.width/2-bounds.left,ty=target.top+target.height/2-bounds.top;
  arrow.hidden=false;arrow.style.left=x+'px';arrow.style.top=y+'px';
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if(arrow.animate&&!reduced){
   const dx=tx-x,dy=ty-y,angle=Math.atan2(dy,dx)*180/Math.PI;
   const flight=arrow.animate([
    {transform:`translate(-50%,-50%) rotate(${angle}deg)`,opacity:1},
    {transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) rotate(-5deg)`,opacity:1}
   ],{duration:480,easing:'cubic-bezier(.25,.1,.2,1)',fill:'forwards'});
   await flight.finished.catch(()=>{});
   hand.classList.add('lit');
   await new Promise(resolve=>setTimeout(resolve,260));
  }else{arrow.style.left=tx+'px';arrow.style.top=ty+'px';hand.classList.add('lit');}
  if(language===locale)onChoose();else window.location.assign(language==='en'?'en.html?journey=1':'./?journey=1');
 };
}
