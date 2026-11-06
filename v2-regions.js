/* Hyogo 10-area study scopes. Source: existing /hyogo/study-region.html. */
(function(global){'use strict';
const regions=Object.freeze([
 {
  "key": "kobe",
  "name": "神戸",
  "codes": [
   "28101",
   "28102",
   "28105",
   "28106",
   "28107",
   "28108",
   "28109",
   "28110",
   "28111"
  ]
 },
 {
  "key": "hanshin-s",
  "name": "阪神南",
  "codes": [
   "28202",
   "28204",
   "28206"
  ]
 },
 {
  "key": "hanshin-n",
  "name": "阪神北",
  "codes": [
   "28207",
   "28214",
   "28217",
   "28219",
   "28301"
  ]
 },
 {
  "key": "higashi",
  "name": "東播磨",
  "codes": [
   "28203",
   "28210",
   "28216",
   "28381",
   "28382"
  ]
 },
 {
  "key": "kita",
  "name": "北播磨",
  "codes": [
   "28213",
   "28215",
   "28218",
   "28220",
   "28228",
   "28365"
  ]
 },
 {
  "key": "naka",
  "name": "中播磨",
  "codes": [
   "28201",
   "28442",
   "28443",
   "28446"
  ]
 },
 {
  "key": "nishi",
  "name": "西播磨",
  "codes": [
   "28208",
   "28212",
   "28227",
   "28229",
   "28464",
   "28481",
   "28501"
  ]
 },
 {
  "key": "tajima",
  "name": "但馬",
  "codes": [
   "28209",
   "28222",
   "28225",
   "28585",
   "28586"
  ]
 },
 {
  "key": "tamba",
  "name": "丹波",
  "codes": [
   "28221",
   "28223"
  ]
 },
 {
  "key": "awaji",
  "name": "淡路",
  "codes": [
   "28205",
   "28224",
   "28226"
  ]
 }
].map(item=>Object.freeze({...item,codes:Object.freeze(item.codes)})));
const all=regions.flatMap(item=>item.codes);
if(regions.length!==10||all.length!==49||new Set(all).size!==49||all.some(code=>!/^28\d{3}$/.test(code)))throw Error('Hyogo region configuration is not a 49-code partition');
global.KussoonHyogoV2Regions=Object.freeze({pref:'28',regions});
})(window);
