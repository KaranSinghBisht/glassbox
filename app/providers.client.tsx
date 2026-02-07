"use client";

import { TamboProvider } from "@tambo-ai/react";
import { tamboComponents } from "@/components/tambo";
import { tamboTools } from "@/lib/tamboTools";
import { AuthProvider } from "@/components/AuthProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
      <ErrorBoundary fallbackTitle="Tambo streaming error — try refreshing">
        <TamboProvider
          apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
          components={tamboComponents}
          tools={tamboTools}
          contextHelpers={{
            currentTime: () => ({ time: new Date().toISOString() }),
            appContext: () => ({
              app: "GlassBox",
              description: "Multi-agent orchestration platform with human-in-the-loop approval",
              capabilities: [
                "Agent swarm visualization",
                "Human approval workflows",
                "Artifact generation",
                "Run progress tracking",
                "LLM metrics monitoring",
              ],
            }),
          }}
        >
          {children}
        </TamboProvider>
      </ErrorBoundary>
    </AuthProvider>
  );
}
