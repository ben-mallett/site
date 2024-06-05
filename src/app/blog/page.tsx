"use client"

import Link from "next/link";
import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios"
import { getRandomBgColor } from "@/lib/utils";

export default function BlogPage() {
    const { toast } = useToast();
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        const getPosts = async () => {
            try {
                const response = await axios.get("/api/posts");
                const postsResponse = response.data.blogposts;
                setPosts(postsResponse)
            } catch (error : any) {
                toast({
                    title: "Error fetching blog posts",
                    description: `${error.response.data.message ?? error}`
                })
            }
        }

        getPosts().catch((e) => {
            toast({
                title: "Uh oh...",
                description: 'Something went wrong getting the blog posts'
            })
        });
    }, [toast])

  return (
    <main>
        <div>
            <Header/>
            <div className="flex flex-col justify-center items-start">
                <h2 className="p-10 font-bold text-6xl border-none lg:pl-32 col-span-2 w-full">The Blog</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-x-10 gap-y-10 mx-auto py-10 px-2 lg:px-20 w-full h-full">
                    {
                        posts.map((post: any, i) => {
                            const bgColor = getRandomBgColor();
                            return (
                                <Link key={i} href={`blog/${post.slug}`}>
                                    <div className={`w-full h-96 border border-black border-4 hover-shadow-xl flex flex-col justify-start items-center ${bgColor}`}>
                                        <h3 className="p-5">{post.title}</h3>
                                        <h4 className="p-5 justify-self-end" style={{justifySelf: "end"}}>
                                            Authors: 
                                            {
                                                post.authors.map((author : string, j: number) => <span key={j}>{` ${author}`}</span>)
                                            }
                                        </h4>
                                        <h4 className="p-5">{post.description}</h4>
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
