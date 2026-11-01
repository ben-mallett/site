import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { CellReveal } from "./Motion"
import { Label } from "./Typography"

type DividerProps = {
    label?: ReactNode
    index?: string | number
    ticks?: boolean
    className?: string
}

// Hairline rule with an optional label and measurement ticks. The rule builds left to right in view.
export const Divider = ({ label, index, ticks = false, className }: DividerProps) => (
    <div className={cn("flex items-center gap-3", className)} role="separator">
        {label && <Label index={index} decode className="shrink-0">{label}</Label>}
        <CellReveal order="cols" size={8} spread={700} flash={0.4} className="flex-1 py-1">
            <div className="relative h-px bg-m-line/25">
                {ticks && (
                    <div
                        aria-hidden
                        className="absolute inset-x-0 -top-1 h-2"
                        style={{
                            backgroundImage: "linear-gradient(90deg, rgb(var(--m-line) / 0.35) 1px, transparent 1px)",
                            backgroundSize: "12px 100%",
                        }}
                    />
                )}
            </div>
        </CellReveal>
    </div>
)
