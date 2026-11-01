"use client"

import { useState } from "react"
import { Body, Button, CellLoader, CellReveal, CellSwap, Decode, LifeField, Label, Panel } from "@/components/theme"

const reveals = [
    { label: "Random", options: { order: "random" } },
    { label: "Diagonal", options: { order: "diagonal", color: "pink" } },
    { label: "Radial", options: { order: "radial", size: 12, color: "cyan" } },
    { label: "Columns", options: { order: "cols", color: "orange" } },
] as const

// Motion primitives with a replay button. Replaying remounts them through the key.
export const MotionDemos = () => {
    const [run, setRun] = useState(0)

    return (
        <div className="flex flex-col gap-6">
            <Button variant="outline" className="self-start" onClick={() => setRun(run + 1)}>
                Replay
            </Button>
            <div key={run} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {reveals.map(({ label, options }) => (
                    <CellReveal key={label} {...options}>
                        <Panel label={label} meta="CellReveal">
                            <div className="h-24 bg-m-raised" />
                        </Panel>
                    </CellReveal>
                ))}
                <Panel label="Decode">
                    <Decode as="div" className="block font-m-mono text-sm uppercase">
                        Signal acquired. Text settles through block glyphs.
                    </Decode>
                </Panel>
                <Panel label="LifeField" bodyClassName="p-0">
                    <div className="h-24">
                        <LifeField />
                    </div>
                </Panel>
                <Panel label="CellLoader">
                    <CellLoader cols={12} rows={3} cell={8} className="text-m-accent" />
                </Panel>
                <Panel label="CellSwap" bodyClassName="p-0">
                    <CellSwap
                        className="flex h-24 items-center p-4"
                        altClassName="flex items-center bg-m-raised p-4"
                        alt={<Body>The alternate content.</Body>}
                    >
                        <Label tone="fg">Hover to swap</Label>
                    </CellSwap>
                </Panel>
            </div>
        </div>
    )
}
