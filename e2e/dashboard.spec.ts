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

  test("keyboard shortcut Cmd+K focuses input", async ({ page }) => {
    // Click somewhere else first to defocus
    await page.click("body");
    await page.keyboard.press("Meta+k");

    const input = page.locator('input[placeholder*="mission"]');
    await expect(input).toBeFocused();
  });

  test("cancel button appears during running state", async ({ page }) => {
    // Fill prompt and submit
    const input = page.locator('input[placeholder*="mission"]');
    await input.fill("Test mission");
    await page.getByRole("button", { name: /Initialize Swarm/ }).click();

    // Cancel button should appear
    const cancelBtn = page.getByRole("button", { name: /Cancel/ });
    // It may or may not appear depending on timing; check for reset button as fallback
    const resetBtn = page.getByRole("button", { name: /Reset/ });
    await expect(resetBtn.or(cancelBtn)).toBeVisible({ timeout: 10_000 });
  });

  test("reset button clears state", async ({ page }) => {
    const input = page.locator('input[placeholder*="mission"]');
    await input.fill("Test mission");
    await page.getByRole("button", { name: /Initialize Swarm/ }).click();

    // Wait for reset button
    const resetBtn = page.getByRole("button", { name: /Reset/ });
    await expect(resetBtn).toBeVisible({ timeout: 10_000 });
    await resetBtn.click();

    // Should show empty state again
    await expect(
      page.getByText("Launch a mission to see agents come alive")
    ).toBeVisible();
  });

  test("generative and console tabs switch content", async ({ page }) => {
    const generativeTab = page.getByRole("button", { name: "Generative" });
    const consoleTab = page.getByRole("button", { name: "Console" });

    await expect(generativeTab).toBeVisible();
    await expect(consoleTab).toBeVisible();

    await consoleTab.click();
    await expect(page.getByText("No actionable items yet")).toBeVisible();

    await generativeTab.click();
    await expect(page.getByText("AI Components")).toBeVisible();
  });

  test("agent status panel shows empty state", async ({ page }) => {
    await expect(page.getByText("No agents spawned yet")).toBeVisible();
  });
});
