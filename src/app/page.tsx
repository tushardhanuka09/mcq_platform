import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Background Image Overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1, opacity: 0.05, backgroundImage: 'url(/purnimaclasses.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
      
      <div className="container animate-fade-in" style={{ paddingTop: '5rem', paddingBottom: '5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <div style={{ marginBottom: '2rem', display: 'inline-block' }}>
          <img src="/logo.jpg" alt="Purnima Classes" style={{ maxWidth: '100%', height: 'auto', maxHeight: '200px', mixBlendMode: 'multiply' }} />
        </div>

        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--accent)', marginBottom: '1.5rem', fontStyle: 'italic', fontWeight: 700 }}>
            &quot;Main yaad rahu ya nahi meri baate yaad reh jayegi...&quot;
          </h2>

          <h1 style={{ fontSize: '4.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-main)', lineHeight: 1.1 }}>
            Level Up Your Scores.
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '3rem', lineHeight: 1.6 }}>
            The ultimate testing arena for Class 9-12 <strong>Sumitians</strong>. Take on timed challenges, climb the leaderboard, and flex your knowledge. Taiyaari kitni solid hai, abhi check karo!
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" className="btn-primary">
              Sumitian Login
            </Link>
            <Link href="/admin" className="btn-outline">
              Admin Portal
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', width: '100%', marginTop: '5rem' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent)' }}>🔥 Asli Sprints</h3>
            <p style={{ color: 'var(--text-muted)' }}>Beat the clock in intense 15-minute challenges. Ek hi chance milega, so make it count.</p>
          </div>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent)' }}>🏆 Sumitian Leaderboards</h3>
            <p style={{ color: 'var(--text-muted)' }}>Rank up against other Sumitians class-by-class. Top rank laane ka time aa gaya hai.</p>
          </div>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent)' }}>📱 Instant WhatsApp Score</h3>
            <p style={{ color: 'var(--text-muted)' }}>Test khatam hote hi, scorecard seedha parents ke WhatsApp par!</p>
          </div>
        </div>
      </div>
    </main>
  );
}
