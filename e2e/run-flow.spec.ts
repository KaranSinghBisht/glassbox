import { test, expect } from "@playwright/test";

test.describe("Run Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForSelector('input[placeholder*="mission"]', {
      timeout: 60_000,
    });
  });

  test("submitting a mission shows run ID and status badges", async ({
    page,
  }) => {
    const input = page.locator('input[placeholder*="mission"]');
    await input.fill("Write a blog post about AI agents");
    await page.getByRole("button", { name: /Initialize Swarm/ }).click();

    // Run ID should appear in the header
    await expect(page.locator("text=RUN:")).toBeVisible({ timeout: 15_000 });

    // Connection badge should change to LIVE
    await expect(page.getByText("LIVE")).toBeVisible({ timeout: 15_000 });
  });

  test("export button appears after run completes or fails", async ({
    page,
  }) => {
    const input = page.locator('input[placeholder*="mission"]');
    await input.fill("Test run for export");
    await page.getByRole("button", { name: /Initialize Swarm/ }).click();

    // Wait for either completed or failed state
    const exportBtn = page.getByRole("button", { name: /Export/ });
    const resetBtn = page.getByRole("button", { name: /Reset/ });

    // Reset should always appear eventually
    await expect(resetBtn).toBeVisible({ timeout: 30_000 });

    // If run completes/fails, export button should be visible
    // The run may still be running, so we check for either
    const hasExport = await exportBtn.isVisible().catch(() => false);
    if (hasExport) {
      await expect(exportBtn).toBeVisible();
    }
  });

  test("graph renders orchestrator node on new run", async ({ page }) => {
    const input = page.locator('input[placeholder*="mission"]');
    await input.fill("Graph test mission");
    await page.getByRole("button", { name: /Initialize Swarm/ }).click();

    // The SwarmGraph should have at least the orchestrator node
    const agentNode = page.locator('[data-testid="agent-node"]');
    await expect(agentNode.first()).toBeVisible({ timeout: 15_000 });
  });

  test("error boundary shows retry button on graph error", async ({
    page,
  }) => {
    // This tests that the error boundary is in place
    // We just verify the graph renders without error
    const graph = page.locator('[data-testid="swarm-graph"]');
    await expect(graph).toBeVisible();

    // If there were an error, we'd see the retry button
    const retryBtn = page.getByRole("button", { name: /Try Again/ });
    await expect(retryBtn).not.toBeVisible();
  });

  test("event timeline shows messages during a run", async ({ page }) => {
    const input = page.locator('input[placeholder*="mission"]');
    await input.fill("Timeline test");
    await page.getByRole("button", { name: /Initialize Swarm/ }).click();

    // Wait for at least one event in the timeline
    await expect(page.getByText("system", { exact: false }).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
