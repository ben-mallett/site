"use client"

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AutomatonRunner } from "@/components/AutomatonRunner";
import { Button, Display, Label, Textarea, Theme } from "@/components/theme";
import { PATTERNS } from "@/lib/lifeEmbed";
import { renderMarkdown, splitBlocks } from "@/lib/markdownPreview";
import { SCENES } from "@/lib/sandsEmbed";

const STORAGE_KEY = "embed-editor-draft";
const RENDER_DELAY_MS = 200;

const SAMPLE = `## Try it out

Write markdown here, the same way as in a post. The pictures update as you type.

\`\`\`automaton
rule=30 generations=48
\`\`\`

Several lines in a block make a row:

\`\`\`life
pattern=glider
start=random seed=3 surviveMax=4 caption="Crowding allowed"
\`\`\`

\`\`\`sands
scene=sink
water=2,20,44,10 sand=20,0,8,8 stone=0,30,48,2 cols=48 rows=32 caption="My own"
\`\`\`
`;

const OPTIONS = [
    { block: "automaton", text: "rule, generations, from, cells, start=single|random, seed, density, wrap=true|false, caption" },
    { block: "life", text: "pattern or start=random, cols, rows, generations, birth, surviveMin, surviveMax, seed, density, delay, caption" },
    { block: "sands", text: "scene, sand=x,y,width,height (also water, stone, spore), cols, rows, ticks, lifeInterval, seed, delay, caption" },
];

const INSERTS = [
    { label: "Automaton", options: ["rule=30", "rule=90", "rule=110", "rule=184 start=random cells=100 generations=70"].map((line) => ({ label: line.split(" ")[0], block: "automaton", line })) },
    { label: "Life", options: [...Object.keys(PATTERNS).map((name) => ({ label: name, block: "life", line: `pattern=${name}` })), { label: "random start", block: "life", line: "start=random" }] },
    { label: "Sands", options: Object.keys(SCENES).map((name) => ({ label: name, block: "sands", line: `scene=${name}` })) },
];

// One block or stretch of prose, with its own runner, so it can start and stop without the others.
const Segment = ({ text }: { text: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    // Kept as one object, because React rewrites the HTML whenever this object changes, even with the same text.
    const html = useMemo(() => ({ __html: renderMarkdown(text) }), [text]);
    return (
        <div ref={ref}>
            <div className="m-prose" dangerouslySetInnerHTML={html} />
            <AutomatonRunner within={ref} />
        </div>
    );
};

export const EmbedEditor = () => {
    const [text, setText] = useState(SAMPLE);
    const [rendered, setRendered] = useState(SAMPLE);
    const [copied, setCopied] = useState(false);
    const [notice, setNotice] = useState("");
    const [manualBlock, setManualBlock] = useState("");
    const editor = useRef<HTMLTextAreaElement>(null);

    // Loaded after mount, so the server and client first render the same thing.
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved !== null) setText(saved);
        } catch {
            // Private browsing can block storage. The sample still works.
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setRendered(text), RENDER_DELAY_MS);
        return () => clearTimeout(timer);
    }, [text]);

    // Only real edits save, so loading the page can't write over a draft.
    const edit = (next: string) => {
        setText(next);
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // The draft just won't survive a reload.
        }
    };

    const segments = useMemo(() => splitBlocks(rendered), [rendered]);

    const copyBlock = async (e: ChangeEvent<HTMLSelectElement>, options: { label: string; block: string; line: string }[]) => {
        const choice = options[Number(e.target.value)];
        e.target.value = "";
        if (!choice) return;
        const block = `\`\`\`${choice.block}\n${choice.line}\n\`\`\``;
        try {
            await navigator.clipboard.writeText(block);
            setNotice(`Copied ${choice.block} ${choice.label}. Paste it where you want it.`);
            setManualBlock("");
        } catch {
            setNotice("Couldn't reach the clipboard. Copy this instead:");
            setManualBlock(block);
            return;
        }
    };

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            editor.current?.select();
        }
    };

    return (
        <Theme tone="dark">
            <main className="flex h-[100dvh] w-screen flex-col overflow-hidden">
                <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-m-line/20 px-4 py-2">
                    <div className="flex min-w-0 items-center gap-4">
                        <Link href="/design" className="shrink-0"><Label className="hover:text-m-fg">&larr; Design</Label></Link>
                        <Display as="h1" size="sm" slop="embed">Embed editor</Display>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => edit(SAMPLE)}>Sample</Button>
                        <Button size="sm" className="w-24" onClick={copy}>{copied ? "Copied" : "Copy"}</Button>
                    </div>
                </header>

                <div className="grid min-h-0 flex-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1">
                    <section className="flex min-h-0 flex-col gap-2 border-b border-m-line/20 p-4 md:border-b-0 md:border-r">
                        <div className="flex flex-wrap gap-2">
                            {INSERTS.map(({ label, options }) => (
                                <select
                                    key={label}
                                    aria-label={`Copy ${label.toLowerCase()} block`}
                                    defaultValue=""
                                    onChange={(e) => copyBlock(e, options)}
                                    className="h-8 border border-m-line/25 bg-m-bg px-2 font-m-mono text-xs text-m-fg focus:border-m-accent focus:outline-none"
                                >
                                    <option value="" disabled>Copy {label.toLowerCase()}</option>
                                    {options.map((option, i) => <option key={option.label} value={i}>{option.label}</option>)}
                                </select>
                            ))}
                            <span aria-live="polite" className="self-center"><Label tone="accent">{notice}</Label></span>
                        </div>
                        {manualBlock && <pre className="m-0 select-all border border-m-line/25 p-2 font-m-mono text-xs text-m-fg">{manualBlock}</pre>}
                        <Textarea
                            ref={editor}
                            aria-label="Markdown"
                            spellCheck={false}
                            value={text}
                            onChange={(e) => edit(e.target.value)}
                            className="min-h-0 flex-1 resize-none leading-relaxed"
                        />
                        <details>
                            <summary className="cursor-pointer"><Label className="inline">Options</Label></summary>
                            <dl className="m-0 mt-2 flex flex-col gap-2 font-m-mono text-xs leading-relaxed text-m-muted">
                                {OPTIONS.map(({ block, text }) => (
                                    <div key={block}>
                                        <dt className="text-m-fg">{block}</dt>
                                        <dd className="m-0">{text}</dd>
                                    </div>
                                ))}
                            </dl>
                        </details>
                    </section>

                    <section aria-label="Preview" className="min-h-0 overflow-y-auto p-4 md:p-8">
                        <div className="mx-auto flex max-w-3xl flex-col gap-5">
                            {segments.map((segment, i) => <Segment key={`${i}:${segment}`} text={segment} />)}
                        </div>
                    </section>
                </div>
            </main>
        </Theme>
    );
};
