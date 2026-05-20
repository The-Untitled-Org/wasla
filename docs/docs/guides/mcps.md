---
sidebar_position: 2
---

# MCPs Configuration Guide

Model Context Protocol (MCP) servers are powerful capabilities that you can configure for your agents. WaslaGenie synchronizes these MCP configurations across all supported orchestrators.

## Overview

MCPs are configured using JSON files (`.json`). The process is similar to Agents, but because they are JSON, WaslaGenie handles the stub markers differently.

## Provider-Specific Configuration

### Claude Code
Claude Code expects MCP configuration files in JSON format.

- **Location:**
  - Workspace: `<workspace_root>/.claude/mcp/`
  - User: `~/.claude/mcp/`
- **Format:** JSON (`.json`)
- **Stub Generation:** WaslaGenie creates a stub file for the MCP with a block comment `/* waslagenie-stub */` at the top. Since JSON does not natively support comments, some orchestrators support comments in their JSON parsers. Ensure your tools support this format.

### Gemini CLI
Gemini CLI also expects MCP configurations in JSON format.

- **Location:**
  - Workspace: `<workspace_root>/.gemini/mcp/`
  - User: `~/.gemini/mcp/`
- **Format:** JSON (`.json`)
- **Stub Generation:** WaslaGenie creates a stub file for the MCP with a block comment `/* waslagenie-stub */` at the top.

### OpenClaw
OpenClaw configuration for MCPs.

- **Location:**
  - Workspace: `<workspace_root>/.config/openclaw/mcp/`
  - User: `~/.config/openclaw/mcp/`
- **Format:** JSON (`.json`)
- **Stub Generation:** WaslaGenie creates a stub file for the MCP with a block comment `/* waslagenie-stub */` at the top.

## How WaslaGenie Syncs MCPs

When you run `waslagenie sync`, the tool scans the directories of all supported providers for MCP files.

1. **Discovery:** It discovers `.json` files in the mcp directories.
2. **Conflict Resolution:** If the same MCP is modified in multiple places, WaslaGenie resolves conflicts based on modification times or prompts the user.
3. **Mirroring:** The canonical content of the MCP is copied to the other orchestrators. WaslaGenie writes a stub marker to identify the file as managed.
