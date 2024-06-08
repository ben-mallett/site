import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { getAllPosts } from "./api"

const bgColors = [
  "bg-red-300",
  "bg-blue-300",
  "bg-green-300",
  "bg-yellow-300",
  "bg-purple-300",
  "bg-pink-300",
  "bg-indigo-300",
  "bg-teal-300",
  "bg-orange-300",
  "bg-gray-300",
  "bg-lime-300",
  "bg-emerald-300",
  "bg-cyan-300",
  "bg-sky-300",
  "bg-violet-300",
  "bg-fuchsia-300",
  "bg-rose-300",
  "bg-amber-300",
  "bg-lime-400",
  "bg-emerald-400"
]

const links = [
  "/showcase/conway",
  "/blog/conway",
  "/blog/helloworld"
]

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRandomBgColor() {
  const bgColor: any = bgColors[Math.floor(Math.random() * bgColors.length)];
  return bgColor
}

export function getRandomLink() {
  const link: any = links[Math.floor(Math.random() * links.length)]
  return link
}

