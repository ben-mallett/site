import Link from "next/link"
import {
    Barcode,
    Body,
    Button,
    Display,
    Divider,
    Hazard,
    Label,
    Theme,
    Panel,
    Slop,
    SlopText,
    Stat,
    Tag,
} from "@/components/theme"
import { MotionDemos } from "./MotionDemos"

const swatches = [
    { name: "acid", className: "bg-m-acid" },
    { name: "pink", className: "bg-m-pink" },
    { name: "cyan", className: "bg-m-cyan" },
    { name: "orange", className: "bg-m-orange" },
    { name: "lilac", className: "bg-m-lilac" },
    { name: "yellow", className: "bg-m-yellow" },
    { name: "red", className: "bg-m-red" },
    { name: "blue", className: "bg-m-blue" },
    { name: "ink", className: "bg-m-ink" },
    { name: "bone", className: "bg-m-bone" },
]

const Sample = () => (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-12">
        <header className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <Label index="00">Design system</Label>
                <Barcode value="BNJMN-0425" />
            </div>
            <Display as="h1" size="xl">
                <Slop face="wide">Des</Slop>
                <Slop face="serif">ig</Slop>
                <Slop face="outline">n</Slop>
            </Display>
            <Body className="max-w-xl">
                Primitives for the site&#39;s theme. Import them from @/components/theme and wrap a page in
                Theme to opt in.
            </Body>
            <Hazard className="h-2 text-m-accent" />
        </header>

        <Divider label="Color" index={1} ticks />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {swatches.map((s) => (
                <div key={s.name} className="flex flex-col gap-2">
                    <div className={`h-16 border border-m-line/20 ${s.className}`} />
                    <Label>{s.name}</Label>
                </div>
            ))}
        </div>

        <Divider label="Type" index={2} ticks />
        <div className="flex flex-col gap-4">
            <Display size="lg" width="wide">Wide display</Display>
            <Display size="lg" width="condensed">Condensed display</Display>
            <Label tone="fg">Mono label for metadata</Label>
        </div>

        <Divider label="Font slop" index={3} ticks />
        <div className="grid gap-6 md:grid-cols-3">
            {(["wide", "condensed", "serif", "pixel", "mono", "outline"] as const).map((face) => (
                <div key={face} className="flex flex-col gap-2">
                    <Display size="md">
                        <Slop face={face}>Sample</Slop>
                    </Display>
                    <Label>{face}</Label>
                </div>
            ))}
        </div>
        <div className="flex flex-col gap-6">
            <Display size="lg" slop>Recent transmissions</Display>
            <Display size="lg" slop="2">Recent transmissions</Display>
            <Display size="md">
                <SlopText text="Hey I'm Ben, software engineer" split="word" />
            </Display>
        </div>

        <Divider label="Controls" index={4} ticks />
        <div className="flex flex-wrap items-center gap-4">
            <Button size="lg">Deploy</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button size="sm">Small</Button>
            <Button asChild variant="outline">
                <Link href="/blog">Link button</Link>
            </Button>
        </div>
        <div className="flex flex-wrap gap-2">
            <Tag>Outline</Tag>
            <Tag color="fg">Default</Tag>
            <Tag color="acid">Acid</Tag>
            <Tag color="pink">Pink</Tag>
            <Tag color="cyan">Cyan</Tag>
            <Tag color="orange">Orange</Tag>
            <Tag color="lilac">Lilac</Tag>
            <Tag color="yellow">Yellow</Tag>
            <Tag color="red">Red</Tag>
            <Tag color="blue">Blue</Tag>
        </div>

        <Divider label="Surfaces" index={5} ticks />
        <div className="grid gap-6 md:grid-cols-3">
            <Panel label="Recent post" index={1} meta="2026.10.30" brackets>
                <div className="flex flex-col gap-3">
                    <Display as="h3" size="sm" slop>Conway&apos;s game of life</Display>
                    <Body>A panel with a header strip and corner brackets.</Body>
                    <div className="flex gap-2">
                        <Tag color="acid">Blog</Tag>
                        <Tag>5 min</Tag>
                    </div>
                </div>
            </Panel>
            <Panel label="Stats" index={2} accent>
                <div className="grid grid-cols-2 gap-4">
                    <Stat label="Posts" value="12" />
                    <Stat label="Projects" value="04" />
                    <Stat label="Uptime" value="99.9" unit="%" />
                    <Stat label="Coffee" value="3" unit="cups" />
                </div>
            </Panel>
            <Panel label="Plain">
                <Body>Panels work without a header too. Pass label, meta, brackets, or accent as needed.</Body>
            </Panel>
        </div>

        <Divider label="Motion" index={6} ticks />
        <MotionDemos />
    </div>
)

export default function DesignPage() {
    return (
        <main>
            <Theme tone="dark">
                <Sample />
            </Theme>
            <Theme tone="light">
                <Sample />
            </Theme>
        </main>
    )
}
