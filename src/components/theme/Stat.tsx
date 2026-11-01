import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Label } from "./Typography"

type StatProps = {
    label: ReactNode
    value: ReactNode
    unit?: ReactNode
    className?: string
    // Overrides the size of the number.
    valueClassName?: string
}

// Readout of one number with a mono label, like an in-game stat block.
export const Stat = ({ label, value, unit, className, valueClassName }: StatProps) => (
    <div className={cn("flex flex-col gap-2 border-l border-m-line/25 pl-3", className)}>
        <Label>{label}</Label>
        <div className="flex items-baseline gap-1">
            <span className={cn("font-m-display text-4xl font-black leading-none tabular-nums [font-stretch:75%]", valueClassName)}>{value}</span>
            {unit && <span className="font-m-mono text-xs uppercase text-m-muted">{unit}</span>}
        </div>
    </div>
)
