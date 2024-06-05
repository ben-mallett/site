import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypePrettyCode from 'rehype-pretty-code'

const postsDir = path.join(process.cwd(), '_posts')

const getPosts = () => {
  return fs.readdirSync(postsDir)
}

const getParser = () => {
  return unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(remarkGfm)
    .use(rehypePrettyCode, {
      theme: 'one-dark-pro',
    })
    .use(rehypeStringify)
    .use(rehypeStringify)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
        content: arg => ({
          type: 'element',
          tagName: 'a',
          properties: {
            href: `#${String(arg.properties?.id)}`
          },
          children: [{ type: 'text', value: '#' }],
        }),
    })
}

const parser = getParser()

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
    }
}

export const getPageMarkdown = async (page: string) => {
    const { data, content } = matter(
      fs.readFileSync(path.join('_pages', page), 'utf8'),
    )
    const html = await parser.process(content)
  
    return {
      ...data,
      html: html.value.toString(),
    }
}

export async function getAllPosts() {
    const posts = await Promise.all(getPosts().map(id => getPostById(id)))
    return posts.sort((post1, post2) => (post1.date > post2.date ? -1 : 1))
}

export const showcaseItems = [
    {
        title: "Game of Life",
        description: "A unique plaground showcasing John Conway's famous 'Game of Life', and some of the emergent behavior that happens when you change the rules.",
        slug: "conway"
    },
    {
        title: "Falling Sands",
        description: "A cellular automata with varieties of materials and unique interactions. Build, destroy, and experience the majesty of simple cellular rules.",
        slug: "sands"
    },
    {
        title: "Tetris?",
        description: "The classic game of Tetris with a more tetrominos and some fun new twists! Take on variable board size, speed, point mechanics, and more!",
        slug: "tetris"
    },
]

export async function getAllShowcaseItems() {
    return showcaseItems
}