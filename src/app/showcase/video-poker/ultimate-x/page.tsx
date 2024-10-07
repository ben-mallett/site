"use client"

import { PokerCardComponent } from "@/components/PokerCardComponent";
import { PokerDeckUnshuffled, PokerCard } from "@/lib/utils";
import { useEffect, useState } from "react";

function getShuffledDeck(deck: PokerCard[]) {
    const copy = [...deck]
    for (let i = deck.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * i + 1);
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy
}

function getHand(deck: PokerCard[]) {
    const shuffledCopy = getShuffledDeck(deck);
    return shuffledCopy.slice(0, 5)
}

type Holds = [boolean, boolean, boolean, boolean, boolean];

export default function UltimateX() {
    const unshuffledDeck = PokerDeckUnshuffled; 
    const [deck, setDeck] = useState<PokerCard[]>(getShuffledDeck(unshuffledDeck));
    const [activeHand, setActiveHand] = useState<PokerCard[]>(getHand(deck));
    const [activeHolds, setActiveHolds] = useState<Holds>([false, false, false, false, false])

    const deal = () => {
        console.log(`Dealing with ${activeHand} and ${activeHolds}`);
    }

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

    useEffect(() => {
        const handleKeydown = (e: KeyboardEvent) => {
            const holds: Holds = [false, false, false, false, false]
            switch(e.key) {
                case 'a':
                    holds[0] = true
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
                case 'Enter':
                    deal();
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
    }, [])
    return (
        <div className="w-screen h-screen flex flex-col justify-end items-center">
            <div className="grid grid-cols-3 gap-8 fixed top-10">
                <div className="flex gap-2 justify-center items-center">
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                </div>
                <div className="flex gap-2 justify-center items-center">
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                </div>
                <div className="flex gap-2 justify-center items-center">
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                </div>
                <div className="flex gap-2 justify-center items-center">
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                </div>
                <div className="flex gap-2 justify-center items-center">
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                </div>
                <div className="flex gap-2 justify-center items-center">
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                </div>
                <div className="flex gap-2 justify-center items-center">
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                </div>
                <div className="flex gap-2 justify-center items-center">
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                </div>
                <div className="flex gap-2 justify-center items-center">
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                    <div className="w-20 h-32 border border-black border-2 bg-red-300"/>
                </div>
            </div>
            <div className='w-full flex items-end justify-center gap-10 p-10'>
                {
                    activeHand.map((card, i) => (
                        <div className={`cursor-pointer ${activeHolds[i] && 'pb-10'}`} onClick={() => toggleHold(i)}>
                            <div className="flex flex-col justify-center items-center">
                                {
                                    activeHolds[i] && (
                                        <div className="text-2xl font-semibold">
                                            Held
                                        </div>
                                    )
                                }
                                <PokerCardComponent card={card}/>
                            </div>
                        </div>
                    ))
                }
            </div>
            <button 
                className="font-semibold mb-10 border border-2 border-black bg-orange-500 px-12 py-2 text-2xl" 
                onClick={() => {}} 
                onKeyDown={(e => {})}
            >
                Deal
            </button>
        </div>
    )
}