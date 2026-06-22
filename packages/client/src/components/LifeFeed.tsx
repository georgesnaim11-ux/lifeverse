import type { EventLogEntry } from '@lifeverse/shared';
import { useEffect, useRef } from 'react';

interface Props {
  entries: EventLogEntry[];
}

export function LifeFeed({ entries }: Props): JSX.Element {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  if (entries.length === 0) {
    return <p className="feed-empty">Your story hasn't begun yet. Age up to start living.</p>;
  }

  return (
    <div className="feed">
      {entries.map((entry) => (
        <div className="feed-entry" key={entry.id}>
          <div className="feed-age">Age {entry.ageAtEvent}</div>
          <div className="feed-text">{entry.outcomeText}</div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
