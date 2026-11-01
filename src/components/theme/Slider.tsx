"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

// Hairline track with tick marks and a square thumb.
export const Slider = React.forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, "aria-label": ariaLabel, ...props }, ref) => (
    <SliderPrimitive.Root
        ref={ref}
        className={cn("relative flex h-5 w-full touch-none select-none items-center", className)}
        {...props}
    >
        <SliderPrimitive.Track
            className="relative h-px w-full grow bg-m-line/25"
            style={{
                backgroundImage: "linear-gradient(90deg, rgb(var(--m-line) / 0.3) 1px, transparent 1px)",
                backgroundSize: "10% 5px",
                backgroundPosition: "0 -2px",
            }}
        >
            <SliderPrimitive.Range className="absolute h-[3px] -translate-y-px bg-m-accent" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb aria-label={ariaLabel} className="block h-3 w-3 bg-m-fg transition-colors hover:bg-m-accent focus-visible:bg-m-accent focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40" />
    </SliderPrimitive.Root>
))
Slider.displayName = "Slider"
