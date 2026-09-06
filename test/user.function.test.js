const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const request = require("supertest");
const prisma = require("../db/prisma");

let agent;
let saveRes;
const { app, server } = require("../app");

beforeAll(async () => {
  // clear database
  await prisma.task.deleteMany(); // delete all tasks
  await prisma.user.deleteMany(); // delete all users
  agent = request.agent(app);
});

afterAll(async () => {
  await prisma.$disconnect();
  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

describe("register a user ", () => {
  let saveRes = null; // we'll declare this out here, so that we can reference it in several tests
  let csrfToken = null;
  it("46. it creates the user entry", async () => {
    const newUser = {
      name: "John Deere",
      email: "jdeere@example.com",
      password: "Pa$$word20",
    };
    saveRes = await agent.post("/api/users/register").send(newUser);
    expect(saveRes.status).toBe(201);
  });

  it("47. Registration returns an object with the expected name", () => {
    const actualName = saveRes.body.name || saveRes.body.user?.name;
    expect(actualName).toBe("John Deere");
  });

  it("48. Test that the returned object includes a csrfToken", () => {
    expect(saveRes.body.csrfToken).toBeDefined();
  });

  it("49. You can logon as the newly registered user", async () => {
    const user = {
      email: "jdeere@example.com",
      password: "Pa$$word20",
    };
    saveRes = await agent.post("/api/users/logon").send(user);
    csrfToken = saveRes.body.csrfToken;
    expect(saveRes.status).toBe(200);
  });

  it("50. Verify that you are logged in: /api/tasks should not return a 401", async () => {
    saveRes = await agent.get("/api/tasks");
    expect(saveRes.status).not.toBe(401);
  });

  it("51. Verify that you can log out", async () => {
    saveRes = await agent
      .post("/api/users/logoff")
      .set("x-csrf-token", csrfToken);
    expect(saveRes.headers["set-cookie"]).toBeDefined();
  });

  it("52. Make sure that you are really logged out: /api/tasks should now return a 401", async () => {
    saveRes = await agent.get("/api/tasks");
    expect(saveRes.status).toBe(401);
  });
});
