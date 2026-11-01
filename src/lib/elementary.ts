// Elementary cellular automata: one row of cells, where each cell's next state depends on itself
// and its two neighbors. Those three cells have 8 possible patterns, so a rule is 8 bits, and there
// are 256 rules. Bit n of the rule number is the next state for the pattern that reads as n in binary.

export type Start = "single" | "random"

export const RULE_COUNT = 256

export const ruleTable = (rule: number) => Uint8Array.from({ length: 8 }, (_, pattern) => (rule >> pattern) & 1)

// Fills the row and returns how many cells are alive.
export const seedRow = (row: Uint8Array, start: Start, density: number, random: () => number = Math.random) => {
    if (start === "single") {
        row.fill(0)
        if (row.length) row[row.length >> 1] = 1
        return row.length ? 1 : 0
    }
    let alive = 0
    for (let i = 0; i < row.length; i++) {
        row[i] = random() < density ? 1 : 0
        alive += row[i]
    }
    return alive
}

// Writes the next generation and returns how many cells are alive. Without wrapping, the cells past
// each edge count as dead.
export const stepRow = (row: Uint8Array, next: Uint8Array, table: Uint8Array, wrap: boolean) => {
    const last = row.length - 1
    if (last < 0) return 0
    let left = wrap ? row[last] : 0
    let center = row[0]
    let alive = 0
    for (let i = 0; i <= last; i++) {
        const right = i < last ? row[i + 1] : wrap ? row[0] : 0
        const state = table[(left << 2) | (center << 1) | right]
        next[i] = state
        alive += state
        left = center
        center = right
    }
    return alive
}
