import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock server actions
vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";

const mockSignIn = vi.mocked(signInAction);
const mockSignUp = vi.mocked(signUpAction);
const mockGetProjects = vi.mocked(getProjects);
const mockCreateProject = vi.mocked(createProject);
const mockGetAnonWorkData = vi.mocked(getAnonWorkData);
const mockClearAnonWork = vi.mocked(clearAnonWork);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAnonWorkData.mockReturnValue(null);
});

describe("useAuth", () => {
  describe("initial state", () => {
    test("isLoading starts as false", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
    });

    test("exposes signIn, signUp, and isLoading", () => {
      const { result } = renderHook(() => useAuth());
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
      expect(typeof result.current.isLoading).toBe("boolean");
    });
  });

  describe("signIn", () => {
    describe("happy path", () => {
      test("returns success result", async () => {
        mockSignIn.mockResolvedValue({ success: true });
        mockGetProjects.mockResolvedValue([{ id: "proj-1", name: "My Project", createdAt: new Date(), updatedAt: new Date() }]);

        const { result } = renderHook(() => useAuth());
        let returnValue: any;

        await act(async () => {
          returnValue = await result.current.signIn("user@example.com", "password123");
        });

        expect(returnValue).toEqual({ success: true });
        expect(mockSignIn).toHaveBeenCalledWith("user@example.com", "password123");
      });

      test("redirects to existing project after sign in", async () => {
        mockSignIn.mockResolvedValue({ success: true });
        mockGetProjects.mockResolvedValue([
          { id: "proj-1", name: "Project 1", createdAt: new Date(), updatedAt: new Date() },
          { id: "proj-2", name: "Project 2", createdAt: new Date(), updatedAt: new Date() },
        ]);

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(mockPush).toHaveBeenCalledWith("/proj-1");
      });

      test("creates new project and redirects when user has no projects", async () => {
        mockSignIn.mockResolvedValue({ success: true });
        mockGetProjects.mockResolvedValue([]);
        mockCreateProject.mockResolvedValue({ id: "new-proj", name: "New Design", messages: "[]", data: "{}", userId: "u1", createdAt: new Date(), updatedAt: new Date() });

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(mockCreateProject).toHaveBeenCalledWith(
          expect.objectContaining({ messages: [], data: {} })
        );
        expect(mockPush).toHaveBeenCalledWith("/new-proj");
      });

      test("saves anonymous work as a project and redirects when anon work exists", async () => {
        const anonWork = {
          messages: [{ role: "user", content: "hello" }],
          fileSystemData: { "/App.jsx": "export default () => <div/>" },
        };
        mockGetAnonWorkData.mockReturnValue(anonWork);
        mockSignIn.mockResolvedValue({ success: true });
        mockCreateProject.mockResolvedValue({ id: "anon-proj", name: "Design from ...", messages: "[]", data: "{}", userId: "u1", createdAt: new Date(), updatedAt: new Date() });

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(mockCreateProject).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: anonWork.messages,
            data: anonWork.fileSystemData,
          })
        );
        expect(mockClearAnonWork).toHaveBeenCalled();
        expect(mockGetProjects).not.toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/anon-proj");
      });
    });

    describe("failure", () => {
      test("returns error result without redirecting", async () => {
        mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });

        const { result } = renderHook(() => useAuth());
        let returnValue: any;

        await act(async () => {
          returnValue = await result.current.signIn("user@example.com", "wrongpassword");
        });

        expect(returnValue).toEqual({ success: false, error: "Invalid credentials" });
        expect(mockPush).not.toHaveBeenCalled();
        expect(mockGetProjects).not.toHaveBeenCalled();
      });
    });

    describe("loading state", () => {
      test("sets isLoading to true while signing in, then false after", async () => {
        let resolveSignIn!: (val: any) => void;
        mockSignIn.mockReturnValue(new Promise((res) => { resolveSignIn = res; }));
        mockGetProjects.mockResolvedValue([{ id: "p1", name: "P", createdAt: new Date(), updatedAt: new Date() }]);

        const { result } = renderHook(() => useAuth());
        expect(result.current.isLoading).toBe(false);

        let signInPromise: Promise<any>;
        act(() => {
          signInPromise = result.current.signIn("user@example.com", "password123");
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
          resolveSignIn({ success: true });
          await signInPromise!;
        });

        expect(result.current.isLoading).toBe(false);
      });

      test("resets isLoading to false even when signIn throws", async () => {
        mockSignIn.mockRejectedValue(new Error("Network error"));

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "password123").catch(() => {});
        });

        expect(result.current.isLoading).toBe(false);
      });
    });

    describe("edge cases", () => {
      test("ignores anonymous work when messages array is empty", async () => {
        mockGetAnonWorkData.mockReturnValue({ messages: [], fileSystemData: {} });
        mockSignIn.mockResolvedValue({ success: true });
        mockGetProjects.mockResolvedValue([{ id: "p1", name: "P", createdAt: new Date(), updatedAt: new Date() }]);

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(mockCreateProject).not.toHaveBeenCalledWith(
          expect.objectContaining({ messages: [] })
        );
        expect(mockGetProjects).toHaveBeenCalled();
      });
    });
  });

  describe("signUp", () => {
    describe("happy path", () => {
      test("returns success result", async () => {
        mockSignUp.mockResolvedValue({ success: true });
        mockGetProjects.mockResolvedValue([{ id: "proj-1", name: "Project", createdAt: new Date(), updatedAt: new Date() }]);

        const { result } = renderHook(() => useAuth());
        let returnValue: any;

        await act(async () => {
          returnValue = await result.current.signUp("new@example.com", "password123");
        });

        expect(returnValue).toEqual({ success: true });
        expect(mockSignUp).toHaveBeenCalledWith("new@example.com", "password123");
      });

      test("redirects to existing project after sign up", async () => {
        mockSignUp.mockResolvedValue({ success: true });
        mockGetProjects.mockResolvedValue([{ id: "proj-1", name: "Project", createdAt: new Date(), updatedAt: new Date() }]);

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signUp("new@example.com", "password123");
        });

        expect(mockPush).toHaveBeenCalledWith("/proj-1");
      });

      test("creates a new project when no projects exist after sign up", async () => {
        mockSignUp.mockResolvedValue({ success: true });
        mockGetProjects.mockResolvedValue([]);
        mockCreateProject.mockResolvedValue({ id: "fresh-proj", name: "New Design", messages: "[]", data: "{}", userId: "u1", createdAt: new Date(), updatedAt: new Date() });

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signUp("new@example.com", "password123");
        });

        expect(mockCreateProject).toHaveBeenCalledWith(
          expect.objectContaining({ messages: [], data: {} })
        );
        expect(mockPush).toHaveBeenCalledWith("/fresh-proj");
      });

      test("saves anonymous work after sign up", async () => {
        const anonWork = {
          messages: [{ role: "user", content: "build me a dashboard" }],
          fileSystemData: { "/App.jsx": "export default () => <div/>" },
        };
        mockGetAnonWorkData.mockReturnValue(anonWork);
        mockSignUp.mockResolvedValue({ success: true });
        mockCreateProject.mockResolvedValue({ id: "anon-proj", name: "Design from ...", messages: "[]", data: "{}", userId: "u1", createdAt: new Date(), updatedAt: new Date() });

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signUp("new@example.com", "password123");
        });

        expect(mockCreateProject).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: anonWork.messages,
            data: anonWork.fileSystemData,
          })
        );
        expect(mockClearAnonWork).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/anon-proj");
      });
    });

    describe("failure", () => {
      test("returns error result without redirecting", async () => {
        mockSignUp.mockResolvedValue({ success: false, error: "Email already registered" });

        const { result } = renderHook(() => useAuth());
        let returnValue: any;

        await act(async () => {
          returnValue = await result.current.signUp("existing@example.com", "password123");
        });

        expect(returnValue).toEqual({ success: false, error: "Email already registered" });
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    describe("loading state", () => {
      test("sets isLoading to true while signing up, then false after", async () => {
        let resolveSignUp!: (val: any) => void;
        mockSignUp.mockReturnValue(new Promise((res) => { resolveSignUp = res; }));
        mockGetProjects.mockResolvedValue([{ id: "p1", name: "P", createdAt: new Date(), updatedAt: new Date() }]);

        const { result } = renderHook(() => useAuth());
        expect(result.current.isLoading).toBe(false);

        let signUpPromise: Promise<any>;
        act(() => {
          signUpPromise = result.current.signUp("new@example.com", "password123");
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
          resolveSignUp({ success: true });
          await signUpPromise!;
        });

        expect(result.current.isLoading).toBe(false);
      });

      test("resets isLoading to false even when signUp throws", async () => {
        mockSignUp.mockRejectedValue(new Error("Network error"));

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signUp("new@example.com", "password123").catch(() => {});
        });

        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
