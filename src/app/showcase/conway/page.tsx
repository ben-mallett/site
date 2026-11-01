"use client"

import { WindowConway } from "@/components/Conway";
import { Theme } from "@/components/theme";

export default function ConwayPage() {
  return (
    <Theme tone="dark">
      <main>
        <WindowConway settings={true}/>
      </main>
    </Theme>
  );
}
