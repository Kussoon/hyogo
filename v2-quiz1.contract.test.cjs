'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=__dirname,html=fs.readFileSync(path.join(root,'v2-quiz1.html'),'utf8'),
  overview=fs.readFileSync(path.join(root,'v2-study-region.html'),'utf8'),cfg=fs.readFileSync(path.join(root,'v2-regions.js'),'utf8'),
  legacy=fs.readFileSync(path.join(root,'study-region.html'),'utf8');
const old=/const REGIONS = (\[[\s\S]*?\n\]);/.exec(legacy);
assert(old,'Previous ten region code partition must exist');
const before=Function('return '+old[1])();
const win={};Function('window',cfg)(win);
const after=win.KussoonHyogoV2Regions.regions;
assert.deepEqual(after.map(r=>({key:r.key,name:r.name,codes:[...r.codes]})),before);
assert.equal(new Set(after.flatMap(r=>r.codes)).size,49);
assert(overview.indexOf('id="buttons"')<overview.indexOf('id="map"'),'All 10 choice buttons must be above map');
assert.equal((overview.match(/id="buttons"/g)||[]).length,1);
assert(html.includes('/v2/progressive-preview/municipality-renderer.js'),'Reuse shared V2 municipality renderer');
assert(html.includes('/v2/progressive-preview/map-viewport.js'),'Reuse shared viewport');
assert(html.includes('/v2/progressive-preview/label-index.json'),'Reuse 2026 nationwide name index');
assert(html.includes('region.codes.includes')||html.includes('.codes.includes(r.code)'),'Region codes constrain question range');
assert(html.includes('session.answer=item.code'),'Answers use five-digit administrative codes');
assert(!html.includes('KussoonScreenLabels'),'No independent label engine');
for(const m of html.matchAll(/<script(?: [^>]*)?>([\s\S]*?)<\/script>/g)){if(m[1].trim())Function(m[1]);}
assert(html.includes('grid-template-columns:repeat(3,minmax(0,1fr))'),'Region choices must appear in three columns');
assert(!html.includes('id="range"'),'Legacy native dropdown replaced by visible three-column buttons');
assert(html.includes('#start{width:100%;background:#e2f0f9'),'Start button uses full width and pale blue color');
assert(html.includes('<div id="question" class="question" aria-live="polite" hidden></div>'),'Question placeholder is hidden before starting');
assert(!html.includes('「クイズを開始」を押してください。'),'Redundant start instruction is absent');
assert(html.includes('session.wrongCodes.add(code)'),'Every wrong guess remains highlighted');
assert(html.includes("'違います。そこは'+tapped.name+'です。'"),'Wrong feedback gives tapped region formal name');
assert(html.includes('if(session.answered)svg.querySelector'),'Correct region is highlighted only after success');
assert(html.includes("if(code!==session.answer){"),'Wrong guesses do not finish the question');
const a=html.match(/function answer\(code\)\{[\s\S]*?\n\}\nsvg\.addEventListener/);
assert(a,'Answer controller must remain available to behavioral regression test');
const buttons={feedback:{textContent:''},next:{hidden:true,textContent:''}};
const quiz=Function('byId','current','render',
 'let session={answered:false,answer:"28105",wrongCodes:new Set(),correct:0,index:0,order:[1,2]};'
 +a[0].replace(/\nsvg\.addEventListener$/,'')+';return {answer,session};'
)(id=>buttons[id],[{code:'28101',name:'神戸市東灘区'},{code:'28105',name:'神戸市兵庫区'},{code:'28106',name:'神戸市長田区'}],()=>{});
quiz.answer('28101');
assert.equal(buttons.feedback.textContent,'違います。そこは神戸市東灘区です。');
assert.deepEqual([...quiz.session.wrongCodes],['28101']);
assert.equal(buttons.next.hidden,true,'Wrong guesses must not enable next');
assert.equal(quiz.session.correct,0,'Wrong guesses must not score');
quiz.answer('28106');
assert.deepEqual([...quiz.session.wrongCodes],['28101','28106'],'Multiple wrong regions remain red');
quiz.answer('28105');
assert.equal(buttons.next.hidden,false,'Correct answer unlocks next');
assert.equal(quiz.session.correct,1);
assert.equal(quiz.session.answered,true);
console.log('Hyogo V2 region overview + quiz1 static contracts: PASS');