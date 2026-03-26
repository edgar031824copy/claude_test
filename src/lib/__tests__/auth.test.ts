// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";

// server-only guard must be mocked before importing auth
vi.mock("server-only", () => ({}));

// Capture cookie.set calls
const mockCookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ set: mockCookieSet })),
}));

// Import after mocks are in place
const { createSession } = await import("@/lib/auth");

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

describe("createSession", () => {
  beforeEach(() => {
    mockCookieSet.mockClear();
  });

  it("sets an httpOnly cookie named 'auth-token'", async () => {
    await createSession("user-1", "test@example.com");

    expect(mockCookieSet).toHaveBeenCalledOnce();
    const [name, , options] = mockCookieSet.mock.calls[0];
    expect(name).toBe("auth-token");
    expect(options.httpOnly).toBe(true);
  });

  it("sets sameSite to lax and path to /", async () => {
    await createSession("user-1", "test@example.com");

    const [, , options] = mockCookieSet.mock.calls[0];
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  it("sets cookie expiry ~7 days from now", async () => {
    const before = Date.now();
    await createSession("user-1", "test@example.com");
    const after = Date.now();

    const [, , options] = mockCookieSet.mock.calls[0];
    const expiresMs = options.expires.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    expect(expiresMs).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
    expect(expiresMs).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
  });

  it("JWT contains the correct userId and email", async () => {
    await createSession("user-42", "edgar@example.com");

    const [, token] = mockCookieSet.mock.calls[0];
    const { payload } = await jwtVerify(token, JWT_SECRET);

    expect(payload.userId).toBe("user-42");
    expect(payload.email).toBe("edgar@example.com");
  });

  it("JWT is signed with HS256", async () => {
    await createSession("user-1", "test@example.com");

    const [, token] = mockCookieSet.mock.calls[0];
    const { protectedHeader } = await jwtVerify(token, JWT_SECRET);

    expect(protectedHeader.alg).toBe("HS256");
  });

  it("JWT expires in ~7 days", async () => {
    const before = Math.floor(Date.now() / 1000);
    await createSession("user-1", "test@example.com");
    const after = Math.floor(Date.now() / 1000);

    const [, token] = mockCookieSet.mock.calls[0];
    const { payload } = await jwtVerify(token, JWT_SECRET);

    const sevenDaysSec = 7 * 24 * 60 * 60;
    expect(payload.exp).toBeGreaterThanOrEqual(before + sevenDaysSec - 5);
    expect(payload.exp).toBeLessThanOrEqual(after + sevenDaysSec + 5);
  });

  it("JWT token is a valid signed string", async () => {
    await createSession("user-1", "test@example.com");

    const [, token] = mockCookieSet.mock.calls[0];
    expect(typeof token).toBe("string");
    // JWT has 3 dot-separated parts
    expect(token.split(".")).toHaveLength(3);
  });
});
