"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

// The width the page lays out at inside the frame, before it is scaled down to fit.
const PAGE_WIDTH = 960

type PagePreviewProps = {
    src: string
    title: string
    className?: string
}

// A live, shrunken copy of a page on this site. It takes no pointer or keyboard input, so clicks
// fall through to whatever wraps it. The frame only loads while this component is mounted.
export const PagePreview = ({ src, title, className }: PagePreviewProps) => {
    const ref = useRef<HTMLDivElement>(null)
    const [box, setBox] = useState<{ scale: number; height: number } | null>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        el.setAttribute("inert", "")
        const measure = () => {
            const scale = el.clientWidth / PAGE_WIDTH
            if (scale > 0) setBox({ scale, height: el.clientHeight / scale })
        }
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    return (
        <div ref={ref} className={cn("relative overflow-hidden border border-m-line/20 bg-m-bg", className)}>
            {box && (
                <iframe
                    src={src}
                    title={title}
                    tabIndex={-1}
                    scrolling="no"
                    className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
                    style={{ width: PAGE_WIDTH, height: box.height, transform: `scale(${box.scale})` }}
                />
            )}
        </div>
    )
}
