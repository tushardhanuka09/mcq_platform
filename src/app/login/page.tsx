'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, mobile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to login. Please contact Sumit Sir if you are not registered.');
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1, opacity: 0.05, backgroundImage: 'url(/purnimaclasses.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
      
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '450px', padding: '3rem', margin: '2rem', background: 'var(--surface)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Link href="/">
            <h2 style={{ fontSize: '2rem', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 800 }}>Sumitian Portal</h2>
          </Link>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Student Login</p>
        </div>

        {error && <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 600 }}>{error}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontWeight: 600 }}>Full Name</label>
            <input 
              type="text" 
              required 
              onChange={(e) => setFullName(e.target.value)} 
              value={fullName} 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FAFAFA', color: '#111' }} 
              placeholder="Enter your registered name" 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontWeight: 600 }}>Mobile Number</label>
            <input 
              type="tel" 
              required 
              onChange={(e) => setMobile(e.target.value)} 
              value={mobile} 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FAFAFA', color: '#111' }} 
              placeholder="Enter your 10-digit number" 
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem', width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
            {loading ? 'Logging in...' : 'Enter Arena 🚀'}
          </button>
        </form>
      </div>
    </main>
  );
}
