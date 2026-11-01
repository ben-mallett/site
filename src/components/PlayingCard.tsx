import { PokerCard, PokerSuit, PokerValue } from "@/lib/pokerUtils";
import { cn } from "@/lib/utils";

// The text variation selector stops phones from drawing these as emoji.
const suits: Record<PokerSuit, { symbol: string; name: string; color: string }> = {
    [PokerSuit.Heart]: { symbol: "♥︎", name: "hearts", color: "text-m-pink" },
    [PokerSuit.Diamond]: { symbol: "♦︎", name: "diamonds", color: "text-m-orange" },
    [PokerSuit.Club]: { symbol: "♣︎", name: "clubs", color: "text-m-cyan" },
    [PokerSuit.Spade]: { symbol: "♠︎", name: "spades", color: "text-m-lilac" },
};

const rankName = (value: PokerValue) => value === PokerValue.Ten ? "10" : value;

export const describeCard = ({ suit, value }: PokerCard) => `${rankName(value)} of ${suits[suit].name}`;

type PlayingCardProps = {
    card?: PokerCard;
    // "small" drops to rank over suit, which stays legible at about 20px wide.
    size?: "small" | "large";
    className?: string;
};

// A card that scales with the width of its parent. With no card it shows the back.
export const PlayingCard = ({ card, size = "large", className }: PlayingCardProps) => {
    const frame = "aspect-[5/7] w-full border [container-type:inline-size]";

    if (!card) {
        return (
            <div className={cn(frame, "border-m-line/15 bg-m-surface", className)}>
                <div className="m-hazard h-full w-full text-m-line/10 [animation:none]" />
            </div>
        );
    }

    const { symbol, color } = suits[card.suit];
    const rank = rankName(card.value);

    if (size === "small") {
        return (
            <div className={cn(frame, "flex flex-col items-center justify-center border-m-line/25 bg-m-raised leading-none", color, className)}>
                <span className="font-m-display text-[46cqw] font-black [font-stretch:75%]">{rank}</span>
                <span className="text-[38cqw]">{symbol}</span>
            </div>
        );
    }

    return (
        <div className={cn(frame, "relative border-m-line/30 bg-m-raised leading-none", color, className)}>
            <span className="absolute left-[8cqw] top-[7cqw] font-m-display text-[40cqw] font-black [font-stretch:75%]">{rank}</span>
            <span className="absolute bottom-[7cqw] right-[8cqw] text-[44cqw]">{symbol}</span>
        </div>
    );
};
