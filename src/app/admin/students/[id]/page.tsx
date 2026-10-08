'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function EditStudent() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  
  const [formData, setFormData] = useState({ full_name: '', mobile_number: '', parent_mobile: '', class_level: '11' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudent = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single();
        
      if (data) {
        setFormData({
          full_name: data.full_name,
          mobile_number: data.mobile_number,
          parent_mobile: data.parent_mobile,
          class_level: String(data.class_level)
        });
      }
      setLoading(false);
    };
    if (studentId) fetchStudent();
  }, [studentId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        mobile_number: formData.mobile_number,
        parent_mobile: formData.parent_mobile,
        class_level: parseInt(formData.class_level)
      })
      .eq('id', studentId);

    setSaving(false);
    
    if (error) {
      setError(error.message);
    } else {
      alert('Student updated successfully!');
      router.push('/admin/students');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you absolutely sure you want to completely delete this student? All their tests and scores will be erased forever.')) return;
    
    setSaving(true);
    // Delete the student. Note: If you want to also cascade delete test_attempts, ensure Supabase has CASCADE on the foreign key, or delete them manually here.
    const { error } = await supabase.from('profiles').delete().eq('id', studentId);
    
    if (error) {
      alert('Error deleting student: ' + error.message);
      setSaving(false);
    } else {
      alert('Student deleted successfully!');
      router.push('/admin/students');
    }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading student data...</div>;

  return (
    <main className="container animate-fade-in" style={{ padding: '4rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
        <Link href="/admin/students" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-block', marginBottom: '2rem' }}>
          &larr; Back to Manage Students
        </Link>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', marginBottom: '2rem', fontWeight: 800 }}>Edit Student</h1>
        
        <div className="glass-card" style={{ padding: '2rem', background: 'var(--surface)' }}>
          {error && <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 600 }}>{error}</div>}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontWeight: 600 }}>Full Name</label>
              <input type="text" name="full_name" required onChange={handleChange} value={formData.full_name} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FAFAFA', color: '#111' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontWeight: 600 }}>Class Level</label>
              <select name="class_level" required onChange={handleChange} value={formData.class_level} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FAFAFA', color: '#111' }}>
                <option value="9">Class 9</option>
                <option value="10">Class 10</option>
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontWeight: 600 }}>Student Mobile Number</label>
              <input type="tel" name="mobile_number" required onChange={handleChange} value={formData.mobile_number} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FAFAFA', color: '#111' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontWeight: 600 }}>Parent's Mobile Number</label>
              <input type="tel" name="parent_mobile" required onChange={handleChange} value={formData.parent_mobile} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FAFAFA', color: '#111' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" disabled={saving} style={{ width: '100%' }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={handleDelete} disabled={saving} style={{ width: '100%', padding: '1rem', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                Delete User
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
