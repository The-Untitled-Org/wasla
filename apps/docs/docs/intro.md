---
sidebar_position: 2
---

# Wasla Documentation

Welcome to Wasla — the universal synchronization layer for AI agent orchestrators.

## Quick Links

- **[Project Specification](/specs/project-spec)** — Complete product specification and design
- **[Architecture Overview](/architecture/)** — Runtime components, diagrams, and synchronization flow
- **[Design Discussion](/discussions/ai-discussions)** — Deep-dive design decisions and rationale
- **[Meetings of Mind](/discussions/MoM)** — Meeting notes from the design process

## What is Wasla?

Wasla synchronizes your agents and MCPs across Claude Code, Gemini CLI, and OpenCode without duplicating files.

### The Problem

You work across multiple AI orchestrators. Each one is its own universe. You build an agent in Gemini CLI. It doesn't exist in Claude Code. You build another in Claude. Now Gemini doesn't have it.

### The Solution

Wasla scans each tool, discovers what you've built, and mirrors the content into every other tool using the "Latest is Greatest" strategy. Whichever version was modified most recently becomes the canonical source.

## Quick Start

```bash
npm i -g @untitled-devs/wasla  # Install the CLI executable
wasla setup gemini --scope workspace  # Provision Gemini and mirror the latest assets
wasla status --scope workspace        # Inspect assets grouped by type and provider
wasla install-skill --scope workspace # Optional: add helper skills to detected tools
```

## Key Features

- ✅ **Multi-tool support** — Provider adapters for Claude Code, Gemini CLI, GitHub Copilot, GitHub Copilot CLI, Cursor, OpenCode, and experimental OpenClaw support
- ✅ **Content Mirroring** — Mirrored files contain full content for maximum tool compatibility
- ✅ **Dynamic Source Discovery** — Latest modification wins
- ✅ **Zero friction** — Edit anywhere, sync everywhere
- ✅ **Scoped to your needs** — User or workspace scope

## Project Structure

This documentation contains:

- **[Project Specification](/specs/project-spec)** — MVP specification, architecture, and design
- **[Architecture Overview](/architecture/)** — Current components and data flow
- **[Design Discussion](/discussions/ai-discussions)** — Grilling session notes and decision rationale
- **[Meetings of Mind](/discussions/MoM)** — Meeting notes (MoM) with key decisions

## GitHub

- **Repository** — [github.com/The-Untitled-Org/wasla](https://github.com/The-Untitled-Org/wasla)
- **Organization** — [github.com/The-Untitled-Org](https://github.com/The-Untitled-Org)
- **Issues & Discussions** — [GitHub Issues](https://github.com/The-Untitled-Org/wasla/issues)

---

**Questions?** Check the Project Specification or open an issue on GitHub.
