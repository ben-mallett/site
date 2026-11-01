"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { cn } from "@/lib/utils"

// Square toggle. Checked state fills with the accent and shows a smaller inner block.
export const Checkbox = React.forwardRef<
    React.ElementRef<typeof CheckboxPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
    <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
            "peer flex h-4 w-4 shrink-0 items-center justify-center border border-m-line/50 bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m-accent disabled:cursor-not-allowed disabled:opacity-40 data-[state=checked]:border-m-accent",
            className,
        )}
        {...props}
    >
        <CheckboxPrimitive.Indicator className="h-2 w-2 bg-m-accent" />
    </CheckboxPrimitive.Root>
))
Checkbox.displayName = "Checkbox"
