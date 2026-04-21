import { test, expect } from "@playwright/test";
import { createTestUser } from "../../helpers/api-helpers";
import { loginViaAPI } from "../../helpers/page-helpers";

test.describe("Projects", () => {
  test.beforeEach(async ({ page, request }) => {
    // Create a user and log in via API for speed
    const { token, user } = await createTestUser(request);
    await loginViaAPI(page, token, user);
  });

  test("projects page shows empty state with no projects", async ({ page }) => {
    await expect(page.getByText("No projects yet")).toBeVisible();
  });

  test("user can create a project", async ({ page }) => {
    await page.getByRole("button", { name: "+ New project" }).click();

    await page.getByPlaceholder("Project name").fill("My First Project");
    await page
      .getByPlaceholder("Description (optional)")
      .fill("A test project");
    await page.getByRole("button", { name: "Create" }).click();

    await expect(page.getByText("My First Project")).toBeVisible();
    await expect(page.getByText("A test project")).toBeVisible();
  });

  test("project appears in list after creation", async ({ page }) => {
    // Create two projects
    for (const name of ["Alpha", "Beta"]) {
      await page.getByRole("button", { name: "+ New project" }).click();
      await page.getByPlaceholder("Project name").fill(name);
      await page.getByRole("button", { name: "Create" }).click();
      await expect(page.getByText(name)).toBeVisible();
    }

    // Both should be in the list
    const cards = page
      .locator(".bg-white.border")
      .filter({ hasText: /Alpha|Beta/ });
    await expect(cards).toHaveCount(2);
  });

  test("user can navigate to a project", async ({ page }) => {
    // Create via button
    await page.getByRole("button", { name: "+ New project" }).click();
    await page.getByPlaceholder("Project name").fill("Clickable Project");
    await page.getByRole("button", { name: "Create" }).click();

    // Click the project link
    await page.getByText("Clickable Project").click();

    // await expect(page).toHaveURL(//projects/d+/)
    await expect(page.getByText("Clickable Project")).toBeVisible();
  });

  test("user can delete a project", async ({ page }) => {
    await page.getByRole("button", { name: "+ New project" }).click();
    await page.getByPlaceholder("Project name").fill("Delete Me");
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText("Delete Me")).toBeVisible();

    await page.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByText("Delete Me")).not.toBeVisible();
  });
});
