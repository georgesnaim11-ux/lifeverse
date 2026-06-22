import { BottomSheet } from './BottomSheet';
import type { JobState, JobEligibility } from '@lifeverse/shared';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  job: JobState | null;
  eligibleJobs: JobEligibility[];
  isLoading: boolean;
  onApply: (jobId: string) => void;
  onPromote: () => void;
  onWorkHard: () => void;
  onQuit: () => void;
}

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  no_education: { label: 'No Education Required', icon: '🧹' },
  trade:        { label: 'Trade Careers', icon: '🔧' },
  university:   { label: 'University Careers', icon: '🎓' },
  elite:        { label: 'Elite Careers', icon: '👑' },
};

const CATEGORY_ORDER = ['no_education', 'trade', 'university', 'elite'];

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
}

export function CareerSheet({
  isOpen, onClose, job, eligibleJobs, isLoading,
  onApply, onPromote, onWorkHard, onQuit,
}: Props): JSX.Element {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Career">
      {job ? (
        <div style={{ background: 'var(--card)', border: '1px solid var(--accent-dim)', borderRadius: 14, padding: 16, marginBottom: 6, marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 17, fontWeight: 800 }}>{job.title}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--success)' }}>{fmt(job.annualSalary)}/yr</span>
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--muted)', marginTop: 6, flexWrap: 'wrap' }}>
            <span>Level {job.level}</span>
            <span>·</span>
            <span>{job.yearsInRole} yr{job.yearsInRole !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>Satisfaction {job.satisfaction}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="lv-btn lv-btn-primary" style={{ flex: 1, padding: '11px 0', fontSize: 13 }} disabled={isLoading} onClick={onWorkHard}>Work Hard</button>
            <button className="lv-btn lv-btn-success" style={{ flex: 1, padding: '11px 0', fontSize: 13 }} disabled={isLoading} onClick={onPromote}>Ask Promotion</button>
          </div>
          <button className="lv-btn" style={{ marginTop: 8, padding: '10px 0', fontSize: 13, background: 'var(--card-hover)', color: 'var(--danger)', border: '1px solid var(--danger)' }} disabled={isLoading} onClick={onQuit}>Quit Job</button>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 0 4px' }}>
          You're unemployed. Browse jobs below and apply to any you're eligible for.
        </p>
      )}

      {CATEGORY_ORDER.map((cat) => {
        const jobsInCat = eligibleJobs.filter((e) => e.job.category === cat);
        if (jobsInCat.length === 0) return null;
        const meta = CATEGORY_META[cat]!;
        return (
          <div key={cat}>
            <div className="lv-cat-header"><span>{meta.icon}</span><span>{meta.label}</span></div>
            {jobsInCat.map(({ job: j, eligible, reasons }) => (
              <div key={j.id} className={`lv-activity-row${!eligible ? ' disabled' : ''}`}
                onClick={eligible && !isLoading ? () => { onApply(j.id); onClose(); } : undefined}>
                <div className="lv-activity-info">
                  <div className="lv-activity-name">{j.title}</div>
                  <div className="lv-activity-desc" style={{ whiteSpace: 'normal' }}>
                    {eligible ? j.blurb : reasons[0]}
                  </div>
                </div>
                <div className="lv-activity-cost">
                  <span className="lv-cost-pill money">{fmt(j.baseSalary)}</span>
                  {eligible
                    ? <span style={{ fontSize: 10, color: 'var(--success)', fontWeight: 700 }}>Apply ›</span>
                    : <span style={{ fontSize: 14 }}>🔒</span>}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </BottomSheet>
  );
}
