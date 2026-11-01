import { PageShell } from "@/components/PageShell";
import { BlogEntryCard } from "@/components/BlogEntryCard";
import { Display, Label } from "@/components/theme";
import { getBlogEntries } from "@/lib/api";

export default async function BlogPage() {
    const entries = await getBlogEntries()

    return (
        <PageShell className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
                <Label index="01" decode>Archive{" // "}{entries.length} entries</Label>
                <Display as="h1" size="lg" slop decode>The blog</Display>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {entries.map((entry, i) => <BlogEntryCard key={entry.kind === "post" ? entry.post.id : entry.id} entry={entry} index={i} />)}
            </div>
            <Label decode>And many more to come...</Label>
        </PageShell>
    );
}
