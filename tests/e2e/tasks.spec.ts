import { test, expect } from "@playwright/test";
import { createTestUser, createTestProject } from "../../helpers/api-helpers";
import { loginViaAPI } from "../../helpers/page-helpers";

test.describe("Tasks", () => {
  let projectId: number;

  test.beforeEach(async ({ page, request }) => {
    const { token, user } = await createTestUser(request);
    await loginViaAPI(page, token, user);

    // Create a project via API and navigate to it
    const project = await createTestProject(
      request,
      token,
      "Task Test Project",
    );
    projectId = project.id;
    await page.goto(`/projects/${projectId}`);
  });

  test("shows empty state with no tasks", async ({ page }) => {
    await expect(page.getByText("No tasks yet")).toBeVisible();
  });

  test("user can create a task", async ({ page }) => {
    await page.getByRole("button", { name: "+ Add task" }).click();
    await page.getByPlaceholder("Task title").fill("Write unit tests");
    await page.getByRole("button", { name: "Add" }).click();

    await expect(page.getByText("Write unit tests")).toBeVisible();
  });

  test("new task defaults to todo status", async ({ page }) => {
    await page.getByRole("button", { name: "+ Add task" }).click();
    await page.getByPlaceholder("Task title").fill("Brand new task");
    await page.getByRole("button", { name: "Add" }).click();

    const taskRow = page
      .locator("div")
      .filter({ hasText: "Brand new task" })
      .first();
    await expect(taskRow.getByRole("combobox")).toHaveValue("todo");
  });

  test("user can check checkbox to mark task done", async ({ page }) => {
    await page.getByRole("button", { name: "+ Add task" }).click();
    await page.getByPlaceholder("Task title").fill("Complete me");
    await page.getByRole("button", { name: "Add" }).click();

    await page.getByRole("checkbox").click();

    // Task title should be crossed out
    await expect(page.getByText("Complete me")).toHaveClass(/line-through/);
  });

  test("user can change status via dropdown", async ({ page }) => {
    await page.getByRole("button", { name: "+ Add task" }).click();
    await page.getByPlaceholder("Task title").fill("In progress task");
    await page.getByRole("button", { name: "Add" }).click();

    await page.getByRole("combobox").selectOption("in_progress");

    // Re-fetch to confirm it persisted
    await page.reload();
    await expect(page.getByRole("combobox")).toHaveValue("in_progress");
  });

  test("filter buttons show only matching tasks", async ({ page }) => {
    // Create tasks with different statuses via the UI
    const tasks = ["Task A", "Task B", "Task C"];
    for (const title of tasks) {
      await page.getByRole("button", { name: "+ Add task" }).click();
      await page.getByPlaceholder("Task title").fill(title);
      await page.getByRole("button", { name: "Add" }).click();
    }

    // Mark Task A as done
    const checkboxes = page.getByRole("checkbox");
    await checkboxes.first().click();

    // Filter by Done
    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.getByText("Task A")).toBeVisible();
    await expect(page.getByText("Task B")).not.toBeVisible();
  });

  test("user can delete a task", async ({ page }) => {
    await page.getByRole("button", { name: "+ Add task" }).click();
    await page.getByPlaceholder("Task title").fill("Delete this task");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Delete this task")).toBeVisible();

    // Click the × delete button
    await page.locator("button").filter({ hasText: "×" }).click();

    await expect(page.getByText("Delete this task")).not.toBeVisible();
  });

  test("back link returns to projects page", async ({ page }) => {
    await page.getByRole("link", { name: /all projects/i }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByText("My projects")).toBeVisible();
  });
});
