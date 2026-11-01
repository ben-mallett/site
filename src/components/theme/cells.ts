// Cell animation engine. Draws on one canvas per effect, so large grids add no DOM nodes.
// Runs only when the html element has the m-motion class, which the root layout sets
// unless the visitor asks for reduced motion.

const orders = {
    random: () => Math.random(),
    diagonal: (c: number, r: number, C: number, R: number) => (c + r) / Math.max(1, C + R - 2) + Math.random() * 0.08,
    radial: (c: number, r: number, C: number, R: number) =>
        Math.hypot(c - (C - 1) / 2, r - (R - 1) / 2) / Math.max(1, Math.hypot((C - 1) / 2, (R - 1) / 2)) + Math.random() * 0.1,
    rows: (_c: number, r: number, _C: number, R: number) => (r / Math.max(1, R - 1)) * 0.85 + Math.random() * 0.15,
    cols: (c: number, _r: number, C: number) => (c / Math.max(1, C - 1)) * 0.85 + Math.random() * 0.15,
}

export type CellOrder = keyof typeof orders

// Any color token from globals.css, without the --m- prefix.
export type CellColor = "accent" | "bg" | "fg" | "acid" | "pink" | "cyan" | "orange" | "lilac" | "yellow" | "red" | "blue"

type Cell = { x: number; y: number; at: number; roll: number }
type Paint = (cell: Cell, t: number) => string | null

const STEP = 90

export const motionEnabled = () => document.documentElement.classList.contains("m-motion")

export const cssColor = (el: Element, name: string, alpha = 1) =>
    `rgb(${getComputedStyle(el).getPropertyValue(`--m-${name}`).trim()} / ${alpha})`

const buildCells = (width: number, height: number, size: number, order: CellOrder, spread: number) => {
    const cols = Math.ceil(width / size)
    const rows = Math.ceil(height / size)
    const cells: Cell[] = []
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            cells.push({ x, y, at: orders[order](x, y, cols, rows) * spread, roll: Math.random() })
        }
    }
    return cells
}

const sizeCanvas = (canvas: HTMLCanvasElement, width: number, height: number) => {
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.ceil(width * dpr)
    canvas.height = Math.ceil(height * dpr)
    canvas.getContext("2d")?.scale(dpr, dpr)
}

const attachCanvas = (el: HTMLElement) => {
    if (getComputedStyle(el).position === "static") el.style.position = "relative"
    const canvas = document.createElement("canvas")
    canvas.className = "m-cells"
    canvas.setAttribute("aria-hidden", "true")
    sizeCanvas(canvas, el.offsetWidth, el.offsetHeight)
    el.appendChild(canvas)
    return canvas
}

// Paints the first frame synchronously, so a cover is in place before the caller unhides content.
const run = (canvas: HTMLCanvasElement, size: number, cells: Cell[], paint: Paint, duration: number, onDone: () => void) => {
    const ctx = canvas.getContext("2d")
    if (!ctx) {
        onDone()
        return () => {}
    }
    const start = performance.now()
    let frame = 0
    const draw = (now: number) => {
        const t = now - start
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        for (const cell of cells) {
            const color = paint(cell, t)
            if (color) {
                ctx.fillStyle = color
                ctx.fillRect(cell.x * size, cell.y * size, size, size)
            }
        }
        if (t < duration) frame = requestAnimationFrame(draw)
        else onDone()
    }
    draw(start)
    return () => cancelAnimationFrame(frame)
}

export type CellRevealOptions = {
    size?: number
    order?: CellOrder
    spread?: number
    // Share of cells that flash the color before clearing.
    flash?: number
    delay?: number
    color?: CellColor
}

// The element assembles out of cells: covered cells clear in order, and some flash a color first.
export const cellReveal = (
    el: HTMLElement,
    { size = 24, order = "random", spread = 600, flash = 0.25, delay = 0, color = "accent" }: CellRevealOptions = {},
) => {
    const canvas = attachCanvas(el)
    const cells = buildCells(el.offsetWidth, el.offsetHeight, size, order, spread)
    const bg = cssColor(el, "bg")
    const lit = cssColor(el, color)
    const duration = Math.max(0, ...cells.map((c) => c.at)) + delay + STEP * 2
    const cancel = run(
        canvas,
        size,
        cells,
        (cell, t) => {
            const local = t - delay - cell.at
            if (local < 0) return bg
            return cell.roll < flash && local < STEP * 2 ? lit : null
        },
        duration,
        () => canvas.remove(),
    )
    return () => {
        cancel()
        canvas.remove()
    }
}

export type CellWipeOptions = {
    size?: number
    order?: CellOrder
    spread?: number
    color?: CellColor
}

// Cells fill in over the element, swap changes the content while it is covered, and the cells erode away
// in a new order, so the content doesn't just come back the way the cover went on.
export const cellWipe = (
    el: HTMLElement,
    swap: () => void,
    onDone: () => void,
    { size = 12, order = "random", spread = 300, color = "accent" }: CellWipeOptions = {},
) => {
    const canvas = attachCanvas(el)
    const cells = buildCells(el.offsetWidth, el.offsetHeight, size, order, spread)
    const main = cssColor(el, color)
    const fg = cssColor(el, "fg")
    const bg = cssColor(el, "bg")
    const colorOf = (cell: Cell) => (cell.roll < 0.7 ? main : cell.roll < 0.85 ? fg : bg)
    const duration = Math.max(0, ...cells.map((c) => c.at)) + STEP
    let cancel = run(
        canvas,
        size,
        cells,
        (cell, t) => (t >= cell.at ? colorOf(cell) : null),
        duration,
        () => {
            swap()
            // Keeps each cell's color and only changes when it leaves.
            const erosion = buildCells(el.offsetWidth, el.offsetHeight, size, order, spread).map((cell, i) => ({ ...cell, roll: cells[i].roll }))
            cancel = run(
                canvas,
                size,
                erosion,
                (cell, t) => (t < cell.at ? colorOf(cell) : null),
                duration,
                () => {
                    canvas.remove()
                    onDone()
                },
            )
        },
    )
    return () => {
        cancel()
        canvas.remove()
    }
}

const GLYPHS = "▖▗▘▙▚▛▜▝▞▟█▓▒░/<>[]#=+01"

// Text settles left to right through block glyphs. Walks text nodes, so nested faces keep their styles.
export const decode = (el: HTMLElement, { frame = 28, trail = 6 }: { frame?: number; trail?: number } = {}) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const nodes: { node: Text; text: string; from: number }[] = []
    let total = 0
    while (walker.nextNode()) {
        const node = walker.currentNode as Text
        if (node.parentElement?.closest(".sr-only") || !node.data.trim()) continue
        nodes.push({ node, text: node.data, from: total })
        total += node.data.length
    }

    // Glyphs have different widths, so hold the box still until the real text is back.
    const { width, height } = el.getBoundingClientRect()
    const held = [el.style.width, el.style.height, el.style.overflow]
    el.style.width = `${Math.ceil(width)}px`
    el.style.height = `${Math.ceil(height)}px`
    el.style.overflow = "hidden"

    const perFrame = Math.max(0.6, total / 40)
    let tick = 0

    const finish = () => {
        clearInterval(timer)
        nodes.forEach(({ node, text }) => (node.data = text))
        ;[el.style.width, el.style.height, el.style.overflow] = held
    }

    const paint = () => {
        const done = tick * perFrame
        if (done >= total) return finish()
        for (const { node, text, from } of nodes) {
            let out = ""
            for (let i = 0; i < text.length; i++) {
                const at = from + i
                if (at < done || text[i] === " ") out += text[i]
                else if (at < done + trail) out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
                else out += " "
            }
            node.data = out
        }
        tick++
    }

    const timer = setInterval(paint, frame)
    paint()
    return finish
}

// One full-screen canvas covers the page during a route change.
const SCREEN_SIZE = 48
const SCREEN_SPREAD = 260
const SCREEN_TIMEOUT = 8000

let screen: { canvas: HTMLCanvasElement; cells: Cell[]; cancel: () => void; timeout: number } | null = null

const mountScreen = () => {
    const root = document.documentElement
    const canvas = document.createElement("canvas")
    canvas.className = "m-cells m-cells-screen"
    canvas.setAttribute("aria-hidden", "true")
    sizeCanvas(canvas, window.innerWidth, window.innerHeight)
    document.body.appendChild(canvas)
    const accent = cssColor(root, "accent")
    const fg = cssColor(root, "fg")
    const bg = cssColor(root, "bg")
    const cells = buildCells(window.innerWidth, window.innerHeight, SCREEN_SIZE, "diagonal", SCREEN_SPREAD)
    const colorOf = (cell: Cell) => (cell.roll < 0.7 ? accent : cell.roll < 0.85 ? fg : bg)
    return { canvas, cells, colorOf }
}

// Cells sweep over the page, then onCovered runs. A second call while covering does nothing.
export const coverScreen = (onCovered: () => void) => {
    if (screen) return
    const { canvas, cells, colorOf } = mountScreen()
    const cancel = run(
        canvas,
        SCREEN_SIZE,
        cells,
        (cell, t) => (t >= cell.at ? colorOf(cell) : null),
        SCREEN_SPREAD * 1.08 + STEP,
        onCovered,
    )
    // A route that never commits must not leave the page covered.
    screen = { canvas, cells, cancel, timeout: window.setTimeout(uncoverScreen, SCREEN_TIMEOUT) }
}

// Cells sweep off the page. With no cover in place, such as on back or forward, it starts fully covered.
export const uncoverScreen = () => {
    if (!motionEnabled()) return
    if (screen) {
        screen.cancel()
        clearTimeout(screen.timeout)
        screen.canvas.remove()
    }
    const { canvas, cells, colorOf } = mountScreen()
    const placed = screen?.cells
    screen = null
    const sweep = placed ?? cells
    run(
        canvas,
        SCREEN_SIZE,
        sweep,
        (cell, t) => (t < cell.at ? colorOf(cell) : null),
        SCREEN_SPREAD * 1.08 + STEP,
        () => canvas.remove(),
    )
}
