import { DemoLinks, Prose, SourceLink, Table, Td, Term, Th, count, percent } from "@/components/Article";
import { Body, Divider } from "@/components/theme";
import stats from "@/lib/pokerMathStats.json";

const FIVE_TOTAL = 2598960;
const SEVEN_TOTAL = 133784560;

const choose = (n: number, k: number) => {
    let result = 1;
    for (let i = 0; i < k; i++) result = (result * (n - i)) / (i + 1);
    return Math.round(result);
};

const oddsAgainst = (probability: number) => {
    const odds = (1 - probability) / probability;
    return `${odds >= 100 ? count(odds) : odds.toFixed(1)} to 1`;
};

const OUTS = [2, 4, 6, 8, 9, 12, 15];
const oneCard = (outs: number) => outs / 46;
const twoCards = (outs: number) => 1 - ((47 - outs) / 47) * ((46 - outs) / 46);

const BETS = [
    { label: "1/3 pot", size: 1 / 3 },
    { label: "1/2 pot", size: 1 / 2 },
    { label: "2/3 pot", size: 2 / 3 },
    { label: "Pot", size: 1 },
    { label: "2x pot", size: 2 },
];

const FLOPS = [
    { hand: "A pocket pair", event: "flops a set or better", probability: 1 - choose(48, 3) / choose(50, 3) },
    { hand: "Two unpaired cards", event: "pairs at least one of them", probability: 1 - choose(44, 3) / choose(50, 3) },
    { hand: "Two suited cards", event: "flops a flush", probability: choose(11, 3) / choose(50, 3) },
    { hand: "Two suited cards", event: "flops exactly a flush draw", probability: (choose(11, 2) * 39) / choose(50, 3) },
    { hand: "Two suited cards", event: "makes a flush by the river", probability: (choose(11, 3) * choose(39, 2) + choose(11, 4) * 39 + choose(11, 5)) / choose(50, 5) },
];

const EquityBar = ({ win, tie }: { win: number; tie: number }) => (
    <span className="flex h-3 w-full min-w-24 gap-0.5" aria-hidden>
        <span className="block bg-m-accent" style={{ width: `${win * 100}%` }} />
        <span className="block bg-m-fg/70" style={{ width: `${tie * 100}%` }} />
        <span className="block flex-1 bg-m-fg/20" />
    </span>
);

export const HoldemMath = () => {
    const classes = stats.classes.map((name, i) => ({ name, five: stats.five[i], seven: stats.seven[i] })).reverse();
    const potOdds = 10 / 40;
    const drawOdds = 9 / 46;
    const drawValue = drawOdds * 50 - (1 - drawOdds) * 10;

    return (
        <div className="flex flex-col gap-14">
            <DemoLinks demos={[{ href: "/showcase/hold-em-trainer", label: "Hold-em trainer" }]} />

            <section className="flex flex-col gap-6">
                <Divider label="Why hands rank the way they do" index={1} ticks />
                <Prose>
                    Five cards from 52 can be chosen {count(FIVE_TOTAL)} ways, and hands rank by how rarely they occur. Each count is a small piece of multiplication. Four of a kind is 13 ranks times 48 possible fifth cards, which is {count(13 * 48)}. Straights are 10 possible runs times 4<sup>5</sup> suit patterns, minus the 40 that are also flushes, which is {count(10 * 4 ** 5 - 40)}.
                </Prose>
                <Table head={<><Th>Hand</Th><Th right>5 cards</Th><Th right>Chance</Th><Th right>Best 5 of 7</Th><Th right>Chance</Th><Th right>Odds against, 7</Th></>}>
                    {classes.map((row) => (
                        <tr key={row.name} className="border-b border-m-line/15">
                            <Td>{row.name}</Td>
                            <Td right>{count(row.five)}</Td>
                            <Td right>{percent(row.five / FIVE_TOTAL, row.five < 10000 ? 4 : 2)}</Td>
                            <Td right>{count(row.seven)}</Td>
                            <Td right>{percent(row.seven / SEVEN_TOTAL, row.seven < 100000 ? 4 : 2)}</Td>
                            <Td right>{oddsAgainst(row.seven / SEVEN_TOTAL)}</Td>
                        </tr>
                    ))}
                </Table>
                <Prose>
                    Hold-em plays the best five of seven cards, and that changes the picture. High card falls from {percent(stats.five[0] / FIVE_TOTAL, 0)} of hands to {percent(stats.seven[0] / SEVEN_TOTAL, 0)}, so it is rarer than one pair or even two pair. The official ranking still comes from five card hands. I counted all {count(SEVEN_TOTAL)} seven card hands, and every row matches the published table.
                </Prose>
            </section>

            <section className="flex flex-col gap-6">
                <Divider label="Starting hands" index={2} ticks />
                <Prose>
                    Two cards from 52 can be chosen {count(choose(52, 2))} ways, which group into 169 distinct types: 13 pairs, 78 suited hands, and 78 offsuit hands. A pair has {choose(4, 2)} combinations, a suited hand has 4, and an offsuit hand has 12. So you are dealt any pair 1 time in 17, and pocket aces specifically 1 time in {count(choose(52, 2) / 6)}. Thinking in combinations also shows why ace-king is more likely than it feels: there are 16 ways to hold it, and only 6 to hold aces.
                </Prose>
                <div className="max-w-2xl">
                    <Table head={<><Th>You hold</Th><Th>What happens</Th><Th right>Chance</Th></>}>
                        {FLOPS.map((row) => (
                            <tr key={row.event} className="border-b border-m-line/15">
                                <Td>{row.hand}</Td>
                                <td className="py-1.5 pr-4 normal-case">{row.event}</td>
                                <Td right strong>{percent(row.probability, 1)}</Td>
                            </tr>
                        ))}
                    </Table>
                </div>
                <Prose>
                    The first row is the reason small pairs are worth playing cheaply. You hit a set about one flop in eight and usually give up otherwise, so the bet you call needs to be small next to what you can win when you do hit.
                </Prose>
            </section>

            <section className="flex flex-col gap-6">
                <Divider label="Outs, and the rule of 2 and 4" index={3} ticks />
                <Prose>
                    An <Term>out</Term> is an unseen card that improves you to the likely winner. On the flop you have seen 5 cards, so 47 are unseen and two more are coming. The exact chance of hitting is one minus the chance of missing twice: <Term>1 &minus; (47 &minus; outs)/47 &times; (46 &minus; outs)/46</Term>. At the table you can multiply outs by 4 with two cards to come, or by 2 with one.
                </Prose>
                <div className="max-w-3xl">
                    <Table head={<><Th>Outs</Th><Th>Typical draw</Th><Th right>1 card, exact</Th><Th right>&times;2</Th><Th right>2 cards, exact</Th><Th right>&times;4</Th></>}>
                        {OUTS.map((outs) => (
                            <tr key={outs} className="border-b border-m-line/15">
                                <Td strong>{outs}</Td>
                                <td className="py-1.5 pr-4 normal-case text-m-muted">{{ 2: "Pocket pair to a set", 4: "Inside straight", 6: "Two overcards", 8: "Open-ended straight", 9: "Flush", 12: "Flush plus inside straight", 15: "Flush plus open-ended straight" }[outs]}</td>
                                <Td right>{percent(oneCard(outs), 1)}</Td>
                                <Td right>{outs * 2}%</Td>
                                <Td right>{percent(twoCards(outs), 1)}</Td>
                                <Td right>{outs * 4}%</Td>
                            </tr>
                        ))}
                    </Table>
                </div>
                <Prose>
                    The shortcut is close at the small draws people usually face, and drifts high as outs grow: {percent(twoCards(15), 1)} against 60% at 15 outs, because the &times;4 counts hitting on both cards twice. It also assumes every out wins, and an opponent who is drawing to a bigger hand can make some of them worthless.
                </Prose>
            </section>

            <section className="flex flex-col gap-6">
                <Divider label="Pot odds" index={4} ticks />
                <Prose>
                    A call is worth making when you win often enough to pay for it. The share of the time you need to win is the price of the call over everything you could end up with:
                </Prose>
                <Prose><Term>equity needed = call &divide; (pot + call)</Term></Prose>
                <Prose>
                    With $30 in the pot and $10 to call, that is 10 &divide; 40 = {percent(potOdds, 0)}. Now say you hold a flush draw on the turn, with 9 outs in 46 cards, or {percent(drawOdds, 1)}. If the pot is $50 and calling costs $10, you need 10 &divide; 60 = {percent(10 / 60, 1)}, so the call makes money:
                </Prose>
                <Prose><Term>value = {percent(drawOdds, 1)} &times; $50 &minus; {percent(1 - drawOdds, 1)} &times; $10 = +${drawValue.toFixed(2)}</Term></Prose>
                <Prose>
                    When the price is too high for the cards alone, <Term>implied odds</Term> can make up the gap by counting what you expect to win on later streets. An inside straight on the turn hits {percent(4 / 46, 1)} of the time, so you need ${((42 / 4) * 10).toFixed(0)} in winnings for every $10 you call. If the pot only holds $100, you have to expect another ${((42 / 4) * 10 - 100).toFixed(0)} when you hit. Reverse implied odds are the same idea in the other direction: when you hit and still lose, it costs more than the call.
                </Prose>
            </section>

            <section className="flex flex-col gap-6">
                <Divider label="Bet sizing" index={5} ticks />
                <Prose>
                    The same arithmetic, seen from the other side of the table, sets what a bet needs to accomplish. Betting <Term>b</Term> into a pot of <Term>p</Term> gives three numbers:
                </Prose>
                <div className="max-w-3xl">
                    <Table head={<><Th>Bet size</Th><Th right>Caller needs b/(p+2b)</Th><Th right>A bluff must work b/(p+b)</Th><Th right>Defend to stop it p/(p+b)</Th></>}>
                        {BETS.map(({ label, size }) => (
                            <tr key={label} className="border-b border-m-line/15">
                                <Td strong>{label}</Td>
                                <Td right>{percent(size / (1 + 2 * size), 1)}</Td>
                                <Td right>{percent(size / (1 + size), 1)}</Td>
                                <Td right>{percent(1 / (1 + size), 1)}</Td>
                            </tr>
                        ))}
                    </Table>
                </div>
                <Prose>
                    A pot-sized bet offers the caller 2 to 1, so they need one third equity, and it only has to work half the time as a pure bluff. The last column is why folding too much is costly: if you fold more often than that against a bet, any two cards can bet at you for profit. Bigger bets demand less defense, but put more of your own money at risk when you are called.
                </Prose>
            </section>

            <section className="flex flex-col gap-6">
                <Divider label="All in before the flop" index={6} ticks />
                <Prose>
                    Equity is your share of the pot: wins, plus half of ties. These come from dealing every one of the {count(stats.matchups[0].boards)} possible boards for each pair of hands, with the exact suits shown in the source script. Suits matter, so other versions of the same matchup differ by a little.
                </Prose>
                <Table head={<><Th>Matchup</Th><Th>Spot</Th><Th right>First hand wins</Th><Th right>Tie</Th><Th right>Equity</Th><Th>Win, tie, lose</Th></>}>
                    {stats.matchups.map((row) => (
                        <tr key={row.label} className="border-b border-m-line/15" title={`${row.label}: wins ${percent(row.win)}, ties ${percent(row.tie)}, loses ${percent(row.lose)}`}>
                            <Td strong>{row.label}</Td>
                            <td className="py-1.5 pr-4 normal-case text-m-muted">{row.note}</td>
                            <Td right>{percent(row.win, 1)}</Td>
                            <Td right>{percent(row.tie, 1)}</Td>
                            <Td right strong>{percent(row.equity, 1)}</Td>
                            <td className="py-1.5 pr-1"><EquityBar win={row.win} tie={row.tie} /></td>
                        </tr>
                    ))}
                </Table>
                <Prose>
                    The &quot;coin flip&quot; is real: a pair against two higher cards is close to even whichever pair it is, with 22 still a slight favorite over ace-king. Being dominated is what hurts. Ace-queen against ace-king shares the ace, so it is far worse off than 7-6 suited, which has nothing in common with the ace-king and wins more often than its high card would suggest.
                </Prose>
            </section>

            <section className="flex flex-col gap-6">
                <Divider label="What the math leaves out" index={7} ticks />
                <Prose>
                    All of this is against known cards or a fixed price, and real opponents hold a range of hands that shifts with how they bet. The full version of the game is solved by comparing ranges, and optimal play mixes bets and bluffs in those same ratios. The numbers on this page are the part you can do at the table: count your outs, compare them to the price, and know what your bet has to achieve.
                </Prose>
            </section>

            <section className="flex flex-col gap-3">
                <Divider label="Sources" index={8} ticks />
                <Body className="max-w-3xl text-sm">
                    Hand counts and the 7,462 distinct five card ranks are checked against <SourceLink href="https://en.wikipedia.org/wiki/Poker_probability">Wikipedia on poker probability</SourceLink>. Starting hand counts follow <SourceLink href="https://en.wikipedia.org/wiki/Texas_hold_%27em_starting_hands">starting hands</SourceLink>, and the pot odds examples follow <SourceLink href="https://en.wikipedia.org/wiki/Pot_odds">pot odds</SourceLink>. Matchup, flop, and bet sizing figures are computed directly, with no published table compared. The enumeration is <Term>scripts/solvePokerMath.ts</Term>.
                </Body>
            </section>
        </div>
    );
};
