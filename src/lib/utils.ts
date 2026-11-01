import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type RandomLinks = { blog: string[]; showcase: string[] }

// Picks the blog or the showcase evenly, then a page within it, so the showcase's many games don't crowd out the posts.
export function getRandomLink({ blog, showcase }: RandomLinks, current: string, random: () => number = Math.random) {
  const pick = (links: string[]) => links[Math.floor(random() * links.length)]
  const others = (links: string[]) => links.filter((link) => link !== current)
  const [first, second] = random() < 0.5 ? [blog, showcase] : [showcase, blog]
  return pick(others(first).length ? others(first) : others(second))
}
