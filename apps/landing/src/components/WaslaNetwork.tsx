interface ProviderNode {
  name: string;
  slug: string;
  color: string;
  x: number;
  y: number;
  labelSide: 'left' | 'right';
}

const center = { x: 500, y: 180 };

const providers: ProviderNode[] = [
  { name: 'Claude Code', slug: 'claude', color: '#d97757', x: 118, y: 72, labelSide: 'left' },
  { name: 'Gemini CLI', slug: 'gemini', color: '#8e75b2', x: 866, y: 62, labelSide: 'right' },
  { name: 'Cursor', slug: 'cursor', color: '#52525b', x: 246, y: 188, labelSide: 'left' },
  { name: 'OpenCode', slug: 'opencode', color: '#10b981', x: 754, y: 174, labelSide: 'right' },
  { name: 'GitHub Copilot', slug: 'copilot', color: '#8957e5', x: 156, y: 302, labelSide: 'left' },
  { name: 'Copilot CLI', slug: 'copilot-cli', color: '#6366f1', x: 500, y: 320, labelSide: 'right' },
  { name: 'OpenClaw', slug: 'openclaw', color: '#dd2e44', x: 846, y: 290, labelSide: 'right' },
];

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export default function WaslaNetwork() {
  return (
    <div className="network-visual relative w-full max-w-[1100px] overflow-visible">
      <div className="network-stage relative mx-auto">
        <svg
          className="absolute inset-0 h-full w-full overflow-visible"
          viewBox="0 0 1000 360"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="network-line" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.08" />
              <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.16" />
            </linearGradient>
            <filter id="node-glow">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {providers.map((provider) => (
            <g key={provider.name}>
              <path
                d={`M ${center.x} ${center.y} C ${(center.x + provider.x) / 2} ${center.y}, ${(center.x + provider.x) / 2} ${provider.y}, ${provider.x} ${provider.y}`}
                fill="none"
                stroke="url(#network-line)"
                strokeWidth="1.4"
              />
              <circle
                cx={provider.x}
                cy={provider.y}
                r="3"
                fill={provider.color}
                opacity="0.7"
                filter="url(#node-glow)"
              />
            </g>
          ))}

          <circle cx={center.x} cy={center.y} r="88" fill="none" stroke="#38bdf8" strokeOpacity="0.09" />
          <circle cx={center.x} cy={center.y} r="132" fill="none" stroke="#38bdf8" strokeOpacity="0.05" />
        </svg>

        <div
          className="absolute z-20 flex h-24 w-24 flex-col items-center justify-center rounded-full border border-sky-400/20 bg-white/85 text-center shadow-[0_0_50px_rgba(14,165,233,0.22)] backdrop-blur-md dark:bg-[#04101e]/90"
          style={{ left: center.x - 48, top: center.y - 48 }}
        >
          <div className="absolute inset-2 rounded-full border border-sky-400/10" />
          <img
            src={asset('img/logo-transparent.png')}
            className="h-12 w-12 rounded-xl bg-[#0e83cd] p-2 object-contain select-none shadow-md shadow-sky-500/20 relative z-10"
            alt="Wasla"
          />
        </div>

        {providers.map((provider, index) => (
          <div
            key={provider.name}
            className="provider-node absolute z-30 flex items-center gap-2"
            style={{
              left: provider.x,
              top: provider.y,
              transform:
                provider.labelSide === 'left' ? 'translate(-100%, -50%)' : 'translate(0, -50%)',
            }}
          >
            {provider.labelSide === 'left' && (
              <span className="provider-label">{provider.name}</span>
            )}
            <div
              className="provider-mark"
              style={{
                borderColor: `${provider.color}55`,
                boxShadow: `0 8px 22px ${provider.color}20`,
                animationDelay: `${index * 0.25}s`,
              }}
            >
              <img src={asset(`img/${provider.slug}.png`)} alt="" className="h-6 w-6 object-contain" />
            </div>
            {provider.labelSide === 'right' && (
              <span className="provider-label">{provider.name}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
