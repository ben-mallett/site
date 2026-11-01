import { ReactNode } from "react"
import { Header } from "@/components/Header"
import { Barcode, Label, Theme } from "@/components/theme"

type PageShellProps = {
    children: ReactNode
    // Optional layer rendered full-bleed behind the page, such as an animated background.
    backdrop?: ReactNode
    className?: string
}

// Page frame: theme, header, content, and a footer strip.
export const PageShell = ({ children, backdrop, className }: PageShellProps) => (
    <Theme tone="dark" className="relative flex min-h-screen flex-col">
        {backdrop && <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">{backdrop}</div>}
        <Header />
        <main className={`relative z-10 mx-auto w-full max-w-6xl flex-1 px-6 py-12 ${className ?? ""}`}>{children}</main>
        <footer className="relative z-10 border-t border-m-line/15">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
                <Label decode>Ben Mallett{" // "}{new Date().getFullYear()}</Label>
                <Barcode value="BENS-RAMBLINGS" height={14} />
            </div>
        </footer>
    </Theme>
)
