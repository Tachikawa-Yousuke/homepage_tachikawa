/**
 * サイト内リンク用ヘルパー。
 * GitHub Pages（組織リポジトリ）ではサイトが https://<org>.github.io/<repo>/ 配下に置かれるため、
 * "/members" のような絶対パスをそのまま書くと 404 になる。必ずこの関数を通す。
 *   <a href={withBase('/members')}>
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}
