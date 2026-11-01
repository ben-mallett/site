import { cn } from "@/lib/utils"

type HazardProps = {
    className?: string
}

// Diagonal warning stripes in the current text color. Set height and color with classes: "h-2 text-m-acid".
export const Hazard = ({ className }: HazardProps) => (
    <div aria-hidden className={cn("m-hazard h-2 w-full text-m-fg", className)} />
)
