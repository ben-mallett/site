import { ReactNode } from "react"
import { cn } from "@/lib/utils"

const tagColors = {
    fg: "bg-m-fg text-m-bg",
    outline: "text-m-fg shadow-[inset_0_0_0_1px_rgb(var(--m-line)/0.4)]",
    accent: "bg-m-accent text-m-accent-fg",
    acid: "bg-m-acid text-m-ink",
    pink: "bg-m-pink text-m-ink",
    cyan: "bg-m-cyan text-m-ink",
    orange: "bg-m-orange text-m-ink",
    lilac: "bg-m-lilac text-m-ink",
    yellow: "bg-m-yellow text-m-ink",
    red: "bg-m-red text-m-ink",
    blue: "bg-m-blue text-m-ink",
}

type TagProps = {
    children: ReactNode
    color?: keyof typeof tagColors
    className?: string
}

// Small status chip for categories, rarities, or states.
export const Tag = ({ children, color = "outline", className }: TagProps) => (
    <span
        className={cn(
            "inline-flex items-center px-1.5 py-0.5 font-m-mono text-[10px] font-semibold uppercase leading-none tracking-[0.14em]",
            tagColors[color],
            className,
        )}
    >
        {children}
    </span>
)
