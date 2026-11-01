import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Decode } from "./Motion"
import { SlopText } from "./Slop"

const widths = {
    condensed: "[font-stretch:75%]",
    normal: "[font-stretch:100%]",
    wide: "[font-stretch:125%]",
}

const displaySizes = {
    sm: "text-2xl md:text-3xl",
    md: "text-4xl md:text-5xl",
    lg: "text-5xl md:text-7xl",
    xl: "text-6xl md:text-8xl lg:text-9xl",
}

type DisplayProps = {
    children: ReactNode
    as?: "h1" | "h2" | "h3" | "h4" | "div" | "span"
    size?: keyof typeof displaySizes
    width?: keyof typeof widths
    // Mixes typefaces across a string headline. Pass a string to reroll the mix.
    slop?: boolean | string
    // Resolves the text through block glyphs when it scrolls into view.
    decode?: boolean
    className?: string
}

// Large uppercase headline. Resets the global h1-h4 margins and sizes.
export const Display = ({ children, as: Tag = "h2", size = "md", width = "wide", slop, decode, className }: DisplayProps) => {
    const content =
        slop && typeof children === "string" ? (
            <SlopText text={children} seed={typeof slop === "string" ? slop : undefined} />
        ) : (
            children
        )
    return (
    <Tag
        className={cn(
            "m-0 p-0 font-m-display font-black uppercase leading-[0.9] tracking-tight",
            displaySizes[size],
            widths[width],
            className,
        )}
    >
        {decode ? <Decode>{content}</Decode> : content}
    </Tag>
    )
}

type LabelProps = {
    children: ReactNode
    index?: string | number
    as?: "span" | "div" | "p"
    tone?: "muted" | "fg" | "accent"
    // Resolves the text through block glyphs when it scrolls into view.
    decode?: boolean
    className?: string
}

const labelTones = {
    muted: "text-m-muted",
    fg: "text-m-fg",
    accent: "text-m-accent",
}

// Small monospace metadata line, e.g. "01 // RECENT POSTS".
export const Label = ({ children, index, as: Tag = "span", tone = "muted", decode, className }: LabelProps) => {
    const prefix = typeof index === "number" ? String(index).padStart(2, "0") : index
    const content = (
        <>
            {prefix !== undefined && <span className="text-m-fg">{prefix}{" // "}</span>}
            {children}
        </>
    )
    return (
        <Tag
            className={cn(
                "m-0 p-0 font-m-mono text-[11px] font-medium uppercase leading-none tracking-[0.18em]",
                labelTones[tone],
                className,
            )}
        >
            {decode ? <Decode>{content}</Decode> : content}
        </Tag>
    )
}

type BodyProps = {
    children: ReactNode
    as?: "p" | "div" | "span"
    className?: string
}

// Body copy. Resets the global p styles.
export const Body = ({ children, as: Tag = "p", className }: BodyProps) => (
    <Tag className={cn("m-0 p-0 font-m-display text-base leading-relaxed text-m-fg/80", className)}>
        {children}
    </Tag>
)
