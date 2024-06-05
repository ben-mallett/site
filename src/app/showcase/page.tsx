"use client"

import Link from "next/link";
import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios"
import { getRandomBgColor } from "@/lib/utils";

export default function ShowcasePage() {
    const { toast } = useToast();
    const [showcaseItems, setShowcaseItems] = useState([]);

    useEffect(() => {
        const getShowcaseItems = async () => {
            try {
                const response = await axios.get("/api/showcase");
                const showcaseResponse = response.data.showcaseItems;
                setShowcaseItems(showcaseResponse)
            } catch (error : any) {
                toast({
                    title: "Error fetching showcase items",
                    description: `${error.response.data.message ?? error}`
                })
            }
        }

        getShowcaseItems().catch((e) => {
            console.log(e)
        });
    }, [toast])

  return (
    <main>
        <div>
            <Header/>
            <div className="flex flex-col justify-center items-start">
                <h2 className="p-10 font-bold text-6xl border-none lg:pl-32 col-span-2 w-full">The Showroom</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-10 mx-auto py-10 px-2 lg:px-20 w-full h-full">
                    {
                        showcaseItems.map((showcase: any, i) => {
                            const bgColor = getRandomBgColor();
                            return (
                                <Link key={i} href={showcase.slug ? `/showcase/${showcase.slug}` : '/showcase'}>
                                    <div className={`w-full h-72 border border-black border-4 hover-shadow-xl flex flex-col justify-start items-center ${bgColor}`}>
                                        <h3 className="pt-10">{showcase.title}</h3>
                                        <h4 className="p-5">{showcase.description}</h4>
                                    </div>
                                </Link>
                            )
                        })
                    }
                    <div className="flex justify-start items-start">
                        <h3 className="pt-10">And many more to come...</h3>
                    </div>
                </div>
            </div>
        </div>
    </main>
  );
}