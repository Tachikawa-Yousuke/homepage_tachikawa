// キャラクター（16×20、頭の大きい携帯機 RPG 風）。文字 1 つ = 1 ピクセル。
//  . 透明  o 輪郭  h 髪  s 肌  e 目  c 服  C 服(影)  p ズボン  b 靴
const BODY = {
  down: [
    '.....oooooo.....',
    '...oohhhhhhoo...',
    '..ohhhhhhhhhho..',
    '.ohhhhhhhhhhhho.',
    '.ohhhhhhhhhhhho.',
    '.ohhsssssssshho.',
    '.ohsseessseesso.',
    '.ohsssssssssso..',
    '..ohssssssssho..',
    '...ooossssooo...',
    '....oCccccCo....',
    '...osccccccso...',
    '...osccccccso...',
    '....oCccccCo....',
    '....oppppppo....',
    '....oppooppo....',
  ],
  up: [
    '.....oooooo.....',
    '...oohhhhhhoo...',
    '..ohhhhhhhhhho..',
    '.ohhhhhhhhhhhho.',
    '.ohhhhhhhhhhhho.',
    '.ohhhhhhhhhhhho.',
    '.ohhhhhhhhhhhho.',
    '.ohhhhhhhhhhhho.',
    '..ohhhhhhhhhho..',
    '...ooossssooo...',
    '....oCccccCo....',
    '...osccccccso...',
    '...osccccccso...',
    '....oCccccCo....',
    '....oppppppo....',
    '....oppooppo....',
  ],
  left: [
    '.....oooooo.....',
    '...oohhhhhhoo...',
    '..ohhhhhhhhhho..',
    '.ohhhhhhhhhhhho.',
    '.ohhhhhhhhhhhho.',
    '.osshhhhhhhhhho.',
    '.oesshhhhhhhhho.',
    '.osssshhhhhhhho.',
    '..ossshhhhhhho..',
    '...ooosssoooo...',
    '....oCccccCo....',
    '....osccccco....',
    '....osccccco....',
    '....oCccccCo....',
    '....oppppppo....',
    '....oppooppo....',
  ],
};
const LEGS = [
  ['....opp..ppo....', '....obb..bbo....', '....obbo.obbo...', '.....oo...oo....'], // 立ち
  ['....opp..ppo....', '....obb..bbo....', '....obbo..oo....', '.....oo.........'], // 歩き 1
  ['....opp..ppo....', '....obb..bbo....', '....oo..obbo....', '..........oo....'], // 歩き 2
];

export const SPRITE_H = 20;
export const PALETTES = {
  player:   { o: '#303030', h: '#5a3a22', s: '#f8d0a0', e: '#303030', c: '#4a90e2', C: '#2f6fc0', p: '#3b4a6b', b: '#5a3a22' },
  kimura:   { o: '#303030', h: '#222222', s: '#f8d0a0', e: '#303030', c: '#ffffff', C: '#d0d4dc', p: '#4a5160', b: '#303030' },
  studentA: { o: '#303030', h: '#2a2a2a', s: '#f8d0a0', e: '#303030', c: '#ff6b6b', C: '#d04a4a', p: '#4a4a4a', b: '#303030' },
  studentB: { o: '#303030', h: '#6a4a2a', s: '#f8d0a0', e: '#303030', c: '#5bc96a', C: '#3aa14a', p: '#3b4a6b', b: '#5a3a22' },
  studentC: { o: '#303030', h: '#3a2a4a', s: '#f8d0a0', e: '#303030', c: '#ffd84a', C: '#d8b030', p: '#4a5160', b: '#303030' },
  studentD: { o: '#303030', h: '#8a5a2a', s: '#f8d0a0', e: '#303030', c: '#b57bee', C: '#8f5ccc', p: '#3b4a6b', b: '#303030' },
};

const cache = new Map();
export function getSprite(palette, dir, frame) {
  const key = `${palette}:${dir}:${frame}`;
  if (cache.has(key)) return cache.get(key);
  const pal = PALETTES[palette] || PALETTES.player;
  let rows = [...BODY[dir === 'right' ? 'left' : dir], ...LEGS[frame]];
  if (dir === 'right') rows = rows.map((r) => r.split('').reverse().join(''));
  const c = document.createElement('canvas'); c.width = 16; c.height = SPRITE_H;
  const g = c.getContext('2d');
  rows.forEach((row, y) => { for (let x = 0; x < 16; x++) { const ch = row[x]; if (ch !== '.' && pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); } } });
  cache.set(key, c);
  return c;
}
