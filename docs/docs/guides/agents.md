---
sidebar_position: 1
---

# Agents Configuration Guide

Agents are the core entities in WaslaGenie. They are the custom AI identities or personas that you configure in your AI orchestrator. WaslaGenie synchronizes these agents across all supported orchestrators.

## Overview

In each orchestrator, agents are typically configured using markdown (`.md`) files. WaslaGenie uses a central canonical registry and adapters to map these agents to each orchestrator's specific format and location.

## Provider-Specific Configuration

### Claude Code
Claude Code expects agent configuration files in markdown format.

- **Location:**
  - Workspace: `<workspace_root>/.claude/agents/`
  - User: `~/.claude/agents/`
- **Format:** Markdown (`.md`)
- **Stub Generation:** WaslaGenie creates a stub file for the agent with the `<!-- waslagenie-stub -->` marker.

### Gemini CLI
Gemini CLI also expects agent configuration files in markdown format.

- **Location:**
  - Workspace: `<workspace_root>/.gemini/agents/`
  - User: `~/.gemini/agents/`
- **Format:** Markdown (`.md`)
- **Stub Generation:** WaslaGenie creates a stub file for the agent with the `<!-- waslagenie-stub -->` marker.

### OpenClaw
OpenClaw is configured similarly.

- **Location:**
  - Workspace: `<workspace_root>/.config/openclaw/agents/`
  - User: `~/.config/openclaw/agents/`
- **Format:** Markdown (`.md`)
- **Stub Generation:** WaslaGenie creates a stub file for the agent with the `<!-- waslagenie-stub -->` marker.

## How WaslaGenie Syncs Agents

When you run `waslagenie sync`, the tool scans the directories of all supported providers.

1. **Discovery:** It discovers `.md` files in the agent directories.
2. **Conflict Resolution:** If the same agent is modified in multiple places, WaslaGenie resolves conflicts using a "latest wins" approach or prompts the user.
3. **Mirroring:** The canonical content of the agent is copied to the other orchestrators. WaslaGenie writes a stub marker to identify the file as managed.
