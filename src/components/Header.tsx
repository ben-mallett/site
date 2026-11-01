"use client"

import { MenuIcon, XIcon } from "lucide-react"
import { createContext, ReactNode, useContext, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { getRandomLink, RandomLinks } from "@/lib/utils"
import { AccentPicker, Barcode, CellReveal, Label, Slop } from "@/components/theme"

const links = [
    { href: "/blog", label: "Blog" },
    { href: "/showcase", label: "Showcase" },
    { href: "/contact", label: "Contact" },
]

const RandomLinksContext = createContext<RandomLinks>({ blog: [], showcase: [] })

// The root layout reads the list on the server, because some pages using the header are client components.
export const RandomLinksProvider = ({ links, children }: { links: RandomLinks; children: ReactNode }) => (
    <RandomLinksContext.Provider value={links}>{children}</RandomLinksContext.Provider>
)

export const Header = () => {
    const randomLinks = useContext(RandomLinksContext)
    const [menuOpen, setMenuOpen] = useState<boolean>(false)
    const pathname = usePathname()
    // Picked after mount so the server and client render the same href.
    const [random, setRandom] = useState<string>("/blog")
    useEffect(() => setRandom(getRandomLink(randomLinks, pathname)), [pathname, randomLinks])
    const navLinks = [...links.slice(0, 2), { href: random, label: "Random" }, links[2]]

    return (
        <header className="relative z-40 border-b border-m-line/15 bg-m-bg">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
                <Link href="/" className="group flex items-center gap-4">
                    <span className="font-m-display text-xl uppercase leading-none tracking-tight transition-colors group-hover:text-m-accent">
                        <Slop face="wide">Benj</Slop>
                        <Slop face="serif">amin</Slop>
                        <Slop face="pixel"> | </Slop>
                        <Slop face="outline">nim</Slop>
                        <Slop face="condensed">ajneb</Slop>
                    </span>
                    <Barcode value="BM-01" height={16} showValue={false} className="hidden text-m-muted sm:inline-flex" />
                </Link>

                <div className="flex items-center gap-2">
                <nav className="hidden items-center gap-1 md:flex">
                    {navLinks.map(({ href, label }, i) => {
                        const active = label !== "Random" && pathname.startsWith(href)
                        return (
                            <Link
                                key={label}
                                href={href}
                                className={`flex items-center gap-2 px-3 py-2 font-m-mono text-xs uppercase tracking-[0.16em] transition-colors hover:bg-m-fg hover:text-m-bg ${active ? "text-m-accent" : "text-m-fg"}`}
                            >
                                <span className="text-m-muted">{String(i + 1).padStart(2, "0")}</span>
                                {label}
                            </Link>
                        )
                    })}
                </nav>

                <AccentPicker />

                <button
                    aria-label="Open menu"
                    className="border border-m-line/40 p-1.5 transition-colors hover:bg-m-fg hover:text-m-bg md:hidden"
                    onClick={() => setMenuOpen(true)}
                >
                    <MenuIcon size={20} />
                </button>
                </div>
            </div>

            {menuOpen && (
                <CellReveal order="rows" spread={320} className="fixed inset-0 z-50 flex flex-col bg-m-bg">
                    <div className="flex items-center justify-between border-b border-m-line/15 px-6 py-4">
                        <Label index="00">Navigation</Label>
                        <button
                            aria-label="Close menu"
                            className="border border-m-line/40 p-1.5 transition-colors hover:bg-m-fg hover:text-m-bg"
                            onClick={() => setMenuOpen(false)}
                        >
                            <XIcon size={20} />
                        </button>
                    </div>
                    {navLinks.map(({ href, label }, i) => (
                        <Link
                            key={label}
                            href={href}
                            onClick={() => setMenuOpen(false)}
                            className="flex flex-1 items-end justify-between border-b border-m-line/15 px-6 pb-4 transition-colors hover:bg-m-accent hover:text-m-accent-fg"
                        >
                            <span className="font-m-display text-5xl font-black uppercase [font-stretch:125%]">{label}</span>
                            <span className="font-m-mono text-xs">{String(i + 1).padStart(2, "0")}</span>
                        </Link>
                    ))}
                </CellReveal>
            )}
        </header>
    )
}
