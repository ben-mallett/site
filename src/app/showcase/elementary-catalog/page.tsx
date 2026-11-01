import { ElementaryCatalog } from "@/components/ElementaryCatalog";
import { PageShell } from "@/components/PageShell";

export const metadata = { title: "Rule Catalog" };

export default function Page() {
    return (
        <PageShell>
            <ElementaryCatalog />
        </PageShell>
    );
}
