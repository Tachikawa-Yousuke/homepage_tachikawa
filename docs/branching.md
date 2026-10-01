# ブランチ運用ルール

## A. コンペ期間（各参加者の `homepage_（名前）` リポジトリ）

- `main` = プレビュー公開ブランチ。`main` への push で自動デプロイされる。
- 作業は `main` に直接 push しても構わないが、大きな変更は作業ブランチ → Pull Request を推奨する
  （PR テンプレートのデータ取扱いチェックが使える）。
- 本番サイト用リポジトリには一切 push しない（レギュレーション第 4.3 条）。

## B. 本番運用（採用後の公式サイトリポジトリ）

| ブランチ | 役割 | ルール |
|---|---|---|
| `main` | 公開中のサイト | 保護ブランチ。直接 push 禁止、PR 必須、PI の承認が必要 |
| `content/<内容>` | コンテンツ更新（メンバー追加、業績追加、お知らせ） | 誰でも作成可。`main` へ PR |
| `feat/<内容>` | デザイン・機能変更 | 同上 |
| `fix/<内容>` | 誤字・リンク切れ等の修正 | 同上 |

### 手順（学生がメンバー情報を更新する例）

```bash
git switch -c content/add-member-2027
# src/content/members.yaml を編集
git commit -am "メンバー追加: （氏名）"
git push -u origin content/add-member-2027
# GitHub 上で main 向けの PR を作成 → PI がレビュー・マージ → 自動公開
```

### 本番リポジトリで PI が設定すること

1. Settings → Branches → Add branch protection rule: `main`
   - Require a pull request before merging（承認 1 名以上）
   - Do not allow bypassing the above settings
2. `.github/CODEOWNERS` のコメントを外し、PI の GitHub ユーザー名を記入する
   （全 PR に PI のレビューが自動で要求される）。
3. Settings → Pages → Source: GitHub Actions。
4. 公開のたびにタグを打つと履歴を追いやすい（例: `v2026.11`）。

## C. 事故時の対応

- 非公開情報を誤って push した場合: **自分で履歴を書き換えず、直ちに PI に報告**。
  public リポジトリでは `git push --force` だけでは不十分で、GitHub Support への削除依頼が必要になる場合がある。
- 秘密情報（API キー）を push した場合: 当該キーを**無効化・再発行**したうえで報告。
