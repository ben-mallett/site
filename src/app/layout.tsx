import type { Metadata } from "next";
import { Archivo, Instrument_Serif, Jersey_25, JetBrains_Mono, Silkscreen } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster";
import { CellTransitions } from "@/components/theme/CellTransitions";
import { RandomLinksProvider } from "@/components/Header";
import { getRandomLinks } from "@/lib/api";
import "./globals.css";

const jersey = Jersey_25({weight: "400", subsets: ["latin"]});
// Theme fonts. Exposed as CSS variables only, so they apply where font-m-* is used.
const themeDisplay = Archivo({subsets: ["latin"], axes: ["wdth"], variable: "--font-m-display"});
const themeMono = JetBrains_Mono({subsets: ["latin"], variable: "--font-m-mono"});
const themeSerif = Instrument_Serif({weight: "400", style: ["normal", "italic"], subsets: ["latin"], variable: "--font-m-serif"});
const themePixel = Silkscreen({weight: "400", subsets: ["latin"], variable: "--font-m-pixel"});

// Runs before first paint so the saved accent applies and pending content never flashes.
// If the app has not hydrated after 5 seconds, motion turns off and hidden content shows.
const motionScript = `(function(){var h=document.documentElement;try{var a=localStorage.getItem("m-accent");if(a)h.dataset.mAccent=a}catch(e){}if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;h.classList.add("m-motion");setTimeout(function(){if(!h.dataset.mReady)h.classList.remove("m-motion")},5000)})()`;

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
    <html lang="en" suppressHydrationWarning>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/> 
      <head>
        <link rel="icon" type="image/x-icon" href="/images/icon.ico"/>
        <script dangerouslySetInnerHTML={{ __html: motionScript }} />
      </head> 
      <body className={`${jersey.className} ${themeDisplay.variable} ${themeMono.variable} ${themeSerif.variable} ${themePixel.variable}`}>
          <RandomLinksProvider links={getRandomLinks()}>{children}</RandomLinksProvider>
          <Toaster />
          <CellTransitions />
      </body>
    </html>
  );
}
