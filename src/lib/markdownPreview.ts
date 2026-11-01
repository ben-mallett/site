import { unified } from 'unified'
import rehypeStringify from 'rehype-stringify'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { escapeHtml, remarkEmbed } from './automatonEmbed'
import { EMBED_BLOCKS } from './embeds'

// A bad block shows its error where the picture would be, where a real build would stop with it.
const orError = (render: (options: string) => string) => (options: string) => {
    try {
        return render(options)
    } catch (error) {
        return `<p class="m-embed-error">${escapeHtml(error instanceof Error ? error.message : String(error))}</p>`
    }
}

// The same markdown steps as a post, without code highlighting, which is too heavy for a browser.
const processor = Object.entries(EMBED_BLOCKS)
    .reduce((chain, [lang, render]) => chain.use(remarkEmbed(lang, orError(render))), unified().use(remarkParse).use(remarkBreaks).use(remarkGfm) as any)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })

export const renderMarkdown = (text: string) => String(processor.processSync(text))

const FENCE_OPENING = new RegExp(`^\`\`\`(${Object.keys(EMBED_BLOCKS).join('|')})\\b`)

// Splits text into its embed blocks and the prose between them, so editing one part of a draft leaves
// the others alone and their pictures don't start over.
export const splitBlocks = (text: string) => {
    const segments: string[] = []
    let current: string[] = []
    let inside = false
    const finish = () => {
        if (current.join('').trim()) segments.push(current.join('\n'))
        current = []
    }
    for (const line of text.split('\n')) {
        if (!inside && FENCE_OPENING.test(line)) {
            finish()
            inside = true
            current.push(line)
        } else if (inside && line.trim() === '```') {
            current.push(line)
            finish()
            inside = false
        } else {
            current.push(line)
        }
    }
    finish()
    return segments
}
