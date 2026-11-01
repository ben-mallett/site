import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import remarkParse from 'remark-parse'
import remarkBreaks from 'remark-breaks'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypePrettyCode from 'rehype-pretty-code'
import { remarkEmbed } from './automatonEmbed'
import { EMBED_BLOCKS } from './embeds'
import type { RandomLinks } from './utils'

const postsDir = path.join(process.cwd(), '_posts')

const getPosts = () => {
  return fs.readdirSync(postsDir)
}

const getParser = () => {
  const markdown = unified()
    .use(remarkParse)
    .use(remarkBreaks)  
    .use(remarkGfm) 
  return Object.entries(EMBED_BLOCKS)
    .reduce((chain, [lang, render]) => chain.use(remarkEmbed(lang, render)), markdown as any)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypePrettyCode, {
        theme: 'one-dark-pro',
    })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
        content: (arg: any) => ({
            type: 'element',
            tagName: 'a',
            properties: {
            href: `#${String(arg.properties?.id)}`
            },
            children: [{ type: 'text', value: '' }],
        }),
    })
    .use(rehypeStringify, { allowDangerousHtml: true });
}

const parser = getParser()

// Plain text from the start of a post, for card previews. Headings and embedded pictures would interrupt it.
const getExcerpt = (html: string, length = 600) => {
    const text = html
        .replace(/<(figure|h[1-6])\b[\s\S]*?<\/\1>/g, ' ')
        .replace(/<\/(p|li|pre|blockquote)>|<br\s*\/?>/g, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim()
    return text.length <= length ? text : `${text.slice(0, text.lastIndexOf(' ', length))}...`
}

export const getPostById = async (id: string) => {
    const realId = id.replace(/\.md$/, '')
    const fullPath = path.join(postsDir, `${realId}.md`)
    const { data, content } = matter(await fs.promises.readFile(fullPath, 'utf8'))
  
    const html = await parser.process(content)
  
    return {
      ...data,
      title: data.title as string,
      id: realId,
      date: data.date as string,
      html: html.value.toString(),
      excerpt: getExcerpt(html.value.toString()),
    }
}

export async function getAllPosts() {
    const posts = await Promise.all(getPosts().map(id => getPostById(id)))
    return posts.sort((post1, post2) => (post1.date > post2.date ? -1 : 1))
}

// Articles that belong together. A post joins one with the series and seriesOrder fields in its front matter.
const SERIES: Record<string, { title: string; description: string }> = {
    "cellular-automata": {
        title: "Cellular Automata",
        description: "How far can simple local rules go? From a single row of cells to the Game of Life to a world of falling sand.",
    },
    "casino-mathematics": {
        title: "Casino Mathematics",
        description: "Casino games look like luck, but a surprising amount of each one can be counted. Three articles, and games to test the numbers on.",
    },
}

export type BlogEntry =
    | { kind: "post"; post: any }
    | { kind: "series"; id: string; title: string; description: string; date: string; posts: any[] }

// The blog's list: standalone posts, plus one entry for each series, placed where its newest article falls.
export const getBlogEntries = async (): Promise<BlogEntry[]> => {
    const posts: any[] = await getAllPosts()
    const seen = new Set<string>()
    const entries: BlogEntry[] = []
    for (const post of posts) {
        if (!post.series) {
            entries.push({ kind: "post", post })
        } else if (!seen.has(post.series)) {
            seen.add(post.series)
            const members = posts.filter((other) => other.series === post.series).sort((a, b) => a.seriesOrder - b.seriesOrder)
            entries.push({ kind: "series", id: post.series, ...SERIES[post.series], date: post.date, posts: members })
        }
    }
    return entries
}

export const getSeriesTitle = (id: string) => SERIES[id]?.title

export type ShowcaseItem = { title: string; description: string; slug: string }

export type ShowcaseEntry =
    | { kind: "item"; item: ShowcaseItem }
    | { kind: "category"; id: string; title: string; description: string; countLabel: string; items: ShowcaseItem[] }

const item = (title: string, description: string, slug: string): ShowcaseItem => ({ title, description, slug })

const SHOWCASE: ShowcaseEntry[] = [
    {
        kind: "category",
        id: "cellular-automata",
        title: "Cellular Automata",
        description: "Simple local rules run over and over, on a single row, on a grid, and in a world of falling sand.",
        countLabel: "4 demos",
        items: [
            item("Elementary Automata", "Run any of the 256 rules for a single row of cells, and watch each generation stack under the last.", "elementary-automata"),
            item("Game of Life", "A unique plaground showcasing John Conway's famous 'Game of Life', and some of the emergent behavior that happens when you change the rules.", "conway"),
            item("Falling Sands", "Pour sand, water and stone, and grow Game of Life patterns in the same world.", "falling-sands"),
            item("Rule Catalog", "All 256 elementary rules side by side, each shown for steps 0 to 99.", "elementary-catalog"),
        ],
    },
    // Video poker
    // Blackjack
    // Hold-em
]

export const getShowcaseEntries = async () => SHOWCASE

// Every page the nav's Random link can go to. Read on the server, because posts come from the file system.
export const getRandomLinks = (): RandomLinks => ({
    blog: getPosts().map((file) => `/blog/${file.replace(/\.md$/, '')}`),
    showcase: SHOWCASE.flatMap((entry) => (entry.kind === "item" ? [entry.item] : entry.items)).map(({ slug }) => `/showcase/${slug}`),
})
