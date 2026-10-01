# コンテンツ更新ガイド（PI・引き継ぎ用）

コードを触らずに更新できる範囲をまとめます。いずれも GitHub の Web 画面（ファイルを開いて鉛筆アイコン）で編集でき、
`main` にコミットすると数分で公開されます。

## メンバーを追加・変更する

`src/content/members.yaml` に 1 人分を追加する。

```yaml
- id: yamada-taro          # 英数字で一意
  name: 山田 太郎
  nameEn: Taro Yamada       # 任意
  role: M1
  group: student            # faculty / student / alumni
  order: 30                 # 表示順（小さいほど上）
  interests: [MEMS, その場観察]
  photo: yamada.jpg         # 任意。public/images/members/ に置く。本人同意必須
```

卒業したら `group: alumni` に変える。削除せず残すと卒業生欄に表示される。

## 業績を追加する

`src/content/publications.yaml` に追加する。年の降順で自動整列される。

```yaml
- id: yamada2027-apl
  type: journal             # journal / conference / award / other
  title: 論文タイトル
  authors: T. Yamada, H. Suzuki
  venue: Applied Physics Letters
  year: 2027
  volume: "130"
  pages: "011101"
  doi: 10.xxxx/xxxxx        # あればリンクが自動生成
```

## お知らせを追加する

`src/content/news/` に `YYYY-MM-DD-題名.md` を作る。

```markdown
---
title: ○○学会で発表しました
date: 2027-03-15
---

本文（省略可）
```

## 研究テーマを追加・変更する

`src/content/research/` の Markdown を編集する。`order` で表示順を決める。

## 住所・連絡先・研究室名

`src/data/site.json` を編集する。

## 注意

- YAML では、値の中に「: 」（コロン＋空白）を含む場合は値全体を `"..."` で囲む。
- 項目名を追加したい場合は `src/content.config.ts` の型定義も変更が必要（これはコード編集になる）。
- 編集後、GitHub の Actions タブが赤（失敗）になったら、直前の編集で YAML の書式が崩れている可能性が高い。

## 追加された項目（2026-10 デザイン更新時）

| ファイル | 項目 | 意味 |
|---|---|---|
| `research/*.md` | `titleEn` | 英語タイトル（一覧・詳細に表示） |
| `research/*.md` | `tag` | 研究の位置づけ（例: 基礎〜応用研究） |
| `members.yaml` | `roleEn`, `bio` | 英語の役職、経歴（教員向け。`bio: >-` の後に複数行で書ける） |
| `publications.yaml` | `number` | 通し番号。年内はこの番号の降順で並ぶ |

## 色・フォントを変える

`src/styles/global.css` の先頭にある `:root { --bg: ...; --accent: ...; }` を書き換えると全ページに反映されます。
黄色の差し色は `--accent`、背景の黒は `--bg` です。
