#!/usr/bin/env python3
"""beforeShellExecution: gate `gh pr create` on heal/* via the evidence scorer."""

from __future__ import annotations

import sys

from evidence_gate_lib import (
    allow,
    deny,
    git_branch,
    looks_like_gh_pr_create,
    read_stdin_json,
    require_side_action,
    workspace_root,
)


def main() -> int:
    try:
        payload = read_stdin_json()
    except (ValueError, Exception) as exc:  # noqa: BLE001 — fail closed
        return deny(f"Blocked PR gate: invalid hook input ({exc})")

    command = payload.get("command")
    if not isinstance(command, str) or not looks_like_gh_pr_create(command):
        return allow()

    root = workspace_root(payload)
    branch = git_branch(root)
    if not branch.startswith("heal/"):
        return allow()

    return require_side_action(
        root,
        required_side="drift",
        action_label=f"gh pr create on branch {branch}",
    )


if __name__ == "__main__":
    sys.exit(main())
