import { Button, Label } from "@/components/theme";
import { DEFAULT_RULES, Rules } from "@/lib/blackjack";

type Option<T> = { label: string; value: T };

// Published effect of each rule on the player's return, from the Wizard of Odds rule variations page.
const SETTINGS: { key: keyof Rules; label: string; note?: string; options: Option<boolean | number>[] }[] = [
    { key: "dealerHitsSoft17", label: "Dealer on soft 17", note: "Hitting costs you about 0.22%", options: [{ label: "Hits", value: true }, { label: "Stands", value: false }] },
    { key: "doubleAfterSplit", label: "Double after split", note: "Losing it costs you about 0.14%", options: [{ label: "Allowed", value: true }, { label: "Not allowed", value: false }] },
    { key: "resplitAces", label: "Re-split aces", note: "Allowing it gives you about 0.08%", options: [{ label: "Not allowed", value: false }, { label: "Allowed", value: true }] },
    { key: "blackjackPays", label: "Blackjack pays", note: "6:5 costs you about 1.39%", options: [{ label: "3:2", value: 1.5 }, { label: "6:5", value: 1.2 }] },
    { key: "decks", label: "Decks", note: "Changing this shuffles a new shoe", options: [1, 2, 4, 6, 8].map((decks) => ({ label: String(decks), value: decks })) },
];

export const BlackjackRules = ({ rules, locked, onChange }: { rules: Rules; locked: boolean; onChange: (rules: Rules) => void }) => (
    <div className="flex flex-col gap-4">
        {SETTINGS.map(({ key, label, note, options }) => (
            <div key={key} className="flex flex-col gap-1" role="group" aria-label={label}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <Label tone="fg">{label}</Label>
                    {note && <span className="font-m-mono text-[10px] text-m-muted">{note}</span>}
                </div>
                <div className="flex gap-1">
                    {options.map((option) => (
                        <Button
                            key={option.label}
                            size="sm"
                            variant={rules[key] === option.value ? "solid" : "outline"}
                            aria-pressed={rules[key] === option.value}
                            disabled={locked}
                            className="flex-1"
                            onClick={() => onChange({ ...rules, [key]: option.value })}
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>
            </div>
        ))}
        {locked && <Label tone="accent">Finish this hand to change the rules</Label>}
        <div className="flex items-center justify-between gap-3">
            <span className="font-m-mono text-[10px] text-m-muted">Effects are published figures, and vary a little by game.</span>
            <Button size="sm" variant="ghost" disabled={locked} onClick={() => onChange(DEFAULT_RULES)}>Defaults</Button>
        </div>
    </div>
);
