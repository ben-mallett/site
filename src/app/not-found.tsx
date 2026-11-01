import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Body, Button, CellReveal, Display, Hazard, Label, LifeField, Slop } from "@/components/theme";

export default function NotFound() {
  return (
    <PageShell
      backdrop={<div className="h-full w-full opacity-30"><LifeField color="orange" cell={14} /></div>}
      className="flex flex-col items-start justify-center gap-8"
    >
      <Label index="404" decode>Signal lost</Label>
      <CellReveal order="radial" color="orange">
      <Display as="h1" size="xl">
        <Slop face="wide">Awk</Slop>
        <Slop face="serif">ward</Slop>
        <Slop face="pixel">...</Slop>
      </Display>
      </CellReveal>
      <Body className="max-w-xl text-lg">
        Looks like I have taken you somewhere that does not exist yet. You should head on back where you came from.
      </Body>
      <Hazard className="h-2 max-w-md text-m-orange" />
      <Button asChild size="lg">
        <Link href="/">Return home</Link>
      </Button>
    </PageShell>
  );
}
