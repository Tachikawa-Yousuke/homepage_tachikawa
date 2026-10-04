// マップ定義。1 文字 = 1 タイル（16px）。文字の意味は LEGEND（屋内 / 屋外で別）。
// 間取り・配置は仮。実際の配置に合わせて rows を書き換える。

export const LEGEND = {
  indoor: {
    '#': { tile: 'wall', solid: true },          // 壁（下が床なら正面、そうでなければ上面として描く）
    '.': { tile: 'floor' },
    '~': { tile: 'carpet' },
    'D': { tile: 'door', door: true },           // 出入口（warps に対応がある）
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
    'D': { tile: 'bdoor', door: true },          // 建物の入口。warps になければ doorText を表示
    'E': { tile: 'mdoor', door: true },          // 現代的な建物の入口
    'h': { tile: 'bench', solid: true },
    'p': { tile: 'plaza' },                      // 石畳の広場
    'G': { tile: 'groof', solid: true },         // 灰色の屋根
    'M': { tile: 'mwall', solid: true },         // 現代的な壁
    'n': { tile: 'mwindow', solid: true },
    'k': { tile: 'stone', solid: true, act: 'sign' },   // 石のアート
  },
};

export const MAPS = {
  // ---------- 屋外: 伊都キャンパス ウエスト地区（仮） ----------
  campus: {
    name: 'ウエストゾーン',
    theme: 'outdoor',
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T.GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG.T',
      'T..GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG..........T',
      'T..GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG..........T',
      'T..MnnMnnMnnMnnMnnMnnMnnMnnMnnMnnMnnMnn..........T',
      'T..MMMMMMQMEMMMMMMMMMMMMMMMQMEMMMMMMMMM..........T',
      'T.pppSppppppppppppppppppppppppppppppppppp........T',
      'T.ppppppppppppppppppppppppppppppppppppppp........T',
      'T.pppppppppppppphppppppphppppppppppppppppGGGGGGGGT',
      'TRRRRRRRR..=.................=...........GGGGGGGGT',
      'TRRRRRRRR..=.................=...........MnnMnnMnT',
      'TBNNBBNNB..=.................=...........MQMEMMMMT',
      'TBQBDBBBB..=.................=..........pppppppppT',
      'Tppppppppp.=.................=..........S...=,.,.T',
      'Tpppppppppp=,,...............=.,,...........=.k..T',
      'Tppppppppp.=.................=..............=,.,.T',
      'T.==============================================.T',
      'T..........=..........S.................=........T',
      'T..........=..h...................=============..T',
      'T.....TT...=.,,.........T.,,......=...........=..T',
      'T.....T....=.,................,...=.,,........=..T',
      'T..........=......................=.....TT....=..T',
      'T...===============================.....TT....=..T',
      'T...................=.............=...........=..T',
      'T.......,,..........=.h...........=.h......,,.=..T',
      'T.T.............TT..=.......TT....=...........=..T',
      'T..T............T...=.........T...=============..T',
      'T...................=............................T',
      'T...................=................T......T....T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    warps: [
      { x: 11, y: 5, to: 'corridor4f', tx: 1, ty: 2, facing: 'down' },   // ウエスト4号館（23）入口 → 4F ろうか
    ],
    signs: {
      '9,5': 'ウエスト4号館（23）\n材料創製力学研究室（木村研）は 4F',
      '27,5': 'キャンパスライフ・健康支援センター（22）',
      '5,6': 'WC（多目的トイレ）は こちら',
      '2,12': 'ビッグどら（29）\n食堂・喫茶・売店・書店',
      '42,11': '西講義棟（30）\nE-café（喫茶）',
      '40,13': 'WC は こちら',
      '46,14': '石のアート QIAO（チャオ）（31）\n石でできた 作品だ。',
      '22,17': '九州大学 伊都キャンパス\nウエストゾーン ↑ ウエスト4号館',
    },
    doorText: {
      '29,5': 'キャンパスライフ・健康支援センター。\n（ゲームでは 入れない）',
      '4,12': 'ビッグどら。食堂と 売店と 書店。\n（ゲームでは 入れない）',
      '44,11': '西講義棟。\n（ゲームでは 入れない）',
    },
    npcs: [
      { id: 'npc', name: '学生', x: 18, y: 16, facing: 'down', palette: 'studentB', wander: true,
        lines: ['ここは 伊都キャンパスの ウエストゾーン。', '材料創製力学研究室は ウエスト4号館の 4Fだよ。'] },
      { id: 'npc', name: '学生', x: 8, y: 16, facing: 'left', palette: 'studentC', wander: true,
        lines: ['ビッグどらには 食堂と 売店と 書店が あるよ。', 'お昼は いつも 混んでる。'] },
      { id: 'npc', name: 'おじさん', x: 38, y: 16, facing: 'down', palette: 'studentA', wander: true,
        lines: ['目に見えないほど 小さい材料を つくっている 研究室が あるらしい。', '原子を 動かして つくるんだとか。'] },
    ],
    start: { x: 11, y: 6, facing: 'up' },
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
    exit: { to: 'campus', tx: 11, ty: 6, facing: 'down' },   // エレベーター / 階段で 1F（屋外）へ
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
  const labels = {}, signs = {}, doorText = {};
  for (const [x, v] of Object.entries(map.labels || {})) labels[Number(x) + padL] = v;
  for (const [k, v] of Object.entries(map.signs || {})) { const [x, y] = k.split(',').map(Number); signs[`${x + padL},${y + padT}`] = v; }
  for (const [k, v] of Object.entries(map.doorText || {})) { const [x, y] = k.split(',').map(Number); doorText[`${x + padL},${y + padT}`] = v; }
  return {
    ...map, rows: newRows, _pad: { l: padL, t: padT },
    warps: (map.warps || []).map(shift),
    npcs: (map.npcs || []).map(shift),
    studentSpots: map.studentSpots ? map.studentSpots.map(shift) : undefined,
    start: map.start ? shift(map.start) : undefined,
    labels: map.labels ? labels : undefined,
    signs: map.signs ? signs : undefined,
    doorText: map.doorText ? doorText : undefined,
  };
}
for (const k of Object.keys(MAPS)) MAPS[k] = normalize(MAPS[k]);
