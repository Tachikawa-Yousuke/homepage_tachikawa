// @ts-check
import { defineConfig } from 'astro/config';

// `site` と `base` は GitHub Actions（.github/workflows/deploy.yml）が環境変数で渡します。
//   - 組織/個人リポジトリ: https://<owner>.github.io/<repo名>/ → base = "/<repo名>"
//   - 独自ドメイン:        https://example.ac.jp/              → base = "/"
// ローカル開発（npm run dev）では環境変数が無いので base = "/" になります。
// サイト内リンクは必ず src/lib/url.ts の withBase() を通してください。
export default defineConfig({
  site: process.env.SITE_ORIGIN || undefined,
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
});
