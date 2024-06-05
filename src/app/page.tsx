"use client"

import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import { getRandomBgColor } from "@/lib/utils";

export default function Home() {
  const { toast } = useToast()
  const [posts, setPosts] = useState<any[]>([]);
  const [showcaseItems, setShowcaseItems] = useState<any[]>([]);

  useEffect(() => {
    const getPosts = async () => {
      try {
        const response = await axios.get("/api/posts");
        const postsResponse = response.data.blogposts;
        setPosts(postsResponse.slice(0, 3))
      } catch (error : any) {
        toast({
            title: "Error fetching blog posts",
            description: `${error.response.data.message ?? error}`
        })
      }
    }

    getPosts().catch((e) => {
        console.log(e)
    });
  }, [toast])

  useEffect(() => {
    const getShowcaseItems = async () => {
        try {
            const response = await axios.get("/api/showcase");
            const showcaseResponse = response.data.showcaseItems;
            setShowcaseItems(showcaseResponse.slice(0,3))
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
      <Header/>
      <div className="w-full h-full pt-10 flex flex-col justify-center items-center gap-6 px-10">
        <h1 className="text-6xl">Hey! My name is Ben</h1>
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
        <div className="flex flex-col lg:flex-row justify-start items-start gap-10">
          <div className="flex flex-col justify-start items-center pt-10">
            <h2>Recent Blogposts</h2>
            <div className="grid grid-cols-2 justify-center items-center gap-6 p-6">
              {
                posts.map((post, i) => {
                  const bgColor = getRandomBgColor()
                  return (
                    <Link key={i} href={`/blog/${post.slug}`}>
                      <div className={`w-[200px] h-[200px] border border-black border-2 hover-shadow-sm flex justify-center items-center ${bgColor} text-2xl`}>
                        {post.title}
                      </div>
                    </Link>
                  )
                })
              }
              <Link key={i} href='/blog'>
                <div className="w-[200px] h-[200px] bg-white border border-black border-2 flex justify-center items-center hover-shadow-sm text-2xl p-2">
                  &rarr;
                  <br/>
                  To the blog
                </div>
              </Link>
            </div>
          </div>
          <div className="flex flex-col justify-start items-center pt-10">
            <h2>Recent Projects</h2>
            <div className="grid grid-cols-2 justify-center items-center gap-6 p-6">
              {
                showcaseItems.map((showcase, i) => {
                  const bgColor = getRandomBgColor()
                  return (
                    <Link href={`/showcase/${showcase.slug}`}>
                      <div className={`w-[200px] h-[200px] border border-black border-2 hover-shadow-sm flex justify-center items-center ${bgColor} text-2xl`}>
                        {showcase.title}
                      </div>
                    </Link>
                  )
                })
              }
              <Link href='/blog'>
                <div className="w-[200px] h-[200px] bg-white border border-black border-2 flex justify-center items-center hover-shadow-sm text-2xl p-2">
                  &rarr;
                  <br/>
                  To the Showroom
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
