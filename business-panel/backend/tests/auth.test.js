/**
 * tests/auth.test.js — Auth flow tests
 */
import { jest } from "@jest/globals";
import request from "supertest";
import { buildApp, connectTestDB, disconnectTestDB, createTestUser } from "./helpers.js";

// Mock email sending so tests don't need real SMTP
jest.mock("../utils/emailService.js", () => ({
    sendEmail:           jest.fn().mockResolvedValue({ success: true }),
    sendEmailBackground: jest.fn(),
}));

jest.mock("../config/redis.js", () => ({
    connectRedis: jest.fn(),
    getRedis:     jest.fn().mockReturnValue(null),
    isRedisUp:    jest.fn().mockReturnValue(false),
}));

let app;

beforeAll(async () => {
    await connectTestDB();
    app = buildApp();
});

afterAll(async () => {
    await disconnectTestDB();
});

/* ── REGISTER ── */
describe("POST /api/auth/register", () => {
    it("should register a new user and return 201", async () => {
        const res = await request(app).post("/api/auth/register").send({
            name:     "Rajneesh Kumar",
            email:    `reg_${Date.now()}@test.com`,
            phone:    "9876543210",
            password: "Password123!",
        });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.requiresVerification).toBe(true);
    });

    it("should reject with missing fields", async () => {
        const res = await request(app).post("/api/auth/register").send({ email: "x@x.com" });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it("should reject invalid phone number", async () => {
        const res = await request(app).post("/api/auth/register").send({
            name: "Test", email: "a@b.com", phone: "1234567890", password: "Password123!",
        });
        expect(res.status).toBe(400);
    });

    it("should reject password shorter than 8 chars", async () => {
        const res = await request(app).post("/api/auth/register").send({
            name: "Test", email: "a@b.com", phone: "9876543210", password: "short",
        });
        expect(res.status).toBe(400);
    });
});

/* ── LOGIN ── */
describe("POST /api/auth/login", () => {
    let testEmail;

    beforeAll(async () => {
        const user = await createTestUser();
        testEmail = user.email;
    });

    it("should login with correct credentials", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email:    testEmail,
            password: "Password123!",
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
        expect(res.body.role).toBe("user");
    });

    it("should reject wrong password", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: testEmail, password: "WrongPassword!",
        });
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it("should reject non-existent email", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: "nobody@test.com", password: "Password123!",
        });
        expect(res.status).toBe(401);
    });

    it("should reject missing fields", async () => {
        const res = await request(app).post("/api/auth/login").send({ email: "a@b.com" });
        expect(res.status).toBe(400);
    });
});

/* ── GET PROFILE ── */
describe("GET /api/auth/profile", () => {
    it("should reject unauthenticated request", async () => {
        const res = await request(app).get("/api/auth/profile");
        expect(res.status).toBe(401);
    });

    it("should return profile for authenticated user", async () => {
        const user = await createTestUser({ email: `profile_${Date.now()}@test.com` });
        const login = await request(app).post("/api/auth/login").send({
            email: user.email, password: "Password123!",
        });
        const token = login.body.token;

        const res = await request(app)
            .get("/api/auth/profile")
            .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.email).toBe(user.email);
    });
});

/* ── ADMIN LOGIN ── */
describe("POST /api/auth/admin/login", () => {
    it("should reject non-admin credentials", async () => {
        const user = await createTestUser({ email: `notadmin_${Date.now()}@test.com` });
        const res = await request(app).post("/api/auth/admin/login").send({
            email: user.email, password: "Password123!",
        });
        expect(res.status).toBe(401);
    });
});
