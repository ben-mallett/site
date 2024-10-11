"use client"

import { PokerCardComponent } from "@/components/PokerCardComponent";
import { Hand, Holds, PokerCard, PokerDeckUnshuffled, PokerHand, evaluateHandForUltimateX, getCardsFromDeck, getHandFromDeck, getShuffledDeck } from "@/lib/pokerUtils";
import { useCallback, useEffect, useState } from "react";

const UltimateXHandPointValues: Record<PokerHand, number> = {
    "High Card": 0,
    "One Pair": 0,
    "Jacks or Better": 5,
    "Two Pair": 10,
    "Three of a Kind": 15,
    "Straight": 20,
    "Flush": 25,
    "Full House": 35,
    "Quads": 125,
    "Quads (2s, 3s, 4s)": 200,
    "Quads (5-10)": 125,
    "Quads (Js, Qs, Ks)": 125,
    "Quad Aces": 400,
    "Straight Flush": 250,
    "Royal Flush": 8000
}

const UltimateXHandMultiplierTable: Record<PokerHand, number[]> = {
    "High Card": [0],
    "One Pair": [0],
    "Jacks or Better": [1],
    "Two Pair": [1],
    "Three of a Kind": [1, 3, 4, 5],
    "Straight": [1, 3, 4, 5, 7, 8],
    "Flush": [1, 3, 4, 6, 8],
    "Full House": [1, 3, 4, 6, 7, 9, 10],
    "Quads": [1, 3, 4, 6, 7, 9, 10],
    "Quads (2s, 3s, 4s)": [1, 3, 4, 6, 7, 9, 10],
    "Quads (5-10)": [1, 3, 4, 6, 7, 9, 10],
    "Quads (Js, Qs, Ks)": [1, 3, 4, 6, 7, 9, 10],
    "Quad Aces": [1, 3, 4, 6, 7, 9, 10],
    "Straight Flush": [1],
    "Royal Flush": [0]
}

const UltimateXHandMultiplierEffectTable: Record<PokerHand, PokerHand[]> = {
    "High Card": [],
    "One Pair": [],
    "Jacks or Better": [PokerHand.TwoPair, PokerHand.ThreeOfAKind],
    "Two Pair": [PokerHand.Straight, PokerHand.Flush],
    "Three of a Kind": [PokerHand.Straight, PokerHand.Flush, PokerHand.FullHouse],
    "Straight": [PokerHand.QuadAces, PokerHand.Quads, PokerHand.QuadsFiveToTen, PokerHand.QuadsTwosThreesFours, PokerHand.QuadsJackQueenKing, PokerHand.FullHouse],
    "Flush": [PokerHand.QuadAces, PokerHand.Quads, PokerHand.QuadsFiveToTen, PokerHand.QuadsTwosThreesFours, PokerHand.QuadsJackQueenKing, PokerHand.FullHouse],
    "Full House": [PokerHand.QuadAces, PokerHand.Quads, PokerHand.QuadsFiveToTen, PokerHand.QuadsTwosThreesFours, PokerHand.QuadsJackQueenKing],
    "Quads": [PokerHand.QuadAces, PokerHand.QuadsFiveToTen, PokerHand.QuadsTwosThreesFours, PokerHand.QuadsJackQueenKing, PokerHand.FullHouse, PokerHand.Straight, PokerHand.Flush],
    "Quads (2s, 3s, 4s)": [PokerHand.QuadAces, PokerHand.QuadsFiveToTen, PokerHand.Quads, PokerHand.QuadsJackQueenKing, PokerHand.FullHouse, PokerHand.Straight, PokerHand.Flush],
    "Quads (5-10)": [PokerHand.QuadAces, PokerHand.Quads, PokerHand.QuadsTwosThreesFours, PokerHand.QuadsJackQueenKing, PokerHand.FullHouse, PokerHand.Straight, PokerHand.Flush],
    "Quads (Js, Qs, Ks)": [PokerHand.QuadAces, PokerHand.QuadsFiveToTen, PokerHand.QuadsTwosThreesFours, PokerHand.Quads, PokerHand.FullHouse, PokerHand.Straight, PokerHand.Flush],
    "Quad Aces": [PokerHand.Quads, PokerHand.QuadsFiveToTen, PokerHand.QuadsTwosThreesFours, PokerHand.QuadsJackQueenKing, PokerHand.FullHouse, PokerHand.Straight, PokerHand.Flush],
    "Straight Flush": [PokerHand.QuadAces, PokerHand.QuadsFiveToTen, PokerHand.QuadsTwosThreesFours, PokerHand.QuadsJackQueenKing, PokerHand.FullHouse, PokerHand.Straight, PokerHand.Flush],
    "Royal Flush": [PokerHand.QuadAces, PokerHand.QuadsFiveToTen, PokerHand.QuadsTwosThreesFours, PokerHand.QuadsJackQueenKing, PokerHand.FullHouse, PokerHand.Straight, PokerHand.Flush]
}

const UltimateXBgColors: Record<PokerHand, string> = {
    "High Card": "bg-slate-100",
    "One Pair": "bg-slate-200",
    "Jacks or Better": "bg-sky-200",
    "Two Pair": "bg-sky-300",
    "Three of a Kind": 'bg-yellow-200',
    "Straight": 'bg-fuchsia-300',
    "Flush": 'bg-fuchsia-500',
    "Full House": 'bg-rose-400',
    "Quads": 'bg-yellow-600',
    "Quads (2s, 3s, 4s)": 'bg-yellow-600',
    "Quads (5-10)": 'bg-yellow-600',
    "Quads (Js, Qs, Ks)": 'bg-yellow-600',
    "Quad Aces": 'bg-pink-500',
    "Straight Flush": 'bg-blue-500',
    "Royal Flush": 'bg-orange-500'
}

interface UltimateXOutsideHandProps {
    hand: Hand,
    result: PokerHand | undefined,
    multiplier: number
}

function UltimateXOutsideHand(props: UltimateXOutsideHandProps) {
    const { hand, result, multiplier } = props;
    const resultVal = result ? UltimateXHandPointValues[result] : 0 
    
    return (
        <div className="flex gap-2 justify-center items-center">
            {
                result && (resultVal !== 0) &&  (
                    <div className={`border border-2 border-black px-4 py-1 rounded-sm fixed opacity-85 text-xl font-semibold ${UltimateXBgColors[result]}`}>
                        {result} | {UltimateXHandPointValues[result]} x {multiplier} = {UltimateXHandPointValues[result] * multiplier}
                    </div>
                )
            }
            {
                hand.map((card, i) => (
                    card ? <PokerCardComponent key={i} card={card} size={'xs'}/> : <div key={i} className="w-20 h-32 border border-black border-2 bg-orange-300"/>
                ))
            }
        </div>
    )
}

export default function UltimateX() {
    const defaultMultiplierIndices: Record<PokerHand, number> = {
        "High Card": 0,
        "One Pair": 0,
        "Jacks or Better": 0,
        "Two Pair": 0,
        "Three of a Kind": 0,
        "Straight": 0,
        "Flush": 0,
        "Full House": 0,
        "Quads": 0,
        "Quads (2s, 3s, 4s)": 0,
        "Quads (5-10)": 0,
        "Quads (Js, Qs, Ks)": 0,
        "Quad Aces": 0,
        "Straight Flush": 0,
        "Royal Flush": 0
    };

    const defaultHolds: Holds = [false, false, false, false, false]
    const defaultNumHands: number = 9;
    const defaultOutsideHand: Hand = [undefined, undefined, undefined, undefined, undefined]
    const [activeDeck, setActiveDeck] = useState<PokerCard[]>(getShuffledDeck(PokerDeckUnshuffled));
    const startingHand = getHandFromDeck(activeDeck);
    const [activeHand, setActiveHand] = useState<Hand>(startingHand);
    const [activeHolds, setActiveHolds] = useState<Holds>(defaultHolds)
    const [numOutsideHands, setNumOutsideHands] = useState<number>(defaultNumHands);
    const [outsideHands, setOutsideHands] = useState<Hand[]>(new Array(numOutsideHands).fill(defaultOutsideHand))
    const [activeHandResult, setActiveHandResult] = useState<PokerHand>(evaluateHandForUltimateX(startingHand))
    const [outsideHandsResults, setOutsideHandsResults] = useState<(PokerHand | undefined)[]>(new Array(numOutsideHands).fill(undefined))
    const [score, setScore] = useState<number>(5000)
    const [freezeInput, setFreezeInput] = useState<boolean>(false)
    const [multiplierIndices, setMultiplierIndices] = useState<Record<PokerHand, number>>(defaultMultiplierIndices);
    const [dealNew, setDealNew] = useState<boolean>(false);
    const [showMultiplierWidget, setShowMultiplierWidget] = useState<boolean>(false)
    const [wonValue, setWonValue] = useState<number>(0);

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

    const updateMultipliersFromCurrentHand = (hand: PokerHand) => {
        const value = UltimateXHandPointValues[hand]
        const updatedMultiplierIndices = {
            ...multiplierIndices
        }
        const increaseMultipliers = (hand: PokerHand) => {
            const nextIndex = Math.min(updatedMultiplierIndices[hand] + 1, UltimateXHandMultiplierTable[hand].length - 1)
            updatedMultiplierIndices[hand] = nextIndex
        }
        UltimateXHandMultiplierEffectTable[hand].forEach((h) => increaseMultipliers(h))
        if (value > 0) {
            setShowMultiplierWidget(true)
        }
        setMultiplierIndices(updatedMultiplierIndices);
    }

    const dealFromNewDeck = () => {
        const newDeck = getShuffledDeck(activeDeck);
        setActiveDeck(newDeck);

        const newHand = getHandFromDeck(newDeck);
        const dealtHand = evaluateHandForUltimateX(newHand);

        updateMultipliersFromCurrentHand(dealtHand);

        setActiveHandResult(dealtHand);
        setActiveHand(newHand);
        setActiveHolds(defaultHolds);

        setOutsideHands(new Array(numOutsideHands).fill(defaultOutsideHand));
        setScore((score) => (score - 50));

        setOutsideHandsResults(new Array(numOutsideHands).fill(undefined));

        setFreezeInput(false);
        setDealNew(false);

        setWonValue(0)
    }

    const fillRemainingCards = (deck: PokerCard[]) => {
        setFreezeInput(true);
        setShowMultiplierWidget(false);

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

        const activeHandResult = evaluateHandForUltimateX(filledActive)
        const outsideHandResults = finishedOutsideHands.map((hand) => evaluateHandForUltimateX(hand));
        const outsideHandsPointValue = outsideHandResults.reduce((acc, c) => acc + UltimateXHandPointValues[c] * UltimateXHandMultiplierTable[c][multiplierIndices[c]], 0)
        const pointValue = (
            UltimateXHandPointValues[activeHandResult] 
            * UltimateXHandMultiplierTable[activeHandResult][multiplierIndices[activeHandResult]]
        ) + outsideHandsPointValue
        setActiveHand(filledActive);
        setActiveHandResult(activeHandResult)
        setWonValue(pointValue)
        setOutsideHands(finishedOutsideHands)
        setOutsideHandsResults(outsideHandResults)
        setMultiplierIndices((prev) => {
            const copied = {
                ...prev
            }
            copied[activeHandResult] = 0;
            outsideHandResults.forEach((h) => {
                copied[h] = 0;
            })
            return copied;
        })
        if (!isNaN(score) && !isNaN(pointValue)) setScore((score) => score + pointValue)
        setDealNew(true);
    }

    const handleDeal = useCallback(() => {
        if (dealNew) {
            dealFromNewDeck();
        } else {
            fillRemainingCards(activeDeck);
        }
    }, [dealFromNewDeck, fillRemainingCards, activeDeck, dealNew]);

    useEffect(() => {
        const handleKeydown = (e: KeyboardEvent) => {
            const updateHolds = (e: KeyboardEvent) => {
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

            const triggerDeal = e.key === 'Enter' || e.key === 'Return'
            if (!freezeInput) updateHolds(e)
            if (triggerDeal) handleDeal();
        }

        document.addEventListener("keydown", handleKeydown)

        return () => {
            document.removeEventListener("keydown", handleKeydown)
        }
    }, [freezeInput, handleDeal])

    useEffect(() => {
        if (!freezeInput) setOutsideHands(new Array(numOutsideHands).fill(activeHand.map((card, i) => activeHolds[i] ? card : undefined)))
    }, [activeHolds, activeHand, freezeInput])
    const leftSide = Object.keys(UltimateXHandPointValues).filter(e => UltimateXHandPointValues[e as PokerHand] > 0).slice(0, Math.floor((Object.keys(UltimateXHandPointValues).length - 1) / 2));

    return (
        <div className="w-screen h-screen grid grid-cols-5 gap-2 justify-center items-start">
            <div className="w-full h-full col-start-1 row-span-2 flex flex-col justify-center items-center gap-4 p-8">
                {
                    leftSide.map((e) => (
                        <div className="bg-blue-500 text-yellow-200 w-4/5 h-4/5 flex justify-center items-center border border-black border-2 rounded-md flex flex-col justify-center items-start p-2">
                            <div className="text-3xl">{e}</div>
                            <div className="text-3xl">{UltimateXHandPointValues[e as PokerHand]} x {UltimateXHandMultiplierTable[e as PokerHand][multiplierIndices[e as PokerHand]]}</div>
                        </div>
                    ))
                }
            </div>
            {
                Object.keys(UltimateXHandPointValues).slice(Math.floor((Object.keys(UltimateXHandPointValues).length - 1) / 2))
            }
            <div className="col-start-2 col-span-3 grid grid-cols-3 gap-8 justify-center items-center p-2">
                {
                    outsideHands.map((hand, i) => {
                        return <UltimateXOutsideHand key={i} hand={hand} result={outsideHandsResults[i]} multiplier={outsideHandsResults[i] ? UltimateXHandMultiplierTable[outsideHandsResults[i]][multiplierIndices[outsideHandsResults[i]]] : 1}/>
                    })
                }
            </div>
            <div className="w-full h-full col-start-5 row-span-2 flex flex-col justify-center items-center gap-4 p-8">
                <div className="bg-blue-500 text-yellow-200 w-4/5 h-4/5 flex justify-center items-center border border-black border-2 rounded-md flex flex-col justify-center items-start pt-4">
                    <div className="text-3xl">Full House</div>
                    <div className="text-3xl">{UltimateXHandPointValues[PokerHand.FullHouse]} x{UltimateXHandMultiplierTable[PokerHand.FullHouse][multiplierIndices[PokerHand.FullHouse]]}</div>
                </div>
                <div className="bg-blue-500 text-yellow-200 w-4/5 h-4/5 flex justify-center items-center border border-black border-2 rounded-md flex flex-col justify-center items-start pt-4">
                    <div className="text-3xl">Flush</div>
                    <div className="text-3xl">{UltimateXHandPointValues[PokerHand.Flush]} x{UltimateXHandMultiplierTable[PokerHand.Flush][multiplierIndices[PokerHand.Flush]]}</div>
                </div>
                <div className="bg-blue-500 text-yellow-200 w-4/5 h-4/5 flex justify-center items-center border border-black border-2 rounded-md flex flex-col justify-center items-start pt-4">
                    <div className="text-3xl">Straight</div>
                    <div className="text-3xl">{UltimateXHandPointValues[PokerHand.Straight]} x{UltimateXHandMultiplierTable[PokerHand.Straight][multiplierIndices[PokerHand.Straight]]}</div>
                </div>
                <div className="bg-blue-500 text-yellow-200 w-4/5 h-4/5 flex justify-center items-center border border-black border-2 rounded-md flex flex-col justify-center items-start pt-4">
                    <div className="text-3xl">Three of a Kind</div>
                    <div className="text-3xl">{UltimateXHandPointValues[PokerHand.ThreeOfAKind]} x{UltimateXHandMultiplierTable[PokerHand.ThreeOfAKind][multiplierIndices[PokerHand.ThreeOfAKind]]}</div>
                </div>
                <div className="bg-blue-500 text-yellow-200 w-4/5 h-4/5 flex justify-center items-center border border-black border-2 rounded-md flex flex-col justify-center items-start pt-4">
                    <div className="text-3xl">Two Pair</div>
                    <div className="text-3xl">{UltimateXHandPointValues[PokerHand.TwoPair]}</div>
                </div>
                <div className="bg-blue-500 text-yellow-200 w-4/5 h-4/5 flex justify-center items-center border border-black border-2 rounded-md flex flex-col justify-center items-start pt-4">
                    <div className="text-3xl">Jacks or Better</div>
                    <div className="text-3xl">{UltimateXHandPointValues[PokerHand.JacksOrBetter]}</div>
                </div>
            </div>
            <div className='col-start-2 col-span-3 w-full flex items-end justify-center gap-10'>
                {
                    activeHand.map((card, i) => {
                        return (
                        <div key={i} className={`cursor-pointer`} onClick={() => toggleHold(i)}>
                            <div className={`flex flex-col justify-center items-center`}>
                                {
                                    card && <PokerCardComponent card={card} size='md' showHold={activeHolds[i]}/>
                                }
                            </div>
                        </div>
                    )})
                }
            </div>
            {
                showMultiplierWidget && <div className="col-start-1 flex justify-center items-center h-full text-2xl font-semibold">
                    Multipliers Increased!
                </div>
            }
            {
                activeHandResult !== undefined && <div className={`text-2xl font-semibold col-start-2 flex justify-center items-center w-full h-full`}>
                    {activeHandResult} | {UltimateXHandPointValues[activeHandResult] * UltimateXHandMultiplierTable[activeHandResult][multiplierIndices[activeHandResult]]}
                </div>
            }
            <div className="col-start-3 col-span-1 flex flex-col gap-2 justify-center items-center">
                <div className={`${score < 0 ? 'text-red-600' : 'text-emerald-600'} font-semibold text-4xl`}>${score}</div>
                <div
                    className="cursor-pointer font-semibold mb-10 border border-2 border-black bg-orange-500 px-12 py-2 text-2xl rounded-md" 
                    onClick={() => handleDeal()} 
                >
                    Deal
                </div>
            </div>
            {
                wonValue > 0 && (
                    <div className="col-start-4 flex justify-center items-center h-full text-2xl font-semibold text-emerald-500">
                        + ${wonValue}
                    </div>
                )
            }
        </div>
    )
}