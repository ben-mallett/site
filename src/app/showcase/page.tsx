import Link from "next/link";
import { Header } from "@/components/Header";
import { getRandomBgColor } from "@/lib/utils";
import { getAllShowcaseItems } from "@/lib/api";

export default async function ShowcasePage() {
    const showcaseItems = await getAllShowcaseItems()

    return (
        <main>
            <div>
                <Header/>
                <div className="flex flex-col justify-center items-start">
                    <h2 className="p-10 font-bold text-6xl border-none lg:pl-32 col-span-2 w-full">The Showroom</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-10 mx-auto py-5 md:py-10 px-2 lg:px-20 w-full h-full">
                        {
                            showcaseItems.map((showcase: any, i) => {
                                const bgColor = getRandomBgColor();
                                return (
                                    <Link key={i} href={showcase.slug ? `/showcase/${showcase.slug}` : '/showcase'}>
                                        <div className={`w-full h-72 border border-black border-2 hover-shadow-xl flex flex-col justify-start items-center text-justify ${bgColor}`}>
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