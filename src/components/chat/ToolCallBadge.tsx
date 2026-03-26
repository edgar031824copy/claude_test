"use client";

import { Loader2, Check } from "lucide-react";
import type { ToolInvocation } from "ai";

interface ToolCallBadgeProps {
  toolInvocation: ToolInvocation;
}

function getBasename(path: string): string {
  return path.split("/").filter(Boolean).pop() ?? path;
}

function getLabel(toolInvocation: ToolInvocation): string {
  const { toolName, args, state } = toolInvocation;
  const done = state === "result";

  if (toolName === "str_replace_editor") {
    const file = getBasename(args?.path ?? "");
    switch (args?.command) {
      case "create":
        return done ? `Created ${file}` : `Creating ${file}…`;
      case "str_replace":
      case "insert":
        return done ? `Edited ${file}` : `Editing ${file}…`;
      case "view":
        return done ? `Read ${file}` : `Reading ${file}…`;
      default:
        return done ? `Updated ${file}` : `Updating ${file}…`;
    }
  }

  if (toolName === "file_manager") {
    const file = getBasename(args?.path ?? "");
    const newFile = args?.new_path ? getBasename(args.new_path) : "";
    switch (args?.command) {
      case "rename":
        return done
          ? `Renamed ${file} → ${newFile}`
          : `Renaming ${file} → ${newFile}…`;
      case "delete":
        return done ? `Deleted ${file}` : `Deleting ${file}…`;
      default:
        return done ? `Updated ${file}` : `Updating ${file}…`;
    }
  }

  return toolName;
}

export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const done = toolInvocation.state === "result";
  const label = getLabel(toolInvocation);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {done ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600 flex-shrink-0" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
