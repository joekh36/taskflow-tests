import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false, // run tests sequentially (important for shared DB state)
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // one worker keeps test order predictable
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["list"], // shows each test as it runs in the terminal
  ],

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:80",
    trace: "on-first-retry", // captures a trace when a test fails and retries
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testMatch: "**/e2e/**/*.spec.ts", // only E2E tests
    },
    {
      name: "api",
      use: {},
      testMatch: "**/api/**/*.spec.ts", // only API tests
    },
  ],
});
