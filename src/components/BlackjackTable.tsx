import { CSSProperties, ReactNode } from "react";
import { PlayingCard, describeCard } from "@/components/PlayingCard";
import { Kbd, Verdict } from "@/components/TrainerKit";
import { Button, Label } from "@/components/theme";
import { HandResult, MAX_SPOTS, PlayerHand, Rules, Table, canDeal, canDouble, canHit, canInsure, canSplit, decksLeft, handTotal, insuranceCost, trueCount } from "@/lib/blackjack";
import { formatTag } from "@/lib/hiLo";
import { PokerCard, BlackjackValueRanks } from "@/lib/pokerUtils";

export const formatMoney = (amount: number) => {
    const sign = amount < 0 ? "−" : "";
    const value = Math.abs(amount);
    return `${sign}$${value.toLocaleString("en-US", { minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
};

const signedMoney = (amount: number) => `${amount > 0 ? "+" : ""}${formatMoney(amount)}`;

const describeTotal = (cards: PokerCard[]) => {
    const { total, soft } = handTotal(cards);
    return soft && total < 21 ? `Soft ${total}` : String(total);
};

export const describeRules = (rules: Rules) => [
    `${rules.decks} deck${rules.decks > 1 ? "s" : ""}`,
    `Dealer ${rules.dealerHitsSoft17 ? "hits" : "stands on"} soft 17`,
    `Blackjack pays ${rules.blackjackPays === 1.5 ? "3:2" : "6:5"}`,
].join(" // ");

const RESULT_NAMES: Record<HandResult, string> = { blackjack: "Blackjack", win: "Win", push: "Push", lose: "Lose", bust: "Bust" };

// Card timing. A full table deals faster, so a round never takes long to start.
const CARD_MS = 170;
const DRAW_GAP_MS = 170;
const dealGap = (spots: number) => Math.min(70, 420 / (spots * 2 + 2));

const lastDealCardAt = (spots: number) => (spots * 2 + 1) * dealGap(spots) + CARD_MS;

// When results may show, which is after the last card lands. On a blackjack that is the end of the deal.
export const resultDelay = (table: Table) => {
    if (table.phase !== "settled") return 0;
    return table.decisions === 0 ? lastDealCardAt(table.hands.length) : (table.dealer.length - 2) * DRAW_GAP_MS + CARD_MS;
};

const delayStyle = (delay: number, width?: string) => ({ width, "--m-delay": `${Math.round(delay)}ms` }) as CSSProperties;

// Fits whichever runs out first. Across, a hand of three overlapped cards is two card widths.
// Down, the dealer and every row of hands share the height, after room for their labels.
const cardWidth = (hands: number) => {
    const rows = hands <= 5 ? 1 : hands <= 8 ? 2 : hands <= 12 ? 3 : 4;
    const perRow = Math.ceil(hands / rows);
    const across = Math.min(16, 88 / (perRow * 2));
    const down = 0.714 / (rows + 1) * 0.96;
    return `min(${across.toFixed(1)}cqw, calc((100cqh - ${2.5 + rows * 1.5}rem) * ${down.toFixed(3)}), 7.5rem)`;
};

type FanCard = { key: string; card?: PokerCard; delay: number };

const CardFan = ({ cards, width, lit, label }: { cards: FanCard[]; width: string; lit?: boolean; label: string }) => (
    <div className="flex justify-center" role="img" aria-label={`${label}: ${cards.map(({ card }) => card ? describeCard(card) : "face down card").join(", ")}`}>
        {cards.map(({ key, card, delay }, i) => (
            // Overlapped like a real hand, with each rank still showing in the corner.
            <div key={key} className="m-deal-in" style={{ ...delayStyle(delay, width), marginLeft: i ? `calc(${width} * -0.5)` : undefined }}>
                <PlayingCard card={card} className={lit ? "border-2 border-m-accent" : ""} />
            </div>
        ))}
    </div>
);

const FadeIn = ({ delay, children, className = "" }: { delay: number; children: ReactNode; className?: string }) => (
    <span className={`m-fade-in ${className}`} style={delayStyle(delay)}>{children}</span>
);

const handNote = (hand: PlayerHand, compact: boolean) => {
    const total = describeTotal(hand.cards);
    if (!hand.result) return total;
    const net = hand.returned - hand.bet;
    // With a crowded table the name is dropped, and the amount says enough.
    if (compact) return `${total} // ${net ? signedMoney(net) : RESULT_NAMES.push}`;
    return `${total} // ${RESULT_NAMES[hand.result]}${net ? ` ${signedMoney(net)}` : ""}`;
};

const ActionButton = ({ label, shortcut, disabled, onClick }: { label: string; shortcut: string; disabled?: boolean; onClick: () => void }) => (
    <Button variant="outline" size="lg" disabled={disabled} className="h-[clamp(2.5rem,11cqh,4rem)] min-w-0 flex-1 flex-col gap-1 px-1" onClick={onClick}>
        <span className="font-m-display text-[clamp(0.7rem,3cqh,1.1rem)] font-black leading-none">{label}</span>
        <span className="hidden [@media(pointer:fine)]:inline"><Kbd>{shortcut}</Kbd></span>
    </Button>
);

const SpotBet = ({ spot, bet, selected, showKeys, onSelect, onChange }: { spot: number; bet: number; selected: boolean; showKeys: boolean; onSelect: () => void; onChange: (direction: number) => void }) => (
    <div className={`flex w-[clamp(3.25rem,16cqw,5rem)] flex-col items-stretch border [@media(max-height:520px)]:w-11 ${selected ? "border-m-accent" : "border-m-line/25"}`}>
        <button type="button" aria-label={`Raise bet on spot ${spot + 1}`} className="h-5 font-m-mono text-xs transition-colors hover:bg-m-fg hover:text-m-bg" onClick={() => { onSelect(); onChange(1); }}>+</button>
        <button type="button" aria-pressed={selected} aria-label={`Select spot ${spot + 1}, betting ${formatMoney(bet)}`} className="flex flex-col items-center border-y border-m-line/15 py-0.5" onClick={onSelect}>
            <span className="font-m-display text-base font-black leading-none tabular-nums [font-stretch:75%]">{formatMoney(bet)}</span>
            <span className="font-m-mono text-[9px] uppercase text-m-muted">Spot {spot + 1}{showKeys ? <span className="hidden [@media(pointer:fine)]:inline"> [{spot + 1}]</span> : null}</span>
        </button>
        <button type="button" aria-label={`Lower bet on spot ${spot + 1}`} className="h-5 font-m-mono text-xs transition-colors hover:bg-m-fg hover:text-m-bg" onClick={() => { onSelect(); onChange(-1); }}>&minus;</button>
    </div>
);

const statusOf = (table: Table): ReactNode => {
    if (table.phase === "insurance") return `Insurance for ${formatMoney(insuranceCost(table))}?`;
    if (table.phase === "playing") {
        const active = table.hands[table.active];
        const onSpot = table.hands.filter((hand) => hand.spot === active.spot);
        const hand = onSpot.length > 1 ? `Hand ${onSpot.indexOf(active) + 1} of ${onSpot.length}` : "Your move";
        return table.spots > 1 ? `Spot ${active.spot + 1} of ${table.spots} // ${hand}` : hand;
    }
    if (!canDeal(table)) return table.spots > 1 ? "Not enough chips for this many spots" : "Out of chips, start a new game";
    if (table.spots === 1) return "Place your bet";
    return `Place your bets // ${formatMoney(table.bets.slice(0, table.spots).reduce((sum, bet) => sum + bet, 0))} total`;
};

type Keys = { hit: string; stand: string; double: string; split: string; insure: string; decline: string; count: string; fewerSpots: string; moreSpots: string; matchBets: string; rules: string };

type BlackjackTableProps = {
    table: Table;
    showCount: boolean;
    selectedSpot: number;
    keysFor: Keys;
    onHit: () => void;
    onStand: () => void;
    onDouble: () => void;
    onSplit: () => void;
    onInsurance: (take: boolean) => void;
    onSelectSpot: (spot: number) => void;
    onBet: (spot: number, direction: number) => void;
    onMatchBets: () => void;
    onSpots: (change: number) => void;
    onDeal: () => void;
    onToggleCount: () => void;
    onOpenRules: () => void;
};

export const BlackjackTable = ({ table, showCount, selectedSpot, keysFor, onHit, onStand, onDouble, onSplit, onInsurance, onSelectSpot, onBet, onMatchBets, onSpots, onDeal, onToggleCount, onOpenRules }: BlackjackTableProps) => {
    const waiting = table.phase === "betting" || table.phase === "settled";
    const hasCards = table.hands.length > 0;
    const width = cardWidth(table.hands.length);
    const upValue = hasCards ? (table.dealer[0].value === "A" ? 11 : BlackjackValueRanks[table.dealer[0].value]) : 0;
    const dealtSpots = hasCards ? new Set(table.hands.map((hand) => hand.spot)).size : table.spots;
    const gap = dealGap(dealtSpots);

    // Cards go out one at a time from spot one, then the dealer, and around again. Only the deal is staggered.
    const dealtAt = (order: number) => order * gap;
    const dealerCards: FanCard[] = table.dealer.map((card, i) => {
        if (i === 0) return { key: `${table.dealId}-up`, card, delay: dealtAt(dealtSpots) };
        if (i === 1) {
            const fromDeal = table.holeHidden || table.decisions === 0;
            return { key: `${table.dealId}-hole-${table.holeHidden}`, card: table.holeHidden ? undefined : card, delay: fromDeal ? dealtAt(dealtSpots * 2 + 1) : 0 };
        }
        return { key: `${table.dealId}-draw-${i}`, card, delay: (i - 1) * DRAW_GAP_MS };
    });
    const handCards = (hand: PlayerHand, index: number): FanCard[] => hand.cards.map((card, i) => ({
        key: `${table.dealId}-${index}-${hand.cards.length > 2 ? "" : hand.fromSplit ? "s" : ""}${i}`,
        card,
        delay: hand.fromSplit || i > 1 ? 0 : dealtAt(i === 0 ? hand.spot : dealtSpots + 1 + hand.spot),
    }));

    const shownAfter = table.phase === "settled" ? resultDelay(table) : table.decisions === 0 ? lastDealCardAt(dealtSpots) : 0;

    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 [@media(max-height:520px)]:flex-row">
            <div className="min-h-0 min-w-0 w-full flex-1 self-stretch [container-type:size]">
                <div className="flex h-full flex-col items-center justify-center gap-1">
                    {hasCards ? (
                        <>
                            <Label tone="fg">
                                Dealer{" // "}
                                {table.holeHidden ? `Shows ${upValue}` : <FadeIn key={`${table.dealId}-${table.dealer.length}`} delay={shownAfter}>{describeTotal(table.dealer)}</FadeIn>}
                            </Label>
                            <CardFan cards={dealerCards} width={width} label="Dealer" />
                            {/* Scrolls as a last resort, so even a table full of split hands can't spill over the controls. */}
                            {/* Reversed, because the dealer works from their left: spot one is on your right, and goes first. */}
                            <div className="mt-1 flex min-h-0 flex-row-reverse flex-wrap justify-center gap-x-4 gap-y-1 overflow-y-auto">
                                {table.hands.map((hand, i) => {
                                    const active = table.phase === "playing" && i === table.active;
                                    const note = handNote(hand, table.hands.length > 3);
                                    return (
                                        <div key={i} className="flex flex-col items-center gap-1">
                                            <CardFan cards={handCards(hand, i)} width={width} lit={active} label={table.spots > 1 ? `Spot ${hand.spot + 1}` : `Your hand${table.hands.length > 1 ? ` ${i + 1}` : ""}`} />
                                            <span className={`h-4 whitespace-nowrap font-m-mono text-[9px] font-semibold uppercase sm:text-[11px] ${active || hand.result === "win" || hand.result === "blackjack" ? "text-m-accent" : ""}`}>
                                                <FadeIn key={note} delay={shownAfter}>{table.spots > 1 ? `${hand.spot + 1}: ` : ""}{note}</FadeIn>
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <Label tone="fg" className="text-center">{describeRules(table.rules)}</Label>
                    )}
                </div>
            </div>

            {/* A fixed shape, so nothing above it moves when the round changes phase. */}
            <div className="flex w-full max-w-xl shrink-0 flex-col items-center gap-1 [@media(max-height:520px)]:w-[56%]">
                <div className="flex h-[clamp(2rem,9cqh,3.25rem)] items-center justify-center">
                    {table.phase === "settled" ? (
                        <FadeIn key={table.dealId} delay={resultDelay(table)}>
                            <Verdict correct={table.lastNet >= 0}>
                                {table.lastNet === 0 ? "Push" : signedMoney(table.lastNet)}{table.insurance ? ` // Insurance ${table.insuranceReturned ? "paid" : "lost"}` : ""}
                            </Verdict>
                        </FadeIn>
                    ) : (
                        <Label tone="fg">{statusOf(table)}</Label>
                    )}
                </div>

                <div className="flex min-h-[8.75rem] w-full flex-col items-center justify-center gap-2 [@media(max-height:520px)]:min-h-[7.25rem] [@media(max-height:520px)]:gap-1">
                    {table.phase === "playing" && (
                        <div className="flex w-full gap-1 sm:gap-2">
                            <ActionButton label="Hit" shortcut={keysFor.hit} disabled={!canHit(table)} onClick={onHit} />
                            <ActionButton label="Stand" shortcut={keysFor.stand} onClick={onStand} />
                            <ActionButton label="Double" shortcut={keysFor.double} disabled={!canDouble(table)} onClick={onDouble} />
                            <ActionButton label="Split" shortcut={keysFor.split} disabled={!canSplit(table)} onClick={onSplit} />
                        </div>
                    )}
                    {table.phase === "insurance" && (
                        <div className="flex w-full max-w-sm gap-2">
                            <ActionButton label="Insure" shortcut={keysFor.insure} disabled={!canInsure(table)} onClick={() => onInsurance(true)} />
                            <ActionButton label="No thanks" shortcut={keysFor.decline} onClick={() => onInsurance(false)} />
                        </div>
                    )}
                    {waiting && (
                        <>
                            <div className="flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 [@media(max-height:520px)]:flex-nowrap">
                                <div className="flex flex-row-reverse justify-center gap-1">
                                    {Array.from({ length: table.spots }, (_, spot) => (
                                        <SpotBet key={spot} spot={spot} bet={table.bets[spot]} selected={spot === selectedSpot} showKeys={table.spots > 1} onSelect={() => onSelectSpot(spot)} onChange={(direction) => onBet(spot, direction)} />
                                    ))}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1">
                                        <Button variant="outline" size="sm" aria-label="Fewer spots" disabled={table.spots <= 1} className="h-7 px-2" onClick={() => onSpots(-1)}>&minus;<span className="ml-1 hidden [@media(pointer:fine)]:inline"><Kbd>{keysFor.fewerSpots}</Kbd></span></Button>
                                        <Label tone="fg" className="w-14 text-center">{table.spots} spot{table.spots > 1 ? "s" : ""}</Label>
                                        <Button variant="outline" size="sm" aria-label="More spots" disabled={table.spots >= MAX_SPOTS} className="h-7 px-2" onClick={() => onSpots(1)}>+<span className="ml-1 hidden [@media(pointer:fine)]:inline"><Kbd>{keysFor.moreSpots}</Kbd></span></Button>
                                    </div>
                                    {table.spots > 1 && (
                                        <Button variant="ghost" size="sm" className="h-6" onClick={onMatchBets}>Match spot {selectedSpot + 1} <span className="hidden [@media(pointer:fine)]:inline"><Kbd>{keysFor.matchBets}</Kbd></span></Button>
                                    )}
                                </div>
                            </div>
                            <Button size="md" disabled={!canDeal(table)} className="w-full max-w-xs [@media(max-height:520px)]:h-8" onClick={onDeal}>Deal <span className="hidden [@media(pointer:fine)]:inline"><Kbd>Any key</Kbd></span></Button>
                        </>
                    )}
                </div>

                <div className="flex min-h-[2.25rem] flex-wrap items-center justify-center gap-x-3 gap-y-0.5 [@media(max-height:520px)]:min-h-0">
                    <Button variant="ghost" size="sm" className="h-6" aria-pressed={showCount} onClick={onToggleCount}>
                        {showCount ? "Hide count" : "Show count"} <span className="hidden [@media(pointer:fine)]:inline"><Kbd>{keysFor.count}</Kbd></span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6" aria-haspopup="dialog" onClick={onOpenRules}>
                        Rules <span className="hidden [@media(pointer:fine)]:inline"><Kbd>{keysFor.rules}</Kbd></span>
                    </Button>
                    {showCount && <Label tone="fg">Running {formatTag(table.running)}{" // "}True {formatTag(trueCount(table))}{" // "}{decksLeft(table).toFixed(1)} decks left</Label>}
                    {table.shuffled && <Label tone="accent">New shoe</Label>}
                </div>
            </div>
        </div>
    );
};
