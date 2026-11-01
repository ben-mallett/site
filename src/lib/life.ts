// A fast Game of Life. Cells live in one typed array with a one cell dead border, so edges need no
// special cases, and each step does a single pass with no function calls per cell.

export type Board = {
    cols: number
    rows: number
    // Row width including the border.
    stride: number
    cells: Uint8Array
    next: Uint8Array
    // Live cells in each column across three rows, reused between steps.
    columnSums: Uint8Array
    alive: number
}

export const createBoard = (cols: number, rows: number): Board => {
    const stride = cols + 2
    const size = stride * (rows + 2)
    return { cols, rows, stride, cells: new Uint8Array(size), next: new Uint8Array(size), columnSums: new Uint8Array(stride), alive: 0 }
}

export const cellIndex = (board: Board, col: number, row: number) => (row + 1) * board.stride + col + 1

export const seedBoard = (board: Board, density: number) => {
    let alive = 0
    for (let row = 0; row < board.rows; row++) {
        const start = cellIndex(board, 0, row)
        for (let i = start; i < start + board.cols; i++) {
            const cell = Math.random() < density ? 1 : 0
            board.cells[i] = cell
            alive += cell
        }
    }
    board.alive = alive
}

export const setCell = (board: Board, col: number, row: number) => {
    if (col < 0 || row < 0 || col >= board.cols || row >= board.rows) return
    const i = cellIndex(board, col, row)
    if (!board.cells[i]) {
        board.cells[i] = 1
        board.alive++
    }
}

export const countNeighbors = (board: Board, i: number) => {
    const { cells, stride } = board
    return cells[i - stride - 1] + cells[i - stride] + cells[i - stride + 1] + cells[i - 1] + cells[i + 1] + cells[i + stride - 1] + cells[i + stride] + cells[i + stride + 1]
}

export type Rules = { surviveMin: number; surviveMax: number; birth: number }

// The next state for every case, indexed by neighbors, plus 16 if the cell is alive.
export const buildRuleTable = ({ surviveMin, surviveMax, birth }: Rules) => {
    const table = new Uint8Array(32)
    for (let neighbors = 0; neighbors <= 8; neighbors++) {
        table[neighbors] = neighbors === birth ? 1 : 0
        table[16 + neighbors] = neighbors >= surviveMin && neighbors <= surviveMax ? 1 : 0
    }
    return table
}

export const RANDOM_BIRTH_CHANCE = 0.01

// Advances one generation and swaps the buffers. Random births only reach cells the rules left dead.
export const stepBoard = (board: Board, table: Uint8Array, randomBirths = false) => {
    const { cols, rows, stride, columnSums: sums } = board
    const cells = board.cells, next = board.next
    let alive = 0

    for (let row = 1; row <= rows; row++) {
        const start = row * stride
        const above = start - stride, below = start + stride
        for (let x = 0; x < stride; x++) sums[x] = cells[above + x] + cells[start + x] + cells[below + x]

        // The sum of three columns counts the cell itself, so it is taken back out.
        let left = sums[0], middle = sums[1]
        for (let x = 1; x <= cols; x++) {
            const right = sums[x + 1]
            const cell = cells[start + x]
            const state = table[(cell << 4) + left + middle + right - cell]
            next[start + x] = state
            alive += state
            left = middle
            middle = right
        }
    }

    if (randomBirths) {
        for (let row = 1; row <= rows; row++) {
            const start = row * stride
            for (let x = 1; x <= cols; x++) {
                if (!next[start + x] && Math.random() < RANDOM_BIRTH_CHANCE) {
                    next[start + x] = 1
                    alive++
                }
            }
        }
    }

    board.cells = next
    board.next = cells
    board.alive = alive
}

// Writes the board into pixels, one per cell, for putImageData.
export const paintPixels = (board: Board, pixels: Uint32Array, color: number) => {
    const { cols, rows, stride, cells } = board
    let out = 0
    for (let row = 1; row <= rows; row++) {
        const start = row * stride
        for (let x = 1; x <= cols; x++) pixels[out++] = cells[start + x] ? color : 0
    }
}

// Pixels are in the canvas byte order: alpha, blue, green, red.
export const channelsToPixel = (channels: string) => {
    const [r, g, b] = channels.trim().split(/\s+/).map(Number)
    return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0
}
