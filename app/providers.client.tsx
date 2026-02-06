"use client";

import { TamboProvider } from "@tambo-ai/react";
import { tamboComponents } from "@/components/tambo";
import { AuthProvider } from "@/components/AuthProvider";

export function ClientProviders({
  children,
  initialAuthRequired,
  initialAuthenticated,
}: {
  children: React.ReactNode;
  initialAuthRequired: boolean;
  initialAuthenticated: boolean;
}) {
  return (
    <AuthProvider
      initialAuthRequired={initialAuthRequired}
      initialAuthenticated={initialAuthenticated}
    >
      <TamboProvider
        apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
        components={tamboComponents}
      >
        {children}
      </TamboProvider>
    </AuthProvider>
  );
}

