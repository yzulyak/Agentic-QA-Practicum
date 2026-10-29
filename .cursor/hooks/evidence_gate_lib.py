#!/usr/bin/env python3
"""Shared helpers for evidence-score gates. Always re-run the scorer; never trust a saved decision file."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from typing import Mapping, MutableMapping, Optional, Tuple

EVIDENCE_REL = Path(".test-artifacts") / "evidence" / "current.json"
APPROVALS_DIR = Path(".test-artifacts") / "approvals"
SCORER = Path("scripts") / "score-evidence.ts"


def workspace_root(payload: Mapping[str, object]) -> Path:
    roots = payload.get("workspace_roots")
    if isinstance(roots, list) and roots and isinstance(roots[0], str) and roots[0]:
        return Path(roots[0])
    return Path.cwd()


def git_branch(root: Path) -> str:
    try:
        out = subprocess.check_output(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=str(root),
            stderr=subprocess.DEVNULL,
            text=True,
        )
        return out.strip()
    except (subprocess.CalledProcessError, FileNotFoundError, OSError):
        return ""


def normalize_repo_path(path_str: str, root: Path) -> str:
    p = Path(path_str)
    if not p.is_absolute():
        p = (root / p).resolve()
    else:
        p = p.resolve()
    try:
        rel = p.relative_to(root.resolve())
    except ValueError:
        return path_str.replace("\\", "/")
    return str(rel).replace("\\", "/")


def under_pages(rel_posix: str) -> bool:
    return rel_posix == "pages" or rel_posix.startswith("pages/")


def under_approvals(rel_posix: str) -> bool:
    return rel_posix == ".test-artifacts/approvals" or rel_posix.startswith(
        ".test-artifacts/approvals/"
    )


def write_tool_path(payload: Mapping[str, object], root: Path) -> Optional[str]:
    """Extract path from preToolUse Write tool_input (path or file_path)."""
    tool_input = payload.get("tool_input")
    if not isinstance(tool_input, dict):
        return None
    raw = tool_input.get("path")
    if not isinstance(raw, str) or not raw:
        raw = tool_input.get("file_path")
    if not isinstance(raw, str) or not raw:
        return None
    return normalize_repo_path(raw, root)


def parse_mcp_tool_input(payload: Mapping[str, object]) -> Mapping[str, object]:
    raw = payload.get("tool_input")
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str) and raw.strip():
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            return {}
        if isinstance(parsed, dict):
            return parsed
    return {}


def run_scorer(root: Path) -> Tuple[Optional[Mapping[str, object]], str]:
    """
    Run the scorer on current.json. Returns (decision_dict | None, error_message).
    Never reads .test-artifacts/decisions/.
    """
    evidence = root / EVIDENCE_REL
    if not evidence.is_file():
        return None, f"missing evidence file: {EVIDENCE_REL.as_posix()}"

    cmd = [
        "npx",
        "tsx",
        str(SCORER),
        "--verify-only",
        str(evidence),
    ]
    try:
        proc = subprocess.run(
            cmd,
            cwd=str(root),
            capture_output=True,
            text=True,
            check=False,
        )
    except OSError as exc:
        return None, f"failed to invoke scorer: {exc}"

    if proc.returncode != 0:
        detail = (proc.stderr or proc.stdout or "").strip()
        return None, f"scorer exited {proc.returncode}: {detail[:500]}"

    stdout = (proc.stdout or "").strip()
    if not stdout:
        return None, "scorer produced empty stdout"

    try:
        data = json.loads(stdout)
    except json.JSONDecodeError as exc:
        return None, f"scorer stdout is not JSON: {exc}"

    if not isinstance(data, dict):
        return None, "scorer JSON root must be an object"
    return data, ""


def approval_path(root: Path, decision_id: str) -> Path:
    return root / APPROVALS_DIR / f"{decision_id}.json"


def has_human_approval(root: Path, decision_id: str) -> bool:
    path = approval_path(root, decision_id)
    return path.is_file() and path.stat().st_size > 0


def format_decision_detail(decision: Mapping[str, object]) -> str:
    did = decision.get("decisionId", "?")
    dec = decision.get("decision", "?")
    side = decision.get("side")
    side_s = "null" if side is None else str(side)
    score = decision.get("score", "?")
    rule = decision.get("rule", "?")
    missing = decision.get("missing") or []
    contradictions = decision.get("contradictions") or []
    parts = [
        f"decisionId={did}",
        f"decision={dec}",
        f"side={side_s}",
        f"score={score}",
        f"rule={rule}",
    ]
    if isinstance(missing, list) and missing:
        parts.append(f"missing={missing}")
    if isinstance(contradictions, list) and contradictions:
        parts.append(f"contradictions={contradictions}")
    return "; ".join(parts)


def allow() -> int:
    print(json.dumps({"permission": "allow"}))
    return 0


def deny(message: str) -> int:
    body: MutableMapping[str, str] = {
        "permission": "deny",
        "user_message": message,
        "agent_message": message,
    }
    print(json.dumps(body))
    print(message, file=sys.stderr)
    return 2


def require_side_action(
    root: Path,
    *,
    required_side: str,
    action_label: str,
) -> int:
    """Allow act+required_side, or escalate with approval file; else deny."""
    decision, err = run_scorer(root)
    if decision is None:
        return deny(
            f"Blocked {action_label}: evidence score unavailable ({err}). "
            f"Write items to {EVIDENCE_REL.as_posix()}, copy to current.json, "
            f"re-run npx tsx scripts/score-evidence.ts --verify-only "
            f"{EVIDENCE_REL.as_posix()}."
        )

    detail = format_decision_detail(decision)
    dec = decision.get("decision")
    side = decision.get("side")
    decision_id = decision.get("decisionId")

    if dec == "act" and side == required_side:
        return allow()

    if dec == "escalate" and isinstance(decision_id, str) and decision_id:
        if has_human_approval(root, decision_id):
            return allow()
        return deny(
            f"Blocked {action_label}: escalate requires human approval file "
            f"{APPROVALS_DIR.as_posix()}/{decision_id}.json (create by hand). "
            f"Scorer: {detail}"
        )

    return deny(
        f"Blocked {action_label}: need decision=act with side={required_side} "
        f"(or escalate + approval). Scorer: {detail}"
    )


def read_stdin_json() -> Mapping[str, object]:
    raw = sys.stdin.read()
    if not raw or not raw.strip():
        raise ValueError("empty stdin JSON")
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise ValueError("JSON root must be an object")
    return data


def looks_like_gh_pr_create(command: str) -> bool:
    # Match `gh pr create` even with flags before/after or via env prefixes.
    tokens = command.replace("\n", " ").split()
    for i, tok in enumerate(tokens):
        if tok == "gh" and i + 2 < len(tokens) and tokens[i + 1] == "pr" and tokens[i + 2] == "create":
            return True
        if tok.endswith("/gh") and i + 2 < len(tokens) and tokens[i + 1] == "pr" and tokens[i + 2] == "create":
            return True
    return False


def is_create_jira_bug(payload: Mapping[str, object]) -> bool:
    tool_name = payload.get("tool_name")
    if not isinstance(tool_name, str):
        return False
    # beforeMCPExecution uses bare tool name; preToolUse MCP uses MCP:<name>
    bare = tool_name.split(":", 1)[-1] if tool_name.startswith("MCP:") else tool_name
    if bare != "createJiraIssue":
        return False
    args = parse_mcp_tool_input(payload)
    issue_type = args.get("issueType")
    return isinstance(issue_type, str) and issue_type == "Bug"
