"use client"

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Body, Display, Label } from "@/components/theme";
import { evolve } from "@/lib/automatonEmbed";
import { RULE_COUNT } from "@/lib/elementary";
import { channelsToPixel } from "@/lib/life";

const GENERATIONS = 100;
// Wide enough to hold a single cell's whole triangle.
const CELLS = 2 * GENERATIONS - 1;
const RULES = Array.from({ length: RULE_COUNT }, (_, rule) => rule);

// One rule's first 100 generations. It only computes and draws once it's near the screen.
const RuleCard = ({ rule, accentVersion }: { rule: number; accentVersion: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [near, setNear] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            setNear(true);
            observer.disconnect();
        }, { rootMargin: "400px" });
        observer.observe(canvas);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!near || !canvas || !ctx) return;
        const pixel = channelsToPixel(getComputedStyle(canvas).getPropertyValue("--m-accent"));
        const image = ctx.createImageData(CELLS, GENERATIONS);
        const pixels = new Uint32Array(image.data.buffer);
        evolve({ rule, generations: GENERATIONS, from: 0, start: "single", seed: 1, density: 0.5 }).forEach((row, y) => {
            for (let x = 0; x < CELLS; x++) if (row[x]) pixels[y * CELLS + x] = pixel;
        });
        ctx.putImageData(image, 0, 0);
    }, [near, rule, accentVersion]);

    return (
        <Link href={`/showcase/elementary-automata?rule=${rule}`} className="group flex flex-col gap-2">
            <div className="relative overflow-hidden border border-m-line/20 bg-m-surface transition-colors group-hover:border-m-accent">
                <canvas
                    ref={canvasRef}
                    width={CELLS}
                    height={GENERATIONS}
                    role="img"
                    aria-label={`Rule ${rule}, generations 0 to ${GENERATIONS - 1}`}
                    className="block h-auto w-full"
                    style={{ imageRendering: "pixelated" }}
                />
                {/* Hovering replays the rule from the top, by sliding this cover off one row at a time. */}
                <span aria-hidden className="m-rule-cover" />
            </div>
            <Label className="group-hover:text-m-fg">Rule {rule}</Label>
        </Link>
    );
};

// Every elementary rule at once, each starting from one live cell.
export const ElementaryCatalog = () => {
    const [accentVersion, setAccentVersion] = useState(0);

    // The accent color can change at any time from the nav bar.
    useEffect(() => {
        const observer = new MutationObserver(() => setAccentVersion((version) => version + 1));
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-m-accent"] });
        return () => observer.disconnect();
    }, []);

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
                <Link href="/showcase" className="self-start"><Label className="hover:text-m-fg">&larr; Showcase</Label></Link>
                <Display as="h1" size="lg" slop>Rule catalog</Display>
                <Body className="max-w-3xl">All {RULE_COUNT} elementary rules, each starting from one live cell and running for steps 0 to {GENERATIONS - 1}. Time runs down the page. Hover over a rule to watch it play, or open it to run it for longer.</Body>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 xl:grid-cols-4">
                {RULES.map((rule) => <RuleCard key={rule} rule={rule} accentVersion={accentVersion} />)}
            </div>
        </div>
    );
};
