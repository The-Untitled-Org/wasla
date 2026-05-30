Work through the task files in `.scratch/` one by one. For each:
1. Read the task file.
2. Write a failing test (/tdd).
3. Implement minimal change to make it pass.
4. Ensure types + conventions are clean.
5. Commit and mark the task file as done (add `status: done` to its frontmatter).

Pending tasks:
!`grep -rl "status: todo" .scratch/ 2>/dev/null || echo "No pending tasks found"`

Recent commits:
!`git log --oneline -10`
