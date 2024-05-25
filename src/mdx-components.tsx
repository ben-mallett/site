import type { MDXComponents } from 'mdx/types'
import Image, { ImageProps } from 'next/image'
 
export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        h1: ({ children }) => (
            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">{children}</h1>
        ),
        h2: ({ children }) => (
            <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">{children}</h3>
        ),
        h4: ({ children }) => (
            <h3 className="scroll-m-20 text-xl font-semibold tracking-tight">{children}</h3>
        ),
        p: ({ children }) => (
            <p className="leading-7 text-xl xl:text-2xl [&:not(:first-child)]:mt-6">{children}</p>
        ),
        blockquote: ({ children }) => (
            <blockquote className="mt-6 border-l-2 pl-6 italic">{children}</blockquote>
        ),
        ul: ({ children }) => (
            <ul className="my-6 ml-6 list-disc [&>li]:mt-2 [&>li]:text-lg xl:[&>li]:text-xl">{children}</ul>
        ),

        code: ({ children }) => (
            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">{children}</code>
        ),
        small: ({ children }) => (
            <small className="text-sm font-medium leading-none">{children}</small>
        ),
        img: (props) => (
            <Image
                sizes="100vw"
                style={{ width: '100%', height: 'auto' }}
                {...(props as ImageProps)}
            />
        ),
        ...components,
    }
}