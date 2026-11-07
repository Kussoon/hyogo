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
assert(html.includes('boundarySamples=new Map(all.map(item=>[item.code,sampleBoundary(item)]));'));
const topology=Function('shuffle','bounds','all',neighborSource+';return {makeOptions,buildMunicipalNeighbors,setNeighbors:x=>municipalNeighbors=x,cache:()=>boundarySamples=new Map(all.map(x=>[x.code,sampleBoundary(x)]))};');
function bounds(items){let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 for(const r of items)for(const poly of r.polys)for(const ring of poly)for(const [x,y] of ring){
  minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
 }return [minX,minY,maxX,maxY];
}
const square=(code,x,y)=>({code,name:code,polys:[[[[x,y],[x+.5,y],[x+.5,y+.5],[x,y+.5],[x,y]]]]});
const all=[
 square('尼崎市',0,0),square('西宮市',.5,0),square('伊丹市',0,.5),
 square('川西市',1,0),square('芦屋市',1.5,0),
 square('神戸市北区',7,7),square('猪名川町',2,.2),
 ...Array.from({length:42},(_,i)=>square('遠方'+i,15+i,15+i))
];
const actual=topology(x=>x.slice(),bounds,all);
const adj=new Map(all.map(item=>[item.code,new Set()]));
adj.get('尼崎市').add('西宮市');adj.get('尼崎市').add('伊丹市');
actual.setNeighbors(adj);actual.cache();
const picked=actual.makeOptions(all[0]).map(x=>x.code);
assert.equal(picked.length,4,'Always four answer choices');
assert.equal(new Set(picked).size,4,'All choices unique');
assert(picked.includes('尼崎市'),'Correct city present');
assert(picked.includes('西宮市')&&picked.includes('伊丹市'),'Direct neighbors prioritized');
assert(picked.includes('川西市'),'Nearby city beats remote second-hop city');
assert(!picked.includes('神戸市北区'),'Far away municipality excluded');
const topoNeighbors=actual.buildMunicipalNeighbors([
 {properties:{N03_007:'A'},arcs:[[0,-2]]},
 {properties:{N03_007:'B'},arcs:[[1,2]]},
 {properties:{N03_007:'C'},arcs:[[2,3]]}
]);
assert(topoNeighbors.get('A').has('B'),'Reversed arc counts as shared border');
assert(!topoNeighbors.get('A').has('C'),'Second-hop is not a direct neighbor');
assert(html.includes('<button id="retryMissed" type="button" hidden><span>間違えた問題を</span><span>もう一度</span></button>'));
assert(html.includes("retryOrder=session.order.filter(item=>session.missedQuestionCodes.has(item.code));"));
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
assert.equal(elements.feedback.textContent,'違います。','Incorrect answer shows only the short feedback without suggesting a municipality name');
assert.equal(bound.session.correct,0);
assert.equal(buttons.a.disabled,true);
assert.deepEqual([...bound.session.missedQuestionCodes],[all[1].code]);
bound.answer(all[1].code,buttons.b);
assert.equal(bound.session.correct,0,'Wrong then correct earns zero');
assert.equal(elements.next.hidden,false);
assert.equal(buttons.b.disabled,true);
assert.equal(elements.feedback.textContent,'正解です！');
assert(!html.includes("そこは'+chosen.name"),'Misleading wrong-answer municipality message is absent');
console.log('Hyogo V2 quiz2 four-choice/blink contracts: PASS');
