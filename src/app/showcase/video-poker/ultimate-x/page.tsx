"use client"

import { PokerCardComponent } from "@/components/PokerCardComponent";
import { useCallback, useEffect, useState } from "react";

const UltimateXHandPointValues: Record<PokerHands, number> = {
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

const UltimateXHandMultiplierTable: Record<PokerHands, number[]> = {
    "High Card": [],
    "One Pair": [],
    "Jacks or Better": [],
    "Two Pair": [],
    "Three of a Kind": [1, 3, 4, 5],
    "Straight": [1, 3, 4, 5, 7, 8],
    "Flush": [1, 3, 4, 6, 8],
    "Full House": [1, 3, 4, 6, 7, 9, 10],
    "Quads": [1, 3, 4, 6, 7, 9, 10],
    "Quads (2s, 3s, 4s)": [1, 3, 4, 6, 7, 9, 10],
    "Quads (5-10)": [1, 3, 4, 6, 7, 9, 10],
    "Quads (Js, Qs, Ks)": [1, 3, 4, 6, 7, 9, 10],
    "Quad Aces": [1, 3, 4, 6, 7, 9, 10],
    "Straight Flush": [],
    "Royal Flush": []
}

const UltimateXBgColors: Record<PokerHands, string> = {
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

type Holds = [boolean, boolean, boolean, boolean, boolean];

interface UltimateXOutsideHandProps {
    hand: Hand,
    result: PokerHands | undefined,
    multipliers: Record<PokerHands, number>
}

function UltimateXOutsideHand(props: UltimateXOutsideHandProps) {
    const { hand, result } = props;
    const resultVal = result ? UltimateXHandPointValues[result] : 0 
    
    return (
        <div className="flex gap-2 justify-center items-center">
            {
                result && (resultVal !== 0) &&  (
                    <div className={`border border-2 border-black px-4 py-1 rounded-sm fixed opacity-85 text-xl font-semibold ${UltimateXBgColors[result]}`}>
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
    const defaultMultipliers: Record<PokerHands, number> = {
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
    }
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
    const [score, setScore] = useState<number>(5000)
    const [freezeInput, setFreezeInput] = useState<boolean>(false)
    const [multipliers, setMultipliers] = useState<Record<PokerHands, number>>(defaultMultipliers);
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

    const updateMultipliersFromCurrentHand = (hand: PokerHands) => {
        const value = UltimateXHandPointValues[hand]
        const updatedMultipliers = {
            ...multipliers
        }
        const increaseMultipliers = (hand: PokerHands) => {
            const nextIndex = Math.min(updatedMultipliers[hand] + 1, 10)
            updatedMultipliers[hand] = nextIndex
        }
        switch (hand) {
            case PokerHands.RoyalFlush:
                increaseMultipliers(PokerHands.QuadAces);
                increaseMultipliers(PokerHands.QuadsTwosThreesFours);
                increaseMultipliers(PokerHands.QuadsJackQueenKing);
                break;
            case PokerHands.StraightFlush:
                increaseMultipliers(PokerHands.QuadAces);
                increaseMultipliers(PokerHands.QuadsTwosThreesFours);
                increaseMultipliers(PokerHands.QuadsJackQueenKing);
                break;
            case PokerHands.QuadAces:
                increaseMultipliers(PokerHands.QuadsTwosThreesFours);
                increaseMultipliers(PokerHands.QuadsJackQueenKing);
                break;
            case PokerHands.QuadsTwosThreesFours:
                increaseMultipliers(PokerHands.QuadAces);
                increaseMultipliers(PokerHands.QuadsFiveToTen);
                break;
            case PokerHands.QuadsJackQueenKing:
                increaseMultipliers(PokerHands.QuadAces);
                increaseMultipliers(PokerHands.QuadsTwosThreesFours);
                break;
            case PokerHands.QuadsFiveToTen:
                increaseMultipliers(PokerHands.QuadAces);
                increaseMultipliers(PokerHands.QuadsTwosThreesFours);
                increaseMultipliers(PokerHands.QuadsJackQueenKing);
                break;
            case PokerHands.FullHouse:
                increaseMultipliers(PokerHands.QuadsTwosThreesFours);
                increaseMultipliers(PokerHands.QuadsJackQueenKing);
                increaseMultipliers(PokerHands.QuadsFiveToTen);
                break;
            case PokerHands.Flush:
                increaseMultipliers(PokerHands.QuadsJackQueenKing)
                increaseMultipliers(PokerHands.QuadsFiveToTen)
                increaseMultipliers(PokerHands.FullHouse)
                break;
            case PokerHands.Straight:
                increaseMultipliers(PokerHands.QuadsFiveToTen)
                increaseMultipliers(PokerHands.FullHouse)
                increaseMultipliers(PokerHands.Flush)
                break;
            case PokerHands.ThreeOfAKind:
                increaseMultipliers(PokerHands.FullHouse)
                increaseMultipliers(PokerHands.Flush)
                increaseMultipliers(PokerHands.Straight)
                break;
            case PokerHands.TwoPair:
                increaseMultipliers(PokerHands.Flush)
                increaseMultipliers(PokerHands.Straight)
                increaseMultipliers(PokerHands.TwoPair)
                break;
            case PokerHands.JacksOrBetter:
                increaseMultipliers(PokerHands.Straight)
                increaseMultipliers(PokerHands.ThreeOfAKind)
                increaseMultipliers(PokerHands.TwoPair)
                break;
            default:
                break;
        }
        if (value > 0) {
            setShowMultiplierWidget(true)
        }
        setMultipliers(updatedMultipliers);
    }

    const dealFromNewDeck = () => {
        const newDeck = getShuffledDeck(activeDeck);
        setActiveDeck(newDeck);
        const newHand = getHand(newDeck);
        const dealtHand = evaluateHand(newHand);
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

        const activeHandResult = evaluateHand(filledActive)
        const outsideHandResults = finishedOutsideHands.map((hand) => evaluateHand(hand));
        const pointValue = (UltimateXHandPointValues[activeHandResult] * UltimateXHandMultiplierTable[activeHandResult][multipliers[activeHandResult]]) 
                            + outsideHandResults.reduce((acc, c) => acc + UltimateXHandPointValues[c] * UltimateXHandMultiplierTable[c][multipliers[c]], 0)
        setActiveHand(filledActive);
        setActiveHandResult(activeHandResult)
        setWonValue(pointValue)
        setOutsideHands(finishedOutsideHands)
        setOutsideHandsResults(outsideHandResults)
        setMultipliers((prev) => {
            const copied = {
                ...prev
            }
            copied[activeHandResult] = 0;
            outsideHandResults.forEach((h) => {
                copied[h] = 0;
            })
            return copied;
        })

        setScore((score) => score + pointValue)
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

            const triggerDeal = e.key === 'Enter'
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

    return (
        <div className="w-screen h-screen grid grid-cols-5 gap-2 justify-center items-start">
            <div className="w-full h-full col-start-1 row-span-2 flex flex-col justify-center items-center gap-4 p-8">
                <div className="bg-blue-500 text-yellow-200 w-4/5 h-4/5 flex justify-center items-center border border-black border-2 rounded-md flex flex-col justify-center items-start pt-4">
                    <div className="text-3xl">Royal Flush</div>
                    <div className="text-3xl">{UltimateXHandPointValues["Royal Flush"]} x{UltimateXHandMultiplierTable["Royal Flush"][multipliers["Royal Flush"]]}</div>
                </div>
                <div className="bg-blue-500 text-yellow-200 w-4/5 h-4/5 flex justify-center items-center border border-black border-2 rounded-md flex flex-col justify-center items-start pt-4">
                    <div className="text-3xl">Straight Flush</div>
                    <div className="text-3xl">{UltimateXHandPointValues["Straight Flush"]} x{UltimateXHandMultiplierTable["Straight Flush"][multipliers["Straight Flush"]]}</div>
                </div>
                <div className="bg-blue-500 text-yellow-200 w-4/5 h-4/5 flex justify-center items-center border border-black border-2 rounded-md flex flex-col justify-center items-start pt-4">
                    <div className="text-3xl">Quads (As)</div>
                    <div className="text-3xl">{UltimateXHandPointValues["Quad Aces"]} x{UltimateXHandMultiplierTable["Quad Aces"][multipliers["Quad Aces"]]}</div>
                </div>
                <div className="bg-blue-500 text-yellow-200 w-4/5 h-4/5 flex justify-center items-center border border-black border-2 rounded-md flex flex-col justify-center items-start pt-4">
                    <div className="text-3xl">Quads (2s, 3s, 4s)</div>
                    <div className="text-3xl">{UltimateXHandPointValues["Quads (2s, 3s, 4s)"]} x{UltimateXHandMultiplierTable["Quads (2s, 3s, 4s)"][multipliers["Quads (2s, 3s, 4s)"]]}</div>
                </div>
                <div className="bg-blue-500 text-yellow-200 w-4/5 h-4/5 flex justify-center items-center border border-black border-2 rounded-md flex flex-col justify-center items-start pt-4">
                    <div className="text-3xl">Quads (Js, Qs, Ks)</div>
                    <div className="text-3xl">{UltimateXHandPointValues["Quads (Js, Qs, Ks)"]} x{UltimateXHandMultiplierTable["Quads (Js, Qs, Ks)"][multipliers["Quads (Js, Qs, Ks)"]]}</div>
                </div>
                <div className="bg-blue-500 text-yellow-200 w-4/5 h-4/5 flex justify-center items-center border border-black border-2 rounded-md flex flex-col justify-center items-start pt-4">
                    <div className="text-3xl">Quads (5s-10s)</div>
                    <div className="text-3xl">{UltimateXHandPointValues["Quads (5-10)"]} x{UltimateXHandMultiplierTable["Quads (5-10)"][multipliers["Quads (5-10)"]]}</div>
                </div>
            </div>
            <div className="col-start-2 col-span-3 grid grid-cols-3 gap-8 justify-center items-center p-2">
                {
                    outsideHands.map((hand, i) => {
                        return <UltimateXOutsideHand key={i} hand={hand} result={outsideHandsResults[i]}/>
                    })
                }
            </div>
            <div className="w-full h-full col-start-5 row-span-2 flex flex-col justify-center items-center gap-4 p-8">
                <div className="bg-blue-500 text-yellow-200 w-4/5 h-4/5 flex justify-center items-center border border-black border-2 rounded-md flex flex-col justify-center items-start pt-4">
                    <div className="text-3xl">Full House</div>
                    <div className="text-3xl">{UltimateXHandPointValues["Full House"]} x{UltimateXHandMultiplierTable["Full House"][multipliers["Full House"]]}</div>
                </div>
                <div className="bg-blue-500 text-yellow-200 text-yellow-400 w-4/5 h-4/5 flex justify-center items-center border border-black border-2 rounded-md flex flex-col justify-center items-start pt-4">
                    <div className="text-3xl">Flush</div>
                    <div className="text-3xl">{UltimateXHandPointValues["Flush"]} x{UltimateXHandMultiplierTable["Flush"][multipliers["Flush"]]}</div>
                </div>
                <div className="bg-blue-500 text-yellow-200 text-yellow-400 w-4/5 h-4/5 flex justify-center items-center border border-black border-2 rounded-md flex flex-col justify-center items-start pt-4">
                    <div className="text-3xl">Straight</div>
                    <div className="text-3xl">{UltimateXHandPointValues["Straight"]} x{UltimateXHandMultiplierTable["Straight"][multipliers["Straight"]]}</div>
                </div>
                <div className="bg-blue-500 text-yellow-200 text-yellow-400 w-4/5 h-4/5 flex justify-center items-center border border-black border-2 rounded-md flex flex-col justify-center items-start pt-4">
                    <div className="text-3xl">Three of a Kind</div>
                    <div className="text-3xl">{UltimateXHandPointValues["Three of a Kind"]} x{UltimateXHandMultiplierTable["Three of a Kind"][multipliers["Three of a Kind"]]}</div>
                </div>
                <div className="bg-blue-500 text-yellow-200 text-yellow-400 w-4/5 h-4/5 flex justify-center items-center border border-black border-2 rounded-md flex flex-col justify-center items-start pt-4">
                    <div className="text-3xl">Two Pair</div>
                    <div className="text-3xl">{UltimateXHandPointValues["Two Pair"]} x{UltimateXHandMultiplierTable["Two Pair"][multipliers["Two Pair"]]}</div>
                </div>
                <div className="bg-blue-500 text-yellow-200 text-yellow-400 w-4/5 h-4/5 flex justify-center items-center border border-black border-2 rounded-md flex flex-col justify-center items-start pt-4">
                    <div className="text-3xl">Jacks or Better</div>
                    <div className="text-3xl">{UltimateXHandPointValues["Jacks or Better"]} x{UltimateXHandMultiplierTable["Jacks or Better"][multipliers["Jacks or Better"]]}</div>
                </div>
            </div>
            <div className='col-start-2 col-span-3 w-full flex items-end justify-center gap-10'>
                {
                    activeHand.map((card, i) => (
                        <div key={i} className={`cursor-pointer`} onClick={() => toggleHold(i)}>
                            <div className={`flex flex-col justify-center items-center`}>
                                {
                                    card && <PokerCardComponent card={card} size='md' showHold={activeHolds[i]}/>
                                }
                            </div>
                        </div>
                    ))
                }
            </div>
            {
                showMultiplierWidget && <div className="col-start-1 flex justify-center items-center h-full text-2xl font-semibold">
                    Multipliers Increased!
                </div>
            }
            {
                activeHandResult !== undefined && <div className={`text-2xl font-semibold col-start-2 flex justify-center items-center w-full h-full`}>
                    {activeHandResult} | {UltimateXHandPointValues[activeHandResult]}
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