import { useState, useEffect } from 'react';
import SpotlightCard from './components/SpotlightCard';
import DecryptedText from './components/DecryptedText';
import SplitText from './components/SplitText';
import Magnetic from './components/Magnetic';
import WaslaNetwork from './components/WaslaNetwork';
import DotField from './components/DotField';
import LogoLoop from './components/LogoLoop';
import AnimatedContent from './components/AnimatedContent';

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

type Theme = 'dark' | 'light';

const getInitialTheme = (): Theme => {
  const storedTheme = localStorage.getItem('wasla-theme');
  if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'sync' | 'status' | 'watch'>('sync');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('wasla-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  // Copy to clipboard helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Mock terminal logs
  const terminalContent = {
    sync: [
      { text: '$ wasla setup gemini --scope workspace', type: 'cmd' },
      { text: '🔍 Scanning workspace for orchestrator directories...', type: 'info' },
      { text: 'Found configuration roots:', type: 'info' },
      { text: '  • Claude Code:  .claude/', type: 'success' },
      { text: '  • Gemini CLI:   .gemini/', type: 'success' },
      { text: '  • Cursor:       .cursor/', type: 'success' },
      { text: '  • OpenCode:     .opencode/', type: 'success' },
      { text: '📂 Scanning agent/skill files...', type: 'info' },
      {
        text: 'Found 3 custom agents: [code-reviewer, test-writer, adapter-builder]',
        type: 'info',
      },
      { text: '🔄 Syncing [code-reviewer]: latest is Gemini CLI (modified 2m ago)', type: 'info' },
      { text: '   -> Mirroring to Claude Code:    .claude/agents/code-reviewer.md', type: 'write' },
      { text: '   -> Mirroring to Cursor:         .cursor/agents/code-reviewer.md', type: 'write' },
      { text: '🔄 Syncing [test-writer]: latest is Claude Code (modified 10s ago)', type: 'info' },
      { text: '   -> Mirroring to Gemini CLI:     .gemini/agents/test-writer.md', type: 'write' },
      { text: '✅ Sync completed successfully! Sync registry updated.', type: 'success' },
    ],
    status: [
      { text: '$ wasla status', type: 'cmd' },
      { text: '🤖 Wasla Workspace Registry Status', type: 'info' },
      { text: 'Scope: workspace (cwd: /Users/mustafabahaa/Work/Github/wasla)', type: 'info' },
      { text: 'Registry file: .wasla/registry.json', type: 'info' },
      { text: '', type: 'info' },
      { text: 'Active Sync Adapters (7):', type: 'info' },
      { text: '  ✓ Claude Code     [Active]  (.claude/)', type: 'success' },
      { text: '  ✓ Gemini CLI      [Active]  (.gemini/)', type: 'success' },
      { text: '  ✓ Cursor          [Active]  (.cursor/)', type: 'success' },
      { text: '  ✓ OpenCode        [Active]  (.opencode/)', type: 'success' },
      { text: '  ✓ GitHub Copilot  [Active]  (.github/)', type: 'success' },
      { text: '  ✓ Copilot CLI     [Active]  (.github/)', type: 'success' },
      { text: '  ✓ OpenClaw        [Active]  (.config/openclaw/)', type: 'success' },
      { text: '', type: 'info' },
      { text: 'Synced Assets:', type: 'info' },
      { text: '  - Agent: code-reviewer.md   (5 tools synced)  [OK]', type: 'success' },
      { text: '  - Agent: test-writer.md     (5 tools synced)  [OK]', type: 'success' },
      { text: '  - MCP:   deepwiki           (3 tools synced)  [OK]', type: 'success' },
    ],
    watch: [
      { text: '$ wasla watch', type: 'cmd' },
      { text: '👁 Wasla File Watcher started...', type: 'info' },
      { text: 'Watching files in active orchestrator directories...', type: 'info' },
      { text: '[Watcher] Ready and waiting for changes.', type: 'info' },
      {
        text: '[Watcher] [Change detected] File modified: .claude/agents/code-reviewer.md',
        type: 'warning',
      },
      { text: '[Watcher] Running sync engine...', type: 'info' },
      { text: '  -> Syncing changes to Gemini CLI... done.', type: 'success' },
      { text: '  -> Syncing changes to Cursor... done.', type: 'success' },
      { text: '[Watcher] Sync complete. Resuming watch...', type: 'success' },
    ],
  };

  const orchestrators = [
    {
      name: 'Claude Code',
      slug: 'claude',
      configRoot: '.claude/',
      agentsDir: '.claude/agents/',
      mcpConfig: '.claude/mcp.json',
      color: 'rgba(249, 115, 22, 0.12)',
    },
    {
      name: 'Gemini CLI',
      slug: 'gemini',
      configRoot: '.gemini/',
      agentsDir: '.gemini/agents/',
      mcpConfig: '.gemini/settings.json',
      color: 'rgba(59, 130, 246, 0.12)',
    },
    {
      name: 'Cursor',
      slug: 'cursor',
      configRoot: '.cursor/',
      agentsDir: '.cursor/agents/',
      mcpConfig: '.cursor/mcp.json',
      color: 'rgba(34, 211, 238, 0.12)',
    },
    {
      name: 'OpenCode',
      slug: 'opencode',
      configRoot: '.opencode/',
      agentsDir: '.opencode/agents/',
      mcpConfig: 'opencode.json',
      color: 'rgba(16, 185, 129, 0.12)',
    },
    {
      name: 'GitHub Copilot',
      slug: 'copilot',
      configRoot: '.github/',
      agentsDir: '.github/agents/',
      mcpConfig: '.vscode/mcp.json',
      color: 'rgba(129, 140, 248, 0.12)',
    },
    {
      name: 'GitHub Copilot CLI',
      slug: 'copilot-cli',
      configRoot: '.github/',
      agentsDir: '.github/agents/',
      mcpConfig: '.mcp.json',
      color: 'rgba(99, 102, 241, 0.12)',
    },
    {
      name: 'OpenClaw',
      slug: 'openclaw',
      configRoot: '.config/openclaw/',
      agentsDir: 'Not Applicable',
      mcpConfig: 'openclaw.json',
      color: 'rgba(45, 212, 191, 0.12)',
    },
    {
      name: 'VS Code',
      slug: 'vscode',
      configRoot: '.vscode/',
      agentsDir: '.github/instructions/',
      mcpConfig: '.vscode/mcp.json',
      color: 'rgba(0, 120, 212, 0.12)',
    },
  ];
  const ecosystemLogos = orchestrators.map((orchestrator) => ({
    src: asset(`img/${orchestrator.slug}.png`),
    alt: orchestrator.name,
    name: orchestrator.name,
  }));

  return (
    <div className="relative min-h-screen bg-[#f8fafc] dark:bg-[#02040a] text-slate-800 dark:text-slate-100 overflow-hidden transition-colors duration-300">
      <DotField
        className="fixed inset-0 z-0 pointer-events-none"
        glowColor={theme === 'dark' ? '#0ea5e9' : '#ffffff'}
        gradientFrom={theme === 'dark' ? 'rgba(14, 165, 233, 0.25)' : 'rgba(2, 132, 199, 0.25)'}
        gradientTo={theme === 'dark' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(14, 165, 233, 0.15)'}
        dotRadius={1.5}
        dotSpacing={12}
        cursorRadius={400}
        bulgeStrength={80}
      />
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-transparent border-none px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={asset('img/logo-transparent.png')}
              className="h-9 w-9 rounded-lg bg-[#0e83cd] p-1.5 object-contain select-none"
              alt="Wasla Logo"
            />
            <span className="text-xl font-bold tracking-[-0.04em] text-slate-950 dark:text-white">
              wasla
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a
              href="#features"
              className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
            >
              Features
            </a>
            <a
              href="#demo"
              className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
            >
              Interactive Demo
            </a>
            <a
              href="#visualizer"
              className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
            >
              Visualizer
            </a>
            <a
              href="https://the-untitled-org.github.io/wasla/docs/blog"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
            >
              Blog
            </a>
            <a
              href="https://the-untitled-org.github.io/wasla/docs/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
            >
              Documentation
            </a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm backdrop-blur-md"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            <a
              href="https://www.npmjs.com/package/@untitled-devs/wasla"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex w-10 h-10 items-center justify-center rounded-xl bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm backdrop-blur-md"
              title="View on npm"
            >
              <span className="flex h-4 w-6 items-center justify-center rounded-sm bg-[#cb3837] text-[8px] font-black leading-none tracking-[-0.08em] text-white">
                npm
              </span>
            </a>
            <a
              href="https://github.com/The-Untitled-Org/wasla"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm backdrop-blur-md"
              title="View on GitHub"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            </a>
            <Magnetic>
              <a
                href="#quickstart"
                className="whitespace-nowrap px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-[0_0_20px_rgba(14,131,205,0.3)] hover:shadow-[0_0_30px_rgba(14,131,205,0.5)]"
              >
                Get Started
              </a>
            </Magnetic>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 z-10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/5 text-sky-600 dark:text-sky-300 text-xs font-semibold mb-6 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            <span>One skill layer. Every AI orchestrator. Zero duplication.</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-bold tracking-tight mb-6 text-slate-900 dark:text-white leading-[1.04]">
            <SplitText
              text="Unlock Universal Agent Sync Across All AI Platforms"
              className="text-slate-900 dark:text-white inline-block bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text"
              duration={1.5}
              tag="span"
              textAlign="center"
            />
          </h1>

          <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-light max-w-2xl mx-auto">
            Stop copying agent instructions and MCP configurations manually.{' '}
            <DecryptedText
              text="Wasla"
              className="text-sky-500 dark:text-sky-400 font-semibold"
              animateOnMount={true}
              useHover={true}
            />{' '}
            synchronizes custom agents, skills, MCPs, and context files across{' '}
            <span className="text-slate-900 dark:text-white font-medium">Claude Code</span>,{' '}
            <span className="text-slate-900 dark:text-white font-medium">Gemini CLI</span>,{' '}
            <span className="text-slate-900 dark:text-white font-medium">Cursor</span>,{' '}
            <span className="text-slate-900 dark:text-white font-medium">VS Code</span>,{' '}
            <span className="text-slate-900 dark:text-white font-medium">GitHub Copilot</span>, and{' '}
            <span className="text-slate-900 dark:text-white font-medium">more</span> —
            automatically.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Magnetic>
              <a
                href="#quickstart"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold transition-all text-sm text-center shadow-[0_0_30px_rgba(14,131,205,0.35)] hover:shadow-[0_0_40px_rgba(14,131,205,0.55)]"
              >
                Start Project &gt;
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href="https://the-untitled-org.github.io/wasla/docs/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-all hover:bg-slate-50 dark:hover:bg-slate-800/80 backdrop-blur-sm text-sm text-center"
              >
                Read Documentation
              </a>
            </Magnetic>
          </div>
        </div>

        <div className="mt-12 flex w-full justify-center">
          <WaslaNetwork />
        </div>

        <div className="mt-4 border-t border-slate-200/50 dark:border-white/5 pt-8">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-6 select-none">
            Supported Ecosystem integrations
          </p>
          <LogoLoop
            logos={ecosystemLogos}
            speed={45}
            logoHeight={56}
            gap={64}
            className="py-6"
            pauseOnHover
            fadeOut
            fadeOutColor={theme === 'dark' ? '#02040a' : '#f8fafc'}
            ariaLabel="Supported ecosystem integrations"
            renderItem={(logo) => (
              <div className="flex flex-col items-center gap-2 opacity-70 transition-opacity duration-300 hover:opacity-100">
                <img src={logo.src} alt="" className="size-7 object-contain" />
                <span className="text-sm font-semibold tracking-tight text-slate-600 dark:text-slate-400 text-center">
                  {logo.name}
                </span>
              </div>
            )}
          />
        </div>
      </section>

      {/* Problem Statement Section */}
      <section className="max-w-5xl mx-auto px-6 py-16 z-10 relative">
        <AnimatedContent distance={50} direction="vertical" duration={0.8}>
          <div className="flex flex-col items-center justify-center text-center mb-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/5 text-sky-600 dark:text-sky-400 text-xs font-semibold mb-6">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <span>The Disconnected Ecosystem</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-slate-900 dark:text-white max-w-3xl">
              Your AI Tools Are <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-sky-700 dark:from-sky-400 dark:to-blue-500">Trapped In Silos</span>
            </h2>
          </div>
        </AnimatedContent>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card 1 */}
          <div className="lg:col-span-7 group">
            <AnimatedContent distance={50} direction="vertical" delay={0.1}>
              <div className="relative h-full flex flex-col p-6 md:p-8 rounded-[2rem] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-slate-500/10 hover:border-slate-500/30 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-[300px] h-[200px] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-500/10 dark:from-slate-500/20 via-transparent to-transparent opacity-50 transition-opacity duration-500 group-hover:opacity-100"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center h-full">
                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <p className="text-base text-slate-500 dark:text-slate-400 font-medium">You build an agent in Gemini CLI.</p>
                    <p className="text-lg text-slate-700 dark:text-slate-300 font-medium">You open Claude Code.</p>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight mt-2">It knows <br className="hidden md:block"/><span className="text-sky-500">nothing about it.</span></h3>
                  </div>
                  <div className="w-full md:w-32 aspect-square relative flex items-center justify-center">
                    <div className="absolute inset-0 border-2 border-dashed border-sky-200 dark:border-sky-900/50 rounded-full animate-[spin_10s_linear_infinite]"></div>
                    <div className="absolute inset-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                    <div className="w-14 h-14 bg-sky-50 dark:bg-sky-950 border border-sky-200 dark:border-sky-900 rounded-full flex items-center justify-center z-10 shadow-lg text-sky-500">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedContent>
          </div>

          {/* Card 2 */}
          <div className="lg:col-span-5 group">
            <AnimatedContent distance={50} direction="vertical" delay={0.2}>
              <div className="relative h-full flex flex-col p-6 md:p-8 rounded-[2rem] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-slate-500/10 hover:border-slate-500/30 hover:-translate-y-1">
                <div className="absolute bottom-0 left-0 w-full h-[200px] bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-slate-500/10 dark:from-slate-500/20 via-transparent to-transparent opacity-50 transition-opacity duration-500 group-hover:opacity-100"></div>
                
                <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center shadow-lg text-slate-500 dark:text-slate-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"/></svg>
                  </div>
                  <div className="space-y-3">
                    <p className="text-base text-slate-500 dark:text-slate-400 font-medium">You configure an MCP in Claude Code.</p>
                    <p className="text-lg text-slate-700 dark:text-slate-300 font-medium">You switch to Cursor.</p>
                    <h3 className="text-2xl font-black text-sky-500 leading-tight">Gone.</h3>
                  </div>
                </div>
              </div>
            </AnimatedContent>
          </div>

          {/* Card 3 */}
          <div className="lg:col-span-12 group">
            <AnimatedContent distance={50} direction="vertical" delay={0.3}>
              <div className="relative p-6 md:p-8 rounded-[2rem] bg-slate-900 dark:bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden transition-all duration-500 hover:border-slate-700 hover:-translate-y-1">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-full bg-slate-400/10 blur-[120px] rounded-full"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <p className="text-xl text-slate-400 font-medium">You write a skill in one tool.</p>
                    <p className="text-xl text-slate-300 font-medium">Every other tool:</p>
                    <h3 className="text-3xl md:text-4xl font-black text-white leading-tight">Blank slate.</h3>
                  </div>
                  
                  <div className="w-full md:w-[320px] bg-slate-950 rounded-2xl border border-slate-800 p-6 font-mono text-sm shadow-2xl">
                    <div className="flex gap-2 mb-4 pb-4 border-b border-slate-800">
                      <div className="w-3 h-3 rounded-full bg-slate-800"></div>
                      <div className="w-3 h-3 rounded-full bg-slate-800"></div>
                      <div className="w-3 h-3 rounded-full bg-slate-800"></div>
                    </div>
                    <div className="space-y-3 opacity-30">
                       <div className="h-2 w-3/4 bg-slate-700 rounded"></div>
                       <div className="h-2 w-1/2 bg-slate-700 rounded"></div>
                       <div className="h-2 w-full bg-slate-700 rounded"></div>
                       <div className="h-2 w-2/3 bg-slate-700 rounded"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="px-4 py-2 bg-slate-900/80 border border-slate-700 text-slate-400 rounded-lg shadow-xl uppercase tracking-widest text-xs font-bold backdrop-blur-md">
                         Not Found
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedContent>
          </div>
        </div>

        <AnimatedContent distance={30} direction="vertical" delay={0.4}>
          <div className="mt-10 text-center max-w-2xl mx-auto px-4">
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-light">
              There is no shared layer. Every orchestrator hoards what lives inside it. You end up{' '}
              <span className="font-semibold text-slate-900 dark:text-white">copy-pasting configs and maintaining the same thing in five places</span>.
            </p>
          </div>
        </AnimatedContent>
      </section>

      {/* Premium Alternating Use Cases Section */}
      <section id="usecases" className="max-w-7xl mx-auto px-6 py-24 z-10 relative border-t border-slate-200 dark:border-white/5">
        <AnimatedContent distance={50} direction="vertical" reverse={false} duration={0.8}>
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/5 text-sky-600 dark:text-sky-300 text-xs font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
              <span>Real World Scenarios</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-slate-900 dark:text-white">
              How Wasla Changes Your Workflow
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              It's not just about syncing files. It's about preserving your AI's context and skills everywhere you go.
            </p>
          </div>
        </AnimatedContent>

        <div className="space-y-24 overflow-hidden px-4">
          {/* Case 1: Switching Providers */}
          <AnimatedContent distance={100} direction="horizontal" reverse={false} duration={0.8}>
            <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
              <div className="flex-1 md:order-1 order-2">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sky-600 dark:text-sky-400 font-bold text-xl border shadow-sm">01</div>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white">Switching Providers</h3>
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6 font-light">
                  You have a workspace with agents, skills, and MCPs configured in Claude Code. You decide to try Gemini CLI. Instead of recreating everything from scratch and wasting tokens to test how Gemini handles it, simply run Wasla. All your Claude assets instantly become available in Gemini.
                </p>
              </div>
              <div className="flex-1 w-full md:order-2 order-1">
                <div className="relative aspect-video md:aspect-[4/3] lg:aspect-video rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-8 overflow-hidden shadow-xl dark:shadow-2xl flex flex-col justify-center transition-transform hover:-translate-y-1 duration-500">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/20 rounded-full blur-[80px]"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px]"></div>
                  
                  {/* Visual content: Migration flow */}
                  <div className="relative z-10 flex items-center justify-between w-full max-w-sm mx-auto">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-3 shadow-inner bg-white dark:bg-transparent">
                        <img src={asset('img/claude.png')} alt="Claude" className="w-full h-full object-contain" />
                      </div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Claude Code</span>
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                      <div className="px-3 py-1 rounded-full bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-sky-600 dark:text-sky-400 flex items-center gap-2 shadow-sm backdrop-blur">
                        <span>wasla sync</span>
                        <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ animationDirection: 'alternate-reverse', animationDuration: '1s' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">Zero copy</div>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-3 shadow-inner bg-white dark:bg-transparent">
                        <img src={asset('img/gemini.png')} alt="Gemini" className="w-full h-full object-contain" />
                      </div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Gemini CLI</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedContent>

          {/* Case 2: Portable Walking AI Setup */}
          <AnimatedContent distance={100} direction="horizontal" reverse={true} duration={0.8}>
            <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
              <div className="flex-1 w-full order-1">
                <div className="relative aspect-video md:aspect-[4/3] lg:aspect-video rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 overflow-hidden shadow-xl dark:shadow-2xl flex flex-col transition-transform hover:-translate-y-1 duration-500">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-sky-500/10 blur-[100px]"></div>
                  
                  {/* Visual content: Watcher / Terminal */}
                  <div className="relative z-10 w-full h-full rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 overflow-hidden flex flex-col font-mono text-xs shadow-inner">
                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                      <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                      <span className="ml-2 text-slate-500 font-mono">wasla</span>
                    </div>
                    <div className="p-4 space-y-3 text-slate-700 dark:text-slate-300 flex-1 overflow-hidden">
                      <div><span className="text-sky-600 dark:text-sky-400">$</span> wasla sync</div>
                      <div className="text-slate-500">↻ Scanning configuration roots...</div>
                      <div className="mt-4"><span className="text-sky-600 dark:text-sky-400">[Discovered]</span> .gemini/agents/planner.md</div>
                      <div className="flex gap-4 opacity-80">
                         <span className="text-emerald-600 dark:text-emerald-400">→ Syncing stubs</span>
                         <span>.claude/agents/planner.md</span>
                      </div>
                      <div className="flex gap-4 opacity-80">
                         <span className="text-emerald-600 dark:text-emerald-400">→ Syncing stubs</span>
                         <span>.cursor/rules/planner.md</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 order-2">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sky-600 dark:text-sky-400 font-bold text-xl border shadow-sm">02</div>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white">The Portable AI Setup</h3>
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6 font-light">
                  Continue working in your new provider, add new agents, and delete old ones. Run <code className="bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">wasla sync</code> and everything mirrors back to your other tools automatically. Your AI environment is fully portable and follows you wherever you go.
                </p>
              </div>
            </div>
          </AnimatedContent>

          {/* Case 3: Cherry Picking */}
          <AnimatedContent distance={100} direction="horizontal" reverse={false} duration={0.8}>
            <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
              <div className="flex-1 md:order-1 order-2">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sky-600 dark:text-sky-400 font-bold text-xl border shadow-sm">03</div>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white">Cherry-Picking with UI</h3>
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6 font-light">
                  Need a skill from one tool and an MCP from another? You don't want to sync everything blindly. Open up the Wasla Visualizer UI and perform your magic visually, selecting exactly what you need to build your perfect custom setup.
                </p>
              </div>
              <div className="flex-1 w-full md:order-2 order-1">
                <div className="relative aspect-video md:aspect-[4/3] lg:aspect-video rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 overflow-hidden shadow-xl dark:shadow-2xl flex flex-col justify-center transition-transform hover:-translate-y-1 duration-500">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-500/10 dark:from-sky-500/20 via-transparent to-transparent opacity-60"></div>
                  
                  {/* Visual content: UI abstraction */}
                  <div className="relative z-10 w-full max-w-sm mx-auto h-full max-h-48 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md p-4 flex gap-4 shadow-xl dark:shadow-2xl">
                    <div className="w-1/3 flex flex-col gap-3">
                      <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800/80"></div>
                      <div className="h-10 w-full rounded-lg bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/20 dark:border-sky-500/30 flex items-center px-2"><div className="w-4 h-4 rounded-full bg-sky-400/50"></div></div>
                      <div className="h-10 w-full rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center px-2"><div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-600"></div></div>
                    </div>
                    <div className="w-2/3 flex flex-col gap-3">
                       <div className="h-16 w-full rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 flex p-3 gap-3 items-center shadow-sm">
                          <div className="w-8 h-8 rounded bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/20 dark:border-sky-500/30 flex-shrink-0"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-2 w-1/2 bg-slate-200 dark:bg-slate-600 rounded"></div>
                            <div className="h-1.5 w-3/4 bg-slate-100 dark:bg-slate-600/50 rounded"></div>
                          </div>
                       </div>
                       <div className="flex-1 w-full rounded-xl bg-slate-50/40 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700 border-dashed flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-widest bg-stripes">
                          Drop to link MCP
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedContent>

          {/* Case 4: Team Onboarding */}
          <AnimatedContent distance={100} direction="horizontal" reverse={true} duration={0.8}>
            <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
              <div className="flex-1 w-full order-1">
                <div className="relative aspect-video md:aspect-[4/3] lg:aspect-video rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 overflow-hidden shadow-xl dark:shadow-2xl flex flex-col justify-center items-center text-center transition-transform hover:-translate-y-1 duration-500">
                  <div className="absolute top-0 right-0 w-full h-full bg-sky-500/10 blur-[100px]"></div>
                  <div className="relative z-10 space-y-5 w-full max-w-sm mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-lg">
                      <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                      <span className="text-sm font-mono text-slate-600 dark:text-slate-300">git clone origin/team-repo</span>
                    </div>
                    <div className="h-6 border-l-2 border-dashed border-sky-500/30 mx-auto"></div>
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-sky-500/30 shadow-lg backdrop-blur">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                      <span className="text-sm font-mono text-emerald-600 dark:text-emerald-400">wasla sync</span>
                    </div>
                    <div className="h-6 border-l-2 border-dashed border-sky-500/30 mx-auto"></div>
                    <div className="flex justify-center gap-3">
                      <div className="px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2 shadow-lg"><img src={asset('img/vscode.png')} className="w-3 h-3" alt="VS Code"/> Ready</div>
                      <div className="px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2 shadow-lg"><img src={asset('img/cursor.png')} className="w-3 h-3" alt="Cursor"/> Ready</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 order-2">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sky-600 dark:text-sky-400 font-bold text-xl border shadow-sm">04</div>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white">Team Standardization</h3>
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6 font-light">
                  Your team lead sets up a canonical set of agents and MCPs in a shared repository. A new developer joins, clones the repo, and runs <code className="bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">wasla sync</code>. Instantly, their preferred local AI tool is provisioned with the exact team standards.
                </p>
              </div>
            </div>
          </AnimatedContent>

          {/* Case 5: AI Skill */}
          <AnimatedContent distance={100} direction="horizontal" reverse={false} duration={0.8}>
            <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
              <div className="flex-1 md:order-1 order-2">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sky-600 dark:text-sky-400 font-bold text-xl border shadow-sm">05</div>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white">Wasla as an AI Skill</h3>
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6 font-light">
                  Want your AI to handle everything? Wasla includes a native skill. Your orchestrator is aware of the solution and can run <code className="bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">sync</code> or <code className="bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">status</code> commands for you without you ever opening a terminal!
                </p>
              </div>
              <div className="flex-1 w-full md:order-2 order-1">
                <div className="relative aspect-video md:aspect-[4/3] lg:aspect-video rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 overflow-hidden shadow-xl dark:shadow-2xl flex flex-col justify-end transition-transform hover:-translate-y-1 duration-500">
                  <div className="absolute inset-0 bg-gradient-to-t from-sky-500/5 dark:from-sky-500/10 via-transparent to-transparent"></div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-[80px]"></div>
                  
                  {/* Visual content: Chat bubble */}
                  <div className="relative z-10 w-full max-w-sm mx-auto space-y-4 mb-4">
                    <div className="w-10/12 ml-auto p-4 rounded-2xl rounded-tr-sm bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm shadow-md backdrop-blur">
                      Can you sync the new github MCP the team added?
                    </div>
                    <div className="flex items-end gap-3">
                      <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center flex-shrink-0 shadow-md">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                      </div>
                      <div className="flex-1 p-4 rounded-2xl rounded-bl-sm bg-gradient-to-br from-sky-50 dark:from-sky-600/20 to-sky-100/50 dark:to-sky-900/20 border border-sky-200 dark:border-sky-500/30 text-slate-700 dark:text-slate-300 text-sm shadow-lg backdrop-blur">
                        <p className="mb-3">I've run the <code className="text-sky-600 dark:text-sky-400 font-mono bg-sky-500/10 px-1 rounded">wasla sync</code> command for you.</p>
                        <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                          <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                          Stubs written to .gemini/mcp.json
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedContent>
        </div>
      </section>

      {/* Interactive CLI Terminal Section */}
      <section id="demo" className="max-w-4xl mx-auto px-6 py-16 z-10 relative">
        <h2 className="text-3xl font-bold text-center mb-4 tracking-tight text-slate-900 dark:text-white">
          See Wasla In Action
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-center mb-10 max-w-lg mx-auto">
          Click the tabs below to simulate how Wasla operates, synchronizes workspace
          configurations, and tracks changes in real time.
        </p>

        {/* Tab Controls */}
        <div className="flex justify-center space-x-2 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-950/80 border border-slate-300/40 dark:border-slate-900 max-w-sm mx-auto mb-6">
          {(['sync', 'status', 'watch'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              wasla {tab}
            </button>
          ))}
        </div>

        {/* Terminal Window */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/90 dark:bg-slate-950 overflow-hidden shadow-2xl backdrop-blur-md">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-200/60 dark:bg-slate-900/60 border-b border-slate-200 dark:border-white/5">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-500 font-mono">
              wasla - terminal emulator
            </div>
            <div className="w-8"></div>
          </div>

          {/* Terminal Console */}
          <div className="p-6 font-mono text-sm leading-relaxed text-slate-700 dark:text-slate-300 min-h-[320px] overflow-y-auto max-h-[400px]">
            {terminalContent[activeTab].map((line, idx) => {
              let colorClass = 'text-slate-700 dark:text-slate-300';
              if (line.type === 'cmd') colorClass = 'text-sky-600 dark:text-sky-400 font-semibold';
              if (line.type === 'success') colorClass = 'text-emerald-600 dark:text-emerald-400';
              if (line.type === 'warning') colorClass = 'text-amber-600 dark:text-amber-400';
              if (line.type === 'write') colorClass = 'text-cyan-600 dark:text-cyan-400';
              if (line.type === 'info') colorClass = 'text-slate-500 dark:text-slate-400';

              return (
                <div key={idx} className={`${colorClass} mb-1.5`}>
                  {line.text}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 z-10 relative">
        <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight mb-4 text-slate-900 dark:text-white">
          Built for High-Velocity Agent Development
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-center mb-16 max-w-xl mx-auto">
          Synchronize your custom system instructions and tools natively, without maintaining messy
          duplicates or creating complex symlinks.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <SpotlightCard className="p-8" spotlightColor="rgba(14, 131, 205, 0.12)">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-6">
              <svg
                className="w-6 h-6 text-sky-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
              Latest is Greatest
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-light text-sm">
              We sync based on file timestamps. The most recently updated file instantly overrides
              and updates other setups, ensuring you always run the latest version.
            </p>
          </SpotlightCard>

          <SpotlightCard className="p-8" spotlightColor="rgba(34, 211, 238, 0.12)">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6">
              <svg
                className="w-6 h-6 text-cyan-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
              Native Integration
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-light text-sm">
              Rather than using imports or symlinks, Wasla creates native copies or stubs marked
              with `wasla-stub` comments, ensuring perfect compatibility with all IDEs.
            </p>
          </SpotlightCard>

          <SpotlightCard className="p-8" spotlightColor="rgba(16, 185, 129, 0.12)">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
              <svg
                className="w-6 h-6 text-emerald-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
              Isolated Scopes
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-light text-sm">
              Separate your rules cleanly. Work locally with project-scoped configurations inside
              `.claude/` and `.gemini/` relative to CWD, or globally using user directories.
            </p>
          </SpotlightCard>
        </div>
      </section>

      {/* Visualizer Dashboard Section */}
      <section
        id="visualizer"
        className="max-w-6xl mx-auto px-6 py-20 z-10 relative border-t border-slate-200 dark:border-white/5"
      >
        <h2 className="text-3xl font-bold text-center tracking-tight mb-4 text-slate-900 dark:text-white">
          Interactive Visualizer Dashboard
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-center mb-12 max-w-xl mx-auto">
          See your entire sync topology at a glance. Drag-and-drop agents and MCPs between
          providers, inspect content, and manage connections — all from one dashboard.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Visualizer Mock */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/90 dark:bg-slate-950 overflow-hidden shadow-2xl backdrop-blur-md">
            {/* Window Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-200/60 dark:bg-slate-900/60 border-b border-slate-200 dark:border-white/5">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-500 font-mono">
                wasla visualizer — localhost:3457
              </div>
              <div className="w-8"></div>
            </div>

            {/* Mock Orbit Layout */}
            <div className="p-6 relative" style={{ height: '360px' }}>
              {/* SVG connector lines — drawn first so cards sit on top */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" fill="none">
                <line
                  x1="50%"
                  y1="58%"
                  x2="16%"
                  y2="22%"
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  className="text-sky-400/30"
                />
                <line
                  x1="50%"
                  y1="58%"
                  x2="50%"
                  y2="6%"
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  className="text-sky-400/30"
                />
                <line
                  x1="50%"
                  y1="58%"
                  x2="84%"
                  y2="22%"
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  className="text-sky-400/30"
                />
              </svg>

              {/* Center Registry Hub */}
              <div
                className="absolute z-10 left-1/2 -translate-x-1/2"
                style={{ top: '48%', transform: 'translate(-50%, -50%)' }}
              >
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-600/20 border-2 border-sky-500/40 flex flex-col items-center justify-center gap-1 shadow-[0_0_40px_rgba(14,165,233,0.15)]">
                  <img
                    src={asset('img/logo-transparent.png')}
                    className="w-8 h-8 rounded-lg bg-[#0e83cd] p-1 object-contain"
                    alt="Wasla"
                  />
                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                    Registry
                  </span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400">
                    3 agents · 2 MCPs
                  </span>
                </div>
              </div>

              {/* Orbiting provider cards */}
              {[
                { name: 'Claude', slug: 'claude', left: '12%', top: '8%' },
                { name: 'Gemini', slug: 'gemini', left: '50%', top: '0%' },
                { name: 'Cursor', slug: 'cursor', left: '88%', top: '8%' },
              ].map((p) => (
                <div
                  key={p.slug}
                  className="absolute z-10 w-20 sm:w-24 transition-transform hover:scale-110"
                  style={{ left: p.left, top: p.top, transform: 'translateX(-50%)' }}
                >
                  <div className="w-full px-2 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-lg flex flex-col items-center gap-1">
                    <img
                      src={asset(`img/${p.slug}.png`)}
                      className="w-5 h-5 object-contain"
                      alt={p.name}
                    />
                    <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                      {p.name}
                    </span>
                  </div>
                </div>
              ))}

              {/* Bottom row — additional providers */}
              {[
                { name: 'OpenCode', slug: 'opencode', left: '18%', top: '80%' },
                { name: 'VS Code', slug: 'vscode', left: '50%', top: '88%' },
                { name: 'Copilot', slug: 'copilot', left: '82%', top: '80%' },
              ].map((p) => (
                <div
                  key={p.slug}
                  className="absolute z-10 w-20 sm:w-24 transition-transform hover:scale-110"
                  style={{ left: p.left, top: p.top, transform: 'translateX(-50%)' }}
                >
                  <div className="w-full px-2 py-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-white/5 shadow-md flex flex-col items-center gap-1 opacity-60">
                    <img
                      src={asset(`img/${p.slug}.png`)}
                      className="w-4 h-4 object-contain"
                      alt={p.name}
                    />
                    <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400">
                      {p.name}
                    </span>
                  </div>
                </div>
              ))}

              {/* Bottom connector lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" fill="none">
                <line
                  x1="50%"
                  y1="62%"
                  x2="18%"
                  y2="84%"
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  className="text-sky-400/20"
                />
                <line
                  x1="50%"
                  y1="62%"
                  x2="50%"
                  y2="90%"
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  className="text-sky-400/20"
                />
                <line
                  x1="50%"
                  y1="62%"
                  x2="82%"
                  y2="84%"
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  className="text-sky-400/20"
                />
              </svg>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-sky-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  Orbit View Topology
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  See every provider arranged around a central registry hub with real-time
                  connection lines showing sync state.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-cyan-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">Drag & Drop Sync</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  Drag agents and MCPs between provider cards to attach or detach them instantly —
                  changes sync to disk in real time.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">Content Inspector</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  Click any entity to preview its full content — agent instructions, skill
                  definitions, or MCP server configs.
                </p>
              </div>
            </div>

            <div className="flex items-center bg-white dark:bg-slate-950 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-900 font-mono text-sm justify-between shadow-sm mt-4">
              <span className="text-slate-700 dark:text-slate-300">wasla visualizer</span>
              <button
                onClick={() => handleCopy('wasla visualizer')}
                className="text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300 text-xs font-semibold"
              >
                {copiedText === 'wasla visualizer' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section
        id="quickstart"
        className="max-w-4xl mx-auto px-6 py-20 z-10 relative border-t border-slate-200 dark:border-white/5"
      >
        <h2 className="text-3xl font-bold text-center tracking-tight mb-4 text-slate-900 dark:text-white">
          Quick Start Guide
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-center mb-12 max-w-md mx-auto">
          Get up and running with Wasla in three quick commands.
        </p>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-sm">
                1
              </span>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">Install Wasla</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Install globally or run via npx — works immediately.
                </p>
              </div>
            </div>
            <div className="flex items-center bg-white dark:bg-slate-950 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-900 w-full md:w-auto font-mono text-sm justify-between shadow-sm">
              <span className="text-slate-700 dark:text-slate-300 mr-4">
                npx @untitled-devs/wasla install
              </span>
              <button
                onClick={() => handleCopy('npx @untitled-devs/wasla install')}
                className="text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300 text-xs font-semibold"
              >
                {copiedText === 'npx @untitled-devs/wasla install' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-sm">
                2
              </span>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  Set Up A Provider
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Analyzes modification dates and syncs all config directories.
                </p>
              </div>
            </div>
            <div className="flex items-center bg-white dark:bg-slate-950 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-900 w-full md:w-auto font-mono text-sm justify-between shadow-sm">
              <span className="text-slate-700 dark:text-slate-300 mr-4">
                wasla setup gemini --scope workspace
              </span>
              <button
                onClick={() => handleCopy('wasla setup gemini --scope workspace')}
                className="text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300 text-xs font-semibold"
              >
                {copiedText === 'wasla setup gemini --scope workspace' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-sm">
                3
              </span>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  Enable Auto-Sync Watcher
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Starts a hot-reloading background sync whenever edits are saved.
                </p>
              </div>
            </div>
            <div className="flex items-center bg-white dark:bg-slate-950 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-900 w-full md:w-auto font-mono text-sm justify-between shadow-sm">
              <span className="text-slate-700 dark:text-slate-300 mr-4">wasla watch</span>
              <button
                onClick={() => handleCopy('wasla watch')}
                className="text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300 text-xs font-semibold"
              >
                {copiedText === 'wasla watch' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Open Source CTA */}
      <section className="max-w-3xl mx-auto px-6 py-16 z-10 relative text-center">
        <div className="glass-panel rounded-2xl p-10 border border-slate-200 dark:border-white/5">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 text-slate-900 dark:text-white">
            Open Source & Community Driven
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto text-sm leading-relaxed">
            Wasla is MIT-licensed and built in the open. Contributions, issues, and feedback are
            always welcome.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Magnetic>
              <a
                href="https://github.com/The-Untitled-Org/wasla"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm transition-all hover:opacity-90 shadow-lg"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                Star on GitHub
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href="https://github.com/The-Untitled-Org/wasla/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800/80"
              >
                Contributing Guide
              </a>
            </Magnetic>
          </div>
        </div>
      </section>

      {/* What Gets Synced */}
      <section className="max-w-4xl mx-auto px-6 pb-16 z-10 relative">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {[
            { label: 'Agents', icon: '🤖' },
            { label: 'Skills', icon: '⚡' },
            { label: 'MCP Servers', icon: '🔧' },
            { label: 'Context Files', icon: '📄' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 text-sm font-medium text-slate-600 dark:text-slate-400"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
          <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">
            — all synced automatically
          </span>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-panel border-t border-slate-200 dark:border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <div className="flex items-center space-x-2">
            <img
              src={asset('img/logo-transparent.png')}
              className="w-5 h-5 rounded bg-[#0e83cd] p-0.5 object-contain"
              alt="Wasla"
            />
            <span>
              © {new Date().getFullYear()} Wasla (The Untitled Org). Released under the MIT License.
            </span>
          </div>
          <div className="flex space-x-6">
            <a
              href="https://the-untitled-org.github.io/wasla/docs/"
              className="hover:text-slate-700 dark:hover:text-slate-400 transition-colors"
            >
              Documentation
            </a>
            <a
              href="https://the-untitled-org.github.io/wasla/docs/blog"
              className="hover:text-slate-700 dark:hover:text-slate-400 transition-colors"
            >
              Blog
            </a>
            <a
              href="https://www.npmjs.com/package/@untitled-devs/wasla"
              className="hover:text-slate-700 dark:hover:text-slate-400 transition-colors"
            >
              NPM Package
            </a>
            <a
              href="https://github.com/The-Untitled-Org/wasla"
              className="hover:text-slate-700 dark:hover:text-slate-400 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://github.com/The-Untitled-Org/wasla/blob/main/LICENSE"
              className="hover:text-slate-700 dark:hover:text-slate-400 transition-colors"
            >
              License
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
