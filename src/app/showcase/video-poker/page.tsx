"use client"

import { PokerDeckUnshuffled, PokerSuit, PokerValue } from "@/lib/utils";
import { PokerCardComponent } from "@/components/PokerCardComponent";

export default function VideoPokerPage() {
  return (
    <div className="flex flex-col w-full justify-center items-center gap-5 p-5">
        <div className='flex w-full justify-between'>
            {PokerDeckUnshuffled.filter(card => card.suit === PokerSuit.Club).map(card => <PokerCardComponent card={card}/>)}
        </div>
        <div className='flex w-full justify-between'>
            {PokerDeckUnshuffled.filter(card => card.suit === PokerSuit.Diamond).map(card => <PokerCardComponent card={card}/>)}
        </div>
        <div className='flex w-full justify-between'>
            {PokerDeckUnshuffled.filter(card => card.suit === PokerSuit.Spade).map(card => <PokerCardComponent card={card}/>)}
        </div>
        <div className='flex w-full justify-between'>
            {PokerDeckUnshuffled.filter(card => card.suit === PokerSuit.Heart).map(card => <PokerCardComponent card={card}/>)}
        </div>
    </div>
  );
}