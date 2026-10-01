// タイル（16×16）の描画。画像ファイルを使わず、コードで描いて atlas に焼き込む。
// 後で CC0 素材や自作ドット絵に差し替える場合は、getTile() が返す canvas を画像に置き換えればよい。
export const TILE = 16;

const P = {
  floor: '#d8ceb6', floor2: '#cdc3aa', floorLine: '#bfb39a',
  wallTop: '#4d515c', wallFace: '#9aa0ad', wallFace2: '#8a909d', wallBase: '#5a5e68', wallLine: '#767c89',
  doorWood: '#8a5a2b', doorWood2: '#a06c35', doorFrame: '#3e2a12', doorKnob: '#e5c15a',
  glass: '#8fcbe3', glass2: '#cdeefb', frame: '#6b7280',
  deskTop: '#b07a3c', deskTop2: '#c48a46', deskSide: '#7c5325', deskLine: '#8f6430',
  pc: '#3c4048', pcDark: '#24272d', screen: '#4fb3e6', screen2: '#1f5f80',
  shelf: '#6d4a24', shelf2: '#8a5f2f', shelfDark: '#4a3217',
  books: ['#c0392b', '#2980b9', '#27ae60', '#f1c40f', '#8e44ad', '#e67e22', '#ecf0f1'],
  white: '#f4f4f4', ink: '#2457c5', inkRed: '#d64545', inkGreen: '#2e9e5b',
  metal: '#aab0bb', metal2: '#7f8591', metalDark: '#575c66', metalLight: '#d0d4db',
  leds: ['#ff4d4d', '#4dff6a', '#ffd84d', '#4da6ff'],
  cork: '#c89b5a', corkDark: '#a97f45', paper: '#fffdf5', pin: '#e74c3c',
  leaf: '#3e9b4f', leaf2: '#2e7a3c', leafLight: '#5cc06c', pot: '#8a4b2a', potDark: '#5e311a',
  chair: '#4a5568', chair2: '#2d3748',
  carpet: '#7a8fb5', carpet2: '#6d81a6',
  step: '#b8bec9', step2: '#9aa1ad',
  outline: '#2b2b2b',
};

const cache = new Map();
function make(draw) {
  const c = document.createElement('canvas');
  c.width = TILE; c.height = TILE;
  const g = c.getContext('2d');
  draw(g);
  return c;
}
const R = (g, x, y, w, h, color) => { g.fillStyle = color; g.fillRect(x, y, w, h); };

const drawers = {
  floor(g, v) {
    R(g, 0, 0, 16, 16, P.floor);
    // 床タイルの継ぎ目（2×2 の大タイル感）
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
    R(g, 0, 8, 16, 1, P.wallLine);
    R(g, 8, 2, 1, 6, P.wallLine); R(g, 0, 9, 1, 5, P.wallLine); R(g, 15, 9, 1, 5, P.wallLine);
    R(g, 0, 13, 16, 3, P.wallBase);
  },
  wallTop(g) {
    R(g, 0, 0, 16, 16, P.wallTop);
    R(g, 0, 0, 16, 1, '#5e636f'); R(g, 0, 15, 16, 1, '#3b3f48');
  },
  door(g) {
    R(g, 0, 0, 16, 16, P.wallFace); R(g, 0, 0, 16, 2, P.wallTop);
    R(g, 2, 2, 12, 14, P.doorFrame);
    R(g, 3, 3, 10, 13, P.doorWood);
    R(g, 4, 4, 8, 4, P.glass); R(g, 5, 5, 3, 1, P.glass2);
    R(g, 4, 9, 8, 6, P.doorWood2);
    R(g, 10, 10, 2, 2, P.doorKnob);
  },
  elevator(g) {
    R(g, 0, 0, 16, 16, P.wallFace); R(g, 0, 0, 16, 2, P.wallTop);
    R(g, 1, 2, 14, 14, P.metalDark);
    R(g, 2, 3, 6, 13, P.metal); R(g, 8, 3, 6, 13, P.metal);
    R(g, 7, 3, 2, 13, P.metalDark);
    R(g, 3, 4, 1, 11, P.metalLight); R(g, 13, 4, 1, 11, P.metal2);
    R(g, 6, 1, 4, 1, P.leds[0]);
  },
  stairs(g) {
    R(g, 0, 0, 16, 16, P.wallFace); R(g, 0, 0, 16, 2, P.wallTop);
    for (let i = 0; i < 6; i++) { R(g, 2, 3 + i * 2, 12, 1, P.step); R(g, 2, 4 + i * 2, 12, 1, P.step2); }
    R(g, 1, 2, 1, 14, P.metalDark); R(g, 14, 2, 1, 14, P.metalDark);
  },
  window(g) {
    R(g, 0, 0, 16, 16, P.wallFace); R(g, 0, 0, 16, 2, P.wallTop);
    R(g, 2, 3, 12, 9, P.frame);
    R(g, 3, 4, 4, 3, P.glass); R(g, 8, 4, 5, 3, P.glass); R(g, 3, 8, 4, 3, P.glass); R(g, 8, 8, 5, 3, P.glass);
    R(g, 4, 5, 1, 1, P.glass2); R(g, 9, 5, 2, 1, P.glass2);
    R(g, 0, 13, 16, 3, P.wallBase);
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
    R(g, 4, 5, 1, 1, P.pin); R(g, 10, 5, 1, 1, P.pin); R(g, 10, 9, 1, 1, P.ink);
    R(g, 0, 13, 16, 3, P.wallBase);
  },
  desk(g) {
    drawers.floor(g, 0);
    R(g, 0, 2, 16, 10, P.deskTop); R(g, 0, 2, 16, 1, P.deskTop2);
    R(g, 0, 12, 16, 3, P.deskSide); R(g, 1, 6, 14, 1, P.deskLine);
  },
  deskPC(g) {
    drawers.desk(g);
    R(g, 4, 0, 8, 7, P.pcDark); R(g, 5, 1, 6, 4, P.screen); R(g, 6, 2, 2, 1, P.screen2);
    R(g, 7, 7, 2, 2, P.pc); R(g, 3, 9, 10, 2, P.pc); R(g, 4, 10, 8, 1, P.metal2);
  },
  chair(g) {
    drawers.floor(g, 0);
    R(g, 4, 4, 8, 8, P.chair); R(g, 5, 5, 6, 2, P.chair2); R(g, 3, 12, 2, 2, P.chair2); R(g, 11, 12, 2, 2, P.chair2);
  },
  shelf(g, v) {
    R(g, 0, 0, 16, 16, P.shelfDark);
    R(g, 1, 0, 14, 16, P.shelf);
    for (let s = 0; s < 3; s++) {
      const y = 1 + s * 5;
      R(g, 1, y + 4, 14, 1, P.shelfDark);
      let x = 2;
      let i = (v * 3 + s * 2) % P.books.length;
      while (x < 14) {
        const w = 1 + ((i + x) % 2);
        R(g, x, y, w, 4, P.books[i % P.books.length]);
        x += w + ((i % 3 === 0) ? 1 : 0);
        i++;
      }
    }
  },
  equipment(g, v) {
    drawers.floor(g, 0);
    const body = v % 2 ? P.metal : P.metalLight;
    R(g, 1, 1, 14, 14, P.metalDark); R(g, 2, 2, 12, 12, body);
    if (v % 3 === 0) { R(g, 4, 4, 8, 4, P.pcDark); R(g, 5, 5, 6, 2, P.screen); }
    if (v % 3 === 1) { R(g, 4, 4, 8, 8, P.metal2); R(g, 6, 6, 4, 4, P.glass); }
    if (v % 3 === 2) { R(g, 3, 3, 10, 2, P.metal2); R(g, 3, 6, 10, 2, P.metal2); R(g, 3, 9, 10, 2, P.metal2); }
    R(g, 3, 12, 2, 1, P.leds[v % 4]); R(g, 6, 12, 2, 1, P.leds[(v + 1) % 4]);
  },
  plant(g) {
    drawers.floor(g, 0);
    R(g, 5, 11, 6, 4, P.pot); R(g, 5, 11, 6, 1, P.potDark);
    R(g, 4, 4, 8, 7, P.leaf); R(g, 3, 6, 10, 3, P.leaf);
    R(g, 7, 2, 2, 3, P.leaf2); R(g, 5, 5, 2, 2, P.leafLight); R(g, 9, 7, 2, 1, P.leafLight);
  },
  counter(g) {
    drawers.floor(g, 0);
    R(g, 0, 3, 16, 9, P.metalLight); R(g, 0, 3, 16, 1, '#ffffff'); R(g, 0, 12, 16, 3, P.metal2);
    R(g, 3, 5, 10, 5, P.paper); R(g, 5, 7, 6, 1, P.ink);
  },
};

export function getTile(name, variant = 0) {
  const key = name + ':' + variant;
  if (!cache.has(key)) cache.set(key, make((g) => drawers[name](g, variant)));
  return cache.get(key);
}
