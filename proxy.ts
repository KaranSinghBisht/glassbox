import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/api/auth/login", "/api/auth/logout", "/api/auth/check"];

const AUTH_CHECK_PATH = "/api/auth/check";
const AUTH_COOKIE_NAME = "glassbox_token";

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function getToken(request: NextRequest): string | undefined {
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    return authHeader.replace(/^Bearer\s+/i, "");
  }
  return request.cookies.get(AUTH_COOKIE_NAME)?.value;
}

export function proxy(request: NextRequest) {
  const adminToken = process.env.GLASSBOX_ADMIN_TOKEN;
  const { pathname } = request.nextUrl;

  if (pathname === AUTH_CHECK_PATH) {
    return NextResponse.json({
      authRequired: !!adminToken,
      authenticated: adminToken ? getToken(request) === adminToken : true,
    });
  }

  if (!adminToken) {
    return NextResponse.next();
  }

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const token = getToken(request);

  if (token !== adminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};

