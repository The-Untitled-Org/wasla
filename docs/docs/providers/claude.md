---
id: claude
title: Claude Code Configuration Guide
sidebar_label: Claude Code
---

# Claude Code Configuration Guide

This guide covers how to configure agents, MCPs, and skills for **Claude Code** when using WaslaGenie.

## 1. Agent Configuration

### Creating and Configuring Agents

Agents are **Markdown files with YAML frontmatter** placed inside dedicated agent directories.
Each file defines a specialized sub-agent that Claude can spawn during a session.

```
# Project-scoped (committed to repo, shared with team)
.claude/
└── agents/
    ├── researcher.md
    ├── code-reviewer.md
    └── test-writer.md

# User-scoped (personal, available across all projects)
~/.claude/
└── agents/
    ├── security-auditor.md
    └── documentation-writer.md
```

#### Agent file anatomy

```markdown
---
name: researcher
description: >
  Deep research agent. Spawned when the user asks to "research", "investigate",
  or "find out about" a topic. Do NOT spawn for code tasks.
tools: Read, Grep, Glob, WebSearch
disallowedTools: Write, Edit, Bash
model: claude-opus-4-6
permissionMode: default
maxTurns: 20
skills:
  - web-research
  - citation-formatter
mcpServers:
  - exa-search
color: purple
---

You are a senior research analyst. Your job is to:
1. Gather information from multiple sources.
2. Synthesize findings into a structured report.
3. Always cite your sources.

Never modify files unless explicitly asked.
```

#### YAML frontmatter field reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | `string` | ✅ | Unique identifier. Used in `@agent-name` mentions. |
| `description` | `string` | ✅ | Claude uses this to decide which agent to spawn. Be specific. |
| `tools` | `string` (CSV) | ❌ | Allowlist. When set, agent can ONLY use these tools. |
| `disallowedTools` | `string` (CSV) | ❌ | Denylist. Applied before `tools`. |
| `model` | `string` | ❌ | Defaults to session model. Accepts any Claude model string. |
| `permissionMode` | `string` | ❌ | `default` \| `acceptEdits` \| `bypassPermissions` |
| `maxTurns` | `number` | ❌ | Cap on agentic loop iterations. |
| `skills` | `string[]` | ❌ | Skills to pre-load. Must match skill names in `.claude/skills/`. |
| `mcpServers` | `string[]` | ❌ | Additional MCP servers the agent connects to at spawn time. |
| `hooks` | `object` | ❌ | Lifecycle hooks. Not supported in plugin sub-agents. |
| `initialPrompt` | `string` | ❌ | First turn injected when spawning. |
| `memory` | `boolean` | ❌ | Whether agent has access to memory tools. |
| `effort` | `string` | ❌ | `low` \| `medium` \| `high` |
| `background` | `boolean` | ❌ | Run in background (non-blocking). |
| `isolation` | `boolean` | ❌ | Isolated context window from parent. |
| `color` | `string` | ❌ | UI label color. |

### Agent Lifecycle and Activation

```
Session start
│
├─ Scans .claude/agents/ (workspace) → lower precedence
├─ Scans ~/.claude/agents/ (user) → higher precedence
│
├─ Agent names + descriptions injected into system prompt
│
User message / Agent tool call
│
├─ Claude matches intent → selects agent
├─ Spawns isolated context window
├─ Agent runs its own agentic loop (gather → act → verify)
│   └─ Subagents CANNOT spawn further subagents
├─ Result compressed → returned to parent context
│
Session end → all sub-contexts destroyed
```

- **Precedence:** User-scoped agents (`~/.claude/agents/`) take precedence over workspace-scoped agents (`.claude/agents/`)
- **Sub-agent limitation:** Sub-agents cannot spawn further sub-agents (single nesting level)
- **Context isolation:** Each sub-agent runs in its own isolated context window

### Interacting with Skills and MCPs

- Skills are referenced by name in agent frontmatter via the `skills:` field
- MCP servers are referenced by name via the `mcpServers:` field
- The agent pre-loads these skills and MCP servers at spawn time
- Tools exposed by MCP servers are available by their registered name (no prefix applied)

### Configuration Locations

| Scope | Path | Notes |
|-------|------|-------|
| Workspace agents | `.claude/agents/` | Committed to repo, shared with team |
| User agents | `~/.claude/agents/` | Personal, all projects |
| Context file | `CLAUDE.md` | Loaded unconditionally at session start |
| User context | `~/.claude/CLAUDE.md` | User-scoped context |

## 2. MCP (Model Context Protocol) Setup

### MCP Server Configuration

MCP servers are configured in JSON files using the `mcpServers` key.

```
# Config file locations (ordered by precedence, highest first)
.claude/settings.managed.json    ← org-controlled, highest precedence
~/.claude/settings.json          ← user-level MCP config
.mcp.json                       ← primary workspace MCP config
.claude/settings.json            ← project settings (alternative)
```

#### `.mcp.json` format

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"],
      "env": {
        "NODE_ENV": "production"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "remote-server": {
      "url": "https://mcp.example.com/sse",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

### MCP Integration with Agents

- Tools exposed by MCP servers are available as-is by their registered name (no prefix applied)
- Per-agent MCP assignment is supported via the `mcpServers` field in agent frontmatter
- MCP servers are started at session open and killed at session close
- Config changes require a session restart to take effect

### MCP Communication Protocols

| Transport | Config key | Use case |
|-----------|-----------|----------|
| stdio | `command` + `args` | Local subprocess. Most common. |
| SSE | `url` | Remote server, Server-Sent Events. |
| HTTP | `url` (http/https) | Remote server, standard HTTP. |

#### MCP management CLI

```bash
# Add an MCP server
claude mcp add <server-name> -- <command> <args...>

# List configured servers
claude mcp list

# Remove an MCP server
claude mcp remove <server-name>
```

## 3. Skills Integration

### Skill Installation and Management

Skills follow the **Agent Skills open standard** — `SKILL.md` files inside named directories.

```
# Workspace-scoped (project, version-controlled)
.claude/skills/
├── code-reviewer/
│   ├── SKILL.md
│   └── scripts/
│       └── eslint-check.sh
├── test-writer/
│   └── SKILL.md
└── api-designer/
    ├── SKILL.md
    └── references/
        └── openapi-spec.yaml

# User-scoped (personal, all projects)
~/.claude/skills/
├── security-auditor/
│   └── SKILL.md
└── commit-msg/
    └── SKILL.md

# Interop alias (cross-tool compatible path)
.agents/skills/     ← same as .claude/skills/
~/.agents/skills/   ← same as ~/.claude/skills/
```

#### SKILL.md format

```markdown
---
name: code-reviewer
description: >
  Reviews code changes for correctness, security, and style. Use when the user
  asks to "review" code, a PR, or wants feedback on an implementation.
---

# Code Review Skill

You are a senior software engineer specialized in code quality.

## Process
1. Read all changed files
2. Check for: correctness, edge cases, security issues, performance
3. Rate each finding: CRITICAL / HIGH / MEDIUM / LOW
4. Suggest specific fixes with code examples
```

### Skill Discovery and Registration

- Scans `~/.claude/skills/` + `.claude/skills/` at session start
- Injects metadata (name + description) into system prompt
- Context cost: ~195 chars base + ~97 chars per skill
- Skill body is loaded on-demand via progressive disclosure (only when needed)

### Extending Capabilities

- Skills are referenced by name in agent frontmatter via `skills:` field
- The agent pre-loads referenced skills at spawn time
- Skill directory is added to allowed file paths when activated
- The `.agents/skills/` interop alias allows cross-tool skill sharing

## 4. Provider-Specific Details

### Installation / Setup

```bash
# Install Claude Code (macOS/Linux)
curl -fsSL https://claude.ai/install.sh | bash

# Or via npm
npm install -g @anthropic-ai/claude-code

# Start a session
cd your-project/
claude
```

### Authentication Requirements

- Claude Code authenticates via Anthropic API key or OAuth
- API key can be set via `ANTHROPIC_API_KEY` environment variable
- OAuth flow available for enterprise/team setups
- MCP OAuth supports step-up auth and discovery caching

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | API key for Anthropic models |
| `ANTHROPIC_WORKSPACE_ID` | Scope token to specific workspace (workload identity federation) |
| `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` | Disable background task functionality |
| `CLAUDE_CODE_FILE_READ_MAX_OUTPUT_TOKENS` | Override default file read token limit |
| `CLAUDE_CODE_SIMPLE` | Strip down skills, session memory, custom agents, and token counting |
| `CLAUDE_CODE_SHELL_PREFIX` | Wrap shell commands with a prefix |
| `CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS` | Remove built-in commit/PR workflow instructions |
| `CLAUDE_CODE_MCP_SERVER_NAME` | Available to MCP `headersHelper` scripts |
| `CLAUDE_CODE_MCP_SERVER_URL` | Available to MCP `headersHelper` scripts |
| `CLAUDE_CODE_PLUGIN_PREFER_HTTPS` | Clone plugins over HTTPS instead of SSH |

### Limitations and Capabilities

- Sub-agents cannot spawn further sub-agents (single nesting depth)
- `permissionMode: bypassPermissions` should NOT be propagated to other tools
- MCP config changes require session restart
- `hooks` field in agents is Claude-specific and not portable
- Skill `scripts/` directories may behave differently across sandboxed tools

## 5. Examples

### Working Example: MCP Configuration

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"],
      "env": { "NODE_ENV": "production" }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
    }
  }
}
```

### Sample Agent Definition

```markdown
---
name: code-reviewer
description: >
  Reviews pull requests and code changes. Spawned when the user says
  "review", "check my code", or mentions a PR. Focus on correctness,
  security, and maintainability.
tools: Read, Grep, Glob, Bash
model: claude-sonnet-4-20250514
maxTurns: 15
skills:
  - code-reviewer
color: blue
---

You are a senior code reviewer. For every review:
1. Read all changed files.
2. Check for correctness, edge cases, security issues.
3. Rate findings as CRITICAL / HIGH / MEDIUM / LOW.
4. Provide actionable suggestions with code examples.

Never approve code with CRITICAL findings.
```

### Sample Skill Definition

```markdown
---
name: test-writer
description: >
  Writes comprehensive test suites. Activate when user asks to "write tests",
  "add test coverage", or "create unit tests".
---

# Test Writer Skill

## Process
1. Identify the target file(s) to test
2. Determine the appropriate testing framework (Jest, Vitest, Mocha, etc.)
3. Write tests covering: happy path, edge cases, error handling
4. Ensure assertions are specific and meaningful
5. Run the tests and fix any failures

## Rules
- Match existing project test conventions
- Aim for >80% branch coverage on new code
- Use descriptive test names that explain the expected behavior
```
