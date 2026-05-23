---
id: vscode
title: VS Code Configuration Guide
sidebar_label: VS Code
---

# VS Code Configuration Guide

This guide covers how to configure agents, MCPs, and skills for **VS Code** (with GitHub Copilot) when using WaslaGenie.

## 1. Agent Configuration

### Architecture

VS Code's AI capabilities are powered by **GitHub Copilot**. Agent behavior is configured through **custom instruction files** (`.github/copilot-instructions.md`), **granular instruction files** (`.github/instructions/*.instructions.md`), and the **Agent mode** in Copilot Chat. VS Code does not have discrete agent files — instead, it uses instruction files and chat participants.

### Custom Instructions

#### Repository-level instructions

```
# Repository-scoped custom instructions
.github/
├── copilot-instructions.md              ← project-wide AI instructions
└── instructions/
    ├── react-components.instructions.md  ← granular, file-scoped
    ├── testing.instructions.md           ← granular, file-scoped
    └── api-design.instructions.md        ← granular, file-scoped
```

#### `copilot-instructions.md` format

```markdown
# Copilot Instructions

## Persona
- Assume the role of a senior engineer with expertise in TypeScript and React.

## Coding Standards
- Use functional components and hooks
- Always include error handling for API calls
- Prefer `const` over `let`
- Use strict TypeScript — no `any`

## Testing
- Use Vitest for all unit tests
- Mock all external API dependencies
```

#### Granular instructions with `applyTo` frontmatter

Files in `.github/instructions/` support YAML frontmatter with the `applyTo` field for file-scoped targeting:

```markdown
---
applyTo: "**/*.test.ts"
---

# Testing Standards

- Always use Vitest for unit tests
- Mock all external API dependencies
- Write descriptive test names
- Aim for 80% branch coverage
```

| Field | Type | Notes |
|-------|------|-------|
| `applyTo` | `string` (glob) | File pattern — instruction applies only to matching files |

### Agent Mode

In Agent mode, Copilot acts as an autonomous assistant that can:
- Search the codebase
- Plan multi-step tasks
- Run terminal commands
- Edit multiple files
- Use MCP-provided tools

**Accessing Agent Mode:**
1. Open the Copilot Chat view in VS Code
2. Change the mode dropdown from "Ask" to **"Agent"**
3. Manage available tools via the **Tools** button in the chat interface

### Cross-Tool Context Files

VS Code's GitHub Copilot also reads these context files:
- `AGENTS.md` — cross-tool agent instructions
- `CLAUDE.md` — Claude Code compatibility
- `GEMINI.md` — Gemini CLI compatibility

### Configuration Locations

| Scope | Path | Notes |
|-------|------|-------|
| Project instructions | `.github/copilot-instructions.md` | Project-wide AI instructions |
| Granular instructions | `.github/instructions/*.instructions.md` | File-scoped with `applyTo` globs |
| Cross-tool context | `AGENTS.md` | Compatible with multiple tools |
| MCP config | `.vscode/mcp.json` | Workspace MCP servers |
| User settings | VS Code `settings.json` | User-level preferences |

## 2. MCP (Model Context Protocol) Setup

### MCP Server Configuration

MCP servers are configured in `.vscode/mcp.json` (workspace) or user profile settings.

```
# Workspace-scoped (committed to repo)
.vscode/mcp.json

# User-scoped (via VS Code settings.json, auto-migrated to profile mcp.json)
~/.config/Code/User/settings.json → mcp section

# Dev container
devcontainer.json → customizations.vscode.mcp
```

#### `.vscode/mcp.json` format

```json
{
  "servers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."],
      "env": {
        "NODE_ENV": "production"
      }
    },
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${env:GITHUB_TOKEN}"
      }
    },
    "remote-api": {
      "type": "http",
      "url": "https://mcp.example.com/api",
      "headers": {
        "Authorization": "Bearer ${env:API_KEY}"
      }
    }
  }
}
```

:::info
VS Code uses the `servers` key (not `mcpServers`) in `.vscode/mcp.json`. This differs from Claude Code and Cursor which use `mcpServers`.
:::

### MCP Integration with Agents

- In Agent mode, click the **Tools** icon to enable/disable specific MCP servers
- MCP servers are auto-started when a chat message is sent
- New or outdated servers are refreshed automatically
- Tools exposed by MCP servers are available by their registered name

### MCP Communication Protocols

| Transport | Config fields | Use case |
|-----------|-------------|----------|
| `stdio` (local) | `type: "stdio"`, `command`, `args`, `env`, `envFile`, `cwd` | Local subprocess |
| `http` (remote) | `type: "http"`, `url`, `headers` | Remote HTTP server |

Both types support a `dev` object for development mode:

```json
{
  "servers": {
    "my-server": {
      "type": "stdio",
      "command": "node",
      "args": ["server.js"],
      "dev": {
        "watch": ["src/**/*.ts"],
        "debug": { "type": "node" }
      }
    }
  }
}
```

### MCP Management

Multiple ways to set up MCP servers in VS Code:

| Method | Description |
|--------|-------------|
| **Command Palette** | `MCP: Add Server` — guided setup from npm, PyPI, or Docker |
| **Direct edit** | Modify `.vscode/mcp.json` manually |
| **MCP: List Servers** | View and manage all servers |
| **MCP Marketplace** | Built-in gallery (enable via `chat.mcp.gallery.enabled`) |
| **Dev Container** | `devcontainer.json` → `customizations.vscode.mcp` |

#### Environment variable references

Use VS Code input variables to avoid hardcoding secrets:

```json
{
  "servers": {
    "my-server": {
      "type": "stdio",
      "command": "npx",
      "args": ["my-mcp-server"],
      "env": {
        "API_KEY": "${env:API_KEY}"
      }
    }
  }
}
```

## 3. Skills Integration

### Instruction-Based Skills

VS Code does not have a `SKILL.md` skill system. Instead, it uses:

1. **`copilot-instructions.md`** — project-wide AI instructions
2. **Granular `.instructions.md` files** — file-scoped with `applyTo` globs
3. **`AGENTS.md`** — cross-tool context file
4. **Chat participants** — extension-contributed entities that handle chat requests

### Skill Discovery and Registration

For WaslaGenie synchronization, skills from other tools map to VS Code as:

| Source | Target in VS Code |
|--------|-------------------|
| Claude `SKILL.md` | `.github/instructions/<name>.instructions.md` with `applyTo` |
| Gemini skill | `.github/instructions/<name>.instructions.md` |
| Context instructions | `.github/copilot-instructions.md` (append) |

### Extending Capabilities

- GitHub Copilot Extensions provide additional chat participants
- MCP servers extend tool capabilities in Agent mode
- Custom instructions guide AI behavior without code changes
- VS Code extensions can contribute chat participants for specialized domains

## 4. Provider-Specific Details

### Installation / Setup

1. Install [Visual Studio Code](https://code.visualstudio.com/)
2. Install the **GitHub Copilot** extension from the marketplace
3. Sign in with your GitHub account
4. Enable Agent mode in Copilot Chat settings

#### Enabling custom instructions

Ensure this setting is enabled in VS Code settings:

```json
{
  "github.copilot.chat.codeGeneration.useInstructionFiles": true
}
```

### Authentication Requirements

- GitHub account with Copilot subscription (Individual, Business, or Enterprise)
- Authentication handled through VS Code's GitHub sign-in flow
- MCP servers may require separate API keys (set via `env` field)

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `GITHUB_TOKEN` | GitHub API access for MCP servers |
| `${env:VAR_NAME}` | Reference env vars in `.vscode/mcp.json` |
| MCP `env` fields | Per-server environment variables |

### Limitations and Capabilities

- No native `SKILL.md` support — uses instruction files instead
- MCP config uses `servers` key (not `mcpServers`)
- No sub-agent spawning — Agent mode runs in single chat session
- Instruction files require `useInstructionFiles` setting to be enabled
- `applyTo` glob patterns in instruction files enable file-scoped rules

## 5. Examples

### Working Example: MCP Configuration

```json
{
  "servers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."],
      "env": {}
    },
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${env:GITHUB_TOKEN}"
      }
    }
  }
}
```

### Sample Custom Instructions — `.github/copilot-instructions.md`

```markdown
# Project Standards

## Stack
- TypeScript monorepo, Node 22, Vitest, pnpm

## Coding Conventions
- Use strict TypeScript (no `any`)
- Write JSDoc for all exported functions
- Use functional patterns — avoid classes
- Error handling: use typed Result patterns

## Testing
- Use Vitest for all tests
- Test behavior, not implementation
- Aim for 80% branch coverage on new code
```

### Sample Granular Instruction — `.github/instructions/testing.instructions.md`

```markdown
---
applyTo: "**/*.test.ts"
---

# Testing Standards

- Use Vitest with `describe`/`it` blocks
- Mock all external dependencies
- Write descriptive test names explaining expected behavior
- Include edge cases and error paths
- Use `beforeEach` for common setup
```
