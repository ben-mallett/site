"use client"

import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import Link from "next/link";
import "axios";
import { useToast } from "@/components/ui/use-toast";

export default function Home() {
  const { toast } = useToast()
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const getGames = async () => {
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

    getGames().catch((e) => {
        console.log(e)
    });
  }, [])

  return (
    <main>
      <Header/>
      <div className="w-full h-full pt-20 flex flex-col justify-center items-center gap-6 px-10">
        <h1 className="text-6xl">Hey! I'm Ben</h1>
        <div className="w-4/5/3 text-4xl text-center">
          I read things. I write things. I build things. You can read about some of those things here.
        </div>
        <div className="text-center w-full xl:w-2/3 text-2xl flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 md:gap-12">
          <div>Software Engineer</div>
          <div>Computer Scientist</div>
          <div>Lifelong Learner</div>
        </div>
        <div className="w-1/2 flex gap-6 justify-center items-center">
          <Link className="hover-shadow-lg" href="/resume.pdf">
            <span className="text-2xl font-semibold w-1/4 border border-black border-2 px-2 py-1 bg-blue-300">resume</span>
          </Link>
          <Link className="hover-shadow-lg" href="/contact">
            <span className="text-2xl font-semibold w-1/4 border border-black border-2 px-2 py-1 bg-green-300">contact</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
