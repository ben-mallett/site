import { cn } from "@/lib/utils"

type BarcodeProps = {
    value: string
    height?: number
    showValue?: boolean
    className?: string
}

// Decorative barcode. Bar widths derive from the string, so the same value always renders the same bars.
export const Barcode = ({ value, height = 28, showValue = true, className }: BarcodeProps) => {
    const bars: number[] = []
    for (const char of value) {
        const code = char.charCodeAt(0)
        bars.push((code % 3) + 1, ((code >> 2) % 2) + 1, ((code >> 3) % 3) + 1, ((code >> 1) % 2) + 1)
    }
    const total = bars.reduce((sum, w) => sum + w, 0)

    let x = 0
    const rects = bars.map((w, i) => {
        const rect = i % 2 === 0 ? <rect key={i} x={x} y={0} width={w} height={height} /> : null
        x += w
        return rect
    })

    return (
        <div className={cn("inline-flex flex-col gap-1 text-m-fg", className)} aria-hidden>
            <svg width={total} height={height} viewBox={`0 0 ${total} ${height}`} fill="currentColor">
                {rects}
            </svg>
            {showValue && (
                <span className="font-m-mono text-[9px] uppercase leading-none tracking-[0.2em]">{value}</span>
            )}
        </div>
    )
}
