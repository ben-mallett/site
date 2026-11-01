// Blackjack simulator for the card counting article. Run with: npx tsx scripts/simulateHiLo.ts [rounds] [s17]
// The s17 run only adds its overall edge to the stats, to compare with the published cost of the H17 rule.
// Six decks, dealer hits soft 17, double any two, double after split, split to four hands, split aces
// get one card, no surrender, blackjack pays 3:2, 75% of the shoe dealt. The player uses fixed basic
// strategy and never takes insurance, so every change in edge comes from the cards left in the shoe.
import fs from "fs"
import path from "path"

const DECKS = 6
const CARDS = DECKS * 52
const CUT = Math.floor(CARDS * 0.75)
const ROUNDS = Number(process.argv[2] ?? 300_000_000)
const S17 = process.argv[3] === "s17"

// Ranks are 2-10, with 11 for an ace.
const shoe = new Uint8Array(CARDS)
{
    let i = 0
    for (let rank = 2; rank <= 11; rank++) {
        const copies = (rank === 10 ? 16 : 4) * DECKS
        for (let c = 0; c < copies; c++) shoe[i++] = rank
    }
}

// xorshift, since this loop draws billions of numbers.
let state = (Date.now() ^ 0x9e3779b9) >>> 0 || 1
const random = () => {
    state ^= state << 13; state >>>= 0
    state ^= state >>> 17
    state ^= state << 5; state >>>= 0
    return state
}

let next = CARDS
const shuffle = () => {
    for (let i = CARDS - 1; i > 0; i--) {
        const j = random() % (i + 1)
        const swap = shoe[i]; shoe[i] = shoe[j]; shoe[j] = swap
    }
    next = 0
}
const draw = () => shoe[next++]

const total = (cards: number[]) => {
    let sum = 0, aces = 0
    for (const card of cards) { sum += card; if (card === 11) aces++ }
    while (sum > 21 && aces > 0) { sum -= 10; aces-- }
    return { sum, soft: aces > 0 }
}

// up is the dealer's card, 2-11. These cover hard, soft, and pair decisions for this rule set.
const inRange = (up: number, low: number, high: number) => up >= low && up <= high

const shouldSplit = (rank: number, up: number) => {
    switch (rank) {
        case 11: case 8: return true
        case 10: case 5: return false
        case 9: return inRange(up, 2, 6) || up === 8 || up === 9
        case 7: case 3: case 2: return inRange(up, 2, 7)
        case 6: return inRange(up, 2, 6)
        case 4: return up === 5 || up === 6
    }
    return false
}

const shouldDouble = (sum: number, soft: boolean, up: number) => {
    if (soft) {
        if (sum === 13 || sum === 14) return up === 5 || up === 6
        if (sum === 15 || sum === 16) return inRange(up, 4, 6)
        if (sum === 17) return inRange(up, 3, 6)
        if (sum === 18) return inRange(up, S17 ? 3 : 2, 6)
        if (sum === 19) return !S17 && up === 6
        return false
    }
    if (sum === 9) return inRange(up, 3, 6)
    if (sum === 10) return inRange(up, 2, 9)
    return sum === 11 && !(S17 && up === 11)
}

const shouldHit = (sum: number, soft: boolean, up: number) => {
    if (soft) return sum <= 17 || (sum === 18 && up >= 9)
    if (sum <= 11) return true
    if (sum === 12) return !inRange(up, 4, 6)
    if (sum <= 16) return up >= 7
    return false
}

const playDealer = (cards: number[]) => {
    while (true) {
        const { sum, soft } = total(cards)
        if (sum > 17 || (sum === 17 && (!soft || S17))) return sum
        cards.push(draw())
    }
}

type PlayerHand = { cards: number[]; bet: number; fromAces: boolean; split: boolean }

const playRound = () => {
    const first = draw(), up = draw(), second = draw(), hole = draw()
    const playerBlackjack = first + second === 21
    const dealerBlackjack = up + hole === 21
    if (playerBlackjack || dealerBlackjack) return playerBlackjack && dealerBlackjack ? 0 : playerBlackjack ? 1.5 : -1

    const queue: PlayerHand[] = [{ cards: [first, second], bet: 1, fromAces: false, split: false }]
    const done: PlayerHand[] = []
    let handCount = 1
    while (queue.length) {
        const hand = queue.pop()!
        // One card only on split aces.
        if (hand.fromAces) { done.push(hand); continue }
        if (hand.cards.length === 2 && hand.cards[0] === hand.cards[1] && handCount < 4 && shouldSplit(hand.cards[0], up)) {
            const rank = hand.cards[0]
            const fromAces = rank === 11
            handCount++
            queue.push({ cards: [rank, draw()], bet: hand.bet, fromAces, split: true })
            queue.push({ cards: [rank, draw()], bet: hand.bet, fromAces, split: true })
            continue
        }
        while (true) {
            const { sum, soft } = total(hand.cards)
            if (sum >= 21) break
            if (hand.cards.length === 2 && shouldDouble(sum, soft, up)) {
                hand.bet *= 2
                hand.cards.push(draw())
                break
            }
            if (!shouldHit(sum, soft, up)) break
            hand.cards.push(draw())
        }
        done.push(hand)
    }

    const live = done.some((hand) => total(hand.cards).sum <= 21)
    const dealerCards = [up, hole]
    const dealerSum = live ? playDealer(dealerCards) : 0
    let result = 0
    for (const hand of done) {
        const { sum } = total(hand.cards)
        if (sum > 21) result -= hand.bet
        else if (dealerSum > 21 || sum > dealerSum) result += hand.bet
        else if (sum < dealerSum) result -= hand.bet
    }
    return result
}

const tag = (rank: number) => rank <= 6 ? 1 : rank >= 10 ? -1 : 0
const MIN_TC = -6, MAX_TC = 8
const bucketOf = (tc: number) => Math.min(MAX_TC, Math.max(MIN_TC, tc)) - MIN_TC
const BUCKETS = MAX_TC - MIN_TC + 1
const rounds = new Float64Array(BUCKETS), sums = new Float64Array(BUCKETS), squares = new Float64Array(BUCKETS)
const tens = new Float64Array(BUCKETS), remaining = new Float64Array(BUCKETS)
// Insurance when the dealer shows an ace: pays 2 on a ten in the hole, otherwise loses 1.
const insuranceBets = new Float64Array(BUCKETS), insuranceWins = new Float64Array(BUCKETS)

let played = 0
while (played < ROUNDS) {
    shuffle()
    let running = 0, tensSeen = 0
    let counted = 0
    while (next < CUT) {
        // Count everything dealt since the last round, as a player at the table would.
        for (; counted < next; counted++) { running += tag(shoe[counted]); if (shoe[counted] === 10) tensSeen++ }
        const left = CARDS - next
        const bucket = bucketOf(Math.floor(running / (left / 52)))
        rounds[bucket]++
        tens[bucket] += 16 * DECKS - tensSeen
        remaining[bucket] += left
        const up = shoe[next + 1], hole = shoe[next + 3]
        if (up === 11) { insuranceBets[bucket]++; if (hole === 10) insuranceWins[bucket]++ }
        const result = playRound()
        sums[bucket] += result
        squares[bucket] += result * result
        played++
        if (played % 50_000_000 === 0) console.log(`  ${played.toLocaleString()} rounds`)
    }
}

const byCount = Array.from({ length: BUCKETS }, (_, i) => ({
    trueCount: i + MIN_TC,
    frequency: rounds[i] / played,
    edge: sums[i] / rounds[i],
    tenDensity: tens[i] / remaining[i],
    insuranceEdge: insuranceBets[i] ? (3 * insuranceWins[i] - insuranceBets[i]) / insuranceBets[i] : null,
}))

const totalSum = sums.reduce((a, b) => a + b, 0)
const totalSquare = squares.reduce((a, b) => a + b, 0)
const flatEdge = totalSum / played
const flatDeviation = Math.sqrt(totalSquare / played - flatEdge ** 2)

// Bets by true count, in units. Sits out nothing, so it can be compared with flat betting directly.
const spreads = {
    "1 to 4": (tc: number) => tc >= 3 ? 4 : tc === 2 ? 2 : 1,
    "1 to 8": (tc: number) => tc >= 4 ? 8 : tc === 3 ? 6 : tc === 2 ? 4 : tc === 1 ? 2 : 1,
    "1 to 12": (tc: number) => tc >= 5 ? 12 : tc === 4 ? 10 : tc === 3 ? 8 : tc === 2 ? 4 : tc === 1 ? 2 : 1,
}
const spreadResults = Object.entries(spreads).map(([name, bet]) => {
    let mean = 0, second = 0, average = 0
    for (let i = 0; i < BUCKETS; i++) {
        const units = bet(i + MIN_TC)
        mean += sums[i] * units
        second += squares[i] * units * units
        average += rounds[i] * units
    }
    mean /= played; second /= played; average /= played
    const variance = second - mean * mean
    return {
        name,
        evPerHundred: mean * 100,
        deviationPerHundred: Math.sqrt(variance * 100),
        averageBet: average,
        edgeOnAction: mean / average,
        handsToOvercome: variance / (mean * mean),
        // Bankroll in units for a 5% risk of ruin, from risk = exp(-2 * ev * bankroll / variance).
        bankrollFor5Percent: mean > 0 ? -Math.log(0.05) * variance / (2 * mean) : null,
    }
})

// Exact standard deviation of the running count after n cards, from the hypergeometric variance.
const runningCount = [26, 52, 104, 156, 208, 234].map((dealt) => ({
    dealt,
    deviation: Math.sqrt(dealt * (40 / 52) * (CARDS - dealt) / (CARDS - 1)),
}))

const output = path.join(process.cwd(), "src/lib/hiLoStats.json")
if (S17) {
    const stats = JSON.parse(fs.readFileSync(output, "utf8"))
    fs.writeFileSync(output, JSON.stringify({ ...stats, s17: { rounds: played, flatEdge } }, null, 2) + "\n")
} else {
    // The s17 run's overall edge doesn't depend on how counts are grouped, so an earlier one still applies.
    const { s17 } = fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, "utf8")) : { s17: undefined }
    const stats = { rounds: played, flatEdge, flatDeviation, byCount, spreadResults, runningCount, s17 }
    fs.writeFileSync(output, JSON.stringify(stats, null, 2) + "\n")
}
console.log("flat edge", flatEdge, "deviation", flatDeviation)
console.table(byCount.map((row) => ({ tc: row.trueCount, freq: row.frequency.toFixed(4), edge: (row.edge * 100).toFixed(2), tens: row.tenDensity.toFixed(4), ins: row.insuranceEdge?.toFixed(3) })))
console.table(spreadResults)
console.log("wrote stats")
