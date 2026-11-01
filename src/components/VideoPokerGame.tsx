"use client"

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PlayingCard, describeCard } from "@/components/PlayingCard";
import { Button, CornerBrackets, Display, Label, Stat, Theme } from "@/components/theme";
import { motionEnabled } from "@/components/theme/cells";
import { Game, Variant, VariantId, deal, draw, getBasePay, getBet, getGoldMultiplier, getMultiplier, getOtherHands, getVariant, handColor, newGame, partlySettled, settleOrder, toggleHold } from "@/lib/videoPoker";

const HOLD_KEYS = ["a", "s", "d", "f", "g"];
// How long each hand takes to settle after a multi-hand draw.
const SETTLE_MS = 80;

const formatMoney = (amount: number) => `${amount < 0 ? "-" : ""}$${Math.abs(amount).toLocaleString("en-US")}`;

const handCss = (id: string) => `rgb(var(--m-${handColor(id)}))`;

const nameOf = (variant: Variant, id: string) => variant.categories.find((category) => category.id === id)!.name;

// A big multiplier readout. Lit once it is worth more than x1.
const MultiplierChip = ({ value, inverted = false, color, className = "" }: { value: number; inverted?: boolean; color?: string; className?: string }) => (
    <span style={color ? { color } : undefined} className={`inline-flex items-center justify-center px-[0.3em] font-m-display font-black leading-none tabular-nums [font-stretch:75%] ${inverted ? "bg-m-accent-fg text-m-accent" : value > 1 ? "bg-m-accent text-m-accent-fg" : "text-m-muted"} ${className}`}>
        &times;{value}
    </span>
);

const Paytable = ({ variant, game }: { variant: Variant; game: Game }) => {
    const lastColumn = variant.mode === "ultimate" ? "Next" : variant.mode === "gold" ? "Now" : null;
    return (
        <table className="w-full border-collapse font-m-mono text-xs uppercase tracking-[0.06em]">
            <caption className="sr-only">What each hand pays for this bet{lastColumn ? ", and its multiplier" : ""}</caption>
            <thead>
                <tr className="border-b border-m-line/20 text-[10px] text-m-muted">
                    <th scope="col" className="py-1.5 pl-2 text-left font-medium">Hand</th>
                    <th scope="col" className="py-1.5 pr-2 text-right font-medium">Pays</th>
                    {lastColumn && <th scope="col" className="w-14 py-1.5 pr-2 text-right font-medium">{lastColumn}</th>}
                </tr>
            </thead>
            <tbody>
                {variant.categories.map((category) => {
                    const hit = game.results.includes(category.id);
                    const multiplier = variant.mode === "ultimate" ? category.earns ?? 1 : getGoldMultiplier(variant, game, category.id);
                    const raised = game.upgraded.includes(category.id);
                    return (
                        <tr key={category.id} style={hit ? { backgroundColor: handCss(category.id) } : undefined} className={`border-b border-m-line/15 ${hit ? "text-m-ink" : raised ? "bg-m-fg/10" : ""}`}>
                            <th scope="row" className="py-[clamp(2px,0.65vh,8px)] pl-2 text-left font-medium">
                                <span className="flex items-center gap-1.5">
                                    <span aria-hidden data-hand-swatch className={`h-2 w-2 shrink-0 ${hit ? "bg-m-ink" : ""}`} style={hit ? undefined : { backgroundColor: handCss(category.id) }} />
                                    {category.name}
                                </span>
                            </th>
                            <td className={`pr-2 text-right tabular-nums ${hit ? "" : "text-m-muted"}`}>{getBasePay(variant, category.id)}</td>
                            {lastColumn && (
                                <td className="pr-1 text-right">
                                    {(variant.mode === "ultimate" || category.progression) && (
                                        <MultiplierChip
                                            value={multiplier}
                                            inverted={hit}
                                            color={hit ? handCss(category.id) : undefined}
                                            className="text-lg"
                                        />
                                    )}
                                </td>
                            )}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

const RULES: Record<Variant["mode"], (variant: Variant) => string> = {
    plain: () => "Each hand bets 5 $1 coins.",
    ultimate: () => "Each hand bets 10 $1 coins and pays on 5. A win pays times its line's multiplier, then sets that line's multiplier for the next hand. Losing resets it to x1.",
    gold: () => "Each hand bets 10 $1 coins and pays on 5. A dealt win raises the multipliers above it. A multiplier waits until you hit that hand, on any line, then drops back.",
};

const PaytablePanel = ({ variant, game }: { variant: Variant; game: Game }) => (
    <div className="min-h-0 overflow-y-auto border border-m-line/20 bg-m-surface">
        <div className="flex items-center justify-between border-b border-m-line/20 px-2 py-1.5">
            <Label>Paytable</Label>
            <Label>{variant.payTable}</Label>
        </div>
        <Paytable variant={variant} game={game} />
        <p className="m-0 p-2 font-m-mono text-[10px] normal-case leading-relaxed text-m-muted">
            {RULES[variant.mode](variant)} Returns {(variant.publishedReturn * 100).toFixed(2)}% with perfect play.
        </p>
    </div>
);

// Fits the cards to whichever runs out first, the width or the height of the cell.
const smallCardWidth = "min(19.2cqw, calc((100cqh - clamp(18px, 30cqh, 38px) - 2px) * 0.714))";

const OtherHand = ({ variant, game, index, waiting }: { variant: Variant; game: Game; index: number; waiting: boolean }) => {
    const line = index + 1;
    const result = game.results[line];
    const win = game.lineWins[line] ?? 0;
    const settled = game.phase === "settled" && !waiting;
    const earned = game.nextLineMultipliers[line];
    const goldMultiplier = variant.mode === "gold" && result ? getGoldMultiplier(variant, game, result) : 1;
    const multiplier = result ? getMultiplier(variant, game, result, line) : game.lineMultipliers[line];

    return (
        <div className="min-h-0 min-w-0 [container-type:size]">
            <div className="flex h-full flex-col items-center justify-between">
                <div style={win > 0 && result ? { outlineColor: handCss(result) } : undefined} className={`flex justify-center gap-px sm:gap-0.5 ${settled && win === 0 ? "opacity-40" : ""} ${win > 0 ? "outline outline-[3px] outline-offset-1" : ""}`}>
                    {getOtherHands(variant, game)[index].map((card, i) => (
                        <div key={i} style={{ width: smallCardWidth }}>
                            <PlayingCard card={card} size="small" />
                        </div>
                    ))}
                </div>
                <div className="flex w-full items-stretch justify-between gap-1 text-[clamp(13px,24cqh,28px)]" style={{ height: "clamp(18px, 30cqh, 38px)" }}>
                    <span className="flex items-stretch gap-1">
                        {variant.mode === "ultimate" && <MultiplierChip value={multiplier} />}
                        {variant.mode === "ultimate" && settled && earned > 1 && (
                            <span className="flex items-center gap-0.5 text-m-accent">
                                <span className="font-m-mono text-[0.55em] font-bold">NEXT</span>
                                <MultiplierChip value={earned} className="self-stretch" />
                            </span>
                        )}
                    </span>
                    {win > 0 && result && (
                        <span className="flex min-w-0 items-center gap-1 px-1 text-m-ink" style={{ backgroundColor: handCss(result) }} title={nameOf(variant, result)}>
                            <span className="hidden truncate font-m-mono text-[0.5em] font-semibold uppercase [@container(min-width:240px)]:inline">{nameOf(variant, result)}</span>
                            {goldMultiplier > 1 && <MultiplierChip value={goldMultiplier} inverted color={handCss(result)} />}
                            <span className="font-m-display font-black tabular-nums [font-stretch:75%]">+{win}</span>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const MainHand = ({ variant, game, onHold, drawing }: { variant: Variant; game: Game; onHold: (i: number) => void; drawing: boolean }) => {
    const holding = game.phase === "holding";
    const settled = game.phase === "settled";
    const result = settled ? game.results[0] : game.dealtResult;
    const win = game.lineWins[0] ?? 0;
    const dealtPays = holding && result ? getBasePay(variant, result) * getMultiplier(variant, game, result, 0) : 0;
    const status = settled
        ? (win > 0 && result ? `${nameOf(variant, result)} +${win}` : game.won > 0 ? "Other hands hit" : drawing ? "Drawing" : "No win")
        : game.phase === "idle" ? "Shuffling"
        : dealtPays > 0 && result ? `Dealt ${nameOf(variant, result)}, pays ${dealtPays}` : "Choose cards to hold";

    return (
        <div className="min-h-0 [container-type:size]">
            <div className="flex h-full flex-col items-center justify-center gap-[1.5cqh]">
                <div className="flex w-full max-w-3xl items-center justify-center gap-3 text-[clamp(22px,13cqh,54px)]">
                    {variant.mode === "ultimate" && <MultiplierChip value={game.lineMultipliers[0]} className="self-stretch" />}
                    <div aria-live="polite" className="min-w-0 flex-1 text-center">
                        <div style={win > 0 && result ? { color: handCss(result) } : undefined} className="font-m-display font-black uppercase leading-none tracking-tight [font-size:0.6em] [font-stretch:125%]">
                            {status}
                        </div>
                        {holding && game.upgraded.length > 0 && (
                            <Label tone="accent">Raised {game.upgraded.map((id) => nameOf(variant, id)).join(", ")}</Label>
                        )}
                    </div>
                    {variant.mode === "ultimate" && settled && (
                        <span className="flex items-center gap-1">
                            <span className="font-m-mono text-[0.3em] font-bold text-m-muted">NEXT</span>
                            <MultiplierChip value={game.nextLineMultipliers[0]} className="self-stretch" />
                        </span>
                    )}
                </div>
                <div style={win > 0 && result ? { outlineColor: handCss(result) } : undefined} className={`flex justify-center gap-[1.2cqw] ${win > 0 ? "outline outline-[3px] outline-offset-4" : ""}`}>
                    {game.hand.map((card, i) => {
                        const held = game.holds[i];
                        return (
                            <div key={i} className="flex flex-col gap-1" style={{ width: "min(18.5cqw, calc((84cqh - 3.2rem) * 0.714), 11.5rem)" }}>
                                <button
                                    type="button"
                                    disabled={!holding || !card}
                                    aria-pressed={holding ? held : undefined}
                                    aria-label={card ? `${held ? "Release" : "Hold"} ${describeCard(card)}` : "Face down card"}
                                    onClick={() => onHold(i)}
                                    className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m-fg focus-visible:ring-offset-2 focus-visible:ring-offset-m-bg"
                                >
                                    <PlayingCard card={card} className={held ? "border-2 border-m-accent" : ""} />
                                </button>
                                <div className={`flex h-5 items-center justify-center font-m-mono text-[10px] font-bold uppercase tracking-[0.14em] ${held ? "bg-m-accent text-m-accent-fg" : "text-m-muted"}`}>
                                    {held ? "Held" : <span className="hidden md:inline">{HOLD_KEYS[i]}</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Active Gold multipliers, for screens where the paytable is tucked away.
const GoldStrip = ({ variant, game }: { variant: Variant; game: Game }) => (
    <div className="flex flex-wrap items-center gap-1.5 min-[900px]:hidden">
        {variant.categories.filter((c) => c.progression && getGoldMultiplier(variant, game, c.id) > 1).map((c) => (
            <span key={c.id} className="flex items-center gap-1 border border-m-line/20 pl-1 font-m-mono text-[10px] uppercase">
                {c.name}
                <MultiplierChip value={getGoldMultiplier(variant, game, c.id)} className="self-stretch text-base" />
            </span>
        ))}
    </div>
);

// Grid shape for the extra hands. Portrait phones get two wide columns so the cards stay readable.
const OTHER_GRID: Record<number, string> = {
    9: "grid-cols-2 grid-rows-5 min-[640px]:grid-cols-3 min-[640px]:grid-rows-3 [@media(max-height:520px)]:grid-cols-3 [@media(max-height:520px)]:grid-rows-3",
    4: "grid-cols-2 grid-rows-2",
};

export const VideoPokerGame = ({ id }: { id: VariantId }) => {
    const variant = getVariant(id);
    const [game, setGame] = useState<Game>(() => newGame(variant));
    const [paytableOpen, setPaytableOpen] = useState(false);
    // How many hands have settled since the draw. Everything else on screen follows from this.
    const [shown, setShown] = useState(Infinity);
    const drawing = game.phase === "settled" && shown < variant.hands;
    // Measured when the draw starts, since the grid's shape depends on the screen.
    const othersGrid = useRef<HTMLDivElement>(null);
    const [columns, setColumns] = useState(1);
    const visible = useMemo(() => partlySettled(variant, game, shown, columns), [variant, game, shown, columns]);
    const waitingLines = useMemo(() => new Set(settleOrder(variant, columns).slice(shown)), [variant, shown, columns]);

    // Dealt after mount, because a shuffle during render gives the server and browser different hands.
    useEffect(() => setGame((current) => current.phase === "idle" ? deal(variant, current) : current), [variant]);

    useEffect(() => {
        if (!drawing) return;
        const timer = setInterval(() => setShown((count) => count + 1), SETTLE_MS);
        return () => clearInterval(timer);
    }, [drawing]);

    const handleDeal = useCallback(() => {
        // Pressing again while the hands settle finishes them right away.
        if (drawing) return setShown(Infinity);
        if (othersGrid.current) setColumns(getComputedStyle(othersGrid.current).gridTemplateColumns.split(" ").length);
        setShown(game.phase === "holding" && variant.hands > 1 && motionEnabled() ? 1 : Infinity);
        setGame((current) => current.phase === "holding" ? draw(variant, current) : deal(variant, current));
    }, [variant, drawing, game.phase]);

    useEffect(() => {
        const onKeydown = (e: KeyboardEvent) => {
            if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
            const holdIndex = HOLD_KEYS.indexOf(e.key.toLowerCase());
            if (holdIndex >= 0) setGame((current) => toggleHold(current, holdIndex));
            // A focused button or link already handles Enter with its own click.
            if (e.key === "Enter" && !(e.target as Element).closest?.("button, a")) handleDeal();
        };
        document.addEventListener("keydown", onKeydown);
        return () => document.removeEventListener("keydown", onKeydown);
    }, [handleDeal]);

    const holding = game.phase === "holding";
    const multiHand = variant.hands > 1;

    return (
        <Theme tone="dark" className="relative flex h-dvh w-screen flex-col gap-2 overflow-hidden p-3 sm:p-5">
            <CornerBrackets size={20} offset={6} className="text-m-fg/40" />

            <header className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
                    <Link href="/showcase" className="shrink-0">
                        <Label className="hover:text-m-fg">&larr; Showcase</Label>
                    </Link>
                    <Link href="/blog/video-poker-math" className="shrink-0">
                        <Label className="hover:text-m-fg">The math</Label>
                    </Link>
                    <Display as="h1" size="sm" slop>{variant.name}</Display>
                </div>
                <Button variant="outline" size="sm" className="shrink-0 min-[900px]:hidden" onClick={() => setPaytableOpen(true)}>Paytable</Button>
            </header>

            <div className="grid min-h-0 flex-1 gap-4 min-[900px]:grid-cols-[17rem_minmax(0,1fr)]">
                <div className="hidden min-h-0 min-[900px]:flex min-[900px]:flex-col">
                    <PaytablePanel variant={variant} game={visible} />
                </div>
                {/* Short windows, such as a phone on its side, put the main hand beside the others. */}
                <div className="flex min-h-0 min-w-0 flex-col gap-2 [@media(max-height:520px)]:flex-row">
                    {variant.mode === "gold" && <div className="[@media(max-height:520px)]:hidden"><GoldStrip variant={variant} game={game} /></div>}
                    {multiHand && (
                        <div ref={othersGrid} className={`grid min-h-0 flex-[3] gap-x-2 gap-y-1 sm:gap-x-4 sm:gap-y-2 ${OTHER_GRID[variant.hands - 1]}`}>
                            {Array.from({ length: variant.hands - 1 }, (_, i) => <OtherHand key={i} variant={variant} game={visible} index={i} waiting={waitingLines.has(i + 1)} />)}
                        </div>
                    )}
                    <div className={`grid min-h-0 ${multiHand ? "flex-[2]" : "flex-1"}`}>
                        <MainHand variant={variant} game={visible} drawing={drawing} onHold={(i) => setGame((current) => toggleHold(current, i))} />
                    </div>
                </div>
            </div>

            <footer className="flex flex-wrap items-end justify-between gap-x-5 gap-y-2">
                <div className="flex items-end gap-4">
                    <Stat label="Balance" value={formatMoney(visible.balance)} valueClassName="text-2xl sm:text-4xl" className={visible.balance < 0 ? "text-m-orange" : ""} />
                    <Stat label="Bet" value={formatMoney(getBet(variant))} valueClassName="text-2xl sm:text-4xl" />
                    <div className={`flex flex-col gap-1 px-3 py-1 ${visible.won > 0 ? "bg-m-accent text-m-accent-fg" : "border-l border-m-line/25"}`}>
                        <Label className={visible.won > 0 ? "text-m-accent-fg" : ""}>{game.phase === "settled" ? "Won" : "Win"}</Label>
                        <span className="font-m-display text-[clamp(1.75rem,6vh,3.75rem)] font-black leading-none tabular-nums [font-stretch:75%]">
                            {formatMoney(visible.won)}
                        </span>
                    </div>
                </div>
                <div className="flex flex-1 items-center justify-end gap-2">
                    <Label className="mr-2 hidden lg:block">A S D F G to hold{" // "}Enter to {holding ? "draw" : drawing ? "skip" : "deal"}</Label>
                    <Button variant="ghost" size="lg" onClick={() => { setShown(Infinity); setGame(deal(variant, newGame(variant))); }}>Reset</Button>
                    <Button size="lg" disabled={game.phase === "idle"} onClick={handleDeal} className="flex-1 sm:w-40 sm:flex-none">
                        {holding ? "Draw" : drawing ? "Skip" : "Deal"}
                    </Button>
                </div>
            </footer>

            {paytableOpen && (
                <div className="absolute inset-0 z-50 flex flex-col gap-2 bg-m-bg p-3 min-[900px]:hidden">
                    <Button variant="outline" size="sm" className="self-end" onClick={() => setPaytableOpen(false)}>Close</Button>
                    <PaytablePanel variant={variant} game={visible} />
                </div>
            )}
        </Theme>
    );
};
