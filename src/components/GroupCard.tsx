"use client"

import { ReactNode, useState } from "react"
import { accentBorders, cardAccent, PreviewText } from "@/components/EntryCard"
import { CellReveal, CellSwap, CornerBrackets, Display, Label, Modal, PagePreview, Tag } from "@/components/theme"

type GroupCardProps = {
    // Its place in the list, which picks its color the same way as other cards.
    index: number
    // What kind of group this is, such as "Series" or "Category".
    kind: string
    title: string
    description: string
    // How the members are counted, such as "3 articles".
    countLabel: string
    meta?: string
    // Shown on hover, normally from the first member: its text if given, or else a live frame of its page.
    preview?: string
    previewPage: string
    // The members' cards, built on the server. They only mount while the modal is open.
    children: ReactNode
}

// One card for a whole group. It looks like a small stack, and opens a modal with a card for each member.
export const GroupCard = ({ index, kind, title, description, countLabel, meta, preview, previewPage, children }: GroupCardProps) => {
    const [open, setOpen] = useState(false)
    const accent = cardAccent(index)

    return (
        <CellReveal order="diagonal" color={accent}>
            <button
                type="button"
                aria-haspopup="dialog"
                aria-label={`${title}, ${kind.toLowerCase()} of ${countLabel}`}
                onClick={() => setOpen(true)}
                className="group relative block h-full w-full pb-2 pr-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m-fg"
            >
                {/* The cards behind are what say this is more than one thing. */}
                <span aria-hidden className="absolute bottom-0 left-4 right-0 top-4 border border-m-line/15 bg-m-surface" />
                <span aria-hidden className="absolute bottom-1 left-2 right-1 top-2 border border-m-line/20 bg-m-surface" />
                <article className={`relative h-full border border-m-line/20 bg-m-surface transition-colors ${accentBorders[accent]}`}>
                    <CellSwap
                        color={accent}
                        className="flex h-full min-h-64 flex-col justify-between gap-6 p-5"
                        altClassName="flex flex-col gap-3 p-5"
                        alt={
                            <>
                                <Display as="div" size="sm" slop={title}>{title}</Display>
                                {preview ? <PreviewText>{preview}</PreviewText> : <PagePreview src={previewPage} title={`Preview of ${title}`} className="min-h-0 flex-1" />}
                            </>
                        }
                    >
                        <div className="flex items-center justify-between">
                            <Label decode>{kind}</Label>
                            {meta && <Label decode>{meta}</Label>}
                        </div>
                        <div className="flex flex-col gap-3">
                            <Display as="h3" size="sm" slop={title}>{title}</Display>
                            <p className="m-0 line-clamp-3 p-0 font-m-display text-sm leading-relaxed text-m-fg/70">{description}</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <Tag color={accent}>{countLabel}</Tag>
                            <span className="font-m-mono text-xs uppercase tracking-[0.16em] text-m-muted transition-colors group-hover:text-m-fg">Open &rarr;</span>
                        </div>
                    </CellSwap>
                </article>
                <CornerBrackets className="opacity-0 transition-opacity group-hover:opacity-100" offset={-6} />
            </button>
            {/* Closing on a link click keeps the page wipe from being hidden behind the modal. */}
            <Modal open={open} onClose={() => setOpen(false)} label={`${title} ${kind.toLowerCase()}`} title={<>{title}{" // "}{countLabel}</>}>
                <div
                    className="grid grid-cols-1 gap-6 md:grid-cols-3"
                    onClick={(e) => { if ((e.target as Element).closest("a")) setOpen(false) }}
                >
                    {open && children}
                </div>
            </Modal>
        </CellReveal>
    )
}
