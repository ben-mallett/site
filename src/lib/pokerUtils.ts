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
  
export const BlackjackValueRanks: Record<PokerValue, number> = {
    "A": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "T": 10,
    "J": 10,
    "Q": 10,
    "K": 10
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

export function getShuffledShoe(numDecks: number) {
    const shoe: PokerCard[] = [];

    for (let i = 0; i < numDecks; i++) {
        shoe.push(...PokerDeckUnshuffled);
    }

    return getShuffledDeck(shoe);
}

export function getShuffledDeck(deck: PokerCard[]) {
    const copy = [...deck]
    for (let i = deck.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy
}

export type Hand = (PokerCard | undefined)[]

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

export type Holds = [boolean, boolean, boolean, boolean, boolean];
