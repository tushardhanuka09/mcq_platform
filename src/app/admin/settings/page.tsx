'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function AdminSettings() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (newPassword.length < 5) {
      alert("Password should be at least 5 characters long.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('admin_settings').update({ password: newPassword }).eq('id', 1);
    setLoading(false);

    if (error) {
      alert("Error updating password: " + error.message);
    } else {
      alert("Admin password successfully changed! You will use this new password on your next login.");
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <main className="container animate-fade-in" style={{ padding: '4rem 1rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '600px', display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Admin Settings</h1>
        <Link href="/admin" className="btn-outline" style={{ padding: '0.5rem 1rem' }}>
          &larr; Back to Dashboard
        </Link>
      </div>
      
      <div className="glass-card" style={{ width: '100%', maxWidth: '600px', background: 'var(--surface)' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--accent)', fontWeight: 700 }}>Change Admin Password</h2>
        
        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>New Password</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              placeholder="Enter new password" 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FAFAFA' }} 
              required 
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Confirm New Password</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              placeholder="Re-enter new password" 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FAFAFA' }} 
              required 
            />
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      </div>
    </main>
  );
}
