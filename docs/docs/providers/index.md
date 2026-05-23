---
id: index
title: Providers Overview
sidebar_label: Overview
sidebar_position: 1
---

# Supported Providers

WaslaGenie supports a growing list of AI providers, orchestrators, and coding assistants.
This section provides detailed configuration guides for integrating WaslaGenie with each supported provider.

## Available Providers

| Provider | Agent Format | MCP Config | Skills/Instructions | Context File |
|----------|-------------|------------|-------------------|--------------|
| [Claude Code](./claude.md) | `.claude/agents/*.md` (YAML frontmatter) | `.mcp.json` (`mcpServers`) | `.claude/skills/*/SKILL.md` | `CLAUDE.md` |
| [Gemini CLI](./gemini.md) | `GEMINI.md` + skills (no discrete agents) | `.gemini/settings.json` (`mcpServers`) | `.gemini/skills/*/SKILL.md` | `GEMINI.md` |
| [OpenClaw](./openclaw.md) | `AGENTS.md` workspace file | `openclaw.json` (`mcp.servers`) | `~/.openclaw/skills/*/SKILL.md` | `AGENTS.md` |
| [OpenCode](./opencode.md) | `.opencode.json` (agent config) | `.opencode.json` (`mcpServers`) | Context files (no SKILL.md) | `opencode.md` |
| [Cursor](./cursor.md) | `.cursor/rules/*.mdc` (rules system) | `.cursor/mcp.json` (`mcpServers`) | `.mdc` rule files | `.cursorrules` |
| [VS Code](./vscode.md) | `.github/copilot-instructions.md` | `.vscode/mcp.json` (`servers`) | `.github/instructions/*.instructions.md` | `copilot-instructions.md` |
| [GitHub Copilot](./github-copilot.md) | `.github/copilot-instructions.md` | `.vscode/mcp.json` (`servers`) | Instruction files + MCP | `copilot-instructions.md` |
| [GitHub CLI](./github-cli.md) | Interactive session | `~/.copilot/mcp-config.json` (`mcpServers`) | MCP tools + instructions | `copilot-instructions.md` |

Choose a provider from the list above or the sidebar to learn how to configure agents, MCPs, and skills for that specific tool.
