import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    // Wait for hydration — the prompt input is client-rendered
    await page.waitForSelector('input[placeholder*="mission"]', { timeout: 60_000 });
  });

  test("shows 4 sample mission cards", async ({ page }) => {
    await expect(page.getByText("Quick Start")).toBeVisible();

    const cards = [
      { emoji: "📝", title: "Blog Post" },
      { emoji: "🚀", title: "Product Launch" },
      { emoji: "🔌", title: "API Design" },
      { emoji: "🔒", title: "Security Audit" },
    ];

    for (const card of cards) {
      await expect(page.getByText(card.emoji)).toBeVisible();
      await expect(page.getByText(card.title, { exact: true })).toBeVisible();
    }
  });

  test("clicking a sample card fills the prompt input", async ({ page }) => {
    await page.getByRole("button", { name: /Blog Post/ }).click();

    const input = page.locator('input[placeholder*="mission"]');
    await expect(input).toHaveValue(/technical blog post/i);
  });

  test("empty state overlay is visible", async ({ page }) => {
    await expect(
      page.getByText("Launch a mission to see agents come alive")
    ).toBeVisible();
  });

  test("SwarmGraph container renders", async ({ page }) => {
    const graph = page.locator('[data-testid="swarm-graph"]');
    await expect(graph).toBeVisible();

    const reactFlow = graph.locator(".react-flow");
    await expect(reactFlow).toBeVisible();
  });

  test("TamboThread shows empty state", async ({ page }) => {
    await expect(page.getByText("AI Components")).toBeVisible();
    await expect(
      page.getByText("Tambo will render components here")
    ).toBeVisible();
  });
});
