import type { Metadata } from "next";
import { Jersey_25 } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const jersey = Jersey_25({weight: "400", subsets: ["latin"]});

export const metadata: Metadata = {
  title: "Ben's Ramblings",
  description: "Repository of my thoughts and learnings, as well as a bit of my code :)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/> 
      <head>
        <link rel="icon" type="image/x-icon" href="/images/icon.ico"/>
      </head> 
      <body className={`${jersey.className}`}>
          {children}
          <Toaster />
      </body>
    </html>
  );
}
