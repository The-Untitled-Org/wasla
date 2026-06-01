interface FloatingActionsProps {
  isDark: boolean;
  connected: boolean;
  onToggleTheme: () => void;
  onRefresh: () => void;
  onShutdown: () => void;
}

export function FloatingActions(props: FloatingActionsProps) {
  const { isDark, connected, onToggleTheme, onRefresh, onShutdown } = props;

  return (
    <div className="floating-actions">
      <span
        className={`connection-indicator ${connected ? 'connection-indicator-online' : ''}`}
        title={connected ? 'Connected to local system' : 'Disconnected'}
      >
        <span />
        {connected ? 'Live' : 'Offline'}
      </span>
      <button
        type="button"
        className="action-button"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={onToggleTheme}
      >
        {isDark ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.4 15.2A8.5 8.5 0 018.8 3.6 8.5 8.5 0 1020.4 15.2z" />
          </svg>
        )}
      </button>
      <button
        type="button"
        className="action-button"
        title="Reload canvas config"
        onClick={onRefresh}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 11a8.1 8.1 0 00-15.5-3M4 4v4h4m-4 5a8.1 8.1 0 0015.5 3m.5 4v-4h-4" />
        </svg>
      </button>
      <button
        type="button"
        className="action-button action-button-danger"
        title="Close visualizer"
        onClick={onShutdown}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2v10m5.1-6.1a8 8 0 11-10.2 0" />
        </svg>
      </button>
    </div>
  );
}
