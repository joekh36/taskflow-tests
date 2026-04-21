import { APIRequestContext } from "@playwright/test";

const API_URL = process.env.API_URL || "http://localhost:3000";

// Register a fresh user and return their token
export async function createTestUser(
  request: APIRequestContext,
  overrides: Partial<{ email: string; name: string; password: string }> = {},
) {
  const user = {
    email: overrides.email ?? `test-${Date.now()}@playwright.com`,
    name: overrides.name ?? "Test User",
    password: overrides.password ?? "Password123!",
  };

  const res = await request.post(`${API_URL}/auth/register`, { data: user });
  const body = await res.json();

  return {
    user: body.user,
    token: body.access_token,
    credentials: { email: user.email, password: user.password },
  };
}

// Login and return token
export async function loginTestUser(
  request: APIRequestContext,
  email: string,
  password: string,
) {
  const res = await request.post(`${API_URL}/auth/login`, {
    data: { email, password },
  });
  const body = await res.json();
  return body.access_token as string;
}

// Create a project and return it
export async function createTestProject(
  request: APIRequestContext,
  token: string,
  name = "Test Project",
) {
  const res = await request.post(`${API_URL}/projects`, {
    data: { name, description: "Created by Playwright" },
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// Create a task and return it
export async function createTestTask(
  request: APIRequestContext,
  token: string,
  projectId: number,
  title = "Test Task",
) {
  const res = await request.post(`${API_URL}/tasks`, {
    data: { title, projectId, status: "todo" },
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
