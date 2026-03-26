import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";
import type { ToolInvocation } from "ai";

function makeInvocation(
  toolName: string,
  args: Record<string, unknown>,
  state: "call" | "result" = "call"
): ToolInvocation {
  if (state === "result") {
    return { toolCallId: "1", toolName, args, state, result: "ok" } as ToolInvocation;
  }
  return { toolCallId: "1", toolName, args, state } as ToolInvocation;
}

describe("ToolCallBadge", () => {
  describe("str_replace_editor", () => {
    it("shows 'Creating <file>…' while in progress", () => {
      render(
        <ToolCallBadge
          toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" })}
        />
      );
      expect(screen.getByText("Creating App.jsx…")).toBeDefined();
    });

    it("shows 'Created <file>' when done", () => {
      render(
        <ToolCallBadge
          toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" }, "result")}
        />
      );
      expect(screen.getByText("Created App.jsx")).toBeDefined();
    });

    it("shows 'Editing <file>…' for str_replace in progress", () => {
      render(
        <ToolCallBadge
          toolInvocation={makeInvocation("str_replace_editor", { command: "str_replace", path: "/components/Card.jsx" })}
        />
      );
      expect(screen.getByText("Editing Card.jsx…")).toBeDefined();
    });

    it("shows 'Edited <file>' for str_replace done", () => {
      render(
        <ToolCallBadge
          toolInvocation={makeInvocation("str_replace_editor", { command: "str_replace", path: "/components/Card.jsx" }, "result")}
        />
      );
      expect(screen.getByText("Edited Card.jsx")).toBeDefined();
    });

    it("shows 'Editing <file>…' for insert in progress", () => {
      render(
        <ToolCallBadge
          toolInvocation={makeInvocation("str_replace_editor", { command: "insert", path: "/utils/helpers.js" })}
        />
      );
      expect(screen.getByText("Editing helpers.js…")).toBeDefined();
    });

    it("shows 'Reading <file>…' for view in progress", () => {
      render(
        <ToolCallBadge
          toolInvocation={makeInvocation("str_replace_editor", { command: "view", path: "/App.jsx" })}
        />
      );
      expect(screen.getByText("Reading App.jsx…")).toBeDefined();
    });

    it("shows 'Read <file>' for view done", () => {
      render(
        <ToolCallBadge
          toolInvocation={makeInvocation("str_replace_editor", { command: "view", path: "/App.jsx" }, "result")}
        />
      );
      expect(screen.getByText("Read App.jsx")).toBeDefined();
    });
  });

  describe("file_manager", () => {
    it("shows 'Renaming <old> → <new>…' in progress", () => {
      render(
        <ToolCallBadge
          toolInvocation={makeInvocation("file_manager", {
            command: "rename",
            path: "/Button.jsx",
            new_path: "/components/Button.jsx",
          })}
        />
      );
      expect(screen.getByText("Renaming Button.jsx → Button.jsx…")).toBeDefined();
    });

    it("shows 'Renamed <old> → <new>' when done", () => {
      render(
        <ToolCallBadge
          toolInvocation={makeInvocation(
            "file_manager",
            { command: "rename", path: "/Button.jsx", new_path: "/components/Button.jsx" },
            "result"
          )}
        />
      );
      expect(screen.getByText("Renamed Button.jsx → Button.jsx")).toBeDefined();
    });

    it("shows 'Deleting <file>…' in progress", () => {
      render(
        <ToolCallBadge
          toolInvocation={makeInvocation("file_manager", { command: "delete", path: "/old/Temp.jsx" })}
        />
      );
      expect(screen.getByText("Deleting Temp.jsx…")).toBeDefined();
    });

    it("shows 'Deleted <file>' when done", () => {
      render(
        <ToolCallBadge
          toolInvocation={makeInvocation("file_manager", { command: "delete", path: "/old/Temp.jsx" }, "result")}
        />
      );
      expect(screen.getByText("Deleted Temp.jsx")).toBeDefined();
    });
  });

  describe("visual states", () => {
    it("renders a spinner when in progress", () => {
      const { container } = render(
        <ToolCallBadge
          toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" })}
        />
      );
      expect(container.querySelector(".animate-spin")).toBeDefined();
    });

    it("renders a filled dot when done", () => {
      const { container } = render(
        <ToolCallBadge
          toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" }, "result")}
        />
      );
      expect(container.querySelector(".bg-emerald-500")).toBeDefined();
      expect(container.querySelector(".animate-spin")).toBeNull();
    });
  });
});
