/* Hyogo 10-area study scopes. Source: existing /hyogo/study-region.html. */
(function(global){'use strict';
const regions=Object.freeze([
 {
  "key": "kobe",
  "name": "神戸",
  "reading": "こうべ",
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
  "reading": "はんしんみなみ",
  "codes": [
   "28202",
   "28204",
   "28206"
  ]
 },
 {
  "key": "hanshin-n",
  "name": "阪神北",
  "reading": "はんしんきた",
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
  "reading": "ひがしはりま",
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
  "reading": "きたはりま",
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
  "reading": "なかはりま",
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
  "reading": "にしはりま",
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
  "reading": "たじま",
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
  "reading": "たんば",
  "codes": [
   "28221",
   "28223"
  ]
 },
 {
  "key": "awaji",
  "name": "淡路",
  "reading": "あわじ",
  "codes": [
   "28205",
   "28224",
   "28226"
  ]
 }
].map(item=>Object.freeze({...item,codes:Object.freeze(item.codes)})));
const countyByTown=Object.freeze({
  "猪名川町": [
    "川辺郡",
    "かわべぐん"
  ],
  "多可町": [
    "多可郡",
    "たかぐん"
  ],
  "稲美町": [
    "加古郡",
    "かこぐん"
  ],
  "播磨町": [
    "加古郡",
    "かこぐん"
  ],
  "市川町": [
    "神崎郡",
    "かんざきぐん"
  ],
  "福崎町": [
    "神崎郡",
    "かんざきぐん"
  ],
  "神河町": [
    "神崎郡",
    "かんざきぐん"
  ],
  "太子町": [
    "揖保郡",
    "いぼぐん"
  ],
  "上郡町": [
    "赤穂郡",
    "あこうぐん"
  ],
  "佐用町": [
    "佐用郡",
    "さようぐん"
  ],
  "香美町": [
    "美方郡",
    "みかたぐん"
  ],
  "新温泉町": [
    "美方郡",
    "みかたぐん"
  ]
});
const all=regions.flatMap(item=>item.codes);
if(regions.length!==10||all.length!==49||new Set(all).size!==49||all.some(code=>!/^28\d{3}$/.test(code)))throw Error('Hyogo region configuration is not a 49-code partition');
global.KussoonHyogoV2Regions=Object.freeze({pref:'28',regions,countyByTown});
})(window);
