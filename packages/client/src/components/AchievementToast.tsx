import { useEffect } from 'react';
import type { EarnedAchievement } from '@lifeverse/shared';

const ACHIEVEMENT_LABELS: Record<string, string> = {
  first_step: 'First Step', teenager: 'Teenager', adult: 'Adulthood',
  senior: 'Senior Years', elder: 'Elder', scholar: 'Scholar', graduate: 'Graduate',
  first_job: 'First Job', married: 'Married', parent: 'Parent', homeowner: 'Homeowner',
  retired: 'Retired', millionaire: 'Millionaire', promotion: 'Promoted', executive: 'Executive',
  social_butterfly: 'Social Butterfly', well_rounded: 'Well Rounded',
  iron_discipline: 'Iron Discipline', mastermind: 'Mastermind', beloved: 'Beloved',
};

interface Props {
  achievements: EarnedAchievement[];
  onDismiss: () => void;
}

export function AchievementToast({ achievements, onDismiss }: Props): JSX.Element | null {
  useEffect(() => {
    if (achievements.length === 0) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [achievements, onDismiss]);

  if (achievements.length === 0) return null;

  return (
    <div className="achievement-overlay">
      {achievements.map((a) => (
        <div key={a.id} className="achievement-toast" onClick={onDismiss}>
          <div className="achievement-toast-label">Achievement Unlocked</div>
          <div className="achievement-toast-name">
            {ACHIEVEMENT_LABELS[a.achievementId] ?? a.achievementId}
          </div>
        </div>
      ))}
    </div>
  );
}
