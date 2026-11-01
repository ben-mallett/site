"use client"

import { useEffect, useLayoutEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { coverScreen, motionEnabled, uncoverScreen } from "./cells"

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

const stripSlash = (path: string) => path.replace(/\/+$/, "") || "/"

// Mount once in the root layout. Wipes the screen with cells between routes.
export const CellTransitions = () => {
    const router = useRouter()
    const pathname = usePathname()
    const previous = useRef(pathname)

    // Runs before paint, so a back or forward navigation never flashes the new page uncovered.
    useIsomorphicLayoutEffect(() => {
        if (previous.current === pathname) return
        previous.current = pathname
        uncoverScreen()
    }, [pathname])

    useEffect(() => {
        document.documentElement.dataset.mReady = "true"

        const onClick = (e: MouseEvent) => {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
            if (!motionEnabled()) return
            const anchor = (e.target as Element).closest?.("a")
            if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return
            const url = new URL(anchor.href, window.location.href)
            // File links such as /resume.pdf are real page loads, so they stay with the browser.
            if (url.origin !== window.location.origin || /\.\w+$/.test(url.pathname)) return
            if (stripSlash(url.pathname) === stripSlash(window.location.pathname)) return
            // next/link skips its own navigation once the default is prevented.
            e.preventDefault()
            coverScreen(() => router.push(url.pathname + url.search + url.hash))
        }

        document.addEventListener("click", onClick, true)
        return () => {
            document.removeEventListener("click", onClick, true)
        }
    }, [router])

    return null
}
