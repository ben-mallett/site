import { Header } from "@/components/Header";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { getRandomBgColor } from "@/lib/utils";
import { getAllPosts, getAllShowcaseItems } from "@/lib/api";

export default async function Home() {
  const postsFull = await getAllPosts()
  const postsPreview = postsFull.slice(0, 3)
  const showcaseItemsFull = await getAllShowcaseItems()
  const showcasePreview = showcaseItemsFull.slice(0, 3)

  return (
    <main>
      <Header/>
      <div className="w-full h-full pt-10 flex flex-col justify-center items-center gap-6 px-10">
        <h1 className="text-6xl text-center">Hey! I&#39;m Ben</h1>
        <div className="w-4/5/3 text-4xl text-center">
          Experienced professional with a passion for building things. 
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
            <div className="grid grid-cols-1 sm:grid-cols-2 justify-center items-center gap-6 p-6">
              {
                postsPreview.map((post, i) => {
                  const bgColor = getRandomBgColor()
                  return (
                    <Link key={i} href={`/blog/${post.id}`}>
                      <div className={`w-[200px] h-[200px] border border-black border-2 hover-shadow-sm flex justify-center items-center ${bgColor} text-2xl`}>
                        {post.title}
                      </div>
                    </Link>
                  )
                })
              }
              <Link href='/blog'>
                <div className="w-[200px] h-[200px] bg-white border border-black border-2 flex justify-center items-center hover-shadow-sm text-2xl p-2">
                  &rarr;
                  <br/>
                  To the Blog
                </div>
              </Link>
            </div>
          </div>
          <div className="flex flex-col justify-start items-center pt-10">
            <h2>Recent Projects</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 justify-center items-center gap-6 p-6">
              {
                showcasePreview.map((showcase, i) => {
                  const bgColor = getRandomBgColor()
                  return (
                    <Link key={i} href={`/showcase/${showcase.slug}`}>
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
