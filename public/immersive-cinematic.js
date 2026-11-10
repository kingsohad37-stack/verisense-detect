/* Extra cinematic cues: section-crossing light, subtle magnetic response, and focus polish. */
(()=>{'use strict';
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine=matchMedia('(pointer:fine)').matches;
const flare=document.createElement('div');flare.id='vs-scene-flare';flare.setAttribute('aria-hidden','true');document.body.appendChild(flare);
let last=-1,queued=false;
const sections=[...document.querySelectorAll('#page-home,#page-detect,#page-about')];
function scene(){queued=false;let current=0;sections.forEach((s,i)=>{if(s.getBoundingClientRect().top<innerHeight*.55)current=i});if(last!==-1&&current!==last&&!reduce){flare.classList.remove('vs-flare-on');void flare.offsetWidth;flare.classList.add('vs-flare-on')}last=current}
addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(scene)}},{passive:true});scene();
if(fine&&!reduce){
 const targets=[...document.querySelectorAll('.pill.primary,.fab,.mode')];
 targets.forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.setProperty('--vs-mx',(x*5).toFixed(2)+'px');el.style.setProperty('--vs-my',(y*4).toFixed(2)+'px');el.style.translate='var(--vs-mx) var(--vs-my)'});el.addEventListener('pointerleave',()=>{el.style.translate='0 0'})});
}
document.querySelectorAll('.dropzone,.feature,.side-card').forEach(el=>{el.addEventListener('focusin',()=>el.classList.add('vs-focus-glow'));el.addEventListener('focusout',()=>el.classList.remove('vs-focus-glow'))});
})();
