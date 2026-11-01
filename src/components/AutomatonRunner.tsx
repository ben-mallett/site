"use client"

import { RefObject, useEffect } from "react"
import { stepWorld } from "@/lib/fallingSands"
import { stepBoard } from "@/lib/life"
import { boardPath, lifeTable, LifeOptions, startingBoard } from "@/lib/lifeEmbed"
import { SandsOptions, startingWorld, worldPaths } from "@/lib/sandsEmbed"

type Run = { steps: number; delay: number; step: () => void; draw: () => void }

// A Game of Life or falling sand embed, back on its first frame.
const startRun = (figure: Element): Run => {
    const life = figure.getAttribute("data-life")
    if (life) {
        const options: LifeOptions = JSON.parse(life)
        const board = startingBoard(options)
        const table = lifeTable(options)
        const path = figure.querySelector("path")!
        return { steps: options.generations, delay: options.delay, step: () => stepBoard(board, table), draw: () => path.setAttribute("d", boardPath(board)) }
    }
    const options: SandsOptions = JSON.parse(figure.getAttribute("data-sands")!)
    const world = startingWorld(options)
    const shapes = Array.from(figure.querySelectorAll("path"))
    return {
        steps: options.ticks,
        delay: options.delay,
        step: () => stepWorld(world),
        draw: () => {
            const paths = worldPaths(world)
            shapes.forEach((shape) => shape.setAttribute("d", paths[Number(shape.getAttribute("data-element"))]))
        },
    }
}

// Starts each embed on the page once it scrolls into view, so its run isn't missed, and plays it
// again from the top when its restart button is pressed. It covers the whole page unless given a part of it. Automaton embeds run on CSS alone, while
// the others are stepped here. Without motion, embeds stay on their finished picture.
export const AutomatonRunner = ({ within }: { within?: RefObject<HTMLElement> }) => {
    useEffect(() => {
        const root = within?.current ?? document
        const timers = new Map<Element, ReturnType<typeof setInterval>>()

        const playSteps = (figure: Element) => {
            clearInterval(timers.get(figure))
            const run = startRun(figure)
            run.draw()
            let done = 0
            const timer: ReturnType<typeof setInterval> = setInterval(() => {
                if (done >= run.steps) return clearInterval(timer)
                run.step()
                run.draw()
                done++
            }, run.delay)
            timers.set(figure, timer)
        }

        const play = (figure: Element) => {
            if (figure.matches(".m-played")) return playSteps(figure)
            figure.classList.remove("m-run")
            // Reading the layout makes the browser notice the removal, so adding the class back restarts the animation.
            figure.getBoundingClientRect()
            figure.classList.add("m-run")
        }

        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue
                play(entry.target)
                observer.unobserve(entry.target)
            }
        }, { threshold: 0.3 })
        if (document.documentElement.classList.contains("m-motion")) {
            root.querySelectorAll(".m-automaton").forEach((figure) => {
                if (figure.matches(".m-played")) {
                    startRun(figure).draw()
                    figure.classList.add("m-played-ready")
                }
                observer.observe(figure)
            })
        }

        const onClick = (e: MouseEvent) => {
            const figure = (e.target as Element).closest?.(".m-automaton-restart")?.closest(".m-automaton")
            if (!figure || !root.contains(figure)) return
            observer.unobserve(figure)
            play(figure)
        }
        document.addEventListener("click", onClick)
        return () => {
            observer.disconnect()
            document.removeEventListener("click", onClick)
            timers.forEach((timer) => clearInterval(timer))
        }
    }, [within])
    return null
}
