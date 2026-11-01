import { cellPath, escapeHtml, readOptions, seededRandom, wholeNumber } from './automatonEmbed'
import { Board, buildRuleTable, cellIndex, createBoard, setCell, stepBoard } from './life'

// Game of Life pictures for use in a post. Each line in the block is one picture, and several lines
// make a row of them:
//
//   ```life
//   pattern=glider
//   start=random surviveMax=4 caption="Crowding allowed"
//   ```
//
// A picture plays once when it scrolls into view, using AutomatonRunner, then stays on its last
// generation. Without motion it is just that last generation. It uses the same engine and rule
// settings as the game's page.
//
//   pattern      a name from PATTERNS, unless the start is random
//   start        pattern or random. Random is a fresh board, like the game's page starts with.
//   cols, rows   the board size. By default it fits the pattern, or 96 by 64 for a random start.
//   generations  how many steps to play. Each pattern has its own default, and random uses 100.
//   birth        how many neighbors bring a dead cell to life, 3 by default
//   surviveMin   the fewest neighbors a live cell survives with, 2 by default
//   surviveMax   the most neighbors a live cell survives with, 3 by default
//   seed         picks the random start, so the same seed can be compared across rules. 1 by default.
//   density      share of live cells in a random start, 0.3 by default
//   delay        milliseconds between generations, 120 by default
//   caption      replaces the generated caption

type Pattern = { title: string; cells: string[]; cols: number; rows: number; x?: number; y?: number; generations: number }

// Rows of cells, where X is alive. It's placed in the center of the board unless it says otherwise.
export const PATTERNS: Record<string, Pattern> = {
    block: { title: 'Block', cells: ['XX', 'XX'], cols: 16, rows: 12, generations: 12 },
    beehive: { title: 'Beehive', cells: ['.XX.', 'X..X', '.XX.'], cols: 16, rows: 12, generations: 12 },
    blinker: { title: 'Blinker', cells: ['XXX'], cols: 16, rows: 12, generations: 12 },
    toad: { title: 'Toad', cells: ['.XXX', 'XXX.'], cols: 16, rows: 12, generations: 12 },
    beacon: { title: 'Beacon', cells: ['XX..', 'XX..', '..XX', '..XX'], cols: 16, rows: 12, generations: 12 },
    glider: { title: 'Glider', cells: ['.X.', '..X', 'XXX'], cols: 32, rows: 24, x: 1, y: 1, generations: 72 },
    lwss: { title: 'Lightweight spaceship', cells: ['X..X.', '....X', 'X...X', '.XXXX'], cols: 32, rows: 24, x: 1, y: 10, generations: 48 },
    'r-pentomino': { title: 'R-pentomino', cells: ['.XX', 'XX.', '.X.'], cols: 96, rows: 64, generations: 200 },
}

export type LifeOptions = {
    pattern?: string
    start: 'pattern' | 'random'
    cols: number
    rows: number
    generations: number
    birth: number
    surviveMin: number
    surviveMax: number
    seed: number
    density: number
    delay: number
    caption?: string
}

const MAX_SIZE = 200
const MAX_GENERATIONS = 2000
const fail = (message: string): never => { throw new Error(`life block: ${message}`) }

export const parseLifeOptions = (text: string): LifeOptions => {
    const given: Partial<LifeOptions> = {}
    const number = (key: string, value: string, min: number, max: number) => wholeNumber('life', key, value, min, max)
    readOptions('life', text, {
        pattern: (value) => { given.pattern = PATTERNS[value] ? value : fail(`unknown pattern "${value}", try ${Object.keys(PATTERNS).join(', ')}`) },
        start: (value) => { given.start = value === 'pattern' || value === 'random' ? value : fail(`start must be pattern or random, not "${value}"`) },
        cols: (value) => { given.cols = number('cols', value, 3, MAX_SIZE) },
        rows: (value) => { given.rows = number('rows', value, 3, MAX_SIZE) },
        generations: (value) => { given.generations = number('generations', value, 0, MAX_GENERATIONS) },
        birth: (value) => { given.birth = number('birth', value, 0, 8) },
        surviveMin: (value) => { given.surviveMin = number('surviveMin', value, 0, 8) },
        surviveMax: (value) => { given.surviveMax = number('surviveMax', value, 0, 8) },
        seed: (value) => { given.seed = number('seed', value, 0, 2 ** 32 - 1) },
        density: (value) => { given.density = Number(value) > 0 && Number(value) < 1 ? Number(value) : fail(`density must be between 0 and 1, not "${value}"`) },
        delay: (value) => { given.delay = number('delay', value, 10, 2000) },
        caption: (value) => { given.caption = value },
    })
    const start = given.start ?? (given.pattern ? 'pattern' : fail('needs a pattern, or start=random'))
    const pattern = start === 'pattern' ? PATTERNS[given.pattern ?? fail('start=pattern needs a pattern')] : undefined
    return { birth: 3, surviveMin: 2, surviveMax: 3, seed: 1, density: 0.3, delay: 120, cols: pattern?.cols ?? 96, rows: pattern?.rows ?? 64, generations: pattern?.generations ?? 100, ...given, start }
}

export const startingBoard = ({ start, pattern, cols, rows, seed, density }: LifeOptions): Board => {
    const board = createBoard(cols, rows)
    if (start === 'random') {
        const random = seededRandom(seed)
        for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) if (random() < density) setCell(board, col, row)
        return board
    }
    const { cells, x, y } = PATTERNS[pattern!]
    const left = x ?? (cols - cells[0].length) >> 1
    const top = y ?? (rows - cells.length) >> 1
    cells.forEach((line, dy) => line.split('').forEach((cell, dx) => { if (cell === 'X') setCell(board, left + dx, top + dy) }))
    return board
}

export const lifeTable = ({ birth, surviveMin, surviveMax }: LifeOptions) => buildRuleTable({ birth, surviveMin, surviveMax })

export const boardPath = (board: Board) => {
    const rows: Uint8Array[] = []
    for (let row = 0; row < board.rows; row++) {
        const start = cellIndex(board, 0, row)
        rows.push(board.cells.subarray(start, start + board.cols))
    }
    return cellPath(rows)
}

export const describeRules = ({ birth, surviveMin, surviveMax }: LifeOptions) => {
    const survive = surviveMin > surviveMax ? 'none' : surviveMin === surviveMax ? `${surviveMin}` : `${surviveMin}-${surviveMax}`
    return `B${birth}/S${survive}`
}

// The game's page reads the same settings from its address.
export const demoLink = ({ birth, surviveMin, surviveMax, density }: LifeOptions) =>
    `/showcase/conway?birth=${birth}&amp;surviveMin=${surviveMin}&amp;surviveMax=${surviveMax}&amp;density=${Math.round(density * 100)}`

const renderFigure = (options: LifeOptions) => {
    const board = startingBoard(options)
    const table = lifeTable(options)
    for (let i = 0; i < options.generations; i++) stepBoard(board, table)
    const name = options.start === 'random' ? 'Random start' : PATTERNS[options.pattern!].title
    const description = `${name}, ${describeRules(options)}, ${options.generations} generations`
    const open = options.start === 'random' ? `<a href="${demoLink(options)}">Open</a>` : ''
    return `<figure class="m-automaton m-played m-life" data-life="${escapeHtml(JSON.stringify(options))}"><svg viewBox="0 0 ${options.cols} ${options.rows}" shape-rendering="crispEdges" role="img" aria-label="${escapeHtml(description)}"><path d="${boardPath(board)}"/></svg><figcaption><span>${escapeHtml(options.caption ?? description)}</span><span class="m-automaton-actions">${open}<button type="button" class="m-automaton-restart" aria-label="Restart ${escapeHtml(description)}">Restart</button></span></figcaption></figure>`
}

export const renderLifeBlock = (text: string) => {
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
    if (!lines.length) fail('needs at least one line of options')
    const figures = lines.map((line) => renderFigure(parseLifeOptions(line)))
    return figures.length === 1 ? figures[0] : `<div class="m-automaton-row" style="--m-columns:${figures.length <= 3 ? figures.length : figures.length % 2 ? 3 : 2}">${figures.join('')}</div>`
}
