---
id: github-cli
title: GitHub CLI (Copilot) Configuration Guide
sidebar_label: GitHub CLI
---

# GitHub CLI (Copilot) Configuration Guide

This guide covers how to configure agents, MCPs, and skills for **GitHub CLI** with Copilot when using WaslaGenie.

## 1. Agent Configuration

### Architecture

GitHub CLI integrates Copilot through the `gh copilot` extension and the standalone `copilot` interactive CLI. In interactive mode, Copilot operates as an autonomous agent capable of planning multi-step tasks, running terminal commands, and using MCP-connected tools. The CLI does not use discrete agent files — agent behavior is shaped by MCP tools and conversational context.

### Interactive Mode

Launch the interactive Copilot session:

```bash
# Enter interactive mode
copilot

# Or via gh extension
gh copilot
```

In interactive mode, you can:
- Ask coding questions
- Run terminal commands
- Use MCP tools
- Execute multi-step agentic tasks

### Agent Mode

GitHub CLI Copilot supports **Agent Mode**, which allows Copilot to act as an autonomous collaborator:
- Plans and executes multi-step tasks
- Runs terminal commands
- Uses MCP-connected tools to interact with external environments
- Iterates on feedback

### Context Files

The CLI Copilot reads project context from the same instruction files as VS Code:

```
.github/
├── copilot-instructions.md              ← project-wide instructions
└── instructions/
    └── *.instructions.md               ← granular instructions
```

### Configuration Locations

| Scope | Path | Notes |
|-------|------|-------|
| MCP config | `~/.copilot/mcp-config.json` | User-level MCP servers |
| Project instructions | `.github/copilot-instructions.md` | Loaded per-project |
| Granular instructions | `.github/instructions/*.instructions.md` | File-scoped rules |

## 2. MCP (Model Context Protocol) Setup

### MCP Server Configuration

MCP servers in GitHub CLI are managed through the interactive `/mcp` command family.

#### Adding servers interactively

```bash
# Start interactive mode
copilot

# Add a new MCP server
/mcp add

# View configured servers
/mcp show
```

When running `/mcp add`, you are prompted to provide:
1. **Server Name** — unique identifier
2. **Server Type** — `Local` (stdio) or `HTTP` (remote)
3. **Configuration** — command to run (for local) or URL + auth headers (for remote)

Save with `Ctrl+S` (or `Cmd+S` on macOS).

#### Config file

MCP settings are stored in:

```
~/.copilot/mcp-config.json
```

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
    },
    "remote-api": {
      "url": "https://mcp.example.com/api",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

### MCP Integration with Agents

- The **GitHub MCP server** is built-in and available by default — no extra config needed
- Custom MCP servers extend the agent's tool capabilities
- Tools are invoked automatically by the agent based on task requirements
- In Agent mode, the agent can chain multiple tool calls across MCP servers

### MCP Communication Protocols

| Transport | Config fields | Use case |
|-----------|-------------|----------|
| `stdio` (Local) | `command`, `args`, `env` | Local subprocess |
| `http` (HTTP) | `url`, `headers` | Remote HTTP server |

### Pre-installed Servers

The GitHub MCP server is built into the Copilot CLI, providing native access to:
- Repository data (issues, PRs, files)
- GitHub Actions
- Code search
- Organization data

No additional configuration needed for GitHub-native operations.

## 3. Skills Integration

### Instruction-Based Skills

GitHub CLI Copilot does not have a `SKILL.md` skill system. It uses:

1. **MCP servers** — primary extension mechanism for tool capabilities
2. **Custom instruction files** — `.github/copilot-instructions.md`
3. **Built-in GitHub tools** — native access to GitHub API

### Skill Discovery and Registration

For WaslaGenie synchronization, skills from other tools map to GitHub CLI as:

| Source | Target in GitHub CLI |
|--------|---------------------|
| Claude `SKILL.md` | MCP server or `.github/copilot-instructions.md` |
| Gemini skill | MCP server or instruction file |
| MCP server | Direct mapping to `~/.copilot/mcp-config.json` |

### Extending Capabilities

- MCP servers provide the primary extension path
- The built-in GitHub server covers most GitHub-native operations
- Instruction files provide project context for the agent

## 4. Provider-Specific Details

### Installation / Setup

```bash
# Install GitHub CLI
brew install gh

# Install Copilot extension
gh extension install github/gh-copilot

# Or install the standalone Copilot CLI
# (check GitHub for latest installation method)

# Authenticate
gh auth login

# Start interactive mode
copilot
# or
gh copilot
```

### Authentication Requirements

- GitHub account with active Copilot subscription
- Authentication via `gh auth login` (device flow or browser-based)
- MCP servers requiring API keys: set via `headers` or `env` fields in config

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `GITHUB_TOKEN` | GitHub API access (auto-set by `gh auth`) |
| `GH_TOKEN` | Alternative GitHub token variable |
| MCP `env` / `headers` | Per-server authentication |

### Limitations and Capabilities

- No native `SKILL.md` support
- No discrete agent files
- MCP config managed via interactive CLI (`/mcp add`) or `~/.copilot/mcp-config.json`
- Built-in GitHub MCP server available by default
- App-based Copilot Extensions are deprecated — MCP is the standard
- Keep CLI updated for latest MCP specification compatibility

## 5. Examples

### Working Example: MCP Configuration

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"],
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

### Sample Project Instructions — `.github/copilot-instructions.md`

```markdown
# Project Context

## Stack
- TypeScript monorepo, Node 22, Vitest

## Conventions
- Use strict TypeScript
- Write JSDoc for exports
- Prefer functional patterns
- Always handle errors explicitly

## Testing
- Use Vitest for all tests
- Mock external dependencies
- Minimum 80% coverage
```

### Interactive MCP Setup Session

```
$ copilot
> /mcp add

Server Name: my-api-server
Server Type: Local (STDIO)
Command: npx -y @my-org/api-mcp-server
Environment: {"API_KEY": "your-key"}

Press Cmd+S to save

> /mcp show
┌─────────────────┬────────┬──────────┐
│ Name            │ Type   │ Status   │
├─────────────────┼────────┼──────────┤
│ github (built-in)│ stdio  │ Active   │
│ my-api-server   │ stdio  │ Active   │
└─────────────────┴────────┴──────────┘
```
