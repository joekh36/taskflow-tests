import { test, expect } from "@playwright/test";
import {
  createTestUser,
  createTestProject,
  createTestTask,
} from "../../helpers/api-helpers";

const API = process.env.API_URL || "http://localhost:3000";

test.describe("Tasks API", () => {
  let token: string;
  let projectId: number;

  test.beforeEach(async ({ request }) => {
    const { token: t } = await createTestUser(request);
    token = t;
    const project = await createTestProject(request, token);
    projectId = project.id;
  });

  const authHeader = () => ({ Authorization: `Bearer ${token}` });

  test("POST /tasks — creates a task with default status todo", async ({
    request,
  }) => {
    const res = await request.post(`${API}/tasks`, {
      data: { title: "Write tests", projectId },
      headers: authHeader(),
    });

    expect(res.status()).toBe(201);
    const task = await res.json();
    expect(task.title).toBe("Write tests");
    expect(task.status).toBe("todo");
    expect(task.projectId).toBe(projectId);
  });

  test("GET /tasks?projectId= — filters by project", async ({ request }) => {
    const project2 = await createTestProject(request, token, "Project 2");

    await createTestTask(request, token, projectId, "Task in P1");
    await createTestTask(request, token, project2.id, "Task in P2");

    const res = await request.get(`${API}/tasks?projectId=${projectId}`, {
      headers: authHeader(),
    });
    const tasks = await res.json();
    expect(tasks[0].title).toBe("Task in P1");
  });

  test("DELETE /tasks/:id — removes the task", async ({ request }) => {
    const task = await createTestTask(request, token, projectId, "To delete");

    const delRes = await request.delete(`${API}/tasks/${task.id}`, {
      headers: authHeader(),
    });
    expect(delRes.status()).toBe(200);

    const getRes = await request.get(`${API}/tasks/${task.id}`, {
      headers: authHeader(),
    });
    expect(getRes.status()).toBe(404);
  });
});
