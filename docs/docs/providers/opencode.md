---
id: opencode
title: OpenCode Configuration Guide
sidebar_label: OpenCode
---

# OpenCode Configuration Guide

This guide covers how to configure agents, MCPs, and skills for **OpenCode** when using WaslaGenie.

## 1. Agent Configuration

### Architecture

OpenCode is a terminal-based AI coding assistant written in Go. It uses a JSON configuration file (`.opencode.json`) for all settings including agent definitions, MCP servers, and model configuration. OpenCode supports multiple built-in agents (`coder`, `task`, `title`) each configurable with different models and token limits.

### Creating and Configuring Agents

Agents are defined in the `agents` section of `.opencode.json`:

```json
{
  "agents": {
    "coder": {
      "model": "claude-sonnet-4-20250514",
      "maxTokens": 16000
    },
    "task": {
      "model": "claude-sonnet-4-20250514",
      "maxTokens": 8000
    },
    "title": {
      "model": "claude-haiku-3",
      "maxTokens": 1024
    }
  }
}
```

| Agent | Purpose |
|-------|---------|
| `coder` | Primary coding agent — handles implementation tasks |
| `task` | Task planning and execution agent |
| `title` | Generates conversation titles |

Default models are set automatically based on available API keys for different providers (OpenAI, Anthropic, Google, AWS Bedrock, etc.).

### Agent Lifecycle and Activation

- The `coder` agent is the primary interactive agent
- The `task` agent handles multi-step task planning
- The `title` agent auto-generates session titles
- All agents run within the same terminal session

### Context Files

OpenCode reads context from multiple sources, providing cross-tool compatibility:

```
# Default context paths (all relative to project root)
.github/copilot-instructions.md     ← GitHub Copilot compatibility
.cursorrules                        ← Cursor compatibility
.cursor/rules/                      ← Cursor rules directory
CLAUDE.md / CLAUDE.local.md         ← Claude Code compatibility
opencode.md / opencode.local.md     ← OpenCode native
OpenCode.md / OpenCode.local.md     ← OpenCode native (alt case)
OPENCODE.md / OPENCODE.local.md     ← OpenCode native (uppercase)
```

Context files are appended to the base prompt for the `coder` and `task` agents. Paths ending with `/` are treated as directories and recursively walked.

Additional context paths can be specified via the `contextPaths` array in `.opencode.json`:

```json
{
  "contextPaths": [
    "docs/architecture.md",
    "CONTRIBUTING.md"
  ]
}
```

### Custom Commands

Custom commands are predefined prompts stored as Markdown files:

```
# User commands (personal, all projects)
$XDG_CONFIG_HOME/opencode/commands/
# or
$HOME/.opencode/commands/

# Project commands (workspace-scoped)
<PROJECT_DIR>/.opencode/commands/
```

Command files can include named arguments using the `$NAME` format.

### Configuration Locations

| Scope | Path | Notes |
|-------|------|-------|
| Local (project) | `./.opencode.json` | Highest precedence |
| XDG config | `$XDG_CONFIG_HOME/opencode/.opencode.json` | Mid precedence |
| User home | `$HOME/.opencode.json` | Lowest precedence |
| User commands | `$HOME/.opencode/commands/` | Personal prompt files |
| Project commands | `.opencode/commands/` | Workspace prompt files |

## 2. MCP (Model Context Protocol) Setup

### MCP Server Configuration

MCP servers are configured in the `mcpServers` section of `.opencode.json`:

```json
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user"],
      "env": {
        "NODE_ENV": "production"
      }
    },
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "remote-api": {
      "type": "sse",
      "url": "https://mcp.example.com/sse",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

### MCP Integration with Agents

- MCP tools are available to all agents within the session
- No per-agent MCP scoping — all configured servers are globally available
- Tools are invoked by their registered name (no prefix applied)

### MCP Communication Protocols

| Transport | Config fields | Use case |
|-----------|-------------|----------|
| `stdio` | `command`, `args`, `env` | Local subprocess — most common |
| `sse` | `url`, `headers` | Remote server, Server-Sent Events |

## 3. Skills Integration

### Context-File-Based Skills

OpenCode does not have a dedicated `SKILL.md`-based skill system like Claude Code or Gemini CLI. Instead, it achieves similar functionality through:

1. **Context files** — Markdown files loaded into the agent's prompt
2. **Custom commands** — Predefined prompts in `.opencode/commands/`
3. **Cross-tool compatibility** — Reads `.cursorrules`, `CLAUDE.md`, `.github/copilot-instructions.md`

### Skill Discovery and Registration

Since OpenCode reads context files from multiple tool-specific paths, WaslaGenie can sync skills by writing context to the `opencode.md` or `OPENCODE.md` file at the project root, or by leveraging the cross-tool compatible paths.

### Extending Capabilities

- Custom commands in `.opencode/commands/` provide reusable prompt templates
- Context files provide persistent per-project knowledge
- MCP servers extend tool capabilities

## 4. Provider-Specific Details

### Installation / Setup

```bash
# Install via install script
curl -fsSL https://raw.githubusercontent.com/opencode-ai/opencode/refs/heads/main/install | bash

# Install via Homebrew (macOS/Linux)
brew install opencode-ai/tap/opencode

# Install via Go
go install github.com/opencode-ai/opencode@latest

# Install via AUR (Arch Linux)
yay -S opencode-ai-bin

# Start a session
cd your-project/
opencode
```

### Authentication Requirements

OpenCode supports multiple AI providers. Authentication is handled via API keys set as environment variables or in `.opencode.json`.

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Anthropic Claude models |
| `OPENAI_API_KEY` | OpenAI models |
| `GEMINI_API_KEY` | Google Gemini models |
| `GITHUB_TOKEN` | GitHub Copilot models |
| `GROQ_API_KEY` | Groq models |
| `AWS_ACCESS_KEY_ID` | AWS Bedrock access |
| `AWS_SECRET_ACCESS_KEY` | AWS Bedrock secret |
| `AWS_REGION` | AWS Bedrock region |
| `VERTEXAI_PROJECT` | Google Cloud Vertex AI project |
| `VERTEXAI_LOCATION` | Google Cloud Vertex AI region |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI key |
| `AZURE_OPENAI_API_VERSION` | Azure OpenAI API version |
| `LOCAL_ENDPOINT` | Self-hosted model endpoint |

### Limitations and Capabilities

- No native `SKILL.md` skill system — uses context files instead
- No per-agent MCP scoping — all MCP servers are globally available
- No sub-agent spawning — single agent runs per session
- Cross-tool context file compatibility (reads Cursor, Claude, Copilot instructions)
- Written in Go — lightweight binary, fast startup

## 5. Examples

### Working Example: `.opencode.json`

```json
{
  "agents": {
    "coder": {
      "model": "claude-sonnet-4-20250514",
      "maxTokens": 16000
    },
    "task": {
      "model": "claude-sonnet-4-20250514",
      "maxTokens": 8000
    }
  },
  "mcpServers": {
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
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  },
  "contextPaths": [
    "docs/architecture.md",
    "CONTRIBUTING.md"
  ]
}
```

### Sample Context File — `opencode.md`

```markdown
# Project Context

## Stack
- TypeScript monorepo, Node 22, Vitest

## Coding Standards
- Use strict TypeScript
- Write JSDoc for exports
- Prefer functional patterns

## Testing
- Use Vitest for all tests
- Minimum 80% coverage on new code
```

### Sample Custom Command — `.opencode/commands/review.md`

```markdown
Review the changes in $FILE for:
1. Correctness and edge cases
2. Security vulnerabilities
3. Performance issues
4. Code style consistency

Provide a severity rating for each finding (CRITICAL / HIGH / MEDIUM / LOW).
```
