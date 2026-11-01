"use client"

import { ReactNode, useEffect, useRef } from "react"
import { XIcon } from "lucide-react"
import { Label } from "./Typography"

type ModalProps = {
    open: boolean
    onClose: () => void
    title: ReactNode
    label: string
    narrow?: boolean
    children: ReactNode
}

// A native dialog, so the browser handles the focus trap, Esc, stacking, and returning focus on close.
export const Modal = ({ open, onClose, title, label, narrow = false, children }: ModalProps) => {
    const ref = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        const dialog = ref.current
        if (!dialog) return
        if (open && !dialog.open) dialog.showModal()
        if (!open && dialog.open) dialog.close()
    }, [open])

    return (
        <dialog
            ref={ref}
            aria-label={label}
            onCancel={(e) => { e.preventDefault(); onClose() }}
            // A click landing on the dialog itself, and not its contents, is on the backdrop.
            onClick={(e) => { if (e.target === ref.current) onClose() }}
            className={`m-auto max-h-[calc(100dvh-2rem)] ${narrow ? "w-[min(calc(100vw-2rem),28rem)]" : "w-[min(calc(100vw-2rem),68rem)]"} overflow-y-auto overscroll-contain border border-m-line/25 bg-m-bg p-0 text-m-fg backdrop:bg-m-bg/85`}
        >
            <div className="flex items-center justify-between gap-3 border-b border-m-line/20 px-4 py-3">
                <Label tone="fg">{title}</Label>
                <button
                    type="button"
                    aria-label="Close"
                    onClick={onClose}
                    className="border border-m-line/40 p-1 transition-colors hover:bg-m-fg hover:text-m-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m-fg"
                >
                    <XIcon size={14} />
                </button>
            </div>
            <div className="p-4 md:p-6">{children}</div>
        </dialog>
    )
}
