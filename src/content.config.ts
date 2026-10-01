// コンテンツ定義（Astro Content Collections）
// ここでデータの「型」を決めている。各ファイルの項目名・必須/任意はこの定義に従う。
// データ本体は src/content/ 以下にある。
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

// 研究テーマ: 1 テーマ = 1 Markdown ファイル（src/content/research/*.md）
const research = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/research' }),
  schema: z.object({
    title: z.string(),
    titleEn: z.string().optional(),
    tag: z.string().optional(), // 例: 基礎〜応用研究
    summary: z.string(),
    order: z.number().default(99),
    image: z.string().optional(), // public/images/research/ 以下の相対パス
  }),
});

// お知らせ: 1 件 = 1 Markdown ファイル（src/content/news/*.md）
const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
  }),
});

// メンバー: YAML 1 ファイル（src/content/members.yaml）
const members = defineCollection({
  loader: file('./src/content/members.yaml'),
  schema: z.object({
    name: z.string(),
    nameEn: z.string().optional(),
    role: z.string(), // 例: 教授 / 助教 / D2 / M1 / B4
    roleEn: z.string().optional(),
    bio: z.string().optional(), // 経歴（教員向け）
    group: z.enum(['faculty', 'student', 'alumni']).default('student'),
    order: z.number().default(99),
    email: z.string().optional(), // 本人同意のある場合のみ
    photo: z.string().optional(), // public/images/members/ 以下。本人同意のある場合のみ
    interests: z.array(z.string()).default([]),
  }),
});

// 業績: YAML 1 ファイル（src/content/publications.yaml）
const publications = defineCollection({
  loader: file('./src/content/publications.yaml'),
  schema: z.object({
    number: z.number().optional(), // 通し番号
    type: z.enum(['journal', 'conference', 'award', 'other']).default('journal'),
    title: z.string(),
    authors: z.string(),
    venue: z.string(), // 雑誌名・会議名
    year: z.number(),
    volume: z.string().optional(),
    pages: z.string().optional(),
    doi: z.string().optional(),
    url: z.string().optional(),
  }),
});

// 装置・設備: YAML 1 ファイル（src/content/equipment.yaml）
const equipment = defineCollection({
  loader: file('./src/content/equipment.yaml'),
  schema: z.object({
    name: z.string(),
    maker: z.string().optional(),
    model: z.string().optional(),
    description: z.string(),
    image: z.string().optional(), // public/images/equipment/ 以下
  }),
});

export const collections = { research, news, members, publications, equipment };
