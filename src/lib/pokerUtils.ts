export enum PokerSuit {
    Heart = "Heart",
    Spade = "Spade",
    Diamond = "Diamond",
    Club = "Club"
}
  
export enum PokerValue {
    Two = "2",
    Three = "3",
    Four = "4",
    Five = "5",
    Six = "6",
    Seven = "7",
    Eight = "8",
    Nine = "9",
    Ten = "T",
    Jack = "J",
    Queen = "Q",
    King = "K",
    Ace = "A"
}
  
export enum PokerHand {
    HighCard = "High Card",
    Pair = "One Pair",
    JacksOrBetter = "Jacks or Better",
    TwoPair = "Two Pair",
    ThreeOfAKind = "Three of a Kind",
    Straight = "Straight",
    Flush = "Flush",
    FullHouse = "Full House",
    Quads = "Quads",
    QuadsTwosThreesFours = "Quads (2s, 3s, 4s)",
    QuadsFiveToTen = "Quads (5-10)",
    QuadsJackQueenKing = "Quads (Js, Qs, Ks)",
    QuadAces = "Quad Aces",
    StraightFlush = "Straight Flush",
    RoyalFlush = "Royal Flush"
}
  
export const PokerValueRanks: Record<PokerValue, number> = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "T": 10,
    "J": 11,
    "Q": 12,
    "K": 13,
    "A": 14
}

export const PokerSuitColors: Record<PokerSuit, string> = {
    "Heart": 'bg-red-400',
    "Club": 'bg-fuchsia-400',
    "Diamond": 'bg-sky-400',
    "Spade": 'bg-emerald-400'
}

export type PokerCard = {
    suit: PokerSuit,
    value: PokerValue
}

export const PokerDeckUnshuffled: PokerCard[] = [
    {
        suit: PokerSuit.Spade,
        value: PokerValue.Ace
    },
    {
        suit: PokerSuit.Spade,
        value: PokerValue.Two
    },
    {
        suit: PokerSuit.Spade,
        value: PokerValue.Three
    },
    {
        suit: PokerSuit.Spade,
        value: PokerValue.Four
    },
    {
        suit: PokerSuit.Spade,
        value: PokerValue.Five
    },
    {
        suit: PokerSuit.Spade,
        value: PokerValue.Six
    },
    {
        suit: PokerSuit.Spade,
        value: PokerValue.Seven
    },
    {
        suit: PokerSuit.Spade,
        value: PokerValue.Eight
    },
    {
        suit: PokerSuit.Spade,
        value: PokerValue.Nine
    },
    {
        suit: PokerSuit.Spade,
        value: PokerValue.Ten
    },
    {
        suit: PokerSuit.Spade,
        value: PokerValue.Jack
    },
    {
        suit: PokerSuit.Spade,
        value: PokerValue.Queen
    },
    {
        suit: PokerSuit.Spade,
        value: PokerValue.King
    },
    {
        suit: PokerSuit.Club,
        value: PokerValue.Ace
    },
    {
        suit: PokerSuit.Club,
        value: PokerValue.Two
    },
    {
        suit: PokerSuit.Club,
        value: PokerValue.Three
    },
    {
        suit: PokerSuit.Club,
        value: PokerValue.Four
    },
    {
        suit: PokerSuit.Club,
        value: PokerValue.Five
    },
    {
        suit: PokerSuit.Club,
        value: PokerValue.Six
    },
    {
        suit: PokerSuit.Club,
        value: PokerValue.Seven
    },
    {
        suit: PokerSuit.Club,
        value: PokerValue.Eight
    },
    {
        suit: PokerSuit.Club,
        value: PokerValue.Nine
    },
    {
        suit: PokerSuit.Club,
        value: PokerValue.Ten
    },
    {
        suit: PokerSuit.Club,
        value: PokerValue.Jack
    },
    {
        suit: PokerSuit.Club,
        value: PokerValue.Queen
    },
    {
        suit: PokerSuit.Club,
        value: PokerValue.King
    },
    {
        suit: PokerSuit.Heart,
        value: PokerValue.Ace
    },
    {
        suit: PokerSuit.Heart,
        value: PokerValue.Two
    },
    {
        suit: PokerSuit.Heart,
        value: PokerValue.Three
    },
    {
        suit: PokerSuit.Heart,
        value: PokerValue.Four
    },
    {
        suit: PokerSuit.Heart,
        value: PokerValue.Five
    },
    {
        suit: PokerSuit.Heart,
        value: PokerValue.Six
    },
    {
        suit: PokerSuit.Heart,
        value: PokerValue.Seven
    },
    {
        suit: PokerSuit.Heart,
        value: PokerValue.Eight
    },
    {
        suit: PokerSuit.Heart,
        value: PokerValue.Nine
    },
    {
        suit: PokerSuit.Heart,
        value: PokerValue.Ten
    },
    {
        suit: PokerSuit.Heart,
        value: PokerValue.Jack
    },
    {
        suit: PokerSuit.Heart,
        value: PokerValue.Queen
    },
    {
        suit: PokerSuit.Heart,
        value: PokerValue.King
    },
    {
        suit: PokerSuit.Diamond,
        value: PokerValue.Ace
    },
    {
        suit: PokerSuit.Diamond,
        value: PokerValue.Two
    },
    {
        suit: PokerSuit.Diamond,
        value: PokerValue.Three
    },
    {
        suit: PokerSuit.Diamond,
        value: PokerValue.Four
    },
    {
        suit: PokerSuit.Diamond,
        value: PokerValue.Five
    },
    {
        suit: PokerSuit.Diamond,
        value: PokerValue.Six
    },
    {
        suit: PokerSuit.Diamond,
        value: PokerValue.Seven
    },
    {
        suit: PokerSuit.Diamond,
        value: PokerValue.Eight
    },
    {
        suit: PokerSuit.Diamond,
        value: PokerValue.Nine
    },
    {
        suit: PokerSuit.Diamond,
        value: PokerValue.Ten
    },
    {
        suit: PokerSuit.Diamond,
        value: PokerValue.Jack
    },
    {
        suit: PokerSuit.Diamond,
        value: PokerValue.Queen
    },
    {
        suit: PokerSuit.Diamond,
        value: PokerValue.King
    }
]

export function getShuffledDeck(deck: PokerCard[]) {
    const copy = [...deck]
    for (let i = deck.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * i + 1);
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy
}

export type Hand = (PokerCard | undefined)[]

export function getRankCounts (hand: Hand) : Record<PokerValue, number> {
    const cards: Record<PokerValue, number> = {
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0,
        "T": 0,
        "J": 0,
        "Q": 0,
        "K": 0,
        "A": 0
    }
    hand.map(card => {
        if (card) {
            cards[card.value] = cards[card.value] + 1 
        }
    })
    return cards;
}

export function getHandFromDeck(deck: PokerCard[]) : Hand {
    if (deck.length < 5) throw Error('Cant make a hand with that few cards');
    const hand: Hand = deck.slice(0,5);
    return hand;
}

export function getCardsFromDeck(numCards: number, deck: PokerCard[]): Hand {
    if (deck.length < numCards) throw Error('Cant draw that amount of cards');
    const indices = new Set<PokerCard>()
    while (indices.size < numCards) {
        const newIndex = Math.floor(Math.random() * deck.length)
        indices.add(deck[newIndex]);
    }
    return Array.from(indices)
}

export function evaluateHandForUltimateX(hand: Hand): PokerHand {
    if (hand.some(card => card === undefined)) return PokerHand.HighCard;

    const isFlush = (hand: PokerCard[]) => {
        return hand.every(card => card.suit === hand[0].suit)
    }

    const isStraight = (hand: PokerCard[]) => {
        const copy = [...hand]
        const sortedVals = copy.sort((a, b) => (PokerValueRanks[a.value]) - (PokerValueRanks[b.value]))
        for (let i = 1; i < sortedVals.length; i++) {
            if (PokerValueRanks[sortedVals[i].value] !== PokerValueRanks[sortedVals[i - 1].value] + 1) {
                return false;
            }
        }
        return true;
    }

    const isAto5 = (hand: PokerCard[]) => {
        const copy = [...hand]
        return copy.map(card => card.value).sort((a, b) => PokerValueRanks[a] - PokerValueRanks[b]).join("") === "2345A";
    }

    const isBroadway = (hand: PokerCard[]) => {
        const copy = [...hand]
        return copy.map(card => card.value).sort((a, b) => PokerValueRanks[a] - PokerValueRanks[b]).join("") === "TJQKA";
    }

    const rankCounts = getRankCounts(hand as PokerCard[]);
    const rankCountValues = Object.values(rankCounts);
    const flush = isFlush(hand as PokerCard[])
    const straight = isStraight(hand as PokerCard[]) || isAto5(hand as PokerCard[])
    const quads = rankCountValues.includes(4)
    const trips = rankCountValues.includes(3)
    const pair = rankCountValues.includes(2)
    

    if (flush && straight && isBroadway(hand as PokerCard[])) {
        return PokerHand.RoyalFlush
    }
    if (flush && straight) {
        return PokerHand.StraightFlush
    }
    if (quads && rankCounts['A'] > 1) {
        return PokerHand.QuadAces
    }
    if (quads && (rankCounts['K'] > 1 || rankCounts['Q'] > 1 || rankCounts['J'] > 1)) {
        return PokerHand.QuadsJackQueenKing
    }
    if (quads && (rankCounts['2'] > 1 || rankCounts['3'] > 1 || rankCounts['4'] > 1)) {
        return PokerHand.QuadsTwosThreesFours
    }
    if (quads) {
        return PokerHand.QuadsFiveToTen
    }
    if (trips && pair) {
        return PokerHand.FullHouse
    }
    if (flush) {
        return PokerHand.Flush
    }
    if (straight) {
        return PokerHand.Straight
    }
    if (trips) {
        return PokerHand.ThreeOfAKind
    }
    if (rankCountValues.filter(count => count === 2).length === 2) {
        return PokerHand.TwoPair;
    }
    if (pair && (rankCounts['A'] > 1 || rankCounts['K'] > 1 || rankCounts['Q'] > 1 || rankCounts['J'] > 1)) {
        return PokerHand.JacksOrBetter
    }
    if (pair) {
        return PokerHand.Pair
    }
    return PokerHand.HighCard
}

export function getFilledHandFromDeck(hand: Hand, remainingCards: PokerCard[]) : Hand {
    const numToDraw = hand.reduce((acc, c) => c ? acc : acc + 1, 0)
    const drawnCards = getCardsFromDeck(numToDraw, remainingCards)
    return hand.map((card, i) => card === undefined ? drawnCards[i] : card)
}


  