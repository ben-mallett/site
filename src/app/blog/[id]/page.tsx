import Link from 'next/link'
import { PageShell } from '@/components/PageShell'
import { CardCountingMath } from '@/components/casinoMath/CardCountingMath'
import { Barcode, CellReveal, Display, Hazard, Label, Tag } from '@/components/theme'
import { getPostById, getAllPosts, getSeriesTitle } from '@/lib/api'
 
// Posts whose body needs live tables and charts, shown after the written part.
const POST_SECTIONS: Record<string, () => JSX.Element> = {
  // Video poker
  // Blackjack
  'card-counting-math': CardCountingMath,
  // Hold-em
}

export async function generateStaticParams() {
  const posts = await getAllPosts()
 
  return posts.map((post: any) => ({
    id: post.id,
  }))
}
 
export async function generateMetadata({ params: { id } } : { params: { id: string } }) {
  const { title } = await getPostById(id)
  return {
    title,
  }
}

export default async function Post({ params: { id } } : { params: { id: string }}) {
    const post: any = await getPostById(id)
    const { html, title, date, authors = [], tags = [] } = post
    const Sections = POST_SECTIONS[id]
    const series: any[] = post.series
      ? (await getAllPosts() as any[]).filter((other) => other.series === post.series).sort((a, b) => a.seriesOrder - b.seriesOrder)
      : []
    const position = series.findIndex((other) => other.id === id)
    const previous = series[position - 1], next = series[position + 1]
    return (
        <PageShell>
            <article className="mx-auto flex max-w-3xl flex-col gap-8">
                <Link href="/blog" className="self-start">
                    <Label className="hover:text-m-fg">&larr; Back to blog</Label>
                </Link>
                <CellReveal as="header" order="diagonal" className="flex flex-col gap-5">
                    <div className="flex items-center justify-between gap-4">
                        <Label index="01" decode>{post.series ? `${getSeriesTitle(post.series)} // Part ${position + 1} of ${series.length}` : date}</Label>
                        <Barcode value={id.toUpperCase()} height={18} />
                    </div>
                    <Display as="h1" size="lg" slop>{title}</Display>
                    <div className="flex flex-wrap items-center gap-2">
                        {authors.map((author: string) => <Tag key={author} color="fg">{author}</Tag>)}
                        {tags.map((tag: string) => <Tag key={tag} color="accent">{tag}</Tag>)}
                    </div>
                    <Hazard className="h-1.5 text-m-accent" />
                </CellReveal>
                <div className="m-prose" dangerouslySetInnerHTML={{ __html: html }} />
                {Sections && <Sections />}
                {post.series && (
                  <nav aria-label="More in this series" className="flex flex-wrap justify-between gap-4 border-t border-m-line/20 pt-5">
                    {previous ? <Link href={`/blog/${previous.id}`}><Label className="hover:text-m-fg">&larr; {previous.title}</Label></Link> : <span />}
                    {next && <Link href={`/blog/${next.id}`}><Label className="hover:text-m-fg">{next.title} &rarr;</Label></Link>}
                  </nav>
                )}
            </article>
        </PageShell>
    )
}
