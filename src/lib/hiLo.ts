import { PokerCard, PokerValue, getShuffledShoe } from "./pokerUtils";

export type Tag = -1 | 0 | 1

const LOW = [PokerValue.Two, PokerValue.Three, PokerValue.Four, PokerValue.Five, PokerValue.Six]
const NEUTRAL = [PokerValue.Seven, PokerValue.Eight, PokerValue.Nine]

// Low cards leaving the shoe are good for the player, so they count up. High cards count down.
export const tagOf = (card: PokerCard): Tag => LOW.includes(card.value) ? 1 : NEUTRAL.includes(card.value) ? 0 : -1

export const formatTag = (value: number) => value > 0 ? `+${value}` : value < 0 ? `−${-value}` : "0"

export const countCards = (cards: PokerCard[]) => cards.reduce((sum, card) => sum + tagOf(card), 0)

export const newShoe = (decks: number) => getShuffledShoe(decks)

// A true count is the running count per deck left, always rounded down: 1.75 is 1, and -1.5 is -2.
export const getTrueCount = (running: number, decksLeft: number) => Math.floor(running / decksLeft)

export const newTrueCountQuestion = () => ({
    running: Math.floor(Math.random() * 41) - 20,
    // Half decks from 0.5 to 6, as you would judge them from the discard tray.
    decksLeft: (Math.floor(Math.random() * 12) + 1) / 2,
})
