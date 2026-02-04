"use client";

import { TamboProvider } from "@tambo-ai/react";
import { tamboComponents } from "@/components/tambo";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={tamboComponents}
    >
      {children}
    </TamboProvider>
  );
}
