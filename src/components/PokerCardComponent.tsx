
import { PokerCard, PokerSuit, PokerSuitColors } from "@/lib/pokerUtils";
import { ReactElement } from "react";


const PokerSuitSymbols: Record<PokerSuit, ReactElement> = {
    "Heart": <>&#9829;</>,
    "Diamond": <>&#9830;</>,
    "Club": <>&#9827;</>,
    "Spade": <>&#9824;</>
}

interface PokerCardComponentPropTypes {
    card: PokerCard;
    size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    showHold?: boolean
}

export function PokerCardComponent(props: PokerCardComponentPropTypes) {
    const { size, showHold} = props;
    const { suit, value } = props.card;
    const bgColor = PokerSuitColors[suit];
    const symbol = PokerSuitSymbols[suit];
    const getSizeClass = (mode: string) => {
        switch(mode) {
            case 'xl':
                return 'w-72 h-96 text-4xl p-5 gap-5';
            case 'lg': 
                return  'w-60 h-72 text-3xl p-5 gap-5';
            case 'md':
                return 'w-48 h-60 text-3xl p-3 gap-3';
            case 'sm': 
                return 'w-32 h-48 text-2xl p-3 gap-3';
            case 'xs':
                return 'w-20 h-32 text-sm p-1 gap-2';
            default:
                return 'w-48 h-60 text-3xl p-3 gap-3';
        }
    }
    const sizeClass = getSizeClass(size);
    return (
        <div className={`${sizeClass} border ${showHold ? 'border-4' : 'border-2'} border-black flex rounded-sm flex-col justify-between items-center ${bgColor}`}>
            <div className="self-start flex justify-center items-center">{symbol}</div>
                <div className="flex justify-center items-center text-4xl font-semibold">{value}</div>
                {
                    showHold !== undefined && showHold && <div className="text-2xl font-semibold absolute">
                        Held
                    </div>
                }
            <div className="self-end flex justify-center items-center">{symbol}</div>
        </div>
    )
}