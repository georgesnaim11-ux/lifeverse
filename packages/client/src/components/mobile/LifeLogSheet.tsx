import { BottomSheet } from './BottomSheet';
import type { EventLogEntry } from '@lifeverse/shared';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  entries: EventLogEntry[];
}

export function LifeLogSheet({ isOpen, onClose, entries }: Props): JSX.Element {
  const sorted = [...entries].sort((a, b) => b.ageAtEvent - a.ageAtEvent);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Life Story">
      {sorted.length === 0 ? (
        <p style={{ color: 'var(--muted)', padding: '24px 0', textAlign: 'center', fontSize: 14 }}>
          Your story hasn't begun yet. Age up and make choices.
        </p>
      ) : (
        sorted.map((entry) => (
          <div key={entry.id} className="lv-log-entry">
            <div className="lv-log-age">Age {entry.ageAtEvent}</div>
            <div className="lv-log-text">{entry.outcomeText}</div>
          </div>
        ))
      )}
    </BottomSheet>
  );
}
