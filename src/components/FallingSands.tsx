"use client"

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, Display, Label, Panel, Slider, Theme } from "@/components/theme";
import { countElements, createWorld, ELEMENTS, LIFE_INTERVAL, paint, resizeWorld, SAND, seedScene, stepWorld, World } from "@/lib/fallingSands";
import { channelsToPixel } from "@/lib/life";

const CELL_SIZE = 4;
const DEFAULT_DELAY = 40;
// How long one animation frame may spend on simulation, so a slow machine still draws smoothly.
const STEP_BUDGET_MS = 10;
const STATUS_INTERVAL_MS = 250;
const SPEED_WINDOW_MS = 1000;
const BRUSHES = [1, 2, 4, 8, 16];
const ALIASES: Record<string, number> = { e: 0, "0": 0 };

export const FallingSands = () => {
    const [selected, setSelected] = useState(SAND);
    const [brushIndex, setBrushIndex] = useState(2);
    const [pause, setPause] = useState(false);
    const [delay, setDelay] = useState(DEFAULT_DELAY);
    const [lifeInterval, setLifeInterval] = useState(LIFE_INTERVAL);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [infoId, setInfoId] = useState<number | null>(null);
    const [box, setBox] = useState({ width: 0, height: 0 });
    const [status, setStatus] = useState({ tick: 0, speed: 0, counts: ELEMENTS.map(() => 0) });

    const stageRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const worldRef = useRef<World | null>(null);
    const pointerRef = useRef<{ x: number; y: number } | null>(null);
    const strokeRef = useRef<Uint8Array | null>(null);
    const ticksRef = useRef(0);
    const cols = Math.floor(box.width / CELL_SIZE);
    const rows = Math.floor(box.height / CELL_SIZE);
    // The loop reads these directly, so changing one never restarts it.
    const live = useRef({ selected, radius: BRUSHES[brushIndex], pause, delay, stepsWanted: 0 });
    useEffect(() => {
        Object.assign(live.current, { selected, radius: BRUSHES[brushIndex], pause, delay });
    }, [selected, brushIndex, pause, delay]);
    useEffect(() => {
        if (worldRef.current) worldRef.current.lifeInterval = lifeInterval;
    }, [lifeInterval]);

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;
        const observer = new ResizeObserver(() => setBox({ width: stage.clientWidth, height: stage.clientHeight }));
        observer.observe(stage);
        return () => observer.disconnect();
    }, []);

    // The starting scene the first time, and the same world on a new board after that.
    useEffect(() => {
        if (cols <= 0 || rows <= 0) return;
        if (worldRef.current) {
            worldRef.current = resizeWorld(worldRef.current, cols, rows);
            strokeRef.current = null;
            return;
        }
        const world = createWorld(cols, rows);
        world.lifeInterval = lifeInterval;
        seedScene(world);
        worldRef.current = world;
        ticksRef.current = 0;
        // Only the first size starts a scene, and the interval is kept in sync above.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cols, rows]);

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
        let speedTicks = 0;
        let image: ImageData | null = null;
        let pixels: Uint32Array | null = null;
        let palette: number[] = [];

        // Empty cells stay see-through, so the page background shows.
        const readPalette = () => {
            const style = getComputedStyle(canvas);
            palette = ELEMENTS.map((element, id) => (id === 0 ? 0 : channelsToPixel(style.getPropertyValue(`--m-${element.color}`))));
        };

        const draw = (world: World) => {
            if (!image || image.width !== world.cols || image.height !== world.rows) {
                canvas.width = world.cols;
                canvas.height = world.rows;
                image = ctx.createImageData(world.cols, world.rows);
                pixels = new Uint32Array(image.data.buffer);
            }
            const { cells } = world;
            for (let i = 0; i < cells.length; i++) pixels![i] = palette[cells[i]];
            ctx.putImageData(image, 0, 0);
        };

        const tick = (now: number) => {
            frame = requestAnimationFrame(tick);
            const world = worldRef.current;
            const elapsed = now - last;
            last = now;
            if (!world) return;
            if (!palette.length) readPalette();
            const state = live.current;
            // Holding the pointer keeps pouring, even when it isn't moving.
            if (pointerRef.current && ELEMENTS[state.selected].pours) paint(world, pointerRef.current.x, pointerRef.current.y, state.radius, state.selected);
            for (; state.stepsWanted > 0; state.stepsWanted--) {
                stepWorld(world);
                ticksRef.current++;
            }
            if (!state.pause) {
                const started = performance.now();
                backlog += elapsed;
                // A delay of zero runs until the budget is spent. Otherwise it runs what the clock owes.
                while (state.delay === 0 || backlog >= state.delay) {
                    stepWorld(world);
                    ticksRef.current++;
                    backlog -= state.delay;
                    if (performance.now() - started > STEP_BUDGET_MS) {
                        // Falling behind is dropped, so a hidden tab doesn't come back and race.
                        backlog = 0;
                        break;
                    }
                }
            } else {
                backlog = 0;
            }
            draw(world);
            if (now - statusAt >= STATUS_INTERVAL_MS) {
                statusAt = now;
                if (now - speedAt >= SPEED_WINDOW_MS) {
                    speed = ((ticksRef.current - speedTicks) * 1000) / (now - speedAt);
                    speedAt = now;
                    speedTicks = ticksRef.current;
                }
                setStatus({ tick: ticksRef.current, speed, counts: countElements(world) });
            }
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, []);

    const cellAt = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const box = e.currentTarget.getBoundingClientRect();
        return { x: Math.floor(((e.clientX - box.left) / box.width) * cols), y: Math.floor(((e.clientY - box.top) / box.height) * rows) };
    };

    const brushAt = (x: number, y: number) => {
        const world = worldRef.current;
        if (!world) return;
        const { selected, radius } = live.current;
        // Poured elements keep landing where they already have. Everything else marks each cell once per stroke.
        paint(world, x, y, radius, selected, ELEMENTS[selected].pours ? undefined : strokeRef.current ?? undefined);
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        const world = worldRef.current;
        strokeRef.current = world ? new Uint8Array(world.cells.length) : null;
        const cell = cellAt(e);
        pointerRef.current = cell;
        brushAt(cell.x, cell.y);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const from = pointerRef.current;
        if (!from) return;
        const to = cellAt(e);
        // Fills the line between events, because a fast drag skips over cells.
        const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
        for (let i = 1; i <= steps; i++) {
            brushAt(Math.round(from.x + ((to.x - from.x) * i) / steps), Math.round(from.y + ((to.y - from.y) * i) / steps));
        }
        pointerRef.current = to;
    };

    const handlePointerUp = () => {
        pointerRef.current = null;
    };

    const clear = () => worldRef.current?.cells.fill(0);
    const restart = () => {
        if (worldRef.current) seedScene(worldRef.current);
        ticksRef.current = 0;
    };
    const stepOnce = () => {
        live.current.stepsWanted++;
    };
    const restoreToDefaults = () => {
        setDelay(DEFAULT_DELAY);
        setLifeInterval(LIFE_INTERVAL);
    };
    const changeBrush = (change: number) => setBrushIndex((index) => Math.min(BRUSHES.length - 1, Math.max(0, index + change)));

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            const key = e.key.toLowerCase();
            if (key === "escape") {
                setInfoId(null);
                setSettingsOpen(false);
                return;
            }
            const number = Number(key);
            if (key === " ") {
                // Space presses a focused button.
                if ((e.target as Element).closest?.("button, a")) return;
                e.preventDefault();
                setPause((value) => !value);
            }
            else if (key in ALIASES) setSelected(ALIASES[key]);
            else if (number >= 1 && number < ELEMENTS.length) setSelected(number);
            else if (key === "[" || key === "-") changeBrush(-1);
            else if (key === "]" || key === "=") changeBrush(1);
            else if (key === ".") stepOnce();
            else if (key === "i") setInfoId((id) => (id === null ? live.current.selected : null));
            else if (key === "c") clear();
            else if (key === "r") restart();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    return (
        <Theme tone="dark">
            <main className="relative flex h-[100dvh] w-screen flex-col overflow-hidden">
                <header className="flex items-center justify-between gap-4 border-b border-m-line/20 px-4 py-2">
                    <div className="flex min-w-0 items-center gap-4">
                        <Link href="/showcase" aria-label="Back to the showcase" className="shrink-0"><Label className="hover:text-m-fg">&larr; <span className="hidden sm:inline">Showcase</span></Label></Link>
                        <Display as="h1" size="sm" slop="sands">Falling Sands</Display>
                    </div>
                    <div className="flex items-center gap-4">
                        <Label className="hidden lg:block">Space pauses{" // "}. steps{" // "}1-{ELEMENTS.length - 1} pick{" // "}E erases{" // "}I info{" // "}[ ] brush{" // "}C clears{" // "}R restarts</Label>
                        <Button variant="outline" size="sm" aria-expanded={settingsOpen} onClick={() => setSettingsOpen((open) => !open)}>Settings</Button>
                    </div>
                </header>

                <div ref={stageRef} className="relative flex min-h-0 flex-1 items-start justify-center overflow-hidden">
                    <canvas
                        ref={canvasRef}
                        role="img"
                        aria-label={`Falling sand world, ${cols} by ${rows} cells. Drag to pour ${ELEMENTS[selected].name.toLowerCase()}.`}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        className="cursor-crosshair touch-none"
                        style={{ width: cols * CELL_SIZE, height: rows * CELL_SIZE, imageRendering: "pixelated" }}
                    />

                    {settingsOpen && (
                        <Panel
                            label="Settings"
                            meta={pause ? "Paused" : "Running"}
                            accent
                            className="absolute right-4 top-4 z-40 max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] overflow-y-auto bg-m-surface/95 backdrop-blur sm:w-96"
                            bodyClassName="flex flex-col gap-4"
                        >
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <Label>Delay between ticks</Label>
                                    <Label tone="accent">{delay === 0 ? "None" : `${delay}ms`}</Label>
                                </div>
                                <Slider aria-label="Delay between ticks" value={[delay]} min={0} max={500} step={1} onValueChange={(v) => setDelay(v[0])} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <Label>Ticks between life steps</Label>
                                    <Label tone="accent">{lifeInterval}</Label>
                                </div>
                                <Slider aria-label="Ticks between life steps" value={[lifeInterval]} min={1} max={60} step={1} onValueChange={(v) => setLifeInterval(v[0])} />
                            </div>
                            <Label>Pause, then press . or Step to move one tick at a time</Label>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="flex-1" onClick={restoreToDefaults}>Reset</Button>
                                <Button size="sm" className="flex-1" onClick={() => setSettingsOpen(false)}>Close</Button>
                            </div>
                        </Panel>
                    )}

                    {infoId !== null && (
                        <Panel
                            label={`${ELEMENTS[infoId].name} rules`}
                            accent
                            className="absolute bottom-4 left-4 z-40 max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] overflow-y-auto bg-m-surface/95 backdrop-blur sm:w-96"
                            bodyClassName="flex flex-col gap-3"
                        >
                            {/* First, so it's still in reach when a short screen has to scroll the rules. */}
                            <Button size="sm" variant="outline" className="self-end" onClick={() => setInfoId(null)}>Close</Button>
                            <ul className="m-0 flex list-none flex-col gap-2 p-0 font-m-display text-sm leading-relaxed text-m-fg/85">
                                {ELEMENTS[infoId].rules.map((rule) => <li key={rule}>{rule}</li>)}
                                {ELEMENTS[infoId].life && <li>A life step happens every {lifeInterval} {lifeInterval === 1 ? "tick" : "ticks"}. You can change that in Settings.</li>}
                            </ul>
                        </Panel>
                    )}
                </div>

                <footer className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-m-line/20 px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                        {/* Numbered in key order, with the eraser last. */}
                        {ELEMENTS.map((_, id) => id).slice(1).concat(0).map((id) => (
                            <div key={id} className="flex">
                                <Button size="sm" variant={selected === id ? "solid" : "outline"} aria-pressed={selected === id} onClick={() => setSelected(id)}>
                                    {ELEMENTS[id].name}
                                </Button>
                                <Button size="sm" variant="outline" className="-ml-px px-2" aria-label={`${ELEMENTS[id].name} rules`} aria-expanded={infoId === id} onClick={() => setInfoId((open) => (open === id ? null : id))}>i</Button>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" aria-label="Smaller brush" onClick={() => changeBrush(-1)}>&minus;</Button>
                        <Label tone="fg">Brush {BRUSHES[brushIndex]}</Label>
                        <Button variant="outline" size="sm" aria-label="Larger brush" onClick={() => changeBrush(1)}>+</Button>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" className="w-20" onClick={() => setPause((value) => !value)}>{pause ? "Run" : "Pause"}</Button>
                        <Button variant="outline" size="sm" disabled={!pause} onClick={stepOnce}>Step</Button>
                        <Button variant="outline" size="sm" onClick={clear}>Clear</Button>
                        <Button variant="outline" size="sm" onClick={restart}>Restart</Button>
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 md:ml-auto">
                        <Label>Tick <span className="text-m-fg">{String(status.tick).padStart(5, "0")}</span></Label>
                        <Label>Speed <span className="text-m-fg">{Math.round(status.speed)} ticks/s</span></Label>
                        {ELEMENTS.map((element, id) => id > 0 && (
                            <Label key={id}>{element.name} <span className="text-m-fg">{status.counts[id]}</span></Label>
                        ))}
                    </div>
                </footer>
            </main>
        </Theme>
    );
};
