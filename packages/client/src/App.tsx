import './index.css';
import { useState } from 'react';
import { useGame } from './hooks/useGame';
import { MobileGameLayout } from './components/mobile/MobileGameLayout';
import { GAME_CONSTANTS, STAT_KEYS, COUNTRIES, DEFAULT_COUNTRY_ID } from '@lifeverse/shared';
import type { CharacterState, LifeSummary, CharacterCreationInput } from '@lifeverse/shared';

const BLANK_DOMAINS = {
  characterId: '', academic: 10, physical: 10, career: 0, social: 10, creative: 5, mental: 20,
  academicMomentum: 0, physicalMomentum: 0, careerMomentum: 0,
  socialMomentum: 0, creativeMomentum: 0, mentalMomentum: 0,
  academicNeglect: 0, physicalNeglect: 0, careerNeglect: 0,
  socialNeglect: 0, creativeNeglect: 0, mentalNeglect: 0, updatedAt: '',
};

const BLANK_RESOURCES = {
  characterId: '', totalTimeSlots: 3, usedTimeSlots: 0,
  mentalEnergy: 80, physicalEnergy: 80, mentalEnergyMax: 100, physicalEnergyMax: 100,
  consecutiveLowMentalYears: 0, burnoutState: false, updatedAt: '',
};

const BASELINE = GAME_CONSTANTS.stat.baseline;
const BUDGET   = GAME_CONSTANTS.creation.pointBudget;
const MAX_STAT = GAME_CONSTANTS.creation.maxStartingStat;

const STAT_LABELS: Record<string, string> = {
  health: 'Health', intelligence: 'Intelligence', happiness: 'Happiness',
  looks: 'Looks',
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
}

/* ─── Home ──────────────────────────────────────────────────── */
function HomeScreen({
  onStart,
  onResume,
  hasSavedGame,
  isLoading,
}: {
  onStart: () => void;
  onResume: () => void;
  hasSavedGame: boolean;
  isLoading: boolean;
}): JSX.Element {
  return (
    <div className="lv-home">
      <div className="lv-home-logo">LifeVerse</div>
      <div className="lv-home-tagline">Live a life. Build a legacy. No two stories are the same.</div>
      <div className="lv-home-features">
        {[
          { icon: '🎯', title: 'Every Choice Matters', desc: 'Decisions echo across decades of your life' },
          { icon: '🧬', title: 'Personality & Domains', desc: 'Your traits and skills unlock unique paths' },
          { icon: '📖', title: 'Emergent Stories', desc: 'Threads and consequences create your saga' },
        ].map((f) => (
          <div key={f.title} className="lv-home-feature">
            <span className="lv-home-feature-icon">{f.icon}</span>
            <div>
              <div className="lv-home-feature-title">{f.title}</div>
              <div className="lv-home-feature-desc">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
      {hasSavedGame && (
        <button
          className="lv-btn lv-btn-primary"
          style={{ maxWidth: 320 }}
          onClick={onResume}
          disabled={isLoading}
        >
          {isLoading ? 'Loading…' : 'Continue Life →'}
        </button>
      )}
      <button
        className={hasSavedGame ? 'lv-btn' : 'lv-btn lv-btn-primary'}
        style={{ maxWidth: 320, marginTop: hasSavedGame ? 10 : 0 }}
        onClick={onStart}
        disabled={isLoading}
      >
        {hasSavedGame ? 'Start New Life' : 'Begin a New Life →'}
      </button>
    </div>
  );
}

/* ─── Character Creation ─────────────────────────────────────── */
function CharacterCreation({
  onCreate, isLoading, error,
}: {
  onCreate: (input: CharacterCreationInput) => void;
  isLoading: boolean;
  error: string | null;
}): JSX.Element {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [country, setCountry] = useState<string>(DEFAULT_COUNTRY_ID);
  const [allocation, setAllocation] = useState<Record<string, number>>(
    Object.fromEntries(STAT_KEYS.map((k) => [k, BASELINE])),
  );

  const spent = STAT_KEYS.reduce((s, k) => s + Math.max(0, (allocation[k] ?? BASELINE) - BASELINE), 0);
  const remaining = BUDGET - spent;

  function setStatValue(stat: string, val: number): void {
    const cur = allocation[stat] ?? BASELINE;
    const diff = Math.max(0, val - BASELINE) - Math.max(0, cur - BASELINE);
    if (diff > remaining) return;
    setAllocation((p) => ({ ...p, [stat]: Math.min(MAX_STAT, Math.max(BASELINE, val)) }));
  }

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name: name.trim(), gender, country, statAllocation: allocation });
  }

  return (
    <div className="lv-creation">
      <div className="lv-creation-title">New Life</div>
      <div className="lv-creation-sub">Shape who you are before the world does.</div>
      <form onSubmit={handleSubmit}>
        <div className="lv-form-group">
          <label className="lv-label" htmlFor="name">First Name</label>
          <input
            id="name" className="lv-input" value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your first name…" maxLength={40} required
          />
        </div>

        <div className="lv-form-group">
          <label className="lv-label">Gender</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {(['male', 'female'] as const).map((g) => (
              <button
                key={g} type="button" onClick={() => setGender(g)}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  border: `2px solid ${gender === g ? 'var(--accent)' : 'var(--border)'}`,
                  background: gender === g ? 'var(--accent-glow)' : 'var(--card)',
                  color: gender === g ? 'var(--accent)' : 'var(--text-dim)',
                }}
              >
                {g === 'male' ? '♂ Male' : '♀ Female'}
              </button>
            ))}
          </div>
        </div>

        <div className="lv-form-group">
          <label className="lv-label" htmlFor="country">Country</label>
          <select
            id="country" className="lv-input" value={country}
            onChange={(e) => setCountry(e.target.value)}
            style={{ appearance: 'auto' }}
          >
            {COUNTRIES.map((c) => (
              <option key={c.id} value={c.id}>{c.flag} {c.label}</option>
            ))}
          </select>
        </div>
        <div className="lv-form-group">
          <label className="lv-label">Starting Stats</label>
          <div className="lv-budget-text">
            {remaining} points remaining — drag to distribute above baseline of {BASELINE}
          </div>
          <div className="lv-budget-bar">
            <div className="lv-budget-fill" style={{ width: `${(spent / BUDGET) * 100}%` }} />
          </div>
          {STAT_KEYS.map((stat) => (
            <div key={stat} className="lv-alloc-row">
              <span className="lv-alloc-label">{STAT_LABELS[stat]}</span>
              <input
                type="range" className="lv-alloc-slider"
                min={BASELINE} max={MAX_STAT}
                value={allocation[stat] ?? BASELINE}
                onChange={(e) => setStatValue(stat, Number(e.target.value))}
              />
              <span className="lv-alloc-value">{allocation[stat] ?? BASELINE}</span>
            </div>
          ))}
        </div>
        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(240,92,92,0.1)', border: '1px solid var(--danger)', borderRadius: 10, fontSize: 13, color: 'var(--danger)', marginBottom: 16 }}>
            {error}
          </div>
        )}
        <button type="submit" className="lv-btn lv-btn-primary" disabled={isLoading || !name.trim()} style={{ marginBottom: 40 }}>
          {isLoading ? 'Creating…' : 'Begin Life →'}
        </button>
      </form>
    </div>
  );
}

/* ─── Tombstone / Life Summary ───────────────────────────────── */
function GameOverScreen({
  charState, summary, onRestart,
}: {
  charState: CharacterState;
  summary: LifeSummary | null;
  onRestart: () => void;
}): JSX.Element {
  const name = summary?.name ?? charState.character.name;
  const birthYear = summary?.birthYear ?? charState.character.birthYear;
  const deathYear = summary?.deathYear ?? (charState.character.birthYear + charState.character.age);

  const rows: Array<{ label: string; value: string }> = summary ? [
    { label: 'Cause of Death', value: summary.causeOfDeath },
    { label: 'Net Worth', value: fmt(summary.netWorth) },
    { label: 'Career', value: summary.careerTitle },
    { label: 'Education', value: summary.educationLevel },
    { label: 'Relationship', value: summary.relationshipStatus },
    ...(summary.childrenCount > 0 ? [{ label: 'Children', value: String(summary.childrenCount) }] : []),
  ] : [];

  return (
    <div className="lv-gameover" style={{ justifyContent: 'flex-start', paddingTop: 'calc(var(--safe-top) + 32px)', overflowY: 'auto' }}>
      {/* Tombstone */}
      <div style={{
        width: '100%', maxWidth: 360, background: 'var(--card)',
        border: '1px solid var(--border)', borderRadius: '120px 120px 16px 16px',
        padding: '36px 24px 28px', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
      }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.2em', fontWeight: 700 }}>IN MEMORY OF</div>
        <div style={{ fontSize: 26, fontWeight: 900, margin: '8px 0 4px' }}>{name}</div>
        <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 12 }}>{birthYear} — {deathYear}</div>
        {summary && (
          <div style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--accent)', lineHeight: 1.5, padding: '0 8px' }}>
            {summary.epitaph}
          </div>
        )}
        <div style={{ fontSize: 30, margin: '14px 0 4px' }}>🕊️</div>
      </div>

      {/* Legacy rank + score */}
      {summary && (
        <div style={{
          width: '100%', maxWidth: 360, marginTop: 18, padding: '16px',
          background: 'var(--card)', border: '1px solid var(--accent-dim)', borderRadius: 14, textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Legacy</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--accent)', margin: '4px 0' }}>{summary.legacy.rank}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Score: {summary.legacy.total} / 120</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 12 }}>
            {[
              { k: 'Wealth', v: summary.legacy.wealth },
              { k: 'Education', v: summary.legacy.education },
              { k: 'Happiness', v: summary.legacy.happiness },
              { k: 'Career', v: summary.legacy.career },
              { k: 'Family', v: summary.legacy.relationships },
              { k: 'Achievements', v: summary.legacy.achievements },
            ].map((p) => (
              <span key={p.k} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: 'var(--card-hover)', color: 'var(--text-dim)' }}>
                {p.k} {p.v}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detail rows */}
      {summary && (
        <div style={{ width: '100%', maxWidth: 360, marginTop: 16 }}>
          {rows.map((r) => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 4px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>{r.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, textAlign: 'right', maxWidth: '60%' }}>{r.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Life highlights timeline */}
      {summary && summary.highlights.length > 0 && (
        <div style={{ width: '100%', maxWidth: 360, marginTop: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 10 }}>
            Life Highlights
          </div>
          {summary.highlights.map((h, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '7px 0' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', minWidth: 48 }}>Age {h.age}</span>
              <span style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.4 }}>{h.text}</span>
            </div>
          ))}
        </div>
      )}

      <p style={{ color: 'var(--muted)', maxWidth: 320, lineHeight: 1.7, fontSize: 13, marginTop: 20 }}>
        Lived to age {summary?.ageAtDeath ?? charState.character.age}. Every life tells a story — this one was yours.
      </p>
      <button className="lv-btn lv-btn-primary" style={{ maxWidth: 320, marginTop: 8, marginBottom: 24 }} onClick={onRestart}>
        Start a New Life →
      </button>
    </div>
  );
}

/* ─── Root App ───────────────────────────────────────────────── */
export function App(): JSX.Element {
  const game = useGame();

  const domains = game.fullData?.domains ?? BLANK_DOMAINS;
  const resources = game.fullData?.resources ?? BLANK_RESOURCES;
  const availableActivities = game.fullData?.availableActivities ?? [];

  function handleSave(): void {
    if (!game.charState) return;
    void fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId: game.charState.character.id }),
    });
  }

  return (
    <div className="lv-app">
      {game.phase === 'home' && (
        <HomeScreen
          onStart={game.startCreation}
          onResume={game.resumeGame}
          hasSavedGame={game.hasSavedGame}
          isLoading={game.isLoading}
        />
      )}

      {game.phase === 'creating' && (
        <CharacterCreation
          onCreate={game.createCharacter}
          isLoading={game.isLoading}
          error={game.error}
        />
      )}

      {game.phase === 'dead' && game.charState && (
        <GameOverScreen
          charState={game.charState}
          summary={game.lifeSummary}
          onRestart={game.resetGame}
        />
      )}

      {(game.phase === 'playing' || game.phase === 'events' || game.phase === 'outcome') && game.charState && game.fullData && (
        <MobileGameLayout
          charState={game.charState}
          fullData={game.fullData}
          domains={domains}
          resources={resources}
          availableActivities={availableActivities}
          job={game.fullData.job ?? null}
          eligibleJobs={game.fullData.eligibleJobs ?? []}
          phase={game.phase as 'playing' | 'events' | 'outcome'}
          pendingEvents={game.pendingEvents}
          currentEventIndex={game.currentEventIndex}
          lastOutcome={game.lastOutcome}
          newAchievements={game.newAchievements}
          isLoading={game.isLoading}
          error={game.error}
          actionMessage={game.actionMessage}
          onAgeUp={game.ageUp}
          onPerformActivity={game.performActivity}
          onMakeChoice={game.makeChoice}
          onContinueAfterOutcome={game.continueAfterOutcome}
          onDismissAchievements={game.dismissAchievements}
          onClearMessage={game.clearMessage}
          onSave={handleSave}
          onApplyJob={game.applyJob}
          onPromote={game.promote}
          onWorkHard={game.workHard}
          onQuitJob={game.quitJob}
          onEnroll={game.enroll}
          onStudy={game.study}
          onAttendClass={game.attendClass}
          onTakeExam={game.takeExam}
          onBuyCar={game.buyCar}
          onSellVehicle={game.sellVehicle}
          onSetPrimaryVehicle={game.setPrimaryVehicle}
          onServiceVehicle={game.serviceVehicle}
          onRepairVehicle={game.repairVehicle}
          onWashVehicle={game.washVehicle}
          onRentProperty={game.rentProperty}
          onBuyHome={game.buyHome}
          onSellProperty={game.sellProperty}
          onSetResidence={game.setResidence}
          onToggleRentOut={game.toggleRentOut}
          onMoveInParents={game.moveInParents}
          onFindPartner={game.findPartner}
          onGoOnDate={game.goOnDate}
          onPropose={game.propose}
          onPlanWedding={game.planWedding}
          onDelayWedding={game.delayWedding}
          onCancelEngagement={game.cancelEngagement}
          onBreakUp={game.breakUp}
          onTryForBaby={game.tryForBaby}
          onToggleBirthControl={game.toggleBirthControl}
          onDivorce={game.divorce}
        />
      )}

      {!game.charState && game.isLoading && (
        <div className="lv-loading">Starting your life…</div>
      )}
    </div>
  );
}
