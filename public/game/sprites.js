// キャラクター（16×24）のドット絵。文字 1 つ = 1 ピクセル。
//  . 透明  o 輪郭  h 髪  s 肌  e 目  c 服  C 服(影)  p ズボン  b 靴
// 体（上16行）を向きごとに、脚（下8行）を歩行フレームごとに定義し、組み合わせて使う。
const BODY = {
  down: [
    '......oooo......',
    '....oohhhhoo....',
    '...ohhhhhhhho...',
    '..ohhhhhhhhhho..',
    '..ohhhhhhhhhho..',
    '..ohssssssssho..',
    '..osseesseesso..',
    '..osssssssssso..',
    '...osssssssso...',
    '....oossssoo....',
    '.....occcco.....',
    '..oCccccccccCo..',
    '..oCccccccccCo..',
    '..osccccccccso..',
    '..osccccccccso..',
    '...oCccccccCo...',
  ],
  up: [
    '......oooo......',
    '....oohhhhoo....',
    '...ohhhhhhhho...',
    '..ohhhhhhhhhho..',
    '..ohhhhhhhhhho..',
    '..ohhhhhhhhhho..',
    '..ohhhhhhhhhho..',
    '..ohhhhhhhhhho..',
    '...ohhhhhhhho...',
    '....oossssoo....',
    '.....occcco.....',
    '..oCccccccccCo..',
    '..oCccccccccCo..',
    '..osccccccccso..',
    '..osccccccccso..',
    '...oCccccccCo...',
  ],
  left: [
    '......oooo......',
    '....oohhhhoo....',
    '...ohhhhhhhho...',
    '..ohhhhhhhhhho..',
    '..ohhhhhhhhhho..',
    '..osshhhhhhhho..',
    '..oessshhhhhho..',
    '..osssshhhhhho..',
    '...osssshhhho...',
    '....oossssoo....',
    '.....occcco.....',
    '...occcccccco...',
    '...occcccccco...',
    '...osccccccco...',
    '...osccccccco...',
    '....oCcccccCo...',
  ],
};
const LEGS = [
  [ // 立ち
    '...oppppppppo...',
    '...oppppppppo...',
    '...opppooopppo..',
    '...oppo..oppo...',
    '...oppo..oppo...',
    '...obbo..obbo...',
    '...obbbo.obbbo..',
    '....ooo...ooo...',
  ],
  [ // 歩き 1
    '...oppppppppo...',
    '...oppppppppo...',
    '...opppooopppo..',
    '...oppo..oppo...',
    '...oppo..obbo...',
    '...obbo..obbbo..',
    '...obbbo..ooo...',
    '....ooo.........',
  ],
  [ // 歩き 2
    '...oppppppppo...',
    '...oppppppppo...',
    '...opppooopppo..',
    '...oppo..oppo...',
    '...obbo..oppo...',
    '...obbbo.obbo...',
    '....ooo..obbbo..',
    '..........ooo...',
  ],
];

// パレット（キャラクターごとの色）
export const PALETTES = {
  player:  { o: '#2b2b2b', h: '#4a2c17', s: '#f2c9a0', e: '#2b2b2b', c: '#3b6fd8', C: '#2a4fa0', p: '#2f3a5c', b: '#5a3a22' },
  kimura:  { o: '#2b2b2b', h: '#1e1e1e', s: '#f2c9a0', e: '#2b2b2b', c: '#f6f6f6', C: '#c9ccd3', p: '#3a3f4b', b: '#2b2b2b' },
  studentA:{ o: '#2b2b2b', h: '#2a2a2a', s: '#f2c9a0', e: '#2b2b2b', c: '#d8524a', C: '#a63a34', p: '#4a4a4a', b: '#2b2b2b' },
  studentB:{ o: '#2b2b2b', h: '#5a3a22', s: '#f2c9a0', e: '#2b2b2b', c: '#3ea36b', C: '#2a7a4d', p: '#2f3a5c', b: '#5a3a22' },
  studentC:{ o: '#2b2b2b', h: '#3a2a4a', s: '#f2c9a0', e: '#2b2b2b', c: '#e0b23a', C: '#b58a24', p: '#3a3f4b', b: '#2b2b2b' },
  studentD:{ o: '#2b2b2b', h: '#6a4a2a', s: '#f2c9a0', e: '#2b2b2b', c: '#8a6fd8', C: '#6a4fb0', p: '#2f3a5c', b: '#2b2b2b' },
};

const cache = new Map();
export function getSprite(palette, dir, frame) {
  const key = `${palette}:${dir}:${frame}`;
  if (cache.has(key)) return cache.get(key);
  const pal = PALETTES[palette] || PALETTES.player;
  const bodyDir = dir === 'right' ? 'left' : dir;
  let rows = [...BODY[bodyDir], ...LEGS[frame]];
  if (dir === 'right') rows = rows.map((r) => r.split('').reverse().join(''));
  const c = document.createElement('canvas');
  c.width = 16; c.height = 24;
  const g = c.getContext('2d');
  rows.forEach((row, y) => {
    for (let x = 0; x < 16; x++) {
      const ch = row[x];
      if (ch === '.' || !pal[ch]) continue;
      g.fillStyle = pal[ch];
      g.fillRect(x, y, 1, 1);
    }
  });
  cache.set(key, c);
  return c;
}
