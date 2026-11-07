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
console.log('Hyogo V2 region overview + quiz1 static contracts: PASS');