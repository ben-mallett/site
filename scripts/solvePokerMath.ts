// Exact counts for the poker math page. Run with: npx tsx scripts/solvePokerMath.ts
// Enumerates every 5 card and 7 card hand and every board for each heads-up matchup, then stops with
// an error if the counts differ from the published tables.
import fs from "fs"
import path from "path"
import { HAND_CLASSES, evaluate } from "../src/lib/holdem"

const RANKS = "23456789TJQKA", SUITS = "shdc"
const card = (text: string) => RANKS.indexOf(text[0]) * 4 + SUITS.indexOf(text[1])

const CLASSES = HAND_CLASSES

const countFive = () => {
    const totals = new Array(CLASSES.length).fill(0)
    const distinct = new Set<number>()
    const hand = [0, 0, 0, 0, 0]
    for (hand[0] = 0; hand[0] < 52; hand[0]++) for (hand[1] = hand[0] + 1; hand[1] < 52; hand[1]++)
        for (hand[2] = hand[1] + 1; hand[2] < 52; hand[2]++) for (hand[3] = hand[2] + 1; hand[3] < 52; hand[3]++)
            for (hand[4] = hand[3] + 1; hand[4] < 52; hand[4]++) {
                const value = evaluate(hand, 5)
                totals[value >> 20]++
                distinct.add(value)
            }
    return { totals, distinct: distinct.size }
}

const countSeven = () => {
    const totals = new Array(CLASSES.length).fill(0)
    const h = [0, 0, 0, 0, 0, 0, 0]
    for (h[0] = 0; h[0] < 52; h[0]++) { console.log(`  seven card hands, first card ${h[0] + 1} of 46`)
        for (h[1] = h[0] + 1; h[1] < 52; h[1]++) for (h[2] = h[1] + 1; h[2] < 52; h[2]++)
        for (h[3] = h[2] + 1; h[3] < 52; h[3]++) for (h[4] = h[3] + 1; h[4] < 52; h[4]++)
        for (h[5] = h[4] + 1; h[5] < 52; h[5]++) for (h[6] = h[5] + 1; h[6] < 52; h[6]++) totals[evaluate(h, 7) >> 20]++
        if (h[0] === 45) break }
    return totals
}

const matchup = (a: string[], b: string[]) => {
    const handA = a.map(card), handB = b.map(card)
    const used = new Set([...handA, ...handB])
    const rest = Array.from({ length: 52 }, (_, i) => i).filter((c) => !used.has(c))
    const first = [handA[0], handA[1], 0, 0, 0, 0, 0], second = [handB[0], handB[1], 0, 0, 0, 0, 0]
    let wins = 0, ties = 0, boards = 0
    const n = rest.length
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) for (let l = k + 1; l < n; l++) for (let m = l + 1; m < n; m++) {
        first[2] = second[2] = rest[i]; first[3] = second[3] = rest[j]; first[4] = second[4] = rest[k]; first[5] = second[5] = rest[l]; first[6] = second[6] = rest[m]
        const x = evaluate(first, 7), y = evaluate(second, 7)
        if (x > y) wins++; else if (x === y) ties++
        boards++
    }
    return { win: wins / boards, tie: ties / boards, lose: (boards - wins - ties) / boards, equity: (wins + ties / 2) / boards, boards }
}

const PUBLISHED_FIVE = [1302540, 1098240, 123552, 54912, 10200, 5108, 3744, 624, 36, 4]
const PUBLISHED_SEVEN = [23294460, 58627800, 31433400, 6461620, 6180020, 4047644, 3473184, 224848, 37260, 4324]

const check = (name: string, got: number[], want: number[]) => {
    if (got.join() !== want.join()) throw Error(`${name} differs from published: ${got} vs ${want}`)
    console.log(`${name} matches the published counts`)
}

console.log("five card hands")
const five = countFive()
check("five card", five.totals, PUBLISHED_FIVE)
if (five.distinct !== 7462) throw Error(`Expected 7462 distinct hands, got ${five.distinct}`)
console.log("7462 distinct hand ranks")

console.log("seven card hands")
const seven = countSeven()
check("seven card", seven, PUBLISHED_SEVEN)

const MATCHUPS = [
    { a: ["As", "Ah"], b: ["Kd", "Kc"], label: "AA vs KK", note: "Higher pair against lower pair" },
    { a: ["Qs", "Qh"], b: ["Ad", "Kc"], label: "QQ vs AK offsuit", note: "Pair against two overcards" },
    { a: ["Qs", "Qh"], b: ["Ad", "Kd"], label: "QQ vs AK suited", note: "Same, with flush chances" },
    { a: ["2s", "2h"], b: ["Ad", "Kc"], label: "22 vs AK offsuit", note: "The smallest pair is still ahead" },
    { a: ["As", "Kd"], b: ["Ah", "Qc"], label: "AK vs AQ", note: "A dominated hand" },
    { a: ["Ah", "Ks"], b: ["7d", "6d"], label: "AK vs 76 suited", note: "Two overcards against connectors" },
]
const matchups = MATCHUPS.map((game) => {
    console.log(`matchup ${game.label}`)
    return { label: game.label, note: game.note, ...matchup(game.a, game.b) }
})

const stats = { classes: CLASSES, five: five.totals, distinctFive: five.distinct, seven, matchups }
fs.writeFileSync(path.join(process.cwd(), "src/lib/pokerMathStats.json"), JSON.stringify(stats, null, 2) + "\n")
console.table(matchups)
console.log("wrote stats")
