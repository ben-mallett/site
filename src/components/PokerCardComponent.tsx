import { PokerCard, PokerSuit, PokerSuitColors, PokerValue } from "@/lib/utils"
import { ReactElement } from "react";


const PokerSuitSymbols: Record<PokerSuit, ReactElement> = {
    "HEART": <>&#9829;</>,
    "DIAMOND": <>&#9830;</>,
    "CLUB": <>&#9827;</>,
    "SPADE": <>&#9824;</>
}

interface PokerCardComponentPropTypes {
    card: PokerCard;
}

export function PokerCardComponent(props: PokerCardComponentPropTypes) {
    const {suit, value} = props.card;
    const bgColor = PokerSuitColors[suit];
    const symbol = PokerSuitSymbols[suit];
    return (
        <div className={`w-48 h-60 border border-2 border-black flex rounded-sm flex-col justify-between items-center p-5 gap-5 ${bgColor}`}>
            <div className="self-start text-3xl flex justify-center items-center">{symbol}</div>
                <div className="flex justify-center items-center text-4xl font-semibold">{value}</div>
            <div className="self-end text-3xl flex justify-center items-center">{symbol}</div>
        </div>
    )
}