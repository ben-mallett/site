"use client"

import Link from "next/link";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { PlayingCard, describeCard } from "@/components/PlayingCard";
import { AnswerBox, Kbd, KeysPanel, Keypad, StatLine, Verdict, blankScore, keyName, normalizeKey, parseAnswer, percentOf, scoreAnswer, useKeybinds } from "@/components/TrainerKit";
import { Button, CornerBrackets, Display, Label, Slop, Theme } from "@/components/theme";
import { CallSpot, Showdown, TurnSpot, cardCode, handName, newCallSpot, newOutsSpot, newShowdown } from "@/lib/holdem";
import { PokerCard } from "@/lib/pokerUtils";

type Mode = "showdown" | "outs" | "call"

const ACTIONS = [
    { id: "modeShowdown", label: "Showdown", group: "Modes", key: "q" },
    { id: "modeOuts", label: "Outs", group: "Modes", key: "w" },
    { id: "modeCall", label: "Call or fold", group: "Modes", key: "e" },
    { id: "left", label: "Left hand wins", group: "Showdown", key: "j" },
    { id: "tie", label: "Split pot", group: "Showdown", key: "k" },
    { id: "right", label: "Right hand wins", group: "Showdown", key: "l" },
    { id: "fold", label: "Fold", group: "Call or fold", key: "f" },
    { id: "call", label: "Call", group: "Call or fold", key: "c" },
    { id: "restart", label: "Restart this drill", group: "General", key: "r" },
    { id: "help", label: "Keyboard help", group: "General", key: "?" },
] as const

type ActionId = (typeof ACTIONS)[number]["id"]

// These always do the same thing, so they can't be rebound. The arrows follow the layout of the screen.
const ALIASES: Record<string, ActionId> = { arrowleft: "left", arrowdown: "tie", arrowright: "right", "/": "help" }
const RESERVED = ["-", "+", "=", "arrowup"]

// Two rows of cards share the table's height, after room for the seat titles and notes.
const NON_DEALING_ACTIONS: ActionId[] = ["modeShowdown", "modeOuts", "modeCall", "restart", "help"]
// Pressed alone, these aren't a choice to move on. Tab and Esc are handled before this check.
const MODIFIER_KEYS = ["shift", "control", "alt", "meta", "capslock", "fn", "contextmenu"]

const CARD_WIDTH = "min(18cqw, calc((100cqh - 3.75rem) * 0.34), 8.5rem)"

const Cards = ({ cards, label }: { cards: PokerCard[]; label: string }) => (
    <div className="flex justify-center gap-[1cqw]" role="img" aria-label={`${label}: ${cards.map(describeCard).join(", ")}`}>
        {cards.map((card) => <div key={`${card.value}${card.suit}`} style={{ width: CARD_WIDTH }}><PlayingCard card={card} /></div>)}
    </div>
);

const Seat = ({ title, cards, note }: { title: string; cards: PokerCard[]; note?: ReactNode }) => (
    <div className="flex flex-col items-center gap-1">
        <Label tone="fg">{title}</Label>
        <Cards cards={cards} label={title} />
        <div className="flex h-4 items-center font-m-mono text-[11px] font-semibold uppercase text-m-accent">{note}</div>
    </div>
);

// The same table for every drill: two hands above the board.
const Table = ({ left, right, leftTitle, rightTitle, board, leftNote, rightNote }: { left: PokerCard[]; right: PokerCard[]; leftTitle: string; rightTitle: string; board: PokerCard[]; leftNote?: ReactNode; rightNote?: ReactNode }) => (
    <div className="min-h-0 min-w-0 w-full flex-1 self-stretch [container-type:size]">
        <div className="flex h-full flex-col items-center justify-center gap-1">
            <div className="flex justify-center gap-[6cqw]">
                <Seat title={leftTitle} cards={left} note={leftNote} />
                <Seat title={rightTitle} cards={right} note={rightNote} />
            </div>
            <Cards cards={board} label="Board" />
        </div>
    </div>
);

// Everything under the table. It takes the height it needs, and the cards scale to what is left.
const Controls = ({ children }: { children: ReactNode }) => (
    <div className="flex w-full shrink-0 flex-col items-center gap-2 [@media(max-height:520px)]:w-[45%]">{children}</div>
);

const money = (value: number) => `${value < 0 ? "−" : ""}$${Math.abs(value).toFixed(2).replace(/\.00$/, "")}`;
const share = (value: number) => `${(value * 100).toFixed(1)}%`;

const NextButton = ({ onClick }: { onClick: () => void }) => (
    <Button size="lg" onClick={onClick}>Next <span className="hidden [@media(pointer:fine)]:inline"><Kbd>Any key</Kbd></span></Button>
);

const AnswerButton = ({ label, onClick, shortcuts }: { label: string; onClick: () => void; shortcuts: string[] }) => (
    <Button variant="outline" size="lg" className="h-[clamp(2.75rem,11cqh,4.5rem)] min-w-0 flex-1 flex-col gap-1 px-1" onClick={onClick}>
        <span className="font-m-display text-[clamp(0.8rem,3.2cqh,1.25rem)] font-black leading-none">{label}</span>
        <span className="hidden gap-1 [@media(pointer:fine)]:flex">{shortcuts.map((key) => <Kbd key={key}>{key}</Kbd>)}</span>
    </Button>
);

export const HoldemTrainer = () => {
    const [mode, setMode] = useState<Mode>("showdown");
    const keys = useKeybinds<ActionId>(ACTIONS, ALIASES, RESERVED, "hold-em-keys");
    const { bindings, keyToAction, helpOpen, setHelpOpen } = keys;
    const [answer, setAnswer] = useState("");

    const [showdown, setShowdown] = useState<Showdown | null>(null);
    const [showdownGuess, setShowdownGuess] = useState<Showdown["winner"] | null>(null);
    const [showdownScore, setShowdownScore] = useState(blankScore);

    const [outsSpot, setOutsSpot] = useState<TurnSpot | null>(null);
    const [outsGuess, setOutsGuess] = useState<number | null>(null);
    const [outsScore, setOutsScore] = useState(blankScore);

    const [callSpot, setCallSpot] = useState<CallSpot | null>(null);
    const [callGuess, setCallGuess] = useState<boolean | null>(null);
    const [callScore, setCallScore] = useState(blankScore);
    const [lost, setLost] = useState(0);

    // Dealt after mount, because a shuffle during render gives the server and browser different hands.
    useEffect(() => {
        setShowdown(newShowdown());
        setOutsSpot(newOutsSpot());
        setCallSpot(newCallSpot());
    }, []);

    const answerShowdown = useCallback((guess: Showdown["winner"]) => {
        if (!showdown || showdownGuess) return;
        setShowdownGuess(guess);
        setShowdownScore((score) => scoreAnswer(score, guess === showdown.winner));
    }, [showdown, showdownGuess]);

    const submitOuts = useCallback(() => {
        const guess = parseAnswer(answer);
        if (guess === null || !outsSpot || outsGuess !== null) return;
        setOutsGuess(guess);
        setOutsScore((score) => scoreAnswer(score, guess === outsSpot.outs.length));
    }, [answer, outsGuess, outsSpot]);

    const answerCall = useCallback((calling: boolean) => {
        if (!callSpot || callGuess !== null) return;
        setCallGuess(calling);
        setCallScore((score) => scoreAnswer(score, calling === callSpot.shouldCall));
        // A mistake costs the difference between the two choices, and folding is always worth zero.
        if (calling !== callSpot.shouldCall) setLost((total) => total + Math.abs(callSpot.callValue));
    }, [callGuess, callSpot]);

    const next = useCallback(() => {
        if (mode === "showdown" && showdownGuess) {
            setShowdown(newShowdown());
            setShowdownGuess(null);
        } else if (mode === "outs" && outsGuess !== null) {
            setOutsSpot(newOutsSpot());
            setOutsGuess(null);
            setAnswer("");
        } else if (mode === "call" && callGuess !== null) {
            setCallSpot(newCallSpot());
            setCallGuess(null);
        }
    }, [callGuess, mode, outsGuess, showdownGuess]);

    const restart = useCallback(() => {
        setAnswer("");
        if (mode === "showdown") {
            setShowdown(newShowdown());
            setShowdownGuess(null);
            setShowdownScore(blankScore);
        } else if (mode === "outs") {
            setOutsSpot(newOutsSpot());
            setOutsGuess(null);
            setOutsScore(blankScore);
        } else {
            setCallSpot(newCallSpot());
            setCallGuess(null);
            setCallScore(blankScore);
            setLost(0);
        }
    }, [mode]);

    const typeAnswer = useCallback((key: string) => {
        setAnswer((text) => {
            if (/^[0-9]$/.test(key)) return text === "0" ? key : text.length >= 2 ? text : text + key;
            if (key === "backspace") return text.slice(0, -1);
            const value = parseAnswer(text) ?? 0;
            if (key === "arrowup") return String(value + 1);
            if (key === "arrowdown") return String(Math.max(0, value - 1));
            return text;
        });
    }, []);

    const confirm = useCallback(() => {
        if (mode === "outs" && outsGuess === null) submitOuts();
        else next();
    }, [mode, next, outsGuess, submitOuts]);

    const panelKey = useCallback((key: string) => {
        if (key === "enter") confirm();
        else typeAnswer(key);
    }, [confirm, typeAnswer]);

    const runAction = useCallback((action: ActionId) => {
        switch (action) {
            case "modeShowdown": return setMode("showdown");
            case "modeOuts": return setMode("outs");
            case "modeCall": return setMode("call");
            case "help": return setHelpOpen((open) => !open);
            case "restart": return restart();
            case "left": if (mode === "showdown") answerShowdown("first"); else if (mode === "call") answerCall(false); return;
            case "tie": if (mode === "showdown") answerShowdown("tie"); return;
            case "right": if (mode === "showdown") answerShowdown("second"); else if (mode === "call") answerCall(true); return;
            case "fold": if (mode === "call") answerCall(false); return;
            case "call": if (mode === "call") answerCall(true); return;
        }
    }, [answerCall, answerShowdown, mode, next, restart, setHelpOpen]);

    const answeringOuts = mode === "outs" && outsGuess === null;
    const showingResult = (mode === "showdown" && showdownGuess !== null) || (mode === "outs" && outsGuess !== null) || (mode === "call" && callGuess !== null);

    useEffect(() => {
        const onKeydown = (e: KeyboardEvent) => {
            if (keys.captureKey(e)) return;
            const key = normalizeKey(e.key);
            if (e.metaKey || e.ctrlKey || e.altKey || key === "tab") return;

            if (key === "escape") {
                if (helpOpen) keys.close();
                return;
            }

            // A button reached with the keyboard keeps its own Enter and Space.
            const onFocusedButton = (e.target as Element).closest?.("button, a")?.matches(":focus-visible");
            if (onFocusedButton && (key === "enter" || key === "space")) return;

            if (helpOpen) {
                if (keyToAction.get(key) === "help") {
                    e.preventDefault();
                    keys.close();
                }
                return;
            }

            if (e.repeat && key !== "backspace") return;

            if (answeringOuts && (/^[0-9]$/.test(key) || ["backspace", "arrowup", "arrowdown"].includes(key))) {
                e.preventDefault();
                typeAnswer(key);
                return;
            }

            if (key === "enter") {
                e.preventDefault();
                confirm();
                return;
            }

            const action = keyToAction.get(key);

            // On a result, any key deals the next hand. Keys that switch drills, restart, or open help keep their jobs.
            if (showingResult && !NON_DEALING_ACTIONS.includes(action as ActionId) && !MODIFIER_KEYS.includes(key)) {
                e.preventDefault();
                next();
                return;
            }

            if (action) {
                e.preventDefault();
                runAction(action);
            }
        };
        document.addEventListener("keydown", onKeydown);
        return () => document.removeEventListener("keydown", onKeydown);
    });

    const tabs: { id: Mode; label: string; action: ActionId }[] = [
        { id: "showdown", label: "Showdown", action: "modeShowdown" },
        { id: "outs", label: "Outs", action: "modeOuts" },
        { id: "call", label: "Call or fold", action: "modeCall" },
    ];

    const seatNames = (spot: Showdown) => [handName(spot.firstScore), handName(spot.secondScore)];

    return (
        <Theme tone="dark" className="relative flex h-dvh w-screen flex-col gap-2 overflow-hidden p-3 sm:p-5">
            <CornerBrackets size={20} offset={6} className="text-m-fg/40" />

            <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
                    <Link href="/showcase" className="shrink-0">
                        <Label className="hover:text-m-fg">&larr; Showcase</Label>
                    </Link>
                    <Link href="/blog/texas-hold-em-math" className="shrink-0">
                        <Label className="hover:text-m-fg">The math</Label>
                    </Link>
                    <Display as="h1" size="sm"><Slop face="wide">Hold-em </Slop><Slop face="serif">trainer</Slop></Display>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                    {tabs.map((tab) => (
                        <Button key={tab.id} size="sm" variant={mode === tab.id ? "solid" : "outline"} aria-pressed={mode === tab.id} onClick={() => setMode(tab.id)}>
                            {tab.label} <span className="hidden [@media(pointer:fine)]:inline"><Kbd>{keyName(bindings[tab.action])}</Kbd></span>
                        </Button>
                    ))}
                    <Button size="sm" variant="ghost" aria-label="Keyboard help" onClick={() => setHelpOpen(true)}>
                        Keys <Kbd>{keyName(bindings.help)}</Kbd>
                    </Button>
                </div>
            </header>

            <main className="min-h-0 flex-1 [container-type:size]">
                <div className="flex h-full flex-col items-center justify-center gap-2 [@media(max-height:520px)]:flex-row">
                    {mode === "showdown" && showdown && (
                        <>
                            <Table
                                left={showdown.first}
                                right={showdown.second}
                                leftTitle="Left hand"
                                rightTitle="Right hand"
                                board={showdown.board}
                                leftNote={showdownGuess && seatNames(showdown)[0]}
                                rightNote={showdownGuess && seatNames(showdown)[1]}
                            />
                            <Controls>
                            {showdownGuess ? (
                                <>
                                    <Verdict correct={showdownGuess === showdown.winner}>
                                        {showdownGuess === showdown.winner ? "Correct" : "Incorrect"}: {showdown.winner === "tie" ? "the pot splits" : `${showdown.winner === "first" ? "left" : "right"} hand wins`}
                                    </Verdict>
                                    <NextButton onClick={next} />
                                </>
                            ) : (
                                <>
                                    <Label tone="fg">Who wins?</Label>
                                    <div className="flex w-full max-w-lg gap-2">
                                    <AnswerButton label="Left" onClick={() => answerShowdown("first")} shortcuts={[keyName(bindings.left), "←"]} />
                                    <AnswerButton label="Split" onClick={() => answerShowdown("tie")} shortcuts={[keyName(bindings.tie), "↓"]} />
                                    <AnswerButton label="Right" onClick={() => answerShowdown("second")} shortcuts={[keyName(bindings.right), "→"]} />
                                    </div>
                                </>
                            )}
                            </Controls>
                        </>
                    )}

                    {mode === "outs" && outsSpot && (
                        <>
                            <Table left={outsSpot.hero} right={outsSpot.villain} leftTitle="You" rightTitle="Opponent" board={outsSpot.board} />
                            <Controls>
                            {outsGuess === null ? (
                                <div className="flex w-full flex-col items-center gap-2">
                                    <AnswerBox answer={answer} prompt="How many river cards put you ahead?" hint={<>Type a number{" // "}<Kbd>Enter</Kbd> to check</>} />
                                    <Keypad onKey={panelKey} signed={false} />
                                </div>
                            ) : (
                                <>
                                    <Verdict correct={outsGuess === outsSpot.outs.length}>
                                        {outsGuess === outsSpot.outs.length ? "Correct" : `Incorrect, you said ${outsGuess}`}: {outsSpot.outs.length} outs, {share(outsSpot.outs.length / 44)} to hit
                                    </Verdict>
                                    <div className="flex max-w-3xl flex-wrap justify-center gap-1 font-m-mono text-xs" aria-label="Your outs">
                                        {outsSpot.outs.map((card) => <span key={`${card.value}${card.suit}`} className="border border-m-accent px-1 py-0.5">{cardCode(card)}</span>)}
                                    </div>
                                    {outsSpot.chops.length > 0 && <Label>Also {outsSpot.chops.length} that split the pot</Label>}
                                    <NextButton onClick={next} />
                                </>
                            )}
                            </Controls>
                        </>
                    )}

                    {mode === "call" && callSpot && (
                        <>
                            <Table left={callSpot.hero} right={callSpot.villain} leftTitle="You" rightTitle="Opponent" board={callSpot.board} />
                            <Controls>
                            <div className="flex items-baseline gap-6 font-m-display font-black [font-stretch:75%]">
                                <span className="text-[clamp(1.25rem,6cqh,2.5rem)]">Pot {money(callSpot.pot)}</span>
                                <span className="text-[clamp(1.25rem,6cqh,2.5rem)] text-m-accent">To call {money(callSpot.toCall)}</span>
                            </div>
                            {callGuess === null ? (
                                <div className="flex w-full max-w-md gap-2">
                                    <AnswerButton label="Fold" onClick={() => answerCall(false)} shortcuts={[keyName(bindings.fold), "←"]} />
                                    <AnswerButton label="Call" onClick={() => answerCall(true)} shortcuts={[keyName(bindings.call), "→"]} />
                                </div>
                            ) : (
                                <>
                                    <Verdict correct={callGuess === callSpot.shouldCall}>
                                        {callGuess === callSpot.shouldCall ? "Correct" : "Incorrect"}: {callSpot.shouldCall ? "call" : "fold"}, equity {share(callSpot.equity)}, need {share(callSpot.needed)}
                                    </Verdict>
                                    <Label tone="fg">Calling is worth {callSpot.callValue >= 0 ? "+" : ""}{money(callSpot.callValue)}{callSpot.chops.length > 0 ? ` // ${callSpot.outs.length} outs, ${callSpot.chops.length} split` : ` // ${callSpot.outs.length} outs`}</Label>
                                    <NextButton onClick={next} />
                                </>
                            )}
                            </Controls>
                        </>
                    )}
                </div>
            </main>

            <footer className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                {mode === "showdown" && (
                    <StatLine items={[["Accuracy", percentOf(showdownScore.correct, showdownScore.answered)], ["Hands", showdownScore.answered], ["Streak", showdownScore.streak], ["Best", showdownScore.best]]} />
                )}
                {mode === "outs" && (
                    <StatLine items={[["Accuracy", percentOf(outsScore.correct, outsScore.answered)], ["Hands", outsScore.answered], ["Streak", outsScore.streak], ["Best", outsScore.best]]} />
                )}
                {mode === "call" && (
                    <StatLine items={[["Accuracy", percentOf(callScore.correct, callScore.answered)], ["Hands", callScore.answered], ["Streak", callScore.streak], ["Lost to mistakes", money(lost)]]} />
                )}
                <Button variant="ghost" size="sm" onClick={restart}>Restart <span className="hidden [@media(pointer:fine)]:inline"><Kbd>{keyName(bindings.restart)}</Kbd></span></Button>
            </footer>

            <KeysPanel keys={keys} actions={ACTIONS}>
                <span>Always on: <Kbd>&larr;</Kbd> <Kbd>&darr;</Kbd> <Kbd>&rarr;</Kbd> answer left, split, right. In call or fold, <Kbd>&larr;</Kbd> folds and <Kbd>&rarr;</Kbd> calls</span>
                <span>Outs: <Kbd>0-9</Kbd> type, <Kbd>&uarr;</Kbd> <Kbd>&darr;</Kbd> step, <Kbd>{keyName("backspace")}</Kbd> delete, <Kbd>Enter</Kbd> check</span>
                <span>After an answer, any other key deals the next hand.</span>
                <span>Outs count river cards that put you strictly ahead. Both hands are face up, and calling assumes no more betting.</span>
            </KeysPanel>
        </Theme>
    );
};
