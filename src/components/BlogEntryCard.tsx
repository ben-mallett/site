import { EntryCard } from "@/components/EntryCard";
import { GroupCard } from "@/components/GroupCard";
import { BlogEntry } from "@/lib/api";

// A card in a list of posts: one post, or one card standing for a whole series.
export const BlogEntryCard = ({ entry, index, compact = false }: { entry: BlogEntry; index: number; compact?: boolean }) => {
    if (entry.kind === "post") {
        const { post } = entry;
        return <EntryCard href={`/blog/${post.id}`} index={index} kind="Blog" title={post.title} description={compact ? undefined : post.description} preview={post.excerpt} meta={post.date} />;
    }
    return (
        <GroupCard index={index} kind="Series" title={entry.title} description={entry.description} countLabel={`${entry.posts.length} articles`} meta={entry.date} preview={entry.posts[0].excerpt} previewPage={`/blog/${entry.posts[0].id}`}>
            {entry.posts.map((post, i) => (
                <EntryCard key={post.id} href={`/blog/${post.id}`} index={i} kind={`Part ${i + 1}`} title={post.title} description={post.description} preview={post.excerpt} />
            ))}
        </GroupCard>
    );
};
