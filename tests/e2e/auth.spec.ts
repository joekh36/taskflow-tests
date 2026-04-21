import { test, expect } from "@playwright/test";
const API = process.env.API_URL || "http://localhost:3000";

// const unique = () => `e2e-${Date.now()}@playwright.com`;
const email = "test@email.com";
const password = "password123";

test.describe("Authentication", () => {
  test("user can register and land on projects page", async ({ page }) => {
    await page.goto("/register");

    await page.getByLabel("name").fill("Alice");
    await page.getByLabel("email").fill(email);
    await page.getByLabel("password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();

    // Should redirect to the projects page
    await expect(page).toHaveURL("/");
    await expect(page.getByText("My projects")).toBeVisible();
  });

  test("user can log in with valid credentials", async ({ page }) => {
    // const email = unique();

    // // Register first via API (faster than UI)
    // await page.request.post("http://localhost:3000/auth/login", {
    //   data: { email, name: "Bob", password: "password123!" },
    // });

    await page.goto("/login");
    await page.getByLabel("email").fill(email);
    await page.getByLabel("password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByText("My projects")).toBeVisible();
  });

  test("login shows error with wrong password", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("email").fill("nobody@example.com");
    await page.getByLabel("password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    await expect(page).toHaveURL("/login"); // stays on login
  });

  test("protected page redirects to login when not authenticated", async ({
    page,
  }) => {
    // Clear any existing auth
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());

    await page.goto("/");
    await expect(page).toHaveURL("/login");
  });

  test("user can log out", async ({ page, request }) => {
    // const email = unique();
    const { token, user } = await (async () => {
      const res = await request.post("http://localhost:3000/auth/register", {
        data: { email, name: "Carol", password: password },
      });
      return res.json();
    })();

    // Login via localStorage (faster)
    await page.goto("/login");
    await page.evaluate(
      ({ token, user }) => {
        localStorage.setItem("access_token", token);
        localStorage.setItem("user", JSON.stringify(user));
      },
      { token: token, user: user },
    );
    await page.goto("/");

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL("/login");
  });

  test.afterAll("cleanup user", async ({ page, request }) => {
    let res = await request.post(`${API}/auth/register`, {
      data: { email, password },
    });
    const body = await res.json();
    const token = body.access_token;

    await request.delete(`${API}/user/delete`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  });
});
