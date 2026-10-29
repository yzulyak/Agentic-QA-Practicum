#!/usr/bin/env python3
"""preToolUse / Write: humans alone may create .test-artifacts/approvals/* files."""

from __future__ import annotations

import sys

from evidence_gate_lib import (
    allow,
    deny,
    read_stdin_json,
    under_approvals,
    workspace_root,
    write_tool_path,
)


def main() -> int:
    try:
        payload = read_stdin_json()
    except (ValueError, Exception) as exc:  # noqa: BLE001 — fail closed
        return deny(f"Blocked approvals gate: invalid hook input ({exc})")

    tool_name = payload.get("tool_name")
    if tool_name != "Write":
        return allow()

    root = workspace_root(payload)
    rel = write_tool_path(payload, root)
    if rel is None or not under_approvals(rel):
        return allow()

    return deny(
        f"Blocked Write to {rel}: approval files under .test-artifacts/approvals/ "
        f"must be created by a human by hand (agents cannot write them)."
    )


if __name__ == "__main__":
    sys.exit(main())
