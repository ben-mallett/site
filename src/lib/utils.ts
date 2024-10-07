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

export enum PokerSuit {
  Heart = "HEART",
  Spade = "SPADE",
  Diamond = "DIAMOND",
  Club = "CLUB"
}

export enum PokerValue {
  Two = "2",
  Three = "3",
  Four = "4",
  Five = "5",
  Six = "6",
  Seven = "7",
  Eight = "8",
  Nine = "9",
  Ten = "T",
  Jack = "J",
  Queen = "Q",
  King = "K",
  Ace = "A"
}

export enum PokerHands {
  HighCard = "High Card",
  Pair = "One Pair",
  JacksOrBetter = "Jacks or Better",
  TwoPair = "Two Pair",
  ThreeOfAKind = "Three of a Kind",
  Straight = "Straight",
  Flush = "Flush",
  FullHouse = "Full House",
  Quads = "Quads",
  QuadsTwosThreesFours = "Quads (2s, 3s, 4s)",
  QuadsFiveToTen = "Quads (5-10)",
  QuadsJackQueenKing = "Quads (Js, Qs, Ks)",
  QuadAces = "Quad Aces",
  StraightFlush = "Straight Flush",
  RoyalFlush = "Royal Flush"
}

export const PokerValueRanks: Record<PokerValue, number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "T": 10,
  "J": 11,
  "Q": 12,
  "K": 13,
  "A": 14
}

export const PokerSuitColors: Record<PokerSuit, string> = {
  "HEART": 'bg-red-400',
  "SPADE": 'bg-fuchsia-400',
  "DIAMOND": 'bg-sky-400',
  "CLUB": 'bg-emerald-400'
}

export const PokerSuitSymbols: Record<PokerSuit, string> = {
  "HEART": "&#9829;",
  "DIAMOND": "&#9830;",
  "CLUB": "&#9827;",
  "SPADE": "&#9824;"
}

export type PokerCard = {
  suit: PokerSuit,
  value: PokerValue
}

export const PokerDeckUnshuffled: PokerCard[] = [
  {
    suit: PokerSuit.Club,
    value: PokerValue.Ace
  },
  {
    suit: PokerSuit.Club,
    value: PokerValue.Two
  },
  {
    suit: PokerSuit.Club,
    value: PokerValue.Three
  },
  {
    suit: PokerSuit.Club,
    value: PokerValue.Four
  },
  {
    suit: PokerSuit.Club,
    value: PokerValue.Five
  },
  {
    suit: PokerSuit.Club,
    value: PokerValue.Six
  },
  {
    suit: PokerSuit.Club,
    value: PokerValue.Seven
  },
  {
    suit: PokerSuit.Club,
    value: PokerValue.Eight
  },
  {
    suit: PokerSuit.Club,
    value: PokerValue.Nine
  },
  {
    suit: PokerSuit.Club,
    value: PokerValue.Ten
  },
  {
    suit: PokerSuit.Club,
    value: PokerValue.Jack
  },
  {
    suit: PokerSuit.Club,
    value: PokerValue.Queen
  },
  {
    suit: PokerSuit.Club,
    value: PokerValue.King
  },
  {
    suit: PokerSuit.Spade,
    value: PokerValue.Ace
  },
  {
    suit: PokerSuit.Spade,
    value: PokerValue.Two
  },
  {
    suit: PokerSuit.Spade,
    value: PokerValue.Three
  },
  {
    suit: PokerSuit.Spade,
    value: PokerValue.Four
  },
  {
    suit: PokerSuit.Spade,
    value: PokerValue.Five
  },
  {
    suit: PokerSuit.Spade,
    value: PokerValue.Six
  },
  {
    suit: PokerSuit.Spade,
    value: PokerValue.Seven
  },
  {
    suit: PokerSuit.Spade,
    value: PokerValue.Eight
  },
  {
    suit: PokerSuit.Spade,
    value: PokerValue.Nine
  },
  {
    suit: PokerSuit.Spade,
    value: PokerValue.Ten
  },
  {
    suit: PokerSuit.Spade,
    value: PokerValue.Jack
  },
  {
    suit: PokerSuit.Spade,
    value: PokerValue.Queen
  },
  {
    suit: PokerSuit.Spade,
    value: PokerValue.King
  },
  {
    suit: PokerSuit.Heart,
    value: PokerValue.Ace
  },
  {
    suit: PokerSuit.Heart,
    value: PokerValue.Two
  },
  {
    suit: PokerSuit.Heart,
    value: PokerValue.Three
  },
  {
    suit: PokerSuit.Heart,
    value: PokerValue.Four
  },
  {
    suit: PokerSuit.Heart,
    value: PokerValue.Five
  },
  {
    suit: PokerSuit.Heart,
    value: PokerValue.Six
  },
  {
    suit: PokerSuit.Heart,
    value: PokerValue.Seven
  },
  {
    suit: PokerSuit.Heart,
    value: PokerValue.Eight
  },
  {
    suit: PokerSuit.Heart,
    value: PokerValue.Nine
  },
  {
    suit: PokerSuit.Heart,
    value: PokerValue.Ten
  },
  {
    suit: PokerSuit.Heart,
    value: PokerValue.Jack
  },
  {
    suit: PokerSuit.Heart,
    value: PokerValue.Queen
  },
  {
    suit: PokerSuit.Heart,
    value: PokerValue.King
  },
  {
    suit: PokerSuit.Diamond,
    value: PokerValue.Ace
  },
  {
    suit: PokerSuit.Diamond,
    value: PokerValue.Two
  },
  {
    suit: PokerSuit.Diamond,
    value: PokerValue.Three
  },
  {
    suit: PokerSuit.Diamond,
    value: PokerValue.Four
  },
  {
    suit: PokerSuit.Diamond,
    value: PokerValue.Five
  },
  {
    suit: PokerSuit.Diamond,
    value: PokerValue.Six
  },
  {
    suit: PokerSuit.Diamond,
    value: PokerValue.Seven
  },
  {
    suit: PokerSuit.Diamond,
    value: PokerValue.Eight
  },
  {
    suit: PokerSuit.Diamond,
    value: PokerValue.Nine
  },
  {
    suit: PokerSuit.Diamond,
    value: PokerValue.Ten
  },
  {
    suit: PokerSuit.Diamond,
    value: PokerValue.Jack
  },
  {
    suit: PokerSuit.Diamond,
    value: PokerValue.Queen
  },
  {
    suit: PokerSuit.Diamond,
    value: PokerValue.King
  },
]


