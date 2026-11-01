"use client"

import { useEffect, useRef, useState } from 'react';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import Link from 'next/link';
import { Button, Checkbox, CornerBrackets, Display, Hazard, Label, Panel, Slider } from '@/components/theme';
import { Board, buildRuleTable, cellIndex, channelsToPixel, countNeighbors, createBoard, paintPixels, seedBoard, setCell, stepBoard } from '@/lib/life';

const cellColors = ['accent', 'acid', 'yellow', 'orange', 'red', 'pink', 'lilac', 'blue', 'cyan', 'bone'] as const
type CellColor = typeof cellColors[number]
const cellColor = (color: CellColor) => `rgb(var(--m-${color}))`

type ConwayProps = {
    width: number;
    height: number;
    settings: boolean;
}

type WindowConwayProps = {
    settings: boolean;
}

export const WindowConway = ({settings} : WindowConwayProps) => {
    const {width, height} = useWindowDimensions()

    return (
        <Conway width={width} height={height} settings={settings}/>
    )
}

const DEFAULTS = {
    delay: 75,
    density: 20,
    cellSize: 15,
    surviveMin: 2,
    surviveMax: 3,
    birth: 3,
}

// How long one animation frame may spend on simulation, so a slow machine still draws smoothly.
const STEP_BUDGET_MS = 10
// Reading the clock has a cost, so it only happens between small batches of steps.
const STEPS_PER_CLOCK_CHECK = 8
const STATUS_INTERVAL_MS = 250
// Speed is measured over a longer window, or a steady 13 generations per second reads as 12, then 16.
const SPEED_WINDOW_MS = 1000

const Conway = ({ width, height, settings }: ConwayProps) => {
    const [diagnostics, setDiagnostics] = useState<boolean>(false)
    const [colorSwap, setColorSwap] = useState<boolean>(false)
    const [pause, setPause] = useState<boolean>(false)
    const [randomBirths, setRandomBirths] = useState<boolean>(false)
    const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
    const [rounded, setRounded] = useState<boolean>(false)
    const [delay, setDelay] = useState<number>(DEFAULTS.delay)
    const [density, setDensity] = useState<number>(DEFAULTS.density)
    const [cellSize, setCellSize] = useState<number>(DEFAULTS.cellSize)
    const [surviveMin, setSurviveMin] = useState<number>(DEFAULTS.surviveMin)
    const [surviveMax, setSurviveMax] = useState<number>(DEFAULTS.surviveMax)
    const [birth, setBirth] = useState<number>(DEFAULTS.birth)
    const [activeColor, setActiveColor] = useState<CellColor>('accent')
    const [status, setStatus] = useState({ generation: 0, alive: 0, speed: 0 })

    // Settings can come from the address, which is how blog posts link to a set of rules.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const read = (key: string, min: number, max: number, apply: (value: number) => void) => {
            const value = Number(params.get(key) ?? NaN)
            if (Number.isInteger(value) && value >= min && value <= max) apply(value)
        }
        read('birth', 0, 8, setBirth)
        read('surviveMin', 0, 8, setSurviveMin)
        read('surviveMax', 0, 8, setSurviveMax)
        read('density', 0, 100, setDensity)
        read('delay', 0, 500, setDelay)
        read('cellSize', 10, 20, setCellSize)
    }, [])

    const cols = Math.floor(width / cellSize)
    const rows = Math.floor(height / cellSize)

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const boardRef = useRef<Board | null>(null)
    const generationRef = useRef(0)
    const drawingRef = useRef<{ col: number; row: number } | null>(null)
    // Plain squares draw one pixel per cell and let the browser scale them. Round cells and
    // neighbor counts need real pixels, so they draw at full size, and more slowly.
    const detailed = rounded || diagnostics

    // The loop reads these directly, so changing a setting never restarts it.
    const live = useRef({ delay, pause, randomBirths, colorSwap, rounded, diagnostics, activeColor, cellSize, table: buildRuleTable({ surviveMin, surviveMax, birth }), dirty: true, colorsDirty: true })
    useEffect(() => {
        Object.assign(live.current, { delay, pause, randomBirths, colorSwap, rounded, diagnostics, activeColor, cellSize, table: buildRuleTable({ surviveMin, surviveMax, birth }), dirty: true, colorsDirty: true })
    }, [activeColor, birth, cellSize, colorSwap, delay, diagnostics, pause, randomBirths, rounded, surviveMax, surviveMin])

    // A new board whenever its size or starting density changes.
    useEffect(() => {
        if (cols <= 0 || rows <= 0) return
        const board = createBoard(cols, rows)
        seedBoard(board, density / 100)
        boardRef.current = board
        generationRef.current = 0
        live.current.dirty = true
        setStatus((previous) => ({ ...previous, generation: 0, alive: board.alive }))
    }, [cols, rows, density])

    // Size the canvas for the current drawing mode.
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || cols <= 0 || rows <= 0) return
        const scale = detailed ? (window.devicePixelRatio || 1) * cellSize : 1
        canvas.width = cols * scale
        canvas.height = rows * scale
        live.current.dirty = true
    }, [cols, rows, cellSize, detailed])

    // The accent color can change at any time from the nav bar, on pages that have one.
    useEffect(() => {
        const observer = new MutationObserver(() => { live.current.colorsDirty = true })
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-m-accent'] })
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return

        let frame = 0
        let last = performance.now()
        let backlog = 0
        let image: ImageData | null = null
        let pixels: Uint32Array | null = null
        let cellPixel = 0
        let cellCss = ''
        let textOnCell = ''
        let textOnEmpty = ''
        let statusAt = last
        let speedAt = last
        let speed = 0
        let speedGeneration = generationRef.current

        const readColors = () => {
            const style = getComputedStyle(canvas)
            const { activeColor, colorSwap } = live.current
            const color = style.getPropertyValue(`--m-${activeColor}`)
            const background = style.getPropertyValue('--m-bg')
            const cell = colorSwap ? background : color
            cellPixel = channelsToPixel(cell)
            cellCss = `rgb(${cell})`
            textOnCell = `rgb(${colorSwap ? color : background})`
            textOnEmpty = `rgb(${colorSwap ? background : color})`
            live.current.colorsDirty = false
        }

        const paint = (board: Board) => {
            const { rounded, diagnostics, cellSize } = live.current
            if (!rounded && !diagnostics) {
                if (!image || image.width !== board.cols || image.height !== board.rows) {
                    image = ctx.createImageData(board.cols, board.rows)
                    pixels = new Uint32Array(image.data.buffer)
                }
                paintPixels(board, pixels!, cellPixel)
                ctx.putImageData(image, 0, 0)
                return
            }

            const size = canvas.width / board.cols
            ctx.setTransform(1, 0, 0, 1, 0, 0)
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.fillStyle = cellCss
            ctx.beginPath()
            for (let row = 0; row < board.rows; row++) {
                for (let col = 0; col < board.cols; col++) {
                    if (!board.cells[cellIndex(board, col, row)]) continue
                    if (rounded) {
                        ctx.moveTo((col + 1) * size, (row + 0.5) * size)
                        ctx.arc((col + 0.5) * size, (row + 0.5) * size, size / 2, 0, Math.PI * 2)
                    } else {
                        ctx.rect(col * size, row * size, size, size)
                    }
                }
            }
            ctx.fill()

            if (diagnostics) {
                ctx.font = `${(8 / cellSize) * size}px ui-monospace, monospace`
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                for (let row = 0; row < board.rows; row++) {
                    for (let col = 0; col < board.cols; col++) {
                        const i = cellIndex(board, col, row)
                        ctx.fillStyle = board.cells[i] ? textOnCell : textOnEmpty
                        ctx.fillText(String(countNeighbors(board, i)), (col + 0.5) * size, (row + 0.5) * size)
                    }
                }
            }
        }

        const tick = (now: number) => {
            frame = requestAnimationFrame(tick)
            const board = boardRef.current
            const state = live.current
            const elapsed = now - last
            last = now
            if (!board) return
            if (state.colorsDirty) readColors()

            if (!state.pause && !drawingRef.current) {
                const started = performance.now()
                backlog += elapsed
                let stepped = false
                // A delay of zero runs until the budget is spent. Otherwise it runs what the clock owes.
                while (state.delay === 0 || backlog >= state.delay) {
                    for (let i = 0; i < STEPS_PER_CLOCK_CHECK && (state.delay === 0 || backlog >= state.delay); i++) {
                        stepBoard(board, state.table, state.randomBirths)
                        generationRef.current++
                        backlog -= state.delay
                    }
                    stepped = true
                    if (performance.now() - started > STEP_BUDGET_MS) {
                        // Falling behind is dropped, so a hidden tab doesn't come back and race.
                        backlog = 0
                        break
                    }
                }
                if (stepped) state.dirty = true
            } else {
                backlog = 0
            }

            if (state.dirty) {
                paint(board)
                state.dirty = false
            }

            if (now - statusAt >= STATUS_INTERVAL_MS) {
                if (now - speedAt >= SPEED_WINDOW_MS) {
                    speed = ((generationRef.current - speedGeneration) * 1000) / (now - speedAt)
                    speedAt = now
                    speedGeneration = generationRef.current
                }
                statusAt = now
                setStatus({ generation: generationRef.current, alive: board.alive, speed })
            }
        }

        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [])

    // Drawing pauses the simulation only for as long as the pointer is down.
    const cellAt = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const box = e.currentTarget.getBoundingClientRect()
        return { col: Math.floor(((e.clientX - box.left) / box.width) * cols), row: Math.floor(((e.clientY - box.top) / box.height) * rows) }
    }

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const board = boardRef.current
        if (!settings || !board) return
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        const cell = cellAt(e)
        setCell(board, cell.col, cell.row)
        drawingRef.current = cell
        live.current.dirty = true
    }

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const board = boardRef.current
        const from = drawingRef.current
        if (!board || !from) return
        const to = cellAt(e)
        // Fills the line between events, because a fast drag skips over cells.
        const steps = Math.max(Math.abs(to.col - from.col), Math.abs(to.row - from.row))
        for (let i = 1; i <= steps; i++) {
            setCell(board, Math.round(from.col + ((to.col - from.col) * i) / steps), Math.round(from.row + ((to.row - from.row) * i) / steps))
        }
        drawingRef.current = to
        live.current.dirty = true
    }

    const handlePointerUp = () => {
        drawingRef.current = null
    }

    const restoreToDefaults = () => {
        setDiagnostics(false)
        setColorSwap(false)
        setRandomBirths(false)
        setPause(false)
        setRounded(false)
        setDelay(DEFAULTS.delay)
        setDensity(DEFAULTS.density)
        setCellSize(DEFAULTS.cellSize)
        setSurviveMin(DEFAULTS.surviveMin)
        setSurviveMax(DEFAULTS.surviveMax)
        setBirth(DEFAULTS.birth)
        setActiveColor('accent')
    }

    const toggles = [
        { id: 'pause', label: 'Pause', checked: pause, onChange: setPause },
        { id: 'randomBirths', label: 'Random births', checked: randomBirths, onChange: setRandomBirths },
        { id: 'colorSwap', label: 'Invert colors', checked: colorSwap, onChange: setColorSwap },
        { id: 'rounded', label: 'Round cells', checked: rounded, onChange: setRounded },
        { id: 'diagnostics', label: 'Neighbor counts', checked: diagnostics, onChange: setDiagnostics },
    ]

    const neighbors = (value: number) => `${value} neighbor${value === 1 ? '' : 's'}`

    const sliders = [
        { id: 'cellSize', label: 'Cell size', shown: `${cellSize}px`, value: cellSize, min: 10, max: 20, step: 1, onChange: setCellSize },
        { id: 'delay', label: 'Delay between generations', shown: delay === 0 ? 'None' : `${delay}ms`, value: delay, min: 0, max: 500, step: 1, onChange: setDelay },
        { id: 'density', label: 'Starting density', shown: `${density}%`, value: density, min: 0, max: 100, step: 1, onChange: setDensity },
        { id: 'surviveMin', label: 'Survives with at least', shown: neighbors(surviveMin), value: surviveMin, min: 0, max: 8, step: 1, onChange: setSurviveMin },
        { id: 'surviveMax', label: 'Survives with at most', shown: neighbors(surviveMax), value: surviveMax, min: 0, max: 8, step: 1, onChange: setSurviveMax },
        { id: 'birth', label: 'Born with exactly', shown: neighbors(birth), value: birth, min: 0, max: 8, step: 1, onChange: setBirth },
    ]

    return (
        <div
            className="relative flex h-screen w-screen items-center justify-center overflow-hidden"
            style={{ backgroundColor: colorSwap ? cellColor(activeColor) : undefined }}
        >
            <canvas
                ref={canvasRef}
                aria-label={`Game of Life, ${cols} by ${rows} cells`}
                role="img"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className={`relative z-0 touch-none ${settings ? 'cursor-crosshair' : ''}`}
                style={{ width: cols * cellSize, height: rows * cellSize, imageRendering: detailed ? 'auto' : 'pixelated' }}
            />

            {settings && (
                <>
                    <CornerBrackets size={24} offset={16} className="z-20 text-m-fg/60" />

                    <div className="absolute left-0 right-0 top-0 z-30 flex items-start justify-between gap-4 p-6 md:p-10">
                        <div className="flex flex-col gap-3">
                            <Link href="/showcase" className="self-start">
                                <Label className="hover:text-m-fg">&larr; Showcase</Label>
                            </Link>
                            <Label index="01" tone="fg">Cellular automata</Label>
                        </div>
                        {!settingsOpen && (
                            <Button variant="outline" size="sm" className="bg-m-bg/80 backdrop-blur" onClick={() => setSettingsOpen(true)}>
                                Settings
                            </Button>
                        )}
                    </div>

                    <div className="pointer-events-none absolute bottom-0 left-0 z-30 flex flex-col gap-4 p-6 md:p-10">
                        <Display as="h1" size="xl" slop="conway" className="drop-shadow-[0_2px_12px_rgb(var(--m-bg))]">
                            Game of Life
                        </Display>
                        <div className="flex flex-wrap gap-6 bg-m-bg/70 px-3 py-2 backdrop-blur">
                            <Label>Gen <span className="text-m-fg">{String(status.generation).padStart(5, '0')}</span></Label>
                            <Label>Alive <span className="text-m-fg">{status.alive}</span></Label>
                            <Label>Grid <span className="text-m-fg">{cols}x{rows}</span></Label>
                            <Label>Speed <span className="text-m-fg">{Math.round(status.speed)} gen/s</span></Label>
                            <Label>
                                Rules <span className="text-m-fg">B{birth}/S{surviveMin}-{surviveMax}</span>
                            </Label>
                        </div>
                    </div>

                    {settingsOpen && (
                        <Panel
                            label="Settings"
                            index="02"
                            meta={pause ? 'Paused' : 'Running'}
                            accent
                            className="absolute right-4 top-4 z-40 w-[calc(100%-2rem)] bg-m-surface/95 backdrop-blur sm:w-96 md:right-10 md:top-10"
                            bodyClassName="flex flex-col gap-5"
                        >
                            <div className="flex flex-col gap-2">
                                <Label>Cell color</Label>
                                <div className="flex gap-2">
                                    {cellColors.map((color) => (
                                        <button
                                            key={color}
                                            title={color}
                                            aria-label={`Use ${color} cells`}
                                            className={`h-6 flex-1 transition-transform hover:-translate-y-0.5 ${activeColor === color ? 'outline outline-2 outline-offset-2 outline-m-fg' : ''}`}
                                            style={{ backgroundColor: cellColor(color) }}
                                            onClick={() => setActiveColor(color)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                {toggles.map(({ id, label, checked, onChange }) => (
                                    <label key={id} htmlFor={id} className="m-0 flex cursor-pointer items-center gap-2 text-base">
                                        <Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(Boolean(value))}/>
                                        <Label tone="fg">{label}</Label>
                                    </label>
                                ))}
                            </div>
                            {randomBirths && <Label>Each dead cell has a 1% chance of life every generation</Label>}
                            {diagnostics && <Label>Neighbor counts are slower to draw</Label>}

                            <Hazard className="h-1 text-m-line/30" />

                            <div className="flex flex-col gap-4">
                                {sliders.map(({ id, label, shown, value, min, max, step, onChange }) => (
                                    <div key={id} className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label>{label}</Label>
                                            <Label tone="accent">{shown}</Label>
                                        </div>
                                        <Slider id={id} aria-label={label} value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])}/>
                                    </div>
                                ))}
                            </div>

                            <Label>Changing cell size or density starts a new board{" // "}Drag on the board to draw</Label>

                            <div className="flex gap-2 pt-2">
                                <Button size="sm" variant="outline" className="flex-1" title="Reset settings to their defaults" onClick={restoreToDefaults}>
                                    Reset
                                </Button>
                                <Button size="sm" className="flex-1" onClick={() => setSettingsOpen(false)}>
                                    Close
                                </Button>
                            </div>
                        </Panel>
                    )}
                </>
            )}
        </div>
    )
};
