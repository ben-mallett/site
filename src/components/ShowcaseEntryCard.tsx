import { EntryCard } from "@/components/EntryCard";
import { GroupCard } from "@/components/GroupCard";
import { ShowcaseEntry, ShowcaseItem } from "@/lib/api";

const ItemCard = ({ item, index }: { item: ShowcaseItem; index: number }) => (
    <EntryCard href={`/showcase/${item.slug}`} index={index} kind="Project" title={item.title} description={item.description} />
);

// A card in the showcase: one project, or one card standing for a whole category.
export const ShowcaseEntryCard = ({ entry, index }: { entry: ShowcaseEntry; index: number }) => {
    if (entry.kind === "item") return <ItemCard item={entry.item} index={index} />;
    return (
        <GroupCard index={index} kind="Category" title={entry.title} description={entry.description} countLabel={entry.countLabel} previewPage={`/showcase/${entry.items[0].slug}`}>
            {entry.items.map((item, i) => <ItemCard key={item.slug} item={item} index={i} />)}
        </GroupCard>
    );
};
