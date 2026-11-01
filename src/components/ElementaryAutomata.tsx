"use client"

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, Checkbox, Display, Input, Label, Panel, Slider, Theme } from "@/components/theme";
import { RULE_COUNT, ruleTable, seedRow, Start, stepRow } from "@/lib/elementary";
import { channelsToPixel } from "@/lib/life";

const DEFAULTS = { rule: 30, start: "single" as Start, delay: 30, cellSize: 3, density: 50, wrap: true };

const PRESETS: { rule: number; start: Start; note: string }[] = [
    { rule: 30, start: "single", note: "Chaos from one cell" },
    { rule: 90, start: "single", note: "Sierpinski triangle" },
    { rule: 110, start: "single", note: "Can run any program" },
    { rule: 184, start: "random", note: "Traffic flow" },
];

// How long one animation frame may spend on simulation, so a slow machine still draws smoothly.
const STEP_BUDGET_MS = 10;
// Reading the clock has a cost, so it only happens between small batches of steps.
const STEPS_PER_CLOCK_CHECK = 16;
const STATUS_INTERVAL_MS = 250;

// Patterns in the usual reading order, 111 first.
const PATTERNS = [7, 6, 5, 4, 3, 2, 1, 0];

const isRule = (text: string) => text.trim() !== "" && Number.isInteger(Number(text)) && Number(text) >= 0 && Number(text) < RULE_COUNT;

type Run = { row: Uint8Array; next: Uint8Array; table: Uint8Array; image: ImageData; pixels: Uint32Array; head: number; full: boolean; generation: number; alive: number };

// Adds a row to the image, which is a ring of rows. A new generation overwrites the oldest, so scrolling copies nothing.
const writeRow = (run: Run, values: Uint8Array, pixel: number) => {
    const offset = run.head * values.length;
    for (let i = 0; i < values.length; i++) run.pixels[offset + i] = values[i] ? pixel : 0;
    run.head++;
    if (run.head === run.image.height) {
        run.head = 0;
        run.full = true;
    }
};

const Square = ({ on }: { on: boolean }) => <span className={`block h-2 w-2 border ${on ? "border-m-accent bg-m-accent" : "border-m-line/40"}`} />;

// One pattern of the rule: the three cells on top, and the state they produce below.
const PatternKey = ({ pattern, rule }: { pattern: number; rule: number }) => {
    const on = Boolean((rule >> pattern) & 1);
    const bits = pattern.toString(2).padStart(3, "0");
    return (
        <li aria-label={`Pattern ${bits} makes a ${on ? "live" : "dead"} cell`} className="flex flex-col items-center gap-1 border border-m-line/20 px-0.5 py-1.5">
            <span className="flex">{bits.split("").map((bit, i) => <Square key={i} on={bit === "1"} />)}</span>
            <Square on={on} />
        </li>
    );
};

export const ElementaryAutomata = () => {
    const [rule, setRule] = useState(DEFAULTS.rule);
    const [ruleText, setRuleText] = useState(String(DEFAULTS.rule));
    const [start, setStart] = useState<Start>(DEFAULTS.start);
    const [delay, setDelay] = useState(DEFAULTS.delay);
    const [cellSize, setCellSize] = useState(DEFAULTS.cellSize);
    const [density, setDensity] = useState(DEFAULTS.density);
    const [wrap, setWrap] = useState(DEFAULTS.wrap);
    const [pause, setPause] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [restarts, setRestarts] = useState(0);
    const [box, setBox] = useState({ width: 0, height: 0 });
    const [status, setStatus] = useState({ generation: 0, alive: 0, speed: 0 });

    const stageRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cols = Math.floor(box.width / cellSize);
    const rows = Math.floor(box.height / cellSize);

    const runRef = useRef<Run | null>(null);
    const live = useRef({ delay, pause, wrap, pixel: 0, dirty: true, colorsDirty: true });
    useEffect(() => {
        Object.assign(live.current, { delay, pause, wrap });
    }, [delay, pause, wrap]);

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;
        const observer = new ResizeObserver(() => setBox({ width: stage.clientWidth, height: stage.clientHeight }));
        observer.observe(stage);
        return () => observer.disconnect();
    }, []);

    // The accent color can change at any time.
    useEffect(() => {
        const observer = new MutationObserver(() => { live.current.colorsDirty = true; });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-m-accent"] });
        return () => observer.disconnect();
    }, []);

    // Every run starts over when its rule, starting row, or size changes.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || cols <= 0 || rows <= 0) return;
        canvas.width = cols;
        canvas.height = rows;
        const image = new ImageData(cols, rows);
        const row = new Uint8Array(cols);
        const alive = seedRow(row, start, density / 100);
        const run = { row, next: new Uint8Array(cols), table: ruleTable(rule), image, pixels: new Uint32Array(image.data.buffer), head: 0, full: false, generation: 0, alive };
        const channels = getComputedStyle(canvas).getPropertyValue("--m-accent");
        live.current.pixel = channelsToPixel(channels);
        live.current.colorsDirty = false;
        writeRow(run, row, live.current.pixel);
        runRef.current = run;
        live.current.dirty = true;
        setStatus((previous) => ({ ...previous, generation: 0, alive }));
    }, [cols, rows, rule, start, density, restarts]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        let frame = 0;
        let last = performance.now();
        let backlog = 0;
        let statusAt = last;
        let speedAt = last;
        let speed = 0;
        let speedGeneration = 0;

        const recolor = (run: Run) => {
            const pixel = channelsToPixel(getComputedStyle(canvas).getPropertyValue("--m-accent"));
            live.current.pixel = pixel;
            live.current.colorsDirty = false;
            for (let i = 0; i < run.pixels.length; i++) if (run.pixels[i]) run.pixels[i] = pixel;
            live.current.dirty = true;
        };

        const paint = ({ image, head, full }: Run) => {
            const { width, height } = image;
            if (!full) {
                ctx.putImageData(image, 0, 0);
                return;
            }
            // The oldest row is at the head, so the part from there down goes on top.
            ctx.putImageData(image, 0, -head, 0, head, width, height - head);
            if (head) ctx.putImageData(image, 0, height - head, 0, 0, width, head);
        };

        const tick = (now: number) => {
            frame = requestAnimationFrame(tick);
            const run = runRef.current;
            const state = live.current;
            const elapsed = now - last;
            last = now;
            if (!run) return;
            if (state.colorsDirty) recolor(run);

            if (!state.pause) {
                const started = performance.now();
                backlog += elapsed;
                while (state.delay === 0 || backlog >= state.delay) {
                    for (let i = 0; i < STEPS_PER_CLOCK_CHECK && (state.delay === 0 || backlog >= state.delay); i++) {
                        run.alive = stepRow(run.row, run.next, run.table, state.wrap);
                        const previous = run.row;
                        run.row = run.next;
                        run.next = previous;
                        writeRow(run, run.row, state.pixel);
                        run.generation++;
                        backlog -= state.delay;
                    }
                    state.dirty = true;
                    if (performance.now() - started > STEP_BUDGET_MS) {
                        // Falling behind is dropped, so a hidden tab doesn't come back and race.
                        backlog = 0;
                        break;
                    }
                }
            } else {
                backlog = 0;
            }

            if (state.dirty) {
                paint(run);
                state.dirty = false;
            }

            if (now - statusAt >= STATUS_INTERVAL_MS) {
                statusAt = now;
                if (run.generation < speedGeneration) speedGeneration = 0;
                if (now - speedAt >= 1000) {
                    speed = ((run.generation - speedGeneration) * 1000) / (now - speedAt);
                    speedAt = now;
                    speedGeneration = run.generation;
                }
                setStatus({ generation: run.generation, alive: run.alive, speed });
            }
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, []);

    const changeRule = (next: number) => {
        const wrapped = (next + RULE_COUNT) % RULE_COUNT;
        setRule(wrapped);
        setRuleText(String(wrapped));
    };

    const typeRule = (text: string) => {
        setRuleText(text);
        if (isRule(text)) setRule(Number(text));
    };

    const restoreToDefaults = () => {
        changeRule(DEFAULTS.rule);
        setStart(DEFAULTS.start);
        setDelay(DEFAULTS.delay);
        setCellSize(DEFAULTS.cellSize);
        setDensity(DEFAULTS.density);
        setWrap(DEFAULTS.wrap);
        setPause(false);
    };

    // The rule catalog links here with the rule to open.
    useEffect(() => {
        const linked = new URLSearchParams(window.location.search).get("rule");
        if (linked !== null && isRule(linked)) changeRule(Number(linked));
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            // Text fields and sliders use these keys themselves, and space presses a focused button.
            const target = e.target as Element;
            if (target.closest?.("input, [role='slider']") || (e.key === " " && target.closest?.("button, a"))) return;
            if (e.key === " ") { e.preventDefault(); setPause((value) => !value); }
            else if (e.key === "ArrowLeft") changeRule(rule - 1);
            else if (e.key === "ArrowRight") changeRule(rule + 1);
            else if (e.key.toLowerCase() === "r") setRestarts((value) => value + 1);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [rule]);

    const sliders = [
        { id: "delay", label: "Delay between generations", shown: delay === 0 ? "None" : `${delay}ms`, value: delay, min: 0, max: 250, onChange: setDelay },
        { id: "cellSize", label: "Cell size", shown: `${cellSize}px`, value: cellSize, min: 1, max: 12, onChange: setCellSize },
        ...(start === "random" ? [{ id: "density", label: "Starting density", shown: `${density}%`, value: density, min: 1, max: 99, onChange: setDensity }] : []),
    ];

    return (
        <Theme tone="dark">
            <main className="relative flex h-[100dvh] w-screen flex-col overflow-hidden">
                <header className="flex items-center justify-between gap-4 border-b border-m-line/20 px-4 py-2">
                    <div className="flex min-w-0 items-center gap-4">
                        <Link href="/showcase" aria-label="Back to the showcase" className="shrink-0"><Label className="hover:text-m-fg">&larr; <span className="hidden sm:inline">Showcase</span></Label></Link>
                        <Display as="h1" size="sm" slop="elementary">Elementary Automata</Display>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSettingsOpen((open) => !open)}>Settings</Button>
                </header>

                <div ref={stageRef} className="flex min-h-0 flex-1 items-start justify-center overflow-hidden">
                    <canvas
                        ref={canvasRef}
                        role="img"
                        aria-label={`Rule ${rule}, ${cols} cells wide, with one row for each generation`}
                        style={{ width: cols * cellSize, height: rows * cellSize, imageRendering: "pixelated" }}
                    />
                </div>

                <footer className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-m-line/20 px-4 py-2">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" aria-label="Previous rule" onClick={() => changeRule(rule - 1)}>&larr;</Button>
                        <label className="m-0 flex items-center gap-2">
                            <Label tone="fg">Rule</Label>
                            <Input
                                aria-label="Rule number"
                                inputMode="numeric"
                                value={ruleText}
                                onChange={(e) => typeRule(e.target.value)}
                                onBlur={() => setRuleText(String(rule))}
                                className="h-8 w-14 px-2 text-center"
                            />
                        </label>
                        <Button variant="outline" size="sm" aria-label="Next rule" onClick={() => changeRule(rule + 1)}>&rarr;</Button>
                    </div>
                    <div className="flex w-full flex-col gap-1 sm:w-auto">
                        <ul aria-label={`What rule ${rule} does with each pattern`} className="m-0 grid list-none grid-cols-8 gap-1 p-0 sm:[grid-template-columns:repeat(8,2.375rem)]">
                            {PATTERNS.map((pattern) => <PatternKey key={pattern} pattern={pattern} rule={rule} />)}
                        </ul>
                        <Label>The three cells on top make the cell below</Label>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" className="w-20" onClick={() => setPause((value) => !value)}>{pause ? "Run" : "Pause"}</Button>
                        <Button variant="outline" size="sm" onClick={() => setRestarts((value) => value + 1)}>Restart</Button>
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 md:ml-auto">
                        <Label>Gen <span className="text-m-fg">{String(status.generation).padStart(5, "0")}</span></Label>
                        <Label>Alive <span className="text-m-fg">{status.alive}</span></Label>
                        <Label>Cells <span className="text-m-fg">{cols}</span></Label>
                        <Label>Speed <span className="text-m-fg">{Math.round(status.speed)} gen/s</span></Label>
                    </div>
                </footer>

                {settingsOpen && (
                    <Panel
                        label="Settings"
                        meta={pause ? "Paused" : "Running"}
                        accent
                        className="absolute right-4 top-14 z-40 max-h-[calc(100dvh-4.5rem)] w-[calc(100%-2rem)] overflow-y-auto bg-m-surface/95 backdrop-blur sm:w-96"
                        bodyClassName="flex flex-col gap-5"
                    >
                        <div className="flex flex-col gap-2">
                            <Label>Known rules</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {PRESETS.map((preset) => (
                                    <Button key={preset.rule} size="sm" variant={rule === preset.rule ? "solid" : "outline"} onClick={() => { changeRule(preset.rule); setStart(preset.start); }}>
                                        Rule {preset.rule}
                                    </Button>
                                ))}
                            </div>
                            <Label>{PRESETS.find((preset) => preset.rule === rule)?.note ?? "Pick a rule, or change the number below the board"}</Label>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Starting row</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button size="sm" variant={start === "single" ? "solid" : "outline"} onClick={() => setStart("single")}>Single cell</Button>
                                <Button size="sm" variant={start === "random" ? "solid" : "outline"} onClick={() => setStart("random")}>Random</Button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            {sliders.map(({ id, label, shown, value, min, max, onChange }) => (
                                <div key={id} className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label>{label}</Label>
                                        <Label tone="accent">{shown}</Label>
                                    </div>
                                    <Slider id={id} aria-label={label} value={[value]} min={min} max={max} step={1} onValueChange={(v) => onChange(v[0])} />
                                </div>
                            ))}
                        </div>

                        <label htmlFor="wrap" className="m-0 flex cursor-pointer items-center gap-2 text-base">
                            <Checkbox id="wrap" checked={wrap} onCheckedChange={(value) => setWrap(Boolean(value))} />
                            <Label tone="fg">Wrap the edges</Label>
                        </label>

                        <Label>Keys{" // "}Space pauses{" // "}&larr; &rarr; change the rule{" // "}R restarts</Label>

                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1" onClick={restoreToDefaults}>Reset</Button>
                            <Button size="sm" className="flex-1" onClick={() => setSettingsOpen(false)}>Close</Button>
                        </div>
                    </Panel>
                )}
            </main>
        </Theme>
    );
};
