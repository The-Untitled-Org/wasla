import type { DragEvent, MouseEvent } from 'react';
import type { VisualizerEntityType } from '#core/visualizer-types';

export type EntityInteractionPayload = {
  name: string;
  type: VisualizerEntityType;
  providerId: string;
};

export type ProviderCardData = {
  providerId: string;
  title: string;
  attachedByType: Record<VisualizerEntityType, string[]>;
  iconUrl?: string;
  isHub?: boolean;
  isInstalled?: boolean;
};

type ProviderCardProps = {
  data: ProviderCardData;
  isSetupPending?: boolean;
  onEntityDragStart: (payload: EntityInteractionPayload, event: DragEvent) => void;
  onEntityDrop: (targetProviderId: string, event: DragEvent) => void;
  onEntityDelete: (payload: EntityInteractionPayload) => void;
  onEntityClick: (payload: EntityInteractionPayload) => void;
  onSetupProvider: (providerId: string) => void;
};

const entityTypes = ['instruction', 'agent', 'skill', 'mcp'] as const;

function typeLabel(type: VisualizerEntityType): string {
  if (type === 'instruction') return 'Instructions';
  if (type === 'agent') return 'Agents';
  if (type === 'skill') return 'Skills';
  return 'MCPs';
}

export function ProviderCard({
  data,
  isSetupPending = false,
  onEntityDragStart,
  onEntityDrop,
  onEntityDelete,
  onEntityClick,
  onSetupProvider,
}: ProviderCardProps) {
  const stopDeleteClick = (event: MouseEvent, payload: EntityInteractionPayload) => {
    event.stopPropagation();
    onEntityDelete(payload);
  };

  if (data.isInstalled === false) {
    return (
      <article className="provider-card provider-card-unavailable">
        <div className="provider-node-header">
          <div className="provider-identity">
            {data.iconUrl ? (
              <img src={data.iconUrl} alt="" className="provider-node-avatar" />
            ) : null}
            <div>
              <h2>{data.title}</h2>
              <span className="provider-unavailable">Available provider</span>
            </div>
          </div>
          <span
            className="provider-node-status provider-node-status-unavailable"
            title="Not installed"
          />
        </div>
        <p className="provider-empty">Set up this provider to enable visual sync immediately.</p>
        <button
          type="button"
          className="provider-setup-button"
          onClick={() => onSetupProvider(data.providerId)}
          disabled={isSetupPending}
        >
          {isSetupPending ? 'Setting up...' : 'Set up provider'}
        </button>
      </article>
    );
  }

  return (
    <article
      className={['provider-card', data.isHub ? 'provider-card-hub' : ''].filter(Boolean).join(' ')}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={(event) => onEntityDrop(data.providerId, event)}
    >
      <div className="provider-node-header">
        <div className="provider-title-wrap">
          <div className="provider-identity">
            {data.iconUrl ? (
              <img src={data.iconUrl} alt="" className="provider-node-avatar" />
            ) : null}
            <h2>{data.title}</h2>
          </div>
        </div>
        <span className="provider-node-status" title="Installed" />
      </div>
      <div className="provider-groups">
        {entityTypes.map((type) => {
          const items = data.attachedByType[type] ?? [];
          if (!items.length) return null;
          return (
            <section key={type} className="provider-group">
              <h3 className="provider-group-title">{typeLabel(type)}</h3>
              <div className="provider-chip-wrap">
                {items.map((entity) => {
                  const payload = { name: entity, type, providerId: data.providerId };
                  return (
                    <span key={`${type}-${entity}`} className={`entity-chip entity-chip-${type}`}>
                      <button
                        type="button"
                        draggable
                        onDragStart={(event) => onEntityDragStart(payload, event)}
                        onClick={() => onEntityClick(payload)}
                      >
                        {entity}
                      </button>
                      {!data.isHub ? (
                        <button
                          type="button"
                          className="entity-chip-delete"
                          aria-label={`Detach ${entity}`}
                          title={`Detach ${entity}`}
                          onClick={(event) => stopDeleteClick(event, payload)}
                        >
                          <svg viewBox="0 0 20 20" aria-hidden="true">
                            <path d="M6 6l8 8m0-8-8 8" />
                          </svg>
                        </button>
                      ) : null}
                    </span>
                  );
                })}
              </div>
            </section>
          );
        })}
        {!Object.values(data.attachedByType).some((arr) => arr.length > 0) ? (
          <p className="provider-empty">No attached entities</p>
        ) : null}
      </div>
    </article>
  );
}
