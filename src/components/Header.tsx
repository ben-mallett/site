"use client"

import { MenuIcon } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { getRandomLink } from "@/lib/utils"

export const Header = () => {
    const [menuOpen, setMenuOpen] = useState<boolean>(false)
    const random = getRandomLink();
    return (
        <div className="flex justify-between items-center w-full top-0 p-4 gap-2 relative">
            <div className="w-full flex justify-start items-center">
                <Link href="/" className="border border-black border-4 px-1 opacity-90 bg-yellow-300 hover-shadow-lg ">
                    <h1>benjamin | nimajneb</h1>
                </Link>
            </div>
            <button className={`hover-shadow-lg block md:hidden border border-black border-4`} onClick={() => setMenuOpen(true)}>
                <MenuIcon size="35" strokeWidth={3} className="bg-sky-400"/>
            </button>
            <div className={`${menuOpen ? 'block' : 'hidden'}`}>
                <div className='flex flex-col justify-stretch items-center bg-white absolute top-0 left-0 z-10 bg-white w-full h-screen'>
                    <button className="hover-enlarge-lg border-y-2 border-black border-2 w-full bg-purple-700" onClick={() => setMenuOpen(false) }>
                        <span className="hover-enlarge-lg w-full h-full flex justify-center items-center">X</span>
                    </button>
                    <Link className="w-screen h-1/4 text-2xl font-semibold w-full border border-black border-2 px-1 bg-blue-500" href="/blog" onClick={() => setMenuOpen(false)} >
                        <span className="hover-enlarge-lg w-full h-full flex justify-center items-center">blog</span>
                    </Link>
                    <Link className="w-screen h-1/4 text-2xl font-semibold w-full border border-black border-2 px-1 bg-purple-500" href="/showcase" onClick={() => setMenuOpen(false)} >
                        <span className="hover-enlarge-lg w-full h-full flex justify-center items-center">showcase</span>
                    </Link>
                    <Link className="w-screen h-1/4 text-2xl font-semibold w-full border border-black border-2 px-1 bg-pink-400" href={random} onClick={() => setMenuOpen(false)} >
                        <span className="hover-enlarge-lg w-full h-full flex justify-center items-center">random</span>
                    </Link>
                    <Link className="w-screen h-1/4 text-2xl font-semibold w-full border border-black border-2 px-1 bg-orange-400" href="/contact" onClick={() => setMenuOpen(false)} >
                        <span className="hover-enlarge-lg w-full h-full flex justify-center items-center">contact</span>
                    </Link>
                </div>
            </div>
            <div className="hidden md:block">
                <div className="flex justify-end items-center gap-6 w-full">
                    <Link className="hover-shadow-lg" href="/blog">
                        <span className="text-2xl font-semibold w-1/4 border border-black border-2 p-1 bg-blue-500">blog</span>
                    </Link>
                    <Link className="hover-shadow-lg" href="/showcase">
                        <span className="text-2xl font-semibold w-1/4 border border-black border-2 p-1 bg-purple-500">showcase</span>
                    </Link>
                    <Link className="hover-shadow-lg" href={random}>
                        <span className="text-2xl font-semibold w-1/4 border border-black border-2 p-1 bg-pink-400">random</span>
                    </Link>
                    <Link className="hover-shadow-lg" href="/contact">
                        <span className="text-2xl font-semibold w-1/4 border border-black border-2 p-1 bg-orange-400">contact</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}