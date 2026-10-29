#!/usr/bin/env python3
"""beforeMCPExecution: gate Atlassian createJiraIssue with issueType Bug via scorer."""

from __future__ import annotations

import sys

from evidence_gate_lib import (
    allow,
    deny,
    is_create_jira_bug,
    read_stdin_json,
    require_side_action,
    workspace_root,
)


def main() -> int:
    try:
        payload = read_stdin_json()
    except (ValueError, Exception) as exc:  # noqa: BLE001 — fail closed
        return deny(f"Blocked Jira bug gate: invalid hook input ({exc})")

    if not is_create_jira_bug(payload):
        return allow()

    root = workspace_root(payload)
    return require_side_action(
        root,
        required_side="bug",
        action_label="createJiraIssue issueType=Bug",
    )


if __name__ == "__main__":
    sys.exit(main())
