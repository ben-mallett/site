import { parseAutomatonOptions, renderAutomaton } from './automatonEmbed'
import { renderLifeBlock } from './lifeEmbed'
import { renderSandsBlock } from './sandsEmbed'

// Every code block language that turns into a picture in a post, and what renders it.
export const EMBED_BLOCKS: Record<string, (options: string) => string> = {
    automaton: (options) => renderAutomaton(parseAutomatonOptions(options)),
    life: renderLifeBlock,
    sands: renderSandsBlock,
}
