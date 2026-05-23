---
id: openclaw
title: OpenClaw Configuration Guide
sidebar_label: OpenClaw
---

# OpenClaw Configuration Guide

This guide covers how to configure agents, MCPs, and skills for **OpenClaw** when using WaslaGenie.

## 1. Agent Configuration

### Architecture

OpenClaw uses a **workspace file model**. Agent personas, routing rules, memory locations, and skill assignments are all defined inside workspace Markdown files (`AGENTS.md`, `SOUL.md`, `MEMORY.md`, etc.) within the agent workspace directory, which defaults to `~/.openclaw/workspace/`.

### Creating and Configuring Agents

#### Directory layout

```
# Agent workspace (default location)
~/.openclaw/workspace/
├── AGENTS.md        ← agent definitions + routing table
├── SOUL.md          ← personality, tone, preferences
├── MEMORY.md        ← long-term memory (auto-updated)
├── USER.md          ← personal context about the user
├── TOOLS.md         ← environment-specific details (API endpoints, devices)
├── IDENTITY.md      ← agent name, role, avatar/emoji
└── HEARTBEAT.md     ← proactive task scheduler

# Multi-agent setup (each agent has its own workspace)
~/.openclaw/workspaces/
├── writer/
│   ├── AGENTS.md
│   └── skills/
├── researcher/
│   ├── AGENTS.md
│   └── skills/
└── coder/
    ├── AGENTS.md
    └── skills/

# Config and state
~/.openclaw/
├── openclaw.json    ← main config (MCP, skills, agents)
├── skills/          ← managed/global skills
└── tools/           ← skill-installed binaries
```

#### Workspace files reference

| File | Purpose | Syncable? |
|------|---------|-----------|
| `AGENTS.md` | Agent definitions + routing table | ✅ |
| `SOUL.md` | Personality, tone, communication style, values | ❌ (origin-only) |
| `MEMORY.md` | Long-term memory (auto-updated by engine) | ❌ (origin-only) |
| `USER.md` | Personal context about the user | ❌ (origin-only) |
| `TOOLS.md` | Environment-specific details (API endpoints, devices) | ❌ (origin-only) |
| `IDENTITY.md` | Agent name, role, avatar/emoji | ❌ (origin-only) |
| `HEARTBEAT.md` | Proactive task scheduler | ❌ (origin-only) |

#### `AGENTS.md` anatomy

```markdown
# Agent Routing

## Task routing table

| Task type        | Context files to load     | Skills to activate        | Skip                  |
|------------------|---------------------------|---------------------------|-----------------------|
| writing          | writing-room.md           | humanizer, fact-checker   | code-context.md       |
| code-review      | code-standards.md         | code-reviewer, linter     | writing-room.md       |
| research         | —                         | web-search, citation      | —                     |
| deployment       | devops-context.md         | github-actions            | writing-room.md       |

## Agent definitions

### writer
Specialist for long-form content. Load for: blog posts, documentation,
READMEs, release notes. Skills: humanizer, fact-checker.
Do not use for code tasks.

### coder
Specialist for implementation. Load for: feature development, bug fixing,
refactoring. Skills: code-reviewer, test-writer, linter.
Access to: filesystem MCP, github MCP.
```

#### Multi-agent config in `openclaw.json`

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
      sandbox: {
        enabled: true
      }
    },
    list: [
      { id: "writer", skills: ["humanizer", "fact-checker"] },
      { id: "coder", skills: ["code-reviewer", "linter", "test-writer"] },
      { id: "researcher" }  // inherits defaults
    ]
  }
}
```

### Agent Lifecycle and Activation

```
Session start
│
├─ Reads ~/.openclaw/openclaw.json → builds agent list
├─ Loads AGENTS.md from active workspace
├─ Snapshots eligible skills per agent (from allowlist)
│
User message
│
├─ Channel routing → determines which agent receives message
├─ Agent loads its context: SOUL.md, MEMORY.md, assigned skills
├─ Agent runs in agentic loop (gather → act → verify → repeat)
│
Skills fire mid-session (hot reload if watcher is on)
│
Session end
├─ MEMORY.md updated (if memory engine active)
└─ Skill snapshot invalidated → rebuilt on next session
```

### Interacting with Skills and MCPs

- Per-agent skill allowlists control which skills each agent can access
- An agent with a non-empty `skills` array **replaces** the defaults entirely (no merge)
- Per-agent MCP scoping is done via `agents.list[].mcpServers`
- Skills fire mid-session with hot reload support

### Configuration Locations

| Scope | Path | Notes |
|-------|------|-------|
| Main config | `~/.openclaw/openclaw.json` | MCP, agents, skills, settings |
| Agent workspace | `~/.openclaw/workspace/` | Default workspace |
| Multi-agent workspaces | `~/.openclaw/workspaces/` | Per-agent workspace dirs |
| Managed skills | `~/.openclaw/skills/` | Global skill library |
| Context file | `AGENTS.md` | Agent definitions + routing |

## 2. MCP (Model Context Protocol) Setup

### MCP Server Configuration

MCP config lives exclusively in `~/.openclaw/openclaw.json` under the `mcp.servers` key (note: nested under `mcp`, not top-level).

```json5
{
  mcp: {
    servers: {
      filesystem: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/Documents"],
        description: "Access to Documents folder"
      },
      github: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-github"],
        env: {
          GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_..."
        }
      },
      postgres: {
        url: "https://mcp.example.com/postgres/sse",
        description: "Production read-only DB"
      }
    }
  }
}
```

:::warning
There is **no workspace-scoped MCP config file** in OpenClaw. Workspace isolation is handled via `agents.list`, not separate files.
:::

### MCP Integration with Agents

Per-agent MCP scoping restricts which servers each agent can access:

```json5
{
  agents: {
    list: [
      {
        id: "coder",
        mcpServers: ["filesystem", "github"]
        // Only these two MCP servers are available to the coder agent
      },
      {
        id: "researcher"
        // Inherits no default MCP — uses web-search skill instead
      }
    ]
  }
}
```

### MCP Communication Protocols

| Transport | Config key | Use case |
|-----------|-----------|----------|
| stdio | `command` + `args` | Local subprocess |
| SSE | `url` | Remote server, Server-Sent Events |

#### MCP via `mcp-bridge` skill

OpenClaw also exposes an alternative path: the `mcp-bridge` skill (installed from ClawHub) wraps MCP discovery and tool routing inside a skill, enabling MCP-like behavior without direct `openclaw.json` config.

```bash
openclaw skills install mcp-bridge
```

This enables dynamic tool discovery without a restart, separate from native `mcp.servers` config.

#### Key structural differences

| Aspect | Claude Code | Gemini CLI | OpenClaw |
|--------|-------------|------------|----------|
| Config key path | `mcpServers` | `mcpServers` | `mcp.servers` |
| Config file | `.mcp.json` or `settings.json` | `.gemini/settings.json` | `openclaw.json` |
| Workspace vs user | Two separate files | Two separate files | Single file (user-scoped only) |
| Per-agent MCP | Via agent frontmatter | Via skill config | Via `agents.list[].mcpServers` |
| MCP install helper | `claude mcp add` | `gemini mcp add` | `openclaw mcp install <slug>` |

## 3. Skills Integration

### Skill Installation and Management

```bash
# Install from ClawHub registry
openclaw skills install code-reviewer

# Update all installed skills
openclaw skills update --all

# List installed skills
openclaw skills list

# Remove a skill
openclaw skills remove code-reviewer
```

### Skill Discovery and Registration

#### Directory layout and precedence (highest → lowest)

```
# 1. Workspace skills (HIGHEST precedence)
<workspace>/skills/

# 2. Project agent skills
<workspace>/.agents/skills/

# 3. Personal agent alias
~/.agents/skills/

# 4. Managed/local
~/.openclaw/skills/

# 5. Bundled (shipped with OpenClaw)

# 6. Extra dirs (config-defined, LOWEST precedence)
# skills.load.extraDirs in openclaw.json
```

#### Extended SKILL.md frontmatter (OpenClaw-specific)

OpenClaw supports additional frontmatter keys beyond the base standard:

```markdown
---
name: image-lab
description: >
  Generate or edit images via provider-backed workflow. Use when the user
  asks to create, generate, or modify an image.
homepage: https://clawhub.ai/skills/image-lab
user-invocable: true
disable-model-invocation: false
command-dispatch: tool
command-tool: image_generate
metadata: {"openclaw":{"emoji":"🎨","requires":{"bins":["uv"],"env":["GEMINI_API_KEY"],"config":["browser.enabled"]},"primaryEnv":"GEMINI_API_KEY"}}
---
```

| Field | Default | Notes |
|-------|---------|-------|
| `homepage` | — | URL shown in macOS Skills UI |
| `user-invocable` | `true` | Exposes skill as user slash command |
| `disable-model-invocation` | `false` | `true` = available via slash but not model-triggered |
| `command-dispatch` | — | `tool` = bypass model, dispatch directly to tool |
| `command-tool` | — | Tool name for direct dispatch |
| `metadata` | — | **Single-line JSON object** — gates, installer specs, emoji |

#### Gating (`metadata.openclaw.requires`)

| Gate | What it checks |
|------|---------------|
| `bins` | Binary exists on `PATH` (host) |
| `anyBins` | At least one binary exists |
| `env` | Env var is set |
| `config` | Key in `openclaw.json` is truthy |

Skills that fail their gates are **silently excluded** from the session prompt.

### Extending Capabilities

- Per-agent skill allowlists in `openclaw.json` — agent with non-empty `skills` array replaces defaults entirely
- Skill watcher supports hot reload mid-session
- Each eligible skill adds ~195 base chars + ~97 chars per skill + name/description length
- `mcp-bridge` skill enables dynamic tool discovery without restart

#### Skill watcher (hot reload)

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
      extraDirs: ["~/Projects/shared-skills"],
      allowSymlinkTargets: ["~/Projects/shared-skills"]
    }
  }
}
```

## 4. Provider-Specific Details

### Installation / Setup

```bash
# Install OpenClaw via npm
npm install -g openclaw@latest

# Run guided onboarding
openclaw onboard
```

The onboarding wizard sets up the gateway, messaging channels, and workspace.

### Authentication Requirements

- OpenClaw connects to various AI model providers (Anthropic, OpenAI, Google, etc.)
- Authentication is per-provider via API keys
- Model routing supports primary + fallback chains across providers

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Anthropic model access |
| `OPENAI_API_KEY` | OpenAI model access |
| `GEMINI_API_KEY` | Google Gemini model access |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | GitHub MCP server access |

### Limitations and Capabilities

- `SOUL.md`, `MEMORY.md`, `USER.md` are **not syncable** — these are origin-only
- `metadata.openclaw` block must be single-line JSON (multi-line is not supported)
- Agent allowlists do **not** merge with defaults — write the complete final list
- Skill watcher invalidates snapshot mid-session — trigger re-scan after writing stubs
- `~/.openclaw/skills/` is user-scoped only (no `.openclaw/skills/` workspace path)
- Sandboxing (Docker) is recommended for untrusted sessions

## 5. Examples

### Working Example: `openclaw.json`

```json5
{
  mcp: {
    servers: {
      filesystem: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/Documents"],
        description: "Access to Documents folder"
      },
      github: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-github"],
        env: {
          GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_..."
        }
      }
    }
  },
  agents: {
    defaults: {
      skills: ["github", "web-search"],
      sandbox: { enabled: true }
    },
    list: [
      { id: "writer", skills: ["humanizer", "fact-checker"] },
      { id: "coder", skills: ["code-reviewer", "linter"], mcpServers: ["filesystem", "github"] },
      { id: "researcher" }
    ]
  },
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250
    }
  }
}
```

### Sample AGENTS.md

```markdown
# Agent Routing

## Task routing table

| Task type   | Context files to load | Skills to activate      | Skip             |
|-------------|----------------------|-------------------------|------------------|
| writing     | writing-room.md      | humanizer, fact-checker | code-context.md  |
| code-review | code-standards.md    | code-reviewer, linter   | writing-room.md  |
| research    | —                    | web-search, citation    | —                |

## Agent definitions

### writer
Specialist for long-form content. Load for: blog posts, documentation,
READMEs, release notes. Skills: humanizer, fact-checker.

### coder
Specialist for implementation. Load for: feature development, bug fixing,
refactoring. Skills: code-reviewer, test-writer.
Access to: filesystem MCP, github MCP.
```
