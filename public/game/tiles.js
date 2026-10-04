// タイル（16×16）の描画。画像ファイルを使わず、コードで描いて焼き込む。
// 配色は 2000 年代前半の携帯機 RPG を意識した明るいもの。色は P を変えれば全体に反映される。
export const TILE = 16;

const P = {
  // 屋外
  grass: '#8cd65a', grass2: '#7ac44a', grassDark: '#5aa838',
  path: '#eedc9a', path2: '#e0c884', pathDot: '#cfb470',
  petalR: '#ff6b6b', petalY: '#ffd84a', petalW: '#ffffff', center: '#ffe9a0', leaf: '#4a9a3a',
  treeLight: '#6fcf5a', tree: '#3f9b3a', treeDark: '#2c7a2c', trunk: '#8a5a2b', trunkDark: '#5e3a1a',
  fence: '#d8b070', fenceDark: '#a07840',
  roof: '#e85c4a', roof2: '#f27a68', roofDark: '#b63d2e', ridge: '#ffb0a0',
  bwall: '#f6efe0', bwall2: '#e8dcc4', bwallLine: '#cdbfa3', bbase: '#9c8f78',
  bwin: '#8fd3f4', bwin2: '#d6f2ff', bframe: '#5f6b7a',
  bdoor: '#5f6b7a', bdoor2: '#7a8797', bdoorGlass: '#bfe8ff',
  plate: '#ffffff', plateInk: '#e85c4a', plateLine: '#5f6b7a',
  signWood: '#c89a5a', signWoodDark: '#8a6232', signText: '#5a3a1a',
  bench: '#d8a060', benchDark: '#9a6a34',
  plaza: '#e6e1d6', plaza2: '#d9d3c6', plazaLine: '#c9c2b3',
  groof: '#9aa3ad', groof2: '#b4bcc5', groofDark: '#7a838d', groofEdge: '#d2d8de',
  mwall: '#dfe3e8', mwall2: '#cfd5dc', mwallLine: '#b8c0c9', mbase: '#8d96a1',
  mwin: '#7fc4ec', mwin2: '#d0efff', mframe: '#55606c',
  mdoor: '#55606c', mdoorGlass: '#bfe8ff',
  stone: '#8f8f98', stone2: '#b5b5bd', stoneDark: '#5f5f68',
  // 屋内
  floor: '#f4e7c8', floor2: '#ead9b4', floorLine: '#d9c69c',
  wallTop: '#5b6576', wallFace: '#c9d3df', wallFace2: '#b7c3d1', wallLine: '#9fadbd', wallBase: '#7e8a99',
  carpet: '#8fa8d8', carpet2: '#7f98c8',
  doorWood: '#b07a3c', doorWood2: '#c98f4c', doorFrame: '#5c3a16', doorKnob: '#ffd84a',
  glass: '#8fd3f4', glass2: '#d6f2ff', frame: '#6b7280',
  deskTop: '#d9a05a', deskTop2: '#e9b56e', deskSide: '#a4712f', deskLine: '#c48b45',
  pc: '#3c4048', pcDark: '#24272d', screen: '#5fc4f2', screen2: '#2f78a8',
  shelf: '#a4712f', shelfDark: '#6e4a1e',
  books: ['#ff6b6b', '#4aa3ff', '#5bc96a', '#ffd84a', '#b57bee', '#ff9f43', '#ffffff'],
  white: '#ffffff', ink: '#2f6fd8', inkRed: '#e85c4a', inkGreen: '#3aa65a',
  metal: '#c3c9d3', metal2: '#8f98a6', metalDark: '#5f6773', metalLight: '#e6eaf0',
  leds: ['#ff5a5a', '#5aff7a', '#ffe15a', '#5ab4ff'],
  cork: '#d9ac6a', corkDark: '#b48a4e', paper: '#fffdf5', pin: '#e85c4a',
  plantLeaf: '#4fb35a', plantLeaf2: '#2f8a3c', plantLight: '#8ee08a', pot: '#c97a4a', potDark: '#8a4e2c',
  chair: '#5b6576', chair2: '#3b4452',
  step: '#d3d8e0', step2: '#aab2bf',
};

const cache = new Map();
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
function make(draw, v) { const c = document.createElement('canvas'); c.width = TILE; c.height = TILE; draw(c.getContext('2d'), v); return c; }

const D = {
  // ---------- 屋外 ----------
  grass(g, v) {
    R(g, 0, 0, 16, 16, P.grass);
    // 草の目印（小さな V）を散らす
    const pts = [[3, 4], [10, 2], [6, 11], [12, 9], [1, 13]];
    pts.forEach(([x, y], i) => { if ((i + v) % 3 !== 0) { R(g, x, y, 1, 1, P.grassDark); R(g, x + 2, y, 1, 1, P.grassDark); R(g, x + 1, y + 1, 1, 1, P.grassDark); } });
    if (v % 2) R(g, 8, 6, 2, 1, P.grass2);
  },
  path(g, v) {
    R(g, 0, 0, 16, 16, P.path);
    R(g, 2 + (v % 3), 3, 1, 1, P.pathDot); R(g, 9, 7 + (v % 2), 1, 1, P.pathDot); R(g, 5, 12, 1, 1, P.pathDot); R(g, 12, 2, 1, 1, P.path2); R(g, 13, 12, 2, 1, P.path2);
  },
  flower(g, v) {
    D.grass(g, 1);
    const flower = (x, y, col, f) => {
      const o = f ? 1 : 0;
      R(g, x + 1, y, 1, 1, col); R(g, x, y + 1, 1, 1, col); R(g, x + 2, y + 1, 1, 1, col); R(g, x + 1, y + 2, 1, 1, col);
      R(g, x + 1, y + 1, 1, 1, P.center);
      R(g, x + 1 + o, y + 3, 1, 1, P.leaf);
    };
    flower(2, 3, P.petalR, v); flower(9, 2, P.petalY, !v); flower(5, 9, P.petalW, v); flower(11, 10, P.petalR, !v);
  },
  tree(g) {        // 木の下半分（幹と下の葉）
    D.grass(g, 0);
    R(g, 2, 0, 12, 7, P.tree); R(g, 1, 1, 14, 4, P.tree);
    R(g, 3, 1, 3, 2, P.treeLight); R(g, 2, 5, 12, 2, P.treeDark);
    R(g, 6, 7, 4, 6, P.trunk); R(g, 9, 7, 1, 6, P.trunkDark);
    R(g, 5, 13, 6, 1, P.grassDark);
  },
  treeTop(g) {     // 木の上半分（手前に重ねる。透明部分あり）
    R(g, 5, 1, 6, 2, P.tree); R(g, 3, 3, 10, 2, P.tree); R(g, 2, 5, 12, 6, P.tree); R(g, 1, 8, 14, 8, P.tree);
    R(g, 6, 2, 2, 1, P.treeLight); R(g, 4, 4, 3, 2, P.treeLight); R(g, 3, 7, 2, 2, P.treeLight);
    R(g, 9, 9, 4, 3, P.treeDark); R(g, 2, 13, 4, 3, P.treeDark); R(g, 11, 13, 3, 3, P.treeDark);
  },
  fence(g) {
    D.grass(g, 2);
    R(g, 0, 6, 16, 2, P.fence); R(g, 0, 11, 16, 2, P.fence);
    R(g, 2, 3, 3, 11, P.fence); R(g, 11, 3, 3, 11, P.fence);
    R(g, 4, 3, 1, 11, P.fenceDark); R(g, 13, 3, 1, 11, P.fenceDark); R(g, 0, 7, 16, 1, P.fenceDark); R(g, 0, 12, 16, 1, P.fenceDark);
  },
  sign(g) {
    D.grass(g, 0);
    R(g, 7, 9, 2, 6, P.signWoodDark);
    R(g, 2, 2, 12, 8, P.signWoodDark); R(g, 3, 3, 10, 6, P.signWood);
    R(g, 4, 4, 6, 1, P.signText); R(g, 4, 6, 8, 1, P.signText);
  },
  bench(g) {
    D.grass(g, 1);
    R(g, 1, 5, 14, 4, P.bench); R(g, 1, 9, 14, 1, P.benchDark);
    R(g, 2, 10, 2, 4, P.benchDark); R(g, 12, 10, 2, 4, P.benchDark);
    R(g, 1, 3, 14, 2, P.benchDark);
  },
  plaza(g, v) {         // 石畳の広場
    R(g, 0, 0, 16, 16, P.plaza);
    R(g, 0, 7, 16, 1, P.plazaLine); R(g, 0, 15, 16, 1, P.plazaLine);
    R(g, 7 + (v % 2) * 4, 0, 1, 7, P.plazaLine); R(g, 3 + (v % 3) * 4, 8, 1, 7, P.plazaLine);
    R(g, 2, 3, 2, 1, P.plaza2); R(g, 11, 11, 2, 1, P.plaza2);
  },
  groof(g, v) {         // 灰色の屋根（陸屋根）。v=1 は最上段
    R(g, 0, 0, 16, 16, P.groof);
    R(g, 0, 4, 16, 1, P.groofDark); R(g, 0, 12, 16, 1, P.groofDark);
    R(g, 4, 5, 1, 7, P.groof2); R(g, 12, 5, 1, 7, P.groof2);
    if (v === 1) { R(g, 0, 0, 16, 3, P.groofEdge); R(g, 0, 3, 16, 1, P.groofDark); }
  },
  mwall(g) {            // 現代的な外壁（パネル）
    R(g, 0, 0, 16, 16, P.mwall);
    R(g, 0, 5, 16, 1, P.mwallLine); R(g, 0, 11, 16, 1, P.mwallLine); R(g, 7, 0, 1, 16, P.mwallLine);
    R(g, 1, 1, 5, 3, P.mwall2); R(g, 9, 7, 5, 3, P.mwall2);
    R(g, 0, 14, 16, 2, P.mbase);
  },
  mwindow(g) {          // 縦長の窓
    D.mwall(g);
    R(g, 2, 1, 12, 13, P.mframe); R(g, 3, 2, 10, 11, P.mwin);
    R(g, 7, 2, 1, 11, P.mframe); R(g, 3, 7, 10, 1, P.mframe);
    R(g, 4, 3, 2, 2, P.mwin2); R(g, 9, 3, 3, 1, P.mwin2);
  },
  mdoor(g) {            // 現代的な入口（ガラス扉）
    D.mwall(g);
    R(g, 1, 1, 14, 15, P.mframe); R(g, 2, 2, 12, 14, P.mdoorGlass);
    R(g, 7, 2, 2, 14, P.mframe); R(g, 2, 9, 12, 1, P.mframe);
    R(g, 3, 3, 3, 5, '#e8f6ff'); R(g, 10, 3, 3, 5, '#e8f6ff');
    R(g, 5, 10, 1, 3, P.mdoor); R(g, 10, 10, 1, 3, P.mdoor);
  },
  stone(g) {            // 石のアート
    D.grass(g, 2);
    R(g, 3, 13, 10, 2, P.stoneDark);
    R(g, 4, 5, 8, 8, P.stone); R(g, 6, 2, 4, 4, P.stone); R(g, 2, 8, 3, 4, P.stone);
    R(g, 5, 6, 2, 2, P.stone2); R(g, 7, 3, 1, 2, P.stone2); R(g, 9, 9, 2, 3, P.stoneDark); R(g, 3, 10, 1, 2, P.stoneDark);
  },
  roof(g, v) {
    R(g, 0, 0, 16, 16, P.roof);
    for (let y = 2; y < 16; y += 4) { R(g, 0, y, 16, 1, P.roofDark); for (let x = ((y / 4) % 2) * 4; x < 16; x += 8) R(g, x, y + 1, 1, 3, P.roofDark); }
    R(g, 0, 1, 16, 1, P.roof2);
    if (v === 1) { R(g, 0, 0, 16, 2, P.ridge); R(g, 0, 2, 16, 1, P.roofDark); }   // 屋根の最上段
  },
  bwall(g) {
    R(g, 0, 0, 16, 16, P.bwall);
    R(g, 0, 7, 16, 1, P.bwallLine); R(g, 8, 0, 1, 7, P.bwallLine); R(g, 3, 8, 1, 8, P.bwallLine); R(g, 12, 8, 1, 8, P.bwallLine);
    R(g, 0, 14, 16, 2, P.bbase);
  },
  bwindow(g) {
    D.bwall(g);
    R(g, 2, 2, 12, 10, P.bframe); R(g, 3, 3, 10, 8, P.bwin);
    R(g, 7, 3, 1, 8, P.bframe); R(g, 3, 7, 10, 1, P.bframe);
    R(g, 4, 4, 2, 1, P.bwin2); R(g, 9, 4, 3, 1, P.bwin2);
  },
  bdoor(g) {
    D.bwall(g);
    R(g, 2, 1, 12, 15, P.bframe); R(g, 3, 2, 10, 14, P.bdoor);
    R(g, 4, 3, 3, 5, P.bdoorGlass); R(g, 9, 3, 3, 5, P.bdoorGlass); R(g, 7, 2, 2, 14, P.bdoor2);
    R(g, 5, 10, 1, 2, P.doorKnob); R(g, 10, 10, 1, 2, P.doorKnob);
  },
  plate(g) {
    D.bwall(g);
    R(g, 1, 3, 14, 8, P.plateLine); R(g, 2, 4, 12, 6, P.plate);
    R(g, 3, 5, 4, 1, P.plateInk); R(g, 8, 5, 5, 1, P.plateLine); R(g, 3, 7, 10, 1, P.plateLine); R(g, 3, 8, 6, 1, P.plateLine);
  },

  // ---------- 屋内 ----------
  floor(g, v) {
    R(g, 0, 0, 16, 16, P.floor);
    R(g, 0, 0, 16, 1, P.floorLine); R(g, 0, 0, 1, 16, P.floorLine);
    if (v % 3 === 1) R(g, 6, 9, 2, 1, P.floor2);
    if (v % 3 === 2) R(g, 10, 4, 1, 2, P.floor2);
  },
  carpet(g) {
    R(g, 0, 0, 16, 16, P.carpet);
    for (let y = 0; y < 16; y += 4) for (let x = (y / 4) % 2 ? 2 : 0; x < 16; x += 4) R(g, x, y, 2, 2, P.carpet2);
  },
  wallFace(g) {
    R(g, 0, 0, 16, 16, P.wallFace);
    R(g, 0, 0, 16, 2, P.wallTop);
    R(g, 0, 8, 16, 1, P.wallLine); R(g, 8, 2, 1, 6, P.wallLine); R(g, 0, 9, 1, 5, P.wallLine); R(g, 15, 9, 1, 5, P.wallLine);
    R(g, 0, 13, 16, 3, P.wallBase);
  },
  wallTop(g) { R(g, 0, 0, 16, 16, P.wallTop); R(g, 0, 0, 16, 1, '#6c7788'); R(g, 0, 15, 16, 1, '#46505f'); },
  door(g) {
    R(g, 0, 0, 16, 16, P.wallFace); R(g, 0, 0, 16, 2, P.wallTop);
    R(g, 2, 2, 12, 14, P.doorFrame); R(g, 3, 3, 10, 13, P.doorWood);
    R(g, 4, 4, 8, 4, P.glass); R(g, 5, 5, 3, 1, P.glass2);
    R(g, 4, 9, 8, 6, P.doorWood2); R(g, 10, 10, 2, 2, P.doorKnob);
  },
  elevator(g) {
    R(g, 0, 0, 16, 16, P.wallFace); R(g, 0, 0, 16, 2, P.wallTop);
    R(g, 1, 2, 14, 14, P.metalDark); R(g, 2, 3, 6, 13, P.metal); R(g, 8, 3, 6, 13, P.metal); R(g, 7, 3, 2, 13, P.metalDark);
    R(g, 3, 4, 1, 11, P.metalLight); R(g, 13, 4, 1, 11, P.metal2); R(g, 6, 1, 4, 1, P.leds[0]);
  },
  stairs(g) {
    R(g, 0, 0, 16, 16, P.wallFace); R(g, 0, 0, 16, 2, P.wallTop);
    for (let i = 0; i < 6; i++) { R(g, 2, 3 + i * 2, 12, 1, P.step); R(g, 2, 4 + i * 2, 12, 1, P.step2); }
    R(g, 1, 2, 1, 14, P.metalDark); R(g, 14, 2, 1, 14, P.metalDark);
  },
  window(g) {
    R(g, 0, 0, 16, 16, P.wallFace); R(g, 0, 0, 16, 2, P.wallTop);
    R(g, 2, 3, 12, 9, P.frame); R(g, 3, 4, 4, 3, P.glass); R(g, 8, 4, 5, 3, P.glass); R(g, 3, 8, 4, 3, P.glass); R(g, 8, 8, 5, 3, P.glass);
    R(g, 4, 5, 1, 1, P.glass2); R(g, 9, 5, 2, 1, P.glass2); R(g, 0, 13, 16, 3, P.wallBase);
  },
  whiteboard(g) {
    R(g, 0, 0, 16, 16, P.wallFace); R(g, 0, 0, 16, 2, P.wallTop);
    R(g, 1, 3, 14, 10, P.frame); R(g, 2, 4, 12, 8, P.white);
    R(g, 3, 5, 5, 1, P.ink); R(g, 3, 7, 8, 1, P.ink); R(g, 9, 5, 3, 1, P.inkRed); R(g, 3, 9, 4, 1, P.inkGreen); R(g, 9, 9, 4, 1, P.ink);
    R(g, 0, 13, 16, 3, P.wallBase);
  },
  board(g) {
    R(g, 0, 0, 16, 16, P.wallFace); R(g, 0, 0, 16, 2, P.wallTop);
    R(g, 1, 3, 14, 10, P.corkDark); R(g, 2, 4, 12, 8, P.cork);
    R(g, 3, 5, 4, 5, P.paper); R(g, 8, 5, 5, 3, P.paper); R(g, 9, 9, 4, 2, P.paper);
    R(g, 4, 5, 1, 1, P.pin); R(g, 10, 5, 1, 1, P.pin); R(g, 10, 9, 1, 1, P.ink); R(g, 0, 13, 16, 3, P.wallBase);
  },
  desk(g) { D.floor(g, 0); R(g, 0, 2, 16, 10, P.deskTop); R(g, 0, 2, 16, 1, P.deskTop2); R(g, 0, 12, 16, 3, P.deskSide); R(g, 1, 6, 14, 1, P.deskLine); },
  deskPC(g) { D.desk(g); R(g, 4, 0, 8, 7, P.pcDark); R(g, 5, 1, 6, 4, P.screen); R(g, 6, 2, 2, 1, P.screen2); R(g, 7, 7, 2, 2, P.pc); R(g, 3, 9, 10, 2, P.pc); R(g, 4, 10, 8, 1, P.metal2); },
  chair(g) { D.floor(g, 0); R(g, 4, 4, 8, 8, P.chair); R(g, 5, 5, 6, 2, P.chair2); R(g, 3, 12, 2, 2, P.chair2); R(g, 11, 12, 2, 2, P.chair2); },
  shelf(g, v) {
    R(g, 0, 0, 16, 16, P.shelfDark); R(g, 1, 0, 14, 16, P.shelf);
    for (let s = 0; s < 3; s++) {
      const y = 1 + s * 5; R(g, 1, y + 4, 14, 1, P.shelfDark);
      let x = 2, i = (v * 3 + s * 2) % P.books.length;
      while (x < 14) { const w = 1 + ((i + x) % 2); R(g, x, y, w, 4, P.books[i % P.books.length]); x += w + (i % 3 === 0 ? 1 : 0); i++; }
    }
  },
  equipment(g, v) {
    D.floor(g, 0);
    R(g, 1, 1, 14, 14, P.metalDark); R(g, 2, 2, 12, 12, v % 2 ? P.metal : P.metalLight);
    if (v % 3 === 0) { R(g, 4, 4, 8, 4, P.pcDark); R(g, 5, 5, 6, 2, P.screen); }
    if (v % 3 === 1) { R(g, 4, 4, 8, 8, P.metal2); R(g, 6, 6, 4, 4, P.glass); }
    if (v % 3 === 2) { R(g, 3, 3, 10, 2, P.metal2); R(g, 3, 6, 10, 2, P.metal2); R(g, 3, 9, 10, 2, P.metal2); }
    R(g, 3, 12, 2, 1, P.leds[v % 4]); R(g, 6, 12, 2, 1, P.leds[(v + 1) % 4]);
  },
  plant(g) {
    D.floor(g, 0);
    R(g, 5, 11, 6, 4, P.pot); R(g, 5, 11, 6, 1, P.potDark);
    R(g, 4, 4, 8, 7, P.plantLeaf); R(g, 3, 6, 10, 3, P.plantLeaf); R(g, 7, 2, 2, 3, P.plantLeaf2); R(g, 5, 5, 2, 2, P.plantLight); R(g, 9, 7, 2, 1, P.plantLight);
  },
  counter(g) { D.floor(g, 0); R(g, 0, 3, 16, 9, P.metalLight); R(g, 0, 3, 16, 1, '#ffffff'); R(g, 0, 12, 16, 3, P.metal2); R(g, 3, 5, 10, 5, P.paper); R(g, 5, 7, 6, 1, P.ink); },
};

export function getTile(name, variant = 0) {
  const key = name + ':' + variant;
  if (!cache.has(key)) cache.set(key, make(D[name], variant));
  return cache.get(key);
}
