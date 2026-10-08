'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function AdminRegisterStudent() {
  const [formData, setFormData] = useState({ fullName: '', mobile: '', parentMobile: '', classLevel: '11' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register student');
      
      setSuccess(`${formData.fullName} has been registered successfully!`);
      setFormData({ fullName: '', mobile: '', parentMobile: '', classLevel: '11' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container animate-fade-in" style={{ padding: '4rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
        <Link href="/admin" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-block', marginBottom: '2rem' }}>
          &larr; Back to Admin Dashboard
        </Link>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', marginBottom: '2rem', fontWeight: 800 }}>Register Student</h1>
        
        <div className="glass-card" style={{ padding: '2rem', background: 'var(--surface)' }}>
          {error && <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 600 }}>{error}</div>}
          {success && <div style={{ background: '#D1FAE5', color: '#059669', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 600 }}>{success}</div>}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontWeight: 600 }}>Full Name</label>
              <input type="text" name="fullName" required onChange={handleChange} value={formData.fullName} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FAFAFA', color: '#111' }} placeholder="Student&apos;s Name" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontWeight: 600 }}>Class Level</label>
              <select name="classLevel" required onChange={handleChange} value={formData.classLevel} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FAFAFA', color: '#111' }}>
                <option value="9">Class 9</option>
                <option value="10">Class 10</option>
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontWeight: 600 }}>Student Mobile Number</label>
              <input type="tel" name="mobile" required onChange={handleChange} value={formData.mobile} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FAFAFA', color: '#111' }} placeholder="10-digit number (Used for Login)" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontWeight: 600 }}>Parent&apos;s Mobile Number</label>
              <input type="tel" name="parentMobile" required onChange={handleChange} value={formData.parentMobile} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FAFAFA', color: '#111' }} placeholder="10-digit number (For WhatsApp Scorecards)" />
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem', width: '100%' }}>
              {loading ? 'Registering...' : 'Register Student'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
