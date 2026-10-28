#!/usr/bin/env python3
"""
Stop Hook for Antigravity:
Automatically validates that TypeScript compiles without errors before the agent concludes a turn.
If errors are found, it cancels termination, enters the loop again, and feeds the compiler errors back to the model.
"""

import sys
import os
import json
import subprocess

def main():
    try:
        raw_input = sys.stdin.read()
        payload = json.loads(raw_input) if raw_input.strip() else {}
    except Exception:
        payload = {}

    # Only run quality verification on normal completion (NO_TOOL_CALL)
    # Don't block user cancellation, error exits, or custom stops
    reason = payload.get("terminationReason", "NO_TOOL_CALL")
    if reason and reason != "NO_TOOL_CALL":
        print(json.dumps({"decision": "allow"}))
        return

    # Determine project root directory
    workspace_paths = payload.get("workspacePaths", [])
    if workspace_paths and os.path.isdir(workspace_paths[0]):
        cwd = workspace_paths[0]
    else:
        # Fallback to repository root relative to this script: .agents/hooks/../../ -> root
        cwd = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

    # Check if tsconfig.json exists
    if not os.path.exists(os.path.join(cwd, "tsconfig.json")):
        print(json.dumps({"decision": "allow"}))
        return

    try:
        # Execute TypeScript verification
        res = subprocess.run(
            ["npx", "tsc", "--noEmit"],
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=25
        )

        if res.returncode != 0:
            output = (res.stdout + "\n" + res.stderr).strip()
            # Truncate if error output is massive
            if len(output) > 3000:
                output = output[:3000] + "\n... [truncated remaining compiler errors]"

            response = {
                "decision": "continue",
                "reason": (
                    "Automatic Quality Gate: TypeScript check (`tsc --noEmit`) failed with the following errors:\n\n"
                    f"{output}\n\n"
                    "Please analyze and fix these TypeScript errors before concluding your response."
                )
            }
        else:
            response = {"decision": "allow"}

    except subprocess.TimeoutExpired:
        # Avoid hanging the session if tsc hangs
        response = {"decision": "allow"}
    except Exception as e:
        # Graceful fallback on unexpected execution error
        response = {"decision": "allow"}

    print(json.dumps(response))

if __name__ == "__main__":
    main()
