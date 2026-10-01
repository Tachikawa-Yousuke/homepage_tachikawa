# 将来の GUI 編集（Git ベース CMS）導入メモ

コンペには導入しない。本番運用で「GitHub の画面での YAML 編集が負担」となった場合の選択肢。
いずれもコンテンツはリポジトリ内の Markdown / YAML のままで、GitHub Pages と両立する。

| 候補 | 方式 | 追加で必要なもの | 備考 |
|---|---|---|---|
| Decap CMS | リポジトリに `admin/` を置き、ブラウザから GitHub API で編集 | GitHub OAuth の中継サーバ（Netlify か Cloudflare Workers 等に自前設置） | 旧 Netlify CMS。実績が多い |
| Sveltia CMS | Decap 互換の軽量版 | 同上（Cloudflare Workers 用の公式中継あり） | Decap の設定ファイルをほぼ流用可 |
| Pages CMS | 外部サービス（GitHub App）として接続 | 自前サーバ不要。設定ファイル 1 枚 | 最も導入が軽い。外部サービス依存 |

事実: GitHub Pages は静的配信のみのため、OAuth の中継処理は Pages 上では動かせない。
そのため Decap / Sveltia は中継を外部に置く必要がある。

検討時の確認事項:

- 研究室 GitHub 組織で GitHub App / OAuth App の導入が許可されているか（組織設定）。
- 外部サービス（Pages CMS 等）にリポジトリへの書き込み権限を渡すことの可否（PI 判断）。
- 導入後も PR 経由の更新ルール（docs/branching.md）を維持するか、CMS からの直接コミットを許すか。
