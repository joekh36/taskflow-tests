import { Page } from "@playwright/test";

// Log in via the UI and wait for the projects page
export async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/");
}

// Log in via the API (faster — skips browser interaction)
// Sets localStorage directly so the app thinks we are logged in
export async function loginViaAPI(
  page: Page,
  token: string,
  user: { id: number; email: string; name: string },
) {
  await page.goto("/login"); // must load the page first to set localStorage
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem("access_token", token);
      localStorage.setItem("user", JSON.stringify(user));
    },
    { token, user },
  );
  await page.goto("/"); // now navigate as logged-in user
}
