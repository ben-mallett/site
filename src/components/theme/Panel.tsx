import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { CornerBrackets } from "./CornerBrackets"
import { Label } from "./Typography"

type PanelProps = {
    children: ReactNode
    label?: ReactNode
    index?: string | number
    meta?: ReactNode
    brackets?: boolean
    accent?: boolean
    className?: string
    bodyClassName?: string
}

// Bordered surface with an optional header strip ("01 // LABEL ........ META").
export const Panel = ({ children, label, index, meta, brackets = false, accent = false, className, bodyClassName }: PanelProps) => (
    <section
        className={cn(
            "relative border border-m-line/20 bg-m-surface",
            accent && "border-t-2 border-t-m-accent",
            className,
        )}
    >
        {(label || meta) && (
            <header className="flex items-center justify-between gap-4 border-b border-m-line/20 px-4 py-2">
                <Label index={index}>{label}</Label>
                {meta && <Label>{meta}</Label>}
            </header>
        )}
        <div className={cn("p-4", bodyClassName)}>{children}</div>
        {brackets && <CornerBrackets />}
    </section>
)
