import React from 'react';
import { createRoot } from 'react-dom/client';
import { VisualizerApp } from './VisualizerApp';
import './styles.css';

function AppRoot() {
  const [mode, setMode] = React.useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('wasla-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
    document.documentElement.style.colorScheme = mode;
    localStorage.setItem('wasla-theme', mode);
  }, [mode]);

  return (
    <VisualizerApp
      mode={mode}
      onToggleMode={() => setMode((prev) => (prev === 'light' ? 'dark' : 'light'))}
    />
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>
);
