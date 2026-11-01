import Link from "next/link"
import { CellReveal, CellSwap, CornerBrackets, Display, Label, PagePreview, Tag } from "@/components/theme"
import { ReactNode } from "react"

const accents = ["acid", "pink", "cyan", "orange", "lilac", "yellow", "red", "blue"] as const

// A card's color comes from its place in the list, so neighbors in a grid never match.
export const cardAccent = (index: number) => accents[index % accents.length]
const orders = ["diagonal", "random", "cols", "rows"] as const

export const accentBorders: Record<(typeof accents)[number], string> = {
    acid: "group-hover:border-m-acid",
    pink: "group-hover:border-m-pink",
    cyan: "group-hover:border-m-cyan",
    orange: "group-hover:border-m-orange",
    lilac: "group-hover:border-m-lilac",
    yellow: "group-hover:border-m-yellow",
    red: "group-hover:border-m-red",
    blue: "group-hover:border-m-blue",
}

// A post's opening text, fading out where the card ends.
export const PreviewText = ({ children }: { children: ReactNode }) => (
    <p className="m-0 min-h-0 flex-1 overflow-hidden p-0 font-m-display text-sm leading-relaxed text-m-fg/80 [mask-image:linear-gradient(to_bottom,black_70%,transparent)]">
        {children}
    </p>
)

type EntryCardProps = {
    href: string
    index: number
    title: string
    kind: string
    description?: string
    // Text the card wipes to on hover, under the title. Without it, the card shows a live preview of its page.
    preview?: string
    meta?: string
}

// Card for a blog post or project.
export const EntryCard = ({ href, index, title, kind, description, preview, meta }: EntryCardProps) => {
    const accent = cardAccent(index)
    return (
        <CellReveal order={orders[index % orders.length]} color={accent} delay={(index % 3) * 90}>
        <Link href={href} className="group relative block h-full">
            <article className={`h-full border border-m-line/20 bg-m-surface transition-colors ${accentBorders[accent]}`}>
            <CellSwap
                color={accent}
                className="flex h-full min-h-64 flex-col justify-between gap-6 p-5"
                altClassName="flex flex-col gap-3 p-5"
                alt={
                    <>
                        <Display as="div" size="sm" slop={title}>
                            {title}
                        </Display>
                        {preview ? <PreviewText>{preview}</PreviewText> : <PagePreview src={href} title={`Preview of ${title}`} className="min-h-0 flex-1" />}
                    </>
                }
            >
                <div className="flex items-center justify-between">
                    <Label index={index + 1} decode>{kind}</Label>
                    {meta && <Label decode>{meta}</Label>}
                </div>
                <div className="flex flex-col gap-3">
                    <Display as="h3" size="sm" slop={title}>
                        {title}
                    </Display>
                    {description && (
                        <p className="m-0 line-clamp-3 p-0 font-m-display text-sm leading-relaxed text-m-fg/70">{description}</p>
                    )}
                </div>
                <div className="flex items-center justify-between">
                    <Tag color={accent}>{kind}</Tag>
                    <span className="font-m-mono text-xs uppercase tracking-[0.16em] text-m-muted transition-colors group-hover:text-m-fg">
                        Open &rarr;
                    </span>
                </div>
            </CellSwap>
            </article>
            <CornerBrackets className="opacity-0 transition-opacity group-hover:opacity-100" offset={-6} />
        </Link>
        </CellReveal>
    )
}
