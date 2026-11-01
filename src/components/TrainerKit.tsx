"use client"

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Button, Label } from "@/components/theme";

// Controls shared by the full-window trainers: rebindable keys, stats, and answer entry.

export type KeyAction<Id extends string> = { id: Id; label: string; group: string; key: string };

export const normalizeKey = (key: string) => key === " " ? "space" : key.toLowerCase();

const KEY_NAMES: Record<string, string> = { space: "Space", arrowleft: "←", arrowright: "→", arrowdown: "↓", arrowup: "↑", enter: "Enter", backspace: "⌫", escape: "Esc" };
export const keyName = (key: string) => KEY_NAMES[key] ?? key.toUpperCase();

export const Kbd = ({ children }: { children: ReactNode }) => (
    <kbd className="inline-flex min-w-5 items-center justify-center border border-current px-1 py-px font-m-mono text-[10px] font-semibold not-italic leading-tight opacity-70">{children}</kbd>
);

export const useKeybinds = <Id extends string>(actions: readonly KeyAction<Id>[], aliases: Record<string, Id>, reserved: string[], storageKey: string) => {
    const defaults = useMemo(() => Object.fromEntries(actions.map((action) => [action.id, action.key])) as Record<Id, string>, [actions]);
    const [bindings, setBindings] = useState<Record<Id, string>>(defaults);
    const [helpOpen, setHelpOpen] = useState(false);
    const [capturing, setCapturing] = useState<Id | null>(null);
    const [message, setMessage] = useState("");

    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem(storageKey) ?? "null");
            if (stored) setBindings({ ...defaults, ...stored });
        } catch {
            // Bad or blocked storage just means default keys.
        }
    }, [defaults, storageKey]);

    const save = useCallback((next: Record<Id, string>) => {
        setBindings(next);
        try {
            localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
            // Private browsing can block storage. The keys still work for this visit.
        }
    }, [storageKey]);

    const keyToAction = useMemo(() => {
        const map = new Map<string, Id>(Object.entries(aliases) as [string, Id][]);
        for (const action of actions) map.set(bindings[action.id], action.id);
        return map;
    }, [actions, aliases, bindings]);

    const isReserved = (key: string) => /^[0-9]$/.test(key) || ["enter", "escape", "backspace", "tab", ...reserved, ...Object.keys(aliases)].includes(key);

    // While a key is being rebound, this takes the next key press. Returns true if it used the event.
    const captureKey = (e: KeyboardEvent) => {
        if (!capturing) return false;
        const key = normalizeKey(e.key);
        e.preventDefault();
        if (key === "escape") {
            setCapturing(null);
            setMessage("");
            return true;
        }
        if (["shift", "control", "alt", "meta", "capslock"].includes(key)) return true;
        if (isReserved(key)) {
            setMessage(`${keyName(key)} is reserved. Try another key.`);
            return true;
        }
        // A key already in use swaps with the action being rebound.
        const taken = actions.find((action) => bindings[action.id] === key && action.id !== capturing);
        const next = { ...bindings, [capturing]: key } as Record<Id, string>;
        if (taken) next[taken.id] = bindings[capturing];
        save(next);
        setMessage(taken ? `Swapped with ${taken.label}.` : "");
        setCapturing(null);
        return true;
    };

    const close = () => {
        setHelpOpen(false);
        setCapturing(null);
        setMessage("");
    };

    const reset = () => {
        save(defaults);
        setMessage("Keys reset.");
    };

    return { bindings, keyToAction, helpOpen, setHelpOpen, capturing, setCapturing, message, setMessage, captureKey, close, reset };
};

type Keybinds<Id extends string> = ReturnType<typeof useKeybinds<Id>>;

export const KeysPanel = <Id extends string>({ keys, actions, children }: { keys: Keybinds<Id>; actions: readonly KeyAction<Id>[]; children: ReactNode }) => {
    if (!keys.helpOpen) return null;
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-m-bg/95 p-3" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
            <div className="flex max-h-full w-full max-w-2xl flex-col gap-3 overflow-y-auto border border-m-line/25 bg-m-surface p-4">
                <div className="flex items-center justify-between gap-3">
                    <Label tone="fg">Keys{" // "}Click a key to change it</Label>
                    <Button size="sm" variant="outline" onClick={keys.close}>Close <Kbd>Esc</Kbd></Button>
                </div>
                <div className="gap-6 sm:columns-2">
                    {Array.from(new Set(actions.map((action) => action.group))).map((group) => (
                        <div key={group} className="mb-3 break-inside-avoid">
                            <Label className="mb-1 block">{group}</Label>
                            {actions.filter((action) => action.group === group).map((action) => (
                                <div key={action.id} className="flex items-center justify-between gap-3 border-b border-m-line/15 py-1 font-m-mono text-xs uppercase">
                                    <span>{action.label}</span>
                                    <button
                                        type="button"
                                        aria-label={`Change key for ${action.label}`}
                                        onClick={() => { keys.setCapturing(action.id); keys.setMessage(""); }}
                                        className={`min-w-14 border px-2 py-1 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m-fg ${keys.capturing === action.id ? "border-m-accent bg-m-accent text-m-accent-fg" : "border-m-line/40 hover:bg-m-fg hover:text-m-bg"}`}
                                    >
                                        {keys.capturing === action.id ? "Press" : keyName(keys.bindings[action.id])}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                <div aria-live="polite" className="min-h-4"><Label tone="accent">{keys.message}</Label></div>
                <div className="flex flex-col gap-1 border-t border-m-line/20 pt-2 font-m-mono text-[11px] uppercase text-m-muted">{children}</div>
                <Button size="sm" variant="ghost" className="self-start" onClick={keys.reset}>Reset keys</Button>
            </div>
        </div>
    );
};

export const blankScore = { answered: 0, correct: 0, streak: 0, best: 0 };
export type Score = typeof blankScore;

export const scoreAnswer = (score: Score, correct: boolean): Score => {
    const streak = correct ? score.streak + 1 : 0;
    return { answered: score.answered + 1, correct: score.correct + (correct ? 1 : 0), streak, best: Math.max(score.best, streak) };
};

export const percentOf = (correct: number, total: number) => total ? `${Math.round((correct / total) * 100)}%` : "–";

export const parseAnswer = (text: string) => text === "" || text === "-" ? null : Number(text);

export const StatLine = ({ items }: { items: [string, ReactNode][] }) => (
    <div className="flex flex-wrap gap-x-6 gap-y-1">
        {items.map(([name, value]) => (
            <div key={name} className="flex flex-col gap-1">
                <Label>{name}</Label>
                <span className="font-m-display text-2xl font-black leading-none tabular-nums [font-stretch:75%] sm:text-3xl">{value}</span>
            </div>
        ))}
    </div>
);

export const AnswerBox = ({ answer, prompt, hint }: { answer: string; prompt: string; hint: ReactNode }) => (
    <div className="flex flex-col items-center gap-2">
        <Label tone="fg">{prompt}</Label>
        <div className="flex h-[clamp(2.5rem,14cqh,6rem)] min-w-[8rem] items-center justify-center border-2 border-m-accent px-4 font-m-display text-[clamp(1.75rem,12cqh,5rem)] font-black leading-none tabular-nums [font-stretch:75%]">
            {answer.replace("-", "−") || <span className="animate-pulse text-m-muted">_</span>}
        </div>
        <Label className="hidden [@media(pointer:fine)]:block">{hint}</Label>
    </div>
);

// On-screen number pad. It follows the pointer and not the width, because a phone on its side is wide.
export const Keypad = ({ onKey, signed = true }: { onKey: (key: string) => void; signed?: boolean }) => (
    <div className="grid w-full max-w-xs grid-cols-4 gap-1 [@media(max-height:700px)]:grid-cols-6 [@media(pointer:fine)]:hidden">
        {(signed ? ["1", "2", "3", "backspace", "4", "5", "6", "-", "7", "8", "9", "0"] : ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "backspace"]).map((key) => (
            <Button key={key} variant="outline" size="sm" className="h-10 [@media(max-height:700px)]:h-8" aria-label={key === "backspace" ? "Delete" : key === "-" ? "Flip sign" : key} onClick={() => onKey(key)}>
                {key === "backspace" ? "⌫" : key === "-" ? "±" : key}
            </Button>
        ))}
        <Button size="sm" className="col-span-full h-10 [@media(max-height:700px)]:h-8" onClick={() => onKey("enter")}>Check</Button>
    </div>
);

export const Verdict = ({ correct, children }: { correct: boolean; children: ReactNode }) => (
    <div aria-live="polite" className={`px-3 py-1 text-center font-m-display text-[clamp(1.1rem,5cqh,2.25rem)] font-black uppercase leading-tight tracking-tight [font-stretch:125%] ${correct ? "bg-m-accent text-m-accent-fg" : "border-2 border-m-orange text-m-orange"}`}>
        {children}
    </div>
);
