import { BlackjackValueRanks, PokerCard, PokerValue, getShuffledShoe } from "./pokerUtils";
import { tagOf } from "./hiLo";

export type Rules = {
    // The dealer hits a soft 17 (H17) or stands on it (S17).
    dealerHitsSoft17: boolean
    doubleAfterSplit: boolean
    resplitAces: boolean
    // What a blackjack pays per unit bet: 1.5 for 3:2, or 1.2 for 6:5.
    blackjackPays: number
    decks: number
}

// The game the card counting article simulates.
export const DEFAULT_RULES: Rules = { dealerHitsSoft17: true, doubleAfterSplit: true, resplitAces: false, blackjackPays: 1.5, decks: 6 }

const PENETRATION = 0.75
const MAX_HANDS_PER_SPOT = 4

export const STARTING_BANKROLL = 1000
export const MIN_BET = 5
export const MAX_BET = 500
export const BET_STEP = 5
export const MAX_SPOTS = 5
const DEFAULT_BET = 10

export type HandResult = "blackjack" | "win" | "push" | "lose" | "bust"

export type PlayerHand = {
    // Which spot on the table this hand belongs to. Split hands stay on their spot.
    spot: number
    cards: PokerCard[]
    bet: number
    fromSplit: boolean
    fromAces: boolean
    done: boolean
    result?: HandResult
    // What the hand returned to the bankroll, including its own bet.
    returned: number
}

export type Table = {
    rules: Rules
    shoe: PokerCard[]
    next: number
    // Only counts cards a player at the table has seen, so the hole card waits until it is turned over.
    running: number
    bankroll: number
    // The bet on each spot. Spots not in play keep theirs for when they come back.
    bets: number[]
    spots: number
    phase: "betting" | "insurance" | "playing" | "settled"
    hands: PlayerHand[]
    active: number
    dealer: PokerCard[]
    holeHidden: boolean
    insurance: number
    insuranceReturned: number
    shuffled: boolean
    // The change to the bankroll from the last finished round.
    lastNet: number
    rounds: number
    wins: number
    // Counts deals, and the player's decisions since the deal. The screen uses these to time its card animation.
    dealId: number
    decisions: number
}

export const handTotal = (cards: PokerCard[]) => {
    const hard = cards.reduce((sum, card) => sum + BlackjackValueRanks[card.value], 0)
    const soft = cards.some((card) => card.value === PokerValue.Ace) && hard + 10 <= 21
    return { total: soft ? hard + 10 : hard, soft }
}

const isBlackjack = (cards: PokerCard[]) => cards.length === 2 && handTotal(cards).total === 21
const isNatural = (hand: PlayerHand) => isBlackjack(hand.cards) && !hand.fromSplit

// The shoe can be passed in, which is how the tests stack the deck.
export const newTable = (rules: Rules = DEFAULT_RULES, shoe: PokerCard[] = getShuffledShoe(rules.decks)): Table => ({
    rules,
    shoe,
    next: 0,
    running: 0,
    bankroll: STARTING_BANKROLL,
    bets: new Array(MAX_SPOTS).fill(DEFAULT_BET),
    spots: 1,
    phase: "betting",
    hands: [],
    active: 0,
    dealer: [],
    holeHidden: false,
    insurance: 0,
    insuranceReturned: 0,
    shuffled: false,
    lastNet: 0,
    rounds: 0,
    wins: 0,
    dealId: 0,
    decisions: 0,
})

const copy = (table: Table): Table => ({ ...table, bets: [...table.bets], hands: table.hands.map((hand) => ({ ...hand, cards: [...hand.cards] })), dealer: [...table.dealer] })

const reshuffle = (table: Table) => {
    table.shoe = getShuffledShoe(table.rules.decks)
    table.next = 0
    table.running = 0
    table.shuffled = true
}

const draw = (table: Table, seen = true) => {
    // A small shoe or many split hands can outlast the cut card's margin, so a dry shoe is reshuffled on the spot.
    if (table.next >= table.shoe.length) reshuffle(table)
    const card = table.shoe[table.next++]
    if (seen) table.running += tagOf(card)
    return card
}

const revealHole = (table: Table) => {
    if (!table.holeHidden) return
    table.holeHidden = false
    table.running += tagOf(table.dealer[1])
}

const settle = (table: Table) => {
    revealHole(table)
    // The dealer only draws if some hand still needs beating. A natural is paid without one.
    const live = table.hands.some((hand) => handTotal(hand.cards).total <= 21 && !isNatural(hand))
    if (live && !isBlackjack(table.dealer)) {
        while (true) {
            const { total, soft } = handTotal(table.dealer)
            if (total > 17 || (total === 17 && (!soft || !table.rules.dealerHitsSoft17))) break
            table.dealer.push(draw(table))
        }
    }

    const dealer = handTotal(table.dealer).total
    const dealerNatural = isBlackjack(table.dealer)
    let returned = 0, wagered = table.insurance, wins = 0
    for (const hand of table.hands) {
        const { total } = handTotal(hand.cards)
        const natural = isNatural(hand)
        wagered += hand.bet
        if (total > 21) { hand.result = "bust"; hand.returned = 0 }
        else if (natural && dealerNatural) { hand.result = "push"; hand.returned = hand.bet }
        else if (natural) { hand.result = "blackjack"; hand.returned = hand.bet * (1 + table.rules.blackjackPays) }
        else if (dealerNatural) { hand.result = "lose"; hand.returned = 0 }
        else if (dealer > 21 || total > dealer) { hand.result = "win"; hand.returned = hand.bet * 2 }
        else if (total === dealer) { hand.result = "push"; hand.returned = hand.bet }
        else { hand.result = "lose"; hand.returned = 0 }
        hand.done = true
        returned += hand.returned
        if (hand.result === "win" || hand.result === "blackjack") wins++
    }

    table.insuranceReturned = table.insurance && dealerNatural ? table.insurance * 3 : 0
    returned += table.insuranceReturned
    table.bankroll += returned
    table.lastNet = returned - wagered
    table.wins += wins
    table.rounds += 1
    table.phase = "settled"
    return table
}

const isPair = (hand: PlayerHand) => hand.cards.length === 2 && BlackjackValueRanks[hand.cards[0].value] === BlackjackValueRanks[hand.cards[1].value]

const hasRoomToSplit = (table: Table, hand: PlayerHand) =>
    table.hands.filter((other) => other.spot === hand.spot).length < MAX_HANDS_PER_SPOT && table.bankroll >= hand.bet

// Split aces get one card each, and can only act again by splitting another ace, if the rules allow it.
const canResplitAces = (table: Table, hand: PlayerHand) =>
    table.rules.resplitAces && hand.cards[1].value === PokerValue.Ace && hasRoomToSplit(table, hand)

// Moves to the next hand still to play, or to the dealer. A hand on 21 or more has nothing left to decide.
const advance = (table: Table) => {
    for (let i = table.active; i < table.hands.length; i++) {
        const hand = table.hands[i]
        if (!hand.done && (handTotal(hand.cards).total >= 21 || (hand.fromAces && !canResplitAces(table, hand)))) hand.done = true
        if (!hand.done) {
            table.active = i
            table.phase = "playing"
            return table
        }
    }
    return settle(table)
}

// The dealer checks under a ten or ace, and a dealer blackjack ends the round for every spot.
const peek = (table: Table) => isBlackjack(table.dealer) ? settle(table) : advance(table)

const isBetweenHands = (table: Table) => table.phase === "betting" || table.phase === "settled"

export const canDeal = (table: Table) => isBetweenHands(table) && table.bankroll >= MIN_BET * table.spots

// Bets on the spots in play, cut down from the last spot until they fit what is left.
const affordableBets = (table: Table) => {
    const bets = table.bets.slice(0, table.spots)
    let over = bets.reduce((sum, bet) => sum + bet, 0) - table.bankroll
    for (let spot = bets.length - 1; spot >= 0 && over > 0; spot--) {
        const cut = Math.min(bets[spot] - MIN_BET, Math.ceil(over / BET_STEP) * BET_STEP)
        bets[spot] -= cut
        over -= cut
    }
    return bets
}

export const setBet = (table: Table, spot: number, change: number): Table => {
    if (!isBetweenHands(table)) return table
    const others = table.bets.slice(0, table.spots).reduce((sum, bet, i) => i === spot ? sum : sum + bet, 0)
    const top = Math.min(MAX_BET, Math.max(MIN_BET, table.bankroll - others))
    const bets = [...table.bets]
    bets[spot] = Math.min(top, Math.max(MIN_BET, bets[spot] + change))
    return { ...table, bets }
}

// Copies one spot's bet to every spot, then fits the total to what is left.
export const matchBets = (table: Table, spot: number): Table => {
    if (!isBetweenHands(table)) return table
    return { ...table, bets: new Array(MAX_SPOTS).fill(table.bets[spot]) }
}

export const setSpots = (table: Table, change: number): Table => {
    if (!isBetweenHands(table)) return table
    return { ...table, spots: Math.min(MAX_SPOTS, Math.max(1, table.spots + change)) }
}

// Between hands only. A different shoe size needs a new shoe, and the other rules keep the one in play.
export const setRules = (table: Table, rules: Rules): Table => {
    if (!isBetweenHands(table)) return table
    const next = copy({ ...table, rules })
    if (rules.decks !== table.rules.decks) reshuffle(next)
    return next
}

export const deal = (current: Table): Table => {
    if (!canDeal(current)) return current
    const table = copy(current)
    table.shuffled = false
    const bets = affordableBets(table)
    table.bets.splice(0, bets.length, ...bets)
    if (table.next >= Math.floor(table.shoe.length * PENETRATION)) reshuffle(table)
    table.bankroll -= bets.reduce((sum, bet) => sum + bet, 0)
    table.insurance = 0
    table.insuranceReturned = 0
    table.lastNet = 0
    table.active = 0
    table.holeHidden = true
    table.dealId += 1
    table.decisions = 0
    // Around the table twice, starting from spot one, with the dealer last each time.
    const firsts = bets.map(() => draw(table))
    const up = draw(table)
    const seconds = bets.map(() => draw(table))
    const hole = draw(table, false)
    table.hands = firsts.map((first, spot) => ({ spot, cards: [first, seconds[spot]], bet: bets[spot], fromSplit: false, fromAces: false, done: false, returned: 0 }))
    table.dealer = [up, hole]
    if (up.value === PokerValue.Ace) {
        table.phase = "insurance"
        return table
    }
    return peek(table)
}

// Insurance is one decision for the whole table, at half the bet on every spot.
export const insuranceCost = (table: Table) => table.hands.reduce((sum, hand) => sum + hand.bet / 2, 0)
export const canInsure = (table: Table) => table.phase === "insurance" && table.bankroll >= insuranceCost(table)

export const answerInsurance = (current: Table, take: boolean): Table => {
    if (current.phase !== "insurance" || (take && !canInsure(current))) return current
    const table = copy(current)
    table.decisions += 1
    if (take) {
        table.insurance = insuranceCost(table)
        table.bankroll -= table.insurance
    }
    return peek(table)
}

export const canHit = (table: Table) => table.phase === "playing" && !table.hands[table.active].fromAces

export const canDouble = (table: Table) => {
    if (table.phase !== "playing") return false
    const hand = table.hands[table.active]
    if (hand.fromSplit && !table.rules.doubleAfterSplit) return false
    return hand.cards.length === 2 && !hand.fromAces && table.bankroll >= hand.bet
}

export const canSplit = (table: Table) => {
    if (table.phase !== "playing") return false
    const hand = table.hands[table.active]
    if (hand.fromAces && !table.rules.resplitAces) return false
    return isPair(hand) && hasRoomToSplit(table, hand)
}

export const hit = (current: Table): Table => {
    if (!canHit(current)) return current
    const table = copy(current)
    table.decisions += 1
    table.hands[table.active].cards.push(draw(table))
    return advance(table)
}

export const stand = (current: Table): Table => {
    if (current.phase !== "playing") return current
    const table = copy(current)
    table.decisions += 1
    table.hands[table.active].done = true
    return advance(table)
}

export const double = (current: Table): Table => {
    if (!canDouble(current)) return current
    const table = copy(current)
    table.decisions += 1
    const hand = table.hands[table.active]
    table.bankroll -= hand.bet
    hand.bet *= 2
    hand.cards.push(draw(table))
    hand.done = true
    return advance(table)
}

export const split = (current: Table): Table => {
    if (!canSplit(current)) return current
    const table = copy(current)
    table.decisions += 1
    const hand = table.hands[table.active]
    const [a, b] = hand.cards
    const fromAces = a.value === PokerValue.Ace
    table.bankroll -= hand.bet
    const make = (card: PokerCard): PlayerHand => ({ spot: hand.spot, cards: [card, draw(table)], bet: hand.bet, fromSplit: true, fromAces, done: false, returned: 0 })
    table.hands.splice(table.active, 1, make(a), make(b))
    return advance(table)
}

// The count as a player can know it: the hole card is still unseen, so it counts as part of what is left.
export const decksLeft = (table: Table) => (table.shoe.length - table.next + (table.holeHidden ? 1 : 0)) / 52
export const trueCount = (table: Table) => Math.floor(table.running / decksLeft(table))
