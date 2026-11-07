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
assert(html.includes("'違います。\\nそこは'+tapped.name+'です。'"),'Wrong feedback places the tapped region on a new line');
assert(html.includes('if(session.answered)svg.querySelector'),'Correct region is highlighted only after success');
assert(html.includes("if(code!==session.answer){"),'Wrong guesses do not finish the question');
const a=html.match(/function answer\(code\)\{[\s\S]*?\n\}\nsvg\.addEventListener/);
assert(a,'Answer controller must remain available to behavioral regression test');
const buttons={feedback:{textContent:''},next:{hidden:true,textContent:''}};
const quiz=Function('byId','current','render',
 'let session={answered:false,answer:"28105",wrongCodes:new Set(),firstTryCorrectCodes:new Set(),missedQuestionCodes:new Set(),correct:0,index:0,order:[1,2]};'
 +a[0].replace(/\nsvg\.addEventListener$/,'')+';return {answer,session};'
)(id=>buttons[id],[{code:'28101',name:'神戸市東灘区'},{code:'28105',name:'神戸市兵庫区'},{code:'28106',name:'神戸市長田区'}],()=>{});
quiz.answer('28101');
assert.equal(buttons.feedback.textContent,'違います。\nそこは神戸市東灘区です。');
assert.deepEqual([...quiz.session.wrongCodes],['28101']);
assert.deepEqual([...quiz.session.missedQuestionCodes],['28105'],'An incorrect tap records the QUESTION code, not the tapped region code');
assert.equal(buttons.next.hidden,true,'Wrong guesses must not enable next');
assert.equal(quiz.session.correct,0,'Wrong guesses must not score');
quiz.answer('28106');
assert.deepEqual([...quiz.session.wrongCodes],['28101','28106'],'Multiple wrong regions remain red');
assert.deepEqual([...quiz.session.missedQuestionCodes],['28105'],'Repeated mistakes on one question produce one retry target');
quiz.answer('28105');
assert.equal(buttons.next.hidden,false,'Correct answer unlocks next');
assert.equal(quiz.session.correct,0,'A question answered after one or more mistakes does not earn a point');
assert.equal(quiz.session.answered,true);
assert.equal(quiz.session.firstTryCorrectCodes.size,0,'Wrong-then-correct is not counted as first-try correct');
const freshButtons={feedback:{textContent:''},next:{hidden:true,textContent:''}};
const freshQuiz=Function('byId','current','render',
 'let session={answered:false,answer:"28105",wrongCodes:new Set(),firstTryCorrectCodes:new Set(),missedQuestionCodes:new Set(),correct:0,index:0,order:[1,2]};'
 +a[0].replace(/\nsvg\.addEventListener$/,'')+';return {answer,session};'
)(id=>freshButtons[id],[{code:'28101',name:'神戸市東灘区'},{code:'28105',name:'神戸市兵庫区'}],()=>{});
freshQuiz.answer('28105');
assert.equal(freshQuiz.session.correct,1,'First try correct earns one point');
assert.deepEqual([...freshQuiz.session.firstTryCorrectCodes],['28105'],'First try correct code is remembered');
assert.equal(freshQuiz.session.missedQuestionCodes.size,0,'Correct first try has no missed retry target');
assert.equal(freshButtons.next.hidden,false,'First try correct unlocks next');
assert(html.includes('if(session.wrongCodes.size===0){session.correct++;session.firstTryCorrectCodes.add(session.answer);}'),'Scoring only counts questions solved on the first try');

assert(html.includes('min-height:39px;padding:5px 3px'),'Region buttons have a more compact height');
assert(html.includes('font-size:clamp(11px,3.1vw,14px)'),'Region button font is reduced');
assert(!html.includes('地域別の市区町村名を見て、地図上の位置を押してください。'),'Requested explanatory paragraph removed');
assert(html.includes("byId('answerArea').hidden=false;"),'Response area shown when a question begins, before any answer');
assert(html.includes("byId('answerArea').hidden=true;"),'Response area hidden outside a quiz');
// The map must not move vertically as feedback and next controls appear.
assert(html.includes('#mapTopBar{position:absolute;z-index:3;top:10px;left:10px;right:10px;'),'Top map overlay is above map and outside normal layout');
assert(html.includes('#answerArea{flex:1 1 auto;min-width:0;display:flex;flex-direction:row;align-items:center;'),'Feedback and next action share the same horizontal top row as region caption');
assert(html.includes('#answerArea[hidden],#answerArea #next[hidden],#replayArea[hidden],#quit[hidden],#retryMissed[hidden]{display:none}'),'Hidden controls occupy no map area');
assert(html.includes('#feedback:empty{display:none}'),'Empty feedback creates no visible card');
assert(!html.includes('grid-template-rows:4.8em 62px'),'Previous large empty spacer is removed');
assert(html.indexOf('class="map-frame"')<html.indexOf('id="answerArea"')&&html.indexOf('id="answerArea"')<html.indexOf('class="map-controls"'),'Feedback and next button are overlaid inside the map');
assert(html.includes('.map-controls{position:absolute;top:auto;bottom:12px;right:9px;'),'Zoom controls are docked at the lower right');
assert(html.includes("byId('answerArea').hidden=false;"),'Map feedback enabled at question start without moving the map');
assert(html.includes('flex-direction:row;align-items:center;gap:7px;pointer-events:none'),'Correct feedback and next button are side-by-side');
assert(html.includes('flex:1 1 0;min-width:0;margin:0;padding:2px 3px;'),'Feedback stays flexible without button-like padding');
assert(html.includes('background:transparent;border:0;border-radius:0;box-shadow:none'),'Feedback has no panel, border, rounded rectangle or button shadow');
assert(html.includes('text-shadow:0 1px 2px #fff'),'Feedback stays readable on the map with white text outline');
assert(html.includes('font-size:clamp(18px,4.8vw,24px);line-height:1.4;white-space:pre-line;'),'Feedback uses 18–24px text and renders explicit line breaks');
assert(html.includes('#next{flex:1 1 0;min-width:0;width:auto;min-height:44px;max-width:none;margin:0;background:#e2f0f9'),'Next question remains a button with its background');
assert(html.includes("byId('feedback').textContent='正解です！';"),'Correct feedback is unchanged');
assert(html.includes("byId('feedback').textContent='違います。\\nそこは'+tapped.name+'です。';"),'Wrong feedback shows the tapped region on line two');
assert(html.includes('#next{flex:1 1 0;min-width:0;width:auto'),'Next action occupies equal flexible width');
assert(html.includes('#answerArea #next[hidden],#replayArea[hidden],#quit[hidden],#retryMissed[hidden]{display:none}'),'Next button remains absent until correct answer');
assert(html.includes("byId('next').hidden=true;"),'Next button remains hidden until correct answer');
assert(html.includes('display:flex;align-items:center;justify-content:center;text-align:center;flex:1 1 0'),'Answer feedback centered vertically and horizontally');
assert(html.includes('id="quizStartAnchor"'),'Region selection scroll has stable target');
assert(html.indexOf('id="rangeChoices"')<html.indexOf('id="quizStartAnchor"')&&html.indexOf('id="quizStartAnchor"')<html.indexOf('id="start"'),'Scroll target is directly after the region selector');
assert(html.includes("requestAnimationFrame(()=>byId('quizStartAnchor').scrollIntoView({behavior:'smooth',block:'start'}))"),'Initial region selection scrolls to quiz start');
assert(html.includes("byId('question').scrollIntoView({behavior:'smooth',block:'start'})"),'Starting quiz scrolls to question and map');
assert(html.includes('if(startedOnce&&all.length){start();}'),'Subsequent regional choice starts quiz and scrolls to question');
assert(html.includes('startedOnce=true;retryOrder=[];session={order'),'Quiz-start state is tracked after first start');
assert(!html.includes("byId('quizStartAnchor').scrollIntoView({behavior:'smooth',block:'start'});focus();"),'No automatic scrolling while initializing data');
assert(html.includes('<span>兵庫県</span><strong id="mapRegionName"></strong>'),'Two-line prefecture and region name is overlaid on map');
assert(html.includes("byId('mapRegionName').textContent=regions.find(r=>r.key===selectedRange).name;"),'Map starts with currently selected region name');
assert(html.includes("byId('mapRegionName').textContent=region.name;"),'Map region caption is updated on region switch');
assert(html.includes('.map-area-name{flex:0 0 auto;display:flex;'),'Prefecture and region caption is the first item in the top row');
assert(html.indexOf('class="map-area-name"')<html.indexOf('id="answerArea"'),'Correct/wrong feedback follows the region caption in the map');
assert(html.indexOf('id="mapTopBar"')<html.indexOf('class="map-area-name"')&&html.indexOf('class="map-area-name"')<html.indexOf('id="answerArea"'),'Caption is left of feedback and next button in same map top bar');

assert(html.includes('.question ruby{ruby-position:over}'),'Question readings use ruby above the name');
assert(html.includes('.question rt{font-size:.48em;font-weight:700;letter-spacing:.02em}'),'Question ruby text is enlarged for readability');
assert(html.includes("byId('question').innerHTML=(session.index+1)+' / '+session.order.length+'問：'+formatQuestionName(item)+'はどこ？';"),'Question uses ruby formatted name');
assert(html.includes('function escapeHtml(value){'),'Question name and reading are HTML escaped');
assert(html.includes("'神戸市北区':'こうべしきたく'"),'Hyogo ward reading is available');
assert(html.includes("'新温泉町':'しんおんせんちょう'"),'All Hyogo municipality readings are covered');
assert(html.includes('indexed?.reading||indexed?.kana||indexed?.ruby||MANUAL_READINGS_BY_NAME[name]||'),'Indexed readings are preferred before manual fallback');

const countyEntries=[...html.matchAll(/^  '([^']+町)':\['([^']+郡)','([^']+ぐん)'\],?$/gm)];
assert.equal(countyEntries.length,12,'Every one of Hyogo’s 12 towns has a county');
assert.equal(new Set(countyEntries.map(m=>m[1])).size,12,'No duplicate county mapping');
assert.equal(new Set(countyEntries.map(m=>m[2])).size,8,'County mappings cover the 8 actual counties');
const nameFormatter=html.match(/const COUNTY_BY_TOWN = \{[\s\S]*?\n\};\nfunction formatQuestionName\(item\)\{[\s\S]*?\n\}/);
assert(nameFormatter,'County mapping and question name formatter are present');
const format=Function('MANUAL_READINGS_BY_NAME','escapeHtml',nameFormatter[0]+';return formatQuestionName;')(
  Object.fromEntries([
    ['香美町','かみちょう'],['新温泉町','しんおんせんちょう'],
    ['猪名川町','いながわちょう'],['多可町','たかちょう'],['稲美町','いなみちょう'],
    ['播磨町','はりまちょう'],['市川町','いちかわちょう'],['福崎町','ふくさきちょう'],
    ['神河町','かみかわちょう'],['太子町','たいしちょう'],['上郡町','かみごおりちょう'],
    ['佐用町','さようちょう']
  ]),
  s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))
);
assert.equal(format({name:'香美町',reading:'かみちょう'}),'<ruby>美方郡香美町<rt>みかたぐんかみちょう</rt></ruby>');
assert.equal(format({name:'太子町',reading:'たいしちょう'}),'<ruby>揖保郡太子町<rt>いぼぐんたいしちょう</rt></ruby>');
assert.equal(format({name:'神戸市北区',reading:'こうべしきたく'}),'<ruby>神戸市北区<rt>こうべしきたく</rt></ruby>');
assert.equal(format({name:'西宮市',reading:'にしのみやし'}),'<ruby>西宮市<rt>にしのみやし</rt></ruby>');
assert.equal(format({name:'A&B',reading:'a<b'}),'<ruby>A&amp;B<rt>a&lt;b</rt></ruby>');

assert(html.includes("status.textContent='';status.hidden=true;"),'Normal region count status under map is hidden');
assert(html.includes("status.hidden=false;status.textContent='読み込みエラー：'+err.message"),'Actual loading errors remain visible');
assert(html.includes("question.style.minHeight=question.getBoundingClientRect().height+'px'"),'Result retains the last question panel height so the map cannot jump upwards');
assert(html.includes("function start(orderOverride){const order=shuffle(Array.isArray(orderOverride)?orderOverride:current);if(!order.length)return;byId('question').style.minHeight=''"),'Restart clears the retained height and supports missed-only retry');
assert(html.includes("session=null;retryOrder=[];byId('question').style.minHeight=''"),'Region change clears the retained height');
assert(html.includes('#replayArea[hidden],#quit[hidden],#retryMissed[hidden]{display:none}'),'Replay controls occupy no space before completion');
assert(html.indexOf('class="map-frame"')<html.indexOf('id="replayArea"'),'Replay button is positioned after map');
assert(html.includes("if(session.index>=session.order.length){finishQuiz();return;}"),'Normal finish shares the same result screen with quitting');
assert(html.includes("byId('start').hidden=true;")&&html.includes("byId('replayArea').hidden=false;"),'Completion leaves start hidden and reveals result actions');
assert(html.includes("byId('replayArea').hidden=true;startedOnce=true;"),'Restart removes below-map replay');
assert(html.includes("byId('replayArea').hidden=true;byId('quit').hidden=true;if(all.length)focus();"),'Changing region removes replay');
assert(html.includes("byId('replay').onclick=start;"),'Replay starts a new quiz');
assert(html.includes('#replayArea{display:flex;gap:8px;flex-wrap:nowrap;align-items:stretch}'),'Result buttons display side-by-side with equal height');
assert(html.includes('#replayArea button{display:flex;flex:1 1 0;flex-direction:column;align-items:center;justify-content:center;min-width:0;'),'Result actions have equal flexible widths');
assert(html.includes('<button id="returnRegions" type="button">地域選択に戻る</button>'),'Return to selection button is present');
assert(html.includes('<button id="retryMissed" type="button" hidden><span>間違えた問題を</span><span>もう一度</span></button>'),'Missed-question retry label has exactly two lines');
assert(html.includes('<button id="replay" type="button"><span>最初から</span><span>もう一度</span></button>'),'Full retry label has two lines');
assert(html.includes('#replayArea button{display:flex;flex:1 1 0;flex-direction:column;align-items:center;justify-content:center;min-width:0;min-height:68px;'),'Three buttons have the same flexible width and minimum height');
assert(html.includes('#retryMissed[hidden]{display:none}'),'Perfect score hides missed question retry option');
assert(html.includes("retryOrder=session.order.filter(item=>session.missedQuestionCodes.has(item.code));"),'Retry targets only questions with actual incorrect answers, not unanswered questions');
assert(html.includes('session.missedQuestionCodes.add(session.answer);'),'Wrong answers record the target question code');
assert(html.includes("byId('retryMissed').hidden=retryOrder.length===0;"),'Missed retry button appears only if an incorrect answer was actually given');
assert(html.includes("byId('retryMissed').onclick=()=>start(retryOrder);"),'Retry missed questions starts a focused quiz');
assert(html.includes("firstTryCorrectCodes:new Set(),missedQuestionCodes:new Set()"),'New attempt begins with fresh first-try score and incorrect-answer ledgers');
assert(html.includes("session.firstTryCorrectCodes.add(session.answer)"),'First-try success is tracked by administrative code');
assert(html.includes('<button id="quit" type="button" hidden>ここでやめる</button>'),'Quit control starts hidden');
assert(html.includes('#quit{position:absolute;left:10px;bottom:12px;'),'Quit control sits at bottom left on map without changing its layout');
assert(html.includes("byId('quit').hidden=false;show();scrollToQuestion();"),'Quit control appears after quiz starts');
assert(html.includes("byId('quit').hidden=true;")&&html.includes("byId('replayArea').hidden=false;"),'Quit control disappears when results display');
assert(html.includes("byId('quit').onclick=finishQuiz;"),'Quit invokes the same grading routine as natural completion');
assert(html.includes("byId('returnRegions').onclick=returnToRegions;"),'Return action wired');
assert(html.includes('window.scrollTo(0,0);'),'Return scrolls immediately to top');
assert(html.includes("question.textContent='終了：'+session.correct+' / '+session.order.length+'問正解';"),'Partial score uses total number of region questions');
// Returning to region selection must restore the original two-step start flow.
const returnBlock=html.match(/function returnToRegions\(\)\{[\s\S]*?\n\}/);
assert(returnBlock,'Region selection return handler exists');
assert(returnBlock[0].includes('startedOnce=false;'),'Return action resets auto-start state');
assert(html.includes('if(startedOnce&&all.length){start();}else{'),'Region selection waits for the explicit start button after reset');
assert(html.includes('id="reset" class="fit-button" type="button" aria-label="地域全体"><span>地域</span><span>全体</span>'),'Region full extent is two lines');
assert(html.includes('id="prefReset" class="fit-button" type="button" aria-label="兵庫県全体"><span>県の</span><span>全体</span>'),'Prefecture full extent is two lines beneath the region control');
assert(html.includes("byId('reset').onclick=()=>fitMap(current);"),'Region fit projects the current region');
assert(html.includes("byId('prefReset').onclick=()=>fitMap(all,true);"),'Prefecture fit projects all 49 Hyogo areas using portrait-aware framing');
assert(html.includes("projection=project(bounds(items));\n viewport.reset();\n render();"),'Fitting recalculates projection and resets viewport');
assert(html.includes("Math.round(W*rect.height/rect.width)"),'Prefecture full extent uses actual map frame aspect ratio');
assert(html.includes("viewport.destroy();"),'Old viewport listeners are removed before aspect-ratio reinitialization');
assert(html.includes("frameHeight=targetHeight;"),'Canvas height matches mode-specific map aspect');
assert(html.includes("KussoonV2MapViewport.init({svg,width:W,height:frameHeight})"),'Viewport supports taller portrait canvas');
assert(html.includes("const targetHeight=isPrefecture&&rect.width>0&&rect.height>0"),'Region mode keeps established 700-unit projection');

assert(html.includes('current=all.filter(r=>region.codes.includes(r.code));if(!current.length)return;fitMap(current);'),'Region selection still starts zoomed to the chosen region');
assert(html.includes('.map-controls .fit-button{display:flex;flex-direction:column;'),'Extent buttons use two stacked lines');
assert(html.includes('.map-controls button{width:50px;min-width:50px;'),'Four map controls are narrower without altering their type size');
assert(html.includes('font-size:clamp(12px,3.1vw,16px)}'),'Map fit control text remains original size');
assert(html.includes('font-size:clamp(10px,3.3vw,18px);line-height:1.25'),'All three result buttons use a larger responsive font');
assert(html.includes('#retryMissed{font-size:clamp(10px,3vw,16px)!important}'),'Missed button font increases while fitting narrow phones');
assert(html.includes('#retryMissed span,#replay span,#returnRegions{white-space:nowrap}'),'Result button labels cannot wrap to a third line');
assert(!html.includes('<span>間違えた問題だけを</span>'),'Obsolete longer text removed');
console.log('Hyogo V2 region overview + quiz1 static contracts: PASS');