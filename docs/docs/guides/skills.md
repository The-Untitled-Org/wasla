---
sidebar_position: 3
---

# Skills Configuration Guide

In WaslaGenie, Skills are native tool commands or configurations injected directly into the orchestrators.

## Overview

Unlike Agents and MCPs which are standalone files that are synced, "Skills" often refer to configuring the orchestrator itself to understand and use WaslaGenie commands natively.

## Provider-Specific Configuration

### Claude Code

WaslaGenie installs a skill for Claude Code by modifying the `CLAUDE.md` file in the tool's directory.

It appends a `## WaslaGenie` section to the `CLAUDE.md` file, providing instructions to the AI on how to interact with WaslaGenie.

```markdown
<!-- waslagenie:start -->
## WaslaGenie

WaslaGenie synchronizes your agents and MCPs across Claude Code, Gemini CLI, and OpenClaw.

To use WaslaGenie:
\`\`\`bash
waslagenie sync          # Sync agents across tools
waslagenie status        # View all synced assets
waslagenie watch         # Watch for changes and auto-sync
\`\`\`

For more info: [WaslaGenie Documentation](https://github.com/yourusername/wasla-genie)
<!-- waslagenie:end -->
```

### Gemini CLI

WaslaGenie installs a skill for Gemini CLI by modifying the `GEMINI.md` file in the tool's directory.

Similar to Claude Code, it appends a `## WaslaGenie` section instructing the AI on how to use WaslaGenie.

### OpenClaw

Currently, OpenClaw does not have a native skill installation script through WaslaGenie. Support may be added in the future.
