import { ReactNode } from "react"
import { cn } from "@/lib/utils"

type ThemeProps = {
    children: ReactNode
    tone?: "dark" | "light"
    className?: string
}

// Opts a subtree into the site theme: sets tokens, fonts, and base colors.
export const Theme = ({ children, tone = "dark", className }: ThemeProps) => (
    <div
        data-m-theme={tone}
        className={cn("bg-m-bg text-m-fg font-m-display antialiased", className)}
    >
        {children}
    </div>
)
