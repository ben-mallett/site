// Exact video poker analysis. Run with: npx tsx scripts/solveVideoPoker.ts
// Finds the best of the 32 holds for all 2,598,960 deals, without drawing any card twice:
// the totals for every card subset are built once, and inclusion-exclusion removes the discards.
import fs from "fs"
import path from "path"
import { PokerDeckUnshuffled as DECK, PokerCard, PokerSuit, PokerValue } from "../src/lib/pokerUtils"
import { Category, Variant, getVariant, variants } from "../src/lib/videoPoker"

const choose = (n: number, k: number) => {
    if (k < 0 || k > n) return 0
    let result = 1
    for (let i = 0; i < k; i++) result = result * (n - i) / (i + 1)
    return Math.round(result)
}
const C: number[][] = Array.from({ length: 53 }, (_, n) => Array.from({ length: 6 }, (_, k) => choose(n, k)))
const OFFSET = [0, 1, 53, 1379, 23479, 294204]
const TABLE_SIZE = 2893166

// A unique slot for each subset of up to five cards. Cards must be sorted.
const slot = (cards: number[]) => {
    let rank = 0
    for (let i = 0; i < cards.length; i++) rank += C[cards[i]][i + 1]
    return OFFSET[cards.length] + rank
}

// Slots for all 32 subsets of a sorted hand, indexed by bitmask.
const subsetSlots = (hand: number[], out: Int32Array) => {
    for (let mask = 0; mask < 32; mask++) {
        const cards: number[] = []
        for (let i = 0; i < 5; i++) if (mask & (1 << i)) cards.push(hand[i])
        out[mask] = slot(cards)
    }
}

const eachHand = (visit: (hand: number[]) => void) => {
    for (let a = 0; a < 52; a++) for (let b = a + 1; b < 52; b++) for (let c = b + 1; c < 52; c++)
        for (let d = c + 1; d < 52; d++) for (let e = d + 1; e < 52; e++) visit([a, b, c, d, e])
}

// Sub-masks of each discard set, with the inclusion-exclusion sign.
const SUBMASKS: { mask: number; sign: number }[][] = Array.from({ length: 32 }, (_, discard) => {
    const list: { mask: number; sign: number }[] = []
    let sub = discard
    while (true) {
        let bits = 0
        for (let i = 0; i < 5; i++) if (sub & (1 << i)) bits++
        list.push({ mask: sub, sign: bits % 2 ? -1 : 1 })
        if (sub === 0) break
        sub = (sub - 1) & discard
    }
    return list
})
const DRAW_COUNTS = Array.from({ length: 32 }, (_, hold) => {
    let held = 0
    for (let i = 0; i < 5; i++) if (hold & (1 << i)) held++
    return C[47][5 - held]
})

// Category index of every five card hand, in slot order.
const classify = (variant: Variant) => {
    const index = new Map<string | null, number>(variant.categories.map((c, i) => [c.id, i]))
    index.set(null, variant.categories.length)
    const classes = new Uint8Array(TABLE_SIZE)
    const slots = new Int32Array(32)
    eachHand((hand) => {
        subsetSlots(hand, slots)
        const result = variant.evaluate(hand.map((i) => DECK[i]))
        if (!index.has(result)) throw Error(`Unknown result ${result}`)
        classes[slots[31]] = index.get(result)!
    })
    return classes
}

// How many five card hands of each result contain each card subset. These never change,
// so a new set of hand values is just a weighted sum of them.
const buildCounters = (classes: Uint8Array, count: number) => {
    const counters = Array.from({ length: count }, () => new Uint32Array(TABLE_SIZE))
    const slots = new Int32Array(32)
    eachHand((hand) => {
        subsetSlots(hand, slots)
        const counter = counters[classes[slots[31]]]
        for (let mask = 0; mask < 32; mask++) counter[slots[mask]] += 1
    })
    return counters
}

const combine = (counters: Uint32Array[], weights: number[]) => {
    const totals = new Float64Array(TABLE_SIZE)
    counters.forEach((counter, category) => {
        const weight = weights[category]
        if (weight === 0) return
        for (let i = 0; i < TABLE_SIZE; i++) totals[i] += counter[i] * weight
    })
    return totals
}

const holdValue = (totals: Float64Array | Uint32Array, slots: Int32Array, hold: number) => {
    let sum = 0
    for (const { mask, sign } of SUBMASKS[31 ^ hold]) sum += sign * totals[slots[hold | mask]]
    return sum / DRAW_COUNTS[hold]
}

// Plays every deal by the weights and returns how often each result lands.
const solve = (counters: Uint32Array[], weights: number[]) => {
    const count = weights.length
    const totals = combine(counters, weights)
    const probabilities = new Array<number>(count).fill(0)
    const slots = new Int32Array(32)
    let deals = 0
    eachHand((hand) => {
        subsetSlots(hand, slots)
        let best = 0, bestValue = -Infinity
        for (let hold = 0; hold < 32; hold++) {
            const value = holdValue(totals, slots, hold)
            if (value > bestValue + 1e-9) { bestValue = value; best = hold }
        }
        for (let category = 0; category < count; category++) probabilities[category] += holdValue(counters[category], slots, best)
        deals++
    })
    return probabilities.map((p) => p / deals)
}

const pays = (variant: Variant) => [...variant.categories.map((c: Category) => c.pays), 0]

const analyzePlain = (variant: Variant) => {
    const payouts = pays(variant)
    const probabilities = solve(buildCounters(classify(variant), payouts.length), payouts)
    const mean = probabilities.reduce((sum, p, i) => sum + p * payouts[i], 0)
    const variance = probabilities.reduce((sum, p, i) => sum + p * (payouts[i] - mean) ** 2, 0)
    return {
        return: mean,
        standardDeviation: Math.sqrt(variance),
        hitFrequency: 1 - probabilities[probabilities.length - 1],
        hands: variant.categories.map((c, i) => ({ id: c.id, name: c.name, pays: c.pays, probability: probabilities[i], share: probabilities[i] * payouts[i] })),
    }
}

// One strategy that ignores the current multiplier. On each line a result is worth its pay at the
// average multiplier, plus the multiplier it earns times the next hand's base pay. Repeating until
// those two averages stop moving gives the best such strategy.
const analyzeUltimate = (variant: Variant, earnsOverride?: number[]) => {
    const payouts = pays(variant)
    const counters = buildCounters(classify(variant), payouts.length)
    const earns = earnsOverride ?? [...variant.categories.map((c) => c.earns ?? 1), 1]
    let averageMultiplier = 2, basePay = 1
    let probabilities: number[] = []
    for (let i = 0; i < 5; i++) {
        probabilities = solve(counters, payouts.map((pay, j) => pay * averageMultiplier + earns[j] * basePay))
        basePay = probabilities.reduce((sum, p, j) => sum + p * payouts[j], 0)
        averageMultiplier = probabilities.reduce((sum, p, j) => sum + p * earns[j], 0)
        console.log(`  round ${i + 1}: base pay ${basePay.toFixed(6)}, average multiplier ${averageMultiplier.toFixed(6)}, return ${(basePay * averageMultiplier / 2).toFixed(6)}`)
    }
    return { basePay, averageMultiplier, return: basePay * averageMultiplier / 2 }
}

// Every hold of one deal, best first.
const compareHolds = (variant: Variant, cards: PokerCard[]) => {
    const payouts = pays(variant)
    const totals = combine(buildCounters(classify(variant), payouts.length), payouts)
    const hand = cards.map((card) => DECK.findIndex((d) => d.suit === card.suit && d.value === card.value))
    const order = hand.map((_, i) => i).sort((a, b) => hand[a] - hand[b])
    const sorted = order.map((i) => hand[i])
    const slots = new Int32Array(32)
    subsetSlots(sorted, slots)
    return Array.from({ length: 32 }, (_, hold) => ({
        held: order.filter((_, i) => hold & (1 << i)).map((i) => `${cards[i].value}${cards[i].suit[0]}`),
        value: holdValue(totals, slots, hold),
        draws: DRAW_COUNTS[hold],
    })).sort((a, b) => b.value - a.value)
}

const main = () => {
    const stats: Record<string, unknown> = {}
    for (const id of ["jacks-or-better", "double-double-bonus", "deuces-wild"] as const) {
        console.log(id)
        const variant = getVariant(id)
        const analysis = analyzePlain(variant)
        console.log(`  return ${analysis.return.toFixed(8)} published ${variant.publishedReturn}, sd ${analysis.standardDeviation.toFixed(3)}`)
        stats[id] = analysis
    }

    const bonus = variants.find((variant) => variant.id === "ultimate-x")!
    console.log("bonus 7/5 base")
    stats["bonus-base"] = analyzePlain(bonus)

    console.log("ultimate x, bonus 7/5")
    stats["ultimate-x"] = analyzeUltimate(bonus)

    // Checks the method against the published 99.38% for 8/6 Jacks or Better 10-play.
    console.log("ultimate x check, jacks 8/6")
    const jacks86: Variant = {
        ...getVariant("jacks-or-better"),
        categories: getVariant("jacks-or-better").categories.map((c) => ({ ...c, pays: c.id === "full-house" ? 8 : c.pays })),
    }
    stats["ultimate-x-check"] = analyzeUltimate(jacks86, [7, 7, 3, 12, 11, 7, 4, 3, 2, 1])

    console.log("worked example")
    const { Spade, Heart } = PokerSuit
    const { Ten, Jack, Queen, Four } = PokerValue
    const dealt = [
        { value: Queen, suit: Spade }, { value: Jack, suit: Spade }, { value: Ten, suit: Spade },
        { value: Four, suit: Spade }, { value: Queen, suit: Heart },
    ]
    const holds = compareHolds(getVariant("jacks-or-better"), dealt)
    console.log(holds.slice(0, 5))
    stats["worked-example"] = { dealt: dealt.map((c) => `${c.value}${c.suit[0]}`), holds: [...holds.slice(0, 2), holds.find((hold) => hold.held.length === 4 && !hold.held.includes("QH"))] }

    const out = path.join(process.cwd(), "src/lib/videoPokerStats.json")
    fs.writeFileSync(out, JSON.stringify(stats, null, 2) + "\n")
    console.log("wrote", out)
}

main()
