"use client"

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { PlayingCard, describeCard } from "@/components/PlayingCard";
import { AnswerBox, Kbd, KeysPanel, Keypad, StatLine, Verdict, blankScore, keyName, normalizeKey, parseAnswer, percentOf, scoreAnswer, useKeybinds } from "@/components/TrainerKit";
import { Button, CornerBrackets, Display, Label, Slop, Theme } from "@/components/theme";
import { Tag, countCards, formatTag, getTrueCount, newShoe, newTrueCountQuestion, tagOf } from "@/lib/hiLo";
import { PokerCard } from "@/lib/pokerUtils";

type Mode = "tags" | "running" | "true"

const ACTIONS = [
    { id: "modeTags", label: "Tag drill", group: "Modes", key: "q" },
    { id: "modeRunning", label: "Running count", group: "Modes", key: "w" },
    { id: "modeTrue", label: "True count", group: "Modes", key: "e" },
    { id: "tagMinus", label: "Tag −1 (10 to A)", group: "Tag drill", key: "j" },
    { id: "tagZero", label: "Tag 0 (7 to 9)", group: "Tag drill", key: "k" },
    { id: "tagPlus", label: "Tag +1 (2 to 6)", group: "Tag drill", key: "l" },
    { id: "play", label: "Start or pause", group: "Running count", key: "space" },
    { id: "slower", label: "Slower", group: "Running count", key: "[" },
    { id: "faster", label: "Faster", group: "Running count", key: "]" },
    { id: "flash", label: "Cards at a time", group: "Running count", key: "c" },
    { id: "length", label: "Cards in a run", group: "Running count", key: "n" },
    { id: "restart", label: "Restart this drill", group: "General", key: "r" },
    { id: "help", label: "Keyboard help", group: "General", key: "?" },
] as const

type ActionId = (typeof ACTIONS)[number]["id"]

// These always do the same thing, so they can't be rebound.
const ALIASES: Record<string, ActionId> = { arrowleft: "tagMinus", arrowdown: "tagZero", arrowright: "tagPlus", "/": "help" }
const RESERVED = ["-", "+", "=", "arrowup"]
const SPEEDS = [200, 300, 400, 500, 600, 800, 1000, 1250, 1500, 2000]
const LENGTHS = [26, 52, 104, 312]
const FLASHES = [1, 2, 3]
const nextIn = <T,>(list: T[], value: T) => list[(list.indexOf(value) + 1) % list.length]

const blankTagStats = { answered: 0, correct: 0, streak: 0, best: 0, totalMs: 0 }
// Short windows put the controls beside the card, so it can use the full height.
const cardWidthClass = (count: number) => count === 1
    ? "[--card:min(44cqw,calc((100cqh-10rem)*0.714),13rem)] [@media(max-height:520px)]:[--card:min(26cqw,calc((100cqh-1.5rem)*0.714))]"
    : "[--card:min(28cqw,calc((100cqh-10rem)*0.714),13rem)] [@media(max-height:520px)]:[--card:min(16cqw,calc((100cqh-1.5rem)*0.714))]"

const CardRow = ({ cards, label }: { cards: PokerCard[]; label?: string }) => (
    <div className={`flex justify-center gap-3 ${cardWidthClass(cards.length)}`} aria-label={label ?? cards.map(describeCard).join(", ")} role="img">
        {cards.map((card, i) => (
            <div key={i} className="w-[var(--card)]"><PlayingCard card={card} /></div>
        ))}
    </div>
);

export const HiLoTrainer = () => {
    const [mode, setMode] = useState<Mode>("tags");
    const keys = useKeybinds<ActionId>(ACTIONS, ALIASES, RESERVED, "hi-lo-keys");
    const { bindings, keyToAction, helpOpen, setHelpOpen } = keys;
    const [answer, setAnswer] = useState("");

    // Tag drill.
    const [tagShoe, setTagShoe] = useState<PokerCard[]>([]);
    const [tagIndex, setTagIndex] = useState(0);
    const [tagStats, setTagStats] = useState(blankTagStats);
    const [tagFeedback, setTagFeedback] = useState<{ card: PokerCard; guess: Tag; correct: boolean } | null>(null);
    const shownAt = useRef(0);

    // Running count drill.
    const [runPhase, setRunPhase] = useState<"ready" | "running" | "paused" | "answer" | "result">("ready");
    const [runShoe, setRunShoe] = useState<PokerCard[]>([]);
    const [runIndex, setRunIndex] = useState(0);
    const [speed, setSpeed] = useState(800);
    const [flash, setFlash] = useState(1);
    const [runLength, setRunLength] = useState(52);
    const [runScore, setRunScore] = useState(blankScore);
    const [runResult, setRunResult] = useState<{ guess: number; actual: number } | null>(null);

    // True count drill.
    const [question, setQuestion] = useState<{ running: number; decksLeft: number } | null>(null);
    const [trueScore, setTrueScore] = useState(blankScore);
    const [trueResult, setTrueResult] = useState<{ guess: number; actual: number } | null>(null);

    // Random and stored values only load after mount, so the server and browser render the same page.
    useEffect(() => {
        setTagShoe(newShoe(6));
        setRunShoe(newShoe(6));
        setQuestion(newTrueCountQuestion());
        shownAt.current = performance.now();
    }, []);

    const answerTag = useCallback((guess: Tag) => {
        const card = tagShoe[tagIndex];
        if (!card) return;
        const correct = tagOf(card) === guess;
        const elapsed = performance.now() - shownAt.current;
        setTagStats((stats) => {
            const streak = correct ? stats.streak + 1 : 0;
            return { answered: stats.answered + 1, correct: stats.correct + (correct ? 1 : 0), streak, best: Math.max(stats.best, streak), totalMs: stats.totalMs + elapsed };
        });
        setTagFeedback({ card, guess, correct });
        shownAt.current = performance.now();
        if (tagIndex + 1 >= tagShoe.length) {
            setTagShoe(newShoe(6));
            setTagIndex(0);
        } else {
            setTagIndex(tagIndex + 1);
        }
    }, [tagIndex, tagShoe]);

    const runEnd = Math.min(runLength, runShoe.length);
    const finished = runIndex >= runEnd;
    const shownCards = runShoe.slice(Math.max(0, runIndex - flash), runIndex);

    // Advances the run. The answer is asked for as soon as the last cards have had their full time.
    useEffect(() => {
        if (runPhase !== "running" || mode !== "running") return;
        const timer = window.setTimeout(() => {
            if (finished) {
                setRunPhase("answer");
                setAnswer("");
            } else {
                setRunIndex((index) => Math.min(index + flash, runEnd));
            }
        }, speed);
        return () => clearTimeout(timer);
    }, [finished, flash, mode, runEnd, runIndex, runPhase, speed]);

    const startNewRun = useCallback(() => {
        setRunShoe(newShoe(6));
        setRunIndex(0);
        setRunResult(null);
        setAnswer("");
        setRunPhase("ready");
    }, []);

    const startPause = useCallback(() => {
        if (runPhase === "ready") {
            setRunIndex(flash);
            setRunPhase("running");
        } else if (runPhase === "running") {
            setRunPhase("paused");
        } else if (runPhase === "paused") {
            setRunPhase("running");
        }
    }, [flash, runPhase]);

    const submitRun = useCallback(() => {
        const guess = parseAnswer(answer);
        if (guess === null) return;
        const actual = countCards(runShoe.slice(0, runIndex));
        setRunScore((score) => scoreAnswer(score, guess === actual));
        setRunResult({ guess, actual });
        setRunPhase("result");
    }, [answer, runIndex, runShoe]);

    const continueRun = useCallback(() => {
        if (finished) return startNewRun();
        setRunResult(null);
        setAnswer("");
        setRunPhase("paused");
    }, [finished, startNewRun]);

    const submitTrue = useCallback(() => {
        const guess = parseAnswer(answer);
        if (guess === null || !question) return;
        const actual = getTrueCount(question.running, question.decksLeft);
        setTrueScore((score) => scoreAnswer(score, guess === actual));
        setTrueResult({ guess, actual });
    }, [answer, question]);

    const nextTrue = useCallback(() => {
        setQuestion(newTrueCountQuestion());
        setTrueResult(null);
        setAnswer("");
    }, []);

    const restart = useCallback(() => {
        setAnswer("");
        if (mode === "tags") {
            setTagShoe(newShoe(6));
            setTagIndex(0);
            setTagStats(blankTagStats);
            setTagFeedback(null);
            shownAt.current = performance.now();
        } else if (mode === "running") {
            setRunScore(blankScore);
            startNewRun();
        } else {
            setTrueScore(blankScore);
            nextTrue();
        }
    }, [mode, nextTrue, startNewRun]);

    const switchMode = useCallback((next: Mode) => {
        setMode(next);
        setRunPhase((phase) => phase === "running" ? "paused" : phase);
        shownAt.current = performance.now();
    }, []);

    const answering = (mode === "running" && runPhase === "answer") || (mode === "true" && !trueResult);

    const typeAnswer = useCallback((key: string) => {
        setAnswer((text) => {
            const value = parseAnswer(text) ?? 0;
            if (/^[0-9]$/.test(key)) {
                const digits = text.replace("-", "");
                if (digits.length >= 3) return text;
                return (text.startsWith("-") ? "-" : "") + (digits === "0" ? key : digits + key);
            }
            if (key === "-") return text.startsWith("-") ? text.slice(1) : `-${text}`;
            if (key === "backspace") return text.slice(0, -1);
            if (key === "arrowup") return String(value + 1);
            if (key === "arrowdown") return String(value - 1);
            return text;
        });
    }, []);

    const handleConfirm = useCallback(() => {
        if (mode === "running") {
            if (runPhase === "running" || runPhase === "paused") {
                setRunPhase("answer");
                setAnswer("");
            } else if (runPhase === "answer") submitRun();
            else if (runPhase === "result") continueRun();
            else startPause();
        } else if (mode === "true") {
            if (trueResult) nextTrue();
            else submitTrue();
        }
    }, [continueRun, mode, nextTrue, runPhase, startPause, submitRun, submitTrue, trueResult]);

    const panelKey = useCallback((key: string) => {
        if (key === "enter") handleConfirm();
        else typeAnswer(key);
    }, [handleConfirm, typeAnswer]);

    const runAction = useCallback((action: ActionId) => {
        switch (action) {
            case "modeTags": return switchMode("tags");
            case "modeRunning": return switchMode("running");
            case "modeTrue": return switchMode("true");
            case "help": return setHelpOpen((open) => !open);
            case "restart": return restart();
            case "tagMinus": if (mode === "tags") answerTag(-1); return;
            case "tagZero": if (mode === "tags") answerTag(0); return;
            case "tagPlus": if (mode === "tags") answerTag(1); return;
            case "play":
                if (mode === "running") {
                    if (runPhase === "result") continueRun();
                    else if (runPhase !== "answer") startPause();
                } else if (mode === "true" && trueResult) nextTrue();
                return;
            case "slower": setSpeed((value) => SPEEDS[Math.min(SPEEDS.indexOf(value) + 1, SPEEDS.length - 1)]); return;
            case "faster": setSpeed((value) => SPEEDS[Math.max(SPEEDS.indexOf(value) - 1, 0)]); return;
            case "flash": if (mode === "running") setFlash((value) => nextIn(FLASHES, value)); return;
            case "length": if (mode === "running" && runPhase === "ready") setRunLength((value) => nextIn(LENGTHS, value)); return;
        }
    }, [answerTag, continueRun, mode, nextTrue, restart, runPhase, startPause, switchMode, trueResult]);

    useEffect(() => {
        const onKeydown = (e: KeyboardEvent) => {
            const key = normalizeKey(e.key);

            if (keys.captureKey(e)) return;

            if (e.metaKey || e.ctrlKey || e.altKey) return;
            if (key === "tab") return;

            if (key === "escape") {
                if (helpOpen) setHelpOpen(false);
                else if (mode === "running" && runPhase === "running") setRunPhase("paused");
                return;
            }

            // A button reached with the keyboard keeps its own Enter and Space.
            const target = e.target as Element;
            const onFocusedButton = target.closest?.("button, a")?.matches(":focus-visible");
            if (onFocusedButton && (key === "enter" || key === "space")) return;

            if (helpOpen) {
                if (keyToAction.get(key) === "help") {
                    e.preventDefault();
                    setHelpOpen(false);
                }
                return;
            }

            if (e.repeat && key !== "backspace") return;

            if (answering && (/^[0-9]$/.test(key) || ["-", "backspace", "arrowup", "arrowdown"].includes(key))) {
                e.preventDefault();
                typeAnswer(key);
                return;
            }

            if (key === "enter") {
                e.preventDefault();
                handleConfirm();
                return;
            }

            // Tag drill number row shortcuts, for anyone who thinks in the values themselves.
            if (mode === "tags") {
                const direct: Record<string, Tag> = { "-": -1, "0": 0, "=": 1, "+": 1 };
                if (key in direct) {
                    e.preventDefault();
                    answerTag(direct[key]);
                    return;
                }
            }

            const action = keyToAction.get(key);
            if (action) {
                e.preventDefault();
                runAction(action);
            }
        };

        // Pausing when the window loses focus keeps a run from going on unseen.
        const onBlur = () => setRunPhase((phase) => phase === "running" ? "paused" : phase);

        document.addEventListener("keydown", onKeydown);
        window.addEventListener("blur", onBlur);
        return () => {
            document.removeEventListener("keydown", onKeydown);
            window.removeEventListener("blur", onBlur);
        };
    });

    const tabs: { id: Mode; label: string; action: ActionId }[] = [
        { id: "tags", label: "Tags", action: "modeTags" },
        { id: "running", label: "Running", action: "modeRunning" },
        { id: "true", label: "True count", action: "modeTrue" },
    ];

    const tagButtons: { value: Tag; label: string; action: ActionId; alias: string }[] = [
        { value: -1, label: "−1", action: "tagMinus", alias: "←" },
        { value: 0, label: "0", action: "tagZero", alias: "↓" },
        { value: 1, label: "+1", action: "tagPlus", alias: "→" },
    ];

    const currentTagCard = tagShoe[tagIndex];

    return (
        <Theme tone="dark" className="relative flex h-dvh w-screen flex-col gap-2 overflow-hidden p-3 sm:p-5">
            <CornerBrackets size={20} offset={6} className="text-m-fg/40" />

            <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
                    <Link href="/showcase" className="shrink-0">
                        <Label className="hover:text-m-fg">&larr; Showcase</Label>
                    </Link>
                    <Link href="/blog/card-counting-math" className="shrink-0">
                        <Label className="hover:text-m-fg">The math</Label>
                    </Link>
                    <Display as="h1" size="sm"><Slop face="wide">Hi-Lo </Slop><Slop face="serif">trainer</Slop></Display>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                    {tabs.map((tab) => (
                        <Button key={tab.id} size="sm" variant={mode === tab.id ? "solid" : "outline"} aria-pressed={mode === tab.id} onClick={() => switchMode(tab.id)}>
                            {tab.label} <span className="hidden md:inline"><Kbd>{keyName(bindings[tab.action])}</Kbd></span>
                        </Button>
                    ))}
                    <Button size="sm" variant="ghost" aria-label="Keyboard help" onClick={() => setHelpOpen(true)}>
                        Keys <Kbd>{keyName(bindings.help)}</Kbd>
                    </Button>
                </div>
            </header>

            <main className="min-h-0 flex-1 [container-type:size]">
                <div className="flex h-full flex-col items-center justify-center gap-[2.5cqh] [@media(max-height:520px)]:flex-row [@media(max-height:520px)]:gap-4">
                    {mode === "tags" && (
                        <>
                            <div className="flex shrink-0 flex-col items-center gap-2">
                            <Label tone="fg">What is this card worth?</Label>
                            {currentTagCard ? <CardRow cards={[currentTagCard]} /> : <div className={`w-[var(--card)] ${cardWidthClass(1)}`}><PlayingCard /></div>}
                            </div>
                            <div className="flex w-full min-w-0 flex-col items-center gap-[2.5cqh]">
                            <div className="flex h-[clamp(2rem,8cqh,3.5rem)] items-center">
                                {tagFeedback && (
                                    <Verdict correct={tagFeedback.correct}>
                                        {tagFeedback.correct ? "Correct" : "Incorrect"}: {describeCard(tagFeedback.card)} is {formatTag(tagOf(tagFeedback.card))}
                                    </Verdict>
                                )}
                            </div>
                            <div className="grid w-full max-w-md grid-cols-3 gap-2">
                                {tagButtons.map(({ value, label, action, alias }) => (
                                    <Button key={value} variant="outline" size="lg" className="h-[clamp(3rem,13cqh,5rem)] flex-col gap-1 text-[clamp(1.25rem,5cqh,2rem)]" aria-label={`Tag ${label}`} onClick={() => answerTag(value)}>
                                        <span className="font-m-display font-black leading-none">{label}</span>
                                        <span className="hidden gap-1 md:flex"><Kbd>{keyName(bindings[action])}</Kbd><Kbd>{alias}</Kbd></span>
                                    </Button>
                                ))}
                            </div>
                            </div>
                        </>
                    )}

                    {mode === "running" && (
                        <>
                            {runPhase === "answer" ? (
                                <div className="flex w-full flex-col items-center gap-3 [@media(max-height:520px)]:flex-row [@media(max-height:520px)]:justify-center">
                                    <AnswerBox answer={answer} prompt={`Running count after ${runIndex} cards?`} hint={<>Type a number{" // "}<Kbd>-</Kbd> flips the sign{" // "}<Kbd>Enter</Kbd> to check</>} />
                                    <Keypad onKey={panelKey} />
                                </div>
                            ) : runPhase === "result" && runResult ? (
                                <div className="flex w-full min-w-0 flex-col items-center gap-[2.5cqh]">
                                    <Verdict correct={runResult.guess === runResult.actual}>
                                        {runResult.guess === runResult.actual ? `Correct: ${formatTag(runResult.actual)}` : `Incorrect: the count was ${formatTag(runResult.actual)}, you said ${formatTag(runResult.guess)}`}
                                    </Verdict>
                                    <div className="flex max-w-3xl flex-wrap justify-center gap-1 font-m-mono text-xs">
                                        {runShoe.slice(Math.max(0, runIndex - 24), runIndex).map((card, i) => (
                                            <span key={i} className={`border border-m-line/20 px-1.5 py-0.5 ${tagOf(card) === 0 ? "text-m-muted" : ""}`}>
                                                {card.value === "T" ? "10" : card.value} <b>{formatTag(tagOf(card))}</b>
                                            </span>
                                        ))}
                                    </div>
                                    <Label>Last {Math.min(24, runIndex)} cards{runEnd === 312 && finished ? " // A whole shoe always counts to 0" : ""}</Label>
                                    <Button size="lg" onClick={continueRun}>{finished ? "New run" : "Keep going"} <span className="hidden md:inline"><Kbd>Enter</Kbd></span></Button>
                                </div>
                            ) : (
                                <>
                                    {shownCards.length > 0 ? <CardRow cards={shownCards} /> : <div className={`w-[var(--card)] ${cardWidthClass(1)}`}><PlayingCard /></div>}
                                    <div className="flex w-full min-w-0 flex-col items-center gap-[2.5cqh]">
                                    <Label tone="fg">Card {Math.min(runIndex, runEnd)} of {runEnd}{runPhase === "paused" ? " // Paused" : ""}</Label>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        <Button size="lg" onClick={startPause}>
                                            {runPhase === "ready" ? "Start" : runPhase === "running" ? "Pause" : "Resume"} <span className="hidden md:inline"><Kbd>{keyName(bindings.play)}</Kbd></span>
                                        </Button>
                                        {runPhase !== "ready" && (
                                            <Button size="lg" variant="outline" onClick={handleConfirm}>Check count <span className="hidden md:inline"><Kbd>Enter</Kbd></span></Button>
                                        )}
                                    </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {mode === "true" && question && (
                        <>
                            <div className="flex items-stretch gap-6 sm:gap-10">
                                <div className="flex flex-col items-center gap-2">
                                    <Label>Running count</Label>
                                    <span className="font-m-display text-[min(20cqh,19cqw,8rem)] font-black leading-none tabular-nums [font-stretch:75%]">{formatTag(question.running)}</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 border-l border-m-line/25 pl-6 sm:pl-10">
                                    <Label>Decks left</Label>
                                    <span className="font-m-display text-[min(20cqh,19cqw,8rem)] font-black leading-none tabular-nums [font-stretch:75%]">{question.decksLeft}</span>
                                </div>
                            </div>
                            {trueResult ? (
                                <div className="flex w-full min-w-0 flex-col items-center gap-[2.5cqh]">
                                    <Verdict correct={trueResult.guess === trueResult.actual}>
                                        {formatTag(question.running)} / {question.decksLeft} = {(question.running / question.decksLeft).toFixed(2).replace("-", "−")}, rounds down to {formatTag(trueResult.actual)}
                                    </Verdict>
                                    <Button size="lg" onClick={nextTrue}>Next <span className="hidden md:inline"><Kbd>Enter</Kbd></span></Button>
                                </div>
                            ) : (
                                <div className="flex w-full flex-col items-center gap-3">
                                    <AnswerBox answer={answer} prompt="True count, rounded down?" hint={<>Type a number{" // "}<Kbd>-</Kbd> flips the sign{" // "}<Kbd>Enter</Kbd> to check</>} />
                                    <Keypad onKey={panelKey} />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            <footer className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                {mode === "tags" && (
                    <StatLine items={[
                        ["Accuracy", percentOf(tagStats.correct, tagStats.answered)],
                        ["Cards", tagStats.answered],
                        ["Streak", tagStats.streak],
                        ["Best", tagStats.best],
                        ["Avg. time", tagStats.answered ? `${(tagStats.totalMs / tagStats.answered / 1000).toFixed(2)}s` : "–"],
                    ]} />
                )}
                {mode === "running" && (
                    <>
                        <StatLine items={[
                            ["Checks correct", `${runScore.correct}/${runScore.answered}`],
                            ["Streak", runScore.streak],
                            ["Best", runScore.best],
                        ]} />
                        <div className="flex flex-wrap items-center gap-1">
                            <Button size="sm" variant="outline" aria-label="Slower" onClick={() => runAction("slower")}>&minus; <span className="hidden md:inline"><Kbd>{keyName(bindings.slower)}</Kbd></span></Button>
                            <Label tone="fg" className="w-16 text-center">{speed} ms</Label>
                            <Button size="sm" variant="outline" aria-label="Faster" onClick={() => runAction("faster")}>+ <span className="hidden md:inline"><Kbd>{keyName(bindings.faster)}</Kbd></span></Button>
                            <Button size="sm" variant="outline" onClick={() => runAction("flash")}>{flash} at a time <span className="hidden md:inline"><Kbd>{keyName(bindings.flash)}</Kbd></span></Button>
                            <Button size="sm" variant="outline" disabled={runPhase !== "ready"} onClick={() => runAction("length")}>{runLength} cards <span className="hidden md:inline"><Kbd>{keyName(bindings.length)}</Kbd></span></Button>
                        </div>
                    </>
                )}
                {mode === "true" && (
                    <StatLine items={[
                        ["Correct", `${trueScore.correct}/${trueScore.answered}`],
                        ["Streak", trueScore.streak],
                        ["Best", trueScore.best],
                    ]} />
                )}
                <Button variant="ghost" size="sm" onClick={restart}>Restart <span className="hidden md:inline"><Kbd>{keyName(bindings.restart)}</Kbd></span></Button>
            </footer>

            <KeysPanel keys={keys} actions={ACTIONS}>
                <span>Always on: <Kbd>&larr;</Kbd> <Kbd>&darr;</Kbd> <Kbd>&rarr;</Kbd> or <Kbd>-</Kbd> <Kbd>0</Kbd> <Kbd>=</Kbd> tag cards as &minus;1, 0, +1</span>
                <span>Answers: <Kbd>0-9</Kbd> type, <Kbd>-</Kbd> flip sign, <Kbd>&uarr;</Kbd> <Kbd>&darr;</Kbd> step, <Kbd>{keyName("backspace")}</Kbd> delete, <Kbd>Enter</Kbd> check or continue</span>
                <span><Kbd>Esc</Kbd> pauses a run or closes this panel. Runs also pause when the window loses focus.</span>
            </KeysPanel>
        </Theme>
    );
};
