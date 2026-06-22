import { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { MAJORS } from '@lifeverse/shared';
import type { CharacterState, Education } from '@lifeverse/shared';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  charState: CharacterState;
  education: Education[];
  flags: Record<string, boolean>;
  isLoading: boolean;
  onEnroll: (level: 'trade' | 'university' | 'graduate', major?: string) => void;
  onStudy: () => void;
  onAttendClass: () => void;
  onTakeExam: () => void;
}

const EDU_LABELS: Record<string, string> = {
  elementary: 'Elementary School', middle: 'Middle School', high: 'High School',
  trade: 'Trade School', university: 'University', graduate: 'Graduate School',
};

export function EducationSheet({
  isOpen, onClose, charState, education, flags, isLoading,
  onEnroll, onStudy, onAttendClass, onTakeExam,
}: Props): JSX.Element {
  const [picking, setPicking] = useState(false);
  const { character } = charState;

  const hasHighSchool = flags['hasHighSchool'];
  const inUniversity  = flags['inUniversity'];
  const inHigherEd    = flags['inHigherEd'];
  const hasDegree     = flags['hasDegree'];
  const hasTrade      = flags['hasTradeDegree'];
  const isStudent = inUniversity || inHigherEd || (character.age < 18 && character.age >= 5);
  const canEnroll = character.age >= 18 && hasHighSchool && !inUniversity && !inHigherEd;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Education">
      {/* Current status */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginTop: 4, marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Currently</div>
        <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>
          {inUniversity ? 'University Student'
            : inHigherEd ? 'In Higher Education'
            : character.age < 18 ? 'In School'
            : hasDegree ? 'Graduate' : hasTrade ? 'Trade Certified' : 'Not Studying'}
        </div>
        {character.major && (
          <div style={{ fontSize: 13, color: 'var(--accent)', marginTop: 2 }}>
            Major: {MAJORS.find((m) => m.key === character.major)?.label ?? character.major}
          </div>
        )}
      </div>

      {/* Study actions for students */}
      {isStudent && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button className="lv-btn lv-btn-primary" style={{ flex: 1, padding: '12px 0', fontSize: 13 }} disabled={isLoading} onClick={onStudy}>📖 Study</button>
          <button className="lv-btn lv-btn-primary" style={{ flex: 1, padding: '12px 0', fontSize: 13 }} disabled={isLoading} onClick={onAttendClass}>🏫 Class</button>
          <button className="lv-btn lv-btn-primary" style={{ flex: 1, padding: '12px 0', fontSize: 13 }} disabled={isLoading} onClick={onTakeExam}>📝 Exam</button>
        </div>
      )}

      {/* Enrollment options */}
      {canEnroll && !picking && (
        <>
          <div className="lv-cat-header"><span>🎓</span><span>Enroll in Higher Education</span></div>
          {!hasTrade && (
            <div className="lv-activity-row" onClick={isLoading ? undefined : () => { onEnroll('trade'); onClose(); }}>
              <span className="lv-activity-icon">🔧</span>
              <div className="lv-activity-info">
                <div className="lv-activity-name">Trade School</div>
                <div className="lv-activity-desc">2 years · unlocks skilled trade careers</div>
              </div>
              <span style={{ fontSize: 10, color: 'var(--success)', fontWeight: 700 }}>Enroll ›</span>
            </div>
          )}
          {!hasDegree && (
            <div className="lv-activity-row" onClick={() => setPicking(true)}>
              <span className="lv-activity-icon">🎓</span>
              <div className="lv-activity-info">
                <div className="lv-activity-name">University</div>
                <div className="lv-activity-desc">4 years · choose a major · unlocks professional careers</div>
              </div>
              <span style={{ fontSize: 10, color: 'var(--success)', fontWeight: 700 }}>Choose ›</span>
            </div>
          )}
          {hasDegree && !flags['hasGraduateDegree'] && (
            <div className="lv-activity-row" onClick={isLoading ? undefined : () => { onEnroll('graduate'); onClose(); }}>
              <span className="lv-activity-icon">📜</span>
              <div className="lv-activity-info">
                <div className="lv-activity-name">Graduate School</div>
                <div className="lv-activity-desc">3 years · advanced specialization</div>
              </div>
              <span style={{ fontSize: 10, color: 'var(--success)', fontWeight: 700 }}>Enroll ›</span>
            </div>
          )}
        </>
      )}

      {/* Major picker */}
      {canEnroll && picking && (
        <>
          <div className="lv-cat-header"><span>🎓</span><span>Choose Your Major</span></div>
          {MAJORS.map((m) => (
            <div key={m.key} className="lv-activity-row" onClick={isLoading ? undefined : () => { onEnroll('university', m.key); onClose(); setPicking(false); }}>
              <div className="lv-activity-info">
                <div className="lv-activity-name">{m.label}</div>
                <div className="lv-activity-desc" style={{ whiteSpace: 'normal' }}>{m.description}</div>
              </div>
              <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700 }}>INT {m.difficulty}</span>
            </div>
          ))}
        </>
      )}

      {!canEnroll && character.age < 18 && (
        <p style={{ fontSize: 13, color: 'var(--muted)', padding: '4px 0' }}>
          Finish school first. Higher education opens up at 18.
        </p>
      )}

      {/* History */}
      {education.length > 0 && (
        <>
          <div className="lv-cat-header"><span>📚</span><span>History</span></div>
          {education.slice().reverse().map((e) => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 2px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{EDU_LABELS[e.level] ?? e.level}</span>
              <span style={{ fontSize: 12, color: e.completed ? 'var(--success)' : 'var(--warning)', fontWeight: 700 }}>
                {e.completed ? `✓ ${e.gpa ? `GPA ${e.gpa.toFixed(1)}` : 'Done'}` : 'In Progress'}
              </span>
            </div>
          ))}
        </>
      )}
    </BottomSheet>
  );
}
