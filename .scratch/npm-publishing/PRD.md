Status: ready-for-agent

# PRD: NPM Publishing Support

## Objective
Enable `wasla-genie` to be published as a globally installable CLI tool on the npm registry. Ensure that the internal Visualizer UI is correctly bundled and served when installed globally.

## Problem Statement
Current path resolution for static assets (Visualizer UI and the WaslaGenie logo) relies on `process.cwd()`. In a global npm installation, `process.cwd()` refers to the user's current project directory, not the npm package directory, causing the `visualizer` command to fail to load the UI.

## Proposed Solution

### 1. Robust Asset Path Resolution
Update `src/cli/commands/visualizer.ts` to use module-relative paths instead of `process.cwd()`.
- Use `fileURLToPath(import.meta.url)` to determine the location of the running script.
- Resolve `visualizerDist` relative to the script's directory.
- Relative path from `dist/cli/commands/visualizer.js` to `src/visualizer/dist` is `../../../src/visualizer/dist`.

### 2. Static Logo Serving
Move the logo asset into the Visualizer's build pipeline to avoid dependencies on the `docs/` folder.
- Create `src/visualizer/public/`.
- Copy `docs/static/img/logo.png` to `src/visualizer/public/logo.png`.
- Update the UI to serve `/logo.png` (standard Vite public asset behavior).
- Remove the custom `/api/branding/waslagenie-logo` route from the CLI server.

### 3. NPM Package Configuration
Update `package.json` to ensure clean and correct publishing.
- Add `"files": ["dist", "src/visualizer/dist"]` to exclude source code and tests from the final package.
- Add `"prepublishOnly": "npm run visualizer:build && npm run build"` to ensure all artifacts are fresh before publishing.

## Verification
- Run `npm pack` and inspect the tarball contents.
- Install the `.tgz` globally and verify the `waslagenie ui` command works correctly from an unrelated directory.
- Verify the logo is visible in the Visualizer UI.

## Comments
- Grilling session completed. User prefers CLI Tool Only model and wants to keep current naming convention (`wasla-genie` package, `waslagenie` bin).
