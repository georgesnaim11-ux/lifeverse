import { TRAIT_REGISTRY } from '@lifeverse/shared';
import type { TraitKey } from '@lifeverse/shared';

interface Props {
  traitKey: TraitKey;
}

export function TraitBadge({ traitKey }: Props): JSX.Element {
  const def = TRAIT_REGISTRY[traitKey];
  return (
    <div
      title={def.description}
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        background: 'rgba(124,106,237,0.15)',
        color: 'var(--accent)',
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 700,
        cursor: 'help',
        margin: '2px',
      }}
    >
      {def.label}
    </div>
  );
}
