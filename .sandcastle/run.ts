import { run, claudeCode } from "@ai-hero/sandcastle";
import { noSandbox } from "@ai-hero/sandcastle/sandboxes/no-sandbox";

const controller = new AbortController();
process.on("SIGINT", () => controller.abort());
process.on("SIGTERM", () => controller.abort());

await run({
  agent: claudeCode("claude-sonnet-4-6"),
  sandbox: noSandbox(),
  template: "simple-loop",
  promptFile: "./.sandcastle/prompt.md",
  signal: controller.signal,
  logging: { type: "stdout" },
  onAgentStreamEvent: (event) => {
    process.stdout.write(
      `[${new Date().toISOString()}] [iter:${event.iteration}] ${event.type}\n`
    );
  },
  hooks: {
    host: {
      onWorktreeReady: [
        { command: "echo [worktree] ready — branch=$(git branch --show-current) path=$(pwd)" },
      ],
    },
  },
});