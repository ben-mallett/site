import Link from "next/link";
import { Header } from "@/components/Header";
import { getRandomBgColor } from "@/lib/utils";
import { getAllPosts } from "@/lib/api";

export default async function BlogPage() {
    const posts = await getAllPosts()

    return (
        <main>
            <div>
                <Header/>
                <div className="flex flex-col justify-center items-start">
                    <h2 className="p-10 font-bold text-6xl border-none lg:pl-32 col-span-2 w-full">The Blog</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-x-10 gap-y-10 mx-auto py-10 px-2 lg:px-20 w-full h-full">
                        {
                            posts.map((post: any, i) => {
                                const bgColor = getRandomBgColor();
                                const { id, description, title, authors } = post
                                return (
                                    <Link key={i} href={`blog/${id}`}>
                                        <div className={`w-full h-96 border border-black border-2 hover-shadow-xl flex flex-col justify-start items-center ${bgColor}`}>
                                            <h3 className="p-5">{title}</h3>
                                            <h4 className="p-5 justify-self-end" style={{justifySelf: "end"}}>
                                                Authors: 
                                                {
                                                    authors.map((author : string, j: number) => <span key={j}>{` ${author}`}</span>)
                                                }
                                            </h4>
                                            <h4 className="p-5 text-justify">{description}</h4>
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
