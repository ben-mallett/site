"use client"

import { PokerCardComponent } from "@/components/PokerCardComponent";
import { PokerDeckUnshuffled, PokerCard, PokerHands, PokerValueRanks, PokerValue } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

function getShuffledDeck(deck: PokerCard[]) {
    const copy = [...deck]
    for (let i = deck.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * i + 1);
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy
}

function getHand(deck: PokerCard[]) : Hand {
    if (deck.length < 5) throw Error('Cant make a hand with that few cards');
    return deck.slice(0, 5) as Hand
}

function getCardsFromDeck(numCards: number, deck: PokerCard[]): Hand {
    if (deck.length < numCards) throw Error('Cant draw that amount of cards');
    return getShuffledDeck(deck).slice(0, numCards) as Hand;
}

const UltimateXHandPointValues: Record<PokerHands, number> = {
    "High Card": 0,
    "One Pair": 0,
    "Jacks or Better": 10,
    "Two Pair": 10,
    "Three of a Kind": 15,
    "Straight": 20,
    "Flush": 25,
    "Full House": 30,
    "Quads": 125,
    "Quads (2s, 3s, 4s)": 125,
    "Quads (5-10)": 125,
    "Quads (Js, Qs, Ks)": 125,
    "Quad Aces": 250,
    "Straight Flush": 1000,
    "Royal Flush": 8000
}

function evaluateHand(hand: Hand): PokerHands {
    if (hand.some(card => card === undefined)) return PokerHands.HighCard;
    const getRankCounts = (hand: PokerCard[]): Record<PokerValue, number> => {
        let cards: Record<PokerValue, number> = {
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
            cards[card.value] = cards[card.value] + 1 
        })
        return cards;
    }

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
        return copy.map(card => card.value).sort((a, b) => PokerValueRanks[a] - PokerValueRanks[b]).join("") === "234514";
    }

    const isBroadway = (hand: PokerCard[]) => {
        const copy = [...hand]
        return copy.map(card => card.value).sort((a, b) => PokerValueRanks[a] - PokerValueRanks[b]).join("") === "1011121314";
    }

    const rankCounts = getRankCounts(hand as PokerCard[]);
    const rankCountValues = Object.values(rankCounts);
    const flush = isFlush(hand as PokerCard[])
    const straight = isStraight(hand as PokerCard[]) || isAto5(hand as PokerCard[])
    const quads = rankCountValues.includes(4)
    const trips = rankCountValues.includes(3)
    const pair = rankCountValues.includes(2)

    if (flush && straight && isBroadway(hand as PokerCard[])) {
        return PokerHands.RoyalFlush
    }
    if (flush && straight) {
        return PokerHands.StraightFlush
    }
    if (quads && rankCounts['A'] > 1) {
        return PokerHands.QuadAces
    }
    if (quads && (rankCounts['K'] > 1 || rankCounts['Q'] > 1 || rankCounts['J'] > 1)) {
        return PokerHands.QuadsJackQueenKing
    }
    if (quads && (rankCounts['2'] > 1 || rankCounts['3'] > 1 || rankCounts['4'] > 1)) {
        return PokerHands.QuadsTwosThreesFours
    }
    if (quads) {
        return PokerHands.QuadsFiveToTen
    }
    if (trips && pair) {
        return PokerHands.FullHouse
    }
    if (flush) {
        return PokerHands.Flush
    }
    if (straight) {
        return PokerHands.Straight
    }
    if (trips) {
        return PokerHands.ThreeOfAKind
    }
    if (rankCountValues.filter(count => count === 2).length === 2) {
        return PokerHands.TwoPair;
    }
    if (pair && (rankCounts['A'] > 1 || rankCounts['K'] > 1 || rankCounts['Q'] > 1 || rankCounts['J'] > 1)) {
        return PokerHands.JacksOrBetter
    }
    if (pair) {
        return PokerHands.Pair
    }
    return PokerHands.HighCard
}

type Holds = [boolean, boolean, boolean, boolean, boolean];

type Hand = [
    PokerCard | undefined, 
    PokerCard | undefined, 
    PokerCard | undefined, 
    PokerCard | undefined, 
    PokerCard | undefined
]

interface UltimateXOutsideHandProps {
    hand: Hand,
    result: PokerHands | undefined
}

function UltimateXOutsideHand(props: UltimateXOutsideHandProps) {
    const { hand, result } = props;
    const resultVal = result ? UltimateXHandPointValues[result] : 0 
    const resultBgColor = resultVal >= 1000 
                            ? 'bg-rose-700' 
                            : resultVal >= 100 
                                ? 'bg-orange-300' 
                                : resultVal >= 20 
                                    ? 'bg-violet-500' 
                                    : 'bg-slate-200'
    return (
        <div className="flex gap-2 justify-center items-center">
            {
                result && (resultVal !== 0) &&  (
                    <div className={`border border-2 border-black px-4 py-1 rounded-sm fixed opacity-85 text-xl font-semibold ${resultBgColor}`}>
                        {result} | {UltimateXHandPointValues[result]}
                    </div>
                )
            }
            {
                hand.map((card) => (
                    card ? <PokerCardComponent card={card} size={'xs'}/> : <div className="w-20 h-32 border border-black border-2 bg-orange-300"/>
                ))
            }
        </div>
    )
}

export default function UltimateX() {
    const unshuffledDeck = PokerDeckUnshuffled; 
    const defaultHolds: Holds = [false, false, false, false, false]
    const defaultNumHands: number = 9;
    const defaultOutsideHand: Hand = [undefined, undefined, undefined, undefined, undefined]
    const [activeDeck, setActiveDeck] = useState<PokerCard[]>(getShuffledDeck(unshuffledDeck));
    const [activeHand, setActiveHand] = useState<Hand>(getHand(activeDeck));
    const [activeHolds, setActiveHolds] = useState<Holds>(defaultHolds)
    const [numOutsideHands, setNumOutsideHands] = useState<number>(defaultNumHands);
    const [outsideHands, setOutsideHands] = useState<Hand[]>(new Array(numOutsideHands).fill(defaultOutsideHand))
    const [activeHandResult, setActiveHandResult] = useState<PokerHands | undefined>(undefined)
    const [outsideHandsResults, setOutsideHandsResults] = useState<(PokerHands | undefined)[]>(new Array(numOutsideHands).fill(undefined))
    const [score, setScore] = useState<number>(1000)
    const [freezeInput, setFreezeInput] = useState<boolean>(false)

    const toggleHold = (i: number) => {
        if (i < 0 || i > 4) {
            throw Error('Bad index on hold');
        }
        setActiveHolds((prev) => {
            const copy: Holds = [...prev]
            copy[i] = !copy[i]
            return copy
        })
    }

    const dealFromNewDeck = () => {
        const newDeck = getShuffledDeck(activeDeck);
        setActiveDeck(newDeck);
        setActiveHand(getHand(newDeck));
        setActiveHolds(defaultHolds);
        setOutsideHands(new Array(numOutsideHands).fill(defaultOutsideHand));
        setScore((score) => (score - 25));
        setActiveHandResult(undefined);
        setOutsideHandsResults(new Array(numOutsideHands).fill(undefined));
        setFreezeInput(false);
    }

    const fillRemainingCards = (deck: PokerCard[]) => {
        setFreezeInput(true);
        const getFilledHand = (hand: Hand, remainingCards: PokerCard[]) => {
            const numToDraw = hand.reduce((acc, c) => c ? acc : acc + 1, 0)
            const drawnCards = getCardsFromDeck(numToDraw, remainingCards)
            let nextCardIndex = 0;
            return hand.map(card => {
                if (card === undefined) {
                    return drawnCards[nextCardIndex++]
                } else {
                    return card
                }
            }) as Hand
        }

        const remainingCardsInDeck = deck.slice(5, undefined)
        const filledActive: Hand = getFilledHand(activeHand.map((card, i) => activeHolds[i] ? card : undefined) as Hand, remainingCardsInDeck);
        
        const finishedOutsideHands: Hand[] = outsideHands.map((hand, i) => {
            return getFilledHand(hand, remainingCardsInDeck)
        })

        const activeHandResult = evaluateHand(filledActive)
        const outsideHandResults = finishedOutsideHands.map((hand) => evaluateHand(hand));
        const pointValue = UltimateXHandPointValues[activeHandResult] + outsideHandResults.reduce((acc, c) => acc + UltimateXHandPointValues[c], 0)
        setActiveHandResult(activeHandResult)
        setOutsideHands(finishedOutsideHands)
        setOutsideHandsResults(outsideHandResults)
        setScore((score) => score + pointValue)
    }

    const handleDeal = useCallback(() => {
        if (activeHandResult !== undefined) {
            dealFromNewDeck();
        } else {
            fillRemainingCards(activeDeck);
        }
    }, [activeHandResult, dealFromNewDeck, fillRemainingCards, activeDeck]);

    useEffect(() => {
        const handleKeydown = (e: KeyboardEvent) => {
            if (freezeInput) return;
            const holds: Holds = [false, false, false, false, false]
            switch(e.key) {
                case 'a':
                    holds[0] = !holds[0]
                    break;    
                case 's':
                    holds[1] = !holds[1]
                    break;
                case 'd':
                    holds[2] = !holds[2]
                    break;
                case 'f':
                    holds[3] = !holds[3]
                    break;
                case 'g':
                    holds[4] = !holds[4]
                    break;
            }
            setActiveHolds((prev) => {
                const copy: Holds = [...prev]
                holds.forEach((hold, i) => {
                    if (hold) {
                        copy[i] = !copy[i]
                    }
                })
                return copy;
            })
        }

        document.addEventListener("keydown", handleKeydown)

        return () => {
            document.removeEventListener("keydown", handleKeydown)
        }
    }, [freezeInput])

    useEffect(() => {
        setOutsideHands(new Array(numOutsideHands).fill(activeHand.map((card, i) => activeHolds[i] ? card : undefined)))
    }, [activeHolds, activeHand])

    return (
        <div className="w-screen h-screen flex flex-col justify-end items-center">
            <div className="grid grid-cols-3 gap-8 fixed top-10">
                {
                    outsideHands.map((hand, i) => {
                        return <UltimateXOutsideHand key={i} hand={hand} result={outsideHandsResults[i]}/>
                    })
                }
            </div>
            <div className='w-full flex items-end justify-center gap-10 p-5'>
                {
                    activeHand.map((card, i) => (
                        <div key={i} className={`cursor-pointer ${activeHolds[i] && 'sm:pb-5'}`} onClick={() => toggleHold(i)}>
                            <div className="flex flex-col justify-center items-center">
                                {
                                    activeHolds[i] && (
                                        <div className="text-2xl font-semibold">
                                            Held
                                        </div>
                                    )
                                }
                                {card && <PokerCardComponent card={card} size='md'/>}
                            </div>
                        </div>
                    ))
                }
            </div>
            <div className="flex flex-col gap-2 justify-center items-center">
                <div className="text-emerald-500 font-semibold text-lg">${score}</div>
                <button 
                    className="font-semibold mb-10 border border-2 border-black bg-orange-500 px-12 py-2 text-2xl" 
                    onClick={() => handleDeal()} 
                >
                    Deal
                </button>
            </div>
        </div>
    )
}