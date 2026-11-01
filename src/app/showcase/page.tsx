import { PageShell } from "@/components/PageShell";
import { ShowcaseEntryCard } from "@/components/ShowcaseEntryCard";
import { Display, Label } from "@/components/theme";
import { getShowcaseEntries } from "@/lib/api";

export default async function ShowcasePage() {
    const entries = await getShowcaseEntries()

    return (
        <PageShell className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
                <Label index="02" decode>Projects{" // "}{entries.length} active</Label>
                <Display as="h1" size="lg" slop decode>The showroom</Display>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {entries.map((entry, i) => <ShowcaseEntryCard key={entry.kind === "item" ? entry.item.slug : entry.id} entry={entry} index={i} />)}
            </div>
            <Label decode>And many more to come...</Label>
        </PageShell>
    );
}
