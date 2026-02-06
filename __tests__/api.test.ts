import { describe, it, expect } from "vitest";

describe("SSE Events API - runId requirement", () => {
  it("returns 400 when runId is missing", async () => {
    const mockRequest = new Request("http://localhost:3000/api/run/events");
    
    const { GET } = await import("../app/api/run/events/route");
    const response = await GET(mockRequest);
    
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("runId parameter is required");
  });

  it("accepts requests with runId parameter", async () => {
    const mockRequest = new Request("http://localhost:3000/api/run/events?runId=test-run-123");
    
    const { GET } = await import("../app/api/run/events/route");
    const response = await GET(mockRequest);
    
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
  });
});

describe("Approval Service - Transaction Order", () => {
  it("approveProposal has correct transaction order (update before insert)", async () => {
    const sourceCode = await import("fs").then(fs => 
      fs.readFileSync("./src/lib/approvalService.ts", "utf-8")
    );
    
    const approveFunction = sourceCode.match(/export async function approveProposal[\s\S]*?^}/m)?.[0] || "";
    
    const updateIndex = approveFunction.indexOf(".update(actionProposals)");
    const insertIndex = approveFunction.indexOf(".insert(approvals)");
    
    expect(updateIndex).toBeLessThan(insertIndex);
    expect(updateIndex).toBeGreaterThan(0);
    expect(insertIndex).toBeGreaterThan(0);
  });

  it("rejectProposal has correct transaction order (update before insert)", async () => {
    const sourceCode = await import("fs").then(fs => 
      fs.readFileSync("./src/lib/approvalService.ts", "utf-8")
    );
    
    const rejectMatch = sourceCode.match(/export async function rejectProposal[\s\S]*?eventBus\.emit/);
    const rejectFunction = rejectMatch?.[0] || "";
    
    const updateIndex = rejectFunction.indexOf(".update(actionProposals)");
    const insertIndex = rejectFunction.indexOf(".insert(approvals)");
    
    expect(updateIndex).toBeLessThan(insertIndex);
    expect(updateIndex).toBeGreaterThan(0);
    expect(insertIndex).toBeGreaterThan(0);
  });

  it("checks changes count before inserting approval", async () => {
    const sourceCode = await import("fs").then(fs => 
      fs.readFileSync("./src/lib/approvalService.ts", "utf-8")
    );
    
    expect(sourceCode).toContain("updateResult.changes === 0");
    expect(sourceCode).toContain("was already processed");
  });
});

describe("Proxy Auth", () => {
  it("proxy supports cookie-based auth", async () => {
    const sourceCode = await import("fs").then(fs => 
      fs.readFileSync("./proxy.ts", "utf-8")
    );
    
    expect(sourceCode).toContain("glassbox_token");
    expect(sourceCode).toContain("cookies.get");
  });

  it("proxy has auth check endpoint", async () => {
    const sourceCode = await import("fs").then(fs => 
      fs.readFileSync("./proxy.ts", "utf-8")
    );
    
    expect(sourceCode).toContain("/api/auth/check");
    expect(sourceCode).toContain("authRequired");
    expect(sourceCode).toContain("authenticated");
  });
});

describe("Auth Middleware Wiring", () => {
  it("uses proxy.ts (and does not include middleware.ts)", async () => {
    const fs = await import("fs");

    // Next.js 16 uses `proxy.ts` for auth/routing middleware. Having both breaks builds.
    expect(fs.existsSync("./proxy.ts")).toBe(true);
    expect(fs.existsSync("./middleware.ts")).toBe(false);
  });
});

describe("Event Deduplication", () => {
  it("SwarmEventBridge has seenEventIds for deduplication", async () => {
    const sourceCode = await import("fs").then(fs => 
      fs.readFileSync("./src/components/SwarmEventBridge.tsx", "utf-8")
    );
    
    expect(sourceCode).toContain("seenEventIdsRef");
    expect(sourceCode).toContain(".has(eventId)");
    expect(sourceCode).toContain(".add(eventId)");
  });

  it("clears seenEventIds when runId changes", async () => {
    const sourceCode = await import("fs").then(fs => 
      fs.readFileSync("./src/components/SwarmEventBridge.tsx", "utf-8")
    );
    
    expect(sourceCode).toContain("lastRunIdRef");
    expect(sourceCode).toContain("seenEventIdsRef.current.clear()");
  });
});
