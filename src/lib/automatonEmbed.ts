import { ruleTable, seedRow, Start, stepRow } from './elementary'

// A fixed picture of chosen generations of an elementary automaton, for use in a post:
//
//   ```automaton
//   rule=30 generations=48
//   ```
//
// It is drawn once at build time, as an SVG. On screen it plays one row at a time, using AutomatonRunner
// and a cover in the SVG that slides away, then stays still. Without motion it is just the finished picture.
// A single cell's run ends when its pattern reaches the edge, since rows past that point only lose the shape.
//
//   rule         0 to 255, required
//   generations  how many rows to show, 32 by default
//   from         the first generation shown, 0 by default
//   cells        how many columns to show. By default, enough to fit a single cell's whole triangle.
//   start        single or random, single by default
//   seed         picks the random start, so a build always draws the same picture. 1 by default.
//   density      share of live cells in a random start, 0.5 by default
//   wrap         whether the edges join. By default, a random start wraps and a single cell does not.
//   caption      replaces the generated caption

export type AutomatonOptions = { rule: number; generations: number; from: number; cells?: number; start: Start; seed: number; density: number; wrap?: boolean; caption?: string }

const MAX_GENERATIONS = 400
const MAX_CELLS = 801
// How far the run can go before it would slow the build.
const MAX_LAST_GENERATION = 2000

const fail = (message: string): never => { throw new Error(`automaton block: ${message}`) }

export const wholeNumber = (block: string, key: string, text: string, min: number, max: number) => {
    const value = Number(text)
    if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${block} block: ${key} must be a whole number from ${min} to ${max}, not "${text}"`)
    return value
}

// Reads key=value options, handing each value to its key's reader.
export const readOptions = (block: string, text: string, readers: Record<string, (value: string) => void>) => {
    const unread = text.replace(/(\w+)=("[^"]*"|\S+)/g, (_, key: string, raw: string) => {
        if (!readers[key]) throw new Error(`${block} block: unknown option "${key}"`)
        readers[key](raw.replace(/^"|"$/g, ''))
        return ''
    })
    if (unread.trim()) throw new Error(`${block} block: could not read "${unread.trim()}"`)
}

export const parseAutomatonOptions = (text: string): AutomatonOptions => {
    const options: AutomatonOptions = { rule: -1, generations: 32, from: 0, start: 'single', seed: 1, density: 0.5 }
    const number = (key: string, value: string, min: number, max: number) => wholeNumber('automaton', key, value, min, max)
    readOptions('automaton', text, {
        rule: (value) => { options.rule = number('rule', value, 0, 255) },
        generations: (value) => { options.generations = number('generations', value, 1, MAX_GENERATIONS) },
        from: (value) => { options.from = number('from', value, 0, MAX_LAST_GENERATION) },
        cells: (value) => { options.cells = number('cells', value, 1, MAX_CELLS) },
        seed: (value) => { options.seed = number('seed', value, 0, 2 ** 32 - 1) },
        start: (value) => { options.start = value === 'single' || value === 'random' ? value : fail(`start must be single or random, not "${value}"`) },
        density: (value) => { options.density = Number(value) > 0 && Number(value) < 1 ? Number(value) : fail(`density must be between 0 and 1, not "${value}"`) },
        wrap: (value) => { options.wrap = value === 'true' ? true : value === 'false' ? false : fail(`wrap must be true or false, not "${value}"`) },
        caption: (value) => { options.caption = value },
    })
    if (options.rule < 0) fail('rule is required')
    if (options.from + options.generations - 1 > MAX_LAST_GENERATION) fail(`the last generation can't be past ${MAX_LAST_GENERATION}`)
    return options
}

// mulberry32
export const seededRandom = (seed: number) => () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// The chosen generations, each cropped to the visible cells.
export const evolve = ({ rule, generations, from, cells, start, seed, density, wrap }: AutomatonOptions) => {
    const last = from + generations - 1
    const wraps = wrap ?? start === 'random'
    const visible = cells ?? (start === 'single' ? Math.min(2 * last + 1, MAX_CELLS) : 128)
    // A single cell on an endless row. The margin is wide enough that the row's ends never reach the visible part.
    const margin = start === 'single' && !wraps ? last + 1 : 0
    const width = visible + 2 * margin
    let row = new Uint8Array(width)
    let next = new Uint8Array(width)
    seedRow(row, start, density, seededRandom(seed))
    const table = ruleTable(rule)
    const rows: Uint8Array[] = []
    for (let generation = 0; generation <= last; generation++) {
        if (generation >= from) rows.push(row.slice(margin, margin + visible))
        stepRow(row, next, table, wraps)
        const previous = row
        row = next
        next = previous
    }
    return rows
}

export const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// One filled rectangle for each run of live cells, which keeps the markup small.
export const cellPath = (rows: Uint8Array[]) => {
    let path = ''
    rows.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
            if (!row[x]) continue
            const begin = x
            while (x + 1 < row.length && row[x + 1]) x++
            path += `M${begin} ${y}h${x - begin + 1}v1h-${x - begin + 1}z`
        }
    })
    return path
}

// Cuts the rows off once a single cell's pattern reaches the edge. Rows that start out full keep going.
// Odd rules flip the empty background every generation, so an edge counts as reached when it differs from that.
export const untilSaturated = (rows: Uint8Array[], { rule, from, start }: AutomatonOptions) => {
    if (start !== 'single') return rows
    const table = ruleTable(rule)
    let background = 0
    for (let generation = 0; generation < from; generation++) background = table[background * 7]
    for (let y = 0; y < rows.length; y++) {
        const row = rows[y]
        if (row[0] !== background || row[row.length - 1] !== background) return y === 0 ? rows : rows.slice(0, y + 1)
        background = table[background * 7]
    }
    return rows
}

export const renderAutomaton = (options: AutomatonOptions) => {
    const rows = untilSaturated(evolve(options), options)
    const { rule, from } = options
    const last = from + rows.length - 1
    const range = rows.length === 1 ? `generation ${from}` : `generations ${from} to ${last}`
    const description = `Rule ${rule}, ${range}, from ${options.start === 'single' ? 'a single cell' : 'a random row'}`
    const size = `width="${rows[0].length}" height="${rows.length}"`
    return `<figure class="m-automaton" style="--m-rows:${rows.length}"><svg viewBox="0 0 ${rows[0].length} ${rows.length}" shape-rendering="crispEdges" role="img" aria-label="${escapeHtml(description)}"><path d="${cellPath(rows)}"/><rect class="m-automaton-cover" ${size}/></svg><figcaption><span>${escapeHtml(options.caption ?? description)}</span><span class="m-automaton-actions"><button type="button" class="m-automaton-restart" aria-label="Restart ${escapeHtml(description)}">Restart</button></span></figcaption></figure>`
}

type MarkdownNode = { type: string; lang?: string | null; meta?: string | null; value?: string; children?: MarkdownNode[] }

// Makes a remark plugin that replaces each code block in one language with its rendered HTML.
export const remarkEmbed = (lang: string, render: (options: string) => string) => () => (tree: MarkdownNode) => {
    const walk = (node: MarkdownNode) => {
        for (const child of node.children ?? []) {
            if (child.type === 'code' && child.lang === lang) {
                child.value = render(`${child.meta ?? ''}\n${child.value ?? ''}`)
                child.type = 'html'
            } else {
                walk(child)
            }
        }
    }
    walk(tree)
}
