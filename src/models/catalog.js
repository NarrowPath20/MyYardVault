// The company's three stocked finishes, in the homepage selection order.
export const STOCK_FINISHES = [
  {name:'White Aluminum', hex:'#a7acaa', code:'RAL 9006', metal:0.8, rough:0.4},
  {name:'Oyster White', hex:'#e3d9c6', code:'RAL 1013', metal:0.5, rough:0.55},
  {name:'Slate Grey', hex:'#4b4e53', code:'RAL 7015', metal:0.72, rough:0.46}
];
export const SWATCHES = STOCK_FINISHES;
export const SPECIAL_ORDER_FINISHES = [
  {n:'Sand yellow', c:'RAL 1002', h:'#cba54a'},
  {n:'Signal yellow', c:'RAL 1003', h:'#e9a200'},
  {n:'Traffic red', c:'RAL 2020', h:'#a2302a'},
  {n:'Gentian blue', c:'RAL 5010', h:'#15487c'},
  {n:'Traffic blue', c:'RAL 5017', h:'#1f6ca8'},
  {n:'Turquoise blue', c:'RAL 5018', h:'#0f9199'},
  {n:'Moss green', c:'RAL 6005', h:'#163f33'},
  {n:'Jet black', c:'RAL 9005', h:'#0e0e10'},
  {n:'Pure white', c:'RAL 9010', h:'#f1ede1'},
  {n:'Galvanized', c:'BARE ZINC', h:'#c4cad1'},
  {n:'My Yard Vault 4 Corners violet', c:'CUSTOM', h:'#6a2b8c'}
];
export const RAL = STOCK_FINISHES.map(finish=>({n:finish.name,c:finish.code,h:finish.hex}));
export const SIZES = {
  '3.5': {tag:'Compact', name:'3.5&prime; Vault', img:'/assets/images/d5204f91dde4960a.webp', bg:'#000000', area:'26 sq ft', use:'Bikes, tools &amp; totes', price:'$3,199', note:'starting price', door:'End'},
  '5':   {tag:'Small', name:'5&prime; Vault', img:'/assets/images/a0094034d6531d81.webp', bg:'#000000', area:'37 sq ft', use:'Mowers &amp; seasonal gear', price:'$3,695', note:'starting price', door:'End'},
  '7':   {tag:'Premium compact', name:'7&prime; Vault', img:'/assets/images/226b1c415bbaf21c.webp', bg:'#020202', area:'52 sq ft', use:"A one-car garage's worth", price:'$3,950', note:'starting price', door:'End'},
  '10':  {tag:'10-foot configuration', name:'10&prime; Vault', img:'/assets/images/b2019d0b4d709ed9.webp', bg:'#000101', area:'75 sq ft', use:'Motorcycle + workshop', price:'$4,725', note:'starting price', door:'Side or end'},
  '13':  {tag:'Extended', name:'13&prime; Vault', img:'/assets/images/0e6f66e3f95da9ea.webp', bg:'#000000', area:'97 sq ft', use:'A studio of belongings', price:'$5,620', note:'starting price', door:'Side or end'},
  '16':  {tag:'Large', name:'16&prime; Vault', img:'/assets/images/37f1313d8c1afcfd.webp', bg:'#000000', area:'120 sq ft', use:'Multi-room move', price:'$6,875', note:'starting price', door:'Side or end'},
  '19':  {tag:'Maximum', name:'19&prime; Vault', img:'/assets/images/237a10fc3bdd90bc.webp', bg:'#000000', area:'142 sq ft', use:'Whole-home or fleet gear', price:'$8,100', note:'starting price', door:'Side, end or multi'}
};
export const SIZE_ORDER=['3.5','5','7','10','13','16','19'];

export const ST_FINISHES = STOCK_FINISHES;
