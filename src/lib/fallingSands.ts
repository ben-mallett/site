// A small falling sand engine. Every material is one entry in ELEMENTS, so adding a material means
// adding an entry, and a new kind of movement means adding a function to MOVEMENTS.
//
// This is not a strict cellular automaton. Movement updates the grid in place, one cell at a time,
// and uses chance to break ties, because that is what makes piles and pools look right. Elements with
// a life rule also take a true Game of Life step, where every cell changes at once.

export const EMPTY = 0
export const SAND = 1
export const WATER = 2
export const STONE = 3
export const SPORE = 4

export type Movement = "none" | "powder" | "liquid"

export type Element = {
    name: string
    // A theme color token. The game turns it into pixels.
    color: string
    movement: Movement
    // Heavier elements sink through lighter ones. Elements that don't move can't be displaced.
    density: number
    // How far a liquid can spread sideways in one tick.
    flow?: number
    // The share of a brush stroke that gets filled, so grains land loose and living cells have room.
    brush: number
    // Whether holding the brush still keeps adding more.
    pours: boolean
    // What the game's info button shows, in plain words.
    rules: string[]
    // Game of Life rules, as neighbor counts of the same element. A cell can only be born in an empty space.
    life?: { birth: number[]; survive: number[] }
}

export const ELEMENTS: Element[] = [
    {
        name: "Eraser", color: "bg", movement: "none", density: 0, brush: 1, pours: false,
        rules: ["Clears every cell under the brush, whatever is in it.", "Empty cells are the only thing lighter than water, so anything can move into them."],
    },
    {
        name: "Sand", color: "orange", movement: "powder", density: 2, brush: 0.5, pours: true,
        rules: [
            "Each tick, moves straight down if that cell is lighter than sand.",
            "If not, tries down and to one side, picked at random, then down and to the other side.",
            "It can't squeeze diagonally between two solid cells.",
            "It is heavier than water, so it sinks through water and pushes the water out of the way.",
            "Under a stack of sand, the water it pushes goes to the pool's surface, not up the stack. If there is no surface to reach, the sand waits.",
        ],
    },
    {
        name: "Water", color: "cyan", movement: "liquid", density: 1, flow: 4, brush: 0.6, pours: true,
        rules: [
            "Falls the same way as sand, but only into empty cells.",
            "If it can't fall, it looks along its row, each way, for the nearest place to drop.",
            "It moves up to 4 cells toward that place each tick. If there is nowhere to drop, it stays still.",
        ],
    },
    {
        name: "Stone", color: "muted", movement: "none", density: Infinity, brush: 1, pours: false,
        rules: ["Never moves, and nothing can displace it.", "Use it for walls and floors. Only the eraser removes it."],
    },
    {
        name: "Spore", color: "acid", movement: "none", density: Infinity, brush: 0.35, pours: false, life: { birth: [3], survive: [2, 3] },
        rules: [
            "Doesn't fall. It follows the Game of Life, at each life step instead of each tick.",
            "An empty cell with exactly 3 spore neighbors becomes a spore.",
            "A spore with 2 or 3 spore neighbors survives. Any other spore dies and leaves an empty cell.",
            "Only spores count as neighbors, and a spore can't be born in a cell that sand, water or stone is filling.",
        ],
    },
]

// Ticks between life steps, so living patterns can be watched while sand falls past them.
export const LIFE_INTERVAL = 8

export type World = {
    cols: number
    rows: number
    cells: Uint8Array
    // The stamp of the tick each cell last moved on, so nothing moves twice in one tick.
    moved: Uint8Array
    stamp: number
    tick: number
    // Ticks between life steps.
    lifeInterval: number
    random: () => number
}

export const createWorld = (cols: number, rows: number, random: () => number = Math.random): World => ({
    cols,
    rows,
    cells: new Uint8Array(cols * rows),
    moved: new Uint8Array(cols * rows),
    stamp: 0,
    tick: 0,
    lifeInterval: LIFE_INTERVAL,
    random,
})

const canEnter = ({ cells, cols, rows }: World, x: number, y: number, density: number) =>
    x >= 0 && x < cols && y >= 0 && y < rows && ELEMENTS[cells[y * cols + x]].density < density

const swap = (world: World, from: number, to: number) => {
    const { cells, moved, stamp } = world
    const element = cells[from]
    cells[from] = cells[to]
    cells[to] = element
    moved[from] = stamp
    moved[to] = stamp
}

const isSolid = ({ cells, cols, rows }: World, x: number, y: number) =>
    x < 0 || x >= cols || y < 0 || y >= rows || ELEMENTS[cells[y * cols + x]].density === Infinity

const isEmpty = ({ cells, cols, rows }: World, x: number, y: number) =>
    x >= 0 && x < cols && y >= 0 && y < rows && cells[y * cols + x] === EMPTY

const isLiquid = ({ cells, cols, rows }: World, x: number, y: number) =>
    x >= 0 && x < cols && y >= 0 && y < rows && ELEMENTS[cells[y * cols + x]].movement === "liquid"

// A grain moves into the liquid at the target, and the liquid goes to the given empty cell.
const pushAside = (world: World, from: number, to: number, escape: number) => {
    const { cells, moved, stamp } = world
    cells[escape] = cells[to]
    cells[to] = cells[from]
    cells[from] = EMPTY
    moved[from] = moved[to] = moved[escape] = stamp
}

// A cell moving into a liquid has to put that liquid somewhere. Swapping is only right when the liquid
// stays level: under water, or with nothing above to sink next. Otherwise each grain in a stack would
// lift the liquid one more cell, and it would climb the whole stack. So under a stack the liquid goes to
// the surface instead, along its own row, and with nowhere to go the grain waits.
const sink = (world: World, x: number, y: number, targetX: number) => {
    const { cols } = world
    const here = y * cols + x
    const target = (y + 1) * cols + targetX
    const inLiquid = isLiquid(world, x - 1, y) || isLiquid(world, x + 1, y) || isLiquid(world, x, y - 1)
    const uncovered = y === 0 || isEmpty(world, x, y - 1)
    if (inLiquid || (targetX === x && uncovered)) {
        swap(world, here, target)
        return true
    }
    if (targetX !== x && isEmpty(world, targetX, y)) {
        // A lone drop on a slope is on its way down, and lifting it here would carry it up the slope
        // as each grain slides in behind it. The grain waits for it to run off.
        if (!isLiquid(world, targetX - 1, y + 1) && !isLiquid(world, targetX + 1, y + 1)) return false
        pushAside(world, here, target, y * cols + targetX)
        return true
    }
    for (const dx of [-1, 1]) {
        for (let surface = targetX + dx; isLiquid(world, surface, y + 1); surface += dx) {
            if (isEmpty(world, surface, y)) {
                pushAside(world, here, target, y * cols + surface)
                return true
            }
        }
    }
    return false
}

// Moves a cell down into a cell it can enter. Returns whether it moved.
const descend = (world: World, x: number, y: number, targetX: number) => {
    if (isLiquid(world, targetX, y + 1)) return sink(world, x, y, targetX)
    swap(world, y * world.cols + x, (y + 1) * world.cols + targetX)
    return true
}

// Tries straight down, then the two diagonals in a random order. Returns whether the cell moved.
const fall = (world: World, x: number, y: number, density: number) => {
    if (canEnter(world, x, y + 1, density) && descend(world, x, y, x)) return true
    const side = world.random() < 0.5 ? -1 : 1
    const solidBelow = isSolid(world, x, y + 1)
    for (const dx of [side, -side]) {
        // Two solid cells touching at a corner are a wall, so nothing slips between them.
        if (solidBelow && isSolid(world, x + dx, y)) continue
        if (canEnter(world, x + dx, y + 1, density) && descend(world, x, y, x + dx)) return true
    }
    return false
}

// Looks along the row for the nearest drop. The look carries on past more of the same liquid, so a line
// of drops can follow each other, but only the empty cells right beside it are free to move into.
const lookForDrop = (world: World, x: number, y: number, dx: number, density: number) => {
    const { cells, cols } = world
    const own = cells[y * cols + x]
    let free = 0
    let open = true
    for (let distance = 1; x + dx * distance >= 0 && x + dx * distance < cols; distance++) {
        const cell = cells[y * cols + x + dx * distance]
        if (cell === own) {
            // Beside the same liquid on this side, it can't go this way at all.
            if (distance === 1) return { distance: Infinity, free: 0 }
            open = false
        } else if (ELEMENTS[cell].density >= density) {
            break
        } else {
            if (open) free = distance
            if (canEnter(world, x + dx * distance, y + 1, density)) return { distance, free }
        }
    }
    return { distance: Infinity, free: 0 }
}

// Heads for the nearest drop, stopping there so it can't skip over a hole. With no drop on its row it
// stays put, which lets a pool come to rest.
const spread = (world: World, x: number, y: number, density: number, flow: number) => {
    const side = world.random() < 0.5 ? -1 : 1
    const first = lookForDrop(world, x, y, side, density)
    const second = lookForDrop(world, x, y, -side, density)
    const nearest = Math.min(first.distance, second.distance)
    if (nearest === Infinity) return
    const dx = first.distance <= second.distance ? side : -side
    const free = dx === side ? first.free : second.free
    swap(world, y * world.cols + x, y * world.cols + x + dx * Math.min(flow, free))
}

const MOVEMENTS: Record<Movement, (world: World, x: number, y: number, element: Element) => void> = {
    none: () => {},
    powder: (world, x, y, { density }) => { fall(world, x, y, density) },
    liquid: (world, x, y, { density, flow = 1 }) => {
        if (!fall(world, x, y, density)) spread(world, x, y, density, flow)
    },
}

// One Game of Life step for one element. It counts first and changes after, so all its cells change at once.
const stepLife = ({ cells, cols, rows }: World, id: number, { birth, survive }: NonNullable<Element["life"]>) => {
    const counts = new Uint8Array(cols * rows)
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (cells[y * cols + x] !== id) continue
            for (let ny = Math.max(0, y - 1); ny <= Math.min(rows - 1, y + 1); ny++) {
                for (let nx = Math.max(0, x - 1); nx <= Math.min(cols - 1, x + 1); nx++) {
                    if (nx !== x || ny !== y) counts[ny * cols + nx]++
                }
            }
        }
    }
    for (let i = 0; i < cells.length; i++) {
        if (cells[i] === id && !survive.includes(counts[i])) cells[i] = EMPTY
        else if (cells[i] === EMPTY && birth.includes(counts[i])) cells[i] = id
    }
}

export const stepWorld = (world: World) => {
    const { cols, rows, cells, moved } = world
    world.tick++
    // Skips zero when it wraps, because a cell that has never moved has zero in its moved slot.
    world.stamp = world.stamp % 255 + 1
    // Bottom up, so a falling column moves together. The sweep alternates so nothing drifts to one side.
    const leftToRight = world.tick % 2 === 0
    for (let y = rows - 1; y >= 0; y--) {
        for (let i = 0; i < cols; i++) {
            const x = leftToRight ? i : cols - 1 - i
            const here = y * cols + x
            if (cells[here] === EMPTY || moved[here] === world.stamp) continue
            const element = ELEMENTS[cells[here]]
            MOVEMENTS[element.movement](world, x, y, element)
        }
    }
    if (world.tick % world.lifeInterval === 0) {
        ELEMENTS.forEach((element, id) => { if (element.life) stepLife(world, id, element.life) })
    }
}

// Paints a filled circle. The eraser clears everything, and other elements only fill empty cells.
// A stroke remembers the cells it has already tried, so dragging doesn't fill in a loose brush.
export const paint = (world: World, centerX: number, centerY: number, radius: number, id: number, stroke?: Uint8Array) => {
    const { cols, rows, cells, random } = world
    const { brush } = ELEMENTS[id]
    for (let y = Math.max(0, centerY - radius); y <= Math.min(rows - 1, centerY + radius); y++) {
        for (let x = Math.max(0, centerX - radius); x <= Math.min(cols - 1, centerX + radius); x++) {
            if ((x - centerX) ** 2 + (y - centerY) ** 2 > radius ** 2) continue
            const here = y * cols + x
            if (stroke) {
                if (stroke[here]) continue
                stroke[here] = 1
            }
            if (id === EMPTY) cells[here] = EMPTY
            else if (cells[here] === EMPTY && random() < brush) cells[here] = id
        }
    }
}

// The same world on a new board, keeping everything lined up along the bottom and the center.
export const resizeWorld = (world: World, cols: number, rows: number) => {
    const next = createWorld(cols, rows, world.random)
    next.tick = world.tick
    next.lifeInterval = world.lifeInterval
    const shiftX = (cols - world.cols) >> 1
    const shiftY = rows - world.rows
    for (let y = 0; y < world.rows; y++) {
        for (let x = 0; x < world.cols; x++) {
            const toX = x + shiftX, toY = y + shiftY
            if (toX >= 0 && toX < cols && toY >= 0 && toY < rows) next.cells[toY * cols + toX] = world.cells[y * world.cols + x]
        }
    }
    return next
}

export const countElements = ({ cells }: World) => {
    const counts = ELEMENTS.map(() => 0)
    for (let i = 0; i < cells.length; i++) counts[cells[i]]++
    return counts
}

const R_PENTOMINO = [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]]

// A starting scene that shows every element: a stone basin of water with sand falling into it, and a
// living pattern on a ledge above.
export const seedScene = (world: World) => {
    const { cols, rows, cells } = world
    const fill = (left: number, top: number, width: number, height: number, id: number) => {
        for (let y = Math.max(0, top); y < Math.min(rows, top + height); y++) {
            for (let x = Math.max(0, left); x < Math.min(cols, left + width); x++) cells[y * cols + x] = id
        }
    }
    const at = (share: number, size: number) => Math.floor(share * size)
    cells.fill(EMPTY)
    const floor = at(0.92, rows)
    fill(at(0.12, cols), floor, at(0.88, cols) - at(0.12, cols), 2, STONE)
    fill(at(0.12, cols), at(0.68, rows), 2, floor - at(0.68, rows), STONE)
    fill(at(0.88, cols) - 2, at(0.68, rows), 2, floor - at(0.68, rows), STONE)
    fill(at(0.12, cols) + 2, at(0.78, rows), at(0.88, cols) - at(0.12, cols) - 4, floor - at(0.78, rows), WATER)
    fill(at(0.25, cols), at(0.08, rows), at(0.14, cols), at(0.14, rows), SAND)
    fill(at(0.6, cols), at(0.3, rows), at(0.3, cols), 2, STONE)
    // Sits on the ledge when there's room, and stays on the board when there isn't.
    const patternTop = Math.max(0, at(0.3, rows) - 8)
    const patternLeft = Math.min(at(0.72, cols), Math.max(0, cols - 3))
    R_PENTOMINO.forEach(([dx, dy]) => { if (patternTop + dy < rows && patternLeft + dx < cols) cells[(patternTop + dy) * cols + patternLeft + dx] = SPORE })
}
