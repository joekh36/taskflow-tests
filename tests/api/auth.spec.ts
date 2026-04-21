import { test, expect } from "@playwright/test";

const API = process.env.API_URL || "http://localhost:3000";
const unique = () => `test-${Date.now()}@playwright.com`;

test.describe("Auth API", () => {
  test("POST /auth/register — creates a user and returns a token", async ({
    request,
  }) => {
    const email = unique();
    const res = await request.post(`${API}/auth/register`, {
      data: { email, name: "Alice", password: "Password123!" },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty("access_token");
    expect(body.user.email).toBe(email);
    expect(body.user).not.toHaveProperty("password"); // never exposed
  });

  test("POST /auth/register — rejects duplicate email", async ({ request }) => {
    const email = unique();

    // Register once
    await request.post(`${API}/auth/register`, {
      data: { email, name: "Alice", password: "Password123!" },
    });

    // Try again with same email
    const res = await request.post(`${API}/auth/register`, {
      data: { email, name: "Bob", password: "Password123!" },
    });

    expect(res.status()).toBe(409); // ConflictException
  });

  test("POST /auth/register — rejects short password", async ({ request }) => {
    const res = await request.post(`${API}/auth/register`, {
      data: { email: unique(), name: "Alice", password: "123" },
    });
    expect(res.status()).toBe(400); // ValidationPipe
  });

  test("POST /auth/login — returns token with correct credentials", async ({
    request,
  }) => {
    const email = unique();
    await request.post(`${API}/auth/register`, {
      data: { email, name: "Alice", password: "Password123!" },
    });

    const res = await request.post(`${API}/auth/login`, {
      data: { email, password: "Password123!" },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty("access_token");
  });

  test("POST /auth/login — rejects wrong password", async ({ request }) => {
    const email = unique();
    await request.post(`${API}/auth/register`, {
      data: { email, name: "Alice", password: "Password123!" },
    });

    const res = await request.post(`${API}/auth/login`, {
      data: { email, password: "WrongPassword!" },
    });

    expect(res.status()).toBe(401); // UnauthorizedException
  });

  test("GET /projects — returns 401 without token", async ({ request }) => {
    const res = await request.get(`${API}/projects`);
    expect(res.status()).toBe(401);
  });
});
