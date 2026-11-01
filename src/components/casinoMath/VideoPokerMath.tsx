import { DemoLinks, Prose, SourceLink, Table, Term, Th, count, percent } from "@/components/Article";
import { Body, Divider, Label } from "@/components/theme";
import { WIZARD_URL, getVariant } from "@/lib/videoPoker";
import stats from "@/lib/videoPokerStats.json";

const DRAWS = [
    { held: 5, draws: 1 },
    { held: 4, draws: 47 },
    { held: 3, draws: 1081 },
    { held: 2, draws: 16215 },
    { held: 1, draws: 178365 },
    { held: 0, draws: 1533939 },
];

const CARD_NAMES: Record<string, string> = { Q: "Q", J: "J", T: "10", "4": "4" };
const SUIT_SYMBOLS: Record<string, string> = { S: "♠︎", H: "♥︎" };
const showCard = (card: string) => `${CARD_NAMES[card[0]]}${SUIT_SYMBOLS[card[1]]}`;

const SOLVED = [
    { id: "jacks-or-better", analysis: stats["jacks-or-better"] },
    { id: "double-double-bonus", analysis: stats["double-double-bonus"] },
    { id: "deuces-wild", analysis: stats["deuces-wild"] },
] as const;

// Where the return comes from, one bar per hand. All bars in a chart share a scale.
const ReturnChart = ({ title, hands }: { title: string; hands: { id: string; name: string; pays: number; probability: number; share: number }[] }) => {
    const largest = Math.max(...hands.map((hand) => hand.share));
    return (
        <figure className="m-0 flex flex-col gap-3">
            <figcaption><Label tone="fg">{title}</Label></figcaption>
            <div className="flex flex-col gap-0.5">
                {hands.map((hand) => (
                    <div
                        key={hand.id}
                        title={`${hand.name}: pays ${hand.pays}, lands ${percent(hand.probability, 4)} of hands, adds ${percent(hand.share)} to the return`}
                        className="grid grid-cols-[8.5rem_1fr_3.5rem] items-center gap-2 font-m-mono text-[11px] uppercase hover:bg-m-fg/5"
                    >
                        <span className="truncate text-m-fg/80">{hand.name}</span>
                        <span className="block h-3"><span className="block h-full bg-m-accent" style={{ width: `${(hand.share / largest) * 100}%` }} /></span>
                        <span className="text-right tabular-nums text-m-fg">{percent(hand.share, 1)}</span>
                    </div>
                ))}
            </div>
        </figure>
    );
};

export const VideoPokerMath = () => {
    const worked = stats["worked-example"];
    const ultimate = stats["ultimate-x"];
    const base = stats["bonus-base"];
    const check = stats["ultimate-x-check"];
    const gold = getVariant("ultimate-x-gold");

    return (
        <div className="flex flex-col gap-14">
            <DemoLinks demos={[{ href: "/showcase/ultimate-x", label: "Ultimate X" }, { href: "/showcase/ultimate-x-gold", label: "Ultimate X Gold" }, { href: "/showcase/jacks-or-better", label: "Jacks or Better" }, { href: "/showcase/double-double-bonus", label: "Double Double Bonus" }, { href: "/showcase/deuces-wild", label: "Deuces Wild" }]} />

            <section className="flex flex-col gap-6">
                <Divider label="Every hand is countable" index={1} ticks />
                <Prose>
                    There are {count(2598960)} possible deals. For each one you choose which cards to keep, and five cards that can each be kept or thrown away give 2<sup>5</sup> = 32 choices. Whatever you throw away is replaced from the 47 cards left in the deck, so each choice leads to a known number of possible draws.
                </Prose>
                <div className="max-w-md">
                    <Table head={<><Th>Cards held</Th><Th right>Possible draws</Th></>}>
                        {DRAWS.map(({ held, draws }) => (
                            <tr key={held} className="border-b border-m-line/15">
                                <td className="py-1.5 pr-4 tabular-nums">{held}</td>
                                <td className="py-1.5 pr-4 text-right tabular-nums">{count(draws)}</td>
                            </tr>
                        ))}
                    </Table>
                </div>
                <Prose>
                    The value of a hold is the average pay over its draws. Perfect play means taking the highest value hold on every deal. That sounds like trillions of hands to check, but the totals for each card subset can be built once, then corrected for the discarded cards by inclusion-exclusion. The solver in this site&apos;s repository does all of these games in a few minutes.
                </Prose>
            </section>

            <section className="flex flex-col gap-6">
                <Divider label="One decision, worked" index={2} ticks />
                <Prose>
                    You are dealt {worked.dealt.map(showCard).join(" ")} in 9/6 Jacks or Better. That is a paying pair, three to a royal flush, and four to a flush, all at once. Here is what each is worth, per coin bet.
                </Prose>
                <div className="max-w-xl">
                    <Table head={<><Th>Hold</Th><Th right>Draws</Th><Th right>Value</Th></>}>
                        {worked.holds.map((hold, i) => (
                            <tr key={hold!.held.join()} className={`border-b border-m-line/15 ${i === 0 ? "bg-m-accent text-m-accent-fg" : ""}`}>
                                <td className="py-1.5 pl-1 pr-4 normal-case">{hold!.held.map(showCard).join(" ")}</td>
                                <td className="py-1.5 pr-4 text-right tabular-nums">{count(hold!.draws)}</td>
                                <td className="py-1.5 pr-1 text-right font-bold tabular-nums">{hold!.value.toFixed(4)}</td>
                            </tr>
                        ))}
                    </Table>
                </div>
                <Prose>
                    The pair wins, even though the royal draw is the exciting one. The gap of {(worked.holds[0]!.value - worked.holds[1]!.value).toFixed(3)} coins looks small, but small gaps on thousands of decisions are the difference between the published return and what most people actually get.
                </Prose>
            </section>

            <section className="flex flex-col gap-6">
                <Divider label="Where the return comes from" index={3} ticks />
                <Prose>
                    A game&apos;s <Term>return</Term> is the sum of each hand&apos;s probability times its pay, under perfect play. I solved the three single-hand games exactly, and all three match the published figures, which also checks that the hand rules in these games are right.
                </Prose>
                <Table head={<><Th>Game</Th><Th right>Solved return</Th><Th right>Published</Th><Th right>Hands that pay</Th><Th right>Std. dev.</Th></>}>
                    {SOLVED.map(({ id, analysis }) => (
                        <tr key={id} className="border-b border-m-line/15">
                            <td className="py-1.5 pr-4">{getVariant(id).name}</td>
                            <td className="py-1.5 pr-4 text-right tabular-nums">{percent(analysis.return, 4)}</td>
                            <td className="py-1.5 pr-4 text-right tabular-nums">{percent(getVariant(id).publishedReturn, 4)}</td>
                            <td className="py-1.5 pr-4 text-right tabular-nums">{percent(analysis.hitFrequency, 1)}</td>
                            <td className="py-1.5 pr-4 text-right tabular-nums">{analysis.standardDeviation.toFixed(2)}</td>
                        </tr>
                    ))}
                </Table>
                <div className="grid gap-8 md:grid-cols-2">
                    {SOLVED.map(({ id, analysis }) => <ReturnChart key={id} title={getVariant(id).name} hands={analysis.hands} />)}
                </div>
                <Prose>
                    Every game pays on about 45% of hands, but they get there differently. Jacks or Better earns most of its return from small, common wins. Double Double Bonus cuts two pair to even money and moves that value into four of a kinds, which is why its standard deviation is {stats["double-double-bonus"].standardDeviation.toFixed(2)} bets against {stats["jacks-or-better"].standardDeviation.toFixed(2)}. Deuces Wild leans on four of a kind, which lands on {percent(stats["deuces-wild"].hands.find((hand) => hand.id === "four")!.probability, 1)} of hands. Its full-pay table returns {percent(stats["deuces-wild"].return)}, which is more than you bet, if your play is perfect.
                </Prose>
            </section>

            <section className="flex flex-col gap-6">
                <Divider label="Ultimate X" index={4} ticks />
                <Prose>
                    Ultimate X doubles the bet to 10 coins a hand but still pays on 5, so it has to earn back half of everything through multipliers. A win on a line sets that line&apos;s multiplier for its next hand, and a loss resets it to &times;1.
                </Prose>
                <Prose>
                    If you use one strategy that ignores the current multiplier, this hand&apos;s multiplier and this hand&apos;s pay are independent, and the return is simple: <Term>average pay &times; average multiplier &divide; 2</Term>. On Bonus Poker 7/5, plain perfect play pays {base.return.toFixed(4)} coins per coin bet. The Ultimate X strategy accepts a lower {ultimate.basePay.toFixed(4)}, because chasing flushes and full houses earns a bigger next multiplier.
                </Prose>
                <div className="max-w-xl">
                    <Table head={<><Th>Bonus Poker 7/5, 10-play</Th><Th right>Value</Th></>}>
                        <tr className="border-b border-m-line/15"><td className="py-1.5 pr-4">Average pay per coin</td><td className="py-1.5 pr-4 text-right tabular-nums">{ultimate.basePay.toFixed(4)}</td></tr>
                        <tr className="border-b border-m-line/15"><td className="py-1.5 pr-4">Average multiplier</td><td className="py-1.5 pr-4 text-right tabular-nums">&times;{ultimate.averageMultiplier.toFixed(4)}</td></tr>
                        <tr className="border-b border-m-line/15"><td className="py-1.5 pr-4">Return, one strategy (solved)</td><td className="py-1.5 pr-4 text-right tabular-nums">{percent(ultimate.return)}</td></tr>
                        <tr className="border-b border-m-line/15"><td className="py-1.5 pr-4">Return, perfect play (published)</td><td className="py-1.5 pr-4 text-right tabular-nums">{percent(getVariant("ultimate-x").publishedReturn)}</td></tr>
                    </Table>
                </div>
                <Prose>
                    Perfect play gains the last {((getVariant("ultimate-x").publishedReturn - ultimate.return) * 100).toFixed(2)} points by also adjusting to the multipliers you hold right now. As a check on the method, the same calculation on 8/6 Jacks or Better gives {percent(check.return)}, and the published return for one strategy on that game is 99.38%.
                </Prose>
            </section>

            <section className="flex flex-col gap-6">
                <Divider label="Ultimate X Gold" index={5} ticks />
                <Prose>
                    Gold ties multipliers to hand types rather than lines. A paying hand on the deal raises the multipliers on the hands ranked above it, each multiplier waits until you land that hand, and then it falls back to its first step. So a good deal pays off later, on any line.
                </Prose>
                <div className="max-w-xl">
                    <Table head={<><Th>Hand</Th><Th>Steps</Th><Th>Dealing it raises</Th></>}>
                        {gold.categories.filter((category) => category.progression || category.upgrades).map((category) => (
                            <tr key={category.id} className="border-b border-m-line/15">
                                <td className="whitespace-nowrap py-1.5 pr-4">{category.name}</td>
                                <td className="whitespace-nowrap py-1.5 pr-4 tabular-nums">{category.progression?.join(" ") ?? "–"}</td>
                                <td className="py-1.5 pr-4 text-m-muted">{category.upgrades?.map((id) => gold.categories.find((c) => c.id === id)!.name).join(", ") ?? "–"}</td>
                            </tr>
                        ))}
                    </Table>
                </div>
                <Prose>
                    I did not solve Gold. Its multipliers carry over between hands, so the best hold depends on the whole board and the single formula above no longer applies. The {percent(gold.publishedReturn)} return is the published figure for 5-play Bonus Poker 7/5. The steps come from the published example. The published rules give the upgrade pattern, but not every row, so I filled the rest by the same rule: each hand raises the three above it. Treat those rows as a close reading of the rules, not a copy of a machine&apos;s table.
                </Prose>
            </section>

            <section className="flex flex-col gap-3">
                <Divider label="Sources" index={6} ticks />
                <Body className="max-w-3xl text-sm">
                    Pay tables, multipliers, and published returns are from Wizard of Odds:{" "}
                    <SourceLink href={`${WIZARD_URL}/ultimate-x/`}>Ultimate X</SourceLink>,{" "}
                    <SourceLink href={`${WIZARD_URL}/ultimate-x-gold/`}>Ultimate X Gold</SourceLink>,{" "}
                    <SourceLink href={`${WIZARD_URL}/jacks-or-better/`}>Jacks or Better</SourceLink>,{" "}
                    <SourceLink href={`${WIZARD_URL}/double-double-bonus/`}>Double Double Bonus</SourceLink>,{" "}
                    <SourceLink href={`${WIZARD_URL}/deuces-wild/`}>Deuces Wild</SourceLink>, and the{" "}
                    <SourceLink href="https://wizardofodds.com/games/video-poker/strategy/ultimate-x/jacks-or-better/">8/6 Ultimate X strategy</SourceLink>. Solved figures are from <Term>scripts/solveVideoPoker.ts</Term>.
                </Body>
            </section>
        </div>
    );
};
