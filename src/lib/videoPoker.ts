import { Hand, Holds, PokerCard, PokerDeckUnshuffled, PokerValue, PokerValueRanks, getCardsFromDeck, getHandFromDeck, getShuffledDeck } from "./pokerUtils";

// Every number here comes from the Wizard of Odds tables linked on the math page.
export const WIZARD_URL = "https://wizardofodds.com/games/video-poker/tables"

export type Category = {
    id: string
    name: string
    // Per coin, on the coins the hand pays on.
    pays: number
    // Ultimate X: the multiplier this hand earns for the next hand on its line.
    earns?: number
    // Gold: the multipliers this hand steps through.
    progression?: number[]
    // Gold: the hands this one upgrades when it is dealt.
    upgrades?: string[]
}

export type VariantId = "ultimate-x" | "ultimate-x-gold" | "jacks-or-better" | "double-double-bonus" | "deuces-wild"

export type Variant = {
    id: VariantId
    name: string
    summary: string
    payTable: string
    mode: "plain" | "ultimate" | "gold"
    hands: number
    coinsPerHand: number
    // Multiplier games pay on 5 coins. The other 5 buy the feature.
    coinsPaidOn: number
    // Best paying first.
    categories: Category[]
    evaluate: (cards: PokerCard[]) => string | null
    publishedReturn: number
    sourcePath: string
}

const rankOf = (card: PokerCard) => PokerValueRanks[card.value]

const countRanks = (cards: PokerCard[]) => {
    const counts = new Map<number, number>()
    for (const card of cards) counts.set(rankOf(card), (counts.get(rankOf(card)) ?? 0) + 1)
    return counts
}

const isFlush = (cards: PokerCard[]) => cards.every((card) => card.suit === cards[0].suit)

// Works on any number of distinct ranks, so wild hands can leave gaps for the deuces to fill.
const fitsStraight = (ranks: number[]) => {
    if (new Set(ranks).size !== ranks.length) return false
    const fits = (values: number[]) => Math.max(...values) - Math.min(...values) <= 4
    return fits(ranks) || (ranks.includes(14) && fits(ranks.map((rank) => rank === 14 ? 1 : rank)))
}

const ROYAL_RANKS = [10, 11, 12, 13, 14]

// Shared shape of every game without wild cards. Returns the broad type, and the quad rank and kicker.
const readHand = (cards: PokerCard[]) => {
    const counts = countRanks(cards)
    const sizes = Array.from(counts.values()).sort((a, b) => b - a)
    const ranks = cards.map(rankOf)
    const flush = isFlush(cards)
    const straight = counts.size === 5 && fitsStraight(ranks)
    const royal = flush && straight && ROYAL_RANKS.every((rank) => ranks.includes(rank))
    const quadRank = sizes[0] === 4 ? Array.from(counts).find(([, n]) => n === 4)![0] : undefined
    const kicker = quadRank ? Array.from(counts).find(([, n]) => n === 1)![0] : undefined
    const highPair = sizes[0] === 2 && sizes[1] === 1
        && Array.from(counts).some(([rank, n]) => n === 2 && rank >= 11)
    return { sizes, flush, straight, royal, quadRank, kicker, highPair }
}

// Everything below four of a kind is the same across the non-wild games.
const evaluateLow = ({ sizes, flush, straight, highPair }: ReturnType<typeof readHand>) => {
    if (sizes[0] === 3 && sizes[1] === 2) return "full-house"
    if (flush) return "flush"
    if (straight) return "straight"
    if (sizes[0] === 3) return "trips"
    if (sizes[0] === 2 && sizes[1] === 2) return "two-pair"
    if (highPair) return "jacks"
    return null
}

const evaluateJacks = (cards: PokerCard[]) => {
    const read = readHand(cards)
    if (read.royal) return "royal"
    if (read.flush && read.straight) return "straight-flush"
    if (read.quadRank) return "four"
    return evaluateLow(read)
}

const LOW_QUADS = [2, 3, 4]

const evaluateBonus = (fiveToKing: boolean) => (cards: PokerCard[]) => {
    const read = readHand(cards)
    if (read.royal) return "royal"
    if (read.flush && read.straight) return "straight-flush"
    if (read.quadRank === 14) return "four-aces"
    if (read.quadRank && LOW_QUADS.includes(read.quadRank)) return "four-2-4"
    if (read.quadRank) return fiveToKing || read.quadRank <= 10 ? "four-5-k" : "four-j-k"
    return evaluateLow(read)
}

const evaluateDoubleDouble = (cards: PokerCard[]) => {
    const read = readHand(cards)
    if (read.royal) return "royal"
    if (read.flush && read.straight) return "straight-flush"
    const { quadRank, kicker } = read
    if (quadRank === 14) return LOW_QUADS.includes(kicker!) ? "four-aces-kicker" : "four-aces"
    if (quadRank && LOW_QUADS.includes(quadRank)) return kicker === 14 || LOW_QUADS.includes(kicker!) ? "four-2-4-kicker" : "four-2-4"
    if (quadRank) return "four-5-k"
    return evaluateLow(read)
}

const evaluateDeuces = (cards: PokerCard[]) => {
    const others = cards.filter((card) => card.value !== PokerValue.Two)
    const deuces = cards.length - others.length
    if (deuces === 4) return "four-deuces"

    const ranks = others.map(rankOf)
    const counts = Array.from(countRanks(others).values()).sort((a, b) => b - a)
    const most = counts[0] + deuces
    const flush = isFlush(others)
    const straight = fitsStraight(ranks)
    const royal = flush && straight && ranks.every((rank) => ROYAL_RANKS.includes(rank))

    if (royal) return deuces === 0 ? "natural-royal" : "wild-royal"
    if (most === 5) return "five"
    if (flush && straight) return "straight-flush"
    if (most === 4) return "four"
    // Either a natural full house, or two pair plus one deuce.
    if (counts[0] + counts[1] + deuces === 5 && counts.length === 2) return "full-house"
    if (flush) return "flush"
    if (straight) return "straight"
    if (most === 3) return "trips"
    return null
}

const LOW_HANDS: Category[] = [
    { id: "two-pair", name: "Two pair", pays: 2 },
    { id: "jacks", name: "Jacks or better", pays: 1 },
]

export const variants: Variant[] = [
    {
        id: "ultimate-x",
        name: "Ultimate X",
        summary: "Ten hands. Every win sets the multiplier for the next hand on its own line.",
        payTable: "Bonus 7/5, 10-play",
        mode: "ultimate",
        hands: 10,
        coinsPerHand: 10,
        coinsPaidOn: 5,
        evaluate: evaluateBonus(true),
        publishedReturn: 0.994034,
        sourcePath: "ultimate-x/",
        categories: [
            { id: "royal", name: "Royal flush", pays: 800, earns: 4 },
            { id: "four-aces", name: "Four aces", pays: 80, earns: 4 },
            { id: "straight-flush", name: "Straight flush", pays: 50, earns: 4 },
            { id: "four-2-4", name: "Four 2-4", pays: 40, earns: 4 },
            { id: "four-5-k", name: "Four 5-K", pays: 25, earns: 3 },
            { id: "full-house", name: "Full house", pays: 7, earns: 12 },
            { id: "flush", name: "Flush", pays: 5, earns: 11 },
            { id: "straight", name: "Straight", pays: 4, earns: 8 },
            { id: "trips", name: "Three of a kind", pays: 3, earns: 4 },
            { id: "two-pair", name: "Two pair", pays: 2, earns: 3 },
            { id: "jacks", name: "Jacks or better", pays: 1, earns: 2 },
        ],
    },
    {
        id: "ultimate-x-gold",
        name: "Ultimate X Gold",
        summary: "Five hands. Dealt wins raise multipliers on hand types, which wait until you hit that hand.",
        payTable: "Bonus 7/5, 5-play",
        mode: "gold",
        hands: 5,
        coinsPerHand: 10,
        coinsPaidOn: 5,
        evaluate: evaluateBonus(false),
        publishedReturn: 0.984079,
        sourcePath: "ultimate-x-gold/",
        categories: [
            { id: "royal", name: "Royal flush", pays: 800 },
            { id: "four-aces", name: "Four aces", pays: 80, progression: [1, 4, 9] },
            { id: "straight-flush", name: "Straight flush", pays: 50 },
            { id: "four-2-4", name: "Four 2-4", pays: 40, progression: [1, 4, 9], upgrades: ["four-aces"] },
            { id: "four-j-k", name: "Four J-K", pays: 25, progression: [3, 4, 9], upgrades: ["four-2-4", "four-aces"] },
            { id: "four-5-k", name: "Four 5-10", pays: 25, progression: [1, 4, 9], upgrades: ["four-j-k", "four-2-4", "four-aces"] },
            { id: "full-house", name: "Full house", pays: 7, progression: [1, 3, 4, 6, 7, 9, 10], upgrades: ["four-5-k", "four-j-k", "four-2-4"] },
            { id: "flush", name: "Flush", pays: 5, progression: [1, 3, 4, 6, 7, 8], upgrades: ["full-house", "four-5-k", "four-j-k"] },
            { id: "straight", name: "Straight", pays: 4, progression: [1, 3, 4, 5, 7], upgrades: ["flush", "full-house", "four-5-k"] },
            { id: "trips", name: "Three of a kind", pays: 3, progression: [1, 3, 4, 5], upgrades: ["straight", "flush", "full-house"] },
            { id: "two-pair", name: "Two pair", pays: 2, upgrades: ["trips", "straight", "flush"] },
            { id: "jacks", name: "Jacks or better", pays: 1, upgrades: ["trips"] },
        ],
    },
    {
        id: "jacks-or-better",
        name: "Jacks or Better",
        summary: "One hand and the classic full-pay table. Every other game here is measured against it.",
        payTable: "9/6",
        mode: "plain",
        hands: 1,
        coinsPerHand: 5,
        coinsPaidOn: 5,
        evaluate: evaluateJacks,
        publishedReturn: 0.99543904,
        sourcePath: "jacks-or-better/",
        categories: [
            { id: "royal", name: "Royal flush", pays: 800 },
            { id: "straight-flush", name: "Straight flush", pays: 50 },
            { id: "four", name: "Four of a kind", pays: 25 },
            { id: "full-house", name: "Full house", pays: 9 },
            { id: "flush", name: "Flush", pays: 6 },
            { id: "straight", name: "Straight", pays: 4 },
            { id: "trips", name: "Three of a kind", pays: 3 },
            ...LOW_HANDS,
        ],
    },
    {
        id: "double-double-bonus",
        name: "Double Double Bonus",
        summary: "One hand. Four of a kind pays far more with the right kicker, and two pair pays only even money.",
        payTable: "9/6",
        mode: "plain",
        hands: 1,
        coinsPerHand: 5,
        coinsPaidOn: 5,
        evaluate: evaluateDoubleDouble,
        publishedReturn: 0.989808,
        sourcePath: "double-double-bonus/",
        categories: [
            { id: "royal", name: "Royal flush", pays: 800 },
            { id: "four-aces-kicker", name: "Four aces + 2-4", pays: 400 },
            { id: "four-2-4-kicker", name: "Four 2-4 + A-4", pays: 160 },
            { id: "four-aces", name: "Four aces + 5-K", pays: 160 },
            { id: "four-2-4", name: "Four 2-4 + 5-K", pays: 80 },
            { id: "straight-flush", name: "Straight flush", pays: 50 },
            { id: "four-5-k", name: "Four 5-K", pays: 50 },
            { id: "full-house", name: "Full house", pays: 9 },
            { id: "flush", name: "Flush", pays: 6 },
            { id: "straight", name: "Straight", pays: 4 },
            { id: "trips", name: "Three of a kind", pays: 3 },
            { id: "two-pair", name: "Two pair", pays: 1 },
            { id: "jacks", name: "Jacks or better", pays: 1 },
        ],
    },
    {
        id: "deuces-wild",
        name: "Deuces Wild",
        summary: "One hand with four wild cards. The full-pay table returns more than you bet with perfect play.",
        payTable: "Full pay",
        mode: "plain",
        hands: 1,
        coinsPerHand: 5,
        coinsPaidOn: 5,
        evaluate: evaluateDeuces,
        publishedReturn: 1.00762,
        sourcePath: "deuces-wild/",
        categories: [
            { id: "natural-royal", name: "Natural royal", pays: 800 },
            { id: "four-deuces", name: "Four deuces", pays: 200 },
            { id: "wild-royal", name: "Wild royal", pays: 25 },
            { id: "five", name: "Five of a kind", pays: 15 },
            { id: "straight-flush", name: "Straight flush", pays: 9 },
            { id: "four", name: "Four of a kind", pays: 5 },
            { id: "full-house", name: "Full house", pays: 3 },
            { id: "flush", name: "Flush", pays: 2 },
            { id: "straight", name: "Straight", pays: 2 },
            { id: "trips", name: "Three of a kind", pays: 1 },
        ],
    },
]

export const getVariant = (id: VariantId) => variants.find((variant) => variant.id === id)!

export const COIN = 1
export const STARTING_BALANCE = 5000
const BLANK_HAND: Hand = [undefined, undefined, undefined, undefined, undefined]
const NO_HOLDS: Holds = [false, false, false, false, false]

export const getBet = (variant: Variant) => variant.coinsPerHand * variant.hands * COIN
const categoryOf = (variant: Variant, id: string) => variant.categories.find((category) => category.id === id)!
export const getBasePay = (variant: Variant, id: string) => categoryOf(variant, id).pays * variant.coinsPaidOn * COIN

export type Game = {
    // idle: nothing dealt yet. holding: choosing holds. settled: the draw is done and paid.
    phase: "idle" | "holding" | "settled"
    deck: PokerCard[]
    hand: Hand
    // Line 0 is the main hand, as dealt while holding and as drawn once settled.
    holds: Holds
    dealtResult: string | null
    // Only filled once settled. While holding, every other hand is just the held cards.
    otherHands: Hand[]
    results: (string | null)[]
    lineWins: number[]
    // Ultimate X: what each line's win is multiplied by this round.
    lineMultipliers: number[]
    // Ultimate X: what each line earned for the next round. These replace the current ones.
    nextLineMultipliers: number[]
    // Gold: the position of each hand in its progression.
    goldSteps: Record<string, number>
    // Gold: the hands the dealt hand just raised.
    upgraded: string[]
    balance: number
    won: number
}

const startingSteps = (variant: Variant) =>
    Object.fromEntries(variant.categories.filter((c) => c.progression).map((c) => [c.id, 0]))

// Deterministic, so the server and browser render the same board before the first deal.
export const newGame = (variant: Variant): Game => ({
    phase: "idle",
    deck: PokerDeckUnshuffled,
    hand: BLANK_HAND,
    holds: NO_HOLDS,
    dealtResult: null,
    otherHands: [],
    results: [],
    lineWins: [],
    lineMultipliers: new Array(variant.hands).fill(1),
    nextLineMultipliers: new Array(variant.hands).fill(1),
    goldSteps: startingSteps(variant),
    upgraded: [],
    balance: STARTING_BALANCE,
    won: 0,
})

export const getGoldMultiplier = (variant: Variant, game: Game, id: string) => {
    const { progression } = categoryOf(variant, id)
    return progression ? progression[game.goldSteps[id]] : 1
}

// The multiplier a win of this type on this line is paid at right now.
export const getMultiplier = (variant: Variant, game: Game, id: string, line: number) => {
    if (variant.mode === "ultimate") return game.lineMultipliers[line]
    if (variant.mode === "gold") return getGoldMultiplier(variant, game, id)
    return 1
}

export const getOtherHands = (variant: Variant, game: Game): Hand[] => {
    if (game.phase === "settled") return game.otherHands
    const held = game.hand.map((card, i) => game.holds[i] ? card : undefined)
    return new Array(variant.hands - 1).fill(held)
}

// Charges the bet and deals.
export const deal = (variant: Variant, game: Game): Game => {
    const deck = getShuffledDeck(game.deck)
    const hand = getHandFromDeck(deck)
    const dealtResult = variant.evaluate(hand as PokerCard[])

    const goldSteps = { ...game.goldSteps }
    let upgraded: string[] = []
    if (variant.mode === "gold") {
        // A multiplier that was just used drops back to the start of its progression.
        for (const result of game.results) if (result && result in goldSteps) goldSteps[result] = 0
        upgraded = (dealtResult && categoryOf(variant, dealtResult).upgrades || []).filter((id) => {
            const top = categoryOf(variant, id).progression!.length - 1
            if (goldSteps[id] >= top) return false
            goldSteps[id] += 1
            return true
        })
    }

    return {
        ...game,
        phase: "holding",
        deck,
        hand,
        dealtResult,
        holds: NO_HOLDS,
        otherHands: [],
        results: [],
        lineWins: [],
        lineMultipliers: game.nextLineMultipliers,
        goldSteps,
        upgraded,
        balance: game.balance - getBet(variant),
        won: 0,
    }
}

// Each hand draws on its own from the 47 cards left after the deal, as in multi-hand video poker.
const fillHand = (held: Hand, remaining: PokerCard[]): Hand => {
    const drawn = getCardsFromDeck(held.filter((card) => !card).length, remaining)
    let next = 0
    return held.map((card) => card ?? drawn[next++])
}

// Draws every hand and pays the wins.
export const draw = (variant: Variant, game: Game): Game => {
    const remaining = game.deck.slice(5)
    const held = game.hand.map((card, i) => game.holds[i] ? card : undefined)
    const hand = fillHand(held, remaining)
    const otherHands = new Array(variant.hands - 1).fill(null).map(() => fillHand(held, remaining))
    const results = [hand, ...otherHands].map((cards) => variant.evaluate(cards as PokerCard[]))
    const lineWins = results.map((result, line) =>
        result ? getBasePay(variant, result) * getMultiplier(variant, game, result, line) : 0)
    const won = lineWins.reduce((sum, win) => sum + win, 0)

    return {
        ...game,
        phase: "settled",
        hand,
        otherHands,
        results,
        lineWins,
        nextLineMultipliers: variant.mode === "ultimate"
            ? results.map((result) => result ? categoryOf(variant, result).earns ?? 1 : 1)
            : game.nextLineMultipliers,
        balance: game.balance + won,
        won,
    }
}

// The order hands settle in on screen: the main hand, then the others from the bottom row up, each row
// left to right. The others are laid out in a grid, and how many columns it has depends on the screen.
export const settleOrder = (variant: Variant, columns: number) => {
    const others = variant.hands - 1
    const rows: number[][] = []
    for (let line = 1; line <= others; line += columns) {
        rows.unshift(Array.from({ length: Math.min(columns, others - line + 1) }, (_, i) => line + i))
    }
    return [0, ...rows.flat()]
}

// The theme color for a kind of hand, the same in every game. Hands of one family share a color, so four
// of a kind stays one color however a game splits it up.
export const handColor = (id: string) => {
    if (id.includes("royal")) return "bone"
    if (id === "straight-flush" || id === "five" || id === "four-deuces") return "acid"
    if (id.startsWith("four")) return "yellow"
    return ({ "full-house": "orange", flush: "red", straight: "pink", trips: "lilac", "two-pair": "blue", jacks: "cyan" } as Record<string, string>)[id]
}

// The game as it looks partway through settling, with only some hands finished. The draw itself is
// already decided, so this only changes what is on screen. Waiting hands show just the held cards.
export const partlySettled = (variant: Variant, game: Game, shown: number, columns: number): Game => {
    if (game.phase !== "settled" || shown >= variant.hands) return game
    const done = settleOrder(variant, columns).slice(0, shown)
    const held = game.hand.map((card, i) => game.holds[i] ? card : undefined)
    const won = done.reduce((sum, line) => sum + game.lineWins[line], 0)
    return {
        ...game,
        otherHands: game.otherHands.map((hand, i) => done.includes(i + 1) ? hand : held),
        results: game.results.map((result, line) => done.includes(line) ? result : null),
        lineWins: game.lineWins.map((win, line) => done.includes(line) ? win : 0),
        balance: game.balance - game.won + won,
        won,
    }
}

export const toggleHold = (game: Game, index: number): Game => {
    if (game.phase !== "holding") return game
    const holds = [...game.holds] as Holds
    holds[index] = !holds[index]
    return { ...game, holds }
}
