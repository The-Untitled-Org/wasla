---
id: cursor
title: Cursor Configuration Guide
sidebar_label: Cursor
---

# Cursor Configuration Guide

This guide covers how to configure agents, MCPs, and skills for **Cursor** when using WaslaGenie.

## 1. Agent Configuration

### Architecture

Cursor uses a **rules-based system** for agent configuration. Instead of discrete agent files, Cursor uses `.mdc` (Markdown Cursor) rule files placed in the `.cursor/rules/` directory. These files use YAML frontmatter to control when and how instructions are loaded into the AI context.

### Creating and Configuring Rules (Agent Instructions)

#### Directory layout

```
# Project-scoped rules (committed to repo)
.cursor/
└── rules/
    ├── project-context.mdc        ← always loaded
    ├── react-components.mdc       ← auto-attached for React files
    ├── api-standards.mdc          ← agent-requested when relevant
    └── testing/
        └── vitest-patterns.mdc    ← can be nested in subdirectories

# Legacy (still supported, not recommended)
.cursorrules                       ← single monolithic file
```

#### `.mdc` file anatomy

```markdown
---
description: A summary of when this rule should be used by the AI.
globs: ["src/components/**/*.tsx", "src/utils/*.ts"]
alwaysApply: false
---

# React Component Standards

## Rules
- Use functional components with hooks
- Always include error boundaries for async components
- Use `React.memo()` for expensive renders
- Name files in PascalCase matching the component name
```

#### Frontmatter field reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `description` | `string` | ❌ | Plain-language summary. AI uses this to decide if the rule is relevant. |
| `globs` | `string[]` | ❌ | File path patterns. Rule auto-attaches when matching files are in context. |
| `alwaysApply` | `boolean` | ❌ | `true` = loaded in every conversation. Use sparingly (token cost). |

#### Rule activation modes

| Mode | Trigger | Use case |
|------|---------|----------|
| **Always Apply** | `alwaysApply: true` | Universal project context. Loaded in every request. |
| **Auto-Attached** | `globs` match | Automatically loads when working on matching files. |
| **Agent-Requested** | `description` match | AI evaluates description and pulls in rule if relevant. |
| **Manual** | User types `@rule-name` | Explicitly invoked by user in chat. |

### Alternative: `AGENTS.md`

Cursor also supports `AGENTS.md` files placed in the project root or subdirectories. This is a simpler alternative that does not support glob scoping or metadata, but provides cross-tool compatibility:

```markdown
# AGENTS.md

## Coding Standards
- Use TypeScript strict mode
- Write JSDoc for all exported functions
- Follow the existing project patterns

## Testing
- Use Vitest for all tests
- Aim for 80% branch coverage
```

### Agent Modes

Cursor supports three interaction modes:

| Mode | Description |
|------|-------------|
| **Agent** | Autonomous multi-step execution. Can edit files, run commands, use tools. |
| **Ask** | Conversational Q&A mode. Does not modify files. |
| **Edit** | Focused code editing within selected files. |

### Configuration Locations

| Scope | Path | Notes |
|-------|------|-------|
| Project rules | `.cursor/rules/*.mdc` | Committed to repo, supports globs |
| Legacy rules | `.cursorrules` | Single file, still supported |
| Cross-tool context | `AGENTS.md` | Simpler alternative, no metadata |

## 2. MCP (Model Context Protocol) Setup

### MCP Server Configuration

MCP servers are configured in `mcp.json` files using the `mcpServers` key.

```
# Project-scoped (committed to repo)
.cursor/mcp.json

# User-scoped (global, all projects)
~/.cursor/mcp.json
```

#### `.cursor/mcp.json` format

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."],
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
    "remote-api": {
      "url": "https://mcp.example.com/sse",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

### MCP Integration with Agents

- In **Agent mode** and **Composer**, Cursor auto-scans enabled MCP servers and exposes their tools
- The AI agent dynamically decides when to use MCP tools based on the user's request
- You can explicitly prompt the agent to use a specific tool by name
- By default, the agent asks for approval before executing an MCP tool
- **Auto-run mode** can be enabled in settings for automatic execution without confirmation

### MCP Communication Protocols

| Transport | Config fields | Use case |
|-----------|-------------|----------|
| stdio | `command` + `args` | Local subprocess (most common) |
| SSE | `url` | Remote server, Server-Sent Events |

### MCP Management

- Manage and toggle specific tools via **Cursor Settings > Features > MCP** (or **Tools & MCP**)
- Restart Cursor after manual changes to `mcp.json` to reload configuration
- Validate JSON syntax carefully — missing commas/brackets will cause config failures

## 3. Skills Integration

### Rules as Skills

Cursor does not have a dedicated `SKILL.md` skill system. The `.mdc` rules system serves a similar purpose:

- **`.cursor/rules/*.mdc`** files act as context-aware skill definitions
- Glob-scoped rules auto-activate based on file context
- Description-matched rules are pulled in by the AI when relevant
- `AGENTS.md` provides a simpler cross-tool alternative

### Skill Discovery and Registration

For WaslaGenie synchronization, skills from other tools can be mapped to Cursor rules:

| Source | Target in Cursor |
|--------|-----------------|
| Claude `SKILL.md` | `.cursor/rules/<name>.mdc` with description from skill |
| Gemini skill | `.cursor/rules/<name>.mdc` |
| OpenClaw skill | `.cursor/rules/<name>.mdc` |

### Extending Capabilities

- Rules can be organized into subdirectories for cleaner management
- Cursor reads rule directories recursively
- Commit `.cursor/rules/` to version control for team sharing
- Use `alwaysApply: true` sparingly to avoid "token tax" on context window

## 4. Provider-Specific Details

### Installation / Setup

1. Download Cursor from [cursor.com](https://cursor.com)
2. Install the application
3. Sign in with your Cursor account
4. Open a project folder

### Authentication Requirements

- Cursor Pro/Business subscription for full AI features
- Built-in authentication via Cursor account
- No separate API key needed for default AI functionality
- MCP servers may require their own authentication (set in `env` field)

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `CURSOR_DEBUG_MCP` | Enable debug logging for MCP client |
| MCP `env` fields | Per-server environment variables (API keys, tokens) |

### Limitations and Capabilities

- No native `SKILL.md` support — uses `.mdc` rules instead
- No sub-agent spawning — all runs in single AI session
- No `permissionMode` equivalent — uses auto-run toggle instead
- `.cursorrules` is legacy — prefer `.cursor/rules/*.mdc` for new projects
- Restart required after `mcp.json` changes

## 5. Examples

### Working Example: MCP Configuration

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."],
      "env": {}
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

### Sample Rule Definition — `.cursor/rules/react-components.mdc`

```markdown
---
description: Standards for React component development. Use when creating or modifying React components.
globs: ["src/components/**/*.tsx", "src/components/**/*.ts"]
alwaysApply: false
---

# React Component Standards

## Structure
- Use functional components with hooks
- One component per file
- Name files in PascalCase matching the component name

## State Management
- Use React hooks for local state
- Use context for shared state across component trees
- Avoid prop drilling deeper than 2 levels

## Testing
- Write a test file alongside every component
- Test user interactions, not implementation details
- Use React Testing Library
```

### Sample Always-On Rule — `.cursor/rules/project-context.mdc`

```markdown
---
description: Core project context and coding standards.
alwaysApply: true
---

# Project Context

## Stack
- TypeScript monorepo, Node 22, Vitest, pnpm

## Conventions
- Strict TypeScript (no `any`)
- JSDoc on all exports
- Functional patterns preferred
- Error handling: always use typed errors
```
