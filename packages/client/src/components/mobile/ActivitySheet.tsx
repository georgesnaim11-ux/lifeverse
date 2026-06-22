import { BottomSheet } from './BottomSheet';
import type { ActivityDefinition, CharacterResources } from '@lifeverse/shared';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activities: ActivityDefinition[];
  resources: CharacterResources;
  onPerform: (id: string) => void;
  isLoading: boolean;
}

interface CategoryDef {
  id: string;
  label: string;
  icon: string;
  activityIds: string[];
}

const CATEGORIES: CategoryDef[] = [
  {
    id: 'work',
    label: 'Career & Work',
    icon: '💼',
    activityIds: ['a_work_overtime', 'ya_professional_networking', 'a_mentor_others', 'a_side_business', 'ya_side_hustle', 'ya_launch_project', 'teen_part_time_job'],
  },
  {
    id: 'edu',
    label: 'Education',
    icon: '📚',
    activityIds: ['ch_study_hard', 'teen_intensive_study', 'teen_self_study', 'ya_deep_study', 'ya_upskill_course', 'a_career_development', 'a_invest_learn', 'sr_learn_new_skill'],
  },
  {
    id: 'health',
    label: 'Health & Fitness',
    icon: '❤️',
    activityIds: ['ch_play_outside', 'teen_exercise', 'teen_competitive_sport', 'ya_gym', 'a_fitness', 'a_health_focus', 'sr_gentle_exercise', 'sr_health_maintenance'],
  },
  {
    id: 'social',
    label: 'Social Life',
    icon: '🤝',
    activityIds: ['ch_play_with_friends', 'ch_family_time', 'ch_sports_team', 'teen_social_hangout', 'teen_volunteer', 'ya_social_life', 'a_family_time', 'a_family_time_partner', 'a_community_leadership', 'sr_grandchild_time'],
  },
  {
    id: 'creative',
    label: 'Creative & Hobbies',
    icon: '🎨',
    activityIds: ['ch_read_books', 'ch_practice_hobby', 'teen_creative_project', 'teen_explore_passions', 'ya_creative_pursuit', 'ya_travel', 'a_creative_hobby', 'sr_memoir', 'sr_travel', 'sr_legacy_project'],
  },
  {
    id: 'mind',
    label: 'Mind & Wellbeing',
    icon: '🧠',
    activityIds: ['ch_rest_day', 'teen_rest', 'ya_rest', 'ya_therapy', 'a_therapy', 'a_staycation', 'a_reflection', 'sr_deep_rest', 'sr_community_wisdom'],
  },
];

const ACTIVITY_ICONS: Record<string, string> = {
  ch_study_hard: '📖', ch_play_outside: '⚽', ch_read_books: '📚', ch_practice_hobby: '🎸',
  ch_play_with_friends: '👥', ch_family_time: '🏠', ch_sports_team: '🏅', ch_rest_day: '😴',
  teen_intensive_study: '📝', teen_part_time_job: '🛒', teen_social_hangout: '🎉', teen_exercise: '🏃',
  teen_creative_project: '✏️', teen_volunteer: '🤲', teen_self_study: '💡', teen_competitive_sport: '🏆',
  teen_rest: '😴', teen_explore_passions: '🔍',
  ya_deep_study: '🎓', ya_professional_networking: '🤝', ya_gym: '🏋️', ya_social_life: '🍻',
  ya_creative_pursuit: '🖌️', ya_side_hustle: '⚡', ya_therapy: '🛋️', ya_travel: '✈️',
  ya_upskill_course: '🖥️', ya_rest: '😴', ya_mentor_relationship: '🧑‍🏫', ya_launch_project: '🚀',
  a_work_overtime: '⏱️', a_family_time: '👨‍👩‍👧', a_family_time_partner: '❤️', a_fitness: '💪',
  a_therapy: '🛋️', a_community_leadership: '🏘️', a_career_development: '📈', a_creative_hobby: '🎨',
  a_invest_learn: '💰', a_staycation: '🏖️', a_mentor_others: '👨‍🏫', a_side_business: '🏗️',
  a_health_focus: '🏥', a_reflection: '🪞',
  sr_gentle_exercise: '🚶', sr_grandchild_time: '👶', sr_memoir: '📔', sr_community_wisdom: '🗣️',
  sr_learn_new_skill: '🎯', sr_health_maintenance: '💊', sr_deep_rest: '🌙', sr_travel: '✈️',
  sr_legacy_project: '⭐',
};

function fmt(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n}`;
}

export function ActivitySheet({ isOpen, onClose, activities, resources, onPerform, isLoading }: Props): JSX.Element {
  const availableIds = new Set(activities.map((a) => a.id));
  const remaining = resources.totalTimeSlots - resources.usedTimeSlots;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Activities">
      {/* Resource status */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, padding: '4px 0' }}>
        <div className="lv-resource-chip">
          <div className="lv-resource-chip-label">⏱ Time</div>
          <div className="lv-slot-dots">
            {Array.from({ length: resources.totalTimeSlots }, (_, i) => (
              <div key={i} className={`lv-slot-dot ${i < remaining ? 'free' : 'used'}`} />
            ))}
            <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 4 }}>{remaining} left</span>
          </div>
        </div>
        <div className="lv-resource-chip" style={{ flex: 1.2 }}>
          <div className="lv-resource-chip-label">🧠 Mental</div>
          <div className="lv-resource-chip-bar">
            <div className="lv-resource-chip-fill" style={{ width: `${(resources.mentalEnergy / resources.mentalEnergyMax) * 100}%`, background: 'var(--d-academic)' }} />
          </div>
        </div>
        <div className="lv-resource-chip" style={{ flex: 1.2 }}>
          <div className="lv-resource-chip-label">💪 Physical</div>
          <div className="lv-resource-chip-bar">
            <div className="lv-resource-chip-fill" style={{ width: `${(resources.physicalEnergy / resources.physicalEnergyMax) * 100}%`, background: 'var(--d-physical)' }} />
          </div>
        </div>
      </div>

      {resources.burnoutState && (
        <div style={{ padding: '10px 14px', background: 'rgba(240,92,92,0.12)', border: '1px solid var(--danger)', borderRadius: 12, marginBottom: 12, fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>
          ⚠ Burnout active — high-effort activities locked
        </div>
      )}

      {CATEGORIES.map((cat) => {
        const catActivities = cat.activityIds
          .map((id) => activities.find((a) => a.id === id) ?? null)
          .filter(Boolean) as ActivityDefinition[];

        // Also add any available activities in this domain that aren't explicitly listed
        const extraActivities = activities.filter(
          (a) => a.domain === cat.id && !cat.activityIds.includes(a.id),
        );
        const allCatActivities = [...catActivities, ...extraActivities];

        if (allCatActivities.length === 0) return null;

        return (
          <div key={cat.id}>
            <div className="lv-cat-header">
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </div>
            {allCatActivities.map((activity) => {
              const isAvailable = availableIds.has(activity.id);
              const cantTime = activity.timeCost > remaining;
              const disabled = !isAvailable || cantTime || isLoading;

              return (
                <div
                  key={activity.id}
                  className={`lv-activity-row${disabled ? ' disabled' : ''}`}
                  onClick={disabled ? undefined : () => { onPerform(activity.id); onClose(); }}
                >
                  <span className="lv-activity-icon">{ACTIVITY_ICONS[activity.id] ?? '⚡'}</span>
                  <div className="lv-activity-info">
                    <div className="lv-activity-name">{activity.label}</div>
                    <div className="lv-activity-desc">{activity.description}</div>
                  </div>
                  <div className="lv-activity-cost">
                    <span className={`lv-cost-pill time${cantTime ? ' disabled' : ''}`}>
                      ⏱ {activity.timeCost}
                    </span>
                    {(activity.mentalCost ?? 0) > 0 && (
                      <span className="lv-cost-pill mental">🧠 {activity.mentalCost}</span>
                    )}
                    {(activity.moneyCost ?? 0) > 0 && (
                      <span className="lv-cost-pill money">{fmt(activity.moneyCost!)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {remaining === 0 && (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)', fontSize: 14 }}>
          No time slots remaining. Age up to start a new year.
        </div>
      )}
    </BottomSheet>
  );
}
