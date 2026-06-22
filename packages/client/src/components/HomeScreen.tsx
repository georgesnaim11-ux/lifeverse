interface Props {
  onStart: () => void;
}

export function HomeScreen({ onStart }: Props): JSX.Element {
  return (
    <div className="home">
      <div className="home-title">LifeVerse</div>
      <div className="home-tagline">Live a life. Build a legacy. No two stories are the same.</div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button className="btn btn-primary btn-lg" onClick={onStart}>
          New Life →
        </button>
      </div>
      <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 560 }}>
        {[
          { icon: '🎯', title: 'Choices Matter', desc: 'Every decision echoes across decades of life.' },
          { icon: '🧬', title: 'Personality Traits', desc: 'Your character is unique — shaped by chance and choice.' },
          { icon: '📖', title: 'Emergent Stories', desc: 'No two playthroughs ever tell the same story.' },
        ].map((f) => (
          <div key={f.title} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>{f.title}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
