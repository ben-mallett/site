import { ReactNode } from "react"
import { cn } from "@/lib/utils"

// Each face sets its own family, width, and weight so it overrides the parent Display styles.
// Size nudges keep cap heights roughly level when faces sit side by side.
const slopFaces = {
    wide: "font-m-display font-black [font-stretch:125%]",
    condensed: "font-m-display font-black [font-stretch:75%]",
    serif: "font-m-serif font-normal italic normal-case tracking-normal text-[1.12em]",
    pixel: "font-m-pixel font-normal tracking-[-0.06em] text-[0.9em]",
    mono: "font-m-mono font-bold tracking-tighter text-[0.88em]",
    outline: "font-m-display font-black [font-stretch:125%] text-transparent [-webkit-text-stroke:0.035em_rgb(var(--m-fg))]",
}

type SlopFace = keyof typeof slopFaces

type SlopProps = {
    children: ReactNode
    face: SlopFace
    className?: string
}

// One run of text in a single face. Mix several inside a Display:
// <Display><Slop face="wide">Mara</Slop><Slop face="serif">th</Slop><Slop face="pixel">on</Slop></Display>
export const Slop = ({ children, face, className }: SlopProps) => (
    <span className={cn(slopFaces[face], className)}>{children}</span>
)

// Small seeded PRNG so server and client pick the same faces.
const seeded = (seed: string) => {
    let h = 2166136261
    for (const char of seed) h = Math.imul(h ^ char.charCodeAt(0), 16777619)
    return () => {
        h = Math.imul(h ^ (h >>> 15), 2246822507)
        h = Math.imul(h ^ (h >>> 13), 3266489909)
        return ((h ^= h >>> 16) >>> 0) / 4294967296
    }
}

type SlopTextProps = {
    text: string
    // "word" gives each word one face. "chunk" also splits words into pieces.
    split?: "word" | "chunk"
    faces?: SlopFace[]
    // Change the seed to reroll the mix for the same text.
    seed?: string
    className?: string
}

const defaultFaces: SlopFace[] = ["wide", "condensed", "serif", "pixel", "mono", "outline"]

// Assigns faces to a string automatically. The same text and seed always give the same result.
export const SlopText = ({ text, split = "chunk", faces = defaultFaces, seed = "", className }: SlopTextProps) => {
    const random = seeded(text + seed)
    const pieces: { text: string; face: SlopFace }[] = []
    let last: SlopFace | undefined

    const pick = () => {
        const options = faces.length > 1 ? faces.filter((f) => f !== last) : faces
        last = options[Math.floor(random() * options.length)]
        return last
    }

    text.split(/(\s+)/).forEach((word) => {
        if (!word.trim()) {
            pieces.push({ text: word, face: last ?? faces[0] })
            return
        }
        if (split === "word" || word.length < 4) {
            pieces.push({ text: word, face: pick() })
            return
        }
        let i = 0
        while (i < word.length) {
            const size = Math.min(word.length - i, 1 + Math.floor(random() * 4))
            pieces.push({ text: word.slice(i, i + size), face: pick() })
            i += size
        }
    })

    return (
        <span className={className}>
            <span className="sr-only">{text}</span>
            <span aria-hidden>
                {pieces.map((piece, i) => (
                    <Slop key={i} face={piece.face}>
                        {piece.text}
                    </Slop>
                ))}
            </span>
        </span>
    )
}
