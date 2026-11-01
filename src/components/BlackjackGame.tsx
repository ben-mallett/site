"use client"

import Link from "next/link";
import { useEffect, useState } from "react";
import { BlackjackRules } from "@/components/BlackjackRules";
import { BlackjackTable, formatMoney, resultDelay } from "@/components/BlackjackTable";
import { Kbd, KeysPanel, StatLine, keyName, normalizeKey, useKeybinds } from "@/components/TrainerKit";
import { Button, CornerBrackets, Display, Label, Modal, Slop, Theme } from "@/components/theme";
import { motionEnabled } from "@/components/theme/cells";
import { BET_STEP, DEFAULT_RULES, Rules, STARTING_BANKROLL, Table, answerInsurance, canDeal, deal, double, hit, matchBets, newTable, setBet, setRules, setSpots, split, stand } from "@/lib/blackjack";

const ACTIONS = [
    { id: "hit", label: "Hit", group: "Play", key: "h" },
    { id: "stand", label: "Stand", group: "Play", key: "s" },
    { id: "double", label: "Double", group: "Play", key: "d" },
    { id: "split", label: "Split", group: "Play", key: "p" },
    { id: "insure", label: "Take insurance", group: "Play", key: "y" },
    { id: "decline", label: "Decline insurance", group: "Play", key: "x" },
    { id: "fewerSpots", label: "Fewer spots", group: "Table", key: "," },
    { id: "moreSpots", label: "More spots", group: "Table", key: "." },
    { id: "matchBets", label: "Match the selected bet", group: "Table", key: "m" },
    { id: "rules", label: "Rules", group: "Table", key: "u" },
    { id: "showCount", label: "Show or hide the count", group: "Table", key: "v" },
    { id: "restart", label: "New game", group: "Table", key: "r" },
    { id: "help", label: "Keyboard help", group: "Table", key: "?" },
] as const

type ActionId = (typeof ACTIONS)[number]["id"]

const ALIASES: Record<string, ActionId> = { "/": "help" }
const RESERVED = ["-", "+", "="]
// Between hands, these keep their jobs and every other key deals.
const NON_DEALING_ACTIONS: ActionId[] = ["fewerSpots", "moreSpots", "matchBets", "rules", "showCount", "restart", "help"]
const MODIFIER_KEYS = ["shift", "control", "alt", "meta", "capslock", "fn", "contextmenu"]
const BET_KEYS: Record<string, number> = { "-": -BET_STEP, "=": BET_STEP, "+": BET_STEP }
const RULES_KEY = "blackjack-rules"

export const BlackjackGame = () => {
    const keys = useKeybinds<ActionId>(ACTIONS, ALIASES, RESERVED, "blackjack-keys");
    const { bindings, keyToAction, helpOpen, setHelpOpen } = keys;
    const [table, setTable] = useState<Table | null>(null);
    const [showCount, setShowCount] = useState(false);
    const [selectedSpot, setSelectedSpot] = useState(0);
    const [rulesOpen, setRulesOpen] = useState(false);
    // What the footer shows. Winnings wait for the cards to land, so a blackjack can't spoil itself.
    const [shown, setShown] = useState({ bankroll: STARTING_BANKROLL, rounds: 0 });

    // Shuffled after mount, because a shuffle during render gives the server and browser different shoes.
    useEffect(() => {
        let rules = DEFAULT_RULES;
        try {
            rules = { ...DEFAULT_RULES, ...JSON.parse(localStorage.getItem(RULES_KEY) ?? "{}") };
        } catch {
            // Bad or blocked storage just means the default rules.
        }
        setTable(newTable(rules));
    }, []);

    useEffect(() => {
        if (!table) return;
        const delay = motionEnabled() ? resultDelay(table) : 0;
        const timer = window.setTimeout(() => setShown({ bankroll: table.bankroll, rounds: table.rounds }), delay);
        return () => clearTimeout(timer);
    }, [table]);

    const spot = table ? Math.min(selectedSpot, table.spots - 1) : 0;

    const changeRules = (rules: Rules) => {
        if (!table) return;
        try {
            localStorage.setItem(RULES_KEY, JSON.stringify(rules));
        } catch {
            // Private browsing can block storage. The rules still apply to this visit.
        }
        setTable(setRules(table, rules));
    };

    useEffect(() => {
        const onKeydown = (e: KeyboardEvent) => {
            // The open dialog has the keyboard to itself.
            if (rulesOpen) return;
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

            const action = keyToAction.get(key);
            if (helpOpen) {
                if (action === "help") {
                    e.preventDefault();
                    keys.close();
                }
                return;
            }

            if (e.repeat || !table) return;

            if (key in BET_KEYS) {
                e.preventDefault();
                setTable(setBet(table, spot, BET_KEYS[key]));
                return;
            }

            const betweenHandsNow = table.phase === "betting" || table.phase === "settled";
            // The number keys pick which spot's bet to change.
            if (betweenHandsNow && /^[1-5]$/.test(key)) {
                e.preventDefault();
                if (Number(key) <= table.spots) setSelectedSpot(Number(key) - 1);
                return;
            }

            const betweenHands = table.phase === "betting" || table.phase === "settled";
            if (betweenHands && !NON_DEALING_ACTIONS.includes(action as ActionId) && !MODIFIER_KEYS.includes(key)) {
                e.preventDefault();
                if (canDeal(table)) setTable(deal(table));
                return;
            }

            if (!action) return;
            e.preventDefault();
            switch (action) {
                case "help": return setHelpOpen(true);
                case "restart": return setTable(newTable(table.rules));
                case "rules": return setRulesOpen(true);
                case "matchBets": return setTable(matchBets(table, spot));
                case "showCount": return setShowCount((shown) => !shown);
                case "fewerSpots": return setTable(setSpots(table, -1));
                case "moreSpots": return setTable(setSpots(table, 1));
                case "hit": return setTable(hit(table));
                case "stand": return setTable(stand(table));
                case "double": return setTable(double(table));
                case "split": return setTable(split(table));
                case "insure": return setTable(answerInsurance(table, true));
                case "decline": return setTable(answerInsurance(table, false));
            }
        };
        document.addEventListener("keydown", onKeydown);
        return () => document.removeEventListener("keydown", onKeydown);
    });

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
                    <Display as="h1" size="sm"><Slop face="wide">Black</Slop><Slop face="serif">jack</Slop></Display>
                </div>
                <Button size="sm" variant="ghost" aria-label="Keyboard help" onClick={() => setHelpOpen(true)}>
                    Keys <Kbd>{keyName(bindings.help)}</Kbd>
                </Button>
            </header>

            <main className="min-h-0 flex-1 [container-type:size]">
                {table && (
                    <BlackjackTable
                        table={table}
                        showCount={showCount}
                        selectedSpot={spot}
                        keysFor={{ hit: keyName(bindings.hit), stand: keyName(bindings.stand), double: keyName(bindings.double), split: keyName(bindings.split), insure: keyName(bindings.insure), decline: keyName(bindings.decline), count: keyName(bindings.showCount), fewerSpots: keyName(bindings.fewerSpots), moreSpots: keyName(bindings.moreSpots), matchBets: keyName(bindings.matchBets), rules: keyName(bindings.rules) }}
                        onHit={() => setTable(hit(table))}
                        onStand={() => setTable(stand(table))}
                        onDouble={() => setTable(double(table))}
                        onSplit={() => setTable(split(table))}
                        onInsurance={(take) => setTable(answerInsurance(table, take))}
                        onSelectSpot={setSelectedSpot}
                        onBet={(which, direction) => setTable(setBet(table, which, direction * BET_STEP))}
                        onMatchBets={() => setTable(matchBets(table, spot))}
                        onOpenRules={() => setRulesOpen(true)}
                        onSpots={(change) => setTable(setSpots(table, change))}
                        onDeal={() => setTable(deal(table))}
                        onToggleCount={() => setShowCount(!showCount)}
                    />
                )}
            </main>

            <footer className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                {table && (
                    <StatLine items={[
                        ["Bankroll", formatMoney(shown.bankroll)],
                        ["Net", formatMoney(shown.bankroll - STARTING_BANKROLL)],
                        ["Rounds", shown.rounds],
                    ]} />
                )}
                <Button variant="ghost" size="sm" onClick={() => table && setTable(newTable(table.rules))}>New game <span className="hidden [@media(pointer:fine)]:inline"><Kbd>{keyName(bindings.restart)}</Kbd></span></Button>
            </footer>

            {table && (
                <Modal open={rulesOpen} narrow onClose={() => setRulesOpen(false)} label="Blackjack rules" title="Rules">
                    <BlackjackRules rules={table.rules} locked={table.phase !== "betting" && table.phase !== "settled"} onChange={changeRules} />
                </Modal>
            )}

            <KeysPanel keys={keys} actions={ACTIONS}>
                <span><Kbd>1-5</Kbd> pick a spot, and <Kbd>-</Kbd> <Kbd>=</Kbd> change its bet between hands. Any other key deals the next hand.</span>
                <span>Spot one is on your right, and is dealt and played first. Each spot can split to four hands, and split aces get one card.</span>
                <span>Insurance is one decision for all spots. The count skips the hole card until it is turned over.</span>
            </KeysPanel>
        </Theme>
    );
};
