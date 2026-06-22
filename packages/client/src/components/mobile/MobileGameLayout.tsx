import { useState, useEffect } from 'react';
import { ActivitySheet } from './ActivitySheet';
import { StatsSheet } from './StatsSheet';
import { LifeLogSheet } from './LifeLogSheet';
import { CareerSheet } from './CareerSheet';
import { EducationSheet } from './EducationSheet';
import { RelationshipsSheet } from './RelationshipsSheet';
import { FinanceSheet } from './FinanceSheet';
import { HousingSheet } from './HousingSheet';
import { GarageSheet } from './GarageSheet';
import { MAJORS, getCountry } from '@lifeverse/shared';
import type {
  CharacterState, GetCharacterResponse, PresentedEvent,
  EarnedAchievement, DomainState, CharacterResources,
  JobState, JobEligibility, HousingState, Listing, OwnedProperty, OwnedVehicle, VehicleListing,
} from '@lifeverse/shared';
import type { ActivityDefinition } from '@lifeverse/shared';

type Sheet = 'none' | 'activity' | 'stats' | 'log' | 'career' | 'education' | 'shopping' | 'garage' | 'love' | 'finance';
type Phase = 'playing' | 'events' | 'outcome';

interface Props {
  charState: CharacterState;
  fullData: GetCharacterResponse;
  domains: DomainState;
  resources: CharacterResources;
  availableActivities: ActivityDefinition[];
  job: JobState | null;
  eligibleJobs: JobEligibility[];
  phase: Phase;
  pendingEvents: PresentedEvent[];
  currentEventIndex: number;
  lastOutcome: string | null;
  newAchievements: EarnedAchievement[];
  isLoading: boolean;
  error: string | null;
  actionMessage: string | null;
  onAgeUp: () => void;
  onPerformActivity: (id: string) => void;
  onMakeChoice: (eventId: string, choiceId: string) => void;
  onContinueAfterOutcome: () => void;
  onDismissAchievements: () => void;
  onClearMessage: () => void;
  onSave: () => void;
  onApplyJob: (jobId: string) => void;
  onPromote: () => void;
  onWorkHard: () => void;
  onQuitJob: () => void;
  onEnroll: (level: 'trade' | 'university' | 'graduate', major?: string) => void;
  onStudy: () => void;
  onAttendClass: () => void;
  onTakeExam: () => void;
  onBuyCar: (modelKey: string, year: number, condition: string, primary: boolean) => void;
  onSellVehicle: (vehicleId: string) => void;
  onSetPrimaryVehicle: (vehicleId: string) => void;
  onServiceVehicle: (vehicleId: string) => void;
  onRepairVehicle: (vehicleId: string) => void;
  onWashVehicle: (vehicleId: string) => void;
  onRentProperty: (key: string) => void;
  onBuyHome: (key: string, moveIn?: boolean) => void;
  onSellProperty: (propertyId: string) => void;
  onSetResidence: (propertyId: string) => void;
  onToggleRentOut: (propertyId: string) => void;
  onMoveInParents: () => void;
  onFindPartner: () => void;
  onGoOnDate: () => void;
  onPropose: () => void;
  onPlanWedding: (tier: string) => void;
  onDelayWedding: () => void;
  onCancelEngagement: () => void;
  onBreakUp: () => void;
  onTryForBaby: () => void;
  onToggleBirthControl: () => void;
  onDivorce: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  childhood: 'Child', adolescence: 'Teen', young_adult: 'Young Adult',
  adult: 'Adult', senior: 'Senior', elder: 'Elder',
};

function moodEmoji(h: number): string {
  if (h >= 80) return '😄';
  if (h >= 60) return '😊';
  if (h >= 40) return '😐';
  if (h >= 20) return '😟';
  return '😢';
}

function fmt(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${sign}$${(abs / 1_000).toFixed(0)}k`;
  return `${sign}$${abs}`;
}

const STAT_CONFIG = [
  { key: 'health',       icon: '❤️',  color: 'var(--health)' },
  { key: 'happiness',    icon: '😊', color: 'var(--happiness)' },
  { key: 'intelligence', icon: '🧠', color: 'var(--intelligence)' },
  { key: 'looks',        icon: '✨', color: 'var(--looks)' },
] as const;

const ACHIEVEMENT_LABELS: Record<string, string> = {
  first_step: '👣 First Step', teenager: '🎒 Teenager', adult: '🎓 Adulthood',
  senior: '🎖 Senior Years', elder: '👑 Elder', scholar: '📚 Scholar',
  graduate: '🏛 Graduate', first_job: '💼 First Job', married: '💍 Married',
  parent: '👶 Parent', homeowner: '🏠 Homeowner', retired: '🌴 Retired',
  millionaire: '💰 Millionaire', promotion: '📈 Promoted', executive: '🏆 Executive',
  social_butterfly: '🦋 Social Butterfly', well_rounded: '⭐ Well Rounded',
  iron_discipline: '✨ Head Turner', mastermind: '🧠 Mastermind', beloved: '❤️ Beloved',
};

export function MobileGameLayout(props: Props): JSX.Element {
  const {
    charState, fullData, domains, resources, availableActivities,
    job, eligibleJobs, phase, pendingEvents, currentEventIndex,
    lastOutcome, newAchievements, isLoading, error, actionMessage,
    onAgeUp, onPerformActivity, onMakeChoice, onContinueAfterOutcome,
    onDismissAchievements, onClearMessage, onSave,
    onApplyJob, onPromote, onWorkHard, onQuitJob,
    onEnroll, onStudy, onAttendClass, onTakeExam,
    onBuyCar, onSellVehicle, onSetPrimaryVehicle, onServiceVehicle, onRepairVehicle, onWashVehicle,
    onRentProperty, onBuyHome, onSellProperty, onSetResidence, onToggleRentOut, onMoveInParents,
    onFindPartner, onGoOnDate, onPropose, onPlanWedding, onDelayWedding, onCancelEngagement, onBreakUp,
    onTryForBaby, onToggleBirthControl, onDivorce,
  } = props;

  const [sheet, setSheet] = useState<Sheet>('none');

  const { character, stats } = charState;
  const finance = fullData.finance;
  const summary = fullData.financeSummary;
  const netWorth = summary ? summary.netWorth : finance.cash - finance.totalDebt;
  const flags = fullData.flags ?? {};
  const countryFlag = getCountry(character.country)?.flag ?? '🌍';
  const housing: HousingState = fullData.housing ?? { characterId: character.id, tenure: 'parents', propertyKey: null, propertyLabel: null, tier: null, company: null, bedrooms: 0, bathrooms: 0, condition: null, monthlyExpense: 0, currentValue: 0, purchasePrice: 0, purchaseAge: null, appreciationRate: 0, residencePropertyId: null };
  const listings: Listing[] = fullData.listings ?? [];
  const properties: OwnedProperty[] = fullData.properties ?? [];
  const garage: OwnedVehicle[] = fullData.garage ?? [];
  const dealership: VehicleListing[] = fullData.dealership ?? [];
  const hasLivingParents = (fullData.relationships ?? []).some((r) => r.type === 'parent' && r.isAlive);

  // Auto-dismiss the action message toast
  useEffect(() => {
    if (!actionMessage) return;
    const t = setTimeout(onClearMessage, 3500);
    return () => clearTimeout(t);
  }, [actionMessage, onClearMessage]);

  function occupationLine(): string {
    if (job) return job.title;
    if (character.major) {
      const m = MAJORS.find((x) => x.key === character.major)?.label ?? '';
      return `Student · ${m}`;
    }
    if (character.age < 18) return 'Student';
    return 'Unemployed';
  }

  const closeSheet = () => setSheet('none');

  const mainView = (): JSX.Element => {
    if (phase === 'events' && pendingEvents[currentEventIndex]) {
      const ev = pendingEvents[currentEventIndex]!;
      return (
        <div style={{ padding: '12px 0' }}>
          <div className="lv-event-card">
            <div className="lv-event-header">
              <div className="lv-event-age">Age {ev.ageAtEvent}</div>
              <div className="lv-event-badge">
                {pendingEvents.length > 1 ? `Event ${currentEventIndex + 1} of ${pendingEvents.length}` : (STAGE_LABELS[ev.event.stages[0] ?? ''] ?? 'Event')}
              </div>
              <div className="lv-event-title">{ev.event.title}</div>
              <div className="lv-event-desc">{ev.event.description}</div>
            </div>
            <div className="lv-choices">
              {ev.event.choices.map((c) => (
                <button key={c.id} className="lv-choice-btn" disabled={isLoading} onClick={() => onMakeChoice(ev.event.id, c.id)}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (phase === 'outcome' && lastOutcome) {
      return (
        <div className="lv-outcome">
          <div className="lv-outcome-label">What Happened</div>
          <div className="lv-outcome-text">"{lastOutcome}"</div>
          <button className="lv-btn lv-btn-success" disabled={isLoading} onClick={onContinueAfterOutcome}>Continue Living →</button>
        </div>
      );
    }

    return (
      <div className="lv-cross">
        {/* Identity / nationality profile */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>
            {countryFlag} {character.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            {character.gender === 'female' ? '♀' : '♂'} {character.nationality} · Age {character.age} · {occupationLine()}
          </div>
        </div>

        {/* Central Age Up button (replaces the age card) */}
        <button
          onClick={onAgeUp}
          disabled={isLoading}
          aria-label="Age up one year"
          style={{
            width: 150, height: 150, borderRadius: '50%', border: 'none', flexShrink: 0,
            background: 'linear-gradient(145deg, var(--accent), var(--accent-2))',
            color: '#fff', boxShadow: '0 8px 28px var(--accent-glow)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 2, cursor: isLoading ? 'default' : 'pointer', opacity: isLoading ? 0.6 : 1,
            transition: 'transform 0.1s',
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.96)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <span style={{ fontSize: 34 }}>⏩</span>
          <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: '0.04em' }}>AGE UP</span>
          <span style={{ fontSize: 10, opacity: 0.85 }}>{isLoading ? '…' : '+1 year'}</span>
        </button>

        {/* Mood + stage line */}
        <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--muted)', alignItems: 'center' }}>
          <span>{moodEmoji(stats.happiness)} {STAGE_LABELS[character.lifeStage] ?? character.lifeStage}</span>
          {job && <><span>·</span><span style={{ color: 'var(--success)' }}>{fmt(job.annualSalary)}/yr</span></>}
        </div>

        {/* Stats strip (tap to expand) */}
        <div className="lv-stats-strip" onClick={() => setSheet('stats')} style={{ cursor: 'pointer' }}>
          {STAT_CONFIG.map(({ key, icon, color }) => {
            const val = stats[key as keyof typeof stats] as number;
            return (
              <div key={key} className="lv-stat-row">
                <span className="lv-stat-icon">{icon}</span>
                <div className="lv-stat-bar-wrap">
                  <div className="lv-stat-bar-fill" style={{ width: `${val}%`, background: color }} />
                </div>
                <span className="lv-stat-val">{val}</span>
              </div>
            );
          })}
          {/* Stress (inverse-coloured) */}
          <div className="lv-stat-row">
            <span className="lv-stat-icon">😰</span>
            <div className="lv-stat-bar-wrap">
              <div className="lv-stat-bar-fill" style={{ width: `${stats.stress}%`, background: stats.stress > 70 ? 'var(--danger)' : 'var(--stress)' }} />
            </div>
            <span className="lv-stat-val">{stats.stress}</span>
          </div>
          <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>Tap for details ›</div>
        </div>

        {resources.burnoutState && (
          <div style={{ width: '100%', padding: '10px 14px', background: 'rgba(240,92,92,0.12)', border: '1px solid var(--danger)', borderRadius: 12, fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>
            ⚠ Burnout — rest to recover
          </div>
        )}

        {housing.tenure === 'homeless' && (
          <div onClick={() => setSheet('shopping')} style={{ width: '100%', padding: '10px 14px', background: 'rgba(220,63,72,0.12)', border: '1px solid var(--danger)', borderRadius: 12, fontSize: 13, color: 'var(--danger)', fontWeight: 600, cursor: 'pointer' }}>
            🏚️ You are currently homeless. Tap to find a place to live.
          </div>
        )}

        {/* Recent life events */}
        <div style={{ width: '100%' }} onClick={() => setSheet('log')}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', margin: '4px 0 8px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Recent Life</span><span>View all ›</span>
          </div>
          {fullData.eventLog.slice(-3).reverse().map((e) => (
            <div key={e.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', marginBottom: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent)' }}>Age {e.ageAtEvent}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.4 }}>{e.outcomeText}</div>
            </div>
          ))}
          {fullData.eventLog.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '16px 0' }}>
              Your story begins. Tap Age Up to live your first year.
            </div>
          )}
        </div>

        {error && (
          <div style={{ width: '100%', padding: '10px 14px', background: 'rgba(240,92,92,0.1)', border: '1px solid var(--danger)', borderRadius: 12, fontSize: 13, color: 'var(--danger)' }}>
            {error}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Header: Age | Cash | Net Worth */}
      <div className="lv-header">
        <div className="lv-header-stat">
          <span className="lv-header-stat-label">Age</span>
          <span className="lv-header-stat-value age">{character.age}</span>
        </div>
        <div className="lv-header-divider" />
        <div className="lv-header-stat" onClick={() => setSheet('finance')} style={{ cursor: 'pointer' }}>
          <span className="lv-header-stat-label">Cash</span>
          <span className="lv-header-stat-value money">{fmt(finance.cash)}</span>
        </div>
        <div className="lv-header-divider" />
        <div className="lv-header-stat" onClick={() => setSheet('finance')} style={{ cursor: 'pointer' }}>
          <span className="lv-header-stat-label">Net Worth ›</span>
          <span className={`lv-header-stat-value ${netWorth >= 0 ? 'money' : ''}`} style={netWorth < 0 ? { color: 'var(--danger)' } : undefined}>{fmt(netWorth)}</span>
        </div>
      </div>

      <div className="lv-content">{mainView()}</div>

      {/* Bottom nav: Life | Education | Career | Love | Shopping */}
      <nav className="lv-bottom-nav">
        <button className={`lv-nav-tab ${sheet === 'none' ? 'active' : ''}`} onClick={() => setSheet('none')}>
          <span className="lv-nav-tab-icon">📖</span><span className="lv-nav-tab-label">Life</span>
        </button>
        <button className={`lv-nav-tab ${sheet === 'education' ? 'active' : ''}`} onClick={() => setSheet('education')}>
          <span className="lv-nav-tab-icon">🎓</span><span className="lv-nav-tab-label">Edu</span>
        </button>
        <button className={`lv-nav-tab ${sheet === 'career' ? 'active' : ''}`} onClick={() => setSheet('career')}>
          <span className="lv-nav-tab-icon">💼</span><span className="lv-nav-tab-label">Career</span>
        </button>
        <button className={`lv-nav-tab ${sheet === 'love' ? 'active' : ''}`} onClick={() => setSheet('love')}>
          <span className="lv-nav-tab-icon">❤️</span><span className="lv-nav-tab-label">Family</span>
        </button>
        <button className={`lv-nav-tab ${sheet === 'shopping' ? 'active' : ''}`} onClick={() => setSheet('shopping')}>
          <span className="lv-nav-tab-icon">🏠</span><span className="lv-nav-tab-label">Home</span>
        </button>
        <button className={`lv-nav-tab ${sheet === 'garage' ? 'active' : ''}`} onClick={() => setSheet('garage')}>
          <span className="lv-nav-tab-icon">🚗</span><span className="lv-nav-tab-label">Garage</span>
        </button>
      </nav>

      {/* Sheets */}
      <ActivitySheet isOpen={sheet === 'activity'} onClose={closeSheet} activities={availableActivities} resources={resources} onPerform={onPerformActivity} isLoading={isLoading} />
      <StatsSheet isOpen={sheet === 'stats'} onClose={closeSheet} stats={stats} domains={domains} />
      <LifeLogSheet isOpen={sheet === 'log'} onClose={closeSheet} entries={fullData.eventLog} />
      <CareerSheet isOpen={sheet === 'career'} onClose={closeSheet} job={job} eligibleJobs={eligibleJobs} isLoading={isLoading} onApply={onApplyJob} onPromote={onPromote} onWorkHard={onWorkHard} onQuit={onQuitJob} />
      <EducationSheet isOpen={sheet === 'education'} onClose={closeSheet} charState={charState} education={fullData.education} flags={flags} isLoading={isLoading} onEnroll={onEnroll} onStudy={onStudy} onAttendClass={onAttendClass} onTakeExam={onTakeExam} />
      <HousingSheet isOpen={sheet === 'shopping'} onClose={closeSheet} housing={housing} listings={listings} properties={properties}
        finance={finance} age={character.age} hasLivingParents={hasLivingParents} isLoading={isLoading}
        onRent={onRentProperty} onBuy={onBuyHome} onSellProperty={onSellProperty} onSetResidence={onSetResidence}
        onToggleRentOut={onToggleRentOut} onMoveInParents={onMoveInParents} />
      <GarageSheet isOpen={sheet === 'garage'} onClose={closeSheet} garage={garage} dealership={dealership}
        finance={finance} age={character.age} isLoading={isLoading}
        onBuy={onBuyCar} onSell={onSellVehicle} onSetPrimary={onSetPrimaryVehicle}
        onService={onServiceVehicle} onRepair={onRepairVehicle} onWash={onWashVehicle} />
      <RelationshipsSheet isOpen={sheet === 'love'} onClose={closeSheet} relationships={fullData.relationships ?? []} flags={flags}
        age={character.age} cash={finance.cash} isLoading={isLoading}
        onFindPartner={onFindPartner} onDate={onGoOnDate} onPropose={onPropose} onPlanWedding={onPlanWedding}
        onDelayWedding={onDelayWedding} onCancelEngagement={onCancelEngagement} onBreakUp={onBreakUp}
        onTryForBaby={onTryForBaby} onToggleBirthControl={onToggleBirthControl} onDivorce={onDivorce} />
      <FinanceSheet isOpen={sheet === 'finance'} onClose={closeSheet} finance={finance}
        summary={summary ?? { cash: finance.cash, propertyValue: 0, vehicleValue: 0, totalAssets: finance.cash, studentDebt: 0, mortgageDebt: 0, personalDebt: 0, totalLiabilities: finance.totalDebt, netWorth, annualIncome: finance.annualIncome, rentalIncome: 0, portfolioValue: 0 }}
        expenses={fullData.expenses ?? { housing: 0, vehicle: 0, education: 0, family: 0, lifestyle: 0, loanPayments: 0, total: finance.annualExpenses }}
        loans={fullData.loans ?? []} />

      {/* Activities quick-action button (floating, bottom-left) */}
      {phase !== 'events' && (
        <button
          onClick={() => setSheet('activity')}
          style={{
            position: 'fixed', bottom: 'calc(var(--bottom-nav-h) + var(--safe-bottom) + 14px)',
            left: 16, zIndex: 30,
            width: 60, height: 60, borderRadius: '50%', border: '1px solid var(--border)',
            background: 'var(--card)', color: 'var(--text)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          }}
        >
          <span style={{ fontSize: 18 }}>🎯</span>
          <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.05em' }}>ACTS</span>
        </button>
      )}

      {/* Action message toast */}
      {actionMessage && (
        <div className="lv-toast-wrap" onClick={onClearMessage}>
          <div className="lv-toast" style={{ borderColor: 'var(--success)' }}>
            <span className="lv-toast-icon">✅</span>
            <div><div className="lv-toast-name">{actionMessage}</div></div>
          </div>
        </div>
      )}

      {/* Achievement toasts */}
      {newAchievements.length > 0 && (
        <div className="lv-toast-wrap" onClick={onDismissAchievements}>
          {newAchievements.map((a) => (
            <div key={a.id} className="lv-toast">
              <span className="lv-toast-icon">🏆</span>
              <div>
                <div className="lv-toast-label">Achievement Unlocked</div>
                <div className="lv-toast-name">{ACHIEVEMENT_LABELS[a.achievementId] ?? a.achievementId}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden save trigger via long-term: expose through Life tab quick action */}
      <button onClick={onSave} style={{ display: 'none' }} aria-hidden />
    </>
  );
}
