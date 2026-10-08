import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <main className="container animate-fade-in" style={{ padding: '5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ fontSize: '3rem', color: 'var(--text-main)', marginBottom: '3rem' }}>Admin Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', width: '100%', maxWidth: '1000px' }}>
        <Link href="/admin/upload" className="glass-card" style={{ display: 'block', textAlign: 'center', background: 'var(--surface)' }}>
          <h2 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '1.5rem' }}>📄 Upload Question Paper</h2>
          <p style={{ color: 'var(--text-muted)' }}>Use Gemini AI to extract 10 MCQs from a PDF/Image.</p>
        </Link>

        <Link href="/admin/tests" className="glass-card" style={{ display: 'block', textAlign: 'center', background: 'var(--surface)' }}>
          <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.5rem' }}>📂 Manage Tests</h2>
          <p style={{ color: 'var(--text-muted)' }}>View all published tests by Class and Chapter.</p>
        </Link>
        
        <Link href="/admin/register" className="glass-card" style={{ display: 'block', textAlign: 'center', background: 'var(--surface)' }}>
          <h2 style={{ color: '#059669', marginBottom: '1rem', fontSize: '1.5rem' }}>👤 Register Student</h2>
          <p style={{ color: 'var(--text-muted)' }}>Manually add a new student to the database.</p>
        </Link>
        
        <Link href="/admin/students" className="glass-card" style={{ display: 'block', textAlign: 'center', background: 'var(--surface)' }}>
          <h2 style={{ color: '#9333EA', marginBottom: '1rem', fontSize: '1.5rem' }}>👥 Manage Students</h2>
          <p style={{ color: 'var(--text-muted)' }}>View registered users and edit their details.</p>
        </Link>
      </div>
    </main>
  );
}
