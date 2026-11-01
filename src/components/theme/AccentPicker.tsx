"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { coverScreen, motionEnabled, uncoverScreen } from "./cells"

const accents = [
    { id: "acid", label: "Reactor green", swatch: "bg-m-acid" },
    { id: "yellow", label: "Caution yellow", swatch: "bg-m-yellow" },
    { id: "orange", label: "Hazard orange", swatch: "bg-m-orange" },
    { id: "red", label: "Alarm red", swatch: "bg-m-red" },
    { id: "pink", label: "Signal pink", swatch: "bg-m-pink" },
    { id: "lilac", label: "Plasma lilac", swatch: "bg-m-lilac" },
    { id: "blue", label: "Ion blue", swatch: "bg-m-blue" },
    { id: "cyan", label: "Coolant cyan", swatch: "bg-m-cyan" },
]

const DEFAULT = accents[0].id

const subscribe = (onChange: () => void) => {
    const observer = new MutationObserver(onChange)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-m-accent"] })
    return () => observer.disconnect()
}

const apply = (id: string) => {
    document.documentElement.dataset.mAccent = id
    try {
        localStorage.setItem("m-accent", id)
    } catch {
        // Private browsing can block storage. The accent still applies to this visit.
    }
}

// A swatch in the nav bar. Hovering shows the colors. Touch screens can't hover, so a tap opens them,
// and keyboard focus does too. The choice lives on the html element, so every themed page picks it up.
export const AccentPicker = () => {
    const [open, setOpen] = useState(false)
    const root = useRef<HTMLDivElement>(null)
    const lastPointer = useRef("")
    const returningFocus = useRef(false)
    const stored = useSyncExternalStore(subscribe, () => document.documentElement.dataset.mAccent ?? DEFAULT, () => DEFAULT)
    const active = accents.find((accent) => accent.id === stored) ?? accents[0]

    // A tap anywhere else closes it, since a finger never leaves the way a mouse does.
    useEffect(() => {
        if (!open) return
        const onPointerDown = (e: PointerEvent) => {
            if (!root.current?.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener("pointerdown", onPointerDown)
        return () => document.removeEventListener("pointerdown", onPointerDown)
    }, [open])

    const choose = (id: string) => {
        if (lastPointer.current === "touch") setOpen(false)
        if (id === active.id) return
        if (!motionEnabled()) return apply(id)
        coverScreen(() => {
            apply(id)
            uncoverScreen()
        })
    }

    return (
        <div
            ref={root}
            className="relative flex"
            onPointerDown={(e) => { lastPointer.current = e.pointerType }}
            onPointerEnter={(e) => { if (e.pointerType === "mouse") setOpen(true) }}
            onPointerLeave={(e) => { if (e.pointerType === "mouse") setOpen(false) }}
            onFocus={(e) => { if (e.target.matches(":focus-visible") && !returningFocus.current) setOpen(true) }}
            onBlur={(e) => { if (!root.current?.contains(e.relatedTarget as Node | null) && !root.current?.matches(":hover")) setOpen(false) }}
            onKeyDown={(e) => {
                if (e.key !== "Escape" || !open) return
                setOpen(false)
                // Focus going back to the swatch shouldn't reopen what Esc just closed.
                returningFocus.current = true
                root.current?.querySelector("button")?.focus()
                returningFocus.current = false
            }}
        >
            <button
                type="button"
                aria-label={`Accent color: ${active.label}`}
                aria-expanded={open}
                title="Accent color"
                onClick={() => { if (lastPointer.current === "touch") setOpen(!open) }}
                className="flex border border-m-line/40 p-1.5 transition-colors hover:border-m-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m-fg"
            >
                <span className={`block h-5 w-5 ${active.swatch}`} />
            </button>
            {/* The top padding bridges the gap, so the pointer can reach the list without closing it. */}
            <div className={`absolute right-0 top-full z-50 pt-1 ${open ? "" : "hidden"}`}>
                <div className="flex w-56 flex-col gap-0.5 border border-m-line/25 bg-m-surface p-1" role="group" aria-label="Accent color">
                    {accents.map(({ id, label, swatch }) => (
                        <button
                            key={id}
                            type="button"
                            aria-pressed={id === active.id}
                            onClick={() => choose(id)}
                            className="flex items-center gap-2 p-1.5 text-left font-m-mono text-[11px] uppercase tracking-[0.14em] transition-colors hover:bg-m-fg/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m-fg"
                        >
                            <span className={`block h-4 w-4 shrink-0 ${swatch}`} />
                            <span className="flex-1">{label}</span>
                            {id === active.id && <span className="text-m-accent">Active</span>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
