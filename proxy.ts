import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = [
  { path: "/api/run", methods: ["POST"] },
  { path: "/api/proposals/", methods: ["POST"] },
  { path: "/api/metrics", methods: ["DELETE"] },
];

const AUTH_CHECK_PATH = "/api/auth/check";
const AUTH_COOKIE_NAME = "glassbox_token";

function isProtectedRoute(pathname: string, method: string): boolean {
  return PROTECTED_PATHS.some(
    (route) =>
      pathname.startsWith(route.path) &&
      route.methods.includes(method.toUpperCase())
  );
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

  const method = request.method;

  if (!isProtectedRoute(pathname, method)) {
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

