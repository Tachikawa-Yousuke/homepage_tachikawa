// マップ定義。1 文字 = 1 タイル（16px）。文字の意味は LEGEND（屋内 / 屋外で別）。
// 間取り・配置は仮。実際の配置に合わせて rows を書き換える。

export const LEGEND = {
  indoor: {
    '#': { tile: 'wall', solid: true },          // 壁（下が床なら正面、そうでなければ上面として描く）
    '.': { tile: 'floor' },
    '~': { tile: 'carpet' },
    'D': { tile: 'door' },                       // 出入口（warps に対応がある）
    'E': { tile: 'elevator', solid: true, act: 'elevator' },
    's': { tile: 'stairs', solid: true, act: 'stairs' },
    'W': { tile: 'window', solid: true },
    'w': { tile: 'whiteboard', solid: true, act: 'research' },
    'p': { tile: 'board', solid: true, act: 'news' },
    'b': { tile: 'shelf', solid: true, act: 'pubs' },
    'e': { tile: 'equipment', solid: true, act: 'equipment' },
    'r': { tile: 'counter', solid: true, act: 'reception' },
    't': { tile: 'plant', solid: true },
    'd': { tile: 'desk', solid: true },
    'P': { tile: 'deskPC', solid: true, act: 'pc' },
    'c': { tile: 'chair', solid: true },
  },
  outdoor: {
    '.': { tile: 'grass' },
    '=': { tile: 'path' },
    ',': { tile: 'flower' },
    'T': { tile: 'tree', solid: true, overlay: 'treeTop' },  // 木。上半分は手前に重ねて描く
    'F': { tile: 'fence', solid: true },
    'S': { tile: 'sign', solid: true, act: 'sign' },
    'R': { tile: 'roof', solid: true },
    'B': { tile: 'bwall', solid: true },
    'N': { tile: 'bwindow', solid: true },
    'Q': { tile: 'plate', solid: true, act: 'sign' },
    'D': { tile: 'bdoor' },                      // 建物の入口。warps になければ「カギがかかっている」
    'h': { tile: 'bench', solid: true },
  },
};

export const MAPS = {
  // ---------- 屋外: 伊都キャンパス ウエスト地区（仮） ----------
  campus: {
    name: 'ウエスト地区',
    theme: 'outdoor',
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T............................T',
      'T..RRRRRRRRR.....RRRRRR......T',
      'T..RRRRRRRRR.....RRRRRR......T',
      'T..BNNBBBNNB.....BNBNBB..T...T',
      'T..BBQDBBBBB.....BBDBBB..T...T',
      'T.....=............=.....,,..T',
      'T.....=....,,,.....=.........T',
      'T.....=================......T',
      'T..,,.....=....S......=......T',
      'T..,,.....=...........=.TT...T',
      'T.........=....RRRRRRR=..TT..T',
      'T.........=....RRRRRRR=......T',
      'T......F..=....BNNNNNB=......T',
      'T......F..=....BNNNNNB=......T',
      'T.........=====BQBDBBB==.....T',
      'T.........h.......=......h...T',
      'T.......,,........=.....,,...T',
      'T.......,,........=.....,,...T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    warps: [
      { x: 18, y: 15, to: 'corridor4f', tx: 1, ty: 2, facing: 'down' },   // ウエスト4号館 入口 → 4F ろうか（エレベーター前）
    ],
    signs: {
      '15,9': '伊都キャンパス ウエスト地区\n→ ウエスト4号館（材料創製力学研究室）',
      '16,15': 'ウエスト4号館\n材料創製力学研究室（木村研）は 4F',
      '5,5': '（建物の表札。文字は かすれて 読めない）',
    },
    npcs: [
      { id: 'npc', name: '学生', x: 12, y: 8, facing: 'down', palette: 'studentB', wander: true,
        lines: ['ここは 九州大学 伊都キャンパス。', '材料創製力学研究室は ウエスト4号館の 4Fだよ。'] },
      { id: 'npc', name: '学生', x: 20, y: 16, facing: 'left', palette: 'studentC', wander: true,
        lines: ['研究室見学は いつでも 受け付けているって。', '4Fの 受付で 聞いてみて。'] },
      { id: 'npc', name: 'おじさん', x: 25, y: 7, facing: 'down', palette: 'studentA', wander: true,
        lines: ['目に見えないほど 小さい材料を つくっている 研究室が あるらしい。', '原子を 動かして つくるんだとか。'] },
    ],
    start: { x: 18, y: 17, facing: 'up' },
  },

  // ---------- 屋内: ウエスト4号館 4F ----------
  corridor4f: {
    name: '4号館 4F',
    theme: 'indoor',
    rows: [
      '########################################',
      '#E###p##D#########D######D######p###s###',
      '#......................................#',
      '#.r....................................#',
      '#......................................#',
      '#t....................................t#',
      '########################################',
    ],
    warps: [
      { x: 8,  y: 1, to: 'room428', tx: 5, ty: 7, facing: 'up' },
      { x: 18, y: 1, to: 'room414', tx: 6, ty: 8, facing: 'up' },
      { x: 25, y: 1, to: 'room401', tx: 6, ty: 8, facing: 'up' },
    ],
    exit: { to: 'campus', tx: 18, ty: 16, facing: 'down' },   // エレベーター / 階段で 1F（屋外）へ
    npcs: [],
    labels: { 8: '428 教員室', 18: '414 実験室', 25: '401 学生居室' },
  },
  room428: {
    name: '428 教員室',
    theme: 'indoor',
    rows: [
      '############',
      '#w#WW##WW#w#',
      '#..........#',
      '#bbb....PP.#',
      '#........c.#',
      '#..........#',
      '#t.........#',
      '#..........#',
      '#####D######',
    ],
    warps: [{ x: 5, y: 8, to: 'corridor4f', tx: 8, ty: 2, facing: 'down' }],
    npcs: [{ id: 'kimura', x: 7, y: 5, facing: 'down', palette: 'kimura' }],
  },
  room414: {
    name: '414 実験室',
    theme: 'indoor',
    rows: [
      '##############',
      '#WW##WW##WW###',
      '#e.e.e.e.e.e.#',
      '#............#',
      '#..dd....dd..#',
      '#............#',
      '#e..........e#',
      '#e..........e#',
      '#......e..e..#',
      '######D#######',
    ],
    warps: [{ x: 6, y: 9, to: 'corridor4f', tx: 18, ty: 2, facing: 'down' }],
    npcs: [],
  },
  room401: {
    name: '401 学生居室',
    theme: 'indoor',
    rows: [
      '##############',
      '#bbb#WW##WW#w#',
      '#............#',
      '#.PP..PP..PP.#',
      '#.cc..cc..cc.#',
      '#............#',
      '#.PP..PP..PP.#',
      '#.cc..cc..cc.#',
      '#....t.......#',
      '######D#######',
    ],
    warps: [{ x: 6, y: 9, to: 'corridor4f', tx: 25, ty: 2, facing: 'down' }],
    npcs: [],
    // 学生 NPC はメンバーデータから自動配置（最大 4 人）
    studentSpots: [
      { x: 3, y: 5, facing: 'down' }, { x: 7, y: 5, facing: 'down' },
      { x: 11, y: 5, facing: 'down' }, { x: 3, y: 8, facing: 'right' },
    ],
  },
};

// 画面（15×10 タイル）より小さいマップは周囲を埋め、座標をずらす。ワープ先座標（tx, ty）は元のまま。
const MIN_COLS = 15, MIN_ROWS = 10;
function normalize(map) {
  const cols = map.rows[0].length, rows = map.rows.length;
  const padL = Math.max(0, Math.floor((MIN_COLS - cols) / 2)), padR = Math.max(0, MIN_COLS - cols - padL);
  const padT = Math.max(0, Math.floor((MIN_ROWS - rows) / 2)), padB = Math.max(0, MIN_ROWS - rows - padT);
  const fill = map.theme === 'outdoor' ? 'T' : '#';
  const width = cols + padL + padR;
  const newRows = [
    ...Array(padT).fill(fill.repeat(width)),
    ...map.rows.map((r) => fill.repeat(padL) + r + fill.repeat(padR)),
    ...Array(padB).fill(fill.repeat(width)),
  ];
  const shift = (o) => ({ ...o, x: o.x + padL, y: o.y + padT });
  const labels = {}, signs = {};
  for (const [x, v] of Object.entries(map.labels || {})) labels[Number(x) + padL] = v;
  for (const [k, v] of Object.entries(map.signs || {})) { const [x, y] = k.split(',').map(Number); signs[`${x + padL},${y + padT}`] = v; }
  return {
    ...map, rows: newRows, _pad: { l: padL, t: padT },
    warps: (map.warps || []).map(shift),
    npcs: (map.npcs || []).map(shift),
    studentSpots: map.studentSpots ? map.studentSpots.map(shift) : undefined,
    start: map.start ? shift(map.start) : undefined,
    labels: map.labels ? labels : undefined,
    signs: map.signs ? signs : undefined,
  };
}
for (const k of Object.keys(MAPS)) MAPS[k] = normalize(MAPS[k]);
