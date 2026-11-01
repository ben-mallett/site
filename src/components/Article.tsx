import Link from "next/link";
import { ReactNode } from "react";
import { Body, Button } from "@/components/theme";

// Pieces shared by the long-form math pages.

export const percent = (value: number, digits = 2) => `${(value * 100).toFixed(digits)}%`;
export const count = (value: number) => Math.round(value).toLocaleString("en-US");

// Links from an article out to the demos it talks about.
export const DemoLinks = ({ demos }: { demos: { href: string; label: string }[] }) => (
    <div className="flex flex-wrap gap-2">
        {demos.map((demo) => (
            <Button key={demo.href} asChild variant="outline" size="sm"><Link href={demo.href}>{demo.label} &rarr;</Link></Button>
        ))}
    </div>
);

export const Prose = ({ children }: { children: ReactNode }) => <Body className="max-w-3xl md:text-lg">{children}</Body>;

export const Term = ({ children }: { children: ReactNode }) => <span className="font-m-mono text-[0.9em] text-m-accent">{children}</span>;

export const SourceLink = ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href} className="text-m-accent underline decoration-m-accent/40 underline-offset-4 hover:decoration-m-accent">{children}</a>
);

export const Th = ({ children, right }: { children: ReactNode; right?: boolean }) => (
    <th scope="col" className={`py-2 pr-4 font-medium ${right ? "text-right" : "text-left"}`}>{children}</th>
);

export const Td = ({ children, right, strong }: { children: ReactNode; right?: boolean; strong?: boolean }) => (
    <td className={`py-1.5 pr-4 tabular-nums ${right ? "text-right" : ""} ${strong ? "font-bold" : ""}`}>{children}</td>
);

export const Table = ({ head, children }: { head: ReactNode; children: ReactNode }) => (
    <div className="overflow-x-auto">
        <table className="w-full border-collapse font-m-mono text-xs uppercase tracking-[0.06em] md:text-sm">
            <thead><tr className="border-b border-m-line/30 text-[10px] text-m-muted md:text-xs">{head}</tr></thead>
            <tbody>{children}</tbody>
        </table>
    </div>
);
