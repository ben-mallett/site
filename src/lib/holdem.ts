import { PokerCard, PokerDeckUnshuffled, PokerSuit, PokerValue, PokerValueRanks, getShuffledDeck } from "./pokerUtils";

// Card = rank * 4 + suit, with rank 0 for a two and 12 for an ace.
export const HAND_CLASSES = ["High card", "One pair", "Two pair", "Three of a kind", "Straight", "Flush", "Full house", "Four of a kind", "Straight flush", "Royal flush"]

// The highest rank of a five-long run in a rank bitmask, or -1. Aces also play low.
const straightHigh = (mask: number) => {
    for (let high = 12; high >= 4; high--) {
        const run = 0b11111 << (high - 4)
        if ((mask & run) === run) return high
    }
    return (mask & 0b1000000001111) === 0b1000000001111 ? 3 : -1
}

const counts = new Uint8Array(13), suitCounts = new Uint8Array(4), suitMasks = new Int32Array(4)

// Takes the first n cards, and returns class * 2^20 plus up to five ranks, so higher always wins.
export const evaluate = (cards: number[], n: number) => {
    counts.fill(0); suitCounts.fill(0); suitMasks.fill(0)
    let mask = 0
    for (let i = 0; i < n; i++) {
        const rank = cards[i] >> 2, suit = cards[i] & 3
        counts[rank]++; suitCounts[suit]++
        suitMasks[suit] |= 1 << rank
        mask |= 1 << rank
    }
    const score = (hand: number, a = 0, b = 0, c = 0, d = 0, e = 0) => (hand << 20) | (a << 16) | (b << 12) | (c << 8) | (d << 4) | e

    let flushSuit = -1
    for (let suit = 0; suit < 4; suit++) if (suitCounts[suit] >= 5) flushSuit = suit
    if (flushSuit >= 0) {
        const high = straightHigh(suitMasks[flushSuit])
        if (high === 12) return score(9)
        if (high >= 0) return score(8, high)
    }

    let quad = -1, trip = -1, secondTrip = -1, pair = -1, secondPair = -1
    for (let rank = 12; rank >= 0; rank--) {
        if (counts[rank] === 4) quad = rank
        else if (counts[rank] === 3) { if (trip < 0) trip = rank; else if (secondTrip < 0) secondTrip = rank }
        else if (counts[rank] === 2) { if (pair < 0) pair = rank; else if (secondPair < 0) secondPair = rank }
    }

    // The highest ranks in the mask, skipping any already used.
    const kickers = (howMany: number, skipA = -1, skipB = -1) => {
        const out = [0, 0, 0, 0, 0]
        let found = 0
        for (let rank = 12; rank >= 0 && found < howMany; rank--) {
            if (rank !== skipA && rank !== skipB && (mask & (1 << rank))) out[found++] = rank
        }
        return out
    }

    if (quad >= 0) return score(7, quad, kickers(1, quad)[0])
    if (trip >= 0 && (secondTrip >= 0 || pair >= 0)) return score(6, trip, Math.max(secondTrip, pair))
    if (flushSuit >= 0) {
        const top: number[] = []
        for (let rank = 12; rank >= 0 && top.length < 5; rank--) if (suitMasks[flushSuit] & (1 << rank)) top.push(rank)
        return score(5, top[0], top[1], top[2], top[3], top[4])
    }
    const high = straightHigh(mask)
    if (high >= 0) return score(4, high)
    if (trip >= 0) { const k = kickers(2, trip); return score(3, trip, k[0], k[1]) }
    if (pair >= 0 && secondPair >= 0) return score(2, pair, secondPair, kickers(1, pair, secondPair)[0])
    if (pair >= 0) { const k = kickers(3, pair); return score(1, pair, k[0], k[1], k[2]) }
    const k = kickers(5)
    return score(0, k[0], k[1], k[2], k[3], k[4])
}

const SUIT_ORDER = [PokerSuit.Spade, PokerSuit.Heart, PokerSuit.Diamond, PokerSuit.Club]

// The evaluator's form of a card. Its checks use the same rank and suit order as this.
const toNumber = (card: PokerCard) => (PokerValueRanks[card.value] - 2) * 4 + SUIT_ORDER.indexOf(card.suit)

export const scoreHand = (cards: PokerCard[]) => evaluate(cards.map(toNumber), cards.length)
export const handName = (score: number) => HAND_CLASSES[score >> 20]

// Rank in the full order, used to tell how close two hands are.
const handClass = (score: number) => score >> 20

const deal = (count: number) => getShuffledDeck(PokerDeckUnshuffled).slice(0, count)

export type Showdown = { first: PokerCard[]; second: PokerCard[]; board: PokerCard[]; firstScore: number; secondScore: number; winner: "first" | "second" | "tie" }

// Mostly close hands, since a flush against a pair teaches nothing. Far apart hands still appear now and then.
export const newShowdown = (): Showdown => {
    while (true) {
        const cards = deal(9)
        const first = cards.slice(0, 2), second = cards.slice(2, 4), board = cards.slice(4)
        const firstScore = scoreHand([...first, ...board]), secondScore = scoreHand([...second, ...board])
        if (Math.abs(handClass(firstScore) - handClass(secondScore)) > 1 && Math.random() > 0.2) continue
        return { first, second, board, firstScore, secondScore, winner: firstScore > secondScore ? "first" : firstScore < secondScore ? "second" : "tie" }
    }
}

export type TurnSpot = {
    hero: PokerCard[]
    villain: PokerCard[]
    board: PokerCard[]
    outs: PokerCard[]
    chops: PokerCard[]
    // Share of the pot won on average over the river, with chops as half.
    equity: number
}

// Both hands are face up with one card to come, so every river card has a known result.
const readTurn = (hero: PokerCard[], villain: PokerCard[], board: PokerCard[]): TurnSpot => {
    const seen = [...hero, ...villain, ...board]
    const unseen = PokerDeckUnshuffled.filter((card) => !seen.includes(card))
    const outs: PokerCard[] = [], chops: PokerCard[] = []
    let beaten = 0
    for (const river of unseen) {
        const mine = scoreHand([...hero, ...board, river]), theirs = scoreHand([...villain, ...board, river])
        if (mine > theirs) outs.push(river)
        else if (mine === theirs) chops.push(river)
        else beaten++
    }
    return { hero, villain, board, outs, chops, equity: (outs.length + chops.length / 2) / (outs.length + chops.length + beaten) }
}

// A turn where you are behind now, with at least one card that can save you.
export const newOutsSpot = (): TurnSpot => {
    while (true) {
        const cards = deal(8)
        const hero = cards.slice(0, 2), villain = cards.slice(2, 4), board = cards.slice(4)
        if (scoreHand([...hero, ...board]) >= scoreHand([...villain, ...board])) continue
        const spot = readTurn(hero, villain, board)
        if (spot.outs.length >= 1 && spot.outs.length <= 20) return spot
    }
}

export type CallSpot = TurnSpot & { pot: number; toCall: number; needed: number; callValue: number; shouldCall: boolean }

// The pot already holds the bet. Prices are set from the hand's equity, so calling and folding come up about
// equally often, and always folding can't score well. Spots too close to call are skipped, because they test
// rounding and not judgment.
export const newCallSpot = (): CallSpot => {
    while (true) {
        const spot = newOutsSpot()
        if (spot.equity < 0.06) continue
        const call = Math.random() < 0.5
        const target = spot.equity + (call ? -1 : 1) * (0.02 + Math.random() * 0.13)
        if (target <= 0.04 || target > 0.5) continue
        const pot = (Math.floor(Math.random() * 19) + 2) * 10
        const toCall = Math.round((pot * target) / (1 - target) / 5) * 5
        if (toCall < 5) continue
        const needed = toCall / (pot + toCall)
        if (Math.abs(spot.equity - needed) < 0.015) continue
        const callValue = spot.equity * (pot + toCall) - toCall
        return { ...spot, pot, toCall, needed, callValue, shouldCall: callValue > 0 }
    }
}

export const cardCode = (card: PokerCard) => `${card.value === PokerValue.Ten ? "10" : card.value}${{ [PokerSuit.Heart]: "♥︎", [PokerSuit.Diamond]: "♦︎", [PokerSuit.Club]: "♣︎", [PokerSuit.Spade]: "♠︎" }[card.suit]}`
