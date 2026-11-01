import { cellPath, escapeHtml, readOptions, seededRandom, wholeNumber } from './automatonEmbed'
import { createWorld, ELEMENTS, LIFE_INTERVAL, SAND, SPORE, STONE, stepWorld, WATER, World } from './fallingSands'

// Falling sand pictures for use in a post. Each line in the block is one picture, and several lines
// make a row of them:
//
//   ```sands
//   scene=sink
//   sand=20,0,8,8 water=2,20,44,10 stone=0,30,48,2 caption="My own"
//   ```
//
// A picture plays once when it scrolls into view, using AutomatonRunner, then stays on its last tick.
// Without motion it is just that last tick. It uses the game's engine, and its random choices are
// seeded, so the picture from the build and the run in the browser end the same way.
//
//   scene              a name from SCENES, which sets up everything below. Other options add to it or change it.
//   sand, water,       a rectangle of that material, as x,y,width,height. Repeat them as much as you like.
//   stone, spore       Later ones draw over earlier ones, and anything past the edge is cut off.
//   cols, rows         the board size, 64 by 40 by default
//   ticks              how many ticks to play, 120 by default
//   lifeInterval       ticks between Game of Life steps for spores, 8 by default
//   seed               picks the random choices, 1 by default
//   delay              milliseconds between ticks, 40 by default
//   caption            replaces the generated caption

type Rect = { id: number; x: number; y: number; width: number; height: number }

const FLOOR = 'stone=0,38,64,2'
const BASIN = `${FLOOR} stone=0,8,2,30 stone=62,8,2,30`
// A staircase of single stones that only touch at their corners, from the top left to the floor.
const DIAGONAL = Array.from({ length: 38 }, (_, i) => `stone=${i + 6},${i},1,1`).join(' ')
const R_PENTOMINO = 'spore=31,18,1,1 spore=32,18,1,1 spore=30,19,1,1 spore=31,19,1,1 spore=31,20,1,1'

// Each one shows one rule, or one way two materials affect each other.
export const SCENES: Record<string, { title: string; setup: string }> = {
    pile: { title: 'Sand piles up', setup: `sand=28,0,8,16 ${FLOOR} ticks=100` },
    pool: { title: 'Water levels out', setup: `water=24,4,16,18 ${BASIN} ticks=120` },
    sink: { title: 'Sand sinks through water', setup: `water=2,26,60,12 sand=26,2,12,10 ${BASIN} ticks=120` },
    displace: { title: 'A sand stack on a pool', setup: `water=2,30,60,8 sand=28,0,8,26 ${BASIN} ticks=180` },
    cup: { title: 'Stone holds water', setup: `water=24,0,16,14 ${FLOOR} stone=20,22,2,16 stone=42,22,2,16 ticks=110` },
    hole: { title: 'Water finds a hole', setup: `water=4,8,14,8 stone=0,16,30,2 stone=31,16,33,2 ${FLOOR} ticks=220` },
    diagonal: { title: 'Corners stop everything', setup: `${DIAGONAL} sand=30,0,8,6 water=44,0,8,6 stone=44,38,20,2 ticks=120` },
    spores: { title: 'Spores follow the Game of Life', setup: `spore=6,4,1,1 spore=7,5,1,1 spore=5,6,1,1 spore=6,6,1,1 spore=7,6,1,1 spore=48,20,3,1 spore=46,8,2,2 lifeInterval=3 ticks=150` },
    'spore-sand': { title: 'Sand smothers living cells', setup: `${R_PENTOMINO} sand=26,0,12,6 ${FLOOR} lifeInterval=3 ticks=180` },
}

export type SandsOptions = {
    scene?: string
    rects: Rect[]
    cols: number
    rows: number
    ticks: number
    lifeInterval: number
    seed: number
    delay: number
    caption?: string
}

const MAX_SIZE = 200
const MAX_TICKS = 2000
const fail = (message: string): never => { throw new Error(`sands block: ${message}`) }

export const parseSandsOptions = (text: string): SandsOptions => {
    const options: SandsOptions = { rects: [], cols: 64, rows: 40, ticks: 120, lifeInterval: LIFE_INTERVAL, seed: 1, delay: 40 }
    const number = (key: string, value: string, min: number, max: number) => wholeNumber('sands', key, value, min, max)
    const rect = (key: string, id: number) => (value: string) => {
        const parts = value.split(',')
        if (parts.length !== 4) fail(`${key} must be x,y,width,height, not "${value}"`)
        const [x, y, width, height] = parts.map((part) => number(key, part, 0, MAX_SIZE))
        options.rects.push({ id, x, y, width, height })
    }
    const readers = {
        cols: (value: string) => { options.cols = number('cols', value, 3, MAX_SIZE) },
        rows: (value: string) => { options.rows = number('rows', value, 3, MAX_SIZE) },
        ticks: (value: string) => { options.ticks = number('ticks', value, 0, MAX_TICKS) },
        lifeInterval: (value: string) => { options.lifeInterval = number('lifeInterval', value, 1, 500) },
        seed: (value: string) => { options.seed = number('seed', value, 0, 2 ** 32 - 1) },
        delay: (value: string) => { options.delay = number('delay', value, 10, 2000) },
        caption: (value: string) => { options.caption = value },
        sand: rect('sand', SAND),
        water: rect('water', WATER),
        stone: rect('stone', STONE),
        spore: rect('spore', SPORE),
    }
    // A scene goes first, so the rest of the line can change it.
    readOptions('sands', text, {
        scene: (value) => {
            if (!SCENES[value]) fail(`unknown scene "${value}", try ${Object.keys(SCENES).join(', ')}`)
            options.scene = value
            readOptions('sands', SCENES[value].setup, readers)
        },
        ...Object.fromEntries(Object.keys(readers).map((key) => [key, () => {}])),
    })
    readOptions('sands', text, { scene: () => {}, ...readers })
    if (!options.rects.length) fail('needs a scene, or at least one rectangle of sand, water, stone or spore')
    return options
}

export const startingWorld = ({ rects, cols, rows, lifeInterval, seed }: SandsOptions): World => {
    const world = createWorld(cols, rows, seededRandom(seed))
    world.lifeInterval = lifeInterval
    for (const { id, x, y, width, height } of rects) {
        for (let row = y; row < Math.min(rows, y + height); row++) {
            for (let col = x; col < Math.min(cols, x + width); col++) world.cells[row * cols + col] = id
        }
    }
    return world
}

// One path for each material, since each has its own color.
export const worldPaths = ({ cells, cols, rows }: World) => ELEMENTS.map((_, id) => {
    const lines: Uint8Array[] = []
    for (let row = 0; row < rows; row++) {
        const line = new Uint8Array(cols)
        for (let col = 0; col < cols; col++) if (cells[row * cols + col] === id) line[col] = 1
        lines.push(line)
    }
    return cellPath(lines)
})

const renderFigure = (options: SandsOptions) => {
    const world = startingWorld(options)
    for (let i = 0; i < options.ticks; i++) stepWorld(world)
    const paths = worldPaths(world)
    const description = options.scene ? SCENES[options.scene].title : 'Falling sand'
    const shapes = ELEMENTS.map((element, id) => (id ? `<path data-element="${id}" style="fill:rgb(var(--m-${element.color}))" d="${paths[id]}"/>` : '')).join('')
    return `<figure class="m-automaton m-played m-sands" data-sands="${escapeHtml(JSON.stringify(options))}"><svg viewBox="0 0 ${options.cols} ${options.rows}" shape-rendering="crispEdges" role="img" aria-label="${escapeHtml(`${description}, ${options.ticks} ticks`)}">${shapes}</svg><figcaption><span>${escapeHtml(options.caption ?? description)}</span><span class="m-automaton-actions"><button type="button" class="m-automaton-restart" aria-label="Restart ${escapeHtml(description)}">Restart</button></span></figcaption></figure>`
}

export const renderSandsBlock = (text: string) => {
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
    if (!lines.length) fail('needs at least one line of options')
    const figures = lines.map((line) => renderFigure(parseSandsOptions(line)))
    return figures.length === 1 ? figures[0] : `<div class="m-automaton-row" style="--m-columns:${figures.length <= 3 ? figures.length : figures.length % 2 ? 3 : 2}">${figures.join('')}</div>`
}
