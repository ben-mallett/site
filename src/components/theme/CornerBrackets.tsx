import { cn } from "@/lib/utils"

type CornerBracketsProps = {
    size?: number
    offset?: number
    className?: string
}

// Targeting brackets on each corner. Place inside a relative parent.
export const CornerBrackets = ({ size = 10, offset = -1, className }: CornerBracketsProps) => {
    const corners = [
        "left-0 top-0 border-l border-t",
        "right-0 top-0 border-r border-t",
        "bottom-0 left-0 border-b border-l",
        "bottom-0 right-0 border-b border-r",
    ]
    return (
        <div aria-hidden className={cn("pointer-events-none absolute text-m-fg", className)} style={{ inset: offset }}>
            {corners.map((corner) => (
                <span
                    key={corner}
                    className={cn("absolute border-current", corner)}
                    style={{ width: size, height: size }}
                />
            ))}
        </div>
    )
}
