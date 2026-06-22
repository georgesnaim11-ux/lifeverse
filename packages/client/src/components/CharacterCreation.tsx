import { useState } from 'react';
import type { CharacterCreationInput } from '@lifeverse/shared';
import { GAME_CONSTANTS, STAT_KEYS } from '@lifeverse/shared';

interface Props {
  onCreate: (input: CharacterCreationInput) => void;
  isLoading: boolean;
  error: string | null;
}

const STAT_LABELS: Record<string, string> = {
  health: 'Health', intelligence: 'Intelligence', happiness: 'Happiness',
  looks: 'Looks',
};

const BASELINE = GAME_CONSTANTS.stat.baseline;
const BUDGET = GAME_CONSTANTS.creation.pointBudget;
const MAX_STAT = GAME_CONSTANTS.creation.maxStartingStat;

export function CharacterCreation({ onCreate, isLoading, error }: Props): JSX.Element {
  const [name, setName] = useState('');
  const [allocation, setAllocation] = useState<Record<string, number>>(
    Object.fromEntries(STAT_KEYS.map((k) => [k, BASELINE])),
  );

  const spent = STAT_KEYS.reduce((sum, k) => sum + Math.max(0, (allocation[k] ?? BASELINE) - BASELINE), 0);
  const remaining = BUDGET - spent;

  function setStatValue(stat: string, value: number): void {
    const current = allocation[stat] ?? BASELINE;
    const currentBonus = Math.max(0, current - BASELINE);
    const newBonus = Math.max(0, value - BASELINE);
    const diff = newBonus - currentBonus;
    if (diff > remaining) return;
    setAllocation((prev) => ({ ...prev, [stat]: Math.min(MAX_STAT, Math.max(BASELINE, value)) }));
  }

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name: name.trim(), statAllocation: allocation });
  }

  return (
    <div className="creation-wrap">
      <h1 className="creation-title">Create Your Character</h1>
      <p className="creation-sub">Your story begins here. Choose wisely — some decisions echo for a lifetime.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="char-name">Your Name</label>
          <input
            id="char-name"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name…"
            maxLength={40}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Distribute Starting Stats</label>
          <p className="budget-info">
            {remaining} points remaining (distributable above the baseline of {BASELINE})
          </p>
          <div className="stat-allocation">
            {STAT_KEYS.map((stat) => (
              <div className="alloc-row" key={stat}>
                <span className="alloc-label">{STAT_LABELS[stat]}</span>
                <input
                  type="range"
                  className="alloc-slider"
                  min={BASELINE}
                  max={MAX_STAT}
                  value={allocation[stat] ?? BASELINE}
                  onChange={(e) => setStatValue(stat, Number(e.target.value))}
                />
                <span className="alloc-value">{allocation[stat] ?? BASELINE}</span>
              </div>
            ))}
          </div>
        </div>
        {error && <p style={{ color: 'var(--danger)', marginBottom: 16, fontSize: 13 }}>{error}</p>}
        <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={isLoading || !name.trim()}>
          {isLoading ? 'Creating…' : 'Begin Life →'}
        </button>
      </form>
    </div>
  );
}
