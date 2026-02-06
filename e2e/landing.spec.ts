import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("hero renders with heading and start link", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Agent Swarm Mission Control" })
    ).toBeVisible();

    const startLink = page.getByRole("link", { name: "Start Simulation" });
    await expect(startLink).toBeVisible();
    await expect(startLink).toHaveAttribute("href", "/dashboard");
  });

  test("SVG preview shows animated agent graph", async ({ page }) => {
    const svg = page.locator("#how-it-works svg").first();
    await expect(svg).toBeVisible();

    const animatedCircles = page.locator("#how-it-works animateMotion");
    await expect(animatedCircles).toHaveCount(3);

    for (const label of ["Orchestrator", "Research", "Code", "Audit"]) {
      await expect(
        page.locator("#how-it-works").getByText(label, { exact: true })
      ).toBeVisible();
    }
  });

  test("status legend shows all states", async ({ page }) => {
    for (const label of ["Thinking", "Acting", "Done", "Waiting"]) {
      await expect(page.locator("#how-it-works").getByText(label)).toBeVisible();
    }
  });
});
