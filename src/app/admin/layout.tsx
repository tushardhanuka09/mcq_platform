'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Explicitly NOT checking localStorage here as per user request.
    // The admin must enter the password every time they open or refresh the page.
    setLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Fetch password from database
    const { data, error } = await supabase.from('admin_settings').select('password').eq('id', 1).single();
    
    // Fallback if table doesn't exist yet, allow 'sumit123'
    const actualPassword = data ? data.password : 'sumit123';
    
    if (password === actualPassword || (password === 'sumit123' && error)) { 
      setIsAuthenticated(true);
    } else {
      alert('Incorrect Admin Password!');
    }
  };

  if (loading) return <div style={{ minHeight: '100vh', padding: '3rem', textAlign: 'center' }}>Loading...</div>;

  if (!isAuthenticated) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        <Link href="/" style={{ marginBottom: '2rem', color: 'var(--text-muted)', textDecoration: 'underline' }}>
          &larr; Back to Home
        </Link>

        <form onSubmit={handleLogin} className="glass-card animate-fade-in" style={{ padding: '3rem', width: '100%', maxWidth: '400px', background: 'var(--surface)' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center', color: 'var(--text-main)', fontWeight: 800 }}>Admin Login</h2>
          <input 
            type="password" 
            placeholder="Enter Admin Password (e.g. sumit123)" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FAFAFA' }}
          />
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>Login</button>
        </form>
      </main>
    );
  }

  return (
    <>
      <nav style={{ background: 'var(--surface)', padding: '1rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)' }}>Sumit Sir - Admin</div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/admin/settings" className="btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            ⚙️ Settings
          </Link>
          <button 
            onClick={() => { setIsAuthenticated(false); setPassword(''); }} 
            className="btn-outline" 
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
          >
            Logout
          </button>
        </div>
      </nav>
      {children}
    </>
  );
}
