"use client"

import { ReactNode, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { CellColor, CellRevealOptions, CellWipeOptions, cellReveal, cellWipe, cssColor, decode, motionEnabled } from "./cells"

const PENDING = "data-m-pending"

// Starts an effect the first time the element scrolls into view. Pending content stays hidden
// until then. globals.css only hides it when motion is on, so nothing is lost without JS.
const useOnView = (start: (el: HTMLElement) => (() => void) | void) => {
    const ref = useRef<any>(null)
    const startRef = useRef(start)
    startRef.current = start

    useEffect(() => {
        const el: HTMLElement | null = ref.current
        if (!el) return
        if (!motionEnabled()) {
            el.removeAttribute(PENDING)
            return
        }
        let cleanup: (() => void) | void
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return
            observer.disconnect()
            cleanup = startRef.current(el)
        })
        observer.observe(el)
        return () => {
            observer.disconnect()
            cleanup?.()
        }
    }, [])

    return ref
}

type CellRevealProps = CellRevealOptions & {
    children: ReactNode
    as?: "div" | "section" | "article" | "header" | "main"
    className?: string
}

// Builds its children out of grid cells when they scroll into view.
export const CellReveal = ({ children, as: Tag = "div", className, ...options }: CellRevealProps) => {
    const ref = useOnView((el) => {
        const cancel = cellReveal(el, options)
        el.removeAttribute(PENDING)
        return cancel
    })
    return (
        <Tag ref={ref} className={className} {...{ [PENDING]: "" }}>
            {children}
        </Tag>
    )
}

type DecodeProps = {
    children: ReactNode
    as?: "span" | "div"
    delay?: number
    className?: string
}

// Resolves its text through block glyphs when it scrolls into view. Nested elements keep their styles.
export const Decode = ({ children, as: Tag = "span", delay = 0, className }: DecodeProps) => {
    const ref = useOnView((el) => {
        let stop: (() => void) | undefined
        const begin = () => {
            stop = decode(el)
            el.removeAttribute(PENDING)
        }
        const timer = delay ? window.setTimeout(begin, delay) : undefined
        if (!delay) begin()
        return () => {
            clearTimeout(timer)
            stop?.()
        }
    })
    return (
        <Tag ref={ref} className={cn("inline-block max-w-full", className)} {...{ [PENDING]: "" }}>
            {children}
        </Tag>
    )
}

type CellSwapProps = CellWipeOptions & {
    children: ReactNode
    // Content shown while hovered or keyboard focused. It fills the element without changing its size,
    // and is only mounted around that time, so it can hold something heavy like a live frame.
    alt: ReactNode
    altClassName?: string
    className?: string
}

// Hover intent, so moving the pointer across a grid does not set off every element it crosses.
const SWAP_DELAY = 70

// Wipes between children and alt with cells on hover. Inside a link, focusing the link also triggers it.
export const CellSwap = ({ children, alt, altClassName, className, ...options }: CellSwapProps) => {
    const ref = useRef<HTMLDivElement>(null)
    const [showAlt, setShowAlt] = useState(false)
    const [altMounted, setAltMounted] = useState(false)
    const optionsRef = useRef(options)
    optionsRef.current = options

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const focusTarget = el.closest<HTMLElement>("a, button") ?? el
        let wanted = false
        let shown = false
        let wiping = false
        let stop: (() => void) | undefined
        let timer: number | undefined

        // A wipe always finishes, then this runs again in case the pointer moved during it.
        const sync = () => {
            if (wiping) return
            if (wanted === shown) {
                setAltMounted(shown)
                return
            }
            const next = wanted
            if (next) setAltMounted(true)
            const swap = () => {
                shown = next
                setShowAlt(next)
            }
            if (!motionEnabled()) {
                swap()
                sync()
                return
            }
            wiping = true
            stop = cellWipe(el, swap, () => {
                wiping = false
                sync()
            }, optionsRef.current)
        }

        const want = (value: boolean) => {
            clearTimeout(timer)
            wanted = value
            timer = window.setTimeout(sync, value ? SWAP_DELAY : 0)
        }
        const onEnter = (e: PointerEvent) => e.pointerType !== "touch" && want(true)
        const onLeave = (e: PointerEvent) => e.pointerType !== "touch" && want(false)
        const onFocus = () => focusTarget.matches(":focus-visible") && want(true)
        const onBlur = () => want(false)

        el.addEventListener("pointerenter", onEnter)
        el.addEventListener("pointerleave", onLeave)
        focusTarget.addEventListener("focus", onFocus)
        focusTarget.addEventListener("blur", onBlur)
        return () => {
            clearTimeout(timer)
            stop?.()
            el.removeEventListener("pointerenter", onEnter)
            el.removeEventListener("pointerleave", onLeave)
            focusTarget.removeEventListener("focus", onFocus)
            focusTarget.removeEventListener("blur", onBlur)
        }
    }, [])

    return (
        <div ref={ref} className={cn("relative", className)}>
            <div className={cn("contents", showAlt && "[&>*]:invisible")}>{children}</div>
            <div aria-hidden className={cn("absolute inset-0 overflow-hidden", !showAlt && "invisible", altClassName)}>
                {altMounted && alt}
            </div>
        </div>
    )
}

type LifeFieldProps = {
    // Newly born cells use this color for one tick. Survivors use a dim foreground.
    color?: CellColor
    cell?: number
    tick?: number
    className?: string
}

// A small Game of Life on a canvas. Pauses off screen and reseeds when it goes stale.
export const LifeField = ({ color = "accent", cell = 10, tick = 140, className }: LifeFieldProps) => {
    const ref = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = ref.current
        const ctx = canvas?.getContext("2d")
        if (!canvas || !ctx) return

        const alive = cssColor(canvas, "fg", 0.28)
        let cols = 0
        let rows = 0
        let grid = new Uint8Array(0)
        let generation = 0
        let visible = false

        const seed = () => {
            grid = new Uint8Array(cols * rows).map(() => (Math.random() < 0.28 ? 1 : 0))
            generation = 0
        }

        const paint = (previous: Uint8Array) => {
            // Read on every paint so the field follows the accent picker.
            const born = cssColor(canvas, color)
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            grid.forEach((value, i) => {
                if (!value) return
                ctx.fillStyle = previous[i] ? alive : born
                ctx.fillRect((i % cols) * cell, Math.floor(i / cols) * cell, cell - 1, cell - 1)
            })
        }

        const step = () => {
            const next = new Uint8Array(grid.length)
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    let neighbors = 0
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr || dc) neighbors += grid[((r + dr + rows) % rows) * cols + ((c + dc + cols) % cols)]
                        }
                    }
                    const i = r * cols + c
                    next[i] = neighbors === 3 || (grid[i] && neighbors === 2) ? 1 : 0
                }
            }
            const previous = grid
            grid = next
            generation++
            const population = next.reduce((sum, value) => sum + value, 0)
            if (generation > 160 || population < next.length * 0.04) seed()
            paint(previous)
        }

        const resize = () => {
            const { clientWidth, clientHeight } = canvas
            const dpr = window.devicePixelRatio || 1
            canvas.width = clientWidth * dpr
            canvas.height = clientHeight * dpr
            ctx.scale(dpr, dpr)
            cols = Math.max(1, Math.floor(clientWidth / cell))
            rows = Math.max(1, Math.floor(clientHeight / cell))
            seed()
            paint(grid)
        }

        resize()
        const resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(canvas)
        const viewObserver = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting))
        viewObserver.observe(canvas)
        const timer = setInterval(() => visible && motionEnabled() && step(), tick)

        return () => {
            clearInterval(timer)
            resizeObserver.disconnect()
            viewObserver.disconnect()
        }
    }, [color, cell, tick])

    return <canvas ref={ref} aria-hidden className={cn("block h-full w-full", className)} />
}

type CellLoaderProps = {
    cols?: number
    rows?: number
    cell?: number
    className?: string
}

// Cells fill in random bursts, hold, then reset. Uses the current text color.
export const CellLoader = ({ cols = 8, rows = 2, cell = 5, className }: CellLoaderProps) => {
    const ref = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = ref.current
        const ctx = canvas?.getContext("2d")
        if (!canvas || !ctx) return

        const dpr = window.devicePixelRatio || 1
        canvas.width = cols * cell * dpr
        canvas.height = rows * cell * dpr
        ctx.scale(dpr, dpr)
        ctx.fillStyle = getComputedStyle(canvas).color

        const total = cols * rows
        const shuffled = () =>
            Array.from({ length: total }, (_, i) => i)
                .map((i) => [Math.random(), i])
                .sort((a, b) => a[0] - b[0])
                .map(([, i]) => i)
        let order = shuffled()
        let filled = 0
        let hold = 0

        const paint = () => {
            ctx.clearRect(0, 0, cols * cell, rows * cell)
            for (const i of order.slice(0, filled)) {
                ctx.fillRect((i % cols) * cell, Math.floor(i / cols) * cell, cell - 1, cell - 1)
            }
        }

        if (!motionEnabled()) {
            filled = Math.floor(total / 2)
            paint()
            return
        }

        const timer = setInterval(() => {
            if (filled < total) {
                filled = Math.min(total, filled + 1 + Math.floor(Math.random() * 3))
            } else if (++hold > 4) {
                hold = 0
                filled = 0
                order = shuffled()
            }
            paint()
        }, 70)
        paint()
        return () => clearInterval(timer)
    }, [cols, rows, cell])

    return (
        <canvas
            ref={ref}
            aria-hidden
            className={cn("inline-block", className)}
            style={{ width: cols * cell, height: rows * cell }}
        />
    )
}
