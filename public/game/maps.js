// マップ定義。1 文字 = 1 タイル（16px）。
//  # 壁   . 床   ~ カーペット   D ドア(ワープ)   E エレベーター   s 階段   W 窓
//  w ホワイトボード(研究テーマ)   p 掲示板(お知らせ)   b 本棚(業績)   e 装置   r 受付   t 観葉植物
//  d 机   P 机+PC   c 椅子
// 間取りは仮配置。実際の配置図をもとに書き換える。
export const MAPS = {
  corridor4f: {
    name: '4F ろうか',
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
    npcs: [],
    labels: { 8: '428 教員室', 18: '414 実験室', 25: '401 学生居室' },
  },
  room428: {
    name: '428 教員室',
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
    // 学生 NPC は main.js でメンバーデータから自動配置する（最大 4 人）
    npcs: [],
    studentSpots: [
      { x: 3, y: 5, facing: 'down' }, { x: 7, y: 5, facing: 'down' },
      { x: 11, y: 5, facing: 'down' }, { x: 3, y: 8, facing: 'right' },
    ],
  },
};

export const SOLID = new Set(['#', 'E', 's', 'W', 'w', 'p', 'b', 'e', 'r', 't', 'd', 'P', 'c']);
export const INTERACT = new Set(['E', 's', 'w', 'p', 'b', 'e', 'r', 'P']);

// 画面（20×12 タイル）より小さいマップは周囲を壁で埋め、座標をずらす
const MIN_COLS = 20, MIN_ROWS = 12;
function normalize(map) {
  const cols = map.rows[0].length, rows = map.rows.length;
  const padL = Math.max(0, Math.floor((MIN_COLS - cols) / 2)), padR = Math.max(0, MIN_COLS - cols - padL);
  const padT = Math.max(0, Math.floor((MIN_ROWS - rows) / 2)), padB = Math.max(0, MIN_ROWS - rows - padT);
  if (!padL && !padR && !padT && !padB) return { ...map, _pad: { l: 0, t: 0 } };
  const width = cols + padL + padR;
  const blank = '#'.repeat(width);
  const newRows = [
    ...Array(padT).fill(blank),
    ...map.rows.map((r) => '#'.repeat(padL) + r + '#'.repeat(padR)),
    ...Array(padB).fill(blank),
  ];
  const shift = (o) => ({ ...o, x: o.x + padL, y: o.y + padT });
  const labels = {};
  for (const [x, v] of Object.entries(map.labels || {})) labels[Number(x) + padL] = v;
  return {
    ...map, rows: newRows, _pad: { l: padL, t: padT },
    warps: (map.warps || []).map(shift),
    npcs: (map.npcs || []).map(shift),
    studentSpots: map.studentSpots ? map.studentSpots.map(shift) : undefined,
    labels: map.labels ? labels : undefined,
  };
}
for (const k of Object.keys(MAPS)) MAPS[k] = normalize(MAPS[k]);
