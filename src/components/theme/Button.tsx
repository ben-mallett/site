import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "m-clip inline-flex items-center justify-center gap-2 whitespace-nowrap font-m-mono font-semibold uppercase tracking-[0.16em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m-accent focus-visible:ring-offset-2 focus-visible:ring-offset-m-bg disabled:pointer-events-none disabled:opacity-40",
    {
        variants: {
            variant: {
                solid: "bg-m-accent text-m-accent-fg hover:bg-m-fg hover:text-m-bg",
                // clip-path would cut the border, so outline buttons keep square corners.
                outline: "[clip-path:none] border border-m-line/50 bg-transparent text-m-fg hover:bg-m-fg hover:text-m-bg",
                ghost: "bg-transparent text-m-fg hover:bg-m-fg/10",
            },
            size: {
                sm: "h-8 px-3 text-[10px] [--m-cut:6px]",
                md: "h-10 px-5 text-xs",
                lg: "h-12 px-7 text-sm [--m-cut:14px]",
            },
        },
        defaultVariants: {
            variant: "solid",
            size: "md",
        },
    },
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

// Pass asChild to wrap a next/link: <Button asChild><Link href="/blog">Blog</Link></Button>
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    },
)
Button.displayName = "Button"

