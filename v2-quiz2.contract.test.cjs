'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'v2-quiz2.html'),'utf8');
const hub=fs.readFileSync(path.join(__dirname,'v2-study-region.html'),'utf8');
assert(html.includes('クイズ2：光っている場所は？（V2試作）'));
assert(html.includes('function makeOptions(item)'));
assert(html.includes('.land.target{animation:hyogoQuiz2Pulse 1s steps(1,end) infinite}'));
assert(html.includes("target.classList.add(session.answered?'correct':'target')"));
assert(html.includes("button.addEventListener('click',()=>answer(option.code,button))"));
assert(html.includes('grid-template-columns:repeat(2,minmax(0,1fr))'),'Answer options use two columns');
assert(html.includes('formatQuestionName(option)'),'Options include readings and counties');
assert(html.includes("session.missedQuestionCodes.add(session.answer)"),'Only actual missed questions enter retry ledger');
assert(html.includes('if(session.wrongCodes.size===0){session.correct++'),'First-attempt scoring remains in force');
assert(html.includes("byId('prefReset').onclick=()=>fitMap(all,true)"),'Province-wide fit remains');
assert(html.includes("byId('reset').onclick=()=>fitMap(current)"),'Region fit remains');
assert(hub.includes('<a href="/hyogo/v2-quiz2.html">クイズ2（V2試作）</a>'),'Region learning page links quiz 2');
const neighborSource=html.slice(html.indexOf('let municipalNeighbors=new Map();'),html.indexOf('function show(){'));
assert(neighborSource.includes('buildMunicipalNeighbors(shapes)'));
assert(html.includes('municipalNeighbors=buildMunicipalNeighbors(shapes);'));
const topology=Function('shuffle','bounds','all',neighborSource+';return {makeOptions,buildMunicipalNeighbors,setNeighbors:x=>municipalNeighbors=x};');
const codes=Array.from({length:49},(_,i)=>String(28000+i));
const all=Array.from({length:49},(_,i)=>({code:codes[i],name:'市区町村'+i,polys:[[[[i,0],[i+1,1]]]]}));
function bounds(items){let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 for(const r of items)for(const poly of r.polys)for(const ring of poly)for(const [x,y] of ring){
  minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
 }return [minX,minY,maxX,maxY];
}
const actual=topology(a=>a.slice(),bounds,all);
const shapes=all.map((r,i)=>({properties:{N03_007:r.code},arcs:[i===0?0:[i-1,i]]}));
actual.setNeighbors(actual.buildMunicipalNeighbors(shapes));
function check(item,allowed){
 const picks=actual.makeOptions(item).map(x=>x.code);
 assert.equal(picks.length,4,'Exactly four options');
 assert.equal(new Set(picks).size,4,'All four options unique');
 assert(picks.includes(item.code),'Correct municipality included');
 assert(picks.filter(x=>x!==item.code).every(x=>allowed.includes(x)),'Nearby options only');
}
check(all[20],[codes[19],codes[21],codes[18],codes[22]]);
check(all[0],[codes[1],codes[2],codes[3]]);
const geography=actual.buildMunicipalNeighbors([
 {properties:{N03_007:'A'},arcs:[[0,-2]]},
 {properties:{N03_007:'B'},arcs:[[1,2]]},
 {properties:{N03_007:'C'},arcs:[[2,3]]}
]);
assert(geography.get('A').has('B'),'Negative reversed TopoJSON arc connects neighbors');
assert(!geography.get('A').has('C'),'Second-ring neighbor is not direct neighbor');
assert(geography.get('B').has('C'),'Direct shared border detected');
assert(html.includes('<button id="retryMissed" type="button" hidden><span>間違えた問題を</span><span>もう一度</span></button>'));
assert(html.includes("byId('retryMissed').hidden=retryOrder.length===0;"));
assert(html.includes("retryOrder=session.order.filter(item=>session.missedQuestionCodes.has(item.code));"));
assert(html.includes('display:flex;gap:8px;flex-wrap:nowrap;align-items:stretch'),'Three equal-height buttons stay horizontal');
const answerSource=html.match(/function answer\(code,button\)\{[\s\S]*?\n\}/);
assert(answerSource);
const buttons={a:{disabled:false,classList:{add(x){this.added=x}}},b:{disabled:false,classList:{add(x){this.added=x}}}};
const elements={feedback:{textContent:''},next:{hidden:true,textContent:''},choices:{querySelectorAll:()=>Object.values(buttons)}};
const actor=Function('byId','all','render',answerSource[0]+';return answer;')(id=>elements[id],all,()=>{});
 // answer() is bound to a session in its source context; exercise via a controlled closure instead.
const makeActor=Function('byId','all','render',answerSource[0]+';return {answer,session};');
const initial={answered:false,answer:all[1].code,wrongCodes:new Set(),missedQuestionCodes:new Set(),firstTryCorrectCodes:new Set(),correct:0,index:0,order:[all[1]]};
const bound=Function('byId','all','render','buttons',`let session={answered:false,answer:all[1].code,wrongCodes:new Set(),missedQuestionCodes:new Set(),firstTryCorrectCodes:new Set(),correct:0,index:0,order:[all[1]]};${answerSource[0]};return {answer,session};`)(id=>elements[id],all,()=>{},buttons);
bound.answer(all[0].code,buttons.a);
assert.equal(bound.session.correct,0);
assert.equal(buttons.a.disabled,true);
assert.deepEqual([...bound.session.missedQuestionCodes],[all[1].code]);
bound.answer(all[1].code,buttons.b);
assert.equal(bound.session.correct,0,'Wrong then correct earns zero');
assert.equal(elements.next.hidden,false);
assert.equal(buttons.b.disabled,true);
assert.equal(elements.feedback.textContent,'正解です！');
console.log('Hyogo V2 quiz2 four-choice/blink contracts: PASS');
