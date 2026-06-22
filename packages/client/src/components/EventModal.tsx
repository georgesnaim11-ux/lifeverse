import type { PresentedEvent } from '@lifeverse/shared';

interface Props {
  presentedEvent: PresentedEvent;
  currentIndex: number;
  totalCount: number;
  onChoose: (eventId: string, choiceId: string) => void;
  isLoading: boolean;
}

const STAGE_LABELS: Record<string, string> = {
  childhood: 'Childhood', adolescence: 'Adolescence', young_adult: 'Young Adult',
  adult: 'Adult', senior: 'Senior', elder: 'Elder',
};

export function EventModal({ presentedEvent, currentIndex, totalCount, onChoose, isLoading }: Props): JSX.Element {
  const { event, ageAtEvent } = presentedEvent;
  const stageName = STAGE_LABELS[event.stages[0] ?? ''] ?? event.stages[0];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
        Age {ageAtEvent} — {totalCount > 1 ? `Event ${currentIndex + 1} of ${totalCount}` : 'An event unfolds'}
      </div>
      <div className="event-card">
        <div className="event-header">
          <div className="event-stage-badge">{stageName}</div>
          <div className="event-title">{event.title}</div>
          <div className="event-desc">{event.description}</div>
        </div>
        <div className="event-choices">
          {event.choices.map((choice) => (
            <button
              key={choice.id}
              className="choice-btn"
              onClick={() => onChoose(event.id, choice.id)}
              disabled={isLoading}
            >
              {choice.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
