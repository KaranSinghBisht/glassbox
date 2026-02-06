import type { ReactNode } from "react";
import { cookies } from "next/headers";

import { ClientProviders } from "./providers.client";

const AUTH_COOKIE_NAME = "glassbox_token";

export async function Providers({ children }: { children: ReactNode }) {
  const adminToken = process.env.GLASSBOX_ADMIN_TOKEN;
  const authRequired = Boolean(adminToken);

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const authenticated = !adminToken || cookieToken === adminToken;

  return (
    <ClientProviders
      initialAuthRequired={authRequired}
      initialAuthenticated={authenticated}
    >
      {children}
    </ClientProviders>
  );
}
