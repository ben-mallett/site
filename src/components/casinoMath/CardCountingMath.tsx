import { DemoLinks, Prose, SourceLink, Table, Td, Term, Th, count, percent } from "@/components/Article";
import { Body, Divider, Label } from "@/components/theme";
import stats from "@/lib/hiLoStats.json";

const signedPercent = (value: number, digits = 2) => `${value >= 0 ? "+" : "−"}${Math.abs(value * 100).toFixed(digits)}%`;

const TAGS = [
    { cards: "2 3 4 5 6", tag: "+1", inDeck: 20, why: "Good for the dealer, so their leaving helps you" },
    { cards: "7 8 9", tag: "0", inDeck: 12, why: "Close to neutral, so they are ignored" },
    { cards: "10 J Q K A", tag: "−1", inDeck: 20, why: "Good for you, so their leaving hurts you" },
];

const tcLabel = (tc: number, low: number, high: number) => tc === low ? `≤ −${-tc}` : tc === high ? `≥ +${tc}` : tc > 0 ? `+${tc}` : tc < 0 ? `−${-tc}` : "0";

// Edge by true count, as bars on both sides of zero. Sign is shown by side and by the printed value.
const EdgeChart = () => {
    const rows = stats.byCount;
    const largest = Math.max(...rows.map((row) => Math.abs(row.edge)));
    const low = rows[0].trueCount, high = rows[rows.length - 1].trueCount;
    return (
        <figure className="m-0 flex flex-col gap-3">
            <figcaption><Label tone="fg">Player edge by true count, with flat bets and fixed basic strategy</Label></figcaption>
            <div className="flex flex-col gap-0.5" role="table" aria-label="Edge and frequency by true count">
                <div role="row" className="grid grid-cols-[3.5rem_1fr_4.5rem_4rem] gap-2 font-m-mono text-[10px] uppercase text-m-muted">
                    <span role="columnheader">Count</span>
                    <span role="columnheader" className="text-center">Edge</span>
                    <span role="columnheader" className="text-right">Edge</span>
                    <span role="columnheader" className="text-right">Rounds</span>
                </div>
                {rows.map((row) => (
                    <div
                        key={row.trueCount}
                        role="row"
                        title={`True count ${tcLabel(row.trueCount, low, high)}: edge ${signedPercent(row.edge)}, ${percent(row.frequency, 1)} of rounds`}
                        className="grid grid-cols-[3.5rem_1fr_4.5rem_4rem] items-center gap-2 font-m-mono text-[11px] hover:bg-m-fg/5"
                    >
                        <span role="cell" className="tabular-nums">{tcLabel(row.trueCount, low, high)}</span>
                        <span role="cell" className="grid h-3 grid-cols-2">
                            <span className="flex justify-end border-r border-m-line/40">
                                {row.edge < 0 && <span className="h-full bg-m-fg/40" style={{ width: `${(-row.edge / largest) * 100}%` }} />}
                            </span>
                            <span>{row.edge > 0 && <span className="block h-full bg-m-accent" style={{ width: `${(row.edge / largest) * 100}%` }} />}</span>
                        </span>
                        <span role="cell" className="text-right tabular-nums">{signedPercent(row.edge)}</span>
                        <span role="cell" className="text-right tabular-nums text-m-muted">{percent(row.frequency, 1)}</span>
                    </div>
                ))}
            </div>
        </figure>
    );
};

export const CardCountingMath = () => {
    const rows = stats.byCount;
    const at = (tc: number) => rows.find((row) => row.trueCount === tc)!;
    const profitable = rows.filter((row) => row.edge > 0).reduce((sum, row) => sum + row.frequency, 0);
    // Average rise in edge per true count, across the counts common enough to measure well.
    const slope = (at(4).edge - at(-4).edge) / 8;
    const ruleGap = stats.flatEdge - stats.s17.flatEdge;
    const standardError = stats.flatDeviation / Math.sqrt(stats.rounds);
    const [, middle, wide] = stats.spreadResults;
    const firstAhead = rows.find((row) => row.edge > 0)!.trueCount;

    return (
        <div className="flex flex-col gap-14">
            <DemoLinks demos={[{ href: "/showcase/hi-lo-trainer", label: "Hi-Lo trainer" }, { href: "/showcase/blackjack", label: "Blackjack" }]} />

            <section className="flex flex-col gap-6">
                <Divider label="Three numbers per card" index={1} ticks />
                <Prose>
                    A shoe rich in tens and aces favors you. Blackjacks pay 3 to 2, doubles land on big cards more often, and the dealer has to hit stiff hands and bust. Hi-Lo reduces that to a tag for each card you see.
                </Prose>
                <div className="max-w-3xl">
                    <Table head={<><Th>Cards</Th><Th>Tag</Th><Th right>Per deck</Th><Th>Why</Th></>}>
                        {TAGS.map((row) => (
                            <tr key={row.tag} className="border-b border-m-line/15">
                                <Td>{row.cards}</Td>
                                <Td strong>{row.tag}</Td>
                                <Td right>{row.inDeck}</Td>
                                <td className="py-1.5 pr-4 normal-case text-m-muted">{row.why}</td>
                            </tr>
                        ))}
                    </Table>
                </div>
                <Prose>
                    There are 20 cards at +1 and 20 at &minus;1 in every deck, so the tags sum to zero. That makes the system <Term>balanced</Term>: a whole shoe always counts back to 0, which is also a simple way to check your own counting.
                </Prose>
            </section>

            <section className="flex flex-col gap-6">
                <Divider label="The running count" index={2} ticks />
                <Prose>
                    The running count is the sum of the tags so far. Each card moves it by at most one, and 40 of every 52 cards move it at all. It behaves like a random walk tied down at both ends, starting and finishing at zero. Its spread can be worked out exactly from the hypergeometric distribution, with no simulation:
                </Prose>
                <Prose><Term>standard deviation = &radic;( n &times; 40/52 &times; (N &minus; n) / (N &minus; 1) )</Term></Prose>
                <div className="max-w-md">
                    <Table head={<><Th>Cards dealt, of 312</Th><Th right>Typical swing</Th></>}>
                        {stats.runningCount.map((row) => (
                            <tr key={row.dealt} className="border-b border-m-line/15">
                                <Td>{row.dealt}</Td>
                                <Td right>&plusmn;{row.deviation.toFixed(1)}</Td>
                            </tr>
                        ))}
                    </Table>
                </div>
                <Prose>
                    So in a six-deck game a running count of +7 is ordinary. On its own it also says little, because the same surplus means different things in different amounts of remaining cards.
                </Prose>
            </section>

            <section className="flex flex-col gap-6">
                <Divider label="The true count" index={3} ticks />
                <Prose>
                    A running count of +6 means six more high cards than low cards are left. With six decks remaining, that surplus is spread thin. With one deck remaining, it is concentrated. Dividing gives the surplus per deck, and that is what predicts your edge:
                </Prose>
                <Prose><Term>true count = running count &divide; decks remaining</Term></Prose>
                <Prose>
                    A +6 with six decks left is a true count of +1. The same +6 with one deck left is +6. At the table you judge decks from the discard tray to about half a deck. Then always round down, here and in the trainer and the game: +1.75 is +1, and &minus;1.5 is &minus;2. Some guides round to the nearest number instead, so compare true counts between sources with care.
                </Prose>
            </section>

            <section className="flex flex-col gap-6">
                <Divider label="What a count is worth" index={4} ticks />
                <Prose>
                    I found no reliable published table of edge per true count for these rules, so I simulated {count(stats.rounds)} rounds: six decks, dealer hits soft 17, double after split, no surrender, 75% of the shoe dealt. The player bets one unit every round and uses fixed basic strategy, so the count changes nothing except the cards left in the shoe. Counts are rounded down, so +1 here means anything from +1 up to just under +2.
                </Prose>
                <div className="max-w-3xl"><EdgeChart /></div>
                <Prose>
                    Averaged over every round, the house keeps {percent(-stats.flatEdge)}. Each point of true count moves the edge by about {percent(slope)}, and the player is ahead only from +{firstAhead} up. That covers just {percent(profitable, 0)} of rounds, so most of the time a counter is still the underdog.
                </Prose>
                <Prose>
                    As a check, the same simulator with the dealer standing on soft 17 gives {signedPercent(stats.s17.flatEdge)}, a gap of {percent(-ruleGap)}. Wizard of Odds publishes that rule&apos;s cost as 0.22%. The sampling error on each run is about &plusmn;{percent(standardError, 3)}.
                </Prose>
            </section>

            <section className="flex flex-col gap-6">
                <Divider label="Insurance, a clean example" index={5} ticks />
                <Prose>
                    Insurance is the easiest bet to reason about, because it depends on one thing: is the hole card a ten? It pays 2 to 1, so it breaks even when exactly one card in three is a ten. A full deck has 16 tens in 52 cards, or {percent(16 / 52, 1)}, which is why it normally loses.
                </Prose>
                <Prose>
                    Each true count means one more high card than low card per deck left, which is half a card more high and half a card fewer low. Tens are 16 of the 20 high cards, so they gain 0.4 per deck for each point of count. Solving <Term>(16 + 0.4 &times; TC) / 52 = 1/3</Term> gives a true count of about +3.3.
                </Prose>
                <div className="max-w-2xl">
                    <Table head={<><Th>True count</Th><Th right>Tens left</Th><Th right>Insurance edge</Th></>}>
                        {[0, 2, 3, 4, 5].map((tc) => (
                            <tr key={tc} className="border-b border-m-line/15">
                                <Td>{tc > 0 ? `+${tc}` : tc}</Td>
                                <Td right>{percent(at(tc).tenDensity, 1)}</Td>
                                <Td right>{signedPercent(at(tc).insuranceEdge!, 1)}</Td>
                            </tr>
                        ))}
                    </Table>
                </div>
                <Prose>
                    The simulation agrees. A rounded-down +3 covers everything from +3 up to just under +4, and tens there average {percent(at(3).tenDensity, 1)}, just past one third. So the bet turns barely profitable at +3, which is exactly the published index. This table ignores the cards in your own hand, which shift the odds slightly on any one deal.
                </Prose>
            </section>

            <section className="flex flex-col gap-6">
                <Divider label="Turning a count into money" index={6} ticks />
                <Prose>
                    The count only pays if you bet more when you are ahead. Your expected win is the sum, over each true count, of how often it happens times the edge times your bet there. These are three simple bet ramps, all playing every round, measured against the same simulation.
                </Prose>
                <Table head={<><Th>Bet spread</Th><Th right>Win per 100 hands</Th><Th right>Swing per 100</Th><Th right>Edge on money bet</Th><Th right>Hands to break even</Th><Th right>Bankroll, 5% ruin</Th></>}>
                    {stats.spreadResults.map((row) => (
                        <tr key={row.name} className="border-b border-m-line/15">
                            <Td>{row.name}</Td>
                            <Td right>{row.evPerHundred >= 0 ? "+" : "−"}{Math.abs(row.evPerHundred).toFixed(2)}</Td>
                            <Td right>&plusmn;{row.deviationPerHundred.toFixed(0)}</Td>
                            <Td right>{signedPercent(row.edgeOnAction)}</Td>
                            <Td right>{row.evPerHundred > 0 ? count(row.handsToOvercome) : "Never"}</Td>
                            <Td right>{row.bankrollFor5Percent ? count(row.bankrollFor5Percent) : "–"}</Td>
                        </tr>
                    ))}
                </Table>
                <Label>All figures in betting units{" // "}Basic strategy only{" // "}No index plays</Label>
                <Prose>
                    Read the top row carefully. A 1 to 4 spread in this game still loses money despite perfect counting, because it does not lift the bet enough to outweigh the many bad rounds. Widening the spread fixes that. Going from 1 to 8 up to 1 to 12 multiplies the win by {(wide.evPerHundred / middle.evPerHundred).toFixed(1)}, while the swing grows by only {(wide.deviationPerHundred / middle.deviationPerHundred).toFixed(2)} times, because the extra money all goes on the rounds where you are ahead.
                </Prose>
                <Prose>
                    Two formulas do the rest. <Term>Hands to break even = variance &divide; expected win&sup2;</Term> is how long it takes for one standard deviation of luck to match your total winnings, and even the widest spread here needs about {count(wide.handsToOvercome)} hands. <Term>Risk of ruin = e^(&minus;2 &times; expected win &times; bankroll &divide; variance)</Term> sets the bankroll you need. Both are why counting is a grind and not a shortcut.
                </Prose>
                <Prose>
                    These are not the best possible results. Index plays, surrender, better rules, and leaving the table at bad counts all improve them. For comparison, the Wizard of Odds table for six decks with standing on soft 17, surrender, and indices shows a player edge of 0.587% on a 1 to 10 spread at the same penetration. The direction is the point: the edge is real, thin, and takes a lot of hands to show up.
                </Prose>
            </section>

            <section className="flex flex-col gap-3">
                <Divider label="Sources" index={7} ticks />
                <Body className="max-w-3xl text-sm">
                    Tags, the true count, and the insurance index are from <SourceLink href="https://wizardofodds.com/games/blackjack/card-counting/high-low/">Wizard of Odds on Hi-Lo</SourceLink>, and the soft 17 cost is from its <SourceLink href="https://wizardofodds.com/games/blackjack/rule-variations/">rule variations</SourceLink>. Edge, frequency, and bet ramp figures come from <Term>scripts/simulateHiLo.ts</Term> and are my own, so they carry its assumptions: its basic strategy chart is hand-written, and it was checked by the results above, not against a published chart for these rules.
                </Body>
            </section>
        </div>
    );
};
