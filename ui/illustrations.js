'use strict';
// New pen paths, shared between surfaces. No third-party icon library.
const drawings = {
  star:'<path class="cream" d="m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>',
  skull:'<path d="M5 17C0 12 4 3 12 3s12 9 7 14l-1 5-4-1-2 1-2-1-4 1Z"/><path class="detail" d="M8 10q-3-2-2 2t4-1m6-1q3-2 2 2t-4-1m-2 4v2"/>',
  crown:'<path class="cream" d="m3 7 5 5 4-8 5 8 5-6-3 15H6Z"/><path class="detail" d="m7 17 12 0"/>',
  calendar:'<path d="M5 5q8-2 15 0l1 15q-9 2-17 0Z"/><path class="detail" d="m8 2 0 6m8-6v6M4 10l17 0m-14 4h2m4 0h2m-8 4h2m4 0h2"/>',
  cloud:'<path class="blue" d="M6 20C-1 20 1 11 7 12 5 3 19 3 18 12c8 0 8 9 1 9Z"/>',
  weather:'<path class="cream" d="M12 9c0 6-9 6-9 0s9-6 9 0Z"/><path class="detail" d="M7 1v2m-6 5h2m10-4-2 2"/><path class="blue" d="M8 22c-6 0-6-8 0-8-1-8 12-7 11 1 7 0 7 8-1 7Z"/>',
  heart:'<path d="M12 22C-5 12 4-1 12 7 20-1 29 12 12 22Z"/>',
  clock:'<path class="cream" d="M22 12c1 13-21 14-20 0S22-2 22 12Z"/><path class="detail" d="m12 5 0 8 5 2"/>',
  chart:'<path class="detail" d="M3 21 3 13m5 8V9m5 12V6m5 15V3M2 8l7-4 5 1 7-4"/>',
  brain:'<path d="M12 5C8-2 3 3 4 7c-6 1-4 9 0 9-1 7 7 8 8 3 2 6 10 4 9-2 6-2 4-9-1-10 1-6-6-8-8-2Z"/><path class="detail" d="M12 6v13M5 7l3 3-2 4m13-7-3 4 2 4"/>',
  refresh:'<path class="detail" d="M21 7C13-4-3 6 4 17s20 3 16-5M21 2v6l-6 0"/>',
  settings:'<path d="m9 2 5 0 1 4 4 1 3 4-3 4-1 5-5 2-3-3-5 0-3-5 3-4 1-5Z"/><path class="detail" d="M16 12c0 6-8 6-8 0s8-6 8 0Z"/>',
  hide:'<path class="detail" d="M4 12q8-1 16 0"/>',
  moon:'<path d="M19 3C7-2-3 12 6 20c7 6 17 0 17-7C12 17 7 6 19 3Z"/>'
};
function icon(name) { return `<svg class="sticker" viewBox="0 0 26 26" aria-hidden="true">${drawings[name] || drawings.star}</svg>`; }
for (const element of document.querySelectorAll('[data-icon]')) element.innerHTML = icon(element.dataset.icon);
function sketch(element, index) {
  // Small non-repeating pen deviation, not a pronounced scalloped edge.
  const w = Math.max(20, element.clientWidth), h = Math.max(20, element.clientHeight), r = Math.min(19, h / 3), t = index % 3 * .35;
  const d = `M${r} 2 Q${w*.32} ${1+t} ${w*.51} 2 T${w-r} 2 Q${w-2} 1 ${w-2} ${r} Q${w-1-t} ${h*.53} ${w-2} ${h-r} Q${w-1} ${h-2} ${w-r} ${h-2} Q${w*.52} ${h-3+t} ${r} ${h-2} Q2 ${h-1} 2 ${h-r} Q${3+t} ${h*.45} 2 ${r} Q1 2 ${r} 2Z`;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.classList.add('outline'); svg.setAttribute('viewBox', `0 0 ${w} ${h}`); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
  for (let j=0;j<2;j++){const p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('d',d);if(j)p.setAttribute('transform',`translate(3 3) scale(${(w-6)/w} ${(h-6)/h})`);svg.append(p);} element.prepend(svg);
}
function sketchAll() { document.querySelectorAll('[data-paper]').forEach((el,i)=>{el.querySelector(':scope>.outline')?.remove();sketch(el,i);}); }
document.fonts.ready.then(sketchAll);
let sketchTimer; window.addEventListener('resize',()=>{clearTimeout(sketchTimer);sketchTimer=setTimeout(sketchAll,100);});
window.xyIllustrations = { icon, sketchAll };
