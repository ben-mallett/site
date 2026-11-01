import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { BlogEntryCard } from "@/components/BlogEntryCard";
import { ShowcaseEntryCard } from "@/components/ShowcaseEntryCard";
import { Body, Button, CellReveal, Display, Divider, Hazard, Label, LifeField, Panel, Slop } from "@/components/theme";
import { getBlogEntries, getShowcaseEntries } from "@/lib/api";

export default async function Home() {
  const entries = await getBlogEntries()
  const showcaseEntries = await getShowcaseEntries()

  return (
    <PageShell className="flex flex-col gap-16">
      <CellReveal as="section" order="diagonal" spread={900} className="flex flex-col gap-8 pt-6">
        <Label index="00" decode>Profile</Label>
        <Display as="h1" size="xl">
          <Slop face="wide">Hey</Slop>
          <Slop face="serif">! </Slop>
          <Slop face="condensed">I&apos;m </Slop>
          <Slop face="outline">B</Slop>
          <Slop face="pixel">e</Slop>
          <Slop face="wide">n</Slop>
        </Display>
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_22rem]">
          <div className="flex flex-col gap-8">
            <Body className="max-w-2xl text-lg md:text-xl">
              Experienced professional with a passion for building things.
            </Body>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/resume.pdf">Resume</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">Contact</Link>
              </Button>
            </div>
          </div>
          <Panel label="Cellular field" meta="B3/S23" bodyClassName="p-0">
            <div className="h-28">
              <LifeField />
            </div>
          </Panel>
        </div>
        <Hazard className="h-2 text-m-accent" />
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            ["Class", "Software Engineer"],
            ["Specialty", "Computer Scientist"],
            ["Status", "Lifelong Learner"],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-2 border-l border-m-line/25 pl-3">
              <dt><Label decode>{label}</Label></dt>
              <dd><Display as="span" size="sm" width="condensed" decode>{value}</Display></dd>
            </div>
          ))}
        </dl>
      </CellReveal>

      <section className="flex flex-col gap-6">
        <Divider label="Recent blogposts" index={1} ticks />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {entries.slice(0, 3).map((entry, i) => <BlogEntryCard key={entry.kind === "post" ? entry.post.id : entry.id} entry={entry} index={i} compact />)}
        </div>
        <Button asChild variant="ghost" className="self-start">
          <Link href="/blog">To the blog &rarr;</Link>
        </Button>
      </section>

      <section className="flex flex-col gap-6">
        <Divider label="Recent projects" index={2} ticks />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {showcaseEntries.slice(0, 3).map((entry, i) => <ShowcaseEntryCard key={entry.kind === "item" ? entry.item.slug : entry.id} entry={entry} index={i} />)}
        </div>
        <Button asChild variant="ghost" className="self-start">
          <Link href="/showcase">To the showroom &rarr;</Link>
        </Button>
      </section>
    </PageShell>
  );
}
