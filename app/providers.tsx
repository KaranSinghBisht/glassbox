"use client";

import { TamboProvider } from "@tambo-ai/react";
import { tamboComponents } from "@/components/tambo";
import { AuthProvider } from "@/components/AuthProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TamboProvider
        apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
        components={tamboComponents}
      >
        {children}
      </TamboProvider>
    </AuthProvider>
  );
}
