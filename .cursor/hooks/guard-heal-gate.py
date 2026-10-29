#!/usr/bin/env python3
"""preToolUse / Write: gate POM edits on heal/* branches via the evidence scorer."""

from __future__ import annotations

import sys

from evidence_gate_lib import (
    allow,
    deny,
    git_branch,
    read_stdin_json,
    require_side_action,
    under_pages,
    workspace_root,
    write_tool_path,
)


def main() -> int:
    try:
        payload = read_stdin_json()
    except (ValueError, Exception) as exc:  # noqa: BLE001 — fail closed
        return deny(f"Blocked heal gate: invalid hook input ({exc})")

    tool_name = payload.get("tool_name")
    if tool_name != "Write":
        return allow()

    root = workspace_root(payload)
    rel = write_tool_path(payload, root)
    if rel is None or not under_pages(rel):
        return allow()

    branch = git_branch(root)
    if not branch.startswith("heal/"):
        return allow()

    return require_side_action(
        root,
        required_side="drift",
        action_label=f"Write to {rel} on branch {branch}",
    )


if __name__ == "__main__":
    sys.exit(main())
