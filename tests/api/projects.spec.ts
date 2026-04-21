import { test, expect } from "@playwright/test";
import { createTestUser, createTestProject } from "../../helpers/api-helpers";

const API = process.env.API_URL || "http://localhost:3000";

test.describe("Projects API", () => {
  let token: string;
  let userId: number;

  test.beforeEach(async ({ request }) => {
    // Create a fresh user for each test
    const { token: t, user } = await createTestUser(request);
    token = t;
    userId = user.id;
  });

  const authHeader = () => ({ Authorization: `Bearer ${token}` });

  test("POST /projects — creates a project", async ({ request }) => {
    const res = await request.post(`${API}/projects`, {
      data: { name: "My Project", description: "A test project" },
      headers: authHeader(),
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.name).toBe("My Project");
    expect(body.ownerId).toBe(userId);
  });

  test("GET /projects — returns only the owners projects", async ({
    request,
  }) => {
    // Create 2 projects
    await createTestProject(request, token, "Project A");
    await createTestProject(request, token, "Project B");

    // Create another user with their own project
    const { token: otherToken } = await createTestUser(request);
    await createTestProject(request, otherToken, "Other Project");

    // First user should only see their own 2
    const res = await request.get(`${API}/projects`, { headers: authHeader() });
    expect(res.status()).toBe(200);
    const projects = await res.json();
    expect(projects).toHaveLength(2);
    expect(projects.every((p: any) => p.ownerId === userId)).toBe(true);
  });

  //   test("PATCH /projects/:id — updates name", async ({ request }) => {
  //     const project = await createTestProject(request, token, "Old Name");

  //     const res = await request.patch(`${API}/projects/${project.id}`, {
  //       data: { name: "New Name" },
  //       headers: authHeader(),
  //     });

  //     expect(res.status()).toBe(200);
  //     const body = await res.json();
  //     expect(body.name).toBe("New Name");
  //   });

  test("DELETE /projects/:id — returns 403 for non-owner", async ({
    request,
  }) => {
    const project = await createTestProject(request, token, "Owned Project");

    // Another user tries to delete it
    const { token: otherToken } = await createTestUser(request);
    const res = await request.delete(`${API}/projects/${project.id}`, {
      headers: { Authorization: `Bearer ${otherToken}` },
    });

    expect(res.status()).toBe(403); // ForbiddenException
  });

  test("DELETE /projects/:id — cascades and deletes tasks", async ({
    request,
  }) => {
    const project = await createTestProject(request, token, "Project");

    // Create a task in this project
    await request.post(`${API}/tasks`, {
      data: { title: "Task", projectId: project.id, status: "todo" },
      headers: authHeader(),
    });

    // Delete the project
    const delRes = await request.delete(`${API}/projects/${project.id}`, {
      headers: authHeader(),
    });
    expect(delRes.status()).toBe(200);

    // Tasks for this project should now be gone
    const tasksRes = await request.get(`${API}/tasks?projectId=${project.id}`, {
      headers: authHeader(),
    });
    const tasks = await tasksRes.json();
    expect(tasks).toHaveLength(0);
  });
});
