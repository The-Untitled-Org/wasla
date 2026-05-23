---
id: gemini
title: Gemini CLI Configuration Guide
sidebar_label: Gemini CLI
---

# Gemini CLI Configuration Guide

This guide covers how to configure agents, MCPs, and skills for **Gemini CLI** when using WaslaGenie.

## 1. Agent Configuration

### Architecture Difference

Gemini CLI does **not** use discrete per-agent Markdown files for spawning sub-agents the way Claude Code does. Agent context is delivered through **context files** (`GEMINI.md`) and **skills**. Sub-agent spawning is not a native primitive — parallel specialization is achieved via skills and session routing.

Gemini CLI supports **remote sub-agents** via Markdown definitions with YAML frontmatter:

```
# Project-scoped remote agents
.gemini/agents/
└── remote-researcher.md

# User-scoped remote agents
~/.gemini/agents/
└── remote-assistant.md
```

#### Remote agent file anatomy

```markdown
---
kind: remote
name: my-remote-agent
agent_card_url: https://example.com/.well-known/agent.json
---
```

Remote agents require the `kind: remote` frontmatter field and either `agent_card_url` or `agent_card_json` for A2A (Agent-to-Agent) protocol connections.

### Context File — `GEMINI.md`

`GEMINI.md` is the primary "agent instruction" surface in Gemini CLI. It is loaded unconditionally at session start, unlike skills (which are on-demand).

```markdown
# Project Context

## Stack
- TypeScript monorepo, Node 22, Vitest, Turborepo

## Behaviour
- Always confirm destructive operations before executing
- Use the filesystem MCP tool for all file writes
- When asked to review, trigger the `code-reviewer` skill

## Agent Routing
- Research tasks → use web-search skill
- DB tasks → use the postgres MCP tool
- Deployment → use the github-actions skill
```

### Agent Lifecycle and Activation

```
Session start
│
├─ Loads GEMINI.md (workspace root, then user home)
├─ Loads all skill metadata (name + description)
│   from ~/.gemini/skills/, .gemini/skills/, .agents/skills/
│
User message
│
├─ Gemini matches intent to a skill or built-in tool
├─ If skill matches → calls activate_skill tool
│   └─ User sees consent prompt (name, purpose, path)
│   └─ Skill body + folder injected into conversation history
│   └─ Skill directory added to allowed file paths
│
├─ Tools execute inline (no separate context window spawned)
│   └─ No native sub-agent isolation — all runs in same session
│
Session end → no persistent sub-context state
```

### Interacting with Skills and MCPs

- Agent identity lives in **skills + GEMINI.md** (no discrete agent files for local agents)
- Skills are activated by the `activate_skill` tool after intent matching
- All MCP tools are prefixed with `mcp_<serverAlias>_` (e.g., `mcp_github_create_issue`)
- Tools execute inline within the current session (no isolation)

### Configuration Locations

| Scope | Path | Notes |
|-------|------|-------|
| Workspace settings | `.gemini/settings.json` | MCP + model config |
| User settings | `~/.gemini/settings.json` | Global MCP + preferences |
| Context file (workspace) | `GEMINI.md` | Loaded at session start |
| Context file (user) | `~/.gemini/GEMINI.md` | User-level context |
| Workspace skills | `.gemini/skills/` | Requires workspace trust |
| User skills | `~/.gemini/skills/` | Always trusted |
| Interop skills | `.agents/skills/` | Cross-tool alias (highest precedence) |

## 2. MCP (Model Context Protocol) Setup

### MCP Server Configuration

MCP servers are configured in `.gemini/settings.json` (workspace) or `~/.gemini/settings.json` (user) under the `mcpServers` key.

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user"],
      "env": {
        "NODE_ENV": "production"
      }
    },
    "remote-exa": {
      "url": "https://mcp.exa.ai/mcp",
      "httpUrl": "https://mcp.exa.ai/mcp"
    }
  },
  "theme": "Default",
  "selectedAuthType": "oauth-personal"
}
```

**Precedence:** admin-managed > workspace > user

### MCP Integration with Agents

- All MCP tools are **prefixed** with `mcp_<serverAlias>_` (e.g., `mcp_github_create_issue`)
- This differs from Claude Code where tools use their raw registered names
- WaslaGenie must handle this prefix when syncing skill bodies that reference tool names
- MCP servers can have a `trust: true` property to bypass tool call confirmations

### MCP Communication Protocols

| Transport | Config key | Precedence |
|-----------|-----------|------------|
| HTTP | `httpUrl` | Highest |
| SSE | `url` | Middle |
| stdio | `command` | Lowest |

When multiple transport keys are set, `httpUrl` wins, then `url`, then `command`.

#### Admin controls

```json
{
  "mcpServers": { },
  "enableMcpServers": true,
  "adminMcpServers": {
    "required-logging": {
      "command": "npx",
      "args": ["-y", "@corp/logging-mcp"]
    }
  }
}
```

- `enableMcpServers: false` — disables all MCP for the session
- `adminMcpServers` — servers always injected regardless of user config

#### MCP management commands

```bash
# Add an MCP server
gemini mcp add <server-name>

# Remove an MCP server
gemini mcp remove <server-name>

# List configured servers
gemini mcp list

# In-session management
/mcp add <server>
```

## 3. Skills Integration

### Skill Installation and Management

Skills follow the **Agent Skills open standard** with `SKILL.md` files inside named directories.

```bash
# Install from Git repo
gemini skills install https://github.com/org/my-skill --scope workspace

# Install from local path
gemini skills install ./local-skill --scope user

# Link for local development
gemini skills link <path>

# List installed skills
gemini skills list

# Uninstall
gemini skills uninstall my-skill --scope workspace

# In-session commands
/skills           # List active skills
/skills reload    # Reload skills mid-session
```

### Skill Discovery and Registration

#### Directory layout and precedence (highest → lowest)

```
# 1. Workspace alias (HIGHEST precedence)
.agents/skills/

# 2. Workspace-scoped (requires trust)
.gemini/skills/

# 3. User-scoped alias
~/.agents/skills/

# 4. User-scoped
~/.gemini/skills/

# 5. Extension skills (installed extensions)

# 6. Built-in (shipped with Gemini CLI, LOWEST precedence)
```

#### Trust requirements

- **Workspace skills** (`.gemini/skills/` and `.agents/skills/`) require the workspace to be **trusted**
- Run `/trust` in a Gemini CLI session and restart to enable workspace skills
- **User skills** (`~/.gemini/skills/`) are always trusted — no trust step needed

#### Skill lifecycle

```
Session start
│
├─ Scans all discovery tiers (built-in → extension → user → workspace)
├─ Injects skill name + description metadata into system prompt
├─ Workspace-scoped skills require trust check
│
User message
│
├─ Gemini matches intent → calls activate_skill tool
│   └─ User sees consent prompt: name, purpose, directory path
│   └─ Skill body + folder structure injected into conversation history
│   └─ Skill directory added to allowed file paths
│
Skill active for remainder of session (not cleared per turn)
│
Session end → skill context cleared
```

### Extending Capabilities

- Skills augment the model's system prompt with specialized knowledge
- Activated skills persist for the remainder of the session
- Skill directories are added to allowed file paths for read/write access
- Extension integrations (GitHub, Figma, Google Workspace, Exa) are installed as MCP-backed integrations

## 4. Provider-Specific Details

### Installation / Setup

```bash
# Install Gemini CLI via npm
npm install -g @anthropic-ai/gemini-cli

# Or run directly
npx @anthropic-ai/gemini-cli

# Start a session
cd your-project/
gemini
```

### Authentication Requirements

Gemini CLI supports several authentication methods:

| Method | Description |
|--------|-------------|
| **OAuth (Personal)** | Default. Browser-based OAuth sign-in with Google account. |
| **API Key** | Set `GEMINI_API_KEY` environment variable. |
| **Google ADC** | Google Application Default Credentials for enterprise. |
| **OAuth + PKCE** | For remote A2A agents — OAuth 2.0 Authorization Code flow. |

For remote agents, auth types include `apiKey`, `http` (Bearer/Basic), `google-credentials`, and `oauth`.
Dynamic values can be resolved from environment variables (`$ENV_VAR`) or shell commands (`!command`).

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | API key for Gemini models |
| `GEMINI_MODEL` | Specify default model |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | GitHub MCP server authentication |
| `.env` file | Auto-loaded from cwd, parent dirs, and `~/.env` |

Environment variables can be referenced within `settings.json` using `$VAR_NAME` or `${VAR_NAME}` syntax.

### Limitations and Capabilities

- No native sub-agent isolation — all tools run in the same session context
- There are **no discrete agent files** for local agents — agent identity lives in skills + GEMINI.md
- MCP tool names are always prefixed with `mcp_<alias>_` — differs from other tools
- Workspace skills require explicit `/trust` to activate
- `permissionMode: bypassPermissions` has no Gemini equivalent
- No `hooks` equivalent exists

## 5. Examples

### Working Example: MCP Configuration

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user"],
      "env": { "NODE_ENV": "production" }
    }
  }
}
```

### Sample Skill Definition

```markdown
---
name: code-reviewer
description: >
  Reviews code changes for correctness, security, and style. Activate when the
  user asks to "review" code, a PR, or wants feedback on implementation quality.
---

# Code Review Skill

You are a senior software engineer specialized in code quality.

## When this skill activates
- User says "review", "check", "audit", or "look over" code
- A pull request is mentioned

## Process
1. Read all changed files
2. Check for: correctness, edge cases, security issues, performance
3. Rate each finding: CRITICAL / HIGH / MEDIUM / LOW
4. Suggest specific fixes with code examples

## Rules
- Never approve code with CRITICAL findings
- Always provide actionable feedback, not just observations
- When referencing MCP tools, use the `mcp_<alias>_<tool>` naming format
```

### Sample GEMINI.md Context File

```markdown
# Project Context

## Stack
- TypeScript, Node 22, Vitest, pnpm

## Coding Standards
- Use strict TypeScript (no `any`)
- Write JSDoc for all exported functions
- Use Vitest for testing

## Agent Routing
- Code review → activate `code-reviewer` skill
- Research → activate `web-search` skill
- Testing → activate `test-writer` skill
```
