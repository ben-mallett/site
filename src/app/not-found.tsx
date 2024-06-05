"use client"

import { Header } from "@/components/Header";
import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <Header/>
      <div className="flex flex-col justify-start items-center h-full w-full gap-6 pt-20 p-4">
        <h1 className="pt-10">This is Awkward...</h1>
        <h4>Looks like I have taken you somewhere that does not exist yet. You should head on back where you came from.</h4>
        <Link href="/" className="hover-shadow-lg border border-black border-4 bg-red flex justify-center items-center px-10 bg-sky-300">
          <h4>Home</h4>
        </Link>
      </div>
    </main>
  );
}