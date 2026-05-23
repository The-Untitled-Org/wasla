---
id: github-copilot
title: GitHub Copilot Configuration Guide
sidebar_label: GitHub Copilot
---

# GitHub Copilot Configuration Guide

This guide covers how to configure agents, MCPs, and skills for **GitHub Copilot** (across IDEs) when using WaslaGenie.

## 1. Agent Configuration

### Architecture

GitHub Copilot's agent behavior is configured primarily through **custom instruction files** and **Agent mode** in supported editors (VS Code, JetBrains, Neovim). Copilot does not use discrete agent files — instead, it relies on instruction files, MCP tools, and chat extensions to shape AI behavior.

### Custom Instructions

#### Repository-level instructions

```
.github/
├── copilot-instructions.md              ← project-wide Copilot instructions
└── instructions/
    ├── react-components.instructions.md  ← file-scoped rules
    ├── api-standards.instructions.md     ← file-scoped rules
    └── testing.instructions.md           ← file-scoped rules
```

#### `copilot-instructions.md` format

```markdown
# Copilot Instructions

## Persona
- Act as a senior full-stack engineer with expertise in TypeScript and React.

## Coding Standards
- Use functional components with hooks
- Always include proper error handling
- Prefer immutable data patterns
- Use strict TypeScript — no `any`

## Architecture
- Follow the existing project structure
- Use the service layer for business logic
- Keep components focused and composable
```

This file is automatically loaded for every Copilot Chat interaction in the repository when `github.copilot.chat.codeGeneration.useInstructionFiles` is enabled.

#### Granular instructions with `applyTo`

Files in `.github/instructions/` support YAML frontmatter for file-pattern targeting:

```markdown
---
applyTo: "src/api/**/*.ts"
---

# API Design Standards

- Use Express-style route handlers
- Validate all request bodies with Zod schemas
- Return consistent error response shapes
- Include rate limiting headers
```

### Agent Mode

Agent mode transforms Copilot into an autonomous assistant capable of:
- Planning multi-step tasks
- Searching the entire codebase
- Running terminal commands
- Editing multiple files simultaneously
- Using MCP-connected tools

**Available in:** VS Code, JetBrains IDEs (with Copilot plugin), GitHub.com (Copilot Workspace)

### Copilot Coding Agent (GitHub.com)

The **Copilot Coding Agent** operates directly on GitHub, triggered by assigning a Copilot to an issue. It creates a pull request with proposed changes, runs tests, and iterates on feedback. This is configured through the same `.github/copilot-instructions.md` file.

### Configuration Locations

| Scope | Path | Notes |
|-------|------|-------|
| Project instructions | `.github/copilot-instructions.md` | Loaded for all chat interactions |
| Granular instructions | `.github/instructions/*.instructions.md` | File-scoped with `applyTo` globs |
| Cross-tool context | `AGENTS.md` | Supported in Agent mode |
| MCP config (VS Code) | `.vscode/mcp.json` | VS Code workspace MCP servers |
| MCP config (JetBrains) | IDE settings | JetBrains MCP configuration |

## 2. MCP (Model Context Protocol) Setup

### MCP Server Configuration

MCP configuration varies by IDE. In VS Code, MCP servers are configured in `.vscode/mcp.json`:

```json
{
  "servers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${env:GITHUB_TOKEN}"
      }
    },
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."],
      "env": {}
    }
  }
}
```

:::info
GitHub Copilot has transitioned away from App-based Copilot Extensions in favor of the open MCP standard. MCP is now the primary way to connect Copilot to external tools and services.
:::

### MCP Integration with Agents

- In Agent mode, enable MCP tools via the **Tools** button in the chat interface
- Tools from MCP servers are available by their registered name
- The agent autonomously decides when to use MCP tools based on the task
- The built-in `#githubRepo` tool provides native GitHub access

### MCP Communication Protocols

| Transport | Config fields | Use case |
|-----------|-------------|----------|
| `stdio` (local) | `type: "stdio"`, `command`, `args`, `env` | Local subprocess |
| `http` (remote) | `type: "http"`, `url`, `headers` | Remote HTTP server |

### Built-in Tools

GitHub Copilot includes several built-in tools that don't require MCP configuration:

| Tool | Description |
|------|-------------|
| `#githubRepo` | Access GitHub repository data |
| `#file` | Reference specific files |
| `#selection` | Reference selected code |
| `#terminal` | Access terminal output |
| `#codebase` | Search the entire codebase |

## 3. Skills Integration

### Instruction-Based Skills

GitHub Copilot does not have a `SKILL.md` skill system. Instead, it uses:

1. **Custom instruction files** — `.github/copilot-instructions.md`
2. **Granular instruction files** — `.github/instructions/*.instructions.md`
3. **MCP servers** — extend capabilities with external tools
4. **Built-in tools** — `#githubRepo`, `#file`, `#codebase`, etc.

### Skill Discovery and Registration

For WaslaGenie synchronization, skills from other tools map to Copilot as:

| Source | Target in Copilot |
|--------|-------------------|
| Claude `SKILL.md` | `.github/instructions/<name>.instructions.md` |
| Gemini skill | `.github/instructions/<name>.instructions.md` |
| Agent context | `.github/copilot-instructions.md` (append) |

### Extending Capabilities

- MCP servers provide the primary extension mechanism
- Instruction files shape AI behavior per-project and per-file
- The `AGENTS.md` cross-tool file is supported for compatibility
- Extensions marketplace provides additional chat participants

## 4. Provider-Specific Details

### Installation / Setup

#### VS Code
1. Install the **GitHub Copilot** extension
2. Sign in with GitHub account
3. Enable instruction files: `github.copilot.chat.codeGeneration.useInstructionFiles: true`

#### JetBrains
1. Install the **GitHub Copilot** plugin from the marketplace
2. Sign in with GitHub account

#### Neovim
1. Install `copilot.vim` or `copilot.lua`
2. Run `:Copilot setup` for authentication

### Authentication Requirements

- GitHub account with active Copilot subscription
- **Individual**: Personal GitHub account
- **Business**: Organization-managed via GitHub settings
- **Enterprise**: Enterprise-managed with policy controls
- Device-flow authentication for terminal-based editors (Vim/Neovim)

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `GITHUB_TOKEN` | GitHub API access |
| `HTTPS_PROXY` | Proxy configuration |
| `NODE_TLS_REJECT_UNAUTHORIZED` | SSL certificate verification |
| MCP `env` fields | Per-server environment variables |

### Limitations and Capabilities

- No native `SKILL.md` support — uses instruction files
- No sub-agent spawning — Agent mode runs in single session
- MCP config varies by IDE (VS Code vs JetBrains vs Neovim)
- Copilot Extensions (App-based) are deprecated in favor of MCP
- `applyTo` globs in instruction files enable file-scoped rules
- Copilot Coding Agent (GitHub.com) uses same instruction files

## 5. Examples

### Working Example: Custom Instructions

```markdown
# .github/copilot-instructions.md

## Stack
- TypeScript, Node 22, React 19, Next.js 15
- Database: PostgreSQL with Drizzle ORM
- Testing: Vitest + React Testing Library

## Coding Standards
- Use strict TypeScript — no `any` or `as` casts
- Prefer functional patterns over classes
- Write JSDoc for all exported functions
- Use `const` over `let`, never use `var`

## Error Handling
- Use Result/Either pattern for expected errors
- Only throw for truly unexpected errors
- Always log errors with structured context
```

### Sample Granular Instruction

```markdown
---
applyTo: "src/components/**/*.tsx"
---

# React Component Standards

- Use functional components with hooks
- Include error boundaries for async components
- Use React.memo() for expensive renders
- Name files in PascalCase matching component name
- One component per file
- Co-locate test files alongside components
```

### MCP Configuration (VS Code)

```json
{
  "servers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
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
