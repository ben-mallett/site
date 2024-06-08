import { Header } from '@/components/Header'
import { getPostById, getAllPosts } from '@/lib/api'
 
export async function generateStaticParams() {
  const posts = await getAllPosts()
 
  return posts.map((post: any) => ({
    id: post.id,
  }))
}
 
export async function generateMetadata({ params: { id } } : { params: { id: string } }) {
  const { title } = await getPostById(id)
  return {
    title,
  }
}

export default async function Post({ params: { id } } : { params: { id: string }}) {
    const { html, title, date } = await getPostById(id)
    return (
        <main>
            <Header/>
            <div className="flex justify-center items-center p-10 md:p-20">
                <article className="w-full md:w-[800px]">
                    <h1 className="pt-10">{title}</h1>
                    <h4 className="pb-10">{date}</h4>
                    <div className="text-justify" dangerouslySetInnerHTML={{ __html: html }} />
                </article>
            </div>
        </main>
    )
}
 